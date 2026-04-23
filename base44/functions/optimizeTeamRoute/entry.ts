import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Calcule la durée d'un trajet via Google Maps Directions API avec une séquence fixe (sans optimize)
async function getRouteDuration(origin, destination, waypoints, apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.append('origin', origin);
  url.searchParams.append('destination', destination);
  url.searchParams.append('key', apiKey);
  url.searchParams.append('mode', 'driving');
  if (waypoints && waypoints.length > 0) {
    url.searchParams.append('waypoints', waypoints.join('|'));
  }
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== 'OK') return Infinity;
  return data.routes[0]?.legs?.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) || 0;
}

// Nearest-neighbor heuristic pour minimiser le temps de trajet
// Les mandats avec une date de livraison sont groupés et priorisés par date de livraison croissante
// puis optimisés par proximité dans chaque groupe
async function optimizeOrder(origin, destination, mandats, apiKey) {
  if (mandats.length <= 1) return mandats.map((_, i) => i);

  // Séparer les mandats avec date de livraison de ceux sans
  const withDate = mandats.filter(m => m.date_livraison).sort((a, b) => new Date(a.date_livraison) - new Date(b.date_livraison));
  const withoutDate = mandats.filter(m => !m.date_livraison);

  // Pour chaque groupe de même date de livraison, optimiser l'ordre interne par nearest-neighbor
  // Grouper par date_livraison
  const groups = {};
  withDate.forEach(m => {
    const key = m.date_livraison;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  // Pour les mandats sans date, les optimiser ensemble
  const allGroups = [...Object.values(groups), withoutDate.length > 0 ? withoutDate : null].filter(Boolean);

  // Construire l'ordre optimal par nearest-neighbor sur les adresses
  // On utilise la distance Matrix API pour avoir les durées entre tous les points
  const allAddresses = mandats.map(m => m.adresse).filter(Boolean);
  if (allAddresses.length === 0) return mandats.map((_, i) => i);

  // Construire la matrice de distances
  const allPoints = [origin, ...allAddresses, destination];
  const matrixUrl = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  matrixUrl.searchParams.append('key', apiKey);
  matrixUrl.searchParams.append('mode', 'driving');
  matrixUrl.searchParams.append('origins', allPoints.join('|'));
  matrixUrl.searchParams.append('destinations', allPoints.join('|'));

  const matrixRes = await fetch(matrixUrl.toString());
  const matrixData = await matrixRes.json();

  if (matrixData.status !== 'OK') {
    // Fallback: retourner l'ordre par date de livraison
    const ordered = [...withDate, ...withoutDate];
    return ordered.map(m => mandats.indexOf(m));
  }

  // Extraire la matrice de durées
  const n = allPoints.length;
  const dur = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => matrixData.rows[i]?.elements[j]?.duration?.value ?? Infinity)
  );

  // Indices: 0 = origin, 1..m = mandats, m+1 = destination
  // On construit l'ordre optimal en respectant les groupes de date de livraison
  const result = [];
  const usedIndices = new Set();

  // Pour chaque groupe (dans l'ordre des dates), optimiser l'ordre interne
  let currentPos = 0; // index dans allPoints (0 = origin)

  for (const group of allGroups) {
    // Indices dans mandats[] pour ce groupe
    const groupMandatIndices = group.map(m => mandats.indexOf(m)).filter(i => i >= 0);
    // Nearest-neighbor au sein du groupe
    const remaining = [...groupMandatIndices];
    while (remaining.length > 0) {
      // Trouver le mandat le plus proche du point actuel
      let bestIdx = -1;
      let bestDur = Infinity;
      remaining.forEach(mi => {
        const pointIdx = mi + 1; // +1 car allPoints[0] = origin
        const d = dur[currentPos][pointIdx];
        if (d < bestDur) { bestDur = d; bestIdx = mi; }
      });
      if (bestIdx === -1) bestIdx = remaining[0];
      result.push(bestIdx);
      usedIndices.add(bestIdx);
      currentPos = bestIdx + 1;
      remaining.splice(remaining.indexOf(bestIdx), 1);
    }
  }

  return result;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { mandats, bureauAddress } = await req.json();
    // mandats: [{ id, adresse, date_livraison }]
    if (!mandats || mandats.length === 0) return Response.json({ optimizedOrder: [], durationSeconds: 0 });

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const origin = bureauAddress || '11 rue melancon est, Alma';
    const destination = origin;

    const optimizedIndices = await optimizeOrder(origin, destination, mandats, apiKey);
    const optimizedMandats = optimizedIndices.map(i => mandats[i]);
    const waypoints = optimizedMandats.map(m => m.adresse).filter(Boolean);

    // Calculer la durée totale avec cet ordre
    const durationSeconds = await getRouteDuration(origin, destination, waypoints, apiKey);

    return Response.json({
      optimizedOrder: optimizedMandats.map(m => m.id),
      durationSeconds,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});