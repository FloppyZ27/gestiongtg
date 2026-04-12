import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronUp, ChevronDown, Palmtree, Heart, Banknote, Check, X, Eye, EyeOff } from "lucide-react";

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

const TYPE_INFO = {
  'Vacances':    { color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  'Mieux-être':  { color: 'text-pink-400',    bg: 'bg-pink-500/20 border-pink-500/30' },
  'Mieux-etre':  { color: 'text-pink-400',    bg: 'bg-pink-500/20 border-pink-500/30' },
  'En banque':   { color: 'text-amber-400',   bg: 'bg-amber-500/20 border-amber-500/30' },
};
const CONGE_TYPES = Object.keys(TYPE_INFO);

function EditableNumber({ value, onSave, className = "" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleSave = () => {
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) onSave(parsed);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-16 h-6 text-xs bg-slate-700 border-slate-500 text-white px-1"
          autoFocus
        />
        <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
        <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300"><X className="w-3 h-3" /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setVal(value); setEditing(true); }}
      className={`text-sm font-semibold hover:underline cursor-pointer ${className}`}
    >
      {value % 1 === 0 ? value : value.toFixed(1)}h
    </button>
  );
}

function UserEntriesPanel({ userEmail }) {
  const currentYear = new Date().getFullYear();
  const { data: entrees = [], isLoading } = useQuery({
    queryKey: ['entreeTempsConges', userEmail, currentYear],
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: userEmail }, '-date', 500),
    initialData: [],
  });

  const filtered = entrees
    .filter(e => CONGE_TYPES.includes(e.tache) && e.date?.startsWith(String(currentYear)))
    .sort((a, b) => b.date?.localeCompare(a.date));

  if (isLoading) return <p className="text-slate-500 text-xs py-2 pl-2">Chargement...</p>;
  if (filtered.length === 0) return <p className="text-slate-500 text-xs py-2 pl-2">Aucune entrée de congé en {currentYear}</p>;

  return (
    <div className="divide-y divide-slate-800/50">
      {filtered.map((e, idx) => {
        const info = TYPE_INFO[e.tache] || { color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' };
        const label = e.tache === 'Mieux-etre' ? 'Mieux-être' : e.tache;
        return (
          <div key={idx} className="flex items-center gap-4 py-1.5 px-3 text-xs">
            <span className="text-slate-400 w-28 flex-shrink-0">
              {e.date ? format(new Date(e.date + 'T12:00:00'), 'd MMM yyyy', { locale: fr }) : '-'}
            </span>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-medium flex-shrink-0 ${info.bg} ${info.color}`}>{label}</span>
            <span className={`font-bold flex-shrink-0 ${info.color}`}>{e.heures}h</span>
            {e.description && <span className="text-slate-500 truncate">{e.description}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function SoldesCongesSection() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });
  const { data: soldes = [] } = useQuery({ queryKey: ['soldesConges'], queryFn: () => base44.entities.SoldeConges.list(), initialData: [] });

  const getSolde = (email) => soldes.find(s => s.utilisateur_email === email);
  const toggleUser = (email) => setExpandedUsers(prev => ({ ...prev, [email]: !prev[email] }));

  const upsertMutation = useMutation({
    mutationFn: async ({ email, field, value }) => {
      const existing = soldes.find(s => s.utilisateur_email === email);
      if (existing) {
        return base44.entities.SoldeConges.update(existing.id, { ...existing, [field]: value });
      } else {
        return base44.entities.SoldeConges.create({
          utilisateur_email: email,
          heures_vacances: 0, heures_mieux_etre: 0, heures_en_banque: 0,
          max_vacances: 120, max_mieux_etre: 40,
          [field]: value
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['soldesConges'] }),
  });

  const activeUsers = users.filter(u => u.statut !== 'Inactif');

  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
      <div
        className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-2 px-3 bg-emerald-900/20 border-b border-slate-800"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <Palmtree className="w-3 h-3 text-emerald-400" />
            </div>
            <h3 className="text-emerald-300 text-sm font-semibold">Soldes de congés — Vacances, Mieux-être & Banque</h3>
          </div>
          {collapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {!collapsed && (
        <CardContent className="p-4">
          <div className="border border-slate-700 rounded-lg overflow-hidden">
            {/* En-tête */}
            <div className="grid bg-slate-800/50 px-3 py-2 border-b border-slate-700" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto' }}>
              <div className="text-xs font-semibold text-slate-400">Utilisateur</div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Palmtree className="w-3 h-3 text-emerald-400" /> Vacances</div>
              <div className="text-xs font-semibold text-emerald-700">Max vac.</div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400" /> Mieux-être</div>
              <div className="text-xs font-semibold text-pink-700">Max m.-ê.</div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1"><Banknote className="w-3 h-3 text-amber-400" /> En banque</div>
              <div className="text-xs font-semibold text-slate-400 w-8"></div>
            </div>

            {/* Lignes */}
            {activeUsers.map(u => {
              const solde = getSolde(u.email) || { heures_vacances: 0, heures_mieux_etre: 0, heures_en_banque: 0, max_vacances: 120, max_mieux_etre: 40 };
              const maxVac = solde.max_vacances ?? 120;
              const maxMe = solde.max_mieux_etre ?? 40;
              const vacPct = Math.min((solde.heures_vacances / maxVac) * 100, 100);
              const mePct = Math.min((solde.heures_mieux_etre / maxMe) * 100, 100);
              const isExpanded = expandedUsers[u.email];

              return (
                <div key={u.id}>
                  {/* Ligne principale */}
                  <div className="grid px-3 py-3 border-b border-slate-800 hover:bg-slate-800/30 transition-colors items-center gap-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr auto' }}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={u.photo_url} />
                        <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white">{getInitials(u.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium text-sm">{u.full_name}</p>
                        <p className="text-slate-500 text-xs">{u.poste || u.role}</p>
                      </div>
                    </div>

                    {/* Vacances */}
                    <div className="space-y-1">
                      <EditableNumber value={solde.heures_vacances} onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'heures_vacances', value: v })} className="text-emerald-400" />
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${vacPct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-600">/ {maxVac}h</p>
                    </div>

                    {/* Max vacances */}
                    <EditableNumber value={maxVac} onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'max_vacances', value: v })} className="text-emerald-700" />

                    {/* Mieux-être */}
                    <div className="space-y-1">
                      <EditableNumber value={solde.heures_mieux_etre} onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'heures_mieux_etre', value: v })} className="text-pink-400" />
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all" style={{ width: `${mePct}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-600">/ {maxMe}h</p>
                    </div>

                    {/* Max mieux-être */}
                    <EditableNumber value={maxMe} onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'max_mieux_etre', value: v })} className="text-pink-700" />

                    {/* En banque */}
                    <EditableNumber value={solde.heures_en_banque} onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'heures_en_banque', value: v })} className="text-amber-400" />

                    {/* Bouton voir entrées */}
                    <button
                      onClick={() => toggleUser(u.email)}
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${isExpanded ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                      title="Voir les entrées de congé"
                    >
                      {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Panneau d'entrées détaillées */}
                  {isExpanded && (
                    <div className="border-b border-slate-700 bg-slate-900/60">
                      <div className="px-3 py-1.5 border-b border-slate-800 flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Entrées {new Date().getFullYear()} — Vacances, Mieux-être & Banque</span>
                      </div>
                      <UserEntriesPanel userEmail={u.email} />
                    </div>
                  )}
                </div>
              );
            })}

            {activeUsers.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">Aucun utilisateur actif</div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}