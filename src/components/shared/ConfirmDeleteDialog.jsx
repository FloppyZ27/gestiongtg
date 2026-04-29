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
      <DialogContent className="max-w-md" style={{ background: 'rgba(15, 23, 42, 0.97)', border: '1px solid rgba(239,68,68,0.3)', color: 'white' }}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2" style={{ color: 'white' }}>
            <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed mt-1" style={{ color: '#cbd5e1' }}>{message}</p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            style={{ background: 'rgba(51,65,85,0.8)', border: '1px solid rgba(100,116,139,0.5)', color: '#cbd5e1', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ background: '#dc2626', border: 'none', color: 'white', borderRadius: '0.375rem', padding: '0.5rem 1rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500 }}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}