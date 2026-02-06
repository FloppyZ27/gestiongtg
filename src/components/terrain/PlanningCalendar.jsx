import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Users, Truck, Wrench, FolderOpen, Plus, Edit, Trash2, X, MapPin, Calendar, User, Clock, UserCheck, Link2, Timer, AlertCircle, Copy, Printer } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";

// Congés fériés canadiens et québécois
const getHolidays = (year) => {
  // Calcul de Pâques (algorithme de Meeus)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(year, month - 1, day);
  
  // Vendredi saint (2 jours avant Pâques)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  
  // Lundi de Pâques (1 jour après Pâques)
  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  
  // Fête du Travail: 1er lundi de septembre
  const labourDay = new Date(year, 8, 1); // Sept = mois 8
  while (labourDay.getDay() !== 1) labourDay.setDate(labourDay.getDate() + 1);
  
  // Action de grâces: 2e lundi d'octobre
  const thanksgiving = new Date(year, 9, 1); // Oct = mois 9
  let mondayCount = 0;
  while (mondayCount < 2) {
    if (thanksgiving.getDay() === 1) mondayCount++;
    if (mondayCount < 2) thanksgiving.setDate(thanksgiving.getDate() + 1);
  }
  
  return [
    { date: `${year}-01-01`, name: "Jour de l'An" },
    { date: `${year}-01-02`, name: "Lendemain du Jour de l'An (QC)" },
    { date: format(goodFriday, "yyyy-MM-dd"), name: "Vendredi saint" },
    { date: format(easterMonday, "yyyy-MM-dd"), name: "Lundi de Pâques" },
    { date: format(new Date(year, 4, 1 + (1 - new Date(year, 4, 1).getDay() + 7) % 7 + 14), "yyyy-MM-dd"), name: "Fête de la Reine" },
    { date: `${year}-06-24`, name: "Fête nationale du Québec" },
    { date: `${year}-07-01`, name: "Fête du Canada" },
    { date: format(labourDay, "yyyy-MM-dd"), name: "Fête du Travail" },
    { date: format(thanksgiving, "yyyy-MM-dd"), name: "Action de grâces" },
    { date: `${year}-12-25`, name: "Noël" },
    { date: `${year}-12-26`, name: "Lendemain de Noël" },
  ];
};

const isHoliday = (date) => {
  const year = date.getFullYear();
  const holidays = getHolidays(year);
  const dateStr = format(date, "yyyy-MM-dd");
  return holidays.find(h => h.date === dateStr);
};
import EditDossierDialog from "../dossiers/EditDossierDialog";
import CommentairesSection from "../dossiers/CommentairesSection";
import CreateTeamDialog from "./CreateTeamDialog";
import EditTeamDialog from "./EditTeamDialog";

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
  onDeleteEquipement,
  users,
  lots
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week or month
  const [assignments, setAssignments] = useState({});
  const [equipes, setEquipes] = useState({}); // { "date": [{ id, nom, techniciens: [], vehicules: [], equipements: [], mandats: [] }] }
  const [activeResourceTab, setActiveResourceTab] = useState("mandats");
  const [viewingDossier, setViewingDossier] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isEditingDialogOpen, setIsEditingDialogOpen] = useState(false);
  const [equipeActiveTabs, setEquipeActiveTabs] = useState({}); // { "equipeId": "techniciens" | "vehicules" | "equipements" }
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);
  const [createTeamDateStr, setCreateTeamDateStr] = useState(null);
  const [globalViewMode, setGlobalViewMode] = useState(null); // null | "techniciens" | "vehicules" | "equipements"
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamDateStr, setEditTeamDateStr] = useState(null);
  const [isEditTeamDialogOpen, setIsEditTeamDialogOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

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
      // Mode mois: organiser en semaines complètes (lun-ven)
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      // Trouver le premier lundi avant ou au début du mois
      let firstMonday = startOfWeek(start, { weekStartsOn: 1 });
      
      // Trouver le dernier vendredi après ou à la fin du mois
      let lastFriday = new Date(end);
      while (lastFriday.getDay() !== 5) {
        lastFriday = addDays(lastFriday, 1);
      }
      
      // Générer tous les jours ouvrables (lun-ven) entre ces dates
      const days = [];
      let current = firstMonday;
      
      while (current <= lastFriday) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lundi à vendredi
          days.push(new Date(current));
        }
        current = addDays(current, 1);
      }
      
      return days;
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
    setCreateTeamDateStr(dateStr);
    setIsCreateTeamDialogOpen(true);
  };

  const handleCreateTeam = (newEquipe) => {
    const newEquipes = { ...equipes };
    if (!newEquipes[createTeamDateStr]) {
      newEquipes[createTeamDateStr] = [];
    }
    
    newEquipes[createTeamDateStr].push(newEquipe);
    setEquipes(newEquipes);
    setEquipeActiveTabs({ ...equipeActiveTabs, [newEquipe.id]: null });
    setIsCreateTeamDialogOpen(false);
  };

  const handleEditTeam = (dateStr, equipe) => {
    setEditingTeam(equipe);
    setEditTeamDateStr(dateStr);
    setIsEditTeamDialogOpen(true);
  };

  const handleUpdateTeam = (updatedTeam) => {
    const newEquipes = { ...equipes };
    if (newEquipes[editTeamDateStr]) {
      const index = newEquipes[editTeamDateStr].findIndex(eq => eq.id === updatedTeam.id);
      if (index !== -1) {
        newEquipes[editTeamDateStr][index] = updatedTeam;
        setEquipes(newEquipes);
      }
    }
    setIsEditTeamDialogOpen(false);
    setEditingTeam(null);
    setEditTeamDateStr(null);
  };

  // Calculer les ressources utilisées pour une date
  const getUsedResourcesForDate = (dateStr) => {
    const dayEquipes = equipes[dateStr] || [];
    const usedTechIds = new Set();
    const usedVehIds = new Set();
    const usedEqIds = new Set();

    dayEquipes.forEach(eq => {
      eq.techniciens.forEach(id => usedTechIds.add(id));
      eq.vehicules.forEach(id => usedVehIds.add(id));
      eq.equipements.forEach(id => usedEqIds.add(id));
    });

    return {
      techniciens: Array.from(usedTechIds),
      vehicules: Array.from(usedVehIds),
      equipements: Array.from(usedEqIds)
    };
  };

  const getEquipeActiveTab = (equipeId) => {
    return equipeActiveTabs[equipeId] !== undefined ? equipeActiveTabs[equipeId] : null;
  };

  const setEquipeActiveTab = (equipeId, tab) => {
    const currentTab = getEquipeActiveTab(equipeId);
    setEquipeActiveTabs({ ...equipeActiveTabs, [equipeId]: currentTab === tab ? null : tab });
  };

  const copyEquipe = (dateStr, equipeId) => {
    const currentDate = new Date(dateStr + 'T00:00:00');
    let nextDate = new Date(currentDate);
    
    // Trouver la prochaine journée ouvrable
    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (nextDate.getDay() === 0 || nextDate.getDay() === 6); // Ignorer weekend
    
    const nextDateStr = format(nextDate, "yyyy-MM-dd");
    
    const newEquipes = { ...equipes };
    const equipe = newEquipes[dateStr]?.find(e => e.id === equipeId);
    
    if (!equipe) return;
    
    // Créer une copie de l'équipe sans les mandats
    const copiedEquipe = {
      id: `eq${Date.now()}`,
      nom: equipe.nom,
      techniciens: [...equipe.techniciens],
      vehicules: [...equipe.vehicules],
      equipements: [...equipe.equipements],
      mandats: []
    };
    
    // Initialiser le tableau si la date n'existe pas
    if (!newEquipes[nextDateStr]) {
      newEquipes[nextDateStr] = [];
    }
    
    newEquipes[nextDateStr].push(copiedEquipe);
    setEquipes(newEquipes);
    setEquipeActiveTabs({ ...equipeActiveTabs, [copiedEquipe.id]: null });
  };

  const removeEquipe = (dateStr, equipeId) => {
    const newEquipes = { ...equipes };
    if (newEquipes[dateStr]) {
      const equipe = newEquipes[dateStr].find(e => e.id === equipeId);
      if (equipe && equipe.mandats && equipe.mandats.length > 0) {
        if (!confirm(`Cette équipe contient ${equipe.mandats.length} mandat(s). Voulez-vous vraiment la supprimer ? Les mandats seront replacés dans "À planifier".`)) {
          return;
        }
      }
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

    // Drag & drop vers "À planifier" - réinitialiser les données de terrain
    if (destId === "unassigned") {
      // Retirer des équipes et réinitialiser la date terrain et équipe
      const newEquipes = { ...equipes };
      Object.keys(newEquipes).forEach(dateStr => {
        newEquipes[dateStr].forEach(equipe => {
          equipe.mandats = equipe.mandats.filter(id => id !== draggableId);
        });
      });
      setEquipes(newEquipes);

      // Réinitialiser date_terrain et equipe_assignee
      const card = terrainCards.find(c => c.id === draggableId);
      if (card && onUpdateDossier) {
        const updatedMandats = card.dossier.mandats.map((m, idx) => {
          if (idx === card.mandatIndex) {
            // Vider les données de terrain aussi
            let updatedTerrainsList = [...(m.terrains_list || [])];
            if (updatedTerrainsList[card.terrainIndex]) {
              updatedTerrainsList[card.terrainIndex] = {
                ...updatedTerrainsList[card.terrainIndex],
                date_cedulee: null,
                equipe_assignee: null
              };
            }
            return { ...m, date_terrain: null, equipe_assignee: null, terrains_list: updatedTerrainsList };
          }
          return m;
        });
        onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
      }
      return;
    }

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
        // Retirer des équipes et réinitialiser la date terrain et équipe
        const newEquipes = { ...equipes };
        Object.keys(newEquipes).forEach(dateStr => {
          newEquipes[dateStr].forEach(equipe => {
            equipe.mandats = equipe.mandats.filter(id => id !== draggableId);
          });
        });
        setEquipes(newEquipes);

        // Réinitialiser date_terrain et equipe_assignee
        const card = terrainCards.find(c => c.id === draggableId);
        if (card && onUpdateDossier) {
          const updatedMandats = card.dossier.mandats.map((m, idx) => {
            if (idx === card.mandatIndex) {
              return { ...m, date_terrain: null, equipe_assignee: null };
            }
            return m;
          });
          onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
        }
      }
      return;
    }

    // Vérifier si le terrain a un rendez-vous et si on le déplace vers une autre date
    const sourceParsed = parseEquipeDroppableId(sourceId);
    if (sourceParsed && sourceParsed.dateStr !== dest.dateStr) {
      const card = terrainCards.find(c => c.id === draggableId);
      if (card?.terrain?.a_rendez_vous && card?.terrain?.date_rendez_vous) {
        if (!confirm(`Ce terrain a un rendez-vous le ${format(new Date(card.terrain.date_rendez_vous + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })}. Voulez-vous vraiment le déplacer vers le ${format(new Date(dest.dateStr + 'T00:00:00'), "dd MMMM yyyy", { locale: fr })} ?`)) {
          return;
        }
      }
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
    } else if (sourceId === "unassigned") {
      // Si provient de unassigned, on ne fait rien - pas à retirer
    }

    // Ajouter à la destination à l'index spécifié
    if (!equipe.mandats.includes(draggableId)) {
      equipe.mandats.splice(destination.index, 0, draggableId);
    }

    setEquipes(newEquipes);

    // Mettre à jour la date_terrain et equipe_assignee du mandat et du terrain spécifique
    const card = terrainCards.find(c => c.id === draggableId);
    if (card && onUpdateDossier) {
      const equipeNom = generateTeamDisplayName(equipe);

      const updatedMandats = card.dossier.mandats.map((m, idx) => {
        if (idx === card.mandatIndex) {
          // S'assurer que terrains_list existe et contient le terrain
          let updatedTerrainsList = [...(m.terrains_list || [])];
          
          // Si terrains_list est vide ou le terrain n'existe pas, le créer
          if (updatedTerrainsList.length === 0 || !updatedTerrainsList[card.terrainIndex]) {
            // Créer un nouveau terrain avec les données existantes ou un objet vide
            updatedTerrainsList[card.terrainIndex] = { ...(card.terrain || {}) };
          }
          
          // Mettre à jour le terrain spécifique
          updatedTerrainsList[card.terrainIndex] = {
            ...updatedTerrainsList[card.terrainIndex],
            date_cedulee: dest.dateStr,
            equipe_assignee: equipeNom
          };
          
          return { 
            ...m, 
            date_terrain: dest.dateStr, 
            equipe_assignee: equipeNom, 
            terrains_list: updatedTerrainsList 
          };
        }
        return m;
      });
      
      onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
    }
  };

  // Générer une liste de cartes uniques par terrain
  const generateTerrainCards = () => {
    const cards = [];
    
    dossiers.forEach(dossier => {
      const mandatsCedule = dossier.mandats?.filter(m => m.tache_actuelle === "Cédule") || [];
      
      mandatsCedule.forEach((mandat, mandatIndex) => {
        // Si le mandat a terrains_list, créer une carte par terrain
        if (mandat.terrains_list && mandat.terrains_list.length > 0) {
          mandat.terrains_list.forEach((terrain, terrainIndex) => {
            cards.push({
              id: `${dossier.id}-${mandatIndex}-${terrainIndex}`,
              dossierId: dossier.id,
              dossier: dossier,
              mandat: mandat,
              terrain: terrain,
              mandatIndex: mandatIndex,
              terrainIndex: terrainIndex
            });
          });
        }
        // Ne plus utiliser mandat.terrain pour la rétrocompatibilité - seulement terrains_list
      });
    });
    
    return cards;
  };

  const terrainCards = generateTerrainCards();

  // Nettoyer les cartes supprimées et synchroniser les mandats avec date/équipe
  useEffect(() => {
    const validCardIds = new Set(terrainCards.map(c => c.id));
    let needsUpdate = false;
    
    const updatedEquipes = { ...equipes };
    
    // 1. Nettoyer les cartes supprimées
    Object.keys(updatedEquipes).forEach(dateStr => {
      updatedEquipes[dateStr].forEach(equipe => {
        const originalLength = equipe.mandats.length;
        equipe.mandats = equipe.mandats.filter(cardId => validCardIds.has(cardId));
        if (equipe.mandats.length !== originalLength) {
          needsUpdate = true;
        }
      });
    });
    
    // 2. Synchroniser les mandats qui ont date_terrain et equipe_assignee
    terrainCards.forEach(card => {
      if (card.mandat?.date_terrain && card.mandat?.equipe_assignee) {
        const dateStr = card.mandat.date_terrain;
        const equipeNom = card.mandat.equipe_assignee;
        
        // Vérifier si la carte est déjà dans une équipe
        const isAlreadyAssigned = Object.values(updatedEquipes).some(dayEquipes =>
          dayEquipes.some(eq => eq.mandats.includes(card.id))
        );
        
        if (!isAlreadyAssigned) {
          // Créer ou trouver l'équipe pour cette date
          if (!updatedEquipes[dateStr]) {
            updatedEquipes[dateStr] = [];
          }
          
          let equipe = updatedEquipes[dateStr].find(eq => generateTeamDisplayName(eq) === equipeNom);
          
          if (!equipe) {
            // Créer une nouvelle équipe
            equipe = {
              id: `eq${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              nom: equipeNom,
              techniciens: [],
              vehicules: [],
              equipements: [],
              mandats: []
            };
            updatedEquipes[dateStr].push(equipe);
          }
          
          // Ajouter le mandat à l'équipe
          if (!equipe.mandats.includes(card.id)) {
            equipe.mandats.push(card.id);
            needsUpdate = true;
          }
        }
      }
    });
    
    if (needsUpdate) {
      setEquipes(updatedEquipes);
    }
  }, [dossiers]);

  const unassignedCards = terrainCards.filter(card => {
    const isAssignedInEquipe = Object.values(equipes).some(dayEquipes => 
      dayEquipes.some(equipe => equipe.mandats.includes(card.id))
    );
    // Exclure aussi les cartes qui ont déjà une date_terrain et equipe_assignee
    const hasScheduledData = card.mandat?.date_terrain && card.mandat?.equipe_assignee;
    return !isAssignedInEquipe && !hasScheduledData;
  });

  const getClientById = (id) => clients.find(c => c.id === id);
  const getLotById = (id) => lots?.find(l => l.id === id);
  const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const generateTeamDisplayName = (equipe) => {
    if (equipe.techniciens.length === 0) {
      return equipe.nom;
    }
    const initials = equipe.techniciens.map(techId => {
      const tech = techniciens.find(t => t.id === techId);
      return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
    }).filter(n => n).join('-');
    
    // Extraire le numéro d'équipe du nom
    const match = equipe.nom.match(/Équipe (\d+)/);
    const teamNumber = match ? match[1] : '';
    return teamNumber ? `Équipe ${teamNumber} - ${initials}` : equipe.nom;
  };

  const parseTimeString = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const calculateTravelTime = (address1, address2) => {
    // Estimation simple: 30 minutes entre chaque site
    // TODO: Intégrer avec Google Maps API pour un calcul précis
    if (!address1 || !address2) return 0;
    return 0.5; // 30 minutes en heures
  };

  const calculateEquipeTimings = (equipe, dateStr) => {
    let totalTime = 0;
    let travelTime = 0;
    const cardIds = equipe.mandats || [];
    
    // Calculer le temps des mandats
    cardIds.forEach((cardId) => {
      const card = terrainCards.find(c => c.id === cardId);
      if (card && card.terrain?.temps_prevu) {
        totalTime += parseTimeString(card.terrain.temps_prevu);
      }
    });
    
    // Calculer le temps de trajet entre les sites
    if (cardIds.length > 1) {
      for (let i = 0; i < cardIds.length - 1; i++) {
        const currentCard = terrainCards.find(c => c.id === cardIds[i]);
        const nextCard = terrainCards.find(c => c.id === cardIds[i + 1]);
        
        if (currentCard?.mandat?.adresse_travaux && nextCard?.mandat?.adresse_travaux) {
          travelTime += calculateTravelTime(
            currentCard.mandat.adresse_travaux,
            nextCard.mandat.adresse_travaux
          );
        }
      }
    }
    
    return {
      totalTime: (totalTime + travelTime).toFixed(1),
      workTime: totalTime.toFixed(1),
      travelTime: travelTime.toFixed(1),
      cardCount: cardIds.length
    };
  };

  const handleCardClick = (card) => {
    handleEdit(card.dossier, card.mandatIndex);
  };

  const handleEdit = (dossier, mandatIndex = 0) => {
    setIsViewDialogOpen(false);
    setEditingDossier({ ...dossier, initialMandatIndex: mandatIndex });
    setIsEditingDialogOpen(true);
  };

  const DossierCard = ({ card, placedDate }) => {
    const { dossier, mandat, terrain } = card;
    const assignedUser = users?.find(u => u.email === mandat?.utilisateur_assigne);
    
    // Couleur basée sur l'arpenteur
    const arpenteurColor = getArpenteurColor(dossier.arpenteur_geometre);
    const bgColorClass = arpenteurColor.split(' ')[0];
    
    return (
      <div 
        onClick={(e) => {
          e.stopPropagation();
          handleCardClick(card);
        }}
        className={`${bgColorClass} rounded-lg p-2 mb-2 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer`}
      >
        {/* Entête : N° Dossier et Type de mandat */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs flex-shrink-0`}>
            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
          </Badge>
          <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
            {getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}
          </Badge>
        </div>

        {/* Clients */}
        <div className="flex items-center gap-1 mb-1">
          <User className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-xs text-white font-medium">{getClientsNames(dossier.clients_ids)}</span>
        </div>

        {/* Adresse complète */}
        {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
          <div className="flex items-start gap-1 mb-1">
            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span>
          </div>
        )}

        {/* Date de livraison */}
        {mandat?.date_livraison && (
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
          </div>
        )}

        {/* Date limite levé */}
        {terrain.date_limite_leve && (
          <div className="flex items-center gap-1 mb-1">
            <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
          </div>
        )}

        {/* Rendez-vous */}
        {terrain.a_rendez_vous && terrain.date_rendez_vous && (
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <span className="text-xs text-orange-300">
              RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}
              {terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}
            </span>
          </div>
        )}

        {/* Instruments requis */}
        {terrain.instruments_requis && (
          <div className="flex items-center gap-1 mb-1">
            <Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span>
          </div>
        )}

        {/* Technicien à prioriser */}
        {terrain.technicien && (
          <div className="flex items-center gap-1 mb-1">
            <UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
            <span className="text-xs text-blue-300 truncate">{terrain.technicien}</span>
          </div>
        )}

        {/* Dossier simultané */}
        {terrain.dossier_simultane && (
          <div className="flex items-center gap-1 mb-1">
            <Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span>
          </div>
        )}

        {/* Temps prévu + Utilisateur assigné */}
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30">
          <div className="flex items-center gap-2">
            {terrain.temps_prevu && (
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-300">{terrain.temps_prevu}</span>
              </div>
            )}
          </div>

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
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #planning-print, #planning-print * {
            visibility: visible;
          }
          #planning-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-only {
            display: none;
          }
          @media print {
            .print-only {
              display: block !important;
            }
          }
        }
        
        /* Supprimer les bordures */
        * {
          border: none !important;
          outline: none !important;
        }
        [class*="border"],
        [class*="shadow"],
        [class*="outline"] {
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
      `}</style>
      

      
      {/* Header avec contrôles */}
      <Card className="bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 border-slate-700 backdrop-blur-sm shadow-xl mb-4 no-print">
         <CardContent className="p-4">
           <div className="flex flex-col gap-4">
             {/* Première ligne : titre et contrôles de navigation */}
             <div className="flex justify-between items-center">
            <div className="text-white font-bold text-lg">
              {viewMode === "week" 
                ? `Semaine du ${format(days[0], "d MMMM", { locale: fr })} au ${format(days[days.length - 1], "d MMMM yyyy", { locale: fr })}`
                : format(currentDate, "MMMM yyyy", { locale: fr }).charAt(0).toUpperCase() + format(currentDate, "MMMM yyyy", { locale: fr }).slice(1)}
            </div>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={goToPrevious}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                ← Précédent
              </Button>
              <Button
                size="sm"
                onClick={goToToday}
                className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
              >
                Aujourd'hui
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={goToNext}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                Suivant →
              </Button>
              <div className="h-6 w-px bg-slate-700 mx-1"></div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className={viewMode === "week" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
                >
                  Semaine
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className={viewMode === "month" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
                >
                  Mois
                </Button>
              </div>
              </div>
              </div>

              {/* Deuxième ligne : boutons de filtrage */}
              <div className="flex gap-2 items-center">
              <span className="text-white text-sm font-medium">Afficher :</span>
              <Button
                size="sm"
                onClick={() => setGlobalViewMode(globalViewMode === "techniciens" ? null : "techniciens")}
                className={globalViewMode === "techniciens" ? "bg-blue-500/30 text-blue-400 border border-blue-500" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
              >
                <Users className="w-3 h-3 mr-1" />
                Techniciens
              </Button>
              <Button
                size="sm"
                onClick={() => setGlobalViewMode(globalViewMode === "vehicules" ? null : "vehicules")}
                className={globalViewMode === "vehicules" ? "bg-purple-500/30 text-purple-400 border border-purple-500" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
              >
                <Truck className="w-3 h-3 mr-1" />
                Véhicules
              </Button>
              <Button
                size="sm"
                onClick={() => setGlobalViewMode(globalViewMode === "equipements" ? null : "equipements")}
                className={globalViewMode === "equipements" ? "bg-orange-500/30 text-orange-400 border border-orange-500" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"}
              >
                <Wrench className="w-3 h-3 mr-1" />
                Équipements
              </Button>
              </div>
              </div>
              </CardContent>
              </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4" id="planning-print">
          {/* Colonne gauche - Ressources avec tabs */}
          <Card className="bg-slate-900/50 border-slate-800 p-4 flex flex-col overflow-hidden w-[240px] flex-shrink-0 sticky top-[84px] self-start no-print" style={{ maxHeight: 'calc(100vh - 88px)' }}>
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
                      En vérification ({unassignedCards.filter(card => {
                        return !card.mandat?.statut_terrain || card.mandat?.statut_terrain === "en_verification";
                      }).length})
                    </h3>
                    <div className="min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                      {unassignedCards
                          .filter(card => {
                            return !card.mandat?.statut_terrain || card.mandat?.statut_terrain === "en_verification";
                          })
                          .map((card) => (
                            <div key={card.id} className="mb-2">
                              <DossierCard card={card} />
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const updatedMandats = card.dossier.mandats.map((m, idx) => {
                                      if (idx === card.mandatIndex) {
                                        return { ...m, statut_terrain: "a_ceduler" };
                                      }
                                      return m;
                                    });
                                    onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
                                  }}
                                  className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs h-7"
                                >
                                  Oui, terrain requis
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const updatedMandats = card.dossier.mandats.map((m, idx) => {
                                      if (idx === card.mandatIndex) {
                                        return { ...m, statut_terrain: "pas_de_terrain" };
                                      }
                                      return m;
                                    });
                                    onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
                                  }}
                                  className="flex-1 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 text-xs h-7"
                                >
                                  Non
                                </Button>
                              </div>
                            </div>
                          ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="planifier" className="mt-0">
                    <h3 className="text-white font-semibold mb-3 text-sm">
                      À planifier ({unassignedCards.filter(card => {
                        return card.mandat?.statut_terrain === "a_ceduler";
                      }).length})
                    </h3>
                    <Droppable droppableId="unassigned">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[400px] max-h-[calc(100vh-300px)] overflow-y-auto pr-2 ${snapshot.isDraggingOver ? 'bg-slate-800/50 rounded-lg' : ''}`}
                        >
                          {unassignedCards
                            .filter(card => {
                              return card.mandat?.statut_terrain === "a_ceduler";
                            })
                            .map((card, index) => (
                              <Draggable key={card.id} draggableId={card.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={snapshot.isDragging ? 'opacity-50' : ''}
                                  >
                                    <DossierCard card={card} />
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
           <div className="flex-1 space-y-4 w-full">
             {viewMode === "week" ? (
               <div className="grid grid-cols-5 w-full" style={{ gap: '2px' }}>
                {days.map((day) => {
                   const dateStr = format(day, "yyyy-MM-dd");
                   const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                   const dayEquipes = equipes[dateStr] || [];

                   const holiday = isHoliday(day);
                   return (
                     <Card 
                       key={dateStr}
                       className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-emerald-500' : ''} ${holiday ? 'bg-red-900/20 border-red-500/30' : ''} w-full`}
                       >
                      <div className="mb-2 w-full">
                        <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-emerald-500' : ''} w-full`}>
                          <div className={`text-sm font-bold ${isToday ? 'text-white' : 'text-white'}`}>
                            {format(day, "EEEE", { locale: fr })}
                          </div>
                          <div className={`text-xs ${isToday ? 'text-emerald-400' : holiday ? 'text-red-400' : 'text-slate-400'}`}>
                            {format(day, "d MMM", { locale: fr })}
                          </div>
                          {holiday && (
                            <div className="text-xs text-red-400 mt-1">
                              {holiday.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 overflow-y-auto w-full">
                        {dayEquipes.map((equipe) => {
                           const activeTab = getEquipeActiveTab(equipe.id);
                           const equipeNom = generateTeamDisplayName(equipe);
                           return (
                             <div key={equipe.id} className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
                               <div className="bg-blue-600/40 px-2 py-2 border-b-2 border-blue-500/50">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span 
                                      className="text-white text-sm font-bold cursor-pointer hover:text-emerald-400 transition-colors block"
                                      onClick={() => handleEditTeam(dateStr, equipe)}
                                    >
                                      {equipeNom}
                                    </span>
                                    <span className="text-emerald-300 text-xs">
                                      {calculateEquipeTimings(equipe, dateStr).totalTime}h
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => copyEquipe(dateStr, equipe.id)}
                                      className="text-cyan-400 hover:text-cyan-300"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => removeEquipe(dateStr, equipe.id)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                    </div>

                                    <div className="p-2">

                                    {/* Techniciens - affichage selon globalViewMode */}
                                    {globalViewMode === "techniciens" && (
                                      <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-techniciens`} type="TECHNICIEN">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[24px] p-0.5 rounded ${snapshot.isDraggingOver ? 'bg-blue-500/20 border-2 border-blue-500' : 'border border-slate-700'}`}
                                          >
                                            <div className="flex items-center gap-0.5 flex-wrap">
                                              {equipe.techniciens.map(techId => {
                                                const tech = techniciens.find(t => t.id === techId);
                                                if (!tech) return null;
                                                return (
                                                  <span key={techId} className="bg-blue-500/20 border border-blue-500/30 rounded px-1 py-0 text-white text-xs leading-tight flex items-center gap-1">
                                                    <Users className="w-3 h-3 text-blue-400" />
                                                    {tech.prenom} {tech.nom}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    )}

                                    {/* Véhicules - affichage selon globalViewMode */}
                                    {globalViewMode === "vehicules" && (
                                      <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-vehicules`} type="VEHICULE">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[24px] p-0.5 rounded ${snapshot.isDraggingOver ? 'bg-purple-500/20 border-2 border-purple-500' : 'border border-slate-700'}`}
                                          >
                                            <div className="flex items-center gap-0.5 flex-wrap">
                                              {equipe.vehicules.map(vId => {
                                                const v = vehicules.find(v => v.id === vId);
                                                if (!v) return null;
                                                return (
                                                  <span key={vId} className="bg-purple-500/20 border border-purple-500/30 rounded px-1 py-0 text-white text-xs leading-tight flex items-center gap-1">
                                                    <Truck className="w-3 h-3 text-purple-400" />
                                                    {v.nom}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    )}

                                    {/* Équipements - affichage selon globalViewMode */}
                                    {globalViewMode === "equipements" && (
                                      <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-equipements`} type="EQUIPEMENT">
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`min-h-[24px] p-0.5 rounded ${snapshot.isDraggingOver ? 'bg-orange-500/20 border-2 border-orange-500' : 'border border-slate-700'}`}
                                          >
                                            <div className="flex items-center gap-0.5 flex-wrap">
                                              {equipe.equipements.map(eId => {
                                                const e = equipements.find(e => e.id === eId);
                                                if (!e) return null;
                                                return (
                                                  <span key={eId} className="bg-orange-500/20 border border-orange-500/30 rounded px-1 py-0 text-white text-xs leading-tight flex items-center gap-1">
                                                    <Wrench className="w-3 h-3 text-orange-400" />
                                                    {e.nom}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    )}

                                    {/* Mandats (toujours visibles) */}
                              <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-mandats`}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={`min-h-[50px] -mx-2 ${snapshot.isDraggingOver ? 'bg-cyan-500/10' : ''}`}
                                  >
                                    {equipe.mandats.map((cardId, index) => {
                                      const card = terrainCards.find(c => c.id === cardId);
                                      if (!card) return null;
                                      return (
                                        <Draggable key={cardId} draggableId={cardId} index={index}>
                                          {(provided, snapshot) => (
                                            <div
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                              className={snapshot.isDragging ? 'opacity-50' : ''}
                                            >
                                              <DossierCard card={card} placedDate={dateStr} />
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
                            </div>
                          );
                        })}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addEquipe(dateStr)}
                        className="w-full border-2 border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300 h-6 mt-2"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Ajouter équipe
                      </Button>
                    </Card>
                  );
                })}
              </div>
            ) : (
               <div className="grid grid-cols-5 w-full" style={{ gap: '2px' }}>
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const dayEquipes = equipes[dateStr] || [];

                  const holiday = isHoliday(day);
                  return (
                    <Card 
                      key={dateStr}
                      className={`bg-slate-900/50 border-slate-800 p-2 ${isToday ? 'ring-2 ring-emerald-500' : ''} ${holiday ? 'bg-red-900/20 border-red-500/30' : ''} w-full`}
                      >
                      <div className="mb-2 w-full">
                        <div className={`bg-slate-800/50 rounded-lg p-2 text-center ${isToday ? 'ring-2 ring-emerald-500' : ''} w-full`}>
                           <p className={`text-xs uppercase ${isToday ? 'text-emerald-400' : holiday ? 'text-red-400' : 'text-slate-400'}`}>
                             {format(day, "EEE", { locale: fr })}
                           </p>
                           <p className={`text-lg font-bold text-white`}>
                             {format(day, "d", { locale: fr })}
                           </p>
                          {holiday && (
                            <p className="text-xs text-red-400 mt-0.5">
                              {holiday.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 overflow-y-auto">
                        {dayEquipes.map((equipe) => {
                           const activeTab = getEquipeActiveTab(equipe.id);
                           const equipeNom = generateTeamDisplayName(equipe);
                           return (
                             <div key={equipe.id} className="bg-slate-800/50 border border-slate-700 rounded overflow-hidden text-xs">
                               <div className="bg-blue-600/40 px-1 py-1 border-b-2 border-blue-500/50">
                                 {/* Nom équipe et timings */}
                                 <div className="mb-1">
                                   <span 
                                     className="text-white text-xs font-bold cursor-pointer hover:text-emerald-400 transition-colors block"
                                     onClick={() => handleEditTeam(dateStr, equipe)}
                                   >
                                     {equipeNom}
                                   </span>
                                   <span className="text-emerald-300 text-xs block">
                                     {calculateEquipeTimings(equipe, dateStr).totalTime}h
                                   </span>
                                 </div>
                                 {/* Tabs et bouton supprimer */}
                                <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-0.5">
                                  {globalViewMode ? (
                                    <>
                                      {globalViewMode === "techniciens" && <Users className="w-3 h-3 text-blue-400" />}
                                      {globalViewMode === "vehicules" && <Truck className="w-3 h-3 text-purple-400" />}
                                      {globalViewMode === "equipements" && <Wrench className="w-3 h-3 text-orange-400" />}
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => setEquipeActiveTab(equipe.id, "techniciens")}
                                        className={`p-0.5 rounded transition-colors ${activeTab === "techniciens" ? 'bg-blue-500/30 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                                      >
                                        <Users className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setEquipeActiveTab(equipe.id, "vehicules")}
                                        className={`p-0.5 rounded transition-colors ${activeTab === "vehicules" ? 'bg-purple-500/30 text-purple-400' : 'text-slate-400 hover:text-white'}`}
                                      >
                                        <Truck className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setEquipeActiveTab(equipe.id, "equipements")}
                                        className={`p-0.5 rounded transition-colors ${activeTab === "equipements" ? 'bg-orange-500/30 text-orange-400' : 'text-slate-400 hover:text-white'}`}
                                      >
                                        <Wrench className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => copyEquipe(dateStr, equipe.id)}
                                    className="text-cyan-400 hover:text-cyan-300"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => removeEquipe(dateStr, equipe.id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                </div>
                                </div>

                                  <div className="p-1">

                                {/* Contenu du tab actif ou du mode global */}
                              {(globalViewMode === "techniciens" || activeTab === "techniciens") && (
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
                              )}

                              {(globalViewMode === "vehicules" || activeTab === "vehicules") && (
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
                              )}

                              {(globalViewMode === "equipements" || activeTab === "equipements") && (
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
                              )}

                              {/* Mandats (toujours visibles) */}
                              <Droppable droppableId={`equipe-${dateStr}-${equipe.id}-mandats`}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[30px] -mx-1">
                                    {equipe.mandats.map((cardId, idx) => {
                                      const card = terrainCards.find(c => c.id === cardId);
                                      return card ? (
                                        <Draggable key={cardId} draggableId={cardId} index={idx}>
                                          {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                              <DossierCard card={card} placedDate={dateStr} />
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
                          </div>
                        );
                      })}
                      </div>
                      <Button
                      size="sm"
                      onClick={() => addEquipe(dateStr)}
                      className="w-full border-2 border-slate-600 bg-transparent hover:bg-slate-800 text-slate-300 h-5 mt-1 text-xs"
                      >
                      <Plus className="w-3 h-3 mr-1" />
                      Ajouter
                      </Button>
                      </Card>
                      );
                      })}
                      </div>
                      )}
                      </div>
                      </div>
                      </DragDropContext>

      {/* Dialog de vue du dossier */}
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
                  {/* Informations principales */}
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

                  {/* Mandats */}
                  {viewingDossier.mandats && viewingDossier.mandats.length > 0 && (
                    <div>
                      <Label className="text-slate-400 text-sm mb-3 block">Mandats ({viewingDossier.mandats.length})</Label>
                      <div className="space-y-3">
                        {viewingDossier.mandats.map((mandat, index) => (
                          <Card key={index} className="bg-slate-800/50 border-slate-700">
                            <div className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <h5 className="font-semibold text-emerald-400 text-lg">{mandat.type_mandat || `Mandat ${index + 1}`}</h5>
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
                                        const lot = getLotById(lotId);
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
                            </div>
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

      {/* Dialog d'édition du dossier */}
      <EditDossierDialog
        isOpen={isEditingDialogOpen}
        onClose={() => {
          setIsEditingDialogOpen(false);
          setEditingDossier(null);
        }}
        dossier={editingDossier}
        onSuccess={() => {
          // Pas besoin d'invalider, les données sont passées en props
        }}
        clients={clients}
        users={users}
      />

      {/* Dialog de création d'équipe */}
      <CreateTeamDialog
        isOpen={isCreateTeamDialogOpen}
        onClose={() => setIsCreateTeamDialogOpen(false)}
        onCreateTeam={handleCreateTeam}
        dateStr={createTeamDateStr}
        techniciens={techniciens}
        vehicules={vehicules}
        equipements={equipements}
        equipes={equipes}
        usedResources={createTeamDateStr ? getUsedResourcesForDate(createTeamDateStr) : { techniciens: [], vehicules: [], equipements: [] }}
      />

      {/* Dialog de modification d'équipe */}
      <EditTeamDialog
        isOpen={isEditTeamDialogOpen}
        onClose={() => {
          setIsEditTeamDialogOpen(false);
          setEditingTeam(null);
          setEditTeamDateStr(null);
        }}
        onUpdateTeam={handleUpdateTeam}
        dateStr={editTeamDateStr}
        equipe={editingTeam}
        techniciens={techniciens}
        vehicules={vehicules}
        equipements={equipements}
        equipes={equipes}
      />
      </div>
      );
      }