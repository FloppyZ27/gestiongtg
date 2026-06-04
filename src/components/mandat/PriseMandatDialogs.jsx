import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";

import OuvrirDossierDialog from "./OuvrirDossierDialog";
import StatutChangeConfirmDialog from "./StatutChangeConfirmDialog";
import ConfirmDeleteDialog from "../shared/ConfirmDeleteDialog";
import PriseMandatAlertDialogs from "./PriseMandatAlertDialogs";
import ClientSelectorDialogs from "./ClientSelectorDialogs";
import LotSelectorDialog from "./LotSelectorDialog";
import LotEditDialog from "../lots/LotEditDialog";
import ClientFormDialog from "../clients/ClientFormDialog";
import ViewDossierDialog from "./ViewDossierDialog";
import ClientDetailView from "../clients/ClientDetailView";

export default function PriseMandatDialogs({
  // Statut change
  showStatutChangeConfirm, setShowStatutChangeConfirm, pendingStatutChange, setPendingStatutChange,
  formData, clientInfo, professionnelInfo, workAddress, mandatsInfo, historique, setHistorique,
  user, editingPriseMandat, isLocked, updatePriseMandatMutation, calculerProchainNumeroDossier,
  setFormData, setHasDocuments,
  // Cancel dialogs
  showCancelConfirm, setShowCancelConfirm, showUnsavedWarning, setShowUnsavedWarning,
  resetFullForm, setIsLocked, setLockedBy, setIsDialogOpen, commentairesTemporaires,
  // Ouvrir dossier
  isOuvrirDossierDialogOpen, setIsOuvrirDossierDialogOpen, nouveauDossierForm, commentairesTemporairesDossier,
  clients, lots, users, setIsDialogOpen2,
  // D01 import success
  showD01ImportSuccess, setShowD01ImportSuccess,
  // Alert dialogs
  showDeleteMandatConfirm, setShowDeleteMandatConfirm, mandatIndexToDelete, setMandatIndexToDelete,
  setNouveauDossierForm, setActiveTabMandatDossier,
  showMissingUserWarning, setShowMissingUserWarning,
  showArpenteurRequiredDialog, setShowArpenteurRequiredDialog,
  showDeleteConcordanceConfirm, setShowDeleteConcordanceConfirm, concordanceIndexToDelete, setConcordanceIndexToDelete, setNewLotForm,
  showCancelLotConfirm, setShowCancelLotConfirm, setIsNewLotDialogOpen, resetLotForm,
  showLotExistsWarning, setShowLotExistsWarning, newLotForm,
  showLotMissingFieldsWarning, setShowLotMissingFieldsWarning,
  showConcordanceWarning, setShowConcordanceWarning,
  // Delete prise de mandat
  showDeletePriseMandatConfirm, setShowDeletePriseMandatConfirm, priseMandatIdToDelete, setPriseMandatIdToDelete,
  deletePriseMandatMutation,
  // Minute dialog
  isAddMinuteDialogOpen, setIsAddMinuteDialogOpen, newMinuteForm, setNewMinuteForm, handleAddMinuteFromDialog,
  // Client selector
  isClientSelectorOpen, setIsClientSelectorOpen, isNotaireSelectorOpen, setIsNotaireSelectorOpen,
  isCourtierSelectorOpen, setIsCourtierSelectorOpen,
  clientSearchTerm, setClientSearchTerm, notaireSearchTerm, setNotaireSearchTerm,
  courtierSearchTerm, setCourtierSearchTerm,
  filteredClientsForSelector, filteredNotairesForSelector, filteredCourtiersForSelector,
  openClientFormDialog, toggleClient,
  // Client form dialog
  isClientFormDialogOpen, setIsClientFormDialogOpen, editingClientForForm, setEditingClientForForm,
  clientTypeForForm, clientFormInitialData, setClientFormInitialData, isOuvrirDossierDialogOpen2,
  // Lot selector
  isLotSelectorOpen, setIsLotSelectorOpen, lotSearchTerm, setLotSearchTerm,
  lotCirconscriptionFilter, setLotCirconscriptionFilter, lotCadastreFilter, setLotCadastreFilter,
  currentMandatIndex, addLotToCurrentMandat,
  // Lot edit
  isNewLotDialogOpen, editingLot, availableCadastresForNewLot, handleLotCirconscriptionChange,
  lotInfoCollapsed, setLotInfoCollapsed, typesOperationCollapsed, setTypesOperationCollapsed,
  lotDocumentsCollapsed, setLotDocumentsCollapsed, CADASTRES_PAR_CIRCONSCRIPTION,
  commentairesTemporairesLot, setCommentairesTemporairesLot, lotActionLogs, setLotActionLogs,
  sidebarTabLot, setSidebarTabLot, sidebarCollapsedLot, setSidebarCollapsedLot,
  isDragOverD01, handleD01DragOver, handleD01DragLeave, handleD01Drop, isImportingD01, handleD01FileSelect,
  handleNewLotSubmit,
  // Viewing client
  viewingClientDetails, setViewingClientDetails,
  // View dossier
  isViewDialogOpen, setIsViewDialogOpen, viewingDossier, setViewingDossier,
  getArpenteurInitials, getStatutBadgeColor, getClientById, handleEditFromView,
}) {
  const queryClient = useQueryClient();

  return (
    <>
      <StatutChangeConfirmDialog
        open={showStatutChangeConfirm}
        onOpenChange={(open) => { setShowStatutChangeConfirm(open); if (!open) setPendingStatutChange(null); }}
        pendingStatutChange={pendingStatutChange}
        formData={formData} clientInfo={clientInfo} professionnelInfo={professionnelInfo}
        workAddress={workAddress} mandatsInfo={mandatsInfo} historique={historique} setHistorique={setHistorique}
        user={user} editingPriseMandat={editingPriseMandat} isLocked={isLocked}
        updatePriseMandatMutation={updatePriseMandatMutation}
        newNumeroDossier={pendingStatutChange === "Mandats à ouvrir" ? calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id) : null}
        onConfirm={(newFormData) => { setFormData(newFormData); setShowStatutChangeConfirm(false); setPendingStatutChange(null); setHasDocuments(false); }}
      />

      {[{open:showCancelConfirm,close:()=>setShowCancelConfirm(false)},{open:showUnsavedWarning,close:()=>setShowUnsavedWarning(false)}].map((d,i)=>(
        <Dialog key={i} open={d.open} onOpenChange={d.close}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
            <DialogHeader><DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3"><span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span></DialogTitle></DialogHeader>
            <motion.div className="space-y-4" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.15}}>
              <p className="text-slate-300 text-center">Êtes-vous sûr de vouloir annuler ? Toutes les informations saisies seront perdues.</p>
              <div className="flex justify-center gap-3 pt-4">
                <Button type="button" className="bg-gradient-to-r from-red-500 to-red-600 border-none" onClick={async()=>{if(editingPriseMandat&&!isLocked){await base44.entities.PriseMandat.update(editingPriseMandat.id,{...editingPriseMandat,locked_by:null,locked_at:null});queryClient.invalidateQueries({queryKey:['priseMandats']});}resetFullForm();setIsLocked(false);setLockedBy("");d.close();setIsDialogOpen(false);}}>Abandonner</Button>
                <Button type="button" onClick={d.close} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Continuer l'édition</Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      ))}

      <OuvrirDossierDialog
        open={isOuvrirDossierDialogOpen} onOpenChange={setIsOuvrirDossierDialogOpen}
        dossierForm={nouveauDossierForm} commentaires={commentairesTemporairesDossier}
        clients={clients} lots={lots} users={users}
        editingPriseMandat={editingPriseMandat}
        onSuccess={() => { setIsOuvrirDossierDialogOpen(false); setIsDialogOpen(false); resetFullForm(); }}
      />

      <Dialog open={showD01ImportSuccess} onOpenChange={setShowD01ImportSuccess}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader><DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3"><span className="text-2xl">✅</span>Succès<span className="text-2xl">✅</span></DialogTitle></DialogHeader>
          <div className="space-y-4 p-2">
            <p className="text-slate-300 text-center">Données importées avec succès depuis le fichier .d01</p>
            <div className="flex justify-center pt-4"><Button type="button" onClick={() => setShowD01ImportSuccess(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">OK</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <PriseMandatAlertDialogs
        showDeleteMandatConfirm={showDeleteMandatConfirm} setShowDeleteMandatConfirm={setShowDeleteMandatConfirm} mandatIndexToDelete={mandatIndexToDelete} setMandatIndexToDelete={setMandatIndexToDelete} setNouveauDossierForm={setNouveauDossierForm} setActiveTabMandatDossier={setActiveTabMandatDossier}
        showMissingUserWarning={showMissingUserWarning} setShowMissingUserWarning={setShowMissingUserWarning}
        showArpenteurRequiredDialog={showArpenteurRequiredDialog} setShowArpenteurRequiredDialog={setShowArpenteurRequiredDialog}
        showDeleteConcordanceConfirm={showDeleteConcordanceConfirm} setShowDeleteConcordanceConfirm={setShowDeleteConcordanceConfirm} concordanceIndexToDelete={concordanceIndexToDelete} setConcordanceIndexToDelete={setConcordanceIndexToDelete} setNewLotForm={setNewLotForm}
        showCancelLotConfirm={showCancelLotConfirm} setShowCancelLotConfirm={setShowCancelLotConfirm} setIsNewLotDialogOpen={setIsNewLotDialogOpen} resetLotForm={resetLotForm}
        showLotExistsWarning={showLotExistsWarning} setShowLotExistsWarning={setShowLotExistsWarning} newLotForm={newLotForm}
        showLotMissingFieldsWarning={showLotMissingFieldsWarning} setShowLotMissingFieldsWarning={setShowLotMissingFieldsWarning}
        showConcordanceWarning={showConcordanceWarning} setShowConcordanceWarning={setShowConcordanceWarning}
      />

      <ConfirmDeleteDialog
        open={showDeletePriseMandatConfirm}
        onOpenChange={(open) => { setShowDeletePriseMandatConfirm(open); if (!open) setPriseMandatIdToDelete(null); }}
        onConfirm={() => { if(priseMandatIdToDelete) deletePriseMandatMutation.mutate(priseMandatIdToDelete); }}
        message="Êtes-vous sûr de vouloir supprimer cette prise de mandat ? Cette action est irréversible."
      />

      {isAddMinuteDialogOpen && (
        <Dialog open={isAddMinuteDialogOpen} onOpenChange={setIsAddMinuteDialogOpen}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-md shadow-2xl shadow-black/50">
            <DialogHeader><DialogTitle className="text-xl">Ajouter une minute</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Minute <span className="text-red-400">*</span></Label><Input value={newMinuteForm.minute} onChange={(e) => setNewMinuteForm({ ...newMinuteForm, minute: e.target.value })} placeholder="Ex: 12345" className="bg-slate-800 border-slate-700" /></div>
              <div className="space-y-2"><Label>Date de minute <span className="text-red-400">*</span></Label><Input type="date" value={newMinuteForm.date_minute} onChange={(e) => setNewMinuteForm({ ...newMinuteForm, date_minute: e.target.value })} className="bg-slate-800 border-slate-700" /></div>
              <div className="space-y-2"><Label>Type de minute <span className="text-red-400">*</span></Label><Select value={newMinuteForm.type_minute} onValueChange={(value) => setNewMinuteForm({ ...newMinuteForm, type_minute: value })}><SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent className="bg-slate-800 border-slate-700"><SelectItem value="Initiale" className="text-white">Initiale</SelectItem><SelectItem value="Remplace" className="text-white">Remplace</SelectItem><SelectItem value="Corrige" className="text-white">Corrige</SelectItem></SelectContent></Select></div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsAddMinuteDialogOpen(false)} className="border-red-500 text-red-400 hover:bg-red-500/10">Annuler</Button>
                <Button type="button" onClick={handleAddMinuteFromDialog} disabled={!newMinuteForm.minute || !newMinuteForm.date_minute} className="bg-gradient-to-r from-emerald-500 to-teal-600">Ajouter</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ClientSelectorDialogs
        isClientSelectorOpen={isClientSelectorOpen} setIsClientSelectorOpen={setIsClientSelectorOpen}
        isNotaireSelectorOpen={isNotaireSelectorOpen} setIsNotaireSelectorOpen={setIsNotaireSelectorOpen}
        isCourtierSelectorOpen={isCourtierSelectorOpen} setIsCourtierSelectorOpen={setIsCourtierSelectorOpen}
        clientSearchTerm={clientSearchTerm} setClientSearchTerm={setClientSearchTerm}
        notaireSearchTerm={notaireSearchTerm} setNotaireSearchTerm={setNotaireSearchTerm}
        courtierSearchTerm={courtierSearchTerm} setCourtierSearchTerm={setCourtierSearchTerm}
        filteredClients={filteredClientsForSelector} filteredNotaires={filteredNotairesForSelector} filteredCourtiers={filteredCourtiersForSelector}
        clientsIds={formData.clients_ids} notairesIds={formData.notaires_ids || []} courtiersIds={formData.courtiers_ids || []}
        onToggleClient={(id) => toggleClient(id, 'clients')} onToggleNotaire={(id) => toggleClient(id, 'notaires')} onToggleCourtier={(id) => toggleClient(id, 'courtiers')}
        openClientFormDialog={openClientFormDialog}
      />

      <ClientFormDialog
        key={`cf-${isClientFormDialogOpen}-${clientFormInitialData?.prenom}-${clientFormInitialData?.nom}`}
        open={isClientFormDialogOpen}
        onOpenChange={(open) => { setIsClientFormDialogOpen(open); if (!open) { setEditingClientForForm(null); setClientFormInitialData(null); } }}
        editingClient={editingClientForForm}
        defaultType={clientTypeForForm}
        initialData={clientFormInitialData}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          if (clientTypeForForm === "Client" && !isOuvrirDossierDialogOpen2) setIsClientSelectorOpen(true);
          if (clientTypeForForm === "Notaire" && !isOuvrirDossierDialogOpen2) setIsNotaireSelectorOpen(true);
          if (clientTypeForForm === "Courtier immobilier" && !isOuvrirDossierDialogOpen2) setIsCourtierSelectorOpen(true);
        }}
      />

      <LotSelectorDialog
        isOpen={isLotSelectorOpen} onOpenChange={setIsLotSelectorOpen}
        lots={lots} lotSearchTerm={lotSearchTerm} setLotSearchTerm={setLotSearchTerm}
        lotCirconscriptionFilter={lotCirconscriptionFilter} setLotCirconscriptionFilter={setLotCirconscriptionFilter}
        lotCadastreFilter={lotCadastreFilter} setLotCadastreFilter={setLotCadastreFilter}
        currentMandatIndex={currentMandatIndex}
        formDataMandats={formData.mandats}
        onAddLot={addLotToCurrentMandat}
        onNewLot={() => setIsNewLotDialogOpen(true)}
      />

      <LotEditDialog
        isOpen={isNewLotDialogOpen}
        onOpenChange={(open) => { if (!open) { setIsNewLotDialogOpen(false); if (!editingLot) resetLotForm(); } else setIsNewLotDialogOpen(true); }}
        editingLot={editingLot}
        newLotForm={newLotForm} setNewLotForm={setNewLotForm}
        availableCadastresForNewLot={availableCadastresForNewLot}
        handleLotCirconscriptionChange={handleLotCirconscriptionChange}
        lotInfoCollapsed={lotInfoCollapsed} setLotInfoCollapsed={setLotInfoCollapsed}
        typesOperationCollapsed={typesOperationCollapsed} setTypesOperationCollapsed={setTypesOperationCollapsed}
        lotDocumentsCollapsed={lotDocumentsCollapsed} setLotDocumentsCollapsed={setLotDocumentsCollapsed}
        CADASTRES_PAR_CIRCONSCRIPTION={CADASTRES_PAR_CIRCONSCRIPTION}
        allLots={lots}
        commentairesTemporairesLot={commentairesTemporairesLot} setCommentairesTemporairesLot={setCommentairesTemporairesLot}
        lotActionLogs={lotActionLogs} setLotActionLogs={setLotActionLogs}
        sidebarTabLot={sidebarTabLot} setSidebarTabLot={setSidebarTabLot}
        sidebarCollapsedLot={sidebarCollapsedLot} setSidebarCollapsedLot={setSidebarCollapsedLot}
        resetLotForm={resetLotForm}
        showCancelLotConfirm={showCancelLotConfirm} setShowCancelLotConfirm={setShowCancelLotConfirm}
        handleNewLotSubmit={handleNewLotSubmit}
        isDragOverD01={isDragOverD01} handleD01DragOver={handleD01DragOver} handleD01DragLeave={handleD01DragLeave} handleD01Drop={handleD01Drop}
        isImportingD01={isImportingD01} handleD01FileSelect={handleD01FileSelect}
        lots={lots} user={user} users={users}
      />

      {viewingClientDetails && (
        <Dialog open={!!viewingClientDetails} onOpenChange={(open) => !open && setViewingClientDetails(null)}>
          <DialogContent className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[95vw] w-[95vw] h-[90vh] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col shadow-2xl shadow-black/50">
            <DialogHeader className="p-6 pb-4 border-b border-slate-800 flex-shrink-0"><DialogTitle className="text-2xl">Fiche de {viewingClientDetails?.prenom} {viewingClientDetails?.nom}</DialogTitle></DialogHeader>
            <motion.div className="flex-1 overflow-hidden p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
              <ClientDetailView client={viewingClientDetails} onClose={() => setViewingClientDetails(null)} onViewDossier={(dossier) => { setViewingClientDetails(null); setViewingDossier(dossier); setIsViewDialogOpen(true); }} />
            </motion.div>
          </DialogContent>
        </Dialog>
      )}

      <ViewDossierDialog
        isOpen={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}
        viewingDossier={viewingDossier} users={users}
        getArpenteurInitials={getArpenteurInitials} getStatutBadgeColor={getStatutBadgeColor}
        getClientById={getClientById} setViewingClientDetails={setViewingClientDetails}
        onEdit={handleEditFromView}
      />
    </>
  );
}