import React, { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PriseDeMandat from "./PriseDeMandat";
import RetoursAppel from "./RetoursAppel";

export default function CommunicationClients() {
  const [activeTab, setActiveTab] = useState("prise-mandat");
  const priseMandatRef = useRef();
  const retoursAppelRef = useRef();

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
          <div className="flex items-center justify-between gap-4 mb-2">
            <TabsList className="grid grid-cols-2 bg-slate-800/50 h-12 flex-1 max-w-md">
              <TabsTrigger 
                value="prise-mandat" 
                className="text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 flex items-center gap-2"
              >
                <FilePlus className="w-4 h-4" />
                Prise de mandat
              </TabsTrigger>
              <TabsTrigger 
                value="retours-appel" 
                className="text-sm data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Retours d'appel
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <Button 
                onClick={handleNewMandat}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau mandat
              </Button>
              <Button 
                onClick={handleNewRetourAppel}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/50"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nouveau retour d'appel
              </Button>
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