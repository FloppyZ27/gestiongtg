import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { userId, permissions_pages } = await req.json();

        if (!userId || !permissions_pages) {
            return Response.json({ error: 'userId and permissions_pages are required' }, { status: 400 });
        }

        // Update user permissions
        await base44.asServiceRole.entities.User.update(userId, {
            permissions_pages
        });

        return Response.json({ success: true, message: 'Permissions updated successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});