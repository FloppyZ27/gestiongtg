import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

export default function DossierSearchBar({ dossiers, clients }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const getClientById = (id) => clients?.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "";
    return clientIds.map(id => {
      const c = getClientById(id);
      return c ? `${c.prenom} ${c.nom}` : "";
    }).filter(name => name).join(", ");
  };

  const filteredDossiers = (dossiers || []).filter(dossier => {
    if (!searchTerm.trim()) return false;
    const searchLower = searchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
    const clientsNames = getClientsNames(dossier.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      dossier.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
    );
  }).slice(0, 5);

  const handleDossierClick = (dossier) => {
    const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
    window.location.href = url;
    setSearchTerm("");
    setShowResults(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
        <Input
          placeholder="Rechercher un dossier..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white"
        />
      </div>

      {showResults && searchTerm.trim() && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border-2 border-emerald-500/30 rounded-lg shadow-2xl overflow-hidden z-50">
          {filteredDossiers.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto">
              {filteredDossiers.map((dossier) => (
                <div
                  key={dossier.id}
                  onClick={() => handleDossierClick(dossier)}
                  className="p-3 hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-800 last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                      {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                    </Badge>
                    <Badge className={dossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {dossier.statut}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 truncate">
                    {getClientsNames(dossier.clients_ids) || "Aucun client"}
                  </p>
                  {dossier.mandats && dossier.mandats.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {dossier.mandats.slice(0, 2).map((mandat, idx) => (
                        <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 text-xs">
                          {mandat.type_mandat}
                        </Badge>
                      ))}
                      {dossier.mandats.length > 2 && (
                        <Badge className="bg-slate-700 text-slate-300 text-xs">
                          +{dossier.mandats.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500">
              Aucun dossier trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}