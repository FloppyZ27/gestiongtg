import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Trash2, Grid3x3, ChevronDown, ChevronUp, FileText, Loader2, Upload, MessageSquare, Clock } from "lucide-react";
import { motion } from "framer-motion";
import CommentairesSectionLot from "../components/lots/CommentairesSectionLot";
import DocumentsStepFormLot from "../components/lots/DocumentsStepFormLot";

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": ["Québec", "Canton de Caron", "Canton de de l'Île", "Canton de Garnier", "Village d'Héberville", "Canton d'Hébertville-Station", "Canton de Labarre", "Canton de Mésy", "Canton de Métabetchouan", "Canton de Signay", "Canton de Taillon"],
  "Lac-Saint-Jean-Ouest": ["Québec", "Canton d'Albanel", "Canton de Charlevoix", "Canton de Dablon", "Canton de Dalmas", "Canton de Demeules", "Canton de Dequen", "Canton de Dolbeau", "Canton de Girard", "Canton de Jogues", "Canton de Malherbe", "Canton de Métabetchouan", "Canton de Milot", "Canton de Normandin", "Canton de Ouiatchouan", "Canton de Racine", "Canton de Roberval", "Canton de Saint-Hilaire"],
  "Chicoutimi": ["Québec", "Cité d'Arvida", "Canton de Bagot", "Village de Bagotville", "Canton de Bégin", "Canton de Boileau", "Canton de Bourget", "Canton de Chicoutimi", "Paroisse de Chicoutimi", "Ville de Chicoutimi", "Canton de Dumas", "Canton de Durocher", "Canton de Falardeau", "Canton de Ferland", "Ville de Grande-Baie", "Canton de Harvey", "Canton de Hébert", "Canton de Jonquière", "Canton de Kénogami", "Canton de Labrecque", "Canton de Laterrière", "Canton d'Otis", "Canton de Périgny", "Canton de Rouleau", "Canton de Simard", "Paroisse de Saint-Alexis", "Paroisse de Saint-Alphonse", "Ville de Sainte-Anne-de-Chicoutimi", "Canton de Saint-Germains", "Canton de Saint-Jean", "Canton de Taché", "Canton de Tremblay"]
};

export default function EditerLot() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [lotId, setLotId] = useState(null);
  const [lotForm, setLotForm] = useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "Québec",
    rang: "",
    concordances_anterieures: [],
    document_pdf_url: "",
    date_bpd: "",
    type_operation: ""
  });
  const [editingLot, setEditingLot] = useState(null);

  const { data: lots, isLoading: isLoadingLots } = useQuery({
    queryKey: ['lots'],
    queryFn: () => base44.entities.Lot.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    setLotId(id);

    if (id && lots) {
      const lot = lots.find(l => l.id === id);
      if (lot) {
        setEditingLot(lot);
        setLotForm({
          numero_lot: lot.numero_lot || "",
          circonscription_fonciere: lot.circonscription_fonciere || "",
          cadastre: lot.cadastre || "Québec",
          rang: lot.rang || "",
          concordances_anterieures: lot.concordances_anterieures || [],
          document_pdf_url: lot.document_pdf_url || "",
          date_bpd: lot.date_bpd || "",
          type_operation: lot.type_operation || "",
        });
        if (lot.circonscription_fonciere) {
            setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[lot.circonscription_fonciere] || []);
        }
      }
    }
  }, [location.search, lots]);

  const [commentairesTemporairesLot, setCommentairesTemporairesLot] = useState([]);
  const [sidebarTabLot, setSidebarTabLot] = useState("commentaires");
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [lotConcordanceCollapsed, setLotConcordanceCollapsed] = useState(false);
  const [lotDocumentsCollapsed, setLotDocumentsCollapsed] = useState(false);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [currentConcordanceForm, setCurrentConcordanceForm] = useState({
    circonscription_fonciere: "",
    cadastre: "",
    numero_lot: "",
    rang: "",
    est_partie: false
  });
  const [availableCadastresForNewLot, setAvailableCadastresForNewLot] = useState([]);
  const [availableCadastresForConcordance, setAvailableCadastresForConcordance] = useState([]);
  const [lotListSearchTerm, setLotListSearchTerm] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showConcordanceWarning, setShowConcordanceWarning] = useState(false);
  const [showDeleteConcordanceConfirm, setShowDeleteConcordanceConfirm] = useState(false);
  const [concordanceIndexToDelete, setConcordanceIndexToDelete] = useState(null);
  const [showD01ImportSuccess, setShowD01ImportSuccess] = useState(false);

  const updateLotMutation = useMutation({
    mutationFn: (data) => base44.entities.Lot.update(lotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      navigate(-1); // Go back to the previous page
    },
  });

  const handleLotSubmit = (e) => {
    e.preventDefault();
    updateLotMutation.mutate(lotForm);
  };
  
  // ... (All handler functions from the dialog)

  if (isLoadingLots) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
       <motion.div 
            className="flex flex-col h-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <div className="flex-1 flex overflow-hidden">
                {/* Colonne gauche - Formulaire - 70% */}
                <div className="flex-[0_0_70%] overflow-y-auto p-4 border-r border-slate-800">
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-white">Modifier le lot</h2>
                    </div>
                    
                    <form id="lot-form" onSubmit={handleLotSubmit} className="space-y-2">
                        {/* The entire form from the dialog goes here */}
                        {/* Section 1: Informations du lot */}
                         <Card className="border-slate-700 bg-slate-800/30">
                           <CardHeader 
                             className="cursor-pointer hover:bg-blue-900/40 transition-colors rounded-t-lg py-1 bg-blue-900/20"
                             onClick={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                           >
                             <div className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full bg-blue-500/30 flex items-center justify-center">
                                   <Grid3x3 className="w-3 h-3 text-blue-400" />
                                 </div>
                                 <CardTitle className="text-blue-300 text-sm">Informations du lot</CardTitle>
                               </div>
                               {lotInfoCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                             </div>
                           </CardHeader>
 
                           {!lotInfoCollapsed && (
                             <CardContent className="pt-1 pb-1.5 space-y-1.5">
                               <div className="grid grid-cols-2 gap-2">
                                 <div className="space-y-0.5">
                                   <Label className="text-slate-400 text-xs">Numéro de lot <span className="text-red-400">*</span></Label>
                                   <Input
                                     value={lotForm.numero_lot}
                                     onChange={(e) => setLotForm({...lotForm, numero_lot: e.target.value})}
                                     required
                                     placeholder="Ex: 1234-5678"
                                     className="bg-slate-700 border-slate-600 h-6 text-xs"
                                   />
                                 </div>
                                 <div className="space-y-0.5">
                                   <Label className="text-slate-400 text-xs">Rang</Label>
                                   <Input
                                     value={lotForm.rang}
                                     onChange={(e) => setLotForm({...lotForm, rang: e.target.value})}
                                     placeholder="Ex: Rang 4"
                                     className="bg-slate-700 border-slate-600 h-6 text-xs"
                                   />
                                 </div>
                               </div>
 
                               <div className="grid grid-cols-2 gap-2">
                                 <div className="space-y-0.5">
                                   <Label className="text-slate-400 text-xs">Circonscription foncière <span className="text-red-400">*</span></Label>
                                   <Select value={lotForm.circonscription_fonciere} onValueChange={(value) => {
                                     if (value === "") {
                                       setLotForm(prev => ({ ...prev, circonscription_fonciere: "", cadastre: "" }));
                                       setAvailableCadastresForNewLot([]);
                                     } else {
                                       setLotForm(prev => ({...prev, circonscription_fonciere: value, cadastre: ""}));
                                       setAvailableCadastresForNewLot(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
                                     }
                                   }}>
                                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                                       <SelectValue placeholder="Sélectionner" />
                                     </SelectTrigger>
                                     <SelectContent className="bg-slate-800 border-slate-700">
                                       <SelectItem value={null} className="text-slate-500 text-xs opacity-50">Effacer</SelectItem>
                                       {Object.keys(CADASTRES_PAR_CIRCONSCRIPTION).map((circ) => (
                                         <SelectItem key={circ} value={circ} className="text-white text-xs">
                                           {circ}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                                 <div className="space-y-0.5">
                                   <Label className="text-slate-400 text-xs">Cadastre</Label>
                                   <Select
                                     value={lotForm.cadastre}
                                     onValueChange={(value) => setLotForm({...lotForm, cadastre: value})}
                                     disabled={!lotForm.circonscription_fonciere}
                                   >
                                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                                       <SelectValue placeholder={lotForm.circonscription_fonciere ? "Sélectionner" : "Choisir d'abord"} />
                                     </SelectTrigger>
                                     <SelectContent className="bg-slate-800 border-slate-700 max-h-64">
                                       <SelectItem value={null} className="text-slate-500 text-xs opacity-50">Effacer</SelectItem>
                                       {availableCadastresForNewLot.map((cadastre) => (
                                         <SelectItem key={cadastre} value={cadastre} className="text-white text-xs">
                                           {cadastre}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                               </div>
 
                               <div className="grid grid-cols-2 gap-2">
                                 <div className="space-y-0.5">
                                   <Label className="text-slate-400 text-xs">Date BPD</Label>
                                   <Input
                                     type="date"
                                     value={lotForm.date_bpd}
                                     onChange={(e) => setLotForm({...lotForm, date_bpd: e.target.value})}
                                     className="bg-slate-700 border-slate-600 h-6 text-xs"
                                   />
                                 </div>
                                 <div className="space-y-0.5">
                                   <Label className="text-slate-400 text-xs">Type d'opération</Label>
                                   <Select
                                     value={lotForm.type_operation}
                                     onValueChange={(value) => setLotForm({...lotForm, type_operation: value})}
                                   >
                                     <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-6 text-xs">
                                       <SelectValue placeholder="Sélectionner" />
                                     </SelectTrigger>
                                     <SelectContent className="bg-slate-800 border-slate-700">
                                       <SelectItem value={null} className="text-slate-500 text-xs opacity-50">Effacer</SelectItem>
                                       {["Division du territoire", "Subdivision", "Remplacement", "Correction", "Annulation", "Rénovation cadastrale"].map(type => (
                                         <SelectItem key={type} value={type} className="text-white text-xs">
                                           {type}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                               </div>
                             </CardContent>
                           )}
                         </Card>

                        {/* Concordances, Documents, etc. */}
                        
                    </form>
                </div>

                {/* Colonne droite - Commentaires et Historique - 30% */}
                <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
                  {/* ... Sidebar from dialog ... */}
                </div>
            </div>

            {/* Boutons tout en bas - pleine largeur */}
            <div className="flex justify-end gap-3 p-3 bg-slate-900 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="border-red-500 text-red-400 hover:bg-red-500/10 h-8 text-sm">
                    Annuler
                </Button>
                <Button type="submit" form="lot-form" className="bg-gradient-to-r from-emerald-500 to-teal-600 h-8 text-sm">
                    Modifier
                </Button>
            </div>
        </motion.div>
    </div>
  );
}