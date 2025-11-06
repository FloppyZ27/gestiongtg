
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
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Plus, ChevronLeft, ChevronRight, Edit, Cake, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

const createPageUrl = (pageName) => {
  // This is a placeholder for actual routing logic. 
  // In a Next.js or similar framework, you might use router.push or a known base URL.
  // For demonstration, it constructs a simple URL.
  return `/${pageName.toLowerCase()}`; 
};

export default function Profil() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [editingRendezVous, setEditingRendezVous] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');

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

  // Calculate seniority
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
    if (displayMonths === 0) return `${displayYears} an${displayYears > 1 ? 's' : ''}`;
    return `${displayYears} an${displayYears > 1 ? 's' : ''} et ${displayMonths} mois`;
  };

  // Holidays
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
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                Informations personnelles
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setIsEditingProfile(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo */}
              <div className="flex flex-col items-center">
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
                  <p className="text-xs text-slate-400 mt-2">Téléchargement...</p>
                )}
              </div>

              {/* Information Table - 2 columns, 4 rows */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <Label className="text-slate-400 text-sm">Nom complet</Label>
                    <p className="text-white font-medium">{user?.full_name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Poste</Label>
                    <p className="text-white font-medium">{user?.poste || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Adresse courriel</Label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{user?.email}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Téléphone</Label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-500" />
                      {user?.telephone || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Adresse</Label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{user?.adresse || "-"}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Date d'anniversaire</Label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Cake className="w-4 h-4 text-slate-500" />
                      {user?.date_naissance ? format(new Date(user.date_naissance), "dd MMMM yyyy", { locale: fr }) : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Ancienneté</Label>
                    <p className="text-white font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-slate-500" />
                      {calculateSeniority()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Rôle</Label>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
                            window.open(url, '_blank');
                          }}
                          className="gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                        >
                          Voir
                        </Button>
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
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Heures</TableHead>
                      <TableHead className="text-slate-300">Tâche</TableHead>
                      <TableHead className="text-slate-300">Dossier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entreeTemps.map((entree) => {
                      const dossier = dossiers.find(d => d.id === entree.dossier_id);
                      return (
                        <TableRow key={entree.id} className="hover:bg-slate-800/30 border-slate-800">
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
                          <TableCell className="text-slate-300 text-sm">
                            {dossier 
                              ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {entreeTemps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-slate-500">
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
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4" />
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
      </div>
    </div>
  );
}
