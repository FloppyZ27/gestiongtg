import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FileCheck, User, X, UserPlus, Calendar, Eye, Check, Grid3x3, Send, Package, FileText, FilePlus, ChevronDown, ChevronUp, MapPin, MessageSquare, FileQuestion, FolderOpen, XCircle, Briefcase, Loader2, Upload, File, ExternalLink, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { createPageUrl } from "@/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
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
import DossierInfoStepForm from "../components/mandat/DossierInfoStepForm";

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

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": [
    "Québec",
    "Canton de Caron",
    "Canton de de l'Île",
    "Canton de Garnier",
    "Village d'Héberville",
    "Canton d'Hébertville-Station",
    "Canton de Labarre",
    "Canton de Mésy",
    "Canton de Métabetchouan",
    "Canton de Signay",
    "Canton de Taillon"
  ],
  "Lac-Saint-Jean-Ouest": [
    "Québec",
    "Canton d'Albanel",
    "Canton de Charlevoix",
    "Canton de Dablon",
    "Canton de Dalmas",
    "Canton de Demeules",
    "Canton de Dequen",
    "Canton de Dolbeau",
    "Canton de Girard",
    "Canton de Jogues",
    "Canton de Malherbe",
    "Canton de Métabetchouan",
    "Canton de Milot",
    "Canton de Normandin",
    "Canton de Ouiatchouan",
    "Canton de Racine",
    "Canton de Roberval",
    "Canton de Saint-Hilaire"
  ],
  "Chicoutimi": [
    "Québec",
    "Cité d'Arvida",
    "Canton de Bagot",
    "Village de Bagotville",
    "Canton de Bégin",
    "Canton de Boileau",
    "Canton de Bourget",
    "Canton de Chicoutimi",
    "Paroisse de Chicoutimi",
    "Ville de Chicoutimi",
    "Canton de Dumas",
    "Canton de Durocher",
    "Canton de Falardeau",
    "Canton de Ferland",
    "Ville de Grande-Baie",
    "Canton de Harvey",
    "Canton de Hébert",
    "Canton de Jonquière",
    "Canton de Kénogami",
    "Canton de Labrecque",
    "Canton de Laterrière",
    "Canton d'Otis",
    "Canton de Périgny",
    "Canton de Rouleau",
    "Canton de Simard",
    "Paroisse de Saint-Alexis",
    "Paroisse de Saint-Alphonse",
    "Ville de Sainte-Anne-de-Chicoutimi",
    "Canton de Saint-Germains",
    "Canton de Saint-Jean",
    "Canton de Taché",
    "Canton de Tremblay"
  ]
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

export default function PriseDeMandat() {
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
    cadastre: "",
    rang: "",
    concordances_anterieures: [],
    document_pdf_url: "",
  });
  const [uploadingLotPdf, setUploadingLotPdf] = useState(false);
  const [availableCadastresForNewLot, setAvailableCadastresForNewLot] = useState([]);
  const [commentairesTemporairesLot, setCommentairesTemporairesLot] = useState([]);
  const [sidebarTabLot, setSidebarTabLot] = useState("commentaires");
  const [editingLot, setEditingLot] = useState(null);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [lotConcordanceCollapsed, setLotConcordanceCollapsed] = useState(false);
  const [lotDocumentsCollapsed, setLotDocumentsCollapsed] = useState(false);
  const [currentConcordanceForm, setCurrentConcordanceForm] = useState({
    circonscription_fonciere: "",
    cadastre: "",
    numero_lot: "",
    rang: ""
  });
  const [availableCadastresForConcordance, setAvailableCadastresForConcordance] = useState([]);
  const [lotListSearchTerm, setLotListSearchTerm] = useState("");
  const [isAddMinuteDialogOpen, setIsAddMinuteDialogOpen] = useState(false);
  const [currentMinuteMandatIndex, setCurrentMinuteMandatIndex] = useState(null);
  const [newMinuteForm, setNewMinuteForm] = useState({
    minute: "",
    date_minute: "",
    type_minute: "Initiale"
  });

  // NEW STATES FOR DOSSIER REFERENCE
  const [dossierReferenceId, setDossierReferenceId] = useState(null);
  const [dossierSearchForReference, setDossierSearchForReference] = useState("");
  // END NEW STATES

  // NEW STATE FOR TEMPORARY COMMENTS
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  // END NEW STATE

  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [activeListTab, setActiveListTab] = useState("nouveau");
  const [filterVille, setFilterVille] = useState("all");
  const [filterTypeMandat, setFilterTypeMandat] = useState("all");
  const [filterUrgence, setFilterUrgence] = useState("all");
  const [filterUtilisateurAssigne, setFilterUtilisateurAssigne] = useState("all");
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
  const [mapCollapsedDossier, setMapCollapsedDossier] = useState(false);
  const [commentsCollapsedDossier, setCommentsCollapsedDossier] = useState(false);
  const [sidebarTabDossier, setSidebarTabDossier] = useState("commentaires");
  const [historiqueDossier, setHistoriqueDossier] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarCollapsedDossier, setSidebarCollapsedDossier] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [addressSearchTimeout, setAddressSearchTimeout] = useState(null);
  const [currentMandatIndexForAddress, setCurrentMandatIndexForAddress] = useState(null);
  const [sameAddressForAllMandats, setSameAddressForAllMandats] = useState(true);
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
        clients_ids: data.clients_ids,
        client_info: data.client_info,
        adresse_travaux: data.adresse_travaux,
        mandats: data.mandats,
        echeance_souhaitee: data.echeance_souhaitee,
        date_signature: data.date_signature,
        date_debut_travaux: data.date_debut_travaux,
        date_livraison: data.date_livraison,
        urgence_percue: data.urgence_percue,
        statut: data.statut,
        commentaires: commentsToSave
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
    
    // Utiliser le numéro de dossier existant si disponible, sinon calculer
    let numeroDossier = pm.numero_dossier || "";
    let dateOuverture = pm.date_ouverture || new Date().toISOString().split('T')[0];
    
    // Si pas de numéro de dossier existant et statut "Mandats à ouvrir", calculer automatiquement
    if (!numeroDossier && pm.statut === "Mandats à ouvrir" && pm.arpenteur_geometre) {
      numeroDossier = calculerProchainNumeroDossier(pm.arpenteur_geometre, pm.id);
    }
    
    // Remplir le formulaire avec les données existantes
    setFormData({
      ...formData,
      arpenteur_geometre: pm.arpenteur_geometre || "",
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
    mutationFn: async ({ id, data }) => {
      const commentsToSave = commentairesTemporaires.map(c => ({
        contenu: c.contenu,
        utilisateur_email: c.utilisateur_email,
        utilisateur_nom: c.utilisateur_nom,
        date: c.created_date || new Date().toISOString()
      }));

      const priseMandatData = {
        arpenteur_geometre: data.arpenteur_geometre,
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
        locked_by: null,
        locked_at: null
      };

      return await base44.entities.PriseMandat.update(id, priseMandatData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
      setIsDialogOpen(false);
      resetFullForm();
      setCommentairesTemporaires([]);
      setEditingPriseMandat(null);
      setIsLocked(false);
      setLockedBy("");
      setHasFormChanges(false);
      setInitialPriseMandatData(null);
    },
  });

  // Détecter les changements dans le formulaire
  useEffect(() => {
    if (initialPriseMandatData && editingPriseMandat) {
      const currentData = {
        arpenteur_geometre: formData.arpenteur_geometre,
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
      
      const hasChanges = JSON.stringify(currentData) !== JSON.stringify(initialData);
      setHasFormChanges(hasChanges);
    }
  }, [formData, clientInfo, professionnelInfo, workAddress, mandatsInfo, initialPriseMandatData, editingPriseMandat]);

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
        action: "Création du lot",
        entite: "Lot",
        entite_id: newLot.id,
        details: `Lot ${lotData.numero_lot} créé dans ${lotData.circonscription_fonciere}`,
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
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
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
  const applyFilters = (dossiersList) => {
    return dossiersList.filter(dossier => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        dossier.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        dossier.numero_dossier?.toLowerCase().includes(searchLower) || // Added numero_dossier to search
        dossier.clients_ids.some(id => {
          const client = getClientById(id);
          return client && `${client.prenom} ${client.nom}`.toLowerCase().includes(searchLower);
        }) ||
        dossier.mandats?.some(m =>
          m.type_mandat?.toLowerCase().includes(searchLower) ||
          formatAdresse(m.adresse_travaux)?.toLowerCase().includes(searchLower)
        )
      );

      const matchesArpenteur = filterArpenteur === "all" || dossier.arpenteur_geometre === filterArpenteur;

      let matchesUtilisateurAssigne;
      if (filterUtilisateurAssigne === "all") {
        matchesUtilisateurAssigne = true;
      } else if (filterUtilisateurAssigne === "non-assigne") {
        matchesUtilisateurAssigne = !dossier.utilisateur_assigne;
      } else {
        matchesUtilisateurAssigne = dossier.utilisateur_assigne === filterUtilisateurAssigne;
      }

      let matchesStatut = filterStatut === "all" || dossier.statut === filterStatut;
      if (filterStatut === "Nouveau mandat/Demande d'information") {
        matchesStatut = matchesStatut || dossier.statut === "Demande d'information" || dossier.statut === "Nouveau mandat";
      } else if (filterStatut === "Soumission") { // New condition to combine Soumission and Mandats à ouvrir
          matchesStatut = matchesStatut || dossier.statut === "Mandats à ouvrir";
      }

      return matchesSearch && matchesArpenteur && matchesStatut && matchesUtilisateurAssigne;
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

    // Créer le dossier SharePoint si statut "Mandats à ouvrir" et numéro de dossier attribué
    const createSharePointFolder = async () => {
      if (formData.statut === "Mandats à ouvrir" && formData.numero_dossier && formData.arpenteur_geometre) {
        try {
          await base44.functions.invoke('createSharePointFolder', {
            arpenteur_geometre: formData.arpenteur_geometre,
            numero_dossier: formData.numero_dossier
          });
        } catch (error) {
          console.error("Erreur création dossier SharePoint:", error);
          // Ne pas bloquer la sauvegarde si SharePoint échoue
        }
      }
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
      
      // Créer le dossier SharePoint si nouveau statut "Mandats à ouvrir"
      if (formData.statut === "Mandats à ouvrir" && editingPriseMandat.statut !== "Mandats à ouvrir") {
        createSharePointFolder();
      }
      
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
      
      // Créer le dossier SharePoint si statut "Mandats à ouvrir"
      if (formData.statut === "Mandats à ouvrir") {
        createSharePointFolder();
      }
      
      createPriseMandatMutation.mutate({ ...dataToSubmit, historique: creationHistorique });
    }
  };

  // handleNewClientSubmit removed, logic moved to ClientFormDialog

  // NEW FUNCTION
  const handleNewLotSubmit = async (e) => {
    e.preventDefault();
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
  };
  // END NEW FUNCTION

  const resetForm = () => {
    setFormData({
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
      cadastre: "",
      rang: "",
      concordances_anterieures: [],
      document_pdf_url: "",
    });
    setAvailableCadastresForNewLot([]);
    setCommentairesTemporairesLot([]);
    setEditingLot(null);
    setLotInfoCollapsed(false);
    setLotConcordanceCollapsed(false);
    setLotDocumentsCollapsed(false);
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

  // NEW FUNCTIONS
  const handleLotCirconscriptionChange = (value) => {
    setNewLotForm(prev => ({ ...prev, circonscription_fonciere: value, cadastre: "" })); // Reset cadastre when circonscription changes
    setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
  };

  const handleLotFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingLotPdf(true);
    try {
      const response = await base44.storage.upload({
        file: file,
        folder: "lots_documents",
      });
      setNewLotForm(prev => ({ ...prev, document_pdf_url: response.url }));
      alert("Fichier PDF téléchargé avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier:", error);
      alert("Échec du téléchargement du fichier PDF.");
    } finally {
      setUploadingLotPdf(false);
    }
  };
  
  const addConcordanceFromForm = () => {
    if (!currentConcordanceForm.numero_lot || !currentConcordanceForm.circonscription_fonciere) {
      alert("Veuillez remplir au minimum le numéro de lot et la circonscription foncière.");
      return;
    }
    
    setNewLotForm(prev => ({
      ...prev,
      concordances_anterieures: [
        ...(prev.concordances_anterieures || []),
        { ...currentConcordanceForm }
      ]
    }));
    
    // Reset form
    setCurrentConcordanceForm({
      circonscription_fonciere: "",
      cadastre: "",
      numero_lot: "",
      rang: ""
    });
    setAvailableCadastresForConcordance([]);
  };
  
  const removeConcordance = (index) => {
    setNewLotForm(prev => ({
      ...prev,
      concordances_anterieures: prev.concordances_anterieures.filter((_, i) => i !== index)
    }));
  };
  
  const handleConcordanceCirconscriptionChange = (value) => {
    setCurrentConcordanceForm(prev => ({ ...prev, circonscription_fonciere: value, cadastre: "" }));
    setAvailableCadastresForConcordance(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Prise de mandat
              </h1>
              <FilePlus className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion des prise de mandat</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={async (open) => {
            if (!open && hasFormChanges && !isLocked && !isOuvrirDossierDialogOpen) {
              setShowUnsavedWarning(true);
              return;
            }
            
            if (!open) {
              // Déverrouiller le mandat si on était en train de l'éditer
              if (editingPriseMandat && !isLocked) {
                await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                  ...editingPriseMandat,
                  locked_by: null,
                  locked_at: null
                });
                queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
              }
              
              setIsDialogOpen(false);
              resetFullForm();
              setIsLocked(false);
              setLockedBy("");
            } else {
              setIsDialogOpen(open);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                <Plus className="w-5 h-5 mr-2" />
                Nouveau mandat
              </Button>
            </DialogTrigger>
            <DialogContent className={`backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50 ${isOuvrirDossierDialogOpen ? '!invisible' : ''}`} hideClose>
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
                <div className="flex-1 flex overflow-hidden">
                  {/* Main form content - 70% */}
                  <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  {/* Bandeau de verrouillage */}
                  {isLocked && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-red-400 font-semibold">Mandat verrouillé</p>
                        <p className="text-slate-300 text-sm">Ce mandat est en cours de modification par <span className="text-red-400 font-medium">{lockedBy}</span></p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {editingPriseMandat ? "Modifier le mandat" : "Nouveau mandat"}
                      </h2>
                      {formData.statut === "Mandats à ouvrir" && formData.arpenteur_geometre && formData.numero_dossier && (
                        <p className="text-emerald-400 text-lg font-semibold mt-1">
                          {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
                          {(clientInfo.prenom || clientInfo.nom || (formData.clients_ids.length > 0 && getClientsNames(formData.clients_ids) !== "-")) && (
                            <span> - {clientInfo.prenom || clientInfo.nom 
                              ? `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim()
                              : getClientsNames(formData.clients_ids)}</span>
                          )}
                        </p>
                      )}
                    </div>
                    {formData.statut === "Mandats à ouvrir" && (
                      <Button
                        type="button"
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-2 border-purple-500 text-purple-300"
                        onClick={() => {
                          // Utiliser le numéro de dossier déjà attribué
                          const prochainNumero = formData.numero_dossier;
                          
                          setNouveauDossierForm({
                            numero_dossier: prochainNumero,
                            arpenteur_geometre: formData.arpenteur_geometre,
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
                              prix_premier_lot: m.prix_premier_lot || 0,
                              prix_autres_lots: m.prix_autres_lots || 0,
                              rabais: m.rabais || 0,
                              taxes_incluses: m.taxes_incluses || false,
                              date_signature: m.date_signature || "",
                              date_debut_travaux: m.date_debut_travaux || "",
                              date_livraison: m.date_livraison || "",
                              lots: [],
                              tache_actuelle: "Ouverture",
                              utilisateur_assigne: "",
                              minute: "",
                              date_minute: "",
                              type_minute: "Initiale",
                              minutes_list: [],
                              terrain: {
                                date_limite_leve: "",
                                instruments_requis: "",
                                a_rendez_vous: false,
                                date_rendez_vous: "",
                                heure_rendez_vous: "",
                                donneur: "",
                                technicien: "",
                                dossier_simultane: "",
                                temps_prevu: "",
                                notes: ""
                              },
                              factures: [],
                              notes: ""
                            }))
                          });
                          // Créer un commentaire récapitulatif avec les infos MANUELLES du mandat
                          let commentaireInfoMandat = "<h2 style='font-size: 1.31em;'><strong>📋 Informations du mandat</strong></h2>\n\n";
                          
                          // Vérifier si un texte saisi correspond à un professionnel sélectionné
                          const selectedClientsNames = formData.clients_ids.map(id => {
                            const c = clients.find(cl => cl.id === id);
                            return c ? `${c.prenom} ${c.nom}`.trim() : '';
                          });
                          const selectedNotairesNames = (formData.notaires_ids || []).map(id => {
                            const n = notaires.find(nt => nt.id === id);
                            return n ? `${n.prenom} ${n.nom}`.trim() : '';
                          });
                          const selectedCourtiersNames = (formData.courtiers_ids || []).map(id => {
                            const ct = courtiers.find(cr => cr.id === id);
                            return ct ? `${ct.prenom} ${ct.nom}`.trim() : '';
                          });
                          const compagnies = clients.filter(c => c.type_client === 'Compagnie');
                          const selectedCompagniesNames = (formData.compagnies_ids || []).map(id => {
                            const cp = compagnies.find(cmp => cmp.id === id);
                            return cp ? `${cp.prenom} ${cp.nom}`.trim() : '';
                          });
                          
                          // Client saisi manuellement (si différent des sélectionnés)
                          const clientSaisiManuel = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
                          if ((clientInfo.prenom || clientInfo.nom || clientInfo.telephone || clientInfo.courriel) && 
                              !selectedClientsNames.includes(clientSaisiManuel)) {
                            commentaireInfoMandat += `<strong><u>Client</u></strong>\n`;
                            if (clientInfo.prenom || clientInfo.nom) {
                              commentaireInfoMandat += clientSaisiManuel + "\n";
                            }
                            if (clientInfo.telephone) commentaireInfoMandat += `Tél (${clientInfo.type_telephone || 'Cellulaire'}): ${clientInfo.telephone}\n`;
                            if (clientInfo.courriel) commentaireInfoMandat += `Email: ${clientInfo.courriel}\n`;
                            commentaireInfoMandat += "\n";
                          }
                          
                          // Notaire saisi manuellement (si différent des sélectionnés)
                          if (professionnelInfo.notaire && !selectedNotairesNames.includes(professionnelInfo.notaire.trim())) {
                            commentaireInfoMandat += `<strong><u>Notaire</u></strong>\n`;
                            commentaireInfoMandat += `${professionnelInfo.notaire}\n\n`;
                          }
                          
                          // Courtier saisi manuellement (si différent des sélectionnés)
                          if (professionnelInfo.courtier && !selectedCourtiersNames.includes(professionnelInfo.courtier.trim())) {
                            commentaireInfoMandat += `<strong><u>Courtier immobilier</u></strong>\n`;
                            commentaireInfoMandat += `${professionnelInfo.courtier}\n\n`;
                          }
                          
                          // Compagnie saisie manuellement (si différente des sélectionnées)
                          if (professionnelInfo.compagnie && !selectedCompagniesNames.includes(professionnelInfo.compagnie.trim())) {
                            commentaireInfoMandat += `<strong><u>Compagnie</u></strong>\n`;
                            commentaireInfoMandat += `${professionnelInfo.compagnie}\n\n`;
                          }
                          
                          // Lots (saisis manuellement)
                          if (workAddress.numero_lot && workAddress.numero_lot.trim()) {
                            const lotsArray = workAddress.numero_lot.split('\n').filter(l => l.trim());
                            if (lotsArray.length > 0) {
                              commentaireInfoMandat += `<strong><u>Lots</u></strong>\n`;
                              lotsArray.forEach(lot => {
                                commentaireInfoMandat += `${lot.trim()}\n`;
                              });
                              commentaireInfoMandat += "\n";
                            }
                          }
                          
                          // Ajouter ce commentaire au début des commentaires temporaires s'il contient des infos MANUELLES
                          const hasManualInfo = (clientInfo.prenom || clientInfo.nom || clientInfo.telephone || clientInfo.courriel ||
                                                professionnelInfo.notaire || professionnelInfo.courtier || professionnelInfo.compagnie ||
                                                workAddress.numero_lot);
                          
                          const commentairesAvecInfo = hasManualInfo ? [
                            {
                              id: `info-mandat-${Date.now()}`,
                              contenu: commentaireInfoMandat,
                              utilisateur_email: user?.email || "",
                              utilisateur_nom: user?.full_name || "Système",
                              created_date: new Date().toISOString()
                            },
                            ...commentairesTemporaires
                          ] : commentairesTemporaires;
                          
                          setCommentairesTemporairesDossier(commentairesAvecInfo);
                          setHistoriqueDossier(historique);
                          setActiveTabMandatDossier("0");
                          setInfoDossierCollapsed(false);
                          setMandatStepCollapsed(false);
                          setIsOuvrirDossierDialogOpen(true);
                        }}
                      >
                        <FolderOpen className="w-5 h-5 mr-2" />
                        Ouvrir dossier
                      </Button>
                    )}
                  </div>
                  {formData.ttl === "Oui" && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg mb-6">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span className="text-indigo-400 font-semibold text-sm tracking-wide">TTL</span>
                    </div>
                  )}

                  <form id="dossier-form" onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault(); }} className="space-y-3">
                  {/* Section Informations du dossier - Toujours en haut */}
                  <DossierInfoStepForm
                    disabled={isLocked}
                    arpenteurGeometre={formData.arpenteur_geometre}
                    onArpenteurChange={(value) => {
                      if (isLocked) return;
                      if (formData.statut === "Mandats à ouvrir" && !editingPriseMandat?.numero_dossier) {
                        const prochainNumero = calculerProchainNumeroDossier(value, editingPriseMandat?.id);
                        setFormData({...formData, arpenteur_geometre: value, numero_dossier: prochainNumero});
                      } else {
                        setFormData({...formData, arpenteur_geometre: value});
                      }
                      setHasFormChanges(true);
                    }}
                    statut={formData.statut}
                    onStatutChange={(value) => {
                      if (isLocked) return;
                      // Si un numéro de dossier est inscrit et qu'on change de statut, demander confirmation
                      if (formData.numero_dossier && value !== formData.statut) {
                        setPendingStatutChange(value);
                        setShowStatutChangeConfirm(true);
                        return;
                      }
                      
                      if (value === "Mandats à ouvrir" && formData.arpenteur_geometre && !editingPriseMandat?.numero_dossier) {
                        const prochainNumero = calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id);
                        setFormData({...formData, statut: value, numero_dossier: prochainNumero});
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
                    isCollapsed={dossierInfoStepCollapsed}
                    onToggleCollapse={() => setDossierInfoStepCollapsed(!dossierInfoStepCollapsed)}
                  />

                  {/* Étape 1: Informations du client */}
                  <ClientStepForm
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
                  />

                  {/* Étape 2: Professionnel */}
                  <ProfessionnelStepForm
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
                  />

                  {/* Étape 3: Adresse des travaux */}
                  <AddressStepForm
                    disabled={isLocked}
                    address={workAddress}
                    onAddressChange={(addr) => {
                      if (isLocked) return;
                      setWorkAddress(addr);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={addressStepCollapsed}
                    onToggleCollapse={() => setAddressStepCollapsed(!addressStepCollapsed)}
                    clientDossiers={dossiers.filter(d => 
                      formData.clients_ids.length > 0 && 
                      formData.clients_ids.some(clientId => d.clients_ids?.includes(clientId))
                    )}
                    allLots={lots}
                    onSelectExistingAddress={(addr, mandatLots) => {
                      if (addr) {
                        // Récupérer les numéros de lots depuis l'entité Lot
                        let lotNumbers = "";
                        if (mandatLots && mandatLots.length > 0) {
                          const lotNumeros = mandatLots.map(lotId => {
                            // Chercher le lot dans la liste des lots chargés
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
                  />

                  {/* Étape 4: Mandats */}
                  <MandatStepForm
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
                  />

                  {/* Étape 5: Tarification */}
                  <TarificationStepForm
                    disabled={isLocked}
                    mandats={mandatsInfo}
                    onTarificationChange={(newMandats) => {
                      if (isLocked) return;
                      setMandatsInfo(newMandats);
                      setHasFormChanges(true);
                    }}
                    isCollapsed={tarificationStepCollapsed}
                    onToggleCollapse={() => setTarificationStepCollapsed(!tarificationStepCollapsed)}
                  />

                  {/* Étape 6: Documents - Visible uniquement si statut "Mandats à ouvrir" et numéro de dossier existe */}
                  {formData.statut === "Mandats à ouvrir" && formData.numero_dossier && formData.arpenteur_geometre && (
                    <DocumentsStepForm
                      arpenteurGeometre={formData.arpenteur_geometre}
                      numeroDossier={formData.numero_dossier}
                      isCollapsed={documentsStepCollapsed}
                      onToggleCollapse={() => setDocumentsStepCollapsed(!documentsStepCollapsed)}
                      onDocumentsChange={setHasDocuments}
                    />
                  )}

                </form>
                  </div>

                  {/* Sidebar - 30% */}
                  <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
                  {/* Carte de l'adresse des travaux - Collapsible */}
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
                  {!mapCollapsed && (workAddress.rue || workAddress.ville) && (
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
                      <CommentairesSection
                        dossierId={editingDossier?.id}
                        dossierTemporaire={!editingDossier}
                        commentairesTemp={commentairesTemporaires}
                        onCommentairesTempChange={setCommentairesTemporaires}
                      />
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

                {/* Boutons Annuler/Créer tout en bas - pleine largeur */}
                <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                  <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={async () => {
                    if (hasFormChanges && !isLocked) {
                      setShowUnsavedWarning(true);
                      return;
                    }
                    
                    // Déverrouiller le mandat si on annule
                    if (editingPriseMandat && !isLocked) {
                      await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                        ...editingPriseMandat,
                        locked_by: null,
                        locked_at: null
                      });
                      queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                    }
                    setIsDialogOpen(false);
                    resetFullForm();
                    setIsLocked(false);
                    setLockedBy("");
                  }}>
                    Annuler
                  </Button>
                  {!isLocked && (
                    <Button type="submit" form="dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      {editingPriseMandat ? "Modifier" : "Créer"}
                    </Button>
                  )}
                </div>
              </motion.div>
            </DialogContent>
          </Dialog>

          {/* Dialog pour ouvrir un dossier - Formulaire complet comme dans Dossiers */}
          <Dialog open={isOuvrirDossierDialogOpen} onOpenChange={(open) => {
            if (!open) {
              // Vérifier si des modifications ont été faites par rapport à l'état initial
              const initialMandats = mandatsInfo.filter(m => m.type_mandat).map(m => ({
                type_mandat: m.type_mandat,
                date_livraison: m.date_livraison || ""
              }));
              const currentMandats = nouveauDossierForm.mandats.map(m => ({
                type_mandat: m.type_mandat,
                date_livraison: m.date_livraison || ""
              }));
              
              const hasChanges = nouveauDossierForm.numero_dossier || 
                JSON.stringify(nouveauDossierForm.clients_ids) !== JSON.stringify(formData.clients_ids) ||
                nouveauDossierForm.notaires_ids.length > 0 ||
                nouveauDossierForm.courtiers_ids.length > 0 ||
                nouveauDossierForm.mandats.some(m => m.utilisateur_assigne) ||
                JSON.stringify(currentMandats) !== JSON.stringify(initialMandats) ||
                commentairesTemporairesDossier.length !== commentairesTemporaires.length ||
                dossierDocuments.length > 0;
              
              if (hasChanges) {
                setShowCancelConfirmDossier(true);
              } else {
                setIsOuvrirDossierDialogOpen(false);
                setNouveauDossierForm({
                  numero_dossier: "",
                  arpenteur_geometre: "",
                  date_ouverture: new Date().toISOString().split('T')[0],
                  statut: "Ouvert",
                  ttl: "Non",
                  clients_ids: [],
                  notaires_ids: [],
                  courtiers_ids: [],
                  mandats: []
                });
                setCommentairesTemporairesDossier([]);
                setDossierDocuments([]);
                setActiveTabMandatDossier("0");
              }
            } else {
              setIsOuvrirDossierDialogOpen(open);
            }
          }}>
            <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">Nouveau dossier</DialogTitle>
              </DialogHeader>
              <motion.div 
                className="flex flex-col h-[90vh]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex-1 flex overflow-hidden">
                  <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Nouveau dossier</h2>
                  </div>
                  <form id="nouveau-dossier-form" onSubmit={async (e) => {
                    e.preventDefault();
                    
                    // Vérifier que le numéro de dossier n'existe pas déjà
                    const dossierExistant = dossiers.find(d => 
                      d.numero_dossier === nouveauDossierForm.numero_dossier &&
                      d.arpenteur_geometre === nouveauDossierForm.arpenteur_geometre
                    );
                    
                    if (dossierExistant) {
                      alert(`Le numéro de dossier ${nouveauDossierForm.numero_dossier} existe déjà pour ${nouveauDossierForm.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
                      return;
                    }

                    // Validation : au moins un mandat doit exister
                    if (nouveauDossierForm.mandats.length === 0) {
                      alert("Vous devez ajouter au moins un mandat avant d'ouvrir un dossier.");
                      return;
                    }

                    // Validation : tous les mandats doivent avoir un utilisateur assigné
                    const mandatsSansUtilisateur = nouveauDossierForm.mandats.filter(m => !m.utilisateur_assigne);
                    if (mandatsSansUtilisateur.length > 0) {
                      setShowMissingUserWarning(true);
                      return;
                    }

                    try {
                      // Créer un commentaire récapitulatif avec les infos MANUELLES du dossier
                      let infoCommentaire = "<h2 style='font-size: 1.31em;'><strong>📋 Informations du mandat</strong></h2>\n\n";
                      let hasAnyManualInfo = false;
                      
                      // Vérifier si un texte saisi correspond à un professionnel sélectionné
                      const selectedClientsNames = nouveauDossierForm.clients_ids.map(id => {
                        const c = clients.find(cl => cl.id === id);
                        return c ? `${c.prenom} ${c.nom}`.trim() : '';
                      });
                      const selectedNotairesNames = nouveauDossierForm.notaires_ids.map(id => {
                        const n = notaires.find(nt => nt.id === id);
                        return n ? `${n.prenom} ${n.nom}`.trim() : '';
                      });
                      const selectedCourtiersNames = nouveauDossierForm.courtiers_ids.map(id => {
                        const ct = courtiers.find(cr => cr.id === id);
                        return ct ? `${ct.prenom} ${ct.nom}`.trim() : '';
                      });
                      const compagnies = clients.filter(c => c.type_client === 'Compagnie');
                      const selectedCompagniesNames = (nouveauDossierForm.compagnies_ids || []).map(id => {
                        const cp = compagnies.find(cmp => cmp.id === id);
                        return cp ? `${cp.prenom} ${cp.nom}`.trim() : '';
                      });
                      
                      // Client saisi manuellement (si différent des sélectionnés)
                      const clientSaisiManuel = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
                      if ((clientInfo.prenom || clientInfo.nom || clientInfo.telephone || clientInfo.courriel) && 
                          !selectedClientsNames.includes(clientSaisiManuel)) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Client</u></strong>\n`;
                        if (clientInfo.prenom || clientInfo.nom) {
                          infoCommentaire += clientSaisiManuel + "\n";
                        }
                        if (clientInfo.telephone) infoCommentaire += `Tél (${clientInfo.type_telephone || 'Cellulaire'}): ${clientInfo.telephone}\n`;
                        if (clientInfo.courriel) infoCommentaire += `Email: ${clientInfo.courriel}\n`;
                        infoCommentaire += "\n";
                      }
                      
                      // Notaire saisi manuellement (si différent des sélectionnés)
                      if (professionnelInfo.notaire && !selectedNotairesNames.includes(professionnelInfo.notaire.trim())) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Notaire</u></strong>\n`;
                        infoCommentaire += `${professionnelInfo.notaire}\n\n`;
                      }
                      
                      // Courtier saisi manuellement (si différent des sélectionnés)
                      if (professionnelInfo.courtier && !selectedCourtiersNames.includes(professionnelInfo.courtier.trim())) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Courtier immobilier</u></strong>\n`;
                        infoCommentaire += `${professionnelInfo.courtier}\n\n`;
                      }
                      
                      // Compagnie saisie manuellement (si différente des sélectionnées)
                      if (professionnelInfo.compagnie && !selectedCompagniesNames.includes(professionnelInfo.compagnie.trim())) {
                        hasAnyManualInfo = true;
                        infoCommentaire += `<strong><u>Compagnie</u></strong>\n`;
                        infoCommentaire += `${professionnelInfo.compagnie}\n\n`;
                      }
                      
                      // Lots (saisis manuellement dans workAddress.numero_lot)
                      if (workAddress.numero_lot && workAddress.numero_lot.trim()) {
                        const lotsArray = workAddress.numero_lot.split('\n').filter(l => l.trim());
                        if (lotsArray.length > 0) {
                          hasAnyManualInfo = true;
                          infoCommentaire += `<strong><u>Lots</u></strong>\n`;
                          lotsArray.forEach(lot => {
                            infoCommentaire += `${lot.trim()}\n`;
                          });
                          infoCommentaire += "\n";
                        }
                      }
                      
                      // Préparer les commentaires finaux - ajouter le commentaire récapitulatif seulement s'il y a des infos manuelles
                      let commentairesFinaux = [...commentairesTemporairesDossier];
                      if (hasAnyManualInfo) {
                        const commentaireInfos = {
                          contenu: infoCommentaire,
                          utilisateur_email: user?.email || "",
                          utilisateur_nom: user?.full_name || "Système",
                          created_date: new Date().toISOString()
                        };
                        commentairesFinaux = [commentaireInfos, ...commentairesTemporairesDossier];
                      }
                      
                      console.log("Commentaire à créer:", infoCommentaire);
                      console.log("Commentaires finaux:", commentairesFinaux);
                      
                      await createDossierMutation.mutateAsync({ 
                        dossierData: nouveauDossierForm,
                        commentairesToCreate: commentairesFinaux
                      });
                      
                      // Supprimer la prise de mandat si elle existe
                      if (editingPriseMandat?.id) {
                        await deletePriseMandatMutation.mutateAsync(editingPriseMandat.id);
                      }
                      
                      setIsOuvrirDossierDialogOpen(false);
                      setIsDialogOpen(false);
                      resetFullForm();
                      setCommentairesTemporairesDossier([]);
                      alert(`Dossier ${getArpenteurInitials(nouveauDossierForm.arpenteur_geometre)}${nouveauDossierForm.numero_dossier} créé avec succès !`);
                    } catch (error) {
                      console.error("Erreur lors de la création du dossier:", error);
                      alert("Erreur lors de la création du dossier.");
                    }
                  }} className="space-y-3">
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
                              {nouveauDossierForm.numero_dossier && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  {getArpenteurInitials(nouveauDossierForm.arpenteur_geometre)}{nouveauDossierForm.numero_dossier}
                                </Badge>
                              )}
                            </div>
                            {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                          </div>
                        </CardHeader>

                        {!infoDossierCollapsed && (
                          <CardContent className="pt-2 pb-3 space-y-3">
                           {/* Informations de base */}
                           <div className="grid grid-cols-3 gap-2">
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                               <Select value={nouveauDossierForm.arpenteur_geometre} onValueChange={(value) => setNouveauDossierForm({...nouveauDossierForm, arpenteur_geometre: value})}>
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
                               <Label className="text-slate-400 text-xs">N° de dossier <span className="text-red-400">*</span></Label>
                               <Input value={nouveauDossierForm.numero_dossier} onChange={(e) => setNouveauDossierForm({...nouveauDossierForm, numero_dossier: e.target.value})} required placeholder="Ex: 2024-001" className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                             </div>
                             <div className="space-y-1">
                               <Label className="text-slate-400 text-xs">Date d'ouverture <span className="text-red-400">*</span></Label>
                               <Input type="date" value={nouveauDossierForm.date_ouverture} onChange={(e) => setNouveauDossierForm({...nouveauDossierForm, date_ouverture: e.target.value})} required className="bg-slate-700 border-slate-600 text-white h-7 text-sm" />
                             </div>
                           </div>



                            {/* Tabs Clients/Notaires/Courtiers */}
                            <Tabs value={activeContactTab} onValueChange={setActiveContactTab} className="w-full">
                              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 h-7">
                                <TabsTrigger value="clients" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Clients {nouveauDossierForm.clients_ids.length > 0 && `(${nouveauDossierForm.clients_ids.length})`}
                                </TabsTrigger>
                                <TabsTrigger value="notaires" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  Notaires {nouveauDossierForm.notaires_ids.length > 0 && `(${nouveauDossierForm.notaires_ids.length})`}
                                </TabsTrigger>
                                <TabsTrigger value="courtiers" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  Courtiers {nouveauDossierForm.courtiers_ids.length > 0 && `(${nouveauDossierForm.courtiers_ids.length})`}
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="clients" className="mt-2">
                                <div className="space-y-1">
                                  <Button type="button" size="sm" onClick={() => {
                                    setClientsTabExpanded(!clientsTabExpanded);
                                    if (!clientsTabExpanded) {
                                      setNotairesTabExpanded(false);
                                      setCourtiersTabExpanded(false);
                                    }
                                  }} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 w-full h-6 text-xs">
                                    {clientsTabExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
                                    {clientsTabExpanded ? 'Masquer' : 'Ajouter'}
                                  </Button>
                                  {clientsTabExpanded && (
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                      <div className="flex gap-2 mb-2">
                                        <div className="relative flex-1">
                                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                          <Input
                                            placeholder="Rechercher..."
                                            value={clientSearchTerm}
                                            onChange={(e) => setClientSearchTerm(e.target.value)}
                                            className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                          />
                                        </div>
                                        <Button
                                         type="button"
                                         size="sm"
                                         onClick={() => {
                                           setEditingClientForForm(null);
                                           setClientTypeForForm("Client");
                                           setIsClientFormDialogOpen(true);
                                         }}
                                         className="text-blue-400 hover:text-blue-300 h-6 text-xs px-2"
                                        >
                                         <Plus className="w-3 h-3 mr-1" />
                                         Nouveau
                                        </Button>
                                      </div>
                                      {filteredClientsForSelector.slice(0, 20).map((client) => (
                                        <div
                                          key={client.id}
                                          className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                                            nouveauDossierForm.clients_ids.includes(client.id)
                                              ? 'bg-blue-500/20 border border-blue-500/30'
                                              : 'bg-slate-700/50 hover:bg-slate-700'
                                          }`}
                                          onClick={() => {
                                            setNouveauDossierForm(prev => ({
                                              ...prev,
                                              clients_ids: prev.clients_ids.includes(client.id)
                                                ? prev.clients_ids.filter(id => id !== client.id)
                                                : [...prev.clients_ids, client.id]
                                            }));
                                          }}
                                        >
                                          <p className="font-medium text-white">{client.prenom} {client.nom}</p>
                                          <div className="text-[10px] text-slate-400 space-y-0.5 mt-1">
                                            {client.adresses?.find(a => a.actuelle) && formatAdresse(client.adresses.find(a => a.actuelle)) && (
                                              <p className="truncate">📍 {formatAdresse(client.adresses.find(a => a.actuelle))}</p>
                                            )}
                                            {client.courriels?.find(c => c.actuel)?.courriel && (
                                              <p className="truncate">✉️ {client.courriels.find(c => c.actuel).courriel}</p>
                                            )}
                                            {client.telephones?.find(t => t.actuel)?.telephone && (
                                              <p>
                                                📞 <a 
                                                  href={`tel:${client.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                >
                                                  {client.telephones.find(t => t.actuel).telephone}
                                                </a>
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {nouveauDossierForm.clients_ids.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-800/30 rounded-lg max-h-[200px] overflow-y-auto">
                                      {nouveauDossierForm.clients_ids.map((clientId) => {
                                        const client = getClientById(clientId);
                                        return client ? (
                                          <div 
                                            key={clientId} 
                                            className="bg-blue-500/20 text-blue-400 border border-blue-500/30 relative p-2 rounded-lg cursor-pointer hover:bg-blue-500/30 transition-colors"
                                            onClick={() => {
                                              if (window.openClientForEdit) {
                                                window.openClientForEdit(client);
                                              }
                                            }}
                                          >
                                            <button type="button" onClick={(e) => {
                                              e.stopPropagation();
                                              setNouveauDossierForm(prev => ({...prev, clients_ids: prev.clients_ids.filter(id => id !== clientId)}));
                                            }} className="absolute right-1 top-1 hover:text-red-400">
                                              <X className="w-3 h-3" />
                                            </button>
                                            <p className="text-xs font-medium pr-4">{client.prenom} {client.nom}</p>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 text-xs text-center py-4 bg-slate-800/30 rounded-lg">Aucun client</p>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="notaires" className="mt-2">
                                <div className="space-y-1">
                                  <Button type="button" size="sm" onClick={() => {
                                    setNotairesTabExpanded(!notairesTabExpanded);
                                    if (!notairesTabExpanded) {
                                      setClientsTabExpanded(false);
                                      setCourtiersTabExpanded(false);
                                    }
                                  }} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 w-full h-6 text-xs">
                                    {notairesTabExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
                                    {notairesTabExpanded ? 'Masquer' : 'Ajouter'}
                                  </Button>
                                  {notairesTabExpanded && (
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                      <div className="flex gap-2 mb-2">
                                        <div className="relative flex-1">
                                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                          <Input
                                            placeholder="Rechercher..."
                                            value={notaireSearchTerm}
                                            onChange={(e) => setNotaireSearchTerm(e.target.value)}
                                            className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                          />
                                        </div>
                                        <Button
                                         type="button"
                                         size="sm"
                                         onClick={() => {
                                           setEditingClientForForm(null);
                                           setClientTypeForForm("Notaire");
                                           setIsClientFormDialogOpen(true);
                                         }}
                                         className="text-blue-400 hover:text-blue-300 h-6 text-xs px-2"
                                        >
                                         <Plus className="w-3 h-3 mr-1" />
                                         Nouveau
                                        </Button>
                                      </div>
                                      {filteredNotairesForSelector.slice(0, 20).map((notaire) => (
                                        <div
                                         key={notaire.id}
                                         className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                                           nouveauDossierForm.notaires_ids.includes(notaire.id)
                                             ? 'bg-blue-500/20 border border-blue-500/30'
                                             : 'bg-slate-700/50 hover:bg-slate-700'
                                         }`}
                                          onClick={() => {
                                            setNouveauDossierForm(prev => ({
                                              ...prev,
                                              notaires_ids: prev.notaires_ids.includes(notaire.id)
                                                ? prev.notaires_ids.filter(id => id !== notaire.id)
                                                : [...prev.notaires_ids, notaire.id]
                                            }));
                                          }}
                                        >
                                          <p className="font-medium text-white">{notaire.prenom} {notaire.nom}</p>
                                          <div className="text-[10px] text-slate-400 space-y-0.5 mt-1">
                                            {notaire.adresses?.find(a => a.actuelle) && formatAdresse(notaire.adresses.find(a => a.actuelle)) && (
                                              <p className="truncate">📍 {formatAdresse(notaire.adresses.find(a => a.actuelle))}</p>
                                            )}
                                            {notaire.courriels?.find(c => c.actuel)?.courriel && (
                                              <p className="truncate">✉️ {notaire.courriels.find(c => c.actuel).courriel}</p>
                                            )}
                                            {notaire.telephones?.find(t => t.actuel)?.telephone && (
                                              <p>
                                                📞 <a 
                                                  href={`tel:${notaire.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                >
                                                  {notaire.telephones.find(t => t.actuel).telephone}
                                                </a>
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {nouveauDossierForm.notaires_ids.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-800/30 rounded-lg max-h-[200px] overflow-y-auto">
                                      {nouveauDossierForm.notaires_ids.map((notaireId) => {
                                        const notaire = getClientById(notaireId);
                                        return notaire ? (
                                          <div 
                                           key={notaireId} 
                                           className="bg-blue-500/20 text-blue-400 border border-blue-500/30 relative p-2 rounded-lg cursor-pointer hover:bg-blue-500/30 transition-colors"
                                            onClick={() => {
                                              if (window.openClientForEdit) {
                                                window.openClientForEdit(notaire);
                                              }
                                            }}
                                          >
                                            <button type="button" onClick={(e) => {
                                              e.stopPropagation();
                                              setNouveauDossierForm(prev => ({...prev, notaires_ids: prev.notaires_ids.filter(id => id !== notaireId)}));
                                            }} className="absolute right-1 top-1 hover:text-red-400">
                                              <X className="w-3 h-3" />
                                            </button>
                                            <p className="text-xs font-medium pr-4">{notaire.prenom} {notaire.nom}</p>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 text-xs text-center py-4 bg-slate-800/30 rounded-lg">Aucun notaire</p>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="courtiers" className="mt-2">
                                <div className="space-y-1">
                                  <Button type="button" size="sm" onClick={() => {
                                    setCourtiersTabExpanded(!courtiersTabExpanded);
                                    if (!courtiersTabExpanded) {
                                      setClientsTabExpanded(false);
                                      setNotairesTabExpanded(false);
                                    }
                                  }} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 w-full h-6 text-xs">
                                    {courtiersTabExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <UserPlus className="w-3 h-3 mr-1" />}
                                    {courtiersTabExpanded ? 'Masquer' : 'Ajouter'}
                                  </Button>
                                  {courtiersTabExpanded && (
                                    <div className="max-h-[200px] overflow-y-auto space-y-1 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                                      <div className="flex gap-2 mb-2">
                                        <div className="relative flex-1">
                                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                                          <Input
                                            placeholder="Rechercher..."
                                            value={courtierSearchTerm}
                                            onChange={(e) => setCourtierSearchTerm(e.target.value)}
                                            className="pl-7 bg-slate-700 border-slate-600 h-6 text-xs"
                                          />
                                        </div>
                                        <Button
                                         type="button"
                                         size="sm"
                                         onClick={() => {
                                           setEditingClientForForm(null);
                                           setClientTypeForForm("Courtier immobilier");
                                           setIsClientFormDialogOpen(true);
                                         }}
                                         className="text-blue-400 hover:text-blue-300 h-6 text-xs px-2"
                                        >
                                         <Plus className="w-3 h-3 mr-1" />
                                         Nouveau
                                        </Button>
                                      </div>
                                      {filteredCourtiersForSelector.slice(0, 20).map((courtier) => (
                                        <div
                                         key={courtier.id}
                                         className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                                           nouveauDossierForm.courtiers_ids.includes(courtier.id)
                                             ? 'bg-blue-500/20 border border-blue-500/30'
                                             : 'bg-slate-700/50 hover:bg-slate-700'
                                         }`}
                                          onClick={() => {
                                            setNouveauDossierForm(prev => ({
                                              ...prev,
                                              courtiers_ids: prev.courtiers_ids.includes(courtier.id)
                                                ? prev.courtiers_ids.filter(id => id !== courtier.id)
                                                : [...prev.courtiers_ids, courtier.id]
                                            }));
                                          }}
                                        >
                                          <p className="font-medium text-white">{courtier.prenom} {courtier.nom}</p>
                                          <div className="text-[10px] text-slate-400 space-y-0.5 mt-1">
                                            {courtier.adresses?.find(a => a.actuelle) && formatAdresse(courtier.adresses.find(a => a.actuelle)) && (
                                              <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle))}</p>
                                            )}
                                            {courtier.courriels?.find(c => c.actuel)?.courriel && (
                                              <p className="truncate">✉️ {courtier.courriels.find(c => c.actuel).courriel}</p>
                                            )}
                                            {courtier.telephones?.find(t => t.actuel)?.telephone && (
                                              <p>
                                                📞 <a 
                                                  href={`tel:${courtier.telephones.find(t => t.actuel).telephone.replace(/\D/g, '')}`}
                                                  className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                                                >
                                                  {courtier.telephones.find(t => t.actuel).telephone}
                                                </a>
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {nouveauDossierForm.courtiers_ids.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 p-2 bg-slate-800/30 rounded-lg max-h-[200px] overflow-y-auto">
                                      {nouveauDossierForm.courtiers_ids.map((courtierId) => {
                                        const courtier = getClientById(courtierId);
                                        return courtier ? (
                                          <div 
                                           key={courtierId} 
                                           className="bg-blue-500/20 text-blue-400 border border-blue-500/30 relative p-2 rounded-lg cursor-pointer hover:bg-blue-500/30 transition-colors"
                                            onClick={() => {
                                              if (window.openClientForEdit) {
                                                window.openClientForEdit(courtier);
                                              }
                                            }}
                                          >
                                            <button type="button" onClick={(e) => {
                                              e.stopPropagation();
                                              setNouveauDossierForm(prev => ({...prev, courtiers_ids: prev.courtiers_ids.filter(id => id !== courtierId)}));
                                            }} className="absolute right-1 top-1 hover:text-red-400">
                                              <X className="w-3 h-3" />
                                            </button>
                                            <p className="text-xs font-medium pr-4">{courtier.prenom} {courtier.nom}</p>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 text-xs text-center py-4 bg-slate-800/30 rounded-lg">Aucun courtier</p>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
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
                              {nouveauDossierForm.mandats.length > 0 && (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                  {nouveauDossierForm.mandats.length} mandat{nouveauDossierForm.mandats.length > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            {mandatStepCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                          </div>
                        </CardHeader>

                        {!mandatStepCollapsed && (
                          <CardContent className="pt-2 pb-3">
                            <div className="flex justify-end mb-2 gap-1">
                              {nouveauDossierForm.mandats.length > 1 && (
                                <Button 
                                  type="button" 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                   const indexToRemove = parseInt(activeTabMandatDossier);
                                   setMandatIndexToDelete(indexToRemove);
                                   setShowDeleteMandatConfirm(true);
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                              <Button type="button" size="sm" onClick={() => {
                          const newIndex = nouveauDossierForm.mandats.length;
                          const firstMandat = nouveauDossierForm.mandats[0];
                          const defaultAdresse = sameAddressForAllMandats && firstMandat?.adresse_travaux ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "QC" };
                          const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];
                          
                          setNouveauDossierForm(prev => ({
                            ...prev,
                            mandats: [...prev.mandats, {
                              type_mandat: "",
                              date_ouverture: "",
                              minute: "",
                              date_minute: "",
                              type_minute: "Initiale",
                              minutes_list: [],
                              tache_actuelle: "",
                              statut_terrain: "",
                              adresse_travaux: defaultAdresse,
                              lots: defaultLots,
                              prix_estime: 0,
                              rabais: 0,
                              taxes_incluses: false,
                              date_livraison: "",
                              date_signature: "",
                              date_debut_travaux: "",
                              terrain: {
                                date_limite_leve: "",
                                instruments_requis: "",
                                a_rendez_vous: false,
                                date_rendez_vous: "",
                                heure_rendez_vous: "",
                                donneur: "",
                                technicien: "",
                                dossier_simultane: "",
                                temps_prevu: "",
                                notes: ""
                              },
                              factures: [],
                              notes: "",
                              utilisateur_assigne: ""
                            }]
                          }));
                          setActiveTabMandatDossier(newIndex.toString());
                              }} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 h-6 text-xs">
                                <Plus className="w-3 h-3 mr-1" />
                                Ajouter
                              </Button>
                            </div>

                            {nouveauDossierForm.mandats.length > 0 ? (
                              <Tabs value={activeTabMandatDossier} onValueChange={setActiveTabMandatDossier} className="w-full">
                                <TabsList className="bg-slate-800/30 border border-slate-700 w-full h-auto justify-start p-1 rounded-lg">
                                  {nouveauDossierForm.mandats.map((mandat, index) => (
                                    <TabsTrigger
                                      key={index}
                                      value={index.toString()}
                                      className="orange data-[state=active]:bg-orange-500/30 data-[state=active]:text-orange-300 data-[state=active]:border-b-2 data-[state=active]:border-orange-300 text-slate-300 px-3 py-1 text-xs font-medium rounded-md transition-all"
                                    >
                                      {mandat.type_mandat || `Mandat ${index + 1}`}
                                    </TabsTrigger>
                                  ))}
                                </TabsList>

                                {nouveauDossierForm.mandats.map((mandat, index) => (
                                  <TabsContent key={index} value={index.toString()} className="mt-2 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-slate-400 text-xs">Type de mandat</Label>
                                        <Select value={mandat.type_mandat} onValueChange={(value) => {
                                          setNouveauDossierForm(prev => ({
                                            ...prev,
                                            mandats: prev.mandats.map((m, i) => i === index ? { ...m, type_mandat: value } : m)
                                          }));
                                        }}>
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
                                        <Label className="text-slate-400 text-xs">Utilisateur assigné <span className="text-red-400">*</span></Label>
                                        <Select value={mandat.utilisateur_assigne} onValueChange={(value) => {
                                          setNouveauDossierForm(prev => ({
                                            ...prev,
                                            mandats: prev.mandats.map((m, i) => i === index ? { ...m, utilisateur_assigne: value } : m)
                                          }));
                                        }}>
                                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                                            <SelectValue placeholder="Sélectionner" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-700">
                                            {users.map((u) => (
                                              <SelectItem key={u.email} value={u.email} className="text-white text-xs">{u.full_name}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    
                                    {/* Ligne délimitative */}
                                    <div className="border-t border-slate-600 my-2"></div>
                                    
                                    {/* Barre de recherche d'adresse */}
                                    <div className="relative mb-2">
                                       <div className="flex gap-1 relative">
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
                                           className="bg-slate-700 border-slate-600 text-white h-6 text-xs flex-1 pl-7"
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
                                                   setNouveauDossierForm(prev => ({
                                                     ...prev,
                                                     mandats: prev.mandats.map(m => ({
                                                       ...m,
                                                       adresse_travaux: JSON.parse(JSON.stringify(newAddress))
                                                     }))
                                                   }));
                                                 } else {
                                                   setNouveauDossierForm(prev => ({
                                                     ...prev,
                                                     mandats: prev.mandats.map((m, i) => i === currentMandatIndexForAddress ? {
                                                       ...m,
                                                       adresse_travaux: newAddress
                                                     } : m)
                                                   }));
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
                                     </div>

                    {/* Grille Adresse et Dates */}
                                     <div className="grid grid-cols-2 gap-2">
                                       {/* Colonne Adresse - 50% */}
                                       <div className="space-y-1">
                                         <Label className="text-slate-500 text-[10px]">Adresse des travaux</Label>
                                         {/* N° civique et Rue */}
                                         <div className="grid grid-cols-[100px_1fr] gap-1">
                                           <Input 
                                             placeholder="N° civique" 
                                             value={mandat.adresse_travaux?.numeros_civiques?.[0] || ""} 
                                             onChange={(e) => {
                                               const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                 ...m, 
                                                 adresse_travaux: { ...m.adresse_travaux, numeros_civiques: [e.target.value] } 
                                               } : m;
                                               setNouveauDossierForm(prev => ({
                                                 ...prev,
                                                 mandats: prev.mandats.map(updateAddress)
                                               }));
                                             }}
                                             className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                           />
                                           <Input 
                                             placeholder="Rue" 
                                             value={mandat.adresse_travaux?.rue || ""} 
                                             onChange={(e) => {
                                               const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                 ...m, 
                                                 adresse_travaux: { ...m.adresse_travaux, rue: e.target.value } 
                                               } : m;
                                               setNouveauDossierForm(prev => ({
                                                 ...prev,
                                                 mandats: prev.mandats.map(updateAddress)
                                               }));
                                             }}
                                             className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                           />
                                         </div>
                                         {/* Ville, Code postal et Province */}
                                         <div className="grid grid-cols-3 gap-1">
                                           <Input 
                                             placeholder="Ville" 
                                             value={mandat.adresse_travaux?.ville || ""} 
                                             onChange={(e) => {
                                               const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                 ...m, 
                                                 adresse_travaux: { ...m.adresse_travaux, ville: e.target.value } 
                                               } : m;
                                               setNouveauDossierForm(prev => ({
                                                 ...prev,
                                                 mandats: prev.mandats.map(updateAddress)
                                               }));
                                             }}
                                             className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                           />
                                           <Input 
                                             placeholder="Code postal" 
                                             value={mandat.adresse_travaux?.code_postal || ""} 
                                             onChange={(e) => {
                                               const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                 ...m, 
                                                 adresse_travaux: { ...m.adresse_travaux, code_postal: e.target.value } 
                                               } : m;
                                               setNouveauDossierForm(prev => ({
                                                 ...prev,
                                                 mandats: prev.mandats.map(updateAddress)
                                               }));
                                             }}
                                             className="bg-slate-700 border-slate-600 text-white h-6 text-xs"
                                           />
                                           <Select 
                                             value={mandat.adresse_travaux?.province || "QC"} 
                                             onValueChange={(value) => {
                                               const updateAddress = (m, i) => i === index || sameAddressForAllMandats ? { 
                                                 ...m, 
                                                 adresse_travaux: { ...m.adresse_travaux, province: value } 
                                               } : m;
                                               setNouveauDossierForm(prev => ({
                                                 ...prev,
                                                 mandats: prev.mandats.map(updateAddress)
                                               }));
                                             }}
                                           >
                                             <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
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
                                       
                                       {/* Colonne Dates - 50% */}
                                       <div className="space-y-1">
                                         <Label className="text-slate-500 text-[10px]">Dates</Label>
                                         <div className="space-y-1">
                                           <div className="flex items-center gap-1">
                                             <Label className="text-slate-500 text-[10px] w-24">Signature:</Label>
                                             <Input 
                                               type="date" 
                                               value={mandat.date_signature || ""} 
                                               onChange={(e) => {
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map((m, i) => i === index ? { ...m, date_signature: e.target.value } : m)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs flex-1"
                                             />
                                           </div>
                                           <div className="flex items-center gap-1">
                                             <Label className="text-slate-500 text-[10px] w-24">Début travaux:</Label>
                                             <Input 
                                               type="date" 
                                               value={mandat.date_debut_travaux || ""} 
                                               onChange={(e) => {
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map((m, i) => i === index ? { ...m, date_debut_travaux: e.target.value } : m)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs flex-1"
                                             />
                                           </div>
                                           <div className="flex items-center gap-1">
                                             <Label className="text-slate-500 text-[10px] w-24">Livraison:</Label>
                                             <Input 
                                               type="date" 
                                               value={mandat.date_livraison || ""} 
                                               onChange={(e) => {
                                                 setNouveauDossierForm(prev => ({
                                                   ...prev,
                                                   mandats: prev.mandats.map((m, i) => i === index ? { ...m, date_livraison: e.target.value } : m)
                                                 }));
                                               }}
                                               className="bg-slate-700 border-slate-600 text-white h-6 text-xs flex-1"
                                             />
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   </TabsContent>
                                 ))}
                               </Tabs>
                             ) : (
                               <p className="text-slate-500 text-xs text-center py-4">Ajoutez des mandats pour continuer</p>
                             )}
                           </CardContent>
                         )}
                       </Card>
                   </form>
                   </div>

                   {/* Right side - Commentaires et Historique Sidebar - 30% */}
                   <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
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
                         <div className="p-4 border-b border-slate-800 flex-shrink-0">
                           <TabsList className="grid grid-cols-2 h-9 w-full bg-transparent gap-2">
                             <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                               <MessageSquare className="w-4 h-4 mr-1" />
                               Commentaires
                             </TabsTrigger>
                             <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                               <Clock className="w-4 h-4 mr-1" />
                               Historique
                             </TabsTrigger>
                           </TabsList>
                         </div>

                         <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 mt-0">
                           <CommentairesSection
                             dossierId={null}
                             dossierTemporaire={true}
                             commentairesTemp={commentairesTemporairesDossier}
                             onCommentairesTempChange={setCommentairesTemporairesDossier}
                           />
                         </TabsContent>

                         <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 mt-0">
                           {historiqueDossier.length > 0 ? (
                             <div className="space-y-2">
                               {historiqueDossier.map((entry, idx) => (
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

                 {/* Boutons tout en bas */}
                 <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                   <Button type="button" variant="outline" onClick={() => {
                     if (showCancelConfirmDossier) return;
                     setShowCancelConfirmDossier(true);
                   }} className="border-red-500 text-red-400 hover:bg-red-500/10">
                     Annuler
                   </Button>
                   <Button type="submit" form="nouveau-dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                     Créer le dossier
                   </Button>
                 </div>
                 </motion.div>
                 </DialogContent>
                 </Dialog>

                 {/* Dialogs supplémentaires... */}
                 <ClientFormDialog
                 open={isClientFormDialogOpen}
                 onOpenChange={setIsClientFormDialogOpen}
                 editingClient={editingClientForForm}
                 defaultType={clientTypeForForm}
                 onSuccess={() => {
                 queryClient.invalidateQueries({ queryKey: ['clients'] });
                 setEditingClientForForm(null);
                 }}
                 />

                 {/* Dialog d'avertissement modifications non sauvegardées */}
                 <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
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
                 Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
                 </p>
                 <div className="flex justify-center gap-3 pt-4">
                 <Button
                 type="button"
                 onClick={async () => {
                   if (editingPriseMandat && !isLocked) {
                     await base44.entities.PriseMandat.update(editingPriseMandat.id, {
                       ...editingPriseMandat,
                       locked_by: null,
                       locked_at: null
                     });
                     queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                   }
                   setShowUnsavedWarning(false);
                   setIsDialogOpen(false);
                   resetFullForm();
                   setIsLocked(false);
                   setLockedBy("");
                   setHasFormChanges(false);
                 }}
                 className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
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
                 </div>
                 </DialogContent>
                 </Dialog>

                 {/* Dialog de confirmation annulation dossier */}
                 <Dialog open={showCancelConfirmDossier} onOpenChange={setShowCancelConfirmDossier}>
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
                 Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
                 </p>
                 <div className="flex justify-center gap-3 pt-4">
                 <Button
                 type="button"
                 onClick={() => {
                   setShowCancelConfirmDossier(false);
                   setIsOuvrirDossierDialogOpen(false);
                   setNouveauDossierForm({
                     numero_dossier: "",
                     arpenteur_geometre: "",
                     date_ouverture: new Date().toISOString().split('T')[0],
                     statut: "Ouvert",
                     ttl: "Non",
                     clients_ids: [],
                     notaires_ids: [],
                     courtiers_ids: [],
                     mandats: []
                   });
                   setCommentairesTemporairesDossier([]);
                   setDossierDocuments([]);
                 }}
                 className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                 >
                 Abandonner
                 </Button>
                 <Button 
                 type="button" 
                 onClick={() => setShowCancelConfirmDossier(false)}
                 className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                 >
                 Continuer l'édition
                 </Button>
                 </div>
                 </div>
                 </DialogContent>
                 </Dialog>

                 {/* Dialog arpenteur requis */}
                 <Dialog open={showArpenteurRequiredDialog} onOpenChange={setShowArpenteurRequiredDialog}>
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
                 Vous devez sélectionner un arpenteur-géomètre avant de créer une prise de mandat.
                 </p>
                 <div className="flex justify-center gap-3 pt-4">
                 <Button 
                 type="button" 
                 onClick={() => setShowArpenteurRequiredDialog(false)}
                 className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                 >
                 Compris
                 </Button>
                 </div>
                 </div>
                 </DialogContent>
                 </Dialog>

                 {/* Dialog confirmation changement de statut */}
                 <Dialog open={showStatutChangeConfirm} onOpenChange={setShowStatutChangeConfirm}>
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
                 Un numéro de dossier est déjà attribué. Voulez-vous vraiment changer le statut ?
                 {pendingStatutChange !== "Mandats à ouvrir" && " Cela effacera le numéro de dossier et la date d'ouverture."}
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
                 onClick={() => {
                   if (pendingStatutChange !== "Mandats à ouvrir") {
                     setFormData({...formData, statut: pendingStatutChange, numero_dossier: "", date_ouverture: ""});
                   } else {
                     setFormData({...formData, statut: pendingStatutChange});
                   }
                   setShowStatutChangeConfirm(false);
                   setPendingStatutChange(null);
                 }}
                 className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                 >
                 Confirmer
                 </Button>
                 </div>
                 </div>
                 </DialogContent>
                 </Dialog>

                 {/* Dialog suppression mandat */}
                 <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
                 <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
                 <DialogHeader>
                 <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                 <span className="text-2xl">⚠️</span>
                 Confirmation
                 <span className="text-2xl">⚠️</span>
                 </DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4">
                 <p className="text-slate-300 text-center">
                 Êtes-vous sûr de vouloir supprimer ce mandat ?
                 </p>
                 <div className="flex justify-center gap-3 pt-4">
                 <Button
                 type="button"
                 onClick={() => {
                   setShowDeleteMandatConfirm(false);
                   setMandatIndexToDelete(null);
                 }}
                 className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                 >
                 Annuler
                 </Button>
                 <Button 
                 type="button" 
                 onClick={() => {
                   if (mandatIndexToDelete !== null) {
                     setNouveauDossierForm(prev => ({
                       ...prev,
                       mandats: prev.mandats.filter((_, i) => i !== mandatIndexToDelete)
                     }));
                     const newActiveIndex = mandatIndexToDelete > 0 ? (mandatIndexToDelete - 1).toString() : "0";
                     setActiveTabMandatDossier(newActiveIndex);
                   }
                   setShowDeleteMandatConfirm(false);
                   setMandatIndexToDelete(null);
                 }}
                 className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                 >
                 Confirmer
                 </Button>
                 </div>
                 </div>
                 </DialogContent>
                 </Dialog>

                 {/* Dialog utilisateur manquant */}
                 <Dialog open={showMissingUserWarning} onOpenChange={setShowMissingUserWarning}>
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
                         Tous les mandats doivent avoir un utilisateur assigné avant d'ouvrir le dossier.
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
                     </div>
                   </DialogContent>
                   </Dialog>

                   {/* Table des prises de mandat */}
                   <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                   <CardHeader className="border-b border-slate-800">
                     <div className="flex flex-col gap-4">

                       {/* Tabs pour les statuts - style tabs pleine largeur */}
                       <div className="flex w-full border-b border-slate-700">
                 ...
                   </div>
                 </CardContent>
                 </Card>
                 </div>
                 </div>
                 );
                 }