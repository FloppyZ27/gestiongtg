import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, User, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

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
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

export default function OuvrirDossierDialog({ 
  open, 
  onOpenChange, 
  dossierForm, 
  commentaires,
  users,
  onSuccess,
  editingPriseMandat
}) {
  const [mandats, setMandats] = useState(dossierForm?.mandats || []);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  // Sync mandats when dossierForm changes
  React.useEffect(() => {
    if (dossierForm?.mandats) {
      setMandats(dossierForm.mandats);
    }
  }, [dossierForm]);

  const updateMandatUser = (index, email) => {
    setMandats(prev => prev.map((m, i) => i === index ? { ...m, utilisateur_assigne: email } : m));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const dossierData = { ...dossierForm, mandats };
      const newDossier = await base44.entities.Dossier.create(dossierData);

      // Créer les commentaires
      if (commentaires?.length > 0) {
        await Promise.all(commentaires.map(c =>
          base44.entities.CommentaireDossier.create({
            dossier_id: newDossier.id,
            contenu: c.contenu,
            utilisateur_email: c.utilisateur_email,
            utilisateur_nom: c.utilisateur_nom
          })
        ));
      }

      // Notifications pour utilisateurs assignés
      for (const mandat of mandats) {
        if (mandat.utilisateur_assigne && mandat.type_mandat) {
          await base44.entities.Notification.create({
            utilisateur_email: mandat.utilisateur_assigne,
            titre: "Nouveau mandat assigné",
            message: `Un mandat "${mandat.type_mandat}" du dossier ${dossierForm.arpenteur_geometre?.substring(0,2)}-${dossierForm.numero_dossier} vous a été assigné.`,
            type: "dossier",
            dossier_id: newDossier.id,
            lue: false
          });
        }
      }

      // Marquer la prise de mandat
      if (editingPriseMandat) {
        await base44.entities.PriseMandat.update(editingPriseMandat.id, {
          ...editingPriseMandat,
          statut: "Mandat non octroyé",
          locked_by: null,
          locked_at: null
        });
        queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
      }

      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur création dossier:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!dossierForm) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-2xl p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
        <DialogHeader className="sr-only">
          <DialogTitle>Ouvrir le dossier</DialogTitle>
        </DialogHeader>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
            <FolderOpen className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Ouvrir le dossier</h2>
              <p className="text-slate-400 text-sm">
                Dossier{" "}
                <Badge variant="outline" className={`${getArpenteurColor(dossierForm.arpenteur_geometre)} border ml-1`}>
                  {dossierForm.arpenteur_geometre?.split(' ').map(w => w[0]).join('')}-{dossierForm.numero_dossier}
                </Badge>
              </p>
            </div>
          </div>

          {/* Mandats */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-slate-300 text-sm">Assignez un technicien à chaque mandat avant de créer le dossier :</p>
            {mandats.map((mandat, index) => (
              <div key={index} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={`${getMandatColor(mandat.type_mandat)} border text-sm`}>
                    {mandat.type_mandat || `Mandat ${index + 1}`}
                  </Badge>
                  {mandat.utilisateur_assigne && (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs flex items-center gap-1">
                    <User className="w-3 h-3" /> Technicien assigné
                  </Label>
                  <Select
                    value={mandat.utilisateur_assigne || ""}
                    onValueChange={(val) => updateMandatUser(index, val)}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Sélectionner un utilisateur..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.email} className="text-white">
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-none"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {isCreating ? "Création..." : "Créer le dossier"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}