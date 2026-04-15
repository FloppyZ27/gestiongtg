import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssignedUserSection({ users, editingDossier, initialValue, onChangeUser }) {
  const [value, setValue] = useState(initialValue || "");

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  if (editingDossier) return null;

  return (
    <div className="space-y-1 mb-3">
      <Label className="text-slate-400 text-xs">Utilisateur assigné <span className="text-red-400">*</span></Label>
      <Select value={value} onValueChange={(v) => { setValue(v); onChangeUser(v); }}>
        <SelectTrigger className={`bg-slate-700 border-slate-600 text-white h-7 text-sm ${!value ? 'border-red-500' : ''}`}>
          <SelectValue placeholder="Sélectionner" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {(users || []).map((u) => (
            <SelectItem key={u?.email} value={u?.email} className="text-white text-sm">{u?.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}