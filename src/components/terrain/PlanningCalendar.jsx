import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Users, Truck, Wrench, FolderOpen, Plus, Edit, Trash2, X } from "lucide-react";
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
  onUpdateDossier,
  onAddTechnicien,
  onAddVehicule,
  onAddEquipement,
  onEditTechnicien,
  onDeleteTechnicien,
  onEditVehicule,
  onDeleteVehicule,
  onEditEquipement,
  onDeleteEquipement
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week or month
  const [assignments, setAssignments] = useState({});
  const [equipes, setEquipes] = useState({}); // { "date": [{ id, nom, techniciens: [], vehicules: [], equipements: [], mandats: [] }] }
  const [activeResourceTab, setActiveResourceTab] = useState("mandats");

  // Charger les équipes depuis localStorage au démarrage
  useEffect(() => {
    const savedEquipes = localStorage.getItem('planning_equipes');
    if (savedEquipes) {
      try {
        setEquipes(JSON.parse(savedEquipes));
      } catch (e) {
        console.error('Erreur lors du chargement des équipes:', e);
      }
    }
  }, []);

  // Sauvegarder les équipes dans localStorage à chaque modification
  useEffect(() => {
    if (Object.keys(equipes).length > 0) {
      localStorage.setItem('planning_equipes', JSON.stringify(equipes));
    }
  }, [equipes]);

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

  const addEquipe = (dateStr) => {
    const newEquipes = { ...equipes };
    if (!newEquipes[dateStr]) {
      newEquipes[dateStr] = [];
    }
    const newEquipe = {
      id: `eq${Date.now()}`,
      nom: `Équipe ${newEquipes[dateStr].length + 1}`,
      techniciens: [],
      vehicules: [],
      equipements: [],
      mandats: []
    };
    newEquipes[dateStr].push(newEquipe);
    setEquipes(newEquipes);
  };

  const removeEquipe = (dateStr, equipeId) => {
    const newEquipes = { ...equipes };
    if (newEquipes[dateStr]) {
      newEquipes[dateStr] = newEquipes[dateStr].filter(e => e.id !== equipeId);
      if (newEquipes[dateStr].length === 0) {
        delete newEquipes[dateStr];
      }
    }
    setEquipes(newEquipes);
  };

  const removeFromEquipe = (dateStr, equipeId, type, itemId) => {
    const newEquipes = { ...equipes };
    if (newEquipes[dateStr]) {
      const equipe = newEquipes[dateStr].find(e => e.id === equipeId);
      if (equipe) {
        equipe[type] = equipe[type].filter(id => id !== itemId);
      }
    }
    setEquipes(newEquipes);
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // Format: "equipe-dateStr-equipeId-type"
    const parseEquipeDroppableId = (id) => {
      if (!id.startsWith('equipe-')) return null;
      const parts = id.split('-');
      // equipe-yyyy-MM-dd-equipeId-type
      return {
        dateStr: `${parts[1]}-${parts[2]}-${parts[3]}`,
        equipeId: parts[4],
        type: parts[5]
      };
    };

    // Vérifier si une ressource est déjà utilisée dans une autre équipe de la même journée
    const isResourceUsedInDay = (dateStr, resourceId, resourceType, excludeEquipeId) => {
      if (!equipes[dateStr]) return false;
      return equipes[dateStr].some(eq => {
        if (eq.id === excludeEquipeId) return false;
        return eq[resourceType].includes(resourceId);
      });
    };

    // Drag & drop de technicien
    if (type === "TECHNICIEN") {
      const dest = parseEquipeDroppableId(destId);
      if (!dest || destId === "techniciens-list") return;

      // Vérifier si le technicien est déjà utilisé dans une autre équipe de la même journée
      if (isResourceUsedInDay(dest.dateStr, draggableId, 'techniciens', dest.equipeId)) {
        alert('Ce technicien est déjà assigné à une autre équipe ce jour-là.');
        return;
      }

      const newEquipes = { ...equipes };
      if (!newEquipes[dest.dateStr]) return;
      
      const equipe = newEquipes[dest.dateStr].find(e => e.id === dest.equipeId);
      if (!equipe) return;

      // Retirer du source si applicable
      const sourceParsed = parseEquipeDroppableId(sourceId);
      if (sourceParsed && sourceId !== "techniciens-list") {
        const sourceEquipe = newEquipes[sourceParsed.dateStr]?.find(e => e.id === sourceParsed.equipeId);
        if (sourceEquipe) {
          sourceEquipe.techniciens = sourceEquipe.techniciens.filter(id => id !== draggableId);
        }
      }

      // Ajouter à la destination
      if (!equipe.techniciens.includes(draggableId)) {
        equipe.techniciens.push(draggableId);
      }

      setEquipes(newEquipes);
      return;
    }
    
    // Drag & drop de véhicule
    if (type === "VEHICULE") {
      const dest = parseEquipeDroppableId(destId);
      if (!dest || destId === "vehicules-list") return;

      // Vérifier si le véhicule est déjà utilisé dans une autre équipe de la même journée
      if (isResourceUsedInDay(dest.dateStr, draggableId, 'vehicules', dest.equipeId)) {
        alert('Ce véhicule est déjà assigné à une autre équipe ce jour-là.');
        return;
      }

      const newEquipes = { ...equipes };
      if (!newEquipes[dest.dateStr]) return;
      
      const equipe = newEquipes[dest.dateStr].find(e => e.id === dest.equipeId);
      if (!equipe) return;

      const sourceVehicule = parseEquipeDroppableId(sourceId);
      if (sourceVehicule && sourceId !== "vehicules-list") {
        const sourceEquipe = newEquipes[sourceVehicule.dateStr]?.find(e => e.id === sourceVehicule.equipeId);
        if (sourceEquipe) {
          sourceEquipe.vehicules = sourceEquipe.vehicules.filter(id => id !== draggableId);
        }
      }

      if (!equipe.vehicules.includes(draggableId)) {
        equipe.vehicules.push(draggableId);
      }

      setEquipes(newEquipes);
      return;
    }
    
    // Drag & drop d'équipement
    if (type === "EQUIPEMENT") {
      const dest = parseEquipeDroppableId(destId);
      if (!dest || destId === "equipements-list") return;

      // Vérifier si l'équipement est déjà utilisé dans une autre équipe de la même journée
      if (isResourceUsedInDay(dest.dateStr, draggableId, 'equipements', dest.equipeId)) {
        alert('Cet équipement est déjà assigné à une autre équipe ce jour-là.');
        return;
      }

      const newEquipes = { ...equipes };
      if (!newEquipes[dest.dateStr]) return;
      
      const equipe = newEquipes[dest.dateStr].find(e => e.id === dest.equipeId);
      if (!equipe) return;

      const sourceEquipement = parseEquipeDroppableId(sourceId);
      if (sourceEquipement && sourceId !== "equipements-list") {
        const sourceEquipe = newEquipes[sourceEquipement.dateStr]?.find(e => e.id === sourceEquipement.equipeId);
        if (sourceEquipe) {
          sourceEquipe.equipements = sourceEquipe.equipements.filter(id => id !== draggableId);
        }
      }

      if (!equipe.equipements.includes(draggableId)) {
        equipe.equipements.push(draggableId);
      }

      setEquipes(newEquipes);
      return;
    }

    // Drag & drop de mandat
    const dest = parseEquipeDroppableId(destId);
    if (!dest) {
      // Si pas vers une équipe, peut-être vers unassigned
      if (destId === "unassigned") {
        // Retirer des équipes
        const newEquipes = { ...equipes };
        Object.keys(newEquipes).forEach(dateStr => {
          newEquipes[dateStr].forEach(equipe => {
            equipe.mandats = equipe.mandats.filter(id => id !== draggableId);
          });
        });
        setEquipes(newEquipes);
      }
      return;
    }

    const newEquipes = { ...equipes };
    if (!newEquipes[dest.dateStr]) return;
    
    const equipe = newEquipes[dest.dateStr].find(e => e.id === dest.equipeId);
    if (!equipe) return;

    // Retirer du source
    const sourceMandat = parseEquipeDroppableId(sourceId);
    if (sourceMandat && sourceId !== "unassigned") {
      const sourceEquipe = newEquipes[sourceMandat.dateStr]?.find(e => e.id === sourceMandat.equipeId);
      if (sourceEquipe) {
        sourceEquipe.mandats = sourceEquipe.mandats.filter(id => id !== draggableId);
      }
    }

    // Ajouter à la destination
    if (!equipe.mandats.includes(draggableId)) {
      equipe.mandats.push(draggableId);
    }

    setEquipes(newEquipes);
  };

  const unassignedDossiers = dossiers.filter(d => {
    const isAssignedInEquipe = Object.values(equipes).some(dayEquipes => 
      dayEquipes.some(equipe => equipe.mandats.includes(d.id))
    );
    return !isAssignedInEquipe;
  });

  const DossierCard = ({ dossier }) => {
    const mandat = dossier.mandats?.find(m => m.tache_actuelle === "Cédule");
    
    return (
      <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border-2 border-emerald-500/50 rounded-lg p-3 mb-2 hover:shadow-lg hover:shadow-emerald-500/20 transition-all hover:scale-[1.02]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-sm font-semibold`}>
            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
          </Badge>
          {mandat && (
            <Badge className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-sm font-semibold">
              {mandat.type_mandat}
            </Badge>
          )}
        </div>
        <p className="text-white text-sm font-medium mb-1 line-clamp-1">
          {getClientsNames(dossier.clients_ids)}
        </p>
        <p className="text-emerald-300 text-xs line-clamp-1">
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
                <Tabs defaultValue="verification" className="w-full">
                  <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-2 mb-3">
                    <TabsTrigger value="verification" className="data-[state=active]:bg-slate-700">
                      En vérification
                    </TabsTrigger>
                    <TabsTrigger value="planifier" className="data-[state=active]:bg-slate-700">
                      À planifier
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="verification" className="mt-0">
                    <h3 className="text-white font-semibold mb-3 text-sm">
                      En vérification ({unassignedDossiers.filter(d => {
                        const mandat = d.mandats?.find(m => m.tache_actuelle === "Cédule");
                        return !mandat?.statut_terrain || mandat?.statut_terrain === "en_verification";
                      }).length})
                    </h3>
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto">
                      {unassignedDossiers
                        .filter(d => {
                          const mandat = d.mandats?.find(m => m.tache_actuelle === "Cédule");
                          return !mandat?.statut_terrain || mandat?.statut_terrain === "en_verification";
                        })
                        .map((dossier) => {
                          const mandat = dossier.mandats?.find(m => m.tache_actuelle === "Cédule");
                          return (
                            <div key={dossier.id} className="mb-2">
                              <div className="bg-slate-800 border border-slate-700 rounded-lg p-2">
                                <div className="flex items-start justify-between gap-2 mb-2">
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
                                <p className="text-slate-500 text-xs line-clamp-1 mb-2">
                                  {formatAdresse(mandat?.adresse_travaux)}
                                </p>
                                <div className="flex gap-2 pt-2 border-t border-slate-700">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const updatedMandats = dossier.mandats.map(m => {
                                        if (m.tache_actuelle === "Cédule") {
                                          return { ...m, statut_terrain: "a_ceduler" };
                                        }
                                        return m;
                                      });
                                      onUpdateDossier(dossier.id, { ...dossier, mandats: updatedMandats });
                                    }}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs h-7"
                                  >
                                    Oui, terrain requis
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const updatedMandats = dossier.mandats.map(m => {
                                        if (m.tache_actuelle === "Cédule") {
                                          return { ...m, statut_terrain: "pas_de_terrain" };
                                        }
                                        return m;
                                      });
                                      onUpdateDossier(dossier.id, { ...dossier, mandats: updatedMandats });
                                    }}
                                    className="flex-1 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 text-xs h-7"
                                  >
                                    Non
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </TabsContent>

                  <TabsContent value="planifier" className="mt-0">
                    <h3 className="text-white font-semibold mb-3 text-sm">
                      À planifier ({unassignedDossiers.filter(d => {
                        const mandat = d.mandats?.find(m => m.tache_actuelle === "Cédule");
                        return mandat?.statut_terrain === "a_ceduler";
                      }).length})
                    </h3>
                    <Droppable droppableId="unassigned">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto ${snapshot.isDraggingOver ? 'bg-slate-800/50 rounded-lg' : ''}`}
                        >
                          {unassignedDossiers
                            .filter(d => {
                              const mandat = d.mandats?.find(m => m.tache_actuelle === "Cédule");
                              return mandat?.statut_terrain === "a_ceduler";
                            })
                            .map((dossier, index) => (
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
                </Tabs>
              </TabsContent>

              <TabsContent value="techniciens" className="mt-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold text-sm">
                    Techniciens ({techniciens.length})
                  </h3>
                  <Button 
                    onClick={onAddTechnicien} 
                    size="sm" 
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
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
                              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2 hover:bg-blue-500/30 transition-colors group">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 cursor-move flex-1">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-white text-sm font-medium">
                                      {tech.prenom} {tech.nom}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditTechnicien(tech);
                                      }}
                                      className="text-cyan-400 hover:text-cyan-300 p-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTechnicien(tech.id);
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
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
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold text-sm">
                    Véhicules ({vehicules.length})
                  </h3>
                  <Button 
                    onClick={onAddVehicule} 
                    size="sm" 
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
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
                              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-2 hover:bg-purple-500/30 transition-colors group">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 cursor-move flex-1">
                                    <Truck className="w-4 h-4 text-purple-400" />
                                    <span className="text-white text-sm font-medium">
                                      {vehicule.nom}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditVehicule(vehicule);
                                      }}
                                      className="text-cyan-400 hover:text-cyan-300 p-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteVehicule(vehicule.id);
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
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
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold text-sm">
                    Équipements ({equipements.length})
                  </h3>
                  <Button 
                    onClick={onAddEquipement} 
                    size="sm" 
                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Ajouter
                  </Button>
                </div>
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
                              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 hover:bg-orange-500/30 transition-colors group">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 cursor-move flex-1">
                                    <Wrench className="w-4 h-4 text-orange-400" />
                                    <span className="text-white text-sm font-medium">
                                      {equipement.nom}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditEquipement(equipement);
                                      }}
                                      className="text-cyan-400 hover:text-cyan-300 p-1"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteEquipement(equipement.id);
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
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
                  const dayEquipes = equipes[dateStr] || [];

                  return (
                    <Card 
                      key={dateStr}
                      className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-cyan-500' : ''}`}
                    >
                      <div className="text-center mb-2 pb-2 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-slate-400 text-xs">
                            {format(day, "EEE", { locale: fr })}
                          </div>
                          <div className={`text-lg font-bold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                            {format(day, "d MMM", { locale: fr })}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addEquipe(dateStr)}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 h-6 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {dayEquipes.map((equipe) => (
                          <div key={equipe.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-700">
                              <span className="text-white text-xs font-semibold">{equipe.nom}</span>
                              <button
                                onClick={() => removeEquipe(dateStr, equipe.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Techniciens */}
                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-techniciens`} type="TECHNICIEN">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`min-h-[40px] mb-2 p-1 rounded ${snapshot.isDraggingOver ? 'bg-blue-500/20 border-2 border-blue-500' : 'border border-slate-700'}`}
                                >
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                    {equipe.techniciens.map(techId => {
                                      const tech = techniciens.find(t => t.id === techId);
                                      if (!tech) return null;
                                      return (
                                        <div key={techId} className="bg-blue-500/20 border border-blue-500/30 rounded px-1.5 py-0.5 group flex items-center gap-1">
                                          <span className="text-white text-xs">{tech.prenom} {tech.nom}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeFromEquipe(dateStr, equipe.id, 'techniciens', techId);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            {/* Véhicules */}
                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-vehicules`} type="VEHICULE">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`min-h-[40px] mb-2 p-1 rounded ${snapshot.isDraggingOver ? 'bg-purple-500/20 border-2 border-purple-500' : 'border border-slate-700'}`}
                                >
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Truck className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                    {equipe.vehicules.map(vId => {
                                      const v = vehicules.find(v => v.id === vId);
                                      if (!v) return null;
                                      return (
                                        <div key={vId} className="bg-purple-500/20 border border-purple-500/30 rounded px-1.5 py-0.5 group flex items-center gap-1">
                                          <span className="text-white text-xs">{v.nom}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeFromEquipe(dateStr, equipe.id, 'vehicules', vId);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            {/* Équipements */}
                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-equipements`} type="EQUIPEMENT">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`min-h-[40px] mb-2 p-1 rounded ${snapshot.isDraggingOver ? 'bg-orange-500/20 border-2 border-orange-500' : 'border border-slate-700'}`}
                                >
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Wrench className="w-3 h-3 text-orange-400 flex-shrink-0" />
                                    {equipe.equipements.map(eId => {
                                      const e = equipements.find(e => e.id === eId);
                                      if (!e) return null;
                                      return (
                                        <div key={eId} className="bg-orange-500/20 border border-orange-500/30 rounded px-1.5 py-0.5 group flex items-center gap-1">
                                          <span className="text-white text-xs">{e.nom}</span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeFromEquipe(dateStr, equipe.id, 'equipements', eId);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            {/* Mandats */}
                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-mandats`}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`min-h-[50px] ${snapshot.isDraggingOver ? 'bg-cyan-500/10 rounded p-1' : ''}`}
                                >
                                  <div className="flex items-center gap-1 mb-1">
                                    <FolderOpen className="w-3 h-3 text-cyan-400" />
                                  </div>
                                  {equipe.mandats.map((dossierId, index) => {
                                    const dossier = dossiers.find(d => d.id === dossierId);
                                    if (!dossier) return null;
                                    return (
                                      <Draggable key={dossierId} draggableId={dossierId} index={index}>
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
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        ))}
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
                  const dayEquipes = equipes[dateStr] || [];

                  return (
                    <Card 
                      key={dateStr}
                      className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-cyan-500' : ''}`}
                    >
                      <div className="text-center mb-2 pb-2 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-slate-400 text-xs">
                            {format(day, "EEE", { locale: fr })}
                          </div>
                          <div className={`text-sm font-bold ${isToday ? 'text-cyan-400' : 'text-white'}`}>
                            {format(day, "d", { locale: fr })}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addEquipe(dateStr)}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 h-5 px-1"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {dayEquipes.map((equipe) => (
                          <div key={equipe.id} className="bg-slate-800/50 border border-slate-700 rounded p-1 text-xs">
                            <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-700">
                              <span className="text-white font-semibold text-xs">{equipe.nom}</span>
                              <button
                                onClick={() => removeEquipe(dateStr, equipe.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-techniciens`} type="TECHNICIEN">
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={`mb-1 p-1 rounded min-h-[24px] ${snapshot.isDraggingOver ? 'bg-blue-500/20 border border-blue-500' : 'border border-slate-700'}`}>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Users className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                    {equipe.techniciens.map(techId => {
                                      const tech = techniciens.find(t => t.id === techId);
                                      return tech ? (
                                        <div key={techId} className="bg-blue-500/20 border border-blue-500/30 rounded px-1 text-xs text-white">{tech.prenom}</div>
                                      ) : null;
                                    })}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-vehicules`} type="VEHICULE">
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={`mb-1 p-1 rounded min-h-[24px] ${snapshot.isDraggingOver ? 'bg-purple-500/20 border border-purple-500' : 'border border-slate-700'}`}>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Truck className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                    {equipe.vehicules.map(vId => {
                                      const v = vehicules.find(v => v.id === vId);
                                      return v ? (
                                        <div key={vId} className="bg-purple-500/20 border border-purple-500/30 rounded px-1 text-xs text-white">{v.nom}</div>
                                      ) : null;
                                    })}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-equipements`} type="EQUIPEMENT">
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className={`mb-1 p-1 rounded min-h-[24px] ${snapshot.isDraggingOver ? 'bg-orange-500/20 border border-orange-500' : 'border border-slate-700'}`}>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Wrench className="w-3 h-3 text-orange-400 flex-shrink-0" />
                                    {equipe.equipements.map(eId => {
                                      const e = equipements.find(e => e.id === eId);
                                      return e ? (
                                        <div key={eId} className="bg-orange-500/20 border border-orange-500/30 rounded px-1 text-xs text-white">{e.nom}</div>
                                      ) : null;
                                    })}
                                  </div>
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>

                            <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-mandats`}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[30px]">
                                  {equipe.mandats.map((dId, idx) => {
                                    const d = dossiers.find(d => d.id === dId);
                                    return d ? (
                                      <Draggable key={dId} draggableId={dId} index={idx}>
                                        {(provided) => (
                                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                            <DossierCard dossier={d} />
                                          </div>
                                        )}
                                      </Draggable>
                                    ) : null;
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        ))}
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