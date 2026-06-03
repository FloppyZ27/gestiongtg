import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import CommentairesSection from "@/components/dossiers/CommentairesSection";

export default function ViewDossierDialog({
  isOpen, onOpenChange,
  viewingDossier,
  users,
  getArpenteurInitials,
  getStatutBadgeColor,
  getClientById,
  setViewingClientDetails,
  onEdit,
}) {
  if (!viewingDossier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
        <DialogHeader className="sr-only"><DialogTitle>Détails du dossier</DialogTitle></DialogHeader>
        <motion.div className="flex h-[90vh]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.2 }}>
          <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Détails du dossier {getArpenteurInitials(viewingDossier.arpenteur_geometre)}{viewingDossier.numero_dossier}
              </h2>
              {viewingDossier.ttl === "Oui" && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <span className="text-indigo-400 font-semibold text-sm tracking-wide">TTL</span>
                </div>
              )}
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                <div><Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label><p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p></div>
                <div><Label className="text-slate-400 text-sm">Statut</Label><div className="mt-1"><Badge variant="outline" className={`${getStatutBadgeColor(viewingDossier.statut)} border`}>{viewingDossier.statut}</Badge></div></div>
                <div><Label className="text-slate-400 text-sm">Date de création</Label><p className="text-white font-medium mt-1">{viewingDossier.created_date ? format(new Date(viewingDossier.created_date), "dd MMMM yyyy", { locale: fr }) : '-'}</p></div>
              </div>
              {viewingDossier.utilisateur_assigne && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                  <p className="text-white font-medium mt-1 text-sm">{users.find(u => u.email === viewingDossier.utilisateur_assigne)?.full_name || viewingDossier.utilisateur_assigne}</p>
                </div>
              )}
              {viewingDossier.description && (
                <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <Label className="text-slate-400 text-sm">Description</Label>
                  <p className="text-white mt-2 whitespace-pre-wrap">{viewingDossier.description}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {viewingDossier.clients_ids?.map(id => { const c = getClientById(id); return c ? <Badge key={id} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border cursor-pointer" onClick={() => { onOpenChange(false); setViewingClientDetails(c); }}>{c.prenom} {c.nom}</Badge> : null; })}
                {viewingDossier.notaires_ids?.map(id => { const n = getClientById(id); return n ? <Badge key={id} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border cursor-pointer" onClick={() => { onOpenChange(false); setViewingClientDetails(n); }}>{n.prenom} {n.nom}</Badge> : null; })}
              </div>
              {viewingDossier.mandats?.map((m, i) => <div key={i} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg text-sm"><span className="text-emerald-400 font-semibold">{m.type_mandat || `Mandat ${i + 1}`}</span>{m.prix_estime > 0 && <span className="ml-2 text-green-400">{m.prix_estime.toFixed(2)} $</span>}</div>)}
            </div>
            <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">Fermer</Button>
              <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600" onClick={onEdit}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
            </div>
          </div>
          <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex-shrink-0"><h3 className="text-lg font-bold text-white">Commentaires</h3></div>
            <div className="flex-1 overflow-hidden p-4 pr-4"><CommentairesSection dossierId={viewingDossier?.id} dossierTemporaire={false} /></div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}