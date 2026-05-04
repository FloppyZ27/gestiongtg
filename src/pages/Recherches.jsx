import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
              <SearchIcon className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-slate-400">Consultez les lots et les actes</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid grid-cols-3 w-full max-w-md bg-slate-900/80 border border-slate-700">
            <TabsTrigger value="lots">Lots</TabsTrigger>
            <TabsTrigger value="actes">Actes</TabsTrigger>
            <TabsTrigger value="chaine">Chaîne de titre</TabsTrigger>
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