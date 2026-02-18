import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart2, Clock, ChevronUp, ChevronDown, Users, TrendingUp, List, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = { "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

// Retourne les classes inline border+text séparément pour les tabs
const getArpenteurTabStyle = (arpenteur, isActive) => {
  const styles = {
    "Samuel Guay": { border: "1px solid rgba(239,68,68,0.5)", color: "rgb(248,113,113)", background: isActive ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)" },
    "Pierre-Luc Pilote": { border: "1px solid rgba(148,163,184,0.5)", color: "rgb(203,213,225)", background: isActive ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.05)" },
    "Frédéric Gilbert": { border: "1px solid rgba(249,115,22,0.5)", color: "rgb(251,146,60)", background: isActive ? "rgba(249,115,22,0.15)" : "rgba(249,115,22,0.05)" },
    "Dany Gaboury": { border: "1px solid rgba(234,179,8,0.5)", color: "rgb(250,204,21)", background: isActive ? "rgba(234,179,8,0.15)" : "rgba(234,179,8,0.05)" },
    "Benjamin Larouche": { border: "1px solid rgba(34,211,238,0.5)", color: "rgb(34,211,238)", background: isActive ? "rgba(34,211,238,0.15)" : "rgba(34,211,238,0.05)" },
  };
  return styles[arpenteur] || { border: "1px solid rgba(16,185,129,0.5)", color: "rgb(52,211,153)", background: isActive ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.05)" };
};

const getArpenteurTabColor = (arpenteur) => {
  const colors = { "Samuel Guay": "border-red-500 text-red-400 bg-red-500/10", "Pierre-Luc Pilote": "border-slate-400 text-slate-300 bg-slate-500/10", "Frédéric Gilbert": "border-orange-500 text-orange-400 bg-orange-500/10", "Dany Gaboury": "border-yellow-500 text-yellow-400 bg-yellow-500/10", "Benjamin Larouche": "border-cyan-500 text-cyan-400 bg-cyan-500/10" };
  return colors[arpenteur] || "border-emerald-500 text-emerald-400 bg-emerald-500/10";
};

const getMandatColor = (typeMandat) => {
  const colors = { "Bornage": "bg-red-500/20 text-red-400 border-red-500/30", "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30", "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30", "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30", "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30", "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30", "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30", "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

export default function Comptabilite() {
  const [feuilleTempsCollapsed, setFeuilleTempsCollapsed] = useState(false);
  const [mandatsCollapsed, setMandatsCollapsed] = useState(false);

  // Vue : 'liste' ou 'agenda'
  const [feuilleTempsView, setFeuilleTempsView] = useState('liste');

  // Semaine partagée entre les deux vues
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());

  // Utilisateur sélectionné pour l'agenda
  const [selectedAgendaUser, setSelectedAgendaUser] = useState(null);

  // Mandats tabs
  const [selectedArpenteur, setSelectedArpenteur] = useState(ARPENTEURS[0]);

  const agendaScrollRef = useRef(null);

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });
  const { data: dossiers = [] } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list(), initialData: [] });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });
  const { data: allPointages = [] } = useQuery({ queryKey: ['allPointages'], queryFn: () => base44.entities.Pointage.filter({ statut: 'termine' }, '-date', 1000), initialData: [] });

  // Scroll à 7h lors du passage en vue agenda
  useEffect(() => {
    if (feuilleTempsView === 'agenda' && agendaScrollRef.current) {
      agendaScrollRef.current.scrollTop = 7 * 60; // 7h * 60px/h
    }
  }, [feuilleTempsView]);

  // ---- Helpers pointage ----
  const getPointageDuration = (p) => {
    if (p.heure_debut_modifiee && p.heure_fin_modifiee) return p.duree_heures_modifiee || 0;
    if (p.heure_debut && p.heure_fin) return (new Date(p.heure_fin) - new Date(p.heure_debut)) / (1000 * 60 * 60);
    return p.duree_heures || 0;
  };

  // ---- Semaine partagée ----
  const getWeekDays = (baseDate) => {
    const dayOfWeek = baseDate.getDay();
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(sunday); d.setDate(sunday.getDate() + i); return d; });
  };

  const getMonthDays = (baseDate) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    return days;
  };

  const weekDays = getWeekDays(currentWeekDate);

  const getPointagesForDateUser = (date, userEmail) => {
    const dateStr = date.toISOString().split('T')[0];
    return allPointages.filter(p => p.date === dateStr && p.utilisateur_email === userEmail);
  };

  const getUserDayTotalHours = (date, userEmail) =>
    getPointagesForDateUser(date, userEmail).reduce((sum, p) => sum + getPointageDuration(p), 0);

  const getUserWeekHours = (userEmail) =>
    weekDays.reduce((sum, day) => sum + getUserDayTotalHours(day, userEmail), 0);

  const getUserMonthHours = (userEmail) =>
    getMonthDays(currentWeekDate).reduce((sum, day) => {
      const dateStr = day.toISOString().split('T')[0];
      return sum + allPointages.filter(p => p.date === dateStr && p.utilisateur_email === userEmail).reduce((s, p) => s + getPointageDuration(p), 0);
    }, 0);

  // ---- Mandats helpers ----
  const getMandatsOuverts = (arpenteur) =>
    dossiers.filter(d => d.arpenteur_geometre === arpenteur && d.statut === "Ouvert")
      .flatMap(d => (d.mandats || []).map(m => ({ dossier: d, mandat: m })));

  const getMandatProgress = (tacheActuelle) => {
    const idx = TACHES.indexOf(tacheActuelle || "Ouverture");
    if (idx < 0) return 0;
    return Math.round((idx / (TACHES.length - 1)) * 95 / 5) * 5;
  };

  const getMandatValeurProgression = (mandat) => {
    const prixNet = (mandat.prix_estime || 0) - (mandat.rabais || 0);
    return prixNet * (getMandatProgress(mandat.tache_actuelle) / 100);
  };

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => { const c = clients.find(cl => cl.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(Boolean).join(", ");
  };

  const activeAgendaUser = selectedAgendaUser || users[0];
  const mandatsItems = getMandatsOuverts(selectedArpenteur);
  const totalTarif = mandatsItems.reduce((sum, { mandat }) => sum + (mandat.prix_estime || 0) - (mandat.rabais || 0), 0);
  const totalValeurProgression = mandatsItems.reduce((sum, { mandat }) => sum + getMandatValeurProgression(mandat), 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="w-full">
          <div className="flex items-center gap-3 mb-8">
            <BarChart2 className="w-8 h-8 text-violet-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">Comptabilité</h1>
              <p className="text-slate-400">Feuilles de temps, heures et tarification des mandats</p>
            </div>
          </div>

          {/* ===== SECTION 1 : Feuille de temps (Liste + Agenda fusionnés) ===== */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
            <div className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-2 px-3 bg-cyan-900/20 border-b border-slate-800" onClick={() => setFeuilleTempsCollapsed(!feuilleTempsCollapsed)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center"><Clock className="w-3 h-3 text-cyan-400" /></div>
                  <h3 className="text-cyan-300 text-sm font-semibold">Feuille de temps — Tous les utilisateurs</h3>
                </div>
                {feuilleTempsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!feuilleTempsCollapsed && (
              <CardContent className="p-4">
                {/* Contrôles : navigation + toggle vue */}
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div className="text-white font-semibold text-sm">
                    Semaine du {format(weekDays[0], "d MMMM", { locale: fr })} au {format(weekDays[6], "d MMMM yyyy", { locale: fr })}
                    <span className="ml-3 text-slate-400 font-normal text-xs">| {format(currentWeekDate, "MMMM yyyy", { locale: fr })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Toggle vue */}
                    <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                      <button
                        onClick={() => setFeuilleTempsView('liste')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${feuilleTempsView === 'liste' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <List className="w-3.5 h-3.5" /> Liste
                      </button>
                      <button
                        onClick={() => setFeuilleTempsView('agenda')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${feuilleTempsView === 'agenda' ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        <CalendarDays className="w-3.5 h-3.5" /> Agenda
                      </button>
                    </div>
                    {/* Navigation */}
                    <Button size="sm" variant="outline" onClick={() => setCurrentWeekDate(new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), currentWeekDate.getDate() - 7))} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-7 text-xs">← Préc.</Button>
                    <Button size="sm" onClick={() => setCurrentWeekDate(new Date())} className="bg-emerald-500/20 text-emerald-400 h-7 text-xs">Aujourd'hui</Button>
                    <Button size="sm" variant="outline" onClick={() => setCurrentWeekDate(new Date(currentWeekDate.getFullYear(), currentWeekDate.getMonth(), currentWeekDate.getDate() + 7))} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-7 text-xs">Suiv. →</Button>
                  </div>
                </div>

                {/* ---- VUE LISTE ---- */}
                {feuilleTempsView === 'liste' && (
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    {/* En-tête : Utilisateur + dim à sam + total */}
                    <div className="grid bg-slate-800/50 px-3 py-2 border-b border-slate-700" style={{ gridTemplateColumns: '2fr repeat(7, 1fr) 1fr' }}>
                      <div className="text-xs font-semibold text-slate-400">Utilisateur</div>
                      {weekDays.map((day, idx) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                          <div key={idx} className="text-xs font-semibold text-right" style={{ color: isToday ? 'rgb(52,211,153)' : 'rgb(148,163,184)' }}>
                            <div>{format(day, "EEE", { locale: fr })}</div>
                            <div>{format(day, "d")}</div>
                          </div>
                        );
                      })}
                      <div className="text-xs font-semibold text-slate-400 text-right">Total</div>
                    </div>

                    {/* Lignes par utilisateur */}
                    {users.map(u => {
                      const weekH = getUserWeekHours(u.email);
                      return (
                        <div key={u.id} className="grid px-3 py-2.5 border-b border-slate-800 hover:bg-slate-800/30 transition-colors items-center" style={{ gridTemplateColumns: '2fr repeat(7, 1fr) 1fr' }}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={u.photo_url} />
                              <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getInitials(u.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium text-sm">{u.full_name}</p>
                              <p className="text-slate-500 text-xs">{u.poste || u.role}</p>
                            </div>
                          </div>
                          {weekDays.map((day, idx) => {
                            const h = getUserDayTotalHours(day, u.email);
                            const isToday = day.toDateString() === new Date().toDateString();
                            return (
                              <div key={idx} className="text-right">
                                <span className={`text-xs font-medium ${h > 0 ? (isToday ? 'text-emerald-300' : 'text-slate-200') : 'text-slate-700'}`}>
                                  {h > 0 ? `${h.toFixed(1)}h` : '-'}
                                </span>
                              </div>
                            );
                          })}
                          <div className="text-right">
                            <span className={`font-bold text-sm ${weekH > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{weekH.toFixed(1)}h</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Ligne totaux par jour */}
                    <div className="grid px-3 py-2 bg-slate-800/50 items-center" style={{ gridTemplateColumns: '2fr repeat(7, 1fr) 1fr' }}>
                      <div className="text-xs font-bold text-slate-300">Total / jour</div>
                      {weekDays.map((day, idx) => {
                        const total = users.reduce((sum, u) => sum + getUserDayTotalHours(day, u.email), 0);
                        const isToday = day.toDateString() === new Date().toDateString();
                        return (
                          <div key={idx} className="text-right">
                            <span className={`text-xs font-bold ${total > 0 ? (isToday ? 'text-emerald-300' : 'text-slate-300') : 'text-slate-700'}`}>
                              {total > 0 ? `${total.toFixed(1)}h` : '-'}
                            </span>
                          </div>
                        );
                      })}
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-500">—</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---- VUE AGENDA ---- */}
                {feuilleTempsView === 'agenda' && (
                  <div className="border border-slate-700 rounded-lg overflow-hidden flex" style={{ height: '865px' }}>
                    {/* Colonne utilisateurs (filtre) */}
                    <div className="flex-shrink-0 border-r border-slate-700 bg-slate-900/60 flex flex-col" style={{ width: '18%' }}>
                      <div className="border-b border-slate-700 bg-slate-900/50 flex-shrink-0 px-2 py-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateurs</span>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {users.map(u => {
                          const isActive = activeAgendaUser?.email === u.email;
                          const weekH = getUserWeekHours(u.email);
                          return (
                            <button
                              key={u.id}
                              onClick={() => setSelectedAgendaUser(u)}
                              className={`w-full flex items-center gap-2 px-3 py-2.5 border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors text-left ${isActive ? 'bg-emerald-500/20 border-l-4 border-l-emerald-500' : ''}`}
                            >
                              <Avatar className="w-7 h-7 flex-shrink-0">
                                <AvatarImage src={u.photo_url} />
                                <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getInitials(u.full_name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs truncate leading-tight ${isActive ? 'text-emerald-300 font-semibold' : 'text-slate-200'}`}>{u.full_name}</p>
                                <p className={`text-[10px] ${weekH > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{weekH.toFixed(1)}h semaine</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grille horaire */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* En-têtes des jours */}
                      <div className="flex border-b border-slate-700 flex-shrink-0 bg-slate-900/50">
                        <div className="w-16 flex-shrink-0 border-r border-slate-700" />
                        {weekDays.map((day, idx) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayTotal = activeAgendaUser ? getUserDayTotalHours(day, activeAgendaUser.email) : 0;
                          return (
                            <div key={idx} className={`flex-1 text-center py-2 border-r border-slate-700 ${isToday ? 'ring-2 ring-emerald-500 ring-inset' : ''}`}>
                              <div className={`text-xs uppercase ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>{format(day, "EEE", { locale: fr })}</div>
                              <div className={`text-lg font-bold ${isToday ? 'text-emerald-400' : 'text-white'}`}>{format(day, "d")}</div>
                              {dayTotal > 0
                                ? <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] mt-0.5">{dayTotal.toFixed(1)}h</Badge>
                                : <span className="text-[10px] text-slate-700">-</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Grille horaire scrollable */}
                      <div className="overflow-y-auto flex-1 relative" ref={agendaScrollRef}>
                        <div className="flex relative" style={{ minHeight: '1440px' }}>
                          {/* Colonne des heures */}
                          <div className="w-16 flex-shrink-0 sticky left-0 z-20 bg-slate-900/30">
                            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                              <div key={hour} className="h-[60px] border-b border-slate-700/50 flex items-start">
                                <div className="w-full border-r border-slate-700 px-2 py-1 text-xs text-slate-500 text-right">
                                  {hour.toString().padStart(2, '0')}:00
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Colonnes des jours */}
                          {weekDays.map((day, dayIdx) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            const dayPointages = activeAgendaUser ? getPointagesForDateUser(day, activeAgendaUser.email) : [];

                            return (
                              <div key={dayIdx} className={`flex-1 border-r border-slate-700 relative ${isToday ? 'bg-emerald-500/5' : 'bg-slate-800/10'}`}>
                                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                                  <div key={hour} className="h-[60px] border-b border-slate-700/50"></div>
                                ))}

                                {dayPointages.map(p => {
                                  const isModified = p.heure_debut_modifiee && p.heure_fin_modifiee;
                                  const startTime = isModified ? new Date(p.heure_debut_modifiee) : new Date(p.heure_debut);
                                  const endTime = isModified ? new Date(p.heure_fin_modifiee) : new Date(p.heure_fin);
                                  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                                  const topPx = startTime.getHours() * 60 + startTime.getMinutes();
                                  const initialStart = new Date(p.heure_debut);
                                  const initialEnd = new Date(p.heure_fin);
                                  const initialDuration = (initialEnd.getTime() - initialStart.getTime()) / (1000 * 60 * 60);

                                  return (
                                    <Tooltip key={p.id}>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={`absolute left-1 right-1 rounded px-2 py-1 font-semibold z-20 cursor-default overflow-hidden flex flex-col ${
                                            isModified
                                              ? 'bg-gradient-to-r from-orange-500/60 to-amber-500/60 border border-orange-500 text-orange-50'
                                              : p.confirme
                                              ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/60 border border-green-500 text-green-50'
                                              : 'bg-gradient-to-r from-blue-500/60 to-indigo-500/60 border border-blue-500 text-blue-50'
                                          }`}
                                          style={{ height: `${Math.max(totalMinutes, 20)}px`, top: `${topPx}px` }}
                                        >
                                          {isModified && <div className="text-[10px] font-bold">MODIFIÉ</div>}
                                          {p.confirme && !isModified && <div className="text-[10px] font-bold">CONFIRMÉ</div>}
                                          <div className="text-[11px] leading-tight">
                                            <div className="opacity-80">
                                              {format(initialStart, "HH:mm")}–{format(initialEnd, "HH:mm")} ({initialDuration.toFixed(1)}h)
                                            </div>
                                            {isModified && (
                                              <div className="text-orange-300 mt-0.5">
                                                → {format(startTime, "HH:mm")}–{format(endTime, "HH:mm")} ({p.duree_heures_modifiee?.toFixed(1)}h)
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-3">
                                        <div className="space-y-1 text-xs">
                                          <div className="font-semibold text-emerald-400">Pointage du {format(new Date(p.date), "d MMMM yyyy", { locale: fr })}</div>
                                          <div className="text-slate-300">Initial: {format(initialStart, "HH:mm")} - {format(initialEnd, "HH:mm")} ({initialDuration.toFixed(2)}h)</div>
                                          {isModified && <div className="text-orange-400">Modifié: {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")} ({p.duree_heures_modifiee?.toFixed(2)}h)</div>}
                                          {p.description && <div className="text-slate-400 border-t border-slate-600 pt-1 mt-1">{p.description}</div>}
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
                )}
              </CardContent>
            )}
          </Card>

          {/* ===== SECTION 2 : Mandats ouverts avec tabs arpenteurs ===== */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
            <div className="cursor-pointer hover:bg-violet-900/40 transition-colors rounded-t-lg py-2 px-3 bg-violet-900/20 border-b border-slate-800" onClick={() => setMandatsCollapsed(!mandatsCollapsed)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center"><TrendingUp className="w-3 h-3 text-violet-400" /></div>
                  <h3 className="text-violet-300 text-sm font-semibold">Mandats ouverts — Tarification et progression</h3>
                </div>
                {mandatsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!mandatsCollapsed && (
              <CardContent className="p-4">
                <div className="flex gap-1 flex-wrap mb-4 border-b border-slate-700 pb-3">
                  {ARPENTEURS.map(arp => {
                    const count = getMandatsOuverts(arp).length;
                    const isActive = selectedArpenteur === arp;
                    const colorClass = getArpenteurColor(arp);
                    return (
                      <button
                        key={arp}
                        onClick={() => setSelectedArpenteur(arp)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${isActive ? `${colorClass} border` : `${colorClass} opacity-40 hover:opacity-80`}`}
                      >
                        {arp}
                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={`flex items-center justify-between mb-3 p-3 rounded-lg border bg-gradient-to-r ${getArpenteurTabColor(selectedArpenteur).includes('red') ? 'from-red-500/10 to-transparent border-red-500/20' : getArpenteurTabColor(selectedArpenteur).includes('slate') ? 'from-slate-500/10 to-transparent border-slate-500/20' : getArpenteurTabColor(selectedArpenteur).includes('orange') ? 'from-orange-500/10 to-transparent border-orange-500/20' : getArpenteurTabColor(selectedArpenteur).includes('yellow') ? 'from-yellow-500/10 to-transparent border-yellow-500/20' : 'from-cyan-500/10 to-transparent border-cyan-500/20'}`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${getArpenteurColor(selectedArpenteur)} border font-bold`}>{getArpenteurInitials(selectedArpenteur).replace('-', '')}</Badge>
                    <span className="text-white font-semibold">{selectedArpenteur}</span>
                    <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">{mandatsItems.length} mandat{mandatsItems.length > 1 ? 's' : ''}</Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Tarification totale</p>
                      <p className="text-white font-bold text-sm">{totalTarif.toFixed(2)} $</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Valeur progressée</p>
                      <p className="text-emerald-400 font-bold text-sm">{totalValeurProgression.toFixed(2)} $</p>
                    </div>
                  </div>
                </div>

                {mandatsItems.length > 0 ? (
                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[1.2fr,2fr,1.5fr,2fr,1fr,1.8fr] bg-slate-800/50 px-3 py-2 border-b border-slate-700">
                      <div className="text-xs font-semibold text-slate-400">N° Dossier</div>
                      <div className="text-xs font-semibold text-slate-400">Client</div>
                      <div className="text-xs font-semibold text-slate-400">Type</div>
                      <div className="text-xs font-semibold text-slate-400">Adresse travaux</div>
                      <div className="text-xs font-semibold text-slate-400 text-right">Prix net</div>
                      <div className="text-xs font-semibold text-slate-400 text-center">Progression / Valeur</div>
                    </div>
                    {mandatsItems.map(({ dossier, mandat }, idx) => {
                      const progress = getMandatProgress(mandat.tache_actuelle);
                      const prixNet = (mandat.prix_estime || 0) - (mandat.rabais || 0);
                      const valeurProgressee = getMandatValeurProgression(mandat);
                      return (
                        <div key={`${dossier.id}-${idx}`} className="grid grid-cols-[1.2fr,2fr,1.5fr,2fr,1fr,1.8fr] px-3 py-2 border-b border-slate-800 hover:bg-slate-800/30 transition-colors items-center gap-2">
                          <div className="text-white text-xs font-medium">{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</div>
                          <div className="text-slate-300 text-xs truncate">{getClientsNames(dossier.clients_ids)}</div>
                          <div><Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(mandat.type_mandat)}</Badge></div>
                          <div className="text-slate-300 text-xs truncate">{formatAdresse(mandat.adresse_travaux) || <span className="text-slate-600">-</span>}</div>
                          <div className="text-right text-xs font-semibold">{prixNet > 0 ? <span className="text-white">{prixNet.toFixed(0)} $</span> : <span className="text-slate-600">-</span>}</div>
                          <div className="px-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-400">{progress}%</span>
                              <span className="text-xs text-emerald-400 font-semibold">{valeurProgressee > 0 ? `${valeurProgressee.toFixed(0)} $` : '-'}</span>
                            </div>
                            <div className="w-full bg-slate-900/50 h-3 rounded-full overflow-hidden border border-slate-700/50 relative">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white drop-shadow-md">{progress}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <TrendingUp className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                    <p>Aucun mandat ouvert pour {selectedArpenteur}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}