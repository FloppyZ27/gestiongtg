import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, FileText, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notaires() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: actes, isLoading } = useQuery({
    queryKey: ['actes'],
    queryFn: () => base44.entities.Acte.list('-created_date'),
    initialData: [],
  });

  // Extraire tous les notaires uniques avec le nombre d'actes
  const notairesData = React.useMemo(() => {
    const notairesMap = {};
    
    actes.forEach(acte => {
      if (acte.notaire) {
        if (!notairesMap[acte.notaire]) {
          notairesMap[acte.notaire] = {
            nom: acte.notaire,
            nombreActes: 0,
            actes: []
          };
        }
        notairesMap[acte.notaire].nombreActes++;
        notairesMap[acte.notaire].actes.push(acte);
      }
    });

    return Object.values(notairesMap).sort((a, b) => b.nombreActes - a.nombreActes);
  }, [actes]);

  const filteredNotaires = notairesData.filter(notaire => 
    notaire.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalNotaires = notairesData.length;
  const totalActes = actes.length;

  const statsCards = [
    {
      title: "Total des notaires",
      value: totalNotaires,
      icon: Users,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Total des actes",
      value: totalActes,
      icon: FileText,
      gradient: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      title: "Moyenne par notaire",
      value: totalNotaires > 0 ? Math.round(totalActes / totalNotaires) : 0,
      icon: FileText,
      gradient: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Notaires
              </h1>
              <User className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Liste complète des notaires enregistrés</p>
          </div>
        </div>

        {/* Stats Cards */}
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

        {/* Search Bar */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Liste des notaires</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un notaire..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full bg-slate-800" />
                ))}
              </div>
            ) : filteredNotaires.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto text-slate-700 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucun notaire trouvé</h3>
                <p className="text-slate-400">
                  {searchTerm ? "Aucun résultat pour votre recherche" : "Commencez par créer des actes"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotaires.map((notaire, index) => (
                  <Card key={index} className="border-slate-700 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800 transition-all hover:shadow-lg hover:scale-105">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg">
                              {notaire.nom}
                            </h3>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Actes enregistrés</span>
                        </div>
                        <Badge 
                          variant="secondary"
                          className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border font-semibold"
                        >
                          {notaire.nombreActes}
                        </Badge>
                      </div>

                      {/* Types d'actes */}
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="text-xs text-slate-500 mb-2">Types d'actes</div>
                        <div className="flex flex-wrap gap-1">
                          {[...new Set(notaire.actes.map(a => a.type_acte))].slice(0, 3).map((type, idx) => (
                            <Badge 
                              key={idx}
                              variant="outline"
                              className="text-xs bg-slate-700/30 text-slate-300 border-slate-600"
                            >
                              {type}
                            </Badge>
                          ))}
                          {[...new Set(notaire.actes.map(a => a.type_acte))].length > 3 && (
                            <Badge 
                              variant="outline"
                              className="text-xs bg-slate-700/30 text-slate-300 border-slate-600"
                            >
                              +{[...new Set(notaire.actes.map(a => a.type_acte))].length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}