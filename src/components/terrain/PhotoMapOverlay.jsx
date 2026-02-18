import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function PhotoMapOverlay({ photosGPS, photosFiles, selectedDossier, lightboxIndex }) {
  if (!selectedDossier || photosGPS.length === 0) return null;

  const dossierId = selectedDossier.id;
  const photosGPSForDossier = photosGPS.filter(
    gps => gps.dossier_id === dossierId && gps.latitude && gps.longitude
  );

  if (photosGPSForDossier.length === 0) return null;

  const currentGPS = lightboxIndex !== null ? photosGPSForDossier.find(gps => 
    photosFiles.findIndex(f => f.name === gps.photo_name) === lightboxIndex
  ) : null;

  const center = currentGPS 
    ? [currentGPS.latitude, currentGPS.longitude]
    : [
        photosGPSForDossier.reduce((sum, gps) => sum + gps.latitude, 0) / photosGPSForDossier.length,
        photosGPSForDossier.reduce((sum, gps) => sum + gps.longitude, 0) / photosGPSForDossier.length
      ];

  const createHeadingIcon = (heading, isCurrent) => {
    const color = isCurrent ? '#3b82f6' : '#10b981';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="16" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(20, 20) rotate(${heading || 0})">
        <path d="M 0,-12 L 5,2 L -5,2 Z" fill="white" stroke="white" stroke-width="1" stroke-linejoin="round"/>
      </g>
      <circle cx="20" cy="20" r="4" fill="white"/>
    </svg>`;
    
    return L.divIcon({
      html: svg,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  return (
    <div className="absolute top-1/2 right-4 -translate-y-1/2 w-[450px] h-[450px] rounded-lg overflow-hidden border border-slate-600 shadow-lg z-20" onClick={e => e.stopPropagation()}>
      <MapContainer center={center} zoom={18} maxZoom={21} style={{ height: '100%', width: '100%' }}>
        <MapCenter center={center} />
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution='&copy; Google'
          maxZoom={21}
        />
        {photosGPSForDossier.map((gps) => {
          const photoIdx = photosFiles.findIndex(f => f.name === gps.photo_name);
          const photoNum = photoIdx >= 0 ? photoIdx + 1 : 0;
          const isCurrent = lightboxIndex === photoIdx;

          return (
            <Marker 
              key={gps.id} 
              position={[gps.latitude, gps.longitude]}
              icon={createHeadingIcon(gps.heading, isCurrent)}
            >
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">Photo {photoNum}</p>
                  <p className="text-slate-600">{gps.photo_name}</p>
                  {gps.accuracy_meters && <p className="text-slate-500">±{Math.round(gps.accuracy_meters)}m</p>}
                  {gps.heading !== null && gps.heading !== undefined && <p className="text-slate-500">Direction: {Math.round(gps.heading)}°</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}