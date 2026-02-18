import React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function PhotoMapOverlay({ photosGPS, photosFiles, selectedDossier, lightboxIndex }) {
  if (!selectedDossier || photosGPS.length === 0) return null;

  const dossierId = selectedDossier.id;
  const photosGPSForDossier = photosGPS.filter(
    gps => gps.dossier_id === dossierId && gps.latitude && gps.longitude
  );

  if (photosGPSForDossier.length === 0) return null;

  const center = [
    photosGPSForDossier.reduce((sum, gps) => sum + gps.latitude, 0) / photosGPSForDossier.length,
    photosGPSForDossier.reduce((sum, gps) => sum + gps.longitude, 0) / photosGPSForDossier.length
  ];

  return (
    <div className="fixed bottom-4 right-4 w-[700px] h-[700px] rounded-lg overflow-hidden border border-slate-600 shadow-2xl z-20" onClick={e => e.stopPropagation()}>
      <MapContainer center={center} zoom={18} maxZoom={22} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          attribution='&copy; Google Maps'
          maxZoom={22}
        />
        {photosGPSForDossier.map((gps) => {
          const photoIdx = photosFiles.findIndex(f => f.name === gps.photo_name);
          const photoNum = photoIdx >= 0 ? photoIdx + 1 : 0;

          return (
            <Marker key={gps.id} position={[gps.latitude, gps.longitude]}>
              <Popup>
                <div className="text-xs">
                  <p className="font-bold">Photo {photoNum}</p>
                  <p className="text-slate-600">{gps.photo_name}</p>
                  {gps.accuracy_meters && <p className="text-slate-500">±{Math.round(gps.accuracy_meters)}m</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}