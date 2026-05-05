import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, FolderOpen, User, MapPin, Building2, CalendarDays, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const STATUTS = ["Ouvert", "Fermé"];
const PLACES = ["Alma", "Saguenay"];

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

const EMPTY_FILTERS = {
  // Dossier
  numeroDossier: "",
  arpenteur: "",
  typeMandat: "",
  tacheActuelle: "",
  statut: "",
  placeAffaire: "",
  lot: "",
  minute: "",
  // Contacts
  nom: "",
  prenom: "",
  notaire: "",
  courtier: "",
  compagnie: "",
  // Adresse
  numeroCivique: "",
  rue: "",
  ville: "",
  // Dates
  dateOuvertureDebut: "",
  dateOuvertureFin: "",
  dateTerrainDebut: "",
  dateTerrainFin: "",
};

export default function RechercheAvancee() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [hasSearched, setHasSearched] = useState(false);

  const { data: dossiers = [] } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list(), initialData: [] });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (ids) => {
    if (!ids || ids.length === 0) return "";
    return ids.map(id => { const c = getClientById(id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(Boolean).join(", ");
  };

  const getAdresse = (mandat) => {
    if (!mandat?.adresse_travaux) return "";
    const a = mandat.adresse_travaux;
    return [a.numeros_civiques?.filter(n => n).join(', '), a.rue, a.ville, a.code_postal].filter(Boolean).join(' ');
  };

  const setFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const clearFilter = (key) => setFilters(prev => ({ ...prev, [key]: "" }));

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== "").length;

  const results = useMemo(() => {
    if (!hasSearched) return [];

    return dossiers.filter(dossier => {
      const clientsAll = [...(dossier.clients_ids || []), ...(dossier.notaires_ids || []), ...(dossier.courtiers_ids || [])];
      const allClients = clientsAll.map(id => getClientById(id)).filter(Boolean);
      const allClientsText = allClients.map(c => `${c.prenom} ${c.nom}`).join(' ').toLowerCase();
      const allNoms = allClients.map(c => c.nom || '').join(' ').toLowerCase();
      const allPrenoms = allClients.map(c => c.prenom || '').join(' ').toLowerCase();
      const allNotaires = (dossier.notaires_ids || []).map(id => getClientById(id)).filter(Boolean).map(c => `${c.prenom} ${c.nom}`).join(' ').toLowerCase();
      const allCourtiers = (dossier.courtiers_ids || []).map(id => getClientById(id)).filter(Boolean).map(c => `${c.prenom} ${c.nom}`).join(' ').toLowerCase();
      const allCompagnies = (dossier.courtiers_ids || []).map(id => getClientById(id)).filter(c => c && c.type_client === 'Compagnie').map(c => `${c.prenom} ${c.nom}`).join(' ').toLowerCase();
      const mandats = dossier.mandats || [];
      const allAdresses = mandats.map(m => getAdresse(m)).join(' ').toLowerCase();
      const allVilles = mandats.map(m => m.adresse_travaux?.ville || '').join(' ').toLowerCase();
      const allRues = mandats.map(m => m.adresse_travaux?.rue || '').join(' ').toLowerCase();
      const allNumerosCiviques = mandats.flatMap(m => m.adresse_travaux?.numeros_civiques || []).join(' ').toLowerCase();
      const allLots = mandats.flatMap(m => m.lots || []).join(' ').toLowerCase();
      const allMinutes = mandats.flatMap(m => [m.minute, ...(m.minutes_list || []).map(ml => ml.minute)]).filter(Boolean).join(' ').toLowerCase();
      const allDatesTerrains = mandats.flatMap(m => [m.date_terrain, ...(m.terrains_list || []).map(t => t.date_cedulee || t.date_rendez_vous)]).filter(Boolean);

      const f = filters;

      if (f.numeroDossier && !dossier.numero_dossier?.toLowerCase().includes(f.numeroDossier.toLowerCase())) return false;
      if (f.nom && !allNoms.includes(f.nom.toLowerCase())) return false;
      if (f.prenom && !allPrenoms.includes(f.prenom.toLowerCase())) return false;
      if (f.numeroCivique && !allNumerosCiviques.includes(f.numeroCivique.toLowerCase())) return false;
      if (f.rue && !allRues.includes(f.rue.toLowerCase())) return false;
      if (f.ville && !allVilles.includes(f.ville.toLowerCase())) return false;
      if (f.lot && !allLots.includes(f.lot.toLowerCase())) return false;
      if (f.minute && !allMinutes.includes(f.minute.toLowerCase())) return false;
      if (f.arpenteur && f.arpenteur !== "all" && dossier.arpenteur_geometre !== f.arpenteur) return false;
      if (f.typeMandat && f.typeMandat !== "all" && !mandats.some(m => m.type_mandat === f.typeMandat)) return false;
      if (f.tacheActuelle && f.tacheActuelle !== "all" && !mandats.some(m => m.tache_actuelle === f.tacheActuelle)) return false;
      if (f.statut && f.statut !== "all" && dossier.statut !== f.statut) return false;
      if (f.placeAffaire && f.placeAffaire !== "all" && dossier.place_affaire !== f.placeAffaire) return false;
      if (f.notaire && !allNotaires.includes(f.notaire.toLowerCase())) return false;
      if (f.courtier && !allCourtiers.includes(f.courtier.toLowerCase())) return false;
      if (f.compagnie && !allCompagnies.includes(f.compagnie.toLowerCase())) return false;
      if (f.dateOuvertureDebut && dossier.date_ouverture < f.dateOuvertureDebut) return false;
      if (f.dateOuvertureFin && dossier.date_ouverture > f.dateOuvertureFin) return false;
      if (f.dateTerrainDebut) {
        const hasTerrainInRange = allDatesTerrains.some(d => d >= f.dateTerrainDebut);
        if (!hasTerrainInRange) return false;
      }
      if (f.dateTerrainFin) {
        const hasTerrainInRange = allDatesTerrains.some(d => d <= f.dateTerrainFin);
        if (!hasTerrainInRange) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date_ouverture || 0) - new Date(a.date_ouverture || 0));
  }, [hasSearched, filters, dossiers, clients]);

  const handleSearch = () => setHasSearched(true);
  const handleReset = () => { setFilters(EMPTY_FILTERS); setHasSearched(false); };

  const handleDossierClick = (dossier) => {
    window.dispatchEvent(new CustomEvent('openDossierEdit', { detail: { dossierId: dossier.id } }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Recherche avancée
              </h1>
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-slate-400">Filtrez tous les dossiers selon plusieurs critères combinés</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6 space-y-5">

          {/* Groupe Dossier */}
          <FilterGroup icon={<FileText className="w-4 h-4" />} label="Dossier">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Arpenteur-géomètre</Label>
              <div className="relative">
                <Select value={filters.arpenteur} onValueChange={v => setFilter('arpenteur', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {ARPENTEURS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filters.arpenteur && filters.arpenteur !== "all" && <ClearBtn onClick={() => clearFilter('arpenteur')} />}
              </div>
            </div>
            <FilterField label="Numéro de dossier" value={filters.numeroDossier} onChange={v => setFilter('numeroDossier', v)} onClear={() => clearFilter('numeroDossier')} placeholder="ex: 1234" />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Type de mandat</Label>
              <div className="relative">
                <Select value={filters.typeMandat} onValueChange={v => setFilter('typeMandat', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {TYPES_MANDATS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filters.typeMandat && filters.typeMandat !== "all" && <ClearBtn onClick={() => clearFilter('typeMandat')} />}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <div className="relative">
                <Select value={filters.statut} onValueChange={v => setFilter('statut', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    {STATUTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filters.statut && filters.statut !== "all" && <ClearBtn onClick={() => clearFilter('statut')} />}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Place d'affaire</Label>
              <div className="relative">
                <Select value={filters.placeAffaire} onValueChange={v => setFilter('placeAffaire', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {PLACES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filters.placeAffaire && filters.placeAffaire !== "all" && <ClearBtn onClick={() => clearFilter('placeAffaire')} />}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Tâche actuelle</Label>
              <div className="relative">
                <Select value={filters.tacheActuelle} onValueChange={v => setFilter('tacheActuelle', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Toutes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {TACHES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {filters.tacheActuelle && filters.tacheActuelle !== "all" && <ClearBtn onClick={() => clearFilter('tacheActuelle')} />}
              </div>
            </div>
            <FilterField label="Numéro de minute" value={filters.minute} onChange={v => setFilter('minute', v)} onClear={() => clearFilter('minute')} placeholder="ex: 12345" />
          </FilterGroup>

          {/* Groupe Contacts */}
          <FilterGroup icon={<Users className="w-4 h-4" />} label="Contacts">
            <FilterField label="Nom (client)" value={filters.nom} onChange={v => setFilter('nom', v)} onClear={() => clearFilter('nom')} placeholder="ex: Tremblay" />
            <FilterField label="Prénom (client)" value={filters.prenom} onChange={v => setFilter('prenom', v)} onClear={() => clearFilter('prenom')} placeholder="ex: Jean" />
            <FilterField label="Notaire" value={filters.notaire} onChange={v => setFilter('notaire', v)} onClear={() => clearFilter('notaire')} placeholder="ex: Gagnon" />
            <FilterField label="Courtier immobilier" value={filters.courtier} onChange={v => setFilter('courtier', v)} onClear={() => clearFilter('courtier')} placeholder="ex: Bouchard" />
            <FilterField label="Compagnie" value={filters.compagnie} onChange={v => setFilter('compagnie', v)} onClear={() => clearFilter('compagnie')} placeholder="ex: Construction ABC" />
          </FilterGroup>

          {/* Groupe Adresse */}
          <FilterGroup icon={<MapPin className="w-4 h-4" />} label="Adresse des travaux">
            <FilterField label="Numéro civique" value={filters.numeroCivique} onChange={v => setFilter('numeroCivique', v)} onClear={() => clearFilter('numeroCivique')} placeholder="ex: 255" />
            <FilterField label="Rue" value={filters.rue} onChange={v => setFilter('rue', v)} onClear={() => clearFilter('rue')} placeholder="ex: Boulevard des Cascades" />
            <FilterField label="Ville" value={filters.ville} onChange={v => setFilter('ville', v)} onClear={() => clearFilter('ville')} placeholder="ex: Alma" />
          </FilterGroup>

          {/* Groupe Dates */}
          <FilterGroup icon={<CalendarDays className="w-4 h-4" />} label="Dates">
            <FilterField label="Ouverture — du" value={filters.dateOuvertureDebut} onChange={v => setFilter('dateOuvertureDebut', v)} onClear={() => clearFilter('dateOuvertureDebut')} type="date" />
            <FilterField label="Ouverture — au" value={filters.dateOuvertureFin} onChange={v => setFilter('dateOuvertureFin', v)} onClear={() => clearFilter('dateOuvertureFin')} type="date" />
            <FilterField label="Terrain — du" value={filters.dateTerrainDebut} onChange={v => setFilter('dateTerrainDebut', v)} onClear={() => clearFilter('dateTerrainDebut')} type="date" />
            <FilterField label="Terrain — au" value={filters.dateTerrainFin} onChange={v => setFilter('dateTerrainFin', v)} onClear={() => clearFilter('dateTerrainFin')} type="date" />
          </FilterGroup>

          {/* Actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {activeFiltersCount > 0 ? `${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}` : 'Aucun filtre actif'}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleReset} className="text-sm">
                <X className="w-4 h-4 mr-1" /> Réinitialiser
              </Button>
              <Button onClick={handleSearch} className="text-sm bg-primary hover:bg-primary/90">
                <Search className="w-4 h-4 mr-1" /> Rechercher
              </Button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {hasSearched && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-base font-semibold text-foreground">
                {results.length} résultat{results.length !== 1 ? 's' : ''}
              </h2>
              {results.length > 0 && (
                <span className="text-xs text-muted-foreground">Cliquez sur un dossier pour l'ouvrir</span>
              )}
            </div>

            {results.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun dossier ne correspond aux critères sélectionnés</p>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map(dossier => {
                  const clientsNames = getClientsNames(dossier.clients_ids);
                  const notairesNames = getClientsNames(dossier.notaires_ids);
                  const mandats = (dossier.mandats || []).filter(m => m.type_mandat);
                  return (
                    <div
                      key={dossier.id}
                      onClick={() => handleDossierClick(dossier)}
                      className="bg-card border border-border rounded-xl px-4 py-3 hover:border-primary/40 hover:bg-card/80 cursor-pointer transition-all"
                    >
                      {/* Ligne 1 */}
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                          </Badge>
                          {clientsNames && (
                            <span className="text-sm text-foreground flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              {clientsNames}
                            </span>
                          )}
                          {notairesNames && (
                            <span className="text-xs text-muted-foreground">— Notaire: {notairesNames}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {dossier.place_affaire && (
                            <span className="text-[11px] text-muted-foreground">{dossier.place_affaire}</span>
                          )}
                          {dossier.date_ouverture && (
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(dossier.date_ouverture), "d MMM yyyy", { locale: fr })}
                            </span>
                          )}
                          <Badge className={`text-[11px] px-1.5 py-0 ${dossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {dossier.statut || 'Ouvert'}
                          </Badge>
                        </div>
                      </div>

                      {/* Mandats */}
                      {mandats.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1">
                          {mandats.map((m, idx) => {
                            const adresse = getAdresse(m);
                            return (
                              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                                <Badge className={`${getMandatColor(m.type_mandat)} border text-[10px] px-1.5 py-0`}>
                                  {m.type_mandat}
                                </Badge>
                                {m.tache_actuelle && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-1.5 py-0">
                                      {m.tache_actuelle}
                                    </Badge>
                                  </>
                                )}
                                {m.minute && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="text-muted-foreground">Min. {m.minute}</span>
                                  </>
                                )}
                                {adresse && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="text-muted-foreground flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5" />{adresse}
                                    </span>
                                  </>
                                )}
                                {m.lots && m.lots.length > 0 && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span className="text-muted-foreground">Lot: {m.lots.join(', ')}</span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterField({ label, value, onChange, onClear, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 text-sm pr-7"
        />
        {value && (
          <button onClick={onClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ icon, label, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-primary">{icon}</span>
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">{label}</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

function ClearBtn({ onClick }) {
  return (
    <button onClick={onClick} className="absolute right-8 top-1/2 -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground">
      <X className="w-3.5 h-3.5" />
    </button>
  );
}