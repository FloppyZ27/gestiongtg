import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, Wrench, X, ChevronDown, ChevronUp } from "lucide-react";

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
    // Validation : au moins un chef doit être sélectionné
    if (selectedChefs.length === 0) {
      alert("Vous devez sélectionner au moins un technicien chef pour créer une équipe.");
      return;
    }

    const allTechIds = [...selectedChefs, ...selectedTechs];
    
    // Générer initiales des chefs
    const chefInitials = selectedChefs.map(id => {
      const user = users.find(u => u.id === id);
      return user ? user.prenom.charAt(0) + user.nom.charAt(0) : '';
    }).join('/');

    const teamName = `Équipe ${chefInitials} - ${(new Date().getTime() % 100)}`;

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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {/* Section Technicien Chef */}
            <Card className="border-blue-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-blue-900/40 transition-colors py-2 px-4 bg-blue-900/20"
                onClick={() => setChefOpen(!chefOpen)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <Users className="w-3 h-3 text-blue-400" />
                    </div>
                    <CardTitle className="text-blue-300 text-sm">Chef ({selectedChefs.length}/{chefs.length})</CardTitle>
                  </div>
                  {chefOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>
              {!chefOpen ? null : (
                <CardContent className="pt-2 pb-2 space-y-1">
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
                </CardContent>
              )}
            </Card>

            {/* Section Technicien */}
            <Card className="border-cyan-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-cyan-900/40 transition-colors py-2 px-4 bg-cyan-900/20"
                onClick={() => setTechOpen(!techOpen)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center">
                      <Users className="w-3 h-3 text-cyan-400" />
                    </div>
                    <CardTitle className="text-cyan-300 text-sm">Technicien ({selectedTechs.length}/{techs.length})</CardTitle>
                  </div>
                  {techOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>
              {!techOpen ? null : (
                <CardContent className="pt-2 pb-2 space-y-1">
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
                </CardContent>
              )}
            </Card>

            {/* Section Véhicules */}
            <Card className="border-purple-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-purple-900/40 transition-colors py-2 px-4 bg-purple-900/20"
                onClick={() => setVehiculeOpen(!vehiculeOpen)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center">
                      <Truck className="w-3 h-3 text-purple-400" />
                    </div>
                    <CardTitle className="text-purple-300 text-sm">Véhicules ({selectedVehicules.length}/{availableVehicules.length})</CardTitle>
                  </div>
                  {vehiculeOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>
              {!vehiculeOpen ? null : (
                <CardContent className="pt-2 pb-2 space-y-1">
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
                </CardContent>
              )}
            </Card>

            {/* Section Équipements */}
            <Card className="border-orange-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-orange-900/40 transition-colors py-2 px-4 bg-orange-900/20"
                onClick={() => setEquipementOpen(!equipementOpen)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500/30 flex items-center justify-center">
                      <Wrench className="w-3 h-3 text-orange-400" />
                    </div>
                    <CardTitle className="text-orange-300 text-sm">Équipements ({selectedEquipements.length}/{availableEquipements.length})</CardTitle>
                  </div>
                  {equipementOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>
              {!equipementOpen ? null : (
                <CardContent className="pt-2 pb-2 space-y-1">
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
                </CardContent>
              )}
            </Card>
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