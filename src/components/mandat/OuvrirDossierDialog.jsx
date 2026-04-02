import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, User, CheckCircle, MapPin, Calendar, DollarSign, UserCheck, Building2 } from "lucide-react";
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

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0]) parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
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
  const [mandats, setMandats] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (dossierForm?.mandats) {
      setMandats(dossierForm.mandats.map(m => ({ ...m })));
    }
  }, [dossierForm, open]);

  const updateMandatUser = (index, email) => {
    setMandats(prev => prev.map((m, i) => i === index ? { ...m, utilisateur_assigne: email } : m));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const dossierData = { ...dossierForm, mandats };
      const newDossier = await base44.entities.Dossier.create(dossierData);

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

      for (const mandat of mandats) {
        if (mandat.utilisateur_assigne && mandat.type_mandat) {
          await base44.entities.Notification.create({
            utilisateur_email: mandat.utilisateur_assigne,
            titre: "Nouveau mandat assigné",
            message: `Un mandat "${mandat.type_mandat}" vous a été assigné dans le dossier ${dossierForm.numero_dossier}.`,
            type: "dossier",
            dossier_id: newDossier.id,
            lue: false
          });
        }
      }

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

  const adressePrincipale = mandats[0]?.adresse_travaux ? formatAdresse(mandats[0].adresse_travaux) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50"
        style={{ marginTop: '19px', maxHeight: 'calc(90vh - 5px)' }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Ouvrir le dossier</DialogTitle>
        </DialogHeader>

        <motion.div
          className="flex flex-col h-[85vh]"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-purple-900/30 to-slate-900/30">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <FolderOpen className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Ouvrir le dossier</h2>
                <p className="text-slate-400 text-sm">Confirmation avant création</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`${getArpenteurColor(dossierForm.arpenteur_geometre)} border text-base px-3 py-1`}>
                {dossierForm.arpenteur_geometre?.split(' ').map(w => w[0]).join('')}-{dossierForm.numero_dossier}
              </Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Calendar className="w-3 h-3 mr-1" />
                {dossierForm.date_ouverture || new Date().toISOString().split('T')[0]}
              </Badge>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Colonne gauche — Récapitulatif */}
            <div className="flex-[0_0_40%] border-r border-slate-800 overflow-y-auto p-5 space-y-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Récapitulatif du dossier</h3>

              {/* Arpenteur & place */}
              <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-300 text-sm font-medium">Responsable</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={`${getArpenteurColor(dossierForm.arpenteur_geometre)} border`}>
                    {dossierForm.arpenteur_geometre}
                  </Badge>
                  {dossierForm.place_affaire && (
                    <Badge className="bg-slate-700/50 text-slate-300 border border-slate-600">
                      <Building2 className="w-3 h-3 mr-1" />
                      {dossierForm.place_affaire}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Adresse */}
              {adressePrincipale && (
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm font-medium">Adresse des travaux</span>
                  </div>
                  <p className="text-white text-sm">{adressePrincipale}</p>
                </div>
              )}

              {/* Prix */}
              {mandats.some(m => m.prix_estime > 0) && (
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-sm font-medium">Tarification</span>
                  </div>
                  <div className="space-y-1">
                    {mandats.filter(m => m.prix_estime > 0).map((m, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-400">{m.type_mandat}</span>
                        <span className="text-emerald-400 font-medium">{m.prix_estime.toFixed(2)} $</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commentaires */}
              {commentaires?.length > 0 && (
                <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
                  <p className="text-slate-400 text-sm">
                    <span className="text-emerald-400 font-semibold">{commentaires.length}</span> commentaire{commentaires.length > 1 ? 's' : ''} sera transféré{commentaires.length > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Colonne droite — Assignation des mandats */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Mandats ({mandats.length}) — Assignation des techniciens
              </h3>
              <p className="text-slate-500 text-xs">Chaque mandat peut être assigné à un utilisateur. Cette étape est optionnelle.</p>

              <div className="space-y-4">
                {mandats.map((mandat, index) => (
                  <div key={index} className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getMandatColor(mandat.type_mandat)} border text-sm`}>
                        {mandat.type_mandat || `Mandat ${index + 1}`}
                      </Badge>
                      {mandat.utilisateur_assigne && (
                        <div className="flex items-center gap-1 text-emerald-400 text-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Assigné
                        </div>
                      )}
                    </div>

                    {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatAdresse(mandat.adresse_travaux)}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-slate-400 text-xs flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Technicien assigné (optionnel)
                      </Label>
                      <Select
                        value={mandat.utilisateur_assigne || ""}
                        onValueChange={(val) => updateMandatUser(index, val)}
                      >
                        <SelectTrigger className="bg-slate-700/60 border-slate-600 text-white h-9">
                          <SelectValue placeholder="Aucun technicien assigné" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value={null} className="text-slate-400">Aucun</SelectItem>
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
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-none text-white"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              {isCreating ? "Création en cours..." : "Créer le dossier"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}