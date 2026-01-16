import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Plus, Trash2, FileText } from "lucide-react";

export default function ConcordanceStepForm({
  concordancesAnterieure,
  onConcordancesChange,
  newConcordance,
  onNewConcordanceChange,
  availableCadastres,
  onAddConcordance,
  onRemoveConcordance,
  onCirconscriptionChange,
  editingIndex,
  onEditConcordance,
  onCancelEdit,
  isCollapsed,
  onToggleCollapse,
  disabled,
  CADASTRES_PAR_CIRCONSCRIPTION
}) {
  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-2 bg-purple-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <CardTitle className="text-purple-300 text-base">Concordances antérieures</CardTitle>
            {concordancesAnterieure?.length > 0 && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                {concordancesAnterieure.length}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-3 pb-3">
          <div className="space-y-3">
            {/* Formulaire d'ajout/édition */}
            <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3">
              {editingIndex !== null && (
                <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-sm">
                  Mode édition - Modification de la concordance #{editingIndex + 1}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Circonscription foncière</Label>
                  <Select 
                    value={newConcordance.circonscription_fonciere} 
                    onValueChange={onCirconscriptionChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                        <SelectItem key={circ} value={circ} className="text-white">
                          {circ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cadastre</Label>
                  <Select
                    value={newConcordance.cadastre}
                    onValueChange={(value) => onNewConcordanceChange({...newConcordance, cadastre: value})}
                    disabled={!newConcordance.circonscription_fonciere || disabled}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder={newConcordance.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                      {availableCadastres.map((cadastre) => (
                        <SelectItem key={cadastre} value={cadastre} className="text-white">
                          {cadastre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Numéro de lot</Label>
                  <Input
                    value={newConcordance.numero_lot}
                    onChange={(e) => onNewConcordanceChange({...newConcordance, numero_lot: e.target.value})}
                    placeholder="Ex: 1234-5678"
                    className="bg-slate-800 border-slate-700"
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rang</Label>
                  <Input
                    value={newConcordance.rang}
                    onChange={(e) => onNewConcordanceChange({...newConcordance, rang: e.target.value})}
                    placeholder="Ex: Rang 4"
                    className="bg-slate-800 border-slate-700"
                    disabled={disabled}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={onAddConcordance}
                  disabled={!newConcordance.numero_lot || !newConcordance.circonscription_fonciere || disabled}
                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingIndex !== null ? "Enregistrer les modifications" : "Ajouter cette concordance"}
                </Button>
                {editingIndex !== null && (
                  <Button
                    type="button"
                    onClick={onCancelEdit}
                    variant="outline"
                    className="bg-slate-700 hover:bg-slate-600 text-white"
                    disabled={disabled}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>

            {/* Tableau des concordances ajoutées */}
            {concordancesAnterieure.length > 0 && (
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">Numéro de lot</TableHead>
                      <TableHead className="text-slate-300">Circonscription</TableHead>
                      <TableHead className="text-slate-300">Cadastre</TableHead>
                      <TableHead className="text-slate-300">Rang</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {concordancesAnterieure.map((concordance, index) => (
                      <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                        <TableCell className="text-white font-medium">{concordance.numero_lot}</TableCell>
                        <TableCell className="text-white">{concordance.circonscription_fonciere}</TableCell>
                        <TableCell className="text-white">{concordance.cadastre || "-"}</TableCell>
                        <TableCell className="text-white">{concordance.rang || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveConcordance(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              disabled={disabled}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </CardContent>
      )}
    </Card>
  );
}