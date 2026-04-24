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
  equipements,
  equipes = {},
  placeAffaire
}) {
  const [selectedChefs, setSelectedChefs] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [selectedVehicules, setSelectedVehicules] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);
  const [chefOpen, setChefOpen] = useState(true);
  const [techOpen, setTechOpen] = useState(true);
  const [vehiculeOpen, setVehiculeOpen] = useState(false);
  const [equipementOpen, setEquipementOpen] = useState(false);

  // Filtrer les utilisateurs par rôle (simplement: admin = chef, user = technicien)
  const chefs = users?.filter(u => u.role === "admin") || [];
  const techs = users?.filter(u => u.role === "user") || [];

  const availableVehicules = vehicules || [];
  const availableEquipements = equipements || [];

  // Vérifier les éléments déjà utilisés dans les équipes du jour
  const dayEquipes = equipes[dateStr] || [];
  const usedTechIds = new Set();
  const usedVehiculeIds = new Set();
  const usedEquipementIds = new Set();

  dayEquipes.forEach(equipe => {
    equipe.techniciens?.forEach(id => usedTechIds.add(id));
    equipe.vehicules?.forEach(id => usedVehiculeIds.add(id));
    equipe.equipements?.forEach(id => usedEquipementIds.add(id));
  });

  const isChefUsed = (chefId) => usedTechIds.has(chefId);
  const isTechUsed = (techId) => usedTechIds.has(techId);
  const isVehiculeUsed = (vehId) => usedVehiculeIds.has(vehId);
  const isEquipementUsed = (eqId) => usedEquipementIds.has(eqId);

  const getEquipeNameForElement = (elementId, type) => {
    for (const equipe of dayEquipes) {
      if (type === 'tech' && equipe.techniciens?.includes(elementId)) {
        return equipe.nom;
      }
      if (type === 'vehicule' && equipe.vehicules?.includes(elementId)) {
        return equipe.nom;
      }
      if (type === 'equipement' && equipe.equipements?.includes(elementId)) {
        return equipe.nom;
      }
    }
    return null;
  };

  const isChefWrongPlace = (chef) => chef.place_affaire && chef.place_affaire !== placeAffaire;
  const isTechWrongPlace = (tech) => tech.place_affaire && tech.place_affaire !== placeAffaire;

  const handleCreateTeam = () => {
    // Validation : au moins un chef doit être sélectionné
    if (selectedChefs.length === 0) {
      alert("Vous devez sélectionner au moins un technicien chef pour créer une équipe.");
      return;
    }

    const allTechIds = [...selectedChefs, ...selectedTechs];
    
    // Générer initiales des chefs (première lettre du prénom + première lettre du nom de famille)
    const chefInitials = selectedChefs.map(id => {
      const u = users?.find(u => u.id === id);
      if (!u) return '';
      const parts = u.full_name.split(' ');
      return (parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
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
                    chefs.map(chef => {
                      const isSelected = selectedChefs.includes(chef.id);
                      const isUsed = isChefUsed(chef.id);
                      const isWrongPlace = isChefWrongPlace(chef);
                      const equipeNom = isUsed ? getEquipeNameForElement(chef.id, 'tech') : null;
                      return (
                        <div key={chef.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${isWrongPlace || isUsed ? 'opacity-50 bg-slate-600/30' : isSelected ? 'bg-blue-500/40 border border-blue-400 ring-1 ring-blue-400' : 'hover:bg-blue-500/20 bg-slate-700/20'}`}>
                          <Checkbox
                            id={`chef-${chef.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleUser(chef.id, "chefs")}
                            disabled={isUsed || isWrongPlace}
                            className="border-blue-400"
                          />
                          <Label htmlFor={`chef-${chef.id}`} className={`flex-1 cursor-pointer font-medium ${isWrongPlace || isUsed ? 'text-slate-400' : isSelected ? 'text-blue-100' : 'text-slate-200'}`}>
                             {chef.prenom} {chef.nom} {equipeNom && <span className="text-slate-500">({equipeNom})</span>}{isWrongPlace && <span className="text-slate-500"> ({chef.place_affaire})</span>}
                           </Label>
                        </div>
                      );
                    })
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
                    techs.map(tech => {
                      const isSelected = selectedTechs.includes(tech.id);
                      const isUsed = isTechUsed(tech.id);
                      const isWrongPlace = isTechWrongPlace(tech);
                      const equipeNom = isUsed ? getEquipeNameForElement(tech.id, 'tech') : null;
                      return (
                        <div key={tech.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${isWrongPlace || isUsed ? 'opacity-50 bg-slate-600/30' : isSelected ? 'bg-cyan-500/40 border border-cyan-400 ring-1 ring-cyan-400' : 'hover:bg-cyan-500/20 bg-slate-700/20'}`}>
                          <Checkbox
                            id={`tech-${tech.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleUser(tech.id, "techs")}
                            disabled={isUsed || isWrongPlace}
                            className="border-cyan-400"
                          />
                          <Label htmlFor={`tech-${tech.id}`} className={`flex-1 cursor-pointer font-medium ${isWrongPlace || isUsed ? 'text-slate-400' : isSelected ? 'text-cyan-100' : 'text-slate-200'}`}>
                             {tech.prenom} {tech.nom} {equipeNom && <span className="text-slate-500">({equipeNom})</span>}{isWrongPlace && <span className="text-slate-500"> ({tech.place_affaire})</span>}
                           </Label>
                        </div>
                      );
                    })
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
                    availableVehicules.map(veh => {
                      const isSelected = selectedVehicules.includes(veh.id);
                      const isUsed = isVehiculeUsed(veh.id);
                      const equipeNom = isUsed ? getEquipeNameForElement(veh.id, 'vehicule') : null;
                      return (
                        <div key={veh.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${isUsed ? 'opacity-50 bg-slate-600/30' : isSelected ? 'bg-purple-500/40 border border-purple-400 ring-1 ring-purple-400' : 'hover:bg-purple-500/20 bg-slate-700/20'}`}>
                          <Checkbox
                            id={`veh-${veh.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleVehicule(veh.id)}
                            disabled={isUsed}
                            className="border-purple-400"
                          />
                          <Label htmlFor={`veh-${veh.id}`} className={`flex-1 cursor-pointer font-medium ${isUsed ? 'text-slate-400' : isSelected ? 'text-purple-100' : 'text-slate-200'}`}>
                            {veh.nom} {equipeNom && <span className="text-slate-500">({equipeNom})</span>}
                          </Label>
                        </div>
                      );
                    })
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
                    availableEquipements.map(eq => {
                      const isSelected = selectedEquipements.includes(eq.id);
                      const isUsed = isEquipementUsed(eq.id);
                      const equipeNom = isUsed ? getEquipeNameForElement(eq.id, 'equipement') : null;
                      return (
                        <div key={eq.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${isUsed ? 'opacity-50 bg-slate-600/30' : isSelected ? 'bg-orange-500/40 border border-orange-400 ring-1 ring-orange-400' : 'hover:bg-orange-500/20 bg-slate-700/20'}`}>
                          <Checkbox
                            id={`eq-${eq.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleEquipement(eq.id)}
                            disabled={isUsed}
                            className="border-orange-400"
                          />
                          <Label htmlFor={`eq-${eq.id}`} className={`flex-1 cursor-pointer font-medium ${isUsed ? 'text-slate-400' : isSelected ? 'text-orange-100' : 'text-slate-200'}`}>
                            {eq.nom} {equipeNom && <span className="text-slate-500">({equipeNom})</span>}
                          </Label>
                        </div>
                      );
                    })
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