import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LotConfirmDialogs({
  showImportSuccess, setShowImportSuccess,
  showLotExistsWarning, setShowLotExistsWarning, formData,
  showLotMissingFieldsWarning, setShowLotMissingFieldsWarning,
  showCancelConfirm, setShowCancelConfirm, setIsFormDialogOpen, resetForm,
  showDeleteConfirm, setShowDeleteConfirm, lotToDelete, setLotToDelete, deleteLotMutation,
}) {
  return (
    <>
      <Dialog open={showImportSuccess} onOpenChange={setShowImportSuccess}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3"><span className="text-2xl">✅</span>Succès<span className="text-2xl">✅</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Données importées avec succès depuis le fichier .d01</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowImportSuccess(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">OK</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLotExistsWarning} onOpenChange={setShowLotExistsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Le lot <span className="text-emerald-400 font-semibold">{formData.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{formData.circonscription_fonciere}</span>.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowLotExistsWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLotMissingFieldsWarning} onOpenChange={setShowLotMissingFieldsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Veuillez remplir tous les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowLotMissingFieldsWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowCancelConfirm(false); setIsFormDialogOpen(false); resetForm(); }} className="bg-gradient-to-r from-red-500 to-red-600 border-none">Abandonner</Button>
              <Button type="button" onClick={() => setShowCancelConfirm(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Confirmer la suppression<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer ce lot ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowDeleteConfirm(false); setLotToDelete(null); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Annuler</Button>
              <Button type="button" onClick={() => { if (lotToDelete) deleteLotMutation.mutate(lotToDelete); setShowDeleteConfirm(false); setLotToDelete(null); }} className="bg-gradient-to-r from-red-500 to-red-600 border-none">Supprimer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}