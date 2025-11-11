
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Phone, FileCheck, User, X, UserPlus, Calendar, Eye, Check, Grid3x3, Send, TrendingUp, TrendingDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";
import CommentairesSection from "../components/dossiers/CommentairesSection";
import CommentairesSectionClient from "../components/clients/CommentairesSectionClient"; // Added new import

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

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

  // NEW STATE FOR CLIENT EDITING
  const [editingClient, setEditingClient] = useState(null); // This will hold the client object if we are editing
  // END NEW STATE

  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterUtilisateurAssigne, setFilterUtilisateurAssigne] = useState("all");
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
    description: ""
  });

  const [newClientForm, setNewClientForm] = useState({
    prenom: "",
    nom: "",
    type_client: "Client",
    adresses: [], // Changed to empty array
    courriels: [], // Changed to empty array
    telephones: [], // Changed to empty array
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

  const createDossierMutation = useMutation({
    mutationFn: async (dossierData) => {
      const newDossier = await base44.entities.Dossier.create(dossierData);

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

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsNewClientDialogOpen(false);
      setIsNewNotaireDialogOpen(false);
      setIsNewCourtierDialogOpen(false);
      setNewClientForm({ // Inlined resetClientForm logic
        prenom: "",
        nom: "",
        type_client: "Client",
        adresses: [],
        courriels: [],
        telephones: [],
        notes: ""
      });
      setEditingClient(null); // Inlined resetClientForm logic
    },
  });

  // NEW MUTATION FOR UPDATING CLIENTS
  const updateClientMutation = useMutation({
    mutationFn: ({ id, clientData }) => base44.entities.Client.update(id, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsNewClientDialogOpen(false);
      setIsNewNotaireDialogOpen(false);
      setIsNewCourtierDialogOpen(false);
      setNewClientForm({ // Inlined resetClientForm logic
        prenom: "",
        nom: "",
        type_client: "Client",
        adresses: [],
        courriels: [],
        telephones: [],
        notes: ""
      });
      setEditingClient(null); // Inlined resetClientForm logic
    },
  });
  // END NEW MUTATION

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
      statut: "Retour d'appel", // FORCE le statut à "Retour d'appel"
      utilisateur_assigne: formData.utilisateur_assigne || "", // Garde l'utilisateur assigné actuel
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
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        tache_actuelle: ""
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

  const handleSubmit = (e) => {
    e.preventDefault();

    let dataToSubmit = { ...formData };

    if (formData.statut === "Ouvert") {
      dataToSubmit = {
        ...dataToSubmit,
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

    // Check if we are editing an existing client or creating a new one
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, clientData: cleanedData });
    } else {
      createClientMutation.mutate(cleanedData);
    }
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
      description: ""
    });
    setEditingDossier(null);
    setActiveTabMandat("0");
    setDossierReferenceId(null);
    setDossierSearchForReference("");
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

  const handleEdit = (entity) => { // Renamed from 'dossier' to 'entity'
    // Check if the entity is a client (based on type_client property presence)
    if (entity && entity.type_client) {
      // It's a client. Open client editing form.
      setEditingClient(entity);
      setNewClientForm({
        prenom: entity.prenom || "",
        nom: entity.nom || "",
        type_client: entity.type_client || "Client",
        adresses: entity.adresses && entity.adresses.length > 0 ? entity.adresses.map(addr => ({ ...addr })) : [], // Ensure it's an array
        courriels: entity.courriels && entity.courriels.length > 0 ? entity.courriels.map(email => ({ ...email })) : [], // Ensure it's an array
        telephones: entity.telephones && entity.telephones.length > 0 ? entity.telephones.map(tel => ({ ...tel })) : [], // Ensure it's an array
        notes: entity.notes || ""
      });

      // Close the selector dialog first
      setIsClientSelectorOpen(false);
      setIsNotaireSelectorOpen(false);
      setIsCourtierSelectorOpen(false);

      // Open the appropriate client/notaire/courtier dialog for editing
      if (entity.type_client === "Notaire") {
        setIsNewNotaireDialogOpen(true);
      } else if (entity.type_client === "Courtier immobilier") {
        setIsNewCourtierDialogOpen(true);
      } else { // Default to "Client"
        setIsNewClientDialogOpen(true);
      }
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
      statut: mapOldStatusToCombined(entity.statut || "Retour d'appel"), // Apply mapping here
      utilisateur_assigne: entity.utilisateur_assigne || "",
      clients_ids: entity.clients_ids || [],
      notaires_ids: entity.notaires_ids || [],
      courtiers_ids: entity.courtiers_ids || [],
      mandats: entity.mandats?.map(m => ({
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
        tache_actuelle: m.tache_actuelle || ""
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
        tache_actuelle: "" // NEWLY ADDED
        // notes: "" // Removed as per changes
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

  const removeClientField = (fieldName, index) => {
    if (newClientForm[fieldName].length > 0) { // Check for > 0 instead of > 1 since the list might become empty
      setNewClientForm(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    }
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
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Prise de mandat
              </h1>
              <Phone className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion des prise de mandat et retours d'appel</p>
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
                  {/* Section pour les champs de base - tous en une seule colonne */}
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
                        // Si on change le statut et qu'on avait un dossier de référence, reset tout
                        if (dossierReferenceId && value !== "Retour d'appel") {
                          resetForm();
                          setFormData(prev => ({
                            ...prev,
                            statut: value,
                            arpenteur_geometre: formData.arpenteur_geometre
                          }));
                        } else {
                          setFormData({...formData, statut: value, utilisateur_assigne: value !== "Retour d'appel" ? "" : formData.utilisateur_assigne});
                          if (value !== "Retour d'appel") {
                            setDossierReferenceId(null);
                            setDossierSearchForReference("");
                          }
                        }
                      }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="Retour d'appel" className="text-white">Retour d'appel</SelectItem>
                          <SelectItem value="Nouveau mandat/Demande d'information" className="text-white">Nouveau mandat/Demande d'information</SelectItem>
                          <SelectItem value="Soumission" className="text-white">Soumission</SelectItem>
                          <SelectItem value="Mandats à ouvrir" className="text-white">Mandats à ouvrir</SelectItem>
                          <SelectItem value="Mandat non octroyé" className="text-white">Mandat non octroyé</SelectItem>
                          {editingDossier && (
                            <SelectItem value="Ouvert" className="text-white">Ouvert</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Champ "Créer à partir d'un dossier existant" - Visible SEULEMENT pour Retour d'appel */}
                  {formData.statut === "Retour d'appel" && (
                    <div className="space-y-2">
                      <Label className="text-slate-300">Créer à partir d'un dossier existant</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <Input
                          placeholder="Rechercher un dossier par numéro, client, etc."
                          value={dossierSearchForReference}
                          onChange={(e) => setDossierSearchForReference(e.target.value)}
                          className="pl-10 bg-slate-700 border-slate-600"
                        />
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

                  {/* Utilisateur assigné pour Retour d'appel */}
                  {formData.statut === "Retour d'appel" && (
                    <div className="space-y-2">
                      <Label>Utilisateur assigné</Label>
                      <Select
                        value={formData.utilisateur_assigne || ""}
                        onValueChange={(value) => setFormData({...formData, utilisateur_assigne: value})}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner un utilisateur" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value={null} className="text-white">Aucun utilisateur</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.email} value={user.email} className="text-white">
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                  {/* Description field - CACHER pour Soumission, Ouvert, Retour d'appel et Nouveau mandat */}
                  {formData.statut !== "Soumission" && formData.statut !== "Ouvert" && formData.statut !== "Retour d'appel" && formData.statut !== "Nouveau mandat/Demande d'information" && formData.statut !== "Mandats à ouvrir" && formData.statut !== "Mandat non octroyé" && (
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="bg-slate-800 border-slate-700 min-h-[120px]"
                        placeholder="Ajouter une description ou des notes générales pour ce dossier..."
                      />
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
                          disabled={!!dossierReferenceId}
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
                                {!dossierReferenceId && (
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
                                )}
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
                          disabled={!!dossierReferenceId}
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
                                {!dossierReferenceId && (
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
                                )}
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
                          disabled={!!dossierReferenceId}
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
                                {!dossierReferenceId && (
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
                                )}
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
                        disabled={!!dossierReferenceId}
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
                                {/* Type de mandat et bouton supprimer sur la même ligne */}
                                <div className="flex gap-4 items-start">
                                  <div className="flex-1 space-y-2">
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
                                    disabled={!!dossierReferenceId}
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
                                      disabled={!!dossierReferenceId}
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
                                          disabled={!!dossierReferenceId}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-left block">Date de signature</Label>
                                        <Input
                                          type="date"
                                          value={mandat.date_signature || ""}
                                          onChange={(e) => updateMandat(index, 'date_signature', e.target.value)}
                                          className="bg-slate-700 border-slate-600"
                                          disabled={!!dossierReferenceId}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-left block">Début des travaux</Label>
                                        <Input
                                          type="date"
                                          value={mandat.date_debut_travaux || ""}
                                          onChange={(e) => updateMandat(index, 'date_debut_travaux', e.target.value)}
                                          className="bg-slate-700 border-slate-600"
                                          disabled={!!dossierReferenceId}
                                        />
                                      </div>

                                      <div className="space-y-2">
                                        <Label className="text-left block">Date de livraison</Label>
                                        <Input
                                          type="date"
                                          value={mandat.date_livraison || ""}
                                          onChange={(e) => updateMandat(index, 'date_livraison', e.target.value)}
                                          className="bg-slate-700 border-slate-600"
                                          disabled={!!dossierReferenceId}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                }</div>

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

                  {/* Tableau Tarification - EN BAS */}
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
                                    disabled={!!dossierReferenceId}
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
                                    disabled={!!dossierReferenceId}
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <input
                                    type="checkbox"
                                    id={`taxes_incluses_${index}`}
                                    checked={mandat.taxes_incluses}
                                    onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)}
                                    className="form-checkbox h-5 w-5 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded"
                                    disabled={!!dossierReferenceId}
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
                        {courtier.adresses?.length > 0 && formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel)) && (
                          <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle || a.actel))}</p>
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

        {/* New Client Dialog (Generic for Client/Notaire/Courtier) */}
        <Dialog open={isNewClientDialogOpen || isNewNotaireDialogOpen || isNewCourtierDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsNewClientDialogOpen(false);
            setIsNewNotaireDialogOpen(false);
            setIsNewCourtierDialogOpen(false);
            // Inlined resetClientForm logic
            setNewClientForm({
              prenom: "",
              nom: "",
              type_client: "Client",
              adresses: [],
              courriels: [],
              telephones: [],
              notes: ""
            });
            setEditingClient(null);
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">
                {editingClient ? `Modifier ${editingClient.type_client}` : `Nouveau ${newClientForm.type_client}`}
              </DialogTitle>
            </DialogHeader>

            <div className="flex h-[90vh]">
              {/* Main form content - 70% */}
              <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {editingClient ? `Modifier ${editingClient.type_client}` : `Nouveau ${newClientForm.type_client}`}
                  </h2>
                </div>

                <form id="new-client-form" onSubmit={handleNewClientSubmit} className="space-y-6">
                  {/* Prénom, Nom et Type sur la même ligne */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom <span className="text-red-400">*</span></Label>
                      <Input
                        id="prenom"
                        value={newClientForm.prenom}
                        onChange={(e) => setNewClientForm({...newClientForm, prenom: e.target.value})}
                        required
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom <span className="text-red-400">*</span></Label>
                      <Input
                        id="nom"
                        value={newClientForm.nom}
                        onChange={(e) => setNewClientForm({...newClientForm, nom: e.target.value})}
                        required
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type_client">Type de client</Label>
                      <Select value={newClientForm.type_client} onValueChange={(value) => setNewClientForm({...newClientForm, type_client: value})}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner le type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="Client" className="text-white">Client</SelectItem>
                          <SelectItem value="Notaire" className="text-white">Notaire</SelectItem>
                          <SelectItem value="Courtier immobilier" className="text-white">Courtier immobilier</SelectItem>
                          <SelectItem value="Compagnie" className="text-white">Compagnie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Adresses */}
                  <div className="space-y-3">
                    <Label>Adresses</Label>
                    
                    {/* Formulaire pour nouvelle adresse */}
                    <div className="p-3 bg-slate-800/30 rounded-lg space-y-3">
                      <div className="grid grid-cols-[200px_1fr] gap-3">
                        <div className="space-y-2">
                          <Label>Numéro(s) civique(s)</Label>
                          <div className="flex gap-2 mb-2">
                            <Input
                              id="new-civic-0"
                              defaultValue=""
                              placeholder="Ex: 123"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Rue</Label>
                          <Input
                            id="new-rue"
                            defaultValue=""
                            placeholder="Nom de la rue"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Ville</Label>
                          <Input
                            id="new-ville"
                            defaultValue=""
                            placeholder="Ville"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Province</Label>
                          <Select id="new-province" defaultValue="Québec">
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Sélectionner une province" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="Québec" className="text-white">Québec</SelectItem>
                              <SelectItem value="Alberta" className="text-white">Alberta</SelectItem>
                              <SelectItem value="Colombie-Britannique" className="text-white">Colombie-Britannique</SelectItem>
                              <SelectItem value="Île-du-Prince-Édouard" className="text-white">Île-du-Prince-Édouard</SelectItem>
                              <SelectItem value="Manitoba" className="text-white">Manitoba</SelectItem>
                              <SelectItem value="Nouveau-Brunswick" className="text-white">Nouveau-Brunswick</SelectItem>
                              <SelectItem value="Nouvelle-Écosse" className="text-white">Nouvelle-Écosse</SelectItem>
                              <SelectItem value="Nunavut" className="text-white">Nunavut</SelectItem>
                              <SelectItem value="Ontario" className="text-white">Ontario</SelectItem>
                              <SelectItem value="Saskatchewan" className="text-white">Saskatchewan</SelectItem>
                              <SelectItem value="Terre-Neuve-et-Labrador" className="text-white">Terre-Neuve-et-Labrador</SelectItem>
                              <SelectItem value="Territoires du Nord-Ouest" className="text-white">Territoires du Nord-Ouest</SelectItem>
                              <SelectItem value="Yukon" className="text-white">Yukon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Code Postal</Label>
                        <Input
                          id="new-code-postal"
                          defaultValue=""
                          placeholder="Code postal"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const civicInput = document.getElementById('new-civic-0');
                          const rueInput = document.getElementById('new-rue');
                          const villeInput = document.getElementById('new-ville');
                          const provinceSelectElement = document.getElementById('new-province'); // The shadcn Select root div
                          const codePostalInput = document.getElementById('new-code-postal');

                          const civic = civicInput?.value.trim() || "";
                          const rue = rueInput?.value.trim() || "";
                          const ville = villeInput?.value.trim() || "";
                          // For shadcn Select, retrieve the value from the current display or state.
                          // The `SelectValue` component displays the current value.
                          // A more robust way would be to control it with React state for newAddressProvince.
                          // For this direct DOM manipulation, we have to parse the text.
                          const provinceText = provinceSelectElement?.querySelector('[data-state="checked"]')?.textContent || provinceSelectElement?.querySelector('.text-white:not([data-placeholder])')?.textContent || "Québec";
                          const codePostal = codePostalInput?.value.trim() || "";
                          
                          if (civic || rue || ville || codePostal) {
                            setNewClientForm(prev => ({
                              ...prev,
                              adresses: [...prev.adresses, {
                                numeros_civiques: civic ? [civic] : [],
                                rue,
                                ville,
                                province: provinceText, // Use the parsed text
                                code_postal: codePostal,
                                actuelle: false // New addresses are not current by default
                              }]
                            }));
                            
                            // Clear inputs
                            if (civicInput) civicInput.value = "";
                            if (rueInput) rueInput.value = "";
                            if (villeInput) villeInput.value = "";
                            if (codePostalInput) codePostalInput.value = "";
                            // To reset the province select, you'd typically control its value with state,
                            // but since it's not state-controlled here, it will retain its selection.
                          }
                        }}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter cette adresse
                      </Button>
                    </div>

                    {/* Liste des adresses */}
                    {newClientForm.adresses.length > 0 && (
                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                              <TableHead className="text-slate-300">Adresse complète</TableHead>
                              <TableHead className="text-slate-300 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newClientForm.adresses.map((addr, index) => (
                              <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white">
                                  {formatAdresse(addr) || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => toggleActuel('adresses', index)}
                                      className={`${addr.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeClientField('adresses', index)}
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

                  {/* Courriels et Téléphones en deux colonnes */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Courriels */}
                    <div className="space-y-3">
                      <Label>Courriels</Label>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          id="new-courriel"
                          defaultValue=""
                          placeholder="Courriel"
                          className="bg-slate-800 border-slate-700"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const courrielInput = document.getElementById('new-courriel');
                            const courriel = courrielInput?.value.trim();
                            if (courriel) {
                              setNewClientForm(prev => ({
                                ...prev,
                                courriels: [...prev.courriels, { courriel, actuel: false }]
                              }));
                              courrielInput.value = "";
                            }
                          }}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {newClientForm.courriels.length > 0 && (
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead className="text-slate-300">Courriel</TableHead>
                                <TableHead className="text-slate-300 text-right">Actions</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                              {newClientForm.courriels.map((item, index) => (
                                <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white text-sm">{item.courriel}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => toggleActuel('courriels', index)}
                                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeClientField('courriels', index)}
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

                    {/* Téléphones */}
                    <div className="space-y-3">
                      <Label>Téléphones</Label>
                      <div className="flex gap-2">
                        <Input
                          id="new-telephone"
                          defaultValue=""
                          placeholder="Téléphone"
                          className="bg-slate-800 border-slate-700"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const telephoneInput = document.getElementById('new-telephone');
                            const telephone = telephoneInput?.value.trim();
                            if (telephone) {
                              setNewClientForm(prev => ({
                                ...prev,
                                telephones: [...prev.telephones, { telephone, actuel: false }]
                              }));
                              telephoneInput.value = "";
                            }
                          }}
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {newClientForm.telephones.length > 0 && (
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead className="text-slate-300">Téléphone</TableHead>
                                <TableHead className="text-slate-300 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {newClientForm.telephones.map((item, index) => (
                                <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white text-sm">{item.telephone}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => toggleActuel('telephones', index)}
                                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeClientField('telephones', index)}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newClientForm.notes}
                      onChange={(e) => setNewClientForm({...newClientForm, notes: e.target.value})}
                      className="bg-slate-800 border-slate-700 h-20"
                    />
                  </div>
                </form>

                {/* Boutons Annuler/Créer tout en bas */}
                <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNewClientDialogOpen(false);
                      setIsNewNotaireDialogOpen(false);
                      setIsNewCourtierDialogOpen(false);
                      // Inlined resetClientForm logic
                      setNewClientForm({
                        prenom: "",
                        nom: "",
                        type_client: "Client",
                        adresses: [],
                        courriels: [],
                        telephones: [],
                        notes: ""
                      });
                      setEditingClient(null);
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" form="new-client-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    {editingClient ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </div>

              {/* Right side - Commentaires Sidebar - 30% */}
              <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex-shrink-0">
                  <h3 className="text-lg font-bold text-white">Commentaires</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CommentairesSectionClient
                    clientId={editingClient?.id}
                    clientTemporaire={!editingClient}
                    clientNom={editingClient ? `${editingClient.prenom} ${editingClient.nom}` : `${newClientForm.prenom} ${newClientForm.nom}`.trim() || "Nouveau client"}
                  />
                </div>
              </div>
            </div>
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

        {/* View Dossier Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Détails du dossier</DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="flex h-[90vh]">
                {/* Main content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Détails du dossier {getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}
                    </h2>
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
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <Label className="text-slate-400 text-sm">Utilisateur assigné</Label>
                        <p className="text-white font-medium mt-1">
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
                      {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.clients_ids.map(clientId => {
                              const client = getClientById(clientId);
                              return client ? (
                                <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-full justify-start">
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
                            {viewingDossier.notaires_ids.map(notaireId => {
                              const notaire = getClientById(notaireId);
                              return notaire ? (
                                <Badge key={notaireId} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border w-full justify-start">
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
                            {viewingDossier.courtiers_ids.map(courtierId => {
                              const courtier = getClientById(courtierId);
                              return courtier ? (
                                <Badge key={courtierId} className="bg-orange-500/20 text-orange-400 border-orange-500/30 border w-full justify-start">
                                  {courtier.prenom} {courtier.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
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
                  <div className="flex-1 overflow-hidden">
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


        {/* Stats compactes - Un seul encadré */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-600/20">
                <FileCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">Nouveaux mandats</CardTitle>
                <p className="text-sm text-slate-400">Statistique par période</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Aujourd'hui</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-white">{nouveauMandatStats.byDay}</p>
                  {nouveauMandatStats.percentages.day !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${nouveauMandatStats.percentages.day >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {nouveauMandatStats.percentages.day > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {nouveauMandatStats.percentages.day > 0 ? '+' : ''}{nouveauMandatStats.percentages.day}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Cette semaine</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="2xl font-bold text-white">{nouveauMandatStats.byWeek}</p>
                  {nouveauMandatStats.percentages.week !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${nouveauMandatStats.percentages.week >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {nouveauMandatStats.percentages.week > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {nouveauMandatStats.percentages.week > 0 ? '+' : ''}{nouveauMandatStats.percentages.week}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Ce mois</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="2xl font-bold text-white">{nouveauMandatStats.byMonth}</p>
                  {nouveauMandatStats.percentages.month !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${nouveauMandatStats.percentages.month >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {nouveauMandatStats.percentages.month > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {nouveauMandatStats.percentages.month > 0 ? '+' : ''}{nouveauMandatStats.percentages.month}%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Cette année</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="2xl font-bold text-white">{nouveauMandatStats.byYear}</p>
                  {nouveauMandatStats.percentages.year !== 0 && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${nouveauMandatStats.percentages.year >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {nouveauMandatStats.percentages.year > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {nouveauMandatStats.percentages.year > 0 ? '+' : ''}{nouveauMandatStats.percentages.year}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs and Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <Tabs defaultValue="nouveau-mandat" className="w-full">
            <CardHeader className="border-b border-slate-800 pb-0">
              <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-4 h-auto">
                <TabsTrigger
                  value="nouveau-mandat"
                  className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 py-3"
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Nouveaux mandats ({nouveauMandatDossiers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="soumission"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-3"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Mandats à ouvrir/Soumissions ({soumissionDossiers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="mandat-non-octroye"
                  className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 py-3"
                >
                  <X className="w-5 h-5 mr-2" />
                  Mandats non octroyés ({mandatNonOctroyeDossiers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="retour-appel"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-3"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Retours d'appel ({retourAppelDossiers.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-col gap-4 pt-4 pb-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

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

                  <Select value={filterUtilisateurAssigne} onValueChange={setFilterUtilisateurAssigne}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Utilisateur assigné" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les utilisateurs</SelectItem>
                      <SelectItem value="non-assigne" className="text-white">Non assigné</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.email} value={user.email} className="text-white">
                          {user.full_name}
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
                      <SelectItem value="Nouveau mandat/Demande d'information" className="text-white">Nouveau mandat/Demande d'information</SelectItem>
                      <SelectItem value="Soumission" className="text-white">Soumission / Mandats à ouvrir</SelectItem>
                      <SelectItem value="Mandat non octroyé" className="text-white">Mandat non octroyé</SelectItem>
                    </SelectContent>
                  </Select>

                  {(filterArpenteur !== "all" || filterStatut !== "all" || filterUtilisateurAssigne !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterArpenteur("all");
                        setFilterStatut("all");
                        setFilterUtilisateurAssigne("all");
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
                          onClick={() => handleSort('numero_dossier')}
                        >
                          Dossier {sortField === 'numero_dossier' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('created_date')}
                        >
                          Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('utilisateur_assigne')}
                        >
                          Utilisateur assigné {sortField === 'utilisateur_assigne' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRetourAppel.map((dossier) => (
                        <TableRow 
                          key={dossier.id} 
                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                          onClick={() => handleView(dossier)}
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                              {dossier.numero_dossier
                                ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`
                                : getArpenteurInitials(dossier.arpenteur_geometre).slice(0, -1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.created_date ? format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {dossier.utilisateur_assigne
                              ? (users.find(u => u.email === dossier.utilisateur_assigne)?.full_name || dossier.utilisateur_assigne)
                              : "-"}
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                          <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                            Aucun retour d'appel
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="nouveau-mandat" className="p-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('numero_dossier')}
                        >
                          Dossier {sortField === 'numero_dossier' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('created_date')}
                        >
                          Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedNouveauMandat.map((dossier) => (
                        <TableRow 
                          key={dossier.id} 
                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                          onClick={() => handleView(dossier)}
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                              {dossier.numero_dossier
                                ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`
                                : getArpenteurInitials(dossier.arpenteur_geometre).slice(0, -1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.created_date ? format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      {sortedNouveauMandat.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                            Aucun nouveau mandat
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="mandat-non-octroye" className="p-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('numero_dossier')}
                        >
                          Dossier {sortField === 'numero_dossier' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('created_date')}
                        >
                          Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMandatNonOctroye.map((dossier) => (
                        <TableRow 
                          key={dossier.id} 
                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                          onClick={() => handleView(dossier)}
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                              {dossier.numero_dossier
                                ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`
                                : getArpenteurInitials(dossier.arpenteur_geometre).slice(0, -1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.created_date ? format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                      {sortedMandatNonOctroye.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                            Aucun mandat non octroyé
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
                          onClick={() => handleSort('numero_dossier')}
                        >
                          Dossier {sortField === 'numero_dossier' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('created_date')}
                        >
                          Date {sortField === 'created_date' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSoumission.map((dossier) => (
                        <TableRow 
                          key={dossier.id} 
                          className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                          onClick={() => handleView(dossier)}
                        >
                          <TableCell className="font-medium">
                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                              {dossier.numero_dossier
                                ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`
                                : getArpenteurInitials(dossier.arpenteur_geometre).slice(0, -1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {dossier.created_date ? format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
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
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                          <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                            Aucune soumission ou mandat à ouvrir
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
