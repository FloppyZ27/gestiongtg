import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FileCheck, User, X, UserPlus, Calendar, Eye, Check, Grid3x3, Send, Package, FileText, FilePlus, ChevronDown, ChevronUp, MapPin, MessageSquare, FileQuestion, FolderOpen, XCircle, Briefcase, Loader2, Upload, File, ExternalLink, Clock, Filter, DollarSign, Receipt, Users, Home, ClipboardList, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { CADASTRE_CODES, CADASTRES_PAR_CIRCONSCRIPTION } from "../lib/cadastreCodes";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";
import CommentairesSection from "../components/dossiers/CommentairesSection";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";
import ClientFormDialog from "../components/clients/ClientFormDialog";
import MandatTabs from "../components/dossiers/MandatTabs";
import ClientStepForm from "../components/mandat/ClientStepForm";
import AddressStepForm from "../components/mandat/AddressStepForm";
import MandatStepForm from "../components/mandat/MandatStepForm";
import TarificationStepForm from "../components/mandat/TarificationStepForm";
import ProfessionnelStepForm from "../components/mandat/ProfessionnelStepForm";
import DocumentsStepForm from "../components/mandat/DocumentsStepForm";
import DocumentsStepFormLot from "../components/lots/DocumentsStepFormLot";
import LotInfoStepForm from "../components/lots/LotInfoStepForm";
import TypesOperationStepForm from "../components/lots/TypesOperationStepForm";
import DossierInfoStepForm from "../components/mandat/DossierInfoStepForm";
import OuvrirDossierDialog from "../components/mandat/OuvrirDossierDialog";

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

const PriseDeMandat = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    openNewDialog: () => {
      resetFullForm();
      setIsDialogOpen(true);
    }
  }));
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isNotaireSelectorOpen, setIsNotaireSelectorOpen] = useState(false);
  const [isCourtierSelectorOpen, setIsCourtierSelectorOpen] = useState(false);

  // Expose function to child components via window object
  React.useEffect(() => {
    window.openClientForEdit = (client) => {
      setEditingClientForForm(client);
      setClientTypeForForm(client.type_client);
      setIsClientFormDialogOpen(true);
    };
    return () => {
      delete window.openClientForEdit;
    };
  }, []);

  // Replaced individual new client dialog states with a single one controlling the ClientFormDialog
  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [clientTypeForForm, setClientTypeForForm] = useState('Client'); // 'Client', 'Notaire', 'Courtier immobilier'
  const [editingClientForForm, setEditingClientForForm] = useState(null); // Holds client object for editing


  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");
  const [activeTabMandat, setActiveTabMandat] = useState("0");

  const [isLotSelectorOpen, setIsLotSelectorOpen] = useState(false);
  const [currentMandatIndex, setCurrentMandatIndex] = useState(null);
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const [lotCirconscriptionFilter, setLotCirconscriptionFilter] = useState("all");
  const [lotCadastreFilter, setLotCadastreFilter] = useState("Québec");
  const [isNewLotDialogOpen, setIsNewLotDialogOpen] = useState(false);
  const [newLotForm, setNewLotForm] = useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "Québec",
    rang: "",
    types_operation: []
  });
  const [availableCadastresForNewLot, setAvailableCadastresForNewLot] = useState([]);
  const [commentairesTemporairesLot, setCommentairesTemporairesLot] = useState([]);
  const [sidebarTabLot, setSidebarTabLot] = useState("commentaires");
  const [editingLot, setEditingLot] = useState(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [initialLotForm, setInitialLotForm] = useState(null);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [typesOperationCollapsed, setTypesOperationCollapsed] = useState(false);
  const [lotDocumentsCollapsed, setLotDocumentsCollapsed] = useState(false);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [sidebarCollapsedLot, setSidebarCollapsedLot] = useState(false);
  const [lotActionLogs, setLotActionLogs] = useState([]);
  const [isAddMinuteDialogOpen, setIsAddMinuteDialogOpen] = useState(false);
  const [currentMinuteMandatIndex, setCurrentMinuteMandatIndex] = useState(null);
  const [newMinuteForm, setNewMinuteForm] = useState({
    minute: "",
    date_minute: "",
    type_minute: "Initiale"
  });

  const [dossierReferenceId, setDossierReferenceId] = useState(null);
  const [dossierSearchForReference, setDossierSearchForReference] = useState("");

  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);

  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterStatut, setFilterStatut] = useState("all");
  const [activeListTab, setActiveListTab] = useState("nouveau");
  const [filterVille, setFilterVille] = useState([]);
  const [filterTypeMandat, setFilterTypeMandat] = useState([]);
  const [filterUrgence, setFilterUrgence] = useState([]);
  const [filterUtilisateurAssigne, setFilterUtilisateurAssigne] = useState("all");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [clientStepCollapsed, setClientStepCollapsed] = useState(false);
  const [addressStepCollapsed, setAddressStepCollapsed] = useState(false);
  const [mandatStepCollapsed, setMandatStepCollapsed] = useState(false);
  const [tarificationStepCollapsed, setTarificationStepCollapsed] = useState(true);
  const [professionnelStepCollapsed, setProfessionnelStepCollapsed] = useState(true);
  const [professionnelInfo, setProfessionnelInfo] = useState({ notaire: "", courtier: "", compagnie: "" });
  const [documentsStepCollapsed, setDocumentsStepCollapsed] = useState(true);
  const [showStatutChangeConfirm, setShowStatutChangeConfirm] = useState(false);
  const [pendingStatutChange, setPendingStatutChange] = useState(null);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [dossierInfoStepCollapsed, setDossierInfoStepCollapsed] = useState(false);
  const [mapCollapsed, setMapCollapsed] = useState(false);
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);
  const [isOuvrirDossierDialogOpen, setIsOuvrirDossierDialogOpen] = useState(false);
  const [nouveauDossierForm, setNouveauDossierForm] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    place_affaire: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    statut: "Ouvert",
    ttl: "Non",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: []
  });
  const [clientsTabExpanded, setClientsTabExpanded] = useState(false);
  const [notairesTabExpanded, setNotairesTabExpanded] = useState(false);
  const [courtiersTabExpanded, setCourtiersTabExpanded] = useState(false);
  const [isLotSelectorOpenDossier, setIsLotSelectorOpenDossier] = useState(false);
  const [lotTabExpanded, setLotTabExpanded] = useState(false);
  const [currentMandatIndexDossier, setCurrentMandatIndexDossier] = useState(null);
  const [activeTabMandatDossier, setActiveTabMandatDossier] = useState("0");
  const [commentairesTemporairesDossier, setCommentairesTemporairesDossier] = useState([]);
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [activeContactTab, setActiveContactTab] = useState("clients");
  const [mapCollapsedDossier, setMapCollapsedDossier] = useState(true);
  const [commentsCollapsedDossier, setCommentsCollapsedDossier] = useState(false);
  const [sidebarTabDossier, setSidebarTabDossier] = useState("commentaires");
  const [historiqueDossier, setHistoriqueDossier] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarCollapsedDossier, setSidebarCollapsedDossier] = useState(false);
  const [contactsListCollapsed, setContactsListCollapsed] = useState(true);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);
  const [currentMandatIndexForAddress, setCurrentMandatIndexForAddress] = useState(null);
  const [sameAddressForAllMandats, setSameAddressForAllMandats] = useState(true);
  const [sameDatesForAllMandats, setSameDatesForAllMandats] = useState(false);
  const [sameLotsForAllMandats, setSameLotsForAllMandats] = useState(false);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [dossierDocuments, setDossierDocuments] = useState([]);
  const [viewingPdfUrl, setViewingPdfUrl] = useState(null);
  const [viewingPdfName, setViewingPdfName] = useState("");
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  const [historique, setHistorique] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showCancelConfirmDossier, setShowCancelConfirmDossier] = useState(false);
  const [showArpenteurRequiredDialog, setShowArpenteurRequiredDialog] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showDeleteMandatConfirm, setShowDeleteMandatConfirm] = useState(false);
  const [mandatIndexToDelete, setMandatIndexToDelete] = useState(null);
  const [showMissingUserWarning, setShowMissingUserWarning] = useState(false);
  const [showConcordanceWarning, setShowConcordanceWarning] = useState(false);
  const [showD01ImportSuccess, setShowD01ImportSuccess] = useState(false);
  const [showDeleteConcordanceConfirm, setShowDeleteConcordanceConfirm] = useState(false);
  const [concordanceIndexToDelete, setConcordanceIndexToDelete] = useState(null);
  const [showCancelLotConfirm, setShowCancelLotConfirm] = useState(false);
  const [showLotExistsWarning, setShowLotExistsWarning] = useState(false);
  const [showLotMissingFieldsWarning, setShowLotMissingFieldsWarning] = useState(false);
  const [showDeletePriseMandatConfirm, setShowDeletePriseMandatConfirm] = useState(false);
  const [priseMandatIdToDelete, setPriseMandatIdToDelete] = useState(null);
  const [initialPriseMandatData, setInitialPriseMandatData] = useState(null);
  const [workAddress, setWorkAddress] = useState({
    numeros_civiques: [""],
    rue: "",
    ville: "",
    province: "QC",
    code_postal: ""
  });
  const [clientInfo, setClientInfo] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    type_telephone: "Cellulaire",
    courriel: ""
  });
  const [mandatsInfo, setMandatsInfo] = useState([{
    type_mandat: "",
    echeance_souhaitee: "",
    date_signature: "",
    date_debut_travaux: "",
    date_livraison: "",
    urgence_percue: "",
    prix_estime: 0,
    rabais: 0,
    taxes_incluses: false
  }]);

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_fermeture: "",
    statut: "Nouveau mandat/Demande d'information",
    ttl: "Non",
    utilisateur_assigne: "",
    clients_ids: [],
    clients_texte: "",
    notaires_ids: [],
    notaires_texte: "",
    courtiers_ids: [],
    courtiers_texte: "",
    placeAffaire: "",
    mandats: [],
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: priseMandats = [], isLoading: isLoadingPriseMandats } = useQuery({
    queryKey: ['priseMandats'],
    queryFn: () => base44.entities.PriseMandat.list('-created_date'),
    initialData: [],
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
  });

  const { data: entreeTemps = [] } = useQuery({
    queryKey: ['entreeTemps'],
    queryFn: () => base44.entities.EntreeTemps.list('-date'),
    initialData: [],
  });

  const { data: compteurs = [] } = useQuery({
    queryKey: ['compteursMandats'],
    queryFn: () => base44.entities.CompteurMandat.list('-date_creation'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fonction pour calculer le prochain numéro de dossier disponible
  const calculerProchainNumeroDossier = (arpenteur, excludePriseMandatId = null) => {
    const arpenteurDossiers = dossiers.filter(d => d.arpenteur_geometre === arpenteur && d.numero_dossier);
    const maxDossier = arpenteurDossiers.reduce((max, d) => {
      const num = parseInt(d.numero_dossier, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    const arpenteurPriseMandats = priseMandats.filter(p => 
      p.arpenteur_geometre === arpenteur && 
      p.statut === "Mandats à ouvrir" && 
      p.id !== excludePriseMandatId && 
      p.numero_dossier
    );
    const maxPriseMandat = arpenteurPriseMandats.reduce((max, p) => {
      const num = parseInt(p.numero_dossier, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    return (Math.max(maxDossier, maxPriseMandat) + 1).toString();
  };

  // Fonction pour vérifier si un numéro de dossier existe déjà pour un arpenteur
  const numeroDossierExiste = (arpenteur, numero, excludePriseMandatId = null) => {
    // Vérifier dans les dossiers existants
    const existeDansDossiers = dossiers.some(d => 
      d.arpenteur_geometre === arpenteur && d.numero_dossier === numero
    );
    
    // Vérifier dans les prises de mandat "Mandats à ouvrir"
    const existeDansPriseMandats = priseMandats.some(p => 
      p.arpenteur_geometre === arpenteur && 
      p.statut === "Mandats à ouvrir" && 
      p.numero_dossier === numero &&
      p.id !== excludePriseMandatId
    );
    
    return existeDansDossiers || existeDansPriseMandats;
  };

  // Détecter si un dossier_id est passé dans l'URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dossierIdFromUrl = urlParams.get('dossier_id');
    
    if (dossierIdFromUrl && dossiers.length > 0) {
      const dossier = dossiers.find(d => d.id === dossierIdFromUrl);
      if (dossier) {
        handleView(dossier);
        // Nettoyer l'URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [dossiers]);

  const createPriseMandatMutation = useMutation({
    mutationFn: async (data) => {
      // Préparer les commentaires à inclure dans l'entité
      const commentsToSave = commentairesTemporaires.map(c => ({
        contenu: c.contenu,
        utilisateur_email: c.utilisateur_email,
        utilisateur_nom: c.utilisateur_nom,
        date: c.created_date || new Date().toISOString()
      }));

      const priseMandatData = {
        arpenteur_geometre: data.arpenteur_geometre,
        place_affaire: data.place_affaire,
        numero_dossier: data.numero_dossier,
        date_ouverture: data.date_ouverture,
        clients_ids: data.clients_ids,
        notaires_ids: data.notaires_ids,
        courtiers_ids: data.courtiers_ids,
        compagnies_ids: data.compagnies_ids,
        client_info: data.client_info,
        professionnel_info: data.professionnel_info,
        adresse_travaux: data.adresse_travaux,
        mandats: data.mandats,
        echeance_souhaitee: data.echeance_souhaitee,
        date_signature: data.date_signature,
        date_debut_travaux: data.date_debut_travaux,
        date_livraison: data.date_livraison,
        urgence_percue: data.urgence_percue,
        statut: data.statut,
        commentaires: commentsToSave,
        historique: data.historique
      };

      return await base44.entities.PriseMandat.create(priseMandatData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
      setIsDialogOpen(false);
      resetFullForm();
      setCommentairesTemporaires([]);
    },
  });

  const deletePriseMandatMutation = useMutation({
    mutationFn: (id) => base44.entities.PriseMandat.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
    },
  });

  const [editingPriseMandat, setEditingPriseMandat] = useState(null);

  const handleEditPriseMandat = async (pm) => {
    // Vérifier si le mandat est verrouillé par quelqu'un d'autre
    if (pm.locked_by && pm.locked_by !== user?.email) {
      const lockedUser = users.find(u => u.email === pm.locked_by);
      setIsLocked(true);
      setLockedBy(lockedUser?.full_name || pm.locked_by);
    } else {
      setIsLocked(false);
      setLockedBy("");
      
      // Verrouiller le mandat pour l'utilisateur actuel
      await base44.entities.PriseMandat.update(pm.id, {
        ...pm,
        locked_by: user?.email,
        locked_at: new Date().toISOString()
      });
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
    }
    
    setEditingPriseMandat(pm);
    setInitialPriseMandatData(JSON.parse(JSON.stringify(pm)));
    setHasFormChanges(false);
    
    // Charger l'historique si présent
    setHistorique(pm.historique || []);
    
    // Utiliser le numéro de dossier existant si disponible
    let numeroDossier = pm.numero_dossier || "";
    let dateOuverture = pm.date_ouverture || new Date().toISOString().split('T')[0];
    
    // Remplir le formulaire avec les données existantes
    setFormData({
      ...formData,
      arpenteur_geometre: pm.arpenteur_geometre || "",
      placeAffaire: pm.place_affaire || "",
      clients_ids: pm.clients_ids || [],
      notaires_ids: pm.notaires_ids || [],
      courtiers_ids: pm.courtiers_ids || [],
      compagnies_ids: pm.compagnies_ids || [],
      statut: pm.statut || "Nouveau mandat/Demande d'information",
      numero_dossier: numeroDossier,
      date_ouverture: dateOuverture
    });
    
    // Charger les infos professionnelles si présentes
    setProfessionnelInfo({
      notaire: "",
      courtier: "",
      compagnie: ""
    });
    
    setWorkAddress(pm.adresse_travaux || {
      numeros_civiques: [""],
      rue: "",
      ville: "",
      province: "QC",
      code_postal: "",
      numero_lot: ""
    });
    
    setClientInfo(pm.client_info || {
      prenom: "",
      nom: "",
      telephone: "",
      type_telephone: "Cellulaire",
      courriel: ""
    });
    
    setProfessionnelInfo(pm.professionnel_info || {
      notaire: "",
      courtier: "",
      compagnie: ""
    });
    
    // Reconstruire les mandatsInfo à partir des mandats stockés
    const mandatsFromDb = (pm.mandats || []).map(m => ({
      type_mandat: m.type_mandat || "",
      echeance_souhaitee: pm.echeance_souhaitee || "",
      date_signature: pm.date_signature || "",
      date_debut_travaux: pm.date_debut_travaux || "",
      date_livraison: pm.date_livraison || "",
      urgence_percue: pm.urgence_percue || "",
      prix_estime: m.prix_estime || 0,
      prix_premier_lot: m.prix_premier_lot || 0,
      prix_autres_lots: m.prix_autres_lots || 0,
      rabais: m.rabais || 0,
      taxes_incluses: m.taxes_incluses || false
    }));
    
    setMandatsInfo(mandatsFromDb.length > 0 ? mandatsFromDb : [{
      type_mandat: "",
      echeance_souhaitee: pm.echeance_souhaitee || "",
      date_signature: pm.date_signature || "",
      date_debut_travaux: pm.date_debut_travaux || "",
      date_livraison: pm.date_livraison || "",
      urgence_percue: pm.urgence_percue || "",
      prix_estime: 0,
      prix_premier_lot: 0,
      prix_autres_lots: 0,
      rabais: 0,
      taxes_incluses: false
    }]);
    
    setCommentairesTemporaires(pm.commentaires?.map((c, idx) => ({
      id: `temp-${idx}`,
      contenu: c.contenu,
      utilisateur_email: c.utilisateur_email,
      utilisateur_nom: c.utilisateur_nom,
      created_date: c.date
    })) || []);
    
    // Collapser toutes les sections en mode modification
    setClientStepCollapsed(true);
    setAddressStepCollapsed(true);
    setMandatStepCollapsed(true);
    setTarificationStepCollapsed(true);
    setDocumentsStepCollapsed(true);
    
    setIsDialogOpen(true);
  };

  const updatePriseMandatMutation = useMutation({
    mutationFn: async ({ id, data, autoSave = false }) => {
      const commentsToSave = commentairesTemporaires.map(c => ({
        contenu: c.contenu,
        utilisateur_email: c.utilisateur_email,
        utilisateur_nom: c.utilisateur_nom,
        date: c.created_date || new Date().toISOString()
      }));

      const priseMandatData = {
        arpenteur_geometre: data.arpenteur_geometre,
        place_affaire: data.place_affaire,
        numero_dossier: data.numero_dossier,
        date_ouverture: data.date_ouverture,
        clients_ids: data.clients_ids,
        notaires_ids: data.notaires_ids,
        courtiers_ids: data.courtiers_ids,
        compagnies_ids: data.compagnies_ids,
        client_info: data.client_info,
        professionnel_info: data.professionnel_info,
        adresse_travaux: data.adresse_travaux,
        mandats: data.mandats,
        echeance_souhaitee: data.echeance_souhaitee,
        date_signature: data.date_signature,
        date_debut_travaux: data.date_debut_travaux,
        date_livraison: data.date_livraison,
        urgence_percue: data.urgence_percue,
        statut: data.statut,
        commentaires: commentsToSave,
        historique: data.historique,
        locked_by: autoSave ? data.locked_by : null,
        locked_at: autoSave ? data.locked_at : null
      };

      return await base44.entities.PriseMandat.update(id, priseMandatData);
    },
    onSuccess: (updatedPriseMandat, variables) => {
      if (!variables.autoSave) {
        // Sauvegarde manuelle - fermer le dialog et rafraîchir
        queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
        setIsDialogOpen(false);
        resetFullForm();
        setCommentairesTemporaires([]);
        setEditingPriseMandat(null);
        setIsLocked(false);
        setLockedBy("");
        setHasFormChanges(false);
        setInitialPriseMandatData(null);
      } else {
        // Auto-save - NE PAS rafraîchir, juste mettre à jour les états locaux
        setEditingPriseMandat(updatedPriseMandat);setHistorique(updatedPriseMandat.historique||[]);
        setInitialPriseMandatData(JSON.parse(JSON.stringify(updatedPriseMandat)));
        setHasFormChanges(false);
      }
    },
  });

  // Détecter les changements (sans auto-save automatique)
  useEffect(() => {
    if (initialPriseMandatData && editingPriseMandat && !isLocked) {
      const currentData = {
        arpenteur_geometre: formData.arpenteur_geometre,
        place_affaire: formData.placeAffaire,
        clients_ids: formData.clients_ids,
        notaires_ids: formData.notaires_ids,
        courtiers_ids: formData.courtiers_ids,
        compagnies_ids: formData.compagnies_ids,
        client_info: clientInfo,
        professionnel_info: professionnelInfo,
        adresse_travaux: workAddress,
        mandats: mandatsInfo,
        statut: formData.statut,
        numero_dossier: formData.numero_dossier,
        date_ouverture: formData.date_ouverture
      };
      
      const initialData = {
        arpenteur_geometre: initialPriseMandatData.arpenteur_geometre,
        place_affaire: initialPriseMandatData.place_affaire || "",
        clients_ids: initialPriseMandatData.clients_ids || [],
        notaires_ids: initialPriseMandatData.notaires_ids || [],
        courtiers_ids: initialPriseMandatData.courtiers_ids || [],
        compagnies_ids: initialPriseMandatData.compagnies_ids || [],
        client_info: initialPriseMandatData.client_info || {},
        professionnel_info: initialPriseMandatData.professionnel_info || {},
        adresse_travaux: initialPriseMandatData.adresse_travaux || {},
        mandats: (initialPriseMandatData.mandats || []).map(m => ({
          type_mandat: m.type_mandat || "",
          echeance_souhaitee: initialPriseMandatData.echeance_souhaitee || "",
          date_signature: initialPriseMandatData.date_signature || "",
          date_debut_travaux: initialPriseMandatData.date_debut_travaux || "",
          date_livraison: initialPriseMandatData.date_livraison || "",
          urgence_percue: initialPriseMandatData.urgence_percue || "",
          prix_estime: m.prix_estime || 0,
          prix_premier_lot: m.prix_premier_lot || 0,
          prix_autres_lots: m.prix_autres_lots || 0,
          rabais: m.rabais || 0,
          taxes_incluses: m.taxes_incluses || false
        })),
        statut: initialPriseMandatData.statut,
        numero_dossier: initialPriseMandatData.numero_dossier || "",
        date_ouverture: initialPriseMandatData.date_ouverture || ""
      };
      
      const hasCommentChanges = JSON.stringify(commentairesTemporaires.map(c=>c.contenu)) !== JSON.stringify((initialPriseMandatData.commentaires||[]).map(c=>c.contenu));
      const hasChanges = JSON.stringify(currentData) !== JSON.stringify(initialData) || hasCommentChanges;
      setHasFormChanges(hasChanges);
    }
  }, [formData, clientInfo, professionnelInfo, workAddress, mandatsInfo, initialPriseMandatData, editingPriseMandat, commentairesTemporaires]);

  const handleAutoSave = async (overrideCommentaires) => {
    const currentCommentaires = Array.isArray(overrideCommentaires) ? overrideCommentaires : commentairesTemporaires;
    if (!initialPriseMandatData || !editingPriseMandat || isLocked) return;
    if (!overrideCommentaires && !hasFormChanges) return;
    const mandatsToSave = mandatsInfo
      .filter(m => m.type_mandat)
      .map(m => ({
        type_mandat: m.type_mandat,
        prix_estime: m.prix_estime || 0,
        prix_premier_lot: m.prix_premier_lot || 0,
        prix_autres_lots: m.prix_autres_lots || 0,
        rabais: m.rabais || 0,
        taxes_incluses: m.taxes_incluses || false
      }));

    const dataToSubmit = {
      arpenteur_geometre: formData.arpenteur_geometre,
      place_affaire: formData.placeAffaire,
      numero_dossier: formData.numero_dossier,
      date_ouverture: formData.date_ouverture,
      clients_ids: formData.clients_ids,
      notaires_ids: formData.notaires_ids || [],
      courtiers_ids: formData.courtiers_ids || [],
      compagnies_ids: formData.compagnies_ids || [],
      client_info: clientInfo,
      professionnel_info: professionnelInfo,
      adresse_travaux: workAddress,
      mandats: mandatsToSave,
      echeance_souhaitee: mandatsInfo[0]?.echeance_souhaitee || "",
      date_signature: mandatsInfo[0]?.date_signature || "",
      date_debut_travaux: mandatsInfo[0]?.date_debut_travaux || "",
      date_livraison: mandatsInfo[0]?.date_livraison || "",
      urgence_percue: mandatsInfo[0]?.urgence_percue || "",
      statut: formData.statut,
      locked_by: user?.email,
      locked_at: editingPriseMandat.locked_at
    };

    const newHistoriqueEntries = [];
    const now = new Date().toISOString();
    const userName = user?.full_name || "Utilisateur";
    const userEmail = user?.email || "";
    const _h=(a,d)=>newHistoriqueEntries.push({action:a,details:d,utilisateur_nom:userName,utilisateur_email:userEmail,date:now});
    if(editingPriseMandat.statut!==formData.statut)_h("Changement de statut",`${editingPriseMandat.statut} → ${formData.statut}`);
    if(editingPriseMandat.arpenteur_geometre!==formData.arpenteur_geometre)_h("Changement d'arpenteur-géomètre",`${editingPriseMandat.arpenteur_geometre||'Non défini'} → ${formData.arpenteur_geometre}`);
    if((editingPriseMandat.place_affaire||'')!==(formData.placeAffaire||''))_h("Changement de place d'affaire",`${editingPriseMandat.place_affaire||'Non définie'} → ${formData.placeAffaire||'Non définie'}`);
    const _oc=`${initialPriseMandatData.client_info?.prenom||''} ${initialPriseMandatData.client_info?.nom||''}`.trim();const _nc=`${clientInfo.prenom||''} ${clientInfo.nom||''}`.trim();
    if(_oc!==_nc&&(_oc||_nc))_h("Modification client",`${_oc||'—'} → ${_nc||'—'}`);
    const _ot=initialPriseMandatData.client_info?.telephone||'';const _nt=clientInfo.telephone||'';if(_ot!==_nt)_h("Modification téléphone",`${_ot||'—'} → ${_nt||'—'}`);const _ott=initialPriseMandatData.client_info?.type_telephone||'';const _ntt=clientInfo.type_telephone||'';if(_ott!==_ntt&&(_ott||_ntt))_h("Modification type de téléphone",`${_ott||'—'} → ${_ntt||'—'}`);const _oe=initialPriseMandatData.client_info?.courriel||'';const _ne=clientInfo.courriel||'';if(_oe!==_ne)_h("Modification courriel",`${_oe||'—'} → ${_ne||'—'}`);
    const _opn=initialPriseMandatData.professionnel_info?.notaire||'';const _npn=professionnelInfo.notaire||'';if(_opn!==_npn)_h("Modification notaire",`${_opn||'—'} → ${_npn||'—'}`);const _opc=initialPriseMandatData.professionnel_info?.courtier||'';const _npc=professionnelInfo.courtier||'';if(_opc!==_npc)_h("Modification courtier immobilier",`${_opc||'—'} → ${_npc||'—'}`);const _opco=initialPriseMandatData.professionnel_info?.compagnie||'';const _npco=professionnelInfo.compagnie||'';if(_opco!==_npco)_h("Modification compagnie",`${_opco||'—'} → ${_npco||'—'}`);
    const _oa=`${initialPriseMandatData.adresse_travaux?.numeros_civiques?.[0]||''}${initialPriseMandatData.adresse_travaux?.rue||''}${initialPriseMandatData.adresse_travaux?.ville||''}`;const _na=`${workAddress.numeros_civiques?.[0]||''}${workAddress.rue||''}${workAddress.ville||''}`;if(_oa!==_na&&_na)_h("Modification adresse des travaux",`${workAddress.numeros_civiques?.[0]||''} ${workAddress.rue||''}, ${workAddress.ville||''}`.trim());const _onl=initialPriseMandatData.adresse_travaux?.numero_lot||'';const _nnl=workAddress.numero_lot||'';if(_onl!==_nnl)_h("Modification N\u00b0 de lot",`${_onl||'—'} → ${_nnl||'—'}`);const _ocp=initialPriseMandatData.adresse_travaux?.code_postal||'';const _ncp=workAddress.code_postal||'';if(_ocp!==_ncp)_h("Modification code postal",`${_ocp||'—'} → ${_ncp||'—'}`);const _oprov=initialPriseMandatData.adresse_travaux?.province||'';const _nprov=workAddress.province||'';if(_oprov!==_nprov)_h("Modification province",`${_oprov||'—'} → ${_nprov||'—'}`);
    const _om=(initialPriseMandatData.mandats||[]).map(m=>m.type_mandat).join(',');const _nm=mandatsInfo.filter(m=>m.type_mandat).map(m=>m.type_mandat).join(',');if(_om!==_nm)_h("Modification mandats",_nm||'—');const _oes=initialPriseMandatData.echeance_souhaitee||'';const _nes=mandatsInfo[0]?.echeance_souhaitee||'';if(_oes!==_nes)_h("Modification échéance souhaitée",`${_oes||'—'} → ${_nes||'—'}`);const _ods=initialPriseMandatData.date_signature||'';const _nds=mandatsInfo[0]?.date_signature||'';if(_ods!==_nds)_h("Modification date de signature",`${_ods||'—'} → ${_nds||'—'}`);const _odt=initialPriseMandatData.date_debut_travaux||'';const _ndt=mandatsInfo[0]?.date_debut_travaux||'';if(_odt!==_ndt)_h("Modification début des travaux",`${_odt||'—'} → ${_ndt||'—'}`);const _odl=initialPriseMandatData.date_livraison||'';const _ndl=mandatsInfo[0]?.date_livraison||'';if(_odl!==_ndl)_h("Modification date de livraison",`${_odl||'—'} → ${_ndl||'—'}`);const _oup=initialPriseMandatData.urgence_percue||'';const _nup=mandatsInfo[0]?.urgence_percue||'';if(_oup!==_nup)_h("Modification urgence perçue",`${_oup||'—'} → ${_nup||'—'}`);mandatsInfo.forEach((m,i)=>{const om=(initialPriseMandatData.mandats||[])[i];if(!om)return;const lbl=m.type_mandat||`Mandat ${i+1}`;if((parseFloat(om.quantite)||1)!==(parseFloat(m.quantite)||1))_h(`Quantité (${lbl})`,`${parseFloat(om.quantite)||1} → ${parseFloat(m.quantite)||1}`);if((om.prix_estime||0)!==(m.prix_estime||0))_h(`Prix estimé (${lbl})`,`${om.prix_estime||0} $ → ${m.prix_estime||0} $`);if((om.prix_premier_lot||0)!==(m.prix_premier_lot||0))_h(`Prix premier lot (${lbl})`,`${om.prix_premier_lot||0} $ → ${m.prix_premier_lot||0} $`);if((om.prix_autres_lots||0)!==(m.prix_autres_lots||0))_h(`Prix autres lots (${lbl})`,`${om.prix_autres_lots||0} $ → ${m.prix_autres_lots||0} $`);if((om.rabais||0)!==(m.rabais||0))_h(`Rabais (${lbl})`,`${om.rabais||0} $ → ${m.rabais||0} $`);if(!!om.taxes_incluses!==!!m.taxes_incluses)_h(`Taxes incluses (${lbl})`,`${om.taxes_incluses?'Oui':'Non'} → ${m.taxes_incluses?'Oui':'Non'}`);if(!!om.prix_convenu!==!!m.prix_convenu)_h(`Prix convenu avec le client (${lbl})`,`${om.prix_convenu?'Oui':'Non'} → ${m.prix_convenu?'Oui':'Non'}`);if((om.notes||'')!==(m.notes||''))_h(`Notes (${lbl})`,'Modifiées');});
    const _occ=initialPriseMandatData.commentaires?.length||0,_ncc=currentCommentaires.length;
    if(_ncc>_occ)_h("Commentaire ajouté",`${_ncc-_occ} commentaire(s) ajouté(s)`);
    else if(_ncc<_occ)_h("Commentaire supprimé",`${_occ-_ncc} commentaire(s) supprimé(s)`);
    else{const oldC=(initialPriseMandatData.commentaires||[]).map(c=>c.contenu);const newC=currentCommentaires.map(c=>c.contenu);const strip=(h)=>h?.replace(/<[^>]*>/g,'').trim()||'';for(let i=0;i<Math.min(oldC.length,newC.length);i++){if(oldC[i]!==newC[i]){const ot=strip(oldC[i]).substring(0,80)+(strip(oldC[i]).length>80?'...':'');const nt=strip(newC[i]).substring(0,80)+(strip(newC[i]).length>80?'...':'');_h('Commentaire modifié',`Avant: "${ot}" → Après: "${nt}"`);}}}
    const updatedHistorique=[...newHistoriqueEntries,...historique];

    try {
      await updatePriseMandatMutation.mutateAsync({
        id: editingPriseMandat.id,
        data: { ...dataToSubmit, historique: updatedHistorique },
        autoSave: true
      });
    } catch (error) {
      console.error("Erreur sauvegarde auto:", error);
    }
  };

  const createDossierMutation = useMutation({
    mutationFn: async ({ dossierData, commentairesToCreate = null }) => {
      const newDossier = await base44.entities.Dossier.create(dossierData);

      // Utiliser les commentaires passés en paramètre ou les commentaires temporaires par défaut
      const commentsToUse = commentairesToCreate !== null ? commentairesToCreate : commentairesTemporaires;
      
      // Créer les commentaires temporaires si présents
      if (commentsToUse.length > 0) {
        const commentairePromises = commentsToUse.map(comment =>
          base44.entities.CommentaireDossier.create({
            dossier_id: newDossier.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }

      // Créer une notification si un utilisateur est assigné pour un retour d'appel
      if (dossierData.statut === "Retour d'appel" && dossierData.utilisateur_assigne) {
        const assignedUser = users.find(u => u.email === dossierData.utilisateur_assigne);
        if (assignedUser) {
          const clientsNames = getClientsNames(dossierData.clients_ids);
          await base44.entities.Notification.create({
            utilisateur_email: dossierData.utilisateur_assigne,
            titre: "Nouveau retour d'appel assigné",
            message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
            type: "retour_appel",
            dossier_id: newDossier.id,
            lue: false
          });
        }
      }

      // Créer un compteur SEULEMENT pour le statut "Nouveau mandat/Demande d'information" ou "Mandats à ouvrir"
      if (dossierData.statut === "Nouveau mandat/Demande d'information" || dossierData.statut === "Mandats à ouvrir") {
        const nbMandats = newDossier.mandats?.length || 1;
        const compteurPromises = [];
        for (let i = 0; i < nbMandats; i++) {
          compteurPromises.push(
            base44.entities.CompteurMandat.create({
              dossier_id: newDossier.id,
              arpenteur_geometre: dossierData.arpenteur_geometre,
              type_mandat: newDossier.mandats?.[i]?.type_mandat || "",
              date_creation: new Date().toISOString().split('T')[0]
            })
          );
        }
        await Promise.all(compteurPromises);
      }

      return newDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['compteursMandats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Invalidate notifications query
      setIsDialogOpen(false);
      resetForm();
      // Clear temporary comments after successful submission
      setCommentairesTemporaires([]);
    },
  });

  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, dossierData }) => {
      const oldDossier = dossiers.find(d => d.id === id);
      const updatedDossier = await base44.entities.Dossier.update(id, dossierData);

      // Créer une notification si un nouvel utilisateur est assigné pour un retour d'appel
      if (dossierData.statut === "Retour d'appel" &&
          dossierData.utilisateur_assigne &&
          oldDossier?.utilisateur_assigne !== dossierData.utilisateur_assigne) {
        const assignedUser = users.find(u => u.email === dossierData.utilisateur_assigne);
        if (assignedUser) {
          const clientsNames = getClientsNames(dossierData.clients_ids);
          await base44.entities.Notification.create({
            utilisateur_email: dossierData.utilisateur_assigne,
            titre: "Nouveau retour d'appel assigné",
            message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
            type: "retour_appel",
            dossier_id: updatedDossier.id,
            lue: false
          });
        }
      }

      // Créer des notifications pour les utilisateurs nouvellement assignés aux mandats
      if (oldDossier && dossierData.mandats) {
        for (let i = 0; i < dossierData.mandats.length; i++) {
          const newMandat = dossierData.mandats[i];
          const oldMandat = oldDossier.mandats?.[i];
          
          // Si un utilisateur est assigné au mandat et qu'il est différent de l'ancien
          if (newMandat.utilisateur_assigne && 
              newMandat.utilisateur_assigne !== oldMandat?.utilisateur_assigne &&
              newMandat.type_mandat) {
            const clientsNames = getClientsNames(dossierData.clients_ids);
            const numeroDossier = dossierData.numero_dossier 
              ? `${getArpenteurInitials(dossierData.arpenteur_geometre)}${dossierData.numero_dossier}`
              : getArpenteurInitials(dossierData.arpenteur_geometre).slice(0, -1);
            
            await base44.entities.Notification.create({
              utilisateur_email: newMandat.utilisateur_assigne,
              titre: "Nouveau mandat assigné",
              message: `Un mandat "${newMandat.type_mandat}"${numeroDossier ? ` du dossier ${numeroDossier}` : ''}${clientsNames ? ` - ${clientsNames}` : ''} vous a été assigné.`,
              type: "dossier",
              dossier_id: id,
              lue: false
            });
          }
        }
      }

      // Créer compteur SEULEMENT si on passe au statut "Nouveau mandat/Demande d'information" ou "Mandats à ouvrir"
      // et que l'ancien statut n'était pas l'un de ceux-là
      const oldStatusIsCounted = oldDossier?.statut === "Nouveau mandat/Demande d'information" ||
                                oldDossier?.statut === "Demande d'information" ||
                                oldDossier?.statut === "Nouveau mandat" ||
                                oldDossier?.statut === "Mandats à ouvrir";
      const newStatusIsCounted = dossierData.statut === "Nouveau mandat/Demande d'information" ||
                                 dossierData.statut === "Mandats à ouvrir";

      if (newStatusIsCounted && !oldStatusIsCounted) {
        const nbMandats = updatedDossier.mandats?.length || 1;
        const compteurPromises = [];
        for (let i = 0; i < nbMandats; i++) {
          compteurPromises.push(
            base44.entities.CompteurMandat.create({
              dossier_id: updatedDossier.id,
              arpenteur_geometre: dossierData.arpenteur_geometre,
              type_mandat: updatedDossier.mandats?.[i]?.type_mandat || "",
              date_creation: new Date().toISOString().split('T')[0]
            })
          );
        }
        await Promise.all(compteurPromises);
      }

      return updatedDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['compteursMandats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] }); // Invalidate notifications query
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteDossierMutation = useMutation({
    mutationFn: (id) => base44.entities.Dossier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  // Client mutations removed as they will be handled within ClientFormDialog
  // const createClientMutation = useMutation(...)
  // const updateClientMutation = useMutation(...)

  const createLotMutation = useMutation({
    mutationFn: async (lotData) => {
      const newLot = await base44.entities.Lot.create(lotData);
      
      // Créer les commentaires temporaires si présents
      if (commentairesTemporairesLot.length > 0) {
        const commentairePromises = commentairesTemporairesLot.map(comment =>
          base44.entities.CommentaireLot.create({
            lot_id: newLot.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }
      
      // Créer une entrée d'historique pour la création
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || "",
        utilisateur_nom: user?.full_name || "Système",
        action: "Création",
        entite: "Lot",
        entite_id: newLot.id,
        details: `Lot ${lotData.numero_lot} créé`
      });
      
      return newLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsNewLotDialogOpen(false);
      resetLotForm();
      setCommentairesTemporairesLot([]);
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, lotData }) => {
      // Récupérer l'ancien lot pour comparer
      const oldLot = lots.find(l => l.id === id);
      
      const updatedLot = await base44.entities.Lot.update(id, lotData);
      
      // Déterminer les changements
      const changes = [];
      if (oldLot) {
        if (oldLot.numero_lot !== lotData.numero_lot) {
          changes.push(`Numéro de lot: ${oldLot.numero_lot} → ${lotData.numero_lot}`);
        }
        if (oldLot.circonscription_fonciere !== lotData.circonscription_fonciere) {
          changes.push(`Circonscription: ${oldLot.circonscription_fonciere} → ${lotData.circonscription_fonciere}`);
        }
        if (oldLot.cadastre !== lotData.cadastre) {
          changes.push(`Cadastre: ${oldLot.cadastre || '-'} → ${lotData.cadastre || '-'}`);
        }
        if (oldLot.rang !== lotData.rang) {
          changes.push(`Rang: ${oldLot.rang || '-'} → ${lotData.rang || '-'}`);
        }
        
        // Comparer les types d'opération de manière détaillée
        const oldTypes = oldLot.types_operation || [];
        const newTypes = lotData.types_operation || [];
        
        // Détecter les ajouts
        if (newTypes.length > oldTypes.length) {
          const addedCount = newTypes.length - oldTypes.length;
          const lastAdded = newTypes[newTypes.length - 1];
          if (lastAdded) {
            changes.push(`Ajout type d'opération: ${lastAdded.type_operation || 'N/A'} (${lastAdded.date_bpd || 'sans date'})`);
          } else if (addedCount > 1) {
            changes.push(`${addedCount} types d'opération ajoutés`);
          }
        }
        
        // Détecter les suppressions
        if (newTypes.length < oldTypes.length) {
          const removedCount = oldTypes.length - newTypes.length;
          changes.push(`${removedCount} type(s) d'opération supprimé(s)`);
        }
        
        // Détecter les modifications (même nombre mais contenus différents)
        if (newTypes.length === oldTypes.length && newTypes.length > 0) {
          for (let i = 0; i < newTypes.length; i++) {
            const oldType = oldTypes[i];
            const newType = newTypes[i];
            
            if (oldType.type_operation !== newType.type_operation) {
              changes.push(`Type d'opération modifié: ${oldType.type_operation || 'N/A'} → ${newType.type_operation || 'N/A'}`);
            }
            if (oldType.date_bpd !== newType.date_bpd) {
              changes.push(`Date BPD modifiée: ${oldType.date_bpd || 'sans date'} → ${newType.date_bpd || 'sans date'}`);
            }
            
            // Comparer les concordances
            const oldConcordances = oldType.concordances_anterieures || [];
            const newConcordances = newType.concordances_anterieures || [];
            
            if (oldConcordances.length !== newConcordances.length) {
              changes.push(`Concordances modifiées: ${oldConcordances.length} → ${newConcordances.length}`);
            } else if (JSON.stringify(oldConcordances) !== JSON.stringify(newConcordances)) {
              changes.push(`Concordances modifiées pour ${newType.type_operation || 'type d\'opération'}`);
            }
          }
        }
      }
      
      const details = changes.length > 0 
        ? changes.join(' • ')
        : `Lot ${lotData.numero_lot} modifié`;
      
      // Créer une entrée dans l'historique
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || '',
        action: 'Modification',
        entite: 'Lot',
        entite_id: id,
        details
      });
      
      return updatedLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsNewLotDialogOpen(false);
      resetLotForm();
    },
  });

  const clientsReguliers = clients.filter(c => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter(c => c.type_client === 'Notaire');
  const courtiers = clients.filter(c => c.type_client === 'Courtier immobilier');

  const getClientById = (id) => clients.find(c => c.id === id);
  const getLotById = (numeroLot) => lots.find(l => l.id === numeroLot); // Changed to id

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

  // Helper function to get client names - MOVED UP BEFORE USE
  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    const names = clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    });
    
    if (names.length === 1) return names[0];
    if (names.length === 2) return names.join(" & ");
    return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
  };

  // Helper function to get the first work address
  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return "-";
    return formatAdresse(mandats[0].adresse_travaux);
  };

  // Function to map old statuses to new combined status for form display
  const mapOldStatusToCombined = (status) => {
    if (status === "Demande d'information" || status === "Nouveau mandat") {
      return "Nouveau mandat/Demande d'information";
    }
    return status;
  };

  // NEW FUNCTION: Load data from reference dossier
  const loadDossierReference = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      statut: "Retour d'appel",
      ttl: dossier.ttl || "Non",
      utilisateur_assigne: formData.utilisateur_assigne || "",
      clients_ids: dossier.clients_ids || [],
      clients_texte: dossier.clients_texte || "",
      notaires_ids: dossier.notaires_ids || [],
      notaires_texte: dossier.notaires_texte || "",
      courtiers_ids: dossier.courtiers_ids || [],
      courtiers_texte: dossier.courtiers_texte || "",
      mandats: dossier.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        adresse_travaux: m.adresse_travaux
          ? (typeof m.adresse_travaux === 'string'
            ? {
                rue: m.adresse_travaux,
                numeros_civiques: [],
                ville: "",
                code_postal: "",
                province: ""
              }
            : m.adresse_travaux
          )
          : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
        lots: m.lots || [],
        prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
        rabais: m.rabais !== undefined ? m.rabais : 0,
        taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        tache_actuelle: "",
        utilisateur_assigne: "" // New mandat level field, initialize empty for reference loading
      })) || [],
      description: dossier.description || ""
    });
    setActiveTabMandat("0");
    setDossierReferenceId(dossierId);
    setDossierSearchForReference("");
  };
  // END NEW FUNCTION

  // Filtrer les dossiers pour exclure le statut "Rejeté"
  const dossiersNonRejetes = dossiers.filter(d => d.statut !== "Rejeté");

  const retourAppelDossiers = dossiersNonRejetes.filter(d => d.statut === "Retour d'appel");
  const nouveauMandatDossiers = dossiersNonRejetes.filter(d => d.statut === "Nouveau mandat/Demande d'information" || d.statut === "Demande d'information" || d.statut === "Nouveau mandat");
  const mandatNonOctroyeDossiers = dossiersNonRejetes.filter(d => d.statut === "Mandat non octroyé");
  const soumissionDossiers = dossiersNonRejetes.filter(d => d.statut === "Soumission" || d.statut === "Mandats à ouvrir"); // Combined soumission and mandats à ouvrir

  // Calcul des périodes
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  // Périodes précédentes pour calculer le % de variation
  const startOfPreviousDay = new Date(startOfDay);
  startOfPreviousDay.setDate(startOfPreviousDay.getDate() - 1);

  const startOfPreviousWeek = new Date(startOfWeek);
  startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);

  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  endOfPreviousMonth.setHours(23, 59, 59, 999);

  const startOfPreviousYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfPreviousYear = new Date(now.getFullYear() - 1, 11, 31);
  endOfPreviousYear.setHours(23, 59, 59, 999);

  const getCountsByPeriodWithComparison = (list, dateKey) => {
    const byDay = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfDay;
    }).length;

    const byWeek = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfWeek;
    }).length;

    const byMonth = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfMonth;
    }).length;

    const byYear = list.filter(item => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfYear;
    }).length;

    const previousDay = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousDay && date < startOfDay;
    }).length;

    const previousWeek = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousWeek && date < startOfWeek;
    }).length;

    const previousMonth = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousMonth && date <= endOfPreviousMonth;
    }).length;

    const previousYear = list.filter(item => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousYear && date <= endOfPreviousYear;
    }).length;

    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      byDay,
      byWeek,
      byMonth,
      byYear,
      percentages: {
        day: calculatePercentage(byDay, previousDay),
        week: calculatePercentage(byWeek, previousWeek),
        month: calculatePercentage(byMonth, previousMonth),
        year: calculatePercentage(byYear, previousYear)
      }
    };
  };

  const getCountsByArpenteur = (dossiersList) => {
    const counts = {};
    ARPENTEURS.forEach(arp => {
      counts[arp] = dossiersList.filter(d => d.arpenteur_geometre === arp).length;
    });
    return counts;
  };

  const retourAppelStats = {
    total: retourAppelDossiers.length,
    ...getCountsByPeriodWithComparison(retourAppelDossiers, 'created_date'),
    byArpenteur: getCountsByArpenteur(retourAppelDossiers)
  };

  const nouveauMandatStats = getCountsByPeriodWithComparison(compteurs, 'date_creation');

  const soumissionStats = {
    total: soumissionDossiers.length,
    ...getCountsByPeriodWithComparison(soumissionDossiers, 'created_date'),
    byArpenteur: getCountsByArpenteur(soumissionDossiers)
  };

  // New filtering logic
  const applyFilters = (priseMandatsList) => {
    return priseMandatsList.filter(pm => {
      const searchLower = searchTerm.toLowerCase();
      const clientName = pm.client_info?.prenom || pm.client_info?.nom 
        ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim().toLowerCase()
        : getClientsNames(pm.clients_ids).toLowerCase();
      const matchesSearch = (
        pm.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        clientName.includes(searchLower) ||
        formatAdresse(pm.adresse_travaux)?.toLowerCase().includes(searchLower) ||
        pm.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
      );

      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(pm.arpenteur_geometre);
      const matchesVille = filterVille.length === 0 || filterVille.includes(pm.adresse_travaux?.ville);
      const matchesTypeMandat = filterTypeMandat.length === 0 || pm.mandats?.some(m => filterTypeMandat.includes(m.type_mandat));
      const matchesUrgence = filterUrgence.length === 0 || filterUrgence.includes(pm.urgence_percue);

      const pmDate = new Date(pm.created_date);
      const matchesDateStart = filterDateStart === "" || pmDate >= new Date(filterDateStart);
      const matchesDateEnd = filterDateEnd === "" || pmDate <= new Date(filterDateEnd + "T23:59:59");

      return matchesSearch && matchesArpenteur && matchesVille && matchesTypeMandat && matchesUrgence && matchesDateStart && matchesDateEnd;
    });
  };

  const filteredRetourAppel = applyFilters(retourAppelDossiers);
  const filteredMandatNonOctroye = applyFilters(mandatNonOctroyeDossiers);
  const filteredSoumission = applyFilters(soumissionDossiers); // Now includes "Mandats à ouvrir"
  const filteredNouveauMandat = applyFilters(nouveauMandatDossiers);

  // NEW: Filter dossiers for reference selector
  const filteredDossiersForReference = dossiers.filter(dossier => {
    const searchLower = dossierSearchForReference.toLowerCase();
    const fullNumber = (dossier.arpenteur_geometre ? getArpenteurInitials(dossier.arpenteur_geometre) : "") + (dossier.numero_dossier || "");
    const clientsNames = getClientsNames(dossier.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
    );
  });
  // END NEW

  const filteredClientsForSelector = clientsReguliers.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    c.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
    c.telephones?.some(tel => tel.telephone?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
    (c.adresses?.length > 0 && formatAdresse(c.adresses.find(a => a.actuelle || a.actuel))?.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  );

  const filteredNotairesForSelector = notaires.filter(n =>
    `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase()) ||
    n.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
    n.telephones?.some(tel => tel.telephone?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
    (n.adresses?.length > 0 && formatAdresse(n.adresses.find(a => a.actuelle || a.actuel))?.toLowerCase().includes(notaireSearchTerm.toLowerCase()))
  );

  const filteredCourtiersForSelector = courtiers.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase()) ||
    c.courriels?.some(courcourriel => courcourriel.courriel?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
    c.telephones?.some(tel => tel.telephone?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
    (c.adresses?.length > 0 && formatAdresse(c.adresses.find(a => a.actuelle || a.actel))?.toLowerCase().includes(courtierSearchTerm.toLowerCase()))
  );

  const filteredLotsForSelector = lots.filter(lot => {
    const matchesSearch = lot.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.circonscription_fonciere?.toLowerCase().includes(lotSearchTerm.toLowerCase());

    const matchesCirconscription = lotCirconscriptionFilter === "all" ||
      lot.circonscription_fonciere === lotCirconscriptionFilter;

    const matchesCadastre = lotCadastreFilter === "all" || lot.cadastre === lotCadastreFilter;

    return matchesSearch && matchesCirconscription && matchesCadastre;
  });

  const openLotSelector = (mandatIndex) => {
    setCurrentMandatIndex(mandatIndex);
    setIsLotSelectorOpen(true);
  };

  const addLotToCurrentMandat = (lotId) => {
    if (currentMandatIndex !== null) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === currentMandatIndex ? {
            ...m,
            lots: m.lots.includes(lotId) ? m.lots.filter(id => id !== lotId) : [...(m.lots || []), lotId]
          } : m
        )
      }));
    }
  };

  const addHistoriqueEntry = (action, details = "") => {
    const newEntry = {
      action,
      details,
      utilisateur_nom: user?.full_name || "Utilisateur",
      utilisateur_email: user?.email || "",
      date: new Date().toISOString()
    };
    setHistorique(prev => [newEntry, ...prev]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: arpenteur requis
    if (!formData.arpenteur_geometre) {
      setShowArpenteurRequiredDialog(true);
      return;
    }

    // Validation: vérifier que le numéro de dossier n'existe pas déjà (si statut "Mandats à ouvrir")
    if (formData.statut === "Mandats à ouvrir" && formData.numero_dossier) {
      if (numeroDossierExiste(formData.arpenteur_geometre, formData.numero_dossier, editingPriseMandat?.id)) {
        alert(`Le numéro de dossier ${formData.numero_dossier} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
        return;
      }
    }

    // Préparer les mandats avec leur tarification
    const mandatsToSave = mandatsInfo
      .filter(m => m.type_mandat)
      .map(m => ({
        type_mandat: m.type_mandat,
        prix_estime: m.prix_estime || 0,
        prix_premier_lot: m.prix_premier_lot || 0,
        prix_autres_lots: m.prix_autres_lots || 0,
        rabais: m.rabais || 0,
        taxes_incluses: m.taxes_incluses || false
      }));

    const dataToSubmit = {
      arpenteur_geometre: formData.arpenteur_geometre,
      place_affaire: formData.placeAffaire,
      numero_dossier: formData.numero_dossier,
      date_ouverture: formData.date_ouverture,
      clients_ids: formData.clients_ids,
      notaires_ids: formData.notaires_ids || [],
      courtiers_ids: formData.courtiers_ids || [],
      compagnies_ids: formData.compagnies_ids || [],
      client_info: clientInfo,
      professionnel_info: professionnelInfo,
      adresse_travaux: workAddress,
      mandats: mandatsToSave,
      echeance_souhaitee: mandatsInfo[0]?.echeance_souhaitee || "",
      date_signature: mandatsInfo[0]?.date_signature || "",
      date_debut_travaux: mandatsInfo[0]?.date_debut_travaux || "",
      date_livraison: mandatsInfo[0]?.date_livraison || "",
      urgence_percue: mandatsInfo[0]?.urgence_percue || "",
      statut: formData.statut
    };

    if (editingPriseMandat) {
      // Détecter les changements et créer des entrées d'historique
      const newHistoriqueEntries = [];
      const now = new Date().toISOString();
      const userName = user?.full_name || "Utilisateur";
      const userEmail = user?.email || "";

      // Vérifier changement de statut
      if (editingPriseMandat.statut !== formData.statut) {
        newHistoriqueEntries.push({
          action: "Changement de statut",
          details: `${editingPriseMandat.statut} → ${formData.statut}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'arpenteur
      if (editingPriseMandat.arpenteur_geometre !== formData.arpenteur_geometre) {
        newHistoriqueEntries.push({
          action: "Changement d'arpenteur-géomètre",
          details: `${editingPriseMandat.arpenteur_geometre || 'Non défini'} → ${formData.arpenteur_geometre}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'urgence
      if (editingPriseMandat.urgence_percue !== (mandatsInfo[0]?.urgence_percue || "")) {
        newHistoriqueEntries.push({
          action: "Changement d'urgence",
          details: `${editingPriseMandat.urgence_percue || 'Non définie'} → ${mandatsInfo[0]?.urgence_percue || 'Non définie'}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de client info (déclaré avant pour réutilisation)
      const oldClientName = `${editingPriseMandat.client_info?.prenom || ''} ${editingPriseMandat.client_info?.nom || ''}`.trim();
      const newClientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
      const oldAdresse = formatAdresse(editingPriseMandat.adresse_travaux);
      const newAdresse = formatAdresse(workAddress);
      if (oldClientName !== newClientName && newClientName) {
        newHistoriqueEntries.push({
          action: "Modification des informations client",
          details: oldClientName ? `${oldClientName} → ${newClientName}` : `Ajout: ${newClientName}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'adresse
      if (oldAdresse !== newAdresse && newAdresse) {
        newHistoriqueEntries.push({
          action: "Modification de l'adresse des travaux",
          details: oldAdresse ? `${oldAdresse} → ${newAdresse}` : `Ajout: ${newAdresse}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de types de mandats
      const oldMandatTypes = (editingPriseMandat.mandats || []).map(m => m.type_mandat).join(', ');
      const newMandatTypes = mandatsToSave.map(m => m.type_mandat).join(', ');
      if (oldMandatTypes !== newMandatTypes) {
        newHistoriqueEntries.push({
          action: "Modification des types de mandats",
          details: oldMandatTypes ? `${oldMandatTypes} → ${newMandatTypes}` : `Ajout: ${newMandatTypes}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de prix total
      const oldTotalPrix = (editingPriseMandat.mandats || []).reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
      const newTotalPrix = mandatsToSave.reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
      if (oldTotalPrix !== newTotalPrix) {
        newHistoriqueEntries.push({
          action: "Modification du prix estimé",
          details: `${oldTotalPrix.toFixed(2)} $ → ${newTotalPrix.toFixed(2)} $`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de rabais total
      const oldTotalRabais = (editingPriseMandat.mandats || []).reduce((sum, m) => sum + (m.rabais || 0), 0);
      const newTotalRabais = mandatsToSave.reduce((sum, m) => sum + (m.rabais || 0), 0);
      if (oldTotalRabais !== newTotalRabais) {
        newHistoriqueEntries.push({
          action: "Modification du rabais",
          details: `${oldTotalRabais.toFixed(2)} $ → ${newTotalRabais.toFixed(2)} $`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de date de livraison
      if (editingPriseMandat.date_livraison !== (mandatsInfo[0]?.date_livraison || "")) {
        const formatDate = (date) => date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : 'Non définie';
        newHistoriqueEntries.push({
          action: "Modification de la date de livraison",
          details: `${formatDate(editingPriseMandat.date_livraison)} → ${formatDate(mandatsInfo[0]?.date_livraison)}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de date de signature
      if (editingPriseMandat.date_signature !== (mandatsInfo[0]?.date_signature || "")) {
        const formatDate = (date) => date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : 'Non définie';
        newHistoriqueEntries.push({
          action: "Modification de la date de signature",
          details: `${formatDate(editingPriseMandat.date_signature)} → ${formatDate(mandatsInfo[0]?.date_signature)}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de date de début des travaux
      if (editingPriseMandat.date_debut_travaux !== (mandatsInfo[0]?.date_debut_travaux || "")) {
        const formatDate = (date) => date ? format(new Date(date), "dd MMM yyyy", { locale: fr }) : 'Non définie';
        newHistoriqueEntries.push({
          action: "Modification de la date de début des travaux",
          details: `${formatDate(editingPriseMandat.date_debut_travaux)} → ${formatDate(mandatsInfo[0]?.date_debut_travaux)}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement d'échéance souhaitée
      if (editingPriseMandat.echeance_souhaitee !== (mandatsInfo[0]?.echeance_souhaitee || "")) {
        newHistoriqueEntries.push({
          action: "Modification de l'échéance souhaitée",
          details: `${editingPriseMandat.echeance_souhaitee || 'Non définie'} → ${mandatsInfo[0]?.echeance_souhaitee || 'Non définie'}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      // Vérifier changement de clients_ids
      const oldClientsIds = (editingPriseMandat.clients_ids || []).sort().join(',');
      const newClientsIds = (formData.clients_ids || []).sort().join(',');
      if (oldClientsIds !== newClientsIds) {
        const oldNames = getClientsNames(editingPriseMandat.clients_ids || []);
        const newNames = getClientsNames(formData.clients_ids || []);
        newHistoriqueEntries.push({
          action: "Modification des clients sélectionnés",
          details: oldNames !== '-' ? `${oldNames} → ${newNames}` : `Ajout: ${newNames}`,
          utilisateur_nom: userName,
          utilisateur_email: userEmail,
          date: now
        });
      }

      const updatedHistorique = [...newHistoriqueEntries, ...historique];
      
      updatePriseMandatMutation.mutate({ id: editingPriseMandat.id, data: { ...dataToSubmit, historique: updatedHistorique } });
    } else {
      // Création
      const creationDetails = [];
      creationDetails.push(`Arpenteur: ${formData.arpenteur_geometre}`);
      creationDetails.push(`Statut: ${formData.statut}`);
      const mandatTypes = mandatsToSave.map(m => m.type_mandat).filter(t => t);
      if (mandatTypes.length > 0) creationDetails.push(`Mandats: ${mandatTypes.join(', ')}`);
      const creationClientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
      const creationAdresse = formatAdresse(workAddress);
      if (creationClientName) creationDetails.push(`Client: ${creationClientName}`);
      if (creationAdresse) creationDetails.push(`Adresse: ${creationAdresse}`);
      const totalPrix = mandatsToSave.reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
      if (totalPrix > 0) creationDetails.push(`Prix: ${totalPrix.toFixed(2)} $`);
      
      const creationHistorique = [{
        action: "Création de la prise de mandat",
        details: creationDetails.join(' | '),
        utilisateur_nom: user?.full_name || "Utilisateur",
        utilisateur_email: user?.email || "",
        date: new Date().toISOString()
      }];
      
      createPriseMandatMutation.mutate({ ...dataToSubmit, historique: creationHistorique });
    }
  };

  // handleNewClientSubmit removed, logic moved to ClientFormDialog

  // NEW FUNCTION
  const handleNewLotSubmit = async (e) => {
    e.preventDefault();
    
    // Validation: vérifier que les champs obligatoires sont remplis
    if (!newLotForm.numero_lot || !newLotForm.circonscription_fonciere) {
      setShowLotMissingFieldsWarning(true);
      return;
    }
    
    // Vérifier si le lot existe déjà (même numéro de lot et même circonscription)
    // mais pas en édition (si on est en train de modifier le même lot, ce n'est pas un doublon)
    const lotExistant = lots.find(l => 
      l.numero_lot === newLotForm.numero_lot && 
      l.circonscription_fonciere === newLotForm.circonscription_fonciere &&
      l.id !== editingLot?.id
    );
    
    if (lotExistant) {
      setShowLotExistsWarning(true);
      return;
    }
    
    if (editingLot) {
      // Mode modification
      await updateLotMutation.mutateAsync({ id: editingLot.id, lotData: newLotForm });
      setIsNewLotDialogOpen(false);
      resetLotForm();
      setCommentairesTemporairesLot([]);
    } else {
      // Mode création
      const newLot = await createLotMutation.mutateAsync(newLotForm);
      
      
      // Ajouter automatiquement le lot créé au mandat actuel si on est dans le dialog "Ouvrir dossier"
      if (currentMandatIndexDossier !== null) {
        setNouveauDossierForm(prev => ({
          ...prev,
          mandats: prev.mandats.map((m, i) => i === currentMandatIndexDossier ? {
            ...m,
            lots: [...(m.lots || []), newLot.id]
          } : m)
        }));
      } else if (currentMandatIndex !== null) {
        // Si on est dans le formulaire principal (prise de mandat)
        setFormData(prev => ({
          ...prev,
          mandats: prev.mandats.map((m, i) => i === currentMandatIndex ? {
            ...m,
            lots: [...(m.lots || []), newLot.id]
          } : m)
        }));
      }
    }
  };

  // END NEW FUNCTION

  const resetForm = () => {
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      placeAffaire: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      date_fermeture: "",
      statut: "Nouveau mandat/Demande d'information",
      ttl: "Non",
      utilisateur_assigne: "",
      clients_ids: [],
      clients_texte: "",
      notaires_ids: [],
      notaires_texte: "",
      courtiers_ids: [],
      courtiers_texte: "",
      mandats: [],
      description: ""
    });
    setEditingDossier(null);
    setActiveTabMandat("0");
    setDossierReferenceId(null);
    setDossierSearchForReference("");
    setCommentairesTemporaires([]);
  };

  const resetFullForm = () => {
    // Reset du formData principal
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      placeAffaire: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      date_fermeture: "",
      statut: "Nouveau mandat/Demande d'information",
      ttl: "Non",
      utilisateur_assigne: "",
      clients_ids: [],
      clients_texte: "",
      notaires_ids: [],
      notaires_texte: "",
      courtiers_ids: [],
      courtiers_texte: "",
      mandats: [],
      description: ""
    });
    
    // Reset sidebar et historique
    setSidebarTab("commentaires");
    setHistorique([]);
    
    // Reset professionnel
    setProfessionnelStepCollapsed(true);
    setProfessionnelInfo({ notaire: "", courtier: "", compagnie: "" });
    
    // Reset de l'adresse de travail
    setWorkAddress({
      numeros_civiques: [""],
      rue: "",
      ville: "",
      province: "QC",
      code_postal: "",
      numero_lot: ""
    });
    
    // Reset des infos client
    setClientInfo({
      prenom: "",
      nom: "",
      telephone: "",
      type_telephone: "Cellulaire",
      courriel: ""
    });
    
    // Reset des mandats
    setMandatsInfo([{
      type_mandat: "",
      echeance_souhaitee: "",
      date_signature: "",
      date_debut_travaux: "",
      date_livraison: "",
      urgence_percue: "",
      prix_estime: 0,
      rabais: 0,
      taxes_incluses: false
    }]);
    
    // Reset des états de collapse
    setClientStepCollapsed(false);
    setAddressStepCollapsed(false);
    setMandatStepCollapsed(false);
    setTarificationStepCollapsed(true);
    setProfessionnelStepCollapsed(true);
    
    // Reset des autres états
    setEditingDossier(null);
    setActiveTabMandat("0");
    setDossierReferenceId(null);
    setDossierSearchForReference("");
    setCommentairesTemporaires([]);
    setEditingPriseMandat(null);
    setHasFormChanges(false);
    setInitialPriseMandatData(null);
  };

  // NEW FUNCTION
  const resetLotForm = () => {
    setNewLotForm({
      numero_lot: "",
      circonscription_fonciere: "",
      cadastre: "Québec",
      rang: "",
      types_operation: []
    });
    setAvailableCadastresForNewLot([]);
    setCommentairesTemporairesLot([]);
    setEditingLot(null);
    setInitialLotForm(null);
    setLotInfoCollapsed(false);
    setTypesOperationCollapsed(false);
    setLotDocumentsCollapsed(false);
    setLotActionLogs([]);
  };
  // END NEW FUNCTION

  const handleEdit = (entity) => { // Renamed from 'dossier' to 'entity'
    // Check if the entity is a client (based on type_client property presence)
    if (entity && entity.type_client) {
      // It's a client. Open client editing form using ClientFormDialog.
      setEditingClientForForm(entity);
      setClientTypeForForm(entity.type_client);
      setIsClientFormDialogOpen(true);

      // Close the selector dialog first
      setIsClientSelectorOpen(false);
      setIsNotaireSelectorOpen(false);
      setIsCourtierSelectorOpen(false);
      return; // Exit early as it's a client
    }

    // Original dossier editing logic
    setIsViewDialogOpen(false);
    setViewingDossier(null);
    setDossierReferenceId(null); // Clear reference ID when editing existing dossier

    setEditingDossier(entity); // Now 'entity' is a dossier
    setFormData({
      numero_dossier: entity.numero_dossier || "",
      arpenteur_geometre: entity.arpenteur_geometre || "",
      date_ouverture: entity.date_ouverture || new Date().toISOString().split('T')[0],
      date_fermeture: entity.date_fermeture || "",
      statut: mapOldStatusToCombined(entity.statut || "Retour d'appel"),
      ttl: entity.ttl || "Non",
      utilisateur_assigne: entity.utilisateur_assigne || "",
      clients_ids: entity.clients_ids || [],
      clients_texte: entity.clients_texte || "",
      notaires_ids: entity.notaires_ids || [],
      notaires_texte: entity.notaires_texte || "",
      courtiers_ids: entity.courtiers_ids || [],
      courtiers_texte: entity.courtiers_texte || "",
      mandats: entity.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        minute: m.minute || "",
        date_minute: m.date_minute || "",
        type_minute: m.type_minute || "Initiale",
        minutes_list: m.minutes_list || [],
        adresse_travaux: m.adresse_travaux
          ? (typeof m.adresse_travaux === 'string'
            ? {
                rue: m.adresse_travaux,
                numeros_civiques: [],
                ville: "",
                code_postal: "",
                province: ""
              }
            : m.adresse_travaux
          )
          : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
        lots: m.lots || [],
        prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
        rabais: m.rabais !== undefined ? m.rabais : 0,
        taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
        date_livraison: m.date_livraison || "",
        date_signature: m.date_signature || "",
        date_debut_travaux: m.date_debut_travaux || "",
        factures: m.factures || [],
        tache_actuelle: m.tache_actuelle || "",
        utilisateur_assigne: m.utilisateur_assigne || "" // Add this field for mandat
      })) || [],
      description: entity.description || ""
    });
    setIsDialogOpen(true);
    setActiveTabMandat("0");
  };

  const handleView = (dossier) => {
    setViewingDossier(dossier);
    setIsViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    if (viewingDossier) {
      handleEdit(viewingDossier);
    }
  };

  const handleDelete = (id) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.`)) {
      deleteDossierMutation.mutate(id);
    }
  };

  const toggleClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(clientId)
        ? prev[field].filter(id => id !== clientId)
        : [...prev[field], clientId]
    }));
  };

  const removeClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(id => id !== clientId)
    }));
  };

  const addMandat = () => {
    const newIndex = formData.mandats.length;

    const firstMandat = formData.mandats[0];
    const defaultAdresse = firstMandat?.adresse_travaux
      ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux))
      : {
        ville: "",
        numeros_civiques: [""],
        rue: "",
        code_postal: "",
        province: "QC"
      };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];

    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        minute: "",
        date_minute: "",
        type_minute: "Initiale",
        minutes_list: [],
        adresse_travaux: defaultAdresse,
        lots: defaultLots,
        lots_texte: "",
        prix_estime: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        factures: [],
        tache_actuelle: "",
        utilisateur_assigne: "" // Initialize new field for mandat
      }]
    }));
    setActiveTabMandat(newIndex.toString());
  };

  const getMandatTabLabel = (mandat, index) => {
    return mandat.type_mandat || `Mandat ${index + 1}`;
  };

  const updateMandatAddress = (mandatIndex, newAddresses) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === mandatIndex ? { ...m, adresse_travaux: newAddresses[0] || { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" } } : m
      )
    }));
  };

  const updateMandat = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMandat = (index) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.")) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.filter((_, i) => i !== index)
      }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotId) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer le lot ${lotId} de ce mandat ?`)) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === mandatIndex ? { ...m, lots: m.lots.filter((id) => id !== lotId) } : m
        )
      }));
    }
  };

  const openAddMinuteDialog = (mandatIndex) => {
    setCurrentMinuteMandatIndex(mandatIndex);
    setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    setIsAddMinuteDialogOpen(true);
  };

  const handleAddMinuteFromDialog = () => {
    if (currentMinuteMandatIndex !== null && newMinuteForm.minute && newMinuteForm.date_minute) {
      // Déterminer quel form utiliser (nouveau dossier ou mandat form)
      const arpenteur = isOuvrirDossierDialogOpen ? nouveauDossierForm.arpenteur_geometre : formData.arpenteur_geometre;
      
      // Vérifier si la minute existe déjà pour cet arpenteur
      const minuteExiste = dossiers.some(d => 
        d.arpenteur_geometre === arpenteur &&
        d.mandats?.some(m => 
          m.minutes_list?.some(min => min.minute === newMinuteForm.minute) ||
          m.minute === newMinuteForm.minute
        )
      );

      if (minuteExiste) {
        alert(`La minute ${newMinuteForm.minute} existe déjà pour ${arpenteur}. Veuillez choisir un autre numéro.`);
        return;
      }

      if (isOuvrirDossierDialogOpen) {
        // Ajouter à nouveauDossierForm
        const currentMinutes = nouveauDossierForm.mandats[currentMinuteMandatIndex].minutes_list || [];
        setNouveauDossierForm(prev => ({
          ...prev,
          mandats: prev.mandats.map((m, i) =>
            i === currentMinuteMandatIndex ? { ...m, minutes_list: [...currentMinutes, { ...newMinuteForm }] } : m
          )
        }));
      } else {
        // Ajouter à formData (ancien comportement)
        addMinuteToMandat(currentMinuteMandatIndex);
      }
      
      setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
      setIsAddMinuteDialogOpen(false);
      setCurrentMinuteMandatIndex(null);
    }
  };

  const addMinuteToMandat = (mandatIndex) => {
    if (newMinuteForm.minute && newMinuteForm.date_minute) {
      const currentMinutes = formData.mandats[mandatIndex].minutes_list || [];
      updateMandat(mandatIndex, 'minutes_list', [...currentMinutes, { ...newMinuteForm }]);
      setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    }
  };

  const removeMinuteFromMandat = (mandatIndex, minuteIndex) => {
    const updatedMinutes = formData.mandats[mandatIndex].minutes_list.filter((_, idx) => idx !== minuteIndex);
    updateMandat(mandatIndex, 'minutes_list', updatedMinutes);
  };

  const voirFacture = (factureHTML) => {
    if (!factureHTML) {
      alert("Le HTML de la facture n'est pas disponible.");
      return;
    }
    const newWindow = window.open('', '_blank');
    newWindow.document.write(factureHTML);
    newWindow.document.close();
  };

  // removeClientField and toggleActuel removed, logic moved to ClientFormDialog

  const h=(i)=>{setDossierInfoStepCollapsed(i!=='section-dossier-info');setClientStepCollapsed(i!=='section-client');setProfessionnelStepCollapsed(i!=='section-professionnel');setAddressStepCollapsed(i!=='section-adresse');setMandatStepCollapsed(i!=='section-mandats');setTarificationStepCollapsed(i!=='section-tarification');setDocumentsStepCollapsed(i!=='section-documents');const el=document.getElementById(i);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});};
  const handleLotCirconscriptionChange = (value) => {
    setNewLotForm(prev => ({ ...prev, circonscription_fonciere: value, cadastre: prev.cadastre || "Québec" }));
    setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
  };

  const handleD01Import = async (file) => {
    setIsImportingD01(true);
    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n');
      const lotLine = lines.find(line => line.startsWith('LO'));
      const suLines = lines.filter(line => line.startsWith('SU'));
      
      let coLines = [];
      if (suLines.length >= 2) {
        const firstSuIndex = lines.indexOf(suLines[0]);
        const secondSuIndex = lines.indexOf(suLines[1]);
        coLines = lines.slice(firstSuIndex + 1, secondSuIndex).filter(line => line.startsWith('CO'));
      }
      
      const suLine = suLines[0];
      let extractedData = {};
      
      if (lotLine) {
        const lotParts = lotLine.split(';');
        extractedData.numero_lot = lotParts[1] || '';
      }
      
      if (suLine) {
        const suParts = suLine.split(';');
        extractedData.circonscription_fonciere = suParts[2] || '';
        const dateBpd = suParts[3] || '';
        if (dateBpd) {
          if (dateBpd.length === 8 && /^\d{8}$/.test(dateBpd)) {
            const year = dateBpd.substring(0, 4);
            const month = dateBpd.substring(4, 6);
            const day = dateBpd.substring(6, 8);
            extractedData.date_bpd = `${year}-${month}-${day}`;
          } else {
            extractedData.date_bpd = dateBpd;
          }
        }
      }
      
      extractedData.cadastre = 'Québec';
      const concordances_anterieures = [];
      
      if (coLines.length > 0) {
        coLines.forEach(coLine => {
          const coParts = coLine.split(';');
          const cadastreCode = coParts[1] || '';
          const cadastre = CADASTRE_CODES[cadastreCode] || cadastreCode || 'Québec';
          let rang = coParts[2] ? coParts[2].replace('R', 'Rang ') : '';
          if (rang.match(/^Rang 0(\d+)$/)) {
            rang = rang.replace(/^Rang 0/, 'Rang ');
          }
          const numeroLot = coParts[3] || '';
          const estPartie = coParts[4] === 'O';
          
          concordances_anterieures.push({
            circonscription_fonciere: extractedData.circonscription_fonciere,
            cadastre: cadastre,
            numero_lot: numeroLot,
            rang: rang,
            est_partie: estPartie
          });
        });
      }
      
      // Créer un type d'opération avec la date BPD et les concordances
      const typeOperation = {
        type_operation: "Remplacement",
        date_bpd: extractedData.date_bpd || '',
        concordances_anterieures: concordances_anterieures
      };
      
      // Mettre à jour les cadastres disponibles AVANT de set formData
      if (extractedData.circonscription_fonciere) {
        setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[extractedData.circonscription_fonciere] || []);
      }
      
      setNewLotForm(prev => ({
        ...prev,
        numero_lot: extractedData.numero_lot || prev.numero_lot,
        circonscription_fonciere: extractedData.circonscription_fonciere || prev.circonscription_fonciere,
        cadastre: 'Québec',
        types_operation: [typeOperation]
      }));
      
      setShowD01ImportSuccess(true);
    } catch (error) {
      console.error("Erreur import .d01:", error);
      alert("Erreur lors de l'importation du fichier .d01");
    } finally {
      setIsImportingD01(false);
    }
  };

  const handleD01FileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleD01Import(file);
    }
  };

  const handleD01DragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverD01(true);
  };

  const handleD01DragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverD01(false);
  };

  const handleD01Drop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverD01(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.d01')) {
      handleD01Import(file);
    } else {
      alert("Veuillez déposer un fichier .d01");
    }
  };
  // END NEW FUNCTIONS

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const getStatutBadgeColor = (statut) => {
    const colors = {
      "Retour d'appel": "bg-blue-500/20 text-blue-400 border-blue-500/30",
      "Message laissé/Sans réponse": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      "Demande d'information": "bg-orange-500/20 text-orange-400 border-orange-500/30",
      "Nouveau mandat": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      "Nouveau mandat/Demande d'information": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", // Added for combined status
      "Mandats à ouvrir": "bg-purple-500/20 text-purple-400 border-purple-500/30", // New status
      "Mandat non octroyé": "bg-red-500/20 text-red-400 border-red-500/30", // Changed to red for consistency with outline
      "Soumission": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      "Ouvert": "bg-green-500/20 text-green-400 border-green-500/30",
      "Fermé": "bg-slate-500/20 text-slate-400 border-slate-500/30"
    };
    // If the dossier is Mandats à ouvrir, it should appear with soumission color on the dashboard
    if (statut === "Mandats à ouvrir" && colors["Soumission"]) {
        return colors["Soumission"];
    }
    return colors[statut] || colors["Retour d'appel"];
  };

  // Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortDossiers = (dossiersList) => {
    if (!sortField) return dossiersList;

    return [...dossiersList].sort((a, b) => {
      let aValue;
      let bValue;

      switch (sortField) {
        case 'numero_dossier': // Added case for numero_dossier
          aValue = (getArpenteurInitials(a.arpenteur_geometre) + (a.numero_dossier || '')).toLowerCase();
          bValue = (getArpenteurInitials(b.arpenteur_geometre) + (b.numero_dossier || '')).toLowerCase();
          break;
        case 'created_date':
          aValue = new Date(a.created_date || 0).getTime();
          bValue = new Date(b.created_date || 0).getTime();
          break;
        case 'clients':
          aValue = getClientsNames(a.clients_ids).toLowerCase();
          bValue = getClientsNames(b.clients_ids).toLowerCase();
          break;
        case 'adresse_travaux':
          aValue = getFirstAdresseTravaux(a.mandats).toLowerCase();
          bValue = getFirstAdresseTravaux(b.mandats).toLowerCase();
          break;
        case 'mandats':
          aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
          bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
          break;
        case 'utilisateur_assigne':
          aValue = (a.utilisateur_assigne || '').toLowerCase();
          bValue = (b.utilisateur_assigne || '').toLowerCase();
          break;
        case 'statut': // Retaining this for global filter and form, but removing from tables below.
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
          break;
        default:
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : 1;
        return 0;
      }
    });
  };

  const sortedRetourAppel = sortDossiers(filteredRetourAppel);
  const sortedMandatNonOctroye = sortDossiers(filteredMandatNonOctroye);
  const sortedSoumission = sortDossiers(filteredSoumission);
  const sortedNouveauMandat = sortDossiers(filteredNouveauMandat);

  const allVilles = [...new Set(priseMandats.map(pm => pm.adresse_travaux?.ville).filter(v => v))].sort();

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={async (open) => {
            if (!open) {
              // Vérifier s'il y a des changements avant de fermer
              const hasChanges = 
                formData.arpenteur_geometre ||
                formData.clients_ids.length > 0 ||
                formData.notaires_ids.length > 0 ||
                formData.courtiers_ids.length > 0 ||
                formData.compagnies_ids.length > 0 ||
                clientInfo.prenom ||
                clientInfo.nom ||
                clientInfo.telephone ||
                clientInfo.courriel ||
                professionnelInfo.notaire ||
                professionnelInfo.courtier ||
                professionnelInfo.compagnie ||
                workAddress.rue ||
                workAddress.ville ||
                workAddress.numeros_civiques?.[0] ||
                workAddress.numero_lot ||
                mandatsInfo.some(m => m.type_mandat) ||
                commentairesTemporaires.length > 0;
              
              if(hasChanges&&!editingPriseMandat&&!showCancelConfirm&&!showUnsavedWarning){setShowCancelConfirm(true);return;}
              if(editingPriseMandat&&!isLocked){await base44.entities.PriseMandat.update(editingPriseMandat.id,{...editingPriseMandat,locked_by:null,locked_at:null});}
              queryClient.invalidateQueries({queryKey:['priseMandats']});
              setIsDialogOpen(false);resetFullForm();setIsLocked(false);setLockedBy("");
            }else{setIsDialogOpen(open);}
          }}>

            <DialogContent className={`backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50`} style={{ marginTop: '19px', maxHeight: 'calc(90vh - 5px)' }}>
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">
                  {editingDossier ? "Modifier le dossier" : "Nouveau dossier"}
                </DialogTitle>
              </DialogHeader>

              <motion.div 
                className="flex flex-col h-[90vh]"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header sur toute la largeur */}
                <div className="sticky top-0 z-10 bg-slate-900 px-6 py-3 border-b border-slate-800 flex-shrink-0 flex items-center justify-between">
                  {/* Bandeau de verrouillage */}
                  {isLocked && (
                    <div className="absolute top-0 left-0 right-0 p-3 bg-red-500/10 border-b border-red-500/30 flex items-center gap-3 z-20">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-red-400 font-semibold text-sm">Mandat verrouillé par <span className="font-bold">{lockedBy}</span></p>
                      </div>
                    </div>
                  )}
                  
                  <h2 className="text-2xl font-bold text-white">
                    {editingPriseMandat ? "Modifier le mandat" : "Nouveau mandat"}
                  </h2>
                  
                  <div className="flex items-center gap-3">
                    {formData.statut === "Mandats à ouvrir" && formData.arpenteur_geometre && formData.numero_dossier && (
                      <div className={`text-lg font-semibold ${
                        formData.arpenteur_geometre === "Samuel Guay" ? "text-red-400" :
                        formData.arpenteur_geometre === "Pierre-Luc Pilote" ? "text-slate-400" :
                        formData.arpenteur_geometre === "Frédéric Gilbert" ? "text-orange-400" :
                        formData.arpenteur_geometre === "Dany Gaboury" ? "text-yellow-400" :
                        formData.arpenteur_geometre === "Benjamin Larouche" ? "text-cyan-400" :
                        "text-emerald-400"
                      }`}>
                        {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                        {(clientInfo.prenom || clientInfo.nom || (formData.clients_ids.length > 0 && getClientsNames(formData.clients_ids) !== "-")) && (
                          <span> - {clientInfo.prenom || clientInfo.nom 
                            ? `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim()
                            : getClientsNames(formData.clients_ids)}</span>
                        )}
                      </div>
                    )}
                    {formData.statut === "Mandats à ouvrir" && (
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-2 border-purple-500 text-purple-300"
                        onClick={async () => {
                          const prochainNumero = formData.numero_dossier || calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id);
                          const initialsArp = getArpenteurInitials(formData.arpenteur_geometre).replace('-', '');

                          try {
                            await base44.functions.invoke('createSharePointFolder', {
                              arpenteur_geometre: formData.arpenteur_geometre,
                              numero_dossier: prochainNumero
                            });
                            const clientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim() || (formData.clients_ids.length > 0 ? getClientsNames(formData.clients_ids) : "Client");
                            const checkResponse = await base44.functions.invoke('sharepoint', { action: 'list', folderPath: `ARPENTEUR/${initialsArp}/DOSSIER/TEMPORAIRE/${initialsArp}-${clientName}/INTRANTS` });
                            if (checkResponse.data?.files?.length > 0) {
                              await base44.functions.invoke('moveSharePointFiles', { sourceFolderPath: `ARPENTEUR/${initialsArp}/DOSSIER/TEMPORAIRE/${initialsArp}-${clientName}/INTRANTS`, destinationFolderPath: `ARPENTEUR/${initialsArp}/DOSSIER/${initialsArp}-${prochainNumero}/INTRANTS` });
                            }
                          } catch (error) {
                            console.error("[OUVRIR DOSSIER] Erreur SharePoint:", error);
                          }

                          const commentsForDossier = commentairesTemporaires;

                          const dossierFormData = {
                            numero_dossier: prochainNumero,
                            arpenteur_geometre: formData.arpenteur_geometre,
                            place_affaire: formData.placeAffaire,
                            date_ouverture: new Date().toISOString().split('T')[0],
                            statut: "Ouvert",
                            ttl: "Non",
                            clients_ids: formData.clients_ids,
                            notaires_ids: formData.notaires_ids || [],
                            courtiers_ids: formData.courtiers_ids || [],
                            compagnies_ids: formData.compagnies_ids || [],
                            mandats: mandatsInfo.filter(m => m.type_mandat).map(m => ({
                              type_mandat: m.type_mandat,
                              adresse_travaux: workAddress,
                              prix_estime: m.prix_estime || 0,
                              rabais: m.rabais || 0,
                              taxes_incluses: m.taxes_incluses || false,
                              date_signature: m.date_signature || "",
                              date_debut_travaux: m.date_debut_travaux || "",
                              date_livraison: m.date_livraison || "",
                              lots: [], tache_actuelle: "Ouverture", utilisateur_assigne: "",
                              minute: "", date_minute: "", type_minute: "Initiale", minutes_list: [],
                              terrain: { date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" },
                              factures: [], notes: ""
                            }))
                          };
                          setNouveauDossierForm(dossierFormData);
                          setCommentairesTemporairesDossier(commentsForDossier);
                          setIsOuvrirDossierDialogOpen(true);
                        }}
                      >
                        <FolderOpen className="w-5 h-5 mr-2" />
                        Ouvrir dossier
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-2 flex-shrink-0">{[{id:"section-dossier-info",t:"Informations",I:FolderOpen,c:"text-teal-400"},{id:"section-client",t:"Client",I:Users,c:"text-blue-400"},{id:"section-professionnel",t:"Professionnel",I:Briefcase,c:"text-pink-400"},{id:"section-adresse",t:"Adresse",I:Home,c:"text-emerald-400"},{id:"section-mandats",t:"Mandats",I:ClipboardList,c:"text-orange-400"},{id:"section-tarification",t:"Tarification",I:Receipt,c:"text-purple-400"},{id:"section-documents",t:"Documents",I:FolderOpen,c:"text-yellow-400"}].map(s=>(<button key={s.id} type="button" title={s.t} onClick={()=>h(s.id)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"><s.I className={`w-5 h-5 ${s.c}`}/></button>))}</div>
                  <div className="flex-[0_0_calc(70%-48px)] flex flex-col overflow-hidden border-r border-slate-800">
                  <div className="flex-1 overflow-y-auto p-6 pt-3">
                  <form id="dossier-form" onSubmit={handleSubmit} onBlur={handleAutoSave} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-3">
                  {/* Section Informations du dossier - Toujours en haut */}
                  <div id="section-dossier-info"><DossierInfoStepForm
                    disabled={isLocked}
                    arpenteurGeometre={formData.arpenteur_geometre}
                    onArpenteurChange={(value) => {
                      if (isLocked) return;
                      setFormData({...formData, arpenteur_geometre: value});
                      setHasFormChanges(true);
                    }}
                    statut={formData.statut}
                    onStatutChange={async (value) => {
                      if (isLocked) return;
                      if (formData.numero_dossier && value !== formData.statut) {
                        setPendingStatutChange(value);
                        setShowStatutChangeConfirm(true);
                        return;
                      }
                      if (value === "Mandats à ouvrir" && formData.arpenteur_geometre) {
                        const prochainNumero = calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id);
                        setFormData({...formData, statut: value, numero_dossier: prochainNumero, date_ouverture: new Date().toISOString().split('T')[0]});
                      } else if (value !== "Mandats à ouvrir") {
                        setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
                      } else {
                        setFormData({...formData, statut: value});
                      }
                    }}
                    numeroDossier={formData.numero_dossier}
                    onNumeroDossierChange={(value) => setFormData({...formData, numero_dossier: value})}
                    dateOuverture={formData.date_ouverture}
                    onDateOuvertureChange={(value) => setFormData({...formData, date_ouverture: value})}
                    placeAffaire={formData.placeAffaire}
                    onPlaceAffaireChange={(value) => setFormData({...formData, placeAffaire: value})}
                    isCollapsed={dossierInfoStepCollapsed}
                    onToggleCollapse={() => setDossierInfoStepCollapsed(!dossierInfoStepCollapsed)}
                  /></div>

                  {/* Étape 1: Informations du client */}
                  <div id="section-client"><ClientStepForm
                    disabled={isLocked}
                    clients={clientsReguliers}
                    selectedClientIds={formData.clients_ids}
                    onSelectClient={(clientId) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        clients_ids: prev.clients_ids.includes(clientId)
                          ? prev.clients_ids.filter(id => id !== clientId)
                          : [...prev.clients_ids, clientId]
                      }));
                      setHasFormChanges(true);
                    }}
                    isCollapsed={clientStepCollapsed}
                    onToggleCollapse={() => setClientStepCollapsed(!clientStepCollapsed)}
                    clientInfo={clientInfo}
                    onClientInfoChange={(info) => {
                      setClientInfo(info);
                      setHasFormChanges(true);
                    }}
                  /></div>

                  {/* Étape 2: Professionnel */}
                  <div id="section-professionnel"><ProfessionnelStepForm
                    disabled={isLocked}
                    notaires={notaires}
                    courtiers={courtiers}
                    compagnies={clients.filter(c => c.type_client === 'Compagnie')}
                    selectedNotaireIds={formData.notaires_ids || []}
                    selectedCourtierIds={formData.courtiers_ids || []}
                    selectedCompagnieIds={formData.compagnies_ids || []}
                    onSelectNotaire={(id) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        notaires_ids: (prev.notaires_ids || []).includes(id)
                          ? prev.notaires_ids.filter(nid => nid !== id)
                          : [...(prev.notaires_ids || []), id]
                      }));
                    }}
                    onSelectCourtier={(id) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        courtiers_ids: (prev.courtiers_ids || []).includes(id)
                          ? prev.courtiers_ids.filter(cid => cid !== id)
                          : [...(prev.courtiers_ids || []), id]
                      }));
                    }}
                    onSelectCompagnie={(id) => {
                      if (isLocked) return;
                      setFormData(prev => ({
                        ...prev,
                        compagnies_ids: (prev.compagnies_ids || []).includes(id)
                          ? prev.compagnies_ids.filter(cid => cid !== id)
                          : [...(prev.compagnies_ids || []), id]
                      }));
                    }}
                    professionnelInfo={professionnelInfo}
                    onProfessionnelInfoChange={setProfessionnelInfo}
                    isCollapsed={professionnelStepCollapsed}
                    onToggleCollapse={() => setProfessionnelStepCollapsed(!professionnelStepCollapsed)}
                  /></div>

                  {/* Étape 3: Adresse des travaux */}
                  <div id="section-adresse"><AddressStepForm
                    disabled={isLocked}
                    address={workAddress}
                    onAddressChange={(addr) => { if (isLocked) return; setWorkAddress(addr); setHasFormChanges(true); }}
                    isCollapsed={addressStepCollapsed}
                    onToggleCollapse={() => setAddressStepCollapsed(!addressStepCollapsed)}
                    clientDossiers={dossiers.filter(d => 
                      formData.clients_ids.length > 0 && 
                      formData.clients_ids.some(clientId => d.clients_ids?.includes(clientId))
                    )}
                    allLots={lots}
                    onSelectExistingAddress={(addr, mandatLots) => {
                      if (addr) {
                        let lotNumbers = "";
                        if (mandatLots && mandatLots.length > 0) {
                          const lotNumeros = mandatLots.map(lotId => {
                            const foundLot = lots.find(l => l.id === lotId);
                            return foundLot?.numero_lot || lotId;
                          });
                          lotNumbers = lotNumeros.join('\n');
                        }
                        setWorkAddress({
                          numeros_civiques: addr.numeros_civiques || [""],
                          rue: addr.rue || "",
                          ville: addr.ville || "",
                          province: addr.province || "QC",
                          code_postal: addr.code_postal || "",
                          numero_lot: lotNumbers
                        });
                      }
                    }}
                  /></div>

                  {/* Étape 4: Mandats */}
                  <div id="section-mandats"><MandatStepForm
                    disabled={isLocked}
                    mandats={mandatsInfo}
                    onMandatsChange={(newMandats) => {
                      if (isLocked) return;
                      setMandatsInfo(newMandats);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={mandatStepCollapsed}
                    onToggleCollapse={() => setMandatStepCollapsed(!mandatStepCollapsed)}
                    statut={formData.statut}
                  /></div>

                  {/* Étape 5: Tarification */}
                  <div id="section-tarification"><TarificationStepForm
                    disabled={isLocked}
                    mandats={mandatsInfo}
                    onTarificationChange={(newMandats) => {
                      if (isLocked) return;
                      setMandatsInfo(newMandats);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={tarificationStepCollapsed}
                    onToggleCollapse={() => setTarificationStepCollapsed(!tarificationStepCollapsed)}
                  /></div>

                  {/* Étape 6: Documents */}
                  <div id="section-documents">
                  {formData.arpenteur_geometre && (clientInfo.prenom || clientInfo.nom || formData.numero_dossier) && (
                    <DocumentsStepForm
                      arpenteurGeometre={formData.arpenteur_geometre}
                      numeroDossier={formData.numero_dossier}
                      isCollapsed={documentsStepCollapsed}
                      onToggleCollapse={() => setDocumentsStepCollapsed(!documentsStepCollapsed)}
                      onDocumentsChange={setHasDocuments}
                      isTemporaire={!formData.numero_dossier}
                      clientInfo={clientInfo}
                    />
                    )}
                  </div>

                    </form>
                    </div>
                    </div>

                    {/* Sidebar - 30% */}
                     <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                    {/* Carte de l'adresse des travaux - Collapsible */}
                  <div 
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                    onClick={() => setMapCollapsedDossier(!mapCollapsedDossier)}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <h3 className="text-slate-300 text-base font-semibold">Carte</h3>
                    </div>
                    {mapCollapsedDossier ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                  {!mapCollapsedDossier && (workAddress.rue || workAddress.ville) && (
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
                              `${workAddress.numeros_civiques?.[0] || ''} ${workAddress.rue || ''}, ${workAddress.ville || ''}, ${workAddress.province || 'Québec'}, Canada`
                            )}&zoom=15`}
                          />
                        </div>
                        <div className="p-2 bg-slate-800/80">
                          <p className="text-xs text-slate-300 truncate">
                            📍 {workAddress.numeros_civiques?.[0]} {workAddress.rue}, {workAddress.ville}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Header Tabs Commentaires/Historique - Collapsible */}
                  <div 
                    className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                    onClick={() => setSidebarCollapsedDossier(!sidebarCollapsedDossier)}
                  >
                    <div className="flex items-center gap-2">
                      {sidebarTabDossier === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                      <h3 className="text-slate-300 text-base font-semibold">
                        {sidebarTabDossier === "commentaires" ? "Commentaires" : "Historique"}
                      </h3>
                    </div>
                    {sidebarCollapsedDossier ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>

                  {!sidebarCollapsedDossier && (
                    <Tabs value={sidebarTabDossier} onValueChange={setSidebarTabDossier} className="flex-1 flex flex-col overflow-hidden">
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
                        <CommentairesSection dossierId={null} dossierTemporaire={true} commentairesTemp={commentairesTemporaires} onCommentairesTempChange={(newComments) => { setCommentairesTemporaires(newComments); handleAutoSave(newComments); }} />
                      </TabsContent>
                      
                      <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                        {historique.length > 0 ? (
                          <div className="space-y-2">
                            {historique.map((entry, idx) => (
                              <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium">{entry.action}</p>
                                    {entry.details && (
                                      <p className="text-slate-400 text-xs mt-1 break-words">{entry.details}</p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                                      <span className="text-emerald-400">{entry.utilisateur_nom}</span>
                                      <span>•</span>
                                      <span>{format(new Date(entry.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                                    </div>
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
                      {!editingPriseMandat && <div className="flex justify-end gap-3 px-6 py-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
                        <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={async()=>{const h=formData.arpenteur_geometre||formData.clients_ids.length>0||clientInfo.prenom||clientInfo.nom||workAddress.rue||workAddress.ville||mandatsInfo.some(m=>m.type_mandat)||commentairesTemporaires.length>0;if(h){setShowCancelConfirm(true);return;}queryClient.invalidateQueries({queryKey:['priseMandats']});setIsDialogOpen(false);resetFullForm();setIsLocked(false);setLockedBy("");}}>Annuler</Button>
                        <Button type="submit" form="dossier-form" disabled={isLocked||createPriseMandatMutation?.isPending} className="bg-gradient-to-r from-emerald-500 to-teal-600">Ouvrir</Button>
                       </div>}
                      </motion.div>
                      </DialogContent>
                      </Dialog>

                      {/* Dialogs de sélection pour le formulaire de dossier */}



        </div>

        {/* Dialog de confirmation de changement de statut */}
        <Dialog open={showStatutChangeConfirm} onOpenChange={setShowStatutChangeConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Des documents sont liés à ce mandat. En changeant le statut, les documents associés au dossier SharePoint seront supprimés.
              </p>
              <p className="text-slate-400 text-sm text-center">
                Êtes-vous sûr de vouloir continuer ?
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowStatutChangeConfirm(false);
                    setPendingStatutChange(null);
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                  onClick={async () => {
                    const value = pendingStatutChange;
                    
                    // Supprimer les documents du dossier SharePoint
                    if (formData.numero_dossier && formData.arpenteur_geometre) {
                      try {
                        const initials = getArpenteurInitials(formData.arpenteur_geometre).replace('-', '');
                        const folderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${formData.numero_dossier}/INTRANTS`;
                        
                        // Récupérer la liste des fichiers
                        const response = await base44.functions.invoke('sharepoint', {
                          action: 'list',
                          folderPath: folderPath
                        });
                        const files = response.data?.files || [];
                        
                        // Supprimer chaque fichier
                        for (const file of files) {
                          await base44.functions.invoke('sharepoint', {
                            action: 'delete',
                            fileId: file.id
                          });
                        }
                      } catch (error) {
                        console.error("Erreur suppression documents SharePoint:", error);
                      }
                    }
                    
                    if (value !== "Mandats à ouvrir") {
                      setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
                    } else {
                      setFormData({...formData, statut: value});
                    }
                    setShowStatutChangeConfirm(false);
                    setPendingStatutChange(null);
                    setHasDocuments(false);
                  }}
                >
                  Confirmer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation d'annulation - Nouveau mandat */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={async () => {
                    if (editingPriseMandat && !isLocked) {
                      await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                        ...editingPriseMandat,
                        locked_by: null,
                        locked_at: null
                      });
                      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                    }
                    resetFullForm();
                    setIsLocked(false);
                    setLockedBy("");
                    setShowCancelConfirm(false);
                    setIsDialogOpen(false);
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowCancelConfirm(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour avertissement modifications non sauvegardées */}
        <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={async () => {
                    if (editingPriseMandat && !isLocked) {
                      await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                        ...editingPriseMandat,
                        locked_by: null,
                        locked_at: null
                      });
                      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                    }
                    resetFullForm();
                    setIsLocked(false);
                    setLockedBy("");
                    setShowUnsavedWarning(false);
                    setIsDialogOpen(false);
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowUnsavedWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog Ouvrir Dossier */}
        <OuvrirDossierDialog
          open={isOuvrirDossierDialogOpen} onOpenChange={setIsOuvrirDossierDialogOpen}
          dossierForm={nouveauDossierForm} commentaires={commentairesTemporairesDossier}
          clients={clients} lots={lots} users={users}
          editingPriseMandat={editingPriseMandat}
          onSuccess={() => { setIsOuvrirDossierDialogOpen(false); setIsDialogOpen(false); resetFullForm(); }}
        />

        {/* Dialog de confirmation de suppression de mandat */}
        <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3 pt-4">
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
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    if (mandatIndexToDelete !== null) {
                      setNouveauDossierForm(prev => ({
                        ...prev,
                        mandats: prev.mandats.filter((_, i) => i !== mandatIndexToDelete)
                      }));
                      setActiveTabMandatDossier(Math.max(0, mandatIndexToDelete - 1).toString());
                    }
                    setShowDeleteMandatConfirm(false);
                    setMandatIndexToDelete(null);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement utilisateur assigné manquant */}
        <Dialog open={showMissingUserWarning} onOpenChange={setShowMissingUserWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Tous les mandats doivent avoir un utilisateur assigné avant de créer le dossier.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowMissingUserWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour validation arpenteur requis */}
        <Dialog open={showArpenteurRequiredDialog} onOpenChange={setShowArpenteurRequiredDialog}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Veuillez sélectionner un arpenteur-géomètre.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowArpenteurRequiredDialog(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de succès d'import .d01 */}
        <Dialog open={showD01ImportSuccess} onOpenChange={setShowD01ImportSuccess}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader><DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3"><span className="text-2xl">✅</span>Succès<span className="text-2xl">✅</span></DialogTitle></DialogHeader>
            <div className="space-y-4 p-2">
              <p className="text-slate-300 text-center">Données importées avec succès depuis le fichier .d01</p>
              <div className="flex justify-center pt-4"><Button type="button" onClick={() => setShowD01ImportSuccess(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">OK</Button></div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression de concordance */}
        <Dialog open={showDeleteConcordanceConfirm} onOpenChange={setShowDeleteConcordanceConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer cette concordance ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowDeleteConcordanceConfirm(false);
                    setConcordanceIndexToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    if (concordanceIndexToDelete !== null) {
                      setNewLotForm(prev => ({
                        ...prev,
                        concordances_anterieures: prev.concordances_anterieures.filter((_, i) => i !== concordanceIndexToDelete)
                      }));
                    }
                    setShowDeleteConcordanceConfirm(false);
                    setConcordanceIndexToDelete(null);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation d'annulation de création de lot */}
        <Dialog open={showCancelLotConfirm} onOpenChange={setShowCancelLotConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    setShowCancelLotConfirm(false);
                    setIsNewLotDialogOpen(false);
                    resetLotForm();
                  }}
                >
                  Abandonner
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowCancelLotConfirm(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Continuer l'édition
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement lot existant */}
        <Dialog open={showLotExistsWarning} onOpenChange={setShowLotExistsWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Le lot <span className="text-emerald-400 font-semibold">{newLotForm.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{newLotForm.circonscription_fonciere}</span>.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowLotExistsWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement champs obligatoires manquants */}
        <Dialog open={showLotMissingFieldsWarning} onOpenChange={setShowLotMissingFieldsWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Veuillez remplir tous les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowLotMissingFieldsWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression de prise de mandat */}
        <Dialog open={showDeletePriseMandatConfirm} onOpenChange={setShowDeletePriseMandatConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer cette prise de mandat ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowDeletePriseMandatConfirm(false);
                    setPriseMandatIdToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                  onClick={() => {
                    if (priseMandatIdToDelete) {
                      deletePriseMandatMutation.mutate(priseMandatIdToDelete);
                    }
                    setShowDeletePriseMandatConfirm(false);
                    setPriseMandatIdToDelete(null);
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'avertissement concordance incomplète */}
        <Dialog open={showConcordanceWarning} onOpenChange={setShowConcordanceWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Veuillez remplir le numéro de lot, la circonscription foncière et le cadastre pour ajouter une concordance.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowConcordanceWarning(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Compris
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Dialog pour ajouter une minute */}
        <Dialog open={isAddMinuteDialogOpen} onOpenChange={setIsAddMinuteDialogOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-md shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle className="text-xl">Ajouter une minute</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="space-y-2">
                <Label>Minute <span className="text-red-400">*</span></Label>
                <Input
                  value={newMinuteForm.minute}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, minute: e.target.value })}
                  placeholder="Ex: 12345"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Date de minute <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={newMinuteForm.date_minute}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, date_minute: e.target.value })}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Type de minute <span className="text-red-400">*</span></Label>
                <Select
                  value={newMinuteForm.type_minute}
                  onValueChange={(value) => setNewMinuteForm({ ...newMinuteForm, type_minute: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Initiale" className="text-white">Initiale</SelectItem>
                    <SelectItem value="Remplace" className="text-white">Remplace</SelectItem>
                    <SelectItem value="Corrige" className="text-white">Corrige</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAddMinuteDialogOpen(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleAddMinuteFromDialog}
                  disabled={!newMinuteForm.minute || !newMinuteForm.date_minute}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Client Selector Dialog */}
        <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle>Sélectionner des clients</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un client..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingClientForForm(null);
                    setClientTypeForForm("Client");
                    setIsClientFormDialogOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {filteredClientsForSelector.map((client) => (
                    <div
                      key={client.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.clients_ids.includes(client.id)
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                      onClick={() => toggleClient(client.id, 'clients')}
                    >
                      <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {client.adresses?.length > 0 && formatAdresse(client.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(client.adresses.find(a => a.actuelle || a.actuel))}</p>
                        )}
                        {getCurrentValue(client.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(client.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(client.telephones, 'telephone') && (
                          <p>
                            📞 <a 
                              href={`tel:${getCurrentValue(client.telephones, 'telephone').replace(/\D/g, '')}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {getCurrentValue(client.telephones, 'telephone')}
                            </a>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsClientSelectorOpen(false);
                          handleEdit(client);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 mt-2 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsClientSelectorOpen(false)} className="w-full bg-emerald-500">
                Valider
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Notaire Selector Dialog */}
        <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle>Sélectionner des notaires</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un notaire..."
                    value={notaireSearchTerm}
                    onChange={(e) => setNotaireSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingClientForForm(null);
                    setClientTypeForForm("Notaire");
                    setIsClientFormDialogOpen(true);
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {filteredNotairesForSelector.map((notaire) => (
                    <div
                      key={notaire.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.notaires_ids.includes(notaire.id)
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                      onClick={() => toggleClient(notaire.id, 'notaires')}
                    >
                      <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {notaire.adresses?.length > 0 && formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel))}</p>
                        )}
                        {getCurrentValue(notaire.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(notaire.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(notaire.telephones, 'telephone') && (
                          <p>
                            📞 <a 
                              href={`tel:${getCurrentValue(notaire.telephones, 'telephone').replace(/\D/g, '')}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {getCurrentValue(notaire.telephones, 'telephone')}
                            </a>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsNotaireSelectorOpen(false);
                          handleEdit(notaire);
                        }}
                        className="text-purple-400 hover:text-purple-300 mt-2 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsNotaireSelectorOpen(false)} className="w-full bg-purple-500">
                Valider
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Courtier Selector Dialog */}
        <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle>Sélectionner des courtiers</DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher un courtier..."
                    value={courtierSearchTerm}
                    onChange={(e) => setCourtierSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditingClientForForm(null);
                    setClientTypeForForm("Courtier immobilier");
                    setIsClientFormDialogOpen(true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {filteredCourtiersForSelector.map((courtier) => (
                    <div
                      key={courtier.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        formData.courtiers_ids.includes(courtier.id)
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                      }`}
                      onClick={() => toggleClient(courtier.id, 'courtiers')}
                    >
                      <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {courtier.adresses?.length > 0 && formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel)) && (
                          <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel))}</p>
                        )}
                        {getCurrentValue(courtier.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(courtier.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(courtier.telephones, 'telephone') && (
                          <p>
                            📞 <a 
                              href={`tel:${getCurrentValue(courtier.telephones, 'telephone').replace(/\D/g, '')}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {getCurrentValue(courtier.telephones, 'telephone')}
                            </a>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCourtierSelectorOpen(false);
                          handleEdit(courtier);
                        }}
                        className="text-orange-400 hover:text-orange-300 mt-2 w-full"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={() => setIsCourtierSelectorOpen(false)} className="w-full bg-orange-500">
                Valider
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* PDF Viewer Dialog */}
        <Dialog open={!!viewingPdfUrl} onOpenChange={(open) => { if (!open) { setViewingPdfUrl(null); setViewingPdfName(""); } }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <div className="flex items-center px-3 py-1.5 border-b border-slate-800 flex-shrink-0 min-h-0">
              <div className="flex items-center gap-2 text-sm">
                <File className="w-4 h-4 text-amber-400" />
                <span className="truncate max-w-[600px] text-white">{viewingPdfName}</span>
              </div>
            </div>
            <DialogHeader className="sr-only">
              <DialogTitle>{viewingPdfName}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden bg-slate-950 min-h-0">
              {viewingPdfUrl && (
                <iframe
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingPdfUrl)}&embedded=true`}
                  className="w-full h-full border-0"
                  title={viewingPdfName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ClientFormDialog (replaces previous New Client Dialogs) */}
        <ClientFormDialog
          open={isClientFormDialogOpen}
          onOpenChange={(open) => {
            setIsClientFormDialogOpen(open);
            if (!open) setEditingClientForForm(null);
          }}
          editingClient={editingClientForForm}
          defaultType={clientTypeForForm}
          initialData={
            clientTypeForForm === "Client" ? clientInfo :
            clientTypeForForm === "Notaire" ? {
              prenom: professionnelInfo.notaire || "",
              nom: "",
              telephone: professionnelInfo.notaire_telephone || "",
              courriel: professionnelInfo.notaire_courriel || ""
            } :
            clientTypeForForm === "Courtier immobilier" ? {
              prenom: professionnelInfo.courtier || "",
              nom: "",
              telephone: professionnelInfo.courtier_telephone || "",
              courriel: professionnelInfo.courtier_courriel || ""
            } : null
          }
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['clients'] }); // Refresh clients list
            // Optionally re-open the selector if creating from there
            if (clientTypeForForm === "Client" && !isOuvrirDossierDialogOpen) {
              setIsClientSelectorOpen(true);
            }
            if (clientTypeForForm === "Notaire" && !isOuvrirDossierDialogOpen) {
              setIsNotaireSelectorOpen(true);
            }
            if (clientTypeForForm === "Courtier immobilier" && !isOuvrirDossierDialogOpen) {
              setIsCourtierSelectorOpen(true);
            }
          }}
        />

        {/* Lot Selector Dialog */}
        <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {
          setIsLotSelectorOpen(open);
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
            <motion.div 
              className="space-y-4 flex-1 overflow-hidden flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par numéro, rang..."
                    value={lotSearchTerm}
                    onChange={(e) => setLotSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Select value={lotCirconscriptionFilter} onValueChange={setLotCirconscriptionFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Circonscription" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                    {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                      <SelectItem key={circ} value={circ} className="text-white">
                        {circ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={lotCadastreFilter} onValueChange={setLotCadastreFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Cadastre" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                    <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                    <SelectItem value="Québec" className="text-white">Québec</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => setIsNewLotDialogOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau lot
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
                    {filteredLotsForSelector.length > 0 ? (
                      filteredLotsForSelector.map((lot) => {
                        const isSelected = currentMandatIndex !== null &&
                          formData.mandats[currentMandatIndex]?.lots?.includes(lot.id);
                        return (
                          <TableRow
                            key={lot.id}
                            className={`cursor-pointer transition-colors border-slate-800 ${
                              isSelected
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                                : 'hover:bg-slate-800/30'
                            }`}
                            onClick={() => addLotToCurrentMandat(lot.id)}
                          >
                            <TableCell className="font-medium text-white">
                              {lot.numero_lot}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                {lot.circonscription_fonciere}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {lot.cadastre || "-"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {lot.rang || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {isSelected && (
                                <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50">
                                  <Check className="w-3 h-3 mr-1" />
                                  Sélectionné
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="text-slate-400">
                            <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun lot trouvé</p>
                            <p className="text-sm mt-2">Essayez de modifier vos filtres ou créez un nouveau lot</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <Button onClick={() => setIsLotSelectorOpen(false)} className="w-full bg-emerald-500">
                Valider la sélection
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* New Lot Dialog */}
        <Dialog open={isNewLotDialogOpen} onOpenChange={(open) => {
          if (!open) {
            let hasChanges = false;
            if (editingLot) {
                hasChanges = JSON.stringify(newLotForm) !== JSON.stringify(initialLotForm) || commentairesTemporairesLot.length > 0;
            } else {
                hasChanges = newLotForm.numero_lot || 
                  newLotForm.circonscription_fonciere || 
                  newLotForm.rang || 
                  newLotForm.types_operation.length > 0 ||
                  commentairesTemporairesLot.length > 0;
            }
            
            if (hasChanges) {
              setShowCancelLotConfirm(true);
            } else {
              setIsNewLotDialogOpen(false);
              resetLotForm();
            }
          } else {
            // Charger l'historique du lot lors de l'ouverture en mode édition
            if (open && editingLot) {
              const loadActionLogs = async () => {
                const logs = await base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: editingLot.id }, '-created_date');
                setLotActionLogs(logs);
              };
              loadActionLogs();
            }
            setIsNewLotDialogOpen(open);
          }
        }}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Nouveau lot</DialogTitle>
            </DialogHeader>
            
            <motion.div 
              className="flex flex-col h-[90vh]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 flex overflow-hidden">
                {/* Colonne gauche - Formulaire - 70% */}
                <div className="flex-[0_0_70%] flex flex-col overflow-hidden border-r border-slate-800">
                  <div className="sticky top-0 z-10 bg-slate-900 p-4 pb-3 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white">{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 pt-2">
                  <form id="lot-form" onSubmit={handleNewLotSubmit} className="space-y-3">
                    {/* Section Import .d01 - Visible uniquement en mode création */}
                    {!editingLot && (
                      <div 
                        className={`border border-dashed rounded-lg p-2 transition-all ${
                          isDragOverD01 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-slate-600 bg-slate-800/20 hover:border-slate-500'
                        }`}
                        onDragOver={handleD01DragOver}
                        onDragLeave={handleD01DragLeave}
                        onDrop={handleD01Drop}
                      >
                        {isImportingD01 ? (
                          <div className="flex items-center justify-center gap-2 text-teal-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Importation...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-400 text-xs">Importer depuis un fichier .d01</span>
                            </div>
                            <label>
                              <input
                                type="file"
                                accept=".d01"
                                onChange={handleD01FileSelect}
                                className="hidden"
                              />
                              <span className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded cursor-pointer transition-colors inline-block">
                                Parcourir
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section Informations du lot */}
                    <LotInfoStepForm
                      lotForm={newLotForm}
                      onLotFormChange={(data) => setNewLotForm(data)}
                      availableCadastres={availableCadastresForNewLot}
                      onCirconscriptionChange={handleLotCirconscriptionChange}
                      isCollapsed={lotInfoCollapsed}
                      onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                    />

                    {/* Section Types d'opération */}
                    <TypesOperationStepForm
                      typesOperation={newLotForm.types_operation || []}
                      onTypesOperationChange={(data) => setNewLotForm({...newLotForm, types_operation: data})}
                      isCollapsed={typesOperationCollapsed}
                      onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                      allLots={lots}
                    />

                    {/* Section Documents */}
                    <DocumentsStepFormLot
                      lotNumero={newLotForm.numero_lot || ""}
                      circonscription={newLotForm.circonscription_fonciere || ""}
                      isCollapsed={lotDocumentsCollapsed}
                      onToggleCollapse={() => setLotDocumentsCollapsed(!lotDocumentsCollapsed)}
                      disabled={false}
                    />
                  </form>
                  </div>
                </div>

                {/* Colonne droite - Commentaires et Historique - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                 {/* Header Tabs Commentaires/Historique - Collapsible */}
                 <div 
                   className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                   onClick={() => setSidebarCollapsedLot(!sidebarCollapsedLot)}
                 >
                   <div className="flex items-center gap-2">
                     {sidebarTabLot === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                     <h3 className="text-slate-300 text-base font-semibold">
                       {sidebarTabLot === "commentaires" ? "Commentaires" : "Historique"}
                     </h3>
                   </div>
                   {sidebarCollapsedLot ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                 </div>

                 {!sidebarCollapsedLot && (
                   <Tabs value={sidebarTabLot} onValueChange={setSidebarTabLot} className="flex-1 flex flex-col overflow-hidden">
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
                       <CommentairesSectionLot
                         lotId={editingLot?.id}
                         lotTemporaire={!editingLot}
                         commentairesTemp={commentairesTemporairesLot}
                         onCommentairesTempChange={setCommentairesTemporairesLot}
                       />
                     </TabsContent>

                     <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                       {lotActionLogs.length > 0 ? (
                         <div className="space-y-3">
                           {lotActionLogs.map((log) => (
                             <div key={log.id} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                               <div className="flex items-start justify-between gap-2">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <Badge className={`text-xs ${
                                       log.action === 'Création' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                       log.action === 'Modification' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                       'bg-red-500/20 text-red-400 border-red-500/30'
                                     }`}>
                                       {log.action}
                                     </Badge>
                                     <span className="text-slate-400 text-xs">
                                       {log.created_date && format(new Date(log.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                     </span>
                                   </div>
                                   <p className="text-slate-300 text-sm">{log.details}</p>
                                   <p className="text-slate-500 text-xs mt-1">Par {log.utilisateur_nom}</p>
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

              {/* Boutons tout en bas - pleine largeur */}
              <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => {
                 let hasChanges = false;
                 if (editingLot) {
                     hasChanges = JSON.stringify(newLotForm) !== JSON.stringify(initialLotForm) || commentairesTemporairesLot.length > 0;
                 } else {
                     hasChanges = newLotForm.numero_lot || 
                       newLotForm.circonscription_fonciere || 
                       newLotForm.rang || 
                       newLotForm.types_operation.length > 0 ||
                       commentairesTemporairesLot.length > 0;
                 }

                  if (hasChanges) {
                    setShowCancelLotConfirm(true);
                  } else {
                    setIsNewLotDialogOpen(false);
                    resetLotForm();
                  }
                }} className="border-red-500 text-red-400 hover:bg-red-500/10">
                  Annuler
                </Button>
                <Button type="submit" form="lot-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                   {editingLot ? "Modifier" : "Créer"}
                 </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Client Details Dialog */}
        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">
                Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="flex-1 overflow-hidden p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {viewingClientDetails && (
                <ClientDetailView
                  client={viewingClientDetails}
                  onClose={() => setViewingClientDetails(null)}
                  onViewDossier={(dossier) => {
                    setViewingClientDetails(null);
                    setViewingDossier(dossier);
                    setIsViewDialogOpen(true);
                  }}
                />
              )}
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* View Dossier Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Détails du dossier</DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <motion.div 
                className="flex h-[90vh]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Main content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6 flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                      Détails du dossier {getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}
                    </h2>
                    {viewingDossier.ttl === "Oui" && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <span className="text-indigo-400 font-semibold text-sm tracking-wide">TTL</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Informations principales */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Statut</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className={`${getStatutBadgeColor(viewingDossier.statut)} border`}>
                            {viewingDossier.statut}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Date de création</Label>
                        <p className="text-white font-medium mt-1">
                          {viewingDossier.created_date ? format(new Date(viewingDossier.created_date), "dd MMMM yyyy", { locale: fr }) : '-'}
                        </p>
                      </div>
                    </div>

                    {viewingDossier.utilisateur_assigne && (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                        <p className="text-white font-medium mt-1 text-sm">
                          {users.find(u => u.email === viewingDossier.utilisateur_assigne)?.full_name || viewingDossier.utilisateur_assigne}
                        </p>
                      </div>
                    )}

                    {viewingDossier.description && (
                      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <Label className="text-slate-400 text-sm">Description</Label>
                        <p className="text-white mt-2 whitespace-pre-wrap">{viewingDossier.description}</p>
                      </div>
                    )}

                    {/* Clients, Notaires, Courtiers */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Clients */}
                      {viewingDossier.ttl === "Oui" ? (
                        viewingDossier.clients_texte && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                            <p className="text-white p-3 bg-slate-800/30 rounded-lg whitespace-pre-wrap">{viewingDossier.clients_texte}</p>
                          </div>
                        )
                      ) : (
                        viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                            <div className="flex flex-col gap-2">
                              {viewingDossier.clients_ids.map(clientId => {
                                const client = getClientById(clientId);
                                return client ? (
                                  <Badge 
                                    key={clientId} 
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-full justify-start cursor-pointer hover:bg-blue-500/30 transition-colors"
                                    onClick={() => {
                                      setIsViewDialogOpen(false);
                                      setViewingClientDetails(client);
                                    }}
                                  >
                                    {client.prenom} {client.nom}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )
                      )}

                      {/* Notaires */}
                      {viewingDossier.ttl === "Oui" ? (
                        viewingDossier.notaires_texte && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                            <p className="text-white p-3 bg-slate-800/30 rounded-lg whitespace-pre-wrap">{viewingDossier.notaires_texte}</p>
                          </div>
                        )
                      ) : (
                        viewingDossier.notaires_ids && viewingDossier.notaires_ids.length > 0 && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                            <div className="flex flex-col gap-2">
                              {viewingDossier.notaires_ids.map(notaireId => {
                                const notaire = getClientById(notaireId);
                                return notaire ? (
                                  <Badge 
                                    key={notaireId} 
                                    className="bg-purple-500/20 text-purple-400 border-purple-500/30 border w-full justify-start cursor-pointer hover:bg-purple-500/30 transition-colors"
                                    onClick={() => {
                                      setIsViewDialogOpen(false);
                                      setViewingClientDetails(notaire);
                                    }}
                                  >
                                    {notaire.prenom} {notaire.nom}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )
                      )}

                      {/* Courtiers */}
                      {viewingDossier.ttl === "Oui" ? (
                        viewingDossier.courtiers_texte && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Courtiers immobiliers</Label>
                            <p className="text-white p-3 bg-slate-800/30 rounded-lg whitespace-pre-wrap">{viewingDossier.courtiers_texte}</p>
                          </div>
                        )
                      ) : (
                        viewingDossier.courtiers_ids && viewingDossier.courtiers_ids.length > 0 && (
                          <div>
                            <Label className="text-slate-400 text-sm mb-2 block">Courtiers immobiliers</Label>
                            <div className="flex flex-col gap-2">
                              {viewingDossier.courtiers_ids.map(courtierId => {
                                const courtier = getClientById(courtierId);
                                return courtier ? (
                                  <Badge 
                                    key={courtierId} 
                                    className="bg-orange-500/20 text-orange-400 border-orange-500/30 border w-full justify-start cursor-pointer hover:bg-orange-500/30 transition-colors"
                                    onClick={() => {
                                      setIsViewDialogOpen(false);
                                      setViewingClientDetails(courtier);
                                    }}
                                  >
                                    {courtier.prenom} {courtier.nom}
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Mandats */}
                    {viewingDossier.mandats && viewingDossier.mandats.length > 0 && (
                      <div>
                        <Label className="text-slate-400 text-sm mb-3 block">Mandats ({viewingDossier.mandats.length})</Label>
                        <div className="space-y-3">
                          {viewingDossier.mandats.map((mandat, index) => (
                            <Card key={index} className="bg-slate-800/50 border-slate-700">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <h5 className="font-semibold text-emerald-400 text-lg">{mandat.type_mandat || `Mandat ${index + 1}`}</h5>
                                  {mandat.prix_estime > 0 && (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                                      {mandat.prix_estime.toFixed(2)} $
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) !== "" && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                                    </div>
                                  )}
                                  
                                  {mandat.lots && mandat.lots.length > 0 && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Lots</Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {mandat.lots.map((lotId) => {
                                          const lot = getLotById(lotId);
                                          return (
                                            <Badge key={lotId} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                              {lot?.numero_lot || lotId}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Utilisateur assigné pour mandat */}
                                {mandat.utilisateur_assigne && (
                                  <div>
                                    <Label className="text-slate-400 text-xs">Utilisateur assigné pour le mandat</Label>
                                    <p className="text-slate-300 text-sm mt-1">
                                      {users.find(u => u.email === mandat.utilisateur_assigne)?.full_name || mandat.utilisateur_assigne}
                                    </p>
                                  </div>
                                )}

                                {/* Dates */}
                                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-700">
                                  {mandat.date_ouverture && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Ouverture</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_ouverture), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_signature && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Signature</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_debut_travaux && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Début travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_debut_travaux), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_livraison && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Livraison</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Tarification */}
                                {(mandat.prix_estime > 0 || mandat.rabais > 0) && (
                                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                                    {mandat.prix_estime > 0 && (
                                      <div>
                                        <Label className="text-slate-400 text-xs">Prix estimé</Label>
                                        <p className="text-slate-300 text-sm mt-1">{mandat.prix_estime.toFixed(2)} $</p>
                                      </div>
                                    )}
                                    {mandat.rabais > 0 && (
                                      <div>
                                        <Label className="text-slate-400 text-xs">Rabais</Label>
                                        <p className="text-slate-300 text-sm mt-1">{mandat.rabais.toFixed(2)} $</p>
                                      </div>
                                    )}
                                    <div>
                                        <Label className="text-slate-400 text-xs">Taxes</Label>
                                        <p className="text-slate-300 text-sm mt-1">
                                          {mandat.taxes_incluses ? "✓ Incluses" : "Non incluses"}
                                        </p>
                                      </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Boutons Fermer/Modifier tout en bas */}
                  <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">
                      Fermer
                    </Button>
                    <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={handleEditFromView}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>

                {/* Right side - Commentaires Sidebar - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-hidden p-4 pr-4">
                    <CommentairesSection
                      dossierId={viewingDossier?.id}
                      dossierTemporaire={false}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>


        {/* Table des prises de mandat */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800 pb-1 pt-0">
            <div className="flex flex-col gap-2">
              
              {/* Tabs pour les statuts - style tabs pleine largeur */}
              <div className="flex w-full border-b border-slate-700">
                <button
                  role="tab"
                  onClick={() => setActiveListTab("nouveau")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "nouveau"
                      ? "border-cyan-500 text-cyan-400 bg-cyan-500/10"
                      : "border-transparent text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5"
                  }`}
                >
                  <FileQuestion className="w-4 h-4" />
                  Nouveau mandat / Demande d'informations
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 ml-1">
                    {priseMandats.filter(pm => pm.statut === "Nouveau mandat/Demande d'information").length}
                  </Badge>
                </button>
                <button
                  role="tab"
                  onClick={() => setActiveListTab("ouvrir")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "ouvrir"
                      ? "border-purple-500 text-purple-400 bg-purple-500/10"
                      : "border-transparent text-slate-400 hover:text-purple-400 hover:bg-purple-500/5"
                  }`}
                >
                  <FolderOpen className="w-4 h-4" />
                  Mandat à ouvrir
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 ml-1">
                    {priseMandats.filter(pm => pm.statut === "Mandats à ouvrir").length}
                  </Badge>
                </button>
                <button
                  role="tab"
                  onClick={() => setActiveListTab("non-octroye")}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "non-octroye"
                      ? "border-red-500 text-red-400 bg-red-500/10"
                      : "border-transparent text-slate-400 hover:text-red-400 hover:bg-red-500/5"
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  Mandat non-octroyé
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 ml-1">
                    {priseMandats.filter(pm => pm.statut === "Mandat non octroyé").length}
                  </Badge>
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-700/50 relative"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="text-sm">Filtres</span>
                    {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                        {filterArpenteur.length + filterVille.length + filterTypeMandat.length + filterUrgence.length + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0)}
                      </Badge>
                    )}
                    {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                </div>

                <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <CollapsibleContent>
                    <div className="p-2 border border-emerald-500/30 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                          <div className="flex items-center gap-2">
                            <Filter className="w-3 h-3 text-emerald-500" />
                            <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                          </div>
                          {(filterArpenteur.length > 0 || filterVille.length > 0 || filterTypeMandat.length > 0 || filterUrgence.length > 0 || filterDateStart || filterDateEnd) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFilterArpenteur([]);
                                setFilterVille([]);
                                setFilterTypeMandat([]);
                                setFilterUrgence([]);
                                setFilterDateStart("");
                                setFilterDateEnd("");
                              }}
                              className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                            >
                              <X className="w-2.5 h-2.5 mr-1" />
                              Réinitialiser
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Arpenteurs ({filterArpenteur.length > 0 ? `${filterArpenteur.length}` : 'Tous'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                                {ARPENTEURS.map((arp) => (
                                  <DropdownMenuCheckboxItem
                                    key={arp}
                                    checked={filterArpenteur.includes(arp)}
                                    onCheckedChange={(checked) => {
                                      setFilterArpenteur(
                                        checked
                                          ? [...filterArpenteur, arp]
                                          : filterArpenteur.filter((a) => a !== arp)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {arp}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-slate-800 border-slate-700">
                                {allVilles.map((ville) => (
                                  <DropdownMenuCheckboxItem
                                    key={ville}
                                    checked={filterVille.includes(ville)}
                                    onCheckedChange={(checked) => {
                                      setFilterVille(
                                        checked
                                          ? [...filterVille, ville]
                                          : filterVille.filter((v) => v !== ville)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {ville}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Types ({filterTypeMandat.length > 0 ? `${filterTypeMandat.length}` : 'Tous'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                                {TYPES_MANDATS.map((type) => (
                                  <DropdownMenuCheckboxItem
                                    key={type}
                                    checked={filterTypeMandat.includes(type)}
                                    onCheckedChange={(checked) => {
                                      setFilterTypeMandat(
                                        checked
                                          ? [...filterTypeMandat, type]
                                          : filterTypeMandat.filter((t) => t !== type)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {type}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-500 justify-between h-8 text-xs px-2">
                                  <span className="truncate">Urgence ({filterUrgence.length > 0 ? `${filterUrgence.length}` : 'Toutes'})</span>
                                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                                {["Pas pressé", "Normal", "Rapide"].map((urg) => (
                                  <DropdownMenuCheckboxItem
                                    key={urg}
                                    checked={filterUrgence.includes(urg)}
                                    onCheckedChange={(checked) => {
                                      setFilterUrgence(
                                        checked
                                          ? [...filterUrgence, urg]
                                          : filterUrgence.filter((u) => u !== urg)
                                      );
                                    }}
                                    className="text-white"
                                  >
                                    {urg}
                                  </DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1 border-t border-emerald-500/30">
                          <Label className="text-xs text-emerald-500">Période</Label>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="date"
                              value={filterDateStart}
                              onChange={(e) => setFilterDateStart(e.target.value)}
                              placeholder="Du"
                              className="flex-1 border-emerald-500/30 text-emerald-500 h-8 text-xs px-2"
                            />
                            <span className="text-emerald-500 text-xs">→</span>
                            <Input
                              type="date"
                              value={filterDateEnd}
                              onChange={(e) => setFilterDateEnd(e.target.value)}
                              placeholder="Au"
                              className="flex-1 border-emerald-500/30 text-emerald-500 h-8 text-xs px-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    {[['arpenteur_geometre', activeListTab === 'ouvrir' ? 'Dossier' : 'Arpenteur-Géomètre'], ['clients', 'Clients'], ['adresse_travaux', 'Adresse des travaux'], ['ville', 'Ville'], [null, 'N° de téléphone'], ['types_mandats', 'Types de mandats'], ['created_date', 'Date'], ['urgence_percue', 'Urgence']].map(([field, label]) => (
                      <TableHead
                        key={label}
                        className={`text-slate-300 text-xs ${field ? 'cursor-pointer hover:text-white select-none' : ''}`}
                        onClick={field ? () => handleSort(field) : undefined}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {field && (sortField === field
                            ? sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-emerald-400" /> : <ChevronDown className="w-3 h-3 text-emerald-400" />
                            : <ChevronsUpDown className="w-3 h-3 text-slate-500" />)}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-slate-300 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priseMandats
                    .filter(pm => {
                      // Filtre par tab actif
                      const tabStatut = activeListTab === "nouveau" 
                        ? "Nouveau mandat/Demande d'information"
                        : activeListTab === "ouvrir"
                        ? "Mandats à ouvrir"
                        : "Mandat non octroyé";
                      return pm.statut === tabStatut;
                    })
                    .filter(pm => {
                      const searchLower = searchTerm.toLowerCase();
                      const clientName = pm.client_info?.prenom || pm.client_info?.nom 
                        ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim().toLowerCase()
                        : getClientsNames(pm.clients_ids).toLowerCase();
                      const matchesSearch = (
                        pm.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
                        clientName.includes(searchLower) ||
                        formatAdresse(pm.adresse_travaux)?.toLowerCase().includes(searchLower) ||
                        pm.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
                      );
                      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(pm.arpenteur_geometre);
                      const matchesVille = filterVille.length === 0 || filterVille.includes(pm.adresse_travaux?.ville);
                      const matchesTypeMandat = filterTypeMandat.length === 0 || pm.mandats?.some(m => filterTypeMandat.includes(m.type_mandat));
                      const matchesUrgence = filterUrgence.length === 0 || filterUrgence.includes(pm.urgence_percue);
                      
                      const pmDate = new Date(pm.created_date);
                      const matchesDateStart = filterDateStart === "" || pmDate >= new Date(filterDateStart);
                      const matchesDateEnd = filterDateEnd === "" || pmDate <= new Date(filterDateEnd + "T23:59:59");
                      
                      return matchesSearch && matchesArpenteur && matchesVille && matchesTypeMandat && matchesUrgence && matchesDateStart && matchesDateEnd;
                    })
                    .sort((a, b) => {
                      if (!sortField) return 0;
                      let aValue, bValue;
                      switch (sortField) {
                        case 'arpenteur_geometre':
                          aValue = (a.arpenteur_geometre || '').toLowerCase();
                          bValue = (b.arpenteur_geometre || '').toLowerCase();
                          break;
                        case 'created_date':
                          aValue = new Date(a.created_date || 0).getTime();
                          bValue = new Date(b.created_date || 0).getTime();
                          break;
                        case 'clients':
                          const aClientName = a.client_info?.prenom || a.client_info?.nom 
                            ? `${a.client_info.prenom || ''} ${a.client_info.nom || ''}`.trim()
                            : getClientsNames(a.clients_ids);
                          const bClientName = b.client_info?.prenom || b.client_info?.nom 
                            ? `${b.client_info.prenom || ''} ${b.client_info.nom || ''}`.trim()
                            : getClientsNames(b.clients_ids);
                          aValue = aClientName.toLowerCase();
                          bValue = bClientName.toLowerCase();
                          break;
                        case 'adresse_travaux':
                          aValue = `${a.adresse_travaux?.numeros_civiques?.[0] || ''} ${a.adresse_travaux?.rue || ''}`.toLowerCase();
                          bValue = `${b.adresse_travaux?.numeros_civiques?.[0] || ''} ${b.adresse_travaux?.rue || ''}`.toLowerCase();
                          break;
                        case 'ville':
                          aValue = (a.adresse_travaux?.ville || '').toLowerCase();
                          bValue = (b.adresse_travaux?.ville || '').toLowerCase();
                          break;
                        case 'types_mandats':
                          aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
                          bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
                          break;
                        case 'urgence_percue':
                          const urgenceOrder = { 'Rapide': 1, 'Normal': 2, 'Pas pressé': 3 };
                          aValue = urgenceOrder[a.urgence_percue] || 4;
                          bValue = urgenceOrder[b.urgence_percue] || 4;
                          break;
                        default:
                          aValue = '';
                          bValue = '';
                      }
                      if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                      }
                      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                    })
                    .map((pm) => {
                      const getUrgenceColor = (u) => (u === "Rapide" || u === "Urgent") ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30";

                      return (
                        <TableRow 
                          key={pm.id} 
                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                          onClick={() => handleEditPriseMandat(pm)}
                        >
                          <TableCell className="font-medium">
                            {activeListTab === "ouvrir" ? (
                              <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                                {getArpenteurInitials(pm.arpenteur_geometre)}{pm.numero_dossier || "N/A"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                                {pm.arpenteur_geometre}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                            {pm.client_info?.prenom || pm.client_info?.nom 
                              ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim()
                              : getClientsNames(pm.clients_ids)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                            {pm.adresse_travaux?.numeros_civiques?.[0] || pm.adresse_travaux?.rue
                              ? `${pm.adresse_travaux.numeros_civiques?.[0] || ''} ${pm.adresse_travaux.rue || ''}`.trim()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs">
                            {pm.adresse_travaux?.ville || '-'}
                          </TableCell>
                          <TableCell className="text-slate-300 text-xs">
                            {(() => {
                              const telephone = pm.client_info?.telephone || 
                                (pm.clients_ids?.length > 0 && (() => {
                                  const client = getClientById(pm.clients_ids[0]);
                                  return client?.telephones?.find(t => t.actuel)?.telephone || client?.telephones?.[0]?.telephone || null;
                                })());
                              
                              if (telephone) {
                                return (
                                  <a 
                                    href={`tel:${telephone.replace(/\D/g, '')}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer hover:underline"
                                  >
                                    {telephone}
                                  </a>
                                );
                              }
                              return '-';
                            })()}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {pm.mandats && pm.mandats.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {pm.mandats.slice(0, 2).map((m, idx) => (
                                  <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs`}>
                                    {getAbbreviatedMandatType(m.type_mandat)}
                                  </Badge>
                                ))}
                                {pm.mandats.length > 2 && (
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                                    +{pm.mandats.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">Aucun</span>
                            )}
                          </TableCell>

                          <TableCell className="text-slate-300 text-xs">
                            {pm.created_date ? format(new Date(pm.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            {pm.urgence_percue ? (
                              <Badge className={`${getUrgenceColor(pm.urgence_percue)} border text-xs`}>
                                {pm.urgence_percue === "Rapide" ? "Urgent" : pm.urgence_percue}
                              </Badge>
                            ) : (
                              <span className="text-slate-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPriseMandatIdToDelete(pm.id);
                                  setShowDeletePriseMandatConfirm(true);
                                }}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {priseMandats.filter(pm => {
                    const tabStatut = activeListTab === "nouveau" 
                      ? "Nouveau mandat/Demande d'information"
                      : activeListTab === "ouvrir"
                      ? "Mandats à ouvrir"
                      : "Mandat non octroyé";
                    return pm.statut === tabStatut;
                  }).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                        Aucune prise de mandat dans cette catégorie
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
});

export default PriseDeMandat;