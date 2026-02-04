import React, { useState, useEffect, useMemo, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, User, X, UserPlus, Check, Upload, FileText, ExternalLink, Grid3x3, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Package, Download, FileUp, MessageSquare, Clock, Loader2, Filter } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";
import CommentairesSection from "../components/dossiers/CommentairesSection";
import ClientFormDialog from "../components/clients/ClientFormDialog";
import MandatTabs from "../components/dossiers/MandatTabs";
import EditDossierForm from "../components/dossiers/EditDossierForm";
import DocumentsStepForm from "../components/mandat/DocumentsStepForm";
import LotInfoStepForm from "../components/lots/LotInfoStepForm";
import TypesOperationStepForm from "../components/lots/TypesOperationStepForm";
import DocumentsStepFormLot from "../components/lots/DocumentsStepFormLot";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";
import { motion } from "framer-motion";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const CADASTRE_CODES = {
  "010010": "Île-du-Havre-Aubert", "010020": "Île-d'Entrée", "010030": "Île-du-Cap-aux-Meules", "010040": "Île-du-Havre-aux-Maisons", "010050": "Grosse-Île", "010060": "Île-Brion", "010070": "Île-Coffin", "010080": "Île-au-Loup", "010090": "Île-du-Corps-Mort", "010100": "Rochers-aux-Oiseaux", "020010": "Île-Bonaventure", "020020": "Canton de Percé", "020040": "Municipalité de Grande-Rivière", "020060": "Municipalité de Pabos", "020080": "Canton de Newport", "020100": "Canton de Raudin", "020110": "Canton de Pellegrin", "020120": "Canton de Rameau", "020140": "Canton de Malbaie", "020160": "Canton de Douglas", "020180": "Canton de York", "020200": "Village de Gaspé", "020210": "Canton de Baie-de-Gaspé-Sud", "020220": "Canton de Larocque", "020230": "Canton de Galt", "020240": "Canton de Baie-de-Gaspé-Nord", "020260": "Canton de Cap-des-Rosiers", "020280": "Canton de Fox", "020300": "Canton de Sydenham", "020310": "Canton de Cloridorme", "020320": "Seigneurie de la Grande-Vallée-des-Monts-Notre-Dame", "020340": "Canton de Port-Daniel", "020360": "Canton de Hope", "020380": "Canton de Cox", "020400": "Canton de Garin", "020410": "Canton de Hamilton", "020420": "Canton de New Richmond", "020430": "Canton de Marcil", "020440": "Canton de Robidoux", "020460": "Canton de Maria", "020480": "Canton de Carleton", "020500": "Municipalité de Shoolbred", "020510": "Canton de Dugal", "020520": "Canton de Mann", "020540": "Canton de Ristigouche", "020560": "Canton de Matapédia", "020580": "Canton de Patapédia", "020600": "Canton de Biencourt", "020610": "Canton de Laroche", "020620": "Canton de Varin", "020640": "Canton de Flynn", "020660": "Canton de Ouimet", "020680": "Canton de Massé", "020700": "Paroisse de Sainte-Angèle-de-Mérici", "020710": "Canton de Fleuriau", "020720": "Canton de Neigette", "020740": "Canton de Macpès", "020760": "Canton de Duquesne", "020780": "Canton de Chénier", "020800": "Canton de Bédard", "020810": "Paroisse de Saint-Mathieu", "020820": "Paroisse de Saint-Simon", "020840": "Paroisse de Saint-Fabien", "020860": "Paroisse de Sainte-Cécile-du-Bic", "020880": "Paroisse de Notre-Dame-du-Sacré-Coeur", "020900": "Ville de Saint-Germain-de-Rimouski", "020910": "Paroisse de Saint-Germain-de-Rimouski", "020920": "Paroisse de Saint-Anaclet", "020940": "Paroisse de Sainte-Luce", "020960": "Paroisse de Saint-Donat", "020980": "Paroisse de Saint-Joseph-de-Lepage", "021000": "Paroisse de Sainte-Flavie", "021010": "Canton d'Assemetquagan", "021020": "Canton de Milnikek", "021040": "Canton de Jetté", "021060": "Canton de Matalik", "021080": "Canton de Casupscull", "021100": "Canton de La Vérendrye", "021110": "Canton de Casault", "021120": "Canton de Lepage", "021140": "Canton de Humqui", "021160": "Canton de Pinault", "021180": "Canton de Nemtayé", "021200": "Paroisse de Saint-Benoît-Joseph-Labre", "021210": "Canton de Blais", "021220": "Canton de Langis", "021240": "Paroisse de Saint-Pierre-du-Lac", "021260": "Canton d'Awantjish", "021280": "Augmentation du canton d'Awantjish", "021300": "Paroisse de Sainte-Marie-de-Sayabec", "021310": "Canton de Matane", "021320": "Augmentation du canton de MacNider", "021340": "Canton de MacNider", "021360": "Canton de Cabot", "021380": "Paroisse de Saint-Octave-de-Métis", "021390": "Canton de Faribault", "021400": "Paroisse de Notre-Dame-de-L'Assomption-de-MacNider", "021410": "Paroisse de Saint-Ulric", "021420": "Paroisse de Saint-Jérôme-de-Matane", "021440": "Canton de Tessier", "021460": "Canton de Saint-Denis", "021480": "Paroisse de Sainte-Félicité", "021500": "Canton de Cherbourg", "021510": "Canton de Dalibaire", "021520": "Canton de Romieu", "021530": "Canton de La Potardière", "021540": "Canton de Cap-Chat", "021560": "Fief de Sainte-Anne-des-Monts", "021580": "Canton de Tourelle", "021600": "Canton de Christie", "021610": "Canton de Boisbuisson", "021620": "Canton de Duchesnay", "021630": "Canton de La Rivière", "021640": "Municipalité de Saint-Maxime-du-Mont-Louis", "021650": "Canton de Bonnécamp", "021660": "Canton de Taschereau", "021680": "Canton de Denoue", "021700": "Canton de Holland", "021710": "Canton d'Asselin", "021720": "Canton de Baillargeon", "021730": "Canton d'Angers", "021740": "Canton de Lemieux", "021750": "Brochu", "021760": "Canton de Lesseps", "021770": "Canton de Champou", "021780": "Canton de Flahault", "080620": "Village d'Hébertville", "080630": "Canton de Saint-Hilaire", "080640": "Canton de Caron", "080660": "Canton de Métabetchouan", "080700": "Canton de Signay", "080710": "Canton de De l'Île", "080720": "Canton de Taillon", "080740": "Canton de Garnier", "080760": "Canton de Crespieul", "080780": "Canton de Malherbe", "080800": "Augmentation du canton de Dequen", "080810": "Canton de Dablon", "080820": "Canton de Dequen", "080840": "Canton de Charlevoix", "080860": "Canton de Roberval", "080880": "Village de Roberval", "080900": "Canton de Ross", "080910": "Canton de Déchêne", "080920": "Canton de Ouiatchouan", "080940": "Canton d'Ashuapmouchouan", "080960": "Canton de Demeulles", "080980": "Canton de Parent", "081000": "Canton de Racine", "081010": "Canton de Dolbeau", "081020": "Canton de Dalmas", "081040": "Canton de Jogues", "081060": "Canton de Maltais", "081080": "Canton de Constantin", "081100": "Canton de Saint-Onge", "081110": "Canton de Milot", "081120": "Canton de Proulx", "081140": "Canton de Hudon", "081160": "Canton de La Trappe", "081180": "Canton de Pelletier", "081200": "Canton d'Albanel", "081210": "Canton de Normandin", "081240": "Canton de Dufferin", "081260": "Canton de Dumais", "081280": "Canton de Girard", "080010": "Canton de Boilleau", "080020": "Canton de Périgny", "080040": "Canton de Dumas", "080050": "Canton de Labrosse", "080060": "Canton de Saint-Jean", "080080": "Canton de Hébert", "080100": "Canton d'Otis", "080110": "Canton de Ferland", "080120": "Paroisse de Saint-Alexis", "080130": "Paroisse de Saint-Alphonse", "080140": "Village de Grande-Baie", "080160": "Village de Bagotville", "080180": "Canton de Bagot", "080200": "Canton de Laterrière", "080210": "Paroisse de Chicoutimi", "080220": "Ville de Chicoutimi", "080240": "Canton de Chicoutimi", "080260": "Cité d'Arvida", "080280": "Canton de Jonquière", "080300": "Canton de Kénogami", "080310": "Canton de Labarre", "080320": "Canton de Taché", "080340": "Canton de Bourget", "080360": "Canton de Simard", "080380": "Canton de Tremblay", "080400": "Village de Sainte-Anne-de-Chicoutimi", "080410": "Canton de Harvey", "080420": "Canton de Saint-Germains", "080430": "Canton de Chardon", "080440": "Canton de Durocher", "080460": "Canton de Falardeau", "080470": "Canton de Gagné", "080480": "Canton de Bégin", "080500": "Canton de Labrecque", "080510": "Canton de Rouleau", "080520": "Canton d'Aulneau"
};

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": ["Québec", "Canton de Caron", "Canton de de l'Île", "Canton de Garnier", "Village d'Héberville", "Canton d'Hébertville-Station", "Canton de Labarre", "Canton de Mésy", "Canton de Métabetchouan", "Canton de Signay", "Canton de Taillon"],
  "Lac-Saint-Jean-Ouest": ["Québec", "Canton d'Albanel", "Canton de Charlevoix", "Canton de Dablon", "Canton de Dalmas", "Canton de Demeules", "Canton de Dequen", "Canton de Dolbeau", "Canton de Girard", "Canton de Jogues", "Canton de Malherbe", "Canton de Métabetchouan", "Canton de Milot", "Canton de Normandin", "Canton de Ouiatchouan", "Canton de Racine", "Canton de Roberval", "Canton de Saint-Hilaire"],
  "Chicoutimi": ["Québec", "Cité d'Arvida", "Canton de Bagot", "Village de Bagotville", "Canton de Bégin", "Canton de Boileau", "Canton de Bourget", "Canton de Chicoutimi", "Paroisse de Chicoutimi", "Ville de Chicoutimi", "Canton de Dumas", "Canton de Durocher", "Canton de Falardau", "Canton de Ferland", "Ville de Grande-Baie", "Canton de Harvey", "Canton de Hébert", "Canton de Jonquière", "Canton de Kénogami", "Canton de Labrecque", "Canton de Laterrière", "Canton d'Otis", "Canton de Périgny", "Canton de Rouleau", "Canton de Simard", "Paroisse de Saint-Alexis", "Paroisse de Saint-Alphonse", "Ville de Sainte-Anne-de-Chicoutimi", "Canton de Saint-Germains", "Canton de Saint-Jean", "Canton de Taché", "Canton de Tremblay"]
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

export default function Dossiers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isNotaireSelectorOpen, setIsNotaireSelectorOpen] = useState(false);
  const [isCourtierSelectorOpen, setIsCourtierSelectorOpen] = useState(false);
  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [clientTypeForForm, setClientTypeForForm] = useState('Client');
  const [editingClientForForm, setEditingClientForForm] = useState(null);
  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");
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
  const [uploadingLotPdf, setUploadingLotPdf] = useState(false);
  const [availableCadastresForNewLot, setAvailableCadastresForNewLot] = useState([]);
  const [commentairesTemporairesLot, setCommentairesTemporairesLot] = useState([]);
  const [sidebarTabLot, setSidebarTabLot] = useState("commentaires");
  const [editingLot, setEditingLot] = useState(null);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [typesOperationCollapsed, setTypesOperationCollapsed] = useState(false);
  const [lotDocumentsCollapsed, setLotDocumentsCollapsed] = useState(false);
  const [sidebarCollapsedLot, setSidebarCollapsedLot] = useState(false);
  const [lotActionLogs, setLotActionLogs] = useState([]);
  const [activeTabMandat, setActiveTabMandat] = useState("0");
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [showD01ImportSuccess, setShowD01ImportSuccess] = useState(false);
  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterVille, setFilterVille] = useState([]);
  const [filterStatut, setFilterStatut] = useState([]);
  const [filterMandat, setFilterMandat] = useState([]);
  const [filterTache, setFilterTache] = useState([]);
  const [filterDateDebut, setFilterDateDebut] = useState("");
  const [filterDateFin, setFilterDateFin] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isCloseDossierDialogOpen, setIsCloseDossierDialogOpen] = useState(false);
  const [closingDossierId, setClosingDossierId] = useState(null);
  const [closingDossierSearchTerm, setClosingDossierSearchTerm] = useState("");
  const [minutesData, setMinutesData] = useState([]);
  const [closeFilterArpenteur, setCloseFilterArpenteur] = useState("all");
  const [closeFilterVille, setCloseFilterVille] = useState("all");
  const [closeFilterMandat, setCloseFilterMandat] = useState("all");
  const [newMinuteForm, setNewMinuteForm] = useState({
    minute: "",
    date_minute: "",
    type_minute: "Initiale"
  });

  const [isFacturationDialogOpen, setIsFacturationDialogOpen] = useState(false);
  const [facturationDossierId, setFacturationDossierId] = useState(null);
  const [facturationSearchTerm, setFacturationSearchTerm] = useState("");
  const [selectedMandatsForFacturation, setSelectedMandatsForFacturation] = useState([]);
  const [facturationFilterArpenteur, setFacturationFilterArpenteur] = useState("all");
  const [facturationFilterVille, setFacturationFilterVille] = useState("all");
  const [facturationFilterMandat, setFacturationFilterMandat] = useState("all");

  const [isFacturationMandatsDialogOpen, setIsFacturationMandatsDialogOpen] = useState(false);
  const [selectedMandatsForLocalFacturation, setSelectedMandatsForLocalFacturation] = useState([]);
  const [terrainSectionExpanded, setTerrainSectionExpanded] = useState({});
  const [isAddMinuteDialogOpen, setIsAddMinuteDialogOpen] = useState(false);
  const [currentMinuteMandatIndex, setCurrentMinuteMandatIndex] = useState(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importedData, setImportedData] = useState([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [showDeleteDossierConfirm, setShowDeleteDossierConfirm] = useState(false);
  const [dossierIdToDelete, setDossierIdToDelete] = useState(null);
  const [dossierNameToDelete, setDossierNameToDelete] = useState("");

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_fermeture: "",
    statut: "Ouvert",
    ttl: "Non",
    place_affaire: "",
    clients_ids: [],
    clients_texte: "",
    notaires_ids: [],
    notaires_texte: "",
    courtiers_ids: [],
    courtiers_texte: "",
    mandats: [],
    description: ""
  });

  // Fonction pour calculer le prochain numéro de dossier disponible
  const calculerProchainNumeroDossier = (arpenteur) => {
    const arpenteurDossiers = dossiers.filter(d => d.arpenteur_geometre === arpenteur && d.numero_dossier);
    const maxDossier = arpenteurDossiers.reduce((max, d) => {
      const num = parseInt(d.numero_dossier, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    const arpenteurPriseMandats = priseMandats.filter(p => 
      p.arpenteur_geometre === arpenteur && 
      p.statut === "Mandats à ouvrir" && 
      p.numero_dossier
    );
    const maxPriseMandat = arpenteurPriseMandats.reduce((max, p) => {
      const num = parseInt(p.numero_dossier, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    
    return (Math.max(maxDossier, maxPriseMandat) + 1).toString();
  };

  const queryClient = useQueryClient();

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: []
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: []
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: []
  });

  const { data: entreeTemps = [] } = useQuery({
    queryKey: ['entreeTemps'],
    queryFn: () => base44.entities.EntreeTemps.list('-date'),
    initialData: []
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: priseMandats = [] } = useQuery({
    queryKey: ['priseMandats'],
    queryFn: () => base44.entities.PriseMandat.list(),
    initialData: [],
  });

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

  const createDossierMutation = useMutation({
    mutationFn: async (dossierData) => {
      const newDossier = await base44.entities.Dossier.create(dossierData);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: "CREATION_DOSSIER",
        entite: "Dossier",
        entite_id: newDossier.id,
        details: `Création du dossier ${getArpenteurInitials(dossierData.arpenteur_geometre)}${dossierData.numero_dossier}`,
        metadata: {
          arpenteur: dossierData.arpenteur_geometre,
          nombre_mandats: dossierData.mandats?.length || 0
        }
      });
      
      if (commentairesTemporaires.length > 0) {
        const commentairePromises = commentairesTemporaires.map((comment) =>
          base44.entities.CommentaireDossier.create({
            dossier_id: newDossier.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }
      return newDossier;
    },
    onSuccess: (newDossier) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsDialogOpen(false);
      resetForm();
      
      // Ouvrir automatiquement le dossier créé en mode visualisation
      setTimeout(() => {
        handleView(newDossier);
      }, 100);
    }
  });

  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, dossierData }) => {
      const oldDossier = dossiers.find(d => d.id === id);
      const updatedDossier = await base44.entities.Dossier.update(id, dossierData);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: "MODIFICATION_DOSSIER",
        entite: "Dossier",
        entite_id: id,
        details: `Modification du dossier ${getArpenteurInitials(dossierData.arpenteur_geometre)}${dossierData.numero_dossier}`,
        metadata: {
          statut: dossierData.statut
        }
      });
      
      // Créer des notifications pour les utilisateurs nouvellement assignés
      if (oldDossier && dossierData.mandats) {
        for (let i = 0; i < dossierData.mandats.length; i++) {
          const newMandat = dossierData.mandats[i];
          const oldMandat = oldDossier.mandats?.[i];
          
          // Si un utilisateur est assigné et qu'il est différent de l'ancien
          if (newMandat.utilisateur_assigne && 
              newMandat.utilisateur_assigne !== oldMandat?.utilisateur_assigne &&
              newMandat.tache_actuelle) {
            const clientsNames = getClientsNames(dossierData.clients_ids);
            const numeroDossier = `${getArpenteurInitials(dossierData.arpenteur_geometre)}${dossierData.numero_dossier}`;
            
            await base44.entities.Notification.create({
              utilisateur_email: newMandat.utilisateur_assigne,
              titre: "Nouvelle tâche assignée",
              message: `${user?.full_name || 'Un utilisateur'} vous a assigné la tâche "${newMandat.tache_actuelle}"${numeroDossier ? ` pour le dossier ${numeroDossier}` : ''}${clientsNames ? ` - ${clientsNames}` : ''}.`,
              type: "dossier",
              dossier_id: id,
              lue: false
            });
          }
        }
      }
      
      return updatedDossier;
    },
    onSuccess: (updatedDossier) => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsDialogOpen(false);
      setIsCloseDossierDialogOpen(false);
      setIsFacturationDialogOpen(false);
      setIsFacturationMandatsDialogOpen(false);
      resetForm();
      setClosingDossierId(null);
      setMinutesData([]);
      setFacturationDossierId(null);
      setSelectedMandatsForFacturation([]);
      setSelectedMandatsForLocalFacturation([]);
      
      // Ouvrir automatiquement le dossier modifié en mode visualisation
      setTimeout(() => {
        handleView(updatedDossier);
      }, 100);
    }
  });

  const deleteDossierMutation = useMutation({
    mutationFn: async (id) => {
      const dossier = dossiers.find(d => d.id === id);
      await base44.entities.Dossier.delete(id);
      
      // Log l'action
      if (dossier) {
        await base44.entities.ActionLog.create({
          utilisateur_email: user?.email,
          utilisateur_nom: user?.full_name,
          action: "SUPPRESSION_DOSSIER",
          entite: "Dossier",
          entite_id: id,
          details: `Suppression du dossier ${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    }
  });

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
      
      // Ajouter automatiquement le nouveau lot au mandat en cours
      if (currentMandatIndex !== null) {
        addLotToCurrentMandat(newLot.id);
      }
      
      return newLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsNewLotDialogOpen(false);
      setIsLotSelectorOpen(true);
      resetNewLotForm();
      setCommentairesTemporairesLot([]);
    }
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, lotData }) => {
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
        
        // Comparer les types d'opération
        const oldTypes = oldLot.types_operation || [];
        const newTypes = lotData.types_operation || [];
        
        if (newTypes.length > oldTypes.length) {
          const lastAdded = newTypes[newTypes.length - 1];
          if (lastAdded) {
            changes.push(`Ajout type d'opération: ${lastAdded.type_operation || 'N/A'} (${lastAdded.date_bpd || 'sans date'})`);
          }
        }
        
        if (newTypes.length < oldTypes.length) {
          const removedCount = oldTypes.length - newTypes.length;
          changes.push(`${removedCount} type(s) d'opération supprimé(s)`);
        }
        
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
      resetNewLotForm();
    },
  });

  const clientsReguliers = clients.filter((c) => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter((c) => c.type_client === 'Notaire');
  const courtiers = clients.filter((c) => c.type_client === 'Courtier immobilier');

  const getClientById = useCallback((id) => clients.find((c) => c.id === id), [clients]);
  const getLotById = useCallback((numeroLot) => lots.find((l) => l.id === numeroLot), [lots]);
  const getUserByEmail = useCallback((email) => users.find((u) => u.email === email), [users]);
  
  const getClientsNames = useCallback((clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map((id) => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
  }, [getClientById]);

  const availableLotCadastres = newLotForm.circonscription_fonciere ? CADASTRES_PAR_CIRCONSCRIPTION[newLotForm.circonscription_fonciere] || [] : [];

  const sortClientsWithSelected = (clientsList, selectedIds) => {
    return [...clientsList].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      const aName = `${a.prenom} ${a.nom}`.toLowerCase();
      const bName = `${b.prenom} ${b.nom}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  const sortLotsWithSelected = (lotsList, selectedLots) => {
    return [...lotsList].sort((a, b) => {
      const aSelected = selectedLots?.includes(a.id);
      const bSelected = selectedLots?.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.numero_lot || "").localeCompare(b.numero_lot || "");
    });
  };

  const filteredLotsForSelector = sortLotsWithSelected(
    lots.filter((lot) => {
      const matchesSearch = lot.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || lot.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || lot.circonscription_fonciere?.toLowerCase().includes(lotSearchTerm.toLowerCase());
      const matchesCadastre = lotCadastreFilter === "all" || lot.cadastre === lotCadastreFilter;
      return matchesSearch && matchesCadastre;
    }),
    currentMandatIndex !== null ? formData.mandats[currentMandatIndex]?.lots : []
  );

  const openLotSelector = (mandatIndex) => {
    setCurrentMandatIndex(mandatIndex);
    setIsLotSelectorOpen(true);
  };

  const addLotToCurrentMandat = (lotId) => {
    if (currentMandatIndex !== null) {
      setFormData((prev) => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === currentMandatIndex ? {
            ...m,
            lots: m.lots.includes(lotId) ? m.lots.filter((id) => id !== lotId) : [...(m.lots || []), lotId]
          } : m
        )
      }));
    }
  };

  const filteredClientsForSelector = sortClientsWithSelected(
    clientsReguliers.filter((c) =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.courriels?.some((courriel) => courriel.courriel?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
      c.telephones?.some((tel) => tel.telephone?.toLowerCase().includes(clientSearchTerm.toLowerCase()))
    ),
    formData.clients_ids
  );

  const filteredNotairesForSelector = sortClientsWithSelected(
    notaires.filter((n) =>
      `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase()) ||
      n.courriels?.some((courriel) => courriel.courriel?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
      n.telephones?.some((tel) => tel.telephone?.toLowerCase().includes(notaireSearchTerm.toLowerCase()))
    ),
    formData.notaires_ids
  );

  const filteredCourtiersForSelector = sortClientsWithSelected(
    courtiers.filter((c) =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase()) ||
      c.courriels?.some((courriel) => courriel.courriel?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
      c.telephones?.some((tel) => tel.telephone?.toLowerCase().includes(courtierSearchTerm.toLowerCase()))
    ),
    formData.courtiers_ids
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérifier que le numéro de dossier n'existe pas déjà pour cet arpenteur
    if (formData.statut === "Ouvert" && formData.numero_dossier && formData.arpenteur_geometre) {
      const dossierExistant = dossiers.find((d) =>
        d.id !== editingDossier?.id && // Exclure le dossier en cours d'édition
        d.numero_dossier === formData.numero_dossier &&
        d.arpenteur_geometre === formData.arpenteur_geometre
      );

      if (dossierExistant) {
        alert(`Le numéro de dossier ${formData.numero_dossier} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
        return;
      }

      // Validation : au moins un mandat doit exister
      if (formData.mandats.length === 0) {
        alert("Vous devez ajouter au moins un mandat avant d'ouvrir un dossier.");
        return;
      }

      // Validation : tous les mandats doivent avoir un utilisateur assigné
      const mandatsSansUtilisateur = formData.mandats.filter(m => !m.utilisateur_assigne);
      if (mandatsSansUtilisateur.length > 0) {
        alert("Tous les mandats doivent avoir un utilisateur assigné.");
        return;
      }
    }

    if (editingDossier) {
      updateDossierMutation.mutate({ id: editingDossier.id, dossierData: formData });
    } else {
      createDossierMutation.mutate(formData);
    }
  };

  const handleNewLotSubmit = async (e) => {
    e.preventDefault();
    
    if (!newLotForm.numero_lot || !newLotForm.circonscription_fonciere) {
      alert("Veuillez remplir le numéro de lot et la circonscription foncière.");
      return;
    }
    
    // Vérifier si le lot existe déjà seulement en création
    if (!editingLot) {
      const lotExistant = lots.find(l => 
        l.numero_lot === newLotForm.numero_lot && 
        l.circonscription_fonciere === newLotForm.circonscription_fonciere
      );
      
      if (lotExistant) {
        alert(`Le lot ${newLotForm.numero_lot} existe déjà dans ${newLotForm.circonscription_fonciere}.`);
        return;
      }
    }
    
    if (editingLot) {
      await updateLotMutation.mutateAsync({ id: editingLot.id, lotData: newLotForm });
    } else {
      await createLotMutation.mutateAsync(newLotForm);
    }
  };

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
      
      const typeOperation = {
        type_operation: "Remplacement",
        date_bpd: extractedData.date_bpd || '',
        concordances_anterieures: concordances_anterieures
      };
      
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

  const resetForm = () => {
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      date_fermeture: "",
      statut: "Ouvert",
      clients_ids: [],
      notaires_ids: [],
      courtiers_ids: [],
      mandats: [],
      description: ""
    });
    setEditingDossier(null);
    setActiveTabMandat("0");
    setCommentairesTemporaires([]);
    setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    setTerrainSectionExpanded({}); // Reset expanded state on form close
  };

  const resetNewLotForm = () => {
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
    setLotInfoCollapsed(false);
    setTypesOperationCollapsed(false);
    setLotDocumentsCollapsed(false);
    setLotActionLogs([]);
  };

  const handleEdit = (entity) => {
    if (entity && entity.type_client) {
      setEditingClientForForm(entity);
      setClientTypeForForm(entity.type_client);
      setIsClientFormDialogOpen(true);
      setIsClientSelectorOpen(false);
      setIsNotaireSelectorOpen(false);
      setIsCourtierSelectorOpen(false);
      return;
    }
    setIsViewDialogOpen(false);
    setViewingDossier(null);
    setEditingDossier(entity);
    setFormData({
      numero_dossier: entity.numero_dossier || "",
      arpenteur_geometre: entity.arpenteur_geometre || "",
      date_ouverture: entity.date_ouverture || new Date().toISOString().split('T')[0],
      date_fermeture: entity.date_fermeture || "",
      statut: entity.statut || "Ouvert",
      ttl: entity.ttl || "Non",
      clients_ids: entity.clients_ids || [],
      clients_texte: entity.clients_texte || "",
      notaires_ids: entity.notaires_ids || [],
      notaires_texte: entity.notaires_texte || "",
      courtiers_ids: entity.courtiers_ids || [],
      courtiers_texte: entity.courtiers_texte || "",
      mandats: entity.mandats?.map((m) => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        minute: m.minute || "",
        date_minute: m.date_minute || "",
        type_minute: m.type_minute || "Initiale",
        minutes_list: m.minutes_list || [],
        tache_actuelle: m.tache_actuelle || "",
        utilisateur_assigne: m.utilisateur_assigne || "",
        statut_terrain: m.statut_terrain || "",
        adresse_travaux: m.adresse_travaux ? typeof m.adresse_travaux === 'string' ? { rue: m.adresse_travaux, numeros_civiques: [], ville: "", code_postal: "", province: "" } : m.adresse_travaux : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
        lots: m.lots || [],
        lots_texte: m.lots_texte || "",
        prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
        rabais: m.rabais !== undefined ? m.rabais : 0,
        taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
        date_livraison: m.date_livraison || "",
        date_signature: m.date_signature || "",
        date_debut_travaux: m.date_debut_travaux || "",
        terrain: m.terrain || {
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
        factures: m.factures || [], // Changed from 'facture' to 'factures'
        notes: m.notes || "" // Ensure notes field is initialized
      })) || [],
      description: entity.description || ""
    });
    setIsDialogOpen(true);
    setActiveTabMandat("0");
    setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    setTerrainSectionExpanded({}); // Reset expanded state when opening a dossier
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

  const handleDelete = (id, nom) => {
    setDossierIdToDelete(id);
    setDossierNameToDelete(nom);
    setShowDeleteDossierConfirm(true);
  };

  const toggleClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(clientId) ? prev[field].filter((id) => id !== clientId) : [...prev[field], clientId]
    }));
  };

  const removeClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((id) => id !== clientId)
    }));
  };

  const addMandat = () => {
    const newIndex = formData.mandats.length;
    const firstMandat = formData.mandats[0];
    const defaultAdresse = firstMandat?.adresse_travaux ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "QC" };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];

    setFormData((prev) => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        minute: "",
        date_minute: "",
        type_minute: "Initiale",
        minutes_list: [],
        tache_actuelle: "Ouverture",
        statut_terrain: "",
        adresse_travaux: defaultAdresse,
        lots: defaultLots,
        lots_texte: "",
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
        factures: [], // Added for new mandates
        notes: ""
      }]
    }));
    setActiveTabMandat(newIndex.toString());
  };

  const getMandatTabLabel = (mandat, index) => mandat.type_mandat || `Mandat ${index + 1}`;

  const updateMandatAddress = (mandatIndex, newAddresses) => {
    setFormData((prev) => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === mandatIndex ? { ...m, adresse_travaux: newAddresses[0] || { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" } } : m
      )
    }));
  };

  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter((n) => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    if (addr.province) parts.push(addr.province);
    if (addr.code_postal) parts.push(addr.code_postal);
    return parts.filter((p) => p).join(', ');
  };



  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return "-";
    const addr = mandats[0].adresse_travaux;
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter((n) => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter((p) => p).join(', ');
  };

  const updateMandat = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => {
        if (i === index) {
          const updatedMandat = { ...m, [field]: value };
          if (field === 'tache_actuelle') {
            if (value === "Cédule") {
              updatedMandat.statut_terrain = "en_verification";
            } else {
              updatedMandat.statut_terrain = "";
            }
          }
          if (field === 'terrain') {
            return { ...m, terrain: { ...m.terrain, ...value } };
          }
          // Si la date de livraison change, calculer automatiquement la date limite levé terrain (2 semaines avant)
          if (field === 'date_livraison' && value) {
            const dateLivraison = new Date(value);
            const dateLimiteLeve = new Date(dateLivraison);
            dateLimiteLeve.setDate(dateLimiteLeve.getDate() - 14);
            updatedMandat.terrain = {
              ...m.terrain,
              date_limite_leve: dateLimiteLeve.toISOString().split('T')[0]
            };
          }
          return updatedMandat;
        }
        return m;
      })
    }));
  };

  const removeMandat = (index) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.")) {
      setFormData((prev) => ({
        ...prev,
        mandats: prev.mandats.filter((_, i) => i !== index)
      }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotId) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer ce lot de ce mandat ?`)) {
      setFormData((prev) => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === mandatIndex ? { ...m, lots: m.lots.filter((id) => id !== lotId) } : m
        )
      }));
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

  const genererFacture = async (dossier = null, selectedMandatsIndexes = null, saveToDatabase = true) => {
    const targetDossier = dossier || editingDossier;
    if (!targetDossier) return;

    // Determine clients and mandats based on whether a specific dossier object is provided (from saved list)
    // or if we are using the current formData (from editing dialog)
    const clientsList = (dossier ? targetDossier.clients_ids : formData.clients_ids).map((id) => getClientById(id)).filter((c) => c);
    const client = clientsList[0];

    const allMandatsData = dossier ? targetDossier.mandats : formData.mandats;
    const mandatsToInvoice = selectedMandatsIndexes ?
      selectedMandatsIndexes.map((idx) => allMandatsData[idx]) :
      allMandatsData; // If no specific indexes, invoice all available mandats in the context

    if (mandatsToInvoice.length === 0) {
      console.warn("No mandates selected or available for invoicing.");
      return;
    }

    let totalHT = 0;
    mandatsToInvoice.forEach(m => {
      const prix = m.prix_estime || 0;
      const rabais = m.rabais || 0;
      if (!m.taxes_incluses) {
        totalHT += (prix - rabais);
      } else {
        // If taxes are included, remove them to get the HT amount
        // Assuming 5% TPS and 9.975% TVQ for a combined 15.475% tax (1.15475 factor)
        // totalTTC = totalHT * (1 + 0.05 + 0.09975) = totalHT * 1.15475
        // totalHT = totalTTC / 1.15475
        totalHT += (prix - rabais) / 1.15475;
      }
    });

    const tps = totalHT * 0.05;
    const tvq = totalHT * 0.09975;
    const totalTTC = totalHT + tps + tvq;

    const numeroFacture = Math.floor(Math.random() * 90000) + 10000;

    const uniqueAddresses = [];
    const addressMap = new Map();
    mandatsToInvoice.forEach((m) => {
      if (m.adresse_travaux) {
        const addrStr = formatAdresse(m.adresse_travaux);
        if (addrStr && !addressMap.has(addrStr)) {
          addressMap.set(addrStr, true);
          uniqueAddresses.push(addrStr);
        }
      }
    });

    const uniqueLots = [];
    const lotMap = new Map();
    mandatsToInvoice.forEach((m) => {
      if (m.lots && m.lots.length > 0) {
        m.lots.forEach((lotId) => {
          const lot = getLotById(lotId);
          const lotStr = lot ? lot.numero_lot : lotId;
          if (!lotMap.has(lotStr)) {
            lotMap.set(lotStr, true);
            uniqueLots.push(lotStr);
          }
        });
      }
    });

    const factureHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 50px 60px; color: #000; line-height: 1.4; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .company { flex: 0 0 35%; }
    .company h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; letter-spacing: 0.5px; }
    .company .subtitle { font-size: 13px; font-style: italic; margin-bottom: 8px; }
    .company .address { font-size: 10px; line-height: 1.5; color: #333; }
    
    .logo { flex: 0 0 30%; text-align: center; padding-top: 10px; }
    .logo img { max-width: 200px; height: auto; }
    
    .invoice-title { flex: 0 0 35%; text-align: right; }
    .invoice-title h2 { font-size: 42px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px; }
    .invoice-title .details { font-size: 11px; line-height: 1.8; text-align: right; }
    .invoice-title .details div { margin: 3px 0; }
    .invoice-title .details strong { font-weight: bold; margin-right: 5px; }
    
    .separator { border-top: 1.5px solid #000; margin: 18px 0; }
    
    .billing-section { display: flex; margin-bottom: 20px; font-size: 11px; }
    .billing-section .column { flex: 1; }
    .billing-section .label { font-weight: bold; text-decoration: underline; margin-bottom: 10px; font-size: 11px; }
    .billing-section p { line-height: 1.5; margin: 2px 0; }
    
    .location-section { margin: 20px 0 8px 0; font-size: 11px; }
    .location-section .section-title { font-weight: normal; font-style: italic; margin-bottom: 3px; }
    .location-section p { margin: 2px 0; }
    
    .description-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
    .description-table th { background: #d1d5db; padding: 6px 10px; text-align: left; font-weight: bold; border: 1px solid #000; font-size: 11px; }
    .description-table th:last-child { text-align: right; }
    .description-table td { padding: 6px 10px; border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: 1px solid #000; vertical-align: top; }
    .description-table tr:first-child td { border-top: 1px solid #000; }
    .description-table .amount-cell { text-align: right; white-space: nowrap; vertical-align: top; }
    .description-table .bold-item { font-weight: bold; margin: 4px 0; }
    .description-table .italic-item { margin-left: 25px; margin: 2px 0 2px 25px; }
    .description-table .rabais { color: #dc2626; font-style: italic; margin-left: 25px; }
    .description-table .minute-info { float: right; font-weight: bold; margin-left: 30px; }
    
    .totals { margin-top: 80px; display: flex; justify-content: space-between; align-items: center; }
    .totals-left { flex: 1; text-align: center; font-size: 20px; font-weight: bold; }
    .totals-right { flex: 0 0 auto; }
    .totals-table { font-size: 12px; }
    .totals-table tr { height: 25px; }
    .totals-table tr td:first-child { text-align: right; padding-right: 40px; }
    .totals-table tr td:last-child { text-align: right; font-weight: bold; width: 120px; }
    .totals-table .total-row { border-top: 1.5px solid #000; border-bottom: 3px double #000; }
    .totals-table .total-row td { padding-top: 8px; padding-bottom: 5px; font-size: 13px; font-weight: bold; }
    
    .footer { margin-top: 40px; font-size: 10px; line-height: 1.5; display: flex; justify-content: space-between; align-items: center; }
    .footer .fiscal { color: #dc2626; font-weight: bold; }
    .footer .conditions { color: #dc2626; font-weight: bold; }
    
    @media print {
      body { padding: 30px 40px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>GIRARD TREMBLAY GILBERT INC.</h1>
      <div class="subtitle">ARPENTEURS-GÉOMÈTRES</div>
      <div class="address">
        11, rue Melançon Est, Alma, Québec, G8B 3W8<br>
        info@girardtremblaygilbert.com<br>
        www.girardtremblaygilbert.com
      </div>
    </div>
    
    <div class="logo">
      <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/cc5da5790_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png" alt="Logo GTG">
    </div>
    
    <div class="invoice-title">
      <h2>FACTURE</h2>
      <div class="details">
        <div><strong>NO.</strong> ${numeroFacture}</div>
        <div><strong>DATE</strong> ${format(new Date(), "yyyy-MM-dd")}</div>
        <div><strong>DOSSIER</strong> ${getArpenteurInitials(targetDossier.arpenteur_geometre)}${targetDossier.numero_dossier}</div>
      </div>
    </div>
  </div>
  
  <div class="separator"></div>
  
  <div class="billing-section">
    <div class="column">
      <div class="label">FACTURÉ À :</div>
      ${client ? `
        <p><strong>${client.prenom} ${client.nom}</strong></p>
        ${client.adresses?.find((a) => a.actuelle) ? `<p>${formatAdresse(client.adresses.find((a) => a.actuelle))}</p>` : ''}
      ` : '<p>Client non spécifié</p>'}
    </div>
    <div class="column">
      <div class="label">EXPÉDIÉ À :</div>
      ${client ? `
        <p><strong>${client.prenom} ${client.nom}</strong></p>
        ${client.adresses?.find((a) => a.actuelle) ? `<p>${formatAdresse(client.adresses.find((a) => a.actuelle))}</p>` : ''}
      ` : '<p>Client non spécifié</p>'}
    </div>
  </div>
  
  ${uniqueAddresses.length > 0 ? `
    <div class="location-section">
      <div class="section-title">Localisation(s) des travaux :</div>
      ${uniqueAddresses.map((addr) => `<p>${addr}</p>`).join('')}
    </div>
  ` : ''}
  
  ${uniqueLots.length > 0 ? `
    <div class="location-section">
      <div class="section-title">Lot(s) :</div>
      <p>${uniqueLots.map((lot) => `${lot} du cadastre du Québec`).join(', ')}</p>
    </div>
  ` : ''}
  
  <table class="description-table">
    <thead>
      <tr>
        <th style="width: 75%;">DESCRIPTION</th>
        <th style="width: 25%;">MONTANT</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="bold-item">Ouverture de dossier.</div>
        </td>
        <td class="amount-cell"></td>
      </tr>
      <tr>
        <td>
          <div class="bold-item">Travaux préalables :</div>
          <div class="italic-item">Recherches, calcul et analyse foncière.</div>
          <div class="italic-item">Mise en plan.</div>
          <div class="italic-item">Étude du dossier.</div>
        </td>
        <td class="amount-cell"></td>
      </tr>
      ${mandatsToInvoice.map((mandat) => {
      let montantHTMandat = (mandat.prix_estime || 0) - (mandat.rabais || 0);
      if (mandat.taxes_incluses) {
        montantHTMandat = montantHTMandat / 1.15475; // Recalculer le montant HT si les taxes étaient incluses
      }
      const rabais = mandat.rabais || 0;
      const minutesInfo = mandat.minutes_list && mandat.minutes_list.length > 0 ?
      mandat.minutes_list.map((m) => m.minute).join(', ') :
      mandat.minute || '';

      return `
          <tr>
            <td>
              <div class="bold-item">Travaux réalisés :</div>
              <div class="italic-item">
                ${mandat.type_mandat || 'Mandat'}
                ${minutesInfo ? '<span class="minute-info">Minute: ' + minutesInfo + '</span>' : ''}
              </div>
            </td>
            <td class="amount-cell">${montantHTMandat.toFixed(2)} $</td>
          </tr>
          ${rabais > 0 ? `
            <tr>
              <td>
                <div class="italic-item rabais">Rabais consenti.</div>
              </td>
              <td class="amount-cell rabais">(${rabais.toFixed(2)})</td>
            </tr>
          ` : ''}
        `;
    }).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="totals-left">Merci pour votre confiance !</div>
    <div class="totals-right">
      <table class="totals-table">
        <tr>
          <td>Sous-total :</td>
          <td>${totalHT.toFixed(2)} $</td>
        </tr>
        <tr>
          <td>TPS :</td>
          <td>${tps.toFixed(2)}</td>
        </tr>
        <tr>
          <td>TVQ :</td>
          <td>${tvq.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total :</td>
          <td>${totalTTC.toFixed(2)} $</td>
        </tr>
      </table>
    </div>
  </div>
  
  <div class="footer">
    <div class="fiscal">TPS : 829858554 RT 0001 | TVQ : 1213714127 TQ 0001</div>
    <div class="conditions">Condition : Payable sur réception | Frais d'administration : 2% par mois sur frais de retard</div>
  </div>
  
  <div class="no-print" style="margin-top: 40px; text-align: center;">
    <button onclick="window.print()" style="background: #059669; color: white; padding: 12px 32px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; font-weight: bold;">
      Imprimer / Enregistrer en PDF
    </button>
    <button onclick="window.close()" style="background: #6b7280; color: white; padding: 12px 32px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-left: 10px;">
      Fermer
    </button>
  </div>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    newWindow.document.write(factureHTML);
    newWindow.document.close();

    // Save invoice info to the mandats
    // This logic applies when 'dossier' parameter is provided (from the facturation dialog),
    // indicating we are invoicing an existing, saved dossier that needs to be updated in the DB.
    // If 'dossier' is null, it means we are in the main dossier editing dialog, and changes
    // will be saved with the form submission, so no immediate DB update is needed here.
    if (saveToDatabase && dossier) {
      const updatedMandats = dossier.mandats.map((m, idx) => {
        if (selectedMandatsIndexes && selectedMandatsIndexes.includes(idx)) {
          let mandatHT = (m.prix_estime || 0) - (m.rabais || 0);
          if (m.taxes_incluses) {
            mandatHT = mandatHT / 1.15475; // Calculate HT from TTC
          }
          const mandatTPS = mandatHT * 0.05;
          const mandatTVQ = mandatHT * 0.09975;
          const mandatTTC = mandatHT + mandatTPS + mandatTVQ;

          const newFacture = {
            numero_facture: numeroFacture.toString(),
            date_facture: format(new Date(), "yyyy-MM-dd"),
            total_ht: mandatHT,
            total_ttc: mandatTTC,
            facture_html: factureHTML // Store the generated HTML
          };

          return {
            ...m,
            factures: [...(m.factures || []), newFacture]
          };
        }
        return m;
      });

      await updateDossierMutation.mutateAsync({
        id: dossier.id,
        dossierData: { ...dossier, mandats: updatedMandats }
      });
    }
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
    const byDay = list.filter((item) => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfDay;
    }).length;
    const byWeek = list.filter((item) => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfWeek;
    }).length;
    const byMonth = list.filter((item) => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfMonth;
    }).length;
    const byYear = list.filter((item) => {
      const itemDate = new Date(item[dateKey] + 'T00:00:00');
      return itemDate >= startOfYear;
    }).length;
    const previousDay = list.filter((item) => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousDay && date < startOfDay;
    }).length;
    const previousWeek = list.filter((item) => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousWeek && date < startOfWeek;
    }).length;
    const previousMonth = list.filter((item) => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousMonth && date <= endOfPreviousMonth;
    }).length;
    const previousYear = list.filter((item) => {
      const date = new Date(item[dateKey] + 'T00:00:00');
      return date >= startOfPreviousYear && date <= endOfPreviousYear;
    }).length;
    const calculatePercentage = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round((current - previous) / previous * 100);
    };
    return {
      byDay, byWeek, byMonth, byYear,
      percentages: {
        day: calculatePercentage(byDay, previousDay),
        week: calculatePercentage(byWeek, previousWeek),
        month: calculatePercentage(byMonth, previousMonth),
        year: calculatePercentage(byYear, previousYear)
      }
    };
  };

  const openFacturationDialog = () => {
    setIsFacturationDialogOpen(true);
    setFacturationDossierId(null);
    setSelectedMandatsForFacturation([]);
    setFacturationSearchTerm("");
    setFacturationFilterArpenteur("all");
    setFacturationFilterVille("all");
    setFacturationFilterMandat("all");
  };

  const openFacturationMandatsDialog = () => {
    if (!editingDossier) return;
    setSelectedMandatsForLocalFacturation([]);
    setIsFacturationMandatsDialogOpen(true);
  };

  const toggleMandatForLocalFacturation = (index) => {
    setSelectedMandatsForLocalFacturation((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGenererFactureLocal = async () => {
    if (!editingDossier || selectedMandatsForLocalFacturation.length === 0) return;
    await genererFacture(editingDossier, selectedMandatsForLocalFacturation, true); // Pass editingDossier and true to save
    setIsFacturationMandatsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    // Reload the dossier to update formData
    const refreshedDossier = dossiers.find((d) => d.id === editingDossier.id);
    if (refreshedDossier) {
      setFormData({
        numero_dossier: refreshedDossier.numero_dossier || "",
        arpenteur_geometre: refreshedDossier.arpenteur_geometre || "",
        date_ouverture: refreshedDossier.date_ouverture || new Date().toISOString().split('T')[0],
        statut: refreshedDossier.statut || "Ouvert",
        clients_ids: refreshedDossier.clients_ids || [],
        notaires_ids: refreshedDossier.notaires_ids || [],
        courtiers_ids: refreshedDossier.courtiers_ids || [],
        mandats: refreshedDossier.mandats?.map((m) => ({
          ...m,
          date_ouverture: m.date_ouverture || "",
          minute: m.minute || "",
          date_minute: m.date_minute || "",
          type_minute: m.type_minute || "Initiale",
          minutes_list: m.minutes_list || [],
          tache_actuelle: m.tache_actuelle || "",
          statut_terrain: m.statut_terrain || "",
          adresse_travaux: m.adresse_travaux ? typeof m.adresse_travaux === 'string' ? { rue: m.adresse_travaux, numeros_civiques: [], ville: "", code_postal: "", province: "" } : m.adresse_travaux : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
          lots: m.lots || [],
          prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
          rabais: m.rabais !== undefined ? m.rabais : 0,
          taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
          date_livraison: m.date_livraison || "",
          date_signature: m.date_signature || "",
          date_debut_travaux: "",
          factures: m.factures || [], // Changed from 'facture' to 'factures'
          terrain: m.terrain || {
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
          notes: m.notes || ""
        })) || [],
        description: refreshedDossier.description || ""
      });
    }
  };

  const selectDossierForFacturation = (dossierId) => {
    setFacturationDossierId(dossierId);
    setSelectedMandatsForFacturation([]); // Reset selection when changing dossier
  };

  const toggleMandatForFacturation = (index) => {
    setSelectedMandatsForFacturation((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleGenererFactureFromDialog = async () => {
    if (!facturationDossierId) return;
    const dossier = dossiers.find((d) => d.id === facturationDossierId);
    if (!dossier) return;
    await genererFacture(dossier, selectedMandatsForFacturation, true);
    setIsFacturationDialogOpen(false);
  };

  const dossiersOuverts = dossiers.filter((d) => d.statut === "Ouvert");
  const dossierStats = getCountsByPeriodWithComparison(dossiersOuverts, 'date_ouverture');

  const dossiersWithMandats = useMemo(() => {
    return dossiers.filter((d) => d.statut === "Ouvert" || d.statut === "Fermé").flatMap((dossier) => {
      if (dossier.mandats && dossier.mandats.length > 0) {
        return dossier.mandats.map((mandat, idx) => ({
          ...dossier,
          mandatInfo: mandat,
          mandatIndex: idx,
          displayId: `${dossier.id}-${idx}`
        }));
      }
      return [{ ...dossier, mandatInfo: null, mandatIndex: null, displayId: dossier.id }];
    });
  }, [dossiers]);

  const uniqueVilles = useMemo(() => {
    return [...new Set(dossiersWithMandats.filter((item) => item.mandatInfo?.adresse_travaux?.ville).map((item) => item.mandatInfo.adresse_travaux.ville))].sort();
  }, [dossiersWithMandats]);

  const filteredDossiersWithMandats = useMemo(() => {
    return dossiersWithMandats.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      const fullNumber = getArpenteurInitials(item.arpenteur_geometre) + item.numero_dossier;
      const clientsNames = getClientsNames(item.clients_ids);
      const matchesSearch =
        fullNumber.toLowerCase().includes(searchLower) ||
        item.numero_dossier?.toLowerCase().includes(searchLower) ||
        clientsNames.toLowerCase().includes(searchLower) ||
        item.mandatInfo?.type_mandat?.toLowerCase().includes(searchLower) ||
        item.mandatInfo?.tache_actuelle?.toLowerCase().includes(searchLower) ||
        item.mandatInfo?.adresse_travaux?.rue?.toLowerCase().includes(searchLower) ||
        item.mandatInfo?.adresse_travaux?.ville?.toLowerCase().includes(searchLower);

      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(item.arpenteur_geometre);
      const matchesVille = filterVille.length === 0 || filterVille.includes(item.mandatInfo?.adresse_travaux?.ville);
      const matchesStatut = filterStatut.length === 0 || filterStatut.includes(item.statut);
      const matchesMandat = filterMandat.length === 0 || filterMandat.includes(item.mandatInfo?.type_mandat);
      const matchesTache = filterTache.length === 0 || filterTache.includes(item.mandatInfo?.tache_actuelle);
      
      const matchesDateRange = (() => {
        if (!filterDateDebut && !filterDateFin) return true;
        if (!item.date_ouverture) return false;
        const dateOuverture = new Date(item.date_ouverture);
        const dateDebut = filterDateDebut ? new Date(filterDateDebut) : null;
        const dateFin = filterDateFin ? new Date(filterDateFin) : null;
        if (dateDebut && dateOuverture < dateDebut) return false;
        if (dateFin && dateOuverture > dateFin) return false;
        return true;
      })();
      
      return matchesSearch && matchesArpenteur && matchesVille && matchesStatut && matchesMandat && matchesTache && matchesDateRange;
    });
  }, [dossiersWithMandats, searchTerm, filterArpenteur, filterVille, filterStatut, filterMandat, filterTache, filterDateDebut, filterDateFin, getClientsNames]);

  const handleSort = (field) => {
    setSortField(prevField => {
      if (prevField === field) {
        setSortDirection(prev => prev === "asc" ? "desc" : "asc");
        return field;
      } else {
        setSortDirection("asc");
        return field;
      }
    });
  };

  const hasActiveFilters = () => {
    return filterArpenteur.length > 0 || filterVille.length > 0 || filterStatut.length > 0 || filterMandat.length > 0 || filterTache.length > 0 || filterDateDebut || filterDateFin;
  };

  const getSortIcon = (field) => {
    if (!hasActiveFilters() && sortField !== field) return null;
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline opacity-50" />;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const sortedDossiers = useMemo(() => {
    if (!sortField) return filteredDossiersWithMandats;
    
    const sorted = [...filteredDossiersWithMandats].sort((a, b) => {
      let aValue = "", bValue = "";
      
      switch (sortField) {
        case 'numero_dossier':
          aValue = (getArpenteurInitials(a.arpenteur_geometre) + a.numero_dossier).toLowerCase();
          bValue = (getArpenteurInitials(b.arpenteur_geometre) + b.numero_dossier).toLowerCase();
          break;
        case 'clients': {
          const aClients = a.clients_ids?.map(id => {
            const c = clients.find(cl => cl.id === id);
            return c ? `${c.prenom} ${c.nom}` : "";
          }).join(", ").toLowerCase() || "";
          const bClients = b.clients_ids?.map(id => {
            const c = clients.find(cl => cl.id === id);
            return c ? `${c.prenom} ${c.nom}` : "";
          }).join(", ").toLowerCase() || "";
          aValue = aClients;
          bValue = bClients;
          break;
        }
        case 'lots': {
          const aLot = a.mandatInfo?.lots?.[0] ? lots.find(l => l.id === a.mandatInfo.lots[0])?.numero_lot || '' : '';
          const bLot = b.mandatInfo?.lots?.[0] ? lots.find(l => l.id === b.mandatInfo.lots[0])?.numero_lot || '' : '';
          aValue = aLot.toLowerCase();
          bValue = bLot.toLowerCase();
          break;
        }
        case 'type_mandat':
          aValue = (a.mandatInfo?.type_mandat || '').toLowerCase();
          bValue = (b.mandatInfo?.type_mandat || '').toLowerCase();
          break;
        case 'tache_actuelle':
          aValue = (a.mandatInfo?.tache_actuelle || '').toLowerCase();
          bValue = (b.mandatInfo?.tache_actuelle || '').toLowerCase();
          break;
        case 'ville':
          aValue = (a.mandatInfo?.adresse_travaux?.ville || '').toLowerCase();
          bValue = (b.mandatInfo?.adresse_travaux?.ville || '').toLowerCase();
          break;
        case 'statut':
          aValue = (a.statut || '').toLowerCase();
          bValue = (b.statut || '').toLowerCase();
          break;
        case 'date_ouverture': {
          const aTime = a.date_ouverture ? new Date(a.date_ouverture).getTime() : 0;
          const bTime = b.date_ouverture ? new Date(b.date_ouverture).getTime() : 0;
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }
        case 'date_fermeture': {
          const aTime = a.date_fermeture ? new Date(a.date_fermeture).getTime() : 0;
          const bTime = b.date_fermeture ? new Date(b.date_fermeture).getTime() : 0;
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        }
        default:
          return 0;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
    return sorted;
  }, [filteredDossiersWithMandats, sortField, sortDirection, clients, lots]);

  const handleCloseDossier = () => {
    if (!closingDossierId) return;
    const dossier = dossiers.find((d) => d.id === closingDossierId);
    if (!dossier) return;

    // Vérifier si les minutes existent déjà pour cet arpenteur
    for (let index = 0; index < minutesData.length; index++) {
      const minuteData = minutesData[index];
      if (minuteData?.minute) {
        const minuteExiste = dossiers.some((d) =>
          d.id !== closingDossierId && // Exclure le dossier en cours de fermeture
          d.arpenteur_geometre === dossier.arpenteur_geometre &&
          d.mandats?.some((m) =>
            m.minutes_list?.some((min) => min.minute === minuteData.minute) ||
            m.minute === minuteData.minute
          )
        );

        if (minuteExiste) {
          alert(`La minute ${minuteData.minute} existe déjà pour ${dossier.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
          return;
        }
      }
    }

    const updatedMandats = dossier.mandats.map((mandat, index) => {
      const minuteData = minutesData[index];
      const existingMinutesList = mandat.minutes_list || [];
      
      // Ajouter la nouvelle minute à la liste si elle est fournie
      const newMinutesList = minuteData?.minute && minuteData?.date_minute
        ? [...existingMinutesList, {
            minute: minuteData.minute,
            date_minute: minuteData.date_minute,
            type_minute: minuteData.type_minute || "Initiale"
          }]
        : existingMinutesList;

      return {
        ...mandat,
        minutes_list: newMinutesList,
        minute: minuteData?.minute || mandat.minute || "",
        date_minute: minuteData?.date_minute || mandat.date_minute || "",
        type_minute: minuteData?.type_minute || mandat.type_minute || "Initiale",
        tache_actuelle: "",
        utilisateur_assigne: ""
      };
    });

    updateDossierMutation.mutate({
      id: closingDossierId,
      dossierData: { 
        ...dossier, 
        statut: "Fermé", 
        date_fermeture: new Date().toISOString().split('T')[0],
        mandats: updatedMandats 
      }
    });
  };

  const openCloseDossierDialog = () => {
    if (editingDossier) {
      // If called from editing dialog, auto-select the current dossier
      setClosingDossierId(editingDossier.id);
      if (editingDossier.mandats) {
        setMinutesData(editingDossier.mandats.map((m) => ({
          minute: m.minute || "",
          date_minute: m.date_minute || "",
          type_minute: m.type_minute || "Initiale"
        })));
      }
    } else {
      // Reset if opening from the main list
      setClosingDossierId(null);
      setMinutesData([]);
    }
    setIsDialogOpen(false); // Close the main dossier dialog if it's open
    setIsCloseDossierDialogOpen(true);
    setClosingDossierSearchTerm("");
    setCloseFilterArpenteur("all");
    setCloseFilterVille("all");
    setCloseFilterMandat("all");
  };

  const selectDossierToClose = (dossierId) => {
    setClosingDossierId(dossierId);
    const dossier = dossiers.find((d) => d.id === dossierId);
    if (dossier && dossier.mandats) {
      setMinutesData(dossier.mandats.map((m) => ({
        minute: m.minute || "",
        date_minute: m.date_minute || "",
        type_minute: m.type_minute || "Initiale"
      })));
    }
  };

  const updateMinuteData = (index, field, value) => {
    setMinutesData((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const dossiersOuvertsForClosing = dossiers.filter((d) => d.statut === "Ouvert");

  const filteredDossiersForClosing = dossiersOuvertsForClosing.filter((dossier) => {
    const searchLower = closingDossierSearchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    const clientsNames = getClientsNames(dossier.clients_ids);

    const matchesSearch =
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some((m) => m.type_mandat?.toLowerCase().includes(searchLower));


    const matchesArpenteur = closeFilterArpenteur === "all" || dossier.arpenteur_geometre === closeFilterArpenteur;
    const matchesVille = closeFilterVille === "all" || dossier.mandats?.some((m) => m.adresse_travaux?.ville === closeFilterVille);
    const matchesMandat = closeFilterMandat === "all" || dossier.mandats?.some((m) => m.type_mandat === closeFilterMandat);

    return matchesSearch && matchesArpenteur && matchesVille && matchesMandat;
  });

  const dossiersForFacturation = dossiers.filter((d) => {
    return d.statut === "Ouvert" || d.statut === "Fermé";
  });

  const filteredDossiersForFacturation = dossiersForFacturation.filter((dossier) => {
    const searchLower = facturationSearchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    const clientsNames = getClientsNames(dossier.clients_ids);

    const matchesSearch =
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some((m) => m.type_mandat?.toLowerCase().includes(searchLower));


    const matchesArpenteur = facturationFilterArpenteur === "all" || dossier.arpenteur_geometre === facturationFilterArpenteur;
    const matchesVille = facturationFilterVille === "all" || dossier.mandats?.some((m) => m.adresse_travaux?.ville === facturationFilterVille);
    const matchesMandat = facturationFilterMandat === "all" || dossier.mandats?.some((m) => m.type_mandat === facturationFilterMandat);

    return matchesSearch && matchesArpenteur && matchesVille && matchesMandat;
  });

  const selectedDossierToClose = dossiers.find((d) => d.id === closingDossierId);
  const selectedDossierForFacturation = dossiers.find((d) => d.id === facturationDossierId);

  const toggleTerrainSection = (mandatIndex) => {
    setTerrainSectionExpanded((prev) => ({
      ...prev,
      [mandatIndex]: !prev[mandatIndex]
    }));
  };

  const openAddMinuteDialog = (mandatIndex) => {
    setCurrentMinuteMandatIndex(mandatIndex);
    setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" }); // Reset form for new minute
    setIsAddMinuteDialogOpen(true);
  };

  const handleAddMinuteFromDialog = () => {
    if (currentMinuteMandatIndex !== null && newMinuteForm.minute && newMinuteForm.date_minute) {
      // Vérifier si la minute existe déjà pour cet arpenteur
      const minuteExiste = dossiers.some((d) =>
        d.arpenteur_geometre === formData.arpenteur_geometre &&
        d.mandats?.some((m) =>
          m.minutes_list?.some((min) => min.minute === newMinuteForm.minute) ||
          m.minute === newMinuteForm.minute
        )
      );

      if (minuteExiste) {
        alert(`La minute ${newMinuteForm.minute} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
        return;
      }

      addMinuteToMandat(currentMinuteMandatIndex);
      setIsAddMinuteDialogOpen(false);
      setCurrentMinuteMandatIndex(null);
    }
  };

  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('Le fichier CSV est vide ou invalide.');
        return;
      }

      const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^;]+)(?=\s*;|\s*$)/g) || [];
        const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        
        const row = {};
        headers.forEach((header, index) => {
          row[header] = cleanValues[index] || '';
        });
        data.push(row);
      }

      setImportedData(data);
      setIsImportDialogOpen(true);
    };

    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (importedData.length === 0) return;

    const dossiersNonImportes = [];
    let dossiersImportesCount = 0;

    for (const row of importedData) {
      const numeroDossier = row['N° dossier'] || '';
      const arpenteurGeometre = row['Arpenteur-Géomètre'] || row['Arpenteur-Géomètres'] || '';
      const ttlValue = row['TTL'] || 'Non';
      const mandatsTypes = row['Mandats'] ? row['Mandats'].split(',').map(m => m.trim()).filter(m => m) : [];

      // Vérifier si le dossier existe déjà
      const dossierExistant = dossiers.find((d) =>
        d.numero_dossier === numeroDossier &&
        d.arpenteur_geometre === arpenteurGeometre
      );

      if (dossierExistant) {
        dossiersNonImportes.push({
          numero: `${getArpenteurInitials(arpenteurGeometre)}${numeroDossier}`,
          raison: 'Dossier existant'
        });
        continue;
      }
      
      const dossierData = {
        numero_dossier: numeroDossier,
        arpenteur_geometre: arpenteurGeometre,
        date_ouverture: row["Date d'ouverture"] || new Date().toISOString().split('T')[0],
        date_fermeture: row['Date de fermeture'] || '',
        statut: row['Statut'] || 'Ouvert',
        ttl: ttlValue,
        clients_ids: [],
        clients_texte: row['Clients'] || '',
        notaires_ids: [],
        notaires_texte: '',
        courtiers_ids: [],
        courtiers_texte: '',
        adresse_texte: row['Adresse des travaux'] || '',
        mandats: mandatsTypes.map(typeMandat => ({
          type_mandat: typeMandat,
          tache_actuelle: 'Ouverture',
          adresse_travaux_texte: row['Adresse des travaux'] || '',
          adresse_travaux: ttlValue === "Non" ? {
            ville: '',
            numeros_civiques: [''],
            rue: '',
            code_postal: '',
            province: ''
          } : undefined,
          lots: [],
          lots_texte: '',
          prix_estime: 0,
          rabais: 0,
          taxes_incluses: false,
          date_livraison: '',
          date_signature: '',
          date_debut_travaux: '',
          notes: '',
          minute: '',
          date_minute: '',
          minutes_list: []
        })),
        description: ''
      };

      try {
        await createDossierMutation.mutateAsync(dossierData);
        dossiersImportesCount++;
      } catch (error) {
        dossiersNonImportes.push({
          numero: `${getArpenteurInitials(arpenteurGeometre)}${numeroDossier}`,
          raison: 'Erreur lors de la création'
        });
      }
    }

    setIsImportDialogOpen(false);
    setImportedData([]);

    // Afficher le résultat de l'importation
    if (dossiersNonImportes.length > 0) {
      const message = `${dossiersImportesCount} dossier(s) importé(s) avec succès.\n\n` +
        `${dossiersNonImportes.length} dossier(s) NON importé(s) :\n` +
        dossiersNonImportes.map(d => `- ${d.numero} (${d.raison})`).join('\n');
      alert(message);
    } else {
      alert(`${dossiersImportesCount} dossier(s) importé(s) avec succès !`);
    }
  };

  const handleExportCSV = () => {
    // Préparer les données pour le CSV
    const csvData = sortedDossiers.map(dossier => ({
      'N° Dossier': getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier,
      'Arpenteur': dossier.arpenteur_geometre,
      'TTL': dossier.ttl || 'Non',
      'Clients': getClientsNames(dossier.clients_ids),
      'Type Mandat': dossier.mandatInfo?.type_mandat || '-',
      'Minute': dossier.mandatInfo?.minutes_list && dossier.mandatInfo.minutes_list.length > 0 
        ? dossier.mandatInfo.minutes_list.map(m => m.minute).join(', ')
        : dossier.mandatInfo?.minute || '-',
      'Tâche actuelle': dossier.mandatInfo?.tache_actuelle || '-',
      'Adresse Travaux': formatAdresse(dossier.mandatInfo?.adresse_travaux) || '-',
      'Ville': dossier.mandatInfo?.adresse_travaux?.ville || '-',
      'Date Ouverture': dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "yyyy-MM-dd", { locale: fr }) : '-',
      'Statut': dossier.statut,
      'Prix estimé': dossier.mandatInfo?.prix_estime || 0,
      'Rabais': dossier.mandatInfo?.rabais || 0
    }));

    // Créer le CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Échapper les guillemets et virgules
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    // Télécharger le fichier
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dossiers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDossierConfirm} onOpenChange={setShowDeleteDossierConfirm}>
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
              Êtes-vous sûr de vouloir supprimer le dossier <span className="font-bold text-white">{dossierNameToDelete}</span> ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={() => {
                  setShowDeleteDossierConfirm(false);
                  setDossierIdToDelete(null);
                  setDossierNameToDelete("");
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                onClick={() => {
                  if (dossierIdToDelete) {
                    deleteDossierMutation.mutate(dossierIdToDelete);
                  }
                  setShowDeleteDossierConfirm(false);
                  setDossierIdToDelete(null);
                  setDossierNameToDelete("");
                }}
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Dossiers
              </h1>
              <FolderOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion de vos dossiers d'arpentage</p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg">
              <Download className="w-5 h-5 mr-2" />
              Extraction CSV
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau dossier
                </Button>
              </DialogTrigger>
              <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50" style={{ marginTop: '10px', maxHeight: 'calc(90vh + 10px)' }} hideClose>
                <EditDossierForm
                  formData={formData}
                  setFormData={setFormData}
                  clients={clients}
                  lots={lots}
                  users={users}
                  onSubmit={handleSubmit}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  updateMandat={updateMandat}
                  addMandat={addMandat}
                  removeMandat={removeMandat}
                  openLotSelector={openLotSelector}
                  removeLotFromMandat={removeLotFromMandat}
                  openAddMinuteDialog={openAddMinuteDialog}
                  removeMinuteFromMandat={removeMinuteFromMandat}
                  getLotById={getLotById}
                  setIsClientFormDialogOpen={setIsClientFormDialogOpen}
                  setClientTypeForForm={setClientTypeForForm}
                  setViewingClientDetails={setViewingClientDetails}
                  calculerProchainNumeroDossier={calculerProchainNumeroDossier}
                  editingDossier={editingDossier}
                  onOpenNewLotDialog={(mandatIndex) => {
                    setCurrentMandatIndex(mandatIndex);
                    setIsNewLotDialogOpen(true);
                  }}
                  setEditingClient={setEditingClientForForm}
                  setEditingLot={setEditingLot}
                  setNewLotForm={setNewLotForm}
                  setLotActionLogs={setLotActionLogs}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dialog pour ajouter une minute */}
        <Dialog open={isAddMinuteDialogOpen} onOpenChange={setIsAddMinuteDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md flex flex-col max-h-[90vh] overflow-hidden">
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <DialogTitle className="text-xl">Ajouter une minute</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 px-6">
              <div className="space-y-2">
                <Label>Minute <span className="text-red-400">*</span></Label>
                <Input
                  value={newMinuteForm.minute}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, minute: e.target.value })}
                  placeholder="Ex: 12345"
                  className="bg-slate-800 border-slate-700" />

              </div>
              <div className="space-y-2">
                <Label>Date de minute <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={newMinuteForm.date_minute}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, date_minute: e.target.value })}
                  className="bg-slate-800 border-slate-700" />

              </div>
              <div className="space-y-2">
                <Label>Type de minute <span className="text-red-400">*</span></Label>
                <Select
                  value={newMinuteForm.type_minute}
                  onValueChange={(value) => setNewMinuteForm({ ...newMinuteForm, type_minute: value })}>

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
            </div>
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-800 bg-slate-900">
              <Button type="button" variant="outline" onClick={() => setIsAddMinuteDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleAddMinuteFromDialog}
                disabled={!newMinuteForm.minute || !newMinuteForm.date_minute}
                className="bg-gradient-to-r from-emerald-500 to-teal-600">

                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'importation CSV */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <DialogTitle className="text-2xl">Importation CSV - Aperçu</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300">N° dossier</TableHead>
                    <TableHead className="text-slate-300">Arpenteur-Géomètre</TableHead>
                    <TableHead className="text-slate-300">TTL</TableHead>
                    <TableHead className="text-slate-300">Clients</TableHead>
                    <TableHead className="text-slate-300">Mandats</TableHead>
                    <TableHead className="text-slate-300">Adresse des travaux</TableHead>
                    <TableHead className="text-slate-300">Date d'ouverture</TableHead>
                    <TableHead className="text-slate-300">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedData.map((row, index) => (
                    <TableRow key={index} className="border-slate-800">
                      <TableCell className="text-white">{row['N° dossier'] || '-'}</TableCell>
                      <TableCell className="text-white">{row['Arpenteur-Géomètre'] || row['Arpenteur-Géomètres'] || '-'}</TableCell>
                      <TableCell className="text-white">{row['TTL'] || 'Non'}</TableCell>
                      <TableCell className="text-white text-sm">{row['Clients'] || '-'}</TableCell>
                      <TableCell className="text-white text-sm">{row['Mandats'] || '-'}</TableCell>
                      <TableCell className="text-white text-sm">{row['Adresse des travaux'] || '-'}</TableCell>
                      <TableCell className="text-white">{row["Date d'ouverture"] || '-'}</TableCell>
                      <TableCell className="text-white">{row['Statut'] || 'Ouvert'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <p className="text-slate-400">{importedData.length} dossier(s) à importer</p>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => {
                  setIsImportDialogOpen(false);
                  setImportedData([]);
                }}>
                  Annuler
                </Button>
                <Button type="button" onClick={handleConfirmImport} className="bg-gradient-to-r from-green-500 to-emerald-600">
                  <Check className="w-4 h-4 mr-2" />
                  Confirmer l'importation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for local facturation (from editing dossier) */}
        <Dialog open={isFacturationMandatsDialogOpen} onOpenChange={setIsFacturationMandatsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <DialogTitle className="text-2xl">Sélectionner les mandats à facturer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-2 p-4">
              {formData.mandats.map((mandat, index) => {
                const hasFactures = mandat.factures && mandat.factures.length > 0;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border transition-colors ${
                    selectedMandatsForLocalFacturation.includes(index) ?
                    'bg-emerald-500/20 border-emerald-500/30 cursor-pointer' :
                    'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 cursor-pointer'}`
                    }
                    onClick={() => toggleMandatForLocalFacturation(index)}>

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{mandat.type_mandat || `Mandat ${index + 1}`}</h4>
                        {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) &&
                        <p className="text-slate-400 text-sm mt-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                        }
                      </div>
                      <div className="ml-4 text-right">
                        {(mandat.prix_estime || 0) > 0 &&
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {(mandat.prix_estime || 0).toFixed(2)} $
                          </Badge>
                        }
                        <div className="mt-2">
                          {hasFactures ?
                          <Badge className="bg-purple-500/30 text-purple-400 border-purple-500/50">
                              <FileText className="w-3 h-3 mr-1" />
                              {mandat.factures.length} facture{mandat.factures.length > 1 ? 's' : ''}
                            </Badge> :
                          null}
                          {selectedMandatsForLocalFacturation.includes(index) &&
                          <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50 ml-2">
                              <Check className="w-3 h-3 mr-1" />
                              Sélectionné
                            </Badge>
                          }
                        </div>
                      </div>
                    </div>
                  </div>);

              })}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsFacturationMandatsDialogOpen(false)}>Annuler</Button>
              <Button type="button" onClick={handleGenererFactureLocal} disabled={selectedMandatsForLocalFacturation.length === 0} className="bg-gradient-to-r from-purple-500 to-indigo-600">
                <FileText className="w-4 h-4 mr-2" />
                Générer la facture
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isFacturationDialogOpen} onOpenChange={setIsFacturationDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <DialogTitle className="text-2xl">Générer une facture</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {!facturationDossierId ?
              <>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[250px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <Input placeholder="Rechercher..." value={facturationSearchTerm} onChange={(e) => setFacturationSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
                    </div>
                    <Select value={facturationFilterArpenteur} onValueChange={setFacturationFilterArpenteur}>
                      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Arpenteur" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Tous les arpenteurs</SelectItem>
                        {ARPENTEURS.map((arpenteur) =>
                      <SelectItem key={arpenteur} value={arpenteur}>{arpenteur}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                    <Select value={facturationFilterMandat} onValueChange={setFacturationFilterMandat}>
                      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Mandat" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Tous les mandats</SelectItem>
                        {TYPES_MANDATS.map((type) =>
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                    <Select value={facturationFilterVille} onValueChange={setFacturationFilterVille}>
                      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Ville" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Toutes les villes</SelectItem>
                        {uniqueVilles.map((ville) =>
                      <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-700 rounded-lg">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-800/50 z-10">
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">N° Dossier</TableHead>
                            <TableHead className="text-slate-300">Clients</TableHead>
                            <TableHead className="text-slate-300">Mandats</TableHead>
                            <TableHead className="text-slate-300">Adresse Travaux</TableHead>
                            <TableHead className="text-slate-300 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDossiersForFacturation.length > 0 ?
                        filteredDossiersForFacturation.map((dossier) =>
                        <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800 cursor-pointer" onClick={() => selectDossierForFacturation(dossier.id)}>
                                <TableCell className="font-medium">
                                  <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                    {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">{getClientsNames(dossier.clients_ids)}</TableCell>
                                <TableCell className="text-slate-300">
                                  {dossier.mandats && dossier.mandats.length > 0 ?
                            <div className="flex flex-wrap gap-1">
                                      {dossier.mandats.slice(0, 2).map((mandat, idx) =>
                              <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                          {mandat.type_mandat}
                                        </Badge>
                              )}
                                      {dossier.mandats.length > 2 &&
                              <Badge className="bg-slate-700 text-slate-300 text-xs">
                                          +{dossier.mandats.length - 2}
                                        </Badge>
                              }
                                    </div> :

                            <span className="text-slate-600 text-xs">Aucun</span>
                            }
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {getFirstAdresseTravaux(dossier.mandats)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10">
                                    Sélectionner
                                  </Button>
                                </TableCell>
                              </TableRow>
                        ) :

                        <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun dossier trouvé</p>
                              </TableCell>
                            </TableRow>
                        }
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </> :

              <>
                  <div className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${getArpenteurColor(selectedDossierForFacturation?.arpenteur_geometre)} border mb-2`}>
                          {getArpenteurInitials(selectedDossierForFacturation?.arpenteur_geometre)}{selectedDossierForFacturation?.numero_dossier}
                        </Badge>
                        <span className="text-slate-300 text-sm">{getClientsNames(selectedDossierForFacturation?.clients_ids)}</span>
                      </div>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => {setFacturationDossierId(null);setSelectedMandatsForFacturation([]);}} className="text-slate-400">
                      Changer de dossier
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Label className="text-lg font-semibold text-white mb-3 block">Sélectionner les mandats à facturer</Label>
                    <div className="space-y-2">
                      {selectedDossierForFacturation?.mandats?.map((mandat, index) => {
                      const hasFactures = mandat.factures && mandat.factures.length > 0;
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border transition-colors ${
                          selectedMandatsForFacturation.includes(index) ?
                          'bg-emerald-500/20 border-emerald-500/30 cursor-pointer' :
                          'bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 cursor-pointer'}`
                          }
                          onClick={() => toggleMandatForFacturation(index)}>

                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-white">{mandat.type_mandat || `Mandat ${index + 1}`}</h4>
                                {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) &&
                              <p className="text-slate-400 text-sm mt-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                              }
                                {mandat.lots && mandat.lots.length > 0 &&
                              <div className="flex flex-wrap gap-1 mt-2">
                                    {mandat.lots.map((lotId) => {
                                  const lot = getLotById(lotId);
                                  return (
                                    <Badge key={lotId} variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                                          {lot?.numero_lot || lotId}
                                        </Badge>);

                                })}
                                  </div>
                              }
                              </div>
                              <div className="ml-4 text-right">
                                {(mandat.prix_estime || 0) > 0 &&
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    {(mandat.prix_estime || 0).toFixed(2)} $
                                    {(mandat.rabais || 0) > 0 && ` (-${mandat.rabais.toFixed(2)} $)`}
                                  </Badge>
                              }
                                <div className="mt-2 space-y-1">
                                  {hasFactures &&
                                <Badge className="bg-purple-500/30 text-purple-400 border-purple-500/50 block">
                                      <FileText className="w-3 h-3 mr-1" />
                                      {mandat.factures.length} facture{mandat.factures.length > 1 ? 's' : ''} générée{mandat.factures.length > 1 ? 's' : ''}
                                    </Badge>
                                }
                                  {selectedMandatsForFacturation.includes(index) &&
                                <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50 block">
                                      <Check className="w-3 h-3 mr-1" />
                                      Sélectionné
                                    </Badge>
                                }
                                </div>
                              </div>
                            </div>
                          </div>);

                    })}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsFacturationDialogOpen(false)}>Annuler</Button>
                    <Button type="button" onClick={handleGenererFactureFromDialog} disabled={selectedMandatsForFacturation.length === 0} className="bg-gradient-to-r from-purple-500 to-indigo-600">
                      <FileText className="w-4 h-4 mr-2" />
                      Générer la facture
                    </Button>
                  </div>
                </>
              }
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCloseDossierDialogOpen} onOpenChange={(open) => {
          setIsCloseDossierDialogOpen(open);
          if (!open) {
            setClosingDossierId(null);
            setMinutesData([]);
            setClosingDossierSearchTerm("");
            setCloseFilterArpenteur("all");
            setCloseFilterVille("all");
            setCloseFilterMandat("all");
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <DialogTitle className="text-2xl">Fermer un dossier</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {!closingDossierId ?
              <>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[250px]">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <Input placeholder="Rechercher..." value={closingDossierSearchTerm} onChange={(e) => setClosingDossierSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
                    </div>
                    <Select value={closeFilterArpenteur} onValueChange={setCloseFilterArpenteur}>
                      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Arpenteur" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Tous les arpenteurs</SelectItem>
                        {ARPENTEURS.map((arpenteur) =>
                      <SelectItem key={arpenteur} value={arpenteur}>{arpenteur}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                    <Select value={closeFilterMandat} onValueChange={setCloseFilterMandat}>
                      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Mandat" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Tous les mandats</SelectItem>
                        {TYPES_MANDATS.map((type) =>
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                    <Select value={closeFilterVille} onValueChange={setCloseFilterVille}>
                      <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                        <SelectValue placeholder="Ville" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all">Toutes les villes</SelectItem>
                        {uniqueVilles.map((ville) =>
                      <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 overflow-hidden border border-slate-700 rounded-lg">
                    <div className="max-h-[500px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-800/50 z-10">
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">N° Dossier</TableHead>
                            <TableHead className="text-slate-300">Clients</TableHead>
                            <TableHead className="text-slate-300">Mandats</TableHead>
                            <TableHead className="text-slate-300">Adresse Travaux</TableHead>
                            <TableHead className="text-slate-300 text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDossiersForClosing.length > 0 ?
                        filteredDossiersForClosing.map((dossier) =>
                        <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800 cursor-pointer" onClick={() => selectDossierToClose(dossier.id)}>
                                <TableCell className="font-medium">
                                  <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                    {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">{getClientsNames(dossier.clients_ids)}</TableCell>
                                <TableCell className="text-slate-300">
                                  {dossier.mandats && dossier.mandats.length > 0 ?
                            <div className="flex flex-wrap gap-1">
                                      {dossier.mandats.slice(0, 2).map((mandat, idx) =>
                              <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                          {mandat.type_mandat}
                                        </Badge>
                              )}
                                      {dossier.mandats.length > 2 &&
                              <Badge className="bg-slate-700 text-slate-300 text-xs">
                                          +{dossier.mandats.length - 2}
                                        </Badge>
                              }
                                    </div> :

                            <span className="text-slate-600 text-xs">Aucun</span>
                            }
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {getFirstAdresseTravaux(dossier.mandats)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10">
                                    Sélectionner
                                  </Button>
                                </TableCell>
                              </TableRow>
                        ) :

                        <TableRow>
                              <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun dossier ouvert trouvé</p>
                              </TableCell>
                            </TableRow>
                        }
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </> :

              <>
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                    <div>
                      <Badge variant="outline" className={`${getArpenteurColor(selectedDossierToClose?.arpenteur_geometre)} border mb-2`}>{getArpenteurInitials(selectedDossierToClose?.arpenteur_geometre)}{selectedDossierToClose?.numero_dossier}</Badge>
                      <p className="text-slate-300 text-sm">{getClientsNames(selectedDossierToClose?.clients_ids)}</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => {setClosingDossierId(null);setMinutesData([]);}} className="text-slate-400">
                      Changer de dossier
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <Label className="text-lg font-semibold text-white mb-3 block">Informations de minutes par mandat</Label>
                    <div className="space-y-4">
                      {selectedDossierToClose?.mandats?.map((mandat, index) =>
                    <Card key={index} className="border-slate-700 bg-slate-800/30">
                          <CardContent className="p-4 space-y-3">
                            <h4 className="font-semibold text-emerald-400">{mandat.type_mandat || `Mandat ${index + 1}`}</h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <Label>Minute <span className="text-red-400">*</span></Label>
                                <Input value={minutesData[index]?.minute || ""} onChange={(e) => updateMinuteData(index, 'minute', e.target.value)} placeholder="Ex: 12345" required className="bg-slate-700 border-slate-600" />
                              </div>
                              <div className="space-y-2">
                                <Label>Date de minute <span className="text-red-400">*</span></Label>
                                <Input type="date" value={minutesData[index]?.date_minute || ""} onChange={(e) => updateMinuteData(index, 'date_minute', e.target.value)} required className="bg-slate-700 border-slate-600" />
                              </div>
                              <div className="space-y-2">
                                <Label>Type de minute <span className="text-red-400">*</span></Label>
                                <Select value={minutesData[index]?.type_minute || "Initiale"} onValueChange={(value) => updateMinuteData(index, 'type_minute', value)}>
                                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="Initiale" className="text-white">Initiale</SelectItem>
                                    <SelectItem value="Remplace" className="text-white">Remplace</SelectItem>
                                    <SelectItem value="Corrige" className="text-white">Corrige</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                    )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsCloseDossierDialogOpen(false)}>Annuler</Button>
                    <Button type="button" onClick={handleCloseDossier} disabled={!minutesData.every((m) => m.minute && m.date_minute && m.type_minute)} className="bg-gradient-to-r from-red-500 to-pink-600">
                      <Check className="w-4 h-4 mr-2" />
                      Fermer le dossier
                    </Button>
                  </div>
                </>
              }
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de sélection des clients */}
        <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">Sélectionner les clients</DialogTitle>
                <Button
                  variant="outline"
                  onClick={() => {setIsClientFormDialogOpen(true);setClientTypeForForm("Client");setIsClientSelectorOpen(false);}}
                  className="bg-blue-500 hover:bg-blue-600 border-0 text-white">

                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
            </DialogHeader>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input placeholder="Rechercher un client..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4">
                {filteredClientsForSelector.length > 0 ?
                filteredClientsForSelector.map((client) =>
                <div
                  key={client.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  formData.clients_ids.includes(client.id) ?
                  'bg-blue-500/20 border border-blue-500/30' :
                  'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`
                  }
                  onClick={() => toggleClient(client.id, 'clients')}>

                      <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {client.adresses?.find((a) => a.actuelle) && formatAdresse(client.adresses.find((a) => a.actuelle)) &&
                    <p className="truncate">📍 {formatAdresse(client.adresses.find((a) => a.actuelle))}</p>
                    }
                        {client.courriels?.find((c) => c.actuel)?.courriel &&
                    <p className="truncate">✉️ {client.courriels.find((c) => c.actuel).courriel}</p>
                    }
                        {client.telephones?.find((t) => t.actuel)?.telephone &&
                    <p>
                      📞 <a 
                        href={`tel:${client.telephones.find((t) => t.actuel).telephone.replace(/\D/g, '')}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {client.telephones.find((t) => t.actuel).telephone}
                      </a>
                    </p>
                    }
                      </div>
                      <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent toggling selection
                      setIsClientSelectorOpen(false);
                      handleEdit(client);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 mt-2 w-full">

                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                ) :

                <div className="col-span-2 text-center py-12 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun client trouvé</p>
                  </div>
                }
              </div>
            </div>
            <div className="flex justify-end items-center pt-4 border-t border-slate-800">
              <Button onClick={() => setIsClientSelectorOpen(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de sélection des notaires */}
        <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">Sélectionner les notaires</DialogTitle>
                <Button
                  variant="outline"
                  onClick={() => {setIsClientFormDialogOpen(true);setClientTypeForForm("Notaire");setIsNotaireSelectorOpen(false);}}
                  className="bg-purple-500 hover:bg-purple-600 border-0 text-white">

                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
            </DialogHeader>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input placeholder="Rechercher un notaire..." value={notaireSearchTerm} onChange={(e) => setNotaireSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4">
                {filteredNotairesForSelector.length > 0 ?
                filteredNotairesForSelector.map((notaire) =>
                <div
                  key={notaire.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  formData.notaires_ids.includes(notaire.id) ?
                  'bg-purple-500/20 border border-purple-500/30' :
                  'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`
                  }
                  onClick={() => toggleClient(notaire.id, 'notaires')}>

                      <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {notaire.adresses?.find((a) => a.actuelle) && formatAdresse(notaire.adresses.find((a) => a.actuelle)) &&
                    <p className="truncate">📍 {formatAdresse(notaire.adresses.find((a) => a.actuelle))}</p>
                    }
                        {notaire.courriels?.find((c) => c.actuel)?.courriel &&
                    <p className="truncate">✉️ {notaire.courriels.find((c) => c.actuel).courriel}</p>
                    }
                        {notaire.telephones?.find((t) => t.actuel)?.telephone &&
                    <p>
                      📞 <a 
                        href={`tel:${notaire.telephones.find((t) => t.actuel).telephone.replace(/\D/g, '')}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {notaire.telephones.find((t) => t.actuel).telephone}
                      </a>
                    </p>
                    }
                      </div>
                      <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsNotaireSelectorOpen(false);
                      handleEdit(notaire);
                    }}
                    className="text-purple-400 hover:text-purple-300 mt-2 w-full">

                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                ) :

                <div className="col-span-2 text-center py-12 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun notaire trouvé</p>
                  </div>
                }
              </div>
            </div>
            <div className="flex justify-end items-center pt-4 border-t border-slate-800">
              <Button onClick={() => setIsNotaireSelectorOpen(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de sélection des courtiers */}
        <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl">Sélectionner les courtiers immobiliers</DialogTitle>
                <Button
                  variant="outline"
                  onClick={() => {setIsClientFormDialogOpen(true);setClientTypeForForm("Courtier immobilier");setIsCourtierSelectorOpen(false);}}
                  className="bg-orange-500 hover:bg-orange-600 border-0 text-white">

                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau
                </Button>
              </div>
            </DialogHeader>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input placeholder="Rechercher un courtier..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 p-4">
                {filteredCourtiersForSelector.length > 0 ?
                filteredCourtiersForSelector.map((courtier) =>
                <div
                  key={courtier.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  formData.courtiers_ids.includes(courtier.id) ?
                  'bg-orange-500/20 border border-orange-500/30' :
                  'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'}`
                  }
                  onClick={() => toggleClient(courtier.id, 'courtiers')}>

                      <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {courtier.adresses?.find((a) => a.actuelle) && formatAdresse(courtier.adresses.find((a) => a.actuelle)) &&
                    <p className="truncate">📍 {formatAdresse(courtier.adresses.find((a) => a.actuelle))}</p>
                    }
                        {courtier.courriels?.find((c) => c.actuel)?.courriel &&
                    <p className="truncate">✉️ {courtier.courriels.find((c) => c.actuel).courriel}</p>
                    }
                        {courtier.telephones?.find((t) => t.actuel)?.telephone &&
                    <p>
                      📞 <a 
                        href={`tel:${courtier.telephones.find((t) => t.actuel).telephone.replace(/\D/g, '')}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {courtier.telephones.find((t) => t.actuel).telephone}
                      </a>
                    </p>
                    }
                      </div>
                      <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCourtierSelectorOpen(false);
                      handleEdit(courtier);
                    }}
                    className="text-orange-400 hover:text-orange-300 mt-2 w-full">

                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                ) :

                <div className="col-span-2 text-center py-12 text-slate-500">
                    <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun courtier trouvé</p>
                  </div>
                }
              </div>
            </div>
            <div className="flex justify-end items-center pt-4 border-t border-slate-800">
              <Button onClick={() => setIsCourtierSelectorOpen(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
            </div>
          </DialogContent>
        </Dialog>

        <ClientFormDialog open={isClientFormDialogOpen} onOpenChange={(open) => {setIsClientFormDialogOpen(open);if (!open) setEditingClientForForm(null);}} editingClient={editingClientForForm} defaultType={clientTypeForForm} onSuccess={() => {queryClient.invalidateQueries({ queryKey: ['clients'] });if (clientTypeForForm === "Client") setIsClientSelectorOpen(true);if (clientTypeForForm === "Notaire") setIsNotaireSelectorOpen(true);if (clientTypeForForm === "Courtier immobilier") setIsCourtierSelectorOpen(true);}} />

        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">
                Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-6">
              {viewingClientDetails &&
              <ClientDetailView
                client={viewingClientDetails} />

              }
            </div>
          </DialogContent>
        </Dialog>



        <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {setIsLotSelectorOpen(open);if (!open) {setLotSearchTerm("");setLotCadastreFilter("Québec");}}}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
              <DialogTitle className="text-2xl">Sélectionner des lots</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher par numéro, rang..."
                    value={lotSearchTerm}
                    onChange={(e) => setLotSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700" />

                </div>
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
                  onClick={() => {
                    setIsLotSelectorOpen(false);
                    setIsNewLotDialogOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600">

                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau lot
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700 sticky top-0 z-10">
                      <TableHead className="text-slate-300">Numéro de lot</TableHead>
                      <TableHead className="text-slate-300">Circonscription</TableHead>
                      <TableHead className="text-slate-300">Cadastre</TableHead>
                      <TableHead className="text-slate-300">Rang</TableHead>
                      <TableHead className="text-slate-300 text-right">Sélection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLotsForSelector.length > 0 ?
                    filteredLotsForSelector.map((lot) => {
                      const isSelected = currentMandatIndex !== null &&
                      formData.mandats[currentMandatIndex]?.lots?.includes(lot.id);
                      return (
                        <TableRow
                          key={lot.id}
                          className={`cursor-pointer transition-colors border-slate-800 ${
                          isSelected ?
                          'bg-emerald-500/20 hover:bg-emerald-500/30' :
                          'hover:bg-slate-800/30'}`
                          }
                          onClick={() => addLotToCurrentMandat(lot.id)}>

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
                              {isSelected &&
                            <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50">
                                  <Check className="w-3 h-3 mr-1" />
                                  Sélectionné
                                </Badge>
                            }
                            </TableCell>
                          </TableRow>);

                    }) :

                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="text-slate-400">
                            <Grid3x3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun lot trouvé</p>
                            <p className="text-sm mt-2">Essayez de modifier vos filtres ou créez un nouveau lot</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    }
                  </TableBody>
                </Table>
              </div>

              <Button onClick={() => setIsLotSelectorOpen(false)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
                Valider la sélection
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isNewLotDialogOpen} onOpenChange={(open) => {
          if (!open) {
            let hasChanges = false;
            if (editingLot) {
              hasChanges = newLotForm.numero_lot !== editingLot.numero_lot || 
                newLotForm.circonscription_fonciere !== editingLot.circonscription_fonciere ||
                newLotForm.cadastre !== editingLot.cadastre ||
                newLotForm.rang !== editingLot.rang ||
                JSON.stringify(newLotForm.types_operation) !== JSON.stringify(editingLot.types_operation) ||
                commentairesTemporairesLot.length > 0;
            } else {
              hasChanges = newLotForm.numero_lot || 
                newLotForm.circonscription_fonciere || 
                newLotForm.rang || 
                newLotForm.types_operation.length > 0 ||
                commentairesTemporairesLot.length > 0;
            }
            
            if (hasChanges) {
              if (confirm("Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.")) {
                setIsNewLotDialogOpen(false);
                resetNewLotForm();
              }
            } else {
              setIsNewLotDialogOpen(false);
              resetNewLotForm();
            }
          } else {
            setIsNewLotDialogOpen(open);
          }
        }}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">{editingLot ? "Modifier lot" : "Nouveau lot"}</DialogTitle>
            </DialogHeader>
            
            <motion.div 
              className="flex flex-col h-[90vh]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-[0_0_70%] overflow-y-auto p-4 border-r border-slate-800">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
                  </div>
                  
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

                    <TypesOperationStepForm
                      typesOperation={newLotForm.types_operation || []}
                      onTypesOperationChange={(data) => setNewLotForm({...newLotForm, types_operation: data})}
                      isCollapsed={typesOperationCollapsed}
                      onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                      allLots={lots}
                    />

                    <DocumentsStepFormLot
                      lotNumero={newLotForm.numero_lot || ""}
                      circonscription={newLotForm.circonscription_fonciere || ""}
                      isCollapsed={lotDocumentsCollapsed}
                      onToggleCollapse={() => setLotDocumentsCollapsed(!lotDocumentsCollapsed)}
                      disabled={false}
                    />
                  </form>
                </div>

                <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
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

              <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir annuler ?")) {
                    setIsNewLotDialogOpen(false);
                    resetNewLotForm();
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

        {/* Dialog de succès d'import .d01 */}
        <Dialog open={showD01ImportSuccess} onOpenChange={setShowD01ImportSuccess}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3">
                <span className="text-2xl">✅</span>
                Succès
                <span className="text-2xl">✅</span>
              </DialogTitle>
            </DialogHeader>
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-slate-300 text-center">
                Données importées avec succès depuis le fichier .d01
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowD01ImportSuccess(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>



        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-2">
          <CardHeader className="pb-2">
            <div className="space-y-3">
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
                  className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="text-sm">Filtres</span>
                  {(filterArpenteur.length > 0 || filterStatut.length > 0 || filterMandat.length > 0 || filterTache.length > 0 || filterVille.length > 0 || filterDateDebut || filterDateFin) && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {filterArpenteur.length + filterStatut.length + filterMandat.length + filterTache.length + filterVille.length + (filterDateDebut ? 1 : 0) + (filterDateFin ? 1 : 0)}
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
                        {(filterArpenteur.length > 0 || filterStatut.length > 0 || filterMandat.length > 0 || filterTache.length > 0 || filterVille.length > 0 || filterDateDebut || filterDateFin) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFilterArpenteur([]);
                              setFilterStatut([]);
                              setFilterMandat([]);
                              setFilterTache([]);
                              setFilterVille([]);
                              setFilterDateDebut("");
                              setFilterDateFin("");
                            }}
                            className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                          >
                            <X className="w-2.5 h-2.5 mr-1" />
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
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

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Statuts ({filterStatut.length > 0 ? `${filterStatut.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            <DropdownMenuCheckboxItem
                              checked={filterStatut.includes("Ouvert")}
                              onCheckedChange={(checked) => {
                                setFilterStatut(
                                  checked
                                    ? [...filterStatut, "Ouvert"]
                                    : filterStatut.filter((s) => s !== "Ouvert")
                                );
                              }}
                              className="text-white"
                            >
                              Ouvert
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={filterStatut.includes("Fermé")}
                              onCheckedChange={(checked) => {
                                setFilterStatut(
                                  checked
                                    ? [...filterStatut, "Fermé"]
                                    : filterStatut.filter((s) => s !== "Fermé")
                                );
                              }}
                              className="text-white"
                            >
                              Fermé
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Mandats ({filterMandat.length > 0 ? `${filterMandat.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                            {TYPES_MANDATS.map((type) => (
                              <DropdownMenuCheckboxItem
                                key={type}
                                checked={filterMandat.includes(type)}
                                onCheckedChange={(checked) => {
                                  setFilterMandat(
                                    checked
                                      ? [...filterMandat, type]
                                      : filterMandat.filter((t) => t !== type)
                                  );
                                }}
                                className="text-white"
                              >
                                {type}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Tâches ({filterTache.length > 0 ? `${filterTache.length}` : 'Toutes'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                            {TACHES.map((tache) => (
                              <DropdownMenuCheckboxItem
                                key={tache}
                                checked={filterTache.includes(tache)}
                                onCheckedChange={(checked) => {
                                  setFilterTache(
                                    checked
                                      ? [...filterTache, tache]
                                      : filterTache.filter((t) => t !== tache)
                                  );
                                }}
                                className="text-white"
                              >
                                {tache}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                            {uniqueVilles.map((ville) => (
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

                      <div className="space-y-1 pt-1 border-t border-emerald-500/30">
                        <Label className="text-xs text-emerald-500">Période d'ouverture</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="date"
                            value={filterDateDebut}
                            onChange={(e) => setFilterDateDebut(e.target.value)}
                            placeholder="Du"
                            className="flex-1 text-emerald-500 h-8 text-xs px-2 border-none bg-transparent"
                          />
                          <span className="text-emerald-500 text-xs">→</span>
                          <Input
                            type="date"
                            value={filterDateFin}
                            onChange={(e) => setFilterDateFin(e.target.value)}
                            placeholder="Au"
                            className="flex-1 text-emerald-500 h-8 text-xs px-2 border-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardHeader>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardContent className="p-0">
            {isLoading ?
            <div className="text-center py-8 text-slate-500">Chargement des dossiers...</div> :

            <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300 w-8"></TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('numero_dossier')}>N° Dossier {getSortIcon('numero_dossier')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('clients')}>Clients {getSortIcon('clients')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('type_mandat')}>Mandat {getSortIcon('type_mandat')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('lots')}>Lot {getSortIcon('lots')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('tache_actuelle')}>Tâche actuelle {getSortIcon('tache_actuelle')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('ville')}>Adresse Travaux {getSortIcon('ville')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('date_ouverture')}>Date ouverture {getSortIcon('date_ouverture')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('date_fermeture')}>Date fermeture {getSortIcon('date_fermeture')}</TableHead>
                      <TableHead className="text-slate-300 cursor-pointer" onClick={() => handleSort('statut')}>Statut {getSortIcon('statut')}</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDossiers.length > 0 ?
                  sortedDossiers.map((dossier) =>
                  <TableRow
                    key={dossier.id}
                    className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                    onClick={() => handleEdit(dossier)}>

                          <TableCell className="text-center">
                            {dossier.ttl === "Oui" && (
                              <div className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">TTL</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-white">
                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.ttl === "Oui" ? (dossier.clients_texte || "-") : getClientsNames(dossier.clients_ids)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.mandatInfo?.type_mandat ? (
                              <Badge className={`${getMandatColor(dossier.mandatInfo.type_mandat)} border text-xs`}>
                                {getAbbreviatedMandatType(dossier.mandatInfo.type_mandat)}
                              </Badge>
                            ) : (
                              <span className="text-slate-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {dossier.ttl === "Oui" ? (
                              dossier.mandatInfo?.lots_texte ? (
                                <div className="flex flex-col gap-0.5">
                                  {dossier.mandatInfo.lots_texte.split('\n').filter(l => l.trim()).map((lot, idx) => (
                                    <div key={idx}>{lot.trim()}</div>
                                  ))}
                                </div>
                              ) : "-"
                            ) : (
                              dossier.mandatInfo?.lots && dossier.mandatInfo.lots.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {dossier.mandatInfo.lots.map((lotId) => {
                                    const lot = lots.find(l => l.id === lotId);
                                    return lot ? <div key={lotId}>{lot.numero_lot}</div> : null;
                                  })}
                                </div>
                              ) : "-"
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.mandatInfo?.tache_actuelle &&
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{dossier.mandatInfo.tache_actuelle}</Badge>
                      }
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.ttl === "Oui" ? (dossier.adresse_texte || dossier.mandatInfo?.adresse_travaux_texte || "-") : getFirstAdresseTravaux(dossier.mandats)}
                          </TableCell>
                          <TableCell className="text-slate-300">{dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "dd MMM yyyy", { locale: fr }) : '-'}</TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.date_fermeture ? format(new Date(dossier.date_fermeture), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border ${dossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{dossier.statut}</Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(dossier.id, getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                  ) :

                  <TableRow>
                        <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Aucun dossier trouvé.</p>
                        </TableCell>
                      </TableRow>
                  }
                  </TableBody>
                  </Table>
                  </div>
                  }
                  </CardContent>
                  </Card>
                  </div>
                  </div>
                  );
                  }