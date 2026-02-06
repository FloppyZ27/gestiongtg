import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { origin, destination } = await req.json();

    if (!origin || !destination) {
      return Response.json({ error: 'Origin and destination are required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      return Response.json({ error: 'Google Maps API key not configured' }, { status: 500 });
    }

    // Construire l'URL pour l'API Distance Matrix
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.append('origins', origin);
    url.searchParams.append('destinations', destination);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('mode', 'driving');
    url.searchParams.append('units', 'metric');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      return Response.json({ 
        error: 'Google Maps API error', 
        details: data.status 
      }, { status: 500 });
    }

    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      return Response.json({ 
        error: 'Unable to calculate route',
        details: element?.status 
      }, { status: 400 });
    }

    // Retourner le temps en heures
    const durationInSeconds = element.duration.value;
    const durationInHours = durationInSeconds / 3600;

    return Response.json({
      durationHours: durationInHours,
      durationMinutes: Math.round(durationInSeconds / 60),
      distance: element.distance.text,
      duration: element.duration.text
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});