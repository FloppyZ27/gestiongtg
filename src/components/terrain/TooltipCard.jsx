import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export function TooltipCard({ card }) {
  if (!card) return null;

  const { dossier, mandat, terrain } = card;
  const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
  const clientsNames = card.clients || '';
  const formatAdresse = (addr) => {
    if (!addr) return '';
    const parts = [];
    if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== '') 
      parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
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

  return (
    <div style={{
      background: getArpenteurBgColor(dossier.arpenteur_geometre),
      borderRadius: '8px',
      padding: '8px',
      minWidth: '260px',
      maxWidth: '320px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
    }}>
      {/* Badge numéro et mandat */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <span style={{
          display: 'inline-block',
          padding: '2px 10px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'white',
          background: getArpenteurBgColor(dossier.arpenteur_geometre),
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '4px'
        }}>
          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
        </span>
        <span style={{
          display: 'inline-block',
          padding: '2px 10px',
          fontSize: '12px',
          fontWeight: '600',
          color: getMandatTextColor(mandat?.type_mandat),
          background: getMandatBgColor(mandat?.type_mandat),
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '4px'
        }}>
          {mandat?.type_mandat || 'Mandat'}
        </span>
      </div>

      {/* Clients */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <svg style={{ width: '12px', height: '12px', color: 'white', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span style={{ fontSize: '12px', color: 'white', fontWeight: '500' }}>{clientsNames || '-'}</span>
      </div>

      {/* Adresse */}
      {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-word' }}>{formatAdresse(mandat.adresse_travaux)}</span>
        </div>
      )}

      {/* Date livraison */}
      {mandat?.date_livraison && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#34d399', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span style={{ fontSize: '12px', color: '#6ee7b7' }}>Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
        </div>
      )}

      {/* Date limite */}
      {terrain?.date_limite_leve && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#fbbf24', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span style={{ fontSize: '12px', color: '#fde047' }}>Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
        </div>
      )}

      {/* RDV */}
      {terrain?.a_rendez_vous && terrain?.date_rendez_vous && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#fb923c', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ fontSize: '12px', color: '#fdba74' }}>RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}{terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}</span>
        </div>
      )}

      {/* Instruments */}
      {terrain?.instruments_requis && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#34d399', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span style={{ fontSize: '12px', color: '#6ee7b7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{terrain.instruments_requis}</span>
        </div>
      )}

      {/* Technicien */}
      {terrain?.technicien && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#60a5fa', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{ fontSize: '12px', color: '#93c5fd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{terrain.technicien}</span>
        </div>
      )}

      {/* Dossier simultané */}
      {terrain?.dossier_simultane && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#c084fc', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span style={{ fontSize: '12px', color: '#d8b4fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Avec: {terrain.dossier_simultane}</span>
        </div>
      )}

      {/* Notes */}
      {terrain?.notes && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
          <svg style={{ width: '12px', height: '12px', color: '#94a3b8', flexShrink: 0, marginTop: '2px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span style={{ fontSize: '12px', color: '#94a3b8', wordBreak: 'break-word' }}>{terrain.notes}</span>
        </div>
      )}

      {/* Temps prévu et donneur */}
      {(terrain?.temps_prevu || card.donneurObj) && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginTop: '8px', 
          paddingTop: '8px', 
          borderTop: '1px solid rgba(16, 185, 129, 0.3)',
          gap: '8px'
        }}>
          {terrain?.temps_prevu && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg style={{ width: '12px', height: '12px', color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: '12px', color: '#6ee7b7' }}>{terrain.temps_prevu}</span>
            </div>
          )}
          {card.donneurObj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              {card.donneurObj.photo_url ? (
                <img src={card.donneurObj.photo_url} alt={card.donneur} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #c4b5fd', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #c084fc 0%, #a78bfa 100%)', border: '2px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '700' }}>
                  {card.donneur?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getArpenteurColor(arpenteur) {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
}