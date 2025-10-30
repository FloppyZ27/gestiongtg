
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Calendrier() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

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

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getUserByEmail = (email) => {
    return users.find(u => u.email === email);
  };

  // Filter events
  // This filter applies only to 'rendez-vous' and 'absence' entities from allRendezVous
  const filteredRendezVous = allRendezVous.filter(rdv => {
    const userMatch = selectedUser === 'all' || rdv.utilisateur_email === selectedUser;
    const typeMatch = selectedType === 'all' || rdv.type === selectedType;
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
          const userMatch = selectedUser === 'all' || u.email === selectedUser;
          if (userMatch) {
            events.push({
              id: `birthday-${u.email}-${dayStr}`, // Unique ID for birthday on a specific day for a specific user
              titre: `🎂 Anniversaire de ${u.full_name}`,
              type: 'birthday',
              date_debut: dayStr,
              utilisateur_email: u.email, // Associate with user for avatar
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <CalendarIcon className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Calendrier
            </h1>
            <p className="text-slate-400">Vue d'ensemble des rendez-vous et absences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-400" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Utilisateur</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Tous les utilisateurs" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les utilisateurs</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.email} value={user.email} className="text-white">
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Type</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                      <SelectItem value="rendez-vous" className="text-white">Rendez-vous</SelectItem>
                      <SelectItem value="absence" className="text-white">Absence</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Légende</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30"></div>
                      <span className="text-sm text-slate-300">Rendez-vous</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30"></div>
                      <span className="text-sm text-slate-300">Absence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/30"></div>
                      <span className="text-sm text-slate-300">Jour férié</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-500/20 border border-purple-500/30"></div>
                      <span className="text-sm text-slate-300">Anniversaire</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-400 mb-3">Statistiques</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total événements (vue)</span>
                      <span className="text-white font-semibold">{totalOverallEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rendez-vous</span>
                      <span className="text-emerald-400 font-semibold">
                        {totalRdv}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Absences</span>
                      <span className="text-red-400 font-semibold">
                        {totalAbsences}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Jours fériés</span>
                      <span className="text-blue-400 font-semibold">
                        {totalHolidays}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Anniversaires</span>
                      <span className="text-purple-400 font-semibold">
                        {totalBirthdays}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-400" />
                    Vue {viewMode === 'month' ? 'Mensuelle' : 'Hebdomadaire'}
                  </CardTitle>
                  <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'month' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('month')}
                      className={viewMode === 'month' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      Mois
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'week' ? 'default' : 'ghost'}
                      onClick={() => setViewMode('week')}
                      className={viewMode === 'week' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      Semaine
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Calendar Header */}
                <div className="flex justify-between items-center mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={previousPeriod}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <h3 className="text-lg font-semibold text-white">
                    {getPeriodLabel()}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextPeriod}
                    className="text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-slate-500 p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {daysInView.map((day, index) => {
                    const events = getEventsForDay(day);
                    const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true;
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div
                        key={index}
                        className={`
                          ${viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[80px]'} p-2 rounded-lg border transition-colors
                          ${isCurrentMonth ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/30 border-slate-800'}
                          ${isToday ? 'border-emerald-500 border-2' : ''}
                        `}
                      >
                        <div className={`text-sm mb-1 ${isCurrentMonth ? 'text-white' : 'text-slate-600'}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {events.map(event => {
                            const user = event.utilisateur_email ? getUserByEmail(event.utilisateur_email) : null;
                            const isClickable = event.type === 'rendez-vous' || event.type === 'absence';

                            return (
                              <div
                                key={event.id}
                                onClick={() => isClickable && handleEventClick(event)}
                                className={`
                                  text-xs p-1 rounded flex items-center gap-1
                                  ${event.type === 'absence'
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : event.type === 'holiday'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : event.type === 'birthday'
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  }
                                  ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                                `}
                                title={`${event.titre}${user ? ' - ' + user.full_name : ''}`}
                              >
                                {(event.type === 'rendez-vous' || event.type === 'absence') && user && (
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={user?.photo_url} />
                                    <AvatarFallback className="text-[8px] bg-gradient-to-r from-emerald-500 to-teal-500">
                                      {getInitials(user?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                {event.type === 'birthday' && user && (
                                  <Avatar className="w-4 h-4">
                                    <AvatarImage src={user?.photo_url} />
                                    <AvatarFallback className="text-[8px] bg-gradient-to-r from-purple-500 to-pink-500">
                                      {getInitials(user?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <span className="truncate flex-1">{event.titre}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Détails de l'événement</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <div>
                    <Label className="text-slate-400">Titre</Label>
                    <p className="text-white font-semibold">{selectedEvent.titre}</p>
                  </div>

                  <div>
                    <Label className="text-slate-400">Type</Label>
                    <div>
                      <Badge className={selectedEvent.type === 'absence' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                        {selectedEvent.type}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-400">Date et heure</Label>
                    <p className="text-white">
                      {format(new Date(selectedEvent.date_debut), "dd MMMM yyyy à HH:mm", { locale: fr })}
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

                  {currentUser?.email !== selectedEvent.utilisateur_email && (
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
