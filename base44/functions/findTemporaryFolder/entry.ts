import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { arpenteurInitials, clientName } = await req.json();

    console.log(`[FIND] Recherche dossier TEMPORAIRE:`);
    console.log(`[FIND]   arpenteurInitials: "${arpenteurInitials}"`);
    console.log(`[FIND]   clientName: "${clientName}"`);

    const tenantId = "31adb05b-e471-4daf-8831-4d46014be9b8";
    const clientId = "1291551b-48b1-4e33-beff-d3cb64fa888a";
    const clientSecret = "vTQ8Q~uhNn1dsGeHfGr3VZvLnQmkYZQ54~gcXcim";
    const driveId = "b!bS8k36WRSEKjpEG35EBzonsdkmTo4p5MvX4xFGWq8w1fkwthDsxdQL8_MK0t_B3b";

    const bodyString = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`;
    
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: bodyString
      }
    );

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error(`[FIND] Erreur token:`, JSON.stringify(tokenData));
      return Response.json({ error: 'Token error' }, { status: 500 });
    }

    const access_token = tokenData.access_token;

    // Construire le nom exact du dossier attendu: XX-ClientName-YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const expectedFolderName = `${arpenteurInitials}-${clientName}-${today}`;
    
    console.log(`[FIND]   Nom attendu: "${expectedFolderName}"`);

    // Construire le chemin complet du dossier attendu
    const temporairePath = `ARPENTEUR/${arpenteurInitials}/DOSSIER/TEMPORAIRE/${expectedFolderName}/INTRANTS`;
    const encodedPath = encodeURIComponent(temporairePath).replace(/%2F/g, '/');
    const checkUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}`;
    
    console.log(`[FIND] Vérification du chemin: ${temporairePath}`);

    const checkResponse = await fetch(checkUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (checkResponse.ok) {
      console.log(`[FIND] ✅ Dossier trouvé!`);
      return Response.json({ foundPath: temporairePath });
    }

    console.log(`[FIND] ❌ Dossier non trouvé avec la date exacte`);
    return Response.json({ foundPath: null, message: 'Dossier temporaire introuvable' });

  } catch (error) {
    console.error('[FIND] Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});