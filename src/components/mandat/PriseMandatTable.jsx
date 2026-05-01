import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Trash2,
  FolderOpen,
  X,
  FileQuestion,
  XCircle,
} from "lucide-react";

export default function PriseMandatTable({
  priseMandats,
  activeListTab,
  searchTerm,
  setSearchTerm,
  isFiltersOpen,
  setIsFiltersOpen,
  filterArpenteur,
  setFilterArpenteur,
  filterVille,
  setFilterVille,
  filterTypeMandat,
  setFilterTypeMandat,
  filterUrgence,
  setFilterUrgence,
  filterDateStart,
  setFilterDateStart,
  filterDateEnd,
  setFilterDateEnd,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  allVilles,
  ARPENTEURS,
  TYPES_MANDATS,
  onEditPriseMandat,
  onDeletePriseMandat,
  onOpenDossier,
  setPriseMandatIdToDelete,
  setShowDeletePriseMandatConfirm,
  getArpenteurInitials,
  getArpenteurColor,
  formatAdresse,
  getMandatColor,
  getAbbreviatedMandatType,
  getClientsNames,
  getClientById,
  users,
}) {
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedMandats = priseMandats
    .filter(pm => {
      const tabStatut = activeListTab === "nouveau" 
        ? "Nouveau mandat/Demande d'information"
        : activeListTab === "ouvrir"
        ? "Mandats à ouvrir"
        : "Mandat non octroyé";
      return pm.statut === tabStatut;
    })
    .filter(pm => {
      const searchLower = searchTerm.toLowerCase();
      const clientName = pm.client_info?.prenom || pm.client_info?.nom 
        ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim().toLowerCase()
        : getClientsNames(pm.clients_ids).toLowerCase();
      const matchesSearch = (
        pm.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        clientName.includes(searchLower) ||
        formatAdresse(pm.adresse_travaux)?.toLowerCase().includes(searchLower) ||
        pm.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
      );
      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(pm.arpenteur_geometre);
      const matchesVille = filterVille.length === 0 || filterVille.includes(pm.adresse_travaux?.ville);
      const matchesTypeMandat = filterTypeMandat.length === 0 || pm.mandats?.some(m => filterTypeMandat.includes(m.type_mandat));
      const matchesUrgence = filterUrgence.length === 0 || filterUrgence.includes(pm.urgence_percue);
      
      const pmDate = new Date(pm.created_date);
      const matchesDateStart = filterDateStart === "" || pmDate >= new Date(filterDateStart);
      const matchesDateEnd = filterDateEnd === "" || pmDate <= new Date(filterDateEnd + "T23:59:59");
      
      return matchesSearch && matchesArpenteur && matchesVille && matchesTypeMandat && matchesUrgence && matchesDateStart && matchesDateEnd;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      let aValue, bValue;
      switch (sortField) {
        case 'arpenteur_geometre':
          aValue = (a.arpenteur_geometre || '').toLowerCase();
          bValue = (b.arpenteur_geometre || '').toLowerCase();
          break;
        case 'created_date':
          aValue = new Date(a.created_date || 0).getTime();
          bValue = new Date(b.created_date || 0).getTime();
          break;
        case 'clients':
          const aClientName = a.client_info?.prenom || a.client_info?.nom 
            ? `${a.client_info.prenom || ''} ${a.client_info.nom || ''}`.trim()
            : getClientsNames(a.clients_ids);
          const bClientName = b.client_info?.prenom || b.client_info?.nom 
            ? `${b.client_info.prenom || ''} ${b.client_info.nom || ''}`.trim()
            : getClientsNames(b.clients_ids);
          aValue = aClientName.toLowerCase();
          bValue = bClientName.toLowerCase();
          break;
        case 'adresse_travaux':
          aValue = `${a.adresse_travaux?.numeros_civiques?.[0] || ''} ${a.adresse_travaux?.rue || ''}`.toLowerCase();
          bValue = `${b.adresse_travaux?.numeros_civiques?.[0] || ''} ${b.adresse_travaux?.rue || ''}`.toLowerCase();
          break;
        case 'ville':
          aValue = (a.adresse_travaux?.ville || '').toLowerCase();
          bValue = (b.adresse_travaux?.ville || '').toLowerCase();
          break;
        case 'types_mandats':
          aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
          bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
          break;
        case 'urgence_percue':
          const urgenceOrder = { 'Rapide': 1, 'Normal': 2, 'Pas pressé': 3 };
          aValue = urgenceOrder[a.urgence_percue] || 4;
          bValue = urgenceOrder[b.urgence_percue] || 4;
          break;
        default:
          aValue = '';
          bValue = '';
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  const getUrgenceColor = (u) => (u === "Rapide" || u === "Urgent") ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
      <CardHeader className="border-b border-slate-800 pb-1 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex w-full border-b border-slate-700">
            <button
              role="tab"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeListTab === "nouveau"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/70"
                  : "border-transparent text-slate-500 bg-slate-500/10 hover:text-slate-400"
              }`}
              disabled
            >
              <FileQuestion className="w-4 h-4" />
              Nouveau mandat / Demande d'informations
            </button>
            <button
              role="tab"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeListTab === "ouvrir"
                  ? "border-purple-500 text-purple-400 bg-purple-500/70"
                  : "border-transparent text-slate-500 bg-slate-500/10 hover:text-slate-400"
              }`}
              disabled
            >
              <FolderOpen className="w-4 h-4" />
              Mandat à ouvrir
            </button>
            <button
              role="tab"
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeListTab === "non-octroye"
                  ? "border-red-500 text-red-400 bg-red-500/70"
                  : "border-transparent text-slate-500 bg-slate-500/10 hover:text-slate-400"
              }`}
              disabled
            >
              <XCircle className="w-4 h-4" />
              Mandat non-octroyé
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-700/50 relative"
              >
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm">Filtres</span>
                {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    {filterArpenteur.length + filterVille.length + filterTypeMandat.length + filterUrgence.length + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0)}
                  </Badge>
                )}
                {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>

            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleContent>
                <div className="p-2 border border-emerald-500/30 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                      <div className="flex items-center gap-2">
                        <Filter className="w-3 h-3 text-emerald-500" />
                        <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                      </div>
                      {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFilterArpenteur([]);
                            setFilterVille([]);
                            setFilterTypeMandat([]);
                            setFilterUrgence([]);
                            setFilterDateStart("");
                            setFilterDateEnd("");
                          }}
                          className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                        >
                          <X className="w-2.5 h-2.5 mr-1" />
                          Réinitialiser
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                              <span className="truncate">Arpenteurs ({filterArpenteur.length > 0 ? `${filterArpenteur.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
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
                                className="text-white"
                              >
                                {arp}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                              <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-slate-800 border-slate-700">
                            {allVilles.map((ville) => (
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
                                className="text-white"
                              >
                                {ville}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                              <span className="truncate">Types ({filterTypeMandat.length > 0 ? `${filterTypeMandat.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {TYPES_MANDATS.map((type) => (
                              <DropdownMenuCheckboxItem
                                key={type}
                                checked={filterTypeMandat.includes(type)}
                                onCheckedChange={(checked) => {
                                  setFilterTypeMandat(
                                    checked
                                      ? [...filterTypeMandat, type]
                                      : filterTypeMandat.filter((t) => t !== type)
                                  );
                                }}
                                className="text-white"
                              >
                                {type}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                              <span className="truncate">Urgence ({filterUrgence.length > 0 ? `${filterUrgence.length}` : 'Toutes'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {["Pas pressé", "Normal", "Rapide"].map((urg) => (
                              <DropdownMenuCheckboxItem
                                key={urg}
                                checked={filterUrgence.includes(urg)}
                                onCheckedChange={(checked) => {
                                  setFilterUrgence(
                                    checked
                                      ? [...filterUrgence, urg]
                                      : filterUrgence.filter((u) => u !== urg)
                                  );
                                }}
                                className="text-white"
                              >
                                {urg}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-emerald-500/30">
                      <Label className="text-xs text-emerald-500">Période</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="date"
                          value={filterDateStart}
                          onChange={(e) => setFilterDateStart(e.target.value)}
                          placeholder="Du"
                          className="flex-1 border-emerald-500/30 text-emerald-500 h-8 text-xs px-2"
                        />
                        <span className="text-emerald-500 text-xs">→</span>
                        <Input
                          type="date"
                          value={filterDateEnd}
                          onChange={(e) => setFilterDateEnd(e.target.value)}
                          placeholder="Au"
                          className="flex-1 border-emerald-500/30 text-emerald-500 h-8 text-xs px-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                {[['arpenteur_geometre', activeListTab === 'ouvrir' ? 'Dossier' : 'Arpenteur-Géomètre'], ['clients', 'Clients'], ['adresse_travaux', 'Adresse des travaux'], ['ville', 'Ville'], [null, 'N° de téléphone'], ['types_mandats', 'Types de mandats'], ['created_date', 'Date'], ['urgence_percue', 'Urgence']].map(([field, label]) => (
                  <TableHead
                    key={label}
                    className={`text-slate-300 text-xs ${field ? 'cursor-pointer hover:text-white select-none' : ''}`}
                    onClick={field ? () => handleSort(field) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && (sortField === field
                        ? sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />
                        : <ChevronsUpDown className="w-3 h-3 text-slate-500" />)}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-slate-300 text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMandats.map((pm) => (
                <TableRow 
                  key={pm.id} 
                  className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                  onClick={() => onEditPriseMandat(pm)}
                >
                  <TableCell className="font-medium">
                    {activeListTab === "ouvrir" ? (
                      <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                        {getArpenteurInitials(pm.arpenteur_geometre)}{pm.numero_dossier || "N/A"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                        {pm.arpenteur_geometre}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                    {pm.client_info?.prenom || pm.client_info?.nom 
                      ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim()
                      : getClientsNames(pm.clients_ids)}
                  </TableCell>
                  <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                    {pm.adresse_travaux?.numeros_civiques?.[0] || pm.adresse_travaux?.rue
                      ? `${pm.adresse_travaux.numeros_civiques?.[0] || ''} ${pm.adresse_travaux.rue || ''}`.trim()
                      : '-'}
                  </TableCell>
                  <TableCell className="text-slate-300 text-xs">
                    {pm.adresse_travaux?.ville || '-'}
                  </TableCell>
                  <TableCell className="text-slate-300 text-xs">
                    {(() => {
                      const telephone = pm.client_info?.telephone || 
                        (pm.clients_ids?.length > 0 && (() => {
                          const client = getClientById(pm.clients_ids[0]);
                          return client?.telephones?.find(t => t.actuel)?.telephone || client?.telephones?.[0]?.telephone || null;
                        })());
                      
                      if (telephone) {
                        return (
                          <a 
                            href={`tel:${telephone.replace(/\D/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer hover:underline"
                          >
                            {telephone}
                          </a>
                        );
                      }
                      return '-';
                    })()}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {pm.mandats && pm.mandats.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {pm.mandats.slice(0, 2).map((m, idx) => (
                          <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                            {getAbbreviatedMandatType(m.type_mandat)}
                          </Badge>
                        ))}
                        {pm.mandats.length > 2 && (
                          <Badge className="bg-slate-700 text-slate-300 text-xs">
                            +{pm.mandats.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">Aucun</span>
                    )}
                  </TableCell>

                  <TableCell className="text-slate-300 text-xs">
                    {pm.created_date ? format(new Date(pm.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                  </TableCell>
                  <TableCell>
                    {pm.urgence_percue ? (
                      <Badge className={`${getUrgenceColor(pm.urgence_percue)} border text-xs`}>
                        {pm.urgence_percue === "Rapide" ? "Urgent" : pm.urgence_percue}
                      </Badge>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {activeListTab === "ouvrir" && onOpenDossier && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenDossier(pm)}
                          className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPriseMandatIdToDelete(pm.id);
                          setShowDeletePriseMandatConfirm(true);
                        }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedMandats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                    Aucune prise de mandat dans cette catégorie
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}