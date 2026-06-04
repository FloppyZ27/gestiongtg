import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";


const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const OBJECTIFS = ["Vente", "Refinancement", "Projet de construction", "Litige"];
const ECHEANCES = ["1 semaine", "2 semaines", "3 semaines", "4 semaines", "5 semaines", "6 semaines", "7 semaines", "8 semaines ou plus"];
const DELAIS_RAPPEL = ["Normal", "Urgent"];

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq",
    "Bornage": "Born",
    "Dérogation mineure": "Dérog",
    "Projet de lotissement": "Lotis"
  };
  return abbreviations[type] || type;
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

export default function MandatStepForm({ 
  mandats = [],
  onMandatsChange,
  onImmediateSave,
  isCollapsed,
  onToggleCollapse,
  statut = "",
  disabled = false
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extraire les types sélectionnés directement des props
  const selectedTypes = mandats.map(m => m.type_mandat).filter(t => t);
  
  // Prendre les infos partagées du premier mandat
  const sharedInfo = {
    echeance_souhaitee: mandats[0]?.echeance_souhaitee || "",
    date_signature: mandats[0]?.date_signature || "",
    date_debut_travaux: mandats[0]?.date_debut_travaux || "",
    date_livraison: mandats[0]?.date_livraison || "",
    urgence_percue: mandats[0]?.urgence_percue || ""
  };
  
  const isDateLivraisonRequired = statut === "Mandats à ouvrir";

  const toggleMandatType = (type) => {
    let newSelectedTypes;
    if (selectedTypes.includes(type)) {
      newSelectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      newSelectedTypes = [...selectedTypes, type];
    }
    
    if (newSelectedTypes.length === 0) {
      const emptyMandats = [{
        type_mandat: "",
        ...sharedInfo,
        prix_estime: 0,
        prix_premier_lot: 0,
        prix_autres_lots: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: sharedInfo.date_livraison || ""
      }];
      onMandatsChange(emptyMandats);
      onImmediateSave?.(emptyMandats);
    } else {
      const newMandats = newSelectedTypes.map(t => {
        const existingMandat = mandats.find(m => m.type_mandat === t);
        if (existingMandat) {
          const copy = JSON.parse(JSON.stringify(existingMandat));
          copy.echeance_souhaitee = sharedInfo.echeance_souhaitee;
          copy.date_signature = sharedInfo.date_signature;
          copy.date_debut_travaux = sharedInfo.date_debut_travaux;
          copy.date_livraison = sharedInfo.date_livraison;
          copy.urgence_percue = sharedInfo.urgence_percue;
          return copy;
        }
        return {
          type_mandat: t,
          echeance_souhaitee: sharedInfo.echeance_souhaitee,
          date_signature: sharedInfo.date_signature,
          date_debut_travaux: sharedInfo.date_debut_travaux,
          date_livraison: sharedInfo.date_livraison || "",
          urgence_percue: sharedInfo.urgence_percue,
          prix_estime: 0,
          prix_premier_lot: 0,
          prix_autres_lots: 0,
          rabais: 0,
          taxes_incluses: false
        };
      });
      onMandatsChange(newMandats);
      onImmediateSave?.(newMandats);
    }
  };

  const getWeeksFromEcheance = (echeance) => {
    const match = echeance?.match(/^(\d+)\s+semaine/);
    return match ? parseInt(match[1]) : null;
  };

  const handleSharedInfoChange = (field, value) => {
    const newInfo = { ...sharedInfo, [field]: value };
    
    // Reset date fields if echeance is not "Date précise"
    if (field === 'echeance_souhaitee' && value !== "Date précise") {
      newInfo.date_signature = "";
      newInfo.date_debut_travaux = "";
    }

    // Auto-calculer la date de livraison en fonction du nombre de semaines
    if (field === 'echeance_souhaitee') {
      const weeks = getWeeksFromEcheance(value);
      if (weeks !== null) {
        const today = new Date();
        today.setDate(today.getDate() + weeks * 7);
        newInfo.date_livraison = today.toISOString().split('T')[0];
      }
    }
    
    // Mettre à jour tous les mandats avec les nouvelles infos partagées (copie profonde)
    const updatedMandats = mandats.map(m => {
      const copy = JSON.parse(JSON.stringify(m));
      copy.echeance_souhaitee = newInfo.echeance_souhaitee;
      copy.date_signature = newInfo.date_signature;
      copy.date_debut_travaux = newInfo.date_debut_travaux;
      copy.date_livraison = newInfo.date_livraison;
      copy.urgence_percue = newInfo.urgence_percue;
      return copy;
    });
    onMandatsChange(updatedMandats);
  };

  const getUrgenceColor = (urgence) => {
    switch (urgence) {
      case "Normal": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Urgent": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <Card className="border-0 bg-slate-800/30" style={{border: 'none', boxShadow: 'none'}}>
      <CardHeader 
                    className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-1.5 bg-orange-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center">
                <ClipboardList className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <CardTitle className="text-orange-300 text-base">Mandats</CardTitle>
            <span onClick={(e) => e.stopPropagation()} className="flex gap-1 flex-wrap items-center">
              {selectedTypes.length > 0 && selectedTypes.map((type, idx) => (
                <Badge key={idx} className={`${getMandatColor(type)} border text-xs`}>
                  {getAbbreviatedMandatType(type)}
                </Badge>
              ))}
              {sharedInfo.urgence_percue && (
                <Badge className={`${getUrgenceColor(sharedInfo.urgence_percue)} text-xs`}>
                  {sharedInfo.urgence_percue}
                </Badge>
              )}
            </span>
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Colonne gauche: Types de mandats, Échéance souhaitée et Urgence perçue */}
            <div className="space-y-2">
              <div className="space-y-1 relative" ref={dropdownRef}>
                <Label className="text-slate-400 text-xs">Types de mandats</Label>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setDropdownOpen(o => !o)}
                  className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {selectedTypes.length > 0 ? (
                    <span className="truncate">{selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}</span>
                  ) : (
                    <span className="text-muted-foreground">Sélectionner...</span>
                  )}
                  <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute left-0 top-full mt-1 w-full z-50 max-h-[200px] overflow-y-auto p-2 space-y-0.5"
                    style={{background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.55)'}}
                    onWheelCapture={(e) => e.stopPropagation()}
                  >
                    {TYPES_MANDATS.map((type) => {
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <div
                          key={type}
                          onClick={() => toggleMandatType(type)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all text-sm border ${isSelected ? 'text-orange-400 border-orange-500/50' : 'text-slate-300 border-transparent'}`}
                          style={isSelected ? {background: 'rgba(199, 91, 26, 0.25)', boxShadow: '0 0 12px rgba(199, 91, 26, 0.3)'} : {}}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(199, 91, 26, 0.10)'; }}
                          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = ''; }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 accent-orange-500 cursor-pointer flex-shrink-0"
                          />
                          <span>{type}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Échéance souhaitée</Label>
                  <Select value={sharedInfo.echeance_souhaitee} onValueChange={(value) => handleSharedInfoChange('echeance_souhaitee', value)} disabled={disabled}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {ECHEANCES.map((echeance) => (
                        <SelectItem key={echeance} value={echeance} className="text-white">{echeance}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Délais de rappel</Label>
                  <Select value={sharedInfo.urgence_percue} onValueChange={(value) => handleSharedInfoChange('urgence_percue', value)} disabled={disabled}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {DELAIS_RAPPEL.map((delai) => (
                        <SelectItem key={delai} value={delai} className="text-white">{delai}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Colonne droite: Dates */}
            <div className="space-y-2 border-l border-slate-700 pl-4">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Date de signature</Label>
                <Input
                  type="date"
                  value={sharedInfo.date_signature}
                  onChange={(e) => handleSharedInfoChange('date_signature', e.target.value)}
                  disabled={disabled}
                  className="bg-slate-700 border-slate-600 text-white h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Début des travaux</Label>
                <Input
                  type="date"
                  value={sharedInfo.date_debut_travaux}
                  onChange={(e) => handleSharedInfoChange('date_debut_travaux', e.target.value)}
                  disabled={disabled}
                  className="bg-slate-700 border-slate-600 text-white h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">
                  Date de livraison {isDateLivraisonRequired && <span className="text-red-400">*</span>}
                </Label>
                <Input
                  type="date"
                  value={sharedInfo.date_livraison}
                  onChange={(e) => handleSharedInfoChange('date_livraison', e.target.value)}
                  disabled={disabled}
                  className="bg-slate-700 border-slate-600 text-white h-7 text-sm"
                  required={isDateLivraisonRequired}
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}