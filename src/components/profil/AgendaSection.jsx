import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Trash2, RefreshCw, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AgendaSection({ 
  agendaCollapsed,
  setAgendaCollapsed,
  agendaViewMode,
  setAgendaViewMode,
  agendaCurrentDate,
  setAgendaCurrentDate,
  setIsAddingEvent,
  goToAgendaPrevious,
  goToAgendaToday,
  goToAgendaNext,
  getAgendaWeekDays,
  getAgendaMonthDays,
  getRendezVousForDate,
  handleEditEvent,
  deleteRendezVousMutation,
  refetchMsEvents,
  isMsLoading
}) {
  const [eventToDelete, setEventToDelete] = useState(null);
  
  // Recalculer getAgendaMonthDays ici pour inclure les jours complets dimanche-samedi
  const getMonthDaysWithFullWeeks = () => {
    const year = agendaCurrentDate.getFullYear();
    const month = agendaCurrentDate.getMonth();
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
  
  const monthDaysToDisplay = agendaViewMode === "mois" ? getMonthDaysWithFullWeeks() : getAgendaMonthDays();

  const handleDeleteClick = (e, event) => {
    e.stopPropagation();
    setEventToDelete(event);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteRendezVousMutation.mutate(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  return (
    <>
    <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl text-red-400 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Supprimer l'événement
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-slate-300">
            Êtes-vous sûr de vouloir supprimer <span className="text-white font-semibold">{eventToDelete?.titre}</span> ?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEventToDelete(null)} className="border-slate-600 text-slate-300">
              Annuler
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white border-2 border-red-400">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
      <div 
        className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-2 px-3 bg-purple-900/20 border-b border-slate-800"
        onClick={() => setAgendaCollapsed(!agendaCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center">
              <CalendarDays className="w-3 h-3 text-purple-400" />
            </div>
            <h3 className="text-purple-300 text-sm font-semibold">Agenda</h3>
          </div>
          {agendaCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {!agendaCollapsed && (
        <CardContent className="p-6">
          {/* Header avec navigation et contrôles */}
          <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button onClick={goToAgendaPrevious} onMouseEnter={e => { Object.assign(e.currentTarget.style, { background: '#2563eb', color: 'white' }); }} onMouseLeave={e => { Object.assign(e.currentTarget.style, { background: 'rgb(30,41,59)', color: 'white' }); }} style={{ background: 'rgb(30,41,59)', border: '0', outline: 'none', boxShadow: 'none', color: 'white', padding: '0 12px', height: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', transition: 'background 0.15s' }}><ChevronLeft className="w-4 h-4" /></button>
                <div className="relative flex items-center gap-2 cursor-pointer group" title="Cliquer pour choisir une date">
                  <div className="text-white font-bold text-lg group-hover:text-purple-400 transition-colors">{agendaViewMode === "semaine" ? `Semaine du ${format(getAgendaWeekDays()[0], "d MMMM", { locale: fr })} au ${format(getAgendaWeekDays()[6], "d MMMM yyyy", { locale: fr })}` : format(agendaCurrentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(agendaCurrentDate, "MMMM yyyy", { locale: fr }).slice(1)}</div>
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  <input type="date" value={format(agendaCurrentDate,"yyyy-MM-dd")} onChange={(e)=>{if(e.target.value)setAgendaCurrentDate(new Date(e.target.value+'T00:00:00'));}} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" style={{zIndex:1}} />
                </div>
                <button onClick={goToAgendaNext} onMouseEnter={e => { Object.assign(e.currentTarget.style, { background: '#2563eb', color: 'white' }); }} onMouseLeave={e => { Object.assign(e.currentTarget.style, { background: 'rgb(30,41,59)', color: 'white' }); }} style={{ background: 'rgb(30,41,59)', border: '0', outline: 'none', boxShadow: 'none', color: 'white', padding: '0 12px', height: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px', transition: 'background 0.15s' }}><ChevronRight className="w-4 h-4" /></button>
                <Button size="sm" onClick={goToAgendaToday} className="bg-purple-500/20 text-purple-400 transition-all duration-200 hover:bg-purple-500/40 hover:text-purple-300 hover:scale-105">Aujourd'hui</Button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => setAgendaViewMode("semaine")}
                    className={`transition-all duration-200 hover:scale-105 ${agendaViewMode === "semaine" ? "bg-purple-500/30 text-purple-300 ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20" : "bg-slate-800 text-white hover:bg-slate-600 hover:text-white"}`}
                  >
                    Semaine
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAgendaViewMode("mois")}
                    className={`transition-all duration-200 hover:scale-105 ${agendaViewMode === "mois" ? "bg-purple-500/30 text-purple-300 ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20" : "bg-slate-800 text-white hover:bg-slate-600 hover:text-white"}`}
                  >
                    Mois
                  </Button>
                </div>
                <Button
                  size="sm"
                  onClick={() => refetchMsEvents?.()}
                  disabled={isMsLoading}
                  className="h-8 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isMsLoading ? 'animate-spin' : ''}`} />
                  Sync MS
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAddingEvent(true)}
                  className="h-8 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/50 font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
            </div>
          </div>

          {/* Vue Semaine */}
          {agendaViewMode === "semaine" && (
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 flex flex-col" style={{ height: '600px' }}>
              <div className="overflow-x-auto flex-1 flex flex-col">
                <div className="inline-block min-w-full h-full flex flex-col">
                  {/* En-têtes des jours */}
                  <div className="flex border-b border-slate-700 flex-shrink-0">
                    <div className="w-16 flex-shrink-0 border-r border-slate-700 bg-slate-900/50"></div>
                    {getAgendaWeekDays().map((day, idx) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      return (
                        <div key={idx} className={`flex-1 text-center py-3 border-r border-slate-700 ${isToday ? 'bg-slate-900/50 ring-2 ring-purple-500 ring-inset' : 'bg-slate-900/50'}`}>
                          <div className={`text-xs uppercase ${isToday ? 'text-purple-400' : 'text-slate-400'}`}>
                            {format(day, "EEE", { locale: fr })}
                          </div>
                          <div className={`text-lg font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>
                            {format(day, "d", { locale: fr })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grille horaire */}
                  <div className="overflow-y-auto flex-1 relative" ref={el => {
                    if (el && !el.dataset.scrolledTo7) {
                      el.scrollTop = 7 * 90;
                      el.dataset.scrolledTo7 = 'true';
                    }
                  }}>
                    <div className="flex relative" style={{ minHeight: '2160px' }}>
                      {/* Colonne des heures */}
                      <div className="w-16 flex-shrink-0 sticky left-0 z-20 bg-slate-900/30">
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <div key={hour} className="h-[90px] border-b border-slate-700/50 flex items-start">
                            <div className="w-full border-r border-slate-700 px-2 py-2 text-xs text-slate-500 text-right">
                              {hour.toString().padStart(2, '0')}:00
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Colonnes des jours */}
                      {getAgendaWeekDays().map((day, dayIdx) => {
                        const isToday = day.toDateString() === new Date().toDateString();
                        const dayEvents = getRendezVousForDate(day);

                        return (
                          <div key={dayIdx} className={`flex-1 border-r border-slate-700 relative ${isToday ? 'bg-purple-500/10' : 'bg-slate-800/20'}`}>
                            {/* Grille des heures de fond */}
                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                              <div key={hour} className="h-[90px] border-b border-slate-700/50"></div>
                            ))}

                            {/* Événements */}
                            {dayEvents.map(event => {
                              const eventStart = new Date(event.date_debut);
                              const eventEnd = new Date(event.date_fin || event.date_debut);

                              const dayStart = new Date(day);
                              dayStart.setHours(0, 0, 0, 0);

                              const dayEnd = new Date(day);
                              dayEnd.setHours(23, 59, 59, 999);

                              const startTime = eventStart < dayStart ? dayStart : eventStart;
                              const endTime = eventEnd > dayEnd ? dayEnd : eventEnd;

                              if (eventEnd < dayStart || eventStart > dayEnd) {
                                return null;
                              }

                              const startHour = startTime.getHours();
                              const startMin = startTime.getMinutes();
                              const durationMinutes = (endTime - startTime) / (1000 * 60);
                              const topPx = (startHour * 90) + (startMin * 1.5);

                              const isAbsence = event.type === "absence";
                              const isMsOnly = event.source === 'microsoft';

                              return (
                               <Tooltip key={event.id}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`absolute left-1 right-1 rounded px-2 py-1 text-xs font-semibold z-10 cursor-pointer hover:opacity-80 transition-opacity group flex flex-col gap-0.5 overflow-hidden ${
                                        isAbsence
                                           ? 'bg-gradient-to-r from-red-500/60 to-orange-500/60 border border-red-500 text-red-50'
                                           : isMsOnly
                                           ? 'bg-gradient-to-r from-sky-500/60 to-blue-600/60 border border-sky-400 text-sky-50'
                                           : 'bg-gradient-to-r from-purple-500/60 to-indigo-500/60 border border-purple-500 text-purple-50'
                                      }`}
                                      style={{
                                        height: `${Math.max(40, durationMinutes * 1.5)}px`,
                                        top: `${topPx}px`
                                      }}
                                      onClick={() => !isMsOnly && handleEditEvent(event)}
                                      >
                                      {!isMsOnly && (
                                      <button
                                        onClick={(e) => handleDeleteClick(e, event)}
                                        style={{ top: '2px' }}
                                        className="absolute right-1 z-20 w-5 h-5 bg-red-600 hover:bg-red-700 border border-red-300 rounded text-white flex items-center justify-center transition-all group"
                                      >
                                        <Trash2 className="w-2.5 h-2.5 group-hover:text-red-300 transition-colors" />
                                      </button>
                                      )}
                                        {durationMinutes <= 60 ? (
                                        <>
                                         <div className="truncate text-[10px] font-bold opacity-90 uppercase leading-tight">
                                           {isAbsence ? 'Absence' : isMsOnly ? 'Microsoft' : 'Rendez-vous'}
                                         </div>
                                          <div className={`truncate font-bold text-xs ${
                                           isAbsence ? 'text-orange-300' : isMsOnly ? 'text-sky-300' : 'text-purple-300'
                                          }`}>{event.titre}</div>
                                        </>
                                      ) : (
                                        <>
                                          <div className="truncate text-[11px] font-bold opacity-90 uppercase">
                                            {isAbsence ? 'Absence' : isMsOnly ? 'Microsoft' : 'Rendez-vous'}
                                          </div>
                                          <div className={`truncate font-bold text-sm ${
                                           isAbsence ? 'text-orange-300' : isMsOnly ? 'text-sky-300' : 'text-purple-300'
                                          }`}>{event.titre}</div>
                                          {event.date_fin && (
                                            <div className="truncate text-[11px] opacity-90">{format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}</div>
                                          )}
                                          {event.description && <div className="truncate text-[10px] opacity-75">{event.description}</div>}
                                          <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-white/20">
                                            <div className="truncate">Créé: {format(new Date(event.created_date), "dd/MM/yy")}</div>
                                            {durationMinutes >= 90 && (
                                              <div className="truncate">Modif: {format(new Date(event.updated_date), "dd/MM/yy")}</div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-4">
                                    <div className="space-y-2">
                                      <div className="text-xs font-bold opacity-90 uppercase">
                                        {isAbsence ? 'Absence' : isMsOnly ? 'Microsoft' : 'Rendez-vous'}
                                      </div>
                                      <div className={`font-bold text-base ${
                                        isAbsence ? 'text-orange-300' : isMsOnly ? 'text-sky-300' : 'text-purple-300'
                                      }`}>{event.titre}</div>
                                      {event.date_fin && (
                                        <div className="text-sm opacity-90">
                                          {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
                                        </div>
                                      )}
                                      {event.description && (
                                        <div className="text-sm opacity-75 whitespace-pre-wrap">{event.description}</div>
                                      )}
                                      <div className="pt-2 border-t border-white/20">
                                        <div className="text-xs opacity-60">
                                          <div>Créé: {format(new Date(event.created_date), "dd/MM/yy à HH:mm")}</div>
                                          <div>Modifié: {format(new Date(event.updated_date), "dd/MM/yy à HH:mm")}</div>
                                        </div>
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
          )}

          {/* Vue Mois */}
          {agendaViewMode === "mois" && (
            <div>
              {/* En-têtes des jours */}
              <div className="grid grid-cols-7 w-full mb-1" style={{ gap: '2px' }}>
                {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map(j => (
                  <div key={j} className="text-center text-xs font-semibold text-slate-400 uppercase py-1">{j}</div>
                ))}
              </div>
            <div className="grid grid-cols-7 w-full" style={{ gap: '2px' }}>
              {monthDaysToDisplay.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                const isCurrentMonth = day.getMonth() === agendaCurrentDate.getMonth();
                const dayEvents = getRendezVousForDate(day);

                return (
                  <Card 
                    key={dateStr}
                    className={`border-slate-800 p-2 ${isToday ? 'ring-2 ring-purple-500' : ''} w-full ${isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-950/30 opacity-50'}`}
                    style={{ minHeight: '210px' }}
                  >
                    <div className="mb-2 w-full">
                      <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-purple-500' : ''} w-full`}>
                        <div className="flex items-center justify-center mb-1">
                          <div className="flex-1">
                            <p className={`text-xs uppercase ${isToday ? 'text-purple-400' : isCurrentMonth ? 'text-slate-400' : 'text-slate-600'}`}>
                              {format(day, "EEE", { locale: fr })}
                            </p>
                            <p className={`text-lg font-bold ${isToday ? 'text-purple-400' : isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
                              {format(day, "d", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 flex-1 overflow-y-auto" style={{ maxHeight: '170px' }}>
                      {dayEvents.map(event => {
                        const isAbsence = event.type === "absence";
                        const isMsOnly = event.source === 'microsoft';
                        
                        const eventStart = new Date(event.date_debut);
                        const eventEnd = event.date_fin ? new Date(event.date_fin) : eventStart;
                        
                        const dayStart = new Date(day);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(day);
                        dayEnd.setHours(23, 59, 59, 999);
                        
                        const displayStart = eventStart < dayStart ? dayStart : eventStart;
                        const displayEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
                        
                        return (
                          <Tooltip key={event.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={`relative text-xs px-3 py-2 rounded cursor-pointer hover:opacity-80 transition-opacity group flex flex-col gap-1 overflow-hidden ${
                                  isAbsence
                                     ? 'bg-gradient-to-r from-red-500/60 to-orange-500/60 border border-red-500 text-red-50'
                                     : isMsOnly
                                     ? 'bg-gradient-to-r from-sky-500/60 to-blue-600/60 border border-sky-400 text-sky-50'
                                     : 'bg-gradient-to-r from-purple-500/60 to-indigo-500/60 border border-purple-500 text-purple-50'
                                }`}
                                onClick={() => !isMsOnly && handleEditEvent(event)}
                                >
                                 {!isMsOnly && (
                                 <button
                                   onClick={(e) => handleDeleteClick(e, event)}
                                   style={{ top: '2px' }}
                                   className="absolute right-1 z-20 w-5 h-5 bg-red-600 hover:bg-red-700 border border-red-300 rounded text-white flex items-center justify-center transition-all group"
                                 >
                                   <Trash2 className="w-2.5 h-2.5 group-hover:text-red-300 transition-colors" />
                                 </button>
                                 )}
                                  <div className="truncate text-[11px] font-bold opacity-90 uppercase">
                                  {isAbsence ? 'Absence' : isMsOnly ? 'Microsoft' : 'Rendez-vous'}
                                </div>
                                <div className={`truncate font-bold text-sm ${
                                  isAbsence ? 'text-orange-300' : isMsOnly ? 'text-sky-300' : 'text-purple-300'
                                }`}>{event.titre}</div>
                                {event.date_fin && (
                                  <div className="truncate text-[11px] opacity-90">{format(displayStart, "HH:mm")} - {format(displayEnd, "HH:mm")}</div>
                                )}
                                {event.description && <div className="truncate text-[10px] opacity-75">{event.description}</div>}
                                <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-white/20">
                                  <div className="truncate">Créé: {format(new Date(event.created_date), "dd/MM/yy")}</div>
                                  <div className="truncate">Modif: {format(new Date(event.updated_date), "dd/MM/yy")}</div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white max-w-sm p-4">
                              <div className="space-y-2">
                                <div className="text-xs font-bold opacity-90 uppercase">
                                  {isAbsence ? 'Absence' : isMsOnly ? 'Microsoft' : 'Rendez-vous'}
                                </div>
                                <div className={`font-bold text-base ${
                                  isAbsence ? 'text-orange-300' : isMsOnly ? 'text-sky-300' : 'text-purple-300'
                                }`}>{event.titre}</div>
                                {event.date_fin && (
                                  <div className="text-sm opacity-90">
                                    {format(displayStart, "HH:mm")} - {format(displayEnd, "HH:mm")}
                                  </div>
                                )}
                                {event.description && (
                                  <div className="text-sm opacity-75 whitespace-pre-wrap">{event.description}</div>
                                )}
                                <div className="pt-2 border-t border-white/20">
                                  <div className="text-xs opacity-60">
                                    <div>Créé: {format(new Date(event.created_date), "dd/MM/yy à HH:mm")}</div>
                                    <div>Modifié: {format(new Date(event.updated_date), "dd/MM/yy à HH:mm")}</div>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
    </>
  );
}