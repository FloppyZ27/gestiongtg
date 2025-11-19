import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, User, X, UserPlus, Check, Upload, FileText, ExternalLink, Grid3x3, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Package, Download, FileUp } from "lucide-react";
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

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

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
    circonscription_fonciere: "",
    cadastre: "",
    rang: "",
    numero_lot: "",
    concordance_anterieur: "",
    document_pdf_url: ""
  });
  const [uploadingLotPdf, setUploadingLotPdf] = useState(false);
  const [activeTabMandat, setActiveTabMandat] = useState("0");
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterVille, setFilterVille] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterMandat, setFilterMandat] = useState("all");
  const [filterTache, setFilterTache] = useState("all");
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

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_fermeture: "",
    statut: "Ouvert",
    ttl: "Non",
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsDialogOpen(false);
      resetForm();
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
    onSuccess: () => {
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
    mutationFn: (lotData) => base44.entities.Lot.create(lotData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsNewLotDialogOpen(false);
      resetNewLotForm();
    }
  });

  const clientsReguliers = clients.filter((c) => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter((c) => c.type_client === 'Notaire');
  const courtiers = clients.filter((c) => c.type_client === 'Courtier immobilier');

  const getClientById = (id) => clients.find((c) => c.id === id);
  const getLotById = (numeroLot) => lots.find((l) => l.id === numeroLot);
  const getUserByEmail = (email) => users.find((u) => u.email === email);

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
      const matchesCirconscription = lotCirconscriptionFilter === "all" || lot.circonscription_fonciere === lotCirconscriptionFilter;
      const matchesCadastre = lotCadastreFilter === "all" || lot.cadastre === lotCadastreFilter;
      return matchesSearch && matchesCirconscription && matchesCadastre;
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

  const handleNewLotSubmit = (e) => {
    e.preventDefault();
    createLotMutation.mutate(newLotForm);
  };

  const handleLotFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLotPdf(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setNewLotForm({ ...newLotForm, document_pdf_url: result.file_url });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    } finally {
      setUploadingLotPdf(false);
    }
  };

  const handleLotCirconscriptionChange = (value) => {
    setNewLotForm({ ...newLotForm, circonscription_fonciere: value, cadastre: "" });
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
      circonscription_fonciere: "",
      cadastre: "",
      rang: "",
      numero_lot: "",
      concordance_anterieur: "",
      document_pdf_url: ""
    });
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${nom} ? Cette action est irréversible.`)) {
      deleteDossierMutation.mutate(id);
    }
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
    const defaultAdresse = firstMandat?.adresse_travaux ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" };
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
        tache_actuelle: "",
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

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map((id) => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
  };

  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return "-";
    return formatAdresse(mandats[0].adresse_travaux);
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

  const dossiersWithMandats = dossiers.filter((d) => d.statut === "Ouvert" || d.statut === "Fermé").flatMap((dossier) => {
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

  const uniqueVilles = [...new Set(dossiersWithMandats.filter((item) => item.mandatInfo?.adresse_travaux?.ville).map((item) => item.mandatInfo.adresse_travaux.ville))].sort();

  const filteredDossiersWithMandats = dossiersWithMandats.filter((item) => {
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

    const matchesArpenteur = filterArpenteur === "all" || item.arpenteur_geometre === filterArpenteur;
    const matchesVille = filterVille === "all" || item.mandatInfo?.adresse_travaux?.ville === filterVille;
    const matchesStatut = filterStatut === "all" || item.statut === filterStatut;
    const matchesMandat = filterMandat === "all" || item.mandatInfo?.type_mandat === filterMandat;
    const matchesTache = filterTache === "all" || item.mandatInfo?.tache_actuelle === filterTache;
    return matchesSearch && matchesArpenteur && matchesVille && matchesStatut && matchesMandat && matchesTache;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const sortedDossiers = [...filteredDossiersWithMandats].sort((a, b) => {
    if (!sortField) return 0;
    let aValue, bValue;
    switch (sortField) {
      case 'numero_dossier':
        aValue = (getArpenteurInitials(a.arpenteur_geometre) + a.numero_dossier).toLowerCase();
        bValue = (getArpenteurInitials(b.arpenteur_geometre) + b.numero_dossier).toLowerCase();
        break;
      case 'clients':
        aValue = getClientsNames(a.clients_ids).toLowerCase();
        bValue = getClientsNames(b.clients_ids).toLowerCase();
        break;
      case 'date_ouverture':
        aValue = a.date_ouverture ? new Date(a.date_ouverture).getTime() : 0;
        bValue = b.date_ouverture ? new Date(b.date_ouverture).getTime() : 0;
        break;
      case 'statut':
        aValue = (a.statut || '').toLowerCase();
        bValue = (b.statut || '').toLowerCase();
        break;
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
      case 'date_fermeture':
        aValue = a.date_fermeture ? new Date(a.date_fermeture).getTime() : 0;
        bValue = b.date_fermeture ? new Date(b.date_fermeture).getTime() : 0;
        break;
      default:
        return 0;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }
  });

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

            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
                id="csv-import-input"
              />
              <Button
                onClick={() => document.getElementById('csv-import-input').click()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
                <FileUp className="w-5 h-5 mr-2" />
                Importation CSV
              </Button>
            </div>

            <Button
              onClick={openFacturationDialog}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/50">
              <FileText className="w-5 h-5 mr-2" />
              Facturation
            </Button>

            <Button
              onClick={openCloseDossierDialog}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg shadow-red-500/50">
              <Check className="w-5 h-5 mr-2" />
              Fermer dossier
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
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
                <DialogHeader className="sr-only">
                  <DialogTitle className="text-2xl">{editingDossier ? "Modifier le dossier" : "Nouveau dossier"}</DialogTitle>
                </DialogHeader>
                <div className="flex h-[90vh]">
                  <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                    <div className="mb-6 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-white">{editingDossier ? "Modifier le dossier" : "Nouveau dossier"}</h2>
                        {formData.ttl === "Oui" && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span className="text-indigo-400 font-semibold text-sm tracking-wide">TTL</span>
                          </div>
                        )}
                      </div>
                      {editingDossier && formData.ttl === "Non" &&
                      <div className="flex gap-2">
                          <Button
                          type="button"
                          onClick={openFacturationMandatsDialog}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white">

                            <FileText className="w-5 h-5 mr-2" />
                            Facturation
                          </Button>
                          {editingDossier.statut !== "Fermé" &&
                          <Button
                          type="button"
                          onClick={openCloseDossierDialog}
                          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white">

                            <Check className="w-5 h-5 mr-2" />
                            Fermer dossier
                          </Button>
                          }
                        </div>
                      }
                    </div>
                    <form id="dossier-form" onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                          <Select value={formData.arpenteur_geometre} onValueChange={(value) => setFormData({ ...formData, arpenteur_geometre: value })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {ARPENTEURS.map((arpenteur) =>
                              <SelectItem key={arpenteur} value={arpenteur} className="text-white">{arpenteur}</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>N° de dossier <span className="text-red-400">*</span></Label>
                          <Input value={formData.numero_dossier} onChange={(e) => setFormData({ ...formData, numero_dossier: e.target.value })} required placeholder="Ex: 2024-001" className="bg-slate-800 border-slate-700" />
                        </div>
                        <div className="space-y-2">
                          <Label>Statut <span className="text-red-400">*</span></Label>
                          <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Sélectionner le statut" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="Ouvert" className="text-white">Ouvert</SelectItem>
                              <SelectItem value="Fermé" className="text-white">Fermé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date d'ouverture <span className="text-red-400">*</span></Label>
                          <Input type="date" value={formData.date_ouverture} onChange={(e) => setFormData({ ...formData, date_ouverture: e.target.value })} required className="bg-slate-800 border-slate-700" />
                        </div>
                        {formData.statut === "Fermé" && (
                          <div className="space-y-2">
                            <Label>Date de fermeture</Label>
                            <Input type="date" value={formData.date_fermeture || ""} onChange={(e) => setFormData({ ...formData, date_fermeture: e.target.value })} className="bg-slate-800 border-slate-700" />
                          </div>
                        )}
                      </div>

                      <div className={`grid ${formData.ttl === "Oui" ? "grid-cols-1" : "grid-cols-3"} gap-4`}>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <Label>Clients</Label>
                            {formData.ttl === "Non" && (
                              <Button type="button" size="sm" onClick={() => setIsClientSelectorOpen(true)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Ajouter
                              </Button>
                            )}
                          </div>
                          {formData.ttl === "Oui" ? (
                            <Textarea
                              value={formData.clients_texte}
                              onChange={(e) => setFormData({...formData, clients_texte: e.target.value})}
                              placeholder="Entrer les noms des clients..."
                              className="bg-slate-800 border-slate-700 min-h-[100px]"
                            />
                          ) : formData.clients_ids.length > 0 ?
                          <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                              {formData.clients_ids.map((clientId) => {
                              const client = getClientById(clientId);
                              return client ?
                              <div key={clientId} className="space-y-1">
                                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30 relative pr-8 w-full justify-start">
                                      <span onClick={() => setViewingClientDetails(client)} className="cursor-pointer flex-1">{client.prenom} {client.nom}</span>
                                      <button type="button" onClick={(e) => {e.stopPropagation();removeClient(clientId, 'clients');}} className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                    {client.preferences_livraison && client.preferences_livraison.length > 0 &&
                                <div className="flex gap-1 ml-2">
                                        <Package className="w-3 h-3 text-slate-500 mt-0.5" />
                                        <span className="text-xs text-slate-400">
                                          {client.preferences_livraison.join(', ')}
                                        </span>
                                      </div>
                                }
                                  </div> :
                              null;
                            })}
                            </div> :

                          <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">Aucun client</p>
                          }
                        </div>

                        {formData.ttl === "Non" && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-2">
                              <Label>Notaires</Label>
                              <Button type="button" size="sm" onClick={() => setIsNotaireSelectorOpen(true)} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                            {formData.notaires_ids.length > 0 ?
                          <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                              {formData.notaires_ids.map((notaireId) => {
                              const notaire = getClientById(notaireId);
                              return notaire ?
                              <div key={notaireId} className="space-y-1">
                                    <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 relative pr-8 w-full justify-start">
                                      <span onClick={() => setViewingClientDetails(notaire)} className="cursor-pointer flex-1">{notaire.prenom} {notaire.nom}</span>
                                      <button type="button" onClick={(e) => {e.stopPropagation();removeClient(notaireId, 'notaires');}} className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                    {notaire.preferences_livraison && notaire.preferences_livraison.length > 0 &&
                                <div className="flex gap-1 ml-2">
                                        <Package className="w-3 h-3 text-slate-500 mt-0.5" />
                                        <span className="text-xs text-slate-400">
                                          {notaire.preferences_livraison.join(', ')}
                                        </span>
                                      </div>
                                }
                                  </div> :
                              null;
                            })}
                            </div> :

                          <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">Aucun notaire</p>
                            }
                          </div>
                        )}

                        {formData.ttl === "Non" && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center mb-2">
                              <Label>Courtiers immobiliers</Label>
                              <Button type="button" size="sm" onClick={() => setIsCourtierSelectorOpen(true)} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400">
                                <UserPlus className="w-4 h-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                            {formData.courtiers_ids.length > 0 ?
                          <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                              {formData.courtiers_ids.map((courtierId) => {
                              const courtier = getClientById(courtierId);
                              return courtier ?
                              <div key={courtierId} className="space-y-1">
                                    <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-pointer hover:bg-orange-500/30 relative pr-8 w-full justify-start">
                                      <span onClick={() => setViewingClientDetails(courtier)} className="cursor-pointer flex-1">{courtier.prenom} {courtier.nom}</span>
                                      <button type="button" onClick={(e) => {e.stopPropagation();removeClient(courtierId, 'courtiers');}} className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400">
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                    {courtier.preferences_livraison && courtier.preferences_livraison.length > 0 &&
                                <div className="flex gap-1 ml-2">
                                        <Package className="w-3 h-3 text-slate-500 mt-0.5" />
                                        <span className="text-xs text-slate-400">
                                          {courtier.preferences_livraison.join(', ')}
                                        </span>
                                      </div>
                                }
                                  </div> :
                              null;
                            })}
                            </div> :

                          <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">Aucun courtier</p>
                            }
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Label>Mandats</Label>
                          {formData.ttl === "Non" && (
                            <Button type="button" size="sm" onClick={addMandat} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                              <Plus className="w-4 h-4 mr-1" />
                              Ajouter un mandat
                            </Button>
                          )}
                        </div>

                        {formData.mandats.length > 0 ?
                        <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat} className="w-full">
                            <TabsList className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-2 border-blue-500/30 w-full h-auto justify-start p-2 rounded-lg">
                              {formData.mandats.map((mandat, index) =>
                            <TabsTrigger
                              key={index}
                              value={index.toString()}
                              className="data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300 data-[state=active]:shadow-lg text-slate-300 px-8 py-4 text-lg font-bold rounded-md transition-all">

                                  {getMandatTabLabel(mandat, index)}
                                </TabsTrigger>
                            )}
                            </TabsList>

                            {formData.mandats.map((mandat, index) =>
                          <TabsContent key={index} value={index.toString()}>
                                <Card className="border-slate-700 bg-slate-800/30">
                                  <CardContent className="p-4 space-y-4">
                                    <MandatTabs
                                      mandat={mandat}
                                      mandatIndex={index}
                                      updateMandat={updateMandat}
                                      updateMandatAddress={updateMandatAddress}
                                      openLotSelector={openLotSelector}
                                      openAddMinuteDialog={openAddMinuteDialog}
                                      removeLotFromMandat={removeLotFromMandat}
                                      removeMinuteFromMandat={removeMinuteFromMandat}
                                      getLotById={getLotById}
                                      users={users}
                                      formStatut={formData.statut}
                                      onRemoveMandat={formData.ttl === "Non" ? () => {
                                        removeMandat(index);
                                        if (formData.mandats.length > 1) {
                                          setActiveTabMandat(Math.max(0, index - 1).toString());
                                        } else {
                                          setActiveTabMandat("0");
                                        }
                                      } : null}
                                      isReferenceDisabled={formData.ttl === "Oui"}
                                      isTTL={formData.ttl === "Oui"}
                                    />
                                  </CardContent>
                                </Card>
                          </TabsContent>
                          )}
                      </Tabs> :

                        <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">Aucun mandat. Cliquez sur "Ajouter un mandat" pour commencer.</div>
                        }
                      </div>

                      {formData.mandats.length > 0 && formData.ttl === "Non" &&
                      <div className="space-y-3 mt-6">
                          <Label className="text-lg font-semibold text-slate-300">Tarification</Label>
                          <div className="border border-slate-700 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                  <TableHead className="text-slate-300">Type de mandat</TableHead>
                                  <TableHead className="text-slate-300">Prix estimé ($)</TableHead>
                                  <TableHead className="text-slate-300">Rabais ($)</TableHead>
                                  <TableHead className="text-slate-300">Taxes incluses</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {formData.mandats.map((mandat, index) =>
                              <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                    <TableCell className="font-medium text-white">{mandat.type_mandat || `Mandat ${index + 1}`}</TableCell>
                                    <TableCell>
                                      <Input type="text" inputMode="decimal" value={mandat.prix_estime || ""} onChange={(e) => {const value = e.target.value.replace(/[^0-9.]/g, '');updateMandat(index, 'prix_estime', value ? parseFloat(value) : 0);}} placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
                                    </TableCell>
                                    <TableCell>
                                      <Input type="text" inputMode="decimal" value={mandat.rabais || ""} onChange={(e) => {const value = e.target.value.replace(/[^0-9.]/g, '');updateMandat(index, 'rabais', value ? parseFloat(value) : 0);}} placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <input type="checkbox" id={`taxes_incluses_${index}`} checked={mandat.taxes_incluses} onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)} className="form-checkbox h-5 w-5 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded" />
                                    </TableCell>
                                  </TableRow>
                              )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      }
                    </form>

                    <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800 px-6">
                      <Button type="button" variant="outline" onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}>Annuler</Button>
                      <Button type="submit" form="dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">{editingDossier ? "Modifier" : "Créer"}</Button>
                    </div>
                  </div>

                  <div className="flex-[0_0_30%] flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex-shrink-0">
                      <h3 className="text-lg font-bold text-white">Commentaires</h3>
                    </div>
                    <div className="flex-1 overflow-hidden p-6">
                      <CommentairesSection dossierId={editingDossier?.id} dossierTemporaire={!editingDossier} onCommentairesTempChange={setCommentairesTemporaires} />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dialog pour ajouter une minute */}
        <Dialog open={isAddMinuteDialogOpen} onOpenChange={setIsAddMinuteDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Ajouter une minute</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog d'importation CSV */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
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
            <DialogHeader>
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
            <DialogHeader>
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
            <DialogHeader>
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
            <DialogHeader>
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
                    <p>📞 {client.telephones.find((t) => t.actuel).telephone}</p>
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
            <DialogHeader>
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
                    <p>📞 {notaire.telephones.find((t) => t.actuel).telephone}</p>
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
            <DialogHeader>
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
                    <p>📞 {courtier.telephones.find((t) => t.actuel).telephone}</p>
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

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Détails du dossier</DialogTitle>
            </DialogHeader>
            {viewingDossier &&
            <div className="flex h-[90vh]">
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
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Statut</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className={`border ${viewingDossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                            {viewingDossier.statut}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Date d'ouverture</Label>
                        <p className="text-white font-medium mt-1">
                          {viewingDossier.date_ouverture ? format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr }) : '-'}
                        </p>
                      </div>
                    </div>

                    {viewingDossier.description &&
                  <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <Label className="text-slate-400 text-sm">Description</Label>
                        <p className="text-white mt-2 whitespace-pre-wrap">{viewingDossier.description}</p>
                      </div>
                  }

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
                              {viewingDossier.clients_ids.map((clientId) => {
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
                              {viewingDossier.notaires_ids.map((notaireId) => {
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
                              {viewingDossier.courtiers_ids.map((courtierId) => {
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

                    {viewingDossier.mandats && viewingDossier.mandats.length > 0 &&
                  <div>
                        <Label className="text-slate-400 text-sm mb-3 block">Mandats ({viewingDossier.mandats.length})</Label>
                        <div className="space-y-3">
                          {viewingDossier.mandats.map((mandat, index) =>
                      <Card key={index} className="bg-slate-800/50 border-slate-700">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <h5 className="font-semibold text-emerald-400 text-lg">{mandat.type_mandat || `Mandat ${index + 1}`}</h5>
                                  <div className="flex gap-2">
                                    {(mandat.prix_estime || 0) > 0 &&
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                                        {(mandat.prix_estime || 0).toFixed(2)} $
                                      </Badge>
                              }
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) !== "" &&
                            <div>
                                      <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                                    </div>
                            }
                                  
                                  {mandat.lots && mandat.lots.length > 0 &&
                            <div>
                                      <Label className="text-slate-400 text-xs">Lots</Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {mandat.lots.map((lotId) => {
                                  const lot = getLotById(lotId);
                                  return (
                                    <Badge key={lotId} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                              {lot?.numero_lot || lotId}
                                            </Badge>);

                                })}
                                      </div>
                                    </div>
                            }
                                </div>

                                {mandat.tache_actuelle &&
                          <div>
                                    <Label className="text-slate-400 text-xs">Tâche actuelle</Label>
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-1">
                                      {mandat.tache_actuelle}
                                    </Badge>
                                  </div>
                          }

                                {mandat.minutes_list && mandat.minutes_list.length > 0 &&
                          <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Minutes</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {mandat.minutes_list.map((minute, minuteIdx) =>
                              <Badge key={minuteIdx} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                          {minute.minute}
                                        </Badge>
                              )}
                                    </div>
                                  </div>
                          }

                                {mandat.minute && !mandat.minutes_list &&
                          <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Minute</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                        {mandat.minute}
                                      </Badge>
                                    </div>
                                  </div>
                          }

                                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-700">
                                  {mandat.date_ouverture &&
                            <div>
                                      <Label className="text-slate-400 text-xs">Ouverture</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_ouverture), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                            }
                                  {mandat.date_signature &&
                            <div>
                                      <Label className="text-slate-400 text-xs">Signature</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                            }
                                  {mandat.date_debut_travaux &&
                            <div>
                                      <Label className="text-slate-400 text-xs">Début travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_debut_travaux), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                            }
                                  {mandat.date_livraison &&
                            <div>
                                      <Label className="text-slate-400 text-xs">Livraison</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                            }
                                </div>

                                {((mandat.prix_estime || 0) > 0 || (mandat.rabais || 0) > 0) &&
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                                    {(mandat.prix_estime || 0) > 0 &&
                            <div>
                                        <Label className="text-slate-400 text-xs">Prix estimé</Label>
                                        <p className="text-slate-300 text-sm mt-1">{(mandat.prix_estime || 0).toFixed(2)} $</p>
                                      </div>
                            }
                                    {(mandat.rabais || 0) > 0 &&
                            <div>
                                        <Label className="text-slate-400 text-xs">Rabais</Label>
                                        <p className="text-slate-300 text-sm mt-1">{(mandat.rabais || 0).toFixed(2)} $</p>
                                      </div>
                            }
                                    <div>
                                      <Label className="text-slate-400 text-xs">Taxes</Label>
                                      <p className="text-slate-300 text-sm mt-1">
                                        {mandat.taxes_incluses ? "✓ Incluses" : "Non incluses"}
                                      </p>
                                    </div>
                                  </div>
                          }

                                {mandat.notes &&
                          <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Notes</Label>
                                    <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{mandat.notes}</p>
                                  </div>
                          }

                                {mandat.terrain &&
                          <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs mb-2 block">Informations Terrain</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                      {mandat.terrain.date_limite_leve &&
                              <div>
                                          <Label className="text-slate-400 text-xs">Date limite levé</Label>
                                          <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.terrain.date_limite_leve), 'dd MMM yyyy', { locale: fr })}</p>
                                        </div>
                              }
                                      {mandat.terrain.instruments_requis &&
                              <div>
                                          <Label className="text-slate-400 text-xs">Instruments</Label>
                                          <p className="text-slate-300 text-sm mt-1">{mandat.terrain.instruments_requis}</p>
                                        </div>
                              }
                                      {mandat.terrain.a_rendez_vous &&
                              <div className="col-span-2">
                                          <Label className="text-slate-400 text-xs">Rendez-vous</Label>
                                          <p className="text-slate-300 text-sm mt-1">
                                            {mandat.terrain.date_rendez_vous && format(new Date(mandat.terrain.date_rendez_vous), 'dd MMM yyyy', { locale: fr })}
                                            {mandat.terrain.heure_rendez_vous && ` à ${mandat.terrain.heure_rendez_vous}`}
                                            {mandat.terrain.donneur && ` avec ${mandat.terrain.donneur}`}
                                          </p>
                                        </div>
                              }
                                      {mandat.terrain.technicien &&
                              <div>
                                          <Label className="text-slate-400 text-xs">Technicien</Label>
                                          <p className="text-slate-300 text-sm mt-1">{mandat.terrain.technicien}</p>
                                        </div>
                              }
                                      {mandat.terrain.dossier_simultane &&
                              <div>
                                          <Label className="text-slate-400 text-xs">Dossier simultané</Label>
                                          <p className="text-slate-300 text-sm mt-1">{mandat.terrain.dossier_simultane}</p>
                                        </div>
                              }
                                      {mandat.terrain.temps_prevu &&
                              <div>
                                          <Label className="text-slate-400 text-xs">Temps prévu</Label>
                                          <p className="text-slate-300 text-sm mt-1">{mandat.terrain.temps_prevu}</p>
                                        </div>
                              }
                                      {mandat.terrain.notes &&
                              <div className="col-span-2">
                                          <Label className="text-slate-400 text-xs">Notes terrain</Label>
                                          <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{mandat.terrain.notes}</p>
                                        </div>
                              }
                                    </div>
                                  </div>
                          }
                                {mandat.factures && mandat.factures.length > 0 &&
                          <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Factures générées ({mandat.factures.length})</Label>
                                    <div className="border border-slate-700 rounded-lg overflow-hidden mt-2">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                            <TableHead className="text-slate-300">N° Facture</TableHead>
                                            <TableHead className="text-slate-300">Date</TableHead>
                                            <TableHead className="text-slate-300">Total HT</TableHead>
                                            <TableHead className="text-slate-300">Total TTC</TableHead>
                                            <TableHead className="text-slate-300 text-right">Action</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {mandat.factures.map((facture, factureIdx) =>
                                  <TableRow key={factureIdx} className="border-slate-800">
                                              <TableCell className="text-white font-semibold">{facture.numero_facture}</TableCell>
                                              <TableCell className="text-white">{facture.date_facture ? format(new Date(facture.date_facture), "dd MMM yyyy", { locale: fr }) : '-'}</TableCell>
                                              <TableCell className="text-white">{facture.total_ht?.toFixed(2)} $</TableCell>
                                              <TableCell className="text-white font-semibold">{facture.total_ttc?.toFixed(2)} $</TableCell>
                                              <TableCell className="text-right">
                                                <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => voirFacture(facture.facture_html)}
                                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400">

                                                  <FileText className="w-4 h-4 mr-2" />
                                                  Voir
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                  )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                          }
                              </CardContent>
                            </Card>
                      )}
                        </div>
                      </div>
                  }
                  </div>

                  <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Fermer
                    </Button>
                    <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={handleEditFromView}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 pr-4">
                    <CommentairesSection
                    dossierId={viewingDossier?.id}
                    dossierTemporaire={false} />

                  </div>
                </div>
              </div>
            }
          </DialogContent>
        </Dialog>

        <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {setIsLotSelectorOpen(open);if (!open) {setLotCirconscriptionFilter("all");setLotSearchTerm("");setLotCadastreFilter("Québec");}}}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
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
                <Select value={lotCirconscriptionFilter} onValueChange={setLotCirconscriptionFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Circonscription" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                    {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) =>
                    <SelectItem key={circ} value={circ} className="text-white">
                        {circ}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Select value={lotCadastreFilter} onValueChange={setLotCadastreFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Cadastre" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                    <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                    {/* The outline explicitly showed only 'Québec' as a direct item. If dynamic filtering by selected circonscription is desired, this section should be adapted to use `availableLotCadastres`. Following the outline directly: */}
                    <SelectItem value="Québec" className="text-white">Québec</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => setIsNewLotDialogOpen(true)}
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

        <Dialog open={isNewLotDialogOpen} onOpenChange={(open) => {setIsNewLotDialogOpen(open);if (!open) resetNewLotForm();}}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Créer un nouveau lot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewLotSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Circonscription foncière <span className="text-red-400">*</span></Label>
                  <Select value={newLotForm.circonscription_fonciere} onValueChange={handleLotCirconscriptionChange} required>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner la circonscription" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circonscription) =>
                      <SelectItem key={circonscription} value={circonscription} className="text-white">{circonscription}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cadastre <span className="text-red-400">*</span></Label>
                  <Select value={newLotForm.cadastre} onValueChange={(value) => setNewLotForm({ ...newLotForm, cadastre: value })} required disabled={!newLotForm.circonscription_fonciere}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner le cadastre" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableLotCadastres.map((cadastre) =>
                      <SelectItem key={cadastre} value={cadastre} className="text-white">{cadastre}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numéro de lot <span className="text-red-400">*</span></Label>
                  <Input value={newLotForm.numero_lot} onChange={(e) => setNewLotForm({ ...newLotForm, numero_lot: e.target.value })} required placeholder="Ex: 1234567" className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Rang</Label>
                  <Input value={newLotForm.rang} onChange={(e) => setNewLotForm({ ...newLotForm, rang: e.target.value })} placeholder="Ex: Rang 1" className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Concordance antérieur</Label>
                <Textarea value={newLotForm.concordance_anterieur} onChange={(e) => setNewLotForm({ ...newLotForm, concordance_anterieur: e.target.value })} placeholder="Informations de concordance (ex: lot 123 subdivision 456)" className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>Document PDF du lot</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" onChange={handleLotFileUpload} accept=".pdf" className="bg-slate-800 border-slate-700 file:text-emerald-400 file:bg-emerald-500/10 file:border-none file:hover:bg-emerald-500/20" />
                  {uploadingLotPdf && <span className="text-slate-500">Téléchargement...</span>}
                  {newLotForm.document_pdf_url &&
                  <a href={newLotForm.document_pdf_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  }
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsNewLotDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">Créer le lot</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-600/20">
                <FolderOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Dossiers ouverts</CardTitle>
                <p className="text-sm text-slate-400">Statistique par période</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Aujourd'hui</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-white">{dossierStats.byDay}</p>
                  {dossierStats.percentages.day !== 0 &&
                  <span className={`text-xs font-medium flex items-center gap-1 ${dossierStats.percentages.day >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dossierStats.percentages.day > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {dossierStats.percentages.day > 0 ? '+' : ''}{dossierStats.percentages.day}%
                    </span>
                  }
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Cette semaine</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-white">{dossierStats.byWeek}</p>
                  {dossierStats.percentages.week !== 0 &&
                  <span className={`text-xs font-medium flex items-center gap-1 ${dossierStats.percentages.week >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dossierStats.percentages.week > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {dossierStats.percentages.week > 0 ? '+' : ''}{dossierStats.percentages.week}%
                    </span>
                  }
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Ce mois</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-white">{dossierStats.byMonth}</p>
                  {dossierStats.percentages.month !== 0 &&
                  <span className={`text-xs font-medium flex items-center gap-1 ${dossierStats.percentages.month >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dossierStats.percentages.month > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {dossierStats.percentages.month > 0 ? '+' : ''}{dossierStats.percentages.month}%
                    </span>
                  }
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Cette année</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-white">{dossierStats.byYear}</p>
                  {dossierStats.percentages.year !== 0 &&
                  <span className={`text-xs font-medium flex items-center gap-1 ${dossierStats.percentages.year >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dossierStats.percentages.year > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {dossierStats.percentages.year > 0 ? '+' : ''}{dossierStats.percentages.year}%
                    </span>
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <CardTitle className="text-xl text-white">Liste des dossiers</CardTitle>
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filterArpenteur} onValueChange={setFilterArpenteur}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Arpenteur" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                  {ARPENTEURS.map((arp) =>
                  <SelectItem key={arp} value={arp} className="text-white">
                      {arp}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tous les statuts</SelectItem>
                  <SelectItem value="Ouvert" className="text-white">Ouvert</SelectItem>
                  <SelectItem value="Fermé" className="text-white">Fermé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterMandat} onValueChange={setFilterMandat}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Mandat" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tous les mandats</SelectItem>
                  {TYPES_MANDATS.map((type) =>
                  <SelectItem key={type} value={type} className="text-white">
                      {type}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={filterTache} onValueChange={setFilterTache}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Tâche" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Toutes les tâches</SelectItem>
                  {TACHES.map((tache) =>
                  <SelectItem key={tache} value={tache} className="text-white">
                      {tache}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Select value={filterVille} onValueChange={setFilterVille}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Toutes les villes</SelectItem>
                  {uniqueVilles.map((ville) =>
                  <SelectItem key={ville} value={ville} className="text-white">
                      {ville}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {(filterArpenteur !== "all" || filterStatut !== "all" || filterMandat !== "all" || filterTache !== "all" || filterVille !== "all") &&
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterArpenteur("all");
                  setFilterStatut("all");
                  setFilterMandat("all");
                  setFilterTache("all");
                  setFilterVille("all");
                }}
                className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white">

                  Réinitialiser les filtres
                </Button>
              }
            </div>
          </CardHeader>
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
                      <TableHead className="text-slate-300">Minute</TableHead>
                      <TableHead className="text-slate-300">Lot</TableHead>
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
                    key={dossier.displayId}
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
                            {dossier.mandatInfo?.type_mandat ?
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                {dossier.mandatInfo.type_mandat}
                              </Badge> :

                      <span className="text-slate-600 text-xs">-</span>
                      }
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.mandatInfo?.minutes_list && dossier.mandatInfo.minutes_list.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {dossier.mandatInfo.minutes_list.slice(0, 2).map((minute, idx) => (
                                  <Badge key={idx} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                    {minute.minute}
                                  </Badge>
                                ))}
                                {dossier.mandatInfo.minutes_list.length > 2 && (
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                                    +{dossier.mandatInfo.minutes_list.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : dossier.mandatInfo?.minute ? (
                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                {dossier.mandatInfo.minute}
                              </Badge>
                            ) : (
                              <span className="text-slate-600 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.ttl === "Oui" ? (
                              dossier.mandatInfo?.lots_texte ? (
                                <span className="text-xs">{dossier.mandatInfo.lots_texte}</span>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )
                            ) : (
                              dossier.mandatInfo?.lots && dossier.mandatInfo.lots.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {dossier.mandatInfo.lots.slice(0, 2).map((lotId, idx) => {
                                    const lot = lots.find(l => l.id === lotId);
                                    return lot ? (
                                      <Badge key={idx} className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                        {lot.numero_lot}
                                      </Badge>
                                    ) : null;
                                  })}
                                  {dossier.mandatInfo.lots.length > 2 && (
                                    <Badge className="bg-slate-700 text-slate-300 text-xs">
                                      +{dossier.mandatInfo.lots.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )
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
                        <TableCell colSpan={12} className="text-center py-12 text-slate-500">
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
    </div>);

}