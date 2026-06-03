import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Grid3x3, Check, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { CADASTRES_PAR_CIRCONSCRIPTION } from "@/lib/cadastreCodes";

export default function LotSelectorDialog({
  isOpen, onOpenChange,
  lots,
  lotSearchTerm, setLotSearchTerm,
  lotCirconscriptionFilter, setLotCirconscriptionFilter,
  lotCadastreFilter, setLotCadastreFilter,
  currentMandatIndex,
  formDataMandats,
  onAddLot,
  onNewLot,
}) {
  const filteredLots = lots.filter(lot => {
    const matchesSearch = lot.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.circonscription_fonciere?.toLowerCase().includes(lotSearchTerm.toLowerCase());
    const matchesCirconscription = lotCirconscriptionFilter === "all" || lot.circonscription_fonciere === lotCirconscriptionFilter;
    const matchesCadastre = lotCadastreFilter === "all" || lot.cadastre === lotCadastreFilter;
    return matchesSearch && matchesCirconscription && matchesCadastre;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) {
        setLotCirconscriptionFilter("all");
        setLotSearchTerm("");
        setLotCadastreFilter("Québec");
      }
    }}>
      <DialogContent className="bg-white/5 backdrop-blur-2xl border-2 border-white/20 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50">
        <DialogHeader>
          <DialogTitle className="text-2xl">Sélectionner des lots</DialogTitle>
        </DialogHeader>
        <motion.div className="space-y-4 flex-1 overflow-hidden flex flex-col" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input placeholder="Rechercher par numéro, rang..." value={lotSearchTerm} onChange={(e) => setLotSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
            </div>
            <Select value={lotCirconscriptionFilter} onValueChange={setLotCirconscriptionFilter}>
              <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Circonscription" /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                  <SelectItem key={circ} value={circ} className="text-white">{circ}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={lotCadastreFilter} onValueChange={setLotCadastreFilter}>
              <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Cadastre" /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                <SelectItem value="Québec" className="text-white">Québec</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" onClick={onNewLot} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />Nouveau lot
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                  <TableHead className="text-slate-300">Numéro de lot</TableHead>
                  <TableHead className="text-slate-300">Circonscription</TableHead>
                  <TableHead className="text-slate-300">Cadastre</TableHead>
                  <TableHead className="text-slate-300">Rang</TableHead>
                  <TableHead className="text-slate-300 text-right">Sélection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.length > 0 ? filteredLots.map((lot) => {
                  const isSelected = currentMandatIndex !== null && formDataMandats?.[currentMandatIndex]?.lots?.includes(lot.id);
                  return (
                    <TableRow key={lot.id} className={`cursor-pointer transition-colors border-slate-800 ${isSelected ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'hover:bg-slate-800/30'}`} onClick={() => onAddLot(lot.id)}>
                      <TableCell className="font-medium text-white">{lot.numero_lot}</TableCell>
                      <TableCell className="text-slate-300"><Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{lot.circonscription_fonciere}</Badge></TableCell>
                      <TableCell className="text-slate-300">{lot.cadastre || "-"}</TableCell>
                      <TableCell className="text-slate-300">{lot.rang || "-"}</TableCell>
                      <TableCell className="text-right">{isSelected && <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50"><Check className="w-3 h-3 mr-1" />Sélectionné</Badge>}</TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-12">
                    <div className="text-slate-400"><Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aucun lot trouvé</p></div>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full bg-emerald-500">Valider la sélection</Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}