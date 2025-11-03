import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, User, Link2, MapPin, Compass, Calendar, UserCircle, Clock, BarChart3, FolderOpen, Grid3x3, ChevronLeft, ChevronRight } from "lucide-react";
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
  const queryClient = useQueryClient();

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
          <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors duration-200 text-white" />
              <h1 className="text-xl font-bold text-white">GestionGTG</h1>
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