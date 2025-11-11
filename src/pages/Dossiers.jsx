import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, User, X, UserPlus, Check, Upload, FileText, ExternalLink, Grid3x3, Eye } from "lucide-react";
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

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

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

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    statut: "Ouvert",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
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

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const createDossierMutation = useMutation({
    mutationFn: async (dossierData) => {
      const newDossier = await base44.entities.Dossier.create(dossierData);

      if (commentairesTemporaires.length > 0) {
        const commentairePromises = commentairesTemporaires.map(comment =>
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
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, dossierData }) => base44.entities.Dossier.update(id, dossierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
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

  const createLotMutation = useMutation({
    mutationFn: (lotData) => base44.entities.Lot.create(lotData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      setIsNewLotDialogOpen(false);
      resetNewLotForm();
    },
  });

  const clientsReguliers = clients.filter(c => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter(c => c.type_client === 'Notaire');
  const courtiers = clients.filter(c => c.type_client === 'Courtier immobilier');

  const getClientById = (id) => clients.find(c => c.id === id);
  const getLotById = (numeroLot) => lots.find(l => l.id === numeroLot);
  const getUserByEmail = (email) => users.find(u => u.email === email);

  const availableLotCadastres = newLotForm.circonscription_fonciere
    ? CADASTRES_PAR_CIRCONSCRIPTION[newLotForm.circonscription_fonciere] || []
    : [];

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
    lots.filter(lot => {
      const matchesSearch = lot.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
        lot.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
        lot.circonscription_fonciere?.toLowerCase().includes(lotSearchTerm.toLowerCase());

      const matchesCirconscription = lotCirconscriptionFilter === "all" ||
        lot.circonscription_fonciere === lotCirconscriptionFilter;

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

  const filteredDossiers = dossiers.filter(dossier => {
    if (dossier.statut !== "Ouvert" && dossier.statut !== "Fermé") {
      return false;
    }

    const searchLower = searchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      dossier.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some(mandat =>
        mandat.type_mandat?.toLowerCase().includes(searchLower) ||
        mandat.tache_actuelle?.toLowerCase().includes(searchLower) ||
        mandat.adresse_travaux?.rue?.toLowerCase().includes(searchLower) ||
        mandat.adresse_travaux?.ville?.toLowerCase().includes(searchLower)
      )
    );
  });

  const filteredClientsForSelector = sortClientsWithSelected(
    clientsReguliers.filter(c =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
      c.telephones?.some(tel => tel.telephone?.toLowerCase().includes(clientSearchTerm.toLowerCase()))
    ),
    formData.clients_ids
  );

  const filteredNotairesForSelector = sortClientsWithSelected(
    notaires.filter(n =>
      `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase()) ||
      n.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
      n.telephones?.some(tel => tel.telephone?.toLowerCase().includes(notaireSearchTerm.toLowerCase()))
    ),
    formData.notaires_ids
  );

  const filteredCourtiersForSelector = sortClientsWithSelected(
    courtiers.filter(c =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase()) ||
      c.courriels?.some(courriel => courriel.courriel?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
      c.telephones?.some(tel => tel.telephone?.toLowerCase().includes(courtierSearchTerm.toLowerCase()))
    ),
    formData.courtiers_ids
  );

  const handleSubmit = (e) => {
    e.preventDefault();
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
    setNewLotForm({
      ...newLotForm,
      circonscription_fonciere: value,
      cadastre: ""
    });
  };

  const resetForm = () => {
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      date_ouverture: new Date().toISOString().split('T')[0],
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
      statut: entity.statut || "Ouvert",
      clients_ids: entity.clients_ids || [],
      notaires_ids: entity.notaires_ids || [],
      courtiers_ids: entity.courtiers_ids || [],
      mandats: entity.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        minute: m.minute || "",
        date_minute: m.date_minute || "",
        tache_actuelle: m.tache_actuelle || "",
        statut_terrain: m.statut_terrain || "",
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

  const handleDelete = (id, nom) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${nom} ? Cette action est irréversible.`)) {
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
        province: ""
      };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];

    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        minute: "",
        date_minute: "",
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
        notes: ""
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

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
  };

  const updateMandat = (index, field, value) => {
    setFormData(prev => ({
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
            return {
              ...m,
              terrain: { ...m.terrain, ...value }
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
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.filter((_, i) => i !== index)
      }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotId) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer ce lot de ce mandat ?`)) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === mandatIndex ? { ...m, lots: m.lots.filter((id) => id !== lotId) } : m
        )
      }));
    }
  };

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const statsCards = [
    {
      title: "Total des dossiers",
      value: dossiers.length,
      icon: FolderOpen,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Ce mois",
      value: dossiers.filter(d => {
        const dossierDate = new Date(d.created_date);
        const now = new Date();
        return dossierDate.getMonth() === now.getMonth() && dossierDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  const dossiersWithMandats = filteredDossiers.flatMap(dossier => {
    if (dossier.mandats && dossier.mandats.length > 0) {
      return dossier.mandats.map((mandat, idx) => ({
        ...dossier,
        mandatInfo: mandat,
        mandatIndex: idx,
        displayId: `${dossier.id}-${idx}`
      }));
    }
    return [{
      ...dossier,
      mandatInfo: null,
      mandatIndex: null,
      displayId: dossier.id
    }];
  });

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

          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                <Plus className="w-5 h-5 mr-2" />
                Nouveau dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">
                  {editingDossier ? "Modifier le dossier" : "Nouveau dossier"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex h-[90vh]">
                {/* Main form content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingDossier ? "Modifier le dossier" : "Nouveau dossier"}
                    </h2>
                  </div>

                  <form id="dossier-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                        <Select
                          value={formData.arpenteur_geometre}
                          onValueChange={(value) => setFormData({...formData, arpenteur_geometre: value})}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {ARPENTEURS.map((arpenteur) => (
                              <SelectItem key={arpenteur} value={arpenteur} className="text-white">
                                {arpenteur}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Statut <span className="text-red-400">*</span></Label>
                        <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
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

                    {formData.statut === "Ouvert" && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <div className="space-y-2">
                          <Label>N° de dossier <span className="text-red-400">*</span></Label>
                          <Input
                            value={formData.numero_dossier}
                            onChange={(e) => setFormData({...formData, numero_dossier: e.target.value})}
                            required
                            placeholder="Ex: 2024-001"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date d'ouverture <span className="text-red-400">*</span></Label>
                          <Input
                            type="date"
                            value={formData.date_ouverture}
                            onChange={(e) => setFormData({...formData, date_ouverture: e.target.value})}
                            required
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                      </div>
                    )}

                    {/* Clients, Notaires et Courtiers - 3 colonnes */}
                    <div className="grid grid-cols-3 gap-4">
                      {/* Clients */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Clients</Label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsClientSelectorOpen(true)}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                        {formData.clients_ids.length > 0 ? (
                          <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                            {formData.clients_ids.map(clientId => {
                              const client = getClientById(clientId);
                              return client ? (
                                <Badge
                                  key={clientId}
                                  variant="outline"
                                  className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30 relative pr-8 w-full justify-start"
                                >
                                  <span onClick={() => setViewingClientDetails(client)} className="cursor-pointer flex-1">
                                    {client.prenom} {client.nom}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeClient(clientId, 'clients');
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">
                            Aucun client
                          </p>
                        )}
                      </div>

                      {/* Notaires */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Notaires</Label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsNotaireSelectorOpen(true)}
                            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                        {formData.notaires_ids.length > 0 ? (
                          <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                            {formData.notaires_ids.map(notaireId => {
                              const notaire = getClientById(notaireId);
                              return notaire ? (
                                <Badge
                                  key={notaireId}
                                  variant="outline"
                                  className="bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 relative pr-8 w-full justify-start"
                                >
                                  <span onClick={() => setViewingClientDetails(notaire)} className="cursor-pointer flex-1">
                                    {notaire.prenom} {notaire.nom}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeClient(notaireId, 'notaires');
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">
                            Aucun notaire
                          </p>
                        )}
                      </div>

                      {/* Courtiers */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <Label>Courtiers immobiliers</Label>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsCourtierSelectorOpen(true)}
                            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Ajouter
                          </Button>
                        </div>
                        {formData.courtiers_ids.length > 0 ? (
                          <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                            {formData.courtiers_ids.map(courtierId => {
                              const courtier = getClientById(courtierId);
                              return courtier ? (
                                <Badge
                                  key={courtierId}
                                  variant="outline"
                                  className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-pointer hover:bg-orange-500/30 relative pr-8 w-full justify-start"
                                >
                                  <span onClick={() => setViewingClientDetails(courtier)} className="cursor-pointer flex-1">
                                    {courtier.prenom} {courtier.nom}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeClient(courtierId, 'courtiers');
                                    }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">
                            Aucun courtier
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mandats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Mandats</Label>
                        <Button
                          type="button"
                          size="sm"
                          onClick={addMandat}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter un mandat
                        </Button>
                      </div>

                      {formData.mandats.length > 0 ? (
                        <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat} className="w-full">
                          <TabsList className="bg-slate-800/50 border border-slate-700 w-full h-auto justify-start">
                            {formData.mandats.map((mandat, index) => (
                              <TabsTrigger
                                key={index}
                                value={index.toString()}
                                className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400"
                              >
                                {getMandatTabLabel(mandat, index)}
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          {formData.mandats.map((mandat, index) => (
                            <TabsContent key={index} value={index.toString()}>
                              <Card className="border-slate-700 bg-slate-800/30">
                                <CardContent className="p-4 space-y-4">
                                  {/* Type de mandat et bouton supprimer */}
                                  <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-2">
                                      <Label>Type de mandat <span className="text-red-400">*</span></Label>
                                      <Select
                                        value={mandat.type_mandat}
                                        onValueChange={(value) => updateMandat(index, 'type_mandat', value)}
                                      >
                                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                          <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                          {TYPES_MANDATS.map((type) => (
                                            <SelectItem key={type} value={type} className="text-white">
                                              {type}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        removeMandat(index);
                                        if (formData.mandats.length > 1) {
                                          setActiveTabMandat(Math.max(0, index - 1).toString());
                                        } else {
                                          setActiveTabMandat("0");
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-300 mt-8"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Supprimer ce mandat
                                    </Button>
                                  </div>

                                  {/* Nouvelle mise en page : 70% gauche / 30% droite */}
                                  <div className="grid grid-cols-[70%_30%] gap-4">
                                    {/* Colonne gauche - Adresse */}
                                    <div className="space-y-3">
                                      <AddressInput
                                        addresses={mandat.adresse_travaux ? [mandat.adresse_travaux] : [{
                                          ville: "",
                                          numeros_civiques: [""],
                                          rue: "",
                                          code_postal: "",
                                          province: ""
                                        }]}
                                        onChange={(newAddresses) => updateMandatAddress(index, newAddresses)}
                                        showActuelle={false}
                                        singleAddress={true}
                                      />
                                    </div>

                                    {/* Colonne droite - Dates */}
                                    <div className="space-y-3 pr-4">
                                      <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg space-y-3">
                                        <div className="space-y-2">
                                          <Label className="text-left block">Date d'ouverture</Label>
                                          <Input
                                            type="date"
                                            value={mandat.date_ouverture || ""}
                                            onChange={(e) => updateMandat(index, 'date_ouverture', e.target.value)}
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-left block">Date de signature</Label>
                                          <Input
                                            type="date"
                                            value={mandat.date_signature || ""}
                                            onChange={(e) => updateMandat(index, 'date_signature', e.target.value)}
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-left block">Début des travaux</Label>
                                          <Input
                                            type="date"
                                            value={mandat.date_debut_travaux || ""}
                                            onChange={(e) => updateMandat(index, 'date_debut_travaux', e.target.value)}
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label className="text-left block">Date de livraison</Label>
                                          <Input
                                            type="date"
                                            value={mandat.date_livraison || ""}
                                            onChange={(e) => updateMandat(index, 'date_livraison', e.target.value)}
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {editingDossier && (
                                    <>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                          <Label>Minute</Label>
                                          <Input
                                            value={mandat.minute || ""}
                                            onChange={(e) => updateMandat(index, 'minute', e.target.value)}
                                            placeholder="Ex: 12345"
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Date de minute</Label>
                                          <Input
                                            type="date"
                                            value={mandat.date_minute || ""}
                                            onChange={(e) => updateMandat(index, 'date_minute', e.target.value)}
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2">
                                        <Label>Tâche actuelle</Label>
                                        <Select value={mandat.tache_actuelle || ""} onValueChange={(value) => updateMandat(index, 'tache_actuelle', value)}>
                                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                            <SelectValue placeholder="Sélectionner la tâche" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                                            {TACHES.map((tache) => (
                                              <SelectItem key={tache} value={tache} className="text-white">
                                                {tache}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </>
                                  )}

                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Label>Lots sélectionnés</Label>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => openLotSelector(index)}
                                        className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                                      >
                                        <Plus className="w-4 h-4 mr-1" />
                                        Sélectionner des lots
                                      </Button>
                                    </div>

                                    {mandat.lots && mandat.lots.length > 0 ? (
                                      <div className="border border-slate-700 rounded-lg overflow-hidden">
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
                                            {mandat.lots.map((lotId) => {
                                              const lot = getLotById(lotId);
                                              return lot ? (
                                                <TableRow key={lot.id} className="hover:bg-slate-800/30 border-slate-800">
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
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => removeLotFromMandat(index, lot.id)}
                                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ) : (
                                                <TableRow key={lotId} className="hover:bg-slate-800/30 border-slate-800">
                                                  <TableCell colSpan={4} className="font-medium text-white">
                                                    {lotId} (Lot introuvable)
                                                  </TableCell>
                                                  <TableCell className="text-right">
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => removeLotFromMandat(index, lotId)}
                                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              );
                                            })}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    ) : (
                                      <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">
                                        Aucun lot sélectionné
                                      </p>
                                    )}
                                  </div>

                                  {editingDossier && (
                                    <div className="space-y-2">
                                      <Label>Notes</Label>
                                      <Textarea
                                        value={mandat.notes || ""}
                                        onChange={(e) => updateMandat(index, 'notes', e.target.value)}
                                        className="bg-slate-700 border-slate-600 h-20"
                                      />
                                    </div>
                                  )}

                                  {/* Section Terrain */}
                                  {editingDossier && (
                                    <div className="border-t border-slate-700 pt-4 mt-4">
                                      <Label className="text-lg font-semibold text-emerald-400 mb-3 block">Section Terrain</Label>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                          <Label>Date limite levé terrain</Label>
                                          <Input
                                            type="date"
                                            value={mandat.terrain?.date_limite_leve || ""}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              date_limite_leve: e.target.value
                                            })}
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Instruments requis</Label>
                                          <Input
                                            value={mandat.terrain?.instruments_requis || ""}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              instruments_requis: e.target.value
                                            })}
                                            placeholder="Ex: GPS, Total Station"
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-3 mt-3">
                                        <div className="flex items-center gap-3">
                                          <input
                                            type="checkbox"
                                            checked={mandat.terrain?.a_rendez_vous || false}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              a_rendez_vous: e.target.checked
                                            })}
                                            className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                                          />
                                          <Label>Rendez-vous nécessaire</Label>
                                        </div>

                                        {mandat.terrain?.a_rendez_vous && (
                                          <div className="grid grid-cols-2 gap-3 ml-7">
                                            <div className="space-y-2">
                                              <Label>Date du rendez-vous</Label>
                                              <Input
                                                type="date"
                                                value={mandat.terrain?.date_rendez_vous || ""}
                                                onChange={(e) => updateMandat(index, 'terrain', {
                                                  ...mandat.terrain,
                                                  date_rendez_vous: e.target.value
                                                })}
                                                className="bg-slate-700 border-slate-600"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label>Heure du rendez-vous</Label>
                                              <Input
                                                type="time"
                                                value={mandat.terrain?.heure_rendez_vous || ""}
                                                onChange={(e) => updateMandat(index, 'terrain', {
                                                  ...mandat.terrain,
                                                  heure_rendez_vous: e.target.value
                                                })}
                                                className="bg-slate-700 border-slate-600"
                                              />
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="space-y-2">
                                          <Label>Donneur</Label>
                                          <Input
                                            value={mandat.terrain?.donneur || ""}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              donneur: e.target.value
                                            })}
                                            placeholder="Nom du donneur"
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Technicien à prioriser</Label>
                                          <Input
                                            value={mandat.terrain?.technicien || ""}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              technicien: e.target.value
                                            })}
                                            placeholder="Nom du technicien"
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div className="space-y-2">
                                          <Label>Dossier à faire en même temps</Label>
                                          <Input
                                            value={mandat.terrain?.dossier_simultane || ""}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              dossier_simultane: e.target.value
                                            })}
                                            placeholder="N° de dossier"
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Temps prévu</Label>
                                          <Input
                                            value={mandat.terrain?.temps_prevu || ""}
                                            onChange={(e) => updateMandat(index, 'terrain', {
                                              ...mandat.terrain,
                                              temps_prevu: e.target.value
                                            })}
                                            placeholder="Ex: 2h30"
                                            className="bg-slate-700 border-slate-600"
                                          />
                                        </div>
                                      </div>

                                      <div className="space-y-2 mt-3">
                                        <Label>Notes terrain</Label>
                                        <Textarea
                                          value={mandat.terrain?.notes || ""}
                                          onChange={(e) => updateMandat(index, 'terrain', {
                                            ...mandat.terrain,
                                            notes: e.target.value
                                          })}
                                          placeholder="Notes concernant le terrain..."
                                          className="bg-slate-700 border-slate-600 h-20"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">
                          Aucun mandat. Cliquez sur "Ajouter un mandat" pour commencer.
                        </div>
                      )}
                    </div>

                    {/* Tableau Tarification */}
                    {formData.mandats.length > 0 && (
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
                              {formData.mandats.map((mandat, index) => (
                                <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="font-medium text-white">
                                    {mandat.type_mandat || `Mandat ${index + 1}`}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={mandat.prix_estime || ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '');
                                        updateMandat(index, 'prix_estime', value ? parseFloat(value) : 0);
                                      }}
                                      placeholder="0.00"
                                      className="bg-slate-700 border-slate-600 text-white"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={mandat.rabais || ""}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9.]/g, '');
                                        updateMandat(index, 'rabais', value ? parseFloat(value) : 0);
                                      }}
                                      placeholder="0.00"
                                      className="bg-slate-700 border-slate-600 text-white"
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <input
                                      type="checkbox"
                                      id={`taxes_incluses_${index}`}
                                      checked={mandat.taxes_incluses}
                                      onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)}
                                      className="form-checkbox h-5 w-5 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded"
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </form>

                  {/* Boutons Annuler/Créer tout en bas */}
                  <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800 px-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" form="dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      {editingDossier ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </div>

                {/* Commentaires Sidebar - 30% */}
                <div className="flex-[0_0_30%] flex flex-col h-full overflow-hidden">
                  <div className="p-6 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-hidden p-6">
                    <CommentairesSection
                      dossierId={editingDossier?.id}
                      dossierTemporaire={!editingDossier}
                      onCommentairesTempChange={setCommentairesTemporaires}
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Client Selector Dialog */}
        <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Sélectionner des clients</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                          : 'bg-slate-800/50 hover:bg-slate-800'
                      }`}
                      onClick={() => toggleClient(client.id, 'clients')}
                    >
                      <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {getCurrentValue(client.adresses, 'adresse') && (
                          <p className="truncate">📍 {getCurrentValue(client.adresses, 'adresse')}</p>
                        )}
                        {getCurrentValue(client.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(client.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(client.telephones, 'telephone') && (
                          <p>📞 {getCurrentValue(client.telephones, 'telephone')}</p>
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Notaire Selector Dialog */}
        <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Sélectionner des notaires</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                          : 'bg-slate-800/50 hover:bg-slate-800'
                      }`}
                      onClick={() => toggleClient(notaire.id, 'notaires')}
                    >
                      <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {getCurrentValue(notaire.adresses, 'adresse') && (
                          <p className="truncate">📍 {getCurrentValue(notaire.adresses, 'adresse')}</p>
                        )}
                        {getCurrentValue(notaire.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(notaire.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(notaire.telephones, 'telephone') && (
                          <p>📞 {getCurrentValue(notaire.telephones, 'telephone')}</p>
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Courtier Selector Dialog */}
        <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>Sélectionner des courtiers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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
                          : 'bg-slate-800/50 hover:bg-slate-800'
                      }`}
                      onClick={() => toggleClient(courtier.id, 'courtiers')}
                    >
                      <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                      <div className="text-sm text-slate-400 space-y-1 mt-1">
                        {getCurrentValue(courtier.adresses, 'adresse') && (
                          <p className="truncate">📍 {getCurrentValue(courtier.adresses, 'adresse')}</p>
                        )}
                        {getCurrentValue(courtier.courriels, 'courriel') && (
                          <p className="truncate">✉️ {getCurrentValue(courtier.courriels, 'courriel')}</p>
                        )}
                        {getCurrentValue(courtier.telephones, 'telephone') && (
                          <p>📞 {getCurrentValue(courtier.telephones, 'telephone')}</p>
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
            </div>
          </DialogContent>
        </Dialog>

        {/* ClientFormDialog */}
        <ClientFormDialog
          open={isClientFormDialogOpen}
          onOpenChange={(open) => {
            setIsClientFormDialogOpen(open);
            if (!open) setEditingClientForForm(null);
          }}
          editingClient={editingClientForForm}
          defaultType={clientTypeForForm}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            if (clientTypeForForm === "Client") setIsClientSelectorOpen(true);
            if (clientTypeForForm === "Notaire") setIsNotaireSelectorOpen(true);
            if (clientTypeForForm === "Courtier immobilier") setIsCourtierSelectorOpen(true);
          }}
        />

        {/* Client Details Dialog */}
        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">
                Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-6">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dossier Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">
                Consultation du dossier {viewingDossier ? `${getArpenteurInitials(viewingDossier.arpenteur_geometre)}${viewingDossier.numero_dossier}` : ''}
              </DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="flex h-[90vh]">
                {/* Main content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Consultation du dossier {getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {/* Informations principales */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <Label className="text-slate-400 text-sm">N° de dossier</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.numero_dossier}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Date d'ouverture</Label>
                        <p className="text-white font-medium mt-1">
                          {format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-slate-400 text-sm">Statut</Label>
                      <div className="mt-1">
                        <Badge className={`${viewingDossier.statut === 'Ouvert' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border`}>
                          {viewingDossier.statut || "Ouvert"}
                        </Badge>
                      </div>
                    </div>

                    {/* Clients, Notaires, Courtiers */}
                    <div className="grid grid-cols-3 gap-4">
                      {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.clients_ids.map(id => {
                              const client = getClientById(id);
                              return client ? (
                                <Badge
                                  key={id}
                                  className="bg-blue-500/20 text-blue-400 border-blue-500/30 border cursor-pointer hover:bg-blue-500/30 w-full justify-start"
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
                      )}

                      {viewingDossier.notaires_ids && viewingDossier.notaires_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.notaires_ids.map(id => {
                              const notaire = getClientById(id);
                              return notaire ? (
                                <Badge
                                  key={id}
                                  className="bg-purple-500/20 text-purple-400 border-purple-500/30 border cursor-pointer hover:bg-purple-500/30 w-full justify-start"
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
                      )}

                      {viewingDossier.courtiers_ids && viewingDossier.courtiers_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Courtiers immobiliers</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.courtiers_ids.map(id => {
                              const courtier = getClientById(id);
                              return courtier ? (
                                <Badge
                                  key={id}
                                  className="bg-orange-500/20 text-orange-400 border-orange-500/30 border cursor-pointer hover:bg-orange-500/30 w-full justify-start"
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
                      )}
                    </div>

                    {viewingDossier.description && (
                      <div>
                        <Label className="text-slate-400 mb-2 block">Notes générales</Label>
                        <p className="text-slate-300 whitespace-pre-wrap">{viewingDossier.description}</p>
                      </div>
                    )}

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

                                {mandat.tache_actuelle && (
                                  <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Tâche actuelle</Label>
                                    <div className="mt-1">
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                                        {mandat.tache_actuelle}
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                {mandat.notes && (
                                  <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Notes</Label>
                                    <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{mandat.notes}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entrées de temps */}
                    <div className="mt-6">
                      <Label className="text-slate-400 mb-3 block">Entrées de temps</Label>
                      {(() => {
                        const dossierEntrees = entreeTemps.filter(e => e.dossier_id === viewingDossier.id);
                        const tempsTotal = dossierEntrees.reduce((sum, e) => sum + (e.heures || 0), 0);
                        
                        return dossierEntrees.length > 0 ? (
                          <>
                            <div className="border border-slate-700 rounded-lg overflow-hidden mb-3">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                    <TableHead className="text-slate-300">Date</TableHead>
                                    <TableHead className="text-slate-300">Employé</TableHead>
                                    <TableHead className="text-slate-300">Tâche accomplie</TableHead>
                                    <TableHead className="text-slate-300">Temps</TableHead>
                                    <TableHead className="text-slate-300">Description</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dossierEntrees.map((entree) => {
                                    const user = getUserByEmail(entree.utilisateur_email);
                                    return (
                                      <TableRow key={entree.id} className="border-slate-800">
                                        <TableCell className="text-white">
                                          {format(new Date(entree.date), "dd MMM yyyy", { locale: fr })}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                          {user?.full_name || entree.utilisateur_email}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                            {entree.tache}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-emerald-400 font-semibold">
                                          {entree.heures}h
                                        </TableCell>
                                        <TableCell className="text-slate-300 max-w-xs truncate">
                                          {entree.description || "-"}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="flex justify-end">
                              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2">
                                <span className="text-slate-400 text-sm mr-2">Temps total:</span>
                                <span className="text-emerald-400 font-bold text-lg">{tempsTotal.toFixed(2)}h</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">
                            Aucune entrée de temps pour ce dossier
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Boutons Fermer/Modifier */}
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

                {/* Commentaires Sidebar - 30% */}
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
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lot Selector Dialog */}
        <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {
          setIsLotSelectorOpen(open);
          if (!open) {
            setLotCirconscriptionFilter("all");
            setLotSearchTerm("");
            setLotCadastreFilter("Québec");
          }
        }}>
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
                    className="pl-10 bg-slate-800 border-slate-700"
                  />
                </div>
                <Select value={lotCirconscriptionFilter} onValueChange={setLotCirconscriptionFilter}>
                  <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Circonscription" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                    {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map(circonscription => (
                      <SelectItem key={circonscription} value={circonscription} className="text-white">
                        {circonscription}
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
            </div>
          </DialogContent>
        </Dialog>

        {/* New Lot Dialog */}
        <Dialog open={isNewLotDialogOpen} onOpenChange={(open) => {
          setIsNewLotDialogOpen(open);
          if (!open) resetNewLotForm();
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Nouveau lot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewLotSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Circonscription foncière <span className="text-red-400">*</span></Label>
                  <Select value={newLotForm.circonscription_fonciere} onValueChange={handleLotCirconscriptionChange}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map(circonscription => (
                        <SelectItem key={circonscription} value={circonscription} className="text-white">
                          {circonscription}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cadastre</Label>
                  <Select
                    value={newLotForm.cadastre}
                    onValueChange={(value) => setNewLotForm({...newLotForm, cadastre: value})}
                    disabled={!newLotForm.circonscription_fonciere}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder={newLotForm.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                      {availableLotCadastres.map((cadastre) => (
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
                    value={newLotForm.numero_lot}
                    onChange={(e) => setNewLotForm({...newLotForm, numero_lot: e.target.value})}
                    required
                    placeholder="Ex: 1234-5678"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rang</Label>
                  <Input
                    value={newLotForm.rang}
                    onChange={(e) => setNewLotForm({...newLotForm, rang: e.target.value})}
                    placeholder="Ex: Rang 4"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Concordance antérieur</Label>
                <Input
                  value={newLotForm.concordance_anterieur}
                  onChange={(e) => setNewLotForm({...newLotForm, concordance_anterieur: e.target.value})}
                  placeholder="Concordance avec l'ancien cadastre"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Document PDF</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handleLotFileUpload}
                    disabled={uploadingLotPdf}
                    className="bg-slate-800 border-slate-700"
                  />
                  {uploadingLotPdf && (
                    <Button type="button" disabled className="bg-slate-700">
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Upload...
                    </Button>
                  )}
                </div>
                {newLotForm.document_pdf_url && (
                  <a
                    href={newLotForm.document_pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mt-2"
                  >
                    <FileText className="w-4 h-4" />
                    Voir le PDF
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsNewLotDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  Créer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <CardTitle className="text-xl font-bold text-white">Liste des dossiers par mandat</CardTitle>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300">N° Dossier</TableHead>
                    <TableHead className="text-slate-300">Arpenteur</TableHead>
                    <TableHead className="text-slate-300">Date ouverture</TableHead>
                    <TableHead className="text-slate-300">Statut</TableHead>
                    <TableHead className="text-slate-300">Type de mandat</TableHead>
                    <TableHead className="text-slate-300">Tâche actuelle</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiersWithMandats.map((item) => (
                    <TableRow key={item.displayId} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell className="font-medium text-white">
                        {getArpenteurInitials(item.arpenteur_geometre)}{item.numero_dossier}
                        {item.mandatInfo && item.mandats.length > 1 && (
                          <span className="text-slate-500 text-xs ml-1">({item.mandatIndex + 1}/{item.mandats.length})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          {item.arpenteur_geometre}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {item.date_ouverture ? format(new Date(item.date_ouverture), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${item.statut === 'Ouvert' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border text-xs`}>
                          {item.statut || "Ouvert"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.mandatInfo ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                            {item.mandatInfo.type_mandat}
                          </Badge>
                        ) : (
                          <span className="text-slate-600 text-xs">Aucun mandat</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.mandatInfo?.tache_actuelle ? (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
                            {item.mandatInfo.tache_actuelle}
                          </Badge>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(item)}
                            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.mandatIndex === 0 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(item.id, `${getArpenteurInitials(item.arpenteur_geometre)}${item.numero_dossier}`)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
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