import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const TENANT_ID = Deno.env.get("MICROSOFT_TENANT_ID");
const CLIENT_ID = Deno.env.get("MICROSOFT_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("MICROSOFT_CLIENT_SECRET");
const SITE_ID = Deno.env.get("SHAREPOINT_SITE_ID");
const DRIVE_ID = Deno.env.get("SHAREPOINT_DRIVE_ID");

async function getAccessToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('grant_type', 'client_credentials');

  console.log("Fetching token for tenant:", TENANT_ID);
  console.log("Using Drive ID:", DRIVE_ID);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
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