import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourcePath, destPath } = await req.json();
    
    console.log('[TRANSFER] Source:', sourcePath);
    console.log('[TRANSFER] Dest:', destPath);

    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const driveId = Deno.env.get('SHAREPOINT_DRIVE_ID');

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

    const { access_token } = await tokenRes.json();
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    // Find source folder
    const parts = sourcePath.split('/').filter(p => p);
    let currentId = 'root';
    for (const part of parts) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part.replace(/'/g, "''")}'`,
        { headers }
      );
      const data = await res.json();
      const folder = data.value?.find(f => f.folder);
      if (!folder) return Response.json({ error: `Source not found: ${part}` }, { status: 404 });
      currentId = folder.id;
    }
    const sourceId = currentId;
    console.log('[TRANSFER] Source ID:', sourceId);

    // Create dest folder path
    const destParts = destPath.split('/').filter(p => p);
    currentId = 'root';
    for (const part of destParts) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part.replace(/'/g, "''")}'`,
        { headers }
      );
      const data = await res.json();
      let folder = data.value?.find(f => f.folder);
      if (!folder) {
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
        folder = await createRes.json();
      }
      currentId = folder.id;
    }
    const destId = currentId;
    console.log('[TRANSFER] Dest ID:', destId);

    // List files in source
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sourceId}/children`,
      { headers }
    );
    const listData = await listRes.json();
    const files = (listData.value || []).filter(f => !f.folder);
    console.log('[TRANSFER] Files:', files.length);

    // Move each file
    let movedCount = 0;
    for (const file of files) {
      console.log('[TRANSFER] Moving:', file.name);
      const moveRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            parentReference: { driveId, id: destId }
          })
        }
      );
      if (moveRes.ok) {
        movedCount++;
        console.log('[TRANSFER] OK:', file.name);
      } else {
        console.error('[TRANSFER] Failed:', file.name, moveRes.status);
      }
    }

    console.log('[TRANSFER] Done:', movedCount, 'moved');
    return Response.json({ success: true, movedCount });

  } catch (error) {
    console.error('[TRANSFER] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});