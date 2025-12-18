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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, User, MapPin, Mail, Phone, ChevronDown, ChevronUp, Search, AlertTriangle, MessageSquare, Clock } from "lucide-react";
import { motion } from "framer-motion";
import CommentairesSectionClient from "./CommentairesSectionClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const PROVINCES_CANADIENNES = [
  "Québec", "Alberta", "Colombie-Britannique", "Île-du-Prince-Édouard",
  "Manitoba", "Nouveau-Brunswick", "Nouvelle-Écosse", "Nunavut",
  "Ontario", "Saskatchewan", "Terre-Neuve-et-Labrador",
  "Territoires du Nord-Ouest", "Yukon"
];

const MODES_LIVRAISON = ["Main propre", "Poste", "Courriel"];

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
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  
  // Sections collapse states
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [adressesCollapsed, setAdressesCollapsed] = useState(false);
  const [communicationCollapsed, setCommunicationCollapsed] = useState(false);
  
  // Duplicate check dialog
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateClients, setDuplicateClients] = useState([]);
  const [pendingClientData, setPendingClientData] = useState(null);
  
  // Unsaved changes detection
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  
  // Delete confirmation dialogs
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, type: null, index: null, item: null });
  
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

      // Créer une entrée d'historique pour la création
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || "",
        utilisateur_nom: user?.full_name || "Système",
        action: "Création de la fiche",
        entite: "Client",
        entite_id: newClient.id,
        details: `Fiche créée pour ${clientData.prenom} ${clientData.nom}`,
      });
      
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setHasChanges(false);
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, clientData, oldData }) => {
      const updatedClient = await base44.entities.Client.update(id, clientData);

      // Détecter les changements et créer des entrées d'historique
      const changes = [];
      
      if (oldData.prenom !== clientData.prenom || oldData.nom !== clientData.nom) {
        changes.push({
          action: "Modification du nom",
          details: `${oldData.prenom} ${oldData.nom} → ${clientData.prenom} ${clientData.nom}`
        });
      }
      
      if (oldData.type_client !== clientData.type_client) {
        changes.push({
          action: "Modification du type",
          details: `${oldData.type_client || 'Non défini'} → ${clientData.type_client}`
        });
      }

      if (JSON.stringify(oldData.preferences_livraison) !== JSON.stringify(clientData.preferences_livraison)) {
        changes.push({
          action: "Modification des préférences de livraison",
          details: `${oldData.preferences_livraison?.join(', ') || 'Aucune'} → ${clientData.preferences_livraison?.join(', ') || 'Aucune'}`
        });
      }

      if (oldData.notes !== clientData.notes) {
        changes.push({
          action: "Modification des notes",
          details: "Les notes ont été modifiées"
        });
      }

      // Détecter les changements d'adresses
      const oldAdresses = oldData.adresses || [];
      const newAdresses = clientData.adresses || [];
      
      // Adresses ajoutées
      newAdresses.forEach(newAddr => {
        const existsInOld = oldAdresses.some(oldAddr => 
          JSON.stringify(oldAddr) === JSON.stringify(newAddr)
        );
        if (!existsInOld) {
          const formattedAddr = formatAdresse(newAddr);
          changes.push({
            action: "Ajout d'une adresse",
            details: formattedAddr
          });
        }
      });

      // Adresses supprimées
      oldAdresses.forEach(oldAddr => {
        const existsInNew = newAdresses.some(newAddr => 
          JSON.stringify(newAddr) === JSON.stringify(oldAddr)
        );
        if (!existsInNew) {
          const formattedAddr = formatAdresse(oldAddr);
          changes.push({
            action: "Suppression d'une adresse",
            details: formattedAddr
          });
        }
      });

      // Détecter les changements de courriels
      const oldCourriels = oldData.courriels || [];
      const newCourriels = clientData.courriels || [];
      
      // Courriels ajoutés
      newCourriels.forEach(newCourriel => {
        const existsInOld = oldCourriels.some(oldCourriel => 
          oldCourriel.courriel === newCourriel.courriel
        );
        if (!existsInOld) {
          changes.push({
            action: "Ajout d'un courriel",
            details: newCourriel.courriel
          });
        }
      });

      // Courriels supprimés
      oldCourriels.forEach(oldCourriel => {
        const existsInNew = newCourriels.some(newCourriel => 
          newCourriel.courriel === oldCourriel.courriel
        );
        if (!existsInNew) {
          changes.push({
            action: "Suppression d'un courriel",
            details: oldCourriel.courriel
          });
        }
      });

      // Détecter les changements de téléphones
      const oldTelephones = oldData.telephones || [];
      const newTelephones = clientData.telephones || [];
      
      // Téléphones ajoutés
      newTelephones.forEach(newTel => {
        const existsInOld = oldTelephones.some(oldTel => 
          oldTel.telephone === newTel.telephone
        );
        if (!existsInOld) {
          changes.push({
            action: "Ajout d'un téléphone",
            details: `${newTel.telephone} (${newTel.type || 'Cellulaire'})`
          });
        }
      });

      // Téléphones supprimés
      oldTelephones.forEach(oldTel => {
        const existsInNew = newTelephones.some(newTel => 
          newTel.telephone === oldTel.telephone
        );
        if (!existsInNew) {
          changes.push({
            action: "Suppression d'un téléphone",
            details: `${oldTel.telephone} (${oldTel.type || 'Cellulaire'})`
          });
        }
      });

      // Créer les entrées d'historique
      for (const change of changes) {
        await base44.entities.ActionLog.create({
          utilisateur_email: user?.email || "",
          utilisateur_nom: user?.full_name || "Système",
          action: change.action,
          entite: "Client",
          entite_id: id,
          details: change.details,
        });
      }

      return updatedClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setHasChanges(false);
      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
  });

  // Détecter les changements
  React.useEffect(() => {
    if (initialFormData) {
      const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasChanges(hasFormChanges);
    }
  }, [formData, initialFormData]);

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

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: actionLogs = [] } = useQuery({
    queryKey: ['actionLogs', editingClient?.id],
    queryFn: async () => {
      if (!editingClient?.id) return [];
      const logs = await base44.entities.ActionLog.filter({ entite: "Client", entite_id: editingClient.id });
      return logs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!editingClient?.id,
    initialData: [],
  });

  const checkForDuplicates = (clientData) => {
    if (!clientData.nom || !clientData.prenom) return [];
    
    const nomLower = clientData.nom.toLowerCase().trim();
    const prenomLower = clientData.prenom.toLowerCase().trim();
    
    return allClients.filter(client => 
      client.nom.toLowerCase().trim() === nomLower &&
      client.prenom.toLowerCase().trim() === prenomLower &&
      client.type_client === clientData.type_client
    );
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
      updateClientMutation.mutate({ id: editingClient.id, clientData: cleanedData, oldData: editingClient });
    } else {
      // Check for duplicates before creating
      const duplicates = checkForDuplicates(cleanedData);
      if (duplicates.length > 0) {
        setDuplicateClients(duplicates);
        setPendingClientData(cleanedData);
        setShowDuplicateDialog(true);
      } else {
        createClientMutation.mutate(cleanedData);
      }
    }
  };

  const handleConfirmCreate = () => {
    if (pendingClientData) {
      createClientMutation.mutate(pendingClientData);
      setShowDuplicateDialog(false);
      setPendingClientData(null);
      setDuplicateClients([]);
    }
  };

  const handleCancelCreate = () => {
    setShowDuplicateDialog(false);
    setPendingClientData(null);
    setDuplicateClients([]);
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
    setHasChanges(false);
    setInitialFormData(null);
  };

  const handleCloseAttempt = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setHasChanges(false);
    resetForm();
    onOpenChange(false);
  };

  const handleDeleteRequest = (fieldName, index) => {
    const fieldLabels = {
      adresses: "cette adresse",
      courriels: "ce courriel",
      telephones: "ce téléphone"
    };
    
    const itemToDelete = formData[fieldName][index];
    setDeleteConfirmation({
      show: true,
      type: fieldName,
      index: index,
      item: itemToDelete,
      label: fieldLabels[fieldName]
    });
  };

  const confirmDelete = async () => {
    const { type: fieldName, index, item: itemToRemove } = deleteConfirmation;
    
    if (formData[fieldName].length > 0) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));

      // Créer une entrée d'historique immédiate si on modifie un client existant
      if (editingClient?.id) {
        let details = "";
        let action = "";
        
        if (fieldName === "adresses") {
          action = "Suppression d'une adresse";
          details = formatAdresse(itemToRemove);
        } else if (fieldName === "courriels") {
          action = "Suppression d'un courriel";
          details = itemToRemove.courriel;
        } else if (fieldName === "telephones") {
          action = "Suppression d'un téléphone";
          details = `${itemToRemove.telephone} (${itemToRemove.type || 'Cellulaire'})`;
        }

        await base44.entities.ActionLog.create({
          utilisateur_email: user?.email || "",
          utilisateur_nom: user?.full_name || "Système",
          action: action,
          entite: "Client",
          entite_id: editingClient.id,
          details: details,
        });

        queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      }
    }
    
    setDeleteConfirmation({ show: false, type: null, index: null, item: null });
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
      const data = {
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
      };
      setFormData(data);
      setInitialFormData(JSON.parse(JSON.stringify(data)));
      setCommentairesTemporaires([]);
      setHasChanges(false);
    } else if (open && !editingClient) {
      // Pré-remplir avec initialData si fourni
      const initial = initialData || {};
      const data = {
        prenom: initial.prenom || "",
        nom: initial.nom || "",
        type_client: defaultType,
        preferences_livraison: [],
        adresses: [],
        courriels: initial.courriel ? [{ courriel: initial.courriel, actuel: true }] : [],
        telephones: initial.telephone ? [{ telephone: initial.telephone, type: initial.type_telephone || "Cellulaire", actuel: true }] : [],
        notes: ""
      };
      setFormData(data);
      setInitialFormData(JSON.parse(JSON.stringify(data)));
      setCommentairesTemporaires([]);
      setHasChanges(false);
      
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
    <>
      {/* Duplicate Check Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-2xl shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Fiche similaire détectée
            </DialogTitle>
          </DialogHeader>
          
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-slate-300">
              Une ou plusieurs fiches avec le même nom existent déjà. Voulez-vous vraiment créer une nouvelle fiche ?
            </p>
            
            <div className="bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <Label className="text-slate-400 text-sm mb-2 block">Fiches existantes :</Label>
              <div className="space-y-2">
                {duplicateClients.map((client) => (
                  <div key={client.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {client.prenom} {client.nom}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Type: {client.type_client}</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Existant
                      </Badge>
                    </div>
                    {(client.courriels?.length > 0 || client.telephones?.length > 0) && (
                      <div className="mt-2 pt-2 border-t border-slate-700 text-xs space-y-1">
                        {client.courriels?.find(c => c.actuel)?.courriel && (
                          <p className="text-slate-400">
                            ✉️ {client.courriels.find(c => c.actuel).courriel}
                          </p>
                        )}
                        {client.telephones?.find(t => t.actuel)?.telephone && (
                          <p className="text-slate-400">
                            📞 {client.telephones.find(t => t.actuel).telephone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelCreate}
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                Annuler
              </Button>
              <Button 
                type="button" 
                onClick={handleConfirmCreate}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Créer quand même
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Main Client Form Dialog */}
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-2xl">
            {editingClient ? `Modifier ${editingClient.type_client}` : `Nouveau ${formData.type_client}`}
          </DialogTitle>
        </DialogHeader>

        <motion.div 
          className="flex h-[90vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
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
                                     onClick={() => handleDeleteRequest('adresses', index)}
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
                                       onClick={() => handleDeleteRequest('courriels', index)}
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
                                       onClick={() => handleDeleteRequest('telephones', index)}
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
              <Button type="button" variant="outline" onClick={handleCloseAttempt} className="border-red-500 text-red-400 hover:bg-red-500/10">
                Annuler
              </Button>
              <Button type="submit" form="client-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                {editingClient ? "Modifier" : "Créer"}
              </Button>
            </div>
          </div>

          {/* Right side - Commentaires et Historique Sidebar - 30% */}
          <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
            <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex-shrink-0">
                <TabsList className="grid grid-cols-2 h-9 w-full bg-transparent gap-2">
                  <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Commentaires
                  </TabsTrigger>
                  <TabsTrigger value="historique" className="orange text-xs bg-transparent border-none data-[state=active]:text-orange-400 data-[state=inactive]:text-slate-400 hover:text-orange-300">
                    <Clock className="w-4 h-4 mr-1" />
                    Historique
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 mt-0">
                <CommentairesSectionClient
                  clientId={editingClient?.id}
                  clientTemporaire={!editingClient}
                  commentairesTemp={commentairesTemporaires}
                  onCommentairesTempChange={setCommentairesTemporaires}
                />
              </TabsContent>

              <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 mt-0">
                {editingClient && actionLogs.length > 0 ? (
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
        </motion.div>
      </DialogContent>
    </Dialog>

    {/* Avertissement modifications non sauvegardées */}
    <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
      <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
        <DialogHeader>
          <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span>
            Attention
            <span className="text-2xl">⚠️</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-slate-300 text-center">
            Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button
              type="button"
              onClick={handleConfirmClose}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
            >
              Abandonner
            </Button>
            <Button 
              type="button" 
              onClick={() => setShowUnsavedWarning(false)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
            >
              Continuer l'édition
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Confirmation de suppression */}
    <Dialog open={deleteConfirmation.show} onOpenChange={(open) => !open && setDeleteConfirmation({ show: false, type: null, index: null, item: null })}>
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
            Êtes-vous sûr de vouloir supprimer {deleteConfirmation.label} ?
          </p>
          {deleteConfirmation.item && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
              <p className="text-white text-sm">
                {deleteConfirmation.type === 'adresses' && formatAdresse(deleteConfirmation.item)}
                {deleteConfirmation.type === 'courriels' && deleteConfirmation.item.courriel}
                {deleteConfirmation.type === 'telephones' && `${deleteConfirmation.item.telephone} (${deleteConfirmation.item.type || 'Cellulaire'})`}
              </p>
            </div>
          )}
          <div className="flex justify-center gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setDeleteConfirmation({ show: false, type: null, index: null, item: null })}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
            >
              Annuler
            </Button>
            <Button 
              type="button" 
              onClick={confirmDelete}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
            >
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
    );
    }