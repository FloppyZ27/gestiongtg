import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader } from "lucide-react";

export function OptimizeConfirmDialog({ open, onClose, onConfirm, isOptimizing }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" /> Optimiser les équipes terrain
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-slate-300 text-sm">L'optimisation va réorganiser automatiquement les cartes non verrouillées dans les équipes futures pour minimiser les trajets.</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> Les cartes verrouillées (🔒) resteront en place</li>
            <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> De nouvelles équipes peuvent être créées si nécessaire</li>
            <li className="flex items-start gap-2"><span className="text-yellow-400 mt-0.5">⚠</span> Seules les journées futures sont affectées</li>
          </ul>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300">Annuler</Button>
          <Button
            data-optimize-btn
            disabled={isOptimizing}
            onClick={onConfirm}
          >
            {isOptimizing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Lancer l'optimisation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OptimizeResultDialog({ result, onClose }) {
  return (
    <Dialog open={!!result} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${result?.error ? 'text-red-400' : 'text-emerald-400'}`}>
            {result?.error ? '❌ Erreur' : '✅ Optimisation terminée'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-center space-y-3">
          {result?.error ? (
            <p className="text-slate-300 text-sm">Une erreur est survenue. Veuillez réessayer.</p>
          ) : (
            <>
              <p className="text-slate-300 text-sm">Les équipes futures ont été réorganisées pour optimiser les trajets.</p>
              {result?.totalNew > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
                  <p className="text-emerald-400 font-semibold">
                    {result.totalNew} nouvelle{result.totalNew > 1 ? 's' : ''} équipe{result.totalNew > 1 ? 's' : ''} créée{result.totalNew > 1 ? 's' : ''} sur des journées libres.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-center pt-2">
          <Button onClick={onClose} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}