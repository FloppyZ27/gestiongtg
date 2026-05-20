import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const mm = v => v * 2.83464566929;
const formatDate = d => { if (!d) return '–'; try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA'); } catch { return d; } };
const formatMoney = v => (v != null && v !== '' && Number(v) > 0) ? `${Number(v).toFixed(2)} $` : '–';
const getArpenteurInitials = a => ({ "Samuel Guay":"SG","Dany Gaboury":"DG","Pierre-Luc Pilote":"PLP","Benjamin Larouche":"BL","Frédéric Gilbert":"FG" }[a] || 'XX');
const safeText = t => (t || '–').toString();

// Colors
const NAVY   = rgb(0.06, 0.12, 0.30);
const ACCENT = rgb(0.88, 0.35, 0.12);
const SECTION_BG = rgb(0.18, 0.24, 0.44);
const WHITE  = rgb(1, 1, 1);
const ROW_ALT = rgb(0.95, 0.96, 0.98);
const BORDER = rgb(0.78, 0.80, 0.88);
const TEXT_DARK  = rgb(0.08, 0.10, 0.15);
const TEXT_LABEL = rgb(0.28, 0.34, 0.52);
const SUB_BG = rgb(0.88, 0.90, 0.95);
const PRICE_BG = rgb(0.92, 0.93, 0.97);
const GREEN  = rgb(0.12, 0.58, 0.32);
const RED_C  = rgb(0.78, 0.16, 0.16);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dossierData, clientsData, notairesData, courtiersData } = await req.json();
    if (!dossierData) return Response.json({ error: 'Missing dossier data' }, { status: 400 });

    const arpInitials = getArpenteurInitials(dossierData.arpenteur_geometre);
    const dossierNum = dossierData.numero_dossier || '';
    const fullNum = dossierNum ? `${arpInitials}-${dossierNum}` : arpInitials;
    const pdfFileName = `FICHE_DOSSIER_${fullNum}.pdf`;

    // Fetch logo
    let logoBytes = null;
    try {
      const r = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png');
      if (r.ok) logoBytes = new Uint8Array(await r.arrayBuffer());
    } catch(_) {}

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle(pdfFileName);
    pdfDoc.setAuthor('Girard Tremblay Gilbert Inc.');

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PW = 612, PH = 792;
    const ML = 22, MR = 22;
    const W  = PW - ML - MR;
    const L  = ML, R = PW - MR;
    const HALF = W / 2;

    const pages = [];
    let currentPage = null;
    let y = 0;

    const py = topY => PH - topY;

    const newPage = () => {
      const page = pdfDoc.addPage([PW, PH]);
      pages.push(page);
      currentPage = page;
      y = 28;
      return page;
    };

    const ensureSpace = needed => {
      if (y + needed > PH - 30) newPage();
    };

    const rct = (x, topY, w, h, fill, borderCol = null, bw = 0.4) => {
      currentPage.drawRectangle({
        x, y: py(topY + h), width: w, height: h,
        color: fill,
        borderColor: borderCol || undefined,
        borderWidth: borderCol ? bw : 0,
      });
    };

    const txt = (text, x, topY, opts = {}) => {
      const font = opts.bold ? fontBold : fontReg;
      const size = opts.size || 8.5;
      const color = opts.color || TEXT_DARK;
      let tx = x;
      if (opts.align === 'right')  tx = x - font.widthOfTextAtSize(text, size);
      if (opts.align === 'center') tx = x - font.widthOfTextAtSize(text, size) / 2;
      currentPage.drawText(text, { x: tx, y: py(topY) - size * 0.2, font, size, color });
    };

    const hline = (topY, x1 = L, x2 = R) => {
      currentPage.drawLine({ start:{x:x1, y:py(topY)}, end:{x:x2, y:py(topY)}, thickness:0.3, color:BORDER });
    };

    const sectionHeader = (title) => {
      ensureSpace(22);
      rct(L, y, W, 20, SECTION_BG);
      txt(title, L + 10, y + 14, { bold:true, size:10, color:WHITE });
      y += 20;
    };

    const subHeader = (title) => {
      ensureSpace(16);
      rct(L, y, W, 14, SUB_BG);
      txt(title, L + 8, y + 10, { bold:true, size:8, color:SECTION_BG });
      y += 14;
    };

    const infoRow = (label, value, altRow = false, xOffset = 0, rowW = W, rowH = 16) => {
      if (altRow) rct(L + xOffset, y, rowW, rowH, ROW_ALT);
      txt(label, L + xOffset + 6, y + rowH - 4.5, { bold:true, size:7.5, color:TEXT_LABEL });
      txt(safeText(value), L + xOffset + 95, y + rowH - 4.5, { size:8, color:TEXT_DARK });
    };

    const wrapText = (text, maxW, size, font) => {
      const words = (text || '').split(' ');
      const lines = [];
      let line = '';
      for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (font.widthOfTextAtSize(test, size) > maxW) { if (line) lines.push(line); line = word; }
        else line = test;
      }
      if (line) lines.push(line);
      return lines;
    };

    // ═══════════════════════════════════════════════════════════════════
    // PAGE 1 — HEADER
    // ═══════════════════════════════════════════════════════════════════
    newPage();

    // Full-width dark header
    currentPage.drawRectangle({ x:0, y:py(70), width:PW, height:70, color:NAVY });

    // Accent top stripe
    currentPage.drawRectangle({ x:0, y:py(4), width:PW, height:4, color:ACCENT });

    // Logo
    if (logoBytes) {
      try {
        const img = await pdfDoc.embedPng(logoBytes);
        currentPage.drawImage(img, { x: ML, y: py(58), width:38, height:46 });
      } catch(_) {}
    }

    // Title block
    txt('FICHE DOSSIER', ML + 50, 30, { bold:true, size:22, color:WHITE });
    txt('Girard Tremblay Gilbert Inc. — Arpenteurs-Géomètres', ML + 50, 50, { size:9, color:rgb(0.68, 0.73, 0.90) });

    // Dossier number block (right)
    rct(R - 160, 8, 158, 30, ACCENT);
    txt(fullNum, R - 81, 18, { bold:true, size:17, color:WHITE, align:'center' });
    txt(dossierData.arpenteur_geometre || '', R - 81, 34, { size:8, color:WHITE, align:'center' });

    // Statut badge
    const isOpen = dossierData.statut !== 'Fermé';
    rct(R - 160, 42, 158, 18, isOpen ? GREEN : RED_C);
    txt((dossierData.statut || 'Ouvert').toUpperCase(), R - 81, 50, { bold:true, size:9, color:WHITE, align:'center' });

    // Place d'affaire + TTL row
    rct(R - 160, 62, 78, 14, rgb(0.10, 0.16, 0.38));
    txt(dossierData.place_affaire || '–', R - 122, 69, { size:8, color:WHITE, align:'center' });
    rct(R - 81, 62, 79, 14, dossierData.ttl === 'Oui' ? rgb(0.70, 0.35, 0.05) : rgb(0.10, 0.16, 0.38));
    txt(dossierData.ttl === 'Oui' ? 'TTL' : 'Non-TTL', R - 41, 69, { bold:true, size:8, color:WHITE, align:'center' });

    y = 84;

    // ═══════════════════════════════════════════════════════════════════
    // INFORMATIONS GÉNÉRALES
    // ═══════════════════════════════════════════════════════════════════
    sectionHeader('INFORMATIONS GÉNÉRALES');

    const genRows = [
      ['Arpenteur-géomètre', dossierData.arpenteur_geometre],
      ['Place d\'affaire', dossierData.place_affaire],
      ['Statut', dossierData.statut || 'Ouvert'],
      ['Dossier TTL', dossierData.ttl === 'Oui' ? 'Oui' : 'Non'],
      ['Date d\'ouverture', formatDate(dossierData.date_ouverture)],
      ['Date de fermeture', formatDate(dossierData.date_fermeture)],
    ];

    for (let i = 0; i < genRows.length; i += 2) {
      ensureSpace(16);
      const alt = (i / 2) % 2 === 1;
      if (alt) rct(L, y, W, 16, ROW_ALT);
      infoRow(genRows[i][0], genRows[i][1], false, 0, HALF, 16);
      if (genRows[i+1]) infoRow(genRows[i+1][0], genRows[i+1][1], false, HALF, HALF, 16);
      hline(y + 16);
      y += 16;
    }

    y += 10;

    // ═══════════════════════════════════════════════════════════════════
    // CLIENTS
    // ═══════════════════════════════════════════════════════════════════
    if (clientsData && clientsData.length > 0) {
      sectionHeader(`CLIENTS (${clientsData.length})`);

      for (let ci = 0; ci < clientsData.length; ci++) {
        const client = clientsData[ci];
        if (!client) continue;
        if (ci > 0) { ensureSpace(8); y += 6; }

        const clientName  = `${client.prenom || ''} ${client.nom || ''}`.trim();
        const clientPhone = client.telephones?.find(t => t.actuel)?.telephone || client.telephones?.[0]?.telephone || '–';
        const clientEmail = client.courriels?.find(c => c.actuel)?.courriel || client.courriels?.[0]?.courriel || '–';
        const adr = client.adresses?.find(a => a.actuelle) || client.adresses?.[0];
        const clientAddr = adr ? [(adr.numeros_civiques||[]).filter(Boolean).join(', '), adr.rue, adr.ville, adr.code_postal].filter(Boolean).join(', ') : '–';
        const clientPrefs = (client.preferences_livraison || []).join(', ') || '–';

        const cRows = [
          ['Nom', clientName],
          ['Téléphone', clientPhone],
          ['Courriel', clientEmail],
          ['Adresse', clientAddr],
          ['Préférences livraison', clientPrefs],
        ];

        for (let ri = 0; ri < cRows.length; ri++) {
          ensureSpace(15);
          const alt = ri % 2 === 1;
          if (alt) rct(L, y, W, 15, ROW_ALT);
          infoRow(cRows[ri][0], cRows[ri][1], false, 0, W, 15);
          hline(y + 15);
          y += 15;
        }
      }
      y += 10;
    }

    // ═══════════════════════════════════════════════════════════════════
    // INTERVENANTS
    // ═══════════════════════════════════════════════════════════════════
    const hasN = notairesData && notairesData.length > 0;
    const hasC = courtiersData && courtiersData.length > 0;
    if (hasN || hasC) {
      sectionHeader('INTERVENANTS');

      const drawIntervenants = (list, label) => {
        if (!list || list.length === 0) return;
        subHeader(label);
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          if (!p) continue;
          if (i > 0) { y += 4; }
          const pName  = `${p.prenom || ''} ${p.nom || ''}`.trim();
          const pPhone = p.telephones?.find(t => t.actuel)?.telephone || p.telephones?.[0]?.telephone || '–';
          const pEmail = p.courriels?.find(c => c.actuel)?.courriel || p.courriels?.[0]?.courriel || '–';
          const iRows  = [['Nom', pName], ['Téléphone', pPhone], ['Courriel', pEmail]];
          for (let ri = 0; ri < iRows.length; ri++) {
            ensureSpace(15);
            if (ri % 2 === 1) rct(L, y, W, 15, ROW_ALT);
            infoRow(iRows[ri][0], iRows[ri][1], false, 0, W, 15);
            hline(y + 15);
            y += 15;
          }
        }
      };

      drawIntervenants(notairesData, 'NOTAIRES');
      drawIntervenants(courtiersData, 'COURTIERS IMMOBILIERS');
      y += 10;
    }

    // ═══════════════════════════════════════════════════════════════════
    // MANDATS
    // ═══════════════════════════════════════════════════════════════════
    const mandats = dossierData.mandats || [];
    if (mandats.length > 0) {
      sectionHeader(`MANDATS (${mandats.length})`);

      for (let mi = 0; mi < mandats.length; mi++) {
        const m = mandats[mi];
        if (!m) continue;

        // Mandat accent header
        ensureSpace(22);
        rct(L, y, W, 20, ACCENT);
        txt(`${mi + 1}. ${m.type_mandat || 'Mandat'}`, L + 10, y + 14, { bold:true, size:10.5, color:WHITE });
        if (m.tache_actuelle) {
          const bw = fontBold.widthOfTextAtSize(m.tache_actuelle, 8) + 14;
          rct(R - bw - 6, y + 5, bw, 12, NAVY);
          txt(m.tache_actuelle, R - bw/2 - 6, y + 13, { bold:true, size:8, color:WHITE, align:'center' });
        }
        y += 20;

        // Infos de base – 2 colonnes
        const mBaseRows = [
          ['Tâche actuelle', m.tache_actuelle],
          ['Utilisateur assigné', m.utilisateur_assigne],
          ['Date d\'ouverture', formatDate(m.date_ouverture)],
          ['Date de livraison', formatDate(m.date_livraison)],
          ['Date de signature', formatDate(m.date_signature)],
          ['Début des travaux', formatDate(m.date_debut_travaux)],
        ];
        for (let ri = 0; ri < mBaseRows.length; ri += 2) {
          ensureSpace(15);
          if ((ri / 2) % 2 === 0) rct(L, y, W, 15, ROW_ALT);
          infoRow(mBaseRows[ri][0], mBaseRows[ri][1], false, 0, HALF, 15);
          if (mBaseRows[ri+1]) infoRow(mBaseRows[ri+1][0], mBaseRows[ri+1][1], false, HALF, HALF, 15);
          hline(y + 15);
          y += 15;
        }

        // Adresse des travaux
        const addr = m.adresse_travaux;
        const addrStr = m.adresse_travaux_texte || (addr ? [(addr.numeros_civiques||[]).filter(Boolean).join(', '), addr.rue, addr.ville, addr.code_postal].filter(Boolean).join(', ') : '–');
        ensureSpace(15);
        infoRow('Adresse des travaux', addrStr, false, 0, W, 15);
        hline(y + 15);
        y += 15;

        // Lots
        const lotsStr = m.lots_texte || (m.lots || []).join(', ') || '–';
        ensureSpace(15);
        rct(L, y, W, 15, ROW_ALT);
        infoRow('Lots', lotsStr, false, 0, W, 15);
        hline(y + 15);
        y += 15;

        // ── TARIFICATION ──────────────────────────────────────────────
        ensureSpace(16);
        rct(L, y, W, 14, PRICE_BG);
        txt('TARIFICATION', L + 8, y + 10, { bold:true, size:8, color:SECTION_BG });
        y += 14;

        const total = (Number(m.prix_estime) || 0) - (Number(m.rabais) || 0);
        const pRows = [
          ['Prix estimé', formatMoney(m.prix_estime), 'Rabais', formatMoney(m.rabais)],
          ['Total HT', total > 0 ? `${total.toFixed(2)} $` : '–', 'Taxes incluses', m.taxes_incluses ? 'Oui' : 'Non'],
          ['Prix convenu', m.prix_convenu ? 'Oui' : 'Non', '', ''],
        ];
        for (let pi = 0; pi < pRows.length; pi++) {
          ensureSpace(15);
          if (pi % 2 === 0) rct(L, y, W, 15, ROW_ALT);
          infoRow(pRows[pi][0], pRows[pi][1], false, 0, HALF, 15);
          if (pRows[pi][2]) infoRow(pRows[pi][2], pRows[pi][3], false, HALF, HALF, 15);
          hline(y + 15);
          y += 15;
        }

        // ── MINUTES ───────────────────────────────────────────────────
        const minutes = m.minutes_list?.length ? m.minutes_list : (m.minute ? [{ minute: m.minute, date_minute: m.date_minute, type_minute: m.type_minute }] : []);
        if (minutes.length > 0) {
          ensureSpace(18);
          rct(L, y, W, 14, PRICE_BG);
          txt('MINUTES', L + 8, y + 10, { bold:true, size:8, color:SECTION_BG });
          y += 14;

          // Column headers
          ensureSpace(14);
          const mCW = [W * 0.40, W * 0.30, W * 0.30];
          rct(L, y, W, 13, SUB_BG);
          let mx = L;
          for (const [h, cw] of [['N° Minute', mCW[0]], ['Date', mCW[1]], ['Type', mCW[2]]]) {
            txt(h, mx + 5, y + 9.5, { bold:true, size:7.5, color:SECTION_BG });
            mx += cw;
          }
          y += 13;

          for (let ki = 0; ki < minutes.length; ki++) {
            const min = minutes[ki];
            ensureSpace(14);
            if (ki % 2 === 1) rct(L, y, W, 14, ROW_ALT);
            mx = L;
            for (const [val, cw] of [[min.minute||'–', mCW[0]], [formatDate(min.date_minute), mCW[1]], [min.type_minute||'–', mCW[2]]]) {
              txt(safeText(val), mx + 5, y + 10, { size:8, color:TEXT_DARK });
              mx += cw;
            }
            hline(y + 14);
            y += 14;
          }
        }

        // ── NOTES DU MANDAT ───────────────────────────────────────────
        if (m.notes) {
          ensureSpace(18);
          rct(L, y, W, 14, PRICE_BG);
          txt('NOTES', L + 8, y + 10, { bold:true, size:8, color:SECTION_BG });
          y += 14;

          const noteLines = wrapText(m.notes, W - 20, 8, fontReg);
          for (const nl of noteLines) {
            ensureSpace(13);
            txt(nl, L + 8, y + 10, { size:8, color:TEXT_DARK });
            y += 13;
          }
        }

        y += 10;
        if (mi < mandats.length - 1) {
          ensureSpace(4);
          currentPage.drawLine({ start:{x:L, y:py(y)}, end:{x:R, y:py(y)}, thickness:1, color:ACCENT });
          y += 10;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // FOOTER on all pages
    // ═══════════════════════════════════════════════════════════════════
    for (let pi = 0; pi < pages.length; pi++) {
      const pg = pages[pi];
      pg.drawRectangle({ x:0, y:0, width:PW, height:20, color:NAVY });
      pg.drawText(`Girard Tremblay Gilbert Inc. — ${pdfFileName}`, { x:ML, y:6, font:fontReg, size:7, color:rgb(0.65,0.70,0.88) });
      const pgTxt = `Page ${pi+1} / ${pages.length}`;
      pg.drawText(pgTxt, { x: R - fontReg.widthOfTextAtSize(pgTxt, 7), y:6, font:fontReg, size:7, color:rgb(0.65,0.70,0.88) });
      // Accent bottom stripe
      pg.drawRectangle({ x:0, y:20, width:PW, height:3, color:ACCENT });
    }

    const pdfBytes = await pdfDoc.save();
    let base64 = '';
    for (let i = 0; i < pdfBytes.length; i += 8192) base64 += String.fromCharCode(...pdfBytes.subarray(i, i + 8192));
    base64 = btoa(base64);

    return Response.json({ success:true, fileName:pdfFileName, pdf:`data:application/pdf;base64,${base64}` });

  } catch (error) {
    console.error('Erreur generateFicheMandat:', error);
    return Response.json({ error: error.message || 'Erreur serveur' }, { status:500 });
  }
});