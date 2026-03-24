import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log(`[MOVE] ===== FONCTION APPELÉE =====`);
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.log(`[MOVE] Erreur: utilisateur non authentifié`);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceFolderPath, destinationFolderPath } = await req.json();

    console.log(`[MOVE] Utilisateur: ${user.email}`);
    console.log(`[MOVE] Début du transfert`);
    console.log(`[MOVE] Source: ${sourceFolderPath}`);
    console.log(`[MOVE] Destination: ${destinationFolderPath}`);

    // Utiliser les valeurs en dur comme dans sharepoint.js
    const tenantId = "31adb05b-e471-4daf-8831-4d46014be9b8";
    const clientId = "1291551b-48b1-4e33-beff-d3cb64fa888a";
    const clientSecret = "vTQ8Q~uhNn1dsGeHfGr3VZvLnQmkYZQ54~gcXcim";
    const siteId = "girardtremblaygilbert365.sharepoint.com,df242f6d-91a5-4248-a3a4-41b7e44073a2,64921d7b-e2e8-4c9e-bd7e-311465aaf30d";
    const driveId = "b!bS8k36WRSEKjpEG35EBzonsdkmTo4p5MvX4xFGWq8w1fkwthDsxdQL8_MK0t_B3b";

    // Get access token - comme dans sharepoint.js
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
      console.error(`[MOVE] Erreur obtention token:`, JSON.stringify(tokenData));
      return Response.json({ 
        success: false, 
        error: `Erreur d'authentification: ${tokenData.error_description || tokenData.error}`,
        movedCount: 0 
      }, { status: 500 });
    }

    const access_token = tokenData.access_token;
    
    if (!access_token) {
      console.error(`[MOVE] Token manquant dans la réponse:`, tokenData);
      return Response.json({ 
        success: false, 
        error: 'Token d\'accès manquant',
        movedCount: 0 
      }, { status: 500 });
    }

    // List files in source folder - encoder le chemin correctement
    const encodedSourcePath = encodeURIComponent(sourceFolderPath).replace(/%2F/g, '/');
    const listUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedSourcePath}:/children`;
    console.log(`[MOVE] Liste des fichiers: ${listUrl}`);
    
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error(`[MOVE] Erreur liste fichiers: ${errorText}`);
      return Response.json({ 
        success: false, 
        error: `Dossier source introuvable: ${sourceFolderPath}`,
        movedCount: 0 
      });
    }

    const listData = await listResponse.json();
    const allItems = listData.value || [];
    
    // Filtrer pour garder seulement les fichiers (exclure les dossiers)
    const files = allItems.filter(item => !item.folder);

    console.log(`[MOVE] ${files.length} fichier(s) trouvé(s) sur ${allItems.length} élément(s)`);
    files.forEach(f => console.log(`[MOVE] - ${f.name}`));

    if (files.length === 0) {
      return Response.json({ 
        success: true, 
        movedCount: 0,
        message: 'Aucun fichier à déplacer'
      });
    }

    let movedCount = 0;
    const errors = [];

    // Get destination folder ID - encoder le chemin correctement
    const encodedDestPath = encodeURIComponent(destinationFolderPath).replace(/%2F/g, '/');
    const destUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedDestPath}`;
    const destResponse = await fetch(destUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!destResponse.ok) {
      console.error(`[MOVE] Dossier de destination introuvable: ${destinationFolderPath}`);
      return Response.json({ 
        success: false, 
        error: `Dossier de destination introuvable: ${destinationFolderPath}`,
        movedCount: 0 
      });
    }

    const destData = await destResponse.json();
    const destFolderId = destData.id;
    console.log(`[MOVE] Dossier de destination trouvé: ${destFolderId}`);

    // Move each file
    for (const file of files) {
      try {
        console.log(`[MOVE] Déplacement: ${file.name}`);

        const moveUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/items/${file.id}`;
        
        const moveBody = {
          parentReference: {
            id: destFolderId
          },
          name: file.name
        };

        const moveResponse = await fetch(moveUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(moveBody)
        });

        if (moveResponse.ok) {
          console.log(`[MOVE] ✓ ${file.name} déplacé avec succès`);
          movedCount++;
        } else {
          const errorText = await moveResponse.text();
          console.error(`[MOVE] ✗ Erreur déplacement ${file.name}:`, errorText);
          errors.push(`${file.name}: ${errorText}`);
        }
      } catch (fileError) {
        console.error(`[MOVE] ✗ Erreur fichier ${file.name}:`, fileError);
        errors.push(`${file.name}: ${fileError.message}`);
      }
    }

    console.log(`[MOVE] Terminé: ${movedCount}/${files.length} fichier(s) déplacé(s)`);

    return Response.json({
      success: movedCount > 0,
      movedCount,
      totalFiles: files.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `${movedCount} fichier(s) déplacé(s) avec succès`
    });

  } catch (error) {
    console.error('[MOVE] Erreur:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      movedCount: 0
    }, { status: 500 });
  }
});