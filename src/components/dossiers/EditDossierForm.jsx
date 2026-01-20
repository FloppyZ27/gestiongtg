import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, User, FileText, Briefcase, Plus, Search, Check, ChevronDown, ChevronUp, Trash2, FolderOpen, MapPin, MessageSquare, Clock, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import MandatTabs from "./MandatTabs";
import CommentairesSection from "./CommentairesSection";
import DocumentsStepForm from "../mandat/DocumentsStepForm";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  }
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  if (addr.province) parts.push(addr.province);
  if (addr.code_postal) parts.push(addr.code_postal);
  return parts.filter(p => p).join(', ');
};

export default function EditDossierForm({
  formData,
  setFormData,
  clients,
  lots,
  users,
  onSubmit,
  onCancel,
  updateMandat,
  addMandat,
  removeMandat,
  openLotSelector,
  removeLotFromMandat,
  openAddMinuteDialog,
  removeMinuteFromMandat,
  getLotById,
  setIsClientFormDialogOpen,
  setClientTypeForForm,
  setViewingClientDetails,
  calculerProchainNumeroDossier,
  editingDossier
}) {
  const [activeTabMandat, setActiveTabMandat] = useState("0");
  const [activeContactTab, setActiveContactTab] = useState("clients");
  const [contactsListCollapsed, setContactsListCollapsed] = useState(true);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const [lotTabExpanded, setLotTabExpanded] = useState(false);
  const [currentMandatIndexForLot, setCurrentMandatIndexForLot] = useState(null);
  const [sameLotsForAllMandats, setSameLotsForAllMandats] = useState(false);
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [mandatStepCollapsed, setMandatStepCollapsed] = useState(false);
  const [mapCollapsed, setMapCollapsed] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);
  const [currentMandatIndexForAddress, setCurrentMandatIndexForAddress] = useState(null);
  const [sameAddressForAllMandats, setSameAddressForAllMandats] = useState(false);
  const [showDeleteMandatConfirm, setShowDeleteMandatConfirm] = useState(false);
  const [mandatIndexToDelete, setMandatIndexToDelete] = useState(null);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(true);

  const clientsReguliers = clients.filter(c => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter(c => c.type_client === 'Notaire');
  const courtiers = clients.filter(c => c.type_client === 'Courtier immobilier');
  const compagnies = clients.filter(c => c.type_client === 'Compagnie');

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
  };

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

  return (
    <motion.div 
      className="flex flex-col h-[90vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 flex overflow-hidden">
        {/* Main content - 70% */}
        <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">{editingDossier ? "Modifier le dossier" : "Nouveau dossier"}</h2>
            {formData.numero_dossier && formData.arpenteur_geometre && (
              <p className="text-emerald-400 text-lg font-semibold mt-1 flex items-center gap-2 flex-wrap">
                <span>
                  {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                  {formData.clients_ids.length > 0 && getClientsNames(formData.clients_ids) !== "-" && (
                    <span> - {getClientsNames(formData.clients_ids)}</span>
                  )}
                </span>
                {formData.mandats && formData.mandats.length > 0 && (
                  <span className="flex gap-1">
                    {formData.mandats.slice(0, 3).map((m, idx) => m.type_mandat && (
                      <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                        {getAbbreviatedMandatType(m.type_mandat)}
                      </Badge>
                    ))}
                    {formData.mandats.length > 3 && (
                      <Badge className="bg-slate-700 text-slate-300 text-xs">
                        +{formData.mandats.length - 3}
                      </Badge>
                    )}
                  </span>
                )}
              </p>
            )}
          </div>

          <form id="edit-dossier-form" onSubmit={onSubmit} className="space-y-3">
            {/* Section Informations du dossier */}
            <Card className="border-slate-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
                onClick={() => setInfoDossierCollapsed(!infoDossierCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <CardTitle className="text-blue-300 text-base">Informations du dossier</CardTitle>
                    {formData.numero_dossier && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                      </Badge>
                    )}
                  </div>
                  {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>

              {!infoDossierCollapsed && (
                <CardContent className="pt-2 pb-3">
                  <div className="grid grid-cols-[33%_67%] gap-4">
                    {/* Colonne gauche - Informations de base */}
                    <div className="space-y-2 border-r border-slate-700 pr-4">
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                        <Select value={formData.arpenteur_geometre} onValueChange={(value) => {
                          const newNumeroDossier = !editingDossier && calculerProchainNumeroDossier ? calculerProchainNumeroDossier(value) : formData.numero_dossier;
                          setFormData({...formData, arpenteur_geometre: value, numero_dossier: newNumeroDossier});
                        }}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {ARPENTEURS.map((arpenteur) => (
                              <SelectItem key={arpenteur} value={arpenteur} className="text-white text-sm">{arpenteur}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Place d'affaire</Label>
                        <Select value={formData.place_affaire || ""} onValueChange={(value) => setFormData({...formData, place_affaire: value})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="Alma" className="text-white text-sm">Alma</SelectItem>
                            <SelectItem value="Saguenay" className="text-white text-sm">Saguenay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">N° de dossier <span className="text-red-400">*</span></Label>
                        <Input value={formData.numero_dossier} onChange={(e) => setFormData({...formData, numero_dossier: e.target.value})} required placeholder="Ex: 2024-001" className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Date d'ouverture <span className="text-red-400">*</span></Label>
                        <Input type="date" value={formData.date_ouverture} onChange={(e) => setFormData({...formData, date_ouverture: e.target.value})} required className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Statut</Label>
                        <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="Ouvert" className="text-white text-sm">Ouvert</SelectItem>
                            <SelectItem value="Fermé" className="text-white text-sm">Fermé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Colonne droite - Tabs Clients/Notaires/Courtiers */}
                    <div>
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
                            {/* Colonne gauche - Clients sélectionnés */}
                            <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                  {formData.clients_ids.length > 0 ? (
                                    <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                      {formData.clients_ids.map(clientId => {
                                        const client = clients.find(c => c.id === clientId);
                                        if (!client) return null;
                                        const currentPhone = client.telephones?.find(t => t.actuel)?.telephone || client.telephones?.[0]?.telephone || "";
                                        const currentEmail = client.courriels?.find(c => c.actuel)?.courriel || client.courriels?.[0]?.courriel || "";
                                        return (
                                          <div 
                                            key={clientId} 
                                            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-blue-500/30 transition-colors"
                                            onClick={() => {
                                              setViewingClientDetails(client);
                                            }}
                                          >
                                            <button 
                                              type="button" 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                removeClient(clientId, 'clients');
                                              }} 
                                              className="absolute right-1 top-1 hover:text-red-400 text-blue-300"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                            <div className="space-y-1 pr-4">
                                              <div className="font-semibold">{client.prenom} {client.nom}</div>
                                              {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
                                              {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
                                            </div>
                                          </div>
                                        );
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

                            {/* Colonne droite - Liste des clients existants */}
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

                        {/* Notaires Tab */}
                        <TabsContent value="notaires" className="mt-2">
                          <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                            <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                  {formData.notaires_ids.length > 0 ? (
                                    <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                      {formData.notaires_ids.map(notaireId => {
                                        const notaire = clients.find(c => c.id === notaireId);
                                        if (!notaire) return null;
                                        return (
                                          <div key={notaireId} className="bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-purple-500/30 transition-colors">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeClient(notaireId, 'notaires'); }} className="absolute right-1 top-1 hover:text-red-400 text-purple-300">
                                              <X className="w-3 h-3" />
                                            </button>
                                            <div className="space-y-1 pr-4">
                                              <div className="font-semibold">{notaire.prenom} {notaire.nom}</div>
                                            </div>
                                          </div>
                                        );
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

                        {/* Courtiers Tab */}
                        <TabsContent value="courtiers" className="mt-2">
                          <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                            <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                  {formData.courtiers_ids.length > 0 ? (
                                    <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                      {formData.courtiers_ids.map(courtierId => {
                                        const courtier = clients.find(c => c.id === courtierId);
                                        if (!courtier) return null;
                                        return (
                                          <div key={courtierId} className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-orange-500/30 transition-colors">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); removeClient(courtierId, 'courtiers'); }} className="absolute right-1 top-1 hover:text-red-400 text-orange-300">
                                              <X className="w-3 h-3" />
                                            </button>
                                            <div className="space-y-1 pr-4">
                                              <div className="font-semibold">{courtier.prenom} {courtier.nom}</div>
                                            </div>
                                          </div>
                                        );
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

                        {/* Compagnies Tab */}
                        <TabsContent value="compagnies" className="mt-2">
                          <div className={`grid ${contactsListCollapsed ? 'grid-cols-1' : 'grid-cols-[50%_50%]'} gap-4 transition-all`}>
                            <div className={`space-y-2 ${!contactsListCollapsed && 'border-r border-slate-700 pr-4'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                  {(formData.compagnies_ids || []).length > 0 ? (
                                    <div className={`grid ${contactsListCollapsed ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                                      {formData.compagnies_ids.map(compagnieId => {
                                        const compagnie = clients.find(c => c.id === compagnieId);
                                        if (!compagnie) return null;
                                        return (
                                          <div key={compagnieId} className="bg-green-500/20 text-green-400 border border-green-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-green-500/30 transition-colors">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, compagnies_ids: (prev.compagnies_ids || []).filter(id => id !== compagnieId)})); }} className="absolute right-1 top-1 hover:text-red-400 text-green-300">
                                              <X className="w-3 h-3" />
                                            </button>
                                            <div className="space-y-1 pr-4">
                                              <div className="font-semibold">{compagnie.prenom} {compagnie.nom}</div>
                                            </div>
                                          </div>
                                        );
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
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Section Mandats */}
            <Card className="border-slate-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-1.5 bg-orange-900/20"
                onClick={() => setMandatStepCollapsed(!mandatStepCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <CardTitle className="text-orange-300 text-base">Mandats</CardTitle>
                    {formData.mandats.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {formData.mandats.slice(0, 3).map((m, idx) => m.type_mandat && (
                          <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                            {getAbbreviatedMandatType(m.type_mandat)}
                          </Badge>
                        ))}
                        {formData.mandats.length > 3 && (
                          <Badge className="bg-slate-700 text-slate-300 text-xs">
                            +{formData.mandats.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {mandatStepCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>

              {!mandatStepCollapsed && (
                <CardContent className="pt-2 pb-3">
                  {formData.mandats.length > 0 ? (
                    <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat} className="w-full">
                      <div className="flex justify-between items-center mb-2 gap-3">
                        <div className="flex-1">
                          <TabsList className="bg-slate-800/30 border border-slate-700 h-auto justify-start p-1 rounded-lg inline-flex">
                            {formData.mandats.map((mandat, index) => (
                              <TabsTrigger
                                key={index}
                                value={index.toString()}
                                className="orange data-[state=active]:bg-orange-500/30 data-[state=active]:text-orange-300 data-[state=active]:border-b-2 data-[state=active]:border-orange-300 text-slate-300 px-3 py-1 text-xs font-medium rounded-md transition-all"
                              >
                                {mandat.type_mandat || `Mandat ${index + 1}`}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>
                        
                        <div className="flex gap-1">
                          {formData.mandats.length > 1 && (
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                const indexToRemove = parseInt(activeTabMandat);
                                if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ?")) {
                                  removeMandat(indexToRemove);
                                  setActiveTabMandat(Math.max(0, indexToRemove - 1).toString());
                                }
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button type="button" size="sm" onClick={addMandat} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-6 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                      </div>

                      {formData.mandats.map((mandat, index) => (
                        <TabsContent key={index} value={index.toString()} className="mt-2">
                          <MandatTabs
                            mandat={mandat}
                            mandatIndex={index}
                            updateMandat={updateMandat}
                            updateMandatAddress={() => {}}
                            openLotSelector={openLotSelector}
                            openAddMinuteDialog={openAddMinuteDialog}
                            openNewLotDialog={() => {}}
                            removeLotFromMandat={removeLotFromMandat}
                            removeMinuteFromMandat={removeMinuteFromMandat}
                            getLotById={getLotById}
                            users={users}
                            formStatut={formData.statut}
                            onRemoveMandat={null}
                            isReferenceDisabled={false}
                            isTTL={formData.ttl === "Oui"}
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="text-center py-4 text-slate-400 bg-slate-800/30 rounded-lg text-xs">Aucun mandat</div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Section Documents - Visible uniquement si arpenteur et numéro de dossier sont définis */}
            {!editingDossier && formData.numero_dossier && formData.arpenteur_geometre && (
              <DocumentsStepForm
                arpenteurGeometre={formData.arpenteur_geometre}
                numeroDossier={formData.numero_dossier}
                isCollapsed={documentsCollapsed}
                onToggleCollapse={() => setDocumentsCollapsed(!documentsCollapsed)}
                onDocumentsChange={() => {}}
              />
            )}
          </form>
        </div>

        {/* Sidebar - 30% */}
        <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
          {/* Carte de l'adresse */}
          <div 
            className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
            onClick={() => setMapCollapsed(!mapCollapsed)}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" />
              <h3 className="text-slate-300 text-base font-semibold">Carte</h3>
            </div>
            {mapCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>
          {!mapCollapsed && formData.mandats.length > 0 && formData.mandats[activeTabMandat]?.adresse_travaux && (
            formData.mandats[activeTabMandat].adresse_travaux.rue || formData.mandats[activeTabMandat].adresse_travaux.ville
          ) && (
            <div className="p-4 border-b border-slate-800 flex-shrink-0 max-h-[25%]">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden h-full">
                <div className="aspect-square w-full max-h-[calc(100%-28px)]">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                      `${formData.mandats[activeTabMandat]?.adresse_travaux?.numeros_civiques?.[0] || ''} ${formData.mandats[activeTabMandat]?.adresse_travaux?.rue || ''}, ${formData.mandats[activeTabMandat]?.adresse_travaux?.ville || ''}, ${formData.mandats[activeTabMandat]?.adresse_travaux?.province || 'Québec'}, Canada`
                    )}&zoom=15`}
                  />
                </div>
                <div className="p-2 bg-slate-800/80">
                  <p className="text-xs text-slate-300 truncate">
                    📍 {formData.mandats[activeTabMandat]?.adresse_travaux?.numeros_civiques?.[0]} {formData.mandats[activeTabMandat]?.adresse_travaux?.rue}, {formData.mandats[activeTabMandat]?.adresse_travaux?.ville}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Header Tabs Commentaires/Historique */}
          <div 
            className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <div className="flex items-center gap-2">
              {sidebarTab === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
              <h3 className="text-slate-300 text-base font-semibold">
                {sidebarTab === "commentaires" ? "Commentaires" : "Historique"}
              </h3>
            </div>
            {sidebarCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>

          {!sidebarCollapsed && (
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Commentaires
                </TabsTrigger>
                <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                  <Clock className="w-4 h-4 mr-1" />
                  Historique
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                <CommentairesSection dossierId={formData.id} dossierTemporaire={false} />
              </TabsContent>
              
              <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500">Aucune action enregistrée</p>
                    <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Boutons Annuler/Modifier tout en bas */}
      <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
        <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" form="edit-dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
          {editingDossier ? "Modifier" : "Créer"}
        </Button>
      </div>
    </motion.div>
  );
}