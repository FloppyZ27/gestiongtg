import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Plus, Trash2, FileText, Grid3x3 } from "lucide-react";

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
  CADASTRES_PAR_CIRCONSCRIPTION,
  allLots = []
}) {
  const [lotListSearchTerm, setLotListSearchTerm] = React.useState("");

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
          <div className="grid grid-cols-[60%_1px_calc(40%-1px)] gap-4">
            {/* Colonne gauche - Formulaire et tableau - 60% */}
            <div className="space-y-3">
              {/* Formulaire d'ajout toujours visible */}
              <div className="p-3 bg-slate-700/30 border border-purple-500/30 rounded-lg space-y-3">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Numéro de lot <span className="text-red-400">*</span></Label>
                    <Input
                      value={newConcordance.numero_lot}
                      onChange={(e) => onNewConcordanceChange({...newConcordance, numero_lot: e.target.value})}
                      placeholder="Ex: 123"
                      className="bg-slate-700 border-slate-600 h-8 text-sm"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1 flex flex-col items-center justify-start" style={{ paddingTop: '5px' }}>
                    <Label className="text-slate-400 text-xs">Partie</Label>
                    <div className="h-8 flex items-center justify-center">
                      <Checkbox
                        checked={newConcordance.est_partie || false}
                        onCheckedChange={(checked) => onNewConcordanceChange({...newConcordance, est_partie: checked})}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Rang</Label>
                    <Input
                      value={newConcordance.rang}
                      onChange={(e) => onNewConcordanceChange({...newConcordance, rang: e.target.value})}
                      placeholder="Ex: Rang 4"
                      className="bg-slate-700 border-slate-600 h-8 text-sm"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Circonscription foncière <span className="text-red-400">*</span></Label>
                    <Select 
                      value={newConcordance.circonscription_fonciere} 
                      onValueChange={onCirconscriptionChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                          <SelectItem key={circ} value={circ} className="text-white text-sm">
                            {circ}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Cadastre <span className="text-red-400">*</span></Label>
                    <Select
                      value={newConcordance.cadastre}
                      onValueChange={(value) => onNewConcordanceChange({...newConcordance, cadastre: value})}
                      disabled={!newConcordance.circonscription_fonciere || disabled}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                        <SelectValue placeholder={newConcordance.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord"} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                        {availableCadastres.map((cadastre) => (
                          <SelectItem key={cadastre} value={cadastre} className="text-white text-sm">
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
                  onClick={onAddConcordance}
                  disabled={!newConcordance.numero_lot || !newConcordance.circonscription_fonciere || disabled}
                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter cette concordance
                </Button>
              </div>

              {/* Tableau des concordances */}
              {concordancesAnterieure.length > 0 && (
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300 text-xs">N° Lot</TableHead>
                        <TableHead className="text-slate-300 text-xs">Rang</TableHead>
                        <TableHead className="text-slate-300 text-xs">Circonscription</TableHead>
                        <TableHead className="text-slate-300 text-xs">Cadastre</TableHead>
                        <TableHead className="text-slate-300 text-right text-xs">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {concordancesAnterieure.map((concordance, index) => (
                        <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                          <TableCell className="text-white text-sm">
                            {concordance.numero_lot}{concordance.est_partie ? " Ptie" : ""}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {concordance.rang || "-"}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {concordance.circonscription_fonciere}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {concordance.cadastre || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveConcordance(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                              disabled={disabled}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Séparateur vertical */}
            <div className="bg-slate-600"></div>
            
            {/* Colonne droite - Liste des lots existants - 40% */}
            <div className="pl-1 pr-4">
              <div className="mb-2">
                <Label className="text-slate-400 text-xs">Lots existants</Label>
              </div>

              <div className="space-y-1" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                        onNewConcordanceChange({
                          circonscription_fonciere: lot.circonscription_fonciere || "",
                          cadastre: lot.cadastre || "",
                          numero_lot: lot.numero_lot || "",
                          rang: lot.rang || "",
                          est_partie: false
                        });
                      }}
                      className="p-1.5 bg-slate-700/30 border border-slate-600 rounded hover:bg-slate-700/50 hover:border-purple-500 cursor-pointer transition-all"
                    >
                      <div className="text-xs font-semibold">
                        <span className="text-white">{lot.numero_lot}</span>
                        {lot.concordances_anterieures?.some(c => c.est_partie) && <span className="text-purple-400"> Ptie</span>}
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
                  <div className="text-center py-6 text-slate-500">
                    <Grid3x3 className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Aucun lot trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}