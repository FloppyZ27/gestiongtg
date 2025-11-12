import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, Link2, MapPin, Compass, Calendar, UserCircle, Clock, BarChart3, FolderOpen, Grid3x3, ChevronLeft, ChevronRight, Phone, Search, MessageCircle, Plus } from "lucide-react";
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

import NotificationBanner from "@/components/shared/NotificationBanner";
import NotificationButton from "@/components/shared/NotificationButton";

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
    title: "Cédule Terrain",
    url: createPageUrl("CeduleTerrain"),
    icon: MapPin,
  },
  {
    title: "Lots",
    url: createPageUrl("Lots"),
    icon: Grid3x3,
  },
  {
    title: "Actes",
    url: createPageUrl("Dashboard"),
    icon: FileText,
  },
  {
    title: "Chaine de Titre",
    url: createPageUrl("ChaineDeTitre"),
    icon: Link2,
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
    setEntreeForm({
      ...entreeForm,
      dossier_id: dossierId,
      mandat: "" // Reset mandat when dossier changes
    });
    setDossierSearchTerm("");
  };

  const isCollapsed = state === "collapsed";

  return (
    <TooltipProvider>
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
      `}</style>
      
      {/* Notification Banner */}
      <NotificationBanner user={user} />
      
      {/* Dialog pour l'entrée de temps */}
      <Dialog open={isEntreeTempsOpen} onOpenChange={setIsEntreeTempsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle entrée de temps</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <Label>Heures <span className="text-red-400">*</span></Label>
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
            </div>

            <div className="space-y-2">
              <Label>Dossier</Label>
              {!selectedDossierId ? (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher un dossier..."
                      value={dossierSearchTerm}
                      onChange={(e) => setDossierSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700"
                    />
                  </div>
                  
                  {/* Tableau de sélection rapide des 5 derniers dossiers */}
                  {!dossierSearchTerm && (
                    <div className="border border-slate-700 rounded-lg overflow-hidden mb-3">
                      <div className="bg-slate-800/50 p-2 border-b border-slate-700">
                        <p className="text-xs text-slate-400">Dossiers récents</p>
                      </div>
                      {dossiers.slice(0, 5).map((dossier) => {
                        const clientsNames = getClientsNames(dossier.clients_ids);
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
                        
                        return (
                          <div
                            key={dossier.id}
                            className="p-3 cursor-pointer hover:bg-slate-700/50 border-b border-slate-800 last:border-b-0"
                            onClick={() => handleDossierSelect(dossier.id)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border flex-shrink-0`}>
                                {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                              </Badge>
                              {clientsNames && (
                                <span className="text-slate-300 text-sm truncate">{clientsNames}</span>
                              )}
                            </div>
                            {dossier.mandats && dossier.mandats.length > 0 && (
                              <div className="space-y-1">
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
                                {dossier.mandats[0]?.adresse_travaux && formatAdresse(dossier.mandats[0].adresse_travaux) && (
                                  <p className="text-slate-400 text-xs truncate">
                                    📍 {formatAdresse(dossier.mandats[0].adresse_travaux)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {dossierSearchTerm && (
                    <div className="max-h-64 overflow-y-auto border border-slate-700 rounded-lg">
                      {filteredDossiers.length > 0 ? (
                        filteredDossiers.map((dossier) => {
                          const clientsNames = getClientsNames(dossier.clients_ids);
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
                          
                          return (
                            <div
                              key={dossier.id}
                              className="p-3 cursor-pointer hover:bg-slate-700/50 border-b border-slate-800 last:border-b-0"
                              onClick={() => handleDossierSelect(dossier.id)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border flex-shrink-0`}>
                                  {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                </Badge>
                                {clientsNames && (
                                  <span className="text-slate-300 text-sm truncate">{clientsNames}</span>
                                )}
                              </div>
                              {dossier.mandats && dossier.mandats.length > 0 && (
                                <div className="space-y-1">
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
                                  {dossier.mandats[0]?.adresse_travaux && formatAdresse(dossier.mandats[0].adresse_travaux) && (
                                    <p className="text-slate-400 text-xs truncate">
                                      📍 {formatAdresse(dossier.mandats[0].adresse_travaux)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="p-3 text-center text-slate-500">Aucun dossier trouvé</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <div>
                    <p className="text-white font-medium">
                      {getArpenteurInitials(selectedDossier?.arpenteur_geometre)}{selectedDossier?.numero_dossier}
                    </p>
                    <p className="text-slate-400 text-sm">{getClientsNames(selectedDossier?.clients_ids)}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedDossierId(null);
                      setEntreeForm({...entreeForm, dossier_id: "", mandat: ""});
                    }}
                    className="text-slate-400"
                  >
                    Changer
                  </Button>
                </div>
              )}
            </div>

            {selectedDossierId && availableMandats.length > 0 && (
              <div className="space-y-2">
                <Label>Mandat</Label>
                <Select value={entreeForm.mandat} onValueChange={(value) => setEntreeForm({...entreeForm, mandat: value})}>
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={entreeForm.description}
                onChange={(e) => setEntreeForm({...entreeForm, description: e.target.value})}
                placeholder="Détails supplémentaires..."
                className="bg-slate-800 border-slate-700 h-24"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEntreeTempsOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                Enregistrer
              </Button>
            </div>
          </form>
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
          <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 md:hidden">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-bold text-white">GestionGTG</h1>
            </div>
            
            {/* Boutons à droite - Entrée de temps et Notification */}
            <div className="ml-auto flex items-center gap-2">
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