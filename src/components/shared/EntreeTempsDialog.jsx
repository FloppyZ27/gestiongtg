import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Filter, Search, X, FolderOpen, Timer, Cloud } from "lucide-react";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

export default function EntreeTempsDialog({
  isOpen,
  onOpenChange,
  hasChanges,
  onShowWarning,
  entreeForm,
  setEntreeForm,
  selectedDossierId,
  dossierSearchTerm,
  setDossierSearchTerm,
  filteredDossiers,
  selectedDossier,
  dossiers,
  clients,
  lots,
  users,
  pointages,
  onSubmit,
  onReset,
}) {
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterMandat, setFilterMandat] = useState([]);
  const [filterTache, setFilterTache] = useState([]);
  const [filterVille, setFilterVille] = useState([]);

  const getArpenteurInitials = (arpenteur) => {
    const mapping = {
      "Samuel Guay": "SG-",
      "Dany Gaboury": "DG-",
      "Pierre-Luc Pilote": "PLP-",
      "Benjamin Larouche": "BL-",
      "Frédéric Gilbert": "FG-"
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
      "Certificat de localisation": "CL",
      "Description Technique": "DT",
      "Implantation": "Imp",
      "Levé topographique": "Levé Topo",
      "Piquetage": "Piq"
    };
    return abbreviations[type] || type;
  };

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "";
    const clientNames = clientIds.map(id => {
      const client = clients.find(c => c.id === id);
      return client ? `${client.prenom} ${client.nom}` : "";
    }).filter(name => name);
    return clientNames.join(", ");
  };

  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
  };

  const handleDossierSelect = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    const mandatType = dossier?.mandats?.[0]?.type_mandat || "";
    
    setEntreeForm({
      ...entreeForm,
      dossier_id: dossierId,
      mandat: mandatType,
      tache_suivante: "",
      utilisateur_assigne: ""
    });
    setDossierSearchTerm("");
  };

  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 0);
    const sunday = new Date(today.setDate(diff));
    return sunday.toLocaleDateString('fr-CA');
  };

  const getWeekEndDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + 5;
    const saturday = new Date(today.setDate(diff));
    return saturday.toLocaleDateString('fr-CA');
  };

  const openFactureFolder = async () => {
    const weekStart = getWeekStartDate();
    const weekEnd = getWeekEndDate();
    const folderPath = `EMPLOYÉS/FACTURES/${weekStart}_${weekEnd}`;
    const sharePointUrl = `https://gestiongtg.sharepoint.com/sites/GestionGTG/Documents Partagés/${folderPath}`;
    window.open(sharePointUrl, '_blank');
  };

  const handleFactureUpload = async (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    if (files.length === 0) return;
    // À implémenter : upload vers SharePoint
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && hasChanges) {
        onShowWarning();
      } else {
        onOpenChange(open);
      }
    }}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[75vw] w-[75vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="sticky top-0 z-10 bg-slate-900 py-6 pb-4 border-b border-slate-800 px-6">
          <h2 className="text-2xl font-bold text-white">Nouvelle entrée de temps</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-3">
          <Tabs defaultValue="pointage" className="w-full h-full">
            <TabsList className="bg-slate-800/50 border-b border-slate-700 w-full rounded-none p-0 mb-4">
              <TabsTrigger value="pointage" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none">Pointage</TabsTrigger>
              <TabsTrigger value="facture" className="px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none">Facture</TabsTrigger>
            </TabsList>

            <TabsContent value="pointage" className="space-y-3">
              {/* Résumé des heures restantes */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 grid grid-cols-3 gap-2 mb-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Vacances restantes</Label>
                  <div className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-semibold h-8 flex items-center">
                    {(40 - (pointages?.filter(p => p.type === 'Vacance').reduce((sum, p) => sum + (p.duree_heures || 0), 0) || 0)).toFixed(1)} h
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Mieux-Être restants</Label>
                  <div className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-semibold h-8 flex items-center">
                    {(16 - (pointages?.filter(p => p.type === 'Mieux-Être').reduce((sum, p) => sum + (p.duree_heures || 0), 0) || 0)).toFixed(1)} h
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Banques restantes</Label>
                  <div className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-semibold h-8 flex items-center">
                    {(0 - (pointages?.filter(p => p.type === 'Banque').reduce((sum, p) => sum + (p.duree_heures || 0), 0) || 0)).toFixed(1)} h
                  </div>
                </div>
              </div>

              <form id="entree-temps-form" onSubmit={onSubmit} className="space-y-3">
                {/* Section Informations du dossier */}
                <div className="border border-slate-700 bg-slate-800/30 rounded-lg mb-2">
                  <div 
                    className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-2 px-3 bg-blue-900/20"
                    onClick={() => setInfoDossierCollapsed(!infoDossierCollapsed)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                          <FolderOpen className="w-3 h-3 text-blue-400" />
                        </div>
                        <h3 className="text-blue-300 text-sm font-semibold">Informations du dossier</h3>
                        {selectedDossier && (
                          <span className="text-slate-400 text-xs ml-2">
                            {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier} - {getClientsNames(selectedDossier.clients_ids)}
                          </span>
                        )}
                      </div>
                      {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {!infoDossierCollapsed && (
                    <div className="pt-2 pb-2 px-3">
                      {!selectedDossierId ? (
                        <>
                          <div className="flex gap-2 mb-3 items-center">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                              <Input
                                placeholder="Rechercher un dossier..."
                                value={dossierSearchTerm}
                                onChange={(e) => setDossierSearchTerm(e.target.value)}
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
                              {(filterArpenteur.length > 0 || filterMandat.length > 0 || filterTache.length > 0 || filterVille.length > 0) && (
                                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                  {filterArpenteur.length + filterMandat.length + filterTache.length + filterVille.length}
                                </Badge>
                              )}
                              {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                            </Button>
                          </div>

                          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                            <CollapsibleContent>
                              <div className="p-2 border border-emerald-500/30 rounded-lg mb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                                    <div className="flex items-center gap-2">
                                      <Filter className="w-3 h-3 text-emerald-500" />
                                      <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                                    </div>
                                    {(filterArpenteur.length > 0 || filterMandat.length > 0 || filterTache.length > 0 || filterVille.length > 0) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setFilterArpenteur([]);
                                          setFilterMandat([]);
                                          setFilterTache([]);
                                          setFilterVille([]);
                                        }}
                                        className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                                      >
                                        <X className="w-2.5 h-2.5 mr-1" />
                                        Réinitialiser
                                      </Button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-4 gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Arpenteurs ({filterArpenteur.length > 0 ? `${filterArpenteur.length}` : 'Tous'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-48 bg-slate-800 border-slate-700">
                                        {ARPENTEURS.map((arp) => (
                                          <DropdownMenuCheckboxItem
                                            key={arp}
                                            checked={filterArpenteur.includes(arp)}
                                            onCheckedChange={(checked) => {
                                              setFilterArpenteur(
                                                checked
                                                  ? [...filterArpenteur, arp]
                                                  : filterArpenteur.filter((a) => a !== arp)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {arp}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Mandats ({filterMandat.length > 0 ? `${filterMandat.length}` : 'Tous'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                        {TYPES_MANDATS.map((type) => (
                                          <DropdownMenuCheckboxItem
                                            key={type}
                                            checked={filterMandat.includes(type)}
                                            onCheckedChange={(checked) => {
                                              setFilterMandat(
                                                checked
                                                  ? [...filterMandat, type]
                                                  : filterMandat.filter((t) => t !== type)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {type}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Tâches ({filterTache.length > 0 ? `${filterTache.length}` : 'Toutes'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                        {TACHES.map((tache) => (
                                          <DropdownMenuCheckboxItem
                                            key={tache}
                                            checked={filterTache.includes(tache)}
                                            onCheckedChange={(checked) => {
                                              setFilterTache(
                                                checked
                                                  ? [...filterTache, tache]
                                                  : filterTache.filter((t) => t !== tache)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {tache}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                        {[...new Set(dossiers.flatMap(d => d.mandats?.map(m => m.adresse_travaux?.ville).filter(Boolean) || []))].sort().map((ville) => (
                                          <DropdownMenuCheckboxItem
                                            key={ville}
                                            checked={filterVille.includes(ville)}
                                            onCheckedChange={(checked) => {
                                              setFilterVille(
                                                checked
                                                  ? [...filterVille, ville]
                                                  : filterVille.filter((v) => v !== ville)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {ville}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
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
                                  {(dossierSearchTerm ? filteredDossiers : [...dossiers].sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture))).flatMap((dossier) => {
                                    const clientsNames = getClientsNames(dossier.clients_ids);
                                    if (!dossier.mandats || dossier.mandats.length === 0) {
                                      return null;
                                    }
                                    return dossier.mandats.filter((mandat) => {
                                      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(dossier.arpenteur_geometre);
                                      const matchesMandat = filterMandat.length === 0 || filterMandat.includes(mandat.type_mandat);
                                      const matchesTache = filterTache.length === 0 || filterTache.includes(mandat.tache_actuelle);
                                      const matchesVille = filterVille.length === 0 || filterVille.includes(mandat.adresse_travaux?.ville);
                                      return matchesArpenteur && matchesMandat && matchesTache && matchesVille;
                                    }).map((mandat, idx) => {
                                      const lotsDisplay = mandat.lots && mandat.lots.length > 0 
                                        ? mandat.lots.map(lotId => {
                                            const lot = lots.find(l => l.id === lotId);
                                            return lot ? lot.numero_lot : lotId;
                                          }).join(', ')
                                        : '-';
                                      return (
                                        <TableRow
                                          key={`${dossier.id}-${idx}`}
                                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                                          onClick={() => handleDossierSelect(dossier.id)}
                                        >
                                          <TableCell className="font-medium text-xs">
                                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                              {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-slate-300 text-xs">{clientsNames || "-"}</TableCell>
                                          <TableCell className="text-slate-300 text-xs">
                                            <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                                              {getAbbreviatedMandatType(mandat.type_mandat)}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-slate-300 text-xs">{lotsDisplay}</TableCell>
                                          <TableCell className="text-slate-300 text-xs">
                                            {mandat.tache_actuelle ? (
                                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                                {mandat.tache_actuelle}
                                              </Badge>
                                            ) : '-'}
                                          </TableCell>
                                          <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                                            {mandat.adresse_travaux ? formatAdresse(mandat.adresse_travaux) : "-"}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    });
                                  })}
                                  {(dossierSearchTerm ? filteredDossiers : dossiers.slice(0, 10)).length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={6} className="text-center py-4 text-slate-500 text-xs">
                                        Aucun dossier trouvé
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-0 bg-slate-800/30 rounded-lg border border-slate-700">
                          <div className="overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-800/50">
                                <TableRow className="hover:bg-slate-800/50 border-slate-700">
                                  <TableHead className="text-slate-300 text-xs">N° Dossier</TableHead>
                                  <TableHead className="text-slate-300 text-xs">Clients</TableHead>
                                  <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                                  <TableHead className="text-slate-300 text-xs">Lot</TableHead>
                                  <TableHead className="text-slate-300 text-xs">Tâche actuelle</TableHead>
                                  <TableHead className="text-slate-300 text-xs">Adresse</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="font-medium text-xs p-2">
                                    <Badge variant="outline" className={`${getArpenteurColor(selectedDossier?.arpenteur_geometre)} border`}>
                                      {getArpenteurInitials(selectedDossier?.arpenteur_geometre)}{selectedDossier?.numero_dossier}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs p-2">{getClientsNames(selectedDossier?.clients_ids) || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs p-2">
                                    <Badge className={`${getMandatColor(selectedDossier?.mandats?.[0]?.type_mandat)} border text-xs`}>
                                      {getAbbreviatedMandatType(selectedDossier?.mandats?.[0]?.type_mandat) || "-"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs p-2">{selectedDossier?.mandats?.[0]?.lots?.map(lotId => {
                                    const lot = lots.find(l => l.id === lotId);
                                    return lot ? lot.numero_lot : lotId;
                                  }).join(", ") || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs p-2">
                                    {selectedDossier?.mandats?.[0]?.tache_actuelle ? (
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                        {selectedDossier.mandats[0].tache_actuelle}
                                      </Badge>
                                    ) : (
                                      <span className="text-slate-400 text-xs">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs p-2 max-w-xs truncate">{selectedDossier?.mandats?.[0]?.adresse_travaux ? formatAdresse(selectedDossier.mandats[0].adresse_travaux) : "-"}</TableCell>
                                  <TableCell className="text-right p-2">
                                    <div className="border border-slate-500 rounded px-2 py-1 inline-block">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setEntreeForm({
                                            ...entreeForm,
                                            dossier_id: "",
                                            mandat: "",
                                            tache_suivante: "",
                                            utilisateur_assigne: ""
                                          });
                                        }}
                                        className="text-slate-400 text-xs h-6 border-0"
                                      >
                                        Changer
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section Détails de l'entrée */}
                {selectedDossierId && (
                  <div className="border border-slate-700 bg-slate-800/30 rounded-lg">
                    <div 
                      className="cursor-pointer hover:bg-lime-900/40 transition-colors rounded-t-lg py-2 px-3 bg-lime-900/20"
                      onClick={() => setDetailsCollapsed(!detailsCollapsed)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-lime-500/30 flex items-center justify-center">
                            <Timer className="w-3 h-3 text-lime-400" />
                          </div>
                          <h3 className="text-lime-300 text-sm font-semibold">Détails de l'entrée</h3>
                        </div>
                        {detailsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {!detailsCollapsed && (
                      <div className="pt-2 pb-2 px-3">
                        <div className="rounded-lg p-3">
                          <div className="grid grid-cols-6 gap-2">
                            <div className="space-y-0.5">
                              <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                              <Input
                                type="date"
                                value={entreeForm.date}
                                onChange={(e) => setEntreeForm({...entreeForm, date: e.target.value})}
                                required
                                className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Type <span className="text-red-400">*</span></Label>
                              <Select value={entreeForm.type} onValueChange={(value) => setEntreeForm({...entreeForm, type: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="Pointage" className="text-white text-xs">Pointage</SelectItem>
                                  <SelectItem value="Mieux-Être" className="text-white text-xs">Mieux-Être</SelectItem>
                                  <SelectItem value="Vacance" className="text-white text-xs">Vacance</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Temps <span className="text-red-400">*</span></Label>
                              <Input
                                type="number"
                                step="0.25"
                                min="0"
                                value={entreeForm.heures}
                                onChange={(e) => setEntreeForm({...entreeForm, heures: e.target.value})}
                                required
                                placeholder="Ex: 2.5"
                                className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Multiplicateur <span className="text-red-400">*</span></Label>
                              <Select value={entreeForm.multiplicateur || "1"} onValueChange={(value) => setEntreeForm({...entreeForm, multiplicateur: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="1" className="text-white text-xs">1</SelectItem>
                                  <SelectItem value="1.5" className="text-white text-xs">1.5</SelectItem>
                                  <SelectItem value="2" className="text-white text-xs">2</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Tâche accomplie <span className="text-red-400">*</span></Label>
                              <Select value={entreeForm.tache} onValueChange={(value) => setEntreeForm({...entreeForm, tache: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {TACHES.map((tache) => (
                                    <SelectItem key={tache} value={tache} className="text-white text-xs">
                                      {tache}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Tâche suivante</Label>
                              <Select value={entreeForm.tache_suivante} onValueChange={(value) => setEntreeForm({...entreeForm, tache_suivante: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {TACHES.map((tache) => (
                                    <SelectItem key={tache} value={tache} className="text-white text-xs">
                                      {tache}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                              <Select value={entreeForm.utilisateur_assigne} onValueChange={(value) => setEntreeForm({...entreeForm, utilisateur_assigne: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {(users || []).map((usr) => (
                                    <SelectItem key={usr.email} value={usr.email} className="text-white text-xs">
                                      {usr.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </TabsContent>

            <TabsContent value="facture" className="space-y-3">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                <div className="mb-4">
                  <Label className="text-slate-300 text-sm font-semibold mb-2 block">Dossier de facturation</Label>
                  <p className="text-slate-400 text-xs mb-3">
                    Semaine du {getWeekStartDate()} au {getWeekEndDate()}
                  </p>
                </div>
                
                <Button
                  type="button"
                  onClick={() => openFactureFolder()}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 mb-4"
                >
                  <Cloud className="w-4 h-4 mr-2" />
                  Ouvrir le dossier SharePoint
                </Button>

                <div className="border-2 border-dashed border-blue-500/30 rounded-lg p-6 text-center hover:border-blue-500/50 transition-colors cursor-pointer bg-blue-500/5"
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDrop={(e) => { e.preventDefault(); handleFactureUpload(e); }}
                >
                  <Cloud className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-slate-300 text-sm mb-1">Glissez vos factures ici</p>
                  <p className="text-slate-500 text-xs">ou cliquez pour sélectionner (PDF, PNG, JPG)</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => handleFactureUpload(e)}
                    className="hidden"
                    id="facture-input"
                  />
                  <label htmlFor="facture-input" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" className="mt-3 mx-auto border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                      Sélectionner des fichiers
                    </Button>
                  </label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-3 py-4 px-6 bg-slate-900 border-t border-slate-800 w-full">
          <Button 
            type="button" 
            variant="outline" 
            className="border-red-500 text-red-400 hover:bg-red-500/10"
            onClick={() => {
              if (hasChanges) {
                onShowWarning();
              } else {
                onOpenChange(false);
              }
            }}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            form="entree-temps-form" 
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
            disabled={!selectedDossierId}
          >
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}