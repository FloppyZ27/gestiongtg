import React, { useMemo, useState, useEffect } from "react";
import { Link2 } from "lucide-react";

/**
 * Affiche les connexions visuelles entre cartes liées avec un symbole de maillon
 */
export default function LinkedCardsConnector({ linkedGroups, terrainCards }) {
  const connections = useMemo(() => {
    const result = [];
    
    linkedGroups.forEach((group) => {
      // Créer des connexions entre chaque paire de cartes du groupe
      for (let i = 0; i < group.cardIds.length - 1; i++) {
        for (let j = i + 1; j < group.cardIds.length; j++) {
          const card1Id = group.cardIds[i];
          const card2Id = group.cardIds[j];
          
          result.push({
            groupId: group.id,
            card1Id,
            card2Id,
          });
        }
      }
    });
    
    return result;
  }, [linkedGroups]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {connections.map((conn) => (
        <ConnectorLine
          key={`${conn.groupId}-${conn.card1Id}-${conn.card2Id}`}
          card1Id={conn.card1Id}
          card2Id={conn.card2Id}
        />
      ))}
    </div>
  );
}

function ConnectorLine({ card1Id, card2Id }) {
  const [positions, setPositions] = React.useState(null);

  React.useEffect(() => {
    const updatePositions = () => {
      const el1 = document.querySelector(`[data-card-id="${card1Id}"]`);
      const el2 = document.querySelector(`[data-card-id="${card2Id}"]`);

      if (el1 && el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();

        setPositions({
          x1: rect1.left + rect1.width / 2,
          y1: rect1.top + rect1.height / 2,
          x2: rect2.left + rect2.width / 2,
          y2: rect2.top + rect2.height / 2,
        });
      }
    };

    updatePositions();
    
    // Mettre à jour lors du scroll/resize
    const observer = new ResizeObserver(updatePositions);
    const scrollHandler = () => updatePositions();
    
    document.addEventListener('scroll', scrollHandler, true);
    observer.observe(document.body);
    
    return () => {
      document.removeEventListener('scroll', scrollHandler, true);
      observer.disconnect();
    };
  }, [card1Id, card2Id]);

  if (!positions) return null;

  const dx = positions.x2 - positions.x1;
  const dy = positions.y2 - positions.y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const midX = (positions.x1 + positions.x2) / 2;
  const midY = (positions.y1 + positions.y2) / 2;

  return (
    <>
      {/* Ligne de connexion */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        style={{ zIndex: 50 }}
      >
        <defs>
          <linearGradient id={`grad-${card1Id}-${card2Id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.3)" />
          </linearGradient>
        </defs>
        <line
          x1={positions.x1}
          y1={positions.y1}
          x2={positions.x2}
          y2={positions.y2}
          stroke={`url(#grad-${card1Id}-${card2Id})`}
          strokeWidth="2"
          strokeDasharray="5,5"
          strokeLinecap="round"
        />
      </svg>

      {/* Symbole de maillon au centre */}
      <div
        className="absolute flex items-center justify-center pointer-events-none"
        style={{
          left: `${midX}px`,
          top: `${midY}px`,
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          zIndex: 60,
        }}
      >
        <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full p-1.5 border border-violet-500/40 backdrop-blur-sm">
          <Link2 className="w-4 h-4 text-violet-400" />
        </div>
      </div>
    </>
  );
}