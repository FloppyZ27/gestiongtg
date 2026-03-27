import { base44 } from '@/api/base44Client';

/**
 * Transfère les documents du dossier temporaire vers le dossier numéroté
 * Appelé quand le statut change à "Mandats à ouvrir"
 */
export async function transferDocumentsToNumberedFolder(arpenteur, numeroDossier, clientInfo) {
  try {
    const initials = getArpenteurInitials(arpenteur).replace('-', '');
    const today = new Date().toISOString().split('T')[0];
    const clientName = `${clientInfo?.prenom || ''} ${clientInfo?.nom || ''}`.trim() || "Client";
    
    // Chemin du dossier temporaire (source)
    const tempFolderPath = `ARPENTEUR/${initials}/DOSSIER/TEMPORAIRE/${initials}-${clientName}-${today}/INTRANTS`;
    
    // Chemin du dossier numéroté (destination)
    const numberedFolderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/INTRANTS`;
    
    // Récupérer les fichiers du dossier temporaire
    const response = await base44.functions.invoke('sharepoint', {
      action: 'list',
      folderPath: tempFolderPath
    });
    
    const files = response.data?.files || [];
    
    if (files.length === 0) {
      console.log('Aucun document à transférer');
      return { success: true, filesTransferred: 0 };
    }
    
    let filesTransferred = 0;
    
    // Transférer chaque fichier
    for (const file of files) {
      try {
        // Télécharger le fichier
        const downloadResponse = await base44.functions.invoke('sharepoint', {
          action: 'getDownloadUrl',
          fileId: file.id
        });
        
        if (downloadResponse.data?.downloadUrl) {
          // Télécharger le contenu du fichier
          const fileContent = await fetch(downloadResponse.data.downloadUrl);
          const blob = await fileContent.blob();
          const base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
          });
          
          // Uploader vers le dossier numéroté
          await base44.functions.invoke('uploadToSharePoint', {
            folderPath: numberedFolderPath,
            fileName: file.name,
            fileContent: base64,
            contentType: file.file.mimeType || 'application/octet-stream'
          });
          
          filesTransferred++;
        }
      } catch (error) {
        console.error(`Erreur transfert fichier ${file.name}:`, error);
      }
    }
    
    // Supprimer les fichiers du dossier temporaire après transfert
    try {
      for (const file of files) {
        await base44.functions.invoke('sharepoint', {
          action: 'delete',
          fileId: file.id
        });
      }
    } catch (error) {
      console.error('Erreur suppression dossier temporaire:', error);
    }
    
    return { success: true, filesTransferred };
  } catch (error) {
    console.error('Erreur transfert documents:', error);
    return { success: false, error: error.message };
  }
}

function getArpenteurInitials(arpenteur) {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG",
    "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP",
    "Benjamin Larouche": "BL",
    "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "";
}