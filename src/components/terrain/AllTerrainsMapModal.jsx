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
        { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
        { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
        { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
        { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
        { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
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

          const color = getArpenteurColorHex(card.dossier.arpenteur_geometre);

          // SVG pin style goutte avec label dossier
          const label = `${getArpenteurInitials(card.dossier.arpenteur_geometre)}${card.dossier.numero_dossier}`;
          const svgPin = `
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="28" viewBox="0 0 44 56">
              <filter id="shadow" x="-30%" y="-10%" width="160%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.6)"/>
              </filter>
              <path d="M22 2 C10.4 2 1 11.4 1 23 C1 38 22 54 22 54 C22 54 43 38 43 23 C43 11.4 33.6 2 22 2 Z"
                fill="${color}" stroke="white" stroke-width="2.5" filter="url(#shadow)"/>
              <circle cx="22" cy="22" r="10" fill="white" opacity="0.25"/>
              <circle cx="22" cy="22" r="7" fill="white" opacity="0.9"/>
            </svg>
          `;
          const encodedSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgPin);

          const marker = new window.google.maps.Marker({
            position: pos,
            map: mapInstanceRef.current,
            title: label,
            icon: {
              url: encodedSvg,
              scaledSize: new window.google.maps.Size(22, 28),
              anchor: new window.google.maps.Point(11, 27),
            },
            label: {
              text: card.isPlanned ? '✓' : '·',
              color: color,
              fontSize: '11px',
              fontWeight: 'bold',
            },
            zIndex: card.isPlanned ? 10 : 5,
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
        {/* Carte pleine largeur */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TerrainMap cards={allCards} apiKey={googleMapsApiKey} clients={clients} users={[]} />
        </div>
      </DialogContent>
    </Dialog>
  );
}