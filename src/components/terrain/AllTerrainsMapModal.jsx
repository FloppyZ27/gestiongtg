import React, { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin } from "lucide-react";
import { TooltipCard } from "./TooltipCard";

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

function TerrainMap({ cards, apiKey, clients, users }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [cardStatuts, setCardStatuts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('terrainCardStatuts') || '{}'); } catch { return {}; }
  });

  const handleStatutChange = (cardId, newVal) => {
    setCardStatuts(prev => {
      const next = { ...prev, [cardId]: { ...prev[cardId], statut: newVal } };
      localStorage.setItem('terrainCardStatuts', JSON.stringify(next));
      return next;
    });
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
  }, [isLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !cards.length) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    setHoveredCard(null);

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

          marker.addListener('mouseover', () => setHoveredCard(card));
          marker.addListener('mouseout', () => setHoveredCard(null));

          markersRef.current.push(marker);
          geocodedCount++;
          if (geocodedCount >= 1) mapInstanceRef.current.fitBounds(bounds);
        });
      }, index * 150);
    });
  }, [isLoaded, cards]);

  if (!apiKey) return <div className="flex items-center justify-center h-full text-slate-400">Clé API Google Maps non configurée</div>;
  if (!isLoaded) return <div className="flex items-center justify-center h-full text-slate-400">Chargement de la carte...</div>;

  return (
    <div className="relative w-full h-full">
      {/* Infobulle style TooltipCard dans le coin supérieur droit */}
      {hoveredCard && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, pointerEvents: 'none' }}>
          <TooltipCard
            card={hoveredCard}
            clients={clients}
            users={users}
            cardStatuts={cardStatuts}
            onStatutChange={handleStatutChange}
          />
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function AllTerrainsMapModal({ open, onClose, dossiers, clients, equipes, placeAffaire }) {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState(null);
  const [filter, setFilter] = useState('all');
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

  const allCards = useMemo(() => {
    const cards = [];
    const filtered = placeAffaire ? dossiers.filter(d => d.place_affaire?.toLowerCase() === placeAffaire.toLowerCase()) : dossiers;

    const assignedMap = {};
    Object.entries(equipes || {}).forEach(([dateStr, dayEqs]) => {
      if (dateStr < today) return;
      dayEqs.forEach(eq => {
        eq.mandats?.forEach(cardId => {
          assignedMap[cardId] = { dateStr, equipeNom: eq.nom };
        });
      });
    });

    filtered.forEach(dossier => {
      if (dossier.statut !== 'Ouvert') return;
      (dossier.mandats || []).forEach((mandat, mandatIndex) => {
        if (mandat.tache_actuelle !== 'Cédule') return;
        if (!formatAdresse(mandat.adresse_travaux)) return;

        if (mandat.terrains_list?.length > 0) {
          mandat.terrains_list.forEach((terrain, terrainIndex) => {
            const cardId = `${dossier.id}-${mandatIndex}-${terrainIndex}`;
            const assignment = assignedMap[cardId];
            cards.push({ id: cardId, dossier, mandat, terrain: { ...terrain, statut_terrain: mandat.statut_terrain }, mandatIndex, terrainIndex, isPlanned: !!assignment, dateCedulee: assignment?.dateStr || null, equipeNom: assignment?.equipeNom || null });
          });
        } else {
          const statutTerrain = mandat.statut_terrain;
          if (statutTerrain === 'en_verification') return;
          const cardId = `${dossier.id}-${mandatIndex}-0`;
          const assignment = assignedMap[cardId];
          cards.push({ id: cardId, dossier, mandat, terrain: { ...(mandat.terrain || {}), statut_terrain: statutTerrain }, mandatIndex, terrainIndex: 0, isPlanned: !!assignment, dateCedulee: assignment?.dateStr || null, equipeNom: assignment?.equipeNom || null });
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="bg-slate-900 border-slate-800 text-white p-0 gap-0"
        style={{
          maxWidth: '85vw', width: '85vw',
          height: 'calc(90vh - 100px)', maxHeight: 'calc(90vh - 100px)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: '90px', left: '50%', transform: 'translateX(-50%)'
        }}
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
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-slate-400"></span> À planifier</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span> Planifié (futur)</span>
            </div>
          </div>
        </DialogHeader>

        {/* Carte pleine largeur */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TerrainMap cards={filteredCards} apiKey={googleMapsApiKey} clients={clients} users={[]} />
        </div>
      </DialogContent>
    </Dialog>
  );
}