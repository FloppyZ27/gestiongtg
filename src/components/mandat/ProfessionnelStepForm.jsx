import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Briefcase, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  onToggleCollapse
}) {
  const [activeTab, setActiveTab] = useState("notaire");

  // Filtrer les listes basées sur les champs de saisie
  const filteredNotaires = useMemo(() => {
    const search = (professionnelInfo.notaire || "").toLowerCase();
    if (!search) return notaires.slice(0, 10);
    return notaires.filter(n => 
      `${n.prenom} ${n.nom}`.toLowerCase().includes(search) ||
      n.courriels?.some(c => c.courriel?.toLowerCase().includes(search)) ||
      n.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [notaires, professionnelInfo.notaire]);

  const filteredCourtiers = useMemo(() => {
    const search = (professionnelInfo.courtier || "").toLowerCase();
    if (!search) return courtiers.slice(0, 10);
    return courtiers.filter(c => 
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search) ||
      c.courriels?.some(co => co.courriel?.toLowerCase().includes(search)) ||
      c.telephones?.some(t => t.telephone?.includes(search))
    );
  }, [courtiers, professionnelInfo.courtier]);

  const filteredCompagnies = useMemo(() => {
    const search = (professionnelInfo.compagnie || "").toLowerCase();
    if (!search) return compagnies.slice(0, 10);
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

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-indigo-900/40 transition-colors rounded-t-lg py-1.5 bg-indigo-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <CardTitle className="text-indigo-300 text-base">Professionnel</CardTitle>
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
        <CardContent className="pt-2 pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 h-8">
              <TabsTrigger value="notaire" className="text-xs data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-400">
                Notaire
              </TabsTrigger>
              <TabsTrigger value="courtier" className="text-xs data-[state=active]:bg-orange-500/30 data-[state=active]:text-orange-400">
                Courtier
              </TabsTrigger>
              <TabsTrigger value="compagnie" className="text-xs data-[state=active]:bg-cyan-500/30 data-[state=active]:text-cyan-400">
                Compagnie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notaire" className="mt-2">
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                {/* Champ de saisie */}
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Rechercher un notaire</Label>
                  <Input
                    value={professionnelInfo.notaire || ""}
                    onChange={(e) => onProfessionnelInfoChange({ ...professionnelInfo, notaire: e.target.value })}
                    placeholder="Nom du notaire..."
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                  />
                  {/* Notaires sélectionnés */}
                  {selectedNotaireIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedNotaireIds.map(id => {
                        const notaire = getClientById(notaires, id);
                        return notaire ? (
                          <Badge key={id} className="bg-purple-500/20 text-purple-400 border-purple-500/30 pr-1">
                            {notaire.prenom} {notaire.nom}
                            <button
                              type="button"
                              onClick={() => onSelectNotaire(id)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                {/* Liste des notaires */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filteredNotaires.length > 0 ? (
                    filteredNotaires.map(notaire => {
                      const isSelected = selectedNotaireIds.includes(notaire.id);
                      return (
                        <div
                          key={notaire.id}
                          onClick={() => onSelectNotaire(notaire.id)}
                          className={`p-2 rounded cursor-pointer text-xs transition-all ${
                            isSelected 
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <p className="font-medium">{notaire.prenom} {notaire.nom}</p>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {getCurrentValue(notaire.telephones, 'telephone') && (
                              <span>{formatPhoneNumber(getCurrentValue(notaire.telephones, 'telephone'))}</span>
                            )}
                            {getCurrentValue(notaire.courriels, 'courriel') && (
                              <span className="ml-2">{getCurrentValue(notaire.courriels, 'courriel')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-4">Aucun notaire trouvé</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="courtier" className="mt-2">
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                {/* Champ de saisie */}
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Rechercher un courtier</Label>
                  <Input
                    value={professionnelInfo.courtier || ""}
                    onChange={(e) => onProfessionnelInfoChange({ ...professionnelInfo, courtier: e.target.value })}
                    placeholder="Nom du courtier..."
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                  />
                  {/* Courtiers sélectionnés */}
                  {selectedCourtierIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCourtierIds.map(id => {
                        const courtier = getClientById(courtiers, id);
                        return courtier ? (
                          <Badge key={id} className="bg-orange-500/20 text-orange-400 border-orange-500/30 pr-1">
                            {courtier.prenom} {courtier.nom}
                            <button
                              type="button"
                              onClick={() => onSelectCourtier(id)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                {/* Liste des courtiers */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filteredCourtiers.length > 0 ? (
                    filteredCourtiers.map(courtier => {
                      const isSelected = selectedCourtierIds.includes(courtier.id);
                      return (
                        <div
                          key={courtier.id}
                          onClick={() => onSelectCourtier(courtier.id)}
                          className={`p-2 rounded cursor-pointer text-xs transition-all ${
                            isSelected 
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <p className="font-medium">{courtier.prenom} {courtier.nom}</p>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {getCurrentValue(courtier.telephones, 'telephone') && (
                              <span>{formatPhoneNumber(getCurrentValue(courtier.telephones, 'telephone'))}</span>
                            )}
                            {getCurrentValue(courtier.courriels, 'courriel') && (
                              <span className="ml-2">{getCurrentValue(courtier.courriels, 'courriel')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-4">Aucun courtier trouvé</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compagnie" className="mt-2">
              <div className="grid grid-cols-[1fr_1fr] gap-3">
                {/* Champ de saisie */}
                <div className="space-y-2">
                  <Label className="text-slate-400 text-xs">Rechercher une compagnie</Label>
                  <Input
                    value={professionnelInfo.compagnie || ""}
                    onChange={(e) => onProfessionnelInfoChange({ ...professionnelInfo, compagnie: e.target.value })}
                    placeholder="Nom de la compagnie..."
                    className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                  />
                  {/* Compagnies sélectionnées */}
                  {selectedCompagnieIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCompagnieIds.map(id => {
                        const compagnie = getClientById(compagnies, id);
                        return compagnie ? (
                          <Badge key={id} className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 pr-1">
                            {compagnie.prenom} {compagnie.nom}
                            <button
                              type="button"
                              onClick={() => onSelectCompagnie(id)}
                              className="ml-1 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                {/* Liste des compagnies */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {filteredCompagnies.length > 0 ? (
                    filteredCompagnies.map(compagnie => {
                      const isSelected = selectedCompagnieIds.includes(compagnie.id);
                      return (
                        <div
                          key={compagnie.id}
                          onClick={() => onSelectCompagnie(compagnie.id)}
                          className={`p-2 rounded cursor-pointer text-xs transition-all ${
                            isSelected 
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <p className="font-medium">{compagnie.prenom} {compagnie.nom}</p>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {getCurrentValue(compagnie.telephones, 'telephone') && (
                              <span>{formatPhoneNumber(getCurrentValue(compagnie.telephones, 'telephone'))}</span>
                            )}
                            {getCurrentValue(compagnie.courriels, 'courriel') && (
                              <span className="ml-2">{getCurrentValue(compagnie.courriels, 'courriel')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-4">Aucune compagnie trouvée</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}