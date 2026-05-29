import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Kanban } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ResizableTable from "@/components/ui/ResizableTable";

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

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
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

const DossiersTable = ({ 
    sortedDossiers, 
    handleEdit, 
    handleDelete, 
    handleSort,
    sortField,
    sortDirection,
    getClientsNames,
    lots,
    getFirstAdresseTravaux,
    formatAdresse
}) => {
  return (
    <ResizableTable tableId="dossiers">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
              <TableHead className="text-slate-300 w-8"></TableHead>
              {[{key:'numero_dossier',label:'N° Dossier'},{key:'clients',label:'Clients'},{key:'type_mandat',label:'Mandat'},{key:'lots',label:'Lot'},{key:'tache_actuelle',label:'Tâche actuelle'},{key:'ville',label:'Adresse Travaux'},{key:'date_ouverture',label:'Date ouverture'},{key:'date_fermeture',label:'Date fermeture'},{key:'statut',label:'Statut'}].map(col => (
                <TableHead key={col.key} onClick={() => handleSort(col.key)} className="text-slate-300 cursor-pointer hover:text-white transition-colors select-none">
                  <div className="flex items-center gap-1">{col.label}{sortField === col.key ? (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-red-400" /> : <ChevronDown className="w-3 h-3 text-red-400" />) : <ChevronsUpDown className="w-3 h-3 text-slate-500" />}</div>
                </TableHead>
              ))}
              <TableHead className="text-slate-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedDossiers.length > 0 ?
          sortedDossiers.map((dossier) =>
          <TableRow
            key={dossier.displayId}
            className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
            onClick={() => handleEdit(dossier)}>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                              {dossier.ttl === "Oui" && (
                                <div className="px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded flex items-center justify-center" title="Dossier TTL">
                                  <span className="text-white text-xs font-bold">TTL</span>
                                </div>
                              )}
                              {dossier.trello === "Oui" && (
                                <div className="p-1 bg-blue-500/80 rounded flex items-center justify-center" title="Dossier Trello">
                                  <Kanban className="w-3 h-3 text-white" />
                                </div>
                              )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>{getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{(dossier.ttl === "Oui" ? dossier.clients_texte : getClientsNames(dossier.clients_ids) !== "-" ? getClientsNames(dossier.clients_ids) : dossier.clients_texte) || "-"}</TableCell>
                  <TableCell className="text-slate-300">
                    {dossier.allMandats && dossier.allMandats.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {dossier.allMandats.map((mandat, idx) => (
                          <Badge key={idx} className={`${getMandatColor(mandat.type_mandat)} border text-xs`}>
                            {getAbbreviatedMandatType(mandat.type_mandat)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {(() => {
                      // Collect all lots (both texte and linked)
                      const lotsTexte = (dossier.allMandats || []).flatMap(m => 
                        m.lots_texte ? m.lots_texte.split('\n').filter(l => l.trim()) : []
                      ).map(l => l.trim());
                      const lotsLinked = (dossier.allMandats || []).flatMap(m => m.lots || []).map(lotId => {
                        const lot = lots.find(l => l.id === lotId);
                        return lot ? lot.numero_lot : null;
                      }).filter(Boolean);
                      
                      // Combine and deduplicate
                      const allLots = [...new Set([...lotsTexte, ...lotsLinked])].filter(Boolean);
                      
                      return allLots.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {allLots.map((lot, idx) => (
                            <Badge key={idx} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] font-mono">
                              {lot}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {(dossier.allMandats || []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set((dossier.allMandats || []).map(m => m.tache_actuelle).filter(Boolean))).map((tache, idx) => (
                          <Badge key={idx} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                            {tache}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {dossier.ttl === "Oui" ? (dossier.adresse_texte || dossier.mandatInfo?.adresse_travaux_texte || "-") : getFirstAdresseTravaux(dossier.mandats)}
                  </TableCell>
                  <TableCell className="text-slate-300">{dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "dd MMM yyyy", { locale: fr }) : '-'}</TableCell>
                  <TableCell className="text-slate-300">
                    {dossier.date_fermeture ? format(new Date(dossier.date_fermeture), "dd MMM yyyy", { locale: fr }) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border ${dossier.statut === 'Ouvert' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{dossier.statut}</Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(dossier.id, getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
          ) :
          <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-slate-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun dossier trouvé.</p>
                </TableCell>
              </TableRow>
          }
          </TableBody>
          </Table>
          </ResizableTable>
  )
}

export default DossiersTable;