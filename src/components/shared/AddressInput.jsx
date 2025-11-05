
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, X, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PROVINCES_CANADIENNES = [
  "Québec",
  "Alberta",
  "Colombie-Britannique",
  "Île-du-Prince-Édouard",
  "Manitoba",
  "Nouveau-Brunswick",
  "Nouvelle-Écosse",
  "Nunavut",
  "Ontario",
  "Saskatchewan",
  "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest",
  "Yukon"
];

export default function AddressInput({ 
  addresses, 
  onChange, 
  showActuelle = true, 
  label = "Adresses",
  singleAddress = false,
  disabled = false 
}) {
  // Removed addressSuggestions and loadingSuggestions as they are no longer used for geolocation.

  const handleAddressChange = (index, field, value) => {
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = {
      ...updatedAddresses[index],
      [field]: value
    };
    onChange(updatedAddresses);
  };

  const handleCivicNumberChange = (addressIndex, civicIndex, value) => {
    const updatedAddresses = [...addresses];
    const currentCivics = updatedAddresses[addressIndex].numeros_civiques || [""];
    currentCivics[civicIndex] = value;
    updatedAddresses[addressIndex] = {
      ...updatedAddresses[addressIndex],
      numeros_civiques: currentCivics
    };
    onChange(updatedAddresses);
  };

  const addCivicNumber = (addressIndex) => {
    const updatedAddresses = [...addresses];
    const currentCivics = updatedAddresses[addressIndex].numeros_civiques || [""];
    updatedAddresses[addressIndex] = {
      ...updatedAddresses[addressIndex],
      numeros_civiques: [...currentCivics, ""]
    };
    onChange(updatedAddresses);
  };

  const removeCivicNumber = (addressIndex, civicIndex) => {
    const updatedAddresses = [...addresses];
    const currentCivics = updatedAddresses[addressIndex].numeros_civiques || [""];
    if (currentCivics.length > 1) {
      currentCivics.splice(civicIndex, 1);
      updatedAddresses[addressIndex] = {
        ...updatedAddresses[addressIndex],
        numeros_civiques: currentCivics
      };
      onChange(updatedAddresses);
    }
  };

  const addAddress = () => {
    onChange([...addresses, {
      ville: "",
      numeros_civiques: [""],
      rue: "",
      code_postal: "",
      province: "Québec",
      latitude: null,
      longitude: null,
      actuelle: false
    }]);
  };

  const removeAddress = (index) => {
    if (addresses.length > 1) {
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      onChange(updatedAddresses);
    }
  };

  const toggleActuelle = (index) => {
    const updatedAddresses = addresses.map((addr, i) => ({
      ...addr,
      actuelle: i === index
    }));
    onChange(updatedAddresses);
  };

  // Removed searchAddress and selectSuggestion functions as they are no longer used for geolocation.

  return (
    <div className="space-y-4">
      {!singleAddress && (
        <div className="flex justify-between items-center">
          <Label className="text-slate-300">{label}</Label>
          <Button
            type="button"
            size="sm"
            onClick={addAddress}
            disabled={disabled}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
      )}

      {addresses.map((address, addressIndex) => (
        <div key={addressIndex} className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg space-y-3">
          {!singleAddress && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-300">Adresse {addressIndex + 1}</span>
              <div className="flex gap-2">
                {showActuelle && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => toggleActuelle(addressIndex)}
                    disabled={disabled}
                    className={`${address.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
                    title={address.actuelle ? "Actuelle" : "Marquer comme actuelle"}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                {addresses.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAddress(addressIndex)}
                    disabled={disabled}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Numéro civique et Rue sur la même ligne */}
          <div className="grid grid-cols-[200px_1fr] gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Numéro(s) civique(s)</Label>
              {(address.numeros_civiques || [""]).map((num, civicIdx) => (
                <div key={civicIdx} className="flex gap-2">
                  <Input
                    value={num}
                    onChange={(e) => handleCivicNumberChange(addressIndex, civicIdx, e.target.value)}
                    placeholder="Ex: 123"
                    disabled={disabled}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {(address.numeros_civiques || [""]).length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCivicNumber(addressIndex, civicIdx)}
                      disabled={disabled}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                onClick={() => addCivicNumber(addressIndex)}
                disabled={disabled}
                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter un numéro
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Rue</Label>
              <Input
                value={address.rue || ""}
                onChange={(e) => handleAddressChange(addressIndex, 'rue', e.target.value)}
                placeholder="Nom de la rue"
                disabled={disabled}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Ville et Province */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Ville</Label>
              <Input
                value={address.ville || ""}
                onChange={(e) => handleAddressChange(addressIndex, 'ville', e.target.value)}
                placeholder="Ville"
                disabled={disabled}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Province</Label>
              <Select 
                value={address.province || "Québec"} 
                onValueChange={(value) => handleAddressChange(addressIndex, 'province', value)}
                disabled={disabled}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Sélectionner une province" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {PROVINCES_CANADIENNES.map((province) => (
                    <SelectItem key={province} value={province} className="text-white">
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Code postal */}
          <div className="space-y-2">
            <Label className="text-slate-300">Code postal</Label>
            <Input
              value={address.code_postal || ""}
              onChange={(e) => handleAddressChange(addressIndex, 'code_postal', e.target.value)}
              placeholder="Code postal"
              disabled={disabled}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          {/* Coordinates display */}
          {address.latitude && address.longitude && (
            <div className="text-xs text-slate-400">
              📍 Coordonnées: {address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
