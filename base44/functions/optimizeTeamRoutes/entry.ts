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
// Les groupes liés (linkedGroups) sont traités comme des unités atomiques.
async function fitCardsIntoShift(apiKey, candidateCards, lockedCardIds, dateStr, cardToGroup) {
  const maxH = getMaxHours(dateStr);
  if (candidateCards.length === 0) return [];

  // Helper: obtenir tous les membres d'un groupe liés présents dans candidateCards
  const getGroupMembers = (cardId) => {
    const group = cardToGroup?.get(cardId);
    if (!group) return null;
    return group.cardIds.filter(id => candidateCards.some(c => c.id === id)).map(id => candidateCards.find(c => c.id === id)).filter(Boolean);
  };

  // Construire des "unités" (groupe lié = une unité atomique, carte seule = une unité)
  const buildUnits = (cards) => {
    const seen = new Set();
    const units = [];
    for (const card of cards) {
      if (seen.has(card.id)) continue;
      const members = getGroupMembers(card.id);
      if (members && members.length > 1) {
        members.forEach(m => seen.add(m.id));
        units.push({ cards: members, isGroup: true, isLocked: members.some(m => lockedCardIds.includes(m.id)) });
      } else {
        seen.add(card.id);
        units.push({ cards: [card], isGroup: false, isLocked: lockedCardIds.includes(card.id) });
      }
    }
    return units;
  };

  // Séparer urgents et non-urgents
  const urgentCards = candidateCards.filter(c => lockedCardIds.includes(c.id) || c.a_rendez_vous || isUrgent(c, dateStr));
  const relaxedCards = candidateCards.filter(c => !lockedCardIds.includes(c.id) && !c.a_rendez_vous && !isUrgent(c, dateStr));

  // Optimiser géographiquement les cartes non-urgentes qui ont une adresse
  let orderedRelaxed = [...relaxedCards];
  if (relaxedCards.filter(c => c.address).length >= 2) {
    try {
      const relaxedWithAddr = relaxedCards.filter(c => c.address);
      const { order } = await getOptimizedRoute(apiKey, relaxedWithAddr.map(c => c.address));
      const relaxedWithAddrSorted = order.map(i => relaxedWithAddr[i]);
      const relaxedWithoutAddr = relaxedCards.filter(c => !c.address);
      orderedRelaxed = [...relaxedWithAddrSorted, ...relaxedWithoutAddr];
    } catch { /* garder l'ordre original */ }
  }

  let orderedCards = [...urgentCards, ...orderedRelaxed];

  // Maintenant élaguer si nécessaire en respectant l'atomicité des groupes liés
  const withAddr = orderedCards.filter(c => c.address);
  let travelH = 1; // estimation par défaut
  if (withAddr.length >= 2) {
    try {
      const { durationSeconds } = await getOptimizedRoute(apiKey, withAddr.map(c => c.address));
      travelH = durationSeconds / 3600;
    } catch { /* garder estimation */ }
  }

  const totalTravail = orderedCards.reduce((s, c) => s + parseTempsPrevu(c.temps_prevu), 0);
  if (totalTravail + travelH <= maxH) return orderedCards;

  // Trop plein: retirer des unités entières depuis la fin (groupes liés non séparables)
  const travelPerAddr = withAddr.length > 0 ? travelH / withAddr.length : 0;
  const units = buildUnits(orderedCards);
  let cumH = 0;
  const keptCards = [];

  for (const unit of units) {
    const unitH = unit.cards.reduce((s, c) => s + parseTempsPrevu(c.temps_prevu) + (c.address ? travelPerAddr : 0), 0);
    if (cumH + unitH <= maxH || unit.isLocked) {
      unit.cards.forEach(c => keptCards.push(c));
      cumH += unitH;
    }
    // Si l'unité ne rentre pas et n'est pas lockée → on saute TOUTE l'unité (groupes liés non séparés)
  }
  return keptCards;
}

// Une carte est "en retard" si sa date_limite_leve ou date_livraison est dépassée (ou dans les 3 prochains jours)
function isUrgent(card, todayStr) {
  const soonThreshold = new Date(todayStr);
  soonThreshold.setDate(soonThreshold.getDate() + 3);
  const soonStr = soonThreshold.toISOString().split('T')[0];
  const lim = card.date_limite_leve || card.date_livraison;
  if (!lim) return false;
  return lim <= soonStr;
}

const sortByPriority = (arr, todayStr) => arr.sort((a, b) => {
  // 1. RDV en premier
  if (a.a_rendez_vous && !b.a_rendez_vous) return -1;
  if (!a.a_rendez_vous && b.a_rendez_vous) return 1;
  // 2. Urgent avant non-urgent
  const aUrgent = isUrgent(a, todayStr);
  const bUrgent = isUrgent(b, todayStr);
  if (aUrgent && !bUrgent) return -1;
  if (!aUrgent && bUrgent) return 1;
  // 3. Parmi les urgents: trier par date la plus proche
  if (aUrgent && bUrgent) {
    const aDate = a.date_limite_leve || a.date_livraison || '';
    const bDate = b.date_limite_leve || b.date_livraison || '';
    return aDate.localeCompare(bDate);
  }
  // 4. Parmi les non-urgents: pas de tri forcé → Google Maps optimisera géographiquement
  return 0;
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { equipes, cardsData, lockedCardIds = [], unassignedCards = [], availableTechniciens = [], placeAffaire, linkedGroups = [] } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing Google Maps API key' }, { status: 500 });

    // Séparer les chefs des techniciens réguliers
    const chefs = availableTechniciens.filter(t => t.poste && t.poste.toLowerCase().includes('chef'));

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
    sortByPriority(pool, today);

    // Construire un map cardId -> groupId pour les cartes liées
    const cardToGroup = new Map(); // cardId -> group {id, cardIds}
    linkedGroups.forEach(group => {
      group.cardIds.forEach(id => cardToGroup.set(id, group));
    });

    // Helper: obtenir toutes les cartes du pool qui font partie du même groupe qu'une carte donnée
    const getGroupCards = (cardId) => {
      const group = cardToGroup.get(cardId);
      if (!group) return null;
      return group.cardIds.filter(id => pool.some(c => c.id === id) || cardDataMap[id]).map(id => cardDataMap[id]).filter(Boolean);
    };

    // Quand on retire des cartes du pool, retirer tout le groupe lié
    const removeFromPool = (ids) => {
      const toRemove = new Set(ids);
      // Étendre aux groupes liés
      ids.forEach(id => {
        const group = cardToGroup.get(id);
        if (group) group.cardIds.forEach(gid => toRemove.add(gid));
      });
      pool = pool.filter(c => !toRemove.has(c.id));
    };

    // Quand on sélectionne une carte candidate, ajouter tout son groupe
    const expandWithLinkedGroup = (cards) => {
      const expanded = [];
      const seen = new Set();
      cards.forEach(card => {
        if (seen.has(card.id)) return;
        seen.add(card.id);
        expanded.push(card);
        const group = cardToGroup.get(card.id);
        if (group) {
          group.cardIds.forEach(gid => {
            if (!seen.has(gid)) {
              const gcard = cardDataMap[gid];
              if (gcard) { seen.add(gid); expanded.push(gcard); }
            }
          });
        }
      });
      return expanded;
    };

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
        sortByPriority(othersForDay, dateStr);

        const candidatesRaw = [...lockedCards_data, ...rdvForDay, ...othersForDay];
        const candidates = expandWithLinkedGroup(candidatesRaw);
        const keptCards = await fitCardsIntoShift(apiKey, candidates, lockedCardIds, dateStr, cardToGroup);
        const keptIds = keptCards.map(c => c.id);

        // Retirer du pool les cartes intégrées (et leurs groupes liés)
        const addedFromPool = keptIds.filter(id => pool.some(c => c.id === id));
        removeFromPool(addedFromPool);

        result[dateStr][equipe.id] = keptIds;
      }

      // ÉTAPE B: Créer de nouvelles équipes pour ce jour jusqu'à épuisement des chefs libres
      while (pool.length > 0) {
        // Chefs déjà utilisés ce jour (équipes existantes + nouvelles équipes créées ce jour)
        const usedChefIds = new Set();
        (equipesCopy[dateStr] || []).forEach(eq => {
          // Un chef est un technicien dans l'équipe dont le poste contient "Chef"
          eq.techniciens.forEach(tid => {
            const t = availableTechniciens.find(av => av.id === tid);
            if (t && t.poste && t.poste.toLowerCase().includes('chef')) {
              usedChefIds.add(tid);
            }
          });
        });
        newEquipes.filter(n => n.dateStr === dateStr).forEach(n => {
          n.equipe.techniciens.forEach(tid => {
            const t = availableTechniciens.find(av => av.id === tid);
            if (t && t.poste && t.poste.toLowerCase().includes('chef')) {
              usedChefIds.add(tid);
            }
          });
        });

        const freeChefs = chefs.filter(t => !usedChefIds.has(t.id));
        if (freeChefs.length === 0) break; // plus de chefs dispo ce jour

        // Cartes candidates: RDV ce jour d'abord, puis par priorité
        const rdvForDay = pool.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
        const othersForDay = pool.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));
        rdvForDay.sort((a, b) => (a.heure_rendez_vous || '').localeCompare(b.heure_rendez_vous || ''));
        sortByPriority(othersForDay, dateStr);

        const candidatesRaw = [...rdvForDay, ...othersForDay];
        if (candidatesRaw.length === 0) break;
        const candidates = expandWithLinkedGroup(candidatesRaw);

        const keptCards = await fitCardsIntoShift(apiKey, candidates, [], dateStr, cardToGroup);
        if (keptCards.length === 0) break;
        const orderedIds = keptCards.map(c => c.id);

        // Toujours prendre 1 chef (obligatoire)
        const chef = freeChefs[0];
        let techIds = [chef.id];
        let techInitials = chef.prenom.charAt(0) + chef.nom.charAt(0);

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

        // Retirer du pool les cartes assignées (et leurs groupes liés)
        removeFromPool(orderedIds);
      }
    }

    return Response.json({ result, newEquipes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});