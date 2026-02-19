import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, User, FileText, Briefcase, Plus, Search, Check, ChevronDown, ChevronUp, Trash2, FolderOpen, MapPin, MessageSquare, Clock, Loader2, Grid3x3, ArrowUp, ArrowDown, Trash, Phone, FileUp, CheckCircle2, XCircle, Edit, Receipt } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MandatTabs from "./MandatTabs";
import CommentairesSection from "./CommentairesSection";
import DocumentsStepForm from "../mandat/DocumentsStepForm";
import TarificationStepForm from "../mandat/TarificationStepForm";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

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

const getUserInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
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
  editingDossier,
  onOpenNewLotDialog,
  setEditingClient,
  setEditingLot,
  setNewLotForm,
  setLotActionLogs,
  allDossiers
}) {
  // Initialiser activeTabMandat avec l'index du mandat choisi
  React.useEffect(() => {
    if (editingDossier?.initialMandatIndex !== undefined) {
      setActiveTabMandat(editingDossier.initialMandatIndex.toString());
    }
  }, [editingDossier?.initialMandatIndex]);
  const [activeTabMandat, setActiveTabMandat] = useState((editingDossier?.initialMandatIndex || 0).toString());
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
  const [sameDatesForAllMandats, setSameDatesForAllMandats] = useState(false);
  const [showDeleteMandatConfirm, setShowDeleteMandatConfirm] = useState(false);
  const [mandatIndexToDelete, setMandatIndexToDelete] = useState(null);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(true);
  const [tarificationStepCollapsed, setTarificationStepCollapsed] = useState(true);
  const [minutesCollapsed, setMinutesCollapsed] = useState(true);
  const [activeMinuteMandat, setActiveMinuteMandat] = useState("0");
  const [newMinuteForm, setNewMinuteForm] = useState({});
  const [terrainCollapsed, setTerrainCollapsed] = useState(true);
  const [newTerrainFormCollapsed, setNewTerrainFormCollapsed] = useState(true);
  const [newTerrainForm, setNewTerrainForm] = useState({});
  const [minutesSortConfig, setMinutesSortConfig] = useState({ key: null, direction: 'asc' });
  const [retourAppelCollapsed, setRetourAppelCollapsed] = useState(true);
  const [retourAppelSortConfig, setRetourAppelSortConfig] = useState({ key: null, direction: 'asc' });
  const [newRetourAppel, setNewRetourAppel] = useState({
    date_appel: new Date().toISOString().split('T')[0],
    utilisateur_assigne: "",
    raison: "",
    statut: "Retour d'appel"
  });
  const [retoursAppel, setRetoursAppel] = useState([]);
  const [entreesTemps, setEntreesTemps] = useState([]);
  const [entreeTempsCollapsed, setEntreeTempsCollapsed] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [newMinuteFormCollapsed, setNewMinuteFormCollapsed] = useState(true);
  const [newRetourAppelFormCollapsed, setNewRetourAppelFormCollapsed] = useState(true);
  const [newEntreeTempsFormCollapsed, setNewEntreeTempsFormCollapsed] = useState(true);
  const [newEntreeTempsForm, setNewEntreeTempsForm] = useState({
    date: new Date().toISOString().split('T')[0],
    mandat: "",
    heures: "",
    tache: ""
  });
  const [showDeleteMinuteConfirm, setShowDeleteMinuteConfirm] = useState(false);
  const [minuteToDeleteInfo, setMinuteToDeleteInfo] = useState(null);
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [editingTerrainInfo, setEditingTerrainInfo] = useState(null);
  const [terrainForm, setTerrainForm] = useState({});
  const saveTimeoutRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (dossierData) => {
      if (!editingDossier) return;
      
      const updatedDossier = await base44.entities.Dossier.update(editingDossier.id, dossierData);
      return updatedDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  // Auto-save avec debounce
  useEffect(() => {
    if (editingDossier) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        autoSaveMutation.mutate(formData);
      }, 300);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, editingDossier]);

  const [actionLogs, setActionLogs] = useState([]);

  // Charger les logs d'actions pour le dossier
  React.useEffect(() => {
    if (editingDossier?.id) {
      base44.entities.ActionLog.filter({ entite: 'Dossier', entite_id: editingDossier.id }, '-created_date', 100)
        .then(setActionLogs)
        .catch(() => setActionLogs([]));
    } else {
      setActionLogs([]);
    }
  }, [editingDossier?.id]);

  const addActionLog = async (action, details) => {
    if (!editingDossier?.id) return;
    const log = await base44.entities.ActionLog.create({
      utilisateur_email: user?.email || "",
      utilisateur_nom: user?.full_name || "",
      action,
      entite: "Dossier",
      entite_id: editingDossier.id,
      details
    });
    setActionLogs(prev => [log, ...prev]);
  };

  // Charger les retours d'appel quand le dossier change
  React.useEffect(() => {
    if (editingDossier?.id) {
      base44.entities.RetourAppel.filter({ dossier_id: editingDossier.id }, '-date_appel')
        .then(setRetoursAppel)
        .catch(() => setRetoursAppel([]));
    } else {
      setRetoursAppel([]);
    }
  }, [editingDossier?.id]);

  // Charger les entrées de temps quand le dossier change
  React.useEffect(() => {
    if (editingDossier?.id) {
      base44.entities.EntreeTemps.filter({ dossier_id: editingDossier.id }, '-date')
        .then(setEntreesTemps)
        .catch(() => setEntreesTemps([]));
    } else {
      setEntreesTemps([]);
    }
  }, [editingDossier?.id]);

  const clientsReguliers = (clients || []).filter(c => c?.type_client === 'Client' || !c?.type_client);
  const notaires = (clients || []).filter(c => c?.type_client === 'Notaire');
  const courtiers = (clients || []).filter(c => c?.type_client === 'Courtier immobilier');
  const compagnies = (clients || []).filter(c => c?.type_client === 'Compagnie');

  const getClientById = (id) => (clients || []).find(c => c.id === id);

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

  const sections = [
    { id: "infos", label: "Informations", icon: FolderOpen, color: "text-blue-400" },
    { id: "mandats", label: "Mandats", icon: FileText, color: "text-orange-400" },
    { id: "tarification", label: "Tarification", icon: Receipt, color: "text-purple-400" },
    { id: "terrain", label: "Terrain", icon: MapPin, color: "text-amber-400" },
    { id: "minutes", label: "Minutes", icon: FileText, color: "text-cyan-400" },
    { id: "entree-temps", label: "Entrée de temps", icon: Clock, color: "text-lime-400" },
    { id: "retour-appel", label: "Retour d'appel", icon: Phone, color: "text-blue-400" },
    { id: "documents", label: "Documents", icon: FolderOpen, color: "text-yellow-400" }
  ];

  const scrollToSection = (sectionId) => {
    // Fermer toutes les sections
    setInfoDossierCollapsed(true);
    setMandatStepCollapsed(true);
    setTarificationStepCollapsed(true);
    setTerrainCollapsed(true);
    setMinutesCollapsed(true);
    setEntreeTempsCollapsed(true);
    setRetourAppelCollapsed(true);
    setDocumentsCollapsed(true);

    // Ouvrir la section cliquée
    setTimeout(() => {
      switch (sectionId) {
        case "infos":
          setInfoDossierCollapsed(false);
          break;
        case "mandats":
          setMandatStepCollapsed(false);
          break;
        case "tarification":
          setTarificationStepCollapsed(false);
          break;
        case "terrain":
          setTerrainCollapsed(false);
          break;
        case "minutes":
          setMinutesCollapsed(false);
          break;
        case "entree-temps":
          setEntreeTempsCollapsed(false);
          break;
        case "retour-appel":
          setRetourAppelCollapsed(false);
          break;
        case "documents":
          setDocumentsCollapsed(false);
          break;
      }

      // Scroll vers l'élément
      const element = document.querySelector(`[data-section="${sectionId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  };

  return (
    <motion.div 
      className="flex flex-col h-[90vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header sur toute la largeur */}
      <div className="sticky top-0 z-10 bg-slate-900 px-6 py-3 border-b border-slate-800 flex-shrink-0 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">{editingDossier ? "Modifier le dossier" : "Nouveau dossier"}</h2>
        
        {formData.numero_dossier && formData.arpenteur_geometre && (
          <div className={`text-lg font-semibold flex items-center gap-2 flex-wrap ${
            formData.arpenteur_geometre === "Samuel Guay" ? "text-red-400" :
            formData.arpenteur_geometre === "Pierre-Luc Pilote" ? "text-slate-400" :
            formData.arpenteur_geometre === "Frédéric Gilbert" ? "text-orange-400" :
            formData.arpenteur_geometre === "Dany Gaboury" ? "text-yellow-400" :
            formData.arpenteur_geometre === "Benjamin Larouche" ? "text-cyan-400" :
            "text-emerald-400"
          }`}>
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
          </div>
        )}
      </div>

      {/* Division avec sidebar de navigation */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de navigation - Icons only */}
        <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-2 flex-shrink-0 overflow-y-auto">
          <TooltipProvider>
            {sections.map((section) => (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors group relative"
                  >
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white text-sm">
                  {section.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Main content - 75% */}
        <div className="flex-[0_0_calc(75%-48px)] flex flex-col overflow-hidden border-r border-slate-800">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Section Informations du dossier */}
            <form id="edit-dossier-form" onSubmit={(e) => {
              if (!editingDossier) {
                onSubmit(e);
              } else {
                e.preventDefault();
              }
            }}>
              <Card className="border-slate-700 bg-slate-800/30 mb-3" data-section="infos">
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
                            <Select value={formData.place_affaire || ""} onValueChange={(value) => {
                              setFormData(prev => ({...prev, place_affaire: value}));
                            }}>
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
                                                 if (setEditingClient) {
                                                   setEditingClient(client);
                                                   setIsClientFormDialogOpen(true);
                                                 }
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
            </form>

            {/* Section Mandats */}
            <Card className="border-slate-700 bg-slate-800/30" data-section="mandats">
              <CardHeader 
                className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-1.5 bg-orange-900/20"
                onClick={() => setMandatStepCollapsed(!mandatStepCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
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
                    
                    {/* Barre de progression du mandat sélectionné */}
                    {editingDossier && formData.mandats.length > 0 && activeTabMandat !== undefined && formData.mandats[parseInt(activeTabMandat)] && (
                      <div className="flex-1 max-w-[200px] space-y-1 ml-auto mr-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-400">Progression</span>
                          <span className="text-xs font-bold text-emerald-400">
                            {(() => {
                              const TACHES_LIST = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
                              const tacheIndex = TACHES_LIST.indexOf(formData.mandats[parseInt(activeTabMandat)]?.tache_actuelle);
                              let rawProgress = 0;
                              if (tacheIndex >= 0 && TACHES_LIST.length > 1) {
                                rawProgress = (tacheIndex / (TACHES_LIST.length - 1)) * 95;
                              }
                              return Math.round(rawProgress / 5) * 5;
                            })()}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                            style={{ 
                              width: `${(() => {
                                const TACHES_LIST = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
                                const tacheIndex = TACHES_LIST.indexOf(formData.mandats[parseInt(activeTabMandat)]?.tache_actuelle);
                                let rawProgress = 0;
                                if (tacheIndex >= 0 && TACHES_LIST.length > 1) {
                                  rawProgress = (tacheIndex / (TACHES_LIST.length - 1)) * 95;
                                }
                                return Math.round(rawProgress / 5) * 5;
                              })()}%` 
                            }}
                          />
                        </div>
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
                            {formData.mandats.map((mandat, index) => {
                              const mandatColor = getMandatColor(mandat.type_mandat);
                              const isActive = activeTabMandat === index.toString();
                              return (
                                <TabsTrigger
                                  key={index}
                                  value={index.toString()}
                                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                    isActive ? mandatColor : 'text-slate-400'
                                  }`}
                                >
                                  <Badge className={`${mandatColor} border text-xs`}>
                                    {mandat.type_mandat ? getAbbreviatedMandatType(mandat.type_mandat) : `Mandat ${index + 1}`}
                                  </Badge>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </div>
                        
                        <div className="flex gap-1">
                          {formData.mandats.length > 1 && (
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setMandatIndexToDelete(parseInt(activeTabMandat));
                                setShowDeleteMandatConfirm(true);
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
                        <TabsContent key={index} value={index.toString()} className="mt-2 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Type de mandat</Label>
                              <Select value={mandat.type_mandat} onValueChange={(value) => updateMandat(index, 'type_mandat', value)}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {TYPES_MANDATS.map((type) => (
                                    <SelectItem key={type} value={type} className="text-white text-xs">{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                              <Select value={mandat.utilisateur_assigne || ""} onValueChange={(value) => updateMandat(index, 'utilisateur_assigne', value)}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {(users || []).map((u) => (
                                    <SelectItem key={u?.email} value={u?.email} className="text-white text-xs">{u?.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Tâche</Label>
                              <Select value={mandat.tache_actuelle || "Ouverture"} onValueChange={(value) => updateMandat(index, 'tache_actuelle', value)}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {TACHES.map((tache) => (
                                    <SelectItem key={tache} value={tache} className="text-white text-xs">{tache}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="border-t border-slate-600 my-2"></div>

                          <div className="grid grid-cols-[60%_1px_40%] gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                <div className="flex items-center gap-1.5">
                                  <Checkbox
                                    id={`sameAddressForAllMandats-${index}`}
                                    checked={sameAddressForAllMandats}
                                    onCheckedChange={(checked) => {
                                      setSameAddressForAllMandats(checked);
                                      if (checked) {
                                        const currentAddress = mandat.adresse_travaux;
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: currentAddress }))
                                        }));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`sameAddressForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous les mandats</Label>
                                </div>
                              </div>
                              
                              {/* Barre de recherche d'adresse */}
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3 z-10" />
                                <Input
                                  placeholder="Rechercher une adresse..."
                                  value={addressSearchQuery}
                                  onChange={async (e) => {
                                    const query = e.target.value;
                                    setAddressSearchQuery(query);
                                    setCurrentMandatIndexForAddress(index);

                                    if (addressSearchTimeout) clearTimeout(addressSearchTimeout);

                                    if (query.length >= 3) {
                                      const timeout = setTimeout(async () => {
                                        setIsSearchingAddress(true);
                                        try {
                                          const searchQuery = query.toLowerCase().includes('alma') ? query : `${query}, Alma, Québec`;
                                          const encodedQuery = encodeURIComponent(searchQuery);

                                          const response = await fetch(
                                            `https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/AdressesQuebec_Geocodage/GeocodeServer/findAddressCandidates?SingleLine=${encodedQuery}&f=json&outFields=*&maxLocations=10`
                                          );
                                          const data = await response.json();

                                          if (data.candidates && data.candidates.length > 0) {
                                            const formattedAddresses = data.candidates.map(candidate => {
                                              const attrs = candidate.attributes || {};
                                              const fullAddr = candidate.address || attrs.Match_addr || "";

                                              let numero_civique = attrs.AddNum || "";
                                              let rue = attrs.StName || "";
                                              let ville = attrs.City || attrs.Municipalit || "";
                                              let code_postal = attrs.Postal || "";

                                              if (!numero_civique || !rue) {
                                                const parts = fullAddr.split(',');
                                                if (parts.length > 0) {
                                                  const streetPart = parts[0].trim();
                                                  const numMatch = streetPart.match(/^(\d+[-\d]*)\s+(.+)$/);
                                                  if (numMatch) {
                                                    numero_civique = numMatch[1];
                                                    rue = numMatch[2];
                                                  } else {
                                                    rue = streetPart;
                                                  }
                                                }
                                                if (parts.length > 1 && !ville) {
                                                  ville = parts[1].trim();
                                                }
                                                if (!code_postal) {
                                                  const postalMatch = fullAddr.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)/i);
                                                  if (postalMatch) {
                                                    code_postal = postalMatch[1].toUpperCase();
                                                  }
                                                }
                                              }

                                              return {
                                                numero_civique,
                                                rue,
                                                ville,
                                                province: "QC",
                                                code_postal,
                                                full_address: fullAddr
                                              };
                                            });
                                            setAddressSuggestions(formattedAddresses);
                                          } else {
                                            setAddressSuggestions([]);
                                          }
                                        } catch (error) {
                                          console.error("Erreur recherche adresse:", error);
                                          setAddressSuggestions([]);
                                        } finally {
                                          setIsSearchingAddress(false);
                                        }
                                      }, 500);
                                      setAddressSearchTimeout(timeout);
                                    } else {
                                      setAddressSuggestions([]);
                                    }
                                  }}
                                  className="bg-slate-700 border-slate-600 text-white h-6 text-xs pl-7"
                                />
                                {isSearchingAddress && (
                                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-2 top-1/2 -translate-y-1/2" />
                                )}
                              </div>

                              {/* Suggestions d'adresses */}
                              {addressSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                  {addressSuggestions.map((suggestion, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        const newAddress = {
                                          numeros_civiques: [suggestion.numero_civique || ""],
                                          rue: suggestion.rue || "",
                                          ville: suggestion.ville || "",
                                          province: suggestion.province || "QC",
                                          code_postal: suggestion.code_postal || ""
                                        };

                                        if (sameAddressForAllMandats) {
                                          setFormData(prev => ({
                                            ...prev,
                                            mandats: prev.mandats.map(m => ({
                                              ...m,
                                              adresse_travaux: JSON.parse(JSON.stringify(newAddress))
                                            }))
                                          }));
                                        } else {
                                          updateMandat(currentMandatIndexForAddress, 'adresse_travaux', newAddress);
                                        }
                                        setAddressSearchQuery("");
                                        setAddressSuggestions([]);
                                      }}
                                      className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm text-slate-300 flex items-center gap-2 border-b border-slate-700 last:border-b-0"
                                    >
                                      <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <span>{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="grid grid-cols-[100px_1fr] gap-1">
                                <div className="space-y-0.5">
                                  <Label className="text-slate-500 text-[10px]">N° civique</Label>
                                  <Input 
                                    placeholder="123" 
                                    value={mandat.adresse_travaux?.numeros_civiques?.[0] || ""} 
                                    onChange={(e) => {
                                      const addr = mandat.adresse_travaux || {};
                                      const newAddress = { ...addr, numeros_civiques: [e.target.value] };
                                      if (sameAddressForAllMandats) {
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                        }));
                                      } else {
                                        updateMandat(index, 'adresse_travaux', newAddress);
                                      }
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-slate-500 text-[10px]">Rue</Label>
                                  <Input 
                                    placeholder="Rue principale" 
                                    value={mandat.adresse_travaux?.rue || ""} 
                                    onChange={(e) => {
                                      const addr = mandat.adresse_travaux || {};
                                      const newAddress = { ...addr, rue: e.target.value };
                                      if (sameAddressForAllMandats) {
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                        }));
                                      } else {
                                        updateMandat(index, 'adresse_travaux', newAddress);
                                      }
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <div className="space-y-0.5">
                                  <Label className="text-slate-500 text-[10px]">Ville</Label>
                                  <Input 
                                    placeholder="Ville" 
                                    value={mandat.adresse_travaux?.ville || ""} 
                                    onChange={(e) => {
                                      const addr = mandat.adresse_travaux || {};
                                      const newAddress = { ...addr, ville: e.target.value };
                                      if (sameAddressForAllMandats) {
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                        }));
                                      } else {
                                        updateMandat(index, 'adresse_travaux', newAddress);
                                      }
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-slate-500 text-[10px]">Code postal</Label>
                                  <Input 
                                    placeholder="G0A 1A0" 
                                    value={mandat.adresse_travaux?.code_postal || ""} 
                                    onChange={(e) => {
                                      const addr = mandat.adresse_travaux || {};
                                      const newAddress = { ...addr, code_postal: e.target.value };
                                      if (sameAddressForAllMandats) {
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                        }));
                                      } else {
                                        updateMandat(index, 'adresse_travaux', newAddress);
                                      }
                                    }}
                                    className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <Label className="text-slate-500 text-[10px]">Province</Label>
                                  <Select 
                                    value={mandat.adresse_travaux?.province || "QC"} 
                                    onValueChange={(value) => {
                                      const addr = mandat.adresse_travaux || {};
                                      const newAddress = { ...addr, province: value };
                                      if (sameAddressForAllMandats) {
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, adresse_travaux: newAddress }))
                                        }));
                                      } else {
                                        updateMandat(index, 'adresse_travaux', newAddress);
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                      {["QC", "AB", "BC", "PE", "MB", "NB", "NS", "NU", "ON", "SK", "NL", "NT", "YT"].map(prov => (
                                        <SelectItem key={prov} value={prov} className="text-white text-xs">{prov}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-600"></div>

                            <div className="space-y-2 pr-2">
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-slate-400 text-xs">Dates</Label>
                                <div className="flex items-center gap-1.5">
                                  <Checkbox
                                    id={`sameDatesForAllMandats-${index}`}
                                    checked={sameDatesForAllMandats}
                                    onCheckedChange={(checked) => {
                                      setSameDatesForAllMandats(checked);
                                      if (checked) {
                                        const currentDates = {
                                          date_signature: mandat.date_signature,
                                          date_debut_travaux: mandat.date_debut_travaux,
                                          date_livraison: mandat.date_livraison
                                        };
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ 
                                            ...m, 
                                            date_signature: currentDates.date_signature,
                                            date_debut_travaux: currentDates.date_debut_travaux,
                                            date_livraison: currentDates.date_livraison
                                          }))
                                        }));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`sameDatesForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous</Label>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Date de signature</Label>
                                <Input 
                                  type="date" 
                                  value={mandat.date_signature || ""} 
                                  onChange={(e) => {
                                    if (sameDatesForAllMandats) {
                                      setFormData(prev => ({
                                        ...prev,
                                        mandats: prev.mandats.map(m => ({ ...m, date_signature: e.target.value }))
                                      }));
                                    } else {
                                      updateMandat(index, 'date_signature', e.target.value);
                                    }
                                  }}
                                  className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Début des travaux</Label>
                                <Input 
                                  type="date" 
                                  value={mandat.date_debut_travaux || ""} 
                                  onChange={(e) => {
                                    if (sameDatesForAllMandats) {
                                      setFormData(prev => ({
                                        ...prev,
                                        mandats: prev.mandats.map(m => ({ ...m, date_debut_travaux: e.target.value }))
                                      }));
                                    } else {
                                      updateMandat(index, 'date_debut_travaux', e.target.value);
                                    }
                                  }}
                                  className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Date de livraison</Label>
                                <Input 
                                  type="date" 
                                  value={mandat.date_livraison || ""} 
                                  onChange={(e) => {
                                    if (sameDatesForAllMandats) {
                                      setFormData(prev => ({
                                        ...prev,
                                        mandats: prev.mandats.map(m => ({ ...m, date_livraison: e.target.value }))
                                      }));
                                    } else {
                                      updateMandat(index, 'date_livraison', e.target.value);
                                    }
                                  }}
                                  className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-slate-600 my-2"></div>

                          <div className={`grid ${lotTabExpanded && currentMandatIndexForLot === index ? 'grid-cols-[50%_50%]' : 'grid-cols-1'} gap-4 transition-all`}>
                            <div className={`space-y-2 ${lotTabExpanded && currentMandatIndexForLot === index ? 'border-r border-slate-700 pr-4' : ''}`}>
                              <div className="flex items-center justify-between">
                                <Label className="text-slate-400 text-xs">Lots</Label>
                                <div className="flex items-center gap-1.5">
                                  <Checkbox
                                    id={`sameLotsForAllMandats-${index}`}
                                    checked={sameLotsForAllMandats}
                                    onCheckedChange={(checked) => {
                                      setSameLotsForAllMandats(checked);
                                      if (checked) {
                                        const currentLots = mandat.lots || [];
                                        setFormData(prev => ({
                                          ...prev,
                                          mandats: prev.mandats.map(m => ({ ...m, lots: [...currentLots] }))
                                        }));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`sameLotsForAllMandats-${index}`} className="text-slate-400 text-[11px] cursor-pointer">Appliquer à tous</Label>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 bg-slate-800/30 rounded-lg p-2 min-h-[60px]">
                                  {mandat.lots && mandat.lots.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                      {mandat.lots.map((lotId) => {
                                        const lot = getLotById(lotId);
                                        return (
                                          <div 
                                           key={lotId} 
                                           className="bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded p-2 text-xs relative cursor-pointer hover:bg-orange-500/20 transition-colors"
                                           onClick={async () => {
                                             if (onOpenNewLotDialog && lot) {
                                               const logs = await base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: lot.id }, '-created_date');
                                               if (setEditingLot) setEditingLot(lot);
                                               if (setNewLotForm) {
                                                 setNewLotForm({
                                                   numero_lot: lot.numero_lot || "",
                                                   circonscription_fonciere: lot.circonscription_fonciere || "",
                                                   cadastre: lot.cadastre || "Québec",
                                                   rang: lot.rang || "",
                                                   types_operation: lot.types_operation || []
                                                 });
                                               }
                                               if (setLotActionLogs) setLotActionLogs(logs);
                                               onOpenNewLotDialog(index);
                                             }
                                           }}
                                          >
                                           <button 
                                             type="button" 
                                             onClick={(e) => {
                                               e.stopPropagation();
                                               removeLotFromMandat(index, lotId);
                                             }}
                                             className="absolute right-1 top-1 hover:text-red-400"
                                           >
                                             <X className="w-3 h-3" />
                                           </button>
                                           <div className="pr-5 space-y-0.5">
                                             <p className="font-semibold text-orange-400">{lot?.numero_lot || lotId}</p>
                                             <p className="text-slate-400">{lot?.circonscription_fonciere}</p>
                                             <p className="text-slate-500">
                                               {[lot?.rang, lot?.cadastre].filter(Boolean).join(' • ')}
                                             </p>
                                           </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-slate-500 text-xs text-center flex items-center justify-center h-full">
                                      Aucun lot sélectionné
                                    </div>
                                  )}
                                </div>
                                {!(lotTabExpanded && currentMandatIndexForLot === index) && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setCurrentMandatIndexForLot(index);
                                      setLotTabExpanded(true);
                                    }}
                                    className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                  >
                                    <ChevronDown className="w-4 h-4 rotate-90" />
                                  </Button>
                                )}
                                {lotTabExpanded && currentMandatIndexForLot === index && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setLotTabExpanded(false)}
                                    className="text-slate-400 hover:text-white h-6 w-6 p-0"
                                  >
                                    <ChevronUp className="w-4 h-4 rotate-90" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className={`border-l border-slate-700 pl-3 pr-2 ${!(lotTabExpanded && currentMandatIndexForLot === index) ? 'hidden' : ''}`}>
                              <div className="mb-2 flex gap-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                  <Input
                                    placeholder="Rechercher lot..."
                                    value={lotSearchTerm}
                                    onChange={(e) => setLotSearchTerm(e.target.value)}
                                    className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    setCurrentMandatIndexForLot(index);
                                    if (onOpenNewLotDialog) {
                                      onOpenNewLotDialog(index);
                                    }
                                  }}
                                  className="text-orange-400 hover:text-orange-300 h-6 w-6 p-0"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>

                              <p className="text-slate-400 text-xs mb-2">Lots existants ({(lots || []).filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase())).length})</p>
                              <div className="max-h-[200px] overflow-y-auto space-y-1">
                                {(lots || []).filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).length > 0 ? (
                                  (lots || []).filter(l => !lotSearchTerm || l.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || l.cadastre?.toLowerCase().includes(lotSearchTerm.toLowerCase())).slice(0, 20).map((lot) => {
                                    const isSelected = mandat.lots?.includes(lot.id);
                                    return (
                                      <div
                                        key={lot.id}
                                        onClick={() => {
                                          const currentLots = formData.mandats[index].lots || [];
                                          const lotIsSelected = currentLots.includes(lot.id);
                                          const newLots = lotIsSelected
                                            ? currentLots.filter(id => id !== lot.id)
                                            : [...currentLots, lot.id];

                                          if (sameLotsForAllMandats) {
                                            setFormData(prev => ({
                                              ...prev,
                                              mandats: prev.mandats.map(m => ({ ...m, lots: newLots }))
                                            }));
                                          } else {
                                            updateMandat(index, 'lots', newLots);
                                          }
                                        }}
                                        className={`px-2 py-1.5 rounded text-xs cursor-pointer transition-all ${
                                          isSelected ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:border-orange-500'
                                        }`}
                                      >
                                        <p className="text-white font-semibold text-xs truncate">
                                          {lot.numero_lot}
                                          {lot.rang && <span className="text-slate-300 font-normal"> • {lot.rang}</span>}
                                          {lot.cadastre && <span className="text-slate-300 font-normal"> • {lot.cadastre}</span>}
                                          <span className="text-slate-400 font-normal"> • {lot.circonscription_fonciere}</span>
                                          {isSelected && <Check className="w-3 h-3 ml-2 inline" />}
                                        </p>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-slate-500 text-xs text-center py-2">Aucun lot</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <Button type="button" size="sm" onClick={addMandat} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter un mandat
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Section Tarification */}
            <div data-section="tarification">
              <TarificationStepForm
                disabled={false}
                mandats={formData.mandats}
                onTarificationChange={(updatedMandats) => {
                  setFormData(prev => ({
                    ...prev,
                    mandats: updatedMandats
                  }));
                }}
                isCollapsed={tarificationStepCollapsed}
                onToggleCollapse={() => setTarificationStepCollapsed(!tarificationStepCollapsed)}
              />
            </div>

            {/* Section Terrain */}
            {formData.mandats.length > 0 && (
              <Card className="border-slate-700 bg-slate-800/30" data-section="terrain">
                <CardHeader 
                  className="cursor-pointer hover:bg-amber-900/40 transition-colors rounded-t-lg py-1.5 bg-amber-900/20"
                  onClick={() => {
                    const newState = !terrainCollapsed;
                    setTerrainCollapsed(newState);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <CardTitle className="text-amber-300 text-base">Terrain</CardTitle>
                    </div>
                    {terrainCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                </CardHeader>

                {!terrainCollapsed && (
                  <CardContent className="pt-2 pb-3">
                    {/* Formulaire d'ajout de terrain - en haut et collapsable */}
                    <div className="border-2 border-amber-500/30 rounded-lg mb-4 bg-amber-900/10">
                      <div 
                        className="cursor-pointer hover:bg-amber-900/40 transition-colors px-4 py-2 flex items-center justify-between"
                        onClick={() => setNewTerrainFormCollapsed(!newTerrainFormCollapsed)}
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">Ajouter un terrain</span>
                        </div>
                        {newTerrainFormCollapsed ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronUp className="w-4 h-4 text-amber-400" />}
                      </div>

                      {!newTerrainFormCollapsed && (
                        <div className="p-4 border-t border-purple-500/30 space-y-3">
                          {/* Première ligne : Mandat, Temps prévu, Donneur, Instruments, Technicien */}
                          <div className="grid grid-cols-5 gap-3">
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                              <Select 
                                value={newTerrainForm.mandatIndex?.toString() || ""}
                                onValueChange={(value) => setNewTerrainForm({...newTerrainForm, mandatIndex: parseInt(value)})}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {formData.mandats.map((mandat, index) => (
                                    <SelectItem key={index} value={index.toString()} className="text-white text-xs">
                                      {mandat.type_mandat || `Mandat ${index + 1}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Temps prévu</Label>
                              <Input 
                                placeholder="Ex: 2h30"
                                value={newTerrainForm.temps_prevu || ""}
                                onChange={(e) => setNewTerrainForm({...newTerrainForm, temps_prevu: e.target.value})}
                                className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Donneur</Label>
                              <Select 
                                value={newTerrainForm.donneur || ""}
                                onValueChange={(value) => setNewTerrainForm({...newTerrainForm, donneur: value})}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map((u) => (
                                    <SelectItem key={u?.email} value={u?.full_name} className="text-white text-xs">
                                      {u?.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Instruments</Label>
                              <Select 
                                value={newTerrainForm.instruments_requis || ""}
                                onValueChange={(value) => setNewTerrainForm({...newTerrainForm, instruments_requis: value})}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="Can-Net" className="text-white text-xs">Can-Net</SelectItem>
                                  <SelectItem value="RTK" className="text-white text-xs">RTK</SelectItem>
                                  <SelectItem value="CONV" className="text-white text-xs">CONV</SelectItem>
                                  <SelectItem value="3 GPS" className="text-white text-xs">3 GPS</SelectItem>
                                  <SelectItem value="Chaine" className="text-white text-xs">Chaine</SelectItem>
                                  <SelectItem value="SX10" className="text-white text-xs">SX10</SelectItem>
                                  <SelectItem value="NAVIS" className="text-white text-xs">NAVIS</SelectItem>
                                  <SelectItem value="Drône" className="text-white text-xs">Drône</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Technicien</Label>
                              <Select 
                                value={newTerrainForm.technicien || ""}
                                onValueChange={(value) => setNewTerrainForm({...newTerrainForm, technicien: value})}
                              >
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {(users || []).map((u) => (
                                    <SelectItem key={u?.email} value={`${u?.prenom || ''} ${u?.nom || ''}`.trim() || u?.full_name} className="text-white text-xs">
                                      {u?.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Deuxième ligne : Date limite cédule, Toggle rendez-vous, Date et heure rendez-vous */}
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Date limite cédule</Label>
                              <Input 
                                type="date"
                                value={newTerrainForm.date_limite_leve || ""}
                                onChange={(e) => setNewTerrainForm({...newTerrainForm, date_limite_leve: e.target.value})}
                                className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                              />
                            </div>
                            <div className="space-y-1 flex items-end">
                              <div className="flex items-center gap-2 h-8">
                                <Switch 
                                  checked={newTerrainForm.a_rendez_vous || false}
                                  onCheckedChange={(checked) => setNewTerrainForm({...newTerrainForm, a_rendez_vous: checked})}
                                  className="data-[state=checked]:bg-amber-400"
                                />
                                <Label className="text-slate-400 text-xs">Rendez-vous</Label>
                              </div>
                            </div>
                            {newTerrainForm.a_rendez_vous && (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-slate-400 text-xs">Date RDV</Label>
                                  <Input 
                                    type="date"
                                    value={newTerrainForm.date_rendez_vous || ""}
                                    onChange={(e) => setNewTerrainForm({...newTerrainForm, date_rendez_vous: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-slate-400 text-xs">Heure RDV</Label>
                                  <Input 
                                    type="time"
                                    value={newTerrainForm.heure_rendez_vous || ""}
                                    onChange={(e) => setNewTerrainForm({...newTerrainForm, heure_rendez_vous: e.target.value})}
                                    className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* Ligne Dossier simultané */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 flex items-end">
                              <div className="flex items-center gap-2 h-8">
                                <Switch 
                                  checked={newTerrainForm.a_dossier_simultane || false}
                                  onCheckedChange={(checked) => setNewTerrainForm({...newTerrainForm, a_dossier_simultane: checked, dossier_simultane: checked ? newTerrainForm.dossier_simultane : ""})}
                                  className="data-[state=checked]:bg-amber-400"
                                />
                                <Label className="text-slate-400 text-xs">Dossier à faire en même temps</Label>
                              </div>
                            </div>
                            {newTerrainForm.a_dossier_simultane && (
                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Dossier simultané</Label>
                                <Select 
                                  value={newTerrainForm.dossier_simultane || ""}
                                  onValueChange={(value) => setNewTerrainForm({...newTerrainForm, dossier_simultane: value})}
                                >
                                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    {(allDossiers || []).filter(d => {
                                      if (d.id === editingDossier?.id) return false;
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const hasTerrainMandat = d.mandats?.some(m => {
                                        if (!m.date_terrain) return true;
                                        const dateTerrain = new Date(m.date_terrain);
                                        dateTerrain.setHours(0, 0, 0, 0);
                                        return dateTerrain >= today;
                                      });
                                      return hasTerrainMandat;
                                    }).map((d) => (
                                      <SelectItem key={d.id} value={`${getArpenteurInitials(d.arpenteur_geometre)}${d.numero_dossier}`} className="text-white text-xs">
                                        {getArpenteurInitials(d.arpenteur_geometre)}{d.numero_dossier} - {(() => {
                                          const clientsNames = d.clients_ids?.map(cid => {
                                            const client = clients.find(c => c.id === cid);
                                            return client ? `${client.prenom} ${client.nom}` : "";
                                          }).filter(n => n).join(", ");
                                          return clientsNames || "Sans client";
                                        })()} ({d.mandats?.map(m => getAbbreviatedMandatType(m.type_mandat)).join(', ')})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          
                          <Button 
                            type="button"
                            size="sm"
                            onClick={() => {
                              if (newTerrainForm.mandatIndex === undefined || newTerrainForm.mandatIndex === null) {
                                alert("Veuillez sélectionner un mandat");
                                return;
                              }

                              const updatedMandats = [...formData.mandats];
                              
                              // Initialiser terrains_list si inexistant
                              if (!updatedMandats[newTerrainForm.mandatIndex].terrains_list) {
                                updatedMandats[newTerrainForm.mandatIndex].terrains_list = [];
                              }
                              
                              // Ajouter le nouveau terrain à la liste
                              updatedMandats[newTerrainForm.mandatIndex].terrains_list.push({
                                date_limite_leve: newTerrainForm.date_limite_leve || "",
                                instruments_requis: newTerrainForm.instruments_requis || "",
                                donneur: newTerrainForm.donneur || "",
                                technicien: newTerrainForm.technicien || "",
                                temps_prevu: newTerrainForm.temps_prevu || "",
                                a_rendez_vous: newTerrainForm.a_rendez_vous || false,
                                date_rendez_vous: newTerrainForm.date_rendez_vous || "",
                                heure_rendez_vous: newTerrainForm.heure_rendez_vous || "",
                                dossier_simultane: newTerrainForm.dossier_simultane || ""
                              });
                              
                              // Conserver aussi dans terrain pour rétrocompatibilité (dernier ajouté)
                              updatedMandats[newTerrainForm.mandatIndex].terrain = {
                                ...updatedMandats[newTerrainForm.mandatIndex].terrain,
                                date_limite_leve: newTerrainForm.date_limite_leve || "",
                                instruments_requis: newTerrainForm.instruments_requis || "",
                                donneur: newTerrainForm.donneur || "",
                                technicien: newTerrainForm.technicien || "",
                                temps_prevu: newTerrainForm.temps_prevu || "",
                                a_rendez_vous: newTerrainForm.a_rendez_vous || false,
                                date_rendez_vous: newTerrainForm.date_rendez_vous || "",
                                heure_rendez_vous: newTerrainForm.heure_rendez_vous || "",
                                dossier_simultane: newTerrainForm.dossier_simultane || ""
              };
                              
                              // Mettre automatiquement le statut_terrain à "en_verification" et la tâche à "Cédule"
                              updatedMandats[newTerrainForm.mandatIndex].statut_terrain = "en_verification";
                              updatedMandats[newTerrainForm.mandatIndex].tache_actuelle = "Cédule";

                              setFormData({...formData, mandats: updatedMandats});
                              setNewTerrainForm({});
                              setNewTerrainFormCollapsed(true);
                            }}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 h-8 text-xs mt-3 w-full border border-amber-500/30"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Ajouter le terrain
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Liste des terrains par mandat */}
                    {formData.mandats.some(m => m.terrains_list && m.terrains_list.length > 0) && (
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                              <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                              <TableHead className="text-slate-300 text-xs">Date limite cédule</TableHead>
                              <TableHead className="text-slate-300 text-xs">Date cédulé</TableHead>
                              <TableHead className="text-slate-300 text-xs">Équipe</TableHead>
                              <TableHead className="text-slate-300 text-xs">Instruments</TableHead>
                              <TableHead className="text-slate-300 text-xs">Donneur</TableHead>
                              <TableHead className="text-slate-300 text-xs">Technicien</TableHead>
                              <TableHead className="text-slate-300 text-xs">Temps prévu</TableHead>
                              <TableHead className="text-slate-300 text-xs w-20">Actions</TableHead>
                              </TableRow>
                              </TableHeader>
                              <TableBody>
                              {formData.mandats.flatMap((mandat, mandatIndex) => {
                              if (!mandat.terrains_list || mandat.terrains_list.length === 0) {
                                return [];
                              }
                              return mandat.terrains_list.map((terrain, terrainIndex) => (
                                <TableRow key={`${mandatIndex}-${terrainIndex}`} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell>
                                    <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                                      {getAbbreviatedMandatType(mandat.type_mandat) || `Mandat ${mandatIndex + 1}`}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs">
                                    {terrain.date_limite_leve ? format(new Date(terrain.date_limite_leve), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs">
                                    {terrain.date_cedulee ? format(new Date(terrain.date_cedulee), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.equipe_assignee || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.instruments_requis || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.donneur || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.technicien || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.temps_prevu || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          setEditingTerrainInfo({ mandatIndex, terrainIndex, terrain, mandat });
                                          setTerrainForm({
                                            date_limite_leve: terrain.date_limite_leve || "",
                                            instruments_requis: terrain.instruments_requis || "",
                                            a_rendez_vous: terrain.a_rendez_vous || false,
                                            date_rendez_vous: terrain.date_rendez_vous || "",
                                            heure_rendez_vous: terrain.heure_rendez_vous || "",
                                            donneur: terrain.donneur || "",
                                            technicien: terrain.technicien || "",
                                            dossier_simultane: terrain.dossier_simultane || "",
                                            temps_prevu: terrain.temps_prevu || "",
                                            notes: terrain.notes || ""
                                          });
                                          setIsTerrainDialogOpen(true);
                                        }}
                                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button 
                                        type="button" 
                                        onClick={() => {
                                          const updatedMandats = [...formData.mandats];
                                          updatedMandats[mandatIndex].terrains_list = updatedMandats[mandatIndex].terrains_list.filter((_, idx) => idx !== terrainIndex);

                                          // Si on supprime le dernier terrain, réinitialiser les champs
                                          if (updatedMandats[mandatIndex].terrains_list.length === 0) {
                                            updatedMandats[mandatIndex].statut_terrain = null;
                                            updatedMandats[mandatIndex].date_terrain = null;
                                            updatedMandats[mandatIndex].equipe_assignee = null;
                                          }

                                          setFormData({...formData, mandats: updatedMandats});
                                        }}
                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                      >
                                        <Trash className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ));
                              })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Section Minutes */}
            {formData.mandats.length > 0 && (
              <Card className="border-slate-700 bg-slate-800/30" data-section="minutes">
                <CardHeader 
                  className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-1.5 bg-cyan-900/20"
                  onClick={() => setMinutesCollapsed(!minutesCollapsed)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <CardTitle className="text-cyan-300 text-base">Minutes</CardTitle>
                      {formData.mandats.reduce((total, m) => total + (m.minutes_list?.length || 0), 0) > 0 && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                          {formData.mandats.reduce((total, m) => total + (m.minutes_list?.length || 0), 0)} minute(s)
                        </Badge>
                      )}
                    </div>
                    {minutesCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                </CardHeader>

                {!minutesCollapsed && (
                   <CardContent className="pt-2 pb-3">
                     {/* Formulaire d'ajout des minutes - en haut et collapsable */}
                     <div className="border-2 border-cyan-500/30 rounded-lg mb-4 bg-cyan-900/10">
                       <div 
                         className="cursor-pointer hover:bg-cyan-900/40 transition-colors px-4 py-2 flex items-center justify-between"
                         onClick={() => setNewMinuteFormCollapsed(!newMinuteFormCollapsed)}
                       >
                         <div className="flex items-center gap-2">
                           <Plus className="w-4 h-4 text-cyan-400" />
                           <span className="text-xs font-semibold text-cyan-400">Ajouter une minute</span>
                         </div>
                         {newMinuteFormCollapsed ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronUp className="w-4 h-4 text-cyan-400" />}
                       </div>

                       {!newMinuteFormCollapsed && (
                         <div className="p-4 border-t border-cyan-500/30">
                           <div className={`grid ${newMinuteForm.type_minute === "Remplace" || newMinuteForm.type_minute === "Corrige" ? "grid-cols-5" : "grid-cols-4"} gap-3`}>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                               <Select 
                                 value={newMinuteForm.mandatIndex?.toString() || ""}
                                 onValueChange={(value) => setNewMinuteForm({...newMinuteForm, mandatIndex: parseInt(value)})}
                               >
                                 <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                   <SelectValue placeholder="Sélectionner" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-slate-800 border-slate-700">
                                   {formData.mandats.map((mandat, index) => (
                                     <SelectItem key={index} value={index.toString()} className="text-white text-xs">
                                       {mandat.type_mandat || `Mandat ${index + 1}`}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Numéro de minute <span className="text-red-400">*</span></Label>
                               <Input 
                                 placeholder="Ex: 12345"
                                 value={newMinuteForm.minute || ""}
                                 onChange={(e) => setNewMinuteForm({...newMinuteForm, minute: e.target.value})}
                                 className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                               />
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Date de minute</Label>
                               <Input 
                                 type="date"
                                 value={newMinuteForm.date_minute || ""}
                                 onChange={(e) => setNewMinuteForm({...newMinuteForm, date_minute: e.target.value})}
                                 className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                               />
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Type</Label>
                               <Select 
                                 value={newMinuteForm.type_minute || "Initiale"}
                                 onValueChange={(value) => setNewMinuteForm({...newMinuteForm, type_minute: value})}
                               >
                                 <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                   <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="bg-slate-800 border-slate-700">
                                   <SelectItem value="Initiale" className="text-white text-xs">Initiale</SelectItem>
                                   <SelectItem value="Remplace" className="text-white text-xs">Remplace</SelectItem>
                                   <SelectItem value="Corrige" className="text-white text-xs">Corrige</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                             {(newMinuteForm.type_minute === "Remplace" || newMinuteForm.type_minute === "Corrige") && (
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">Minute référence</Label>
                                 <Select 
                                   value={newMinuteForm.minute_reference || ""}
                                   onValueChange={(value) => setNewMinuteForm({...newMinuteForm, minute_reference: value})}
                                 >
                                   <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                     <SelectValue placeholder="Sélectionner" />
                                   </SelectTrigger>
                                   <SelectContent className="bg-slate-800 border-slate-700">
                                     {newMinuteForm.mandatIndex !== undefined && formData.mandats[newMinuteForm.mandatIndex]?.minutes_list?.map((minute, idx) => (
                                       <SelectItem key={idx} value={minute.minute} className="text-white text-xs">
                                         {minute.minute}
                                       </SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                             )}
                           </div>
                           <Button 
                             type="button"
                             size="sm"
                             onClick={() => {
                               if (newMinuteForm.mandatIndex === undefined || newMinuteForm.mandatIndex === null) {
                                 alert("Veuillez sélectionner un mandat");
                                 return;
                               }

                               if (!newMinuteForm.minute) {
                                 alert("Veuillez entrer un numéro de minute");
                                 return;
                               }

                               const newMinute = {
                                 minute: newMinuteForm.minute,
                                 date_minute: newMinuteForm.date_minute || null,
                                 type_minute: newMinuteForm.type_minute || "Initiale"
                               };

                               if ((newMinuteForm.type_minute === "Remplace" || newMinuteForm.type_minute === "Corrige") && newMinuteForm.minute_reference) {
                                 newMinute.minute_reference = newMinuteForm.minute_reference;
                               }

                               const updatedMandats = [...formData.mandats];
                               if (!updatedMandats[newMinuteForm.mandatIndex].minutes_list) {
                                 updatedMandats[newMinuteForm.mandatIndex].minutes_list = [];
                               }
                               updatedMandats[newMinuteForm.mandatIndex].minutes_list.push(newMinute);

                               setFormData({...formData, mandats: updatedMandats});
                               setNewMinuteForm({});
                               setNewMinuteFormCollapsed(true);
                             }}
                             className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 h-8 text-xs mt-3 w-full border border-cyan-500/30"
                           >
                             <Plus className="w-3 h-3 mr-1" />
                             Ajouter la minute
                           </Button>
                         </div>
                       )}
                     </div>

                     {formData.mandats.some(m => m.minutes_list && m.minutes_list.length > 0) && (
                      <div className="space-y-2 mb-4">
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead 
                                  className="text-slate-300 cursor-pointer hover:text-slate-200 transition-colors"
                                  onClick={() => {
                                    setMinutesSortConfig({
                                      key: 'minute',
                                      direction: minutesSortConfig.key === 'minute' && minutesSortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    N° Minute
                                    {minutesSortConfig.key === 'minute' && (
                                      minutesSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-slate-300 cursor-pointer hover:text-slate-200 transition-colors"
                                  onClick={() => {
                                    setMinutesSortConfig({
                                      key: 'mandat',
                                      direction: minutesSortConfig.key === 'mandat' && minutesSortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Mandat
                                    {minutesSortConfig.key === 'mandat' && (
                                      minutesSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-slate-300 cursor-pointer hover:text-slate-200 transition-colors"
                                  onClick={() => {
                                    setMinutesSortConfig({
                                      key: 'date',
                                      direction: minutesSortConfig.key === 'date' && minutesSortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Date
                                    {minutesSortConfig.key === 'date' && (
                                      minutesSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-slate-300 cursor-pointer hover:text-slate-200 transition-colors"
                                  onClick={() => {
                                    setMinutesSortConfig({
                                      key: 'type',
                                      direction: minutesSortConfig.key === 'type' && minutesSortConfig.direction === 'asc' ? 'desc' : 'asc'
                                    });
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Type
                                    {minutesSortConfig.key === 'type' && (
                                      minutesSortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead className="text-slate-300">Minute référence</TableHead>
                                <TableHead className="text-slate-300 w-12">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                const allMinutes = [];
                                formData.mandats.forEach((mandat, mandatIndex) => {
                                  if (mandat.minutes_list && mandat.minutes_list.length > 0) {
                                    mandat.minutes_list.forEach((minute, minuteIndex) => {
                                      allMinutes.push({
                                        ...minute,
                                        mandatIndex,
                                        minuteIndex,
                                        mandatName: mandat.type_mandat || `Mandat ${mandatIndex + 1}`
                                      });
                                    });
                                  }
                                });

                                // Tri
                                if (minutesSortConfig.key) {
                                  allMinutes.sort((a, b) => {
                                    let aVal, bVal;
                                    if (minutesSortConfig.key === 'minute') {
                                      aVal = a.minute || '';
                                      bVal = b.minute || '';
                                    } else if (minutesSortConfig.key === 'mandat') {
                                      aVal = a.mandatName;
                                      bVal = b.mandatName;
                                    } else if (minutesSortConfig.key === 'date') {
                                      aVal = a.date_minute || '';
                                      bVal = b.date_minute || '';
                                    } else if (minutesSortConfig.key === 'type') {
                                      aVal = a.type_minute || '';
                                      bVal = b.type_minute || '';
                                    }

                                    if (aVal < bVal) return minutesSortConfig.direction === 'asc' ? -1 : 1;
                                    if (aVal > bVal) return minutesSortConfig.direction === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                return allMinutes.map((minute) => (
                                  <TableRow key={`${minute.mandatIndex}-${minute.minuteIndex}`} className="hover:bg-slate-800/30 border-slate-800">
                                    <TableCell className="text-slate-300 font-medium">{minute.minute}</TableCell>
                                    <TableCell>
                                      <Badge className={`${getMandatColor(formData.mandats[minute.mandatIndex].type_mandat)} border text-xs`}>
                                        {getAbbreviatedMandatType(formData.mandats[minute.mandatIndex].type_mandat) || minute.mandatName}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300">
                                      {minute.date_minute ? format(new Date(minute.date_minute), "d MMMM yyyy", { locale: fr }) : "-"}
                                    </TableCell>
                                    <TableCell className="text-slate-300">{minute.type_minute || "Initiale"}</TableCell>
                                    <TableCell className="text-slate-300">{minute.minute_reference || "-"}</TableCell>
                                    <TableCell className="text-right">
                                      <button 
                                         type="button" 
                                         onClick={() => {
                                           setMinuteToDeleteInfo(minute);
                                           setShowDeleteMinuteConfirm(true);
                                         }}
                                         className="text-slate-400 hover:text-red-400 transition-colors"
                                       >
                                         <Trash className="w-4 h-4" />
                                       </button>
                                    </TableCell>
                                  </TableRow>
                                ));
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Section Entrée de temps */}
              {editingDossier && (
                <Card className="border-slate-700 bg-slate-800/30" data-section="entree-temps">
                 <CardHeader 
                   className="cursor-pointer hover:bg-lime-900/40 transition-colors rounded-t-lg py-1.5 bg-lime-900/20"
                   onClick={() => setEntreeTempsCollapsed(!entreeTempsCollapsed)}
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-6 h-6 rounded-full bg-lime-500/30 flex items-center justify-center">
                         <Clock className="w-3.5 h-3.5 text-lime-400" />
                       </div>
                       <CardTitle className="text-lime-300 text-base">Entrée de temps</CardTitle>
                       {entreesTemps.length > 0 && (
                         <>
                           {formData.mandats.map((mandat, idx) => {
                             const totalHeures = entreesTemps
                               .filter(e => e.mandat === mandat.type_mandat)
                               .reduce((sum, e) => sum + (e.heures || 0), 0);
                             return totalHeures > 0 && (
                               <Badge key={idx} className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                                 {getAbbreviatedMandatType(mandat.type_mandat)}: {totalHeures}h
                               </Badge>
                             );
                           })}
                           <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-xs font-semibold">
                             Total: {entreesTemps.reduce((sum, e) => sum + (e.heures || 0), 0)}h
                           </Badge>
                         </>
                       )}
                     </div>
                     {entreeTempsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                   </div>
                 </CardHeader>

                 {!entreeTempsCollapsed && (
                   <CardContent className="pt-2 pb-3 space-y-4">
                     {/* Formulaire d'ajout des entrées de temps - en haut et collapsable */}
                     <div className="border-2 border-lime-500/30 rounded-lg mb-4 bg-lime-900/10">
                       <div 
                         className="cursor-pointer hover:bg-lime-900/40 transition-colors px-4 py-2 flex items-center justify-between"
                         onClick={() => setNewEntreeTempsFormCollapsed(!newEntreeTempsFormCollapsed)}
                       >
                         <div className="flex items-center gap-2">
                           <Plus className="w-4 h-4 text-lime-400" />
                           <span className="text-xs font-semibold text-lime-400">Ajouter une entrée de temps</span>
                         </div>
                         {newEntreeTempsFormCollapsed ? <ChevronDown className="w-4 h-4 text-lime-400" /> : <ChevronUp className="w-4 h-4 text-lime-400" />}
                       </div>

                       {!newEntreeTempsFormCollapsed && (
                         <div className="p-4 border-t border-lime-500/30 space-y-3">
                           <div className="grid grid-cols-4 gap-3">
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                               <Input 
                                 type="date"
                                 value={newEntreeTempsForm.date}
                                 onChange={(e) => setNewEntreeTempsForm({...newEntreeTempsForm, date: e.target.value})}
                                 className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                               />
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                               <Select value={newEntreeTempsForm.mandat} onValueChange={(value) => setNewEntreeTempsForm({...newEntreeTempsForm, mandat: value})}>
                                 <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                   <SelectValue placeholder="Sélectionner" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-slate-800 border-slate-700">
                                   {(formData?.mandats || []).map((mandat, index) => (
                                      <SelectItem key={index} value={mandat?.type_mandat} className="text-white text-xs">
                                        {mandat?.type_mandat || `Mandat ${index + 1}`}
                                      </SelectItem>
                                    ))}
                                 </SelectContent>
                               </Select>
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Temps <span className="text-red-400">*</span></Label>
                               <Input 
                                 type="number"
                                 step="0.25"
                                 min="0"
                                 placeholder="Ex: 2.5"
                                 value={newEntreeTempsForm.heures}
                                 onChange={(e) => setNewEntreeTempsForm({...newEntreeTempsForm, heures: e.target.value})}
                                 className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                               />
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Tâche accomplie <span className="text-red-400">*</span></Label>
                               <Select value={newEntreeTempsForm.tache} onValueChange={(value) => setNewEntreeTempsForm({...newEntreeTempsForm, tache: value})}>
                                 <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                   <SelectValue placeholder="Sélectionner" />
                                 </SelectTrigger>
                                 <SelectContent className="bg-slate-800 border-slate-700">
                                   {TACHES.map((tache) => (
                                     <SelectItem key={tache} value={tache} className="text-white text-xs">
                                       {tache}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>
                           <Button 
                             type="button"
                             size="sm"
                             onClick={async () => {
                               if (!newEntreeTempsForm.date) {
                                 alert("Veuillez sélectionner une date");
                                 return;
                               }
                               if (!newEntreeTempsForm.mandat) {
                                 alert("Veuillez sélectionner un mandat");
                                 return;
                               }
                               if (!newEntreeTempsForm.heures) {
                                 alert("Veuillez entrer le temps");
                                 return;
                               }
                               if (!newEntreeTempsForm.tache) {
                                 alert("Veuillez sélectionner une tâche");
                                 return;
                               }

                               const createdEntree = await base44.entities.EntreeTemps.create({
                                 dossier_id: editingDossier.id,
                                 date: newEntreeTempsForm.date,
                                 mandat: newEntreeTempsForm.mandat,
                                 heures: parseFloat(newEntreeTempsForm.heures),
                                 tache: newEntreeTempsForm.tache,
                                 utilisateur_email: user?.email || ""
                               });

                               addActionLog("Entrée de temps", `${parseFloat(newEntreeTempsForm.heures)}h - ${newEntreeTempsForm.tache} - ${newEntreeTempsForm.mandat}`);
                               setEntreesTemps(prev => [createdEntree, ...prev]);
                               setNewEntreeTempsForm({
                                 date: new Date().toISOString().split('T')[0],
                                 mandat: "",
                                 heures: "",
                                 tache: ""
                               });
                               setNewEntreeTempsFormCollapsed(true);
                             }}
                             className="bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 h-8 text-xs w-full border border-lime-500/30"
                           >
                             <Plus className="w-3 h-3 mr-1" />
                             Ajouter l'entrée
                           </Button>
                         </div>
                       )}
                     </div>
                    {entreesTemps.length > 0 ? (
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                              <TableHead className="text-slate-300 text-xs">Date</TableHead>
                              <TableHead className="text-slate-300 text-xs">Heures</TableHead>
                              <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                              <TableHead className="text-slate-300 text-xs">Tâche</TableHead>
                              <TableHead className="text-slate-300 text-xs">Utilisateur</TableHead>
                              <TableHead className="text-slate-300 text-xs w-12">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entreesTemps.map((entree) => (
                              <TableRow key={entree.id} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-slate-300 text-xs">
                                  {entree.date ? format(new Date(entree.date), "dd MMM yyyy", { locale: fr }) : "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-xs font-medium">
                                  {entree.heures}h
                                </TableCell>
                                <TableCell className="text-slate-300 text-xs">
                                  <Badge className={`${getMandatColor(entree.mandat)} border text-xs`}>
                                    {getAbbreviatedMandatType(entree.mandat) || "-"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-xs">
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                    {entree.tache || "-"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <span>
                                      {getUserInitials((users || []).find(u => u?.email === entree.utilisateur_email)?.full_name) || "-"}
                                    </span>
                                    <Avatar className="w-6 h-6 border-2 border-emerald-500/50 flex-shrink-0">
                                      <AvatarImage src={(users || []).find(u => u?.email === entree.utilisateur_email)?.photo_url} />
                                      <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                        {getUserInitials((users || []).find(u => u?.email === entree.utilisateur_email)?.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      setMinuteToDeleteInfo({entreeTempsId: entree.id});
                                      setShowDeleteMinuteConfirm(true);
                                    }}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                </TableCell>
                                </TableRow>
                                ))}
                                </TableBody>
                                </Table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-sm">Aucune entrée de temps</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Section Retour d'appel */}
             {editingDossier && (
               <Card className="border-slate-700 bg-slate-800/30" data-section="retour-appel">
                <CardHeader 
                  className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
                  onClick={() => setRetourAppelCollapsed(!retourAppelCollapsed)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <CardTitle className="text-blue-300 text-base">Retour d'appel</CardTitle>
                      {retoursAppel.length > 0 && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          {retoursAppel.length} appel{retoursAppel.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {retourAppelCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                </CardHeader>

                {!retourAppelCollapsed && (
                   <CardContent className="pt-4 pb-3 space-y-4">
                     {/* Formulaire d'ajout des retours d'appel - en haut et collapsable */}
                     <div className="border-2 border-blue-500/30 rounded-lg mb-4 bg-blue-900/10">
                       <div 
                         className="cursor-pointer hover:bg-blue-900/40 transition-colors px-4 py-2 flex items-center justify-between"
                         onClick={() => setNewRetourAppelFormCollapsed(!newRetourAppelFormCollapsed)}
                       >
                         <div className="flex items-center gap-2">
                           <Plus className="w-4 h-4 text-blue-400" />
                           <span className="text-xs font-semibold text-blue-400">Ajouter un retour d'appel</span>
                         </div>
                         {newRetourAppelFormCollapsed ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronUp className="w-4 h-4 text-blue-400" />}
                       </div>

                       {!newRetourAppelFormCollapsed && (
                         <div className="p-4 border-t border-blue-500/30 space-y-3">
                           <div className="grid grid-cols-[1fr_1fr] gap-3">
                             <div className="space-y-3">
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">Date de l'appel <span className="text-red-400">*</span></Label>
                                 <Input 
                                   type="date"
                                   value={newRetourAppel.date_appel}
                                   onChange={(e) => setNewRetourAppel({...newRetourAppel, date_appel: e.target.value})}
                                   className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                                 />
                               </div>
                               <div className="space-y-1">
                                 <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                                 <Select 
                                   value={newRetourAppel.utilisateur_assigne}
                                   onValueChange={(value) => setNewRetourAppel({...newRetourAppel, utilisateur_assigne: value})}
                                 >
                                   <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                                     <SelectValue placeholder="Sélectionner" />
                                   </SelectTrigger>
                                   <SelectContent className="bg-slate-800 border-slate-700">
                                     {(users || []).map((u) => (
                                       <SelectItem key={u.email} value={u.email} className="text-white text-xs">{u.full_name}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                             <div className="flex flex-col">
                               <Label className="text-slate-400 text-xs mb-1">Raison de l'appel <span className="text-red-400">*</span></Label>
                               <textarea 
                                 placeholder="Notes sur l'appel..."
                                 value={newRetourAppel.raison}
                                 onChange={(e) => setNewRetourAppel({...newRetourAppel, raison: e.target.value})}
                                 className="bg-slate-700 border border-slate-600 text-white flex-1 text-xs p-2 rounded resize-none"
                               />
                             </div>
                           </div>
                           <Button 
                             type="button"
                             size="sm"
                             onClick={async () => {
                               if (!newRetourAppel.raison) {
                                 alert("Veuillez entrer la raison de l'appel");
                                 return;
                               }

                               const createdRetour = await base44.entities.RetourAppel.create({
                                 dossier_id: editingDossier.id,
                                 date_appel: newRetourAppel.date_appel,
                                 utilisateur_assigne: newRetourAppel.utilisateur_assigne || null,
                                 raison: newRetourAppel.raison,
                                 statut: "Retour d'appel"
                               });

                               setRetoursAppel(prev => [createdRetour, ...prev]);
                               setFormData({...formData, statut: "Retour d'appel"});

                               if (newRetourAppel.utilisateur_assigne) {
                                 const clientsNames = getClientsNames(formData.clients_ids);
                                 await base44.entities.Notification.create({
                                   utilisateur_email: newRetourAppel.utilisateur_assigne,
                                   titre: "Nouveau retour d'appel assigné",
                                   message: `Un retour d'appel vous a été assigné pour le dossier ${getArpenteurInitials(formData.arpenteur_geometre)}${formData.numero_dossier}${clientsNames !== "-" ? ` - ${clientsNames}` : ""}.`,
                                   type: "retour_appel",
                                   dossier_id: editingDossier.id,
                                   lue: false
                                 });
                               }

                               queryClient.invalidateQueries({ queryKey: ['notifications'] });

                               setNewRetourAppel({
                                 date_appel: new Date().toISOString().split('T')[0],
                                 utilisateur_assigne: "",
                                 raison: "",
                                 statut: "Retour d'appel"
                               });
                               setNewRetourAppelFormCollapsed(true);
                             }}
                             className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 h-8 text-xs w-full border border-blue-500/30"
                           >
                             <Plus className="w-3 h-3 mr-1" />
                             Ajouter le retour d'appel
                           </Button>
                         </div>
                       )}
                     </div>

                     {/* Liste des retours d'appel */}
                     {retoursAppel.length > 0 && (
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <Table className="table-fixed w-full">
                          <TableHeader>
                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                              <TableHead className="text-slate-300 text-xs w-[22.5%]">Date</TableHead>
                              <TableHead className="text-slate-300 text-xs w-[22.5%]">Notes</TableHead>
                              <TableHead className="text-slate-300 text-xs w-[22.5%]">Statut</TableHead>
                              <TableHead className="text-slate-300 text-xs w-[22.5%]">Utilisateur assigné</TableHead>
                              <TableHead className="text-slate-300 text-xs w-[10%]">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              let sortedRetoursAppel = [...retoursAppel];
                              
                              if (retourAppelSortConfig.key) {
                                sortedRetoursAppel.sort((a, b) => {
                                  let aVal, bVal;
                                  if (retourAppelSortConfig.key === 'date') {
                                    aVal = a.date_appel || '';
                                    bVal = b.date_appel || '';
                                  } else if (retourAppelSortConfig.key === 'utilisateur') {
                                    aVal = (users || []).find(u => u?.email === a.utilisateur_assigne)?.full_name || a.utilisateur_assigne || '';
                                    bVal = (users || []).find(u => u?.email === b.utilisateur_assigne)?.full_name || b.utilisateur_assigne || '';
                                  } else if (retourAppelSortConfig.key === 'statut') {
                                    aVal = a.statut || '';
                                    bVal = b.statut || '';
                                  }

                                  if (aVal < bVal) return retourAppelSortConfig.direction === 'asc' ? -1 : 1;
                                  if (aVal > bVal) return retourAppelSortConfig.direction === 'asc' ? 1 : -1;
                                  return 0;
                                });
                              }

                              return sortedRetoursAppel.map((retour) => (
                                <TableRow key={retour.id} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-slate-300 text-xs w-[22.5%]">
                                    {retour.date_appel ? format(new Date(retour.date_appel), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs w-[22.5%]">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="truncate cursor-help">
                                            {retour.raison || "-"}
                                          </div>
                                        </TooltipTrigger>
                                        {retour.raison && (
                                          <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-sm whitespace-normal break-words">
                                            {retour.raison}
                                          </TooltipContent>
                                        )}
                                      </Tooltip>
                                    </TooltipProvider>
                                  </TableCell>
                                  <TableCell className="text-xs w-[22.5%]">
                                    <Select 
                                      value={retour.statut}
                                      onValueChange={async (newStatut) => {
                                        await base44.entities.RetourAppel.update(retour.id, {
                                          ...retour,
                                          statut: newStatut
                                        });
                                        setRetoursAppel(prev => 
                                          prev.map(r => r.id === retour.id ? {...r, statut: newStatut} : r)
                                        );
                                        queryClient.invalidateQueries({ queryKey: ['retoursAppel', editingDossier?.id] });
                                      }}
                                    >
                                      <SelectTrigger className={`border-slate-600 h-8 text-xs w-full ${
                                        retour.statut === "Retour d'appel" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                                        retour.statut === "Message laissé" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                                        retour.statut === "Aucune réponse" ? "bg-slate-700 text-red-400" :
                                        "bg-slate-700 text-white"
                                      }`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="Retour d'appel" className="text-white text-xs">Retour d'appel</SelectItem>
                                        <SelectItem value="Message laissé" className="text-white text-xs">Message laissé</SelectItem>
                                        <SelectItem value="Aucune réponse" className="text-white text-xs">Aucune réponse</SelectItem>
                                        <SelectItem value="Terminé" className="text-white text-xs">Terminé</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-xs w-[22.5%]">
                                    <div className="flex items-center gap-1.5">
                                      <span>
                                        {getUserInitials((users || []).find(u => u?.email === retour.utilisateur_assigne)?.full_name) || "-"}
                                      </span>
                                      <Avatar className="w-6 h-6 border-2 border-emerald-500/50 flex-shrink-0">
                                        <AvatarImage src={(users || []).find(u => u?.email === retour.utilisateur_assigne)?.photo_url} />
                                        <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                          {getUserInitials((users || []).find(u => u?.email === retour.utilisateur_assigne)?.full_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right w-[10%]">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setMinuteToDeleteInfo({retourAppelId: retour.id});
                                        setShowDeleteMinuteConfirm(true);
                                      }}
                                      className="text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                      <Trash className="w-4 h-4" />
                                    </button>
                                  </TableCell>
                                  </TableRow>
                                  ));
                                  })()}
                                  </TableBody>
                                  </Table>
                      </div>
                      )}
                  </CardContent>
                )}
              </Card>
            )}

            {/* Section Documents - Visible uniquement si arpenteur et numéro de dossier sont définis */}
            {formData.numero_dossier && formData.arpenteur_geometre && (
              <div data-section="documents">
                <DocumentsStepForm
                  arpenteurGeometre={formData.arpenteur_geometre}
                  numeroDossier={formData.numero_dossier}
                  isCollapsed={documentsCollapsed}
                  onToggleCollapse={() => setDocumentsCollapsed(!documentsCollapsed)}
                  onDocumentsChange={() => {}}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 25% (ajusté pour la largeur) */}
        <div className="flex-[0_0_calc(25%-12px)] flex flex-col overflow-hidden">
          {/* Section Carte */}
          {formData.mandats.length > 0 && formData.mandats[activeTabMandat]?.adresse_travaux && (
            formData.mandats[activeTabMandat].adresse_travaux.rue || formData.mandats[activeTabMandat].adresse_travaux.ville
          ) && (
            <>
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
              {!mapCollapsed && (
                <div className="p-4 border-b border-slate-800 flex-shrink-0 max-h-[35%]">
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
            </>
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
                <CommentairesSection dossierId={editingDossier?.id} dossierTemporaire={false} />
              </TabsContent>
              
              <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                {actionLogs.length > 0 ? (
                  <div className="space-y-3">
                    {actionLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-xs ${
                                log.action === 'CREATION_DOSSIER' || log.action === 'Création' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                log.action === 'MODIFICATION_DOSSIER' || log.action === 'Modification' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                log.action === 'SUPPRESSION_DOSSIER' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                'bg-slate-500/20 text-slate-400 border-slate-500/30'
                              }`}>
                                {log.action === 'CREATION_DOSSIER' ? 'Création' :
                                 log.action === 'MODIFICATION_DOSSIER' ? 'Modification' :
                                 log.action === 'SUPPRESSION_DOSSIER' ? 'Suppression' :
                                 log.action}
                              </Badge>
                              <span className="text-slate-400 text-xs">
                                {log.created_date && format(new Date(log.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                              </span>
                            </div>
                            <p className="text-slate-300 text-sm">{log.details}</p>
                            <p className="text-slate-500 text-xs mt-1">Par {log.utilisateur_nom || log.utilisateur_email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500">Aucune action enregistrée</p>
                      <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Boutons Annuler/Créer tout en bas - Seulement en mode création */}
      {/* Dialog de confirmation suppression minute/entrée temps/retour appel */}
      <Dialog open={showDeleteMinuteConfirm} onOpenChange={setShowDeleteMinuteConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">
              {minuteToDeleteInfo?.minute ? `Êtes-vous sûr de vouloir supprimer cette minute (${minuteToDeleteInfo.minute}) ?` : 
               minuteToDeleteInfo?.entreeTempsId ? "Êtes-vous sûr de vouloir supprimer cette entrée de temps ?" :
               minuteToDeleteInfo?.retourAppelId ? "Êtes-vous sûr de vouloir supprimer ce retour d'appel ?" :
               "Êtes-vous sûr de vouloir supprimer ?"}
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                type="button"
                onClick={async () => {
                  if (minuteToDeleteInfo?.minute && minuteToDeleteInfo?.mandatIndex !== undefined) {
                    // Supprimer une minute
                    const updatedMandats = [...formData.mandats];
                    updatedMandats[minuteToDeleteInfo.mandatIndex].minutes_list = updatedMandats[minuteToDeleteInfo.mandatIndex].minutes_list.filter((_, idx) => idx !== minuteToDeleteInfo.minuteIndex);
                    setFormData({...formData, mandats: updatedMandats});
                  } else if (minuteToDeleteInfo?.entreeTempsId) {
                    // Supprimer une entrée de temps
                    await base44.entities.EntreeTemps.delete(minuteToDeleteInfo.entreeTempsId);
                    setEntreesTemps(prev => prev.filter(e => e.id !== minuteToDeleteInfo.entreeTempsId));
                  } else if (minuteToDeleteInfo?.retourAppelId) {
                    // Supprimer un retour d'appel
                    await base44.entities.RetourAppel.delete(minuteToDeleteInfo.retourAppelId);
                    setRetoursAppel(prev => prev.filter(r => r.id !== minuteToDeleteInfo.retourAppelId));
                  }
                  setShowDeleteMinuteConfirm(false);
                  setMinuteToDeleteInfo(null);
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Supprimer
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowDeleteMinuteConfirm(false);
                  setMinuteToDeleteInfo(null);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation suppression mandat */}
      <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">
              Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  removeMandat(mandatIndexToDelete);
                  setActiveTabMandat(Math.max(0, mandatIndexToDelete - 1).toString());
                  setShowDeleteMandatConfirm(false);
                  setMandatIndexToDelete(null);
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Supprimer
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowDeleteMandatConfirm(false);
                  setMandatIndexToDelete(null);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition du terrain */}
      <Dialog open={isTerrainDialogOpen} onOpenChange={setIsTerrainDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Modifier les informations terrain</DialogTitle>
            {editingTerrainInfo && (
              <div className={`text-lg font-semibold flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-slate-700 ${
                formData.arpenteur_geometre === "Samuel Guay" ? "text-red-400" :
                formData.arpenteur_geometre === "Pierre-Luc Pilote" ? "text-slate-400" :
                formData.arpenteur_geometre === "Frédéric Gilbert" ? "text-orange-400" :
                formData.arpenteur_geometre === "Dany Gaboury" ? "text-yellow-400" :
                formData.arpenteur_geometre === "Benjamin Larouche" ? "text-cyan-400" :
                "text-emerald-400"
              }`}>
                <span>
                  {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                  {formData.clients_ids.length > 0 && getClientsNames(formData.clients_ids) !== "-" && (
                    <span> - {getClientsNames(formData.clients_ids)}</span>
                  )}
                </span>
                {editingTerrainInfo.mandat && (
                  <span className="flex gap-1">
                    <Badge className={`${getMandatColor(editingTerrainInfo.mandat.type_mandat)} border text-xs`}>
                      {getAbbreviatedMandatType(editingTerrainInfo.mandat.type_mandat)}
                    </Badge>
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date limite cédule</Label>
                <Input
                  type="date"
                  value={terrainForm.date_limite_leve || ""}
                  onChange={(e) => setTerrainForm({...terrainForm, date_limite_leve: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Temps prévu</Label>
                <Input
                  value={terrainForm.temps_prevu || ""}
                  onChange={(e) => setTerrainForm({...terrainForm, temps_prevu: e.target.value})}
                  placeholder="Ex: 2h30"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Donneur</Label>
                <Select value={terrainForm.donneur || ""} onValueChange={(value) => setTerrainForm({...terrainForm, donneur: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(users || []).map((u) => (
                      <SelectItem key={u.email} value={u.full_name} className="text-white">{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Instruments</Label>
                <Input
                  value={terrainForm.instruments_requis || ""}
                  onChange={(e) => setTerrainForm({...terrainForm, instruments_requis: e.target.value})}
                  placeholder="GPS, Station totale.."
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Technicien</Label>
                <Select 
                  value={terrainForm.technicien || ""}
                  onValueChange={(value) => setTerrainForm({...terrainForm, technicien: value})}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(users || []).map((u) => (
                      <SelectItem key={u.email} value={u.full_name} className="text-white">{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={terrainForm.a_rendez_vous || false}
                  onCheckedChange={(checked) => setTerrainForm({...terrainForm, a_rendez_vous: checked})}
                  className="data-[state=checked]:bg-amber-400"
                />
                <Label>Rendez-vous</Label>
              </div>
              {terrainForm.a_rendez_vous && (
                <div className="grid grid-cols-2 gap-3 ml-7">
                  <div className="space-y-2">
                    <Label>Date du rendez-vous</Label>
                    <Input
                      type="date"
                      value={terrainForm.date_rendez_vous || ""}
                      onChange={(e) => setTerrainForm({...terrainForm, date_rendez_vous: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Heure du rendez-vous</Label>
                    <Input
                      type="time"
                      value={terrainForm.heure_rendez_vous || ""}
                      onChange={(e) => setTerrainForm({...terrainForm, heure_rendez_vous: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={terrainForm.dossier_simultane ? true : false}
                  onCheckedChange={(checked) => setTerrainForm({...terrainForm, dossier_simultane: checked ? terrainForm.dossier_simultane : ""})}
                  className="data-[state=checked]:bg-amber-400"
                />
                <Label>Dossier à faire en même temps</Label>
              </div>
              {terrainForm.dossier_simultane && (
                <div className="grid grid-cols-2 gap-4 ml-7">
                  <div className="space-y-2">
                    <Label>Dossier simultané</Label>
                    <Select 
                      value={terrainForm.dossier_simultane || ""}
                      onValueChange={(value) => setTerrainForm({...terrainForm, dossier_simultane: value})}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {(allDossiers || []).filter(d => d.id !== editingDossier?.id).map((d) => (
                          <SelectItem key={d.id} value={d.id} className="text-white">
                            {getArpenteurInitials(d.arpenteur_geometre)}{d.numero_dossier}
                            {d.clients_ids && d.clients_ids.length > 0 && ` - ${getClientsNames(d.clients_ids)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsTerrainDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={() => {
                if (editingTerrainInfo) {
                  const updatedMandats = [...formData.mandats];
                  updatedMandats[editingTerrainInfo.mandatIndex].terrains_list[editingTerrainInfo.terrainIndex] = {
                    ...updatedMandats[editingTerrainInfo.mandatIndex].terrains_list[editingTerrainInfo.terrainIndex],
                    ...terrainForm
                  };
                  setFormData({...formData, mandats: updatedMandats});
                  setIsTerrainDialogOpen(false);
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!editingDossier && (
        <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
          <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" form="edit-dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
            Créer
          </Button>
        </div>
      )}

    </motion.div>
  );
}