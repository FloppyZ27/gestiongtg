import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, ChevronDown, ChevronUp, Clock, Trash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EntreeTempsSection({ editingDossier, formData, user, users, entreesTemps, setEntreesTemps, addActionLog, isCollapsed, onToggleCollapse, getMandatColor, getAbbreviatedMandatType, TACHES, getUserInitials, onDeleteRequest }) {
  const [collapsed, setCollapsed] = useState(true);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], mandat: "", heures: "", tache: "" });

  if (!editingDossier) return null;

  return (
    <Card className="border-slate-700 bg-slate-800/30 mt-3" data-section="entree-temps">
      <CardHeader className="cursor-pointer hover:bg-lime-900/40 transition-colors rounded-t-lg py-1.5 bg-lime-900/20" onClick={onToggleCollapse}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-lime-500/30 flex items-center justify-center"><Clock className="w-3.5 h-3.5 text-lime-400" /></div>
            <CardTitle className="text-lime-300 text-base">Entrée de temps</CardTitle>
            {entreesTemps.length > 0 && (
              <>
                {formData.mandats.map((mandat, idx) => {
                  const totalHeures = entreesTemps.filter(e => e.mandat === mandat.type_mandat).reduce((sum, e) => sum + (e.heures || 0), 0);
                  return totalHeures > 0 && (<Badge key={idx} className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>{getAbbreviatedMandatType(mandat.type_mandat)}: {totalHeures}h</Badge>);
                })}
                <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-xs font-semibold">Total: {entreesTemps.reduce((sum, e) => sum + (e.heures || 0), 0)}h</Badge>
              </>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-3 space-y-4">
          <div className="border-2 border-lime-500/30 rounded-lg mb-4 bg-lime-900/10">
            <div className="cursor-pointer hover:bg-lime-900/40 transition-colors px-4 py-2 flex items-center justify-between" onClick={() => setCollapsed(!collapsed)}>
              <div className="flex items-center gap-2"><Plus className="w-4 h-4 text-lime-400" /><span className="text-xs font-semibold text-lime-400">Ajouter une entrée de temps</span></div>
              {collapsed ? <ChevronDown className="w-4 h-4 text-lime-400" /> : <ChevronUp className="w-4 h-4 text-lime-400" />}
            </div>
            {!collapsed && (
              <div className="p-4 border-t border-lime-500/30 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                    <Select value={form.mandat} onValueChange={(v) => setForm({...form, mandat: v})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {(formData?.mandats || []).map((m, i) => (<SelectItem key={i} value={m?.type_mandat} className="text-white text-xs">{m?.type_mandat || `Mandat ${i + 1}`}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Temps <span className="text-red-400">*</span></Label>
                    <Input type="number" step="0.25" min="0" placeholder="Ex: 2.5" value={form.heures} onChange={(e) => setForm({...form, heures: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Tâche accomplie <span className="text-red-400">*</span></Label>
                    <Select value={form.tache} onValueChange={(v) => setForm({...form, tache: v})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {TACHES.map((t) => (<SelectItem key={t} value={t} className="text-white text-xs">{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={async () => {
                  if (!form.date || !form.mandat || !form.heures || !form.tache) { alert("Veuillez remplir tous les champs obligatoires"); return; }
                  const created = await base44.entities.EntreeTemps.create({ dossier_id: editingDossier.id, date: form.date, mandat: form.mandat, heures: parseFloat(form.heures), tache: form.tache, utilisateur_email: user?.email || "" });
                  addActionLog?.("Entrée de temps", `${parseFloat(form.heures)}h - ${form.tache} - ${form.mandat}`);
                  setEntreesTemps(prev => [created, ...prev]);
                  setForm({ date: new Date().toISOString().split('T')[0], mandat: "", heures: "", tache: "" });
                  setCollapsed(true);
                }} className="bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 h-8 text-xs w-full border border-lime-500/30">
                  <Plus className="w-3 h-3 mr-1" />Ajouter l'entrée
                </Button>
              </div>
            )}
          </div>
          {entreesTemps.length > 0 ? (
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300 text-xs">Date</TableHead>
                    <TableHead className="text-slate-300 text-xs">Heures</TableHead>
                    <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                    <TableHead className="text-slate-300 text-xs">Tâche</TableHead>
                    <TableHead className="text-slate-300 text-xs">Utilisateur</TableHead>
                    <TableHead className="text-slate-300 text-xs w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entreesTemps.map((entree) => (
                    <TableRow key={entree.id} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell className="text-slate-300 text-xs">{entree.date ? format(new Date(entree.date), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell className="text-slate-300 text-xs font-medium">{entree.heures}h</TableCell>
                      <TableCell className="text-slate-300 text-xs"><Badge className={`${getMandatColor(entree.mandat)} border text-xs`}>{getAbbreviatedMandatType(entree.mandat) || "-"}</Badge></TableCell>
                      <TableCell className="text-slate-300 text-xs"><Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{entree.tache || "-"}</Badge></TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{getUserInitials((users || []).find(u => u?.email === entree.utilisateur_email)?.full_name) || "-"}</span>
                          <Avatar className="w-6 h-6 border-2 border-emerald-500/50 flex-shrink-0">
                            <AvatarImage src={(users || []).find(u => u?.email === entree.utilisateur_email)?.photo_url} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials((users || []).find(u => u?.email === entree.utilisateur_email)?.full_name)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <button type="button" onClick={() => onDeleteRequest({entreeTempsId: entree.id})} className="text-slate-400 hover:text-red-400 transition-colors"><Trash className="w-4 h-4" /></button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Aucune entrée de temps</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}