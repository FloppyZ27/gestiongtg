import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Plus, ChevronDown, ChevronUp, Trash } from "lucide-react";
import { format } from "date-fns"; import { fr } from "date-fns/locale";

const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30", "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30", "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30", "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30", "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30", "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30", "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

export default function EntreeTempsSection({ editingDossier, formData, users, entreesTemps, setEntreesTemps, addActionLog, onDeleteRequest, user, collapsed, onToggleCollapse }) {
  const [entreeTempsCollapsedInternal, setEntreeTempsCollapsedInternal] = useState(true);
  const entreeTempsCollapsed = collapsed !== undefined ? collapsed : entreeTempsCollapsedInternal;
  const setEntreeTempsCollapsed = onToggleCollapse || setEntreeTempsCollapsedInternal;
  const [newEntreeTempsFormCollapsed, setNewEntreeTempsFormCollapsed] = useState(true);
  const [newEntreeTempsForm, setNewEntreeTempsForm] = useState({
    date: new Date().toISOString().split('T')[0], mandat: "", heures: "", tache: ""
  });

  return (
    <Card className="border-0 bg-transparent mt-3" data-section="entree-temps">
      <CardHeader
        className="cursor-pointer hover:bg-lime-900/40 transition-colors rounded-t-lg py-1.5 bg-lime-900/20"
        onClick={() => setEntreeTempsCollapsed(!entreeTempsCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-lime-500/30 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-lime-400" />
            </div>
            <CardTitle className="text-lime-300 text-base">Entrée de temps</CardTitle>
            {entreesTemps.length > 0 && (
              <>
                {formData.mandats.map((mandat, idx) => {
                  const totalHeures = entreesTemps.filter(e => e.mandat === mandat.type_mandat).reduce((sum, e) => sum + (e.heures || 0), 0);
                  return totalHeures > 0 && (
                    <Badge key={idx} className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                      {getAbbreviatedMandatType(mandat.type_mandat)}: {totalHeures}h
                    </Badge>
                  );
                })}
                <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 text-xs font-semibold">
                  Total: {entreesTemps.reduce((sum, e) => sum + (e.heures || 0), 0)}h
                </Badge>
              </>
            )}
          </div>
          {entreeTempsCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!entreeTempsCollapsed && (
        <CardContent className="pt-2 pb-3 space-y-4">
          <div className="border-2 border-lime-500/30 rounded-lg mb-4 bg-lime-900/10">
            <div
              className="cursor-pointer hover:bg-lime-900/40 transition-colors px-4 py-2 flex items-center justify-between"
              onClick={() => setNewEntreeTempsFormCollapsed(!newEntreeTempsFormCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-lime-400" />
                <span className="text-xs font-semibold text-lime-400">Ajouter une entrée de temps</span>
              </div>
              {newEntreeTempsFormCollapsed ? <ChevronDown className="w-4 h-4 text-lime-400" /> : <ChevronUp className="w-4 h-4 text-lime-400" />}
            </div>

            {!newEntreeTempsFormCollapsed && (
              <div className="p-4 border-t border-lime-500/30 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                    <Input type="date" value={newEntreeTempsForm.date} onChange={(e) => setNewEntreeTempsForm({...newEntreeTempsForm, date: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                    <Select value={newEntreeTempsForm.mandat} onValueChange={(value) => setNewEntreeTempsForm({...newEntreeTempsForm, mandat: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {(formData?.mandats || []).map((mandat, index) => (<SelectItem key={index} value={mandat?.type_mandat} className="text-white text-xs">{mandat?.type_mandat || `Mandat ${index + 1}`}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Temps <span className="text-red-400">*</span></Label>
                    <Input type="number" step="0.25" min="0" placeholder="Ex: 2.5" value={newEntreeTempsForm.heures} onChange={(e) => setNewEntreeTempsForm({...newEntreeTempsForm, heures: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Tâche accomplie <span className="text-red-400">*</span></Label>
                    <Select value={newEntreeTempsForm.tache} onValueChange={(value) => setNewEntreeTempsForm({...newEntreeTempsForm, tache: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {TACHES.map((tache) => (<SelectItem key={tache} value={tache} className="text-white text-xs">{tache}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button" size="sm"
                  onClick={async () => {
                    if (!newEntreeTempsForm.date) { alert("Veuillez sélectionner une date"); return; }
                    if (!newEntreeTempsForm.mandat) { alert("Veuillez sélectionner un mandat"); return; }
                    if (!newEntreeTempsForm.heures) { alert("Veuillez entrer le temps"); return; }
                    if (!newEntreeTempsForm.tache) { alert("Veuillez sélectionner une tâche"); return; }
                    const createdEntree = await base44.entities.EntreeTemps.create({
                      dossier_id: editingDossier.id, date: newEntreeTempsForm.date, mandat: newEntreeTempsForm.mandat,
                      heures: parseFloat(newEntreeTempsForm.heures), tache: newEntreeTempsForm.tache, utilisateur_email: user?.email || ""
                    });
                    addActionLog("Entrée de temps", `${parseFloat(newEntreeTempsForm.heures)}h - ${newEntreeTempsForm.tache} - ${newEntreeTempsForm.mandat}`);
                    setEntreesTemps(prev => [createdEntree, ...prev]);
                    setNewEntreeTempsForm({ date: new Date().toISOString().split('T')[0], mandat: "", heures: "", tache: "" });
                    setNewEntreeTempsFormCollapsed(true);
                  }}
                  className="bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 h-8 text-xs w-full border border-lime-500/30"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter l'entrée
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
                      <TableCell className="text-slate-300 text-xs">{entree.date ? format(new Date(entree.date + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell className="text-slate-300 text-xs font-medium">{entree.heures}h</TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        <Badge className={`${getMandatColor(entree.mandat)} border text-xs`}>{getAbbreviatedMandatType(entree.mandat) || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">{entree.tache || "-"}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{getUserInitials((users || []).find(u => u?.email === entree.utilisateur_email)?.full_name) || "-"}</span>
                          <Avatar className="w-6 h-6 border-2 border-emerald-500/50 flex-shrink-0">
                            <AvatarImage src={(users || []).find(u => u?.email === entree.utilisateur_email)?.photo_url} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                              {getUserInitials((users || []).find(u => u?.email === entree.utilisateur_email)?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <button type="button" onClick={() => onDeleteRequest({ entreeTempsId: entree.id })} className="text-slate-400 hover:text-red-400 transition-colors">
                          <Trash className="w-4 h-4" />
                        </button>
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