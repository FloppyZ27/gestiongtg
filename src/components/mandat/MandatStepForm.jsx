import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const OBJECTIFS = ["Vente", "Refinancement", "Projet de construction", "Litige"];
const ECHEANCES = ["Dès que possible", "D'ici un mois", "Date précise"];
const URGENCES = ["Pas pressé", "Normal", "Rapide"];

export default function MandatStepForm({ 
  mandat,
  onMandatChange,
  isCollapsed,
  onToggleCollapse
}) {
  const [mandatForm, setMandatForm] = useState({
    type_mandat: mandat?.type_mandat || "",
    objectif: mandat?.objectif || "",
    echeance_souhaitee: mandat?.echeance_souhaitee || "",
    date_signature: mandat?.date_signature || "",
    date_debut_travaux: mandat?.date_debut_travaux || "",
    urgence_percue: mandat?.urgence_percue || ""
  });

  useEffect(() => {
    if (mandat) {
      setMandatForm({
        type_mandat: mandat.type_mandat || "",
        objectif: mandat.objectif || "",
        echeance_souhaitee: mandat.echeance_souhaitee || "",
        date_signature: mandat.date_signature || "",
        date_debut_travaux: mandat.date_debut_travaux || "",
        urgence_percue: mandat.urgence_percue || ""
      });
    }
  }, [mandat]);

  const handleFieldChange = (field, value) => {
    const newForm = { ...mandatForm, [field]: value };
    
    // Reset date fields if echeance is not "Date précise"
    if (field === 'echeance_souhaitee' && value !== "Date précise") {
      newForm.date_signature = "";
      newForm.date_debut_travaux = "";
    }
    
    setMandatForm(newForm);
    onMandatChange(newForm);
  };

  const hasMandat = mandatForm.type_mandat;

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
        className="cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t-lg py-3"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">3</div>
            <CardTitle className="text-white text-base">Mandat</CardTitle>
            {hasMandat && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                {mandatForm.type_mandat}
              </Badge>
            )}
            {mandatForm.urgence_percue && (
              <Badge className={`${getUrgenceColor(mandatForm.urgence_percue)} text-xs`}>
                {mandatForm.urgence_percue}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-4">
          <div className="space-y-3">
            {/* Première ligne: Type de mandat et Objectif */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Type de mandat</Label>
                <Select value={mandatForm.type_mandat} onValueChange={(value) => handleFieldChange('type_mandat', value)}>
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
                <Select value={mandatForm.objectif} onValueChange={(value) => handleFieldChange('objectif', value)}>
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
            </div>

            {/* Deuxième ligne: Échéance souhaitée et Urgence perçue */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Échéance souhaitée</Label>
                <Select value={mandatForm.echeance_souhaitee} onValueChange={(value) => handleFieldChange('echeance_souhaitee', value)}>
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
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Urgence perçue</Label>
                <Select value={mandatForm.urgence_percue} onValueChange={(value) => handleFieldChange('urgence_percue', value)}>
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

            {/* Champs de date conditionnels */}
            {mandatForm.echeance_souhaitee === "Date précise" && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Date de signature</Label>
                  <Input
                    type="date"
                    value={mandatForm.date_signature}
                    onChange={(e) => handleFieldChange('date_signature', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Début des travaux</Label>
                  <Input
                    type="date"
                    value={mandatForm.date_debut_travaux}
                    onChange={(e) => handleFieldChange('date_debut_travaux', e.target.value)}
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