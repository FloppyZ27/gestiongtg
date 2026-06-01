import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  onClientCardClick: externalOnClientCardClick,
  setEditingClient,
  onNewClientClick
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
    if (!client) return;
    // Si une callback externe est fournie (ex: depuis OuvrirDossierDialog), l'utiliser
    if (externalOnClientCardClick) {
      externalOnClientCardClick(client);
      return;
    }
    // Sinon, comportement par défaut
    if (setEditingClient) setEditingClient(client);
    setClientTypeForForm(type === 'notaires' ? 'Notaire' : type === 'courtiers' ? 'Courtier immobilier' : type === 'compagnies' ? 'Compagnie' : 'Client');
    setTimeout(() => setIsClientFormDialogOpen(true), 0);
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
                ) : (formData.clients_texte && (formData.trello === "Oui" || formData.ttl === "Oui")) ? (
                  <div className="flex flex-wrap gap-1.5 p-1">
                    {formData.clients_texte.split(',').map((nom, i) => nom.trim() && (
                      <Badge key={i} className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs font-medium">
                        {nom.trim()}
                      </Badge>
                    ))}
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

          <div className={`pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { onNewClientClick?.("Client"); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Clients existants ({filteredClientsForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredClientsForSelector.length > 0 ? (
                filteredClientsForSelector.slice(0, 15).map((client) => {
                  const isSelected = formData.clients_ids.includes(client.id);
                  const clientPhone = client.telephones?.[0]?.telephone || '';
                  const clientEmail = client.courriels?.[0]?.courriel || '';
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
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{client.prenom} {client.nom}</span>
                          {(clientPhone || clientEmail) && (
                            <div className="text-slate-500 text-[11px] space-y-0.5">
                              {clientPhone && (
                                <div>
                                  📞 <a href={`tel:${clientPhone.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{clientPhone}</a>
                                </div>
                              )}
                              {clientEmail && (
                                <div>
                                  ✉️ <a href={`mailto:${clientEmail}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{clientEmail}</a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
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
          <div className={`pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={notaireSearchTerm} onChange={(e) => setNotaireSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { onNewClientClick?.("Notaire"); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Notaires existants ({filteredNotairesForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredNotairesForSelector.slice(0, 15).map((notaire) => {
                const isSelected = formData.notaires_ids.includes(notaire.id);
                const notairePhone = notaire.telephones?.[0]?.telephone || '';
                const notaireEmail = notaire.courriels?.[0]?.courriel || '';
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
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{notaire.prenom} {notaire.nom}</span>
                        {(notairePhone || notaireEmail) && (
                          <div className="text-slate-500 text-[11px] space-y-0.5">
                            {notairePhone && (
                              <div>
                                📞 <a href={`tel:${notairePhone.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{notairePhone}</a>
                              </div>
                            )}
                            {notaireEmail && (
                              <div>
                                ✉️ <a href={`mailto:${notaireEmail}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{notaireEmail}</a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
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
          <div className={`pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { onNewClientClick?.("Courtier immobilier"); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Courtiers existants ({filteredCourtiersForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredCourtiersForSelector.slice(0, 15).map((courtier) => {
                const isSelected = formData.courtiers_ids.includes(courtier.id);
                const courtierPhone = courtier.telephones?.[0]?.telephone || '';
                const courtierEmail = courtier.courriels?.[0]?.courriel || '';
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
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{courtier.prenom} {courtier.nom}</span>
                        {(courtierPhone || courtierEmail) && (
                          <div className="text-slate-500 text-[11px] space-y-0.5">
                            {courtierPhone && (
                              <div>
                                📞 <a href={`tel:${courtierPhone.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{courtierPhone}</a>
                              </div>
                            )}
                            {courtierEmail && (
                              <div>
                                ✉️ <a href={`mailto:${courtierEmail}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{courtierEmail}</a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
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
          <div className={`pl-3 pr-2 ${contactsListCollapsed ? 'hidden' : ''}`}>
            <div className="mb-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                <Input placeholder="Rechercher..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs" />
              </div>
              <Button type="button" size="sm" onClick={() => { onNewClientClick?.("Compagnie"); }} className="text-blue-400 hover:text-blue-300 h-6 w-6 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-slate-400 text-xs mb-2">Compagnies existantes ({filteredCompagniesForSelector.length})</p>
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredCompagniesForSelector.slice(0, 15).map((compagnie) => {
                const isSelected = (formData.compagnies_ids || []).includes(compagnie.id);
                const compagniePhone = compagnie.telephones?.[0]?.telephone || '';
                const compagnieEmail = compagnie.courriels?.[0]?.courriel || '';
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
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{compagnie.prenom} {compagnie.nom}</span>
                        {(compagniePhone || compagnieEmail) && (
                          <div className="text-slate-500 text-[11px] space-y-0.5">
                            {compagniePhone && (
                              <div>
                                📞 <a href={`tel:${compagniePhone.replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{compagniePhone}</a>
                              </div>
                            )}
                            {compagnieEmail && (
                              <div>
                                ✉️ <a href={`mailto:${compagnieEmail}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300 transition-colors">{compagnieEmail}</a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
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