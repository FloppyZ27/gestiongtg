import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, MapPin, Plus, X, ChevronDown, ChevronUp, Check } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

export default function MandatTabContent({
  mandat,
  index,
  formData,
  setFormData,
  updateMandat,
  users,
  lots,
  getLotById,
  sameAddressForAllMandats,
  setSameAddressForAllMandats,
  sameDatesForAllMandats,
  setSameDatesForAllMandats,
  sameLotsForAllMandats,
  setSameLotsForAllMandats,
  addressSearchQuery,
  setAddressSearchQuery,
  isSearchingAddress,
  setIsSearchingAddress,
  addressSuggestions,
  setAddressSuggestions,
  addressSearchTimeout,
  setAddressSearchTimeout,
  setCurrentMandatIndexForAddress,
  currentMandatIndexForAddress,
  lotTabExpanded,
  setLotTabExpanded,
  currentMandatIndexForLot,
  setCurrentMandatIndexForLot,
  lotSearchTerm,
  setLotSearchTerm,
  onOpenNewLotDialog,
  setEditingLot,
  setNewLotForm,
  setLotActionLogs,
  removeLotFromMandat,
}) {
  return (
    <TabsContent key={index} value={index.toString()} className="mt-2 space-y-2">

      {/* Ligne 1: Type de mandat | Utilisateur assigné | Tâche — 3 colonnes égales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Type de mandat</Label>
          <Select value={mandat.type_mandat} onValueChange={(value) => updateMandat(index, 'type_mandat', value)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {TYPES_MANDATS.map((type) => (
                <SelectItem key={type} value={type} className="text-white text-xs">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Utilisateur assigné <span className="text-red-400">*</span></Label>
          <Select value={mandat.utilisateur_assigne || ""} onValueChange={(value) => updateMandat(index, 'utilisateur_assigne', value)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {(users || []).map((u) => (
                <SelectItem key={u?.email} value={u?.email} className="text-white text-xs">{u?.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Tâche</Label>
          {mandat.tache_actuelle && !TACHES.includes(mandat.tache_actuelle) && (
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-1.5 py-0.5 truncate max-w-full" title={`Valeur importée : ${mandat.tache_actuelle}`}>
                📥 {mandat.tache_actuelle}
              </span>
            </div>
          )}
          <Select
            value={TACHES.includes(mandat.tache_actuelle) ? mandat.tache_actuelle : ""}
            onValueChange={(value) => updateMandat(index, 'tache_actuelle', value)}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
              <SelectValue placeholder="Sélectionner une tâche" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {TACHES.map((tache) => (
                <SelectItem key={tache} value={tache} className="text-white text-xs">{tache}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-slate-600 my-2"></div>

      {/* Ligne 2: Adresse (2/3) | Dates (1/3) */}
      <div className="grid grid-cols-[2fr_1fr] gap-4">

        {/* Colonne gauche: Adresse des travaux */}
        <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
          <div className="flex items-center gap-1.5">
            <Checkbox
              id={`sameAddressForAllMandats-${index}`}
              checked={sameAddressForAllMandats}
              onCheckedChange={(checked) => {
                setSameAddressForAllMandats(checked);
                if (checked) {
                  const currentAddress = mandat.adresse_travaux;
                  setFormData(prev => ({
                    ...prev,
                    mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: currentAddress }))
                  }));
                }
              }}
            />
            <Label htmlFor={`sameAddressForAllMandats-${index}`} className="text-slate-600 text-[11px] cursor-pointer">Appliquer à tous les mandats</Label>
          </div>
        </div>
        
        {/* Barre de recherche d'adresse */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input
              placeholder="Rechercher une adresse..."
              value={addressSearchQuery}
              onChange={async (e) => {
                const query = e.target.value;
                setAddressSearchQuery(query);
                setCurrentMandatIndexForAddress(index);
                if (addressSearchTimeout) clearTimeout(addressSearchTimeout);
                if (query.length >= 2) {
                  const timeout = setTimeout(async () => {
                    setIsSearchingAddress(true);
                    try {
                      const response = await base44.functions.invoke('searchAddressGoogleMaps', { query });
                      if (response.data?.suggestions) {
                        setAddressSuggestions(response.data.suggestions);
                      } else {
                        setAddressSuggestions([]);
                      }
                    } catch (error) {
                      setAddressSuggestions([]);
                    } finally {
                      setIsSearchingAddress(false);
                    }
                  }, 300);
                  setAddressSearchTimeout(timeout);
                } else {
                  setAddressSuggestions([]);
                }
              }}
              className="bg-slate-700 border-slate-600 text-white h-7 text-sm pl-10"
            />
            {isSearchingAddress && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
            )}
          </div>

          {addressSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {addressSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const newAddress = {
                      numeros_civiques: [suggestion.numero_civique || ""],
                      rue: suggestion.rue || "",
                      ville: suggestion.ville || "",
                      province: suggestion.province || "QC",
                      code_postal: suggestion.code_postal || ""
                    };
                    if (sameAddressForAllMandats) {
                      setFormData(prev => ({
                        ...prev,
                        mandats: prev.mandats.map(m => ({...m, adresse_travaux: JSON.parse(JSON.stringify(newAddress))}))
                      }));
                    } else {
                      updateMandat(currentMandatIndexForAddress, 'adresse_travaux', newAddress);
                    }
                    setAddressSearchQuery("");
                    setAddressSuggestions([]);
                  }}
                  className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm text-slate-300 flex items-center justify-between gap-2 border-b border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}${suggestion.code_postal ? `, ${suggestion.code_postal}` : ''}`}</span>
                  </div>
                  {suggestion.distance && <span className="text-xs text-slate-500 flex-shrink-0">{suggestion.distance} km</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ligne 1: N° civique + Rue */}
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <div className="space-y-0.5">
            <Label className="text-slate-500 text-[10px]">N° civique</Label>
            <Input 
              placeholder="123" 
              value={mandat.adresse_travaux?.numeros_civiques?.[0] || ""} 
              onChange={(e) => {
                const addr = mandat.adresse_travaux || {};
                const newAddress = { ...addr, numeros_civiques: [e.target.value] };
                if (sameAddressForAllMandats) {
                  setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress })) }));
                } else {
                  updateMandat(index, 'adresse_travaux', newAddress);
                }
              }}
              className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-slate-500 text-[10px]">Rue</Label>
            <Input 
              placeholder="Rue principale" 
              value={mandat.adresse_travaux?.rue || ""} 
              onChange={(e) => {
                const addr = mandat.adresse_travaux || {};
                const newAddress = { ...addr, rue: e.target.value };
                if (sameAddressForAllMandats) {
                  setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress })) }));
                } else {
                  updateMandat(index, 'adresse_travaux', newAddress);
                }
              }}
              className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
            />
          </div>
        </div>
        {/* Ligne 2: Ville + Code postal + Province */}
        <div className="grid grid-cols-[1fr_120px_80px] gap-2">
          <div className="space-y-0.5">
            <Label className="text-slate-500 text-[10px]">Ville</Label>
            <Input 
              placeholder="Ville" 
              value={mandat.adresse_travaux?.ville || ""} 
              onChange={(e) => {
                const addr = mandat.adresse_travaux || {};
                const newAddress = { ...addr, ville: e.target.value };
                if (sameAddressForAllMandats) {
                  setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress })) }));
                } else {
                  updateMandat(index, 'adresse_travaux', newAddress);
                }
              }}
              className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-slate-500 text-[10px]">Code postal</Label>
            <Input 
              placeholder="G0A 1A0" 
              value={mandat.adresse_travaux?.code_postal || ""} 
              onChange={(e) => {
                const addr = mandat.adresse_travaux || {};
                const newAddress = { ...addr, code_postal: e.target.value };
                if (sameAddressForAllMandats) {
                  setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress })) }));
                } else {
                  updateMandat(index, 'adresse_travaux', newAddress);
                }
              }}
              className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
            />
          </div>
          <div className="space-y-0.5">
            <Label className="text-slate-500 text-[10px]">Province</Label>
            <Select 
              value={mandat.adresse_travaux?.province || "QC"} 
              onValueChange={(value) => {
                const addr = mandat.adresse_travaux || {};
                const newAddress = { ...addr, province: value };
                if (sameAddressForAllMandats) {
                  setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress })) }));
                } else {
                  updateMandat(index, 'adresse_travaux', newAddress);
                }
              }}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {["QC", "AB", "BC", "PE", "MB", "NB", "NS", "NU", "ON", "SK", "NL", "NT", "YT"].map(prov => (
                  <SelectItem key={prov} value={prov} className="text-white text-xs">{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>

        {/* Colonne droite: Dates */}
        <div className="space-y-2 border-l border-slate-700 pl-4">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-slate-400 text-xs font-medium">Dates</Label>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`sameDatesForAllMandats-${index}`}
                checked={sameDatesForAllMandats}
                onCheckedChange={(checked) => {
                  setSameDatesForAllMandats(checked);
                  if (checked) {
                    const currentDates = {
                      date_signature: mandat.date_signature,
                      date_debut_travaux: mandat.date_debut_travaux,
                      date_livraison: mandat.date_livraison
                    };
                    setFormData(prev => ({
                      ...prev,
                      mandats: prev.mandats.map(m => ({ 
                        ...m, 
                        date_signature: currentDates.date_signature,
                        date_debut_travaux: currentDates.date_debut_travaux,
                        date_livraison: currentDates.date_livraison
                      }))
                    }));
                  }
                }}
              />
              <Label htmlFor={`sameDatesForAllMandats-${index}`} className="text-slate-600 text-[11px] cursor-pointer">Appliquer à tous les mandats</Label>
            </div>
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Date de signature</Label>
              <Input 
                type="date" 
                value={mandat.date_signature || ""} 
                onChange={(e) => {
                  if (sameDatesForAllMandats) {
                    setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, date_signature: e.target.value })) }));
                  } else {
                    updateMandat(index, 'date_signature', e.target.value);
                  }
                }}
                className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Début des travaux</Label>
              <Input 
                type="date" 
                value={mandat.date_debut_travaux || ""} 
                onChange={(e) => {
                  if (sameDatesForAllMandats) {
                    setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, date_debut_travaux: e.target.value })) }));
                  } else {
                    updateMandat(index, 'date_debut_travaux', e.target.value);
                  }
                }}
                className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Date de livraison</Label>
              <Input 
                type="date" 
                value={mandat.date_livraison || ""} 
                onChange={(e) => {
                  if (sameDatesForAllMandats) {
                    setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => ({ ...m, date_livraison: e.target.value })) }));
                  } else {
                    updateMandat(index, 'date_livraison', e.target.value);
                  }
                }}
                className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lots */}
      <div className={`grid ${lotTabExpanded && currentMandatIndexForLot === index ? 'grid-cols-[50%_50%]' : 'grid-cols-1'} gap-4 transition-all`}>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-slate-400 text-xs">Lots</Label>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`sameLotsForAllMandats-${index}`}
                checked={sameLotsForAllMandats}
                onCheckedChange={(checked) => {
                  setSameLotsForAllMandats(checked);
                  if (checked) {
                    const currentLots = mandat.lots || [];
                    setFormData(prev => ({
                      ...prev,
                      mandats: prev.mandats.map(m => ({ ...m, lots: [...currentLots] }))
                    }));
                  }
                }}
              />
              <Label htmlFor={`sameLotsForAllMandats-${index}`} className="text-slate-600 text-[11px] cursor-pointer">Appliquer à tous les mandats</Label>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
              {mandat.lots && mandat.lots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {mandat.lots.map((lotId) => {
                    const lot = getLotById(lotId);
                    return (
                      <div 
                       key={lotId} 
                       className="bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-orange-500/20 transition-colors"
                       onClick={async () => {
                         if (onOpenNewLotDialog && lot) {
                           const logs = await base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: lot.id }, '-created_date');
                           if (setEditingLot) setEditingLot(lot);
                           if (setNewLotForm) {
                             setNewLotForm({
                               numero_lot: lot.numero_lot || "",
                               circonscription_fonciere: lot.circonscription_fonciere || "",
                               cadastre: lot.cadastre || "Québec",
                               rang: lot.rang || "",
                               types_operation: lot.types_operation || []
                             });
                           }
                           if (setLotActionLogs) setLotActionLogs(logs);
                           onOpenNewLotDialog(index);
                         }
                       }}
                      >
                       <button 
                         type="button" 
                         onClick={(e) => {
                           e.stopPropagation();
                           removeLotFromMandat(index, lotId);
                         }}
                         style={{
                           position: 'absolute', right: '3px', top: '3px',
                           background: 'none', border: 'none', padding: '1px',
                           cursor: 'pointer', opacity: 0.5, lineHeight: 1,
                           color: 'inherit', display: 'flex', alignItems: 'center'
                         }}
                         onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                         onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                       >
                         <X style={{width: '10px', height: '10px'}} />
                       </button>
                       <div className="pr-5 space-y-0.5">
                         <p className="font-semibold text-orange-400">{lot?.numero_lot || lotId}</p>
                         <p className="text-slate-400">{lot?.circonscription_fonciere}</p>
                         <p className="text-slate-500">
                           {[lot?.rang, lot?.cadastre].filter(Boolean).join(' • ')}
                         </p>
                       </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                  Aucun lot sélectionné
                </div>
              )}
            </div>
            {!(lotTabExpanded && currentMandatIndexForLot === index) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCurrentMandatIndexForLot(index);
                  setLotTabExpanded(true);
                }}
                className="text-slate-400 hover:text-white h-6 w-6 p-0"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </Button>
            )}
            {lotTabExpanded && currentMandatIndexForLot === index && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setLotTabExpanded(false)}
                className="text-slate-400 hover:text-white h-6 w-6 p-0"
              >
                <ChevronUp className="w-4 h-4 rotate-90" />
              </Button>
            )}
          </div>
        </div>

        <div className={`border-l border-slate-700 pl-3 pr-2 ${!(lotTabExpanded && currentMandatIndexForLot === index) ? 'hidden' : ''}`}>
          <div className="mb-2 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
              <Input
                placeholder="Rechercher lot..."
                value={lotSearchTerm}
                onChange={(e) => setLotSearchTerm(e.target.value)}
                className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCurrentMandatIndexForLot(index);
                if (onOpenNewLotDialog) {
                  onOpenNewLotDialog(index);
                }
              }}
              className="text-orange-400 hover:text-orange-300 h-6 w-6 p-0"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <p className="text-slate-400 text-xs mb-2">Lots existants ({(lots || []).filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase())).length})</p>
          <div className="max-h-[200px] overflow-y-auto space-y-1">
            {(lots || []).filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).length > 0 ? (
              (lots || []).filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).slice(0, 20).map((lot) => {
                const isSelected = mandat.lots?.includes(lot.id);
                return (
                  <div
                    key={lot.id}
                    onClick={() => {
                      const currentLots = formData.mandats[index].lots || [];
                      const lotIsSelected = currentLots.includes(lot.id);
                      const newLots = lotIsSelected
                        ? currentLots.filter(id => id !== lot.id)
                        : [...currentLots, lot.id];

                      if (sameLotsForAllMandats) {
                        setFormData(prev => ({
                          ...prev,
                          mandats: prev.mandats.map(m => ({ ...m, lots: newLots }))
                        }));
                      } else {
                        updateMandat(index, 'lots', newLots);
                      }
                    }}
                    className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
                      isSelected ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:border-orange-500'
                    }`}
                  >
                    <p className="text-white font-semibold text-xs truncate">
                      {lot.numero_lot}
                      {lot.rang && <span className="text-slate-300 font-normal"> • {lot.rang}</span>}
                      {lot.cadastre && <span className="text-slate-300 font-normal"> • {lot.cadastre}</span>}
                      <span className="text-slate-400 font-normal"> • {lot.circonscription_fonciere}</span>
                      {isSelected && <Check className="w-3 h-3 ml-2 inline" />}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-xs text-center py-2">Aucun lot</p>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
}