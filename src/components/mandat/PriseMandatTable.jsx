import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FolderOpen, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";

export default function PriseMandatTable({
  activeListTab,
  priseMandats,
  searchTerm,
  filterArpenteur,
  filterVille,
  filterTypeMandat,
  filterUrgence,
  filterDateStart,
  filterDateEnd,
  filterPlaceAffaire,
  filterEquipeExternal = "Toutes",
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  getArpenteurColor,
  getArpenteurInitials,
  getClientsNames,
  formatAdresse,
  getMandatColor,
  getAbbreviatedMandatType,
  getClientById,
  onOpenDossier
}) {
  const applyFilters = (priseMandatsList) => {
    return priseMandatsList.filter(pm => {
      const searchLower = searchTerm.toLowerCase();
      // Construire tous les noms de clients (principal + extras) pour la recherche
      const allClientNames = [];
      const primaryName = `${pm.client_info?.prenom || ''} ${pm.client_info?.nom || ''}`.trim();
      if (primaryName) allClientNames.push(primaryName);
      (pm.client_info?.extra_clients || []).forEach(ec => {
        const n = `${ec.prenom || ''} ${ec.nom || ''}`.trim();
        if (n) allClientNames.push(n);
      });
      if (allClientNames.length === 0) allClientNames.push(getClientsNames(pm.clients_ids));
      const clientNamesStr = allClientNames.join(', ').toLowerCase();

      const matchesSearch = (
        pm.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        clientNamesStr.includes(searchLower) ||
        formatAdresse(pm.adresse_travaux)?.toLowerCase().includes(searchLower) ||
        pm.mandats?.some(m => m.type_mandat?.toLowerCase().includes(searchLower))
      );

      const matchesArpenteur = (filterArpenteur.length === 0 || filterArpenteur.includes(pm.arpenteur_geometre)) &&
        (filterEquipeExternal === "Toutes" || pm.arpenteur_geometre?.includes(filterEquipeExternal));
      const matchesVille = filterVille.length === 0 || filterVille.includes(pm.adresse_travaux?.ville);
      const matchesTypeMandat = filterTypeMandat.length === 0 || pm.mandats?.some(m => filterTypeMandat.includes(m.type_mandat));
      const matchesUrgence = filterUrgence.length === 0 || filterUrgence.includes(pm.urgence_percue);

      const pmDate = new Date(pm.created_date);
      const matchesDateStart = filterDateStart === "" || pmDate >= new Date(filterDateStart);
      const matchesDateEnd = filterDateEnd === "" || pmDate <= new Date(filterDateEnd + "T23:59:59");

      return matchesSearch && matchesArpenteur && matchesVille && matchesTypeMandat && matchesUrgence && matchesDateStart && matchesDateEnd && (filterPlaceAffaire === "tous" || pm.place_affaire === filterPlaceAffaire);
    });
  };

  const getUrgenceColor = (u) => (u === "Rapide" || u === "Urgent") ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30";

  const handleOpenDossier = async (pm) => {
    const clientName = `${pm.client_info?.prenom || ''} ${pm.client_info?.nom || ''}`.trim() || (pm.clients_ids.length > 0 ? getClientsNames(pm.clients_ids) : "Client");
    const arpenteurInitials = getArpenteurInitials(pm.arpenteur_geometre).replace('-', '');
    
    try {
      const checkResponse = await base44.functions.invoke('sharepoint', { 
        action: 'list', 
        folderPath: `ARPENTEUR/${arpenteurInitials}/DOSSIER/TEMPORAIRE/${arpenteurInitials}-${clientName}/INTRANTS` 
      });
      
      if (checkResponse.data?.files?.length > 0) {
        await base44.functions.invoke('moveSharePointFiles', { 
          sourceFolderPath: `ARPENTEUR/${arpenteurInitials}/DOSSIER/TEMPORAIRE/${arpenteurInitials}-${clientName}/INTRANTS`, 
          destinationFolderPath: `ARPENTEUR/${arpenteurInitials}/DOSSIER/${arpenteurInitials}-${pm.numero_dossier}/INTRANTS` 
        });
      }
    } catch (error) {
      console.error("Erreur lors du déplacement SharePoint:", error);
    }

    // Générer et passer le résumé du mandat au parent
    onOpenDossier(pm);
  };

  const sortedData = applyFilters(priseMandats
    .filter(pm => {
      if (activeListTab === "nouveau") {
        return pm.statut === "Nouveau mandat/Demande d'information" || pm.statut === "Nouveau mandat" || pm.statut === "Demande d'information";
      } else if (activeListTab === "ouvrir") {
        return pm.statut === "Mandats à ouvrir";
      } else {
        return pm.statut === "Mandat non octroyé";
      }
    }))
    .sort((a, b) => {
      if (!sortField) return 0;
      let aValue, bValue;
      
      switch (sortField) {
        case 'arpenteur_geometre':
          aValue = (a.arpenteur_geometre || '').toLowerCase();
          bValue = (b.arpenteur_geometre || '').toLowerCase();
          break;
        case 'created_date':
          aValue = new Date(a.created_date || 0).getTime();
          bValue = new Date(b.created_date || 0).getTime();
          break;
        case 'clients':
          const aClientName = a.client_info?.prenom || a.client_info?.nom 
            ? `${a.client_info.prenom || ''} ${a.client_info.nom || ''}`.trim()
            : getClientsNames(a.clients_ids);
          const bClientName = b.client_info?.prenom || b.client_info?.nom 
            ? `${b.client_info.prenom || ''} ${b.client_info.nom || ''}`.trim()
            : getClientsNames(b.clients_ids);
          aValue = aClientName.toLowerCase();
          bValue = bClientName.toLowerCase();
          break;
        case 'adresse_travaux':
          aValue = `${a.adresse_travaux?.numeros_civiques?.[0] || ''} ${a.adresse_travaux?.rue || ''}`.toLowerCase();
          bValue = `${b.adresse_travaux?.numeros_civiques?.[0] || ''} ${b.adresse_travaux?.rue || ''}`.toLowerCase();
          break;
        case 'ville':
          aValue = (a.adresse_travaux?.ville || '').toLowerCase();
          bValue = (b.adresse_travaux?.ville || '').toLowerCase();
          break;
        case 'types_mandats':
          aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
          bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
          break;
        case 'urgence_percue':
          const urgenceOrder = { 'Rapide': 1, 'Normal': 2, 'Pas pressé': 3 };
          aValue = urgenceOrder[a.urgence_percue] || 4;
          bValue = urgenceOrder[b.urgence_percue] || 4;
          break;
        default:
          aValue = '';
          bValue = '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
            {[['arpenteur_geometre', activeListTab === 'ouvrir' ? 'Dossier' : 'Arpenteur-Géomètre'], ['clients', 'Clients'], ['adresse_travaux', 'Adresse des travaux'], ['ville', 'Ville'], [null, 'N° de téléphone'], ['types_mandats', 'Types de mandats'], ['created_date', 'Date'], ['urgence_percue', 'Urgence']].map(([field, label]) => (
              <TableHead
                key={label}
                className={`text-slate-300 text-xs ${field ? 'cursor-pointer hover:text-white select-none' : ''}`}
                onClick={field ? () => onSort(field) : undefined}
              >
                <div className="flex items-center gap-1">
                  {label}
                  {field && (sortField === field
                    ? sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-red-400" /> : <ChevronDown className="w-3 h-3 text-red-400" />
                    : <ChevronsUpDown className="w-3 h-3 text-slate-500" />)}
                </div>
              </TableHead>
            ))}
            <TableHead className="text-slate-300 text-xs text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((pm) => (
            <TableRow 
              key={pm.id} 
              className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
              onClick={() => onEdit(pm)}
            >
              <TableCell className="font-medium">
                {activeListTab === "ouvrir" ? (
                  <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                    {getArpenteurInitials(pm.arpenteur_geometre)}{pm.numero_dossier || "N/A"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className={`${getArpenteurColor(pm.arpenteur_geometre)} border`}>
                    {pm.arpenteur_geometre}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-slate-300 text-xs max-w-xs">
                {(() => {
                  const repKey = pm.client_info?.representant_key;
                  const clients = [];
                  const primaryName = `${pm.client_info?.prenom || ''} ${pm.client_info?.nom || ''}`.trim();
                  if (primaryName) clients.push({ name: primaryName, isRep: repKey === "primary" });
                  (pm.client_info?.extra_clients || []).forEach((ec, i) => {
                    const n = `${ec.prenom || ''} ${ec.nom || ''}`.trim();
                    if (n) clients.push({ name: n, isRep: repKey === `extra_${i}` });
                  });
                  if (clients.length === 0) return <span className="truncate">{getClientsNames(pm.clients_ids)}</span>;
                  const nonRep = clients.filter(c => !c.isRep);
                  const rep = clients.find(c => c.isRep);
                  return (
                    <span>
                      {nonRep.map((c, i) => <span key={i}>{i > 0 && ', '}{c.name}</span>)}
                      {rep && <span>{nonRep.length > 0 && ' '}({rep.name})</span>}
                    </span>
                  );
                })()}
              </TableCell>
              <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                {pm.adresse_travaux?.numeros_civiques?.[0] || pm.adresse_travaux?.rue
                  ? `${pm.adresse_travaux.numeros_civiques?.[0] || ''} ${pm.adresse_travaux.rue || ''}`.trim()
                  : '-'}
              </TableCell>
              <TableCell className="text-slate-300 text-xs">
                {pm.adresse_travaux?.ville || '-'}
              </TableCell>
              <TableCell className="text-slate-300 text-xs">
                {(() => {
                  const telephone = pm.client_info?.telephone || 
                    (pm.clients_ids?.length > 0 && (() => {
                      const client = getClientById(pm.clients_ids[0]);
                      return client?.telephones?.find(t => t.actuel)?.telephone || client?.telephones?.[0]?.telephone || null;
                    })());
                  
                  if (telephone) {
                    return (
                      <a 
                        href={`tel:${telephone.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer hover:underline"
                      >
                        {telephone}
                      </a>
                    );
                  }
                  return '-';
                })()}
              </TableCell>
              <TableCell className="text-slate-300">
                {pm.mandats && pm.mandats.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {pm.mandats.slice(0, 2).map((m, idx) => (
                      <Badge key={idx} className={`${getMandatColor(m.type_mandat)} border text-xs pointer-events-none select-none cursor-default`}>
                        {getAbbreviatedMandatType(m.type_mandat)}
                      </Badge>
                    ))}
                    {pm.mandats.length > 2 && (
                      <Badge className="bg-slate-700 text-slate-300 text-xs">
                        +{pm.mandats.length - 2}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-600 text-xs">Aucun</span>
                )}
              </TableCell>

              <TableCell className="text-slate-300 text-xs">
                {pm.created_date ? format(new Date(pm.created_date), "dd MMM yyyy", { locale: fr }) : "-"}
              </TableCell>
              <TableCell>
                {pm.urgence_percue ? (
                  <Badge className={`${getUrgenceColor(pm.urgence_percue)} border text-xs pointer-events-none select-none cursor-default`}>
                    {pm.urgence_percue === "Rapide" ? "Urgent" : pm.urgence_percue}
                  </Badge>
                ) : (
                  <span className="text-slate-600 text-xs">-</span>
                )}
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  {activeListTab === "ouvrir" && (
                    <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDossier(pm)}
                        className="text-emerald-400 hover:text-emerald-400 hover:bg-transparent"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(pm.id)}
                      className="text-red-400 hover:text-red-400 hover:bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedData.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                Aucune prise de mandat dans cette catégorie
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}