import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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

const INFORMATIONS_DISPONIBLES = [
  "Données financières",
  "Informations clients sensibles",
  "Historique complet des dossiers",
  "Commentaires privés",
  "Données personnelles employés",
  "Rapports d'activité",
  "Logs système"
];

export default function PermissionsDialog({ open, onOpenChange, user, onSave }) {
  const [selectedPages, setSelectedPages] = useState([]);
  const [selectedInfos, setSelectedInfos] = useState([]);

  const { data: templates = [] } = useQuery({
    queryKey: ['permissionsTemplates'],
    queryFn: () => base44.entities.PermissionsTemplate.list(),
    initialData: [],
  });

  useEffect(() => {
    if (user) {
      setSelectedPages(user.permissions_pages || []);
      setSelectedInfos(user.permissions_informations || []);
    }
  }, [user]);

  // Déterminer les pages accessibles via rôle et poste
  const roleTemplate = templates.find(t => t.type === 'role' && t.nom === user?.role);
  const posteTemplate = templates.find(t => t.type === 'poste' && t.nom === user?.poste);
  
  const allowedPagesByRole = roleTemplate?.permissions_pages || [];
  const allowedPagesByPoste = posteTemplate?.permissions_pages || [];
  
  // Retourne la raison de restriction par template (rôle/poste) ou null si autorisé
  const getTemplateRestriction = (page) => {
    const roleBlocks = roleTemplate && !allowedPagesByRole.includes(page);
    const posteBlocks = posteTemplate && !allowedPagesByPoste.includes(page);
    
    if (roleBlocks && posteBlocks) return 'rôle & poste';
    if (roleBlocks) return 'rôle';
    if (posteBlocks) return 'poste';
    return null;
  };

  const handleSave = () => {
    onSave({
      permissions_pages: selectedPages,
      permissions_informations: selectedInfos
    });
  };

  const togglePage = (page) => {
    setSelectedPages(prev =>
      prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
    );
  };

  const toggleInfo = (info) => {
    setSelectedInfos(prev =>
      prev.includes(info) ? prev.filter(i => i !== info) : [...prev, info]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Permissions - {user?.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Pages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <Label className="text-lg text-emerald-400">Accès aux pages</Label>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              {PAGES_DISPONIBLES.map(page => {
                const restriction = getTemplateRestriction(page);
                const isBlocked = !!restriction;
                return (
                  <div key={page} className="flex items-center gap-2">
                    <Checkbox
                      id={`page-${page}`}
                      checked={!isBlocked && selectedPages.includes(page)}
                      onCheckedChange={() => !isBlocked && togglePage(page)}
                      disabled={isBlocked}
                      className="border-slate-600"
                    />
                    <label 
                      htmlFor={`page-${page}`} 
                      className={`text-sm ${isBlocked ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 cursor-pointer'}`}
                    >
                      {PAGE_DISPLAY_NAMES[page]}
                      {isBlocked && (
                        <span className="text-slate-500 ml-1 text-xs">({restriction})</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>


          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800" style={{boxShadow: 'none', transform: 'none', filter: 'none'}}>
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