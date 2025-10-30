import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, FileText, Calendar, User, Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      color: "bg-blue-500",
    },
    {
      title: "Ce mois",
      value: actes.filter(a => {
        const acteDate = new Date(a.date_bpd);
        const now = new Date();
        return acteDate.getMonth() === now.getMonth() && acteDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      color: "bg-green-500",
    },
    {
      title: "Types d'actes",
      value: new Set(actes.map(a => a.type_acte)).size,
      icon: FileText,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Tableau de bord</h1>
            <p className="text-slate-600 mt-2">Gestion de vos actes notariés</p>
          </div>
          <Link to={createPageUrl("AjouterActe")}>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-5 h-5 mr-2" />
              Nouvel acte
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-10 rounded-full transform translate-x-8 -translate-y-8`} />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} bg-opacity-20`}>
                    <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="border-b border-slate-200 bg-white">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-xl font-bold text-slate-900">Liste des actes</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un acte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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