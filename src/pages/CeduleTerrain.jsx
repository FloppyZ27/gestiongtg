
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
import { MapPin, Calendar, CheckCircle, X, Plus, Trash2, Users, Eye, Filter, Search, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

const getUserInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
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
  const [searchTerm, setSearchTerm] = useState("");
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

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
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

  const applyFilters = (mandats) => {
    return mandats.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const fullNumber = getArpenteurInitials(item.dossier.arpenteur_geometre) + item.dossier.numero_dossier;
      const clientsNames = getClientsNames(item.dossier.clients_ids);

      const matchesSearch = (
        fullNumber.toLowerCase().includes(searchLower) ||
        item.dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
        clientsNames.toLowerCase().includes(searchLower) ||
        item.mandat.type_mandat?.toLowerCase().includes(searchLower)
      );

      const matchArpenteur = filterArpenteur === "all" || item.dossier.arpenteur_geometre === filterArpenteur;
      const matchType = filterTypeMandat === "all" || item.mandat.type_mandat === filterTypeMandat;
      return matchesSearch && matchArpenteur && matchType;
    });
  };

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

    const destParts = destinationId.split('-');
    const jour = destParts[0];
    const equipe = destParts.slice(1).join('-');
    const jourIndex = JOURS_SEMAINE.findIndex(j => j.toLowerCase() === jour);
    if (jourIndex === -1) return;

    const dateJour = format(addDays(semaineCourante, jourIndex), "yyyy-MM-dd");
    
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

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "";
    }).filter(name => name).join(", ");
  };

  const handleViewDossier = (item) => {
    setViewingDossier(item.dossier);
    setIsViewDialogOpen(true);
  };

  const mandatsEnVerification = getMandatsEnVerification();
  const mandatsACeduler = getMandatsACeduler();
  const mandatsCedules = getMandatsCedules();

  const MandatCard = ({ item, showActions = true, isDragging = false }) => {
    const assignedUser = users.find(u => u.email === item.mandat.utilisateur_assigne);
    
    return (
      <Card 
        className={`border-slate-700 ${isDragging ? 'bg-slate-700' : 'bg-slate-800/80'} hover:bg-slate-800 transition-colors cursor-pointer`}
        onClick={() => !isDragging && handleViewDossier(item)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="text-center pb-2 border-b border-slate-700">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-sm font-semibold">
              {item.mandat.type_mandat}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">Dossier</p>
              <Badge variant="outline" className={`${getArpenteurColor(item.dossier.arpenteur_geometre)} border text-xs w-full justify-center`}>
                {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Clients</p>
              <p className="text-xs text-slate-300 font-medium truncate">
                {getClientsNames(item.dossier.clients_ids)}
              </p>
            </div>
          </div>

          {item.mandat.adresse_travaux && formatAdresse(item.mandat.adresse_travaux) && (
            <div className="pt-1">
              <p className="text-xs text-slate-500 mb-1">Adresse</p>
              <div className="flex items-start gap-1 text-xs text-slate-300">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{formatAdresse(item.mandat.adresse_travaux)}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            {item.mandat.date_livraison ? (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(item.mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-600">Pas de date</div>
            )}

            {assignedUser ? (
              <Avatar className="w-7 h-7 border-2 border-slate-600">
                <AvatarImage src={assignedUser.photo_url} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  {getUserInitials(assignedUser.full_name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2 border-t border-slate-700" onClick={(e) => e.stopPropagation()}>
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
  };

  return (
    <TooltipProvider>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-emerald-400" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Cédule Terrain
                </h1>
                <p className="text-slate-400">Planification des travaux sur le terrain</p>
              </div>
            </div>

            {/* Mandats à vérifier et à céduler avec onglets */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
              <CardHeader className="border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher un dossier, client..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
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
                  {(searchTerm || filterArpenteur !== "all" || filterTypeMandat !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterArpenteur("all");
                        setFilterTypeMandat("all");
                      }}
                      className="bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white"
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="verification" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 h-auto mb-4">
                    <TabsTrigger value="verification" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 py-3 text-base">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      En vérification
                      <Badge className="ml-2 bg-slate-700 text-white">
                        {mandatsEnVerification.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="a-ceduler" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-3 text-base">
                      <Calendar className="w-4 h-4 mr-2" />
                      À céduler
                      <Badge className="ml-2 bg-slate-700 text-white">
                        {mandatsACeduler.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="verification" className="mt-0">
                    <Droppable droppableId="verification" isDropDisabled={true} direction="horizontal">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex gap-3 overflow-x-auto pb-2"
                          style={{ minHeight: '200px' }}
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
                  </TabsContent>

                  <TabsContent value="a-ceduler" className="mt-0">
                    <Droppable droppableId="a-ceduler" isDropDisabled={true} direction="horizontal">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex gap-3 overflow-x-auto pb-2"
                          style={{ minHeight: '200px' }}
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
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

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
