import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { checkLotDuplicate } from "@/lib/lotValidation";
import { MessageSquare, Clock, ChevronDown, ChevronUp, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from '@tanstack/react-query';
import LotInfoStepForm from "./LotInfoStepForm";
import TypesOperationStepForm from "./TypesOperationStepForm";
import DocumentsStepFormLot from "./DocumentsStepFormLot";
import CommentairesSectionLot from "./CommentairesSectionLot";

export default function LotEditDialog({
  isOpen,
  onOpenChange,
  editingLot,
  newLotForm,
  setNewLotForm,
  availableCadastresForNewLot,
  handleLotCirconscriptionChange,
  lotInfoCollapsed,
  setLotInfoCollapsed,
  typesOperationCollapsed,
  setTypesOperationCollapsed,
  lotDocumentsCollapsed,
  setLotDocumentsCollapsed,
  CADASTRES_PAR_CIRCONSCRIPTION,
  allLots,
  commentairesTemporairesLot,
  setCommentairesTemporairesLot,
  lotActionLogs,
  setLotActionLogs,
  sidebarTabLot,
  setSidebarTabLot,
  sidebarCollapsedLot,
  setSidebarCollapsedLot,
  resetLotForm,
  showCancelLotConfirm,
  setShowCancelLotConfirm,
  handleNewLotSubmit,
  isDragOverD01,
  handleD01DragOver,
  handleD01DragLeave,
  handleD01Drop,
  isImportingD01,
  handleD01FileSelect,
  lots,
  user,
}) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [showLotDuplicateWarning, setShowLotDuplicateWarning] = useState(false);
  const [commentairesCount, setCommentairesCount] = useState(0);

  useEffect(() => {
    if (isOpen && editingLot) {
      const loadCommentairesCount = async () => {
        const comments = await base44.entities.CommentaireLot.filter({ lot_id: editingLot.id });
        setCommentairesCount(comments.length);
      };
      loadCommentairesCount();

  const handleAutoSave = async () => {
    if (!editingLot || isSaving) return;

    // Vérifier que la combinaison n'existe pas (sauf pour le lot actuel)
    const lotExistant = checkLotDuplicate(newLotForm, lots, editingLot.id);
    if (lotExistant) {
      setShowLotDuplicateWarning(true);
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.Lot.update(editingLot.id, newLotForm);
      
      // Log the modification
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: 'Modification',
        entite: 'Lot',
        entite_id: editingLot.id,
        details: `Lot ${newLotForm.numero_lot} modifié`,
      });

      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDialogChange = async (open) => {
    if (!open && editingLot) {
      // Auto-save before closing in edit mode
      await handleAutoSave();
    }
    onOpenChange(open);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!editingLot) {
      handleNewLotSubmit(e);
    } else {
      handleAutoSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-2xl">{editingLot ? "Modifier lot" : "Nouveau lot"}</DialogTitle>
        </DialogHeader>

        <motion.div
          className="flex flex-col h-[90vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-1 flex overflow-hidden">
            {/* Left column - Form - 70% */}
            <div className="flex-[0_0_70%] flex flex-col overflow-hidden border-r border-slate-800">
              <div className="sticky top-0 z-10 bg-slate-900 p-4 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
                  {editingLot && isSaving && <span className="text-xs text-emerald-400">Sauvegarde...</span>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pt-2">
                <form id="lot-form" onSubmit={handleFormSubmit} className="space-y-3">
                  {/* Import .d01 section - Only in create mode */}
                  {!editingLot && (
                    <div
                      className={`border border-dashed rounded-lg p-2 transition-all ${
                        isDragOverD01
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600 bg-slate-800/20 hover:border-slate-500'
                      }`}
                      onDragOver={handleD01DragOver}
                      onDragLeave={handleD01DragLeave}
                      onDrop={handleD01Drop}
                    >
                      {isImportingD01 ? (
                        <div className="flex items-center justify-center gap-2 text-teal-400">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">Importation...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-xs">Importer depuis un fichier .d01</span>
                          </div>
                          <label>
                            <input
                              type="file"
                              accept=".d01"
                              onChange={handleD01FileSelect}
                              className="hidden"
                            />
                            <span className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded cursor-pointer transition-colors inline-block">
                              Parcourir
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <LotInfoStepForm
                    lotForm={newLotForm}
                    onLotFormChange={(data) => setNewLotForm(data)}
                    availableCadastres={availableCadastresForNewLot}
                    onCirconscriptionChange={handleLotCirconscriptionChange}
                    isCollapsed={lotInfoCollapsed}
                    onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                    disabled={false}
                    CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                  />

                  <TypesOperationStepForm
                    typesOperation={newLotForm.types_operation || []}
                    onTypesOperationChange={(data) => setNewLotForm({...newLotForm, types_operation: data})}
                    isCollapsed={typesOperationCollapsed}
                    onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                    disabled={false}
                    CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
                    allLots={lots}
                  />

                  <DocumentsStepFormLot
                    lotNumero={newLotForm.numero_lot || ""}
                    circonscription={newLotForm.circonscription_fonciere || ""}
                    isCollapsed={lotDocumentsCollapsed}
                    onToggleCollapse={() => setLotDocumentsCollapsed(!lotDocumentsCollapsed)}
                    disabled={false}
                  />
                </form>
              </div>
            </div>

            {/* Right column - Comments and History - 30% */}
            <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
              <div
                className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                onClick={() => setSidebarCollapsedLot(!sidebarCollapsedLot)}
              >
                <div className="flex items-center gap-2">
                  {sidebarTabLot === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  <h3 className="text-slate-300 text-base font-semibold">
                    {sidebarTabLot === "commentaires" ? "Commentaires" : "Historique"}
                  </h3>
                </div>
                {sidebarCollapsedLot ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
              </div>

              {!sidebarCollapsedLot && (
                <Tabs value={sidebarTabLot} onValueChange={setSidebarTabLot} className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
                    <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                                       <MessageSquare className="w-4 h-4 mr-1" />Commentaires {(editingLot ? commentairesCount : commentairesTemporairesLot.length) > 0 && <Badge variant="outline" className="ml-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-1.5 py-0 h-5 text-[10px]">{editingLot ? commentairesCount : commentairesTemporairesLot.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                      <Clock className="w-4 h-4 mr-1" />Historique {lotActionLogs.length > 0 && <Badge variant="outline" className="ml-1 bg-orange-500/20 text-orange-400 border-orange-500/30 px-1.5 py-0 h-5 text-[10px]">{lotActionLogs.length}</Badge>}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
                    <CommentairesSectionLot
                      lotId={editingLot?.id}
                      lotTemporaire={!editingLot}
                      commentairesTemp={commentairesTemporairesLot}
                      onCommentairesTempChange={setCommentairesTemporairesLot}
                    />
                  </TabsContent>

                  <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
                    {lotActionLogs.length > 0 ? (
                      <div className="space-y-3">
                        {lotActionLogs.map((log) => (
                          <div key={log.id} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge className={`text-xs ${
                                    log.action === 'Création' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    log.action === 'Modification' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    {log.action}
                                  </Badge>
                                  <span className="text-slate-400 text-xs">
                                    {log.created_date && format(new Date(log.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                  </span>
                                </div>
                                <p className="text-slate-300 text-sm">{log.details}</p>
                                <p className="text-slate-500 text-xs mt-1">Par {log.utilisateur_nom}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500">Aucune action enregistrée</p>
                          <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>


        </motion.div>
        
        {/* Dialog d'avertissement doublon */}
        <Dialog open={showLotDuplicateWarning} onOpenChange={setShowLotDuplicateWarning}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
            <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
            <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
              <p className="text-slate-300 text-center">
                Le lot <span className="text-emerald-400 font-semibold">{newLotForm.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{newLotForm.circonscription_fonciere}</span>
                {newLotForm.cadastre ? <>, cadastre <span className="text-emerald-400 font-semibold">{newLotForm.cadastre}</span></> : null}
                {newLotForm.rang ? <>, rang <span className="text-emerald-400 font-semibold">{newLotForm.rang}</span></> : null}.
              </p>
              <div className="flex justify-center gap-3 pt-4"><Button type="button" onClick={()=>setShowLotDuplicateWarning(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button></div>
            </motion.div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}