import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FolderOpen, AlertCircle } from "lucide-react";

const PLACE_AFFAIRE_DEFAULT = {
  "Samuel Guay": "Alma",
  "Dany Gaboury": "Saguenay",
  "Pierre-Luc Pilote": "Alma",
  "Benjamin Larouche": "Alma",
  "Frédéric Gilbert": "Alma"
};

const ARPENTEURS = [
  "Samuel Guay",
  "Dany Gaboury",
  "Pierre-Luc Pilote",
  "Benjamin Larouche",
  "Frédéric Gilbert"
];

const STATUTS = [
  { value: "Nouveau mandat/Demande d'information", label: "Nouveau mandat", color: "cyan", activeStyle: { background: 'rgba(6,182,212,0.25)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.5)', boxShadow: '0 0 10px rgba(6,182,212,0.3)' } },
  { value: "Mandats à ouvrir", label: "Mandats à ouvrir", color: "purple", activeStyle: { background: 'rgba(168,85,247,0.25)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.5)', boxShadow: '0 0 10px rgba(168,85,247,0.3)' } },
  { value: "Mandat non octroyé", label: "Non octroyé", color: "red", activeStyle: { background: 'rgba(239,68,68,0.25)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.5)', boxShadow: '0 0 10px rgba(239,68,68,0.3)' } }
];

export default function DossierInfoStepForm({
  arpenteurGeometre,
  onArpenteurChange,
  onArpenteurAndPlaceChange,
  statut,
  onStatutChange,
  numeroDossier,
  onNumeroDossierChange,
  dateOuverture,
  onDateOuvertureChange,
  placeAffaire,
  onPlaceAffaireChange,
  isCollapsed,
  onToggleCollapse,
  disabled = false,
  numeroDossierError = null
}) {
  return (
    <Card className="border-0 bg-slate-800/30" style={{border: 'none', boxShadow: 'none'}}>
      <CardHeader 
        className="cursor-pointer hover:bg-teal-900/40 transition-colors rounded-t-lg py-1.5 bg-teal-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center">
                <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <CardTitle className="text-teal-300 text-base">Informations du dossier</CardTitle>
            </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="space-y-[3px]">
            {/* Ligne 1: Arpenteur-géomètre, Place d'affaire et Statut */}
            <div className="grid grid-cols-3 gap-1">

              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Arpenteur-géomètre</Label>
                <Select value={arpenteurGeometre} onValueChange={(val) => { const p=PLACE_AFFAIRE_DEFAULT[val]||""; if(onArpenteurAndPlaceChange){onArpenteurAndPlaceChange(val,p);}else{onArpenteurChange(val);onPlaceAffaireChange(p);} }} disabled={disabled}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-sm">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {ARPENTEURS.map((arpenteur) => (
                      <SelectItem key={arpenteur} value={arpenteur} className="text-white text-sm">
                        {arpenteur}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Place d'affaire</Label>
                <Select value={placeAffaire || ""} onValueChange={(value) => onPlaceAffaireChange(value)} disabled={disabled}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-sm">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Alma" className="text-white text-sm">Alma</SelectItem>
                    <SelectItem value="Saguenay" className="text-white text-sm">Saguenay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Statut du mandat</Label>
                <div className="flex gap-0.5 overflow-x-auto">
                  {STATUTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      data-custom-hover
                      onClick={() => arpenteurGeometre && !disabled && onStatutChange(s.value)}
                      disabled={!arpenteurGeometre || disabled}
                      data-active={statut === s.value ? 'true' : undefined}
                      data-statut-color={statut === s.value ? s.color : undefined}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: !arpenteurGeometre || disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: !arpenteurGeometre || disabled ? 0.4 : 1,
                        fontWeight: statut === s.value ? 600 : 400,
                        ...(statut === s.value ? s.activeStyle : { background: 'transparent', border: '1px solid transparent', color: '#94a3b8' })
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ligne 2: N° de dossier */}
            {statut === "Mandats à ouvrir" && <div className="grid grid-cols-3 gap-1 mt-0">
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">N° de dossier</Label>
                <div className="relative">
                  <Input
                    value={numeroDossier || ""}
                    onChange={(e) => onNumeroDossierChange && onNumeroDossierChange(e.target.value)}
                    placeholder={statut === "Mandats à ouvrir" ? "Auto-généré" : "—"}
                    disabled={disabled}
                    className={`bg-slate-700 border-slate-600 text-white h-6 text-sm ${numeroDossierError ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {numeroDossierError && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span className="text-[10px] text-red-400">{numeroDossierError}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>}

          </div>
        </CardContent>
      )}
    </Card>
  );
}