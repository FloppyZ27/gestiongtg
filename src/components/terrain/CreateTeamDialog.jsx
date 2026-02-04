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

  // Ressources disponibles
  const availableTechs = techniciens.filter(t => !usedTechIds.includes(t.id));
  const availableVehs = vehicules.filter(v => !usedVehIds.includes(v.id));
  const availableEqs = equipements.filter(e => !usedEqIds.includes(e.id));

  const handleCreateTeam = () => {
    const newTeam = {
      id: `eq${Date.now()}`,
      nom: teamName || `Équipe ${(equipes[dateStr]?.length || 0) + 1}`,
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
                Techniciens disponibles ({availableTechs.length})
              </Label>
            </div>
            {availableTechs.length > 0 ? (
              <ScrollArea className="border border-slate-700 rounded-lg bg-slate-800/30 h-32">
                <div className="p-3 space-y-2">
                  {availableTechs.map(tech => (
                    <div key={tech.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`tech-${tech.id}`}
                        checked={selectedTechniciens.includes(tech.id)}
                        onCheckedChange={() => toggleTechnicien(tech.id)}
                        className="border-slate-500"
                      />
                      <Label
                        htmlFor={`tech-${tech.id}`}
                        className="text-slate-300 cursor-pointer flex-1"
                      >
                        {tech.prenom} {tech.nom}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-slate-400 text-sm p-3 bg-slate-800/30 rounded-lg">
                Aucun technicien disponible pour cette journée
              </div>
            )}
          </div>

          {/* Véhicules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400" />
              <Label className="text-slate-300 font-semibold">
                Véhicules disponibles ({availableVehs.length})
              </Label>
            </div>
            {availableVehs.length > 0 ? (
              <ScrollArea className="border border-slate-700 rounded-lg bg-slate-800/30 h-32">
                <div className="p-3 space-y-2">
                  {availableVehs.map(veh => (
                    <div key={veh.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`veh-${veh.id}`}
                        checked={selectedVehicules.includes(veh.id)}
                        onCheckedChange={() => toggleVehicule(veh.id)}
                        className="border-slate-500"
                      />
                      <Label
                        htmlFor={`veh-${veh.id}`}
                        className="text-slate-300 cursor-pointer flex-1"
                      >
                        {veh.nom}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-slate-400 text-sm p-3 bg-slate-800/30 rounded-lg">
                Aucun véhicule disponible pour cette journée
              </div>
            )}
          </div>

          {/* Équipements */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-400" />
              <Label className="text-slate-300 font-semibold">
                Équipements disponibles ({availableEqs.length})
              </Label>
            </div>
            {availableEqs.length > 0 ? (
              <ScrollArea className="border border-slate-700 rounded-lg bg-slate-800/30 h-32">
                <div className="p-3 space-y-2">
                  {availableEqs.map(eq => (
                    <div key={eq.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`eq-${eq.id}`}
                        checked={selectedEquipements.includes(eq.id)}
                        onCheckedChange={() => toggleEquipement(eq.id)}
                        className="border-slate-500"
                      />
                      <Label
                        htmlFor={`eq-${eq.id}`}
                        className="text-slate-300 cursor-pointer flex-1"
                      >
                        {eq.nom}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-slate-400 text-sm p-3 bg-slate-800/30 rounded-lg">
                Aucun équipement disponible pour cette journée
              </div>
            )}
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