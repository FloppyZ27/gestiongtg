import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const TEAM_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export default function MapView({ dateStr, equipes, terrainCards, formatAdresse }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('MapView useEffect triggered:', { dateStr, equipesCount: equipes?.length, terrainCardsCount: terrainCards?.length });
    
    if (!dateStr || !equipes || equipes.length === 0) {
      console.log('No data, setting loading to false');
      setLoading(false);
      return;
    }

    if (!mapRef.current) {
      console.log('Map ref not ready');
      return;
    }

    const loadMap = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger Google Maps API
        if (!window.google) {
          const response = await base44.functions.invoke('getGoogleMapsApiKey');
          const apiKey = response.data.apiKey;
          
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Échec du chargement de Google Maps'));
            document.head.appendChild(script);
          });
        }

        // Initialiser la carte
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 10,
          center: { lat: 48.5, lng: -71.5 },
          mapTypeId: 'roadmap',
        });

        mapInstanceRef.current = map;

        const directionsService = new window.google.maps.DirectionsService();
        const bounds = new window.google.maps.LatLngBounds();
        const bureauAddress = "11 rue melancon est, Alma";
        let routesDrawn = 0;

        // Tracer chaque équipe avec une couleur différente
        const promises = equipes.map(async (equipe, i) => {
          const color = TEAM_COLORS[i % TEAM_COLORS.length];
          const cardIds = equipe.mandats || [];
          
          if (cardIds.length === 0) return;

          const waypoints = [];
          cardIds.forEach((cardId) => {
            const card = terrainCards.find(c => c.id === cardId);
            if (card?.mandat?.adresse_travaux) {
              const address = formatAdresse(card.mandat.adresse_travaux);
              if (address) {
                waypoints.push({
                  location: address,
                  stopover: true
                });
              }
            }
          });

          if (waypoints.length === 0) return;

          try {
            const result = await new Promise((resolve, reject) => {
              directionsService.route({
                origin: bureauAddress,
                destination: bureauAddress,
                waypoints: waypoints,
                travelMode: window.google.maps.TravelMode.DRIVING,
              }, (response, status) => {
                if (status === 'OK') {
                  resolve(response);
                } else {
                  reject(new Error(`Directions failed: ${status}`));
                }
              });
            });

            const directionsRenderer = new window.google.maps.DirectionsRenderer({
              map: map,
              directions: result,
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 5,
              },
            });

            const route = result.routes[0];
            route.overview_path.forEach(point => {
              bounds.extend(point);
            });
            
            routesDrawn++;
          } catch (err) {
            console.error(`Erreur trajet équipe ${equipe.nom}:`, err);
          }
        });

        await Promise.all(promises);

        if (routesDrawn > 0) {
          map.fitBounds(bounds);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur chargement carte:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadMap();
  }, [dateStr, equipes, terrainCards, formatAdresse]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Chargement de la carte...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Erreur: {error}
      </div>
    );
  }

  if (!equipes || equipes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Aucun trajet disponible pour cette journée
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 bg-slate-800/50 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white mb-2">Légende des équipes</h3>
        <div className="flex flex-wrap gap-2">
          {equipes.map((equipe, index) => (
            <div key={equipe.id} className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: TEAM_COLORS[index % TEAM_COLORS.length] }}
              />
              <span className="text-xs text-white">{equipe.nom}</span>
            </div>
          ))}
        </div>
      </div>
      <div ref={mapRef} className="flex-1 w-full" />
    </div>
  );
}