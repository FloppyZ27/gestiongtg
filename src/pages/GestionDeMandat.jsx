import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Kanban, User, MapPin, Calendar, Edit, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

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

export default function GestionDeMandat() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterTypeMandat, setFilterTypeMandat] = useState("all");
  const [filterUtilisateur, setFilterUtilisateur] = useState("all");
  const [viewingDossier, setViewingDossier] = useState(null);
  const [viewingMandatIndex, setViewingMandatIndex] = useState(null);

  const queryClient = useQueryClient();

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
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

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, dossierData }) => base44.entities.Dossier.update(id, dossierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
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

  // Préparer les cartes de mandats
  const getMandatsCards = () => {
    const cards = [];
    
    dossiers
      .filter(d => d.statut === "Ouvert" || d.statut === "Fermé")
      .forEach(dossier => {
        if (dossier.mandats && dossier.mandats.length > 0) {
          dossier.mandats.forEach((mandat, mandatIndex) => {
            cards.push({
              id: `${dossier.id}-${mandatIndex}`,
              dossierId: dossier.id,
              mandatIndex: mandatIndex,
              dossier: dossier,
              mandat: mandat,
              tache: mandat.tache_actuelle || "Ouverture"
            });
          });
        }
      });

    return cards;
  };

  const allCards = getMandatsCards();

  // Filtrer les cartes
  const filteredCards = allCards.filter(card => {
    const searchLower = searchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(card.dossier.arpenteur_geometre) + card.dossier.numero_dossier;
    const clientsNames = getClientsNames(card.dossier.clients_ids);

    const matchesSearch = (
      fullNumber.toLowerCase().includes(searchLower) ||
      card.dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      card.mandat.type_mandat?.toLowerCase().includes(searchLower)
    );

    const matchesArpenteur = filterArpenteur === "all" || card.dossier.arpenteur_geometre === filterArpenteur;
    const matchesType = filterTypeMandat === "all" || card.mandat.type_mandat === filterTypeMandat;
    const matchesUtilisateur = filterUtilisateur === "all" || card.mandat.utilisateur_assigne === filterUtilisateur;

    return matchesSearch && matchesArpenteur && matchesType && matchesUtilisateur;
  });

  // Organiser les cartes par tâche
  const cardsByTache = TACHES.reduce((acc, tache) => {
    acc[tache] = filteredCards.filter(card => card.tache === tache);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const card = filteredCards.find(c => c.id === draggableId);
    if (!card) return;

    const nouvelleTache = destination.droppableId;
    const dossier = card.dossier;
    
    const updatedMandats = dossier.mandats.map((m, idx) => {
      if (idx === card.mandatIndex) {
        return { ...m, tache_actuelle: nouvelleTache };
      }
      return m;
    });

    updateDossierMutation.mutate({
      id: dossier.id,
      dossierData: { ...dossier, mandats: updatedMandats }
    });
  };

  const getTacheColor = (tache) => {
    const colors = {
      "Ouverture": "bg-blue-500/20 border-blue-500/30",
      "Cédule": "bg-cyan-500/20 border-cyan-500/30",
      "Montage": "bg-purple-500/20 border-purple-500/30",
      "Terrain": "bg-green-500/20 border-green-500/30",
      "Compilation": "bg-yellow-500/20 border-yellow-500/30",
      "Reliage": "bg-orange-500/20 border-orange-500/30",
      "Décision/Calcul": "bg-pink-500/20 border-pink-500/30",
      "Mise en plan": "bg-indigo-500/20 border-indigo-500/30",
      "Analyse": "bg-teal-500/20 border-teal-500/30",
      "Rapport": "bg-red-500/20 border-red-500/30",
      "Vérification": "bg-amber-500/20 border-amber-500/30",
      "Facturer": "bg-emerald-500/20 border-emerald-500/30"
    };
    return colors[tache] || "bg-slate-500/20 border-slate-500/30";
  };

  const getTacheHeaderColor = (tache) => {
    const colors = {
      "Ouverture": "from-blue-500 to-blue-600",
      "Cédule": "from-cyan-500 to-cyan-600",
      "Montage": "from-purple-500 to-purple-600",
      "Terrain": "from-green-500 to-green-600",
      "Compilation": "from-yellow-500 to-yellow-600",
      "Reliage": "from-orange-500 to-orange-600",
      "Décision/Calcul": "from-pink-500 to-pink-600",
      "Mise en plan": "from-indigo-500 to-indigo-600",
      "Analyse": "from-teal-500 to-teal-600",
      "Rapport": "from-red-500 to-red-600",
      "Vérification": "from-amber-500 to-amber-600",
      "Facturer": "from-emerald-500 to-emerald-600"
    };
    return colors[tache] || "from-slate-500 to-slate-600";
  };

  const handleCardClick = (card) => {
    setViewingDossier(card.dossier);
    setViewingMandatIndex(card.mandatIndex);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Gestion de Mandat
              </h1>
              <Kanban className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Vue Kanban de vos mandats par tâche</p>
          </div>
        </div>

        {/* Filtres et recherche */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un dossier, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <Select value={filterArpenteur} onValueChange={setFilterArpenteur}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
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
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Type de mandat" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                  {TYPES_MANDATS.map(type => (
                    <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterUtilisateur} onValueChange={setFilterUtilisateur}>
                <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                  <SelectValue placeholder="Utilisateur assigné" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Tous les utilisateurs</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.email} value={user.email} className="text-white">
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || filterArpenteur !== "all" || filterTypeMandat !== "all" || filterUtilisateur !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterArpenteur("all");
                    setFilterTypeMandat("all");
                    setFilterUtilisateur("all");
                  }}
                  className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TACHES.map(tache => {
              const cardsInColumn = cardsByTache[tache] || [];
              
              return (
                <div key={tache} className="flex-shrink-0 w-72">
                  <Card className={`border-2 ${getTacheColor(tache)} bg-slate-900/50 backdrop-blur-xl shadow-xl h-full flex flex-col`}>
                    <CardHeader className={`pb-3 border-b border-slate-800 bg-gradient-to-r ${getTacheHeaderColor(tache)} bg-opacity-10`}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-white">
                          {tache}
                        </CardTitle>
                        <Badge className="bg-slate-900/70 text-white font-bold">
                          {cardsInColumn.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <Droppable droppableId={tache}>
                      {(provided, snapshot) => (
                        <CardContent
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-320px)] ${
                            snapshot.isDraggingOver ? 'bg-slate-800/30' : ''
                          }`}
                        >
                          {cardsInColumn.map((card, index) => {
                            const assignedUser = users.find(u => u.email === card.mandat.utilisateur_assigne);
                            
                            return (
                              <Draggable key={card.id} draggableId={card.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`${
                                      snapshot.isDragging ? 'opacity-50 rotate-2' : ''
                                    }`}
                                  >
                                    <Card 
                                      className="border-slate-700 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-800 hover:shadow-lg transition-all cursor-pointer"
                                      onClick={() => handleCardClick(card)}
                                    >
                                      <CardContent className="p-3 space-y-2">
                                        {/* Numéro de dossier et type mandat */}
                                        <div className="flex items-center justify-between gap-2">
                                          <Badge variant="outline" className={`${getArpenteurColor(card.dossier.arpenteur_geometre)} border text-xs`}>
                                            {getArpenteurInitials(card.dossier.arpenteur_geometre)}{card.dossier.numero_dossier}
                                          </Badge>
                                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                            {card.mandat.type_mandat}
                                          </Badge>
                                        </div>

                                        {/* Clients */}
                                        {getClientsNames(card.dossier.clients_ids) !== "-" && (
                                          <div className="text-sm text-slate-300">
                                            <p className="font-medium truncate">{getClientsNames(card.dossier.clients_ids)}</p>
                                          </div>
                                        )}

                                        {/* Adresse */}
                                        {card.mandat.adresse_travaux && formatAdresse(card.mandat.adresse_travaux) && (
                                          <div className="flex items-start gap-1 text-xs text-slate-400">
                                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span className="truncate">{formatAdresse(card.mandat.adresse_travaux)}</span>
                                          </div>
                                        )}

                                        {/* Date de livraison et utilisateur assigné */}
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                                          {card.mandat.date_livraison ? (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                              <Calendar className="w-3 h-3" />
                                              <span>{format(new Date(card.mandat.date_livraison), "dd MMM", { locale: fr })}</span>
                                            </div>
                                          ) : (
                                            <div></div>
                                          )}

                                          {assignedUser && (
                                            <Avatar className="w-6 h-6 border border-slate-600">
                                              <AvatarImage src={assignedUser.photo_url} />
                                              <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                                {getUserInitials(assignedUser.full_name)}
                                              </AvatarFallback>
                                            </Avatar>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          {cardsInColumn.length === 0 && (
                            <div className="text-center py-8 text-slate-600 text-sm">
                              Aucun mandat
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Droppable>
                  </Card>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {/* Dialog de vue/édition du dossier */}
        <Dialog open={!!viewingDossier} onOpenChange={(open) => {
          if (!open) {
            setViewingDossier(null);
            setViewingMandatIndex(null);
          }
        }}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center justify-between">
                <span>
                  Dossier {viewingDossier && `${getArpenteurInitials(viewingDossier.arpenteur_geometre)}${viewingDossier.numero_dossier}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`/Dossiers?dossier_id=${viewingDossier?.id}`, '_blank');
                  }}
                  className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="space-y-6">
                {/* Informations principales */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <div>
                    <Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label>
                    <p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400 text-sm">Statut</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className={`border ${viewingDossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {viewingDossier.statut}
                      </Badge>
                    </div>
                  </div>
                  {viewingDossier.date_ouverture && (
                    <div>
                      <Label className="text-slate-400 text-sm">Date d'ouverture</Label>
                      <p className="text-white font-medium mt-1">
                        {format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  )}
                </div>

                {/* Clients */}
                {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                  <div>
                    <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.clients_ids.map(clientId => {
                        const client = getClientById(clientId);
                        return client ? (
                          <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                            {client.prenom} {client.nom}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Mandat sélectionné */}
                {viewingMandatIndex !== null && viewingDossier.mandats && viewingDossier.mandats[viewingMandatIndex] && (
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h5 className="font-semibold text-emerald-400 text-lg">
                          {viewingDossier.mandats[viewingMandatIndex].type_mandat}
                        </h5>
                        {viewingDossier.mandats[viewingMandatIndex].tache_actuelle && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border">
                            {viewingDossier.mandats[viewingMandatIndex].tache_actuelle}
                          </Badge>
                        )}
                      </div>

                      {viewingDossier.mandats[viewingMandatIndex].adresse_travaux && formatAdresse(viewingDossier.mandats[viewingMandatIndex].adresse_travaux) && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                          <p className="text-slate-300 text-sm">{formatAdresse(viewingDossier.mandats[viewingMandatIndex].adresse_travaux)}</p>
                        </div>
                      )}

                      {/* Dates */}
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                        {viewingDossier.mandats[viewingMandatIndex].date_signature && (
                          <div>
                            <Label className="text-slate-400 text-xs">Signature</Label>
                            <p className="text-slate-300 text-sm mt-1">
                              {format(new Date(viewingDossier.mandats[viewingMandatIndex].date_signature), "dd MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        )}
                        {viewingDossier.mandats[viewingMandatIndex].date_debut_travaux && (
                          <div>
                            <Label className="text-slate-400 text-xs">Début travaux</Label>
                            <p className="text-slate-300 text-sm mt-1">
                              {format(new Date(viewingDossier.mandats[viewingMandatIndex].date_debut_travaux), "dd MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        )}
                        {viewingDossier.mandats[viewingMandatIndex].date_livraison && (
                          <div>
                            <Label className="text-slate-400 text-xs">Livraison</Label>
                            <p className="text-slate-300 text-sm mt-1">
                              {format(new Date(viewingDossier.mandats[viewingMandatIndex].date_livraison), "dd MMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Utilisateur assigné */}
                      {viewingDossier.mandats[viewingMandatIndex].utilisateur_assigne && (
                        <div className="pt-2 border-t border-slate-700">
                          <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                          <div className="flex items-center gap-2 mt-1">
                            {(() => {
                              const assignedUser = users.find(u => u.email === viewingDossier.mandats[viewingMandatIndex].utilisateur_assigne);
                              return assignedUser ? (
                                <>
                                  <Avatar className="w-6 h-6 border border-slate-600">
                                    <AvatarImage src={assignedUser.photo_url} />
                                    <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                      {getUserInitials(assignedUser.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-slate-300 text-sm">{assignedUser.full_name}</span>
                                </>
                              ) : (
                                <span className="text-slate-500 text-sm">-</span>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Prix */}
                      {(viewingDossier.mandats[viewingMandatIndex].prix_estime > 0 || viewingDossier.mandats[viewingMandatIndex].rabais > 0) && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                          {viewingDossier.mandats[viewingMandatIndex].prix_estime > 0 && (
                            <div>
                              <Label className="text-slate-400 text-xs">Prix estimé</Label>
                              <p className="text-slate-300 text-sm mt-1">{viewingDossier.mandats[viewingMandatIndex].prix_estime.toFixed(2)} $</p>
                            </div>
                          )}
                          {viewingDossier.mandats[viewingMandatIndex].rabais > 0 && (
                            <div>
                              <Label className="text-slate-400 text-xs">Rabais</Label>
                              <p className="text-slate-300 text-sm mt-1">{viewingDossier.mandats[viewingMandatIndex].rabais.toFixed(2)} $</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {viewingDossier.mandats[viewingMandatIndex].notes && (
                        <div className="pt-2 border-t border-slate-700">
                          <Label className="text-slate-400 text-xs">Notes</Label>
                          <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{viewingDossier.mandats[viewingMandatIndex].notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tous les mandats du dossier */}
                {viewingDossier.mandats && viewingDossier.mandats.length > 1 && (
                  <div>
                    <Label className="text-slate-400 text-sm mb-3 block">Autres mandats de ce dossier ({viewingDossier.mandats.length - 1})</Label>
                    <div className="space-y-2">
                      {viewingDossier.mandats.map((mandat, idx) => {
                        if (idx === viewingMandatIndex) return null;
                        return (
                          <Card key={idx} className="border-slate-700 bg-slate-800/30">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                    {mandat.type_mandat}
                                  </Badge>
                                  {mandat.tache_actuelle && (
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs">
                                      {mandat.tache_actuelle}
                                    </Badge>
                                  )}
                                </div>
                                {mandat.date_livraison && (
                                  <span className="text-xs text-slate-400">
                                    {format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}