import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUREAU_ADDRESS = "11 rue melancon est, Alma, QC";
const MAX_HOURS = 9; // heures max par équipe (travail + trajet)

// Retourne { durationSeconds, order } pour une liste d'adresses (round trip depuis le bureau)
async function getOptimizedRoute(apiKey, addresses) {
  if (!addresses || addresses.length === 0) return { durationSeconds: 0, order: [] };
  if (addresses.length === 1) {
    // Aller-retour simple
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(BUREAU_ADDRESS)}&destination=${encodeURIComponent(BUREAU_ADDRESS)}&waypoints=${encodeURIComponent(addresses[0])}&key=${apiKey}`;
      const data = await (await fetch(url)).json();
      if (data.status !== 'OK') return { durationSeconds: 0, order: [0] };
      const secs = (data.routes[0].legs || []).reduce((s, l) => s + (l.duration?.value || 0), 0);
      return { durationSeconds: secs, order: [0] };
    } catch { return { durationSeconds: 0, order: [0] }; }
  }
  try {
    const waypoints = addresses.map(a => `via:${encodeURIComponent(a)}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(BUREAU_ADDRESS)}&destination=${encodeURIComponent(BUREAU_ADDRESS)}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;
    const data = await (await fetch(url)).json();
    if (data.status !== 'OK' || !data.routes?.[0]) return { durationSeconds: 0, order: addresses.map((_, i) => i) };
    const route = data.routes[0];
    const durationSeconds = (route.legs || []).reduce((s, l) => s + (l.duration?.value || 0), 0);
    const order = route.waypoint_order || addresses.map((_, i) => i);
    return { durationSeconds, order };
  } catch {
    return { durationSeconds: 0, order: addresses.map((_, i) => i) };
  }
}

// Parse un temps prévu (ex: "2h30", "1.5", "3h") en heures
function parseTempsPrevu(s) {
  if (!s) return 0;
  const hm = s.match(/^(\d+(?:\.\d+)?)h(\d+)?/i);
  if (hm) return parseFloat(hm[1]) + (hm[2] ? parseInt(hm[2]) / 60 : 0);
  const n = s.match(/(\d+(?:\.\d+)?)/);
  return n ? parseFloat(n[1]) : 0;
}

// Construit une liste ordonnée de cartes dont le total (travail + trajet réel) <= MAX_HOURS.
// Retourne { orderedIds, travelHours } après avoir appelé Google Maps sur les cartes retenues.
async function buildFinalOrder(apiKey, candidateCards, lockedCards) {
  if (candidateCards.length === 0) return { orderedIds: [], travelHours: 0 };

  // 1. Optimiser l'ordre géographique pour toutes les cartes candidates
  const withAddr = candidateCards.filter(c => c.address);
  let geoOrder = candidateCards.map((_, i) => i); // indices dans candidateCards
  if (withAddr.length >= 2) {
    try {
      const { order } = await getOptimizedRoute(apiKey, withAddr.map(c => c.address));
      // Reconstruire l'ordre complet: adresses optimisées + sans adresse à la fin
      const withAddrSorted = order.map(i => withAddr[i]);
      const withoutAddr = candidateCards.filter(c => !c.address);
      const sorted = [...withAddrSorted, ...withoutAddr];
      geoOrder = sorted.map(c => candidateCards.indexOf(c));
    } catch { /* garder l'ordre actuel */ }
  }

  const orderedCandidates = geoOrder.map(i => candidateCards[i]).filter(Boolean);

  // 2. Ajouter les cartes une par une jusqu'à MAX_HOURS (trajet recalculé à chaque ajout serait trop lent)
  //    Approche: ajouter toutes, calculer le trajet réel, enlever depuis la fin si dépassement.
  let kept = [...orderedCandidates];

  while (kept.length > 0) {
    const travailH = kept.reduce((sum, c) => sum + parseTempsPrevu(c.temps_prevu), 0);
    const addrs = kept.filter(c => c.address).map(c => c.address);
    const { durationSeconds } = await getOptimizedRoute(apiKey, addrs);
    const travelH = durationSeconds / 3600;
    const totalH = travailH + travelH;

    if (totalH <= MAX_HOURS) {
      return { orderedIds: kept.map(c => c.id), travelHours: travelH };
    }

    // Retirer la dernière carte non-lockée
    let removed = false;
    for (let i = kept.length - 1; i >= 0; i--) {
      if (!lockedCards.includes(kept[i].id)) {
        kept.splice(i, 1);
        removed = true;
        break;
      }
    }
    if (!removed) break; // toutes lockées, on ne peut pas réduire
  }

  const travailH = kept.reduce((sum, c) => sum + parseTempsPrevu(c.temps_prevu), 0);
  const addrs = kept.filter(c => c.address).map(c => c.address);
  const { durationSeconds } = await getOptimizedRoute(apiKey, addrs);
  return { orderedIds: kept.map(c => c.id), travelHours: durationSeconds / 3600 };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { equipes, cardsData, lockedCardIds = [], unassignedCards = [], availableTechniciens = [], placeAffaire } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing Google Maps API key' }, { status: 500 });

    const today = new Date().toISOString().split('T')[0];
    const result = {};
    const newEquipes = [];

    // Cartes déjà assignées
    const assignedCardIds = new Set();
    Object.values(equipes).forEach(dayEqs => dayEqs.forEach(eq => eq.mandats.forEach(id => assignedCardIds.add(id))));

    // Pool de cartes à planifier (non assignées, statut a_ceduler)
    let pool = unassignedCards.filter(c => !assignedCardIds.has(c.id));

    // Trier le pool: RDV d'abord, puis date_limite_leve croissante
    const sortPool = (arr) => arr.sort((a, b) => {
      if (a.a_rendez_vous && !b.a_rendez_vous) return -1;
      if (!a.a_rendez_vous && b.a_rendez_vous) return 1;
      if (!a.date_limite_leve && !b.date_limite_leve) return 0;
      if (!a.date_limite_leve) return 1;
      if (!b.date_limite_leve) return -1;
      return a.date_limite_leve.localeCompare(b.date_limite_leve);
    });
    sortPool(pool);

    // Collecter tous les jours futurs à traiter
    const futureDates = new Set(Object.keys(equipes).filter(d => d > today));
    const addDate = new Date(today); addDate.setDate(addDate.getDate() + 1);
    for (let i = 0; i < 30; i++) {
      while (addDate.getDay() === 0 || addDate.getDay() === 6) addDate.setDate(addDate.getDate() + 1);
      futureDates.add(addDate.toISOString().split('T')[0]);
      addDate.setDate(addDate.getDate() + 1);
    }
    const sortedDates = [...futureDates].sort();

    // --- TRAITEMENT PAR JOUR ---
    for (const dateStr of sortedDates) {
      if (pool.length === 0 && !equipes[dateStr]?.length) continue;

      const dayEquipes = (equipes[dateStr] || []).filter(eq =>
        !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()
      );

      if (!result[dateStr]) result[dateStr] = {};

      // ÉTAPE A: Optimiser les équipes existantes + les remplir avec des cartes du pool
      for (const equipe of dayEquipes) {
        if (dateStr < today) {
          result[dateStr][equipe.id] = equipe.mandats;
          continue;
        }

        const lockedInEquipe = (equipe.mandats || []).filter(id => lockedCardIds.includes(id));
        const unlockedInEquipe = (equipe.mandats || []).filter(id => !lockedCardIds.includes(id));

        // Cartes RDV du pool correspondant à ce jour
        const rdvPoolForDay = pool.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);

        // Construire les candidats: lockées + non-lockées existantes + RDV du pool + autres du pool (triés)
        const otherPool = pool.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));
        sortPool(otherPool);

        const lockedCards_data = lockedInEquipe.map(id => cardsData.find(c => c.id === id)).filter(Boolean);
        const unlockedExisting = unlockedInEquipe.map(id => cardsData.find(c => c.id === id)).filter(Boolean);

        // Ordre prioritaire: lockées (positions fixes), puis non-lockées existantes (RDV du jour d'abord), puis pool RDV, puis pool autre
        const unlockedExistingRdv = unlockedExisting.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
        const unlockedExistingOther = unlockedExisting.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));
        unlockedExistingRdv.sort((a, b) => (a.heure_rendez_vous || '').localeCompare(b.heure_rendez_vous || ''));
        rdvPoolForDay.sort((a, b) => (a.heure_rendez_vous || '').localeCompare(b.heure_rendez_vous || ''));

        // Candidats non-lockés (ordre de tentative)
        const candidates = [
          ...unlockedExistingRdv,
          ...rdvPoolForDay,
          ...unlockedExistingOther,
          ...otherPool,
        ];

        // Calculer la capacité disponible avec les lockées seules
        const lockedHours = lockedCards_data.reduce((s, c) => s + parseTempsPrevu(c.temps_prevu), 0);
        const lockedAddresses = lockedCards_data.filter(c => c.address).map(c => c.address);
        const { durationSeconds: lockedTravelSec } = await getOptimizedRoute(apiKey, lockedAddresses);
        const usedHours = lockedHours + lockedTravelSec / 3600;

        if (usedHours >= MAX_HOURS) {
          // Équipe déjà pleine avec les cartes lockées
          result[dateStr][equipe.id] = equipe.mandats;
          continue;
        }

        // Tentative d'ajout des candidats jusqu'à remplir 9h
        // Inclure les lockées dans le calcul final
        const allCandidates = [...lockedCards_data, ...candidates];
        const { orderedIds, travelHours } = await buildFinalOrder(apiKey, allCandidates, lockedCardIds);

        // Retirer les nouvelles cartes (pool) qui ont été intégrées
        const addedFromPool = orderedIds.filter(id =>
          !equipe.mandats.includes(id) && pool.some(c => c.id === id)
        );
        pool = pool.filter(c => !addedFromPool.includes(c.id));

        result[dateStr][equipe.id] = orderedIds;
      }

      // ÉTAPE B: Si des cartes restent dans le pool et qu'il y a des techniciens libres → créer une nouvelle équipe
      if (pool.length === 0) continue;

      const usedTechIds = new Set([
        ...(equipes[dateStr] || []).flatMap(eq => eq.techniciens),
        ...newEquipes.filter(n => n.dateStr === dateStr).flatMap(n => n.equipe.techniciens),
      ]);
      const freeTechs = availableTechniciens.filter(t => !usedTechIds.has(t.id));
      if (freeTechs.length === 0) continue;

      // Cartes RDV ce jour + autres triées
      const rdvForDay = pool.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
      const othersForDay = pool.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));
      rdvForDay.sort((a, b) => (a.heure_rendez_vous || '').localeCompare(b.heure_rendez_vous || ''));

      const candidates = [...rdvForDay, ...othersForDay];
      if (candidates.length === 0) continue;

      const { orderedIds } = await buildFinalOrder(apiKey, candidates, []);
      if (orderedIds.length === 0) continue;

      const techIds = freeTechs.slice(0, 2).map(t => t.id);
      const techInitials = freeTechs.slice(0, 2).map(t => t.prenom.charAt(0) + t.nom.charAt(0)).join('-');
      const dayNewCount = newEquipes.filter(n => n.dateStr === dateStr).length;
      const newEquipeNom = `Équipe ${(dayEquipes.length + dayNewCount + 1)} - ${techInitials}`;

      const newEquipeData = {
        date_terrain: dateStr,
        nom: newEquipeNom,
        place_affaire: placeAffaire || 'Alma',
        techniciens: techIds,
        vehicules: [],
        equipements: [],
        mandats: orderedIds,
      };

      const created = await base44.asServiceRole.entities.EquipeTerrain.create(newEquipeData);
      newEquipes.push({ dateStr, equipe: { id: created.id, ...newEquipeData } });

      pool = pool.filter(c => !orderedIds.includes(c.id));
      result[dateStr][created.id] = orderedIds;
    }

    return Response.json({ result, newEquipes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});