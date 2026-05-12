import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit } from "lucide-react";
import { motion } from "framer-motion";

export default function ClientSelectorDialogs({
  isClientSelectorOpen, setIsClientSelectorOpen,
  isNotaireSelectorOpen, setIsNotaireSelectorOpen,
  isCourtierSelectorOpen, setIsCourtierSelectorOpen,
  clientSearchTerm, setClientSearchTerm,
  notaireSearchTerm, setNotaireSearchTerm,
  courtierSearchTerm, setCourtierSearchTerm,
  filteredClientsForSelector,
  filteredNotairesForSelector,
  filteredCourtiersForSelector,
  formData,
  toggleClient,
  handleEdit,
  openClientFormDialog,
  formatAdresse,
  getCurrentValue,
}) {
  return (
    <>
      <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
          <DialogHeader><DialogTitle>Sélectionner des clients</DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input placeholder="Rechercher un client..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
              </div>
              <Button type="button" onClick={() => openClientFormDialog("Client")} className="bg-emerald-500 hover:bg-emerald-600"><Plus className="w-4 h-4 mr-2" />Nouveau</Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredClientsForSelector.map((client) => (
                  <div key={client.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${formData.clients_ids.includes(client.id) ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`} onClick={() => toggleClient(client.id, 'clients')}>
                    <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {client.adresses?.length > 0 && formatAdresse(client.adresses.find(a => a.actuelle || a.actuel)) && <p className="truncate">📍 {formatAdresse(client.adresses.find(a => a.actuelle || a.actuel))}</p>}
                      {getCurrentValue(client.courriels, 'courriel') && <p className="truncate">✉️ {getCurrentValue(client.courriels, 'courriel')}</p>}
                      {getCurrentValue(client.telephones, 'telephone') && <p>📞 <a href={`tel:${getCurrentValue(client.telephones, 'telephone').replace(/\D/g, '')}`} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">{getCurrentValue(client.telephones, 'telephone')}</a></p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsClientSelectorOpen(false); handleEdit(client); }} className="text-emerald-400 hover:text-emerald-300 mt-2 w-full"><Edit className="w-4 h-4 mr-1" />Modifier</Button>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => setIsClientSelectorOpen(false)} className="w-full bg-emerald-500">Valider</Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
          <DialogHeader><DialogTitle>Sélectionner des notaires</DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input placeholder="Rechercher un notaire..." value={notaireSearchTerm} onChange={(e) => setNotaireSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
              </div>
              <Button type="button" onClick={() => openClientFormDialog("Notaire")} className="bg-purple-500 hover:bg-purple-600"><Plus className="w-4 h-4 mr-2" />Nouveau</Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredNotairesForSelector.map((notaire) => (
                  <div key={notaire.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${formData.notaires_ids.includes(notaire.id) ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`} onClick={() => toggleClient(notaire.id, 'notaires')}>
                    <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {notaire.adresses?.length > 0 && formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel)) && <p className="truncate">📍 {formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel))}</p>}
                      {getCurrentValue(notaire.courriels, 'courriel') && <p className="truncate">✉️ {getCurrentValue(notaire.courriels, 'courriel')}</p>}
                      {getCurrentValue(notaire.telephones, 'telephone') && <p>📞 <a href={`tel:${getCurrentValue(notaire.telephones, 'telephone').replace(/\D/g, '')}`} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">{getCurrentValue(notaire.telephones, 'telephone')}</a></p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsNotaireSelectorOpen(false); handleEdit(notaire); }} className="text-purple-400 hover:text-purple-300 mt-2 w-full"><Edit className="w-4 h-4 mr-1" />Modifier</Button>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => setIsNotaireSelectorOpen(false)} className="w-full bg-purple-500">Valider</Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
          <DialogHeader><DialogTitle>Sélectionner des courtiers</DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input placeholder="Rechercher un courtier..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
              </div>
              <Button type="button" onClick={() => openClientFormDialog("Courtier immobilier")} className="bg-orange-500 hover:bg-orange-600"><Plus className="w-4 h-4 mr-2" />Nouveau</Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {filteredCourtiersForSelector.map((courtier) => (
                  <div key={courtier.id} className={`p-3 rounded-lg cursor-pointer transition-colors ${formData.courtiers_ids.includes(courtier.id) ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`} onClick={() => toggleClient(courtier.id, 'courtiers')}>
                    <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {courtier.adresses?.length > 0 && formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel)) && <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel))}</p>}
                      {getCurrentValue(courtier.courriels, 'courriel') && <p className="truncate">✉️ {getCurrentValue(courtier.courriels, 'courriel')}</p>}
                      {getCurrentValue(courtier.telephones, 'telephone') && <p>📞 <a href={`tel:${getCurrentValue(courtier.telephones, 'telephone').replace(/\D/g, '')}`} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">{getCurrentValue(courtier.telephones, 'telephone')}</a></p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setIsCourtierSelectorOpen(false); handleEdit(courtier); }} className="text-orange-400 hover:text-orange-300 mt-2 w-full"><Edit className="w-4 h-4 mr-1" />Modifier</Button>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => setIsCourtierSelectorOpen(false)} className="w-full bg-orange-500">Valider</Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}