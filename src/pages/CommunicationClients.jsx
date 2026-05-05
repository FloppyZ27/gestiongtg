import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Phone, Plus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PlaceAffaireTabs from "@/components/dossiers/PlaceAffaireTabs";
import PriseDeMandat from "./PriseDeMandat";
import RetoursAppel from "./RetoursAppel";

const EQUIPES = [
  { label: "Toutes", value: "Toutes" },
  { label: "Samuel", value: "Samuel" },
  { label: "Pierre-Luc", value: "Pierre-Luc" },
  { label: "Dany", value: "Dany" },
];

export default function CommunicationClients() {
  const [activeTab, setActiveTab] = useState("prise-mandat");
  const [filterPlaceAffaire, setFilterPlaceAffaire] = useState("tous");
  const [filterEquipe, setFilterEquipe] = useState("Toutes");
  const [activePriseMandatTab, setActivePriseMandatTab] = useState("nouveau");
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  const priseMandatRef = useRef();
  const retoursAppelRef = useRef();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Appliquer les filtres par défaut depuis user.place_affaire et user.equipe
  React.useEffect(() => {
    if (!user || defaultsApplied) return;

    const place = user.place_affaire;
    const equipe = user.equipe;

    if (place === "Alma" || place === "Saguenay") setFilterPlaceAffaire(place);
    const validEquipes = ["Samuel", "Pierre-Luc", "Dany"];
    if (equipe && validEquipes.includes(equipe)) setFilterEquipe(equipe);

    setDefaultsApplied(true);
  }, [user, defaultsApplied]);

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

  // Comptes par équipe pour PriseDeMandat
  const equipeCountsPriseMandat = React.useMemo(() => {
    const counts = {};
    EQUIPES.forEach(e => {
      counts[e.value] = e.value === "Toutes"
        ? validPriseMandats.length
        : validPriseMandats.filter(p => p.arpenteur_geometre?.includes(e.value)).length;
    });
    return counts;
  }, [validPriseMandats]);

  // Comptes par équipe pour RetoursAppel
  const equipeCountsRetoursAppel = React.useMemo(() => {
    const dossierMap = Object.fromEntries(dossiers.map(d => [d.id, d]));
    const counts = {};
    EQUIPES.forEach(e => {
      counts[e.value] = e.value === "Toutes"
        ? retoursAppels.length
        : retoursAppels.filter(r => dossierMap[r.dossier_id]?.arpenteur_geometre?.includes(e.value)).length;
    });
    return counts;
  }, [retoursAppels, dossiers]);

  const handleNewMandat = () => {
    setActiveTab("prise-mandat");
    setTimeout(() => {
      if (priseMandatRef.current?.openNewDialog) priseMandatRef.current.openNewDialog();
    }, 50);
  };

  const handleNewRetourAppel = () => {
    setActiveTab("retours-appel");
    setTimeout(() => {
      if (retoursAppelRef.current?.openNewDialog) retoursAppelRef.current.openNewDialog();
    }, 50);
  };

  const equipeCounts = activeTab === "prise-mandat" ? equipeCountsPriseMandat : equipeCountsRetoursAppel;

  const EquipeButtons = ({ counts }) => (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filtrer par équipe de travail</span>
      <div className="flex gap-1">
        {EQUIPES.map(e => (
          <button
            key={e.value}
            onClick={() => setFilterEquipe(e.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all border-0 ${
              filterEquipe === e.value
                ? "bg-orange-500/20 text-orange-400 border-b-2 border-orange-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {e.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              filterEquipe === e.value ? "bg-red-500/30 text-orange-300" : "bg-slate-700 text-slate-400"
            }`}>{counts[e.value] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-800/30 p-4 md:p-8">
      <style>{`
        .btn-nouveau-mandat {
          background: #10b981 !important;
          background-image: none !important;
          color: white !important;
          border: none !important;
          border-radius: 0.5rem;
          padding: 0 1.25rem;
          height: 44px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background 0.25s ease, background-image 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }
        .btn-nouveau-mandat:hover {
          background: transparent !important;
          background-image: linear-gradient(135deg, #8B0000, #CC5500) !important;
          box-shadow: 0 6px 22px rgba(139,0,0,0.55) !important;
        }
        .btn-nouveau-retour {
          background: #3b82f6 !important;
          background-image: none !important;
          color: white !important;
          border: none !important;
          border-radius: 0.5rem;
          padding: 0 1.25rem;
          height: 44px;
          font-weight: 600;
          font-size: 15px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background 0.25s ease, background-image 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        }
        .btn-nouveau-retour:hover {
          background: transparent !important;
          background-image: linear-gradient(135deg, #8B0000, #CC5500) !important;
          box-shadow: 0 6px 22px rgba(139,0,0,0.55) !important;
        }
      `}</style>
      <div className="w-full">
        <div className="flex items-start justify-between gap-3 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Communication clients
              </h1>
              <MessageCircle className="w-8 h-8 text-orange-400 flex-shrink-0" />
            </div>
            <p className="text-slate-400">Gestion des prises de mandat et retours d'appel</p>
          </div>
        </div>

        {/* Filtres globaux — au-dessus des onglets */}
        <div className="flex items-center justify-between gap-6 mb-4">
          <div className="flex flex-col gap-2">
            <PlaceAffaireTabs
              value={filterPlaceAffaire}
              onChange={setFilterPlaceAffaire}
              counts={activeTab === "prise-mandat" ? placeAffaireCounts : retourAppelCountsByPlace}
            />
            <EquipeButtons counts={activeTab === "prise-mandat" ? equipeCountsPriseMandat : equipeCountsRetoursAppel} />
          </div>
          <div className="flex gap-3">
            <button onClick={handleNewMandat} className="btn-nouveau-mandat">
              <Plus className="w-4 h-4" />
              Nouveau mandat
            </button>
            <button onClick={handleNewRetourAppel} className="btn-nouveau-retour">
              <Plus className="w-4 h-4" />
              Nouveau retour d'appel
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-0">
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
                  <div className="ml-2 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {retourAppelCount}
                  </div>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="prise-mandat" className="mt-0 overflow-visible">
            <PriseDeMandat ref={priseMandatRef} filterPlaceAffaire={filterPlaceAffaire} filterEquipeExternal={filterEquipe} onActiveTabChange={setActivePriseMandatTab} />
          </TabsContent>

          <TabsContent value="retours-appel" className="mt-0">
            <RetoursAppel ref={retoursAppelRef} filterPlaceAffaire={filterPlaceAffaire} filterEquipeExternal={filterEquipe} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}