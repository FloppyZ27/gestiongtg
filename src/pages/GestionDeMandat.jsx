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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Search, Kanban, MapPin, Calendar, Edit, FileText, User, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval, endOfWeek, isSameDay, addDays, startOfMonth, endOfMonth, eachWeekOfInterval, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import EditDossierDialog from "../components/dossiers/EditDossierDialog";
import CommentairesSection from "../components/dossiers/CommentairesSection";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

const MONTHS = [
  { value: 0, label: "Janvier" },
  { value: 1, label: "Février" },
  { value: 2, label: "Mars" },
  { value: 3, label: "Avril" },
  { value: 4, label: "Mai" },
  { value: 5, label: "Juin" },
  { value: 6, label: "Juillet" },
  { value: 7, label: "Août" },
  { value: 8, label: "Septembre" },
  { value: 9, label: "Octobre" },
  { value: 10, label: "Novembre" },
  { value: 11, label: "Décembre" }
];

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
    "Samuel Guay": "bg-red-500/10 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-300/20 text-slate-200 border-slate-300/60",
    "Frédéric Gilbert": "bg-orange-500/10 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
};

const getUserInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

export default function GestionDeMandat() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterTypeMandat, setFilterTypeMandat] = useState([]);
  const [filterUtilisateur, setFilterUtilisateur] = useState([]);
  const [filterVille, setFilterVille] = useState([]);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState("taches");
  const [currentMonthStart, setCurrentMonthStart] = useState(startOfMonth(new Date()));
  const [calendarMode, setCalendarMode] = useState("week"); // "week" or "month"
  const [sortTaches, setSortTaches] = useState({}); // { tache: "asc" | "desc" | null }
  const [sortUtilisateurs, setSortUtilisateurs] = useState({}); // { email: "asc" | "desc" | null }
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
  const getLotById = (numeroLot) => lots.find(l => l.id === numeroLot);

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
              tache: mandat.tache_actuelle || "Ouverture",
              utilisateur: mandat.utilisateur_assigne || "non-assigne"
            });
          });
        }
      });

    return cards;
  };

  const allCards = getMandatsCards();

  // Extraire les villes uniques
  const uniqueVilles = [...new Set(
    allCards
      .filter(card => card.mandat.adresse_travaux?.ville)
      .map(card => card.mandat.adresse_travaux.ville)
  )].sort();

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

    const matchesArpenteur = filterArpenteur.length === 0 || filterArpenteur.includes(card.dossier.arpenteur_geometre);
    const matchesType = filterTypeMandat.length === 0 || filterTypeMandat.includes(card.mandat.type_mandat);
    const matchesUtilisateur = filterUtilisateur.length === 0 || filterUtilisateur.includes(card.mandat.utilisateur_assigne);
    const matchesVille = filterVille.length === 0 || filterVille.includes(card.mandat.adresse_travaux?.ville);

    return matchesSearch && matchesArpenteur && matchesType && matchesUtilisateur && matchesVille;
  });

  // Organiser les cartes par tâche avec tri
  const cardsByTache = TACHES.reduce((acc, tache) => {
    let cards = filteredCards.filter(card => card.tache === tache);
    
    // Appliquer le tri si défini
    if (sortTaches[tache]) {
      cards = [...cards].sort((a, b) => {
        const dateA = a.mandat.date_livraison ? new Date(a.mandat.date_livraison) : new Date(0);
        const dateB = b.mandat.date_livraison ? new Date(b.mandat.date_livraison) : new Date(0);
        return sortTaches[tache] === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
    
    acc[tache] = cards;
    return acc;
  }, {});

  // Organiser les cartes par utilisateur avec tri
  const usersList = [...users, { email: "non-assigne", full_name: "Non assigné" }];
  const cardsByUtilisateur = usersList.reduce((acc, user) => {
    let cards = filteredCards.filter(card => 
      card.utilisateur === user.email || (card.utilisateur === "non-assigne" && user.email === "non-assigne")
    );
    
    // Appliquer le tri si défini
    if (sortUtilisateurs[user.email]) {
      cards = [...cards].sort((a, b) => {
        const dateA = a.mandat.date_livraison ? new Date(a.mandat.date_livraison) : new Date(0);
        const dateB = b.mandat.date_livraison ? new Date(b.mandat.date_livraison) : new Date(0);
        return sortUtilisateurs[user.email] === "asc" ? dateA - dateB : dateB - dateA;
      });
    }
    
    acc[user.email] = cards;
    return acc;
  }, {});

  // Organiser les cartes par date de livraison pour le calendrier
  const getWeeksToDisplay = () => {
    const monthStart = startOfMonth(currentMonthStart);
    const monthEnd = endOfMonth(currentMonthStart);
    
    // Obtenir toutes les semaines qui touchent ce mois
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { locale: fr }
    );
    
    return weeks;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) return;

    const card = filteredCards.find(c => c.id === draggableId);
    if (!card) return;

    const dossier = card.dossier;

    let updatedMandats = [...dossier.mandats];

    if (activeView === "taches") {
      const nouvelleTache = destination.droppableId;
      updatedMandats = dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) {
          return { ...m, tache_actuelle: nouvelleTache };
        }
        return m;
      });
    } else if (activeView === "utilisateurs") {
      const nouvelUtilisateur = destination.droppableId === "non-assigne" ? "" : destination.droppableId;
      updatedMandats = dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) {
          return { ...m, utilisateur_assigne: nouvelUtilisateur };
        }
        return m;
      });
    } else if (activeView === "calendrier") {
      // Format: "day-YYYY-MM-DD"
      const newDateStr = destination.droppableId.replace("day-", "");
      updatedMandats = dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) {
          return { ...m, date_livraison: newDateStr };
        }
        return m;
      });
    }

    updateDossierMutation.mutate({
      id: dossier.id,
      dossierData: { ...dossier, mandats: updatedMandats }
    });
  };

  const getTacheColor = (tache) => {
       const colors = {
         "Ouverture": "bg-blue-500/10 border-blue-500/15",
         "Cédule": "bg-cyan-500/10 border-cyan-500/15",
         "Montage": "bg-purple-500/10 border-purple-500/15",
         "Terrain": "bg-green-500/10 border-green-500/15",
         "Compilation": "bg-yellow-500/10 border-yellow-500/15",
         "Reliage": "bg-orange-500/10 border-orange-500/15",
         "Décision/Calcul": "bg-pink-500/10 border-pink-500/15",
         "Mise en plan": "bg-indigo-500/10 border-indigo-500/15",
         "Analyse": "bg-teal-500/10 border-teal-500/15",
         "Rapport": "bg-red-500/10 border-red-500/15",
         "Vérification": "bg-amber-500/10 border-amber-500/15",
         "Facturer": "bg-emerald-500/10 border-emerald-500/15"
       };
       return colors[tache] || "bg-slate-500/10 border-slate-500/15";
     };

     const getMandatColor = (typeMandat) => {
       const colors = {
         "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
         "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
         "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
         "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
         "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
         "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
         "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
         "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
         "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
         "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
         "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
         "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
       };
       return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
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

  const getUserColor = (index) => {
    const colors = [
      "bg-blue-500/20 border-blue-500/30 from-blue-500 to-blue-600",
      "bg-purple-500/20 border-purple-500/30 from-purple-500 to-purple-600",
      "bg-green-500/20 border-green-500/30 from-green-500 to-green-600",
      "bg-orange-500/20 border-orange-500/30 from-orange-500 to-orange-600",
      "bg-pink-500/20 border-pink-500/30 from-pink-500 to-pink-600",
      "bg-cyan-500/20 border-cyan-500/30 from-cyan-500 to-cyan-600",
      "bg-yellow-500/20 border-yellow-500/30 from-yellow-500 to-yellow-600",
      "bg-red-500/20 border-red-500/30 from-red-500 to-red-600"
    ];
    return colors[index % colors.length];
  };

  const handleCardClick = (card) => {
    setEditingDossier(card.dossier);
    setIsEditingDialogOpen(true);
  };

  const handleMouseDown = (e, containerRef) => {
    if (!containerRef.current) return;
    if (e.target.closest('[data-rbd-draggable-id]')) return; // Ne pas interférer avec le drag des cartes
    
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
    containerRef.current.style.cursor = 'grabbing';
    containerRef.current.style.userSelect = 'none';
  };

  const handleMouseLeave = (containerRef) => {
    if (!containerRef.current) return;
    setIsDragging(false);
    containerRef.current.style.cursor = 'grab';
  };

  const handleMouseUp = (containerRef) => {
    if (!containerRef.current) return;
    setIsDragging(false);
    containerRef.current.style.cursor = 'grab';
  };

  const handleMouseMove = (e, containerRef) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Vitesse de défilement
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMonthChange = (monthValue) => {
    const newDate = new Date(currentMonthStart);
    newDate.setMonth(parseInt(monthValue));
    setCurrentMonthStart(startOfMonth(newDate));
  };

  const handleYearChange = (yearValue) => {
    const newDate = new Date(currentMonthStart);
    newDate.setFullYear(parseInt(yearValue));
    setCurrentMonthStart(startOfMonth(newDate));
  };

  // Générer une liste d'années (10 ans avant et après l'année actuelle)
  const currentYear = new Date().getFullYear();
  const YEARS = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    YEARS.push(i);
  }

  const renderMandatCard = (card, provided, snapshot) => {
     const assignedUser = users.find(u => u.email === card.mandat.utilisateur_assigne);

     const arpenteurColor = getArpenteurColor(card.dossier.arpenteur_geometre);
     const bgColorClass = arpenteurColor.split(' ')[0];
     const textColorClass = arpenteurColor.split(' ')[1];
     const borderColorClass = arpenteurColor.split(' ')[2];

     const shadowColor = bgColorClass.includes('red') ? 'shadow-red-500/50' 
       : bgColorClass.includes('slate') ? 'shadow-slate-500/50'
       : bgColorClass.includes('orange') ? 'shadow-orange-500/50'
       : bgColorClass.includes('yellow') ? 'shadow-yellow-500/50'
       : 'shadow-cyan-500/50';

     return (
       <div 
         onClick={() => !snapshot?.isDragging && handleCardClick(card)}
         className={`${bgColorClass} rounded-lg p-2 mb-2 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer ${borderColorClass} ${
           snapshot?.isDragging ? `shadow-2xl ${shadowColor}` : ''
         }`}
       >
         {/* Entête : N° Dossier (gauche) et Type de mandat (droite) */}
         <div className="flex items-start justify-between gap-2 mb-2">
           <Badge variant="outline" className={`${getArpenteurColor(card.dossier.arpenteur_geometre)} border text-xs flex-shrink-0`}>
             {getArpenteurInitials(card.dossier.arpenteur_geometre)}{card.dossier.numero_dossier}
           </Badge>
           <Badge className={`${getMandatColor(card.mandat.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
             {getAbbreviatedMandatType(card.mandat.type_mandat)}
           </Badge>
         </div>

        {/* Clients */}
        <div className="flex items-center gap-1 mb-1">
          <User className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-xs text-white font-medium">{getClientsNames(card.dossier.clients_ids)}</span>
        </div>

        {/* Adresse complète */}
        {card.mandat.adresse_travaux && formatAdresse(card.mandat.adresse_travaux) && (
          <div className="flex items-start gap-1 mb-1">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-400 break-words">{formatAdresse(card.mandat.adresse_travaux)}</span>
          </div>
        )}

        {/* Tâche actuelle */}
        {card.mandat.tache_actuelle && (
          <div className="mb-1">
            <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">
              {card.mandat.tache_actuelle}
            </Badge>
          </div>
        )}

        {/* Date de livraison et utilisateur assigné en bas */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
          {card.mandat.date_livraison ? (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-yellow-300">
                {format(new Date(card.mandat.date_livraison + "T00:00:00"), "dd MMM yyyy", { locale: fr })}
              </span>
            </div>
          ) : (
            <div />
          )}
          {assignedUser ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-emerald-300 font-medium">{getUserInitials(assignedUser.full_name)}</span>
              <Avatar className="w-6 h-6 border-2 border-emerald-500/50">
                <AvatarImage src={assignedUser.photo_url} />
                <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  {getUserInitials(assignedUser.full_name)}
                </AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
              <User className="w-3 h-3 text-emerald-500" />
            </div>
            )}
            </div>

            {/* Barre de progression */}
            {(() => {
              const tacheIndex = TACHES.indexOf(card.mandat.tache_actuelle);
              // Progression linéaire : Ouverture = 0%, Facturer = 95%
              let rawProgress = 0;
              if (tacheIndex >= 0 && TACHES.length > 1) {
                rawProgress = (tacheIndex / (TACHES.length - 1)) * 95;
              }
              const progress = Math.round(rawProgress / 5) * 5;

              return (
                <div className="mt-2 w-full bg-slate-900/50 h-4 rounded-full overflow-hidden border border-slate-700/50 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white drop-shadow-md leading-none">
                      {progress}%
                    </span>
                  </div>
                </div>
              );
            })()}
            </div>
            );
            };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8 overflow-x-hidden">
      <style>{`
        [data-rbd-draggable-context-id] {
          cursor: grab !important;
        }

        [data-rbd-draggable-context-id]:active {
          cursor: grabbing !important;
        }

        [data-rbd-drag-handle-context-id] {
          cursor: grab !important;
        }

        div[data-rbd-draggable-id] {
          transition: none !important;
        }

        /* Préserver la position de la carte lors du drag */
        div[data-rbd-draggable-id][data-is-dragging="false"] {
          transform: none !important;
        }

        /* Portal drag overlay au-dessus de TOUT */
        body > [data-rbd-droppable-context-id],
        [data-rbd-drag-handle-context-id] {
          position: fixed !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        }

        /* Carte en cours de drag - centrage sous curseur */
        [data-rbd-drag-handle-draggable-id] {
          position: fixed !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        }

        /* Centrer exactement sous le curseur */
        div[data-rbd-draggable-id][data-is-dragging="true"] {
          position: fixed !important;
          z-index: 999999 !important;
          pointer-events: none !important;
          margin: 0 !important;
        }
        
        div[data-rbd-draggable-id][data-is-dragging="true"] > div {
          transform: translate(-50%, -50%) !important;
          transform-origin: center center !important;
        }

        /* Empêcher le scroll horizontal global */
        body, html, #root {
          overflow-x: hidden !important;
        }

        /* Conteneur Kanban avec scroll horizontal uniquement */
        .kanban-scroll-container {
          overflow-x: auto;
          overflow-y: hidden;
          width: 100%;
          -webkit-overflow-scrolling: touch;
          transform: rotateX(180deg);
          cursor: grab;
        }

        .kanban-scroll-container:active {
          cursor: grabbing;
        }

        .kanban-scroll-container > div {
          transform: rotateX(180deg);
        }

        /* Personnaliser la scrollbar pour le Kanban */
        .kanban-scroll-container::-webkit-scrollbar {
          height: 12px;
        }

        .kanban-scroll-container::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.8);
          border-radius: 10px;
        }

        .kanban-scroll-container::-webkit-scrollbar-thumb {
          background: linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166));
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.8);
        }

        .kanban-scroll-container::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to right, rgb(5, 150, 105), rgb(13, 148, 136));
        }

        /* Colonnes avec largeur fixe - overflow visible pour drag */
        .kanban-column {
          flex: 0 0 270px;
          min-width: 270px;
          max-width: 270px;
          overflow: visible !important;
        }

        .kanban-column > * {
          overflow: visible !important;
        }

        /* Contenu des colonnes avec hauteur fixe pour 4 cartes */
        .kanban-column .kanban-content {
          max-height: 700px;
          overflow-y: auto;
          overflow-x: visible !important;
        }

        /* Scrollbar pour le contenu des colonnes */
        .kanban-column .kanban-content::-webkit-scrollbar {
          width: 8px;
        }

        .kanban-column .kanban-content::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }

        .kanban-column .kanban-content::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(16, 185, 129), rgb(20, 184, 166));
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.5);
        }

        .kanban-column .kanban-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(5, 150, 105), rgb(13, 148, 136));
        }
      `}</style>
      
      <div className="w-full px-0 overflow-x-hidden">
        <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-4 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Gestion de Mandat
                </h1>
                <Kanban className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-slate-400">Vue Kanban de vos mandats</p>
            </div>
          </div>

        {/* Filtres et recherche */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="text-sm">Filtres</span>
                  {(filterArpenteur.length > 0 || filterTypeMandat.length > 0 || filterUtilisateur.length > 0 || filterVille.length > 0) && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {filterArpenteur.length + filterTypeMandat.length + filterUtilisateur.length + filterVille.length}
                    </Badge>
                  )}
                  {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>

              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                  <div className="p-2 border border-emerald-500/30 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <Filter className="w-3 h-3 text-emerald-500" />
                          <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                        </div>
                        {(filterArpenteur.length > 0 || filterTypeMandat.length > 0 || filterUtilisateur.length > 0 || filterVille.length > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFilterArpenteur([]);
                              setFilterTypeMandat([]);
                              setFilterUtilisateur([]);
                              setFilterVille([]);
                            }}
                            className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                          >
                            <X className="w-2.5 h-2.5 mr-1" />
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Arpenteurs ({filterArpenteur.length > 0 ? `${filterArpenteur.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {ARPENTEURS.map((arp) => (
                              <DropdownMenuCheckboxItem
                                key={arp}
                                checked={filterArpenteur.includes(arp)}
                                onCheckedChange={(checked) => {
                                  setFilterArpenteur(
                                    checked
                                      ? [...filterArpenteur, arp]
                                      : filterArpenteur.filter((a) => a !== arp)
                                  );
                                }}
                                className="text-white"
                              >
                                {arp}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Mandats ({filterTypeMandat.length > 0 ? `${filterTypeMandat.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                            {TYPES_MANDATS.map((type) => (
                              <DropdownMenuCheckboxItem
                                key={type}
                                checked={filterTypeMandat.includes(type)}
                                onCheckedChange={(checked) => {
                                  setFilterTypeMandat(
                                    checked
                                      ? [...filterTypeMandat, type]
                                      : filterTypeMandat.filter((t) => t !== type)
                                  );
                                }}
                                className="text-white"
                              >
                                {type}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Utilisateurs ({filterUtilisateur.length > 0 ? `${filterUtilisateur.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {users.map((usr) => (
                              <DropdownMenuCheckboxItem
                                key={usr.email}
                                checked={filterUtilisateur.includes(usr.email)}
                                onCheckedChange={(checked) => {
                                  setFilterUtilisateur(
                                    checked
                                      ? [...filterUtilisateur, usr.email]
                                      : filterUtilisateur.filter((u) => u !== usr.email)
                                  );
                                }}
                                className="text-white"
                              >
                                {usr.full_name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Villes ({filterVille.length > 0 ? `${filterVille.length}` : 'Toutes'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                            {uniqueVilles.map((ville) => (
                              <DropdownMenuCheckboxItem
                                key={ville}
                                checked={filterVille.includes(ville)}
                                onCheckedChange={(checked) => {
                                  setFilterVille(
                                    checked
                                      ? [...filterVille, ville]
                                      : filterVille.filter((v) => v !== ville)
                                  );
                                }}
                                className="text-white"
                              >
                                {ville}
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
          </CardContent>
        </Card>

          {/* Tabs pour les différentes vues */}
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-3 h-auto mb-6">
            <TabsTrigger
              value="taches"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-2 text-sm"
            >
              <Kanban className="w-4 h-4 mr-1" />
              Par Tâches
            </TabsTrigger>
            <TabsTrigger
              value="utilisateurs"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-2 text-sm"
            >
              <User className="w-4 h-4 mr-1" />
              Par Utilisateur
            </TabsTrigger>
            <TabsTrigger
              value="calendrier"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-2 text-sm"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Calendrier
            </TabsTrigger>
          </TabsList>

          {/* Vue par Tâches */}
           <TabsContent value="taches" className="mt-0">
             <DragDropContext onDragEnd={handleDragEnd}>
               <div 
                 className="kanban-scroll-container"
                 ref={(el) => {
                   if (el) {
                     const handleDown = (e) => handleMouseDown(e, { current: el });
                     const handleMove = (e) => handleMouseMove(e, { current: el });
                     const handleUp = () => handleMouseUp({ current: el });
                     const handleLeave = () => handleMouseLeave({ current: el });
                     
                     el.onmousedown = handleDown;
                     el.onmousemove = handleMove;
                     el.onmouseup = handleUp;
                     el.onmouseleave = handleLeave;
                   }
                 }}
               >
                 <div className="flex gap-8 p-4" style={{ minWidth: 'max-content' }}>

                      {TACHES.map(tache => {
                    const cardsInColumn = cardsByTache[tache] || [];

                    return (
                      <div 
                         key={tache} 
                         className="kanban-column"
                      >
                        <Card 
                           className="bg-slate-800/40 backdrop-blur-xl shadow-xl flex flex-col"
                        >
                          <CardHeader className="pb-3 pt-3 border-b border-slate-700 bg-slate-700/30">
                            <div className="flex items-center justify-between w-full">
                              <Badge className="bg-slate-900/80 text-white font-bold text-xs px-2 py-0.5 mr-4">
                                {cardsInColumn.length}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <CardTitle className="text-base font-bold text-white tracking-wide">
                                  {tache}
                                </CardTitle>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSortTaches(prev => ({
                                        ...prev,
                                        [tache]: prev[tache] === "asc" ? "desc" : prev[tache] === "desc" ? null : "asc"
                                      }))}
                                      className={`h-8 px-2 text-xs font-medium ${sortTaches[tache] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50 hover:text-slate-300'}`}
                                    >
                                      {sortTaches[tache] === "asc" ? (
                                        <>
                                          <ArrowUp className="w-3 h-3 mr-1" />
                                          Plus anciens
                                        </>
                                      ) : sortTaches[tache] === "desc" ? (
                                        <>
                                          <ArrowDown className="w-3 h-3 mr-1" />
                                          Plus récents
                                        </>
                                      ) : (
                                        <>
                                          <Calendar className="w-3 h-3 mr-1" />
                                          Trier date
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Trier par date de livraison
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardHeader>
                          <Droppable droppableId={tache}>
                            {(provided, snapshot) => (
                              <CardContent
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="p-3 space-y-3 kanban-content"
                              >
                                {cardsInColumn.map((card, index) => (
                                  <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        data-is-dragging={snapshot.isDragging}
                                        style={provided.draggableProps.style}
                                      >
                                        {renderMandatCard(card, provided, snapshot)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
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
                    </div>
                    </DragDropContext>
                    </TabsContent>

          {/* Vue par Utilisateur */}
          <TabsContent value="utilisateurs" className="mt-0">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div 
                className="kanban-scroll-container"
                ref={(el) => {
                  if (el) {
                    const handleDown = (e) => handleMouseDown(e, { current: el });
                    const handleMove = (e) => handleMouseMove(e, { current: el });
                    const handleUp = () => handleMouseUp({ current: el });
                    const handleLeave = () => handleMouseLeave({ current: el });
                    
                    el.onmousedown = handleDown;
                    el.onmousemove = handleMove;
                    el.onmouseup = handleUp;
                    el.onmouseleave = handleLeave;
                  }
                }}
              >
                <div className="flex gap-8 p-4" style={{ minWidth: 'max-content' }}>
              
                  {usersList.map((user, userIndex) => {
                    const cardsInColumn = cardsByUtilisateur[user.email] || [];
                    const colorClass = getUserColor(userIndex);
                    const [bgColor, borderColor, gradientColor] = colorClass.split(' ');
                    
                    return (
                      <div 
                         key={user.email} 
                         className="kanban-column"
                      >
                        <Card 
                           className="bg-slate-800/40 backdrop-blur-xl shadow-xl flex flex-col"
                        >
                          <CardHeader className="pb-3 pt-3 border-b border-slate-700 bg-slate-700/30">
                            <div className="flex items-center justify-between w-full">
                              <Badge className="bg-slate-900/80 text-white font-bold text-xs px-2 py-0.5 mr-4">
                                {cardsInColumn.length}
                              </Badge>
                              <div className="flex items-center gap-2 min-w-0">
                                {user.email !== "non-assigne" ? (
                                  <Avatar className="w-6 h-6 border-2 border-white/20 flex-shrink-0">
                                    <AvatarImage src={user.photo_url} />
                                    <AvatarFallback className="text-xs bg-slate-900 text-white">
                                      {getUserInitials(user.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <User className="w-5 h-5 text-white flex-shrink-0" />
                                )}
                                <CardTitle className="text-base font-bold text-white tracking-wide whitespace-nowrap">
                                  {user.full_name}
                                </CardTitle>
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setSortUtilisateurs(prev => ({
                                        ...prev,
                                        [user.email]: prev[user.email] === "asc" ? "desc" : prev[user.email] === "desc" ? null : "asc"
                                      }))}
                                      className={`h-8 px-2 text-xs font-medium ${sortUtilisateurs[user.email] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50 hover:text-slate-300'}`}
                                    >
                                      {sortUtilisateurs[user.email] === "asc" ? (
                                        <>
                                          <ArrowUp className="w-3 h-3 mr-1" />
                                          Plus anciens
                                        </>
                                      ) : sortUtilisateurs[user.email] === "desc" ? (
                                        <>
                                          <ArrowDown className="w-3 h-3 mr-1" />
                                          Plus récents
                                        </>
                                      ) : (
                                        <>
                                          <Calendar className="w-3 h-3 mr-1" />
                                          Trier date
                                        </>
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Trier par date de livraison
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </CardHeader>
                          <Droppable droppableId={user.email}>
                            {(provided, snapshot) => (
                              <CardContent
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="p-3 space-y-3 kanban-content"
                              >
                                {cardsInColumn.map((card, index) => (
                                  <Draggable key={card.id} draggableId={card.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        data-is-dragging={snapshot.isDragging}
                                        style={provided.draggableProps.style}
                                      >
                                        {renderMandatCard(card, provided, snapshot)}
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
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
              </div>
            </DragDropContext>
          </TabsContent>

          {/* Vue Calendrier */}
          <TabsContent value="calendrier" className="mt-0">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    {calendarMode === "week" 
                      ? `Semaine du ${format(currentMonthStart, "d MMMM", { locale: fr })} au ${format(addDays(currentMonthStart, 4), "d MMMM yyyy", { locale: fr })}`
                      : format(currentMonthStart, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(currentMonthStart, "MMMM yyyy", { locale: fr }).slice(1)
                    }
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (calendarMode === "week") {
                          setCurrentMonthStart(addDays(currentMonthStart, -7));
                        } else {
                          setCurrentMonthStart(subMonths(currentMonthStart, 1));
                        }
                      }}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      ← Précédent
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setCurrentMonthStart(calendarMode === "week" ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date()))}
                      className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    >
                      Aujourd'hui
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (calendarMode === "week") {
                          setCurrentMonthStart(addDays(currentMonthStart, 7));
                        } else {
                          setCurrentMonthStart(addMonths(currentMonthStart, 1));
                        }
                      }}
                      className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      Suivant →
                    </Button>
                    <div className="h-6 w-px bg-slate-700 mx-1"></div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setCalendarMode("week");
                          setCurrentMonthStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                        }}
                        className={calendarMode === "week" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
                      >
                        Semaine
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setCalendarMode("month");
                          setCurrentMonthStart(startOfMonth(new Date()));
                        }}
                        className={calendarMode === "month" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
                      >
                        Mois
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                  {calendarMode === "week" ? (
                    <div className="grid grid-cols-5 gap-3">
                      {[0, 1, 2, 3, 4].map((dayOffset) => {
                        const day = addDays(currentMonthStart, dayOffset);
                        const dayId = `day-${format(day, "yyyy-MM-dd")}`;
                        const cardsForDay = filteredCards.filter(card => 
                          card.mandat.date_livraison && 
                          isSameDay(new Date(card.mandat.date_livraison + "T00:00:00"), day)
                        );

                        return (
                          <div 
                            key={dayOffset} 
                            className="space-y-2"
                            style={{ zIndex: 1 }}
                          >
                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                              <div className="text-center">
                                <h3 className="font-semibold text-white text-sm">
                                  {format(day, "EEEE", { locale: fr })}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  {format(day, "d MMM", { locale: fr })}
                                </p>
                              </div>
                            </div>

                            <Droppable droppableId={dayId}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`space-y-2 min-h-[400px] p-2 rounded-lg transition-colors ${
                                    snapshot.isDraggingOver ? 'bg-emerald-500/10 border-2 border-emerald-500/50' : ''
                                  }`}
                                >
                                  {cardsForDay.map((card, index) => (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          data-is-dragging={snapshot.isDragging}
                                          style={provided.draggableProps.style}
                                        >
                                          {renderMandatCard(card, provided, snapshot)}
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  {cardsForDay.length === 0 && !snapshot.isDraggingOver && (
                                    <div className="text-center py-8 text-slate-600 text-xs">
                                      Aucun mandat
                                    </div>
                                  )}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                      {getWeeksToDisplay().map((weekStart, weekIndex) => {
                        const weekEnd = endOfWeek(weekStart, { locale: fr });
                        const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })
                          .filter(day => day.getDay() !== 0 && day.getDay() !== 6);

                        return (
                          <Card key={weekIndex} className="border-slate-700 bg-slate-800/30">
                            <CardHeader className="pb-3 bg-slate-800/50 border-b border-slate-700">
                              <CardTitle className="text-sm text-slate-300">
                                Semaine du {format(addDays(weekStart, 1), "d MMMM", { locale: fr })} au {format(addDays(weekStart, 5), "d MMMM", { locale: fr })}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="grid grid-cols-5 divide-x divide-slate-700">
                                {daysOfWeek.map((day, dayIndex) => {
                                  const dayId = `day-${format(day, "yyyy-MM-dd")}`;
                                  const cardsForDay = filteredCards.filter(card => 
                                    card.mandat.date_livraison && 
                                    isSameDay(new Date(card.mandat.date_livraison + "T00:00:00"), day)
                                  );

                                  return (
                                    <div 
                                      key={dayIndex} 
                                      className="p-3 min-h-[200px]"
                                      style={{ zIndex: 1 }}
                                    >
                                      <div className="text-center mb-3">
                                        <p className="text-xs text-slate-500 uppercase">
                                          {format(day, "EEE", { locale: fr })}
                                        </p>
                                        <p className="text-lg font-bold text-white">
                                          {format(day, "d", { locale: fr })}
                                        </p>
                                      </div>
                                      <Droppable droppableId={dayId}>
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`space-y-2 rounded-lg transition-colors ${
                                              snapshot.isDraggingOver ? 'bg-emerald-500/10 border-2 border-emerald-500/50' : ''
                                            }`}
                                          >
                                            {cardsForDay.map((card, index) => (
                                              <Draggable key={card.id} draggableId={card.id} index={index}>
                                                {(provided, snapshot) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    data-is-dragging={snapshot.isDragging}
                                                    style={provided.draggableProps.style}
                                                  >
                                                    {renderMandatCard(card, provided, snapshot)}
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {cardsForDay.length === 0 && !snapshot.isDraggingOver && (
                                              <div className="text-center py-4 text-slate-600 text-xs">
                                                Aucun mandat
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </Droppable>
                                    </div>
                                  );
                                })}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </DragDropContext>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>

        {/* Dialog d'édition du dossier */}
        <EditDossierDialog
          isOpen={isEditingDialogOpen}
          onClose={() => {
            setIsEditingDialogOpen(false);
            setEditingDossier(null);
          }}
          dossier={editingDossier}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['dossiers'] });
          }}
          clients={clients}
          users={users}
        />
      </div>
    </div>
  );
}