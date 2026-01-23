import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, DollarSign, Receipt, ToggleLeft, ToggleRight } from "lucide-react";


const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

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

  const [globalTaxesIncluses, setGlobalTaxesIncluses] = useState(false);
  const [prixConvenu, setPrixConvenu] = useState(false);
  const [notes, setNotes] = useState("");

  const totalEstime = mandatsWithType.reduce((sum, m) => {
    const isMultiLot = m.type_mandat === "Description Technique" || m.type_mandat === "OCTR";
    const quantite = parseFloat(m.quantite) || 1;
    if (isMultiLot) {
      return sum + ((parseFloat(m.prix_premier_lot) || 0) + (parseFloat(m.prix_autres_lots) || 0)) * quantite;
    }
    return sum + (parseFloat(m.prix_estime) || 0) * quantite;
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
        <CardContent className="p-4">
          {mandatsWithType.length > 0 ? (
            <div className="grid grid-cols-[70%_30%] gap-4">
              {/* Tableau de tarification */}
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800/50 border-b border-slate-700">
                      <th className="text-left text-slate-300 p-2 font-medium">Mandat</th>
                      <th className="text-left text-slate-300 p-2 font-medium">Quantité</th>
                      <th className="text-left text-slate-300 p-2 font-medium">Prix/1er lot</th>
                      <th className="text-left text-slate-300 p-2 font-medium">Autres lots</th>
                      <th className="text-left text-slate-300 p-2 font-medium">Rabais</th>
                      <th className="text-right text-slate-300 p-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mandats.map((mandat, index) => {
                      if (!mandat.type_mandat) return null;
                      const isMultiLotType = mandat.type_mandat === "Description Technique" || mandat.type_mandat === "OCTR";
                      const quantite = parseFloat(mandat.quantite) || 1;
                      const prixBase = isMultiLotType 
                        ? (parseFloat(mandat.prix_premier_lot) || 0) + (parseFloat(mandat.prix_autres_lots) || 0)
                        : (parseFloat(mandat.prix_estime) || 0);
                      const total = prixBase * quantite;
                      
                      return (
                        <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="p-2">
                            <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                              {getAbbreviatedMandatType(mandat.type_mandat)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={getLocalValue(index, 'quantite')}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                handleInputChange(index, 'quantite', val || '1');
                              }}
                              onBlur={() => handleInputBlur(index, 'quantite')}
                              placeholder="1"
                              disabled={disabled}
                              className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-16"
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={getLocalValue(index, isMultiLotType ? 'prix_premier_lot' : 'prix_estime')}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9.]/g, '');
                                handleInputChange(index, isMultiLotType ? 'prix_premier_lot' : 'prix_estime', val);
                              }}
                              onBlur={() => handleInputBlur(index, isMultiLotType ? 'prix_premier_lot' : 'prix_estime')}
                              placeholder="0.00"
                              disabled={disabled}
                              className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20"
                            />
                          </td>
                          <td className="p-2">
                            {isMultiLotType ? (
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
                                className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20"
                              />
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-2">
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
                              className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20"
                            />
                          </td>
                          <td className="p-2 text-right text-white font-semibold">
                            {total.toFixed(2)} $
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800/50 border-t-2 border-slate-600">
                      <td className="p-2 text-slate-400 text-xs font-medium" colSpan="5">Total</td>
                      <td className="p-2 text-right text-purple-400 text-xs font-bold">{(totalEstime - totalRabais).toFixed(2)} $</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Section Options et Notes */}
              <div className="space-y-2">
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardContent className="p-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300 text-xs">Taxes incluses</Label>
                        <button
                          type="button"
                          onClick={() => setGlobalTaxesIncluses(!globalTaxesIncluses)}
                          disabled={disabled}
                          className="transition-colors"
                        >
                          {globalTaxesIncluses ? (
                            <ToggleRight className="w-6 h-6 text-purple-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-500" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-slate-300 text-xs">Prix convenu avec le client</Label>
                        <button
                          type="button"
                          onClick={() => setPrixConvenu(!prixConvenu)}
                          disabled={disabled}
                          className="transition-colors"
                        >
                          {prixConvenu ? (
                            <ToggleRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-700 pt-2">
                      <Label className="text-slate-300 text-xs mb-1 block">Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notes..."
                        disabled={disabled}
                        className="bg-slate-700 border-slate-600 text-white text-xs min-h-[200px] resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
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