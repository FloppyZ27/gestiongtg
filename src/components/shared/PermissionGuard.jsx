import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const PAGE_DISPLAY_NAMES = {
  "TableauDeBord": "Tableau de Bord",
  "Profil": "Profil",
  "Calendrier": "Calendrier",
  "CommunicationClients": "Communication clients",
  "Dossiers": "Dossiers",
  "Clients": "Clients",
  "GestionDeMandat": "Gestion de Mandat",
  "CeduleTerrain": "Cédule Terrain",
  "Recherches": "Recherches",
  "SharePoint": "SharePoint",
  "Administration": "Administration"
};

export default function PermissionGuard({ children, pageName }) {
  const [showWarning, setShowWarning] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);
  const navigate = useNavigate();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['permissionsTemplates'],
    queryFn: () => base44.entities.PermissionsTemplate.list(),
    initialData: [],
  });

  useEffect(() => {
    if (userLoading || templatesLoading || !user || !pageName) {
      setHasAccess(null);
      return;
    }

    console.log(`=== Vérification d'accès pour ${user.email} ===`);
    console.log(`Page demandée: ${pageName}`);
    console.log(`Rôle utilisateur: ${user.role}`);
    console.log(`Poste utilisateur: ${user.poste}`);

    // Admin système a toujours accès (rôle "admin" en minuscule)
    if (user.role === 'admin') {
      console.log(`✅ Accès admin système - accès total`);
      setHasAccess(true);
      return;
    }

    // Vérification par rôle
    const roleTemplate = templates.find(t => t.type === 'role' && t.nom === user.role);
    console.log(`Template de rôle trouvé:`, roleTemplate);
    
    if (roleTemplate) {
      const allowedPagesByRole = roleTemplate.permissions_pages || [];
      console.log(`Pages autorisées par rôle:`, allowedPagesByRole);
      
      if (!allowedPagesByRole.includes(pageName)) {
        console.log(`❌ Accès refusé par rôle: ${user.role} n'a pas accès à ${pageName}`);
        setHasAccess(false);
        setShowWarning(true);
        return;
      }
      console.log(`✓ Rôle autorise la page`);
    } else {
      console.log(`⚠️ Aucun template trouvé pour le rôle: ${user.role} - accès par défaut refusé`);
      // Si aucun template de rôle, refuser l'accès par sécurité
      setHasAccess(false);
      setShowWarning(true);
      return;
    }

    // Vérification par poste
    const posteTemplate = templates.find(t => t.type === 'poste' && t.nom === user.poste);
    console.log(`Template de poste trouvé:`, posteTemplate);
    
    if (posteTemplate) {
      const allowedPagesByPoste = posteTemplate.permissions_pages || [];
      console.log(`Pages autorisées par poste:`, allowedPagesByPoste);
      
      if (!allowedPagesByPoste.includes(pageName)) {
        console.log(`❌ Accès refusé par poste: ${user.poste} n'a pas accès à ${pageName}`);
        setHasAccess(false);
        setShowWarning(true);
        return;
      }
      console.log(`✓ Poste autorise la page`);
    } else {
      console.log(`⚠️ Aucun template trouvé pour le poste: ${user.poste} - vérification par rôle seulement`);
    }

    console.log(`✅ Accès autorisé à ${pageName}`);
    setHasAccess(true);
  }, [user, pageName, templates, userLoading, templatesLoading]);

  const handleGoBack = () => {
    setShowWarning(false);
    navigate(createPageUrl("TableauDeBord"));
  };

  // Afficher un écran de chargement si les données ne sont pas prêtes
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Vérification des permissions...</h2>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-6 h-6" />
                Accès restreint
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium mb-1">
                    Vous n'avez pas accès à cette page
                  </p>
                  <p className="text-sm text-slate-400">
                    Votre poste <span className="text-yellow-400 font-medium">({user?.poste})</span> ne dispose pas des permissions nécessaires pour accéder à <span className="text-white font-medium">{PAGE_DISPLAY_NAMES[pageName] || pageName}</span>.
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Veuillez contacter un administrateur si vous pensez avoir besoin d'accéder à cette page.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleGoBack}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Accès restreint</h2>
            <p className="text-slate-400">Chargement...</p>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}