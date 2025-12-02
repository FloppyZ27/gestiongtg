import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const OBJECTIFS = ["Vente", "Refinancement", "Projet de construction", "Litige"];
const ECHEANCES = ["Dès que possible", "D'ici un mois", "Date précise"];
const URGENCES = ["Pas pressé", "Normal", "Rapide"];

export default function MandatStepForm({ 
  mandats = [],
  onMandatsChange,
  isCollapsed,
  onToggleCollapse
}) {
  // État partagé pour tous les mandats
  const [sharedInfo, setSharedInfo] = useState({
    objectif: "",
    echeance_souhaitee: "",
    date_signature: "",
    date_debut_travaux: "",
    urgence_percue: ""
  });
  
  // Types de mandats sélectionnés
  const [selectedTypes, setSelectedTypes] = useState([]);

  // Initialiser une seule fois au montage
  const initialized = React.useRef(false);
  
  useEffect(() => {
    if (!initialized.current && mandats && mandats.length > 0) {
      initialized.current = true;
      // Extraire les types sélectionnés
      const types = mandats.map(m => m.type_mandat).filter(t => t);
      if (types.length > 0) {
        setSelectedTypes(types);
      }
      
      // Prendre les infos du premier mandat comme référence
      const first = mandats[0];
      if (first && (first.objectif || first.echeance_souhaitee || first.urgence_percue)) {
        setSharedInfo({
          objectif: first.objectif || "",
          echeance_souhaitee: first.echeance_souhaitee || "",
          date_signature: first.date_signature || "",
          date_debut_travaux: first.date_debut_travaux || "",
          urgence_percue: first.urgence_percue || ""
        });
      }
    }
  }, [mandats]);

  const toggleMandatType = (type) => {
    let newSelectedTypes;
    if (selectedTypes.includes(type)) {
      newSelectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      newSelectedTypes = [...selectedTypes, type];
    }
    setSelectedTypes(newSelectedTypes);
    updateMandats(newSelectedTypes, sharedInfo);
  };

  const handleSharedInfoChange = (field, value) => {
    const newInfo = { ...sharedInfo, [field]: value };
    
    // Reset date fields if echeance is not "Date précise"
    if (field === 'echeance_souhaitee' && value !== "Date précise") {
      newInfo.date_signature = "";
      newInfo.date_debut_travaux = "";
    }
    
    setSharedInfo(newInfo);
    updateMandats(selectedTypes, newInfo);
  };

  const updateMandats = React.useCallback((types, info) => {
    if (types.length === 0) {
      onMandatsChange([{
        type_mandat: "",
        ...info,
        prix_estime: 0,
        rabais: 0,
        taxes_incluses: false
      }]);
    } else {
      const newMandats = types.map(type => {
        // Préserver les infos de tarification existantes si le mandat existait déjà
        const existingMandat = mandats.find(m => m.type_mandat === type);
        return {
          type_mandat: type,
          ...info,
          prix_estime: existingMandat?.prix_estime || 0,
          rabais: existingMandat?.rabais || 0,
          taxes_incluses: existingMandat?.taxes_incluses || false
        };
      });
      onMandatsChange(newMandats);
    }
  }, [mandats, onMandatsChange]);

  const getUrgenceColor = (urgence) => {
    switch (urgence) {
      case "Pas pressé": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Normal": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Rapide": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-3 bg-orange-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-sm">3</div>
            <CardTitle className="text-orange-300 text-base">Mandats</CardTitle>
            {selectedTypes.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedTypes.map((type, idx) => (
                  <Badge key={idx} className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            )}
            {sharedInfo.urgence_percue && (
              <Badge className={`${getUrgenceColor(sharedInfo.urgence_percue)} text-xs`}>
                {sharedInfo.urgence_percue}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-4">
          <div className="space-y-3">
            {/* Sélection multiple des types de mandats */}
            <div className="space-y-2">
              <Label className="text-slate-400 text-xs">Types de mandats (sélection multiple)</Label>
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                {TYPES_MANDATS.map((type) => {
                  const isSelected = selectedTypes.includes(type);
                  return (
                    <div
                      key={type}
                      onClick={() => toggleMandatType(type)}
                      className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all text-sm ${
                        isSelected 
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <span className="truncate">{type}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Première ligne: Objectif et Urgence perçue */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Objectif</Label>
                <Select value={sharedInfo.objectif} onValueChange={(value) => handleSharedInfoChange('objectif', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {OBJECTIFS.map((objectif) => (
                      <SelectItem key={objectif} value={objectif} className="text-white">{objectif}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Urgence perçue</Label>
                <Select value={sharedInfo.urgence_percue} onValueChange={(value) => handleSharedInfoChange('urgence_percue', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {URGENCES.map((urgence) => (
                      <SelectItem key={urgence} value={urgence} className="text-white">{urgence}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Échéance souhaitée</Label>
                <Select value={sharedInfo.echeance_souhaitee} onValueChange={(value) => handleSharedInfoChange('echeance_souhaitee', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ECHEANCES.map((echeance) => (
                      <SelectItem key={echeance} value={echeance} className="text-white">{echeance}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates conditionnelles */}
            {sharedInfo.echeance_souhaitee === "Date précise" && (
              <div className="grid grid-cols-3 gap-3">
                <div></div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Date de signature</Label>
                  <Input
                    type="date"
                    value={sharedInfo.date_signature}
                    onChange={(e) => handleSharedInfoChange('date_signature', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Début des travaux</Label>
                  <Input
                    type="date"
                    value={sharedInfo.date_debut_travaux}
                    onChange={(e) => handleSharedInfoChange('date_debut_travaux', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}