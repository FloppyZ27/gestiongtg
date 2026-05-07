import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClientSelectionCard({ 
  clientId, 
  clientData, 
  onRemove, 
  onClick, 
  backgroundColor = "bg-blue-500/20",
  borderColor = "border-blue-500/30",
  textColor = "text-blue-400",
  hoverColor = "hover:bg-blue-500/30"
}) {
  if (!clientData) return null;

  const currentPhone = clientData.telephones?.find(t => t.actuel)?.telephone || clientData.telephones?.[0]?.telephone || "";
  const currentEmail = clientData.courriels?.find(c => c.actuel)?.courriel || clientData.courriels?.[0]?.courriel || "";

  return (
    <div 
      className={`${backgroundColor} ${textColor} border ${borderColor} rounded p-2 text-xs relative cursor-pointer ${hoverColor} transition-colors`}
      onClick={onClick}
    >
      <button 
        type="button" 
        onClick={(e) => {
          e.stopPropagation();
          onRemove(clientId);
        }} 
        style={{
          position: 'absolute', right: '3px', top: '3px',
          background: 'none', border: 'none', padding: '1px',
          cursor: 'pointer', opacity: 0.5, lineHeight: 1,
          color: 'inherit', display: 'flex', alignItems: 'center'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      >
        <X style={{width: '10px', height: '10px'}} />
      </button>
      <div className="space-y-1 pr-4">
        <div className="font-semibold">{clientData.prenom} {clientData.nom}</div>
        {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
        {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
      </div>
    </div>
  );
}