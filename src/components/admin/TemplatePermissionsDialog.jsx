import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText } from "lucide-react";

const PAGES_DISPONIBLES = [
  "Tableau de Bord",
  "Profil",
  "Calendrier",
  "Communication clients",
  "Dossiers",
  "Clients",
  "Gestion de Mandat",
  "Cédule Terrain",
  "Recherches",
  "SharePoint",
  "Administration"
];

const INFORMATIONS_DISPONIBLES = [
  "Données financières",
  "Informations clients sensibles",
  "Historique complet des dossiers",
  "Commentaires privés",
  "Données personnelles employés",
  "Rapports d'activité",
  "Logs système"
];

export default function TemplatePermissionsDialog({ open, onOpenChange, template, onSave }) {
  const [selectedPages, setSelectedPages] = useState([]);
  const [selectedInfos, setSelectedInfos] = useState([]);

  useEffect(() => {
    if (template) {
      setSelectedPages(template.permissions_pages || []);
      setSelectedInfos(template.permissions_informations || []);
    }
  }, [template]);

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
          <DialogTitle className="text-2xl">
            Permissions {template?.type === 'poste' ? 'du poste' : 'du rôle'} - {template?.nom}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Pages */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              <Label className="text-lg text-emerald-400">Accès aux pages</Label>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              {PAGES_DISPONIBLES.map(page => (
                <div key={page} className="flex items-center gap-2">
                  <Checkbox
                    id={`tpl-page-${page}`}
                    checked={selectedPages.includes(page)}
                    onCheckedChange={() => togglePage(page)}
                    className="border-slate-600"
                  />
                  <label htmlFor={`tpl-page-${page}`} className="text-sm text-slate-300 cursor-pointer">
                    {page}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Informations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <Label className="text-lg text-blue-400">Accès aux informations</Label>
            </div>
            <div className="grid grid-cols-2 gap-3 pl-7">
              {INFORMATIONS_DISPONIBLES.map(info => (
                <div key={info} className="flex items-center gap-2">
                  <Checkbox
                    id={`tpl-info-${info}`}
                    checked={selectedInfos.includes(info)}
                    onCheckedChange={() => toggleInfo(info)}
                    className="border-slate-600"
                  />
                  <label htmlFor={`tpl-info-${info}`} className="text-sm text-slate-300 cursor-pointer">
                    {info}
                  </label>
                </div>
              ))}
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