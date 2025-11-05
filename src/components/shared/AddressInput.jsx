
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

export default function AddressInput({
  addresses,
  onChange,
  showActuelle = true,
  label = "Adresse", // Changed default label from "Adresses"
  singleAddress = false, // Still passed, but its effect on UI (add/remove address buttons) is gone based on outline
  disabled = false // Added disabled prop
}) {

  // The 'addAddress' and 'removeAddress' functions for managing entire address blocks
  // are no longer directly used by the provided JSX outline, as the UI buttons for them
  // have been removed. The parent component is now expected to manage the addition/removal
  // of addresses in the 'addresses' array.

  const updateField = (index, field, value) => {
    if (disabled) return; // Prevent changes if disabled
    onChange(addresses.map((addr, i) =>
      i === index ? { ...addr, [field]: value } : addr
    ));
  };

  const addCivicNumber = (addrIndex) => {
    if (disabled) return; // Prevent changes if disabled
    onChange(addresses.map((addr, i) =>
      i === addrIndex ? { ...addr, numeros_civiques: [...(addr.numeros_civiques || []), ""] } : addr
    ));
  };

  const removeCivicNumber = (addrIndex, numIndex) => {
    if (disabled) return; // Prevent changes if disabled
    onChange(addresses.map((addr, i) =>
      i === addrIndex && (addr.numeros_civiques?.length || 0) > 1 // Ensure at least one civic number remains
        ? { ...addr, numeros_civiques: addr.numeros_civiques.filter((_, ni) => ni !== numIndex) }
        : addr
    ));
  };

  const updateCivicNumber = (addrIndex, numIndex, value) => {
    if (disabled) return; // Prevent changes if disabled
    onChange(addresses.map((addr, i) =>
      i === addrIndex
        ? { ...addr, numeros_civiques: addr.numeros_civiques.map((n, ni) => ni === numIndex ? value : n) }
        : addr
    ));
  };

  const toggleActuelle = (index) => {
    if (disabled) return; // Prevent changes if disabled
    // This logic ensures only one address can be 'actuelle' at a time.
    // Clicking an already 'actuelle' address will re-set it to 'actuelle' and others to false,
    // effectively maintaining its status as the sole 'actuelle' address.
    onChange(addresses.map((addr, i) => ({
      ...addr,
      actuelle: i === index
    })));
  };

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      {addresses.map((address, index) => (
        <div key={index} className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Numéros Civiques */}
            <div className="space-y-2 col-span-2">
              <Label>Numéro(s) civique(s)</Label>
              {address.numeros_civiques?.map((num, civicIdx) => (
                <div key={civicIdx} className="flex gap-2 items-center">
                  <Input
                    value={num}
                    onChange={(e) => updateCivicNumber(index, civicIdx, e.target.value)}
                    placeholder="Numéro civique"
                    className="bg-slate-800 border-slate-700"
                    disabled={disabled}
                  />
                  {address.numeros_civiques.length > 1 && !disabled && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeCivicNumber(index, civicIdx)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!disabled && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addCivicNumber(index)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 mt-1"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter un numéro
                </Button>
              )}
            </div>

            {/* Rue */}
            <div className="space-y-2 col-span-2">
              <Label>Rue</Label>
              <Input
                value={address.rue}
                onChange={(e) => updateField(index, 'rue', e.target.value)}
                placeholder="Nom de la rue"
                className="bg-slate-800 border-slate-700"
                disabled={disabled}
              />
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input
                value={address.ville}
                onChange={(e) => updateField(index, 'ville', e.target.value)}
                placeholder="Ville"
                className="bg-slate-800 border-slate-700"
                disabled={disabled}
              />
            </div>

            {/* Province */}
            <div className="space-y-2">
              <Label>Province</Label>
              <Input
                value={address.province}
                onChange={(e) => updateField(index, 'province', e.target.value)}
                placeholder="Province (ex: QC)"
                className="bg-slate-800 border-slate-700"
                disabled={disabled}
              />
            </div>

            {/* Code Postal */}
            <div className="space-y-2">
              <Label>Code Postal</Label>
              <Input
                value={address.code_postal}
                onChange={(e) => updateField(index, 'code_postal', e.target.value)}
                placeholder="Code postal"
                className="bg-slate-800 border-slate-700"
                disabled={disabled}
              />
            </div>
          </div>

          {showActuelle && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id={`actuelle-${index}`}
                checked={address.actuelle}
                onChange={() => toggleActuelle(index)}
                className="form-checkbox h-4 w-4 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded"
                disabled={disabled}
              />
              <label htmlFor={`actuelle-${index}`} className="text-slate-300 text-sm">
                Adresse actuelle
              </label>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
