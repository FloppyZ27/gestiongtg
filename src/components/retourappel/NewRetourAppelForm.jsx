import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, FolderOpen, Phone } from "lucide-react";
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
                {!dossierFound ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Arpenteur-géomètre <span className="text-red-400">*</span></Label>
                      <Select value={selectedArpenteur} onValueChange={(value) => setSelectedArpenteur(value)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                          <SelectValue placeholder="Sélectionner un arpenteur" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {ARPENTEURS.map((arpenteur) => (
                            <SelectItem key={arpenteur} value={arpenteur} className="text-white text-sm">{arpenteur}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">N° de dossier <span className="text-red-400">*</span></Label>
                      <Input
                        placeholder="Ex: 123"
                        value={selectedNumeroDossier}
                        onChange={(e) => setSelectedNumeroDossier(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                      />
                    </div>

                    <Button 
                      type="button"
                      onClick={handleSearchDossier}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 h-8 text-sm"
                    >
                      Rechercher le dossier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <Label className="text-slate-400 text-xs">Dossier sélectionné</Label>
                      <p className="text-white font-medium mt-2 text-sm">
                        {getArpenteurInitials(selectedDossier?.arpenteur_geometre)}{selectedDossier?.numero_dossier}
                      </p>
                      <p className="text-slate-300 text-xs mt-1">{getClientsNames(selectedDossier?.clients_ids)}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDossierFound(false);
                          setSelectedArpenteur("");
                          setSelectedNumeroDossier("");
                          setFormData(prev => ({
                            ...prev,
                            dossier_reference_id: ""
                          }));
                        }}
                        className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 mt-3 h-7 text-xs"
                      >
                        Changer de dossier
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Section Retour d'appel */}
          {dossierFound && (
            <Card className="border-slate-700 bg-slate-800/30">
              <CardHeader 
                className="cursor-pointer hover:bg-cyan-900/40 transition-colors rounded-t-lg py-1.5 bg-cyan-900/20"
                onClick={() => setRetourAppelCollapsed(!retourAppelCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <CardTitle className="text-cyan-300 text-base">Retour d'appel</CardTitle>
                  </div>
                  {retourAppelCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>
              </CardHeader>

              {!retourAppelCollapsed && (
                <CardContent className="pt-4 pb-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Date de l'appel <span className="text-red-400">*</span></Label>
                      <Input
                        type="date"
                        value={formData.date_appel}
                        onChange={(e) => setFormData({...formData, date_appel: e.target.value})}
                        required
                        className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-400 text-xs">Utilisateur assigné <span className="text-red-400">*</span></Label>
                      <Select
                        value={formData.utilisateur_assigne || ""}
                        onValueChange={(value) => setFormData({...formData, utilisateur_assigne: value})}
                        required
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-8 text-sm">
                          <SelectValue placeholder="Sélectionner un utilisateur" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {users.map((user) => (
                            <SelectItem key={user.email} value={user.email} className="text-white text-sm">{user.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-400 text-xs">Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ajouter des notes..."
                      className="bg-slate-700 border-slate-600 text-white text-sm"
                      rows={4}
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