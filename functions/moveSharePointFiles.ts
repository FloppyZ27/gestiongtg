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

    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const siteId = Deno.env.get('SHAREPOINT_SITE_ID');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    // Get access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        })
      }
    );

    const { access_token } = await tokenResponse.json();

    // List files in source folder
    const listUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${sourceFolderPath}:/children`;
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

    // Get destination folder ID
    const destUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drives/${driveId}/root:/${destinationFolderPath}`;
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