import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Search, X, ChevronDown, ChevronUp, Edit, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { MapPin } from "lucide-react";

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

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

export default function MandatsSection({
  formData,
  setFormData,
  updateMandat,
  addMandat,
  removeMandat,
  openLotSelector,
  removeLotFromMandat,
  getLotById,
  users,
  activeTabMandat,
  setActiveTabMandat,
  mandatStepCollapsed,
  setMandatStepCollapsed,
  setShowDeleteMandatConfirm,
  setMandatIndexToDelete
}) {
  const [sameAddressForAllMandats, setSameAddressForAllMandats] = useState(false);
  const [sameDatesForAllMandats, setSameDatesForAllMandats] = useState(false);
  const [sameLotsForAllMandats, setSameLotsForAllMandats] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);
  const [currentMandatIndexForAddress, setCurrentMandatIndexForAddress] = useState(null);
  const [currentMandatIndexForLot, setCurrentMandatIndexForLot] = useState(null);
  const [lotTabExpanded, setLotTabExpanded] = useState(false);
  const [lotSearchTerm, setLotSearchTerm] = useState("");

  return (
    <Card className="border-slate-700 bg-slate-800/30 mt-3" data-section="mandats">
      <CardHeader 
        className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-1.5 bg-orange-900/20"
        onClick={() => setMandatStepCollapsed(!mandatStepCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            <CardTitle className="text-orange-300 text-base">Mandats</CardTitle>
            {formData.mandats.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {formData.mandats.slice(0, 3).map((m, idx) => m.type_mandat && (
                  <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                    {getAbbreviatedMandatType(m.type_mandat)}
                  </Badge>
                ))}
                {formData.mandats.length > 3 && (
                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                    +{formData.mandats.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {mandatStepCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!mandatStepCollapsed && (
        <CardContent className="pt-2 pb-3">
          {formData.mandats.length > 0 ? (
            <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat} className="w-full">
              <div className="flex justify-between items-center mb-2 gap-3">
                <div className="flex-1">
                  <TabsList className="bg-slate-800/30 border border-slate-700 h-auto justify-start p-1 rounded-lg inline-flex">
                    {formData.mandats.map((mandat, index) => {
                      const mandatColor = getMandatColor(mandat.type_mandat);
                      const isActive = activeTabMandat === index.toString();
                      return (
                        <TabsTrigger
                          key={index}
                          value={index.toString()}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                            isActive ? mandatColor : 'text-slate-400'
                          }`}
                        >
                          <Badge className={`${mandatColor} border text-xs`}>
                            {mandat.type_mandat ? getAbbreviatedMandatType(mandat.type_mandat) : `Mandat ${index + 1}`}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </div>
                
                <div className="flex gap-1">
                  {formData.mandats.length > 1 && (
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setMandatIndexToDelete(parseInt(activeTabMandat));
                        setShowDeleteMandatConfirm(true);
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button type="button" size="sm" onClick={addMandat} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-6 text-xs">
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </div>

              {formData.mandats.map((mandat, index) => (
                <TabsContent key={index} value={index.toString()} className="mt-2 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
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
                      <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
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
                      <Select value={mandat.tache_actuelle || "Ouverture"} onValueChange={(value) => updateMandat(index, 'tache_actuelle', value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                          <SelectValue placeholder="Sélectionner" />
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

                  {/* Adresse et Dates côte à côte */}
                  <div className="grid grid-cols-[1fr_1px_1fr] gap-3">
                    {/* Colonne Adresse */}
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
                          <Label htmlFor={`sameAddressForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous les mandats</Label>
                        </div>
                      </div>
                      
                      {/* Barre de recherche d'adresse */}
                      <div className="relative mt-4">
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
                                    console.error("Erreur recherche adresse:", error);
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
                                  <span className="truncate">{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`}</span>
                                </div>
                                {suggestion.distance && <span className="text-xs text-slate-500 flex-shrink-0">{suggestion.distance} km</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-[100px_1fr] gap-1">
                        <div className="space-y-0.5">
                          <Label className="text-slate-500 text-[10px]">N° civique</Label>
                          <Input 
                            placeholder="123" 
                            value={mandat.adresse_travaux?.numeros_civiques?.[0] || ""} 
                            onChange={(e) => {
                              const addr = mandat.adresse_travaux || {};
                              const newAddress = { ...addr, numeros_civiques: [e.target.value] };
                              if (sameAddressForAllMandats) {
                                setFormData(prev => ({
                                  ...prev,
                                  mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                }));
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
                                setFormData(prev => ({
                                  ...prev,
                                  mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                }));
                              } else {
                                updateMandat(index, 'adresse_travaux', newAddress);
                              }
                            }}
                            className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="space-y-0.5">
                          <Label className="text-slate-500 text-[10px]">Ville</Label>
                          <Input 
                            placeholder="Ville" 
                            value={mandat.adresse_travaux?.ville || ""} 
                            onChange={(e) => {
                              const addr = mandat.adresse_travaux || {};
                              const newAddress = { ...addr, ville: e.target.value };
                              if (sameAddressForAllMandats) {
                                setFormData(prev => ({
                                  ...prev,
                                  mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                }));
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
                                setFormData(prev => ({
                                  ...prev,
                                  mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                }));
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
                                setFormData(prev => ({
                                  ...prev,
                                  mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                }));
                              } else {
                                updateMandat(index, 'adresse_travaux', newAddress);
                              }
                            }}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20">
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

                    <div className="bg-slate-600"></div>

                    {/* Colonne Dates */}
                    <div className="space-y-2 pr-2">
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-slate-400 text-xs">Dates</Label>
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
                          <Label htmlFor={`sameDatesForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous</Label>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Date de signature</Label>
                        <Input 
                          type="date" 
                          value={mandat.date_signature || ""} 
                          onChange={(e) => {
                            if (sameDatesForAllMandats) {
                              setFormData(prev => ({
                                ...prev,
                                mandats: prev.mandats.map(m => ({ ...m, date_signature: e.target.value }))
                              }));
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
                              setFormData(prev => ({
                                ...prev,
                                mandats: prev.mandats.map(m => ({ ...m, date_debut_travaux: e.target.value }))
                              }));
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
                              setFormData(prev => ({
                                ...prev,
                                mandats: prev.mandats.map(m => ({ ...m, date_livraison: e.target.value }))
                              }));
                            } else {
                              updateMandat(index, 'date_livraison', e.target.value);
                            }
                          }}
                          className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-600 my-2"></div>

                  {/* Lots en dessous */}
                  <div className={`grid ${lotTabExpanded && currentMandatIndexForLot === index ? 'grid-cols-[50%_50%]' : 'grid-cols-1'} gap-4 transition-all`}>
                    <div className={`space-y-2 ${lotTabExpanded && currentMandatIndexForLot === index ? 'border-r border-slate-700 pr-4' : ''}`}>
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
                          <Label htmlFor={`sameLotsForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous</Label>
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
                                  >
                                   <button 
                                     type="button" 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       removeLotFromMandat(index, lotId);
                                     }}
                                     className="absolute right-1 top-1 hover:text-red-400"
                                   >
                                     <X className="w-3 h-3" />
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
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex items-center justify-center py-6">
              <Button type="button" size="sm" onClick={addMandat} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter un mandat
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}