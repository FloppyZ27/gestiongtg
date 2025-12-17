import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, Link2, MapPin, Compass, Calendar, UserCircle, Clock, BarChart3, FolderOpen, Grid3x3, ChevronLeft, ChevronRight, Phone, Search, MessageCircle, Plus, Kanban, Shield, Users, CalendarDays, FilePlus, Cloud } from "lucide-react";
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
    title: "Prise de mandat",
    url: createPageUrl("PriseDeMandat"),
    icon: FilePlus,
  },
  {
    title: "Retours d'appel",
    url: createPageUrl("RetoursAppel"),
    icon: Phone,
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

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const [isEntreeTempsOpen, setIsEntreeTempsOpen] = useState(false);
  const [dossierSearchTerm, setDossierSearchTerm] = useState("");
  const [selectedDossierId, setSelectedDossierId] = useState(null);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Créer l'entrée de temps
    await createEntreeMutation.mutateAsync({
      ...entreeForm,
      heures: parseFloat(entreeForm.heures)
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
    setSelectedDossierId(dossierId);
    const dossier = dossiers.find(d => d.id === dossierId);
    
    // Auto-remplir le mandat, la tâche suivante et l'utilisateur assigné si disponibles
    const premierMandat = dossier?.mandats?.[0];
    setEntreeForm({
      ...entreeForm,
      dossier_id: dossierId,
      mandat: premierMandat?.type_mandat || "",
      tache_suivante: premierMandat?.tache_actuelle || "",
      utilisateur_assigne: premierMandat?.utilisateur_assigne || ""
    });
    setDossierSearchTerm("");
  };

  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
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

        /* Overlay transparent avec flou léger */
        [data-state="open"] > div[data-radix-dialog-overlay],
        div[data-radix-dialog-overlay],
        [data-radix-dialog-overlay] {
          background-color: transparent !important;
          backdrop-filter: blur(2px) !important;
          -webkit-backdrop-filter: blur(2px) !important;
          opacity: 1 !important;
        }

        /* Forcer la transparence de tous les overlays avec flou */
        .fixed.inset-0.z-50.bg-black\\/80,
        .fixed.inset-0.z-50 {
          background-color: transparent !important;
          backdrop-filter: blur(2px) !important;
          -webkit-backdrop-filter: blur(2px) !important;
        }

        /* Effet glassmorphism sur les fenêtres dialog */
        [role="dialog"] {
          background: rgba(15, 23, 42, 0.4) !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37) !important;
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
        button[class*="variant-ghost"] {
          background-color: transparent !important;
          background-image: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Style minimaliste pour les autres boutons - contour coloré */
        button:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8),
        [role="button"]:not([class*="size-icon"]) {
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
        button:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8):not([class*="from-"]),
        [role="button"]:not([class*="size-icon"]):not([class*="from-"]) {
          border: 2px solid rgba(148, 163, 184, 0.5) !important;
        }

        button:hover:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8),
        [role="button"]:hover:not([class*="size-icon"]) {
          background: rgba(255, 255, 255, 0.08) !important;
          background-color: rgba(255, 255, 255, 0.08) !important;
          background-image: none !important;
          transform: translateY(-1px);
        }

        button:active:not([class*="size-icon"]):not([class*="hover:bg-slate"]):not([class*="bg-slate-8"]):not([class*="bg-slate-9"]):not(.h-10.w-10):not(.h-9.w-9):not(.h-8.w-8),
        [role="button"]:active:not([class*="size-icon"]) {
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
          box-shadow: 
            inset 3px 3px 6px rgba(0, 0, 0, 0.3),
            inset -3px -3px 6px rgba(71, 85, 105, 0.05) !important;
          border: none !important;
        }

        /* Police handwriting pour les titres */
        h1, h2, h3, h4, h5, h6,
        [role="heading"],
        [class*="DialogTitle"],
        [class*="CardTitle"],
        [class*="CardHeader"],
        [class*="SidebarGroupLabel"],
        .text-2xl, .text-3xl, .text-xl, .text-lg, .text-base {
          font-family: 'Caveat', cursive !important;
          font-weight: 600 !important;
          letter-spacing: 0.5px !important;
          text-transform: uppercase !important;
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
      <Dialog open={isEntreeTempsOpen} onOpenChange={setIsEntreeTempsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nouvelle entrée de temps</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Colonne gauche - Sélection du dossier (60%) */}
            <div className="flex-[0_0_60%] flex flex-col space-y-4 overflow-hidden">
              <Label className="text-lg font-semibold">Sélection du dossier</Label>
              
              {!selectedDossierId ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher un dossier..."
                      value={dossierSearchTerm}
                      onChange={(e) => setDossierSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700"
                    />
                  </div>
                  
                  {/* Tableau de sélection des dossiers */}
                  <div className="flex-1 overflow-hidden border border-slate-700 rounded-lg">
                    <div className="overflow-y-auto max-h-[500px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">N° Dossier</TableHead>
                            <TableHead className="text-slate-300">Clients</TableHead>
                            <TableHead className="text-slate-300">Mandats</TableHead>
                            <TableHead className="text-slate-300">Adresse</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(dossierSearchTerm ? filteredDossiers : dossiers.slice(0, 10)).map((dossier) => {
                            const clientsNames = getClientsNames(dossier.clients_ids);
                            return (
                              <TableRow
                                key={dossier.id}
                                className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                                onClick={() => handleDossierSelect(dossier.id)}
                              >
                                <TableCell className="font-medium">
                                  <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                    {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-slate-300 text-sm">
                                  {clientsNames || "-"}
                                </TableCell>
                                <TableCell className="text-slate-300">
                                  {dossier.mandats && dossier.mandats.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {dossier.mandats.slice(0, 2).map((mandat, idx) => (
                                        <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
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
                                <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                                  {dossier.mandats?.[0]?.adresse_travaux ? formatAdresse(dossier.mandats[0].adresse_travaux) : "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {(dossierSearchTerm ? filteredDossiers : dossiers.slice(0, 10)).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-slate-500">
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
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                    <div className="flex-1">
                      <Badge variant="outline" className={`${getArpenteurColor(selectedDossier?.arpenteur_geometre)} border mb-2`}>
                        {getArpenteurInitials(selectedDossier?.arpenteur_geometre)}{selectedDossier?.numero_dossier}
                      </Badge>
                      <p className="text-slate-400 text-sm">{getClientsNames(selectedDossier?.clients_ids)}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDossierId(null);
                        setEntreeForm({...entreeForm, dossier_id: "", mandat: "", tache_suivante: "", utilisateur_assigne: ""});
                      }}
                      className="text-slate-400"
                    >
                      Changer
                    </Button>
                  </div>

                  {availableMandats.length > 0 && (
                    <div className="space-y-2">
                      <Label>Mandat</Label>
                      <Select value={entreeForm.mandat} onValueChange={(value) => {
                        const mandat = availableMandats.find(m => m.type_mandat === value);
                        setEntreeForm({
                          ...entreeForm, 
                          mandat: value,
                          tache_suivante: mandat?.tache_actuelle || "",
                          utilisateur_assigne: mandat?.utilisateur_assigne || ""
                        });
                      }}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner un mandat" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {availableMandats.map((mandat, index) => (
                            <SelectItem key={mandat.id || index} value={mandat.type_mandat || `Mandat ${index + 1}`} className="text-white">
                              {mandat.type_mandat || `Mandat ${index + 1}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={entreeForm.description}
                      onChange={(e) => setEntreeForm({...entreeForm, description: e.target.value})}
                      placeholder="Détails supplémentaires..."
                      className="bg-slate-800 border-slate-700 h-32"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Colonne droite - Champs de formulaire (40%) */}
            <div className="flex-[0_0_40%] flex flex-col space-y-4 overflow-y-auto border-l border-slate-700 pl-6 pr-6">
              <Label className="text-lg font-semibold">Détails de l'entrée</Label>
              
              <div className="space-y-2">
                <Label>Date <span className="text-red-400">*</span></Label>
                <Input
                  type="date"
                  value={entreeForm.date}
                  onChange={(e) => setEntreeForm({...entreeForm, date: e.target.value})}
                  required
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Temps <span className="text-red-400">*</span></Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0"
                  value={entreeForm.heures}
                  onChange={(e) => setEntreeForm({...entreeForm, heures: e.target.value})}
                  required
                  placeholder="Ex: 2.5"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Tâche accomplie <span className="text-red-400">*</span></Label>
                <Select value={entreeForm.tache} onValueChange={(value) => setEntreeForm({...entreeForm, tache: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sélectionner une tâche" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TACHES.map((tache) => (
                      <SelectItem key={tache} value={tache} className="text-white">
                        {tache}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tâche suivante</Label>
                <Select value={entreeForm.tache_suivante} onValueChange={(value) => setEntreeForm({...entreeForm, tache_suivante: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sélectionner une tâche" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TACHES.map((tache) => (
                      <SelectItem key={tache} value={tache} className="text-white">
                        {tache}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Utilisateur assigné</Label>
                <Select value={entreeForm.utilisateur_assigne} onValueChange={(value) => setEntreeForm({...entreeForm, utilisateur_assigne: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value={null} className="text-white">Aucun utilisateur</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.email} value={user.email} className="text-white">
                        {user.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsEntreeTempsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" onClick={handleSubmit} className="bg-gradient-to-r from-emerald-500 to-teal-600">
              Enregistrer
            </Button>
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
                  {navigationItems.map((item) => (
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
                  ))}

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

        <main className="flex-1 flex flex-col">
          <header className="sticky top-0 z-50 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
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
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg relative"
              >
                <Clock className="w-5 h-5" />
                <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-white text-emerald-600 rounded-full" />
              </Button>
              <NotificationButton user={user} />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
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