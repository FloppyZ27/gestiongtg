import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Grid3x3, FileText, Search as SearchIcon } from "lucide-react";
import Lots from "./Lots";
import Dashboard from "./Dashboard";

export default function Recherches() {
  const [activeTab, setActiveTab] = useState("lots");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SearchIcon className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Recherches
            </h1>
            <p className="text-slate-400">Consultez les lots et les actes</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border border-slate-700 w-full md:w-auto grid grid-cols-2 h-auto mb-6">
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
          </TabsList>

          <TabsContent value="lots" className="mt-0">
            <Lots />
          </TabsContent>

          <TabsContent value="actes" className="mt-0">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}