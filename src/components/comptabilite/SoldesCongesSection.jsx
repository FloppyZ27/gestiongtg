import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronUp, ChevronDown, Palmtree, Heart, Banknote, Check, X } from "lucide-react";

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

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

export default function SoldesCongesSection() {
  const [collapsed, setCollapsed] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });
  const { data: soldes = [] } = useQuery({ queryKey: ['soldesConges'], queryFn: () => base44.entities.SoldeConges.list(), initialData: [] });

  const getSolde = (email) => soldes.find(s => s.utilisateur_email === email);

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
            <div className="grid bg-slate-800/50 px-3 py-2 border-b border-slate-700" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
              <div className="text-xs font-semibold text-slate-400">Utilisateur</div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Palmtree className="w-3 h-3 text-emerald-400" /> Vacances
              </div>
              <div className="text-xs font-semibold text-emerald-600">Max vac.</div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-pink-400" /> Mieux-être
              </div>
              <div className="text-xs font-semibold text-pink-700">Max m.-ê.</div>
              <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-amber-400" /> En banque
              </div>
            </div>

            {/* Lignes */}
            {activeUsers.map(u => {
              const solde = getSolde(u.email) || { heures_vacances: 0, heures_mieux_etre: 0, heures_en_banque: 0, max_vacances: 120, max_mieux_etre: 40 };
              const maxVac = solde.max_vacances ?? 120;
              const maxMe = solde.max_mieux_etre ?? 40;
              const vacPct = Math.min((solde.heures_vacances / maxVac) * 100, 100);
              const mePct = Math.min((solde.heures_mieux_etre / maxMe) * 100, 100);

              return (
                <div key={u.id} className="grid px-3 py-3 border-b border-slate-800 hover:bg-slate-800/30 transition-colors items-center gap-2" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
                  {/* Utilisateur */}
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

                  {/* Vacances utilisées */}
                  <div className="space-y-1">
                    <EditableNumber
                      value={solde.heures_vacances}
                      onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'heures_vacances', value: v })}
                      className="text-emerald-400"
                    />
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${vacPct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-600">/ {maxVac}h</p>
                  </div>

                  {/* Max vacances */}
                  <div>
                    <EditableNumber
                      value={maxVac}
                      onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'max_vacances', value: v })}
                      className="text-emerald-700"
                    />
                  </div>

                  {/* Mieux-être utilisés */}
                  <div className="space-y-1">
                    <EditableNumber
                      value={solde.heures_mieux_etre}
                      onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'heures_mieux_etre', value: v })}
                      className="text-pink-400"
                    />
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all" style={{ width: `${mePct}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-600">/ {maxMe}h</p>
                  </div>

                  {/* Max mieux-être */}
                  <div>
                    <EditableNumber
                      value={maxMe}
                      onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'max_mieux_etre', value: v })}
                      className="text-pink-700"
                    />
                  </div>

                  {/* En banque */}
                  <div>
                    <EditableNumber
                      value={solde.heures_en_banque}
                      onSave={(v) => upsertMutation.mutate({ email: u.email, field: 'heures_en_banque', value: v })}
                      className="text-amber-400"
                    />
                  </div>
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