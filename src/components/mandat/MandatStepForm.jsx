import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [localMandats, setLocalMandats] = useState(mandats.length > 0 ? mandats : [{
    type_mandat: "",
    objectif: "",
    echeance_souhaitee: "",
    date_signature: "",
    date_debut_travaux: "",
    urgence_percue: ""
  }]);

  useEffect(() => {
    if (mandats && mandats.length > 0) {
      setLocalMandats(mandats);
    }
  }, [mandats]);

  const handleFieldChange = (index, field, value) => {
    const updatedMandats = localMandats.map((m, i) => {
      if (i === index) {
        const updated = { ...m, [field]: value };
        // Reset date fields if echeance is not "Date précise"
        if (field === 'echeance_souhaitee' && value !== "Date précise") {
          updated.date_signature = "";
          updated.date_debut_travaux = "";
        }
        return updated;
      }
      return m;
    });
    setLocalMandats(updatedMandats);
    onMandatsChange(updatedMandats);
  };

  const addMandat = () => {
    const newMandats = [...localMandats, {
      type_mandat: "",
      objectif: "",
      echeance_souhaitee: "",
      date_signature: "",
      date_debut_travaux: "",
      urgence_percue: ""
    }];
    setLocalMandats(newMandats);
    onMandatsChange(newMandats);
  };

  const removeMandat = (index) => {
    if (localMandats.length <= 1) return;
    const newMandats = localMandats.filter((_, i) => i !== index);
    setLocalMandats(newMandats);
    onMandatsChange(newMandats);
  };

  const getUrgenceColor = (urgence) => {
    switch (urgence) {
      case "Pas pressé": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Normal": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Rapide": return "bg-red-500/20 text-red-400 border-red-500/30";
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const selectedMandatsCount = localMandats.filter(m => m.type_mandat).length;

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
            {selectedMandatsCount > 0 && (
              <div className="flex gap-1 flex-wrap">
                {localMandats.filter(m => m.type_mandat).map((m, idx) => (
                  <Badge key={idx} className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                    {m.type_mandat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-4">
          <div className="space-y-4">
            {localMandats.map((mandat, index) => (
              <div key={index} className="p-3 bg-slate-700/20 rounded-lg border border-slate-600/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">Mandat {index + 1}</span>
                  {localMandats.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMandat(index)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {/* Première ligne: Type de mandat, Objectif et Urgence perçue */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Type de mandat</Label>
                    <Select value={mandat.type_mandat} onValueChange={(value) => handleFieldChange(index, 'type_mandat', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {TYPES_MANDATS.map((type) => (
                          <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Objectif</Label>
                    <Select value={mandat.objectif} onValueChange={(value) => handleFieldChange(index, 'objectif', value)}>
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
                    <Select value={mandat.urgence_percue} onValueChange={(value) => handleFieldChange(index, 'urgence_percue', value)}>
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
                </div>

                {/* Deuxième ligne: Échéance souhaitée et dates */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Échéance souhaitée</Label>
                    <Select value={mandat.echeance_souhaitee} onValueChange={(value) => handleFieldChange(index, 'echeance_souhaitee', value)}>
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
                  {mandat.echeance_souhaitee === "Date précise" && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Date de signature</Label>
                        <Input
                          type="date"
                          value={mandat.date_signature}
                          onChange={(e) => handleFieldChange(index, 'date_signature', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Début des travaux</Label>
                        <Input
                          type="date"
                          value={mandat.date_debut_travaux}
                          onChange={(e) => handleFieldChange(index, 'date_debut_travaux', e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMandat}
              className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un autre mandat
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}