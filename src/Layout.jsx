
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, Link2, MapPin, Compass, Calendar, UserCircle, Clock, BarChart3, FolderOpen, Grid3x3, ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    title: "Cédule Terrain",
    url: createPageUrl("CeduleTerrain"),
    icon: MapPin,
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

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [isEntreeTempsOpen, setIsEntreeTempsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const queryClient = useQueryClient();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('light-mode', savedTheme === 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light-mode', newTheme === 'light');
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const [entreeForm, setEntreeForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heures: "",
    dossier_id: "",
    mandat: "",
    tache: "",
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
      description: ""
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createEntreeMutation.mutate({
      ...entreeForm,
      heures: parseFloat(entreeForm.heures)
    });
  };

  const handleDossierChange = (dossierId) => {
    const selectedDossier = dossiers.find(d => d.id === dossierId);
    setEntreeForm({
      ...entreeForm,
      dossier_id: dossierId,
      mandat: selectedDossier?.titre || ""
    });
  };

  return (
    <SidebarProvider>
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

        .light-mode {
          --background: 0 0% 100%;
          --foreground: 222.2 84% 4.9%;
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --popover: 0 0% 100%;
          --popover-foreground: 222.2 84% 4.9%;
          --primary: 217.2 91.2% 59.8%;
          --primary-foreground: 210 40% 98%;
          --secondary: 210 40% 96.1%;
          --secondary-foreground: 222.2 47.4% 11.2%;
          --muted: 210 40% 96.1%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --accent: 210 40% 96.1%;
          --accent-foreground: 222.2 47.4% 11.2%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 210 40% 98%;
          --border: 214.3 31.8% 91.4%;
          --input: 214.3 31.8% 91.4%;
          --ring: 217.2 91.2% 59.8%;
        }

        .light-mode .bg-slate-950,
        .light-mode .from-slate-950,
        .light-mode .via-slate-900,
        .light-mode .to-slate-950 {
          background: linear-gradient(to bottom right, #f8fafc, #f1f5f9, #e2e8f0) !important;
        }

        .light-mode .bg-slate-900,
        .light-mode .bg-slate-900\/50 {
          background: rgba(255, 255, 255, 0.8) !important;
          border-color: #e2e8f0 !important;
        }

        .light-mode .bg-slate-800,
        .light-mode .bg-slate-800\/50,
        .light-mode .bg-slate-800\/30 {
          background: rgba(241, 245, 249, 0.8) !important;
          border-color: #cbd5e1 !important;
        }

        .light-mode .text-white {
          color: #0f172a !important;
        }

        .light-mode .text-slate-300,
        .light-mode .text-slate-400 {
          color: #475569 !important;
        }

        .light-mode .text-slate-500,
        .light-mode .text-slate-600 {
          color: #64748b !important;
        }

        .light-mode .border-slate-700,
        .light-mode .border-slate-800 {
          border-color: #cbd5e1 !important;
        }

        .light-mode .hover\\:bg-slate-800:hover {
          background: #f1f5f9 !important;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Sidebar className={`border-r border-slate-950 bg-slate-950 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
          <SidebarHeader className="border-b border-slate-900 p-6 bg-slate-950">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <MapPin className="w-5 h-5 text-white absolute" />
                  <Compass className="w-6 h-6 text-white opacity-60" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg">GestionGTG</h2>
                  <p className="text-xs text-slate-400">Arpentage & Géomatique</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <MapPin className="w-5 h-5 text-white absolute" />
                  <Compass className="w-6 h-6 text-white opacity-60" />
                </div>
              </div>
            )}
          </SidebarHeader>
          
          <SidebarContent className="p-3 bg-slate-950">
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
                      <SidebarMenuButton 
                        asChild 
                        className={`transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/20' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <Link to={item.url} className={`flex items-center gap-3 px-3 py-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
                          <item.icon className="w-5 h-5" />
                          {!isCollapsed && <span className="font-medium">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-900 p-4 bg-slate-950 space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full text-slate-400 hover:text-white hover:bg-slate-900"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Réduire
                </>
              )}
            </Button>

            <Dialog open={isEntreeTempsOpen} onOpenChange={setIsEntreeTempsOpen}>
              <DialogTrigger asChild>
                <Button className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg ${isCollapsed ? 'px-2' : ''}`}>
                  <Clock className="w-4 h-4 mr-2" />
                  {!isCollapsed && 'Entrée de temps'}
                </Button>
              </DialogTrigger>
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
                    <Select value={entreeForm.dossier_id} onValueChange={handleDossierChange}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner un dossier" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="aucun" className="text-white">Aucun dossier</SelectItem>
                        {dossiers.map((dossier) => (
                          <SelectItem key={dossier.id} value={dossier.id} className="text-white">
                            {dossier.numero_dossier} - {dossier.titre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mandat</Label>
                    <Input
                      value={entreeForm.mandat}
                      onChange={(e) => setEntreeForm({...entreeForm, mandat: e.target.value})}
                      placeholder="Mandat du dossier"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tâche accomplie <span className="text-red-400">*</span></Label>
                    <Input
                      value={entreeForm.tache}
                      onChange={(e) => setEntreeForm({...entreeForm, tache: e.target.value})}
                      required
                      placeholder="Ex: Rédaction du rapport"
                      className="bg-slate-800 border-slate-700"
                    />
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

            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">GestionGTG</p>
                  <p className="text-xs text-slate-400 truncate">Version 2.0</p>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 md:hidden">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-bold text-white">GestionGTG</h1>
            </div>
            
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
                title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
