import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, CheckCircle, X, Plus, Trash2, Users, Eye, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Certificat de localisation", "Implantation", "Piquetage", "OCTR", "Projet de lotissement"];

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

export default function CeduleTerrain() {
  const [semaineCourante, setSemaineCourante] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [equipes, setEquipes] = useState({
    lundi: ["Équipe 1"],
    mardi: ["Équipe 1"],
    mercredi: ["Équipe 1"],
    jeudi: ["Équipe 1"],
    vendredi: ["Équipe 1"]
  });
  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterTypeMandat, setFilterTypeMandat] = useState("all");
  const [viewingDossier, setViewingDossier] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [newEquipeName, setNewEquipeName] = useState("");

  const queryClient = useQueryClient();

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-date_ouverture'),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
  });

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, dossierData }) => base44.entities.Dossier.update(id, dossierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  const getClientById = (id) => clients.find(c => c.id === id);
  const getLotById = (numeroLot) => lots.find(l => l.numero_lot === numeroLot);

  const applyFilters = (mandats) => {
    return mandats.filter(item => {
      const matchArpenteur = filterArpenteur === "all" || item.dossier.arpenteur_geometre === filterArpenteur;
      const matchType = filterTypeMandat === "all" || item.mandat.type_mandat === filterTypeMandat;
      return matchArpenteur && matchType;
    });
  };

  // Extraire tous les mandats avec la tâche "Cédule"
  const getMandatsEnVerification = () => {
    const mandats = [];
    dossiers.forEach(dossier => {
      if (dossier.mandats) {
        dossier.mandats.forEach((mandat, idx) => {
          if (mandat.tache_actuelle === "Cédule" && (!mandat.statut_terrain || mandat.statut_terrain === "en_verification")) {
            mandats.push({
              dossier,
              mandat,
              mandatIndex: idx,
              id: `${dossier.id}-${idx}`
            });
          }
        });
      }
    });
    return applyFilters(mandats);
  };

  const getMandatsACeduler = () => {
    const mandats = [];
    dossiers.forEach(dossier => {
      if (dossier.mandats) {
        dossier.mandats.forEach((mandat, idx) => {
          if (mandat.tache_actuelle === "Cédule" && mandat.statut_terrain === "a_ceduler" && !mandat.date_terrain) {
            mandats.push({
              dossier,
              mandat,
              mandatIndex: idx,
              id: `${dossier.id}-${idx}`
            });
          }
        });
      }
    });
    return applyFilters(mandats);
  };

  const getMandatsCedules = () => {
    const mandats = {};
    JOURS_SEMAINE.forEach((jour, jourIndex) => {
      const dateJour = format(addDays(semaineCourante, jourIndex), "yyyy-MM-dd");
      mandats[jour.toLowerCase()] = {};
      
      dossiers.forEach(dossier => {
        if (dossier.mandats) {
          dossier.mandats.forEach((mandat, idx) => {
            if (mandat.date_terrain === dateJour && mandat.equipe_assignee) {
              if (!mandats[jour.toLowerCase()][mandat.equipe_assignee]) {
                mandats[jour.toLowerCase()][mandat.equipe_assignee] = [];
              }
              mandats[jour.toLowerCase()][mandat.equipe_assignee].push({
                dossier,
                mandat,
                mandatIndex: idx,
                id: `${dossier.id}-${idx}`
              });
            }
          });
        }
      });
    });
    return mandats;
  };

  const updateMandatStatut = (dossierId, mandatIndex, statut) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    const updatedMandats = [...dossier.mandats];
    updatedMandats[mandatIndex] = {
      ...updatedMandats[mandatIndex],
      statut_terrain: statut
    };

    updateDossierMutation.mutate({
      id: dossierId,
      dossierData: { ...dossier, mandats: updatedMandats }
    });
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const sourceId = result.source.droppableId;
    const destinationId = result.destination.droppableId;

    // Parse destination: format "jour-equipe"
    const destParts = destinationId.split('-');
    const jour = destParts[0];
    const equipe = destParts.slice(1).join('-');
    const jourIndex = JOURS_SEMAINE.findIndex(j => j.toLowerCase() === jour);
    if (jourIndex === -1) return;

    const dateJour = format(addDays(semaineCourante, jourIndex), "yyyy-MM-dd");
    
    // Parse draggable ID: "dossierId-mandatIndex"
    const [dossierId, mandatIndex] = result.draggableId.split('-').slice(0, 2);
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    const updatedMandats = [...dossier.mandats];
    updatedMandats[parseInt(mandatIndex)] = {
      ...updatedMandats[parseInt(mandatIndex)],
      date_terrain: dateJour,
      equipe_assignee: equipe,
      statut_terrain: "a_ceduler"
    };

    updateDossierMutation.mutate({
      id: dossierId,
      dossierData: { ...dossier, mandats: updatedMandats }
    });
  };

  const retirerDuCalendrier = (dossierId, mandatIndex) => {
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    const updatedMandats = [...dossier.mandats];
    updatedMandats[mandatIndex] = {
      ...updatedMandats[mandatIndex],
      date_terrain: null,
      equipe_assignee: null
    };

    updateDossierMutation.mutate({
      id: dossierId,
      dossierData: { ...dossier, mandats: updatedMandats }
    });
  };

  const ajouterEquipe = (jour) => {
    const jourKey = jour.toLowerCase();
    const nouvelleEquipe = `Équipe ${equipes[jourKey].length + 1}`;
    setEquipes(prev => ({
      ...prev,
      [jourKey]: [...prev[jourKey], nouvelleEquipe]
    }));
  };

  const supprimerEquipe = (jour, equipe) => {
    const jourKey = jour.toLowerCase();
    if (equipes[jourKey].length <= 1) return;
    
    const mandatsCedules = getMandatsCedules();
    const equipeMandats = mandatsCedules[jourKey]?.[equipe] || [];
    
    if (equipeMandats.length > 0) {
      alert("Impossible de supprimer cette équipe car elle contient déjà des mandats planifiés. Veuillez d'abord retirer les mandats de cette équipe.");
      return;
    }
    
    setEquipes(prev => ({
      ...prev,
      [jourKey]: prev[jourKey].filter(e => e !== equipe)
    }));
  };

  const renameEquipe = (jour, oldName, newName) => {
    if (!newName || newName.trim() === "" || oldName === newName) {
      setEditingEquipe(null);
      setNewEquipeName("");
      return;
    }
    
    const jourKey = jour.toLowerCase();
    
    if (equipes[jourKey].includes(newName)) {
      alert("Ce nom d'équipe existe déjà pour cette journée.");
      setEditingEquipe(null);
      setNewEquipeName("");
      return;
    }
    
    setEquipes(prev => ({
      ...prev,
      [jourKey]: prev[jourKey].map(e => e === oldName ? newName : e)
    }));
    
    dossiers.forEach(dossier => {
      let needsUpdate = false;
      const updatedMandats = dossier.mandats?.map(mandat => {
        if (mandat.equipe_assignee === oldName && mandat.date_terrain) {
          needsUpdate = true;
          return { ...mandat, equipe_assignee: newName };
        }
        return mandat;
      });
      
      if (needsUpdate) {
        updateDossierMutation.mutate({
          id: dossier.id,
          dossierData: { ...dossier, mandats: updatedMandats }
        });
      }
    });
    
    setEditingEquipe(null);
    setNewEquipeName("");
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

  const handleViewDossier = (item) => {
    setViewingDossier(item.dossier);
    setIsViewDialogOpen(true);
  };

  const mandatsEnVerification = getMandatsEnVerification();
  const mandatsACeduler = getMandatsACeduler();
  const mandatsCedules = getMandatsCedules();

  const MandatCard = ({ item, showActions = true, isDragging = false }) => (
    <Card className={`border-slate-700 ${isDragging ? 'bg-slate-700' : 'bg-slate-800/50'} hover:bg-slate-800 transition-colors cursor-pointer`}
      onClick={() => !isDragging && handleViewDossier(item)}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-emerald-400 text-sm">
              {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
            </h4>
            <Badge className="mt-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
              {item.mandat.type_mandat}
            </Badge>
          </div>
        </div>
        
        {item.mandat.adresse_travaux && formatAdresse(item.mandat.adresse_travaux) && (
          <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{formatAdresse(item.mandat.adresse_travaux)}</span>
          </p>
        )}

        {item.mandat.terrain && (
          <div className="mt-3 space-y-1.5 border-t border-slate-700 pt-2">
            {item.mandat.terrain.date_limite_leve && (
              <div className="text-xs">
                <span className="text-slate-500">Date limite: </span>
                <span className="text-slate-300">{format(new Date(item.mandat.terrain.date_limite_leve), "dd MMM yyyy", { locale: fr })}</span>
              </div>
            )}
            {item.mandat.terrain.instruments_requis && (
              <div className="text-xs">
                <span className="text-slate-500">Instruments: </span>
                <span className="text-slate-300">{item.mandat.terrain.instruments_requis}</span>
              </div>
            )}
            {item.mandat.terrain.a_rendez_vous && (
              <div className="text-xs">
                <span className="text-slate-500">RDV: </span>
                <span className="text-emerald-400">
                  {item.mandat.terrain.date_rendez_vous && format(new Date(item.mandat.terrain.date_rendez_vous), "dd MMM", { locale: fr })}
                  {item.mandat.terrain.heure_rendez_vous && ` à ${item.mandat.terrain.heure_rendez_vous}`}
                </span>
              </div>
            )}
            {item.mandat.terrain.donneur && (
              <div className="text-xs">
                <span className="text-slate-500">Donneur: </span>
                <span className="text-slate-300">{item.mandat.terrain.donneur}</span>
              </div>
            )}
            {item.mandat.terrain.technicien && (
              <div className="text-xs">
                <span className="text-slate-500">Technicien: </span>
                <span className="text-cyan-400">{item.mandat.terrain.technicien}</span>
              </div>
            )}
            {item.mandat.terrain.dossier_simultane && (
              <div className="text-xs">
                <span className="text-slate-500">Dossier simultané: </span>
                <span className="text-purple-400">{item.mandat.terrain.dossier_simultane}</span>
              </div>
            )}
            {item.mandat.terrain.temps_prevu && (
              <div className="text-xs">
                <span className="text-slate-500">Temps prévu: </span>
                <span className="text-slate-300">{item.mandat.terrain.temps_prevu}</span>
              </div>
            )}
            {item.mandat.terrain.notes && (
              <div className="text-xs mt-2">
                <span className="text-slate-500">Notes: </span>
                <p className="text-slate-300 mt-0.5 line-clamp-2">{item.mandat.terrain.notes}</p>
              </div>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              onClick={() => updateMandatStatut(item.dossier.id, item.mandatIndex, "a_ceduler")}
              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs h-8 p-0"
              title="Marquer à céduler"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={() => updateMandatStatut(item.dossier.id, item.mandatIndex, "pas_de_terrain")}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white text-xs h-8 p-0"
              title="Pas de terrain"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <TooltipProvider>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Cédule Terrain
                </h1>
                <p className="text-slate-400">Planification des travaux sur le terrain</p>
              </div>
            </div>

            {/* Filtres */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
              <CardContent className="p-4">
                <div className="flex gap-3 items-center">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <Select value={filterArpenteur} onValueChange={setFilterArpenteur}>
                    <SelectTrigger className="w-52 bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Arpenteur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                      {ARPENTEURS.map(arp => (
                        <SelectItem key={arp} value={arp} className="text-white">{arp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterTypeMandat} onValueChange={setFilterTypeMandat}>
                    <SelectTrigger className="w-52 bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                      {TYPES_MANDATS.map(type => (
                        <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(filterArpenteur !== "all" || filterTypeMandat !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterArpenteur("all");
                        setFilterTypeMandat("all");
                      }}
                      className="bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mandats à vérifier et à céduler - Horizontal */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* En vérification */}
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-yellow-400" />
                      En vérification
                    </CardTitle>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                      {mandatsEnVerification.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Droppable droppableId="verification" isDropDisabled={true} direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex gap-3 overflow-x-auto pb-2"
                        style={{ minHeight: '150px' }}
                      >
                        {mandatsEnVerification.length > 0 ? (
                          mandatsEnVerification.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={true}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex-shrink-0"
                                  style={{ width: '280px' }}
                                >
                                  <MandatCard item={item} showActions={true} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-500">
                            <div className="text-center">
                              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">Aucun mandat en vérification</p>
                            </div>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>

              {/* À céduler */}
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      À céduler
                    </CardTitle>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                      {mandatsACeduler.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <Droppable droppableId="a-ceduler" isDropDisabled={true} direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex gap-3 overflow-x-auto pb-2"
                        style={{ minHeight: '150px' }}
                      >
                        {mandatsACeduler.length > 0 ? (
                          mandatsACeduler.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex-shrink-0"
                                  style={{ width: '280px' }}
                                >
                                  <MandatCard item={item} showActions={false} isDragging={snapshot.isDragging} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-slate-500">
                            <div className="text-center">
                              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">Aucun mandat à céduler</p>
                            </div>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>

            {/* Calendrier hebdomadaire - Pleine largeur */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    Semaine du {format(semaineCourante, "d MMMM yyyy", { locale: fr })}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSemaineCourante(addDays(semaineCourante, -7))}
                    >
                      ← Précédent
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setSemaineCourante(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                      className="bg-emerald-500/20 text-emerald-400"
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSemaineCourante(addDays(semaineCourante, 7))}
                    >
                      Suivant →
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-3">
                  {JOURS_SEMAINE.map((jour, jourIndex) => {
                    const dateJour = addDays(semaineCourante, jourIndex);
                    const jourKey = jour.toLowerCase();
                    
                    return (
                      <div key={jour} className="space-y-2">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h3 className="font-semibold text-white text-sm">{jour}</h3>
                              <p className="text-xs text-slate-400">
                                {format(dateJour, "d MMM", { locale: fr })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => ajouterEquipe(jour)}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {equipes[jourKey]?.map((equipe) => (
                            <div key={equipe} className="bg-slate-800/30 rounded-lg p-2 border border-slate-700/50">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-1 flex-1">
                                  <Users className="w-3 h-3 text-cyan-400" />
                                  {editingEquipe === `${jour}-${equipe}` ? (
                                    <Input
                                      value={newEquipeName}
                                      onChange={(e) => setNewEquipeName(e.target.value)}
                                      onBlur={() => renameEquipe(jour, equipe, newEquipeName)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          renameEquipe(jour, equipe, newEquipeName);
                                        } else if (e.key === 'Escape') {
                                          setEditingEquipe(null);
                                          setNewEquipeName("");
                                        }
                                      }}
                                      autoFocus
                                      className="bg-slate-700 border-slate-600 text-white h-6 text-xs px-2"
                                    />
                                  ) : (
                                    <span 
                                      className="text-xs font-medium text-cyan-400 cursor-pointer hover:text-cyan-300"
                                      onClick={() => {
                                        setEditingEquipe(`${jour}-${equipe}`);
                                        setNewEquipeName(equipe);
                                      }}
                                    >
                                      {equipe}
                                    </span>
                                  )}
                                </div>
                                {equipes[jourKey].length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => supprimerEquipe(jour, equipe)}
                                    className="h-5 w-5 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>

                              <Droppable droppableId={`${jourKey}-${equipe}`}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[100px] space-y-2 rounded p-2 transition-colors ${
                                      snapshot.isDraggingOver ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-900/30'
                                    }`}
                                  >
                                    {mandatsCedules[jourKey]?.[equipe]?.map((item, index) => (
                                      <Draggable key={item.id} draggableId={item.id} index={index}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                          >
                                            <div className="relative">
                                              <MandatCard item={item} showActions={false} isDragging={snapshot.isDragging} />
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  retirerDuCalendrier(item.dossier.id, item.mandatIndex);
                                                }}
                                                className="absolute top-1 right-1 h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                              >
                                                <X className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* View Dossier Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Dossier {viewingDossier ? `${getArpenteurInitials(viewingDossier.arpenteur_geometre)}${viewingDossier.numero_dossier}` : ''}
            </DialogTitle>
          </DialogHeader>
          {viewingDossier && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-400">N° de dossier</Label>
                  <p className="text-white font-medium">{viewingDossier.numero_dossier}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Arpenteur-géomètre</Label>
                  <p className="text-white font-medium">{viewingDossier.arpenteur_geometre}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Date d'ouverture</Label>
                  <p className="text-white font-medium">
                    {format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-slate-400">Statut</Label>
                <Badge className={`mt-2 ${viewingDossier.statut === 'Ouvert' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} border`}>
                  {viewingDossier.statut || "Ouvert"}
                </Badge>
              </div>

              {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                <div>
                  <Label className="text-slate-400 mb-2 block">Clients</Label>
                  <div className="flex flex-wrap gap-2">
                    {viewingDossier.clients_ids.map(id => {
                      const client = getClientById(id);
                      return client ? (
                        <Badge key={id} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                          {client.prenom} {client.nom}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {viewingDossier.description && (
                <div>
                  <Label className="text-slate-400 mb-2 block">Description</Label>
                  <p className="text-slate-300 whitespace-pre-wrap">{viewingDossier.description}</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-700">
                <Button onClick={() => setIsViewDialogOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </DragDropContext>
    </TooltipProvider>
  );
}