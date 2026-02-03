import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all dossiers
    const allDossiers = await base44.asServiceRole.entities.Dossier.list();

    // Filter dossiers with invalid status
    const invalidStatutDossiers = allDossiers.filter(d => 
      d.statut && d.statut !== "Ouvert" && d.statut !== "Fermé"
    );

    console.log(`Found ${invalidStatutDossiers.length} dossiers with invalid status`);

    // Update each dossier with invalid status to "Ouvert"
    const results = [];
    for (const dossier of invalidStatutDossiers) {
      try {
        await base44.asServiceRole.entities.Dossier.update(dossier.id, {
          ...dossier,
          statut: "Ouvert"
        });
        results.push({
          id: dossier.id,
          numero_dossier: dossier.numero_dossier,
          old_status: dossier.statut,
          new_status: "Ouvert",
          success: true
        });
      } catch (error) {
        results.push({
          id: dossier.id,
          numero_dossier: dossier.numero_dossier,
          old_status: dossier.statut,
          error: error.message,
          success: false
        });
      }
    }

    return Response.json({
      message: `Migration completed: ${results.filter(r => r.success).length} dossiers updated`,
      results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});