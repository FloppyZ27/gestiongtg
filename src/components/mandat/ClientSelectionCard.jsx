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
        className="absolute right-1 top-1 hover:text-red-400"
      >
        <X className="w-3 h-3" />
      </button>
      <div className="space-y-1 pr-4">
        <div className="font-semibold">{clientData.prenom} {clientData.nom}</div>
        {currentEmail && <div className="text-[10px] text-slate-300">✉️ {currentEmail}</div>}
        {currentPhone && <div className="text-[10px] text-slate-300">📞 {currentPhone}</div>}
      </div>
    </div>
  );
}