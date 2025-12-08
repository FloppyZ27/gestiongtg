import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, DollarSign, Receipt } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function TarificationStepForm({ 
  mandats = [],
  onTarificationChange,
  isCollapsed,
  onToggleCollapse,
  disabled = false
}) {
  const mandatsWithType = mandats.filter(m => m.type_mandat);
  
  // Stocker les valeurs locales pour éviter les problèmes de curseur
  const [localInputs, setLocalInputs] = useState({});
  const debounceTimers = useRef({});

  const getLocalValue = (index, field) => {
    const key = `${index}_${field}`;
    if (localInputs[key] !== undefined) {
      return localInputs[key];
    }
    const mandat = mandats[index];
    const value = mandat?.[field];
    return value > 0 ? String(value) : "";
  };

  const handleInputChange = (index, field, value) => {
    const key = `${index}_${field}`;
    
    // Mettre à jour la valeur locale immédiatement
    setLocalInputs(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Annuler le timer précédent
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    
    // Débounce la mise à jour du parent
    debounceTimers.current[key] = setTimeout(() => {
      const numericValue = value === "" ? 0 : parseFloat(value) || 0;
      // Créer une copie profonde pour éviter les références partagées
      const updatedMandats = mandats.map((m, i) => {
        const copy = JSON.parse(JSON.stringify(m));
        if (i === index) {
          copy[field] = numericValue;
        }
        return copy;
      });
      onTarificationChange(updatedMandats);
      
      // Nettoyer la valeur locale après sync
      setLocalInputs(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }, 300);
  };

  const handleInputBlur = (index, field) => {
    const key = `${index}_${field}`;
    
    // Annuler le timer de débounce et appliquer immédiatement
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    
    const localValue = localInputs[key];
    if (localValue !== undefined) {
      const numericValue = localValue === "" ? 0 : parseFloat(localValue) || 0;
      // Créer une copie profonde pour éviter les références partagées
      const updatedMandats = mandats.map((m, i) => {
        const copy = JSON.parse(JSON.stringify(m));
        if (i === index) {
          copy[field] = numericValue;
        }
        return copy;
      });
      onTarificationChange(updatedMandats);
      
      // Nettoyer la valeur locale
      setLocalInputs(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };
  
  const handleCheckboxChange = (index, field, value) => {
    // Créer une copie profonde pour éviter les références partagées
    const updatedMandats = mandats.map((m, i) => {
      const copy = JSON.parse(JSON.stringify(m));
      if (i === index) {
        copy[field] = value;
      }
      return copy;
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
            {(totalEstime > 0 || totalRabais > 0) && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                Net: {(totalEstime - totalRabais).toFixed(2)} $
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
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getLocalValue(index, 'prix_premier_lot')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              handleInputChange(index, 'prix_premier_lot', val);
                            }}
                            onBlur={() => handleInputBlur(index, 'prix_premier_lot')}
                            placeholder="0.00"
                            disabled={disabled}
                            className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-400 text-xs whitespace-nowrap w-16">Autres ($)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getLocalValue(index, 'prix_autres_lots')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              handleInputChange(index, 'prix_autres_lots', val);
                            }}
                            onBlur={() => handleInputBlur(index, 'prix_autres_lots')}
                            placeholder="0.00"
                            disabled={disabled}
                            className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-slate-400 text-xs whitespace-nowrap w-16">Prix ($)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getLocalValue(index, 'prix_estime')}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              handleInputChange(index, 'prix_estime', val);
                            }}
                            onBlur={() => handleInputBlur(index, 'prix_estime')}
                            placeholder="0.00"
                            disabled={disabled}
                            className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                          />
                        </div>
                        <div></div>
                      </>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-slate-400 text-xs whitespace-nowrap">Rabais ($)</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={getLocalValue(index, 'rabais')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          handleInputChange(index, 'rabais', val);
                        }}
                        onBlur={() => handleInputBlur(index, 'rabais')}
                        placeholder="0.00"
                        disabled={disabled}
                        className="bg-slate-700 border-slate-600 text-white h-7 text-sm w-24"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={mandat.taxes_incluses || false}
                        onCheckedChange={(checked) => handleCheckboxChange(index, 'taxes_incluses', checked)}
                        disabled={disabled}
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