import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, DollarSign, Receipt } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// Composant d'input contrôlé pour les prix
function PriceInput({ value, onChange, placeholder = "0.00", className }) {
  const [localValue, setLocalValue] = useState(value > 0 ? String(value) : "");
  
  // Synchroniser avec la valeur externe seulement si elle change significativement
  useEffect(() => {
    const numericLocal = localValue === "" ? 0 : parseFloat(localValue) || 0;
    if (value !== numericLocal) {
      setLocalValue(value > 0 ? String(value) : "");
    }
  }, [value]);
  
  const handleChange = (e) => {
    const newValue = e.target.value;
    // Permettre seulement les chiffres et un point décimal
    if (newValue === "" || /^\d*\.?\d*$/.test(newValue)) {
      setLocalValue(newValue);
      const numericValue = newValue === "" ? 0 : parseFloat(newValue) || 0;
      onChange(numericValue);
    }
  };
  
  return (
    <Input
      type="text"
      inputMode="decimal"
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function TarificationStepForm({ 
  mandats = [],
  onTarificationChange,
  isCollapsed,
  onToggleCollapse
}) {
  const mandatsWithType = mandats.filter(m => m.type_mandat);

  const handleFieldChange = (index, field, numericValue) => {
    // Créer une copie profonde pour éviter les mutations
    const updatedMandats = mandats.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: numericValue };
      }
      return { ...m };
    });
    onTarificationChange(updatedMandats);
  };
  
  const handleCheckboxChange = (index, field, value) => {
    const updatedMandats = mandats.map((m, i) => {
      if (i === index) {
        return { ...m, [field]: value };
      }
      return { ...m };
    });
    onTarificationChange(updatedMandats);
  };

  const totalEstime = mandatsWithType.reduce((sum, m) => {
    const isMultiLot = m.type_mandat === "Description Technique" || m.type_mandat === "OCTR";
    if (isMultiLot) {
      return sum + (parseFloat(m.prix_premier_lot) || 0) + (parseFloat(m.prix_autres_lots) || 0);
    }
    return sum + (parseFloat(m.prix_estime) || 0);
  }, 0);
  const totalRabais = mandatsWithType.reduce((sum, m) => sum + (parseFloat(m.rabais) || 0), 0);

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
                    className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-1.5 bg-purple-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
                <Receipt className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <CardTitle className="text-purple-300 text-base">Tarification</CardTitle>
            {totalEstime > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                Total: {totalEstime.toFixed(2)} $
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          {mandatsWithType.length > 0 ? (
            <div className="space-y-2">
              {mandats.map((mandat, index) => {
                if (!mandat.type_mandat) return null;
                const isMultiLotType = mandat.type_mandat === "Description Technique" || mandat.type_mandat === "OCTR";
                return (
                  <div key={index} className="grid grid-cols-[180px_1fr_1fr_1fr_140px] items-center gap-4 py-2">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 justify-center">
                      {mandat.type_mandat}
                    </Badge>
                    
                    {isMultiLotType ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-400 text-xs whitespace-nowrap w-16">1er lot ($)</Label>
                          <PriceInput
                            value={mandat.prix_premier_lot || 0}
                            onChange={(val) => handleFieldChange(index, 'prix_premier_lot', val)}
                            className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-400 text-xs whitespace-nowrap w-16">Autres ($)</Label>
                          <PriceInput
                            value={mandat.prix_autres_lots || 0}
                            onChange={(val) => handleFieldChange(index, 'prix_autres_lots', val)}
                            className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-400 text-xs whitespace-nowrap w-16">Prix ($)</Label>
                          <PriceInput
                            value={mandat.prix_estime || 0}
                            onChange={(val) => handleFieldChange(index, 'prix_estime', val)}
                            className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                          />
                        </div>
                        <div></div>
                      </>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-400 text-xs whitespace-nowrap">Rabais ($)</Label>
                      <PriceInput
                        value={mandat.rabais || 0}
                        onChange={(val) => handleFieldChange(index, 'rabais', val)}
                        className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={mandat.taxes_incluses || false}
                        onCheckedChange={(checked) => handleCheckboxChange(index, 'taxes_incluses', checked)}
                        className="border-slate-500 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label className="text-slate-400 text-xs whitespace-nowrap">Taxes incluses</Label>
                    </div>
                  </div>
                );
              })}
              
              {/* Résumé */}
              <div className="pt-2 border-t border-slate-700 flex justify-end gap-6">
                <div className="text-sm">
                  <span className="text-slate-400">Total estimé: </span>
                  <span className="text-white font-semibold">{totalEstime.toFixed(2)} $</span>
                </div>
                {totalRabais > 0 && (
                  <div className="text-sm">
                    <span className="text-slate-400">Total rabais: </span>
                    <span className="text-red-400 font-semibold">-{totalRabais.toFixed(2)} $</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-slate-400">Net: </span>
                  <span className="text-purple-400 font-bold">{(totalEstime - totalRabais).toFixed(2)} $</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sélectionnez des mandats dans la section précédente</p>
              <p className="text-xs text-slate-500 mt-1">pour définir leur tarification</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}