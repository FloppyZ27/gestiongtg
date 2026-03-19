import React from "react";
import { Shield, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function CompteInactif() {
  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <Shield className="w-24 h-24 text-red-400 mx-auto mb-4" />
            <AlertTriangle className="w-12 h-12 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Compte Inactif</h1>
          <p className="text-xl text-slate-300">Accès interrompu</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
              <div className="space-y-3">
                <p className="text-white font-semibold text-lg">
                  Votre compte est actuellement inactif
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Vous n'avez plus accès aux fonctionnalités de l'application. Cette restriction peut être due à plusieurs raisons telles qu'un départ de l'entreprise, une suspension temporaire ou une mise à jour de vos permissions.
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Si vous pensez qu'il s'agit d'une erreur ou si vous avez besoin de réactiver votre compte, veuillez contacter un administrateur système.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-white font-semibold mb-3">Que faire maintenant ?</h3>
              <ul className="space-y-2 text-slate-300 ml-6">
                <li className="list-disc">Contactez votre superviseur ou le département des ressources humaines</li>
                <li className="list-disc">Envoyez un courriel à l'équipe d'administration système</li>
                <li className="list-disc">Vérifiez auprès de votre gestionnaire la raison de cette désactivation</li>
              </ul>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg"
                size="lg"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} Girard Tremblay Gilbert. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}