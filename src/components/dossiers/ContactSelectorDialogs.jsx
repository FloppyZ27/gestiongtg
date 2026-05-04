import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, User } from "lucide-react";
import { Search } from "lucide-react";

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

function ContactSelectorDialog({ isOpen, onOpenChange, title, searchTerm, onSearchChange, contacts, selectedIds, onToggle, onEdit, onNew, newButtonColor, selectedColor, hideCloseButton }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton={hideCloseButton}>
        <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{title}</DialogTitle>
            <Button variant="outline" onClick={onNew} className={`${newButtonColor} border-0 text-white`}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
          </div>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <Input placeholder={`Rechercher...`} value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 p-4">
            {contacts.length > 0 ? contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedIds.includes(contact.id) ? `${selectedColor} border` : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`}
                onClick={() => onToggle(contact.id)}
              >
                <p className="text-white font-medium">{contact.prenom} {contact.nom}</p>
                <div className="text-sm text-slate-400 space-y-1 mt-1">
                  {contact.adresses?.find(a => a.actuelle) && formatAdresse(contact.adresses.find(a => a.actuelle)) && (
                    <p className="truncate">📍 {formatAdresse(contact.adresses.find(a => a.actuelle))}</p>
                  )}
                  {contact.courriels?.find(c => c.actuel)?.courriel && (
                    <p className="truncate">✉️ {contact.courriels.find(c => c.actuel).courriel}</p>
                  )}
                  {contact.telephones?.find(t => t.actuel)?.telephone && (
                    <p>📞 <a href={`tel:${contact.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer" onClick={e => e.stopPropagation()}>{contact.telephones.find(t => t.actuel).telephone}</a></p>
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(contact); }} className="text-emerald-400 hover:text-emerald-300 mt-2 w-full">
                  <Edit className="w-4 h-4 mr-1" />Modifier
                </Button>
              </div>
            )) : (
              <div className="col-span-2 text-center py-12 text-slate-500">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end items-center pt-4 border-t border-slate-800">
          <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactSelectorDialogs({
  isClientSelectorOpen, setIsClientSelectorOpen,
  isNotaireSelectorOpen, setIsNotaireSelectorOpen,
  isCourtierSelectorOpen, setIsCourtierSelectorOpen,
  clientSearchTerm, setClientSearchTerm,
  notaireSearchTerm, setNotaireSearchTerm,
  courtierSearchTerm, setCourtierSearchTerm,
  filteredClientsForSelector, filteredNotairesForSelector, filteredCourtiersForSelector,
  formData, toggleClient,
  setIsClientFormDialogOpen, setClientTypeForForm,
  handleEdit,
}) {
  return (
    <>
      <ContactSelectorDialog
        isOpen={isClientSelectorOpen}
        onOpenChange={setIsClientSelectorOpen}
        title="Sélectionner les clients"
        searchTerm={clientSearchTerm}
        onSearchChange={setClientSearchTerm}
        contacts={filteredClientsForSelector}
        selectedIds={formData.clients_ids}
        onToggle={(id) => toggleClient(id, 'clients')}
        onEdit={(c) => { setIsClientSelectorOpen(false); handleEdit(c); }}
        onNew={() => { setIsClientFormDialogOpen(true); setClientTypeForForm("Client"); setIsClientSelectorOpen(false); }}
        newButtonColor="bg-blue-500 hover:bg-blue-600"
        selectedColor="bg-blue-500/20 border-blue-500/30"
        hideCloseButton={true}
      />
      <ContactSelectorDialog
        isOpen={isNotaireSelectorOpen}
        onOpenChange={setIsNotaireSelectorOpen}
        title="Sélectionner les notaires"
        searchTerm={notaireSearchTerm}
        onSearchChange={setNotaireSearchTerm}
        contacts={filteredNotairesForSelector}
        selectedIds={formData.notaires_ids}
        onToggle={(id) => toggleClient(id, 'notaires')}
        onEdit={(n) => { setIsNotaireSelectorOpen(false); handleEdit(n); }}
        onNew={() => { setIsClientFormDialogOpen(true); setClientTypeForForm("Notaire"); setIsNotaireSelectorOpen(false); }}
        newButtonColor="bg-purple-500 hover:bg-purple-600"
        selectedColor="bg-purple-500/20 border-purple-500/30"
        hideCloseButton={true}
      />
      <ContactSelectorDialog
        isOpen={isCourtierSelectorOpen}
        onOpenChange={setIsCourtierSelectorOpen}
        title="Sélectionner les courtiers immobiliers"
        searchTerm={courtierSearchTerm}
        onSearchChange={setCourtierSearchTerm}
        contacts={filteredCourtiersForSelector}
        selectedIds={formData.courtiers_ids}
        onToggle={(id) => toggleClient(id, 'courtiers')}
        onEdit={(c) => { setIsCourtierSelectorOpen(false); handleEdit(c); }}
        onNew={() => { setIsClientFormDialogOpen(true); setClientTypeForForm("Courtier immobilier"); setIsCourtierSelectorOpen(false); }}
        newButtonColor="bg-orange-500 hover:bg-orange-600"
        selectedColor="bg-orange-500/20 border-orange-500/30"
        hideCloseButton={true}
      />
    </>
  );
}