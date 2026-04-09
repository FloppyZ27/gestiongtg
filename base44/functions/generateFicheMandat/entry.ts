import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG",
    "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP",
    "Benjamin Larouche": "BL",
    "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "XX";
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  }
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  if (addr.code_postal) parts.push(addr.code_postal);
  return parts.filter(p => p).join(', ');
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dossierData, mandatType } = await req.json();

    if (!dossierData || !mandatType) {
      return Response.json({ error: 'Missing required data' }, { status: 400 });
    }

    const arpenteurInitials = getArpenteurInitials(dossierData.arpenteur_geometre);
    const dossierNumber = dossierData.numero_dossier;
    const pdfFileName = `${arpenteurInitials}-${dossierNumber}_MANDAT.pdf`;
    const sharerpointPath = `ARPENTEUR/${arpenteurInitials}/DOSSIER/${arpenteurInitials}-${dossierNumber}`;

    // Créer le PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // En-tête
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('FICHE DE MANDAT', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 15;
    doc.setFontSize(10);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, pageWidth - 20, yPosition);

    // Informations dossier
    yPosition += 10;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('DOSSIER', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.text(`Numéro: ${arpenteurInitials}-${dossierNumber}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Arpenteur: ${dossierData.arpenteur_geometre}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Place d'affaire: ${dossierData.place_affaire || 'N/A'}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Date d'ouverture: ${dossierData.date_ouverture || 'N/A'}`, 25, yPosition);

    // Mandat
    yPosition += 12;
    doc.setFontSize(11);
    doc.text('MANDAT', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.text(`Type: ${mandatType.type_mandat || 'N/A'}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Date d'ouverture: ${mandatType.date_ouverture || 'N/A'}`, 25, yPosition);
    yPosition += 6;

    if (mandatType.adresse_travaux) {
      const adresse = formatAdresse(mandatType.adresse_travaux);
      if (adresse) {
        doc.text(`Adresse: ${adresse}`, 25, yPosition);
        yPosition += 6;
      }
    }

    if (mandatType.tache_actuelle) {
      doc.text(`Tâche actuelle: ${mandatType.tache_actuelle}`, 25, yPosition);
      yPosition += 6;
    }

    if (mandatType.prix_estime > 0) {
      doc.text(`Prix estimé: ${mandatType.prix_estime} $`, 25, yPosition);
      yPosition += 6;
    }

    if (mandatType.utilisateur_assigne) {
      doc.text(`Responsable: ${mandatType.utilisateur_assigne}`, 25, yPosition);
      yPosition += 6;
    }

    // Notes
    if (mandatType.notes) {
      yPosition += 8;
      doc.setFontSize(11);
      doc.text('NOTES', 20, yPosition);
      yPosition += 8;
      doc.setFontSize(10);
      const noteLines = doc.splitTextToSize(mandatType.notes, pageWidth - 40);
      doc.text(noteLines, 25, yPosition);
    }

    // Convertir le PDF en blob
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Créer un fichier multipart pour SharePoint
    const formData = new FormData();
    formData.append('file', pdfBlob, pdfFileName);

    // Appeler la fonction d'upload SharePoint
    const uploadResponse = await base44.functions.invoke('uploadToSharePoint', {
      fileName: pdfFileName,
      filePath: sharerpointPath,
      file: pdfBytes
    });

    if (!uploadResponse || !uploadResponse.data) {
      return Response.json({ 
        success: true,
        message: 'PDF généré mais upload SharePoint échoué',
        pdf: 'data:application/pdf;base64,' + btoa(String.fromCharCode(...new Uint8Array(pdfBytes)))
      });
    }

    return Response.json({
      success: true,
      message: 'PDF créé et uploadé avec succès',
      fileName: pdfFileName,
      filePath: sharerpointPath,
      fileUrl: uploadResponse.data.fileUrl
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return Response.json({ 
      error: error.message || 'Erreur lors de la génération du PDF'
    }, { status: 500 });
  }
});