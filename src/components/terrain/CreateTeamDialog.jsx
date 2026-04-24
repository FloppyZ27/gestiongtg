import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Truck, Wrench, ChevronDown, ChevronUp } from "lucide-react";

export default function CreateTeamDialog({
  isOpen,
  onClose,
  onCreateTeam,
  dateStr,
  users,
  vehicules,
  equipements,
  equipes,
  usedResources,
  placeAffaire
}) {
  const [selectedTechniciens, setSelectedTechniciens] = useState([]);
  const [selectedVehicules, setSelectedVehicules] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    techniciens: true,
    vehicules: true,
    equipements: true
  });

  // Ressources déjà utilisées ce jour-là (dans la même place d'affaire)
  const usedTechIds = usedResources?.techniciens || [];
  const usedVehIds = usedResources?.vehicules || [];
  const usedEqIds = usedResources?.equipements || [];

  // Filtrer users par poste
  const allChefs = users?.filter(u => u.poste === "Technicien Terrain (Chef)") || [];
  const allTechs = users?.filter(u => u.poste === "Technicien Terrain") || [];

  // Trouver quelle équipe utilise une ressource
  const getTeamForResource = (resourceId, resourceType) => {
    const dayEquipes = equipes[dateStr] || [];
    const equipe = dayEquipes.find(eq => eq[resourceType]?.includes(resourceId));
    if (!equipe) return null;
    const match = equipe.nom.match(/Équipe (\d+)/);
    const teamNumber = match ? match[1] : '';
    if (equipe.techniciens?.length > 0) {
      const allUsers = [...allChefs, ...allTechs];
      const initials = equipe.techniciens.map(userId => {
        const user = allUsers.find(u => u.id === userId);
        return user ? user.prenom.charAt(0) + user.nom.charAt(0) : '';
      }).filter(n => n).join('/');
      return teamNumber ? `Équipe ${teamNumber} - ${initials}` : initials;
    }
    return equipe.nom;
  };



  // Vérifier si une ressource (véhicule/équipement) est dans l'autre place ce jour-là
  const isResourceInOtherPlace = (resourceId, resourceType) => {
    const dayEquipes = equipes[dateStr] || [];
    for (const eq of dayEquipes) {
      if (eq.place_affaire && eq.place_affaire.toLowerCase() !== placeAffaire?.toLowerCase()) {
        if (eq[resourceType]?.includes(resourceId)) return eq.place_affaire;
      }
    }
    return null;
  };



  const availableChefs = allChefs.filter(u => !usedTechIds.includes(u.id));
  const availableTechsRegular = allTechs.filter(u => !usedTechIds.includes(u.id));
  const availableVehs = vehicules.filter(v => !usedVehIds.includes(v.id) && !isResourceInOtherPlace(v.id, 'vehicules'));
  const availableEqs = equipements.filter(e => !usedEqIds.includes(e.id) && !isResourceInOtherPlace(e.id, 'equipements'));

  const generateTeamName = (userIds) => {
    const teamNumber = (equipes[dateStr]?.length || 0) + 1;
    if (userIds.length === 0) {
      return `Équipe ${teamNumber}`;
    }
    const allUsersMap = [...allChefs, ...allTechs];
    const initials = userIds.map(userId => {
      const user = allUsersMap.find(u => u.id === userId);
      return user ? user.prenom.charAt(0) + user.nom.charAt(0) : '';
    }).filter(n => n).join('/');
    return `Équipe ${teamNumber} - ${initials}`;
  };

  const handleCreateTeam = () => {
    const newTeam = {
      id: `eq${Date.now()}`,
      nom: generateTeamName(selectedTechniciens),
      place_affaire: placeAffaire,
      techniciens: selectedTechniciens,
      vehicules: selectedVehicules,
      equipements: selectedEquipements,
      mandats: []
    };
    onCreateTeam(newTeam);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTechniciens([]);
    setSelectedVehicules([]);
    setSelectedEquipements([]);
    onClose();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleTechnicien = (techId) => {
    setSelectedTechniciens(prev =>
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
  };

  const toggleVehicule = (vehId) => {
    setSelectedVehicules(prev =>
      prev.includes(vehId) ? prev.filter(id => id !== vehId) : [...prev, vehId]
    );
  };

  const toggleEquipement = (eqId) => {
    setSelectedEquipements(prev =>
      prev.includes(eqId) ? prev.filter(id => id !== eqId) : [...prev, eqId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm();
    }}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Créer une nouvelle équipe{selectedTechniciens.length > 0 && ` - ${generateTeamName(selectedTechniciens)}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {/* Techniciens (Chef) */}
          <Collapsible open={expandedSections.techniciens} onOpenChange={() => toggleSection('techniciens')}>
            <div className="rounded-lg overflow-hidden border border-blue-800/40">
              <CollapsibleTrigger className="w-full cursor-pointer transition-colors py-2.5 px-3 bg-blue-600 hover:bg-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">Techniciens (Chef)</span>
                    <span className="text-blue-100 text-xs">({availableChefs.length} disponibles)</span>
                  </div>
                  {expandedSections.techniciens ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-blue-950/20 pt-2 pb-3 px-3">
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {allChefs.map(user => {
                      const isUsedToday = usedTechIds.includes(user.id);
                      const isAvailable = !isUsedToday;
                      const isSelected = selectedTechniciens.includes(user.id);
                      const assignedTeam = isUsedToday ? getTeamForResource(user.id, 'techniciens') : null;
                      return (
                        <div key={user.id} className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${isSelected ? 'bg-blue-500/20 border border-blue-400/40' : ''} ${!isAvailable ? 'opacity-50' : 'cursor-pointer hover:bg-slate-700/40'}`}
                          onClick={() => isAvailable && toggleTechnicien(user.id)}>
                          <Checkbox id={`chef-${user.id}`} checked={isSelected} disabled={!isAvailable} className={`border-2 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-500'}`} />
                          <Label htmlFor={`chef-${user.id}`} className={`flex-1 ${isAvailable ? (isSelected ? 'text-white font-semibold cursor-pointer' : 'text-slate-300 cursor-pointer') : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {user.prenom} {user.nom} {isUsedToday && assignedTeam && <span className="text-slate-500 font-normal">({assignedTeam})</span>}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Techniciens */}
          <Collapsible open={expandedSections.vehicules} onOpenChange={() => toggleSection('vehicules')}>
            <div className="rounded-lg overflow-hidden border border-blue-800/40">
              <CollapsibleTrigger className="w-full cursor-pointer transition-colors py-2.5 px-3 bg-blue-500 hover:bg-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">Techniciens</span>
                    <span className="text-blue-100 text-xs">({availableTechsRegular.length} disponibles)</span>
                  </div>
                  {expandedSections.vehicules ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-blue-950/20 pt-2 pb-3 px-3">
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {allTechs.map(user => {
                      const isUsedToday = usedTechIds.includes(user.id);
                      const isAvailable = !isUsedToday;
                      const isSelected = selectedTechniciens.includes(user.id);
                      const assignedTeam = isUsedToday ? getTeamForResource(user.id, 'techniciens') : null;
                      return (
                        <div key={user.id} className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${isSelected ? 'bg-blue-500/20 border border-blue-400/40' : ''} ${!isAvailable ? 'opacity-50' : 'cursor-pointer hover:bg-slate-700/40'}`}
                          onClick={() => isAvailable && toggleTechnicien(user.id)}>
                          <Checkbox id={`tech-${user.id}`} checked={isSelected} disabled={!isAvailable} className={`border-2 ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-slate-500'}`} />
                          <Label htmlFor={`tech-${user.id}`} className={`flex-1 ${isAvailable ? (isSelected ? 'text-white font-semibold cursor-pointer' : 'text-slate-300 cursor-pointer') : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {user.prenom} {user.nom} {isUsedToday && assignedTeam && <span className="text-slate-500 font-normal">({assignedTeam})</span>}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Véhicules */}
          <Collapsible open={expandedSections.equipements} onOpenChange={() => toggleSection('equipements')}>
            <div className="rounded-lg overflow-hidden border border-purple-800/40">
              <CollapsibleTrigger className="w-full cursor-pointer transition-colors py-2.5 px-3 bg-purple-600 hover:bg-purple-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">Véhicules</span>
                    <span className="text-purple-100 text-xs">({availableVehs.length} disponibles)</span>
                  </div>
                  {expandedSections.equipements ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-purple-950/20 pt-2 pb-3 px-3">
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {vehicules.map(veh => {
                      const isUsedToday = usedVehIds.includes(veh.id);
                      const otherPlace = isResourceInOtherPlace(veh.id, 'vehicules');
                      const isAvailable = !isUsedToday && !otherPlace;
                      const isSelected = selectedVehicules.includes(veh.id);
                      const assignedTeam = isUsedToday ? getTeamForResource(veh.id, 'vehicules') : null;
                      return (
                        <div key={veh.id} className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${isSelected ? 'bg-purple-500/20 border border-purple-400/40' : ''} ${!isAvailable ? 'opacity-50' : 'cursor-pointer hover:bg-slate-700/40'}`}
                          onClick={() => isAvailable && toggleVehicule(veh.id)}>
                          <Checkbox id={`veh-${veh.id}`} checked={isSelected} disabled={!isAvailable} className={`border-2 ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-slate-500'}`} />
                          <Label htmlFor={`veh-${veh.id}`} className={`flex-1 ${isAvailable ? (isSelected ? 'text-white font-semibold cursor-pointer' : 'text-slate-300 cursor-pointer') : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {veh.nom} {isUsedToday && `(${assignedTeam})`} {otherPlace && `(${otherPlace})`}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Équipements */}
          <Collapsible open={expandedSections.equipements} onOpenChange={() => toggleSection('equipements')}>
           <div className="rounded-lg overflow-hidden border border-orange-800/40">
             <CollapsibleTrigger className="w-full cursor-pointer transition-colors py-2.5 px-3 bg-orange-500 hover:bg-orange-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">Équipements</span>
                    <span className="text-orange-100 text-xs">({availableEqs.length} disponibles)</span>
                  </div>
                  {expandedSections.vehicules ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-orange-950/20 pt-2 pb-3 px-3">
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {equipements.map(eq => {
                      const isUsedToday = usedEqIds.includes(eq.id);
                      const otherPlace = isResourceInOtherPlace(eq.id, 'equipements');
                      const isAvailable = !isUsedToday && !otherPlace;
                      const isSelected = selectedEquipements.includes(eq.id);
                      const assignedTeam = isUsedToday ? getTeamForResource(eq.id, 'equipements') : null;
                      return (
                        <div key={eq.id} className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors ${isSelected ? 'bg-orange-500/20 border border-orange-400/40' : ''} ${!isAvailable ? 'opacity-50' : 'cursor-pointer hover:bg-slate-700/40'}`}
                          onClick={() => isAvailable && toggleEquipement(eq.id)}>
                          <Checkbox id={`eq-${eq.id}`} checked={isSelected} disabled={!isAvailable} className={`border-2 ${isSelected ? 'border-orange-400 bg-orange-500' : 'border-slate-500'}`} />
                          <Label htmlFor={`eq-${eq.id}`} className={`flex-1 ${isAvailable ? (isSelected ? 'text-white font-semibold cursor-pointer' : 'text-slate-300 cursor-pointer') : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {eq.nom} {isUsedToday && `(${assignedTeam})`} {otherPlace && `(${otherPlace})`}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={resetForm} className="border-red-500 text-red-400 hover:bg-red-500/10">
              Annuler
            </Button>
            <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" onClick={handleCreateTeam}>
              Créer l'équipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}