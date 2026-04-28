import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MapPin, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import MultiRouteMap from "./MultiRouteMap";

const COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
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

export default function RouteMapModal({ equipesTerrain, equipesDuJourIds, dossiers, clients, selectedDate, onClose }) {
  const [apiKey, setApiKey] = useState(null);
  const [equipeTravelSeconds, setEquipeTravelSeconds] = useState({});

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

  // Construire les routes pour MultiRouteMap — mémoïsé pour éviter les re-renders infinis
  const mapRoutes = useMemo(() => equipesDuJour.map((equipe, index) => {
    const waypoints = [];
    const dossiersInfo = [];

    (equipe.mandats || []).forEach(cardId => {
      const parts = cardId.split('-');
      const mandatIdx = parseInt(parts[parts.length - 2]);
      const dossierId = parts.slice(0, parts.length - 2).join('-');
      const dossier = dossiers.find(d => d.id === dossierId);
      const mandat = dossier?.mandats?.[mandatIdx];
      if (mandat?.adresse_travaux) {
        const address = formatAdresse(mandat.adresse_travaux);
        if (address) {
          waypoints.push(address);
          dossiersInfo.push({
            numero: `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}`,
            clients: getClientsNames(dossier.clients_ids),
            mandat: getAbbreviatedMandatType(mandat.type_mandat),
            mandatType: mandat.type_mandat,
            adresse: address,
            arpenteur: dossier.arpenteur_geometre,
            dateLivraison: mandat.date_livraison ? format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM yyyy", { locale: fr }) : null,
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

  const formatHHMM = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.round((secs % 3600) / 60);
    return `${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold text-xl">
            Tous les trajets — {selectedDate && format(new Date(selectedDate + 'T00:00:00'), "EEEE d MMMM yyyy", { locale: fr })}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Corps */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Colonne gauche — liste des équipes et cartes */}
        <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid rgba(51,65,85,0.8)', background: 'rgba(15,23,42,0.6)', padding: '8px' }}>
          {equipesDuJour.map((equipe, posIdx) => {
            const route = mapRoutes.find(r => r.equipeId === equipe.id);
            const color = route ? route.color : COLORS[posIdx % COLORS.length];
            const travelSecs = equipeTravelSeconds[equipe.id] || 0;

            const totalWorkHours = (equipe.mandats || []).reduce((sum, cardId) => {
              const parts = cardId.split('-');
              const mandatIdx = parseInt(parts[parts.length - 2]);
              const dossierId = parts.slice(0, parts.length - 2).join('-');
              const dossier = dossiers.find(d => d.id === dossierId);
              const mandat = dossier?.mandats?.[mandatIdx];
              const terrainIdx = parseInt(parts[parts.length - 1]);
              const terrain = mandat?.terrains_list?.[terrainIdx] || mandat?.terrain;
              return sum + parseTimeString(terrain?.temps_prevu);
            }, 0);

            const totalSecs = totalWorkHours * 3600 + travelSecs;

            return (
              <div key={equipe.id} className="bg-slate-800/50 rounded-lg overflow-hidden mb-3">
                <div className="bg-blue-600/40 px-2 py-2 border-b-2 border-blue-500/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-sm font-bold block truncate">{equipe.nom}</span>
                      {totalSecs > 0 && (
                        <span className="text-emerald-300 text-xs">
                          {formatHHMM(totalSecs)}
                          {travelSecs > 0 && <span className="text-slate-400 ml-1">({formatHHMM(travelSecs)} 🚗)</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  {(equipe.mandats || []).map((cardId, cardIdx) => {
                    const parts = cardId.split('-');
                    const mandatIdx = parseInt(parts[parts.length - 2]);
                    const dossierId = parts.slice(0, parts.length - 2).join('-');
                    const dossier = dossiers.find(d => d.id === dossierId);
                    const mandat = dossier?.mandats?.[mandatIdx];
                    if (!dossier || !mandat) return null;
                    const pinLetter = String.fromCharCode(65 + cardIdx);
                    return (
                      <div key={cardId} className="relative mb-2 bg-slate-700/50 rounded-lg p-2">
                        <div style={{
                          position: 'absolute', top: 6, right: 6, zIndex: 10,
                          width: 22, height: 22, borderRadius: '50%',
                          background: color, border: '2px solid white',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'white',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        }}>
                          {pinLetter}
                        </div>
                        <div className="text-xs text-white font-semibold">{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</div>
                        <div className="text-xs text-slate-400">{getClientsNames(dossier.clients_ids)}</div>
                        {mandat.adresse_travaux && <div className="text-xs text-slate-500 mt-0.5">{formatAdresse(mandat.adresse_travaux)}</div>}
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
  );
}