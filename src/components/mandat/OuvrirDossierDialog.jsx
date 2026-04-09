import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Sync formData when dossierForm changes or dialog opens
  useEffect(() => {
    if (dossierForm && open) {
      setFormData({ ...dossierForm });
      setInternalCommentaires(commentaires || []);
    }
  }, [dossierForm, open]);



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
    if (!currentUser) {
      console.error('currentUser is undefined!');
      return;
    }
    setIsCreating(true);
    try {
      console.log('handleCreate appelé, currentUser:', currentUser);
      const newDossier = await base44.entities.Dossier.create(formData);
      console.log('Dossier créé:', newDossier);

      // Créer commentaire récapitulatif des mandats
      const recapLines = [];
      (formData.mandats || []).forEach((m, i) => {
        recapLines.push(`📋 Mandat ${i + 1}: ${m.type_mandat || 'N/A'}`);
        if (m.adresse_travaux?.rue || m.adresse_travaux?.ville) {
          const parts = [m.adresse_travaux?.numeros_civiques?.[0], m.adresse_travaux?.rue, m.adresse_travaux?.ville].filter(Boolean);
          recapLines.push(`📍 Adresse: ${parts.join(', ')}`);
        }
        if (m.lots_texte) recapLines.push(`Lots (texte): ${m.lots_texte}`);
        if (m.lots?.length > 0) {
          const lotNumbers = m.lots.map(lotId => {
            const lot = lots?.find(l => l.id === lotId);
            return lot ? `${lot.cadastre} - Lot ${lot.numero_lot}` : lotId;
          }).join(', ');
          recapLines.push(`Lots: ${lotNumbers}`);
        }
        if (m.date_ouverture) recapLines.push(`Date ouverture: ${m.date_ouverture}`);
        if (m.date_signature) recapLines.push(`Date signature: ${m.date_signature}`);
        if (m.date_debut_travaux) recapLines.push(`Date début travaux: ${m.date_debut_travaux}`);
        if (m.date_livraison) recapLines.push(`Date livraison: ${m.date_livraison}`);
        if (m.minute) recapLines.push(`Minute: ${m.minute}`);
        if (m.date_minute) recapLines.push(`Date minute: ${m.date_minute}`);
        if (m.type_minute) recapLines.push(`Type minute: ${m.type_minute}`);
        if (m.prix_estime) recapLines.push(`💰 Prix estimé: ${m.prix_estime} $`);
        if (m.prix_premier_lot) recapLines.push(`💰 Prix 1er lot: ${m.prix_premier_lot} $`);
        if (m.prix_autres_lots) recapLines.push(`💰 Prix autres lots: ${m.prix_autres_lots} $`);
        if (m.rabais) recapLines.push(`Rabais: ${m.rabais} $`);
        if (m.taxes_incluses) recapLines.push(`✅ Taxes incluses`);
        if (m.prix_convenu) recapLines.push(`✅ Prix convenu`);
        if (m.utilisateur_assigne) {
          const assignedUser = (users || []).find(u => u.email === m.utilisateur_assigne);
          recapLines.push(`Assigné à: ${assignedUser?.full_name || m.utilisateur_assigne}`);
        }
        if (m.tache_actuelle) recapLines.push(`Tâche actuelle: ${m.tache_actuelle}`);
        if (m.equipe_assignee) recapLines.push(`Équipe: ${m.equipe_assignee}`);
        if (m.notes) recapLines.push(`Notes: ${m.notes}`);
        recapLines.push('');
      });

      if (recapLines.length > 0) {
        try {
          console.log('Création commentaire pour dossier', newDossier.id);
          console.log('currentUser:', currentUser);
          console.log('recapLines:', recapLines);
          const comment = await base44.entities.CommentaireDossier.create({
            dossier_id: newDossier.id,
            contenu: recapLines.join('\n'),
            utilisateur_email: currentUser?.email || '',
            utilisateur_nom: currentUser?.full_name || 'Système'
          });
          console.log('Commentaire créé:', comment);
        } catch (error) {
          console.error('Erreur création commentaire:', error);
        }
      } else {
        console.log('Aucun contenu pour le commentaire');
      }

      const allComments = internalCommentaires || [];
      if (allComments.length > 0) {
        await Promise.all(allComments.filter(c => c.contenu && !c._isRecap).map(c =>
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
      navigate(`/Dossiers?id=${newDossier.id}`);
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
          commentairesTemporaires={internalCommentaires}
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