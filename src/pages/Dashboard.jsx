
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, FileText, Calendar, TrendingUp, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ActesList from "../components/actes/ActesList";
import ActeDetails from "../components/actes/ActeDetails";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActe, setSelectedActe] = useState(null);
  const [sortField, setSortField] = useState('created_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterTypeActe, setFilterTypeActe] = useState("all");
  const [filterCirconscription, setFilterCirconscription] = useState("all");

  const { data: actes, isLoading } = useQuery({
    queryKey: ['actes'],
    queryFn: () => base44.entities.Acte.list('-created_date'),
    initialData: [],
  });

  const filteredActes = actes.filter(acte => {
    const searchLower = searchTerm.toLowerCase();
    
    // Recherche dans les vendeurs
    const vendeursMatch = acte.vendeurs?.some(v => 
      v.nom?.toLowerCase().includes(searchLower) || 
      v.prenom?.toLowerCase().includes(searchLower)
    );
    
    // Recherche dans les acheteurs
    const acheteursMatch = acte.acheteurs?.some(a => 
      a.nom?.toLowerCase().includes(searchLower) || 
      a.prenom?.toLowerCase().includes(searchLower)
    );
    
    // Filtre par type d'acte
    const typeMatch = filterTypeActe === "all" || acte.type_acte === filterTypeActe;
    
    // Filtre par circonscription
    const circonscriptionMatch = filterCirconscription === "all" || acte.circonscription_fonciere === filterCirconscription;
    
    return (
      typeMatch &&
      circonscriptionMatch &&
      (acte.numero_acte?.toLowerCase().includes(searchLower) ||
      acte.notaire?.toLowerCase().includes(searchLower) ||
      acte.type_acte?.toLowerCase().includes(searchLower) ||
      acte.circonscription_fonciere?.toLowerCase().includes(searchLower) ||
      vendeursMatch ||
      acheteursMatch)
    );
  });

  const sortedActes = [...filteredActes].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle nested fields for vendeurs and acheteurs
    if (sortField === 'vendeurs') {
      aValue = a.vendeurs?.length || 0;
      bValue = b.vendeurs?.length || 0;
    } else if (sortField === 'acheteurs') {
      aValue = a.acheteurs?.length || 0;
      bValue = b.acheteurs?.length || 0;
    }

    // Handle date fields
    if (sortField === 'date_bpd' || sortField === 'created_date') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }

    // Handle string fields (including numero_acte)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      // Try to compare as numbers if they look like numbers
      const aNum = parseFloat(aValue.replace(/[^\d.-]/g, ''));
      const bNum = parseFloat(bValue.replace(/[^\d.-]/g, ''));
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        aValue = aNum;
        bValue = bNum;
      } else {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
    } else if (typeof aValue === 'string') { // For cases where only aValue is string, bValue might be null/undefined initially
        aValue = aValue.toLowerCase();
        // bValue will be handled by the undefined/null check below
    } else if (typeof bValue === 'string') { // For cases where only bValue is string
        bValue = bValue.toLowerCase();
        // aValue will be handled by the undefined/null check below
    }


    // Handle undefined/null values
    if (aValue === undefined || aValue === null) aValue = sortDirection === 'asc' ? Infinity : -Infinity;
    if (bValue === undefined || bValue === null) bValue = sortDirection === 'asc' ? Infinity : -Infinity;

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const statsCards = [
    {
      title: "Total des actes",
      value: actes.length,
      icon: FileText,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Ce mois",
      value: actes.filter(a => {
        const acteDate = new Date(a.date_bpd);
        const now = new Date();
        return acteDate.getMonth() === now.getMonth() && acteDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      gradient: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      title: "Types d'actes",
      value: new Set(actes.map(a => a.type_acte)).size,
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
  ];

  const typesActes = ["Vente", "Cession", "Donation", "Déclaration de Transmission", "Jugement", "Rectification", "Retrocession", "Servitude", "Bornage"];
  const circonscriptions = ["Lac-Saint-Jean-Est", "Lac-Saint-Jean-Ouest", "Chicoutimi"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Actes
              </h1>
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion de vos actes d'arpentage</p>
          </div>
          <Link to={createPageUrl("AjouterActe")}>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-200 border-0">
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
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-800">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">Liste des actes</CardTitle>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher par acte, notaire, vendeur, acheteur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                
                {/* Filtres */}
                <div className="flex flex-wrap gap-3">
                  <Select value={filterTypeActe} onValueChange={setFilterTypeActe}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Type d'acte" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                      {typesActes.map((type) => (
                        <SelectItem key={type} value={type} className="text-white">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterCirconscription} onValueChange={setFilterCirconscription}>
                    <SelectTrigger className="w-52 bg-slate-800/50 border-slate-700 text-white">
                      <SelectValue placeholder="Circonscription" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                      {circonscriptions.map((circ) => (
                        <SelectItem key={circ} value={circ} className="text-white">
                          {circ}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {(filterTypeActe !== "all" || filterCirconscription !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilterTypeActe("all");
                        setFilterCirconscription("all");
                      }}
                      className="bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <ActesList 
              actes={sortedActes}
              isLoading={isLoading}
              onSelectActe={setSelectedActe}
              onSort={handleSort}
              sortField={sortField}
              sortDirection={sortDirection}
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
