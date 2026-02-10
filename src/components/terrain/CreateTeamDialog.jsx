import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Truck, Wrench, ChevronDown, ChevronUp } from "lucide-react";

export default function CreateTeamDialog({
  isOpen,
  onClose,
  onCreateTeam,
  dateStr,
  techniciens,
  vehicules,
  equipements,
  equipes,
  usedResources
}) {
  const [selectedTechniciens, setSelectedTechniciens] = useState([]);
  const [selectedVehicules, setSelectedVehicules] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    techniciens: true,
    vehicules: true,
    equipements: true
  });

  // Ressources déjà utilisées ce jour-là
  const usedTechIds = usedResources?.techniciens || [];
  const usedVehIds = usedResources?.vehicules || [];
  const usedEqIds = usedResources?.equipements || [];

  // Trouver quelle équipe utilise une ressource
  const getTeamForResource = (resourceId, resourceType) => {
    const dayEquipes = equipes[dateStr] || [];
    const equipe = dayEquipes.find(eq => eq[resourceType]?.includes(resourceId));
    if (!equipe) return null;
    
    // Extraire le numéro d'équipe et générer le format "Équipe X - Initiales"
    const match = equipe.nom.match(/Équipe (\d+)/);
    const teamNumber = match ? match[1] : '';
    
    if (equipe.techniciens?.length > 0) {
      const initials = equipe.techniciens.map(techId => {
        const tech = techniciens.find(t => t.id === techId);
        return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
      }).filter(n => n).join('/');
      return teamNumber ? `Équipe ${teamNumber} - ${initials}` : initials;
    }
    return equipe.nom;
  };

  // Ressources disponibles
  const availableTechs = techniciens.filter(t => !usedTechIds.includes(t.id));
  const availableVehs = vehicules.filter(v => !usedVehIds.includes(v.id));
  const availableEqs = equipements.filter(e => !usedEqIds.includes(e.id));

  const generateTeamName = (techs) => {
    const teamNumber = (equipes[dateStr]?.length || 0) + 1;
    if (techs.length === 0) {
      return `Équipe ${teamNumber}`;
    }
    const initials = techs.map(techId => {
      const tech = techniciens.find(t => t.id === techId);
      return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
    }).filter(n => n).join('/');
    return `Équipe ${teamNumber} - ${initials}`;
  };

  const handleCreateTeam = () => {
    const newTeam = {
      id: `eq${Date.now()}`,
      nom: generateTeamName(selectedTechniciens),
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
          <DialogTitle>Créer une nouvelle équipe{selectedTechniciens.length > 0 && ` - ${generateTeamName(selectedTechniciens)}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Techniciens */}
          <Collapsible
            open={expandedSections.techniciens}
            onOpenChange={() => toggleSection('techniciens')}
            className="border border-slate-700 bg-slate-800/30 rounded-lg"
          >
            <CollapsibleTrigger className="w-full py-2 px-3 hover:bg-blue-700 transition-colors bg-blue-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-400/50 flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                  <Label className="text-white font-semibold cursor-pointer text-sm">
                    Techniciens ({availableTechs.length} disponibles)
                  </Label>
                </div>
                {expandedSections.techniciens ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-2 pb-2 px-3">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {techniciens.map(tech => {
                    const isAvailable = !usedTechIds.includes(tech.id);
                    const assignedTeam = !isAvailable ? getTeamForResource(tech.id, 'techniciens') : null;
                    return (
                      <div
                        key={tech.id}
                        className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`tech-${tech.id}`}
                          checked={selectedTechniciens.includes(tech.id)}
                          onCheckedChange={() => isAvailable && toggleTechnicien(tech.id)}
                          disabled={!isAvailable}
                          className="border-slate-500"
                        />
                        <Label
                          htmlFor={`tech-${tech.id}`}
                          className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}
                        >
                          {tech.prenom} {tech.nom} {!isAvailable && `(${assignedTeam})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Véhicules */}
          <Collapsible
            open={expandedSections.vehicules}
            onOpenChange={() => toggleSection('vehicules')}
            className="border border-slate-700 bg-slate-800/30 rounded-lg"
          >
            <CollapsibleTrigger className="w-full py-2 px-3 hover:bg-purple-700 transition-colors bg-purple-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-400/50 flex items-center justify-center">
                    <Truck className="w-3 h-3 text-white" />
                  </div>
                  <Label className="text-white font-semibold cursor-pointer text-sm">
                    Véhicules ({availableVehs.length} disponibles)
                  </Label>
                </div>
                {expandedSections.vehicules ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-2 pb-2 px-3">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {vehicules.map(veh => {
                    const isAvailable = !usedVehIds.includes(veh.id);
                    const assignedTeam = !isAvailable ? getTeamForResource(veh.id, 'vehicules') : null;
                    return (
                      <div
                        key={veh.id}
                        className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`veh-${veh.id}`}
                          checked={selectedVehicules.includes(veh.id)}
                          onCheckedChange={() => isAvailable && toggleVehicule(veh.id)}
                          disabled={!isAvailable}
                          className="border-slate-500"
                        />
                        <Label
                          htmlFor={`veh-${veh.id}`}
                          className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}
                        >
                          {veh.nom} {!isAvailable && `(${assignedTeam})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Équipements */}
          <Collapsible
            open={expandedSections.equipements}
            onOpenChange={() => toggleSection('equipements')}
            className="border border-slate-700 bg-slate-800/30 rounded-lg"
          >
            <CollapsibleTrigger className="w-full py-2 px-3 hover:bg-orange-700 transition-colors bg-orange-600 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-400/50 flex items-center justify-center">
                    <Wrench className="w-3 h-3 text-white" />
                  </div>
                  <Label className="text-white font-semibold cursor-pointer text-sm">
                    Équipements ({availableEqs.length} disponibles)
                  </Label>
                </div>
                {expandedSections.equipements ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-2 pb-2 px-3">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {equipements.map(eq => {
                    const isAvailable = !usedEqIds.includes(eq.id);
                    const assignedTeam = !isAvailable ? getTeamForResource(eq.id, 'equipements') : null;
                    return (
                      <div
                        key={eq.id}
                        className={`flex items-center gap-2 ${!isAvailable ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`eq-${eq.id}`}
                          checked={selectedEquipements.includes(eq.id)}
                          onCheckedChange={() => isAvailable && toggleEquipement(eq.id)}
                          disabled={!isAvailable}
                          className="border-slate-500"
                        />
                        <Label
                          htmlFor={`eq-${eq.id}`}
                          className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'} text-xs`}
                        >
                          {eq.nom} {!isAvailable && `(${assignedTeam})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleCreateTeam}
            >
              Créer l'équipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}