import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BUREAU_ADDRESS = "11 rue melancon est, Alma, QC";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { equipes, cardsData, lockedCardIds = [] } = await req.json();
    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) return Response.json({ error: 'Missing Google Maps API key' }, { status: 500 });

    // equipes: { dateStr: [{ id, mandats: [cardId, ...] }] }
    // cardsData: [{ id, address, date_limite_leve, a_rendez_vous, date_rendez_vous, heure_rendez_vous, technicien }]
    // lockedCardIds: [cardId, ...]

    const today = new Date().toISOString().split('T')[0];
    const result = {}; // dateStr -> equipeId -> ordered card ids

    for (const [dateStr, dayEquipes] of Object.entries(equipes)) {
      if (dateStr <= today) continue; // only future dates
      result[dateStr] = {};

      for (const equipe of dayEquipes) {
        const allCardIds = equipe.mandats || [];
        
        // Separate locked and unlocked cards
        const lockedIds = allCardIds.filter(id => lockedCardIds.includes(id));
        const unlockedIds = allCardIds.filter(id => !lockedCardIds.includes(id));

        if (unlockedIds.length <= 1) {
          // Nothing to optimize
          result[dateStr][equipe.id] = allCardIds;
          continue;
        }

        // Get card data for unlocked cards
        const unlockedCards = unlockedIds.map(id => cardsData.find(c => c.id === id)).filter(Boolean);

        // Step 1: Separate cards with RDV on this exact date (must keep, place first by hour)
        const rdvOnThisDay = unlockedCards.filter(c => c.a_rendez_vous && c.date_rendez_vous === dateStr);
        const nonRdv = unlockedCards.filter(c => !(c.a_rendez_vous && c.date_rendez_vous === dateStr));

        // Sort RDV cards by hour
        rdvOnThisDay.sort((a, b) => (a.heure_rendez_vous || '00:00').localeCompare(b.heure_rendez_vous || '00:00'));

        // Step 2: For non-RDV cards, sort by date_limite_leve ascending (null = last)
        nonRdv.sort((a, b) => {
          if (!a.date_limite_leve && !b.date_limite_leve) return 0;
          if (!a.date_limite_leve) return 1;
          if (!b.date_limite_leve) return -1;
          return a.date_limite_leve.localeCompare(b.date_limite_leve);
        });

        // Step 3: Try to optimize route order for non-RDV cards using Google Maps
        let orderedNonRdv = nonRdv;
        const addressCards = nonRdv.filter(c => c.address);

        if (addressCards.length >= 2) {
          try {
            const waypoints = addressCards.map(c => `via:${encodeURIComponent(c.address)}`).join('|');
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(BUREAU_ADDRESS)}&destination=${encodeURIComponent(BUREAU_ADDRESS)}&waypoints=optimize:true|${waypoints}&key=${apiKey}`;
            
            const resp = await fetch(url);
            const data = await resp.json();
            
            if (data.status === 'OK' && data.routes?.[0]?.waypoint_order) {
              const order = data.routes[0].waypoint_order;
              const optimizedAddressCards = order.map(i => addressCards[i]);
              // Re-merge cards without address (keep original relative order)
              const noAddressCards = nonRdv.filter(c => !c.address);
              orderedNonRdv = [...optimizedAddressCards, ...noAddressCards];
            }
          } catch (e) {
            // Fall back to date_limite_leve sort
            console.error('Maps optimization failed:', e.message);
          }
        }

        // Step 4: Build final ordered list: locked cards stay in place, unlocked slots filled
        const optimizedUnlocked = [...rdvOnThisDay, ...orderedNonRdv].map(c => c.id);
        
        // Rebuild full list: locked cards keep their positions
        const finalOrder = [...allCardIds];
        let unlockedSlotIndex = 0;
        for (let i = 0; i < finalOrder.length; i++) {
          if (!lockedCardIds.includes(finalOrder[i])) {
            finalOrder[i] = optimizedUnlocked[unlockedSlotIndex++] || finalOrder[i];
          }
        }

        result[dateStr][equipe.id] = finalOrder;
      }
    }

    return Response.json({ result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});