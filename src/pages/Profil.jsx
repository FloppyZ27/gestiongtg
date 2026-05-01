import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, User, Mail, Phone, MapPin, Briefcase, Upload, Edit, Cake, ChevronUp, ChevronDown, Loader2, Play, Square, Timer, UserCircle, CalendarDays, Plus, Trash2, Palmtree, Heart, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import AgendaSection from "@/components/profil/AgendaSection";
import FeuilleTempsSection from "@/components/profil/FeuilleTempsSection";
import EntreeTempsDialog from "@/components/shared/EntreeTempsDialog";
import AddressSearchInput from "@/components/profil/AddressSearchInput";
import TimeInput12h from "@/components/profil/TimeInput12h";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = { "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
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
    description: "",
    type: "Pointage",
    multiplicateur: "1"
  });
  const [addPointageForm, setAddPointageForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heure_debut: "",
    heure_fin: "",
    description: "",
    type: "Pointage",
    multiplicateur: "1"
  });
  const weekScrollRef = useRef(null);

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
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 500),
    initialData: [],
    enabled: !!user,
  });

  const { data: pointages = [] } = useQuery({
    queryKey: ['pointages', user?.email],
    queryFn: () => base44.entities.Pointage.filter({ utilisateur_email: user?.email }, '-date', 50),
    initialData: [],
    enabled: !!user,
  });

  const { data: soldesConges = [] } = useQuery({
    queryKey: ['soldesConges'],
    queryFn: () => base44.entities.SoldeConges.list(),
    initialData: [],
  });

  const { data: entreeTempsConges = [] } = useQuery({
    queryKey: ['entreeTempsConges', user?.email],
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 500),
    initialData: [],
    enabled: !!user,
  });

  const soldeBase = soldesConges.find(s => s.utilisateur_email === user?.email) || {};
  const currentYear = new Date().getFullYear();
  const entreesCongesAnnee = entreeTempsConges.filter(e =>
    ['Vacances', 'Mieux-Être', 'Mieux-etre', 'En banque'].includes(e.tache) &&
    e.date?.startsWith(String(currentYear))
  );
  const usedVacances = entreesCongesAnnee.filter(e => e.tache === 'Vacances').reduce((s, e) => s + (e.heures || 0), 0);
  const usedMieuxEtre = entreesCongesAnnee.filter(e => e.tache === 'Mieux-Être' || e.tache === 'Mieux-etre').reduce((s, e) => s + (e.heures || 0), 0);
  const usedEnBanque = entreesCongesAnnee.filter(e => e.tache === 'En banque').reduce((s, e) => s + (e.heures || 0), 0);
  const soldeRestant = {
    vacances: Math.max(0, (soldeBase.heures_vacances ?? 0) - usedVacances),
    mieuxEtre: Math.max(0, (soldeBase.heures_mieux_etre ?? 0) - usedMieuxEtre),
    enBanque: Math.max(0, (soldeBase.heures_en_banque ?? 0) - usedEnBanque),
  };

  const getMsDateRange = () => {
    const year = agendaCurrentDate.getFullYear();
    const month = agendaCurrentDate.getMonth();
    const startDateTime = new Date(year, month - 1, 1).toISOString();
    const endDateTime = new Date(year, month + 2, 0).toISOString();
    return { startDateTime, endDateTime };
  };

  const { data: microsoftEvents = [], refetch: refetchMsEvents, isFetching: isMsLoading } = useQuery({
    queryKey: ['microsoftCalendarEvents', user?.email, agendaCurrentDate.getFullYear(), agendaCurrentDate.getMonth()],
    queryFn: async () => {
      const range = getMsDateRange();
      const response = await base44.functions.invoke('getMicrosoftCalendarEvents', range);
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

  // Scroll à 6h au chargement de la vue semaine
  useEffect(() => {
    if (viewMode === "week" && !pointageCollapsed) {
      setTimeout(() => {
        if (weekScrollRef.current) {
          weekScrollRef.current.scrollTop = 6 * 60; // 6 heures * 60px par heure
        }
      }, 100);
    }
  }, [viewMode, pointageCollapsed]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
        description: "",
        type: "Pointage",
        multiplicateur: "1"
      });
      },
      });

  const createRendezVousMutation = useMutation({
    mutationFn: async (data) => {
      // Create in app DB
      const created = await base44.entities.RendezVous.create({ ...data, utilisateur_email: user?.email, source: 'app' });
      // Sync to Microsoft Calendar
      try {
        const res = await base44.functions.invoke('syncMicrosoftCalendarEvent', { action: 'create', event: data });
        if (res.data?.msEventId) {
          await base44.entities.RendezVous.update(created.id, { ms_event_id: res.data.msEventId });
        }
      } catch (e) { /* silent */ }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['microsoftCalendarEvents'] });
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
    mutationFn: async ({ id, data }) => {
      const updated = await base44.entities.RendezVous.update(id, data);
      try {
        const existing = rendezVous.find(r => r.id === id);
        await base44.functions.invoke('syncMicrosoftCalendarEvent', {
          action: existing?.ms_event_id ? 'update' : 'create',
          event: data,
          msEventId: existing?.ms_event_id
        });
      } catch (e) { /* silent */ }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['microsoftCalendarEvents'] });
      setIsAddingEvent(false);
      setEditingEvent(null);
    },
  });

  const deleteRendezVousMutation = useMutation({
    mutationFn: async (id) => {
      const existing = rendezVous.find(r => r.id === id);
      await base44.entities.RendezVous.delete(id);
      // Sync deletion to Microsoft Calendar
      if (existing?.ms_event_id) {
        try {
          await base44.functions.invoke('syncMicrosoftCalendarEvent', {
            action: 'delete',
            msEventId: existing.ms_event_id
          });
        } catch (e) { /* silent */ }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['microsoftCalendarEvents'] });
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
      const fullName = `${profileForm.prenom} ${profileForm.nom}`.trim();
      await updateProfileMutation.mutateAsync({
        prenom: profileForm.prenom,
        nom: profileForm.nom,
        full_name: fullName,
        date_naissance: profileForm.date_naissance,
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
    
    let heureDebut, heureFin, date;
    
    if (hasModification) {
      const debutMod = new Date(pointage.heure_debut_modifiee);
      const finMod = new Date(pointage.heure_fin_modifiee);
      heureDebut = debutMod.toTimeString().slice(0, 5);
      heureFin = finMod.toTimeString().slice(0, 5);
      date = pointage.date;
    } else {
      const debut = pointage.heure_debut ? new Date(pointage.heure_debut) : null;
      const fin = pointage.heure_fin ? new Date(pointage.heure_fin) : null;
      heureDebut = debut ? debut.toTimeString().slice(0, 5) : "";
      heureFin = fin ? fin.toTimeString().slice(0, 5) : "";
      date = pointage.date || "";
    }

    setEditPointageForm({
      date: date,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      description: pointage.description || "",
      type: pointage.type || "Pointage",
      multiplicateur: String(pointage.multiplicateur || "1")
    });
    setEditingPointage(pointage);
  };

  const handleSubmitEditPointage = async (e) => {
    e.preventDefault();

    const [heureD, minD] = editPointageForm.heure_debut.split(':');
    const [heureF, minF] = editPointageForm.heure_fin.split(':');
    
    const debut = new Date(editPointageForm.date);
    debut.setHours(parseInt(heureD), parseInt(minD), 0);
    
    const fin = new Date(editPointageForm.date);
    fin.setHours(parseInt(heureF), parseInt(minF), 0);
    
    const dureeHeuresModifiee = parseFloat(((fin - debut) / (1000 * 60 * 60)).toFixed(2));

    await updatePointageMutation.mutateAsync({
      id: editingPointage.id,
      data: {
        ...editingPointage,
        date: editPointageForm.date,
        heure_debut_modifiee: debut.toISOString(),
        heure_fin_modifiee: fin.toISOString(),
        duree_heures_modifiee: dureeHeuresModifiee,
        description: editPointageForm.description,
        type: editPointageForm.type || "Pointage",
        multiplicateur: parseFloat(editPointageForm.multiplicateur || 1),
        confirme: true
      }
    });

    // Si type de congé, mettre à jour l'EntreeTemps correspondante pour ajuster le solde
    const typeToTache = {
      'Vacance': 'Vacances',
      'Mieux-Être': 'Mieux-Être',
      'En banque': 'En banque',
    };
    const ancienType = editingPointage.type;
    const nouveauType = editPointageForm.type;
    const ancienneTache = typeToTache[ancienType];
    const nouvelleTache = typeToTache[nouveauType];

    // Chercher l'EntreeTemps existante liée à ce pointage (même date, tache de congé, même user)
    const dateOriginal = editingPointage.date;
    if (ancienneTache || nouvelleTache) {
      const entreesLiees = await base44.entities.EntreeTemps.filter({
        utilisateur_email: user?.email,
        date: dateOriginal,
      });

      const entreeExistante = entreesLiees.find(e => e.tache === ancienneTache && !e.dossier_id);

      if (entreeExistante) {
        if (nouvelleTache) {
          // Mettre à jour la durée et la tâche si le type a changé
          await base44.entities.EntreeTemps.update(entreeExistante.id, {
            ...entreeExistante,
            heures: dureeHeuresModifiee,
            tache: nouvelleTache,
            date: editPointageForm.date,
            description: editPointageForm.description,
          });
        } else {
          // Le nouveau type n'est plus un congé → supprimer l'EntreeTemps de congé
          await base44.entities.EntreeTemps.delete(entreeExistante.id);
        }
      } else if (nouvelleTache) {
        // Pas d'EntreeTemps existante mais le nouveau type est un congé → en créer une
        await base44.entities.EntreeTemps.create({
          date: editPointageForm.date,
          heures: dureeHeuresModifiee,
          tache: nouvelleTache,
          description: editPointageForm.description,
          utilisateur_email: user?.email,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['entreeTemps', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['entreeTempsConges', user?.email] });
    }
  };

  const handleSubmitAddPointage = async (e) => {
    e.preventDefault();
    
    const [heureD, minD] = addPointageForm.heure_debut.split(':');
    const [heureF, minF] = addPointageForm.heure_fin.split(':');
    
    const debut = new Date(addPointageForm.date);
    debut.setHours(parseInt(heureD), parseInt(minD), 0);
    
    const fin = new Date(addPointageForm.date);
    fin.setHours(parseInt(heureF), parseInt(minF), 0);
    
    const dureeHeures = parseFloat(((fin - debut) / (1000 * 60 * 60)).toFixed(2));

    createPointageMutation.mutate({
      date: addPointageForm.date,
      heure_debut: debut.toISOString(),
      heure_fin: fin.toISOString(),
      duree_heures: dureeHeures,
      description: addPointageForm.description,
      type: addPointageForm.type,
      multiplicateur: parseFloat(addPointageForm.multiplicateur || 1),
      confirme: true
    });

    // Si type de congé, créer une EntreeTemps pour soustraire du solde
    const typeToTache = {
      'Vacance': 'Vacances',
      'Mieux-Être': 'Mieux-Être',
      'En banque': 'En banque',
      'Banque': 'En banque',
    };
    const tache = typeToTache[addPointageForm.type];
    if (tache && dureeHeures > 0) {
      await base44.entities.EntreeTemps.create({
        date: addPointageForm.date,
        heures: dureeHeures,
        tache: tache,
        description: addPointageForm.description,
        utilisateur_email: user?.email,
      });
      queryClient.invalidateQueries({ queryKey: ['entreeTemps', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['entreeTempsConges', user?.email] });
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
    const embaucheDate = new Date(user.date_embauche + 'T00:00:00');
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
    return entreeTemps.filter(e => e.date === dateStr && e.dossier_id);
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
    const sunday = new Date(pointageCurrentDate);
    sunday.setDate(pointageCurrentDate.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
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

  // Merge app rendez-vous + MS-only events (not yet in app)
  const getMergedEventsForDate = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const appEvents = rendezVous.filter(rv => {
      const eventStart = new Date(rv.date_debut);
      const eventEnd = new Date(rv.date_fin || rv.date_debut);
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });

    // MS events not already tracked in app
    const appMsIds = new Set(rendezVous.map(r => r.ms_event_id).filter(Boolean));
    const msOnlyEvents = microsoftEvents
      .filter(msEv => !appMsIds.has(msEv.id))
      .filter(msEv => {
        const start = new Date(msEv.start?.dateTime || msEv.start?.date);
        const end = new Date(msEv.end?.dateTime || msEv.end?.date);
        return start <= dayEnd && end >= dayStart;
      })
      .map(msEv => ({
        id: `ms_${msEv.id}`,
        ms_event_id: msEv.id,
        titre: msEv.subject || '(Sans titre)',
        description: msEv.bodyPreview || '',
        date_debut: msEv.start?.dateTime || msEv.start?.date,
        date_fin: msEv.end?.dateTime || msEv.end?.date,
        type: 'rendez-vous',
        source: 'microsoft',
        created_date: msEv.createdDateTime,
        updated_date: msEv.lastModifiedDateTime,
      }));

    return [...appEvents, ...msOnlyEvents];
  };

  const getRendezVousForDate = (date) => getMergedEventsForDate(date);

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
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Mon Profil
              </h1>
              <UserCircle className="w-8 h-8 text-blue-400 flex-shrink-0" />
            </div>
            <p className="text-slate-400">Gérez vos informations personnelles et professionnelles</p>
          </div>
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

                  {/* Ligne 2: Date anniversaire, Date embauche, Poste, Équipe */}
                  <div className="grid grid-cols-4 gap-x-6 gap-y-2">
                    <div>
                      <Label className="text-slate-400 text-xs">Date d'anniversaire</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-1">
                        <Cake className="w-3 h-3 text-slate-500" />
                        {user?.date_naissance ? format(new Date(user.date_naissance + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Date d'embauche</Label>
                      <p className="text-white font-medium text-sm flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-500" />
                        {user?.date_embauche ? format(new Date(user.date_embauche + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}
                        {user?.date_embauche && <span className="text-slate-400 text-xs">({calculateSeniority()})</span>}
                      </p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Poste</Label>
                      <p className="text-white font-medium text-sm">{user?.poste || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-xs">Équipe de travail</Label>
                      <p className="text-white font-medium text-sm">{user?.equipe || "-"}</p>
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
        <AgendaSection 
           agendaCollapsed={agendaCollapsed}
           setAgendaCollapsed={setAgendaCollapsed}
           agendaViewMode={agendaViewMode}
           setAgendaViewMode={setAgendaViewMode}
           agendaCurrentDate={agendaCurrentDate}
           setIsAddingEvent={setIsAddingEvent}
           goToAgendaPrevious={goToAgendaPrevious}
           goToAgendaToday={goToAgendaToday}
           goToAgendaNext={goToAgendaNext}
           getAgendaWeekDays={getAgendaWeekDays}
           getAgendaMonthDays={getAgendaMonthDays}
           getRendezVousForDate={getRendezVousForDate}
           handleEditEvent={handleEditEvent}
           deleteRendezVousMutation={deleteRendezVousMutation}
           refetchMsEvents={refetchMsEvents}
           isMsLoading={isMsLoading}
         />

        {/* Section Feuille de temps (Pointage) - Utilisation du composant */}
         <FeuilleTempsSection
           pointageCollapsed={pointageCollapsed}
           setPointageCollapsed={setPointageCollapsed}
           viewMode={viewMode}
           setViewMode={setViewMode}
           pointageCurrentDate={pointageCurrentDate}
           setIsAddingPointage={setIsAddingPointage}
           goToPointagePrevious={goToPointagePrevious}
           goToPointageToday={goToPointageToday}
           goToPointageNext={goToPointageNext}
           getPointageWeekDays={getPointageWeekDays}
           getPointageMonthDays={getPointageMonthDays}
           getPointageForDate={getPointageForDate}
           getEventsForDate={getEventsForDate}
           handleOpenEditPointage={handleOpenEditPointage}
           handleConfirmPointage={handleConfirmPointage}
           weekScrollRef={weekScrollRef}
         />

        {/* Section Entrée de temps */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <div
            className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-2 px-3 bg-orange-900/20 border-b border-slate-800"
            onClick={() => setEntreeTempsCollapsed(!entreeTempsCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-orange-500/30 flex items-center justify-center">
                  <Timer className="w-3 h-3 text-orange-400" />
                </div>
                <h3 className="text-orange-300 text-sm font-semibold">Entrée de temps</h3>
              </div>
              {entreeTempsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {!entreeTempsCollapsed && (
            <CardContent className="p-6">
              {/* Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToEntreeTemPrevious} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8">← Précédent</Button>
                  <Button size="sm" onClick={goToEntreeTempsToday} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 h-8">Aujourd'hui</Button>
                  <Button variant="outline" size="sm" onClick={goToEntreeTempsNext} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8">Suivant →</Button>
                </div>
                <div className="flex gap-1">
                  {["semaine", "mois"].map(tab => (
                    <Button
                      key={tab}
                      size="sm"
                      onClick={() => setEntreeTempsTab(tab)}
                      className={`h-8 capitalize ${entreeTempsTab === tab ? "bg-orange-500/30 text-orange-300 border border-orange-500/50" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`}
                    >
                      {tab === "semaine" ? "Semaine" : "Mois"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Label période */}
              <div className="text-slate-300 font-semibold text-base mb-3">
                {entreeTempsTab === "semaine"
                  ? `Semaine du ${format(getEntreeTempsWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getEntreeTempsWeekDays()[6], "d MMMM yyyy", { locale: fr })}`
                  : format(entreeTempsCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(entreeTempsCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)
                }
              </div>

              {/* Liste des jours avec entrées */}
              <div className="space-y-2">
                {/* En-tête colonnes */}
                <div className="grid grid-cols-12 gap-2 px-4 py-1 text-xs font-semibold text-slate-300 border-b border-slate-700">
                  <div className="col-span-2">N° Dossier</div>
                  <div className="col-span-3">Clients</div>
                  <div className="col-span-2">Mandat</div>
                  <div className="col-span-3">Adresse Travaux</div>
                  <div className="col-span-1">Tâche actuelle</div>
                  <div className="col-span-1 text-right">Heures</div>
                </div>

                {(() => {
                  const days = entreeTempsTab === "semaine" ? getEntreeTempsWeekDays() : getEntreeTempsMonthDays();
                  const daysWithEntries = days.filter(day => getEntreeTempsForDate(day).length > 0);
                  const totalPeriode = days.reduce((sum, day) => {
                    return sum + getEntreeTempsForDate(day).reduce((s, e) => s + (e.heures || 0), 0);
                  }, 0);

                  if (daysWithEntries.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-500">
                        Aucune entrée de temps pour cette période
                      </div>
                    );
                  }

                  return (
                    <>
                    {daysWithEntries.map(day => {
                    const entries = getEntreeTempsForDate(day);
                    const total = calculateTotalHours(day.toISOString().split('T')[0]);
                    const isToday = day.toDateString() === new Date().toDateString();
                    return (
                      <div key={day.toISOString()} className="rounded-lg border border-slate-700">
                         {/* En-tête du jour */}
                         <div className="flex items-center justify-between px-4 py-2 rounded-t-lg bg-slate-800/50">
                           <span className="font-semibold text-sm text-slate-300">
                             {format(day, "EEEE d MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(day, "EEEE d MMMM yyyy", { locale: fr }).slice(1)}
                           </span>
                           <span className="text-sm font-bold text-slate-400">{total.toFixed(1)}h</span>
                         </div>
                        {/* Lignes d'entrées */}
                        <div className="divide-y divide-slate-700/50">
                          {entries.map(entry => {
                            const dossier = dossiers.find(d => d.id === entry.dossier_id);
                            const dossierLabel = dossier
                              ? `${dossier.arpenteur_geometre?.split(' ').map(w => w[0]).join('')}-${dossier.numero_dossier}`
                              : (entry.dossier_id ? entry.dossier_id.slice(0, 8) : '-');
                            return (
                              <div key={entry.id} className="grid grid-cols-12 gap-2 px-4 py-2 items-center hover:bg-slate-800/30 transition-colors">
                                 <div className="col-span-2">
                                   {dossier ? (
                                     <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${getArpenteurColor(dossier.arpenteur_geometre)}`}>
                                       {dossierLabel}
                                     </span>
                                   ) : <span className="text-xs text-slate-500">-</span>}
                                 </div>
                                 <div className="col-span-3">
                                   {dossier?.clients_ids?.length > 0 ? (
                                     <span className="text-xs text-slate-300 truncate block">{getClientsNames(dossier.clients_ids)}</span>
                                   ) : <span className="text-xs text-slate-500">-</span>}
                                 </div>
                                 <div className="col-span-2">
                                    {entry.mandat ? (
                                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getMandatColor(entry.mandat)}`}>{getAbbreviatedMandatType(entry.mandat)}</span>
                                    ) : <span className="text-xs text-slate-500">-</span>}
                                  </div>
                                 <div className="col-span-3">
                                   {dossier?.mandats?.[0]?.adresse_travaux ? (() => {
                                    const addr = dossier.mandats[0].adresse_travaux;
                                    const parts = [];
                                    if (addr.numeros_civiques?.filter(n => n).length > 0) parts.push(addr.numeros_civiques.filter(n => n).join(', '));
                                    if (addr.rue) parts.push(addr.rue);
                                    if (addr.ville) parts.push(addr.ville);
                                    const full = parts.filter(p => p).join(', ');
                                    return full ? <span className="text-xs text-slate-400 truncate block" title={full}>{full}</span> : <span className="text-xs text-slate-500">-</span>;
                                    })() : <span className="text-xs text-slate-500">-</span>}
                                    </div>
                                    <div className="col-span-1">
                                    {entry.tache ? (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded">{entry.tache}</span>
                                    ) : <span className="text-xs text-slate-500">-</span>}
                                    </div>
                                    <div className="col-span-1 text-sm font-bold text-emerald-400 text-right">{entry.heures}h</div>
                                    </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-end px-4 py-2 mt-1 bg-orange-900/20 rounded-lg border border-orange-500/30">
                    <span className="text-xs text-orange-300 font-semibold uppercase tracking-wider mr-3">
                      Total {entreeTempsTab === "semaine" ? "semaine" : "mois"}
                    </span>
                    <span className="text-base font-bold text-orange-400">{totalPeriode.toFixed(1)}h</span>
                  </div>
                  </>
                  );
                })()}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Add Pointage Dialog - Full featured with Tabs */}
        <Dialog open={isAddingPointage} onOpenChange={(open) => {
          setIsAddingPointage(open);
          if (!open) {
            setAddPointageForm({
              date: new Date().toISOString().split('T')[0],
              heure_debut: "",
              heure_fin: "",
              description: "",
              type: "Pointage",
              multiplicateur: "1"
            });
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Ajouter une entrée de pointage</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="pointage" className="w-full">
              <TabsList className="bg-slate-800/50 border-b border-slate-700 w-full rounded-none p-0 mb-4" style={{ display: 'none' }}>
                <TabsTrigger value="pointage" className="flex-1 px-4 py-2 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-transparent rounded-none">Pointage</TabsTrigger>
              </TabsList>

              <TabsContent value="pointage" className="space-y-4">
                {/* Soldes de temps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div className="text-center">
                    <Palmtree className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">Vacances</div>
                    <div className="text-lg font-bold text-emerald-400">{soldeRestant.vacances % 1 === 0 ? soldeRestant.vacances : soldeRestant.vacances.toFixed(1)}h</div>
                    {soldeBase.max_vacances != null && <div className="text-[10px] text-slate-500">/ {soldeBase.max_vacances}h</div>}
                  </div>
                  <div className="text-center">
                    <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">Mieux-Être</div>
                    <div className="text-lg font-bold text-pink-400">{soldeRestant.mieuxEtre % 1 === 0 ? soldeRestant.mieuxEtre : soldeRestant.mieuxEtre.toFixed(1)}h</div>
                    {soldeBase.max_mieux_etre != null && <div className="text-[10px] text-slate-500">/ {soldeBase.max_mieux_etre}h</div>}
                  </div>
                  <div className="text-center">
                    <Wallet className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                    <div className="text-xs text-slate-400">En banque</div>
                    <div className="text-lg font-bold text-amber-400">{soldeRestant.enBanque % 1 === 0 ? soldeRestant.enBanque : soldeRestant.enBanque.toFixed(1)}h</div>
                  </div>
                </div>
                
                <form onSubmit={handleSubmitAddPointage} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Type <span className="text-red-400">*</span></Label>
                      <Select value={addPointageForm.type || "Pointage"} onValueChange={(value) => {
                        setAddPointageForm({...addPointageForm, type: value});
                      }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="Pointage" className="text-white">Pointage</SelectItem>
                          <SelectItem value="Mieux-Être" className="text-white">Mieux-Être</SelectItem>
                          <SelectItem value="Vacance" className="text-white">Vacance</SelectItem>
                          <SelectItem value="En banque" className="text-white">Banque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Multiplicateur <span className="text-red-400">*</span></Label>
                      <Select value={addPointageForm.multiplicateur || "1"} onValueChange={(value) => {
                        setAddPointageForm({...addPointageForm, multiplicateur: value});
                      }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="1" className="text-white">1</SelectItem>
                          <SelectItem value="1.5" className="text-white">1.5</SelectItem>
                          <SelectItem value="2" className="text-white">2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Heure de départ <span className="text-red-400">*</span></Label>
                      <TimeInput12h
                        value={addPointageForm.heure_debut}
                        onChange={(v) => setAddPointageForm({...addPointageForm, heure_debut: v})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-sm">Heure de fin <span className="text-red-400">*</span></Label>
                      <TimeInput12h
                        value={addPointageForm.heure_fin}
                        onChange={(v) => setAddPointageForm({...addPointageForm, heure_fin: v})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-400 text-sm">Description</Label>
                    <textarea
                      value={addPointageForm.description}
                      onChange={(e) => setAddPointageForm({...addPointageForm, description: e.target.value})}
                      placeholder="Description de l'activité... (facultatif)"
                      className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full text-sm"
                      rows="3"
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
              </TabsContent>


            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Edit Pointage Dialog - v2 avec Type + Multiplicateur */}
        <Dialog open={!!editingPointage} onOpenChange={(open) => !open && setEditingPointage(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier l'entrée de pointage</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitEditPointage} className="space-y-4">
              {/* Soldes de temps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                <div className="text-center">
                  <Palmtree className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">Vacances</div>
                  <div className="text-lg font-bold text-emerald-400">{soldeRestant.vacances % 1 === 0 ? soldeRestant.vacances : soldeRestant.vacances.toFixed(1)}h</div>
                  {soldeBase.max_vacances != null && <div className="text-[10px] text-slate-500">/ {soldeBase.max_vacances}h</div>}
                </div>
                <div className="text-center">
                  <Heart className="w-4 h-4 text-pink-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">Mieux-Être</div>
                  <div className="text-lg font-bold text-pink-400">{soldeRestant.mieuxEtre % 1 === 0 ? soldeRestant.mieuxEtre : soldeRestant.mieuxEtre.toFixed(1)}h</div>
                  {soldeBase.max_mieux_etre != null && <div className="text-[10px] text-slate-500">/ {soldeBase.max_mieux_etre}h</div>}
                </div>
                <div className="text-center">
                  <Wallet className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <div className="text-xs text-slate-400">En banque</div>
                  <div className="text-lg font-bold text-amber-400">{soldeRestant.enBanque % 1 === 0 ? soldeRestant.enBanque : soldeRestant.enBanque.toFixed(1)}h</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Type <span className="text-red-400">*</span></Label>
                  <Select value={editPointageForm.type || "Pointage"} onValueChange={(value) => setEditPointageForm({...editPointageForm, type: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Pointage" className="text-white">Pointage</SelectItem>
                      <SelectItem value="Mieux-Être" className="text-white">Mieux-Être</SelectItem>
                      <SelectItem value="Vacance" className="text-white">Vacance</SelectItem>
                      <SelectItem value="En banque" className="text-white">Banque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Multiplicateur <span className="text-red-400">*</span></Label>
                  <Select value={editPointageForm.multiplicateur || "1"} onValueChange={(value) => setEditPointageForm({...editPointageForm, multiplicateur: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="1" className="text-white">1</SelectItem>
                      <SelectItem value="1.5" className="text-white">1.5</SelectItem>
                      <SelectItem value="2" className="text-white">2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Date <span className="text-red-400">*</span></Label>
                  <Input
                    type="date"
                    value={editPointageForm.date}
                    onChange={(e) => setEditPointageForm({...editPointageForm, date: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Heure de départ <span className="text-red-400">*</span></Label>
                  <TimeInput12h
                    value={editPointageForm.heure_debut}
                    onChange={(v) => setEditPointageForm({...editPointageForm, heure_debut: v})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-400 text-sm">Heure de fin <span className="text-red-400">*</span></Label>
                  <TimeInput12h
                    value={editPointageForm.heure_fin}
                    onChange={(v) => setEditPointageForm({...editPointageForm, heure_fin: v})}
                    required
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
                  <TimeInput12h
                    value={eventForm.heure_debut}
                    onChange={(v) => setEventForm({...eventForm, heure_debut: v})}
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
                  <TimeInput12h
                    value={eventForm.heure_fin}
                    onChange={(v) => setEventForm({...eventForm, heure_fin: v})}
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
              <div className="space-y-2">
                <Label>Adresse</Label>
                <AddressSearchInput
                  value={profileForm.adresse}
                  onChange={(val) => setProfileForm({...profileForm, adresse: val})}
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