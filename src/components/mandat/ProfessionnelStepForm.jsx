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

  // Filtrer les listes basées sur les champs de saisie
  const filteredNotaires = useMemo(() => {
    const search = (professionnelInfo.notaire || "").toLowerCase();
    if (!search) return notaires.slice(0, 15);
    return notaires.filter(n => 
      `${n.prenom} ${n.nom}`.toLowerCase().includes(search) ||
      n.courriels?.some(c => c.courriel?.toLowerCase().includes(search)) ||
      n.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [notaires, professionnelInfo.notaire]);

  const filteredCourtiers = useMemo(() => {
    const search = (professionnelInfo.courtier || "").toLowerCase();
    if (!search) return courtiers.slice(0, 15);
    return courtiers.filter(c => 
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search) ||
      c.courriels?.some(co => co.courriel?.toLowerCase().includes(search)) ||
      c.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [courtiers, professionnelInfo.courtier]);

  const filteredCompagnies = useMemo(() => {
    const search = (professionnelInfo.compagnie || "").toLowerCase();
    if (!search) return compagnies.slice(0, 15);
    return compagnies.filter(c => 
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search) ||
      c.courriels?.some(co => co.courriel?.toLowerCase().includes(search)) ||
      c.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [compagnies, professionnelInfo.compagnie]);

  const getClientById = (list, id) => list.find(c => c.id === id);

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const hasSelections = selectedNotaireIds.length > 0 || selectedCourtierIds.length > 0 || selectedCompagnieIds.length > 0;

  // Déterminer quelle liste afficher
  const getActiveList = () => {
    if (activeField === "notaire") {
      return { list: filteredNotaires, type: "notaire", color: "purple", selectedIds: selectedNotaireIds, onSelect: onSelectNotaire };
    }
    if (activeField === "courtier") {
      return { list: filteredCourtiers, type: "courtier", color: "orange", selectedIds: selectedCourtierIds, onSelect: onSelectCourtier };
    }
    if (activeField === "compagnie") {
      return { list: filteredCompagnies, type: "compagnie", color: "cyan", selectedIds: selectedCompagnieIds, onSelect: onSelectCompagnie };
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
                {selectedNotaireIds.length > 0 && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                    {selectedNotaireIds.length} notaire{selectedNotaireIds.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {selectedCourtierIds.length > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                    {selectedCourtierIds.length} courtier{selectedCourtierIds.length > 1 ? 's' : ''}
                  </Badge>
                )}
                {selectedCompagnieIds.length > 0 && (
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                    {selectedCompagnieIds.length} compagnie{selectedCompagnieIds.length > 1 ? 's' : ''}
                  </Badge>
                )}
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
                  value={professionnelInfo.notaire || ""}
                  onChange={(e) => onProfessionnelInfoChange({ ...professionnelInfo, notaire: e.target.value })}
                  onFocus={() => !disabled && setActiveField("notaire")}
                  placeholder="Nom du notaire..."
                  disabled={disabled}
                  className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${activeField === "notaire" && !disabled ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                />
                {selectedNotaireIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {selectedNotaireIds.map(id => {
                      const notaire = getClientById(notaires, id);
                      return notaire ? (
                        <Badge key={id} className="bg-purple-500/20 text-purple-400 border-purple-500/30 pr-1 text-xs py-0">
                          {notaire.prenom} {notaire.nom}
                          <button type="button" onClick={() => onSelectNotaire(id)} className="ml-1 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Courtier */}
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Courtier immobilier</Label>
                <Input
                  value={professionnelInfo.courtier || ""}
                  onChange={(e) => onProfessionnelInfoChange({ ...professionnelInfo, courtier: e.target.value })}
                  onFocus={() => !disabled && setActiveField("courtier")}
                  placeholder="Nom du courtier immobilier..."
                  disabled={disabled}
                  className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${activeField === "courtier" && !disabled ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                />
                {selectedCourtierIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {selectedCourtierIds.map(id => {
                      const courtier = getClientById(courtiers, id);
                      return courtier ? (
                        <Badge key={id} className="bg-orange-500/20 text-orange-400 border-orange-500/30 pr-1 text-xs py-0">
                          {courtier.prenom} {courtier.nom}
                          <button type="button" onClick={() => onSelectCourtier(id)} className="ml-1 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Compagnie */}
              <div className="space-y-0.5">
                <Label className="text-slate-400 text-xs">Compagnie</Label>
                <Input
                  value={professionnelInfo.compagnie || ""}
                  onChange={(e) => onProfessionnelInfoChange({ ...professionnelInfo, compagnie: e.target.value })}
                  onFocus={() => !disabled && setActiveField("compagnie")}
                  placeholder="Nom de la compagnie..."
                  disabled={disabled}
                  className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${activeField === "compagnie" && !disabled ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                />
                {selectedCompagnieIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {selectedCompagnieIds.map(id => {
                      const compagnie = getClientById(compagnies, id);
                      return compagnie ? (
                        <Badge key={id} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 pr-1 text-xs py-0">
                          {compagnie.prenom} {compagnie.nom}
                          <button type="button" onClick={() => onSelectCompagnie(id)} className="ml-1 hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
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
                            onClick={() => !disabled && activeListData.onSelect(item.id)}
                            className={`px-2 py-1 rounded text-xs transition-all ${
                              disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                            } ${isSelected ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}
                          >
                            <p className="font-medium">{item.prenom} {item.nom}</p>
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