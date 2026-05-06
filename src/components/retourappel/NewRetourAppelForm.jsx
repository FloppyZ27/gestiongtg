import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, ChevronsUpDown, FolderOpen, Phone, Search } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

const ARPENTEURS = ["Samuel Guay", "Dany Gaboury", "Pierre-Luc Pilote", "Benjamin Larouche", "Frédéric Gilbert"];

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

const getMandatColor = (typeMandat) => {
  const colors = {
    "Bornage": "bg-red-500/20 text-red-400 border-red-500/30",
    "Certificat de localisation": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "CPTAQ": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "Description Technique": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Dérogation mineure": "bg-violet-500/20 text-violet-400 border-violet-500/30",
    "Implantation": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "Levé topographique": "bg-lime-500/20 text-lime-400 border-lime-500/30",
    "OCTR": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Piquetage": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "Plan montrant": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "Projet de lotissement": "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "Recherches": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };
  return colors[typeMandat] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getAbbreviatedMandatType = (type) => {
  const abbreviations = {
    "Certificat de localisation": "CL",
    "Description Technique": "DT",
    "Implantation": "Imp",
    "Levé topographique": "Levé Topo",
    "Piquetage": "Piq"
  };
  return abbreviations[type] || type;
};

export default function NewRetourAppelForm({
  formData,
  setFormData,
  users,
  dossiers,
  onSubmit,
  onCancel,
  getClientsNames,
  editingRetourAppel = null,
  onCancelWithCheck = null
}) {
  const queryClient = useQueryClient();
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [retourAppelCollapsed, setRetourAppelCollapsed] = useState(false);
  const [selectedArpenteur, setSelectedArpenteur] = useState("");
  const [selectedNumeroDossier, setSelectedNumeroDossier] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [dossierFound, setDossierFound] = useState(false);
  const [aucunDossier, setAucunDossier] = useState(false);
  const [sortField, setSortField] = useState('date_ouverture');
  const [sortDirection, setSortDirection] = useState('desc');
  const saveTimeoutRef = useRef(null);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-500" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-red-400" /> : <ChevronDown className="w-3 h-3 text-red-400" />;
  };

  // Initialiser l'état en mode édition
  useEffect(() => {
    if (editingRetourAppel) {
      setDossierFound(true);
      setAucunDossier(!editingRetourAppel.dossier_id);
      
      // Pré-remplir les filtres de recherche si un dossier existe
      if (editingRetourAppel.dossier_id) {
        const dossier = dossiers.find(d => d.id === editingRetourAppel.dossier_id);
        if (dossier) {
          setSelectedArpenteur(dossier.arpenteur_geometre);
          setSelectedNumeroDossier(dossier.numero_dossier);
          setSelectedClient(getClientsNames(dossier.clients_ids));
        }
      }
    }
  }, [editingRetourAppel, dossiers]);

  // Mutation pour sauvegarder automatiquement
  const saveRetourAppelMutation = useMutation({
    mutationFn: async (retourData) => {
      if (!editingRetourAppel) return;

      const oldRetour = editingRetourAppel;
      
      await base44.entities.RetourAppel.update(editingRetourAppel.id, {
        ...oldRetour,
        dossier_id: retourData.dossier_reference_id || null,
        date_appel: retourData.date_appel,
        utilisateur_assigne: retourData.utilisateur_assigne,
        raison: retourData.notes || "",
        client_nom: retourData.client_nom || "",
        client_telephone: retourData.client_telephone || ""
      });
      
      // Mettre à jour le dossier si applicable
      if (oldRetour.dossier_id) {
        const dossier = dossiers.find(d => d.id === oldRetour.dossier_id);
        if (dossier && oldRetour.utilisateur_assigne !== retourData.utilisateur_assigne) {
          await base44.entities.Dossier.update(oldRetour.dossier_id, {
            ...dossier,
            utilisateur_assigne: retourData.utilisateur_assigne
          });
          
          if (retourData.utilisateur_assigne) {
            const clientsNames = getClientsNames(dossier.clients_ids);
            await base44.entities.Notification.create({
              utilisateur_email: retourData.utilisateur_assigne,
              titre: "Retour d'appel réassigné",
              message: `Un retour d'appel vous a été assigné${clientsNames ? ` pour ${clientsNames}` : ''}.`,
              type: "retour_appel",
              dossier_id: oldRetour.dossier_id,
              lue: false
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retoursAppels'] });
      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Auto-save avec debounce
  useEffect(() => {
    if (editingRetourAppel && (dossierFound || aucunDossier)) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveRetourAppelMutation.mutate(formData);
      }, 300);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, editingRetourAppel, dossierFound, aucunDossier]);

  const handleSearchDossier = () => {
    if (!selectedArpenteur || !selectedNumeroDossier) {
      alert("Veuillez sélectionner un arpenteur et saisir un numéro de dossier");
      return;
    }
    const dossier = dossiers.find(d => 
      d.arpenteur_geometre === selectedArpenteur && 
      d.numero_dossier === selectedNumeroDossier
    );
    if (dossier) {
      setFormData(prev => ({
        ...prev,
        dossier_reference_id: dossier.id
      }));
      setDossierFound(true);
    } else {
      alert("Aucun dossier trouvé avec ces critères");
    }
  };

  const selectedDossier = formData.dossier_reference_id 
    ? dossiers.find(d => d.id === formData.dossier_reference_id)
    : null;

  return (
    <motion.div 
      className="flex flex-col h-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="sticky top-0 z-10 bg-slate-900 px-6 py-2">
        <h2 className="text-2xl font-bold" style={{
          background: 'linear-gradient(90deg, hsl(0,85%,62%), hsl(22,90%,68%))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}>{editingRetourAppel ? "Modifier retour d'appel" : "Nouveau retour d'appel"}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-3">
        <form id="retour-appel-form" onSubmit={(e) => {
          if (!editingRetourAppel) {
            onSubmit(e);
          } else {
            e.preventDefault();
          }
        }} className="space-y-3">
          {/* Section Informations du dossier */}
          <Card className="border-0 bg-transparent">
            <CardHeader 
              className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
              onClick={() => setInfoDossierCollapsed(!infoDossierCollapsed)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <CardTitle className="text-blue-300 text-base">Informations du dossier</CardTitle>
                  {selectedDossier && (
                    <span className="text-slate-300 text-xs">
                      {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier} - {getClientsNames(selectedDossier.clients_ids)}
                    </span>
                  )}
                </div>
                {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </CardHeader>

            {!infoDossierCollapsed && (
              <CardContent className="pt-2 pb-3">
                {aucunDossier ? (
                   <div style={{display: 'flex', alignItems: 'flex-end', gap: '12px'}}>
                     <div className="flex items-center gap-1.5 shrink-0 pb-1">
                       <Checkbox
                         id="aucunDossier"
                         checked={aucunDossier}
                         onCheckedChange={(checked) => {
                           setAucunDossier(checked);
                           if (!checked) {
                             setFormData(prev => ({...prev, client_nom: "", client_telephone: ""}));
                             setDossierFound(false);
                           } else {
                             setFormData(prev => ({...prev, dossier_reference_id: null, client_nom: "", client_telephone: ""}));
                             setDossierFound(true);
                             setSelectedArpenteur("");
                             setSelectedNumeroDossier("");
                             setSelectedClient("");
                           }
                         }}
                       />
                       <Label htmlFor="aucunDossier" className="text-slate-400 text-[11px] cursor-pointer whitespace-nowrap">Aucun dossier</Label>
                     </div>
                     <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <label style={{color: 'hsl(220,8%,50%)', fontSize: '11px'}}>Client <span style={{color:'#f87171'}}>*</span></label>
                       <input
                         placeholder="Nom du client"
                         value={formData.client_nom || ""}
                         onChange={(e) => setFormData({...formData, client_nom: e.target.value})}
                         required
                         style={{width: '100%', background: 'hsl(220,13%,11%)', border: '1px solid hsl(220,10%,22%)', color: 'white', height: '28px', fontSize: '13px', borderRadius: '10px', padding: '0 10px'}}
                       />
                     </div>
                     <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '4px'}}>
                       <label style={{color: 'hsl(220,8%,50%)', fontSize: '11px'}}>N° de téléphone <span style={{color:'#f87171'}}>*</span></label>
                       <input
                         id="new-telephone-retour"
                         placeholder="(000) 000-0000"
                         value={formData.client_telephone || ""}
                         onChange={(e) => {
                           const input = e.target.value.replace(/\D/g, '');
                           let formatted = input;
                           if (input.length > 0) {
                             if (input.length <= 3) {
                               formatted = `(${input}`;
                             } else if (input.length <= 6) {
                               formatted = `(${input.slice(0, 3)}) ${input.slice(3)}`;
                             } else {
                               formatted = `(${input.slice(0, 3)}) ${input.slice(3, 6)}-${input.slice(6, 10)}`;
                             }
                           }
                           setFormData({...formData, client_telephone: formatted});
                         }}
                         required
                         style={{width: '100%', background: 'hsl(220,13%,11%)', border: '1px solid hsl(220,10%,22%)', color: 'white', height: '28px', fontSize: '13px', borderRadius: '10px', padding: '0 10px'}}
                       />
                     </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Ligne de filtres */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                       <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-center gap-1.5 py-2">
                         <Checkbox
                           id="aucunDossier"
                           checked={aucunDossier}
                           onCheckedChange={(checked) => {
                             setAucunDossier(checked);
                             if (!checked) {
                               setFormData(prev => ({...prev, client_nom: "", client_telephone: ""}));
                               setDossierFound(false);
                             } else {
                               setFormData(prev => ({...prev, dossier_reference_id: null, client_nom: "", client_telephone: ""}));
                               setDossierFound(true);
                               setSelectedArpenteur("");
                               setSelectedNumeroDossier("");
                               setSelectedClient("");
                             }
                           }}
                         />
                         <Label htmlFor="aucunDossier" className="text-slate-400 text-[11px] cursor-pointer whitespace-nowrap">Aucun dossier</Label>
                       </div>

                       <div className="space-y-1">
                         <Label className="text-slate-400 text-xs">Arpenteur</Label>
                         <Select value={selectedArpenteur} onValueChange={(value) => setSelectedArpenteur(value)}>
                           <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
                             <SelectValue placeholder="Tous" />
                           </SelectTrigger>
                           <SelectContent className="bg-slate-800 border-slate-700">
                             <SelectItem value={null} className="text-white text-xs">Tous</SelectItem>
                             {ARPENTEURS.map((arpenteur) => (
                               <SelectItem key={arpenteur} value={arpenteur} className="text-white text-xs">{arpenteur}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>

                       <div className="space-y-1">
                         <Label className="text-slate-400 text-xs">N° dossier</Label>
                         <Input
                           placeholder="Rechercher..."
                           value={selectedNumeroDossier}
                           onChange={(e) => setSelectedNumeroDossier(e.target.value)}
                           className="bg-slate-700 border-slate-600 text-white h-7 text-xs"
                         />
                       </div>

                       <div className="space-y-1">
                         <Label className="text-slate-400 text-xs">Client</Label>
                         <Input
                           placeholder="Rechercher..."
                           value={selectedClient}
                           onChange={(e) => setSelectedClient(e.target.value)}
                           className="bg-slate-700 border-slate-600 text-white h-7 text-xs"
                         />
                       </div>
                     </div>

                    {/* Liste des dossiers */}
                    <div className="overflow-hidden flex flex-col">
                      <p className="text-slate-400 text-xs mb-1">
                        Sélectionner un dossier ({dossiers.filter(d => {
                          const matchesStatut = d.statut === "Ouvert" || d.statut === "Fermé";
                          const matchesArpenteur = !selectedArpenteur || d.arpenteur_geometre === selectedArpenteur;
                          const matchesNumero = !selectedNumeroDossier || d.numero_dossier?.includes(selectedNumeroDossier);
                          const clientsNames = getClientsNames(d.clients_ids).toLowerCase();
                          const matchesClient = !selectedClient || clientsNames.includes(selectedClient.toLowerCase());
                          return matchesStatut && matchesArpenteur && matchesNumero && matchesClient;
                        }).length})
                      </p>
                      <div className="flex-1 overflow-y-auto max-h-[300px] overflow-x-auto -mx-2 px-2">
                        <div className="min-w-full">
                          <Table className="text-xs">
                            <TableHeader className="sticky top-0 bg-slate-900 z-10">
                              <TableRow className="hover:bg-transparent border-slate-700">
                                {[
                                  ['numero_dossier', 'N°'],
                                  ['clients', 'Client'],
                                  ['mandats', 'Mandats'],
                                  ['tache_actuelle', 'Tâche'],
                                  ['adresse', 'Adresse'],
                                  ['date_ouverture', 'Date'],
                                  ['statut', 'Statut'],
                                ].map(([field, label]) => (
                                  <TableHead
                                    key={field}
                                    className="text-slate-300 text-xs cursor-pointer hover:text-white select-none py-1 px-1"
                                    onClick={() => handleSort(field)}
                                  >
                                    <div className="flex items-center gap-1 whitespace-nowrap">
                                      {label}
                                      <SortIcon field={field} />
                                    </div>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                            {dossiers
                              .filter(d => {
                                const matchesStatut = d.statut === "Ouvert" || d.statut === "Fermé";
                                const matchesArpenteur = !selectedArpenteur || d.arpenteur_geometre === selectedArpenteur;
                                const matchesNumero = !selectedNumeroDossier || d.numero_dossier?.includes(selectedNumeroDossier);
                                const clientsNames = getClientsNames(d.clients_ids).toLowerCase();
                                const matchesClient = !selectedClient || clientsNames.includes(selectedClient.toLowerCase());
                                return matchesStatut && matchesArpenteur && matchesNumero && matchesClient;
                              })
                              .sort((a, b) => {
                                let aValue, bValue;
                                switch (sortField) {
                                  case 'numero_dossier':
                                    aValue = (a.numero_dossier || '').toLowerCase();
                                    bValue = (b.numero_dossier || '').toLowerCase();
                                    break;
                                  case 'clients':
                                    aValue = getClientsNames(a.clients_ids).toLowerCase();
                                    bValue = getClientsNames(b.clients_ids).toLowerCase();
                                    break;
                                  case 'mandats':
                                    aValue = (a.mandats?.[0]?.type_mandat || '').toLowerCase();
                                    bValue = (b.mandats?.[0]?.type_mandat || '').toLowerCase();
                                    break;
                                  case 'tache_actuelle':
                                    aValue = (a.mandats?.[0]?.tache_actuelle || '').toLowerCase();
                                    bValue = (b.mandats?.[0]?.tache_actuelle || '').toLowerCase();
                                    break;
                                  case 'adresse':
                                    aValue = formatAdresse(a.mandats?.[0]?.adresse_travaux).toLowerCase();
                                    bValue = formatAdresse(b.mandats?.[0]?.adresse_travaux).toLowerCase();
                                    break;
                                  case 'statut':
                                    aValue = (a.statut || '').toLowerCase();
                                    bValue = (b.statut || '').toLowerCase();
                                    break;
                                  case 'date_ouverture':
                                  default:
                                    aValue = a.date_ouverture ? new Date(a.date_ouverture).getTime() : 0;
                                    bValue = b.date_ouverture ? new Date(b.date_ouverture).getTime() : 0;
                                    if (typeof aValue === 'number') {
                                      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                                    }
                                }
                                if (typeof aValue === 'string') {
                                  return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                                }
                                return 0;
                              })
                              .map((dossier) => {
                                const isSelected = formData.dossier_reference_id === dossier.id;
                                const firstAdresse = dossier.mandats?.[0]?.adresse_travaux 
                                  ? formatAdresse(dossier.mandats[0].adresse_travaux) 
                                  : "-";
                                const tacheActuelle = dossier.mandats?.[0]?.tache_actuelle || "-";
                                return (
                                  <TableRow
                                    key={dossier.id}
                                    className={`cursor-pointer border-slate-800 ${
                                      isSelected 
                                        ? 'bg-blue-500/20 hover:bg-blue-500/30' 
                                        : 'hover:bg-slate-800/30'
                                    }`}
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        dossier_reference_id: dossier.id
                                      }));
                                      setDossierFound(true);
                                      setSelectedArpenteur(dossier.arpenteur_geometre);
                                      setSelectedNumeroDossier(dossier.numero_dossier);
                                      setSelectedClient(getClientsNames(dossier.clients_ids));
                                    }}
                                  >
                                    <TableCell className="text-slate-300 py-1 px-1">
                                      <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-xs`}>
                                        {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs whitespace-nowrap py-1 px-1">
                                      {getClientsNames(dossier.clients_ids).substring(0, 15)}...
                                    </TableCell>
                                    <TableCell className="text-slate-300 py-1 px-1">
                                      {dossier.mandats && dossier.mandats.length > 0 ? (
                                        <div className="flex flex-wrap gap-0.5">
                                          {dossier.mandats.slice(0, 1).map((mandat, idx) => (
                                            <Badge key={idx} className={`${getMandatColor(mandat.type_mandat)} border text-xs pointer-events-none`}>
                                              {getAbbreviatedMandatType(mandat.type_mandat)}
                                            </Badge>
                                          ))}
                                          {dossier.mandats.length > 1 && (
                                            <Badge className="bg-slate-700 text-slate-300 text-xs">+{dossier.mandats.length - 1}</Badge>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-600 text-xs">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs py-1 px-1">
                                      {tacheActuelle !== "-" ? (
                                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 border text-xs pointer-events-none">
                                          {tacheActuelle.substring(0, 10)}
                                        </Badge>
                                      ) : (
                                        <span className="text-slate-600">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs whitespace-nowrap py-1 px-1 max-w-[80px]">
                                      {firstAdresse.substring(0, 12)}...
                                    </TableCell>
                                    <TableCell className="text-slate-300 text-xs py-1 px-1 whitespace-nowrap">
                                      {dossier.date_ouverture ? format(new Date(dossier.date_ouverture), "dd MMM", { locale: fr }) : "-"}
                                    </TableCell>
                                    <TableCell className="py-1 px-1">
                                      <Badge className={`text-xs pointer-events-none ${dossier.statut === 'Ouvert' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'} border`}>
                                        {dossier.statut}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            {dossiers.filter(d => {
                              const matchesArpenteur = !selectedArpenteur || d.arpenteur_geometre === selectedArpenteur;
                              const matchesNumero = !selectedNumeroDossier || d.numero_dossier?.includes(selectedNumeroDossier);
                              const clientsNames = getClientsNames(d.clients_ids).toLowerCase();
                              const matchesClient = !selectedClient || clientsNames.includes(selectedClient.toLowerCase());
                              return matchesArpenteur && matchesNumero && matchesClient;
                            }).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                  Aucun dossier trouvé
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                          </Table>
                          </div>
                          </div>
                          </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Section Retour d'appel */}
          {(dossierFound || aucunDossier) && (
            <Card className="border-0 bg-transparent">
              <CardHeader 
                className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1.5 bg-blue-900/20"
                onClick={() => setRetourAppelCollapsed(!retourAppelCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <CardTitle className="text-blue-300 text-base">Retour d'appel</CardTitle>
                  </div>
                  {retourAppelCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>

              {!retourAppelCollapsed && (
                <CardContent className="pt-2 pb-3">
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Date de l'appel <span className="text-red-400">*</span></Label>
                        <Input
                          type="date"
                          value={formData.date_appel}
                          onChange={(e) => setFormData({...formData, date_appel: e.target.value})}
                          required
                          className="bg-slate-700 border-slate-600 text-white h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-slate-400 text-xs">Utilisateur assigné</Label>
                        <Select
                          value={formData.utilisateur_assigne || ""}
                          onValueChange={(value) => setFormData({...formData, utilisateur_assigne: value})}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-xs">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {users.map((user) => (
                              <SelectItem key={user.email} value={user.email} className="text-white text-xs">{user.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-slate-400 text-xs mb-1">Raison de l'appel <span className="text-red-400">*</span></Label>
                      <textarea
                        placeholder="Notes sur l'appel..."
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        className="bg-slate-700 border border-slate-600 text-white flex-1 text-xs p-2 rounded resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </form>
      </div>

      {/* Boutons Annuler/Créer tout en bas - Seulement en mode création */}
      {!editingRetourAppel && (
        <div className="flex justify-end gap-3 p-4">
          <Button 
            type="button" 
            variant="outline" 
            className="border-red-500 text-red-400 hover:bg-red-500/10" 
            onClick={() => {
              if (onCancelWithCheck) {
                onCancelWithCheck();
              } else {
                onCancel();
              }
            }}
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              if (editingRetourAppel) return;
              onSubmit(e);
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-600"
            disabled={!aucunDossier && !dossierFound}
          >
            Créer
          </Button>
        </div>
      )}
    </motion.div>
  );
}