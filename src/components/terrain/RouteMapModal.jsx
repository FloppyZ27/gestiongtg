import React from "react";
import { MapPin, X } from "lucide-react";

const getAdresseString = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques[0]);
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  if (addr.province) parts.push(addr.province);
  return parts.filter(p => p).join(' ');
};

export default function RouteMapModal({ equipesTerrain, equipesDuJourIds, dossiers, onClose }) {
  const apiKey = "AIzaSyDkcn0J2jEqEFb5ygUPqAn8qqJlNWl3I74";
  const bureauAddress = "11 rue melancon est, Alma";

  const equipesDuJour = equipesTerrain.filter(e => equipesDuJourIds.has(e.id));
  const waypointAddresses = equipesDuJour.flatMap(equipe =>
    (equipe.mandats || []).map(cardId => {
      const parts = cardId.split('-');
      const mandatIdx = parseInt(parts[parts.length - 2]);
      const dossierId = parts.slice(0, parts.length - 2).join('-');
      const dossier = dossiers.find(d => d.id === dossierId);
      const mandat = dossier?.mandats?.[mandatIdx];
      return mandat?.adresse_travaux ? getAdresseString(mandat.adresse_travaux) : null;
    }).filter(Boolean)
  );

  const destination = waypointAddresses.length > 0
    ? encodeURIComponent(waypointAddresses[waypointAddresses.length - 1])
    : encodeURIComponent(bureauAddress);

  const waypointsParam = waypointAddresses.length > 1
    ? `&waypoints=${waypointAddresses.slice(0, -1).map(encodeURIComponent).join('|')}`
    : '';

  const mapsUrl = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(bureauAddress)}&destination=${destination}${waypointsParam}&mode=driving`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Itinéraire de la journée</h3>
          <span className="text-slate-400 text-sm ml-2">
            {waypointAddresses.length} arrêt{waypointAddresses.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1" style={{ minHeight: 0 }}>
        {waypointAddresses.length > 0 ? (
          <iframe
            title="Itinéraire"
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapsUrl}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Aucune adresse disponible pour tracer l'itinéraire</p>
          </div>
        )}
      </div>
    </div>
  );
}