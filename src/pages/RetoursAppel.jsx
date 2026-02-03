import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, Phone, X, UserPlus, Eye, Trash, Check, MessageSquare, ChevronUp, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ClientDetailView from "../components/clients/ClientDetailView";
import CommentairesSection from "../components/dossiers/CommentairesSection";
import ClientFormDialog from "../components/clients/ClientFormDialog";
import MandatTabs from "../components/dossiers/MandatTabs";
import NewRetourAppelForm from "../components/retourappel/NewRetourAppelForm";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "bg-red-500/20 text-red-400 border-red-500/30",
    "Pierre-Luc Pilote": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Frédéric Gilbert": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Dany Gaboury": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Benjamin Larouche": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
  };
  return colors[arpenteur] || "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
};

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

const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const RetoursAppel = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    openNewDialog: () => {
      setEditingRetourAppel(null);
      setNewRetourForm({
        dossier_reference_id: null,
        date_appel: new Date().toISOString().split('T')[0],
        utilisateur_assigne: "",
        notes: "",
        statut: "Retour d'appel",
        client_nom: "",
        client_telephone: ""
      });
      setIsNewRetourDialogOpen(true);
    }
  }));
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);
  const [isNotaireSelectorOpen, setIsNotaireSelectorOpen] = useState(false);
  const [isCourtierSelectorOpen, setIsCourtierSelectorOpen] = useState(false);
  const [isClientFormDialogOpen, setIsClientFormDialogOpen] = useState(false);
  const [clientTypeForForm, setClientTypeForForm] = useState('Client');
  const [editingClientForForm, setEditingClientForForm] = useState(null);
  const [viewingClientDetails, setViewingClientDetails] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingDossier, setViewingDossier] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [notaireSearchTerm, setNotaireSearchTerm] = useState("");
  const [courtierSearchTerm, setCourtierSearchTerm] = useState("");
  const [activeTabMandat, setActiveTabMandat] = useState("0");
  const [dossierReferenceId, setDossierReferenceId] = useState(null);
  const [dossierSearchForReference, setDossierSearchForReference] = useState("");
  const [selectedArpenteur, setSelectedArpenteur] = useState("");
  const [selectedNumeroDossier, setSelectedNumeroDossier] = useState("");
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  const [filterArpenteur, setFilterArpenteur] = useState("all");
  const [filterUtilisateurAssigne, setFilterUtilisateurAssigne] = useState("all");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [showDeleteRetourConfirm, setShowDeleteRetourConfirm] = useState(false);
  const [retourIdToDelete, setRetourIdToDelete] = useState(null);

  const [formData, setFormData] = useState({
    dossier_reference_id: "",
    utilisateur_assigne: "",
    date_appel: new Date().toISOString().split('T')[0],
    statut_retour_appel: "Message laissé",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-created_date'),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: lots = [] } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: retoursAppels = [] } = useQuery({
    queryKey: ['retoursAppels'],
    queryFn: () => base44.entities.RetourAppel.filter({}, '-date_appel'),
    initialData: [],
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dossierIdFromUrl = urlParams.get('dossier_id');
    if (dossierIdFromUrl && dossiers.length > 0) {
      const dossier = dossiers.find(d => d.id === dossierIdFromUrl);
      if (dossier) {
        handleView(dossier);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [dossiers]);

  const createRetourAppelMutation = useMutation({
    mutationFn: async (retourData) => {
      // Si aucun dossier, créer retour d'appel sans dossier
      if (!retourData.dossier_reference_id) {
        await base44.entities.RetourAppel.create({
          dossier_id: null,
          date_appel: retourData.date_appel,
          utilisateur_assigne: retourData.utilisateur_assigne,
          raison: retourData.notes || "",
          statut: "Retour d'appel",
          client_nom: retourData.client_nom || "",
          client_telephone: retourData.client_telephone || ""
        });
        
        if (retourData.utilisateur_assigne) {
          await base44.entities.Notification.create({
            utilisateur_email: retourData.utilisateur_assigne,
            titre: "Nouveau retour d'appel assigné",
            message: `Un retour d'appel vous a été assigné${retourData.client_nom ? ` pour ${retourData.client_nom}` : ''}.`,
            type: "retour_appel",
            lue: false
          });
        }
        return;
      }
      
      const dossierId = retourData.dossier_reference_id;
      const dossier = dossiers.find(d => d.id === dossierId);
      if (!dossier) throw new Error("Dossier non trouvé");
      
      await base44.entities.RetourAppel.create({
        dossier_id: dossierId,
        date_appel: retourData.date_appel,
        utilisateur_assigne: retourData.utilisateur_assigne,
        raison: retourData.notes || "",
        statut: "Retour d'appel"
      });
      
      await base44.entities.Dossier.update(dossierId, {
        ...dossier,
        utilisateur_assigne: retourData.utilisateur_assigne
      });
      
      if (retourData.utilisateur_assigne) {
        const clientsNames = getClientsNames(dossier.clients_ids);
        await base44.entities.Notification.create({
          utilisateur_email: retourData.utilisateur_assigne,
          titre: "Nouveau retour d'appel assigné",
          message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
          type: "retour_appel",
          dossier_id: dossierId,
          lue: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['retoursAppels'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });



  const updateRetourAppelMutation = useMutation({
    mutationFn: async ({ id, retourData }) => {
      const dossier = dossiers.find(d => d.id === id);
      if (!dossier) throw new Error("Dossier non trouvé");
      
      const oldUtilisateur = dossier.utilisateur_assigne;
      await base44.entities.Dossier.update(id, {
        ...dossier,
        utilisateur_assigne: retourData.utilisateur_assigne
      });
      
      if (retourData.utilisateur_assigne && oldUtilisateur !== retourData.utilisateur_assigne) {
        const clientsNames = getClientsNames(dossier.clients_ids);
        await base44.entities.Notification.create({
          utilisateur_email: retourData.utilisateur_assigne,
          titre: "Nouveau retour d'appel assigné",
          message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
          type: "retour_appel",
          dossier_id: id,
          lue: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const deleteDossierMutation = useMutation({
    mutationFn: (id) => base44.entities.Dossier.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dossiers'] }),
  });

  const clientsReguliers = clients.filter(c => c.type_client === 'Client' || !c.type_client);
  const notaires = clients.filter(c => c.type_client === 'Notaire');
  const courtiers = clients.filter(c => c.type_client === 'Courtier immobilier');

  const getClientById = (id) => clients.find(c => c.id === id);
  const getLotById = (lotId) => lots.find(l => l.id === lotId);

  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques?.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
  };

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "Client inconnu";
    }).join(", ");
  };

  const getFirstAdresseTravaux = (mandats) => {
    if (!mandats || mandats.length === 0 || !mandats[0].adresse_travaux) return "-";
    return formatAdresse(mandats[0].adresse_travaux);
  };

  const selectDossier = (dossierId) => {
    setDossierReferenceId(dossierId);
    setFormData(prev => ({
      ...prev,
      dossier_reference_id: dossierId
    }));
    setDossierSearchForReference("");
  };

  const getRetourAppelByDossier = (dossierId) => {
    return retoursAppels.find(r => r.dossier_id === dossierId);
  };

  const getDossierByRetourAppel = (retourAppelId) => {
    const retour = retoursAppels.find(r => r.id === retourAppelId);
    return retour ? dossiers.find(d => d.id === retour.dossier_id) : null;
  };

  const retourAppelDossiers = dossiers.filter(d => d.statut === "Retour d'appel" && d.statut !== "Rejeté");

  const applyFilters = (dossiersList) => {
    return dossiersList.filter(dossier => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        dossier.arpenteur_geometre?.toLowerCase().includes(searchLower) ||
        dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
        dossier.clients_ids.some(id => {
          const client = getClientById(id);
          return client && `${client.prenom} ${client.nom}`.toLowerCase().includes(searchLower);
        }) ||
        dossier.mandats?.some(m =>
          m.type_mandat?.toLowerCase().includes(searchLower) ||
          formatAdresse(m.adresse_travaux)?.toLowerCase().includes(searchLower)
        )
      );
      const matchesArpenteur = filterArpenteur === "all" || dossier.arpenteur_geometre === filterArpenteur;
      let matchesUtilisateurAssigne;
      if (filterUtilisateurAssigne === "all") {
        matchesUtilisateurAssigne = true;
      } else if (filterUtilisateurAssigne === "non-assigne") {
        matchesUtilisateurAssigne = !dossier.utilisateur_assigne;
      } else {
        matchesUtilisateurAssigne = dossier.utilisateur_assigne === filterUtilisateurAssigne;
      }
      return matchesSearch && matchesArpenteur && matchesUtilisateurAssigne;
    });
  };

  const filteredRetourAppel = applyFilters(retourAppelDossiers);

  const filteredDossiersForReference = dossiers.filter(dossier => {
    const searchLower = dossierSearchForReference.toLowerCase();
    const fullNumber = (dossier.arpenteur_geometre ? getArpenteurInitials(dossier.arpenteur_geometre) : "") + (dossier.numero_dossier || "");
    const clientsNames = getClientsNames(dossier.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower)
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
      updateRetourAppelMutation.mutate({ id: editingDossier.id, retourData: formData });
    } else {
      createRetourAppelMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      dossier_reference_id: "",
      utilisateur_assigne: "",
      date_appel: new Date().toISOString().split('T')[0],
      statut_retour_appel: "Message laissé",
      notes: ""
    });
    setEditingDossier(null);
    setDossierReferenceId(null);
    setDossierSearchForReference("");
    setSelectedArpenteur("");
    setSelectedNumeroDossier("");
  };

  const handleEdit = (dossier) => {
    setIsViewDialogOpen(false);
    setViewingDossier(null);
    setEditingDossier(dossier);
    setFormData({
      dossier_reference_id: dossier.id,
      utilisateur_assigne: dossier.utilisateur_assigne || "",
      date_appel: new Date().toISOString().split('T')[0],
      statut_retour_appel: "Message laissé",
      notes: ""
    });
    setDossierReferenceId(dossier.id);
    setIsDialogOpen(true);
  };

  const handleView = (dossier) => {
    setViewingDossier(dossier);
    setIsViewDialogOpen(true);
  };

  const handleEditFromView = () => {
    if (viewingDossier) handleEdit(viewingDossier);
  };

  const handleDelete = (id) => {
    setRetourIdToDelete(id);
    setShowDeleteRetourConfirm(true);
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortDossiers = (dossiersList) => {
    if (!sortField) return dossiersList;
    return [...dossiersList].sort((a, b) => {
      let aValue, bValue;
      switch (sortField) {
        case 'numero_dossier':
          aValue = (getArpenteurInitials(a.arpenteur_geometre) + (a.numero_dossier || '')).toLowerCase();
          bValue = (getArpenteurInitials(b.arpenteur_geometre) + (b.numero_dossier || '')).toLowerCase();
          break;
        case 'created_date':
          aValue = new Date(a.created_date || 0).getTime();
          bValue = new Date(b.created_date || 0).getTime();
          break;
        case 'clients':
          aValue = getClientsNames(a.clients_ids).toLowerCase();
          bValue = getClientsNames(b.clients_ids).toLowerCase();
          break;
        case 'adresse_travaux':
          aValue = getFirstAdresseTravaux(a.mandats).toLowerCase();
          bValue = getFirstAdresseTravaux(b.mandats).toLowerCase();
          break;
        case 'utilisateur_assigne':
          aValue = (a.utilisateur_assigne || '').toLowerCase();
          bValue = (b.utilisateur_assigne || '').toLowerCase();
          break;
        default:
          aValue = (a[sortField] || '').toString().toLowerCase();
          bValue = (b[sortField] || '').toString().toLowerCase();
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const [viewingRaison, setViewingRaison] = useState(null);
  const [filterArpenteurs, setFilterArpenteurs] = useState([]);
  const [filterUtilisateurs, setFilterUtilisateurs] = useState([]);

  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchRetoursAppel, setSearchRetoursAppel] = useState("");
  const [activeListTab, setActiveListTab] = useState("retour_appel");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const sortedRetourAppel = sortDossiers(filteredRetourAppel);

  // Créer une liste de tous les retours d'appel avec leurs informations de dossier associé
  const allRetoursAppelsWithDossier = retoursAppels.map(retour => {
    const dossier = getDossierByRetourAppel(retour.id);
    return {
      ...retour,
      dossier
    };
  });

  const getFilteredRetoursAppels = () => {
    return allRetoursAppelsWithDossier.filter(retour => {
      // Filtre par tab actif
      const tabStatut = activeListTab === "retour_appel" 
        ? "Retour d'appel"
        : activeListTab === "message_laisse"
        ? ["Message laissé", "Aucune réponse"]
        : "Terminé";
      
      const matchesTabStatut = Array.isArray(tabStatut) 
        ? tabStatut.includes(retour.statut)
        : retour.statut === tabStatut;
      
      if (!matchesTabStatut) return false;
      
      const matchesSearch = searchRetoursAppel === "" || 
        retour.raison?.toLowerCase().includes(searchRetoursAppel.toLowerCase()) ||
        retour.dossier?.numero_dossier?.toLowerCase().includes(searchRetoursAppel.toLowerCase());
      
      const matchesArpenteur = filterArpenteurs.length === 0 || 
        (retour.dossier && filterArpenteurs.includes(retour.dossier.arpenteur_geometre));
      
      const matchesUtilisateur = filterUtilisateurs.length === 0 || 
        filterUtilisateurs.includes(retour.utilisateur_assigne);
      
      const retourDate = new Date(retour.date_appel);
      const matchesDateStart = filterDateStart === "" || retourDate >= new Date(filterDateStart);
      const matchesDateEnd = filterDateEnd === "" || retourDate <= new Date(filterDateEnd + "T23:59:59");
      
      return matchesSearch && matchesArpenteur && matchesUtilisateur && matchesDateStart && matchesDateEnd;
    }).sort((a, b) => {
      const dateA = new Date(a.date_appel || 0).getTime();
      const dateB = new Date(b.date_appel || 0).getTime();
      return dateB - dateA;
    });
  };

  const sortedAllRetoursAppels = getFilteredRetoursAppels();

  const getCurrentValue = (items, key) => {
    const current = items?.find(item => item.actuel || item.actuelle);
    return current?.[key] || "";
  };

  const [isNewRetourDialogOpen, setIsNewRetourDialogOpen] = useState(false);
  const [newRetourForm, setNewRetourForm] = useState({
    dossier_reference_id: null,
    date_appel: new Date().toISOString().split('T')[0],
    utilisateur_assigne: "",
    notes: "",
    statut: "Retour d'appel",
    client_nom: "",
    client_telephone: ""
  });
  const [editingRetourAppel, setEditingRetourAppel] = useState(null);

  return (
    <>
      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteRetourConfirm} onOpenChange={setShowDeleteRetourConfirm}>
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
              Êtes-vous sûr de vouloir supprimer ce retour d'appel ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={() => {
                  setShowDeleteRetourConfirm(false);
                  setRetourIdToDelete(null);
                }}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                onClick={() => {
                  if (retourIdToDelete) {
                    base44.entities.RetourAppel.delete(retourIdToDelete).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['retoursAppels'] });
                    });
                  }
                  setShowDeleteRetourConfirm(false);
                  setRetourIdToDelete(null);
                }}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewRetourDialogOpen} onOpenChange={(open) => {
        if (!open && !editingRetourAppel) {
          setNewRetourForm({
            dossier_reference_id: null,
            date_appel: new Date().toISOString().split('T')[0],
            utilisateur_assigne: "",
            notes: "",
            statut: "Retour d'appel",
            client_nom: "",
            client_telephone: ""
          });
        }
        setIsNewRetourDialogOpen(open);
      }}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[50vw] w-[50vw] p-0 gap-0 shadow-2xl shadow-black/50" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{editingRetourAppel ? "Modifier retour d'appel" : "Nouveau retour d'appel"}</DialogTitle>
          </DialogHeader>
          <NewRetourAppelForm
            formData={newRetourForm}
            setFormData={setNewRetourForm}
            users={users}
            dossiers={dossiers}
            editingRetourAppel={editingRetourAppel}
            onSubmit={async (e) => {
              e.preventDefault();
              await createRetourAppelMutation.mutateAsync({
                dossier_reference_id: newRetourForm.dossier_reference_id,
                utilisateur_assigne: newRetourForm.utilisateur_assigne,
                date_appel: newRetourForm.date_appel,
                notes: newRetourForm.notes,
                client_nom: newRetourForm.client_nom,
                client_telephone: newRetourForm.client_telephone
              });
              setIsNewRetourDialogOpen(false);
              setEditingRetourAppel(null);
              setNewRetourForm({
                dossier_reference_id: null,
                date_appel: new Date().toISOString().split('T')[0],
                utilisateur_assigne: "",
                notes: "",
                statut: "Retour d'appel",
                client_nom: "",
                client_telephone: ""
              });
            }}
            onCancel={() => {
              setIsNewRetourDialogOpen(false);
              setEditingRetourAppel(null);
              setNewRetourForm({
                dossier_reference_id: null,
                date_appel: new Date().toISOString().split('T')[0],
                utilisateur_assigne: "",
                notes: "",
                statut: "Retour d'appel",
                client_nom: "",
                client_telephone: ""
              });
            }}
            getClientsNames={getClientsNames}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[50vw] w-[50vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50" hideClose>
              <DialogHeader className="sr-only">
                <DialogTitle>Modifier retour d'appel</DialogTitle>
              </DialogHeader>
              <NewRetourAppelForm
                formData={formData}
                setFormData={setFormData}
                users={users}
                dossiers={dossiers}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                getClientsNames={getClientsNames}
              />
            </DialogContent>
          </Dialog>

        <ClientFormDialog
          open={isClientFormDialogOpen}
          onOpenChange={(open) => { setIsClientFormDialogOpen(open); if (!open) setEditingClientForForm(null); }}
          editingClient={editingClientForForm}
          defaultType={clientTypeForForm}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            if (clientTypeForForm === "Client") setIsClientSelectorOpen(true);
            if (clientTypeForForm === "Notaire") setIsNotaireSelectorOpen(true);
            if (clientTypeForForm === "Courtier immobilier") setIsCourtierSelectorOpen(true);
          }}
        />

        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden p-6">
              {viewingClientDetails && <ClientDetailView client={viewingClientDetails} onClose={() => setViewingClientDetails(null)} />}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0">
              <DialogTitle className="text-2xl">Détails - {viewingDossier && `${getArpenteurInitials(viewingDossier.arpenteur_geometre)}${viewingDossier.numero_dossier}`}</DialogTitle>
            </DialogHeader>
            {viewingDossier && (
              <div className="flex h-[calc(90vh-80px)]">
                <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div>
                        <Label className="text-slate-400 text-sm">Arpenteur-géomètre</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.arpenteur_geometre}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Utilisateur assigné</Label>
                        <p className="text-white font-medium mt-1">{users.find(u => u.email === viewingDossier.utilisateur_assigne)?.full_name || viewingDossier.utilisateur_assigne || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-slate-400 text-sm">Date de création</Label>
                        <p className="text-white font-medium mt-1">{viewingDossier.created_date ? format(new Date(viewingDossier.created_date), "dd MMMM yyyy", { locale: fr }) : '-'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {viewingDossier.clients_ids?.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Clients</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.clients_ids.map(clientId => {
                              const client = getClientById(clientId);
                              return client ? (
                                <Badge key={clientId} className="bg-blue-500/20 text-blue-400 border-blue-500/30 border w-full justify-start cursor-pointer hover:bg-blue-500/30" onClick={() => { setIsViewDialogOpen(false); setViewingClientDetails(client); }}>
                                  {client.prenom} {client.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      {viewingDossier.notaires_ids?.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Notaires</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.notaires_ids.map(notaireId => {
                              const notaire = getClientById(notaireId);
                              return notaire ? (
                                <Badge key={notaireId} className="bg-purple-500/20 text-purple-400 border-purple-500/30 border w-full justify-start cursor-pointer hover:bg-purple-500/30" onClick={() => { setIsViewDialogOpen(false); setViewingClientDetails(notaire); }}>
                                  {notaire.prenom} {notaire.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      {viewingDossier.courtiers_ids?.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm mb-2 block">Courtiers</Label>
                          <div className="flex flex-col gap-2">
                            {viewingDossier.courtiers_ids.map(courtierId => {
                              const courtier = getClientById(courtierId);
                              return courtier ? (
                                <Badge key={courtierId} className="bg-orange-500/20 text-orange-400 border-orange-500/30 border w-full justify-start cursor-pointer hover:bg-orange-500/30" onClick={() => { setIsViewDialogOpen(false); setViewingClientDetails(courtier); }}>
                                  {courtier.prenom} {courtier.nom}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
                    <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
                    <Button type="button" className="bg-gradient-to-r from-blue-500 to-cyan-600" onClick={handleEditFromView}>
                      <Edit className="w-4 h-4 mr-2" /> Modifier
                    </Button>
                  </div>
                </div>

                <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Commentaires</h3>
                  </div>
                  <div className="flex-1 overflow-hidden p-4">
                    <CommentairesSection dossierId={viewingDossier?.id} dossierTemporaire={false} />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingRaison} onOpenChange={(open) => !open && setViewingRaison(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Raison de l'appel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">
                {viewingRaison?.raison}
              </p>
              <div className="flex justify-end">
                <Button onClick={() => setViewingRaison(null)} className="bg-slate-700 hover:bg-slate-600">
                  Fermer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Card avec filtres comme page Dossiers */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-2">
              {/* Tabs pour les statuts */}
              <div className="flex w-full border-b border-slate-700">
                <button
                  role="tab"
                  onClick={() => setActiveListTab("retour_appel")}
                  className={`retour-appel-tab flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "retour_appel"
                      ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                      : "border-transparent text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/5"
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Retour d'appel
                  <Badge className={`ml-1 ${activeListTab === "retour_appel" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-700 text-slate-300"}`}>
                    {retoursAppels.filter(r => r.statut === "Retour d'appel").length}
                  </Badge>
                </button>
                <button
                  role="tab"
                  onClick={() => setActiveListTab("message_laisse")}
                  className={`message-laisse-tab flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "message_laisse"
                      ? "border-orange-500 text-orange-400 bg-orange-500/10"
                      : "border-transparent text-slate-400 hover:text-orange-400 hover:bg-orange-500/5"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message laissé / Aucune réponse
                  <Badge className={`ml-1 ${activeListTab === "message_laisse" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" : "bg-slate-700 text-slate-300"}`}>
                    {retoursAppels.filter(r => r.statut === "Message laissé" || r.statut === "Aucune réponse").length}
                  </Badge>
                </button>
                <button
                  role="tab"
                  onClick={() => setActiveListTab("termine")}
                  className={`termine-tab flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                    activeListTab === "termine"
                      ? "border-blue-500 text-blue-400 bg-blue-500/10"
                      : "border-transparent text-slate-400 hover:text-blue-400 hover:bg-blue-500/5"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Terminé
                  <Badge className={`ml-1 ${activeListTab === "termine" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-slate-700 text-slate-300"}`}>
                    {retoursAppels.filter(r => r.statut === "Terminé").length}
                  </Badge>
                </button>
              </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchRetoursAppel}
                    onChange={(e) => setSearchRetoursAppel(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                  />
                </div>

                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="h-9 px-3 text-slate-400 hover:text-slate-300 hover:bg-slate-800/50 relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  <span className="text-sm">Filtres</span>
                  {(filterArpenteurs.length > 0 || filterUtilisateurs.length > 0 || filterDateStart || filterDateEnd) && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {filterArpenteurs.length + filterUtilisateurs.length + (filterDateStart ? 1 : 0) + (filterDateEnd ? 1 : 0)}
                    </Badge>
                  )}
                  {isFiltersOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
              </div>

              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleContent>
                  <div className="p-2 border border-emerald-500/30 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30">
                        <div className="flex items-center gap-2">
                          <Filter className="w-3 h-3 text-emerald-500" />
                          <h4 className="text-xs font-semibold text-emerald-500">Filtrer</h4>
                        </div>
                        {(filterArpenteurs.length > 0 || filterUtilisateurs.length > 0 || filterDateStart || filterDateEnd) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFilterArpenteurs([]);
                              setFilterUtilisateurs([]);
                              setFilterDateStart("");
                              setFilterDateEnd("");
                            }}
                            className="h-6 text-xs text-emerald-500 hover:text-emerald-400 px-2"
                          >
                            <X className="w-2.5 h-2.5 mr-1" />
                            Réinitialiser
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Arpenteurs ({filterArpenteurs.length > 0 ? `${filterArpenteurs.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {ARPENTEURS.map((arp) => (
                              <DropdownMenuCheckboxItem
                                key={arp}
                                checked={filterArpenteurs.includes(arp)}
                                onCheckedChange={(checked) => {
                                  setFilterArpenteurs(
                                    checked
                                      ? [...filterArpenteurs, arp]
                                      : filterArpenteurs.filter((a) => a !== arp)
                                  );
                                }}
                                className="text-white"
                              >
                                {arp}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full text-emerald-500 justify-between h-8 text-xs px-2 bg-transparent border-0 hover:bg-emerald-500/10">
                              <span className="truncate">Utilisateurs ({filterUtilisateurs.length > 0 ? `${filterUtilisateurs.length}` : 'Tous'})</span>
                              <ChevronDown className="w-3 h-3 flex-shrink-0" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            {users.map((user) => (
                              <DropdownMenuCheckboxItem
                                key={user.email}
                                checked={filterUtilisateurs.includes(user.email)}
                                onCheckedChange={(checked) => {
                                  setFilterUtilisateurs(
                                    checked
                                      ? [...filterUtilisateurs, user.email]
                                      : filterUtilisateurs.filter((u) => u !== user.email)
                                  );
                                }}
                                className="text-white"
                              >
                                {user.full_name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-emerald-500/30">
                        <Label className="text-xs text-emerald-500">Période</Label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="date"
                            value={filterDateStart}
                            onChange={(e) => setFilterDateStart(e.target.value)}
                            placeholder="Du"
                            className="flex-1 text-emerald-500 h-8 text-xs px-2 border-none bg-transparent"
                          />
                          <span className="text-emerald-500 text-xs">→</span>
                          <Input
                            type="date"
                            value={filterDateEnd}
                            onChange={(e) => setFilterDateEnd(e.target.value)}
                            placeholder="Au"
                            className="flex-1 text-emerald-500 h-8 text-xs px-2 border-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
            </div>
          </CardHeader>
        </Card>

        {/* Table des retours d'appel */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                    <TableHead className="text-slate-300 text-xs">Dossier</TableHead>
                    <TableHead className="text-slate-300 text-xs">Clients</TableHead>
                    <TableHead className="text-slate-300 text-xs">N° de téléphone</TableHead>
                    <TableHead className="text-slate-300 text-xs">Utilisateur assigné</TableHead>
                    <TableHead className="text-slate-300 text-xs">Date de l'appel</TableHead>
                    <TableHead className="text-slate-300 text-xs">Raison</TableHead>
                    <TableHead className="text-slate-300 text-xs">Statut</TableHead>
                    <TableHead className="text-slate-300 text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAllRetoursAppels.map((retour) => {
                    const dossier = dossiers.find(d => d.id === retour.dossier_id);
                    const firstClient = dossier?.clients_ids?.[0] ? getClientById(dossier.clients_ids[0]) : null;
                    const phoneNumber = retour.client_telephone || (firstClient?.telephones?.find(t => t.actuel)?.telephone || firstClient?.telephones?.[0]?.telephone || "-");
                    
                    return (
                      <TableRow 
                        key={retour.id} 
                        className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                        onClick={() => {
                          setEditingRetourAppel(retour);
                          setNewRetourForm({
                            dossier_reference_id: retour.dossier_id,
                            date_appel: retour.date_appel,
                            utilisateur_assigne: retour.utilisateur_assigne || "",
                            notes: retour.raison || "",
                            statut: retour.statut,
                            client_nom: retour.client_nom || "",
                            client_telephone: retour.client_telephone || ""
                          });
                          setIsNewRetourDialogOpen(true);
                        }}>
                        <TableCell className="font-medium">
                          {dossier ? (
                            <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                              {dossier.numero_dossier ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}` : getArpenteurInitials(dossier.arpenteur_geometre).slice(0, -1)}
                            </Badge>
                          ) : (
                            <span className="text-slate-500 text-xs">Aucun dossier</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs max-w-xs truncate">
                          {retour.client_nom || (dossier ? getClientsNames(dossier.clients_ids) : "-")}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          {phoneNumber !== "-" ? (
                            <a 
                              href={`tel:${phoneNumber.replace(/\D/g, '')}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                            >
                              {formatPhoneNumber(phoneNumber)}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                        {retour.utilisateur_assigne ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              {users.find(u => u.email === retour.utilisateur_assigne)?.photo_url ? (
                                <img 
                                  src={users.find(u => u.email === retour.utilisateur_assigne).photo_url} 
                                  alt={(users.find(u => u.email === retour.utilisateur_assigne)?.full_name || retour.utilisateur_assigne)}
                                  className="w-full h-full object-cover rounded-full"
                                />
                              ) : (
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                                  {(users.find(u => u.email === retour.utilisateur_assigne)?.full_name || retour.utilisateur_assigne)
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <span className="text-xs">{users.find(u => u.email === retour.utilisateur_assigne)?.full_name || retour.utilisateur_assigne}</span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">{retour.date_appel ? format(new Date(retour.date_appel), "dd MMM yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell className="text-slate-300 text-xs max-w-[200px] group relative">
                        {retour.raison ? (
                          <>
                            <span className="line-clamp-1 cursor-help">{retour.raison}</span>
                            <div className="absolute left-0 top-full mt-2 hidden group-hover:block bg-slate-800 border border-slate-700 rounded-lg p-3 w-48 z-[9999] text-slate-300 text-xs whitespace-normal break-words shadow-lg">
                              {retour.raison}
                            </div>
                          </>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={retour.statut}
                          onValueChange={async (newStatut) => {
                            if (user?.email === retour.utilisateur_assigne || user?.role === 'admin') {
                              await base44.entities.RetourAppel.update(retour.id, {
                                ...retour,
                                statut: newStatut
                              });
                              queryClient.invalidateQueries({ queryKey: ['retoursAppels'] });
                            } else {
                              alert("Seul l'utilisateur assigné peut modifier le statut");
                            }
                          }}
                          disabled={user?.email !== retour.utilisateur_assigne && user?.role !== 'admin'}
                        >
                          <SelectTrigger className={`border-slate-600 h-8 text-xs w-36 ${
                            retour.statut === "Retour d'appel" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                            retour.statut === "Message laissé" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                            retour.statut === "Aucune réponse" ? "bg-slate-700 text-red-400" :
                            "bg-slate-700 text-white"
                          } ${user?.email !== retour.utilisateur_assigne && user?.role !== 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="Retour d'appel" className="text-white text-xs">Retour d'appel</SelectItem>
                            <SelectItem value="Message laissé" className="text-white text-xs">Message laissé</SelectItem>
                            <SelectItem value="Aucune réponse" className="text-white text-xs">Aucune réponse</SelectItem>
                            <SelectItem value="Terminé" className="text-white text-xs">Terminé</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(retour.id)} 
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {sortedAllRetoursAppels.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-500">Aucun retour d'appel</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </>
  );
});

export default RetoursAppel;