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
      return Response.json({ error: 'sourceFolderPath and destinationFolderPath are required' }, { status: 400 });
    }

    // Appeler moveSharePointFiles
    const moveResult = await base44.functions.invoke('moveSharePointFiles', {
      sourceFolderPath,
      destinationFolderPath
    });

    return Response.json({ 
      success: true, 
      movedCount: moveResult?.movedCount || 0,
      details: moveResult
    });

  } catch (error) {
    console.error('Erreur transfert documents:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});