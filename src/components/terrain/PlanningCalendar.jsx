import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Users, Truck, Wrench, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function PlanningCalendar({ 
  dossiers, 
  techniciens, 
  vehicules, 
  equipements, 
  clients,
  onUpdateDossier 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week or month
  const [assignments, setAssignments] = useState({});

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = clients.find(c => c.id === id);
      return client ? `${client.prenom} ${client.nom}` : "";
    }).filter(name => name).join(", ");
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

  const getDays = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lundi
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const days = getDays();

  const goToPrevious = () => {
    if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const sourceDate = source.droppableId;
    const destDate = destination.droppableId;

    if (sourceDate === "unassigned") {
      // Déplacer d'unassigned vers une date
      const newAssignments = { ...assignments };
      if (!newAssignments[destDate]) {
        newAssignments[destDate] = [];
      }
      newAssignments[destDate].push({
        dossierId: draggableId,
        technicien: null,
        vehicule: null,
        equipement: null
      });
      setAssignments(newAssignments);

      // Mettre à jour le dossier dans la base de données
      const dossier = dossiers.find(d => d.id === draggableId);
      if (dossier) {
        const updatedMandats = dossier.mandats?.map(m => 
          m.tache_actuelle === "Cédule" ? { ...m, date_terrain: destDate } : m
        );
        onUpdateDossier(draggableId, { ...dossier, mandats: updatedMandats });
      }
    } else if (destDate === "unassigned") {
      // Déplacer vers unassigned
      const newAssignments = { ...assignments };
      if (newAssignments[sourceDate]) {
        newAssignments[sourceDate] = newAssignments[sourceDate].filter(a => a.dossierId !== draggableId);
        if (newAssignments[sourceDate].length === 0) {
          delete newAssignments[sourceDate];
        }
      }
      setAssignments(newAssignments);

      // Mettre à jour le dossier
      const dossier = dossiers.find(d => d.id === draggableId);
      if (dossier) {
        const updatedMandats = dossier.mandats?.map(m => 
          m.tache_actuelle === "Cédule" ? { ...m, date_terrain: null } : m
        );
        onUpdateDossier(draggableId, { ...dossier, mandats: updatedMandats });
      }
    } else if (sourceDate !== destDate) {
      // Déplacer d'une date à une autre
      const newAssignments = { ...assignments };
      const item = newAssignments[sourceDate]?.find(a => a.dossierId === draggableId);
      if (item) {
        newAssignments[sourceDate] = newAssignments[sourceDate].filter(a => a.dossierId !== draggableId);
        if (newAssignments[sourceDate].length === 0) {
          delete newAssignments[sourceDate];
        }
        if (!newAssignments[destDate]) {
          newAssignments[destDate] = [];
        }
        newAssignments[destDate].push(item);
        setAssignments(newAssignments);

        // Mettre à jour le dossier
        const dossier = dossiers.find(d => d.id === draggableId);
        if (dossier) {
          const updatedMandats = dossier.mandats?.map(m => 
            m.tache_actuelle === "Cédule" ? { ...m, date_terrain: destDate } : m
          );
          onUpdateDossier(draggableId, { ...dossier, mandats: updatedMandats });
        }
      }
    }
  };

  const unassignedDossiers = dossiers.filter(d => {
    const isAssigned = Object.values(assignments).some(dayAssignments => 
      dayAssignments.some(a => a.dossierId === d.id)
    );
    return !isAssigned && !d.mandats?.some(m => m.date_terrain);
  });

  const getAssignmentsForDate = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const assigned = assignments[dateStr] || [];
    
    // Ajouter aussi les dossiers qui ont cette date dans leur mandat
    const fromMandats = dossiers.filter(d => 
      d.mandats?.some(m => m.date_terrain === dateStr && m.tache_actuelle === "Cédule")
    ).filter(d => !assigned.some(a => a.dossierId === d.id));

    return [
      ...assigned.map(a => ({ ...a, dossier: dossiers.find(d => d.id === a.dossierId) })),
      ...fromMandats.map(d => ({ dossierId: d.id, dossier: d, technicien: null, vehicule: null, equipement: null }))
    ];
  };

  const DossierCard = ({ dossier, assignment }) => {
    const mandat = dossier.mandats?.find(m => m.tache_actuelle === "Cédule");
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 mb-2 hover:bg-slate-700 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
          </Badge>
          {mandat && (
            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
              {mandat.type_mandat}
            </Badge>
          )}
        </div>
        <p className="text-slate-300 text-xs mb-1 line-clamp-1">
          {getClientsNames(dossier.clients_ids)}
        </p>
        <p className="text-slate-500 text-xs line-clamp-1">
          {formatAdresse(mandat?.adresse_travaux)}
        </p>
        {assignment && (assignment.technicien || assignment.vehicule || assignment.equipement) && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {assignment.technicien && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                <Users className="w-3 h-3 mr-1" />
                {techniciens.find(t => t.id === assignment.technicien)?.prenom}
              </Badge>
            )}
            {assignment.vehicule && (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                <Truck className="w-3 h-3 mr-1" />
                {vehicules.find(v => v.id === assignment.vehicule)?.nom}
              </Badge>
            )}
            {assignment.equipement && (
              <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                <Wrench className="w-3 h-3 mr-1" />
                {equipements.find(e => e.id === assignment.equipement)?.nom}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={goToPrevious} variant="outline" size="sm" className="bg-slate-800 border-slate-700">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button onClick={goToToday} variant="outline" size="sm" className="bg-slate-800 border-slate-700">
            Aujourd'hui
          </Button>
          <Button onClick={goToNext} variant="outline" size="sm" className="bg-slate-800 border-slate-700">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-white font-semibold text-lg">
            {viewMode === "week" 
              ? format(days[0], "d MMM", { locale: fr }) + " - " + format(days[days.length - 1], "d MMM yyyy", { locale: fr })
              : format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
        </div>
        <Select value={viewMode} onValueChange={setViewMode}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="week" className="text-white">Semaine</SelectItem>
            <SelectItem value="month" className="text-white">Mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-[200px_1fr] gap-4">
          {/* Colonne gauche - Dossiers non assignés */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Non planifiés ({unassignedDossiers.length})
            </h3>
            <Droppable droppableId="unassigned">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[500px] ${snapshot.isDraggingOver ? 'bg-slate-800/50 rounded-lg' : ''}`}
                >
                  {unassignedDossiers.map((dossier, index) => (
                    <Draggable key={dossier.id} draggableId={dossier.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={snapshot.isDragging ? 'opacity-50' : ''}
                        >
                          <DossierCard dossier={dossier} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </Card>

          {/* Grille calendrier */}
          <div className={`grid ${viewMode === "week" ? "grid-cols-7" : "grid-cols-7"} gap-2`}>
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayAssignments = getAssignmentsForDate(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <Card 
                  key={dateStr} 
                  className={`bg-slate-900/50 border-slate-800 p-2 min-h-[300px] ${isToday ? 'ring-2 ring-cyan-500' : ''}`}
                >
                  <div className="text-center mb-2 pb-2 border-b border-slate-700">
                    <div className="text-slate-400 text-xs">
                      {format(day, "EEE", { locale: fr })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                      {format(day, "d", { locale: fr })}
                    </div>
                    {dayAssignments.length > 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs mt-1">
                        {dayAssignments.length}
                      </Badge>
                    )}
                  </div>

                  <Droppable droppableId={dateStr}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] ${snapshot.isDraggingOver ? 'bg-cyan-500/10 rounded-lg' : ''}`}
                      >
                        {dayAssignments.map((assignment, index) => (
                          <Draggable 
                            key={assignment.dossierId} 
                            draggableId={assignment.dossierId} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={snapshot.isDragging ? 'opacity-50' : ''}
                              >
                                <DossierCard dossier={assignment.dossier} assignment={assignment} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </Card>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}