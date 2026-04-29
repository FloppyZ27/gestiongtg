import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Calendar, AlertCircle, Clock, Wrench, UserCheck, Link2, Timer } from 'lucide-react';

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
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

const getUserInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

const STATUT_OPTIONS = ['Rendez-Vous', 'Client Avisé', 'Confirmé la veille', 'Retour terrain'];

export function TooltipCard({ card, clients = [], users = [], cardStatuts = {}, onStatutChange }) {
  if (!card || !card.dossier) return null;

  const { dossier, mandat, terrain } = card;
  const cardId = card.id || card.cardId;

  const arpColor = getArpenteurColor(dossier.arpenteur_geometre);

  const currentStatut = cardStatuts[cardId]?.statut || null;
  const isOrange = currentStatut === 'Rendez-Vous' || currentStatut === 'Client Avisé';
  const isMauve = currentStatut === 'Confirmé la veille' || currentStatut === 'Retour terrain';

  // Clients
  const clientsNames = clients
    .filter(c => dossier.clients_ids?.includes(c.id))
    .map(c => `${c.prenom} ${c.nom}`)
    .join(', ') || dossier.clients_texte || '-';

  // Utilisateur assigné au mandat
  const assignedUser = mandat?.utilisateur_assigne
    ? users.find(u => u.email === mandat.utilisateur_assigne)
    : null;

  // Donneur
  const donneurUser = terrain?.donneur
    ? users.find(u => u.full_name === terrain.donneur)
    : null;

  const handleStatutChange = (val) => {
    if (onStatutChange) {
      const newVal = (val === '__vide__' || val === currentStatut) ? null : val;
      onStatutChange(cardId, newVal);
    }
  };

  return (
    <div
      className="bg-slate-800 rounded-xl p-2"
      style={{ width: '240px', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.5)', border: '1px solid rgba(71,85,105,0.6)' }}
    >
      {/* Badges : N° Dossier et Type Mandat */}
      <div className="flex items-start gap-2 mb-2 flex-wrap">
        <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>
          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
        </Badge>
        <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0`}>
          {getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}
        </Badge>
      </div>

      {/* Clients */}
      <div className="flex items-center gap-1 mb-1">
        <User className="w-3 h-3 text-white flex-shrink-0" />
        <span className="text-xs text-white font-medium truncate">{clientsNames}</span>
      </div>

      {/* Adresse */}
      {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && (
        <div className="flex items-start gap-1 mb-1">
          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span>
        </div>
      )}

      {/* Date livraison */}
      {mandat?.date_livraison && (
        <div className="flex items-center gap-1 mb-1">
          <Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
        </div>
      )}

      {/* Date limite */}
      {terrain?.date_limite_leve && (
        <div className="flex items-center gap-1 mb-1">
          <AlertCircle className="w-3 h-3 text-yellow-400 flex-shrink-0" />
          <span className="text-xs text-yellow-300">Limite: {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}</span>
        </div>
      )}

      {/* RDV */}
      {terrain?.a_rendez_vous && terrain?.date_rendez_vous && (
        <div className="flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <span className="text-xs text-orange-300">
            RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}
            {terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}
          </span>
        </div>
      )}

      {/* Instruments */}
      {terrain?.instruments_requis && (
        <div className="flex items-center gap-1 mb-1">
          <Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span>
        </div>
      )}

      {/* Technicien */}
      {terrain?.technicien && (
        <div className="flex items-center gap-1 mb-1">
          <UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-blue-300 truncate">{terrain.technicien}</span>
        </div>
      )}

      {/* Dossier simultané */}
      {terrain?.dossier_simultane && (
        <div className="flex items-center gap-1 mb-1">
          <Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" />
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

      {/* Footer : temps prévu | statut | donneur */}
      <div className="flex items-center gap-1 mt-2 pt-1 border-t border-emerald-500/30">
        {/* Temps prévu */}
        <div className="flex-shrink-0">
          {terrain?.temps_prevu
            ? <div className="flex items-center gap-0.5"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>
            : <div className="w-10" />}
        </div>

        {/* Select statut */}
        <div className="flex-1 min-w-0">
          <Select value={currentStatut || ""} onValueChange={handleStatutChange}>
            <SelectTrigger
              className="w-full h-6 text-xs px-1.5 py-0"
              style={{
                background: isOrange ? 'rgba(249,115,22,0.3)' : isMauve ? 'rgba(139,92,246,0.3)' : 'rgba(30,41,59,0.4)',
                color: isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8',
                fontWeight: (isOrange || isMauve) ? 600 : 400,
                opacity: (!isOrange && !isMauve) ? 0.5 : 1,
                boxShadow: `0 0 0 1px ${isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8'}`,
                border: 'none', outline: 'none',
                justifyContent: 'center', textAlign: 'center',
              }}
            >
              <SelectValue placeholder="Statut..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="__vide__" className="text-xs text-slate-400">— Aucun —</SelectItem>
              {STATUT_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt} className="text-xs text-white">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Donneur initiales + avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {terrain?.donneur && (
            <span className="text-xs text-slate-400 font-medium">
              {terrain.donneur.trim().split(' ').map(n => n[0]?.toUpperCase()).join('')}
            </span>
          )}
          {donneurUser ? (
            <Avatar className="w-5 h-5 border border-emerald-500/50">
              <AvatarImage src={donneurUser.photo_url} />
              <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(donneurUser.full_name)}</AvatarFallback>
            </Avatar>
          ) : assignedUser ? (
            <Avatar className="w-5 h-5 border border-emerald-500/50">
              <AvatarImage src={assignedUser.photo_url} />
              <AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(assignedUser.full_name)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30">
              <User className="w-2.5 h-2.5 text-emerald-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}