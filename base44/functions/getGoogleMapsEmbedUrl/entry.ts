import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination, waypoints } = await req.json();

    const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Construire l'URL pour Google Maps Embed API
    const waypointsParam = waypoints.join('|');
    const embedUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypointsParam)}&mode=driving`;

    return Response.json({ url: embedUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});