import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG",
    "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP",
    "Benjamin Larouche": "BL",
    "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "";
};

export default function StatutChangeConfirmDialog({
  open,
  onOpenChange,
  pendingStatutChange,
  formData,
  clientInfo,
  professionnelInfo,
  workAddress,
  mandatsInfo,
  historique,
  setHistorique,
  user,
  editingPriseMandat,
  isLocked,
  onConfirm,
  updatePriseMandatMutation,
  newNumeroDossier
}) {
  const handleConfirm = async () => {
    const value = pendingStatutChange;

    if (formData.arpenteur_geometre) {
      const initials = getArpenteurInitials(formData.arpenteur_geometre);
      console.log(`[CONFIRM] Changement statut: ${formData.statut} → ${value}`);
      console.log(`[CONFIRM] newNumeroDossier: ${newNumeroDossier}`);
      console.log(`[CONFIRM] Initials: ${initials}`);
      console.log(`[CONFIRM] clientInfo:`, clientInfo);
      try {
        if (value === "Mandats à ouvrir" && newNumeroDossier) {
          const clientName = `${clientInfo?.prenom || ''} ${clientInfo?.nom || ''}`.trim() || "Client";
          const sourcePath = `ARPENTEUR/${initials}/DOSSIER/TEMPORAIRE/${initials}-${clientName}/INTRANTS`;
          const destPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${newNumeroDossier}/INTRANTS`;
          console.log(`[CONFIRM] Tentative transfert: ${sourcePath} → ${destPath}`);
          try {
            console.log(`[CONFIRM] Check fichiers source...`);
            const checkRes = await base44.functions.invoke('sharepoint', { action: 'list', folderPath: sourcePath });
            console.log(`[CONFIRM] Fichiers trouvés:`, checkRes.data?.files?.length);
            if (checkRes.data?.files?.length > 0) {
              console.log(`[CONFIRM] Copie en cours...`);
              await base44.functions.invoke('copySharePointFiles', {
                sourceFolderPath: sourcePath,
                destinationFolderPath: destPath
              });
              console.log(`[CONFIRM] Copie terminée`);
            }
          } catch (e) {
            console.error("[CONFIRM] Erreur transfert documents SharePoint:", e);
          }
        } else if (value !== "Mandats à ouvrir" && formData.numero_dossier) {
          const folderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${formData.numero_dossier}/INTRANTS`;
          const response = await base44.functions.invoke('sharepoint', { action: 'list', folderPath });
          const files = response.data?.files || [];
          for (const file of files) {
            await base44.functions.invoke('sharepoint', { action: 'delete', fileId: file.id });
          }
        }
      } catch (error) {
        console.error("Erreur gestion documents SharePoint:", error);
      }
    }

    const newFormData = value !== "Mandats à ouvrir"
      ? { ...formData, statut: value, numero_dossier: "", date_ouverture: "" }
      : { ...formData, statut: value, numero_dossier: newNumeroDossier };

    if (editingPriseMandat && !isLocked) {
      const mandatsToSave = mandatsInfo.filter(m => m.type_mandat).map(m => ({
        type_mandat: m.type_mandat,
        prix_estime: m.prix_estime || 0,
        prix_premier_lot: m.prix_premier_lot || 0,
        prix_autres_lots: m.prix_autres_lots || 0,
        rabais: m.rabais || 0,
        taxes_incluses: m.taxes_incluses || false
      }));
      const now = new Date().toISOString();
      const newHistoriqueEntry = {
        action: "Changement de statut",
        details: `${editingPriseMandat.statut} → ${value}`,
        utilisateur_nom: user?.full_name || "Utilisateur",
        utilisateur_email: user?.email || "",
        date: now
      };
      const updatedHistorique = [newHistoriqueEntry, ...(historique || [])];
      if (setHistorique) setHistorique(updatedHistorique);
      try {
        await updatePriseMandatMutation.mutateAsync({
          id: editingPriseMandat.id,
          data: {
            arpenteur_geometre: newFormData.arpenteur_geometre,
            place_affaire: newFormData.placeAffaire,
            numero_dossier: value === "Mandats à ouvrir" ? (newNumeroDossier || newFormData.numero_dossier) : newFormData.numero_dossier,
            date_ouverture: newFormData.date_ouverture,
            clients_ids: newFormData.clients_ids,
            notaires_ids: newFormData.notaires_ids || [],
            courtiers_ids: newFormData.courtiers_ids || [],
            compagnies_ids: newFormData.compagnies_ids || [],
            client_info: clientInfo,
            professionnel_info: professionnelInfo,
            adresse_travaux: workAddress,
            mandats: mandatsToSave,
            echeance_souhaitee: mandatsInfo[0]?.echeance_souhaitee || "",
            date_signature: mandatsInfo[0]?.date_signature || "",
            date_debut_travaux: mandatsInfo[0]?.date_debut_travaux || "",
            date_livraison: mandatsInfo[0]?.date_livraison || "",
            urgence_percue: mandatsInfo[0]?.urgence_percue || "",
            statut: value,
            historique: updatedHistorique,
            locked_by: user?.email,
            locked_at: editingPriseMandat.locked_at
          },
          autoSave: true
        });
      } catch (error) {
        console.error("Erreur sauvegarde statut:", error);
      }
    }

    onConfirm(newFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
        <DialogHeader>
          <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span>
            Attention
            <span className="text-2xl">⚠️</span>
          </DialogTitle>
        </DialogHeader>
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <p className="text-slate-300 text-center">
            Des documents sont liés à ce mandat. En changeant le statut, les documents associés seront copiés vers le nouveau dossier.
          </p>
          <p className="text-slate-400 text-sm text-center">
            Êtes-vous sûr de vouloir continuer ?
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              onClick={handleConfirm}
            >
              Confirmer
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}