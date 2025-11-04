
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, User, X, UserPlus, Check, Upload, FileText, ExternalLink, Grid3x3, Eye } from "lucide-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Certificat de localisation", "Implantation", "Piquetage", "OCTR", "Projet de lotissement"];
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
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false);
  const [isNewNotaireDialogOpen, setIsNewNotaireDialogOpen] = useState(false);
  const [isNewCourtierDialogOpen, setIsNewCourtierDialogOpen] = useState(false);
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

  const [newClientForm, setNewClientForm] = useState({
    prenom: "",
    nom: "",
    type_client: "Client",
    adresses: [{ adresse: "", latitude: null, longitude: null, actuelle: true }],
    courriels: [{ courriel: "", actuel: true }],
    telephones: [{ telephone: "", actuel: true }],
    notes: ""
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

  const createDossierMutation = useMutation({
    mutationFn: (dossierData) => base44.entities.Dossier.create(dossierData),
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

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deleteLotMutation = useMutation({
    mutationFn: (id) => base44.entities.Lot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsNewClientDialogOpen(false);
      setIsNewNotaireDialogOpen(false);
      setIsNewCourtierDialogOpen(false);
      resetClientForm();
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
  const getLotById = (numeroLot) => lots.find(l => l.numero_lot === numeroLot);

  const availableLotCadastres = newLotForm.circonscription_fonciere
    ? CADASTRES_PAR_CIRCONSCRIPTION[newLotForm.circonscription_fonciere] || []
    : [];

  // Fonction de tri pour mettre les sélectionnés en haut puis ordre alphabétique
  const sortClientsWithSelected = (clientsList, selectedIds) => {
    return [...clientsList].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Ordre alphabétique pour le reste
      const aName = `${a.prenom} ${a.nom}`.toLowerCase();
      const bName = `${b.prenom} ${b.nom}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  // Fonction de tri pour les lots avec les sélectionnés en haut
  const sortLotsWithSelected = (lotsList, selectedLots) => {
    return [...lotsList].sort((a, b) => {
      const aSelected = selectedLots?.includes(a.numero_lot);
      const bSelected = selectedLots?.includes(b.numero_lot);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      // Ordre alphabétique pour le reste
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

  const addLotToCurrentMandat = (numeroLot) => {
    if (currentMandatIndex !== null) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === currentMandatIndex ? {
            ...m,
            lots: m.lots.includes(numeroLot) ? m.lots.filter(id => id !== numeroLot) : [...(m.lots || []), numeroLot]
          } : m
        )
      }));
    }
  };

  const filteredDossiers = dossiers.filter(dossier => {
    // Filtrer d'abord par statut
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

  const handleNewClientSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...newClientForm,
      adresses: newClientForm.adresses.filter(a => a.adresse.trim() !== ""),
      courriels: newClientForm.courriels.filter(c => c.courriel.trim() !== ""),
      telephones: newClientForm.telephones.filter(t => t.telephone.trim() !== "")
    };
    createClientMutation.mutate(cleanedData);
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
      // Optionally, show an error message to the user
    } finally {
      setUploadingLotPdf(false);
    }
  };

  const handleLotCirconscriptionChange = (value) => {
    setNewLotForm({
      ...newLotForm,
      circonscription_fonciere: value,
      cadastre: "" // Reset cadastre when circonscription changes
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
  };

  const resetClientForm = () => {
    setNewClientForm({
      prenom: "",
      nom: "",
      type_client: "Client",
      adresses: [{ adresse: "", latitude: null, longitude: null, actuelle: true }],
      courriels: [{ courriel: "", actuel: true }],
      telephones: [{ telephone: "", actuel: true }],
      notes: ""
    });
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

  const handleEdit = (dossier) => {
    setIsViewDialogOpen(false); // Close view dialog if open
    setViewingDossier(null); // Clear viewing dossier

    setEditingDossier(dossier);
    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      statut: dossier.statut || "Ouvert",
      clients_ids: dossier.clients_ids || [],
      notaires_ids: dossier.notaires_ids || [],
      courtiers_ids: dossier.courtiers_ids || [],
      mandats: dossier.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "", // Ensure date_ouverture is present
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
        lots: m.lots || [], // Initialize lots array
        prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0, // Initialize prix_estime
        rabais: m.rabais !== undefined ? m.rabais : 0, // Initialize rabais
        taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false, // Initialize taxes_incluses
        date_livraison: m.date_livraison || "",
        date_signature: m.date_signature || "",
        date_debut_travaux: m.date_debut_travaux || "",
        terrain: m.terrain || { // Initialize terrain object
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
        notes: m.notes || "" // Initialize notes
      })) || [],
      description: dossier.description || ""
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

    // Copier les infos du premier mandat s'il existe
    const firstMandat = formData.mandats[0];
    const defaultAdresse = firstMandat?.adresse_travaux
      ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux)) // Deep copy
      : {
        ville: "",
        numeros_civiques: [""],
        rue: "",
        code_postal: "",
        province: ""
      };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : []; // Copy lots

    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        minute: "",
        date_minute: "",
        tache_actuelle: "", // Default to empty
        statut_terrain: "", // Default to empty
        adresse_travaux: defaultAdresse,
        lots: defaultLots,
        prix_estime: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        terrain: { // Default terrain object for new mandats
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

  const updateMandat = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => {
        if (i === index) {
          const updatedMandat = { ...m, [field]: value };
          // If tache_actuelle changes, update statut_terrain accordingly
          if (field === 'tache_actuelle') {
            if (value === "Cédule") {
              updatedMandat.statut_terrain = "en_verification";
            } else {
              updatedMandat.statut_terrain = "";
            }
          }
          // Special handling for nested 'terrain' object
          if (field === 'terrain') {
            return {
              ...m,
              terrain: { ...m.terrain, ...value } // Merge previous terrain with new values
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

  const removeLotFromMandat = (mandatIndex, lotNumero) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer le lot ${lotNumero} de ce mandat ?`)) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === mandatIndex ? { ...m, lots: m.lots.filter((num) => num !== lotNumero) } : m
        )
      }));
    }
  };

  const addClientField = (fieldName) => {
    if (fieldName === 'adresses') {
      setNewClientForm(prev => ({
        ...prev,
        adresses: [...prev.adresses, { adresse: "", latitude: null, longitude: null, actuelle: false }]
      }));
    } else {
      setNewClientForm(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], { [fieldName.slice(0, -1)]: "", actuel: false }]
      }));
    }
  };

  const removeClientField = (fieldName, index) => {
    if (newClientForm[fieldName].length > 1) {
      setNewClientForm(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    }
  };

  const updateClientField = (fieldName, index, key, value) => {
    setNewClientForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) =>
        i === index ? { ...item, [key]: value } : item
      )
    }));
  };

  const toggleActuel = (fieldName, index) => {
    setNewClientForm(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => ({
        ...item,
        [fieldName === 'adresses' ? 'actuelle' : 'actuel']: i === index
      }))
    }));
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

  // Créer une ligne par mandat dans le tableau
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
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingDossier ? "Modifier le dossier" : "Nouveau dossier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
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
                    <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                    <Select value={formData.arpenteur_geometre} onValueChange={(value) => setFormData({...formData, arpenteur_geometre: value})}>
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

                {editingDossier && (
                  <div className="space-y-2">
                    <Label>Statut</Label>
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
                )}

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
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">Nom</TableHead>
                            <TableHead className="text-slate-300">Adresse</TableHead>
                            <TableHead className="text-slate-300">Courriel</TableHead>
                            <TableHead className="text-slate-300">Téléphone</TableHead>
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.clients_ids.map(clientId => {
                            const client = getClientById(clientId);
                            return client ? (
                              <TableRow key={clientId} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white font-medium">
                                  {client.prenom} {client.nom}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {getCurrentValue(client.adresses, 'adresse') || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {getCurrentValue(client.courriels, 'courriel') || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {getCurrentValue(client.telephones, 'telephone') || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setViewingClientDetails(client)}
                                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeClient(clientId, 'clients')}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null;
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-3 bg-slate-800/30 rounded-lg">
                      Aucun client sélectionné
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
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">Nom</TableHead>
                            <TableHead className="text-slate-300">Adresse</TableHead>
                            <TableHead className="text-slate-300">Courriel</TableHead>
                            <TableHead className="text-slate-300">Téléphone</TableHead>
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.notaires_ids.map(notaireId => {
                            const notaire = getClientById(notaireId);
                            return notaire ? (
                              <TableRow key={notaireId} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white font-medium">
                                  {notaire.prenom} {notaire.nom}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {getCurrentValue(notaire.adresses, 'adresse') || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {getCurrentValue(notaire.courriels, 'courriel') || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {getCurrentValue(notaire.telephones, 'telephone') || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setViewingClientDetails(notaire)}
                                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeClient(notaireId, 'notaires')}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null;
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-3 bg-slate-800/30 rounded-lg">
                      Aucun notaire sélectionné
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
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">Nom</TableHead>
                            <TableHead className="text-slate-300">Adresse</TableHead>
                            <TableHead className="text-slate-300">Courriel</TableHead>
                            <TableHead className="text-slate-300">Téléphone</TableHead>
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.courtiers_ids.map(courtierId => {
                            const courtier = getClientById(courtierId);
                            return courtier ? (
                              <TableRow key={courtierId} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white font-medium">
                                  {courtier.prenom} {courtier.nom}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {getCurrentValue(courtier.adresses, 'adresse') || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {getCurrentValue(courtier.courriels, 'courriel') || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {getCurrentValue(courtier.telephones, 'telephone') || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setViewingClientDetails(courtier)}
                                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeClient(courtierId, 'courtiers')}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null;
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-3 bg-slate-800/30 rounded-lg">
                      Aucun courtier sélectionné
                    </p>
                  )}
                </div>

                {/* Notes générales */}
                <div className="space-y-2">
                  <Label>Notes générales</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-slate-800 border-slate-700 h-24"
                  />
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
                      <TabsList className="bg-slate-800/50 border border-slate-700 w-full flex-wrap h-auto">
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
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-end">
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
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer ce mandat
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
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
                                <div className="space-y-2">
                                  <Label>Date d'ouverture</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_ouverture || ""}
                                    onChange={(e) => updateMandat(index, 'date_ouverture', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                  />
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
                                label="Adresse des travaux"
                                singleAddress={true}
                              />

                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label>Date de signature</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_signature || ""}
                                    onChange={(e) => updateMandat(index, 'date_signature', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Début des travaux</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_debut_travaux || ""}
                                    onChange={(e) => updateMandat(index, 'date_debut_travaux', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Date de livraison</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_livraison || ""}
                                    onChange={(e) => updateMandat(index, 'date_livraison', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                              </div>

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
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {mandat.lots.map((numeroLot) => {
                                          const lot = getLotById(numeroLot);
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
                                                  onClick={() => removeLotFromMandat(index, lot.numero_lot)}
                                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            <TableRow key={numeroLot} className="hover:bg-slate-800/30 border-slate-800">
                                              <TableCell colSpan={4} className="font-medium text-white">
                                                {numeroLot} (Lot introuvable)
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => removeLotFromMandat(index, numeroLot)}
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

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Prix estimé ($)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={mandat.prix_estime}
                                    onChange={(e) => updateMandat(index, 'prix_estime', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Rabais ($)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={mandat.rabais}
                                    onChange={(e) => updateMandat(index, 'rabais', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 mt-3">
                                <input
                                  type="checkbox"
                                  id={`taxes-incluses-${index}`}
                                  checked={mandat.taxes_incluses}
                                  onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)}
                                  className="w-4 h-4 rounded bg-slate-700 border-slate-600"
                                />
                                <Label htmlFor={`taxes-incluses-${index}`}>Taxes incluses</Label>
                              </div>


                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                  value={mandat.notes}
                                  onChange={(e) => updateMandat(index, 'notes', e.target.value)}
                                  className="bg-slate-700 border-slate-600 h-20"
                                />
                              </div>

                              {/* Section Terrain - Toujours affichée */}
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

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    {editingDossier ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
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
                    setNewClientForm({...newClientForm, type_client: "Client"});
                    setIsNewClientDialogOpen(true);
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
                          setViewingClientDetails(client);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 mt-2 w-full"
                      >
                        Voir fiche
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
                    setNewClientForm({...newClientForm, type_client: "Notaire"});
                    setIsNewNotaireDialogOpen(true);
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
                          setViewingClientDetails(notaire);
                        }}
                        className="text-purple-400 hover:text-purple-300 mt-2 w-full"
                      >
                        Voir fiche
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
                    setNewClientForm({...newClientForm, type_client: "Courtier immobilier"});
                    setIsNewCourtierDialogOpen(true);
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
                          setViewingClientDetails(courtier);
                        }}
                        className="text-orange-400 hover:text-orange-300 mt-2 w-full"
                      >
                        Voir fiche
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

        {/* Client Details Dialog */}
        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
              </DialogTitle>
            </DialogHeader>
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
          </DialogContent>
        </Dialog>

        {/* View Dossier Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Consultation du dossier {viewingDossier ? `${getArpenteurInitials(viewingDossier.arpenteur_geometre)}${viewingDossier.numero_dossier}` : ''}
              </DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-400">N° de dossier</Label>
                    <p className="text-white font-medium">{viewingDossier.numero_dossier}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Arpenteur-géomètre</Label>
                    <p className="text-white font-medium">{viewingDossier.arpenteur_geometre}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Date d'ouverture</Label>
                    <p className="text-white font-medium">
                      {format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-400">Statut</Label>
                  <Badge className={`mt-2 ${viewingDossier.statut === 'Ouvert' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border`}>
                    {viewingDossier.statut || "Ouvert"}
                  </Badge>
                </div>

                {/* Clients */}
                <div>
                  <Label className="text-slate-400 mb-2 block">Clients</Label>
                  {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.clients_ids.map(id => {
                        const client = getClientById(id);
                        return client ? (
                          <Badge
                            key={id}
                            className="bg-blue-500/20 text-blue-400 border-blue-500/30 border cursor-pointer hover:bg-blue-500/30"
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
                  ) : (
                    <p className="text-slate-500 text-sm">Aucun client</p>
                  )}
                </div>

                {/* Notaires */}
                <div>
                  <Label className="text-slate-400 mb-2 block">Notaires</Label>
                  {viewingDossier.notaires_ids && viewingDossier.notaires_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.notaires_ids.map(id => {
                        const notaire = getClientById(id);
                        return notaire ? (
                          <Badge
                            key={id}
                            className="bg-purple-500/20 text-purple-400 border-purple-500/30 border cursor-pointer hover:bg-purple-500/30"
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
                  ) : (
                    <p className="text-slate-500 text-sm">Aucun notaire</p>
                  )}
                </div>

                {/* Courtiers */}
                <div>
                  <Label className="text-slate-400 mb-2 block">Courtiers immobiliers</Label>
                  {viewingDossier.courtiers_ids && viewingDossier.courtiers_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.courtiers_ids.map(id => {
                        const courtier = getClientById(id);
                        return courtier ? (
                          <Badge
                            key={id}
                            className="bg-orange-500/20 text-orange-400 border-orange-500/30 border cursor-pointer hover:bg-orange-500/30"
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
                  ) : (
                    <p className="text-slate-500 text-sm">Aucun courtier</p>
                  )}
                </div>

                {/* Description générale */}
                <div>
                  <Label className="text-slate-400 mb-2 block">Notes générales</Label>
                  {viewingDossier.description ? (
                    <p className="text-slate-300 whitespace-pre-wrap">{viewingDossier.description}</p>
                  ) : (
                    <p className="text-slate-500 text-sm">Aucune description</p>
                  )}
                </div>

                {/* Mandats */}
                <div>
                  <Label className="text-slate-400 mb-3 block">Mandats</Label>
                  {viewingDossier.mandats && viewingDossier.mandats.length > 0 ? (
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList className="bg-slate-800/50 border border-slate-700 w-full flex-wrap h-auto">
                        {viewingDossier.mandats.map((mandat, index) => (
                          <TabsTrigger
                            key={index}
                            value={index.toString()}
                            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400"
                          >
                            {mandat.type_mandat || `Mandat ${index + 1}`}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {viewingDossier.mandats.map((mandat, index) => (
                        <TabsContent key={index} value={index.toString()}>
                          <Card className="border-slate-700 bg-slate-800/30">
                            <CardContent className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-400 text-xs">Type de mandat</Label>
                                  <p className="text-white font-medium mt-1">{mandat.type_mandat || "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-400 text-xs">Date d'ouverture</Label>
                                  <p className="text-white font-medium mt-1">
                                    {mandat.date_ouverture ? format(new Date(mandat.date_ouverture), "dd MMMM yyyy", { locale: fr }) : "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-400 text-xs">Minute</Label>
                                  <p className="text-white font-medium mt-1">{mandat.minute || "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-400 text-xs">Date de minute</Label>
                                  <p className="text-white font-medium mt-1">
                                    {mandat.date_minute ? format(new Date(mandat.date_minute), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <Label className="text-slate-400 text-xs">Tâche actuelle</Label>
                                {mandat.tache_actuelle ? (
                                  <Badge className="mt-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                                    {mandat.tache_actuelle}
                                  </Badge>
                                ) : (
                                  <p className="text-slate-500 text-sm mt-1">Non définie</p>
                                )}
                              </div>

                              <div>
                                <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) ? (
                                  <p className="text-white mt-1">{formatAdresse(mandat.adresse_travaux)}</p>
                                ) : (
                                  <p className="text-slate-500 text-sm mt-1">Aucune adresse</p>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-slate-400 text-xs">Date de signature</Label>
                                  <p className="text-white mt-1">
                                    {mandat.date_signature ? format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-slate-400 text-xs">Début des travaux</Label>
                                  <p className="text-white mt-1">
                                    {mandat.date_debut_travaux ? format(new Date(mandat.date_debut_travaux), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-slate-400 text-xs">Date de livraison</Label>
                                  <p className="text-white mt-1">
                                    {mandat.date_livraison ? format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr }) : "-"}
                                  </p>
                                </div>
                              </div>

                              {/* Section Terrain (View Mode) - Toujours affichée */}
                              <div className="border-t border-slate-700 pt-4 mt-4">
                                <Label className="text-lg font-semibold text-emerald-400 mb-3 block">Section Terrain</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-slate-400 text-xs">Date limite levé terrain</Label>
                                    <p className="text-white font-medium mt-1">
                                      {mandat.terrain?.date_limite_leve ? format(new Date(mandat.terrain.date_limite_leve), "dd MMMM yyyy", { locale: fr }) : "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-slate-400 text-xs">Instruments requis</Label>
                                    <p className="text-white font-medium mt-1">{mandat.terrain?.instruments_requis || "-"}</p>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <Label className="text-slate-400 text-xs">Rendez-vous nécessaire</Label>
                                  <p className="text-white font-medium mt-1">
                                    {mandat.terrain?.a_rendez_vous ? "Oui" : "Non"}
                                  </p>
                                  {mandat.terrain?.a_rendez_vous && (
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                      <div>
                                        <Label className="text-slate-400 text-xs">Date du rendez-vous</Label>
                                        <p className="text-white font-medium mt-1">
                                          {mandat.terrain?.date_rendez_vous ? format(new Date(mandat.terrain.date_rendez_vous), "dd MMMM yyyy", { locale: fr }) : "-"}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-400 text-xs">Heure du rendez-vous</Label>
                                        <p className="text-white font-medium mt-1">{mandat.terrain?.heure_rendez_vous || "-"}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <Label className="text-slate-400 text-xs">Donneur</Label>
                                    <p className="text-white font-medium mt-1">{mandat.terrain?.donneur || "-"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-slate-400 text-xs">Technicien à prioriser</Label>
                                    <p className="text-white font-medium mt-1">{mandat.terrain?.technicien || "-"}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div>
                                    <Label className="text-slate-400 text-xs">Dossier à faire en même temps</Label>
                                    <p className="text-white font-medium mt-1">{mandat.terrain?.dossier_simultane || "-"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-slate-400 text-xs">Temps prévu</Label>
                                    <p className="text-white font-medium mt-1">{mandat.terrain?.temps_prevu || "-"}</p>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <Label className="text-slate-400 text-xs">Notes terrain</Label>
                                  {mandat.terrain?.notes ? (
                                    <p className="text-slate-300 mt-1 whitespace-pre-wrap">{mandat.terrain.notes}</p>
                                  ) : (
                                    <p className="text-slate-500 text-sm mt-1">Aucune note</p>
                                  )}
                                </div>
                              </div>


                              <div>
                                <Label className="text-slate-400 text-xs mb-2 block">Lots sélectionnés</Label>
                                {mandat.lots && mandat.lots.length > 0 ? (
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
                                        {mandat.lots.map((numeroLot) => {
                                          const lot = getLotById(numeroLot);
                                          return lot ? (
                                            <TableRow key={lot.id} className="border-slate-800">
                                              <TableCell className="font-medium text-white">{lot.numero_lot}</TableCell>
                                              <TableCell className="text-slate-300">
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                  {lot.circonscription_fonciere}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-slate-300">{lot.cadastre || "-"}</TableCell>
                                              <TableCell className="text-slate-300">{lot.rang || "-"}</TableCell>
                                            </TableRow>
                                          ) : (
                                            <TableRow key={numeroLot} className="border-slate-800">
                                              <TableCell colSpan={4} className="font-medium text-white">
                                                {numeroLot} (Lot introuvable)
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm">Aucun lot sélectionné</p>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-400 text-xs">Prix estimé</Label>
                                  <p className="text-white font-medium mt-1">
                                    {mandat.prix_estime ? `${mandat.prix_estime.toFixed(2)} $` : "0.00 $"}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-slate-400 text-xs">Rabais</Label>
                                  <p className="text-white font-medium mt-1">
                                    {mandat.rabais ? `${mandat.rabais.toFixed(2)} $` : "0.00 $"}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-slate-400 text-xs">Taxes incluses</Label>
                                <p className="text-white font-medium mt-1">
                                  {mandat.taxes_incluses ? "Oui" : "Non"}
                                </p>
                              </div>

                              <div>
                                <Label className="text-slate-400 text-xs">Notes</Label>
                                {mandat.notes ? (
                                  <p className="text-slate-300 mt-1 whitespace-pre-wrap">{mandat.notes}</p>
                                ) : (
                                  <p className="text-slate-500 text-sm mt-1">Aucune note</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <p className="text-slate-500 text-sm">Aucun mandat</p>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                  <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Fermer
                  </Button>
                  <Button onClick={handleEditFromView} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New Client Dialog (Generic for Client/Notaire/Courtier) */}
        <Dialog open={isNewClientDialogOpen || isNewNotaireDialogOpen || isNewCourtierDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsNewClientDialogOpen(false);
            setIsNewNotaireDialogOpen(false);
            setIsNewCourtierDialogOpen(false);
            resetClientForm();
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau {newClientForm.type_client}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewClientSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom <span className="text-red-400">*</span></Label>
                  <Input
                    value={newClientForm.prenom}
                    onChange={(e) => setNewClientForm({...newClientForm, prenom: e.target.value})}
                    required
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom <span className="text-red-400">*</span></Label>
                  <Input
                    value={newClientForm.nom}
                    onChange={(e) => setNewClientForm({...newClientForm, nom: e.target.value})}
                    required
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>

              {/* Adresses */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Adresses</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addClientField('adresses')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                {newClientForm.adresses.map((item, index) => (
                  <div key={index} className="space-y-2 p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={item.adresse}
                          onChange={(e) => updateClientField('adresses', index, 'adresse', e.target.value)}
                          placeholder="Adresse complète"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => toggleActuel('adresses', index)}
                        className={`${item.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      {newClientForm.adresses.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeClientField('adresses', index)}
                          className="text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Courriels */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Courriels</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addClientField('courriels')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                {newClientForm.courriels.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={item.courriel}
                      onChange={(e) => updateClientField('courriels', index, 'courriel', e.target.value)}
                      placeholder="Courriel"
                      className="bg-slate-800 border-slate-700"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => toggleActuel('courriels', index)}
                      className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    {newClientForm.courriels.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeClientField('courriels', index)}
                        className="text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Téléphones */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Téléphones</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addClientField('telephones')}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
                {newClientForm.telephones.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item.telephone}
                      onChange={(e) => updateClientField('telephones', index, 'telephone', e.target.value)}
                      placeholder="Téléphone"
                      className="bg-slate-800 border-slate-700"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => toggleActuel('telephones', index)}
                      className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    {newClientForm.telephones.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeClientField('telephones', index)}
                        className="text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={newClientForm.notes}
                  onChange={(e) => setNewClientForm({...newClientForm, notes: e.target.value})}
                  className="bg-slate-800 border-slate-700 h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsNewClientDialogOpen(false);
                    setIsNewNotaireDialogOpen(false);
                    setIsNewCourtierDialogOpen(false);
                    resetClientForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  Créer
                </Button>
              </div>
            </form>
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
                      <TableHead className="text-slate-300">Concordance</TableHead>
                      <TableHead className="text-slate-300 text-right">Sélection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLotsForSelector.length > 0 ? (
                      filteredLotsForSelector.map((lot) => {
                        const isSelected = currentMandatIndex !== null &&
                          formData.mandats[currentMandatIndex]?.lots?.includes(lot.numero_lot);
                        return (
                          <TableRow
                            key={lot.id}
                            className={`cursor-pointer transition-colors border-slate-800 ${
                              isSelected
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                                : 'hover:bg-slate-800/30'
                            }`}
                            onClick={() => addLotToCurrentMandat(lot.numero_lot)}
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
                            <TableCell className="text-slate-300">
                              {lot.concordance_anterieur || "-"}
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
                        <TableCell colSpan={6} className="text-center py-12">
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
          <CardHeader className="border-b border-slate-800">
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
          </CardHeader>
          <CardContent className="p-0">
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
                          {item.mandatIndex === 0 && ( // Only show delete for the first instance of a dossier to avoid duplicate buttons
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id, `${getArpenteurInitials(item.arpenteur_geometre)}${item.numero_dossier}`)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
