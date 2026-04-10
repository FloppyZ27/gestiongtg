import { jsPDF, AcroFormTextField } from 'npm:jspdf@2.5.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG", "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP", "Benjamin Larouche": "BL", "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "XX";
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-CA'); }
  catch { return dateStr; }
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
    const pW = doc.internal.pageSize.getWidth();
    const pH = doc.internal.pageSize.getHeight();
    const L = 10, R = pW - 10, W = R - L;
    const rH = 5.5;
    const mmToPt = 2.83464566929;

    // ── Color helpers ───────────────────────────────────────────────────────
    const blue  = () => doc.setTextColor(0, 38, 100);   // dark navy blue for pre-filled
    const black = () => doc.setTextColor(0, 0, 0);

    // ── AcroForm text field helper (mm coords, top-left) ────────────────────
    let fieldIndex = 0;
    const addTextField = (name, x, y, w, h, value = '', multiline = false) => {
      try {
        const field = new AcroFormTextField();
        field.fieldName = name + '_' + (fieldIndex++);
        field.fontSize = 8;
        field.multiline = multiline;
        const pHpt = pH * mmToPt;
        field.Rect = [
          x * mmToPt,
          pHpt - (y + h) * mmToPt,
          (x + w) * mmToPt,
          pHpt - y * mmToPt
        ];
        if (value) field.value = value;
        doc.addField(field);
      } catch(_) {}
    };

    // ── Drawing helpers ──────────────────────────────────────────────────────
    const T  = () => { doc.setFont('times', 'normal'); };
    const TB = () => { doc.setFont('times', 'bold'); };
    const sz = (s) => doc.setFontSize(s);
    const lw = (w) => doc.setLineWidth(w);

    // Checkbox: center is at (x + size/2, cy)
    const checkbox = (x, cy, size = 2.8) => {
      lw(0.3);
      doc.rect(x, cy - size / 2, size, size);
    };

    const sectionBar = (title, x, y, w, h = 5) => {
      doc.setFillColor(180, 180, 180);
      doc.rect(x, y, w, h, 'FD');
      TB(); sz(9); black();
      doc.text(title, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
      T(); sz(9);
    };

    const hline = (y) => { lw(0.3); doc.line(L, y, R, y); };
    const vline = (x, y1, y2) => { lw(0.3); doc.line(x, y1, x, y2); };

    // ── PAGE 1 ──────────────────────────────────────────────────────────────
    T(); sz(7); black();
    doc.text('Rév. 13    Date : 2 juin 2022', L, 7.5);

    lw(0.5);
    doc.rect(L, 9, W, pH - 16);
    lw(0.3);

    // ── HEADER ──────────────────────────────────────────────────────────────
    const hdrH = 15;
    hline(9 + hdrH);
    if (logoBase64) doc.addImage('data:image/png;base64,' + logoBase64, 'PNG', L + 1, 9.5, 11, 13);
    TB(); sz(10.5); black();
    doc.text('Girard Tremblay Gilbert Inc.', L + 14, 9 + hdrH / 2, { baseline: 'middle' });
    TB(); sz(24);
    doc.text('FICHE MANDAT', R - 2, 9 + hdrH / 2, { align: 'right', baseline: 'middle' });
    T(); sz(9);

    // ── DATE MANDAT / N° DOSSIER ─────────────────────────────────────────────
    let y = 9 + hdrH;
    const half = W / 2;
    const mid = (rowY) => rowY + rH / 2;

    hline(y + rH);
    vline(L + half, y, y + rH);
    TB(); sz(8.5); black();
    doc.text('Date du mandat :', L + 1.5, mid(y), { baseline: 'middle' });
    const dateMandat = formatDate(dossierData.date_ouverture);
    if (dateMandat) { blue(); T(); sz(9); doc.text(dateMandat, L + 29, mid(y), { baseline: 'middle' }); black(); }
    addTextField('date_mandat', L + 29, y, half - 30, rH, dateMandat);
    TB(); sz(8.5);
    doc.text(`Numéro de dossier : ${arpInitials}-`, L + half + 1.5, mid(y), { baseline: 'middle' });
    if (dossierNum) { blue(); T(); sz(9); doc.text(dossierNum, L + half + 43, mid(y), { baseline: 'middle' }); black(); }
    addTextField('numero_dossier', L + half + 43, y, half - 44, rH, dossierNum);
    y += rH;

    // ── DATE LIVRAISON ───────────────────────────────────────────────────────
    hline(y + rH);
    vline(L + half, y, y + rH);
    TB(); sz(8.5); black();
    doc.text('Date de livraison :', L + 1.5, mid(y), { baseline: 'middle' });
    const dateLiv = formatDate(mandat.date_livraison);
    if (dateLiv) { blue(); T(); sz(9); doc.text(dateLiv, L + 30, mid(y), { baseline: 'middle' }); black(); }
    addTextField('date_livraison', L + 30, y, half - 31, rH, dateLiv);
    // FLEXIBLE / STRICTE
    T(); sz(9); black();
    const fxBase = L + half + 2;
    checkbox(fxBase, mid(y)); TB(); doc.text('FLEXIBLE', fxBase + 4.5, mid(y), { baseline: 'middle' });
    const stBase = L + half + half * 0.52;
    checkbox(stBase, mid(y)); doc.text('STRICTE', stBase + 4.5, mid(y), { baseline: 'middle' });
    T(); sz(9);
    y += rH;

    // ── TYPE D'ARPENTAGE ─────────────────────────────────────────────────────
    const typeH = 11;
    hline(y + typeH);
    TB(); sz(8.5); black();
    doc.text("Type d'arpentage :", L + 1.5, y + 3.5, { baseline: 'middle' });

    const row1 = [['CL', 'CL'], ['DT', 'DT'], ['PIQ', 'PIQ'], ['LOTIS', 'LOTIS'], ['AUT ___', null]];
    const row2 = [['IMP *', 'IMP'], ['OCTR', 'OCTR'], ['LEVÉ', 'LEVÉ'], ['BORN', 'BORN']];
    const colStep = (W - 32) / 5;
    T(); sz(8.5); black();
    let cx = L + 32;
    for (const [label] of row1) { checkbox(cx, y + 3.5); doc.text(label, cx + 4.5, y + 3.5, { baseline: 'middle' }); cx += colStep; }
    cx = L + 32;
    for (const [label] of row2) { checkbox(cx, y + 8.5); doc.text(label, cx + 4.5, y + 8.5, { baseline: 'middle' }); cx += colStep; }
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

    const clientRows = [
      ['Nom(s) :', clientNom, 22, 'Cellulaire :', clientTelCell, 23],
      ['', '', 0, 'Travail :', clientTelTravail, 19],
      ['Adresse :', clientAddr.rue || '', 18, 'Maison :', '', 19],
      ['Municipalité :', clientAddr.ville || '', 24, 'Autre :', '', 17],
      ['Code postal :', clientAddr.code_postal || '', 23, '', '', 0],
    ];

    for (const [lL, vL, offL, lR, vR, offR] of clientRows) {
      hline(y + rH); vline(cDiv, y, y + rH);
      if (lL) { TB(); sz(8.5); black(); doc.text(lL, L + 1.5, mid(y), { baseline: 'middle' }); }
      if (vL) { blue(); T(); sz(9); doc.text(vL, L + offL, mid(y), { baseline: 'middle' }); black(); }
      if (vL !== undefined) addTextField('client_' + lL, L + offL, y + 0.5, cDiv - L - offL - 1, rH - 1, vL);
      if (lR) { TB(); sz(8.5); black(); doc.text(lR, cDiv + 1.5, mid(y), { baseline: 'middle' }); }
      if (vR) { blue(); T(); sz(9); doc.text(vR, cDiv + offR, mid(y), { baseline: 'middle' }); black(); }
      if (lR) addTextField('client_r_' + lR, cDiv + offR, y + 0.5, R - cDiv - offR - 1, rH - 1, vR);
      T(); sz(9);
      y += rH;
    }
    // Courriel
    hline(y + rH);
    TB(); sz(8.5); black(); doc.text('Courriel :', L + 1.5, mid(y), { baseline: 'middle' });
    if (clientEmail) { blue(); T(); sz(9); doc.text(clientEmail, L + 18, mid(y), { baseline: 'middle' }); black(); }
    addTextField('courriel', L + 18, y + 0.5, W - 19, rH - 1, clientEmail);
    y += rH;

    // ── LOCALISATION / FICHIER ───────────────────────────────────────────────
    const locW = W * 0.54, noteW = W - locW;
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

    TB(); sz(9); black();
    doc.text('NOTES', L + locW + noteW / 2, y + 3.5, { align: 'center', baseline: 'middle' });
    hline(y + 5);
    addTextField('notes', L + locW + 1, y + 6, noteW - 2, locH - 7, '', true);

    const locRows = [['Adresse :', addrStr, 18], ['Municipalité :', addrT.ville || '', 24], ['Code postal :', addrT.code_postal || '', 23]];
    let ly = y;
    for (const [label, val, off] of locRows) {
      hline(ly + rH);
      TB(); sz(8.5); black(); doc.text(label, L + 1.5, mid(ly), { baseline: 'middle' });
      if (val) { blue(); T(); sz(9); doc.text(val, L + off, mid(ly), { baseline: 'middle' }); black(); }
      addTextField('loc_' + label, L + off, ly + 0.5, locW - off - 1, rH - 1, val);
      ly += rH;
    }
    hline(ly + rH);
    checkbox(L + 1.5, mid(ly)); T(); sz(8); black();
    doc.text("Identique à l'adresse contact", L + 5.5, mid(ly), { baseline: 'middle' });
    ly += rH;
    hline(ly + rH);
    checkbox(L + 1.5, mid(ly));
    doc.text('Litige avec voisin', L + 5.5, mid(ly), { baseline: 'middle' });
    ly += rH;
    TB(); sz(8.5); black(); doc.text('Lots :', L + 1.5, mid(ly), { baseline: 'middle' });
    if (lotsStr) { blue(); T(); sz(9); doc.text(lotsStr, L + 12, mid(ly), { baseline: 'middle' }); black(); }
    addTextField('lots', L + 12, ly + 0.5, locW - 13, rH - 1, lotsStr);

    y += locH;

    // ── INTERVENANTS ──────────────────────────────────────────────────────────
    sectionBar('INTERVENANTS', L, y, W);
    y += 5;

    const notaire = notairesData?.[0] || {};
    const notaireNom = `${notaire.prenom || ''} ${notaire.nom || ''}`.trim();

    for (const [label, val] of [['Notaire :', notaireNom], ['Courtier :', ''], ['Autre :', '']]) {
      hline(y + rH);
      TB(); sz(8.5); black(); doc.text(label, L + 1.5, mid(y), { baseline: 'middle' });
      if (val) { blue(); T(); sz(9); doc.text(val, L + 18, mid(y), { baseline: 'middle' }); black(); }
      addTextField('interv_' + label, L + 18, y + 0.5, W - 19, rH - 1, val);
      y += rH;
    }

    hline(y + rH);
    TB(); sz(8.5); black(); doc.text('Mandant :', L + 1.5, mid(y), { baseline: 'middle' });
    checkbox(L + 19, mid(y)); T(); sz(8.5); doc.text('Identique client', L + 23, mid(y), { baseline: 'middle' });
    checkbox(L + 52, mid(y)); doc.text('Autre :', L + 56, mid(y), { baseline: 'middle' });
    addTextField('mandant_autre', L + 66, y + 0.5, W - 67, rH - 1);
    y += rH;

    hline(y + rH);
    TB(); sz(8.5); black(); doc.text('Propriétaire :', L + 1.5, mid(y), { baseline: 'middle' });
    checkbox(L + 22, mid(y)); T(); sz(8.5); doc.text('Identique client', L + 26, mid(y), { baseline: 'middle' });
    checkbox(L + 55, mid(y)); doc.text('Autre :', L + 59, mid(y), { baseline: 'middle' });
    addTextField('proprio_autre', L + 69, y + 0.5, W - 70, rH - 1);
    y += rH;

    // ── LIVRAISON ─────────────────────────────────────────────────────────────
    sectionBar('LIVRAISON', L, y, W);
    y += 5;

    hline(y + rH);
    TB(); sz(8.5); black(); doc.text('Date de signature:', L + 1.5, mid(y), { baseline: 'middle' });
    const dateSig = formatDate(mandat.date_signature);
    if (dateSig) { blue(); T(); sz(9); doc.text(dateSig, L + 30, mid(y), { baseline: 'middle' }); black(); }
    addTextField('date_signature', L + 30, y + 0.5, W - 31, rH - 1, dateSig);
    y += rH;

    // EN MAIN PROPRE | DOCUMENTS | FACTURE
    const mpW = W * 0.19, docsW = W * 0.50, factW = W - mpW - docsW, barH = 5;
    sectionBar('EN MAIN PROPRE :', L, y, mpW, barH);
    checkbox(L + mpW - 5, y + barH / 2, 2.8);
    sectionBar('DOCUMENTS', L + mpW, y, docsW, barH);
    sectionBar('FACTURE', L + mpW + docsW, y, factW, barH);
    y += barH;

    for (const rowLabel of ['Client', 'Notaire', 'Courtier', 'Aut. :']) {
      hline(y + rH);
      vline(L + mpW, y, y + rH);
      vline(L + mpW + docsW, y, y + rH);
      TB(); sz(8.5); black();
      doc.text(rowLabel, L + mpW - 1.5, mid(y), { align: 'right', baseline: 'middle' });
      T(); sz(8); black();
      let dx = L + mpW + 3;
      for (const opt of ['Poste', 'Courriel']) {
        checkbox(dx, mid(y)); doc.text(opt, dx + 4.5, mid(y), { baseline: 'middle' }); dx += 26;
      }
      dx = L + mpW + docsW + 2;
      for (const opt of ['Papier', 'Courriel']) {
        checkbox(dx, mid(y)); doc.text(opt, dx + 4.5, mid(y), { baseline: 'middle' }); dx += 26;
      }
      y += rH;
    }

    // ── PRIX ──────────────────────────────────────────────────────────────────
    sectionBar('PRIX', L, y, W);
    y += 5;

    const pCols = [W * 0.26, W * 0.12, W * 0.12, W * 0.12];
    const pRightX = L + pCols[0] + pCols[1] + pCols[2] + pCols[3];
    const pRightW = R - pRightX;
    const rightBlockRows = 5;
    const rightBlockH = rH * rightBlockRows;

    // Header row
    let px = L;
    for (const [h, w] of [['Opération', pCols[0]], ['Prix', pCols[1]], ['Rabais', pCols[2]], ['Total', pCols[3]]]) {
      doc.rect(px, y, w, rH);
      TB(); sz(8.5); black(); doc.text(h, px + w / 2, mid(y), { align: 'center', baseline: 'middle' });
      px += w;
    }

    // Right block - draw outer rect and internal lines
    doc.rect(pRightX, y, pRightW, rightBlockH);
    for (let ri = 1; ri < rightBlockRows; ri++) hline(y + rH * ri); // not ideal but needed

    // Right block rows - aligned properly
    T(); sz(8); black();

    // Row 1: Taxes
    let ry = y;
    doc.text('Taxes :', pRightX + 1.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 14, mid(ry)); doc.text('Non-Incluses', pRightX + 18, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 40, mid(ry)); doc.text('Incluses', pRightX + 44, mid(ry), { baseline: 'middle' });
    ry += rH;
    // Row 2: Frais dépôt
    doc.text('Frais dépôt :', pRightX + 1.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 21, mid(ry)); doc.text('Oui', pRightX + 25.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 34, mid(ry)); doc.text('Non', pRightX + 38.5, mid(ry), { baseline: 'middle' });
    ry += rH;
    // Row 3: Frais ouvert
    doc.text('Frais ouvert :', pRightX + 1.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 22, mid(ry)); doc.text('Oui', pRightX + 26.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 35, mid(ry)); doc.text('Non', pRightX + 39.5, mid(ry), { baseline: 'middle' });
    ry += rH;
    // Row 4: Modalités
    TB(); sz(8); doc.text('Modalités :', pRightX + 1.5, mid(ry), { baseline: 'middle' });
    addTextField('modalites', pRightX + 18, ry + 0.5, pRightW - 19, rH - 1);
    ry += rH;
    // Row 5: Piquetage suggéré
    T(); sz(8);
    doc.text('*Piquetage suggéré :', pRightX + 1.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 30, mid(ry)); doc.text('Oui', pRightX + 34.5, mid(ry), { baseline: 'middle' });
    checkbox(pRightX + 43, mid(ry)); doc.text('Non', pRightX + 47.5, mid(ry), { baseline: 'middle' });

    y += rH;

    // Mandat data rows
    const mandats = dossierData.mandats?.length ? dossierData.mandats : [mandat];
    const dataRows = mandats.filter(m => m?.type_mandat);
    const totalRows = Math.max(3, dataRows.length);

    for (let i = 0; i < totalRows; i++) {
      const m = dataRows[i] || null;
      const total = m ? ((m.prix_estime || 0) - (m.rabais || 0)) : 0;
      px = L;
      const vals = [
        [m?.type_mandat || '', pCols[0]],
        [m?.prix_estime ? `${Number(m.prix_estime).toFixed(2)} $` : '', pCols[1]],
        [m?.rabais ? `${Number(m.rabais).toFixed(2)} $` : '', pCols[2]],
        [total > 0 ? `${total.toFixed(2)} $` : '', pCols[3]]
      ];
      for (const [val, w] of vals) {
        doc.rect(px, y, w, rH);
        if (val) { blue(); T(); sz(8); doc.text(String(val), px + 1.5, mid(y), { baseline: 'middle' }); black(); }
        addTextField(`prix_r${i}_${px}`, px + 0.5, y + 0.5, w - 1, rH - 1, val);
        px += w;
      }
      y += rH;
    }

    // Total row
    px = L;
    const grandTotal = mandats.reduce((s, m) => s + ((m?.prix_estime || 0) - (m?.rabais || 0)), 0);
    for (const [val, w, bold] of [
      ['', pCols[0], false], ['', pCols[1], false],
      ['Total', pCols[2], true],
      [grandTotal > 0 ? `${grandTotal.toFixed(2)} $` : '', pCols[3], false]
    ]) {
      doc.rect(px, y, w, rH);
      if (bold) { TB(); sz(8.5); black(); doc.text(val, px + w / 2, mid(y), { align: 'center', baseline: 'middle' }); }
      else if (val) { blue(); T(); sz(8); doc.text(val, px + 1.5, mid(y), { baseline: 'middle' }); black(); }
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
    hline(y + rH); hline(y + rH * 2);
    T(); sz(8); black();

    const refStep = W / 5;
    let rx = L + 1.5;
    for (const r of refs1) { checkbox(rx, mid(y)); doc.text(r, rx + 4.5, mid(y), { baseline: 'middle' }); rx += refStep; }
    rx = L + 1.5;
    for (const r of refs2) { checkbox(rx, mid(y + rH)); doc.text(r, rx + 4.5, mid(y + rH), { baseline: 'middle' }); rx += refStep; }
    rx = L + 1.5;
    for (const r of refs3) { checkbox(rx, mid(y + rH * 2)); doc.text(r, rx + 4.5, mid(y + rH * 2), { baseline: 'middle' }); rx += refStep; }
    y += rH * 3;

    // ── VALIDATION DES OBSERVATIONS ───────────────────────────────────────────
    sectionBar('VALIDATION DES OBSERVATIONS', L, y, W);
    y += 5;

    const validH = 24;
    doc.rect(L, y, W, validH);
    T(); sz(8); black();
    const validText = `Je, soussigné ${dossierData.arpenteur_geometre || ''}, arpenteur-géomètre, certifie par la présente avoir pris personnellement connaissance des observations relatives aux éléments visés aux paragraphes 9 et 13 à 17 du premier alinéa de l'article 9 du Règlement sur la norme de pratique relative au certificat de localisation et les avoir validées.`;
    const vlines = doc.splitTextToSize(validText, W - 3);
    doc.text(vlines, L + 1.5, y + 3.5);
    const afterTxt = y + 3.5 + vlines.length * 2.9;
    checkbox(L + 2, mid(afterTxt + 2.5)); TB(); sz(8.5); doc.text('Visite des lieux', L + 6.5, mid(afterTxt + 2.5), { baseline: 'middle' });
    checkbox(L + 2, mid(afterTxt + 8)); doc.text('Photographies', L + 6.5, mid(afterTxt + 8), { baseline: 'middle' });
    const sigY = y + validH - 3;
    lw(0.3); T(); sz(8); black();
    doc.text('Date de la validation :', L + 2, sigY, { baseline: 'middle' });
    doc.line(L + 36, sigY, L + 76, sigY);
    addTextField('date_validation', L + 36, sigY - 3, 40, 5);
    doc.text('Signature :', L + 78, sigY, { baseline: 'middle' });
    doc.line(L + 92, sigY, R - 1, sigY);
    T(); sz(9);
    y += validH;

    // ── FERMETURE ─────────────────────────────────────────────────────────────
    sectionBar('FERMETURE', L, y, W);
    y += 5;
    doc.rect(L, y, W / 2, rH);
    doc.rect(L + W / 2, y, W / 2, rH);
    TB(); sz(8.5); black();
    doc.text('Date de fermeture :', L + 1.5, mid(y), { baseline: 'middle' });
    doc.text('Signature :', L + W / 2 + 1.5, mid(y), { baseline: 'middle' });
    addTextField('date_fermeture', L + 32, y + 0.5, W / 2 - 33, rH - 1);

    T(); sz(7); black();
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ── PAGE 2: TEMPS ──────────────────────────────────────────────────────────
    doc.addPage();
    T(); sz(7); black();
    doc.text('Rév. 13    Date : 2 juin 2022', L, 7.5);

    lw(0.5);
    doc.rect(L, 9, W, 175);
    lw(0.3);

    sectionBar('TEMPS', L, 9, W, 6);

    const tCols = [W * 0.17, W * 0.25, W * 0.44, W * 0.14];
    const tHeaders = ['DATE', 'EMPLOYÉ(S)', 'DESCRIPTION', 'TEMPS'];
    let ty = 15;

    let tx = L;
    for (let i = 0; i < tHeaders.length; i++) {
      doc.rect(tx, ty, tCols[i], 6);
      TB(); sz(9); black();
      doc.text(tHeaders[i], tx + tCols[i] / 2, ty + 3, { align: 'center', baseline: 'middle' });
      tx += tCols[i];
    }
    ty += 6;

    const subSections = [
      ['PLANIFICATION', 2], ['TERRAIN', 6],
      ['RECHERCHES ET ANALYSE FONCIÈRE', 4], ['TRAITEMENT ET DESSIN', 4], ['RAPPORT/RÉDACTION', 3],
    ];

    for (const [title, count] of subSections) {
      doc.setFillColor(210, 210, 210);
      doc.rect(L, ty, W, 5.5, 'FD');
      TB(); sz(8.5); black();
      doc.text(title, L + 2, ty + 2.75, { baseline: 'middle' });
      ty += 5.5;
      for (let r = 0; r < count; r++) {
        tx = L;
        for (let ci = 0; ci < tCols.length; ci++) {
          doc.rect(tx, ty, tCols[ci], 6);
          addTextField(`temps_${title}_r${r}_c${ci}`, tx + 0.5, ty + 0.5, tCols[ci] - 1, 5);
          tx += tCols[ci];
        }
        ty += 6;
      }
    }

    T(); sz(7); black();
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ── OUTPUT ─────────────────────────────────────────────────────────────────
    const pdfBytes = doc.output('arraybuffer');
    const uint8 = new Uint8Array(pdfBytes);
    let base64 = '';
    for (let i = 0; i < uint8.length; i += 8192) base64 += String.fromCharCode(...uint8.subarray(i, i + 8192));
    base64 = btoa(base64);

    return Response.json({ success: true, fileName: pdfFileName, pdf: `data:application/pdf;base64,${base64}` });

  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ error: error.message || 'Erreur' }, { status: 500 });
  }
});