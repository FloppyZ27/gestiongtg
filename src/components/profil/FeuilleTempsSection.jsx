// v2
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Timer, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, CalendarDays, Calendar, MessageSquare, Camera } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SharePointExplorer from "@/components/shared/SharePointExplorer";
import CameraModal from "@/components/profil/CameraModal";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function FeuilleTempsSection({ 
  pointageCollapsed, 
  setPointageCollapsed,
  viewMode,
  setViewMode,
  pointageCurrentDate,
  setPointageCurrentDate,
  setIsAddingPointage,
  goToPointagePrevious,
  goToPointageToday,
  goToPointageNext,
  getPointageWeekDays,
  getPointageMonthDays,
  getPointageForDate,
  getEventsForDate,
  handleOpenEditPointage,
  handleConfirmPointage,
  weekScrollRef
}) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("note");
  const [fileCount, setFileCount] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const streamRef = useRef(null);
  const queryClient = useQueryClient();

  const getWeekDateRange = () => {
    const days = getPointageWeekDays();
    const dimanche = format(days[0], "yyyy-MM-dd");
    const samedi = format(days[6], "yyyy-MM-dd");
    return `${dimanche}_${samedi}`;
  };

  // Clé unique pour la semaine en cours affichée
  const getWeekKey = () => {
    const days = getPointageWeekDays();
    return format(days[0], "yyyy-MM-dd");
  };

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: commentairesSemaine = [] } = useQuery({
    queryKey: ['commentairesSemaine', currentUser?.email],
    queryFn: () => base44.entities.CommentaireSemaine.filter({ utilisateur_email: currentUser?.email }),
    initialData: [],
    enabled: !!currentUser,
  });

  const weekKey = viewMode === "week" ? getWeekKey() : null;
  const commentaireActuel = commentairesSemaine.find(c => c.semaine_debut === weekKey);

  const saveCommentMutation = useMutation({
    mutationFn: async (contenu) => {
      if (commentaireActuel) {
        return base44.entities.CommentaireSemaine.update(commentaireActuel.id, { ...commentaireActuel, contenu });
      } else {
        return base44.entities.CommentaireSemaine.create({
          utilisateur_email: currentUser?.email,
          semaine_debut: weekKey,
          contenu
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesSemaine', currentUser?.email] });
      setIsCommentOpen(false);
    },
  });

  const handleOpenComment = () => {
    setCommentText(commentaireActuel?.contenu || "");
    setIsCommentOpen(true);
  };

  
  const getTypeLabel = (p) => {
    if (p.type?.includes('Vacance') || (!p.type && p.description?.toLowerCase().includes('vacance'))) return 'Vacances';
    if (p.type?.includes('Mieux') || (!p.type && p.description?.toLowerCase().includes('mieux'))) return 'Mieux-Être';
    if (p.type === 'En banque') return 'Banque';
    if (p.type === 'Pointage' || !p.type) return 'Pointage';
    return p.type;
  };

  const getMonthDaysWithFullWeeks = () => {
    const year = pointageCurrentDate.getFullYear();
    const month = pointageCurrentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDayOfWeek);
    
    const lastDayOfWeek = lastDay.getDay();
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDayOfWeek));
    
    const days = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  };

  return (
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
          <div className="flex flex-col gap-3 mb-6 pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={goToPointagePrevious} onMouseEnter={e => { Object.assign(e.currentTarget.style, { background: '#2563eb', color: 'white' }); }} onMouseLeave={e => { Object.assign(e.currentTarget.style, { background: 'rgb(30,41,59)', color: 'white' }); }} style={{ background: 'rgb(30,41,59)', border: '0', outline: 'none', boxShadow: 'none', color: 'white', padding: '0 12px', height: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', transition: 'background 0.15s' }}><ChevronLeft className="w-4 h-4" /></button>
                <div className="relative flex items-center gap-2 cursor-pointer group" title="Cliquer pour choisir une date">
                  <div className="text-white font-bold text-lg group-hover:text-cyan-400 transition-colors">{viewMode === "week" ? `Semaine du ${format(getPointageWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getPointageWeekDays()[6], "d MMMM yyyy", { locale: fr })}` : format(pointageCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(pointageCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)}</div>
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  <input type="date" value={format(pointageCurrentDate,"yyyy-MM-dd")} onChange={(e)=>{if(e.target.value)setPointageCurrentDate(new Date(e.target.value+'T00:00:00'));}} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" style={{zIndex:1}} />
                </div>
                <button onClick={goToPointageNext} onMouseEnter={e => { Object.assign(e.currentTarget.style, { background: '#2563eb', color: 'white' }); }} onMouseLeave={e => { Object.assign(e.currentTarget.style, { background: 'rgb(30,41,59)', color: 'white' }); }} style={{ background: 'rgb(30,41,59)', border: '0', outline: 'none', boxShadow: 'none', color: 'white', padding: '0 12px', height: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', transition: 'background 0.15s' }}><ChevronRight className="w-4 h-4" /></button>
                <Button size="sm" onClick={goToPointageToday} className="bg-cyan-500/20 text-cyan-400 transition-all duration-200 hover:bg-cyan-500/40 hover:text-cyan-300 hover:scale-105">Aujourd'hui</Button>
                {viewMode === "month" && (() => {
                  const monthDays = getMonthDaysWithFullWeeks();
                  const totalInitial = monthDays.reduce((sum, day) => {
                    const dayPointages = getPointageForDate(day);
                    return sum + dayPointages.reduce((daySum, p) => {
                      const debut = new Date(p.heure_debut);
                      const fin = new Date(p.heure_fin);
                      const mult = parseFloat(p.multiplicateur || 1);
                      return daySum + ((fin - debut) / (1000 * 60 * 60)) * mult;
                    }, 0);
                  }, 0);
                  const totalModifie = monthDays.reduce((sum, day) => {
                    const dayPointages = getPointageForDate(day);
                    return sum + dayPointages.reduce((daySum, p) => {
                      const mult = parseFloat(p.multiplicateur || 1);
                      if (p.heure_debut_modifiee && p.heure_fin_modifiee) {
                        return daySum + (p.duree_heures_modifiee || 0) * mult;
                      } else {
                        const debut = new Date(p.heure_debut);
                        const fin = new Date(p.heure_fin);
                        return daySum + ((fin - debut) / (1000 * 60 * 60)) * mult;
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
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => setViewMode("week")} className={`transition-all duration-200 hover:scale-105 ${viewMode === "week" ? "bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-500/60 shadow-lg shadow-cyan-500/20" : "bg-slate-800 text-white hover:bg-slate-600 hover:text-white"}`}>Semaine</Button>
                  <Button size="sm" onClick={() => setViewMode("month")} className={`transition-all duration-200 hover:scale-105 ${viewMode === "month" ? "bg-cyan-500/30 text-cyan-300 ring-2 ring-cyan-500/60 shadow-lg shadow-cyan-500/20" : "bg-slate-800 text-white hover:bg-slate-600 hover:text-white"}`}>Mois</Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddingPointage(true)}
                  className="h-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
                {viewMode === "week" && (
                  <Button
                    size="sm"
                    onClick={handleOpenComment}
                    className={`h-8 ${commentaireActuel?.contenu ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Note/Factures
                    {commentaireActuel?.contenu && <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 inline-block"></span>}
                  </Button>
                )}
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
                          const calcTotaux = (ps) => {
                            let pointage = 0, vacances = 0, mieuxEtre = 0, banque = 0;
                            ps.forEach(p => {
                              const mult = parseFloat(p.multiplicateur || 1);
                              const isModified = p.heure_debut_modifiee && p.heure_fin_modifiee;
                              const h = isModified
                                ? (p.duree_heures_modifiee || 0) * mult
                                : ((new Date(p.heure_fin) - new Date(p.heure_debut)) / (1000 * 60 * 60)) * mult;
                              if (p.type?.includes('Vacance')) vacances += h;
                              else if (p.type?.includes('Mieux')) mieuxEtre += h;
                              else if (p.type === 'En banque') banque += h;
                              else pointage += h;
                            });
                            return { pointage, vacances, mieuxEtre, banque };
                          };
                          const allPs = weekDays.flatMap(day => getPointageForDate(day));
                          const t = calcTotaux(allPs);
                          const grandTotal = t.pointage + t.vacances + t.mieuxEtre + t.banque;
                          return (
                            <div className="text-center px-1 space-y-0.5">
                              <div className="text-[10px] font-bold text-white border-b border-slate-600 pb-0.5 mb-0.5">{grandTotal > 0 ? grandTotal.toFixed(1)+'h' : '-'}</div>
                              <div className={`text-[10px] font-semibold ${t.pointage > 0 ? 'text-green-400' : 'text-slate-700'}`}>{t.pointage > 0 ? t.pointage.toFixed(1)+'h' : '-'}</div>
                              <div className={`text-[10px] font-semibold ${t.vacances > 0 ? 'text-violet-400' : 'text-slate-700'}`}>{t.vacances > 0 ? t.vacances.toFixed(1)+'h' : '-'}</div>
                              <div className={`text-[10px] font-semibold ${t.mieuxEtre > 0 ? 'text-pink-400' : 'text-slate-700'}`}>{t.mieuxEtre > 0 ? t.mieuxEtre.toFixed(1)+'h' : '-'}</div>
                              <div className={`text-[10px] font-semibold ${t.banque > 0 ? 'text-yellow-400' : 'text-slate-700'}`}>{t.banque > 0 ? t.banque.toFixed(1)+'h' : '-'}</div>
                            </div>
                          );
                        })()}
                      </div>
                      {getPointageWeekDays().map((day, idx) => {
                        const dayPointages = getPointageForDate(day);
                        let pointage = 0, vacances = 0, mieuxEtre = 0, banque = 0;
                        dayPointages.forEach(p => {
                          const mult = parseFloat(p.multiplicateur || 1);
                          const isModified = p.heure_debut_modifiee && p.heure_fin_modifiee;
                          const h = isModified
                            ? (p.duree_heures_modifiee || 0) * mult
                            : ((new Date(p.heure_fin) - new Date(p.heure_debut)) / (1000 * 60 * 60)) * mult;
                          if (p.type?.includes('Vacance')) vacances += h;
                          else if (p.type?.includes('Mieux')) mieuxEtre += h;
                          else if (p.type === 'En banque') banque += h;
                          else pointage += h;
                        });
                        
                        return (
                          <div key={`total-${idx}`} className="flex-1 border-r border-slate-700 bg-slate-800/50 px-2 py-2 space-y-0.5">
                            <div className="text-[11px] font-bold text-white border-b border-slate-600 pb-0.5 mb-0.5">Total: <span>{(pointage + vacances + mieuxEtre + banque) > 0 ? (pointage + vacances + mieuxEtre + banque).toFixed(1)+'h' : '-'}</span></div>
                            <div className={`text-[11px] ${pointage > 0 ? 'text-green-400' : 'text-slate-700'}`}>Pointage: <span className="font-semibold">{pointage > 0 ? pointage.toFixed(1)+'h' : '-'}</span></div>
                            <div className={`text-[11px] ${vacances > 0 ? 'text-violet-400' : 'text-slate-700'}`}>Vacances: <span className="font-semibold">{vacances > 0 ? vacances.toFixed(1)+'h' : '-'}</span></div>
                            <div className={`text-[11px] ${mieuxEtre > 0 ? 'text-pink-400' : 'text-slate-700'}`}>Mieux-Être: <span className="font-semibold">{mieuxEtre > 0 ? mieuxEtre.toFixed(1)+'h' : '-'}</span></div>
                            <div className={`text-[11px] ${banque > 0 ? 'text-yellow-400' : 'text-slate-700'}`}>Banque: <span className="font-semibold">{banque > 0 ? banque.toFixed(1)+'h' : '-'}</span></div>
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
                                const mult = parseFloat(p.multiplicateur || 1);
                                const initialDuration = ((initialEnd.getTime() - initialStart.getTime()) / (1000 * 60 * 60)) * mult;
                                const modifiedDuration = isModified ? (p.duree_heures_modifiee || 0) * mult : null;

                                return (
                                  <Tooltip key={`display-${p.id}`}>
                                    <TooltipTrigger asChild>
                                      <div
                                        className={`absolute left-1 right-1 rounded px-2 py-1 font-semibold z-20 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden flex flex-col ${
                                          (p.type?.includes('Vacance') || (!p.type && p.description?.toLowerCase().includes('vacance')))
                                            ? 'bg-gradient-to-r from-violet-500/60 to-purple-500/60 border border-violet-500 text-violet-50'
                                            : (p.type?.includes('Mieux') || (!p.type && p.description?.toLowerCase().includes('mieux')))
                                            ? 'bg-gradient-to-r from-pink-500/60 to-rose-500/60 border border-pink-500 text-pink-50'
                                            : p.type === 'En banque'
                                            ? 'bg-gradient-to-r from-yellow-500/60 to-amber-400/60 border border-yellow-400 text-yellow-50'
                                            : p.confirme || isModified
                                            ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/60 border border-green-500 text-green-50'
                                            : 'bg-gradient-to-r from-blue-500/60 to-indigo-500/60 border border-blue-500 text-blue-50'
                                        }`}
                                        onClick={() => handleOpenEditPointage(p)}
                                        style={{
                                          height: `${totalMinutes}px`,
                                          top: `${topPx}px`
                                        }}
                                      >
                                        {/* Badge multiplicateur en haut à droite */}
                                        {(() => { const m = parseFloat(p.multiplicateur || 1); return m !== 1 ? <span className="absolute top-1 right-1 text-[9px] font-bold px-1 py-0.5 rounded bg-white/25 border border-white/40 leading-none z-30">×{m}</span> : null; })()}
                                        {/* Type de pointage */}
                                         <div className="text-[12px] font-bold uppercase opacity-80 tracking-wide flex items-center gap-1">
                                           {getTypeLabel(p)}
                                         </div>
                                        {/* Description */}
                                        {p.description && (
                                          <div className="text-[12px] font-bold truncate leading-tight pr-5">{p.description}</div>
                                        )}
                                        {/* Statut visible si >= 30px */}
                                        {totalMinutes >= 30 && (
                                          <div className={`text-[11px] font-semibold ${
                                            (p.type?.includes('Vacance') || (!p.type && p.description?.toLowerCase().includes('vacance'))) ? 'text-violet-300'
                                            : (p.type?.includes('Mieux') || (!p.type && p.description?.toLowerCase().includes('mieux'))) ? 'text-pink-300'
                                            : p.type === 'En banque' ? 'text-yellow-300'
                                            : (p.confirme || isModified) ? 'text-green-300'
                                            : 'text-blue-300'
                                          }`}>
                                            {isModified ? 'Modifié' : p.confirme ? 'Confirmé' : 'En attente'}
                                          </div>
                                        )}
                                        {/* Heures visibles si >= 60px */}
                                        {totalMinutes >= 60 && (
                                          <div className="text-[11px] leading-tight">
                                            <div className={`opacity-${isModified ? '50' : '90'} ${(p.type?.includes('Vacance') || (!p.type && p.description?.toLowerCase().includes('vacance'))) ? 'text-violet-300' : (p.type?.includes('Mieux') || (!p.type && p.description?.toLowerCase().includes('mieux'))) ? 'text-pink-300' : p.type === 'En banque' ? 'text-yellow-300' : 'text-green-400'}`}>
                                              Initial: {format(initialStart, "HH:mm")} - {format(initialEnd, "HH:mm")} ({initialDuration.toFixed(1)}h)
                                            </div>
                                            {isModified && (
                                              <div className="opacity-90 text-green-300 mt-1">
                                                Modifié: {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")} ({p.duree_heures_modifiee?.toFixed(1)}h)
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        {/* Bouton et dates visibles si >= 90px */}
                                        {totalMinutes >= 90 && !p.confirme && !isModified && (
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
                                        {totalMinutes >= 90 && (p.confirme || isModified) && (
                                          <div className={`text-[9px] opacity-60 mt-auto pt-1 border-t ${p.type?.includes('Vacance') ? 'border-violet-400/30' : p.type?.includes('Mieux') ? 'border-pink-400/30' : p.type === 'En banque' ? 'border-yellow-400/30' : 'border-green-400/30'}`}>
                                            {isModified ? 'Modifié' : 'Confirmé'}: {format(new Date(p.updated_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-4">
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className={`text-xs font-bold uppercase ${
                                             (p.type?.includes('Vacance') || (!p.type && p.description?.toLowerCase().includes('vacance'))) ? 'text-violet-400'
                                             : (p.type?.includes('Mieux') || (!p.type && p.description?.toLowerCase().includes('mieux'))) ? 'text-pink-400'
                                             : p.type === 'En banque' ? 'text-yellow-400'
                                             : (p.confirme || isModified) ? 'text-green-400'
                                             : 'text-blue-400'
                                           }`}>
                                            <span>{getTypeLabel(p)}</span>
                                          </div>
                                          {parseFloat(p.multiplicateur || 1) !== 1 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/15 border border-white/30 text-white leading-none">×{parseFloat(p.multiplicateur)}</span>
                                          )}
                                        </div>
                                        <div className="text-sm text-slate-300">
                                          <div>Initial: <span className="text-white font-semibold">{format(initialStart, "HH:mm")} – {format(initialEnd, "HH:mm")}</span> <span className="text-slate-400">({initialDuration.toFixed(1)}h)</span></div>
                                          {isModified && (
                                            <div className="mt-1">Modifié: <span className="text-green-300 font-semibold">{format(startTime, "HH:mm")} – {format(endTime, "HH:mm")}</span> <span className="text-slate-400">({modifiedDuration?.toFixed(1)}h)</span></div>
                                          )}
                                        </div>
                                        {p.description && (
                                          <div className="text-sm opacity-75 whitespace-pre-wrap border-t border-white/10 pt-2">{p.description}</div>
                                        )}
                                        <div className="pt-2 border-t border-white/20 space-y-2">
                                          <div className="text-xs opacity-60">
                                            {p.confirme && <div>Confirmé: {format(new Date(p.updated_date), "dd/MM/yy à HH:mm")}</div>}
                                            {isModified && <div>Modifié: {format(new Date(p.updated_date), "dd/MM/yy à HH:mm")}</div>}
                                          </div>
                                          {!p.confirme && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleConfirmPointage(p);
                                              }}
                                              className="w-full text-xs px-2 py-1 bg-green-500/20 hover:bg-green-500/40 text-green-400 border border-green-500/30 rounded transition-colors"
                                            >
                                              Confirmer
                                            </button>
                                          )}
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
              <div>
                {/* En-têtes des jours */}
                <div className="grid grid-cols-7 w-full mb-1" style={{ gap: '2px' }}>
                  {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(j => (
                    <div key={j} className="text-center text-xs font-semibold text-slate-400 uppercase py-1">{j}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 w-full" style={{ gap: '2px' }}>
                  {getMonthDaysWithFullWeeks().map((day, index) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                    const isCurrentMonth = day.getMonth() === pointageCurrentDate.getMonth();
                    const dayPointages = getPointageForDate(day);

                    return (
                      <Card
                        key={dateStr}
                        className={`border-slate-800 p-2 ${isToday ? 'ring-2 ring-emerald-500' : ''} w-full ${isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-950/30 opacity-50'}`}
                        style={{ minHeight: '210px' }}
                      >
                        <div className="mb-2 w-full">
                          <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-emerald-500' : ''} w-full`}>
                            <div className="flex items-center justify-center mb-1">
                              <div className="flex-1">
                                <p className={`text-xs uppercase ${isToday ? 'text-emerald-400' : isCurrentMonth ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {format(day, "EEE", { locale: fr })}
                                </p>
                                <p className={`text-lg font-bold ${isToday ? 'text-emerald-400' : isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
                                  {format(day, "d", { locale: fr })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 flex-1 overflow-y-auto" style={{ maxHeight: '170px' }}>
                          {dayPointages.map(p => {
                            const isModified = p.heure_debut_modifiee && p.heure_fin_modifiee;
                            const isVacance = p.type?.includes('Vacance') || (!p.type && p.description?.toLowerCase().includes('vacance'));
                            const isMieuxEtre = p.type?.includes('Mieux') || (!p.type && (p.description?.toLowerCase().includes('mieux') || p.description?.toLowerCase().includes('mieux-être')));
                            const debut = isModified ? new Date(p.heure_debut_modifiee) : new Date(p.heure_debut);
                            const fin = isModified ? new Date(p.heure_fin_modifiee) : new Date(p.heure_fin);
                            const mult = parseFloat(p.multiplicateur || 1);
                            const duree = ((fin - debut) / (1000 * 60 * 60)) * mult;

                            const isEnBanque = p.type === 'En banque';
                            const colorClass = isVacance
                               ? 'bg-gradient-to-r from-violet-500/60 to-purple-500/60 border border-violet-500 text-violet-50'
                               : isMieuxEtre
                               ? 'bg-gradient-to-r from-pink-500/60 to-rose-500/60 border border-pink-500 text-pink-50'
                               : isEnBanque
                               ? 'bg-gradient-to-r from-yellow-500/60 to-amber-400/60 border border-yellow-400 text-yellow-50'
                               : (p.confirme || isModified)
                               ? 'bg-gradient-to-r from-green-500/60 to-emerald-500/60 border border-green-500 text-green-50'
                               : 'bg-gradient-to-r from-blue-500/60 to-indigo-500/60 border border-blue-500 text-blue-50';

                            const titleColor = isVacance ? 'text-violet-300'
                               : isMieuxEtre ? 'text-pink-300'
                               : isEnBanque ? 'text-yellow-300'
                               : (p.confirme || isModified) ? 'text-green-300'
                               : 'text-blue-300';

                            return (
                              <div
                                key={p.id}
                                className={`relative text-xs px-3 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity flex flex-col gap-1 overflow-hidden ${colorClass}`}
                                onClick={() => handleOpenEditPointage(p)}
                              >
                                {mult !== 1 && (
                                  <span className="absolute top-1 right-1 text-[10px] font-bold px-1 py-0.5 rounded bg-white/25 border border-white/40 leading-none z-10">×{mult}</span>
                                )}
                                <div className="truncate text-sm font-bold opacity-90 uppercase pr-6 flex items-center gap-1">
                                  <span>{getTypeLabel(p)}</span>
                                </div>
                                {p.description && (
                                  <div className={`truncate font-bold text-sm ${titleColor}`}>{p.description}</div>
                                )}
                                <div className="truncate text-[11px] opacity-90">
                                  {format(debut, "HH:mm")} - {format(fin, "HH:mm")} ({duree.toFixed(1)}h{mult !== 1 ? ` ×${mult}` : ''})
                                </div>
                                <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-white/20">
                                  <div className="truncate">Modif: {format(new Date(p.updated_date), "dd/MM/yy")}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}

      {/* Dialog commentaire et factures */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              Notes et Factures
            </DialogTitle>
            <p className="text-sm text-slate-400 mt-1">
              de la semaine du {weekKey ? format(new Date(weekKey + 'T00:00:00'), "d MMMM", { locale: fr }) : ""} au {weekKey ? format(new Date(new Date(weekKey).getTime() + 6 * 24 * 60 * 60 * 1000), "d MMMM yyyy", { locale: fr }) : ""}
            </p>
          </DialogHeader>
          
          <Tabs defaultValue="note" className="w-full" onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="note">Note</TabsTrigger>
              <TabsTrigger value="factures" className="flex items-center gap-2">
                Factures
                {fileCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/30 text-orange-400 text-xs font-bold">
                    {fileCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="note" className="space-y-4">
              <p className="text-slate-400 text-sm">Ajoutez une note à l'intention de la comptable pour cette semaine.</p>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ex: J'ai travaillé en dehors des heures normales le mercredi soir pour un urgence client..."
                className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-2 w-full text-sm resize-none"
                rows={6}
                autoFocus
              />
            </TabsContent>

            <TabsContent value="factures" className="space-y-4">
              <SharePointExplorer 
                rootPath="COMPTABILITÉ/FACTURES" 
                initialPath={currentUser?.full_name ? [currentUser.full_name, getWeekDateRange()] : []}
                maxHeight="500px"
                allowUpload={true}
                allowDelete={true}
                minPathLength={1}
                onFileCountChange={setFileCount}
              />
            </TabsContent>
            <div className="flex justify-between gap-3 pt-4 border-t border-slate-700">
              {activeTab === 'factures' ? (
                <Button 
                  onClick={() => setShowCamera(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-1" /> Prendre une photo
                </Button>
              ) : <div />}
              <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCommentOpen(false)}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                Annuler
              </Button>
              <Button
                onClick={() => saveCommentMutation.mutate(commentText)}
                disabled={saveCommentMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none border-emerald-500"
              >
                {saveCommentMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal caméra */}
      {showCamera && (
        <CameraModal
          onClose={() => {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(t => t.stop());
              streamRef.current = null;
            }
            setShowCamera(false);
          }}
          folderPath={`COMPTABILITÉ/FACTURES/${currentUser?.full_name}/${getWeekDateRange()}`}
          onPhotoUploaded={() => setFileCount(prev => prev + 1)}
          streamRef={streamRef}
        />
      )}
    </Card>
  );
}