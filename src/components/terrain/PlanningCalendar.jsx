import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ReactDOM from "react-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Users, Truck, Wrench, Plus, Edit, X, MapPin, Calendar, User, Clock, UserCheck, Link2, Unlink, Timer, AlertCircle, Copy, Lock, Unlock, Sparkles, Loader, Trash2, Eye, EyeOff } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import EditDossierDialog from "../dossiers/EditDossierDialog";
import TerrainVerificationCard from "./TerrainVerificationCard";
import CreateTeamTerrainDialog from "./CreateTeamTerrainDialog";
import EditTeamDialog from "./EditTeamDialog";
import MultiRouteMap from "./MultiRouteMap";
import { useKanbanDrag } from "@/hooks/useKanbanDrag";
import LinkedGroupManager from "./LinkedGroupManager";
import LinkedCardsConnector from "./LinkedCardsConnector";
import { useStickySidebar } from "@/hooks/useStickySidebar";

// Congés fériés
const getHolidays = (year) => {
  const a = year % 19; const b = Math.floor(year / 100); const c = year % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
  const easterMonday = new Date(easter); easterMonday.setDate(easter.getDate() + 1);
  const labourDay = new Date(year, 8, 1);
  while (labourDay.getDay() !== 1) labourDay.setDate(labourDay.getDate() + 1);
  const thanksgiving = new Date(year, 9, 1); let mondayCount = 0;
  while (mondayCount < 2) { if (thanksgiving.getDay() === 1) mondayCount++; if (mondayCount < 2) thanksgiving.setDate(thanksgiving.getDate() + 1); }
  return [
    { date: `${year}-01-01`, name: "Jour de l'An" }, { date: `${year}-01-02`, name: "Lendemain du Jour de l'An (QC)" },
    { date: format(goodFriday, "yyyy-MM-dd"), name: "Vendredi saint" }, { date: format(easterMonday, "yyyy-MM-dd"), name: "Lundi de Pâques" },
    { date: format(new Date(year, 4, 1 + (1 - new Date(year, 4, 1).getDay() + 7) % 7 + 14), "yyyy-MM-dd"), name: "Fête de la Reine" },
    { date: `${year}-06-24`, name: "Fête nationale du Québec" }, { date: `${year}-07-01`, name: "Fête du Canada" },
    { date: format(labourDay, "yyyy-MM-dd"), name: "Fête du Travail" }, { date: format(thanksgiving, "yyyy-MM-dd"), name: "Action de grâces" },
    { date: `${year}-12-25`, name: "Noël" }, { date: `${year}-12-26`, name: "Lendemain de Noël" },
  ];
};
const isHoliday = (date) => { const holidays = getHolidays(date.getFullYear()); return holidays.find(h => h.date === format(date, "yyyy-MM-dd")); };

const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};
const getArpenteurColor = (arpenteur) => {
  const colors = { "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};
const getMandatColor = (typeMandat) => {
  const colors = { "Bornage": "bg-red-500/20 text-red-400 border-red-500/30", "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30", "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30", "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30", "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30", "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30", "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30", "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};
const getAbbreviatedMandatType = (type) => {
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

// Carte complète pour le ghost (même contenu que DossierCard mais sans interactions)
function GhostCardFull({ card, clients, users }) {
  const { dossier, mandat, terrain } = card;
  const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
  const clientsNames = clients.filter(c => dossier.clients_ids?.includes(c.id)).map(c => `${c.prenom} ${c.nom}`).join(', ') || '-';
  const assignedUser = mandat?.utilisateur_assigne ? users?.find(u => u.email === mandat.utilisateur_assigne) : null;
  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
  };
  const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const parseTimeString = (ts) => { if (!ts) return 0; const m = ts.match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[0]) : 0; };

  return (
    <div
      className={`${arpColor.split(' ')[0]} rounded-xl p-2`}
      style={{ boxShadow: `inset 0 0 0 1px ${arpColor.split(' ')[2]?.replace('border-', '') || 'rgba(16,185,129,0.6)'}, 0 4px 16px 0 rgba(0,0,0,0.4)` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
          <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0`}>{getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-1"><User className="w-3 h-3 text-white flex-shrink-0" /><span className="text-xs text-white font-medium">{clientsNames}</span></div>
      {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && <div className="flex items-start gap-1 mb-1"><MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" /><span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span></div>}
      {mandat?.date_livraison && <div className="flex items-center gap-1 mb-1"><Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" /><span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span></div>}
      {terrain?.date_limite_leve && <div className="flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" /><span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span></div>}
      {terrain?.a_rendez_vous && terrain?.date_rendez_vous && <div className="flex items-center gap-1 mb-1"><Clock className="w-3 h-3 text-orange-400 flex-shrink-0" /><span className="text-xs text-orange-300">RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}{terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}</span></div>}
      {terrain?.instruments_requis && <div className="flex items-center gap-1 mb-1"><Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" /><span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span></div>}
      {terrain?.technicien && <div className="flex items-center gap-1 mb-1"><UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" /><span className="text-xs text-blue-300 truncate">{terrain.technicien}</span></div>}
      {terrain?.dossier_simultane && <div className="flex items-center gap-1 mb-1"><Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" /><span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span></div>}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
        <div>{terrain?.temps_prevu && <div className="flex items-center gap-1"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>}</div>
        {assignedUser ? <div className="flex items-center gap-1"><Avatar className="w-6 h-6 border-2 border-emerald-500/50"><AvatarImage src={assignedUser.photo_url} /><AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback></Avatar></div> : <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30"><User className="w-3 h-3 text-emerald-500" /></div>}
      </div>
    </div>
  );
}

// Ghost card pour le drag custom — affiche le groupe de cartes liées en stack
function TerrainGhostCard({ card, pos, clients, users, techniciens, linkedGroups, terrainCards }) {
  if (!card) return null;

  // Trouver toutes les cartes du groupe lié
  const linkedGroup = linkedGroups?.find(g => g.cardIds.includes(card.id));
  const groupCards = linkedGroup
    ? linkedGroup.cardIds.map(id => terrainCards?.find(c => c.id === id)).filter(Boolean)
    : [card];

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', left: pos.x - 110, top: pos.y - 40, width: 240, zIndex: 99999,
      pointerEvents: 'none', opacity: 0.95, transform: 'rotate(2deg) scale(1.04)',
      filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))', transition: 'none',
    }}>
      {groupCards.map((c, i) => (
        <div key={c.id} style={{ marginBottom: i < groupCards.length - 1 ? 6 : 0 }}>
          <GhostCardFull card={c} clients={clients} users={users} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// Wrapper stable pour éviter le flickering de la carte quand selectedRoutes change
function MapWithStableRoutes({ mapRoutes, selectedRoutes, apiKey, onEquipeDurations }) {
  // Stabiliser les routes par contenu pour éviter de recréer la carte inutilement
  const stableRoutes = useMemo(
    () => mapRoutes,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(mapRoutes.map(r => ({ id: r.equipeId, wp: r.waypoints })))]
  );

  const handleDurations = useCallback((durations) => {
    stableRoutes.forEach((route, i) => {
      if (route.equipeId) onEquipeDurations(route.equipeId, durations[i] || 0);
    });
  }, [stableRoutes, onEquipeDurations]);

  return (
    <div style={{ height: 'calc(90vh - 120px)', width: '100%' }}>
      <MultiRouteMap
        routes={stableRoutes}
        apiKey={apiKey}
        onRouteDurations={handleDurations}
        visibleRouteIndices={selectedRoutes}
      />
    </div>
  );
}

export default function PlanningCalendar({ dossiers, techniciens, allTechniciens, vehicules, equipements, clients, onUpdateDossier, onAddTechnicien, onAddVehicule, onAddEquipement, onEditTechnicien, onDeleteTechnicien, onEditVehicule, onDeleteVehicule, onEditEquipement, onDeleteEquipement, users, lots, placeAffaire }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week");
  const [equipes, setEquipes] = useState({});
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [equipeActiveTabs, setEquipeActiveTabs] = useState({});
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [createTeamDateStr, setCreateTeamDateStr] = useState(null);
  const [globalViewMode, setGlobalViewMode] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamDateStr, setEditTeamDateStr] = useState(null);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [selectedMapDate, setSelectedMapDate] = useState(null);
  const [editingTerrainCard, setEditingTerrainCard] = useState(null);
  const [isTerrainDialogOpen, setIsTerrainDialogOpen] = useState(false);
  const [rendezVousWarning, setRendezVousWarning] = useState(null);
  const [pendingDrop, setPendingDrop] = useState(null);
  const [deleteEquipeWarning, setDeleteEquipeWarning] = useState(null);
  const [conflitTechnicienWarning, setConflitTechnicienWarning] = useState(null); // { equipe, srcDate, targetDate, conflits: [{technicien, equipeNom}] }
  const pendingEquipeMoveRef = useRef(null);
  const [terrainForm, setTerrainForm] = useState({ date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteCardConfirm, setDeleteCardConfirm] = useState(null); // card à supprimer
  const [expandedCardMenus, setExpandedCardMenus] = useState({}); // { cardId: bool }
  const [cardStatuts, setCardStatuts] = useState(() => { try { return JSON.parse(localStorage.getItem('terrainCardStatuts') || '{}'); } catch { return {}; } });

  const toggleCardStatut = (cardId, key) => {
    setCardStatuts(prev => {
      const current = prev[cardId] || {};
      const next = { ...prev, [cardId]: { ...current, [key]: !current[key] } };
      localStorage.setItem('terrainCardStatuts', JSON.stringify(next));
      return next;
    });
  };
  const [mapRoutes, setMapRoutes] = useState([]);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [visibleTeams, setVisibleTeams] = useState([]); // Équipes visibles sur la carte
  const [equipeExistanteWarning, setEquipeExistanteWarning] = useState(null); // { equipeNom, targetDate }
  const sidebarRef = useRef(null);
  const sidebarContainerRef = useRef(null); // ref sur le placeholder pour connaître la position initiale
  // durées de trajet par equipeId (en secondes), calculées depuis Google Maps
  const [equipeTravelSeconds, setEquipeTravelSeconds] = useState({});

  // Cartes verrouillées (lock) — stockées en localStorage
  const [lockedCards, setLockedCards] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('lockedTerrainCards') || '[]')); } catch { return new Set(); }
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Groupes de cartes liées: [{id: string, cardIds: [string, ...]}]
  const [linkedGroups, setLinkedGroups] = useState(() => {
    try { return JSON.parse(localStorage.getItem('terrainLinkedGroups') || '[]'); } catch { return []; }
  });
  // Mode liaison: null | { firstCardId: string }
  const [linkingMode, setLinkingMode] = useState(null);

  const toggleLockCard = (cardId) => {
    setLockedCards(prev => {
      const next = new Set(prev);
      const isLocked = next.has(cardId);
      // Trouver toutes les cartes du groupe lié
      const group = linkedGroups.find(g => g.cardIds.includes(cardId));
      const idsToToggle = group ? group.cardIds : [cardId];
      idsToToggle.forEach(id => {
        if (isLocked) next.delete(id);
        else next.add(id);
      });
      localStorage.setItem('lockedTerrainCards', JSON.stringify([...next]));
      return next;
    });
  };

  const saveLinkedGroups = (groups) => {
    localStorage.setItem('terrainLinkedGroups', JSON.stringify(groups));
    setLinkedGroups(groups);
  };

  const getLinkedGroupForCard = (cardId) => linkedGroups.find(g => g.cardIds.includes(cardId));

  const handleLinkCard = (cardId) => {
    if (!linkingMode) {
      // Premier clic: entrer en mode liaison
      setLinkingMode({ firstCardId: cardId });
      return;
    }
    if (linkingMode.firstCardId === cardId) {
      // Clic sur la même carte: annuler
      setLinkingMode(null);
      return;
    }
    // Deuxième clic: créer/étendre le lien
    const firstCard = linkingMode.firstCardId;
    const secondCard = cardId;
    const groups = JSON.parse(JSON.stringify(linkedGroups));
    const groupOfFirst = groups.find(g => g.cardIds.includes(firstCard));
    const groupOfSecond = groups.find(g => g.cardIds.includes(secondCard));

    let finalCardIds;
    if (groupOfFirst && groupOfSecond) {
      if (groupOfFirst.id === groupOfSecond.id) {
        finalCardIds = groupOfFirst.cardIds;
      } else {
        groupOfFirst.cardIds = [...new Set([...groupOfFirst.cardIds, ...groupOfSecond.cardIds])];
        const filtered = groups.filter(g => g.id !== groupOfSecond.id);
        saveLinkedGroups(filtered);
        finalCardIds = groupOfFirst.cardIds;
      }
    } else if (groupOfFirst) {
      if (!groupOfFirst.cardIds.includes(secondCard)) groupOfFirst.cardIds.push(secondCard);
      saveLinkedGroups(groups);
      finalCardIds = groupOfFirst.cardIds;
    } else if (groupOfSecond) {
      if (!groupOfSecond.cardIds.includes(firstCard)) groupOfSecond.cardIds.push(firstCard);
      saveLinkedGroups(groups);
      finalCardIds = groupOfSecond.cardIds;
    } else {
      const newGroup = { id: `link-${Date.now()}`, cardIds: [firstCard, secondCard] };
      groups.push(newGroup);
      saveLinkedGroups(groups);
      finalCardIds = newGroup.cardIds;
    }

    // Déplacer toutes les cartes du groupe dans l'équipe de la première carte cliquée
    if (finalCardIds) moveGroupToSameEquipe(finalCardIds, firstCard);

    setLinkingMode(null);
  };

  const handleUnlinkGroup = (groupId) => {
    saveLinkedGroups(linkedGroups.filter(g => g.id !== groupId));
  };

  const handleUnlinkCard = (groupId, cardId) => {
    const groups = JSON.parse(JSON.stringify(linkedGroups));
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    group.cardIds = group.cardIds.filter(id => id !== cardId);
    if (group.cardIds.length < 2) {
      saveLinkedGroups(groups.filter(g => g.id !== groupId));
    } else {
      saveLinkedGroups(groups);
    }
  };



  const prevEquipesRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const loadEquipes = async () => {
      try {
        const equipesBD = await base44.entities.EquipeTerrain.list();
        const grouped = {};
        equipesBD.forEach(eq => {
          const d = eq.date_terrain;
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push({ id: eq.id, nom: eq.nom, place_affaire: eq.place_affaire, techniciens: eq.techniciens || [], vehicules: eq.vehicules || [], equipements: eq.equipements || [], mandats: eq.mandats || [] });
        });
        setEquipes(grouped);
        // Marquer le chargement initial comme terminé après un court délai
        setTimeout(() => { isInitialLoadRef.current = false; }, 500);
      } catch (e) { console.error('Erreur chargement équipes:', e); }
    };
    loadEquipes();
  }, []);

  useEffect(() => {
    const save = async () => {
      // Ne pas sauvegarder lors du chargement initial
      if (isInitialLoadRef.current) return;
      if (Object.keys(equipes).length === 0) return;

      // Trouver seulement les équipes qui ont changé
      const prev = prevEquipesRef.current;
      const changed = [];
      const currentIds = new Set();

      for (const [dateStr, dayEquipes] of Object.entries(equipes)) {
        for (const equipe of dayEquipes) {
          currentIds.add(equipe.id);
          const prevEquipe = prev ? Object.values(prev).flat().find(e => e.id === equipe.id) : null;
          const prevDateStr = prev ? Object.keys(prev).find(d => prev[d].some(e => e.id === equipe.id)) : null;
          const hasChanged = !prevEquipe ||
            JSON.stringify(equipe.mandats) !== JSON.stringify(prevEquipe.mandats) ||
            JSON.stringify(equipe.techniciens) !== JSON.stringify(prevEquipe.techniciens) ||
            JSON.stringify(equipe.vehicules) !== JSON.stringify(prevEquipe.vehicules) ||
            JSON.stringify(equipe.equipements) !== JSON.stringify(prevEquipe.equipements) ||
            prevDateStr !== dateStr ||
            equipe.nom !== prevEquipe.nom;
          if (hasChanged) changed.push({ dateStr, equipe });
        }
      }

      // Trouver les équipes supprimées
      const deleted = [];
      if (prev) {
        for (const dayEquipes of Object.values(prev)) {
          for (const eq of dayEquipes) {
            if (!currentIds.has(eq.id)) deleted.push(eq.id);
          }
        }
      }

      if (changed.length === 0 && deleted.length === 0) return;

      prevEquipesRef.current = JSON.parse(JSON.stringify(equipes));
      setIsSaving(true);
      try {
        const existing = await base44.entities.EquipeTerrain.list();
        const existingIds = new Set(existing.map(eq => eq.id));

        for (const { dateStr, equipe } of changed) {
          const data = { date_terrain: dateStr, nom: equipe.nom, place_affaire: equipe.place_affaire || placeAffaire, techniciens: equipe.techniciens || [], vehicules: equipe.vehicules || [], equipements: equipe.equipements || [], mandats: equipe.mandats || [] };
          if (existingIds.has(equipe.id)) await base44.entities.EquipeTerrain.update(equipe.id, data);
          else await base44.entities.EquipeTerrain.create(data);
        }
        for (const id of deleted) {
          if (existingIds.has(id)) await base44.entities.EquipeTerrain.delete(id);
        }
      } catch (e) { console.error('Erreur sauvegarde:', e); } finally { setIsSaving(false); }
    };
    const id = setTimeout(save, 3000);
    return () => clearTimeout(id);
  }, [equipes]);

  useEffect(() => {
    const load = async () => {
      try { const r = await base44.functions.invoke('getGoogleMapsApiKey'); if (r.data?.apiKey) setGoogleMapsApiKey(r.data.apiKey); } catch (e) {}
    };
    load();
  }, []);

  // Sticky sidebar : fixe à sa position initiale, colle à 73px quand la topbar l'atteint
  useStickySidebar(sidebarRef, sidebarContainerRef, 73);

  const getClientsNames = (ids) => {
    if (!ids?.length) return "-";
    return ids.map(id => { const c = clients.find(c => c.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(n => n).join(", ");
  };
  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
  };

  const getInitialsWithHyphens = (text) => {
    return text.split('-').map(part => part[0]?.toUpperCase()).join('');
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    if (typeof user === 'string') {
      return user.split(' ').map(n => getInitialsWithHyphens(n)).join('').toUpperCase() || 'U';
    }
    const prenomInitials = getInitialsWithHyphens(user.prenom || '');
    const nomInitials = getInitialsWithHyphens(user.nom || '');
    return (prenomInitials + nomInitials) || 'U';
  };

  const getDays = () => {
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 5 }, (_, i) => addDays(start, i));
    } else {
      const start = startOfMonth(currentDate); const end = endOfMonth(currentDate);
      let firstMonday = startOfWeek(start, { weekStartsOn: 1 });
      let lastFriday = new Date(end);
      while (lastFriday.getDay() !== 5) lastFriday = addDays(lastFriday, 1);
      const days = []; let current = firstMonday;
      while (current <= lastFriday) { if (current.getDay() >= 1 && current.getDay() <= 5) days.push(new Date(current)); current = addDays(current, 1); }
      return days;
    }
  };

  const days = useMemo(() => getDays(), [currentDate, viewMode]);
  const goToPrevious = () => viewMode === "week" ? setCurrentDate(subWeeks(currentDate, 1)) : setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNext = () => viewMode === "week" ? setCurrentDate(addWeeks(currentDate, 1)) : setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const generateTeamDisplayName = useCallback((equipe, positionIndex) => {
    // Si positionIndex fourni, utiliser ce numéro (1-based), sinon extraire du nom
    const numStr = positionIndex != null
      ? String(positionIndex + 1)
      : (equipe.nom.match(/Équipe (\d+)/)?.[1] ?? null);
    if (equipe.techniciens.length === 0) {
      return numStr ? `Équipe ${numStr}` : equipe.nom;
    }
    const initials = equipe.techniciens.map(id => {
      const u = users?.find(u => u.id === id);
      if (!u) return '';
      const prenomInitials = getInitialsWithHyphens(u.prenom || '');
      const nomInitials = getInitialsWithHyphens(u.nom || '');
      return prenomInitials + nomInitials;
    }).filter(n => n).join('-');
    return numStr ? `Équipe ${numStr} - ${initials}` : equipe.nom;
  }, [users]);

  const parseEquipeDroppableId = (id) => {
    if (!id.startsWith('equipe-')) return null;
    const parts = id.split('-');
    return { dateStr: `${parts[1]}-${parts[2]}-${parts[3]}`, equipeId: parts[4], type: parts[5] };
  };

  const parseTerrainColumnId = (colId) => {
    if (!colId || colId === 'unassigned') return null;
    const prefix = 'terrain-';
    if (!colId.startsWith(prefix)) return null;
    const rest = colId.slice(prefix.length);
    const dateStr = rest.slice(0, 10);
    const equipeId = rest.slice(11);
    return { dateStr, equipeId };
  };

  const generateTerrainCards = () => {
    const cards = [];
    const filtered = placeAffaire ? dossiers.filter(d => d.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()) : dossiers;
    filtered.forEach(dossier => {
      (dossier.mandats || []).forEach((mandat, realMandatIndex) => {
        if (mandat.tache_actuelle !== "Cédule") return;
        if (mandat.terrains_list?.length > 0) {
          mandat.terrains_list.forEach((terrain, terrainIndex) => {
            cards.push({ id: `${dossier.id}-${realMandatIndex}-${terrainIndex}`, dossierId: dossier.id, dossier, mandat, terrain: { ...terrain, statut_terrain: mandat.statut_terrain }, mandatIndex: realMandatIndex, terrainIndex });
          });
        } else {
          const statutTerrain = mandat.statut_terrain;
          if (!statutTerrain || statutTerrain === "en_verification") {
            const syntheticTerrain = { ...(mandat.terrain || {}), statut_terrain: statutTerrain || "en_verification" };
            cards.push({ id: `${dossier.id}-${realMandatIndex}-0`, dossierId: dossier.id, dossier, mandat, terrain: syntheticTerrain, mandatIndex: realMandatIndex, terrainIndex: 0 });
          }
        }
      });
    });
    return cards;
  };

  const terrainCards = generateTerrainCards();

  // Supprimé: syncDossiersAfterEquipeChange causait des appels API excessifs (rate limit 429)
  // Les mises à jour de dossier sont faites directement dans executeDrop/executePendingDrop
  const syncDossiersAfterEquipeChange = useCallback((_newEquipes) => {
    // No-op: intentionnellement vide pour éviter le rate limiting
  }, []);

  useEffect(() => {
    const validIds = new Set(terrainCards.map(c => c.id));

    setEquipes(prev => {
      let needsUpdate = false;
      const updated = JSON.parse(JSON.stringify(prev)); // deep clone

      // Retirer uniquement les cartes qui n'existent plus (dossier supprimé, tâche changée, etc.)
      Object.keys(updated).forEach(dateStr => {
        updated[dateStr].forEach(equipe => {
          const orig = equipe.mandats.length;
          equipe.mandats = equipe.mandats.filter(id => validIds.has(id));
          if (equipe.mandats.length !== orig) needsUpdate = true;
        });
      });

      return needsUpdate ? updated : prev;
    });
  }, [dossiers]);

  const unassignedCards = terrainCards.filter(card => {
    const isAssigned = Object.values(equipes).some(de => de.some(eq => eq.mandats.includes(card.id)));
    return !isAssigned;
  });

  const parseTimeString = (ts) => { if (!ts) return 0; const m = ts.match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[0]) : 0; };

  const calculateEquipeTimings = (equipe) => {
    let total = 0;
    equipe.mandats.forEach(id => { const c = terrainCards.find(c => c.id === id); if (c?.terrain?.temps_prevu) total += parseTimeString(c.terrain.temps_prevu); });
    return { totalTime: total.toFixed(1), cardCount: equipe.mandats.length };
  };

  const getUsedResourcesForDate = (dateStr) => {
    const de = equipes[dateStr] || [];
    const t = new Set(); const v = new Set(); const e = new Set();
    de.forEach(eq => { eq.techniciens.forEach(id => t.add(id)); eq.vehicules.forEach(id => v.add(id)); eq.equipements.forEach(id => e.add(id)); });
    return { techniciens: Array.from(t), vehicules: Array.from(v), equipements: Array.from(e) };
  };

  const getEquipeActiveTab = (id) => equipeActiveTabs[id] !== undefined ? equipeActiveTabs[id] : null;

  const addEquipe = (dateStr) => { setCreateTeamDateStr(dateStr); setIsCreateTeamDialogOpen(true); };
  const handleCreateTeam = async (newEquipe) => {
    const dateStr = createTeamDateStr;
    const data = {
      date_terrain: dateStr,
      nom: newEquipe.nom,
      place_affaire: newEquipe.place_affaire || placeAffaire || "",
      techniciens: newEquipe.techniciens || [],
      vehicules: newEquipe.vehicules || [],
      equipements: newEquipe.equipements || [],
      mandats: []
    };
    // Sauvegarder directement en BD pour avoir un vrai ID
    const created = await base44.entities.EquipeTerrain.create(data);
    const equipeAvecId = { ...data, id: created.id };
    const ne = { ...equipes };
    if (!ne[dateStr]) ne[dateStr] = [];
    ne[dateStr].push(equipeAvecId);
    setEquipes(ne);
    prevEquipesRef.current = JSON.parse(JSON.stringify(ne)); // sync pour éviter double-save
    setEquipeActiveTabs({ ...equipeActiveTabs, [created.id]: null });
    setIsCreateTeamDialogOpen(false);
  };
  const handleEditTeam = (dateStr, equipe) => { setEditingTeam(equipe); setEditTeamDateStr(dateStr); setIsEditTeamDialogOpen(true); };
  const handleUpdateTeam = (updatedTeam) => {
    const ne = { ...equipes };
    if (ne[editTeamDateStr]) {
      const idx = ne[editTeamDateStr].findIndex(eq => eq.id === updatedTeam.id);
      if (idx !== -1) {
        ne[editTeamDateStr][idx] = updatedTeam;
        setEquipes(ne);
        syncDossiersAfterEquipeChange(ne);
      }
    }
    setIsEditTeamDialogOpen(false); setEditingTeam(null); setEditTeamDateStr(null);
  };
  const copyEquipe = async (dateStr, equipeId) => {
    const d = new Date(dateStr + 'T00:00:00'); let next = new Date(d);
    do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
    const nextStr = format(next, "yyyy-MM-dd");
    const ne = { ...equipes }; const equipe = ne[dateStr]?.find(e => e.id === equipeId); if (!equipe) return;
    // Vérifier si une équipe avec le même nom existe déjà ce jour-là
    const alreadyExists = (ne[nextStr] || []).some(e => e.nom === equipe.nom);
    if (alreadyExists) { setEquipeExistanteWarning({ equipeNom: generateTeamDisplayName(equipe), targetDate: nextStr }); return; }
    // Créer directement en BD pour avoir un vrai ID
    const data = { date_terrain: nextStr, nom: equipe.nom, place_affaire: equipe.place_affaire || placeAffaire, techniciens: [...equipe.techniciens], vehicules: [...equipe.vehicules], equipements: [...equipe.equipements], mandats: [] };
    const created = await base44.entities.EquipeTerrain.create(data);
    const copy = { id: created.id, ...data };
    if (!ne[nextStr]) ne[nextStr] = [];
    ne[nextStr].push(copy); setEquipes(ne); setEquipeActiveTabs({ ...equipeActiveTabs, [copy.id]: null });
    setCurrentDate(next);
  };
  const removeEquipe = (dateStr, equipeId) => {
    const equipe = equipes[dateStr]?.find(e => e.id === equipeId);
    if (equipe?.mandats?.length > 0) setDeleteEquipeWarning({ dateStr, equipeId, equipe });
    else confirmRemoveEquipe(dateStr, equipeId);
  };
  const confirmRemoveEquipe = (dateStr, equipeId) => {
    const equipe = equipes[dateStr]?.find(e => e.id === equipeId);
    if (equipe?.mandats?.length > 0) {
      equipe.mandats.forEach(cardId => {
        const card = terrainCards.find(c => c.id === cardId);
        if (card && onUpdateDossier) {
          const updatedMandats = card.dossier.mandats.map((m, idx) => {
            if (idx === card.mandatIndex) { let tl = [...(m.terrains_list || [])]; if (tl[card.terrainIndex]) tl[card.terrainIndex] = { ...tl[card.terrainIndex], date_cedulee: null, equipe_assignee: null }; return { ...m, date_terrain: null, equipe_assignee: null, terrains_list: tl }; }
            return m;
          });
          onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
        }
      });
    }
    const ne = { ...equipes }; if (ne[dateStr]) { ne[dateStr] = ne[dateStr].filter(e => e.id !== equipeId); if (!ne[dateStr].length) delete ne[dateStr]; }
    setEquipes(ne); setDeleteEquipeWarning(null);
  };

  const handleEdit = (dossier, mandatIndex = 0) => { setEditingDossier({ ...dossier, initialMandatIndex: mandatIndex }); setIsEditingDialogOpen(true); };
  const handleCardClick = (card) => { if (dragging) return; handleEdit(card.dossier, card.mandatIndex); };

  const handleEditTerrain = (card) => {
    setEditingTerrainCard(card);
    let def = card.terrain?.date_limite_leve || "";
    if (!def) { const m = card.mandat; let base = null; if (m.date_livraison) base = new Date(m.date_livraison + 'T00:00:00'); else if (m.date_signature) base = new Date(m.date_signature + 'T00:00:00'); else if (m.date_debut_travaux) base = new Date(m.date_debut_travaux + 'T00:00:00'); if (base) { base.setDate(base.getDate() - 14); def = format(base, "yyyy-MM-dd"); } }
    setTerrainForm({ date_limite_leve: def, instruments_requis: card.terrain?.instruments_requis || "", a_rendez_vous: card.terrain?.a_rendez_vous || false, date_rendez_vous: card.terrain?.date_rendez_vous || "", heure_rendez_vous: card.terrain?.heure_rendez_vous || "", donneur: card.terrain?.donneur || "", technicien: card.terrain?.technicien || "", dossier_simultane: card.terrain?.dossier_simultane || "", temps_prevu: card.terrain?.temps_prevu || "", notes: card.terrain?.notes || "" });
    setIsTerrainDialogOpen(true);
  };

  const handleDeleteCard = (card) => {
    // Retirer la carte de toutes les équipes
    setEquipes(prev => {
      const ne = JSON.parse(JSON.stringify(prev));
      Object.keys(ne).forEach(d => ne[d].forEach(eq => { eq.mandats = eq.mandats.filter(id => id !== card.id); }));
      return ne;
    });
    // Retirer du groupe lié
    const group = getLinkedGroupForCard(card.id);
    if (group) handleUnlinkCard(group.id, card.id);
    // Mettre à jour le dossier: retirer le terrain de la liste
    if (onUpdateDossier) {
      const dossier = dossiers.find(d => d.id === card.dossier.id);
      if (dossier) {
        const updatedMandats = dossier.mandats.map((m, idx) => {
          if (idx !== card.mandatIndex) return m;
          const tl = [...(m.terrains_list || [])];
          tl.splice(card.terrainIndex, 1);
          return { ...m, terrains_list: tl };
        });
        onUpdateDossier(dossier.id, { ...dossier, mandats: updatedMandats });
      }
    }
    setDeleteCardConfirm(null);
  };

  const handleSaveTerrain = () => {
    if (!editingTerrainCard) return;
    const dossier = editingTerrainCard.dossier;
    const updatedMandats = [...dossier.mandats];
    const cur = updatedMandats[editingTerrainCard.mandatIndex];
    let tl = [...(cur.terrains_list || [])];
    tl[editingTerrainCard.terrainIndex] = terrainForm;
    updatedMandats[editingTerrainCard.mandatIndex] = { ...cur, terrains_list: tl, statut_terrain: cur.statut_terrain === "en_verification" ? "a_ceduler" : cur.statut_terrain };
    onUpdateDossier(dossier.id, { ...dossier, mandats: updatedMandats });
    setIsTerrainDialogOpen(false); setEditingTerrainCard(null);
  };

  const buildRoutesForDate = useCallback((dateStr) => {
    const bureauAddress = "11 rue melancon est, Alma";
    const dayEquipes = (equipes[dateStr] || []).filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
    if (!dayEquipes.length) return [];
    const routes = [];
    dayEquipes.forEach((equipe, index) => {
      const cardIds = equipe.mandats || []; const waypoints = []; const dossiersInfo = [];
      cardIds.forEach(cId => {
        const card = terrainCards.find(c => c.id === cId);
        if (card?.mandat?.adresse_travaux) { const address = formatAdresse(card.mandat.adresse_travaux); if (address) { waypoints.push(address); dossiersInfo.push({ numero: `${getArpenteurInitials(card.dossier.arpenteur_geometre)}${card.dossier.numero_dossier}`, clients: getClientsNames(card.dossier.clients_ids), mandat: getAbbreviatedMandatType(card.mandat.type_mandat), mandatType: card.mandat.type_mandat, adresse: address, arpenteur: card.dossier.arpenteur_geometre, dateLimite: card.terrain?.date_limite_leve ? format(new Date(card.terrain.date_limite_leve + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : null, dateLivraison: card.mandat?.date_livraison ? format(new Date(card.mandat.date_livraison + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : null, rendezVous: card.terrain?.a_rendez_vous && card.terrain?.date_rendez_vous ? `${format(new Date(card.terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}${card.terrain.heure_rendez_vous ? ` à ${card.terrain.heure_rendez_vous}` : ''}` : null, instrumentsRequis: card.terrain?.instruments_requis || null, technicien: card.terrain?.technicien || null, dossierSimultane: card.terrain?.dossier_simultane || null, tempsPrevu: card.terrain?.temps_prevu || null, donneur: card.terrain?.donneur || null, notes: card.terrain?.notes || null }); } }
      });
      if (waypoints.length > 0) routes.push({ equipeId: equipe.id, origin: bureauAddress, destination: bureauAddress, waypoints, color: COLORS[index % COLORS.length], label: generateTeamDisplayName(equipe), dossiers: dossiersInfo });
    });
    return routes;
  }, [equipes, terrainCards, placeAffaire]);

  // Recalculer automatiquement les routes pour tous les jours visibles dès que les équipes ou dossiers changent
  useEffect(() => {
    // Mettre à jour mapRoutes si une date est sélectionnée (pour la fenêtre carte)
    if (selectedMapDate) {
      const routes = buildRoutesForDate(selectedMapDate);
      setMapRoutes(routes);
    }
  }, [equipes, dossiers, selectedMapDate, buildRoutesForDate]);

  // Réinitialiser selectedRoutes et visibleTeams uniquement quand la date change ou les routes sont recalculées
  useEffect(() => {
    if (mapRoutes.length > 0) {
      setSelectedRoutes(mapRoutes.map((_, i) => i));
      // Initialiser visibleTeams avec tous les equipeId uniques
      const uniqueTeams = [...new Set(mapRoutes.map(r => r.equipeId))];
      setVisibleTeams(uniqueTeams);
    } else {
      setSelectedRoutes([]);
      setVisibleTeams([]);
    }
  }, [selectedMapDate, mapRoutes.length]);

  // Calculer les durées de trajet via le backend — debounce 2s pour éviter les appels excessifs
  const travelCalcTimerRef = useRef(null);
  const lastRouteKeyRef = useRef(null);

  useEffect(() => {
    if (!googleMapsApiKey) return;

    // Construire la clé des routes pour éviter les recalculs inutiles
    const allRoutes = [];
    days.forEach(day => {
      const routes = buildRoutesForDate(format(day, "yyyy-MM-dd"));
      allRoutes.push(...routes);
    });
    const routesWithWaypoints = allRoutes.filter(r => r.equipeId && r.waypoints?.length);
    const routeKey = routesWithWaypoints.map(r => `${r.equipeId}:${r.waypoints.join(',')}`).join('|');

    // Ne pas recalculer si les routes n'ont pas changé
    if (routeKey === lastRouteKeyRef.current) return;

    if (travelCalcTimerRef.current) clearTimeout(travelCalcTimerRef.current);

    travelCalcTimerRef.current = setTimeout(async () => {
      if (!routesWithWaypoints.length) return;
      lastRouteKeyRef.current = routeKey;

      const results = await Promise.allSettled(
        routesWithWaypoints.map(route =>
          base44.functions.invoke('calculateRouteDuration', {
            origin: route.origin,
            destination: route.destination,
            waypoints: route.waypoints,
          }).then(res => ({ equipeId: route.equipeId, seconds: res.data?.durationSeconds ?? 0 }))
        )
      );

      const newDurations = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') newDurations[r.value.equipeId] = r.value.seconds;
      });
      if (Object.keys(newDurations).length > 0) {
        setEquipeTravelSeconds(prev => ({ ...prev, ...newDurations }));
      }
    }, 2000);

    return () => { if (travelCalcTimerRef.current) clearTimeout(travelCalcTimerRef.current); };
  }, [googleMapsApiKey, equipes, days]);

  const openGoogleMapsForDay = (dateStr) => {
    const routes = buildRoutesForDate(dateStr);
    setSelectedMapDate(dateStr);
    setMapRoutes(routes);
    setSelectedRoutes(routes.map((_, i) => i));
    setShowMapDialog(true);
  };

  // ---- Optimisation globale des trajets ----
  const handleOptimizeAll = useCallback(async () => {
    setIsOptimizing(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Équipes futures existantes
      const futureEquipes = {};
      Object.entries(equipes).forEach(([dateStr, dayEqs]) => {
        if (dateStr <= today) return;
        const filtered = dayEqs.filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
        if (filtered.length > 0) futureEquipes[dateStr] = filtered;
      });

      // Cartes déjà assignées
      const assignedIds = new Set(Object.values(equipes).flatMap(de => de.flatMap(eq => eq.mandats)));

      const toCardData = (card) => ({
        id: card.id,
        address: formatAdresse(card.mandat?.adresse_travaux),
        date_limite_leve: card.terrain?.date_limite_leve || null,
        date_livraison: card.mandat?.date_livraison || null,
        a_rendez_vous: card.terrain?.a_rendez_vous || false,
        date_rendez_vous: card.terrain?.date_rendez_vous || null,
        heure_rendez_vous: card.terrain?.heure_rendez_vous || null,
        technicien: card.terrain?.technicien || null,
        temps_prevu: card.terrain?.temps_prevu || null,
      });

      // Données de toutes les cartes
      const allCardsData = terrainCards.map(toCardData);

      // Cartes non assignées à planifier (statut a_ceduler)
      const unassignedCardsData = terrainCards
        .filter(c => !assignedIds.has(c.id) && c.terrain?.statut_terrain === 'a_ceduler')
        .map(toCardData);

      const res = await base44.functions.invoke('optimizeTeamRoutes', {
        equipes: futureEquipes,
        cardsData: allCardsData,
        lockedCardIds: [...lockedCards],
        unassignedCards: unassignedCardsData,
        availableTechniciens: (allTechniciens || techniciens)
          .filter(t => t.statut === 'Actif' || !t.statut)
          .filter(t => t.poste === 'Technicien Terrain' || t.poste === 'Technicien Terrain (Chef)')
          .filter(t => !placeAffaire || !t.place_affaire || t.place_affaire.toLowerCase() === placeAffaire.toLowerCase())
          .map(t => {
            const parts = (t.full_name || '').trim().split(' ');
            return {
              id: t.id,
              prenom: parts[0] || '',
              nom: parts.slice(1).join(' ') || '',
              poste: t.poste || '',
            };
          }),
        placeAffaire,
        linkedGroups,
      });

      const optimizedResult = res.data?.result;
      const newEquipesFromServer = res.data?.newEquipes || [];

      if (!optimizedResult) return;

      // Appliquer les résultats (équipes existantes réordonnées + nouvelles équipes)
      setEquipes(prev => {
        const ne = JSON.parse(JSON.stringify(prev)); // deep clone

        // 1. Vider les mandats non-lockés de TOUTES les équipes futures (le backend les a réoptimisées)
        Object.keys(ne).forEach(dateStr => {
          if (dateStr < today) return;
          ne[dateStr].forEach(equipe => {
            equipe.mandats = equipe.mandats.filter(id => lockedCards.has(id));
          });
        });

        // 2. Appliquer les nouveaux ordres retournés par le backend
        Object.entries(optimizedResult).forEach(([dateStr, equipeOrders]) => {
          if (!ne[dateStr]) ne[dateStr] = [];
          ne[dateStr] = ne[dateStr].map(equipe => {
            const newOrder = equipeOrders[equipe.id];
            if (newOrder === undefined) return equipe;
            return { ...equipe, mandats: newOrder };
          });
          // Ajouter les nouvelles équipes créées ce jour
          const newEqForDate = newEquipesFromServer.filter(n => n.dateStr === dateStr);
          newEqForDate.forEach(({ equipe }) => {
            if (!ne[dateStr].find(e => e.id === equipe.id)) {
              ne[dateStr].push(equipe);
            }
          });
        });

        return ne;
      });

      // Mettre à jour les dossiers pour toutes les cartes assignées
      const allEquipesAfter = { ...equipes };
      Object.entries(optimizedResult).forEach(([dateStr, equipeOrders]) => {
        if (!allEquipesAfter[dateStr]) allEquipesAfter[dateStr] = [];
        newEquipesFromServer.filter(e => e.dateStr === dateStr).forEach(({ equipe }) => {
          if (!allEquipesAfter[dateStr].find(e2 => e2.id === equipe.id)) allEquipesAfter[dateStr].push(equipe);
        });
        const dayEqs = allEquipesAfter[dateStr] || [];
        Object.entries(equipeOrders).forEach(([equipeId, cardIds]) => {
          const equipe = dayEqs.find(e => e.id === equipeId) ||
            newEquipesFromServer.find(n => n.equipe.id === equipeId)?.equipe;
          if (!equipe) return;
          const posIdx = dayEqs.filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()).findIndex(e => e.id === equipeId);
          const eqNom = equipe.nom || generateTeamDisplayName(equipe, posIdx >= 0 ? posIdx : undefined);
          cardIds.forEach(cardId => {
            const card = terrainCards.find(c => c.id === cardId);
            if (!card) return;
            const freshDossier = dossiers.find(d => d.id === card.dossier.id);
            if (!freshDossier) return;
            const idParts = card.id.split('-');
            const mandatIdx = parseInt(idParts[idParts.length - 2]);
            const terrainIdx = parseInt(idParts[idParts.length - 1]);
            const um = freshDossier.mandats.map((m, idx) => {
              if (idx !== mandatIdx) return m;
              let tl = m.terrains_list && m.terrains_list.length > 0
                ? [...m.terrains_list]
                : [{ ...(m.terrain || {}), statut_terrain: m.statut_terrain }];
              const tIdx = terrainIdx < tl.length ? terrainIdx : 0;
              tl[tIdx] = { ...tl[tIdx], date_cedulee: dateStr, equipe_assignee: eqNom };
              const terrainPrincipal = { ...(m.terrain || {}), ...tl[0] };
              return { ...m, date_terrain: dateStr, equipe_assignee: eqNom, terrains_list: tl, terrain: terrainPrincipal };
            });
            onUpdateDossier(freshDossier.id, { ...freshDossier, mandats: um });
          });
        });
      });

      const totalNew = newEquipesFromServer.length;
      if (totalNew > 0) {
        alert(`Optimisation terminée ! ${totalNew} nouvelle${totalNew > 1 ? 's' : ''} équipe${totalNew > 1 ? 's' : ''} créée${totalNew > 1 ? 's' : ''} sur des journées libres.`);
      }
    } catch (e) {
      console.error('Erreur optimisation:', e);
      alert("Erreur lors de l'optimisation.");
    } finally {
      setIsOptimizing(false);
    }
  }, [equipes, terrainCards, lockedCards, placeAffaire, dossiers, onUpdateDossier, generateTeamDisplayName, techniciens]);

  // ---- Custom drag & drop pour les DossierCards ----
  // Applique un mouvement de carte (ou groupe) sur l'état equipes et met à jour les dossiers
  const applyCardDrop = useCallback((cardIds, dateStr, equipeId, insertIndex, equipes) => {
    const ne = JSON.parse(JSON.stringify(equipes));
    if (!ne[dateStr]) return ne;
    const equipe = ne[dateStr].find(e => e.id === equipeId);
    if (!equipe) return ne;

    // Retirer toutes les cartes du groupe de leurs équipes précédentes
    Object.keys(ne).forEach(d => ne[d].forEach(eq => {
      if (eq.id !== equipeId) eq.mandats = eq.mandats.filter(id => !cardIds.includes(id));
    }));

    // Retirer les cartes du groupe de la cible (pour réinsérer au bon endroit)
    const withoutGroup = equipe.mandats.filter(id => !cardIds.includes(id));
    const targetIndex = insertIndex != null ? Math.min(insertIndex, withoutGroup.length) : withoutGroup.length;
    withoutGroup.splice(targetIndex, 0, ...cardIds);
    equipe.mandats = withoutGroup;

    return ne;
  }, []);

  const updateDossierForCard = useCallback((card, dateStr, equipeNom) => {
    if (!onUpdateDossier) return;
    const freshDossier = dossiers.find(d => d.id === card.dossier.id);
    if (!freshDossier) return;
    const idParts = card.id.split('-');
    const mandatIdx = parseInt(idParts[idParts.length - 2]);
    const terrainIdx = parseInt(idParts[idParts.length - 1]);
    const um = freshDossier.mandats.map((m, idx) => {
      if (idx !== mandatIdx) return m;
      let tl = m.terrains_list && m.terrains_list.length > 0
        ? [...m.terrains_list]
        : [{ ...(m.terrain || {}), statut_terrain: m.statut_terrain }];
      const tIdx = terrainIdx < tl.length ? terrainIdx : 0;
      if (dateStr === null) {
        tl[tIdx] = { ...tl[tIdx], date_cedulee: null, equipe_assignee: null };
        const terrainPrincipal = { ...(m.terrain || {}), ...tl[0], date_cedulee: null, equipe_assignee: null };
        return { ...m, date_terrain: null, equipe_assignee: null, terrains_list: tl, terrain: terrainPrincipal };
      } else {
        tl[tIdx] = { ...tl[tIdx], date_cedulee: dateStr, equipe_assignee: equipeNom };
        const terrainPrincipal = { ...(m.terrain || {}), ...tl[0] };
        return { ...m, date_terrain: dateStr, equipe_assignee: equipeNom, terrains_list: tl, terrain: terrainPrincipal };
      }
    });
    onUpdateDossier(freshDossier.id, { ...freshDossier, mandats: um });
  }, [onUpdateDossier, dossiers]);

  // Déplace toutes les cartes d'un groupe dans l'équipe de la carte de référence
  const moveGroupToSameEquipe = useCallback((allCardIds, anchorCardId) => {
    let anchorDateStr = null;
    let anchorEquipeId = null;
    Object.entries(equipes).forEach(([dateStr, dayEqs]) => {
      dayEqs.forEach(eq => {
        if (eq.mandats.includes(anchorCardId)) {
          anchorDateStr = dateStr;
          anchorEquipeId = eq.id;
        }
      });
    });
    if (!anchorDateStr || !anchorEquipeId) return;

    const alreadyTogether = allCardIds.every(id => {
      const eq = equipes[anchorDateStr]?.find(e => e.id === anchorEquipeId);
      return eq?.mandats.includes(id);
    });
    if (alreadyTogether) return;

    setEquipes(prev => {
      const ne = JSON.parse(JSON.stringify(prev));
      Object.keys(ne).forEach(d => {
        ne[d].forEach(eq => {
          if (eq.id !== anchorEquipeId) {
            eq.mandats = eq.mandats.filter(id => !allCardIds.includes(id));
          }
        });
      });
      const anchorEq = ne[anchorDateStr]?.find(e => e.id === anchorEquipeId);
      if (anchorEq) {
        allCardIds.forEach(id => {
          if (!anchorEq.mandats.includes(id)) anchorEq.mandats.push(id);
        });
      }
      return ne;
    });

    const anchorEq = equipes[anchorDateStr]?.find(e => e.id === anchorEquipeId);
    const dayEqs = (equipes[anchorDateStr] || []).filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
    const posIdx = dayEqs.findIndex(e => e.id === anchorEquipeId);
    const eqNom = anchorEq ? generateTeamDisplayName(anchorEq, posIdx >= 0 ? posIdx : undefined) : '';
    allCardIds.forEach(id => {
      const c = terrainCards.find(t => t.id === id);
      if (c) updateDossierForCard(c, anchorDateStr, eqNom);
    });
  }, [equipes, terrainCards, placeAffaire, generateTeamDisplayName, updateDossierForCard]);

  const executeDrop = useCallback((card, columnId, insertIndex) => {
    if (!card) return;

    // Déterminer toutes les cartes à déplacer (groupe lié ou carte seule)
    const linkedGroup = getLinkedGroupForCard(card.id);
    const cardIds = linkedGroup
      ? linkedGroup.cardIds.filter(id => terrainCards.some(c => c.id === id))
      : [card.id];

    if (columnId === 'unassigned') {
      const ne = JSON.parse(JSON.stringify(equipes));
      Object.keys(ne).forEach(d => ne[d].forEach(eq => { eq.mandats = eq.mandats.filter(id => !cardIds.includes(id)); }));
      setEquipes(ne);
      cardIds.forEach(cid => {
        const c = terrainCards.find(t => t.id === cid);
        if (c) updateDossierForCard(c, null, null);
      });
      return;
    }

    const dest = parseTerrainColumnId(columnId);
    if (!dest) return;

    const doTheDrop = (dateStr, equipeId) => {
      const ne = applyCardDrop(cardIds, dateStr, equipeId, insertIndex, equipes);
      setEquipes(ne);
      const dayEqs = (ne[dateStr] || []).filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
      const equipe = ne[dateStr]?.find(e => e.id === equipeId);
      const posIdx = dayEqs.findIndex(e => e.id === equipeId);
      const eqNom = equipe ? generateTeamDisplayName(equipe, posIdx >= 0 ? posIdx : undefined) : '';
      cardIds.forEach(cid => {
        const c = terrainCards.find(t => t.id === cid);
        if (c) updateDossierForCard(c, dateStr, eqNom);
      });
    };

    // Vérifier rendez-vous uniquement pour la carte principale
    if (card.terrain?.a_rendez_vous && card.terrain?.date_rendez_vous && card.terrain.date_rendez_vous !== dest.dateStr) {
      setRendezVousWarning({ card, newDateStr: dest.dateStr });
      setPendingDrop({ cardIds, dateStr: dest.dateStr, equipeId: dest.equipeId, insertIndex });
      return;
    }

    doTheDrop(dest.dateStr, dest.equipeId);
  }, [equipes, linkedGroups, terrainCards, applyCardDrop, updateDossierForCard, placeAffaire, generateTeamDisplayName]);

  const { dragging, ghostPos, overColumn, dropIndex, handleDragStart } = useKanbanDrag({ onDrop: executeDrop });

  // ---- Drag & drop pour les équipes entières ----
  const [draggingEquipe, setDraggingEquipe] = useState(null);
  const [equipeGhostPos, setEquipeGhostPos] = useState({ x: 0, y: 0 });
  const [overDayColumn, setOverDayColumn] = useState(null);
  const equipeHoldTimerRef = useRef(null);
  const didEquipeDragRef = useRef(false);
  const overDayColumnRef = useRef(null);
  const ghostPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => { overDayColumnRef.current = overDayColumn; }, [overDayColumn]);

  const handleEquipeDragStart = useCallback((e, dateStr, equipeId) => {
    if (e.preventDefault) e.preventDefault();
    setDraggingEquipe({ dateStr, equipeId });
    setEquipeGhostPos({ x: e.clientX, y: e.clientY });
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  }, []);

  useEffect(() => {
    if (!draggingEquipe) return;
    const onMove = (e) => {
      setEquipeGhostPos({ x: e.clientX, y: e.clientY });
      ghostPosRef.current = { x: e.clientX, y: e.clientY };
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const colEl = el?.closest('[data-day-column]');
      setOverDayColumn(colEl ? colEl.getAttribute('data-day-column') : null);
    };
    const onUp = () => {
      const targetDate = overDayColumnRef.current;
      if (targetDate && draggingEquipe) {
        const { dateStr: srcDate, equipeId } = draggingEquipe;
        const ne = { ...equipes };
        const srcEquipes = ne[srcDate] || [];
        const equipe = srcEquipes.find(e => e.id === equipeId);
        if (equipe) {
          if (targetDate === srcDate) {
            // Réordonner au sein du même jour — trouver l'index cible par position souris
            const { y } = ghostPosRef.current;
            const equipeEls = document.querySelectorAll(`[data-day-column="${srcDate}"] [data-equipe-id]`);
            let insertIndex = srcEquipes.length - 1;
            equipeEls.forEach((el, i) => {
              const rect = el.getBoundingClientRect();
              if (y < rect.top + rect.height / 2) {
                insertIndex = Math.min(insertIndex, i);
              }
            });
            const without = srcEquipes.filter(e => e.id !== equipeId);
            without.splice(Math.min(insertIndex, without.length), 0, equipe);
            ne[srcDate] = without;
            setEquipes(ne);
            syncDossiersAfterEquipeChange(ne);
          } else {
            // Déplacer vers un autre jour — vérifier les conflits de techniciens
            const destEquipes = ne[targetDate] || [];
            const conflits = [];
            equipe.techniciens.forEach(techId => {
              const equipeConflictuante = destEquipes.find(eq => eq.id !== equipeId && eq.techniciens.includes(techId));
              if (equipeConflictuante) {
                const tech = techniciens.find(t => t.id === techId);
                conflits.push({ technicien: tech ? `${tech.prenom} ${tech.nom}` : techId, equipeNom: generateTeamDisplayName(equipeConflictuante) });
              }
            });

            const doMove = (srcDate, targetDate, equipeId, equipe) => {
              setEquipes(prev => {
                const ne2 = { ...prev };
                const src2 = ne2[srcDate] || [];
                ne2[srcDate] = src2.filter(e => e.id !== equipeId);
                if (!ne2[srcDate].length) delete ne2[srcDate];
                if (!ne2[targetDate]) ne2[targetDate] = [];
                const destEquipes = ne2[targetDate] || [];
                const posIdx = destEquipes.length; // sera ajouté à la fin
                const eqNom = generateTeamDisplayName(equipe, posIdx);
                ne2[targetDate] = [...destEquipes, { ...equipe }];
                // Mettre à jour date_cedulee de toutes les cartes de l'équipe
                if (onUpdateDossier) {
                  equipe.mandats.forEach(cardId => {
                    const card = terrainCards.find(c => c.id === cardId);
                    if (!card) return;
                    const freshDossier = dossiers.find(d => d.id === card.dossier.id);
                    if (!freshDossier) return;
                    const idParts = card.id.split('-');
                    const mandatIdx = parseInt(idParts[idParts.length - 2]);
                    const terrainIdx = parseInt(idParts[idParts.length - 1]);
                    const um = freshDossier.mandats.map((m, idx) => {
                      if (idx !== mandatIdx) return m;
                      let tl = m.terrains_list && m.terrains_list.length > 0
                        ? [...m.terrains_list]
                        : [{ ...(m.terrain || {}), statut_terrain: m.statut_terrain }];
                      const tIdx = terrainIdx < tl.length ? terrainIdx : 0;
                      tl[tIdx] = { ...tl[tIdx], date_cedulee: targetDate, equipe_assignee: eqNom };
                      const terrainPrincipal = { ...(m.terrain || {}), ...tl[0] };
                      return { ...m, date_terrain: targetDate, equipe_assignee: eqNom, terrains_list: tl, terrain: terrainPrincipal };
                    });
                    onUpdateDossier(freshDossier.id, { ...freshDossier, mandats: um });
                  });
                }
                syncDossiersAfterEquipeChange(ne2);
                return ne2;
              });
            };

            // Vérifier si une équipe avec le même nom existe déjà à la destination
            const equipeNomGeneree = generateTeamDisplayName(equipe);
            const destEquipesFiltered = destEquipes.filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
            const alreadyExistsAtDest = destEquipesFiltered.some(eq => eq.nom === equipe.nom);
            if (alreadyExistsAtDest) {
              setEquipeExistanteWarning({ equipeNom: equipeNomGeneree, targetDate });
            } else if (conflits.length > 0) {
              pendingEquipeMoveRef.current = { srcDate, targetDate, equipeId, equipe, doMove };
              setConflitTechnicienWarning({ equipe, srcDate, targetDate, conflits });
            } else {
              doMove(srcDate, targetDate, equipeId, equipe);
            }
          }
        }
      }
      setDraggingEquipe(null);
      setOverDayColumn(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [draggingEquipe, equipes, terrainCards, onUpdateDossier, syncDossiersAfterEquipeChange]);

  const holdTimerRef = useRef(null);
  const didDragRef = useRef(false);

  const executePendingDrop = () => {
    if (!pendingDrop) return;
    const { cardIds, dateStr, equipeId, insertIndex } = pendingDrop;
    if (!cardIds || cardIds.length === 0) { setRendezVousWarning(null); setPendingDrop(null); return; }
    const ne = applyCardDrop(cardIds, dateStr, equipeId, insertIndex, equipes);
    if (!ne[dateStr]) { setRendezVousWarning(null); setPendingDrop(null); return; }
    setEquipes(ne);
    const dayEqs = (ne[dateStr] || []).filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
    const equipe = ne[dateStr]?.find(e => e.id === equipeId);
    const posIdx = dayEqs.findIndex(e => e.id === equipeId);
    const eqNom = equipe ? generateTeamDisplayName(equipe, posIdx >= 0 ? posIdx : undefined) : '';
    cardIds.forEach(cid => {
      const c = terrainCards.find(t => t.id === cid);
      if (c) updateDossierForCard(c, dateStr, eqNom);
    });
    setRendezVousWarning(null); setPendingDrop(null);
  };

  // ---- @hello-pangea/dnd pour ressources (techniciens/véhicules/équipements) ----
  const onDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    const sourceId = source.droppableId; const destId = destination.droppableId;
    const isUsed = (dateStr, rId, rType, excl) => equipes[dateStr]?.some(eq => eq.id !== excl && eq[rType].includes(rId)) || false;
    if (type === "TECHNICIEN") {
      const d = parseEquipeDroppableId(destId); if (!d) return;
      if (isUsed(d.dateStr, draggableId, 'techniciens', d.equipeId)) { alert('Déjà assigné.'); return; }
      const ne = { ...equipes }; const eq = ne[d.dateStr]?.find(e => e.id === d.equipeId); if (!eq) return;
      const sp = parseEquipeDroppableId(sourceId); if (sp) { const se = ne[sp.dateStr]?.find(e => e.id === sp.equipeId); if (se) se.techniciens = se.techniciens.filter(id => id !== draggableId); }
      if (!eq.techniciens.includes(draggableId)) eq.techniciens.push(draggableId); setEquipes(ne); return;
    }
    if (type === "VEHICULE") {
      const d = parseEquipeDroppableId(destId); if (!d) return;
      if (isUsed(d.dateStr, draggableId, 'vehicules', d.equipeId)) { alert('Déjà assigné.'); return; }
      const ne = { ...equipes }; const eq = ne[d.dateStr]?.find(e => e.id === d.equipeId); if (!eq) return;
      const sp = parseEquipeDroppableId(sourceId); if (sp) { const se = ne[sp.dateStr]?.find(e => e.id === sp.equipeId); if (se) se.vehicules = se.vehicules.filter(id => id !== draggableId); }
      if (!eq.vehicules.includes(draggableId)) eq.vehicules.push(draggableId); setEquipes(ne); return;
    }
    if (type === "EQUIPEMENT") {
      const d = parseEquipeDroppableId(destId); if (!d) return;
      if (isUsed(d.dateStr, draggableId, 'equipements', d.equipeId)) { alert('Déjà assigné.'); return; }
      const ne = { ...equipes }; const eq = ne[d.dateStr]?.find(e => e.id === d.equipeId); if (!eq) return;
      const sp = parseEquipeDroppableId(sourceId); if (sp) { const se = ne[sp.dateStr]?.find(e => e.id === sp.equipeId); if (se) se.equipements = se.equipements.filter(id => id !== draggableId); }
      if (!eq.equipements.includes(draggableId)) eq.equipements.push(draggableId); setEquipes(ne); return;
    }
  };

  // Bouton d'action carte — utilise div simple (pas button, pas role=button) pour échapper au CSS global
  const CardActionBtn = ({ onClick, baseColor, hoverColor, textColor, hoverTextColor, title, children }) => {
    const [hovered, setHovered] = useState(false);
    return (
      <div
        onClick={onClick}
        title={title}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 26, height: 26, borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: hovered ? hoverColor : baseColor,
          color: hovered ? (hoverTextColor || '#ffffff') : textColor,
          transition: 'background-color 150ms, color 150ms',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        {children}
      </div>
    );
  };

  // ---- Render DossierCard (custom drag) ----
  const DossierCard = ({ card, showLock = false, hideEditButton = false, hideLinkedButton = false, hideStatut = false }) => {
    const { dossier, mandat, terrain } = card;
    const assignedUser = mandat?.utilisateur_assigne ? users?.find(u => u.email === mandat.utilisateur_assigne) : null;
    const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
    const draggingLinkedGroup = dragging ? getLinkedGroupForCard(dragging.card.id) : null;
    const isDraggingThis = !!dragging && (
      dragging.card.id === card.id ||
      (draggingLinkedGroup?.cardIds.includes(card.id) ?? false)
    );
    const isLocked = lockedCards.has(card.id);
    const linkedGroup = getLinkedGroupForCard(card.id);
    const isLinked = !!linkedGroup;
    const isLinkingFirst = linkingMode?.firstCardId === card.id;
    const isLinkingTarget = !!linkingMode && !isLinkingFirst;

    const onMouseDown = (e) => {
      if (isLocked) return;
      if (linkingMode !== null) return; // Ne pas drag en mode liaison
      e.stopPropagation();
      didDragRef.current = false;
      const savedEvent = { clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget };
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        didDragRef.current = true;
        handleDragStart({ ...savedEvent, preventDefault: () => {} }, card);
      }, 500);
    };

    const onMouseUp = () => {
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    };

    const onClick = (e) => {
      e.stopPropagation();
      if (linkingMode !== null) {
        handleLinkCard(card.id);
        return;
      }
      if (!didDragRef.current) handleCardClick(card);
    };

    const ringStyle = isLinkingFirst
      ? 'ring-2 ring-violet-400'
      : isLinked
        ? 'ring-1 ring-violet-500/60'
        : isLocked
          ? 'ring-1 ring-amber-500/60'
          : '';

    return (
      <div
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onClick={onClick}
        className={`${arpColor.split(' ')[0]} rounded-xl p-2 mb-2 select-none transition-all duration-150 ${ringStyle} ${isLocked ? 'opacity-80' : 'hover:scale-[1.02] cursor-pointer'} ${isDraggingThis ? 'opacity-30 scale-95' : ''} ${isLinkingTarget ? 'cursor-crosshair' : ''}`}
        style={{ cursor: isLocked ? 'default' : (linkingMode ? 'crosshair' : dragging ? (isDraggingThis ? 'grabbing' : 'inherit') : 'pointer'), boxShadow: (() => { const colorMap = { 'bg-red-500/20': 'rgba(239,68,68,0.6)', 'bg-slate-500/20': 'rgba(148,163,184,0.6)', 'bg-orange-500/20': 'rgba(249,115,22,0.6)', 'bg-yellow-500/20': 'rgba(234,179,8,0.6)', 'bg-cyan-500/20': 'rgba(34,211,238,0.6)' }; const bg = arpColor.split(' ')[0]; const clr = colorMap[bg] || 'rgba(16,185,129,0.6)'; return isLinked ? `inset 0 0 0 2px rgba(139,92,246,0.6), 0 4px 16px 0 rgba(0,0,0,0.4)` : isLocked ? `inset 0 0 0 2px rgba(245,158,11,0.5), 0 4px 16px 0 rgba(0,0,0,0.4)` : `inset 0 0 0 1px ${clr}, 0 4px 16px 0 rgba(0,0,0,0.4)`; })() }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
            <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0`}>{getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}</Badge>

          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', flexShrink: 0 }}>
            {!hideEditButton && (
              <CardActionBtn
                onClick={(e) => { e.stopPropagation(); handleEditTerrain(card); }}
                baseColor="rgba(59,130,246,0.25)"
                hoverColor="rgba(59,130,246,0.85)"
                textColor="#93c5fd"
                hoverTextColor="#fff"
                title="Modifier le terrain"
              >
                <Edit style={{ width: 13, height: 13 }} />
              </CardActionBtn>
            )}
            {!hideEditButton && (
              <CardActionBtn
                onClick={(e) => { e.stopPropagation(); setDeleteCardConfirm(card); }}
                baseColor="rgba(239,68,68,0.2)"
                hoverColor="rgba(239,68,68,0.85)"
                textColor="#fca5a5"
                hoverTextColor="#fff"
                title="Supprimer le terrain"
              >
                <Trash2 style={{ width: 13, height: 13 }} />
              </CardActionBtn>
            )}
            {!hideLinkedButton && (
              <CardActionBtn
                onClick={(e) => {
                  e.stopPropagation();
                  if (linkingMode) handleLinkCard(card.id);
                  else if (isLinked) handleUnlinkCard(linkedGroup.id, card.id);
                  else handleLinkCard(card.id);
                }}
                baseColor={isLinkingFirst ? 'rgba(139,92,246,0.8)' : isLinked ? 'rgba(139,92,246,0.4)' : 'rgba(71,85,105,0.35)'}
                hoverColor={isLinked && !linkingMode ? 'rgba(239,68,68,0.85)' : 'rgba(139,92,246,0.85)'}
                textColor={isLinkingFirst ? '#fff' : isLinked ? '#c4b5fd' : '#94a3b8'}
                hoverTextColor="#fff"
                title={linkingMode ? (isLinkingFirst ? 'Cliquer sur une autre carte pour lier' : 'Ajouter au groupe') : isLinked ? 'Retirer du groupe lié' : 'Lier avec une autre carte'}
              >
                {isLinked && !linkingMode ? <Unlink style={{ width: 13, height: 13 }} /> : <Link2 style={{ width: 13, height: 13 }} />}
              </CardActionBtn>
            )}
            {showLock && (
              <CardActionBtn
                onClick={(e) => { e.stopPropagation(); toggleLockCard(card.id); }}
                baseColor={isLocked ? 'rgba(245,158,11,0.85)' : 'rgba(71,85,105,0.35)'}
                hoverColor={isLocked ? 'rgba(251,191,36,1)' : 'rgba(245,158,11,0.7)'}
                textColor={isLocked ? '#fff' : '#94a3b8'}
                hoverTextColor={isLocked ? '#1c1917' : '#fff'}
                title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
              >
                {isLocked ? <Lock style={{ width: 13, height: 13 }} /> : <Unlock style={{ width: 13, height: 13 }} />}
              </CardActionBtn>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 mb-1"><User className="w-3 h-3 text-white flex-shrink-0" /><span className="text-xs text-white font-medium">{getClientsNames(dossier.clients_ids)}</span></div>
        {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && <div className="flex items-start gap-1 mb-1"><MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" /><span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span></div>}
        {mandat?.date_livraison && <div className="flex items-center gap-1 mb-1"><Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" /><span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span></div>}
        {terrain.date_limite_leve && <div className="flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" /><span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span></div>}
        {terrain.a_rendez_vous && terrain.date_rendez_vous && <div className="flex items-center gap-1 mb-1"><Clock className="w-3 h-3 text-orange-400 flex-shrink-0" /><span className="text-xs text-orange-300">RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}{terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}</span></div>}
        {terrain.instruments_requis && <div className="flex items-center gap-1 mb-1"><Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" /><span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span></div>}
        {terrain.technicien && <div className="flex items-center gap-1 mb-1"><UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" /><span className="text-xs text-blue-300 truncate">{terrain.technicien}</span></div>}
        {terrain.dossier_simultane && <div className="flex items-center gap-1 mb-1"><Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" /><span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span></div>}
        <div className="mt-2 pt-1 border-t border-emerald-500/30" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
          {/* Ligne unique : temps prévu | statut select | donneur + avatar */}
          {(() => {
            const STATUT_OPTIONS = ['Rendez-Vous', 'Client Avisé', 'Confirmé la veille', 'Retour terrain'];
            const currentStatut = cardStatuts[card.id]?.statut || null;
            const isOrange = currentStatut === 'Rendez-Vous' || currentStatut === 'Client Avisé';
            const isMauve = currentStatut === 'Confirmé la veille' || currentStatut === 'Retour terrain';
            const triggerInlineStyle = isOrange
              ? { background: 'rgba(249,115,22,0.3)', color: '#fb923c', fontWeight: 600, border: '1px solid #fb923c', textAlign: 'center', justifyContent: 'center' }
              : isMauve
              ? { background: 'rgba(139,92,246,0.3)', color: '#c084fc', fontWeight: 600, border: '1px solid #c084fc', textAlign: 'center', justifyContent: 'center' }
              : { background: 'rgba(30,41,59,0.4)', color: '#94a3b8', opacity: 0.5, border: '1px solid #94a3b8', textAlign: 'center', justifyContent: 'center' };
            return (
              <div className="flex items-center gap-1">
                {/* Temps prévu */}
                <div className="flex-shrink-0">
                  {terrain.temps_prevu
                    ? <div className="flex items-center gap-0.5"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>
                    : <div className="w-10" />}
                </div>
                {/* Select statut — centre, flex-1 */}
                <div className="flex-1 min-w-0" onMouseDown={e => e.stopPropagation()}>
                  {!hideStatut && <Select
                    value={currentStatut || ""}
                    onValueChange={(val) => {
                      setCardStatuts(prev => {
                        const newVal = (val === '__vide__' || val === currentStatut) ? null : val;
                        const next = { ...prev, [card.id]: { ...prev[card.id], statut: newVal } };
                        localStorage.setItem('terrainCardStatuts', JSON.stringify(next));
                        return next;
                      });
                    }}
                  >
                    <SelectTrigger
                     className="w-full h-6 text-xs px-1.5 py-0"
                     style={{ ...triggerInlineStyle, boxShadow: `0 0 0 1px ${isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8'}`, border: 'none', outline: 'none' }}
                     onMouseDown={e => e.stopPropagation()}
                    >
                      <SelectValue placeholder="Statut..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="__vide__" className="text-xs text-slate-400">— Aucun —</SelectItem>
                      {STATUT_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt} className="text-xs text-white">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                    </Select>}
                    {hideStatut && <div className="flex-1" />}
                </div>
                {/* Donneur + avatar */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {terrain.donneur && <span className="text-xs text-slate-400 font-medium">{terrain.donneur.split(' ').map(n => n[0]).join('').toUpperCase()}</span>}
                  {assignedUser
                    ? <Avatar className="w-5 h-5 border border-emerald-500/50"><AvatarImage src={assignedUser.photo_url} /><AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser)}</AvatarFallback></Avatar>
                    : <div className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30"><User className="w-2.5 h-2.5 text-emerald-500" /></div>}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  };

  const renderEquipeContent = (equipe, dateStr, positionIndex) => {
    const equipeNom = generateTeamDisplayName(equipe, positionIndex);
    const columnId = `terrain-${dateStr}-${equipe.id}`;
    const isOver = overColumn === columnId && dragging;
    const isDraggingThisEquipe = draggingEquipe?.equipeId === equipe.id;

    const onEquipeHeaderMouseDown = (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      didEquipeDragRef.current = false;
      const savedEvent = { clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget };
      equipeHoldTimerRef.current = setTimeout(() => {
        equipeHoldTimerRef.current = null;
        didEquipeDragRef.current = true;
        handleEquipeDragStart({ ...savedEvent, preventDefault: () => {} }, dateStr, equipe.id);
      }, 400);
    };
    const onEquipeHeaderMouseUp = () => {
      if (equipeHoldTimerRef.current) { clearTimeout(equipeHoldTimerRef.current); equipeHoldTimerRef.current = null; }
    };
    const onEquipeHeaderClick = (e) => {
      if (!didEquipeDragRef.current) handleEditTeam(dateStr, equipe);
    };

    return (
      <div key={equipe.id} data-equipe-id={equipe.id} className={`bg-slate-800/50 rounded-lg overflow-hidden transition-all duration-150 ${isOver ? 'ring-2 ring-emerald-400/80 bg-emerald-500/10' : ''} ${isDraggingThisEquipe ? 'opacity-30 scale-95' : ''}`}>
        <div
          className="bg-blue-600/40 px-2 py-2 border-b-2 border-blue-500/50 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onEquipeHeaderMouseDown}
          onMouseUp={onEquipeHeaderMouseUp}
          title="Maintenir pour déplacer l'équipe"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-white text-sm font-bold block hover:text-emerald-400" onClick={onEquipeHeaderClick}>{equipeNom}</span>
              {equipe.mandats.length > 0 && (() => {
                const { totalTime } = calculateEquipeTimings(equipe);
                const travelSecs = equipeTravelSeconds[equipe.id] || 0;
                const formatHHMM = (secs) => {
                  const h = Math.floor(secs / 3600);
                  const m = Math.round((secs % 3600) / 60);
                  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
                };
                const travailSecs = parseFloat(totalTime) * 3600;
                const totalSecs = travailSecs + travelSecs;
                return (
                  <span className="text-emerald-300 text-xs">
                    {formatHHMM(totalSecs)}
                    {travelSecs > 0 && <span className="text-slate-400 ml-1">({formatHHMM(travelSecs)} 🚗)</span>}
                  </span>
                );
              })()}
            </div>
            <div className="flex gap-0.5" onMouseDown={e => e.stopPropagation()}>
              <button onClick={() => copyEquipe(dateStr, equipe.id)} className="text-cyan-400 hover:text-cyan-300 transition-all duration-150 p-px rounded hover:bg-cyan-500/10"><Copy className="w-3 h-3" /></button>
              <button onClick={() => removeEquipe(dateStr, equipe.id)} className="text-red-400 hover:text-white hover:bg-red-600 transition-all duration-150 p-1 rounded"><X className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
        <div className="p-2">
          {globalViewMode === "techniciens" && <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-techniciens`} type="TECHNICIEN">{(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[24px] p-0.5 rounded flex flex-wrap gap-0.5 ${s.isDraggingOver ? 'bg-blue-500/20' : 'border border-slate-700'}`}>{equipe.techniciens.map(id => { const t = techniciens.find(t => t.id === id); return t ? <span key={id} className="bg-blue-500/20 border border-blue-500/30 rounded px-1 text-xs text-white flex items-center gap-1"><Users className="w-3 h-3 text-blue-400" />{t.prenom} {t.nom}</span> : null; })}{p.placeholder}</div>}</Droppable>}
          {globalViewMode === "vehicules" && <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-vehicules`} type="VEHICULE">{(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[24px] p-0.5 rounded flex flex-wrap gap-0.5 ${s.isDraggingOver ? 'bg-purple-500/20' : 'border border-slate-700'}`}>{equipe.vehicules.map(id => { const v = vehicules.find(v => v.id === id); return v ? <span key={id} className="bg-purple-500/20 border border-purple-500/30 rounded px-1 text-xs text-white flex items-center gap-1"><Truck className="w-3 h-3 text-purple-400" />{v.nom}</span> : null; })}{p.placeholder}</div>}</Droppable>}
          {globalViewMode === "equipements" && <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-equipements`} type="EQUIPEMENT">{(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[24px] p-0.5 rounded flex flex-wrap gap-0.5 ${s.isDraggingOver ? 'bg-orange-500/20' : 'border border-slate-700'}`}>{equipe.equipements.map(id => { const e = equipements.find(e => e.id === id); return e ? <span key={id} className="bg-orange-500/20 border border-orange-500/30 rounded px-1 text-xs text-white flex items-center gap-1"><Wrench className="w-3 h-3 text-orange-400" />{e.nom}</span> : null; })}{p.placeholder}</div>}</Droppable>}
          {/* Zone de drop custom pour les DossierCards */}
          <div data-kanban-column={columnId} className={`min-h-[50px] -mx-2 px-2 rounded transition-all ${isOver ? 'bg-emerald-500/10' : ''}`}>
            {equipe.mandats.map((cId, idx) => {
              const card = terrainCards.find(c => c.id === cId);
              if (!card) return null;
              const showIndicator = isOver && dropIndex === idx;
              return (
                <div key={cId} data-card-id={cId}>
                  {showIndicator && <div className="h-1 bg-emerald-400 rounded-full mx-1 mb-1 opacity-80" />}
                  <DossierCard card={card} showLock={true} />
                </div>
              );
            })}
            {isOver && (dropIndex == null || dropIndex >= equipe.mandats.length) && (
              <div className="h-1 bg-emerald-400 rounded-full mx-1 mt-1 opacity-80" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDay = (day, isMonthView = false) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
    const allDayEquipes = equipes[dateStr] || [];
    const dayEquipes = allDayEquipes.filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
    const holiday = isHoliday(day);
    const isDayOver = overDayColumn === dateStr && draggingEquipe && draggingEquipe.dateStr !== dateStr;
    return (
      <Card key={dateStr} data-day-column={dateStr} className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-emerald-500' : ''} ${holiday ? 'bg-red-900/20 border-red-500/30' : ''} w-full ${isDayOver ? 'ring-2 ring-blue-400/80 bg-blue-500/5' : ''}`}>
        <div className="mb-2">
          <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1">
                {isMonthView ? <><p className={`text-xs uppercase ${isToday ? 'text-emerald-400' : holiday ? 'text-red-400' : 'text-slate-400'}`}>{format(day, "EEE", { locale: fr })}</p><p className="text-lg font-bold text-white">{format(day, "d", { locale: fr })}</p></> : <><div className="text-sm font-bold text-white">{format(day, "EEEE", { locale: fr })}</div><div className={`text-xs ${isToday ? 'text-emerald-400' : holiday ? 'text-red-400' : 'text-slate-400'}`}>{format(day, "d MMM", { locale: fr })}</div></>}
              </div>
              {dayEquipes.length > 0 && <Button size="sm" onClick={() => openGoogleMapsForDay(dateStr)} className="h-6 w-6 p-0 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"><MapPin className="w-3 h-3" /></Button>}
            </div>
            {holiday && <div className="text-xs text-red-400">{holiday.name}</div>}
          </div>
        </div>
        <div className="space-y-2">{dayEquipes.map((eq, idx) => renderEquipeContent(eq, dateStr, idx))}</div>
        <Button size="sm" onClick={() => addEquipe(dateStr)} className={`w-full border-2 border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300 mt-2 ${isMonthView ? 'h-5 text-xs' : 'h-6'}`}><Plus className="w-3 h-3 mr-1" />{isMonthView ? 'Ajouter' : 'Ajouter équipe'}</Button>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <style>{`
        * { border: none !important; outline: none !important; } 
        [class*="border"],[class*="shadow"],[class*="outline"] { border: none !important; box-shadow: none !important; outline: none !important; }
        
        button[data-optimize-btn] {
          background: linear-gradient(90deg, rgb(59, 130, 246), rgb(96, 165, 250), rgb(59, 130, 246)) !important;
          background-size: 200% 200% !important;
          color: white !important;
          border: 1px solid rgb(96, 165, 250) !important;
        }
        
        button[data-optimize-btn]:hover {
          animation: shimmer 2s infinite !important;
          box-shadow: 0 0 20px rgb(59, 130, 246), 0 0 40px rgb(96, 165, 250) !important;
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Connecteurs visuels pour les cartes liées */}
      <LinkedCardsConnector linkedGroups={linkedGroups} terrainCards={terrainCards} />

      {/* Ghost card pendant le drag custom */}
      {dragging && <TerrainGhostCard card={dragging.card} pos={ghostPos} clients={clients} users={users} techniciens={techniciens} linkedGroups={linkedGroups} terrainCards={terrainCards} />}

      {/* Ghost équipe pendant le drag d'équipe */}
      {draggingEquipe && ReactDOM.createPortal(
        <div style={{
          position: 'fixed', left: equipeGhostPos.x - 80, top: equipeGhostPos.y - 16,
          width: 180, zIndex: 99999, pointerEvents: 'none', opacity: 0.9,
          transform: 'rotate(2deg) scale(1.05)', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.6))',
        }}>
          <div className="bg-blue-600/80 rounded-lg px-3 py-2 border-2 border-blue-400/60">
            <span className="text-white text-sm font-bold">
              {(() => { const dayEqs = (equipes[draggingEquipe.dateStr] || []).filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()); const idx = dayEqs.findIndex(e => e.id === draggingEquipe.equipeId); const eq = dayEqs[idx]; return eq ? generateTeamDisplayName(eq, idx >= 0 ? idx : undefined) : ''; })()}
            </span>
            <div className="text-blue-200 text-xs mt-0.5">Déplacer vers un autre jour</div>
          </div>
        </div>,
        document.body
      )}

      <Card className="bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm shadow-xl mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-white font-bold text-lg">{viewMode === "week" ? `Semaine du ${format(days[0], "d MMMM", { locale: fr })} au ${format(days[days.length - 1], "d MMMM yyyy", { locale: fr })}` : format(currentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: fr }).slice(1)}</div>
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" onClick={goToPrevious} className="bg-slate-800 border-slate-700 text-white transition-all duration-200 hover:bg-slate-600 hover:border-slate-500 hover:text-white hover:scale-105">← Précédent</Button>
                <Button size="sm" onClick={goToToday} className="bg-emerald-500/20 text-emerald-400 transition-all duration-200 hover:bg-emerald-500/40 hover:text-emerald-300 hover:scale-105">Aujourd'hui</Button>
                <Button size="sm" variant="outline" onClick={goToNext} className="bg-slate-800 border-slate-700 text-white transition-all duration-200 hover:bg-slate-600 hover:border-slate-500 hover:text-white hover:scale-105">Suivant →</Button>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => setViewMode("week")} className={`transition-all duration-200 hover:scale-105 ${viewMode === "week" ? "bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-white hover:bg-slate-600 hover:text-white"}`}>Semaine</Button>
                  <Button size="sm" onClick={() => setViewMode("month")} className={`transition-all duration-200 hover:scale-105 ${viewMode === "month" ? "bg-emerald-500/30 text-emerald-300 ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/20" : "bg-slate-800 text-white hover:bg-slate-600 hover:text-white"}`}>Mois</Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-white text-sm">Afficher :</span>
              <Button size="sm" onClick={() => setGlobalViewMode(globalViewMode === "techniciens" ? null : "techniciens")} className={`transition-all duration-200 hover:scale-105 ${globalViewMode === "techniciens" ? "bg-blue-500/40 text-blue-300 ring-2 ring-blue-500/60 shadow-lg shadow-blue-500/20" : "bg-slate-800 text-white hover:bg-blue-500/20 hover:text-blue-300 hover:ring-1 hover:ring-blue-500/40"}`}><Users className="w-3 h-3 mr-1" />Techniciens</Button>
              <Button size="sm" onClick={() => setGlobalViewMode(globalViewMode === "vehicules" ? null : "vehicules")} className={`transition-all duration-200 hover:scale-105 ${globalViewMode === "vehicules" ? "bg-purple-500/40 text-purple-300 ring-2 ring-purple-500/60 shadow-lg shadow-purple-500/20" : "bg-slate-800 text-white hover:bg-purple-500/20 hover:text-purple-300 hover:ring-1 hover:ring-purple-500/40"}`}><Truck className="w-3 h-3 mr-1" />Véhicules</Button>
              <Button size="sm" onClick={() => setGlobalViewMode(globalViewMode === "equipements" ? null : "equipements")} className={`transition-all duration-200 hover:scale-105 ${globalViewMode === "equipements" ? "bg-orange-500/40 text-orange-300 ring-2 ring-orange-500/60 shadow-lg shadow-orange-500/20" : "bg-slate-800 text-white hover:bg-orange-500/20 hover:text-orange-300 hover:ring-1 hover:ring-orange-500/40"}`}><Wrench className="w-3 h-3 mr-1" />Équipements</Button>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {linkingMode && (
                  <div className="flex items-center gap-2 bg-violet-900/40 border border-violet-500/40 rounded-lg px-2 py-1">
                    <Link2 className="w-3 h-3 text-violet-400 animate-pulse" />
                    <span className="text-xs text-violet-300">
                      {linkingMode.firstCardId ? 'Cliquer sur une autre carte pour lier' : 'Cliquer sur une carte'}
                    </span>
                    <button onClick={() => setLinkingMode(null)} className="text-slate-400 hover:text-white ml-1"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <Button
                  size="sm"
                  data-optimize-btn
                  onClick={handleOptimizeAll}
                  disabled={isOptimizing}
                >
                  {isOptimizing ? <Loader className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                  {isOptimizing ? 'Optimisation...' : 'Optimiser'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4" style={{ alignItems: 'flex-start' }}>
          {/* Panneau gauche - cartes non assignées */}
          {/* Placeholder pour réserver l'espace dans le flux + mesurer la position initiale */}
          <div ref={sidebarContainerRef} className="w-[240px] flex-shrink-0" style={{ visibility: 'hidden', pointerEvents: 'none' }} aria-hidden="true" />
          {/* Panneau fixe dont le top est calculé dynamiquement via JS */}
          <div ref={sidebarRef} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-col w-[240px] flex-shrink-0" style={{ position: 'fixed', top: '73px', maxHeight: 'calc(100vh - 73px - 10px)', zIndex: 10 }}>
            <Tabs defaultValue="verification" className="w-full flex flex-col">
              <TabsList className="bg-slate-900/80 w-full grid grid-cols-2 mb-3 gap-1 p-1 rounded-lg">
                <TabsTrigger value="verification" className="text-xs px-2 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:ring-2 data-[state=active]:ring-primary/60 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=inactive]:bg-slate-800 data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:bg-slate-700 data-[state=inactive]:hover:text-slate-300">En vérification</TabsTrigger>
                <TabsTrigger value="planifier" className="text-xs px-2 py-2 rounded-lg transition-all duration-200 data-[state=active]:bg-primary/30 data-[state=active]:text-primary data-[state=active]:ring-2 data-[state=active]:ring-primary/60 data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=inactive]:bg-slate-800 data-[state=inactive]:text-slate-400 data-[state=inactive]:hover:bg-slate-700 data-[state=inactive]:hover:text-slate-300">À planifier</TabsTrigger>
              </TabsList>
              <TabsContent value="verification" className="mt-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <h3 className="text-white font-semibold mb-3 text-sm">En vérification ({unassignedCards.filter(c => !c.terrain?.statut_terrain || c.terrain?.statut_terrain === "en_verification").length})</h3>
                <div className="pr-2">
                  {unassignedCards.filter(c => !c.terrain?.statut_terrain || c.terrain?.statut_terrain === "en_verification").map(card => (
                    <div key={card.id} className="mb-2">
                      <DossierCard card={card} hideEditButton hideLinkedButton hideStatut />
                      <TerrainVerificationCard card={card} onUpdateDossier={onUpdateDossier} />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="planifier" className="mt-0 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                <h3 className="text-white font-semibold mb-3 text-sm">À planifier ({unassignedCards.filter(c => c.terrain?.statut_terrain === "a_ceduler").length})</h3>
                <div
                  data-kanban-column="unassigned"
                  data-kanban-scroll
                  className={`pr-2 rounded-lg transition-all ${overColumn === 'unassigned' && dragging ? 'bg-emerald-500/10 ring-2 ring-emerald-400/50' : ''}`}
                >
                  {unassignedCards.filter(c => c.terrain?.statut_terrain === "a_ceduler").map((card) => (
                    <div key={card.id} className="mb-2">
                      <DossierCard card={card} showLock />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Calendrier */}
          <div data-kanban-scroll className="flex-1 min-w-0" style={{ cursor: dragging ? 'grabbing' : 'default' }}>
            <div className="grid grid-cols-5 w-full" style={{ gap: '2px', minWidth: 'max-content', transform: 'scaleX(0.95)', transformOrigin: 'left top' }}>
              {days.map(day => renderDay(day, viewMode === "month"))}
            </div>
          </div>
        </div>
      </DragDropContext>

      <EditDossierDialog isOpen={isEditingDialogOpen} onClose={() => { setIsEditingDialogOpen(false); setEditingDossier(null); }} dossier={editingDossier} onSuccess={() => {}} clients={clients} users={users} />



      <CreateTeamTerrainDialog isOpen={isCreateTeamDialogOpen} onClose={() => setIsCreateTeamDialogOpen(false)} onCreateTeam={handleCreateTeam} dateStr={createTeamDateStr} users={users} vehicules={vehicules} equipements={equipements} equipes={equipes} placeAffaire={placeAffaire} />

      <EditTeamDialog isOpen={isEditTeamDialogOpen} onClose={() => { setIsEditTeamDialogOpen(false); setEditingTeam(null); setEditTeamDateStr(null); }} onUpdateTeam={handleUpdateTeam} dateStr={editTeamDateStr} equipe={editingTeam} techniciens={users} vehicules={vehicules} equipements={equipements} equipes={equipes} placeAffaire={placeAffaire} />

      <Dialog open={isTerrainDialogOpen} onOpenChange={setIsTerrainDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader><DialogTitle className="text-xl">Modifier les informations terrain</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1"><Label className="text-slate-400 text-xs">Temps prévu</Label><Input placeholder="Ex: 2h30" value={terrainForm.temps_prevu} onChange={(e) => setTerrainForm({...terrainForm, temps_prevu: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" /></div>
              <div className="space-y-1"><Label className="text-slate-400 text-xs">Donneur</Label><Select value={terrainForm.donneur || ""} onValueChange={(v) => setTerrainForm({...terrainForm, donneur: v})}><SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{users?.filter(u => u.statut === 'Actif' || !u.statut).map(u => <SelectItem key={u.email} value={u.full_name} className="text-white text-xs">{u.full_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-slate-400 text-xs">Instruments</Label><Select value={terrainForm.instruments_requis || ""} onValueChange={(v) => setTerrainForm({...terrainForm, instruments_requis: v})}><SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{["Can-Net","RTK","CONV","3 GPS","Chaine","SX10","NAVIS","Drône"].map(v => <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label className="text-slate-400 text-xs">Technicien</Label><Select value={terrainForm.technicien || ""} onValueChange={(v) => setTerrainForm({...terrainForm, technicien: v})}><SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700">{techniciens?.map(t => <SelectItem key={t.id} value={`${t.prenom} ${t.nom}`} className="text-white text-xs">{t.prenom} {t.nom}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1"><Label className="text-slate-400 text-xs">Date limite cédule</Label><Input type="date" value={terrainForm.date_limite_leve} onChange={(e) => setTerrainForm({...terrainForm, date_limite_leve: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" /></div>
              <div className="space-y-1 flex items-end"><div className="flex items-center gap-2 h-8"><Switch checked={terrainForm.a_rendez_vous || false} onCheckedChange={(v) => setTerrainForm({...terrainForm, a_rendez_vous: v})} className="data-[state=checked]:bg-amber-400" /><Label className="text-slate-400 text-xs">Rendez-vous</Label></div></div>
              {terrainForm.a_rendez_vous && <><div className="space-y-1"><Label className="text-slate-400 text-xs">Date RDV</Label><Input type="date" value={terrainForm.date_rendez_vous} onChange={(e) => setTerrainForm({...terrainForm, date_rendez_vous: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" /></div><div className="space-y-1"><Label className="text-slate-400 text-xs">Heure RDV</Label><Input type="time" value={terrainForm.heure_rendez_vous} onChange={(e) => setTerrainForm({...terrainForm, heure_rendez_vous: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" /></div></>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="outline" onClick={() => setIsTerrainDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveTerrain} className="bg-gradient-to-r from-emerald-500 to-teal-600">Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rendezVousWarning} onOpenChange={() => { setRendezVousWarning(null); setPendingDrop(null); }}>
        <DialogContent className="border-none text-white max-w-md" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 text-center">⚠️ Attention ⚠️</DialogTitle></DialogHeader>
          {rendezVousWarning && <div className="space-y-4">
            <p className="text-slate-300 text-center">Ce terrain a un rendez-vous le <span className="text-emerald-400 font-semibold">{format(new Date(rendezVousWarning.card.terrain.date_rendez_vous + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}</span>.</p>
            <p className="text-slate-300 text-center">Voulez-vous le déplacer vers le <span className="text-emerald-400 font-semibold">{format(new Date(rendezVousWarning.newDateStr + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}</span> ?</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={() => { setRendezVousWarning(null); setPendingDrop(null); }} className="border border-red-500 text-red-400 bg-transparent">Annuler</Button>
              <Button onClick={executePendingDrop} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteEquipeWarning} onOpenChange={() => setDeleteEquipeWarning(null)}>
        <DialogContent className="border-none text-white max-w-md" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 text-center">⚠️ Attention ⚠️</DialogTitle></DialogHeader>
          {deleteEquipeWarning && <div className="space-y-4">
            <p className="text-slate-300 text-center">Cette équipe contient <span className="text-emerald-400 font-semibold">{deleteEquipeWarning.equipe.mandats.length} mandat(s)</span>.</p>
            <p className="text-slate-300 text-center">Voulez-vous vraiment la supprimer ?</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={() => setDeleteEquipeWarning(null)} className="border border-red-500 text-red-400 bg-transparent">Annuler</Button>
              <Button onClick={() => confirmRemoveEquipe(deleteEquipeWarning.dateStr, deleteEquipeWarning.equipeId)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Supprimer</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!conflitTechnicienWarning} onOpenChange={() => { setConflitTechnicienWarning(null); pendingEquipeMoveRef.current = null; }}>
        <DialogContent className="border-none text-white max-w-md" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-red-400 text-center">🚫 Techniciens déjà attribués</DialogTitle></DialogHeader>
          {conflitTechnicienWarning && <div className="space-y-4">
            <p className="text-slate-300 text-center">
              Impossible de déplacer cette équipe vers le <span className="text-emerald-400 font-semibold">{format(new Date(conflitTechnicienWarning.targetDate + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}</span>.
            </p>
            <p className="text-slate-400 text-center text-sm">Les techniciens suivants sont déjà assignés à une autre équipe ce jour-là :</p>
            <ul className="space-y-1 bg-slate-800/50 rounded-lg p-3">
              {conflitTechnicienWarning.conflits.map((c, i) => (
                <li key={i} className="text-center text-sm">
                  <span className="text-yellow-300 font-semibold">{c.technicien}</span>
                  <span className="text-slate-400"> → </span>
                  <span className="text-blue-300 font-semibold">{c.equipeNom}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-center pt-2">
              <Button onClick={() => { setConflitTechnicienWarning(null); pendingEquipeMoveRef.current = null; }} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!equipeExistanteWarning} onOpenChange={() => setEquipeExistanteWarning(null)}>
        <DialogContent className="border-none text-white max-w-md" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 text-center">⚠️ Équipe déjà existante</DialogTitle></DialogHeader>
          {equipeExistanteWarning && <div className="space-y-4">
            <p className="text-slate-300 text-center">
              L'équipe <span className="text-emerald-400 font-semibold">"{equipeExistanteWarning.equipeNom}"</span> existe déjà le{' '}
              <span className="text-emerald-400 font-semibold">{format(new Date(equipeExistanteWarning.targetDate + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}</span>.
            </p>
            <p className="text-slate-400 text-center text-sm">Impossible de déplacer ou copier cette équipe vers ce jour.</p>
            <div className="flex justify-center pt-2">
              <Button onClick={() => setEquipeExistanteWarning(null)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteCardConfirm} onOpenChange={() => setDeleteCardConfirm(null)}>
        <DialogContent className="border-none text-white max-w-md" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-red-400 text-center">🗑️ Supprimer ce terrain</DialogTitle></DialogHeader>
          {deleteCardConfirm && <div className="space-y-4">
            <p className="text-slate-300 text-center">Voulez-vous vraiment supprimer le terrain <span className="text-emerald-400 font-semibold">{getArpenteurInitials(deleteCardConfirm.dossier.arpenteur_geometre)}{deleteCardConfirm.dossier.numero_dossier}</span> ?</p>
            <p className="text-slate-400 text-center text-sm">Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={() => setDeleteCardConfirm(null)} className="border border-slate-500 text-slate-300 bg-transparent">Annuler</Button>
              <Button onClick={() => handleDeleteCard(deleteCardConfirm)} className="bg-gradient-to-r from-red-500 to-red-700 border-none">Supprimer</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] p-0 gap-0" style={{ position: 'fixed', top: '160px', left: '50%', transform: 'translateX(-50%)', height: 'calc(100vh - 170px)', maxHeight: 'calc(100vh - 170px)', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader className="p-4 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-white">Tous les trajets - {selectedMapDate && format(new Date(selectedMapDate + 'T00:00:00'), "EEEE d MMMM yyyy", { locale: fr })}</DialogTitle>
            {mapRoutes.length > 0 && (
              <div className="space-y-3 mt-3">
                {/* Filtre par équipe */}
                <div className="flex flex-wrap gap-2">
                  {[...new Set(mapRoutes.map(r => r.equipeId))].map(equipeId => {
                    const route = mapRoutes.find(r => r.equipeId === equipeId);
                    const isVisible = visibleTeams.includes(equipeId);
                    return (
                      <label key={equipeId} className="flex items-center gap-2 px-3 py-1 rounded-lg cursor-pointer transition-all" style={{ background: isVisible ? `${route?.color || '#666'}33` : 'rgba(71,85,105,0.3)', border: `1px solid ${isVisible ? (route?.color || '#666') : 'rgba(255,255,255,0.2)'}` }}>
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setVisibleTeams([...visibleTeams, equipeId]);
                            } else {
                              setVisibleTeams(visibleTeams.filter(id => id !== equipeId));
                            }
                          }}
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs text-white font-medium">{route?.label || equipeId}</span>
                      </label>
                    );
                  })}
                </div>
                {/* Boutons trajets */}
                <div className="flex flex-wrap gap-2">
                  {mapRoutes.map((route, i) => {
                    const isSelected = selectedRoutes.includes(i);
                    const travelSecs = (route.equipeId ? equipeTravelSeconds[route.equipeId] : 0) || 0;
                    const formatHHMM = (secs) => { const h = Math.floor(secs / 3600); const m = Math.round((secs % 3600) / 60); return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`; };
                    const travelLabel = travelSecs > 0 ? formatHHMM(travelSecs) : null;
                    const travailSecs = route.dossiers?.reduce((sum, d) => { const match = (d.tempsPrevu || '').match(/(\d+(?:\.\d+)?)/); return sum + (match ? parseFloat(match[0]) * 3600 : 0); }, 0) || 0;
                    const totalLabel = travelSecs > 0 ? formatHHMM(travailSecs + travelSecs) : null;
                    return null;
                  })}
                </div>
              </div>
            )}
          </DialogHeader>
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Colonne gauche — équipes et cartes terrain (même style que le planning) */}
            <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid rgba(51,65,85,0.8)', background: 'rgba(15,23,42,0.6)', padding: '8px' }}>
              {selectedMapDate && (() => {
                const dayEquipes = (equipes[selectedMapDate] || [])
                  .filter(eq => !placeAffaire || eq.place_affaire?.toLowerCase() === placeAffaire.toLowerCase());
                return dayEquipes.map((equipe, posIdx) => {
                  const routeIdx = mapRoutes.findIndex(r => r.equipeId === equipe.id);
                  const routeForEquipe = routeIdx >= 0 ? mapRoutes[routeIdx] : null;
                  const color = routeForEquipe ? routeForEquipe.color : COLORS[posIdx % COLORS.length];
                  const isRouteVisible = routeIdx >= 0 ? selectedRoutes.includes(routeIdx) : false;
                  const equipeNom = generateTeamDisplayName(equipe, posIdx);
                  const travelSecs = equipeTravelSeconds[equipe.id] || 0;
                  const formatHHMM = (secs) => { const h = Math.floor(secs / 3600); const m = Math.round((secs % 3600) / 60); return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`; };
                  const { totalTime } = calculateEquipeTimings(equipe);
                  const travailSecs = parseFloat(totalTime) * 3600;
                  const totalSecs = travailSecs + travelSecs;
                  return (
                    <div key={equipe.id} className="bg-slate-800/50 rounded-lg overflow-hidden mb-3" style={{ opacity: routeIdx >= 0 && !isRouteVisible ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                      {/* Header équipe — avec bouton toggle trajet */}
                      <div className="bg-blue-600/40 px-2 py-2 border-b-2 border-blue-500/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-white text-sm font-bold block truncate">{equipeNom}</span>
                            {equipe.mandats.length > 0 && (
                              <span className="text-emerald-300 text-xs">
                                {formatHHMM(totalSecs)}
                                {travelSecs > 0 && <span className="text-slate-400 ml-1">({formatHHMM(travelSecs)} 🚗)</span>}
                              </span>
                            )}

                          </div>

                        </div>
                      </div>
                      {/* Cartes terrain — DossierCard sans boutons + lettre pin */}
                      <div className="p-2">
                        {equipe.mandats.map((cId, cardIdx) => {
                          const card = terrainCards.find(c => c.id === cId);
                          if (!card) return null;
                          const pinLetter = String.fromCharCode(65 + cardIdx); // A, B, C...
                          return (
                            <div key={cId} style={{ position: 'relative' }}>
                              {/* Badge lettre pin */}
                              <div style={{
                                position: 'absolute', top: 6, right: 6, zIndex: 10,
                                width: 22, height: 22, borderRadius: '50%',
                                background: color, border: '2px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 700, color: 'white',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                              }}>
                                {pinLetter}
                              </div>
                              <DossierCard card={card} hideEditButton={true} hideLinkedButton={true} showLock={false} hideStatut={true} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            {/* Carte Google Maps */}
            <div style={{ flex: 1, height: '100%' }}>
              {!googleMapsApiKey
                ? <div className="flex items-center justify-center h-full text-slate-400">Chargement...</div>
                : mapRoutes.length === 0
                  ? <div className="flex items-center justify-center h-full text-slate-400">Aucun trajet</div>
                  : (() => {
                    // Filtrer les routes selon les équipes visibles et les trajets sélectionnés
                    const filteredRoutes = mapRoutes.filter(route => visibleTeams.includes(route.equipeId));
                    const visibleIndices = selectedRoutes.filter(i => filteredRoutes.some((_, idx) => mapRoutes.findIndex(r => r.equipeId === filteredRoutes[idx].equipeId && r === filteredRoutes[idx]) === i));
                    return filteredRoutes.length > 0 ? (
                      <MapWithStableRoutes
                        mapRoutes={filteredRoutes}
                        visibleRouteIndices={visibleIndices}
                        apiKey={googleMapsApiKey}
                        onEquipeDurations={(equipeId, secs) => setEquipeTravelSeconds(prev => ({ ...prev, [equipeId]: secs }))}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">Aucun trajet correspondant aux filtres</div>
                    );
                  })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}