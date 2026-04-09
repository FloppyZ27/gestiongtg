import React, { useState } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function HistoriquePanel({ historique = [] }) {
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");

  const uniqueUsers = [...new Set(historique.map(e => e.utilisateur_nom).filter(Boolean))];
  const uniqueTypes = [...new Set(historique.map(e => e.action).filter(Boolean))].sort();

  const filtered = historique.filter(entry => {
    if (filterUser && entry.utilisateur_nom !== filterUser) return false;
    if (filterType && entry.action !== filterType) return false;
    if (filterDateStart && new Date(entry.date) < new Date(filterDateStart)) return false;
    if (filterDateEnd && new Date(entry.date) > new Date(filterDateEnd + 'T23:59:59')) return false;
    return true;
  });

  const hasFilters = filterUser || filterType || filterDateStart || filterDateEnd;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filtres */}
      <div className="space-y-2 mb-3 pb-3 border-b border-slate-700 flex-shrink-0">
        <div className="flex gap-2">
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1"
          >
            <option value="">Tous les utilisateurs</option>
            {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1"
          >
            <option value="">Tous les types</option>
            {uniqueTypes.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1" />
          <span className="text-slate-500 text-xs">→</span>
          <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="flex-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1" />
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setFilterUser(""); setFilterType(""); setFilterDateStart(""); setFilterDateEnd(""); }}
              className="text-slate-400 hover:text-white text-xs px-1 flex-shrink-0"
            >✕</button>
          )}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((entry, idx) => (
              <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{entry.action}</p>
                    {entry.details && (
                      <p className="text-slate-400 text-xs mt-1 break-words">{entry.details}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                      <span className="text-emerald-400">{entry.utilisateur_nom}</span>
                      <span>•</span>
                      <span>{format(new Date(entry.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">{historique.length === 0 ? 'Aucune action enregistrée' : 'Aucun résultat pour ces filtres'}</p>
              {historique.length === 0 && <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}