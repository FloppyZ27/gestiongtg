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
  onToggleCollapse,
  clientDossiers = [],
  onSelectExistingAddress
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeoutState] = useState(null);
  const [selectedMandatKey, setSelectedMandatKey] = useState(null);

  const [addressForm, setAddressForm] = useState({
    numero_civique: address?.numeros_civiques?.[0] || "",
    rue: address?.rue || "",
    ville: address?.ville || "",
    province: address?.province || "Québec",
    code_postal: address?.code_postal || "",
    numero_lot: address?.numero_lot || ""
  });

  useEffect(() => {
    if (address) {
      setAddressForm({
        numero_civique: address.numeros_civiques?.[0] || "",
        rue: address.rue || "",
        ville: address.ville || "",
        province: address.province || "Québec",
        code_postal: address.code_postal || "",
        numero_lot: address.numero_lot || ""
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
      code_postal: newForm.code_postal,
      numero_lot: newForm.numero_lot
    });
  };

  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Ajouter "Alma" à la recherche pour prioriser cette région
      const searchQuery = query.toLowerCase().includes('alma') ? query : `${query}, Alma, Québec`;
      const encodedQuery = encodeURIComponent(searchQuery);
      
      const response = await fetch(
        `https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/AdressesQuebec_Geocodage/GeocodeServer/findAddressCandidates?SingleLine=${encodedQuery}&f=json&outFields=*&maxLocations=10`
      );
      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const formattedAddresses = data.candidates.map(candidate => {
          const attrs = candidate.attributes || {};
          const fullAddr = candidate.address || attrs.Match_addr || "";
          
          // Parser l'adresse complète pour extraire les composants
          // Format typique: "123 Rue des Pins, Alma, QC, G8B 5V8"
          let numero_civique = attrs.AddNum || "";
          let rue = attrs.StName || "";
          let ville = attrs.City || attrs.Municipalit || "";
          let code_postal = attrs.Postal || "";
          
          // Si les attributs sont vides, essayer de parser l'adresse complète
          if (!numero_civique || !rue) {
            const parts = fullAddr.split(',');
            if (parts.length > 0) {
              const streetPart = parts[0].trim();
              // Extraire le numéro civique (premiers chiffres)
              const numMatch = streetPart.match(/^(\d+[-\d]*)\s+(.+)$/);
              if (numMatch) {
                numero_civique = numMatch[1];
                rue = numMatch[2];
              } else {
                rue = streetPart;
              }
            }
            if (parts.length > 1 && !ville) {
              ville = parts[1].trim();
            }
            // Chercher le code postal dans les dernières parties
            if (!code_postal) {
              const postalMatch = fullAddr.match(/([A-Z]\d[A-Z]\s?\d[A-Z]\d)/i);
              if (postalMatch) {
                code_postal = postalMatch[1].toUpperCase();
              }
            }
          }
          
          return {
            numero_civique,
            rue,
            ville,
            province: "Québec",
            code_postal,
            full_address: fullAddr
          };
        });
        setSuggestions(formattedAddresses);
      } else {
        setSuggestions([]);
      }
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
      code_postal: suggestion.code_postal || "",
      numero_lot: addressForm.numero_lot || ""
    };
    setAddressForm(newForm);
    setSearchQuery("");
    setSuggestions([]);
    onAddressChange({
      numeros_civiques: [newForm.numero_civique],
      rue: newForm.rue,
      ville: newForm.ville,
      province: newForm.province,
      code_postal: newForm.code_postal,
      numero_lot: newForm.numero_lot
    });
  };

  const hasAddress = addressForm.rue || addressForm.ville;

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
                    className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
            <CardTitle className="text-blue-300 text-base">Adresse des travaux</CardTitle>
            {hasAddress && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                {addressForm.numero_civique} {addressForm.rue}, {addressForm.ville}
              </Badge>
            )}
            {addressForm.numero_lot && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                Lot: {addressForm.numero_lot}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-[70%_30%] gap-3">
            {/* Colonne gauche - Formulaire d'adresse */}
            <div className="space-y-2">
              {/* Barre de recherche */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Rechercher une adresse..."
                    className="bg-slate-700 border-slate-600 text-white h-7 text-sm pl-10"
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
              <div className="grid grid-cols-[80px_1fr_1fr_100px_120px] gap-2">
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">N° civique</Label>
                  <Input
                    value={addressForm.numero_civique}
                    onChange={(e) => handleFieldChange('numero_civique', e.target.value)}
                    placeholder="123"
                    className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Rue</Label>
                  <Input
                    value={addressForm.rue}
                    onChange={(e) => handleFieldChange('rue', e.target.value)}
                    placeholder="Nom de la rue"
                    className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Ville</Label>
                  <Input
                    value={addressForm.ville}
                    onChange={(e) => handleFieldChange('ville', e.target.value)}
                    placeholder="Ville"
                    className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">Code postal</Label>
                  <Input
                    value={addressForm.code_postal}
                    onChange={(e) => handleFieldChange('code_postal', e.target.value)}
                    placeholder="G0V 0A0"
                    className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-slate-400 text-xs">N° de lot</Label>
                  <Input
                    value={addressForm.numero_lot}
                    onChange={(e) => handleFieldChange('numero_lot', e.target.value)}
                    placeholder="1234567"
                    className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Colonne droite - Mandats existants du client */}
            <div className="border-l border-slate-700 pl-3">
              <p className="text-slate-400 text-xs mb-1.5">Mandats existants du client</p>
              <div className="max-h-[85px] overflow-y-auto space-y-1">
                {clientDossiers.length > 0 ? (
                  clientDossiers.map((dossier) => (
                    dossier.mandats?.map((mandat, mIdx) => {
                      const addr = mandat.adresse_travaux;
                      const addrText = addr ? `${addr.numeros_civiques?.[0] || ''} ${addr.rue || ''}, ${addr.ville || ''}`.trim() : '';
                      if (!addrText || addrText === ', ') return null;
                      const mandatKey = `${dossier.id}-${mIdx}`;
                      const isSelected = selectedMandatKey === mandatKey;
                      return (
                        <div
                          key={mandatKey}
                          onClick={() => {
                            setSelectedMandatKey(mandatKey);
                            onSelectExistingAddress && onSelectExistingAddress(addr, mandat.lots);
                          }}
                          className={`px-2 py-1 rounded cursor-pointer text-xs ${
                            isSelected 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{addrText}</span>
                          </div>
                          <span className={`text-[10px] ${isSelected ? 'text-emerald-500' : 'text-slate-500'}`}>{mandat.type_mandat}</span>
                        </div>
                      );
                    })
                  ))
                ) : (
                  <p className="text-slate-500 text-xs text-center py-2">Aucun mandat</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}