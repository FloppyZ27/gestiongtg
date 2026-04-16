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

    // Vérifier si au moins un mandat a la tâche "Cédule" et n'a PAS de statut_terrain
    // (si statut_terrain est déjà défini, on ne touche pas)
    const needsUpdate = data.mandats.some(
      (mandat) => mandat.tache_actuelle === "Cédule" && !mandat.statut_terrain
    );

    if (!needsUpdate) {
      return Response.json({ success: true, modified: false });
    }

    // Utiliser les données du payload directement (déjà sauvegardées) plutôt que de refaire un get
    let modified = false;
    const updatedMandats = data.mandats.map((mandat) => {
      if (mandat.tache_actuelle === "Cédule" && !mandat.statut_terrain) {
        modified = true;
        return {
          ...mandat,
          statut_terrain: "en_verification"
        };
      }
      return mandat;
    });

    if (modified) {
      await base44.asServiceRole.entities.Dossier.update(event.entity_id, {
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