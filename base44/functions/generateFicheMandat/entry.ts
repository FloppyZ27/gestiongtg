import { jsPDF } from 'npm:jspdf@4.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { dossierData, clientInfo, workAddress, mandatType } = await req.json();

    if (!dossierData) {
      return Response.json({ error: 'Missing dossier data' }, { status: 400 });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // En-tête
    doc.setFontSize(10);
    doc.text('Girard Tremblay Gilbert Inc.', margin, yPos);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('FICHE MANDAT', pageWidth - margin - 40, yPos);
    doc.setFont(undefined, 'normal');
    yPos += 8;

    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 4;

    // Fonction helper pour ajouter une paire label/valeur
    const addFieldPair = (label, value, y, width = contentWidth / 2) => {
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text(label, margin, y);
      doc.setFont(undefined, 'normal');
      const textY = y + 3;
      const lines = doc.splitTextToSize(value || '', width - 5);
      doc.text(lines, margin + 2, textY);
      return y + 8;
    };

    // En-tête principal: Date du mandat, Numéro de dossier
    const col2X = margin + contentWidth / 2;
    doc.setFontSize(9);
    
    doc.setFont(undefined, 'bold');
    doc.text('Date du mandat :', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(new Date().toISOString().split('T')[0], margin + 2, yPos + 3);

    doc.setFont(undefined, 'bold');
    doc.text('Numéro de dossier :', col2X, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(dossierData.numero_dossier || '', col2X + 2, yPos + 3);
    
    yPos += 8;

    // Date de livraison, Type d'arpentage
    doc.setFont(undefined, 'bold');
    doc.text('Date de livraison :', margin, yPos);
    doc.setFont(undefined, 'normal');
    const deliveryDate = mandatType?.date_livraison || '';
    doc.text(deliveryDate, margin + 2, yPos + 3);

    doc.setFont(undefined, 'bold');
    doc.text('Type d\'arpentage :', col2X, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(mandatType?.type_mandat || '', col2X + 2, yPos + 3);

    // Checkbox pour FLEXIBLE/STRICTE
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    doc.text('☐ FLEXIBLE', pageWidth - margin - 40, yPos + 3);
    doc.text('☐ STRICTE', pageWidth - margin - 20, yPos + 3);

    yPos += 10;

    // Section CLIENT(S)
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('CLIENT(S)', margin, yPos);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    yPos += 5;

    const clientName = clientInfo ? `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim() : '';
    yPos = addFieldPair('Nom(s) :', clientName, yPos);
    yPos = addFieldPair('Cellulaire :', clientInfo?.telephone || '', yPos);
    yPos = addFieldPair('Travail :', '', yPos);
    yPos = addFieldPair('Adresse :', workAddress?.rue || '', yPos);
    yPos = addFieldPair('Municipalité :', workAddress?.ville || '', yPos);
    yPos = addFieldPair('Code postal :', workAddress?.code_postal || '', yPos);
    yPos = addFieldPair('Courriel :', clientInfo?.courriel || '', yPos);

    yPos += 3;

    // Section LOCALISATION DES TRAVAUX
    doc.setFont(undefined, 'bold');
    doc.text('LOCALISATION DES TRAVAUX', margin, yPos);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    yPos += 5;

    yPos = addFieldPair('Adresse :', workAddress?.rue || '', yPos);
    yPos = addFieldPair('Municipalité :', workAddress?.ville || '', yPos);
    yPos = addFieldPair('Code postal :', workAddress?.code_postal || '', yPos);
    yPos = addFieldPair('Lots :', workAddress?.numero_lot || '', yPos);

    yPos += 3;

    // Section INTERVENANTS
    doc.setFont(undefined, 'bold');
    doc.text('INTERVENANTS', margin, yPos);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    yPos += 5;

    yPos = addFieldPair('Notaire :', '', yPos);
    yPos = addFieldPair('Courtier :', '', yPos);

    yPos += 3;

    // Section PRIX
    doc.setFont(undefined, 'bold');
    doc.text('PRIX', margin, yPos);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos + 1, pageWidth - margin, yPos + 1);
    yPos += 5;

    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Opération', margin, yPos);
    doc.text('Prix', margin + 50, yPos);
    doc.text('Rabais', margin + 80, yPos);
    doc.text('Total', margin + 110, yPos);
    yPos += 5;

    doc.setFont(undefined, 'normal');
    const prixEstime = mandatType?.prix_estime || 0;
    const rabais = mandatType?.rabais || 0;
    const total = prixEstime - rabais;

    doc.text(mandatType?.type_mandat || '', margin, yPos);
    doc.text(prixEstime.toFixed(2), margin + 50, yPos);
    doc.text(rabais.toFixed(2), margin + 80, yPos);
    doc.text(total.toFixed(2), margin + 110, yPos);

    yPos += 8;

    // Options taxes
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text('Taxes :', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(mandatType?.taxes_incluses ? '☑ Incluses' : '☐ Incluses', margin + 15, yPos);
    doc.text(mandatType?.taxes_incluses ? '☐ Non-Incluses' : '☑ Non-Incluses', margin + 35, yPos);

    yPos += 6;
    doc.text('Frais dépôt :', margin, yPos);
    doc.text('☐ Oui', margin + 15, yPos);
    doc.text('☐ Non', margin + 30, yPos);

    yPos += 6;
    doc.text('Frais ouvert :', margin, yPos);
    doc.text('☐ Oui', margin + 15, yPos);
    doc.text('☐ Non', margin + 30, yPos);

    yPos += 8;
    doc.setFont(undefined, 'bold');
    doc.text('Total :', margin, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(total.toFixed(2) + ' $', margin + 15, yPos);

    // Générer le PDF en bytes
    const pdfBytes = doc.output('arraybuffer');

    // Retourner comme fichier téléchargeable
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fiche_Mandat_${dossierData.numero_dossier}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating fiche mandat:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});