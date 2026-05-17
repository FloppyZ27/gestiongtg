import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-", "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

export default function TerrainEditDialog({
  open,
  onOpenChange,
  terrainForm,
  setTerrainForm,
  formData,
  users,
  allDossiers,
  getClientsNames,
  onSave
}) {
  const [searchSimultane, setSearchSimultane] = useState("");
  const [showSimultaneDropdown, setShowSimultaneDropdown] = useState(false);

  const dossiersSimultaneFiltered = (allDossiers || [])
    .filter(d => d.id !== formData?.id)
    .filter(d => {
      if (!searchSimultane) return true;
      const s = searchSimultane.toLowerCase();
      const num = getArpenteurInitials(d.arpenteur_geometre) + d.numero_dossier;
      const cn = getClientsNames ? getClientsNames(d.clients_ids) : "";
      return num.toLowerCase().includes(s) || cn.toLowerCase().includes(s);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>Modifier les informations terrain</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ligne 1 : Temps prévu | Donneur | Instruments | Technicien */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Temps prévu</Label>
              <Input
                placeholder="Ex: 2h30"
                value={terrainForm.temps_prevu || ""}
                onChange={e => setTerrainForm({ ...terrainForm, temps_prevu: e.target.value })}
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Donneur</Label>
              <Select value={terrainForm.donneur || ""} onValueChange={v => setTerrainForm({ ...terrainForm, donneur: v })}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map(u => (
                    <SelectItem key={u.email} value={u.full_name}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Instruments</Label>
              <Select value={terrainForm.instruments_requis || ""} onValueChange={v => setTerrainForm({ ...terrainForm, instruments_requis: v })}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {["Can-Net","RTK","CONV","3 GPS","Chaine","SX10","NAVIS","Drône"].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Technicien</Label>
              <Select value={terrainForm.technicien || ""} onValueChange={v => setTerrainForm({ ...terrainForm, technicien: v })}>
                <SelectTrigger className="text-sm h-9"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {(users || []).map(u => (
                    <SelectItem key={u.email} value={u.full_name}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ligne 2 : Date limite cédule | Rendez-vous | Date RDV | Heure RDV */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="space-y-1">
                <Label className="text-xs">Date limite cédule</Label>
                <Input
                  type="date"
                  value={terrainForm.date_limite_leve || ""}
                  onChange={e => setTerrainForm({ ...terrainForm, date_limite_leve: e.target.value })}
                  className="text-sm h-9"
                />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <Switch
                  checked={terrainForm.a_rendez_vous || false}
                  onCheckedChange={checked => setTerrainForm({ ...terrainForm, a_rendez_vous: checked })}
                />
                <Label className="text-xs">Rendez-vous</Label>
              </div>
              {terrainForm.a_rendez_vous && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Date RDV</Label>
                    <Input
                      type="date"
                      value={terrainForm.date_rendez_vous || ""}
                      onChange={e => setTerrainForm({ ...terrainForm, date_rendez_vous: e.target.value })}
                      className="text-sm h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Heure RDV</Label>
                    <Input
                      type="time"
                      value={terrainForm.heure_rendez_vous || ""}
                      onChange={e => setTerrainForm({ ...terrainForm, heure_rendez_vous: e.target.value })}
                      className="text-sm h-9"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ligne 3 : Dossier simultané */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={terrainForm.a_dossier_simultane || false}
                onCheckedChange={checked => setTerrainForm({ ...terrainForm, a_dossier_simultane: checked, dossier_simultane: checked ? terrainForm.dossier_simultane : "" })}
              />
              <Label className="text-xs">Dossier à faire en même temps</Label>
            </div>
            {terrainForm.a_dossier_simultane && (
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <Input
                  placeholder="Rechercher un dossier..."
                  value={terrainForm.dossier_simultane ? terrainForm.dossier_simultane : searchSimultane}
                  onChange={e => {
                    setSearchSimultane(e.target.value);
                    setTerrainForm({ ...terrainForm, dossier_simultane: "" });
                    setShowSimultaneDropdown(true);
                  }}
                  onFocus={() => setShowSimultaneDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSimultaneDropdown(false), 150)}
                  className="text-sm h-9 pl-8"
                />
                {showSimultaneDropdown && !terrainForm.dossier_simultane && (
                  <div className="absolute z-50 w-full bg-popover border border-border rounded-lg shadow-2xl max-h-[220px] overflow-y-auto mt-1">
                    {dossiersSimultaneFiltered.length === 0 ? (
                      <div className="px-3 py-2 text-muted-foreground text-xs">Aucun résultat</div>
                    ) : dossiersSimultaneFiltered.map(d => {
                      const label = `${getArpenteurInitials(d.arpenteur_geometre)}${d.numero_dossier}`;
                      const cn = getClientsNames ? getClientsNames(d.clients_ids) : "";
                      return (
                        <div
                          key={d.id}
                          className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-b-0"
                          onMouseDown={() => {
                            setTerrainForm({ ...terrainForm, dossier_simultane: label });
                            setSearchSimultane("");
                            setShowSimultaneDropdown(false);
                          }}
                        >
                          <span className="text-sm font-medium">{label}</span>
                          {cn && <span className="text-xs text-muted-foreground ml-2">{cn}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Notes additionnelles..."
              value={terrainForm.notes || ""}
              onChange={e => setTerrainForm({ ...terrainForm, notes: e.target.value })}
              className="text-sm resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="button" onClick={onSave} className="bg-emerald-500 hover:bg-emerald-600">Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}