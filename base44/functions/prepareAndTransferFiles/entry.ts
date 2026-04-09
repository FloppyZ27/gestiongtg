import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceFolderPath, destinationFolderPath } = await req.json();
    
    if (!sourceFolderPath || !destinationFolderPath) {
      return Response.json({ error: 'Missing paths' }, { status: 400 });
    }

    console.log('[PREPARE] Début du traitement');
    console.log('[PREPARE] Source:', sourceFolderPath);
    console.log('[PREPARE] Destination:', destinationFolderPath);

    // Obtenir le token d'accès
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    if (!tenantId || !clientId || !clientSecret || !driveId) {
      return Response.json({ error: 'Missing SharePoint configuration' }, { status: 500 });
    }

    // Obtenir le token
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      })
    });

    if (!tokenRes.ok) {
      console.error('[PREPARE] Erreur token:', tokenRes.status);
      return Response.json({ error: 'Failed to get token' }, { status: 500 });
    }

    const { access_token } = await tokenRes.json();
    console.log('[PREPARE] Token obtenu');

    // Fonction helper pour obtenir l'ID d'un dossier par chemin
    const getFolderIdByPath = async (path) => {
      const pathParts = path.split('/').filter(p => p);
      let currentId = driveId;

      for (const part of pathParts) {
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part}' and folder ne null`,
          { headers: { 'Authorization': `Bearer ${access_token}` } }
        );

        if (!res.ok) {
          console.error('[PREPARE] Erreur recherche dossier:', part, res.status);
          return null;
        }

        const data = await res.json();
        if (data.value && data.value.length > 0) {
          currentId = data.value[0].id;
        } else {
          console.log('[PREPARE] Dossier non trouvé:', part);
          return null;
        }
      }

      return currentId;
    };

    // Fonction pour créer un dossier
    const createFolder = async (parentId, folderName) => {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentId}/children`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'rename'
          })
        }
      );

      if (!res.ok) {
        console.error('[PREPARE] Erreur création dossier:', folderName, res.status);
        return null;
      }

      const data = await res.json();
      return data.id;
    };

    // Créer la structure de destination
    console.log('[PREPARE] Création de la structure destination...');
    const destParts = destinationFolderPath.split('/').filter(p => p);
    let parentId = driveId;

    for (let i = 0; i < destParts.length; i++) {
      const partName = destParts[i];
      const partPath = destParts.slice(0, i + 1).join('/');
      
      let folderId = await getFolderIdByPath(partPath);
      if (!folderId) {
        console.log('[PREPARE] Création de:', partName);
        folderId = await createFolder(parentId, partName);
        if (!folderId) {
          throw new Error(`Impossible de créer: ${partName}`);
        }
      }
      parentId = folderId;
    }

    console.log('[PREPARE] Structure destination créée');

    // Récupérer les fichiers source
    console.log('[PREPARE] Récupération des fichiers source...');
    const sourceId = await getFolderIdByPath(sourceFolderPath);
    if (!sourceId) {
      return Response.json({ error: 'Source folder not found' }, { status: 404 });
    }

    const filesRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sourceId}/children`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    if (!filesRes.ok) {
      return Response.json({ error: 'Failed to list files' }, { status: 500 });
    }

    const filesData = await filesRes.json();
    const files = filesData.value || [];
    console.log('[PREPARE] Fichiers trouvés:', files.length);

    // Déplacer les fichiers
    let movedCount = 0;
    for (const file of files) {
      if (file.folder) continue; // Ignorer les dossiers
      
      console.log('[PREPARE] Déplacement:', file.name);
      const moveRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            parentReference: {
              driveId: driveId,
              id: parentId
            }
          })
        }
      );

      if (moveRes.ok) {
        movedCount++;
        console.log('[PREPARE] ✓ Déplacé:', file.name);
      } else {
        console.error('[PREPARE] ✗ Erreur déplacement:', file.name, moveRes.status);
      }
    }

    console.log('[PREPARE] Transfert terminé:', movedCount, 'fichiers');

    return Response.json({
      success: true,
      movedCount,
      message: `${movedCount} fichier(s) transféré(s)`
    });

  } catch (error) {
    console.error('[PREPARE] Erreur complète:', error.message);
    return Response.json({
      error: error.message,
      success: false
    }, { status: 500 });
  }
});