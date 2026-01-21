import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilePlus, Phone } from "lucide-react";
import PriseDeMandat from "./PriseDeMandat";
import RetoursAppel from "./RetoursAppel";

export default function CommunicationClients() {
  const [activeTab, setActiveTab] = useState("prise-mandat");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Communication clients
          </h1>
          <p className="text-slate-400">Gestion des prises de mandat et retours d'appel</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 h-12 mb-6">
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

          <TabsContent value="prise-mandat" className="mt-0">
            <PriseDeMandat />
          </TabsContent>

          <TabsContent value="retours-appel" className="mt-0">
            <RetoursAppel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}