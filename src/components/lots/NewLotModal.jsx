/**
 * NewLotModal — utilise le même principe que ClientFormDialog:
 * un Dialog Radix standard avec les mêmes styles.
 */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Loader2, MessageSquare, Clock } from "lucide-react";
import { CADASTRE_CODES, CADASTRES_PAR_CIRCONSCRIPTION } from "../../lib/cadastreCodes";
import { TooltipProvider } from "@/components/ui/tooltip";
import LotInfoStepForm from "./LotInfoStepForm";
import TypesOperationStepForm from "./TypesOperationStepForm";
import DocumentsStepFormLot from "./DocumentsStepFormLot";
import CommentairesSectionLot from "./CommentairesSectionLot";

export default function NewLotModal({
  open,
  onClose,
  editingLot,
  lots,
  onLotCreated,
  onLotUpdated,
}) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [lotForm, setLotForm] = React.useState({
    numero_lot: "",
    circonscription_fonciere: "",
    cadastre: "Québec",
    rang: "",
    types_operation: []
  });
  const [availableCadastres, setAvailableCadastres] = React.useState([]);
  const [commentairesTemp, setCommentairesTemp] = React.useState([]);
  const [lotInfoCollapsed, setLotInfoCollapsed] = React.useState(false);
  const [typesOperationCollapsed, setTypesOperationCollapsed] = React.useState(false);
  const [lotDocumentsCollapsed, setLotDocumentsCollapsed] = React.useState(false);
  const [sidebarTab, setSidebarTab] = React.useState("commentaires");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [actionLogs, setActionLogs] = React.useState([]);
  const [isImportingD01, setIsImportingD01] = React.useState(false);
  const [isDragOverD01, setIsDragOverD01] = React.useState(false);
  const [showLotExistsWarning, setShowLotExistsWarning] = React.useState(false);
  const [showMissingFieldsWarning, setShowMissingFieldsWarning] = React.useState(false);
  const [showD01ImportSuccess, setShowD01ImportSuccess] = React.useState(false);

  // Initialiser le formulaire lors de l'ouverture
  React.useEffect(() => {
    if (!open) return;
    if (editingLot) {
      setLotForm({
        numero_lot: editingLot.numero_lot || "",
        circonscription_fonciere: editingLot.circonscription_fonciere || "",
        cadastre: editingLot.cadastre || "Québec",
        rang: editingLot.rang || "",
        types_operation: editingLot.types_operation || [],
        document_pdf_url: editingLot.document_pdf_url || ""
      });
      if (editingLot.circonscription_fonciere) {
        setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[editingLot.circonscription_fonciere] || []);
      }
      base44.entities.ActionLog.filter({ entite: 'Lot', entite_id: editingLot.id }, '-created_date')
        .then(logs => setActionLogs(logs));
    } else {
      setLotForm({ numero_lot: "", circonscription_fonciere: "", cadastre: "Québec", rang: "", types_operation: [] });
      setAvailableCadastres([]);
      setCommentairesTemp([]);
      setActionLogs([]);
    }
    setLotInfoCollapsed(false);
    setTypesOperationCollapsed(false);
    setLotDocumentsCollapsed(false);
    setSidebarTab("commentaires");
    setSidebarCollapsed(false);
  }, [open, editingLot]);

  const createLotMutation = useMutation({
    mutationFn: async (lotData) => {
      const newLot = await base44.entities.Lot.create(lotData);
      if (commentairesTemp.length > 0) {
        await Promise.all(commentairesTemp.map(c =>
          base44.entities.CommentaireLot.create({
            lot_id: newLot.id,
            contenu: c.contenu,
            utilisateur_email: c.utilisateur_email,
            utilisateur_nom: c.utilisateur_nom
          })
        ));
      }
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || "",
        utilisateur_nom: user?.full_name || "Système",
        action: "Création",
        entite: "Lot",
        entite_id: newLot.id,
        details: `Lot ${lotData.numero_lot} créé`
      });
      return newLot;
    },
    onSuccess: (newLot) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      if (onLotCreated) onLotCreated(newLot);
      onClose();
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, lotData }) => {
      const updatedLot = await base44.entities.Lot.update(id, lotData);
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || '',
        action: 'Modification',
        entite: 'Lot',
        entite_id: id,
        details: `Lot ${lotData.numero_lot} modifié`
      });
      return updatedLot;
    },
    onSuccess: (updatedLot) => {
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      if (onLotUpdated) onLotUpdated(updatedLot);
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lotForm.numero_lot || !lotForm.circonscription_fonciere) {
      setShowMissingFieldsWarning(true);
      return;
    }
    const lotExistant = lots?.find(l =>
      l.numero_lot === lotForm.numero_lot &&
      l.circonscription_fonciere === lotForm.circonscription_fonciere &&
      l.id !== editingLot?.id
    );
    if (lotExistant) {
      setShowLotExistsWarning(true);
      return;
    }
    if (editingLot) {
      updateLotMutation.mutate({ id: editingLot.id, lotData: lotForm });
    } else {
      createLotMutation.mutate(lotForm);
    }
  };

  const handleCirconscriptionChange = (value) => {
    setLotForm(prev => ({ ...prev, circonscription_fonciere: value, cadastre: prev.cadastre || "Québec" }));
    setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[value] || []);
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
      if (lotLine) {
        const lotParts = lotLine.split(';');
        extractedData.numero_lot = lotParts[1] || '';
      }
      if (suLine) {
        const suParts = suLine.split(';');
        extractedData.circonscription_fonciere = suParts[2] || '';
        const dateBpd = suParts[3] || '';
        if (dateBpd.length === 8 && /^\d{8}$/.test(dateBpd)) {
          const year = dateBpd.substring(0, 4);
          const month = dateBpd.substring(4, 6);
          const day = dateBpd.substring(6, 8);
          extractedData.date_bpd = `${year}-${month}-${day}`;
        } else {
          extractedData.date_bpd = dateBpd;
        }
      }
      const concordances_anterieures = coLines.map(coLine => {
        const coParts = coLine.split(';');
        const cadastreCode = coParts[1] || '';
        const cadastre = CADASTRE_CODES[cadastreCode] || cadastreCode || 'Québec';
        let rang = coParts[2] ? coParts[2].replace('R', 'Rang ') : '';
        if (rang.match(/^Rang 0(\d+)$/)) rang = rang.replace(/^Rang 0/, 'Rang ');
        return {
          circonscription_fonciere: extractedData.circonscription_fonciere,
          cadastre,
          numero_lot: coParts[3] || '',
          rang,
          est_partie: coParts[4] === 'O'
        };
      });
      const typeOperation = {
        type_operation: "Remplacement",
        date_bpd: extractedData.date_bpd || '',
        concordances_anterieures
      };
      if (extractedData.circonscription_fonciere) {
        setAvailableCadastres(CADASTRES_PAR_CIRCONSCRIPTION[extractedData.circonscription_fonciere] || []);
      }
      setLotForm(prev => ({
        ...prev,
        numero_lot: extractedData.numero_lot || prev.numero_lot,
        circonscription_fonciere: extractedData.circonscription_fonciere || prev.circonscription_fonciere,
        cadastre: 'Québec',
        types_operation: [typeOperation]
      }));
      setShowD01ImportSuccess(true);
    } catch (error) {
      alert("Erreur lors de l'importation du fichier .d01");
    } finally {
      setIsImportingD01(false);
    }
  };

  const isPending = createLotMutation.isPending || updateLotMutation.isPending;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent
          className="border border-white/20 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden"
          style={{
            marginTop: '35px',
            maxHeight: 'calc(100vh - 43px)',
            background: 'rgba(30, 41, 59, 0.9)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { e.preventDefault(); onClose(); }}
          hideClose
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{editingLot ? "Modifier lot" : "Nouveau lot"}</DialogTitle>
          </DialogHeader>

          <motion.div
            className="flex flex-col h-[calc(100vh-160px)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-slate-900 px-6 py-3 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-2xl font-bold" style={{
                background: 'linear-gradient(90deg, hsl(0,80%,62%), hsl(22,90%,65%))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent'
              }}>
                {editingLot ? "Modifier lot" : "Nouveau lot"}
              </h2>
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">

              {/* Formulaire - 70% */}
              <div className="flex-[0_0_70%] flex flex-col overflow-hidden border-r border-slate-800">
                <div className="flex-1 overflow-y-auto p-6 pt-3">
                  <form id="new-lot-modal-form" onSubmit={handleSubmit} className="space-y-3">

                    {/* Import .d01 */}
                    {!editingLot && (
                      <div
                        style={{
                          border: `1px dashed ${isDragOverD01 ? 'hsl(152,76%,40%)' : 'hsl(220,10%,35%)'}`,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          marginBottom: '12px',
                          background: isDragOverD01 ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                          transition: 'all 0.2s'
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverD01(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOverD01(false); }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation(); setIsDragOverD01(false);
                          const file = e.dataTransfer.files[0];
                          if (file?.name.endsWith('.d01')) handleD01Import(file);
                          else alert("Veuillez déposer un fichier .d01");
                        }}
                      >
                        {isImportingD01 ? (
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Importation...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4 text-slate-400" />
                              <span className="text-xs text-slate-400">Importer depuis un fichier .d01</span>
                            </div>
                            <label className="cursor-pointer">
                              <input type="file" accept=".d01" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) handleD01Import(file); }} />
                              <span className="px-3 py-1 bg-emerald-600/60 hover:bg-emerald-600/80 text-white text-xs rounded cursor-pointer transition-colors">
                                Parcourir
                              </span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Info lot */}
                    <LotInfoStepForm
                      lotForm={lotForm}
                      onLotFormChange={setLotForm}
                      availableCadastres={availableCadastres}
                      onCirconscriptionChange={handleCirconscriptionChange}
                      isCollapsed={lotInfoCollapsed}
                      onToggleCollapse={() => setLotInfoCollapsed(!lotInfoCollapsed)}
                    />

                    {/* Types d'opération */}
                    <TypesOperationStepForm
                      lotForm={lotForm}
                      onLotFormChange={setLotForm}
                      lots={lots || []}
                      isCollapsed={typesOperationCollapsed}
                      onToggleCollapse={() => setTypesOperationCollapsed(!typesOperationCollapsed)}
                    />

                    {/* Documents */}
                    {editingLot && (
                      <DocumentsStepFormLot
                        lot={editingLot}
                        isCollapsed={lotDocumentsCollapsed}
                        onToggleCollapse={() => setLotDocumentsCollapsed(!lotDocumentsCollapsed)}
                      />
                    )}

                  </form>
                </div>
              </div>

              {/* Sidebar - 30% */}
              <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
                {/* Toggle sidebar */}
                <div
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {sidebarTab === "commentaires"
                      ? <MessageSquare className="w-5 h-5 text-slate-400" />
                      : <Clock className="w-5 h-5 text-slate-400" />}
                    <h3 className="text-slate-300 text-base font-semibold">
                      {sidebarTab === "commentaires" ? "Commentaires" : "Historique"}
                    </h3>
                  </div>
                  <span className="text-slate-400 text-xs">{sidebarCollapsed ? '▼' : '▲'}</span>
                </div>

                {!sidebarCollapsed && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-800 px-3 gap-1 flex-shrink-0">
                      {['commentaires', 'historique'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setSidebarTab(tab)}
                          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                            sidebarTab === tab
                              ? 'border-emerald-400 text-emerald-400'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                          style={{ marginBottom: '-1px' }}
                        >
                          {tab === 'commentaires' ? 'Commentaires' : 'Historique'}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-hidden p-3">
                      {sidebarTab === 'commentaires' && (
                        <CommentairesSectionLot
                          lotId={editingLot?.id || null}
                          dossierTemporaire={!editingLot}
                          commentairesTemp={commentairesTemp}
                          onCommentairesTempChange={setCommentairesTemp}
                        />
                      )}
                      {sidebarTab === 'historique' && (
                        <div className="overflow-y-auto h-full">
                          {actionLogs.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center mt-8">Aucun historique</p>
                          ) : (
                            actionLogs.map((log, idx) => (
                              <div key={idx} className="p-3 mb-2 bg-slate-800/50 rounded-lg border border-slate-700 text-xs">
                                <p className="text-white font-semibold">{log.action}</p>
                                {log.details && <p className="text-slate-400 mt-0.5">{log.details}</p>}
                                <p className="text-slate-500 mt-1">{log.utilisateur_nom} — {new Date(log.created_date).toLocaleString('fr-CA')}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-red-400 border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="new-lot-modal-form"
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 transition-colors"
              >
                {isPending ? 'Sauvegarde...' : editingLot ? 'Enregistrer' : 'Créer le lot'}
              </button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Dialogs d'avertissement inline */}
      <Dialog open={showLotExistsWarning} onOpenChange={setShowLotExistsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Le lot <span className="text-emerald-400 font-semibold">{lotForm.numero_lot}</span> existe déjà dans <span className="text-emerald-400 font-semibold">{lotForm.circonscription_fonciere}</span>.</p>
            <div className="flex justify-center pt-4">
              <button onClick={() => setShowLotExistsWarning(false)} className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm">Compris</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMissingFieldsWarning} onOpenChange={setShowMissingFieldsWarning}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Veuillez remplir les champs obligatoires : <span className="text-red-400 font-semibold">Numéro de lot</span> et <span className="text-red-400 font-semibold">Circonscription foncière</span>.</p>
            <div className="flex justify-center pt-4">
              <button onClick={() => setShowMissingFieldsWarning(false)} className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm">Compris</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showD01ImportSuccess} onOpenChange={setShowD01ImportSuccess}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-emerald-400 flex items-center justify-center gap-3">
              <span className="text-2xl">✅</span>Succès<span className="text-2xl">✅</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Données importées avec succès depuis le fichier .d01</p>
            <div className="flex justify-center pt-4">
              <button onClick={() => setShowD01ImportSuccess(false)} className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm">OK</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}