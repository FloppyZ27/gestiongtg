import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Truck, Wrench, X, ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [borrowedTechs, setBorrowedTechs] = useState([]); // techniciens empruntés d'une autre place
  const [selectedVehicules, setSelectedVehicules] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);
  const [chefOpen, setChefOpen] = useState(true);
  const [techOpen, setTechOpen] = useState(true);
  const [vehiculeOpen, setVehiculeOpen] = useState(false);
  const [equipementOpen, setEquipementOpen] = useState(false);

  // Filtrer par poste terrain
  const chefs = users?.filter(u => u.poste === "Technicien Terrain (Chef)") || [];
  const techs = users?.filter(u => u.poste === "Technicien Terrain") || [];

  const availableVehicules = vehicules || [];
  const availableEquipements = equipements || [];

  // Reproduire la logique de generateTeamDisplayName du PlanningCalendar
  const getDisplayName = (equipe, positionIndex) => {
    const numStr = String(positionIndex + 1);
    if (!equipe.techniciens || equipe.techniciens.length === 0) return `Équipe ${numStr}`;
    const getInitialsWithHyphens = (text) => text.split('-').map(p => p[0]?.toUpperCase()).join('');
    const initials = equipe.techniciens.map(id => {
      const u = users?.find(u => u.id === id);
      if (!u) return '';
      return getInitialsWithHyphens(u.prenom || '') + getInitialsWithHyphens(u.nom || '');
    }).filter(n => n).join('-');
    return `Équipe ${numStr} - ${initials}`;
  };

  // Vérifier les éléments déjà utilisés dans les équipes du jour (TOUTES places confondues)
  const dayEquipes = equipes[dateStr] || [];
  const usedTechIds = new Set();
  const usedVehiculeIds = new Set();
  const usedEquipementIds = new Set();

  dayEquipes.forEach(equipe => {
    equipe.techniciens?.forEach(id => usedTechIds.add(id));
    equipe.vehicules?.forEach(id => usedVehiculeIds.add(id));
    equipe.equipements?.forEach(id => usedEquipementIds.add(id));
  });

  // Un technicien wrong-place est "déjà planifié" s'il est dans une équipe de son propre place ce jour-là
  const isWrongPlaceTechAlreadyPlanned = (userId) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return false;
    const userPlace = user.place_affaire?.toLowerCase();
    // Chercher dans toutes les équipes du jour appartenant à sa propre place
    return dayEquipes.some(eq =>
      eq.place_affaire?.toLowerCase() === userPlace &&
      eq.techniciens?.includes(userId)
    );
  };

  const isChefUsed = (chefId) => usedTechIds.has(chefId);
  const isTechUsed = (techId) => usedTechIds.has(techId);
  const isVehiculeUsed = (vehId) => usedVehiculeIds.has(vehId);
  const isEquipementUsed = (eqId) => usedEquipementIds.has(eqId);

  const getEquipeNameForElement = (elementId, type) => {
    for (let i = 0; i < dayEquipes.length; i++) {
      const equipe = dayEquipes[i];
      const matches =
        (type === 'tech' && equipe.techniciens?.includes(elementId)) ||
        (type === 'vehicule' && equipe.vehicules?.includes(elementId)) ||
        (type === 'equipement' && equipe.equipements?.includes(elementId));
      if (matches) {
        // Calculer le numéro de position dans la place d'affaire de cette équipe
        const equipePlace = equipe.place_affaire || '';
        const equipesDeMemePlage = dayEquipes.filter(e => (e.place_affaire || '') === equipePlace);
        const posIdx = equipesDeMemePlage.findIndex(e => e.id === equipe.id);
        const displayName = getDisplayName(equipe, posIdx >= 0 ? posIdx : i);
        // Si l'équipe est d'une autre place que celle affichée, ajouter la place
        const isDifferentPlace = placeAffaire && equipePlace.toLowerCase() !== placeAffaire.toLowerCase();
        const placeFormatted = equipePlace ? equipePlace.charAt(0).toUpperCase() + equipePlace.slice(1) : equipePlace;
        return { name: displayName, place: isDifferentPlace ? placeFormatted : null };
      }
    }
    return null;
  };

  // Un utilisateur est "wrong place" si placeAffaire est défini ET que sa place ne correspond pas (comparaison insensible à la casse)
  const isChefWrongPlace = (chef) => placeAffaire ? chef.place_affaire?.toLowerCase() !== placeAffaire.toLowerCase() : false;
  const isTechWrongPlace = (tech) => placeAffaire ? tech.place_affaire?.toLowerCase() !== placeAffaire.toLowerCase() : false;

  // Compter les chefs et techs disponibles (même place ou pas de place définie, et non assignés)
  const availableChefs = chefs.filter(c => !isChefUsed(c.id) && !isChefWrongPlace(c)).length;
  const availableTechs = techs.filter(t => !isTechUsed(t.id) && !isTechWrongPlace(t)).length;
  const totalChefs = chefs.filter(c => !isChefWrongPlace(c)).length;
  const totalTechs = techs.filter(t => !isTechWrongPlace(t)).length;

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

  const toggleBorrow = (userId, type) => {
    const isBorrowed = borrowedTechs.includes(userId);
    if (isBorrowed) {
      // Retirer de l'emprunt et de la sélection
      setBorrowedTechs(prev => prev.filter(id => id !== userId));
      if (type === "chefs") setSelectedChefs(prev => prev.filter(id => id !== userId));
      else setSelectedTechs(prev => prev.filter(id => id !== userId));
    } else {
      // Ajouter à l'emprunt et à la sélection
      setBorrowedTechs(prev => [...prev, userId]);
      if (type === "chefs") setSelectedChefs(prev => prev.includes(userId) ? prev : [...prev, userId]);
      else setSelectedTechs(prev => prev.includes(userId) ? prev : [...prev, userId]);
    }
  };

  const resetForm = () => {
    setSelectedChefs([]);
    setSelectedTechs([]);
    setSelectedVehicules([]);
    setSelectedEquipements([]);
    setBorrowedTechs([]);
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
      <DialogContent hideClose className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
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
                    <CardTitle className="text-blue-300 text-sm">Chef ({availableChefs}/{totalChefs})</CardTitle>
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
                      const isBorrowed = borrowedTechs.includes(chef.id);
                      const alreadyPlanned = isWrongPlace && isWrongPlaceTechAlreadyPlanned(chef.id);
                      const equipeInfo = isUsed ? getEquipeNameForElement(chef.id, 'tech') : null;
                      return (
                        <div key={chef.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${
                          isUsed ? 'opacity-50 bg-slate-600/30' :
                          isWrongPlace && !isBorrowed ? 'opacity-60 bg-slate-600/20' :
                          isBorrowed ? 'bg-amber-500/20 border border-amber-500/50' :
                          isSelected ? 'bg-blue-500/40 border border-blue-400 ring-1 ring-blue-400' :
                          'hover:bg-blue-500/20 bg-slate-700/20'
                        }`}>
                          <Checkbox
                            id={`chef-${chef.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleUser(chef.id, "chefs")}
                            disabled={isUsed || (isWrongPlace && !isBorrowed)}
                            className="border-blue-400"
                          />
                          <Label htmlFor={`chef-${chef.id}`} className={`flex-1 font-medium flex items-center gap-1.5 flex-wrap ${
                            isUsed ? 'text-slate-400 cursor-default' :
                            isWrongPlace && !isBorrowed ? 'text-slate-400 cursor-default' :
                            isBorrowed ? 'text-amber-200 cursor-pointer' :
                            isSelected ? 'text-blue-100 cursor-pointer' :
                            'text-slate-200 cursor-pointer'
                          }`}>
                            {chef.prenom} {chef.nom}
                            {equipeInfo && (
                              <Badge className="bg-blue-600/70 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">
                                {equipeInfo.name}{equipeInfo.place ? ` (${equipeInfo.place})` : ''}
                              </Badge>
                            )}
                            {isWrongPlace && <span className="text-slate-400 text-[10px]">({chef.place_affaire})</span>}
                            {isBorrowed && <span className="text-amber-400 text-[10px]">— Emprunté</span>}
                          </Label>
                          {isWrongPlace && !isUsed && (
                            alreadyPlanned ? (
                              <span className="text-red-400 text-[10px] italic">Déjà planifié</span>
                            ) : (
                              <button
                                onClick={() => toggleBorrow(chef.id, "chefs")}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                  isBorrowed
                                    ? 'bg-amber-500/30 text-amber-300 hover:bg-red-500/20 hover:text-red-300'
                                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/40'
                                }`}
                              >
                                <ArrowLeftRight className="w-2.5 h-2.5" />
                                {isBorrowed ? 'Annuler' : 'Emprunter'}
                              </button>
                            )
                          )}
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
                    <CardTitle className="text-cyan-300 text-sm">Technicien ({availableTechs}/{totalTechs})</CardTitle>
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
                      const isBorrowed = borrowedTechs.includes(tech.id);
                      const alreadyPlanned = isWrongPlace && isWrongPlaceTechAlreadyPlanned(tech.id);
                      const equipeInfo = isUsed ? getEquipeNameForElement(tech.id, 'tech') : null;
                      return (
                        <div key={tech.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${
                          isUsed ? 'opacity-50 bg-slate-600/30' :
                          isWrongPlace && !isBorrowed ? 'opacity-60 bg-slate-600/20' :
                          isBorrowed ? 'bg-amber-500/20 border border-amber-500/50' :
                          isSelected ? 'bg-cyan-500/40 border border-cyan-400 ring-1 ring-cyan-400' :
                          'hover:bg-cyan-500/20 bg-slate-700/20'
                        }`}>
                          <Checkbox
                            id={`tech-${tech.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleUser(tech.id, "techs")}
                            disabled={isUsed || (isWrongPlace && !isBorrowed)}
                            className="border-cyan-400"
                          />
                          <Label htmlFor={`tech-${tech.id}`} className={`flex-1 font-medium flex items-center gap-1.5 flex-wrap ${
                            isUsed ? 'text-slate-400 cursor-default' :
                            isWrongPlace && !isBorrowed ? 'text-slate-400 cursor-default' :
                            isBorrowed ? 'text-amber-200 cursor-pointer' :
                            isSelected ? 'text-cyan-100 cursor-pointer' :
                            'text-slate-200 cursor-pointer'
                          }`}>
                            {tech.prenom} {tech.nom}
                            {equipeInfo && (
                              <Badge className="bg-blue-600/70 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">
                                {equipeInfo.name}{equipeInfo.place ? ` (${equipeInfo.place})` : ''}
                              </Badge>
                            )}
                            {isWrongPlace && <span className="text-slate-400 text-[10px]">({tech.place_affaire})</span>}
                            {isBorrowed && <span className="text-amber-400 text-[10px]">— Emprunté</span>}
                          </Label>
                          {isWrongPlace && !isUsed && (
                            alreadyPlanned ? (
                              <span className="text-red-400 text-[10px] italic">Déjà planifié</span>
                            ) : (
                              <button
                                onClick={() => toggleBorrow(tech.id, "techs")}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                                  isBorrowed
                                    ? 'bg-amber-500/30 text-amber-300 hover:bg-red-500/20 hover:text-red-300'
                                    : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/40'
                                }`}
                              >
                                <ArrowLeftRight className="w-2.5 h-2.5" />
                                {isBorrowed ? 'Annuler' : 'Emprunter'}
                              </button>
                            )
                          )}
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
                    <CardTitle className="text-purple-300 text-sm">Véhicules ({availableVehicules.filter(v => !isVehiculeUsed(v.id)).length}/{availableVehicules.length})</CardTitle>
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
                      const equipeInfo = isUsed ? getEquipeNameForElement(veh.id, 'vehicule') : null;
                      return (
                        <div key={veh.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${isUsed ? 'opacity-50 bg-slate-600/30' : isSelected ? 'bg-purple-500/40 border border-purple-400 ring-1 ring-purple-400' : 'hover:bg-purple-500/20 bg-slate-700/20'}`}>
                          <Checkbox
                            id={`veh-${veh.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleVehicule(veh.id)}
                            disabled={isUsed}
                            className="border-purple-400"
                          />
                          <Label htmlFor={`veh-${veh.id}`} className={`flex-1 cursor-pointer font-medium flex items-center gap-1.5 ${isUsed ? 'text-slate-400' : isSelected ? 'text-purple-100' : 'text-slate-200'}`}>
                            {veh.nom} {equipeInfo && <Badge className="bg-blue-600/70 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">{equipeInfo.name}{equipeInfo.place ? ` (${equipeInfo.place})` : ''}</Badge>}
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
                    <CardTitle className="text-orange-300 text-sm">Équipements ({availableEquipements.filter(e => !isEquipementUsed(e.id)).length}/{availableEquipements.length})</CardTitle>
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
                      const equipeInfo = isUsed ? getEquipeNameForElement(eq.id, 'equipement') : null;
                      return (
                        <div key={eq.id} className={`flex items-center gap-2 p-1.5 rounded text-xs transition-all ${isUsed ? 'opacity-50 bg-slate-600/30' : isSelected ? 'bg-orange-500/40 border border-orange-400 ring-1 ring-orange-400' : 'hover:bg-orange-500/20 bg-slate-700/20'}`}>
                          <Checkbox
                            id={`eq-${eq.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleEquipement(eq.id)}
                            disabled={isUsed}
                            className="border-orange-400"
                          />
                          <Label htmlFor={`eq-${eq.id}`} className={`flex-1 cursor-pointer font-medium flex items-center gap-1.5 ${isUsed ? 'text-slate-400' : isSelected ? 'text-orange-100' : 'text-slate-200'}`}>
                            {eq.nom} {equipeInfo && <Badge className="bg-blue-600/70 text-white text-[10px] px-1.5 py-0 h-4 font-semibold">{equipeInfo.name}{equipeInfo.place ? ` (${equipeInfo.place})` : ''}</Badge>}
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

        <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            className="border-red-500 text-red-400 hover:bg-red-500/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreateTeam}
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            Créer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}