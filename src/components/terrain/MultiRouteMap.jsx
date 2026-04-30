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

const getArpenteurColorHex = (arpenteur) => {
  const colors = { "Samuel Guay": "#ef4444", "Pierre-Luc Pilote": "#64748b", "Frédéric Gilbert": "#f97316", "Dany Gaboury": "#eab308", "Benjamin Larouche": "#06b6d4" };
  return colors[arpenteur] || "#10b981";
};

const getArpenteurInitials = (arpenteur) => {
  const mapping = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
  return mapping[arpenteur] || "";
};

const formatAdresseOverlay = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

export default function MultiRouteMap({ routes, apiKey, onRouteDurations, visibleRouteIndices, clients = [], users = [], renderTooltip, overlayCards = [] }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const googleMapRef = useRef(null);
  const directionsRenderersRef = useRef([]);
  const markersGroupRef = useRef([]); // tableau de tableaux: markersGroupRef[routeIndex] = [markers...]
  const markersRef = useRef([]);
  const overlayMarkersRef = useRef([]);
  const [hoveredDossier, setHoveredDossier] = useState(null);
  const [hoveredOverlay, setHoveredOverlay] = useState(null);
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

              // Marqueur de départ (sans étiquette)
              const startMarker = new window.google.maps.Marker({
                position: startLocation,
                map: map,
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
              // Les legs : leg[0] = bureau → wp[0], leg[1] = wp[0] → wp[1], ..., leg[n-1] = dernier wp → bureau
              // On exclut le dernier leg (retour au bureau, pas de dossier)
              route.legs.slice(0, -1).forEach((leg, legIndex) => {
                const dossierIndex = legIndex;
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
      overlayMarkersRef.current.forEach(m => m.setMap(null));
      overlayMarkersRef.current = [];
      setHoveredDossier(null);
    };
  }, [apiKey, routes]);

  // Effet pour les pins overlay (terrains à planifier)
  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !overlayCards.length) return;

    overlayMarkersRef.current.forEach(m => m.setMap(null));
    overlayMarkersRef.current = [];
    setHoveredOverlay(null);

    const geocoder = new window.google.maps.Geocoder();

    overlayCards.forEach((card, index) => {
      const adresse = formatAdresseOverlay(card.mandat?.adresse_travaux);
      if (!adresse) return;

      setTimeout(() => {
        geocoder.geocode({ address: adresse + ', Québec, Canada' }, (results, status) => {
          if (status !== 'OK' || !results?.[0] || !googleMapRef.current) return;
          const pos = results[0].geometry.location;
          const color = getArpenteurColorHex(card.dossier.arpenteur_geometre);
          const label = `${getArpenteurInitials(card.dossier.arpenteur_geometre)}${card.dossier.numero_dossier}`;

          const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 44 56">
            <filter id="sh${index}"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>
            <path d="M22 2 C10.4 2 1 11.4 1 23 C1 38 22 54 22 54 C22 54 43 38 43 23 C43 11.4 33.6 2 22 2 Z"
              fill="${color}" stroke="white" stroke-width="3" filter="url(#sh${index})" opacity="0.75"/>
            <circle cx="22" cy="22" r="8" fill="white" opacity="0.85"/>
          </svg>`;
          const encodedSvg = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgPin);

          const marker = new window.google.maps.Marker({
            position: pos,
            map: googleMapRef.current,
            title: label,
            icon: { url: encodedSvg, scaledSize: new window.google.maps.Size(16, 20), anchor: new window.google.maps.Point(8, 19) },
            zIndex: 3,
          });

          marker.addListener('mouseover', () => setHoveredOverlay(card));
          marker.addListener('mouseout', () => setHoveredOverlay(null));
          overlayMarkersRef.current.push(marker);
        });
      }, index * 100);
    });
  }, [overlayCards, googleMapRef.current]);

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
      {(hoveredDossier || hoveredOverlay) && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          pointerEvents: 'none',
          width: 240,
        }}>
          <TooltipCard card={hoveredDossier || hoveredOverlay} clients={clients} users={users} cardStatuts={cardStatuts} onStatutChange={handleCardStatutChange} />
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}