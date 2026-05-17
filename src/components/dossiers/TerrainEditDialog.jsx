import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Compass, MapPin, User, Search } from "lucide-react";

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

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL", "Description Technique": "DT",
    "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

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
  const [searchSimultane, setSearchSimultane] = useState("");
  const [showSimultaneDropdown, setShowSimultaneDropdown] = useState(false);

  const mandat = editingTerrainInfo?.mandat;
  const dossierLabel = formData
    ? `${getArpenteurInitials(formData.arpenteur_geometre)}${formData.numero_dossier}`
    : "";
  const clientsNoms = formData && getClientsNames ? getClientsNames(formData.clients_ids) : "";

  const getUserByEmail = (email) => (users || []).find(u => u.email === email);
  const getUserInitials = (email) => {
    const u = getUserByEmail(email);
    if (!u) return email?.split('@')[0]?.substring(0, 2).toUpperCase() || '?';
    return (u.full_name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const getUserNomComplet = (email) => {
    const u = getUserByEmail(email);
    return u?.full_name || email?.split('@')[0] || '';
  };

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
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-slate-900 py-5 pb-4 border-b border-slate-800 px-6">
          <h2 className="text-2xl font-bold text-white">Modifier le terrain</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">

          {/* Dossier info */}
          {formData && (
            <div className="border border-slate-700 bg-transparent rounded-lg">
              <div className="cursor-default rounded-t-lg py-2 px-3 bg-blue-900/20">
                <div className="flex items-center gap-2">
                  <h3 className="text-blue-300 text-sm font-semibold">Dossier</h3>
                  <span className="text-slate-400 text-xs ml-2">
                    {dossierLabel}{clientsNoms ? ` — ${clientsNoms}` : ""}
                    {mandat?.type_mandat && (
                      <Badge className={`ml-2 ${getMandatColor(mandat.type_mandat)} border text-xs`}>
                        {getAbbreviatedMandatType(mandat.type_mandat)}
                      </Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire terrain */}
          <div className="border-2 border-amber-500/30 rounded-lg bg-transparent">
            <div
              className="px-4 py-2.5 flex items-center gap-2.5 rounded-t-lg"
              style={{ background: 'linear-gradient(90deg, hsl(30, 30%, 12%), hsl(30, 20%, 10%))' }}
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="text-amber-400 text-sm font-semibold tracking-wide">Terrain</span>
            </div>

            <div className="p-4 border-t border-amber-500/30 space-y-3 bg-transparent">
              {/* Ligne 1 : Temps prévu | Donneur | Instruments | Technicien */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Temps prévu</Label>
                  <Input
                    placeholder="Ex: 2h30"
                    value={terrainForm.temps_prevu || ""}
                    onChange={e => setTerrainForm({ ...terrainForm, temps_prevu: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Donneur</Label>
                  <Select value={terrainForm.donneur || ""} onValueChange={v => setTerrainForm({ ...terrainForm, donneur: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {(users || []).filter(u => u?.statut === 'Actif' || !u?.statut).map(u => (
                        <SelectItem key={u.email} value={u.full_name} className="text-white text-xs">{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Instruments</Label>
                  <Select value={terrainForm.instruments_requis || ""} onValueChange={v => setTerrainForm({ ...terrainForm, instruments_requis: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {["Can-Net","RTK","CONV","3 GPS","Chaine","SX10","NAVIS","Drône"].map(v => (
                        <SelectItem key={v} value={v} className="text-white text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Technicien</Label>
                  <Select value={terrainForm.technicien || ""} onValueChange={v => setTerrainForm({ ...terrainForm, technicien: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {(users || []).map(u => (
                        <SelectItem key={u.email} value={u.full_name} className="text-white text-xs">{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ligne 2 : Date limite cédule | Toggle Rendez-vous | Date RDV | Heure RDV */}
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Date limite cédule</Label>
                  <Input
                    type="date"
                    value={terrainForm.date_limite_leve || ""}
                    onChange={e => setTerrainForm({ ...terrainForm, date_limite_leve: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                  />
                </div>
                <div className="space-y-1 flex items-end">
                  <div className="flex items-center gap-2 h-8">
                    <Switch
                      checked={terrainForm.a_rendez_vous || false}
                      onCheckedChange={checked => setTerrainForm({ ...terrainForm, a_rendez_vous: checked })}
                      style={{
                        backgroundColor: terrainForm.a_rendez_vous ? 'hsl(45, 90%, 55%)' : 'hsl(220, 10%, 30%)',
                        border: 'none', width: '36px', height: '20px', borderRadius: '9999px',
                        display: 'inline-flex', alignItems: 'center', padding: '2px',
                        cursor: 'pointer', transition: 'background-color 0.2s',
                      }}
                    />
                    <Label className="text-slate-400 text-xs">Rendez-vous</Label>
                  </div>
                </div>
                {terrainForm.a_rendez_vous && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Date RDV</Label>
                      <Input
                        type="date"
                        value={terrainForm.date_rendez_vous || ""}
                        onChange={e => setTerrainForm({ ...terrainForm, date_rendez_vous: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Heure RDV</Label>
                      <Input
                        type="time"
                        value={terrainForm.heure_rendez_vous || ""}
                        onChange={e => setTerrainForm({ ...terrainForm, heure_rendez_vous: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Ligne 3 : Dossier simultané */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-end">
                  <div className="flex items-center gap-2 h-8">
                    <Switch
                      checked={terrainForm.a_dossier_simultane || false}
                      onCheckedChange={checked => setTerrainForm({ ...terrainForm, a_dossier_simultane: checked, dossier_simultane: checked ? terrainForm.dossier_simultane : "" })}
                      style={{
                        backgroundColor: terrainForm.a_dossier_simultane ? 'hsl(45, 90%, 55%)' : 'hsl(220, 10%, 30%)',
                        border: 'none', width: '36px', height: '20px', borderRadius: '9999px',
                        display: 'inline-flex', alignItems: 'center', padding: '2px',
                        cursor: 'pointer', transition: 'background-color 0.2s',
                      }}
                    />
                    <Label className="text-slate-400 text-xs">Dossier à faire en même temps</Label>
                  </div>
                </div>
                {terrainForm.a_dossier_simultane && (
                  <div className="space-y-1 relative">
                    <Label className="text-slate-400 text-xs">Dossier simultané</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 w-3 h-3" />
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
                        className="bg-slate-700 border-slate-600 text-white h-8 text-xs pl-7"
                      />
                    </div>
                    {showSimultaneDropdown && !terrainForm.dossier_simultane && (
                      <div className="absolute z-50 w-full bg-slate-900 border-2 border-emerald-500/30 rounded-lg shadow-2xl overflow-y-auto max-h-[280px]">
                        {dossiersSimultaneFiltered.length === 0 ? (
                          <div className="px-3 py-2 text-slate-500 text-xs">Aucun résultat</div>
                        ) : dossiersSimultaneFiltered.map(d => {
                          const label = `${getArpenteurInitials(d.arpenteur_geometre)}${d.numero_dossier}`;
                          const cn = getClientsNames ? getClientsNames(d.clients_ids) : "";
                          const mandats = (d.mandats || []).filter(m => m.type_mandat);
                          return (
                            <div
                              key={d.id}
                              className="px-3 py-2.5 hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-800/70 last:border-b-0"
                              onMouseDown={() => {
                                setTerrainForm({ ...terrainForm, dossier_simultane: label });
                                setSearchSimultane("");
                                setShowSimultaneDropdown(false);
                              }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                  <Badge variant="outline" className={`${getArpenteurColor(d.arpenteur_geometre)} border flex-shrink-0`}>
                                    {label}
                                  </Badge>
                                  {cn && (
                                    <span className="text-sm text-slate-300 flex items-center gap-1">
                                      <User className="w-3 h-3 text-slate-500" />
                                      {cn}
                                    </span>
                                  )}
                                </div>
                                <Badge className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${d.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {d.statut}
                                </Badge>
                              </div>
                              {mandats.length > 0 && (
                                <div className="mt-1.5 space-y-1 pl-1">
                                  {mandats.map((m, idx) => {
                                    const adr = formatAdresse(m.adresse_travaux);
                                    return (
                                      <div key={idx} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                          <Badge className={`${getMandatColor(m.type_mandat)} border text-[10px] px-1.5 py-0`}>
                                            {getAbbreviatedMandatType(m.type_mandat)}
                                          </Badge>
                                          {m.tache_actuelle && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                                              <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-1.5 py-0">{m.tache_actuelle}</Badge>
                                            </>
                                          )}
                                          {adr && (
                                            <>
                                              <span className="w-1 h-1 rounded-full bg-slate-600" />
                                              <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{adr}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        {m.utilisateur_assigne && (() => {
                                          const u = getUserByEmail(m.utilisateur_assigne);
                                          const photoUrl = u?.photo_url || u?.profile_picture;
                                          return (
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              {photoUrl ? (
                                                <img src={photoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-600" />
                                              ) : (
                                                <div className="w-5 h-5 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-[8px] font-bold text-primary">
                                                  {getUserInitials(m.utilisateur_assigne)}
                                                </div>
                                              )}
                                              <span className="text-[10px] text-slate-300">{getUserNomComplet(m.utilisateur_assigne)}</span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
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
                <Label className="text-slate-400 text-xs">Notes</Label>
                <Textarea
                  placeholder="Notes additionnelles..."
                  value={terrainForm.notes || ""}
                  onChange={e => setTerrainForm({ ...terrainForm, notes: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white text-xs resize-none h-20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 py-4 px-6 border-t border-slate-800">
          <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" onClick={onSave} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}