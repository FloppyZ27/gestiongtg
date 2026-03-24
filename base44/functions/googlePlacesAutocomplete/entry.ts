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

    // Utiliser Google Places Autocomplete avec restriction stricte autour d'Alma, QC
    // Bounding box approximatif de 100km autour d'Alma (48.55, -71.65)
    // ~0.9 degré lat = ~100km, ~1.3 degré lng = ~100km à cette latitude
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", query);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("language", "fr");
    url.searchParams.set("components", "country:ca");
    url.searchParams.set("location", "48.55,-71.65");
    url.searchParams.set("radius", "100000");
    url.searchParams.set("strictbounds", "true");
    url.searchParams.set("types", "address");

    const response = await fetch(url.toString());
    const data = await response.json();

    // Pour chaque prédiction, récupérer les détails pour avoir le code postal
    const predictions = await Promise.all(
      (data.predictions || []).map(async (p) => {
        try {
          const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
          detailsUrl.searchParams.set("place_id", p.place_id);
          detailsUrl.searchParams.set("key", apiKey);
          detailsUrl.searchParams.set("fields", "formatted_address,address_components");
          detailsUrl.searchParams.set("language", "fr");

          const detailsRes = await fetch(detailsUrl.toString());
          const detailsData = await detailsRes.json();

          const components = detailsData.result?.address_components || [];
          const postalComp = components.find(c => c.types.includes("postal_code"));
          const postalCode = postalComp?.short_name || "";

          let adresse = detailsData.result?.formatted_address || p.description;
          // Retirer ", Canada" à la fin
          adresse = adresse.replace(/, Canada$/, "");

          // Insérer le code postal si pas déjà présent
          if (postalCode && !adresse.includes(postalCode)) {
            adresse = adresse.replace(/, QC/, `, QC ${postalCode}`);
          }

          return { adresse, place_id: p.place_id };
        } catch {
          return { adresse: p.description, place_id: p.place_id };
        }
      })
    );

    return Response.json({ predictions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});