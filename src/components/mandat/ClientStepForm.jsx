import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Users, Check, Plus, Trash2, Star } from "lucide-react";

const formatPhoneNumber = (value) => {
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.slice(0, 10);
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
};

function ClientInfoFields({ data, onChange, disabled }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Prénom</Label>
          <Input value={data.prenom || ""} onChange={(e) => onChange({ ...data, prenom: e.target.value })} placeholder="Prénom" disabled={disabled} className="bg-slate-700 border-slate-600 text-white h-6 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Nom</Label>
          <Input value={data.nom || ""} onChange={(e) => onChange({ ...data, nom: e.target.value })} placeholder="Nom" disabled={disabled} className="bg-slate-700 border-slate-600 text-white h-6 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Téléphone</Label>
          <div className="flex gap-1">
            <Input value={data.telephone || ""} onChange={(e) => onChange({ ...data, telephone: formatPhoneNumber(e.target.value) })} placeholder="(000) 000-0000" disabled={disabled} className="bg-slate-700 border-slate-600 text-white h-6 text-sm flex-1" />
            <Select value={data.type_telephone || "Cellulaire"} onValueChange={(v) => onChange({ ...data, type_telephone: v })} disabled={disabled}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs w-20"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="Cellulaire" className="text-white text-xs">Cell.</SelectItem>
                <SelectItem value="Maison" className="text-white text-xs">Maison</SelectItem>
                <SelectItem value="Travail" className="text-white text-xs">Travail</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-slate-400 text-xs">Courriel</Label>
          <Input type="email" value={data.courriel || ""} onChange={(e) => onChange({ ...data, courriel: e.target.value })} placeholder="exemple@courriel.com" disabled={disabled} className="bg-slate-700 border-slate-600 text-white h-6 text-sm" />
        </div>
      </div>
    </div>
  );
}

function ClientExistantsList({ clients, data, onSelectClient, isSelectedId, disabled }) {
  const filtered = useMemo(() => {
    return clients.filter(client => {
      const prenomMatch = !data.prenom || client.prenom?.toLowerCase().includes(data.prenom.toLowerCase());
      const nomMatch = !data.nom || client.nom?.toLowerCase().includes(data.nom.toLowerCase());
      const telMatch = !data.telephone || client.telephones?.some(t => t.telephone?.includes(data.telephone));
      const mailMatch = !data.courriel || client.courriels?.some(c => c.courriel?.toLowerCase().includes(data.courriel.toLowerCase()));
      return prenomMatch && nomMatch && telMatch && mailMatch;
    });
  }, [clients, data]);

  const getCurrentPhone = (client) => {
    const c = client.telephones?.find(t => t.actuel);
    return c?.telephone || client.telephones?.[0]?.telephone || "";
  };
  const getCurrentEmail = (client) => {
    const c = client.courriels?.find(e => e.actuel);
    return c?.courriel || client.courriels?.[0]?.courriel || "";
  };

  return (
    <div className="pl-3">
      <p className="text-slate-400 text-xs mb-2">Clients existants ({filtered.length})</p>
      <div className="max-h-[100px] overflow-y-auto space-y-1">
        {filtered.length > 0 ? (
          filtered.slice(0, 15).map((client) => {
            const isSelected = isSelectedId(client.id);
            return (
              <div key={client.id} onClick={() => !disabled && onSelectClient(client)}
                className={`px-2 py-1.5 rounded text-xs ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300'}`}
                style={!isSelected ? { backgroundColor: 'rgba(45, 45, 45, 0.15)' } : {}}>
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{client.prenom} {client.nom}</span>
                  {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                  {getCurrentPhone(client) && <p>📞 <a href={`tel:${getCurrentPhone(client).replace(/\D/g, '')}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-300">{getCurrentPhone(client)}</a></p>}
                  {getCurrentEmail(client) && <p className="truncate">✉️ {getCurrentEmail(client)}</p>}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-500 text-xs text-center py-2">Aucun client</p>
        )}
      </div>
    </div>
  );
}

export default function ClientStepForm({
  clients = [],
  selectedClientIds = [],
  onSelectClient,
  isCollapsed,
  onToggleCollapse,
  clientInfo = {},
  onClientInfoChange,
  disabled = false
}) {
  const [clientForm, setClientForm] = useState({
    prenom: clientInfo.prenom || "",
    nom: clientInfo.nom || "",
    telephone: clientInfo.telephone || "",
    type_telephone: clientInfo.type_telephone || "Cellulaire",
    courriel: clientInfo.courriel || "",
    extra_clients: clientInfo.extra_clients || [],
    representant_key: clientInfo.representant_key || "primary"
  });

  useEffect(() => {
    setClientForm({
      prenom: clientInfo.prenom || "",
      nom: clientInfo.nom || "",
      telephone: clientInfo.telephone || "",
      type_telephone: clientInfo.type_telephone || "Cellulaire",
      courriel: clientInfo.courriel || "",
      extra_clients: clientInfo.extra_clients || [],
      representant_key: clientInfo.representant_key || "primary"
    });
  }, [clientInfo.prenom, clientInfo.nom, clientInfo.telephone, clientInfo.courriel, clientInfo.type_telephone]);

  const updateClientForm = (newForm) => {
    setClientForm(newForm);
    if (onClientInfoChange) onClientInfoChange(newForm);
  };

  const getCurrentPhone = (client) => {
    const c = client.telephones?.find(t => t.actuel);
    return c?.telephone || client.telephones?.[0]?.telephone || "";
  };
  const getCurrentEmail = (client) => {
    const c = client.courriels?.find(e => e.actuel);
    return c?.courriel || client.courriels?.[0]?.courriel || "";
  };

  // Primary client: click existing to fill fields
  const handlePrimaryClientClick = (client) => {
    const isSelected = selectedClientIds.includes(client.id);
    if (isSelected) {
      updateClientForm({ ...clientForm, prenom: "", nom: "", telephone: "", type_telephone: "Cellulaire", courriel: "" });
    } else {
      updateClientForm({
        ...clientForm,
        prenom: client.prenom || "",
        nom: client.nom || "",
        telephone: getCurrentPhone(client),
        type_telephone: client.telephones?.[0]?.type || "Cellulaire",
        courriel: getCurrentEmail(client)
      });
    }
    onSelectClient(client.id);
  };

  const addExtraClient = () => {
    const newExtra = [...(clientForm.extra_clients || []), { prenom: "", nom: "", telephone: "", type_telephone: "Cellulaire", courriel: "" }];
    updateClientForm({ ...clientForm, extra_clients: newExtra });
  };

  const updateExtraClient = (index, newData) => {
    const updated = (clientForm.extra_clients || []).map((c, i) => i === index ? newData : c);
    updateClientForm({ ...clientForm, extra_clients: updated });
  };

  const removeExtraClient = (index) => {
    const updated = (clientForm.extra_clients || []).filter((_, i) => i !== index);
    const newRep = clientForm.representant_key === `extra_${index}` ? "primary" : clientForm.representant_key;
    updateClientForm({ ...clientForm, extra_clients: updated, representant_key: newRep });
  };

  const handleExtraClientClick = (index, client) => {
    const extra = clientForm.extra_clients[index];
    // Toggle: if already filled with this client, clear
    const alreadyFilled = extra.prenom === client.prenom && extra.nom === client.nom;
    const newData = alreadyFilled
      ? { prenom: "", nom: "", telephone: "", type_telephone: "Cellulaire", courriel: "" }
      : {
          prenom: client.prenom || "",
          nom: client.nom || "",
          telephone: getCurrentPhone(client),
          type_telephone: client.telephones?.[0]?.type || "Cellulaire",
          courriel: getCurrentEmail(client)
        };
    updateExtraClient(index, newData);
  };

  const setRepresentant = (key) => {
    updateClientForm({ ...clientForm, representant_key: key });
  };

  const getRepresentantLabel = () => {
    const key = clientForm.representant_key;
    if (!key || key === "primary") {
      return `${clientForm.prenom || ''} ${clientForm.nom || ''}`.trim() || "Client principal";
    }
    if (key.startsWith("extra_")) {
      const idx = parseInt(key.split("_")[1]);
      const c = clientForm.extra_clients?.[idx];
      if (c) return `${c.prenom || ''} ${c.nom || ''}`.trim() || `Client ${idx + 2}`;
    }
    const dbClient = clients.find(c => c.id === key);
    if (dbClient) return `${dbClient.prenom} ${dbClient.nom}`;
    return "Client principal";
  };

  const extraClients = clientForm.extra_clients || [];
  const representantKey = clientForm.representant_key || "primary";

  const RepresentantCheckbox = ({ myKey }) => (
    <div className="flex items-center gap-1.5">
      <Checkbox
        id={`rep-${myKey}`}
        checked={representantKey === myKey}
        onCheckedChange={(checked) => { if (!disabled) setRepresentant(checked ? myKey : "primary"); }}
        disabled={disabled}
        className="w-3.5 h-3.5 border-yellow-500/50 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
      />
      <label htmlFor={`rep-${myKey}`} className="text-xs text-slate-400 cursor-pointer select-none">
        Représentant
      </label>
    </div>
  );

  return (
    <Card className="border-0 bg-slate-800/30" style={{ border: 'none', boxShadow: 'none' }}>
      <CardHeader
        className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <CardTitle className="text-blue-300 text-base">Client</CardTitle>
            {selectedClientIds.length > 0 && selectedClientIds.map(clientId => {
              const client = clients.find(c => c.id === clientId);
              return client ? (
                <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs flex items-center gap-1">
                  {representantKey === clientId && <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />}
                  {client.prenom} {client.nom}
                </Badge>
              ) : null;
            })}
            {(clientForm.prenom || clientForm.nom) && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-yellow-400" />
                Représentant: {getRepresentantLabel()}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-3 space-y-4">

          {/* Client principal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-blue-300">Client principal</p>
              <RepresentantCheckbox myKey="primary" />
            </div>
            <div className="grid grid-cols-[70%_30%] gap-4">
              <div className="space-y-2 border-r-2 border-blue-500/30 pr-4">
                <ClientInfoFields
                  data={{ prenom: clientForm.prenom, nom: clientForm.nom, telephone: clientForm.telephone, type_telephone: clientForm.type_telephone, courriel: clientForm.courriel }}
                  onChange={(newData) => updateClientForm({ ...clientForm, ...newData })}
                  disabled={disabled}
                />
              </div>
              <ClientExistantsList
                clients={clients}
                data={{ prenom: clientForm.prenom, nom: clientForm.nom, telephone: clientForm.telephone, courriel: clientForm.courriel }}
                onSelectClient={handlePrimaryClientClick}
                isSelectedId={(id) => selectedClientIds.includes(id)}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Clients supplémentaires */}
          {extraClients.map((extra, index) => (
            <div key={index} className="border-t border-slate-600/50 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">Client {index + 2}</p>
                <div className="flex items-center gap-3">
                  <RepresentantCheckbox myKey={`extra_${index}`} />
                  {!disabled && (
                    <button type="button" onClick={() => removeExtraClient(index)} className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-[70%_30%] gap-4">
                <div className="space-y-2 border-r-2 border-blue-500/30 pr-4">
                  <ClientInfoFields data={extra} onChange={(newData) => updateExtraClient(index, newData)} disabled={disabled} />
                </div>
                <ClientExistantsList
                  clients={clients}
                  data={extra}
                  onSelectClient={(client) => handleExtraClientClick(index, client)}
                  isSelectedId={(id) => {
                    const c = clients.find(cl => cl.id === id);
                    return c ? (extra.prenom === c.prenom && extra.nom === c.nom) : false;
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}

          {/* Bouton Ajouter un client */}
          {!disabled && (
            <Button type="button" onClick={addExtraClient} className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Ajouter un autre client
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}