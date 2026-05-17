import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, ChevronDown, ChevronUp, Trash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

const TYPE_MINUTES = ["Initiale", "Remplace", "Corrige"];

export default function MinutesSection({ formData, setFormData, addActionLog, onDeleteRequest, collapsed, onToggleCollapse }) {
  const [minutesCollapsedInternal, setMinutesCollapsedInternal] = useState(true);
  const minutesCollapsed = collapsed !== undefined ? collapsed : minutesCollapsedInternal;
  const setMinutesCollapsed = onToggleCollapse || setMinutesCollapsedInternal;
  const [newMinuteFormCollapsed, setNewMinuteFormCollapsed] = useState(true);
  const [newMinuteForm, setNewMinuteForm] = useState({});

  const allMinutes = formData.mandats.flatMap((mandat, mandatIndex) =>
    (mandat.minutes_list || []).map((minute, minuteIndex) => ({ ...minute, mandatIndex, minuteIndex, type_mandat: mandat.type_mandat }))
  );

  return (
    <Card className="border-0 bg-transparent mt-3" data-section="minutes">
      <CardHeader
        className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-1.5 bg-cyan-900/20"
        onClick={() => setMinutesCollapsed(!minutesCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <CardTitle className="text-cyan-300 text-base">Minutes</CardTitle>
            {allMinutes.length > 0 && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                {allMinutes.length} minute{allMinutes.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {minutesCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!minutesCollapsed && (
        <CardContent className="pt-2 pb-3 space-y-4">
          <div className="border-2 border-cyan-500/30 rounded-lg mb-4 bg-cyan-900/10">
            <div
              className="cursor-pointer hover:bg-cyan-900/40 transition-colors px-4 py-2 flex items-center justify-between"
              onClick={() => setNewMinuteFormCollapsed(!newMinuteFormCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-400">Ajouter une minute</span>
              </div>
              {newMinuteFormCollapsed ? <ChevronDown className="w-4 h-4 text-cyan-400" /> : <ChevronUp className="w-4 h-4 text-cyan-400" />}
            </div>

            {!newMinuteFormCollapsed && (
              <div className="p-4 border-t border-cyan-500/30 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Mandat <span className="text-red-400">*</span></Label>
                    <Select value={newMinuteForm.mandatIndex?.toString() || ""} onValueChange={(value) => setNewMinuteForm({...newMinuteForm, mandatIndex: parseInt(value)})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {formData.mandats.map((mandat, index) => (
                          <SelectItem key={index} value={index.toString()} className="text-white text-xs">
                            {mandat.type_mandat || `Mandat ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">N° Minute <span className="text-red-400">*</span></Label>
                    <Input placeholder="Ex: 12345" value={newMinuteForm.minute || ""} onChange={(e) => setNewMinuteForm({...newMinuteForm, minute: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Date minute</Label>
                    <Input type="date" value={newMinuteForm.date_minute || ""} onChange={(e) => setNewMinuteForm({...newMinuteForm, date_minute: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Type</Label>
                    <Select value={newMinuteForm.type_minute || ""} onValueChange={(value) => setNewMinuteForm({...newMinuteForm, type_minute: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {TYPE_MINUTES.map((t) => (<SelectItem key={t} value={t} className="text-white text-xs">{t}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="button" size="sm"
                  onClick={() => {
                    if (newMinuteForm.mandatIndex === undefined || newMinuteForm.mandatIndex === null) { alert("Veuillez sélectionner un mandat"); return; }
                    if (!newMinuteForm.minute) { alert("Veuillez entrer un numéro de minute"); return; }
                    const updatedMandats = [...formData.mandats];
                    if (!updatedMandats[newMinuteForm.mandatIndex].minutes_list) {
                      updatedMandats[newMinuteForm.mandatIndex].minutes_list = [];
                    }
                    updatedMandats[newMinuteForm.mandatIndex].minutes_list.push({
                      minute: newMinuteForm.minute,
                      date_minute: newMinuteForm.date_minute || "",
                      type_minute: newMinuteForm.type_minute || ""
                    });
                    // Mettre à jour les champs de rétrocompatibilité
                    updatedMandats[newMinuteForm.mandatIndex].minute = newMinuteForm.minute;
                    updatedMandats[newMinuteForm.mandatIndex].date_minute = newMinuteForm.date_minute || "";
                    updatedMandats[newMinuteForm.mandatIndex].type_minute = newMinuteForm.type_minute || "";
                    setFormData({...formData, mandats: updatedMandats});
                    const mandatLabel = formData.mandats[newMinuteForm.mandatIndex]?.type_mandat || `Mandat ${newMinuteForm.mandatIndex + 1}`;
                    addActionLog("Minute ajoutée", `Minute ${newMinuteForm.minute} pour le mandat: ${mandatLabel}`);
                    setNewMinuteForm({});
                    setNewMinuteFormCollapsed(true);
                  }}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 h-8 text-xs w-full border border-cyan-500/30"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter la minute
                </Button>
              </div>
            )}
          </div>

          {allMinutes.length > 0 ? (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300 text-xs">Mandat</TableHead>
                    <TableHead className="text-slate-300 text-xs">N° Minute</TableHead>
                    <TableHead className="text-slate-300 text-xs">Date</TableHead>
                    <TableHead className="text-slate-300 text-xs">Type</TableHead>
                    <TableHead className="text-slate-300 text-xs w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMinutes.map((minute, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell>
                        <Badge className={`${getMandatColor(minute.type_mandat)} border text-xs`}>
                          {getAbbreviatedMandatType(minute.type_mandat)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs font-medium">{minute.minute}</TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {minute.date_minute ? format(new Date(minute.date_minute + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {minute.type_minute ? (
                          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-xs">{minute.type_minute}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteRequest({ minute: minute.minute, mandatIndex: minute.mandatIndex, minuteIndex: minute.minuteIndex })}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                        >
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
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Aucune minute</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}