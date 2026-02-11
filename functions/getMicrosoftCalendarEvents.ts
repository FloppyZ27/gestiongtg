import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      return Response.json({ error: 'Microsoft configuration missing' }, { status: 500 });
    }

    // Get access token from Microsoft
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'https://graph.microsoft.com/.default',
      }),
    });

    if (!tokenResponse.ok) {
      return Response.json({ error: 'Failed to get access token' }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get calendar events for today and next 7 days
    const now = new Date();
    const startDateTime = now.toISOString();
    const endDateTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const eventsResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${user.email}/calendarview?startDateTime=${startDateTime}&endDateTime=${endDateTime}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!eventsResponse.ok) {
      return Response.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
    }

    const eventsData = await eventsResponse.json();

    return Response.json({
      success: true,
      events: eventsData.value || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});