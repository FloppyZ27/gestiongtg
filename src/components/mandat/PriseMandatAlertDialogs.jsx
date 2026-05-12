import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function PriseMandatAlertDialogs({
  showDeleteMandatConfirm, setShowDeleteMandatConfirm, mandatIndexToDelete, setMandatIndexToDelete, setNouveauDossierForm, setActiveTabMandatDossier,
  showMissingUserWarning, setShowMissingUserWarning,
  showArpenteurRequiredDialog, setShowArpenteurRequiredDialog,
  showDeleteConcordanceConfirm, setShowDeleteConcordanceConfirm, concordanceIndexToDelete, setConcordanceIndexToDelete, setNewLotForm,
  showCancelLotConfirm, setShowCancelLotConfirm, setIsNewLotDialogOpen, resetLotForm,
  showLotExistsWarning, setShowLotExistsWarning, newLotForm,
  showLotMissingFieldsWarning, setShowLotMissingFieldsWarning,
  showConcordanceWarning, setShowConcordanceWarning,
}) {
  return (
    <>
      <Dialog open={showDeleteMandatConfirm} onOpenChange={setShowDeleteMandatConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={()=>{setShowDeleteMandatConfirm(false);setMandatIndexToDelete(null);}} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Annuler</Button>
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={()=>{if(mandatIndexToDelete!==null){setNouveauDossierForm(prev=>({...prev,mandats:prev.mandats.filter((_,i)=>i!==mandatIndexToDelete)}));setActiveTabMandatDossier(Math.max(0,mandatIndexToDelete-1).toString());}setShowDeleteMandatConfirm(false);setMandatIndexToDelete(null);}}>Supprimer</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMissingUserWarning} onOpenChange={setShowMissingUserWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Tous les mandats doivent avoir un utilisateur assigné avant de créer le dossier.</p>
            <div className="flex justify-center gap-3 pt-4"><Button type="button" onClick={()=>setShowMissingUserWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showArpenteurRequiredDialog} onOpenChange={setShowArpenteurRequiredDialog}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Veuillez sélectionner un arpenteur-géomètre.</p>
            <div className="flex justify-center gap-3 pt-4"><Button type="button" onClick={()=>setShowArpenteurRequiredDialog(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">OK</Button></div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConcordanceConfirm} onOpenChange={setShowDeleteConcordanceConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir supprimer cette concordance ? Cette action est irréversible.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={()=>{setShowDeleteConcordanceConfirm(false);setConcordanceIndexToDelete(null);}} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Annuler</Button>
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={()=>{if(concordanceIndexToDelete!==null){setNewLotForm(prev=>({...prev,concordances_anterieures:prev.concordances_anterieures.filter((_,i)=>i!==concordanceIndexToDelete)}));}setShowDeleteConcordanceConfirm(false);setConcordanceIndexToDelete(null);}}>Supprimer</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelLotConfirm} onOpenChange={setShowCancelLotConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={()=>{setShowCancelLotConfirm(false);setIsNewLotDialogOpen(false);resetLotForm();}}>Abandonner</Button>
              <Button type="button" onClick={()=>setShowCancelLotConfirm(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLotExistsWarning} onOpenChange={setShowLotExistsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Le lot <span className="text-emerald-400 font-semibold">{newLotForm?.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{newLotForm?.circonscription_fonciere}</span>.</p>
            <div className="flex justify-center gap-3 pt-4"><Button type="button" onClick={()=>setShowLotExistsWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLotMissingFieldsWarning} onOpenChange={setShowLotMissingFieldsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Veuillez remplir tous les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.</p>
            <div className="flex justify-center gap-3 pt-4"><Button type="button" onClick={()=>setShowLotMissingFieldsWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConcordanceWarning} onOpenChange={setShowConcordanceWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
            <p className="text-slate-300 text-center">Veuillez remplir le numéro de lot, la circonscription foncière et le cadastre pour ajouter une concordance.</p>
            <div className="flex justify-center gap-3 pt-4"><Button type="button" onClick={()=>setShowConcordanceWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
}