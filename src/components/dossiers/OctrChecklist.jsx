import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";

const OCTR_ITEMS = [
  "Calcul",
  "Vérification consentement",
  "Consentement demandé (si requis)",
  "Consentement reçu (si requis)",
  "Contrat vide demandé (si requis)",
  "Contrat vide reçu (si requis)",
  "Plan préparé",
  "ASP_convoqué",
  "ASP_signé",
  "Demande de permis envoyée",
  "Permis reçu",
  "Rapport correction fait (si requis)",
  "1re transmission Québec",
  "Retour Québec",
  "2e transmission Québec",
  "Dépôt",
  "Client avisé",
];

export default function OctrChecklist({ formData, setFormData, isCollapsed, onToggleCollapse }) {
  // Trouver le mandat OCTR
  const octrMandatIndex = formData.mandats?.findIndex(m => m.type_mandat === "OCTR");
  const octrMandat = octrMandatIndex !== -1 ? formData.mandats?.[octrMandatIndex] : null;

  if (!octrMandat) return null;

  const checklist = octrMandat.octr_checklist || {};

  const toggleItem = (item) => {
    const updatedMandats = [...formData.mandats];
    updatedMandats[octrMandatIndex] = {
      ...updatedMandats[octrMandatIndex],
      octr_checklist: {
        ...checklist,
        [item]: !checklist[item]
      }
    };
    setFormData(prev => ({ ...prev, mandats: updatedMandats }));
  };

  const completedCount = OCTR_ITEMS.filter(item => checklist[item]).length;

  return (
    <Card className="border-0 bg-transparent mt-3" data-section="octr">
      <CardHeader
        className="cursor-pointer hover:bg-pink-900/40 transition-colors rounded-t-lg py-1.5 bg-pink-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500/30 flex items-center justify-center">
              <ClipboardCheck className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <CardTitle className="text-pink-300 text-base">OCTR</CardTitle>
            <span className="text-xs text-slate-400">{completedCount}/{OCTR_ITEMS.length} complétés</span>
            {completedCount > 0 && (
              <div className="h-1.5 w-24 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / OCTR_ITEMS.length) * 100}%` }}
                />
              </div>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-3 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {OCTR_ITEMS.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-slate-700/30"
                onClick={() => toggleItem(item)}
              >
                <Checkbox
                  checked={!!checklist[item]}
                  onCheckedChange={() => toggleItem(item)}
                  className="border-slate-500 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                />
                <Label
                  className={`text-sm cursor-pointer select-none transition-colors ${
                    checklist[item] ? "line-through text-slate-500" : "text-slate-200"
                  }`}
                >
                  {item}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}