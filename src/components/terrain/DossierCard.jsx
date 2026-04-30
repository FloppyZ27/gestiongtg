import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Calendar, AlertCircle, Clock, Wrench, UserCheck, Link2, Unlink, Timer, Edit, Trash2, Lock, Unlock } from 'lucide-react';

const getArpenteurInitials = (a) => ({ "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" }[a] || "");
const getArpenteurColor = (a) => ({ "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30", "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30", "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" }[a] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30");
const getMandatColor = (t) => ({ "Bornage": "bg-red-500/20 text-red-400 border-red-500/30", "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30", "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30", "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30", "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30", "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30", "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30", "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30", "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30" }[t] || "bg-slate-500/20 text-slate-400 border-slate-500/30");
const getAbbreviatedMandatType = (t) => ({ "Certificat de localisation": "CL", "Description Technique": "DT", "Implantation": "Imp", "Levé topographique": "Levé Topo", "Piquetage": "Piq" }[t] || t);
const getInitialsWithHyphens = (text) => text.split('-').map(p => p[0]?.toUpperCase()).join('');
const getUserInitials = (user) => {
  if (!user) return 'U';
  const p = getInitialsWithHyphens(user.prenom || '');
  const n = getInitialsWithHyphens(user.nom || '');
  return (p + n) || 'U';
};
const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  return parts.filter(p => p).join(', ');
};

// Couleur de la date cédulée selon l'écart avec la date limite
const getDateCeduleeColor = (dateCedulee, dateLimite) => {
  if (!dateCedulee || !dateLimite) return null;
  // diff = nb jours entre date cédulée et date limite (positif = limite après cédulée)
  const diff = Math.round((new Date(dateLimite + 'T00:00:00') - new Date(dateCedulee + 'T00:00:00')) / 86400000);
  if (diff > 7) return 'green';   // limite > 7 jours après cédulée → vert
  if (diff > 0) return 'orange';  // limite dans les 7 jours suivant cédulée → orange
  return 'red';                   // cédulée = ou après limite → rouge
};

const STATUT_OPTIONS = ['Rendez-Vous', 'Client Avisé', 'Confirmé la veille', 'Retour terrain'];

const CardActionBtn = ({ onClick, baseColor, hoverColor, textColor, hoverTextColor, title, children }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div onClick={onClick} title={title} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: hovered ? hoverColor : baseColor, color: hovered ? (hoverTextColor || '#ffffff') : textColor, transition: 'background-color 150ms, color 150ms', cursor: 'pointer', flexShrink: 0 }}>
      {children}
    </div>
  );
};

export function DossierCard({
  card, users, clients, techniciens, lockedCards, cardStatuts, linkedGroups, dragging, linkingMode,
  showLock = false, hideEditButton = false, hideLinkedButton = false, hideStatut = false, disableInteractions = false,
  onCardClick, onEditTerrain, onDeleteCard, onLinkCard, onUnlinkCard, onToggleLock, onStatutChange,
  holdTimerRef, didDragRef, handleDragStart, getLinkedGroupForCard,
}) {
  const { dossier, mandat, terrain } = card;
  const assignedUser = mandat?.utilisateur_assigne ? users?.find(u => u.email === mandat.utilisateur_assigne) : null;
  const donnerUser = terrain?.donneur ? users?.find(u => u.full_name === terrain.donneur) : null;
  const arpColor = getArpenteurColor(dossier.arpenteur_geometre);
  const draggingLinkedGroup = dragging ? getLinkedGroupForCard(dragging.card.id) : null;
  const isDraggingThis = !!dragging && (dragging.card.id === card.id || (draggingLinkedGroup?.cardIds.includes(card.id) ?? false));
  const isLocked = lockedCards?.has(card.id);
  const linkedGroup = getLinkedGroupForCard(card.id);
  const isLinked = !!linkedGroup;
  const isLinkingFirst = linkingMode?.firstCardId === card.id;
  const isLinkingTarget = !!linkingMode && !isLinkingFirst;

  const onMouseDown = (e) => {
    if (disableInteractions || isLocked) return;
    if (linkingMode !== null) return;
    e.stopPropagation();
    didDragRef.current = false;
    const savedEvent = { clientX: e.clientX, clientY: e.clientY, currentTarget: e.currentTarget };
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      didDragRef.current = true;
      handleDragStart({ ...savedEvent, preventDefault: () => {} }, card);
    }, 500);
  };
  const onMouseUp = () => { if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; } };
  const onClick = (e) => {
    if (disableInteractions) return;
    e.stopPropagation();
    if (linkingMode !== null) { onLinkCard(card.id); return; }
    if (!didDragRef.current) onCardClick(card);
  };

  const ringStyle = isLinkingFirst ? 'ring-2 ring-violet-400' : isLinked ? 'ring-1 ring-violet-500/60' : isLocked ? 'ring-1 ring-amber-500/60' : '';
  const colorMap = { 'bg-red-500/20': 'rgba(239,68,68,0.6)', 'bg-slate-500/20': 'rgba(148,163,184,0.6)', 'bg-orange-500/20': 'rgba(249,115,22,0.6)', 'bg-yellow-500/20': 'rgba(234,179,8,0.6)', 'bg-cyan-500/20': 'rgba(34,211,238,0.6)' };
  const bg = arpColor.split(' ')[0];
  const clr = colorMap[bg] || 'rgba(16,185,129,0.6)';
  const boxShadow = isLinked ? `inset 0 0 0 2px rgba(139,92,246,0.6), 0 4px 16px 0 rgba(0,0,0,0.4)` : isLocked ? `inset 0 0 0 2px rgba(245,158,11,0.5), 0 4px 16px 0 rgba(0,0,0,0.4)` : `inset 0 0 0 1px ${clr}, 0 4px 16px 0 rgba(0,0,0,0.4)`;

  // Code couleur date limite :
  // - Si carte assignée (date_cedulee) → comparaison date_cedulee vs date_limite
  // - Sinon (pas encore planifiée) → comparaison aujourd'hui vs date_limite
  const couleurEffective = getDateCeduleeColor(terrain.date_cedulee, terrain.date_limite_leve) || (() => {
    if (!terrain.date_limite_leve) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((new Date(terrain.date_limite_leve + 'T00:00:00') - today) / 86400000);
    if (diff > 7) return 'green';   // limite > 7 jours → vert
    if (diff > 0) return 'orange';  // limite dans les 7 jours → orange
    return 'red';                   // aujourd'hui = ou après limite → rouge
  })();
  const badgeBg = couleurEffective === 'green' ? 'rgba(22,163,74,0.85)' : couleurEffective === 'orange' ? 'rgba(234,88,12,0.85)' : couleurEffective === 'red' ? 'rgba(220,38,38,0.9)' : 'rgba(161,161,170,0.5)';
  const badgeBorder = couleurEffective === 'green' ? '#4ade80' : couleurEffective === 'orange' ? '#fb923c' : couleurEffective === 'red' ? '#f87171' : '#a1a1aa';
  const badgeGlow = couleurEffective === 'green' ? '0 0 8px rgba(74,222,128,0.5)' : couleurEffective === 'orange' ? '0 0 8px rgba(251,146,60,0.6)' : couleurEffective === 'red' ? '0 0 10px rgba(248,113,113,0.7)' : 'none';
  const iconColor = badgeBorder;
  const textColorLimite = '#ffffff';

  const currentStatut = cardStatuts?.[card.id]?.statut || null;
  const isOrange = currentStatut === 'Rendez-Vous' || currentStatut === 'Client Avisé';
  const isMauve = currentStatut === 'Confirmé la veille' || currentStatut === 'Retour terrain';
  const triggerInlineStyle = isOrange
    ? { background: 'rgba(249,115,22,0.3)', color: '#fb923c', fontWeight: 600, border: '1px solid #fb923c', textAlign: 'center', justifyContent: 'center' }
    : isMauve
    ? { background: 'rgba(139,92,246,0.3)', color: '#c084fc', fontWeight: 600, border: '1px solid #c084fc', textAlign: 'center', justifyContent: 'center' }
    : { background: 'rgba(30,41,59,0.4)', color: '#94a3b8', opacity: 0.5, border: '1px solid #94a3b8', textAlign: 'center', justifyContent: 'center' };

  return (
    <div
      onMouseDown={onMouseDown} onMouseUp={onMouseUp} onClick={onClick}
      className={`${bg} rounded-xl p-2 mb-2 select-none ${disableInteractions ? 'terrain-card-disabled' : 'transition-all duration-150'} ${ringStyle} ${disableInteractions ? '' : (isLocked ? 'opacity-80' : 'hover:scale-[1.02] cursor-pointer')} ${isDraggingThis ? 'opacity-30 scale-95' : ''} ${isLinkingTarget ? 'cursor-crosshair' : ''}`}
      style={{ cursor: disableInteractions ? 'default' : (isLocked ? 'default' : (linkingMode ? 'crosshair' : dragging ? (isDraggingThis ? 'grabbing' : 'inherit') : 'pointer')), boxShadow }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={`${arpColor} border text-xs flex-shrink-0`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
          <Badge className={`${getMandatColor(mandat?.type_mandat)} border text-xs font-semibold flex-shrink-0`}>{getAbbreviatedMandatType(mandat?.type_mandat) || 'Mandat'}</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', flexShrink: 0 }}>
          {!hideEditButton && (
            <CardActionBtn onClick={(e) => { e.stopPropagation(); onEditTerrain(card); }} baseColor="rgba(59,130,246,0.25)" hoverColor="rgba(59,130,246,0.85)" textColor="#93c5fd" hoverTextColor="#fff" title="Modifier le terrain">
              <Edit style={{ width: 13, height: 13 }} />
            </CardActionBtn>
          )}
          {!hideEditButton && (
            <CardActionBtn onClick={(e) => { e.stopPropagation(); onDeleteCard(card); }} baseColor="rgba(239,68,68,0.2)" hoverColor="rgba(239,68,68,0.85)" textColor="#fca5a5" hoverTextColor="#fff" title="Supprimer le terrain">
              <Trash2 style={{ width: 13, height: 13 }} />
            </CardActionBtn>
          )}
          {!hideLinkedButton && (
            <CardActionBtn
              onClick={(e) => { e.stopPropagation(); if (linkingMode) onLinkCard(card.id); else if (isLinked) onUnlinkCard(linkedGroup.id, card.id); else onLinkCard(card.id); }}
              baseColor={isLinkingFirst ? 'rgba(139,92,246,0.8)' : isLinked ? 'rgba(139,92,246,0.4)' : 'rgba(71,85,105,0.35)'}
              hoverColor={isLinked && !linkingMode ? 'rgba(239,68,68,0.85)' : 'rgba(139,92,246,0.85)'}
              textColor={isLinkingFirst ? '#fff' : isLinked ? '#c4b5fd' : '#94a3b8'}
              hoverTextColor="#fff"
              title={linkingMode ? (isLinkingFirst ? 'Cliquer sur une autre carte pour lier' : 'Ajouter au groupe') : isLinked ? 'Retirer du groupe lié' : 'Lier avec une autre carte'}
            >
              {isLinked && !linkingMode ? <Unlink style={{ width: 13, height: 13 }} /> : <Link2 style={{ width: 13, height: 13 }} />}
            </CardActionBtn>
          )}
          {showLock && (
            <CardActionBtn onClick={(e) => { e.stopPropagation(); onToggleLock(card.id); }} baseColor={isLocked ? 'rgba(245,158,11,0.85)' : 'rgba(71,85,105,0.35)'} hoverColor={isLocked ? 'rgba(251,191,36,1)' : 'rgba(245,158,11,0.7)'} textColor={isLocked ? '#fff' : '#94a3b8'} hoverTextColor={isLocked ? '#1c1917' : '#fff'} title={isLocked ? 'Déverrouiller' : 'Verrouiller'}>
              {isLocked ? <Lock style={{ width: 13, height: 13 }} /> : <Unlock style={{ width: 13, height: 13 }} />}
            </CardActionBtn>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-1"><User className="w-3 h-3 text-white flex-shrink-0" /><span className="text-xs text-white font-medium">{clients?.filter(c => dossier.clients_ids?.includes(c.id)).map(c => `${c.prenom} ${c.nom}`).join(', ') || '-'}</span></div>
      {mandat?.adresse_travaux && formatAdresse(mandat.adresse_travaux) && <div className="flex items-start gap-1 mb-1"><MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" /><span className="text-xs text-slate-400 break-words">{formatAdresse(mandat.adresse_travaux)}</span></div>}
      {mandat?.date_livraison && <div className="flex items-center gap-1 mb-1"><Calendar className="w-3 h-3 text-emerald-400 flex-shrink-0" /><span className="text-xs text-emerald-300">Livraison: {format(new Date(mandat.date_livraison + 'T00:00:00'), "dd MMM", { locale: fr })}</span></div>}

      {/* Date limite — badge coloré flash */}
      {terrain.date_limite_leve && (
        <div className="flex items-center gap-1 mb-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: iconColor }} />
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: badgeBg, color: textColorLimite, border: `1px solid ${badgeBorder}`, boxShadow: badgeGlow, letterSpacing: '0.02em' }}
          >
            {format(new Date(terrain.date_limite_leve + 'T00:00:00'), "dd MMM", { locale: fr })}
          </span>
        </div>
      )}

      {terrain.a_rendez_vous && terrain.date_rendez_vous && <div className="flex items-center gap-1 mb-1"><Clock className="w-3 h-3 text-orange-400 flex-shrink-0" /><span className="text-xs text-orange-300">RDV: {format(new Date(terrain.date_rendez_vous + 'T00:00:00'), "dd MMM", { locale: fr })}{terrain.heure_rendez_vous && ` à ${terrain.heure_rendez_vous}`}</span></div>}
      {terrain.instruments_requis && <div className="flex items-center gap-1 mb-1"><Wrench className="w-3 h-3 text-emerald-400 flex-shrink-0" /><span className="text-xs text-emerald-300 truncate">{terrain.instruments_requis}</span></div>}
      {terrain.technicien && <div className="flex items-center gap-1 mb-1"><UserCheck className="w-3 h-3 text-blue-400 flex-shrink-0" /><span className="text-xs text-blue-300 truncate">{terrain.technicien}</span></div>}
      {terrain.dossier_simultane && <div className="flex items-center gap-1 mb-1"><Link2 className="w-3 h-3 text-purple-400 flex-shrink-0" /><span className="text-xs text-purple-300 truncate">Avec: {terrain.dossier_simultane}</span></div>}

      <div className="mt-2 pt-1 border-t border-emerald-500/30" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <div className="flex-shrink-0">
            {terrain.temps_prevu
              ? <div className="flex items-center gap-0.5"><Timer className="w-3 h-3 text-emerald-400" /><span className="text-xs text-emerald-300">{terrain.temps_prevu}</span></div>
              : <div className="w-10" />}
          </div>
          <div className="flex-1 min-w-0" onMouseDown={e => e.stopPropagation()}>
            {!hideStatut && (
              <Select value={currentStatut || ""} onValueChange={(val) => onStatutChange(card.id, val === '__vide__' || val === currentStatut ? null : val)}>
                <SelectTrigger className="w-full h-6 text-xs px-1.5 py-0" style={{ ...triggerInlineStyle, boxShadow: `0 0 0 1px ${isOrange ? '#fb923c' : isMauve ? '#c084fc' : '#94a3b8'}`, border: 'none', outline: 'none' }} onMouseDown={e => e.stopPropagation()}>
                  <SelectValue placeholder="Statut..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="__vide__" className="text-xs text-slate-400">— Aucun —</SelectItem>
                  {STATUT_OPTIONS.map(opt => <SelectItem key={opt} value={opt} className="text-xs text-white">{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {hideStatut && <div className="flex-1" />}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {terrain.donneur && <span className="text-xs text-slate-400 font-medium">{terrain.donneur.split(' ').map(n => n[0]).join('').toUpperCase()}</span>}
            {donnerUser
              ? <Avatar className="w-5 h-5 border border-emerald-500/50"><AvatarImage src={donnerUser.photo_url} /><AvatarFallback className="text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getUserInitials(donnerUser)}</AvatarFallback></Avatar>
              : <div className="w-5 h-5 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500/30"><User className="w-2.5 h-2.5 text-emerald-500" /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}