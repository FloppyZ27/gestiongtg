import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Users, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    adresses: [{ adresse: "", actuelle: true }],
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
      adresses: [{ adresse: "", actuelle: true }],
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
      adresses: client.adresses && client.adresses.length > 0 ? client.adresses : [{ adresse: "", actuelle: true }],
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
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], { [fieldName.slice(0, -1)]: "", actuel: false }]
    }));
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

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "-";
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
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          value={item.adresse}
                          onChange={(e) => updateField('adresses', index, 'adresse', e.target.value)}
                          placeholder="Adresse"
                          className="bg-slate-800 border-slate-700"
                        />
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
                    <TableHead className="text-slate-300">Courriel actuel</TableHead>
                    <TableHead className="text-slate-300">Téléphone actuel</TableHead>
                    <TableHead className="text-slate-300">Adresse actuelle</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell className="font-medium text-white">
                        {client.prenom} {client.nom}
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
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-500" />
                          {getCurrentValue(client.adresses, 'adresse')}
                        </div>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}