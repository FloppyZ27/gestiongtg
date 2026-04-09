import React, { useState } from "react";
import { Clock, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function HistoriquePanel({ historique = [] }) {
  const [filterUser, setFilterUser] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

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
      {/* Barre de filtres */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              hasFilters
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3 h-3" />
            Filtres
            {hasFilters && (
              <span className="bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {[filterUser, filterType, filterDateStart || filterDateEnd].filter(Boolean).length}
              </span>
            )}
            {filtersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setFilterUser(""); setFilterType(""); setFilterDateStart(""); setFilterDateEnd(""); }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 px-2 py-1"
            >
              <X className="w-3 h-3" />
              Réinitialiser
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="mt-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 block">Utilisateur</label>
                <select
                  value={filterUser}
                  onChange={e => setFilterUser(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1.5"
                >
                  <option value="">Tous</option>
                  {uniqueUsers.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 block">Type d'action</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1.5"
                >
                  <option value="">Tous</option>
                  {uniqueTypes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-slate-500 text-[10px] uppercase tracking-wider mb-1 block">Période</label>
              <div className="flex gap-2 items-center">
                <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="flex-1 bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1.5" />
                <span className="text-slate-500 text-xs">→</span>
                <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="flex-1 bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1.5" />
              </div>
            </div>
          </div>
        )}

        {/* Chips actifs */}
        {hasFilters && !filtersOpen && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filterUser && <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full">{filterUser}<button type="button" onClick={() => setFilterUser("")} className="ml-0.5"><X className="w-2.5 h-2.5" /></button></span>}
            {filterType && <span className="flex items-center gap-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded-full">{filterType}<button type="button" onClick={() => setFilterType("")} className="ml-0.5"><X className="w-2.5 h-2.5" /></button></span>}
            {(filterDateStart || filterDateEnd) && <span className="flex items-center gap-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded-full">{filterDateStart || '...'} → {filterDateEnd || '...'}<button type="button" onClick={() => { setFilterDateStart(""); setFilterDateEnd(""); }} className="ml-0.5"><X className="w-2.5 h-2.5" /></button></span>}
          </div>
        )}
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