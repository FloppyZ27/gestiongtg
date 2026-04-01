import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');

    if (!clientId || !clientSecret || !tenantId) {
      return Response.json({ error: 'Microsoft configuration missing' }, { status: 500 });
    }

    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

    // Use provided date range or fallback to next 30 days
    const now = new Date();
    const startDateTime = body.startDateTime || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDateTime = body.endDateTime || new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

    const eventsResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${user.email}/calendarview?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$top=100&$orderby=start/dateTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          Prefer: 'outlook.timezone="America/Toronto"',
        },
      }
    );

    if (!eventsResponse.ok) {
      const errText = await eventsResponse.text();
      return Response.json({ error: 'Failed to fetch calendar events', details: errText }, { status: 500 });
    }

    const eventsData = await eventsResponse.json();
    return Response.json({ success: true, events: eventsData.value || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});