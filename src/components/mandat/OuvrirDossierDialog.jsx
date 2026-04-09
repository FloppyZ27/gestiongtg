import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import EditDossierForm from "../dossiers/EditDossierForm";

export default function OuvrirDossierDialog({
  open,
  onOpenChange,
  dossierForm,
  commentaires,
  clients,
  lots,
  users,
  onSuccess,
  editingPriseMandat
}) {
  const [formData, setFormData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [internalCommentaires, setInternalCommentaires] = useState([]);
  const queryClient = useQueryClient();

  // Sync formData when dossierForm changes or dialog opens
  useEffect(() => {
    if (dossierForm && open) {
      setFormData({ ...dossierForm });
      setInternalCommentaires(commentaires || []);
    }
  }, [dossierForm, open]);

  // Build recap comment when formData changes
  useEffect(() => {
    if (!formData) return;
    const lines = ['<h2><strong>📋 Informations du mandat</strong></h2>'];

    // Clients
    const clientNames = (formData.clients_ids || []).map(id => {
      const c = (clients || []).find(cl => cl.id === id);
      return c ? `${c.prenom} ${c.nom}` : null;
    }).filter(Boolean);
    if (clientNames.length > 0) lines.push(`<strong>Client(s):</strong> ${clientNames.join(', ')}`);

    // Notaires
    const notaireNames = (formData.notaires_ids || []).map(id => {
      const c = (clients || []).find(cl => cl.id === id);
      return c ? `${c.prenom} ${c.nom}` : null;
    }).filter(Boolean);
    if (notaireNames.length > 0) lines.push(`<strong>Notaire(s):</strong> ${notaireNames.join(', ')}`);

    // Courtiers
    const courtierNames = (formData.courtiers_ids || []).map(id => {
      const c = (clients || []).find(cl => cl.id === id);
      return c ? `${c.prenom} ${c.nom}` : null;
    }).filter(Boolean);
    if (courtierNames.length > 0) lines.push(`<strong>Courtier(s):</strong> ${courtierNames.join(', ')}`);

    // Mandats
    (formData.mandats || []).forEach((m, i) => {
      if (!m.type_mandat) return;
      lines.push(`<br><strong>─── Mandat ${i + 1}: ${m.type_mandat} ───</strong>`);
      const addr = m.adresse_travaux;
      if (addr && (addr.rue || addr.ville)) {
        const parts = [addr.numeros_civiques?.[0], addr.rue, addr.ville, addr.province, addr.code_postal].filter(Boolean);
        lines.push(`📍 Adresse: ${parts.join(', ')}`);
      }
      if (m.date_signature) lines.push(`📅 Signature: ${m.date_signature}`);
      if (m.date_livraison) lines.push(`📅 Livraison: ${m.date_livraison}`);
      if (m.date_debut_travaux) lines.push(`📅 Début travaux: ${m.date_debut_travaux}`);
      if (m.prix_estime) lines.push(`💰 Prix estimé: ${m.prix_estime} $`);
      if (m.rabais) lines.push(`🏷️ Rabais: ${m.rabais} $`);
      if (m.taxes_incluses) lines.push(`✅ Taxes incluses`);
      if (m.prix_convenu) lines.push(`🤝 Prix convenu avec le client`);
      if (m.notes) lines.push(`📝 Notes: ${m.notes}`);
    });

    const recapContent = lines.join('\n');
    setInternalCommentaires(prev => {
      // Replace or insert recap as first comment
      const others = (prev || []).filter(c => !c._isRecap);
      return [{ _isRecap: true, contenu: recapContent, utilisateur_email: '', utilisateur_nom: 'Système' }, ...others];
    });
  }, [formData, clients]);

  const getLotById = (id) => (lots || []).find(l => l.id === id);

  const updateMandat = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const addMandat = () => {
    const first = formData.mandats[0];
    const defaultAddr = first?.adresse_travaux ? JSON.parse(JSON.stringify(first.adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "QC" };
    const defaultLots = first?.lots ? [...first.lots] : [];
    setFormData(prev => ({
      ...prev,
      mandats: [...prev.mandats, {
        type_mandat: "", date_ouverture: "", minute: "", date_minute: "", type_minute: "Initiale",
        minutes_list: [], tache_actuelle: "Ouverture", statut_terrain: "",
        adresse_travaux: defaultAddr, lots: defaultLots, lots_texte: "",
        prix_estime: 0, rabais: 0, taxes_incluses: false,
        date_livraison: "", date_signature: "", date_debut_travaux: "",
        terrain: { date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" },
        factures: [], notes: "", utilisateur_assigne: ""
      }]
    }));
  };

  const removeMandat = (index) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ?")) {
      setFormData(prev => ({ ...prev, mandats: prev.mandats.filter((_, i) => i !== index) }));
    }
  };

  const removeLotFromMandat = (mandatIndex, lotId) => {
    setFormData(prev => ({
      ...prev,
      mandats: prev.mandats.map((m, i) => i === mandatIndex ? { ...m, lots: m.lots.filter(id => id !== lotId) } : m)
    }));
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    setIsCreating(true);
    try {
      const newDossier = await base44.entities.Dossier.create(formData);

      // Créer le commentaire récapitulatif avec tous les détails des mandats
      const lines = ['<h2><strong>📋 Informations du mandat</strong></h2>'];

      // Clients
      const clientNames = (formData.clients_ids || []).map(id => {
        const c = (clients || []).find(cl => cl.id === id);
        return c ? `${c.prenom} ${c.nom}` : null;
      }).filter(Boolean);
      if (clientNames.length > 0) lines.push(`<strong>Client(s):</strong> ${clientNames.join(', ')}`);

      // Notaires
      const notaireNames = (formData.notaires_ids || []).map(id => {
        const c = (clients || []).find(cl => cl.id === id);
        return c ? `${c.prenom} ${c.nom}` : null;
      }).filter(Boolean);
      if (notaireNames.length > 0) lines.push(`<strong>Notaire(s):</strong> ${notaireNames.join(', ')}`);

      // Courtiers
      const courtierNames = (formData.courtiers_ids || []).map(id => {
        const c = (clients || []).find(cl => cl.id === id);
        return c ? `${c.prenom} ${c.nom}` : null;
      }).filter(Boolean);
      if (courtierNames.length > 0) lines.push(`<strong>Courtier(s):</strong> ${courtierNames.join(', ')}`);

      // Mandats
      (formData.mandats || []).forEach((m, i) => {
        if (!m.type_mandat) return;
        lines.push(`<br><strong>─── Mandat ${i + 1}: ${m.type_mandat} ───</strong>`);
        const addr = m.adresse_travaux;
        if (addr && (addr.rue || addr.ville)) {
          const parts = [addr.numeros_civiques?.[0], addr.rue, addr.ville, addr.province, addr.code_postal].filter(Boolean);
          lines.push(`📍 Adresse: ${parts.join(', ')}`);
        }
        if (m.date_signature) lines.push(`📅 Signature: ${m.date_signature}`);
        if (m.date_livraison) lines.push(`📅 Livraison: ${m.date_livraison}`);
        if (m.date_debut_travaux) lines.push(`📅 Début travaux: ${m.date_debut_travaux}`);
        if (m.prix_estime) lines.push(`💰 Prix estimé: ${m.prix_estime} $`);
        if (m.rabais) lines.push(`🏷️ Rabais: ${m.rabais} $`);
        if (m.taxes_incluses) lines.push(`✅ Taxes incluses`);
        if (m.prix_convenu) lines.push(`🤝 Prix convenu avec le client`);
        if (m.notes) lines.push(`📝 Notes: ${m.notes}`);
      });

      const recapContent = lines.join('\n');

      // Ajouter le commentaire récapitulatif au dossier
      await base44.entities.CommentaireDossier.create({
        dossier_id: newDossier.id,
        contenu: recapContent,
        utilisateur_email: '',
        utilisateur_nom: 'Système'
      });

      const allComments = internalCommentaires || [];
      if (allComments.length > 0) {
        await Promise.all(allComments.filter(c => c.contenu).map(c =>
          base44.entities.CommentaireDossier.create({
            dossier_id: newDossier.id,
            contenu: c.contenu,
            utilisateur_email: c.utilisateur_email || '',
            utilisateur_nom: c.utilisateur_nom || 'Système'
          })
        ));
      }

      for (const mandat of (formData.mandats || [])) {
        if (mandat.utilisateur_assigne && mandat.type_mandat) {
          await base44.entities.Notification.create({
            utilisateur_email: mandat.utilisateur_assigne,
            titre: "Nouveau mandat assigné",
            message: `Un mandat "${mandat.type_mandat}" vous a été assigné dans le dossier ${formData.numero_dossier}.`,
            type: "dossier",
            dossier_id: newDossier.id,
            lue: false
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['dossiers'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Erreur création dossier:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!formData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50"
        style={{ marginTop: '19px', maxHeight: 'calc(90vh - 5px)' }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Ouvrir le dossier</DialogTitle>
        </DialogHeader>

        <EditDossierForm
          formData={formData}
          setFormData={setFormData}
          clients={clients || []}
          lots={lots || []}
          users={users || []}
          onSubmit={handleCreate}
          onCancel={() => onOpenChange(false)}
          updateMandat={updateMandat}
          addMandat={addMandat}
          removeMandat={removeMandat}
          openLotSelector={() => {}}
          removeLotFromMandat={removeLotFromMandat}
          openAddMinuteDialog={() => {}}
          removeMinuteFromMandat={() => {}}
          getLotById={getLotById}
          setIsClientFormDialogOpen={() => {}}
          setClientTypeForForm={() => {}}
          setViewingClientDetails={() => {}}
          calculerProchainNumeroDossier={() => formData.numero_dossier}
          editingDossier={null}
          hideSections={['terrain', 'minutes', 'entree-temps', 'retour-appel']}
          commentairesTemporaires={internalCommentaires.filter(c => !c._isRecap)}
          onCommentairesTemporairesChange={(newComments) => {
            setInternalCommentaires(prev => {
              const recap = prev.filter(c => c._isRecap);
              return [...recap, ...newComments];
            });
          }}
          onOpenNewLotDialog={() => {}}
          setEditingClient={() => {}}
          setEditingLot={() => {}}
          setNewLotForm={() => {}}
          setLotActionLogs={() => {}}
        />
      </DialogContent>
    </Dialog>
  );
}