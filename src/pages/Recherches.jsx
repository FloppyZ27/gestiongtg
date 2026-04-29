import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Grid3x3, FileText, Search as SearchIcon, Link2 } from "lucide-react";
import Lots from "./Lots";
import Dashboard from "./Dashboard";
import ChaineDeTitre from "./ChaineDeTitre";

export default function Recherches() {
  const [activeTab, setActiveTab] = useState("lots");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-blue-400">
                Recherches
              </h1>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69033e618d595dd20c703c3b/511fe556f_11_GTG_refonte_logo_GTG-ETOILE-RVB-VF.png"
                alt="GTG Logo"
                className="w-10 h-auto"
                style={{ filter: 'hue-rotate(200deg) saturate(1.2) brightness(1.1)' }}
              />
            </div>
            <p className="text-slate-400">Consultez les lots et les actes</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700 w-full md:w-auto grid grid-cols-3 h-auto mb-6">
            <TabsTrigger
              value="lots"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 py-3 text-base"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Lots
            </TabsTrigger>
            <TabsTrigger
              value="actes"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 py-3 text-base"
            >
              <FileText className="w-4 h-4 mr-2" />
              Actes
            </TabsTrigger>
            <TabsTrigger
              value="chaine"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 py-3 text-base"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Chaine de Titre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lots" className="mt-0">
            <Lots />
          </TabsContent>

          <TabsContent value="actes" className="mt-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="chaine" className="mt-0">
            <ChaineDeTitre />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}