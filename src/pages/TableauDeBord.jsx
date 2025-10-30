import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FolderOpen, CheckCircle, TrendingUp, Users, FileText, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, startOfMonth, startOfYear, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

export default function TableauDeBord() {
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: actes = [] } = useQuery({
    queryKey: ['actes'],
    queryFn: () => base44.entities.Acte.list('-created_date'),
    initialData: [],
  });

  const { data: entreeTemps = [] } = useQuery({
    queryKey: ['allEntreeTemps'],
    queryFn: () => base44.entities.EntreeTemps.list('-date'),
    initialData: [],
  });

  // Calculs des statistiques
  const now = new Date();
  const weekStart = startOfWeek(now, { locale: fr });
  const monthStart = startOfMonth(now);
  const yearStart = startOfYear(now);

  const dossiersOuverts = dossiers.filter(d => d.statut === 'en_cours');
  const dossiersTerminesThisWeek = dossiers.filter(d => 
    d.statut === 'terminé' && d.updated_date && isAfter(new Date(d.updated_date), weekStart)
  );
  const dossiersTerminesThisMonth = dossiers.filter(d => 
    d.statut === 'terminé' && d.updated_date && isAfter(new Date(d.updated_date), monthStart)
  );
  const dossiersTerminesThisYear = dossiers.filter(d => 
    d.statut === 'terminé' && d.updated_date && isAfter(new Date(d.updated_date), yearStart)
  );

  // Derniers dossiers ouverts
  const derniersDossiers = dossiers
    .filter(d => d.statut === 'en_cours')
    .slice(0, 5);

  // Dossiers par arpenteur (utilisateur)
  const dossiersParArpenteur = users.map(user => ({
    user,
    count: dossiers.filter(d => d.responsable_email === user.email && d.statut === 'en_cours').length
  })).filter(item => item.count > 0).sort((a, b) => b.count - a.count);

  // Statistiques par mandat (titre du dossier)
  const mandatCounts = {};
  dossiersOuverts.forEach(d => {
    const mandat = d.titre || 'Non spécifié';
    mandatCounts[mandat] = (mandatCounts[mandat] || 0) + 1;
  });
  const topMandats = Object.entries(mandatCounts)
    .map(([mandat, count]) => ({ mandat, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Heures totales cette semaine
  const heuresThisWeek = entreeTemps
    .filter(e => e.date && isAfter(new Date(e.date), weekStart))
    .reduce((sum, e) => sum + (e.heures || 0), 0);

  // Heures totales ce mois
  const heuresThisMonth = entreeTemps
    .filter(e => e.date && isAfter(new Date(e.date), monthStart))
    .reduce((sum, e) => sum + (e.heures || 0), 0);

  const statsCards = [
    {
      title: "Dossiers ouverts",
      value: dossiersOuverts.length,
      icon: FolderOpen,
      gradient: "from-emerald-500 to-teal-600",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      title: "Terminés cette semaine",
      value: dossiersTerminesThisWeek.length,
      icon: CheckCircle,
      gradient: "from-cyan-500 to-blue-600",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
    },
    {
      title: "Terminés ce mois",
      value: dossiersTerminesThisMonth.length,
      icon: Calendar,
      gradient: "from-purple-500 to-pink-600",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      title: "Terminés cette année",
      value: dossiersTerminesThisYear.length,
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-600",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
    },
    {
      title: "Total actes enregistrés",
      value: actes.length,
      icon: FileText,
      gradient: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
    },
    {
      title: "Heures cette semaine",
      value: Math.round(heuresThisWeek * 10) / 10,
      icon: Clock,
      gradient: "from-green-500 to-emerald-600",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
    },
  ];

  const getStatusColor = (statut) => {
    const colors = {
      'en_cours': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'en_attente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'terminé': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'archivé': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[statut] || colors['en_cours'];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Tableau de Bord
            </h1>
            <p className="text-slate-400">Vue d'ensemble de vos activités</p>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Derniers dossiers ouverts */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-400" />
                Derniers dossiers ouverts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {derniersDossiers.map((dossier) => (
                  <div key={dossier.id} className="p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{dossier.titre}</h4>
                        <p className="text-sm text-slate-400">N° {dossier.numero_dossier}</p>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(dossier.statut)} border`}>
                        {dossier.statut}
                      </Badge>
                    </div>
                    {dossier.date_ouverture && (
                      <p className="text-xs text-slate-500">
                        Ouvert le {format(new Date(dossier.date_ouverture), "dd MMM yyyy", { locale: fr })}
                      </p>
                    )}
                  </div>
                ))}
                {derniersDossiers.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun dossier ouvert</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dossiers par arpenteur */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Dossiers ouverts par arpenteur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {dossiersParArpenteur.map((item, index) => (
                  <div key={item.user.email} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                        'bg-gradient-to-br from-emerald-500 to-teal-500'
                      }`}>
                        <span className="text-white font-bold text-sm">{item.user.full_name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.user.full_name}</p>
                        <p className="text-xs text-slate-400">{item.user.poste || 'Arpenteur'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-400">{item.count}</p>
                      <p className="text-xs text-slate-500">dossier{item.count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
                {dossiersParArpenteur.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun dossier assigné</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top mandats */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Top 5 Mandats en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {topMandats.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-white font-medium truncate">{item.mandat}</p>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-400 ml-2">
                      {item.count}
                    </Badge>
                  </div>
                ))}
                {topMandats.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun mandat en cours</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques temporelles */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Statistiques temporelles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-sm text-slate-400 mb-1">Heures cette semaine</p>
                  <p className="text-3xl font-bold text-emerald-400">{Math.round(heuresThisWeek * 10) / 10}h</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20">
                  <p className="text-sm text-slate-400 mb-1">Heures ce mois</p>
                  <p className="text-3xl font-bold text-cyan-400">{Math.round(heuresThisMonth * 10) / 10}h</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Taux de complétion</p>
                    <p className="text-xl font-bold text-white">
                      {dossiers.length > 0 ? Math.round((dossiers.filter(d => d.statut === 'terminé').length / dossiers.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Total dossiers</p>
                    <p className="text-xl font-bold text-white">{dossiers.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}