import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AddressSearchInput({ onAddressSelect, placeholder = "Ex: 123 rue Principale, Alma..." }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleAddressSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('searchAddressGoogleMaps', { query });
      
      if (response.data.suggestions) {
        setSearchResults(response.data.suggestions);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching address:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Rechercher une adresse</Label>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (e.target.value.length > 3) {
              handleAddressSearch(e.target.value);
            } else {
              setSearchResults([]);
            }
          }}
          className="pl-7 bg-slate-700 border-slate-600 h-8 text-sm"
        />
      </div>
      
      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
          {searchResults.map((addr, idx) => (
            <div
              key={idx}
              onClick={() => {
                onAddressSelect(addr);
                setSearchTerm("");
                setSearchResults([]);
              }}
              className="px-2 py-1.5 rounded text-xs bg-slate-700/50 hover:bg-slate-700 cursor-pointer text-slate-300"
            >
              {addr.civic_number} {addr.street}, {addr.city}, {addr.province} {addr.postal_code}
              {addr.distance && <span className="text-slate-500 ml-2">({addr.distance} km)</span>}
            </div>
          ))}
        </div>
      )}
      
      {isSearching && (
        <p className="text-xs text-slate-500">Recherche en cours...</p>
      )}
    </div>
  );
}