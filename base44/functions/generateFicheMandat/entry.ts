import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fd = d => { if (!d) return ''; try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA'); } catch { return d || ''; } };
const fm = v => (v != null && v !== '' && Number(v) > 0) ? `${Number(v).toFixed(2)} $` : '';
const safe = t => (t || '').toString();
const arpInit = a => ({ "Samuel Guay":"SG","Dany Gaboury":"DG","Pierre-Luc Pilote":"PLP","Benjamin Larouche":"BL","Frédéric Gilbert":"FG" }[a] || 'XX');
const mandatAbbr = t => ({ "Certificat de localisation":"CL","Description Technique":"DT","Piquetage":"PIQ","Projet de lotissement":"LOTIS","Implantation":"IMP","OCTR":"OCTR","Levé topographique":"LEVÉ","Bornage":"BORN","Bornage":"BORN" }[t] || t);

// ─── Brand colors ─────────────────────────────────────────────────────────
const C = {
  header:  rgb(0.97, 0.93, 0.90),   // crème pâle — en-tête
  red:     rgb(0.72, 0.12, 0.08),   // rouge GTG — en-têtes sections
  orange:  rgb(0.78, 0.36, 0.10),   // orangé — sous-titres
  lblBg:   rgb(0.97, 0.91, 0.88),   // crème rosé — fond labels
  altBg:   rgb(0.99, 0.95, 0.93),   // fond lignes paires
  border:  rgb(0.75, 0.50, 0.40),   // bordure chaude
  dark:    rgb(0.08, 0.04, 0.04),   // texte principal
  lbl:     rgb(0.08, 0.04, 0.04),   // texte label (noir)
  white:   rgb(1, 1, 1),
  green:   rgb(0.12, 0.58, 0.32),
  redSts:  rgb(0.75, 0.14, 0.14),
  chkBg:   rgb(0.92, 0.82, 0.77),   // fond checkbox inactif
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { dossierData, clientsData, notairesData, courtiersData, entreesTempsData } = await req.json();
    if (!dossierData) return Response.json({ error: 'Missing dossier data' }, { status: 400 });

    // Fetch users + employees to build email → "Prénom Nom" map
    let employeMap = {};
    try {
      const users = await base44.asServiceRole.entities.User.list();
      for (const u of (users || [])) {
        if (u.email) employeMap[u.email] = u.full_name || u.email;
      }
    } catch(_) {}
    try {
      const employes = await base44.asServiceRole.entities.Employe.list();
      for (const emp of (employes || [])) {
        const nom = `${emp.prenom||''} ${emp.nom||''}`.trim();
        if (nom && emp.compte_utilisateur) employeMap[emp.compte_utilisateur] = nom;
        if (nom && emp.courriel) employeMap[emp.courriel] = nom;
      }
    } catch(_) {}

    const arpIni  = arpInit(dossierData.arpenteur_geometre);
    const dNum    = dossierData.numero_dossier || '';
    const fullNum = dNum ? `${arpIni}-${dNum}` : arpIni;
    const pdfFileName = `FICHE_MANDAT_${fullNum}.pdf`;

    // Logo
    let logoBytes = null;
    try {
      const r = await fetch('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png');
      if (r.ok) logoBytes = new Uint8Array(await r.arrayBuffer());
    } catch(_) {}

    const doc  = await PDFDocument.create();
    const fB   = await doc.embedFont(StandardFonts.HelveticaBold);
    const fR   = await doc.embedFont(StandardFonts.Helvetica);

    // ─── Page dimensions ──────────────────────────────────────────────
    const PW = 612, PH = 792;
    const ML = 24, MR = 24;
    const CW = PW - ML - MR;   // 564

    // ─── Draw helpers per-page ────────────────────────────────────────
    const makeDrawers = (pg) => {
      const py = ty => PH - ty;
      const fill = (x, ty, w, h, col) =>
        pg.drawRectangle({ x, y: py(ty + h), width: w, height: h, color: col });
      const box = (x, ty, w, h, col = C.border, lw = 0.5) =>
        pg.drawRectangle({ x, y: py(ty + h), width: w, height: h, borderColor: col, borderWidth: lw });
      const line = (x1, ty, x2, col = C.border) =>
        pg.drawLine({ start:{x:x1, y:py(ty)}, end:{x:x2, y:py(ty)}, thickness:0.4, color:col });
      const vline = (x, ty1, ty2, col = C.border) =>
        pg.drawLine({ start:{x, y:py(ty1)}, end:{x, y:py(ty2)}, thickness:0.4, color:col });
      const txt = (text, x, ty, opts = {}) => {
        const font = opts.b ? fB : fR;
        const sz   = opts.sz || 8;
        const col  = opts.col || C.dark;
        let tx = x;
        if (opts.ctr) tx = x - font.widthOfTextAtSize(text, sz) / 2;
        if (opts.rgt) tx = x - font.widthOfTextAtSize(text, sz);
        pg.drawText(text, { x:tx, y:py(ty) - sz * 0.15, font, size:sz, color:col });
      };

      // Section header (full width, filled red)
      const sHdr = (title, ty, h = 17) => {
        fill(ML, ty, CW, h, C.red);
        txt(title, ML + CW/2, ty + h/2 + 1, { b:true, sz:9, col:C.white, ctr:true });
        return h;
      };

      // Sub-header (half-width, filled orange)
      const subHdr = (title, x, ty, w, h = 11) => {
        fill(x, ty, w, h, C.orange);
        txt(title, x + w/2, ty + h - 2, { b:true, sz:8, col:C.white, ctr:true });
      };

      // Checkbox (small square, optionally filled/checked)
      const chk = (x, ty, checked = false, sz = 7) => {
        fill(x, ty, sz, sz, checked ? C.orange : C.chkBg);
        pg.drawRectangle({ x, y:py(ty + sz), width:sz, height:sz, borderColor:C.border, borderWidth:0.6 });
        if (checked) { fill(x+1.5, ty+1.5, sz-3, sz-3, C.white); }
      };

      // Label | Value cell (full row height)
      const lv = (label, value, x, ty, lw, vw, h = 12, alt = false) => {
        fill(x, ty, lw, h, C.lblBg);
        if (alt) fill(x + lw, ty, vw, h, C.altBg);
        pg.drawRectangle({ x, y:py(ty + h), width:lw + vw, height:h, borderColor:C.border, borderWidth:0.4 });
        vline(x + lw, ty, ty + h);
        txt(safe(label), x + 3, ty + h - 3.5, { b:true, sz:7, col:C.lbl });
        txt(safe(value), x + lw + 3, ty + h - 3.5, { sz:7.5, col:C.dark });
      };

      return { py, fill, box, line, vline, txt, sHdr, subHdr, chk, lv };
    };

    // ══════════════════════════════════════════════════════════════════
    // PAGE 1 — FICHE MANDAT
    // ══════════════════════════════════════════════════════════════════
    const p1 = doc.addPage([PW, PH]);
    const d  = makeDrawers(p1);

    let y = 18;

    // ─── Header ───────────────────────────────────────────────────────
    d.fill(0, y + 44, PW, 3, C.red);

    // Logo
    if (logoBytes) {
      try {
        const img = await doc.embedPng(logoBytes);
        p1.drawImage(img, { x:ML, y:PH - (y + 42), width:32, height:36 });
      } catch(_) {}
    }
    d.txt('Girard Tremblay Gilbert Inc.', ML + 40, y + 12, { sz:10, col:C.dark });
    d.txt('Arpenteurs-Géomètres', ML + 40, y + 24, { sz:7.5, col:C.dark });
    d.txt('FICHE MANDAT', ML + CW, y + 22, { b:true, sz:20, col:C.dark, rgt:true });
    d.txt(fullNum, ML + CW, y + 38, { b:true, sz:11, col:C.dark, rgt:true });
    y += 50;

    // ─── Infos principales (date, livraison, type arpentage) ──────────
    const firstMandat = dossierData.mandats?.[0] || {};

    // Ligne 1: Date mandat | Numéro dossier
    d.box(ML, y, CW, 16);
    d.vline(ML + CW * 0.5, y, y + 16);
    d.txt('Date du mandat :', ML + 3, y + 12, { b:true, sz:8.5, col:C.lbl });
    d.txt(fd(dossierData.date_ouverture), ML + 82, y + 12, { sz:8.5 });
    d.txt('Numéro de dossier :', ML + CW * 0.5 + 3, y + 12, { b:true, sz:8.5, col:C.lbl });
    d.txt(fullNum, ML + CW * 0.5 + 88, y + 12, { b:true, sz:9, col:C.dark });
    y += 16;

    // Ligne 2: Date de livraison | Statut
    d.box(ML, y, CW, 16);
    d.vline(ML + CW * 0.5, y, y + 16);
    d.txt('Date de livraison :', ML + 3, y + 12, { b:true, sz:8.5, col:C.lbl });
    d.txt(fd(firstMandat.date_livraison), ML + 82, y + 12, { sz:8.5 });
    d.txt('Statut :', ML + CW * 0.5 + 3, y + 12, { b:true, sz:8.5, col:C.lbl });
    const isOpen = dossierData.statut !== 'Fermé';
    d.fill(ML + CW * 0.5 + 48, y + 3, 58, 10, isOpen ? C.green : C.redSts);
    d.txt((dossierData.statut || 'Ouvert').toUpperCase(), ML + CW * 0.5 + 77, y + 12, { b:true, sz:8, col:C.white, ctr:true });
    y += 16;

    // Ligne 3: Type d'arpentage (texte)
    d.box(ML, y, CW, 16);
    d.txt("Type d'arpentage :", ML + 3, y + 12, { b:true, sz:8.5, col:C.lbl });
    const mandatTypesText = (dossierData.mandats || []).map(m => m.type_mandat).filter(Boolean).join('  |  ');
    d.txt(mandatTypesText, ML + 88, y + 12, { b:true, sz:9, col:C.dark });
    y += 16;

    // ─── LAYOUT : Gauche 50% = Clients + Localisation | Droite 50% = Carte ───
    const LH  = CW / 2;   // largeur demi-colonne (282)
    const LWH = 68;        // largeur label dans demi-colonne
    const RH  = 17;        // hauteur ligne (plus spacieux)

    // ── Données adresse ──
    const adr = firstMandat.adresse_travaux;
    const addrRue  = firstMandat.adresse_travaux_texte || (adr ? [(adr.numeros_civiques||[]).filter(Boolean).join(' '), adr.rue].filter(Boolean).join(' ') : '');
    const addrVil  = adr?.ville || '';
    const addrCP   = adr?.code_postal || '';
    const lotsStr  = firstMandat.lots_texte || (firstMandat.lots||[]).join(', ') || '';

    // ── Calculer leftHeight AVANT de fetcher la carte ──
    const client1 = clientsData?.[0];
    const c1Name  = client1 ? `${client1.prenom || ''} ${client1.nom || ''}`.trim() : '';
    const c1Tel   = client1?.telephones?.[0]?.telephone || '';
    const c1Email = client1?.courriels?.[0]?.courriel  || '';
    const c1Adr   = client1?.adresses?.[0];
    const c1Rue   = c1Adr ? [(c1Adr.numeros_civiques||[]).filter(Boolean).join(' '), c1Adr.rue].filter(Boolean).join(' ') : '';
    const c1Ville = c1Adr?.ville || '';
    const c1CP    = c1Adr?.code_postal || '';
    const extraClients = Math.max(0, (clientsData||[]).length - 1);
    // 2 en-têtes (17px chacun) + 7 lignes client (avec type) + extraClients + 4 lignes loc
    const leftHeight = 17 + (7 + extraClients) * RH + 17 + 4 * RH;

    // ── Fetch carte avec le bon ratio ──
    let mapImageBytes = null;
    try {
      const mapAddr = [addrRue, addrVil, 'QC, Canada'].filter(Boolean).join(', ');
      const mapApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
      if (mapApiKey && mapAddr.length > 5) {
        const mapH640 = Math.round(640 * leftHeight / LH);
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapAddr)}&zoom=14&size=640x${mapH640}&format=jpg&maptype=roadmap&markers=color:red|${encodeURIComponent(mapAddr)}&key=${mapApiKey}`;
        const mr = await fetch(mapUrl);
        if (mr.ok) mapImageBytes = new Uint8Array(await mr.arrayBuffer());
      }
    } catch(_) {}

    const yStart = y + 2;
    y = yStart;

    // ── Sous-helper pour en-tête de section demi-largeur ──
    const halfHdr = (title, ty) => {
      d.fill(ML, ty, LH, 17, C.red);
      d.txt(title, ML + LH/2, ty + 17/2 + 1, { b:true, sz:9, col:C.white, ctr:true });
    };
    const halfRow = (lbl, val, ty) => {
      d.box(ML, ty, LH, RH);
      d.vline(ML+LWH, ty, ty+RH);
      d.txt(safe(lbl), ML+3, ty+RH-5, { b:true, sz:7.5, col:C.lbl });
      d.txt(safe(val), ML+LWH+3, ty+RH-5, { sz:8 });
    };

    // ── CLIENT(S) ──
    halfHdr('CLIENT(S)', y);
    y += 15;
    const c1TelType = client1?.telephones?.[0]?.type_telephone || '';
    // Ordre: Nom, Téléphone, Type téléphone, Courriel, Adresse, Municipalité, Code postal
    [['Nom(s) :', c1Name], ['Téléphone :', c1Tel], ['Type :', c1TelType], ['Courriel :', c1Email], ['Adresse :', c1Rue], ['Municipalité :', c1Ville], ['Code postal :', c1CP]]
      .forEach(([lbl, val]) => { halfRow(lbl, val, y); y += RH; });
    for (let ci=1; ci<(clientsData||[]).length; ci++) {
      const cx = clientsData[ci];
      const nm = `${cx.prenom||''} ${cx.nom||''}`.trim();
      halfRow(`Client ${ci+1} :`, nm, y);
      y += RH;
    }

    // ── LOCALISATION DES TRAVAUX ──
    halfHdr('LOCALISATION DES TRAVAUX', y);
    y += 15;
    [['Adresse :', addrRue], ['Municipalité :', addrVil], ['Code postal :', addrCP], ['Lots :', lotsStr]]
      .forEach(([lbl, val]) => { halfRow(lbl, val, y); y += RH; });

    // ── CARTE (droite 50%) avec ratio correct ──
    const actualLeftHeight = y - yStart;
    if (mapImageBytes) {
      try {
        const mapImg = await doc.embedJpg(mapImageBytes);
        p1.drawImage(mapImg, { x: ML+LH, y: PH-(yStart+actualLeftHeight), width: LH, height: actualLeftHeight });
        d.box(ML+LH, yStart, LH, actualLeftHeight);
      } catch(_) {}
    } else {
      d.fill(ML+LH, yStart, LH, actualLeftHeight, rgb(0.95, 0.95, 0.95));
      d.box(ML+LH, yStart, LH, actualLeftHeight);
      d.txt('Carte non disponible', ML+LH+LH/2, yStart+actualLeftHeight/2, { sz:8, col:rgb(0.5,0.5,0.5), ctr:true });
    }

    // ─── SECTION: INTERVENANTS ────────────────────────────────────────
    y += 2;
    y += d.sHdr('INTERVENANTS', y);
    const drawPerson = (label, person, ty, alt) => {
      const nm  = person ? `${person.prenom||''} ${person.nom||''}`.trim() : '';
      const tel = person?.telephones?.[0]?.telephone || '';
      const em  = person?.courriels?.[0]?.courriel  || '';
      const LW3 = 55, PW2 = CW/3;
      d.box(ML, ty, CW, 15);
      d.vline(ML+LW3, ty, ty+15);
      d.vline(ML+PW2, ty, ty+15);
      d.vline(ML+PW2*2, ty, ty+15);
      d.txt(label, ML+3, ty+11, { b:true, sz:8, col:C.lbl });
      d.txt(nm, ML+LW3+3, ty+11, { sz:8.5 });
      d.txt(tel, ML+PW2+3, ty+11, { sz:8.5 });
      d.txt(em, ML+PW2*2+3, ty+11, { sz:8.5 });
    };
    // Header row
    d.box(ML, y, CW, 13);
    d.vline(ML+55, y, y+13);
    d.vline(ML+CW/3, y, y+13);
    d.vline(ML+CW/3*2, y, y+13);
    d.txt('Intervenant', ML+3, y+10, { b:true, sz:8, col:C.lbl });
    d.txt('Nom', ML+60, y+10, { b:true, sz:8, col:C.lbl });
    d.txt('Téléphone', ML+CW/3+3, y+10, { b:true, sz:8, col:C.lbl });
    d.txt('Courriel', ML+CW/3*2+3, y+10, { b:true, sz:8, col:C.lbl });
    y += 13;
    for (let i=0; i<Math.max(1,(notairesData||[]).length); i++) {
      drawPerson(`Notaire${i>0?' '+(i+1):''}`, notairesData?.[i], y, i%2===0);
      y += 15;
    }
    for (let i=0; i<Math.max(1,(courtiersData||[]).length); i++) {
      drawPerson(`Courtier${i>0?' '+(i+1):''}`, courtiersData?.[i], y, i%2===0);
      y += 15;
    }

    // ─── SECTION: LIVRAISON ───────────────────────────────────────────
    y += 2;
    y += d.sHdr('LIVRAISON', y);

    // Date de signature
    d.box(ML, y, CW, 15);
    d.txt('Date de signature :', ML+3, y+11, { b:true, sz:8.5, col:C.lbl });
    d.txt(fd(firstMandat.date_signature), ML+78, y+11, { sz:8.5 });
    d.txt('Début des travaux :', ML+CW/2+3, y+11, { b:true, sz:8.5, col:C.lbl });
    d.txt(fd(firstMandat.date_debut_travaux), ML+CW/2+80, y+11, { sz:8.5 });
    d.vline(ML+CW/2, y, y+15);
    y += 15;

    // Livraison preferences per client
    const livCols = [CW*0.33, CW*0.33, CW*0.34];
    const colX = [ML, ML+livCols[0], ML+livCols[0]+livCols[1]];
    // Header row for livraison
    d.box(ML, y, CW, 13);
    ['Destinataire','Préférences de livraison','Mode de facturation'].forEach((h,i) => {
      d.txt(h, colX[i]+3, y+10, { b:true, sz:8, col:C.lbl });
      if (i>0) d.vline(colX[i], y, y+13);
    });
    y += 13;
    const allPersons = [
      ...(clientsData||[]).map((c,i)=>({ label:i===0?'Client':`Client ${i+1}`, person:c })),
      ...(notairesData||[]).map((n,i)=>({ label:i===0?'Notaire':`Notaire ${i+1}`, person:n })),
      ...(courtiersData||[]).map((c,i)=>({ label:i===0?'Courtier':`Courtier ${i+1}`, person:c })),
    ];
    for (let i=0; i<allPersons.length; i++) {
      const { label, person } = allPersons[i];
      const prefs = (person?.preferences_livraison||[]).join(', ');
      d.box(ML, y, CW, 15);
      colX.forEach((x,ci) => { if(ci>0) d.vline(x, y, y+15); });
      d.txt(label, colX[0]+3, y+11, { b:true, sz:8, col:C.lbl });
      d.txt(prefs, colX[1]+3, y+11, { sz:8 });
      y += 15;
    }

    // ─── SECTION: PRIX ────────────────────────────────────────────────
    y += 2;
    y += d.sHdr('PRIX', y);

    const mandats = dossierData.mandats || [];
    // Table header: Opération, Prix estimé, Rabais, Prix convenu, Total HT, Taxes
    const pCols = [CW*0.28, CW*0.14, CW*0.12, CW*0.14, CW*0.14, CW*0.18];
    const pX    = [ML, ML+pCols[0], ML+pCols[0]+pCols[1], ML+pCols[0]+pCols[1]+pCols[2], ML+pCols[0]+pCols[1]+pCols[2]+pCols[3], ML+pCols[0]+pCols[1]+pCols[2]+pCols[3]+pCols[4]];
    d.box(ML, y, CW, 13);
    ['Opération','Prix estimé','Rabais','Prix convenu','Total HT','Taxes'].forEach((h,i) => {
      d.txt(h, pX[i]+3, y+10, { b:true, sz:8, col:C.lbl });
      if(i>0) d.vline(pX[i], y, y+13);
    });
    y += 13;
    let grandTotal = 0;
    for (let i=0; i<mandats.length; i++) {
      const m = mandats[i];
      const prix  = Number(m.prix_estime)||0;
      const rab   = Number(m.rabais)||0;
      const total = prix - rab;
      grandTotal += total;
      const prixConvenu = m.prix_convenu ? 'Oui' : 'Non';
      d.box(ML, y, CW, 15);
      pX.forEach((x,ci) => { if(ci>0) d.vline(x, y, y+15); });
      d.txt(m.type_mandat||`Mandat ${i+1}`, pX[0]+3, y+11, { b:true, sz:8, col:C.lbl });
      d.txt(fm(prix),  pX[1]+3, y+11, { sz:8.5 });
      d.txt(fm(rab),   pX[2]+3, y+11, { sz:8.5 });
      d.txt(prixConvenu, pX[3]+3, y+11, { sz:8 });
      d.txt(fm(total), pX[4]+3, y+11, { sz:8.5 });
      d.txt(m.taxes_incluses?'Incl.':'Non-Incl.', pX[5]+3, y+11, { sz:8 });
      y += 15;
      // Notes du mandat (toujours visible) — field: commentaire_tarification
      const mNotes = String(m.commentaire_tarification || m.notes || '').trim();
      const noteLines = mNotes.length > 0 ? (mNotes.match(/.{1,90}/g) || [mNotes]) : [];
      const notesRowH = Math.max(1, noteLines.length) * 16 + 4;
      d.box(ML, y, CW, notesRowH);
      const LWN = 50;
      d.vline(ML + LWN, y, y + notesRowH);
      d.txt('Notes :', ML + 3, y + 14, { b:true, sz:8, col:C.dark });
      noteLines.forEach((l, ni) => {
        d.txt(l, ML + LWN + 5, y + 14 + ni * 16, { sz:8, col:C.dark });
      });
      y += notesRowH;
    }
    // Total row
    d.box(ML, y, CW, 16);
    pX.forEach((x,ci) => { if(ci>0) d.vline(x, y, y+16); });
    d.txt('TOTAL', pX[0]+3, y+12, { b:true, sz:9, col:C.dark });
    d.txt(fm(grandTotal), pX[4]+3, y+12, { b:true, sz:10, col:C.dark });
    y += 16;

    // ─── SECTION: MINUTES ─────────────────────────────────────────────
    const allMinutes = mandats.flatMap(m => {
      const list = m.minutes_list?.length ? m.minutes_list : (m.minute ? [{minute:m.minute, date_minute:m.date_minute, type_minute:m.type_minute}] : []);
      return list.map(mn => ({ ...mn, type_mandat: m.type_mandat }));
    });
    if (allMinutes.length > 0) {
      y += 2;
      y += d.sHdr('MINUTES', y);
      const mCols = [CW*0.25, CW*0.28, CW*0.22, CW*0.25];
      const mX    = [ML, ML+mCols[0], ML+mCols[0]+mCols[1], ML+mCols[0]+mCols[1]+mCols[2]];
      d.box(ML, y, CW, 13);
      ['Numéro','Mandat','Date','Type'].forEach((h,i) => {
        d.txt(h, mX[i]+3, y+10, { b:true, sz:8, col:C.lbl });
        if(i>0) d.vline(mX[i], y, y+13);
      });
      y += 13;
      for (let i=0; i<allMinutes.length; i++) {
        const mn = allMinutes[i];
        d.box(ML, y, CW, 15);
        mX.forEach((x,ci) => { if(ci>0) d.vline(x, y, y+15); });
        d.txt(safe(mn.minute), mX[0]+3, y+11, { b:true, sz:8.5, col:C.dark });
        d.txt(safe(mn.type_mandat), mX[1]+3, y+11, { sz:8 });
        d.txt(fd(mn.date_minute), mX[2]+3, y+11, { sz:8.5 });
        d.txt(safe(mn.type_minute), mX[3]+3, y+11, { sz:8 });
        y += 15;
      }
    }

    // ─── SECTION: FERMETURE ───────────────────────────────────────────
    y += 2;
    y += d.sHdr('FERMETURE', y);
    d.box(ML, y, CW, 16);
    d.txt('Date de fermeture :', ML+3, y+12, { b:true, sz:8.5, col:C.lbl });
    d.txt(fd(dossierData.date_fermeture), ML+82, y+12, { sz:8.5 });
    y += 16;
    // Espace pour signature avec ligne
    d.box(ML, y, CW, 40);
    // Ligne pour signature
    d.line(ML+20, y+30, ML+CW-20, C.border);
    d.txt(dossierData.arpenteur_geometre||'', ML+CW/2, y+38, { b:true, sz:8.5, col:C.dark, ctr:true });
    y += 40;

    // (no footer)

    // ══════════════════════════════════════════════════════════════════
    // PAGE 2 — TEMPS
    // ══════════════════════════════════════════════════════════════════
    const p2 = doc.addPage([PW, PH]);
    const d2 = makeDrawers(p2);
    let y2 = 18;

    // (no header on page 2)

    // Columns: DATE | EMPLOYE(S) | DESCRIPTION | TACHE | TEMPS
    const tCols = [CW*0.14, CW*0.22, CW*0.38, CW*0.14, CW*0.12];
    const tX    = [ML];
    tCols.forEach((w,i) => { if(i>0) tX.push(tX[i-1]+tCols[i-1]); else tX.push(ML); });
    tX.shift(); // remove duplicate
    // Recalc
    const txArr = [ML, ML+tCols[0], ML+tCols[0]+tCols[1], ML+tCols[0]+tCols[1]+tCols[2], ML+tCols[0]+tCols[1]+tCols[2]+tCols[3]];

    // Main header
    y2 += d2.sHdr('ENTRÉES DE TEMPS', y2);
    d2.box(ML, y2, CW, 12);
    ['Date','Employé(s)','Description','Tâche','Heures'].forEach((h,i) => {
      d2.txt(h, txArr[i]+3, y2+9, { b:true, sz:7.5, col:C.lbl });
      if(i>0) d2.vline(txArr[i], y2, y2+12);
    });
    y2 += 12;

    const sections2 = [
      { label:'PLANIFICATION', taches:['Ouverture','Montage','Compilation','Décision/Calcul','Analyse'] },
      { label:'TERRAIN', taches:['Terrain','Cédule'] },
      { label:'RECHERCHES ET ANALYSE FONCIÈRE', taches:['Recherches','Mise en plan','Reliage'] },
      { label:'TRAITEMENT ET DESSIN', taches:['Rapport'] },
      { label:'RAPPORT', taches:['Vérification','Facturer'] },
    ];

    const entreesTemps = entreesTempsData || [];

    let totalHeures = 0;
    for (const section of sections2) {
      // Section sub-header
      d2.fill(ML, y2, CW, 11, C.orange);
      d2.box(ML, y2, CW, 11);
      d2.txt(section.label, ML + CW/2, y2+11/2 + 1, { b:true, sz:8, col:C.white, ctr:true });
      y2 += 11;

      const sectionEntrees = entreesTemps.filter(e => section.taches.includes(e.tache));
      const rows = Math.max(3, sectionEntrees.length + 1);

      for (let ri=0; ri<rows; ri++) {
        const e = sectionEntrees[ri];
        d2.box(ML, y2, CW, 12);
        txArr.forEach((x,ci) => { if(ci>0) d2.vline(x, y2, y2+12); });
        if (e) {
          d2.txt(fd(e.date), txArr[0]+2, y2+9, { sz:7 });
          const empName = employeMap[e.utilisateur_email] || e.utilisateur_email?.split('@')[0] || '';
          d2.txt(safe(empName), txArr[1]+2, y2+9, { sz:7 });
          d2.txt(safe(e.description||e.mandat||''), txArr[2]+2, y2+9, { sz:7 });
          d2.txt(safe(e.tache||''), txArr[3]+2, y2+9, { sz:7 });
          const heuresStr = e.heures ? `${e.heures}h` : '';
          d2.txt(heuresStr, txArr[4]+2, y2+9, { b:true, sz:7.5, col:C.dark });
          totalHeures += (e.heures || 0);
        }
        y2 += 12;
      }
    }

    // Total des heures
    y2 += 4;
    d2.box(ML, y2, CW, 14);
    d2.txt(`TOTAL DES HEURES:`, ML+3, y2+10, { b:true, sz:9, col:C.dark });
    d2.txt(`${totalHeures.toFixed(2)}h`, txArr[4]+2, y2+10, { b:true, sz:9, col:C.dark });
    y2 += 14;

    // (no footer)

    // ─── Serialize ────────────────────────────────────────────────────
    const pdfBytes = await doc.save();
    let b64 = '';
    for (let i=0; i<pdfBytes.length; i+=8192) b64 += String.fromCharCode(...pdfBytes.subarray(i, i+8192));
    b64 = btoa(b64);
    return Response.json({ success:true, fileName:pdfFileName, pdf:`data:application/pdf;base64,${b64}` });

  } catch (error) {
    console.error('generateFicheMandat error:', error);
    return Response.json({ error: error.message || 'Erreur serveur' }, { status:500 });
  }
});