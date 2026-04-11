import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import EditDossierForm from "../dossiers/EditDossierForm";
import ClientFormDialog from "../clients/ClientFormDialog";
import ClientSelectionCard from "./ClientSelectionCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OuvrirDossierDialog({
  open,
  onOpenChange,
  dossierForm,
  commentaires,
  clients,
  lots,
  users,
  onSuccess,
  editingPriseMandat,
  clientInfo,
  workAddress
}) {
  const [formData, setFormData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [internalCommentaires, setInternalCommentaires] = useState([]);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [clientTypeForForm, setClientTypeForForm] = useState(null);
  const [editingClientForForm, setEditingClientForForm] = useState(null);
  const [isNewLotDialogOpen, setIsNewLotDialogOpen] = useState(false);
  const [newLotMandatIndex, setNewLotMandatIndex] = useState(null);
  const [newLotForm, setNewLotForm] = useState({ numero_lot: "", circonscription_fonciere: "", cadastre: "Québec", rang: "" });
  const [isCreatingLot, setIsCreatingLot] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });



  // Sync formData when dossierForm changes or dialog opens
  useEffect(() => {
    if (dossierForm && open && currentUser) {
      setFormData({ ...dossierForm });
      // Créer automatiquement le commentaire récapitulatif en passant les données directement
      createAutoRecapFromData(dossierForm, commentaires || []);
    }
  }, [dossierForm, open, currentUser]);

  const createAutoRecapFromData = (data, existingCommentaires) => {
    if (!data || !currentUser) return;
    const recapComment = buildRecapComment(data, currentUser);
    if (recapComment) {
      const filtered = (existingCommentaires || []).filter(c => !c._isRecap);
      setInternalCommentaires([recapComment, ...filtered]);
    } else {
      setInternalCommentaires(existingCommentaires || []);
    }
  };

  const createAutoRecap = () => {
    if (!formData || !currentUser) return null;
    const recapComment = buildRecapComment(formData, currentUser);
    if (recapComment) {
      setInternalCommentaires(prev => {
        const filtered = prev.filter(c => !c._isRecap);
        return [recapComment, ...filtered];
      });
    }
    return recapComment;
  };

  const buildRecapComment = (data, user) => {
    if (!data) return null;
    
    const recapLines = ['=== RÉCAPITULATIF DES MANDATS ===', ''];
    (data.mandats || []).forEach((m, i) => {
      recapLines.push(`📋 MANDAT ${i + 1}: ${m.type_mandat || 'N/A'}`);
      recapLines.push('─'.repeat(40));
      
      // Informations de localisation
      if (m.adresse_travaux?.rue || m.adresse_travaux?.ville) {
        const parts = [m.adresse_travaux?.numeros_civiques?.[0], m.adresse_travaux?.rue, m.adresse_travaux?.ville].filter(Boolean);
        recapLines.push(`📍 Adresse: ${parts.join(', ')}`);
      }
      if (m.adresse_travaux?.code_postal) recapLines.push(`   Code postal: ${m.adresse_travaux.code_postal}`);
      if (m.adresse_travaux?.province) recapLines.push(`   Province: ${m.adresse_travaux.province}`);
      
      // Lots
      if (m.lots_texte) recapLines.push(`🗂️ Lots (texte): ${m.lots_texte}`);
      if (m.lots?.length > 0) {
        const lotNumbers = m.lots.map(lotId => {
          const lot = lots?.find(l => l.id === lotId);
          return lot ? `${lot.cadastre} - Lot ${lot.numero_lot}` : lotId;
        }).join(', ');
        recapLines.push(`🗂️ Lots: ${lotNumbers}`);
      }
      
      // Dates importantes
      if (m.date_ouverture || m.date_signature || m.date_debut_travaux || m.date_livraison) {
        recapLines.push('📅 Dates:');
        if (m.date_ouverture) recapLines.push(`   Ouverture: ${m.date_ouverture}`);
        if (m.date_signature) recapLines.push(`   Signature: ${m.date_signature}`);
        if (m.date_debut_travaux) recapLines.push(`   Début travaux: ${m.date_debut_travaux}`);
        if (m.date_livraison) recapLines.push(`   Livraison: ${m.date_livraison}`);
      }
      
      // Minutes
      if (m.minute || m.date_minute || m.type_minute) {
        recapLines.push('📄 Minutes:');
        if (m.minute) recapLines.push(`   Numéro: ${m.minute}`);
        if (m.date_minute) recapLines.push(`   Date: ${m.date_minute}`);
        if (m.type_minute) recapLines.push(`   Type: ${m.type_minute}`);
      }
      
      // Tarification
      if (m.prix_estime || m.prix_premier_lot || m.prix_autres_lots || m.rabais) {
        recapLines.push('💰 Tarification:');
        if (m.prix_estime) recapLines.push(`   Prix estimé: ${m.prix_estime} $`);
        if (m.prix_premier_lot) recapLines.push(`   Prix 1er lot: ${m.prix_premier_lot} $`);
        if (m.prix_autres_lots) recapLines.push(`   Prix autres lots: ${m.prix_autres_lots} $`);
        if (m.rabais) recapLines.push(`   Rabais: ${m.rabais} $`);
        if (m.taxes_incluses) recapLines.push(`   ✅ Taxes incluses`);
        if (m.prix_convenu) recapLines.push(`   ✅ Prix convenu`);
      }
      
      // Assignation
      if (m.utilisateur_assigne || m.tache_actuelle || m.equipe_assignee) {
        recapLines.push('👤 Assignation:');
        if (m.utilisateur_assigne) {
          const assignedUser = (users || []).find(u => u.email === m.utilisateur_assigne);
          recapLines.push(`   Responsable: ${assignedUser?.full_name || m.utilisateur_assigne}`);
        }
        if (m.tache_actuelle) recapLines.push(`   Tâche actuelle: ${m.tache_actuelle}`);
        if (m.equipe_assignee) recapLines.push(`   Équipe: ${m.equipe_assignee}`);
      }
      
      // Notes
      if (m.notes) recapLines.push(`📝 Notes: ${m.notes}`);
      
      recapLines.push('');
    });

    if (recapLines.length > 2) {
      return {
        contenu: recapLines.join('\n'),
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || 'Système',
        _isRecap: true
      };
    }
    // Créer un recap minimal si au moins un mandat existe
    if (data.mandats && data.mandats.length > 0) {
      return {
        contenu: 'Nouveau dossier ouvert - ' + data.numero_dossier + ' - ' + (data.arpenteur_geometre || 'N/A'),
        utilisateur_email: user?.email || '',
        utilisateur_nom: user?.full_name || 'Système',
        _isRecap: true
      };
    }
    return null;
  };

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
      // Vérifier si le dossier existe déjà (éviter doublon)
      const existingDossiers = await base44.entities.Dossier.filter({
        arpenteur_geometre: formData.arpenteur_geometre,
        numero_dossier: formData.numero_dossier
      });
      let newDossier;
      if (existingDossiers && existingDossiers.length > 0) {
        newDossier = existingDossiers[0];
      } else {
        newDossier = await base44.entities.Dossier.create(formData);
      }

      // Créer tous les commentaires (y compris le récapitulatif auto-généré)
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

      // Générer la fiche mandat PDF pour chaque mandat
      if (formData.mandats && formData.mandats.length > 0) {
        for (const mandat of formData.mandats) {
          try {
            await base44.functions.invoke('generateFicheMandat', {
              dossierData: formData,
              mandatType: mandat
            });
          } catch (error) {
            console.error('Erreur génération fiche mandat:', error);
          }
        }
      }

      // Supprimer la prise de mandat associée
      if (editingPriseMandat?.id) {
        await base44.entities.PriseMandat.delete(editingPriseMandat.id);
        queryClient.invalidateQueries({ queryKey: ['priseMandats'] });
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
    <>
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
            setIsClientFormDialogOpen={setIsClientFormOpen}
            setClientTypeForForm={setClientTypeForForm}
            setEditingClientForForm={setEditingClientForForm}
            setViewingClientDetails={() => {}}
            clientSelectionCardComponent={ClientSelectionCard}
            onClientCardClick={(client) => {
              setEditingClientForForm(client);
              setClientTypeForForm(client.type_client);
              setIsClientFormOpen(true);
            }}
            calculerProchainNumeroDossier={(arpenteur) => {
              const existingDossiers = clients.filter((d) => d?.arpenteur_geometre === arpenteur && d?.numero_dossier);
              const maxDossier = existingDossiers.reduce((max, d) => {
                const num = parseInt(d.numero_dossier, 10);
                return isNaN(num) ? max : Math.max(max, num);
              }, 0);
              return (maxDossier + 1).toString();
            }}
            editingDossier={null}
            hideSections={['terrain', 'minutes', 'entree-temps', 'retour-appel']}
            commentairesTemporaires={internalCommentaires}
            onCommentairesTemporairesChange={(newComments) => {
              setInternalCommentaires(prev => {
                const recap = prev.filter(c => c._isRecap);
                return [...recap, ...newComments];
              });
            }}
            onOpenNewLotDialog={(mandatIndex) => {
              setNewLotMandatIndex(mandatIndex);
              setNewLotForm({ numero_lot: "", circonscription_fonciere: "", cadastre: "Québec", rang: "" });
              setIsNewLotDialogOpen(true);
            }}
            setEditingClient={() => {}}
            setEditingLot={() => {}}
            setNewLotForm={() => {}}
            setLotActionLogs={() => {}}
          />
        </DialogContent>
      </Dialog>

      <ClientFormDialog 
        open={isClientFormOpen} 
        onOpenChange={(open) => {setIsClientFormOpen(open); if (!open) setEditingClientForForm(null);}} 
        editingClient={editingClientForForm} 
        defaultType={clientTypeForForm} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          setIsClientFormOpen(false);
        }} 
      />

      {/* Dialog création de lot */}
      <Dialog open={isNewLotDialogOpen} onOpenChange={setIsNewLotDialogOpen}>
        <DialogContent className="text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-300">Nouveau lot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Numéro de lot <span className="text-red-400">*</span></Label>
              <Input value={newLotForm.numero_lot} onChange={(e) => setNewLotForm({...newLotForm, numero_lot: e.target.value})} placeholder="Ex: 1234567" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Circonscription foncière <span className="text-red-400">*</span></Label>
              <Select value={newLotForm.circonscription_fonciere} onValueChange={(v) => setNewLotForm({...newLotForm, circonscription_fonciere: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="Lac-Saint-Jean-Est" className="text-white">Lac-Saint-Jean-Est</SelectItem>
                  <SelectItem value="Lac-Saint-Jean-Ouest" className="text-white">Lac-Saint-Jean-Ouest</SelectItem>
                  <SelectItem value="Chicoutimi" className="text-white">Chicoutimi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Cadastre</Label>
              <Input value={newLotForm.cadastre} onChange={(e) => setNewLotForm({...newLotForm, cadastre: e.target.value})} placeholder="Ex: Québec" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-400 text-xs">Rang</Label>
              <Input value={newLotForm.rang} onChange={(e) => setNewLotForm({...newLotForm, rang: e.target.value})} placeholder="Ex: Canton" className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-slate-600 text-slate-300" onClick={() => setIsNewLotDialogOpen(false)}>Annuler</Button>
              <Button
                type="button"
                disabled={isCreatingLot || !newLotForm.numero_lot || !newLotForm.circonscription_fonciere}
                onClick={async () => {
                  setIsCreatingLot(true);
                  const newLot = await base44.entities.Lot.create({
                    numero_lot: newLotForm.numero_lot,
                    circonscription_fonciere: newLotForm.circonscription_fonciere,
                    cadastre: newLotForm.cadastre || "Québec",
                    rang: newLotForm.rang || ""
                  });
                  queryClient.invalidateQueries({ queryKey: ['lots'] });
                  // Ajouter le lot au mandat
                  if (newLotMandatIndex !== null && formData) {
                    setFormData(prev => ({
                      ...prev,
                      mandats: prev.mandats.map((m, i) => i === newLotMandatIndex ? { ...m, lots: [...(m.lots || []), newLot.id] } : m)
                    }));
                  }
                  setIsCreatingLot(false);
                  setIsNewLotDialogOpen(false);
                }}
                className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-orange-500/30"
              >
                {isCreatingLot ? "Création..." : "Créer le lot"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}