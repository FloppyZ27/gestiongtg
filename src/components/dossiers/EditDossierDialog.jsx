
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
import { Plus, X, Trash2, UserPlus, Search, FileText, Check, ChevronDown, ChevronUp, Edit, Package } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CommentairesSection from "./CommentairesSection";
import AddressInput from "../shared/AddressInput";
import ClientFormDialog from "../clients/ClientFormDialog";
import ClientDetailView from "../clients/ClientDetailView";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const DONNEURS = ["Dave Vallée", "Julie Abud", "André Guérin"];

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
  const [terrainSectionExpanded, setTerrainSectionExpanded] = useState({});
  const [isAddMinuteDialogOpen, setIsAddMinuteDialogOpen] = useState(false);
  const [currentMinuteMandatIndex, setCurrentMinuteMandatIndex] = useState(null);
  const [newMinuteForm, setNewMinuteForm] = useState({
    minute: "",
    date_minute: "",
    type_minute: "Initiale"
  });
  const [viewingClientDetails, setViewingClientDetails] = useState(null);

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
    statut: "Ouvert",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    description: ""
  });

  useEffect(() => {
    if (dossier) {
      setFormData({
        numero_dossier: dossier.numero_dossier || "",
        arpenteur_geometre: dossier.arpenteur_geometre || "",
        date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
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
          date_terrain: m.date_terrain || "", // New field
          equipe_assignee: m.equipe_assignee || "", // New field
          adresse_travaux: m.adresse_travaux ? typeof m.adresse_travaux === 'string' ? { rue: m.adresse_travaux, numeros_civiques: [], ville: "", code_postal: "", province: "" } : m.adresse_travaux : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
          lots: m.lots || [],
          prix_estime: m.prix_estime !== undefined ? m.prix_estime : 0,
          rabais: m.rabais !== undefined ? m.rabais : 0,
          taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
          date_livraison: m.date_livraison || "",
          date_signature: m.date_signature || "",
          date_debut_travaux: m.date_debut_travaux || "",
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
      });
      setActiveTabMandat("0");
      setTerrainSectionExpanded({});
    }
  }, [dossier]);

  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, dossierData }) => {
      const allDossiersCurrentState = queryClient.getQueryData(['dossiers']) || [];
      const oldDossier = allDossiersCurrentState.find(d => d.id === id);
      const updatedDossier = await base44.entities.Dossier.update(id, dossierData);
      
      // Obtenir l'utilisateur courant
      const currentUser = await base44.auth.me();
      
      // Créer des notifications pour les utilisateurs nouvellement assignés
      if (oldDossier && dossierData.mandats) {
        for (let i = 0; i < dossierData.mandats.length; i++) {
          const newMandat = dossierData.mandats[i];
          const oldMandat = oldDossier.mandats?.[i];
          
          // Si un utilisateur est assigné et qu'il est différent de l'ancien
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
      if (onSuccess) onSuccess();
      onClose();
    }
  });

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
    
    // Validation pour les dossiers ouverts : numéro unique (sauf pour le dossier lui-même)
    if (formData.statut === "Ouvert") {
      const dossierExistant = allDossiers.find(d => 
        d.id !== dossier?.id && // Exclure le dossier actuel
        d.numero_dossier === formData.numero_dossier &&
        d.arpenteur_geometre === formData.arpenteur_geometre
      );

      if (dossierExistant) {
        alert(`Un dossier ${formData.numero_dossier} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`);
        return;
      }

      // Validation : tous les mandats doivent avoir un utilisateur assigné
      const mandatsSansUtilisateur = formData.mandats.filter(m => !m.utilisateur_assigne);
      if (mandatsSansUtilisateur.length > 0) {
        alert("Tous les mandats doivent avoir un utilisateur assigné.");
        return;
      }
    }

    if (dossier) {
      updateDossierMutation.mutate({ id: dossier.id, dossierData: formData });
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
        date_terrain: "", // New field
        equipe_assignee: "", // New field
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

  const toggleTerrainSection = (mandatIndex) => {
    setTerrainSectionExpanded((prev) => ({
      ...prev,
      [mandatIndex]: !prev[mandatIndex]
    }));
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle className="text-2xl">Modifier le dossier</DialogTitle>
          </DialogHeader>
          <div className="flex h-[90vh]">
            <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Modifier le dossier</h2>
              </div>

              <form id="dossier-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                    <Select value={formData.arpenteur_geometre} onValueChange={(value) => setFormData({ ...formData, arpenteur_geometre: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {ARPENTEURS.map((arpenteur) => (
                          <SelectItem key={arpenteur} value={arpenteur} className="text-white">{arpenteur}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut <span className="text-red-400">*</span></Label>
                    <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Sélectionner le statut" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="Ouvert" className="text-white">Ouvert</SelectItem>
                        <SelectItem value="Fermé" className="text-white">Fermé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.statut === "Ouvert" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>N° de dossier <span className="text-red-400">*</span></Label>
                      <Input value={formData.numero_dossier} onChange={(e) => setFormData({ ...formData, numero_dossier: e.target.value })} required placeholder="Ex: 2024-001" className="bg-slate-800 border-slate-700" />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'ouverture <span className="text-red-400">*</span></Label>
                      <Input type="date" value={formData.date_ouverture} onChange={(e) => setFormData({ ...formData, date_ouverture: e.target.value })} required className="bg-slate-800 border-slate-700" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Clients</Label>
                      <Button type="button" size="sm" onClick={() => setIsClientSelectorOpen(true)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                        <UserPlus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    {formData.clients_ids.length > 0 ? (
                      <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                        {formData.clients_ids.map((clientId) => {
                          const client = getClientById(clientId);
                          return client ? (
                            <div key={clientId} className="space-y-1">
                              <Badge 
                                variant="outline" 
                                className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30 relative pr-8 w-full justify-start"
                                onClick={() => setViewingClientDetails(client)}
                              >
                                <span className="flex-1">{client.prenom} {client.nom}</span>
                                <button type="button" onClick={(e) => {e.stopPropagation(); removeClient(clientId, 'clients');}} className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                              {client.preferences_livraison && client.preferences_livraison.length > 0 && (
                                <div className="flex gap-1 ml-2">
                                  <Package className="w-3 h-3 text-slate-500 mt-0.5" />
                                  <span className="text-xs text-slate-400">
                                    {client.preferences_livraison.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">Aucun client</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Notaires</Label>
                      <Button type="button" size="sm" onClick={() => setIsNotaireSelectorOpen(true)} className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400">
                        <UserPlus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    {formData.notaires_ids.length > 0 ? (
                      <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                        {formData.notaires_ids.map((notaireId) => {
                          const notaire = getClientById(notaireId);
                          return notaire ? (
                            <div key={notaireId} className="space-y-1">
                              <Badge 
                                variant="outline" 
                                className="bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 relative pr-8 w-full justify-start"
                                onClick={() => setViewingClientDetails(notaire)}
                              >
                                <span className="flex-1">{notaire.prenom} {notaire.nom}</span>
                                <button type="button" onClick={(e) => {e.stopPropagation(); removeClient(notaireId, 'notaires');}} className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                              {notaire.preferences_livraison && notaire.preferences_livraison.length > 0 && (
                                <div className="flex gap-1 ml-2">
                                  <Package className="w-3 h-3 text-slate-500 mt-0.5" />
                                  <span className="text-xs text-slate-400">
                                    {notaire.preferences_livraison.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">Aucun notaire</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label>Courtiers immobiliers</Label>
                      <Button type="button" size="sm" onClick={() => setIsCourtierSelectorOpen(true)} className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400">
                        <UserPlus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                    {formData.courtiers_ids.length > 0 ? (
                      <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                        {formData.courtiers_ids.map((courtierId) => {
                          const courtier = getClientById(courtierId);
                          return courtier ? (
                            <div key={courtierId} className="space-y-1">
                              <Badge 
                                variant="outline" 
                                className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-pointer hover:bg-orange-500/30 relative pr-8 w-full justify-start"
                                onClick={() => setViewingClientDetails(courtier)}
                              >
                                <span className="flex-1">{courtier.prenom} {courtier.nom}</span>
                                <button type="button" onClick={(e) => {e.stopPropagation(); removeClient(courtierId, 'courtiers');}} className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                              {courtier.preferences_livraison && courtier.preferences_livraison.length > 0 && (
                                <div className="flex gap-1 ml-2">
                                  <Package className="w-3 h-3 text-slate-500 mt-0.5" />
                                  <span className="text-xs text-slate-400">
                                    {courtier.preferences_livraison.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">Aucun courtier</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Mandats</Label>
                    <Button type="button" size="sm" onClick={addMandat} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter un mandat
                    </Button>
                  </div>

                  {formData.mandats.length > 0 ? (
                    <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat} className="w-full">
                      <TabsList className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-2 border-blue-500/30 w-full h-auto justify-start p-2 rounded-lg">
                        {formData.mandats.map((mandat, index) => (
                          <TabsTrigger
                            key={index}
                            value={index.toString()}
                            className="data-[state=active]:bg-blue-500/30 data-[state=active]:text-blue-300 data-[state=active]:shadow-lg text-slate-300 px-8 py-4 text-lg font-bold rounded-md transition-all"
                          >
                            {getMandatTabLabel(mandat, index)}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {formData.mandats.map((mandat, index) => (
                        <TabsContent key={index} value={index.toString()}>
                          <Card className="border-slate-700 bg-slate-800/30">
                            <CardContent className="p-4 space-y-4">
                              <div className="flex gap-4 items-start">
                                <div className="flex-1 grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Type de mandat <span className="text-red-400">*</span></Label>
                                    <Select value={mandat.type_mandat} onValueChange={(value) => updateMandat(index, 'type_mandat', value)}>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                        <SelectValue placeholder="Sélectionner" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-800 border-slate-700">
                                        {TYPES_MANDATS.map((type) => (
                                          <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Tâche actuelle</Label>
                                    <Select value={mandat.tache_actuelle || ""} onValueChange={(value) => updateMandat(index, 'tache_actuelle', value)}>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                        <SelectValue placeholder="Sélectionner la tâche" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                                        {TACHES.map((tache) => (
                                          <SelectItem key={tache} value={tache} className="text-white">{tache}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>
                                      Utilisateur assigné 
                                      {formData.statut === "Ouvert" && <span className="text-red-400"> *</span>}
                                    </Label>
                                    <Select value={mandat.utilisateur_assigne || ""} onValueChange={(value) => updateMandat(index, 'utilisateur_assigne', value)}>
                                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                        <SelectValue placeholder="Sélectionner" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                                        <SelectItem value={null} className="text-white">Aucun</SelectItem>
                                        {users?.map((user) => (
                                          <SelectItem key={user.email} value={user.email} className="text-white">{user.full_name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <Button type="button" size="sm" variant="ghost" onClick={() => {
                                  removeMandat(index);
                                  if (formData.mandats.length > 1) {
                                    setActiveTabMandat(Math.max(0, index - 1).toString());
                                  } else {
                                    setActiveTabMandat("0");
                                  }
                                }} className="text-red-400 hover:text-red-300 mt-8">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer ce mandat
                                </Button>
                              </div>

                              <div className="grid grid-cols-[70%_30%] gap-4">
                                <div className="space-y-3">
                                  <AddressInput
                                    addresses={mandat.adresse_travaux ? [mandat.adresse_travaux] : [{ ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" }]}
                                    onChange={(newAddresses) => updateMandatAddress(index, newAddresses)}
                                    showActuelle={false}
                                    singleAddress={true}
                                  />
                                </div>

                                <div className="space-y-3">
                                  <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg space-y-3">
                                    <div className="space-y-2">
                                      <Label>Date de signature</Label>
                                      <Input
                                        type="date"
                                        value={mandat.date_signature || ""}
                                        onChange={(e) => updateMandat(index, 'date_signature', e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Début des travaux</Label>
                                      <Input
                                        type="date"
                                        value={mandat.date_debut_travaux || ""}
                                        onChange={(e) => updateMandat(index, 'date_debut_travaux', e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Date de livraison</Label>
                                      <Input
                                        type="date"
                                        value={mandat.date_livraison || ""}
                                        onChange={(e) => updateMandat(index, 'date_livraison', e.target.value)}
                                        className="bg-slate-700 border-slate-600"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>Lots sélectionnés</Label>
                                  <Button type="button" size="sm" onClick={() => openLotSelector(index)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Sélectionner des lots
                                  </Button>
                                </div>

                                {mandat.lots && mandat.lots.length > 0 ? (
                                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                          <TableHead className="text-slate-300">Numéro de lot</TableHead>
                                          <TableHead className="text-slate-300">Circonscription</TableHead>
                                          <TableHead className="text-slate-300">Cadastre</TableHead>
                                          <TableHead className="text-slate-300">Rang</TableHead>
                                          <TableHead className="text-slate-300 text-right">Sélection</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {mandat.lots.map((lotId) => {
                                          const lot = getLotById(lotId);
                                          return lot ? (
                                            <TableRow key={lot.id} className="hover:bg-slate-800/30 border-slate-800">
                                              <TableCell className="font-medium text-white">{lot.numero_lot}</TableCell>
                                              <TableCell className="text-slate-300">
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">{lot.circonscription_fonciere}</Badge>
                                              </TableCell>
                                              <TableCell className="text-slate-300">{lot.cadastre || "-"}</TableCell>
                                              <TableCell className="text-slate-300">{lot.rang || "-eroom"}</TableCell>
                                              <TableCell className="text-right">
                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeLotFromMandat(index, lot.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            <TableRow key={lotId} className="hover:bg-slate-800/30 border-slate-800">
                                              <TableCell colSpan={4} className="font-medium text-white">{lotId} (Lot introuvable)</TableCell>
                                              <TableCell className="text-right">
                                                <Button type="button" size="sm" variant="ghost" onClick={() => removeLotFromMandat(index, lotId)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                                  <Trash2 className="w-4 h-4" />
                                                </Button>
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">Aucun lot sélectionné</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>Minutes</Label>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => openAddMinuteDialog(index)}
                                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Ajouter minute
                                  </Button>
                                </div>
                                
                                {mandat.minutes_list && mandat.minutes_list.length > 0 ? (
                                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                          <TableHead className="text-slate-300">Minute</TableHead>
                                          <TableHead className="text-slate-300">Date de minute</TableHead>
                                          <TableHead className="text-slate-300">Type de minute</TableHead>
                                          <TableHead className="text-slate-300 text-right">Actions</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {mandat.minutes_list.map((minute, minuteIdx) => (
                                          <TableRow key={minuteIdx} className="hover:bg-slate-800/30 border-slate-800">
                                            <TableCell className="text-white">{minute.minute}</TableCell>
                                            <TableCell className="text-white">
                                              {minute.date_minute ? format(new Date(minute.date_minute), "dd MMM yyyy", { locale: fr }) : '-'}
                                            </TableCell>
                                            <TableCell className="text-white">
                                              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                {minute.type_minute}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeMinuteFromMandat(index, minuteIdx)}
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
                                ) : (
                                  <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">Aucune minute</p>
                                )}
                              </div>

                              <div className="space-y-2 pt-3 border-t border-slate-700">
                                <Label className="text-slate-50 mb-2 text-sm font-semibold block">Factures générées ({mandat.factures?.length || 0})</Label>
                                {mandat.factures && mandat.factures.length > 0 ? (
                                  <div className="border border-slate-700 rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                          <TableHead className="text-slate-300">N° Facture</TableHead>
                                          <TableHead className="text-slate-300">Date</TableHead>
                                          <TableHead className="text-slate-300">Total HT</TableHead>
                                          <TableHead className="text-slate-300">Total TTC</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {mandat.factures.map((facture, factureIdx) => (
                                          <TableRow key={factureIdx} className="border-slate-800">
                                            <TableCell className="text-white font-semibold">{facture.numero_facture}</TableCell>
                                            <TableCell className="text-white">{facture.date_facture ? format(new Date(facture.date_facture), "dd MMM yyyy", { locale: fr }) : '-'}</TableCell>
                                            <TableCell className="text-white">{facture.total_ht?.toFixed(2)} $</TableCell>
                                            <TableCell className="text-white font-semibold">{facture.total_ttc?.toFixed(2)} $</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">Aucune facture générée</p>
                                )}
                              </div>

                              <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={mandat.notes || ""} onChange={(e) => updateMandat(index, 'notes', e.target.value)} className="bg-slate-700 border-slate-600 h-20" />
                              </div>

                              <div className="border-t border-slate-700 pt-4 mt-4">
                                <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => toggleTerrainSection(index)}>
                                  <Label className="text-lg font-semibold text-emerald-400">Section Terrain</Label>
                                  <Button type="button" variant="ghost" size="sm" className="text-emerald-400 hover:bg-emerald-500/10 p-0 h-auto">
                                    {terrainSectionExpanded[index] ? (
                                      <ChevronUp className="w-5 h-5" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5" />
                                    )}
                                  </Button>
                                </div>
                                
                                {terrainSectionExpanded[index] && (
                                  <div className="space-y-3">
                                    {/* Encadré pour date terrain et équipe */}
                                    <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-lg">
                                      <Label className="text-cyan-300 font-semibold mb-3 block">Planification terrain</Label>
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                          <Label className="text-white">Date terrain</Label>
                                          <Input
                                            type="date"
                                            value={mandat.date_terrain || ""}
                                            onChange={(e) => updateMandat(index, 'date_terrain', e.target.value)}
                                            className="bg-slate-700 border-slate-600 text-white"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label className="text-white">Équipe assignée</Label>
                                          <Input
                                            value={mandat.equipe_assignee || ""}
                                            onChange={(e) => updateMandat(index, 'equipe_assignee', e.target.value)}
                                            placeholder="Ex: Équipe 1"
                                            className="bg-slate-700 border-slate-600 text-white"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Date limite levé terrain</Label>
                                        <Input type="date" value={mandat.terrain?.date_limite_leve || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, date_limite_leve: e.target.value })} className="bg-slate-700 border-slate-600" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Instruments requis</Label>
                                        <Input value={mandat.terrain?.instruments_requis || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, instruments_requis: e.target.value })} placeholder="Ex: GPS, Total Station" className="bg-slate-700 border-slate-600" />
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={mandat.terrain?.a_rendez_vous || false} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, a_rendez_vous: e.target.checked })} className="w-4 h-4 rounded bg-slate-700 border-slate-600" />
                                        <Label>Rendez-vous nécessaire</Label>
                                      </div>
                                      {mandat.terrain?.a_rendez_vous && (
                                        <div className="grid grid-cols-2 gap-3 ml-7">
                                          <div className="space-y-2">
                                            <Label>Date du rendez-vous</Label>
                                            <Input type="date" value={mandat.terrain?.date_rendez_vous || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, date_rendez_vous: e.target.value })} className="bg-slate-700 border-slate-600" />
                                          </div>
                                          <div className="space-y-2">
                                            <Label>Heure du rendez-vous</Label>
                                            <Input type="time" value={mandat.terrain?.heure_rendez_vous || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, heure_rendez_vous: e.target.value })} className="bg-slate-700 border-slate-600" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Donneur</Label>
                                        <Select value={mandat.terrain?.donneur || ""} onValueChange={(value) => updateMandat(index, 'terrain', { ...mandat.terrain, donneur: value })}>
                                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                                            <SelectValue placeholder="Sélectionner un donneur" />
                                          </SelectTrigger>
                                          <SelectContent className="bg-slate-800 border-slate-700">
                                            <SelectItem value={null} className="text-white">Aucun</SelectItem>
                                            {DONNEURS.map((donneur) => (
                                              <SelectItem key={donneur} value={donneur} className="text-white">{donneur}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Technicien à prioriser</Label>
                                        <Input value={mandat.terrain?.technicien || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, technicien: e.target.value })} placeholder="Nom du technicien" className="bg-slate-700 border-slate-600" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-2">
                                        <Label>Dossier à faire en même temps</Label>
                                        <Input value={mandat.terrain?.dossier_simultane || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, dossier_simultane: e.target.value })} placeholder="N° de dossier" className="bg-slate-700 border-slate-600" />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Temps prévu</Label>
                                        <Input value={mandat.terrain?.temps_prevu || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, temps_prevu: e.target.value })} placeholder="Ex: 2h30" className="bg-slate-700 border-slate-600" />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Notes terrain</Label>
                                      <Textarea value={mandat.terrain?.notes || ""} onChange={(e) => updateMandat(index, 'terrain', { ...mandat.terrain, notes: e.target.value })} placeholder="Notes concernant le terrain..." className="bg-slate-700 border-slate-600 h-20" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      ))}
                    </Tabs>
                  ) : (
                    <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">Aucun mandat. Cliquez sur "Ajouter un mandat" pour commencer.</div>
                  )}
                </div>

                {formData.mandats.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <Label className="text-lg font-semibold text-slate-300">Tarification</Label>
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300">Type de mandat</TableHead>
                            <TableHead className="text-slate-300">Prix estimé ($)</TableHead>
                            <TableHead className="text-slate-300">Rabais ($)</TableHead>
                            <TableHead className="text-slate-300">Taxes incluses</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.mandats.map((mandat, index) => (
                            <TableRow key={index} className="hover:bg-slate-800/30 border-slate-800">
                              <TableCell className="font-medium text-white">{mandat.type_mandat || `Mandat ${index + 1}`}</TableCell>
                              <TableCell>
                                <Input type="text" inputMode="decimal" value={mandat.prix_estime || ""} onChange={(e) => {const value = e.target.value.replace(/[^0-9.]/g, ''); updateMandat(index, 'prix_estime', value ? parseFloat(value) : 0);}} placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
                              </TableCell>
                              <TableCell>
                                <Input type="text" inputMode="decimal" value={mandat.rabais || ""} onChange={(e) => {const value = e.target.value.replace(/[^0-9.]/g, ''); updateMandat(index, 'rabais', value ? parseFloat(value) : 0);}} placeholder="0.00" className="bg-slate-700 border-slate-600 text-white" />
                              </TableCell>
                              <TableCell className="text-center">
                                <input type="checkbox" id={`taxes_incluses_${index}`} checked={mandat.taxes_incluses} onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)} className="form-checkbox h-5 w-5 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </form>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800 px-6">
                <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                <Button type="submit" form="dossier-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">Modifier</Button>
              </div>
            </div>

            <div className="flex-[0_0_30%] flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex-shrink-0">
                <h3 className="text-lg font-bold text-white">Commentaires</h3>
              </div>
              <div className="flex-1 overflow-hidden p-6">
                <CommentairesSection dossierId={dossier?.id} dossierTemporaire={false} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour ajouter une minute */}
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

      {/* Dialog de sélection des clients */}
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

      {/* Dialog de sélection des notaires */}
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

      {/* Dialog de sélection des courtiers */}
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

      {/* Lot Selector Dialog */}
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

      {/* Dialog de consultation de client */}
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
    </>
  );
}
