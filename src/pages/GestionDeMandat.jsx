import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { useKanbanDrag } from "@/hooks/useKanbanDrag";
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
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Search, Kanban, MapPin, Calendar, User, ArrowUp, ArrowDown, Filter, X, ChevronDown, ChevronUp, Timer } from "lucide-react";
import { format, startOfWeek, eachDayOfInterval, endOfWeek, isSameDay, addDays, startOfMonth, endOfMonth, eachWeekOfInterval, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import EditDossierDialog from "../components/dossiers/EditDossierDialog";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const EQUIPES = ["Samuel", "Pierre-Luc", "Dany"];

// Mapping des utilisateurs à leurs équipes
const USER_TEAM_MAP = {
  "davevallee27@gmail.com": "Samuel"
  // Ajouter d'autres mappings au besoin
};

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
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
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

const getUserColor = (index) => {
  const colors = ["from-blue-500 to-blue-600", "from-purple-500 to-purple-600", "from-green-500 to-green-600", "from-orange-500 to-orange-600", "from-pink-500 to-pink-600", "from-cyan-500 to-cyan-600", "from-yellow-500 to-yellow-600", "from-red-500 to-red-600"];
  return colors[index % colors.length];
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

// Hook importé depuis hooks/useKanbanDrag.js

// Ghost card rendu dans un portal
function GhostCard({ card, pos, clients, users }) {
  if (!card) return null;
  const assignedUser = users.find(u => u.email === card.mandat.utilisateur_assigne);
  const arpColor = getArpenteurColor(card.dossier.arpenteur_geometre);
  const clientsNames = clients.filter(c => card.dossier.clients_ids?.includes(c.id)).map(c => `${c.prenom} ${c.nom}`).join(', ') || '-';

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.x - 135,
        top: pos.y - 30,
        width: 270,
        zIndex: 99999,
        pointerEvents: 'none',
        opacity: 0.92,
        transform: 'rotate(2deg) scale(1.04)',
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))',
        transition: 'none',
      }}
    >
      <div className={`${arpColor.split(' ')[0]} rounded-lg p-2 border ${arpColor.split(' ')[2]}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={`${arpColor} border text-xs`}>
            {getArpenteurInitials(card.dossier.arpenteur_geometre)}{card.dossier.numero_dossier}
          </Badge>
          <Badge className={`${getMandatColor(card.mandat.type_mandat)} border text-xs font-semibold`}>
            {getAbbreviatedMandatType(card.mandat.type_mandat)}
          </Badge>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <User className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-xs text-white font-medium truncate">{clientsNames}</span>
        </div>
        {card.mandat.adresse_travaux && formatAdresse(card.mandat.adresse_travaux) && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate">{formatAdresse(card.mandat.adresse_travaux)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
          {card.mandat.date_livraison ? (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-yellow-300">{format(new Date(card.mandat.date_livraison + "T00:00:00"), "dd MMM yy", { locale: fr })}</span>
            </div>
          ) : <div />}
          {assignedUser && (
            <Avatar className="w-6 h-6 border-2 border-emerald-500/50">
              <AvatarImage src={assignedUser.photo_url} />
              <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function GestionDeMandat() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArpenteur, setFilterArpenteur] = useState([]);
  const [filterTypeMandat, setFilterTypeMandat] = useState([]);
  const [filterUtilisateur, setFilterUtilisateur] = useState([]);
  const [filterVille, setFilterVille] = useState([]);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState("taches");
  const [currentMonthStart, setCurrentMonthStart] = useState(startOfMonth(new Date()));
  const [calendarMode, setCalendarMode] = useState("week");
  const [sortTaches, setSortTaches] = useState({});
  const [sortUtilisateurs, setSortUtilisateurs] = useState({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterPlaceAffaire, setFilterPlaceAffaire] = useState("Toutes");
  const [filterPlaceAffaireCalendrier, setFilterPlaceAffaireCalendrier] = useState("Toutes");
  const [filterEquipe, setFilterEquipe] = useState("Toutes");
  const [isEntreeTempsDialogOpen, setIsEntreeTempsDialogOpen] = useState(false);
  const [entreeTempsCardInfo, setEntreeTempsCardInfo] = useState(null);
  const [entreeTempsForm, setEntreeTempsForm] = useState({
    date: new Date().toISOString().split('T')[0],
    heures: "", tache: "", tache_suivante: "", utilisateur_assigne: ""
  });

  const queryClient = useQueryClient();

  const { data: dossiers = [] } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list('-created_date'), initialData: [] });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [], staleTime: 0, refetchInterval: 5000 });
  const { data: lots = [] } = useQuery({ queryKey: ['lots'], queryFn: () => base44.entities.Lot.list(), initialData: [] });
  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, dossierData }) => base44.entities.Dossier.update(id, dossierData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dossiers'] }),
  });

  const getClientsNames = (clientIds) => {
    if (!clientIds?.length) return "-";
    return clientIds.map(id => { const c = clients.find(cl => cl.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(n => n).join(", ");
  };

  const getMandatsCards = () => {
    const cards = [];
    dossiers.filter(d => d.statut === "Ouvert" || d.statut === "Fermé").forEach(dossier => {
      dossier.mandats?.forEach((mandat, mandatIndex) => {
        cards.push({
          id: `${dossier.id}-${mandatIndex}`,
          dossierId: dossier.id,
          mandatIndex,
          dossier,
          mandat,
          tache: mandat.tache_actuelle || "Ouverture",
          utilisateur: mandat.utilisateur_assigne || "non-assigne"
        });
      });
    });
    return cards;
  };

  const allCards = getMandatsCards();

  const uniqueVilles = [...new Set(allCards.filter(c => c.mandat.adresse_travaux?.ville).map(c => c.mandat.adresse_travaux.ville))].sort();

  const filteredCards = allCards.filter(card => {
    const searchLower = searchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(card.dossier.arpenteur_geometre) + card.dossier.numero_dossier;
    const clientsNames = getClientsNames(card.dossier.clients_ids);
    const addressFormatted = formatAdresse(card.mandat.adresse_travaux);
    const ville = card.mandat.adresse_travaux?.ville || "";
    return (
      (fullNumber.toLowerCase().includes(searchLower) || card.dossier.numero_dossier?.toLowerCase().includes(searchLower) || clientsNames.toLowerCase().includes(searchLower) || card.mandat.type_mandat?.toLowerCase().includes(searchLower) || addressFormatted.toLowerCase().includes(searchLower) || ville.toLowerCase().includes(searchLower)) &&
      (filterArpenteur.length === 0 || filterArpenteur.includes(card.dossier.arpenteur_geometre)) &&
      (filterTypeMandat.length === 0 || filterTypeMandat.includes(card.mandat.type_mandat)) &&
      (filterUtilisateur.length === 0 || filterUtilisateur.includes(card.mandat.utilisateur_assigne)) &&
      (filterVille.length === 0 || filterVille.includes(card.mandat.adresse_travaux?.ville)) &&
      (filterPlaceAffaire === "Toutes" || card.dossier.place_affaire === filterPlaceAffaire)
    );
  });

  const sortCards = (cards, sortKey, sortMap) => {
    if (!sortMap[sortKey]) return cards;
    return [...cards].sort((a, b) => {
      const dA = a.mandat.date_livraison ? new Date(a.mandat.date_livraison) : new Date(0);
      const dB = b.mandat.date_livraison ? new Date(b.mandat.date_livraison) : new Date(0);
      return sortMap[sortKey] === "asc" ? dA - dB : dB - dA;
    });
  };

  const cardsByTache = TACHES.reduce((acc, tache) => {
    acc[tache] = sortCards(filteredCards.filter(c => c.tache === tache), tache, sortTaches);
    return acc;
  }, {});

  const usersList = [...users, { email: "non-assigne", full_name: "Non assigné" }];
  
  const cardsByUtilisateur = usersList.reduce((acc, user) => {
    acc[user.email] = sortCards(filteredCards.filter(c => c.utilisateur === user.email || (c.utilisateur === "non-assigne" && user.email === "non-assigne")), user.email, sortUtilisateurs);
    return acc;
  }, {});

  const getUserTeam = (user) => {
    if (user.email === "non-assigne") return null;
    return USER_TEAM_MAP[user.email] || (user.full_name && EQUIPES.find(equipe => user.full_name.includes(equipe)));
  };

  const filteredUsersList = filterEquipe === "Toutes" 
    ? usersList 
    : usersList.filter(u => u.email !== "non-assigne" && getUserTeam(u) === filterEquipe);

  const handleDrop = useCallback((card, targetColumn) => {
    if (!card) return;
    const dossier = card.dossier;

    if (activeView === "taches") {
      if (card.tache === targetColumn) return;
      const updatedMandats = dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) {
          const updated = { ...m, tache_actuelle: targetColumn };
          // Si la tâche devient "Cédule", ajouter une nouvelle entrée terrain
          if (targetColumn === "Cédule") {
            updated.statut_terrain = "en_verification";
            // Ajouter une nouvelle entrée terrain (toujours, même s'il en existe déjà)
            if (!updated.terrains_list) {
              updated.terrains_list = [];
            }
            updated.terrains_list.push({
              date_limite_leve: null,
              instruments_requis: "",
              a_rendez_vous: false,
              date_rendez_vous: null,
              heure_rendez_vous: "",
              donneur: "",
              technicien: "",
              dossier_simultane: "",
              temps_prevu: "",
              notes: "",
              date_cedulee: new Date().toISOString().split('T')[0],
              equipe_assignee: ""
            });
          }
          return updated;
        }
        return m;
      });
      updateDossierMutation.mutate({ id: dossier.id, dossierData: { ...dossier, mandats: updatedMandats } }, {
        onSuccess: () => {
          setEntreeTempsCardInfo({ dossierId: dossier.id, mandatType: card.mandat.type_mandat, nouvelleTache: targetColumn, ancienneTache: card.tache });
          setEntreeTempsForm({ date: new Date().toISOString().split('T')[0], heures: "", tache: card.tache, tache_suivante: targetColumn, utilisateur_assigne: card.mandat.utilisateur_assigne || "" });
          setIsEntreeTempsDialogOpen(true);
        }
      });
    } else if (activeView === "utilisateurs") {
      if (card.utilisateur === targetColumn) return;
      const nouvelUtilisateur = targetColumn === "non-assigne" ? "" : targetColumn;
      const updatedMandats = dossier.mandats.map((m, idx) => idx === card.mandatIndex ? { ...m, utilisateur_assigne: nouvelUtilisateur } : m);
      updateDossierMutation.mutate({ id: dossier.id, dossierData: { ...dossier, mandats: updatedMandats } });
    } else if (activeView === "calendrier") {
      const newDateStr = targetColumn.replace("day-", "");
      const updatedMandats = dossier.mandats.map((m, idx) => idx === card.mandatIndex ? { ...m, date_livraison: newDateStr } : m);
      updateDossierMutation.mutate({ id: dossier.id, dossierData: { ...dossier, mandats: updatedMandats } });
    }
  }, [activeView, updateDossierMutation]);

  const { dragging, ghostPos, overColumn, handleDragStart } = useKanbanDrag({ onDrop: handleDrop });

  const handleCardClick = (card) => {
    if (dragging) return;
    setEditingDossier({ ...card.dossier, initialMandatIndex: card.mandatIndex });
    setIsEditingDialogOpen(true);
  };

  const getWeeksToDisplay = () => {
    return eachWeekOfInterval({ start: startOfMonth(currentMonthStart), end: endOfMonth(currentMonthStart) }, { locale: fr });
  };

  const renderCard = (card) => {
    const assignedUser = users.find(u => u.email === card.mandat.utilisateur_assigne);
    const arpColor = getArpenteurColor(card.dossier.arpenteur_geometre);
    const [bg, text, border] = arpColor.split(' ');
    const isDraggingThis = dragging?.card?.id === card.id;
    const tacheIndex = TACHES.indexOf(card.mandat.tache_actuelle);
    const progress = tacheIndex >= 0 ? Math.round(((tacheIndex / (TACHES.length - 1)) * 95) / 5) * 5 : 0;

    return (
      <div
        key={card.id}
        onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, card); }}
        onClick={() => handleCardClick(card)}
        className={`${bg} rounded-lg p-2 mb-2 border ${border} cursor-grab select-none transition-all duration-150 hover:shadow-lg hover:scale-[1.02] ${isDraggingThis ? 'opacity-30 scale-95' : ''}`}
        style={{ cursor: dragging ? (isDraggingThis ? 'grabbing' : 'inherit') : 'grab' }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>
            {getArpenteurInitials(card.dossier.arpenteur_geometre)}{card.dossier.numero_dossier}
          </Badge>
          <Badge className={`${getMandatColor(card.mandat.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
            {getAbbreviatedMandatType(card.mandat.type_mandat)}
          </Badge>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <User className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-xs text-white font-medium truncate">{getClientsNames(card.dossier.clients_ids)}</span>
        </div>
        {card.mandat.adresse_travaux && formatAdresse(card.mandat.adresse_travaux) && (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-400 truncate">{formatAdresse(card.mandat.adresse_travaux)}</span>
          </div>
        )}
        {card.mandat.tache_actuelle && (
          <div className="mb-1">
            <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">{card.mandat.tache_actuelle}</Badge>
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
          {card.mandat.date_livraison ? (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-yellow-400 flex-shrink-0" />
              <span className="text-xs text-yellow-300">{format(new Date(card.mandat.date_livraison + "T00:00:00"), "dd MMM yy", { locale: fr })}</span>
            </div>
          ) : <div />}
          {assignedUser ? (
            <Avatar className="w-6 h-6 border-2 border-emerald-500/50">
              <AvatarImage src={assignedUser.photo_url} />
              <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
              <User className="w-3 h-3 text-emerald-500" />
            </div>
          )}
        </div>
        <div className="mt-2 w-full bg-slate-900/50 h-4 rounded-full overflow-hidden border border-slate-700/50 relative">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white drop-shadow-md leading-none">{progress}%</span>
          </div>
        </div>
      </div>
    );
  };

  const renderColumn = (columnId, title, cards, headerContent) => {
    const isOver = overColumn === columnId && dragging;
    return (
      <div
        key={columnId}
        data-kanban-column={columnId}
        style={{ flex: '0 0 270px', minWidth: 270, maxWidth: 270 }}
      >
        <div className={`rounded-xl border transition-all duration-150 flex flex-col ${isOver ? 'border-emerald-400/80 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' : 'border-slate-700/50 bg-slate-800/40'}`}>
          <div className="px-3 py-2.5 border-b border-slate-700/50 bg-slate-700/30 rounded-t-xl">
            {headerContent}
          </div>
          <div className="p-3 min-h-[120px]">
            {cards.map(card => renderCard(card))}
            {cards.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">Aucun mandat</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSortButton = (key, sortMap, setSortMap) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setSortMap(prev => ({ ...prev, [key]: prev[key] === "asc" ? "desc" : prev[key] === "desc" ? null : "asc" })); }}
            className={`h-7 px-2 text-xs font-medium ${sortMap[key] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50 hover:text-slate-300'}`}
          >
            {sortMap[key] === "asc" ? <><ArrowUp className="w-3 h-3 mr-1" />Anciens</> : sortMap[key] === "desc" ? <><ArrowDown className="w-3 h-3 mr-1" />Récents</> : <><Calendar className="w-3 h-3 mr-1" />Trier</>}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Trier par date de livraison</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      {/* Ghost card pendant le drag */}
      {dragging && <GhostCard card={dragging.card} pos={ghostPos} clients={clients} users={users} />}

      <div className="w-full">
        <div className="pb-4 pt-4">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Gestion de Mandat
            </h1>
            <Kanban className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-slate-400 mb-6">Vue Kanban de vos mandats</p>

          {/* Filtres */}
          <Card className="!border-0 !shadow-none bg-slate-900/50 backdrop-blur-xl mb-6">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800/50 border-slate-700 text-white" />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative">
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="text-sm">Filtres</span>
                    {(filterArpenteur.length + filterTypeMandat.length + filterUtilisateur.length + filterVille.length) > 0 && (
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
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30 mb-2">
                        <div className="flex items-center gap-2"><Filter className="w-3 h-3 text-emerald-500" /><h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4></div>
                        {(filterArpenteur.length + filterTypeMandat.length + filterUtilisateur.length + filterVille.length) > 0 && (
                          <Button variant="ghost" size="sm" onClick={() => { setFilterArpenteur([]); setFilterTypeMandat([]); setFilterUtilisateur([]); setFilterVille([]); }} className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2">
                            <X className="w-2.5 h-2.5 mr-1" />Réinitialiser
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Arpenteurs", items: ARPENTEURS, filter: filterArpenteur, setFilter: setFilterArpenteur },
                          { label: "Mandats", items: TYPES_MANDATS, filter: filterTypeMandat, setFilter: setFilterTypeMandat },
                          { label: "Utilisateurs", items: users.map(u => u.email), filter: filterUtilisateur, setFilter: setFilterUtilisateur, labels: users.reduce((a, u) => ({ ...a, [u.email]: u.full_name }), {}) },
                          { label: "Villes", items: uniqueVilles, filter: filterVille, setFilter: setFilterVille }
                        ].map(({ label, items, filter, setFilter, labels }) => (
                          <DropdownMenu key={label}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                                <span className="truncate">{label} ({filter.length > 0 ? filter.length : 'Tous'})</span>
                                <ChevronDown className="w-3 h-3 flex-shrink-0" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 max-h-64 overflow-y-auto">
                              {items.map(item => (
                                <DropdownMenuCheckboxItem key={item} checked={filter.includes(item)} onCheckedChange={(checked) => setFilter(checked ? [...filter, item] : filter.filter(i => i !== item))} className="text-white">
                                  {labels ? labels[item] : item}
                                </DropdownMenuCheckboxItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>

          {/* Vues */}
          <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
            <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-3 h-auto mb-6">
              <TabsTrigger value="taches" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-2 text-sm">
                <Kanban className="w-4 h-4 mr-1" />Par Tâches
              </TabsTrigger>
              <TabsTrigger value="utilisateurs" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-2 text-sm">
                <User className="w-4 h-4 mr-1" />Par Utilisateur
              </TabsTrigger>
              <TabsTrigger value="calendrier" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-2 text-sm">
                <Calendar className="w-4 h-4 mr-1" />Calendrier
              </TabsTrigger>
            </TabsList>

            {/* Vue par Tâches */}
            <TabsContent value="taches" className="mt-0">
              {/* Filtre Place d'affaire */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-slate-400 text-sm">Filtrer par place d'affaire</span>
                {["Toutes", "Alma", "Saguenay"].map(place => {
                  // Calculer le compte sans le filtre place d'affaire
                  const baseFiltered = allCards.filter(c => {
                    const s = searchTerm.toLowerCase();
                    const fn = getArpenteurInitials(c.dossier.arpenteur_geometre) + c.dossier.numero_dossier;
                    const cn = getClientsNames(c.dossier.clients_ids);
                    return (fn.toLowerCase().includes(s) || c.dossier.numero_dossier?.toLowerCase().includes(s) || cn.toLowerCase().includes(s) || c.mandat.type_mandat?.toLowerCase().includes(s)) &&
                      (filterArpenteur.length === 0 || filterArpenteur.includes(c.dossier.arpenteur_geometre)) &&
                      (filterTypeMandat.length === 0 || filterTypeMandat.includes(c.mandat.type_mandat)) &&
                      (filterUtilisateur.length === 0 || filterUtilisateur.includes(c.mandat.utilisateur_assigne)) &&
                      (filterVille.length === 0 || filterVille.includes(c.mandat.adresse_travaux?.ville));
                  });
                  const count = place === "Toutes"
                    ? baseFiltered.length
                    : baseFiltered.filter(c => c.dossier.place_affaire === place).length;
                  const isActive = filterPlaceAffaire === place;
                  return (
                    <button
                      key={place}
                      onClick={() => setFilterPlaceAffaire(place)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all border-0 ${
                        isActive
                          ? "text-white bg-transparent"
                          : "text-slate-400 bg-transparent hover:text-slate-300"
                      }`}
                    >
                      <span>{place}</span>
                      <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[20px] h-5 px-1.5 ${
                        isActive ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div data-kanban-scroll className="overflow-x-auto pb-4" style={{ cursor: dragging ? 'grabbing' : 'default' }}>
                <div className="flex gap-4 p-2" style={{ minWidth: 'max-content' }}>
                  {TACHES.map(tache => renderColumn(tache, tache, cardsByTache[tache] || [],
                    <div className="flex items-center justify-between w-full">
                      <Badge className="bg-slate-900/80 text-white font-bold text-xs px-2 py-0.5">{(cardsByTache[tache] || []).length}</Badge>
                      <span className="text-sm font-bold text-white">{tache}</span>
                      {renderSortButton(tache, sortTaches, setSortTaches)}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Vue par Utilisateur */}
            <TabsContent value="utilisateurs" className="mt-0">
              {/* Filtre Équipe */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-slate-400 text-sm">Filtrer par équipe</span>
                {["Toutes", ...EQUIPES].map(equipe => {
                  const count = equipe === "Toutes"
                    ? usersList.length
                    : usersList.filter(u => u.email === "non-assigne" || getUserTeam(u) === equipe).length;
                  const isActive = filterEquipe === equipe;
                  return (
                    <button
                      key={equipe}
                      onClick={() => setFilterEquipe(equipe)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all border-0 ${
                        isActive ? "text-white bg-transparent" : "text-slate-400 bg-transparent hover:text-slate-300"
                      }`}
                    >
                      <span>{equipe}</span>
                      <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[20px] h-5 px-1.5 ${
                        isActive ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div data-kanban-scroll className="overflow-x-auto pb-4" style={{ cursor: dragging ? 'grabbing' : 'default' }}>
                <div className="flex gap-4 p-2" style={{ minWidth: 'max-content' }}>
                  {filteredUsersList.map((user, userIndex) => renderColumn(user.email, user.full_name, cardsByUtilisateur[user.email] || [],
                    <div className="flex items-center justify-between w-full">
                      <Badge className="bg-slate-900/80 text-white font-bold text-xs px-2 py-0.5">{(cardsByUtilisateur[user.email] || []).length}</Badge>
                      <div className="flex items-center gap-2">
                        {user.email !== "non-assigne" ? (
                          <Avatar className="w-5 h-5 border border-white/20">
                            <AvatarImage src={user.photo_url} />
                            <AvatarFallback className="text-xs bg-slate-900 text-white">{getUserInitials(user.full_name)}</AvatarFallback>
                          </Avatar>
                        ) : <User className="w-4 h-4 text-white" />}
                        <span className="text-sm font-bold text-white truncate max-w-[110px]">{user.prenom} {user.nom}</span>
                      </div>
                      {renderSortButton(user.email, sortUtilisateurs, setSortUtilisateurs)}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Vue Calendrier */}
            <TabsContent value="calendrier" className="mt-0">
              {/* Filtre Place d'affaire */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-slate-400 text-sm">Filtrer par place d'affaire</span>
                {["Toutes", "Alma", "Saguenay"].map(place => {
                  const count = place === "Toutes"
                    ? filteredCards.length
                    : filteredCards.filter(c => c.dossier.place_affaire === place).length;
                  const isActive = filterPlaceAffaireCalendrier === place;
                  return (
                    <button
                      key={place}
                      onClick={() => setFilterPlaceAffaireCalendrier(place)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all border-0 ${
                        isActive ? "text-white bg-transparent" : "text-slate-400 bg-transparent hover:text-slate-300"
                      }`}
                    >
                      <span>{place}</span>
                      <span className={`inline-flex items-center justify-center rounded-full text-xs font-bold min-w-[20px] h-5 px-1.5 ${
                        isActive ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-300"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
              <Card className="!border-0 !shadow-none bg-slate-900/50 backdrop-blur-xl">
                <CardHeader className="border-b border-slate-800">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <CardTitle className="text-white text-sm">
                      {calendarMode === "week"
                        ? `Semaine du ${format(currentMonthStart, "d MMMM", { locale: fr })} au ${format(addDays(currentMonthStart, 4), "d MMMM yyyy", { locale: fr })}`
                        : format(currentMonthStart, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(currentMonthStart, "MMMM yyyy", { locale: fr }).slice(1)
                      }
                    </CardTitle>
                    <div className="flex gap-2 items-center flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => setCurrentMonthStart(calendarMode === "week" ? addDays(currentMonthStart, -7) : subMonths(currentMonthStart, 1))} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">← Précédent</Button>
                      <Button size="sm" onClick={() => setCurrentMonthStart(calendarMode === "week" ? startOfWeek(new Date(), { weekStartsOn: 1 }) : startOfMonth(new Date()))} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">Aujourd'hui</Button>
                      <Button size="sm" variant="outline" onClick={() => setCurrentMonthStart(calendarMode === "week" ? addDays(currentMonthStart, 7) : addMonths(currentMonthStart, 1))} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Suivant →</Button>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => { setCalendarMode("week"); setCurrentMonthStart(startOfWeek(new Date(), { weekStartsOn: 1 })); }} className={calendarMode === "week" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-white"}>Semaine</Button>
                        <Button size="sm" onClick={() => { setCalendarMode("month"); setCurrentMonthStart(startOfMonth(new Date())); }} className={calendarMode === "month" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-white"}>Mois</Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {calendarMode === "week" ? (
                    <div className="grid grid-cols-5 gap-3">
                      {[0,1,2,3,4].map(dayOffset => {
                        const day = addDays(currentMonthStart, dayOffset);
                        const dayId = `day-${format(day, "yyyy-MM-dd")}`;
                        const cardsForDay = filteredCards.filter(c => c.mandat.date_livraison && isSameDay(new Date(c.mandat.date_livraison + "T00:00:00"), day) && (filterPlaceAffaireCalendrier === "Toutes" || c.dossier.place_affaire === filterPlaceAffaireCalendrier));
                        const isOver = overColumn === dayId && dragging;
                        return (
                          <div key={dayOffset} data-kanban-column={dayId} className={`rounded-lg border min-h-[400px] p-2 transition-all ${isOver ? 'border-emerald-400/80 bg-emerald-500/10' : 'border-slate-700/50'}`}>
                            <div className="text-center mb-3 bg-slate-800/50 rounded-lg p-2">
                              <h3 className="font-semibold text-white text-sm capitalize">{format(day, "EEEE", { locale: fr })}</h3>
                              <p className="text-xs text-slate-400">{format(day, "d MMM", { locale: fr })}</p>
                            </div>
                            {cardsForDay.map(card => renderCard(card))}
                            {cardsForDay.length === 0 && <div className="text-center py-8 text-slate-600 text-xs">Aucun mandat</div>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getWeeksToDisplay().map((weekStart, weekIndex) => {
                        const daysOfWeek = eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { locale: fr }) }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
                        return (
                          <Card key={weekIndex} className="!border-0 !shadow-none bg-slate-800/30">
                            <CardHeader className="pb-3 bg-slate-800/50 border-b border-slate-700">
                              <CardTitle className="text-sm text-slate-300">
                                Semaine du {format(addDays(weekStart, 1), "d MMMM", { locale: fr })} au {format(addDays(weekStart, 5), "d MMMM", { locale: fr })}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="grid grid-cols-5 divide-x divide-slate-700">
                                {daysOfWeek.map((day, dayIndex) => {
                                  const dayId = `day-${format(day, "yyyy-MM-dd")}`;
                                  const cardsForDay = filteredCards.filter(c => c.mandat.date_livraison && isSameDay(new Date(c.mandat.date_livraison + "T00:00:00"), day) && (filterPlaceAffaireCalendrier === "Toutes" || c.dossier.place_affaire === filterPlaceAffaireCalendrier));
                                  const isOver = overColumn === dayId && dragging;
                                  return (
                                    <div key={dayIndex} data-kanban-column={dayId} className={`p-3 min-h-[200px] transition-all ${isOver ? 'bg-emerald-500/10' : ''}`}>
                                      <div className="text-center mb-3">
                                        <p className="text-xs text-slate-500 uppercase">{format(day, "EEE", { locale: fr })}</p>
                                        <p className="text-lg font-bold text-white">{format(day, "d", { locale: fr })}</p>
                                      </div>
                                      {cardsForDay.map(card => renderCard(card))}
                                      {cardsForDay.length === 0 && <div className="text-center py-4 text-slate-600 text-xs">Aucun</div>}
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <EditDossierDialog
          isOpen={isEditingDialogOpen}
          onClose={() => { setIsEditingDialogOpen(false); setEditingDossier(null); }}
          dossier={editingDossier}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['dossiers'] })}
          clients={clients}
          users={users}
        />

        {/* Dialog entrée de temps */}
        <Dialog open={isEntreeTempsDialogOpen} onOpenChange={setIsEntreeTempsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Nouvelle entrée de temps</DialogTitle>
              {entreeTempsCardInfo && (() => {
                const dossier = dossiers.find(d => d.id === entreeTempsCardInfo.dossierId);
                const arpColor = getArpenteurColor(dossier?.arpenteur_geometre);
                return (
                  <div className={`text-base font-semibold flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-slate-700 ${arpColor.split(' ')[1]}`}>
                    <span>{getArpenteurInitials(dossier?.arpenteur_geometre)}{dossier?.numero_dossier}{dossier?.clients_ids?.length > 0 && ` - ${getClientsNames(dossier.clients_ids)}`}</span>
                    <Badge className={`${getMandatColor(entreeTempsCardInfo.mandatType)} border text-xs`}>{getAbbreviatedMandatType(entreeTempsCardInfo.mandatType)}</Badge>
                  </div>
                );
              })()}
            </DialogHeader>
            <div className="border border-slate-700 bg-slate-800/30 rounded-lg">
              <div className="py-2 px-3 bg-lime-900/20 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-lime-500/30 flex items-center justify-center"><Timer className="w-3 h-3 text-lime-400" /></div>
                <h3 className="text-lime-300 text-sm font-semibold">Détails de l'entrée</h3>
              </div>
              <div className="p-3 space-y-3">
                {/* Ligne 1 : Date + Temps + Utilisateur assigné */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                    <Input type="date" value={entreeTempsForm.date} onChange={(e) => setEntreeTempsForm({...entreeTempsForm, date: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Temps (heures) <span className="text-red-400">*</span></Label>
                    <Input type="number" step="0.25" min="0" value={entreeTempsForm.heures} onChange={(e) => setEntreeTempsForm({...entreeTempsForm, heures: e.target.value})} placeholder="Ex: 2.5" className="bg-slate-700 border-slate-600 text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                    <Select value={entreeTempsForm.utilisateur_assigne} onValueChange={(v) => setEntreeTempsForm({...entreeTempsForm, utilisateur_assigne: v})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{users.map(u => <SelectItem key={u.email} value={u.email} className="text-white">{u.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Ligne 2 : Tâche accomplie + Tâche suivante */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Tâche accomplie <span className="text-red-400">*</span></Label>
                    <Select value={entreeTempsForm.tache} onValueChange={(v) => setEntreeTempsForm({...entreeTempsForm, tache: v})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{TACHES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Tâche suivante</Label>
                    <Select value={entreeTempsForm.tache_suivante} onValueChange={(v) => setEntreeTempsForm({...entreeTempsForm, tache_suivante: v})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">{TACHES.map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={() => { setIsEntreeTempsDialogOpen(false); setEntreeTempsCardInfo(null); }}>Annuler</Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={async () => {
                if (!entreeTempsForm.heures || !entreeTempsForm.tache) { alert("Veuillez remplir tous les champs obligatoires"); return; }
                const heures = parseFloat(entreeTempsForm.heures);
                if (isNaN(heures) || heures <= 0) { alert("Veuillez entrer un nombre d'heures valide"); return; }
                await base44.entities.EntreeTemps.create({ date: entreeTempsForm.date, heures, dossier_id: entreeTempsCardInfo.dossierId, mandat: entreeTempsCardInfo.mandatType, tache: entreeTempsForm.tache, utilisateur_email: currentUser?.email });
                if (entreeTempsForm.tache_suivante || entreeTempsForm.utilisateur_assigne) {
                  const dossier = dossiers.find(d => d.id === entreeTempsCardInfo.dossierId);
                  if (dossier?.mandats) {
                    const updatedMandats = dossier.mandats.map(m => m.type_mandat === entreeTempsCardInfo.mandatType ? { ...m, tache_actuelle: entreeTempsForm.tache_suivante || m.tache_actuelle, utilisateur_assigne: entreeTempsForm.utilisateur_assigne || m.utilisateur_assigne } : m);
                    await base44.entities.Dossier.update(dossier.id, { ...dossier, mandats: updatedMandats });
                  }
                }
                if (entreeTempsForm.utilisateur_assigne && entreeTempsForm.tache_suivante) {
                  const dossier = dossiers.find(d => d.id === entreeTempsCardInfo.dossierId);
                  await base44.entities.Notification.create({ utilisateur_email: entreeTempsForm.utilisateur_assigne, titre: "Nouvelle tâche assignée", message: `${currentUser?.full_name} vous a assigné la tâche "${entreeTempsForm.tache_suivante}" pour le dossier ${getArpenteurInitials(dossier?.arpenteur_geometre)}${dossier?.numero_dossier}.`, type: "dossier", dossier_id: entreeTempsCardInfo.dossierId, lue: false });
                }
                queryClient.invalidateQueries({ queryKey: ['dossiers'] });
                queryClient.invalidateQueries({ queryKey: ['entreeTemps'] });
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                setIsEntreeTempsDialogOpen(false);
                setEntreeTempsCardInfo(null);
                setEntreeTempsForm({ date: new Date().toISOString().split('T')[0], heures: "", tache: "", tache_suivante: "", utilisateur_assigne: "" });
              }}>Enregistrer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}