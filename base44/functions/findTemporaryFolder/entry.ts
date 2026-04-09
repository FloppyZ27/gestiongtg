import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { arpenteurInitials, clientName } = await req.json();

    console.log(`[FIND] ===== DÉBUT RECHERCHE =====`);
    console.log(`[FIND] arpenteurInitials: "${arpenteurInitials}"`);
    console.log(`[FIND] clientName: "${clientName}"`);

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

    // Lister les dossiers dans TEMPORAIRE
    const temporairePath = `ARPENTEUR/${arpenteurInitials}/DOSSIER/TEMPORAIRE`;
    const encodedPath = encodeURIComponent(temporairePath).replace(/%2F/g, '/');
    const listUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodedPath}:/children`;
    
    console.log(`[FIND] Listage: ${temporairePath}`);
    
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!listResponse.ok) {
      console.log(`[FIND] Dossier TEMPORAIRE non trouvé (404)`);
      return Response.json({ foundPath: null, message: 'Dossier TEMPORAIRE introuvable' });
    }

    const listData = await listResponse.json();
    const folders = (listData.value || []).filter(item => item.folder);
    
    console.log(`[FIND] ${folders.length} dossier(s) trouvé(s):`);
    folders.forEach(f => console.log(`[FIND]   - "${f.name}"`));

    // Format attendu: XX-ClientName-YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const arpenteurLower = arpenteurInitials.toLowerCase();
    const clientNameLower = clientName.toLowerCase();
    
    console.log(`[FIND] Critères de recherche:`);
    console.log(`[FIND]   - arpenteur: "${arpenteurLower}"`);
    console.log(`[FIND]   - client: "${clientNameLower}"`);
    console.log(`[FIND]   - date: "${today}"`);
    console.log(`[FIND] Format attendu: "${arpenteurLower}-${clientNameLower}-${today}"`);
    
    // Chercher avec la date exacte
    let matchingFolder = folders.find(folder => {
      const folderName = folder.name.toLowerCase();
      const match = folderName.includes(`${arpenteurLower}-`) && 
                    folderName.includes(clientNameLower) && 
                    folderName.includes(today);
      if (match) {
        console.log(`[FIND] ✓ Correspondance AVEC date: "${folder.name}"`);
      }
      return match;
    });

    if (matchingFolder) {
      const foundPath = `${temporairePath}/${matchingFolder.name}/INTRANTS`;
      console.log(`[FIND] ✅ Dossier trouvé: ${foundPath}`);
      return Response.json({ foundPath, folderName: matchingFolder.name });
    }

    // Fallback: chercher sans date si pas trouvé
    console.log(`[FIND] ⚠️ Aucune correspondance avec date exacte, recherche fallback...`);
    matchingFolder = folders.find(folder => {
      const folderName = folder.name.toLowerCase();
      const match = folderName.includes(`${arpenteurLower}-`) && folderName.includes(clientNameLower);
      if (match) {
        console.log(`[FIND] ✓ Correspondance SANS date: "${folder.name}"`);
      }
      return match;
    });

    if (matchingFolder) {
      const foundPath = `${temporairePath}/${matchingFolder.name}/INTRANTS`;
      console.log(`[FIND] ⚠️ Trouvé (fallback): ${foundPath}`);
      return Response.json({ foundPath, folderName: matchingFolder.name });
    }

    console.log(`[FIND] ❌ Aucun dossier correspondant`);
    return Response.json({ foundPath: null, message: 'Aucun dossier temporaire trouvé' });

  } catch (error) {
    console.error('[FIND] Erreur:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});