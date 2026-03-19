import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AddressSearchInput({ value, onChange, className }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('googlePlacesAutocomplete', { query: val });
        const predictions = response.data?.predictions || [];
        setSuggestions(predictions);
        setShowDropdown(predictions.length > 0);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (adresse) => {
    setQuery(adresse);
    onChange(adresse);
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Rechercher une adresse..."
          className={`pl-9 ${className || "bg-slate-800 border-slate-700"}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s.adresse)}
              className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center gap-2 transition-colors border-b border-slate-700/50 last:border-0"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              {s.adresse}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}