import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Check, Edit, X, Save } from "lucide-react";
import CommentairesSectionClient from "./CommentairesSectionClient";

const PROVINCES_CANADIENNES = [
  "Québec", "Alberta", "Colombie-Britannique", "Île-du-Prince-Édouard",
  "Manitoba", "Nouveau-Brunswick", "Nouvelle-Écosse", "Nunavut",
  "Ontario", "Saskatchewan", "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest", "Yukon"
];

export default function ClientFormDialog({ 
  open, 
  onOpenChange, 
  editingClient = null, 
  defaultType = "Client",
  onSuccess 
}) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    type_client: defaultType,
    adresses: [],
    courriels: [],
    telephones: [],
    notes: ""
  });

  const [editingAdresseIndex, setEditingAdresseIndex] = useState(null);
  const [editingCourrielIndex, setEditingCourrielIndex] = useState(null);
  const [editingTelephoneIndex, setEditingTelephoneIndex] = useState(null);

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, clientData }) => base44.entities.Client.update(id, clientData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      adresses: formData.adresses.filter(a => 
        (a.numeros_civiques && a.numeros_civiques.some(n => n.trim() !== "")) ||
        (a.rue && a.rue.trim() !== "") ||
        (a.ville && a.ville.trim() !== "") ||
        (a.code_postal && a.code_postal.trim() !== "") ||
        (a.province && a.province.trim() !== "")
      ),
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
      type_client: defaultType,
      adresses: [],
      courriels: [],
      telephones: [],
      notes: ""
    });
    setEditingAdresseIndex(null);
    setEditingCourrielIndex(null);
    setEditingTelephoneIndex(null);
  };

  const removeClientField = (fieldName, index) => {
    if (formData[fieldName].length > 0) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    }
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

  const updateAdresseField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      adresses: prev.adresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const updateAdresseCivicNumber = (adresseIndex, civicIndex, value) => {
    setFormData(prev => ({
      ...prev,
      adresses: prev.adresses.map((addr, i) => {
        if (i === adresseIndex) {
          const newCivics = [...(addr.numeros_civiques || [""])];
          newCivics[civicIndex] = value;
          return { ...addr, numeros_civiques: newCivics };
        }
        return addr;
      })
    }));
  };

  const updateCourrielField = (index, value) => {
    setFormData(prev => ({
      ...prev,
      courriels: prev.courriels.map((c, i) => 
        i === index ? { ...c, courriel: value } : c
      )
    }));
  };

  const updateTelephoneField = (index, value) => {
    setFormData(prev => ({
      ...prev,
      telephones: prev.telephones.map((t, i) => 
        i === index ? { ...t, telephone: value } : t
      )
    }));
  };

  // Update form when editingClient changes or when dialog opens
  React.useEffect(() => {
    if (open && editingClient) {
      setFormData({
        prenom: editingClient.prenom || "",
        nom: editingClient.nom || "",
        type_client: editingClient.type_client || "Client",
        adresses: editingClient.adresses && editingClient.adresses.length > 0 
          ? editingClient.adresses.map(addr => ({ ...addr })) 
          : [],
        courriels: editingClient.courriels && editingClient.courriels.length > 0 
          ? editingClient.courriels.map(email => ({ ...email })) 
          : [],
        telephones: editingClient.telephones && editingClient.telephones.length > 0 
          ? editingClient.telephones.map(tel => ({ ...tel })) 
          : [],
        notes: editingClient.notes || ""
      });
    } else if (open && !editingClient) {
      setFormData({
        prenom: "",
        nom: "",
        type_client: defaultType,
        adresses: [],
        courriels: [],
        telephones: [],
        notes: ""
      });
    }
  }, [open, editingClient, defaultType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-2xl">
            {editingClient ? `Modifier ${editingClient.type_client}` : `Nouveau ${formData.type_client}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[90vh]">
          {/* Main form content - 70% */}
          <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingClient ? `Modifier ${editingClient.type_client}` : `Nouveau ${formData.type_client}`}
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
                      <Label>Numéro(s) civique(s)</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          id="new-civic-0"
                          placeholder="Ex: 123"
                          className="bg-slate-800 border-slate-700"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Rue</Label>
                      <Input
                        id="new-rue"
                        placeholder="Nom de la rue"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        id="new-ville"
                        placeholder="Ville"
                        className="bg-slate-800 border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Province</Label>
                      <Select id="new-province" defaultValue="Québec">
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue placeholder="Sélectionner une province" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {PROVINCES_CANADIENNES.map(prov => (
                            <SelectItem key={prov} value={prov} className="text-white">{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Code Postal</Label>
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
                      const civic = document.getElementById('new-civic-0')?.value || "";
                      const rue = document.getElementById('new-rue').value;
                      const ville = document.getElementById('new-ville').value;
                      const provinceSelect = document.querySelector('[id="new-province"]');
                      const province = provinceSelect?.textContent || "Québec";
                      const codePostal = document.getElementById('new-code-postal').value;
                      
                      if (civic || rue || ville) {
                        setFormData(prev => ({
                          ...prev,
                          adresses: [...prev.adresses, {
                            numeros_civiques: civic ? [civic] : [""],
                            rue,
                            ville,
                            province,
                            code_postal: codePostal,
                            actuelle: false
                          }]
                        }));
                        
                        // Clear inputs
                        if (document.getElementById('new-civic-0')) document.getElementById('new-civic-0').value = "";
                        document.getElementById('new-rue').value = "";
                        document.getElementById('new-ville').value = "";
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
                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.adresses.map((addr, index) => (
                          <React.Fragment key={index}>
                            {editingAdresseIndex === index ? (
                              <TableRow className="bg-slate-700/50 border-slate-800">
                                <TableCell colSpan={2}>
                                  <div className="space-y-3 py-2">
                                    <div className="grid grid-cols-[150px_1fr] gap-3">
                                      <div className="space-y-2">
                                        <Label className="text-xs">Numéro(s) civique(s)</Label>
                                        <Input
                                          value={addr.numeros_civiques?.[0] || ""}
                                          onChange={(e) => updateAdresseCivicNumber(index, 0, e.target.value)}
                                          placeholder="Ex: 123"
                                          className="bg-slate-800 border-slate-600 text-sm"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">Rue</Label>
                                        <Input
                                          value={addr.rue || ""}
                                          onChange={(e) => updateAdresseField(index, 'rue', e.target.value)}
                                          placeholder="Nom de la rue"
                                          className="bg-slate-800 border-slate-600 text-sm"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label className="text-xs">Ville</Label>
                                        <Input
                                          value={addr.ville || ""}
                                          onChange={(e) => updateAdresseField(index, 'ville', e.target.value)}
                                          placeholder="Ville"
                                          className="bg-slate-800 border-slate-600 text-sm"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label className="text-xs">Province</Label>
                                        <Select 
                                          value={addr.province || "Québec"} 
                                          onValueChange={(value) => updateAdresseField(index, 'province', value)}
                                        >
                                          <SelectTrigger className="bg-slate-800 border-slate-600 text-white text-sm">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-700">
                                            {PROVINCES_CANADIENNES.map(prov => (
                                              <SelectItem key={prov} value={prov} className="text-white">{prov}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Code Postal</Label>
                                      <Input
                                        value={addr.code_postal || ""}
                                        onChange={(e) => updateAdresseField(index, 'code_postal', e.target.value)}
                                        placeholder="Code postal"
                                        className="bg-slate-800 border-slate-600 text-sm"
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingAdresseIndex(null)}
                                        className="text-slate-400 hover:text-white"
                                      >
                                        <X className="w-3 h-3 mr-1" />
                                        Annuler
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setEditingAdresseIndex(null)}
                                        className="bg-emerald-500 hover:bg-emerald-600"
                                      >
                                        <Save className="w-3 h-3 mr-1" />
                                        Enregistrer
                                      </Button>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : (
                              <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white">
                                  {formatAdresse(addr) || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => setEditingAdresseIndex(index)}
                                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 w-7 p-0"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => toggleActuel('adresses', index)}
                                      className={`${addr.actuelle ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeClientField('adresses', index)}
                                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Courriels et Téléphones en deux colonnes */}
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
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.courriels.map((item, index) => (
                            <React.Fragment key={index}>
                              {editingCourrielIndex === index ? (
                                <TableRow className="bg-slate-700/50 border-slate-800">
                                  <TableCell colSpan={2}>
                                    <div className="space-y-2 py-2">
                                      <Input
                                        type="email"
                                        value={item.courriel}
                                        onChange={(e) => updateCourrielField(index, e.target.value)}
                                        placeholder="Courriel"
                                        className="bg-slate-800 border-slate-600 text-sm"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingCourrielIndex(null)}
                                          className="text-slate-400 hover:text-white h-7 text-xs"
                                        >
                                          <X className="w-3 h-3 mr-1" />
                                          Annuler
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => setEditingCourrielIndex(null)}
                                          className="bg-emerald-500 hover:bg-emerald-600 h-7 text-xs"
                                        >
                                          <Save className="w-3 h-3 mr-1" />
                                          Enregistrer
                                        </Button>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white text-sm">{item.courriel}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setEditingCourrielIndex(index)}
                                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 w-7 p-0"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => toggleActuel('courriels', index)}
                                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeClientField('courriels', index)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
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
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.telephones.map((item, index) => (
                            <React.Fragment key={index}>
                              {editingTelephoneIndex === index ? (
                                <TableRow className="bg-slate-700/50 border-slate-800">
                                  <TableCell colSpan={2}>
                                    <div className="space-y-2 py-2">
                                      <Input
                                        value={item.telephone}
                                        onChange={(e) => updateTelephoneField(index, e.target.value)}
                                        placeholder="Téléphone"
                                        className="bg-slate-800 border-slate-600 text-sm"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingTelephoneIndex(null)}
                                          className="text-slate-400 hover:text-white h-7 text-xs"
                                        >
                                          <X className="w-3 h-3 mr-1" />
                                          Annuler
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => setEditingTelephoneIndex(null)}
                                          className="bg-emerald-500 hover:bg-emerald-600 h-7 text-xs"
                                        >
                                          <Save className="w-3 h-3 mr-1" />
                                          Enregistrer
                                        </Button>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white text-sm">{item.telephone}</TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => setEditingTelephoneIndex(index)}
                                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 w-7 p-0"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => toggleActuel('telephones', index)}
                                        className={`${item.actuel ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'} hover:bg-green-500/30 h-7 w-7 p-0`}
                                      >
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeClientField('telephones', index)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-slate-800 border-slate-700 h-24"
                  placeholder="Notes supplémentaires..."
                />
              </div>
            </form>

            {/* Boutons Annuler/Créer tout en bas */}
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
            <div className="flex-1 overflow-y-auto p-4">
              <CommentairesSectionClient
                clientId={editingClient?.id}
                clientTemporaire={!editingClient}
                clientNom={editingClient ? `${editingClient.prenom} ${editingClient.nom}` : `${formData.prenom} ${formData.nom}`.trim() || "Nouveau client"}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}