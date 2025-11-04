
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Check } from "lucide-react";

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
  singleAddress = false 
}) {
  const addAddress = () => {
    onChange([...addresses, {
      ville: "",
      numeros_civiques: [""],
      rue: "",
      code_postal: "",
      province: "",
      actuelle: false
    }]);
  };

  const removeAddress = (index) => {
    if (addresses.length > 1) {
      onChange(addresses.filter((_, i) => i !== index));
    }
  };

  const updateAddress = (index, field, value) => {
    onChange(addresses.map((addr, i) => 
      i === index ? { ...addr, [field]: value } : addr
    ));
  };

  const addNumeroCivique = (addrIndex) => {
    onChange(addresses.map((addr, i) =>
      i === addrIndex ? { ...addr, numeros_civiques: [...(addr.numeros_civiques || []), ""] } : addr
    ));
  };

  const removeNumeroCivique = (addrIndex, numIndex) => {
    onChange(addresses.map((addr, i) =>
      i === addrIndex && addr.numeros_civiques.length > 1
        ? { ...addr, numeros_civiques: addr.numeros_civiques.filter((_, ni) => ni !== numIndex) }
        : addr
    ));
  };

  const updateNumeroCivique = (addrIndex, numIndex, value) => {
    onChange(addresses.map((addr, i) =>
      i === addrIndex
        ? { ...addr, numeros_civiques: addr.numeros_civiques.map((n, ni) => ni === numIndex ? value : n) }
        : addr
    ));
  };

  const toggleActuelle = (index) => {
    onChange(addresses.map((addr, i) => ({
      ...addr,
      actuelle: i === index
    })));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        {!singleAddress && (
          <Button
            type="button"
            size="sm"
            onClick={addAddress}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        )}
      </div>
      {addresses.map((addr, index) => (
        <Card key={index} className="border-slate-700 bg-slate-800/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm">{singleAddress ? label : `Adresse ${index + 1}`}</Label>
              <div className="flex gap-2">
                {showActuelle && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => toggleActuelle(index)}
                    className={`${addr.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                {!singleAddress && addresses.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAddress(index)}
                    className="text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addNumeroCivique(index)}
                  className="bg-slate-700 hover:bg-slate-600 text-white flex-shrink-0"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  N° civique
                </Button>
                <Label className="text-xs text-slate-400">Numéros civiques</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                {addr.numeros_civiques?.map((num, numIndex) => (
                  <div key={numIndex} className="flex gap-1 items-center">
                    <Input
                      value={num}
                      onChange={(e) => updateNumeroCivique(index, numIndex, e.target.value)}
                      placeholder="Numéro"
                      className="bg-slate-700 border-slate-600 w-24"
                    />
                    {addr.numeros_civiques.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeNumeroCivique(index, numIndex)}
                        className="text-red-400 p-1 h-8 w-8"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Rue</Label>
                <Input
                  value={addr.rue}
                  onChange={(e) => updateAddress(index, 'rue', e.target.value)}
                  placeholder="Nom de rue"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Ville</Label>
                <Input
                  value={addr.ville}
                  onChange={(e) => updateAddress(index, 'ville', e.target.value)}
                  placeholder="Ville"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Province</Label>
                <Select 
                  value={addr.province} 
                  onValueChange={(value) => updateAddress(index, 'province', value)}
                >
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                    {PROVINCES_CANADIENNES.map((province) => (
                      <SelectItem key={province} value={province} className="text-white">
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Code postal</Label>
                <Input
                  value={addr.code_postal}
                  onChange={(e) => updateAddress(index, 'code_postal', e.target.value)}
                  placeholder="G0W 0A0"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
