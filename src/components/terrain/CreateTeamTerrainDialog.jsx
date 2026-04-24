import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Truck, Wrench, X, ChevronDown } from "lucide-react";

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
  const [chefOpen, setChefOpen] = useState(true);
  const [techOpen, setTechOpen] = useState(true);
  const [vehiculeOpen, setVehiculeOpen] = useState(false);
  const [equipementOpen, setEquipementOpen] = useState(false);

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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 py-4 border-b border-slate-800">
          <DialogTitle className="text-lg">Création équipe terrain</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2 p-4">
            {/* Section Technicien Chef */}
            <Collapsible open={chefOpen} onOpenChange={setChefOpen} className="border border-blue-800/40 rounded overflow-hidden">
              <CollapsibleTrigger className="w-full bg-blue-600 hover:bg-blue-600/90 px-3 py-2 flex items-center gap-2 text-white text-sm font-semibold">
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: chefOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                <Users className="w-4 h-4" />
                <span>Chef ({selectedChefs.length}/{chefs.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-blue-950/30 p-2 space-y-1">
                {chefs.length > 0 ? (
                  chefs.map(chef => (
                    <div key={chef.id} className="flex items-center gap-2 p-1.5 hover:bg-blue-500/10 rounded text-xs">
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
                  <p className="text-slate-400 text-xs py-1">Aucun disponible</p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Section Technicien */}
            <Collapsible open={techOpen} onOpenChange={setTechOpen} className="border border-cyan-800/40 rounded overflow-hidden">
              <CollapsibleTrigger className="w-full bg-cyan-600 hover:bg-cyan-600/90 px-3 py-2 flex items-center gap-2 text-white text-sm font-semibold">
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: techOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                <Users className="w-4 h-4" />
                <span>Technicien ({selectedTechs.length}/{techs.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-cyan-950/30 p-2 space-y-1">
                {techs.length > 0 ? (
                  techs.map(tech => (
                    <div key={tech.id} className="flex items-center gap-2 p-1.5 hover:bg-cyan-500/10 rounded text-xs">
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
                  <p className="text-slate-400 text-xs py-1">Aucun disponible</p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Section Véhicules */}
            <Collapsible open={vehiculeOpen} onOpenChange={setVehiculeOpen} className="border border-purple-800/40 rounded overflow-hidden">
              <CollapsibleTrigger className="w-full bg-purple-600 hover:bg-purple-600/90 px-3 py-2 flex items-center gap-2 text-white text-sm font-semibold">
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: vehiculeOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                <Truck className="w-4 h-4" />
                <span>Véhicules ({selectedVehicules.length}/{availableVehicules.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-purple-950/30 p-2 space-y-1">
                {availableVehicules.length > 0 ? (
                  availableVehicules.map(veh => (
                    <div key={veh.id} className="flex items-center gap-2 p-1.5 hover:bg-purple-500/10 rounded text-xs">
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
                  <p className="text-slate-400 text-xs py-1">Aucun disponible</p>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Section Équipements */}
            <Collapsible open={equipementOpen} onOpenChange={setEquipementOpen} className="border border-orange-800/40 rounded overflow-hidden">
              <CollapsibleTrigger className="w-full bg-orange-600 hover:bg-orange-600/90 px-3 py-2 flex items-center gap-2 text-white text-sm font-semibold">
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: equipementOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                <Wrench className="w-4 h-4" />
                <span>Équipements ({selectedEquipements.length}/{availableEquipements.length})</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="bg-orange-950/30 p-2 space-y-1">
                {availableEquipements.length > 0 ? (
                  availableEquipements.map(eq => (
                    <div key={eq.id} className="flex items-center gap-2 p-1.5 hover:bg-orange-500/10 rounded text-xs">
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
                  <p className="text-slate-400 text-xs py-1">Aucun disponible</p>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <div className="border-t border-slate-800 px-4 py-3 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={resetForm}
            size="sm"
            className="border-red-500 text-red-400 hover:bg-red-500/10 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Annuler
          </Button>
          <Button
            onClick={handleCreateTeam}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs"
          >
            Créer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}