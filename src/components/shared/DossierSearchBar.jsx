import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function DossierSearchBar({ dossiers, clients, onDossierSelect }) {
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

  const getAdresse = (mandat) => {
    if (!mandat?.adresse_travaux) return "";
    const a = mandat.adresse_travaux;
    return [a.numeros_civiques?.filter(n => n).join(', '), a.rue, a.ville, a.code_postal].filter(Boolean).join(' ');
  };

  const matchesAllWords = (haystack, words) => words.every(w => haystack.includes(w));

  const filteredDossiers = React.useMemo(() => {
    if (!searchTerm.trim()) return (dossiers || [])
      .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture))
      .slice(0, 8);

    const words = searchTerm.toLowerCase().trim().split(/\s+/);
    return (dossiers || []).filter(dossier => {
      const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
      const clientsNames = getClientsNames(dossier.clients_ids);
      const notairesNames = getClientsNames(dossier.notaires_ids);
      const courtiersNames = getClientsNames(dossier.courtiers_ids);
      const adresses = (dossier.mandats || []).map(m => getAdresse(m)).join(' ');
      const mandatsTypes = (dossier.mandats || []).map(m => m.type_mandat || '').join(' ');
      // Concatenate everything into one big searchable string
      const haystack = [
        fullNumber,
        dossier.numero_dossier,
        clientsNames,
        notairesNames,
        courtiersNames,
        adresses,
        mandatsTypes,
        dossier.adresse_texte
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesAllWords(haystack, words);
    })
    .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture))
    .slice(0, 8);
  }, [searchTerm, dossiers, clients]);

  const handleDossierClick = (dossier) => {
    const url = createPageUrl("Dossiers") + "?edit_dossier_id=" + dossier.id;
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
          onKeyDown={(e) => { if (e.key === 'Escape') { setShowResults(false); setSearchTerm(""); } }}
          className="pl-10 bg-slate-800/50 border-slate-700 text-white"
        />
      </div>

      {showResults && (
        <div className="absolute top-full mt-2 w-full min-w-[520px] bg-slate-900 border-2 border-emerald-500/30 rounded-lg shadow-2xl overflow-hidden z-50">
          {!searchTerm.trim() && (
            <div className="px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] text-slate-500">Dossiers récents</span>
            </div>
          )}
          {filteredDossiers.length > 0 ? (
            <div className="max-h-[420px] overflow-y-auto">
              {filteredDossiers.map((dossier) => {
                const clientsNames = getClientsNames(dossier.clients_ids);
                const adresse = dossier.mandats?.[0] ? getAdresse(dossier.mandats[0]) : (dossier.adresse_texte || "");
                return (
                  <div
                    key={dossier.id}
                    onClick={() => handleDossierClick(dossier)}
                    className="px-3 py-2.5 hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-800/70 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border flex-shrink-0`}>
                          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                        </Badge>
                        {clientsNames && (
                          <span className="text-sm text-slate-300 truncate flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            {clientsNames}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {dossier.date_ouverture && (
                          <span className="text-[10px] text-slate-500">
                            {format(new Date(dossier.date_ouverture), "d MMM yyyy", { locale: fr })}
                          </span>
                        )}
                        <Badge className={`text-[10px] px-1.5 py-0 ${dossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {dossier.statut}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {adresse && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {adresse}
                        </span>
                      )}
                      {dossier.mandats && dossier.mandats.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {dossier.mandats.slice(0, 3).map((mandat, idx) => mandat.type_mandat && (
                            <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0">
                              {mandat.type_mandat.length > 20 ? mandat.type_mandat.substring(0, 20) + '…' : mandat.type_mandat}
                            </Badge>
                          ))}
                          {dossier.mandats.length > 3 && (
                            <Badge className="bg-slate-700 text-slate-400 text-[10px] px-1.5 py-0">+{dossier.mandats.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-sm">
              Aucun dossier trouvé
            </div>
          )}
        </div>
      )}
    </div>
  );
}