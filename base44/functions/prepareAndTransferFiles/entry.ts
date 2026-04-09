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

    console.log('[PREPARE] Début');
    console.log('[PREPARE] Source:', sourceFolderPath);
    console.log('[PREPARE] Dest:', destinationFolderPath);

    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    if (!tenantId || !clientId || !clientSecret || !driveId) {
      console.error('[PREPARE] Config manquante');
      return Response.json({ error: 'Missing config' }, { status: 500 });
    }

    // Token
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
      console.error('[PREPARE] Token failed:', tokenRes.status);
      return Response.json({ error: 'Token error' }, { status: 500 });
    }

    const { access_token } = await tokenRes.json();
    console.log('[PREPARE] Token ok');

    // Rechercher source par chemin
    const getItemByPath = async (path) => {
      const encoded = encodeURIComponent(path);
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encoded}`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );
      if (!res.ok) return null;
      return await res.json();
    };

    // Créer dossier parent si besoin
    const ensureFolder = async (path) => {
      let item = await getItemByPath(path);
      if (item && item.folder) {
        console.log('[PREPARE] Dossier existe:', path);
        return item.id;
      }

      const parts = path.split('/').filter(p => p);
      let parentPath = '';
      
      for (let i = 0; i < parts.length; i++) {
        const folderName = parts[i];
        parentPath = parts.slice(0, i).join('/');
        const fullPath = parentPath ? `${parentPath}/${folderName}` : folderName;
        
        let existing = await getItemByPath(fullPath);
        if (existing && existing.folder) {
          console.log('[PREPARE] ✓ Existe:', folderName);
          continue;
        }

        // Créer
        const parentItem = parentPath ? await getItemByPath(parentPath) : { id: 'root' };
        if (!parentItem) {
          console.error('[PREPARE] Parent not found:', parentPath);
          throw new Error('Parent not found');
        }

        const createRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentItem.id}/children`,
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

        if (!createRes.ok) {
          const err = await createRes.text();
          console.error('[PREPARE] Create failed:', folderName, createRes.status, err);
          throw new Error(`Create failed: ${folderName}`);
        }

        const created = await createRes.json();
        console.log('[PREPARE] ✓ Créé:', folderName);
      }

      return (await getItemByPath(path))?.id;
    };

    // Récupérer source
    console.log('[PREPARE] Récupération source');
    const sourceItem = await getItemByPath(sourceFolderPath);
    if (!sourceItem) {
      console.error('[PREPARE] Source not found');
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    // Créer destination
    console.log('[PREPARE] Création destination');
    const destId = await ensureFolder(destinationFolderPath);
    console.log('[PREPARE] Dest ID:', destId);

    // Récupérer fichiers source
    console.log('[PREPARE] Liste fichiers');
    const filesRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sourceItem.id}/children`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    if (!filesRes.ok) {
      console.error('[PREPARE] List failed:', filesRes.status);
      return Response.json({ error: 'List failed' }, { status: 500 });
    }

    const filesData = await filesRes.json();
    const files = (filesData.value || []).filter(f => !f.folder);
    console.log('[PREPARE] Fichiers:', files.length);

    // Déplacer fichiers
    let movedCount = 0;
    for (const file of files) {
      try {
        console.log('[PREPARE] Move:', file.name);
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
                driveId,
                id: destId
              }
            })
          }
        );

        if (moveRes.ok) {
          movedCount++;
          console.log('[PREPARE] ✓ Moved:', file.name);
        } else {
          console.error('[PREPARE] Move failed:', file.name, moveRes.status);
        }
      } catch (e) {
        console.error('[PREPARE] Move error:', file.name, e.message);
      }
    }

    console.log('[PREPARE] Fini:', movedCount, 'fichiers');
    return Response.json({ success: true, movedCount });

  } catch (error) {
    console.error('[PREPARE] Fatal:', error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});