import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, MapPin, Search, Loader2, Home } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddressStepForm({ 
  address,
  onAddressChange,
  isCollapsed,
  onToggleCollapse,
  clientDossiers = [],
  onSelectExistingAddress,
  allLots = [],
  disabled = false
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeoutState] = useState(null);
  const [selectedMandatKey, setSelectedMandatKey] = useState(null);

  const PROVINCES_CANADA = [
    { label: "Québec", value: "QC" },
    { label: "Alberta", value: "AB" },
    { label: "Colombie-Britannique", value: "BC" },
    { label: "Île-du-Prince-Édouard", value: "PE" },
    { label: "Manitoba", value: "MB" },
    { label: "Nouveau-Brunswick", value: "NB" },
    { label: "Nouvelle-Écosse", value: "NS" },
    { label: "Nunavut", value: "NU" },
    { label: "Ontario", value: "ON" },
    { label: "Saskatchewan", value: "SK" },
    { label: "Terre-Neuve-et-Labrador", value: "NL" },
    { label: "Territoires du Nord-Ouest", value: "NT" },
    { label: "Yukon", value: "YT" }
  ];

  const [addressForm, setAddressForm] = useState({
    numero_civique: address?.numeros_civiques?.[0] || "",
    rue: address?.rue || "",
    ville: address?.ville || "",
    province: address?.province || "QC",
    code_postal: address?.code_postal || "",
    numero_lot: address?.numero_lot || ""
  });

  useEffect(() => {
    if (address) {
      setAddressForm({
        numero_civique: address.numeros_civiques?.[0] || "",
        rue: address.rue || "",
        ville: address.ville || "",
        province: address.province || "QC",
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
      // Coordonnées d'Alma, Québec
      const almaLat = 48.5506;
      const almaLon = -71.6492;
      
      const encodedQuery = encodeURIComponent(query);
      const url = `https://servicescarto.mern.gouv.qc.ca/pes/rest/services/Territoire/AdressesQuebec_Geocodage/GeocodeServer/findAddressCandidates?SingleLine=${encodedQuery}&f=json&outFields=*&maxLocations=50`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const formattedAddresses = data.candidates.map(candidate => {
          const attrs = candidate.attributes || {};
          const location = candidate.location;
          const fullAddr = candidate.address || attrs.Match_addr || "";
          
          // Calculer la distance d'Alma
          let distance = Infinity;
          if (location && location.x && location.y) {
            const R = 6371; // Rayon de la Terre en km
            const dLat = (location.y - almaLat) * Math.PI / 180;
            const dLon = (location.x - almaLon) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(almaLat * Math.PI / 180) * Math.cos(location.y * Math.PI / 180) *
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance = R * c;
          }
          
          // Extraire les composants
          let numero_civique = attrs.AddNum || "";
          let rue = attrs.StName || "";
          let ville = attrs.City || attrs.Municipalit || "";
          let code_postal = attrs.Postal || "";
          
          // Parser l'adresse si nécessaire
          if (!numero_civique || !rue) {
            const parts = fullAddr.split(',');
            if (parts.length > 0) {
              const streetPart = parts[0].trim();
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
          }
          
          return {
            numero_civique,
            rue,
            ville,
            province: "QC",
            code_postal,
            full_address: fullAddr,
            distance: Math.round(distance)
          };
        });
        
        // Trier par distance d'Alma
        const sortedAddresses = formattedAddresses
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 20);
        
        setSuggestions(sortedAddresses);
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
      province: suggestion.province || "QC",
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
                    className="cursor-pointer hover:bg-emerald-900/40 transition-colors rounded-t-lg py-1.5 bg-emerald-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
                <Home className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <CardTitle className="text-emerald-300 text-base">Adresse des travaux</CardTitle>
            {hasAddress && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                {addressForm.numero_civique} {addressForm.rue}, {addressForm.ville}
              </Badge>
            )}
            {addressForm.numero_lot && (
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                Lot: {addressForm.numero_lot.split('\n').filter(l => l.trim()).join(', ')}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="grid grid-cols-[50%_20%_30%] gap-3">
            {/* Colonne gauche - Formulaire d'adresse */}
            <div className="space-y-2">
              {/* Barre de recherche */}
              <div className="relative mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Rechercher une adresse..."
                    disabled={disabled}
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
                        className="px-3 py-2 cursor-pointer hover:bg-slate-700 text-sm text-slate-300 flex items-center justify-between gap-2 border-b border-slate-700 last:border-b-0"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">{suggestion.full_address || `${suggestion.numero_civique} ${suggestion.rue}, ${suggestion.ville}`}</span>
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{suggestion.distance} km</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Champs manuels */}
              <div className="space-y-2">
                {/* Ligne 1: N° civique et Rue */}
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">N° civique</Label>
                    <Input
                      value={addressForm.numero_civique}
                      onChange={(e) => handleFieldChange('numero_civique', e.target.value)}
                      placeholder="123"
                      disabled={disabled}
                      className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Rue</Label>
                    <Input
                      value={addressForm.rue}
                      onChange={(e) => handleFieldChange('rue', e.target.value)}
                      placeholder="Nom de la rue"
                      disabled={disabled}
                      className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                    />
                  </div>
                </div>
                {/* Ligne 2: Ville, Code postal et Province */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Ville</Label>
                    <Input
                      value={addressForm.ville}
                      onChange={(e) => handleFieldChange('ville', e.target.value)}
                      placeholder="Ville"
                      disabled={disabled}
                      className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Code postal</Label>
                    <Input
                      value={addressForm.code_postal}
                      onChange={(e) => handleFieldChange('code_postal', e.target.value)}
                      placeholder="G0V 0A0"
                      disabled={disabled}
                      className="bg-slate-700 border-slate-600 text-white h-6 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Province</Label>
                    <Select 
                      value={addressForm.province || "QC"}
                      onValueChange={(value) => handleFieldChange('province', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-sm w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {PROVINCES_CANADA.map((prov) => (
                          <SelectItem key={prov.value} value={prov.value} className="text-white text-sm">
                            {prov.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              </div>

              {/* Colonne centrale - N° de lot */}
              <div className="border-l-2 border-r-2 border-purple-500/30 pl-3 pr-3 flex flex-col h-full">
                <p className="text-slate-400 text-xs mb-1.5">N° de lot</p>
                <textarea
                  value={addressForm.numero_lot}
                  onChange={(e) => handleFieldChange('numero_lot', e.target.value)}
                  placeholder="1234567"
                  disabled={disabled}
                  className="bg-slate-700 border border-slate-600 text-white flex-1 text-sm rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                      
                      // Récupérer les numéros de lots
                      const lotNumbers = mandat.lots && mandat.lots.length > 0 
                        ? mandat.lots.map(lotId => {
                            const foundLot = allLots.find(l => l.id === lotId);
                            return foundLot?.numero_lot || lotId;
                          }).join(', ')
                        : '';
                      
                      return (
                        <div
                          key={mandatKey}
                          onClick={() => {
                            if (isSelected) {
                              // Déselectionner et réinitialiser les champs
                              setSelectedMandatKey(null);
                              const emptyForm = {
                                numero_civique: "",
                                rue: "",
                                ville: "",
                                province: "QC",
                                code_postal: "",
                                numero_lot: ""
                              };
                              setAddressForm(emptyForm);
                              onAddressChange({
                                numeros_civiques: [""],
                                rue: "",
                                ville: "",
                                province: "QC",
                                code_postal: "",
                                numero_lot: ""
                              });
                            } else {
                              // Sélectionner
                              setSelectedMandatKey(mandatKey);
                              onSelectExistingAddress && onSelectExistingAddress(addr, mandat.lots);
                            }
                          }}
                          className={`px-2 py-1 rounded cursor-pointer text-xs ${
                            isSelected 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{addrText}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] ${isSelected ? 'text-emerald-500' : 'text-slate-500'}`}>{mandat.type_mandat}</span>
                            {lotNumbers && (
                              <span className={`text-[10px] ${isSelected ? 'text-emerald-500' : 'text-slate-500'}`}>• {lotNumbers}</span>
                            )}
                          </div>
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