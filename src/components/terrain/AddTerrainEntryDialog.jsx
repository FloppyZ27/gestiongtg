import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search, X, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-", "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const EMPTY_FORM = {
  date_limite_leve: "", instruments_requis: "", a_rendez_vous: false,
  date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "",
  dossier_simultane: "", temps_prevu: "", notes: "", a_dossier_simultane: false,
  statut_terrain: "a_ceduler",
};

export default function AddTerrainEntryDialog({ open, onOpenChange, dossiers, clients, users, onSave }) {
  const [search, setSearch] = useState("");
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedMandat, setSelectedMandat] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const getClientsNames = (ids) => {
    if (!ids?.length) return "";
    return ids.map(id => { const c = clients.find(c => c.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(n => n).join(", ");
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const s = search.toLowerCase();
    return dossiers.filter(d => {
      const num = getArpenteurInitials(d.arpenteur_geometre) + d.numero_dossier;
      const clients = getClientsNames(d.clients_ids);
      return num.toLowerCase().includes(s) || (d.numero_dossier || "").toLowerCase().includes(s) || clients.toLowerCase().includes(s);
    }).slice(0, 10);
  }, [search, dossiers, clients]);

  const handleSelectDossier = (dossier) => {
    setSelectedDossier(dossier);
    const firstMandat = dossier.mandats?.[0] || null;
    setSelectedMandat(firstMandat);
    setSearch("");
    setForm({ ...EMPTY_FORM, technicien: firstMandat?.terrain?.technicien || "", donneur: firstMandat?.terrain?.donneur || "" });
  };

  const handleReset = () => {
    setSelectedDossier(null);
    setSelectedMandat(null);
    setSearch("");
    setForm(EMPTY_FORM);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!selectedDossier || !selectedMandat) return;
    onSave(selectedDossier, selectedMandat, form);
    handleClose();
  };

  const mandatsDisponibles = selectedDossier?.mandats || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle entrée terrain</DialogTitle>
        </DialogHeader>

        {/* Étape 1 : Sélection du dossier */}
        {!selectedDossier ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                autoFocus
                placeholder="Rechercher un dossier (numéro, client...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {filtered.length > 0 && (
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {filtered.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectDossier(d)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/70 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className={`${getArpenteurColor(d.arpenteur_geometre)} border flex-shrink-0 text-xs`}>
                        {getArpenteurInitials(d.arpenteur_geometre)}{d.numero_dossier}
                      </Badge>
                      <span className="text-white text-sm truncate">{getClientsNames(d.clients_ids)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {search.trim() && filtered.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">Aucun dossier trouvé</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dossier sélectionné */}
            <div className="flex items-center justify-between bg-slate-800/60 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${getArpenteurColor(selectedDossier.arpenteur_geometre)} border text-xs`}>
                  {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier}
                </Badge>
                <span className="text-white text-sm">{getClientsNames(selectedDossier.clients_ids)}</span>
              </div>
              <button onClick={handleReset} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sélection du mandat si plusieurs */}
            {mandatsDisponibles.length > 1 && (
              <div className="space-y-1">
                <Label className="text-xs">Mandat</Label>
                <Select
                  value={selectedMandat ? String(mandatsDisponibles.indexOf(selectedMandat)) : ""}
                  onValueChange={v => setSelectedMandat(mandatsDisponibles[parseInt(v)])}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner un mandat" />
                  </SelectTrigger>
                  <SelectContent>
                    {mandatsDisponibles.map((m, i) => (
                      <SelectItem key={i} value={String(i)}>{m.type_mandat || `Mandat ${i + 1}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Statut terrain */}
            <div className="space-y-1">
              <Label className="text-xs">Statut terrain</Label>
              <Select value={form.statut_terrain} onValueChange={v => setForm({ ...form, statut_terrain: v })}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_verification">En vérification</SelectItem>
                  <SelectItem value="a_ceduler">À cédule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Formulaire terrain */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Date limite cédule</Label>
                <Input type="date" value={form.date_limite_leve} onChange={e => setForm({ ...form, date_limite_leve: e.target.value })} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Instruments requis</Label>
                <Select value={form.instruments_requis} onValueChange={v => setForm({ ...form, instruments_requis: v })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {["Can-Net","RTK","CONV","3 GPS","Chaine","SX10","NAVIS","Drône"].map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Donneur</Label>
                <Select value={form.donneur} onValueChange={v => setForm({ ...form, donneur: v })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map(u => (
                      <SelectItem key={u.email} value={u.full_name}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Technicien</Label>
                <Select value={form.technicien} onValueChange={v => setForm({ ...form, technicien: v })}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {(users || []).map(u => (
                      <SelectItem key={u.email} value={u.full_name}>{u.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Temps prévu</Label>
              <Input placeholder="Ex: 2h30" value={form.temps_prevu} onChange={e => setForm({ ...form, temps_prevu: e.target.value })} className="text-sm" />
            </div>

            {/* Rendez-vous */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, a_rendez_vous: !form.a_rendez_vous })}
                  className={`relative w-10 h-5 rounded-full transition-all shadow-lg ${form.a_rendez_vous ? "bg-gradient-to-r from-cyan-400 to-blue-500" : "bg-gradient-to-r from-slate-500 to-slate-600"}`}
                >
                  <motion.div
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                    animate={{ x: form.a_rendez_vous ? 18 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                </button>
                <Label className="text-xs">Rendez-vous requis</Label>
              </div>
              {form.a_rendez_vous && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Date RDV</Label>
                    <Input type="date" value={form.date_rendez_vous} onChange={e => setForm({ ...form, date_rendez_vous: e.target.value })} className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Heure RDV</Label>
                    <Input type="time" value={form.heure_rendez_vous} onChange={e => setForm({ ...form, heure_rendez_vous: e.target.value })} className="text-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Dossier simultané */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.a_dossier_simultane}
                  onCheckedChange={checked => setForm({ ...form, a_dossier_simultane: checked })}
                />
                <Label className="text-xs">Dossier à faire en même temps</Label>
              </div>
              {form.a_dossier_simultane && (
                <div className="space-y-1 pl-6">
                  <Label className="text-xs">Dossier simultané</Label>
                  <Select value={form.dossier_simultane} onValueChange={v => setForm({ ...form, dossier_simultane: v })}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {dossiers.filter(d => d.id !== selectedDossier?.id).map(d => (
                        <SelectItem key={d.id} value={d.numero_dossier}>
                          {getArpenteurInitials(d.arpenteur_geometre)}{d.numero_dossier}
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
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="text-sm resize-none h-20"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button onClick={handleSave} disabled={!selectedMandat} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                Enregistrer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}