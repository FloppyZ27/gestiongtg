import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, X, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom ?? map.getZoom());
  }, [center, zoom, map]);
  return null;
}

function createHeadingIcon(heading, isCurrent) {
  const color = isCurrent ? '#3b82f6' : '#10b981';
  const rotation = heading !== null && heading !== undefined ? heading : 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
    <circle cx="20" cy="20" r="16" fill="${color}" stroke="white" stroke-width="2"/>
    <g transform="translate(20, 20) rotate(${rotation})">
      <path d="M 0,-10 L 6,4 L -6,4 Z" fill="white" stroke="white" stroke-width="1" stroke-linejoin="round"/>
    </g>
    <circle cx="20" cy="20" r="3" fill="white"/>
  </svg>`;
  return L.divIcon({ html: svg, iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20] });
}

export default function PhotoLightboxModal({
  photosFiles,
  photosGPS,
  selectedDossier,
  lightboxIndex,
  setLightboxIndex,
  onClose,
}) {
  const current = photosFiles[lightboxIndex] ?? null;
  const isImg = current && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    current.name.split('.').pop()?.toLowerCase()
  );

  const dossierId = selectedDossier?.id;
  const photosGPSForDossier = photosGPS.filter(
    gps => gps.dossier_id === dossierId && gps.latitude && gps.longitude
  );

  const currentGPS = photosGPSForDossier.find(
    gps => photosFiles.findIndex(f => f.name === gps.photo_name) === lightboxIndex
  );

  const allPositions = photosGPSForDossier.map(gps => [gps.latitude, gps.longitude]);
  const mapCenter = currentGPS
    ? [currentGPS.latitude, currentGPS.longitude]
    : allPositions.length > 0
      ? [
          photosGPSForDossier.reduce((s, g) => s + g.latitude, 0) / photosGPSForDossier.length,
          photosGPSForDossier.reduce((s, g) => s + g.longitude, 0) / photosGPSForDossier.length,
        ]
      : null;

  const goPrev = () => {
    setLightboxIndex(i => (i - 1 + photosFiles.length) % photosFiles.length);
  };
  const goNext = () => {
    setLightboxIndex(i => (i + 1) % photosFiles.length);
  };

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null || !photosFiles.length) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [photosFiles.length, lightboxIndex]);

  if (lightboxIndex === null || !photosFiles.length) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Fenêtre modale */}
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '92vw', maxWidth: 1300, height: 'calc(100vh - 100px)', marginTop: 100 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 flex-shrink-0">
          <span className="text-slate-300 text-sm font-medium truncate max-w-md">
            📷 {current?.name}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">{lightboxIndex + 1} / {photosFiles.length}</span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Corps principal ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Photo + navigateur flèches */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Zone photo */}
            <div className="flex-1 flex items-center justify-center relative bg-black/30 overflow-hidden">
              {photosFiles.length > 1 && (
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-2 transition-colors"
                  onClick={goPrev}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {isImg && current?.downloadUrl ? (
                <img
                  src={current.downloadUrl}
                  alt={current.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                  style={{ maxHeight: 'calc(90vh - 180px)' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 gap-3">
                  <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                  </div>
                  <p className="text-sm">{current?.name}</p>
                </div>
              )}

              {photosFiles.length > 1 && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-2 transition-colors"
                  onClick={goNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Navigateur miniatures */}
            {photosFiles.length > 1 && (
              <div className="flex-shrink-0 bg-slate-950/60 px-4 py-3 flex items-center justify-center gap-2 overflow-x-auto">
                {photosFiles.map((file, idx) => {
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
                    file.name.split('.').pop()?.toLowerCase()
                  );
                  const hasGPS = photosGPSForDossier.some(g => g.photo_name === file.name);
                  return (
                    <button
                      key={file.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        lightboxIndex === idx
                          ? 'border-blue-500 ring-2 ring-blue-400 scale-110'
                          : 'border-slate-600 hover:border-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {isImage && file.downloadUrl ? (
                        <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-xs">
                          📄
                        </div>
                      )}
                      {/* Badge GPS */}
                      {hasGPS && (
                        <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Carte */}
          <div className="w-[380px] flex-shrink-0 border-l border-slate-700 flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-700 flex items-center gap-2 flex-shrink-0">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 text-sm font-medium">Position GPS</span>
              {currentGPS && (
                <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {currentGPS.heading !== null && currentGPS.heading !== undefined
                    ? Math.round(currentGPS.heading) + '°'
                    : 'N/A'}
                </span>
              )}
            </div>

            <div className="flex-1 relative">
              {mapCenter ? (
                <MapContainer
                  key={`map-${lightboxIndex}`}
                  center={mapCenter}
                  zoom={18}
                  maxZoom={21}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={true}
                >
                  <MapCenter center={mapCenter} zoom={18} />
                  <TileLayer
                    url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    attribution="&copy; Google"
                    maxZoom={21}
                  />
                  {photosGPSForDossier.map((gps) => {
                    const photoIdx = photosFiles.findIndex(f => f.name === gps.photo_name);
                    const isCurrent = photoIdx === lightboxIndex;
                    return (
                      <Marker
                        key={gps.id || gps.photo_name}
                        position={[gps.latitude, gps.longitude]}
                        icon={createHeadingIcon(gps.heading, isCurrent)}
                        zIndexOffset={isCurrent ? 1000 : 0}
                      >
                        <Popup>
                          <div className="text-xs space-y-1">
                            <p className="font-bold">Photo {photoIdx + 1}</p>
                            {gps.accuracy_meters && (
                              <p className="text-slate-500">Précision: ±{Math.round(gps.accuracy_meters)}m</p>
                            )}
                            <p className="text-slate-500">
                              Direction: {gps.heading !== null && gps.heading !== undefined
                                ? Math.round(gps.heading) + '°'
                                : 'N/A'}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <MapPin className="w-10 h-10 text-slate-700" />
                  <p className="text-sm text-center px-4">Aucune donnée GPS disponible pour ces photos</p>
                </div>
              )}
            </div>

            {/* Info GPS */}
            {currentGPS && (
              <div className="flex-shrink-0 px-4 py-2 border-t border-slate-700 bg-slate-800/50">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-slate-500">Lat: </span>
                    <span className="text-slate-300">{currentGPS.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lng: </span>
                    <span className="text-slate-300">{currentGPS.longitude.toFixed(6)}</span>
                  </div>
                  {currentGPS.accuracy_meters && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Précision: </span>
                      <span className="text-emerald-400">±{Math.round(currentGPS.accuracy_meters)}m</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}