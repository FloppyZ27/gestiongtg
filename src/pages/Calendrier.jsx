import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedUser, setSelectedUser] = useState([]);
  const [selectedType, setSelectedType] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: allRendezVous } = useQuery({
    queryKey: ['allRendezVous'],
    queryFn: () => base44.entities.RendezVous.list('-date_debut'),
    initialData: [],
  });

  const { data: dossiers } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getUserByEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "";
    return clientIds.map(id => {
      const c = getClientById(id);
      return c ? `${c.prenom} ${c.nom}` : "";
    }).filter(name => name).join(", ");
  };

  const getArpenteurInitials = (arpenteur) => {
    const mapping = {
      "Samuel Guay": "SG-",
      "Dany Gaboury": "DG-",
      "Pierre-Luc Pilote": "PLP-",
      "Benjamin Larouche": "BL-",
      "Frédéric Gilbert": "FG-"
    };
    return mapping[arpenteur] || "";
  };

  // Filter events
  // This filter applies only to 'rendez-vous' and 'absence' entities from allRendezVous
  const filteredRendezVous = allRendezVous.filter(rdv => {
    const userMatch = selectedUser.length === 0 || selectedUser.includes(rdv.utilisateur_email);
    const typeMatch = selectedType.length === 0 || selectedType.includes(rdv.type);
    return userMatch && typeMatch;
  });

  // Jours fériés Canada/Québec
  // Note: For a production app, calculating floating holidays (like Victoria Day, Labour Day, Thanksgiving) dynamically
  // would be more robust. These dates are accurate for 2025.
  const getHolidays = (year) => {
    return [
      { date: `${year}-01-01`, name: "Jour de l'an" },
      { date: `${year}-04-18`, name: "Vendredi saint" }, // Good Friday 2025
      { date: `${year}-05-19`, name: "Fête de la Reine" }, // Victoria Day 2025
      { date: `${year}-06-24`, name: "Fête nationale du Québec" },
      { date: `${year}-07-01`, name: "Fête du Canada" },
      { date: `${year}-09-01`, name: "Fête du Travail" }, // Labour Day 2025
      { date: `${year}-10-13`, name: "Action de grâce" }, // Thanksgiving 2025
      { date: `${year}-12-25`, name: "Noël" },
      { date: `${year}-12-26`, name: "Lendemain de Noël" },
    ];
  };

  // Calendar logic
  let startDate, endDate, daysInView;

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    startDate = startOfWeek(monthStart, { locale: fr });
    endDate = endOfWeek(monthEnd, { locale: fr });
    daysInView = eachDayOfInterval({ start: startDate, end: endDate });
  } else {
    startDate = startOfWeek(currentDate, { locale: fr });
    endDate = endOfWeek(currentDate, { locale: fr });
    daysInView = eachDayOfInterval({ start: startDate, end: endDate });
  }

  const getEventsForDay = (day) => {
    // Start with filtered RendezVous and Absences
    const events = filteredRendezVous.filter(rdv => {
      const rdvDate = new Date(rdv.date_debut);
      return isSameDay(rdvDate, day);
    });

    const dayStr = format(day, 'yyyy-MM-dd');
    const currentYear = day.getFullYear();

    // Add holidays
    const holidays = getHolidays(currentYear);
    const holiday = holidays.find(h => h.date === dayStr);
    if (holiday) {
      events.push({
        id: `holiday-${dayStr}`,
        titre: holiday.name,
        type: 'holiday',
        date_debut: dayStr,
        description: `C'est un jour férié : ${holiday.name}.`
      });
    }

    // Add birthdays for all users
    users.forEach(u => {
      if (u.date_naissance) {
        const birthDate = new Date(u.date_naissance);
        // Check if the month and day match the current day in the calendar view
        if (birthDate.getMonth() === day.getMonth() && birthDate.getDate() === day.getDate()) {
          // Check if this user's birthday should be displayed based on selectedUser filter
          const userMatch = selectedUser.length === 0 || selectedUser.includes(u.email);
          if (userMatch) {
            events.push({
              id: `birthday-${u.email}-${dayStr}`,
              titre: `🎂 Anniversaire de ${u.full_name}`,
              type: 'birthday',
              date_debut: dayStr,
              utilisateur_email: u.email,
              description: `Aujourd'hui, c'est l'anniversaire de ${u.full_name} !`,
            });
          }
        }
      }
    });

    return events;
  };

  const previousPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'month') {
      return format(currentDate, "MMMM yyyy", { locale: fr });
    } else {
      const weekStart = startOfWeek(currentDate, { locale: fr });
      const weekEnd = endOfWeek(currentDate, { locale: fr });
      return `${format(weekStart, "d MMM", { locale: fr })} - ${format(weekEnd, "d MMM yyyy", { locale: fr })}`;
    }
  };

  const handleEventClick = (event) => {
    // Only open details for 'rendez-vous' or 'absence'
    if (event.type === 'rendez-vous' || event.type === 'absence') {
      setSelectedEvent(event);
      setIsDetailsDialogOpen(true);
    }
  };

  // Compute all visible events for statistics based on the current calendar view
  const allVisibleEvents = daysInView.flatMap(day => getEventsForDay(day));

  const totalRdv = allVisibleEvents.filter(e => e.type === 'rendez-vous').length;
  const totalAbsences = allVisibleEvents.filter(e => e.type === 'absence').length;
  const totalHolidays = allVisibleEvents.filter(e => e.type === 'holiday').length;
  const totalBirthdays = allVisibleEvents.filter(e => e.type === 'birthday').length;
  const totalOverallEvents = allVisibleEvents.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-8">
          <CalendarIcon className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Calendrier
            </h1>
            <p className="text-slate-400">Vue d'ensemble des rendez-vous et absences</p>
          </div>
        </div>

        {/* Filters - Collapsible Box */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="text-sm">Filtres</span>
                  {(selectedUser.length > 0 || selectedType.length > 0) && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {selectedUser.length + selectedType.length}
                    </Badge>
                  )}
                  {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>

              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                  <div className="p-3 border border-emerald-500/30 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <Filter className="w-3 h-3 text-emerald-500" />
                          <h4 className="text-xs font-semibold text-emerald-500">Filtrer les événements</h4>
                        </div>
                        {(selectedUser.length > 0 || selectedType.length > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser([]);
                              setSelectedType([]);
                            }}
                            className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                          >
                            <X className="w-2.5 h-2.5 mr-1" />
                            Réinitialiser
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Utilisateurs ({selectedUser.length > 0 ? `${selectedUser.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                            {users.map((user) => (
                              <DropdownMenuCheckboxItem
                                key={user.email}
                                checked={selectedUser.includes(user.email)}
                                onCheckedChange={(checked) => {
                                  setSelectedUser(
                                    checked
                                      ? [...selectedUser, user.email]
                                      : selectedUser.filter((u) => u !== user.email)
                                  );
                                }}
                                className="text-white text-xs"
                              >
                                {user.full_name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Types ({selectedType.length > 0 ? `${selectedType.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {['rendez-vous', 'absence', 'anniversaire', 'jour_ferie'].map((type) => (
                              <DropdownMenuCheckboxItem
                                key={type}
                                checked={selectedType.includes(type)}
                                onCheckedChange={(checked) => {
                                  setSelectedType(
                                    checked
                                      ? [...selectedType, type]
                                      : selectedType.filter((t) => t !== type)
                                  );
                                }}
                                className="text-white text-xs"
                              >
                                {type === 'rendez-vous' ? 'Rendez-vous' :
                                 type === 'absence' ? 'Absence' :
                                 type === 'anniversaire' ? 'Anniversaire' :
                                 'Jour férié'}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6">
            {/* Header avec navigation et contrôles */}
            <div className="flex flex-col gap-3 mb-6 pb-4 border-b border-slate-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-white font-semibold text-lg">
                    {viewMode === "week" 
                      ? `Semaine du ${format(daysInView[0], "d MMMM", { locale: fr })} au ${format(daysInView[6], "d MMMM yyyy", { locale: fr })}`
                      : format(currentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: fr }).slice(1)}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={previousPeriod}
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                  >
                    ← Précédent
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 h-8"
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={nextPeriod}
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 h-8"
                  >
                    Suivant →
                  </Button>
                  <div className="h-6 w-px bg-slate-700 mx-1"></div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => setViewMode("week")}
                      className={`h-8 ${viewMode === "week" ? "agenda-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                    >
                      Semaine
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setViewMode("month")}
                      className={`h-8 ${viewMode === "month" ? "agenda-tab-button" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}`}
                    >
                      Mois
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Vue Semaine */}
            {viewMode === "week" && (
              <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/30 flex flex-col" style={{ height: '600px' }}>
                <div className="overflow-x-auto flex-1 flex flex-col">
                  <div className="inline-block min-w-full h-full flex flex-col">
                    {/* En-têtes des jours */}
                    <div className="flex border-b border-slate-700 flex-shrink-0">
                      <div className="w-16 flex-shrink-0 border-r border-slate-700 bg-slate-900/50"></div>
                      {daysInView.slice(0, 7).map((day, idx) => {
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
                    <div className="overflow-y-auto flex-1 relative">
                      <div className="flex relative" style={{ minHeight: '1440px' }}>
                        {/* Colonne des heures */}
                        <div className="w-16 flex-shrink-0 sticky left-0 z-20 bg-slate-900/30">
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <div key={hour} className="h-[60px] border-b border-slate-700/50 flex items-start">
                              <div className="w-full border-r border-slate-700 px-2 py-2 text-xs text-slate-500 text-right">
                                {hour.toString().padStart(2, '0')}:00
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Colonnes des jours */}
                        {daysInView.slice(0, 7).map((day, dayIdx) => {
                          const isToday = day.toDateString() === new Date().toDateString();
                          const dayEvents = getEventsForDay(day);

                          return (
                            <div key={dayIdx} className={`flex-1 border-r border-slate-700 relative ${isToday ? 'bg-purple-500/10' : 'bg-slate-800/20'}`}>
                              {/* Grille des heures de fond */}
                              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                                <div key={hour} className="h-[60px] border-b border-slate-700/50"></div>
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
                                const topPx = startHour * 60 + startMin;

                                const isAbsence = event.type === "absence";
                                const isHoliday = event.type === "holiday";
                                const isBirthday = event.type === "birthday";

                                return (
                                  <div
                                    key={event.id}
                                    className={`absolute left-1 right-1 rounded px-2 py-1 text-[10px] font-semibold z-10 cursor-pointer hover:opacity-80 transition-opacity group flex flex-col ${
                                      isAbsence
                                        ? 'bg-gradient-to-r from-red-500/60 to-orange-500/60 border border-red-500 text-red-50'
                                        : isHoliday
                                        ? 'bg-gradient-to-r from-blue-500/60 to-cyan-500/60 border border-blue-500 text-blue-50'
                                        : isBirthday
                                        ? 'bg-gradient-to-r from-purple-500/60 to-pink-500/60 border border-purple-500 text-purple-50'
                                        : 'bg-gradient-to-r from-purple-500/60 to-indigo-500/60 border border-purple-500 text-purple-50'
                                    }`}
                                    style={{
                                      height: `${Math.max(20, durationMinutes)}px`,
                                      top: `${topPx}px`
                                    }}
                                    onClick={() => (event.type === 'rendez-vous' || event.type === 'absence') && handleEventClick(event)}
                                  >
                                    <div className="truncate text-[10px] font-bold opacity-90 uppercase">
                                      {isAbsence ? 'Absence' : isHoliday ? 'Jour férié' : isBirthday ? 'Anniversaire' : 'Rendez-vous'}
                                    </div>
                                    <div className={`truncate font-bold ${
                                      isAbsence ? 'text-orange-300' : isHoliday ? 'text-cyan-300' : isBirthday ? 'text-pink-300' : 'text-purple-300'
                                    }`}>{event.titre}</div>
                                    {event.date_fin && (
                                      <div className="truncate text-[9px] opacity-90">{format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}</div>
                                    )}
                                    {event.description && <div className="truncate text-[9px] opacity-75">{event.description}</div>}
                                    {event.utilisateur_email && getUserByEmail(event.utilisateur_email) && (
                                      <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-white/20">
                                        <span className="text-[7px] font-bold">{getInitials(getUserByEmail(event.utilisateur_email)?.full_name)}</span>
                                        <Avatar className="w-4 h-4">
                                          <AvatarImage src={getUserByEmail(event.utilisateur_email)?.photo_url} />
                                          <AvatarFallback className="text-[7px] bg-white/30">
                                            {getInitials(getUserByEmail(event.utilisateur_email)?.full_name)}
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                    )}
                                    {(event.type === 'rendez-vous' || event.type === 'absence') && (
                                      <div className="text-[8px] opacity-60 mt-auto pt-0.5 border-t border-white/20">
                                        <div>Créé: {format(new Date(event.created_date), "dd/MM/yy")}</div>
                                        <div>Modif: {format(new Date(event.updated_date), "dd/MM/yy")}</div>
                                      </div>
                                    )}
                                  </div>
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
            {viewMode === "month" && (
              <div className="grid grid-cols-5 w-full" style={{ gap: '2px' }}>
                {daysInView.map((day, index) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
                  const dayEvents = getEventsForDay(day);

                  return (
                    <Card 
                      key={dateStr}
                      className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-purple-500' : ''} w-full`}
                    >
                      <div className="mb-2 w-full">
                        <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-purple-500' : ''} w-full`}>
                          <div className="flex items-center justify-center mb-1">
                            <div className="flex-1">
                              <p className={`text-xs uppercase ${isToday ? 'text-purple-400' : 'text-slate-400'}`}>
                                {format(day, "EEE", { locale: fr })}
                              </p>
                              <p className={`text-lg font-bold ${isToday ? 'text-purple-400' : 'text-white'}`}>
                                {format(day, "d", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                        {dayEvents.map(event => {
                          const isAbsence = event.type === "absence";
                          const isHoliday = event.type === "holiday";
                          const isBirthday = event.type === "birthday";
                          
                          return (
                            <div
                              key={event.id}
                              className={`text-xs px-2 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity relative group flex flex-col min-h-[60px] ${
                                isAbsence
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : isHoliday
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : isBirthday
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}
                              onClick={() => (event.type === 'rendez-vous' || event.type === 'absence') && handleEventClick(event)}
                            >
                              <div className="text-[10px] font-bold opacity-90 uppercase mb-0.5">
                                {isAbsence ? 'Absence' : isHoliday ? 'Jour férié' : isBirthday ? 'Anniversaire' : 'Rendez-vous'}
                              </div>
                              <div className={`font-bold truncate ${
                                isAbsence ? 'text-orange-300' : isHoliday ? 'text-cyan-300' : isBirthday ? 'text-pink-300' : 'text-purple-300'
                              }`}>{event.titre}</div>
                              {event.date_fin && (
                                <div className="text-[10px] opacity-90 truncate">{format(new Date(event.date_debut), "HH:mm")} - {format(new Date(event.date_fin), "HH:mm")}</div>
                              )}
                              {event.description && <div className="text-[10px] opacity-75 truncate mt-0.5">{event.description}</div>}
                              {(event.type === 'rendez-vous' || event.type === 'absence') && (
                                <div className="text-[9px] opacity-60 mt-auto pt-1 border-t border-current/20">
                                  <div>Créé: {format(new Date(event.created_date), "dd/MM/yy")}</div>
                                  <div>Modif: {format(new Date(event.updated_date), "dd/MM/yy")}</div>
                                </div>
                              )}
                              {event.utilisateur_email && getUserByEmail(event.utilisateur_email) && (
                                <div className="flex items-center justify-end gap-1 mt-1 pt-1 border-t border-current/20">
                                  <span className="text-[10px] font-bold">{getInitials(getUserByEmail(event.utilisateur_email)?.full_name)}</span>
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={getUserByEmail(event.utilisateur_email)?.photo_url} />
                                    <AvatarFallback className="text-[8px] bg-white/30">
                                      {getInitials(getUserByEmail(event.utilisateur_email)?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de l'événement</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
                {selectedEvent.utilisateur_email && (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={getUserByEmail(selectedEvent.utilisateur_email)?.photo_url} />
                      <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500">
                        {getInitials(getUserByEmail(selectedEvent.utilisateur_email)?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{getUserByEmail(selectedEvent.utilisateur_email)?.full_name}</p>
                      <p className="text-sm text-slate-400">{selectedEvent.utilisateur_email}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-400">Titre</Label>
                    <p className="text-white font-semibold">{selectedEvent.titre}</p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Type</Label>
                    <div>
                       <Badge className={
                         selectedEvent.type === 'absence' ? 'bg-red-500/20 text-red-400' :
                         selectedEvent.type === 'holiday' ? 'bg-blue-500/20 text-blue-400' :
                         selectedEvent.type === 'birthday' ? 'bg-purple-500/20 text-purple-400' :
                         'bg-emerald-500/20 text-emerald-400'
                       }>
                         {selectedEvent.type === 'absence' ? 'Absence' :
                          selectedEvent.type === 'holiday' ? 'Jour férié' :
                          selectedEvent.type === 'birthday' ? 'Anniversaire' :
                          'Rendez-vous'}
                       </Badge>
                     </div>
                    </div>

                  <div>
                    <Label className="text-slate-400">Date{selectedEvent.heure ? ' et heure' : ''}</Label>
                    <p className="text-white">
                      {selectedEvent.date_fin 
                        ? format(new Date(selectedEvent.date_debut), "dd MMMM yyyy à HH:mm", { locale: fr })
                        : format(new Date(selectedEvent.date_debut), "dd MMMM yyyy", { locale: fr })}
                      {selectedEvent.heure && ` à ${selectedEvent.heure}`}
                    </p>
                    {selectedEvent.date_fin && (
                      <p className="text-slate-400 text-sm">
                        jusqu'à {format(new Date(selectedEvent.date_fin), "dd MMMM yyyy à HH:mm", { locale: fr })}
                      </p>
                    )}
                  </div>

                  {selectedEvent.description && (
                    <div>
                      <Label className="text-slate-400">Description</Label>
                      <p className="text-white whitespace-pre-wrap">{selectedEvent.description}</p>
                    </div>
                  )}

                  {(selectedEvent.type === 'rendez-vous' || selectedEvent.type === 'absence') && currentUser?.email !== selectedEvent.utilisateur_email && (
                    <div className="pt-4 border-t border-slate-800">
                      <p className="text-sm text-slate-500 italic">
                        Vous ne pouvez pas modifier cet événement car vous n'en êtes pas le propriétaire.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}