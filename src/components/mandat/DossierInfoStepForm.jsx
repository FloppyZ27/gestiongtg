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
  { value: "Mandats à ouvrir", label: "À ouvrir", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
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
        className="cursor-pointer hover:bg-slate-700/40 transition-colors rounded-t-lg py-1.5 bg-slate-700/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-500/30 flex items-center justify-center">
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <CardTitle className="text-slate-300 text-base">Informations du dossier</CardTitle>
            {arpenteurGeometre && (
              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                {arpenteurGeometre}
              </Badge>
            )}
            {numeroDossier && (
              <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">
                #{numeroDossier}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-3">
          <div className="grid grid-cols-[1fr_auto_1fr_1fr] gap-4 items-end">
            {/* Arpenteur-géomètre */}
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Arpenteur-géomètre <span className="text-red-400">*</span></Label>
              <Select value={arpenteurGeometre} onValueChange={onArpenteurChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ARPENTEURS.map((arp) => (
                    <SelectItem key={arp} value={arp} className="text-white text-sm">
                      {arp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Boutons de statut */}
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Statut</Label>
              <div className="flex gap-1">
                {STATUTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => onStatutChange(s.value)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                      statut === s.value
                        ? s.color
                        : "bg-slate-700/50 text-slate-500 border-slate-600 hover:bg-slate-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Numéro de dossier */}
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">N° de dossier</Label>
              <Input
                value={numeroDossier}
                onChange={(e) => onNumeroDossierChange(e.target.value)}
                placeholder="Ex: 12345"
                className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
              />
            </div>

            {/* Date d'ouverture */}
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Date d'ouverture</Label>
              <Input
                type="date"
                value={dateOuverture}
                onChange={(e) => onDateOuvertureChange(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}