import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, MapPin, Search, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddressStepForm({ 
  address,
  onAddressChange,
  isCollapsed,
  onToggleCollapse
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeoutState] = useState(null);

  const [addressForm, setAddressForm] = useState({
    numero_civique: address?.numeros_civiques?.[0] || "",
    rue: address?.rue || "",
    ville: address?.ville || "",
    province: address?.province || "Québec",
    code_postal: address?.code_postal || ""
  });

  useEffect(() => {
    if (address) {
      setAddressForm({
        numero_civique: address.numeros_civiques?.[0] || "",
        rue: address.rue || "",
        ville: address.ville || "",
        province: address.province || "Québec",
        code_postal: address.code_postal || ""
      });
    }
  }, [address]);

  const handleFieldChange = (field, value) => {
    const newForm = { ...addressForm, [field]: value };
    setAddressForm(newForm);
    onAddressChange({
      numeros_civiques: [newForm.numero_civique],
      rue: newForm.rue,
      ville: newForm.ville,
      province: newForm.province,
      code_postal: newForm.code_postal
    });
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Recherche d'adresses au Québec, Canada pour: "${query}". 
        Retourne les 5 adresses les plus pertinentes avec numéro civique, rue, ville, province et code postal.
        Focus sur le Saguenay-Lac-Saint-Jean si possible.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            addresses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  numero_civique: { type: "string" },
                  rue: { type: "string" },
                  ville: { type: "string" },
                  province: { type: "string" },
                  code_postal: { type: "string" },
                  full_address: { type: "string" }
                }
              }
            }
          }
        }
      });
      setSuggestions(response.addresses || []);
    } catch (error) {
      console.error("Erreur recherche adresse:", error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => searchAddress(value), 500);
    setSearchTimeoutState(timeout);
  };

  const selectSuggestion = (suggestion) => {
    const newForm = {
      numero_civique: suggestion.numero_civique || "",
      rue: suggestion.rue || "",
      ville: suggestion.ville || "",
      province: suggestion.province || "Québec",
      code_postal: suggestion.code_postal || ""
    };
    setAddressForm(newForm);
    setSearchQuery("");
    setSuggestions([]);
    onAddressChange({
      numeros_civiques: [newForm.numero_civique],
      rue: newForm.rue,
      ville: newForm.ville,
      province: newForm.province,
      code_postal: newForm.code_postal
    });
  };

  const hasAddress = addressForm.rue || addressForm.ville;

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-slate-800/50 transition-colors rounded-t-lg py-3"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
            <CardTitle className="text-white text-base">Adresse des travaux</CardTitle>
            {hasAddress && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                {addressForm.numero_civique} {addressForm.rue}, {addressForm.ville}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-2 pb-4">
          <div className="space-y-3">
            {/* Barre de recherche */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher une adresse..."
                  className="bg-slate-700 border-slate-600 text-white h-9 text-sm pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
              </div>
              
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm text-slate-300 flex items-center gap-2 border-b border-slate-700 last:border-b-0"
                    >
                      <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Champs manuels */}
            <div className="grid grid-cols-[100px_1fr_1fr_120px] gap-2">
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">N° civique</Label>
                <Input
                  value={addressForm.numero_civique}
                  onChange={(e) => handleFieldChange('numero_civique', e.target.value)}
                  placeholder="123"
                  className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Rue</Label>
                <Input
                  value={addressForm.rue}
                  onChange={(e) => handleFieldChange('rue', e.target.value)}
                  placeholder="Nom de la rue"
                  className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Ville</Label>
                <Input
                  value={addressForm.ville}
                  onChange={(e) => handleFieldChange('ville', e.target.value)}
                  placeholder="Ville"
                  className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-400 text-xs">Code postal</Label>
                <Input
                  value={addressForm.code_postal}
                  onChange={(e) => handleFieldChange('code_postal', e.target.value)}
                  placeholder="G0V 0A0"
                  className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}