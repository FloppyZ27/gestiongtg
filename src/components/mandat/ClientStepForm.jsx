import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, User, Check, Plus } from "lucide-react";

export default function ClientStepForm({ 
  clients = [], 
  selectedClientIds = [], 
  onSelectClient, 
  onCreateClient,
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

  // Filtrer les clients en temps réel selon les champs remplis
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

  const handleCreateNewClient = () => {
    if (clientForm.prenom && clientForm.nom) {
      onCreateClient({
        prenom: clientForm.prenom,
        nom: clientForm.nom,
        type_client: "Client",
        telephones: clientForm.telephone ? [{ telephone: clientForm.telephone, type: clientForm.type_telephone, actuel: true }] : [],
        courriels: clientForm.courriel ? [{ courriel: clientForm.courriel, actuel: true }] : [],
        adresses: []
      });
      setClientForm({
        prenom: "",
        nom: "",
        telephone: "",
        type_telephone: "Cellulaire",
        courriel: ""
      });
    }
  };

  const getCurrentPhone = (client) => {
    const current = client.telephones?.find(t => t.actuel);
    return current?.telephone || client.telephones?.[0]?.telephone || "";
  };

  const getCurrentEmail = (client) => {
    const current = client.courriels?.find(c => c.actuel);
    return current?.courriel || client.courriels?.[0]?.courriel || "";
  };

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t-lg"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              1
            </div>
            <CardTitle className="text-white text-lg">Informations du client</CardTitle>
            {selectedClientIds.length > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {selectedClientIds.length} client(s) sélectionné(s)
              </Badge>
            )}
          </div>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-4">
          <div className="grid grid-cols-[1fr_1fr] gap-6">
            {/* Formulaire de saisie */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Entrer les informations</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Prénom</Label>
                  <Input
                    value={clientForm.prenom}
                    onChange={(e) => setClientForm({ ...clientForm, prenom: e.target.value })}
                    placeholder="Prénom"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Nom</Label>
                  <Input
                    value={clientForm.nom}
                    onChange={(e) => setClientForm({ ...clientForm, nom: e.target.value })}
                    placeholder="Nom"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-2">
                  <Label className="text-slate-300">Téléphone</Label>
                  <Input
                    value={clientForm.telephone}
                    onChange={(e) => setClientForm({ ...clientForm, telephone: e.target.value })}
                    placeholder="(000) 000-0000"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Type</Label>
                  <Select 
                    value={clientForm.type_telephone} 
                    onValueChange={(value) => setClientForm({ ...clientForm, type_telephone: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Cellulaire" className="text-white">Cellulaire</SelectItem>
                      <SelectItem value="Maison" className="text-white">Maison</SelectItem>
                      <SelectItem value="Travail" className="text-white">Travail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Courriel</Label>
                <Input
                  type="email"
                  value={clientForm.courriel}
                  onChange={(e) => setClientForm({ ...clientForm, courriel: e.target.value })}
                  placeholder="exemple@courriel.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button
                type="button"
                onClick={handleCreateNewClient}
                disabled={!clientForm.prenom || !clientForm.nom}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer ce nouveau client
              </Button>
            </div>

            {/* Liste des clients existants */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300 mb-3">
                Clients existants ({filteredClients.length})
              </h4>
              
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-2">
                {filteredClients.length > 0 ? (
                  filteredClients.slice(0, 20).map((client) => {
                    const isSelected = selectedClientIds.includes(client.id);
                    return (
                      <div
                        key={client.id}
                        onClick={() => onSelectClient(client.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                            : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium flex items-center gap-2">
                              {client.prenom} {client.nom}
                              {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                            </p>
                            <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                              {getCurrentPhone(client) && (
                                <p>📞 {getCurrentPhone(client)}</p>
                              )}
                              {getCurrentEmail(client) && (
                                <p className="truncate">✉️ {getCurrentEmail(client)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun client trouvé</p>
                    <p className="text-xs mt-1">Modifiez les filtres ou créez un nouveau client</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}