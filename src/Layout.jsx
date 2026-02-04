import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, Link2, MapPin, Compass, Calendar, UserCircle, Clock, BarChart3, FolderOpen, Grid3x3, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Phone, Search, MessageCircle, Plus, Kanban, Shield, Users, CalendarDays, FilePlus, Cloud, Timer, Filter, X } from "lucide-react";
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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import NotificationBanner from "@/components/shared/NotificationBanner";
import NotificationButton from "@/components/shared/NotificationButton";
import DossierSearchBar from "@/components/shared/DossierSearchBar";

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
    title: "Cédule Terrain",
    url: createPageUrl("GestionEquipeTerrain"),
    icon: CalendarDays,
  },
  {
    title: "Recherches",
    url: createPageUrl("Recherches"),
    icon: Search,
  },
  {
    title: "SharePoint",
    url: createPageUrl("SharePoint"),
    icon: Cloud,
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
  const { state, open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
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
    queryFn: () => base44.entities.User.list(),
    initialData: [],
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

  const [entreeForm, setEntreeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heures: "",
    dossier_id: "",
    mandat: "",
    tache: "",
    tache_suivante: "",
    utilisateur_assigne: "",
    description: ""
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
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

          :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --popover: 222.2 84% 4.9%;
          --popover-foreground: 210 40% 98%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 222.2 47.4% 11.2%;
          --secondary: 217.2 32.6% 17.5%;
          --secondary-foreground: 210 40% 98%;
          --muted: 217.2 32.6% 17.5%;
          --muted-foreground: 215 20.2% 65.1%;
          --accent: 217.2 32.6% 17.5%;
          --accent-foreground: 210 40% 98%;
          --destructive: 0 62.8% 30.6%;
          --destructive-foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
          --input: 217.2 32.6% 17.5%;
          --ring: 224.3 76.3% 48%;
        }

        /* Overlay transparent avec flou */
        [data-state="open"] > div[data-radix-dialog-overlay],
        div[data-radix-dialog-overlay],
        [data-radix-dialog-overlay] {
          background-color: transparent !important;
          backdrop-filter: blur(5px) !important;
          -webkit-backdrop-filter: blur(5px) !important;
          opacity: 1 !important;
        }

        /* Forcer la transparence de tous les overlays avec flou */
        .fixed.inset-0.z-50.bg-black\\/80,
        .fixed.inset-0.z-50 {
          background-color: transparent !important;
          backdrop-filter: blur(5px) !important;
          -webkit-backdrop-filter: blur(5px) !important;
        }

        /* Effet glassmorphism sur les fenêtres dialog avec trame de fond */
        [role="dialog"] {
          background: rgba(15, 23, 42, 0.7) !important;
          backdrop-filter: blur(21px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(21px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
          position: fixed !important;
          left: 50% !important;
          top: 50% !important;
          transform: translate(-50%, -50%) !important;
          animation: dialogSlideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }

        /* Titres des fenêtres dialog en Outfit et majuscules */
        [role="dialog"] h2,
        [role="dialog"] [class*="DialogTitle"],
        .DialogTitle {
          font-family: 'Outfit', sans-serif !important;
          text-transform: uppercase !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
        }

        @keyframes dialogSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, calc(-50% + 120px));
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        /* Effet Neumorphism global */
        .bg-slate-900, .bg-slate-800, .bg-slate-950 {
          box-shadow: 
            12px 12px 24px rgba(0, 0, 0, 0.5),
            -12px -12px 24px rgba(71, 85, 105, 0.1) !important;
        }

        /* Boutons icon, ghost et dans tableaux - pas de contour */
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
        }

        /* Style minimaliste pour les autres boutons - contour coloré */
        button:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button),
        [role="button"]:not([class*="size-icon"]):not(td button):not(th button):not(.text-right button):not(.border-b button) {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
          box-shadow: none !important;
          transition: all 0.3s ease !important;
        }

        /* Contours colorés pour les boutons avec gradient emerald/teal */
        button[class*="from-emerald"]:not([class*="size-icon"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8) {
          border: 2px solid rgb(16, 185, 129) !important;
          color: rgb(16, 185, 129) !important;
        }

        /* Contours colorés pour les boutons avec gradient blue/indigo */
        button[class*="from-blue"]:not([class*="size-icon"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8) {
          border: 2px solid rgb(59, 130, 246) !important;
          color: rgb(59, 130, 246) !important;
        }

        /* Contours colorés pour les boutons avec gradient red */
        button[class*="from-red"]:not([class*="size-icon"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8) {
          border: 2px solid rgb(239, 68, 68) !important;
          color: rgb(239, 68, 68) !important;
        }

        /* Contours par défaut pour les autres boutons */
        button:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not([class*="from-"]):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button):not([role="tab"]):not([class*="border-red"]):not([class*="border-0"]),
        [role="button"]:not([class*="size-icon"]):not([class*="from-"]):not(td button):not(th button):not(.text-right button):not(.border-b button):not([role="tab"]):not([class*="border-red"]):not([class*="border-0"]) {
          border: 2px solid rgba(148, 163, 184, 0.5) !important;
        }

        /* Contours rouges pour les boutons Annuler */
        button[class*="border-red"],
        [role="button"][class*="border-red"] {
          border: 2px solid rgb(239, 68, 68) !important;
        }

        button[class*="border-red"]:hover,
        [role="button"][class*="border-red"]:hover {
          color: rgb(248, 113, 113) !important;
        }

        button:hover:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button):not([role="tab"]),
        [role="button"]:hover:not([class*="size-icon"]):not(td button):not(th button):not(.text-right button):not(.border-b button):not([role="tab"]) {
          background: rgba(255, 255, 255, 0.08) !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
          background-image: none !important;
          transform: translateY(-1px);
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

        /* Tabs avec couleur blue - inactifs en gris */
        button[role="tab"][class*="blue"]:not([data-state="active"]),
        [role="tab"][class*="blue"]:not([data-state="active"]) {
          color: rgb(148, 163, 184) !important;
        }

        button[role="tab"][class*="blue"]:not([data-state="active"]):hover,
        [role="tab"][class*="blue"]:not([data-state="active"]):hover {
          background: rgba(148, 163, 184, 0.1) !important;
          background-color: rgba(148, 163, 184, 0.1) !important;
          background-image: none !important;
          color: rgb(148, 163, 184) !important;
        }

        button[role="tab"][class*="blue"][data-state="active"],
        [role="tab"][class*="blue"][data-state="active"] {
          background: rgba(59, 130, 246, 0.2) !important;
          background-color: rgba(59, 130, 246, 0.2) !important;
          background-image: none !important;
          color: rgb(59, 130, 246) !important;
          border-bottom-color: rgb(59, 130, 246) !important;
        }

        /* Tabs avec couleur cyan */
        button[role="tab"][class*="cyan"]:hover,
        [role="tab"][class*="cyan"]:hover {
          background: rgba(34, 211, 238, 0.15) !important;
          background-color: rgba(34, 211, 238, 0.15) !important;
          background-image: none !important;
          color: rgb(34, 211, 238) !important;
        }

        button[role="tab"][class*="cyan"][class*="border-cyan"],
        [role="tab"][class*="cyan"][class*="border-cyan"] {
          background: rgba(34, 211, 238, 0.1) !important;
          color: rgb(34, 211, 238) !important;
          border-bottom-color: rgb(34, 211, 238) !important;
        }

        /* Tabs avec couleur purple */
        button[role="tab"][class*="purple"]:hover,
        [role="tab"][class*="purple"]:hover {
          background: rgba(168, 85, 247, 0.15) !important;
          background-color: rgba(168, 85, 247, 0.15) !important;
          background-image: none !important;
          color: rgb(168, 85, 247) !important;
        }

        button[role="tab"][class*="purple"][class*="border-purple"],
        [role="tab"][class*="purple"][class*="border-purple"] {
          background: rgba(168, 85, 247, 0.1) !important;
          color: rgb(168, 85, 247) !important;
          border-bottom-color: rgb(168, 85, 247) !important;
        }

        /* Tabs avec couleur orange - en orange */
        button[role="tab"][class*="orange"]:not([data-state="active"]),
        [role="tab"][class*="orange"]:not([data-state="active"]) {
          color: rgb(148, 163, 184) !important;
        }

        button[role="tab"][class*="orange"]:not([data-state="active"]):hover,
        [role="tab"][class*="orange"]:not([data-state="active"]):hover {
          background: rgba(249, 115, 22, 0.15) !important;
          background-color: rgba(249, 115, 22, 0.15) !important;
          background-image: none !important;
          color: rgb(251, 146, 60) !important;
        }

        button[role="tab"][class*="orange"][data-state="active"],
        [role="tab"][class*="orange"][data-state="active"] {
          background: rgba(249, 115, 22, 0.25) !important;
          background-color: rgba(249, 115, 22, 0.25) !important;
          background-image: none !important;
          color: rgb(251, 146, 60) !important;
          border-bottom: 2px solid rgb(251, 146, 60) !important;
        }

        /* Tabs spécifiques pour les retours d'appel - inactives */
        .retour-appel-tab:not(.border-emerald-500) {
          background: transparent !important;
          color: rgb(148, 163, 184) !important;
        }

        .retour-appel-tab:not(.border-emerald-500):hover {
          background: rgba(16, 185, 129, 0.05) !important;
          color: rgb(16, 185, 129) !important;
        }

        .retour-appel-tab.border-emerald-500 {
          background: rgba(16, 185, 129, 0.1) !important;
          color: rgb(16, 185, 129) !important;
          border-bottom-color: rgb(16, 185, 129) !important;
        }

        .message-laisse-tab:not(.border-orange-500) {
          background: transparent !important;
          color: rgb(148, 163, 184) !important;
        }

        .message-laisse-tab:not(.border-orange-500):hover {
          background: rgba(249, 115, 22, 0.05) !important;
          color: rgb(251, 146, 60) !important;
        }

        .message-laisse-tab.border-orange-500 {
          background: rgba(249, 115, 22, 0.1) !important;
          color: rgb(251, 146, 60) !important;
          border-bottom-color: rgb(251, 146, 60) !important;
        }

        .termine-tab:not(.border-blue-500) {
          background: transparent !important;
          color: rgb(148, 163, 184) !important;
        }

        .termine-tab:not(.border-blue-500):hover {
          background: rgba(59, 130, 246, 0.2) !important;
          color: rgb(59, 130, 246) !important;
        }

        .termine-tab.border-blue-500 {
          background: rgba(59, 130, 246, 0.1) !important;
          color: rgb(59, 130, 246) !important;
          border-bottom-color: rgb(59, 130, 246) !important;
        }

        /* Badges et éléments orange dans les sections mandats - en orange */
        .bg-orange-500\/20 {
          background-color: rgba(249, 115, 22, 0.2) !important;
        }

        .text-orange-400 {
          color: rgb(251, 146, 60) !important;
        }

        .border-orange-500\/30 {
          border-color: rgba(249, 115, 22, 0.3) !important;
        }

        .hover\:bg-orange-900\/40:hover {
          background-color: rgba(194, 65, 12, 0.4) !important;
        }

        .bg-orange-900\/20 {
          background-color: rgba(194, 65, 12, 0.2) !important;
        }

        .bg-orange-500\/30 {
          background-color: rgba(249, 115, 22, 0.3) !important;
        }

        /* Tabs avec couleur red */
        button[role="tab"][class*="red"]:hover,
        [role="tab"][class*="red"]:hover {
          background: rgba(239, 68, 68, 0.15) !important;
          background-color: rgba(239, 68, 68, 0.15) !important;
          background-image: none !important;
          color: rgb(239, 68, 68) !important;
        }

        button[role="tab"][class*="red"][class*="border-red"],
        [role="tab"][class*="red"][class*="border-red"] {
          background: rgba(239, 68, 68, 0.1) !important;
          color: rgb(239, 68, 68) !important;
          border-bottom-color: rgb(239, 68, 68) !important;
        }

        /* Tabs par défaut (emerald/green) */
        button[role="tab"]:hover,
        [role="tab"]:hover {
          background: rgba(16, 185, 129, 0.15) !important;
          background-color: rgba(16, 185, 129, 0.15) !important;
          background-image: none !important;
          color: rgb(16, 185, 129) !important;
        }

        button[role="tab"][data-state="active"],
        [role="tab"][data-state="active"] {
          background: rgba(16, 185, 129, 0.25) !important;
          background-color: rgba(16, 185, 129, 0.25) !important;
          background-image: none !important;
          color: rgb(16, 185, 129) !important;
          border-bottom: 2px solid rgb(16, 185, 129) !important;
        }

        button:active:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not(td button):not(th button):not(.text-right button):not(table button):not([class*="border-b-"]):not(.border-b button),
        [role="button"]:active:not([class*="size-icon"]):not(td button):not(th button):not(.text-right button):not(.border-b button) {
          background: rgba(0, 0, 0, 0.15) !important;
          background-color: rgba(0, 0, 0, 0.15) !important;
          background-image: none !important;
          transform: translateY(0px);
        }



        .border-slate-700, .border-slate-800 {
          border: none !important;
          box-shadow: 
            6px 6px 12px rgba(0, 0, 0, 0.4),
            -6px -6px 12px rgba(71, 85, 105, 0.05) !important;
        }

        input, textarea, select {
          background-color: rgb(30, 41, 59) !important;
          box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.3),
            inset -3px -3px 6px rgba(71, 85, 105, 0.05) !important;
          border: none !important;
          transition: all 0.3s ease !important;
        }

        input:hover, textarea:hover, select:hover {
          box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.3),
            inset -3px -3px 6px rgba(71, 85, 105, 0.05),
            0 0 0 2px rgba(16, 185, 129, 0.3) !important;
        }

        input:focus, textarea:focus, select:focus {
          outline: none !important;
          box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.3),
            inset -3px -3px 6px rgba(71, 85, 105, 0.05),
            0 0 0 3px rgba(16, 185, 129, 0.5) !important;
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
        *::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        *::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }

        *::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166));
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.5);
        }

        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, rgb(5, 150, 105), rgb(13, 148, 136));
        }

        /* Scrollbar verticale */
        *::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(16, 185, 129), rgb(20, 184, 166));
        }

        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(5, 150, 105), rgb(13, 148, 136));
        }
      `}</style>
      
      {/* Notification Banner */}
      <NotificationBanner user={user} />
      
      {/* Dialog pour l'entrée de temps */}
      <Dialog open={isEntreeTempsOpen} onOpenChange={(open) => {
        if (!open && hasEntreeChanges) {
          setShowUnsavedWarning(true);
        } else {
          setIsEntreeTempsOpen(open);
        }
      }}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[75vw] w-[75vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="sticky top-0 z-10 bg-slate-900 py-6 pb-4 border-b border-slate-800 px-6">
            <h2 className="text-2xl font-bold text-white">Nouvelle entrée de temps</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-3">
            <form id="entree-temps-form" onSubmit={handleSubmit} className="space-y-3">
              {/* Section Informations du dossier */}
              <div className="border border-slate-700 bg-slate-800/30 rounded-lg mb-2">
                <div 
                  className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-2 px-3 bg-blue-900/20"
                  onClick={() => setInfoDossierCollapsed(!infoDossierCollapsed)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <FolderOpen className="w-3 h-3 text-blue-400" />
                      </div>
                      <h3 className="text-blue-300 text-sm font-semibold">Informations du dossier</h3>
                      {selectedDossier && (
                        <span className="text-slate-400 text-xs ml-2">
                          {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier} - {getClientsNames(selectedDossier.clients_ids)}
                        </span>
                      )}
                    </div>
                    {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {!infoDossierCollapsed && (
                <div className="pt-2 pb-2 px-3">
                  {!selectedDossierId ? (
                        <>
                          <div className="flex gap-2 mb-3 items-center">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                              <Input
                                placeholder="Rechercher un dossier..."
                                value={dossierSearchTerm}
                                onChange={(e) => setDossierSearchTerm(e.target.value)}
                                className="pl-10 bg-slate-800 border-slate-700 h-8 text-sm"
                              />
                            </div>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="sm"
                              onClick={() => setIsEntreeTempsFiltersOpen(!isEntreeTempsFiltersOpen)}
                              className="h-8 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative"
                            >
                              <Filter className="w-4 h-4 mr-2" />
                              <span className="text-sm">Filtres</span>
                              {(entreeTempsFilterArpenteur.length > 0 || entreeTempsFilterMandat.length > 0 || entreeTempsFilterTache.length > 0 || entreeTempsFilterVille.length > 0) && (
                                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                  {entreeTempsFilterArpenteur.length + entreeTempsFilterMandat.length + entreeTempsFilterTache.length + entreeTempsFilterVille.length}
                                </Badge>
                              )}
                              {isEntreeTempsFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                            </Button>
                          </div>

                          <Collapsible open={isEntreeTempsFiltersOpen} onOpenChange={setIsEntreeTempsFiltersOpen}>
                            <CollapsibleContent>
                              <div className="p-2 border border-emerald-500/30 rounded-lg mb-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                                    <div className="flex items-center gap-2">
                                      <Filter className="w-3 h-3 text-emerald-500" />
                                      <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                                    </div>
                                    {(entreeTempsFilterArpenteur.length > 0 || entreeTempsFilterMandat.length > 0 || entreeTempsFilterTache.length > 0 || entreeTempsFilterVille.length > 0) && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEntreeTempsFilterArpenteur([]);
                                          setEntreeTempsFilterMandat([]);
                                          setEntreeTempsFilterTache([]);
                                          setEntreeTempsFilterVille([]);
                                        }}
                                        className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                                      >
                                        <X className="w-2.5 h-2.5 mr-1" />
                                        Réinitialiser
                                      </Button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-4 gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Arpenteurs ({entreeTempsFilterArpenteur.length > 0 ? `${entreeTempsFilterArpenteur.length}` : 'Tous'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-48 bg-slate-800 border-slate-700">
                                        {ARPENTEURS.map((arp) => (
                                          <DropdownMenuCheckboxItem
                                            key={arp}
                                            checked={entreeTempsFilterArpenteur.includes(arp)}
                                            onCheckedChange={(checked) => {
                                              setEntreeTempsFilterArpenteur(
                                                checked
                                                  ? [...entreeTempsFilterArpenteur, arp]
                                                  : entreeTempsFilterArpenteur.filter((a) => a !== arp)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {arp}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Mandats ({entreeTempsFilterMandat.length > 0 ? `${entreeTempsFilterMandat.length}` : 'Tous'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                        {TYPES_MANDATS.map((type) => (
                                          <DropdownMenuCheckboxItem
                                            key={type}
                                            checked={entreeTempsFilterMandat.includes(type)}
                                            onCheckedChange={(checked) => {
                                              setEntreeTempsFilterMandat(
                                                checked
                                                  ? [...entreeTempsFilterMandat, type]
                                                  : entreeTempsFilterMandat.filter((t) => t !== type)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {type}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Tâches ({entreeTempsFilterTache.length > 0 ? `${entreeTempsFilterTache.length}` : 'Toutes'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                        {TACHES.map((tache) => (
                                          <DropdownMenuCheckboxItem
                                            key={tache}
                                            checked={entreeTempsFilterTache.includes(tache)}
                                            onCheckedChange={(checked) => {
                                              setEntreeTempsFilterTache(
                                                checked
                                                  ? [...entreeTempsFilterTache, tache]
                                                  : entreeTempsFilterTache.filter((t) => t !== tache)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {tache}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                          <span className="truncate">Villes ({entreeTempsFilterVille.length > 0 ? `${entreeTempsFilterVille.length}` : 'Toutes'})</span>
                                          <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                                        {[...new Set(dossiers.flatMap(d => d.mandats?.map(m => m.adresse_travaux?.ville).filter(Boolean) || []))].sort().map((ville) => (
                                          <DropdownMenuCheckboxItem
                                            key={ville}
                                            checked={entreeTempsFilterVille.includes(ville)}
                                            onCheckedChange={(checked) => {
                                              setEntreeTempsFilterVille(
                                                checked
                                                  ? [...entreeTempsFilterVille, ville]
                                                  : entreeTempsFilterVille.filter((v) => v !== ville)
                                              );
                                            }}
                                            className="text-white text-xs"
                                          >
                                            {ville}
                                          </DropdownMenuCheckboxItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                      <div className="overflow-hidden border border-slate-700 rounded-lg">
                        <div className="overflow-y-auto max-h-[300px]">
                          <Table>
                            <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead className="text-slate-300 text-xs">N° Dossier</TableHead>
                                <TableHead className="text-slate-300 text-xs">Clients</TableHead>
                                <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                                <TableHead className="text-slate-300 text-xs">Lot</TableHead>
                                <TableHead className="text-slate-300 text-xs">Tâche actuelle</TableHead>
                                <TableHead className="text-slate-300 text-xs">Adresse</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(dossierSearchTerm ? filteredDossiers : [...dossiers].sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture))).flatMap((dossier) => {
                                const clientsNames = getClientsNames(dossier.clients_ids);
                                if (!dossier.mandats || dossier.mandats.length === 0) {
                                  return null;
                                }
                                return dossier.mandats.filter((mandat) => {
                                  const matchesArpenteur = entreeTempsFilterArpenteur.length === 0 || entreeTempsFilterArpenteur.includes(dossier.arpenteur_geometre);
                                  const matchesMandat = entreeTempsFilterMandat.length === 0 || entreeTempsFilterMandat.includes(mandat.type_mandat);
                                  const matchesTache = entreeTempsFilterTache.length === 0 || entreeTempsFilterTache.includes(mandat.tache_actuelle);
                                  const matchesVille = entreeTempsFilterVille.length === 0 || entreeTempsFilterVille.includes(mandat.adresse_travaux?.ville);
                                  return matchesArpenteur && matchesMandat && matchesTache && matchesVille;
                                }).map((mandat, idx) => {
                                  const lotsDisplay = mandat.lots && mandat.lots.length > 0 
                                    ? mandat.lots.map(lotId => {
                                        const lot = lots.find(l => l.id === lotId);
                                        return lot ? lot.numero_lot : lotId;
                                      }).join(', ')
                                    : '-';
                                  return (
                                    <TableRow
                                      key={`${dossier.id}-${idx}`}
                                      className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                                      onClick={() => handleDossierSelect(dossier.id)}
                                    >
                                      <TableCell className="font-medium text-xs">
                                        <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-slate-300 text-xs">{clientsNames || "-"}</TableCell>
                                      <TableCell className="text-slate-300 text-xs">
                                        <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                                          {getAbbreviatedMandatType(mandat.type_mandat)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-slate-300 text-xs">{lotsDisplay}</TableCell>
                                      <TableCell className="text-slate-300 text-xs">
                                        {mandat.tache_actuelle ? (
                                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                            {mandat.tache_actuelle}
                                          </Badge>
                                        ) : '-'}
                                      </TableCell>
                                      <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                                        {mandat.adresse_travaux ? formatAdresse(mandat.adresse_travaux) : "-"}
                                      </TableCell>
                                    </TableRow>
                                  );
                                });
                              })}
                              {(dossierSearchTerm ? filteredDossiers : dossiers.slice(0, 10)).length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-4 text-slate-500 text-xs">
                                    Aucun dossier trouvé
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-0 bg-slate-800/30 rounded-lg border border-slate-700">
                      <div className="overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-800/50">
                            <TableRow className="hover:bg-slate-800/50 border-slate-700">
                              <TableHead className="text-slate-300 text-xs">N° Dossier</TableHead>
                              <TableHead className="text-slate-300 text-xs">Clients</TableHead>
                              <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                              <TableHead className="text-slate-300 text-xs">Lot</TableHead>
                              <TableHead className="text-slate-300 text-xs">Tâche actuelle</TableHead>
                              <TableHead className="text-slate-300 text-xs">Adresse</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="hover:bg-slate-800/30 border-slate-800">
                              <TableCell className="font-medium text-xs p-2">
                                <Badge variant="outline" className={`${getArpenteurColor(selectedDossier?.arpenteur_geometre)} border`}>
                                  {getArpenteurInitials(selectedDossier?.arpenteur_geometre)}{selectedDossier?.numero_dossier}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300 text-xs p-2">{getClientsNames(selectedDossier?.clients_ids) || "-"}</TableCell>
                              <TableCell className="text-slate-300 text-xs p-2">
                                <Badge className={`${getMandatColor(selectedDossier?.mandats?.[0]?.type_mandat)} border text-xs`}>
                                  {getAbbreviatedMandatType(selectedDossier?.mandats?.[0]?.type_mandat) || "-"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300 text-xs p-2">{selectedDossier?.mandats?.[0]?.lots?.map(lotId => {
                                const lot = lots.find(l => l.id === lotId);
                                return lot ? lot.numero_lot : lotId;
                              }).join(", ") || "-"}</TableCell>
                              <TableCell className="text-slate-300 text-xs p-2">
                                {selectedDossier?.mandats?.[0]?.tache_actuelle ? (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                                    {selectedDossier.mandats[0].tache_actuelle}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-slate-300 text-xs p-2 max-w-xs truncate">{selectedDossier?.mandats?.[0]?.adresse_travaux ? formatAdresse(selectedDossier.mandats[0].adresse_travaux) : "-"}</TableCell>
                              <TableCell className="text-right p-2">
                                <div className="border border-slate-500 rounded px-2 py-1 inline-block">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedDossierId(null);
                                      setEntreeForm({...entreeForm, dossier_id: "", mandat: "", tache_suivante: "", utilisateur_assigne: ""});
                                    }}
                                    className="text-slate-400 text-xs h-6 border-0"
                                  >
                                    Changer
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                    </div>
                    )}
                    </div>

                    {/* Section Détails de l'entrée */}
                    {selectedDossierId && (
                    <div className="border border-slate-700 bg-slate-800/30 rounded-lg">
                    <div 
                    className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-2 px-3 bg-orange-900/20"
                    onClick={() => setDetailsCollapsed(!detailsCollapsed)}
                    >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-500/30 flex items-center justify-center">
                          <Timer className="w-3 h-3 text-orange-400" />
                        </div>
                        <h3 className="text-orange-300 text-sm font-semibold">Détails de l'entrée</h3>
                      </div>
                      {detailsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                    </div>
                    </div>

                    {!detailsCollapsed && (
                    <div className="pt-2 pb-2 px-3">
                    <div className="rounded-lg p-3">
                      <div className="grid grid-cols-5 gap-2">
                        <div className="space-y-0.5">
                          <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                          <Input
                            type="date"
                            value={entreeForm.date}
                            onChange={(e) => {
                              setEntreeForm({...entreeForm, date: e.target.value});
                              setHasEntreeChanges(true);
                            }}
                            required
                            className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Temps <span className="text-red-400">*</span></Label>
                          <Input
                            type="number"
                            step="0.25"
                            min="0"
                            value={entreeForm.heures}
                            onChange={(e) => {
                              setEntreeForm({...entreeForm, heures: e.target.value});
                              setHasEntreeChanges(true);
                            }}
                            required
                            placeholder="Ex: 2.5"
                            className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Tâche accomplie <span className="text-red-400">*</span></Label>
                          <Select value={entreeForm.tache} onValueChange={(value) => {
                            setEntreeForm({...entreeForm, tache: value});
                            setHasEntreeChanges(true);
                          }}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {TACHES.map((tache) => (
                                <SelectItem key={tache} value={tache} className="text-white text-xs">
                                  {tache}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Tâche suivante</Label>
                          <Select value={entreeForm.tache_suivante} onValueChange={(value) => {
                            setEntreeForm({...entreeForm, tache_suivante: value});
                            setHasEntreeChanges(true);
                          }}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {TACHES.map((tache) => (
                                <SelectItem key={tache} value={tache} className="text-white text-xs">
                                  {tache}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                          <Select value={entreeForm.utilisateur_assigne} onValueChange={(value) => {
                            setEntreeForm({...entreeForm, utilisateur_assigne: value});
                            setHasEntreeChanges(true);
                          }}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                               {users.map((usr) => (
                                <SelectItem key={usr.email} value={usr.email} className="text-white text-xs">
                                  {usr.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-2 space-y-0.5">
                        <Label className="text-slate-400 text-xs">Description</Label>
                        <Textarea
                          value={entreeForm.description}
                          onChange={(e) => {
                            setEntreeForm({...entreeForm, description: e.target.value});
                            setHasEntreeChanges(true);
                          }}
                          placeholder="Détails supplémentaires..."
                          className="bg-slate-700 border-slate-600 text-white h-20 text-xs"
                        />
                      </div>
                    </div>
                    </div>
                    )}
                    </div>
                    )}
            </form>
          </div>

          <div className="flex justify-end gap-3 py-4 px-6 bg-slate-900 border-t border-slate-800 w-full">
            <Button 
              type="button" 
              variant="outline" 
              className="border-red-500 text-red-400 hover:bg-red-500/10"
              onClick={() => {
                if (hasEntreeChanges) {
                  setShowUnsavedWarning(true);
                } else {
                  setIsEntreeTempsOpen(false);
                }
              }}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              form="entree-temps-form" 
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
              disabled={!selectedDossierId}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'avertissement modifications non sauvegardées */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">
              Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button
                type="button"
                onClick={() => {
                  setShowUnsavedWarning(false);
                  setIsEntreeTempsOpen(false);
                  setHasEntreeChanges(false);
                  resetForm();
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Abandonner
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowUnsavedWarning(false)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Continuer l'édition
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Sidebar collapsible="icon" className="border-r border-slate-950 bg-slate-950">
          <SidebarHeader className="border-b border-slate-900 p-3 bg-slate-950">
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
          
          <SidebarContent className="p-1.5 bg-slate-950">
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
                                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20' 
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
                                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
                                  ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20' 
                                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
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
                              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/20' 
                              : 'text-slate-400 hover:text-white hover:bg-slate-900'
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

          <SidebarFooter className="border-t border-slate-900 p-2.5 bg-slate-950 space-y-2.5">
            <Button
              onClick={() => setOpen(!open)}
              variant="ghost"
              size="icon"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300"
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
          <header className="fixed top-0 left-0 right-0 z-[1000] w-full bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-4 md:hidden">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-bold text-white">GestionGTG</h1>
            </div>

            {/* Barre de recherche de dossiers au centre */}
            <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
              <DossierSearchBar dossiers={dossiers} clients={clients} />
            </div>

            {/* Boutons à droite - Entrée de temps et Notification */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEntreeTempsOpen(true)}
                size="icon"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg"
              >
                <Timer className="w-5 h-5 text-white" />
              </Button>
              <NotificationButton user={user} />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </SidebarProvider>
  );
}