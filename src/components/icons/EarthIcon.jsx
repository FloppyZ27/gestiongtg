import React from 'react';

export default function EarthIcon({ className = "w-4 h-4" }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cercle de la Terre */}
      <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="currentColor" strokeWidth="1.5"/>
      
      {/* Continents simplifiés */}
      <path 
        d="M 7 8 Q 8 6 10 7 L 11 8 Q 12 7 13 8 L 14 9 Q 13 10 12 10 L 10 11 Q 9 10 8 10 Z" 
        fill="#10B981" 
        opacity="0.9"
      />
      <path 
        d="M 15 12 Q 16 11 17 12 L 18 14 Q 17 15 16 14 L 15 13 Z" 
        fill="#10B981" 
        opacity="0.9"
      />
      <path 
        d="M 6 14 Q 7 13 8 14 L 9 16 Q 8 17 7 16 Z" 
        fill="#10B981" 
        opacity="0.9"
      />
      <path 
        d="M 11 15 Q 12 14 14 15 L 15 17 Q 14 18 12 17 Z" 
        fill="#10B981" 
        opacity="0.9"
      />
    </svg>
  );
}