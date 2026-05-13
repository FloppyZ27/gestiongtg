import React, { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import EditDossierForm from "../dossiers/EditDossierForm";
import ClientFormDialog from "../clients/ClientFormDialog";
import ClientSelectionCard from "./ClientSelectionCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewLotDialog from "../lots/NewLotDialog";


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
  priseMandatToDelete,
  clientInfo,
  workAddress
}) {
  const [formData, setFormData] = React.useState(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [internalCommentaires, setInternalCommentaires] = React.useState([]);
  const [isClientFormOpen, setIsClientFormOpen] = React.useState(false);
  const [clientTypeForForm, setClientTypeForForm] = React.useState(null);
  const [editingClientForForm, setEditingClientForForm] = React.useState(null);
  const [clientFormKey, setClientFormKey] = React.useState(0);
  const [isNewLotDialogOpen, setIsNewLotDialogOpen] = React.useState(false);
  const [newLotMandatIndex, setNewLotMandatIndex] = React.useState(null);
  const [editingLotForDialog, setEditingLotForDialog] = React.useState(null);
  const [clientInitialDataForForm, setClientInitialDataForForm] = React.useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });



  // Sync formData when dossierForm changes or dialog opens
  React.useEffect(() => {
    if (dossierForm && open && currentUser) {
      // Enrichir dossierForm avec les infos de la prise de mandat pour le récapitulatif
      const enrichedForm = {
        ...dossierForm,
        _priseMandat: editingPriseMandat || null,
        // _clientInfo et _professionnelInfo sont déjà dans dossierForm s'ils ont été passés
        _clientInfo: dossierForm._clientInfo || editingPriseMandat?.client_info || null,
        _professionnelInfo: dossierForm._professionnelInfo || editingPriseMandat?.professionnel_info || null
      };
      setFormData(enrichedForm);
      // Créer automatiquement le commentaire récapitulatif en passant les données directement
      createAutoRecapFromData(enrichedForm, commentaires || []);
    }
  }, [dossierForm, open, currentUser, editingPriseMandat]);

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
    
    const recapLines = [
      '<b>📋 RÉCAPITULATIF DE LA PRISE DE MANDAT</b>',
      ''
    ];

    // Clients
    const clientNames = (data.clients_ids || []).map(id => {
      const c = (clients || []).find(cl => cl.id === id);
      return c ? `${c.prenom || ''} ${c.nom || ''}`.trim() : null;
    }).filter(Boolean);
    if (clientNames.length > 0) recapLines.push(`👤 Client(s): ${clientNames.join(', ')}`);

    // Informations du client saisies manuellement (depuis data._clientInfo ou _priseMandat)
    const clientInfo = data._clientInfo || data._priseMandat?.client_info;
    if (clientInfo) {
     const fullName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
     if (fullName) recapLines.push(`👤 Client: ${fullName}`);
     if (clientInfo.telephone) recapLines.push(`📞 Téléphone: ${clientInfo.telephone}${clientInfo.type_telephone ? ` (${clientInfo.type_telephone})` : ''}`);
     if (clientInfo.courriel) recapLines.push(`✉️ Courriel: ${clientInfo.courriel}`);
    }

    // Professionnels (depuis data._professionnelInfo ou _priseMandat)
    const professionnelInfo = data._professionnelInfo || data._priseMandat?.professionnel_info;
    if (professionnelInfo) {
     if (professionnelInfo.notaire) recapLines.push(`⚖️ Notaire: ${professionnelInfo.notaire}`);
     if (professionnelInfo.courtier) recapLines.push(`🏡 Courtier immobilier: ${professionnelInfo.courtier}`);
     if (professionnelInfo.compagnie) recapLines.push(`🏗️ Compagnie: ${professionnelInfo.compagnie}`);
    } else {
      // Afficher notaires et courtiers via IDs seulement si pas d'infos manuelles
      const notaireNames = (data.notaires_ids || []).map(id => {
        const n = (clients || []).find(cl => cl.id === id);
        return n ? `${n.prenom || ''} ${n.nom || ''}`.trim() : null;
      }).filter(Boolean);
      if (notaireNames.length > 0) recapLines.push(`⚖️ Notaire(s): ${notaireNames.join(', ')}`);

      const courtierNames = (data.courtiers_ids || []).map(id => {
        const c = (clients || []).find(cl => cl.id === id);
        return c ? `${c.prenom || ''} ${c.nom || ''}`.trim() : null;
      }).filter(Boolean);
      if (courtierNames.length > 0) recapLines.push(`🏡 Courtier(s): ${courtierNames.join(', ')}`);
    }

    recapLines.push('');
    recapLines.push(`<b>📋 MANDATS (${(data.mandats || []).length})</b>`);
    recapLines.push('');

    (data.mandats || []).forEach((m, i) => {
      recapLines.push(`• Mandat ${i + 1}: ${m.type_mandat || 'N/A'}`);
      
      // Adresse des travaux
      if (m.adresse_travaux?.rue || m.adresse_travaux?.ville) {
        const parts = [m.adresse_travaux?.numeros_civiques?.[0], m.adresse_travaux?.rue, m.adresse_travaux?.ville].filter(Boolean);
        recapLines.push(`  📍 Adresse: ${parts.join(', ')}`);
      }
      
      // Lots
      if (m.lots?.length > 0) {
        const lotNumbers = m.lots.map(lotId => {
          const lot = (lots || []).find(l => l.id === lotId);
          return lot ? `${lot.numero_lot}` : lotId;
        }).join(', ');
        recapLines.push(`  🗂️ Lots: ${lotNumbers}`);
      }
      
      // Dates
      if (m.date_signature) recapLines.push(`  📅 Signature: ${m.date_signature}`);
      if (m.date_debut_travaux) recapLines.push(`  📅 Début travaux: ${m.date_debut_travaux}`);
      if (m.date_livraison) recapLines.push(`  📅 Livraison: ${m.date_livraison}`);
      
      // Tarification
      if (m.prix_estime || m.prix_premier_lot || m.prix_autres_lots) {
        const total = (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0);
        recapLines.push(`  💰 Prix estimé: ${total.toFixed(2)} $${m.taxes_incluses ? ' (taxes incluses)' : ''}`);
        if (m.rabais) recapLines.push(`  💸 Rabais: ${m.rabais} $`);
      }
      
      // Notes
      if (m.notes) recapLines.push(`  📝 Notes: ${m.notes}`);
    });

    if (recapLines.length > 2) {
      return {
        contenu: recapLines.join('\n'),
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

  const [showMissingUserError, setShowMissingUserError] = React.useState(false);

  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!currentUser) {
      console.error('currentUser is undefined!');
      return;
    }

    // Validation: tous les mandats doivent avoir un utilisateur assigné
    const mandatsSansUtilisateur = (formData.mandats || []).filter(m => !m.utilisateur_assigne);
    if (mandatsSansUtilisateur.length > 0) {
      setShowMissingUserError(true);
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

      // Notifier chaque utilisateur assigné à un mandat + créer entrée terrain
      const notifiedUsers = new Set();
      for (const mandat of (formData.mandats || [])) {
        if (mandat.utilisateur_assigne && mandat.type_mandat) {
          // Notification par mandat (une seule par utilisateur)
          if (!notifiedUsers.has(mandat.utilisateur_assigne)) {
            await base44.entities.Notification.create({
              utilisateur_email: mandat.utilisateur_assigne,
              titre: "Nouveau dossier ouvert et assigné",
              message: `Le dossier ${formData.numero_dossier || ''} vient d'être ouvert et vous a été assigné (${mandat.type_mandat}).`,
              type: "dossier",
              dossier_id: newDossier.id,
              lue: false
            });
            notifiedUsers.add(mandat.utilisateur_assigne);
          }

          // Créer une entrée terrain pour ce mandat
          await base44.entities.EntreeTemps.create({
            date: formData.date_ouverture || new Date().toISOString().split('T')[0],
            heures: 0.01,
            dossier_id: newDossier.id,
            mandat: mandat.type_mandat,
            tache: "Ouverture",
            description: `Ouverture du dossier - ${mandat.type_mandat}`,
            utilisateur_email: mandat.utilisateur_assigne
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
      const pmToDelete = editingPriseMandat || priseMandatToDelete;
      if (pmToDelete?.id) {
        await base44.entities.PriseMandat.delete(pmToDelete.id);
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

  // Construire les données préremplies selon le type de client et la source de la prise de mandat
  const buildClientInitialData = (clientType) => {
    const ci = editingPriseMandat?.client_info || dossierForm?._clientInfo;
    const pi = editingPriseMandat?.professionnel_info || dossierForm?._professionnelInfo;

    if (clientType === "Client") {
      if (!ci) return null;
      const data = {};
      if (ci.prenom) data.prenom = ci.prenom;
      if (ci.nom) data.nom = ci.nom;
      if (ci.telephone) { data.telephone = ci.telephone; if (ci.type_telephone) data.type_telephone = ci.type_telephone; }
      if (ci.courriel) data.courriel = ci.courriel;
      return Object.keys(data).length > 0 ? data : null;
    }

    if (clientType === "Notaire") {
      const notaire = pi?.notaire || "";
      if (!notaire) return null;
      // Séparer prénom/nom : on met tout dans prenom pour simplifier
      const parts = notaire.trim().split(" ");
      return { prenom: parts[0] || "", nom: parts.slice(1).join(" ") || "" };
    }

    if (clientType === "Courtier immobilier") {
      const courtier = pi?.courtier || "";
      if (!courtier) return null;
      const parts = courtier.trim().split(" ");
      return { prenom: parts[0] || "", nom: parts.slice(1).join(" ") || "" };
    }

    if (clientType === "Compagnie") {
      const compagnie = pi?.compagnie || "";
      if (!compagnie) return null;
      return { nom: compagnie };
    }

    return null;
  };

  if (!formData) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o && (isNewLotDialogOpen || isClientFormOpen)) return; onOpenChange(o); }}>
        <DialogContent
          className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50"
          style={{ marginTop: '19px', maxHeight: 'calc(85vh - 5px)' }}
          onInteractOutside={(e) => { if (isNewLotDialogOpen || isClientFormOpen) e.preventDefault(); }}
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
              setClientInitialDataForForm(null);
              setClientFormKey(k => k + 1);
              setIsClientFormOpen(true);
            }}
            onNewClientClick={(clientType) => {
              const type = clientType || "Client";
              setEditingClientForForm(null);
              setClientTypeForForm(type);
              setClientInitialDataForForm(buildClientInitialData(type));
              setClientFormKey(k => k + 1);
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
              setIsNewLotDialogOpen(true);
            }}
            setEditingLot={setEditingLotForDialog}
            setEditingClient={() => {}}
            setNewLotForm={() => {}}
            setLotActionLogs={() => {}}
          />
        </DialogContent>
      </Dialog>

      <ClientFormDialog 
        key={clientFormKey}
        open={isClientFormOpen} 
        onOpenChange={(open) => {setIsClientFormOpen(open); if (!open) setEditingClientForForm(null);}} 
        editingClient={editingClientForForm} 
        defaultType={clientTypeForForm} 
        initialData={editingClientForForm ? null : clientInitialDataForForm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          setIsClientFormOpen(false);
        }} 
      />

      {/* Dialog utilisateur manquant */}
      <Dialog open={showMissingUserError} onOpenChange={setShowMissingUserError}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{background:'none'}}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>Attention<span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300 text-center">Tous les mandats doivent avoir un utilisateur assigné avant d'ouvrir le dossier.</p>
            <div className="flex justify-center gap-3 pt-4">
              <Button type="button" onClick={() => setShowMissingUserError(false)} className="bg-gradient-to-r from-emerald-500 to-teal-600 border-none">Compris</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NewLotDialog
        open={isNewLotDialogOpen}
        onOpenChange={(o) => { setIsNewLotDialogOpen(o); if (!o) setEditingLotForDialog(null); }}
        mandatIndex={newLotMandatIndex}
        editingLot={editingLotForDialog}
        onLotCreated={(newLot, mandatIndex) => {
          if (mandatIndex !== null && formData) {
            setFormData(prev => ({
              ...prev,
              mandats: prev.mandats.map((m, i) => {
                if (i !== mandatIndex) return m;
                const currentLots = m.lots || [];
                // Ne pas ajouter si le lot est déjà présent (cas modification)
                if (currentLots.includes(newLot.id)) return m;
                return { ...m, lots: [...currentLots, newLot.id] };
              })
            }));
          }
        }}
      />
    </>
  );
}