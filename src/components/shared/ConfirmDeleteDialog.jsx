import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Composant de confirmation de suppression uniforme pour toute l'app.
 * Props:
 *  - open: bool
 *  - onOpenChange: fn
 *  - onConfirm: fn appelée si l'utilisateur confirme
 *  - title?: string (défaut: "Confirmer la suppression")
 *  - message?: string (défaut: "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.")
 *  - confirmLabel?: string (défaut: "Supprimer")
 *  - cancelLabel?: string (défaut: "Annuler")
 */
export default function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmer la suppression",
  message = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
}) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md text-white" style={{ background: 'rgba(15, 23, 42, 0.97)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-slate-300 text-sm leading-relaxed mt-1">{message}</p>
        <div className="flex justify-end gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white border-none"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}