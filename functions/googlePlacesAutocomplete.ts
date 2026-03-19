import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query || query.length < 3) {
      return Response.json({ predictions: [] });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    // Utiliser Google Places Autocomplete avec bias vers Alma, QC (lat: 48.55, lng: -71.65)
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "fr");
    url.searchParams.set("components", "country:ca");
    // Bias vers Alma, QC avec rayon de 100km
    url.searchParams.set("location", "48.55,-71.65");
    url.searchParams.set("radius", "100000");
    url.searchParams.set("types", "address");

    const response = await fetch(url.toString());
    const data = await response.json();

    const predictions = (data.predictions || []).map(p => ({
      adresse: p.description,
      place_id: p.place_id
    }));

    return Response.json({ predictions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});