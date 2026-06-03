import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { motion } from "framer-motion";

function SelectorDialog({ open, onOpenChange, title, searchTerm, setSearchTerm, items, selectedIds, onToggle, onNew, newLabel, color, searchPlaceholder }) {
  const colorMap = {
    blue: { selected: 'bg-blue-500/20 border border-blue-500/30', btn: 'bg-emerald-500 hover:bg-emerald-600', validate: 'bg-emerald-500' },
    purple: { selected: 'bg-purple-500/20 border border-purple-500/30', btn: 'bg-purple-500 hover:bg-purple-600', validate: 'bg-purple-500' },
    orange: { selected: 'bg-orange-500/20 border border-orange-500/30', btn: 'bg-orange-500 hover:bg-orange-600', validate: 'bg-orange-500' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <motion.div className="space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input placeholder={searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
            </div>
            <Button type="button" onClick={onNew} className={c.btn}><Plus className="w-4 h-4 mr-2" />{newLabel}</Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(item.id) ? c.selected : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`} onClick={() => onToggle(item.id)}>
                  {item.prenom} {item.nom}
                </div>
              ))}
            </div>
          </div>
          <Button onClick={() => onOpenChange(false)} className={`w-full ${c.validate}`}>Valider</Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientSelectorDialogs({
  isClientSelectorOpen, setIsClientSelectorOpen,
  isNotaireSelectorOpen, setIsNotaireSelectorOpen,
  isCourtierSelectorOpen, setIsCourtierSelectorOpen,
  clientSearchTerm, setClientSearchTerm,
  notaireSearchTerm, setNotaireSearchTerm,
  courtierSearchTerm, setCourtierSearchTerm,
  filteredClients, filteredNotaires, filteredCourtiers,
  clientsIds, notairesIds, courtiersIds,
  onToggleClient, onToggleNotaire, onToggleCourtier,
  openClientFormDialog,
}) {
  return (
    <>
      <SelectorDialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen} title="Sélectionner des clients" searchTerm={clientSearchTerm} setSearchTerm={setClientSearchTerm} items={filteredClients} selectedIds={clientsIds} onToggle={onToggleClient} onNew={() => openClientFormDialog("Client")} newLabel="Nouveau" color="blue" searchPlaceholder="Rechercher un client..." />
      <SelectorDialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen} title="Sélectionner des notaires" searchTerm={notaireSearchTerm} setSearchTerm={setNotaireSearchTerm} items={filteredNotaires} selectedIds={notairesIds} onToggle={onToggleNotaire} onNew={() => openClientFormDialog("Notaire")} newLabel="Nouveau" color="purple" searchPlaceholder="Rechercher un notaire..." />
      <SelectorDialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen} title="Sélectionner des courtiers" searchTerm={courtierSearchTerm} setSearchTerm={setCourtierSearchTerm} items={filteredCourtiers} selectedIds={courtiersIds} onToggle={onToggleCourtier} onNew={() => openClientFormDialog("Courtier immobilier")} newLabel="Nouveau" color="orange" searchPlaceholder="Rechercher un courtier..." />
    </>
  );
}