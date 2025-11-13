import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Kanban, User, MapPin, Calendar } from "lucide-react";
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

export default function GestionDeMandat() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterTypeMandat, setFilterTypeMandat] = useState("all");
  const [filterUtilisateur, setFilterUtilisateur] = useState("all");

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
    if (addr.ville) parts.push(addr.ville);
    return parts.join(', ');
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
                <div key={tache} className="flex-shrink-0 w-80">
                  <Card className={`border-2 ${getTacheColor(tache)} bg-slate-900/50 backdrop-blur-xl shadow-xl h-full flex flex-col`}>
                    <CardHeader className="pb-3 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-white">
                          {tache}
                        </CardTitle>
                        <Badge className="bg-slate-700 text-slate-300">
                          {cardsInColumn.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <Droppable droppableId={tache}>
                      {(provided, snapshot) => (
                        <CardContent
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-300px)] ${
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
                                      snapshot.isDragging ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <Card className="border-slate-700 bg-slate-800/80 backdrop-blur-sm hover:bg-slate-800 transition-all cursor-move">
                                      <CardContent className="p-3 space-y-2">
                                        {/* Numéro de dossier */}
                                        <div className="flex items-center justify-between">
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
                                        {card.mandat.adresse_travaux?.ville && (
                                          <div className="flex items-start gap-1 text-xs text-slate-400">
                                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span className="truncate">{formatAdresse(card.mandat.adresse_travaux)}</span>
                                          </div>
                                        )}

                                        {/* Date de livraison */}
                                        {card.mandat.date_livraison && (
                                          <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            <span>{format(new Date(card.mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</span>
                                          </div>
                                        )}

                                        {/* Utilisateur assigné */}
                                        {assignedUser && (
                                          <div className="flex items-center gap-1 text-xs">
                                            <User className="w-3 h-3 text-slate-400" />
                                            <span className="text-slate-300 truncate">{assignedUser.full_name}</span>
                                          </div>
                                        )}
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
      </div>
    </div>
  );
}