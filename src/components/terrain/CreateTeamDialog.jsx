import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Truck, Wrench, X } from "lucide-react";

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
  const [teamName, setTeamName] = useState("");
  const [selectedTechniciens, setSelectedTechniciens] = useState([]);
  const [selectedVehicules, setSelectedVehicules] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);

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
      }).filter(n => n).join('-');
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
    }).filter(n => n).join('-');
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
    setTeamName("");
    setSelectedTechniciens([]);
    setSelectedVehicules([]);
    setSelectedEquipements([]);
    onClose();
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
          <DialogTitle>Créer une nouvelle équipe</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nom de l'équipe */}
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-slate-300">Nom de l'équipe (optionnel)</Label>
            <Input
              id="team-name"
              placeholder="Ex: Équipe 1"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          {/* Techniciens */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <Label className="text-slate-300 font-semibold">
                Techniciens ({availableTechs.length} disponibles)
              </Label>
            </div>
            <ScrollArea className="border border-slate-700 rounded-lg bg-slate-800/30 h-32">
              <div className="p-3 space-y-2">
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
                        className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                      >
                        {tech.prenom} {tech.nom} {!isAvailable && `(${assignedTeam})`}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Véhicules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400" />
              <Label className="text-slate-300 font-semibold">
                Véhicules ({availableVehs.length} disponibles)
              </Label>
            </div>
            <ScrollArea className="border border-slate-700 rounded-lg bg-slate-800/30 h-32">
              <div className="p-3 space-y-2">
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
                        className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                      >
                        {veh.nom} {!isAvailable && `(${assignedTeam})`}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Équipements */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" />
              <Label className="text-slate-300 font-semibold">
                Équipements ({availableEqs.length} disponibles)
              </Label>
            </div>
            <ScrollArea className="border border-slate-700 rounded-lg bg-slate-800/30 h-32">
              <div className="p-3 space-y-2">
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
                        className={`flex-1 ${isAvailable ? 'text-slate-300 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                      >
                        {eq.nom} {!isAvailable && `(${assignedTeam})`}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

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