import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, TrendingUp, AlertCircle, CheckCircle2, 
  MapPin, FileText, User, BarChart3, Truck
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, isSameDay, differenceInDays, addWeeks, differenceInCalendarWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import EditDossierDialog from "@/components/dossiers/EditDossierDialog";


const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  }
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

const getUserInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

export default function TableauDeBord() {
  const navigate = useNavigate();
  const [editingDossier, setEditingDossier] = useState(null);
  const [periodeRendement, setPeriodeRendement] = useState("semaine");
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const today = new Date();
  const userEquipe = user?.equipe || null;

  // Construire les cartes mandats (comme GestionDeMandat)
  const allMandatCards = [];
  dossiers.forEach(dossier => {
    dossier.mandats?.forEach((mandat, mandatIndex) => {
      allMandatCards.push({ id: `${dossier.id}-${mandatIndex}`, dossier, mandat, mandatIndex });
    });
  });

  // Arpenteur correspondant à l'équipe de l'utilisateur
  const arpenteurEquipe = userEquipe === 'Samuel' ? 'Samuel Guay' :
                          userEquipe === 'Dany' ? 'Dany Gaboury' :
                          userEquipe === 'Pierre-Luc' ? 'Pierre-Luc Pilote' :
                          userEquipe === 'Benjamin' ? 'Benjamin Larouche' :
                          userEquipe === 'Frédéric' ? 'Frédéric Gilbert' : null;

  // Cartes du calendrier filtrées par arpenteur du dossier et date
  const getMandatCardsForDay = (date) => {
    return allMandatCards.filter(card => {
      if (!card.mandat.date_livraison) return false;
      if (!isSameDay(new Date(card.mandat.date_livraison + 'T00:00:00'), date)) return false;
      if (!arpenteurEquipe) return false;
      return card.dossier.arpenteur_geometre === arpenteurEquipe;
    });
  };

  // Semaine en cours (lundi-vendredi)
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { locale: fr, weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(today, weekOffset), { locale: fr, weekStartsOn: 1 });
  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
  }

  // Dossiers à montrer aujourd'hui
  const todayStr = format(today, 'yyyy-MM-dd');
  const dossiersAMonterAujourdhui = dossiers.filter(d => {
    if (d.statut === 'Fermé') return false;
    return d.mandats?.some(m => {
      if (!m.date_terrain) return false;
      if (m.date_terrain !== todayStr) return false;
      return m.terrain?.donneur === user?.full_name || m.terrains_list?.some(t => t.donneur === user?.full_name);
    });
  });

  // Statistiques dossiers terminés
  const getPeriodDates = () => {
    if (periodeRendement === "semaine") {
      return { start: weekStart, end: weekEnd };
    } else if (periodeRendement === "mois") {
      return { start: startOfMonth(today), end: endOfMonth(today) };
    } else {
      return { start: startOfYear(today), end: endOfYear(today) };
    }
  };

  const periodDates = getPeriodDates();
  
  const dossiersTermines = dossiers.filter(d => {
    if (!d.date_fermeture) return false;
    const dateFermeture = new Date(d.date_fermeture);
    return isWithinInterval(dateFermeture, periodDates) && d.statut === 'Fermé';
  }).length;

  const dossiersOuverts = dossiers.filter(d => {
    if (!d.date_ouverture) return false;
    const dateOuverture = new Date(d.date_ouverture);
    return isWithinInterval(dateOuverture, periodDates) && d.statut === 'Ouvert';
  }).length;

  // Dossiers en retard - livraison
  const dossiersEnRetardLivraison = dossiers.filter(d => {
    if (d.statut === 'Fermé') return false;
    const arpenteurAttendu = userEquipe === 'Samuel' ? 'Samuel Guay' :
                             userEquipe === 'Dany' ? 'Dany Gaboury' :
                             userEquipe === 'Pierre-Luc' ? 'Pierre-Luc Pilote' :
                             userEquipe === 'Benjamin' ? 'Benjamin Larouche' :
                             userEquipe === 'Frédéric' ? 'Frédéric Gilbert' : null;
    if (!arpenteurAttendu || d.arpenteur_geometre !== arpenteurAttendu) return false;
    return d.mandats?.some(m => {
      if (!m.date_livraison) return true;
      return new Date(m.date_livraison) < today;
    });
  }).sort((a, b) => {
    const minDateA = Math.min(...a.mandats.filter(m => m.date_livraison).map(m => new Date(m.date_livraison).getTime()));
    const minDateB = Math.min(...b.mandats.filter(m => m.date_livraison).map(m => new Date(m.date_livraison).getTime()));
    return minDateA - minDateB;
  });

  // Dossiers en retard - terrain
  const dossiersEnRetardTerrain = dossiers.filter(d => {
    if (d.statut === 'Fermé') return false;
    return d.mandats?.some(m => {
      if (!m.date_terrain || m.statut_terrain === 'pas_de_terrain') return false;
      if (m.tache_actuelle !== 'Terrain' || m.utilisateur_assigne !== user?.email) return false;
      const dateTerrain = new Date(m.date_terrain);
      return dateTerrain < today && !isSameDay(dateTerrain, today);
    });
  }).sort((a, b) => {
    const minDateA = Math.min(...a.mandats.filter(m => m.date_terrain).map(m => new Date(m.date_terrain).getTime()));
    const minDateB = Math.min(...b.mandats.filter(m => m.date_terrain).map(m => new Date(m.date_terrain).getTime()));
    return minDateA - minDateB;
  });

  // Calcul du rendement
  const totalPeriod = dossiersOuverts + dossiersTermines;
  const pourcentageControle = totalPeriod > 0 ? Math.round((dossiersTermines / totalPeriod) * 100) : 100;
  
  let statutRendement = "En contrôle";
  let couleurStatut = "text-emerald-400";
  
  if (dossiersTermines > dossiersOuverts) {
    statutRendement = "En avance";
    couleurStatut = "text-cyan-400";
  } else if (dossiersTermines < dossiersOuverts * 0.8) {
    statutRendement = "Sous le rendement";
    couleurStatut = "text-red-400";
  }

  // Analyse statistique
  const chargeEquipe = allMandatCards.filter(c => {
    const assignedUser = users.find(u => u.email === c.mandat.utilisateur_assigne);
    return assignedUser?.equipe === userEquipe;
  }).length;
  const totalRetards = dossiersEnRetardLivraison.length + dossiersEnRetardTerrain.length;
  
  let recommandation = "";
  if (statutRendement === "Sous le rendement") {
    recommandation = `L'équipe est actuellement sous le rendement cette ${periodeRendement}. Il y a ${dossiersOuverts} dossiers ouverts contre ${dossiersTermines} terminés${totalRetards > 0 ? `, avec ${totalRetards} dossiers en retard.` : '.'}`;
  } else if (statutRendement === "En avance") {
    recommandation = `Excellente performance ! L'équipe a terminé ${dossiersTermines} dossiers cette ${periodeRendement}, dépassant les ${dossiersOuverts} nouveaux dossiers ouverts.`;
  } else {
    recommandation = `La production est équilibrée cette ${periodeRendement} avec ${dossiersTermines} dossiers terminés pour ${dossiersOuverts} ouverts.`;
  }

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = clients.find(c => c.id === id);
      return client ? `${client.prenom} ${client.nom}` : "";
    }).filter(name => name).join(", ") || "-";
  };

  const getEquipeTerrain = (dossier) => {
    const mandat = dossier.mandats?.[0];
    return mandat?.equipe_assignee || "Non assignée";
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="w-full max-w-[1800px] mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
                Tableau de Bord - {userEquipe || 'Mon Équipe'}
                <BarChart3 className="w-8 h-8 flex-shrink-0" style={{color: 'hsl(0,80%,58%)', filter: 'drop-shadow(0 0 6px hsl(22,90%,55%))'}} />
              </h1>
              <p className="text-slate-400">Vue opérationnelle de la semaine du {format(weekStart, "dd MMMM", { locale: fr })}</p>
            </div>
          </div>
        </div>

        {/* Calendrier pleine largeur */}
        {(() => {
          const mandatsSemaine = allMandatCards.filter(card => {
            if (!card.mandat.date_livraison || card.dossier.arpenteur_geometre !== arpenteurEquipe) return false;
            const d = new Date(card.mandat.date_livraison + 'T00:00:00');
            return d >= weekStart && d <= weekEnd;
          });
          const avgProgress = mandatsSemaine.length > 0
            ? Math.round(mandatsSemaine.reduce((sum, card) => {
                if (card.dossier.statut === 'Fermé') return sum + 100;
                const idx = TACHES.indexOf(card.mandat.tache_actuelle);
                return sum + (idx >= 0 ? Math.round(((idx / (TACHES.length - 1)) * 95) / 5) * 5 : 0);
              }, 0) / mandatsSemaine.length)
            : 0;
          const mandatsFermesSemaine = dossiers.filter(d => {
            if (d.statut !== 'Fermé' || !d.date_fermeture) return false;
            if (arpenteurEquipe && d.arpenteur_geometre !== arpenteurEquipe) return false;
            const df = new Date(d.date_fermeture);
            return df >= weekStart && df <= weekEnd;
          });
          return (
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 py-3">
            <div className="flex items-center w-full">
              <CardTitle className="text-white flex items-center gap-2 flex-shrink-0">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Calendrier des livraisons
              </CardTitle>
              <div className="flex-1 flex justify-center">
                {mandatsSemaine.length > 0 && (
                  <div className="flex flex-col gap-1" style={{width: '40%'}}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">Progression de la semaine</span>
                      <span className="text-[10px] font-bold text-slate-300">{avgProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-400 transition-all duration-500" style={{ width: `${avgProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center bg-slate-800/60 rounded-lg px-3 py-1.5 flex-shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wide">Fermés / Prévus</span>
                <span className="text-sm font-bold leading-tight text-foreground">
                  {mandatsFermesSemaine.length}
                  <span className="text-slate-500"> / </span>
                  {mandatsSemaine.length}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Navigation semaine */}
            <div className="flex items-center justify-start gap-3 mb-4 pb-3 border-b border-slate-800">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                style={{background:'hsl(220,13%,16%)',border:'1px solid hsl(220,10%,26%)',color:'hsl(210,11%,80%)',fontSize:'22px',cursor:'pointer',padding:'2px 10px',lineHeight:1.2,borderRadius:'8px',fontWeight:300}}
              >‹</button>
              <div className="relative flex items-center gap-2 cursor-pointer group" title="Cliquer pour choisir une date">
                <span className="font-bold text-lg text-white group-hover:text-primary transition-colors">
                  Semaine du {format(weekStart, 'd MMM', { locale: fr })} au {format(weekEnd, 'd MMM yyyy', { locale: fr })}
                </span>
                <Calendar className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors flex-shrink-0" />
                <input
                  type="date"
                  value={format(weekStart, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const d = new Date(e.target.value + 'T00:00:00');
                    const newWS = startOfWeek(d, { weekStartsOn: 1 });
                    const baseWS = startOfWeek(today, { weekStartsOn: 1 });
                    setWeekOffset(differenceInCalendarWeeks(newWS, baseWS, { weekStartsOn: 1 }));
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  style={{ zIndex: 1 }}
                />
              </div>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                style={{background:'hsl(220,13%,16%)',border:'1px solid hsl(220,10%,26%)',color:'hsl(210,11%,80%)',fontSize:'22px',cursor:'pointer',padding:'2px 10px',lineHeight:1.2,borderRadius:'8px',fontWeight:300}}
              >›</button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  style={{background:'hsl(0,80%,50%)',border:'none',color:'white',borderRadius:'8px',padding:'5px 14px',fontWeight:700,fontSize:'13px',cursor:'pointer'}}
                >Aujourd'hui</button>
              )}
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
              {weekDays.map((date) => {
                const isToday = isSameDay(date, today);
                const cardsList = getMandatCardsForDay(date);
                const dayName = format(date, 'EEE', { locale: fr });
                const dayNum = format(date, 'd');
                return (
                  <div key={date.toISOString()}>
                    <div className={`rounded-lg transition-all mb-3 ${isToday ? 'ring-2 ring-emerald-400 bg-emerald-500/20 p-4' : 'bg-slate-800/50 p-3 opacity-70'}`}>
                      <div className={`text-center ${isToday ? 'border-b-2 border-emerald-400 pb-2' : ''}`}>
                        <p className={`font-semibold capitalize ${isToday ? 'text-emerald-400 text-lg' : 'text-slate-300 text-sm'}`}>{dayName}</p>
                        <p className={`${isToday ? 'text-emerald-300 text-lg font-bold' : 'text-slate-400 text-xs'}`}>{dayNum}</p>
                      </div>
                    </div>
                    {cardsList.length > 0 ? (
                      <div className={`space-y-2 max-h-[500px] overflow-y-auto ${isToday ? '' : 'opacity-70'}`}>
                        {cardsList.map((card) => {
                          const arpColor = getArpenteurColor(card.dossier.arpenteur_geometre);
                          const [bg, , border] = arpColor.split(' ');
                          const assignedUser = users.find(u => u.email === card.mandat.utilisateur_assigne);
                          const tacheIndex = TACHES.indexOf(card.mandat.tache_actuelle);
                          const progress = card.dossier.statut === 'Fermé' ? 100 : (tacheIndex >= 0 ? Math.round(((tacheIndex / (TACHES.length - 1)) * 95) / 5) * 5 : 0);
                          return (
                            <div key={card.id} className={`${bg} rounded-lg p-2 border ${border} cursor-pointer hover:scale-[1.02] transition-all`} onClick={() => setEditingDossier(card.dossier)}>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>
                                  {getArpenteurInitials(card.dossier.arpenteur_geometre)}{card.dossier.numero_dossier}
                                </Badge>
                                <Badge className={`${getMandatColor(card.mandat.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
                                  {getAbbreviatedMandatType(card.mandat.type_mandat)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <User className="w-3 h-3 text-white flex-shrink-0" />
                                <span className="text-xs text-white font-medium truncate">{getClientsNames(card.dossier.clients_ids)}</span>
                              </div>
                              {card.mandat.adresse_travaux && formatAdresse(card.mandat.adresse_travaux) && (
                                <div className="flex items-center gap-1 mb-1">
                                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span className="text-xs text-slate-400 truncate">{formatAdresse(card.mandat.adresse_travaux)}</span>
                                </div>
                              )}
                              {card.mandat.tache_actuelle && (
                                <div className="mb-1">
                                  <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">{card.mandat.tache_actuelle}</Badge>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2 pt-1" style={{borderTop: '1px solid rgba(239,68,68,0.3)'}}>
                                {card.mandat.date_livraison ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                    <span className="text-xs text-yellow-300">{format(new Date(card.mandat.date_livraison + 'T00:00:00'), 'dd MMM yy', { locale: fr })}</span>
                                  </div>
                                ) : <div />}
                                {assignedUser ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-white font-bold">{getUserInitials(assignedUser.full_name)}</span>
                                    <Avatar className="w-5 h-5 border-2 border-emerald-500/50">
                                      <AvatarImage src={assignedUser.photo_url} />
                                      <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback>
                                    </Avatar>
                                  </div>
                                ) : <div />}
                              </div>
                              <div className="mt-2 w-full bg-slate-900/50 h-4 rounded-full overflow-hidden relative">
                                <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white drop-shadow-md leading-none">{progress}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={`text-center ${isToday ? 'text-emerald-300/60' : 'text-slate-500/60'} text-xs`}>—</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
          );
        })()}

        {/* 4 colonnes: Dossiers à monter, Retard livraison, Retard terrain, Statistiques */}
        <div className="grid gap-6 grid-cols-4">
          {/* Col 1: Dossiers à monter aujourd'hui */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-orange-500/20 to-red-500/20 py-3">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                Dossiers à monter aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {dossiersAMonterAujourdhui.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {dossiersAMonterAujourdhui.slice(0, 5).map((dossier) => {
                    const mandat = dossier.mandats?.[0];
                    const arpenteurColor = getArpenteurColor(dossier.arpenteur_geometre);
                    const bgColorClass = arpenteurColor.split(' ')[0];
                    return (
                      <div key={dossier.id} className={`${bgColorClass} rounded-lg p-3 hover:scale-[1.02] transition-all cursor-pointer border ${arpenteurColor}`} onClick={() => setEditingDossier(dossier)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`${arpenteurColor} border text-xs`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
                          <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold`}>{mandat?.type_mandat}</Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <User className="w-3 h-3 text-white flex-shrink-0" />
                          <span className="text-xs text-white font-medium truncate">{getClientsNames(dossier.clients_ids)}</span>
                        </div>
                        {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
                          <div className="flex items-start gap-1 mb-2">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-slate-400 break-words line-clamp-2">{formatAdresse(mandat.adresse_travaux)}</span>
                          </div>
                        )}
                        <Button size="sm" className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs" onClick={(e) => { e.stopPropagation(); setEditingDossier(dossier); }}>Ouvrir le dossier</Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Aucun dossier à monter aujourd'hui</p>
              )}
            </CardContent>
          </Card>

          {/* Col 2: Dossiers en retard - Livraison */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-red-500/20 to-orange-500/20 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  Dossiers en retard - Livraison
                </CardTitle>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{dossiersEnRetardLivraison.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {dossiersEnRetardLivraison.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {dossiersEnRetardLivraison.slice(0, 5).map((dossier) => {
                    const mandat = dossier.mandats?.[0];
                    const dateLivraison = mandat?.date_livraison ? new Date(mandat.date_livraison) : null;
                    const joursRetard = dateLivraison ? differenceInDays(today, dateLivraison) : 0;
                    const arpenteurColor = getArpenteurColor(dossier.arpenteur_geometre);
                    const bgColorClass = arpenteurColor.split(' ')[0];
                    return (
                      <div key={dossier.id} className={`${bgColorClass} rounded-lg p-3 hover:scale-[1.02] transition-all cursor-pointer border ${arpenteurColor}`} onClick={() => setEditingDossier(dossier)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`${arpenteurColor} border text-xs`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs font-semibold">{joursRetard}j</Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <User className="w-3 h-3 text-white flex-shrink-0" />
                          <span className="text-xs text-white font-medium truncate">{getClientsNames(dossier.clients_ids)}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{dateLivraison ? format(dateLivraison, "dd MMM") : 'Aucune date'}</span>
                        </div>
                        <div className="mt-2">
                          <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs">{mandat?.tache_actuelle || 'Ouverture'}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-emerald-400 py-8 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" />Aucun retard</p>
              )}
            </CardContent>
          </Card>

          {/* Col 3: Dossiers en retard - Terrain */}
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  Dossiers en retard - Terrain
                </CardTitle>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{dossiersEnRetardTerrain.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {dossiersEnRetardTerrain.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {dossiersEnRetardTerrain.slice(0, 5).map((dossier) => {
                    const mandat = dossier.mandats?.[0];
                    const dateTerrain = mandat?.date_terrain ? new Date(mandat.date_terrain) : null;
                    const joursRetard = dateTerrain ? differenceInDays(today, dateTerrain) : 0;
                    const arpenteurColor = getArpenteurColor(dossier.arpenteur_geometre);
                    const bgColorClass = arpenteurColor.split(' ')[0];
                    return (
                      <div key={dossier.id} className={`${bgColorClass} rounded-lg p-3 hover:scale-[1.02] transition-all cursor-pointer border ${arpenteurColor}`} onClick={() => setEditingDossier(dossier)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className={`${arpenteurColor} border text-xs`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-semibold">{joursRetard}j</Badge>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <User className="w-3 h-3 text-white flex-shrink-0" />
                          <span className="text-xs text-white font-medium truncate">{getClientsNames(dossier.clients_ids)}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400">{dateTerrain ? format(dateTerrain, "dd MMM") : '-'}</span>
                        </div>
                        <div className="mt-2">
                          <Badge className="bg-slate-500/20 text-slate-300 border border-slate-500/30 text-xs">{getEquipeTerrain(dossier)}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-emerald-400 py-8 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" />Aucun retard</p>
              )}
            </CardContent>
          </Card>

          {/* Col 4: Statistiques + Rendement + Analyse */}
          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 py-2">
                <CardTitle className="text-white flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Terminés cette semaine</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-white">{dossiersTermines}</p>
                <p className="text-xs text-slate-400 mt-1">Dossiers fermés</p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 py-2">
                <CardTitle className="text-white flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-blue-400" />Terminés ce mois</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-white">
                  {dossiers.filter(d => { if (!d.date_fermeture) return false; return isWithinInterval(new Date(d.date_fermeture), { start: startOfMonth(today), end: endOfMonth(today) }) && d.statut === 'Fermé'; }).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Dossiers fermés</p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-purple-500/20 to-pink-500/20 py-2">
                <CardTitle className="text-white flex items-center gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-purple-400" />Terminés cette année</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-3xl font-bold text-white">
                  {dossiers.filter(d => { if (!d.date_fermeture) return false; return isWithinInterval(new Date(d.date_fermeture), { start: startOfYear(today), end: endOfYear(today) }) && d.statut === 'Fermé'; }).length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Dossiers fermés</p>
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-orange-500/20 to-red-500/20 py-2">
                <CardTitle className="text-white flex items-center gap-2 text-sm"><TrendingUp className="w-4 h-4 text-orange-400" />Rendement opérationnel</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-2 mb-3">
                  {['semaine', 'mois', 'année'].map((p) => (
                    <Button key={p} size="sm" variant={periodeRendement === p ? 'default' : 'ghost'} onClick={() => setPeriodeRendement(p)} className={`text-xs ${periodeRendement === p ? 'bg-orange-500' : 'text-slate-400'}`}>{p}</Button>
                  ))}
                </div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-2xl font-bold text-white">{pourcentageControle}%</p>
                    <p className={`text-xs font-semibold ${couleurStatut}`}>{statutRendement}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{dossiersTermines} / {dossiersOuverts + dossiersTermines}</p>
                    <p className="text-xs text-slate-400">terminés</p>
                  </div>
                </div>
                <Progress value={pourcentageControle} className="h-2 bg-slate-800" />
              </CardContent>
            </Card>
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 py-3">
                <CardTitle className="text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" />Analyse de la production</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Charge actuelle de l'équipe</p>
                    <p className="text-2xl font-bold text-white">{chargeEquipe} mandats</p>
                    <p className="text-xs text-slate-500 mt-1">en cours</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Total des retards</p>
                    <p className="text-2xl font-bold text-red-400">{totalRetards} dossiers</p>
                    <p className="text-xs text-slate-500 mt-1">livraison + terrain</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-1">Tendance</p>
                    <p className={`text-sm font-semibold ${couleurStatut}`}>{recommandation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {editingDossier && (
        <EditDossierDialog
          dossier={editingDossier}
          isOpen={!!editingDossier}
          onClose={() => setEditingDossier(null)}
          clients={clients}
          users={users}
        />
      )}
    </div>
  );
}