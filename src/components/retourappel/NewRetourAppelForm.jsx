import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FolderOpen, Phone, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

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
  getClientsNames
}) {
  const [infoDossierCollapsed, setInfoDossierCollapsed] = useState(false);
  const [retourAppelCollapsed, setRetourAppelCollapsed] = useState(false);
  const [selectedArpenteur, setSelectedArpenteur] = useState("");
  const [selectedNumeroDossier, setSelectedNumeroDossier] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [dossierFound, setDossierFound] = useState(false);

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
      className="flex flex-col h-[90vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Nouveau retour d'appel</h2>
        </div>

        <form id="retour-appel-form" onSubmit={onSubmit} className="space-y-3">
          {/* Section Informations du dossier */}
          <Card className="border-slate-700 bg-slate-800/30">
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
                    <span className="text-slate-300 text-sm">
                      {getArpenteurInitials(selectedDossier.arpenteur_geometre)}{selectedDossier.numero_dossier} - {getClientsNames(selectedDossier.clients_ids)}
                    </span>
                  )}
                </div>
                {infoDossierCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>
            </CardHeader>

            {!infoDossierCollapsed && (
              <CardContent className="pt-4 pb-3">
                <div className="grid grid-cols-[30%_70%] gap-4">
                  {/* Colonne gauche - Filtres */}
                  <div className="space-y-3 border-r border-slate-700 pr-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Arpenteur-géomètre</Label>
                      <Select value={selectedArpenteur} onValueChange={(value) => setSelectedArpenteur(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value={null} className="text-white text-sm">Tous</SelectItem>
                          {ARPENTEURS.map((arpenteur) => (
                            <SelectItem key={arpenteur} value={arpenteur} className="text-white text-sm">{arpenteur}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">N° de dossier</Label>
                      <Input
                        placeholder="Rechercher..."
                        value={selectedNumeroDossier}
                        onChange={(e) => setSelectedNumeroDossier(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Client</Label>
                      <Input
                        placeholder="Rechercher..."
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Colonne droite - Liste des dossiers */}
                  <div className="overflow-hidden flex flex-col">
                    <p className="text-slate-400 text-xs mb-2">
                      Sélectionner un dossier ({dossiers.filter(d => {
                        const matchesArpenteur = !selectedArpenteur || d.arpenteur_geometre === selectedArpenteur;
                        const matchesNumero = !selectedNumeroDossier || d.numero_dossier?.includes(selectedNumeroDossier);
                        const clientsNames = getClientsNames(d.clients_ids).toLowerCase();
                        const matchesClient = !selectedClient || clientsNames.includes(selectedClient.toLowerCase());
                        return matchesArpenteur && matchesNumero && matchesClient;
                      }).length})
                    </p>
                    <div className="flex-1 overflow-y-auto border border-slate-700 rounded-lg max-h-[300px]">
                      <Table>
                        <TableHeader className="sticky top-0 bg-slate-800/95 z-10">
                          <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                            <TableHead className="text-slate-300 text-[10px] py-1">N° Dossier</TableHead>
                            <TableHead className="text-slate-300 text-[10px] py-1">Clients</TableHead>
                            <TableHead className="text-slate-300 text-[10px] py-1">Mandats</TableHead>
                            <TableHead className="text-slate-300 text-[10px] py-1">Adresse</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dossiers
                            .filter(d => {
                              const matchesArpenteur = !selectedArpenteur || d.arpenteur_geometre === selectedArpenteur;
                              const matchesNumero = !selectedNumeroDossier || d.numero_dossier?.includes(selectedNumeroDossier);
                              const clientsNames = getClientsNames(d.clients_ids).toLowerCase();
                              const matchesClient = !selectedClient || clientsNames.includes(selectedClient.toLowerCase());
                              return matchesArpenteur && matchesNumero && matchesClient;
                            })
                            .sort((a, b) => {
                              const dateA = a.date_ouverture ? new Date(a.date_ouverture).getTime() : 0;
                              const dateB = b.date_ouverture ? new Date(b.date_ouverture).getTime() : 0;
                              return dateB - dateA;
                            })
                            .map((dossier) => {
                              const isSelected = formData.dossier_reference_id === dossier.id;
                              const firstAdresse = dossier.mandats?.[0]?.adresse_travaux 
                                ? formatAdresse(dossier.mandats[0].adresse_travaux) 
                                : "-";
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
                                  <TableCell className="text-slate-300 text-[10px] py-1.5">
                                    <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border text-[10px]`}>
                                      {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-[10px] py-1.5">
                                    {getClientsNames(dossier.clients_ids)}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-[10px] py-1.5">
                                    {dossier.mandats && dossier.mandats.length > 0 ? (
                                      <div className="flex flex-wrap gap-0.5">
                                        {dossier.mandats.slice(0, 2).map((mandat, idx) => (
                                          <Badge key={idx} className={`${getMandatColor(mandat.type_mandat)} border text-[10px] px-1.5 py-0`}>
                                            {getAbbreviatedMandatType(mandat.type_mandat)}
                                          </Badge>
                                        ))}
                                        {dossier.mandats.length > 2 && (
                                          <Badge className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0">
                                            +{dossier.mandats.length - 2}
                                          </Badge>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-600 text-[10px]">Aucun</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-slate-300 text-[10px] py-1.5 max-w-[120px] truncate">
                                    {firstAdresse}
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
                              <TableCell colSpan={4} className="text-center py-4 text-slate-500 text-[10px]">
                                Aucun dossier trouvé
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Section Retour d'appel */}
          {dossierFound && (
            <Card className="border-slate-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-1 bg-cyan-900/20"
                onClick={() => setRetourAppelCollapsed(!retourAppelCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/30 flex items-center justify-center">
                      <Phone className="w-3 h-3 text-cyan-400" />
                    </div>
                    <CardTitle className="text-cyan-300 text-sm">Retour d'appel</CardTitle>
                  </div>
                  {retourAppelCollapsed ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />}
                </div>
              </CardHeader>

              {!retourAppelCollapsed && (
                <CardContent className="pt-2 pb-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-slate-400 text-[10px]">Date de l'appel <span className="text-red-400">*</span></Label>
                      <Input
                        type="date"
                        value={formData.date_appel}
                        onChange={(e) => setFormData({...formData, date_appel: e.target.value})}
                        required
                        className="bg-slate-700 border-slate-600 text-white h-7 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-slate-400 text-[10px]">Utilisateur assigné <span className="text-red-400">*</span></Label>
                      <Select
                        value={formData.utilisateur_assigne || ""}
                        onValueChange={(value) => setFormData({...formData, utilisateur_assigne: value})}
                        required
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-7 text-xs">
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

                  <div className="space-y-1">
                    <Label className="text-slate-400 text-[10px]">Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ajouter des notes..."
                      className="bg-slate-700 border-slate-600 text-white text-xs"
                      rows={3}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </form>
      </div>

      {/* Boutons Annuler/Créer tout en bas */}
      <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
        <Button type="button" variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          form="retour-appel-form" 
          className="bg-gradient-to-r from-blue-500 to-cyan-600"
          disabled={!dossierFound}
        >
          Créer
        </Button>
      </div>
    </motion.div>
  );
}