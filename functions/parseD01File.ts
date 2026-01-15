import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Mapping des codes cadastre aux noms
const CADASTRE_CODE_MAPPING = {
  "01": "Québec",
  "02": "Canton de Caron",
  "03": "Canton de de l'Île",
  "04": "Canton de Garnier",
  "05": "Village d'Héberville",
  "06": "Canton d'Hébertville-Station",
  "07": "Canton de Labarre",
  "08": "Canton de Mésy",
  "09": "Canton de Métabetchouan",
  "10": "Canton de Signay",
  "11": "Canton de Taillon",
  "12": "Canton d'Albanel",
  "13": "Canton de Charlevoix",
  "14": "Canton de Dablon",
  "15": "Canton de Dalmas",
  "16": "Canton de Demeules",
  "17": "Canton de Dequen",
  "18": "Canton de Dolbeau",
  "19": "Canton de Girard",
  "20": "Canton de Jogues",
  "21": "Canton de Malherbe",
  "22": "Canton de Milot",
  "23": "Canton de Normandin",
  "24": "Canton de Ouiatchouan",
  "25": "Canton de Racine",
  "26": "Canton de Roberval",
  "27": "Canton de Saint-Hilaire",
  "28": "Cité d'Arvida",
  "29": "Canton de Bagot",
  "30": "Village de Bagotville",
  "31": "Canton de Bégin",
  "32": "Canton de Boileau",
  "33": "Canton de Bourget",
  "34": "Canton de Chicoutimi",
  "35": "Paroisse de Chicoutimi",
  "36": "Ville de Chicoutimi",
  "37": "Canton de Dumas",
  "38": "Canton de Durocher",
  "39": "Canton de Falardeau",
  "40": "Canton de Ferland",
  "41": "Ville de Grande-Baie",
  "42": "Canton de Harvey",
  "43": "Canton de Hébert",
  "44": "Canton de Jonquière",
  "45": "Canton de Kénogami",
  "46": "Canton de Labrecque",
  "47": "Canton de Laterrière",
  "48": "Canton d'Otis",
  "49": "Canton de Périgny",
  "50": "Canton de Rouleau",
  "51": "Canton de Simard",
  "52": "Paroisse de Saint-Alexis",
  "53": "Paroisse de Saint-Alphonse",
  "54": "Ville de Sainte-Anne-de-Chicoutimi",
  "55": "Canton de Saint-Germains",
  "56": "Canton de Saint-Jean",
  "57": "Canton de Taché",
  "58": "Canton de Tremblay"
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileContent } = body;

    if (!fileContent) {
      return Response.json({ error: 'File content is required' }, { status: 400 });
    }

    // Décoder le contenu base64
    const decodedContent = atob(fileContent);
    const lines = decodedContent.split('\n');

    // Chercher la ligne commençant par "CO"
    let cadastreCode = null;
    for (const line of lines) {
      if (line.startsWith('CO')) {
        const parts = line.split(' ');
        if (parts.length >= 2) {
          cadastreCode = parts[1];
          break;
        }
      }
    }

    if (!cadastreCode) {
      return Response.json({ 
        error: 'Cadastre code not found in file',
        cadastreCode: null,
        cadastreName: null
      }, { status: 400 });
    }

    const cadastreName = CADASTRE_CODE_MAPPING[cadastreCode] || null;

    return Response.json({ 
      cadastreCode,
      cadastreName,
      success: true
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      cadastreCode: null,
      cadastreName: null
    }, { status: 500 });
  }
});