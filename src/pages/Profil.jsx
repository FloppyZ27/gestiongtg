import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Plus, ChevronLeft, ChevronRight, Edit, Cake, Trash2, X, Search, UserPlus, UserCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import EditDossierDialog from "../components/dossiers/EditDossierDialog";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

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

const CommentairesSection = ({ dossierId, dossierTemporaire }) => {
  return (
    <div className="p-4 space-y-4 text-slate-300">
      {dossierId ? (
        <>
          <p className="text-sm text-slate-400">Section des commentaires pour le dossier {dossierId}.</p>
          <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-md min-h-[100px] flex items-center justify-center text-slate-500">
            Aucun commentaire pour le moment.
          </div>
          <Textarea placeholder="Ajouter un nouveau commentaire..." className="bg-slate-800 border-slate-700" />
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 w-full">Ajouter un commentaire</Button>
        </>
      ) : (
        <p className="text-sm text-slate-500">Sélectionnez un dossier pour voir les commentaires.</p>
      )}
    </div>
  );
};


export default function Profil() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [editingRendezVous, setEditingRendezVous] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDossierDialogOpen, setIsEditingDossierDialogOpen] = useState(false);
  const [infoPersonnellesCollapsed, setInfoPersonnellesCollapsed] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // États pour les retours d'appel
  const [searchRetours, setSearchRetours] = useState("");
  const [filterArpenteurRetours, setFilterArpenteurRetours] = useState("all");
  const [filterVilleRetours, setFilterVilleRetours] = useState("all");
  const [filterMandatRetours, setFilterMandatRetours] = useState("all");
  const [sortFieldRetours, setSortFieldRetours] = useState(null);
  const [sortDirectionRetours, setSortDirectionRetours] = useState("asc");

  // États pour les mandats assignés
  const [searchMandats, setSearchMandats] = useState("");
  const [filterArpenteurMandats, setFilterArpenteurMandats] = useState("all");
  const [filterVilleMandats, setFilterVilleMandats] = useState("all");
  const [filterTypeMandats, setFilterTypeMandats] = useState("all");
  const [filterTacheMandats, setFilterTacheMandats] = useState("all");
  const [sortFieldMandats, setSortFieldMandats] = useState(null);
  const [sortDirectionMandats, setSortDirectionMandats] = useState("asc");

  // États pour les entrées de temps
  const [searchEntrees, setSearchEntrees] = useState("");
  const [filterArpenteurEntrees, setFilterArpenteurEntrees] = useState("all");
  const [filterMandatEntrees, setFilterMandatEntrees] = useState("all");
  const [filterTacheEntrees, setFilterTacheEntrees] = useState("all");
  const [sortFieldEntrees, setSortFieldEntrees] = useState(null);
  const [sortDirectionEntrees, setSortDirectionEntrees] = useState("asc");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: entreeTemps = [] } = useQuery({
    queryKey: ['entreeTemps', user?.email],
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 100),
    initialData: [],
    enabled: !!user,
  });

  const { data: rendezVous = [] } = useQuery({
    queryKey: ['rendezVous', user?.email],
    queryFn: () => base44.entities.RendezVous.filter({ utilisateur_email: user?.email }, '-date_debut'),
    initialData: [],
    enabled: !!user,
  });

  const [profileForm, setProfileForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    adresse: "",
    adresse_obj: null,
    poste: "",
    date_naissance: "",
    date_embauche: "",
  });

  const [rendezVousForm, setRendezVousForm] = useState({
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    type: "rendez-vous"
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        prenom: user.prenom || "",
        nom: user.nom || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        adresse_obj: user.adresse_obj || null,
        poste: user.poste || "",
        date_naissance: user.date_naissance || "",
        date_embauche: user.date_embauche || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditingProfile(false);
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du profil');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      // Using Base44 auth to change password
      return base44.auth.updateMe({ password: data.newPassword });
    },
    onSuccess: () => {
      alert('Mot de passe modifié avec succès');
      setIsChangingPassword(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.auth.updateMe({ photo_url: file_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setUploadingPhoto(false);
    },
  });

  const createRendezVousMutation = useMutation({
    mutationFn: (data) => base44.entities.RendezVous.create({ ...data, utilisateur_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous'] });
      setIsRendezVousDialogOpen(false);
      resetRendezVousForm();
    },
  });

  const updateRendezVousMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RendezVous.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous'] });
      setIsRendezVousDialogOpen(false);
      resetRendezVousForm();
    },
  });

  const deleteRendezVousMutation = useMutation({
    mutationFn: (id) => base44.entities.RendezVous.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous'] });
      setIsRendezVousDialogOpen(false);
      resetRendezVousForm();
    },
  });

  const deleteDossierMutation = useMutation({
    mutationFn: (id) => base44.entities.Dossier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingPhoto(true);
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ajuster la date d'anniversaire pour compenser le décalage de timezone
      let adjustedDateNaissance = profileForm.date_naissance;
      if (adjustedDateNaissance) {
        const date = new Date(adjustedDateNaissance);
        date.setDate(date.getDate() + 1);
        adjustedDateNaissance = date.toISOString().split('T')[0];
      }

      await updateProfileMutation.mutateAsync({
        prenom: profileForm.prenom,
        nom: profileForm.nom,
        date_naissance: adjustedDateNaissance,
        telephone: profileForm.telephone,
        adresse: profileForm.adresse
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
    }
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    
    setLoadingAddress(true);
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
      console.error('Erreur lors de la recherche d\'adresse:', error);
      setAddressSuggestions([]);
    } finally {
      setLoadingAddress(false);
    }
  };

  const selectAddress = (suggestion) => {
    const fullAddress = `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`.trim();
    setProfileForm({...profileForm, adresse: fullAddress});
    setAddressSuggestions([]);
  };

  const handleRendezVousSubmit = (e) => {
    e.preventDefault();
    if (editingRendezVous) {
      updateRendezVousMutation.mutate({ id: editingRendezVous.id, data: rendezVousForm });
    } else {
      createRendezVousMutation.mutate(rendezVousForm);
    }
  };

  const handleDeleteDossier = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
      deleteDossierMutation.mutate(id);
    }
  };

  const resetRendezVousForm = () => {
    setRendezVousForm({
      titre: "",
      description: "",
      date_debut: "",
      date_fin: "",
      type: "rendez-vous"
    });
    setEditingRendezVous(null);
  };

  const handleEditRendezVous = (rdv) => {
    setEditingRendezVous(rdv);
    setRendezVousForm({
      titre: rdv.titre,
      description: rdv.description || "",
      date_debut: rdv.date_debut,
      date_fin: rdv.date_fin || "",
      type: rdv.type
    });
    setIsRendezVousDialogOpen(true);
  };

  const handleEditDossier = (dossier) => {
    setEditingDossier(dossier);
    setIsEditingDossierDialogOpen(true);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

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

  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return "-";
    return formatAdresse(mandats[0].adresse_travaux);
  };

  const retoursAppel = dossiers
    .filter(d => d.statut === "Retour d'appel" && d.utilisateur_assigne === user?.email)
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const calculateSeniority = () => {
    if (!user?.date_embauche) return "N/A";
    const embaucheDate = new Date(user.date_embauche);
    const now = new Date();
    const years = now.getFullYear() - embaucheDate.getFullYear();
    const months = now.getMonth() - embaucheDate.getMonth();
    
    let totalMonths = years * 12 + months;
    if (totalMonths < 0) totalMonths = 0;
    
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    
    if (displayYears === 0 && displayMonths === 0) return "Moins d'un mois";
    if (displayYears === 0) return `${displayMonths} mois`;
    if (displayYears === 0 && displayMonths === 1) return `${displayMonths} mois`;
    if (displayMonths === 0) return `${displayYears} an${displayYears > 1 ? 's' : ''}`;
    return `${displayYears} an${displayYears > 1 ? 's' : ''} et ${displayMonths} mois`;
  };

  // Fonctions de tri pour retours d'appel
  const handleSortRetours = (field) => {
    if (sortFieldRetours === field) {
      setSortDirectionRetours(sortDirectionRetours === "asc" ? "desc" : "asc");
    } else {
      setSortFieldRetours(field);
      setSortDirectionRetours("asc");
    }
  };

  const getSortIconRetours = (field) => {
    if (sortFieldRetours !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    return sortDirectionRetours === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  // Fonctions de tri pour mandats
  const handleSortMandats = (field) => {
    if (sortFieldMandats === field) {
      setSortDirectionMandats(sortDirectionMandats === "asc" ? "desc" : "asc");
    } else {
      setSortFieldMandats(field);
      setSortDirectionMandats("asc");
    }
  };

  const getSortIconMandats = (field) => {
    if (sortFieldMandats !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    return sortDirectionMandats === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  // Fonctions de tri pour entrées de temps
  const handleSortEntrees = (field) => {
    if (sortFieldEntrees === field) {
      setSortDirectionEntrees(sortDirectionEntrees === "asc" ? "desc" : "asc");
    } else {
      setSortFieldEntrees(field);
      setSortDirectionEntrees("asc");
    }
  };

  const getSortIconEntrees = (field) => {
    if (sortFieldEntrees !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    return sortDirectionEntrees === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  // Extraire les villes et types de mandats uniques pour les filtres
  const uniqueVillesRetours = [...new Set(
    retoursAppel
      .flatMap(d => d.mandats?.map(m => m.adresse_travaux?.ville))
      .filter(ville => ville)
  )].sort();

  const mandatsAssignes = dossiers.flatMap(dossier => 
    (dossier.mandats || [])
      .filter(mandat => mandat.utilisateur_assigne === user?.email)
      .map((mandat, idx) => ({ dossier, mandat, key: `${dossier.id}-${idx}` }))
  );

  const uniqueVillesMandats = [...new Set(
    mandatsAssignes
      .map(item => item.mandat?.adresse_travaux?.ville)
      .filter(ville => ville)
  )].sort();

  const uniqueMandatsEntrees = [...new Set(
    entreeTemps
      .map(e => e.mandat)
      .filter(mandat => mandat)
  )].sort();


  // Filtrage et tri des retours d'appel
  const filteredAndSortedRetours = retoursAppel.filter(dossier => {
    const searchLower = searchRetours.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    const clientsNames = getClientsNames(dossier.clients_ids);
    
    const matchesSearch = (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      getFirstAdresseTravaux(dossier.mandats).toLowerCase().includes(searchLower)
    );

    const matchesArpenteur = filterArpenteurRetours === "all" || dossier.arpenteur_geometre === filterArpenteurRetours;
    const matchesVille = filterVilleRetours === "all" || dossier.mandats?.some(m => m.adresse_travaux?.ville === filterVilleRetours);
    const matchesMandat = filterMandatRetours === "all" || dossier.mandats?.some(m => m.type_mandat === filterMandatRetours);

    return matchesSearch && matchesArpenteur && matchesVille && matchesMandat;
  }).sort((a, b) => {
    if (!sortFieldRetours) return 0;

    let aValue, bValue;

    switch (sortFieldRetours) {
      case 'numero_dossier':
        aValue = (getArpenteurInitials(a.arpenteur_geometre) + a.numero_dossier).toLowerCase();
        bValue = (getArpenteurInitials(b.arpenteur_geometre) + b.numero_dossier).toLowerCase();
        break;
      case 'date':
        aValue = a.created_date ? new Date(a.created_date).getTime() : 0;
        bValue = b.created_date ? new Date(b.created_date).getTime() : 0;
        break;
      case 'clients':
        aValue = getClientsNames(a.clients_ids).toLowerCase();
        bValue = getClientsNames(b.clients_ids).toLowerCase();
        break;
      case 'adresse':
        aValue = getFirstAdresseTravaux(a.mandats).toLowerCase();
        bValue = getFirstAdresseTravaux(b.mandats).toLowerCase();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortDirectionRetours === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) return sortDirectionRetours === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirectionRetours === "asc" ? 1 : -1;
      return 0;
    }
  });

  // Filtrage et tri des mandats assignés
  const filteredAndSortedMandats = mandatsAssignes.filter(item => {
    const searchLower = searchMandats.toLowerCase();
    const fullNumber = getArpenteurInitials(item.dossier.arpenteur_geometre) + item.dossier.numero_dossier;
    const clientsNames = getClientsNames(item.dossier.clients_ids);

    const matchesSearch = (
      fullNumber.toLowerCase().includes(searchLower) ||
      item.dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      item.mandat.type_mandat?.toLowerCase().includes(searchLower) ||
      formatAdresse(item.mandat.adresse_travaux).toLowerCase().includes(searchLower)
    );

    const matchesArpenteur = filterArpenteurMandats === "all" || item.dossier.arpenteur_geometre === filterArpenteurMandats;
    const matchesVille = filterVilleMandats === "all" || item.mandat?.adresse_travaux?.ville === filterVilleMandats;
    const matchesType = filterTypeMandats === "all" || item.mandat.type_mandat === filterTypeMandats;
    const matchesTache = filterTacheMandats === "all" || item.mandat.tache_actuelle === filterTacheMandats;

    return matchesSearch && matchesArpenteur && matchesVille && matchesType && matchesTache;
  }).sort((a, b) => {
    if (!sortFieldMandats) return 0;

    let aValue, bValue;

    switch (sortFieldMandats) {
      case 'numero_dossier':
        aValue = (getArpenteurInitials(a.dossier.arpenteur_geometre) + a.dossier.numero_dossier).toLowerCase();
        bValue = (getArpenteurInitials(b.dossier.arpenteur_geometre) + b.dossier.numero_dossier).toLowerCase();
        break;
      case 'clients':
        aValue = getClientsNames(a.dossier.clients_ids).toLowerCase();
        bValue = getClientsNames(b.dossier.clients_ids).toLowerCase();
        break;
      case 'type_mandat':
        aValue = (a.mandat.type_mandat || '').toLowerCase();
        bValue = (b.mandat.type_mandat || '').toLowerCase();
        break;
      case 'tache':
        aValue = (a.mandat.tache_actuelle || '').toLowerCase();
        bValue = (b.mandat.tache_actuelle || '').toLowerCase();
        break;
      case 'adresse':
        aValue = formatAdresse(a.mandat.adresse_travaux).toLowerCase();
        bValue = formatAdresse(b.mandat.adresse_travaux).toLowerCase();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortDirectionMandats === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) return sortDirectionMandats === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirectionMandats === "asc" ? 1 : -1;
      return 0;
    }
  });

  // Filtrage et tri des entrées de temps
  const filteredAndSortedEntrees = entreeTemps.filter(entree => {
    const searchLower = searchEntrees.toLowerCase();
    const dossier = dossiers.find(d => d.id === entree.dossier_id);
    const fullNumber = dossier ? (getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier) : "";

    const matchesSearch = (
      fullNumber.toLowerCase().includes(searchLower) ||
      entree.mandat?.toLowerCase().includes(searchLower) ||
      entree.tache?.toLowerCase().includes(searchLower) ||
      entree.description?.toLowerCase().includes(searchLower)
    );

    const matchesArpenteur = filterArpenteurEntrees === "all" || (dossier && dossier.arpenteur_geometre === filterArpenteurEntrees);
    const matchesMandat = filterMandatEntrees === "all" || entree.mandat === filterMandatEntrees;
    const matchesTache = filterTacheEntrees === "all" || entree.tache === filterTacheEntrees;

    return matchesSearch && matchesArpenteur && matchesMandat && matchesTache;
  }).sort((a, b) => {
    if (!sortFieldEntrees) return 0;

    let aValue, bValue;
    const dossierA = dossiers.find(d => d.id === a.dossier_id);
    const dossierB = dossiers.find(d => d.id === b.dossier_id);

    switch (sortFieldEntrees) {
      case 'numero_dossier':
        aValue = dossierA ? (getArpenteurInitials(dossierA.arpenteur_geometre) + dossierA.numero_dossier).toLowerCase() : '';
        bValue = dossierB ? (getArpenteurInitials(dossierB.arpenteur_geometre) + dossierB.numero_dossier).toLowerCase() : '';
        break;
      case 'mandat':
        aValue = (a.mandat || '').toLowerCase();
        bValue = (b.mandat || '').toLowerCase();
        break;
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'heures':
        aValue = a.heures || 0;
        bValue = b.heures || 0;
        break;
      case 'tache':
        aValue = (a.tache || '').toLowerCase();
        bValue = (b.tache || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      return sortDirectionEntrees === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) return sortDirectionEntrees === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirectionEntrees === "asc" ? 1 : -1;
      return 0;
    }
  });

  const getHolidays = (year) => {
    return [
      { date: `${year}-01-01`, name: "Jour de l'an" },
      { date: `${year}-04-18`, name: "Vendredi saint" },
      { date: `${year}-05-19`, name: "Fête de la Reine" },
      { date: `${year}-06-24`, name: "Fête nationale du Québec" },
      { date: `${year}-07-01`, name: "Fête du Canada" },
      { date: `${year}-09-01`, name: "Fête du Travail" },
      { date: `${year}-10-13`, name: "Action de grâce" },
      { date: `${year}-12-25`, name: "Noël" },
      { date: `${year}-12-26`, name: "Lendemain de Noël" },
    ];
  };

  // Calendar logic
  let startDate, endDate, daysInView;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    startDate = startOfWeek(monthStart, { locale: fr });
    endDate = endOfWeek(monthEnd, { locale: fr });
    daysInView = eachDayOfInterval({ start: startDate, end: endDate });
  } else {
    startDate = startOfWeek(currentDate, { locale: fr });
    endDate = endOfWeek(currentDate, { locale: fr });
    daysInView = eachDayOfInterval({ start: startDate, end: endDate });
  }

  const getEventsForDay = (day) => {
    const events = rendezVous.filter(rdv => {
      const rdvDate = new Date(rdv.date_debut);
      return isSameDay(rdvDate, day);
    });

    const dayStr = format(day, 'yyyy-MM-dd');
    const currentYear = day.getFullYear();
    const holidays = getHolidays(currentYear);
    const holiday = holidays.find(h => h.date === dayStr);
    if (holiday) {
      events.push({
        id: `holiday-${dayStr}`,
        titre: holiday.name,
        type: 'holiday',
        date_debut: dayStr
      });
    }

    if (user?.date_naissance) {
      const birthDate = new Date(user.date_naissance);
      if (birthDate.getMonth() === day.getMonth() && birthDate.getDate() === day.getDate()) {
        events.push({
          id: `birthday-${user.email}`,
          titre: `🎂 Mon anniversaire`,
          type: 'birthday',
          date_debut: dayStr
        });
      }
    }

    return events;
  };

  const previousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'month') {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    } else {
      const weekStart = startOfWeek(currentDate, { locale: fr });
      const weekEnd = endOfWeek(currentDate, { locale: fr });
      return `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Mon Profil
          </h1>
          <UserCircle className="w-8 h-8 text-emerald-400" />
        </div>

        {/* Personal Information Card */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <div 
            className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-2 px-3 bg-blue-900/20 border-b border-slate-800"
            onClick={() => setInfoPersonnellesCollapsed(!infoPersonnellesCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-400" />
                </div>
                <h3 className="text-blue-300 text-sm font-semibold">Informations personnelles</h3>
              </div>
              {infoPersonnellesCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {!infoPersonnellesCollapsed && (
            <CardContent className="p-6">
              <div className="flex gap-6 items-start">
                {/* Photo le plus à gauche */}
                <div className="flex flex-col items-start gap-3 flex-shrink-0">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-emerald-500/50">
                      <AvatarImage src={user?.photo_url} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-emerald-500 to-teal-500">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors shadow-lg">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                  {uploadingPhoto && (
                    <p className="text-xs text-slate-400">Téléchargement...</p>
                  )}
                </div>

                {/* Information grid - 2 lignes de 4 champs */}
                <div className="flex-1 space-y-3">
                  {/* Ligne 1: Nom complet, Courriel, Téléphone, Adresse civique */}
                  <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                    <div>
                      <Label className="text-slate-400 text-xs">Nom complet</Label>
                      <p className="text-white font-medium text-sm">{user?.prenom && user?.nom ? `${user.prenom} ${user.nom}` : (user?.prenom || user?.nom || "-")}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Adresse courriel</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{user?.email}</span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Téléphone</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {user?.telephone || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Adresse civique</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{user?.adresse || "-"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Ligne 2: Date anniversaire, Date embauche, Poste, Rôle */}
                  <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                    <div>
                      <Label className="text-slate-400 text-xs">Date d'anniversaire</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-1">
                        <Cake className="w-3 h-3 text-slate-500" />
                        {user?.date_naissance ? format(new Date(user.date_naissance), "dd MMM yyyy", { locale: fr }) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Date d'embauche</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        {user?.date_embauche ? format(new Date(user.date_embauche), "dd MMM yyyy", { locale: fr }) : "-"}
                        {user?.date_embauche && <span className="text-slate-400 text-xs">({calculateSeniority()})</span>}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Poste</Label>
                      <p className="text-white font-medium text-sm">{user?.poste || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Rôle</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 uppercase">
                          {user?.role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Boutons en dessous */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier le Profil
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Modifier Mot de Passe
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tabs pour les 3 tableaux */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <Tabs defaultValue="retours-appel" className="w-full">
            <CardHeader className="border-b border-slate-800 pb-0">
              <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-3 h-auto">
                <TabsTrigger
                  value="retours-appel"
                  className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-3"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Retours d'appel ({filteredAndSortedRetours.length})
                </TabsTrigger>
                <TabsTrigger
                  value="mandats-assignes"
                  className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-3"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Mandats assignés ({filteredAndSortedMandats.length})
                </TabsTrigger>
                <TabsTrigger
                  value="entrees-temps"
                  className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-3"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Entrées de temps ({filteredAndSortedEntrees.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="retours-appel" className="p-0">
              <div className="p-4 border-b border-slate-800">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchRetours}
                      onChange={(e) => setSearchRetours(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <Select value={filterArpenteurRetours} onValueChange={setFilterArpenteurRetours}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Arpenteur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                      {ARPENTEURS.map(arp => (
                        <SelectItem key={arp} value={arp} className="text-white">{arp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterVilleRetours} onValueChange={setFilterVilleRetours}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Ville" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Toutes les villes</SelectItem>
                      {uniqueVillesRetours.map(ville => (
                        <SelectItem key={ville} value={ville} className="text-white">{ville}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterMandatRetours} onValueChange={setFilterMandatRetours}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Mandat" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les mandats</SelectItem>
                      {TYPES_MANDATS.map(type => (
                        <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchRetours || filterArpenteurRetours !== "all" || filterVilleRetours !== "all" || filterMandatRetours !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchRetours("");
                        setFilterArpenteurRetours("all");
                        setFilterVilleRetours("all");
                        setFilterMandatRetours("all");
                      }}
                      className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
                      <TableRow className="hover:bg-slate-800/95 border-slate-700">
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortRetours('numero_dossier')}
                        >
                          Dossier {getSortIconRetours('numero_dossier')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortRetours('date')}
                        >
                          Date {getSortIconRetours('date')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortRetours('clients')}
                        >
                          Clients {getSortIconRetours('clients')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortRetours('adresse')}
                        >
                          Adresse travaux {getSortIconRetours('adresse')}
                        </TableHead>
                        <TableHead className="text-slate-300">Mandat</TableHead>
                        <TableHead className="text-slate-300">Statut</TableHead> {/* Added Statut column */}
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedRetours.map((dossier) => (
                        <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800">
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
                          <TableCell> {/* New Statut Cell */}
                            <Badge variant="outline" className={`border ${
                              dossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              dossier.statut === 'Fermé' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            }`}>
                              {dossier.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditDossier(dossier)}
                                className="gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDossier(dossier.id)}
                                className="gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAndSortedRetours.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500"> {/* Updated colSpan from 6 to 7 */}
                            Aucun retour d'appel trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="mandats-assignes" className="p-0">
              <div className="p-4 border-b border-slate-800">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchMandats}
                      onChange={(e) => setSearchMandats(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <Select value={filterArpenteurMandats} onValueChange={setFilterArpenteurMandats}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Arpenteur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                      {ARPENTEURS.map(arp => (
                        <SelectItem key={arp} value={arp} className="text-white">{arp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterVilleMandats} onValueChange={setFilterVilleMandats}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Ville" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Toutes les villes</SelectItem>
                      {uniqueVillesMandats.map(ville => (
                        <SelectItem key={ville} value={ville} className="text-white">{ville}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterTypeMandats} onValueChange={setFilterTypeMandats}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Type mandat" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                      {TYPES_MANDATS.map(type => (
                        <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterTacheMandats} onValueChange={setFilterTacheMandats}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Tâche" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Toutes les tâches</SelectItem>
                      {TACHES.map(tache => (
                        <SelectItem key={tache} value={tache} className="text-white">{tache}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchMandats || filterArpenteurMandats !== "all" || filterVilleMandats !== "all" || filterTypeMandats !== "all" || filterTacheMandats !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchMandats("");
                        setFilterArpenteurMandats("all");
                        setFilterVilleMandats("all");
                        setFilterTypeMandats("all");
                        setFilterTacheMandats("all");
                      }}
                      className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
                      <TableRow className="hover:bg-slate-800/95 border-slate-700">
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortMandats('numero_dossier')}
                        >
                          Dossier {getSortIconMandats('numero_dossier')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortMandats('clients')}
                        >
                          Clients {getSortIconMandats('clients')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortMandats('type_mandat')}
                        >
                          Type de mandat {getSortIconMandats('type_mandat')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortMandats('tache')}
                        >
                          Tâche assignée {getSortIconMandats('tache')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortMandats('adresse')}
                        >
                          Adresse travaux {getSortIconMandats('adresse')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedMandats.map((item) => (
                        <TableRow key={item.key} className="hover:bg-slate-800/30 border-slate-800">
                          <TableCell className="font-medium">
                            <Badge variant="outline" className={`${getArpenteurColor(item.dossier.arpenteur_geometre)} border`}>
                              {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {getClientsNames(item.dossier.clients_ids)}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                              {item.mandat.type_mandat}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                              {item.mandat.tache_actuelle || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                            {formatAdresse(item.mandat.adresse_travaux) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAndSortedMandats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                            Aucun mandat trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="entrees-temps" className="p-0">
              <div className="p-4 border-b border-slate-800">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchEntrees}
                      onChange={(e) => setSearchEntrees(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <Select value={filterArpenteurEntrees} onValueChange={setFilterArpenteurEntrees}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Arpenteur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                      {ARPENTEURS.map(arp => (
                        <SelectItem key={arp} value={arp} className="text-white">{arp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterMandatEntrees} onValueChange={setFilterMandatEntrees}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Mandat" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les mandats</SelectItem>
                      {uniqueMandatsEntrees.map(mandat => (
                        <SelectItem key={mandat} value={mandat} className="text-white">{mandat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterTacheEntrees} onValueChange={setFilterTacheEntrees}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Tâche" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Toutes les tâches</SelectItem>
                      {TACHES.map(tache => (
                        <SelectItem key={tache} value={tache} className="text-white">{tache}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchEntrees || filterArpenteurEntrees !== "all" || filterMandatEntrees !== "all" || filterTacheEntrees !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchEntrees("");
                        setFilterArpenteurEntrees("all");
                        setFilterMandatEntrees("all");
                        setFilterTacheEntrees("all");
                      }}
                      className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
                      <TableRow className="hover:bg-slate-800/95 border-slate-700">
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortEntrees('numero_dossier')}
                        >
                          Dossier {getSortIconEntrees('numero_dossier')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortEntrees('mandat')}
                        >
                          Mandat {getSortIconEntrees('mandat')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortEntrees('date')}
                        >
                          Date {getSortIconEntrees('date')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortEntrees('heures')}
                        >
                          Heures {getSortIconEntrees('heures')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSortEntrees('tache')}
                        >
                          Tâche {getSortIconEntrees('tache')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedEntrees.map((entree) => {
                        const dossier = dossiers.find(d => d.id === entree.dossier_id);
                        return (
                          <TableRow key={entree.id} className="hover:bg-slate-800/30 border-slate-800">
                            <TableCell className="font-medium">
                              {dossier ? (
                                <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                  {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                </Badge>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm">
                              {entree.mandat ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                  {entree.mandat}
                                </Badge>
                              ) : (
                                <span className="text-slate-600 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {format(new Date(entree.date), "dd MMM yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell className="text-emerald-400 font-semibold">
                              {entree.heures}h
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                                {entree.tache}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredAndSortedEntrees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                            Aucune entrée de temps trouvée
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

        {/* Change Password Dialog */}
        <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier le mot de passe</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Mot de passe actuel</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nouveau mot de passe</Label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Confirmer le mot de passe</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsChangingPassword(false)} 
                  disabled={changePasswordMutation.isPending}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600" 
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? 'Modification...' : 'Modifier'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier mon profil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={profileForm.prenom}
                    onChange={(e) => setProfileForm({...profileForm, prenom: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={profileForm.nom}
                    onChange={(e) => setProfileForm({...profileForm, nom: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input
                    type="date"
                    value={profileForm.date_naissance}
                    onChange={(e) => setProfileForm({...profileForm, date_naissance: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={profileForm.telephone}
                    onChange={(e) => setProfileForm({...profileForm, telephone: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-2 relative">
                <Label>Adresse</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4 z-10" />
                  <Input
                    value={profileForm.adresse}
                    onChange={(e) => {
                      setProfileForm({...profileForm, adresse: e.target.value});
                      searchAddress(e.target.value);
                    }}
                    placeholder="Rechercher une adresse..."
                    className="bg-slate-800 border-slate-700 pl-10"
                  />
                  {loadingAddress && (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {addressSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectAddress(suggestion)}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm text-slate-300 flex items-center gap-2 border-b border-slate-700 last:border-b-0"
                      >
                        <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)} disabled={updateProfileMutation.isPending}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dossier Dialog */}
        <EditDossierDialog
          isOpen={isEditingDossierDialogOpen}
          onClose={() => {
            setIsEditingDossierDialogOpen(false);
            setEditingDossier(null);
          }}
          dossier={editingDossier}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['dossiers'] });
          }}
          clients={clients}
          users={users}
        />
      </div>
    </div>
  );
}