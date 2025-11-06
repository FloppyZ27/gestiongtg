
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2, UserPlus, Search } from "lucide-react"; // Added Search icon
import CommentairesSection from "./CommentairesSection";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"; // New imports

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];
const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];

export default function EditDossierDialog({
  isOpen,
  onClose,
  dossier,
  onSuccess
}) {
  const queryClient = useQueryClient();
  const [activeTabMandat, setActiveTabMandat] = useState("0");

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const { data: allLots = [] } = useQuery({ // Fetch all lots
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list(),
    initialData: [],
  });

  const clientsOnly = clients.filter(c => c.type_client === "Client");
  const notaires = clients.filter(c => c.type_client === "Notaire");
  const courtiers = clients.filter(c => c.type_client === "Courtier immobilier");

  const [dossierForm, setDossierForm] = useState({
    numero_dossier: "",
    arpenteur_geometre: "",
    date_ouverture: "",
    statut: "Ouvert",
    utilisateur_assigne: "",
    clients_ids: [],
    notaires_ids: [],
    courtiers_ids: [],
    mandats: [],
    description: ""
  });

  // State for Lot Selector Dialog
  const [isLotSelectorOpen, setIsLotSelectorOpen] = useState(false);
  const [lotSearchTerm, setLotSearchTerm] = useState("");
  const [lotCirconscriptionFilter, setLotCirconscriptionFilter] = useState("all");
  const [lotCadastreFilter, setLotCadastreFilter] = useState("Québec"); // Initial value "Québec" as per outline
  const [currentMandatIndex, setCurrentMandatIndex] = useState(null); // To know which mandat we are editing lots for

  const filteredLotsForSelector = allLots.filter(lot => {
    const matchesSearchTerm =
      lot.numero_lot.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      lot.circonscription_fonciere.toLowerCase().includes(lotSearchTerm.toLowerCase()) ||
      (lot.cadastre && lot.cadastre.toLowerCase().includes(lotSearchTerm.toLowerCase())) ||
      (lot.rang && lot.rang.toLowerCase().includes(lotSearchTerm.toLowerCase()));

    const matchesCirconscription =
      lotCirconscriptionFilter === "all" || lot.circonscription_fonciere === lotCirconscriptionFilter;

    // Assuming lot.cadastre can be null or undefined
    const matchesCadastre =
      lotCadastreFilter === "all" || (lot.cadastre && lot.cadastre === lotCadastreFilter);

    return matchesSearchTerm && matchesCirconscription && matchesCadastre;
  });

  const openLotSelector = (index) => {
    setCurrentMandatIndex(index);
    setIsLotSelectorOpen(true);
  };

  const addLotToCurrentMandat = (lotId) => {
    if (currentMandatIndex === null) return;

    const updatedMandats = [...dossierForm.mandats];
    const currentMandat = updatedMandats[currentMandatIndex];
    const currentLots = currentMandat.lots || [];

    if (currentLots.includes(lotId)) {
      // Remove lot if already present
      updatedMandats[currentMandatIndex] = {
        ...currentMandat,
        lots: currentLots.filter(id => id !== lotId)
      };
    } else {
      // Add lot if not present
      updatedMandats[currentMandatIndex] = {
        ...currentMandat,
        lots: [...currentLots, lotId]
      };
    }
    setDossierForm({...dossierForm, mandats: updatedMandats});
  };

  useEffect(() => {
    if (dossier) {
      setDossierForm({
        numero_dossier: dossier.numero_dossier || "",
        arpenteur_geometre: dossier.arpenteur_geometre || "",
        date_ouverture: dossier.date_ouverture || "",
        statut: dossier.statut || "Ouvert",
        utilisateur_assigne: dossier.utilisateur_assigne || "",
        clients_ids: dossier.clients_ids || [],
        notaires_ids: dossier.notaires_ids || [],
        courtiers_ids: dossier.courtiers_ids || [],
        mandats: dossier.mandats && dossier.mandats.length > 0 ? dossier.mandats.map(m => ({
          ...m,
          adresse_travaux: m.adresse_travaux || {
            ville: "",
            numeros_civiques: [""],
            rue: "",
            code_postal: "",
            province: "Québec"
          },
          date_debut_travaux: m.date_debut_travaux || "",
          rabais: m.rabais !== undefined ? m.rabais : 0,
          taxes_incluses: m.taxes_incluses !== undefined ? m.taxes_incluses : false,
          lots: m.lots || [],
        })) : [{
          type_mandat: "",
          date_ouverture: "",
          adresse_travaux: {
            ville: "",
            numeros_civiques: [""],
            rue: "",
            code_postal: "",
            province: "Québec"
          },
          lots: [],
          prix_estime: 0,
          date_signature: "",
          date_livraison: "",
          date_debut_travaux: "",
          rabais: 0,
          taxes_incluses: false,
          notes: ""
        }],
        description: dossier.description || ""
      });
      setActiveTabMandat("0");
    }
  }, [dossier]);

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dossier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      if (onSuccess) onSuccess();
      onClose();
    },
  });

  const handleSaveDossier = (e) => {
    e.preventDefault();
    if (dossier) {
      const cleanedMandats = dossierForm.mandats.filter(mandat =>
        mandat.type_mandat ||
        mandat.prix_estime ||
        mandat.rabais ||
        mandat.taxes_incluses ||
        mandat.date_ouverture ||
        mandat.date_signature ||
        mandat.date_livraison ||
        mandat.date_debut_travaux ||
        (mandat.adresse_travaux && (mandat.adresse_travaux.rue || mandat.adresse_travaux.ville || mandat.adresse_travaux.code_postal || (mandat.adresse_travaux.numeros_civiques && mandat.adresse_travaux.numeros_civiques.some(n => n)))) ||
        (mandat.lots && mandat.lots.length > 0) ||
        mandat.notes
      );

      updateDossierMutation.mutate({
        id: dossier.id,
        data: { ...dossierForm, mandats: cleanedMandats }
      });
    }
  };

  const updateMandat = (index, field, value) => {
    const updatedMandats = [...dossierForm.mandats];
    updatedMandats[index] = {
      ...updatedMandats[index],
      [field]: value
    };
    setDossierForm({...dossierForm, mandats: updatedMandats});
  };

  const addMandat = () => {
    const newIndex = dossierForm.mandats.length;
    setDossierForm({
      ...dossierForm,
      mandats: [...dossierForm.mandats, {
        type_mandat: "",
        date_ouverture: "",
        adresse_travaux: {
          ville: "",
          numeros_civiques: [""],
          rue: "",
          code_postal: "",
          province: "Québec"
        },
        lots: [],
        prix_estime: 0,
        date_signature: "",
        date_livraison: "",
        date_debut_travaux: "",
        rabais: 0,
        taxes_incluses: false,
        notes: ""
      }]
    });
    setActiveTabMandat(newIndex.toString());
  };

  const removeMandat = (index) => {
    const updatedMandats = dossierForm.mandats.filter((_, i) => i !== index);
    setDossierForm({...dossierForm, mandats: updatedMandats});
    if (activeTabMandat === index.toString() && updatedMandats.length > 0) {
      setActiveTabMandat(Math.max(0, index - 1).toString());
    }
  };

  const getMandatTabLabel = (mandat, index) => {
    return mandat.type_mandat || `Mandat ${index + 1}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-[95vw] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Modifier le dossier</DialogTitle>
        </DialogHeader>

        <div className="flex h-[90vh]">
          {/* Main form content - 70% */}
          <div className="flex-[0_0_70%] overflow-y-auto p-6 border-r border-slate-800">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">Modifier le dossier</h2>
            </div>

            <form id="dossier-form-edit" onSubmit={handleSaveDossier} className="space-y-6">
              {/* Première ligne: Arpenteur et Statut */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                  <Select
                    value={dossierForm.arpenteur_geometre}
                    onValueChange={(value) => setDossierForm({...dossierForm, arpenteur_geometre: value})}
                  >
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
                <div className="space-y-2">
                  <Label>Statut <span className="text-red-400">*</span></Label>
                  <Select
                    value={dossierForm.statut}
                    onValueChange={(value) => setDossierForm({...dossierForm, statut: value})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Retour d'appel" className="text-white">Retour d'appel</SelectItem>
                      <SelectItem value="Soumission" className="text-white">Soumission</SelectItem>
                      <SelectItem value="Ouvert" className="text-white">Ouvert</SelectItem>
                      <SelectItem value="Fermé" className="text-white">Fermé</SelectItem>
                      <SelectItem value="Message laissé/Sans réponse" className="text-white">Message laissé/Sans réponse</SelectItem>
                      <SelectItem value="Demande d'information" className="text-white">Demande d'information</SelectItem>
                      <SelectItem value="Nouveau mandat" className="text-white">Nouveau mandat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Créer à partir d'un dossier existant */}
              <div className="space-y-2">
                <Label className="text-slate-300">Créer à partir d'un dossier existant</Label>
                <Input
                  placeholder="Rechercher un dossier par numéro, client, etc."
                  className="bg-slate-800 border-slate-700"
                  disabled
                />
                <p className="text-xs text-slate-500">Cette fonctionnalité n'est pas disponible en mode édition</p>
              </div>

              {/* Utilisateur assigné */}
              {dossierForm.statut === "Retour d'appel" && (
                <div className="space-y-2">
                  <Label>Utilisateur assigné</Label>
                  <Select
                    value={dossierForm.utilisateur_assigne || ""}
                    onValueChange={(value) => setDossierForm({...dossierForm, utilisateur_assigne: value})}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value={null} className="text-white">Aucun utilisateur</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.email} value={u.email} className="text-white">
                          {u.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clients, Notaires et Courtiers - 3 colonnes */}
              <div className="grid grid-cols-3 gap-4">
                {/* Clients */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Clients</Label>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {dossierForm.clients_ids.length > 0 ? (
                    <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                      {dossierForm.clients_ids.map(clientId => {
                        const client = clientsOnly.find(c => c.id === clientId);
                        return client ? (
                          <Badge
                            key={clientId}
                            variant="outline"
                            className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer hover:bg-blue-500/30 relative pr-8 w-full justify-start"
                          >
                            <span className="flex-1">
                              {client.prenom} {client.nom}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDossierForm({
                                ...dossierForm,
                                clients_ids: dossierForm.clients_ids.filter(cid => cid !== clientId)
                              })}
                              className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">
                      Aucun client
                    </p>
                  )}
                </div>

                {/* Notaires */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Notaires</Label>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {dossierForm.notaires_ids.length > 0 ? (
                    <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                      {dossierForm.notaires_ids.map(notaireId => {
                        const notaire = notaires.find(n => n.id === notaireId);
                        return notaire ? (
                          <Badge
                            key={notaireId}
                            variant="outline"
                            className="bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-pointer hover:bg-purple-500/30 relative pr-8 w-full justify-start"
                          >
                            <span className="flex-1">
                              {notaire.prenom} {notaire.nom}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDossierForm({
                                ...dossierForm,
                                notaires_ids: dossierForm.notaires_ids.filter(nid => nid !== notaireId)
                              })}
                              className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">
                      Aucun notaire
                    </p>
                  )}
                </div>

                {/* Courtiers */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <Label>Courtiers immobiliers</Label>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {dossierForm.courtiers_ids.length > 0 ? (
                    <div className="flex flex-col gap-2 p-3 bg-slate-800/30 rounded-lg min-h-[100px]">
                      {dossierForm.courtiers_ids.map(courtierId => {
                        const courtier = courtiers.find(c => c.id === courtierId);
                        return courtier ? (
                          <Badge
                            key={courtierId}
                            variant="outline"
                            className="bg-orange-500/20 text-orange-400 border-orange-500/30 cursor-pointer hover:bg-orange-500/30 relative pr-8 w-full justify-start"
                          >
                            <span className="flex-1">
                              {courtier.prenom} {courtier.nom}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDossierForm({
                                ...dossierForm,
                                courtiers_ids: dossierForm.courtiers_ids.filter(cid => cid !== courtierId)
                              })}
                              className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8 bg-slate-800/30 rounded-lg">
                      Aucun courtier
                    </p>
                  )}
                </div>
              </div>

              {/* Mandats Section avec Tabs */}
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

                {dossierForm.mandats.length > 0 ? (
                  <Tabs value={activeTabMandat} onValueChange={setActiveTabMandat} className="w-full">
                    <TabsList className="bg-slate-800/50 border border-slate-700 w-full h-auto justify-start">
                      {dossierForm.mandats.map((mandat, index) => (
                        <TabsTrigger
                          key={index}
                          value={index.toString()}
                          className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 text-slate-400"
                        >
                          {getMandatTabLabel(mandat, index)}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {dossierForm.mandats.map((mandat, index) => (
                      <TabsContent key={index} value={index.toString()}>
                        <Card className="border-slate-700 bg-slate-800/30">
                          <CardContent className="p-4 space-y-4">
                            {/* Type de mandat et bouton supprimer sur la même ligne */}
                            <div className="flex gap-4 items-start">
                              <div className="flex-1 space-y-2">
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
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => removeMandat(index)}
                                className="text-red-400 hover:text-red-300 mt-8"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer ce mandat
                              </Button>
                            </div>

                            {/* Nouvelle mise en page : 70% gauche / 30% droite */}
                            <div className="grid grid-cols-[70%_30%] gap-4">
                              {/* Colonne gauche - Adresse dans un encadré */}
                              <div className="space-y-3 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                                <Label className="text-slate-300 font-semibold">Adresse des travaux</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm">Numéro(s) civique(s)</Label>
                                    {(mandat.adresse_travaux?.numeros_civiques || [""]).map((num, civicIdx) => (
                                      <div key={civicIdx} className="flex gap-2 items-center">
                                        <Input
                                          value={num}
                                          onChange={(e) => {
                                            const updated = [...dossierForm.mandats];
                                            const civics = updated[index].adresse_travaux?.numeros_civiques || [""];
                                            civics[civicIdx] = e.target.value;
                                            updated[index] = {
                                              ...updated[index],
                                              adresse_travaux: {
                                                ...updated[index].adresse_travaux,
                                                numeros_civiques: civics
                                              }
                                            };
                                            setDossierForm({...dossierForm, mandats: updated});
                                          }}
                                          placeholder="Ex: 1850"
                                          className="bg-slate-700 border-slate-600 text-white"
                                        />
                                        {civicIdx > 0 && (
                                          <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                              const updated = [...dossierForm.mandats];
                                              const civics = updated[index].adresse_travaux?.numeros_civiques || [""];
                                              civics.splice(civicIdx, 1);
                                              updated[index] = {
                                                ...updated[index],
                                                adresse_travaux: {
                                                  ...updated[index].adresse_travaux,
                                                  numeros_civiques: civics
                                                }
                                              };
                                              setDossierForm({...dossierForm, mandats: updated});
                                            }}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => {
                                        const updated = [...dossierForm.mandats];
                                        const civics = updated[index].adresse_travaux?.numeros_civiques || [""];
                                        updated[index] = {
                                          ...updated[index],
                                          adresse_travaux: {
                                            ...updated[index].adresse_travaux,
                                            numeros_civiques: [...civics, ""]
                                          }
                                        };
                                        setDossierForm({...dossierForm, mandats: updated});
                                      }}
                                      className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Ajouter un numéro
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm">Rue</Label>
                                    <Input
                                      value={mandat.adresse_travaux?.rue || ""}
                                      onChange={(e) => {
                                        const updated = [...dossierForm.mandats];
                                        updated[index] = {
                                          ...updated[index],
                                          adresse_travaux: {
                                            ...updated[index].adresse_travaux,
                                            rue: e.target.value
                                          }
                                        };
                                        setDossierForm({...dossierForm, mandats: updated});
                                      }}
                                      placeholder="Nom de la rue"
                                      className="bg-slate-700 border-slate-600 text-white"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm">Ville</Label>
                                    <Input
                                      value={mandat.adresse_travaux?.ville || ""}
                                      onChange={(e) => {
                                        const updated = [...dossierForm.mandats];
                                        updated[index] = {
                                          ...updated[index],
                                          adresse_travaux: {
                                            ...updated[index].adresse_travaux,
                                            ville: e.target.value
                                          }
                                        };
                                        setDossierForm({...dossierForm, mandats: updated});
                                      }}
                                      placeholder="Ville"
                                      className="bg-slate-700 border-slate-600 text-white"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-slate-300 text-sm">Province</Label>
                                    <Input
                                      value={mandat.adresse_travaux?.province || "Québec"}
                                      onChange={(e) => {
                                        const updated = [...dossierForm.mandats];
                                        updated[index] = {
                                          ...updated[index],
                                          adresse_travaux: {
                                            ...updated[index].adresse_travaux,
                                            province: e.target.value
                                          }
                                        };
                                        setDossierForm({...dossierForm, mandats: updated});
                                      }}
                                      placeholder="Province"
                                      className="bg-slate-700 border-slate-600 text-white"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-slate-300 text-sm">Code postal</Label>
                                  <Input
                                    value={mandat.adresse_travaux?.code_postal || ""}
                                    onChange={(e) => {
                                      const updated = [...dossierForm.mandats];
                                      updated[index] = {
                                        ...updated[index],
                                        adresse_travaux: {
                                          ...updated[index].adresse_travaux,
                                          code_postal: e.target.value
                                        }
                                      };
                                      setDossierForm({...dossierForm, mandats: updated});
                                    }}
                                    placeholder="Code postal"
                                    className="bg-slate-700 border-slate-600 text-white"
                                  />
                                </div>
                              </div>

                              {/* Colonne droite - Dates */}
                              <div className="space-y-3 pr-4">
                                <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg space-y-3">
                                  <div className="space-y-2">
                                    <Label className="text-left block text-sm">Date d'ouverture</Label>
                                    <Input
                                      type="date"
                                      value={mandat.date_ouverture || ""}
                                      onChange={(e) => updateMandat(index, 'date_ouverture', e.target.value)}
                                      className="bg-slate-700 border-slate-600"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-left block text-sm">Date de signature</Label>
                                    <Input
                                      type="date"
                                      value={mandat.date_signature || ""}
                                      onChange={(e) => updateMandat(index, 'date_signature', e.target.value)}
                                      className="bg-slate-700 border-slate-600"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-left block text-sm">Début des travaux</Label>
                                    <Input
                                      type="date"
                                      value={mandat.date_debut_travaux || ""}
                                      onChange={(e) => updateMandat(index, 'date_debut_travaux', e.target.value)}
                                      className="bg-slate-700 border-slate-600"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-left block text-sm">Date de livraison</Label>
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
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => openLotSelector(index)} // Open lot selector for this mandat
                                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Sélectionner des lots
                                </Button>
                              </div>

                              {mandat.lots && mandat.lots.length > 0 ? (
                                <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                                  <div className="flex flex-wrap gap-2">
                                    {mandat.lots.map((lotId) => {
                                      const lot = allLots.find(l => l.id === lotId); // Find the actual lot object
                                      return lot ? (
                                        <Badge key={lotId} variant="outline" className="bg-slate-700 relative pr-8">
                                          {lot.numero_lot}
                                          <button
                                            type="button"
                                            onClick={() => addLotToCurrentMandat(lotId)} // Use add/remove logic
                                            className="absolute right-1 top-1/2 -translate-y-1/2 hover:text-red-400"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-500 text-sm text-center py-4 bg-slate-800/30 rounded-lg">
                                  Aucun lot sélectionné
                                </p>
                              )}
                            </div>

                            <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg space-y-3">
                              <h4 className="text-sm font-semibold text-slate-300">Tarification</h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                  <Label>Prix estimé ($)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={mandat.prix_estime || ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      updateMandat(index, 'prix_estime', value ? parseFloat(value) : 0);
                                    }}
                                    placeholder="0.00"
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Rabais ($)</Label>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={mandat.rabais || ""}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/[^0-9.]/g, '');
                                      updateMandat(index, 'rabais', value ? parseFloat(value) : 0);
                                    }}
                                    placeholder="0.00"
                                    className="bg-slate-700 border-slate-600"
                                  />
                                </div>
                                <div className="space-y-2 flex items-center pt-8">
                                  <input
                                    type="checkbox"
                                    id={`taxes_incluses_${index}`}
                                    checked={mandat.taxes_incluses}
                                    onChange={(e) => updateMandat(index, 'taxes_incluses', e.target.checked)}
                                    className="form-checkbox h-4 w-4 text-emerald-600 transition duration-150 ease-in-out bg-slate-700 border-slate-600 rounded"
                                  />
                                  <label htmlFor={`taxes_incluses_${index}`} className="ml-2 text-slate-300 text-sm">
                                    Taxes incluses
                                  </label>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center py-8 text-slate-400 bg-slate-800/30 rounded-lg">
                    Aucun mandat. Cliquez sur "Ajouter un mandat" pour commencer.
                  </div>
                )}
              </div>
            </form>

            {/* Boutons Annuler/Modifier tout en bas */}
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-slate-900/95 backdrop-blur py-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                form="dossier-form-edit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Modifier
              </Button>
            </div>
          </div>

          {/* Right side - Commentaires Sidebar - 30% */}
          <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Commentaires</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <CommentairesSection
                dossierId={dossier?.id}
                dossierTemporaire={false}
              />
            </div>
          </div>
        </div>

        {/* Lot Selector Dialog */}
        <Dialog open={isLotSelectorOpen} onOpenChange={(open) => {
          setIsLotSelectorOpen(open);
          if (!open) {
            setLotSearchTerm("");
            setCurrentMandatIndex(null);
            setLotCirconscriptionFilter("all"); // Reset filter
            setLotCadastreFilter("Québec"); // Reset filter
          }
        }}>
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
                    <SelectItem value="Lac-Saint-Jean-Est" className="text-white">Lac-Saint-Jean-Est</SelectItem>
                    <SelectItem value="Lac-Saint-Jean-Ouest" className="text-white">Lac-Saint-Jean-Ouest</SelectItem>
                    <SelectItem value="Chicoutimi" className="text-white">Chicoutimi</SelectItem>
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
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
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
                          dossierForm.mandats[currentMandatIndex]?.lots?.includes(lot.id);
                        return (
                          <TableRow
                            key={lot.id}
                            className={`cursor-pointer transition-colors border-slate-800 ${
                              isSelected
                                ? 'bg-emerald-500/20 hover:bg-emerald-500/30'
                                : 'hover:bg-slate-800/30'
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

              <Button onClick={() => setIsLotSelectorOpen(false)} className="w-full bg-emerald-500 hover:bg-emerald-600">
                Valider la sélection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
