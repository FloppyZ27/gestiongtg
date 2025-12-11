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
import { Plus, Trash2, User, MapPin, Mail, Phone, ChevronDown, ChevronUp, Search } from "lucide-react";
import CommentairesSectionClient from "./CommentairesSectionClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROVINCES_CANADIENNES = [
  "Québec", "Alberta", "Colombie-Britannique", "Île-du-Prince-Édouard",
  "Manitoba", "Nouveau-Brunswick", "Nouvelle-Écosse", "Nunavut",
  "Ontario", "Saskatchewan", "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest", "Yukon"
];

const MODES_LIVRAISON = ["Main propre", "Poste", "Courriel"];

export default function ClientFormDialog({ 
  open, 
  onOpenChange, 
  editingClient = null, 
  defaultType = "Client",
  onSuccess,
  initialData = null
}) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    type_client: defaultType,
    preferences_livraison: [],
    adresses: [],
    courriels: [],
    telephones: [],
    notes: ""
  });

  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  
  // Sections collapse states
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [adressesCollapsed, setAdressesCollapsed] = useState(false);
  const [communicationCollapsed, setCommunicationCollapsed] = useState(false);
  
  // Address search
  const [addressSearchTerm, setAddressSearchTerm] = useState("");
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  
  // Telephone type state
  const [newTelephoneType, setNewTelephoneType] = useState("Cellulaire");

  const createClientMutation = useMutation({
    mutationFn: async (clientData) => {
      const newClient = await base44.entities.Client.create(clientData);
      
      // Créer les commentaires temporaires si présents
      if (commentairesTemporaires.length > 0) {
        const commentairePromises = commentairesTemporaires.map(comment =>
          base44.entities.CommentaireClient.create({
            client_id: newClient.id,
            contenu: comment.contenu,
            utilisateur_email: comment.utilisateur_email,
            utilisateur_nom: comment.utilisateur_nom
          })
        );
        await Promise.all(commentairePromises);
      }
      
      return newClient;
    },
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
      preferences_livraison: [],
      adresses: [],
      courriels: [],
      telephones: [],
      notes: ""
    });
    setCommentairesTemporaires([]);
  };

  const removeClientField = (fieldName, index) => {
    const fieldLabels = {
      adresses: "cette adresse",
      courriels: "ce courriel",
      telephones: "ce téléphone"
    };
    
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${fieldLabels[fieldName]} ?`)) {
      return;
    }
    
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

  const updateTelephoneField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      telephones: prev.telephones.map((t, i) => 
        i === index ? { ...t, [field]: value } : t
      )
    }));
  };
  
  // Address search with LLM
  const handleAddressSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setAddressSearchResults([]);
      return;
    }
    
    setIsSearchingAddress(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Trouve l'adresse complète pour: "${searchTerm}" au Québec, Canada. Retourne les informations d'adresse.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            addresses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  civic_number: { type: "string" },
                  street: { type: "string" },
                  city: { type: "string" },
                  province: { type: "string" },
                  postal_code: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setAddressSearchResults(response.addresses || []);
    } catch (error) {
      console.error("Error searching address:", error);
      setAddressSearchResults([]);
    } finally {
      setIsSearchingAddress(false);
    }
  };
  
  const selectSearchedAddress = (address) => {
    // Remplir les champs du formulaire au lieu d'ajouter automatiquement
    document.getElementById('new-civic-0').value = address.civic_number || "";
    document.getElementById('new-rue').value = address.street || "";
    document.getElementById('new-ville').value = address.city || "";
    document.getElementById('new-code-postal').value = address.postal_code || "";

    setAddressSearchTerm("");
    setAddressSearchResults([]);
  };

  const togglePreferenceLivraison = (mode) => {
    setFormData(prev => ({
      ...prev,
      preferences_livraison: prev.preferences_livraison.includes(mode)
        ? prev.preferences_livraison.filter(m => m !== mode)
        : [...prev.preferences_livraison, mode]
    }));
  };

  // Update form when editingClient changes or when dialog opens
  React.useEffect(() => {
    if (open && editingClient) {
      setFormData({
        prenom: editingClient.prenom || "",
        nom: editingClient.nom || "",
        type_client: editingClient.type_client || "Client",
        preferences_livraison: editingClient.preferences_livraison || [],
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
      setCommentairesTemporaires([]);
    } else if (open && !editingClient) {
      // Pré-remplir avec initialData si fourni
      const initial = initialData || {};
      setFormData({
        prenom: initial.prenom || "",
        nom: initial.nom || "",
        type_client: defaultType,
        preferences_livraison: [],
        adresses: [],
        courriels: initial.courriel ? [{ courriel: initial.courriel, actuel: true }] : [],
        telephones: initial.telephone ? [{ telephone: initial.telephone, type: initial.type_telephone || "Cellulaire", actuel: true }] : [],
        notes: ""
      });
      setCommentairesTemporaires([]);
      
      // Pré-remplir les champs du formulaire en bas pour l'adresse si besoin
      if (initial.courriel && !initial.courriel.trim()) {
        setTimeout(() => {
          const courrielInput = document.getElementById('new-courriel');
          if (courrielInput) courrielInput.value = "";
        }, 100);
      }
    }
  }, [open, editingClient, defaultType, initialData]);

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

            <form id="client-form" onSubmit={handleSubmit} className="space-y-3">
              {/* Section Informations Client */}
              <Card className="border-slate-700 bg-slate-800/30">
                <CardHeader 
                  className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-2 bg-blue-900/20"
                  onClick={() => setInfoCollapsed(!infoCollapsed)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <CardTitle className="text-blue-300 text-base">Informations client</CardTitle>
                    </div>
                    {infoCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                </CardHeader>

                {!infoCollapsed && (
                  <CardContent className="pt-1 pb-2">
                    <div className="grid grid-cols-[70%_30%] gap-3">
                      {/* 70% - Prénom et Nom */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="prenom" className="text-slate-400 text-xs">Prénom <span className="text-red-400">*</span></Label>
                          <Input
                            id="prenom"
                            value={formData.prenom}
                            onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                            required
                            className="bg-slate-700 border-slate-600 h-6 text-sm"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <Label htmlFor="nom" className="text-slate-400 text-xs">Nom <span className="text-red-400">*</span></Label>
                          <Input
                            id="nom"
                            value={formData.nom}
                            onChange={(e) => setFormData({...formData, nom: e.target.value})}
                            required
                            className="bg-slate-700 border-slate-600 h-6 text-sm"
                          />
                        </div>
                      </div>

                      {/* 30% - Type et Livraison */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="type_client" className="text-slate-400 text-xs">Type</Label>
                          <Select value={formData.type_client} onValueChange={(value) => setFormData({...formData, type_client: value})}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-sm">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="Client" className="text-white text-sm">Client</SelectItem>
                              <SelectItem value="Notaire" className="text-white text-sm">Notaire</SelectItem>
                              <SelectItem value="Courtier immobilier" className="text-white text-sm">Courtier</SelectItem>
                              <SelectItem value="Compagnie" className="text-white text-sm">Compagnie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-0.5">
                          <Label className="text-slate-400 text-xs">Livraison</Label>
                          <div className="flex gap-1">
                            {MODES_LIVRAISON.map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => togglePreferenceLivraison(mode)}
                                className={`px-1.5 py-0.5 rounded text-xs border transition-all ${
                                  formData.preferences_livraison.includes(mode)
                                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                    : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700/50'
                                }`}
                              >
                                {mode === "Main propre" ? "Main" : mode === "Poste" ? "Poste" : "Email"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Sections Adresses et Communication côte-à-côte */}
              <div className="grid grid-cols-2 gap-3">
                {/* Section Adresses */}
                <Card className="border-slate-700 bg-slate-800/30">
                  <CardHeader 
                    className="cursor-pointer hover:bg-purple-900/40 transition-colors rounded-t-lg py-2 bg-purple-900/20"
                    onClick={() => setAdressesCollapsed(!adressesCollapsed)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <CardTitle className="text-purple-300 text-base">Adresses</CardTitle>
                      </div>
                      {adressesCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                    </div>
                  </CardHeader>

                {!adressesCollapsed && (
                  <CardContent className="pt-3 pb-2 space-y-3">
                    {/* Barre de recherche d'adresse avec LLM */}
                    <div className="space-y-2">
                      <Label className="text-xs">Rechercher une adresse</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 w-3 h-3" />
                        <Input
                          placeholder="Ex: 123 rue Principale, Alma..."
                          value={addressSearchTerm}
                          onChange={(e) => {
                            setAddressSearchTerm(e.target.value);
                            if (e.target.value.length > 3) {
                              handleAddressSearch(e.target.value);
                            } else {
                              setAddressSearchResults([]);
                            }
                          }}
                          className="pl-7 bg-slate-700 border-slate-600 h-8 text-sm"
                        />
                      </div>
                      
                      {/* Résultats de recherche */}
                      {addressSearchResults.length > 0 && (
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
                          {addressSearchResults.map((addr, idx) => (
                            <div
                              key={idx}
                              onClick={() => selectSearchedAddress(addr)}
                              className="px-2 py-1.5 rounded text-xs bg-slate-700/50 hover:bg-slate-700 cursor-pointer text-slate-300"
                            >
                              {addr.civic_number} {addr.street}, {addr.city}, {addr.province} {addr.postal_code}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {isSearchingAddress && (
                        <p className="text-xs text-slate-500">Recherche en cours...</p>
                      )}
                    </div>

                    {/* Formulaire pour nouvelle adresse */}
                    <div className="p-2 bg-slate-800/30 rounded-lg space-y-2">
                  <div className="grid grid-cols-[150px_1fr] gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Numéro(s) civique(s)</Label>
                      <Input
                        id="new-civic-0"
                        placeholder="Ex: 123"
                        className="bg-slate-700 border-slate-600 h-7 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rue</Label>
                      <Input
                        id="new-rue"
                        placeholder="Nom de la rue"
                        className="bg-slate-700 border-slate-600 h-7 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Ville</Label>
                      <Input
                        id="new-ville"
                        placeholder="Ville"
                        className="bg-slate-700 border-slate-600 h-7 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Province</Label>
                      <Select id="new-province" defaultValue="Québec">
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-sm">
                          <SelectValue placeholder="Sélectionner une province" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {PROVINCES_CANADIENNES.map(prov => (
                            <SelectItem key={prov} value={prov} className="text-white text-sm">{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Code Postal</Label>
                    <Input
                      id="new-code-postal"
                      placeholder="Code postal"
                      className="bg-slate-700 border-slate-600 h-7 text-sm"
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
                          adresses: [
                            {
                              numeros_civiques: civic ? [civic] : [""],
                              rue,
                              ville,
                              province,
                              code_postal: codePostal,
                              actuelle: true
                            },
                            ...prev.adresses.map(a => ({ ...a, actuelle: false }))
                          ]
                        }));
                        
                        // Clear inputs
                        if (document.getElementById('new-civic-0')) document.getElementById('new-civic-0').value = "";
                        document.getElementById('new-rue').value = "";
                        document.getElementById('new-ville').value = "";
                        document.getElementById('new-code-postal').value = "";
                      }
                    }}
                    className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 h-7 text-xs"
                    >
                    <Plus className="w-3 h-3 mr-1" />
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
                          <TableHead className="text-slate-300">Statut</TableHead>
                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.adresses.map((addr, index) => (
                          <React.Fragment key={index}>
                            <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                <TableCell className="text-white">
                                  {formatAdresse(addr) || "-"}
                                </TableCell>
                                <TableCell>
                                  <Select 
                                    value={addr.actuelle ? "Actuel" : "Ancien"} 
                                    onValueChange={(value) => toggleActuel('adresses', index)}
                                  >
                                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                      <SelectItem value="Actuel" className="text-white text-xs">Actuel</SelectItem>
                                      <SelectItem value="Ancien" className="text-white text-xs">Ancien</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
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
                                      </React.Fragment>
                                      ))}
                                      </TableBody>
                                      </Table>
                                      </div>
                                      )}
                                      </CardContent>
                                      )}
                                      </Card>

                  {/* Section Communication */}
                  <Card className="border-slate-700 bg-slate-800/30">
                <CardHeader 
                  className="cursor-pointer hover:bg-orange-900/40 transition-colors rounded-t-lg py-2 bg-orange-900/20"
                  onClick={() => setCommunicationCollapsed(!communicationCollapsed)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-500/30 flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                      <CardTitle className="text-orange-300 text-base">Communication</CardTitle>
                    </div>
                    {communicationCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                  </div>
                </CardHeader>

                {!communicationCollapsed && (
                  <CardContent className="pt-3 pb-2">
                    <div className="space-y-4">
                      {/* Courriels */}
                      <div className="space-y-2">
                        <Label className="text-xs">Courriels</Label>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            id="new-courriel"
                            placeholder="Courriel"
                            className="bg-slate-700 border-slate-600 h-7 text-sm"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const courriel = document.getElementById('new-courriel').value;
                              if (courriel.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  courriels: [
                                    { courriel, actuel: true },
                                    ...prev.courriels.map(c => ({ ...c, actuel: false }))
                                  ]
                                }));
                                document.getElementById('new-courriel').value = "";
                              }
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 h-7 w-7 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {formData.courriels.length > 0 && (
                          <div className="border border-slate-700 rounded-lg overflow-hidden">
                            <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">Courriel</TableHead>
                            <TableHead className="text-slate-300">Statut</TableHead>
                            <TableHead className="text-slate-300 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.courriels.map((item, index) => (
                            <React.Fragment key={index}>
                              <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                  <TableCell className="text-white text-sm">{item.courriel}</TableCell>
                                  <TableCell>
                                    <Select 
                                      value={item.actuel ? "Actuel" : "Ancien"} 
                                      onValueChange={(value) => toggleActuel('courriels', index)}
                                    >
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs w-24">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="Actuel" className="text-white text-xs">Actuel</SelectItem>
                                        <SelectItem value="Ancien" className="text-white text-xs">Ancien</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
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
                            </React.Fragment>
                          ))}
                          </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>

                      {/* Téléphones */}
                      <div className="space-y-2">
                        <Label className="text-xs">Téléphones</Label>
                        <div className="flex gap-2">
                          <Input
                            id="new-telephone"
                            placeholder="Téléphone"
                            className="bg-slate-700 border-slate-600 h-7 text-sm flex-1"
                          />
                          <Select 
                            value={newTelephoneType}
                            onValueChange={setNewTelephoneType}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="Cellulaire" className="text-white text-xs">Cell.</SelectItem>
                              <SelectItem value="Maison" className="text-white text-xs">Maison</SelectItem>
                              <SelectItem value="Travail" className="text-white text-xs">Travail</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const telephone = document.getElementById('new-telephone').value;
                              if (telephone.trim()) {
                                setFormData(prev => ({
                                  ...prev,
                                  telephones: [
                                    { telephone, type: newTelephoneType, actuel: true },
                                    ...prev.telephones.map(t => ({ ...t, actuel: false }))
                                  ]
                                }));
                                document.getElementById('new-telephone').value = "";
                                setNewTelephoneType("Cellulaire");
                              }
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 h-7 w-7 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {formData.telephones.length > 0 && (
                          <div className="border border-slate-700 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                  <TableHead className="text-slate-300">Téléphone</TableHead>
                                  <TableHead className="text-slate-300">Type</TableHead>
                                  <TableHead className="text-slate-300">Statut</TableHead>
                                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {formData.telephones.map((item, index) => (
                                  <React.Fragment key={index}>
                                    <TableRow className="hover:bg-slate-800/30 border-slate-800">
                                        <TableCell className="text-white text-sm">{item.telephone}</TableCell>
                                        <TableCell className="text-slate-400 text-xs">{item.type || "Cellulaire"}</TableCell>
                                        <TableCell>
                                          <Select 
                                            value={item.actuel ? "Actuel" : "Ancien"} 
                                            onValueChange={(value) => toggleActuel('telephones', index)}
                                          >
                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs w-24">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700">
                                              <SelectItem value="Actuel" className="text-white text-xs">Actuel</SelectItem>
                                              <SelectItem value="Ancien" className="text-white text-xs">Ancien</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
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
                                      </React.Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
              </Card>
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
            <div className="flex-1 overflow-hidden p-4">
              <CommentairesSectionClient
                clientId={editingClient?.id}
                clientTemporaire={!editingClient}
                commentairesTemp={commentairesTemporaires}
                onCommentairesTempChange={setCommentairesTemporaires}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}