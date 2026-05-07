import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Grid3x3 } from "lucide-react";

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
    <div>
      <div 
        className="cursor-pointer flex items-center justify-between px-3 py-1.5 rounded-t-lg bg-blue-900/20 hover:bg-blue-900/40 transition-colors"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
            <Grid3x3 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <span className="text-blue-300 text-base font-semibold">Informations du lot</span>
        </div>
        {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </div>

      {!isCollapsed && (
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-2 gap-2">
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
        </div>
      )}
    </div>
  );
}