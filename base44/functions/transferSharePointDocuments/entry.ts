import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sourceFolderPath, destinationFolderPath, arpenteurInitials, clientName } = await req.json();

    let finalSourcePath = sourceFolderPath;

    // Si arpenteurInitials et clientName sont fournis, trouver le dossier TEMPORAIRE dynamiquement
    if (arpenteurInitials && clientName && !sourceFolderPath) {
      console.log(`[TRANSFER] Recherche dossier temporaire: ${clientName}`);
      const findResult = await base44.asServiceRole.functions.invoke('findTemporaryFolder', {
        arpenteurInitials,
        clientName
      });

      if (findResult?.foundPath) {
        finalSourcePath = findResult.foundPath;
        console.log(`[TRANSFER] Dossier trouvé: ${finalSourcePath}`);
      } else {
        console.log(`[TRANSFER] Aucun dossier temporaire trouvé`);
        return Response.json({ 
          success: false, 
          movedCount: 0,
          message: 'Aucun dossier temporaire trouvé'
        });
      }
    }

    if (!finalSourcePath || !destinationFolderPath) {
      return Response.json({ error: 'sourceFolderPath (ou arpenteurInitials+clientName) et destinationFolderPath requis' }, { status: 400 });
    }

    console.log(`[TRANSFER] Déplacement: ${finalSourcePath} → ${destinationFolderPath}`);
    const moveResult = await base44.asServiceRole.functions.invoke('moveSharePointFiles', {
      sourceFolderPath: finalSourcePath,
      destinationFolderPath
    });

    console.log(`[TRANSFER] Résultat: ${moveResult?.movedCount || 0} fichier(s) déplacé(s)`);
    return Response.json({ 
      success: moveResult?.success || false, 
      movedCount: moveResult?.movedCount || 0,
      details: moveResult
    });

  } catch (error) {
    console.error('[TRANSFER] Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});