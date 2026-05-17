import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Plus, ChevronDown, ChevronUp, Trash } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUTS_RETOUR = ["Retour d'appel", "Message laissé", "Aucune réponse", "Terminé"];

const getStatutColor = (statut) => {
  const colors = {
    "Retour d'appel": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Message laissé": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Aucune réponse": "bg-red-500/20 text-red-400 border-red-500/30",
    "Terminé": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  };
  return colors[statut] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

export default function RetourAppelSection({ editingDossier, formData, setFormData, users, retoursAppel, setRetoursAppel, addActionLog, onDeleteRequest, collapsed, onToggleCollapse }) {
  const [retourAppelCollapsedInternal, setRetourAppelCollapsedInternal] = useState(true);
  const retourAppelCollapsed = collapsed !== undefined ? collapsed : retourAppelCollapsedInternal;
  const setRetourAppelCollapsed = onToggleCollapse || setRetourAppelCollapsedInternal;
  const [newRetourAppelFormCollapsed, setNewRetourAppelFormCollapsed] = useState(true);
  const [newRetourAppel, setNewRetourAppel] = useState({
    date_appel: new Date().toISOString().split('T')[0],
    utilisateur_assigne: "",
    raison: "",
    statut: "Retour d'appel"
  });

  return (
    <Card className="border-0 bg-transparent mt-3" data-section="retour-appel">
      <CardHeader
        className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
        onClick={() => setRetourAppelCollapsed(!retourAppelCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <CardTitle className="text-blue-300 text-base">Retour d'appel</CardTitle>
            {retoursAppel.length > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                {retoursAppel.length} entrée{retoursAppel.length > 1 ? "s" : ""}
              </Badge>
            )}
            {retoursAppel.some(r => r.statut === "Retour d'appel") && (
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs animate-pulse">
                {retoursAppel.filter(r => r.statut === "Retour d'appel").length} en attente
              </Badge>
            )}
          </div>
          {retourAppelCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!retourAppelCollapsed && (
        <CardContent className="pt-2 pb-3 space-y-4">
          <div className="border-2 border-blue-500/30 rounded-lg mb-4 bg-blue-900/10">
            <div
              className="cursor-pointer hover:bg-blue-900/40 transition-colors px-4 py-2 flex items-center justify-between"
              onClick={() => setNewRetourAppelFormCollapsed(!newRetourAppelFormCollapsed)}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Ajouter un retour d'appel</span>
              </div>
              {newRetourAppelFormCollapsed ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronUp className="w-4 h-4 text-blue-400" />}
            </div>

            {!newRetourAppelFormCollapsed && (
              <div className="p-4 border-t border-blue-500/30 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Date <span className="text-red-400">*</span></Label>
                    <Input type="date" value={newRetourAppel.date_appel} onChange={(e) => setNewRetourAppel({...newRetourAppel, date_appel: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Assigné à</Label>
                    <Select value={newRetourAppel.utilisateur_assigne} onValueChange={(value) => setNewRetourAppel({...newRetourAppel, utilisateur_assigne: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {(users || []).map((u) => (<SelectItem key={u?.email} value={u?.email} className="text-white text-xs">{u?.full_name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Statut</Label>
                    <Select value={newRetourAppel.statut} onValueChange={(value) => setNewRetourAppel({...newRetourAppel, statut: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {STATUTS_RETOUR.map((s) => (<SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Raison <span className="text-red-400">*</span></Label>
                    <Input placeholder="Raison de l'appel..." value={newRetourAppel.raison} onChange={(e) => setNewRetourAppel({...newRetourAppel, raison: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                  </div>
                </div>
                <Button
                  type="button" size="sm"
                  onClick={async () => {
                    if (!newRetourAppel.date_appel) { alert("Veuillez sélectionner une date"); return; }
                    if (!newRetourAppel.raison) { alert("Veuillez entrer une raison"); return; }
                    const created = await base44.entities.RetourAppel.create({
                      dossier_id: editingDossier.id,
                      date_appel: newRetourAppel.date_appel,
                      utilisateur_assigne: newRetourAppel.utilisateur_assigne,
                      raison: newRetourAppel.raison,
                      statut: newRetourAppel.statut
                    });
                    // Mettre à jour l'utilisateur assigné sur le dossier
                    if (newRetourAppel.utilisateur_assigne) {
                      setFormData(prev => ({ ...prev, utilisateur_assigne: newRetourAppel.utilisateur_assigne }));
                    }
                    // Créer notification
                    if (newRetourAppel.utilisateur_assigne) {
                      const clientsNames = editingDossier.clients_ids?.length > 0 ? editingDossier.clients_ids.map(id => {
                        const client = users.find(u => u.email === id) || null;
                        return client ? `${client.full_name}` : '';
                      }).filter(name => name).join(", ") : '';

                      await base44.entities.Notification.create({
                        utilisateur_email: newRetourAppel.utilisateur_assigne,
                        titre: "Nouveau retour d'appel assigné",
                        message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
                        type: "retour_appel",
                        dossier_id: editingDossier.id,
                        lue: false
                      });
                    }
                    addActionLog("Retour d'appel ajouté", `${newRetourAppel.raison}`);
                    setRetoursAppel(prev => [created, ...prev]);
                    setNewRetourAppel({ date_appel: new Date().toISOString().split('T')[0], utilisateur_assigne: "", raison: "", statut: "Retour d'appel" });
                    setNewRetourAppelFormCollapsed(true);
                  }}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 h-8 text-xs w-full border border-blue-500/30"
                >
                  <Plus className="w-3 h-3 mr-1" /> Ajouter le retour d'appel
                </Button>
              </div>
            )}
          </div>

          {retoursAppel.length > 0 ? (
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300 text-xs">Date</TableHead>
                    <TableHead className="text-slate-300 text-xs">Raison</TableHead>
                    <TableHead className="text-slate-300 text-xs">Statut</TableHead>
                    <TableHead className="text-slate-300 text-xs">Assigné à</TableHead>
                    <TableHead className="text-slate-300 text-xs w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retoursAppel.map((retour) => {
                    const assignedUser = (users || []).find(u => u?.email === retour.utilisateur_assigne);
                    return (
                      <TableRow key={retour.id} className="hover:bg-slate-800/30 border-slate-800">
                        <TableCell className="text-slate-300 text-xs">
                          {retour.date_appel ? format(new Date(retour.date_appel + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : "-"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-[200px] truncate">{retour.raison || "-"}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatutColor(retour.statut)} border text-xs`}>{retour.statut || "-"}</Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">{assignedUser?.full_name || retour.utilisateur_assigne || "-"}</TableCell>
                        <TableCell className="text-right">
                          <button type="button" onClick={() => onDeleteRequest({ retourAppelId: retour.id })} className="text-slate-400 hover:text-red-400 transition-colors">
                            <Trash className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <Phone className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">Aucun retour d'appel</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}