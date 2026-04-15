import React, { useState, useEffect } from "react";
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
import { Users, Truck, Wrench, Plus, Edit, X, MapPin, Calendar, User, Clock, UserCheck, Link2, Timer, AlertCircle, Copy, Folder } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import EditDossierDialog from "../dossiers/EditDossierDialog";
import CommentairesSection from "../dossiers/CommentairesSection";
import TerrainVerificationCard from "./TerrainVerificationCard";
import CreateTeamDialog from "./CreateTeamDialog";
import EditTeamDialog from "./EditTeamDialog";
import MultiRouteMap from "./MultiRouteMap";
import SharePointTerrainViewer from "./SharePointTerrainViewer";

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

export default function PlanningCalendar({ dossiers, techniciens, vehicules, equipements, clients, onUpdateDossier, onAddTechnicien, onAddVehicule, onAddEquipement, onEditTechnicien, onDeleteTechnicien, onEditVehicule, onDeleteVehicule, onEditEquipement, onDeleteEquipement, users, lots, placeAffaire }) {
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
  const [pendingDragDrop, setPendingDragDrop] = useState(null);
  const [deleteEquipeWarning, setDeleteEquipeWarning] = useState(null);
  const [terrainForm, setTerrainForm] = useState({ date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" });
  const [travelTimes, setTravelTimes] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [mapUrl, setMapUrl] = useState(null);
  const [loadingMapUrl, setLoadingMapUrl] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [mapRoutes, setMapRoutes] = useState([]);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [isSharePointDialogOpen, setIsSharePointDialogOpen] = useState(false);
  const [sharePointItem, setSharePointItem] = useState(null);

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
      } catch (e) { console.error('Erreur chargement équipes:', e); }
    };
    loadEquipes();
  }, []);

  useEffect(() => {
    const save = async () => {
      if (Object.keys(equipes).length === 0) return;
      setIsSaving(true);
      try {
        const existing = await base44.entities.EquipeTerrain.list();
        const existingIds = new Set(existing.map(eq => eq.id));
        const currentIds = new Set();
        for (const [dateStr, dayEquipes] of Object.entries(equipes)) {
          for (const equipe of dayEquipes) {
            currentIds.add(equipe.id);
            const data = { date_terrain: dateStr, nom: equipe.nom, place_affaire: equipe.place_affaire || placeAffaire, techniciens: equipe.techniciens || [], vehicules: equipe.vehicules || [], equipements: equipe.equipements || [], mandats: equipe.mandats || [] };
            if (existingIds.has(equipe.id)) await base44.entities.EquipeTerrain.update(equipe.id, data);
            else await base44.entities.EquipeTerrain.create(data);
          }
        }
        for (const eq of existing) { if (!currentIds.has(eq.id)) await base44.entities.EquipeTerrain.delete(eq.id); }
      } catch (e) { console.error('Erreur sauvegarde:', e); } finally { setIsSaving(false); }
    };
    const id = setTimeout(save, 1000);
    return () => clearTimeout(id);
  }, [equipes]);

  useEffect(() => {
    const load = async () => {
      try { const r = await base44.functions.invoke('getGoogleMapsApiKey'); if (r.data?.apiKey) setGoogleMapsApiKey(r.data.apiKey); } catch (e) {}
    };
    load();
  }, []);

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

  const days = getDays();
  const goToPrevious = () => viewMode === "week" ? setCurrentDate(subWeeks(currentDate, 1)) : setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNext = () => viewMode === "week" ? setCurrentDate(addWeeks(currentDate, 1)) : setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const generateTeamDisplayName = (equipe) => {
    if (equipe.techniciens.length === 0) return equipe.nom;
    const initials = equipe.techniciens.map(id => { const t = techniciens.find(t => t.id === id); return t ? t.prenom.charAt(0) + t.nom.charAt(0) : ''; }).filter(n => n).join('-');
    const match = equipe.nom.match(/Équipe (\d+)/);
    return match ? `Équipe ${match[1]} - ${initials}` : equipe.nom;
  };

  const parseEquipeDroppableId = (id) => {
    if (!id.startsWith('equipe-')) return null;
    const parts = id.split('-');
    return { dateStr: `${parts[1]}-${parts[2]}-${parts[3]}`, equipeId: parts[4], type: parts[5] };
  };

  const generateTerrainCards = () => {
    const cards = [];
    const filtered = placeAffaire ? dossiers.filter(d => d.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()) : dossiers;
    filtered.forEach(dossier => {
      const mandatsCedule = dossier.mandats?.filter(m => m.tache_actuelle === "Cédule") || [];
      mandatsCedule.forEach((mandat, mandatIndex) => {
        if (mandat.terrains_list?.length > 0) {
          mandat.terrains_list.forEach((terrain, terrainIndex) => {
            cards.push({ id: `${dossier.id}-${mandatIndex}-${terrainIndex}`, dossierId: dossier.id, dossier, mandat, terrain, mandatIndex, terrainIndex });
          });
        }
      });
    });
    return cards;
  };

  const terrainCards = generateTerrainCards();

  useEffect(() => {
    const validIds = new Set(terrainCards.map(c => c.id));
    let needsUpdate = false;
    const updated = { ...equipes };
    Object.keys(updated).forEach(dateStr => {
      updated[dateStr].forEach(equipe => {
        const orig = equipe.mandats.length;
        equipe.mandats = equipe.mandats.filter(id => validIds.has(id));
        if (equipe.mandats.length !== orig) needsUpdate = true;
      });
    });
    terrainCards.forEach(card => {
      if (card.terrain?.date_cedulee && card.terrain?.equipe_assignee) {
        const dateStr = card.terrain.date_cedulee; const equipeNom = card.terrain.equipe_assignee;
        const isAssigned = Object.values(updated).some(de => de.some(eq => eq.mandats.includes(card.id)));
        if (!isAssigned) {
          if (!updated[dateStr]) updated[dateStr] = [];
          let equipe = updated[dateStr].find(eq => generateTeamDisplayName(eq) === equipeNom);
          if (!equipe) {
            equipe = { id: `eq${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, nom: equipeNom, place_affaire: placeAffaire, techniciens: [], vehicules: [], equipements: [], mandats: [] };
            updated[dateStr].push(equipe);
          }
          if (!equipe.mandats.includes(card.id)) { equipe.mandats.push(card.id); needsUpdate = true; }
        }
      }
    });
    if (needsUpdate) setEquipes(updated);
  }, [dossiers]);

  const unassignedCards = terrainCards.filter(card => {
    const isAssigned = Object.values(equipes).some(de => de.some(eq => eq.mandats.includes(card.id)));
    return !isAssigned;
  });

  const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  const parseTimeString = (ts) => { if (!ts) return 0; const m = ts.match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[0]) : 0; };

  const calculateEquipeTimings = (equipe) => {
    let total = 0; let travel = 0;
    equipe.mandats.forEach(id => { const c = terrainCards.find(c => c.id === id); if (c?.terrain?.temps_prevu) total += parseTimeString(c.terrain.temps_prevu); });
    return { totalTime: (total + travel).toFixed(1), cardCount: equipe.mandats.length };
  };

  const getUsedResourcesForDate = (dateStr) => {
    const de = equipes[dateStr] || [];
    const t = new Set(); const v = new Set(); const e = new Set();
    de.forEach(eq => { eq.techniciens.forEach(id => t.add(id)); eq.vehicules.forEach(id => v.add(id)); eq.equipements.forEach(id => e.add(id)); });
    return { techniciens: Array.from(t), vehicules: Array.from(v), equipements: Array.from(e) };
  };

  const getEquipeActiveTab = (id) => equipeActiveTabs[id] !== undefined ? equipeActiveTabs[id] : null;
  const setEquipeActiveTab = (id, tab) => { const cur = getEquipeActiveTab(id); setEquipeActiveTabs({ ...equipeActiveTabs, [id]: cur === tab ? null : tab }); };

  const addEquipe = (dateStr) => { setCreateTeamDateStr(dateStr); setIsCreateTeamDialogOpen(true); };
  const handleCreateTeam = (newEquipe) => {
    const ne = { ...equipes };
    if (!ne[createTeamDateStr]) ne[createTeamDateStr] = [];
    if (ne[createTeamDateStr].find(eq => generateTeamDisplayName(eq) === generateTeamDisplayName(newEquipe))) { alert('Équipe existante.'); return; }
    ne[createTeamDateStr].push(newEquipe); setEquipes(ne);
    setEquipeActiveTabs({ ...equipeActiveTabs, [newEquipe.id]: null });
    setIsCreateTeamDialogOpen(false);
  };
  const handleEditTeam = (dateStr, equipe) => { setEditingTeam(equipe); setEditTeamDateStr(dateStr); setIsEditTeamDialogOpen(true); };
  const handleUpdateTeam = (updatedTeam) => {
    const ne = { ...equipes };
    if (ne[editTeamDateStr]) { const idx = ne[editTeamDateStr].findIndex(eq => eq.id === updatedTeam.id); if (idx !== -1) { ne[editTeamDateStr][idx] = updatedTeam; setEquipes(ne); } }
    setIsEditTeamDialogOpen(false); setEditingTeam(null); setEditTeamDateStr(null);
  };
  const copyEquipe = (dateStr, equipeId) => {
    const d = new Date(dateStr + 'T00:00:00'); let next = new Date(d);
    do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
    const nextStr = format(next, "yyyy-MM-dd");
    const ne = { ...equipes }; const equipe = ne[dateStr]?.find(e => e.id === equipeId); if (!equipe) return;
    const copy = { id: `eq${Date.now()}`, nom: equipe.nom, techniciens: [...equipe.techniciens], vehicules: [...equipe.vehicules], equipements: [...equipe.equipements], mandats: [] };
    if (!ne[nextStr]) ne[nextStr] = [];
    ne[nextStr].push(copy); setEquipes(ne); setEquipeActiveTabs({ ...equipeActiveTabs, [copy.id]: null });
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
  const handleCardClick = (card) => handleEdit(card.dossier, card.mandatIndex);

  const handleEditTerrain = (card) => {
    setEditingTerrainCard(card);
    let def = card.terrain?.date_limite_leve || "";
    if (!def) { const m = card.mandat; let base = null; if (m.date_livraison) base = new Date(m.date_livraison + 'T00:00:00'); else if (m.date_signature) base = new Date(m.date_signature + 'T00:00:00'); else if (m.date_debut_travaux) base = new Date(m.date_debut_travaux + 'T00:00:00'); if (base) { base.setDate(base.getDate() - 14); def = format(base, "yyyy-MM-dd"); } }
    setTerrainForm({ date_limite_leve: def, instruments_requis: card.terrain?.instruments_requis || "", a_rendez_vous: card.terrain?.a_rendez_vous || false, date_rendez_vous: card.terrain?.date_rendez_vous || "", heure_rendez_vous: card.terrain?.heure_rendez_vous || "", donneur: card.terrain?.donneur || "", technicien: card.terrain?.technicien || "", dossier_simultane: card.terrain?.dossier_simultane || "", temps_prevu: card.terrain?.temps_prevu || "", notes: card.terrain?.notes || "" });
    setIsTerrainDialogOpen(true);
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

  const openGoogleMapsForDay = async (dateStr) => {
    setSelectedMapDate(dateStr); setSelectedEquipe(null); setShowMapDialog(true);
    const bureauAddress = "11 rue melancon est, Alma";
    const dayEquipes = equipes[dateStr] || [];
    if (!dayEquipes.length) { setMapRoutes([]); return; }
    const routes = [];
    dayEquipes.forEach((equipe, index) => {
      const cardIds = equipe.mandats || []; const waypoints = []; const dossiersInfo = [];
      cardIds.forEach(cId => {
        const card = terrainCards.find(c => c.id === cId);
        if (card?.mandat?.adresse_travaux) { const address = formatAdresse(card.mandat.adresse_travaux); if (address) { waypoints.push(address); dossiersInfo.push({ numero: `${getArpenteurInitials(card.dossier.arpenteur_geometre)}${card.dossier.numero_dossier}`, clients: getClientsNames(card.dossier.clients_ids), mandat: getAbbreviatedMandatType(card.mandat.type_mandat), mandatType: card.mandat.type_mandat, adresse: address, arpenteur: card.dossier.arpenteur_geometre }); } }
      });
      if (waypoints.length > 0) routes.push({ origin: bureauAddress, destination: bureauAddress, waypoints, color: COLORS[index % COLORS.length], label: generateTeamDisplayName(equipe), dossiers: dossiersInfo });
    });
    setMapRoutes(routes); setSelectedRoutes(routes.map((_, i) => i));
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    const sourceId = source.droppableId; const destId = destination.droppableId;
    const isUsed = (dateStr, rId, rType, excl) => equipes[dateStr]?.some(eq => eq.id !== excl && eq[rType].includes(rId)) || false;
    const destParsed = parseEquipeDroppableId(destId);
    if (destParsed) {
      const card = terrainCards.find(c => c.id === draggableId);
      if (card?.terrain?.a_rendez_vous && card?.terrain?.date_rendez_vous) {
        const srcP = parseEquipeDroppableId(sourceId);
        if (card.terrain.date_rendez_vous !== destParsed.dateStr && (sourceId === "unassigned" || (srcP && srcP.dateStr !== destParsed.dateStr))) {
          setRendezVousWarning({ card, currentDateStr: srcP?.dateStr || "non cédulé", newDateStr: destParsed.dateStr });
          setPendingDragDrop({ source, destination, draggableId, type }); return;
        }
      }
    }
    if (destId === "unassigned") {
      const ne = { ...equipes }; Object.keys(ne).forEach(d => ne[d].forEach(eq => { eq.mandats = eq.mandats.filter(id => id !== draggableId); })); setEquipes(ne);
      const card = terrainCards.find(c => c.id === draggableId);
      if (card && onUpdateDossier) { const um = card.dossier.mandats.map((m, idx) => { if (idx === card.mandatIndex) { let tl = [...(m.terrains_list || [])]; if (tl[card.terrainIndex]) tl[card.terrainIndex] = { ...tl[card.terrainIndex], date_cedulee: null, equipe_assignee: null }; return { ...m, date_terrain: null, equipe_assignee: null, terrains_list: tl }; } return m; }); onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: um }); }
      return;
    }
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
    const dest = parseEquipeDroppableId(destId); if (!dest) return;
    const srcP = parseEquipeDroppableId(sourceId);
    if (srcP && srcP.dateStr !== dest.dateStr) {
      const card = terrainCards.find(c => c.id === draggableId);
      if (card?.terrain?.a_rendez_vous && card?.terrain?.date_rendez_vous && card.terrain.date_rendez_vous !== dest.dateStr) {
        setRendezVousWarning({ card, currentDateStr: srcP.dateStr, newDateStr: dest.dateStr }); setPendingDragDrop({ source, destination, draggableId, type }); return;
      }
    }
    const ne = { ...equipes }; if (!ne[dest.dateStr]) return;
    const equipe = ne[dest.dateStr].find(e => e.id === dest.equipeId); if (!equipe) return;
    const sm = parseEquipeDroppableId(sourceId);
    if (sm && sourceId !== "unassigned") { const se = ne[sm.dateStr]?.find(e => e.id === sm.equipeId); if (se) se.mandats = se.mandats.filter(id => id !== draggableId); }
    if (!equipe.mandats.includes(draggableId)) equipe.mandats.splice(destination.index, 0, draggableId);
    setEquipes(ne);
    const card = terrainCards.find(c => c.id === draggableId);
    if (card && onUpdateDossier) {
      const eqNom = generateTeamDisplayName(equipe);
      const um = card.dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) {
          let tl = [...(m.terrains_list || [])];
          if (!tl[card.terrainIndex]) tl[card.terrainIndex] = { ...(card.terrain || {}) };
          tl[card.terrainIndex] = { ...tl[card.terrainIndex], date_cedulee: dest.dateStr, equipe_assignee: eqNom };
          return { ...m, date_terrain: dest.dateStr, equipe_assignee: eqNom, terrains_list: tl };
        }
        return m;
      });
      onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: um });
    }
  };

  const DossierCard = ({ card }) => {
    const { dossier, mandat, terrain } = card;
    const assignedUser = mandat?.utilisateur_assigne ? users?.find(u => u.email === mandat.utilisateur_assigne) : null;
    const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
    return (
      <div onClick={(e) => { e.stopPropagation(); handleCardClick(card); }} className={`${arpColor.split(' ')[0]} rounded-lg p-2 mb-2 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-none`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex gap-2">
            <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
            <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0`}>{getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}</Badge>
          </div>
          <div className="flex gap-1">
            <Button size="sm" onClick={(e) => { e.stopPropagation(); setSharePointItem(card); setIsSharePointDialogOpen(true); }} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 h-6 w-6 p-0 flex-shrink-0"><Folder className="w-3 h-3" /></Button>
            <Button size="sm" onClick={(e) => { e.stopPropagation(); handleEditTerrain(card); }} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 h-6 w-6 p-0 flex-shrink-0"><Edit className="w-3 h-3" /></Button>
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
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
          <div>{terrain.temps_prevu && <div className="flex items-center gap-1"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>}</div>
          {assignedUser ? <div className="flex items-center gap-1"><Avatar className="w-6 h-6 border-2 border-emerald-500/50"><AvatarImage src={assignedUser.photo_url} /><AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback></Avatar></div> : <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30"><User className="w-3 h-3 text-emerald-500" /></div>}
        </div>
      </div>
    );
  };

  const renderEquipeContent = (equipe, dateStr) => {
    const activeTab = getEquipeActiveTab(equipe.id);
    const equipeNom = generateTeamDisplayName(equipe);
    return (
      <div key={equipe.id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-blue-600/40 px-2 py-2 border-b-2 border-blue-500/50">
          <div className="flex items-start justify-between gap-2">
            <div><span className="text-white text-sm font-bold cursor-pointer hover:text-emerald-400 block" onClick={() => handleEditTeam(dateStr, equipe)}>{equipeNom}</span><span className="text-emerald-300 text-xs">{calculateEquipeTimings(equipe).totalTime}h</span></div>
            <div className="flex gap-1">
              <button onClick={() => copyEquipe(dateStr, equipe.id)} className="text-cyan-400 hover:text-cyan-300"><Copy className="w-3 h-3" /></button>
              <button onClick={() => removeEquipe(dateStr, equipe.id)} className="text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
            </div>
          </div>
        </div>
        <div className="p-2">
          {globalViewMode === "techniciens" && <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-techniciens`} type="TECHNICIEN">{(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[24px] p-0.5 rounded flex flex-wrap gap-0.5 ${s.isDraggingOver ? 'bg-blue-500/20' : 'border border-slate-700'}`}>{equipe.techniciens.map(id => { const t = techniciens.find(t => t.id === id); return t ? <span key={id} className="bg-blue-500/20 border border-blue-500/30 rounded px-1 text-xs text-white flex items-center gap-1"><Users className="w-3 h-3 text-blue-400" />{t.prenom} {t.nom}</span> : null; })}{p.placeholder}</div>}</Droppable>}
          {globalViewMode === "vehicules" && <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-vehicules`} type="VEHICULE">{(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[24px] p-0.5 rounded flex flex-wrap gap-0.5 ${s.isDraggingOver ? 'bg-purple-500/20' : 'border border-slate-700'}`}>{equipe.vehicules.map(id => { const v = vehicules.find(v => v.id === id); return v ? <span key={id} className="bg-purple-500/20 border border-purple-500/30 rounded px-1 text-xs text-white flex items-center gap-1"><Truck className="w-3 h-3 text-purple-400" />{v.nom}</span> : null; })}{p.placeholder}</div>}</Droppable>}
          {globalViewMode === "equipements" && <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-equipements`} type="EQUIPEMENT">{(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[24px] p-0.5 rounded flex flex-wrap gap-0.5 ${s.isDraggingOver ? 'bg-orange-500/20' : 'border border-slate-700'}`}>{equipe.equipements.map(id => { const e = equipements.find(e => e.id === id); return e ? <span key={id} className="bg-orange-500/20 border border-orange-500/30 rounded px-1 text-xs text-white flex items-center gap-1"><Wrench className="w-3 h-3 text-orange-400" />{e.nom}</span> : null; })}{p.placeholder}</div>}</Droppable>}
          <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-mandats`}>
            {(p, s) => <div ref={p.innerRef} {...p.droppableProps} className={`min-h-[50px] -mx-2 ${s.isDraggingOver ? 'bg-cyan-500/10' : ''}`}>
              {equipe.mandats.map((cId, i) => { const card = terrainCards.find(c => c.id === cId); if (!card) return null; return <Draggable key={cId} draggableId={cId} index={i}>{(p, s) => <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className={s.isDragging ? 'opacity-50' : ''}><DossierCard card={card} /></div>}</Draggable>; })}
              {p.placeholder}
            </div>}
          </Droppable>
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
    return (
      <Card key={dateStr} className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-emerald-500' : ''} ${holiday ? 'bg-red-900/20 border-red-500/30' : ''} w-full`}>
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
        <div className="space-y-2">{dayEquipes.map(eq => renderEquipeContent(eq, dateStr))}</div>
        <Button size="sm" onClick={() => addEquipe(dateStr)} className={`w-full border-2 border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300 mt-2 ${isMonthView ? 'h-5 text-xs' : 'h-6'}`}><Plus className="w-3 h-3 mr-1" />{isMonthView ? 'Ajouter' : 'Ajouter équipe'}</Button>
      </Card>
    );
  };

  const executePendingDrop = () => {
    if (!pendingDragDrop) return;
    const { source, destination, draggableId } = pendingDragDrop;
    const dest = parseEquipeDroppableId(destination.droppableId);
    if (!dest) return;
    const ne = { ...equipes }; if (!ne[dest.dateStr]) return;
    const equipe = ne[dest.dateStr].find(e => e.id === dest.equipeId); if (!equipe) return;
    const sm = parseEquipeDroppableId(source.droppableId);
    if (sm && source.droppableId !== "unassigned") { const se = ne[sm.dateStr]?.find(e => e.id === sm.equipeId); if (se) se.mandats = se.mandats.filter(id => id !== draggableId); }
    if (!equipe.mandats.includes(draggableId)) equipe.mandats.splice(destination.index, 0, draggableId);
    setEquipes(ne);
    const card = terrainCards.find(c => c.id === draggableId);
    if (card && onUpdateDossier) {
      const eqNom = generateTeamDisplayName(equipe);
      const um = card.dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) { let tl = [...(m.terrains_list || [])]; if (!tl[card.terrainIndex]) tl[card.terrainIndex] = { ...(card.terrain || {}) }; tl[card.terrainIndex] = { ...tl[card.terrainIndex], date_cedulee: dest.dateStr, equipe_assignee: eqNom }; return { ...m, date_terrain: dest.dateStr, equipe_assignee: eqNom, terrains_list: tl }; }
        return m;
      });
      onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: um });
    }
    setRendezVousWarning(null); setPendingDragDrop(null);
  };

  return (
    <div className="space-y-4">
      <style>{`* { border: none !important; outline: none !important; } [class*="border"],[class*="shadow"],[class*="outline"] { border: none !important; box-shadow: none !important; outline: none !important; }`}</style>

      <Card className="bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm shadow-xl mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="text-white font-bold text-lg">{viewMode === "week" ? `Semaine du ${format(days[0], "d MMMM", { locale: fr })} au ${format(days[days.length - 1], "d MMMM yyyy", { locale: fr })}` : format(currentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: fr }).slice(1)}</div>
              <div className="flex gap-2 items-center">
                <Button size="sm" variant="outline" onClick={goToPrevious} className="bg-slate-800 border-slate-700 text-white">← Précédent</Button>
                <Button size="sm" onClick={goToToday} className="bg-emerald-500/20 text-emerald-400">Aujourd'hui</Button>
                <Button size="sm" variant="outline" onClick={goToNext} className="bg-slate-800 border-slate-700 text-white">Suivant →</Button>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => setViewMode("week")} className={viewMode === "week" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-white"}>Semaine</Button>
                  <Button size="sm" onClick={() => setViewMode("month")} className={viewMode === "month" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-white"}>Mois</Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-white text-sm">Afficher :</span>
              <Button size="sm" onClick={() => setGlobalViewMode(globalViewMode === "techniciens" ? null : "techniciens")} className={globalViewMode === "techniciens" ? "bg-blue-500/30 text-blue-400 border border-blue-500" : "bg-slate-800 text-white"}><Users className="w-3 h-3 mr-1" />Techniciens</Button>
              <Button size="sm" onClick={() => setGlobalViewMode(globalViewMode === "vehicules" ? null : "vehicules")} className={globalViewMode === "vehicules" ? "bg-purple-500/30 text-purple-400 border border-purple-500" : "bg-slate-800 text-white"}><Truck className="w-3 h-3 mr-1" />Véhicules</Button>
              <Button size="sm" onClick={() => setGlobalViewMode(globalViewMode === "equipements" ? null : "equipements")} className={globalViewMode === "equipements" ? "bg-orange-500/30 text-orange-400 border border-orange-500" : "bg-slate-800 text-white"}><Wrench className="w-3 h-3 mr-1" />Équipements</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4">
          <Card className="bg-slate-900/50 border-slate-800 p-4 flex flex-col overflow-hidden w-[240px] flex-shrink-0 sticky top-[84px] self-start" style={{ maxHeight: 'calc(100vh - 88px)' }}>
            <Tabs defaultValue="verification" className="w-full">
              <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-2 mb-3">
                <TabsTrigger value="verification" className="data-[state=active]:bg-slate-700">En vérification</TabsTrigger>
                <TabsTrigger value="planifier" className="data-[state=active]:bg-slate-700">À planifier</TabsTrigger>
              </TabsList>
              <TabsContent value="verification" className="mt-0">
                <h3 className="text-white font-semibold mb-3 text-sm">En vérification ({unassignedCards.filter(c => !c.mandat?.statut_terrain || c.mandat?.statut_terrain === "en_verification" || (c.terrain?.statut_terrain !== "a_ceduler" && c.terrain?.statut_terrain !== "pas_de_terrain")).length})</h3>
                <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {unassignedCards.filter(c => !c.terrain?.statut_terrain || c.terrain?.statut_terrain === "en_verification").map(card => (
                    <div key={card.id} className="mb-2">
                      <DossierCard card={card} />
                      <TerrainVerificationCard card={card} onUpdateDossier={onUpdateDossier} />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="planifier" className="mt-0">
                <h3 className="text-white font-semibold mb-3 text-sm">À planifier ({unassignedCards.filter(c => c.terrain?.statut_terrain === "a_ceduler").length})</h3>
                <Droppable droppableId="unassigned">
                  {(p) => <div ref={p.innerRef} {...p.droppableProps} className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {unassignedCards.filter(c => c.terrain?.statut_terrain === "a_ceduler").map((card, i) => (
                      <Draggable key={card.id} draggableId={card.id} index={i}>
                        {(p, s) => <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps} className={s.isDragging ? 'opacity-50' : ''}><div className="mb-2"><DossierCard card={card} /></div></div>}
                      </Draggable>
                    ))}
                    {p.placeholder}
                  </div>}
                </Droppable>
              </TabsContent>
            </Tabs>
          </Card>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-5 w-full" style={{ gap: '2px' }}>
              {days.map(day => renderDay(day, viewMode === "month"))}
            </div>
          </div>
        </div>
      </DragDropContext>

      <EditDossierDialog isOpen={isEditingDialogOpen} onClose={() => { setIsEditingDialogOpen(false); setEditingDossier(null); }} dossier={editingDossier} onSuccess={() => {}} clients={clients} users={users} />

      <CreateTeamDialog isOpen={isCreateTeamDialogOpen} onClose={() => setIsCreateTeamDialogOpen(false)} onCreateTeam={handleCreateTeam} dateStr={createTeamDateStr} techniciens={techniciens} vehicules={vehicules} equipements={equipements} equipes={equipes} usedResources={createTeamDateStr ? getUsedResourcesForDate(createTeamDateStr) : { techniciens: [], vehicules: [], equipements: [] }} placeAffaire={placeAffaire} />

      <EditTeamDialog isOpen={isEditTeamDialogOpen} onClose={() => { setIsEditTeamDialogOpen(false); setEditingTeam(null); setEditTeamDateStr(null); }} onUpdateTeam={handleUpdateTeam} dateStr={editTeamDateStr} equipe={editingTeam} techniciens={techniciens} vehicules={vehicules} equipements={equipements} equipes={equipes} placeAffaire={placeAffaire} />

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

      <Dialog open={!!rendezVousWarning} onOpenChange={() => setRendezVousWarning(null)}>
        <DialogContent className="border-none text-white max-w-md" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 text-center">⚠️ Attention ⚠️</DialogTitle></DialogHeader>
          {rendezVousWarning && <div className="space-y-4">
            <p className="text-slate-300 text-center">Ce terrain a un rendez-vous le <span className="text-emerald-400 font-semibold">{format(new Date(rendezVousWarning.card.terrain.date_rendez_vous + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}</span>.</p>
            <p className="text-slate-300 text-center">Voulez-vous le déplacer vers le <span className="text-emerald-400 font-semibold">{format(new Date(rendezVousWarning.newDateStr + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}</span> ?</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button onClick={() => { setRendezVousWarning(null); setPendingDragDrop(null); }} className="border border-red-500 text-red-400 bg-transparent">Annuler</Button>
              <Button onClick={executePendingDrop} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer</Button>
            </div>
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={isSharePointDialogOpen} onOpenChange={setIsSharePointDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[80vh]">
          <DialogHeader><DialogTitle className="text-xl">Documents Terrain</DialogTitle></DialogHeader>
          {sharePointItem && <SharePointTerrainViewer arpenteurGeometre={sharePointItem.dossier.arpenteur_geometre} numeroDossier={sharePointItem.dossier.numero_dossier} />}
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

      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0">
          <DialogHeader className="p-4 border-b border-slate-800">
            <DialogTitle className="text-xl font-bold text-white">Tous les trajets - {selectedMapDate && format(new Date(selectedMapDate + 'T00:00:00'), "EEEE d MMMM yyyy", { locale: fr })}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full">
            {!googleMapsApiKey ? <div className="flex items-center justify-center h-full text-slate-400">Chargement...</div>
              : mapRoutes.length === 0 ? <div className="flex items-center justify-center h-full text-slate-400">Aucun trajet</div>
              : <div style={{ height: 'calc(90vh - 80px)', width: '100%' }}><MultiRouteMap routes={mapRoutes.filter((_, i) => selectedRoutes.includes(i))} apiKey={googleMapsApiKey} /></div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}