import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { origin, destination, waypoints } = await req.json();
    if (!origin || !destination) return Response.json({ error: 'Origin and destination required' }, { status: 400 });

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.append('origin', origin);
    url.searchParams.append('destination', destination);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('mode', 'driving');
    if (waypoints && waypoints.length > 0) {
      url.searchParams.append('waypoints', 'optimize:true|' + waypoints.join('|'));
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      return Response.json({ error: 'Google Maps API error', details: data.status }, { status: 500 });
    }

    const totalSeconds = data.routes[0]?.legs?.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0) || 0;

    return Response.json({ durationSeconds: totalSeconds });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});