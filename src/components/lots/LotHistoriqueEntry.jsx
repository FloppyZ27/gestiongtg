import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function LotHistoriqueEntry({ log, users }) {
  const logUser = users.find(u => u.email === log.utilisateur_email);

  const renderDetails = (details) => {
    return details.split(' • ').map((change, idx) => {
      const colonIdx = change.indexOf(':');
      const arrowIdx = change.indexOf(' → ');
      if (colonIdx !== -1 && arrowIdx !== -1) {
        const field = change.substring(0, colonIdx).trim();
        const before = change.substring(colonIdx + 1, arrowIdx).trim();
        const after = change.substring(arrowIdx + 3).trim();
        return (
          <div key={idx} className="flex flex-col gap-0.5">
            <span className="text-slate-400 font-medium">{field}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white text-xs">{before}</span>
                                             <span className="text-white flex-shrink-0">→</span>
                                             <span className="text-white text-xs">{after}</span>
            </div>
          </div>
        );
      }
      return (
        <div key={idx} className="flex items-start gap-2 text-slate-300">
          <span className="text-white flex-shrink-0">→</span>
          <span className="break-words">{change}</span>
        </div>
      );
    });
  };

  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{log.action}</p>
          {log.details && (
            <div className="text-slate-400 text-xs mt-2 space-y-1.5">
              {renderDetails(log.details)}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            {logUser?.photo_url ? (
              <img src={logUser.photo_url} alt={log.utilisateur_nom} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 text-[9px] font-bold">{(log.utilisateur_nom || '?').charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-emerald-400 text-xs font-medium">{log.utilisateur_nom}</span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-slate-500 text-xs">{log.created_date && format(new Date(log.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}