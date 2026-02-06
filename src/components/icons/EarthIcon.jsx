import React from 'react';

export default function EarthIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cercle de base blanc */}
      <circle cx="12" cy="12" r="10" fill="white" stroke="currentColor" strokeWidth="2"/>
      
      {/* Continents en gris foncé - style réaliste */}
      {/* Amérique du Nord/Sud (gauche) */}
      <path 
        d="M 5 8 L 6 7 L 7 6.5 L 8 7 L 8.5 8 L 9 9 L 8.5 10 L 8 10.5 L 7.5 11 L 7 12 L 6.5 13 L 6 14 L 6 15 L 6.5 16 L 7 17 L 7.5 18 L 8 18.5 L 7.5 19 L 7 19.5 L 6 19 L 5.5 18 L 5 17 L 4.5 16 L 4 14 L 4 12 L 4.5 10 Z" 
        fill="currentColor" 
        opacity="0.8"
      />
      
      {/* Europe/Afrique (centre) */}
      <path 
        d="M 10 5 L 11 4.5 L 12 4 L 13 4 L 14 4.5 L 14.5 5 L 15 6 L 15.5 7 L 16 8 L 16 9 L 15.5 10 L 15 11 L 14.5 12 L 14 13 L 13.5 14 L 13 15 L 12.5 16 L 12 17 L 11.5 18 L 11 19 L 10.5 19.5 L 10 19 L 9.5 18 L 9 17 L 9 16 L 9.5 15 L 10 14 L 10.5 13 L 11 12 L 11 11 L 10.5 10 L 10 9 L 9.5 8 L 9.5 7 L 10 6 Z" 
        fill="currentColor" 
        opacity="0.8"
      />
      
      {/* Asie/Australie (droite) */}
      <path 
        d="M 16.5 9 L 17 8.5 L 18 8 L 19 8.5 L 19.5 9 L 20 10 L 20 11 L 19.5 12 L 19 13 L 18.5 14 L 18 14.5 L 17.5 14 L 17 13.5 L 16.5 13 L 16.5 12 L 17 11 L 17 10 Z" 
        fill="currentColor" 
        opacity="0.8"
      />
      
      {/* Australie */}
      <path 
        d="M 16 16 L 17 16 L 18 16.5 L 18.5 17 L 18.5 18 L 18 18.5 L 17 18.5 L 16 18 L 15.5 17 Z" 
        fill="currentColor" 
        opacity="0.8"
      />
    </svg>
  );
}