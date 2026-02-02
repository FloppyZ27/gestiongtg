import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, X, Check, FolderOpen, Eye, ArrowUpDown, ArrowUp, ArrowDown, Download, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";
import CommentairesSectionClient from "../components/clients/CommentairesSectionClient";
import ClientFormDialog from "../components/clients/ClientFormDialog";

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

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [filterType, setFilterType] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date'),
    initialData: [],
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-date_ouverture'),
    initialData: [],
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Helper functions - defined before use
  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0) {
      const nums = addr.numeros_civiques.filter(n => n && n.trim() !== "");
      if (nums.length > 0) parts.push(nums.join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    if (addr.province) parts.push(addr.province);
    if (addr.code_postal) parts.push(addr.code_postal);
    return parts.filter(p => p).join(', ');
  };

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "-";
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

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientDossiers = (clientId, type = 'clients') => {
    const field = `${type}_ids`;
    return dossiers
      .filter(d => d[field]?.includes(clientId))
      .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortClients = (clientsList) => {
    if (!sortField) return clientsList;

    return [...clientsList].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'nom':
          aValue = `${a.prenom || ''} ${a.nom || ''}`.toLowerCase();
          bValue = `${b.prenom || ''} ${b.nom || ''}`.toLowerCase();
          break;
        case 'type':
          aValue = (a.type_client || 'Client').toLowerCase();
          bValue = (b.type_client || 'Client').toLowerCase();
          break;
        case 'adresse':
          const addrA = a.adresses?.find(addr => addr.actuelle);
          const addrB = b.adresses?.find(addr => addr.actuelle);
          aValue = formatAdresse(addrA).toLowerCase();
          bValue = formatAdresse(addrB).toLowerCase();
          break;
        case 'courriel':
          aValue = getCurrentValue(a.courriels, 'courriel').toLowerCase();
          bValue = getCurrentValue(b.courriels, 'courriel').toLowerCase();
          break;
        case 'telephone':
          aValue = getCurrentValue(a.telephones, 'telephone').toLowerCase();
          bValue = getCurrentValue(b.telephones, 'telephone').toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      client.nom?.toLowerCase().includes(searchLower) ||
      client.prenom?.toLowerCase().includes(searchLower) ||
      client.type_client?.toLowerCase().includes(searchLower) ||
      client.courriels?.some(c => c.courriel?.toLowerCase().includes(searchLower)) ||
      client.telephones?.some(t => t.telephone?.toLowerCase().includes(searchLower))
    );

    const matchesType = filterType.length === 0 || 
      filterType.includes(client.type_client) || 
      (!client.type_client && filterType.includes("Client"));

    return matchesSearch && matchesType;
  });

  const sortedClients = sortClients(filteredClients);

  const handleEdit = (client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDelete = (client) => {
    setClientToDelete(client);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      deleteClientMutation.mutate(clientToDelete.id);
      setShowDeleteConfirm(false);
      setClientToDelete(null);
    }
  };

  const handleExportCSV = () => {
    const csvData = sortedClients.map(client => ({
      'Prénom': client.prenom,
      'Nom': client.nom,
      'Type': client.type_client || 'Client',
      'Adresse actuelle': formatAdresse(client.adresses?.find(a => a.actuelle)) || '-',
      'Courriel actuel': getCurrentValue(client.courriels, 'courriel'),
      'Téléphone actuel': getCurrentValue(client.telephones, 'telephone'),
      'Notes': client.notes || '-'
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header];
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statsCards = [
    {
      title: "Total des clients",
      value: clients.length,
      icon: Users,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Ce mois",
      value: clients.filter(c => {
        const clientDate = new Date(c.created_date);
        const now = new Date();
        return clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Plus,
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Clients
              </h1>
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion de vos clients</p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              Extraction CSV
            </Button>
            <Button 
              onClick={() => {
                setEditingClient(null);
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
              <Plus className="w-5 h-5 mr-2" />
              Nouveau client
            </Button>

            <ClientFormDialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingClient(null);
              }}
              editingClient={editingClient}
              defaultType="Client"
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['clients'] });
                setEditingClient(null);
                setIsDialogOpen(false);
              }}
            />
          </div>
        </div>

        {/* Stats Cards - HIDDEN
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <Card key={index} className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    <CardTitle className="text-3xl font-bold mt-2 text-white">
                      {stat.value}
                    </CardTitle>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} opacity-20`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
        */}

        {/* Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-800">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <CardTitle className="text-xl font-bold text-white">Liste des clients</CardTitle>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial md:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-48 bg-slate-800/50 border-slate-700 text-white justify-between">
                        <span>Types ({filterType.length || 'Tous'})</span>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-white">
                      <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filterType.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) setFilterType([]);
                        }}
                      >
                        Tous
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      {["Client", "Notaire", "Courtier immobilier", "Compagnie"].map((type) => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={filterType.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterType([...filterType, type]);
                            } else {
                              setFilterType(filterType.filter((t) => t !== type));
                            }
                          }}
                        >
                          {type}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('nom')}
                    >
                      Nom complet {sortField === 'nom' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('type')}
                    >
                      Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('adresse')}
                    >
                      Adresse actuelle {sortField === 'adresse' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('courriel')}
                    >
                      Courriel actuel {sortField === 'courriel' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-slate-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('telephone')}
                    >
                      Téléphone actuel {sortField === 'telephone' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClients.map((client) => {
                    const adresseActuelle = client.adresses?.find(a => a.actuelle);

                    return (
                      <TableRow 
                        key={client.id} 
                        className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                        onClick={() => handleEdit(client)}
                      >
                        <TableCell className="font-medium text-white">
                          {client.prenom} {client.nom}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getTypeColor(client.type_client)} border`}>
                            {client.type_client || "Client"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 max-w-xs">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            <span className="truncate">
                              {adresseActuelle ? formatAdresse(adresseActuelle) : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-500" />
                            {getCurrentValue(client.courriels, 'courriel')}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" />
                            {getCurrentValue(client.telephones, 'telephone')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Client Details Dialog */}
        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">
                Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-6">
              {viewingClientDetails && (
                <ClientDetailView
                  client={viewingClientDetails}
                  onClose={() => setViewingClientDetails(null)}
                  onViewDossier={(dossier) => {
                    setViewingClientDetails(null);
                    setViewingDossier(dossier);
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Confirmation
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer {clientToDelete?.prenom} {clientToDelete?.nom} ?
              </p>
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setClientToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Annuler
                </Button>
                <Button 
                  type="button" 
                  onClick={confirmDelete}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dossier Details Dialog */}
        <Dialog open={!!viewingDossier} onOpenChange={(open) => !open && setViewingDossier(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Détails du dossier {getArpenteurInitials(viewingDossier?.arpenteur_geometre)}{viewingDossier?.numero_dossier}
              </DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Arpenteur-géomètre</Label>
                    <p className="text-white font-medium">{viewingDossier.arpenteur_geometre}</p>
                  </div>
                  <div>
                    <Label className="text-slate-400">Date d'ouverture</Label>
                    <p className="text-white font-medium">
                      {format(new Date(viewingDossier.date_ouverture), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>

                {viewingDossier.clients_ids && viewingDossier.clients_ids.length > 0 && (
                  <div>
                    <Label className="text-slate-400 mb-2 block">Clients</Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.clients_ids.map(id => {
                        const client = getClientById(id);
                        return client ? (
                          <Badge key={id} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border">
                            {client.prenom} {client.nom}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {viewingDossier.notaires_ids && viewingDossier.notaires_ids.length > 0 && (
                  <div>
                    <Label className="text-slate-400 mb-2 block">Notaires</Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.notaires_ids.map(id => {
                        const notaire = getClientById(id);
                        return notaire ? (
                          <Badge key={id} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border">
                            {notaire.prenom} {notaire.nom}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {viewingDossier.courtiers_ids && viewingDossier.courtiers_ids.length > 0 && (
                  <div>
                    <Label className="text-slate-400 mb-2 block">Courtiers immobiliers</Label>
                    <div className="flex flex-wrap gap-2">
                      {viewingDossier.courtiers_ids.map(id => {
                        const courtier = getClientById(id);
                        return courtier ? (
                          <Badge key={id} className="bg-orange-500/20 text-orange-400 border-orange-500/30 border">
                            {courtier.prenom} {courtier.nom}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {viewingDossier.mandats && viewingDossier.mandats.length > 0 && (
                  <div>
                    <Label className="text-slate-400 mb-2 block">Mandats</Label>
                    <div className="space-y-3">
                      {viewingDossier.mandats.map((mandat, idx) => (
                        <Card key={idx} className="border-slate-700 bg-slate-800/30">
                          <CardContent className="p-3">
                            <h5 className="font-semibold text-emerald-400 mb-2">{mandat.type_mandat}</h5>
                            {mandat.adresse_travaux && (
                              <p className="text-sm text-slate-300 mb-1">📍 {formatAdresse(mandat.adresse_travaux)}</p>
                            )}
                            {mandat.lots && mandat.lots.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {mandat.lots.map((lot, li) => (
                                  <Badge key={li} variant="outline" className="text-xs">{lot}</Badge>
                                ))}
                              </div>
                            )}
                            {mandat.date_signature && (
                              <p className="text-sm text-slate-400">Signature: {format(new Date(mandat.date_signature), "dd MMM yyyy", { locale: fr })}</p>
                            )}
                            {mandat.date_livraison && (
                              <p className="text-sm text-slate-400">Livraison: {format(new Date(mandat.date_livraison), "dd MMM yyyy", { locale: fr })}</p>
                            )}
                            {mandat.prix_estime > 0 && (
                              <p className="text-sm text-slate-300">Prix estimé: {mandat.prix_estime.toFixed(2)} $</p>
                            )}
                            {mandat.notes && (
                              <p className="text-sm text-slate-400 mt-1 italic">{mandat.notes}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {viewingDossier.description && (
                  <div>
                    <Label className="text-slate-400 mb-2 block">Description</Label>
                    <p className="text-slate-300">{viewingDossier.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}