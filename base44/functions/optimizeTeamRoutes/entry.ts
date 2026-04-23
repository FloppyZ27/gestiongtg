import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUREAU_ADDRESS = "11 rue melancon est, Alma, QC";
const MAX_HOURS = 9;
const MAX_HOURS_FRIDAY = 5;

// Retourne { durationSeconds, order } pour une liste d'adresses (round trip depuis le bureau)
async function getOptimizedRoute(apiKey, addresses) {
  if (!addresses || addresses.length === 0) return { durationSeconds: 0, order: [] };
  try {
    const waypoints = addresses.map(a => encodeURIComponent(a)).join('|');
    const optimizeFlag = addresses.length >= 2 ? 'optimize:true|' : '';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(BUREAU_ADDRESS)}&destination=${encodeURIComponent(BUREAU_ADDRESS)}&waypoints=${optimizeFlag}${waypoints}&key=${apiKey}`;
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

function getMaxHours(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 5 ? MAX_HOURS_FRIDAY : MAX_HOURS;
}

// Prend une liste de cartes candidates (déjà ordonnées par priorité),
// optimise géographiquement et retourne les cartes qui tiennent dans la limite horaire.
async function fitCardsIntoShift(apiKey, candidateCards, lockedCardIds, dateStr) {
  const maxH = getMaxHours(dateStr);
  if (candidateCards.length === 0) return [];

  const withAddr = candidateCards.filter(c => c.address);
  let orderedCards = [...candidateCards];

  // Optimiser l'ordre géographique si >= 2 adresses
  if (withAddr.length >= 2) {
    try {
      const { order, durationSeconds } = await getOptimizedRoute(apiKey, withAddr.map(c => c.address));
      const withAddrSorted = order.map(i => withAddr[i]);
      const withoutAddr = candidateCards.filter(c => !c.address);
      orderedCards = [...withAddrSorted, ...withoutAddr];

      const totalTravail = orderedCards.reduce((s, c) => s + parseTempsPrevu(c.temps_prevu), 0);
      const travelH = durationSeconds / 3600;

      if (totalTravail + travelH <= maxH) {
        return orderedCards; // tout rentre
      }

      // Trop plein: retirer depuis la fin (sauf lockées) en utilisant trajet proportionnel
      const travelPerAddr = travelH / withAddr.length;
      let cumH = 0;
      const kept = [];
      for (const card of orderedCards) {
        const h = parseTempsPrevu(card.temps_prevu) + (card.address ? travelPerAddr : 0);
        if (cumH + h <= maxH) {
          kept.push(card);
          cumH += h;
        } else if (lockedCardIds.includes(card.id)) {
          kept.push(card); // lockée: toujours garder
        }
      }
      return kept;
    } catch { /* fallback ci-dessous */ }
  }

  // Pas assez d'adresses: estimation trajet 1h total
  const ESTIMATED_TRAVEL = 1;
  const totalTravail = orderedCards.reduce((s, c) => s + parseTempsPrevu(c.temps_prevu), 0);
  if (totalTravail + ESTIMATED_TRAVEL <= maxH) return orderedCards;

  let cumH = 0;
  const kept = [];
  for (const card of orderedCards) {
    const h = parseTempsPrevu(card.temps_prevu);
    if (cumH + h + ESTIMATED_TRAVEL <= maxH || lockedCardIds.includes(card.id)) {
      kept.push(card);
      cumH += h;
    }
  }
  return kept;
}

const sortByPriority = (arr) => arr.sort((a, b) => {
  if (a.a_rendez_vous && !b.a_rendez_vous) return -1;
  if (!a.a_rendez_vous && b.a_rendez_vous) return 1;
  if (!a.date_limite_leve && !b.date_limite_leve) return 0;
  if (!a.date_limite_leve) return 1;
  if (!b.date_limite_leve) return -1;
  return a.date_limite_leve.localeCompare(b.date_limite_leve);
});

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

    // Map rapide pour retrouver les données d'une carte par id
    const cardDataMap = {};
    cardsData.forEach(c => { cardDataMap[c.id] = c; });
    unassignedCards.forEach(c => { cardDataMap[c.id] = c; });

    // POOL GLOBAL: cartes non assignées (a_ceduler) + cartes déjà cédulées dans des équipes futures (non lockées)
    // Les cartes lockées restent dans leur équipe actuelle.
    const lockedSet = new Set(lockedCardIds);

    // Récupérer toutes les cartes cédulées dans des équipes futures (non lockées) pour les réoptimiser
    const futureAssignedIds = new Set();
    Object.entries(equipes).forEach(([dateStr, dayEqs]) => {
      if (dateStr < today) return; // ne pas toucher le passé
      dayEqs.forEach(eq => {
        eq.mandats.forEach(id => {
          if (!lockedSet.has(id)) futureAssignedIds.add(id);
        });
      });
    });

    // Pool = cartes non assignées (a_ceduler) + cartes futures non lockées
    const poolCards = new Map(); // id -> cardData
    unassignedCards.forEach(c => { poolCards.set(c.id, c); });
    futureAssignedIds.forEach(id => {
      const data = cardDataMap[id];
      if (data) poolCards.set(id, data);
    });
    let pool = [...poolCards.values()];
    sortByPriority(pool);

    // Vider les mandats non-lockés de toutes les équipes futures (on va les réassigner)
    const equipesCopy = {};
    Object.entries(equipes).forEach(([dateStr, dayEqs]) => {
      equipesCopy[dateStr] = dayEqs.map(eq => ({
        ...eq,
        mandats: dateStr < today
          ? [...eq.mandats] // passé: intouché
          : eq.mandats.filter(id => lockedSet.has(id)), // futur: garder seulement les lockées
      }));
    });

    // Tous les jours futurs à traiter: jours avec équipes + 45 jours ouvrables à venir
    const futureDates = new Set(Object.keys(equipesCopy).filter(d => d >= today));
    const addDate = new Date(today); addDate.setDate(addDate.getDate() + 1);
    for (let i = 0; i < 45; i++) {
      while (addDate.getDay() === 0 || addDate.getDay() === 6) addDate.setDate(addDate.getDate() + 1);
      futureDates.add(addDate.toISOString().split('T')[0]);
      addDate.setDate(addDate.getDate() + 1);
    }
    const sortedDates = [...futureDates].sort();

    for (const dateStr of sortedDates) {
      if (pool.length === 0) break;

      const dayEquipes = (equipesCopy[dateStr] || []).filter(eq =>
        !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()
      );

      // ÉTAPE A: Remplir les équipes existantes avec des cartes du pool
      for (const equipe of dayEquipes) {
        if (!result[dateStr]) result[dateStr] = {};

        const lockedCards_data = equipe.mandats.map(id => cardDataMap[id]).filter(Boolean);

        // RDV pour ce jour en priorité, puis autres par priorité
        const rdvForDay = pool.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
        const othersForDay = pool.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));
        rdvForDay.sort((a, b) => (a.heure_rendez_vous || '').localeCompare(b.heure_rendez_vous || ''));
        sortByPriority(othersForDay);

        const candidates = [...lockedCards_data, ...rdvForDay, ...othersForDay];
        const keptCards = await fitCardsIntoShift(apiKey, candidates, lockedCardIds, dateStr);
        const keptIds = keptCards.map(c => c.id);

        // Retirer du pool les cartes intégrées
        const addedFromPool = keptIds.filter(id => pool.some(c => c.id === id));
        pool = pool.filter(c => !addedFromPool.includes(c.id));

        result[dateStr][equipe.id] = keptIds;
      }

      // ÉTAPE B: Créer de nouvelles équipes pour ce jour jusqu'à épuisement des techniciens libres
      while (pool.length > 0) {
        // Techniciens déjà utilisés ce jour (équipes existantes + nouvelles équipes créées ce jour)
        const usedTechIds = new Set([
          ...(equipesCopy[dateStr] || []).flatMap(eq => eq.techniciens),
          ...newEquipes.filter(n => n.dateStr === dateStr).flatMap(n => n.equipe.techniciens),
        ]);
        const freeTechs = availableTechniciens.filter(t => !usedTechIds.has(t.id));
        if (freeTechs.length === 0) break; // plus de techniciens dispo ce jour

        // Cartes candidates: RDV ce jour d'abord, puis par priorité
        const rdvForDay = pool.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
        const othersForDay = pool.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));
        rdvForDay.sort((a, b) => (a.heure_rendez_vous || '').localeCompare(b.heure_rendez_vous || ''));
        sortByPriority(othersForDay);

        const candidates = [...rdvForDay, ...othersForDay];
        if (candidates.length === 0) break;

        const keptCards = await fitCardsIntoShift(apiKey, candidates, [], dateStr);
        if (keptCards.length === 0) break;
        const orderedIds = keptCards.map(c => c.id);

        // Prendre 2 techniciens libres pour cette nouvelle équipe
        const techIds = freeTechs.slice(0, 2).map(t => t.id);
        const techInitials = freeTechs.slice(0, 2).map(t => t.prenom.charAt(0) + t.nom.charAt(0)).join('-');
        const dayNewCount = newEquipes.filter(n => n.dateStr === dateStr).length;
        const existingCount = (equipesCopy[dateStr] || []).filter(eq =>
          !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()
        ).length;
        const newEquipeNom = `Équipe ${existingCount + dayNewCount + 1} - ${techInitials}`;

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
        if (!result[dateStr]) result[dateStr] = {};
        result[dateStr][created.id] = orderedIds;

        // Retirer du pool les cartes assignées à cette nouvelle équipe
        pool = pool.filter(c => !orderedIds.includes(c.id));
      }
    }

    return Response.json({ result, newEquipes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});