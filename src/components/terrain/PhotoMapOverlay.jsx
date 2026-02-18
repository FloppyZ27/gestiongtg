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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <g transform="translate(12, 12) rotate(${heading || 0})">
        <path d="M 0,-10 L 3,-3 L -3,-3 Z" fill="${color}" stroke="white" stroke-width="1"/>
        <circle cx="0" cy="0" r="8" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
      </g>
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>`;
    
    return L.divIcon({
      html: svg,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  return (
    <div className="absolute bottom-96 right-4 w-[600px] h-[600px] rounded-lg overflow-hidden border border-slate-600 shadow-lg z-20" onClick={e => e.stopPropagation()}>
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