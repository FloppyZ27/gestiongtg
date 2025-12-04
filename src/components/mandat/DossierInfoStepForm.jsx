import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FolderOpen } from "lucide-react";

const ARPENTEURS = [
  "Samuel Guay",
  "Dany Gaboury",
  "Pierre-Luc Pilote",
  "Benjamin Larouche",
  "Frédéric Gilbert"
];

const STATUTS = [
  { value: "Nouveau mandat/Demande d'information", label: "Nouveau mandat", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "Mandats à ouvrir", label: "Mandats à ouvrir", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "Mandat non octroyé", label: "Non octroyé", color: "bg-red-500/20 text-red-400 border-red-500/30" }
];

export default function DossierInfoStepForm({
  arpenteurGeometre,
  onArpenteurChange,
  statut,
  onStatutChange,
  numeroDossier,
  onNumeroDossierChange,
  dateOuverture,
  onDateOuvertureChange,
  isCollapsed,
  onToggleCollapse
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/30">
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
            {arpenteurGeometre && (
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                {arpenteurGeometre}
              </Badge>
            )}
            {numeroDossier && (
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                #{numeroDossier}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="space-y-2">
            {/* Ligne 1: Arpenteur et Statut */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Arpenteur-géomètre</Label>
                <Select value={arpenteurGeometre} onValueChange={onArpenteurChange}>
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
                <Label className="text-slate-400 text-xs">Statut du mandat</Label>
                <div className="flex gap-1">
                  {STATUTS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => onStatutChange(s.value)}
                      className={`px-2 py-0.5 rounded text-xs border transition-all ${
                        statut === s.value 
                          ? s.color + " ring-1 ring-offset-1 ring-offset-slate-800" 
                          : "bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ligne 2: N° Dossier et Date d'ouverture */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">N° de dossier</Label>
                <Input
                  value={numeroDossier || ""}
                  onChange={(e) => onNumeroDossierChange(e.target.value)}
                  placeholder="Ex: 12345"
                  className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                />
              </div>
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Date d'ouverture</Label>
                <Input
                  type="date"
                  value={dateOuverture || ""}
                  onChange={(e) => onDateOuvertureChange(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}