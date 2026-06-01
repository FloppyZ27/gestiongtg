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
import { X, User, FileText, Briefcase, Plus, Search, Check, ChevronDown, ChevronUp, Trash2, FolderOpen, MapPin, MessageSquare, Clock, Loader2, Grid3x3, ArrowUp, ArrowDown, Trash, Phone, FileUp, CheckCircle2, XCircle, Edit, Receipt, Kanban } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns"; import { fr } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PlaceAffaireSelect from "./PlaceAffaireSelect";
import ContactsTabsSection from "./ContactsTabsSection";
import TerrainEditDialog from "./TerrainEditDialog";
import CommentairesSection from "./CommentairesSection";
import ConfirmDeleteDialog from "../shared/ConfirmDeleteDialog";
import DocumentsStepForm from "../mandat/DocumentsStepForm";
import TarificationStepForm from "../mandat/TarificationStepForm";
import FicheMandatButton from "./FicheMandatButton";
import RetourAppelSection from "./RetourAppelSection";
import MinutesSection from "./MinutesSection";
import DossierHistoriquePanel from "./DossierHistoriquePanel";
import EntreeTempsSection from "./EntreeTempsSection";
import MandatTabContent from "./MandatTabContent";

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

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
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
  clientSelectionCardComponent,
  onClientCardClick,
  onNewClientClick,
  allDossiers, hideSections = [], commentairesTemporaires = [], onCommentairesTemporairesChange
}) {
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
  const [showDeleteTerrainConfirm, setShowDeleteTerrainConfirm] = useState(false);
  const [terrainToDeleteInfo, setTerrainToDeleteInfo] = useState(null);
  const [showDeleteDossierConfirm, setShowDeleteDossierConfirm] = useState(false);
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [editingTerrainInfo, setEditingTerrainInfo] = useState(null);
  const [terrainForm, setTerrainForm] = useState({});
  const saveTimeoutRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: commentaires = [] } = useQuery({
    queryKey: ['commentaires', editingDossier?.id],
    queryFn: () => editingDossier?.id ? base44.entities.CommentaireDossier.filter({ dossier_id: editingDossier.id }) : Promise.resolve([]),
    initialData: [],
    enabled: !!editingDossier?.id
  });

  const prevFormDataRef = useRef(null);

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

  const detectAndLogChanges = async (oldData, newData) => {
    if (!oldData || !editingDossier?.id) return;
    const changes = [];
    const fieldLabels = {
      arpenteur_geometre: "Arpenteur-géomètre",
      numero_dossier: "N° dossier",
      statut: "Statut",
      place_affaire: "Place d'affaire",
      date_ouverture: "Date d'ouverture",
      date_fermeture: "Date de fermeture",
      ttl: "TTL",
    };
    for (const [field, label] of Object.entries(fieldLabels)) {
      if (oldData[field] !== newData[field]) {
        changes.push(`${label}: "${oldData[field] || '-'}" → "${newData[field] || '-'}"`);
      }
    }
    const oldClients = (oldData.clients_ids || []).join(',');
    const newClients = (newData.clients_ids || []).join(',');
    if (oldClients !== newClients) changes.push(`Clients modifiés`);
    const oldNotaires = (oldData.notaires_ids || []).join(',');
    const newNotaires = (newData.notaires_ids || []).join(',');
    if (oldNotaires !== newNotaires) changes.push(`Notaires modifiés`);
    const oldCourtiers = (oldData.courtiers_ids || []).join(',');
    const newCourtiers = (newData.courtiers_ids || []).join(',');
    if (oldCourtiers !== newCourtiers) changes.push(`Courtiers modifiés`);
    const oldMandats = oldData.mandats || [];
    const newMandats = newData.mandats || [];
    newMandats.forEach((newMandat, idx) => {
      const oldMandat = oldMandats[idx];
      if (!oldMandat) return;
      const mandatLabel = newMandat.type_mandat || `Mandat ${idx + 1}`;
      if (oldMandat.tache_actuelle !== newMandat.tache_actuelle) changes.push(`[${mandatLabel}] Tâche: "${oldMandat.tache_actuelle || '-'}" → "${newMandat.tache_actuelle || '-'}"`);
      if (oldMandat.utilisateur_assigne !== newMandat.utilisateur_assigne) changes.push(`[${mandatLabel}] Utilisateur assigné modifié`);
      if (oldMandat.type_mandat !== newMandat.type_mandat) changes.push(`Mandat ${idx + 1}: type "${oldMandat.type_mandat || '-'}" → "${newMandat.type_mandat || '-'}"`);
      const oldAddr = JSON.stringify(oldMandat.adresse_travaux || {});
      const newAddr = JSON.stringify(newMandat.adresse_travaux || {});
      if (oldAddr !== newAddr) changes.push(`[${mandatLabel}] Adresse des travaux modifiée`);
      if (oldMandat.date_livraison !== newMandat.date_livraison) changes.push(`[${mandatLabel}] Date livraison: "${oldMandat.date_livraison || '-'}" → "${newMandat.date_livraison || '-'}"`);
      if (oldMandat.date_signature !== newMandat.date_signature) changes.push(`[${mandatLabel}] Date signature: "${oldMandat.date_signature || '-'}" → "${newMandat.date_signature || '-'}"`);
      if (oldMandat.prix_estime !== newMandat.prix_estime) changes.push(`[${mandatLabel}] Prix estimé: "${oldMandat.prix_estime ?? '-'}" → "${newMandat.prix_estime ?? '-'}"`);
      if (oldMandat.rabais !== newMandat.rabais) changes.push(`[${mandatLabel}] Rabais: "${oldMandat.rabais ?? '-'}" → "${newMandat.rabais ?? '-'}"`);
      if (oldMandat.taxes_incluses !== newMandat.taxes_incluses) changes.push(`[${mandatLabel}] Taxes incluses: "${oldMandat.taxes_incluses ? 'Oui' : 'Non'}" → "${newMandat.taxes_incluses ? 'Oui' : 'Non'}"`);
      if (oldMandat.prix_convenu !== newMandat.prix_convenu) changes.push(`[${mandatLabel}] Prix convenu: "${oldMandat.prix_convenu ? 'Oui' : 'Non'}" → "${newMandat.prix_convenu ? 'Oui' : 'Non'}"`);
    });
    if (changes.length > 0) {
      const log = await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || "",
        utilisateur_nom: user?.full_name || "",
        action: "Modification",
        entite: "Dossier",
        entite_id: editingDossier.id,
        details: changes.join(' • ')
      });
      setActionLogs(prev => [log, ...prev]);
    }
  };

  useEffect(() => {
    if (editingDossier) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        const oldData = prevFormDataRef.current;
        prevFormDataRef.current = JSON.parse(JSON.stringify(formData));
        await detectAndLogChanges(oldData, formData);
        autoSaveMutation.mutate(formData);
      }, 500);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [formData, editingDossier]);

  const [actionLogs, setActionLogs] = useState([]);

  React.useEffect(() => {
    if (editingDossier?.id) {
      base44.entities.ActionLog.filter({ entite: 'Dossier', entite_id: editingDossier.id }, '-created_date', 100)
        .then(setActionLogs).catch(() => setActionLogs([]));
      prevFormDataRef.current = JSON.parse(JSON.stringify(formData));
    } else {
      setActionLogs([]);
      prevFormDataRef.current = null;
    }
  }, [editingDossier?.id]);

  const addActionLog = async (action, details) => {
    if (!editingDossier?.id) return;
    const log = await base44.entities.ActionLog.create({
      utilisateur_email: user?.email || "",
      utilisateur_nom: user?.full_name || "",
      action, entite: "Dossier", entite_id: editingDossier.id, details
    });
    setActionLogs(prev => [log, ...prev]);
  };

  React.useEffect(() => {
    if (editingDossier?.id) {
      base44.entities.RetourAppel.filter({ dossier_id: editingDossier.id }, '-date_appel')
        .then(setRetoursAppel).catch(() => setRetoursAppel([]));
    } else { setRetoursAppel([]); }
  }, [editingDossier?.id]);

  React.useEffect(() => {
    if (editingDossier?.id) {
      base44.entities.EntreeTemps.filter({ dossier_id: editingDossier.id }, '-date')
        .then(setEntreesTemps).catch(() => setEntreesTemps([]));
    } else { setEntreesTemps([]); }
  }, [editingDossier?.id]);

  React.useEffect(() => {
    if (!formData.mandats?.length) return;
    const hasEmpty = formData.mandats.some(m => m.adresse_travaux_texte && !m.adresse_travaux?.rue && !m.adresse_travaux?.ville);
    if (!hasEmpty) return;
    const VILLES = ["Alma","Saguenay","Chicoutimi","Jonquière","La Baie","Roberval","Saint-Félicien","Dolbeau-Mistassini","Métabetchouan","Métabetchouan-Lac-à-la-Croix","Lac-Bouchette","Normandin","Péribonka","Saint-Gédéon","Hébertville","Desbiens","Chambord","Saint-Bruno","Hébertville-Station","Labrecque","Saint-Prime","Sainte-Hedwidge","Saint-Cœur-de-Marie","Lamarche","Saint-Henri-de-Taillon","Saint-Nazaire","Sainte-Monique","Notre-Dame-de-Lorette","Girardville","Saint-Thomas-Didyme","Saint-Augustin","Mistissini","Chibougamau","Larouche","Laterrière"];
    const parseText = (text) => {
      if (!text) return null;
      const parts = text.split(',').map(p => p.trim());
      if (/^\d+[a-zA-Z]?$/.test(parts[0]) && parts.length >= 3) return { numeros_civiques: [parts[0]], rue: parts[1] || "", ville: parts[2] || "", code_postal: "", province: "QC" };
      if (parts.length >= 2) {
        const match = parts[0]?.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
        return { numeros_civiques: [match ? match[1] : ""], rue: match ? match[2] : (parts[0] || ""), ville: parts[1] || "", code_postal: "", province: "QC" };
      }
      const textLower = text.toLowerCase();
      const foundCity = VILLES.find(v => { const vl = v.toLowerCase(); return textLower.endsWith(vl) || textLower.includes(' ' + vl) || textLower.includes(', ' + vl); });
      if (foundCity) {
        const idx = text.toLowerCase().lastIndexOf(foundCity.toLowerCase());
        const streetPart = text.slice(0, idx).trim().replace(/[,\s]+$/, "");
        const match = streetPart.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
        return { numeros_civiques: [match ? match[1] : ""], rue: match ? match[2] : streetPart, ville: foundCity, code_postal: "", province: "QC" };
      }
      const match = text.match(/^(\d+[a-zA-Z]?)\s+(.+)$/);
      return { numeros_civiques: [match ? match[1] : ""], rue: match ? match[2] : text, ville: "", code_postal: "", province: "QC" };
    };
    setFormData(prev => ({ ...prev, mandats: prev.mandats.map(m => { if (m.adresse_travaux_texte && !m.adresse_travaux?.rue && !m.adresse_travaux?.ville) return { ...m, adresse_travaux: parseText(m.adresse_travaux_texte) || m.adresse_travaux }; return m; }) }));
  }, [editingDossier?.id]);

  const getClientById = (id) => (clients || []).find(c => c.id === id);
  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => { const client = getClientById(id); return client ? `${client.prenom} ${client.nom}` : "Client inconnu"; }).join(", ");
  };

  const sections = [
    { id: "infos", label: "Informations", icon: FolderOpen, color: "text-blue-400" },
    { id: "mandats", label: "Mandats", icon: FileText, color: "text-orange-400" },
    { id: "tarification", label: "Tarification", icon: Receipt, color: "text-purple-400" },
    { id: "terrain", label: "Terrain", icon: MapPin, color: "text-amber-400" },
    { id: "minutes", label: "Minutes", icon: FileText, color: "text-cyan-400" },
    { id: "entree-temps", label: "Entrée de temps", icon: Clock, color: "text-lime-400" },
    { id: "retour-appel", label: "Retour d'appel", icon: Phone, color: "text-blue-400" },
    { id: "documents", label: "Documents", icon: FolderOpen, color: "text-yellow-400" }
  ].filter(s => !hideSections.includes(s.id));

  const scrollToSection = (sectionId) => {
    setInfoDossierCollapsed(sectionId !== "infos");
    setMandatStepCollapsed(sectionId !== "mandats");
    setTarificationStepCollapsed(sectionId !== "tarification");
    setTerrainCollapsed(sectionId !== "terrain");
    setDocumentsCollapsed(sectionId !== "documents");
    setMinutesCollapsed(sectionId !== "minutes");
    setEntreeTempsCollapsed(sectionId !== "entree-temps");
    setRetourAppelCollapsed(sectionId !== "retour-appel");
    setTimeout(() => {
      const element = document.querySelector(`[data-section="${sectionId}"]`);
      if (element) {
        const scrollContainer = element.closest('.flex-1.overflow-y-auto');
        if (scrollContainer) {
          const offset = 70;
          const elementTop = element.getBoundingClientRect().top + scrollContainer.scrollTop - scrollContainer.getBoundingClientRect().top;
          scrollContainer.scrollTo({ top: Math.max(0, elementTop - offset), behavior: "smooth" });
        } else {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 50);
  };

  return (
    <>
    <motion.div
      className="flex flex-col h-[calc(100vh-160px)]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900 px-6 py-3 border-b border-slate-800 flex-shrink-0 flex items-center gap-4">
        <h2 className="text-2xl font-bold" style={{background:'linear-gradient(90deg, hsl(0,80%,62%), hsl(22,90%,65%))', WebkitBackgroundClip:'text', backgroundClip:'text', WebkitTextFillColor:'transparent', color:'transparent'}}>{editingDossier ? "Modifier le dossier" : "Nouveau dossier"}</h2>
        <FicheMandatButton formData={formData} clients={clients} editingDossier={editingDossier} entreesTemps={entreesTemps} />
        {editingDossier && (
          <Button type="button" size="sm" onClick={() => setShowDeleteDossierConfirm(true)} className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-7 text-xs">
            <Trash2 className="w-3 h-3 mr-1" />
            Supprimer le dossier
          </Button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {formData.numero_dossier && formData.arpenteur_geometre && (
            <div className={`text-lg font-semibold flex items-center gap-2 flex-wrap ${formData.arpenteur_geometre==="Samuel Guay"?"text-red-400":formData.arpenteur_geometre==="Pierre-Luc Pilote"?"text-slate-400":formData.arpenteur_geometre==="Frédéric Gilbert"?"text-orange-400":formData.arpenteur_geometre==="Dany Gaboury"?"text-yellow-400":formData.arpenteur_geometre==="Benjamin Larouche"?"text-cyan-400":"text-emerald-400"}`}>
              <span>
                {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                {(() => {
                  const clientName = (formData.clients_ids && formData.clients_ids.length > 0 && getClientsNames(formData.clients_ids) !== "-")
                    ? getClientsNames(formData.clients_ids)
                    : (formData.clients_texte || "");
                  return clientName && clientName.trim() ? <span> - {clientName}</span> : null;
                })()}
              </span>
              {formData.mandats && formData.mandats.length > 0 && (
                <span className="flex gap-1">
                  {formData.mandats.slice(0, 3).map((m, idx) => m.type_mandat && (
                    <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(m.type_mandat)}</Badge>
                  ))}
                  {formData.mandats.length > 3 && <Badge className="bg-slate-700 text-slate-300 text-xs">+{formData.mandats.length - 3}</Badge>}
                </span>
              )}
            </div>
          )}
          {editingDossier?.ttl === "Oui" && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs font-semibold px-2 py-0.5">TTL</Badge>}
          {editingDossier?.trello === "Oui" && (
            <div className="p-1 bg-blue-500/80 rounded flex items-center justify-center" title="Dossier Trello">
              <Kanban className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar navigation */}
        <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-2 flex-shrink-0 overflow-y-auto">
          <TooltipProvider>
            {sections.map((section) => (
              <Tooltip key={section.id}>
                <TooltipTrigger asChild>
                  <button type="button" onClick={() => scrollToSection(section.id)} className="w-9 h-9 rounded-lg flex items-center justify-center bg-transparent hover:bg-slate-600/30 transition-colors duration-200 hover:scale-110 sidebar-nav-btn">
                    <section.icon className={`w-5 h-5 ${section.color}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white text-sm">{section.label}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* Main content - 75% */}
        <div className="flex-[0_0_calc(75%-48px)] flex flex-col overflow-hidden border-r border-slate-800">
          <div className="flex-1 overflow-y-auto p-6 pb-24">

            {/* Section Informations */}
            <form id="edit-dossier-form" onSubmit={(e) => { if (!editingDossier) { onSubmit(e); } else { e.preventDefault(); } }}>
              <Card className="border-0 bg-transparent mb-3" data-section="infos">
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
                      {/* Colonne gauche */}
                      <div className="space-y-2 border-r border-slate-700 pr-4">
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                          <Select value={formData.arpenteur_geometre} onValueChange={(value) => {
                            const newNumeroDossier = !editingDossier && calculerProchainNumeroDossier ? calculerProchainNumeroDossier(value) : formData.numero_dossier;
                            setFormData({...formData, arpenteur_geometre: value, numero_dossier: newNumeroDossier});
                          }}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {ARPENTEURS.map((a) => <SelectItem key={a} value={a} className="text-white text-sm">{a}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <PlaceAffaireSelect value={formData.place_affaire} onChange={(val) => setFormData(prev => ({...prev, place_affaire: val}))} dossierKey={editingDossier?.id} />
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Date d'ouverture <span className="text-red-400">*</span></Label>
                          <Input type="date" value={formData.date_ouverture} onChange={(e) => setFormData({...formData, date_ouverture: e.target.value})} required className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Statut</Label>
                          <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value, date_fermeture: value === 'Fermé' ? (formData.date_fermeture || new Date().toISOString().split('T')[0]) : formData.date_fermeture})}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="Ouvert" className="text-white text-sm">Ouvert</SelectItem>
                              <SelectItem value="Fermé" className="text-white text-sm">Fermé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.statut === 'Fermé' && (
                          <div className="space-y-1">
                            <Label className="text-slate-400 text-xs">Date de fermeture</Label>
                            <Input type="date" value={formData.date_fermeture || ""} onChange={(e) => setFormData({...formData, date_fermeture: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                          </div>
                        )}
                      </div>

                      {/* Colonne droite - Contacts */}
                      <div>
                        <ContactsTabsSection
                          formData={formData}
                          setFormData={setFormData}
                          clients={clients || []}
                          activeContactTab={activeContactTab}
                          setActiveContactTab={setActiveContactTab}
                          contactsListCollapsed={contactsListCollapsed}
                          setContactsListCollapsed={setContactsListCollapsed}
                          clientSearchTerm={clientSearchTerm}
                          setClientSearchTerm={setClientSearchTerm}
                          notaireSearchTerm={notaireSearchTerm}
                          setNotaireSearchTerm={setNotaireSearchTerm}
                          courtierSearchTerm={courtierSearchTerm}
                          setCourtierSearchTerm={setCourtierSearchTerm}
                          setClientTypeForForm={setClientTypeForForm}
                          setIsClientFormDialogOpen={setIsClientFormDialogOpen}
                          setEditingClient={setEditingClient}
                          onNewClientClick={onNewClientClick}
                          onClientCardClick={onClientCardClick}
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </form>

            {/* Section Mandats */}
            <Card className="border-0 bg-transparent mt-3" data-section="mandats">
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
                          <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(m.type_mandat)}</Badge>
                        ))}
                        {formData.mandats.length > 3 && <Badge className="bg-slate-700 text-slate-300 text-xs">+{formData.mandats.length - 3}</Badge>}
                      </div>
                    )}
                    {editingDossier && formData.mandats.length > 0 && activeTabMandat !== undefined && formData.mandats[parseInt(activeTabMandat)] && (
                      <div className="flex-1 max-w-[200px] space-y-1 ml-auto mr-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-400">Progression</span>
                          <span className="text-xs font-bold text-orange-400">
                            {(() => {
                              if (formData.statut === 'Fermé' || formData.mandats[parseInt(activeTabMandat)]?.tache_actuelle === 'Facturer') return 100;
                              const TACHES_LIST = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
                              const tacheIndex = TACHES_LIST.indexOf(formData.mandats[parseInt(activeTabMandat)]?.tache_actuelle);
                              let rawProgress = 0;
                              if (tacheIndex >= 0 && TACHES_LIST.length > 1) rawProgress = (tacheIndex / (TACHES_LIST.length - 1)) * 95;
                              return Math.round(rawProgress / 5) * 5;
                            })()}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900/50 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              background: 'linear-gradient(to right, hsl(0,80%,58%), hsl(22,90%,52%))',
                              width: `${(() => {
                                if (formData.statut === 'Fermé' || formData.mandats[parseInt(activeTabMandat)]?.tache_actuelle === 'Facturer') return 100;
                                const TACHES_LIST = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
                                const tacheIndex = TACHES_LIST.indexOf(formData.mandats[parseInt(activeTabMandat)]?.tache_actuelle);
                                let rawProgress = 0;
                                if (tacheIndex >= 0 && TACHES_LIST.length > 1) rawProgress = (tacheIndex / (TACHES_LIST.length - 1)) * 95;
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
                          <TabsList className="bg-transparent border-0 h-auto justify-start p-1 rounded-lg inline-flex">
                            {formData.mandats.map((mandat, index) => {
                              const mandatColor = getMandatColor(mandat.type_mandat);
                              const isActive = activeTabMandat === index.toString();
                              return (
                                <TabsTrigger key={index} value={index.toString()} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isActive ? `${mandatColor} border-b-2` : 'bg-slate-700/30 text-slate-400'}`}>
                                  <Badge className={`${isActive ? mandatColor : 'bg-slate-700 text-slate-400 border-slate-600'} border text-xs`}>
                                    {mandat.type_mandat ? getAbbreviatedMandatType(mandat.type_mandat) : `Mandat ${index + 1}`}
                                  </Badge>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </div>
                        <div className="flex gap-1">
                          {formData.mandats.length > 1 && (
                            <Button type="button" size="sm" variant="ghost" onClick={() => { setMandatIndexToDelete(parseInt(activeTabMandat)); setShowDeleteMandatConfirm(true); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button type="button" size="sm" onClick={addMandat} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-6 text-xs">
                            <Plus className="w-3 h-3 mr-1" />Ajouter
                          </Button>
                        </div>
                      </div>
                      {formData.mandats.map((mandat, index) => (
                        <MandatTabContent
                          key={index}
                          mandat={mandat}
                          index={index}
                          formData={formData}
                          setFormData={setFormData}
                          updateMandat={updateMandat}
                          users={users}
                          lots={lots}
                          getLotById={getLotById}
                          sameAddressForAllMandats={sameAddressForAllMandats}
                          setSameAddressForAllMandats={setSameAddressForAllMandats}
                          sameDatesForAllMandats={sameDatesForAllMandats}
                          setSameDatesForAllMandats={setSameDatesForAllMandats}
                          sameLotsForAllMandats={sameLotsForAllMandats}
                          setSameLotsForAllMandats={setSameLotsForAllMandats}
                          addressSearchQuery={addressSearchQuery}
                          setAddressSearchQuery={setAddressSearchQuery}
                          isSearchingAddress={isSearchingAddress}
                          setIsSearchingAddress={setIsSearchingAddress}
                          addressSuggestions={addressSuggestions}
                          setAddressSuggestions={setAddressSuggestions}
                          addressSearchTimeout={addressSearchTimeout}
                          setAddressSearchTimeout={setAddressSearchTimeout}
                          setCurrentMandatIndexForAddress={setCurrentMandatIndexForAddress}
                          currentMandatIndexForAddress={currentMandatIndexForAddress}
                          lotTabExpanded={lotTabExpanded}
                          setLotTabExpanded={setLotTabExpanded}
                          currentMandatIndexForLot={currentMandatIndexForLot}
                          setCurrentMandatIndexForLot={setCurrentMandatIndexForLot}
                          lotSearchTerm={lotSearchTerm}
                          setLotSearchTerm={setLotSearchTerm}
                          onOpenNewLotDialog={onOpenNewLotDialog}
                          setEditingLot={setEditingLot}
                          setNewLotForm={setNewLotForm}
                          setLotActionLogs={setLotActionLogs}
                          removeLotFromMandat={removeLotFromMandat}
                        />
                      ))}
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <Button type="button" size="sm" onClick={addMandat} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-7 text-xs">
                        <Plus className="w-3 h-3 mr-1" />Ajouter un mandat
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Section Tarification */}
            <div className="mt-3" data-section="tarification">
              <TarificationStepForm
                disabled={false}
                mandats={formData.mandats}
                onTarificationChange={(updatedMandats) => setFormData(prev => ({ ...prev, mandats: updatedMandats }))}
                isCollapsed={tarificationStepCollapsed}
                onToggleCollapse={() => setTarificationStepCollapsed(!tarificationStepCollapsed)}
              />
            </div>

            {/* Section Terrain */}
            {formData.mandats.length > 0 && !hideSections.includes('terrain') && (
              <Card className="border-0 bg-transparent mt-3" data-section="terrain">
                <CardHeader
                  className="cursor-pointer hover:bg-amber-900/40 transition-colors rounded-t-lg py-1.5 bg-amber-900/20"
                  onClick={() => setTerrainCollapsed(!terrainCollapsed)}
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
                    <div className="border-2 border-amber-500/30 rounded-lg mb-4 bg-amber-900/10">
                      <div className="cursor-pointer hover:bg-amber-900/40 transition-colors px-4 py-2 flex items-center justify-between" onClick={() => setNewTerrainFormCollapsed(!newTerrainFormCollapsed)}>
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-semibold text-amber-400">Ajouter un terrain</span>
                        </div>
                        {newTerrainFormCollapsed ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronUp className="w-4 h-4 text-amber-400" />}
                      </div>
                      {!newTerrainFormCollapsed && (
                        <div className="p-4 border-t border-purple-500/30 space-y-3">
                          <div className="grid grid-cols-5 gap-3">
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                              <Select value={newTerrainForm.mandatIndex?.toString() || ""} onValueChange={(value) => setNewTerrainForm({...newTerrainForm, mandatIndex: parseInt(value)})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {formData.mandats.map((mandat, index) => (
                                    <SelectItem key={index} value={index.toString()} className="text-white text-xs">{mandat.type_mandat || `Mandat ${index + 1}`}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Temps prévu</Label>
                              <Input placeholder="Ex: 2h30" value={newTerrainForm.temps_prevu || ""} onChange={(e) => setNewTerrainForm({...newTerrainForm, temps_prevu: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Donneur</Label>
                              <Select value={newTerrainForm.donneur || ""} onValueChange={(value) => setNewTerrainForm({...newTerrainForm, donneur: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map((u) => (
                                    <SelectItem key={u?.email} value={u?.full_name} className="text-white text-xs">{u?.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Instruments</Label>
                              <Select value={newTerrainForm.instruments_requis || ""} onValueChange={(value) => setNewTerrainForm({...newTerrainForm, instruments_requis: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {["Can-Net","RTK","CONV","3 GPS","Chaine","SX10","NAVIS","Drône"].map(v => <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Technicien</Label>
                              <Select value={newTerrainForm.technicien || ""} onValueChange={(value) => setNewTerrainForm({...newTerrainForm, technicien: value})}>
                                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  {(users || []).map((u) => (
                                    <SelectItem key={u?.email} value={`${u?.prenom || ''} ${u?.nom || ''}`.trim() || u?.full_name} className="text-white text-xs">{u?.full_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1">
                              <Label className="text-slate-400 text-xs">Date limite cédule</Label>
                              <Input type="date" value={newTerrainForm.date_limite_leve || ""} onChange={(e) => setNewTerrainForm({...newTerrainForm, date_limite_leve: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                            </div>
                            <div className="space-y-1 flex items-end">
                              <div className="flex items-center gap-2 h-8">
                                <Switch checked={newTerrainForm.a_rendez_vous || false} onCheckedChange={(checked) => setNewTerrainForm({...newTerrainForm, a_rendez_vous: checked})} style={{backgroundColor: newTerrainForm.a_rendez_vous ? 'hsl(45, 90%, 55%)' : 'hsl(220, 10%, 30%)', border: 'none', width: '36px', height: '20px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s'}} />
                                <Label className="text-slate-400 text-xs">Rendez-vous</Label>
                              </div>
                            </div>
                            {newTerrainForm.a_rendez_vous && (
                              <>
                                <div className="space-y-1">
                                  <Label className="text-slate-400 text-xs">Date RDV</Label>
                                  <Input type="date" value={newTerrainForm.date_rendez_vous || ""} onChange={(e) => setNewTerrainForm({...newTerrainForm, date_rendez_vous: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-slate-400 text-xs">Heure RDV</Label>
                                  <Input type="time" value={newTerrainForm.heure_rendez_vous || ""} onChange={(e) => setNewTerrainForm({...newTerrainForm, heure_rendez_vous: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                                </div>
                              </>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1 flex items-end">
                              <div className="flex items-center gap-2 h-8">
                                <Switch checked={newTerrainForm.a_dossier_simultane || false} onCheckedChange={(checked) => setNewTerrainForm({...newTerrainForm, a_dossier_simultane: checked, dossier_simultane: checked ? newTerrainForm.dossier_simultane : ""})} style={{backgroundColor: newTerrainForm.a_dossier_simultane ? 'hsl(45, 90%, 55%)' : 'hsl(220, 10%, 30%)', border: 'none', width: '36px', height: '20px', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', padding: '2px', cursor: 'pointer', transition: 'background-color 0.2s'}} />
                                <Label className="text-slate-400 text-xs">Dossier à faire en même temps</Label>
                              </div>
                            </div>
                            {newTerrainForm.a_dossier_simultane && (
                              <div className="space-y-1">
                                <Label className="text-slate-400 text-xs">Dossier simultané</Label>
                                <Select value={newTerrainForm.dossier_simultane || ""} onValueChange={(value) => setNewTerrainForm({...newTerrainForm, dossier_simultane: value})}>
                                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    {(allDossiers || []).filter(d => {
                                      if (d.id === editingDossier?.id) return false;
                                      const today = new Date(); today.setHours(0,0,0,0);
                                      return d.mandats?.some(m => { if (!m.date_terrain) return true; const dt = new Date(m.date_terrain); dt.setHours(0,0,0,0); return dt >= today; });
                                    }).map((d) => (
                                      <SelectItem key={d.id} value={`${getArpenteurInitials(d.arpenteur_geometre)}${d.numero_dossier}`} className="text-white text-xs">
                                        {getArpenteurInitials(d.arpenteur_geometre)}{d.numero_dossier} - {(() => { const cn = d.clients_ids?.map(cid => { const c = clients.find(cl => cl.id === cid); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(n => n).join(", "); return cn || "Sans client"; })()} ({d.mandats?.map(m => getAbbreviatedMandatType(m.type_mandat)).join(', ')})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button" size="sm"
                            onClick={() => {
                              if (newTerrainForm.mandatIndex === undefined || newTerrainForm.mandatIndex === null) { alert("Veuillez sélectionner un mandat"); return; }
                              const updatedMandats = [...formData.mandats];
                              if (!updatedMandats[newTerrainForm.mandatIndex].terrains_list) updatedMandats[newTerrainForm.mandatIndex].terrains_list = [];
                              updatedMandats[newTerrainForm.mandatIndex].terrains_list.push({ date_limite_leve: newTerrainForm.date_limite_leve || "", instruments_requis: newTerrainForm.instruments_requis || "", donneur: newTerrainForm.donneur || "", technicien: newTerrainForm.technicien || "", temps_prevu: newTerrainForm.temps_prevu || "", a_rendez_vous: newTerrainForm.a_rendez_vous || false, date_rendez_vous: newTerrainForm.date_rendez_vous || "", heure_rendez_vous: newTerrainForm.heure_rendez_vous || "", dossier_simultane: newTerrainForm.dossier_simultane || "" });
                              updatedMandats[newTerrainForm.mandatIndex].terrain = { ...updatedMandats[newTerrainForm.mandatIndex].terrain, date_limite_leve: newTerrainForm.date_limite_leve || "", instruments_requis: newTerrainForm.instruments_requis || "", donneur: newTerrainForm.donneur || "", technicien: newTerrainForm.technicien || "", temps_prevu: newTerrainForm.temps_prevu || "", a_rendez_vous: newTerrainForm.a_rendez_vous || false, date_rendez_vous: newTerrainForm.date_rendez_vous || "", heure_rendez_vous: newTerrainForm.heure_rendez_vous || "", dossier_simultane: newTerrainForm.dossier_simultane || "" };
                              updatedMandats[newTerrainForm.mandatIndex].statut_terrain = "en_verification";
                              updatedMandats[newTerrainForm.mandatIndex].tache_actuelle = "Cédule";
                              setFormData({...formData, mandats: updatedMandats});
                              addActionLog("Terrain ajouté", `Terrain ajouté pour le mandat: ${formData.mandats[newTerrainForm.mandatIndex]?.type_mandat || 'Mandat ' + (newTerrainForm.mandatIndex + 1)}`);
                              setNewTerrainForm({});
                              setNewTerrainFormCollapsed(true);
                            }}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 h-8 text-xs mt-3 w-full border border-amber-500/30"
                          >
                            <Plus className="w-3 h-3 mr-1" />Ajouter le terrain
                          </Button>
                        </div>
                      )}
                    </div>
                    {formData.mandats.some(m => m.terrains_list && m.terrains_list.length > 0) && (
                      <div className="overflow-hidden">
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
                              if (!mandat.terrains_list || mandat.terrains_list.length === 0) return [];
                              return mandat.terrains_list.map((terrain, terrainIndex) => (
                                <TableRow key={`${mandatIndex}-${terrainIndex}`} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell><Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(mandat.type_mandat) || `Mandat ${mandatIndex + 1}`}</Badge></TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.date_limite_leve ? format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.date_cedulee ? format(new Date(terrain.date_cedulee + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.equipe_assignee || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.instruments_requis || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.donneur || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.technicien || "-"}</TableCell>
                                  <TableCell className="text-slate-300 text-xs">{terrain.temps_prevu || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button type="button" onClick={() => { setEditingTerrainInfo({ mandatIndex, terrainIndex, terrain, mandat }); setTerrainForm({ date_limite_leve: terrain.date_limite_leve || "", instruments_requis: terrain.instruments_requis || "", a_rendez_vous: terrain.a_rendez_vous || false, date_rendez_vous: terrain.date_rendez_vous || "", heure_rendez_vous: terrain.heure_rendez_vous || "", donneur: terrain.donneur || "", technicien: terrain.technicien || "", dossier_simultane: terrain.dossier_simultane || "", temps_prevu: terrain.temps_prevu || "", notes: terrain.notes || "" }); setIsTerrainDialogOpen(true); }} className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 p-1 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                                      <button type="button" onClick={() => { setTerrainToDeleteInfo({ mandatIndex, terrainIndex, mandat }); setShowDeleteTerrainConfirm(true); }} className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors"><Trash className="w-4 h-4" /></button>
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
            {formData.mandats.length > 0 && !hideSections.includes('minutes') && (
              <MinutesSection
                formData={formData}
                setFormData={setFormData}
                addActionLog={addActionLog}
                onDeleteRequest={(info) => { setMinuteToDeleteInfo(info); setShowDeleteMinuteConfirm(true); }}
                collapsed={minutesCollapsed}
                onToggleCollapse={(val) => setMinutesCollapsed(typeof val === 'boolean' ? val : !minutesCollapsed)}
              />
            )}

            {/* Section Entrée de temps */}
            {editingDossier && (
              <EntreeTempsSection
                editingDossier={editingDossier}
                formData={formData}
                users={users}
                entreesTemps={entreesTemps}
                setEntreesTemps={setEntreesTemps}
                addActionLog={addActionLog}
                user={user}
                onDeleteRequest={(info) => { setMinuteToDeleteInfo(info); setShowDeleteMinuteConfirm(true); }}
                collapsed={entreeTempsCollapsed}
                onToggleCollapse={(val) => setEntreeTempsCollapsed(typeof val === 'boolean' ? val : !entreeTempsCollapsed)}
              />
            )}

            {/* Section Retour d'appel */}
            {editingDossier && (
              <RetourAppelSection
                editingDossier={editingDossier}
                formData={formData}
                setFormData={setFormData}
                users={users}
                retoursAppel={retoursAppel}
                setRetoursAppel={setRetoursAppel}
                addActionLog={addActionLog}
                onDeleteRequest={(info) => { setMinuteToDeleteInfo(info); setShowDeleteMinuteConfirm(true); }}
                collapsed={retourAppelCollapsed}
                onToggleCollapse={(val) => setRetourAppelCollapsed(typeof val === 'boolean' ? val : !retourAppelCollapsed)}
              />
            )}

            {/* Section Documents */}
            {formData.numero_dossier && formData.arpenteur_geometre && (
              <div className="mt-3" data-section="documents">
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

        {/* Sidebar - 25% */}
        <div className="flex-[0_0_calc(25%-12px)] flex flex-col overflow-hidden">
          {formData.mandats.length > 0 && formData.mandats[activeTabMandat]?.adresse_travaux && (
            formData.mandats[activeTabMandat].adresse_travaux.rue || formData.mandats[activeTabMandat].adresse_travaux.ville
          ) && (
            <>
              <div className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between" onClick={() => setMapCollapsed(!mapCollapsed)}>
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
                      <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(`${formData.mandats[activeTabMandat]?.adresse_travaux?.numeros_civiques?.[0] || ''} ${formData.mandats[activeTabMandat]?.adresse_travaux?.rue || ''}, ${formData.mandats[activeTabMandat]?.adresse_travaux?.ville || ''}, ${formData.mandats[activeTabMandat]?.adresse_travaux?.province || 'Québec'}, Canada`)}&zoom=15`}
                      />
                    </div>
                    <div className="p-2 bg-slate-800/80">
                      <p className="text-xs text-slate-300 truncate">📍 {formData.mandats[activeTabMandat]?.adresse_travaux?.numeros_civiques?.[0]} {formData.mandats[activeTabMandat]?.adresse_travaux?.rue}, {formData.mandats[activeTabMandat]?.adresse_travaux?.ville}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <div className="flex items-center gap-2">
              {sidebarTab === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
              <h3 className="text-slate-300 text-base font-semibold">{sidebarTab === "commentaires" ? "Commentaires" : "Historique"}</h3>
            </div>
            {sidebarCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </div>

          {!sidebarCollapsed && (
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Commentaires
                  {(commentairesTemporaires.length + commentaires.length) > 0 && (
                    <span className="ml-1.5 bg-orange-500/30 text-orange-400 text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none pointer-events-none select-none">{commentairesTemporaires.length + commentaires.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                  <Clock className="w-4 h-4 mr-1" />Historique
                </TabsTrigger>
              </TabsList>
              <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                <CommentairesSection dossierId={editingDossier?.id} dossierTemporaire={!editingDossier} commentairesTemp={commentairesTemporaires} onCommentairesTempChange={onCommentairesTemporairesChange} />
              </TabsContent>
              <TabsContent value="historique" className="flex-1 overflow-hidden p-0 mt-0">
                <DossierHistoriquePanel actionLogs={actionLogs} users={users || []} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-3 bg-slate-900 border-t border-slate-700">
        <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none text-white font-semibold" onClick={onCancel}>
          {editingDossier ? "Fermer" : "Annuler"}
        </Button>
        {!editingDossier && (
          <Button type="submit" form="edit-dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none text-white font-semibold">
            Créer
          </Button>
        )}
      </div>
    </motion.div>

    <>
      <ConfirmDeleteDialog
        open={showDeleteMinuteConfirm}
        onOpenChange={(open) => { setShowDeleteMinuteConfirm(open); if (!open) setMinuteToDeleteInfo(null); }}
        onConfirm={async () => {
          if (minuteToDeleteInfo?.minute && minuteToDeleteInfo?.mandatIndex !== undefined) {
            const updatedMandats = [...formData.mandats];
            const mandatLabel = formData.mandats[minuteToDeleteInfo.mandatIndex]?.type_mandat || `Mandat ${minuteToDeleteInfo.mandatIndex + 1}`;
            updatedMandats[minuteToDeleteInfo.mandatIndex].minutes_list = updatedMandats[minuteToDeleteInfo.mandatIndex].minutes_list.filter((_, idx) => idx !== minuteToDeleteInfo.minuteIndex);
            setFormData({...formData, mandats: updatedMandats});
            addActionLog("Minute supprimée", `Minute ${minuteToDeleteInfo.minute} supprimée pour le mandat: ${mandatLabel}`);
          } else if (minuteToDeleteInfo?.entreeTempsId) {
            const entree = entreesTemps.find(e => e.id === minuteToDeleteInfo.entreeTempsId);
            await base44.entities.EntreeTemps.delete(minuteToDeleteInfo.entreeTempsId);
            setEntreesTemps(prev => prev.filter(e => e.id !== minuteToDeleteInfo.entreeTempsId));
            if (entree) addActionLog("Entrée de temps supprimée", `${entree.heures}h - ${entree.tache} - ${entree.mandat}`);
          } else if (minuteToDeleteInfo?.retourAppelId) {
            const retour = retoursAppel.find(r => r.id === minuteToDeleteInfo.retourAppelId);
            await base44.entities.RetourAppel.delete(minuteToDeleteInfo.retourAppelId);
            setRetoursAppel(prev => prev.filter(r => r.id !== minuteToDeleteInfo.retourAppelId));
            if (retour) addActionLog("Retour d'appel supprimé", `${retour.raison}`);
          }
          setMinuteToDeleteInfo(null);
        }}
        message={
          minuteToDeleteInfo?.minute ? `Êtes-vous sûr de vouloir supprimer cette minute (${minuteToDeleteInfo.minute}) ? Cette action est irréversible.` :
          minuteToDeleteInfo?.entreeTempsId ? "Êtes-vous sûr de vouloir supprimer cette entrée de temps ? Cette action est irréversible." :
          minuteToDeleteInfo?.retourAppelId ? "Êtes-vous sûr de vouloir supprimer ce retour d'appel ? Cette action est irréversible." :
          "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible."
        }
      />

      <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { const mandatLabel = formData.mandats[mandatIndexToDelete]?.type_mandat || `Mandat ${mandatIndexToDelete + 1}`; addActionLog("Mandat supprimé", `Mandat supprimé: ${mandatLabel}`); removeMandat(mandatIndexToDelete); setActiveTabMandat(Math.max(0, mandatIndexToDelete - 1).toString()); setShowDeleteMandatConfirm(false); setMandatIndexToDelete(null); }} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none">Supprimer</Button>
              <Button type="button" onClick={() => { setShowDeleteMandatConfirm(false); setMandatIndexToDelete(null); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none">Annuler</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={showDeleteDossierConfirm}
        onOpenChange={setShowDeleteDossierConfirm}
        onConfirm={async () => {
          if (!editingDossier?.id) return;
          await base44.entities.Dossier.delete(editingDossier.id);
          queryClient.invalidateQueries({ queryKey: ['dossiers'] });
          onCancel();
        }}
        message={`Êtes-vous sûr de vouloir supprimer définitivement le dossier ${getArpenteurInitials(formData.arpenteur_geometre)}${formData.numero_dossier} ? Cette action est irréversible.`}
      />

      <ConfirmDeleteDialog
        open={showDeleteTerrainConfirm}
        onOpenChange={(open) => { setShowDeleteTerrainConfirm(open); if (!open) setTerrainToDeleteInfo(null); }}
        onConfirm={() => {
          if (!terrainToDeleteInfo) return;
          const { mandatIndex, terrainIndex, mandat } = terrainToDeleteInfo;
          const updatedMandats = [...formData.mandats];
          updatedMandats[mandatIndex].terrains_list = updatedMandats[mandatIndex].terrains_list.filter((_, idx) => idx !== terrainIndex);
          if (updatedMandats[mandatIndex].terrains_list.length === 0) { updatedMandats[mandatIndex].statut_terrain = null; updatedMandats[mandatIndex].date_terrain = null; updatedMandats[mandatIndex].equipe_assignee = null; }
          setFormData({...formData, mandats: updatedMandats});
          addActionLog("Terrain supprimé", `Terrain supprimé pour le mandat: ${mandat?.type_mandat || 'Mandat ' + (mandatIndex + 1)}`);
          setTerrainToDeleteInfo(null);
        }}
        message="Êtes-vous sûr de vouloir supprimer ce terrain ? Cette action est irréversible."
      />

      <TerrainEditDialog
        open={isTerrainDialogOpen}
        onOpenChange={setIsTerrainDialogOpen}
        editingTerrainInfo={editingTerrainInfo}
        terrainForm={terrainForm}
        setTerrainForm={setTerrainForm}
        formData={formData}
        users={users}
        allDossiers={allDossiers}
        getClientsNames={getClientsNames}
        onSave={() => {
          if (editingTerrainInfo) {
            const updatedMandats = [...formData.mandats];
            updatedMandats[editingTerrainInfo.mandatIndex].terrains_list[editingTerrainInfo.terrainIndex] = { ...updatedMandats[editingTerrainInfo.mandatIndex].terrains_list[editingTerrainInfo.terrainIndex], ...terrainForm };
            setFormData({...formData, mandats: updatedMandats});
            addActionLog("Terrain modifié", `Terrain modifié pour le mandat: ${editingTerrainInfo.mandat?.type_mandat || 'Mandat ' + (editingTerrainInfo.mandatIndex + 1)}`);
            setIsTerrainDialogOpen(false);
          }
        }}
      />
    </>
    </>
  );
}