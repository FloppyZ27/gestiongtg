import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, Truck, Wrench, Edit, Trash2, Calendar, FolderOpen, Search, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import PlanningCalendar from "@/components/terrain/PlanningCalendar";

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

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

export default function GestionEquipeTerrain() {

  const [isEmployeDialogOpen, setIsEmployeDialogOpen] = useState(false);
  const [isVehiculeDialogOpen, setIsVehiculeDialogOpen] = useState(false);
  const [isEquipementDialogOpen, setIsEquipementDialogOpen] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [editingVehicule, setEditingVehicule] = useState(null);
  const [editingEquipement, setEditingEquipement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const queryClient = useQueryClient();

  const { data: employes = [] } = useQuery({
    queryKey: ['employes'],
    queryFn: () => base44.entities.Employe.list(),
    initialData: [],
  });

  const { data: vehicules = [] } = useQuery({
    queryKey: ['vehicules'],
    queryFn: () => base44.entities.Vehicule.list(),
    initialData: [],
  });

  const { data: equipements = [] } = useQuery({
    queryKey: ['equipements'],
    queryFn: () => base44.entities.Equipement.list(),
    initialData: [],
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const techniciensTerrain = employes.filter(e => e.poste === "Technicien Terrain" && e.statut === "Actif");

  const dossiersCedule = dossiers.filter(d => 
    d.statut === "Ouvert" && 
    d.mandats?.some(m => m.tache_actuelle === "Cédule")
  ).flatMap(dossier => {
    const mandatsCedule = dossier.mandats.filter(m => m.tache_actuelle === "Cédule");
    return mandatsCedule.map(mandat => ({
      ...dossier,
      mandatInfo: mandat
    }));
  });

  const getClientById = (id) => clients.find(c => c.id === id);

  const getClientsNames = (clientIds) => {
    if (!clientIds || clientIds.length === 0) return "-";
    return clientIds.map(id => {
      const client = getClientById(id);
      return client ? `${client.prenom} ${client.nom}` : "";
    }).filter(name => name).join(", ");
  };

  const formatAdresse = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
      parts.push(addr.numeros_civiques.filter(n => n).join(', '));
    }
    if (addr.rue) parts.push(addr.rue);
    if (addr.ville) parts.push(addr.ville);
    return parts.filter(p => p).join(', ');
  };

  // Mutations Employés
  const createEmployeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employe.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      setIsEmployeDialogOpen(false);
      setEditingEmploye(null);
    },
  });

  const updateEmployeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employe.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      setIsEmployeDialogOpen(false);
      setEditingEmploye(null);
    },
  });

  const deleteEmployeMutation = useMutation({
    mutationFn: (id) => base44.entities.Employe.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
    },
  });

  // Mutations Véhicules
  const createVehiculeMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
      setIsVehiculeDialogOpen(false);
      setEditingVehicule(null);
    },
  });

  const updateVehiculeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
      setIsVehiculeDialogOpen(false);
      setEditingVehicule(null);
    },
  });

  const deleteVehiculeMutation = useMutation({
    mutationFn: (id) => base44.entities.Vehicule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicules'] });
    },
  });

  // Mutations Équipements
  const createEquipementMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipements'] });
      setIsEquipementDialogOpen(false);
      setEditingEquipement(null);
    },
  });

  const updateEquipementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipements'] });
      setIsEquipementDialogOpen(false);
      setEditingEquipement(null);
    },
  });

  const deleteEquipementMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipements'] });
    },
  });

  const updateDossierMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dossier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
    },
  });

  const handleViewDossier = (dossier) => {
    const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
    window.open(url, '_blank');
  };

  const filteredDossiersCedule = dossiersCedule.filter(d => {
    const searchLower = searchTerm.toLowerCase();
    const fullNumber = getArpenteurInitials(d.arpenteur_geometre) + d.numero_dossier;
    const clientsNames = getClientsNames(d.clients_ids);
    return (
      fullNumber.toLowerCase().includes(searchLower) ||
      d.numero_dossier?.toLowerCase().includes(searchLower) ||
      clientsNames.toLowerCase().includes(searchLower) ||
      formatAdresse(d.mandatInfo?.adresse_travaux).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Gestion Équipe Terrain
            </h1>
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-slate-400">Gestion des techniciens, véhicules et équipements</p>
        </div>

        <PlanningCalendar 
          dossiers={dossiersCedule}
          techniciens={techniciensTerrain}
          vehicules={vehicules}
          equipements={equipements}
          clients={clients}
          onUpdateDossier={(id, data) => updateDossierMutation.mutate({ id, data })}
          onAddTechnicien={() => {
            setEditingEmploye(null);
            setIsEmployeDialogOpen(true);
          }}
          onAddVehicule={() => {
            setEditingVehicule(null);
            setIsVehiculeDialogOpen(true);
          }}
          onAddEquipement={() => {
            setEditingEquipement(null);
            setIsEquipementDialogOpen(true);
          }}
          onEditTechnicien={(tech) => {
            setEditingEmploye(tech);
            setIsEmployeDialogOpen(true);
          }}
          onDeleteTechnicien={(id) => {
            if (confirm('Supprimer ce technicien ?')) {
              deleteEmployeMutation.mutate(id);
            }
          }}
          onEditVehicule={(vehicule) => {
            setEditingVehicule(vehicule);
            setIsVehiculeDialogOpen(true);
          }}
          onDeleteVehicule={(id) => {
            if (confirm('Supprimer ce véhicule ?')) {
              deleteVehiculeMutation.mutate(id);
            }
          }}
          onEditEquipement={(equipement) => {
            setEditingEquipement(equipement);
            setIsEquipementDialogOpen(true);
          }}
          onDeleteEquipement={(id) => {
            if (confirm('Supprimer cet équipement ?')) {
              deleteEquipementMutation.mutate(id);
            }
          }}
        />

        {/* Dialogs cachés - conservés mais hors des tabs */}
        <div style={{ display: 'none' }}>
          <div value="employes">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Techniciens Terrain</CardTitle>
                  <Button onClick={() => {
                    setEditingEmploye(null);
                    setIsEmployeDialogOpen(true);
                  }} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau technicien
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">Nom</TableHead>
                      <TableHead className="text-slate-300">Poste</TableHead>
                      <TableHead className="text-slate-300">Téléphone</TableHead>
                      <TableHead className="text-slate-300">Courriel</TableHead>
                      <TableHead className="text-slate-300">Statut</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employes.map(employe => (
                      <TableRow key={employe.id} className="border-slate-800">
                        <TableCell className="text-white font-medium">
                          {employe.prenom} {employe.nom}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            {employe.poste}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{employe.telephone || "-"}</TableCell>
                        <TableCell className="text-slate-300">{employe.courriel || "-"}</TableCell>
                        <TableCell>
                          <Badge className={
                            employe.statut === "Actif" ? "bg-green-500/20 text-green-400" :
                            employe.statut === "En congé" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-red-500/20 text-red-400"
                          }>
                            {employe.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setEditingEmploye(employe);
                                setIsEmployeDialogOpen(true);
                              }}
                              className="text-cyan-400 hover:bg-cyan-500/10">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                if (confirm(`Supprimer ${employe.prenom} ${employe.nom} ?`)) {
                                  deleteEmployeMutation.mutate(employe.id);
                                }
                              }}
                              className="text-red-400 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            </div>

            <div value="vehicules">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Véhicules</CardTitle>
                  <Button onClick={() => {
                    setEditingVehicule(null);
                    setIsVehiculeDialogOpen(true);
                  }} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau véhicule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">Nom</TableHead>
                      <TableHead className="text-slate-300">Marque/Modèle</TableHead>
                      <TableHead className="text-slate-300">Plaque</TableHead>
                      <TableHead className="text-slate-300">Assigné à</TableHead>
                      <TableHead className="text-slate-300">Statut</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicules.map(vehicule => {
                      const employe = employes.find(e => e.id === vehicule.assigne_a);
                      return (
                        <TableRow key={vehicule.id} className="border-slate-800">
                          <TableCell className="text-white font-medium">{vehicule.nom}</TableCell>
                          <TableCell className="text-slate-300">
                            {vehicule.marque} {vehicule.modele} {vehicule.annee ? `(${vehicule.annee})` : ''}
                          </TableCell>
                          <TableCell className="text-slate-300">{vehicule.plaque || "-"}</TableCell>
                          <TableCell className="text-slate-300">
                            {employe ? `${employe.prenom} ${employe.nom}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              vehicule.statut === "Disponible" ? "bg-green-500/20 text-green-400" :
                              vehicule.statut === "En service" ? "bg-blue-500/20 text-blue-400" :
                              vehicule.statut === "En réparation" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }>
                              {vehicule.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setEditingVehicule(vehicule);
                                  setIsVehiculeDialogOpen(true);
                                }}
                                className="text-cyan-400 hover:bg-cyan-500/10">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  if (confirm(`Supprimer ${vehicule.nom} ?`)) {
                                    deleteVehiculeMutation.mutate(vehicule.id);
                                  }
                                }}
                                className="text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div value="equipements">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Équipements</CardTitle>
                  <Button onClick={() => {
                    setEditingEquipement(null);
                    setIsEquipementDialogOpen(true);
                  }} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvel équipement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">Nom</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Numéro de série</TableHead>
                      <TableHead className="text-slate-300">Assigné à</TableHead>
                      <TableHead className="text-slate-300">Statut</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipements.map(equipement => {
                      const employe = employes.find(e => e.id === equipement.assigne_a);
                      return (
                        <TableRow key={equipement.id} className="border-slate-800">
                          <TableCell className="text-white font-medium">{equipement.nom}</TableCell>
                          <TableCell>
                            <Badge className="bg-purple-500/20 text-purple-400">
                              {equipement.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{equipement.numero_serie || "-"}</TableCell>
                          <TableCell className="text-slate-300">
                            {employe ? `${employe.prenom} ${employe.nom}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              equipement.statut === "Disponible" ? "bg-green-500/20 text-green-400" :
                              equipement.statut === "En service" ? "bg-blue-500/20 text-blue-400" :
                              equipement.statut === "En réparation" ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }>
                              {equipement.statut}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  setEditingEquipement(equipement);
                                  setIsEquipementDialogOpen(true);
                                }}
                                className="text-cyan-400 hover:bg-cyan-500/10">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  if (confirm(`Supprimer ${equipement.nom} ?`)) {
                                    deleteEquipementMutation.mutate(equipement.id);
                                  }
                                }}
                                className="text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div value="cedule">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Dossiers en Cédule ({dossiersCedule.length})</CardTitle>
                  <div className="relative w-96">
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
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">N° Dossier</TableHead>
                      <TableHead className="text-slate-300">Clients</TableHead>
                      <TableHead className="text-slate-300">Type mandat</TableHead>
                      <TableHead className="text-slate-300">Adresse travaux</TableHead>
                      <TableHead className="text-slate-300">Assigné à</TableHead>
                      <TableHead className="text-slate-300">Statut terrain</TableHead>
                      <TableHead className="text-slate-300 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDossiersCedule.map((dossier, idx) => (
                      <TableRow 
                        key={`${dossier.id}-${idx}`} 
                        className="border-slate-800 hover:bg-slate-800/30 cursor-pointer"
                        onClick={() => handleViewDossier(dossier)}
                      >
                        <TableCell className="font-medium">
                          <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{getClientsNames(dossier.clients_ids)}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                            {dossier.mandatInfo?.type_mandat}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {formatAdresse(dossier.mandatInfo?.adresse_travaux) || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {dossier.mandatInfo?.utilisateur_assigne || "-"}
                        </TableCell>
                        <TableCell>
                          {dossier.mandatInfo?.statut_terrain && (
                            <Badge className={
                              dossier.mandatInfo.statut_terrain === "en_verification" ? "bg-orange-500/20 text-orange-400" :
                              dossier.mandatInfo.statut_terrain === "a_ceduler" ? "bg-blue-500/20 text-blue-400" :
                              "bg-slate-500/20 text-slate-400"
                            }>
                              {dossier.mandatInfo.statut_terrain.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDossier(dossier);
                            }}
                            className="text-emerald-400 hover:bg-emerald-500/10">
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog Employé */}
        <Dialog open={isEmployeDialogOpen} onOpenChange={setIsEmployeDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEmploye ? "Modifier" : "Nouveau"} technicien</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                prenom: formData.get('prenom'),
                nom: formData.get('nom'),
                poste: formData.get('poste'),
                telephone: formData.get('telephone'),
                courriel: formData.get('courriel'),
                statut: formData.get('statut'),
                date_embauche: formData.get('date_embauche'),
                notes: formData.get('notes')
              };
              if (editingEmploye) {
                updateEmployeMutation.mutate({ id: editingEmploye.id, data });
              } else {
                createEmployeMutation.mutate(data);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom <span className="text-red-400">*</span></Label>
                  <Input name="prenom" defaultValue={editingEmploye?.prenom} required className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Nom <span className="text-red-400">*</span></Label>
                  <Input name="nom" defaultValue={editingEmploye?.nom} required className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Poste <span className="text-red-400">*</span></Label>
                  <Select name="poste" defaultValue={editingEmploye?.poste || "Technicien Terrain"} required>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Technicien Terrain">Technicien Terrain</SelectItem>
                      <SelectItem value="Arpenteur-Géomètre">Arpenteur-Géomètre</SelectItem>
                      <SelectItem value="Administratif">Administratif</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select name="statut" defaultValue={editingEmploye?.statut || "Actif"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                      <SelectItem value="En congé">En congé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input name="telephone" defaultValue={editingEmploye?.telephone} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Courriel</Label>
                  <Input name="courriel" type="email" defaultValue={editingEmploye?.courriel} className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date d'embauche</Label>
                <Input name="date_embauche" type="date" defaultValue={editingEmploye?.date_embauche} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={editingEmploye?.notes} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsEmployeDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  {editingEmploye ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Véhicule */}
        <Dialog open={isVehiculeDialogOpen} onOpenChange={setIsVehiculeDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVehicule ? "Modifier" : "Nouveau"} véhicule</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                nom: formData.get('nom'),
                marque: formData.get('marque'),
                modele: formData.get('modele'),
                plaque: formData.get('plaque'),
                annee: formData.get('annee') ? parseInt(formData.get('annee')) : undefined,
                statut: formData.get('statut'),
                assigne_a: formData.get('assigne_a') || undefined,
                notes: formData.get('notes')
              };
              if (editingVehicule) {
                updateVehiculeMutation.mutate({ id: editingVehicule.id, data });
              } else {
                createVehiculeMutation.mutate(data);
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom <span className="text-red-400">*</span></Label>
                <Input name="nom" defaultValue={editingVehicule?.nom} required placeholder="Ex: Camion 1" className="bg-slate-800 border-slate-700" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Marque</Label>
                  <Input name="marque" defaultValue={editingVehicule?.marque} placeholder="Ex: Ford" className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Modèle</Label>
                  <Input name="modele" defaultValue={editingVehicule?.modele} placeholder="Ex: F-150" className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Input name="annee" type="number" defaultValue={editingVehicule?.annee} placeholder="2024" className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plaque</Label>
                  <Input name="plaque" defaultValue={editingVehicule?.plaque} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select name="statut" defaultValue={editingVehicule?.statut || "Disponible"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="En service">En service</SelectItem>
                      <SelectItem value="En réparation">En réparation</SelectItem>
                      <SelectItem value="Hors service">Hors service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigné à</Label>
                <Select name="assigne_a" defaultValue={editingVehicule?.assigne_a || ""}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value={null}>Aucun</SelectItem>
                    {techniciensTerrain.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={editingVehicule?.notes} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsVehiculeDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  {editingVehicule ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Équipement */}
        <Dialog open={isEquipementDialogOpen} onOpenChange={setIsEquipementDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEquipement ? "Modifier" : "Nouvel"} équipement</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                nom: formData.get('nom'),
                type: formData.get('type'),
                numero_serie: formData.get('numero_serie'),
                statut: formData.get('statut'),
                assigne_a: formData.get('assigne_a') || undefined,
                date_achat: formData.get('date_achat'),
                date_derniere_calibration: formData.get('date_derniere_calibration'),
                notes: formData.get('notes')
              };
              if (editingEquipement) {
                updateEquipementMutation.mutate({ id: editingEquipement.id, data });
              } else {
                createEquipementMutation.mutate(data);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom <span className="text-red-400">*</span></Label>
                  <Input name="nom" defaultValue={editingEquipement?.nom} required placeholder="Ex: GPS-01" className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Type <span className="text-red-400">*</span></Label>
                  <Select name="type" defaultValue={editingEquipement?.type} required>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="GPS">GPS</SelectItem>
                      <SelectItem value="Théodolite">Théodolite</SelectItem>
                      <SelectItem value="Station totale">Station totale</SelectItem>
                      <SelectItem value="Niveau">Niveau</SelectItem>
                      <SelectItem value="Drone">Drone</SelectItem>
                      <SelectItem value="Ordinateur portable">Ordinateur portable</SelectItem>
                      <SelectItem value="Tablette">Tablette</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numéro de série</Label>
                  <Input name="numero_serie" defaultValue={editingEquipement?.numero_serie} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select name="statut" defaultValue={editingEquipement?.statut || "Disponible"}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Disponible">Disponible</SelectItem>
                      <SelectItem value="En service">En service</SelectItem>
                      <SelectItem value="En réparation">En réparation</SelectItem>
                      <SelectItem value="Hors service">Hors service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assigné à</Label>
                <Select name="assigne_a" defaultValue={editingEquipement?.assigne_a || ""}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value={null}>Aucun</SelectItem>
                    {techniciensTerrain.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date d'achat</Label>
                  <Input name="date_achat" type="date" defaultValue={editingEquipement?.date_achat} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Dernière calibration</Label>
                  <Input name="date_derniere_calibration" type="date" defaultValue={editingEquipement?.date_derniere_calibration} className="bg-slate-800 border-slate-700" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={editingEquipement?.notes} className="bg-slate-800 border-slate-700" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsEquipementDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  {editingEquipement ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}