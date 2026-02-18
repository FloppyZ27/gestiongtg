import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, Clock, ChevronUp, ChevronDown, Users, TrendingUp, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-"
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

const getArpenteurBg = (arpenteur) => {
  const colors = {
    "Samuel Guay": "from-red-500/20 to-red-600/10 border-red-500/30",
    "Pierre-Luc Pilote": "from-slate-500/20 to-slate-600/10 border-slate-500/30",
    "Frédéric Gilbert": "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    "Dany Gaboury": "from-yellow-500/20 to-yellow-600/10 border-yellow-500/30",
    "Benjamin Larouche": "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30"
  };
  return colors[arpenteur] || "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30";
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

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

export default function Comptabilite() {
  const [feuilleTempsCollapsed, setFeuilleTempsCollapsed] = useState(false);
  const [listeHeuresCollapsed, setListeHeuresCollapsed] = useState(false);
  const [mandatsCollapsed, setMandatsCollapsed] = useState(false);
  const [feuilleTempsTab, setFeuilleTempsTab] = useState("semaine");
  const [feuilleTempsCurrentDate, setFeuilleTempsCurrentDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState("tous");

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
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

  const { data: allEntreesTemps = [] } = useQuery({
    queryKey: ['allEntreesTemps'],
    queryFn: () => base44.entities.EntreeTemps.list('-date', 500),
    initialData: [],
  });

  // Navigation feuille de temps
  const getWeekDays = () => {
    const dayOfWeek = feuilleTempsCurrentDate.getDay();
    const sunday = new Date(feuilleTempsCurrentDate);
    sunday.setDate(feuilleTempsCurrentDate.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  const getMonthDays = () => {
    const year = feuilleTempsCurrentDate.getFullYear();
    const month = feuilleTempsCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  const goPrevious = () => {
    if (feuilleTempsTab === "semaine") {
      setFeuilleTempsCurrentDate(new Date(feuilleTempsCurrentDate.getFullYear(), feuilleTempsCurrentDate.getMonth(), feuilleTempsCurrentDate.getDate() - 7));
    } else {
      setFeuilleTempsCurrentDate(new Date(feuilleTempsCurrentDate.getFullYear(), feuilleTempsCurrentDate.getMonth() - 1, 1));
    }
  };

  const goNext = () => {
    if (feuilleTempsTab === "semaine") {
      setFeuilleTempsCurrentDate(new Date(feuilleTempsCurrentDate.getFullYear(), feuilleTempsCurrentDate.getMonth(), feuilleTempsCurrentDate.getDate() + 7));
    } else {
      setFeuilleTempsCurrentDate(new Date(feuilleTempsCurrentDate.getFullYear(), feuilleTempsCurrentDate.getMonth() + 1, 1));
    }
  };

  const getEntreesForDate = (date, userEmail = null) => {
    const dateStr = date.toISOString().split('T')[0];
    return allEntreesTemps.filter(e => {
      const matchDate = e.date === dateStr;
      const matchUser = userEmail ? e.utilisateur_email === userEmail : (selectedUserId === "tous" || e.utilisateur_email === selectedUserId);
      return matchDate && matchUser;
    });
  };

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const c = clients.find(cl => cl.id === id);
      return c ? `${c.prenom} ${c.nom}` : "";
    }).filter(Boolean).join(", ");
  };

  // Calcul heures par utilisateur
  const getUserTotalHours = (userEmail) => {
    return allEntreesTemps.filter(e => e.utilisateur_email === userEmail).reduce((sum, e) => sum + (e.heures || 0), 0);
  };

  const getUserWeekHours = (userEmail) => {
    return getWeekDays().reduce((sum, day) => {
      return sum + getEntreesForDate(day, userEmail).reduce((s, e) => s + (e.heures || 0), 0);
    }, 0);
  };

  const getUserMonthHours = (userEmail) => {
    return getMonthDays().reduce((sum, day) => {
      return sum + getEntreesForDate(day, userEmail).reduce((s, e) => s + (e.heures || 0), 0);
    }, 0);
  };

  // Mandats ouverts par arpenteur
  const getMandatsOuvertsByArpenteur = (arpenteur) => {
    return dossiers
      .filter(d => d.arpenteur_geometre === arpenteur && d.statut === "Ouvert")
      .flatMap(d => (d.mandats || []).map(m => ({ dossier: d, mandat: m })));
  };

  const getMandatProgress = (tacheActuelle) => {
    const idx = TACHES.indexOf(tacheActuelle || "Ouverture");
    if (idx < 0) return 0;
    return Math.round((idx / (TACHES.length - 1)) * 95 / 5) * 5;
  };

  const getMandatValeurProgression = (mandat) => {
    const prix = mandat.prix_estime || 0;
    const rabais = mandat.rabais || 0;
    const prixNet = prix - rabais;
    const progress = getMandatProgress(mandat.tache_actuelle) / 100;
    return prixNet * progress;
  };

  const days = feuilleTempsTab === "semaine" ? getWeekDays() : getMonthDays();
  const filteredDays = feuilleTempsTab === "mois" ? days.filter(day => {
    const entries = getEntreesForDate(day);
    return entries.length > 0;
  }) : days;

  const totalHeuresPeriode = days.reduce((sum, day) => {
    return sum + getEntreesForDate(day).reduce((s, e) => s + (e.heures || 0), 0);
  }, 0);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="w-full">
          <div className="flex items-center gap-3 mb-8">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Comptabilité
              </h1>
              <p className="text-slate-400">Feuilles de temps, heures et tarification des mandats</p>
            </div>
          </div>

          {/* Section 1 - Feuille de temps tous utilisateurs */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
            <div
              className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-2 px-3 bg-cyan-900/20 border-b border-slate-800"
              onClick={() => setFeuilleTempsCollapsed(!feuilleTempsCollapsed)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-cyan-400" />
                  </div>
                  <h3 className="text-cyan-300 text-sm font-semibold">Feuille de temps — Tous les utilisateurs</h3>
                </div>
                {feuilleTempsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!feuilleTempsCollapsed && (
              <CardContent className="p-6">
                {/* Filtres */}
                <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-slate-700 items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 text-sm">Utilisateur:</span>
                    <Button
                      size="sm"
                      onClick={() => setSelectedUserId("tous")}
                      className={`h-7 text-xs ${selectedUserId === "tous" ? "timesheet-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                    >
                      Tous
                    </Button>
                    {users.map(u => (
                      <Button
                        key={u.id}
                        size="sm"
                        onClick={() => setSelectedUserId(u.email)}
                        className={`h-7 text-xs ${selectedUserId === u.email ? "timesheet-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                      >
                        {u.full_name}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={goPrevious} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-7 text-xs">← Préc.</Button>
                    <Button size="sm" onClick={() => setFeuilleTempsCurrentDate(new Date())} className="bg-emerald-500/20 text-emerald-400 h-7 text-xs">Aujourd'hui</Button>
                    <Button size="sm" variant="outline" onClick={goNext} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-7 text-xs">Suiv. →</Button>
                    <div className="h-5 w-px bg-slate-700 mx-1"></div>
                    <Button size="sm" onClick={() => setFeuilleTempsTab("semaine")} className={`h-7 text-xs ${feuilleTempsTab === "semaine" ? "timesheet-tab-button" : "bg-slate-800 border-slate-700 text-white"}`}>Semaine</Button>
                    <Button size="sm" onClick={() => setFeuilleTempsTab("mois")} className={`h-7 text-xs ${feuilleTempsTab === "mois" ? "timesheet-tab-button" : "bg-slate-800 border-slate-700 text-white"}`}>Mois</Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-white font-semibold">
                    {feuilleTempsTab === "semaine"
                      ? `Semaine du ${format(getWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getWeekDays()[6], "d MMMM yyyy", { locale: fr })}`
                      : format(feuilleTempsCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(feuilleTempsCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)}
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Total: {totalHeuresPeriode.toFixed(1)}h
                  </Badge>
                </div>

                {/* En-têtes */}
                <div className="grid grid-cols-[1fr,1.5fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 mb-3">
                  <div className="text-xs font-semibold text-slate-400">Utilisateur</div>
                  <div className="text-xs font-semibold text-slate-400">N° Dossier</div>
                  <div className="text-xs font-semibold text-slate-400">Client</div>
                  <div className="text-xs font-semibold text-slate-400">Mandat</div>
                  <div className="text-xs font-semibold text-slate-400">Tâche</div>
                  <div className="text-xs font-semibold text-slate-400 text-right">Temps</div>
                </div>

                <div className="space-y-2">
                  {filteredDays.map(day => {
                    const dayEntries = getEntreesForDate(day);
                    if (feuilleTempsTab === "mois" && dayEntries.length === 0) return null;
                    const totalHours = dayEntries.reduce((sum, e) => sum + (e.heures || 0), 0);
                    const dateStr = day.toISOString().split('T')[0];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                    return (
                      <div key={dateStr} className={`border border-slate-700 rounded-lg overflow-hidden ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
                        <div className="bg-slate-800/50 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                          <span className={`font-semibold text-xs ${isToday ? 'text-emerald-400' : 'text-white'}`}>
                            {format(day, "EEE d MMM", { locale: fr })}
                          </span>
                          {totalHours > 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">{totalHours.toFixed(1)}h</Badge>
                          )}
                        </div>
                        {dayEntries.length > 0 ? (
                          <div className="divide-y divide-slate-800">
                            {dayEntries.map(entree => {
                              const dossier = dossiers.find(d => d.id === entree.dossier_id);
                              const entreeUser = users.find(u => u.email === entree.utilisateur_email);
                              return (
                                <div key={entree.id} className="px-3 py-2 hover:bg-slate-800/30 transition-colors">
                                  <div className="grid grid-cols-[1fr,1.5fr,2fr,1.5fr,1.5fr,0.8fr] gap-2 items-center">
                                    <div className="flex items-center gap-1.5">
                                      <Avatar className="w-5 h-5 flex-shrink-0">
                                        <AvatarImage src={entreeUser?.photo_url} />
                                        <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                          {getInitials(entreeUser?.full_name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-slate-300 truncate">{entreeUser?.full_name?.split(' ')[0] || "-"}</span>
                                    </div>
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
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 border text-xs truncate max-w-full">
                                          {entree.mandat}
                                        </Badge>
                                      )}
                                    </div>
                                    <div>
                                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">{entree.tache}</Badge>
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
                          <div className="p-3 text-center text-slate-500 text-xs">Aucune entrée</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Section 2 - Liste simple heures par utilisateur */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
            <div
              className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-2 px-3 bg-emerald-900/20 border-b border-slate-800"
              onClick={() => setListeHeuresCollapsed(!listeHeuresCollapsed)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center">
                    <Users className="w-3 h-3 text-emerald-400" />
                  </div>
                  <h3 className="text-emerald-300 text-sm font-semibold">Résumé des heures par utilisateur</h3>
                </div>
                {listeHeuresCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!listeHeuresCollapsed && (
              <CardContent className="p-6">
                <div className="mb-3 text-xs text-slate-500">
                  Semaine courante : {format(getWeekDays()[0], "d MMM", { locale: fr })} – {format(getWeekDays()[6], "d MMM yyyy", { locale: fr })} &nbsp;|&nbsp;
                  Mois courant : {format(new Date(), "MMMM yyyy", { locale: fr })}
                </div>
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[2fr,1fr,1fr,1fr] bg-slate-800/50 px-4 py-2 border-b border-slate-700">
                    <div className="text-xs font-semibold text-slate-400">Utilisateur</div>
                    <div className="text-xs font-semibold text-slate-400 text-right">Cette semaine</div>
                    <div className="text-xs font-semibold text-slate-400 text-right">Ce mois</div>
                    <div className="text-xs font-semibold text-slate-400 text-right">Total cumulatif</div>
                  </div>
                  {users.map(u => {
                    const weekH = getUserWeekHours(u.email);
                    const monthH = getUserMonthHours(u.email);
                    const totalH = getUserTotalHours(u.email);
                    return (
                      <div key={u.id} className="grid grid-cols-[2fr,1fr,1fr,1fr] px-4 py-3 border-b border-slate-800 hover:bg-slate-800/30 transition-colors items-center">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.photo_url} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                              {getInitials(u.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium text-sm">{u.full_name}</p>
                            <p className="text-slate-500 text-xs">{u.poste || u.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${weekH > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>{weekH.toFixed(1)}h</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${monthH > 0 ? 'text-cyan-400' : 'text-slate-600'}`}>{monthH.toFixed(1)}h</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold text-sm ${totalH > 0 ? 'text-purple-400' : 'text-slate-600'}`}>{totalH.toFixed(1)}h</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Total row */}
                  <div className="grid grid-cols-[2fr,1fr,1fr,1fr] px-4 py-3 bg-slate-800/50 items-center">
                    <div className="text-xs font-bold text-slate-300">TOTAL</div>
                    <div className="text-right font-bold text-sm text-emerald-400">
                      {users.reduce((sum, u) => sum + getUserWeekHours(u.email), 0).toFixed(1)}h
                    </div>
                    <div className="text-right font-bold text-sm text-cyan-400">
                      {users.reduce((sum, u) => sum + getUserMonthHours(u.email), 0).toFixed(1)}h
                    </div>
                    <div className="text-right font-bold text-sm text-purple-400">
                      {users.reduce((sum, u) => sum + getUserTotalHours(u.email), 0).toFixed(1)}h
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Section 3 - Mandats ouverts par arpenteur */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
            <div
              className="cursor-pointer hover:bg-violet-900/40 transition-colors rounded-t-lg py-2 px-3 bg-violet-900/20 border-b border-slate-800"
              onClick={() => setMandatsCollapsed(!mandatsCollapsed)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-violet-400" />
                  </div>
                  <h3 className="text-violet-300 text-sm font-semibold">Mandats ouverts — Tarification et progression par arpenteur</h3>
                </div>
                {mandatsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </div>

            {!mandatsCollapsed && (
              <CardContent className="p-6 space-y-8">
                {ARPENTEURS.map(arpenteur => {
                  const mandatsItems = getMandatsOuvertsByArpenteur(arpenteur);
                  if (mandatsItems.length === 0) return null;

                  const totalTarif = mandatsItems.reduce((sum, { mandat }) => {
                    const prix = mandat.prix_estime || 0;
                    const rabais = mandat.rabais || 0;
                    return sum + (prix - rabais);
                  }, 0);

                  const totalValeurProgression = mandatsItems.reduce((sum, { mandat }) => sum + getMandatValeurProgression(mandat), 0);

                  return (
                    <div key={arpenteur}>
                      <div className={`flex items-center justify-between mb-3 p-3 rounded-lg border bg-gradient-to-r ${getArpenteurBg(arpenteur)}`}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getArpenteurColor(arpenteur)} border font-bold`}>
                            {getArpenteurInitials(arpenteur).replace('-', '')}
                          </Badge>
                          <span className="text-white font-semibold">{arpenteur}</span>
                          <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 text-xs">{mandatsItems.length} mandat{mandatsItems.length > 1 ? 's' : ''}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
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

                      <div className="border border-slate-700 rounded-lg overflow-hidden">
                        <div className="grid grid-cols-[1.2fr,2fr,1.5fr,1.2fr,1fr,1fr,1fr,1.5fr] bg-slate-800/50 px-3 py-2 border-b border-slate-700">
                          <div className="text-xs font-semibold text-slate-400">N° Dossier</div>
                          <div className="text-xs font-semibold text-slate-400">Client</div>
                          <div className="text-xs font-semibold text-slate-400">Type</div>
                          <div className="text-xs font-semibold text-slate-400">Tâche</div>
                          <div className="text-xs font-semibold text-slate-400 text-right">Prix estimé</div>
                          <div className="text-xs font-semibold text-slate-400 text-right">Rabais</div>
                          <div className="text-xs font-semibold text-slate-400 text-right">Net</div>
                          <div className="text-xs font-semibold text-slate-400 text-center">Progression / Valeur</div>
                        </div>

                        {mandatsItems.map(({ dossier, mandat }, idx) => {
                          const progress = getMandatProgress(mandat.tache_actuelle);
                          const prix = mandat.prix_estime || 0;
                          const rabais = mandat.rabais || 0;
                          const prixNet = prix - rabais;
                          const valeurProgressee = getMandatValeurProgression(mandat);
                          const clientsNames = getClientsNames(dossier.clients_ids);

                          return (
                            <div key={`${dossier.id}-${idx}`} className="grid grid-cols-[1.2fr,2fr,1.5fr,1.2fr,1fr,1fr,1fr,1.5fr] px-3 py-2 border-b border-slate-800 hover:bg-slate-800/30 transition-colors items-center gap-2">
                              <div>
                                <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                                  {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                </Badge>
                              </div>
                              <div className="text-slate-300 text-xs truncate">{clientsNames}</div>
                              <div>
                                <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                                  {mandat.type_mandat}
                                </Badge>
                              </div>
                              <div>
                                {mandat.tache_actuelle ? (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{mandat.tache_actuelle}</Badge>
                                ) : <span className="text-slate-600 text-xs">-</span>}
                              </div>
                              <div className="text-right text-slate-300 text-xs">{prix > 0 ? `${prix.toFixed(0)} $` : '-'}</div>
                              <div className="text-right text-xs">{rabais > 0 ? <span className="text-red-400">-{rabais.toFixed(0)} $</span> : <span className="text-slate-600">-</span>}</div>
                              <div className="text-right text-xs font-semibold">{prixNet > 0 ? <span className="text-white">{prixNet.toFixed(0)} $</span> : <span className="text-slate-600">-</span>}</div>
                              <div className="px-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-slate-400">{progress}%</span>
                                  <span className="text-xs text-emerald-400 font-semibold">{valeurProgressee > 0 ? `${valeurProgressee.toFixed(0)} $` : '-'}</span>
                                </div>
                                <div className="w-full bg-slate-900/50 h-3 rounded-full overflow-hidden border border-slate-700/50 relative">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white drop-shadow-md leading-none">{progress}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}