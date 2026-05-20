import React, { useState } from "react";
import { Clock, Filter, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import LotHistoriqueEntry from "./LotHistoriqueEntry";

export default function LotHistoriquePanel({ actionLogs = [], users = [] }) {
  const [filterUsers, setFilterUsers] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const uniqueUsers = [...new Set(actionLogs.map(l => l.utilisateur_nom).filter(Boolean))];
  const uniqueTypes = [...new Set(actionLogs.map(l => l.action).filter(Boolean))].sort();

  const hasFilters = filterUsers.length > 0 || filterTypes.length > 0 || filterDateStart || filterDateEnd;
  const filterCount = filterUsers.length + filterTypes.length + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0);

  const filtered = actionLogs.filter(log => {
    if (filterUsers.length > 0 && !filterUsers.includes(log.utilisateur_nom)) return false;
    if (filterTypes.length > 0 && !filterTypes.includes(log.action)) return false;
    if (filterDateStart && new Date(log.created_date) < new Date(filterDateStart)) return false;
    if (filterDateEnd && new Date(log.created_date) > new Date(filterDateEnd + 'T23:59:59')) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden w-full min-w-0">
      {/* Barre filtres */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="h-7 px-2 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 border border-slate-700/50 relative"
          >
            <Filter className="w-3 h-3 mr-1" />
            <span className="text-xs">Filtres</span>
            {hasFilters && (
              <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
                {filterCount}
              </Badge>
            )}
            {filtersOpen ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <div className="mt-2 p-2 border border-red-500/30 rounded-lg">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-red-500/30">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3 text-red-500" />
                    <h4 className="text-xs font-semibold text-red-500">Filtrer</h4>
                  </div>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterUsers([]); setFilterTypes([]); setFilterDateStart(""); setFilterDateEnd(""); }} className="h-6 text-xs text-red-500 hover:text-red-400 px-2">
                      <X className="w-2.5 h-2.5 mr-1" />Réinitialiser
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full border-red-500/30 text-red-400 justify-between h-8 text-xs px-2">
                        <span className="truncate">Utilisateurs ({filterUsers.length > 0 ? filterUsers.length : 'Tous'})</span>
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                      {uniqueUsers.map(u => (
                        <DropdownMenuCheckboxItem key={u} checked={filterUsers.includes(u)} onCheckedChange={(checked) => setFilterUsers(checked ? [...filterUsers, u] : filterUsers.filter(x => x !== u))} className="text-white">{u}</DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full border-red-500/30 text-red-400 justify-between h-8 text-xs px-2">
                        <span className="truncate">Types ({filterTypes.length > 0 ? filterTypes.length : 'Tous'})</span>
                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto bg-slate-800 border-slate-700">
                      {uniqueTypes.map(t => (
                        <DropdownMenuCheckboxItem key={t} checked={filterTypes.includes(t)} onCheckedChange={(checked) => setFilterTypes(checked ? [...filterTypes, t] : filterTypes.filter(x => x !== t))} className="text-white">{t}</DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-1 pt-1 border-t border-red-500/30">
                  <Label className="text-xs text-red-400">Période</Label>
                  <div className="flex items-center gap-1.5">
                    <Input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="flex-1 border-red-500/30 text-red-400 h-8 text-xs px-2" />
                    <span className="text-red-400 text-xs">→</span>
                    <Input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="flex-1 border-red-500/30 text-red-400 h-8 text-xs px-2" />
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((log) => (
              <LotHistoriqueEntry key={log.id} log={log} users={users} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500">{actionLogs.length === 0 ? 'Aucune action enregistrée' : 'Aucun résultat pour ces filtres'}</p>
              {actionLogs.length === 0 && <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}