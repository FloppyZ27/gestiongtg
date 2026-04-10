import React from "react";
import { Label } from "@/components/ui/label";

export default function PlaceAffaireSelect({ value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Place d'affaire</Label>
      <div className="flex gap-2">
        {["Alma", "Saguenay"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 h-7 rounded-md text-sm font-medium transition-all ${
              value === option
                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50"
                : "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}