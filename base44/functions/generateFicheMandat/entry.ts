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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-CA');
  } catch { return dateStr; }
};

const checkbox = (doc, x, y, checked = false) => {
  doc.rect(x, y - 3, 3.5, 3.5);
  if (checked) {
    doc.text('X', x + 0.5, y, { baseline: 'bottom' });
  }
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

    const { dossierData, mandatType, clientsData, notairesData } = await req.json();

    if (!dossierData) {
      return Response.json({ error: 'Missing required data' }, { status: 400 });
    }

    const mandat = mandatType || dossierData.mandats?.[0] || {};
    const arpInitials = getArpenteurInitials(dossierData.arpenteur_geometre);
    const dossierNum = dossierData.numero_dossier || '';
    const pdfFileName = `FICHE_MANDAT_${arpInitials}-${dossierNum}.pdf`;

    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pW = doc.internal.pageSize.getWidth();   // 215.9
    const pH = doc.internal.pageSize.getHeight();  // 279.4
    const L = 10; // left margin
    const R = pW - 10; // right margin
    const W = R - L;

    // ── Helper functions ──────────────────────────────────────────────
    const hline = (y) => { doc.line(L, y, R, y); };
    const vline = (x, y1, y2) => { doc.line(x, y1, x, y2); };
    const cell = (text, x, y, w, h, opts = {}) => {
      doc.rect(x, y, w, h);
      if (text) {
        doc.setFontSize(opts.fontSize || 8);
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        const tx = x + (opts.center ? w / 2 : 2);
        const ty = y + h / 2 + (opts.fontSize || 8) * 0.35 / 2;
        doc.text(String(text), tx, ty, { align: opts.center ? 'center' : 'left', baseline: 'middle' });
      }
    };
    const labelVal = (label, val, x, y, labelW, totalW, h = 6) => {
      doc.rect(x, y, totalW, h);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(label + ' :', x + 1, y + h / 2, { baseline: 'middle' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(val || ''), x + labelW + 2, y + h / 2, { baseline: 'middle' });
    };
    const sectionHeader = (title, x, y, w, h = 5) => {
      doc.setFillColor(200, 200, 200);
      doc.rect(x, y, w, h, 'FD');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(title, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
      doc.setFont('helvetica', 'normal');
    };

    // ── HEADER ──────────────────────────────────────────────────────
    doc.rect(L, 10, W, 14);
    // Left: company
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Girard Tremblay Gilbert Inc.', L + 3, 18, { baseline: 'middle' });
    // Right: FICHE MANDAT
    doc.setFontSize(18);
    doc.text('FICHE MANDAT', R - 3, 18, { align: 'right', baseline: 'middle' });
    doc.setFont('helvetica', 'normal');

    // Rev line top-left
    doc.setFontSize(6.5);
    doc.text('Rév. 13    Date : 2 juin 2022', L, 9);

    // ── Row 1: Date mandat | N° dossier ───────────────────────────────
    let y = 24;
    const halfW = W / 2;
    labelVal('Date du mandat', formatDate(dossierData.date_ouverture), L, y, 22, halfW);
    vline(L + halfW, y, y + 6);
    // N° dossier
    doc.rect(L + halfW, y, halfW, 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Numéro de dossier :', L + halfW + 1, y + 3, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${arpInitials}-${dossierNum}`, L + halfW + 30, y + 3, { baseline: 'middle' });

    // ── Row 2: Date livraison | FLEXIBLE/STRICTE ──────────────────────
    y += 6;
    labelVal('Date de livraison', formatDate(mandat.date_livraison), L, y, 22, halfW);
    doc.rect(L + halfW, y, halfW, 6);
    // FLEXIBLE checkbox
    checkbox(doc, L + halfW + 2, y + 4.5);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('FLEXIBLE', L + halfW + 6.5, y + 3, { baseline: 'middle' });
    // STRICTE checkbox
    checkbox(doc, L + halfW + halfW / 2, y + 4.5);
    doc.text('STRICTE', L + halfW + halfW / 2 + 4.5, y + 3, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');

    // ── Row 3: Type d'arpentage ──────────────────────────────────────
    y += 6;
    doc.rect(L, y, W, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text("Type d'arpentage :", L + 1, y + 3);
    doc.setFont('helvetica', 'normal');

    const typeMap = {
      "Certificat de localisation": "CL",
      "Description Technique": "DT",
      "Piquetage": "PIQ",
      "Projet de lotissement": "LOTIS",
      "Implantation": "IMP",
      "OCTR": "OCTR",
      "Levé topographique": "LEVÉ",
      "Bornage": "BORN",
    };
    const activeTypes = (dossierData.mandats || [mandat]).map(m => typeMap[m.type_mandat] || null);

    const row1Types = [['CL', 'Certificat de localisation'], ['DT', 'Description Technique'], ['PIQ', 'Piquetage'], ['LOTIS', 'Projet de lotissement'], ['AUT', null]];
    const row2Types = [['IMP *', 'Implantation'], ['OCTR', 'OCTR'], ['LEVÉ', 'Levé topographique'], ['BORN', 'Bornage'], ['', null]];

    let cx = L + 28;
    for (const [label, key] of row1Types) {
      const checked = key ? activeTypes.includes(typeMap[key] || label) : false;
      checkbox(doc, cx, y + 5, checked);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.text(label, cx + 4.5, y + 3.5, { baseline: 'middle' });
      cx += 30;
    }
    cx = L + 28;
    for (const [label, key] of row2Types) {
      if (!label) { cx += 30; continue; }
      const checked = key ? activeTypes.includes(typeMap[key] || label) : false;
      checkbox(doc, cx, y + 10, checked);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
      doc.text(label, cx + 4.5, y + 8.5, { baseline: 'middle' });
      cx += 30;
    }
    doc.setFont('helvetica', 'normal');

    // ── CLIENTS section ──────────────────────────────────────────────
    y += 11;
    sectionHeader('CLIENT(S)', L, y, W);
    y += 5;

    const client = clientsData?.[0] || {};
    const clientNom = client ? `${client.prenom || ''} ${client.nom || ''}`.trim() : '';
    const clientTel = client.telephones?.find(t => t.actuel)?.telephone || client.telephones?.[0]?.telephone || '';
    const clientEmail = client.courriels?.find(c => c.actuel)?.courriel || client.courriels?.[0]?.courriel || '';
    const clientAddr = client.adresses?.find(a => a.actuelle)?.rue || '';
    const clientVille = client.adresses?.find(a => a.actuelle)?.ville || '';
    const clientCP = client.adresses?.find(a => a.actuelle)?.code_postal || '';

    const col1 = W * 0.52;
    const col2 = W - col1;

    // Nom | Cellulaire
    doc.rect(L, y, col1, 5); doc.rect(L + col1, y, col2, 5);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold');
    doc.text('Nom(s) :', L + 1, y + 2.5, { baseline: 'middle' });
    doc.text('Cellulaire :', L + col1 + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.text(clientNom, L + 14, y + 2.5, { baseline: 'middle' });
    doc.text(clientTel, L + col1 + 17, y + 2.5, { baseline: 'middle' });

    y += 5;
    // blank | Travail
    doc.rect(L, y, col1, 5); doc.rect(L + col1, y, col2, 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Travail :', L + col1 + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');

    y += 5;
    // Adresse | Maison
    doc.rect(L, y, col1, 5); doc.rect(L + col1, y, col2, 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Adresse :', L + 1, y + 2.5, { baseline: 'middle' });
    doc.text('Maison :', L + col1 + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.text(clientAddr, L + 17, y + 2.5, { baseline: 'middle' });

    y += 5;
    // Municipalité | Autre
    doc.rect(L, y, col1, 5); doc.rect(L + col1, y, col2, 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Municipalité :', L + 1, y + 2.5, { baseline: 'middle' });
    doc.text('Autre :', L + col1 + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.text(clientVille, L + 22, y + 2.5, { baseline: 'middle' });

    y += 5;
    // Code postal
    doc.rect(L, y, col1, 5); doc.rect(L + col1, y, col2, 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Code postal :', L + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.text(clientCP, L + 22, y + 2.5, { baseline: 'middle' });

    y += 5;
    // Courriel
    doc.rect(L, y, W, 5);
    doc.setFont('helvetica', 'bold');
    doc.text('Courriel :', L + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    doc.text(clientEmail, L + 17, y + 2.5, { baseline: 'middle' });

    // ── LOCALISATION / NOTES section ─────────────────────────────────
    y += 5;
    sectionHeader('LOCALISATION DES TRAVAUX', L, y, col1);
    sectionHeader('FICHIER :', L + col1, y, col2);
    y += 5;

    const addrTravaux = mandat.adresse_travaux || {};
    const addrStr = [addrTravaux.numeros_civiques?.[0], addrTravaux.rue].filter(Boolean).join(' ');
    const villeStr = addrTravaux.ville || '';
    const cpStr = addrTravaux.code_postal || '';
    const lotsStr = (mandat.lots_texte) || '';

    const notesH = 30;
    doc.rect(L, y, col1, notesH);
    doc.rect(L + col1, y, col2, notesH);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', L + col1 + col2 / 2, y + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    // Adresse travaux
    let ty2 = y + 5;
    doc.setFont('helvetica', 'bold'); doc.text('Adresse :', L + 1, ty2, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal'); doc.text(addrStr, L + 17, ty2, { baseline: 'middle' });
    ty2 += 5;
    doc.setFont('helvetica', 'bold'); doc.text('Municipalité :', L + 1, ty2, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal'); doc.text(villeStr, L + 22, ty2, { baseline: 'middle' });
    ty2 += 5;
    doc.setFont('helvetica', 'bold'); doc.text('Code postal :', L + 1, ty2, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal'); doc.text(cpStr, L + 22, ty2, { baseline: 'middle' });
    ty2 += 5;
    // Identique checkbox
    checkbox(doc, L + 1, ty2 + 0.5);
    doc.setFontSize(7); doc.text("Identique à l'adresse contact", L + 5.5, ty2, { baseline: 'middle' });
    ty2 += 5;
    checkbox(doc, L + 1, ty2 + 0.5);
    doc.text("Litige avec voisin", L + 5.5, ty2, { baseline: 'middle' });
    ty2 += 5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('Lots :', L + 1, ty2, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal'); doc.text(lotsStr, L + 11, ty2, { baseline: 'middle' });

    // ── INTERVENANTS ─────────────────────────────────────────────────
    y += notesH;
    sectionHeader('INTERVENANTS', L, y, W);
    y += 5;

    const notaire = notairesData?.[0] || {};
    const notaireNom = notaire ? `${notaire.prenom || ''} ${notaire.nom || ''}`.trim() : '';
    const courtierNom = ''; // from dossierData.courtiers_ids

    const rows = [
      ['Notaire :', notaireNom],
      ['Courtier :', courtierNom],
      ['Autre :', ''],
    ];
    for (const [label, val] of rows) {
      doc.rect(L, y, W, 5);
      doc.setFont('helvetica', 'bold'); doc.text(label, L + 1, y + 2.5, { baseline: 'middle' });
      doc.setFont('helvetica', 'normal'); doc.text(val, L + 18, y + 2.5, { baseline: 'middle' });
      y += 5;
    }
    // Mandant / Propriétaire
    doc.rect(L, y, W, 5);
    doc.setFont('helvetica', 'bold'); doc.text('Mandant :', L + 1, y + 2.5, { baseline: 'middle' });
    checkbox(doc, L + 19, y + 4); doc.text('Identique client', L + 23, y + 2.5, { baseline: 'middle' });
    checkbox(doc, L + 50, y + 4); doc.text('Autre :', L + 54, y + 2.5, { baseline: 'middle' });
    y += 5;
    doc.rect(L, y, W, 5);
    doc.setFont('helvetica', 'bold'); doc.text('Propriétaire :', L + 1, y + 2.5, { baseline: 'middle' });
    checkbox(doc, L + 22, y + 4); doc.text('Identique client', L + 26, y + 2.5, { baseline: 'middle' });
    checkbox(doc, L + 53, y + 4); doc.text('Autre :', L + 57, y + 2.5, { baseline: 'middle' });

    // ── LIVRAISON ────────────────────────────────────────────────────
    y += 5;
    sectionHeader('LIVRAISON', L, y, W);
    y += 5;
    doc.rect(L, y, W, 5);
    doc.setFont('helvetica', 'bold'); doc.text('Date de signature:', L + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal'); doc.text(formatDate(mandat.date_signature), L + 30, y + 2.5, { baseline: 'middle' });

    // EN MAIN PROPRE header
    y += 5;
    const colMP = W * 0.15, colDocs = W * 0.5, colFact = W - colMP - colDocs;
    sectionHeader('EN MAIN PROPRE :', L, y, colMP, 4);
    sectionHeader('DOCUMENTS', L + colMP, y, colDocs, 4);
    sectionHeader('FACTURE', L + colMP + colDocs, y, colFact, 4);

    y += 4;
    const deliveryRows = ['Client', 'Notaire', 'Courtier', 'Aut. :'];
    for (const row of deliveryRows) {
      doc.rect(L, y, colMP, 5); doc.rect(L + colMP, y, colDocs, 5); doc.rect(L + colMP + colDocs, y, colFact, 5);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.text(row, L + colMP - 1, y + 2.5, { align: 'right', baseline: 'middle' });
      // doc checkbox Poste, Courriel
      let dx = L + colMP + 2;
      for (const opt of ['Poste', 'Courriel']) {
        checkbox(doc, dx, y + 4); doc.setFont('helvetica', 'normal'); doc.text(opt, dx + 4.5, y + 2.5, { baseline: 'middle' }); dx += 25;
      }
      dx = L + colMP + colDocs + 2;
      for (const opt of ['Papier', 'Courriel']) {
        checkbox(doc, dx, y + 4); doc.text(opt, dx + 4.5, y + 2.5, { baseline: 'middle' }); dx += 25;
      }
      y += 5;
    }

    // ── PRIX ─────────────────────────────────────────────────────────
    sectionHeader('PRIX', L, y, W);
    y += 5;

    const pCol = [W * 0.3, W * 0.15, W * 0.15, W * 0.15];
    const pHeaders = ['Opération', 'Prix', 'Rabais', 'Total'];
    let px = L;
    for (let i = 0; i < pHeaders.length; i++) {
      cell(pHeaders[i], px, y, pCol[i], 5, { bold: true, center: true, fontSize: 7.5 });
      px += pCol[i];
    }
    // Taxes info on right
    const rightX = L + pCol[0] + pCol[1] + pCol[2] + pCol[3];
    const rightW = W - (rightX - L);
    doc.rect(rightX, y, rightW, 20);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('Taxes :', rightX + 1, y + 3);
    checkbox(doc, rightX + 14, y + 4.5); doc.text('Non-Incluses', rightX + 18, y + 3);
    checkbox(doc, rightX + 38, y + 4.5); doc.text('Incluses', rightX + 42, y + 3);
    doc.text('Frais dépôt :', rightX + 1, y + 9);
    checkbox(doc, rightX + 18, y + 10.5); doc.text('Oui', rightX + 22, y + 9);
    checkbox(doc, rightX + 32, y + 10.5); doc.text('Non', rightX + 36, y + 9);
    doc.text('Frais ouvert :', rightX + 1, y + 15);
    checkbox(doc, rightX + 19, y + 16.5); doc.text('Oui', rightX + 23, y + 15);
    checkbox(doc, rightX + 33, y + 16.5); doc.text('Non', rightX + 37, y + 15);

    y += 5;
    // Mandat rows
    for (const m of (dossierData.mandats || [mandat])) {
      if (!m.type_mandat) continue;
      const total = (m.prix_estime || 0) - (m.rabais || 0);
      px = L;
      for (let i = 0; i < pCol.length; i++) {
        const vals = [m.type_mandat, m.prix_estime ? `${m.prix_estime} $` : '', m.rabais ? `${m.rabais} $` : '', total > 0 ? `${total.toFixed(2)} $` : ''];
        cell(vals[i], px, y, pCol[i], 5, { fontSize: 7 });
        px += pCol[i];
      }
      y += 5;
    }
    // Modalités
    doc.rect(L, y, rightX - L, 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('Modalités :', L + 1, y + 2.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'normal');
    y += 5;
    doc.rect(L, y, rightX - L, 5);
    checkbox(doc, L + 1, y + 4); doc.text('*Piquetage suggéré :', L + 5, y + 2.5, { baseline: 'middle' });
    checkbox(doc, L + 35, y + 4); doc.text('Oui', L + 39, y + 2.5, { baseline: 'middle' });
    checkbox(doc, L + 50, y + 4); doc.text('Non', L + 54, y + 2.5, { baseline: 'middle' });
    y += 5;
    // Total row
    px = L;
    for (let i = 0; i < pCol.length; i++) {
      const totalAll = (dossierData.mandats || [mandat]).reduce((s, m) => s + ((m.prix_estime || 0) - (m.rabais || 0)), 0);
      const vals = ['', '', 'Total', totalAll > 0 ? `${totalAll.toFixed(2)} $` : ''];
      cell(vals[i], px, y, pCol[i], 5, { bold: i === 2, center: i === 2, fontSize: 7.5 });
      px += pCol[i];
    }

    // ── RÉFÉRENCE ────────────────────────────────────────────────────
    y += 5;
    sectionHeader('RÉFÉRENCE', L, y, W);
    y += 5;
    doc.rect(L, y, W, 8);
    const refs = ['Courtier', 'Notaire', 'Connaissance', 'Site Web', 'Bouche à oreille', 'Bottin', 'Publicité', 'Réseaux sociaux', 'Greffe', 'Club sociaux/BNI', 'Magasineux', 'Anc. Client', 'Autre'];
    let rx = L + 1; let ry = y + 2;
    for (let i = 0; i < refs.length; i++) {
      if (i === 5) { rx = L + 1; ry = y + 6; }
      checkbox(doc, rx, ry + 1); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
      doc.text(refs[i], rx + 4.5, ry, { baseline: 'middle' });
      rx += i < 4 ? 28 : (i < 9 ? 28 : 26);
    }

    // ── VALIDATION ──────────────────────────────────────────────────
    y += 8;
    sectionHeader('VALIDATION DES OBSERVATIONS', L, y, W);
    y += 5;
    doc.rect(L, y, W, 22);
    doc.setFontSize(6.8); doc.setFont('helvetica', 'normal');
    const validText = `Je, soussigné ${dossierData.arpenteur_geometre || ''}, arpenteur-géomètre, certifie par la présente avoir pris personnellement connaissance des observations relatives aux éléments visés aux paragraphes 9 et 13 à 17 du premier alinéa de l'article 9 du Règlement sur la norme de pratique relative au certificat de localisation et les avoir validées.`;
    const lines = doc.splitTextToSize(validText, W - 4);
    doc.text(lines, L + 2, y + 3);
    const ly = y + 3 + lines.length * 3;
    checkbox(doc, L + 2, ly + 2.5); doc.text('Visite des lieux', L + 7, ly + 1, { baseline: 'middle' });
    checkbox(doc, L + 2, ly + 7); doc.text('Photographies', L + 7, ly + 5.5, { baseline: 'middle' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('Date de la validation :', L + 2, y + 18.5, { baseline: 'middle' });
    doc.line(L + 30, y + 18.5, L + 65, y + 18.5);
    doc.text('Signature :', L + 70, y + 18.5, { baseline: 'middle' });
    doc.line(L + 85, y + 18.5, R, y + 18.5);

    // ── FERMETURE ────────────────────────────────────────────────────
    y += 22;
    sectionHeader('FERMETURE', L, y, W);
    y += 5;
    doc.rect(L, y, W / 2, 6); doc.rect(L + W / 2, y, W / 2, 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('Date de fermeture :', L + 1, y + 3, { baseline: 'middle' });
    doc.text('Signature :', L + W / 2 + 1, y + 3, { baseline: 'middle' });

    // ── REV footer ───────────────────────────────────────────────────
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ── PAGE 2 : TEMPS ───────────────────────────────────────────────
    doc.addPage();
    doc.setFontSize(6.5); doc.text('Rév. 13    Date : 2 juin 2022', L, 9);
    sectionHeader('TEMPS', L, 12, W, 6);

    const tCols = [W * 0.2, W * 0.25, W * 0.4, W * 0.15];
    const tHeaders = ['DATE', 'EMPLOYÉ(S)', 'DESCRIPTION', 'TEMPS'];
    let ty3 = 18;
    let tx3 = L;
    for (let i = 0; i < tCols.length; i++) {
      cell(tHeaders[i], tx3, ty3, tCols[i], 6, { bold: true, center: true, fontSize: 8 });
      tx3 += tCols[i];
    }
    ty3 += 6;

    const subSections = ['PLANIFICATION', 'TERRAIN', 'RECHERCHES ET ANALYSE FONCIÈRE', 'TRAITEMENT ET DESSIN', 'RAPPORT/RÉDACTION'];
    const subRows = [2, 6, 4, 4, 3];
    for (let si = 0; si < subSections.length; si++) {
      // sub header
      doc.setFillColor(220, 220, 220);
      doc.rect(L, ty3, W, 5, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(subSections[si], L + 2, ty3 + 2.5, { baseline: 'middle' });
      doc.setFont('helvetica', 'normal');
      ty3 += 5;
      for (let r = 0; r < subRows[si]; r++) {
        tx3 = L;
        for (let c = 0; c < tCols.length; c++) {
          doc.rect(tx3, ty3, tCols[c], 6);
          tx3 += tCols[c];
        }
        ty3 += 6;
      }
    }

    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal');
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ── OUTPUT ───────────────────────────────────────────────────────
    const pdfBytes = doc.output('arraybuffer');
    const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

    return Response.json({
      success: true,
      fileName: pdfFileName,
      pdf: `data:application/pdf;base64,${base64}`
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return Response.json({ error: error.message || 'Erreur' }, { status: 500 });
  }
});