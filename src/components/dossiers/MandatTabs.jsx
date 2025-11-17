import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AddressInput from "../shared/AddressInput";

const TYPES_MANDATS = ["Bornage", "Certificat de localisation", "CPTAQ", "Description Technique", "Dérogation mineure", "Implantation", "Levé topographique", "OCTR", "Piquetage", "Plan montrant", "Projet de lotissement", "Recherches"];
const TACHES = ["Ouverture", "Cédule", "Montage", "Terrain", "Compilation", "Reliage", "Décision/Calcul", "Mise en plan", "Analyse", "Rapport", "Vérification", "Facturer"];
const DONNEURS = ["Dave Vallée", "Julie Abud", "André Guérin"];

export default function MandatTabs({ 
  mandat, 
  mandatIndex, 
  updateMandat, 
  updateMandatAddress,
  openLotSelector,
  openAddMinuteDialog,
  removeLotFromMandat,
  removeMinuteFromMandat,
  getLotById,
  users,
  formStatut
}) {
  const [activeSubTab, setActiveSubTab] = useState("informations");

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
      <TabsList className="bg-slate-800/50 border border-slate-700 w-full h-auto justify-start p-1 rounded-lg mb-4">
        <TabsTrigger
          value="informations"
          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-6 py-2 rounded-md transition-all"
        >
          Informations
        </TabsTrigger>
        <TabsTrigger
          value="minutes"
          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-6 py-2 rounded-md transition-all"
        >
          Minutes
        </TabsTrigger>
        <TabsTrigger
          value="factures"
          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-6 py-2 rounded-md transition-all"
        >
          Factures
        </TabsTrigger>
        <TabsTrigger
          value="terrain"
          className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 px-6 py-2 rounded-md transition-all"
        >
          Terrain
        </TabsTrigger>
      </TabsList>

      {/* Tab Informations */}
      <TabsContent value="informations" className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Type de mandat <span className="text-red-400">*</span></Label>
            <Select value={mandat.type_mandat} onValueChange={(value) => updateMandat(mandatIndex, 'type_mandat', value)}>
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
            <Select value={mandat.tache_actuelle || ""} onValueChange={(value) => updateMandat(mandatIndex, 'tache_actuelle', value)}>
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
              {formStatut === "Ouvert" && <span className="text-red-400"> *</span>}
            </Label>
            <Select value={mandat.utilisateur_assigne || ""} onValueChange={(value) => updateMandat(mandatIndex, 'utilisateur_assigne', value)}>
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

        <div className="grid grid-cols-[70%_30%] gap-4">
          <div className="space-y-3">
            <AddressInput
              addresses={mandat.adresse_travaux ? [mandat.adresse_travaux] : [{ ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" }]}
              onChange={(newAddresses) => updateMandatAddress(mandatIndex, newAddresses)}
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
                  onChange={(e) => updateMandat(mandatIndex, 'date_signature', e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label>Début des travaux</Label>
                <Input
                  type="date"
                  value={mandat.date_debut_travaux || ""}
                  onChange={(e) => updateMandat(mandatIndex, 'date_debut_travaux', e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label>Date de livraison</Label>
                <Input
                  type="date"
                  value={mandat.date_livraison || ""}
                  onChange={(e) => updateMandat(mandatIndex, 'date_livraison', e.target.value)}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Lots sélectionnés</Label>
            <Button type="button" size="sm" onClick={() => openLotSelector(mandatIndex)} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400">
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
                    <TableHead className="text-slate-300 text-right">Actions</TableHead>
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
                        <TableCell className="text-slate-300">{lot.rang || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeLotFromMandat(mandatIndex, lot.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow key={lotId} className="hover:bg-slate-800/30 border-slate-800">
                        <TableCell colSpan={4} className="font-medium text-white">{lotId} (Lot introuvable)</TableCell>
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeLotFromMandat(mandatIndex, lotId)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
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
          <Label>Notes</Label>
          <Textarea value={mandat.notes || ""} onChange={(e) => updateMandat(mandatIndex, 'notes', e.target.value)} className="bg-slate-700 border-slate-600 h-20" />
        </div>
      </TabsContent>

      {/* Tab Minutes */}
      <TabsContent value="minutes" className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Minutes</Label>
          <Button
            type="button"
            size="sm"
            onClick={() => openAddMinuteDialog(mandatIndex)}
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
                        onClick={() => removeMinuteFromMandat(mandatIndex, minuteIdx)}
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
          <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-lg">
            <p>Aucune minute</p>
            <p className="text-sm mt-2">Cliquez sur "Ajouter minute" pour commencer</p>
          </div>
        )}
      </TabsContent>

      {/* Tab Factures */}
      <TabsContent value="factures" className="space-y-4">
        <Label className="text-slate-50 text-sm font-semibold block">Factures générées ({mandat.factures?.length || 0})</Label>
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
          <div className="text-center py-12 text-slate-500 bg-slate-800/30 rounded-lg">
            <p>Aucune facture générée</p>
            <p className="text-sm mt-2">Les factures apparaîtront ici une fois créées</p>
          </div>
        )}
      </TabsContent>

      {/* Tab Terrain */}
      <TabsContent value="terrain" className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 rounded-lg">
          <Label className="text-cyan-300 font-semibold mb-3 block">Planification terrain</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white">Date terrain</Label>
              <Input
                type="date"
                value={mandat.date_terrain || ""}
                onChange={(e) => updateMandat(mandatIndex, 'date_terrain', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Équipe assignée</Label>
              <Input
                value={mandat.equipe_assignee || ""}
                onChange={(e) => updateMandat(mandatIndex, 'equipe_assignee', e.target.value)}
                placeholder="Ex: Équipe 1"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Date limite levé terrain</Label>
            <Input type="date" value={mandat.terrain?.date_limite_leve || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, date_limite_leve: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Instruments requis</Label>
            <Input value={mandat.terrain?.instruments_requis || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, instruments_requis: e.target.value })} placeholder="Ex: GPS, Total Station" className="bg-slate-700 border-slate-600" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={mandat.terrain?.a_rendez_vous || false} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, a_rendez_vous: e.target.checked })} className="w-4 h-4 rounded bg-slate-700 border-slate-600" />
            <Label>Rendez-vous nécessaire</Label>
          </div>
          {mandat.terrain?.a_rendez_vous && (
            <div className="grid grid-cols-2 gap-3 ml-7">
              <div className="space-y-2">
                <Label>Date du rendez-vous</Label>
                <Input type="date" value={mandat.terrain?.date_rendez_vous || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, date_rendez_vous: e.target.value })} className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>Heure du rendez-vous</Label>
                <Input type="time" value={mandat.terrain?.heure_rendez_vous || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, heure_rendez_vous: e.target.value })} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Donneur</Label>
            <Select value={mandat.terrain?.donneur || ""} onValueChange={(value) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, donneur: value })}>
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
            <Input value={mandat.terrain?.technicien || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, technicien: e.target.value })} placeholder="Nom du technicien" className="bg-slate-700 border-slate-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Dossier à faire en même temps</Label>
            <Input value={mandat.terrain?.dossier_simultane || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, dossier_simultane: e.target.value })} placeholder="N° de dossier" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Temps prévu</Label>
            <Input value={mandat.terrain?.temps_prevu || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, temps_prevu: e.target.value })} placeholder="Ex: 2h30" className="bg-slate-700 border-slate-600" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes terrain</Label>
          <Textarea value={mandat.terrain?.notes || ""} onChange={(e) => updateMandat(mandatIndex, 'terrain', { ...mandat.terrain, notes: e.target.value })} placeholder="Notes concernant le terrain..." className="bg-slate-700 border-slate-600 h-20" />
        </div>
      </TabsContent>
    </Tabs>
  );
}