import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Grid3x3 } from "lucide-react";

const TYPES_OPERATIONS = [
  "Division du territoire",
  "Subdivision",
  "Remplacement",
  "Rénovation cadastrale",
  "Correction",
  "Annulation"
];

export default function LotInfoStepForm({
  lotForm,
  onLotFormChange,
  availableCadastres,
  onCirconscriptionChange,
  isCollapsed,
  onToggleCollapse,
  disabled,
  CADASTRES_PAR_CIRCONSCRIPTION
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-2 bg-blue-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Grid3x3 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <CardTitle className="text-blue-300 text-base">Informations du lot</CardTitle>
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label className="text-slate-400 text-xs">Circonscription foncière <span className="text-red-400">*</span></Label>
              <Select 
                value={lotForm.circonscription_fonciere} 
                onValueChange={onCirconscriptionChange}
                disabled={disabled}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                    <SelectItem key={circ} value={circ} className="text-white text-xs">
                      {circ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-slate-400 text-xs">Cadastre</Label>
              <Select 
                value={lotForm.cadastre} 
                onValueChange={(value) => onLotFormChange({...lotForm, cadastre: value})}
                disabled={!lotForm.circonscription_fonciere || disabled}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                  <SelectValue placeholder={lotForm.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                  {availableCadastres.map((cadastre) => (
                    <SelectItem key={cadastre} value={cadastre} className="text-white text-xs">
                      {cadastre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-0.5">
              <Label className="text-slate-400 text-xs">Numéro de lot <span className="text-red-400">*</span></Label>
              <Input
                value={lotForm.numero_lot}
                onChange={(e) => onLotFormChange({...lotForm, numero_lot: e.target.value})}
                required
                placeholder="Ex: 1234-5678"
                className="bg-slate-700 border-slate-600 h-6 text-xs"
                disabled={disabled}
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-slate-400 text-xs">Rang</Label>
              <Input
                value={lotForm.rang}
                onChange={(e) => onLotFormChange({...lotForm, rang: e.target.value})}
                placeholder="Ex: Rang 4"
                className="bg-slate-700 border-slate-600 h-6 text-xs"
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-0.5">
              <Label className="text-slate-400 text-xs">Date BPD</Label>
              <Input
                type="date"
                value={lotForm.date_bpd}
                onChange={(e) => onLotFormChange({...lotForm, date_bpd: e.target.value})}
                className="bg-slate-700 border-slate-600 h-6 text-xs"
                disabled={disabled}
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-slate-400 text-xs">Type d'opération</Label>
              <Select 
                value={lotForm.type_operation} 
                onValueChange={(value) => onLotFormChange({...lotForm, type_operation: value})}
                disabled={disabled}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {TYPES_OPERATIONS.map((type) => (
                    <SelectItem key={type} value={type} className="text-white text-xs">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}