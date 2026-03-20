import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { userId, permissions_pages, permissions_informations } = await req.json();

        if (!userId) {
            return Response.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get current user data
        const targetUser = await base44.asServiceRole.entities.User.get(userId);
        
        // Update user permissions in the data object
        const updatedData = {
            ...targetUser.data,
            permissions_pages: permissions_pages || [],
            permissions_informations: permissions_informations || []
        };
        
        await base44.asServiceRole.entities.User.update(userId, {
            data: updatedData
        });

        return Response.json({ success: true, message: 'Permissions updated successfully' });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});