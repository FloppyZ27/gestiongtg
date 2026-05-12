import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MessageSquare, Upload, Loader2 } from "lucide-react";
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
  const [commentairesCount, setCommentairesCount] = useState(0);

  useEffect(() => {
    if (isOpen && editingLot) {
      const loadCommentairesCount = async () => {
        const comments = await base44.entities.CommentaireLot.filter({ lot_id: editingLot.id });
        setCommentairesCount(comments.length);
      };
      loadCommentairesCount();
    }
  }, [isOpen, editingLot]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleNewLotSubmit(e);
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-[0.5px] border border-white/20 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50" style={{ top: '50%', maxHeight: '90vh', height: '90vh', background: 'rgba(30, 41, 59, 0.9)' }} hideClose>
        <DialogHeader className="sr-only"><DialogTitle>Modifier lot</DialogTitle></DialogHeader>
        <motion.div className="flex flex-col h-full" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
          <div className="flex-shrink-0 bg-slate-900 px-6 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" style={{background: 'linear-gradient(90deg, hsl(0,85%,62%), hsl(22,90%,68%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
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
              <form id="lot-form" onSubmit={handleFormSubmit} className="space-y-3">

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

            {/* Sidebar - 30% */}
            <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mx-4 mr-6 mt-3 mb-2 flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">Commentaires</span>
                {(editingLot ? commentairesCount : commentairesTemporairesLot.length) > 0 && (
                  <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-1.5 py-0 h-5 text-[10px]">
                    {editingLot ? commentairesCount : commentairesTemporairesLot.length}
                  </Badge>
                )}
              </div>
              <div className="flex-1 overflow-hidden px-4 pr-6 pb-4">
                <CommentairesSectionLot lotId={editingLot?.id} lotTemporaire={!editingLot} commentairesTemp={commentairesTemporairesLot} onCommentairesTempChange={setCommentairesTemporairesLot} onCommentairesCountChange={setCommentairesCount} />
              </div>
            </div>
          </div>

        </motion.div>
      </DialogContent>
    </Dialog>

    </>
  );
}