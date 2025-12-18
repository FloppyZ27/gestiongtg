import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Briefcase, X } from "lucide-react";

const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export default function ProfessionnelStepForm({
  notaires = [],
  courtiers = [],
  compagnies = [],
  selectedNotaireIds = [],
  selectedCourtierIds = [],
  selectedCompagnieIds = [],
  onSelectNotaire,
  onSelectCourtier,
  onSelectCompagnie,
  professionnelInfo = {},
  onProfessionnelInfoChange,
  isCollapsed,
  onToggleCollapse,
  disabled = false
}) {
  const [activeField, setActiveField] = useState(null); // "notaire", "courtier", "compagnie"
  const [localInfo, setLocalInfo] = useState({
    notaire: professionnelInfo.notaire || "",
    courtier: professionnelInfo.courtier || "",
    compagnie: professionnelInfo.compagnie || ""
  });

  // Synchroniser avec les props
  React.useEffect(() => {
    setLocalInfo({
      notaire: professionnelInfo.notaire || "",
      courtier: professionnelInfo.courtier || "",
      compagnie: professionnelInfo.compagnie || ""
    });
  }, [professionnelInfo]);

  // Filtrer les listes basées sur les champs de saisie
  const filteredNotaires = useMemo(() => {
    const search = (localInfo.notaire || "").toLowerCase();
    if (!search) return notaires.slice(0, 15);
    return notaires.filter(n => 
      `${n.prenom} ${n.nom}`.toLowerCase().includes(search) ||
      n.courriels?.some(c => c.courriel?.toLowerCase().includes(search)) ||
      n.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [notaires, localInfo.notaire]);

  const filteredCourtiers = useMemo(() => {
    const search = (localInfo.courtier || "").toLowerCase();
    if (!search) return courtiers.slice(0, 15);
    return courtiers.filter(c => 
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search) ||
      c.courriels?.some(co => co.courriel?.toLowerCase().includes(search)) ||
      c.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [courtiers, localInfo.courtier]);

  const filteredCompagnies = useMemo(() => {
    const search = (localInfo.compagnie || "").toLowerCase();
    if (!search) return compagnies.slice(0, 15);
    return compagnies.filter(c => 
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search) ||
      c.courriels?.some(co => co.courriel?.toLowerCase().includes(search)) ||
      c.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [compagnies, localInfo.compagnie]);

  const getClientById = (list, id) => list.find(c => c.id === id);

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const hasSelections = selectedNotaireIds.length > 0 || selectedCourtierIds.length > 0 || selectedCompagnieIds.length > 0;

  // Déterminer quelle liste afficher
  const handleInputChange = (field, value) => {
    const newInfo = { ...localInfo, [field]: value };
    setLocalInfo(newInfo);
    onProfessionnelInfoChange(newInfo);
    
    // Si le champ est vidé, désélectionner tous les professionnels de cette catégorie
    if (!value || value.trim() === "") {
      if (field === "notaire" && selectedNotaireIds.length > 0) {
        selectedNotaireIds.forEach(id => onSelectNotaire(id));
      } else if (field === "courtier" && selectedCourtierIds.length > 0) {
        selectedCourtierIds.forEach(id => onSelectCourtier(id));
      } else if (field === "compagnie" && selectedCompagnieIds.length > 0) {
        selectedCompagnieIds.forEach(id => onSelectCompagnie(id));
      }
    }
  };

  const handleSelectProfessionnel = (item, type) => {
    // Vérifier si déjà sélectionné pour désélectionner
    const isAlreadySelected = 
      (type === "notaire" && selectedNotaireIds.includes(item.id)) ||
      (type === "courtier" && selectedCourtierIds.includes(item.id)) ||
      (type === "compagnie" && selectedCompagnieIds.includes(item.id));
    
    if (isAlreadySelected) {
      // Désélectionner et vider le champ
      const newInfo = { ...localInfo, [type]: "" };
      setLocalInfo(newInfo);
      onProfessionnelInfoChange(newInfo);
      
      // Désélectionner le professionnel
      if (type === "notaire") {
        onSelectNotaire(item.id);
      } else if (type === "courtier") {
        onSelectCourtier(item.id);
      } else if (type === "compagnie") {
        onSelectCompagnie(item.id);
      }
    } else {
      // Désélectionner tous les autres professionnels de la même catégorie d'abord
      if (type === "notaire" && selectedNotaireIds.length > 0) {
        selectedNotaireIds.forEach(id => onSelectNotaire(id));
      } else if (type === "courtier" && selectedCourtierIds.length > 0) {
        selectedCourtierIds.forEach(id => onSelectCourtier(id));
      } else if (type === "compagnie" && selectedCompagnieIds.length > 0) {
        selectedCompagnieIds.forEach(id => onSelectCompagnie(id));
      }
      
      // Auto-remplir tous les champs avec les informations du professionnel
      const fullName = `${item.prenom} ${item.nom}`;
      const currentPhone = getCurrentValue(item.telephones, 'telephone');
      const currentEmail = getCurrentValue(item.courriels, 'courriel');
      
      // Créer un objet d'info enrichi
      const enrichedInfo = {
        ...localInfo,
        [type]: fullName,
        [`${type}_prenom`]: item.prenom || "",
        [`${type}_nom`]: item.nom || "",
        [`${type}_telephone`]: currentPhone || "",
        [`${type}_courriel`]: currentEmail || ""
      };
      
      setLocalInfo(enrichedInfo);
      onProfessionnelInfoChange(enrichedInfo);
      
      // Sélectionner le nouveau professionnel
      if (type === "notaire") {
        onSelectNotaire(item.id);
      } else if (type === "courtier") {
        onSelectCourtier(item.id);
      } else if (type === "compagnie") {
        onSelectCompagnie(item.id);
      }
    }
  };

  const getActiveList = () => {
    if (activeField === "notaire") {
      return { list: filteredNotaires, type: "notaire", color: "blue", selectedIds: selectedNotaireIds, onSelect: handleSelectProfessionnel };
    }
    if (activeField === "courtier") {
      return { list: filteredCourtiers, type: "courtier", color: "blue", selectedIds: selectedCourtierIds, onSelect: handleSelectProfessionnel };
    }
    if (activeField === "compagnie") {
      return { list: filteredCompagnies, type: "compagnie", color: "blue", selectedIds: selectedCompagnieIds, onSelect: handleSelectProfessionnel };
    }
    return null;
  };

  const activeListData = getActiveList();

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-pink-900/40 transition-colors rounded-t-lg py-1.5 bg-pink-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-pink-500/30 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <CardTitle className="text-pink-300 text-base">Professionnel</CardTitle>
            {hasSelections && (
              <div className="flex gap-1">
                {selectedNotaireIds.map(notaireId => {
                  const notaire = notaires.find(n => n.id === notaireId);
                  return notaire ? (
                    <Badge 
                      key={notaireId}
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs cursor-pointer hover:bg-blue-500/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.openClientForEdit) {
                          window.openClientForEdit(notaire);
                        }
                      }}
                    >
                      {notaire.prenom} {notaire.nom}
                    </Badge>
                  ) : null;
                })}
                {selectedCourtierIds.map(courtierId => {
                  const courtier = courtiers.find(c => c.id === courtierId);
                  return courtier ? (
                    <Badge 
                      key={courtierId}
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs cursor-pointer hover:bg-blue-500/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.openClientForEdit) {
                          window.openClientForEdit(courtier);
                        }
                      }}
                    >
                      {courtier.prenom} {courtier.nom}
                    </Badge>
                  ) : null;
                })}
                {selectedCompagnieIds.map(compagnieId => {
                  const compagnie = compagnies.find(c => c.id === compagnieId);
                  return compagnie ? (
                    <Badge 
                      key={compagnieId}
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs cursor-pointer hover:bg-blue-500/30 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.openClientForEdit) {
                          window.openClientForEdit(compagnie);
                        }
                      }}
                    >
                      {compagnie.prenom} {compagnie.nom}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-[70%_30%] gap-3">
            {/* Colonne gauche - Champs de saisie sur une ligne */}
            <div className="grid grid-cols-3 gap-3">
              {/* Notaire */}
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Notaire</Label>
                <Input
                  value={localInfo.notaire}
                  onChange={(e) => handleInputChange("notaire", e.target.value)}
                  onFocus={() => !disabled && setActiveField("notaire")}
                  placeholder="Nom du notaire..."
                  disabled={disabled}
                  className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${activeField === "notaire" && !disabled ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                />
              </div>

              {/* Courtier */}
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Courtier immobilier</Label>
                <Input
                  value={localInfo.courtier}
                  onChange={(e) => handleInputChange("courtier", e.target.value)}
                  onFocus={() => !disabled && setActiveField("courtier")}
                  placeholder="Nom du courtier immobilier..."
                  disabled={disabled}
                  className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${activeField === "courtier" && !disabled ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                />
              </div>

              {/* Compagnie */}
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Compagnie</Label>
                <Input
                  value={localInfo.compagnie}
                  onChange={(e) => handleInputChange("compagnie", e.target.value)}
                  onFocus={() => !disabled && setActiveField("compagnie")}
                  placeholder="Nom de la compagnie..."
                  disabled={disabled}
                  className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${activeField === "compagnie" && !disabled ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                />
              </div>
            </div>

            {/* Colonne droite - Liste associative (30%) */}
            <div className="border-l border-slate-700 pl-3">
              {activeListData ? (
                <>
                  <Label className="text-slate-400 text-xs mb-1 block">
                    {activeListData.type === "notaire" 
                      ? `Notaire existant${activeListData.list.length > 1 ? 's' : ''} (${activeListData.list.length})` 
                      : activeListData.type === "courtier" 
                      ? `Courtier existant${activeListData.list.length > 1 ? 's' : ''} (${activeListData.list.length})` 
                      : `Compagnie existante${activeListData.list.length > 1 ? 's' : ''} (${activeListData.list.length})`}
                  </Label>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {activeListData.list.length > 0 ? (
                      activeListData.list.map(item => {
                        const isSelected = activeListData.selectedIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => !disabled && activeListData.onSelect(item, activeListData.type)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            } ${isSelected ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}
                          >
                            <p className="font-medium">{item.prenom} {item.nom}</p>
                            {getCurrentValue(item.telephones, 'telephone') && (
                              <p className="mt-0.5">
                                📞 <a 
                                  href={`3cx://call/${getCurrentValue(item.telephones, 'telephone').replace(/\D/g, '')}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                >
                                  {getCurrentValue(item.telephones, 'telephone')}
                                </span>
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-xs text-center py-2">Aucun résultat</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-24 text-slate-500 text-xs">
                  Cliquez sur un champ pour afficher la liste
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}