import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, ChevronDown, ChevronUp, Phone, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

export default function RetourAppelSection({ editingDossier, formData, setFormData, users, user, getClientsNames, addActionLog, retoursAppel, setRetoursAppel, isCollapsed, onToggleCollapse, onDeleteRequest }) {
  const queryClient = useQueryClient();
  const [newRetourAppelFormCollapsed, setNewRetourAppelFormCollapsed] = useState(true);
  const [newRetourAppel, setNewRetourAppel] = useState({
    date_appel: new Date().toISOString().split('T')[0],
    utilisateur_assigne: "",
    raison: "",
    statut: "Retour d'appel"
  });

  if (!editingDossier) return null;

  return (
    <Card className="border-slate-700 bg-slate-800/30 mt-3" data-section="retour-appel">
      <CardHeader className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20" onClick={onToggleCollapse}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <CardTitle className="text-blue-300 text-base">Retour d'appel</CardTitle>
            {retoursAppel.length > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                {retoursAppel.length} appel{retoursAppel.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-4 pb-3 space-y-4">
          <div className="border-2 border-blue-500/30 rounded-lg mb-4 bg-blue-900/10">
            <div className="cursor-pointer hover:bg-blue-900/40 transition-colors px-4 py-2 flex items-center justify-between" onClick={() => setNewRetourAppelFormCollapsed(!newRetourAppelFormCollapsed)}>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">Ajouter un retour d'appel</span>
              </div>
              {newRetourAppelFormCollapsed ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronUp className="w-4 h-4 text-blue-400" />}
            </div>

            {!newRetourAppelFormCollapsed && (
              <div className="p-4 border-t border-blue-500/30 space-y-3">
                <div className="grid grid-cols-[1fr_1fr] gap-3">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Date de l'appel <span className="text-red-400">*</span></Label>
                      <Input type="date" value={newRetourAppel.date_appel} onChange={(e) => setNewRetourAppel({...newRetourAppel, date_appel: e.target.value})} className="bg-slate-700 border-slate-600 text-white h-8 text-xs" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                      <Select value={newRetourAppel.utilisateur_assigne} onValueChange={(value) => setNewRetourAppel({...newRetourAppel, utilisateur_assigne: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {(users || []).map((u) => (<SelectItem key={u.email} value={u.email} className="text-white text-xs">{u.full_name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Label className="text-slate-400 text-xs mb-1">Raison de l'appel <span className="text-red-400">*</span></Label>
                    <textarea placeholder="Notes sur l'appel..." value={newRetourAppel.raison} onChange={(e) => setNewRetourAppel({...newRetourAppel, raison: e.target.value})} className="bg-slate-700 border border-slate-600 text-white flex-1 text-xs p-2 rounded resize-none" />
                  </div>
                </div>
                <Button type="button" size="sm" onClick={async () => {
                  if (!newRetourAppel.raison) { alert("Veuillez entrer la raison de l'appel"); return; }
                  const createdRetour = await base44.entities.RetourAppel.create({
                    dossier_id: editingDossier.id, date_appel: newRetourAppel.date_appel,
                    utilisateur_assigne: newRetourAppel.utilisateur_assigne || null, raison: newRetourAppel.raison, statut: "Retour d'appel"
                  });
                  addActionLog?.("Retour d'appel", `Retour d'appel ajouté: ${newRetourAppel.raison}`);
                  setRetoursAppel(prev => [createdRetour, ...prev]);
                  setFormData({...formData, statut: "Retour d'appel"});
                  if (newRetourAppel.utilisateur_assigne) {
                    const clientsNames = getClientsNames?.(formData.clients_ids);
                    await base44.entities.Notification.create({
                      utilisateur_email: newRetourAppel.utilisateur_assigne,
                      titre: "Nouveau retour d'appel assigné",
                      message: `Un retour d'appel vous a été assigné pour le dossier ${getArpenteurInitials(formData.arpenteur_geometre)}${formData.numero_dossier}${clientsNames && clientsNames !== "-" ? ` - ${clientsNames}` : ""}.`,
                      type: "retour_appel", dossier_id: editingDossier.id, lue: false
                    });
                  }
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  setNewRetourAppel({ date_appel: new Date().toISOString().split('T')[0], utilisateur_assigne: "", raison: "", statut: "Retour d'appel" });
                  setNewRetourAppelFormCollapsed(true);
                }} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 h-8 text-xs w-full border border-blue-500/30">
                  <Plus className="w-3 h-3 mr-1" />Ajouter le retour d'appel
                </Button>
              </div>
            )}
          </div>

          {retoursAppel.length > 0 && (
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300 text-xs w-[22.5%]">Date</TableHead>
                    <TableHead className="text-slate-300 text-xs w-[22.5%]">Notes</TableHead>
                    <TableHead className="text-slate-300 text-xs w-[22.5%]">Statut</TableHead>
                    <TableHead className="text-slate-300 text-xs w-[22.5%]">Utilisateur assigné</TableHead>
                    <TableHead className="text-slate-300 text-xs w-[10%]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retoursAppel.map((retour) => (
                    <TableRow key={retour.id} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell className="text-slate-300 text-xs w-[22.5%]">{retour.date_appel ? format(new Date(retour.date_appel), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell className="text-slate-300 text-xs w-[22.5%]">
                        <TooltipProvider><Tooltip>
                          <TooltipTrigger asChild><div className="truncate cursor-help">{retour.raison || "-"}</div></TooltipTrigger>
                          {retour.raison && <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-sm whitespace-normal break-words">{retour.raison}</TooltipContent>}
                        </Tooltip></TooltipProvider>
                      </TableCell>
                      <TableCell className="text-xs w-[22.5%]">
                        <Select value={retour.statut} onValueChange={async (newStatut) => {
                          await base44.entities.RetourAppel.update(retour.id, {...retour, statut: newStatut});
                          setRetoursAppel(prev => prev.map(r => r.id === retour.id ? {...r, statut: newStatut} : r));
                          queryClient.invalidateQueries({ queryKey: ['retoursAppel', editingDossier?.id] });
                        }}>
                          <SelectTrigger className={`border-slate-600 h-8 text-xs w-full ${retour.statut === "Retour d'appel" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : retour.statut === "Message laissé" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : retour.statut === "Aucune réponse" ? "bg-slate-700 text-red-400" : "bg-slate-700 text-white"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="Retour d'appel" className="text-white text-xs">Retour d'appel</SelectItem>
                            <SelectItem value="Message laissé" className="text-white text-xs">Message laissé</SelectItem>
                            <SelectItem value="Aucune réponse" className="text-white text-xs">Aucune réponse</SelectItem>
                            <SelectItem value="Terminé" className="text-white text-xs">Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs w-[22.5%]">
                        <div className="flex items-center gap-1.5">
                          <span>{getUserInitials((users || []).find(u => u?.email === retour.utilisateur_assigne)?.full_name) || "-"}</span>
                          <Avatar className="w-6 h-6 border-2 border-emerald-500/50 flex-shrink-0">
                            <AvatarImage src={(users || []).find(u => u?.email === retour.utilisateur_assigne)?.photo_url} />
                            <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials((users || []).find(u => u?.email === retour.utilisateur_assigne)?.full_name)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                      <TableCell className="text-right w-[10%]">
                        <button type="button" onClick={() => onDeleteRequest({retourAppelId: retour.id})} className="text-slate-400 hover:text-red-400 transition-colors">
                          <Trash className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}