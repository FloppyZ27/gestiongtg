import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Grid3x3, ArrowUpDown, ArrowUp, ArrowDown, Eye, ExternalLink, Download, Upload, Loader2, ChevronDown, ChevronUp, MessageSquare, Clock, FolderOpen, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";
import DocumentsStepFormLot from "../components/lots/DocumentsStepFormLot";
import LotInfoStepForm from "../components/lots/LotInfoStepForm";
import TypesOperationStepForm from "../components/lots/TypesOperationStepForm";

const CIRCONSCRIPTIONS = ["Lac-Saint-Jean-Est", "Lac-Saint-Jean-Ouest", "Chicoutimi"];

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

const TYPES_OPERATIONS = [
  "Division du territoire",
  "Subdivision",
  "Remplacement",
  "Rénovation cadastrale",
  "Correction",
  "Annulation"
];

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Certificat de localisation", "Implantation", "Piquetage", "OCTR", "Projet de lotissement"];

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

export default function Lots() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false); // Renamed from isDialogOpen
  const [editingLot, setEditingLot] = useState(null);
  const [viewingLot, setViewingLot] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [filterCirconscription, setFilterCirconscription] = useState([]);
  const [filterCadastre, setFilterCadastre] = useState([]);
  const [filterTypeOperation, setFilterTypeOperation] = useState([]);
  const [filterRang, setFilterRang] = useState([]);
  const [availableCadastres, setAvailableCadastres] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [typesOperationCollapsed, setTypesOperationCollapsed] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dossiersAssociesCollapsed, setDossiersAssociesCollapsed] = useState(false);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState(null);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [bulkImportPreview, setBulkImportPreview] = useState(null);
  const [isCreatingBulkLots, setIsCreatingBulkLots] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showLotMissingFieldsWarning, setShowLotMissingFieldsWarning] = useState(false);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [dossiersAssociesFormCollapsed, setDossiersAssociesFormCollapsed] = useState(false);

  // New state for View Dialog filters and sorting
  const [viewDossierSearchTerm, setViewDossierSearchTerm] = useState("");
  const [viewFilterArpenteur, setViewFilterArpenteur] = useState("all");
  const [viewFilterTypeMandat, setViewFilterTypeMandat] = useState("all");
  const [viewFilterVille, setViewFilterVille] = useState("all");
  const [viewSortField, setViewSortField] = useState(null);
  const [viewSortDirection, setViewSortDirection] = useState("asc");

  // New state for Form Dialog filters and sorting (dossiers section)
  const [formDossierSearchTerm, setFormDossierSearchTerm] = useState("");
  const [formFilterArpenteur, setFormFilterArpenteur] = useState([]);
  const [formFilterTypeMandat, setFormFilterTypeMandat] = useState([]);
  const [formFilterVille, setFormFilterVille] = useState([]);
  const [formFilterStatut, setFormFilterStatut] = useState([]);
  const [formSortField, setFormSortField] = useState(null);
  const [formSortDirection, setFormSortDirection] = useState("asc");
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showLotExistsWarning, setShowLotExistsWarning] = useState(false);

  const [formData, setFormData] = useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "Québec",
    rang: "",
    types_operation: []
  });

  const queryClient = useQueryClient();

  const { data: lots, isLoading } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list('-created_date'),
    initialData: [],
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: actionLogs = [] } = useQuery({
    queryKey: ['actionLogs', editingLot?.id],
    queryFn: () => editingLot ? base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: editingLot.id }, '-created_date') : Promise.resolve([]),
    enabled: !!editingLot,
    initialData: [],
  });

  const createLotMutation = useMutation({
    mutationFn: async (lotData) => {
      // Validation moved to handleSubmit
      const newLot = await base44.entities.Lot.create(lotData);
      
      if (commentairesTemporaires.length > 0) {
        const commentairePromises = commentairesTemporaires.map(comment =>
          base44.entities.CommentaireLot.create({
            lot_id: newLot.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }
      
      // Créer une entrée dans l'historique
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || '',
        action: 'Création',
        entite: 'Lot',
        entite_id: newLot.id,
        details: `Lot ${lotData.numero_lot} créé`
      });
      
      return newLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setIsFormDialogOpen(false); // Renamed from setIsDialogOpen
      resetForm();
      setCommentairesTemporaires([]);
    },
    onError: (error) => { // Added onError
      alert(error.message);
    }
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
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
      setIsFormDialogOpen(false);
      setIsViewDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const deleteLotMutation = useMutation({
    mutationFn: async (id) => {
      const lot = lots.find(l => l.id === id);
      await base44.entities.Lot.delete(id);
      
      // Créer une entrée dans l'historique
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || '',
        action: 'Suppression',
        entite: 'Lot',
        entite_id: id,
        details: `Lot ${lot?.numero_lot || 'inconnu'} supprimé`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    },
  });

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
  };

  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
  };

  const getDossiersWithLot = (lotNumero) => {
    if (!lotNumero) return [];
    
    const uniqueMap = new Map();
    
    dossiers.forEach(dossier => {
      if (!dossier.mandats || dossier.mandats.length === 0) return;
      
      dossier.mandats.forEach((mandat, mandatIndex) => {
        if (!mandat.lots || !Array.isArray(mandat.lots)) return;
        
        // Check if this mandat contains the lot we're looking for
        const containsLot = mandat.lots.some(lotRef => {
          // Direct string comparison with numero_lot
          if (lotRef === lotNumero) return true;
          
          // If lotRef is an ID, find the lot and compare numero_lot
          const foundLot = lots.find(l => l.id === lotRef);
          return foundLot && foundLot.numero_lot === lotNumero;
        });
        
        if (containsLot) {
          // Create unique key: dossier ID + mandat index
          const uniqueKey = `${dossier.id}__${mandatIndex}`;
          
          // Only add if not already in map
          if (!uniqueMap.has(uniqueKey)) {
            uniqueMap.set(uniqueKey, {
              dossier,
              mandat,
            });
          }
        }
      });
    });
    
    return Array.from(uniqueMap.values());
  };

  const handleDossierClick = (dossier) => {
    const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
    window.open(url, '_blank');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation: vérifier que les champs obligatoires sont remplis
    if (!formData.numero_lot || !formData.circonscription_fonciere) {
      setShowLotMissingFieldsWarning(true);
      return;
    }
    
    // Validation pour vérifier si le lot existe déjà
    const lotExistant = lots.find(l =>
      l.id !== editingLot?.id && // Exclure le lot actuel en modification
      l.numero_lot === formData.numero_lot &&
      l.cadastre === formData.cadastre &&
      l.circonscription_fonciere === formData.circonscription_fonciere
    );

    if (lotExistant) {
      setShowLotExistsWarning(true);
      return;
    }

    const dataToSubmit = {
      ...formData
    };
    
    if (editingLot) {
      updateLotMutation.mutate({ id: editingLot.id, lotData: dataToSubmit });
    } else {
      createLotMutation.mutate(dataToSubmit);
    }
  };

  const handleCirconscriptionChange = (value) => {
    setFormData(prev => ({ 
      ...prev, 
      circonscription_fonciere: value, 
      cadastre: prev.cadastre || "Québec"
    }));
    setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
    setHasFormChanges(true);
  };

  const resetForm = () => {
    setFormData({
      numero_lot: "",
      circonscription_fonciere: "",
      cadastre: "Québec",
      rang: "",
      types_operation: []
    });
    setEditingLot(null);
    setAvailableCadastres([]);
    setCommentairesTemporaires([]);
    setHasFormChanges(false);
    setInitialFormData(null);
  };

  const handleEdit = (lot) => {
    setIsViewDialogOpen(false);
    setViewingLot(null);
    
    setEditingLot(lot);
    const lotData = {
      numero_lot: lot.numero_lot || "",
      circonscription_fonciere: lot.circonscription_fonciere || "",
      cadastre: lot.cadastre || "",
      rang: lot.rang || "",
      types_operation: lot.types_operation || []
    };
    setFormData(lotData);
    setInitialFormData(JSON.parse(JSON.stringify(lotData)));
    if (lot.circonscription_fonciere) {
      setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[lot.circonscription_fonciere] || []);
    }
    
    // Fermer les sections par défaut lors de l'édition
    setTypesOperationCollapsed(true);
    setDocumentsCollapsed(true);
    setDossiersAssociesFormCollapsed(true);
    
    setIsFormDialogOpen(true);
    setHasFormChanges(false);
  };

  const handleView = (lot) => {
    setViewingLot(lot);
    setIsViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    if (viewingLot) {
      handleEdit(viewingLot);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [lotToDelete, setLotToDelete] = useState(null);

  const handleDelete = (id) => {
    setLotToDelete(id);
    setShowDeleteConfirm(true);
  };

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

  const handleViewSort = (field) => {
    if (viewSortField === field) {
      setViewSortDirection(viewSortDirection === "asc" ? "desc" : "asc");
    } else {
      setViewSortField(field);
      setViewSortDirection("asc");
    }
  };

  const getViewSortIcon = (field) => {
    if (viewSortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    return viewSortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const handleFormSort = (field) => {
    if (formSortField === field) {
      if (formSortDirection === "asc") {
        setFormSortDirection("desc");
      } else {
        // Reset to neutral
        setFormSortField(null);
        setFormSortDirection("asc");
      }
    } else {
      setFormSortField(field);
      setFormSortDirection("asc");
    }
  };

  const getFormSortIcon = (field) => {
    if (formSortField !== field) return null;
    return formSortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const getFilteredAndSortedDossiers = (lotNumero, isFormDialog = false) => {
    const associatedDossiers = getDossiersWithLot(lotNumero);
    const searchTerm = isFormDialog ? formDossierSearchTerm : viewDossierSearchTerm;
    const filterArpenteur = isFormDialog ? formFilterArpenteur : viewFilterArpenteur;
    const filterTypeMandat = isFormDialog ? formFilterTypeMandat : viewFilterTypeMandat;
    const filterVille = isFormDialog ? formFilterVille : viewFilterVille;
    const filterStatut = isFormDialog ? formFilterStatut : [];
    const sortField = isFormDialog ? formSortField : viewSortField;
    const sortDirection = isFormDialog ? formSortDirection : viewSortDirection;
    
    // Filter
    const filtered = associatedDossiers.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const clientsNames = getClientsNames(item.dossier.clients_ids);
      const adresseTravaux = item.mandat?.adresse_travaux ? formatAdresse(item.mandat.adresse_travaux) : "";
      
      const matchesSearch = (
        item.dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
        (getArpenteurInitials(item.dossier.arpenteur_geometre) + item.dossier.numero_dossier).toLowerCase().includes(searchLower) ||
        clientsNames.toLowerCase().includes(searchLower) ||
        item.mandat?.type_mandat?.toLowerCase().includes(searchLower) ||
        adresseTravaux.toLowerCase().includes(searchLower)
      );

      const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(item.dossier.arpenteur_geometre);
      const matchesTypeMandat = filterTypeMandat.length === 0 || filterTypeMandat.includes(item.mandat?.type_mandat);
      const matchesVille = filterVille.length === 0 || filterVille.includes(item.mandat?.adresse_travaux?.ville);
      const matchesStatut = filterStatut.length === 0 || filterStatut.includes(item.dossier.statut);

      return matchesSearch && matchesArpenteur && matchesTypeMandat && matchesVille && matchesStatut;
    });

    // Sort
    if (!sortField) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'numero_dossier':
          aValue = (getArpenteurInitials(a.dossier.arpenteur_geometre) + a.dossier.numero_dossier).toLowerCase();
          bValue = (getArpenteurInitials(b.dossier.arpenteur_geometre) + b.dossier.numero_dossier).toLowerCase();
          break;
        case 'clients':
          aValue = getClientsNames(a.dossier.clients_ids).toLowerCase();
          bValue = getClientsNames(b.dossier.clients_ids).toLowerCase();
          break;
        case 'type_mandat':
          aValue = (a.mandat?.type_mandat || '').toLowerCase();
          bValue = (b.mandat?.type_mandat || '').toLowerCase();
          break;
        case 'adresse_travaux':
          aValue = (a.mandat?.adresse_travaux ? formatAdresse(a.mandat.adresse_travaux) : '').toLowerCase();
          bValue = (b.mandat?.adresse_travaux ? formatAdresse(b.mandat.adresse_travaux) : '').toLowerCase();
          break;
        case 'date_minute':
          aValue = a.mandat?.date_minute ? new Date(a.mandat.date_minute).getTime() : 0;
          bValue = b.mandat?.date_minute ? new Date(b.mandat.date_minute).getTime() : 0;
          break;
        case 'date_ouverture':
          aValue = a.dossier?.date_ouverture ? new Date(a.dossier.date_ouverture).getTime() : 0;
          bValue = b.dossier?.date_ouverture ? new Date(b.dossier.date_ouverture).getTime() : 0;
          break;
        case 'statut':
          aValue = (a.dossier?.statut || '').toLowerCase();
          bValue = (b.dossier?.statut || '').toLowerCase();
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
  };

  const filteredLots = lots.filter(lot => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      lot.numero_lot?.toLowerCase().includes(searchLower) ||
      lot.cadastre?.toLowerCase().includes(searchLower) ||
      lot.rang?.toLowerCase().includes(searchLower) ||
      lot.circonscription_fonciere?.toLowerCase().includes(searchLower)
    );

    const matchesCirconscription = filterCirconscription.length === 0 || filterCirconscription.includes(lot.circonscription_fonciere);
    const matchesCadastre = filterCadastre.length === 0 || filterCadastre.includes(lot.cadastre);
    const matchesTypeOperation = filterTypeOperation.length === 0 || filterTypeOperation.includes(lot.type_operation);
    const matchesRang = filterRang.length === 0 || filterRang.includes(lot.rang);

    return matchesSearch && matchesCirconscription && matchesCadastre && matchesTypeOperation && matchesRang;
  });

  const sortedLots = [...filteredLots].sort((a, b) => {
    if (!sortField) return 0;

    let aValue, bValue;

    switch (sortField) {
      case 'numero_lot':
        aValue = (a.numero_lot || '').toLowerCase();
        bValue = (b.numero_lot || '').toLowerCase();
        break;
      case 'circonscription':
        aValue = (a.circonscription_fonciere || '').toLowerCase();
        bValue = (b.circonscription_fonciere || '').toLowerCase();
        break;
      case 'cadastre':
        aValue = (a.cadastre || '').toLowerCase();
        bValue = (b.cadastre || '').toLowerCase();
        break;
      case 'rang':
        aValue = (a.rang || '').toLowerCase();
        bValue = (b.rang || '').toLowerCase();
        break;
      case 'date_bpd':
        aValue = a.date_bpd ? new Date(a.date_bpd).getTime() : 0;
        bValue = b.date_bpd ? new Date(b.date_bpd).getTime() : 0;
        break;
      case 'type_operation':
        aValue = (a.type_operation || '').toLowerCase();
        bValue = (b.type_operation || '').toLowerCase();
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

  const CADASTRE_CODES = {
    "080010": "Canton de Boilleau", "080020": "Canton de Périgny", "080040": "Canton de Dumas", "080050": "Canton de Labrosse", "080060": "Canton de Saint-Jean", "080080": "Canton de Hébert", "080100": "Canton d'Otis", "080110": "Canton de Ferland", "080120": "Paroisse de Saint-Alexis", "080130": "Paroisse de Saint-Alphonse", "080140": "Village de Grande-Baie", "080160": "Village de Bagotville", "080180": "Canton de Bagot", "080200": "Canton de Laterrière", "080210": "Paroisse de Chicoutimi", "080220": "Ville de Chicoutimi", "080240": "Canton de Chicoutimi", "080260": "Cité d'Arvida", "080280": "Canton de Jonquière", "080300": "Canton de Kénogami", "080310": "Canton de Labarre", "080320": "Canton de Taché", "080340": "Canton de Bourget", "080360": "Canton de Simard", "080380": "Canton de Tremblay", "080400": "Village de Sainte-Anne-de-Chicoutimi", "080410": "Canton de Harvey", "080420": "Canton de Saint-Germains", "080430": "Canton de Chardon", "080440": "Canton de Durocher", "080460": "Canton de Falardeau", "080470": "Canton de Gagné", "080480": "Canton de Bégin", "080500": "Canton de Labrecque", "080510": "Canton de Rouleau", "080520": "Canton d'Aulneau", "080540": "Bassin de la Rivière-Péribonca", "080560": "Bassin de la Rivière-Betsiamites", "080580": "Canton de Lidice", "080600": "Bassin de la Rivière-Manouane", "080610": "Canton de Mésy", "080620": "Village d'Hébertville", "080630": "Canton de Saint-Hilaire", "080640": "Canton de Caron", "080660": "Canton de Métabetchouan", "080700": "Canton de Signay", "080710": "Canton de De l'Île", "080720": "Canton de Taillon", "080740": "Canton de Garnier", "080760": "Canton de Crespieul", "080780": "Canton de Malherbe", "080800": "Augmentation du canton de Dequen", "080810": "Canton de Dablon", "080820": "Canton de Dequen", "080840": "Canton de Charlevoix", "080860": "Canton de Roberval", "080880": "Village de Roberval", "080900": "Canton de Ross", "080910": "Canton de Déchêne", "080920": "Canton de Ouiatchouan", "080940": "Canton d'Ashuapmouchouan", "080960": "Canton de Demeulles", "080980": "Canton de Parent", "081000": "Canton de Racine", "081010": "Canton de Dolbeau", "081020": "Canton de Dalmas", "081040": "Canton de Jogues", "081060": "Canton de Maltais", "081080": "Canton de Constantin", "081100": "Canton de Saint-Onge", "081110": "Canton de Milot", "081120": "Canton de Proulx", "081140": "Canton de Hudon", "081160": "Canton de La Trappe", "081180": "Canton de Pelletier", "081200": "Canton d'Albanel", "081210": "Canton de Normandin"
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
          // If date is in format YYYYMMDD (8 digits), convert to YYYY-MM-DD
          if (dateBpd.length === 8 && /^\d{8}$/.test(dateBpd)) {
            const year = dateBpd.substring(0, 4);
            const month = dateBpd.substring(4, 6);
            const day = dateBpd.substring(6, 8);
            extractedData.date_bpd = `${year}-${month}-${day}`;
          } else {
            // Already in correct format or use as-is
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
        setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[extractedData.circonscription_fonciere] || []);
      }
      
      setFormData(prev => ({
        ...prev,
        numero_lot: extractedData.numero_lot || prev.numero_lot,
        circonscription_fonciere: extractedData.circonscription_fonciere || prev.circonscription_fonciere,
        cadastre: 'Québec',
        types_operation: [typeOperation]
      }));
      
      setShowImportSuccess(true);
      setHasFormChanges(true);
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

  const handleBulkD01Import = async (file) => {
    setIsBulkImporting(true);
    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n');
      const loLines = lines.filter(line => line.startsWith('LO'));
      const suLines = lines.filter(line => line.startsWith('SU'));
      
      const previewLots = [];
      
      // Préparer un aperçu pour chaque ligne LO
      for (let i = 0; i < loLines.length; i++) {
        const loLine = loLines[i];
        const loParts = loLine.split(';');
        const numeroLot = loParts[1] || '';
        
        // Trouver la ligne SU correspondante (première SU après cette LO)
        const loIndex = lines.indexOf(loLine);
        const suLine = suLines.find((su, idx) => lines.indexOf(su) > loIndex && (i === loLines.length - 1 || lines.indexOf(su) < lines.indexOf(loLines[i + 1])));
        
        let baseData = {};
        if (suLine) {
          const suParts = suLine.split(';');
          baseData.circonscription_fonciere = suParts[2] || '';
          const dateBpd = suParts[3] || '';
          if (dateBpd) {
            if (dateBpd.length === 8 && /^\d{8}$/.test(dateBpd)) {
              const year = dateBpd.substring(0, 4);
              const month = dateBpd.substring(4, 6);
              const day = dateBpd.substring(6, 8);
              baseData.date_bpd = `${year}-${month}-${day}`;
            } else {
              baseData.date_bpd = dateBpd;
            }
          }
        }
        
        // Trouver les lignes CO entre cette SU et la prochaine SU (ou fin du fichier)
        const suIndex = lines.indexOf(suLine);
        const nextSuIndex = suLines[suLines.indexOf(suLine) + 1] ? lines.indexOf(suLines[suLines.indexOf(suLine) + 1]) : lines.length;
        const coLines = lines.slice(suIndex + 1, nextSuIndex).filter(line => line.startsWith('CO'));
        
        // Construire les concordances
        const concordances = [];
        coLines.forEach(coLine => {
          const coParts = coLine.split(';');
          const cadastreCode = coParts[1] || '';
          const cadastre = CADASTRE_CODES[cadastreCode] || cadastreCode || 'Québec';
          let rang = coParts[2] ? coParts[2].replace('R', 'Rang ') : '';
          if (rang.match(/^Rang 0(\d+)$/)) {
            rang = rang.replace(/^Rang 0/, 'Rang ');
          }
          const numeroLotConcordance = coParts[3] || '';
          const estPartie = coParts[4] === 'O';
          
          concordances.push({
            circonscription_fonciere: baseData.circonscription_fonciere,
            cadastre: cadastre,
            numero_lot: numeroLotConcordance,
            rang: rang,
            est_partie: estPartie
          });
        });
        
        // Vérifier si le lot existe déjà
        const lotExistant = lots.find(l =>
          l.numero_lot === numeroLot &&
          l.cadastre === 'Québec' &&
          l.circonscription_fonciere === baseData.circonscription_fonciere
        );
        
        // Créer le type d'opération comme pour l'import simple
        const typeOperation = {
          type_operation: "Remplacement",
          date_bpd: baseData.date_bpd || '',
          concordances_anterieures: concordances
        };

        previewLots.push({
          numero_lot: numeroLot,
          cadastre: 'Québec',
          circonscription_fonciere: baseData.circonscription_fonciere,
          types_operation: [typeOperation],
          concordances_count: concordances.length,
          alreadyExists: !!lotExistant
        });
      }
      
      setBulkImportPreview(previewLots);
      setIsBulkImportDialogOpen(true);
      
    } catch (error) {
      console.error("Erreur importation en masse .d01:", error);
      alert("Erreur lors de l'importation du fichier .d01");
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleConfirmBulkImport = async () => {
    if (!bulkImportPreview) return;
    
    setIsCreatingBulkLots(true);
    
    for (const lotData of bulkImportPreview) {
      if (lotData.alreadyExists) {
        continue;
      }
      
      try {
        await base44.entities.Lot.create({
          numero_lot: lotData.numero_lot,
          circonscription_fonciere: lotData.circonscription_fonciere,
          cadastre: lotData.cadastre,
          rang: '',
          types_operation: lotData.types_operation || []
        });
      } catch (error) {
        console.error(`Erreur création lot ${lotData.numero_lot}:`, error);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['lots'] });
    setBulkImportPreview(null);
    setIsCreatingBulkLots(false);
    setIsBulkImportDialogOpen(false);
  };

  const handleBulkD01FileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleBulkD01Import(file);
    }
  };

  const handleExportCSV = () => {
    const csvData = sortedLots.map(lot => ({
      'Numéro de lot': lot.numero_lot,
      'Circonscription foncière': lot.circonscription_fonciere,
      'Cadastre': lot.cadastre || '-',
      'Rang': lot.rang || '-',
      'Date BPD': lot.date_bpd ? format(new Date(lot.date_bpd), "yyyy-MM-dd", { locale: fr }) : '-',
      'Type d\'opération': lot.type_operation || '-'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lots_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statsCards = [
    {
      title: "Total des lots",
      value: lots.length,
      icon: Grid3x3,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Ce mois",
      value: lots.filter(l => {
        const lotDate = new Date(l.created_date);
        const now = new Date();
        return lotDate.getMonth() === now.getMonth() && lotDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Plus,
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Lots
              </h1>
              <Grid3x3 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion des lots cadastraux</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              Extraction CSV
            </Button>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".d01"
                onChange={(e) => {
                  handleBulkD01FileSelect(e);
                  e.target.value = '';
                }}
                className="hidden"
                disabled={isBulkImporting}
              />
              <span className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 border-2 border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent">
                {isBulkImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importation
                  </>
                )}
              </span>
            </label>
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
              if (!open && hasFormChanges) {
                setShowCancelConfirm(true);
                return;
              }
              setIsFormDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau lot
                </Button>
                </DialogTrigger>
            <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">
                  {editingLot ? "Modifier le lot" : "Nouveau lot"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex h-[90vh]">
                {/* Main form content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingLot ? "Modifier le lot" : "Nouveau lot"}
                    </h2>
                  </div>

                  <form id="lot-form" onSubmit={handleSubmit} className="space-y-3">
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
                      lotForm={formData}
                      onLotFormChange={(data) => {
                        setFormData(data);
                        setHasFormChanges(true);
                      }}
                      availableCadastres={availableCadastres}
                      onCirconscriptionChange={handleCirconscriptionChange}
                      isCollapsed={lotInfoCollapsed}
                      onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                    />

                    {/* Section Types d'opération */}
                    <TypesOperationStepForm
                      typesOperation={formData.types_operation || []}
                      onTypesOperationChange={(data) => {
                        setFormData({...formData, types_operation: data});
                        setHasFormChanges(true);
                      }}
                      isCollapsed={typesOperationCollapsed}
                      onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                      allLots={lots}
                    />

                    {/* Section Documents */}
                    <DocumentsStepFormLot
                      lotNumero={formData.numero_lot}
                      circonscription={formData.circonscription_fonciere}
                      isCollapsed={documentsCollapsed}
                      onToggleCollapse={() => setDocumentsCollapsed(!documentsCollapsed)}
                      disabled={false}
                    />

                    {/* Section Dossiers associés - Visible uniquement en mode modification */}
                    {editingLot && (
                      <Card className="border-slate-700 bg-slate-800/30">
                        <CardHeader 
                          className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-2 bg-emerald-900/20"
                          onClick={() => setDossiersAssociesFormCollapsed(!dossiersAssociesFormCollapsed)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
                                <FolderOpen className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-emerald-300 text-base">
                                  Dossiers associés
                                </CardTitle>
                                {(() => {
                                  const associatedDossiers = getDossiersWithLot(formData.numero_lot);
                                  return associatedDossiers.length > 0 && (
                                    <Badge className="bg-emerald-500/30 text-emerald-300 border-emerald-500/50 px-2 py-0.5 text-xs">
                                      {associatedDossiers.length}
                                    </Badge>
                                  );
                                })()}
                              </div>
                            </div>
                            {dossiersAssociesFormCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                          </div>
                        </CardHeader>

                        {!dossiersAssociesFormCollapsed && (
                          <CardContent className="pt-1 pb-2">
                            {(() => {
                              const allAssociatedDossiers = getDossiersWithLot(formData.numero_lot);
                              const uniqueVilles = [...new Set(
                                allAssociatedDossiers
                                  .map(item => item.mandat?.adresse_travaux?.ville)
                                  .filter(ville => ville)
                              )].sort();
                              
                              const filteredAndSorted = getFilteredAndSortedDossiers(formData.numero_lot, true);

                              return allAssociatedDossiers.length > 0 ? (
                                <>
                                  {/* Barre de recherche et filtres */}
                                  <div className="mb-3">
                                   <div className="flex gap-2">
                                     <div className="relative flex-[0_0_33%]">
                                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                                       <Input
                                         placeholder="Rechercher..."
                                         value={formDossierSearchTerm}
                                         onChange={(e) => setFormDossierSearchTerm(e.target.value)}
                                         className="pl-10 bg-slate-800/50 border-slate-700 text-white h-8"
                                       />
                                     </div>
                                      <div className="flex-1">
                                       <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="w-full h-8 bg-slate-800/50 border-slate-700 text-white text-xs justify-between">
                                            <span>Arpenteur ({formFilterArpenteur.length || 'Tous'})</span>
                                            <ChevronDown className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                                          <DropdownMenuLabel>Filtrer par arpenteur</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuCheckboxItem
                                            checked={formFilterArpenteur.length === 0}
                                            onCheckedChange={(checked) => {
                                              if (checked) setFormFilterArpenteur([]);
                                            }}
                                          >
                                            Tous
                                          </DropdownMenuCheckboxItem>
                                          <DropdownMenuSeparator />
                                          {ARPENTEURS.map(arp => (
                                            <DropdownMenuCheckboxItem
                                              key={arp}
                                              checked={formFilterArpenteur.includes(arp)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setFormFilterArpenteur([...formFilterArpenteur, arp]);
                                                } else {
                                                  setFormFilterArpenteur(formFilterArpenteur.filter(a => a !== arp));
                                                }
                                              }}
                                            >
                                              {arp}
                                            </DropdownMenuCheckboxItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      </div>
                                      <div className="flex-1">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="w-full h-8 bg-slate-800/50 border-slate-700 text-white text-xs justify-between">
                                            <span>Type ({formFilterTypeMandat.length || 'Tous'})</span>
                                            <ChevronDown className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                                          <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuCheckboxItem
                                            checked={formFilterTypeMandat.length === 0}
                                            onCheckedChange={(checked) => {
                                              if (checked) setFormFilterTypeMandat([]);
                                            }}
                                          >
                                            Tous
                                          </DropdownMenuCheckboxItem>
                                          <DropdownMenuSeparator />
                                          {TYPES_MANDATS.map(type => (
                                            <DropdownMenuCheckboxItem
                                              key={type}
                                              checked={formFilterTypeMandat.includes(type)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setFormFilterTypeMandat([...formFilterTypeMandat, type]);
                                                } else {
                                                  setFormFilterTypeMandat(formFilterTypeMandat.filter(t => t !== type));
                                                }
                                              }}
                                            >
                                              {type}
                                            </DropdownMenuCheckboxItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      </div>
                                      <div className="flex-1">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="w-full h-8 bg-slate-800/50 border-slate-700 text-white text-xs justify-between">
                                            <span>Ville ({formFilterVille.length || 'Toutes'})</span>
                                            <ChevronDown className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                                          <DropdownMenuLabel>Filtrer par ville</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuCheckboxItem
                                            checked={formFilterVille.length === 0}
                                            onCheckedChange={(checked) => {
                                              if (checked) setFormFilterVille([]);
                                            }}
                                          >
                                            Toutes
                                          </DropdownMenuCheckboxItem>
                                          <DropdownMenuSeparator />
                                          {uniqueVilles.map(ville => (
                                            <DropdownMenuCheckboxItem
                                              key={ville}
                                              checked={formFilterVille.includes(ville)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setFormFilterVille([...formFilterVille, ville]);
                                                } else {
                                                  setFormFilterVille(formFilterVille.filter(v => v !== ville));
                                                }
                                              }}
                                            >
                                              {ville}
                                            </DropdownMenuCheckboxItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      </div>
                                      <div className="flex-1">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="outline" className="w-full h-8 bg-slate-800/50 border-slate-700 text-white text-xs justify-between">
                                            <span>Statut ({formFilterStatut.length || 'Tous'})</span>
                                            <ChevronDown className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                                          <DropdownMenuLabel>Filtrer par statut</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuCheckboxItem
                                            checked={formFilterStatut.length === 0}
                                            onCheckedChange={(checked) => {
                                              if (checked) setFormFilterStatut([]);
                                            }}
                                          >
                                            Tous
                                          </DropdownMenuCheckboxItem>
                                          <DropdownMenuSeparator />
                                          {["Ouvert", "Fermé", "Mandats à ouvrir"].map(statut => (
                                            <DropdownMenuCheckboxItem
                                              key={statut}
                                              checked={formFilterStatut.includes(statut)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setFormFilterStatut([...formFilterStatut, statut]);
                                                } else {
                                                  setFormFilterStatut(formFilterStatut.filter(s => s !== statut));
                                                }
                                              }}
                                            >
                                              {statut}
                                            </DropdownMenuCheckboxItem>
                                          ))}
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                      </div>
                                      </div>
                                      </div>

                                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                          <TableHead 
                                            className="text-slate-300 cursor-pointer hover:text-white"
                                            onClick={() => handleFormSort('numero_dossier')}
                                          >
                                            N° Dossier {getFormSortIcon('numero_dossier')}
                                          </TableHead>
                                          <TableHead 
                                            className="text-slate-300 cursor-pointer hover:text-white"
                                            onClick={() => handleFormSort('type_mandat')}
                                          >
                                            Mandats {getFormSortIcon('type_mandat')}
                                          </TableHead>
                                          <TableHead 
                                            className="text-slate-300 cursor-pointer hover:text-white"
                                            onClick={() => handleFormSort('adresse_travaux')}
                                          >
                                            Adresse des travaux {getFormSortIcon('adresse_travaux')}
                                          </TableHead>
                                          <TableHead 
                                            className="text-slate-300 cursor-pointer hover:text-white"
                                            onClick={() => handleFormSort('statut')}
                                          >
                                            Statut {getFormSortIcon('statut')}
                                          </TableHead>
                                          <TableHead 
                                            className="text-slate-300 cursor-pointer hover:text-white"
                                            onClick={() => handleFormSort('date_ouverture')}
                                          >
                                            Date {getFormSortIcon('date_ouverture')}
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {filteredAndSorted.length > 0 ? (
                                          filteredAndSorted.map((item, idx) => (
                                            <TableRow 
                                              key={`${item.dossier.id}-${idx}`}
                                              className="border-slate-800"
                                            >
                                              <TableCell className="font-medium">
                                                <Badge variant="outline" className={`${getArpenteurColor(item.dossier.arpenteur_geometre)} border`}>
                                                  {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                {item.mandat?.type_mandat ? (
                                                  <Badge variant="outline" className={`${getMandatColor(item.mandat.type_mandat)} border text-xs`}>
                                                    {getAbbreviatedMandatType(item.mandat.type_mandat)}
                                                  </Badge>
                                                ) : (
                                                  <span className="text-slate-600 text-sm">Aucun mandat</span>
                                                )}
                                              </TableCell>
                                              <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                                {item.mandat?.adresse_travaux ? formatAdresse(item.mandat.adresse_travaux) : "-"}
                                              </TableCell>
                                              <TableCell>
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                                  {item.dossier.statut}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-slate-300">
                                                {item.dossier.date_ouverture && !isNaN(new Date(item.dossier.date_ouverture + 'T00:00:00').getTime()) ? format(new Date(item.dossier.date_ouverture + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}
                                              </TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                              Aucun dossier trouvé
                                            </TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </>
                              ) : (
                                <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">
                                  Aucun dossier associé à ce lot
                                </p>
                              );
                            })()}
                          </CardContent>
                        )}
                      </Card>
                    )}
                  </form>

                  {/* Boutons Annuler/Créer tout en bas */}
                  <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800 mt-6">
                    <Button type="button" variant="outline" onClick={() => {
                      if (hasFormChanges) {
                        setShowCancelConfirm(true);
                      } else {
                        setIsFormDialogOpen(false);
                        resetForm();
                      }
                    }} className="border-red-500 text-red-400 hover:bg-red-500/10">
                      Annuler
                    </Button>
                    <Button type="submit" form="lot-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      {editingLot ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </div>

                {/* Right side - Commentaires Sidebar - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
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
                        <CommentairesSectionLot
                          lotId={editingLot?.id}
                          lotTemporaire={!editingLot}
                          onCommentairesTempChange={setCommentairesTemporaires}
                        />
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
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* View Lot Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
          setIsViewDialogOpen(open);
          if (!open) {
            // Reset filters when closing
            setViewDossierSearchTerm("");
            setViewFilterArpenteur("all");
            setViewFilterTypeMandat("all");
            setViewFilterVille("all");
            setViewSortField(null);
            setViewSortDirection("asc");
          }
        }}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Détails du lot</DialogTitle>
            </DialogHeader>
            {viewingLot && (
              <div className="flex h-[90vh]">
                {/* Main content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Lot {viewingLot.numero_lot}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Informations principales */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <Label className="text-slate-400 text-sm">Numéro de lot</Label>
                        <p className="text-white font-medium mt-1">{viewingLot.numero_lot}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Circonscription foncière</Label>
                        <div className="mt-1">
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            {viewingLot.circonscription_fonciere}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Cadastre</Label>
                        <p className="text-white font-medium mt-1">{viewingLot.cadastre || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Rang</Label>
                        <p className="text-white font-medium mt-1">{viewingLot.rang || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Date BPD</Label>
                        <p className="text-white font-medium mt-1">
                          {viewingLot.date_bpd && !isNaN(new Date(viewingLot.date_bpd + 'T00:00:00').getTime()) ? format(new Date(viewingLot.date_bpd + 'T00:00:00'), "dd MMMM yyyy", { locale: fr }) : "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Type d'opération</Label>
                        <div className="mt-1">
                          {viewingLot.type_operation ? (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {viewingLot.type_operation}
                            </Badge>
                          ) : (
                            <p className="text-slate-500 text-sm">-</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Concordances antérieures */}
                    {viewingLot.concordances_anterieures && viewingLot.concordances_anterieures.length > 0 && (
                      <div>
                        <Label className="text-slate-400 mb-3 block">Concordances antérieures</Label>
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead className="text-slate-300">Numéro de lot</TableHead>
                                <TableHead className="text-slate-300">Circonscription</TableHead>
                                <TableHead className="text-slate-300">Cadastre</TableHead>
                                <TableHead className="text-slate-300">Rang</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {viewingLot.concordances_anterieures.map((concordance, index) => (
                                <TableRow key={index} className="border-slate-800">
                                  <TableCell className="text-white font-medium">{concordance.numero_lot}</TableCell>
                                  <TableCell className="text-white">{concordance.circonscription_fonciere}</TableCell>
                                  <TableCell className="text-white">{concordance.cadastre || "-"}</TableCell>
                                  <TableCell className="text-white">{concordance.rang || "-"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Dossiers/Mandats associés avec filtres et tri - Collapsible */}
                    <div>
                      <div 
                        className="cursor-pointer hover:bg-slate-800/50 transition-colors py-2 px-3 rounded-lg mb-3 flex items-center justify-between"
                        onClick={() => setDossiersAssociesCollapsed(!dossiersAssociesCollapsed)}
                      >
                        <Label className="text-slate-400 flex items-center gap-2 cursor-pointer">
                          <FolderOpen className="w-4 h-4" />
                          Dossiers associés
                        </Label>
                        {dossiersAssociesCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                      </div>
                      {(() => {
                        const allAssociatedDossiers = getDossiersWithLot(viewingLot.numero_lot);
                        const uniqueVilles = [...new Set(
                          allAssociatedDossiers
                            .map(item => item.mandat?.adresse_travaux?.ville)
                            .filter(ville => ville)
                        )].sort();
                        
                        const filteredAndSorted = getFilteredAndSortedDossiers(viewingLot.numero_lot);

                        return allAssociatedDossiers.length > 0 ? (
                          <>
                            {!dossiersAssociesCollapsed && (
                            <>
                            {/* Barre de recherche et filtres */}
                            <div className="space-y-3 mb-3">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                                <Input
                                  placeholder="Rechercher..."
                                  value={viewDossierSearchTerm}
                                  onChange={(e) => setViewDossierSearchTerm(e.target.value)}
                                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <Select value={viewFilterArpenteur} onValueChange={setViewFilterArpenteur}>
                                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-sm">
                                    <SelectValue placeholder="Arpenteur" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                                    {ARPENTEURS.map(arp => (
                                      <SelectItem key={arp} value={arp} className="text-white">{arp}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select value={viewFilterTypeMandat} onValueChange={setViewFilterTypeMandat}>
                                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-sm">
                                    <SelectValue placeholder="Type mandat" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                                    {TYPES_MANDATS.map(type => (
                                      <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select value={viewFilterVille} onValueChange={setViewFilterVille}>
                                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-sm">
                                    <SelectValue placeholder="Ville" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="all" className="text-white">Toutes les villes</SelectItem>
                                    {uniqueVilles.map(ville => (
                                      <SelectItem key={ville} value={ville} className="text-white">{ville}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="border border-slate-700 rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                    <TableHead 
                                      className="text-slate-300 cursor-pointer hover:text-white"
                                      onClick={() => handleViewSort('numero_dossier')}
                                    >
                                      N° Dossier {getViewSortIcon('numero_dossier')}
                                    </TableHead>
                                    <TableHead 
                                      className="text-slate-300 cursor-pointer hover:text-white"
                                      onClick={() => handleViewSort('clients')}
                                    >
                                      Clients {getViewSortIcon('clients')}
                                    </TableHead>
                                    <TableHead 
                                      className="text-slate-300 cursor-pointer hover:text-white"
                                      onClick={() => handleViewSort('type_mandat')}
                                    >
                                      Type de mandat {getViewSortIcon('type_mandat')}
                                    </TableHead>
                                    <TableHead 
                                      className="text-slate-300 cursor-pointer hover:text-white"
                                      onClick={() => handleViewSort('date_minute')}
                                    >
                                      Date de minute {getViewSortIcon('date_minute')}
                                    </TableHead>
                                    <TableHead 
                                      className="text-slate-300 cursor-pointer hover:text-white"
                                      onClick={() => handleViewSort('adresse_travaux')}
                                    >
                                      Adresse travaux {getViewSortIcon('adresse_travaux')}
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredAndSorted.length > 0 ? (
                                    filteredAndSorted.map((item, idx) => (
                                      <TableRow 
                                        key={`${item.dossier.id}-${idx}`}
                                        className="border-slate-800"
                                      >
                                        <TableCell className="font-medium text-white font-mono">
                                          {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm">
                                          {getClientsNames(item.dossier.clients_ids)}
                                        </TableCell>
                                        <TableCell>
                                          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                            {item.mandat.type_mandat}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm">
                                          {item.mandat?.date_minute && !isNaN(new Date(item.mandat.date_minute + 'T00:00:00').getTime()) ? format(new Date(item.mandat.date_minute + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                          {item.mandat?.adresse_travaux ? formatAdresse(item.mandat.adresse_travaux) : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                        Aucun dossier trouvé
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                            </>
                            )}
                          </>
                        ) : (
                          !dossiersAssociesCollapsed && (
                            <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">
                              Aucun dossier associé à ce lot
                            </p>
                          )
                        );
                      })()}
                    </div>
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
                  <div className="flex-1 overflow-hidden p-4">
                    <CommentairesSectionLot
                      lotId={viewingLot?.id}
                      lotTemporaire={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Bulk Import Preview/Results Dialog */}
        <Dialog open={isBulkImportDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setBulkImportPreview(null);
            setBulkImportResults(null);
          }
          setIsBulkImportDialogOpen(open);
        }}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl shadow-black/50">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {bulkImportPreview ? "Aperçu de l'importation" : "Résultats de l'importation"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[70vh] p-4">
              {/* Preview Mode */}
              {bulkImportPreview && (
                <>
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                          <TableHead className="text-slate-300">Statut</TableHead>
                          <TableHead className="text-slate-300">Numéro de lot</TableHead>
                          <TableHead className="text-slate-300">Cadastre</TableHead>
                          <TableHead className="text-slate-300">Circonscription</TableHead>
                          <TableHead className="text-slate-300">Concordances</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkImportPreview.map((lot, index) => {
                          const concordances = lot.types_operation?.[0]?.concordances_anterieures || [];
                          return (
                            <TableRow key={index} className="border-slate-800">
                              <TableCell>
                                {lot.alreadyExists ? (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                    Existe déjà
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    À créer
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-white font-medium">
                                {lot.numero_lot}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {lot.cadastre || "-"}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {lot.circonscription_fonciere}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {concordances.length > 0 ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 cursor-help">
                                          <span>{concordances.length}</span>
                                          <Info className="w-3 h-3 text-slate-500" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="bg-slate-800 border-slate-700 max-w-sm">
                                        <div className="space-y-1">
                                          {concordances.map((conc, idx) => (
                                            <div key={idx} className="text-xs">
                                              <span className="text-white font-medium">{conc.numero_lot}</span>
                                              {conc.est_partie && <span className="text-slate-400"> Ptie</span>}
                                              <span className="text-slate-400">
                                                {conc.rang ? ` • ${conc.rang}` : ''}
                                                {conc.cadastre ? ` • ${conc.cadastre}` : ''}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  "0"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Results Mode */}
              {bulkImportResults && (
                <>
                  <div className="mb-4 flex gap-4">
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex-1">
                      <p className="text-emerald-400 font-semibold">
                        {bulkImportResults.filter(r => r.success).length} lots créés
                      </p>
                    </div>
                    {bulkImportResults.filter(r => !r.success).length > 0 && (
                      <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex-1">
                        <p className="text-red-400 font-semibold">
                          {bulkImportResults.filter(r => !r.success).length} erreurs
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                          <TableHead className="text-slate-300">Statut</TableHead>
                          <TableHead className="text-slate-300">Numéro de lot</TableHead>
                          <TableHead className="text-slate-300">Cadastre</TableHead>
                          <TableHead className="text-slate-300">Circonscription</TableHead>
                          <TableHead className="text-slate-300">Concordances</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkImportResults.map((result, index) => (
                          <TableRow key={index} className="border-slate-800">
                            <TableCell>
                              {result.success ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  Créé
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  Erreur
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-white font-medium">
                              {result.numero_lot}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {result.cadastre || "-"}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {result.circonscription_fonciere}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {result.concordances && result.concordances.length > 0 ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center gap-1 cursor-help">
                                        <span>{result.concordances_count}</span>
                                        <Info className="w-3 h-3 text-slate-500" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-slate-800 border-slate-700 max-w-sm">
                                      <div className="space-y-1">
                                        {result.concordances.map((conc, idx) => (
                                          <div key={idx} className="text-xs">
                                            <span className="text-white font-medium">{conc.numero_lot}</span>
                                            {conc.est_partie && <span className="text-slate-400"> Ptie</span>}
                                            <span className="text-slate-400">
                                              {conc.rang ? ` • ${conc.rang}` : ''}
                                              {conc.cadastre ? ` • ${conc.cadastre}` : ''}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                result.concordances_count || 0
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {bulkImportResults.filter(r => !r.success).length > 0 && (
                    <div className="mt-4 p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <p className="text-slate-400 text-sm mb-2 font-semibold">Détails des erreurs:</p>
                      {bulkImportResults.filter(r => !r.success).map((result, index) => (
                        <p key={index} className="text-red-400 text-sm">
                          • {result.numero_lot}: {result.error}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              {bulkImportPreview ? (
                <>
                  <Button 
                    onClick={() => {
                      setIsBulkImportDialogOpen(false);
                      setBulkImportPreview(null);
                    }}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                    disabled={isCreatingBulkLots}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleConfirmBulkImport}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                    disabled={isCreatingBulkLots || bulkImportPreview.filter(l => !l.alreadyExists).length === 0}
                  >
                    {isCreatingBulkLots ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      `Créer ${bulkImportPreview.filter(l => !l.alreadyExists).length} lot(s)`
                    )}
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => {
                    setIsBulkImportDialogOpen(false);
                    setBulkImportResults(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  Fermer
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de succès d'import .d01 */}
        <Dialog open={showImportSuccess} onOpenChange={setShowImportSuccess}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3">
                <span className="text-2xl">✅</span>
                Succès
                <span className="text-2xl">✅</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300 text-center">
                Données importées avec succès depuis le fichier .d01
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  type="button" 
                  onClick={() => setShowImportSuccess(false)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  OK
                </Button>
              </div>
            </div>
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
            <div className="space-y-4">
              <p className="text-slate-300 text-center">
                Le lot <span className="text-emerald-400 font-semibold">{formData.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{formData.circonscription_fonciere}</span>.
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
            </div>
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
            <div className="space-y-4">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation d'annulation */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
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
                    setShowCancelConfirm(false);
                    setIsFormDialogOpen(false);
                    resetForm();
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Confirmer la suppression
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer ce lot ? Cette action est irréversible.
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setLotToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (lotToDelete) {
                      deleteLotMutation.mutate(lotToDelete);
                    }
                    setShowDeleteConfirm(false);
                    setLotToDelete(null);
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="hidden grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <CardTitle className="text-3xl font-bold mt-2 text-white">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} opacity-20`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-800">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white md:w-64"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-56 bg-slate-800/50 border-slate-700 text-white justify-between">
                        <span>Circonscription ({filterCirconscription.length || 'Toutes'})</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                      <DropdownMenuLabel>Filtrer par circonscription</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filterCirconscription.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) setFilterCirconscription([]);
                        }}
                      >
                        Toutes
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                        <DropdownMenuCheckboxItem
                          key={circ}
                          checked={filterCirconscription.includes(circ)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterCirconscription([...filterCirconscription, circ]);
                            } else {
                              setFilterCirconscription(filterCirconscription.filter((c) => c !== circ));
                            }
                          }}
                        >
                          {circ}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-44 bg-slate-800/50 border-slate-700 text-white justify-between">
                        <span>Cadastre ({filterCadastre.length || 'Tous'})</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                      <DropdownMenuLabel>Filtrer par cadastre</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filterCadastre.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) setFilterCadastre([]);
                        }}
                      >
                        Tous
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {[...new Set(lots.map(l => l.cadastre).filter(c => c))].sort().map((cadastre) => (
                        <DropdownMenuCheckboxItem
                          key={cadastre}
                          checked={filterCadastre.includes(cadastre)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterCadastre([...filterCadastre, cadastre]);
                            } else {
                              setFilterCadastre(filterCadastre.filter((c) => c !== cadastre));
                            }
                          }}
                        >
                          {cadastre}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-52 bg-slate-800/50 border-slate-700 text-white justify-between">
                        <span>Type ({filterTypeOperation.length || 'Tous'})</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                      <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filterTypeOperation.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) setFilterTypeOperation([]);
                        }}
                      >
                        Tous
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {TYPES_OPERATIONS.map((type) => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={filterTypeOperation.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterTypeOperation([...filterTypeOperation, type]);
                            } else {
                              setFilterTypeOperation(filterTypeOperation.filter((t) => t !== type));
                            }
                          }}
                        >
                          {type}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-40 bg-slate-800/50 border-slate-700 text-white justify-between">
                        <span>Rang ({filterRang.length || 'Tous'})</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                      <DropdownMenuLabel>Filtrer par rang</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filterRang.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) setFilterRang([]);
                        }}
                      >
                        Tous
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {[...new Set(lots.map(l => l.rang).filter(r => r))].sort().map((rang) => (
                        <DropdownMenuCheckboxItem
                          key={rang}
                          checked={filterRang.includes(rang)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterRang([...filterRang, rang]);
                            } else {
                              setFilterRang(filterRang.filter((r) => r !== rang));
                            }
                          }}
                        >
                          {rang}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {(filterCirconscription.length > 0 || filterCadastre.length > 0 || filterTypeOperation.length > 0 || filterRang.length > 0) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterCirconscription([]);
                        setFilterCadastre([]);
                        setFilterTypeOperation([]);
                        setFilterRang([]);
                      }}
                      className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('numero_lot')}
                    >
                      Numéro de lot {sortField === 'numero_lot' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('circonscription')}
                    >
                      Circonscription {sortField === 'circonscription' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('cadastre')}
                    >
                      Cadastre {sortField === 'cadastre' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('rang')}
                    >
                      Rang {sortField === 'rang' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('date_bpd')}
                    >
                      Date BPD {sortField === 'date_bpd' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('type_operation')}
                    >
                      Type d'opération {sortField === 'type_operation' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLots.map((lot) => (
                    <TableRow 
                      key={lot.id} 
                      className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                      onClick={() => handleEdit(lot)}
                    >
                      <TableCell className="font-medium text-white">
                        {lot.numero_lot}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lot.circonscription_fonciere}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lot.cadastre || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {lot.rang || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {(() => {
                          if (!lot.types_operation || lot.types_operation.length === 0) return "-";
                          const mostRecent = lot.types_operation.reduce((latest, current) => {
                            if (!current.date_bpd) return latest;
                            if (!latest.date_bpd) return current;
                            return new Date(current.date_bpd) > new Date(latest.date_bpd) ? current : latest;
                          }, lot.types_operation[0]);
                          return mostRecent.date_bpd && !isNaN(new Date(mostRecent.date_bpd + 'T00:00:00').getTime()) 
                            ? format(new Date(mostRecent.date_bpd + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) 
                            : "-";
                        })()}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {(() => {
                          if (!lot.types_operation || lot.types_operation.length === 0) return "-";
                          const mostRecent = lot.types_operation.reduce((latest, current) => {
                            if (!current.date_bpd) return latest;
                            if (!latest.date_bpd) return current;
                            return new Date(current.date_bpd) > new Date(latest.date_bpd) ? current : latest;
                          }, lot.types_operation[0]);
                          return mostRecent.type_operation || "-";
                        })()}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(lot.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}