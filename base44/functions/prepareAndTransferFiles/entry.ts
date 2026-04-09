import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceFolderPath, destinationFolderPath } = await req.json();
    
    console.log('[PREPARE] Start');
    console.log('[PREPARE] Source:', sourceFolderPath);
    console.log('[PREPARE] Dest:', destinationFolderPath);

    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

    if (!tenantId || !clientId || !clientSecret || !driveId) {
      return Response.json({ error: 'Config missing' }, { status: 500 });
    }

    // Get token
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
      return Response.json({ error: 'Token error' }, { status: 500 });
    }

    const { access_token } = await tokenRes.json();

    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    // Find folder by path, navigating by name
    const findFolderByPath = async (path) => {
      const parts = path.split('/').filter(p => p);
      let currentId = 'root';

      for (const part of parts) {
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part.replace(/'/g, "''")}'`,
          { headers }
        );

        if (!res.ok) {
          console.error('[PREPARE] Find failed for:', part, res.status);
          return null;
        }

        const data = await res.json();
        const folder = data.value?.find(f => f.folder);
        if (!folder) {
          console.log('[PREPARE] Not found:', part);
          return null;
        }
        currentId = folder.id;
      }

      return currentId;
    };

    // Create folder by path, creating missing ones
    const createFolderPath = async (path) => {
      const parts = path.split('/').filter(p => p);
      let currentId = 'root';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        // Check if exists
        const res = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part.replace(/'/g, "''")}'`,
          { headers }
        );

        if (res.ok) {
          const data = await res.json();
          const folder = data.value?.find(f => f.folder);
          if (folder) {
            currentId = folder.id;
            console.log('[PREPARE] Found:', part);
            continue;
          }
        }

        // Create it
        console.log('[PREPARE] Creating:', part);
        const createRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: part,
              folder: {},
              '@microsoft.graph.conflictBehavior': 'rename'
            })
          }
        );

        if (!createRes.ok) {
          const err = await createRes.text();
          console.error('[PREPARE] Create error:', part, createRes.status, err);
          throw new Error(`Create failed: ${part}`);
        }

        const created = await createRes.json();
        currentId = created.id;
        console.log('[PREPARE] Created:', part, currentId);
      }

      return currentId;
    };

    // Find source
    console.log('[PREPARE] Finding source...');
    const sourceId = await findFolderByPath(sourceFolderPath);
    if (!sourceId) {
      console.error('[PREPARE] Source not found');
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }
    console.log('[PREPARE] Source ID:', sourceId);

    // Create dest path
    console.log('[PREPARE] Creating dest path...');
    const destId = await createFolderPath(destinationFolderPath);
    console.log('[PREPARE] Dest ID:', destId);

    // Get source files
    console.log('[PREPARE] Listing files...');
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sourceId}/children`,
      { headers }
    );

    if (!listRes.ok) {
      console.error('[PREPARE] List failed:', listRes.status);
      return Response.json({ error: 'List failed' }, { status: 500 });
    }

    const listData = await listRes.json();
    const files = (listData.value || []).filter(f => !f.folder);
    console.log('[PREPARE] Files count:', files.length);

    // Move files
    let movedCount = 0;
    for (const file of files) {
      console.log('[PREPARE] Moving:', file.name);
      
      const moveRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}`,
        {
          method: 'PATCH',
          headers,
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
        console.log('[PREPARE] OK:', file.name);
      } else {
        const err = await moveRes.text();
        console.error('[PREPARE] Move error:', file.name, moveRes.status, err);
      }
    }

    console.log('[PREPARE] Done:', movedCount, 'moved');
    return Response.json({ success: true, movedCount });

  } catch (error) {
    console.error('[PREPARE] Exception:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});