import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const PAGES_DISPONIBLES = [
  "TableauDeBord",
  "Profil",
  "Calendrier",
  "CommunicationClients",
  "Dossiers",
  "Clients",
  "GestionDeMandat",
  "CeduleTerrain",
  "LeveTerrain",
  "Recherches",
  "SharePoint",
  "Administration",
  "Dashboard",
  "Comptabilite"
];

const PAGE_DISPLAY_NAMES = {
  "TableauDeBord": "Tableau de Bord",
  "Profil": "Profil",
  "Calendrier": "Calendrier",
  "CommunicationClients": "Communication clients",
  "Dossiers": "Dossiers",
  "Clients": "Clients",
  "GestionDeMandat": "Gestion de Mandat",
  "CeduleTerrain": "Cédule Terrain",
  "LeveTerrain": "Levé Terrain",
  "Recherches": "Recherches",
  "SharePoint": "SharePoint",
  "Administration": "Administration",
  "Dashboard": "Actes",
  "Comptabilite": "Comptabilité"
};

export default function UserPermissionsDialog({ open, onOpenChange, user, onSave }) {
  const [selectedPages, setSelectedPages] = useState([]);

  const { data: templates = [] } = useQuery({
    queryKey: ['permissionsTemplates'],
    queryFn: () => base44.entities.PermissionsTemplate.list(),
    initialData: [],
    staleTime: 0,
    cacheTime: 0,
  });

  useEffect(() => {
    if (user) {
      setSelectedPages(user.permissions_pages || []);
    }
  }, [user]);

  // Calculer les pages déjà restreintes par rôle ou poste
  const getRestrictedPages = () => {
    const roleTemplate = templates.find(t => t.type === 'role' && t.nom === user?.role);
    const posteTemplate = templates.find(t => t.type === 'poste' && t.nom === user?.poste);
    
    const rolePages = roleTemplate?.permissions_pages || [];
    const postePages = posteTemplate?.permissions_pages || [];
    
    // Une page est restreinte si soit le rôle, soit le poste ne l'autorise pas
    const restrictedByRoleOrPoste = PAGES_DISPONIBLES.filter(page => {
      const allowedByRole = rolePages.length === 0 || rolePages.includes(page);
      const allowedByPoste = postePages.length === 0 || postePages.includes(page);
      return !allowedByRole || !allowedByPoste;
    });

    return new Set(restrictedByRoleOrPoste);
  };

  const restrictedPages = getRestrictedPages();

  const handleSave = () => {
    onSave({
      permissions_pages: selectedPages
    });
  };

  const togglePage = (page) => {
    setSelectedPages(prev =>
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Permissions utilisateur - {user?.full_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <Label className="text-lg text-emerald-400">Accès aux pages</Label>
            </div>
            <p className="text-sm text-slate-400 mb-4 pl-7">
              Les pages grisées sont déjà restreintes par le rôle ou le poste de cet utilisateur.
            </p>
            <div className="grid grid-cols-2 gap-3 pl-7">
              {PAGES_DISPONIBLES.map(page => {
                const isRestricted = restrictedPages.has(page);
                return (
                  <div key={page} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-page-${page}`}
                      checked={selectedPages.includes(page)}
                      onCheckedChange={() => togglePage(page)}
                      disabled={isRestricted}
                      className={isRestricted ? "border-slate-600 opacity-50" : "border-slate-600"}
                    />
                    <label 
                      htmlFor={`user-page-${page}`} 
                      className={`text-sm cursor-pointer ${
                        isRestricted 
                          ? 'text-slate-500 line-through opacity-50' 
                          : 'text-slate-300'
                      }`}
                    >
                      {PAGE_DISPLAY_NAMES[page]}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}