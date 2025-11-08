
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
import { format } from "date-fns"; // Corrected import statement
import { fr } from "date-fns/locale";
import ClientDetailView from "../components/clients/ClientDetailView";
import AddressInput from "../components/shared/AddressInput";
import CommentairesSectionClient from "../components/clients/CommentairesSectionClient"; // Added import for the new component

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
  // Replaced viewingClientDossiers with viewingClientDetails
  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    type_client: "Client",
    adresses: [{
      ville: "",
      numeros_civiques: [""],
      rue: "",
      code_postal: "",
      province: "Québec", // Default to Quebec
      actuelle: true
    }],
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
      adresses: formData.adresses.filter(a =>
        (a.numeros_civiques && a.numeros_civiques.some(n => n && n.trim() !== "")) || // Ensure n is not null/undefined
        a.rue.trim() !== "" ||
        a.ville.trim() !== "" ||
        a.code_postal.trim() !== "" ||
        a.province.trim() !== ""
      ),
      courriels: formData.courriels.filter(c => c.courriel && c.courriel.trim() !== ""), // Ensure c.courriel is not null/undefined
      telephones: formData.telephones.filter(t => t.telephone && t.telephone.trim() !== "") // Ensure t.telephone is not null/undefined
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
      adresses: [{
        ville: "",
        numeros_civiques: [""],
        rue: "",
        code_postal: "",
        province: "Québec",
        actuelle: true
      }],
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
      adresses: client.adresses && client.adresses.length > 0 ?
        client.adresses.map(addr => ({
          ville: addr.ville || "",
          numeros_civiques: addr.numeros_civiques && addr.numeros_civiques.length > 0 ? addr.numeros_civiques : [""],
          rue: addr.rue || "",
          code_postal: addr.code_postal || "",
          province: addr.province || "Québec",
          actuelle: addr.actuelle
        })) : [{
          ville: "",
          numeros_civiques: [""],
          rue: "",
          code_postal: "",
          province: "Québec",
          actuelle: true
        }],
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

  // Simplified removeField: now allows removing the last item, as new UI expects this
  const removeField = (fieldName, index) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index)
    }));
  };
  
  // The following functions (addField, updateField, updateAddress, updateCivicNumber, addCivicNumber, removeCivicNumber)
  // are no longer needed for direct interaction in the form, as the UI has changed to use explicit "add" inputs and table displays.
  // The logic for adding new items is now integrated directly into the "Ajouter cette adresse", "Ajouter" (courriel), and "Ajouter" (téléphone) buttons.
  // The handleEdit function correctly populates the formData for existing clients, and the tables will display this.
  // Direct inline editing of individual properties in the list is no longer supported by the new UI.
  // So, these functions are removed.

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
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
              <DialogHeader className="sr-only">
                <DialogTitle className="text-2xl">
                  {editingClient ? "Modifier le client" : "Nouveau client"}
                </DialogTitle>
              </DialogHeader>

              <div className="flex h-[90vh]">
                {/* Main form content - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {editingClient ? "Modifier le client" : "Nouveau client"}
                    </h2>
                  </div>

                  <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Prénom, Nom et Type sur la même ligne */}
                    <div className="grid grid-cols-3 gap-4">
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
                    </div>

                    {/* Adresses */}
                    <div className="space-y-3">
                      <Label>Adresses</Label>
                      
                      {/* Formulaire pour nouvelle adresse */}
                      <div className="p-3 bg-slate-800/30 rounded-lg space-y-3">
                        <div className="grid grid-cols-[200px_1fr] gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="new-civic">Numéro(s) civique(s)</Label>
                            <Input
                              id="new-civic"
                              placeholder="Ex: 123"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-rue">Rue</Label>
                            <Input
                              id="new-rue"
                              placeholder="Nom de la rue"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="new-ville">Ville</Label>
                            <Input
                              id="new-ville"
                              placeholder="Ville"
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-province">Province</Label>
                            {/* To get value from document.getElementById, we add an ID to SelectTrigger */}
                            <Select defaultValue="Québec">
                              <SelectTrigger id="new-province-trigger" className="bg-slate-800 border-slate-700 text-white">
                                <SelectValue placeholder="Sélectionner une province" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="Québec" className="text-white">Québec</SelectItem>
                                <SelectItem value="Alberta" className="text-white">Alberta</SelectItem>
                                <SelectItem value="Colombie-Britannique" className="text-white">Colombie-Britannique</SelectItem>
                                <SelectItem value="Île-du-Prince-Édouard" className="text-white">Île-du-Prince-Édouard</SelectItem>
                                <SelectItem value="Manitoba" className="text-white">Manitoba</SelectItem>
                                <SelectItem value="Nouveau-Brunswick" className="text-white">Nouveau-Brunswick</SelectItem>
                                <SelectItem value="Nouvelle-Écosse" className="text-white">Nouvelle-Écosse</SelectItem>
                                <SelectItem value="Nunavut" className="text-white">Nunavut</SelectItem>
                                <SelectItem value="Ontario" className="text-white">Ontario</SelectItem>
                                <SelectItem value="Saskatchewan" className="text-white">Saskatchewan</SelectItem>
                                <SelectItem value="Terre-Neuve-et-Labrador" className="text-white">Terre-Neuve-et-Labrador</SelectItem>
                                <SelectItem value="Territoires du Nord-Ouest" className="text-white">Territoires du Nord-Ouest</SelectItem>
                                <SelectItem value="Yukon" className="text-white">Yukon</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-code-postal">Code Postal</Label>
                          <Input
                            id="new-code-postal"
                            placeholder="Code postal"
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const civic = document.getElementById('new-civic').value;
                            const rue = document.getElementById('new-rue').value;
                            const ville = document.getElementById('new-ville').value;
                            // Retrieve the selected value from the SelectTrigger's data-value attribute
                            const provinceTrigger = document.getElementById('new-province-trigger');
                            const province = provinceTrigger ? provinceTrigger.dataset.value : "Québec";
                            const codePostal = document.getElementById('new-code-postal').value;
                            
                            if (civic.trim() || rue.trim() || ville.trim() || codePostal.trim()) {
                              setFormData(prev => ({
                                ...prev,
                                adresses: [...prev.adresses, {
                                  numeros_civiques: civic ? civic.split(',').map(s => s.trim()).filter(Boolean) : [""],
                                  rue,
                                  ville,
                                  province,
                                  code_postal: codePostal,
                                  actuelle: false
                                }]
                              }));
                                
                              // Clear inputs
                              document.getElementById('new-civic').value = "";
                              document.getElementById('new-rue').value = "";
                              document.getElementById('new-ville').value = "";
                              // Reset Select component using a temporary state or external reset logic if needed,
                              // but for this direct DOM manipulation approach, it's harder.
                              // For simplicity, we just clear other inputs.
                              document.getElementById('new-code-postal').value = "";
                            }
                          }}
                          className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Ajouter cette adresse
                        </Button>
                      </div>

                      {/* Liste des adresses */}
                      {formData.adresses.length > 0 && (
                        <div className="border border-slate-700 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                <TableHead className="text-slate-300">Adresse complète</TableHead>
                                <TableHead className="text-slate-300 text-center">Actuelle</TableHead>
                                <TableHead className="text-slate-300 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {formData.adresses.map((addr, index) => (
                                <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white text-sm">
                                    {formatAdresse(addr) || "-"}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => toggleActuel('adresses', index)}
                                      className={`${addr.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeField('adresses', index)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>

                    {/* Courriels et Téléphones en deux colonnes - JUSTE AVANT LES BOUTONS */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Courriels */}
                      <div className="space-y-3">
                        <Label>Courriels</Label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            id="new-courriel"
                            placeholder="Courriel"
                            className="bg-slate-800 border-slate-700"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const courriel = document.getElementById('new-courriel').value;
                              if (courriel.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  courriels: [...prev.courriels, { courriel, actuel: false }]
                                }));
                                document.getElementById('new-courriel').value = "";
                              }
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {formData.courriels.length > 0 && (
                          <div className="border border-slate-700 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                  <TableHead className="text-slate-300">Courriel</TableHead>
                                  <TableHead className="text-slate-300 text-center">Actuel</TableHead>
                                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {formData.courriels.map((item, index) => (
                                  <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                    <TableCell className="text-white text-sm">{item.courriel}</TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => toggleActuel('courriels', index)}
                                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeField('courriels', index)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {/* Téléphones */}
                      <div className="space-y-3">
                        <Label>Téléphones</Label>
                        <div className="flex gap-2">
                          <Input
                            id="new-telephone"
                            placeholder="Téléphone"
                            className="bg-slate-800 border-slate-700"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const telephone = document.getElementById('new-telephone').value;
                              if (telephone.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  telephones: [...prev.telephones, { telephone, actuel: false }]
                                }));
                                document.getElementById('new-telephone').value = "";
                              }
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {formData.telephones.length > 0 && (
                          <div className="border border-slate-700 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                  <TableHead className="text-slate-300">Téléphone</TableHead>
                                  <TableHead className="text-slate-300 text-center">Actuel</TableHead>
                                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {formData.telephones.map((item, index) => (
                                  <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                                    <TableCell className="text-white text-sm">{item.telephone}</TableCell>
                                    <TableCell className="text-center">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => toggleActuel('telephones', index)}
                                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeField('telephones', index)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>

                  {/* Boutons Annuler/Créer tout en bas */}
                  <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" form="client-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                      {editingClient ? "Modifier" : "Créer"}
                    </Button>
                  </div>
                </div>

                {/* Right side - Commentaires Sidebar - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <CommentairesSectionClient
                      clientId={editingClient?.id}
                      clientTemporaire={!editingClient}
                    />
                  </div>
                </div>
              </div>
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
                    <TableHead className="text-slate-300">Adresse actuelle</TableHead>
                    <TableHead className="text-slate-300">Courriel actuel</TableHead>
                    <TableHead className="text-slate-300">Téléphone actuel</TableHead>
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const adresseActuelle = client.adresses?.find(a => a.actuelle);

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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              // Changed from setViewingClientDossiers to setViewingClientDetails
                              onClick={() => setViewingClientDetails(client)}
                              className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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
                    // The line setIsViewDialogOpen(true); was explicitly removed here as 'viewingDossier' state directly controls the dialog open state.
                    // Adding setIsViewDialogOpen(true) would require defining and managing an unnecessary state variable.
                  }}
                />
              )}
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
