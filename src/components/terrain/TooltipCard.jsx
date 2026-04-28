import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500 text-red-900 border-red-600",
    "Certificat de localisation": "bg-emerald-500 text-emerald-900 border-emerald-600",
    "CPTAQ": "bg-amber-500 text-amber-900 border-amber-600",
    "Description Technique": "bg-blue-500 text-blue-900 border-blue-600",
    "Dérogation mineure": "bg-violet-500 text-violet-900 border-violet-600",
    "Implantation": "bg-cyan-500 text-cyan-900 border-cyan-600",
    "Levé topographique": "bg-lime-500 text-lime-900 border-lime-600",
    "OCTR": "bg-orange-500 text-orange-900 border-orange-600",
    "Piquetage": "bg-pink-500 text-pink-900 border-pink-600",
    "Plan montrant": "bg-indigo-500 text-indigo-900 border-indigo-600",
    "Projet de lotissement": "bg-teal-500 text-teal-900 border-teal-600",
    "Recherches": "bg-purple-500 text-purple-900 border-purple-600"
  };
  return colors[typeMandat] || "bg-slate-500 text-slate-900 border-slate-600";
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500 text-red-900 border-red-600",
    "Pierre-Luc Pilote": "bg-slate-500 text-slate-900 border-slate-600",
    "Frédéric Gilbert": "bg-orange-500 text-orange-900 border-orange-600",
    "Dany Gaboury": "bg-yellow-500 text-yellow-900 border-yellow-600",
    "Benjamin Larouche": "bg-cyan-500 text-cyan-900 border-cyan-600"
  };
  return colors[arpenteur] || "bg-emerald-500 text-emerald-900 border-emerald-600";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") 
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

const getUserInitials = (user) => {
  if (!user) return 'U';
  const parts = (user.full_name || user.prenom + ' ' + user.nom || '').trim().split(' ');
  return parts.map(p => p[0]).join('').toUpperCase() || 'U';
};

export function TooltipCard({ card, clients = [], users = [] }) {
  if (!card) return null;

  const { dossier, mandat, terrain } = card;
  const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
  
  // Récupérer les noms des clients
  const clientsNames = clients
    .filter(c => dossier.clients_ids?.includes(c.id))
    .map(c => `${c.prenom} ${c.nom}`)
    .join(', ') || '-';

  // Récupérer l'utilisateur assigné au mandat
  const assignedUser = mandat?.utilisateur_assigne 
    ? users?.find(u => u.email === mandat.utilisateur_assigne)
    : null;

  // Récupérer le donneur
  const donneurUser = terrain?.donneur
    ? users?.find(u => u.full_name === terrain.donneur)
    : null;

  return (
    <div className="bg-slate-700 text-slate-100 rounded-xl p-2" style={{ 
      width: '240px',
      boxShadow: '0 4px 16px 0 rgba(0,0,0,0.4)' 
    }}>

      {/* Badges : N° Dossier et Type Mandat */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex gap-2 flex-wrap">
          <span className={`${arpColor} border text-xs flex-shrink-0 px-2.5 py-0.5 rounded-md`}>
            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
          </span>
          <span className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0 px-2.5 py-0.5 rounded-md`}>
            {getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}
          </span>
        </div>
      </div>

      {/* Clients */}
      <div className="flex items-center gap-1 mb-1">
        <svg className="w-3 h-3 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-xs text-white font-medium">{clientsNames}</span>
      </div>

      {/* Adresse */}
      {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
        <div className="flex items-start gap-1 mb-1">
          <svg className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span>
        </div>
      )}

      {/* Date livraison */}
      {mandat?.date_livraison && (
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
        </div>
      )}

      {/* Date limite */}
      {terrain?.date_limite_leve && (
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
        </div>
      )}

      {/* RDV */}
      {terrain?.a_rendez_vous && terrain?.date_rendez_vous && (
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-3 h-3 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-orange-300">RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}{terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}</span>
        </div>
      )}

      {/* Instruments */}
      {terrain?.instruments_requis && (
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span>
        </div>
      )}

      {/* Technicien */}
      {terrain?.technicien && (
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-3 h-3 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-blue-300 truncate">{terrain.technicien}</span>
        </div>
      )}

      {/* Dossier simultané */}
      {terrain?.dossier_simultane && (
        <div className="flex items-center gap-1 mb-1">
          <svg className="w-3 h-3 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span>
        </div>
      )}

      {/* Notes */}
      {terrain?.notes && (
        <div className="flex items-start gap-1 mb-1">
          <svg className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs text-slate-400 break-words">{terrain.notes}</span>
        </div>
      )}

      {/* Footer : Temps prévu, Statut, Donneur */}
      <div className="flex items-center justify-between mt-2 pt-1 border-t border-emerald-500/30 gap-2">
        <div>
          {terrain?.temps_prevu && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs text-emerald-300">{terrain.temps_prevu}</span>
            </div>
          )}
        </div>
        {assignedUser ? (
          <div className="flex items-center gap-1">
            {assignedUser.photo_url ? (
              <img src={assignedUser.photo_url} alt={assignedUser.full_name} className="w-6 h-6 rounded-full border-2 border-emerald-500/50 object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs flex items-center justify-center font-bold">
                {getUserInitials(assignedUser)}
              </div>
            )}
          </div>
        ) : donneurUser ? (
          <div className="flex items-center gap-1">
            {donneurUser.photo_url ? (
              <img src={donneurUser.photo_url} alt={donneurUser.full_name} className="w-6 h-6 rounded-full border-2 border-emerald-500/50 object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs flex items-center justify-center font-bold">
                {getUserInitials(donneurUser)}
              </div>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
            <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}