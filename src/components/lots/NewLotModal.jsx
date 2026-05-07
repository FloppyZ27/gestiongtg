/**
 * NewLotModal — Modal "Nouveau lot" rendu via ReactDOM.createPortal
 * directement dans document.body, sans aucun Radix Dialog.
 * Cela évite tous les conflits de FocusScope / pointer-events
 * lorsque ce modal est déclenché depuis l'intérieur d'un autre Dialog Radix.
 */
import React from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
      // Charger l'historique
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

  // Force pointer-events — neutralise le FocusScope du Dialog Radix parent
  React.useEffect(() => {
    if (!open) return;
    const style = document.createElement('style');
    style.id = 'new-lot-modal-fix';
    style.textContent = `
      body > [data-radix-popper-content-wrapper],
      body > * > [data-radix-popper-content-wrapper] {
        pointer-events: auto !important;
        z-index: 99999 !important;
      }
      [data-radix-select-content],
      [data-radix-select-viewport],
      [data-radix-select-item],
      [data-radix-dropdown-menu-content],
      [data-radix-dropdown-menu-item],
      [data-radix-popover-content],
      [role="listbox"],
      [role="option"],
      [role="menu"],
      [role="menuitem"] {
        pointer-events: auto !important;
        z-index: 99999 !important;
      }
    `;
    document.head.appendChild(style);

    // Désactiver le FocusScope du Dialog parent pendant que le modal est ouvert
    const removeFocusBlock = () => {
      document.querySelectorAll('[data-aria-hidden="true"]').forEach(el => {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('data-aria-hidden');
      });
      document.querySelectorAll('[inert]').forEach(el => {
        el.removeAttribute('inert');
      });
    };
    removeFocusBlock();
    const observer = new MutationObserver(removeFocusBlock);
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['aria-hidden', 'inert'] });

    return () => {
      document.getElementById('new-lot-modal-fix')?.remove();
      observer.disconnect();
    };
  }, [open]);

  if (!open) return null;

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
      onMouseDown={(e) => {
        // Fermer uniquement si clic sur le fond (pas sur le modal lui-même)
        // et pas sur un Radix portal/dropdown
        if (e.target === e.currentTarget && !e.target.closest('[data-radix-popper-content-wrapper], [data-radix-select-content], [data-radix-dropdown-menu-content]')) {
          onClose();
        }
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 10, 18, 0.75)',
          backdropFilter: 'blur(10px)',
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        style={{
          position: 'relative',
          width: '75vw',
          maxWidth: '75vw',
          height: '90vh',
          maxHeight: '90vh',
          background: 'hsl(220, 13%, 10%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '0.75rem',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid hsl(220,10%,20%)', flexShrink: 0, background: 'hsl(220,13%,8%)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(90deg, hsl(0,80%,62%), hsl(22,90%,65%))', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {editingLot ? "Modifier lot" : "Nouveau lot"}
          </h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Formulaire - 70% */}
          <div style={{ flex: '0 0 70%', overflowY: 'auto', padding: '16px', borderRight: '1px solid hsl(220,10%,20%)' }}>
            <form id="new-lot-modal-form" onSubmit={handleSubmit}>

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(152,76%,50%)' }}>
                      <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: '12px' }}>Importation...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Upload style={{ width: 14, height: 14, color: 'hsl(220,8%,55%)' }} />
                        <span style={{ fontSize: '12px', color: 'hsl(220,8%,55%)' }}>Importer depuis un fichier .d01</span>
                      </div>
                      <label style={{ cursor: 'pointer' }}>
                        <input type="file" accept=".d01" style={{ display: 'none' }} onChange={(e) => { const file = e.target.files[0]; if (file) handleD01Import(file); }} />
                        <span style={{ padding: '4px 12px', background: 'hsl(152,60%,32%)', color: 'white', fontSize: '12px', borderRadius: '4px', display: 'inline-block', transition: 'background 0.2s' }}>
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

          {/* Sidebar - 30% */}
          <div style={{ flex: '0 0 30%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toggle sidebar */}
            <div
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ padding: '10px 16px', borderBottom: '1px solid hsl(220,10%,20%)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {sidebarTab === "commentaires"
                  ? <MessageSquare style={{ width: 16, height: 16, color: 'hsl(220,8%,55%)' }} />
                  : <Clock style={{ width: 16, height: 16, color: 'hsl(220,8%,55%)' }} />}
                <span style={{ color: 'hsl(210,11%,80%)', fontWeight: 600, fontSize: '14px' }}>
                  {sidebarTab === "commentaires" ? "Commentaires" : "Historique"}
                </span>
              </div>
              <span style={{ color: 'hsl(220,8%,55%)', fontSize: '12px' }}>{sidebarCollapsed ? '▼' : '▲'}</span>
            </div>

            {!sidebarCollapsed && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid hsl(220,10%,20%)', padding: '0 12px', gap: '4px', flexShrink: 0 }}>
                  {['commentaires', 'historique'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSidebarTab(tab)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: 'none',
                        border: 'none',
                        borderBottom: sidebarTab === tab ? '2px solid hsl(152,76%,40%)' : '2px solid transparent',
                        color: sidebarTab === tab ? 'hsl(152,76%,50%)' : 'hsl(220,8%,55%)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        marginBottom: '-1px'
                      }}
                    >
                      {tab === 'commentaires' ? 'Commentaires' : 'Historique'}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, overflow: 'hidden', padding: '8px' }}>
                  {sidebarTab === 'commentaires' && (
                    <CommentairesSectionLot
                      lotId={editingLot?.id || null}
                      dossierTemporaire={!editingLot}
                      commentairesTemp={commentairesTemp}
                      onCommentairesTempChange={setCommentairesTemp}
                    />
                  )}
                  {sidebarTab === 'historique' && (
                    <div style={{ overflowY: 'auto', height: '100%' }}>
                      {actionLogs.length === 0 ? (
                        <p style={{ color: 'hsl(220,8%,55%)', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>Aucun historique</p>
                      ) : (
                        actionLogs.map((log, idx) => (
                          <div key={idx} style={{ padding: '8px', borderBottom: '1px solid hsl(220,10%,20%)', fontSize: '12px' }}>
                            <p style={{ color: 'hsl(210,11%,80%)', fontWeight: 600 }}>{log.action}</p>
                            {log.details && <p style={{ color: 'hsl(220,8%,55%)' }}>{log.details}</p>}
                            <p style={{ color: 'hsl(220,8%,45%)', fontSize: '11px' }}>{log.utilisateur_nom} — {new Date(log.created_date).toLocaleString('fr-CA')}</p>
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
        <div style={{ padding: '12px 20px', borderTop: '1px solid hsl(220,10%,20%)', display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, background: 'hsl(220,13%,8%)' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'hsl(0,80%,65%)', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="new-lot-modal-form"
            disabled={isPending}
            style={{ padding: '8px 18px', borderRadius: '8px', background: 'linear-gradient(135deg, hsl(152,60%,35%), hsl(175,60%,30%))', border: 'none', color: 'white', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? 'Sauvegarde...' : editingLot ? 'Enregistrer' : 'Créer le lot'}
          </button>
        </div>

        {/* Avertissements inline */}
        {(showLotExistsWarning || showMissingFieldsWarning || showD01ImportSuccess) && (
          <div
            style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 10 }}
            onClick={() => { setShowLotExistsWarning(false); setShowMissingFieldsWarning(false); setShowD01ImportSuccess(false); }}
          >
            <div
              style={{ background: 'hsl(220,13%,12%)', border: '1px solid hsl(220,10%,25%)', borderRadius: '12px', padding: '24px', maxWidth: '420px', textAlign: 'center' }}
              onClick={e => e.stopPropagation()}
            >
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>
                {showD01ImportSuccess ? '✅' : '⚠️'}
              </p>
              <p style={{ color: 'hsl(210,11%,85%)', marginBottom: '16px', fontSize: '14px' }}>
                {showLotExistsWarning && `Le lot ${lotForm.numero_lot} existe déjà dans ${lotForm.circonscription_fonciere}.`}
                {showMissingFieldsWarning && "Veuillez remplir le Numéro de lot et la Circonscription foncière."}
                {showD01ImportSuccess && "Données importées avec succès depuis le fichier .d01"}
              </p>
              <button
                type="button"
                onClick={() => { setShowLotExistsWarning(false); setShowMissingFieldsWarning(false); setShowD01ImportSuccess(false); }}
                style={{ padding: '8px 20px', borderRadius: '8px', background: 'hsl(152,60%,35%)', border: 'none', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                OK
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  return ReactDOM.createPortal(
    <TooltipProvider>
      {modalContent}
    </TooltipProvider>,
    document.body
  );
}