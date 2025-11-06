
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
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Plus, ChevronLeft, ChevronRight, Edit, Cake, Trash2, X, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import EditDossierDialog from "../components/dossiers/EditDossierDialog";


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
        full_name: user.full_name || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
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

  const retoursAppel = dossiers.filter(d => d.statut === "Retour d'appel" && d.utilisateur_assigne === user?.email);

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

                {/* Ligne 2: Adresse, Téléphone, Ancienneté */}
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
                    <Label className="text-slate-400 text-xs">Ancienneté</Label>
                    <p className="text-white font-medium text-sm flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-slate-500" />
                      {user?.date_embauche ? format(new Date(user.date_embauche), "dd MMM yyyy", { locale: fr }) : "-"}
                      {user?.date_embauche && <span className="text-slate-400">({calculateSeniority()})</span>}
                    </p>
                  </div>
                </div>

                {/* Ligne 3: Date anniversaire et Rôle */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
                  <div>
                    <Label className="text-slate-400 text-xs">Date d'anniversaire</Label>
                    <p className="text-white font-medium text-sm flex items-center gap-1">
                      <Cake className="w-3 h-3 text-slate-500" />
                      {user?.date_naissance ? format(new Date(user.date_naissance), "dd MMM yyyy", { locale: fr }) : "-"}
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
                  <div>
                    {/* Colonne vide pour l'alignement */}
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

        {/* Entrées de temps - pleine largeur */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
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
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Date d'embauche</Label>
                  <Input
                    type="date"
                    value={profileForm.date_embauche}
                    onChange={(e) => setProfileForm({...profileForm, date_embauche: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
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
