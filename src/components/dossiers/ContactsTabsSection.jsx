import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, FileText, Briefcase, Plus, Search, Check, ChevronDown, ChevronUp } from "lucide-react";
import ClientSelectionCard from "@/components/mandat/ClientSelectionCard";

export default function ContactsTabsSection({
  formData,
  setFormData,
  clients = [],
  activeContactTab,
  setActiveContactTab,
  contactsListCollapsed,
  setContactsListCollapsed,
  clientSearchTerm,
  setClientSearchTerm,
  notaireSearchTerm,
  setNotaireSearchTerm,
  courtierSearchTerm,
  setCourtierSearchTerm,
  setClientTypeForForm,
  setIsClientFormDialogOpen,
  onClientCardClick,
  setEditingClient
}) {
  const clientsReguliers = (clients || []).filter(c => c?.type_client === 'Client' || !c?.type_client);
  const notaires = (clients || []).filter(c => c?.type_client === 'Notaire');
  const courtiers = (clients || []).filter(c => c?.type_client === 'Courtier immobilier');
  const compagnies = (clients || []).filter(c => c?.type_client === 'Compagnie');

  const removeClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(id => id !== clientId)
    }));
  };

  const filteredClientsForSelector = clientsReguliers.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredNotairesForSelector = notaires.filter(n =>
    `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase())
  );

  const filteredCourtiersForSelector = courtiers.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase())
  );

  const filteredCompagniesForSelector = compagnies.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase())
  );

  const handleClientCardClick = (client, type) => {
    if (setEditingClient) {
      setEditingClient(client);
    }
    setClientTypeForForm(type === 'notaires' ? 'Notaire' : type === 'courtiers' ? 'Courtier immobilier' : type === 'compagnies' ? 'Compagnie' : 'Client');
    setIsClientFormDialogOpen(true);
  };

  const renderClientCard = (clientId, client, type, colors) => {
    return (
      <ClientSelectionCard 
        key={clientId}
        clientId={clientId}
        clientData={client}
        onRemove={() => removeClient(clientId, type)}
        onClick={() => handleClientCardClick(client, type)}
        backgroundColor={colors.backgroundColor}
        borderColor={colors.borderColor}
        textColor={colors.textColor}
        hoverColor={colors.hoverColor}
      />
    );
  };

  return (
    <Tabs value={activeContactTab} onValueChange={setActiveContactTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 h-7">
        <TabsTrigger value="clients" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
          <User className="w-3 h-3" />
          Clients {formData.clients_ids.length > 0 && `(${formData.clients_ids.length})`}
        </TabsTrigger>
        <TabsTrigger value="notaires" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Notaires {formData.notaires_ids.length > 0 && `(${formData.notaires_ids.length})`}
        </TabsTrigger>
        <TabsTrigger value="courtiers" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
          <User className="w-3 h-3" />
          Courtiers {formData.courtiers_ids.length > 0 && `(${formData.courtiers_ids.length})`}
        </TabsTrigger>
        <TabsTrigger value="compagnies" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
          <Briefcase className="w-3 h-3" />
          Compagnies {(formData.compagnies_ids || []).length > 0 && `(${formData.compagnies_ids.length})`}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="clients" className="mt-2">
        <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
          <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                {formData.clients_ids.length > 0 ? (
                  <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {formData.clients_ids.map(clientId => {
                      const client = clients.find(c => c.id === clientId);
                      return renderClientCard(clientId, client, 'clients', {
                        backgroundColor: "bg-blue-500/20",
                        borderColor: "border-blue-500/30",
                        textColor: "text-blue-400",
                        hoverColor: "hover:bg-blue-500/30"
                      });
                    })}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                    Aucun client sélectionné
                  </div>
                )}
              </div>
              {!contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(true)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              )}
              {contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(false)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
              )}
            </div>
          </div>

          <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { setClientTypeForForm("Client"); setIsClientFormDialogOpen(true); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Clients existants ({filteredClientsForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredClientsForSelector.length > 0 ? (
                filteredClientsForSelector.slice(0, 15).map((client) => {
                  const isSelected = formData.clients_ids.includes(client.id);
                  return (
                    <div key={client.id} onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        clients_ids: prev.clients_ids.includes(client.id)
                          ? prev.clients_ids.filter(id => id !== client.id)
                          : [...prev.clients_ids, client.id]
                      }));
                    }} className={`px-2 py-1.5 rounded text-xs cursor-pointer ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{client.prenom} {client.nom}</span>
                        {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-xs text-center py-2">Aucun client</p>
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notaires" className="mt-2">
        <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
          <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                {formData.notaires_ids.length > 0 ? (
                  <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {formData.notaires_ids.map(notaireId => {
                      const notaire = clients.find(c => c.id === notaireId);
                      return renderClientCard(notaireId, notaire, 'notaires', {
                        backgroundColor: "bg-purple-500/20",
                        borderColor: "border-purple-500/30",
                        textColor: "text-purple-400",
                        hoverColor: "hover:bg-purple-500/30"
                      });
                    })}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">Aucun notaire sélectionné</div>
                )}
              </div>
              {!contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(true)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              )}
              {contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(false)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
              )}
            </div>
          </div>
          <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={notaireSearchTerm} onChange={(e) => setNotaireSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { setClientTypeForForm("Notaire"); setIsClientFormDialogOpen(true); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Notaires existants ({filteredNotairesForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredNotairesForSelector.slice(0, 15).map((notaire) => {
                const isSelected = formData.notaires_ids.includes(notaire.id);
                return (
                  <div key={notaire.id} onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      notaires_ids: prev.notaires_ids.includes(notaire.id)
                        ? prev.notaires_ids.filter(id => id !== notaire.id)
                        : [...prev.notaires_ids, notaire.id]
                    }));
                  }} className={`px-2 py-1.5 rounded text-xs cursor-pointer ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{notaire.prenom} {notaire.nom}</span>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="courtiers" className="mt-2">
        <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
          <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                {formData.courtiers_ids.length > 0 ? (
                  <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {formData.courtiers_ids.map(courtierId => {
                      const courtier = clients.find(c => c.id === courtierId);
                      return renderClientCard(courtierId, courtier, 'courtiers', {
                        backgroundColor: "bg-orange-500/20",
                        borderColor: "border-orange-500/30",
                        textColor: "text-orange-400",
                        hoverColor: "hover:bg-orange-500/30"
                      });
                    })}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">Aucun courtier sélectionné</div>
                )}
              </div>
              {!contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(true)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              )}
              {contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(false)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
              )}
            </div>
          </div>
          <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { setClientTypeForForm("Courtier immobilier"); setIsClientFormDialogOpen(true); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Courtiers existants ({filteredCourtiersForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredCourtiersForSelector.slice(0, 15).map((courtier) => {
                const isSelected = formData.courtiers_ids.includes(courtier.id);
                return (
                  <div key={courtier.id} onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      courtiers_ids: prev.courtiers_ids.includes(courtier.id)
                        ? prev.courtiers_ids.filter(id => id !== courtier.id)
                        : [...prev.courtiers_ids, courtier.id]
                    }));
                  }} className={`px-2 py-1.5 rounded text-xs cursor-pointer ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{courtier.prenom} {courtier.nom}</span>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="compagnies" className="mt-2">
        <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
          <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                {(formData.compagnies_ids || []).length > 0 ? (
                  <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    {formData.compagnies_ids.map(compagnieId => {
                      const compagnie = clients.find(c => c.id === compagnieId);
                      return renderClientCard(compagnieId, compagnie, 'compagnies', {
                        backgroundColor: "bg-green-500/20",
                        borderColor: "border-green-500/30",
                        textColor: "text-green-400",
                        hoverColor: "hover:bg-green-500/30"
                      });
                    })}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">Aucune compagnie sélectionnée</div>
                )}
              </div>
              {!contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(true)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </Button>
              )}
              {contactsListCollapsed && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setContactsListCollapsed(false)} className="text-slate-400 hover:text-white h-6 w-6 p-0">
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </Button>
              )}
            </div>
          </div>
          <div className={`border-l border-slate-700 pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { setClientTypeForForm("Compagnie"); setIsClientFormDialogOpen(true); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Compagnies existantes ({filteredCompagniesForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredCompagniesForSelector.slice(0, 15).map((compagnie) => {
                const isSelected = (formData.compagnies_ids || []).includes(compagnie.id);
                return (
                  <div key={compagnie.id} onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      compagnies_ids: (prev.compagnies_ids || []).includes(compagnie.id)
                        ? prev.compagnies_ids.filter(id => id !== compagnie.id)
                        : [...(prev.compagnies_ids || []), compagnie.id]
                    }));
                  }} className={`px-2 py-1.5 rounded text-xs cursor-pointer ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{compagnie.prenom} {compagnie.nom}</span>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}