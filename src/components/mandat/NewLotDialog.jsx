import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, Clock, ChevronUp, ChevronDown, Upload, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import LotInfoStepForm from "./LotInfoStepForm";
import TypesOperationStepForm from "./TypesOperationStepForm";
import DocumentsStepFormLot from "../lots/DocumentsStepFormLot";
import CommentairesSectionLot from "../lots/CommentairesSectionLot";
import HistoriquePanel from "./HistoriquePanel";

export default function NewLotDialog({
  isOpen,
  onOpenChange,
  editingLot,
  newLotForm,
  setNewLotForm,
  handleNewLotSubmit,
  lotInfoCollapsed,
  setLotInfoCollapsed,
  typesOperationCollapsed,
  setTypesOperationCollapsed,
  lotDocumentsCollapsed,
  setLotDocumentsCollapsed,
  availableCadastresForNewLot,
  handleLotCirconscriptionChange,
  sidebarCollapsedLot,
  setSidebarCollapsedLot,
  sidebarTabLot,
  setSidebarTabLot,
  commentairesTemporairesLot,
  setCommentairesTemporairesLot,
  lotActionLogs,
  resetLotForm,
  setShowCancelLotConfirm,
  CADASTRES_PAR_CIRCONSCRIPTION,
  lots,
  users,
  isDragOverD01,
  handleD01DragOver,
  handleD01DragLeave,
  handleD01Drop,
  isImportingD01,
  handleD01FileSelect,
  initialLotForm,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] max-h-[90vh] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50">
        <DialogHeader className="sr-only">
          <DialogTitle className="text-2xl">Nouveau lot</DialogTitle>
        </DialogHeader>
        
        <motion.div 
          className="flex flex-col h-[90vh]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex-1 flex overflow-hidden">
            {/* Colonne gauche - Formulaire - 70% */}
            <div className="flex-[0_0_70%] flex flex-col overflow-hidden border-r border-slate-800">
              <div className="sticky top-0 z-10 bg-slate-900 p-4 pb-3 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">{editingLot ? "Modifier lot" : "Nouveau lot"}</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 pt-2">
              <form id="lot-form" onSubmit={handleNewLotSubmit} className="space-y-3">
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

            {/* Colonne droite - Commentaires et Historique - 30% */}
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
                     <MessageSquare className="w-4 h-4 mr-1" />
                     Commentaires
                   </TabsTrigger>
                   <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
                     <Clock className="w-4 h-4 mr-1" />
                     Historique
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
                   <HistoriquePanel historique={lotActionLogs} users={users}/>
                 </TabsContent>
               </Tabs>
             )}
            </div>
          </div>

          {/* Boutons tout en bas */}
          <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => {
             let hasChanges = false;
             if (editingLot) {
                 hasChanges = JSON.stringify(newLotForm) !== JSON.stringify(initialLotForm) || commentairesTemporairesLot.length > 0;
             } else {
                 hasChanges = newLotForm.numero_lot || 
                   newLotForm.circonscription_fonciere || 
                   newLotForm.rang || 
                   newLotForm.types_operation.length > 0 ||
                   commentairesTemporairesLot.length > 0;
             }

              if (hasChanges) {
                setShowCancelLotConfirm(true);
              } else {
                onOpenChange(false);
                resetLotForm();
              }
            }} className="border-red-500 text-red-400 hover:bg-red-500/10">
              Annuler
            </Button>
            <Button type="submit" form="lot-form" className="bg-gradient-to-r from-emerald-500 to-teal-600">
               {editingLot ? "Modifier" : "Créer"}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}