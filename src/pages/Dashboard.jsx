import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, FileText, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ActesList from "../components/actes/ActesList";
import ActeDetails from "../components/actes/ActeDetails";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActe, setSelectedActe] = useState(null);

  const { data: actes, isLoading } = useQuery({
    queryKey: ['actes'],
    queryFn: () => base44.entities.Acte.list('-created_date'),
    initialData: [],
  });

  const filteredActes = actes.filter(acte => {
    const searchLower = searchTerm.toLowerCase();
    return (
      acte.numero_acte?.toLowerCase().includes(searchLower) ||
      acte.notaire?.toLowerCase().includes(searchLower) ||
      acte.type_acte?.toLowerCase().includes(searchLower)
    );
  });

  const statsCards = [
    {
      title: "Total des actes",
      value: actes.length,
      icon: FileText,
      gradient: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      title: "Ce mois",
      value: actes.filter(a => {
        const acteDate = new Date(a.date_bpd);
        const now = new Date();
        return acteDate.getMonth() === now.getMonth() && acteDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      gradient: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Types d'actes",
      value: new Set(actes.map(a => a.type_acte)).size,
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-600",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-slate-400">Gestion de vos actes notariés</p>
          </div>
          <Link to={createPageUrl("AjouterActe")}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/50 transition-all duration-200 border-0">
              <Plus className="w-5 h-5 mr-2" />
              Nouvel acte
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <CardTitle className="text-3xl font-bold mt-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.iconBg} backdrop-blur-sm`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Liste des actes</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un acte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ActesList 
              actes={filteredActes}
              isLoading={isLoading}
              onSelectActe={setSelectedActe}
            />
          </CardContent>
        </Card>

        {selectedActe && (
          <ActeDetails 
            acte={selectedActe}
            onClose={() => setSelectedActe(null)}
          />
        )}
      </div>
    </div>
  );
}