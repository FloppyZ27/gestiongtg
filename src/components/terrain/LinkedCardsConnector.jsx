import React, { useMemo, useState, useEffect } from "react";
import { Link2 } from "lucide-react";

/**
 * Affiche les connexions visuelles entre cartes liées avec un symbole de maillon
 */
export default function LinkedCardsConnector({ linkedGroups, terrainCards }) {
  const connections = useMemo(() => {
    const result = [];
    
    linkedGroups.forEach((group) => {
      // Créer des connexions linéaires entre cartes consécutives du groupe
      for (let i = 0; i < group.cardIds.length - 1; i++) {
        const card1Id = group.cardIds[i];
        const card2Id = group.cardIds[i + 1];
        
        result.push({
          groupId: group.id,
          card1Id,
          card2Id,
          isLastInGroup: i === group.cardIds.length - 2,
        });
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
          isLastInGroup={conn.isLastInGroup}
        />
      ))}
    </div>
  );
}

function ConnectorLine({ card1Id, card2Id, isLastInGroup }) {
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
          y1Bottom: rect1.top + rect1.height, // bas de la première carte
          x2: rect2.left + rect2.width / 2,
          y2Top: rect2.top, // haut de la deuxième carte
        });
      }
    };

    updatePositions();
    
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

  return (
    <>
      {/* Ligne de connexion */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        style={{ zIndex: 50 }}
      >
        <defs>
          <linearGradient id={`grad-${card1Id}-${card2Id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
            <stop offset="50%" stopColor="rgba(139, 92, 246, 0.6)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.3)" />
          </linearGradient>
        </defs>
        <line
          x1={positions.x1}
          y1={positions.y1Bottom}
          x2={positions.x2}
          y2={positions.y2Top}
          stroke={`url(#grad-${card1Id}-${card2Id})`}
          strokeWidth="2"
          strokeDasharray="5,5"
          strokeLinecap="round"
        />
      </svg>

      {/* Symbole de maillon en bas de la première carte (sauf si c'est la dernière) */}
      {!isLastInGroup && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: `${positions.x1}px`,
            top: `${positions.y1Bottom}px`,
            transform: `translate(-50%, -50%)`,
            zIndex: 60,
          }}
        >
          <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full p-1.5 border border-violet-500/40 backdrop-blur-sm">
            <Link2 className="w-4 h-4 text-violet-400" />
          </div>
        </div>
      )}
    </>
  );
}