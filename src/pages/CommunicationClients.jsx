import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Phone, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PlaceAffaireTabs from "@/components/dossiers/PlaceAffaireTabs";
import PriseDeMandat from "./PriseDeMandat";
import RetoursAppel from "./RetoursAppel";

export default function CommunicationClients() {
  const [activeTab, setActiveTab] = useState("prise-mandat");
  const [filterPlaceAffaire, setFilterPlaceAffaire] = useState("tous");
  const [activePriseMandatTab, setActivePriseMandatTab] = useState("nouveau");
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

  const { data: priseMandats = [] } = useQuery({
    queryKey: ['priseMandats'],
    queryFn: () => base44.entities.PriseMandat.list('-created_date'),
    initialData: [],
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const retourAppelCount = user ? retoursAppels.filter(r => 
    r.utilisateur_assigne === user.email && r.statut === "Retour d'appel"
  ).length : 0;

  const validStatuts = ["Nouveau mandat/Demande d'information", "Mandats à ouvrir", "Mandat non octroyé"];
  const validPriseMandats = priseMandats.filter(p => validStatuts.includes(p.statut));
  const placeAffaireCounts = {
    tous: validPriseMandats.length,
    alma: validPriseMandats.filter(p => p.place_affaire === "Alma").length,
    saguenay: validPriseMandats.filter(p => p.place_affaire === "Saguenay").length,
  };

  const retourAppelCountsByPlace = React.useMemo(() => {
    const dossierMap = Object.fromEntries(dossiers.map(d => [d.id, d]));
    return {
      tous: retoursAppels.length,
      alma: retoursAppels.filter(r => dossierMap[r.dossier_id]?.place_affaire === "Alma").length,
      saguenay: retoursAppels.filter(r => dossierMap[r.dossier_id]?.place_affaire === "Saguenay").length,
    };
  }, [retoursAppels, dossiers]);

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
      <div className="w-full">
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Communication clients
              </h1>
              <MessageCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-slate-400">Gestion des prises de mandat et retours d'appel</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-3 mb-0">
            <div className="flex justify-center">
              <TabsList className="bg-slate-800/50 h-14 w-full">
                <TabsTrigger 
                  value="prise-mandat" 
                  className="text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 flex items-center gap-2 flex-1 h-full"
                >
                  <FilePlus className="w-4 h-4" />
                  Prise de mandat
                </TabsTrigger>
                <TabsTrigger 
                  value="retours-appel" 
                  className="text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-2 relative flex-1 h-full"
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

          </div>

          <TabsContent value="prise-mandat" className="mt-6 overflow-visible">
            <div className="flex items-center justify-between gap-6 mb-1">
              <PlaceAffaireTabs
                value={filterPlaceAffaire}
                onChange={setFilterPlaceAffaire}
                counts={placeAffaireCounts}
              />
              <Button 
                onClick={handleNewMandat}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau mandat
              </Button>
            </div>
            <PriseDeMandat ref={priseMandatRef} filterPlaceAffaire={filterPlaceAffaire} onActiveTabChange={setActivePriseMandatTab} />
          </TabsContent>

          <TabsContent value="retours-appel" className="mt-6">
            <div className="flex items-center justify-between gap-6 mb-3">
              <PlaceAffaireTabs
                value={filterPlaceAffaire}
                onChange={setFilterPlaceAffaire}
                counts={retourAppelCountsByPlace}
              />
              <Button 
                onClick={handleNewRetourAppel}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau retour d'appel
              </Button>
            </div>
            <RetoursAppel ref={retoursAppelRef} filterPlaceAffaire={filterPlaceAffaire} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}