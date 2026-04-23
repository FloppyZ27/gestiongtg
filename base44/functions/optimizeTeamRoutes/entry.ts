import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUREAU_ADDRESS = "11 rue melancon est, Alma, QC";
const MAX_HOURS = 9; // heures max par équipe (travail + trajet)

// Calcule la durée de trajet via Google Maps Directions API (en secondes)
async function getRouteDuration(apiKey, addresses) {
  if (!addresses || addresses.length < 1) return 0;
  try {
    const waypoints = addresses.map(a => encodeURIComponent(a)).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(BUREAU_ADDRESS)}&destination=${encodeURIComponent(BUREAU_ADDRESS)}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status !== 'OK' || !data.routes?.[0]?.legs) return 0;
    return data.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
  } catch {
    return 0;
  }
}

// Calcule la durée de trajet optimisée et retourne aussi l'ordre optimal
async function getOptimizedRoute(apiKey, addresses) {
  if (!addresses || addresses.length < 2) {
    return { durationSeconds: await getRouteDuration(apiKey, addresses), order: addresses.map((_, i) => i) };
  }
  try {
    const waypoints = addresses.map(a => `via:${encodeURIComponent(a)}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(BUREAU_ADDRESS)}&destination=${encodeURIComponent(BUREAU_ADDRESS)}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status !== 'OK' || !data.routes?.[0]) return { durationSeconds: 0, order: addresses.map((_, i) => i) };
    const route = data.routes[0];
    const durationSeconds = (route.legs || []).reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
    const order = route.waypoint_order || addresses.map((_, i) => i);
    return { durationSeconds, order };
  } catch {
    return { durationSeconds: 0, order: addresses.map((_, i) => i) };
  }
}

// Parse un temps prévu (ex: "2h30", "1.5", "3h") en heures
function parseTempsPrevu(s) {
  if (!s) return 0;
  const hm = s.match(/(\d+(?:\.\d+)?)h(\d+)?/i);
  if (hm) return parseFloat(hm[1]) + (hm[2] ? parseInt(hm[2]) / 60 : 0);
  const n = s.match(/(\d+(?:\.\d+)?)/);
  return n ? parseFloat(n[1]) : 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { equipes, cardsData, lockedCardIds = [], unassignedCards = [], availableTechniciens = [], placeAffaire } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing Google Maps API key' }, { status: 500 });

    // equipes: { dateStr: [{ id, nom, techniciens: [id,...], mandats: [cardId,...] }] }
    // cardsData: [{ id, address, date_limite_leve, a_rendez_vous, date_rendez_vous, heure_rendez_vous, technicien, temps_prevu }]
    // unassignedCards: cardsData des cartes non assignées (statut a_ceduler)
    // availableTechniciens: [{ id, prenom, nom }]

    const today = new Date().toISOString().split('T')[0];
    const result = {}; // dateStr -> equipeId -> ordered card ids
    const newEquipes = []; // nouvelles équipes à créer

    // Ensemble des cartes déjà assignées (dans une équipe existante)
    const assignedCardIds = new Set();
    Object.values(equipes).forEach(dayEqs => dayEqs.forEach(eq => eq.mandats.forEach(id => assignedCardIds.add(id))));

    // Cartes à planifier (non assignées, statut a_ceduler)
    let cardsToSchedule = unassignedCards.filter(c => !assignedCardIds.has(c.id));

    // --- ÉTAPE 1: Optimiser les équipes existantes ---
    for (const [dateStr, dayEquipes] of Object.entries(equipes)) {
      if (dateStr <= today) continue;
      result[dateStr] = {};

      for (const equipe of dayEquipes) {
        const allCardIds = equipe.mandats || [];
        const lockedIds = allCardIds.filter(id => lockedCardIds.includes(id));
        const unlockedIds = allCardIds.filter(id => !lockedCardIds.includes(id));

        if (unlockedIds.length === 0) {
          result[dateStr][equipe.id] = allCardIds;
          continue;
        }

        const unlockedCards = unlockedIds.map(id => cardsData.find(c => c.id === id)).filter(Boolean);

        // Séparer RDV ce jour précis
        const rdvOnThisDay = unlockedCards.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
        const nonRdv = unlockedCards.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));

        rdvOnThisDay.sort((a, b) => (a.heure_rendez_vous || '00:00').localeCompare(b.heure_rendez_vous || '00:00'));
        nonRdv.sort((a, b) => {
          if (!a.date_limite_leve && !b.date_limite_leve) return 0;
          if (!a.date_limite_leve) return 1;
          if (!b.date_limite_leve) return -1;
          return a.date_limite_leve.localeCompare(b.date_limite_leve);
        });

        // Optimiser l'ordre géographique des cartes non-RDV
        let orderedNonRdv = nonRdv;
        const addressCards = nonRdv.filter(c => c.address);
        if (addressCards.length >= 2) {
          try {
            const { order } = await getOptimizedRoute(apiKey, addressCards.map(c => c.address));
            const optimizedAddressCards = order.map(i => addressCards[i]);
            const noAddressCards = nonRdv.filter(c => !c.address);
            orderedNonRdv = [...optimizedAddressCards, ...noAddressCards];
          } catch {
            // garder le tri par date_limite_leve
          }
        }

        // Construire la liste finale optimisée (non-lockées)
        const optimizedUnlocked = [...rdvOnThisDay, ...orderedNonRdv].map(c => c.id);

        // Calculer le temps total après optimisation et retirer des cartes si dépassement 9h
        const allAddresses = [...rdvOnThisDay, ...orderedNonRdv].filter(c => c.address).map(c => c.address);
        const travelSeconds = await getRouteDuration(apiKey, allAddresses);
        const travelHours = travelSeconds / 3600;

        // Retirer les cartes non-lockées qui feraient dépasser 9h
        let travailHeures = allCardIds.filter(id => lockedCardIds.includes(id))
          .reduce((sum, id) => { const c = cardsData.find(x => x.id === id); return sum + parseTempsPrevu(c?.temps_prevu); }, 0);

        const finalUnlocked = [];
        for (const cardId of optimizedUnlocked) {
          const c = cardsData.find(x => x.id === cardId);
          const h = parseTempsPrevu(c?.temps_prevu);
          // Approximation: on retirera si le total dépasse 9h
          if (travailHeures + h + travelHours <= MAX_HOURS) {
            finalUnlocked.push(cardId);
            travailHeures += h;
          } else {
            // Cette carte sera remise dans le pool à redistribuer
            cardsToSchedule.push(cardsData.find(x => x.id === cardId) || { id: cardId });
          }
        }

        // Reconstruire avec les lockées à leur position
        const finalOrder = [...allCardIds];
        let slotIdx = 0;
        for (let i = 0; i < finalOrder.length; i++) {
          if (!lockedCardIds.includes(finalOrder[i])) {
            finalOrder[i] = finalUnlocked[slotIdx++] || null;
          }
        }

        result[dateStr][equipe.id] = finalOrder.filter(Boolean);
      }
    }

    // --- ÉTAPE 2: Créer de nouvelles équipes sur les jours vides ---
    // Collecter les jours futurs visibles (même jours que dans equipes, ou les 14 prochains jours ouvrables)
    const futureDates = new Set(Object.keys(equipes).filter(d => d > today));
    // Ajouter les 14 prochains jours ouvrables si pas déjà dedans
    const addDate = new Date(); addDate.setDate(addDate.getDate() + 1);
    for (let i = 0; i < 14; i++) {
      while (addDate.getDay() === 0 || addDate.getDay() === 6) addDate.setDate(addDate.getDate() + 1);
      futureDates.add(addDate.toISOString().split('T')[0]);
      addDate.setDate(addDate.getDate() + 1);
    }

    // Trier les cartes non assignées par priorité: RDV d'abord, puis date_limite_leve
    cardsToSchedule.sort((a, b) => {
      // RDV en premier
      if (a.a_rendez_vous && !b.a_rendez_vous) return -1;
      if (!a.a_rendez_vous && b.a_rendez_vous) return 1;
      // Puis date limite
      if (!a.date_limite_leve && !b.date_limite_leve) return 0;
      if (!a.date_limite_leve) return 1;
      if (!b.date_limite_leve) return -1;
      return a.date_limite_leve.localeCompare(b.date_limite_leve);
    });

    // Pour chaque jour futur, si vide (aucune équipe), créer une équipe avec les techniciens disponibles
    const sortedFutureDates = [...futureDates].sort();

    for (const dateStr of sortedFutureDates) {
      if (cardsToSchedule.length === 0) break;
      
      const dayEquipes = equipes[dateStr] || [];
      if (dayEquipes.length > 0) continue; // ce jour a déjà des équipes

      // Trouver les techniciens disponibles ce jour (pas déjà dans une autre équipe ce jour)
      const usedTechIds = new Set((equipes[dateStr] || []).flatMap(eq => eq.techniciens));
      const freeTechs = availableTechniciens.filter(t => !usedTechIds.has(t.id));
      if (freeTechs.length === 0) continue;

      // Séparer les cartes qui ont un RDV ce jour précis
      const rdvCards = cardsToSchedule.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
      const otherCards = cardsToSchedule.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));

      // Construire une nouvelle équipe avec les cartes jusqu'à 9h
      const newEquipeCards = [...rdvCards];
      let travailH = rdvCards.reduce((sum, c) => sum + parseTempsPrevu(c.temps_prevu), 0);

      // Trier other cards par date limite
      otherCards.sort((a, b) => {
        if (!a.date_limite_leve && !b.date_limite_leve) return 0;
        if (!a.date_limite_leve) return 1;
        if (!b.date_limite_leve) return -1;
        return a.date_limite_leve.localeCompare(b.date_limite_leve);
      });

      for (const card of otherCards) {
        const h = parseTempsPrevu(card.temps_prevu);
        // Estimation conservative du trajet: 1h pour un groupe de cartes
        if (travailH + h + 1 <= MAX_HOURS) {
          newEquipeCards.push(card);
          travailH += h;
        }
      }

      if (newEquipeCards.length === 0) continue;

      // Optimiser l'ordre géographique
      const addressCards = newEquipeCards.filter(c => c.address);
      let orderedIds = newEquipeCards.map(c => c.id);
      if (addressCards.length >= 2) {
        try {
          const { order, durationSeconds } = await getOptimizedRoute(apiKey, addressCards.map(c => c.address));
          const travelH2 = durationSeconds / 3600;
          // Recalculer avec le vrai trajet
          let finalCards = [];
          let cumul = 0;
          const sortedByRdv = rdvCards.map(c => c.id);
          const sortedOthers = order.map(i => addressCards[i].id);
          const noAddr = newEquipeCards.filter(c => !c.address).map(c => c.id);
          for (const id of [...sortedByRdv, ...sortedOthers, ...noAddr]) {
            const c = newEquipeCards.find(x => x.id === id);
            if (!c) continue;
            const h = parseTempsPrevu(c.temps_prevu);
            if (cumul + h + travelH2 <= MAX_HOURS) {
              finalCards.push(id);
              cumul += h;
            }
          }
          orderedIds = finalCards.length > 0 ? finalCards : orderedIds;
        } catch {
          // garder l'ordre initial
        }
      }

      if (orderedIds.length === 0) continue;

      // Créer la nouvelle équipe dans la BD
      const techIds = freeTechs.slice(0, 2).map(t => t.id); // Prendre jusqu'à 2 techniciens
      const techInitials = freeTechs.slice(0, 2).map(t => t.prenom.charAt(0) + t.nom.charAt(0)).join('-');
      const newEquipeNom = `Équipe ${(dayEquipes.length + newEquipes.filter(e => e.dateStr === dateStr).length + 1)} - ${techInitials}`;

      const newEquipeData = {
        date_terrain: dateStr,
        nom: newEquipeNom,
        place_affaire: placeAffaire || 'Alma',
        techniciens: techIds,
        vehicules: [],
        equipements: [],
        mandats: orderedIds,
      };

      // Créer en BD
      const created = await base44.asServiceRole.entities.EquipeTerrain.create(newEquipeData);
      newEquipes.push({
        dateStr,
        equipe: { id: created.id, ...newEquipeData },
      });

      // Retirer les cartes planifiées du pool
      const plannedIds = new Set(orderedIds);
      cardsToSchedule = cardsToSchedule.filter(c => !plannedIds.has(c.id));

      // Ajouter dans result
      if (!result[dateStr]) result[dateStr] = {};
      result[dateStr][created.id] = orderedIds;
    }

    return Response.json({ result, newEquipes });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});