import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Database, FileJson, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

const INITIALS_TO_ARPENTEUR = {
  "SG": "Samuel Guay",
  "DG": "Dany Gaboury",
  "PLP": "Pierre-Luc Pilote",
  "BL": "Benjamin Larouche",
  "FG": "Frédéric Gilbert",
  "PG": "Pierre Girard",
  "JV": "Jérémie Vachon",
  "LT": "Luc Tremblay",
};

const LABELS_TO_IGNORE = [
  "Donner a une collab si trouvé",
  "En attente du contrat",
  "OCTR - CORRECTION",
  "Facturé",
  "Stricte",
  "En attente",
  "Cette semaine",
  "RDV",
  "Promesse",
  "Retour terrain",
  "Urgent",
  "Levé technique par drône",
  "Printemps",
  "Suivi demandé par le client",
  "Avant les vacances",
  "Bureau Julie/Cynthia",
  "Avant Noel",
  "Suivi demandé par le notaire",
  "Pendant vacances",
  "Océane",
  "Décision à prendre",
  "En attente des plans de constructions",
  "semaine prochaine",
  "dossier annulé par le client",
  "signature planifiée",
  "en attente de permis lotis",
  "Vérification",
];

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const stripAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/gi, "").toLowerCase().trim();

const normalizeListToTache = (listName) => {
  return (listName || "").trim();
};

const matchMandat = (labelName) => {
  const raw = (labelName || "").trim();
  return TYPES_MANDATS.find(t => t.toLowerCase() === raw.toLowerCase())
    || TYPES_MANDATS.find(t => t.toLowerCase().includes(raw.toLowerCase()))
    || raw;
};

const STREET_KEYWORDS = /\b(rue|chemin|boulevard|boul|bvd|avenue|av|route|rang|montée|côte|place|impasse|allée|sentier|carré|croissant|promenade|terrasse)\b/i;

function parseLotsFromDesc(desc) {
  if (!desc) return [];
  // Match 7-digit lot numbers with optional spaces: "1 234 567" or "1234567"
  const matches = desc.match(/\b(\d{1}[\s]?\d{3}[\s]?\d{3})\b/g) || [];
  return [...new Set(matches.map(m => m.replace(/\s/g, ' ').trim()))];
}

function parseAddressFromDesc(desc) {
  if (!desc) return "";
  const lines = desc.split(/\n/);
  // Civic number: 1-5 digits only (prevents lot numbers from matching)
  const CIVIC = /^(\d{1,5}[A-Za-z]?)/;
  const STREET_KW = /^(?:rue|chemin|boulevard|boul|avenue|route|rang|montée|côte|place|impasse|allée|sentier|carré|croissant|promenade|terrasse)\s+/i;

  // 1. Explicit "Adresse:" prefix
  for (const line of lines) {
    const m = line.match(/^adresse\s*:\s*(.+)$/i);
    if (m) return m[1].trim();
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 2. Civic (1-5 digits) + street + city: "123 Rue ..., Ville"
    const mFull = trimmed.match(/^(\d{1,5}[A-Za-z]?),?\s+((?:rue|chemin|boulevard|boul|avenue|route|rang|montée|côte|place|impasse|allée|sentier|carré|croissant|promenade|terrasse)\s+.+?),\s*(.+)$/i);
    if (mFull) return `${mFull[1]} ${mFull[2]}, ${mFull[3].trim()}`;

    // 3. Street + city: "Rue ..., Ville"
    const mStreetCity = trimmed.match(/^((?:rue|chemin|boulevard|boul|avenue|route|rang|montée|côte|place|impasse|allée|sentier|carré|croissant|promenade|terrasse)\s+.+?),\s*(.+)$/i);
    if (mStreetCity) return `${mStreetCity[1]}, ${mStreetCity[2].trim()}`;

    // 4. Civic (1-5 digits) + street only: "123 Rue des Pins"
    const mCivicOnly = trimmed.match(/^(\d{1,5}[A-Za-z]?),?\s+((?:rue|chemin|boulevard|boul|avenue|route|rang|montée|côte|place|impasse|allée|sentier|carré|croissant|promenade|terrasse)\s+.+)$/i);
    if (mCivicOnly) return `${mCivicOnly[1]} ${mCivicOnly[2].trim()}`;

    // 5. Street only (no civic, no city): "Rue des Pins"
    const mStreetOnly = trimmed.match(/^((?:rue|chemin|boulevard|boul|avenue|route|rang|montée|côte|place|impasse|allée|sentier|carré|croissant|promenade|terrasse)\s+.+)$/i);
    if (mStreetOnly) return mStreetOnly[1].trim();
  }

  return "";
}

function parseTrelloCard(card, listsMap, defaultArpenteur) {
  const name = (card.name || "").trim();

  // Format: {INITIALS}-{NUM} - {Prénom Nom}
  // e.g. "SG-1234 - Jean Dupont" or "PLP-5678 - Marie Martin"
  const match = name.match(/^([A-Z]{1,4})-?(\d+)\s*-\s*(.+)$/);

  let arpenteur = defaultArpenteur;
  let numeroDossier = "";
  let clientsTexte = "";

  if (match) {
    arpenteur = INITIALS_TO_ARPENTEUR[match[1].toUpperCase()] || defaultArpenteur;
    numeroDossier = match[2].trim();
    clientsTexte = match[3].trim();
  } else {
    // Fallback: extract initials and number
    const fallback = name.match(/^([A-Z]{1,4})-?(\d+)/);
    if (fallback) {
      arpenteur = INITIALS_TO_ARPENTEUR[fallback[1].toUpperCase()] || defaultArpenteur;
      numeroDossier = fallback[2];
      clientsTexte = name.replace(fallback[0], "").replace(/^\s*-\s*/, "").trim();
    }
  }

  // List name → tache_actuelle (applies to all mandats)
  const listName = listsMap[card.idList] || "";
  const tache = normalizeListToTache(listName);

  // Labels → mandats (each label name is a type_mandat)
  const mandats = (card.labels || [])
    .map(label => (label.name || "").trim())
    .filter(name => name && !LABELS_TO_IGNORE.some(ig => ig.toLowerCase() === name.toLowerCase()))
    .map(labelName => ({
      type_mandat: matchMandat(labelName),
      tache_actuelle: tache,
      adresse_travaux: { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
      lots: [],
      prix_estime: 0,
      rabais: 0,
      taxes_incluses: false,
      date_livraison: "",
      date_signature: "",
      notes: card.desc || "",
      minutes_list: [],
    }));

  const adresse_travaux_texte = parseAddressFromDesc(card.desc);
  const lots = parseLotsFromDesc(card.desc);

  return {
    numero_dossier: numeroDossier,
    arpenteur_geometre: arpenteur,
    clients_texte: clientsTexte,
    adresse_travaux_texte,
    lots,
    mandats,
    tache_actuelle: tache,
    statut: card.closed || stripAccents(listName) === "termine" ? "Fermé" : "Ouvert",
    date_ouverture: card.dateLastActivity
      ? card.dateLastActivity.split("T")[0]
      : new Date().toISOString().split("T")[0],
  };
}

export default function TrelloImportSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [trelloData, setTrelloData] = useState(null);
  const [parsedCards, setParsedCards] = useState([]);
  const [defaultArpenteur, setDefaultArpenteur] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [excludeTermine, setExcludeTermine] = useState(false);
  const fileRef = useRef();

  const buildParsed = (json, defArp) => {
    const listsMap = {};
    (json.lists || []).forEach(l => { listsMap[l.id] = l.name; });
    return (json.cards || []).map(c => parseTrelloCard(c, listsMap, defArp));
  };

  const processFile = (file) => {
    if (!file || !file.name.endsWith(".json")) {
      alert("Veuillez sélectionner un fichier JSON Trello.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const parsed = buildParsed(json, defaultArpenteur);
        setTrelloData(json);
        setImportResults(null);
        setParsedCards(parsed);
        const valid = parsed.filter(c => c.numero_dossier && c.arpenteur_geometre);
        setSelectedKeys(new Set(valid.map(c => c.numero_dossier)));
      } catch {
        alert("Fichier JSON invalide ou non reconnu comme export Trello.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleDefaultArpenteurChange = (val) => {
    setDefaultArpenteur(val);
    if (trelloData) {
      const parsed = buildParsed(trelloData, val);
      setParsedCards(parsed);
      const valid = parsed.filter(c => c.numero_dossier && c.arpenteur_geometre);
      setSelectedKeys(new Set(valid.map(c => c.numero_dossier)));
    }
  };

  const toggleCard = (key) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const toggleAll = () => {
    const validKeys = validCards.map(c => c.numero_dossier);
    const allSelected = validKeys.every(k => selectedKeys.has(k));
    setSelectedKeys(allSelected ? new Set() : new Set(validKeys));
  };

  const handleImport = async () => {
    setIsImporting(true);
    let success = 0, skipped = 0, errors = 0;

    for (const card of parsedCards.filter(c => selectedKeys.has(c.numero_dossier))) {
      if (!card.numero_dossier || !card.arpenteur_geometre) { skipped++; continue; }
      try {
        await base44.entities.Dossier.create({
          numero_dossier: card.numero_dossier,
          arpenteur_geometre: card.arpenteur_geometre,
          date_ouverture: card.date_ouverture,
          statut: card.statut,
          clients_texte: card.clients_texte,
          adresse_texte: card.adresse_travaux_texte || "",
          ttl: "Non",
          clients_ids: [],
          notaires_ids: [],
          courtiers_ids: [],
          mandats: card.mandats,
        });
        success++;
      } catch {
        errors++;
      }
    }

    setIsImporting(false);
    setImportResults({ success, skipped, errors });
  };

  const validCards = parsedCards.filter(c =>
    c.numero_dossier && c.arpenteur_geometre &&
    !(excludeTermine && c.statut === 'Fermé')
  );
  const validCount = validCards.length;
  const selectedCount = validCards.filter(c => selectedKeys.has(c.numero_dossier)).length;
  const allSelected = validCount > 0 && validCards.every(c => selectedKeys.has(c.numero_dossier));

  // Une ligne par dossier
  const displayRows = validCards
    .sort((a, b) => parseInt(a.numero_dossier || 0) - parseInt(b.numero_dossier || 0))
    .map(card => ({
      ...card,
      dossierLabel: `${Object.entries(INITIALS_TO_ARPENTEUR).find(([,v]) => v === card.arpenteur_geometre)?.[0] || '?'}-${card.numero_dossier}`,
    }));

  return (
    <Card className="border-slate-700 bg-slate-800/30 mt-6">
      <CardHeader
        className="pb-3 border-b border-slate-700 cursor-pointer hover:bg-slate-800/40 transition-colors rounded-t-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            Outils de base de données
          </CardTitle>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
        <p className="text-xs text-slate-500 mt-1">Importation et modification directe de la base de données</p>
      </CardHeader>

      {isOpen && (
        <CardContent className="p-4 space-y-4">
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileJson className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Importation dossiers depuis Trello</h4>
                <p className="text-xs text-slate-500">
                  Format attendu : <span className="font-mono text-slate-400">INITIALES-N°DOSSIER - Prénom Nom</span> · Liste = tâche actuelle · Étiquettes = mandats
                </p>
              </div>
            </div>

            {/* Default arpenteur selector */}
            <div className="flex flex-wrap gap-3 mb-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Arpenteur par défaut (si initiales non reconnues)</label>
                <Select value={defaultArpenteur} onValueChange={handleDefaultArpenteurChange}>
                  <SelectTrigger className="w-56 h-8 text-xs bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ARPENTEURS.map(a => (
                      <SelectItem key={a} value={a} className="text-white text-xs">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={excludeTermine} onCheckedChange={v => setExcludeTermine(!!v)} className="border-slate-600" />
                <span className="text-xs text-slate-400">Exclure les cartes "Terminé 🎉"</span>
              </label>
              {trelloData && (
                <Button size="sm" variant="ghost" onClick={() => { setTrelloData(null); setParsedCards([]); setImportResults(null); }} className="text-slate-400 h-8 text-xs">
                  <X className="w-3 h-3 mr-1" /> Effacer le fichier
                </Button>
              )}
            </div>

            {/* Drop zone */}
            {!trelloData && (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Glisser-déposer ou cliquer pour choisir le fichier JSON Trello</p>
                <p className="text-slate-600 text-xs mt-1">Export JSON complet du tableau Trello (.json)</p>
                <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
              </div>
            )}

            {/* Preview table */}
            {trelloData && parsedCards.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{parsedCards.length} cartes</Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{validCount} dossiers valides</Badge>
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{parsedCards.length - validCount} ignorées</Badge>
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">{selectedCount} sélectionnés</Badge>
                  <button onClick={toggleAll} className="text-xs text-slate-400 hover:text-white underline ml-auto" style={{background:'transparent',border:'none',cursor:'pointer',padding:0}}>
                    {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto border border-slate-700 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300 text-xs py-2 w-8">
                          <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-slate-600" />
                        </TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Dossier</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Client</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Adresse des travaux</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Mandat</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Lots</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Tâche (liste)</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRows.map((row, i) => {
                        const isSelected = selectedKeys.has(row.numero_dossier);
                        return (
                          <TableRow key={i} className={`border-slate-800 text-xs cursor-pointer ${!isSelected ? 'opacity-40' : ''}`} onClick={() => toggleCard(row.numero_dossier)}>
                            <TableCell className="py-1.5" onClick={e => e.stopPropagation()}>
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleCard(row.numero_dossier)} className="border-slate-600" />
                            </TableCell>
                            <TableCell className="py-1.5 font-mono font-semibold">{row.dossierLabel}</TableCell>
                            <TableCell className="py-1.5 text-slate-400 max-w-[130px] truncate">{row.clients_texte || '-'}</TableCell>
                            <TableCell className="py-1.5 text-slate-400 max-w-[160px] truncate">{row.adresse_travaux_texte || <span className="text-slate-600 italic text-[10px]">—</span>}</TableCell>
                            <TableCell className="py-1.5">
                              {row.mandats.length > 0
                                ? <div className="flex flex-wrap gap-1">{row.mandats.map((m, mi) => <Badge key={mi} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">{m.type_mandat}</Badge>)}</div>
                                : <span className="text-orange-400 italic text-[10px]">aucune étiquette</span>
                              }
                            </TableCell>
                            <TableCell className="py-1.5">
                              {row.lots && row.lots.length > 0
                                ? <div className="flex flex-wrap gap-1">{row.lots.map((l, li) => <Badge key={li} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] font-mono">{l}</Badge>)}</div>
                                : <span className="text-slate-600 italic text-[10px]">—</span>
                              }
                            </TableCell>
                            <TableCell className="py-1.5 text-slate-400">{row.tache_actuelle}</TableCell>
                            <TableCell className="py-1.5">
                              {row.statut === 'Fermé'
                                ? <Badge className="bg-slate-700 text-slate-400 text-[10px]">Fermé</Badge>
                                : <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">Ouvert</Badge>
                              }
                            </TableCell>
                           </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {importResults ? (
                  <div className="flex gap-4 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                      <CheckCircle className="w-4 h-4" />{importResults.success} importés
                    </div>
                    <div className="flex items-center gap-1 text-orange-400 text-sm">
                      <AlertCircle className="w-4 h-4" />{importResults.skipped} ignorés
                    </div>
                    {importResults.errors > 0 && (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />{importResults.errors} erreurs
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleImport}
                    disabled={isImporting || selectedCount === 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {isImporting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importation en cours...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Importer {selectedCount} dossier{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}</>
                    )}
                  </Button>
                )}
              </div>
            )}

            {trelloData && parsedCards.length === 0 && (
              <div className="text-center py-6 text-slate-500">
                <FileJson className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune carte trouvée dans ce fichier JSON Trello.</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}