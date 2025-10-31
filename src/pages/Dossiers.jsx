import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, FolderOpen, Calendar, User, X, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Certificat de localisation", "Implantation", "Piquetage", "OCTR", "Projet de lotissement"];

export default function Dossiers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isNotaireSelectorOpen, setIsNotaireSelectorOpen] = useState(false);
  const [isCourtierSelectorOpen, setIsCourtierSelectorOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_livraison: "",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
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
      dossier.arpenteur_geometre?.toLowerCase().includes(searchLower)
    );
  });

  const filteredClientsForSelector = clientsReguliers.filter(c => 
    `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredNotairesForSelector = notaires.filter(n => 
    `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase())
  );

  const filteredCourtiersForSelector = courtiers.filter(c => 
    `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase())
  );

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
      clients_ids: [],
      notaires_ids: [],
      courtiers_ids: [],
      mandats: [],
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
      clients_ids: dossier.clients_ids || [],
      notaires_ids: dossier.notaires_ids || [],
      courtiers_ids: dossier.courtiers_ids || [],
      mandats: dossier.mandats || [],
      description: dossier.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
      deleteDossierMutation.mutate(id);
    }
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

  const removeClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(id => id !== clientId)
    }));
  };

  const addMandat = () => {
    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        adresse_travaux: "",
        lots: [],
        prix_estime: 0,
        notes: ""
      }]
    }));
  };

  const updateMandat = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMandat = (index) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.filter((_, i) => i !== index)
    }));
  };

  const addLotToMandat = (mandatIndex, lot) => {
    if (lot.trim()) {
      setFormData(prev => ({
        ...prev,
        mandats: prev.mandats.map((m, i) => 
          i === mandatIndex ? { ...m, lots: [...(m.lots || []), lot.trim()] } : m
        )
      }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotIndex) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => 
        i === mandatIndex ? { ...m, lots: m.lots.filter((_, li) => li !== lotIndex) } : m
      )
    }));
  };

  const statsCards = [
    {
      title: "Total des dossiers",
      value: dossiers.length,
      icon: FolderOpen,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      title: "Ce mois",
      value: dossiers.filter(d => {
        const dossierDate = new Date(d.created_date);
        const now = new Date();
        return dossierDate.getMonth() === now.getMonth() && dossierDate.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
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
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
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

                {/* Clients */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Clients associés</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsClientSelectorOpen(true)}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.clients_ids.map(clientId => {
                      const client = getClientById(clientId);
                      return client ? (
                        <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border flex items-center gap-2">
                          {client.prenom} {client.nom}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeClient(clientId, 'clients')} />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Notaires */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Notaires associés</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsNotaireSelectorOpen(true)}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.notaires_ids.map(notaireId => {
                      const notaire = getClientById(notaireId);
                      return notaire ? (
                        <Badge key={notaireId} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border flex items-center gap-2">
                          {notaire.prenom} {notaire.nom}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeClient(notaireId, 'notaires')} />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Courtiers */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Courtiers immobiliers associés</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setIsCourtierSelectorOpen(true)}
                      className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.courtiers_ids.map(courtierId => {
                      const courtier = getClientById(courtierId);
                      return courtier ? (
                        <Badge key={courtierId} className="bg-orange-500/20 text-orange-400 border-orange-500/30 border flex items-center gap-2">
                          {courtier.prenom} {courtier.nom}
                          <X className="w-3 h-3 cursor-pointer" onClick={() => removeClient(courtierId, 'courtiers')} />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Mandats */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Mandats</Label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addMandat}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter un mandat
                    </Button>
                  </div>
                  {formData.mandats.map((mandat, index) => (
                    <Card key={index} className="border-slate-700 bg-slate-800/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-emerald-400">Mandat {index + 1}</h4>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeMandat(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Label>Type de mandat <span className="text-red-400">*</span></Label>
                          <Select 
                            value={mandat.type_mandat} 
                            onValueChange={(value) => updateMandat(index, 'type_mandat', value)}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              {TYPES_MANDATS.map((type) => (
                                <SelectItem key={type} value={type} className="text-white">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Adresse des travaux</Label>
                          <Input
                            value={mandat.adresse_travaux}
                            onChange={(e) => updateMandat(index, 'adresse_travaux', e.target.value)}
                            placeholder="Adresse complète"
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Lots</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Ex: 1234-5678"
                              className="bg-slate-700 border-slate-600"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addLotToMandat(index, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                const input = e.target.closest('.space-y-2').querySelector('input');
                                addLotToMandat(index, input.value);
                                input.value = '';
                              }}
                              className="bg-emerald-500/20 text-emerald-400"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {mandat.lots?.map((lot, lotIndex) => (
                              <Badge key={lotIndex} className="bg-slate-700 text-white flex items-center gap-2">
                                {lot}
                                <X className="w-3 h-3 cursor-pointer" onClick={() => removeLotFromMandat(index, lotIndex)} />
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Prix estimé ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={mandat.prix_estime}
                            onChange={(e) => updateMandat(index, 'prix_estime', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="bg-slate-700 border-slate-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={mandat.notes}
                            onChange={(e) => updateMandat(index, 'notes', e.target.value)}
                            className="bg-slate-700 border-slate-600 h-20"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Description générale</Label>
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

        {/* Client Selector Dialog */}
        <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sélectionner des clients</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un client..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredClientsForSelector.map((client) => (
                  <div
                    key={client.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.clients_ids.includes(client.id)
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`}
                    onClick={() => toggleClient(client.id, 'clients')}
                  >
                    <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                    {client.courriels?.find(c => c.actuel)?.courriel && (
                      <p className="text-sm text-slate-400">{client.courriels.find(c => c.actuel).courriel}</p>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => setIsClientSelectorOpen(false)} className="w-full bg-emerald-500">
                Valider
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notaire Selector Dialog */}
        <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sélectionner des notaires</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un notaire..."
                  value={notaireSearchTerm}
                  onChange={(e) => setNotaireSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredNotairesForSelector.map((notaire) => (
                  <div
                    key={notaire.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.notaires_ids.includes(notaire.id)
                        ? 'bg-purple-500/20 border border-purple-500/30'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`}
                    onClick={() => toggleClient(notaire.id, 'notaires')}
                  >
                    <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                    {notaire.courriels?.find(c => c.actuel)?.courriel && (
                      <p className="text-sm text-slate-400">{notaire.courriels.find(c => c.actuel).courriel}</p>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => setIsNotaireSelectorOpen(false)} className="w-full bg-purple-500">
                Valider
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Courtier Selector Dialog */}
        <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sélectionner des courtiers</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un courtier..."
                  value={courtierSearchTerm}
                  onChange={(e) => setCourtierSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredCourtiersForSelector.map((courtier) => (
                  <div
                    key={courtier.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.courtiers_ids.includes(courtier.id)
                        ? 'bg-orange-500/20 border border-orange-500/30'
                        : 'bg-slate-800/50 hover:bg-slate-800'
                    }`}
                    onClick={() => toggleClient(courtier.id, 'courtiers')}
                  >
                    <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                    {courtier.courriels?.find(c => c.actuel)?.courriel && (
                      <p className="text-sm text-slate-400">{courtier.courriels.find(c => c.actuel).courriel}</p>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => setIsCourtierSelectorOpen(false)} className="w-full bg-orange-500">
                Valider
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                    <TableHead className="text-slate-300">Arpenteur</TableHead>
                    <TableHead className="text-slate-300">Date ouverture</TableHead>
                    <TableHead className="text-slate-300">Mandats</TableHead>
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
                              {mandat.type_mandat}
                            </Badge>
                          ))}
                          {dossier.mandats?.length > 2 && (
                            <Badge variant="outline" className="bg-slate-700/30 text-slate-400 text-xs">
                              +{dossier.mandats.length - 2}
                            </Badge>
                          )}
                        </div>
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