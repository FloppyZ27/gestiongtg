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
  techniciens,
  allTechniciens,
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

  // Tous les techniciens (ma place + autres places)
  const allTechs = allTechniciens || techniciens;

  // Trouver quelle équipe utilise une ressource
  const getTeamForResource = (resourceId, resourceType) => {
    const dayEquipes = equipes[dateStr] || [];
    const equipe = dayEquipes.find(eq => eq[resourceType]?.includes(resourceId));
    if (!equipe) return null;
    const match = equipe.nom.match(/Équipe (\d+)/);
    const teamNumber = match ? match[1] : '';
    if (equipe.techniciens?.length > 0) {
      const initials = equipe.techniciens.map(techId => {
        const tech = allTechs.find(t => t.id === techId);
        return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
      }).filter(n => n).join('/');
      return teamNumber ? `Équipe ${teamNumber} - ${initials}` : initials;
    }
    return equipe.nom;
  };

  // Vérifier si un technicien est déjà cédulé dans l'autre place d'affaire ce jour-là
  const isAlreadyScheduledOtherPlace = (techId) => {
    const dayEquipes = equipes[dateStr] || [];
    for (const eq of dayEquipes) {
      if (eq.place_affaire && eq.place_affaire.toLowerCase() !== placeAffaire?.toLowerCase()) {
        if (eq.techniciens?.includes(techId)) return eq.place_affaire;
      }
    }
    return null;
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

  // Techniciens de ma place d'affaire
  const myPlaceTechs = allTechs.filter(t => t.place_affaire === (placeAffaire === 'alma' ? 'Alma' : 'Saguenay'));
  // Techniciens de l'autre place d'affaire (empruntables si pas déjà cédulés là-bas)
  const otherPlaceTechs = allTechs.filter(t => t.place_affaire !== (placeAffaire === 'alma' ? 'Alma' : 'Saguenay') && t.place_affaire);

  const myChefs = myPlaceTechs.filter(t => t.poste === 'Technicien Terrain (Chef)');
  const myTechsRegular = myPlaceTechs.filter(t => t.poste === 'Technicien Terrain');
  const otherChefs = otherPlaceTechs.filter(t => t.poste === 'Technicien Terrain (Chef)');
  const otherTechsRegular = otherPlaceTechs.filter(t => t.poste === 'Technicien Terrain');

  const availableMyTechs = myPlaceTechs.filter(t => !usedTechIds.includes(t.id));
  const availableChefs = availableMyTechs.filter(t => t.poste === 'Technicien Terrain (Chef)');
  const availableTechsRegular = availableMyTechs.filter(t => t.poste === 'Technicien Terrain');
  const availableVehs = vehicules.filter(v => !usedVehIds.includes(v.id) && !isResourceInOtherPlace(v.id, 'vehicules'));
  const availableEqs = equipements.filter(e => !usedEqIds.includes(e.id) && !isResourceInOtherPlace(e.id, 'equipements'));

  const generateTeamName = (techs) => {
    const teamNumber = (equipes[dateStr]?.length || 0) + 1;
    if (techs.length === 0) {
      return `Équipe ${teamNumber}`;
    }
    const initials = techs.map(techId => {
      const tech = allTechs.find(t => t.id === techId);
      return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
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
                    {/* Chefs de ma place */}
                    {myChefs.map(tech => {
                      const isUsedToday = usedTechIds.includes(tech.id);
                      const isAvailable = !isUsedToday;
                      const assignedTeam = isUsedToday ? getTeamForResource(tech.id, 'techniciens') : null;
                      return (
                        <div key={tech.id} className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}>
                          <Checkbox id={`chef-${tech.id}`} checked={selectedTechniciens.includes(tech.id)} onCheckedChange={() => isAvailable && toggleTechnicien(tech.id)} disabled={!isAvailable} className="border-slate-500" />
                          <Label htmlFor={`chef-${tech.id}`} className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {tech.prenom} {tech.nom} {isUsedToday && assignedTeam && <span className="text-slate-500">({assignedTeam})</span>}
                          </Label>
                        </div>
                      );
                    })}
                    {/* Chefs de l'autre place (empruntables) */}
                    {otherChefs.map(tech => {
                      const alreadyScheduled = isAlreadyScheduledOtherPlace(tech.id);
                      const isSelected = selectedTechniciens.includes(tech.id);
                      const canBorrow = !alreadyScheduled;
                      return (
                        <div key={tech.id} className="flex items-center gap-2 opacity-60">
                          <Checkbox id={`chef-${tech.id}`} checked={isSelected} onCheckedChange={() => canBorrow && toggleTechnicien(tech.id)} disabled={!canBorrow} className="border-slate-600" />
                          <Label htmlFor={`chef-${tech.id}`} className="flex-1 text-slate-500 text-xs">
                            {tech.prenom} {tech.nom}
                          </Label>
                          <Badge className="text-[10px] px-1 py-0 bg-slate-700 text-slate-400 border-slate-600">{tech.place_affaire}</Badge>
                          {canBorrow ? (
                            <Button type="button" size="sm" onClick={() => toggleTechnicien(tech.id)}
                              className={`h-5 px-2 text-[10px] ${isSelected ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/40'}`}>
                              {isSelected ? 'Annuler' : 'Emprunter'}
                            </Button>
                          ) : (
                            <span className="text-[10px] text-red-400">Déjà cédulé</span>
                          )}
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
                    {/* Techniciens de ma place */}
                    {myTechsRegular.map(tech => {
                      const isUsedToday = usedTechIds.includes(tech.id);
                      const isAvailable = !isUsedToday;
                      const assignedTeam = isUsedToday ? getTeamForResource(tech.id, 'techniciens') : null;
                      return (
                        <div key={tech.id} className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}>
                          <Checkbox id={`tech-${tech.id}`} checked={selectedTechniciens.includes(tech.id)} onCheckedChange={() => isAvailable && toggleTechnicien(tech.id)} disabled={!isAvailable} className="border-slate-500" />
                          <Label htmlFor={`tech-${tech.id}`} className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {tech.prenom} {tech.nom} {isUsedToday && assignedTeam && <span className="text-slate-500">({assignedTeam})</span>}
                          </Label>
                        </div>
                      );
                    })}
                    {/* Techniciens de l'autre place (empruntables) */}
                    {otherTechsRegular.map(tech => {
                      const alreadyScheduled = isAlreadyScheduledOtherPlace(tech.id);
                      const isSelected = selectedTechniciens.includes(tech.id);
                      const canBorrow = !alreadyScheduled;
                      return (
                        <div key={tech.id} className="flex items-center gap-2 opacity-60">
                          <Checkbox id={`tech-${tech.id}`} checked={isSelected} onCheckedChange={() => canBorrow && toggleTechnicien(tech.id)} disabled={!canBorrow} className="border-slate-600" />
                          <Label htmlFor={`tech-${tech.id}`} className="flex-1 text-slate-500 text-xs">
                            {tech.prenom} {tech.nom}
                          </Label>
                          <Badge className="text-[10px] px-1 py-0 bg-slate-700 text-slate-400 border-slate-600">{tech.place_affaire}</Badge>
                          {canBorrow ? (
                            <Button type="button" size="sm" onClick={() => toggleTechnicien(tech.id)}
                              className={`h-5 px-2 text-[10px] ${isSelected ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border border-amber-500/40'}`}>
                              {isSelected ? 'Annuler' : 'Emprunter'}
                            </Button>
                          ) : (
                            <span className="text-[10px] text-red-400">Déjà cédulé</span>
                          )}
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
                      const assignedTeam = isUsedToday ? getTeamForResource(veh.id, 'vehicules') : null;
                      return (
                        <div key={veh.id} className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}>
                          <Checkbox id={`veh-${veh.id}`} checked={selectedVehicules.includes(veh.id)} onCheckedChange={() => isAvailable && toggleVehicule(veh.id)} disabled={!isAvailable} className="border-slate-500" />
                          <Label htmlFor={`veh-${veh.id}`} className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {veh.nom} {isUsedToday && `(${assignedTeam})`} {otherPlace && `(${otherPlace.charAt(0).toUpperCase() + otherPlace.slice(1)})`}
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
          <Collapsible open={expandedSections.vehicules} onOpenChange={() => toggleSection('vehicules')}>
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
                      const assignedTeam = isUsedToday ? getTeamForResource(eq.id, 'equipements') : null;
                      return (
                        <div key={eq.id} className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}>
                          <Checkbox id={`eq-${eq.id}`} checked={selectedEquipements.includes(eq.id)} onCheckedChange={() => isAvailable && toggleEquipement(eq.id)} disabled={!isAvailable} className="border-slate-500" />
                          <Label htmlFor={`eq-${eq.id}`} className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}>
                            {eq.nom} {isUsedToday && `(${assignedTeam})`} {otherPlace && `(${otherPlace.charAt(0).toUpperCase() + otherPlace.slice(1)})`}
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