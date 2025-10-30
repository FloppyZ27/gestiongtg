import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, Users, User, Briefcase, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const MANDATS = ["Certificat de localisation", "Implantation", "Piquetage", "OCTR", "Projet de lotissement"];

export default function Dossiers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_livraison: "",
    statut: "en_cours",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    titre: "",
    description: ""
  });

  const queryClient = useQueryClient();

  const { data: dossiers, isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const createDossierMutation = useMutation({
    mutationFn: (dossierData) => base44.entities.Dossier.create(dossierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, dossierData }) => base44.entities.Dossier.update(id, dossierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteDossierMutation = useMutation({
    mutationFn: (id) => base44.entities.Dossier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  const clientsReguliers = clients.filter(c => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter(c => c.type_client === 'Notaire');
  const courtiers = clients.filter(c => c.type_client === 'Courtier immobilier');

  const getClientById = (id) => clients.find(c => c.id === id);

  const filteredDossiers = dossiers.filter(dossier => {
    const searchLower = searchTerm.toLowerCase();
    return (
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      dossier.titre?.toLowerCase().includes(searchLower) ||
      dossier.arpenteur_geometre?.toLowerCase().includes(searchLower)
    );
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingDossier) {
      updateDossierMutation.mutate({ id: editingDossier.id, dossierData: formData });
    } else {
      createDossierMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      numero_dossier: "",
      arpenteur_geometre: "",
      date_ouverture: new Date().toISOString().split('T')[0],
      date_livraison: "",
      statut: "en_cours",
      clients_ids: [],
      notaires_ids: [],
      courtiers_ids: [],
      mandats: [],
      titre: "",
      description: ""
    });
    setEditingDossier(null);
  };

  const handleEdit = (dossier) => {
    setEditingDossier(dossier);
    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      date_livraison: dossier.date_livraison || "",
      statut: dossier.statut || "en_cours",
      clients_ids: dossier.clients_ids || [],
      notaires_ids: dossier.notaires_ids || [],
      courtiers_ids: dossier.courtiers_ids || [],
      mandats: dossier.mandats || [],
      titre: dossier.titre || "",
      description: dossier.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
      deleteDossierMutation.mutate(id);
    }
  };

  const toggleMandat = (mandat) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.includes(mandat)
        ? prev.mandats.filter(m => m !== mandat)
        : [...prev.mandats, mandat]
    }));
  };

  const toggleClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(clientId)
        ? prev[field].filter(id => id !== clientId)
        : [...prev[field], clientId]
    }));
  };

  const getStatusColor = (statut) => {
    const colors = {
      'en_cours': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'en_attente': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'terminé': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'archivé': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return colors[statut] || colors['en_cours'];
  };

  const statsCards = [
    {
      title: "Total des dossiers",
      value: dossiers.length,
      icon: FolderOpen,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "En cours",
      value: dossiers.filter(d => d.statut === 'en_cours').length,
      icon: Briefcase,
      gradient: "from-cyan-500 to-blue-600",
    },
    {
      title: "Terminés",
      value: dossiers.filter(d => d.statut === 'terminé').length,
      icon: Calendar,
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Dossiers
              </h1>
              <FolderOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-slate-400">Gestion de vos dossiers d'arpentage</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
                <Plus className="w-5 h-5 mr-2" />
                Nouveau dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {editingDossier ? "Modifier le dossier" : "Nouveau dossier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>N° de dossier <span className="text-red-400">*</span></Label>
                    <Input
                      value={formData.numero_dossier}
                      onChange={(e) => setFormData({...formData, numero_dossier: e.target.value})}
                      required
                      placeholder="Ex: 2024-001"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                    <Select value={formData.arpenteur_geometre} onValueChange={(value) => setFormData({...formData, arpenteur_geometre: value})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {ARPENTEURS.map((arpenteur) => (
                          <SelectItem key={arpenteur} value={arpenteur} className="text-white">
                            {arpenteur}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date d'ouverture <span className="text-red-400">*</span></Label>
                    <Input
                      type="date"
                      value={formData.date_ouverture}
                      onChange={(e) => setFormData({...formData, date_ouverture: e.target.value})}
                      required
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de livraison</Label>
                    <Input
                      type="date"
                      value={formData.date_livraison}
                      onChange={(e) => setFormData({...formData, date_livraison: e.target.value})}
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titre</Label>
                    <Input
                      value={formData.titre}
                      onChange={(e) => setFormData({...formData, titre: e.target.value})}
                      placeholder="Titre du dossier"
                      className="bg-slate-800 border-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value})}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="en_cours" className="text-white">En cours</SelectItem>
                        <SelectItem value="en_attente" className="text-white">En attente</SelectItem>
                        <SelectItem value="terminé" className="text-white">Terminé</SelectItem>
                        <SelectItem value="archivé" className="text-white">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mandats</Label>
                  <div className="flex flex-wrap gap-2">
                    {MANDATS.map((mandat) => (
                      <Badge
                        key={mandat}
                        onClick={() => toggleMandat(mandat)}
                        className={`cursor-pointer ${
                          formData.mandats.includes(mandat)
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 border-slate-600'
                        } border hover:scale-105 transition-transform`}
                      >
                        {mandat}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Clients associés</Label>
                  <div className="max-h-40 overflow-y-auto bg-slate-800/30 rounded-lg p-3 space-y-2">
                    {clientsReguliers.map((client) => (
                      <div key={client.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.clients_ids.includes(client.id)}
                          onChange={() => toggleClient(client.id, 'clients')}
                          className="rounded bg-slate-700 border-slate-600"
                        />
                        <span className="text-white text-sm">{client.prenom} {client.nom}</span>
                      </div>
                    ))}
                    {clientsReguliers.length === 0 && (
                      <p className="text-slate-500 text-sm">Aucun client disponible</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notaires associés</Label>
                  <div className="max-h-40 overflow-y-auto bg-slate-800/30 rounded-lg p-3 space-y-2">
                    {notaires.map((notaire) => (
                      <div key={notaire.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.notaires_ids.includes(notaire.id)}
                          onChange={() => toggleClient(notaire.id, 'notaires')}
                          className="rounded bg-slate-700 border-slate-600"
                        />
                        <span className="text-white text-sm">{notaire.prenom} {notaire.nom}</span>
                      </div>
                    ))}
                    {notaires.length === 0 && (
                      <p className="text-slate-500 text-sm">Aucun notaire disponible</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Courtiers immobiliers associés</Label>
                  <div className="max-h-40 overflow-y-auto bg-slate-800/30 rounded-lg p-3 space-y-2">
                    {courtiers.map((courtier) => (
                      <div key={courtier.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.courtiers_ids.includes(courtier.id)}
                          onChange={() => toggleClient(courtier.id, 'courtiers')}
                          className="rounded bg-slate-700 border-slate-600"
                        />
                        <span className="text-white text-sm">{courtier.prenom} {courtier.nom}</span>
                      </div>
                    ))}
                    {courtiers.length === 0 && (
                      <p className="text-slate-500 text-sm">Aucun courtier disponible</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-slate-800 border-slate-700 h-24"
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                    {editingDossier ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-xl font-bold text-white">Liste des dossiers</CardTitle>
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
                    <TableHead className="text-slate-300">N° Dossier</TableHead>
                    <TableHead className="text-slate-300">Titre</TableHead>
                    <TableHead className="text-slate-300">Arpenteur</TableHead>
                    <TableHead className="text-slate-300">Date ouverture</TableHead>
                    <TableHead className="text-slate-300">Mandats</TableHead>
                    <TableHead className="text-slate-300">Statut</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDossiers.map((dossier) => (
                    <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800">
                      <TableCell className="font-medium text-white">
                        {dossier.numero_dossier}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {dossier.titre || "-"}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          {dossier.arpenteur_geometre}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "dd MMM yyyy", { locale: fr }) : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {dossier.mandats?.slice(0, 2).map((mandat, idx) => (
                            <Badge key={idx} variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                              {mandat}
                            </Badge>
                          ))}
                          {dossier.mandats?.length > 2 && (
                            <Badge variant="outline" className="bg-slate-700/30 text-slate-400 text-xs">
                              +{dossier.mandats.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(dossier.statut)} border`}>
                          {dossier.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(dossier)}
                            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(dossier.id)}
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