import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlaceAffaireSelect({ value, onChange }) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-400 text-xs">Place d'affaire</Label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
          <SelectValue placeholder={value || "Sélectionner"} />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="Alma" className="text-white text-sm">Alma</SelectItem>
          <SelectItem value="Saguenay" className="text-white text-sm">Saguenay</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}