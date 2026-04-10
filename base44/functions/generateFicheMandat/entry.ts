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
        logoBase64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      }
    } catch(_) {}

    const doc = new jsPDF({ unit: 'mm', format: 'letter' });
    const pW = doc.internal.pageSize.getWidth();
    const pH = doc.internal.pageSize.getHeight();
    const L = 10;
    const R = pW - 10;
    const W = R - L;

    // ─── HELPERS ──────────────────────────────────────────────────────────
    const cb = (x, y, checked = false, size = 3) => {
      doc.setLineWidth(0.3);
      doc.rect(x, y - size, size, size);
      if (checked) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('X', x + 0.5, y - 0.3);
        doc.setFont('helvetica', 'normal');
      }
    };

    const bold = (size = 8) => { doc.setFont('helvetica', 'bold'); doc.setFontSize(size); };
    const normal = (size = 8) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); };

    const sectionBar = (title, x, y, w, h = 5) => {
      doc.setFillColor(180, 180, 180);
      doc.rect(x, y, w, h, 'FD');
      bold(8);
      doc.text(title, x + w / 2, y + h / 2, { align: 'center', baseline: 'middle' });
      normal(8);
    };

    const rowH = 5.5;

    // ─── PAGE 1 ───────────────────────────────────────────────────────────

    // Rev line top
    normal(6.5);
    doc.text('Rév. 13    Date : 2 juin 2022', L, 8);

    // Outer border
    doc.setLineWidth(0.5);
    doc.rect(L, 10, W, pH - 18);
    doc.setLineWidth(0.3);

    // HEADER row
    const headerH = 14;
    doc.setLineWidth(0.3);
    doc.line(L, 10 + headerH, R, 10 + headerH);

    // Logo
    if (logoBase64) {
      doc.addImage('data:image/png;base64,' + logoBase64, 'PNG', L + 1, 11, 12, 12);
    }

    // Company name
    bold(10);
    doc.text('Girard Tremblay Gilbert Inc.', L + 15, 10 + headerH / 2, { baseline: 'middle' });

    // FICHE MANDAT title
    bold(20);
    doc.text('FICHE MANDAT', R - 2, 10 + headerH / 2, { align: 'right', baseline: 'middle' });
    normal(8);

    // ─── DATE MANDAT / N° DOSSIER ─────────────────────────────────────────
    let y = 10 + headerH;
    const half = W / 2;

    doc.line(L, y + rowH, R, y + rowH);
    doc.line(L + half, y, L + half, y + rowH);
    bold(7.5);
    doc.text('Date du mandat :', L + 1, y + rowH / 2, { baseline: 'middle' });
    normal(8);
    doc.text(formatDate(dossierData.date_ouverture), L + 28, y + rowH / 2, { baseline: 'middle' });
    bold(7.5);
    doc.text('Numéro de dossier :', L + half + 1, y + rowH / 2, { baseline: 'middle' });
    normal(8);
    doc.text(`${arpInitials}-${dossierNum}`, L + half + 32, y + rowH / 2, { baseline: 'middle' });

    // ─── DATE LIVRAISON / FLEXIBLE STRICTE ───────────────────────────────
    y += rowH;
    doc.line(L, y + rowH, R, y + rowH);
    doc.line(L + half, y, L + half, y + rowH);
    bold(7.5);
    doc.text('Date de livraison :', L + 1, y + rowH / 2, { baseline: 'middle' });
    normal(8);
    doc.text(formatDate(mandat.date_livraison), L + 30, y + rowH / 2, { baseline: 'middle' });
    // FLEXIBLE / STRICTE
    const flexX = L + half + 2;
    cb(flexX, y + rowH - 1);
    bold(8);
    doc.text('FLEXIBLE', flexX + 4, y + rowH / 2, { baseline: 'middle' });
    const strictX = L + half + half * 0.55;
    cb(strictX, y + rowH - 1);
    doc.text('STRICTE', strictX + 4, y + rowH / 2, { baseline: 'middle' });
    normal(8);

    // ─── TYPE D'ARPENTAGE ─────────────────────────────────────────────────
    y += rowH;
    const typeH = 11;
    doc.line(L, y + typeH, R, y + typeH);
    bold(7.5);
    doc.text("Type d'arpentage :", L + 1, y + 3.5, { baseline: 'middle' });
    normal(8);

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
    const activeTypes = new Set((dossierData.mandats || [mandat]).map(m => typeMap[m.type_mandat]).filter(Boolean));

    const row1 = [['CL', 'CL'], ['DT', 'DT'], ['PIQ', 'PIQ'], ['LOTIS', 'LOTIS'], ['AUT ___', null]];
    const row2 = [['IMP *', 'IMP'], ['OCTR', 'OCTR'], ['LEVÉ', 'LEVÉ'], ['BORN', 'BORN']];

    let cx = L + 30;
    const colStep = 34;
    for (const [label, key] of row1) {
      cb(cx, y + 5, key ? activeTypes.has(key) : false);
      bold(7.5);
      doc.text(label, cx + 4, y + 3.5, { baseline: 'middle' });
      cx += colStep;
    }
    cx = L + 30;
    for (const [label, key] of row2) {
      cb(cx, y + 10, key ? activeTypes.has(key) : false);
      bold(7.5);
      doc.text(label, cx + 4, y + 8.5, { baseline: 'middle' });
      cx += colStep;
    }
    normal(8);

    // ─── CLIENT(S) ────────────────────────────────────────────────────────
    y += typeH;
    sectionBar('CLIENT(S)', L, y, W);
    y += 5;

    const client = clientsData?.[0] || {};
    const clientNom = `${client.prenom || ''} ${client.nom || ''}`.trim();
    const clientTelCell = client.telephones?.find(t => t.actuel)?.telephone || client.telephones?.[0]?.telephone || '';
    const clientEmail = client.courriels?.find(c => c.actuel)?.courriel || client.courriels?.[0]?.courriel || '';
    const clientAddr = client.adresses?.find(a => a.actuelle) || client.adresses?.[0] || {};

    const c1 = W * 0.52;
    const c2 = W - c1;

    const clientRow = (labelL, valL, labelR, valR, rowY) => {
      doc.line(L, rowY + rowH, R, rowY + rowH);
      doc.line(L + c1, rowY, L + c1, rowY + rowH);
      bold(7.5);
      doc.text(labelL, L + 1, rowY + rowH / 2, { baseline: 'middle' });
      if (valL) { normal(8); doc.text(valL, L + c1 * 0.32, rowY + rowH / 2, { baseline: 'middle' }); }
      if (labelR) { bold(7.5); doc.text(labelR, L + c1 + 1, rowY + rowH / 2, { baseline: 'middle' }); }
      if (valR) { normal(8); doc.text(valR, L + c1 + 22, rowY + rowH / 2, { baseline: 'middle' }); }
    };

    clientRow('Nom(s) :', clientNom, 'Cellulaire :', clientTelCell, y);
    y += rowH;
    clientRow('', '', 'Travail :', '', y);
    y += rowH;
    clientRow('Adresse :', clientAddr.rue || '', 'Maison :', '', y);
    y += rowH;
    clientRow('Municipalité :', clientAddr.ville || '', 'Autre :', '', y);
    y += rowH;
    clientRow('Code postal :', clientAddr.code_postal || '', '', '', y);
    y += rowH;
    // Courriel (full width)
    doc.line(L, y + rowH, R, y + rowH);
    bold(7.5); doc.text('Courriel :', L + 1, y + rowH / 2, { baseline: 'middle' });
    normal(8); doc.text(clientEmail, L + 17, y + rowH / 2, { baseline: 'middle' });
    y += rowH;

    // ─── LOCALISATION DES TRAVAUX + NOTES ────────────────────────────────
    const locW = W * 0.52;
    const noteW = W - locW;
    sectionBar('LOCALISATION DES TRAVAUX', L, y, locW);
    sectionBar('FICHIER :', L + locW, y, noteW);
    y += 5;

    const addrT = mandat.adresse_travaux || {};
    const addrStr = [(addrT.numeros_civiques || []).filter(Boolean).join(', '), addrT.rue].filter(Boolean).join(' ');
    const lotsStr = (mandat.lots || []).join(', ') || mandat.lots_texte || '';

    const locH = rowH * 6;
    doc.rect(L, y, locW, locH);
    doc.rect(L + locW, y, noteW, locH);
    bold(7.5);
    doc.text('NOTES', L + locW + noteW / 2, y + 4, { align: 'center', baseline: 'middle' });
    normal(8);
    doc.line(L + locW, y + 5, R, y + 5);

    let ly = y + rowH;
    bold(7.5); doc.text('Adresse :', L + 1, ly, { baseline: 'middle' });
    normal(8); doc.text(addrStr, L + 17, ly, { baseline: 'middle' });
    ly += rowH;
    bold(7.5); doc.text('Municipalité :', L + 1, ly, { baseline: 'middle' });
    normal(8); doc.text(addrT.ville || '', L + 22, ly, { baseline: 'middle' });
    ly += rowH;
    bold(7.5); doc.text('Code postal :', L + 1, ly, { baseline: 'middle' });
    normal(8); doc.text(addrT.code_postal || '', L + 22, ly, { baseline: 'middle' });
    ly += rowH;
    cb(L + 1, ly + 0.5);
    normal(7); doc.text("Identique à l'adresse contact", L + 5.5, ly, { baseline: 'middle' });
    ly += rowH;
    cb(L + 1, ly + 0.5);
    doc.text("Litige avec voisin", L + 5.5, ly, { baseline: 'middle' });
    ly += rowH;
    bold(7.5); doc.text('Lots :', L + 1, ly, { baseline: 'middle' });
    normal(8); doc.text(lotsStr, L + 11, ly, { baseline: 'middle' });

    y += locH;

    // ─── INTERVENANTS ─────────────────────────────────────────────────────
    sectionBar('INTERVENANTS', L, y, W);
    y += 5;

    const notaire = notairesData?.[0] || {};
    const notaireNom = `${notaire.prenom || ''} ${notaire.nom || ''}`.trim();

    for (const [label, val] of [['Notaire :', notaireNom], ['Courtier :', ''], ['Autre :', '']]) {
      doc.line(L, y + rowH, R, y + rowH);
      bold(7.5); doc.text(label, L + 1, y + rowH / 2, { baseline: 'middle' });
      normal(8); if (val) doc.text(val, L + 20, y + rowH / 2, { baseline: 'middle' });
      y += rowH;
    }

    // Mandant
    doc.line(L, y + rowH, R, y + rowH);
    bold(7.5); doc.text('Mandant :', L + 1, y + rowH / 2, { baseline: 'middle' });
    cb(L + 20, y + rowH - 1); doc.text('Identique client', L + 24, y + rowH / 2, { baseline: 'middle' });
    cb(L + 54, y + rowH - 1); doc.text('Autre :', L + 58, y + rowH / 2, { baseline: 'middle' });
    y += rowH;

    // Propriétaire
    doc.line(L, y + rowH, R, y + rowH);
    bold(7.5); doc.text('Propriétaire :', L + 1, y + rowH / 2, { baseline: 'middle' });
    cb(L + 23, y + rowH - 1); doc.text('Identique client', L + 27, y + rowH / 2, { baseline: 'middle' });
    cb(L + 57, y + rowH - 1); doc.text('Autre :', L + 61, y + rowH / 2, { baseline: 'middle' });
    y += rowH;

    // ─── LIVRAISON ────────────────────────────────────────────────────────
    sectionBar('LIVRAISON', L, y, W);
    y += 5;
    doc.line(L, y + rowH, R, y + rowH);
    bold(7.5); doc.text('Date de signature:', L + 1, y + rowH / 2, { baseline: 'middle' });
    normal(8); doc.text(formatDate(mandat.date_signature), L + 30, y + rowH / 2, { baseline: 'middle' });
    y += rowH;

    // EN MAIN PROPRE / DOCUMENTS / FACTURE header
    const mpW = W * 0.18;
    const docsW = W * 0.49;
    const factW = W - mpW - docsW;
    const barH = 4;
    sectionBar('EN MAIN PROPRE :', L, y, mpW, barH);
    // checkbox in header
    cb(L + mpW - 4.5, y + barH - 0.5, false, 3);
    sectionBar('DOCUMENTS', L + mpW, y, docsW, barH);
    sectionBar('FACTURE', L + mpW + docsW, y, factW, barH);
    y += barH;

    for (const rowLabel of ['Client', 'Notaire', 'Courtier', 'Aut. :']) {
      doc.line(L, y + rowH, R, y + rowH);
      doc.line(L + mpW, y, L + mpW, y + rowH);
      doc.line(L + mpW + docsW, y, L + mpW + docsW, y + rowH);
      bold(7.5);
      doc.text(rowLabel, L + mpW - 1, y + rowH / 2, { align: 'right', baseline: 'middle' });
      normal(7.5);
      let dx = L + mpW + 2;
      for (const opt of ['Poste', 'Courriel']) {
        cb(dx, y + rowH - 1); doc.text(opt, dx + 4, y + rowH / 2, { baseline: 'middle' }); dx += 26;
      }
      dx = L + mpW + docsW + 2;
      for (const opt of ['Papier', 'Courriel']) {
        cb(dx, y + rowH - 1); doc.text(opt, dx + 4, y + rowH / 2, { baseline: 'middle' }); dx += 25;
      }
      y += rowH;
    }

    // ─── PRIX ─────────────────────────────────────────────────────────────
    sectionBar('PRIX', L, y, W);
    y += 5;

    const pCols = [W * 0.28, W * 0.13, W * 0.13, W * 0.13];
    const pRight = L + pCols[0] + pCols[1] + pCols[2] + pCols[3];
    const pRightW = R - pRight;

    // Headers
    let px2 = L;
    for (const [h, w] of [['Opération', pCols[0]], ['Prix', pCols[1]], ['Rabais', pCols[2]], ['Total', pCols[3]]]) {
      doc.rect(px2, y, w, rowH);
      bold(7.5); doc.text(h, px2 + w / 2, y + rowH / 2, { align: 'center', baseline: 'middle' });
      px2 += w;
    }

    // Right side info block (spans multiple rows)
    const rightBlockH = rowH * 5;
    doc.rect(pRight, y, pRightW, rightBlockH);
    normal(7);
    let ry2 = y + rowH * 0.6;
    doc.text('Taxes :', pRight + 1, ry2);
    cb(pRight + 14, ry2 + 2.5); doc.text('Non-Incluses', pRight + 18, ry2);
    cb(pRight + 40, ry2 + 2.5); doc.text('Incluses', pRight + 44, ry2);
    ry2 += rowH;
    doc.text('Frais dépôt :', pRight + 1, ry2);
    cb(pRight + 18, ry2 + 2.5); doc.text('Oui', pRight + 22, ry2);
    cb(pRight + 32, ry2 + 2.5); doc.text('Non', pRight + 36, ry2);
    ry2 += rowH;
    doc.text('Frais ouvert :', pRight + 1, ry2);
    cb(pRight + 19, ry2 + 2.5); doc.text('Oui', pRight + 23, ry2);
    cb(pRight + 33, ry2 + 2.5); doc.text('Non', pRight + 37, ry2);
    ry2 += rowH;
    bold(7); doc.text('Modalités :', pRight + 1, ry2);
    ry2 += rowH;
    normal(7); doc.text('*Piquetage suggéré :', pRight + 1, ry2);
    cb(pRight + 30, ry2 + 2.5); doc.text('Oui', pRight + 34, ry2);
    cb(pRight + 42, ry2 + 2.5); doc.text('Non', pRight + 46, ry2);
    normal(8);

    y += rowH;
    // Mandat data rows
    const mandats = dossierData.mandats?.length ? dossierData.mandats : [mandat];
    for (const m of mandats) {
      if (!m?.type_mandat) continue;
      const total = (m.prix_estime || 0) - (m.rabais || 0);
      px2 = L;
      for (const [val, w] of [
        [m.type_mandat, pCols[0]],
        [m.prix_estime ? `${Number(m.prix_estime).toFixed(2)} $` : '', pCols[1]],
        [m.rabais ? `${Number(m.rabais).toFixed(2)} $` : '', pCols[2]],
        [total > 0 ? `${total.toFixed(2)} $` : '', pCols[3]]
      ]) {
        doc.rect(px2, y, w, rowH);
        normal(7); doc.text(String(val), px2 + 1, y + rowH / 2, { baseline: 'middle' });
        px2 += w;
      }
      y += rowH;
    }

    // Blank rows to fill up to right block
    const mandatRowCount = mandats.filter(m => m?.type_mandat).length;
    const blankRows = Math.max(0, 3 - mandatRowCount);
    for (let i = 0; i < blankRows; i++) {
      px2 = L;
      for (const w of pCols) { doc.rect(px2, y, w, rowH); px2 += w; }
      y += rowH;
    }

    // Total row
    px2 = L;
    for (const [val, w, isBold] of [
      ['', pCols[0], false],
      ['', pCols[1], false],
      ['Total', pCols[2], true],
      [mandats.reduce((s, m) => s + ((m?.prix_estime || 0) - (m?.rabais || 0)), 0).toFixed(2) + ' $', pCols[3], false]
    ]) {
      doc.rect(px2, y, w, rowH);
      if (isBold) { bold(7.5); doc.text(val, px2 + w / 2, y + rowH / 2, { align: 'center', baseline: 'middle' }); }
      else { normal(7); if (val && val !== '0.00 $') doc.text(val, px2 + 1, y + rowH / 2, { baseline: 'middle' }); }
      px2 += w;
    }
    y += rowH;

    // ─── RÉFÉRENCE ────────────────────────────────────────────────────────
    sectionBar('RÉFÉRENCE', L, y, W);
    y += 5;
    doc.rect(L, y, W, rowH * 2);
    const refs1 = ['Courtier', 'Notaire', 'Connaissance', 'Site Web', 'Bouche à oreille'];
    const refs2 = ['Bottin', 'Publicité', 'Réseaux sociaux', 'Greffe', 'Club sociaux/BNI'];
    const refs3 = ['Magasineux', 'Anc. Client', 'Autre _______________'];
    normal(7);
    let refX = L + 1;
    for (const r of refs1) { cb(refX, y + 3); doc.text(r, refX + 4, y + 1.5, { baseline: 'middle' }); refX += 37; }
    refX = L + 1;
    for (const r of refs2) { cb(refX, y + rowH + 3); doc.text(r, refX + 4, y + rowH + 1.5, { baseline: 'middle' }); refX += 37; }
    y += rowH * 2;
    doc.rect(L, y, W, rowH);
    refX = L + 1;
    for (const r of refs3) { cb(refX, y + 3); doc.text(r, refX + 4, y + 1.5, { baseline: 'middle' }); refX += 42; }
    y += rowH;

    // ─── VALIDATION DES OBSERVATIONS ─────────────────────────────────────
    sectionBar('VALIDATION DES OBSERVATIONS', L, y, W);
    y += 5;
    const validH = 22;
    doc.rect(L, y, W, validH);
    normal(6.8);
    const validText = `Je, soussigné ${dossierData.arpenteur_geometre || ''}, arpenteur-géomètre, certifie par la présente avoir pris personnellement connaissance des observations relatives aux éléments visés aux paragraphes 9 et 13 à 17 du premier alinéa de l'article 9 du Règlement sur la norme de pratique relative au certificat de localisation et les avoir validées.`;
    const vlines = doc.splitTextToSize(validText, W - 4);
    doc.text(vlines, L + 2, y + 3);
    const afterText = y + 3 + vlines.length * 2.8;
    cb(L + 2, afterText + 3); bold(7.5); doc.text('Visite des lieux', L + 6.5, afterText + 1.5, { baseline: 'middle' });
    cb(L + 2, afterText + 7.5); bold(7.5); doc.text('Photographies', L + 6.5, afterText + 6, { baseline: 'middle' });
    const sigY = y + validH - 3;
    bold(7.5); doc.text('Date de la validation :', L + 2, sigY, { baseline: 'middle' });
    doc.setLineWidth(0.3); doc.line(L + 35, sigY, L + 72, sigY);
    doc.text('Signature :', L + 74, sigY, { baseline: 'middle' });
    doc.line(L + 88, sigY, R - 1, sigY);
    normal(8);
    y += validH;

    // ─── FERMETURE ────────────────────────────────────────────────────────
    sectionBar('FERMETURE', L, y, W);
    y += 5;
    doc.rect(L, y, W / 2, rowH); doc.rect(L + W / 2, y, W / 2, rowH);
    bold(7.5);
    doc.text('Date de fermeture :', L + 1, y + rowH / 2, { baseline: 'middle' });
    doc.text('Signature :', L + W / 2 + 1, y + rowH / 2, { baseline: 'middle' });
    normal(8);

    // Rev footer p1
    doc.setFontSize(6.5);
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ─── PAGE 2: TEMPS ────────────────────────────────────────────────────
    doc.addPage();
    doc.setFontSize(6.5);
    doc.text('Rév. 13    Date : 2 juin 2022', L, 8);

    // Outer border p2
    doc.setLineWidth(0.5);
    doc.rect(L, 10, W, 180);
    doc.setLineWidth(0.3);

    sectionBar('TEMPS', L, 10, W, 6);

    const tCols = [W * 0.18, W * 0.25, W * 0.43, W * 0.14];
    const tHeaders = ['DATE', 'EMPLOYÉ(S)', 'DESCRIPTION', 'TEMPS'];
    let ty3 = 16;

    // Header row
    let tx3 = L;
    for (let i = 0; i < tHeaders.length; i++) {
      doc.rect(tx3, ty3, tCols[i], 6);
      bold(8);
      doc.text(tHeaders[i], tx3 + tCols[i] / 2, ty3 + 3, { align: 'center', baseline: 'middle' });
      tx3 += tCols[i];
    }
    ty3 += 6;
    normal(8);

    const subSections = [
      ['PLANIFICATION', 2],
      ['TERRAIN', 6],
      ['RECHERCHES ET ANALYSE FONCIÈRE', 4],
      ['TRAITEMENT ET DESSIN', 4],
      ['RAPPORT/RÉDACTION', 3],
    ];

    for (const [title, count] of subSections) {
      doc.setFillColor(220, 220, 220);
      doc.rect(L, ty3, W, 5, 'FD');
      bold(8);
      doc.text(title, L + 2, ty3 + 2.5, { baseline: 'middle' });
      ty3 += 5;
      for (let r = 0; r < count; r++) {
        tx3 = L;
        for (const tc of tCols) { doc.rect(tx3, ty3, tc, 6); tx3 += tc; }
        ty3 += 6;
      }
    }
    normal(8);

    doc.setFontSize(6.5);
    doc.text('Rév. 13    Date : 2 juin 2022', L, pH - 5);

    // ─── OUTPUT ───────────────────────────────────────────────────────────
    const pdfBytes = doc.output('arraybuffer');
    const uint8 = new Uint8Array(pdfBytes);
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      base64 += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
    }
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