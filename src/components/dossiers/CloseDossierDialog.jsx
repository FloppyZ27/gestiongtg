import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, Check, FolderOpen } from "lucide-react";

const CloseDossierDialog = ({
    isOpen,
    onOpenChange,
    dossiers,
    onSelectDossier,
    selectedDossier,
    onCloseDossier,
    minutesData,
    onUpdateMinuteData,
    searchTerm,
    onSearchTermChange,
    filterArpenteur,
    onFilterArpenteurChange,
    filterVille,
    onFilterVilleChange,
    filterMandat,
    onFilterMandatChange,
    uniqueVilles,
    ARPENTEURS,
    TYPES_MANDATS,
    getArpenteurInitials,
    getArpenteurColor,
    getClientsNames,
    getFirstAdresseTravaux
}) => {

    const filteredDossiers = dossiers.filter((dossier) => {
        const searchLower = searchTerm.toLowerCase();
        const fullNumber = getArpenteurInitials(dossier.arpenteur_geometre) + dossier.numero_dossier;
        const clientsNames = getClientsNames(dossier.clients_ids);

        const matchesSearch =
            fullNumber.toLowerCase().includes(searchLower) ||
            dossier.numero_dossier?.toLowerCase().includes(searchLower) ||
            clientsNames.toLowerCase().includes(searchLower) ||
            dossier.mandats?.some((m) => m.type_mandat?.toLowerCase().includes(searchLower));

        const matchesArpenteur = filterArpenteur === "all" || dossier.arpenteur_geometre === filterArpenteur;
        const matchesVille = filterVille === "all" || dossier.mandats?.some((m) => m.adresse_travaux?.ville === filterVille);
        const matchesMandat = filterMandat === "all" || dossier.mandats?.some((m) => m.type_mandat === filterMandat);

        return matchesSearch && matchesArpenteur && matchesVille && matchesMandat;
    });

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
                    <DialogTitle className="text-2xl">Fermer un dossier</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {!selectedDossier ? (
                        <>
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="relative flex-1 min-w-[250px]">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
                                </div>
                                <Select value={filterArpenteur} onValueChange={onFilterArpenteurChange}>
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700"><SelectValue placeholder="Arpenteur" /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="all">Tous les arpenteurs</SelectItem>
                                        {ARPENTEURS.map((arpenteur) => <SelectItem key={arpenteur} value={arpenteur}>{arpenteur}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterMandat} onValueChange={onFilterMandatChange}>
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700"><SelectValue placeholder="Mandat" /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="all">Tous les mandats</SelectItem>
                                        {TYPES_MANDATS.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={filterVille} onValueChange={onFilterVilleChange}>
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700"><SelectValue placeholder="Ville" /></SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                        <SelectItem value="all">Toutes les villes</SelectItem>
                                        {uniqueVilles.map((ville) => <SelectItem key={ville} value={ville}>{ville}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1 overflow-hidden border border-slate-700 rounded-lg">
                                <div className="max-h-[500px] overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-slate-800/50 z-10">
                                            <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                                                <TableHead className="text-slate-300">N° Dossier</TableHead>
                                                <TableHead className="text-slate-300">Clients</TableHead>
                                                <TableHead className="text-slate-300">Mandats</TableHead>
                                                <TableHead className="text-slate-300">Adresse Travaux</TableHead>
                                                <TableHead className="text-slate-300 text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredDossiers.length > 0 ? filteredDossiers.map((dossier) => (
                                                <TableRow key={dossier.id} className="hover:bg-slate-800/30 border-slate-800 cursor-pointer" onClick={() => onSelectDossier(dossier.id)}>
                                                    <TableCell className="font-medium">
                                                        <Badge variant="outline" className={`${getArpenteurColor(dossier.arpenteur_geometre)} border`}>
                                                            {getArpenteurInitials(dossier.arpenteur_geometre)}{dossier.numero_dossier}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-300 text-sm">{getClientsNames(dossier.clients_ids)}</TableCell>
                                                    <TableCell className="text-slate-300">
                                                        {dossier.mandats && dossier.mandats.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {dossier.mandats.slice(0, 2).map((mandat, idx) => (
                                                                    <Badge key={idx} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">{mandat.type_mandat}</Badge>
                                                                ))}
                                                                {dossier.mandats.length > 2 && <Badge className="bg-slate-700 text-slate-300 text-xs">+{dossier.mandats.length - 2}</Badge>}
                                                            </div>
                                                        ) : <span className="text-slate-600 text-xs">Aucun</span>}
                                                    </TableCell>
                                                    <TableCell className="text-slate-300 text-sm max-w-xs truncate">{getFirstAdresseTravaux(dossier.mandats)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button type="button" size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10">Sélectionner</Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                                                        <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                                        <p>Aucun dossier ouvert trouvé</p>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700">
                                <div>
                                    <Badge variant="outline" className={`${getArpenteurColor(selectedDossier?.arpenteur_geometre)} border mb-2`}>{getArpenteurInitials(selectedDossier?.arpenteur_geometre)}{selectedDossier?.numero_dossier}</Badge>
                                    <p className="text-slate-300 text-sm">{getClientsNames(selectedDossier?.clients_ids)}</p>
                                </div>
                                <Button type="button" size="sm" variant="outline" onClick={() => onSelectDossier(null)} className="text-slate-400">Changer de dossier</Button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <Label className="text-lg font-semibold text-white mb-3 block">Informations de minutes par mandat</Label>
                                <div className="space-y-4">
                                    {selectedDossier?.mandats?.map((mandat, index) => (
                                        <Card key={index} className="border-slate-700 bg-slate-800/30">
                                            <CardContent className="p-4 space-y-3">
                                                <h4 className="font-semibold text-emerald-400">{mandat.type_mandat || `Mandat ${index + 1}`}</h4>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-2">
                                                        <Label>Minute <span className="text-red-400">*</span></Label>
                                                        <Input value={minutesData[index]?.minute || ""} onChange={(e) => onUpdateMinuteData(index, 'minute', e.target.value)} placeholder="Ex: 12345" required className="bg-slate-700 border-slate-600" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Date de minute <span className="text-red-400">*</span></Label>
                                                        <Input type="date" value={minutesData[index]?.date_minute || ""} onChange={(e) => onUpdateMinuteData(index, 'date_minute', e.target.value)} required className="bg-slate-700 border-slate-600" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Type de minute <span className="text-red-400">*</span></Label>
                                                        <Select value={minutesData[index]?.type_minute || "Initiale"} onValueChange={(value) => onUpdateMinuteData(index, 'type_minute', value)}>
                                                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Type" /></SelectTrigger>
                                                            <SelectContent className="bg-slate-800 border-slate-700">
                                                                <SelectItem value="Initiale" className="text-white">Initiale</SelectItem>
                                                                <SelectItem value="Remplace" className="text-white">Remplace</SelectItem>
                                                                <SelectItem value="Corrige" className="text-white">Corrige</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                                <Button type="button" onClick={onCloseDossier} disabled={!minutesData.every((m) => m.minute && m.date_minute && m.type_minute)} className="bg-gradient-to-r from-red-500 to-pink-600">
                                    <Check className="w-4 h-4 mr-2" />
                                    Fermer le dossier
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CloseDossierDialog;