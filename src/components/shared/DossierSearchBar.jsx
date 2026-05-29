import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, User, Clock, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
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

export default function DossierSearchBar({ dossiers, clients, users = [], onDossierSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const getClientById = (id) => clients?.find(c => c.id === id);
  const getUserByEmail = (email) => users?.find(u => u.email === email);

  // Les users ont directement prenom + nom sur l'entité User
  const getUserNomComplet = (email) => {
    const u = getUserByEmail(email);
    if (!u) return email.split('@')[0];
    if (u.prenom && u.nom) return `${u.prenom} ${u.nom}`;
    return u.full_name || email.split('@')[0];
  };

  const getUserInitials = (email) => {
    const u = getUserByEmail(email);
    if (!u) return email?.split('@')[0]?.substring(0, 2).toUpperCase() || '?';
    if (u.prenom && u.nom) return `${u.prenom[0]}${u.nom[0]}`.toUpperCase();
    return (u.full_name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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
        dossier.adresse_texte,
        dossier.clients_texte
      ].filter(Boolean).join(' ').toLowerCase();

      return matchesAllWords(haystack, words);
    })
    .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture))
    .slice(0, 8);
  }, [searchTerm, dossiers, clients]);

  const handleDossierClick = (dossier) => {
    window.dispatchEvent(new CustomEvent('openDossierEdit', { detail: { dossierId: dossier.id } }));
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
          {/* Bouton recherche avancée */}
          <button
            onClick={() => { setShowResults(false); navigate('/RechercheAvancee'); }}
            className="w-full px-3 py-2 flex items-center gap-2 text-primary hover:bg-primary/10 border-b border-slate-800 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[12px] font-medium">Recherche avancée</span>
          </button>
          {!searchTerm.trim() && (
            <div className="px-3 py-1.5 border-b border-slate-800 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] text-slate-500">Dossiers récents</span>
            </div>
          )}
          {filteredDossiers.length > 0 ? (
            <div className="max-h-[480px] overflow-y-auto">
              {filteredDossiers.map((dossier) => {
                const clientsNames = getClientsNames(dossier.clients_ids);
                const mandats = (dossier.mandats || []).filter(m => m.type_mandat);
                return (
                  <div
                    key={dossier.id}
                    onClick={() => handleDossierClick(dossier)}
                    className="px-3 py-2.5 hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-800/70 last:border-b-0"
                  >
                    {/* Ligne principale : numéro dossier + client + date + statut */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                        <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border flex-shrink-0 w-fit`}>
                          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                        </Badge>
                        {(clientsNames || dossier.clients_texte) && (
                          <span className="text-sm text-slate-300 flex items-center gap-1 flex-shrink-0">
                            <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            {clientsNames || dossier.clients_texte}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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

                    {/* Une ligne par mandat */}
                    {mandats.length > 0 && (
                      <div className="mt-1.5 space-y-1 pl-1">
                        {mandats.map((mandat, idx) => {
                          const adresse = getAdresse(mandat);
                          return (
                            <div key={idx} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                <Badge className={`${getMandatColor(mandat.type_mandat)} border text-[10px] px-1.5 py-0 flex-shrink-0`}>
                                  {getAbbreviatedMandatType(mandat.type_mandat)}
                                </Badge>
                                {mandat.tache_actuelle && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                                    <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-[10px] px-1.5 py-0 flex-shrink-0">
                                      {mandat.tache_actuelle}
                                    </Badge>
                                  </>
                                )}
                                {adresse && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                                      {adresse}
                                    </span>
                                  </>
                                )}
                              </div>
                              {mandat.utilisateur_assigne && (() => {
                                const u = getUserByEmail(mandat.utilisateur_assigne);
                                const photoUrl = u?.photo_url || u?.profile_picture;
                                return (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {photoUrl ? (
                                      <img src={photoUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-slate-600" />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">
                                        {getUserInitials(mandat.utilisateur_assigne)}
                                      </div>
                                    )}
                                    <span className="text-[10px] text-slate-300">
                                      {getUserNomComplet(mandat.utilisateur_assigne)}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fallback adresse si pas de mandats */}
                    {mandats.length === 0 && dossier.adresse_texte && (
                      <div className="mt-1">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {dossier.adresse_texte}
                        </span>
                      </div>
                    )}
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