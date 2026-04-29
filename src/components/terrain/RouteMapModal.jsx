import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, X, User, Clock, AlertCircle, Wrench, UserCheck, Link2, Timer, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MultiRouteMap from "./MultiRouteMap";

const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = { "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

const getMandatColor = (typeMandat) => {
  const colors = { "Bornage": "bg-red-500/20 text-red-400 border-red-500/30", "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30", "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30", "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30", "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30", "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30", "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30", "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30" };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = { "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" };
  return abbreviations[type] || type;
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

const parseTimeString = (ts) => {
  if (!ts) return 0;
  const hhmm = ts.match(/(\d+)h(\d+)?/);
  if (hhmm) return parseInt(hhmm[1]) + (hhmm[2] ? parseInt(hhmm[2]) / 60 : 0);
  const decimal = ts.match(/(\d+(?:\.\d+)?)/);
  return decimal ? parseFloat(decimal[0]) : 0;
};

const formatHHMM = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.round((secs % 3600) / 60);
  return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
};

const getInitialsWithHyphens = (text) => text.split('-').map(part => part[0]?.toUpperCase()).join('');

const generateTeamDisplayName = (equipe, users, positionIndex) => {
  const numStr = positionIndex != null
    ? String(positionIndex + 1)
    : (equipe.nom.match(/Équipe (\d+)/)?.[1] ?? null);
  if (!equipe.techniciens || equipe.techniciens.length === 0) {
    return numStr ? `Équipe ${numStr}` : equipe.nom;
  }
  const initials = equipe.techniciens.map(id => {
    const u = users?.find(u => u.id === id);
    if (!u) return '';
    return getInitialsWithHyphens(u.prenom || '') + getInitialsWithHyphens(u.nom || '');
  }).filter(n => n).join('-');
  return numStr ? `Équipe ${numStr} - ${initials}` : equipe.nom;
};

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

export default function RouteMapModal({ equipesTerrain, equipesDuJourIds, dossiers, clients, users, selectedDate, onClose }) {
  const [apiKey, setApiKey] = useState(null);
  const [equipeTravelSeconds, setEquipeTravelSeconds] = useState({});
  const [cardStatuts, setCardStatuts] = useState(() => { try { return JSON.parse(localStorage.getItem('terrainCardStatuts') || '{}'); } catch { return {}; } });

  useEffect(() => {
    base44.functions.invoke('getGoogleMapsApiKey').then(r => {
      if (r.data?.apiKey) setApiKey(r.data.apiKey);
    }).catch(() => {});
  }, []);

  const bureauAddress = "11 rue melancon est, Alma";

  const equipesDuJour = useMemo(() => equipesTerrain.filter(e => equipesDuJourIds.has(e.id)), [equipesTerrain, equipesDuJourIds]);

  const getClientsNames = useCallback((clientIds) => {
    if (!clientIds?.length) return "-";
    return clientIds.map(id => { const c = clients?.find(cl => cl.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(Boolean).join(", ");
  }, [clients]);

  const mapRoutes = useMemo(() => equipesDuJour.map((equipe, index) => {
    const waypoints = [];
    const dossiersInfo = [];

    (equipe.mandats || []).forEach(cardId => {
      const parts = cardId.split('-');
      const mandatIdx = parseInt(parts[parts.length - 2]);
      const terrainIdx = parseInt(parts[parts.length - 1]);
      const dossierId = parts.slice(0, parts.length - 2).join('-');
      const dossier = dossiers.find(d => d.id === dossierId);
      const mandat = dossier?.mandats?.[mandatIdx];
      const terrain = mandat?.terrains_list?.[terrainIdx] || mandat?.terrain;
      if (dossier && mandat?.adresse_travaux) {
        const address = formatAdresse(mandat.adresse_travaux);
        if (address) {
          waypoints.push(address);
          // Structure identique à terrainCard pour que TooltipCard fonctionne
          dossiersInfo.push({
            id: cardId,
            cardId,
            dossier,
            mandat,
            terrain: terrain || {},
            numero: `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`,
          });
        }
      }
    });

    return {
      equipeId: equipe.id,
      origin: bureauAddress,
      destination: bureauAddress,
      waypoints,
      color: COLORS[index % COLORS.length],
      label: equipe.nom,
      dossiers: dossiersInfo,
    };
  }).filter(r => r.waypoints.length > 0), [equipesDuJour, dossiers, clients, getClientsNames]);

  const handleRouteDurations = useCallback((durations) => {
    setEquipeTravelSeconds(prev => {
      const newDurations = { ...prev };
      mapRoutes.forEach((r, i) => { newDurations[r.equipeId] = durations[i] || 0; });
      return newDurations;
    });
  }, [mapRoutes]);

  return (
    // Overlay semi-transparent
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Fenêtre 80% de l'écran */}
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl flex flex-col overflow-hidden shadow-2xl"
        style={{ width: '80vw', height: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold text-lg">
              Mes Trajets — {selectedDate && format(new Date(selectedDate + 'T00:00:00'), "d MMMM yyyy", { locale: fr })}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Colonne gauche — équipes et cartes */}
          <div style={{ width: 260, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid rgba(51,65,85,0.8)', background: 'rgba(15,23,42,0.6)', padding: '8px' }}>
            {equipesDuJour.map((equipe, posIdx) => {
              const route = mapRoutes.find(r => r.equipeId === equipe.id);
              const color = route ? route.color : COLORS[posIdx % COLORS.length];
              const travelSecs = equipeTravelSeconds[equipe.id] || 0;
              const equipeNom = generateTeamDisplayName(equipe, users, posIdx);

              const totalWorkHours = (equipe.mandats || []).reduce((sum, cardId) => {
                const parts = cardId.split('-');
                const mandatIdx = parseInt(parts[parts.length - 2]);
                const terrainIdx = parseInt(parts[parts.length - 1]);
                const dossierId = parts.slice(0, parts.length - 2).join('-');
                const dossier = dossiers.find(d => d.id === dossierId);
                const mandat = dossier?.mandats?.[mandatIdx];
                const terrain = mandat?.terrains_list?.[terrainIdx] || mandat?.terrain;
                return sum + parseTimeString(terrain?.temps_prevu);
              }, 0);

              const totalSecs = totalWorkHours * 3600 + travelSecs;

              return (
                <div key={equipe.id} className="bg-slate-800/50 rounded-lg overflow-hidden mb-3">
                  {/* Header équipe — identique à CeduleTerrain */}
                  <div className="bg-blue-600/40 px-2 py-2 border-b-2 border-blue-500/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-sm font-bold block truncate">{equipeNom}</span>
                        {totalSecs > 0 && (
                          <span className="text-emerald-300 text-xs">
                            {formatHHMM(totalSecs)}
                            {travelSecs > 0 && <span className="text-slate-400 ml-1">({formatHHMM(travelSecs)} 🚗)</span>}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cartes — identiques à LeveTerrain */}
                  <div className="p-2">
                    {(equipe.mandats || []).map((cardId, cardIdx) => {
                      const parts = cardId.split('-');
                      const mandatIdx = parseInt(parts[parts.length - 2]);
                      const terrainIdx = parseInt(parts[parts.length - 1]);
                      const dossierId = parts.slice(0, parts.length - 2).join('-');
                      const dossier = dossiers.find(d => d.id === dossierId);
                      const mandat = dossier?.mandats?.[mandatIdx];
                      if (!dossier || !mandat) return null;
                      const terrain = mandat?.terrains_list?.[terrainIdx] || mandat?.terrain;
                      const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
                      const bgColorClass = arpColor.split(' ')[0];
                      const pinLetter = String.fromCharCode(65 + cardIdx);

                      return (
                        <div key={cardId} className={`${bgColorClass} rounded-lg p-2 mb-2 relative`}>
                          {/* Badge lettre pin */}
                          <div style={{
                            position: 'absolute', top: 6, right: 6, zIndex: 10,
                            width: 20, height: 20, borderRadius: '50%',
                            background: color, border: '2px solid white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 700, color: 'white',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                          }}>
                            {pinLetter}
                          </div>

                          {/* Badges N° dossier + type mandat */}
                          <div className="flex items-start gap-1 flex-wrap mb-2 pr-6">
                            <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>
                              {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                            </Badge>
                            <Badge className={`${getMandatColor(mandat.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
                              {getAbbreviatedMandatType(mandat.type_mandat)}
                            </Badge>
                          </div>

                          {/* Client */}
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3 text-white flex-shrink-0" />
                            <span className="text-xs text-white font-medium truncate">{getClientsNames(dossier.clients_ids)}</span>
                          </div>

                          {/* Adresse */}
                          {mandat.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
                            <div className="flex items-start gap-1 mb-1">
                              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span>
                            </div>
                          )}

                          {/* Date livraison */}
                          {mandat.date_livraison && (
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
                            </div>
                          )}

                          {terrain && (
                            <>
                              {terrain.date_limite_leve && (
                                <div className="flex items-center gap-1 mb-1">
                                  <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                  <span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
                                </div>
                              )}
                              {terrain.a_rendez_vous && terrain.date_rendez_vous && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="w-3 h-3 text-orange-400 flex-shrink-0" />
                                  <span className="text-xs text-orange-300">
                                    RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}
                                    {terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}
                                  </span>
                                </div>
                              )}
                              {terrain.instruments_requis && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                  <span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span>
                                </div>
                              )}
                              {terrain.technicien && (
                                <div className="flex items-center gap-1 mb-1">
                                  <UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                  <span className="text-xs text-blue-300 truncate">{terrain.technicien}</span>
                                </div>
                              )}
                              {terrain.dossier_simultane && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                  <span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span>
                                </div>
                              )}
                              {/* Footer: temps prévu | statut coloré | donneur */}
                              {(() => {
                                const currentStatut = cardStatuts[cardId]?.statut || null;
                                const isOrange = currentStatut === 'Rendez-Vous' || currentStatut === 'Client Avisé';
                                const isMauve = currentStatut === 'Confirmé la veille' || currentStatut === 'Retour terrain';
                                const STATUT_OPTIONS = ['Rendez-Vous', 'Client Avisé', 'Confirmé la veille', 'Retour terrain'];
                                const donneurUser = terrain?.donneur ? users.find(u => u.full_name === terrain.donneur) : null;
                                return (
                                  <div className="flex items-center gap-1 mt-2 pt-1 border-t border-emerald-500/30">
                                    {/* Temps prévu */}
                                    <div className="flex-shrink-0">
                                      {terrain?.temps_prevu
                                        ? <div className="flex items-center gap-0.5"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>
                                        : <div className="w-10" />}
                                    </div>
                                    {/* Select statut avec couleurs */}
                                    <div className="flex-1 min-w-0">
                                      <Select
                                        value={currentStatut || ""}
                                        onValueChange={(val) => {
                                          setCardStatuts(prev => {
                                            const newVal = (val === '__vide__' || val === currentStatut) ? null : val;
                                            const next = { ...prev, [cardId]: { ...prev[cardId], statut: newVal } };
                                            localStorage.setItem('terrainCardStatuts', JSON.stringify(next));
                                            return next;
                                          });
                                        }}
                                      >
                                        <SelectTrigger
                                          className="w-full h-6 text-xs px-1.5 py-0"
                                          style={{
                                            background: isOrange ? 'rgba(249,115,22,0.3)' : isMauve ? 'rgba(139,92,246,0.3)' : 'rgba(30,41,59,0.4)',
                                            color: isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8',
                                            fontWeight: (isOrange || isMauve) ? 600 : 400,
                                            opacity: (!isOrange && !isMauve) ? 0.5 : 1,
                                            boxShadow: `0 0 0 1px ${isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8'}`,
                                            border: 'none', outline: 'none',
                                            justifyContent: 'center', textAlign: 'center',
                                          }}
                                        >
                                          <SelectValue placeholder="Statut..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700">
                                          <SelectItem value="__vide__" className="text-xs text-slate-400">— Aucun —</SelectItem>
                                          {STATUT_OPTIONS.map(opt => (
                                            <SelectItem key={opt} value={opt} className="text-xs text-white">{opt}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {/* Donneur initiales + avatar */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {terrain?.donneur && (
                                        <span className="text-xs text-slate-400 font-medium">
                                          {terrain.donneur.trim().split(' ').map(n => n[0]?.toUpperCase()).join('')}
                                        </span>
                                      )}
                                      {donneurUser ? (
                                        <Avatar className="w-5 h-5 border border-emerald-500/50">
                                          <AvatarImage src={donneurUser.photo_url} />
                                          <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getInitials(donneurUser.full_name)}</AvatarFallback>
                                        </Avatar>
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
                                          <User className="w-2.5 h-2.5 text-emerald-500" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {mapRoutes.length === 0 && (
              <div className="text-center text-slate-500 py-8 text-sm">Aucune adresse disponible</div>
            )}
          </div>

          {/* Carte Google Maps */}
          <div style={{ flex: 1, height: '100%' }}>
            {!apiKey ? (
              <div className="flex items-center justify-center h-full text-slate-400">Chargement...</div>
            ) : mapRoutes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">Aucun trajet à afficher</div>
            ) : (
              <MultiRouteMap
                routes={mapRoutes}
                apiKey={apiKey}
                visibleRouteIndices={mapRoutes.map((_, i) => i)}
                onRouteDurations={handleRouteDurations}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}