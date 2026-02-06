import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#06b6d4', // cyan
];

export default function MultiRouteMap({ routes, apiKey }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const googleMapRef = useRef(null);
  const directionsRenderersRef = useRef([]);
  const markersRef = useRef([]);
  const [hoveredDossier, setHoveredDossier] = useState(null);

  useEffect(() => {
    if (!apiKey || !routes || routes.length === 0) {
      setLoading(false);
      return;
    }

    // Charger l'API Google Maps
    const loadGoogleMapsScript = () => {
      if (window.google?.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Erreur lors du chargement de Google Maps");
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 10,
          center: { lat: 48.5198, lng: -71.6859 }, // Alma, QC
          mapTypeId: 'roadmap',
        });

        googleMapRef.current = map;

        // Nettoyer les anciens renderers et marqueurs
        directionsRenderersRef.current.forEach(renderer => renderer.setMap(null));
        directionsRenderersRef.current = [];
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
        setHoveredDossier(null);

        const bounds = new window.google.maps.LatLngBounds();
        const directionsService = new window.google.maps.DirectionsService();

        let completedRoutes = 0;

        routes.forEach((route, index) => {
          const { origin, destination, waypoints, color, label, dossiers } = route;

          const request = {
            origin,
            destination,
            waypoints: waypoints.map(w => ({ location: w, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
          };

          directionsService.route(request, (result, status) => {
            if (status === 'OK') {
              const directionsRenderer = new window.google.maps.DirectionsRenderer({
                map,
                directions: result,
                polylineOptions: {
                  strokeColor: color || COLORS[index % COLORS.length],
                  strokeWeight: 4,
                  strokeOpacity: 0.8,
                },
                suppressMarkers: true,
                preserveViewport: true,
              });

              directionsRenderersRef.current.push(directionsRenderer);

              // Créer des marqueurs personnalisés pour le départ et l'arrivée
              const route = result.routes[0];
              const startLocation = route.legs[0].start_location;
              const endLocation = route.legs[route.legs.length - 1].end_location;

              // Marqueur de départ
              new window.google.maps.Marker({
                position: startLocation,
                map: map,
                label: {
                  text: `${index + 1}`,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold'
                },
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: color || COLORS[index % COLORS.length],
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                },
                title: `${label} - Départ`,
                zIndex: 1000 + index,
              });

              // Marqueurs pour chaque waypoint avec informations des dossiers
              route.legs.forEach((leg, legIndex) => {
                if (legIndex > 0 && dossiers && dossiers[legIndex - 1]) {
                  const dossier = dossiers[legIndex - 1];
                  const marker = new window.google.maps.Marker({
                    position: leg.start_location,
                    map: map,
                    label: {
                      text: String.fromCharCode(65 + legIndex - 1), // A, B, C...
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    },
                    icon: {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: color || COLORS[index % COLORS.length],
                      fillOpacity: 0.9,
                      strokeColor: 'white',
                      strokeWeight: 2,
                    },
                    title: `${label} - ${dossier.numero}`,
                    zIndex: 1000 + index,
                  });

                  // Ajouter l'événement de survol pour afficher les informations
                  marker.addListener('mouseover', () => {
                    const teamColor = color || COLORS[index % COLORS.length];
                    setHoveredDossier({
                      ...dossier,
                      color: teamColor
                    });
                  });

                  marker.addListener('mouseout', () => {
                    setHoveredDossier(null);
                  });

                  markersRef.current.push(marker);
                }
              });

              // Ajouter les points au bounds
              result.routes[0].legs.forEach(leg => {
                bounds.extend(leg.start_location);
                bounds.extend(leg.end_location);
              });

              completedRoutes++;
              if (completedRoutes === routes.length) {
                map.fitBounds(bounds);
                setLoading(false);
              }
            } else {
              console.error(`Erreur pour le trajet ${index}:`, status);
              completedRoutes++;
              if (completedRoutes === routes.length) {
                setLoading(false);
              }
            }
          });
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadGoogleMapsScript();

    return () => {
      // Cleanup
      directionsRenderersRef.current.forEach(renderer => renderer.setMap(null));
      directionsRenderersRef.current = [];
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      setHoveredDossier(null);
    };
  }, [apiKey, routes]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}