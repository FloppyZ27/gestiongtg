import React from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

export default function ConfirmationDialogs({
  // Statut change
  showStatutChangeConfirm, setShowStatutChangeConfirm,
  pendingStatutChange, setPendingStatutChange,
  formData, setFormData, setHasDocuments,
  getArpenteurInitials,
  // Cancel mandat
  showCancelConfirm, setShowCancelConfirm,
  editingPriseMandat, isLocked, setIsDialogOpen,
  resetFullForm, setIsLocked, setLockedBy,
  // Unsaved warning
  showUnsavedWarning, setShowUnsavedWarning,
  // Cancel dossier
  showCancelConfirmDossier, setShowCancelConfirmDossier,
  setIsOuvrirDossierDialogOpen,
  setNouveauDossierForm, setCommentairesTemporairesDossier,
  setDossierDocuments, setActiveTabMandatDossier,
  // Delete mandat
  showDeleteMandatConfirm, setShowDeleteMandatConfirm,
  mandatIndexToDelete, setMandatIndexToDelete,
  nouveauDossierForm,
  // Missing user warning
  showMissingUserWarning, setShowMissingUserWarning,
  // Arpenteur required
  showArpenteurRequiredDialog, setShowArpenteurRequiredDialog,
  // D01 import success
  showD01ImportSuccess, setShowD01ImportSuccess,
  // Delete concordance
  showDeleteConcordanceConfirm, setShowDeleteConcordanceConfirm,
  concordanceIndexToDelete, setConcordanceIndexToDelete,
  setNewLotForm,
  // Cancel lot
  showCancelLotConfirm, setShowCancelLotConfirm,
  setIsNewLotDialogOpen, resetLotForm,
  // Lot exists warning
  showLotExistsWarning, setShowLotExistsWarning, newLotForm,
  // Lot missing fields
  showLotMissingFieldsWarning, setShowLotMissingFieldsWarning,
  // Delete prise mandat
  showDeletePriseMandatConfirm, setShowDeletePriseMandatConfirm,
  priseMandatIdToDelete, setPriseMandatIdToDelete,
  deletePriseMandatMutation,
  // Concordance warning
  showConcordanceWarning, setShowConcordanceWarning,
}) {
  const queryClient = useQueryClient();

  const resetDossierForm = () => {
    setNouveauDossierForm({ numero_dossier: "", arpenteur_geometre: "", date_ouverture: new Date().toISOString().split('T')[0], statut: "Ouvert", ttl: "Non", clients_ids: [], notaires_ids: [], courtiers_ids: [], mandats: [] });
    setCommentairesTemporairesDossier([]);
    setDossierDocuments([]);
    setActiveTabMandatDossier("0");
  };

  return (
    <>
      {/* Dialog de confirmation de changement de statut */}
      <Dialog open={showStatutChangeConfirm} onOpenChange={setShowStatutChangeConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Des documents sont liés à ce mandat. En changeant le statut, les documents associés au dossier SharePoint seront supprimés.</p>
            <p className="text-slate-400 text-sm text-center">Êtes-vous sûr de vouloir continuer ?</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowStatutChangeConfirm(false); setPendingStatutChange(null); }} className="bg-gradient-to-r from-red-500 to-red-600 border-none">Annuler</Button>
              <Button type="button" className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none" onClick={async () => {
                const value = pendingStatutChange;
                if (formData.numero_dossier && formData.arpenteur_geometre) {
                  try {
                    const initials = getArpenteurInitials(formData.arpenteur_geometre).replace('-', '');
                    const folderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${formData.numero_dossier}/INTRANTS`;
                    const response = await base44.functions.invoke('sharepoint', { action: 'list', folderPath });
                    for (const file of (response.data?.files || [])) {
                      await base44.functions.invoke('sharepoint', { action: 'delete', fileId: file.id });
                    }
                  } catch (error) { console.error("Erreur suppression documents SharePoint:", error); }
                }
                if (value !== "Mandats à ouvrir") { setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""}); }
                else { setFormData({...formData, statut: value}); }
                setShowStatutChangeConfirm(false); setPendingStatutChange(null); setHasDocuments(false);
              }}>Confirmer</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation d'annulation - Nouveau mandat */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={async () => {
                if (editingPriseMandat && !isLocked) {
                  await base44.entities.PriseMandat.update(editingPriseMandat.id, { ...editingPriseMandat, locked_by: null, locked_at: null });
                  queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                }
                setShowCancelConfirm(false); setIsDialogOpen(false); resetFullForm(); setIsLocked(false); setLockedBy("");
              }}>Abandonner</Button>
              <Button type="button" onClick={() => setShowCancelConfirm(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour avertissement modifications non sauvegardées */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={async () => {
                if (editingPriseMandat && !isLocked) {
                  await base44.entities.PriseMandat.update(editingPriseMandat.id, { ...editingPriseMandat, locked_by: null, locked_at: null });
                  queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
                }
                setShowUnsavedWarning(false); setIsDialogOpen(false); resetFullForm(); setIsLocked(false); setLockedBy("");
              }}>Abandonner</Button>
              <Button type="button" onClick={() => setShowUnsavedWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation d'annulation - Ouvrir dossier */}
      <Dialog open={showCancelConfirmDossier} onOpenChange={setShowCancelConfirmDossier}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir quitter ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={() => { setShowCancelConfirmDossier(false); setIsOuvrirDossierDialogOpen(false); resetDossierForm(); }}>Abandonner</Button>
              <Button type="button" onClick={() => setShowCancelConfirmDossier(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression de mandat */}
      <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowDeleteMandatConfirm(false); setMandatIndexToDelete(null); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Annuler</Button>
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={() => {
                if (mandatIndexToDelete !== null) {
                  setNouveauDossierForm(prev => ({ ...prev, mandats: prev.mandats.filter((_, i) => i !== mandatIndexToDelete) }));
                  setActiveTabMandatDossier(Math.max(0, mandatIndexToDelete - 1).toString());
                }
                setShowDeleteMandatConfirm(false); setMandatIndexToDelete(null);
              }}>Supprimer</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'avertissement utilisateur assigné manquant */}
      <Dialog open={showMissingUserWarning} onOpenChange={setShowMissingUserWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Tous les mandats doivent avoir un utilisateur assigné avant de créer le dossier.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowMissingUserWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour validation arpenteur requis */}
      <Dialog open={showArpenteurRequiredDialog} onOpenChange={setShowArpenteurRequiredDialog}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Veuillez sélectionner un arpenteur-géomètre.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowArpenteurRequiredDialog(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">OK</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de succès d'import .d01 */}
      <Dialog open={showD01ImportSuccess} onOpenChange={setShowD01ImportSuccess}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3"><span className="text-2xl">✅</span>Succès<span className="text-2xl">✅</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Données importées avec succès depuis le fichier .d01</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowD01ImportSuccess(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">OK</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression de concordance */}
      <Dialog open={showDeleteConcordanceConfirm} onOpenChange={setShowDeleteConcordanceConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer cette concordance ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowDeleteConcordanceConfirm(false); setConcordanceIndexToDelete(null); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Annuler</Button>
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={() => {
                if (concordanceIndexToDelete !== null) {
                  setNewLotForm(prev => ({ ...prev, concordances_anterieures: prev.concordances_anterieures.filter((_, i) => i !== concordanceIndexToDelete) }));
                }
                setShowDeleteConcordanceConfirm(false); setConcordanceIndexToDelete(null);
              }}>Supprimer</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation d'annulation de création de lot */}
      <Dialog open={showCancelLotConfirm} onOpenChange={setShowCancelLotConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={() => { setShowCancelLotConfirm(false); setIsNewLotDialogOpen(false); resetLotForm(); }}>Abandonner</Button>
              <Button type="button" onClick={() => setShowCancelLotConfirm(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'avertissement lot existant */}
      <Dialog open={showLotExistsWarning} onOpenChange={setShowLotExistsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Le lot <span className="text-emerald-400 font-semibold">{newLotForm?.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{newLotForm?.circonscription_fonciere}</span>.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowLotExistsWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'avertissement champs obligatoires manquants */}
      <Dialog open={showLotMissingFieldsWarning} onOpenChange={setShowLotMissingFieldsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Veuillez remplir tous les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowLotMissingFieldsWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression de prise de mandat */}
      <Dialog open={showDeletePriseMandatConfirm} onOpenChange={setShowDeletePriseMandatConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer cette prise de mandat ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowDeletePriseMandatConfirm(false); setPriseMandatIdToDelete(null); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Annuler</Button>
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={() => {
                if (priseMandatIdToDelete) deletePriseMandatMutation.mutate(priseMandatIdToDelete);
                setShowDeletePriseMandatConfirm(false); setPriseMandatIdToDelete(null);
              }}>Supprimer</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialog d'avertissement concordance incomplète */}
      <Dialog open={showConcordanceWarning} onOpenChange={setShowConcordanceWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-slate-300 text-center">Veuillez remplir le numéro de lot, la circonscription foncière et le cadastre pour ajouter une concordance.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowConcordanceWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}