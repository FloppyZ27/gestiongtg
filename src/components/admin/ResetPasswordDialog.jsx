import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

export default function ResetPasswordDialog({ open, onOpenChange, user, onReset }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (newPassword.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    onReset(newPassword);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-yellow-400" />
            Réinitialiser le mot de passe
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              Réinitialisation du mot de passe pour: <strong>{user?.full_name}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nouveau mot de passe <span className="text-red-400">*</span></Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Minimum 6 caractères"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Confirmer le mot de passe <span className="text-red-400">*</span></Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder="Retaper le mot de passe"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-yellow-500 to-orange-600"
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}