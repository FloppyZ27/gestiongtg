import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, event, msEventId } = body;
    // action: 'create' | 'update' | 'delete'

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
    const tenantId = Deno.env.get('MICROSOFT_TENANT_ID');

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

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Token error:', JSON.stringify(tokenData));
      return Response.json({ success: false, error: 'Failed to get MS access token', details: tokenData }, { status: 500 });
    }
    const accessToken = tokenData.access_token;

    const baseUrl = `https://graph.microsoft.com/v1.0/users/${user.email}/events`;

    if (action === 'delete') {
      if (!msEventId) return Response.json({ success: true });
      const res = await fetch(`${baseUrl}/${msEventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return Response.json({ success: res.ok || res.status === 404 });
    }

    const msEvent = {
      subject: event.titre,
      body: { contentType: 'text', content: event.description || '' },
      start: { dateTime: event.date_debut, timeZone: 'America/Toronto' },
      end: { dateTime: event.date_fin || event.date_debut, timeZone: 'America/Toronto' },
    };

    if (action === 'create') {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(msEvent),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error('MS Graph create error:', JSON.stringify(data));
        return Response.json({ success: false, error: data?.error?.message || 'Unknown error', details: data });
      }
      return Response.json({ success: true, msEventId: data.id });
    }

    if (action === 'update') {
      if (!msEventId) return Response.json({ success: false, error: 'No msEventId' });
      const res = await fetch(`${baseUrl}/${msEventId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(msEvent),
      });
      return Response.json({ success: res.ok });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});