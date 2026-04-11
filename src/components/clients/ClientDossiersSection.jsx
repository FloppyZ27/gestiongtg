import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { FolderOpen, Search, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = { "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getMandatColor = (typeMandat) => {
  const colors = { "Bornage": "bg-red-500/20 text-red-400 border-red-500/30", "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30", "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30", "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30", "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30", "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30", "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30", "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

const formatAdresseTravaux = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

export default function ClientDossiersSection({ clientDossiers = [] }) {
  const [collapsed, setCollapsed] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterMandat, setFilterMandat] = useState([]);
  const [filterVille, setFilterVille] = useState([]);
  const [filterStatut, setFilterStatut] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const allVilles = [...new Set(clientDossiers.map(d => d.mandats?.[0]?.adresse_travaux?.ville).filter(v => v))].sort();

  const handleSort = (field) => {
    if (sortField === field) setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDirection("asc"); }
  };

  const filtered = clientDossiers.filter(dossier => {
    const searchLower = searchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    const matchesSearch = fullNumber.toLowerCase().includes(searchLower) || dossier.numero_dossier?.toLowerCase().includes(searchLower) || formatAdresseTravaux(dossier.mandats?.[0]?.adresse_travaux)?.toLowerCase().includes(searchLower) || dossier.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower));
    const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(dossier.arpenteur_geometre);
    const matchesVille = filterVille.length === 0 || filterVille.includes(dossier.mandats?.[0]?.adresse_travaux?.ville);
    const matchesMandat = filterMandat.length === 0 || dossier.mandats?.some(m => filterMandat.includes(m.type_mandat));
    const matchesStatut = filterStatut === "all" || dossier.statut === filterStatut;
    return matchesSearch && matchesArpenteur && matchesVille && matchesMandat && matchesStatut;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let aValue, bValue;
    switch (sortField) {
      case 'numero_dossier': aValue = (getArpenteurInitials(a.arpenteur_geometre) + (a.numero_dossier || '')).toLowerCase(); bValue = (getArpenteurInitials(b.arpenteur_geometre) + (b.numero_dossier || '')).toLowerCase(); break;
      case 'mandats': aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase(); bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase(); break;
      case 'adresse': aValue = formatAdresseTravaux(a.mandats?.[0]?.adresse_travaux).toLowerCase(); bValue = formatAdresseTravaux(b.mandats?.[0]?.adresse_travaux).toLowerCase(); break;
      case 'statut': aValue = (a.statut || '').toLowerCase(); bValue = (b.statut || '').toLowerCase(); break;
      case 'date': aValue = new Date(a.date_ouverture || 0).getTime(); bValue = new Date(b.date_ouverture || 0).getTime(); break;
      default: return 0;
    }
    if (typeof aValue === 'string') return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
  });

  const hasFilters = filterArpenteur.length > 0 || filterMandat.length > 0 || filterVille.length > 0 || filterStatut !== "all";

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-2 bg-emerald-900/20" onClick={() => setCollapsed(!collapsed)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <CardTitle className="text-emerald-300 text-base">Dossiers associés</CardTitle>
            {clientDossiers.length > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{clientDossiers.length}</Badge>
            )}
          </div>
          {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-3 pb-2">
          <div className="space-y-3 mb-3">
            <div className="flex justify-between items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm">Filtres</span>
                {hasFilters && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{filterArpenteur.length + filterMandat.length + filterVille.length + (filterStatut !== "all" ? 1 : 0)}</Badge>}
                {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>

            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleContent>
                <div className="p-2 border border-emerald-500/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                    <div className="flex items-center gap-2"><Filter className="w-3 h-3 text-emerald-500" /><h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4></div>
                    {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setFilterArpenteur([]); setFilterMandat([]); setFilterVille([]); setFilterStatut("all"); }} className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"><X className="w-2.5 h-2.5 mr-1" />Réinitialiser</Button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Arpenteurs", items: ARPENTEURS, filter: filterArpenteur, setFilter: setFilterArpenteur },
                      { label: "Types", items: TYPES_MANDATS, filter: filterMandat, setFilter: setFilterMandat },
                      { label: "Villes", items: allVilles, filter: filterVille, setFilter: setFilterVille },
                    ].map(({ label, items, filter, setFilter }) => (
                      <DropdownMenu key={label}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                            <span className="truncate">{label} ({filter.length > 0 ? filter.length : 'Tous'})</span>
                            <ChevronDown className="w-3 h-3 flex-shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                          {items.map((item) => (
                            <DropdownMenuCheckboxItem key={item} checked={filter.includes(item)} onCheckedChange={(checked) => setFilter(checked ? [...filter, item] : filter.filter(i => i !== item))} className="text-white">{item}</DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {sorted.length > 0 ? (
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    {[['numero_dossier','N° Dossier'],['mandats','Mandats'],['adresse','Adresse des travaux'],['statut','Statut'],['date','Date']].map(([field, label]) => (
                      <TableHead key={field} className="text-slate-300 text-xs cursor-pointer hover:text-white" onClick={() => handleSort(field)}>
                        {label} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((dossier) => (
                    <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800 cursor-pointer" onClick={() => window.open(createPageUrl('Dossiers') + `?dossier_id=${dossier.id}`, '_blank')}>
                      <TableCell>
                        <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
                      </TableCell>
                      <TableCell>
                        {dossier.mandats && dossier.mandats.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {dossier.mandats.slice(0, 2).map((m, idx) => <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(m.type_mandat)}</Badge>)}
                            {dossier.mandats.length > 2 && <Badge className="bg-slate-700 text-slate-300 text-xs">+{dossier.mandats.length - 2}</Badge>}
                          </div>
                        ) : <span className="text-slate-600 text-xs">Aucun</span>}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs max-w-xs truncate">{dossier.mandats?.[0]?.adresse_travaux ? formatAdresseTravaux(dossier.mandats[0].adresse_travaux) : "-"}</TableCell>
                      <TableCell><Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">{dossier.statut}</Badge></TableCell>
                      <TableCell className="text-slate-300 text-xs">{dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "dd MMM yyyy", { locale: fr }) : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Aucun dossier associé</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}