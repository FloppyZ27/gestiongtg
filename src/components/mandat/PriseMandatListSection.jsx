import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Search, Filter, FileQuestion, FolderOpen, XCircle, ChevronUp, ChevronDown } from "lucide-react";
import PriseMandatFilters from "./PriseMandatFilters";
import PriseMandatTable from "./PriseMandatTable";

export default function PriseMandatListSection({
  activeListTab, setActiveListTab,
  priseMandats, applyFilters, searchTerm, setSearchTerm,
  isFiltersOpen, setIsFiltersOpen,
  filterArpenteur, setFilterArpenteur,
  filterVille, setFilterVille,
  filterTypeMandat, setFilterTypeMandat,
  filterUrgence, setFilterUrgence,
  filterDateStart, setFilterDateStart,
  filterDateEnd, setFilterDateEnd,
  filterPlaceAffaire, filterEquipeExternal,
  allVilles,
  sortField, sortDirection, handleSort,
  handleEditPriseMandat,
  setPriseMandatIdToDelete, setShowDeletePriseMandatConfirm,
  getArpenteurColor, getArpenteurInitials, getClientsNames, formatAdresse,
  getMandatColor, getAbbreviatedMandatType, getClientById,
  setNouveauDossierForm, setCommentairesTemporairesDossier, setIsOuvrirDossierDialogOpen,
}) {
  return (
    <div>
      <div className="pb-1 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex w-full">
            <button role="tab" onClick={() => setActiveListTab("nouveau")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeListTab === "nouveau" ? "border-cyan-500 text-cyan-400 bg-cyan-500/70" : "border-transparent text-slate-500 bg-slate-500/10 hover:text-slate-400"}`}>
              <FileQuestion className="w-4 h-4" />
              Nouveau mandat / Demande d'informations
              <Badge className={`ml-1 pointer-events-none ${activeListTab === "nouveau" ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                {applyFilters(priseMandats.filter(pm => pm.statut === "Nouveau mandat/Demande d'information")).length}
              </Badge>
            </button>
            <button role="tab" onClick={() => setActiveListTab("ouvrir")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeListTab === "ouvrir" ? "border-purple-500 text-purple-400 bg-purple-500/70" : "border-transparent text-slate-500 bg-slate-500/10 hover:text-slate-400"}`}>
              <FolderOpen className="w-4 h-4" />
              Mandat à ouvrir
              <Badge className={`ml-1 pointer-events-none ${activeListTab === "ouvrir" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                {applyFilters(priseMandats.filter(pm => pm.statut === "Mandats à ouvrir")).length}
              </Badge>
            </button>
            <button role="tab" onClick={() => setActiveListTab("non-octroye")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${activeListTab === "non-octroye" ? "border-red-500 text-red-400 bg-red-500/70" : "border-transparent text-slate-500 bg-slate-500/10 hover:text-slate-400"}`}>
              <XCircle className="w-4 h-4" />
              Mandat non-octroyé
              <Badge className={`ml-1 pointer-events-none ${activeListTab === "non-octroye" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-700 text-slate-400 border-slate-600"}`}>
                {applyFilters(priseMandats.filter(pm => pm.statut === "Mandat non octroyé")).length}
              </Badge>
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm">Filtres</span>
                {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                  <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    {filterArpenteur.length + filterVille.length + filterTypeMandat.length + filterUrgence.length + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0)}
                  </Badge>
                )}
                {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <CollapsibleContent>
                <PriseMandatFilters
                  filterArpenteur={filterArpenteur} setFilterArpenteur={setFilterArpenteur}
                  filterVille={filterVille} setFilterVille={setFilterVille}
                  filterTypeMandat={filterTypeMandat} setFilterTypeMandat={setFilterTypeMandat}
                  filterUrgence={filterUrgence} setFilterUrgence={setFilterUrgence}
                  filterDateStart={filterDateStart} setFilterDateStart={setFilterDateStart}
                  filterDateEnd={filterDateEnd} setFilterDateEnd={setFilterDateEnd}
                  isFiltersOpen={isFiltersOpen} allVilles={allVilles}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
      <div className="p-0">
        <PriseMandatTable
          activeListTab={activeListTab} priseMandats={priseMandats}
          searchTerm={searchTerm} filterArpenteur={filterArpenteur} filterVille={filterVille}
          filterTypeMandat={filterTypeMandat} filterUrgence={filterUrgence}
          filterDateStart={filterDateStart} filterDateEnd={filterDateEnd}
          filterPlaceAffaire={filterPlaceAffaire} filterEquipeExternal={filterEquipeExternal}
          sortField={sortField} sortDirection={sortDirection} onSort={handleSort}
          onEdit={handleEditPriseMandat}
          onDelete={(id) => { setPriseMandatIdToDelete(id); setShowDeletePriseMandatConfirm(true); }}
          getArpenteurColor={getArpenteurColor} getArpenteurInitials={getArpenteurInitials}
          getClientsNames={getClientsNames} formatAdresse={formatAdresse}
          getMandatColor={getMandatColor} getAbbreviatedMandatType={getAbbreviatedMandatType}
          getClientById={getClientById}
          onOpenDossier={(pm) => {
            const commentsForDossier = pm.commentaires || [];
            const dossierFormData = {numero_dossier: pm.numero_dossier, arpenteur_geometre: pm.arpenteur_geometre, place_affaire: pm.place_affaire, date_ouverture: new Date().toISOString().split('T')[0], statut: "Ouvert", ttl: "Non", clients_ids: pm.clients_ids, notaires_ids: pm.notaires_ids || [], courtiers_ids: pm.courtiers_ids || [], compagnies_ids: pm.compagnies_ids || [], mandats: pm.mandats.filter(m => m.type_mandat).map(m => ({type_mandat: m.type_mandat, adresse_travaux: pm.adresse_travaux, prix_estime: m.prix_estime || 0, rabais: m.rabais || 0, taxes_incluses: m.taxes_incluses || false, date_signature: m.date_signature || "", date_debut_travaux: m.date_debut_travaux || "", date_livraison: m.date_livraison || "", lots: [], tache_actuelle: "Ouverture", utilisateur_assigne: "", minute: "", date_minute: "", type_minute: "Initiale", minutes_list: [], terrain: {date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: ""}, factures: [], notes: ""}))};
            setNouveauDossierForm({...dossierFormData, _clientInfo: pm.client_info || null, _professionnelInfo: pm.professionnel_info || null});
            setCommentairesTemporairesDossier(commentsForDossier);
            setIsOuvrirDossierDialogOpen(true);
          }}
        />
      </div>
    </div>
  );
}