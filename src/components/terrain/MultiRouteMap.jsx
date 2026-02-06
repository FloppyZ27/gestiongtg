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

const getArpenteurBgColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "rgba(239, 68, 68, 0.2)",
    "Pierre-Luc Pilote": "rgba(100, 116, 139, 0.2)",
    "Frédéric Gilbert": "rgba(249, 115, 22, 0.2)",
    "Dany Gaboury": "rgba(234, 179, 8, 0.2)",
    "Benjamin Larouche": "rgba(34, 211, 238, 0.2)"
  };
  return colors[arpenteur] || "rgba(16, 185, 129, 0.2)";
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
      
      {/* Infobulle dans le coin supérieur droit - style carte dossier */}
      {hoveredDossier && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: getArpenteurBgColor(hoveredDossier.arpenteur),
          borderRadius: '8px',
          padding: '8px',
          minWidth: '260px',
          maxWidth: '320px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          {/* Entête : N° Dossier et Type de mandat */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'white',
              background: getArpenteurBgColor(hoveredDossier.arpenteur),
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px'
            }}>
              {hoveredDossier.numero}
            </span>
            <span style={{
              display: 'inline-block',
              padding: '2px 10px',
              fontSize: '12px',
              fontWeight: '600',
              color: getMandatTextColor(hoveredDossier.mandatType),
              background: getMandatBgColor(hoveredDossier.mandatType),
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px'
            }}>
              {hoveredDossier.mandat}
            </span>
          </div>

          {/* Clients */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <svg style={{ width: '12px', height: '12px', color: 'white', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span style={{ fontSize: '12px', color: 'white', fontWeight: '500' }}>{hoveredDossier.clients}</span>
          </div>

          {/* Adresse */}
          {hoveredDossier.adresse && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-word' }}>{hoveredDossier.adresse}</span>
            </div>
          )}

          {/* Date de livraison */}
          {hoveredDossier.dateLivraison && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#34d399', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span style={{ fontSize: '12px', color: '#6ee7b7' }}>Livraison: {hoveredDossier.dateLivraison}</span>
            </div>
          )}

          {/* Date limite */}
          {hoveredDossier.dateLimite && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#fbbf24', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span style={{ fontSize: '12px', color: '#fde047' }}>Limite: {hoveredDossier.dateLimite}</span>
            </div>
          )}

          {/* Rendez-vous */}
          {hoveredDossier.rendezVous && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#fb923c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: '12px', color: '#fdba74' }}>RDV: {hoveredDossier.rendezVous}</span>
            </div>
          )}

          {/* Instruments requis */}
          {hoveredDossier.instrumentsRequis && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#34d399', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span style={{ fontSize: '12px', color: '#6ee7b7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hoveredDossier.instrumentsRequis}</span>
            </div>
          )}

          {/* Technicien */}
          {hoveredDossier.technicien && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#60a5fa', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: '12px', color: '#93c5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hoveredDossier.technicien}</span>
            </div>
          )}

          {/* Dossier simultané */}
          {hoveredDossier.dossierSimultane && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#c084fc', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span style={{ fontSize: '12px', color: '#d8b4fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Avec: {hoveredDossier.dossierSimultane}</span>
            </div>
          )}

          {/* Temps prévu */}
          {hoveredDossier.tempsPrevu && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'flex-start',
              marginTop: '8px', 
              paddingTop: '4px', 
              borderTop: '1px solid rgba(16, 185, 129, 0.3)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg style={{ width: '12px', height: '12px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontSize: '12px', color: '#6ee7b7' }}>{hoveredDossier.tempsPrevu}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}