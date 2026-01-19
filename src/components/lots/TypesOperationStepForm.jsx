import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Trash2, Edit2, Check, X, Layers } from "lucide-react";

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
  CADASTRES_PAR_CIRCONSCRIPTION
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
          <div className="space-y-4">
            {/* Formulaire d'ajout/édition de type d'opération */}
            <div className="p-3 bg-slate-900/50 border border-slate-700 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Section Concordances antérieures pour ce type */}
              <div className="border-t border-slate-700 pt-3">
                <Label className="text-slate-300 mb-2 text-xs block">Concordances antérieures</Label>
                
                {/* Formulaire d'ajout de concordance */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div>
                    <Label className="text-slate-400 mb-1 text-xs">Circonscription</Label>
                    <Select
                      value={newConcordance.circonscription_fonciere}
                      onValueChange={(value) => setNewConcordance({...newConcordance, circonscription_fonciere: value, cadastre: ""})}
                      disabled={disabled}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-8">
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
                    <Label className="text-slate-400 mb-1 text-xs">Cadastre</Label>
                    <Select
                      value={newConcordance.cadastre}
                      onValueChange={(value) => setNewConcordance({...newConcordance, cadastre: value})}
                      disabled={disabled || !newConcordance.circonscription_fonciere}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-8">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {availableCadastres.map((cadastre) => (
                          <SelectItem key={cadastre} value={cadastre} className="text-white text-xs">
                            {cadastre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-400 mb-1 text-xs">N° Lot</Label>
                    <Input
                      value={newConcordance.numero_lot}
                      onChange={(e) => setNewConcordance({...newConcordance, numero_lot: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                      placeholder="Ex: 123"
                      disabled={disabled}
                    />
                  </div>

                  <div>
                    <Label className="text-slate-400 mb-1 text-xs">Rang</Label>
                    <Input
                      value={newConcordance.rang}
                      onChange={(e) => setNewConcordance({...newConcordance, rang: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                      placeholder="Ex: A"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddConcordance}
                    disabled={!newConcordance.numero_lot || !newConcordance.circonscription_fonciere || disabled}
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-xs h-7"
                  >
                    {editingConcordanceIndex !== null ? (
                      <><Check className="w-3 h-3 mr-1" /> Modifier</>
                    ) : (
                      <><Plus className="w-3 h-3 mr-1" /> Ajouter</>
                    )}
                  </Button>
                  {editingConcordanceIndex !== null && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditConcordance}
                      className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs h-7"
                    >
                      <X className="w-3 h-3 mr-1" /> Annuler
                    </Button>
                  )}
                </div>

                {/* Liste des concordances pour ce type */}
                {newTypeOperation.concordances_anterieures.length > 0 && (
                  <div className="border border-slate-700 rounded overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                          <TableHead className="text-slate-400 text-xs py-2">N° Lot</TableHead>
                          <TableHead className="text-slate-400 text-xs py-2">Circ.</TableHead>
                          <TableHead className="text-slate-400 text-xs py-2">Cadastre</TableHead>
                          <TableHead className="text-slate-400 text-xs py-2">Rang</TableHead>
                          <TableHead className="text-slate-400 text-xs py-2 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newTypeOperation.concordances_anterieures.map((conc, index) => (
                          <TableRow key={index} className="border-slate-800">
                            <TableCell className="text-white font-medium text-xs py-2">{conc.numero_lot}</TableCell>
                            <TableCell className="text-slate-300 text-xs py-2">{conc.circonscription_fonciere}</TableCell>
                            <TableCell className="text-slate-300 text-xs py-2">{conc.cadastre || "-"}</TableCell>
                            <TableCell className="text-slate-300 text-xs py-2">{conc.rang || "-"}</TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditConcordance(index)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-6 w-6 p-0"
                                  disabled={disabled}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveConcordance(index)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
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

              <div className="flex gap-2 pt-2 border-t border-slate-700">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTypeOperation}
                  disabled={!newTypeOperation.type_operation || !newTypeOperation.date_bpd || disabled}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-xs"
                >
                  {editingTypeIndex !== null ? (
                    <><Check className="w-3 h-3 mr-1" /> Modifier le type</>
                  ) : (
                    <><Plus className="w-3 h-3 mr-1" /> Ajouter le type</>
                  )}
                </Button>
                {editingTypeIndex !== null && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEditTypeOperation}
                    className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" /> Annuler
                  </Button>
                )}
              </div>
            </div>

            {/* Liste des types d'opération ajoutés */}
            {typesOperation.length > 0 && (
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Types d'opération ajoutés</Label>
                {typesOperation.map((typeOp, index) => (
                  <div key={index} className="p-3 bg-slate-900/30 border border-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {typeOp.type_operation}
                          </Badge>
                          <span className="text-slate-400 text-xs">
                            {typeOp.date_bpd}
                          </span>
                          {typeOp.concordances_anterieures?.length > 0 && (
                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                              {typeOp.concordances_anterieures.length} concordance(s)
                            </Badge>
                          )}
                        </div>
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

                    {/* Afficher les concordances de ce type */}
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
                ))}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}