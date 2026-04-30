import React, { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, User, Calendar } from "lucide-react";
import { DossierCard } from "./DossierCard";

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};
const getArpenteurColorHex = (arpenteur) => {
  const colors = { "Samuel Guay": "#ef4444", "Pierre-Luc Pilote": "#64748b", "Frédéric Gilbert": "#f97316", "Dany Gaboury": "#eab308", "Benjamin Larouche": "#06b6d4" };
  return colors[arpenteur] || "#10b981";
};

function formatAdresse(addr) {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
}

// Composant carte Google Maps avec marqueurs custom
function TerrainMap({ cards, apiKey, clients }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const getClientsNames = (ids) => {
    if (!ids?.length) return "-";
    return ids.map(id => { const c = clients.find(c => c.id === id); return c ? `${c.prenom} ${c.nom}` : ""; }).filter(n => n).join(", ");
  };

  useEffect(() => {
    if (!apiKey) return;
    if (window.google?.maps) { setIsLoaded(true); return; }
    const existingScript = document.querySelector('script[data-gmaps-loader]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.gmapsLoader = 'true';
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 48.5, lng: -71.6 },
      mapTypeId: 'roadmap',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1e293b' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1e293b' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#334155' }] },
      ],
    });
    mapInstanceRef.current = map;
    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [isLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !cards.length) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const geocoder = new window.google.maps.Geocoder();
    const bounds = new window.google.maps.LatLngBounds();
    let geocodedCount = 0;

    cards.forEach((card, index) => {
      const adresse = formatAdresse(card.mandat?.adresse_travaux);
      if (!adresse) return;

      setTimeout(() => {
        geocoder.geocode({ address: adresse + ', Québec, Canada' }, (results, status) => {
          if (status !== 'OK' || !results?.[0]) return;
          const pos = results[0].geometry.location;
          bounds.extend(pos);

          const color = card.isPlanned ? getArpenteurColorHex(card.dossier.arpenteur_geometre) : '#94a3b8';
          const clientsNames = getClientsNames(card.dossier.clients_ids);
          const dateLabel = card.isPlanned && card.dateCedulee
            ? `📅 ${format(new Date(card.dateCedulee + 'T00:00:00'), "d MMM yyyy", { locale: fr })} — ${card.equipeNom || ''}`
            : '📋 À planifier';

          const marker = new window.google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current,
            title: `${getArpenteurInitials(card.dossier.arpenteur_geometre)}${card.dossier.numero_dossier}`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => {
            infoWindowRef.current.setContent(`
              <div style="background:#1e293b;color:white;padding:12px;border-radius:8px;min-width:220px;font-family:sans-serif;">
                <div style="font-weight:700;font-size:14px;margin-bottom:6px;color:${color}">
                  ${getArpenteurInitials(card.dossier.arpenteur_geometre)}${card.dossier.numero_dossier} — ${card.mandat?.type_mandat || ''}
                </div>
                <div style="font-size:12px;color:#cbd5e1;margin-bottom:4px;">👤 ${clientsNames}</div>
                <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">📍 ${adresse}</div>
                <div style="font-size:12px;color:${card.isPlanned ? '#34d399' : '#f59e0b'};">${dateLabel}</div>
              </div>
            `);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          });

          markersRef.current.push(marker);
          geocodedCount++;
          if (geocodedCount >= 1) {
            mapInstanceRef.current.fitBounds(bounds);
          }
        });
      }, index * 150);
    });
  }, [isLoaded, cards, clients]);

  if (!apiKey) return <div className="flex items-center justify-center h-full text-slate-400">Clé API Google Maps non configurée</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-full text-slate-400">Chargement de la carte...</div>;

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function AllTerrainsMapModal({ open, onClose, dossiers, clients, equipes, placeAffaire }) {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'unplanned' | 'planned'
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const load = async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const r = await base44.functions.invoke('getGoogleMapsApiKey');
        if (r.data?.apiKey) setGoogleMapsApiKey(r.data.apiKey);
      } catch (e) {}
    };
    load();
  }, []);

  // Construire la liste des cartes terrain
  const allCards = useMemo(() => {
    const cards = [];
    const filtered = placeAffaire ? dossiers.filter(d => d.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()) : dossiers;

    // Carte des assignments depuis les équipes (cardId -> {dateStr, equipeNom})
    const assignedMap = {};
    Object.entries(equipes || {}).forEach(([dateStr, dayEqs]) => {
      if (dateStr < today) return;
      dayEqs.forEach(eq => {
        eq.mandats?.forEach(cardId => {
          assignedMap[cardId] = { dateStr, equipeNom: eq.nom };
        });
      });
    });

    filtered.forEach((dossier, dossierIdx) => {
      if (dossier.statut !== 'Ouvert') return;
      (dossier.mandats || []).forEach((mandat, mandatIndex) => {
        if (mandat.tache_actuelle !== 'Cédule') return;
        if (!formatAdresse(mandat.adresse_travaux)) return;

        if (mandat.terrains_list?.length > 0) {
          mandat.terrains_list.forEach((terrain, terrainIndex) => {
            const cardId = `${dossier.id}-${mandatIndex}-${terrainIndex}`;
            const assignment = assignedMap[cardId];
            const isPlanned = !!assignment;
            // Construire une card compatible DossierCard
            cards.push({
              id: cardId,
              dossier,
              mandat,
              terrain: { ...terrain, statut_terrain: mandat.statut_terrain },
              mandatIndex,
              terrainIndex,
              isPlanned,
              dateCedulee: assignment?.dateStr || null,
              equipeNom: assignment?.equipeNom || null,
            });
          });
        } else {
          const statutTerrain = mandat.statut_terrain;
          if (statutTerrain === 'en_verification') return;
          const cardId = `${dossier.id}-${mandatIndex}-0`;
          const assignment = assignedMap[cardId];
          const isPlanned = !!assignment;
          cards.push({
            id: cardId,
            dossier,
            mandat,
            terrain: { ...(mandat.terrain || {}), statut_terrain: statutTerrain },
            mandatIndex,
            terrainIndex: 0,
            isPlanned,
            dateCedulee: assignment?.dateStr || null,
            equipeNom: assignment?.equipeNom || null,
          });
        }
      });
    });

    return cards;
  }, [dossiers, equipes, placeAffaire, today]);

  const filteredCards = useMemo(() => {
    if (filter === 'unplanned') return allCards.filter(c => !c.isPlanned);
    if (filter === 'planned') return allCards.filter(c => c.isPlanned);
    return allCards;
  }, [allCards, filter]);

  const unplannedCount = allCards.filter(c => !c.isPlanned).length;
  const plannedCount = allCards.filter(c => c.isPlanned).length;

  // Props factices pour DossierCard (mode lecture seule)
  const dossierCardProps = {
    users: [],
    clients,
    techniciens: [],
    lockedCards: new Set(),
    cardStatuts: {},
    linkedGroups: [],
    dragging: null,
    linkingMode: null,
    showLock: false,
    hideEditButton: true,
    hideLinkedButton: true,
    hideStatut: false,
    disableInteractions: true,
    onCardClick: () => {},
    onEditTerrain: () => {},
    onDeleteCard: () => {},
    onLinkCard: () => {},
    onUnlinkCard: () => {},
    onToggleLock: () => {},
    onStatutChange: () => {},
    holdTimerRef: { current: null },
    didDragRef: { current: false },
    handleDragStart: () => {},
    getLinkedGroupForCard: () => null,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-slate-900 border-slate-800 text-white p-0 gap-0"
        style={{ maxWidth: '95vw', width: '95vw', height: 'calc(100vh - 100px)', maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <DialogHeader className="p-4 border-b border-slate-800 flex-shrink-0">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Vue d'ensemble — Tous les terrains à planifier
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {[
              { key: 'all', label: `Tous (${allCards.length})`, color: 'bg-slate-700 text-slate-200' },
              { key: 'unplanned', label: `À planifier (${unplannedCount})`, color: 'bg-amber-500/20 text-amber-300' },
              { key: 'planned', label: `Planifiés futurs (${plannedCount})`, color: 'bg-emerald-500/20 text-emerald-300' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${f.color} ${filter === f.key ? 'ring-2 ring-white/30 scale-105' : 'opacity-70 hover:opacity-100'}`}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-amber-400"></span> À planifier</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span> Planifié (futur)</span>
            </div>
          </div>
        </DialogHeader>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Liste gauche — cartes identiques à Cédule Terrain */}
          <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid rgba(51,65,85,0.8)', background: 'rgba(15,23,42,0.6)', padding: '8px' }}>
            {filteredCards.length === 0 ? (
              <div className="text-center text-slate-500 mt-8 text-sm">Aucun terrain</div>
            ) : (
              filteredCards.map(card => (
                <div key={card.id}>
                  {/* Badge "Planifié" ou "À planifier" au-dessus de la carte */}
                  {card.isPlanned && card.dateCedulee && (
                    <div className="flex items-center gap-1 mb-1 px-1">
                      <Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-emerald-300">{format(new Date(card.dateCedulee + 'T00:00:00'), "d MMM yyyy", { locale: fr })} — {card.equipeNom}</span>
                    </div>
                  )}
                  {!card.isPlanned && (
                    <div className="flex items-center gap-1 mb-1 px-1">
                      <span className="text-xs text-amber-400">⏳ À planifier</span>
                    </div>
                  )}
                  <DossierCard card={card} {...dossierCardProps} />
                </div>
              ))
            )}
          </div>

          {/* Carte Google Maps */}
          <div style={{ flex: 1, height: '100%' }}>
            <TerrainMap cards={filteredCards} apiKey={googleMapsApiKey} clients={clients} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}