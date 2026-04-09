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

    // Call the sharepoint function via SDK
    const listRes = await base44.functions.invoke('sharepoint', {
      action: 'list',
      folderPath: sourcePath
    });

    const files = (listRes.data?.files || []).filter(f => f.type === 'file');
    console.log('[TRANSFER] Found', files.length, 'files');

    let movedCount = 0;
    for (const file of files) {
      console.log('[TRANSFER] Moving:', file.name);
      
      // Download
      const downloadRes = await base44.functions.invoke('sharepoint', {
        action: 'getDownloadUrl',
        fileId: file.id
      });

      if (!downloadRes.data?.downloadUrl) {
        console.error('[TRANSFER] No download URL for:', file.name);
        continue;
      }

      // Download file content
      const fileRes = await fetch(downloadRes.data.downloadUrl);
      const buffer = await fileRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      // Upload to dest
      const uploadRes = await base44.functions.invoke('uploadToSharePoint', {
        folderPath: destPath,
        fileName: file.name,
        fileContent: base64,
        contentType: file.mimeType || 'application/octet-stream'
      });

      if (uploadRes.data?.success) {
        console.log('[TRANSFER] Uploaded:', file.name);
        
        // Delete from source
        const deleteRes = await base44.functions.invoke('sharepoint', {
          action: 'delete',
          fileId: file.id
        });
        
        if (deleteRes.data?.success || deleteRes.status === 200) {
          movedCount++;
          console.log('[TRANSFER] Deleted from source:', file.name);
        }
      } else {
        console.error('[TRANSFER] Upload failed:', file.name);
      }
    }

    console.log('[TRANSFER] Done:', movedCount, 'files moved');
    return Response.json({ success: true, movedCount });

  } catch (error) {
    console.error('[TRANSFER] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});