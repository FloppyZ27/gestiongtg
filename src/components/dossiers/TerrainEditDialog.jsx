import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function TerrainEditDialog({
  open,
  onOpenChange,
  editingTerrainInfo,
  terrainForm,
  setTerrainForm,
  formData,
  users,
  allDossiers,
  getClientsNames,
  onSave
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le terrain</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Date limite cédule</Label>
              <Input
                type="date"
                value={terrainForm.date_limite_leve || ""}
                onChange={(e) => setTerrainForm({ ...terrainForm, date_limite_leve: e.target.value })}
                className="text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Instruments requis</Label>
              <Select value={terrainForm.instruments_requis || ""} onValueChange={(value) => setTerrainForm({ ...terrainForm, instruments_requis: value })}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Can-Net">Can-Net</SelectItem>
                  <SelectItem value="RTK">RTK</SelectItem>
                  <SelectItem value="CONV">CONV</SelectItem>
                  <SelectItem value="3 GPS">3 GPS</SelectItem>
                  <SelectItem value="Chaine">Chaine</SelectItem>
                  <SelectItem value="SX10">SX10</SelectItem>
                  <SelectItem value="NAVIS">NAVIS</SelectItem>
                  <SelectItem value="Drône">Drône</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Donneur</Label>
              <Select value={terrainForm.donneur || ""} onValueChange={(value) => setTerrainForm({ ...terrainForm, donneur: value })}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map((u) => (
                    <SelectItem key={u?.email} value={u?.full_name}>{u?.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Technicien</Label>
              <Select value={terrainForm.technicien || ""} onValueChange={(value) => setTerrainForm({ ...terrainForm, technicien: value })}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {(users || []).map((u) => (
                    <SelectItem key={u?.email} value={u?.full_name}>{u?.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Temps prévu</Label>
            <Input
              placeholder="Ex: 2h30"
              value={terrainForm.temps_prevu || ""}
              onChange={(e) => setTerrainForm({ ...terrainForm, temps_prevu: e.target.value })}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Rendez-vous requis</Label>
            <Button
              type="button"
              onClick={() => setTerrainForm({ ...terrainForm, a_rendez_vous: !terrainForm.a_rendez_vous })}
              className={`w-full text-sm font-medium transition-all ${
                terrainForm.a_rendez_vous
                  ? "bg-cyan-500 hover:bg-cyan-600 text-white"
                  : "bg-slate-600 hover:bg-slate-500 text-slate-200"
              }`}
            >
              {terrainForm.a_rendez_vous ? "✓ Rendez-vous requis" : "Rendez-vous requis"}
            </Button>
            {terrainForm.a_rendez_vous && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div className="space-y-1">
                  <Label className="text-xs">Date RDV</Label>
                  <Input
                    type="date"
                    value={terrainForm.date_rendez_vous || ""}
                    onChange={(e) => setTerrainForm({ ...terrainForm, date_rendez_vous: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Heure RDV</Label>
                  <Input
                    type="time"
                    value={terrainForm.heure_rendez_vous || ""}
                    onChange={(e) => setTerrainForm({ ...terrainForm, heure_rendez_vous: e.target.value })}
                    className="text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={terrainForm.a_dossier_simultane || false}
                onCheckedChange={(checked) => setTerrainForm({ ...terrainForm, a_dossier_simultane: checked })}
              />
              <Label className="text-xs">Dossier à faire en même temps</Label>
            </div>
            {terrainForm.a_dossier_simultane && (
              <div className="space-y-1 pl-6">
                <Label className="text-xs">Dossier simultané</Label>
                <Select value={terrainForm.dossier_simultane || ""} onValueChange={(value) => setTerrainForm({ ...terrainForm, dossier_simultane: value })}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allDossiers || []).map((d) => (
                      <SelectItem key={d.id} value={d.numero_dossier}>
                        {d.numero_dossier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea
              placeholder="Notes additionnelles..."
              value={terrainForm.notes || ""}
              onChange={(e) => setTerrainForm({ ...terrainForm, notes: e.target.value })}
              className="text-sm resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={onSave} className="bg-emerald-500 hover:bg-emerald-600">
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}