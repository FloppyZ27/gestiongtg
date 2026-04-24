import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Truck, Wrench, X } from "lucide-react";

export default function CreateTeamTerrainDialog({
  isOpen,
  onClose,
  onCreateTeam,
  dateStr,
  users,
  vehicules,
  equipements
}) {
  const [selectedChefs, setSelectedChefs] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [selectedVehicules, setSelectedVehicules] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);

  // Filtrer les utilisateurs par poste et statut
  const chefs = users?.filter(u => 
    u.poste === "Technicien Terrain (Chef)" && (u.statut === "Actif" || !u.statut)
  ) || [];
  
  const techs = users?.filter(u => 
    u.poste === "Technicien Terrain" && (u.statut === "Actif" || !u.statut)
  ) || [];

  const availableVehicules = vehicules || [];
  const availableEquipements = equipements || [];

  const handleCreateTeam = () => {
    const allTechIds = [...selectedChefs, ...selectedTechs];
    const teamName = allTechIds.length > 0 
      ? `Équipe ${(new Date().getTime() % 100)} - ${allTechIds.slice(0, 2).map(id => {
          const user = users.find(u => u.id === id);
          return user ? user.prenom.charAt(0) + user.nom.charAt(0) : '';
        }).join('/')}`
      : `Équipe ${new Date().getTime() % 100}`;

    const newTeam = {
      id: `eq${Date.now()}`,
      nom: teamName,
      place_affaire: "",
      techniciens: allTechIds,
      vehicules: selectedVehicules,
      equipements: selectedEquipements,
      mandats: []
    };

    onCreateTeam(newTeam);
    resetForm();
  };

  const resetForm = () => {
    setSelectedChefs([]);
    setSelectedTechs([]);
    setSelectedVehicules([]);
    setSelectedEquipements([]);
    onClose();
  };

  const toggleUser = (userId, type) => {
    if (type === "chefs") {
      setSelectedChefs(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    } else {
      setSelectedTechs(prev =>
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    }
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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 border-b border-slate-800">
          <DialogTitle className="text-xl">Création d'une équipe terrain</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-hidden">
          <div className="space-y-4 p-6">
            {/* Section Technicien Chef */}
            <div className="rounded-lg overflow-hidden border border-blue-800/40">
              <div className="bg-blue-600 px-4 py-3 flex items-center gap-3">
                <Users className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold">Technicien Chef</h3>
                <span className="text-blue-100 text-sm ml-auto">({chefs.length} disponibles)</span>
              </div>
              <div className="bg-blue-950/20 p-4 space-y-2 max-h-48 overflow-y-auto">
                {chefs.length > 0 ? (
                  chefs.map(chef => (
                    <div key={chef.id} className="flex items-center gap-3 p-2 hover:bg-blue-500/10 rounded">
                      <Checkbox
                        id={`chef-${chef.id}`}
                        checked={selectedChefs.includes(chef.id)}
                        onCheckedChange={() => toggleUser(chef.id, "chefs")}
                        className="border-blue-400"
                      />
                      <Label htmlFor={`chef-${chef.id}`} className="flex-1 cursor-pointer text-slate-200">
                        {chef.prenom} {chef.nom}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm py-2">Aucun technicien chef disponible</p>
                )}
              </div>
            </div>

            {/* Section Technicien */}
            <div className="rounded-lg overflow-hidden border border-cyan-800/40">
              <div className="bg-cyan-600 px-4 py-3 flex items-center gap-3">
                <Users className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold">Technicien</h3>
                <span className="text-cyan-100 text-sm ml-auto">({techs.length} disponibles)</span>
              </div>
              <div className="bg-cyan-950/20 p-4 space-y-2 max-h-48 overflow-y-auto">
                {techs.length > 0 ? (
                  techs.map(tech => (
                    <div key={tech.id} className="flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded">
                      <Checkbox
                        id={`tech-${tech.id}`}
                        checked={selectedTechs.includes(tech.id)}
                        onCheckedChange={() => toggleUser(tech.id, "techs")}
                        className="border-cyan-400"
                      />
                      <Label htmlFor={`tech-${tech.id}`} className="flex-1 cursor-pointer text-slate-200">
                        {tech.prenom} {tech.nom}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm py-2">Aucun technicien disponible</p>
                )}
              </div>
            </div>

            {/* Section Véhicules */}
            <div className="rounded-lg overflow-hidden border border-purple-800/40">
              <div className="bg-purple-600 px-4 py-3 flex items-center gap-3">
                <Truck className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold">Véhicules</h3>
                <span className="text-purple-100 text-sm ml-auto">({availableVehicules.length} disponibles)</span>
              </div>
              <div className="bg-purple-950/20 p-4 space-y-2 max-h-48 overflow-y-auto">
                {availableVehicules.length > 0 ? (
                  availableVehicules.map(veh => (
                    <div key={veh.id} className="flex items-center gap-3 p-2 hover:bg-purple-500/10 rounded">
                      <Checkbox
                        id={`veh-${veh.id}`}
                        checked={selectedVehicules.includes(veh.id)}
                        onCheckedChange={() => toggleVehicule(veh.id)}
                        className="border-purple-400"
                      />
                      <Label htmlFor={`veh-${veh.id}`} className="flex-1 cursor-pointer text-slate-200">
                        {veh.nom}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm py-2">Aucun véhicule disponible</p>
                )}
              </div>
            </div>

            {/* Section Équipements */}
            <div className="rounded-lg overflow-hidden border border-orange-800/40">
              <div className="bg-orange-600 px-4 py-3 flex items-center gap-3">
                <Wrench className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold">Équipements</h3>
                <span className="text-orange-100 text-sm ml-auto">({availableEquipements.length} disponibles)</span>
              </div>
              <div className="bg-orange-950/20 p-4 space-y-2 max-h-48 overflow-y-auto">
                {availableEquipements.length > 0 ? (
                  availableEquipements.map(eq => (
                    <div key={eq.id} className="flex items-center gap-3 p-2 hover:bg-orange-500/10 rounded">
                      <Checkbox
                        id={`eq-${eq.id}`}
                        checked={selectedEquipements.includes(eq.id)}
                        onCheckedChange={() => toggleEquipement(eq.id)}
                        className="border-orange-400"
                      />
                      <Label htmlFor={`eq-${eq.id}`} className="flex-1 cursor-pointer text-slate-200">
                        {eq.nom}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm py-2">Aucun équipement disponible</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t border-slate-800 p-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={resetForm}
            className="border-red-500 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-4 h-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleCreateTeam}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            Créer l'équipe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}