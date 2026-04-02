import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const SYSTEM_CONTEXT = `Tu es un assistant IA intégré à GestionGTG, un logiciel de gestion interne pour une firme d'arpenteurs-géomètres (GTG). Tu as accès aux données réelles de la base de données ci-dessous.

Règles importantes:
- Réponds TOUJOURS en français
- Sois précis avec les données réelles fournies
- Si tu ne trouves pas l'information dans les données, dis-le clairement
- Pour les dates, formate-les en format lisible (ex: 15 mars 2025)
- Les numéros de dossier sont préfixés: SG- (Samuel Guay), DG- (Dany Gaboury), PLP- (Pierre-Luc Pilote), BL- (Benjamin Larouche), FG- (Frédéric Gilbert)

Modules de l'application:
- DOSSIERS: mandats (CL, Implantation, Piquetage, OCTR, Lotissement, Bornage), tâches, statuts
- CLIENTS: particuliers, notaires, courtiers, compagnies
- LOTS: cadastraux avec circonscription, concordances
- CÉDULE TERRAIN: équipes, techniciens, véhicules
- RENDEZ-VOUS: agenda personnel, absences
- ENTRÉES DE TEMPS: heures par dossier/mandat/tâche
`;

const ARPENTEUR_INITIALS = {
  "Samuel Guay": "SG-",
  "Dany Gaboury": "DG-",
  "Pierre-Luc Pilote": "PLP-",
  "Benjamin Larouche": "BL-",
  "Frédéric Gilbert": "FG-"
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

function buildDossierContext(dossiers, clients) {
  if (!dossiers || dossiers.length === 0) return "Aucun dossier disponible.";
  
  const clientMap = {};
  (clients || []).forEach(c => { clientMap[c.id] = `${c.prenom} ${c.nom}`; });

  return dossiers.map(d => {
    const prefix = ARPENTEUR_INITIALS[d.arpenteur_geometre] || "";
    const num = `${prefix}${d.numero_dossier || ''}`;
    const clientNames = (d.clients_ids || []).map(id => clientMap[id]).filter(Boolean).join(", ") || d.clients_texte || "N/A";
    
    const mandatsStr = (d.mandats || []).map(m => {
      const adresse = m.adresse_travaux
        ? [m.adresse_travaux.numeros_civiques?.filter(n=>n).join(', '), m.adresse_travaux.rue, m.adresse_travaux.ville].filter(Boolean).join(' ')
        : m.adresse_travaux_texte || '';
      
      const terrainDates = (m.terrains_list || []).map(t => t.date_cedulee || t.date_terrain).filter(Boolean);
      const terrainStr = terrainDates.length > 0 ? ` | Terrain(s): ${terrainDates.map(formatDate).join(', ')}` : '';
      
      const minuteStr = m.date_minute ? ` | Minute: ${formatDate(m.date_minute)}` : '';
      const livraisonStr = m.date_livraison ? ` | Livraison: ${formatDate(m.date_livraison)}` : '';
      const signatureStr = m.date_signature ? ` | Signature: ${formatDate(m.date_signature)}` : '';
      const tacheStr = m.tache_actuelle ? ` | Tâche: ${m.tache_actuelle}` : '';
      const assigneStr = m.utilisateur_assigne ? ` | Assigné: ${m.utilisateur_assigne}` : '';
      
      return `    - ${m.type_mandat || 'N/A'}${adresse ? ` @ ${adresse}` : ''}${tacheStr}${livraisonStr}${signatureStr}${minuteStr}${terrainStr}${assigneStr}`;
    }).join('\n');

    return `Dossier ${num} | Client: ${clientNames} | Arpenteur: ${d.arpenteur_geometre} | Statut: ${d.statut || 'N/A'} | Ouvert: ${formatDate(d.date_ouverture)}
${mandatsStr || '    (aucun mandat)'}`;
  }).join('\n\n');
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { question, history } = await req.json();

  // Fetch all relevant data in parallel
  const [dossiers, clients, equipesTerrains, rendezVous] = await Promise.all([
    base44.entities.Dossier.list(),
    base44.entities.Client.list(),
    base44.entities.EquipeTerrain.list('-date_terrain', 100),
    base44.entities.RendezVous.filter({ utilisateur_email: user.email }, '-date_debut', 50),
  ]);

  const dossierContext = buildDossierContext(dossiers, clients);
  
  const equipeContext = (equipesTerrains || []).slice(0, 30).map(e => 
    `Équipe "${e.nom}" - ${formatDate(e.date_terrain)} - ${e.place_affaire}`
  ).join('\n');

  const rdvContext = (rendezVous || []).slice(0, 20).map(r =>
    `${r.titre} - ${formatDate(r.date_debut)}${r.date_fin ? ` au ${formatDate(r.date_fin)}` : ''} (${r.type})`
  ).join('\n');

  const historyStr = (history || [])
    .map(m => `${m.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `${SYSTEM_CONTEXT}

=== DONNÉES RÉELLES DE LA BASE DE DONNÉES ===

--- DOSSIERS ET MANDATS (${dossiers.length} dossiers) ---
${dossierContext}

--- ÉQUIPES TERRAIN RÉCENTES ---
${equipeContext || 'Aucune équipe terrain.'}

--- MES RENDEZ-VOUS (${user.full_name}) ---
${rdvContext || 'Aucun rendez-vous.'}

=== FIN DES DONNÉES ===

${historyStr ? `Historique de la conversation:\n${historyStr}\n` : ''}
Utilisateur: ${question}

Réponds avec précision en te basant sur les données réelles ci-dessus. Si une information est dans les données, donne-la exactement. Sois concis.`;

  const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gpt_5' });

  return Response.json({ answer: response });
});