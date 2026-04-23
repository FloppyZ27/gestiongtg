import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, Link2, MapPin, Compass, Calendar, UserCircle, BarChart3, FolderOpen, Grid3x3, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Phone, Search, MessageCircle, Plus, Kanban, Shield, Users, CalendarDays, FilePlus, Cloud, Timer, Filter, X, LogOut, Play, Square, ClipboardList, Landmark, Mountain } from "lucide-react";
import { format } from "date-fns";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import NotificationBanner from "@/components/shared/NotificationBanner";
import AIChatbot from "@/components/shared/AIChatbot";
import NotificationButton from "@/components/shared/NotificationButton";
import DossierSearchBar from "@/components/shared/DossierSearchBar";
import PermissionGuard from "@/components/shared/PermissionGuard";
import GlobalDossierEditDialog from "@/components/shared/GlobalDossierEditDialog";
import EntreeTempsDialog from "@/components/shared/EntreeTempsDialog";
import UnsavedWarningDialog from "@/components/shared/UnsavedWarningDialog";

const navigationItems = [
  {
    title: "Tableau de Bord",
    url: createPageUrl("TableauDeBord"),
    icon: BarChart3,
  },
  {
    title: "Profil",
    url: createPageUrl("Profil"),
    icon: UserCircle,
  },
  {
    title: "Calendrier",
    url: createPageUrl("Calendrier"),
    icon: Calendar,
  },
  {
    title: "Communication clients",
    url: createPageUrl("CommunicationClients"),
    icon: MessageCircle,
  },
  {
    title: "Dossiers",
    url: createPageUrl("Dossiers"),
    icon: FolderOpen,
  },
  {
    title: "Clients",
    url: createPageUrl("Clients"),
    icon: User,
  },
  {
    title: "Gestion de Mandat",
    url: createPageUrl("GestionDeMandat"),
    icon: Kanban,
  },
  {
    title: "Comptabilité",
    url: createPageUrl("Comptabilite"),
    icon: Landmark,
  },
  {
    title: "Cédule Terrain",
    url: createPageUrl("CeduleTerrain"),
    icon: CalendarDays,
  },
  {
    title: "Levé Terrain",
    url: createPageUrl("LeveTerrain"),
    icon: Mountain,
  },
  {
    title: "Recherches",
    url: createPageUrl("Recherches"),
    icon: Search,
  },
];

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

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

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  }
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
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

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
    const container = document.getElementById('main-scroll-container');
    if (container) container.scrollTop = 0;
  }, [location.pathname]);

  const navigate = useNavigate();
  const [isEntreeTempsOpen, setIsEntreeTempsOpen] = useState(false);
  const [dossierSearchTerm, setDossierSearchTerm] = useState("");
  const [selectedDossierId, setSelectedDossierId] = useState(null);
  const [hasEntreeChanges, setHasEntreeChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [isEntreeTempsFiltersOpen, setIsEntreeTempsFiltersOpen] = useState(false);
  const [entreeTempsFilterArpenteur, setEntreeTempsFilterArpenteur] = useState([]);
  const [entreeTempsFilterMandat, setEntreeTempsFilterMandat] = useState([]);
  const [entreeTempsFilterTache, setEntreeTempsFilterTache] = useState([]);
  const [entreeTempsFilterVille, setEntreeTempsFilterVille] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showPunchControls, setShowPunchControls] = useState(false);
  const [isHoveringPunch, setIsHoveringPunch] = useState(false);
  const punchTimerRef = React.useRef(null);
  const { state, open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      try {
        return await base44.entities.User.list();
      } catch (error) {
        // Les utilisateurs non-admin n'ont pas accès à la liste complète
        return [];
      }
    },
    initialData: [],
    retry: false,
  });

  const { data: retoursAppels = [] } = useQuery({
    queryKey: ['retoursAppels'],
    queryFn: () => base44.entities.RetourAppel.filter({}, '-date_appel'),
    initialData: [],
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
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

  const { data: entreesTempsUser = [] } = useQuery({
    queryKey: ['entreeTempsUser', user?.email],
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 500),
    initialData: [],
    enabled: !!user,
  });

  const soldeBase = soldesConges.find(s => s.utilisateur_email === user?.email) || {};
  const currentYear = new Date().getFullYear();
  const entreesConges = entreesTempsUser.filter(e =>
    ['Vacances', 'Mieux-Être', 'Mieux-etre', 'En banque'].includes(e.tache) &&
    e.date?.startsWith(String(currentYear))
  );
  const usedVacances = entreesConges.filter(e => e.tache === 'Vacances').reduce((s, e) => s + (e.heures || 0), 0);
  const usedMieuxEtre = entreesConges.filter(e => e.tache === 'Mieux-Être' || e.tache === 'Mieux-etre').reduce((s, e) => s + (e.heures || 0), 0);
  const usedEnBanque = entreesConges.filter(e => e.tache === 'En banque').reduce((s, e) => s + (e.heures || 0), 0);
  const soldeUtilisateur = {
    ...soldeBase,
    heures_vacances: Math.max(0, (soldeBase.heures_vacances ?? 0) - usedVacances),
    heures_mieux_etre: Math.max(0, (soldeBase.heures_mieux_etre ?? 0) - usedMieuxEtre),
    heures_en_banque: Math.max(0, (soldeBase.heures_en_banque ?? 0) - usedEnBanque),
  };

  const pointageEnCours = pointages.find(p => p.statut === 'en_cours');

  const [entreeForm, setEntreeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heures: "",
    dossier_id: "",
    mandat: "",
    tache: "",
    tache_suivante: "",
    utilisateur_assigne: "",
    description: "",
    type: "Pointage",
    multiplicateur: "1"
  });

  const createEntreeMutation = useMutation({
    mutationFn: (data) => base44.entities.EntreeTemps.create({ ...data, utilisateur_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entreeTemps'] });
      setIsEntreeTempsOpen(false);
      setHasEntreeChanges(false);
      resetForm();
    },
  });

  const createPointageMutation = useMutation({
    mutationFn: (data) => base44.entities.Pointage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointages', user?.email] });
    },
  });

  const updatePointageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Pointage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointages', user?.email] });
    },
  });

  // Rediriger les utilisateurs inactifs vers CompteInactif
  useEffect(() => {
    if (user?.statut === 'Inactif' && location.pathname !== '/CompteInactif') {
      navigate('/CompteInactif');
    }
  }, [user, location.pathname, navigate]);

  // Calculer le temps écoulé du pointage en cours
  useEffect(() => {
    if (!pointageEnCours) {
      setElapsedTime(0);
      return;
    }
    
    const interval = setInterval(() => {
      const debut = new Date(pointageEnCours.heure_debut).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - debut) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pointageEnCours]);

  // Gérer la fermeture automatique après 3 secondes
  useEffect(() => {
    if (showPunchControls && !isHoveringPunch) {
      punchTimerRef.current = setTimeout(() => {
        setShowPunchControls(false);
      }, 3000);
    }
    
    return () => {
      if (punchTimerRef.current) {
        clearTimeout(punchTimerRef.current);
      }
    };
  }, [showPunchControls, isHoveringPunch]);

  const getWeekStartDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 0);
    const sunday = new Date(today.setDate(diff));
    return sunday.toLocaleDateString('fr-CA');
  };

  const getWeekEndDate = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + 5;
    const saturday = new Date(today.setDate(diff));
    return saturday.toLocaleDateString('fr-CA');
  };

  const openFactureFolder = async () => {
    if (!user) return;
    const weekStart = getWeekStartDate();
    const weekEnd = getWeekEndDate();
    const folderPath = `EMPLOYÉS/${user.full_name}/FACTURES/${weekStart}_${weekEnd}`;
    const sharePointUrl = `https://gestiongtg.sharepoint.com/sites/GestionGTG/Documents Partagés/${folderPath}`;
    window.open(sharePointUrl, '_blank');
  };

  const handleFactureUpload = async (e) => {
    const files = Array.from(e.target.files || e.dataTransfer?.files || []);
    if (files.length === 0) return;
    // À implémenter : upload vers SharePoint
  };

  // Afficher un loader pendant le chargement de l'utilisateur
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si l'utilisateur est inactif, afficher uniquement la page CompteInactif sans layout
  if (user?.statut === 'Inactif') {
    return <>{children}</>;
  }

  const resetForm = () => {
    setEntreeForm({
      date: new Date().toISOString().split('T')[0],
      heures: "",
      dossier_id: "",
      mandat: "",
      tache: "",
      tache_suivante: "",
      utilisateur_assigne: "",
      description: ""
    });
    setDossierSearchTerm("");
    setSelectedDossierId(null);
    setHasEntreeChanges(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider que heures est un nombre valide
    const heures = parseFloat(entreeForm.heures);
    if (isNaN(heures) || heures <= 0) {
      alert("Veuillez entrer un nombre d'heures valide");
      return;
    }

    // Créer l'entrée de temps
    await createEntreeMutation.mutateAsync({
      ...entreeForm,
      heures: heures
    });

    // Mettre à jour le dossier avec la tâche suivante et l'utilisateur assigné
    if (entreeForm.dossier_id && entreeForm.mandat && (entreeForm.tache_suivante || entreeForm.utilisateur_assigne)) {
      const dossier = dossiers.find(d => d.id === entreeForm.dossier_id);
      if (dossier && dossier.mandats) {
        const updatedMandats = dossier.mandats.map(mandat => {
          // Trouver le mandat correspondant
          if (mandat.type_mandat === entreeForm.mandat) {
            return {
              ...mandat,
              tache_actuelle: entreeForm.tache_suivante || mandat.tache_actuelle,
              utilisateur_assigne: entreeForm.utilisateur_assigne || mandat.utilisateur_assigne
            };
          }
          return mandat;
        });

        await base44.entities.Dossier.update(entreeForm.dossier_id, {
          ...dossier,
          mandats: updatedMandats
        });

        queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      }
    }

    // Créer une notification si un utilisateur est assigné à une tâche suivante
    if (entreeForm.utilisateur_assigne && entreeForm.tache_suivante && entreeForm.dossier_id) {
      const dossier = dossiers.find(d => d.id === entreeForm.dossier_id);
      const clientsNames = getClientsNames(dossier?.clients_ids);
      const numeroDossier = dossier ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}` : '';
      
      await base44.entities.Notification.create({
        utilisateur_email: entreeForm.utilisateur_assigne,
        titre: "Nouvelle tâche assignée",
        message: `${user?.full_name} vous a assigné la tâche "${entreeForm.tache_suivante}"${numeroDossier ? ` pour le dossier ${numeroDossier}` : ''}${clientsNames ? ` - ${clientsNames}` : ''}.`,
        type: "dossier",
        dossier_id: entreeForm.dossier_id,
        lue: false
      });
      
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "";
    const clientNames = clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "";
    }).filter(name => name);
    return clientNames.join(", ");
  };

  const filteredDossiers = dossiers.filter(dossier => {
    const searchLower = dossierSearchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    const clientsNames = getClientsNames(dossier.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower)
    );
  });

  const selectedDossier = dossiers.find(d => d.id === selectedDossierId);
  const availableMandats = selectedDossier?.mandats || [];

  const handlePunchIn = () => {
    const now = new Date();
    createPointageMutation.mutate({
      utilisateur_email: user?.email,
      date: now.toISOString().split('T')[0],
      heure_debut: now.toISOString(),
      statut: 'en_cours'
    });
  };

  const handlePunchOut = () => {
    if (!pointageEnCours) return;
    
    const now = new Date();
    const debut = new Date(pointageEnCours.heure_debut);
    const dureeHeures = (now.getTime() - debut.getTime()) / 1000 / 60 / 60;
    
    updatePointageMutation.mutate({
      id: pointageEnCours.id,
      data: {
        ...pointageEnCours,
        heure_fin: now.toISOString(),
        duree_heures: parseFloat(dureeHeures.toFixed(2)),
        statut: 'termine'
      }
    });
  };

  const formatElapsedTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDossierSelect = (dossierId) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    const mandatType = dossier?.mandats?.[0]?.type_mandat || "";
    
    setSelectedDossierId(dossierId);
    setEntreeForm({
      ...entreeForm,
      dossier_id: dossierId,
      mandat: mandatType,
      tache_suivante: "",
      utilisateur_assigne: ""
    });
    setDossierSearchTerm("");
    setHasEntreeChanges(true);
  };

  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider>
  
        <style>{`
          * {
            font-family: 'Poppins', sans-serif !important;
          }
          code, pre {
            font-family: 'JetBrains Mono', monospace !important;
          }

          /* Page titles - couleur bleu professionnel */
          h1 {
            color: hsl(207, 85%, 55%) !important;
          }

        /* Overlay avec flou doux */
        [data-state="open"] > div[data-radix-dialog-overlay],
        div[data-radix-dialog-overlay],
        [data-radix-dialog-overlay] {
        background-color: hsl(210, 17%, 9.8%, 0.4) !important;
        backdrop-filter: blur(6px) !important;
        -webkit-backdrop-filter: blur(6px) !important;
        opacity: 1 !important;
        }

        /* Dialog glassmorphique professionnel */
        [role="dialog"] {
        background: hsl(210, 16%, 13%, 0.95) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        border: 1px solid hsl(210, 10%, 19%, 0.8) !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        border-radius: 0.75rem !important;
        }

        /* Titre dialog */
        [role="dialog"] h2,
        [role="dialog"] [class*="DialogTitle"],
        .DialogTitle {
        font-family: 'Poppins', sans-serif !important;
        font-weight: 600 !important;
        letter-spacing: 0.2px !important;
        }

        /* Design professionnel et neutre */
        .bg-slate-900, .bg-slate-800, .bg-slate-950 {
        background: hsl(210, 16%, 13%) !important;
        border: 1px solid hsl(210, 10%, 19%) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }

        /* Boutons minimalistes neutre */
        button[class*="size-icon"],
        button.h-10.w-10,
        button.h-9.w-9,
        button.h-8.w-8,
        table button,
        [role="row"] button,
        [role="cell"] button,
        td button,
        th button,
        .text-right button,
        button[data-variant="ghost"],
        button[class*="ghost"],
        button[class*="variant-ghost"],
        button[class*="border-b-"],
        .border-b button {
        background-color: transparent !important;
        background-image: none !important;
        border: none !important;
        box-shadow: none !important;
        transition: all 0.2s ease !important;
        }

        button:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button):not([data-radix-collapsible-trigger]),
        [role="button"]:not([class*="size-icon"]):not(td button):not(th button):not(.text-right button):not(.border-b button):not([data-radix-collapsible-trigger]) {
        background: hsl(207, 85%, 55%, 0.08) !important;
        border: 1px solid hsl(207, 85%, 55%, 0.2) !important;
        color: hsl(207, 85%, 55%);
        border-radius: 0.5rem;
        transition: all 0.2s ease !important;
        padding: 0.5rem 1rem;
        }

        /* Boutons primaires dégradé discret */
        button[class*="agenda-add-button"] {
          background: linear-gradient(135deg, hsl(207, 85%, 55%) 0%, hsl(207, 85%, 50%) 100%) !important;
          color: hsl(210, 17%, 9.8%) !important;
          border: none !important;
          box-shadow: 0 8px 16px hsla(207, 85%, 55%, 0.2) !important;
          font-weight: 600;
        }

        button[class*="agenda-add-button"]:hover {
          background: linear-gradient(135deg, hsl(207, 85%, 60%) 0%, hsl(207, 85%, 55%) 100%) !important;
          box-shadow: 0 12px 24px hsla(207, 85%, 55%, 0.25) !important;
          transform: translateY(-2px);
        }

        button:hover:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button):not([role="tab"]),
        [role="button"]:hover:not([class*="size-icon"]):not(td button):not(th button):not(.text-right button):not(.border-b button):not([role="tab"]) {
          background: rgba(264, 85%, 63%, 0.15) !important;
          border-color: rgba(264, 85%, 63%, 0.4) !important;
          transform: translateY(-2px);
        }

        /* Retirer complètement l'encadré des TabsTrigger */
        button[role="tab"],
        [role="tab"] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          border: none !important;
          box-shadow: none !important;
          transition: all 0.3s ease !important;
        }



        /* Boutons "Semaine" et "Mois" dans la section feuille de temps */
        button.timesheet-tab-button {
          background: linear-gradient(to right, rgb(0, 184, 212), rgb(0, 150, 136)) !important;
          background-color: rgb(0, 184, 212) !important;
          background-image: linear-gradient(to right, rgb(0, 184, 212), rgb(0, 150, 136)) !important;
          color: white !important;
          border: none !important;
          box-shadow: 0 4px 12px -3px rgba(0, 184, 212, 0.4) !important;
        }

        button.timesheet-tab-button:hover {
          background: linear-gradient(to right, rgb(0, 172, 193), rgb(0, 121, 107)) !important;
          background-image: linear-gradient(to right, rgb(0, 172, 193), rgb(0, 121, 107)) !important;
          box-shadow: 0 6px 16px -3px rgba(0, 184, 212, 0.5) !important;
        }

        button.timesheet-tab-button:active {
          transform: translateY(1px);
        }



        /* Tabs par défaut avec couleur primary */
        button[role="tab"]:hover,
        [role="tab"]:hover {
          background: hsla(207, 85%, 55%, 0.15) !important;
          background-color: hsla(207, 85%, 55%, 0.15) !important;
          background-image: none !important;
          color: hsl(207, 85%, 55%) !important;
        }

        button[role="tab"][data-state="active"],
        [role="tab"][data-state="active"] {
          background: hsla(207, 85%, 55%, 0.2) !important;
          background-color: hsla(207, 85%, 55%, 0.2) !important;
          background-image: none !important;
          color: hsl(207, 85%, 55%) !important;
          border-bottom: 2px solid hsl(207, 85%, 55%) !important;
        }

        button:active:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button),
        [role="button"]:active:not([class*="size-icon"]):not(td button):not(th button):not(.text-right button):not(.border-b button) {
          background: rgba(0, 0, 0, 0.15) !important;
          background-color: rgba(0, 0, 0, 0.15) !important;
          background-image: none !important;
          transform: translateY(0px);
        }



        .border-slate-700, .border-slate-800 {
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
        }

        input, textarea, select {
          background-color: rgba(30, 41, 59, 0.5) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          transition: all 0.2s ease !important;
          backdrop-filter: blur(4px);
        }

        input:hover, textarea:hover, select:hover {
          background-color: rgba(30, 41, 59, 0.7) !important;
          border-color: rgba(196, 110, 255, 0.2) !important;
        }

        input:focus, textarea:focus, select:focus {
          outline: none !important;
          background-color: rgba(30, 41, 59, 0.8) !important;
          border-color: rgb(196, 110, 255) !important;
          box-shadow: 0 0 0 3px rgba(196, 110, 255, 0.15) !important;
        }

        /* Fond gris pour les menus déroulants et leurs déclencheurs */
        [role="listbox"],
        [role="menu"],
        [data-radix-select-content],
        [data-radix-popper-content-wrapper] > div {
          background-color: rgb(30, 41, 59) !important;
        }

        /* Boutons de sélection (Select triggers) */
        button[role="combobox"],
        button[aria-haspopup="listbox"],
        button[data-radix-select-trigger],
        [data-radix-select-trigger] {
          background-color: rgb(30, 41, 59) !important;
          background-image: none !important;
          box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.3),
            inset -3px -3px 6px rgba(71, 85, 105, 0.05) !important;
        }

        button[role="combobox"]:hover,
        button[aria-haspopup="listbox"]:hover,
        button[data-radix-select-trigger]:hover {
          background-color: rgb(30, 41, 59) !important;
          box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.3),
            inset -3px -3px 6px rgba(71, 85, 105, 0.05),
            0 0 0 2px rgba(16, 185, 129, 0.3) !important;
        }





        /* Scrollbar personnalisée globale */
        *::-webkit-scrollbar,
        *::-webkit-scrollbar:vertical,
        *::-webkit-scrollbar:horizontal {
          width: 5px !important;
          height: 5px !important;
        }

        *::-webkit-scrollbar-track,
        *::-webkit-scrollbar-corner {
          background: transparent !important;
          border: none !important;
        }

        *::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(16, 185, 129), rgb(20, 184, 166)) !important;
          border-radius: 10px !important;
          border: none !important;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(5, 150, 105), rgb(13, 148, 136)) !important;
        }

        *::-webkit-scrollbar-button {
          display: none !important;
          height: 0 !important;
          width: 0 !important;
        }


      `}</style>
      
      {/* Notification Banner */}
      <NotificationBanner user={user} />
      
      {/* AI Chatbot flottant */}
      <AIChatbot />
      
      {/* Dialog global pour modifier un dossier depuis n'importe quelle page */}
      <GlobalDossierEditDialog />
      
      {/* Dialog pour l'entrée de temps */}
      <EntreeTempsDialog
        isOpen={isEntreeTempsOpen}
        onOpenChange={setIsEntreeTempsOpen}
        hasChanges={hasEntreeChanges}
        onShowWarning={() => setShowUnsavedWarning(true)}
        entreeForm={entreeForm}
        setEntreeForm={setEntreeForm}
        selectedDossierId={selectedDossierId}
        dossierSearchTerm={dossierSearchTerm}
        setDossierSearchTerm={setDossierSearchTerm}
        filteredDossiers={filteredDossiers}
        selectedDossier={selectedDossier}
        dossiers={dossiers}
        clients={clients}
        lots={lots}
        users={users}
        pointages={pointages}
        onSubmit={handleSubmit}
        onReset={resetForm}
        solde={soldeUtilisateur}
      />
      
      
      {/* Dialog d'avertissement modifications non sauvegardées */}
      <UnsavedWarningDialog
        open={showUnsavedWarning}
        onOpenChange={setShowUnsavedWarning}
        onAbandon={() => {
          setShowUnsavedWarning(false);
          setIsEntreeTempsOpen(false);
          setHasEntreeChanges(false);
          resetForm();
        }}
        onContinue={() => setShowUnsavedWarning(false)}
      />
      
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon" className="border-r border-border bg-gradient-to-b from-sidebar to-sidebar">
          <SidebarHeader className="border-b border-border p-3 bg-card">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png"
                  alt="GTG Logo"
                  className="w-16 h-auto"
                />
                <div>
                  <h2 className="font-bold text-white text-2xl">GestionGTG</h2>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png"
                  alt="GTG Logo"
                  className="w-8 h-auto"
                />
              </div>
            )}
          </SidebarHeader>
          
          <SidebarContent className="p-1.5 bg-sidebar">
            <SidebarGroup>
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Navigation
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    return (
                      <SidebarMenuItem key={item.title}>
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton 
                                asChild 
                                className={`transition-all duration-200 rounded-lg mb-0.5 justify-center ${
                                  location.pathname === item.url 
                                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/20' 
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                }`}
                              >
                                <Link to={item.url} className="flex items-center justify-center p-2.5">
                                  <item.icon className="w-5 h-5" />
                                </Link>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white">
                              <p>{item.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <SidebarMenuButton 
                            asChild 
                            className={`transition-all duration-200 rounded-lg mb-0.5 ${
                              location.pathname === item.url 
                                ? 'bg-primary/15 text-primary border border-primary/30 shadow-lg shadow-primary/20' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                            }`}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                      </SidebarMenuItem>
                    );
                  })}

                  {/* Admin menu item */}
                  {user?.role === 'admin' && (
                    <SidebarMenuItem>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton 
                              asChild 
                              className={`transition-all duration-200 rounded-lg mb-0.5 justify-center ${
                                location.pathname === createPageUrl("Administration")
                                  ? 'bg-destructive/15 text-destructive border border-destructive/30 shadow-lg shadow-destructive/20' 
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                              }`}
                            >
                              <Link to={createPageUrl("Administration")} className="flex items-center justify-center p-2.5">
                                <Shield className="w-5 h-5" />
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white">
                            <p>Administration</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-200 rounded-lg mb-0.5 ${
                            location.pathname === createPageUrl("Administration")
                              ? 'bg-destructive/15 text-destructive border border-destructive/30 shadow-lg shadow-destructive/20' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                          }`}
                        >
                          <Link to={createPageUrl("Administration")} className="flex items-center gap-3 px-3 py-2.5">
                            <Shield className="w-5 h-5" />
                            <span className="font-medium">Administration</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-2.5 bg-card space-y-2.5">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => base44.auth.logout()}
                    variant="ghost"
                    size="icon"
                    className="w-full bg-destructive/15 hover:bg-destructive/25 text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-card border-border text-foreground">
                  <p>Déconnexion</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => base44.auth.logout()}
                variant="ghost"
                className="w-full bg-destructive/15 hover:bg-destructive/25 text-destructive justify-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            )}
            <Button
              onClick={() => setOpen(!open)}
              variant="ghost"
              size="icon"
              className="w-full bg-muted hover:bg-muted/80 text-muted-foreground"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="fixed top-0 left-0 right-0 z-[1000] w-full bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="lg:hidden text-muted-foreground hover:text-foreground" />
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png"
                alt="GTG Logo"
                className="w-10 h-auto"
              />
              <h1 className="text-xl font-bold text-foreground">GestionGTG</h1>
            </div>

            {/* Barre de recherche de dossiers au centre */}
            <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
              <DossierSearchBar dossiers={dossiers} clients={clients} />
            </div>

            {/* Boutons à droite - Chronomètre, Punch In/Out, Entrée de temps et Notification */}
            <div className="flex items-center gap-3">
              {/* Voyant lumineux pour afficher/masquer les contrôles de pointage */}
              <div className="flex flex-col items-center gap-0">
                <Button
                  onClick={() => setShowPunchControls(!showPunchControls)}
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/40 relative"
                >
                  <div className="relative w-4 h-4 flex items-center justify-center">
                    {pointageEnCours ? (
                      <>
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 bg-primary rounded-full animate-ping"></div>
                        </div>
                      </>
                    ) : (
                      <div className="w-3 h-3 bg-muted rounded-full"></div>
                    )}
                  </div>
                </Button>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                  {pointageEnCours ? "En travail" : "Hors travail"}
                </span>
              </div>

              {/* Chronomètre et boutons Punch (cachés par défaut) */}
              <AnimatePresence>
                {showPunchControls && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div 
                      className="flex items-center gap-3"
                      onMouseEnter={() => setIsHoveringPunch(true)}
                      onMouseLeave={() => setIsHoveringPunch(false)}
                    >
                      {/* Chronomètre */}
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-card backdrop-blur-sm rounded-lg border border-border">
                        <span className="text-foreground text-sm font-bold tabular-nums min-w-[70px]">
                          {formatElapsedTime(elapsedTime)}
                        </span>
                      </div>

                      {/* Bouton Punch In/Out */}
                      {!pointageEnCours ? (
                       <Button
                         onClick={handlePunchIn}
                         size="sm"
                         className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg h-8"
                       >
                         <Play className="w-4 h-4 mr-1" />
                         Punch In
                       </Button>
                      ) : (
                       <Button
                         onClick={handlePunchOut}
                         size="sm"
                         className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-lg h-8"
                       >
                         <Square className="w-4 h-4 mr-1" />
                         Punch Out
                       </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                onClick={() => setIsEntreeTempsOpen(true)}
                size="icon"
                className="bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg"
              >
                <Timer className="w-5 h-5 text-accent-foreground" />
              </Button>
              <NotificationButton user={user} />
            </div>
          </header>

          <div
            className="flex-1 overflow-y-auto overflow-x-hidden pt-[73px]"
            id="main-scroll-container"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <PermissionGuard pageName={currentPageName}>
                  {children}
                </PermissionGuard>
              </motion.div>
            </AnimatePresence>
          </div>
          </main>
      </div>
    </TooltipProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  const [isDesktop, setIsDesktop] = React.useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  
  React.useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarProvider defaultOpen={isDesktop}>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </SidebarProvider>
  );
}