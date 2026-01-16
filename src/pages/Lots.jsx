import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Grid3x3, ArrowUpDown, ArrowUp, ArrowDown, Eye, ExternalLink, Download, Upload, Loader2, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";
import DocumentsStepFormLot from "../components/lots/DocumentsStepFormLot";
import LotInfoStepForm from "../components/lots/LotInfoStepForm";
import ConcordanceStepForm from "../components/lots/ConcordanceStepForm";

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
  const [concordancesAnterieure, setConcordancesAnterieure] = useState([]);
  const [editingConcordanceIndex, setEditingConcordanceIndex] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(false);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [concordanceCollapsed, setConcordanceCollapsed] = useState(false);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [newConcordance, setNewConcordance] = useState({
    circonscription_fonciere: "",
    cadastre: "",
    numero_lot: "",
    rang: ""
  });

  // New state for View Dialog filters and sorting
  const [viewDossierSearchTerm, setViewDossierSearchTerm] = useState("");
  const [viewFilterArpenteur, setViewFilterArpenteur] = useState("all");
  const [viewFilterTypeMandat, setViewFilterTypeMandat] = useState("all");
  const [viewFilterVille, setViewFilterVille] = useState("all");
  const [viewSortField, setViewSortField] = useState(null);
  const [viewSortDirection, setViewSortDirection] = useState("asc");

  const [formData, setFormData] = useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "",
    rang: "",
    date_bpd: "",
    type_operation: ""
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
      
      return newLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsFormDialogOpen(false); // Renamed from setIsDialogOpen
      resetForm();
      setCommentairesTemporaires([]);
    },
    onError: (error) => { // Added onError
      alert(error.message);
    }
  });

  const updateLotMutation = useMutation({
    mutationFn: ({ id, lotData }) => {
      // Validation moved to handleSubmit
      return base44.entities.Lot.update(id, lotData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsFormDialogOpen(false); // Renamed from setIsDialogOpen
      setIsViewDialogOpen(false); // Added as lot might be updated from view dialog
      resetForm();
    },
    onError: (error) => { // Added onError
      alert(error.message);
    }
  });

  const deleteLotMutation = useMutation({
    mutationFn: (id) => base44.entities.Lot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
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
    if (addr.province) parts.push(addr.province);
    if (addr.code_postal) parts.push(addr.code_postal);
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
    
    // Validation pour vérifier si le lot existe déjà
    const lotExistant = lots.find(l =>
      l.id !== editingLot?.id && // Exclure le lot actuel en modification
      l.numero_lot === formData.numero_lot &&
      l.cadastre === formData.cadastre &&
      l.circonscription_fonciere === formData.circonscription_fonciere
    );

    if (lotExistant) {
      alert(`Un lot ${formData.numero_lot} existe déjà dans le cadastre ${formData.cadastre} de ${formData.circonscription_fonciere}.`);
      return;
    }

    const dataToSubmit = {
      ...formData,
      concordances_anterieures: concordancesAnterieure
    };
    
    if (editingLot) {
      updateLotMutation.mutate({ id: editingLot.id, lotData: dataToSubmit });
    } else {
      createLotMutation.mutate(dataToSubmit);
    }
  };

  const handleCirconscriptionChange = (value) => {
    setFormData(prev => ({ ...prev, circonscription_fonciere: value, cadastre: "" }));
    setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
  };

  const addConcordance = () => {
    if (newConcordance.numero_lot && newConcordance.circonscription_fonciere) {
      if (editingConcordanceIndex !== null) {
        const updated = [...concordancesAnterieure];
        updated[editingConcordanceIndex] = { ...newConcordance };
        setConcordancesAnterieure(updated);
        setEditingConcordanceIndex(null);
      } else {
        setConcordancesAnterieure([...concordancesAnterieure, { ...newConcordance }]);
      }
      setNewConcordance({
        circonscription_fonciere: "",
        cadastre: "",
        numero_lot: "",
        rang: ""
      });
    }
  };

  const editConcordance = (index) => {
    setNewConcordance({ ...concordancesAnterieure[index] });
    setEditingConcordanceIndex(index);
  };

  const cancelEditConcordance = () => {
    setNewConcordance({
      circonscription_fonciere: "",
      cadastre: "",
      numero_lot: "",
      rang: ""
    });
    setEditingConcordanceIndex(null);
  };

  const removeConcordance = (index) => {
    setConcordancesAnterieure(concordancesAnterieure.filter((_, i) => i !== index));
    if (editingConcordanceIndex === index) {
      cancelEditConcordance();
    } else if (editingConcordanceIndex !== null && index < editingConcordanceIndex) {
      setEditingConcordanceIndex(editingConcordanceIndex - 1);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_lot: "",
      circonscription_fonciere: "",
      cadastre: "",
      rang: "",
      date_bpd: "",
      type_operation: ""
    });
    setConcordancesAnterieure([]);
    setNewConcordance({
      circonscription_fonciere: "",
      cadastre: "",
      numero_lot: "",
      rang: ""
    });
    setEditingLot(null);
    setAvailableCadastres([]);
    setEditingConcordanceIndex(null);
    setCommentairesTemporaires([]);
  };

  const handleEdit = (lot) => {
    setIsViewDialogOpen(false);
    setViewingLot(null);
    
    setEditingLot(lot);
    setFormData({
      numero_lot: lot.numero_lot || "",
      circonscription_fonciere: lot.circonscription_fonciere || "",
      cadastre: lot.cadastre || "",
      rang: lot.rang || "",
      date_bpd: lot.date_bpd ? format(new Date(lot.date_bpd), 'yyyy-MM-dd') : "",
      type_operation: lot.type_operation || ""
    });
    setConcordancesAnterieure(lot.concordances_anterieures || []);
    if (lot.circonscription_fonciere) {
      setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[lot.circonscription_fonciere] || []);
    }
    setIsFormDialogOpen(true); // Renamed from setIsDialogOpen
    setEditingConcordanceIndex(null);
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

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce lot ?")) {
      deleteLotMutation.mutate(id);
    }
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

  const getFilteredAndSortedDossiers = (lotNumero) => {
    const associatedDossiers = getDossiersWithLot(lotNumero);
    
    // Filter
    const filtered = associatedDossiers.filter(item => {
      const searchLower = viewDossierSearchTerm.toLowerCase();
      const clientsNames = getClientsNames(item.dossier.clients_ids);
      const adresseTravaux = item.mandat?.adresse_travaux ? formatAdresse(item.mandat.adresse_travaux) : "";
      
      const matchesSearch = (
        item.dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
        (getArpenteurInitials(item.dossier.arpenteur_geometre) + item.dossier.numero_dossier).toLowerCase().includes(searchLower) ||
        clientsNames.toLowerCase().includes(searchLower) ||
        item.mandat?.type_mandat?.toLowerCase().includes(searchLower) ||
        adresseTravaux.toLowerCase().includes(searchLower)
      );

      const matchesArpenteur = viewFilterArpenteur === "all" || item.dossier.arpenteur_geometre === viewFilterArpenteur;
      const matchesTypeMandat = viewFilterTypeMandat === "all" || item.mandat?.type_mandat === viewFilterTypeMandat;
      const matchesVille = viewFilterVille === "all" || item.mandat?.adresse_travaux?.ville === viewFilterVille;

      return matchesSearch && matchesArpenteur && matchesTypeMandat && matchesVille;
    });

    // Sort
    if (!viewSortField) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (viewSortField) {
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
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return viewSortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        if (aValue < bValue) return viewSortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return viewSortDirection === "asc" ? 1 : -1;
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
        extractedData.date_bpd = suParts[3] || '';
      }
      
      extractedData.cadastre = 'Québec';
      extractedData.concordances_anterieures = [];
      
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
          
          extractedData.concordances_anterieures.push({
            circonscription_fonciere: extractedData.circonscription_fonciere,
            cadastre: cadastre,
            numero_lot: numeroLot,
            rang: rang,
            est_partie: estPartie
          });
        });
      }
      
      setFormData(prev => ({
        ...prev,
        numero_lot: extractedData.numero_lot || prev.numero_lot,
        circonscription_fonciere: extractedData.circonscription_fonciere || prev.circonscription_fonciere,
        cadastre: extractedData.cadastre || prev.cadastre,
        date_bpd: extractedData.date_bpd || prev.date_bpd,
      }));
      
      setConcordancesAnterieure(extractedData.concordances_anterieures || []);
      
      if (extractedData.circonscription_fonciere) {
        setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[extractedData.circonscription_fonciere] || []);
      }
      
      alert("Données importées avec succès depuis le fichier .d01");
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
            <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
              setIsFormDialogOpen(open); // Renamed from setIsDialogOpen
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                  <Plus className="w-5 h-5 mr-2" />
                  Nouveau lot
                </Button>
                </DialogTrigger>
            <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
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
                      onLotFormChange={setFormData}
                      availableCadastres={availableCadastres}
                      onCirconscriptionChange={handleCirconscriptionChange}
                      isCollapsed={lotInfoCollapsed}
                      onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                      disabled={false}
                      CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                    />

                    {/* Section Concordances antérieures */}
                    <ConcordanceStepForm
                      concordancesAnterieure={concordancesAnterieure}
                      onConcordancesChange={setConcordancesAnterieure}
                      newConcordance={newConcordance}
                      onNewConcordanceChange={setNewConcordance}
                      availableCadastres={newConcordance.circonscription_fonciere ? CADASTRES_PAR_CIRCONSCRIPTION[newConcordance.circonscription_fonciere] : []}
                      onAddConcordance={addConcordance}
                      onRemoveConcordance={removeConcordance}
                      onCirconscriptionChange={(value) => setNewConcordance({...newConcordance, circonscription_fonciere: value, cadastre: ""})}
                      editingIndex={editingConcordanceIndex}
                      onEditConcordance={editConcordance}
                      onCancelEdit={cancelEditConcordance}
                      isCollapsed={concordanceCollapsed}
                      onToggleCollapse={() => setConcordanceCollapsed(!concordanceCollapsed)}
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
                  </form>

                  {/* Boutons Annuler/Créer tout en bas */}
                  <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800 mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">
                      Annuler
                    </Button>
                    <Button type="submit" form="lot-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      {editingLot ? "Modifier" : "Créer"}
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
                      lotId={editingLot?.id}
                      lotTemporaire={!editingLot}
                      onCommentairesTempChange={setCommentairesTemporaires}
                    />
                  </div>
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
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
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
                          {viewingLot.date_bpd ? format(new Date(viewingLot.date_bpd), "dd MMMM yyyy", { locale: fr }) : "-"}
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

                    {/* Dossiers/Mandats associés avec filtres et tri */}
                    <div>
                      <Label className="text-slate-400 mb-3 block">Dossiers/Mandats associés</Label>
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
                                          {item.mandat?.date_minute ? format(new Date(item.mandat.date_minute), "dd MMM yyyy", { locale: fr }) : "-"}
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
                        ) : (
                          <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">
                            Aucun dossier associé à ce lot
                          </p>
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
                      <TableCell className="text-slate-300 text-sm">
                        {lot.date_bpd ? format(new Date(lot.date_bpd), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        {lot.type_operation ? (
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {lot.type_operation}
                          </Badge>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
                        )}
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