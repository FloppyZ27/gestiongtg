import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, User } from "lucide-react";

const CourtierSelectorDialog = ({ 
    isOpen, 
    onOpenChange, 
    courtiers, 
    selectedCourtierIds, 
    onToggleCourtier, 
    onNewCourtier, 
    onEditCourtier, 
    searchTerm, 
    onSearchTermChange, 
    formatAdresse 
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" hideCloseButton>
                <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">Sélectionner les courtiers</DialogTitle>
                        <Button variant="outline" onClick={onNewCourtier} className="bg-orange-500 hover:bg-orange-600 border-0 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Nouveau
                        </Button>
                    </div>
                </DialogHeader>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <Input placeholder="Rechercher un courtier..." value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} className="pl-10 bg-slate-800 border-slate-700" />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-3 p-4">
                        {courtiers.length > 0 ? courtiers.map((courtier) => (
                            <div
                                key={courtier.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedCourtierIds.includes(courtier.id)
                                        ? 'bg-orange-500/20 border border-orange-500/30'
                                        : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700'
                                }`}
                                onClick={() => onToggleCourtier(courtier.id)}
                            >
                                <p className="text-white font-medium">{courtier.prenom} {courtier.nom}</p>
                                <div className="text-sm text-slate-400 space-y-1 mt-1">
                                    {courtier.adresses?.find((a) => a.actuelle) && formatAdresse(courtier.adresses.find((a) => a.actuelle)) &&
                                        <p className="truncate">📍 {formatAdresse(courtier.adresses.find((a) => a.actuelle))}</p>
                                    }
                                    {courtier.courriels?.find((c) => c.actuel)?.courriel &&
                                        <p className="truncate">✉️ {courtier.courriels.find((c) => c.actuel).courriel}</p>
                                    }
                                    {courtier.telephones?.find((t) => t.actuel)?.telephone &&
                                        <p>
                                            📞 <a href={`tel:${courtier.telephones.find((t) => t.actuel).telephone.replace(/\D/g, '')}`} className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                                                {courtier.telephones.find((t) => t.actuel).telephone}
                                            </a>
                                        </p>
                                    }
                                </div>
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEditCourtier(courtier); }} className="text-orange-400 hover:text-orange-300 mt-2 w-full">
                                    <Edit className="w-4 h-4 mr-1" />
                                    Modifier
                                </Button>
                            </div>
                        )) : (
                            <div className="col-span-2 text-center py-12 text-slate-500">
                                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun courtier trouvé</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end items-center pt-4 border-t border-slate-800">
                    <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600">Fermer</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CourtierSelectorDialog;