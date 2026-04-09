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
      
      // Adresse
      const addr = m.adresse_travaux;
      if (addr && (addr.rue || addr.ville)) {
        const parts = [addr.numeros_civiques?.[0], addr.rue, addr.ville, addr.province, addr.code_postal].filter(Boolean);
        lines.push(`📍 Adresse: ${parts.join(', ')}`);
      }
      
      // Lots
      if (m.lots && m.lots.length > 0) {
        const lotNumbers = m.lots.map(lotId => {
          const lot = getLotById(lotId);
          return lot ? `${lot.cadastre} - Lot ${lot.numero_lot}` : lotId;
        }).join(', ');
        lines.push(`🏘️ Lots: ${lotNumbers}`);
      }
      if (m.lots_texte) lines.push(`🏘️ Lots: ${m.lots_texte}`);
      
      // Dates
      if (m.date_ouverture) lines.push(`📅 Ouverture: ${m.date_ouverture}`);
      if (m.date_signature) lines.push(`📅 Signature: ${m.date_signature}`);
      if (m.date_debut_travaux) lines.push(`📅 Début travaux: ${m.date_debut_travaux}`);
      if (m.date_livraison) lines.push(`📅 Livraison: ${m.date_livraison}`);
      
      // Minutes
      if (m.minute) lines.push(`📄 Minute: ${m.minute}`);
      if (m.date_minute) lines.push(`📅 Date minute: ${m.date_minute}`);
      if (m.type_minute) lines.push(`📋 Type minute: ${m.type_minute}`);
      
      // Tarification
      if (m.prix_estime) lines.push(`💰 Prix estimé: ${m.prix_estime} $`);
      if (m.prix_premier_lot) lines.push(`💰 Prix 1er lot: ${m.prix_premier_lot} $`);
      if (m.prix_autres_lots) lines.push(`💰 Prix autres lots: ${m.prix_autres_lots} $`);
      if (m.rabais) lines.push(`🏷️ Rabais: ${m.rabais} $`);
      if (m.taxes_incluses) lines.push(`✅ Taxes incluses`);
      if (m.prix_convenu) lines.push(`🤝 Prix convenu avec le client`);
      
      // Assignation et tâche
      if (m.utilisateur_assigne) {
        const assignedUser = (users || []).find(u => u.email === m.utilisateur_assigne);
        lines.push(`👤 Assigné à: ${assignedUser?.full_name || m.utilisateur_assigne}`);
      }
      if (m.tache_actuelle) lines.push(`✏️ Tâche actuelle: ${m.tache_actuelle}`);
      if (m.equipe_assignee) lines.push(`👥 Équipe: ${m.equipe_assignee}`);
      
      // Terrain
      if (m.terrain) {
        if (m.terrain.date_limite_leve) lines.push(`🏔️ Date limite levé: ${m.terrain.date_limite_leve}`);
        if (m.terrain.instruments_requis) lines.push(`🔧 Instruments: ${m.terrain.instruments_requis}`);
        if (m.terrain.a_rendez_vous) {
          if (m.terrain.date_rendez_vous) lines.push(`📍 RDV le: ${m.terrain.date_rendez_vous}`);
          if (m.terrain.heure_rendez_vous) lines.push(`⏰ À: ${m.terrain.heure_rendez_vous}`);
        }
        if (m.terrain.donneur) lines.push(`🔑 Donneur: ${m.terrain.donneur}`);
        if (m.terrain.technicien) lines.push(`👨‍🔧 Technicien: ${m.terrain.technicien}`);
        if (m.terrain.dossier_simultane) lines.push(`📁 Dossier simultané: ${m.terrain.dossier_simultane}`);
        if (m.terrain.temps_prevu) lines.push(`⏱️ Temps prévu: ${m.terrain.temps_prevu}`);
        if (m.terrain.notes) lines.push(`📝 Terrain notes: ${m.terrain.notes}`);
      }
      
      // Notes générales
      if (m.notes) lines.push(`📝 Notes: ${m.notes}`);
    });

    const recapContent = lines.join('\n');
    setInternalCommentaires(prev => {
      const others = (prev || []).filter(c => !c._isRecap);
      return [{ _isRecap: true, contenu: recapContent, utilisateur_email: currentUser?.email || '', utilisateur_nom: currentUser?.full_name || 'Système' }, ...others];
    });
  }, [formData, clients, users, currentUser, lots]);

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
        
        // Adresse
        const addr = m.adresse_travaux;
        if (addr && (addr.rue || addr.ville)) {
          const parts = [addr.numeros_civiques?.[0], addr.rue, addr.ville, addr.province, addr.code_postal].filter(Boolean);
          lines.push(`📍 Adresse: ${parts.join(', ')}`);
        }
        
        // Lots
        if (m.lots && m.lots.length > 0) {
          const lotNumbers = m.lots.map(lotId => {
            const lot = getLotById(lotId);
            return lot ? `${lot.cadastre} - Lot ${lot.numero_lot}` : lotId;
          }).join(', ');
          lines.push(`🏘️ Lots: ${lotNumbers}`);
        }
        if (m.lots_texte) lines.push(`🏘️ Lots: ${m.lots_texte}`);
        
        // Dates
        if (m.date_ouverture) lines.push(`📅 Ouverture: ${m.date_ouverture}`);
        if (m.date_signature) lines.push(`📅 Signature: ${m.date_signature}`);
        if (m.date_debut_travaux) lines.push(`📅 Début travaux: ${m.date_debut_travaux}`);
        if (m.date_livraison) lines.push(`📅 Livraison: ${m.date_livraison}`);
        
        // Minutes
        if (m.minute) lines.push(`📄 Minute: ${m.minute}`);
        if (m.date_minute) lines.push(`📅 Date minute: ${m.date_minute}`);
        if (m.type_minute) lines.push(`📋 Type minute: ${m.type_minute}`);
        
        // Tarification
        if (m.prix_estime) lines.push(`💰 Prix estimé: ${m.prix_estime} $`);
        if (m.prix_premier_lot) lines.push(`💰 Prix 1er lot: ${m.prix_premier_lot} $`);
        if (m.prix_autres_lots) lines.push(`💰 Prix autres lots: ${m.prix_autres_lots} $`);
        if (m.rabais) lines.push(`🏷️ Rabais: ${m.rabais} $`);
        if (m.taxes_incluses) lines.push(`✅ Taxes incluses`);
        if (m.prix_convenu) lines.push(`🤝 Prix convenu avec le client`);
        
        // Assignation et tâche
        if (m.utilisateur_assigne) {
          const assignedUser = (users || []).find(u => u.email === m.utilisateur_assigne);
          lines.push(`👤 Assigné à: ${assignedUser?.full_name || m.utilisateur_assigne}`);
        }
        if (m.tache_actuelle) lines.push(`✏️ Tâche actuelle: ${m.tache_actuelle}`);
        if (m.equipe_assignee) lines.push(`👥 Équipe: ${m.equipe_assignee}`);
        
        // Terrain
        if (m.terrain) {
          if (m.terrain.date_limite_leve) lines.push(`🏔️ Date limite levé: ${m.terrain.date_limite_leve}`);
          if (m.terrain.instruments_requis) lines.push(`🔧 Instruments: ${m.terrain.instruments_requis}`);
          if (m.terrain.a_rendez_vous) {
            if (m.terrain.date_rendez_vous) lines.push(`📍 RDV le: ${m.terrain.date_rendez_vous}`);
            if (m.terrain.heure_rendez_vous) lines.push(`⏰ À: ${m.terrain.heure_rendez_vous}`);
          }
          if (m.terrain.donneur) lines.push(`🔑 Donneur: ${m.terrain.donneur}`);
          if (m.terrain.technicien) lines.push(`👨‍🔧 Technicien: ${m.terrain.technicien}`);
          if (m.terrain.dossier_simultane) lines.push(`📁 Dossier simultané: ${m.terrain.dossier_simultane}`);
          if (m.terrain.temps_prevu) lines.push(`⏱️ Temps prévu: ${m.terrain.temps_prevu}`);
          if (m.terrain.notes) lines.push(`📝 Terrain notes: ${m.terrain.notes}`);
        }
        
        // Notes générales
        if (m.notes) lines.push(`📝 Notes: ${m.notes}`);
      });

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