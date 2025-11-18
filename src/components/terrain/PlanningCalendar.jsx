import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Users, Truck, Wrench, FolderOpen } from "lucide-react";
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
  const [technicienAssignments, setTechnicienAssignments] = useState({}); // { "date": ["techId1", "techId2"] }
  const [activeResourceTab, setActiveResourceTab] = useState("mandats");

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
      return Array.from({ length: 5 }, (_, i) => addDays(start, i)); // Seulement lun-ven
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const allDays = eachDayOfInterval({ start, end });
      return allDays.filter(day => {
        const dayOfWeek = day.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclure dimanche (0) et samedi (6)
      });
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
    const { source, destination, draggableId, type } = result;

    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Drag & drop de technicien
    if (type === "TECHNICIEN") {
      const newTechAssignments = { ...technicienAssignments };
      
      // Retirer du source si ce n'est pas la liste principale
      if (sourceId !== "techniciens-list") {
        newTechAssignments[sourceId] = (newTechAssignments[sourceId] || []).filter(id => id !== draggableId);
        if (newTechAssignments[sourceId].length === 0) {
          delete newTechAssignments[sourceId];
        }
      }
      
      // Ajouter à la destination si ce n'est pas la liste principale
      if (destId !== "techniciens-list") {
        if (!newTechAssignments[destId]) {
          newTechAssignments[destId] = [];
        }
        // Vérifier si le technicien n'est pas déjà assigné à cette date
        if (!newTechAssignments[destId].includes(draggableId)) {
          newTechAssignments[destId].push(draggableId);
        }
      }
      
      setTechnicienAssignments(newTechAssignments);
      return;
    }
    
    // Drag & drop de véhicule
    if (type === "VEHICULE") {
      // TODO: Implémenter la logique pour les véhicules
      return;
    }
    
    // Drag & drop d'équipement
    if (type === "EQUIPEMENT") {
      // TODO: Implémenter la logique pour les équipements
      return;
    }

    // Format: "date-technicienId" ou "unassigned"
    const parseDroppableId = (id) => {
      if (id === "unassigned") return { date: null, technicienId: null };
      const parts = id.split('-');
      return { 
        date: parts.slice(0, 3).join('-'), // yyyy-MM-dd
        technicienId: parts.slice(3).join('-') 
      };
    };

    const source_parsed = parseDroppableId(sourceId);
    const dest_parsed = parseDroppableId(destId);

    // Trouver le dossier
    const dossier = dossiers.find(d => d.id === draggableId);
    if (!dossier) return;

    if (sourceId === "unassigned") {
      // Déplacer d'unassigned vers date-technicien
      const newAssignments = { ...assignments };
      if (!newAssignments[destId]) {
        newAssignments[destId] = [];
      }
      newAssignments[destId].push({
        dossierId: draggableId,
        technicienId: dest_parsed.technicienId,
        vehicule: null,
        equipement: null
      });
      setAssignments(newAssignments);

      // Mettre à jour le dossier
      const updatedMandats = dossier.mandats?.map(m => 
        m.tache_actuelle === "Cédule" ? { 
          ...m, 
          date_terrain: dest_parsed.date,
          utilisateur_assigne: dest_parsed.technicienId 
        } : m
      );
      onUpdateDossier(draggableId, { ...dossier, mandats: updatedMandats });
    } else if (destId === "unassigned") {
      // Déplacer vers unassigned
      const newAssignments = { ...assignments };
      if (newAssignments[sourceId]) {
        newAssignments[sourceId] = newAssignments[sourceId].filter(a => a.dossierId !== draggableId);
        if (newAssignments[sourceId].length === 0) {
          delete newAssignments[sourceId];
        }
      }
      setAssignments(newAssignments);

      // Mettre à jour le dossier
      const updatedMandats = dossier.mandats?.map(m => 
        m.tache_actuelle === "Cédule" ? { 
          ...m, 
          date_terrain: null,
          utilisateur_assigne: null 
        } : m
      );
      onUpdateDossier(draggableId, { ...dossier, mandats: updatedMandats });
    } else if (sourceId !== destId) {
      // Déplacer d'un slot à un autre
      const newAssignments = { ...assignments };
      const item = newAssignments[sourceId]?.find(a => a.dossierId === draggableId);
      if (item) {
        newAssignments[sourceId] = newAssignments[sourceId].filter(a => a.dossierId !== draggableId);
        if (newAssignments[sourceId].length === 0) {
          delete newAssignments[sourceId];
        }
        if (!newAssignments[destId]) {
          newAssignments[destId] = [];
        }
        newAssignments[destId].push({
          ...item,
          technicienId: dest_parsed.technicienId
        });
        setAssignments(newAssignments);

        // Mettre à jour le dossier
        const updatedMandats = dossier.mandats?.map(m => 
          m.tache_actuelle === "Cédule" ? { 
            ...m, 
            date_terrain: dest_parsed.date,
            utilisateur_assigne: dest_parsed.technicienId 
          } : m
        );
        onUpdateDossier(draggableId, { ...dossier, mandats: updatedMandats });
      }
    }
  };

  const unassignedDossiers = dossiers.filter(d => {
    const isAssigned = Object.values(assignments).some(dayAssignments => 
      dayAssignments.some(a => a.dossierId === d.id)
    );
    const hasDateTerrain = d.mandats?.some(m => m.date_terrain && m.tache_actuelle === "Cédule");
    return !isAssigned && !hasDateTerrain;
  });

  const getAssignmentsForDateAndTech = (date, technicienId) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const slotId = `${dateStr}-${technicienId}`;
    const assigned = assignments[slotId] || [];
    
    // Ajouter aussi les dossiers qui ont cette date et ce technicien dans leur mandat
    const fromMandats = dossiers.filter(d => {
      const mandat = d.mandats?.find(m => m.tache_actuelle === "Cédule");
      return mandat?.date_terrain === dateStr && 
             mandat?.utilisateur_assigne === technicienId;
    }).filter(d => !assigned.some(a => a.dossierId === d.id));

    return [
      ...assigned.map(a => ({ ...a, dossier: dossiers.find(d => d.id === a.dossierId) })),
      ...fromMandats.map(d => ({ 
        dossierId: d.id, 
        dossier: d, 
        technicienId: technicienId,
        vehicule: null, 
        equipement: null 
      }))
    ];
  };

  const DossierCard = ({ dossier }) => {
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
        <div className="grid grid-cols-[280px_1fr] gap-4">
          {/* Colonne gauche - Ressources avec tabs */}
          <Card className="bg-slate-900/50 border-slate-800 p-4">
            <Tabs value={activeResourceTab} onValueChange={setActiveResourceTab}>
              <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="mandats" className="data-[state=active]:bg-slate-700">
                  <FolderOpen className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="techniciens" className="data-[state=active]:bg-slate-700">
                  <Users className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="vehicules" className="data-[state=active]:bg-slate-700">
                  <Truck className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="equipements" className="data-[state=active]:bg-slate-700">
                  <Wrench className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mandats" className="mt-0">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Non planifiés ({unassignedDossiers.length})
                </h3>
                <Droppable droppableId="unassigned">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto ${snapshot.isDraggingOver ? 'bg-slate-800/50 rounded-lg' : ''}`}
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
              </TabsContent>

              <TabsContent value="techniciens" className="mt-0">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Techniciens ({techniciens.length})
                </h3>
                <Droppable droppableId="techniciens-list" type="TECHNICIEN" isDropDisabled={true}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto"
                    >
                      {techniciens.map((tech, index) => (
                        <Draggable key={tech.id} draggableId={tech.id} index={index} type="TECHNICIEN">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-50' : ''}
                            >
                              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2 cursor-move hover:bg-blue-500/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-blue-400" />
                                  <span className="text-white text-sm font-medium">
                                    {tech.prenom} {tech.nom}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </TabsContent>

              <TabsContent value="vehicules" className="mt-0">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Véhicules ({vehicules.length})
                </h3>
                <Droppable droppableId="vehicules-list" type="VEHICULE" isDropDisabled={true}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto"
                    >
                      {vehicules.map((vehicule, index) => (
                        <Draggable key={vehicule.id} draggableId={vehicule.id} index={index} type="VEHICULE">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-50' : ''}
                            >
                              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2 cursor-move hover:bg-purple-500/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-purple-400" />
                                  <span className="text-white text-sm font-medium">
                                    {vehicule.nom}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </TabsContent>

              <TabsContent value="equipements" className="mt-0">
                <h3 className="text-white font-semibold mb-3 text-sm">
                  Équipements ({equipements.length})
                </h3>
                <Droppable droppableId="equipements-list" type="EQUIPEMENT" isDropDisabled={true}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto"
                    >
                      {equipements.map((equipement, index) => (
                        <Draggable key={equipement.id} draggableId={equipement.id} index={index} type="EQUIPEMENT">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-50' : ''}
                            >
                              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 cursor-move hover:bg-orange-500/30 transition-colors">
                                <div className="flex items-center gap-2">
                                  <Wrench className="w-4 h-4 text-orange-400" />
                                  <span className="text-white text-sm font-medium">
                                    {equipement.nom}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Grille calendrier */}
          <div className="space-y-4">
            {viewMode === "week" ? (
              <div className="grid grid-cols-5 gap-2">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const assignedTechs = technicienAssignments[dateStr] || [];
                  
                  return (
                    <Card 
                      key={dateStr}
                      className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-cyan-500' : ''}`}
                    >
                      <div className="text-center mb-2 pb-2 border-b border-slate-700">
                        <div className="text-slate-400 text-xs">
                          {format(day, "EEE", { locale: fr })}
                        </div>
                        <div className={`text-lg font-bold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                          {format(day, "d MMM", { locale: fr })}
                        </div>
                      </div>

                      <Droppable droppableId={dateStr} type="TECHNICIEN">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[100px] mb-3 ${snapshot.isDraggingOver ? 'bg-blue-500/10 rounded-lg p-1' : ''}`}
                          >
                            {assignedTechs.map((techId, idx) => {
                              const tech = techniciens.find(t => t.id === techId);
                              if (!tech) return null;
                              return (
                                <Draggable key={techId} draggableId={techId} index={idx} type="TECHNICIEN">
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={snapshot.isDragging ? 'opacity-50' : ''}
                                    >
                                      <div className="bg-blue-500/20 border border-blue-500/30 rounded p-1 mb-1">
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-blue-400" />
                                          <span className="text-white text-xs">{tech.prenom}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <div className="space-y-1">
                        {assignedTechs.map(techId => {
                          const assignments = getAssignmentsForDateAndTech(day, techId);
                          return (
                            <div key={techId}>
                              <Droppable droppableId={`${dateStr}-${techId}`}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[80px] ${snapshot.isDraggingOver ? 'bg-cyan-500/10 rounded-lg p-1' : ''}`}
                                  >
                                    {assignments.map((assignment, index) => (
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
                                            <DossierCard dossier={assignment.dossier} />
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const assignedTechs = technicienAssignments[dateStr] || [];
                  
                  return (
                    <Card 
                      key={dateStr}
                      className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-cyan-500' : ''}`}
                    >
                      <div className="text-center mb-2 pb-2 border-b border-slate-700">
                        <div className="text-slate-400 text-xs">
                          {format(day, "EEE", { locale: fr })}
                        </div>
                        <div className={`text-sm font-bold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                          {format(day, "d", { locale: fr })}
                        </div>
                      </div>

                      <Droppable droppableId={dateStr} type="TECHNICIEN">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[60px] mb-2 ${snapshot.isDraggingOver ? 'bg-blue-500/10 rounded-lg p-1' : ''}`}
                          >
                            {assignedTechs.map((techId, idx) => {
                              const tech = techniciens.find(t => t.id === techId);
                              if (!tech) return null;
                              return (
                                <Draggable key={techId} draggableId={techId} index={idx} type="TECHNICIEN">
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={snapshot.isDragging ? 'opacity-50' : ''}
                                    >
                                      <div className="bg-blue-500/20 border border-blue-500/30 rounded p-1 mb-1">
                                        <div className="flex items-center gap-1">
                                          <Users className="w-3 h-3 text-blue-400" />
                                          <span className="text-white text-xs">{tech.prenom}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <div className="space-y-1">
                        {assignedTechs.map(techId => {
                          const assignments = getAssignmentsForDateAndTech(day, techId);
                          return (
                            <div key={techId}>
                              <Droppable droppableId={`${dateStr}-${techId}`}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[50px] ${snapshot.isDraggingOver ? 'bg-cyan-500/10 rounded-lg p-1' : ''}`}
                                  >
                                    {assignments.map((assignment, index) => (
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
                                            <DossierCard dossier={assignment.dossier} />
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}