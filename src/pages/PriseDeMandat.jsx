
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Phone, FileCheck, User, X, UserPlus, Calendar, Eye, Check, Grid3x3 } from "lucide-react";
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

export default function PriseDeMandat() {
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
    concordance_anterieur: "",
    document_url: "",
  });
  const [uploadingLotPdf, setUploadingLotPdf] = useState(false);
  const [availableCadastresForNewLot, setAvailableCadastresForNewLot] = useState([]);

  // NEW STATES FOR DOSSIER REFERENCE
  const [dossierReferenceId, setDossierReferenceId] = useState(null);
  const [dossierSearchForReference, setDossierSearchForReference] = useState("");
  // END NEW STATES

  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    statut: "Retour d'appel",
    utilisateur_assigne: "",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    description: "",
    notes_retour_appel: "" // ADDED: New field for notes on return call
  });

  const [newClientForm, setNewClientForm] = useState({
    prenom: "",
    nom: "",
    type_client: "Client",
    adresses: [{ rue: "", numeros_civiques: [""], ville: "", code_postal: "", province: "", latitude: null, longitude: null, actuelle: true }],
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

  // NEW FUNCTION: Load data from reference dossier
  const loadDossierReference = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      statut: "Retour d'appel",
      clients_ids: dossier.clients_ids || [],
      notaires_ids: dossier.notaires_ids || [],
      courtiers_ids: dossier.courtiers_ids || [],
      mandats: dossier.mandats?.map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "", // Keeps the original mandat's open date from reference dossier
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
        date_livraison: "", // Reset for new mandat
        date_signature: "", // Reset for new mandat
        date_debut_travaux: "", // Reset for new mandat
        notes: m.notes || "",
        tache_actuelle: "" // Reset task
      })) || [],
      description: dossier.description || "",
      utilisateur_assigne: dossier.utilisateur_assigne || "",
      notes_retour_appel: "" // NEW FIELD ADDED
    });
    setActiveTabMandat("0");
    setDossierReferenceId(dossierId);
    setDossierSearchForReference(""); // Clear search field
    setIsDialogOpen(true);
  };
  // END NEW FUNCTION

  // Filtrer les dossiers pour exclure le statut "Rejeté"
  const dossiersNonRejetes = dossiers.filter(d => d.statut !== "Rejeté");

  const retourAppelDossiers = dossiersNonRejetes.filter(d =>
    d.statut === "Retour d'appel" ||
    d.statut === "Message laissé/Sans réponse" ||
    d.statut === "Demande d'information"
  );
  const soumissionDossiers = dossiersNonRejetes.filter(d => d.statut === "Soumission");

  // Calcul des périodes
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Début de la semaine (dimanche)
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  startOfYear.setHours(0, 0, 0, 0);

  const getCountsByPeriod = (dossiersList) => {
    const byWeek = dossiersList.filter(d => new Date(d.created_date) >= startOfWeek).length;
    const byMonth = dossiersList.filter(d => new Date(d.created_date) >= startOfMonth).length;
    const byYear = dossiersList.filter(d => new Date(d.created_date) >= startOfYear).length;
    return { byWeek, byMonth, byYear };
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
    ...getCountsByPeriod(retourAppelDossiers),
    byArpenteur: getCountsByArpenteur(retourAppelDossiers)
  };

  const soumissionStats = {
    total: soumissionDossiers.length,
    ...getCountsByPeriod(soumissionDossiers),
    byArpenteur: getCountsByArpenteur(soumissionDossiers)
  };

  // New filtering logic
  const applyFilters = (dossiersList) => {
    return dossiersList.filter(dossier => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        dossier.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        dossier.description?.toLowerCase().includes(searchLower) ||
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
      const matchesStatut = filterStatut === "all" || dossier.statut === filterStatut;

      return matchesSearch && matchesArpenteur && matchesStatut;
    });
  };

  const filteredRetourAppel = applyFilters(retourAppelDossiers);
  const filteredSoumission = applyFilters(soumissionDossiers);

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
    (c.adresses?.length > 0 && formatAdresse(c.adresses.find(a => a.actuelle || a.actuel))?.toLowerCase().includes(courtierSearchTerm.toLowerCase()))
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

  // NEW: Filter dossiers for reference selector
  const filteredDossiersForReference = dossiers.filter(dossier => {
    const searchLower = dossierSearchForReference.toLowerCase();
    const fullNumber = (dossier.arpenteur_geometre ? getArpenteurInitials(dossier.arpenteur_geometre) : "") + (dossier.numero_dossier || "");
    const clientsNames = getClientsNames(dossier.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      dossier.description?.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
    );
  });
  // END NEW

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

  const handleSubmit = (e) => {
    e.preventDefault();

    let dataToSubmit = { ...formData };

    // Si le statut est "Ouvert", mettre la tâche actuelle de tous les mandats à "Cédule"
    if (formData.statut === "Ouvert") {
      dataToSubmit = {
        ...formData,
        mandats: formData.mandats.map(m => ({
          ...m,
          tache_actuelle: "Cédule"
        }))
      };
    }

    if (editingDossier) {
      updateDossierMutation.mutate({ id: editingDossier.id, dossierData: dataToSubmit });
    } else {
      createDossierMutation.mutate(dataToSubmit);
    }
  };

  const handleNewClientSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...newClientForm,
      adresses: newClientForm.adresses.filter(a => a.rue?.trim() !== "" || a.numeros_civiques?.[0]?.trim() !== ""),
      courriels: newClientForm.courriels.filter(c => c.courriel.trim() !== ""),
      telephones: newClientForm.telephones.filter(t => t.telephone.trim() !== "")
    };
    createClientMutation.mutate(cleanedData);
  };

  // NEW FUNCTION
  const handleNewLotSubmit = (e) => {
    e.preventDefault();
    createLotMutation.mutate(newLotForm);
  };
  // END NEW FUNCTION

  const resetForm = () => {
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      statut: "Retour d'appel",
      utilisateur_assigne: "",
      clients_ids: [],
      notaires_ids: [],
      courtiers_ids: [],
      mandats: [],
      description: "",
      notes_retour_appel: "" // ADDED: Reset new field
    });
    setEditingDossier(null);
    setActiveTabMandat("0");
    setDossierReferenceId(null);
    setDossierSearchForReference("");
  };

  const resetClientForm = () => {
    setNewClientForm({
      prenom: "",
      nom: "",
      type_client: "Client",
      adresses: [{ rue: "", numeros_civiques: [""], ville: "", code_postal: "", province: "", latitude: null, longitude: null, actuelle: true }],
      courriels: [{ courriel: "", actuel: true }],
      telephones: [{ telephone: "", actuel: true }],
      notes: ""
    });
  };

  // NEW FUNCTION
  const resetLotForm = () => {
    setNewLotForm({
      numero_lot: "",
      circonscription_fonciere: "",
      cadastre: "",
      rang: "",
      concordance_anterieur: "",
      document_url: "",
    });
    setAvailableCadastresForNewLot([]);
  };
  // END NEW FUNCTION

  const handleEdit = (dossier) => {
    setIsViewDialogOpen(false);
    setViewingDossier(null);
    setDossierReferenceId(null); // Clear reference ID when editing existing dossier

    setEditingDossier(dossier);
    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      statut: dossier.statut || "Retour d'appel",
      utilisateur_assigne: dossier.utilisateur_assigne || "",
      clients_ids: dossier.clients_ids || [],
      notaires_ids: dossier.notaires_ids || [],
      courtiers_ids: dossier.courtiers_ids || [],
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
        date_livraison: m.date_livraison || "",
        date_signature: m.date_signature || "",
        date_debut_travaux: m.date_debut_travaux || "",
        notes: m.notes || ""
      })) || [],
      description: dossier.description || "",
      notes_retour_appel: dossier.notes_retour_appel || "" // ADDED: Load existing notes
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
        province: ""
      };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];

    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        adresse_travaux: defaultAdresse,
        lots: defaultLots,
        prix_estime: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
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

  const updateClientAddress = (index, newAddresses) => {
    setNewClientForm(prev => ({
      ...prev,
      adresses: prev.adresses.map((item, i) =>
        i === index ? { ...newAddresses[0], actuelle: item.actuelle } : item // Preserve 'actuelle' status
      )
    }));
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

  const addClientField = (fieldName) => {
    if (fieldName === 'adresses') {
      setNewClientForm(prev => ({
        ...prev,
        adresses: [...prev.adresses, { rue: "", numeros_civiques: [""], ville: "", code_postal: "", province: "", latitude: null, longitude: null, actuelle: false }]
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
      setNewLotForm(prev => ({ ...prev, document_url: response.url }));
      alert("Fichier PDF téléchargé avec succès !");
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier:", error);
      alert("Échec du téléchargement du fichier PDF.");
    } finally {
      setUploadingLotPdf(false);
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
      "Soumission": "bg-purple-500/20 text-purple-400 border-purple-500/30",
      "Ouvert": "bg-green-500/20 text-green-400 border-green-500/30"
    };
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
        case 'description':
            aValue = (a.description || '').toLowerCase();
            bValue = (b.description || '').toLowerCase();
            break;
        default:
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
          break;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedRetourAppel = sortDossiers(filteredRetourAppel);
  const sortedSoumission = sortDossiers(filteredSoumission);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Prise de mandat
              </h1>
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion des retours d'appel et soumissions</p>
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
                {/* Reference Dossier Selector - Always visible for "Retour d'appel" status */}
                {!editingDossier && formData.statut === "Retour d'appel" && (
                  <div className="space-y-2 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <Label className="text-slate-300">Créer à partir d'un dossier existant</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <Input
                          placeholder="Rechercher un dossier par numéro, client, etc."
                          value={dossierSearchForReference}
                          onChange={(e) => setDossierSearchForReference(e.target.value)}
                          className="pl-10 bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                    {dossierSearchForReference && (
                      <div className="max-h-48 overflow-y-auto mt-2 border border-slate-700 rounded-md">
                        {filteredDossiersForReference.length > 0 ? (
                          filteredDossiersForReference.map(d => (
                            <div
                              key={d.id}
                              className="p-2 cursor-pointer hover:bg-slate-700/50 flex justify-between items-center text-sm border-b border-slate-800 last:border-b-0"
                              onClick={() => loadDossierReference(d.id)}
                            >
                              <div>
                                <p className="font-medium text-white">
                                  {d.arpenteur_geometre ? getArpenteurInitials(d.arpenteur_geometre) : ""}{d.numero_dossier || ""}
                                  {d.numero_dossier && d.arpenteur_geometre && " - "}
                                  {getClientsNames(d.clients_ids)}
                                </p>
                                <p className="text-slate-400 text-xs truncate">{getFirstAdresseTravaux(d.mandats)}</p>
                              </div>
                              <Button type="button" size="sm" variant="ghost" className="text-emerald-400">
                                <Plus className="w-4 h-4 mr-1" /> Sélectionner
                              </Button>
                            </div>
                          ))
                        ) : (
                          <p className="p-3 text-center text-slate-500 text-sm">Aucun dossier trouvé.</p>
                        )}
                      </div>
                    )}
                    {dossierReferenceId && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDossierReferenceId(null);
                            resetForm();
                          }}
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                        >
                          Effacer le dossier de référence
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                    <Select
                      value={formData.arpenteur_geometre}
                      onValueChange={(value) => setFormData({...formData, arpenteur_geometre: value})}
                      disabled={!!dossierReferenceId}
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
                    <Select value={formData.statut} onValueChange={(value) => {
                      setFormData({...formData, statut: value, utilisateur_assigne: value !== "Retour d'appel" ? "" : formData.utilisateur_assigne});
                      if (value !== "Retour d'appel") {
                        setDossierReferenceId(null);
                        setDossierSearchForReference("");
                      }
                    }}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Retour d'appel" className="text-white">Retour d'appel</SelectItem>
                        <SelectItem value="Message laissé/Sans réponse" className="text-white">Message laissé/Sans réponse</SelectItem>
                        <SelectItem value="Demande d'information" className="text-white">Demande d'information</SelectItem>
                        <SelectItem value="Soumission" className="text-white">Soumission</SelectItem>
                        {editingDossier && (
                          <SelectItem value="Ouvert" className="text-white">Ouvert</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Utilisateur assigné - Only visible for "Retour d'appel" status */}
                {formData.statut === "Retour d'appel" && (
                  <div className="space-y-2">
                    <Label>Utilisateur assigné</Label>
                    <Select
                      value={formData.utilisateur_assigne || ""}
                      onValueChange={(value) => setFormData({...formData, utilisateur_assigne: value})}
                      disabled={!!dossierReferenceId}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value={null} className="text-white">Aucun utilisateur</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.email} className="text-white">
                            {user.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes de retour d'appel - Only visible for "Retour d'appel" status */}
                {formData.statut === "Retour d'appel" && (
                  <div className="space-y-2">
                    <Label>Notes de retour d'appel</Label>
                    <Textarea
                      value={formData.notes_retour_appel}
                      onChange={(e) => setFormData({...formData, notes_retour_appel: e.target.value})}
                      className="bg-slate-800 border-slate-700 h-20"
                      disabled={!!dossierReferenceId}
                      placeholder="Ajouter des notes spécifiques à ce retour d'appel..."
                    />
                  </div>
                )}

                {/* Informations du dossier de référence - Only visible for "Retour d'appel" with reference dossier */}
                {formData.statut === "Retour d'appel" && dossierReferenceId && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="space-y-2">
                      <Label>N° de dossier de référence</Label>
                      <Input
                        value={formData.numero_dossier}
                        className="bg-slate-800 border-slate-700"
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'ouverture du dossier de référence</Label>
                      <Input
                        type="date"
                        value={formData.date_ouverture}
                        className="bg-slate-800 border-slate-700"
                        disabled
                      />
                    </div>
                  </div>
                )}

                {/* Champs conditionnels pour statut "Ouvert" */}
                {formData.statut === "Ouvert" && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="space-y-2">
                      <Label>N° de dossier <span className="text-red-400">*</span></Label>
                      <Input
                        value={formData.numero_dossier}
                        onChange={(e) => setFormData({...formData, numero_dossier: e.target.value})}
                        required
                        placeholder="Ex: SG-2024-001"
                        className="bg-slate-800 border-slate-700"
                        disabled={!!dossierReferenceId}
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
                        disabled={!!dossierReferenceId}
                      />
                    </div>
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
                      disabled={!!dossierReferenceId}
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
                            const adresseActuelle = client?.adresses?.find(a => a.actuelle);
                            return client ? (
                              <TableRow key={clientId} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white font-medium">
                                  {client.prenom} {client.nom}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {adresseActuelle ? formatAdresse(adresseActuelle) : "-"}
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
                                      disabled={!!dossierReferenceId}
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
                      disabled={!!dossierReferenceId}
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
                            const adresseActuelle = notaire?.adresses?.find(a => a.actuelle);
                            return notaire ? (
                              <TableRow key={notaireId} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white font-medium">
                                  {notaire.prenom} {notaire.nom}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {adresseActuelle ? formatAdresse(adresseActuelle) : "-"}
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
                                      disabled={!!dossierReferenceId}
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
                      disabled={!!dossierReferenceId}
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
                            const adresseActuelle = courtier?.adresses?.find(a => a.actuelle);
                            return courtier ? (
                              <TableRow key={courtierId} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white font-medium">
                                  {courtier.prenom} {courtier.nom}
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {adresseActuelle ? formatAdresse(adresseActuelle) : "-"}
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
                                      disabled={!!dossierReferenceId}
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
                    disabled={!!dossierReferenceId}
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
                      disabled={!!dossierReferenceId}
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
                                  disabled={!!dossierReferenceId}
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
                                    disabled={!!dossierReferenceId}
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
                                    disabled={!!dossierReferenceId}
                                  />
                                </div>
                              </div>

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
                                disabled={!!dossierReferenceId}
                              />

                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label>Date de signature</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_signature || ""}
                                    onChange={(e) => updateMandat(index, 'date_signature', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                    disabled={!!dossierReferenceId}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Début des travaux</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_debut_travaux || ""}
                                    onChange={(e) => updateMandat(index, 'date_debut_travaux', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                    disabled={!!dossierReferenceId}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Date de livraison</Label>
                                  <Input
                                    type="date"
                                    value={mandat.date_livraison || ""}
                                    onChange={(e) => updateMandat(index, 'date_livraison', e.target.value)}
                                    className="bg-slate-700 border-slate-600"
                                    disabled={!!dossierReferenceId}
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
                                    disabled={!!dossierReferenceId}
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
                                                  disabled={!!dossierReferenceId}
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
                                                  disabled={!!dossierReferenceId}
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

                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label>Prix estimé ($)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={mandat.prix_estime || ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      updateMandat(index, 'prix_estime', value ? parseFloat(value) : 0);
                                    }}
                                    placeholder="0.00"
                                    className="bg-slate-700 border-slate-600"
                                    disabled={!!dossierReferenceId}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Rabais ($)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={mandat.rabais || ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      updateMandat(index, 'rabais', value ? parseFloat(value) : 0);
                                    }}
                                    placeholder="0.00"
                                    className="bg-slate-700 border-slate-600"
                                    disabled={!!dossierReferenceId}
                                  />
                                </div>
                                <div className="space-y-2 flex items-center pt-8">
                                  <input
                                    type="checkbox"
                                    id={`taxes_incluses_${index}`}
                                    checked={mandat.taxes_incluses}
                                    onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded"
                                    disabled={!!dossierReferenceId}
                                  />
                                  <label htmlFor={`taxes_incluses_${index}`} className="ml-2 text-slate-300 text-sm">
                                    Taxes incluses
                                  </label>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                  value={mandat.notes}
                                  onChange={(e) => updateMandat(index, 'notes', e.target.value)}
                                  className="bg-slate-700 border-slate-600 h-20"
                                  disabled={!!dossierReferenceId}
                                />
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
                        {client.adresses?.length > 0 && formatAdresse(client.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(client.adresses.find(a => a.actuelle || a.actuel))}</p>
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
                        {notaire.adresses?.length > 0 && formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(notaire.adresses.find(a => a.actuelle || a.actuel))}</p>
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
                        {courtier.adresses?.length > 0 && formatAdresse(courtier.adresses.find(a => a.actuelle || a.actuel)) && (
                          <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle || a.actuel))}</p>
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
              <DialogTitle className="text-2xl">Nouveau {newClientForm.type_client}</DialogTitle>
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

              {/* Adresses avec AddressInput */}
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
                        <AddressInput
                          addresses={[item]}
                          onChange={(newAddresses) => updateClientAddress(index, newAddresses)}
                          showActuelle={false}
                          singleAddress={true}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => toggleActuel('adresses', index)}
                        className={`${item.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 mt-7`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      {newClientForm.adresses.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeClientField('adresses', index)}
                          className="text-red-400 mt-7"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {item.actuelle && (
                      <p className="text-xs text-green-400 mt-1">✓ Adresse actuelle</p>
                    )}
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
          if (!open) resetLotForm();
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
                    value={newLotForm.cadastre}
                    onValueChange={(value) => setNewLotForm({...newLotForm, cadastre: value})}
                    disabled={!newLotForm.circonscription_fonciere}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder={newLotForm.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord une circonscription"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                      {availableCadastresForNewLot.map((cadastre) => (
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
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleLotFileUpload}
                  disabled={uploadingLotPdf}
                  className="bg-slate-800 border-slate-700"
                />
                {uploadingLotPdf && <p className="text-sm text-slate-400">Upload en cours...</p>}
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

        {/* View Dossier Dialog (Keep if still needed for other contexts) */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Détails du dossier</DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400">Arpenteur-géomètre</p>
                    <p className="text-white font-medium">{viewingDossier.arpenteur_geometre}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Statut</p>
                    <Badge variant="outline" className={`${getStatutBadgeColor(viewingDossier.statut)} border`}>
                      {viewingDossier.statut}
                    </Badge>
                  </div>
                  {viewingDossier.numero_dossier && (
                    <div>
                      <p className="text-slate-400">Numéro de dossier</p>
                      <p className="text-white font-medium">{getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400">Date d'ouverture</p>
                    <p className="text-white font-medium">{viewingDossier.date_ouverture ? format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr }) : '-'}</p>
                  </div>
                  {viewingDossier.utilisateur_assigne && ( // NEW: Display assigned user
                    <div>
                      <p className="text-slate-400">Utilisateur assigné</p>
                      <p className="text-white font-medium">
                        {users.find(u => u.email === viewingDossier.utilisateur_assigne)?.full_name || viewingDossier.utilisateur_assigne}
                      </p>
                    </div>
                  )}
                </div>

                {viewingDossier.notes_retour_appel && ( // ADDED: Display notes de retour d'appel
                  <div className="space-y-2">
                    <p className="text-slate-400">Notes de retour d'appel</p>
                    <p className="text-white">{viewingDossier.notes_retour_appel}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-slate-400">Clients</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingDossier.clients_ids?.map(clientId => {
                      const client = getClientById(clientId);
                      return client ? (
                        <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                          {client.prenom} {client.nom}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400">Notaires</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingDossier.notaires_ids?.map(notaireId => {
                      const notaire = getClientById(notaireId);
                      return notaire ? (
                        <Badge key={notaireId} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
                          {notaire.prenom} {notaire.nom}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-slate-400">Courtiers</p>
                  <div className="flex flex-wrap gap-2">
                    {viewingDossier.courtiers_ids?.map(courtierId => {
                      const courtier = getClientById(courtierId);
                      return courtier ? (
                        <Badge key={courtierId} className="bg-orange-500/20 text-orange-400 border-orange-500/30 border">
                          {courtier.prenom} {courtier.nom}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {viewingDossier.mandats && viewingDossier.mandats.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-400">Mandats</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingDossier.mandats.map((mandat, index) => (
                        <Card key={index} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-4 space-y-2">
                            <p className="text-white font-medium">{mandat.type_mandat || `Mandat ${index + 1}`}</p>
                            <p className="text-slate-400 text-sm">Adresse: {formatAdresse(mandat.adresse_travaux) || '-'}</p>
                            <p className="text-slate-400 text-sm">Lots: {mandat.lots && mandat.lots.length > 0 ? mandat.lots.map(id => getLotById(id)?.numero_lot || id).join(', ') : '-'}</p>
                            <p className="text-slate-400 text-sm">Prix estimé: {mandat.prix_estime ? `${mandat.prix_estime}$` : '-'}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {viewingDossier.description && (
                  <div className="space-y-2">
                    <p className="text-slate-400">Description générale</p>
                    <p className="text-white">{viewingDossier.description}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Fermer
                  </Button>
                  <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={handleEditFromView}>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>


        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Retours d'appel Stats */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-2 pt-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-slate-400">Retours d'appel</p>
                  <CardTitle className="text-2xl font-bold mt-1 text-white">
                    {retourAppelStats.total}
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 opacity-20">
                  <Phone className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-3">
              <div className="space-y-1">
                {ARPENTEURS.map(arp => (
                  <div key={arp} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-slate-400 truncate max-w-[180px]" title={arp}>
                      {arp}
                    </span>
                    <span className="text-white font-semibold">
                      {retourAppelStats.byArpenteur[arp]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Soumissions Stats */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-2 pt-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-slate-400">Soumissions</p>
                  <CardTitle className="text-2xl font-bold mt-1 text-white">
                    {soumissionStats.total}
                  </CardTitle>
                </div>
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 opacity-20">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 pb-3">
              <div className="space-y-1">
                {ARPENTEURS.map(arp => (
                  <div key={arp} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-slate-400 truncate max-w-[180px]" title={arp}>
                      {arp}
                    </span>
                    <span className="text-white font-semibold">
                      {soumissionStats.byArpenteur[arp]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Retour d'appel and Soumission */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <Tabs defaultValue="retour-appel" className="w-full">
            <CardHeader className="border-b border-slate-800">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <TabsList className="bg-slate-800/50 border border-slate-700">
                    <TabsTrigger
                      value="retour-appel"
                      className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Retours d'appel ({retourAppelDossiers.length})
                    </TabsTrigger>
                    <TabsTrigger
                      value="soumission"
                      className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Soumissions ({soumissionDossiers.length})
                    </TabsTrigger>
                  </TabsList>
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

                {/* Filtres */}
                <div className="flex flex-wrap gap-3">
                  <Select value={filterArpenteur} onValueChange={setFilterArpenteur}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Arpenteur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                      {ARPENTEURS.map((arp) => (
                        <SelectItem key={arp} value={arp} className="text-white">
                          {arp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les statuts</SelectItem>
                      <SelectItem value="Retour d'appel" className="text-white">Retour d'appel</SelectItem>
                      <SelectItem value="Message laissé/Sans réponse" className="text-white">Message laissé/Sans réponse</SelectItem>
                      <SelectItem value="Demande d'information" className="text-white">Demande d'information</SelectItem>
                      <SelectItem value="Soumission" className="text-white">Soumission</SelectItem>
                    </SelectContent>
                  </Select>

                  {(filterArpenteur !== "all" || filterStatut !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterArpenteur("all");
                        setFilterStatut("all");
                      }}
                      className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <TabsContent value="retour-appel" className="p-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('arpenteur_geometre')}
                        >
                          Arpenteur {sortField === 'arpenteur_geometre' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('created_date')}
                        >
                          Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('statut')}
                        >
                          Statut {sortField === 'statut' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('clients')}
                        >
                          Clients {sortField === 'clients' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('adresse_travaux')}
                        >
                          Adresse travaux {sortField === 'adresse_travaux' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('mandats')}
                        >
                          Mandat {sortField === 'mandats' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('description')}
                        >
                          Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRetourAppel.map((dossier) => (
                        <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800">
                          <TableCell className="text-slate-300">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              {dossier.arpenteur_geometre}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.created_date ? format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getStatutBadgeColor(dossier.statut)} border text-xs`}>
                              {dossier.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {getClientsNames(dossier.clients_ids)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                            {getFirstAdresseTravaux(dossier.mandats)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.mandats && dossier.mandats.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {dossier.mandats.slice(0, 2).map((mandat, idx) => (
                                  <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                    {mandat.type_mandat}
                                  </Badge>
                                ))}
                                {dossier.mandats.length > 2 && (
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                                    +{dossier.mandats.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 max-w-xs truncate">
                            {dossier.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(dossier)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(dossier.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sortedRetourAppel.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            Aucun retour d'appel
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="soumission" className="p-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('arpenteur_geometre')}
                        >
                          Arpenteur {sortField === 'arpenteur_geometre' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('created_date')}
                        >
                          Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('statut')}
                        >
                          Statut {sortField === 'statut' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('clients')}
                        >
                          Clients {sortField === 'clients' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('adresse_travaux')}
                        >
                          Adresse travaux {sortField === 'adresse_travaux' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('mandats')}
                        >
                          Mandat {sortField === 'mandats' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('description')}
                        >
                          Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSoumission.map((dossier) => (
                        <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800">
                          <TableCell className="text-slate-300">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-500" />
                              {dossier.arpenteur_geometre}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.created_date ? format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`${getStatutBadgeColor(dossier.statut)} border text-xs`}>
                              {dossier.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {getClientsNames(dossier.clients_ids)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                            {getFirstAdresseTravaux(dossier.mandats)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.mandats && dossier.mandats.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {dossier.mandats.slice(0, 2).map((mandat, idx) => (
                                  <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                    {mandat.type_mandat}
                                  </Badge>
                                ))}
                                {dossier.mandats.length > 2 && (
                                  <Badge className="bg-slate-700 text-slate-300 text-xs">
                                    +{dossier.mandats.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 max-w-xs truncate">
                            {dossier.description || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(dossier)}
                                className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(dossier.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sortedSoumission.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            Aucune soumission
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
