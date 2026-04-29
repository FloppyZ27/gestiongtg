import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TooltipCard } from './TooltipCard';

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

const getArpenteurBgColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "#991b1b",
    "Pierre-Luc Pilote": "#475569",
    "Frédéric Gilbert": "#9a3412",
    "Dany Gaboury": "#854d0e",
    "Benjamin Larouche": "#155e75"
  };
  return colors[arpenteur] || "#065f46";
};

const getMandatBgColor = (typeMandat) => {
  const colors = {
    "Bornage": "rgba(239, 68, 68, 0.2)",
    "Certificat de localisation": "rgba(16, 185, 129, 0.2)",
    "CPTAQ": "rgba(245, 158, 11, 0.2)",
    "Description Technique": "rgba(59, 130, 246, 0.2)",
    "Dérogation mineure": "rgba(139, 92, 246, 0.2)",
    "Implantation": "rgba(34, 211, 238, 0.2)",
    "Levé topographique": "rgba(163, 230, 53, 0.2)",
    "OCTR": "rgba(249, 115, 22, 0.2)",
    "Piquetage": "rgba(236, 72, 153, 0.2)",
    "Plan montrant": "rgba(99, 102, 241, 0.2)",
    "Projet de lotissement": "rgba(20, 184, 166, 0.2)",
    "Recherches": "rgba(168, 85, 247, 0.2)"
  };
  return colors[typeMandat] || "rgba(100, 116, 139, 0.2)";
};

const getMandatTextColor = (typeMandat) => {
  const colors = {
    "Bornage": "#f87171",
    "Certificat de localisation": "#34d399",
    "CPTAQ": "#fbbf24",
    "Description Technique": "#60a5fa",
    "Dérogation mineure": "#a78bfa",
    "Implantation": "#22d3ee",
    "Levé topographique": "#bef264",
    "OCTR": "#fb923c",
    "Piquetage": "#f472b6",
    "Plan montrant": "#818cf8",
    "Projet de lotissement": "#2dd4bf",
    "Recherches": "#c084fc"
  };
  return colors[typeMandat] || "#94a3b8";
};

export default function MultiRouteMap({ routes, apiKey, onRouteDurations, visibleRouteIndices, clients = [], users = [], renderTooltip }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const googleMapRef = useRef(null);
  const directionsRenderersRef = useRef([]);
  const markersGroupRef = useRef([]); // tableau de tableaux: markersGroupRef[routeIndex] = [markers...]
  const markersRef = useRef([]);
  const [hoveredDossier, setHoveredDossier] = useState(null);
  const [cardStatuts, setCardStatuts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('terrainCardStatuts') || '{}'); } catch { return {}; }
  });

  const handleCardStatutChange = (cardId, newStatut) => {
    setCardStatuts(prev => {
      const next = { ...prev, [cardId]: { ...prev[cardId], statut: newStatut } };
      localStorage.setItem('terrainCardStatuts', JSON.stringify(next));
      return next;
    });
  };
  // Garder une ref à jour sur visibleRouteIndices pour pouvoir l'utiliser dans les callbacks async
  const visibleRouteIndicesRef = useRef(visibleRouteIndices);
  useEffect(() => { visibleRouteIndicesRef.current = visibleRouteIndices; }, [visibleRouteIndices]);

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
        markersGroupRef.current = [];
        setHoveredDossier(null);

        const bounds = new window.google.maps.LatLngBounds();
        const directionsService = new window.google.maps.DirectionsService();

        let completedRoutes = 0;
        const routeDurationsSeconds = new Array(routes.length).fill(0);

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
              // Calculer la durée totale du trajet (tous les legs)
              const totalTravelSecs = result.routes[0].legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
              routeDurationsSeconds[index] = totalTravelSecs;

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

              directionsRenderersRef.current[index] = directionsRenderer;
              if (!markersGroupRef.current[index]) markersGroupRef.current[index] = [];

              // Créer des marqueurs personnalisés pour le départ et l'arrivée
              const route = result.routes[0];
              const startLocation = route.legs[0].start_location;
              const endLocation = route.legs[route.legs.length - 1].end_location;

              // Marqueur de départ
              const startMarker = new window.google.maps.Marker({
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
              markersGroupRef.current[index].push(startMarker);

              // Marqueurs pour chaque waypoint avec informations des dossiers
              // Les legs : leg[0] = bureau → wp[0], leg[1] = wp[0] → wp[1], ..., leg[n-1] = wp[n-2] → bureau
              // Donc le dossier[i] correspond au leg[i] (end_location de ce leg = le waypoint i)
              route.legs.forEach((leg, legIndex) => {
                const dossierIndex = legIndex; // leg[0] arrive au dossier[0], leg[1] au dossier[1], etc.
                if (dossiers && dossiers[dossierIndex]) {
                  const dossier = dossiers[dossierIndex];
                  const marker = new window.google.maps.Marker({
                    position: leg.end_location,
                    map: map,
                    label: {
                      text: String.fromCharCode(65 + dossierIndex), // A, B, C...
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
                    // dossier.cardId contient déjà le vrai cardId (dossierId-mandatIdx-terrainIdx) passé depuis buildRoutesForDate
                    setHoveredDossier({ ...dossier, teamColor });
                  });

                  marker.addListener('mouseout', () => {
                    setHoveredDossier(null);
                  });

                  markersRef.current.push(marker);
                  markersGroupRef.current[index].push(marker);
                }
              });

              // Ajouter les points au bounds
              result.routes[0].legs.forEach(leg => {
                bounds.extend(leg.start_location);
                bounds.extend(leg.end_location);
              });

              // Appliquer la visibilité initiale dès que le renderer est prêt
              const visible = visibleRouteIndicesRef.current;
              if (visible && !visible.includes(index)) {
                directionsRenderer.setMap(null);
                markersGroupRef.current[index]?.forEach(m => m.setMap(null));
              }

              completedRoutes++;
              if (completedRoutes === routes.length) {
                map.fitBounds(bounds);
                setLoading(false);
                if (onRouteDurations) onRouteDurations(routeDurationsSeconds);
              }
            } else {
              console.error(`Erreur pour le trajet ${index}:`, status);
              routeDurationsSeconds[index] = 0;
              completedRoutes++;
              if (completedRoutes === routes.length) {
                setLoading(false);
                if (onRouteDurations) onRouteDurations(routeDurationsSeconds);
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
      directionsRenderersRef.current.forEach(renderer => renderer && renderer.setMap(null));
      directionsRenderersRef.current = [];
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      markersGroupRef.current = [];
      setHoveredDossier(null);
    };
  }, [apiKey, routes]);

  // Effet séparé pour show/hide les routes sans recréer la carte
  useEffect(() => {
    if (!visibleRouteIndices) return;
    // Appliquer immédiatement sur ce qui est déjà chargé
    const map = googleMapRef.current;
    if (!map) return; // Vérifier que la carte existe
    
    directionsRenderersRef.current.forEach((renderer, i) => {
      if (!renderer) return;
      const isVisible = visibleRouteIndices.includes(i);
      const currentMap = renderer.getMap();
      const shouldBeVisible = isVisible ? map : null;
      // Forcer la mise à jour même si c'est la même valeur
      if ((currentMap === null) !== (shouldBeVisible === null)) {
        renderer.setMap(shouldBeVisible);
      }
    });
    
    markersGroupRef.current.forEach((markers, i) => {
      if (!markers) return;
      const isVisible = visibleRouteIndices.includes(i);
      const shouldBeVisible = isVisible ? map : null;
      markers.forEach(marker => {
        const currentMap = marker.getMap();
        if ((currentMap === null) !== (shouldBeVisible === null)) {
          marker.setMap(shouldBeVisible);
        }
      });
    });
  }, [visibleRouteIndices]);

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
      
      {/* Infobulle dans le coin supérieur droit - style carte dossier */}
      {hoveredDossier && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          pointerEvents: 'none',
          width: 240,
        }}>
          {renderTooltip
            ? renderTooltip(hoveredDossier)
            : <TooltipCard card={hoveredDossier} clients={clients} users={users} cardStatuts={cardStatuts} onStatutChange={handleCardStatutChange} />
          }
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}