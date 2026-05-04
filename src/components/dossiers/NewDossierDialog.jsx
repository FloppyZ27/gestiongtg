import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EditDossierForm from "./EditDossierForm";

export default function NewDossierDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  clients,
  lots,
  users,
  onSubmit,
  onCancel,
  updateMandat,
  addMandat,
  removeMandat,
  openLotSelector,
  removeLotFromMandat,
  openAddMinuteDialog,
  removeMinuteFromMandat,
  getLotById,
  setIsClientFormDialogOpen,
  setClientTypeForForm,
  setViewingClientDetails,
  calculerProchainNumeroDossier,
  editingDossier,
  onOpenNewLotDialog,
  setEditingClient,
  setEditingLot,
  setNewLotForm,
  setLotActionLogs,
  triggerButton = true
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button 
            onClick={() => onOpenChange(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/50">
            <Plus className="w-5 h-5 mr-2" />
            Nouveau dossier
          </Button>
        </DialogTrigger>
      )}
      <DialogContent 
        className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50"
        style={{ marginTop: '19px', height: 'calc(90vh - 5px)', maxHeight: 'calc(90vh - 5px)' }}
        hideClose
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>
        <EditDossierForm
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          lots={lots}
          users={users}
          onSubmit={onSubmit}
          onCancel={onCancel}
          updateMandat={updateMandat}
          addMandat={addMandat}
          removeMandat={removeMandat}
          openLotSelector={openLotSelector}
          removeLotFromMandat={removeLotFromMandat}
          openAddMinuteDialog={openAddMinuteDialog}
          removeMinuteFromMandat={removeMinuteFromMandat}
          getLotById={getLotById}
          setIsClientFormDialogOpen={setIsClientFormDialogOpen}
          setClientTypeForForm={setClientTypeForForm}
          setViewingClientDetails={setViewingClientDetails}
          calculerProchainNumeroDossier={calculerProchainNumeroDossier}
          editingDossier={editingDossier}
          onOpenNewLotDialog={onOpenNewLotDialog}
          setEditingClient={setEditingClient}
          setEditingLot={setEditingLot}
          setNewLotForm={setNewLotForm}
          setLotActionLogs={setLotActionLogs}
        />
      </DialogContent>
    </Dialog>
  );
}