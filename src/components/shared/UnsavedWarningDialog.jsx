import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function UnsavedWarningDialog({
  open,
  onOpenChange,
  onAbandon,
  onContinue,
}) {
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
        <div className="space-y-4">
          <p className="text-slate-300 text-center">
            Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button
              type="button"
              onClick={onAbandon}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
            >
              Abandonner
            </Button>
            <Button 
              type="button" 
              onClick={onContinue}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
            >
              Continuer l'édition
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}