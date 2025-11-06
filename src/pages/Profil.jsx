
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
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Plus, ChevronLeft, ChevronRight, Edit, Cake, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
// import AddressInput from "../components/shared/AddressInput"; // AddressInput is no longer directly used in the dialog, removed if not used elsewhere

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

// Placeholder component for CommentairesSection
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
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [editingRendezVous, setEditingRendezVous] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDossierDialogOpen, setIsEditingDossierDialogOpen] = useState(false);

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
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 20),
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
    full_name: "",
    telephone: "",
    adresse: "",
    poste: "",
    date_naissance: "",
  });

  const [rendezVousForm, setRendezVousForm] = useState({
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    type: "rendez-vous"
  });

  const [dossierForm, setDossierForm] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: "",
    statut: "Ouvert",
    utilisateur_assigne: "",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    description: ""
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        poste: user.poste || "",
        date_naissance: user.date_naissance || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditingProfile(false);
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

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dossier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      setIsEditingDossierDialogOpen(false);
      setEditingDossier(null);
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingPhoto(true);
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
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
    setDossierForm({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || "",
      statut: dossier.statut || "Ouvert",
      utilisateur_assigne: dossier.utilisateur_assigne || "",
      clients_ids: dossier.clients_ids || [],
      notaires_ids: dossier.notaires_ids || [],
      courtiers_ids: dossier.courtiers_ids || [],
      mandats: dossier.mandats && dossier.mandats.length > 0 ? dossier.mandats.map(m => ({
        ...m,
        adresse_travaux: m.adresse_travaux || {
          ville: "",
          numeros_civiques: [""],
          rue: "",
          code_postal: "",
          province: "Québec"
        },
        date_debut_travaux: m.date_debut_travaux || "", // New field
        rabais: m.rabais !== undefined ? m.rabais : 0, // New field, ensure 0 for existing
        lots: m.lots || [],
      })) : [{ // Ensure at least one empty mandat for new dossiers or if mandats array is empty
        type_mandat: "",
        date_ouverture: "",
        adresse_travaux: {
          ville: "",
          numeros_civiques: [""],
          rue: "",
          code_postal: "",
          province: "Québec"
        },
        lots: [],
        prix_estime: 0,
        date_signature: "",
        date_livraison: "",
        date_debut_travaux: "", // New field
        rabais: 0, // New field
        notes: ""
      }],
      description: dossier.description || ""
    });
    setIsEditingDossierDialogOpen(true);
  };

  const handleSaveDossier = (e) => {
    e.preventDefault(); // Prevent default form submission if triggered by button
    if (editingDossier) {
      // Filter out mandats that are completely empty if needed, or let backend handle validation
      const cleanedMandats = dossierForm.mandats.filter(mandat =>
        mandat.type_mandat ||
        mandat.prix_estime ||
        mandat.rabais || // Include new field
        mandat.date_ouverture ||
        mandat.date_signature ||
        mandat.date_livraison ||
        mandat.date_debut_travaux || // Include new field
        (mandat.adresse_travaux && (mandat.adresse_travaux.rue || mandat.adresse_travaux.ville || mandat.adresse_travaux.code_postal || (mandat.adresse_travaux.numeros_civiques && mandat.adresse_travaux.numeros_civiques.some(n => n)))) || // Check for civic numbers too
        (mandat.lots && mandat.lots.length > 0) ||
        mandat.notes
      );

      updateDossierMutation.mutate({
        id: editingDossier.id,
        data: { ...dossierForm, mandats: cleanedMandats }
      });
    }
  };

  const updateMandat = (index, field, value) => {
    const updatedMandats = [...dossierForm.mandats];
    updatedMandats[index] = {
      ...updatedMandats[index],
      [field]: value
    };
    setDossierForm({...dossierForm, mandats: updatedMandats});
  };

  // Removed updateMandatAddress as AddressInput is no longer used for the dialog.

  const addMandat = () => {
    setDossierForm({
      ...dossierForm,
      mandats: [...dossierForm.mandats, {
        type_mandat: "",
        date_ouverture: "",
        adresse_travaux: {
          ville: "",
          numeros_civiques: [""],
          rue: "",
          code_postal: "",
          province: "Québec"
        },
        lots: [],
        prix_estime: 0,
        date_signature: "",
        date_livraison: "",
        date_debut_travaux: "", // New field
        rabais: 0, // New field
        notes: ""
      }]
    });
  };

  const removeMandat = (index) => {
    const updatedMandats = dossierForm.mandats.filter((_, i) => i !== index);
    setDossierForm({...dossierForm, mandats: updatedMandats});
  };

  const notaires = clients.filter(c => c.type_client === "Notaire");
  const courtiers = clients.filter(c => c.type_client === "Courtier immobilier");
  const clientsOnly = clients.filter(c => c.type_client === "Client");

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

  const retoursAppel = dossiers.filter(d => d.statut === "Retour d'appel" && d.utilisateur_assigne === user?.email);

  const calculateSeniority = () => {
    if (!user?.created_date) return "N/A";
    const createdDate = new Date(user.created_date);
    const now = new Date();
    const years = now.getFullYear() - createdDate.getFullYear();
    const months = now.getMonth() - createdDate.getMonth();
    
    let totalMonths = years * 12 + months;
    if (totalMonths < 0) totalMonths = 0;
    
    const displayYears = Math.floor(totalMonths / 12);
    const displayMonths = totalMonths % 12;
    
    if (displayYears === 0 && displayMonths === 0) return "Moins d'un mois";
    if (displayYears === 0) return `${displayMonths} mois`;
    if (displayYears === 0 && displayMonths === 1) return `${displayMonths} mois`; // Handle singular month correctly
    if (displayMonths === 0) return `${displayYears} an${displayYears > 1 ? 's' : ''}`;
    return `${displayYears} an${displayYears > 1 ? 's' : ''} et ${displayMonths} mois`;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Mon Profil
            </h1>
            <p className="text-slate-400">Votre espace personnel</p>
          </div>
        </div>

        {/* Personal Information Card */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Photo avec bouton en dessous */}
              <div className="flex flex-col items-center gap-3">
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
                <Button
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>

              {/* Information grid - 3 lignes */}
              <div className="flex-1 space-y-3">
                {/* Ligne 1: Nom, Courriel, Poste */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                  <div>
                    <Label className="text-slate-400 text-xs">Nom complet</Label>
                    <p className="text-white font-medium text-sm">{user?.full_name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Adresse courriel</Label>
                    <p className="text-white font-medium text-sm flex items-center gap-2">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{user?.email}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Poste</Label>
                    <p className="text-white font-medium text-sm">{user?.poste || "-"}</p>
                  </div>
                </div>

                {/* Ligne 2: Adresse, Téléphone, Date anniversaire */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                  <div>
                    <Label className="text-slate-400 text-xs">Adresse</Label>
                    <p className="text-white font-medium text-sm flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="truncate">{user?.adresse || "-"}</span>
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
                    <Label className="text-slate-400 text-xs">Date d'anniversaire</Label>
                    <p className="text-white font-medium text-sm flex items-center gap-1">
                      <Cake className="w-3 h-3 text-slate-500" />
                      {user?.date_naissance ? format(new Date(user.date_naissance), "dd MMM yyyy", { locale: fr }) : "-"}
                    </p>
                  </div>
                </div>

                {/* Ligne 3: Ancienneté et Rôle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                  <div>
                    <Label className="text-slate-400 text-xs">Ancienneté</Label>
                    <p className="text-white font-medium text-sm flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      {user?.created_date ? format(new Date(user.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
                      {user?.created_date && <span className="text-slate-400">({calculateSeniority()})</span>}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-xs">Rôle</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retours d'appel assignés */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-white flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-400" />
              Mes retours d'appel ({retoursAppel.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
                  <TableRow className="hover:bg-slate-800/95 border-slate-700">
                    <TableHead className="text-slate-300">Dossier</TableHead>
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Clients</TableHead>
                    <TableHead className="text-slate-300">Adresse travaux</TableHead>
                    <TableHead className="text-slate-300">Mandat</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retoursAppel.slice(0, 8).map((dossier) => (
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
                  {retoursAppel.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Aucun retour d'appel assigné
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entrées de temps */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Mes entrées de temps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
                    <TableRow className="hover:bg-slate-800/95 border-slate-700">
                      <TableHead className="text-slate-300">Dossier</TableHead>
                      <TableHead className="text-slate-300">Mandat</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Heures</TableHead>
                      <TableHead className="text-slate-300">Tâche</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entreeTemps.map((entree) => {
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
                            {entree.mandat || "-"}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(entree.date), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell className="text-emerald-400 font-semibold">
                            {entree.heures}h
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                              {entree.tache}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {entreeTemps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                          Aucune entrée de temps
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  Mon calendrier
                </CardTitle>
                <div className="flex gap-2">
                  <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'month' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('month')}
                      className={viewMode === 'month' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-slate-400'}
                    >
                      Mois
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'week' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('week')}
                      className={viewMode === 'week' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-slate-400'}
                    >
                      Semaine
                    </Button>
                  </div>
                  <Dialog open={isRendezVousDialogOpen} onOpenChange={(open) => {
                    setIsRendezVousDialogOpen(open);
                    if (!open) resetRendezVousForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                        RDV/Absence
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white">
                      <DialogHeader>
                        <DialogTitle>{editingRendezVous ? "Modifier" : "Nouveau rendez-vous"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRendezVousSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Titre <span className="text-red-400">*</span></Label>
                          <Input
                            value={rendezVousForm.titre}
                            onChange={(e) => setRendezVousForm({...rendezVousForm, titre: e.target.value})}
                            required
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select
                            value={rendezVousForm.type}
                            onChange={(e) => setRendezVousForm({...rendezVousForm, type: e.target.value})}
                            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                          >
                            <option value="rendez-vous">Rendez-vous</option>
                            <option value="absence">Absence</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date début <span className="text-red-400">*</span></Label>
                            <Input
                              type="datetime-local"
                              value={rendezVousForm.date_debut}
                              onChange={(e) => setRendezVousForm({...rendezVousForm, date_debut: e.target.value})}
                              required
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date fin</Label>
                            <Input
                              type="datetime-local"
                              value={rendezVousForm.date_fin}
                              onChange={(e) => setRendezVousForm({...rendezVousForm, date_fin: e.target.value})}
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={rendezVousForm.description}
                            onChange={(e) => setRendezVousForm({...rendezVousForm, description: e.target.value})}
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          {editingRendezVous && (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => deleteRendezVousMutation.mutate(editingRendezVous.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </Button>
                          )}
                          <Button type="button" variant="outline" onClick={() => {
                            setIsRendezVousDialogOpen(false);
                            resetRendezVousForm();
                          }}>
                            Annuler
                          </Button>
                          <Button type="submit" className="bg-emerald-500">
                            {editingRendezVous ? "Modifier" : "Créer"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousPeriod}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="text-lg font-semibold text-white">
                  {getPeriodLabel()}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPeriod}
                  className="text-slate-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-500 p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {daysInView.map((day, index) => {
                  const events = getEventsForDay(day);
                  const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true;
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={index}
                      className={`
                        ${viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[80px]'} p-2 rounded-lg border transition-colors
                        ${isCurrentMonth ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/30 border-slate-800'}
                        ${isToday ? 'border-emerald-500 border-2' : ''}
                      `}
                    >
                      <div className={`text-sm mb-1 font-semibold ${isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {events.map(event => (
                          <div
                            key={event.id}
                            onClick={() => event.type !== 'holiday' && event.type !== 'birthday' && handleEditRendezVous(event)}
                            className={`
                              text-xs p-1 rounded truncate
                              ${event.type === 'absence'
                                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer'
                                : event.type === 'holiday'
                                ? 'bg-blue-500/20 text-blue-400 cursor-default'
                                : event.type === 'birthday'
                                ? 'bg-purple-500/20 text-purple-400 cursor-default'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer'
                              }
                            `}
                            title={event.titre}
                          >
                            {event.titre}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier mon profil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Poste</Label>
                <Input
                  value={profileForm.poste}
                  onChange={(e) => setProfileForm({...profileForm, poste: e.target.value})}
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
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={profileForm.adresse}
                  onChange={(e) => setProfileForm({...profileForm, adresse: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  Enregistrer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dossier Dialog */}
        <Dialog open={isEditingDossierDialogOpen} onOpenChange={setIsEditingDossierDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Modifier le dossier</DialogTitle>
            </DialogHeader>

            <div className="flex h-[90vh]">
              {/* Main form content - 70% */}
              <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white">Modifier le dossier</h2>
                </div>

                <form id="dossier-form-edit" onSubmit={handleSaveDossier} className="space-y-6">
                  {/* Première ligne: Arpenteur et Statut */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                      <select
                        value={dossierForm.arpenteur_geometre}
                        onChange={(e) => setDossierForm({...dossierForm, arpenteur_geometre: e.target.value})}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un arpenteur</option>
                        <option value="Samuel Guay">Samuel Guay</option>
                        <option value="Dany Gaboury">Dany Gaboury</option>
                        <option value="Pierre-Luc Pilote">Pierre-Luc Pilote</option>
                        <option value="Benjamin Larouche">Benjamin Larouche</option>
                        <option value="Frédéric Gilbert">Frédéric Gilbert</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut <span className="text-red-400">*</span></Label>
                      <select
                        value={dossierForm.statut}
                        onChange={(e) => setDossierForm({...dossierForm, statut: e.target.value})}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="Retour d'appel">Retour d'appel</option>
                        <option value="Soumission">Soumission</option>
                        <option value="Ouvert">Ouvert</option>
                        <option value="Fermé">Fermé</option>
                        <option value="Message laissé/Sans réponse">Message laissé/Sans réponse</option>
                        <option value="Demande d'information">Demande d'information</option>
                        <option value="Nouveau mandat">Nouveau mandat</option>
                      </select>
                    </div>
                  </div>

                  {/* Utilisateur assigné */}
                  {dossierForm.statut === "Retour d'appel" && (
                    <div className="space-y-2">
                      <Label>Utilisateur assigné</Label>
                      <select
                        value={dossierForm.utilisateur_assigne}
                        onChange={(e) => setDossierForm({...dossierForm, utilisateur_assigne: e.target.value})}
                        className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner un utilisateur</option>
                        {users.map((u) => (
                          <option key={u.email} value={u.email}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Clients, Notaires et Courtiers - 3 colonnes */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Clients */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Clients</Label>
                        {/* The outline removed the client select input, but kept the add button. I'm putting the select back for functionality */}
                        <select
                          onChange={(e) => {
                            if (e.target.value && !dossierForm.clients_ids.includes(e.target.value)) {
                              setDossierForm({
                                ...dossierForm,
                                clients_ids: [...dossierForm.clients_ids, e.target.value]
                              });
                            }
                            e.target.value = "";
                          }}
                          value="" // Set value to empty string to allow re-selecting the same option (if it were re-added to list)
                          className="w-fit p-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-md text-sm cursor-pointer"
                        >
                          <option value="">+ Ajouter</option>
                          {clientsOnly
                            .filter(c => !dossierForm.clients_ids.includes(c.id))
                            .map(client => (
                              <option key={client.id} value={client.id}>
                                {client.prenom} {client.nom}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      {dossierForm.clients_ids.length > 0 ? (
                        <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                          {dossierForm.clients_ids.map(clientId => {
                            const client = clientsOnly.find(c => c.id === clientId);
                            return client ? (
                              <Badge
                                key={clientId}
                                variant="outline"
                                className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30 relative pr-8 w-full justify-start"
                              >
                                <span className="flex-1">
                                  {client.prenom} {client.nom}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setDossierForm({
                                    ...dossierForm,
                                    clients_ids: dossierForm.clients_ids.filter(cid => cid !== clientId)
                                  })}
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
                        {/* The outline removed the notaire select input, but kept the add button. I'm putting the select back for functionality */}
                        <select
                          onChange={(e) => {
                            if (e.target.value && !dossierForm.notaires_ids.includes(e.target.value)) {
                              setDossierForm({
                                ...dossierForm,
                                notaires_ids: [...dossierForm.notaires_ids, e.target.value]
                              });
                            }
                            e.target.value = "";
                          }}
                          value=""
                          className="w-fit p-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-md text-sm cursor-pointer"
                        >
                          <option value="">+ Ajouter</option>
                          {notaires
                            .filter(n => !dossierForm.notaires_ids.includes(n.id))
                            .map(notaire => (
                              <option key={notaire.id} value={notaire.id}>
                                {notaire.prenom} {notaire.nom}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      {dossierForm.notaires_ids.length > 0 ? (
                        <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                          {dossierForm.notaires_ids.map(notaireId => {
                            const notaire = notaires.find(n => n.id === notaireId);
                            return notaire ? (
                              <Badge
                                key={notaireId}
                                variant="outline"
                                className="bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 relative pr-8 w-full justify-start"
                              >
                                <span className="flex-1">
                                  {notaire.prenom} {notaire.nom}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setDossierForm({
                                    ...dossierForm,
                                    notaires_ids: dossierForm.notaires_ids.filter(nid => nid !== notaireId)
                                  })}
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
                        {/* The outline removed the courtier select input, but kept the add button. I'm putting the select back for functionality */}
                        <select
                          onChange={(e) => {
                            if (e.target.value && !dossierForm.courtiers_ids.includes(e.target.value)) {
                              setDossierForm({
                                ...dossierForm,
                                courtiers_ids: [...dossierForm.courtiers_ids, e.target.value]
                              });
                            }
                            e.target.value = "";
                          }}
                          value=""
                          className="w-fit p-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-md text-sm cursor-pointer"
                        >
                          <option value="">+ Ajouter</option>
                          {courtiers
                            .filter(c => !dossierForm.courtiers_ids.includes(c.id))
                            .map(courtier => (
                              <option key={courtier.id} value={courtier.id}>
                                {courtier.prenom} {courtier.nom}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      {dossierForm.courtiers_ids.length > 0 ? (
                        <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                          {dossierForm.courtiers_ids.map(courtierId => {
                            const courtier = courtiers.find(c => c.id === courtierId);
                            return courtier ? (
                              <Badge
                                key={courtierId}
                                variant="outline"
                                className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-pointer hover:bg-orange-500/30 relative pr-8 w-full justify-start"
                              >
                                <span className="flex-1">
                                  {courtier.prenom} {courtier.nom}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setDossierForm({
                                    ...dossierForm,
                                    courtiers_ids: dossierForm.courtiers_ids.filter(cid => cid !== courtierId)
                                  })}
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

                  {/* Mandats Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xl font-semibold text-white">Mandats</Label>
                      <Button
                        type="button"
                        onClick={addMandat}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter un mandat
                      </Button>
                    </div>

                    {dossierForm.mandats.map((mandat, index) => (
                      <div key={index} className="border-2 border-slate-700 bg-slate-800/30 rounded-lg overflow-hidden">
                        {/* Mandat header */}
                        <div className="bg-emerald-500/10 border-b border-emerald-500/30 p-4">
                          <div className="flex justify-between items-center">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-base px-3 py-1">
                              {mandat.type_mandat || `Mandat ${index + 1}`}
                            </Badge>
                            {dossierForm.mandats.length > 0 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMandat(index)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer ce mandat
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Type de mandat */}
                          <div className="space-y-2">
                            <Label>Type de mandat <span className="text-red-400">*</span></Label>
                            <select
                              value={mandat.type_mandat}
                              onChange={(e) => updateMandat(index, 'type_mandat', e.target.value)}
                              className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            >
                              <option value="">Sélectionner</option>
                              <option value="Certificat de localisation">Certificat de localisation</option>
                              <option value="Implantation">Implantation</option>
                              <option value="Piquetage">Piquetage</option>
                              <option value="OCTR">OCTR</option>
                              <option value="Projet de lotissement">Projet de lotissement</option>
                            </select>
                          </div>

                          {/* Nouvelle mise en page : 70% gauche / 30% droite */}
                          <div className="grid grid-cols-[70%_30%] gap-4">
                            {/* Colonne gauche - Adresse */}
                            <div className="space-y-3">
                              <Label className="text-slate-300">Adresse des travaux</Label>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-slate-300 text-sm">Numéro(s) civique(s)</Label>
                                  {(mandat.adresse_travaux?.numeros_civiques || [""]).map((num, civicIdx) => (
                                    <div key={civicIdx} className="flex gap-2 items-center">
                                      <Input
                                        value={num}
                                        onChange={(e) => {
                                          const updated = [...dossierForm.mandats];
                                          const civics = updated[index].adresse_travaux?.numeros_civiques || [""];
                                          civics[civicIdx] = e.target.value;
                                          updated[index] = {
                                            ...updated[index],
                                            adresse_travaux: {
                                              ...updated[index].adresse_travaux,
                                              numeros_civiques: civics
                                            }
                                          };
                                          setDossierForm({...dossierForm, mandats: updated});
                                        }}
                                        placeholder="Ex: 1850"
                                        className="bg-slate-700 border-slate-600 text-white"
                                      />
                                      {civicIdx > 0 && (
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => {
                                            const updated = [...dossierForm.mandats];
                                            const civics = updated[index].adresse_travaux?.numeros_civiques || [""];
                                            civics.splice(civicIdx, 1);
                                            updated[index] = {
                                              ...updated[index],
                                              adresse_travaux: {
                                                ...updated[index].adresse_travaux,
                                                numeros_civiques: civics
                                              }
                                            };
                                            setDossierForm({...dossierForm, mandats: updated});
                                          }}
                                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      const updated = [...dossierForm.mandats];
                                      const civics = updated[index].adresse_travaux?.numeros_civiques || [""];
                                      updated[index] = {
                                        ...updated[index],
                                        adresse_travaux: {
                                          ...updated[index].adresse_travaux,
                                          numeros_civiques: [...civics, ""]
                                        }
                                      };
                                      setDossierForm({...dossierForm, mandats: updated});
                                    }}
                                    className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Ajouter un numéro
                                  </Button>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-slate-300 text-sm">Rue</Label>
                                  <Input
                                    value={mandat.adresse_travaux?.rue || ""}
                                    onChange={(e) => {
                                      const updated = [...dossierForm.mandats];
                                      updated[index] = {
                                        ...updated[index],
                                        adresse_travaux: {
                                          ...updated[index].adresse_travaux,
                                          rue: e.target.value
                                        }
                                      };
                                      setDossierForm({...dossierForm, mandats: updated});
                                    }}
                                    placeholder="Nom de la rue"
                                    className="bg-slate-700 border-slate-600 text-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-slate-300 text-sm">Ville</Label>
                                  <Input
                                    value={mandat.adresse_travaux?.ville || ""}
                                    onChange={(e) => {
                                      const updated = [...dossierForm.mandats];
                                      updated[index] = {
                                        ...updated[index],
                                        adresse_travaux: {
                                          ...updated[index].adresse_travaux,
                                          ville: e.target.value
                                        }
                                      };
                                      setDossierForm({...dossierForm, mandats: updated});
                                    }}
                                    placeholder="Ville"
                                    className="bg-slate-700 border-slate-600 text-white"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-slate-300 text-sm">Province</Label>
                                  <Input
                                    value={mandat.adresse_travaux?.province || "Québec"}
                                    onChange={(e) => {
                                      const updated = [...dossierForm.mandats];
                                      updated[index] = {
                                        ...updated[index],
                                        adresse_travaux: {
                                          ...updated[index].adresse_travaux,
                                          province: e.target.value
                                        }
                                      };
                                      setDossierForm({...dossierForm, mandats: updated});
                                    }}
                                    placeholder="Province"
                                    className="bg-slate-700 border-slate-600 text-white"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-slate-300 text-sm">Code postal</Label>
                                <Input
                                  value={mandat.adresse_travaux?.code_postal || ""}
                                  onChange={(e) => {
                                    const updated = [...dossierForm.mandats];
                                    updated[index] = {
                                      ...updated[index],
                                      adresse_travaux: {
                                        ...updated[index].adresse_travaux,
                                        code_postal: e.target.value
                                      }
                                    };
                                    setDossierForm({...dossierForm, mandats: updated});
                                  }}
                                  placeholder="Code postal"
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
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

                          {/* Lots */}
                          <div className="space-y-2">
                            <Label className="text-slate-300">Lots sélectionnés</Label>
                            <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg min-h-[80px] flex items-center justify-center">
                              {mandat.lots && mandat.lots.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {mandat.lots.map((lot, li) => (
                                    <Badge key={li} variant="outline" className="bg-slate-700">{lot}</Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm">Aucun lot sélectionné</p>
                              )}
                            </div>
                            <Input
                              value={mandat.lots?.join(", ") || ""}
                              onChange={(e) => updateMandat(index, 'lots', e.target.value.split(",").map(l => l.trim()).filter(l => l))}
                              placeholder="Ex: 1234, 5678"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>

                          {/* Tarification */}
                          <div className="space-y-3 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                            <h4 className="font-semibold text-white">Tarification</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-slate-300">Prix estimé ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={mandat.prix_estime || 0}
                                  onChange={(e) => updateMandat(index, 'prix_estime', parseFloat(e.target.value))}
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-slate-300">Rabais ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={mandat.rabais || 0}
                                  onChange={(e) => updateMandat(index, 'rabais', parseFloat(e.target.value))}
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Description du dossier</Label>
                    <Textarea
                      value={dossierForm.description}
                      onChange={(e) => setDossierForm({...dossierForm, description: e.target.value})}
                      className="bg-slate-800 border-slate-700 text-white"
                      rows={4}
                    />
                  </div>
                </form>

                {/* Boutons Annuler/Modifier tout en bas */}
                <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsEditingDossierDialogOpen(false)}
                    className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit"
                    form="dossier-form-edit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    Modifier
                  </Button>
                </div>
              </div>

              {/* Right side - Commentaires Sidebar - 30% */}
              <div className="flex-[0_0_30%] flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex-shrink-0">
                  <h3 className="text-lg font-bold text-white">Commentaires</h3>
                </div>
                <div className="flex-1 overflow-hidden p-6">
                  <CommentairesSection
                    dossierId={editingDossier?.id}
                    dossierTemporaire={false}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
