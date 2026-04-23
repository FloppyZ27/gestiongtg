import React from "react";
import { Link2, X, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Affiche les groupes de cartes liées et permet de les dissoudre.
 */
export default function LinkedGroupManager({ linkedGroups, terrainCards, onUnlinkGroup, onUnlinkCard }) {
  if (!linkedGroups || linkedGroups.length === 0) return null;

  const getCardLabel = (cardId) => {
    const card = terrainCards.find(c => c.id === cardId);
    if (!card) return cardId;
    const arp = { "Samuel Guay": "SG-", "Dany Gaboury": "DG-", "Pierre-Luc Pilote": "PLP-", "Benjamin Larouche": "BL-", "Frédéric Gilbert": "FG-" };
    return `${arp[card.dossier.arpenteur_geometre] || ''}${card.dossier.numero_dossier}`;
  };

  return (
    <div className="space-y-1 mt-2">
      {linkedGroups.map((group) => (
        <div key={group.id} className="flex items-center gap-1 bg-violet-900/30 border border-violet-500/30 rounded-lg px-2 py-1 flex-wrap">
          <Link2 className="w-3 h-3 text-violet-400 flex-shrink-0" />
          {group.cardIds.map((cardId, idx) => (
            <React.Fragment key={cardId}>
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 border text-xs px-1 flex items-center gap-1">
                {getCardLabel(cardId)}
                <button onClick={() => onUnlinkCard(group.id, cardId)} className="ml-0.5 hover:text-red-300"><X className="w-2.5 h-2.5" /></button>
              </Badge>
              {idx < group.cardIds.length - 1 && <Link2 className="w-2.5 h-2.5 text-violet-400/60" />}
            </React.Fragment>
          ))}
          <button onClick={() => onUnlinkGroup(group.id)} className="ml-auto text-red-400 hover:text-red-300" title="Dissoudre le groupe">
            <Unlink className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}