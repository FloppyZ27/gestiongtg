import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X, Layers, Grid3x3, Link2 } from "lucide-react";

const TYPES_OPERATIONS = [
  "Vente",
  "Cession",
  "Donation",
  "Déclaration de Transmission",
  "Jugement",
  "Rectification",
  "Retrocession",
  "Subdivision",
  "Morcellement",
  "Autre"
];

export default function TypesOperationStepForm({
  typesOperation = [],
  onTypesOperationChange,
  isCollapsed,
  onToggleCollapse,
  disabled,
  CADASTRES_PAR_CIRCONSCRIPTION,
  allLots = []
}) {
  const [newTypeOperation, setNewTypeOperation] = useState({
    type_operation: "",
    date_bpd: "",
    concordances_anterieures: []
  });

  const [newConcordance, setNewConcordance] = useState({
    circonscription_fonciere: "",
    cadastre: "",
    numero_lot: "",
    rang: ""
  });

  const [editingTypeIndex, setEditingTypeIndex] = useState(null);
  const [editingConcordanceIndex, setEditingConcordanceIndex] = useState(null);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(null);
  const [lotListSearchTerm, setLotListSearchTerm] = useState("");
  const [concordancesCollapsed, setConcordancesCollapsed] = useState(false);

  const handleAddTypeOperation = () => {
    if (!newTypeOperation.type_operation || !newTypeOperation.date_bpd) {
      return;
    }

    if (editingTypeIndex !== null) {
      const updated = [...typesOperation];
      updated[editingTypeIndex] = { ...newTypeOperation };
      onTypesOperationChange(updated);
      setEditingTypeIndex(null);
    } else {
      onTypesOperationChange([...typesOperation, { ...newTypeOperation }]);
    }

    setNewTypeOperation({
      type_operation: "",
      date_bpd: "",
      concordances_anterieures: []
    });
    setSelectedTypeIndex(null);
  };

  const handleEditTypeOperation = (index) => {
    setNewTypeOperation({ ...typesOperation[index] });
    setEditingTypeIndex(index);
    setSelectedTypeIndex(index);
  };

  const handleCancelEditTypeOperation = () => {
    setNewTypeOperation({
      type_operation: "",
      date_bpd: "",
      concordances_anterieures: []
    });
    setEditingTypeIndex(null);
    setSelectedTypeIndex(null);
  };

  const handleRemoveTypeOperation = (index) => {
    const updated = typesOperation.filter((_, i) => i !== index);
    onTypesOperationChange(updated);
    if (editingTypeIndex === index) {
      handleCancelEditTypeOperation();
    }
  };

  const handleAddConcordance = () => {
    if (!newConcordance.numero_lot || !newConcordance.circonscription_fonciere) {
      return;
    }

    const concordances = [...newTypeOperation.concordances_anterieures];
    
    if (editingConcordanceIndex !== null) {
      concordances[editingConcordanceIndex] = { ...newConcordance };
      setEditingConcordanceIndex(null);
    } else {
      concordances.push({ ...newConcordance });
    }

    setNewTypeOperation({
      ...newTypeOperation,
      concordances_anterieures: concordances
    });

    setNewConcordance({
      circonscription_fonciere: "",
      cadastre: "",
      numero_lot: "",
      rang: ""
    });
  };

  const handleEditConcordance = (index) => {
    setNewConcordance({ ...newTypeOperation.concordances_anterieures[index] });
    setEditingConcordanceIndex(index);
  };

  const handleCancelEditConcordance = () => {
    setNewConcordance({
      circonscription_fonciere: "",
      cadastre: "",
      numero_lot: "",
      rang: ""
    });
    setEditingConcordanceIndex(null);
  };

  const handleRemoveConcordance = (index) => {
    const concordances = newTypeOperation.concordances_anterieures.filter((_, i) => i !== index);
    setNewTypeOperation({
      ...newTypeOperation,
      concordances_anterieures: concordances
    });
    if (editingConcordanceIndex === index) {
      handleCancelEditConcordance();
    }
  };

  const availableCadastres = newConcordance.circonscription_fonciere 
    ? CADASTRES_PAR_CIRCONSCRIPTION[newConcordance.circonscription_fonciere] || []
    : [];

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-2 bg-purple-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-purple-300 text-base">
                Types d'opération
              </CardTitle>
              {typesOperation.length > 0 && (
                <Badge className="bg-purple-500/30 text-purple-300 border-purple-500/50 px-2 py-0.5 text-xs">
                  {typesOperation.length}
                </Badge>
              )}
            </div>
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-3 pb-2">
          {/* Tabs des types d'opération ajoutés */}
          {typesOperation.length > 0 && (
            <div className="mb-4">
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="grid grid-cols-auto gap-1 bg-transparent border-b border-slate-700 pb-2 h-auto">
                  {typesOperation.map((typeOp, index) => (
                    <TabsTrigger 
                      key={index} 
                      value={String(index)}
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-400 text-xs px-3 py-2"
                    >
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {typeOp.type_operation}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {typesOperation.map((typeOp, index) => (
                  <TabsContent key={index} value={String(index)} className="mt-3 space-y-3">
                    <div className="p-3 bg-slate-900/30 border border-slate-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-slate-400 text-xs font-semibold">Date BPD:</span>
                            <span className="text-white text-xs">{typeOp.date_bpd}</span>
                          </div>
                          {typeOp.concordances_anterieures?.length > 0 && (
                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                              {typeOp.concordances_anterieures.length} concordance(s)
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditTypeOperation(index)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 w-7 p-0"
                            disabled={disabled}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveTypeOperation(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                            disabled={disabled}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {typeOp.concordances_anterieures?.length > 0 && (
                        <div className="mt-2 border-t border-slate-700 pt-2">
                          <div className="grid grid-cols-4 gap-2">
                            {typeOp.concordances_anterieures.map((conc, concIndex) => (
                              <div key={concIndex} className="text-xs bg-slate-800/50 p-2 rounded">
                                <div className="text-white font-medium">{conc.numero_lot}</div>
                                <div className="text-slate-400">{conc.circonscription_fonciere}</div>
                                {conc.cadastre && <div className="text-slate-500">{conc.cadastre}</div>}
                                {conc.rang && <div className="text-slate-500">Rang: {conc.rang}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}

          <div className="space-y-4 w-full">
             {/* Formulaire d'ajout/édition de type d'opération */}
             <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg space-y-3 w-full">
               <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                 <div>
                   <Label className="text-slate-300 mb-1 text-xs">Type d'opération <span className="text-red-400">*</span></Label>
                   <Select
                     value={newTypeOperation.type_operation}
                     onValueChange={(value) => setNewTypeOperation({...newTypeOperation, type_operation: value})}
                     disabled={disabled}
                   >
                     <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs">
                       <SelectValue placeholder="Sélectionner un type" />
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

                 <div>
                   <Label className="text-slate-300 mb-1 text-xs">Date BPD <span className="text-red-400">*</span></Label>
                   <Input
                     type="date"
                     value={newTypeOperation.date_bpd}
                     onChange={(e) => setNewTypeOperation({...newTypeOperation, date_bpd: e.target.value})}
                     className="bg-slate-800 border-slate-700 text-white text-xs"
                     disabled={disabled}
                   />
                 </div>

                 <Button
                   type="button"
                   size="icon"
                   onClick={handleAddTypeOperation}
                   disabled={!newTypeOperation.type_operation || !newTypeOperation.date_bpd || disabled}
                   className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 h-8 w-8"
                 >
                   <Plus className="w-4 h-4" />
                 </Button>
               </div>

              {/* Section Concordances antérieures - Colapsable */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <div 
                  className="cursor-pointer hover:bg-teal-900/40 transition-colors p-2 rounded-lg mb-2 flex items-center justify-between bg-teal-900/20"
                  onClick={() => setConcordancesCollapsed(!concordancesCollapsed)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-teal-500/30 flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-3 h-3 text-teal-400" />
                    </div>
                    <Label className="text-teal-300 text-xs font-semibold cursor-pointer">Concordances antérieures</Label>
                    {newTypeOperation.concordances_anterieures?.length > 0 && (
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 px-1.5 py-0 text-xs">
                        {newTypeOperation.concordances_anterieures.length}
                      </Badge>
                    )}
                  </div>
                  {concordancesCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>

                {!concordancesCollapsed && (
                  <div className="grid grid-cols-[60%_1px_calc(40%-1px)] gap-2 w-full">
                  {/* Colonne gauche - Formulaire et tableau */}
                  <div className="space-y-2">
                    {/* Formulaire d'ajout */}
                    <div className="p-2 bg-slate-700/30 border border-slate-600 rounded-lg space-y-2">
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">N° Lot <span className="text-red-400">*</span></Label>
                          <Input
                            value={newConcordance.numero_lot}
                            onChange={(e) => setNewConcordance({...newConcordance, numero_lot: e.target.value})}
                            placeholder="Ex: 123"
                            className="bg-slate-800 border-slate-700 text-white text-xs h-7"
                            disabled={disabled}
                          />
                        </div>
                        <div className="flex flex-col items-center justify-start" style={{ paddingTop: '5px' }}>
                          <Label className="text-slate-400 text-xs">Partie</Label>
                          <div className="h-7 flex items-center justify-center">
                            <Checkbox
                              checked={newConcordance.est_partie || false}
                              onCheckedChange={(checked) => setNewConcordance({...newConcordance, est_partie: checked})}
                              disabled={disabled}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-slate-400 text-xs">Rang</Label>
                          <Input
                            value={newConcordance.rang}
                            onChange={(e) => setNewConcordance({...newConcordance, rang: e.target.value})}
                            placeholder="Ex: Rang 4"
                            className="bg-slate-800 border-slate-700 text-white text-xs h-7"
                            disabled={disabled}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-slate-400 text-xs">Circonscription <span className="text-red-400">*</span></Label>
                          <Select
                            value={newConcordance.circonscription_fonciere}
                            onValueChange={(value) => setNewConcordance({...newConcordance, circonscription_fonciere: value, cadastre: ""})}
                            disabled={disabled}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-7">
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

                        <div>
                          <Label className="text-slate-400 text-xs">Cadastre <span className="text-red-400">*</span></Label>
                          <Select
                            value={newConcordance.cadastre}
                            onValueChange={(value) => setNewConcordance({...newConcordance, cadastre: value})}
                            disabled={disabled || !newConcordance.circonscription_fonciere}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-7">
                              <SelectValue placeholder={newConcordance.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord"} />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                              {availableCadastres.map((cadastre) => (
                                <SelectItem key={cadastre} value={cadastre} className="text-white text-xs">
                                  {cadastre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddConcordance}
                        disabled={!newConcordance.numero_lot || !newConcordance.circonscription_fonciere || disabled}
                        className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 w-full text-xs h-7"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {editingConcordanceIndex !== null ? "Modifier" : "Ajouter"}
                      </Button>
                    </div>

                    {/* Tableau des concordances */}
                    {newTypeOperation.concordances_anterieures.length > 0 && (
                      <div className="border border-slate-700 rounded overflow-hidden max-h-48 overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0">
                            <TableRow className="bg-slate-800/50 border-slate-700">
                              <TableHead className="text-slate-400 text-xs py-1">N° Lot</TableHead>
                              <TableHead className="text-slate-400 text-xs py-1">Circ.</TableHead>
                              <TableHead className="text-slate-400 text-xs py-1">Cadastre</TableHead>
                              <TableHead className="text-slate-400 text-xs py-1">Rang</TableHead>
                              <TableHead className="text-slate-400 text-xs py-1 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newTypeOperation.concordances_anterieures.map((conc, index) => (
                              <TableRow key={index} className="border-slate-800">
                                <TableCell className="text-white text-xs py-1">{conc.numero_lot}{conc.est_partie ? " Ptie" : ""}</TableCell>
                                <TableCell className="text-slate-300 text-xs py-1">{conc.circonscription_fonciere}</TableCell>
                                <TableCell className="text-slate-300 text-xs py-1">{conc.cadastre || "-"}</TableCell>
                                <TableCell className="text-slate-300 text-xs py-1">{conc.rang || "-"}</TableCell>
                                <TableCell className="text-right py-1">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditConcordance(index)}
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-5 w-5 p-0"
                                      disabled={disabled}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveConcordance(index)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-5 w-5 p-0"
                                      disabled={disabled}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>

                  {/* Séparateur */}
                  <div className="bg-slate-600"></div>

                  {/* Colonne droite - Lots existants */}
                  <div className="pl-1 pr-2">
                    <Label className="text-slate-400 text-xs mb-1 block">Lots existants</Label>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {allLots
                        .filter(lot => {
                          const searchLower = lotListSearchTerm.toLowerCase();
                          const matchesSearch = !lotListSearchTerm || 
                            lot.numero_lot?.toLowerCase().includes(searchLower) ||
                            lot.rang?.toLowerCase().includes(searchLower) ||
                            lot.circonscription_fonciere?.toLowerCase().includes(searchLower) ||
                            lot.cadastre?.toLowerCase().includes(searchLower);
                          const matchesNumero = !newConcordance.numero_lot || 
                            lot.numero_lot?.toLowerCase().includes(newConcordance.numero_lot.toLowerCase());
                          const matchesRang = !newConcordance.rang || 
                            lot.rang?.toLowerCase().includes(newConcordance.rang.toLowerCase());
                          const matchesCirconscription = !newConcordance.circonscription_fonciere || 
                            lot.circonscription_fonciere === newConcordance.circonscription_fonciere;
                          const matchesCadastre = !newConcordance.cadastre || 
                            lot.cadastre === newConcordance.cadastre;

                          return matchesSearch && matchesNumero && matchesRang && matchesCirconscription && matchesCadastre;
                        })
                        .map((lot) => (
                          <div 
                            key={lot.id} 
                            onClick={() => {
                              setNewConcordance({
                                circonscription_fonciere: lot.circonscription_fonciere || "",
                                cadastre: lot.cadastre || "",
                                numero_lot: lot.numero_lot || "",
                                rang: lot.rang || "",
                                est_partie: false
                              });
                            }}
                            className="p-1 bg-slate-700/30 border border-slate-600 rounded hover:bg-slate-700/50 hover:border-teal-500 cursor-pointer transition-all"
                          >
                            <div className="text-xs">
                              <span className="text-white font-semibold">{lot.numero_lot}</span>
                              <span className="text-slate-400">{lot.rang ? ` • ${lot.rang}` : ''}{lot.cadastre ? ` • ${lot.cadastre}` : ''} • {lot.circonscription_fonciere}</span>
                            </div>
                          </div>
                        ))}
                      {allLots.filter(lot => {
                        const searchLower = lotListSearchTerm.toLowerCase();
                        const matchesSearch = !lotListSearchTerm || 
                          lot.numero_lot?.toLowerCase().includes(searchLower) ||
                          lot.rang?.toLowerCase().includes(searchLower) ||
                          lot.circonscription_fonciere?.toLowerCase().includes(searchLower) ||
                          lot.cadastre?.toLowerCase().includes(searchLower);
                        const matchesNumero = !newConcordance.numero_lot || 
                          lot.numero_lot?.toLowerCase().includes(newConcordance.numero_lot.toLowerCase());
                        const matchesRang = !newConcordance.rang || 
                          lot.rang?.toLowerCase().includes(newConcordance.rang.toLowerCase());
                        const matchesCirconscription = !newConcordance.circonscription_fonciere || 
                          lot.circonscription_fonciere === newConcordance.circonscription_fonciere;
                        const matchesCadastre = !newConcordance.cadastre || 
                          lot.cadastre === newConcordance.cadastre;

                        return matchesSearch && matchesNumero && matchesRang && matchesCirconscription && matchesCadastre;
                      }).length === 0 && (
                        <div className="text-center py-4 text-slate-500">
                          <Grid3x3 className="w-4 h-4 mx-auto mb-1 opacity-50" />
                          <p className="text-xs">Aucun lot</p>
                        </div>
                      )}
                    </div>
                    </div>
                    </div>
                    )}
                    </div>

              {editingTypeIndex !== null && (
                <div className="flex gap-2 pt-2 border-t border-slate-700">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddTypeOperation}
                    disabled={!newTypeOperation.type_operation || !newTypeOperation.date_bpd || disabled}
                    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" /> Modifier le type
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditTypeOperation}
                    className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" /> Annuler
                  </Button>
                </div>
              )}
            </div>


          </div>
        </CardContent>
      )}
    </Card>
  );
}