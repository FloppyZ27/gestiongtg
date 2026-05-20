import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const formatDate = d => { if (!d) return '–'; try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA'); } catch { return d; } };
const formatMoney = v => (v != null && v !== '' && Number(v) > 0) ? `${Number(v).toFixed(2)} $` : '–';
const getArpenteurInitials = a => ({ "Samuel Guay":"SG","Dany Gaboury":"DG","Pierre-Luc Pilote":"PLP","Benjamin Larouche":"BL","Frédéric Gilbert":"FG" }[a] || 'XX');
const safe = t => (t || '–').toString();

// GTG brand colors
const PRIMARY    = rgb(0.72, 0.12, 0.08);   // rouge vif — en-têtes sections
const ACCENT     = rgb(0.78, 0.36, 0.10);   // orangé brûlé — en-têtes mandats
const DARK_HDR   = rgb(0.10, 0.03, 0.03);   // quasi-noir teinté rouge — header page
const LABEL_BG   = rgb(0.97, 0.91, 0.88);   // crème rosé — colonne labels
const WHITE      = rgb(1, 1, 1);
const BORDER     = rgb(0.82, 0.60, 0.52);   // bordure chaude
const TEXT_DARK  = rgb(0.08, 0.04, 0.04);
const TEXT_LABEL = rgb(0.50, 0.15, 0.06);
const STRIPE     = rgb(0.99, 0.95, 0.93);   // fond lignes paires
const GREEN      = rgb(0.12, 0.58, 0.32);
const RED_STS    = rgb(0.75, 0.14, 0.14);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dossierData, clientsData, notairesData, courtiersData } = await req.json();
    if (!dossierData) return Response.json({ error: 'Missing dossier data' }, { status: 400 });

    const arpInitials = getArpenteurInitials(dossierData.arpenteur_geometre);
    const dossierNum  = dossierData.numero_dossier || '';
    const fullNum     = dossierNum ? `${arpInitials}-${dossierNum}` : arpInitials;
    const pdfFileName = `FICHE_DOSSIER_${fullNum}.pdf`;

    // Logo
    let logoBytes = null;
    try {
      const r = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png');
      if (r.ok) logoBytes = new Uint8Array(await r.arrayBuffer());
    } catch(_) {}

    const pdfDoc  = await PDFDocument.create();
    const fontB   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontR   = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const PW = 612, PH = 792;
    const ML = 28, MR = 28;
    const CW = PW - ML - MR;   // content width 556
    const L  = ML, R = PW - MR;

    // label column width (for 2-col form rows)
    const LW = 130;
    const VW = CW - LW;
    // half-width form (2 fields per row)
    const HCW = CW / 2;
    const HLW = 90;
    const HVW = HCW - HLW;

    const pages = [];
    let pg = null, y = 0;
    const py = ty => PH - ty;

    const newPage = () => {
      pg = pdfDoc.addPage([PW, PH]);
      pages.push(pg);
      y = 28;
    };

    const space = n => { if (y + n > PH - 28) newPage(); };

    // Draw filled rectangle
    const fillRect = (x, ty, w, h, color) =>
      pg.drawRectangle({ x, y: py(ty + h), width: w, height: h, color });

    // Draw rectangle outline
    const borderRect = (x, ty, w, h, color = BORDER, lw = 0.5) =>
      pg.drawRectangle({ x, y: py(ty + h), width: w, height: h, borderColor: color, borderWidth: lw, color: WHITE });

    // Draw text (top-based y)
    const t = (text, x, ty, opts = {}) => {
      const font = opts.b ? fontB : fontR;
      const sz   = opts.sz || 8.5;
      const col  = opts.col || TEXT_DARK;
      let tx = x;
      if (opts.right)  tx = x - font.widthOfTextAtSize(text, sz);
      if (opts.center) tx = x - font.widthOfTextAtSize(text, sz) / 2;
      pg.drawText(text, { x: tx, y: py(ty) - sz * 0.15, font, size: sz, color: col });
    };

    const hline = (ty, x1 = L, x2 = R, col = BORDER) =>
      pg.drawLine({ start:{x:x1, y:py(ty)}, end:{x:x2, y:py(ty)}, thickness:0.4, color: col });

    const vline = (x, ty1, ty2, col = BORDER) =>
      pg.drawLine({ start:{x, y:py(ty1)}, end:{x, y:py(ty2)}, thickness:0.4, color: col });

    // ── Section header (rouge vif plein) ────────────────────────────────────────
    const sectionHead = (title) => {
      space(18);
      fillRect(L, y, CW, 17, PRIMARY);
      t(title, L + 8, y + 12, { b:true, sz:9.5, col:WHITE });
      y += 17;
    };

    // ── Mandat header (orangé) ───────────────────────────────────────────────────
    const mandatHead = (title, badge = '') => {
      space(18);
      fillRect(L, y, CW, 16, ACCENT);
      t(title, L + 8, y + 11.5, { b:true, sz:9, col:WHITE });
      if (badge) {
        const bw = fontB.widthOfTextAtSize(badge, 7.5) + 12;
        fillRect(R - bw - 4, y + 3, bw, 11, DARK_HDR);
        t(badge, R - bw/2 - 4, y + 10.5, { b:true, sz:7.5, col:rgb(0.95,0.65,0.40), center:true });
      }
      y += 16;
    };

    // ── Sub header (crème rosé + texte rouge) ───────────────────────────────────
    const subHead = (title) => {
      space(14);
      fillRect(L, y, CW, 13, LABEL_BG);
      pg.drawLine({ start:{x:L, y:py(y)}, end:{x:R, y:py(y)}, thickness:1, color:ACCENT });
      t(title, L + 8, y + 9.5, { b:true, sz:8, col:TEXT_LABEL });
      y += 13;
    };

    // ── Form row: 1 field (label | value) full width ─────────────────────────────
    const row1 = (label, value, stripe = false) => {
      space(14);
      if (stripe) fillRect(L, y, CW, 14, STRIPE);
      else        fillRect(L, y, CW, 14, WHITE);
      fillRect(L, y, LW, 14, LABEL_BG);
      t(safe(label), L + 5, y + 10, { b:true, sz:7.5, col:TEXT_LABEL });
      t(safe(value), L + LW + 5, y + 10, { sz:8, col:TEXT_DARK });
      // borders
      pg.drawRectangle({ x:L, y:py(y+14), width:CW, height:14, borderColor:BORDER, borderWidth:0.4 });
      vline(L + LW, y, y + 14);
      y += 14;
    };

    // ── Form row: 2 fields side by side ─────────────────────────────────────────
    const row2 = (l1, v1, l2, v2, stripe = false) => {
      space(14);
      if (stripe) fillRect(L, y, CW, 14, STRIPE);
      else        fillRect(L, y, CW, 14, WHITE);
      // left cell
      fillRect(L, y, HLW, 14, LABEL_BG);
      t(safe(l1), L + 5, y + 10, { b:true, sz:7.5, col:TEXT_LABEL });
      t(safe(v1), L + HLW + 5, y + 10, { sz:8, col:TEXT_DARK });
      // right cell
      fillRect(L + HCW, y, HLW, 14, LABEL_BG);
      t(safe(l2), L + HCW + 5, y + 10, { b:true, sz:7.5, col:TEXT_LABEL });
      t(safe(v2), L + HCW + HLW + 5, y + 10, { sz:8, col:TEXT_DARK });
      // borders
      pg.drawRectangle({ x:L, y:py(y+14), width:CW, height:14, borderColor:BORDER, borderWidth:0.4 });
      vline(L + HLW,  y, y + 14);
      vline(L + HCW,  y, y + 14);
      vline(L + HCW + HLW, y, y + 14);
      y += 14;
    };

    // ── Multi-line text row ──────────────────────────────────────────────────────
    const rowText = (label, text) => {
      if (!text) return;
      const maxW  = CW - LW - 10;
      const words = text.split(' ');
      const lines = [];
      let cur = '';
      for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (fontR.widthOfTextAtSize(test, 8) > maxW) { lines.push(cur); cur = w; }
        else cur = test;
      }
      if (cur) lines.push(cur);
      const rh = Math.max(14, lines.length * 12 + 4);
      space(rh);
      fillRect(L, y, CW, rh, WHITE);
      fillRect(L, y, LW, rh, LABEL_BG);
      t(safe(label), L + 5, y + 10, { b:true, sz:7.5, col:TEXT_LABEL });
      lines.forEach((l, i) => t(l, L + LW + 5, y + 10 + i * 12, { sz:8, col:TEXT_DARK }));
      pg.drawRectangle({ x:L, y:py(y+rh), width:CW, height:rh, borderColor:BORDER, borderWidth:0.4 });
      vline(L + LW, y, y + rh);
      y += rh;
    };

    // ════════════════════════════════════════════════════════════════════
    // PAGE 1 — EN-TÊTE
    // ════════════════════════════════════════════════════════════════════
    newPage();

    // Bande rouge + stripe orangée en bas
    fillRect(0, 0, PW, 62, DARK_HDR);
    fillRect(0, 62, PW, 4, PRIMARY);

    // Logo
    if (logoBytes) {
      try {
        const img = await pdfDoc.embedPng(logoBytes);
        pg.drawImage(img, { x: ML, y: py(54), width:36, height:42 });
      } catch(_) {}
    }

    // Titre
    t('FICHE DOSSIER', ML + 46, 26, { b:true, sz:20, col:WHITE });
    t('Girard Tremblay Gilbert Inc. — Arpenteurs-Géomètres', ML + 46, 46, { sz:8.5, col:rgb(0.82, 0.55, 0.42) });

    // Bloc numéro dossier (droite)
    fillRect(R - 148, 6, 146, 28, PRIMARY);
    t(fullNum, R - 75, 14, { b:true, sz:16, col:WHITE, center:true });
    t(dossierData.arpenteur_geometre || '', R - 75, 30, { sz:7.5, col:rgb(0.95,0.78,0.72), center:true });

    // Statut
    const isOpen = dossierData.statut !== 'Fermé';
    fillRect(R - 148, 38, 146, 16, isOpen ? GREEN : RED_STS);
    t((dossierData.statut || 'Ouvert').toUpperCase(), R - 75, 48, { b:true, sz:8.5, col:WHITE, center:true });

    // Place + TTL
    fillRect(R - 148, 56, 72, 12, ACCENT);
    t(dossierData.place_affaire || '–', R - 112, 64, { sz:7.5, col:WHITE, center:true });
    fillRect(R - 76, 56, 74, 12, dossierData.ttl === 'Oui' ? rgb(0.62,0.18,0.04) : ACCENT);
    t(dossierData.ttl === 'Oui' ? 'TTL' : 'Non-TTL', R - 39, 64, { b:true, sz:7.5, col:WHITE, center:true });

    y = 80;

    // ════════════════════════════════════════════════════════════════════
    // INFORMATIONS GÉNÉRALES
    // ════════════════════════════════════════════════════════════════════
    y += 6;
    sectionHead('INFORMATIONS GÉNÉRALES');
    row2('Arpenteur-géomètre', dossierData.arpenteur_geometre, 'Place d\'affaire', dossierData.place_affaire, false);
    row2('Statut', dossierData.statut || 'Ouvert', 'Dossier TTL', dossierData.ttl === 'Oui' ? 'Oui' : 'Non', true);
    row2('Date d\'ouverture', formatDate(dossierData.date_ouverture), 'Date de fermeture', formatDate(dossierData.date_fermeture), false);
    y += 8;

    // ════════════════════════════════════════════════════════════════════
    // CLIENTS
    // ════════════════════════════════════════════════════════════════════
    if (clientsData && clientsData.length > 0) {
      sectionHead(`CLIENTS (${clientsData.length})`);
      for (let ci = 0; ci < clientsData.length; ci++) {
        const c = clientsData[ci];
        if (!c) continue;
        if (ci > 0) { y += 4; subHead(`Client ${ci + 1}`); }
        const name  = `${c.prenom || ''} ${c.nom || ''}`.trim();
        const phone = c.telephones?.find(t => t.actuel)?.telephone || c.telephones?.[0]?.telephone || '–';
        const email = c.courriels?.find(x => x.actuel)?.courriel  || c.courriels?.[0]?.courriel  || '–';
        const adr   = c.adresses?.find(a => a.actuelle) || c.adresses?.[0];
        const addr  = adr ? [(adr.numeros_civiques||[]).filter(Boolean).join(', '), adr.rue, adr.ville, adr.code_postal].filter(Boolean).join(', ') : '–';
        const prefs = (c.preferences_livraison || []).join(', ') || '–';
        row2('Nom', name, 'Téléphone', phone, false);
        row2('Courriel', email, 'Livraison', prefs, true);
        rowText('Adresse', addr);
      }
      y += 8;
    }

    // ════════════════════════════════════════════════════════════════════
    // INTERVENANTS
    // ════════════════════════════════════════════════════════════════════
    const hasN = notairesData && notairesData.length > 0;
    const hasC = courtiersData && courtiersData.length > 0;
    if (hasN || hasC) {
      sectionHead('INTERVENANTS');
      const drawGroup = (list, label) => {
        if (!list?.length) return;
        subHead(label);
        for (let i = 0; i < list.length; i++) {
          const p = list[i]; if (!p) continue;
          const name  = `${p.prenom || ''} ${p.nom || ''}`.trim();
          const phone = p.telephones?.find(t => t.actuel)?.telephone || p.telephones?.[0]?.telephone || '–';
          const email = p.courriels?.find(x => x.actuel)?.courriel  || p.courriels?.[0]?.courriel  || '–';
          row2('Nom', name, 'Téléphone', phone, i % 2 === 0);
          row1('Courriel', email, i % 2 !== 0);
        }
      };
      drawGroup(notairesData,  'NOTAIRES');
      drawGroup(courtiersData, 'COURTIERS IMMOBILIERS');
      y += 8;
    }

    // ════════════════════════════════════════════════════════════════════
    // MANDATS
    // ════════════════════════════════════════════════════════════════════
    const mandats = dossierData.mandats || [];
    if (mandats.length > 0) {
      sectionHead(`MANDATS (${mandats.length})`);
      for (let mi = 0; mi < mandats.length; mi++) {
        const m = mandats[mi]; if (!m) continue;
        if (mi > 0) { y += 6; }

        mandatHead(`${mi + 1}. ${m.type_mandat || 'Mandat'}`, m.tache_actuelle || '');

        // Infos de base
        row2('Tâche actuelle',    m.tache_actuelle,    'Utilisateur assigné', m.utilisateur_assigne, false);
        row2('Date d\'ouverture', formatDate(m.date_ouverture), 'Date de livraison', formatDate(m.date_livraison), true);
        row2('Date de signature', formatDate(m.date_signature), 'Début des travaux', formatDate(m.date_debut_travaux), false);

        // Adresse des travaux
        const addr = m.adresse_travaux;
        const addrStr = m.adresse_travaux_texte || (addr ? [(addr.numeros_civiques||[]).filter(Boolean).join(', '), addr.rue, addr.ville, addr.code_postal].filter(Boolean).join(', ') : null);
        rowText('Adresse des travaux', addrStr);

        // Lots
        const lotsStr = m.lots_texte || (m.lots || []).join(', ') || null;
        row1('Lots', lotsStr || '–', true);

        // Tarification
        subHead('TARIFICATION');
        const total = (Number(m.prix_estime) || 0) - (Number(m.rabais) || 0);
        row2('Prix estimé', formatMoney(m.prix_estime), 'Rabais', formatMoney(m.rabais), false);
        row2('Total HT', total > 0 ? `${total.toFixed(2)} $` : '–', 'Taxes incluses', m.taxes_incluses ? 'Oui' : 'Non', true);
        row1('Prix convenu', m.prix_convenu ? 'Oui' : 'Non', false);

        // Minutes
        const minutes = m.minutes_list?.length ? m.minutes_list : (m.minute ? [{minute:m.minute, date_minute:m.date_minute, type_minute:m.type_minute}] : []);
        if (minutes.length > 0) {
          subHead('MINUTES');
          // Table header
          space(14);
          fillRect(L, y, CW, 13, LABEL_BG);
          pg.drawRectangle({ x:L, y:py(y+13), width:CW, height:13, borderColor:BORDER, borderWidth:0.4 });
          const colW = [CW * 0.40, CW * 0.32, CW * 0.28];
          let mx = L;
          for (const [h, cw] of [['N° Minute', colW[0]], ['Date', colW[1]], ['Type', colW[2]]]) {
            t(h, mx + 5, y + 9.5, { b:true, sz:7.5, col:TEXT_LABEL });
            vline(mx + cw, y, y + 13);
            mx += cw;
          }
          y += 13;
          for (let ki = 0; ki < minutes.length; ki++) {
            const min = minutes[ki];
            space(13);
            if (ki % 2 === 1) fillRect(L, y, CW, 13, STRIPE);
            pg.drawRectangle({ x:L, y:py(y+13), width:CW, height:13, borderColor:BORDER, borderWidth:0.4 });
            mx = L;
            for (const [val, cw] of [[safe(min.minute), colW[0]], [formatDate(min.date_minute), colW[1]], [safe(min.type_minute), colW[2]]]) {
              t(val, mx + 5, y + 9.5, { sz:8, col:TEXT_DARK });
              vline(mx + cw, y, y + 13);
              mx += cw;
            }
            y += 13;
          }
        }

        // Notes
        if (m.notes) {
          subHead('NOTES');
          rowText('', m.notes);
        }
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // PIED DE PAGE
    // ════════════════════════════════════════════════════════════════════
    for (let pi = 0; pi < pages.length; pi++) {
      pg = pages[pi];
      pg.drawRectangle({ x:0, y:0, width:PW, height:18, color:DARK_HDR });
      pg.drawRectangle({ x:0, y:18, width:PW, height:3, color:PRIMARY });
      pg.drawText(`Girard Tremblay Gilbert Inc. — ${pdfFileName}`, { x:ML, y:5, font:fontR, size:7, color:rgb(0.82,0.52,0.38) });
      const pgTxt = `Page ${pi+1} / ${pages.length}`;
      pg.drawText(pgTxt, { x: R - fontR.widthOfTextAtSize(pgTxt, 7), y:5, font:fontR, size:7, color:rgb(0.82,0.52,0.38) });
    }

    const pdfBytes = await pdfDoc.save();
    let b64 = '';
    for (let i = 0; i < pdfBytes.length; i += 8192) b64 += String.fromCharCode(...pdfBytes.subarray(i, i + 8192));
    b64 = btoa(b64);
    return Response.json({ success:true, fileName:pdfFileName, pdf:`data:application/pdf;base64,${b64}` });

  } catch (error) {
    console.error('Erreur generateFicheMandat:', error);
    return Response.json({ error: error.message || 'Erreur serveur' }, { status:500 });
  }
});