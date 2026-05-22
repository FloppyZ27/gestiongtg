import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Database, FileJson, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const LABEL_COLOR_TO_ARPENTEUR = {
  red: "Samuel Guay",
  orange: "Frédéric Gilbert",
  yellow: "Dany Gaboury",
  blue: "Pierre-Luc Pilote",
  sky: "Benjamin Larouche",
  cyan: "Benjamin Larouche",
};

const LIST_NAME_TO_TACHE = {
  "Ouverture": "Ouverture",
  "Cédule": "Cédule",
  "Montage": "Montage",
  "Terrain": "Terrain",
  "Compilation": "Compilation",
  "Reliage": "Reliage",
  "Décision": "Décision/Calcul",
  "Calcul": "Décision/Calcul",
  "Mise en plan": "Mise en plan",
  "Analyse": "Analyse",
  "Rapport": "Rapport",
  "Vérification": "Vérification",
  "Facturer": "Facturer",
};

function parseTrelloCard(card, listsMap, defaultArpenteur, defaultMandat) {
  // Detect arpenteur from label colors
  let arpenteur = defaultArpenteur;
  if (card.labels && card.labels.length > 0) {
    for (const label of card.labels) {
      const found = LABEL_COLOR_TO_ARPENTEUR[label.color];
      if (found) { arpenteur = found; break; }
      // Try label name
      const foundByName = ARPENTEURS.find(a => a.toLowerCase().includes((label.name || "").toLowerCase()) || (label.name || "").toLowerCase().includes(a.split(" ")[0].toLowerCase()));
      if (foundByName) { arpenteur = foundByName; break; }
    }
  }

  // Detect tache from list name
  const listName = listsMap[card.idList] || "";
  let tache = "Ouverture";
  for (const [key, val] of Object.entries(LIST_NAME_TO_TACHE)) {
    if (listName.toLowerCase().includes(key.toLowerCase())) { tache = val; break; }
  }

  // Parse card name: try to extract numero_dossier and client
  // Common formats: "1234 - Jean Dupont", "SG-1234 Jean Dupont", "1234"
  const name = card.name || "";
  let numeroDossier = "";
  let clientsTexte = "";

  const match = name.match(/^([A-Za-z]{0,3}-?\s*\d{3,6})\s*[-–]?\s*(.*)$/);
  if (match) {
    numeroDossier = match[1].replace(/[^0-9]/g, "").trim();
    clientsTexte = match[2].trim();
  } else {
    const numOnly = name.match(/(\d{3,6})/);
    numeroDossier = numOnly ? numOnly[1] : "";
    clientsTexte = name.replace(numeroDossier, "").replace(/^[-–\s]+/, "").trim();
  }

  // Detect mandat type from labels name or description
  let typeMandat = defaultMandat;
  const descAndName = `${name} ${card.desc || ""}`.toLowerCase();
  for (const t of TYPES_MANDATS) {
    if (descAndName.includes(t.toLowerCase()) || descAndName.includes(t.split(" ")[0].toLowerCase())) {
      typeMandat = t;
      break;
    }
  }
  // Common abbreviations
  if (descAndName.includes(" cl ") || descAndName.startsWith("cl ") || descAndName.includes("certif")) typeMandat = "Certificat de localisation";
  if (descAndName.includes(" imp") || descAndName.includes("implant")) typeMandat = "Implantation";
  if (descAndName.includes(" piq")) typeMandat = "Piquetage";

  return {
    numero_dossier: numeroDossier,
    arpenteur_geometre: arpenteur,
    clients_texte: clientsTexte,
    type_mandat: typeMandat,
    tache_actuelle: tache,
    notes: card.desc || "",
    statut: card.closed ? "Fermé" : "Ouvert",
    date_ouverture: card.dateLastActivity ? card.dateLastActivity.split("T")[0] : new Date().toISOString().split("T")[0],
  };
}

export default function TrelloImportSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [trelloData, setTrelloData] = useState(null);
  const [parsedCards, setParsedCards] = useState([]);
  const [defaultArpenteur, setDefaultArpenteur] = useState("");
  const [defaultMandat, setDefaultMandat] = useState("Certificat de localisation");
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef();

  const processFile = (file) => {
    if (!file || !file.name.endsWith(".json")) {
      alert("Veuillez sélectionner un fichier JSON Trello.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        setTrelloData(json);
        setImportResults(null);

        const listsMap = {};
        (json.lists || []).forEach(l => { listsMap[l.id] = l.name; });

        const cards = (json.cards || []).filter(c => !c.closed || true); // include closed for preview
        const parsed = cards.map(c => parseTrelloCard(c, listsMap, defaultArpenteur, defaultMandat));
        setParsedCards(parsed);
      } catch {
        alert("Fichier JSON invalide ou non reconnu comme export Trello.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const handleReparse = () => {
    if (!trelloData) return;
    const listsMap = {};
    (trelloData.lists || []).forEach(l => { listsMap[l.id] = l.name; });
    const cards = (trelloData.cards || []);
    setParsedCards(cards.map(c => parseTrelloCard(c, listsMap, defaultArpenteur, defaultMandat)));
  };

  const handleImport = async () => {
    setIsImporting(true);
    let success = 0, skipped = 0, errors = 0;

    for (const card of parsedCards) {
      if (!card.numero_dossier || !card.arpenteur_geometre) { skipped++; continue; }
      try {
        await base44.entities.Dossier.create({
          numero_dossier: card.numero_dossier,
          arpenteur_geometre: card.arpenteur_geometre,
          date_ouverture: card.date_ouverture,
          statut: card.statut,
          clients_texte: card.clients_texte,
          ttl: "Non",
          clients_ids: [],
          notaires_ids: [],
          courtiers_ids: [],
          mandats: card.type_mandat ? [{
            type_mandat: card.type_mandat,
            tache_actuelle: card.tache_actuelle,
            adresse_travaux: { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
            lots: [],
            prix_estime: 0,
            rabais: 0,
            taxes_incluses: false,
            date_livraison: "",
            date_signature: "",
            notes: card.notes,
            minutes_list: [],
          }] : [],
        });
        success++;
      } catch {
        errors++;
      }
    }

    setIsImporting(false);
    setImportResults({ success, skipped, errors, total: parsedCards.length });
  };

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
          {/* Trello Import Button/Section */}
          <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <FileJson className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium text-sm">Importation dossiers depuis Trello</h4>
                <p className="text-xs text-slate-500">Lit un export JSON de Trello et crée les dossiers correspondants</p>
              </div>
            </div>

            {/* Config defaults */}
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Arpenteur par défaut</label>
                <Select value={defaultArpenteur} onValueChange={setDefaultArpenteur}>
                  <SelectTrigger className="w-52 h-8 text-xs bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Si non détecté..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ARPENTEURS.map(a => <SelectItem key={a} value={a} className="text-white text-xs">{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400">Type de mandat par défaut</label>
                <Select value={defaultMandat} onValueChange={setDefaultMandat}>
                  <SelectTrigger className="w-52 h-8 text-xs bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TYPES_MANDATS.map(t => <SelectItem key={t} value={t} className="text-white text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {trelloData && (
                <div className="flex flex-col justify-end">
                  <Button size="sm" variant="outline" onClick={handleReparse} className="h-8 text-xs border-slate-600 text-slate-300">
                    Ré-analyser
                  </Button>
                </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{parsedCards.length} cartes</Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{parsedCards.filter(c => c.numero_dossier && c.arpenteur_geometre).length} importables</Badge>
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">{parsedCards.filter(c => !c.numero_dossier || !c.arpenteur_geometre).length} ignorées</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => { setTrelloData(null); setParsedCards([]); setImportResults(null); }} className="text-slate-400 h-7">
                    <X className="w-3 h-3 mr-1" />Effacer
                  </Button>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300 text-xs py-2">N° Dossier</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Arpenteur</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Client</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Mandat</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Tâche</TableHead>
                        <TableHead className="text-slate-300 text-xs py-2">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedCards.map((card, i) => {
                        const valid = card.numero_dossier && card.arpenteur_geometre;
                        return (
                          <TableRow key={i} className={`border-slate-800 text-xs ${!valid ? 'opacity-40' : ''}`}>
                            <TableCell className="py-1.5 font-mono">
                              {card.numero_dossier || <span className="text-red-400 italic">manquant</span>}
                            </TableCell>
                            <TableCell className="py-1.5">{card.arpenteur_geometre || <span className="text-red-400 italic">manquant</span>}</TableCell>
                            <TableCell className="py-1.5 max-w-[150px] truncate text-slate-400">{card.clients_texte || '-'}</TableCell>
                            <TableCell className="py-1.5 text-slate-400">{card.type_mandat || '-'}</TableCell>
                            <TableCell className="py-1.5 text-slate-400">{card.tache_actuelle}</TableCell>
                            <TableCell className="py-1.5">
                              {card.statut === 'Fermé'
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

                {/* Import results */}
                {importResults && (
                  <div className="flex gap-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-1 text-emerald-400 text-sm"><CheckCircle className="w-4 h-4" />{importResults.success} importés</div>
                    <div className="flex items-center gap-1 text-orange-400 text-sm"><AlertCircle className="w-4 h-4" />{importResults.skipped} ignorés</div>
                    {importResults.errors > 0 && <div className="flex items-center gap-1 text-red-400 text-sm"><XCircle className="w-4 h-4" />{importResults.errors} erreurs</div>}
                  </div>
                )}

                {!importResults && (
                  <Button
                    onClick={handleImport}
                    disabled={isImporting || parsedCards.filter(c => c.numero_dossier && c.arpenteur_geometre).length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {isImporting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importation en cours...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Importer {parsedCards.filter(c => c.numero_dossier && c.arpenteur_geometre).length} dossiers dans la base de données</>
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