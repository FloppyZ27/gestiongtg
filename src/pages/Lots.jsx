
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Grid3x3, ArrowUpDown, ArrowUp, ArrowDown, Eye, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";

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
  const [filterCirconscription, setFilterCirconscription] = useState("all");
  const [filterCadastre, setFilterCadastre] = useState("all");
  const [filterTypeOperation, setFilterTypeOperation] = useState("all");
  const [availableCadastres, setAvailableCadastres] = useState([]);
  const [concordancesAnterieure, setConcordancesAnterieure] = useState([]);
  const [editingConcordanceIndex, setEditingConcordanceIndex] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
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
      // Vérifier si un lot avec le même numéro, cadastre et circonscription existe déjà
      const lotExistant = lots.find(l =>
        l.numero_lot === lotData.numero_lot &&
        l.cadastre === lotData.cadastre &&
        l.circonscription_fonciere === lotData.circonscription_fonciere
      );

      if (lotExistant) {
        throw new Error(`Un lot ${lotData.numero_lot} existe déjà dans le cadastre ${lotData.cadastre} de ${lotData.circonscription_fonciere}.`);
      }
      
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
      // Vérifier si un lot avec le même numéro, cadastre et circonscription existe déjà (sauf pour lui-même)
      const lotExistant = lots.find(l =>
        l.id !== id && // Exclure le lot actuel
        l.numero_lot === lotData.numero_lot &&
        l.cadastre === lotData.cadastre &&
        l.circonscription_fonciere === lotData.circonscription_fonciere
      );

      if (lotExistant) {
        throw new Error(`Un lot ${lotData.numero_lot} existe déjà dans le cadastre ${lotData.cadastre} de ${lotData.circonscription_fonciere}.`);
      }

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

    const matchesCirconscription = filterCirconscription === "all" || lot.circonscription_fonciere === filterCirconscription;
    const matchesCadastre = filterCadastre === "all" || lot.cadastre === filterCadastre;
    const matchesTypeOperation = filterTypeOperation === "all" || lot.type_operation === filterTypeOperation;

    return matchesSearch && matchesCirconscription && matchesCadastre && matchesTypeOperation;
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
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
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

                  <form id="lot-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Circonscription foncière <span className="text-red-400">*</span></Label>
                        <Select value={formData.circonscription_fonciere} onValueChange={handleCirconscriptionChange}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                              <SelectItem key={circ} value={circ} className="text-white">
                                {circ}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Cadastre</Label>
                        <Select 
                          value={formData.cadastre} 
                          onValueChange={(value) => setFormData({...formData, cadastre: value})}
                          disabled={!formData.circonscription_fonciere}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder={formData.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                            {availableCadastres.map((cadastre) => (
                              <SelectItem key={cadastre} value={cadastre} className="text-white">
                                {cadastre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Numéro de lot <span className="text-red-400">*</span></Label>
                        <Input
                          value={formData.numero_lot}
                          onChange={(e) => setFormData({...formData, numero_lot: e.target.value})}
                          required
                          placeholder="Ex: 1234-5678"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rang</Label>
                        <Input
                          value={formData.rang}
                          onChange={(e) => setFormData({...formData, rang: e.target.value})}
                          placeholder="Ex: Rang 4"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date BPD</Label>
                        <Input
                          type="date"
                          value={formData.date_bpd}
                          onChange={(e) => setFormData({...formData, date_bpd: e.target.value})}
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type d'opération</Label>
                        <Select value={formData.type_operation} onValueChange={(value) => setFormData({...formData, type_operation: value})}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {TYPES_OPERATIONS.map((type) => (
                              <SelectItem key={type} value={type} className="text-white">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Section Concordances antérieures */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Concordances antérieures</Label>
                      
                      {/* Formulaire d'ajout/édition */}
                      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3">
                        {editingConcordanceIndex !== null && (
                          <div className="mb-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-blue-400 text-sm">
                            Mode édition - Modification de la concordance #{editingConcordanceIndex + 1}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Circonscription foncière</Label>
                            <Select 
                              value={newConcordance.circonscription_fonciere} 
                              onValueChange={(value) => setNewConcordance({...newConcordance, circonscription_fonciere: value, cadastre: ""})}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                                  <SelectItem key={circ} value={circ} className="text-white">
                                    {circ}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Cadastre</Label>
                            <Select
                              value={newConcordance.cadastre}
                              onValueChange={(value) => setNewConcordance({...newConcordance, cadastre: value})}
                              disabled={!newConcordance.circonscription_fonciere}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder={newConcordance.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                                {newConcordance.circonscription_fonciere && CADASTRES_PAR_CIRCONSCRIPTION[newConcordance.circonscription_fonciere]?.map((cadastre) => (
                                  <SelectItem key={cadastre} value={cadastre} className="text-white">
                                    {cadastre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Numéro de lot</Label>
                            <Input
                              value={newConcordance.numero_lot}
                              onChange={(e) => setNewConcordance({...newConcordance, numero_lot: e.target.value})}
                              placeholder="Ex: 1234-5678"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rang</Label>
                            <Input
                              value={newConcordance.rang}
                              onChange={(e) => setNewConcordance({...newConcordance, rang: e.target.value})}
                              placeholder="Ex: Rang 4"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={addConcordance}
                            disabled={!newConcordance.numero_lot || !newConcordance.circonscription_fonciere}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {editingConcordanceIndex !== null ? "Enregistrer les modifications" : "Ajouter cette concordance"}
                          </Button>
                          {editingConcordanceIndex !== null && (
                            <Button
                              type="button"
                              onClick={cancelEditConcordance}
                              variant="outline"
                              className="bg-slate-700 hover:bg-slate-600 text-white"
                            >
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Tableau des concordances ajoutées */}
                      {concordancesAnterieure.length > 0 && (
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead className="text-slate-300">Numéro de lot</TableHead>
                                <TableHead className="text-slate-300">Circonscription</TableHead>
                                <TableHead className="text-slate-300">Cadastre</TableHead>
                                <TableHead className="text-slate-300">Rang</TableHead>
                                <TableHead className="text-slate-300 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {concordancesAnterieure.map((concordance, index) => (
                                <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white font-medium">{concordance.numero_lot}</TableCell>
                                  <TableCell className="text-white">{concordance.circonscription_fonciere}</TableCell>
                                  <TableCell className="text-white">{concordance.cadastre || "-"}</TableCell>
                                  <TableCell className="text-white">{concordance.rang || "-"}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => editConcordance(index)}
                                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeConcordance(index)}
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
                      )}
                    </div>
                  </form>

                  {/* Boutons Annuler/Créer tout en bas */}
                  <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
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
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
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
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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
                  <Select value={filterCirconscription} onValueChange={setFilterCirconscription}>
                    <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
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
                  <Select value={filterCadastre} onValueChange={setFilterCadastre}>
                    <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Cadastre" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                      {filterCirconscription !== "all" && CADASTRES_PAR_CIRCONSCRIPTION[filterCirconscription]?.map((cadastre) => (
                        <SelectItem key={cadastre} value={cadastre} className="text-white">
                          {cadastre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterTypeOperation} onValueChange={setFilterTypeOperation}>
                    <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Type d'opération" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                      {TYPES_OPERATIONS.map((type) => (
                        <SelectItem key={type} value={type} className="text-white">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      Numéro de lot {getSortIcon('numero_lot')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('circonscription')}
                    >
                      Circonscription {getSortIcon('circonscription')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('cadastre')}
                    >
                      Cadastre {getSortIcon('cadastre')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('rang')}
                    >
                      Rang {getSortIcon('rang')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('date_bpd')}
                    >
                      Date BPD {getSortIcon('date_bpd')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('type_operation')}
                    >
                      Type d'opération {getSortIcon('type_operation')}
                    </TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLots.map((lot) => (
                    <TableRow 
                      key={lot.id} 
                      className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                      onClick={() => handleView(lot)}
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
                            onClick={() => handleEdit(lot)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
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
