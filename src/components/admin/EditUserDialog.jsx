import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield, Save } from "lucide-react";

const getRoleLabel = (role) => {
  const labels = {
    "admin": "Administrateur",
    "gestionnaire": "Gestionnaire",
    "user": "Utilisateur"
  };
  return labels[role] || "Utilisateur";
};

export default function EditUserDialog({ open, onOpenChange, user, currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    role: "user",
    poste: ""
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role || "user",
        poste: user.poste || ""
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async ({ email, data }) => {
      const result = await base44.entities.User.update(email, data);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: currentUser?.email,
        utilisateur_nom: currentUser?.full_name,
        action: "MODIFICATION_UTILISATEUR",
        entite: "User",
        entite_id: email,
        details: `Modification du rôle de ${user?.full_name} : ${getRoleLabel(data.role)}`,
        metadata: {
          ancien_role: user?.role,
          nouveau_role: data.role
        }
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      onSuccess?.();
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;

    updateUserMutation.mutate({
      email: user.email,
      data: formData
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Modifier l'utilisateur
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-slate-400 mb-2 block">Nom complet</Label>
              <p className="text-white font-medium">{user.full_name}</p>
            </div>

            <div>
              <Label className="text-slate-400 mb-2 block">Email</Label>
              <p className="text-white">{user.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Poste</Label>
              <Input
                value={formData.poste}
                onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                placeholder="Ex: Arpenteur-géomètre"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Rôle <span className="text-red-400">*</span></Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="user" className="text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">Utilisateur</span>
                      <span className="text-xs text-slate-400">Accès standard aux fonctionnalités</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gestionnaire" className="text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">Gestionnaire</span>
                      <span className="text-xs text-slate-400">Gestion des dossiers et clients</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin" className="text-white">
                    <div className="flex flex-col">
                      <span className="font-medium">Administrateur</span>
                      <span className="text-xs text-slate-400">Accès complet incluant la gestion des utilisateurs</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.email === currentUser?.email && formData.role !== 'admin' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">
                  ⚠️ Attention : Vous êtes sur le point de retirer vos propres privilèges d'administrateur. Vous ne pourrez plus accéder à cette page.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateUserMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}