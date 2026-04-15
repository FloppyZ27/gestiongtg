import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data } = payload;

    // Vérifier que c'est une mise à jour
    if (event.type !== 'update') {
      return Response.json({ success: true });
    }

    // Vérifier que data contient des mandats
    if (!data || !data.mandats || !Array.isArray(data.mandats)) {
      return Response.json({ success: true });
    }

    let modified = false;
    const updatedMandats = data.mandats.map((mandat) => {
      // Vérifier si le mandat a la tâche "Cédule" et n'a pas encore le statut_terrain
      if (mandat.tache_actuelle === "Cédule" && !mandat.statut_terrain) {
        modified = true;
        return {
          ...mandat,
          statut_terrain: "en_verification"
        };
      }
      return mandat;
    });

    // Si des mandats ont été modifiés, mettre à jour le dossier
    if (modified) {
      await base44.entities.Dossier.update(event.entity_id, {
        ...data,
        mandats: updatedMandats
      });
    }

    return Response.json({ success: true, modified });
  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});