import { PDFDocument, rgb, StandardFonts, PDFName, PDFBool, PDFString } from 'npm:pdf-lib@1.17.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const getArpenteurInitials = (arpenteur) => {
  const m = { "Samuel Guay":"SG","Dany Gaboury":"DG","Pierre-Luc Pilote":"PLP","Benjamin Larouche":"BL","Frédéric Gilbert":"FG" };
  return m[arpenteur] || "XX";
};

const formatDate = (d) => {
  if (!d) return "";
  try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA'); } catch { return d; }
};

// Convert mm to points (72pt = 1 inch = 25.4mm)
const mm = (v) => v * 2.83464566929;

// Colors
const BLACK = rgb(0,0,0);
const DARK_BLUE = rgb(0, 0.15, 0.39);
const GRAY = rgb(0.7, 0.7, 0.7);
const LIGHT_GRAY = rgb(0.82, 0.82, 0.82);
const WHITE = rgb(1,1,1);

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
    let logoBytes = null;
    try {
      const r = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png');
      if (r.ok) logoBytes = new Uint8Array(await r.arrayBuffer());
    } catch(_) {}

    // ── Document ───────────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(pdfFileName);
    pdfDoc.setAuthor('Girard Tremblay Gilbert Inc.');

    const form = pdfDoc.getForm();

    // Legal: 8.5" x 14" = 612 x 1008 pt
    const PW = 612, PH = 1008;
    const ML = mm(10), MR = mm(10);
    const W = PW - ML - MR;
    const L = ML, R = PW - MR;
    const RH = mm(5.5);

    const page1 = pdfDoc.addPage([PW, PH]);
    const page2 = pdfDoc.addPage([PW, PH]);

    // Load fonts
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // ── Helper: pdf-lib y = from bottom, we work from top ──────────────────
    // topY: position from top of page
    const py = (topY) => PH - topY;

    // ── Drawing helpers ─────────────────────────────────────────────────────
    const hline = (page, topY, x1 = L, x2 = R, lw = 0.5) => {
      page.drawLine({ start:{x:x1,y:py(topY)}, end:{x:x2,y:py(topY)}, thickness:lw, color:BLACK });
    };
    const vline = (page, x, topY1, topY2, lw = 0.5) => {
      page.drawLine({ start:{x,y:py(topY1)}, end:{x,y:py(topY2)}, thickness:lw, color:BLACK });
    };
    const rect = (page, x, topY, w, h, options = {}) => {
      page.drawRectangle({ x, y: py(topY + h), width: w, height: h,
        borderColor: options.noBorder ? undefined : BLACK,
        borderWidth: options.noBorder ? 0 : (options.bw || 0.5),
        color: options.fill || undefined,
        opacity: options.opacity ?? 1,
      });
    };

    const label = (page, text, x, topY, options = {}) => {
      const font = options.bold ? fontBold : fontReg;
      const size = options.size || 8;
      const color = options.color || BLACK;
      const tW = font.widthOfTextAtSize(text, size);
      let tx = x;
      if (options.align === 'center') tx = x - tW / 2;
      else if (options.align === 'right') tx = x - tW;
      page.drawText(text, { x: tx, y: py(topY) - size * 0.35, font, size, color });
    };

    const sectionBar = (page, title, x, topY, w, h = mm(5)) => {
      rect(page, x, topY, w, h, { fill: LIGHT_GRAY });
      label(page, title, x + w/2, topY + h/2 + mm(1), { bold:true, size:9, align:'center' });
    };

    let _cbIdx = 0;
    const checkbox = (page, x, topY, size = mm(2.8), checked = false) => {
      const field = form.createCheckBox(`cb_${_cbIdx++}`);
      if (checked) field.check();
      field.acroField.dict.set(PDFName.of('DA'), PDFString.of('/ZaDb 8 Tf 0 0 0 rg'));
      field.addToPage(page, {
        x, y: py(topY + size), width: size, height: size,
        borderWidth: 0.5, borderColor: BLACK, backgroundColor: WHITE,
      });
    };

    // ── AcroForm text field helper ──────────────────────────────────────────
    // x, topY: top-left in our coordinate system
    // DA = default appearance string required by PDF spec
    const DA_STRING = '/Helv 8 Tf 0 0 0 rg';

    const addField = (name, page, x, topY, w, h, value = '', options = {}) => {
      const field = form.createTextField(name);
      if (value) field.setText(value);
      if (options.multiline) field.enableMultiline();
      // Set /DA directly on the acroField dict to avoid the missing DA error
      field.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA_STRING));
      field.addToPage(page, {
        x, y: py(topY + h), width: w, height: h,
        borderWidth: 0, borderColor: rgb(1,1,1), backgroundColor: rgb(1,1,1),
      });
    };

    // ────────────────────────────────────────────────────────────────────────
    // PAGE 1
    // ────────────────────────────────────────────────────────────────────────
    const p = page1;

    // Footer
    label(p, 'Rév. 13    Date : 2 juin 2022', L, PH - mm(4), { size: 7 });

    // Outer border
    rect(p, L, mm(9), W, PH - mm(9) - mm(7), { bw: 1.5 });

    // ── HEADER ──────────────────────────────────────────────────────────────
    let y = mm(9);
    const hdrH = mm(15);

    if (logoBytes) {
      try {
        const img = await pdfDoc.embedPng(logoBytes);
        p.drawImage(img, { x: L + mm(1), y: py(y + hdrH) + mm(1), width: mm(11), height: mm(13) });
      } catch(_) {}
    }

    label(p, 'Girard Tremblay Gilbert Inc.', L + mm(14), y + mm(8.5), { bold:true, size:10.5 });
    label(p, 'FICHE MANDAT', R - mm(2), y + mm(9), { bold:true, size:24, align:'right' });
    hline(p, y + hdrH, L, R, 1);

    y += hdrH;
    const HALF = W / 2;

    // ── DATE MANDAT / DOSSIER ────────────────────────────────────────────────
    hline(p, y + RH);
    vline(p, L + HALF, y, y + RH);
    label(p, 'Date du mandat :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    label(p, `Numéro de dossier : ${arpInitials}-`, L + HALF + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });

    const dateMandat = formatDate(dossierData.date_ouverture);
    addField('date_mandat', p, L + mm(29), y + mm(0.5), HALF - mm(30), RH - mm(1), dateMandat);

    const numAfterInitX = L + HALF + mm(1.5) + fontBold.widthOfTextAtSize(`Numéro de dossier : ${arpInitials}-`, 8);
    addField('numero_dossier', p, numAfterInitX + mm(1), y + mm(0.5), R - numAfterInitX - mm(2), RH - mm(1), dossierNum);
    y += RH;

    // ── DATE LIVRAISON ───────────────────────────────────────────────────────
    hline(p, y + RH);
    vline(p, L + HALF, y, y + RH);
    label(p, 'Date de livraison :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });

    const dateLiv = formatDate(mandat.date_livraison);
    addField('date_livraison', p, L + mm(29), y + mm(0.5), HALF - mm(30), RH - mm(1), dateLiv);

    // FLEXIBLE / STRICTE
    const fxX = L + HALF + mm(2);
    checkbox(p, fxX, y + RH/2 - mm(1.4));
    label(p, 'FLEXIBLE', fxX + mm(4), y + RH/2 + mm(1.2), { bold:true, size:8.5 });
    const stX = L + HALF + HALF * 0.52;
    checkbox(p, stX, y + RH/2 - mm(1.4));
    label(p, 'STRICTE', stX + mm(4), y + RH/2 + mm(1.2), { bold:true, size:8.5 });
    y += RH;

    // ── TYPE D'ARPENTAGE ─────────────────────────────────────────────────────
    const typeH = mm(11);
    hline(p, y + typeH);
    label(p, "Type d'arpentage :", L + mm(1.5), y + mm(4.5), { bold:true, size:8 });

    const row1 = ['CL','DT','PIQ','LOTIS','AUT ___'];
    const row2 = ['IMP *','OCTR','LEVÉ','BORN'];
    const colStep = (W - mm(32)) / 5;
    let cx = L + mm(32);
    for (const lbl of row1) {
      checkbox(p, cx, y + mm(2), mm(2.8));
      label(p, lbl, cx + mm(4.5), y + mm(4), { size:8 });
      cx += colStep;
    }
    cx = L + mm(32);
    for (const lbl of row2) {
      checkbox(p, cx, y + mm(7), mm(2.8));
      label(p, lbl, cx + mm(4.5), y + mm(9), { size:8 });
      cx += colStep;
    }
    y += typeH;

    // ── CLIENT(S) ────────────────────────────────────────────────────────────
    sectionBar(p, 'CLIENT(S)', L, y, W);
    y += mm(5);

    const client = clientsData?.[0] || {};
    const clientNom = `${client.prenom||''} ${client.nom||''}`.trim();
    const clientCell = client.telephones?.find(t=>t.actuel)?.telephone || client.telephones?.[0]?.telephone || '';
    const clientTravail = client.telephones?.find(t=>!t.actuel)?.telephone || '';
    const clientEmail = client.courriels?.find(c=>c.actuel)?.courriel || client.courriels?.[0]?.courriel || '';
    const clientAddr = client.adresses?.find(a=>a.actuelle) || client.adresses?.[0] || {};
    const cDiv = L + HALF;

    // Nom | Cellulaire
    hline(p, y + RH); vline(p, cDiv, y, y + RH);
    label(p, 'Nom(s) :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    label(p, 'Cellulaire :', cDiv + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('client_nom', p, L + mm(17), y + mm(0.5), cDiv - L - mm(18), RH - mm(1), clientNom);
    addField('client_cell', p, cDiv + mm(22), y + mm(0.5), R - cDiv - mm(23), RH - mm(1), clientCell);
    y += RH;

    // blank | Travail
    hline(p, y + RH); vline(p, cDiv, y, y + RH);
    label(p, 'Travail :', cDiv + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('client_travail', p, cDiv + mm(17), y + mm(0.5), R - cDiv - mm(18), RH - mm(1), clientTravail);
    y += RH;

    // Adresse | Maison
    hline(p, y + RH); vline(p, cDiv, y, y + RH);
    label(p, 'Adresse :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    label(p, 'Maison :', cDiv + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('client_adresse', p, L + mm(18), y + mm(0.5), cDiv - L - mm(19), RH - mm(1), clientAddr.rue || '');
    addField('client_maison', p, cDiv + mm(18), y + mm(0.5), R - cDiv - mm(19), RH - mm(1));
    y += RH;

    // Municipalité | Autre
    hline(p, y + RH); vline(p, cDiv, y, y + RH);
    label(p, 'Municipalité :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    label(p, 'Autre :', cDiv + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('client_ville', p, L + mm(23), y + mm(0.5), cDiv - L - mm(24), RH - mm(1), clientAddr.ville || '');
    addField('client_autre', p, cDiv + mm(14), y + mm(0.5), R - cDiv - mm(15), RH - mm(1));
    y += RH;

    // Code postal
    hline(p, y + RH); vline(p, cDiv, y, y + RH);
    label(p, 'Code postal :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('client_cp', p, L + mm(22), y + mm(0.5), cDiv - L - mm(23), RH - mm(1), clientAddr.code_postal || '');
    y += RH;

    // Courriel
    hline(p, y + RH);
    label(p, 'Courriel :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('client_courriel', p, L + mm(18), y + mm(0.5), W - mm(19), RH - mm(1), clientEmail);
    y += RH;

    // ── LOCALISATION / FICHIER ───────────────────────────────────────────────
    const locW = W * 0.54, noteW = W - locW;
    sectionBar(p, 'LOCALISATION DES TRAVAUX', L, y, locW);
    sectionBar(p, 'FICHIER :', L + locW, y, noteW);
    y += mm(5);

    const addrT = mandat.adresse_travaux || {};
    const addrStr = [(addrT.numeros_civiques||[]).filter(Boolean).join(', '), addrT.rue].filter(Boolean).join(' ');
    const lotsStr = (mandat.lots||[]).join(', ') || mandat.lots_texte || '';

    const locH = RH * 7;
    rect(p, L, y, locW, locH, { bw: 0.5 });
    rect(p, L + locW, y, noteW, locH, { bw: 0.5 });
    label(p, 'NOTES', L + locW + noteW/2, y + mm(4), { bold:true, size:9, align:'center' });
    hline(p, y + mm(5), L + locW, R);

    // Notes field
    addField('notes', p, L + locW + mm(1), y + mm(5.5), noteW - mm(2), locH - mm(6), '', { multiline: true });

    // Localisation rows
    let ly = y;
    hline(p, ly + RH, L, L + locW);
    label(p, 'Adresse :', L + mm(1.5), ly + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('loc_adresse', p, L + mm(18), ly + mm(0.5), locW - mm(19), RH - mm(1), addrStr);
    ly += RH;
    hline(p, ly + RH, L, L + locW);
    label(p, 'Municipalité :', L + mm(1.5), ly + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('loc_ville', p, L + mm(23), ly + mm(0.5), locW - mm(24), RH - mm(1), addrT.ville || '');
    ly += RH;
    hline(p, ly + RH, L, L + locW);
    label(p, 'Code postal :', L + mm(1.5), ly + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('loc_cp', p, L + mm(22), ly + mm(0.5), locW - mm(23), RH - mm(1), addrT.code_postal || '');
    ly += RH;
    hline(p, ly + RH, L, L + locW);
    checkbox(p, L + mm(1.5), ly + RH/2 - mm(1.4));
    label(p, "Identique à l'adresse contact", L + mm(6), ly + RH/2 + mm(1.2), { size:8 });
    ly += RH;
    hline(p, ly + RH, L, L + locW);
    checkbox(p, L + mm(1.5), ly + RH/2 - mm(1.4));
    label(p, 'Litige avec voisin', L + mm(6), ly + RH/2 + mm(1.2), { size:8 });
    ly += RH;
    label(p, 'Lots :', L + mm(1.5), ly + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('lots', p, L + mm(12), ly + mm(0.5), locW - mm(13), RH - mm(1), lotsStr);

    y += locH;

    // ── INTERVENANTS ──────────────────────────────────────────────────────────
    sectionBar(p, 'INTERVENANTS', L, y, W);
    y += mm(5);

    const notaire = notairesData?.[0] || {};
    const notaireNom = `${notaire.prenom||''} ${notaire.nom||''}`.trim();

    for (const [lbl, val] of [['Notaire :', notaireNom], ['Courtier :', ''], ['Autre :', '']]) {
      hline(p, y + RH);
      label(p, lbl, L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
      addField('interv_'+lbl, p, L + mm(18), y + mm(0.5), W - mm(19), RH - mm(1), val);
      y += RH;
    }

    hline(p, y + RH);
    label(p, 'Mandant :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    checkbox(p, L + mm(19), y + RH/2 - mm(1.4));
    label(p, 'Identique client', L + mm(23), y + RH/2 + mm(1.2), { bold:true, size:8 });
    checkbox(p, L + mm(52), y + RH/2 - mm(1.4));
    label(p, 'Autre :', L + mm(56), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('mandant_autre', p, L + mm(66), y + mm(0.5), W - mm(67), RH - mm(1));
    y += RH;

    hline(p, y + RH);
    label(p, 'Propriétaire :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    checkbox(p, L + mm(22), y + RH/2 - mm(1.4));
    label(p, 'Identique client', L + mm(26), y + RH/2 + mm(1.2), { bold:true, size:8 });
    checkbox(p, L + mm(55), y + RH/2 - mm(1.4));
    label(p, 'Autre :', L + mm(59), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('proprio_autre', p, L + mm(69), y + mm(0.5), W - mm(70), RH - mm(1));
    y += RH;

    // ── LIVRAISON ─────────────────────────────────────────────────────────────
    sectionBar(p, 'LIVRAISON', L, y, W);
    y += mm(5);

    hline(p, y + RH);
    label(p, 'Date de signature:', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    const dateSig = formatDate(mandat.date_signature);
    addField('date_signature', p, L + mm(30), y + mm(0.5), W - mm(31), RH - mm(1), dateSig);
    y += RH;

    // EN MAIN PROPRE | DOCUMENTS | FACTURE
    const mpW = W * 0.19, docsW = W * 0.50, factW = W - mpW - docsW, barH = mm(5);
    sectionBar(p, 'EN MAIN PROPRE :', L, y, mpW, barH);
    checkbox(p, L + mpW - mm(5), y + barH/2 - mm(1.4));
    sectionBar(p, 'DOCUMENTS', L + mpW, y, docsW, barH);
    sectionBar(p, 'FACTURE', L + mpW + docsW, y, factW, barH);
    y += barH;

    for (const rowLbl of ['Client','Notaire','Courtier','Aut. :']) {
      hline(p, y + RH);
      vline(p, L + mpW, y, y + RH);
      vline(p, L + mpW + docsW, y, y + RH);
      const lblW = fontBold.widthOfTextAtSize(rowLbl, 8);
      label(p, rowLbl, L + mpW - mm(1.5) - lblW, y + RH/2 + mm(1.2), { bold:true, size:8 });
      let dx = L + mpW + mm(3);
      for (const opt of ['Poste','Courriel']) {
        checkbox(p, dx, y + RH/2 - mm(1.4));
        label(p, opt, dx + mm(4.5), y + RH/2 + mm(1.2), { size:8 }); dx += mm(26);
      }
      dx = L + mpW + docsW + mm(2);
      for (const opt of ['Papier','Courriel']) {
        checkbox(p, dx, y + RH/2 - mm(1.4));
        label(p, opt, dx + mm(4.5), y + RH/2 + mm(1.2), { size:8 }); dx += mm(26);
      }
      y += RH;
    }

    // ── PRIX ──────────────────────────────────────────────────────────────────
    sectionBar(p, 'PRIX', L, y, W);
    y += mm(5);

    const pCols = [W*0.26, W*0.12, W*0.12, W*0.12];
    const pRightX = L + pCols[0] + pCols[1] + pCols[2] + pCols[3];
    const pRightW = R - pRightX;
    const rightBlockRows = 5;
    const rightBlockH = RH * rightBlockRows;

    // Header
    let px = L;
    for (const [h, w] of [['Opération',pCols[0]],['Prix',pCols[1]],['Rabais',pCols[2]],['Total',pCols[3]]]) {
      rect(p, px, y, w, RH, { bw: 0.5 });
      label(p, h, px + w/2, y + RH/2 + mm(1.2), { bold:true, size:8.5, align:'center' });
      px += w;
    }

    // Right block
    rect(p, pRightX, y, pRightW, rightBlockH, { bw: 0.5 });

    // Right block row lines
    for (let ri = 1; ri < rightBlockRows; ri++) {
      hline(p, y + RH * ri, pRightX, R);
    }

    // Right block content
    let ry = y;
    label(p, 'Taxes :', pRightX + mm(1.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(14), ry + RH/2 - mm(1.4));
    label(p, 'Non-Incluses', pRightX + mm(18), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(40), ry + RH/2 - mm(1.4));
    label(p, 'Incluses', pRightX + mm(44), ry + RH/2 + mm(1.2), { size:8 });
    ry += RH;

    label(p, 'Frais dépôt :', pRightX + mm(1.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(21), ry + RH/2 - mm(1.4));
    label(p, 'Oui', pRightX + mm(25.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(34), ry + RH/2 - mm(1.4));
    label(p, 'Non', pRightX + mm(38.5), ry + RH/2 + mm(1.2), { size:8 });
    ry += RH;

    label(p, 'Frais ouvert :', pRightX + mm(1.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(22), ry + RH/2 - mm(1.4));
    label(p, 'Oui', pRightX + mm(26.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(35), ry + RH/2 - mm(1.4));
    label(p, 'Non', pRightX + mm(39.5), ry + RH/2 + mm(1.2), { size:8 });
    ry += RH;

    label(p, 'Modalités :', pRightX + mm(1.5), ry + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('modalites', p, pRightX + mm(19), ry + mm(0.5), pRightW - mm(20), RH - mm(1));
    ry += RH;

    label(p, '*Piquetage suggéré :', pRightX + mm(1.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(30), ry + RH/2 - mm(1.4));
    label(p, 'Oui', pRightX + mm(34.5), ry + RH/2 + mm(1.2), { size:8 });
    checkbox(p, pRightX + mm(43), ry + RH/2 - mm(1.4));
    label(p, 'Non', pRightX + mm(47.5), ry + RH/2 + mm(1.2), { size:8 });

    y += RH;

    // Mandat data rows
    const mandats = dossierData.mandats?.length ? dossierData.mandats : [mandat];
    const dataRows = mandats.filter(m => m?.type_mandat);
    const totalRows = Math.max(3, dataRows.length);

    for (let i = 0; i < totalRows; i++) {
      const m = dataRows[i] || null;
      const total = m ? ((m.prix_estime||0) - (m.rabais||0)) : 0;
      px = L;
      const vals = [
        [m?.type_mandat||'', pCols[0]],
        [m?.prix_estime ? `${Number(m.prix_estime).toFixed(2)} $` : '', pCols[1]],
        [m?.rabais ? `${Number(m.rabais).toFixed(2)} $` : '', pCols[2]],
        [total > 0 ? `${total.toFixed(2)} $` : '', pCols[3]]
      ];
      for (const [val, w] of vals) {
        rect(p, px, y, w, RH, { bw: 0.5 });
        addField(`prix_r${i}_c${px.toFixed(0)}`, p, px + mm(0.5), y + mm(0.5), w - mm(1), RH - mm(1), val);
        px += w;
      }
      y += RH;
    }

    // Total row
    px = L;
    const grandTotal = mandats.reduce((s, m) => s + ((m?.prix_estime||0) - (m?.rabais||0)), 0);
    for (const [val, w, bold] of [['',pCols[0],false],['',pCols[1],false],['Total',pCols[2],true],[grandTotal > 0 ? `${grandTotal.toFixed(2)} $` : '',pCols[3],false]]) {
      rect(p, px, y, w, RH, { bw: 0.5 });
      if (bold) label(p, val, px + w/2, y + RH/2 + mm(1.2), { bold:true, size:8.5, align:'center' });
      else if (val) {
        label(p, val, px + mm(1.5), y + RH/2 + mm(1.2), { size:8, color: DARK_BLUE });
      }
      px += w;
    }
    y += RH;

    // ── RÉFÉRENCE ─────────────────────────────────────────────────────────────
    sectionBar(p, 'RÉFÉRENCE', L, y, W);
    y += mm(5);

    const refs1 = ['Courtier','Notaire','Connaissance','Site Web','Bouche à oreille'];
    const refs2 = ['Bottin','Publicité','Réseaux sociaux','Greffe','Club sociaux/BNI'];
    const refs3 = ['Magasineux','Anc. Client','Autre ___________________________'];

    rect(p, L, y, W, RH * 3, { bw: 0.5 });
    hline(p, y + RH); hline(p, y + RH * 2);

    const refStep = W / 5;
    let rx = L + mm(1.5);
    for (const r of refs1) { checkbox(p, rx, y + RH/2 - mm(1.4)); label(p, r, rx + mm(4.5), y + RH/2 + mm(1.2), { size:8 }); rx += refStep; }
    rx = L + mm(1.5);
    for (const r of refs2) { checkbox(p, rx, y + RH*1 + RH/2 - mm(1.4)); label(p, r, rx + mm(4.5), y + RH + RH/2 + mm(1.2), { size:8 }); rx += refStep; }
    rx = L + mm(1.5);
    for (const r of refs3) { checkbox(p, rx, y + RH*2 + RH/2 - mm(1.4)); label(p, r, rx + mm(4.5), y + RH*2 + RH/2 + mm(1.2), { size:8 }); rx += refStep; }
    y += RH * 3;

    // ── VALIDATION DES OBSERVATIONS ───────────────────────────────────────────
    sectionBar(p, 'VALIDATION DES OBSERVATIONS', L, y, W);
    y += mm(5);

    const validH = mm(24);
    rect(p, L, y, W, validH, { bw: 0.5 });

    const validText = `Je, soussigné ${dossierData.arpenteur_geometre||''}, arpenteur-géomètre, certifie par la présente avoir pris personnellement connaissance des observations relatives aux éléments visés aux paragraphes 9 et 13 à 17 du premier alinéa de l'article 9 du Règlement sur la norme de pratique relative au certificat de localisation et les avoir validées.`;

    // Word wrap manually
    const words = validText.split(' ');
    const maxLineW = W - mm(3);
    let lines = [], line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (fontReg.widthOfTextAtSize(test, 7.5) > maxLineW) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);

    for (let i = 0; i < lines.length; i++) {
      label(p, lines[i], L + mm(1.5), y + mm(3.5) + i * mm(3.2), { size: 7.5 });
    }

    const afterTxt = y + mm(3.5) + lines.length * mm(3.2) + mm(2);
    checkbox(p, L + mm(2), afterTxt - mm(1.4));
    label(p, 'Visite des lieux', L + mm(6.5), afterTxt + mm(1.2), { bold:true, size:8 });
    checkbox(p, L + mm(2), afterTxt + mm(4));
    label(p, 'Photographies', L + mm(6.5), afterTxt + mm(6.6), { bold:true, size:8 });

    const sigY = y + validH - mm(4);
    label(p, 'Date de la validation :', L + mm(2), sigY + mm(1.2), { size:8 });
    p.drawLine({ start:{x:L+mm(36),y:py(sigY)}, end:{x:L+mm(76),y:py(sigY)}, thickness:0.5, color:BLACK });
    addField('date_validation', p, L + mm(36), sigY - mm(4), mm(40), mm(4.5));
    label(p, 'Signature :', L + mm(78), sigY + mm(1.2), { size:8 });
    p.drawLine({ start:{x:L+mm(92),y:py(sigY)}, end:{x:R-mm(1),y:py(sigY)}, thickness:0.5, color:BLACK });
    y += validH;

    // ── FERMETURE ─────────────────────────────────────────────────────────────
    sectionBar(p, 'FERMETURE', L, y, W);
    y += mm(5);
    rect(p, L, y, W/2, RH, { bw: 0.5 });
    rect(p, L + W/2, y, W/2, RH, { bw: 0.5 });
    label(p, 'Date de fermeture :', L + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    label(p, 'Signature :', L + W/2 + mm(1.5), y + RH/2 + mm(1.2), { bold:true, size:8 });
    addField('date_fermeture', p, L + mm(31), y + mm(0.5), W/2 - mm(32), RH - mm(1));

    // ────────────────────────────────────────────────────────────────────────
    // PAGE 2: TEMPS
    // ────────────────────────────────────────────────────────────────────────
    const p2 = page2;
    label(p2, 'Rév. 13    Date : 2 juin 2022', L, PH - mm(4), { size: 7 });

    const p2Y0 = mm(9);
    const p2H = mm(175);
    rect(p2, L, p2Y0, W, p2H, { bw: 1.5 });
    sectionBar(p2, 'TEMPS', L, p2Y0, W, mm(6));

    const tCols = [W*0.17, W*0.25, W*0.44, W*0.14];
    const tHeaders = ['DATE','EMPLOYÉ(S)','DESCRIPTION','TEMPS'];
    let ty = p2Y0 + mm(6);

    let tx = L;
    for (let i = 0; i < tHeaders.length; i++) {
      rect(p2, tx, ty, tCols[i], mm(6), { bw: 0.5 });
      label(p2, tHeaders[i], tx + tCols[i]/2, ty + mm(3.5), { bold:true, size:9, align:'center' });
      tx += tCols[i];
    }
    ty += mm(6);

    const subSections = [
      ['PLANIFICATION',2],['TERRAIN',6],
      ['RECHERCHES ET ANALYSE FONCIÈRE',4],['TRAITEMENT ET DESSIN',4],['RAPPORT/RÉDACTION',3],
    ];

    for (const [title, count] of subSections) {
      rect(p2, L, ty, W, mm(5.5), { fill: LIGHT_GRAY, bw: 0.5 });
      label(p2, title, L + mm(2), ty + mm(4), { bold:true, size:8.5 });
      ty += mm(5.5);
      for (let r = 0; r < count; r++) {
        tx = L;
        for (let ci = 0; ci < tCols.length; ci++) {
          rect(p2, tx, ty, tCols[ci], mm(6), { bw: 0.5 });
          addField(`temps_${title.slice(0,8)}_r${r}_c${ci}`, p2, tx + mm(0.5), ty + mm(0.5), tCols[ci] - mm(1), mm(5));
          tx += tCols[ci];
        }
        ty += mm(6);
      }
    }

    label(p2, 'Rév. 13    Date : 2 juin 2022', L, PH - mm(4), { size: 7 });

    // ── OUTPUT ─────────────────────────────────────────────────────────────────
    form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True);
    const pdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
    let base64 = '';
    for (let i = 0; i < pdfBytes.length; i += 8192) base64 += String.fromCharCode(...pdfBytes.subarray(i, i + 8192));
    base64 = btoa(base64);

    return Response.json({ success: true, fileName: pdfFileName, pdf: `data:application/pdf;base64,${base64}` });

  } catch (error) {
    console.error('Erreur:', error);
    return Response.json({ error: error.message || 'Erreur' }, { status: 500 });
  }
});