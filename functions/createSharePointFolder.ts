import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const TENANT_ID = "31adb05b-e471-4daf-8831-4d46014be9b8";
const CLIENT_ID = "1291551b-48b1-4e33-beff-d3cb64fa888a";
const CLIENT_SECRET = "vTQ8Q~uhNn1dsGeHfGr3VZvLnQmkYZQ54~gcXcim";
const DRIVE_ID = "b!bS8k36WRSEKjpEG35EBzonsdkmTo4p5MvX4xFGWq8w1fkwthDsxdQL8_MK0t_B3b";

const ARPENTEUR_INITIALS = {
  "Samuel Guay": "SG",
  "Dany Gaboury": "DG",
  "Pierre-Luc Pilote": "PLP",
  "Benjamin Larouche": "BL",
  "Frédéric Gilbert": "FG"
};

async function getAccessToken() {
  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  
  const bodyString = `grant_type=client_credentials&client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&scope=${encodeURIComponent('https://graph.microsoft.com/.default')}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: bodyString
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Token error: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

async function getFolderContents(accessToken, folderPath) {
  const url = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${folderPath}:/children`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.value || [];
}

async function createFolder(accessToken, parentPath, folderName) {
  const createUrl = parentPath 
    ? `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${parentPath}:/children`
    : `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root/children`;
  
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      folder: {},
      "@microsoft.graph.conflictBehavior": "fail"
    })
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    if (errorData.error?.code === 'nameAlreadyExists') {
      return { exists: true };
    }
    throw new Error(`Erreur création dossier: ${errorData.error?.message || 'Erreur inconnue'}`);
  }

  return await createResponse.json();
}

async function copyFolderStructure(accessToken, sourcePath, destParentPath, destFolderName) {
  // Créer le dossier destination
  await createFolder(accessToken, destParentPath, destFolderName);
  
  const destPath = destParentPath ? `${destParentPath}/${destFolderName}` : destFolderName;
  
  // Récupérer le contenu du dossier source
  const contents = await getFolderContents(accessToken, sourcePath);
  
  // Copier récursivement les sous-dossiers
  for (const item of contents) {
    if (item.folder) {
      await copyFolderStructure(
        accessToken, 
        `${sourcePath}/${item.name}`, 
        destPath, 
        item.name
      );
    }
  }
}

async function folderExists(accessToken, folderPath) {
  const checkUrl = `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${folderPath}`;
  
  const checkResponse = await fetch(checkUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return checkResponse.ok;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { arpenteur_geometre, numero_dossier } = body;

    if (!arpenteur_geometre || !numero_dossier) {
      return Response.json({ error: 'Arpenteur et numéro de dossier requis' }, { status: 400 });
    }

    const initials = ARPENTEUR_INITIALS[arpenteur_geometre];
    if (!initials) {
      return Response.json({ error: 'Arpenteur non reconnu' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const dossierName = `${initials}-${numero_dossier}`;
    const templatePath = `ARPENTEUR/${initials}/DOSSIER/${initials}-0`;
    const destParentPath = `ARPENTEUR/${initials}/DOSSIER`;
    const destPath = `${destParentPath}/${dossierName}`;

    // Vérifier si le dossier existe déjà
    if (await folderExists(accessToken, destPath)) {
      return Response.json({ 
        success: true, 
        message: `Dossier ${dossierName} existe déjà`,
        path: destPath,
        alreadyExists: true
      });
    }

    // Vérifier si le dossier modèle existe
    const templateExists = await folderExists(accessToken, templatePath);
    
    if (templateExists) {
      // Copier la structure du dossier modèle
      await copyFolderStructure(accessToken, templatePath, destParentPath, dossierName);
    } else {
      // Créer le dossier et ses sous-dossiers standards
      await createFolder(accessToken, destParentPath, dossierName);
      
      // Créer les sous-dossiers standards
      const subfolders = ['INTRANTS', 'RESULTATS', 'FACTURES'];
      for (const subfolder of subfolders) {
        await createFolder(accessToken, destPath, subfolder);
      }
    }

    return Response.json({ 
      success: true, 
      message: `Dossier ${dossierName} créé avec succès${templateExists ? ' (structure copiée du modèle)' : ''}`,
      path: destPath,
      templateUsed: templateExists
    });

  } catch (error) {
    console.error("Erreur:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});