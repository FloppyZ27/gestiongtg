
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, FileText, User, Mail, Phone, MapPin, Briefcase, Upload, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Profil() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [editingRendezVous, setEditingRendezVous] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: entreeTemps } = useQuery({
    queryKey: ['entreeTemps', user?.email],
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 5),
    initialData: [],
    enabled: !!user,
  });

  const { data: rendezVous } = useQuery({
    queryKey: ['rendezVous', user?.email],
    queryFn: () => base44.entities.RendezVous.filter({ utilisateur_email: user?.email }, '-date_debut'),
    initialData: [],
    enabled: !!user,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    adresse: user?.adresse || "",
    poste: user?.poste || "",
    date_naissance: user?.date_naissance || "",
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
        email: user.email || "",
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
    const { email, ...updateData } = profileForm;
    updateProfileMutation.mutate(updateData);
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

  // New utility functions for 'Retours d'appel' section
  const getArpenteurInitials = (name) => {
    if (!name) return 'AG';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatutBadgeColor = (statut) => {
    switch (statut) {
      case 'en_attente': return 'bg-yellow-500/20 text-yellow-400';
      case 'en_cours': return 'bg-emerald-500/20 text-emerald-400';
      case 'termine': return 'bg-blue-500/20 text-blue-400';
      case 'annule': return 'bg-red-500/20 text-red-400';
      case 'Retour d\'appel': return 'bg-orange-500/20 text-orange-400'; // Specific color for 'a_rappeler'
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getClientsNames = (clients_data) => {
    if (!clients_data || clients_data.length === 0) return 'N/A';
    // Assumes clients_data is an array of objects with 'full_name' or an array of strings (names)
    // or IDs that can be directly joined if no name lookup is desired here.
    return clients_data.map(item => typeof item === 'object' && item !== null && 'full_name' in item ? item.full_name : item).filter(Boolean).join(', ');
  };

  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return 'Non spécifiée';
    return mandats[0].adresse_travaux;
  };

  const dossiersEnCours = dossiers.filter(d => d.statut === 'en_cours');
  const retoursAppel = dossiers.filter(d => d.statut === "Retour d'appel" && d.utilisateur_assigne === user?.email);
  const totalHeures = entreeTemps.reduce((sum, e) => sum + (e.heures || 0), 0);

  // Jours fériés Canada/Québec 2025 (placeholder year for example)
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

    // Add holidays
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

    // Add birthday if it's user's birthday
    if (user?.date_naissance) {
      const birthDate = new Date(user.date_naissance);
      if (birthDate.getMonth() === day.getMonth() && birthDate.getDate() === day.getDate()) {
        events.push({
          id: `birthday-${user.email}`,
          titre: `🎂 Anniversaire de ${user.full_name}`,
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Profile, Stats & Time entries */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="w-32 h-32 border-4 border-emerald-500/50">
                      <AvatarImage src={user?.photo_url} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-emerald-500 to-teal-500">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors">
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
                  <h2 className="text-2xl font-bold text-white mb-1">{user?.full_name}</h2>
                  <p className="text-emerald-400 mb-4">{user?.poste || "Employé"}</p>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    {user?.role}
                  </Badge>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{user?.email}</span>
                  </div>
                  {user?.telephone && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{user.telephone}</span>
                    </div>
                  )}
                  {user?.adresse && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{user.adresse}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  Modifier le profil
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Dossiers en cours</span>
                  <span className="text-2xl font-bold text-emerald-400">{dossiersEnCours.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Heures (5 dernières)</span>
                  <span className="text-2xl font-bold text-cyan-400">{totalHeures}h</span>
                </div>
              </CardContent>
            </Card>

            {/* Entrées de temps */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Dernières entrées de temps
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {entreeTemps.map((entree) => (
                    <div key={entree.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-white text-sm">{entree.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(entree.date), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <span className="text-emerald-400 font-semibold">{entree.heures}h</span>
                      </div>
                    </div>
                  ))}
                  {entreeTemps.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Aucune entrée de temps</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dossiers en cours */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Dossiers en cours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {dossiersEnCours.slice(0, 5).map((dossier) => (
                    <div key={dossier.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{dossier.titre}</h4>
                          <p className="text-sm text-slate-400">N° {dossier.numero_dossier}</p>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          {dossier.statut}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {dossiersEnCours.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Aucun dossier en cours</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Retours d'appel & Calendar */}
          <div className="space-y-6">
            {/* Retours d'appel assignés */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-400" />
                  Mes retours d'appel ({retoursAppel.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {retoursAppel.length > 0 ? (
                    <div className="divide-y divide-slate-800">
                      {retoursAppel.map((dossier) => (
                        <div key={dossier.id} className="p-4 hover:bg-slate-800/30 transition-colors">
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white">
                                    {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier || "Nouveau"}
                                  </h4>
                                  <Badge variant="outline" className={`${getStatutBadgeColor(dossier.statut)} border text-xs`}>
                                    {dossier.statut}
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-400">
                                  Clients: {getClientsNames(dossier.clients_ids)}
                                </p>
                                {dossier.mandats && dossier.mandats.length > 0 && (
                                  <p className="text-sm text-slate-400">
                                    Adresse: {getFirstAdresseTravaux(dossier.mandats)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-xs text-slate-500">
                                  {format(new Date(dossier.created_date), "dd MMM yyyy", { locale: fr })}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {format(new Date(dossier.created_date), "HH:mm", { locale: fr })}
                                </p>
                              </div>
                            </div>
                            {dossier.notes_retour_appel && (
                              <div className="mt-2 p-2 bg-slate-800/50 rounded">
                                <p className="text-xs text-slate-400 mb-1">Notes:</p>
                                <p className="text-sm text-slate-300">{dossier.notes_retour_appel}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-8">Aucun retour d'appel assigné</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    Calendrier
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={viewMode === 'month' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('month')}
                        className={viewMode === 'month' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        Mois
                      </Button>
                      <Button
                        size="sm"
                        variant={viewMode === 'week' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('week')}
                        className={viewMode === 'week' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
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
                            <Label>Titre</Label>
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
                              <Label>Date début</Label>
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
                            <Button type="button" variant="outline" onClick={() => setIsRendezVousDialogOpen(false)}>
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
                        <div className={`text-sm mb-1 ${isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
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
