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
        });
      }
    });
    
    return result;
  }, [linkedGroups]);

  // Créer une liste des cartes qui doivent afficher un symbole (pas la première ni la dernière du groupe)
  const cardsWithSymbol = useMemo(() => {
    const result = [];
    linkedGroups.forEach((group) => {
      group.cardIds.forEach((cardId, idx) => {
        // Afficher le symbole si ce n'est pas la première (idx 0) ni la dernière (idx length-1)
        if (idx > 0 && idx < group.cardIds.length - 1) {
          result.push(cardId);
        }
      });
    });
    return result;
  }, [linkedGroups]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {/* Lignes de connexion */}
      {connections.map((conn) => (
        <ConnectorLine
          key={`${conn.groupId}-${conn.card1Id}-${conn.card2Id}`}
          card1Id={conn.card1Id}
          card2Id={conn.card2Id}
        />
      ))}
      
      {/* Symboles au centre des cartes */}
      {cardsWithSymbol.map((cardId) => (
        <CardSymbol key={`symbol-${cardId}`} cardId={cardId} />
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
          y1Bottom: rect1.top + rect1.height,
          x2: rect2.left + rect2.width / 2,
          y2Top: rect2.top,
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
  );
}

function CardSymbol({ cardId }) {
  const [position, setPosition] = React.useState(null);

  React.useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(`[data-card-id="${cardId}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
      }
    };

    updatePosition();
    
    const observer = new ResizeObserver(updatePosition);
    const scrollHandler = () => updatePosition();
    
    document.addEventListener('scroll', scrollHandler, true);
    observer.observe(document.body);
    
    return () => {
      document.removeEventListener('scroll', scrollHandler, true);
      observer.disconnect();
    };
  }, [cardId]);

  if (!position) return null;

  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `translate(-50%, -50%)`,
        zIndex: 60,
      }}
    >
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-full p-2 border-2 border-red-400 shadow-lg shadow-red-500/50">
        <Link2 className="w-5 h-5 text-white" />
      </div>
    </div>
  );
}