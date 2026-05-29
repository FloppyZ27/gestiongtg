import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AddMinuteDialog = ({ 
    isOpen, 
    onOpenChange, 
    newMinuteForm, 
    onNewMinuteFormChange, 
    onAddMinute 
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md flex flex-col max-h-[90vh] overflow-hidden">
                <DialogHeader className="sticky top-0 z-10 bg-slate-900 pb-4 border-b border-slate-800">
                    <DialogTitle className="text-xl">Ajouter une minute</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 px-6">
                    <div className="space-y-2">
                        <Label>Minute <span className="text-red-400">*</span></Label>
                        <Input
                            value={newMinuteForm.minute}
                            onChange={(e) => onNewMinuteFormChange({ ...newMinuteForm, minute: e.target.value })}
                            placeholder="Ex: 12345"
                            className="bg-slate-800 border-slate-700" />
                    </div>
                    <div className="space-y-2">
                        <Label>Date de minute <span className="text-red-400">*</span></Label>
                        <Input
                            type="date"
                            value={newMinuteForm.date_minute}
                            onChange={(e) => onNewMinuteFormChange({ ...newMinuteForm, date_minute: e.target.value })}
                            className="bg-slate-800 border-slate-700" />
                    </div>
                    <div className="space-y-2">
                        <Label>Type de minute <span className="text-red-400">*</span></Label>
                        <Select
                            value={newMinuteForm.type_minute}
                            onValueChange={(value) => onNewMinuteFormChange({ ...newMinuteForm, type_minute: value })}>
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
                </div>
                <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-800 bg-slate-900">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button
                        type="button"
                        onClick={onAddMinute}
                        disabled={!newMinuteForm.minute || !newMinuteForm.date_minute}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600">
                        Ajouter
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddMinuteDialog;