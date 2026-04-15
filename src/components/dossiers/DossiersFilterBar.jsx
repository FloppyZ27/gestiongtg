import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Filter, Search, X, ChevronDown, ChevronUp } from "lucide-react";
import PlaceAffaireTabs from "./PlaceAffaireTabs";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const EQUIPES = ["Samuel", "Pierre-Luc", "Dany"];

export default function DossiersFilterBar({
  searchTerm, setSearchTerm,
  isFiltersOpen, setIsFiltersOpen,
  filterArpenteur, setFilterArpenteur,
  filterStatut, setFilterStatut,
  filterMandat, setFilterMandat,
  filterTache, setFilterTache,
  filterVille, setFilterVille,
  filterDateDebut, setFilterDateDebut,
  filterDateFin, setFilterDateFin,
  filterPlaceAffaire, setFilterPlaceAffaire,
  filterEquipe, setFilterEquipe,
  uniqueVilles,
  dossiersWithMandats,
}) {
  const hasFilters = filterArpenteur.length > 0 || filterStatut.length > 0 || filterMandat.length > 0 || filterTache.length > 0 || filterVille.length > 0 || filterDateDebut || filterDateFin;

  const CheckList = ({ items, selected, onToggle }) => (
    <>
      {items.map(item => (
        <div key={item} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-700/50"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(item); }}>
          <input type="checkbox" readOnly checked={selected.includes(item)} className="accent-emerald-500 w-3 h-3 pointer-events-none" />
          <span className="text-white text-xs">{item}</span>
        </div>
      ))}
    </>
  );

  const FilterDropdown = ({ label, items, selected, onToggle }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
          <span className="truncate">{label} ({selected.length > 0 ? selected.length : 'Tous'})</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto" onCloseAutoFocus={(e) => e.preventDefault()}>
        <CheckList items={items} selected={selected} onToggle={(item) => onToggle(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item])} />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <div className="mb-2 flex flex-col gap-2">
        <PlaceAffaireTabs
          value={filterPlaceAffaire}
          onChange={setFilterPlaceAffaire}
          counts={{
            tous: dossiersWithMandats.length,
            alma: dossiersWithMandats.filter(d => d.place_affaire === "Alma").length,
            saguenay: dossiersWithMandats.filter(d => d.place_affaire === "Saguenay").length,
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Équipe de travail :</span>
          {["Toutes", ...EQUIPES].map(equipe => (
            <button
              key={equipe}
              onClick={() => setFilterEquipe(equipe)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all border-0 ${filterEquipe === equipe ? "text-white" : "text-slate-400 hover:text-slate-300"}`}
            >
              <span>{equipe}</span>
              <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[20px] h-5 px-1.5 ${filterEquipe === equipe ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"}`}>
                {equipe === "Toutes"
                  ? dossiersWithMandats.length
                  : dossiersWithMandats.filter(d => d.mandatInfo?.equipe_assignee === equipe || d.mandatInfo?.utilisateur_assigne?.includes(equipe)).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="border border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl rounded-lg mb-2 p-3">
        <div className="space-y-3">
          <div className="flex justify-between items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative">
              <Filter className="w-4 h-4 mr-2" />
              <span className="text-sm">Filtres</span>
              {hasFilters && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                  {filterArpenteur.length + filterStatut.length + filterMandat.length + filterTache.length + filterVille.length + (filterDateDebut ? 1 : 0) + (filterDateFin ? 1 : 0)}
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
                    {hasFilters && (
                      <Button variant="ghost" size="sm" onClick={() => { setFilterArpenteur([]); setFilterStatut([]); setFilterMandat([]); setFilterTache([]); setFilterVille([]); setFilterDateDebut(""); setFilterDateFin(""); setFilterEquipe("Toutes"); }} className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2">
                        <X className="w-2.5 h-2.5 mr-1" />Réinitialiser
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    <FilterDropdown label="Arpenteurs" items={ARPENTEURS} selected={filterArpenteur} onToggle={setFilterArpenteur} />
                    <FilterDropdown label="Statuts" items={["Ouvert", "Fermé"]} selected={filterStatut} onToggle={setFilterStatut} />
                    <FilterDropdown label="Mandats" items={TYPES_MANDATS} selected={filterMandat} onToggle={setFilterMandat} />
                    <FilterDropdown label="Tâches" items={TACHES} selected={filterTache} onToggle={setFilterTache} />
                    <FilterDropdown label="Villes" items={uniqueVilles} selected={filterVille} onToggle={setFilterVille} />
                  </div>
                  <div className="space-y-1 pt-1 border-t border-emerald-500/30">
                    <Label className="text-xs text-emerald-500">Période d'ouverture</Label>
                    <div className="flex items-center gap-1.5">
                      <Input type="date" value={filterDateDebut} onChange={(e) => setFilterDateDebut(e.target.value)} className="flex-1 text-emerald-500 h-8 text-xs px-2 border-none bg-transparent" />
                      <span className="text-emerald-500 text-xs">→</span>
                      <Input type="date" value={filterDateFin} onChange={(e) => setFilterDateFin(e.target.value)} className="flex-1 text-emerald-500 h-8 text-xs px-2 border-none bg-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      </>
      );
      }