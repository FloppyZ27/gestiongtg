import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Edit, Cake, ChevronUp, ChevronDown, Loader2, Play, Square, Timer, UserCircle, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [infoPersonnellesCollapsed, setInfoPersonnellesCollapsed] = useState(false);
  const [feuilleTempsCollapsed, setFeuilleTempsCollapsed] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // États pour pointage
  const [pointageCollapsed, setPointageCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState("week"); // "week" ou "month"

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

  const { data: pointages = [] } = useQuery({
    queryKey: ['pointages', user?.email],
    queryFn: () => base44.entities.Pointage.filter({ utilisateur_email: user?.email }, '-date', 50),
    initialData: [],
    enabled: !!user,
  });



  const [profileForm, setProfileForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    adresse: "",
    date_naissance: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        prenom: user.prenom || "",
        nom: user.nom || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
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

  // Grouper les entrées par date pour affichage feuille de temps
  const groupedEntrees = entreeTemps.reduce((acc, entree) => {
    const date = entree.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entree);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEntrees).sort((a, b) => new Date(b) - new Date(a));

  // Fonctions pour générer les jours de la semaine et du mois
  const getCurrentWeekDays = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getCurrentMonthDays = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const getPointageForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return pointages.filter(p => p.date === dateStr && p.statut === 'termine');
  };

  const getDayTotalHours = (date) => {
    const dayPointages = getPointageForDate(date);
    return dayPointages.reduce((sum, p) => sum + (p.duree_heures || 0), 0);
  };

  // Calculer le total des heures par jour
  const calculateTotalHours = (date) => {
    const entries = groupedEntrees[date] || [];
    return entries.reduce((sum, e) => sum + (e.heures || 0), 0);
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

        {/* Section Feuille de temps (Pointage) */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <div 
            className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-2 px-3 bg-cyan-900/20 border-b border-slate-800"
            onClick={() => setPointageCollapsed(!pointageCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center">
                  <Timer className="w-3 h-3 text-cyan-400" />
                </div>
                <h3 className="text-cyan-300 text-sm font-semibold">Feuille de temps</h3>
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                  {pointages.filter(p => p.statut === 'termine').length} entrées
                </Badge>
              </div>
              {pointageCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {!pointageCollapsed && (
            <CardContent className="p-6">
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="week" className="text-cyan-300">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Semaine
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-cyan-300">
                    <Calendar className="w-4 h-4 mr-2" />
                    Mois
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="week" className="space-y-3">
                  <div className="flex gap-2 w-full">
                    {/* Conteneur avec scroll */}
                    <div className="flex gap-2 overflow-y-auto w-full" style={{ maxHeight: '768px' }}>
                      {/* Colonne des heures */}
                      <div className="flex flex-col pt-10 w-12 flex-shrink-0">
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <div key={hour} className="text-xs text-slate-500 text-right pr-2" style={{ height: '256px' }}>
                            {hour}h
                          </div>
                        ))}
                      </div>

                      {/* Colonnes des jours */}
                      <div className="flex-1 grid grid-cols-7 gap-2">
                        {getCurrentWeekDays().map((day, index) => {
                          const dayPointages = getPointageForDate(day);
                          const totalHours = getDayTotalHours(day);

                          return (
                            <div key={index} className="flex flex-col">
                              {/* En-tête du jour - sticky */}
                              <div className="sticky top-0 z-10 bg-slate-900 text-center mb-2 pb-2 border-b border-slate-700">
                                <div className="text-xs text-slate-400">
                                  {format(day, "EEE", { locale: fr })}
                                </div>
                                <div className="text-lg font-semibold text-white">
                                  {format(day, "d", { locale: fr })}
                                </div>
                                {totalHours > 0 && (
                                  <div className="text-xs text-cyan-400 font-bold">
                                    {totalHours.toFixed(1)}h
                                  </div>
                                )}
                              </div>

                              {/* Timeline avec les pointages */}
                              <div className="relative border rounded-lg flex-1 border-slate-700 bg-slate-800/20" style={{ height: '6144px' }}>
                                {/* Lignes horaires */}
                                {Array.from({ length: 24 }, (_, i) => (
                                  <div 
                                    key={i} 
                                    className="absolute w-full border-t border-slate-700/50"
                                    style={{ top: `${i * 256}px` }}
                                  />
                                ))}

                                {/* Pointages positionnés */}
                                {dayPointages.map(p => {
                                  const startTime = new Date(p.heure_debut);
                                  const endTime = p.heure_fin ? new Date(p.heure_fin) : new Date();

                                  const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                                  const endHour = endTime.getHours() + endTime.getMinutes() / 60;

                                  // Position relative à 0h (début de la timeline)
                                  const topPosition = (startHour * 256);
                                  // Hauteur basée sur la différence entre début et fin
                                  const height = ((endHour - startHour) * 256);

                                  return (
                                    <div
                                      key={p.id}
                                      className="absolute w-full px-1"
                                      style={{
                                        top: `${Math.max(0, topPosition)}px`,
                                        height: `${Math.max(16, height)}px`
                                      }}
                                    >
                                      <div className="h-full bg-gradient-to-br from-cyan-500/40 to-blue-500/40 border border-cyan-500/50 rounded px-1 py-1 overflow-hidden">
                                        <div className="text-[10px] font-bold text-cyan-100">
                                          {format(startTime, "HH:mm")}
                                        </div>
                                        {p.heure_fin && (
                                          <div className="text-[9px] text-cyan-200">
                                            {p.duree_heures.toFixed(1)}h
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="month" className="space-y-3">
                  <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-slate-400 pb-2">
                        {day}
                      </div>
                    ))}
                    {(() => {
                      const monthDays = getCurrentMonthDays();
                      const firstDayOfWeek = monthDays[0].getDay();
                      const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
                      const emptyDays = Array(offset).fill(null);

                      return [...emptyDays, ...monthDays].map((day, index) => {
                        if (!day) {
                          return <div key={`empty-${index}`} className="border border-transparent"></div>;
                        }

                        const dayPointages = getPointageForDate(day);
                        const totalHours = getDayTotalHours(day);
                        const isToday = day.toDateString() === new Date().toDateString();

                        return (
                          <div
                            key={index}
                            className={`border rounded-lg p-2 min-h-[80px] ${
                              isToday 
                                ? 'border-cyan-500 bg-cyan-500/10' 
                                : 'border-slate-700 bg-slate-800/30'
                            }`}
                          >
                            <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                              {format(day, "d")}
                            </div>
                            {dayPointages.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] text-cyan-400 font-bold">
                                  {totalHours.toFixed(1)}h
                                </div>
                                <div className="text-[9px] text-slate-500">
                                  {dayPointages.length} entrée{dayPointages.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>

        {/* Section Feuille de temps */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <div 
            className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-3 px-4 bg-emerald-900/20 border-b border-slate-800"
            onClick={() => setFeuilleTempsCollapsed(!feuilleTempsCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-emerald-300 text-lg font-semibold">Feuille de temps</h3>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  {entreeTemps.length} entrées
                </Badge>
              </div>
              {feuilleTempsCollapsed ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronUp className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {!feuilleTempsCollapsed && (
            <CardContent className="p-6">
              {/* Feuille de temps par jour */}
              <div className="space-y-4">
                {sortedDates.map(date => {
                  const dayEntries = groupedEntrees[date];
                  const totalHours = calculateTotalHours(date);
                  
                  return (
                    <div key={date} className="border border-slate-700 rounded-lg overflow-hidden">
                      <div className="bg-slate-800/50 px-4 py-2 flex items-center justify-between border-b border-slate-700">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span className="text-white font-semibold">
                            {format(new Date(date + 'T00:00:00'), "EEEE d MMMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm">
                          Total: {totalHours.toFixed(2)}h
                        </Badge>
                      </div>
                      
                      <div className="divide-y divide-slate-800">
                        {dayEntries.map((entree) => {
                          const dossier = dossiers.find(d => d.id === entree.dossier_id);
                          return (
                            <div key={entree.id} className="p-3 hover:bg-slate-800/30 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {dossier && (
                                      <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                                        {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                      </Badge>
                                    )}
                                    {entree.mandat && (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                        {entree.mandat}
                                      </Badge>
                                    )}
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                                      {entree.tache}
                                    </Badge>
                                  </div>
                                  {entree.description && (
                                    <p className="text-slate-400 text-sm">{entree.description}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <span className="text-emerald-400 font-bold text-lg">{entree.heures}h</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {sortedDates.length === 0 && (
                  <div className="text-center py-12 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-lg">Aucune entrée de temps enregistrée</p>
                    <p className="text-sm text-slate-600 mt-1">Utilisez Punch In/Out pour commencer à tracker votre temps</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}
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
                <Input
                  value={profileForm.adresse}
                  onChange={(e) => setProfileForm({...profileForm, adresse: e.target.value})}
                  placeholder="Adresse civique..."
                  className="bg-slate-800 border-slate-700"
                />
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
      </div>
    </div>
  );
}