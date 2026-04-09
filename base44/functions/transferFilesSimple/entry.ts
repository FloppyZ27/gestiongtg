import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sourcePath, destPath } = body;
    
    if (!sourcePath || !destPath) {
      return Response.json({ error: 'sourcePath and destPath required' }, { status: 400 });
    }

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

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return Response.json({ error: 'Failed to get token' }, { status: 500 });
    }

    const access_token = tokenData.access_token;
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };

    // Find source folder ID
    const sourceParts = sourcePath.split('/').filter(p => p);
    let currentId = 'root';
    for (const part of sourceParts) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part}'`,
        { headers }
      );
      const data = await res.json();
      const folder = data.value?.find(f => f.folder);
      if (!folder) {
        console.log(`Source folder not found: ${part} in ${currentId}`);
        return Response.json({ success: true, movedCount: 0 });
      }
      currentId = folder.id;
    }
    const sourceId = currentId;

    // Find/create dest folder path
    const destParts = destPath.split('/').filter(p => p);
    currentId = 'root';
    for (const part of destParts) {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentId}/children?$filter=name eq '${part}'`,
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
              folder: {}
            })
          }
        );
        if (!createRes.ok) {
          console.error(`Failed to create folder ${part}`, createRes.status);
          continue;
        }
        folder = await createRes.json();
      }
      currentId = folder.id;
    }
    const destId = currentId;

    // List files in source
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sourceId}/children`,
      { headers }
    );
    const listData = await listRes.json();
    const files = (listData.value || []).filter(f => !f.folder);

    // Move each file
    let movedCount = 0;
    for (const file of files) {
      try {
        const moveRes = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${file.id}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
              parentReference: { id: destId }
            })
          }
        );
        if (moveRes.ok) {
          movedCount++;
        }
      } catch (e) {
        console.error(`Error moving ${file.name}:`, e.message);
      }
    }

    return Response.json({ success: true, movedCount });

  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});