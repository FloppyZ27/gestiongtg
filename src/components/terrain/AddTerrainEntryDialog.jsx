import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Search, X, ChevronDown, ChevronUp, Filter, FolderOpen, Compass } from "lucide-react";
import { motion } from "framer-motion";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-", "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL", "Description Technique": "DT",
    "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

const EMPTY_FORM = {
  date_limite_leve: "", instruments_requis: "", a_rendez_vous: false,
  date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "",
  dossier_simultane: "", temps_prevu: "", notes: "", a_dossier_simultane: false,
  statut_terrain: "a_ceduler",
};

export default function AddTerrainEntryDialog({ open, onOpenChange, dossiers, clients, lots, users, onSave }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedMandat, setSelectedMandat] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterMandat, setFilterMandat] = useState([]);
  const [filterVille, setFilterVille] = useState([]);

  const getClientsNames = (ids) => {
    if (!ids?.length) return "";
    return ids.map(id => { const c = clients.find(c => c.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(n => n).join(", ");
  };

  const filteredDossiers = dossiers.filter(d => {
    const s = searchTerm.toLowerCase();
    const num = getArpenteurInitials(d.arpenteur_geometre) + d.numero_dossier;
    const clientNames = getClientsNames(d.clients_ids);
    return num.toLowerCase().includes(s) || (d.numero_dossier || "").toLowerCase().includes(s) || clientNames.toLowerCase().includes(s);
  });

  const activeFiltersCount = filterArpenteur.length + filterMandat.length + filterVille.length;

  const handleSelectDossier = (dossier) => {
    setSelectedDossier(dossier);
    const firstMandat = dossier.mandats?.[0] || null;
    setSelectedMandat(firstMandat);
    setForm({ ...EMPTY_FORM, technicien: firstMandat?.terrain?.technicien || "", donneur: firstMandat?.terrain?.donneur || "" });
  };

  const handleReset = () => {
    setSelectedDossier(null);
    setSelectedMandat(null);
    setSearchTerm("");
    setForm(EMPTY_FORM);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!selectedDossier || !selectedMandat) return;
    onSave(selectedDossier, selectedMandat, form);
    handleClose();
  };

  const [formCollapsed, setFormCollapsed] = useState(false);
  const mandatsDisponibles = selectedDossier?.mandats || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[75vw] w-[75vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="sticky top-0 z-10 bg-slate-900 py-5 pb-4 border-b border-slate-800 px-6">
          <h2 className="text-2xl font-bold text-white">Nouvelle entrée terrain</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">

          {/* Section sélection dossier — identique à EntreeTempsDialog */}
          <div className="border border-slate-700 bg-slate-800/30 rounded-lg">
            <div className="cursor-default rounded-t-lg py-2 px-3 bg-blue-900/20">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <FolderOpen className="w-3 h-3 text-blue-400" />
                </div>
                <h3 className="text-blue-300 text-sm font-semibold">Sélection du dossier</h3>
                {selectedDossier && (
                  <span className="text-slate-400 text-xs ml-2">
                    {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier} — {getClientsNames(selectedDossier.clients_ids)}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 pb-2 px-3">
              {!selectedDossier ? (
                <>
                  <div className="flex gap-2 mb-3 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <Input
                        autoFocus
                        placeholder="Rechercher un dossier..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className="h-8 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      <span className="text-sm">Filtres</span>
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                          {activeFiltersCount}
                        </Badge>
                      )}
                      {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </Button>
                  </div>

                  <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                    <CollapsibleContent>
                      <div className="p-2 border border-red-500/30 rounded-lg mb-3">
                      <div className="flex items-center justify-between pb-2 border-b border-red-500/30 mb-2">
                          <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-red-500" />
                            <h4 className="text-xs font-semibold text-red-500">Filtrer</h4>
                          </div>
                          {activeFiltersCount > 0 && (
                            <Button type="button" variant="ghost" size="sm"
                              onClick={() => { setFilterArpenteur([]); setFilterMandat([]); setFilterVille([]); }}
                              className="h-6 text-xs text-red-500 hover:text-red-400 px-2">
                              <X className="w-2.5 h-2.5 mr-1" />Réinitialiser
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Arpenteurs", items: ARPENTEURS, state: filterArpenteur, setState: setFilterArpenteur },
                            { label: "Mandats", items: TYPES_MANDATS, state: filterMandat, setState: setFilterMandat },
                            { label: "Villes", items: [...new Set(dossiers.flatMap(d => d.mandats?.map(m => m.adresse_travaux?.ville).filter(Boolean) || []))].sort(), state: filterVille, setState: setFilterVille },
                          ].map(({ label, items, state, setState }) => (
                            <DropdownMenu key={label}>
                              <DropdownMenuTrigger asChild>
                                <Button type="button" variant="ghost" className="w-full text-red-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-red-500/10">
                                  <span className="truncate">{label} ({state.length > 0 ? state.length : 'Tous'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                {items.map((item) => (
                                  <DropdownMenuCheckboxItem key={item} checked={state.includes(item)}
                                    onCheckedChange={(checked) => setState(checked ? [...state, item] : state.filter(i => i !== item))}
                                    className="text-white text-xs">{item}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="overflow-hidden border border-slate-700 rounded-lg">
                    <div className="overflow-y-auto max-h-[300px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300 text-xs">N° Dossier</TableHead>
                            <TableHead className="text-slate-300 text-xs">Clients</TableHead>
                            <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                            <TableHead className="text-slate-300 text-xs">Lot</TableHead>
                            <TableHead className="text-slate-300 text-xs">Tâche actuelle</TableHead>
                            <TableHead className="text-slate-300 text-xs">Adresse</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(searchTerm ? filteredDossiers : [...dossiers].sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture))).flatMap((dossier) => {
                            const clientsNames = getClientsNames(dossier.clients_ids);
                            if (!dossier.mandats || dossier.mandats.length === 0) return null;
                            return dossier.mandats.filter((mandat) => {
                              const mA = filterArpenteur.length === 0 || filterArpenteur.includes(dossier.arpenteur_geometre);
                              const mM = filterMandat.length === 0 || filterMandat.includes(mandat.type_mandat);
                              const mV = filterVille.length === 0 || filterVille.includes(mandat.adresse_travaux?.ville);
                              return mA && mM && mV;
                            }).map((mandat, idx) => {
                              const lotsDisplay = mandat.lots?.length > 0
                                ? mandat.lots.map(lotId => { const lot = (lots || []).find(l => l.id === lotId); return lot ? lot.numero_lot : lotId; }).join(', ')
                                : '-';
                              return (
                                <TableRow key={`${dossier.id}-${idx}`} className="hover:bg-slate-800/30 border-slate-800 cursor-pointer" onClick={() => handleSelectDossier(dossier)}>
                                  <TableCell className="font-medium text-xs">
                                    <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                      {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs">{clientsNames || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">
                                    <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(mandat.type_mandat)}</Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs">{lotsDisplay}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">
                                    {mandat.tache_actuelle ? <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{mandat.tache_actuelle}</Badge> : '-'}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                                    {mandat.adresse_travaux ? formatAdresse(mandat.adresse_travaux) : "-"}
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-slate-800/30 rounded-lg border border-slate-700 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-800/50">
                      <TableRow className="hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300 text-xs">N° Dossier</TableHead>
                        <TableHead className="text-slate-300 text-xs">Clients</TableHead>
                        <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                        <TableHead className="text-slate-300 text-xs">Tâche actuelle</TableHead>
                        <TableHead className="text-slate-300 text-xs">Adresse</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-slate-800/30 border-slate-800">
                        <TableCell className="font-medium text-xs p-2">
                          <Badge variant="outline" className={`${getArpenteurColor(selectedDossier.arpenteur_geometre)} border`}>
                            {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs p-2">{getClientsNames(selectedDossier.clients_ids) || "-"}</TableCell>
                        <TableCell className="text-slate-300 text-xs p-2">
                          <Badge className={`${getMandatColor(selectedDossier.mandats?.[0]?.type_mandat)} border text-xs`}>
                            {getAbbreviatedMandatType(selectedDossier.mandats?.[0]?.type_mandat) || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs p-2">
                          {selectedDossier.mandats?.[0]?.tache_actuelle
                            ? <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{selectedDossier.mandats[0].tache_actuelle}</Badge>
                            : <span className="text-slate-400 text-xs">-</span>}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs p-2 max-w-xs truncate">
                          {selectedDossier.mandats?.[0]?.adresse_travaux ? formatAdresse(selectedDossier.mandats[0].adresse_travaux) : "-"}
                        </TableCell>
                        <TableCell className="text-right p-2">
                          <Button type="button" size="sm" variant="ghost" onClick={handleReset} className="text-slate-400 text-xs h-6 hover:text-white">
                            Changer
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Formulaire terrain — section collapsable style amber comme EditDossierForm */}
          {selectedDossier && (
            <div className="border-2 border-amber-500/30 rounded-lg bg-amber-900/10">
              <div
                className="cursor-pointer hover:bg-amber-950/60 transition-colors px-4 py-2.5 flex items-center justify-between rounded-t-lg"
                style={{ background: 'linear-gradient(90deg, hsl(30, 30%, 12%), hsl(30, 20%, 10%))' }}
                onClick={() => setFormCollapsed(!formCollapsed)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span className="text-amber-400 text-sm font-semibold tracking-wide">Terrain</span>
                </div>
                {formCollapsed ? <ChevronDown className="w-4 h-4 text-amber-500/60" /> : <ChevronUp className="w-4 h-4 text-amber-500/60" />}
              </div>

              {!formCollapsed && (
            <div className="p-4 border-t border-amber-500/30 space-y-3 bg-transparent">
              {/* Ligne 1 : Mandat* | Temps prévu | Donneur | Instruments | Technicien */}
              <div className="grid grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                  <Select
                    value={selectedMandat ? String(mandatsDisponibles.indexOf(selectedMandat)) : ""}
                    onValueChange={v => setSelectedMandat(mandatsDisponibles[parseInt(v)])}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {mandatsDisponibles.map((m, i) => (
                        <SelectItem key={i} value={String(i)} className="text-white text-xs">
                          {m.type_mandat || `Mandat ${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Temps prévu</Label>
                  <Input
                    placeholder="Ex: 2h30"
                    value={form.temps_prevu}
                    onChange={e => setForm({ ...form, temps_prevu: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Donneur</Label>
                  <Select value={form.donneur} onValueChange={v => setForm({ ...form, donneur: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map(u => (
                        <SelectItem key={u.email} value={u.full_name} className="text-white text-xs">{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Instruments</Label>
                  <Select value={form.instruments_requis} onValueChange={v => setForm({ ...form, instruments_requis: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {["Can-Net","RTK","CONV","3 GPS","Chaine","SX10","NAVIS","Drône"].map(v => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Technicien</Label>
                  <Select value={form.technicien} onValueChange={v => setForm({ ...form, technicien: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {(users || []).map(u => (
                        <SelectItem key={u.email} value={u.full_name} className="text-white text-xs">{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ligne 2 : Date limite cédule | Toggle Rendez-vous | Date RDV (si actif) | Heure RDV (si actif) */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Date limite cédule</Label>
                  <Input
                    type="date"
                    value={form.date_limite_leve}
                    onChange={e => setForm({ ...form, date_limite_leve: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 flex items-end">
                  <div className="flex items-center gap-2 h-8">
                    <Switch
                      checked={form.a_rendez_vous}
                      onCheckedChange={checked => setForm({ ...form, a_rendez_vous: checked })}
                      className="data-[state=checked]:bg-amber-400"
                    />
                    <Label className="text-slate-400 text-xs">Rendez-vous</Label>
                  </div>
                </div>
                {form.a_rendez_vous && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Date RDV</Label>
                      <Input
                        type="date"
                        value={form.date_rendez_vous}
                        onChange={e => setForm({ ...form, date_rendez_vous: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Heure RDV</Label>
                      <Input
                        type="time"
                        value={form.heure_rendez_vous}
                        onChange={e => setForm({ ...form, heure_rendez_vous: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Ligne 3 : Dossier simultané */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 flex items-end">
                  <div className="flex items-center gap-2 h-8">
                    <Switch
                      checked={form.a_dossier_simultane}
                      onCheckedChange={checked => setForm({ ...form, a_dossier_simultane: checked, dossier_simultane: checked ? form.dossier_simultane : "" })}
                      className="data-[state=checked]:bg-amber-400"
                    />
                    <Label className="text-slate-400 text-xs">Dossier à faire en même temps</Label>
                  </div>
                </div>
                {form.a_dossier_simultane && (
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Dossier simultané</Label>
                    <Select value={form.dossier_simultane} onValueChange={v => setForm({ ...form, dossier_simultane: v })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {dossiers.filter(d => d.id !== selectedDossier?.id).map(d => (
                          <SelectItem key={d.id} value={`${getArpenteurInitials(d.arpenteur_geometre)}${d.numero_dossier}`} className="text-white text-xs">
                            {getArpenteurInitials(d.arpenteur_geometre)}{d.numero_dossier}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Bouton Ajouter le terrain */}
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={!selectedMandat}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 h-8 text-xs mt-3 w-full border border-amber-500/30"
              >
                + Ajouter le terrain
              </Button>
            </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 py-4 px-6 border-t border-slate-800">
          <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={handleClose}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}