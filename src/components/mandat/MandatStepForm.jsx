import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const OBJECTIFS = ["Vente", "Refinancement", "Projet de construction", "Litige"];
const ECHEANCES = ["Dès que possible", "D'ici un mois", "Date précise"];
const URGENCES = ["Pas pressé", "Normal", "Rapide"];

export default function MandatStepForm({ 
  mandats = [],
  onMandatsChange,
  isCollapsed,
  onToggleCollapse,
  statut = "",
  disabled = false
}) {
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
      onMandatsChange([{
        type_mandat: "",
        ...sharedInfo,
        prix_estime: 0,
        prix_premier_lot: 0,
        prix_autres_lots: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: sharedInfo.date_livraison || ""
      }]);
    } else {
      const newMandats = newSelectedTypes.map(t => {
        const existingMandat = mandats.find(m => m.type_mandat === t);
        if (existingMandat) {
          // Créer une copie profonde pour préserver les valeurs uniques
          const copy = JSON.parse(JSON.stringify(existingMandat));
          // Mettre à jour seulement les infos partagées
          copy.echeance_souhaitee = sharedInfo.echeance_souhaitee;
          copy.date_signature = sharedInfo.date_signature;
          copy.date_debut_travaux = sharedInfo.date_debut_travaux;
          copy.date_livraison = sharedInfo.date_livraison;
          copy.urgence_percue = sharedInfo.urgence_percue;
          return copy;
        }
        // Nouveau mandat - initialiser avec des valeurs par défaut
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
    }
  };

  const handleSharedInfoChange = (field, value) => {
    const newInfo = { ...sharedInfo, [field]: value };
    
    // Reset date fields if echeance is not "Date précise"
    if (field === 'echeance_souhaitee' && value !== "Date précise") {
      newInfo.date_signature = "";
      newInfo.date_debut_travaux = "";
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
      case "Pas pressé": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Normal": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Rapide": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/30">
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
        <CardContent className="pt-1 pb-2">
          <div className="space-y-3">
            {/* Première ligne: Types de mandats, Échéance souhaitée et Urgence perçue */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Types de mandats</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={disabled}
                      className="w-full justify-between bg-slate-700 border-slate-600 text-white hover:bg-slate-600 h-7 text-sm px-3"
                    >
                      {selectedTypes.length > 0 ? (
                        <span className="text-white truncate">{selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''} sélectionné{selectedTypes.length > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-slate-400">Sélectionner...</span>
                      )}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 bg-slate-800 border-slate-700" side="top" align="start">
                    <div className="max-h-[200px] overflow-y-auto p-2 space-y-1">
                      {TYPES_MANDATS.map((type) => {
                        const isSelected = selectedTypes.includes(type);
                        return (
                          <div
                            key={type}
                            onClick={() => toggleMandatType(type)}
                            className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all text-sm ${
                              isSelected 
                                ? 'bg-orange-500/20 text-orange-400' 
                                : 'text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="border-slate-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <span>{type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                <Label className="text-slate-400 text-xs">Urgence perçue</Label>
                <Select value={sharedInfo.urgence_percue} onValueChange={(value) => handleSharedInfoChange('urgence_percue', value)} disabled={disabled}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {URGENCES.map((urgence) => (
                      <SelectItem key={urgence} value={urgence} className="text-white">{urgence}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Deuxième ligne: Dates sur la même ligne */}
            <div className="grid grid-cols-3 gap-3">
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