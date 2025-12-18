import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, FileText, FolderOpen, ExternalLink, Search, ArrowUpDown, ArrowUp, ArrowDown, Package, Edit, MessageSquare, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import ClientFormDialog from "./ClientFormDialog";
import CommentairesSectionClient from "./CommentairesSectionClient"; // New import

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

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

const getTypeColor = (type) => {
  const colors = {
    "Client": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Notaire": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Courtier immobilier": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Compagnie": "bg-green-500/20 text-green-400 border-green-500/30"
  };
  return colors[type] || colors["Client"];
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  }
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  if (addr.province) parts.push(addr.province);
  if (addr.code_postal) parts.push(addr.code_postal);
  return parts.filter(p => p).join(', ');
};

export default function ClientDetailView({ client, onClose, onViewDossier }) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dossierSearchTerm, setDossierSearchTerm] = useState("");
  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterTypeMandat, setFilterTypeMandat] = useState("all");
  const [filterVille, setFilterVille] = useState("all");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  const queryClient = useQueryClient();

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-date_ouverture'),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: actionLogs = [] } = useQuery({
    queryKey: ['actionLogs', client.id],
    queryFn: async () => {
      const logs = await base44.entities.ActionLog.filter({ entite: "Client", entite_id: client.id });
      return logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    initialData: [],
  });

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const c = getClientById(id);
      return c ? `${c.prenom} ${c.nom}` : "";
    }).filter(name => name).join(", ");
  };

  const getClientDossiers = () => {
    const type = client.type_client;
    const field = type === 'Notaire' ? 'notaires_ids' : 
                  type === 'Courtier immobilier' ? 'courtiers_ids' : 'clients_ids';
    
    return dossiers
      .filter(d => d[field]?.includes(client.id) && d.statut !== "Rejeté")
      .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture));
  };

  const clientDossiers = getClientDossiers();

  // Créer une liste de mandats avec le dossier associé
  const mandatsWithDossier = [];
  clientDossiers.forEach(dossier => {
    if (dossier.mandats && dossier.mandats.length > 0) {
      dossier.mandats.forEach(mandat => {
        mandatsWithDossier.push({
          dossier,
          mandat
        });
      });
    } else {
      mandatsWithDossier.push({
        dossier,
        mandat: null
      });
    }
  });

  // Extraire la liste des villes uniques
  const uniqueVilles = [...new Set(
    mandatsWithDossier
      .map(item => item.mandat?.adresse_travaux?.ville)
      .filter(ville => ville)
  )].sort();

  // Extraire les types de mandats uniques
  const uniqueTypesMandats = [...new Set(
    mandatsWithDossier
      .map(item => item.mandat?.type_mandat)
      .filter(type => type)
  )].sort();

  // Filtrer les mandats
  const filteredMandats = mandatsWithDossier.filter(item => {
    const searchLower = dossierSearchTerm.toLowerCase();
    const clientsNames = getClientsNames(item.dossier.clients_ids);
    
    const matchesSearch = (
      item.dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      (getArpenteurInitials(item.dossier.arpenteur_geometre) + item.dossier.numero_dossier).toLowerCase().includes(searchLower) ||
      item.mandat?.type_mandat?.toLowerCase().includes(searchLower) ||
      formatAdresse(item.mandat?.adresse_travaux).toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower)
    );

    const matchesArpenteur = filterArpenteur === "all" || item.dossier.arpenteur_geometre === filterArpenteur;
    const matchesTypeMandat = filterTypeMandat === "all" || item.mandat?.type_mandat === filterTypeMandat;
    const matchesVille = filterVille === "all" || item.mandat?.adresse_travaux?.ville === filterVille;

    return matchesSearch && matchesArpenteur && matchesTypeMandat && matchesVille;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 inline" />;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1 inline" /> : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const sortedMandats = [...filteredMandats].sort((a, b) => {
    if (!sortField) return 0;
    let aValue, bValue;
    switch (sortField) {
      case 'numero_dossier':
        aValue = (getArpenteurInitials(a.dossier.arpenteur_geometre) + a.dossier.numero_dossier).toLowerCase();
        bValue = (getArpenteurInitials(b.dossier.arpenteur_geometre) + b.dossier.numero_dossier).toLowerCase();
        break;
      case 'date_ouverture':
        aValue = a.dossier.date_ouverture ? new Date(a.dossier.date_ouverture).getTime() : 0;
        bValue = b.dossier.date_ouverture ? new Date(b.dossier.date_ouverture).getTime() : 0;
        break;
      case 'type_mandat':
        aValue = (a.mandat?.type_mandat || '').toLowerCase();
        bValue = (b.mandat?.type_mandat || '').toLowerCase();
        break;
      case 'adresse_travaux':
        aValue = formatAdresse(a.mandat?.adresse_travaux).toLowerCase();
        bValue = formatAdresse(b.mandat?.adresse_travaux).toLowerCase();
        break;
      case 'clients':
        aValue = getClientsNames(a.dossier.clients_ids).toLowerCase();
        bValue = getClientsNames(b.dossier.clients_ids).toLowerCase();
        break;
      default:
        return 0;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else {
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    }
  });

  const adresseActuelle = client.adresses?.find(a => a.actuelle);
  const adressesAnciennes = client.adresses?.filter(a => !a.actuelle) || [];

  const courrielActuel = client.courriels?.find(c => c.actuel);
  const courrielsAnciens = client.courriels?.filter(c => !c.actuel) || [];

  const telephoneActuel = client.telephones?.find(t => t.actuel);
  const telephonesAnciens = client.telephones?.filter(t => !t.actuel) || [];

  const handleDossierClick = (dossier) => {
    const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
    window.open(url, '_blank');
  };

  // Déterminer si on doit afficher la colonne Clients
  const isNotaireOrCourtier = client.type_client === 'Notaire' || client.type_client === 'Courtier immobilier';

  return (
    <>
      <div className="grid grid-cols-[70%_30%] gap-6 h-full">
        {/* Colonne gauche - Informations client */}
        <div className="space-y-6 overflow-y-auto pr-4">
          {/* Header avec bouton Modifier */}
          <div className="border-b border-slate-700 pb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <Label className="text-slate-400 text-sm">Prénom</Label>
                  <p className="text-white font-medium text-lg">{client.prenom}</p>
                </div>
                <div>
                  <Label className="text-slate-400 text-sm">Nom</Label>
                  <p className="text-white font-medium text-lg">{client.nom}</p>
                </div>
              </div>
              <Button
                onClick={() => setIsEditDialogOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 ml-4"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Type</Label>
              <div className="mt-1">
                <Badge variant="outline" className={`${getTypeColor(client.type_client)} border`}>
                  {client.type_client || "Client"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Préférences de livraison */}
          {client.preferences_livraison && client.preferences_livraison.length > 0 && (
            <div>
              <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                <Package className="w-4 h-4" />
                Préférences de livraison
              </Label>
              <div className="flex gap-2">
                {client.preferences_livraison.map((mode, idx) => (
                  <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                    {mode}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Adresses */}
            {(adresseActuelle || adressesAnciennes.length > 0) && (
              <div>
                <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Adresse(s)
                </Label>
                <div className="space-y-2">
                  {adresseActuelle && (
                    <div className="flex items-start justify-between bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-slate-300 flex-1">
                        {typeof adresseActuelle.adresse === 'string' 
                          ? adresseActuelle.adresse 
                          : formatAdresse(adresseActuelle)}
                      </p>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                        Actuel
                      </Badge>
                    </div>
                  )}
                  {adressesAnciennes.map((addr, idx) => (
                    <div key={idx} className="flex items-start justify-between bg-slate-800/30 p-3 rounded-lg">
                      <p className="text-slate-400 flex-1 text-sm">
                        {typeof addr.adresse === 'string' 
                          ? addr.adresse 
                          : formatAdresse(addr)}
                      </p>
                      <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                        Ancien
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Courriels */}
            {(courrielActuel || courrielsAnciens.length > 0) && (
              <div>
                <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Courriel(s)
                </Label>
                <div className="space-y-2">
                  {courrielActuel && (
                   <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                     <a href={`mailto:${courrielActuel.courriel}`} className="text-blue-400 hover:text-blue-300 flex-1 transition-colors">
                       {courrielActuel.courriel}
                     </a>
                     <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                       Actuel
                     </Badge>
                   </div>
                  )}
                  {courrielsAnciens.map((courriel, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                     <a href={`mailto:${courriel.courriel}`} className="text-slate-400 hover:text-blue-400 flex-1 text-sm transition-colors">
                       {courriel.courriel}
                     </a>
                     <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                       Ancien
                     </Badge>
                   </div>
                  ))}
                </div>
              </div>
            )}

            {/* Téléphones */}
            {(telephoneActuel || telephonesAnciens.length > 0) && (
              <div>
                <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Téléphone(s)
                </Label>
                <div className="space-y-2">
                  {telephoneActuel && (
                    <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                      <a 
                        href={`tel:${telephoneActuel.telephone.replace(/\D/g, '')}`}
                        className="text-blue-400 hover:text-blue-300 transition-colors flex-1 cursor-pointer"
                      >
                        {telephoneActuel.telephone}
                      </a>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                        Actuel
                      </Badge>
                    </div>
                  )}
                  {telephonesAnciens.map((tel, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                      <a 
                        href={`tel:${tel.telephone.replace(/\D/g, '')}`}
                        className="text-slate-400 hover:text-blue-400 transition-colors flex-1 text-sm cursor-pointer"
                      >
                        {tel.telephone}
                      </a>
                      <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                        Ancien
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div>
                <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </Label>
                <div className="bg-slate-800/30 p-3 rounded-lg">
                  <p className="text-slate-300 whitespace-pre-wrap">{client.notes}</p>
                </div>
              </div>
            )}

            {/* Dossiers associés */}
            {mandatsWithDossier.length > 0 && (
              <div>
                <Label className="text-slate-400 mb-3 block flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Dossiers associés ({mandatsWithDossier.length} mandat{mandatsWithDossier.length > 1 ? 's' : ''})
                </Label>

                {/* Filtres et recherche */}
                <div className="space-y-3 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={dossierSearchTerm}
                      onChange={(e) => setDossierSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Select value={filterArpenteur} onValueChange={setFilterArpenteur}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-sm">
                        <SelectValue placeholder="Arpenteur" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">Tous les arpenteurs</SelectItem>
                        {ARPENTEURS.map(arp => (
                          <SelectItem key={arp} value={arp} className="text-white">{arp}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterTypeMandat} onValueChange={setFilterTypeMandat}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-sm">
                        <SelectValue placeholder="Type mandat" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">Tous les types</SelectItem>
                        {uniqueTypesMandats.map(type => (
                          <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterVille} onValueChange={setFilterVille}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white text-sm">
                        <SelectValue placeholder="Ville" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="all" className="text-white">Toutes les villes</SelectItem>
                        {uniqueVilles.map(ville => (
                          <SelectItem key={ville} value={ville} className="text-white">{ville}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('numero_dossier')}
                        >
                          N° Dossier {getSortIcon('numero_dossier')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('date_ouverture')}
                        >
                          Date d'ouverture {getSortIcon('date_ouverture')}
                        </TableHead>
                        {isNotaireOrCourtier && (
                          <TableHead 
                            className="text-slate-300 cursor-pointer hover:text-white"
                            onClick={() => handleSort('clients')}
                          >
                            Clients {getSortIcon('clients')}
                          </TableHead>
                        )}
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('type_mandat')}
                        >
                          Type de mandat {getSortIcon('type_mandat')}
                        </TableHead>
                        <TableHead 
                          className="text-slate-300 cursor-pointer hover:text-white"
                          onClick={() => handleSort('adresse_travaux')}
                        >
                          Adresse des travaux {getSortIcon('adresse_travaux')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMandats.length > 0 ? (
                        sortedMandats.map((item, idx) => (
                          <TableRow 
                            key={`${item.dossier.id}-${idx}`}
                            className="border-slate-800"
                          >
                            <TableCell className="font-medium">
                              <Badge variant="outline" className={`${getArpenteurColor(item.dossier.arpenteur_geometre)} border`}>
                                {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {format(new Date(item.dossier.date_ouverture), "dd MMM yyyy", { locale: fr })}
                            </TableCell>
                            {isNotaireOrCourtier && (
                              <TableCell className="text-slate-300 text-sm">
                                {getClientsNames(item.dossier.clients_ids)}
                              </TableCell>
                            )}
                            <TableCell>
                              {item.mandat ? (
                                <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                                  {item.mandat.type_mandat}
                                </Badge>
                              ) : (
                                <span className="text-slate-600 text-sm">Aucun mandat</span>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                              {item.mandat?.adresse_travaux ? formatAdresse(item.mandat.adresse_travaux) : "-"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={isNotaireOrCourtier ? 5 : 4} className="text-center py-8 text-slate-500">
                            Aucun dossier trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite - Commentaires et Historique */}
        <div className="flex flex-col h-full border-l border-slate-700 pl-6 pr-4">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 bg-slate-800/50 h-9 mb-3">
              <TabsTrigger value="commentaires" className="text-xs data-[state=active]:bg-emerald-500/30 data-[state=active]:text-emerald-400">
                <MessageSquare className="w-3 h-3 mr-1" />
                Commentaires
              </TabsTrigger>
              <TabsTrigger value="historique" className="text-xs data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-400">
                <Clock className="w-3 h-3 mr-1" />
                Historique
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="commentaires" className="flex-1 overflow-hidden mt-0">
              <CommentairesSectionClient clientId={client.id} />
            </TabsContent>
            
            <TabsContent value="historique" className="flex-1 overflow-y-auto mt-0">
              {actionLogs.length > 0 ? (
                <div className="space-y-2">
                  {actionLogs.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{entry.action}</p>
                          {entry.details && (
                            <p className="text-slate-400 text-xs mt-1 break-words">{entry.details}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                            <span className="text-emerald-400">{entry.utilisateur_nom}</span>
                            <span>•</span>
                            <span>{format(new Date(entry.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500">Aucune action enregistrée</p>
                    <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* ClientFormDialog */}
      <ClientFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingClient={client}
        defaultType={client.type_client}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
        }}
      />
    </>
  );
}