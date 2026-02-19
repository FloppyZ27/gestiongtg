import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Edit, Cake, ChevronUp, ChevronDown, Loader2, Play, Square, Timer, UserCircle, CalendarDays, Plus, Trash2 } from "lucide-react";
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
  const [feuilleTempsCollapsed, setFeuilleTempsCollapsed] = useState(true);
  const [entreeTempsTab, setEntreeTempsTab] = useState("semaine");
  const [entreeTempsCurrentDate, setEntreeTempsCurrentDate] = useState(new Date());
  const [agendaCollapsed, setAgendaCollapsed] = useState(true);
  const [agendaViewMode, setAgendaViewMode] = useState("semaine");
  const [agendaCurrentDate, setAgendaCurrentDate] = useState(new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    titre: "",
    description: "",
    date_debut: "",
    heure_debut: "",
    date_fin: "",
    heure_fin: "",
    type: "rendez-vous"
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // États pour pointage
  const [pointageCollapsed, setPointageCollapsed] = useState(true);
  const [entreeTempsCollapsed, setEntreeTempsCollapsed] = useState(true);
  const [viewMode, setViewMode] = useState("week"); // "week" ou "month"
  const [pointageCurrentDate, setPointageCurrentDate] = useState(new Date());
  const [editingPointage, setEditingPointage] = useState(null);
  const [isAddingPointage, setIsAddingPointage] = useState(false);
  const [editPointageForm, setEditPointageForm] = useState({
    date: "",
    heure_debut: "",
    heure_fin: "",
    description: ""
  });
  const [addPointageForm, setAddPointageForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heure_debut: "",
    heure_fin: "",
    description: ""
  });
  const weekScrollRef = React.useRef(null);

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

  const { data: microsoftEvents = [] } = useQuery({
    queryKey: ['microsoftCalendarEvents', user?.email],
    queryFn: async () => {
      const response = await base44.functions.invoke('getMicrosoftCalendarEvents', {});
      return response.data?.events || [];
    },
    initialData: [],
    enabled: !!user,
  });

  const { data: rendezVous = [] } = useQuery({
    queryKey: ['rendezVous', user?.email],
    queryFn: () => base44.entities.RendezVous.filter({ utilisateur_email: user?.email }, '-date_debut', 100),
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

  // Scroll à 7h au chargement de la vue semaine
  useEffect(() => {
    if (viewMode === "week" && weekScrollRef.current) {
      setTimeout(() => {
        weekScrollRef.current.scrollTop = 7 * 60; // 7 heures * 60px par heure
      }, 0);
    }
  }, [viewMode]);

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

  const confirmPointageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pointage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointages', user?.email] });
    },
  });

  const updatePointageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pointage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointages', user?.email] });
      setEditingPointage(null);
    },
  });

  const createPointageMutation = useMutation({
    mutationFn: (data) => base44.entities.Pointage.create({ ...data, utilisateur_email: user?.email, statut: 'termine' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointages', user?.email] });
      setIsAddingPointage(false);
      setAddPointageForm({
        date: new Date().toISOString().split('T')[0],
        heure_debut: "",
        heure_fin: "",
        description: ""
      });
    },
  });

  const createRendezVousMutation = useMutation({
    mutationFn: (data) => base44.entities.RendezVous.create({ ...data, utilisateur_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', user?.email] });
      setIsAddingEvent(false);
      setEditingEvent(null);
      setEventForm({
        titre: "",
        description: "",
        date_debut: "",
        heure_debut: "",
        date_fin: "",
        heure_fin: "",
        type: "rendez-vous"
      });
    },
  });

  const updateRendezVousMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RendezVous.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', user?.email] });
      setIsAddingEvent(false);
      setEditingEvent(null);
    },
  });

  const deleteRendezVousMutation = useMutation({
    mutationFn: (id) => base44.entities.RendezVous.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', user?.email] });
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

  const handleConfirmPointage = (pointage) => {
    confirmPointageMutation.mutate({
      id: pointage.id,
      data: { ...pointage, confirme: true }
    });
  };

  const handleOpenEditPointage = (pointage) => {
    const hasModification = pointage.heure_debut_modifiee && pointage.heure_fin_modifiee;
    
    let heureDebut = "";
    let heureFin = "";
    let date = "";
    
    if (hasModification) {
      const debutMod = new Date(pointage.heure_debut_modifiee);
      const finMod = new Date(pointage.heure_fin_modifiee);
      heureDebut = debutMod.toTimeString().slice(0, 5);
      heureFin = finMod.toTimeString().slice(0, 5);
      date = pointage.date;
    }
    
    setEditPointageForm({
      date: date,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      description: pointage.description || ""
    });
    setEditingPointage(pointage);
  };

  const handleSubmitEditPointage = async (e) => {
    e.preventDefault();
    
    if (!editPointageForm.description.trim()) {
      alert('La description est obligatoire');
      return;
    }

    const [heureD, minD] = editPointageForm.heure_debut.split(':');
    const [heureF, minF] = editPointageForm.heure_fin.split(':');
    
    const debut = new Date(editPointageForm.date);
    debut.setHours(parseInt(heureD), parseInt(minD), 0);
    
    const fin = new Date(editPointageForm.date);
    fin.setHours(parseInt(heureF), parseInt(minF), 0);
    
    const dureeHeuresModifiee = (fin - debut) / (1000 * 60 * 60);

    updatePointageMutation.mutate({
      id: editingPointage.id,
      data: {
        ...editingPointage,
        date: editPointageForm.date,
        heure_debut_modifiee: debut.toISOString(),
        heure_fin_modifiee: fin.toISOString(),
        duree_heures_modifiee: parseFloat(dureeHeuresModifiee.toFixed(2)),
        description: editPointageForm.description,
        confirme: true
      }
    });
  };

  const handleSubmitAddPointage = async (e) => {
    e.preventDefault();
    
    if (!addPointageForm.description.trim()) {
      alert('La description est obligatoire');
      return;
    }

    const [heureD, minD] = addPointageForm.heure_debut.split(':');
    const [heureF, minF] = addPointageForm.heure_fin.split(':');
    
    const debut = new Date(addPointageForm.date);
    debut.setHours(parseInt(heureD), parseInt(minD), 0);
    
    const fin = new Date(addPointageForm.date);
    fin.setHours(parseInt(heureF), parseInt(minF), 0);
    
    const dureeHeures = (fin - debut) / (1000 * 60 * 60);

    createPointageMutation.mutate({
      date: addPointageForm.date,
      heure_debut: debut.toISOString(),
      heure_fin: fin.toISOString(),
      duree_heures: parseFloat(dureeHeures.toFixed(2)),
      description: addPointageForm.description,
      confirme: true
    });
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

  // Fonctions pour gérer les entrées de temps par semaine/mois
  const getEntreeTempsWeekDays = () => {
    const dayOfWeek = entreeTempsCurrentDate.getDay();
    const sunday = new Date(entreeTempsCurrentDate);
    sunday.setDate(entreeTempsCurrentDate.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEntreeTempsMonthDays = () => {
    const year = entreeTempsCurrentDate.getFullYear();
    const month = entreeTempsCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const goToEntreeTemPrevious = () => {
    if (entreeTempsTab === "semaine") {
      setEntreeTempsCurrentDate(new Date(entreeTempsCurrentDate.getFullYear(), entreeTempsCurrentDate.getMonth(), entreeTempsCurrentDate.getDate() - 7));
    } else if (entreeTempsTab === "mois") {
      setEntreeTempsCurrentDate(new Date(entreeTempsCurrentDate.getFullYear(), entreeTempsCurrentDate.getMonth() - 1, 1));
    }
  };

  const goToEntreeTempsNext = () => {
    if (entreeTempsTab === "semaine") {
      setEntreeTempsCurrentDate(new Date(entreeTempsCurrentDate.getFullYear(), entreeTempsCurrentDate.getMonth(), entreeTempsCurrentDate.getDate() + 7));
    } else if (entreeTempsTab === "mois") {
      setEntreeTempsCurrentDate(new Date(entreeTempsCurrentDate.getFullYear(), entreeTempsCurrentDate.getMonth() + 1, 1));
    }
  };

  const goToEntreeTempsToday = () => {
    setEntreeTempsCurrentDate(new Date());
  };

  const getEntreeTempsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entreeTemps.filter(e => e.date === dateStr);
  };

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

  const getPointageWeekDays = () => {
    const dayOfWeek = pointageCurrentDate.getDay();
    const monday = new Date(pointageCurrentDate);
    monday.setDate(pointageCurrentDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPointageMonthDays = () => {
    const year = pointageCurrentDate.getFullYear();
    const month = pointageCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
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

  const goToPointagePrevious = () => {
    if (viewMode === "week") {
      setPointageCurrentDate(new Date(pointageCurrentDate.getFullYear(), pointageCurrentDate.getMonth(), pointageCurrentDate.getDate() - 7));
    } else {
      setPointageCurrentDate(new Date(pointageCurrentDate.getFullYear(), pointageCurrentDate.getMonth() - 1, 1));
    }
  };

  const goToPointageNext = () => {
    if (viewMode === "week") {
      setPointageCurrentDate(new Date(pointageCurrentDate.getFullYear(), pointageCurrentDate.getMonth(), pointageCurrentDate.getDate() + 7));
    } else {
      setPointageCurrentDate(new Date(pointageCurrentDate.getFullYear(), pointageCurrentDate.getMonth() + 1, 1));
    }
  };

  const goToPointageToday = () => {
    setPointageCurrentDate(new Date());
  };

  const getPointageForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return pointages.filter(p => p.date === dateStr && p.statut === 'termine');
  };

  const getDayTotalHours = (date) => {
    const dayPointages = getPointageForDate(date);
    return dayPointages.reduce((sum, p) => sum + (p.duree_heures || 0), 0);
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return microsoftEvents.filter(event => {
      const eventDate = new Date(event.start.dateTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Calculer le total des heures par jour
  const calculateTotalHours = (date) => {
    const entries = groupedEntrees[date] || [];
    return entries.reduce((sum, e) => sum + (e.heures || 0), 0);
  };

  // Fonctions pour l'agenda
  const getAgendaWeekDays = () => {
    const dayOfWeek = agendaCurrentDate.getDay();
    const sunday = new Date(agendaCurrentDate);
    sunday.setDate(agendaCurrentDate.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAgendaMonthDays = () => {
    const year = agendaCurrentDate.getFullYear();
    const month = agendaCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const goToAgendaPrevious = () => {
    if (agendaViewMode === "semaine") {
      setAgendaCurrentDate(new Date(agendaCurrentDate.getFullYear(), agendaCurrentDate.getMonth(), agendaCurrentDate.getDate() - 7));
    } else {
      setAgendaCurrentDate(new Date(agendaCurrentDate.getFullYear(), agendaCurrentDate.getMonth() - 1, 1));
    }
  };

  const goToAgendaNext = () => {
    if (agendaViewMode === "semaine") {
      setAgendaCurrentDate(new Date(agendaCurrentDate.getFullYear(), agendaCurrentDate.getMonth(), agendaCurrentDate.getDate() + 7));
    } else {
      setAgendaCurrentDate(new Date(agendaCurrentDate.getFullYear(), agendaCurrentDate.getMonth() + 1, 1));
    }
  };

  const goToAgendaToday = () => {
    setAgendaCurrentDate(new Date());
  };

  const getRendezVousForDate = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return rendezVous.filter(rv => {
      const eventStart = new Date(rv.date_debut);
      const eventEnd = new Date(rv.date_fin || rv.date_debut);
      
      // L'événement chevauche ce jour s'il commence avant la fin du jour 
      // ET se termine après le début du jour
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    const dateDebut = new Date(`${eventForm.date_debut}T${eventForm.heure_debut}`);
    const dateFin = eventForm.date_fin && eventForm.heure_fin 
      ? new Date(`${eventForm.date_fin}T${eventForm.heure_fin}`)
      : new Date(dateDebut.getTime() + 60 * 60 * 1000); // +1 heure par défaut

    if (editingEvent) {
      await updateRendezVousMutation.mutateAsync({
        id: editingEvent.id,
        data: {
          ...editingEvent,
          titre: eventForm.titre,
          description: eventForm.description,
          date_debut: dateDebut.toISOString(),
          date_fin: dateFin.toISOString(),
          type: eventForm.type
        }
      });
    } else {
      await createRendezVousMutation.mutateAsync({
        titre: eventForm.titre,
        description: eventForm.description,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        type: eventForm.type
      });
    }
  };

  const handleEditEvent = (event) => {
    const debut = new Date(event.date_debut);
    const fin = event.date_fin ? new Date(event.date_fin) : debut;
    
    setEventForm({
      titre: event.titre,
      description: event.description || "",
      date_debut: debut.toISOString().split('T')[0],
      heure_debut: debut.toTimeString().slice(0, 5),
      date_fin: fin.toISOString().split('T')[0],
      heure_fin: fin.toTimeString().slice(0, 5),
      type: event.type
    });
    setEditingEvent(event);
    setIsAddingEvent(true);
  };

  return (
    <TooltipProvider>
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

        {/* Section Agenda */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <div 
            className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-2 px-3 bg-purple-900/20 border-b border-slate-800"
            onClick={() => setAgendaCollapsed(!agendaCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <CalendarDays className="w-3 h-3 text-purple-400" />
                </div>
                <h3 className="text-purple-300 text-sm font-semibold">Agenda</h3>
              </div>
              {agendaCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {!agendaCollapsed && (
            <CardContent className="p-6">
              {/* Header avec navigation et contrôles */}
              <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-white font-semibold text-lg">
                      {agendaViewMode === "semaine" 
                        ? `Semaine du ${format(getAgendaWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getAgendaWeekDays()[6], "d MMMM yyyy", { locale: fr })}`
                        : format(agendaCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(agendaCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      onClick={() => setIsAddingEvent(true)}
                      className="h-8 agenda-add-button"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToAgendaPrevious}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                    >
                      ← Précédent
                    </Button>
                    <Button
                      size="sm"
                      onClick={goToAgendaToday}
                      className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 h-8"
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToAgendaNext}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                    >
                      Suivant →
                    </Button>
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => setAgendaViewMode("semaine")}
                        className={`h-8 ${agendaViewMode === "semaine" ? "agenda-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                      >
                        Semaine
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setAgendaViewMode("mois")}
                        className={`h-8 ${agendaViewMode === "mois" ? "agenda-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                      >
                        Mois
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vue Semaine */}
              {agendaViewMode === "semaine" && (
                <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 flex flex-col" style={{ height: '600px' }}>
                  <div className="overflow-x-auto flex-1 flex flex-col">
                    <div className="inline-block min-w-full h-full flex flex-col">
                      {/* En-têtes des jours */}
                      <div className="flex border-b border-slate-700 flex-shrink-0">
                        <div className="w-16 flex-shrink-0 border-r border-slate-700 bg-slate-900/50"></div>
                        {getAgendaWeekDays().map((day, idx) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          return (
                            <div key={idx} className={`flex-1 text-center py-3 border-r border-slate-700 ${isToday ? 'bg-slate-900/50 ring-2 ring-purple-500 ring-inset' : 'bg-slate-900/50'}`}>
                              <div className={`text-xs uppercase ${isToday ? 'text-purple-400' : 'text-slate-400'}`}>
                                {format(day, "EEE", { locale: fr })}
                              </div>
                              <div className={`text-lg font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>
                                {format(day, "d", { locale: fr })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Grille horaire */}
                      <div className="overflow-y-auto flex-1 relative" ref={el => {
                        if (el && !el.dataset.scrolledTo7) {
                          el.scrollTop = 7 * 90;
                          el.dataset.scrolledTo7 = 'true';
                        }
                      }}>
                        <div className="flex relative" style={{ minHeight: '2160px' }}>
                          {/* Colonne des heures */}
                          <div className="w-16 flex-shrink-0 sticky left-0 z-20 bg-slate-900/30">
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                              <div key={hour} className="h-[90px] border-b border-slate-700/50 flex items-start">
                                <div className="w-full border-r border-slate-700 px-2 py-2 text-xs text-slate-500 text-right">
                                  {hour.toString().padStart(2, '0')}:00
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Colonnes des jours */}
                          {getAgendaWeekDays().map((day, dayIdx) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            const dayEvents = getRendezVousForDate(day);

                            return (
                              <div key={dayIdx} className={`flex-1 border-r border-slate-700 relative ${isToday ? 'bg-purple-500/10' : 'bg-slate-800/20'}`}>
                                {/* Grille des heures de fond */}
                                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                  <div key={hour} className="h-[90px] border-b border-slate-700/50"></div>
                                ))}

                                {/* Événements */}
                                {dayEvents.map(event => {
                                  const eventStart = new Date(event.date_debut);
                                  const eventEnd = new Date(event.date_fin || event.date_debut);

                                  const dayStart = new Date(day);
                                  dayStart.setHours(0, 0, 0, 0);

                                  const dayEnd = new Date(day);
                                  dayEnd.setHours(23, 59, 59, 999);

                                  const startTime = eventStart < dayStart ? dayStart : eventStart;
                                  const endTime = eventEnd > dayEnd ? dayEnd : eventEnd;

                                  if (eventEnd < dayStart || eventStart > dayEnd) {
                                    return null;
                                  }

                                  const startHour = startTime.getHours();
                                  const startMin = startTime.getMinutes();
                                  const durationMinutes = (endTime - startTime) / (1000 * 60);
                                  const topPx = (startHour * 90) + (startMin * 1.5);

                                  const isAbsence = event.type === "absence";

                                  return (
                                    <Tooltip key={event.id}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`absolute left-1 right-1 rounded px-2 py-1 text-xs font-semibold z-10 cursor-pointer hover:opacity-80 transition-opacity group flex flex-col gap-0.5 overflow-hidden ${
                                            isAbsence
                                              ? 'bg-gradient-to-r from-red-500/60 to-orange-500/60 border border-red-500 text-red-50'
                                              : 'bg-gradient-to-r from-purple-500/60 to-indigo-500/60 border border-purple-500 text-purple-50'
                                          }`}
                                          style={{
                                            height: `${Math.max(40, durationMinutes * 1.5)}px`,
                                            top: `${topPx}px`
                                          }}
                                          onClick={() => handleEditEvent(event)}
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm("Supprimer cet événement ?")) {
                                                deleteRendezVousMutation.mutate(event.id);
                                              }
                                            }}
                                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 hover:bg-red-600 rounded text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                          {durationMinutes <= 60 ? (
                                            // Affichage compact : type + titre seulement
                                            <>
                                              <div className="truncate text-[10px] font-bold opacity-90 uppercase leading-tight">
                                                {isAbsence ? 'Absence' : 'Rendez-vous'}
                                              </div>
                                              <div className={`truncate font-bold text-xs ${
                                                isAbsence ? 'text-orange-300' : 'text-purple-300'
                                              }`}>{event.titre}</div>
                                            </>
                                          ) : (
                                            // Affichage complet
                                            <>
                                              <div className="truncate text-[11px] font-bold opacity-90 uppercase">
                                                {isAbsence ? 'Absence' : 'Rendez-vous'}
                                              </div>
                                              <div className={`truncate font-bold text-sm ${
                                                isAbsence ? 'text-orange-300' : 'text-purple-300'
                                              }`}>{event.titre}</div>
                                              {event.date_fin && (
                                                <div className="truncate text-[11px] opacity-90">{format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}</div>
                                              )}
                                              {event.description && <div className="truncate text-[10px] opacity-75">{event.description}</div>}
                                              <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-white/20">
                                                <div className="truncate">Créé: {format(new Date(event.created_date), "dd/MM/yy")}</div>
                                                {durationMinutes >= 90 && (
                                                  <div className="truncate">Modif: {format(new Date(event.updated_date), "dd/MM/yy")}</div>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-4">
                                        <div className="space-y-2">
                                          <div className="text-xs font-bold opacity-90 uppercase">
                                            {isAbsence ? 'Absence' : 'Rendez-vous'}
                                          </div>
                                          <div className={`font-bold text-base ${
                                            isAbsence ? 'text-orange-300' : 'text-purple-300'
                                          }`}>{event.titre}</div>
                                          {event.date_fin && (
                                            <div className="text-sm opacity-90">
                                              {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                                            </div>
                                          )}
                                          {event.description && (
                                            <div className="text-sm opacity-75 whitespace-pre-wrap">{event.description}</div>
                                          )}
                                          <div className="pt-2 border-t border-white/20">
                                            <div className="text-xs opacity-60">
                                              <div>Créé: {format(new Date(event.created_date), "dd/MM/yy à HH:mm")}</div>
                                              <div>Modifié: {format(new Date(event.updated_date), "dd/MM/yy à HH:mm")}</div>
                                            </div>
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      </div>
                      </div>
                      </div>
                      )}

              {/* Vue Mois */}
              {agendaViewMode === "mois" && (
                <div className="grid grid-cols-5 w-full" style={{ gap: '2px' }}>
                  {getAgendaMonthDays().map((day, index) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                    const dayEvents = getRendezVousForDate(day);

                    return (
                      <Card 
                        key={dateStr}
                        className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-purple-500' : ''} w-full`}
                        style={{ minHeight: '210px' }}
                      >
                        <div className="mb-2 w-full">
                          <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-purple-500' : ''} w-full`}>
                            <div className="flex items-center justify-center mb-1">
                              <div className="flex-1">
                                <p className={`text-xs uppercase ${isToday ? 'text-purple-400' : 'text-slate-400'}`}>
                                  {format(day, "EEE", { locale: fr })}
                                </p>
                                <p className={`text-lg font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>
                                  {format(day, "d", { locale: fr })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 flex-1 overflow-y-auto" style={{ maxHeight: '170px' }}>
                          {dayEvents.map(event => {
                            const isAbsence = event.type === "absence";
                            
                            const eventStart = new Date(event.date_debut);
                            const eventEnd = event.date_fin ? new Date(event.date_fin) : eventStart;
                            
                            const dayStart = new Date(day);
                            dayStart.setHours(0, 0, 0, 0);
                            const dayEnd = new Date(day);
                            dayEnd.setHours(23, 59, 59, 999);
                            
                            const displayStart = eventStart < dayStart ? dayStart : eventStart;
                            const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
                            
                            return (
                              <Tooltip key={event.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`text-xs px-3 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity group flex flex-col gap-1 overflow-hidden ${
                                      isAbsence
                                        ? 'bg-gradient-to-r from-red-500/60 to-orange-500/60 border border-red-500 text-red-50'
                                        : 'bg-gradient-to-r from-purple-500/60 to-indigo-500/60 border border-purple-500 text-purple-50'
                                    }`}
                                    onClick={() => handleEditEvent(event)}
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Supprimer cet événement ?")) {
                                          deleteRendezVousMutation.mutate(event.id);
                                        }
                                      }}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 hover:bg-red-600 rounded text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                    <div className="truncate text-[11px] font-bold opacity-90 uppercase">
                                      {isAbsence ? 'Absence' : 'Rendez-vous'}
                                    </div>
                                    <div className={`truncate font-bold text-sm ${
                                      isAbsence ? 'text-orange-300' : 'text-purple-300'
                                    }`}>{event.titre}</div>
                                    {event.date_fin && (
                                      <div className="truncate text-[11px] opacity-90">{format(displayStart, "HH:mm")} - {format(displayEnd, "HH:mm")}</div>
                                    )}
                                    {event.description && <div className="truncate text-[10px] opacity-75">{event.description}</div>}
                                    <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-white/20">
                                      <div className="truncate">Créé: {format(new Date(event.created_date), "dd/MM/yy")}</div>
                                      <div className="truncate">Modif: {format(new Date(event.updated_date), "dd/MM/yy")}</div>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-4">
                                  <div className="space-y-2">
                                    <div className="text-xs font-bold opacity-90 uppercase">
                                      {isAbsence ? 'Absence' : 'Rendez-vous'}
                                    </div>
                                    <div className={`font-bold text-base ${
                                      isAbsence ? 'text-orange-300' : 'text-purple-300'
                                    }`}>{event.titre}</div>
                                    {event.date_fin && (
                                      <div className="text-sm opacity-90">
                                        {format(displayStart, "HH:mm")} - {format(displayEnd, "HH:mm")}
                                      </div>
                                    )}
                                    {event.description && (
                                      <div className="text-sm opacity-75 whitespace-pre-wrap">{event.description}</div>
                                    )}
                                    <div className="pt-2 border-t border-white/20">
                                      <div className="text-xs opacity-60">
                                        <div>Créé: {format(new Date(event.created_date), "dd/MM/yy à HH:mm")}</div>
                                        <div>Modifié: {format(new Date(event.updated_date), "dd/MM/yy à HH:mm")}</div>
                                      </div>
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
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
              </div>
              {pointageCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {!pointageCollapsed && (
            <CardContent className="p-6">
              {/* Header avec navigation et contrôles */}
              <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-white font-semibold text-lg">
                      {viewMode === "week" 
                        ? `Semaine du ${format(getPointageWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getPointageWeekDays()[6], "d MMMM yyyy", { locale: fr })}`
                        : format(pointageCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(pointageCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)}
                    </div>
                    {viewMode === "month" && (() => {
                      const monthDays = getPointageMonthDays();
                      const totalInitial = monthDays.reduce((sum, day) => {
                        const dayPointages = getPointageForDate(day);
                        return sum + dayPointages.reduce((daySum, p) => {
                          const debut = new Date(p.heure_debut);
                          const fin = new Date(p.heure_fin);
                          return daySum + (fin - debut) / (1000 * 60 * 60);
                        }, 0);
                      }, 0);
                      const totalModifie = monthDays.reduce((sum, day) => {
                        const dayPointages = getPointageForDate(day);
                        return sum + dayPointages.reduce((daySum, p) => {
                          if (p.heure_debut_modifiee && p.heure_fin_modifiee) {
                            return daySum + (p.duree_heures_modifiee || 0);
                          } else {
                            const debut = new Date(p.heure_debut);
                            const fin = new Date(p.heure_fin);
                            return daySum + (fin - debut) / (1000 * 60 * 60);
                          }
                        }, 0);
                      }, 0);
                      return (
                        <div className="flex gap-3 items-center">
                          {totalInitial > 0 && (
                            <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
                              Initial: {totalInitial.toFixed(1)}h
                            </Badge>
                          )}
                          {totalModifie > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              Modifié: {totalModifie.toFixed(1)}h
                            </Badge>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      onClick={() => setIsAddingPointage(true)}
                      className="h-8 timesheet-add-button"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToPointagePrevious}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                    >
                      ← Précédent
                    </Button>
                    <Button
                      size="sm"
                      onClick={goToPointageToday}
                      className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 h-8"
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={goToPointageNext}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                    >
                      Suivant →
                    </Button>
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => setViewMode("week")}
                        className={`h-8 ${viewMode === "week" ? "timesheet-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                      >
                        Semaine
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setViewMode("month")}
                        className={`h-8 ${viewMode === "month" ? "timesheet-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                      >
                        Mois
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="grid w-full grid-cols-2 mb-6" style={{ display: 'none' }}>
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
                  <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 flex flex-col" style={{ height: '865px' }}>
                    <div className="overflow-x-auto flex-1 flex flex-col">
                      <div className="inline-block min-w-full h-full flex flex-col">
                        <div className="flex border-b border-slate-700 flex-shrink-0">
                          <div className="w-16 flex-shrink-0 border-r border-slate-700 bg-slate-900/50 flex items-center justify-center">
                            <div className="text-xs font-semibold text-emerald-400">Total</div>
                          </div>
                          {getPointageWeekDays().map((day, idx) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            return (
                            <div key={idx} className={`flex-1 text-center py-3 border-r border-slate-700 ${isToday ? 'bg-slate-900/50 ring-2 ring-emerald-500 ring-inset' : 'bg-slate-900/50'}`}>
                              <div className={`text-xs uppercase ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {format(day, "EEE", { locale: fr })}
                              </div>
                              <div className={`text-lg font-bold ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                                {format(day, "d", { locale: fr })}
                              </div>
                            </div>
                            );
                          })}
                        </div>

                        <div className="flex border-b border-slate-700 flex-shrink-0">
                          <div className="w-16 flex-shrink-0 border-r border-slate-700 bg-slate-800/50 flex items-center justify-center">
                            {(() => {
                              const weekDays = getPointageWeekDays();
                              const totalInitial = weekDays.reduce((sum, day) => {
                                const dayPointages = getPointageForDate(day);
                                return sum + dayPointages.reduce((daySum, p) => {
                                  const debut = new Date(p.heure_debut);
                                  const fin = new Date(p.heure_fin);
                                  return daySum + (fin - debut) / (1000 * 60 * 60);
                                }, 0);
                              }, 0);
                              const totalModifie = weekDays.reduce((sum, day) => {
                                const dayPointages = getPointageForDate(day);
                                return sum + dayPointages.reduce((daySum, p) => {
                                  if (p.heure_debut_modifiee && p.heure_fin_modifiee) {
                                    return daySum + (p.duree_heures_modifiee || 0);
                                  } else {
                                    const debut = new Date(p.heure_debut);
                                    const fin = new Date(p.heure_fin);
                                    return daySum + (fin - debut) / (1000 * 60 * 60);
                                  }
                                }, 0);
                              }, 0);
                              return (
                                <div className="text-center px-1">
                                  {totalInitial > 0 && (
                                    <div className="text-[10px] text-slate-400">Init: <span className="text-slate-300 font-semibold">{totalInitial.toFixed(1)}h</span></div>
                                  )}
                                  {totalModifie > 0 && (
                                    <div className="text-[10px] text-orange-400">Mod: <span className="text-orange-300 font-semibold">{totalModifie.toFixed(1)}h</span></div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          {getPointageWeekDays().map((day, idx) => {
                            const dayPointages = getPointageForDate(day);
                            const totalInitial = dayPointages.reduce((sum, p) => {
                              const debut = new Date(p.heure_debut);
                              const fin = new Date(p.heure_fin);
                              return sum + (fin - debut) / (1000 * 60 * 60);
                            }, 0);
                            const totalModifie = dayPointages.reduce((sum, p) => {
                              if (p.heure_debut_modifiee && p.heure_fin_modifiee) {
                                return sum + (p.duree_heures_modifiee || 0);
                              } else {
                                const debut = new Date(p.heure_debut);
                                const fin = new Date(p.heure_fin);
                                return sum + (fin - debut) / (1000 * 60 * 60);
                              }
                            }, 0);
                            
                            return (
                            <div key={`total-${idx}`} className="flex-1 border-r border-slate-700 bg-slate-800/50 px-2 py-2">
                              {totalInitial > 0 && (
                                <div className="text-xs text-slate-400">Initial: <span className="text-slate-300 font-semibold">{totalInitial.toFixed(1)}h</span></div>
                              )}
                              {totalModifie > 0 && (
                                <div className="text-xs text-orange-400">Modifié: <span className="text-orange-300 font-semibold">{totalModifie.toFixed(1)}h</span></div>
                              )}
                            </div>
                            );
                          })}
                        </div>

                        <div className="overflow-y-auto flex-1 relative" ref={weekScrollRef}>
                         <div className="flex relative" style={{ minHeight: '1440px' }}>
                           <div className="w-16 flex-shrink-0 sticky left-0 z-20 bg-slate-900/30">
                             {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                               <div key={hour} className="h-[60px] border-b border-slate-700/50 flex items-start">
                                 <div className="w-full border-r border-slate-700 px-2 py-2 text-xs text-slate-500 text-right">
                                   {hour.toString().padStart(2, '0')}:00
                                 </div>
                               </div>
                             ))}
                           </div>

                            {getPointageWeekDays().map((day, dayIdx) => {
                             const isToday = day.toDateString() === new Date().toDateString();
                             const dayEvents = getEventsForDate(day);
                             const dayPointages = getPointageForDate(day);

                             return (
                               <div key={dayIdx} className={`flex-1 border-r border-slate-700 relative ${isToday ? 'bg-emerald-500/10' : 'bg-slate-800/20'}`}>
                                 {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                   <div key={hour} className="h-[60px] border-b border-slate-700/50"></div>
                                 ))}

                                 {dayEvents.map(event => {
                                   const startTime = new Date(event.start.dateTime);
                                   const endTime = new Date(event.end.dateTime);
                                   const startHour = startTime.getHours();
                                   const startMin = startTime.getMinutes();
                                   const durationMinutes = (endTime - startTime) / (1000 * 60);
                                   const topPx = startHour * 60 + startMin;

                                   return (
                                     <div
                                       key={event.id}
                                       className="absolute left-1 right-1 bg-gradient-to-r from-emerald-500/60 to-teal-500/60 border border-emerald-500 rounded px-2 py-1 text-[10px] text-emerald-50 font-semibold z-10"
                                       style={{
                                         height: `${Math.max(20, durationMinutes)}px`,
                                         top: `${topPx}px`
                                       }}
                                     >
                                       <div className="truncate">{format(startTime, "HH:mm")}</div>
                                       <div className="truncate text-[9px] opacity-90">{event.subject}</div>
                                     </div>
                                   );
                                 })}

                                 {dayPointages.map(p => {
                                  const isModified = p.heure_debut_modifiee && p.heure_fin_modifiee;

                                  const startTime = isModified ? new Date(p.heure_debut_modifiee) : new Date(p.heure_debut);
                                  const endTime = isModified ? new Date(p.heure_fin_modifiee) : new Date(p.heure_fin);
                                  const startHour = startTime.getHours();
                                  const startMin = startTime.getMinutes();
                                  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                                  const topPx = startHour * 60 + startMin;

                                  const initialStart = new Date(p.heure_debut);
                                  const initialEnd = new Date(p.heure_fin);
                                  const initialDuration = (initialEnd.getTime() - initialStart.getTime()) / (1000 * 60 * 60);
                                  const modifiedDuration = isModified ? (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) : null;

                                  return (
                                    <Tooltip key={`display-${p.id}`}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`absolute left-1 right-1 rounded px-2 py-2 font-semibold z-20 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden flex flex-col ${
                                            isModified
                                              ? 'bg-gradient-to-r from-orange-500/60 to-amber-500/60 border border-orange-500 text-orange-50'
                                              : p.confirme 
                                              ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/60 border border-green-500 text-green-50'
                                              : 'bg-gradient-to-r from-blue-500/60 to-indigo-500/60 border border-blue-500 text-blue-50'
                                          }`}
                                          onClick={() => handleOpenEditPointage(p)}
                                          style={{
                                            height: `${totalMinutes}px`,
                                            top: `${topPx}px`
                                          }}
                                        >
                                          {isModified && <div className="text-[12px] font-bold mb-1">MODIFIÉ</div>}
                                          {p.confirme && !isModified && <div className="text-[12px] font-bold mb-1">CONFIRMÉ</div>}
                                          <div className="text-[11px] leading-tight">
                                            <div className={isModified ? "opacity-50 text-slate-300" : (p.confirme ? "opacity-90 text-green-400" : "opacity-50 text-slate-300")}>Initial: {format(initialStart, "HH:mm")} - {format(initialEnd, "HH:mm")} ({initialDuration.toFixed(1)}h)</div>
                                            {isModified && (
                                              <div className="opacity-90 text-orange-400 mt-1">Modifié: {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")} ({p.duree_heures_modifiee?.toFixed(1)}h)</div>
                                            )}
                                            {p.description && <div className="opacity-85 mt-1 text-wrap break-words"><span className="opacity-75">Raison:</span> {p.description}</div>}
                                          </div>
                                          {!p.confirme && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleConfirmPointage(p);
                                              }}
                                              className="text-[9px] px-1 py-0.5 bg-white/30 hover:bg-white/50 rounded transition-colors mt-1 leading-none"
                                            >
                                              Confirmer
                                            </button>
                                          )}
                                          {p.confirme && !isModified && (
                                            <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-green-400/30">
                                              Confirmé: {format(new Date(p.updated_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                                            </div>
                                          )}
                                          {isModified && (
                                            <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-orange-400/30">
                                              Dernière modification: {format(new Date(p.updated_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-4">
                                        <div className="space-y-2">
                                          <div className={`text-xs font-bold uppercase ${isModified ? 'text-orange-400' : p.confirme ? 'text-green-400' : 'text-blue-400'}`}>
                                            {isModified ? 'Pointage modifié' : p.confirme ? 'Pointage confirmé' : 'Pointage en attente'}
                                          </div>
                                          <div className="text-sm text-slate-300">
                                            <div>Initial: <span className="text-white font-semibold">{format(initialStart, "HH:mm")} – {format(initialEnd, "HH:mm")}</span> <span className="text-slate-400">({initialDuration.toFixed(1)}h)</span></div>
                                            {isModified && (
                                              <div className="mt-1">Modifié: <span className="text-orange-300 font-semibold">{format(startTime, "HH:mm")} – {format(endTime, "HH:mm")}</span> <span className="text-slate-400">({modifiedDuration?.toFixed(1)}h)</span></div>
                                            )}
                                          </div>
                                          {p.description && (
                                            <div className="text-sm opacity-75 whitespace-pre-wrap border-t border-white/10 pt-2">{p.description}</div>
                                          )}
                                          <div className="pt-2 border-t border-white/20">
                                            <div className="text-xs opacity-60">
                                              {p.confirme && <div>Confirmé: {format(new Date(p.updated_date), "dd/MM/yy à HH:mm")}</div>}
                                              {isModified && <div>Modifié: {format(new Date(p.updated_date), "dd/MM/yy à HH:mm")}</div>}
                                            </div>
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                 })}
                                 </div>
                                 );
                                 })}
                                 </div>
                                 </div>
                                 </div>
                                 </div>
                                 </div>
                                 </TabsContent>

                <TabsContent value="month" className="space-y-3">
                  <div className="grid grid-cols-5 w-full" style={{ gap: '2px' }}>
                    {getPointageMonthDays().map((day, index) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                      const dayPointages = getPointageForDate(day);
                      const totalInitial = dayPointages.reduce((sum, p) => {
                        const debut = new Date(p.heure_debut);
                        const fin = new Date(p.heure_fin);
                        return sum + (fin - debut) / (1000 * 60 * 60);
                      }, 0);
                      const totalModifie = dayPointages.reduce((sum, p) => {
                        if (p.heure_debut_modifiee && p.heure_fin_modifiee) {
                          return sum + (p.duree_heures_modifiee || 0);
                        } else {
                          const debut = new Date(p.heure_debut);
                          const fin = new Date(p.heure_fin);
                          return sum + (fin - debut) / (1000 * 60 * 60);
                        }
                      }, 0);

                      return (
                        <Card 
                          key={dateStr}
                          className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-emerald-500' : ''} w-full`}
                        >
                          <div className="mb-2 w-full">
                            <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-emerald-500' : ''} w-full`}>
                              <div className="flex items-center justify-center mb-1">
                                <div className="flex-1">
                                  <p className={`text-xs uppercase ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {format(day, "EEE", { locale: fr })}
                                  </p>
                                  <p className={`text-lg font-bold ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                                    {format(day, "d", { locale: fr })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 flex-1 overflow-y-auto text-center px-1">
                            {totalInitial > 0 && (
                              <div className="text-xs text-slate-400">Init: <span className="text-slate-300 font-semibold">{totalInitial.toFixed(1)}h</span></div>
                            )}
                            {totalModifie > 0 && (
                              <div className="text-xs text-orange-400">Mod: <span className="text-orange-300 font-semibold">{totalModifie.toFixed(1)}h</span></div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>

        {/* Section Entrée de temps */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <div 
            className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-2 px-3 bg-emerald-900/20 border-b border-slate-800"
            onClick={() => setEntreeTempsCollapsed(!entreeTempsCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-emerald-400" />
                </div>
                <h3 className="text-emerald-300 text-sm font-semibold">Entrée de temps</h3>
              </div>
              {entreeTempsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {!entreeTempsCollapsed && (
            <CardContent className="p-6">
              {/* Header avec navigation et contrôles */}
              <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-white font-semibold text-lg">
                      {entreeTempsTab === "semaine"
                        ? `Semaine du ${format(getEntreeTempsWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getEntreeTempsWeekDays()[6], "d MMMM yyyy", { locale: fr })}`
                        : entreeTempsTab === "mois"
                        ? format(entreeTempsCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(entreeTempsCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)
                        : "Toutes les entrées"}
                    </div>
                    {entreeTempsTab === "semaine" && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Total: {getEntreeTempsWeekDays().reduce((sum, day) => {
                          const dayEntries = getEntreeTempsForDate(day);
                          return sum + dayEntries.reduce((s, e) => s + (e.heures || 0), 0);
                        }, 0).toFixed(1)}h
                      </Badge>
                    )}
                    {entreeTempsTab === "mois" && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Total: {getEntreeTempsMonthDays().reduce((sum, day) => {
                          const dayEntries = getEntreeTempsForDate(day);
                          return sum + dayEntries.reduce((s, e) => s + (e.heures || 0), 0);
                        }, 0).toFixed(1)}h
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    {entreeTempsTab !== "tous" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={goToEntreeTemPrevious}
                          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                        >
                          ← Précédent
                        </Button>
                        <Button
                          size="sm"
                          onClick={goToEntreeTempsToday}
                          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 h-8"
                        >
                          Aujourd'hui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={goToEntreeTempsNext}
                          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                        >
                          Suivant →
                        </Button>
                        <div className="h-6 w-px bg-slate-700 mx-1"></div>
                      </>
                    )}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => setEntreeTempsTab("semaine")}
                        className={entreeTempsTab === "semaine" ? "bg-emerald-500/20 text-emerald-400 h-8" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"}
                      >
                        Semaine
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setEntreeTempsTab("mois")}
                        className={entreeTempsTab === "mois" ? "bg-emerald-500/20 text-emerald-400 h-8" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"}
                      >
                        Mois
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setEntreeTempsTab("tous")}
                        className={entreeTempsTab === "tous" ? "bg-emerald-500/20 text-emerald-400 h-8" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"}
                      >
                        Tous
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vue Semaine */}
              {entreeTempsTab === "semaine" && (
                <div className="space-y-2">
                  {/* En-têtes des colonnes */}
                  <div className="grid grid-cols-[1fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 mb-3">
                    <div className="text-xs font-semibold text-slate-400">N° Dossier</div>
                    <div className="text-xs font-semibold text-slate-400">Client</div>
                    <div className="text-xs font-semibold text-slate-400">Mandat</div>
                    <div className="text-xs font-semibold text-slate-400">Tâche</div>
                    <div className="text-xs font-semibold text-slate-400 text-right">Temps</div>
                  </div>
                  {getEntreeTempsWeekDays().map(day => {
                    const dayEntries = getEntreeTempsForDate(day);
                    const totalHours = dayEntries.reduce((sum, e) => sum + (e.heures || 0), 0);
                    const dateStr = day.toISOString().split('T')[0];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div key={dateStr} className={`border border-slate-700 rounded-lg overflow-hidden ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
                        <div className="bg-slate-800/50 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-xs ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                              {format(day, "EEE d MMM", { locale: fr })}
                            </span>
                          </div>
                          {totalHours > 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              {totalHours.toFixed(1)}h
                            </Badge>
                          )}
                        </div>
                        
                        {dayEntries.length > 0 ? (
                          <div className="divide-y divide-slate-800">
                            {dayEntries.map((entree) => {
                              const dossier = dossiers.find(d => d.id === entree.dossier_id);
                              return (
                                <div key={entree.id} className="px-3 py-2 hover:bg-slate-800/30 transition-colors">
                                  <div className="grid grid-cols-[1fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 items-center">
                                    <div>
                                      {dossier && (
                                        <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                                          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-slate-400 text-xs truncate">
                                      {dossier ? getClientsNames(dossier.clients_ids) : "-"}
                                    </div>
                                    <div>
                                      {entree.mandat && (
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                                          {entree.mandat}
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                                        {entree.tache}
                                      </Badge>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-emerald-400 font-bold text-sm">{entree.heures}h</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-3 text-center text-slate-500 text-xs">
                            Aucune entrée
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Vue Mois */}
              {entreeTempsTab === "mois" && (
                <div className="space-y-2">
                  {/* En-têtes des colonnes */}
                  <div className="grid grid-cols-[1fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 mb-3">
                    <div className="text-xs font-semibold text-slate-400">N° Dossier</div>
                    <div className="text-xs font-semibold text-slate-400">Client</div>
                    <div className="text-xs font-semibold text-slate-400">Mandat</div>
                    <div className="text-xs font-semibold text-slate-400">Tâche</div>
                    <div className="text-xs font-semibold text-slate-400 text-right">Temps</div>
                  </div>
                  {getEntreeTempsMonthDays().map(day => {
                    const dayEntries = getEntreeTempsForDate(day);
                    const totalHours = dayEntries.reduce((sum, e) => sum + (e.heures || 0), 0);
                    const dateStr = day.toISOString().split('T')[0];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    if (dayEntries.length === 0) return null;
                    
                    return (
                      <div key={dateStr} className={`border border-slate-700 rounded-lg overflow-hidden ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
                        <div className="bg-slate-800/50 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-xs ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                              {format(day, "EEE d MMM", { locale: fr })}
                            </span>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            {totalHours.toFixed(1)}h
                          </Badge>
                        </div>
                        
                        <div className="divide-y divide-slate-800">
                          {dayEntries.map((entree) => {
                            const dossier = dossiers.find(d => d.id === entree.dossier_id);
                            return (
                              <div key={entree.id} className="px-3 py-2 hover:bg-slate-800/30 transition-colors">
                                <div className="grid grid-cols-[1fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 items-center">
                                  <div>
                                    {dossier && (
                                      <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                                        {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-slate-400 text-xs truncate">
                                    {dossier ? getClientsNames(dossier.clients_ids) : "-"}
                                  </div>
                                  <div>
                                    {entree.mandat && (
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                                        {entree.mandat}
                                      </Badge>
                                    )}
                                  </div>
                                  <div>
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                                      {entree.tache}
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-emerald-400 font-bold text-sm">{entree.heures}h</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Vue Tous */}
              {entreeTempsTab === "tous" && (
                <div className="space-y-2">
                  {/* En-têtes des colonnes */}
                  <div className="grid grid-cols-[1fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 mb-3">
                    <div className="text-xs font-semibold text-slate-400">N° Dossier</div>
                    <div className="text-xs font-semibold text-slate-400">Client</div>
                    <div className="text-xs font-semibold text-slate-400">Mandat</div>
                    <div className="text-xs font-semibold text-slate-400">Tâche</div>
                    <div className="text-xs font-semibold text-slate-400 text-right">Temps</div>
                  </div>
                  {sortedDates.map(date => {
                    const dayEntries = groupedEntrees[date];
                    const totalHours = calculateTotalHours(date);
                    const dateStr = date;
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    return (
                      <div key={date} className={`border border-slate-700 rounded-lg overflow-hidden ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
                        <div className="bg-slate-800/50 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-xs ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                              {format(new Date(date + 'T00:00:00'), "EEE d MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                            {totalHours.toFixed(1)}h
                          </Badge>
                        </div>
                        
                        <div className="divide-y divide-slate-800">
                          {dayEntries.map((entree) => {
                            const dossier = dossiers.find(d => d.id === entree.dossier_id);
                            return (
                              <div key={entree.id} className="px-3 py-2 hover:bg-slate-800/30 transition-colors">
                                <div className="grid grid-cols-[1fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 items-center">
                                  <div>
                                    {dossier && (
                                      <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                                        {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-slate-400 text-xs truncate">
                                    {dossier ? getClientsNames(dossier.clients_ids) : "-"}
                                  </div>
                                  <div>
                                    {entree.mandat && (
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs">
                                        {entree.mandat}
                                      </Badge>
                                    )}
                                  </div>
                                  <div>
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                                      {entree.tache}
                                    </Badge>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-emerald-400 font-bold text-sm">{entree.heures}h</span>
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
                    </div>
                  )}
                </div>
              )}
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

        {/* Add Pointage Dialog */}
        <Dialog open={isAddingPointage} onOpenChange={(open) => {
          setIsAddingPointage(open);
          if (!open) {
            setAddPointageForm({
              date: new Date().toISOString().split('T')[0],
              heure_debut: "",
              heure_fin: "",
              description: ""
            });
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Ajouter une entrée de pointage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAddPointage} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Date <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={addPointageForm.date}
                  onChange={(e) => setAddPointageForm({...addPointageForm, date: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Heure de départ <span className="text-red-400">*</span></Label>
                  <Input
                    type="time"
                    value={addPointageForm.heure_debut}
                    onChange={(e) => setAddPointageForm({...addPointageForm, heure_debut: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Heure de fin <span className="text-red-400">*</span></Label>
                  <Input
                    type="time"
                    value={addPointageForm.heure_fin}
                    onChange={(e) => setAddPointageForm({...addPointageForm, heure_fin: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Description <span className="text-red-400">*</span></Label>
                <textarea
                  value={addPointageForm.description}
                  onChange={(e) => setAddPointageForm({...addPointageForm, description: e.target.value})}
                  placeholder="Description de l'activité..."
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full text-sm"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingPointage(false)}
                  disabled={createPointageMutation.isPending}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  disabled={createPointageMutation.isPending}
                >
                  {createPointageMutation.isPending ? 'Ajout...' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Pointage Dialog */}
        <Dialog open={!!editingPointage} onOpenChange={(open) => !open && setEditingPointage(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier l'entrée de pointage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitEditPointage} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Date</Label>
                <Input
                  type="date"
                  value={editPointageForm.date}
                  onChange={(e) => setEditPointageForm({...editPointageForm, date: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Heure de départ</Label>
                  <Input
                    type="time"
                    value={editPointageForm.heure_debut}
                    onChange={(e) => setEditPointageForm({...editPointageForm, heure_debut: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Heure de fin</Label>
                  <Input
                    type="time"
                    value={editPointageForm.heure_fin}
                    onChange={(e) => setEditPointageForm({...editPointageForm, heure_fin: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-sm">Description <span className="text-red-400">*</span></Label>
                <textarea
                  value={editPointageForm.description}
                  onChange={(e) => setEditPointageForm({...editPointageForm, description: e.target.value})}
                  placeholder="Description de l'activité..."
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full text-sm"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPointage(null)}
                  disabled={updatePointageMutation.isPending}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  disabled={updatePointageMutation.isPending}
                >
                  {updatePointageMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Event Dialog */}
        <Dialog open={isAddingEvent} onOpenChange={(open) => {
          setIsAddingEvent(open);
          if (!open) {
            setEditingEvent(null);
            setEventForm({
              titre: "",
              description: "",
              date_debut: "",
              heure_debut: "",
              date_fin: "",
              heure_fin: "",
              type: "rendez-vous"
            });
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingEvent ? "Modifier l'événement" : "Ajouter un événement"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitEvent} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => setEventForm({...eventForm, type: "rendez-vous"})}
                    className={eventForm.type === "rendez-vous" ? "bg-purple-500/20 text-purple-400 flex-1" : "bg-slate-800 text-white flex-1"}
                  >
                    Rendez-vous
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setEventForm({...eventForm, type: "absence"})}
                    className={eventForm.type === "absence" ? "bg-red-500/20 text-red-400 flex-1" : "bg-slate-800 text-white flex-1"}
                  >
                    Absence
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Titre <span className="text-red-400">*</span></Label>
                <Input
                  value={eventForm.titre}
                  onChange={(e) => setEventForm({...eventForm, titre: e.target.value})}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Ex: Rendez-vous client, Vacances..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  placeholder="Description..."
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full text-sm"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date de début <span className="text-red-400">*</span></Label>
                  <Input
                    type="date"
                    value={eventForm.date_debut}
                    onChange={(e) => setEventForm({...eventForm, date_debut: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure <span className="text-red-400">*</span></Label>
                  <Input
                    type="time"
                    value={eventForm.heure_debut}
                    onChange={(e) => setEventForm({...eventForm, heure_debut: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={eventForm.date_fin}
                    onChange={(e) => setEventForm({...eventForm, date_fin: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure de fin</Label>
                  <Input
                    type="time"
                    value={eventForm.heure_fin}
                    onChange={(e) => setEventForm({...eventForm, heure_fin: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingEvent(false)}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/50 font-semibold border-2 border-purple-400 text-purple-100"
                >
                  {editingEvent ? 'Modifier' : 'Ajouter'}
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
    </TooltipProvider>
  );
}