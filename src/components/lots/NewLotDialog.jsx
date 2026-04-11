import { useState, useEffect, useRef } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, MessageSquare, Clock, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LotInfoStepForm from "./LotInfoStepForm";
import TypesOperationStepForm from "./TypesOperationStepForm";
import DocumentsStepFormLot from "./DocumentsStepFormLot";
import CommentairesSectionLot from "./CommentairesSectionLot";

const CADASTRES_PAR_CIRCONSCRIPTION = {
  "Lac-Saint-Jean-Est": ["Québec","Canton de Caron","Canton de de l'Île","Canton de Garnier","Village d'Héberville","Canton d'Hébertville-Station","Canton de Labarre","Canton de Mésy","Canton de Métabetchouan","Canton de Signay","Canton de Taillon"],
  "Lac-Saint-Jean-Ouest": ["Québec","Canton d'Albanel","Canton de Charlevoix","Canton de Dablon","Canton de Dalmas","Canton de Demeules","Canton de Dequen","Canton de Dolbeau","Canton de Girard","Canton de Jogues","Canton de Malherbe","Canton de Métabetchouan","Canton de Milot","Canton de Normandin","Canton de Ouiatchouan","Canton de Racine","Canton de Roberval","Canton de Saint-Hilaire"],
  "Chicoutimi": ["Québec","Cité d'Arvida","Canton de Bagot","Village de Bagotville","Canton de Bégin","Canton de Boileau","Canton de Bourget","Canton de Chicoutimi","Paroisse de Chicoutimi","Ville de Chicoutimi","Canton de Dumas","Canton de Durocher","Canton de Falardeau","Canton de Ferland","Ville de Grande-Baie","Canton de Harvey","Canton de Hébert","Canton de Jonquière","Canton de Kénogami","Canton de Labrecque","Canton de Laterrière","Canton d'Otis","Canton de Périgny","Canton de Rouleau","Canton de Simard","Paroisse de Saint-Alexis","Paroisse de Saint-Alphonse","Ville de Sainte-Anne-de-Chicoutimi","Canton de Saint-Germains","Canton de Saint-Jean","Canton de Taché","Canton de Tremblay"]
};

const CADASTRE_CODES = {
  "080010": "Canton de Boilleau","080020": "Canton de Périgny","080040": "Canton de Dumas","080050": "Canton de Labrosse","080060": "Canton de Saint-Jean","080080": "Canton de Hébert","080100": "Canton d'Otis","080110": "Canton de Ferland","080120": "Paroisse de Saint-Alexis","080130": "Paroisse de Saint-Alphonse","080140": "Village de Grande-Baie","080160": "Village de Bagotville","080180": "Canton de Bagot","080200": "Canton de Laterrière","080210": "Paroisse de Chicoutimi","080220": "Ville de Chicoutimi","080240": "Canton de Chicoutimi","080260": "Cité d'Arvida","080280": "Canton de Jonquière","080300": "Canton de Kénogami","080310": "Canton de Labarre","080320": "Canton de Taché","080340": "Canton de Bourget","080360": "Canton de Simard","080380": "Canton de Tremblay","080400": "Village de Sainte-Anne-de-Chicoutimi","080410": "Canton de Harvey","080420": "Canton de Saint-Germains","080440": "Canton de Durocher","080460": "Canton de Falardeau","080480": "Canton de Bégin","080500": "Canton de Labrecque","080510": "Canton de Rouleau","080610": "Canton de Mésy","080620": "Village d'Héberville","080630": "Canton de Saint-Hilaire","080640": "Canton de Caron","080660": "Canton de Métabetchouan","080700": "Canton de Signay","080710": "Canton de De l'Île","080720": "Canton de Taillon","080740": "Canton de Garnier","080780": "Canton de Malherbe","080810": "Canton de Dablon","080820": "Canton de Dequen","080840": "Canton de Charlevoix","080860": "Canton de Roberval","080920": "Canton de Ouiatchouan","080960": "Canton de Demeulles","080980": "Canton de Parent","081000": "Canton de Racine","081010": "Canton de Dolbeau","081020": "Canton de Dalmas","081040": "Canton de Jogues","081110": "Canton de Milot","081200": "Canton d'Albanel","081210": "Canton de Normandin"
};

export default function NewLotDialog({ open, onOpenChange, onLotCreated, mandatIndex, editingLot }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ numero_lot: "", circonscription_fonciere: "", cadastre: "Québec", rang: "", types_operation: [] });
  const [initialFormData, setInitialFormData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const saveTimeoutRef = useRef(null);
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Sync formData when editingLot changes
  useEffect(() => {
    if (editingLot && open) {
      const data = {
        numero_lot: editingLot.numero_lot || "",
        circonscription_fonciere: editingLot.circonscription_fonciere || "",
        cadastre: editingLot.cadastre || "Québec",
        rang: editingLot.rang || "",
        types_operation: editingLot.types_operation || []
      };
      setFormData(data);
      setInitialFormData(JSON.parse(JSON.stringify(data)));
      setHasChanges(false);
      if (editingLot.circonscription_fonciere) {
        setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[editingLot.circonscription_fonciere] || []);
      }
    } else if (!editingLot && open) {
      resetForm();
    }
  }, [editingLot, open]);

  const [availableCadastres, setAvailableCadastres] = useState([]);
  const [hasFormChanges, setHasFormChanges] = useState(false);
  const [commentairesTemporaires, setCommentairesTemporaires] = useState([]);
  const [lotInfoCollapsed, setLotInfoCollapsed] = useState(false);
  const [typesOperationCollapsed, setTypesOperationCollapsed] = useState(false);
  const [documentsCollapsed, setDocumentsCollapsed] = useState(true);
  const [sidebarTab, setSidebarTab] = useState("commentaires");
  const [historique, setHistorique] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commentairesCount, setCommentairesCount] = useState(0);
  const [isImportingD01, setIsImportingD01] = useState(false);
  const [historiqueFilters, setHistoriqueFilters] = useState({ users: [], actions: [], dateRange: null });
  const [showHistoriqueFilters, setShowHistoriqueFilters] = useState(false);
  const [isDragOverD01, setIsDragOverD01] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showMissingFields, setShowMissingFields] = useState(false);
  const [showLotExists, setShowLotExists] = useState(false);

  const { data: lots = [] } = useQuery({ queryKey: ['lots'], queryFn: () => base44.entities.Lot.list('-created_date'), initialData: [] });
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [], retry: false });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserPhoto = (email) => {
    const u = users.find(u => u.email === email);
    return u?.photo_url || null;
  };

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, lotData }) => {
      const updatedLot = await base44.entities.Lot.update(id, lotData);
      await base44.entities.ActionLog.create({ utilisateur_email: user?.email || '', utilisateur_nom: user?.full_name || '', action: 'Modification', entite: 'Lot', entite_id: id, details: `Lot ${lotData.numero_lot} modifié` });
      return updatedLot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    }
  });

  const createLotMutation = useMutation({
    mutationFn: async (lotData) => {
      const newLot = await base44.entities.Lot.create(lotData);
      if (commentairesTemporaires.length > 0) {
        await Promise.all(commentairesTemporaires.map(c => base44.entities.CommentaireLot.create({ lot_id: newLot.id, contenu: c.contenu, utilisateur_email: c.utilisateur_email, utilisateur_nom: c.utilisateur_nom })));
      }
      await base44.entities.ActionLog.create({ utilisateur_email: user?.email || '', utilisateur_nom: user?.full_name || '', action: 'Création', entite: 'Lot', entite_id: newLot.id, details: `Lot ${lotData.numero_lot} créé` });
      return newLot;
    },
    onSuccess: (newLot) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      onLotCreated?.(newLot, mandatIndex);
      resetAndClose();
    }
  });

  const resetForm = () => {
    setFormData({ numero_lot: "", circonscription_fonciere: "", cadastre: "Québec", rang: "", types_operation: [] });
    setAvailableCadastres([]);
    setCommentairesTemporaires([]);
    setHasFormChanges(false);
    setInitialFormData(null);
    setHasChanges(false);
    if (!editingLot) {
      setHistorique([]);
    }
  };

  // Charger l'historique depuis ActionLog quand on édite un lot
  useEffect(() => {
    if (!editingLot) return;
    
    const loadHistorique = async () => {
      const logs = await base44.entities.ActionLog.filter(
        { entite: 'Lot', entite_id: editingLot.id },
        '-created_date'
      );
      setHistorique(logs.map(log => ({
        action: log.action,
        details: log.details,
        timestamp: log.created_date,
        utilisateur_nom: log.utilisateur_nom,
        utilisateur_email: log.utilisateur_email
      })));
    };
    
    loadHistorique();
  }, [editingLot?.id]);

  // Auto-save avec debounce
  useEffect(() => {
    if (!editingLot || !initialFormData) return;

    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasChanges(hasFormChanges);

    if (!hasFormChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentData = formDataRef.current;
      updateLotMutation.mutate({ id: editingLot.id, lotData: currentData });
      setInitialFormData(JSON.parse(JSON.stringify(currentData)));
      setHasChanges(false);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, editingLot, initialFormData]);

  const resetAndClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleFieldChange = (fieldName, newValue, oldValue) => {
    if (newValue !== oldValue) {
      setHistorique(prev => [...prev, {
        action: 'Modification',
        details: `${fieldName}: "${oldValue || '(vide)'}" → "${newValue || '(vide)'}"`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleCirconscriptionChange = (value) => {
    handleFieldChange('Circonscription foncière', value, formData.circonscription_fonciere);
    setFormData(prev => ({ ...prev, circonscription_fonciere: value, cadastre: prev.cadastre || "Québec" }));
    setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
    setHasFormChanges(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.numero_lot || !formData.circonscription_fonciere) { setShowMissingFields(true); return; }
    
    // Vérifier que la combinaison (numero_lot, circonscription, rang, cadastre) n'existe pas
    const lotExistant = lots.find(l =>
      l.numero_lot === formData.numero_lot &&
      l.circonscription_fonciere === formData.circonscription_fonciere &&
      (l.rang || "") === (formData.rang || "") &&
      (l.cadastre || "") === (formData.cadastre || "") &&
      l.id !== editingLot?.id // Exclure le lot en cours d'édition
    );
    if (lotExistant) { setShowLotExists(true); return; }
    
    if (!editingLot) {
      createLotMutation.mutate(formData);
    }
    // En mode édition : les modifications sont déjà sauvegardées automatiquement
    if (editingLot) {
      resetAndClose();
    }
  };

  const handleD01Import = async (file) => {
    setIsImportingD01(true);
    try {
      const fileContent = await file.text();
      const lines = fileContent.split('\n');
      const lotLine = lines.find(line => line.startsWith('LO'));
      const suLines = lines.filter(line => line.startsWith('SU'));
      let coLines = [];
      if (suLines.length >= 2) {
        const firstSuIndex = lines.indexOf(suLines[0]);
        const secondSuIndex = lines.indexOf(suLines[1]);
        coLines = lines.slice(firstSuIndex + 1, secondSuIndex).filter(line => line.startsWith('CO'));
      }
      const suLine = suLines[0];
      let extractedData = {};
      if (lotLine) { const lotParts = lotLine.split(';'); extractedData.numero_lot = lotParts[1] || ''; }
      if (suLine) {
        const suParts = suLine.split(';');
        extractedData.circonscription_fonciere = suParts[2] || '';
        const dateBpd = suParts[3] || '';
        if (dateBpd) {
          if (dateBpd.length === 8 && /^\d{8}$/.test(dateBpd)) {
            extractedData.date_bpd = `${dateBpd.substring(0,4)}-${dateBpd.substring(4,6)}-${dateBpd.substring(6,8)}`;
          } else { extractedData.date_bpd = dateBpd; }
        }
      }
      const concordances_anterieures = [];
      coLines.forEach(coLine => {
        const coParts = coLine.split(';');
        const cadastreCode = coParts[1] || '';
        const cadastre = CADASTRE_CODES[cadastreCode] || cadastreCode || 'Québec';
        let rang = coParts[2] ? coParts[2].replace('R', 'Rang ') : '';
        if (rang.match(/^Rang 0(\d+)$/)) rang = rang.replace(/^Rang 0/, 'Rang ');
        concordances_anterieures.push({ circonscription_fonciere: extractedData.circonscription_fonciere, cadastre, numero_lot: coParts[3] || '', rang, est_partie: coParts[4] === 'O' });
      });
      if (extractedData.circonscription_fonciere) setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[extractedData.circonscription_fonciere] || []);
      setFormData(prev => ({ ...prev, numero_lot: extractedData.numero_lot || prev.numero_lot, circonscription_fonciere: extractedData.circonscription_fonciere || prev.circonscription_fonciere, cadastre: 'Québec', types_operation: [{ type_operation: "Remplacement", date_bpd: extractedData.date_bpd || '', concordances_anterieures }] }));
      setHasFormChanges(true);
    } catch (error) {
      alert("Erreur lors de l'importation du fichier .d01");
    } finally { setIsImportingD01(false); }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => {
        if (!o) {
          if (!editingLot && hasFormChanges) {
            setShowCancelConfirm(true);
            return;
          }
          resetAndClose();
        }
        onOpenChange(o);
      }}>
        <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50" hideClose>
          <DialogHeader className="sr-only"><DialogTitle>Nouveau lot</DialogTitle></DialogHeader>
          <motion.div className="flex flex-col h-[90vh]" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <div className="sticky top-0 z-10 bg-slate-900 p-6 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
                {editingLot && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    Lot {editingLot.numero_lot}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Main form - 70% */}
              <div className="flex-[0_0_70%] overflow-y-auto p-6 pt-3 border-r border-slate-800">
                <form id="new-lot-form" onSubmit={handleSubmit} className="space-y-3">
                  {/* Import .d01 - Visible uniquement en mode création */}
                  {!editingLot && <div
                    className={`border border-dashed rounded-lg p-2 transition-all ${isDragOverD01 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-800/20 hover:border-slate-500'}`}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverD01(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverD01(false); }}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverD01(false); const file = e.dataTransfer.files[0]; if (file?.name.endsWith('.d01')) handleD01Import(file); else alert("Veuillez déposer un fichier .d01"); }}
                  >
                    {isImportingD01 ? (
                      <div className="flex items-center justify-center gap-2 text-teal-400"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Importation...</span></div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2"><Upload className="w-4 h-4 text-slate-400" /><span className="text-slate-400 text-xs">Importer depuis un fichier .d01</span></div>
                        <label><input type="file" accept=".d01" onChange={(e) => { const f = e.target.files[0]; if (f) handleD01Import(f); }} className="hidden" /><span className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded cursor-pointer transition-colors inline-block">Parcourir</span></label>
                      </div>
                    )}
                  </div>}

                  <LotInfoStepForm
                    lotForm={formData}
                    onLotFormChange={(data) => {
                      // Track changes for each modified field
                      if (data.numero_lot !== formData.numero_lot) {
                        handleFieldChange('Numéro de lot', data.numero_lot, formData.numero_lot);
                      }
                      if (data.cadastre !== formData.cadastre) {
                        handleFieldChange('Cadastre', data.cadastre, formData.cadastre);
                      }
                      if (data.rang !== formData.rang) {
                        handleFieldChange('Rang', data.rang, formData.rang);
                      }
                      setFormData(data);
                      setHasFormChanges(true);
                    }}
                    availableCadastres={availableCadastres}
                    onCirconscriptionChange={handleCirconscriptionChange}
                    isCollapsed={lotInfoCollapsed}
                    onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                    disabled={false}
                    CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                  />

                  <TypesOperationStepForm
                    typesOperation={formData.types_operation || []}
                    onTypesOperationChange={(data) => {
                      if (JSON.stringify(data) !== JSON.stringify(formData.types_operation)) {
                        handleFieldChange('Types d\'opération', `${data.length} opération(s)`, `${(formData.types_operation || []).length} opération(s)`);
                      }
                      setFormData({...formData, types_operation: data});
                      setHasFormChanges(true);
                    }}
                    isCollapsed={typesOperationCollapsed}
                    onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                    disabled={false}
                    CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                    allLots={lots}
                  />

                  <DocumentsStepFormLot
                    lotNumero={formData.numero_lot}
                    circonscription={formData.circonscription_fonciere}
                    isCollapsed={documentsCollapsed}
                    onToggleCollapse={() => setDocumentsCollapsed(!documentsCollapsed)}
                    disabled={false}
                  />
                </form>
              </div>

              {/* Sidebar - 30% */}
              <div className="flex-[0_0_30%] flex flex-col overflow-hidden pt-10">
                <div className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                  <div className="flex items-center gap-2">
                    {sidebarTab === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                    <h3 className="text-slate-300 text-base font-semibold">{sidebarTab === "commentaires" ? "Commentaires" : "Historique"}</h3>
                  </div>
                  {sidebarCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
                </div>
                {!sidebarCollapsed && (
                  <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                      <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300"><MessageSquare className="w-4 h-4 mr-1" />Commentaires {(editingLot ? commentairesCount : commentairesTemporaires.length) > 0 && <Badge variant="outline" className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-1.5 py-0 h-5 text-[10px]">{editingLot ? commentairesCount : commentairesTemporaires.length}</Badge>}</TabsTrigger>
                      <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300"><Clock className="w-4 h-4 mr-1" />Historique</TabsTrigger>
                    </TabsList>
                    <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                      <CommentairesSectionLot lotId={editingLot?.id} lotTemporaire={!editingLot} commentairesTemp={commentairesTemporaires} onCommentairesTempChange={setCommentairesTemporaires} onCommentairesCountChange={setCommentairesCount} />
                    </TabsContent>
                    <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0 flex flex-col">
                       <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setShowHistoriqueFilters(!showHistoriqueFilters)} className="text-xs text-slate-300 border-slate-600 hover:bg-slate-700">
                          <Filter className="w-3 h-3 mr-1" /> Filtrer
                        </Button>
                        {(historiqueFilters.users.length > 0 || historiqueFilters.actions.length > 0) && (
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">{historiqueFilters.users.length + historiqueFilters.actions.length}</Badge>
                        )}
                       </div>
                       {showHistoriqueFilters && (() => {
                        const uniqueUsers = [...new Set(historique.map(e => e.utilisateur_email))].map(email => ({ email, nom: historique.find(h => h.utilisateur_email === email)?.utilisateur_nom }));
                        const uniqueActions = [...new Set(historique.map(e => e.action))];
                        return (
                        <div className="mb-3 p-3 bg-slate-800/50 rounded border border-slate-700 flex-shrink-0 space-y-3">
                          {uniqueUsers.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-300 mb-1.5">Utilisateurs</p>
                              <div className="flex flex-wrap gap-1.5">
                                {uniqueUsers.map(user => (
                                  <button key={user.email} onClick={() => setHistoriqueFilters(prev => ({
                                    ...prev,
                                    users: prev.users.includes(user.email) ? prev.users.filter(u => u !== user.email) : [...prev.users, user.email]
                                  }))} className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                                    historiqueFilters.users.includes(user.email) ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/50' : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                  }`}>{user.nom}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {uniqueActions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-300 mb-1.5">Actions</p>
                              <div className="flex flex-wrap gap-1.5">
                                {uniqueActions.map(action => (
                                  <button key={action} onClick={() => setHistoriqueFilters(prev => ({
                                    ...prev,
                                    actions: prev.actions.includes(action) ? prev.actions.filter(a => a !== action) : [...prev.actions, action]
                                  }))} className={`text-xs px-2.5 py-1.5 rounded transition-colors ${
                                    historiqueFilters.actions.includes(action) ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50' : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700'
                                  }`}>{action}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          <button onClick={() => setHistoriqueFilters({ users: [], actions: [], dateRange: null })} className="text-xs text-slate-400 hover:text-slate-200 mt-1">Réinitialiser</button>
                        </div>
                        );
                       })()}
                       {(() => {
                        const uniqueUsers = [...new Set(historique.map(e => e.utilisateur_email))].map(email => ({ email, nom: historique.find(h => h.utilisateur_email === email)?.utilisateur_nom }));
                        const uniqueActions = [...new Set(historique.map(e => e.action))];
                        const filtered = historique
                          .filter(e => (historiqueFilters.users.length === 0 || historiqueFilters.users.includes(e.utilisateur_email)) && (historiqueFilters.actions.length === 0 || historiqueFilters.actions.includes(e.action)))
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                        return filtered.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-center"><div><Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" /><p className="text-slate-500">Aucune action</p></div></div>
                        ) : (
                          <div className="space-y-2">
                            {filtered.map((entry, idx) => (
                              <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex flex-col gap-1.5">
                                  <p className="text-white text-sm font-medium">{entry.action}</p>
                                  {entry.details && (
                                    <p className="text-slate-400 text-xs break-words">{entry.details}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-5 h-5 rounded-full flex-shrink-0 overflow-hidden bg-emerald-500/20 flex items-center justify-center">
                                      {user?.photo_url ? (
                                        <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-[9px] font-semibold text-emerald-400">{getInitials(user?.full_name)}</span>
                                      )}
                                    </div>
                                    <span className="text-emerald-400 text-xs">{user?.full_name}</span>
                                    <span className="text-slate-600 text-xs">•</span>
                                    <span className="text-slate-500 text-xs">{entry.timestamp && format(new Date(entry.timestamp), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                       })()}
                     </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>


          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialogs d'avertissement */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => { setShowCancelConfirm(false); resetAndClose(); }} className="bg-gradient-to-r from-red-500 to-red-600 border-none">Abandonner</Button>
              <Button type="button" onClick={() => setShowCancelConfirm(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMissingFields} onOpenChange={setShowMissingFields}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Veuillez remplir tous les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.</p>
            <div className="flex justify-center"><Button type="button" onClick={() => setShowMissingFields(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLotExists} onOpenChange={setShowLotExists}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">
              Le lot <span className="text-emerald-400 font-semibold">{formData.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{formData.circonscription_fonciere}</span>
              {formData.cadastre ? <>, cadastre <span className="text-emerald-400 font-semibold">{formData.cadastre}</span></> : null}
              {formData.rang ? <>, rang <span className="text-emerald-400 font-semibold">{formData.rang}</span></> : null}.
            </p>
            <div className="flex justify-center"><Button type="button" onClick={() => setShowLotExists(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}