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
import { MapPin, Calendar, CheckCircle, X, Plus, Trash2, Users, Eye, Filter, Search, User, Edit, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EditDossierDialog from "../components/dossiers/EditDossierDialog";
import CommentairesSection from "../components/dossiers/CommentairesSection";
import { Textarea } from "@/components/ui/textarea";

const JOURS_SEMAINE = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Certificat de localisation", "Implantation", "Piquetage", "OCTR", "Projet de lotissement"];
const DONNEURS = ["Dave Vallée", "Julie Abud", "André Guérin"];

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
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [editingEquipe, setEditingEquipe] = useState(null);
  const [newEquipeName, setNewEquipeName] = useState("");
  const [editingTerrainItem, setEditingTerrainItem] = useState(null);
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [terrainForm, setTerrainForm] = useState({
    date_limite_leve: "",
    instruments_requis: "",
    a_rendez_vous: false,
    date_rendez_vous: "",
    heure_rendez_vous: "",
    donneur: "",
    technicien: "",
    dossier_simultane: "",
    temps_prevu: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
  });

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
      mandats[jour.toLowerCase()] = {};
      
      dossiers.forEach(dossier => {
        if (dossier.mandats) {
          dossier.mandats.forEach((mandat, idx) => {
            const dateDuMandat = mandat.date_terrain ? new Date(mandat.date_terrain) : null;
            const dateDuJour = addDays(semaineCourante, jourIndex);
            
            if (dateDuMandat && mandat.equipe_assignee && 
                format(dateDuMandat, "yyyy-MM-dd") === format(dateDuJour, "yyyy-MM-dd")) {
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

    const [dossierId, mandatIndexStr] = result.draggableId.split('-');
    const mandatIndex = parseInt(mandatIndexStr);
    const dossier = dossiers.find(d => d.id === dossierId);
    if (!dossier) return;

    const updatedMandats = [...dossier.mandats];
    let updatedMandat = { ...updatedMandats[mandatIndex] };

    if (destinationId === "verification") {
      updatedMandat = {
        ...updatedMandat,
        statut_terrain: "en_verification",
        date_terrain: null,
        equipe_assignee: null
      };
    } else if (destinationId === "a-ceduler") {
      updatedMandat = {
        ...updatedMandat,
        statut_terrain: "a_ceduler",
        date_terrain: null,
        equipe_assignee: null
      };
    } else {
      const destParts = destinationId.split('-');
      const jour = destParts[0];
      const equipe = destParts.slice(1).join('-');
      const jourIndex = JOURS_SEMAINE.findIndex(j => j.toLowerCase() === jour);
      if (jourIndex === -1) return;

      const dateJour = format(addDays(semaineCourante, jourIndex), "yyyy-MM-dd");

      updatedMandat = {
        ...updatedMandat,
        date_terrain: dateJour,
        equipe_assignee: equipe,
        statut_terrain: "a_ceduler"
      };
    }

    updatedMandats[mandatIndex] = updatedMandat;

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
      const confirmation = confirm(`Cette équipe contient ${equipeMandats.length} mandat(s) planifié(s). Si vous supprimez l'équipe, ces mandats retourneront dans la section "À céduler". Voulez-vous continuer ?`);
      
      if (!confirmation) return;
      
      equipeMandats.forEach(item => {
        const dossier = dossiers.find(d => d.id === item.dossier.id);
        if (!dossier) return;
        
        const updatedMandats = [...dossier.mandats];
        updatedMandats[item.mandatIndex] = {
          ...updatedMandats[item.mandatIndex],
          date_terrain: null,
          equipe_assignee: null,
          statut_terrain: "a_ceduler"
        };
        
        updateDossierMutation.mutate({
          id: dossier.id,
          dossierData: { ...dossier, mandats: updatedMandats }
        });
      });
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

     const getAbbreviatedMandatType = (type) => {
       const abbreviations = {
         "Certificat de localisation": "CL",
         "Description Technique": "DT",
         "Implantation": "Imp",
         "Levé topographique": "Levé Topo",
         "Piquetage": "Piq"
       };
       return abbreviations[type] || type;
     };

  const handleViewDossier = (item) => {
    setViewingDossier(item.dossier);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (dossier) => {
    setIsViewDialogOpen(false);
    setEditingDossier(dossier);
    setIsEditingDialogOpen(true);
  };

  const handleEditTerrain = (item, e) => {
    e.stopPropagation();
    setEditingTerrainItem(item);
    setTerrainForm({
      date_limite_leve: item.mandat.terrain?.date_limite_leve || "",
      instruments_requis: item.mandat.terrain?.instruments_requis || "",
      a_rendez_vous: item.mandat.terrain?.a_rendez_vous || false,
      date_rendez_vous: item.mandat.terrain?.date_rendez_vous || "",
      heure_rendez_vous: item.mandat.terrain?.heure_rendez_vous || "",
      donneur: item.mandat.terrain?.donneur || "",
      technicien: item.mandat.terrain?.technicien || "",
      dossier_simultane: item.mandat.terrain?.dossier_simultane || "",
      temps_prevu: item.mandat.terrain?.temps_prevu || "",
      notes: item.mandat.terrain?.notes || ""
    });
    setIsTerrainDialogOpen(true);
  };

  const handleSaveTerrain = () => {
    if (!editingTerrainItem) return;

    const dossier = dossiers.find(d => d.id === editingTerrainItem.dossier.id);
    if (!dossier) return;

    const updatedMandats = [...dossier.mandats];
    const currentMandat = updatedMandats[editingTerrainItem.mandatIndex];
    
    // Si le mandat était en vérification, le passer à "a_ceduler"
    const newStatut = currentMandat.statut_terrain === "en_verification" ? "a_ceduler" : currentMandat.statut_terrain;
    
    updatedMandats[editingTerrainItem.mandatIndex] = {
      ...currentMandat,
      terrain: terrainForm,
      statut_terrain: newStatut
    };

    updateDossierMutation.mutate({
      id: dossier.id,
      dossierData: { ...dossier, mandats: updatedMandats }
    });

    setIsTerrainDialogOpen(false);
    setEditingTerrainItem(null);
  };

  const mandatsEnVerification = getMandatsEnVerification();
  const mandatsACeduler = getMandatsACeduler();
  const mandatsCedules = getMandatsCedules();

  const MandatCard = ({ item, showActions = true, isDragging = false, currentUser }) => {
    const assignedUser = users.find(u => u.email === item.mandat.utilisateur_assigne);
    
    const donneurUser = item.mandat.terrain?.donneur 
      ? users.find(u => u.full_name === item.mandat.terrain.donneur)
      : null;
    
    const displayUser = donneurUser || assignedUser;
    
    // Vérifier si l'utilisateur courant est assigné à ce mandat
    const isAssignedToCurrentUser = currentUser && item.mandat.utilisateur_assigne === currentUser.email;
    
    return (
      <Card 
        className={`border-slate-700 ${isDragging ? 'bg-slate-700' : 'bg-slate-800/80'} hover:bg-slate-800 transition-colors cursor-pointer`}
        onClick={() => !isDragging && handleViewDossier(item)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="text-center pb-2 border-b border-slate-700">
             <div className="flex items-center justify-center gap-2 flex-wrap">
               <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs font-semibold">
                 {getAbbreviatedMandatType(item.mandat.type_mandat)}
               </Badge>
               {item.mandat.terrain?.a_rendez_vous && (
                 <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 border text-xs font-semibold">
                   Rendez-vous
                 </Badge>
               )}
             </div>
           </div>

          <div className="space-y-1">
            <div>
              <p className="text-xs text-slate-500 mb-1">Dossier</p>
              <Badge variant="outline" className={`${getArpenteurColor(item.dossier.arpenteur_geometre)} border text-xs w-full justify-center`}>
                {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Clients</p>
              <p className="text-xs text-slate-300 font-medium">
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

          <div className="border-t border-slate-700" />

          <div className="space-y-1">
            {item.mandat.terrain?.instruments_requis && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Instruments: </span>
                <span>{item.mandat.terrain.instruments_requis}</span>
              </div>
            )}
            
            {item.mandat.terrain?.technicien && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Technicien: </span>
                <span>{item.mandat.terrain.technicien}</span>
              </div>
            )}
            
            {item.mandat.terrain?.dossier_simultane && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Dossier simultané: </span>
                <span>{item.mandat.terrain.dossier_simultane}</span>
              </div>
            )}
            
            {item.mandat.terrain?.temps_prevu && (
              <div className="text-xs text-slate-400">
                <span className="font-medium">Temps: </span>
                <span>{item.mandat.terrain.temps_prevu}</span>
              </div>
            )}
          </div>

          {!showActions && (
            <div className="space-y-1 pt-1 border-t border-slate-700">
              {item.mandat.terrain?.a_rendez_vous && item.mandat.terrain?.date_rendez_vous && (
                <div className="text-xs text-purple-400 font-medium">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  <span>RDV: {format(new Date(item.mandat.terrain.date_rendez_vous), "dd MMM yyyy", { locale: fr })}</span>
                  {item.mandat.terrain?.heure_rendez_vous && (
                    <span> à {item.mandat.terrain.heure_rendez_vous}</span>
                  )}
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {item.mandat.terrain?.date_limite_leve && (
                    <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>Limite: {format(addDays(new Date(item.mandat.terrain.date_limite_leve), 1), "dd MMM yyyy", { locale: fr })}</span>
                    </div>
                  )}
                </div>
                
                {displayUser ? (
                  <Avatar className="w-7 h-7 border-2 border-slate-600">
                    <AvatarImage src={displayUser.photo_url} />
                    <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                      {getUserInitials(displayUser.full_name)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700/50 flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {showActions && (item.mandat.terrain?.date_limite_leve || item.mandat.date_livraison) && (
            <div className="pt-1 border-t border-slate-700 space-y-1">
              {item.mandat.terrain?.date_limite_leve && (
                <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>Limite: {format(addDays(new Date(item.mandat.terrain.date_limite_leve), 1), "dd MMM yyyy", { locale: fr })}</span>
                </div>
              )}
              {item.mandat.date_livraison && (
                <div className="flex items-center gap-1 text-xs text-cyan-400 font-medium">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span>Livraison: {format(new Date(item.mandat.date_livraison + "T00:00:00"), "dd MMM yyyy", { locale: fr })}</span>
                </div>
              )}
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-2 border-t border-slate-700" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                onClick={(e) => handleEditTerrain(item, e)}
                className="flex-1 text-xs h-8 p-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                title="Oui, terrain requis"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateMandatStatut(item.dossier.id, item.mandatIndex, "pas_de_terrain");
                }}
                disabled={!isAssignedToCurrentUser}
                className={`flex-1 text-xs h-8 p-0 ${
                  isAssignedToCurrentUser 
                    ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
                title={isAssignedToCurrentUser ? "Pas de terrain" : "Vous devez être assigné à ce mandat"}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {!showActions && (
            <div className="pt-2 border-t border-slate-700" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                onClick={(e) => handleEditTerrain(item, e)}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs h-8"
              >
                <Settings className="w-4 h-4 mr-1" />
                Modifier terrain
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
                    <Droppable droppableId="verification" isDropDisabled={false} direction="horizontal">
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
                                    <MandatCard item={item} showActions={true} currentUser={currentUser} />
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
                    <Droppable droppableId="a-ceduler" isDropDisabled={false} direction="horizontal">
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
                                    <MandatCard item={item} showActions={false} isDragging={snapshot.isDragging} currentUser={currentUser} />
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

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    Semaine du {format(semaineCourante, "d MMMM", { locale: fr })} au {format(addDays(semaineCourante, 4), "d MMMM yyyy", { locale: fr })}
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
                            <div className="flex items-center gap-2">
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
                            <div key={equipe} className="bg-slate-800/50 rounded-lg border-2 border-slate-700">
                              <div className="flex justify-between items-center px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b-2 border-slate-700">
                                <div className="flex items-center gap-2 flex-1">
                                  <Users className="w-4 h-4 text-cyan-400" />
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
                                      className="bg-slate-700 border-slate-600 text-white h-7 text-sm px-2"
                                    />
                                  ) : (
                                    <span 
                                      className="text-sm font-bold text-cyan-300 cursor-pointer hover:text-cyan-200"
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
                                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
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
                                    className={`min-h-[100px] space-y-2 transition-colors ${
                                      snapshot.isDraggingOver ? 'bg-emerald-500/10 border-t-2 border-emerald-500/30' : ''
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
                                            <MandatCard item={item} showActions={false} isDragging={snapshot.isDragging} currentUser={currentUser} />
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

        <Dialog open={isTerrainDialogOpen} onOpenChange={setIsTerrainDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Modifier les informations terrain</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date limite levé terrain</Label>
                  <Input
                    type="date"
                    value={terrainForm.date_limite_leve}
                    onChange={(e) => setTerrainForm({...terrainForm, date_limite_leve: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instruments requis</Label>
                  <Input
                    value={terrainForm.instruments_requis}
                    onChange={(e) => setTerrainForm({...terrainForm, instruments_requis: e.target.value})}
                    placeholder="Ex: GPS, Total Station"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={terrainForm.a_rendez_vous}
                    onChange={(e) => setTerrainForm({...terrainForm, a_rendez_vous: e.target.checked})}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700"
                  />
                  <Label>Rendez-vous nécessaire</Label>
                </div>
                {terrainForm.a_rendez_vous && (
                  <div className="grid grid-cols-2 gap-3 ml-7">
                    <div className="space-y-2">
                      <Label>Date du rendez-vous</Label>
                      <Input
                        type="date"
                        value={terrainForm.date_rendez_vous}
                        onChange={(e) => setTerrainForm({...terrainForm, date_rendez_vous: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Heure du rendez-vous</Label>
                      <Input
                        type="time"
                        value={terrainForm.heure_rendez_vous}
                        onChange={(e) => setTerrainForm({...terrainForm, heure_rendez_vous: e.target.value})}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Donneur</Label>
                  <Select value={terrainForm.donneur} onValueChange={(value) => setTerrainForm({...terrainForm, donneur: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner un donneur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value={null} className="text-white">Aucun</SelectItem>
                      {DONNEURS.map((donneur) => (
                        <SelectItem key={donneur} value={donneur} className="text-white">{donneur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Technicien à prioriser</Label>
                  <Input
                    value={terrainForm.technicien}
                    onChange={(e) => setTerrainForm({...terrainForm, technicien: e.target.value})}
                    placeholder="Nom du technicien"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dossier à faire en même temps</Label>
                  <Input
                    value={terrainForm.dossier_simultane}
                    onChange={(e) => setTerrainForm({...terrainForm, dossier_simultane: e.target.value})}
                    placeholder="N° de dossier"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temps prévu</Label>
                  <Input
                    value={terrainForm.temps_prevu}
                    onChange={(e) => setTerrainForm({...terrainForm, temps_prevu: e.target.value})}
                    placeholder="Ex: 2h30"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes terrain</Label>
                <Textarea
                  value={terrainForm.notes}
                  onChange={(e) => setTerrainForm({...terrainForm, notes: e.target.value})}
                  placeholder="Notes concernant le terrain..."
                  className="bg-slate-800 border-slate-700 text-white h-24"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={() => setIsTerrainDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveTerrain} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                Enregistrer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-2xl">Détails du dossier</DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="flex h-[90vh]">
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Détails du dossier {getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
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
                      <div>
                        <Label className="text-slate-400 text-sm">Date d'ouverture</Label>
                        <p className="text-white font-medium mt-1">
                          {viewingDossier.date_ouverture ? format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr }) : '-'}
                        </p>
                      </div>
                    </div>

                    {viewingDossier.description && (
                      <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                        <Label className="text-slate-400 text-sm">Description</Label>
                        <p className="text-white mt-2 whitespace-pre-wrap">{viewingDossier.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.clients_ids.map(clientId => {
                              const client = getClientById(clientId);
                              return client ? (
                                <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-full justify-start">
                                  {client.prenom} {client.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {viewingDossier.notaires_ids && viewingDossier.notaires_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.notaires_ids.map(notaireId => {
                              const notaire = getClientById(notaireId);
                              return notaire ? (
                                <Badge key={notaireId} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border w-full justify-start">
                                  {notaire.prenom} {notaire.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {viewingDossier.courtiers_ids && viewingDossier.courtiers_ids.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Courtiers immobiliers</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.courtiers_ids.map(courtierId => {
                              const courtier = getClientById(courtierId);
                              return courtier ? (
                                <Badge key={courtierId} className="bg-orange-500/20 text-orange-400 border-orange-500/30 border w-full justify-start">
                                  {courtier.prenom} {courtier.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {viewingDossier.mandats && viewingDossier.mandats.length > 0 && (
                      <div>
                        <Label className="text-slate-400 text-sm mb-3 block">Mandats ({viewingDossier.mandats.length})</Label>
                        <div className="space-y-3">
                          {viewingDossier.mandats.map((mandat, index) => (
                            <Card key={index} className="bg-slate-800/50 border-slate-700">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                  <h5 className="font-semibold text-emerald-400 text-lg">{mandat.type_mandat || `Mandat ${index + 1}`}</h5>
                                  <div className="flex gap-2">
                                    {(mandat.prix_estime || 0) > 0 && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                                        {(mandat.prix_estime || 0).toFixed(2)} $
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) !== "" && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Adresse des travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                                    </div>
                                  )}
                                  
                                  {mandat.lots && mandat.lots.length > 0 && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Lots</Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {mandat.lots.map((lotId) => {
                                          const lot = lots.find(l => l.id === lotId);
                                          return (
                                            <Badge key={lotId} variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                              {lot?.numero_lot || lotId}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {mandat.tache_actuelle && (
                                  <div>
                                    <Label className="text-slate-400 text-xs">Tâche actuelle</Label>
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mt-1">
                                      {mandat.tache_actuelle}
                                    </Badge>
                                  </div>
                                )}

                                {mandat.minutes_list && mandat.minutes_list.length > 0 && (
                                  <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Minutes</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {mandat.minutes_list.map((minute, minuteIdx) => (
                                        <Badge key={minuteIdx} className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                          {minute.minute}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {mandat.minute && !mandat.minutes_list && (
                                  <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Minute</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                        {mandat.minute}
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-4 gap-3 pt-2 border-t border-slate-700">
                                  {mandat.date_ouverture && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Ouverture</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_ouverture), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_signature && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Signature</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_debut_travaux && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Début travaux</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_debut_travaux), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                  {mandat.date_livraison && (
                                    <div>
                                      <Label className="text-slate-400 text-xs">Livraison</Label>
                                      <p className="text-slate-300 text-sm mt-1">{format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</p>
                                    </div>
                                  )}
                                </div>

                                {((mandat.prix_estime || 0) > 0 || (mandat.rabais || 0) > 0) && (
                                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                                    {(mandat.prix_estime || 0) > 0 && (
                                      <div>
                                        <Label className="text-slate-400 text-xs">Prix estimé</Label>
                                        <p className="text-slate-300 text-sm mt-1">{(mandat.prix_estime || 0).toFixed(2)} $</p>
                                      </div>
                                    )}
                                    {(mandat.rabais || 0) > 0 && (
                                      <div>
                                        <Label className="text-slate-400 text-xs">Rabais</Label>
                                        <p className="text-slate-300 text-sm mt-1">{(mandat.rabais || 0).toFixed(2)} $</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label className="text-slate-400 text-xs">Taxes</Label>
                                      <p className="text-slate-300 text-sm mt-1">
                                        {mandat.taxes_incluses ? "✓ Incluses" : "Non incluses"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {mandat.notes && (
                                  <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Notes</Label>
                                    <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{mandat.notes}</p>
                                  </div>
                                )}

                                {mandat.factures && mandat.factures.length > 0 && (
                                  <div className="pt-2 border-t border-slate-700">
                                    <Label className="text-slate-400 text-xs">Factures générées ({mandat.factures.length})</Label>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {mandat.factures.map((facture, factureIdx) => (
                                        <Badge key={factureIdx} className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                          {facture.numero_facture}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Fermer
                    </Button>
                    <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={() => handleEdit(viewingDossier)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 pr-4">
                    <CommentairesSection
                      dossierId={viewingDossier?.id}
                      dossierTemporaire={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <EditDossierDialog
          isOpen={isEditingDialogOpen}
          onClose={() => {
            setIsEditingDialogOpen(false);
            setEditingDossier(null);
          }}
          dossier={editingDossier}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['dossiers'] });
            if (viewingDossier && editingDossier?.id === viewingDossier.id) {
              const updatedDossier = queryClient.getQueryData(['dossiers'])?.find(d => d.id === editingDossier.id);
              if (updatedDossier) {
                setViewingDossier(updatedDossier);
                setIsViewDialogOpen(true);
              }
            }
          }}
          clients={clients}
          users={users}
        />
      </DragDropContext>
    </TooltipProvider>
  );
}