import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const ALMA_LAT = 48.5502;
const ALMA_LNG = -71.6491;

// Calcule la distance en km entre deux points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await req.json();

    if (!query || query.length < 2) {
      return Response.json({ suggestions: [] });
    }

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");

    // Recherche avec Google Places Autocomplete biaisée vers Alma, QC
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&location=${ALMA_LAT},${ALMA_LNG}&radius=100000&components=country:ca&language=fr&key=${apiKey}`;
    
    const autocompleteResponse = await fetch(autocompleteUrl);
    const autocompleteData = await autocompleteResponse.json();

    if (autocompleteData.status !== 'OK' && autocompleteData.status !== 'ZERO_RESULTS') {
      return Response.json({ error: autocompleteData.status }, { status: 400 });
    }

    const predictions = autocompleteData.predictions || [];
    
    // Récupérer les détails de chaque place pour obtenir les coordonnées
    const addressPromises = predictions.map(async (prediction) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,address_components,formatted_address&language=fr&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status !== 'OK') return null;

      const result = detailsData.result;
      const lat = result.geometry.location.lat;
      const lng = result.geometry.location.lng;
      
      // Calculer la distance depuis Alma
      const distance = calculateDistance(ALMA_LAT, ALMA_LNG, lat, lng);

      // Extraire les composants d'adresse
      const components = result.address_components || [];
      let streetNumber = '';
      let route = '';
      let locality = '';
      let postalCode = '';
      let province = '';

      components.forEach(component => {
        if (component.types.includes('street_number')) streetNumber = component.long_name;
        if (component.types.includes('route')) route = component.long_name;
        if (component.types.includes('locality')) locality = component.long_name;
        if (component.types.includes('postal_code')) postalCode = component.long_name;
        if (component.types.includes('administrative_area_level_1')) province = component.short_name;
      });

      return {
        address: prediction.description,
        rue: route,
        numero_civique: streetNumber,
        ville: locality,
        province: province,
        code_postal: postalCode,
        lat,
        lng,
        distance: Math.round(distance)
      };
    });

    const addresses = await Promise.all(addressPromises);
    
    // Filtrer dans un rayon de 100 km et trier par distance
    const filteredAddresses = addresses
      .filter(addr => addr && addr.distance <= 100)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 50);

    return Response.json({ suggestions: filteredAddresses });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});