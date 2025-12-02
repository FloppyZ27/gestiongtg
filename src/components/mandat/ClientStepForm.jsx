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
        className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-2 bg-emerald-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">1</div>
            <CardTitle className="text-emerald-300 text-sm">Client</CardTitle>
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
        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-[70%_30%] gap-3">
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2">
                <Input
                  value={clientForm.prenom}
                  onChange={(e) => setClientForm({ ...clientForm, prenom: e.target.value })}
                  placeholder="Prénom"
                  className="bg-slate-700 border-slate-600 text-white h-7 text-xs"
                />
                <Input
                  value={clientForm.nom}
                  onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                  placeholder="Nom"
                  className="bg-slate-700 border-slate-600 text-white h-7 text-xs"
                />
                <div className="flex gap-1">
                  <Input
                    value={clientForm.telephone}
                    onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })}
                    placeholder="Téléphone"
                    className="bg-slate-700 border-slate-600 text-white h-7 text-xs flex-1"
                  />
                  <Select value={clientForm.type_telephone} onValueChange={(value) => setClientForm({ ...clientForm, type_telephone: value })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Cellulaire" className="text-white text-xs">Cell.</SelectItem>
                      <SelectItem value="Maison" className="text-white text-xs">Maison</SelectItem>
                      <SelectItem value="Travail" className="text-white text-xs">Travail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="email"
                  value={clientForm.courriel}
                  onChange={(e) => setClientForm({ ...clientForm, courriel: e.target.value })}
                  placeholder="Courriel"
                  className="bg-slate-700 border-slate-600 text-white h-7 text-xs"
                />
              </div>
            </div>

            <div className="border-l border-slate-700 pl-2">
              <p className="text-slate-500 text-[10px] mb-1">Existants ({filteredClients.length})</p>
              <div className="max-h-[60px] overflow-y-auto space-y-0.5">
                {filteredClients.length > 0 ? (
                  filteredClients.slice(0, 15).map((client) => {
                    const isSelected = selectedClientIds.includes(client.id);
                    return (
                      <div
                        key={client.id}
                        onClick={() => handleClientClick(client, isSelected)}
                        className={`px-1.5 py-1 rounded cursor-pointer text-[10px] ${
                          isSelected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{client.prenom} {client.nom}</span>
                          {isSelected && <Check className="w-2.5 h-2.5 flex-shrink-0" />}
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