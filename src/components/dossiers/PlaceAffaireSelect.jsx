import React from "react";
import { Label } from "@/components/ui/label";

export default function PlaceAffaireSelect({ value, onChange, dossierKey }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Place d'affaire</Label>
      <select
        key={`place-affaire-${dossierKey}-${value}`}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-7 w-full rounded-md bg-slate-700 border-0 text-white text-sm px-3 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">Sélectionner</option>
        <option value="Alma">Alma</option>
        <option value="Saguenay">Saguenay</option>
      </select>
    </div>
  );
}