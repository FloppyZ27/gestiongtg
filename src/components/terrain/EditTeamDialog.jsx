import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Truck, Wrench, ChevronDown, ChevronUp } from "lucide-react";

export default function EditTeamDialog({
  isOpen,
  onClose,
  onUpdateTeam,
  dateStr,
  equipe,
  techniciens,
  vehicules,
  equipements,
  equipes,
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

  // Initialiser avec les valeurs actuelles de l'équipe
  useEffect(() => {
    if (equipe) {
      setSelectedTechniciens(equipe.techniciens || []);
      setSelectedVehicules(equipe.vehicules || []);
      setSelectedEquipements(equipe.equipements || []);
    }
  }, [equipe]);

  // Ressources utilisées ce jour-là (excluant l'équipe actuelle)
  const getUsedResources = () => {
    const dayEquipes = equipes[dateStr] || [];
    const usedTechIds = new Set();
    const usedVehIds = new Set();
    const usedEqIds = new Set();

    dayEquipes.forEach(eq => {
      if (eq.id !== equipe?.id) {
        eq.techniciens.forEach(id => usedTechIds.add(id));
        eq.vehicules.forEach(id => usedVehIds.add(id));
        eq.equipements.forEach(id => usedEqIds.add(id));
      }
    });

    return {
      techniciens: Array.from(usedTechIds),
      vehicules: Array.from(usedVehIds),
      equipements: Array.from(usedEqIds)
    };
  };

  const usedResources = getUsedResources();

  // Trouver quelle équipe utilise une ressource
  const getTeamForResource = (resourceId, resourceType) => {
    const dayEquipes = equipes[dateStr] || [];
    const foundEquipe = dayEquipes.find(eq => eq.id !== equipe?.id && eq[resourceType]?.includes(resourceId));
    if (!foundEquipe) return null;
    
    const match = foundEquipe.nom.match(/Équipe (\d+)/);
    const teamNumber = match ? match[1] : '';
    
    if (foundEquipe.techniciens?.length > 0) {
      const initials = foundEquipe.techniciens.map(techId => {
        const tech = techniciens.find(t => t.id === techId);
        return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
      }).filter(n => n).join('/');
      return teamNumber ? `Équipe ${teamNumber} - ${initials}` : initials;
    }
    return foundEquipe.nom;
  };

  const generateTeamName = (techs) => {
    const match = equipe?.nom.match(/Équipe (\d+)/);
    const teamNumber = match ? match[1] : '';
    
    if (techs.length === 0) {
      return teamNumber ? `Équipe ${teamNumber}` : equipe?.nom || 'Équipe';
    }
    const initials = techs.map(techId => {
      const tech = techniciens.find(t => t.id === techId);
      return tech ? tech.prenom.charAt(0) + tech.nom.charAt(0) : '';
    }).filter(n => n).join('/');
    return teamNumber ? `Équipe ${teamNumber} - ${initials}` : `Équipe - ${initials}`;
  };

  const handleUpdateTeam = () => {
    const updatedTeam = {
      ...equipe,
      nom: generateTeamName(selectedTechniciens),
      place_affaire: placeAffaire,
      techniciens: selectedTechniciens,
      vehicules: selectedVehicules,
      equipements: selectedEquipements
    };
    onUpdateTeam(updatedTeam);
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

  if (!equipe) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modifier l'équipe{selectedTechniciens.length > 0 && ` - ${generateTeamName(selectedTechniciens)}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Techniciens */}
          <Collapsible
            open={expandedSections.techniciens}
            onOpenChange={() => toggleSection('techniciens')}
            className="border border-slate-700 bg-slate-800/30 rounded-lg"
          >
            <CollapsibleTrigger className="w-full p-3 hover:bg-blue-900 transition-colors bg-blue-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <Label className="text-blue-300 font-semibold cursor-pointer">
                    Techniciens
                  </Label>
                </div>
                {expandedSections.techniciens ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="bg-slate-800/50 h-32 border-t border-slate-700">
                <div className="p-3 space-y-2">
                  {techniciens.map(tech => {
                    const isUsedByOther = usedResources.techniciens.includes(tech.id);
                    const assignedTeam = isUsedByOther ? getTeamForResource(tech.id, 'techniciens') : null;
                    return (
                      <div
                        key={tech.id}
                        className={`flex items-center gap-2 ${isUsedByOther ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`tech-${tech.id}`}
                          checked={selectedTechniciens.includes(tech.id)}
                          onCheckedChange={() => !isUsedByOther && toggleTechnicien(tech.id)}
                          disabled={isUsedByOther}
                          className="border-slate-500"
                        />
                        <Label
                          htmlFor={`tech-${tech.id}`}
                          className={`flex-1 ${!isUsedByOther ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                        >
                          {tech.prenom} {tech.nom} {isUsedByOther && `(${assignedTeam})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {/* Véhicules */}
          <Collapsible
            open={expandedSections.vehicules}
            onOpenChange={() => toggleSection('vehicules')}
            className="border border-slate-700 bg-slate-800/30 rounded-lg"
          >
            <CollapsibleTrigger className="w-full p-3 hover:bg-purple-900 transition-colors bg-purple-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-400" />
                  <Label className="text-purple-300 font-semibold cursor-pointer">
                    Véhicules
                  </Label>
                </div>
                {expandedSections.vehicules ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="bg-slate-800/50 h-32 border-t border-slate-700">
                <div className="p-3 space-y-2">
                  {vehicules.map(veh => {
                    const isUsedByOther = usedResources.vehicules.includes(veh.id);
                    const assignedTeam = isUsedByOther ? getTeamForResource(veh.id, 'vehicules') : null;
                    return (
                      <div
                        key={veh.id}
                        className={`flex items-center gap-2 ${isUsedByOther ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`veh-${veh.id}`}
                          checked={selectedVehicules.includes(veh.id)}
                          onCheckedChange={() => !isUsedByOther && toggleVehicule(veh.id)}
                          disabled={isUsedByOther}
                          className="border-slate-500"
                        />
                        <Label
                          htmlFor={`veh-${veh.id}`}
                          className={`flex-1 ${!isUsedByOther ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                        >
                          {veh.nom} {isUsedByOther && `(${assignedTeam})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {/* Équipements */}
          <Collapsible
            open={expandedSections.equipements}
            onOpenChange={() => toggleSection('equipements')}
            className="border border-slate-700 bg-slate-800/30 rounded-lg"
          >
            <CollapsibleTrigger className="w-full p-3 hover:bg-orange-900 transition-colors bg-orange-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <Label className="text-orange-300 font-semibold cursor-pointer">
                    Équipements
                  </Label>
                </div>
                {expandedSections.equipements ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="bg-slate-800/50 h-32 border-t border-slate-700">
                <div className="p-3 space-y-2">
                  {equipements.map(eq => {
                    const isUsedByOther = usedResources.equipements.includes(eq.id);
                    const assignedTeam = isUsedByOther ? getTeamForResource(eq.id, 'equipements') : null;
                    return (
                      <div
                        key={eq.id}
                        className={`flex items-center gap-2 ${isUsedByOther ? 'opacity-50' : ''}`}
                      >
                        <Checkbox
                          id={`eq-${eq.id}`}
                          checked={selectedEquipements.includes(eq.id)}
                          onCheckedChange={() => !isUsedByOther && toggleEquipement(eq.id)}
                          disabled={isUsedByOther}
                          className="border-slate-500"
                        />
                        <Label
                          htmlFor={`eq-${eq.id}`}
                          className={`flex-1 ${!isUsedByOther ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                        >
                          {eq.nom} {isUsedByOther && `(${assignedTeam})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleUpdateTeam}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}