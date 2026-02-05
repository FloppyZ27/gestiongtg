import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2, UserPlus, Search, FileText, Check, ChevronDown, ChevronUp, Edit, Package, FolderOpen, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CommentairesSection from "./CommentairesSection";
import AddressInput from "../shared/AddressInput";
import ClientFormDialog from "../clients/ClientFormDialog";
import ClientDetailView from "../clients/ClientDetailView";
import MandatTabs from "./MandatTabs";
import EditDossierForm from "./EditDossierForm";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": ["Québec", "Canton de Caron", "Canton de de l'Île", "Canton de Garnier", "Village d'Héberville", "Canton d'Hébertville-Station", "Canton de Labarre", "Canton de Mésy", "Canton de Métabetchouan", "Canton de Signay", "Canton de Taillon"],
  "Lac-Saint-Jean-Ouest": ["Québec", "Canton d'Albanel", "Canton de Charlevoix", "Canton de Dablon", "Canton de Dalmas", "Canton de Demeules", "Canton de Dequen", "Canton de Dolbeau", "Canton de Girard", "Canton de Jogues", "Canton de Malherbe", "Canton de Métabetchouan", "Canton de Milot", "Canton de Normandin", "Canton de Ouiatchouan", "Canton de Racine", "Canton de Roberval", "Canton de Saint-Hilaire"],
  "Chicoutimi": ["Québec", "Cité d'Arvida", "Canton de Bagot", "Village de Bagotville", "Canton de Bégin", "Canton de Boileau", "Canton de Bourget", "Canton de Chicoutimi", "Paroisse de Chicoutimi", "Ville de Chicoutimi", "Canton de Dumas", "Canton de Durocher", "Canton de Falardau", "Canton de Ferland", "Ville de Grande-Baie", "Canton de Harvey", "Canton de Hébert", "Canton de Jonquière", "Canton de Kénogami", "Canton de Labrecque", "Canton de Laterrière", "Canton d'Otis", "Canton de Périgny", "Canton de Rouleau", "Canton de Simard", "Paroisse de Saint-Alexis", "Paroisse de Saint-Alphonse", "Ville de Sainte-Anne-de-Chicoutimi", "Canton de Saint-Germains", "Canton de Saint-Jean", "Canton de Taché", "Canton de Tremblay"]
};

export default function EditDossierDialog({ isOpen, onClose, dossier, onSuccess, clients, users }) {
  const queryClient = useQueryClient();
  const [activeTabMandat, setActiveTabMandat] = useState("0");
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isNotaireSelectorOpen, setIsNotaireSelectorOpen] = useState(false);
  const [isCourtierSelectorOpen, setIsCourtierSelectorOpen] = useState(false);
  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [clientTypeForForm, setClientTypeForForm] = useState('Client');
  const [editingClientForForm, setEditingClientForForm] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");
  const [isLotSelectorOpen, setIsLotSelectorOpen] = useState(false);
  const [currentMandatIndex, setCurrentMandatIndex] = useState(null);
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const [lotCirconscriptionFilter, setLotCirconscriptionFilter] = useState("all");
  const [lotCadastreFilter, setLotCadastreFilter] = useState("Québec");
  const [isAddMinuteDialogOpen, setIsAddMinuteDialogOpen] = useState(false);
  const [currentMinuteMandatIndex, setCurrentMinuteMandatIndex] = useState(null);
  const [newMinuteForm, setNewMinuteForm] = useState({
    minute: "",
    date_minute: "",
    type_minute: "Initiale"
  });
  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [creationProgress, setCreationProgress] = useState({
    step: '',
    details: '',
    isComplete: false,
    error: null
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
  });

  const { data: allDossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const clientsReguliers = clients?.filter((c) => c.type_client === 'Client' || !c.type_client) || [];
  const notaires = clients?.filter((c) => c.type_client === 'Notaire') || [];
  const courtiers = clients?.filter((c) => c.type_client === 'Courtier immobilier') || [];

  const [formData, setFormData] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: new Date().toISOString().split('T')[0],
    date_fermeture: "",
    statut: "Ouvert",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    description: ""
  });

  useEffect(() => {
    if (dossier) {
      const data = {
        numero_dossier: dossier.numero_dossier || "",
        arpenteur_geometre: dossier.arpenteur_geometre || "",
        date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
        date_fermeture: dossier.date_fermeture || "",
        statut: dossier.statut || "Ouvert",
        clients_ids: dossier.clients_ids || [],
        notaires_ids: dossier.notaires_ids || [],
        courtiers_ids: dossier.courtiers_ids || [],
        mandats: dossier.mandats?.map((m) => ({
          ...m,
          date_ouverture: m.date_ouverture || "",
          minute: m.minute || "",
          date_minute: m.date_minute || "",
          type_minute: m.type_minute || "Initiale",
          minutes_list: m.minutes_list || [],
          tache_actuelle: m.tache_actuelle || "",
          utilisateur_assigne: m.utilisateur_assigne || "",
          statut_terrain: m.statut_terrain || "",
          date_terrain: m.date_terrain || "",
          equipe_assignee: m.equipe_assignee || "",
          adresse_travaux: m.adresse_travaux ? typeof m.adresse_travaux === 'string' ? { rue: m.adresse_travaux, numeros_civiques: [], ville: "", code_postal: "", province: "" } : m.adresse_travaux : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
          lots: m.lots || [],
          prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
          rabais: m.rabais !== undefined ? m.rabais : 0,
          taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
          date_livraison: m.date_livraison || "",
          date_signature: m.date_signature || "",
          date_debut_travaux: m.date_debut_travaux || "",
          terrains_list: m.terrains_list || [],
          terrain: m.terrain || {
            date_limite_leve: "",
            instruments_requis: "",
            a_rendez_vous: false,
            date_rendez_vous: "",
            heure_rendez_vous: "",
            donneur: "",
            technicien: "",
            dossier_simultane: "",
            temps_prevu: "",
            notes: ""
          },
          factures: m.factures || [],
          notes: m.notes || ""
        })) || [],
        description: dossier.description || ""
      };
      setFormData(data);
      setInitialFormData(JSON.parse(JSON.stringify(data)));
      setActiveTabMandat((dossier.initialMandatIndex || 0).toString());
      setHasChanges(false);
    }
  }, [dossier, dossier?.id, JSON.stringify(dossier?.mandats)]);

  // Auto-sauvegarde avec debounce
  const saveTimeoutRef = React.useRef(null);
  
  useEffect(() => {
    if (dossier && initialFormData) {
      const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasChanges(hasFormChanges);
      
      // Auto-save après 300ms sans changement
      if (hasFormChanges) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        saveTimeoutRef.current = setTimeout(() => {
          autoSaveMutation.mutate({ id: dossier.id, dossierData: formData });
          setInitialFormData(JSON.parse(JSON.stringify(formData)));
          setHasChanges(false);
        }, 300);
      }
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, dossier, initialFormData]);

  const autoSaveMutation = useMutation({
    mutationFn: async ({ id, dossierData }) => {
      const allDossiersCurrentState = queryClient.getQueryData(['dossiers']) || [];
      const oldDossier = allDossiersCurrentState.find(d => d.id === id);
      const updatedDossier = await base44.entities.Dossier.update(id, dossierData);
      
      const currentUser = await base44.auth.me();
      
      if (oldDossier && dossierData.mandats) {
        for (let i = 0; i < dossierData.mandats.length; i++) {
          const newMandat = dossierData.mandats[i];
          const oldMandat = oldDossier.mandats?.[i];
          
          if (newMandat.utilisateur_assigne && 
              newMandat.utilisateur_assigne !== oldMandat?.utilisateur_assigne &&
              newMandat.tache_actuelle) {
            const clientsNames = dossierData.clients_ids?.map(cid => {
              const client = clients.find(c => c.id === cid);
              return client ? `${client.prenom} ${client.nom}` : "";
            }).filter(n => n).join(", ");
            
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
            
            const numeroDossierDisplay = `${getArpenteurInitials(dossierData.arpenteur_geometre)}${dossierData.numero_dossier}`;
            
            await base44.entities.Notification.create({
              utilisateur_email: newMandat.utilisateur_assigne,
              titre: "Nouvelle tâche assignée",
              message: `${currentUser?.full_name || 'Un utilisateur'} vous a assigné la tâche "${newMandat.tache_actuelle}"${numeroDossierDisplay ? ` pour le dossier ${numeroDossierDisplay}` : ''}${clientsNames ? ` - ${clientsNames}` : ''}.`,
              type: "dossier",
              dossier_id: id,
              lue: false
            });
          }
        }
      }
      
      return updatedDossier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleCloseAttempt = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    setHasChanges(false);
    onClose();
  };

  const getClientById = (id) => clients?.find((c) => c.id === id);
  const getLotById = (numeroLot) => lots.find((l) => l.id === numeroLot);

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

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const sortClientsWithSelected = (clientsList, selectedIds) => {
    return [...clientsList].sort((a, b) => {
      const aSelected = selectedIds.includes(a.id);
      const bSelected = selectedIds.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      const aName = `${a.prenom} ${a.nom}`.toLowerCase();
      const bName = `${b.prenom} ${b.nom}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  const filteredClientsForSelector = sortClientsWithSelected(
    clientsReguliers.filter((c) =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.courriels?.some((courriel) => courriel.courriel?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
      c.telephones?.some((tel) => tel.telephone?.toLowerCase().includes(clientSearchTerm.toLowerCase())) ||
      c.adresses?.some((addr) => formatAdresse(addr).toLowerCase().includes(clientSearchTerm.toLowerCase()))
    ),
    formData.clients_ids
  );

  const filteredNotairesForSelector = sortClientsWithSelected(
    notaires.filter((n) =>
      `${n.prenom} ${n.nom}`.toLowerCase().includes(notaireSearchTerm.toLowerCase()) ||
      n.courriels?.some((courriel) => courriel.courriel?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
      n.telephones?.some((tel) => tel.telephone?.toLowerCase().includes(notaireSearchTerm.toLowerCase())) ||
      n.adresses?.some((addr) => formatAdresse(addr).toLowerCase().includes(notaireSearchTerm.toLowerCase()))
    ),
    formData.notaires_ids
  );

  const filteredCourtiersForSelector = sortClientsWithSelected(
    courtiers.filter((c) =>
      `${c.prenom} ${c.nom}`.toLowerCase().includes(courtierSearchTerm.toLowerCase()) ||
      c.courriels?.some((courriel) => courriel.courriel?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
      c.telephones?.some((tel) => tel.telephone?.toLowerCase().includes(courtierSearchTerm.toLowerCase())) ||
      c.adresses?.some((addr) => formatAdresse(addr).toLowerCase().includes(courtierSearchTerm.toLowerCase()))
    ),
    formData.courtiers_ids
  );

  const sortLotsWithSelected = (lotsList, selectedLots) => {
    return [...lotsList].sort((a, b) => {
      const aSelected = selectedLots?.includes(a.id);
      const bSelected = selectedLots?.includes(b.id);
      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return (a.numero_lot || "").localeCompare(b.numero_lot || "");
    });
  };

  const filteredLotsForSelector = sortLotsWithSelected(
    lots.filter((lot) => {
      const matchesSearch = lot.numero_lot?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || lot.rang?.toLowerCase().includes(lotSearchTerm.toLowerCase()) || lot.circonscription_fonciere?.toLowerCase().includes(lotSearchTerm.toLowerCase());
      const matchesCirconscription = lotCirconscriptionFilter === "all" || lot.circonscription_fonciere === lotCirconscriptionFilter;
      const matchesCadastre = lotCadastreFilter === "all" || lot.cadastre === lotCadastreFilter;
      return matchesSearch && matchesCirconscription && matchesCadastre;
    }),
    currentMandatIndex !== null ? formData.mandats[currentMandatIndex]?.lots : []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // En mode édition, les modifications sont déjà sauvegardées automatiquement
    if (dossier) {
      onClose();
      return;
    }
  };

  const toggleClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(clientId) ? prev[field].filter((id) => id !== clientId) : [...prev[field], clientId]
    }));
  };

  const removeClient = (clientId, type) => {
    const field = `${type}_ids`;
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((id) => id !== clientId)
    }));
  };

  const addMandat = () => {
    const newIndex = formData.mandats.length;
    const firstMandat = formData.mandats[0];
    const defaultAdresse = firstMandat?.adresse_travaux ? JSON.parse(JSON.stringify(firstMandat.adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" };
    const defaultLots = firstMandat?.lots ? [...firstMandat.lots] : [];

    setFormData((prev) => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "",
        date_ouverture: "",
        minute: "",
        date_minute: "",
        type_minute: "Initiale",
        minutes_list: [],
        tache_actuelle: "",
        utilisateur_assigne: "",
        statut_terrain: "",
        date_terrain: "",
        equipe_assignee: "",
        adresse_travaux: defaultAdresse,
        lots: defaultLots,
        prix_estime: 0,
        rabais: 0,
        taxes_incluses: false,
        date_livraison: "",
        date_signature: "",
        date_debut_travaux: "",
        terrain: {
          date_limite_leve: "",
          instruments_requis: "",
          a_rendez_vous: false,
          date_rendez_vous: "",
          heure_rendez_vous: "",
          donneur: "",
          technicien: "",
          dossier_simultane: "",
          temps_prevu: "",
          notes: ""
        },
        factures: [],
        notes: ""
      }]
    }));
    setActiveTabMandat(newIndex.toString());
  };

  const getMandatTabLabel = (mandat, index) => mandat.type_mandat || `Mandat ${index + 1}`;

  const updateMandatAddress = (mandatIndex, newAddresses) => {
    setFormData((prev) => ({
      ...prev,
      mandats: prev.mandats.map((m, i) =>
        i === mandatIndex ? { ...m, adresse_travaux: newAddresses[0] || { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" } } : m
      )
    }));
  };

  const updateMandat = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => {
        if (i === index) {
          const updatedMandat = { ...m, [field]: value };
          if (field === 'tache_actuelle') {
            if (value === "Cédule") {
              updatedMandat.statut_terrain = "en_verification";
            } else {
              updatedMandat.statut_terrain = "";
            }
          }
          if (field === 'terrain') {
            return { ...m, terrain: { ...m.terrain, ...value } };
          }
          if (field === 'date_livraison' && value) {
            const dateLivraison = new Date(value);
            const dateLimiteLeve = new Date(dateLivraison);
            dateLimiteLeve.setDate(dateLimiteLeve.getDate() - 14);
            updatedMandat.terrain = {
              ...m.terrain,
              date_limite_leve: dateLimiteLeve.toISOString().split('T')[0]
            };
          }
          return updatedMandat;
        }
        return m;
      })
    }));
  };

  const removeMandat = (index) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ? Cette action est irréversible.")) {
      setFormData((prev) => ({
        ...prev,
        mandats: prev.mandats.filter((_, i) => i !== index)
      }));
    }
  };

  const openLotSelector = (mandatIndex) => {
    setCurrentMandatIndex(mandatIndex);
    setIsLotSelectorOpen(true);
  };

  const addLotToCurrentMandat = (lotId) => {
    if (currentMandatIndex !== null) {
      setFormData((prev) => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === currentMandatIndex ? {
            ...m,
            lots: m.lots.includes(lotId) ? m.lots.filter((id) => id !== lotId) : [...(m.lots || []), lotId]
          } : m
        )
      }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotId) => {
    if (confirm(`Êtes-vous sûr de vouloir retirer ce lot de ce mandat ?`)) {
      setFormData((prev) => ({
        ...prev,
        mandats: prev.mandats.map((m, i) =>
          i === mandatIndex ? { ...m, lots: m.lots.filter((id) => id !== lotId) } : m
        )
      }));
    }
  };

  const openAddMinuteDialog = (mandatIndex) => {
    setCurrentMinuteMandatIndex(mandatIndex);
    setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
    setIsAddMinuteDialogOpen(true);
  };

  const handleAddMinuteFromDialog = () => {
    if (currentMinuteMandatIndex !== null && newMinuteForm.minute && newMinuteForm.date_minute) {
      const dossiers = queryClient.getQueryData(['dossiers']) || [];
      const minuteExiste = dossiers.some((d) => 
        d.arpenteur_geometre === formData.arpenteur_geometre &&
        d.mandats?.some((m) => 
          m.minutes_list?.some((min) => min.minute === newMinuteForm.minute) ||
          m.minute === newMinuteForm.minute
        )
      );

      if (minuteExiste) {
        alert(`La minute ${newMinuteForm.minute} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
        return;
      }

      const currentMinutes = formData.mandats[currentMinuteMandatIndex].minutes_list || [];
      updateMandat(currentMinuteMandatIndex, 'minutes_list', [...currentMinutes, { ...newMinuteForm }]);
      setNewMinuteForm({ minute: "", date_minute: "", type_minute: "Initiale" });
      setIsAddMinuteDialogOpen(false);
      setCurrentMinuteMandatIndex(null);
    }
  };

  const removeMinuteFromMandat = (mandatIndex, minuteIndex) => {
    const updatedMinutes = formData.mandats[mandatIndex].minutes_list.filter((_, idx) => idx !== minuteIndex);
    updateMandat(mandatIndex, 'minutes_list', updatedMinutes);
  };

  const handleEditClient = (client) => {
    setEditingClientForForm(client);
    setClientTypeForForm(client.type_client);
    setIsClientFormDialogOpen(true);
    setIsClientSelectorOpen(false);
    setIsNotaireSelectorOpen(false);
    setIsCourtierSelectorOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
         <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50 pt-0 flex flex-col" style={{ marginTop: '20px', maxHeight: 'calc(100vh - 80px)' }} hideClose>
          <EditDossierForm
            formData={formData}
            setFormData={setFormData}
            clients={clients}
            lots={lots}
            users={users}
            onSubmit={handleSubmit}
            onCancel={handleCloseAttempt}
            updateMandat={updateMandat}
            addMandat={addMandat}
            removeMandat={removeMandat}
            openLotSelector={openLotSelector}
            removeLotFromMandat={removeLotFromMandat}
            openAddMinuteDialog={openAddMinuteDialog}
            removeMinuteFromMandat={removeMinuteFromMandat}
            getLotById={getLotById}
            setIsClientFormDialogOpen={setIsClientFormDialogOpen}
            setClientTypeForForm={setClientTypeForForm}
            setViewingClientDetails={setViewingClientDetails}
            calculerProchainNumeroDossier={() => ""}
            editingDossier={dossier}
            onOpenNewLotDialog={(mandatIndex) => {
              setCurrentMandatIndex(mandatIndex);
            }}
            setEditingClient={setEditingClientForForm}
            setEditingLot={() => {}}
            setNewLotForm={() => {}}
            setLotActionLogs={() => {}}
            allDossiers={allDossiers}
          />
         </DialogContent>
       </Dialog>

      <Dialog open={isAddMinuteDialogOpen} onOpenChange={setIsAddMinuteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Ajouter une minute</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Minute <span className="text-red-400">*</span></Label>
              <Input
                value={newMinuteForm.minute}
                onChange={(e) => setNewMinuteForm({ ...newMinuteForm, minute: e.target.value })}
                placeholder="Ex: 12345"
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Date de minute <span className="text-red-400">*</span></Label>
              <Input
                type="date"
                value={newMinuteForm.date_minute}
                onChange={(e) => setNewMinuteForm({ ...newMinuteForm, date_minute: e.target.value })}
                className="bg-slate-800 border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Type de minute <span className="text-red-400">*</span></Label>
              <Select
                value={newMinuteForm.type_minute}
                onValueChange={(value) => setNewMinuteForm({ ...newMinuteForm, type_minute: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Initiale" className="text-white">Initiale</SelectItem>
                  <SelectItem value="Remplace" className="text-white">Remplace</SelectItem>
                  <SelectItem value="Corrige" className="text-white">Corrige</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsAddMinuteDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleAddMinuteFromDialog}
                disabled={!newMinuteForm.minute || !newMinuteForm.date_minute}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Sélectionner les clients</DialogTitle>
              <Button
                variant="outline"
                onClick={() => {setIsClientFormDialogOpen(true); setClientTypeForForm("Client"); setIsClientSelectorOpen(false);}}
                className="bg-blue-500 hover:bg-blue-600 border-0 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input placeholder="Rechercher un client..." value={clientSearchTerm} onChange={(e) => setClientSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 p-4">
              {filteredClientsForSelector.length > 0 ? (
                filteredClientsForSelector.map((client) => (
                  <div
                    key={client.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.clients_ids.includes(client.id) ?
                      'bg-blue-500/20 border border-blue-500/30' :
                      'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                    }`}
                    onClick={() => toggleClient(client.id, 'clients')}
                  >
                    <p className="text-white font-medium">{client.prenom} {client.nom}</p>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {client.adresses?.find(a => a.actuelle) && formatAdresse(client.adresses.find(a => a.actuelle)) && (
                        <p className="truncate">📍 {formatAdresse(client.adresses.find(a => a.actuelle))}</p>
                      )}
                      {getCurrentValue(client.courriels, 'courriel') && (
                        <p className="truncate">✉️ {getCurrentValue(client.courriels, 'courriel')}</p>
                      )}
                      {getCurrentValue(client.telephones, 'telephone') && (
                        <p>📞 {getCurrentValue(client.telephones, 'telephone')}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsClientSelectorOpen(false);
                        handleEditClient(client);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 mt-2 w-full"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <p>Aucun client trouvé</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end items-center pt-4 border-t border-slate-800">
            <Button onClick={() => setIsClientSelectorOpen(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotaireSelectorOpen} onOpenChange={setIsNotaireSelectorOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Sélectionner les notaires</DialogTitle>
              <Button
                variant="outline"
                onClick={() => {setIsClientFormDialogOpen(true); setClientTypeForForm("Notaire"); setIsNotaireSelectorOpen(false);}}
                className="bg-purple-500 hover:bg-purple-600 border-0 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input placeholder="Rechercher un notaire..." value={notaireSearchTerm} onChange={(e) => setNotaireSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 p-4">
              {filteredNotairesForSelector.length > 0 ? (
                filteredNotairesForSelector.map((notaire) => (
                  <div
                    key={notaire.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.notaires_ids.includes(notaire.id) ?
                      'bg-purple-500/20 border border-purple-500/30' :
                      'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                    }`}
                    onClick={() => toggleClient(notaire.id, 'notaires')}
                  >
                    <p className="text-white font-medium">{notaire.prenom} {notaire.nom}</p>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {notaire.adresses?.find(a => a.actuelle) && formatAdresse(notaire.adresses.find(a => a.actuelle)) && (
                        <p className="truncate">📍 {formatAdresse(notaire.adresses.find(a => a.actuelle))}</p>
                      )}
                      {getCurrentValue(notaire.courriels, 'courriel') && (
                        <p className="truncate">✉️ {getCurrentValue(notaire.courriels, 'courriel')}</p>
                      )}
                      {getCurrentValue(notaire.telephones, 'telephone') && (
                        <p>📞 {getCurrentValue(notaire.telephones, 'telephone')}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotaireSelectorOpen(false);
                        handleEditClient(notaire);
                      }}
                      className="text-purple-400 hover:text-purple-300 mt-2 w-full"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <p>Aucun notaire trouvé</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end items-center pt-4 border-t border-slate-800">
            <Button onClick={() => setIsNotaireSelectorOpen(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCourtierSelectorOpen} onOpenChange={setIsCourtierSelectorOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Sélectionner les courtiers immobiliers</DialogTitle>
              <Button
                variant="outline"
                onClick={() => {setIsClientFormDialogOpen(true); setClientTypeForForm("Courtier immobilier"); setIsCourtierSelectorOpen(false);}}
                className="bg-orange-500 hover:bg-orange-600 border-0 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
            <Input placeholder="Rechercher un courtier..." value={courtierSearchTerm} onChange={(e) => setCourtierSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 p-4">
              {filteredCourtiersForSelector.length > 0 ? (
                filteredCourtiersForSelector.map((courtier) => (
                  <div
                    key={courtier.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      formData.courtiers_ids.includes(courtier.id) ?
                      'bg-orange-500/20 border border-orange-500/30' :
                      'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                    }`}
                    onClick={() => toggleClient(courtier.id, 'courtiers')}
                  >
                    <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                    <div className="text-sm text-slate-400 space-y-1 mt-1">
                      {courtier.adresses?.find(a => a.actuelle) && formatAdresse(courtier.adresses.find(a => a.actuelle)) && (
                        <p className="truncate">📍 {formatAdresse(courtier.adresses.find(a => a.actuelle))}</p>
                      )}
                      {getCurrentValue(courtier.courriels, 'courriel') && (
                        <p className="truncate">✉️ {getCurrentValue(courtier.courriels, 'courriel')}</p>
                      )}
                      {getCurrentValue(courtier.telephones, 'telephone') && (
                        <p>📞 {getCurrentValue(courtier.telephones, 'telephone')}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsCourtierSelectorOpen(false);
                        handleEditClient(courtier);
                      }}
                      className="text-orange-400 hover:text-orange-300 mt-2 w-full"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-slate-500">
                  <p>Aucun courtier trouvé</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end items-center pt-4 border-t border-slate-800">
            <Button onClick={() => setIsCourtierSelectorOpen(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {setIsLotSelectorOpen(open); if (!open) {setLotCirconscriptionFilter("all"); setLotSearchTerm(""); setLotCadastreFilter("Québec");}}}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl">Sélectionner des lots</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher par numéro, rang..."
                  value={lotSearchTerm}
                  onChange={(e) => setLotSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700"
                />
              </div>
              <Select value={lotCirconscriptionFilter} onValueChange={setLotCirconscriptionFilter}>
                <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Circonscription" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all" className="text-white">Toutes les circonscriptions</SelectItem>
                  {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                    <SelectItem key={circ} value={circ} className="text-white">
                      {circ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={lotCadastreFilter} onValueChange={setLotCadastreFilter}>
                <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Cadastre" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                  <SelectItem value="all" className="text-white">Tous les cadastres</SelectItem>
                  <SelectItem value="Québec" className="text-white">Québec</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700 sticky top-0 z-10">
                    <TableHead className="text-slate-300">Numéro de lot</TableHead>
                    <TableHead className="text-slate-300">Circonscription</TableHead>
                    <TableHead className="text-slate-300">Cadastre</TableHead>
                    <TableHead className="text-slate-300">Rang</TableHead>
                    <TableHead className="text-slate-300 text-right">Sélection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLotsForSelector.length > 0 ? (
                    filteredLotsForSelector.map((lot) => {
                      const isSelected = currentMandatIndex !== null &&
                        formData.mandats[currentMandatIndex]?.lots?.includes(lot.id);
                      return (
                        <TableRow
                          key={lot.id}
                          className={`cursor-pointer transition-colors border-slate-800 ${
                            isSelected ?
                            'bg-emerald-500/20 hover:bg-emerald-500/30' :
                            'hover:bg-slate-800/30'
                          }`}
                          onClick={() => addLotToCurrentMandat(lot.id)}
                        >
                          <TableCell className="font-medium text-white">
                            {lot.numero_lot}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              {lot.circonscription_fonciere}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {lot.cadastre || "-"}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {lot.rang || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {isSelected && (
                              <Badge className="bg-emerald-500/30 text-emerald-400 border-emerald-500/50">
                                <Check className="w-3 h-3 mr-1" />
                                Sélectionné
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="text-slate-400">
                          <p>Aucun lot trouvé</p>
                          <p className="text-sm mt-2">Essayez de modifier vos filtres</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Button onClick={() => setIsLotSelectorOpen(false)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600">
              Valider la sélection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-2xl">
              Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-6">
            {viewingClientDetails && (
              <ClientDetailView client={viewingClientDetails} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ClientFormDialog
        open={isClientFormDialogOpen}
        onOpenChange={(open) => {
          setIsClientFormDialogOpen(open);
          if (!open) setEditingClientForForm(null);
        }}
        editingClient={editingClientForForm}
        defaultType={clientTypeForForm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          if (clientTypeForForm === "Client") setIsClientSelectorOpen(true);
          if (clientTypeForForm === "Notaire") setIsNotaireSelectorOpen(true);
          if (clientTypeForForm === "Courtier immobilier") setIsCourtierSelectorOpen(true);
        }}
      />

      {/* Dialog d'avertissement modifications non sauvegardées */}
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

      {/* Dialog de progression de création du dossier - EN DEHORS du Dialog principal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 text-white max-w-md w-full mx-4 rounded-lg shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold">Création du dossier SharePoint</h2>
            </div>
            
            <div className="space-y-4">
              {/* Étape actuelle */}
              <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                {creationProgress.error ? (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                ) : creationProgress.isComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    creationProgress.error ? 'text-red-400' : 
                    creationProgress.isComplete ? 'text-emerald-400' : 
                    'text-blue-400'
                  }`}>
                    {creationProgress.step}
                  </p>
                  {creationProgress.details && (
                    <p className="text-sm text-slate-400 mt-1">{creationProgress.details}</p>
                  )}
                </div>
              </div>

              {/* Message d'erreur détaillé */}
              {creationProgress.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{creationProgress.error}</p>
                </div>
              )}

              {/* Bouton de fermeture */}
              {(creationProgress.isComplete || creationProgress.error) && (
                <Button 
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setCreationProgress({ step: '', details: '', isComplete: false, error: null });
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}