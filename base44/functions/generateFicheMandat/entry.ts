import { jsPDF } from 'npm:jspdf@2.5.1';
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
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('fr-CA');
  } catch { return dateStr; }
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dossierData, mandatType, clientsData, notairesData } = await req.json();
    if (!dossierData) return Response.json({ error: 'Missing required data' }, { status: 400 });

    const mandat = mandatType || dossierData.mandats?.[0] || {};
    const arpInitials = getArpenteurInitials(dossierData.arpenteur_geometre);
    const dossierNum = dossierData.numero_dossier || '';
    const pdfFileName = `FICHE_MANDAT_${arpInitials}-${dossierNum}.pdf`;

    // Fetch logo
    let logoBase64 = null;
    try {
      const logoResp = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png');
      if (logoResp.ok) {
        const buf = await logoResp.arrayBuffer();
        const u8 = new Uint8Array(buf);
        let b64 = '';
        for (let i = 0; i < u8.length; i += 8192) b64 += String.fromCharCode(...u8.subarray(i, i + 8192));
        logoBase64 = btoa(b64);
      }
    } catch(_) {}

    // ── Document setup ──────────────────────────────────────────────────────
    const doc = new jsPDF({ unit: 'mm', format: 'legal' });
    const pW = doc.internal.pageSize.getWidth();   // 215.9
    const pH = doc.internal.pageSize.getHeight();  // 279.4
    const L = 10;
    const R = pW - 10;
    const W = R - L;
    const rH = 5.5; // standard row height

    // ── Helpers ─────────────────────────────────────────────────────────────
    const T  = () => { doc.setFont('times', 'normal'); };
    const TB = () => { doc.setFont('times', 'bold'); };
    const sz = (s) => doc.setFontSize(s);
    const lw = (w) => doc.setLineWidth(w);

    const checkbox = (x, y, size = 2.8) => {
      lw(0.3);
      doc.rect(x, y - size, size, size);
    };

    const sectionBar = (title, x, y, w, h = 5) => {
      doc.setFillColor(180, 180, 180);
      doc.rect(x, y, w, h, 'FD');
      TB(); sz(9);
      doc.text(title, x + w / 2, y + h / 2 + 0.3, { align: 'center', baseline: 'middle' });
      T(); sz(9);
    };

    const hline = (y) => { lw(0.3); doc.line(L, y, R, y); };
    const vline = (x, y1, y2) => { lw(0.3); doc.line(x, y1, x, y2); };

    // Row with bold label left and optional right column
    const labelRow = (y, labelL, labelR) => {
      hline(y + rH);
      TB(); sz(8.5);
      doc.text(labelL, L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
      if (labelR) {
        doc.text(labelR, L + W / 2 + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
      }
      T(); sz(9);
    };

    // ── PAGE 1 ──────────────────────────────────────────────────────────────
    // Footer text small
    T(); sz(7);
    doc.text('Rév. 13    Date : 2 juin 2022', L, 7.5);

    // Outer border
    lw(0.5);
    doc.rect(L, 9, W, pH - 16);
    lw(0.3);

    // ── HEADER ──────────────────────────────────────────────────────────────
    const hdrH = 15;
    hline(9 + hdrH);

    if (logoBase64) {
      doc.addImage('data:image/png;base64,' + logoBase64, 'PNG', L + 1, 9.5, 11, 13);
    }

    TB(); sz(10.5);
    doc.text('Girard Tremblay Gilbert Inc.', L + 14, 9 + hdrH / 2 + 0.3, { baseline: 'middle' });

    TB(); sz(24);
    doc.text('FICHE MANDAT', R - 2, 9 + hdrH / 2 + 0.3, { align: 'right', baseline: 'middle' });
    T(); sz(9);

    // ── DATE MANDAT / N° DOSSIER ────────────────────────────────────────────
    let y = 9 + hdrH;
    const half = W / 2;

    hline(y + rH);
    vline(L + half, y, y + rH);
    TB(); sz(8.5);
    doc.text('Date du mandat :', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9);
    doc.text(formatDate(dossierData.date_ouverture), L + 29, y + rH / 2 + 0.3, { baseline: 'middle' });
    TB(); sz(8.5);
    doc.text(`Numéro de dossier : ${arpInitials}-${dossierNum}`, L + half + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9);
    y += rH;

    // ── DATE LIVRAISON ──────────────────────────────────────────────────────
    hline(y + rH);
    vline(L + half, y, y + rH);
    TB(); sz(8.5);
    doc.text('Date de livraison :', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9);
    doc.text(formatDate(mandat.date_livraison), L + 30, y + rH / 2 + 0.3, { baseline: 'middle' });
    // FLEXIBLE / STRICTE
    const fxBase = L + half + 2;
    checkbox(fxBase, y + rH - 1);
    TB(); sz(9);
    doc.text('FLEXIBLE', fxBase + 4, y + rH / 2 + 0.3, { baseline: 'middle' });
    const stBase = L + half + half * 0.52;
    checkbox(stBase, y + rH - 1);
    doc.text('STRICTE', stBase + 4, y + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9);
    y += rH;

    // ── TYPE D'ARPENTAGE ────────────────────────────────────────────────────
    const typeH = 11;
    hline(y + typeH);
    TB(); sz(8.5);
    doc.text("Type d'arpentage :", L + 1.5, y + 3.5, { baseline: 'middle' });

    const typeMap = {
      "Certificat de localisation": "CL", "Description Technique": "DT",
      "Piquetage": "PIQ", "Projet de lotissement": "LOTIS",
      "Implantation": "IMP", "OCTR": "OCTR",
      "Levé topographique": "LEVÉ", "Bornage": "BORN",
    };
    const activeTypes = new Set((dossierData.mandats || [mandat]).map(m => typeMap[m.type_mandat]).filter(Boolean));

    const row1 = [['CL', 'CL'], ['DT', 'DT'], ['PIQ', 'PIQ'], ['LOTIS', 'LOTIS'], ['AUT ___', null]];
    const row2 = [['IMP *', 'IMP'], ['OCTR', 'OCTR'], ['LEVÉ', 'LEVÉ'], ['BORN', 'BORN']];
    const colStep = (W - 32) / 5;

    let cx = L + 32;
    for (const [label, key] of row1) {
      checkbox(cx, y + 5, 2.8);
      doc.text(label, cx + 4, y + 3.2, { baseline: 'middle' });
      cx += colStep;
    }
    cx = L + 32;
    for (const [label, key] of row2) {
      checkbox(cx, y + 10, 2.8);
      doc.text(label, cx + 4, y + 8.2, { baseline: 'middle' });
      cx += colStep;
    }
    T(); sz(9);
    y += typeH;

    // ── CLIENT(S) ────────────────────────────────────────────────────────────
    sectionBar('CLIENT(S)', L, y, W);
    y += 5;

    const client = clientsData?.[0] || {};
    const clientNom = `${client.prenom || ''} ${client.nom || ''}`.trim();
    const clientTelCell = client.telephones?.find(t => t.actuel)?.telephone || client.telephones?.[0]?.telephone || '';
    const clientTelTravail = client.telephones?.find(t => !t.actuel)?.telephone || '';
    const clientEmail = client.courriels?.find(c => c.actuel)?.courriel || client.courriels?.[0]?.courriel || '';
    const clientAddr = client.adresses?.find(a => a.actuelle) || client.adresses?.[0] || {};

    const cDiv = L + half;

    // 5 rows: Nom|Cellulaire, blank|Travail, Adresse|Maison, Municipalité|Autre, Code postal|blank
    const clientRows = [
      ['Nom(s) :', clientNom, 'Cellulaire :', clientTelCell],
      ['', '', 'Travail :', clientTelTravail],
      ['Adresse :', clientAddr.rue || '', 'Maison :', ''],
      ['Municipalité :', clientAddr.ville || '', 'Autre :', ''],
      ['Code postal :', clientAddr.code_postal || '', '', ''],
    ];

    for (const [lL, vL, lR, vR] of clientRows) {
      hline(y + rH);
      vline(cDiv, y, y + rH);
      if (lL) { TB(); sz(8.5); doc.text(lL, L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' }); }
      if (vL) { T(); sz(9); doc.text(vL, L + (lL ? 22 : 1.5), y + rH / 2 + 0.3, { baseline: 'middle' }); }
      if (lR) { TB(); sz(8.5); doc.text(lR, cDiv + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' }); }
      if (vR) { T(); sz(9); doc.text(vR, cDiv + 22, y + rH / 2 + 0.3, { baseline: 'middle' }); }
      T(); sz(9);
      y += rH;
    }
    // Courriel full width
    hline(y + rH);
    TB(); sz(8.5); doc.text('Courriel :', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9); doc.text(clientEmail, L + 18, y + rH / 2 + 0.3, { baseline: 'middle' });
    y += rH;

    // ── LOCALISATION / FICHIER ───────────────────────────────────────────────
    const locW = W * 0.54;
    const noteW = W - locW;
    sectionBar('LOCALISATION DES TRAVAUX', L, y, locW);
    sectionBar('FICHIER :', L + locW, y, noteW);
    y += 5;

    const addrT = mandat.adresse_travaux || {};
    const addrStr = [(addrT.numeros_civiques || []).filter(Boolean).join(', '), addrT.rue].filter(Boolean).join(' ');
    const lotsStr = (mandat.lots || []).join(', ') || mandat.lots_texte || '';

    const locH = rH * 7;
    lw(0.3);
    doc.rect(L, y, locW, locH);
    doc.rect(L + locW, y, noteW, locH);

    // NOTES header in right column
    TB(); sz(9);
    doc.text('NOTES', L + locW + noteW / 2, y + 3.5, { align: 'center', baseline: 'middle' });
    hline(y + 5);

    // Left col content
    const locRows = [
      ['Adresse :', addrStr],
      ['Municipalité :', addrT.ville || ''],
      ['Code postal :', addrT.code_postal || ''],
    ];
    let ly = y + rH * 0.5;
    for (const [label, val] of locRows) {
      hline(y + (ly - y) + rH);
      TB(); sz(8.5); doc.text(label, L + 1.5, ly + rH / 2, { baseline: 'middle' });
      T(); sz(9); if (val) doc.text(val, L + 22, ly + rH / 2, { baseline: 'middle' });
      ly += rH;
    }
    // Checkboxes
    hline(ly + rH);
    checkbox(L + 1.5, ly + rH - 1);
    T(); sz(8); doc.text("Identique à l'adresse contact", L + 5.5, ly + rH / 2 + 0.3, { baseline: 'middle' });
    ly += rH;
    hline(ly + rH);
    checkbox(L + 1.5, ly + rH - 1);
    doc.text('Litige avec voisin', L + 5.5, ly + rH / 2 + 0.3, { baseline: 'middle' });
    ly += rH;
    // Lots
    TB(); sz(8.5); doc.text('Lots :', L + 1.5, ly + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9); if (lotsStr) doc.text(lotsStr, L + 12, ly + rH / 2 + 0.3, { baseline: 'middle' });

    y += locH;

    // ── INTERVENANTS ─────────────────────────────────────────────────────────
    sectionBar('INTERVENANTS', L, y, W);
    y += 5;

    const notaire = notairesData?.[0] || {};
    const notaireNom = `${notaire.prenom || ''} ${notaire.nom || ''}`.trim();

    for (const [label, val] of [['Notaire :', notaireNom], ['Courtier :', ''], ['Autre :', '']]) {
      hline(y + rH);
      TB(); sz(8.5); doc.text(label, L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
      T(); sz(9); if (val) doc.text(val, L + 18, y + rH / 2 + 0.3, { baseline: 'middle' });
      y += rH;
    }

    // Mandant
    hline(y + rH);
    TB(); sz(8.5); doc.text('Mandant :', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    checkbox(L + 19, y + rH - 1);
    doc.text('Identique client', L + 23, y + rH / 2 + 0.3, { baseline: 'middle' });
    checkbox(L + 52, y + rH - 1);
    doc.text('Autre :', L + 56, y + rH / 2 + 0.3, { baseline: 'middle' });
    y += rH;

    // Propriétaire
    hline(y + rH);
    TB(); sz(8.5); doc.text('Propriétaire :', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    checkbox(L + 22, y + rH - 1);
    doc.text('Identique client', L + 26, y + rH / 2 + 0.3, { baseline: 'middle' });
    checkbox(L + 55, y + rH - 1);
    doc.text('Autre :', L + 59, y + rH / 2 + 0.3, { baseline: 'middle' });
    y += rH;

    // ── LIVRAISON ────────────────────────────────────────────────────────────
    sectionBar('LIVRAISON', L, y, W);
    y += 5;

    hline(y + rH);
    TB(); sz(8.5); doc.text('Date de signature:', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    T(); sz(9); doc.text(formatDate(mandat.date_signature), L + 30, y + rH / 2 + 0.3, { baseline: 'middle' });
    y += rH;

    // EN MAIN PROPRE | DOCUMENTS | FACTURE header
    const mpW = W * 0.19;
    const docsW = W * 0.50;
    const factW = W - mpW - docsW;
    const barH = 5;
    sectionBar('EN MAIN PROPRE :', L, y, mpW, barH);
    checkbox(L + mpW - 5, y + barH - 1.2, 2.8);
    sectionBar('DOCUMENTS', L + mpW, y, docsW, barH);
    sectionBar('FACTURE', L + mpW + docsW, y, factW, barH);
    y += barH;

    for (const rowLabel of ['Client', 'Notaire', 'Courtier', 'Aut. :']) {
      hline(y + rH);
      vline(L + mpW, y, y + rH);
      vline(L + mpW + docsW, y, y + rH);
      // Right-align label in EN MAIN PROPRE col
      TB(); sz(8.5);
      doc.text(rowLabel, L + mpW - 1.5, y + rH / 2 + 0.3, { align: 'right', baseline: 'middle' });
      T(); sz(8);
      let dx = L + mpW + 3;
      for (const opt of ['Poste', 'Courriel']) {
        checkbox(dx, y + rH - 1);
        doc.text(opt, dx + 3.5, y + rH / 2 + 0.3, { baseline: 'middle' }); dx += 26;
      }
      dx = L + mpW + docsW + 2;
      for (const opt of ['Papier', 'Courriel']) {
        checkbox(dx, y + rH - 1);
        doc.text(opt, dx + 3.5, y + rH / 2 + 0.3, { baseline: 'middle' }); dx += 26;
      }
      y += rH;
    }

    // ── PRIX ─────────────────────────────────────────────────────────────────
    sectionBar('PRIX', L, y, W);
    y += 5;

    const pCols = [W * 0.26, W * 0.12, W * 0.12, W * 0.12];
    const pRightX = L + pCols[0] + pCols[1] + pCols[2] + pCols[3];
    const pRightW = R - pRightX;
    const rightBlockRows = 5;

    // Header row
    let px = L;
    for (const [h, w] of [['Opération', pCols[0]], ['Prix', pCols[1]], ['Rabais', pCols[2]], ['Total', pCols[3]]]) {
      doc.rect(px, y, w, rH);
      TB(); sz(8.5); doc.text(h, px + w / 2, y + rH / 2 + 0.3, { align: 'center', baseline: 'middle' });
      px += w;
    }

    // Right block
    const rightBlockH = rH * rightBlockRows;
    doc.rect(pRightX, y, pRightW, rightBlockH);
    T(); sz(8);
    let ry = y + rH * 0.7;
    doc.text('Taxes :', pRightX + 1.5, ry);
    checkbox(pRightX + 14, ry + 2.2); doc.text('Non-Incluses', pRightX + 18, ry);
    checkbox(pRightX + 40, ry + 2.2); doc.text('Incluses', pRightX + 44, ry);
    ry += rH;
    doc.text('Frais dépôt :', pRightX + 1.5, ry);
    checkbox(pRightX + 19, ry + 2.2); doc.text('Oui', pRightX + 23, ry);
    checkbox(pRightX + 31, ry + 2.2); doc.text('Non', pRightX + 35, ry);
    ry += rH;
    doc.text('Frais ouvert :', pRightX + 1.5, ry);
    checkbox(pRightX + 20, ry + 2.2); doc.text('Oui', pRightX + 24, ry);
    checkbox(pRightX + 32, ry + 2.2); doc.text('Non', pRightX + 36, ry);
    ry += rH;
    TB(); sz(8); doc.text('Modalités :', pRightX + 1.5, ry);
    ry += rH;
    T(); sz(8); doc.text('*Piquetage suggéré :', pRightX + 1.5, ry);
    checkbox(pRightX + 29, ry + 2.2); doc.text('Oui', pRightX + 33, ry);
    checkbox(pRightX + 41, ry + 2.2); doc.text('Non', pRightX + 45, ry);
    T(); sz(9);

    y += rH;

    // Mandat data rows (min 3 rows)
    const mandats = dossierData.mandats?.length ? dossierData.mandats : [mandat];
    const dataRows = mandats.filter(m => m?.type_mandat);
    const totalRows = Math.max(3, dataRows.length);

    for (let i = 0; i < totalRows; i++) {
      const m = dataRows[i] || null;
      const total = m ? ((m.prix_estime || 0) - (m.rabais || 0)) : 0;
      px = L;
      for (const [val, w] of [
        [m?.type_mandat || '', pCols[0]],
        [m?.prix_estime ? `${Number(m.prix_estime).toFixed(2)} $` : '', pCols[1]],
        [m?.rabais ? `${Number(m.rabais).toFixed(2)} $` : '', pCols[2]],
        [total > 0 ? `${total.toFixed(2)} $` : '', pCols[3]]
      ]) {
        doc.rect(px, y, w, rH);
        T(); sz(8); if (val) doc.text(String(val), px + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
        px += w;
      }
      y += rH;
    }

    // Total row
    px = L;
    for (const [val, w, bold] of [
      ['', pCols[0], false],
      ['', pCols[1], false],
      ['Total', pCols[2], true],
      [mandats.reduce((s, m) => s + ((m?.prix_estime || 0) - (m?.rabais || 0)), 0).toFixed(2) + ' $', pCols[3], false]
    ]) {
      doc.rect(px, y, w, rH);
      if (bold) { TB(); sz(8.5); doc.text(val, px + w / 2, y + rH / 2 + 0.3, { align: 'center', baseline: 'middle' }); }
      else { T(); sz(8); if (val && val !== '0.00 $') doc.text(val, px + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' }); }
      px += w;
    }
    y += rH;

    // ── RÉFÉRENCE ─────────────────────────────────────────────────────────────
    sectionBar('RÉFÉRENCE', L, y, W);
    y += 5;

    const refs1 = ['Courtier', 'Notaire', 'Connaissance', 'Site Web', 'Bouche à oreille'];
    const refs2 = ['Bottin', 'Publicité', 'Réseaux sociaux', 'Greffe', 'Club sociaux/BNI'];
    const refs3 = ['Magasineux', 'Anc. Client', 'Autre ___________________________'];

    doc.rect(L, y, W, rH * 3);
    hline(y + rH);
    hline(y + rH * 2);
    T(); sz(8);

    const refStep = W / 5;
    let rx = L + 1.5;
    for (const r of refs1) { checkbox(rx, y + rH - 1.2); doc.text(r, rx + 3.5, y + rH / 2 + 0.3, { baseline: 'middle' }); rx += refStep; }
    rx = L + 1.5;
    for (const r of refs2) { checkbox(rx, y + rH * 2 - 1.2); doc.text(r, rx + 3.5, y + rH + rH / 2 + 0.3, { baseline: 'middle' }); rx += refStep; }
    rx = L + 1.5;
    for (const r of refs3) { checkbox(rx, y + rH * 3 - 1.2); doc.text(r, rx + 3.5, y + rH * 2 + rH / 2 + 0.3, { baseline: 'middle' }); rx += refStep; }
    y += rH * 3;

    // ── VALIDATION DES OBSERVATIONS ──────────────────────────────────────────
    sectionBar('VALIDATION DES OBSERVATIONS', L, y, W);
    y += 5;

    const validH = 22;
    doc.rect(L, y, W, validH);
    T(); sz(8);
    const validText = `Je, soussigné ${dossierData.arpenteur_geometre || ''}, arpenteur-géomètre, certifie par la présente avoir pris personnellement connaissance des observations relatives aux éléments visés aux paragraphes 9 et 13 à 17 du premier alinéa de l'article 9 du Règlement sur la norme de pratique relative au certificat de localisation et les avoir validées.`;
    const vlines = doc.splitTextToSize(validText, W - 3);
    doc.text(vlines, L + 1.5, y + 3.5);
    const afterTxt = y + 3.5 + vlines.length * 2.9;
    checkbox(L + 2, afterTxt + 3); TB(); sz(8.5); doc.text('Visite des lieux', L + 6.5, afterTxt + 1.8, { baseline: 'middle' });
    checkbox(L + 2, afterTxt + 7.5); doc.text('Photographies', L + 6.5, afterTxt + 6.2, { baseline: 'middle' });
    const sigY = y + validH - 3;
    lw(0.3);
    doc.text('Date de la validation :', L + 2, sigY, { baseline: 'middle' });
    doc.line(L + 36, sigY, L + 76, sigY);
    doc.text('Signature :', L + 78, sigY, { baseline: 'middle' });
    doc.line(L + 92, sigY, R - 1, sigY);
    T(); sz(9);
    y += validH;

    // ── FERMETURE ────────────────────────────────────────────────────────────
    sectionBar('FERMETURE', L, y, W);
    y += 5;
    doc.rect(L, y, W / 2, rH);
    doc.rect(L + W / 2, y, W / 2, rH);
    TB(); sz(8.5);
    doc.text('Date de fermeture :', L + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });
    doc.text('Signature :', L + W / 2 + 1.5, y + rH / 2 + 0.3, { baseline: 'middle' });

    // Footer p1
    T(); sz(7);
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ── PAGE 2: TEMPS ─────────────────────────────────────────────────────────
    doc.addPage();
    T(); sz(7);
    doc.text('Rév. 13    Date : 2 juin 2022', L, 7.5);

    lw(0.5);
    const p2H = 175;
    doc.rect(L, 9, W, p2H);
    lw(0.3);

    sectionBar('TEMPS', L, 9, W, 6);

    const tCols = [W * 0.17, W * 0.25, W * 0.44, W * 0.14];
    const tHeaders = ['DATE', 'EMPLOYÉ(S)', 'DESCRIPTION', 'TEMPS'];
    let ty = 15;

    // Header row
    let tx = L;
    for (let i = 0; i < tHeaders.length; i++) {
      doc.rect(tx, ty, tCols[i], 6);
      TB(); sz(9);
      doc.text(tHeaders[i], tx + tCols[i] / 2, ty + 3, { align: 'center', baseline: 'middle' });
      tx += tCols[i];
    }
    ty += 6;

    const subSections = [
      ['PLANIFICATION', 2],
      ['TERRAIN', 6],
      ['RECHERCHES ET ANALYSE FONCIÈRE', 4],
      ['TRAITEMENT ET DESSIN', 4],
      ['RAPPORT/RÉDACTION', 3],
    ];

    for (const [title, count] of subSections) {
      doc.setFillColor(210, 210, 210);
      doc.rect(L, ty, W, 5.5, 'FD');
      TB(); sz(8.5);
      doc.text(title, L + 2, ty + 2.75, { baseline: 'middle' });
      ty += 5.5;
      for (let r = 0; r < count; r++) {
        tx = L;
        for (const tc of tCols) { doc.rect(tx, ty, tc, 6); tx += tc; }
        ty += 6;
      }
    }

    T(); sz(7);
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ── OUTPUT ────────────────────────────────────────────────────────────────
    const pdfBytes = doc.output('arraybuffer');
    const uint8 = new Uint8Array(pdfBytes);
    let base64 = '';
    for (let i = 0; i < uint8.length; i += 8192) base64 += String.fromCharCode(...uint8.subarray(i, i + 8192));
    base64 = btoa(base64);

    return Response.json({
      success: true,
      fileName: pdfFileName,
      pdf: `data:application/pdf;base64,${base64}`
    });

  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ error: error.message || 'Erreur' }, { status: 500 });
  }
});