import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, User, Check } from "lucide-react";

export default function ClientStepForm({ 
  clients = [], 
  selectedClientIds = [], 
  onSelectClient, 
  isCollapsed,
  onToggleCollapse
}) {
  const [clientForm, setClientForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    type_telephone: "Cellulaire",
    courriel: ""
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const prenomMatch = !clientForm.prenom || 
        client.prenom?.toLowerCase().includes(clientForm.prenom.toLowerCase());
      const nomMatch = !clientForm.nom || 
        client.nom?.toLowerCase().includes(clientForm.nom.toLowerCase());
      const telephoneMatch = !clientForm.telephone || 
        client.telephones?.some(t => t.telephone?.includes(clientForm.telephone));
      const courrielMatch = !clientForm.courriel || 
        client.courriels?.some(c => c.courriel?.toLowerCase().includes(clientForm.courriel.toLowerCase()));
      return prenomMatch && nomMatch && telephoneMatch && courrielMatch;
    });
  }, [clients, clientForm]);

  const getCurrentPhone = (client) => {
    const current = client.telephones?.find(t => t.actuel);
    return current?.telephone || client.telephones?.[0]?.telephone || "";
  };

  const getCurrentEmail = (client) => {
    const current = client.courriels?.find(c => c.actuel);
    return current?.courriel || client.courriels?.[0]?.courriel || "";
  };

  const handleClientClick = (client, isAlreadySelected) => {
    if (isAlreadySelected) {
      setClientForm({
        prenom: "",
        nom: "",
        telephone: "",
        type_telephone: "Cellulaire",
        courriel: ""
      });
    } else {
      setClientForm({
        prenom: client.prenom || "",
        nom: client.nom || "",
        telephone: getCurrentPhone(client),
        type_telephone: client.telephones?.[0]?.type || "Cellulaire",
        courriel: getCurrentEmail(client)
      });
    }
    onSelectClient(client.id);
  };

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-3 bg-emerald-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">1</div>
            <CardTitle className="text-emerald-300 text-base">Informations du client</CardTitle>
            {selectedClientIds.length > 0 && (
              <div className="flex gap-1">
                {selectedClientIds.map(clientId => {
                  const client = clients.find(c => c.id === clientId);
                  return client ? (
                    <Badge key={clientId} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {client.prenom} {client.nom}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-4">
          <div className="grid grid-cols-[70%_30%] gap-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Prénom</Label>
                  <Input
                    value={clientForm.prenom}
                    onChange={(e) => setClientForm({ ...clientForm, prenom: e.target.value })}
                    placeholder="Prénom"
                    className="bg-slate-700 border-slate-600 text-white h-7 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Nom</Label>
                  <Input
                    value={clientForm.nom}
                    onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                    placeholder="Nom"
                    className="bg-slate-700 border-slate-600 text-white h-7 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Téléphone</Label>
                  <div className="flex gap-1">
                    <Input
                      value={clientForm.telephone}
                      onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })}
                      placeholder="(000) 000-0000"
                      className="bg-slate-700 border-slate-600 text-white h-8 text-sm flex-1"
                    />
                    <Select value={clientForm.type_telephone} onValueChange={(value) => setClientForm({ ...clientForm, type_telephone: value })}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs w-20">
                        <SelectValue />
                      </SelectTrigger>
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
                  <Input
                    type="email"
                    value={clientForm.courriel}
                    onChange={(e) => setClientForm({ ...clientForm, courriel: e.target.value })}
                    placeholder="exemple@courriel.com"
                    className="bg-slate-700 border-slate-600 text-white h-7 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="border-l border-slate-700 pl-3">
              <p className="text-slate-400 text-xs mb-2">Clients existants ({filteredClients.length})</p>
              <div className="max-h-[100px] overflow-y-auto space-y-1">
                {filteredClients.length > 0 ? (
                  filteredClients.slice(0, 15).map((client) => {
                    const isSelected = selectedClientIds.includes(client.id);
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleClientClick(client, isSelected)}
                        className={`px-2 py-1.5 rounded cursor-pointer text-xs ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{client.prenom} {client.nom}</span>
                          {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                          {getCurrentPhone(client) && <p>📞 {getCurrentPhone(client)}</p>}
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
          </div>
        </CardContent>
      )}
    </Card>
  );
}