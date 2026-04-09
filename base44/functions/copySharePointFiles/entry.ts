import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log(`[COPY] ===== FONCTION APPELÉE =====`);
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.log(`[COPY] Erreur: utilisateur non authentifié`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceFolderPath, destinationFolderPath } = await req.json();

    console.log(`[COPY] Utilisateur: ${user.email}`);
    console.log(`[COPY] Source: ${sourceFolderPath}`);
    console.log(`[COPY] Destination: ${destinationFolderPath}`);

    const tenantId = "31adb05b-e471-4daf-8831-4d46014be9b8";
    const clientId = "1291551b-48b1-4e33-beff-d3cb64fa888a";
    const clientSecret = "vTQ8Q~uhNn1dsGeHfGr3VZvLnQmkYZQ54~gcXcim";
    const siteId = "girardtremblaygilbert365.sharepoint.com,df242f6d-91a5-4248-a3a4-41b7e44073a2,64921d7b-e2e8-4c9e-bd7e-311465aaf30d";
    const driveId = "b!bS8k36WRSEKjpEG35EBzonsdkmTo4p5MvX4xFGWq8w1fkwthDsxdQL8_MK0t_B3b";

    const bodyString = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`;
    
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: bodyString
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error(`[COPY] Erreur obtention token:`, JSON.stringify(tokenData));
      return Response.json({ 
        success: false, 
        error: `Erreur d'authentification: ${tokenData.error_description || tokenData.error}`,
        copiedCount: 0 
      }, { status: 500 });
    }

    const access_token = tokenData.access_token;
    
    if (!access_token) {
      console.error(`[COPY] Token manquant dans la réponse:`, tokenData);
      return Response.json({ 
        success: false, 
        error: 'Token d\'accès manquant',
        copiedCount: 0 
      }, { status: 500 });
    }

    // Liste les fichiers du dossier source
    const encodedSourcePath = encodeURIComponent(sourceFolderPath).replace(/%2F/g, '/');
    const listUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedSourcePath}:/children`;
    console.log(`[COPY] Récupération fichiers: ${listUrl}`);
    
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error(`[COPY] Erreur liste fichiers: ${errorText}`);
      return Response.json({ 
        success: false, 
        error: `Dossier source introuvable: ${sourceFolderPath}`,
        copiedCount: 0 
      });
    }

    const listData = await listResponse.json();
    const allItems = listData.value || [];
    const files = allItems.filter(item => !item.folder);

    console.log(`[COPY] ${files.length} fichier(s) trouvé(s)`);
    files.forEach(f => console.log(`[COPY] - ${f.name}`));

    if (files.length === 0) {
      return Response.json({ 
        success: true, 
        copiedCount: 0,
        message: 'Aucun fichier à copier'
      });
    }

    // Vérifie que le dossier de destination existe
    const encodedDestPath = encodeURIComponent(destinationFolderPath).replace(/%2F/g, '/');
    const destUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedDestPath}`;
    const destResponse = await fetch(destUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!destResponse.ok) {
      console.error(`[COPY] Dossier de destination introuvable: ${destinationFolderPath}`);
      return Response.json({ 
        success: false, 
        error: `Dossier de destination introuvable: ${destinationFolderPath}`,
        copiedCount: 0 
      });
    }

    const destData = await destResponse.json();
    const destFolderId = destData.id;
    console.log(`[COPY] Dossier destination: ${destFolderId}`);

    let copiedCount = 0;
    const errors = [];

    // Copie chaque fichier
    for (const file of files) {
      try {
        console.log(`[COPY] Copie: ${file.name}`);

        const copyUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}/copy`;
        
        const copyBody = {
          parentReference: {
            id: destFolderId
          },
          name: file.name
        };

        const copyResponse = await fetch(copyUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(copyBody)
        });

        if (copyResponse.ok || copyResponse.status === 202) {
          // 202 = copie lancée en arrière-plan
          if (copyResponse.status === 202) {
            const locationHeader = copyResponse.headers.get('Location');
            if (locationHeader) {
              console.log(`[COPY] ${file.name} - en attente de completion...`);
              // Attendre la fin de la copie (polling)
              let copyStatus = 'inProgress';
              let attempts = 0;
              const maxAttempts = 60; // max 5 min
              
              while (copyStatus === 'inProgress' && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                const statusResponse = await fetch(locationHeader, {
                  headers: { 'Authorization': `Bearer ${access_token}` }
                });
                
                if (statusResponse.ok) {
                  const statusData = await statusResponse.json();
                  copyStatus = statusData.status;
                  console.log(`[COPY] ${file.name} - status: ${copyStatus}`);
                  attempts++;
                }
              }
              console.log(`[COPY] ✓ ${file.name} copié (${copyStatus})`);
            } else {
              console.log(`[COPY] ✓ ${file.name} copié (202)`);
            }
          } else {
            console.log(`[COPY] ✓ ${file.name} copié (200)`);
          }
          copiedCount++;
        } else {
          const errorText = await copyResponse.text();
          console.error(`[COPY] ✗ Erreur copie ${file.name}:`, errorText);
          errors.push(`${file.name}: ${errorText}`);
        }
      } catch (fileError) {
        console.error(`[COPY] ✗ Erreur fichier ${file.name}:`, fileError);
        errors.push(`${file.name}: ${fileError.message}`);
      }
    }

    console.log(`[COPY] Terminé: ${copiedCount}/${files.length} fichier(s) copiés`);

    return Response.json({
      success: copiedCount > 0,
      copiedCount,
      totalFiles: files.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${copiedCount} fichier(s) copiés`
    });

  } catch (error) {
    console.error('[COPY] Erreur:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      copiedCount: 0 
    }, { status: 500 });
  }
});