import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Phone, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PriseDeMandat from "./PriseDeMandat";
import RetoursAppel from "./RetoursAppel";

export default function CommunicationClients() {
  const [activeTab, setActiveTab] = useState("prise-mandat");
  const priseMandatRef = useRef();
  const retoursAppelRef = useRef();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: retoursAppels = [] } = useQuery({
    queryKey: ['retoursAppels'],
    queryFn: () => base44.entities.RetourAppel.filter({}, '-date_appel'),
    initialData: [],
  });

  const retourAppelCount = user ? retoursAppels.filter(r => 
    r.utilisateur_assigne === user.email && r.statut === "Retour d'appel"
  ).length : 0;

  const handleNewMandat = () => {
    setActiveTab("prise-mandat");
    setTimeout(() => {
      if (priseMandatRef.current && priseMandatRef.current.openNewDialog) {
        priseMandatRef.current.openNewDialog();
      }
    }, 50);
  };

  const handleNewRetourAppel = () => {
    setActiveTab("retours-appel");
    setTimeout(() => {
      if (retoursAppelRef.current && retoursAppelRef.current.openNewDialog) {
        retoursAppelRef.current.openNewDialog();
      }
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Communication clients
          </h1>
          <p className="text-slate-400">Gestion des prises de mandat et retours d'appel</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-3 mb-0">
            <div className="flex justify-center">
              <TabsList className="bg-slate-800/50 h-14 w-full">
                <TabsTrigger 
                  value="prise-mandat" 
                  className="text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 flex items-center gap-2 flex-1"
                >
                  <FilePlus className="w-4 h-4" />
                  Prise de mandat
                </TabsTrigger>
                <TabsTrigger 
                  value="retours-appel" 
                  className="text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-2 relative flex-1"
                >
                  <Phone className="w-4 h-4" />
                  Retours d'appel
                  {retourAppelCount > 0 && (
                    <div className="ml-2 bg-red-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {retourAppelCount}
                    </div>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex justify-end gap-2">
              {activeTab === "prise-mandat" && (
                <>
                  <Button 
                    onClick={() => {
                      // Export CSV logic for prise de mandat
                      const csvData = priseMandats.map(pm => ({
                        Arpenteur: pm.arpenteur_geometre,
                        Client: pm.client_info?.prenom || pm.client_info?.nom ? `${pm.client_info.prenom || ''} ${pm.client_info.nom || ''}`.trim() : '',
                        Adresse: pm.adresse_travaux ? `${pm.adresse_travaux.numeros_civiques?.[0] || ''} ${pm.adresse_travaux.rue || ''}, ${pm.adresse_travaux.ville || ''}`.trim() : '',
                        Mandats: pm.mandats?.map(m => m.type_mandat).join('; ') || '',
                        Statut: pm.statut,
                        Date: pm.created_date
                      }));
                      const headers = Object.keys(csvData[0] || {}).join(',');
                      const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
                      const csv = [headers, ...rows].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `prise-mandat-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Extraction CSV
                  </Button>
                  <Button 
                    onClick={handleNewMandat}
                    size="sm"
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau mandat
                  </Button>
                </>
              )}
              {activeTab === "retours-appel" && (
                <>
                  <Button 
                    onClick={() => {
                      // Export CSV logic for retours d'appel
                      const csvData = retoursAppels.map(ra => ({
                        Dossier: ra.dossier_id || '',
                        Client: ra.client_nom || '',
                        Téléphone: ra.client_telephone || '',
                        Utilisateur: ra.utilisateur_assigne || '',
                        Date: ra.date_appel,
                        Raison: ra.raison,
                        Statut: ra.statut
                      }));
                      const headers = Object.keys(csvData[0] || {}).join(',');
                      const rows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
                      const csv = [headers, ...rows].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `retours-appel-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    size="sm"
                    className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Extraction CSV
                  </Button>
                  <Button 
                    onClick={handleNewRetourAppel}
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau retour d'appel
                  </Button>
                </>
              )}
            </div>
          </div>

          <TabsContent value="prise-mandat" className="mt-0">
            <PriseDeMandat ref={priseMandatRef} />
          </TabsContent>

          <TabsContent value="retours-appel" className="mt-0">
            <RetoursAppel ref={retoursAppelRef} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}