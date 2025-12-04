import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// HARDCODED VALUES FOR TESTING - v3
const TENANT_ID = "31adb05b-e471-4daf-8831-4d46014be9b8";
const CLIENT_ID = "1291551b-48b1-4e33-beff-d3cb8644a880";
const CLIENT_SECRET = "0588Q~ROtUMc3N.AG0y36wpI1FrckbQ1IbekwddN";
const SITE_ID = "girardtremblaygilbert365.sharepoint.com,df242f6d-91a5-4248-a3a4-41b7e44073a2,64921d7b-e2e8-4c9e-bd7e-311465aaf30d";
const DRIVE_ID = "b!bS8k36WRSEKjpEG35EBzonsdkmTo4p5MvX4xFGWq8w1fkwthDsxdQL8_MK0t_B3b";

async function getAccessToken() {
  // Debug v4 - Test avec body string direct
  console.log("=== SHAREPOINT AUTH DEBUG v4 ===");
  
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  
  // Construire le body exactement comme PowerShell le ferait
  const bodyString = `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`;
  
  console.log("Token URL:", tokenUrl);
  console.log("Body (sans secret):", `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=***&scope=https://graph.microsoft.com/.default`);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: bodyString
  });

  const data = await response.json();
  console.log("Token response status:", response.status);
  
  if (!response.ok) {
    console.error("Token error:", JSON.stringify(data));
    throw new Error(`Token error: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';
    const folderId = body.folderId || 'root';
    const fileId = body.fileId;

    const accessToken = await getAccessToken();

    if (action === 'list') {
      // Lister les fichiers d'un dossier
      const endpoint = folderId === 'root'
        ? `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`
        : `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${folderId}/children`;

      console.log("Fetching files from:", endpoint);

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const data = await response.json();
      console.log("Files response status:", response.status);
      
      if (!response.ok) {
        console.error("Files error:", JSON.stringify(data));
        throw new Error(data.error?.message || 'Erreur lors de la récupération des fichiers');
      }

      return Response.json({ 
        files: data.value.map(item => ({
          id: item.id,
          name: item.name,
          type: item.folder ? 'folder' : 'file',
          size: item.size,
          mimeType: item.file?.mimeType,
          lastModified: item.lastModifiedDateTime,
          webUrl: item.webUrl,
          downloadUrl: item['@microsoft.graph.downloadUrl']
        }))
      });
    }

    if (action === 'getDownloadUrl') {
      // Obtenir l'URL de téléchargement d'un fichier
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur lors de la récupération du fichier');
      }

      return Response.json({ 
        downloadUrl: data['@microsoft.graph.downloadUrl'],
        webUrl: data.webUrl,
        name: data.name,
        mimeType: data.file?.mimeType
      });
    }

    if (action === 'preview') {
      // Obtenir un lien de prévisualisation
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}/preview`,
        { 
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        }
      );

      const data = await response.json();
      if (!response.ok) {
        // Fallback to webUrl if preview not available
        const itemResponse = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/items/${fileId}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        const itemData = await itemResponse.json();
        return Response.json({ 
          previewUrl: itemData.webUrl,
          fallback: true
        });
      }

      return Response.json({ previewUrl: data.getUrl });
    }

    if (action === 'search') {
      const query = body.query || '';
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/search(q='${encodeURIComponent(query)}')`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erreur lors de la recherche');
      }

      return Response.json({ 
        files: data.value.map(item => ({
          id: item.id,
          name: item.name,
          type: item.folder ? 'folder' : 'file',
          size: item.size,
          mimeType: item.file?.mimeType,
          lastModified: item.lastModifiedDateTime,
          webUrl: item.webUrl,
          downloadUrl: item['@microsoft.graph.downloadUrl']
        }))
      });
    }

    return Response.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});