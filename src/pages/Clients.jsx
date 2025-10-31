
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, X, Check, FolderOpen, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  const [viewingClientDossiers, setViewingClientDossiers] = useState(null);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    type_client: "Client",
    adresses: [{ adresse: "", latitude: null, longitude: null, actuelle: true }],
    courriels: [{ courriel: "", actuel: true }],
    telephones: [{ telephone: "", actuel: true }],
    notes: ""
  });

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

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, clientData }) => base44.entities.Client.update(id, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.nom?.toLowerCase().includes(searchLower) ||
      client.prenom?.toLowerCase().includes(searchLower) ||
      client.type_client?.toLowerCase().includes(searchLower) ||
      client.courriels?.some(c => c.courriel?.toLowerCase().includes(searchLower)) ||
      client.telephones?.some(t => t.telephone?.toLowerCase().includes(searchLower))
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty entries
    const cleanedData = {
      ...formData,
      adresses: formData.adresses.filter(a => a.adresse.trim() !== ""),
      courriels: formData.courriels.filter(c => c.courriel.trim() !== ""),
      telephones: formData.telephones.filter(t => t.telephone.trim() !== "")
    };
    
    if (editingClient) {
      updateClientMutation.mutate({ id: editingClient.id, clientData: cleanedData });
    } else {
      createClientMutation.mutate(cleanedData);
    }
  };

  const resetForm = () => {
    setFormData({
      prenom: "",
      nom: "",
      type_client: "Client",
      adresses: [{ adresse: "", latitude: null, longitude: null, actuelle: true }],
      courriels: [{ courriel: "", actuel: true }],
      telephones: [{ telephone: "", actuel: true }],
      notes: ""
    });
    setEditingClient(null);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      prenom: client.prenom || "",
      nom: client.nom || "",
      type_client: client.type_client || "Client",
      adresses: client.adresses && client.adresses.length > 0 ? client.adresses : [{ adresse: "", latitude: null, longitude: null, actuelle: true }],
      courriels: client.courriels && client.courriels.length > 0 ? client.courriels : [{ courriel: "", actuel: true }],
      telephones: client.telephones && client.telephones.length > 0 ? client.telephones : [{ telephone: "", actuel: true }],
      notes: client.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      deleteClientMutation.mutate(id);
    }
  };

  const addField = (fieldName) => {
    if (fieldName === 'adresses') {
      setFormData(prev => ({
        ...prev,
        adresses: [...prev.adresses, { adresse: "", latitude: null, longitude: null, actuelle: false }]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], { [fieldName.slice(0, -1)]: "", actuel: false }]
      }));
    }
  };

  const removeField = (fieldName, index) => {
    if (formData[fieldName].length > 1) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    }
  };

  const updateField = (fieldName, index, key, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => 
        i === index ? { ...item, [key]: value } : item
      )
    }));
  };

  const toggleActuel = (fieldName, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => ({
        ...item,
        [fieldName === 'adresses' ? 'actuelle' : 'actuel']: i === index
      }))
    }));
  };

  // Fonction pour géocoder l'adresse (simulation - nécessiterait une vraie API Google Maps)
  const handleAddressChange = async (index, value) => {
    updateField('adresses', index, 'adresse', value);
    
    // Note: Pour une vraie intégration Google Maps, vous auriez besoin d'ajouter
    // l'API Google Maps Places et Geocoding. Ceci est une structure de base.
    // Les coordonnées seraient obtenues via l'API Geocoding de Google.
    
    // Pour l'instant, on laisse latitude et longitude null
    // Exemple de ce qui pourrait être fait avec l'API:
    // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(value)}&key=YOUR_API_KEY`);
    // const data = await response.json();
    // if (data.results[0]) {
    //   updateField('adresses', index, 'latitude', data.results[0].geometry.location.lat);
    //   updateField('adresses', index, 'longitude', data.results[0].geometry.location.lng);
    // }
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

  const getClientDossiers = (clientId, type = 'clients') => {
    const field = `${type}_ids`;
    return dossiers
      .filter(d => d[field]?.includes(clientId))
      .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture));
  };

  const getClientById = (id) => clients.find(c => c.id === id);

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
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                <Plus className="w-5 h-5 mr-2" />
                Nouveau client
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingClient ? "Modifier le client" : "Nouveau client"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom <span className="text-red-400">*</span></Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      required
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom <span className="text-red-400">*</span></Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      required
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type_client">Type de client</Label>
                  <Select value={formData.type_client} onValueChange={(value) => setFormData({...formData, type_client: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Client" className="text-white">Client</SelectItem>
                      <SelectItem value="Notaire" className="text-white">Notaire</SelectItem>
                      <SelectItem value="Courtier immobilier" className="text-white">Courtier immobilier</SelectItem>
                      <SelectItem value="Compagnie" className="text-white">Compagnie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Adresses */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Adresses</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addField('adresses')}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {formData.adresses.map((item, index) => (
                    <div key={index} className="space-y-2 p-3 bg-slate-800/30 rounded-lg">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            value={item.adresse}
                            onChange={(e) => handleAddressChange(index, e.target.value)}
                            placeholder="Entrez une adresse complète"
                            className="bg-slate-800 border-slate-700"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Format recommandé: Numéro, Rue, Ville, Province, Code postal
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => toggleActuel('adresses', index)}
                          className={`${item.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
                          title={item.actuelle ? "Actuelle" : "Marquer comme actuelle"}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        {formData.adresses.length > 1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeField('adresses', index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Courriels */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Courriels</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addField('courriels')}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {formData.courriels.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          type="email"
                          value={item.courriel}
                          onChange={(e) => updateField('courriels', index, 'courriel', e.target.value)}
                          placeholder="Courriel"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => toggleActuel('courriels', index)}
                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
                        title={item.actuel ? "Actuel" : "Marquer comme actuel"}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      {formData.courriels.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeField('courriels', index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Téléphones */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Téléphones</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addField('telephones')}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {formData.telephones.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={item.telephone}
                          onChange={(e) => updateField('telephones', index, 'telephone', e.target.value)}
                          placeholder="Téléphone"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => toggleActuel('telephones', index)}
                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30`}
                        title={item.actuel ? "Actuel" : "Marquer comme actuel"}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      {formData.telephones.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeField('telephones', index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="bg-slate-800 border-slate-700 h-24"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    {editingClient ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
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

        {/* Table */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <CardTitle className="text-xl font-bold text-white">Liste des clients</CardTitle>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300">Nom complet</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Courriel actuel</TableHead>
                    <TableHead className="text-slate-300">Téléphone actuel</TableHead>
                    <TableHead className="text-slate-300">Dossiers</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const clientDossiers = getClientDossiers(
                      client.id, 
                      client.type_client === 'Notaire' ? 'notaires' : 
                      client.type_client === 'Courtier immobilier' ? 'courtiers' : 'clients'
                    );
                    
                    return (
                      <TableRow key={client.id} className="hover:bg-slate-800/30 border-slate-800">
                        <TableCell className="font-medium text-white">
                          {client.prenom} {client.nom}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${getTypeColor(client.type_client)} border`}>
                            {client.type_client || "Client"}
                          </Badge>
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
                        <TableCell>
                          {clientDossiers.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingClientDossiers(client)}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2"
                            >
                              <FolderOpen className="w-4 h-4" />
                              {clientDossiers.length} dossier{clientDossiers.length > 1 ? 's' : ''}
                            </Button>
                          ) : (
                            <span className="text-slate-600 text-sm">Aucun dossier</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(client)}
                              className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(client.id)}
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

        {/* Client Dossiers Dialog */}
        <Dialog open={!!viewingClientDossiers} onOpenChange={(open) => !open && setViewingClientDossiers(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Dossiers de {viewingClientDossiers?.prenom} {viewingClientDossiers?.nom}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {viewingClientDossiers && getClientDossiers(
                viewingClientDossiers.id,
                viewingClientDossiers.type_client === 'Notaire' ? 'notaires' :
                viewingClientDossiers.type_client === 'Courtier immobilier' ? 'courtiers' : 'clients'
              ).map((dossier) => (
                <Card key={dossier.id} className="border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-lg mb-2">
                          {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-slate-400">
                            Arpenteur: <span className="text-white">{dossier.arpenteur_geometre}</span>
                          </p>
                          <p className="text-slate-400">
                            Date d'ouverture: <span className="text-white">
                              {format(new Date(dossier.date_ouverture), "dd MMMM yyyy", { locale: fr })}
                            </span>
                          </p>
                          {dossier.mandats && dossier.mandats.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dossier.mandats.map((mandat, idx) => (
                                <Badge key={idx} className="bg-emerald-500/20 text-emerald-400">
                                  {mandat.type_mandat}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setViewingDossier(dossier)}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                  {viewingDossier.date_livraison && (
                    <div>
                      <Label className="text-slate-400">Date de livraison</Label>
                      <p className="text-white font-medium">
                        {format(new Date(viewingDossier.date_livraison), "dd MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  )}
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
                              <p className="text-sm text-slate-300 mb-1">📍 {mandat.adresse_travaux}</p>
                            )}
                            {mandat.lots && mandat.lots.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {mandat.lots.map((lot, li) => (
                                  <Badge key={li} variant="outline" className="text-xs">{lot}</Badge>
                                ))}
                              </div>
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
