import React from "react";
import { Button } from "@/components/ui/button";

export default function TerrainVerificationCard({ card, onUpdateDossier }) {
  const handleTerrainRequis = () => {
    const updatedMandats = card.dossier.mandats.map((m, idx) => {
      if (idx === card.mandatIndex) {
        // Mettre à jour seulement le terrain spécifique dans terrains_list
        let updatedTerrainsList = [...(m.terrains_list || [])];
        if (updatedTerrainsList[card.terrainIndex]) {
          updatedTerrainsList[card.terrainIndex] = {
            ...updatedTerrainsList[card.terrainIndex],
            statut_terrain: "a_ceduler"
          };
        }
        return { ...m, terrains_list: updatedTerrainsList };
      }
      return m;
    });
    onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
  };

  const handleAnnuler = () => {
    const updatedMandats = card.dossier.mandats.map((m, idx) => {
      if (idx === card.mandatIndex) {
        // Mettre à jour seulement le terrain spécifique dans terrains_list
        let updatedTerrainsList = [...(m.terrains_list || [])];
        if (updatedTerrainsList[card.terrainIndex]) {
          updatedTerrainsList[card.terrainIndex] = {
            ...updatedTerrainsList[card.terrainIndex],
            statut_terrain: "pas_de_terrain"
          };
        }
        return { ...m, terrains_list: updatedTerrainsList };
      }
      return m;
    });
    onUpdateDossier(card.dossier.id, { ...card.dossier, mandats: updatedMandats });
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button
        size="sm"
        onClick={handleTerrainRequis}
        className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs h-7"
      >
        Terrain requis
      </Button>
      <Button
        size="sm"
        onClick={handleAnnuler}
        className="flex-1 bg-slate-600/20 hover:bg-slate-600/30 text-slate-400 text-xs h-7"
      >
        Annuler
      </Button>
    </div>
  );
}