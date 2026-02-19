import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditDossierForm from "@/components/dossiers/EditDossierForm";

const getArpenteurInitials = (arpenteur) => {
  const mapping = {
    "Samuel Guay": "SG-",
    "Dany Gaboury": "DG-",
    "Pierre-Luc Pilote": "PLP-",
    "Benjamin Larouche": "BL-",
    "Frédéric Gilbert": "FG-"
  };
  return mapping[arpenteur] || "";
};

export default function GlobalDossierEditDialog() {
  const [open, setOpen] = useState(false);
  const [editingDossier, setEditingDossier] = useState(null);
  const [formData, setFormData] = useState(null);
  const queryClient = useQueryClient();

  const { data: dossiers = [] } = useQuery({ queryKey: ['dossiers'], queryFn: () => base44.entities.Dossier.list('-created_date'), initialData: [] });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list(), initialData: [] });
  const { data: lots = [] } = useQuery({ queryKey: ['lots'], queryFn: () => base44.entities.Lot.list(), initialData: [] });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), initialData: [] });

  useEffect(() => {
    const handler = (e) => {
      const { dossierId } = e.detail;
      const dossier = dossiers.find(d => d.id === dossierId);
      if (dossier) openDossier(dossier);
    };
    window.addEventListener('openDossierEdit', handler);
    return () => window.removeEventListener('openDossierEdit', handler);
  }, [dossiers]);

  const openDossier = (dossier) => {
    setEditingDossier(dossier);
    setFormData({
      numero_dossier: dossier.numero_dossier || "",
      arpenteur_geometre: dossier.arpenteur_geometre || "",
      date_ouverture: dossier.date_ouverture || new Date().toISOString().split('T')[0],
      date_fermeture: dossier.date_fermeture || "",
      statut: dossier.statut || "Ouvert",
      ttl: dossier.ttl || "Non",
      place_affaire: dossier.place_affaire || "",
      clients_ids: dossier.clients_ids || [],
      clients_texte: dossier.clients_texte || "",
      notaires_ids: dossier.notaires_ids || [],
      notaires_texte: dossier.notaires_texte || "",
      courtiers_ids: dossier.courtiers_ids || [],
      courtiers_texte: dossier.courtiers_texte || "",
      mandats: (dossier.mandats || []).map(m => ({
        ...m,
        date_ouverture: m.date_ouverture || "",
        minute: m.minute || "",
        date_minute: m.date_minute || "",
        type_minute: m.type_minute || "Initiale",
        minutes_list: m.minutes_list || [],
        tache_actuelle: m.tache_actuelle || "",
        utilisateur_assigne: m.utilisateur_assigne || "",
        statut_terrain: m.statut_terrain || "",
        adresse_travaux: m.adresse_travaux
          ? (typeof m.adresse_travaux === 'string' ? { rue: m.adresse_travaux, numeros_civiques: [], ville: "", code_postal: "", province: "" } : m.adresse_travaux)
          : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "" },
        lots: m.lots || [],
        lots_texte: m.lots_texte || "",
        prix_estime: m.prix_estime ?? 0,
        rabais: m.rabais ?? 0,
        taxes_incluses: m.taxes_incluses ?? false,
        date_livraison: m.date_livraison || "",
        date_signature: m.date_signature || "",
        date_debut_travaux: m.date_debut_travaux || "",
        terrain: m.terrain || { date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" },
        factures: m.factures || [],
        notes: m.notes || ""
      })),
      description: dossier.description || ""
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingDossier(null);
    setFormData(null);
    queryClient.invalidateQueries({ queryKey: ['dossiers'] });
  };

  if (!open || !formData) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="backdrop-blur-[0.5px] border-2 border-white/30 text-white max-w-[75vw] w-[75vw] p-0 gap-0 overflow-hidden shadow-2xl shadow-black/50"
        style={{ marginTop: '19px', maxHeight: 'calc(90vh - 5px)' }}
        hideClose
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Modifier le dossier</DialogTitle>
        </DialogHeader>
        <EditDossierForm
          formData={formData}
          setFormData={setFormData}
          clients={clients}
          lots={lots}
          users={users}
          onSubmit={(e) => { e.preventDefault(); }}
          onCancel={handleClose}
          updateMandat={(index, field, value) => {
            setFormData(prev => ({
              ...prev,
              mandats: prev.mandats.map((m, i) => i === index ? { ...m, [field]: value } : m)
            }));
          }}
          addMandat={() => {
            setFormData(prev => ({
              ...prev,
              mandats: [...prev.mandats, {
                type_mandat: "", date_ouverture: "", minute: "", date_minute: "", type_minute: "Initiale",
                minutes_list: [], tache_actuelle: "Ouverture", statut_terrain: "",
                adresse_travaux: prev.mandats[0]?.adresse_travaux ? JSON.parse(JSON.stringify(prev.mandats[0].adresse_travaux)) : { ville: "", numeros_civiques: [""], rue: "", code_postal: "", province: "QC" },
                lots: prev.mandats[0]?.lots ? [...prev.mandats[0].lots] : [],
                lots_texte: "", prix_estime: 0, rabais: 0, taxes_incluses: false,
                date_livraison: "", date_signature: "", date_debut_travaux: "",
                terrain: { date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" },
                factures: [], notes: ""
              }]
            }));
          }}
          removeMandat={(index) => {
            if (confirm("Êtes-vous sûr de vouloir supprimer ce mandat ?")) {
              setFormData(prev => ({ ...prev, mandats: prev.mandats.filter((_, i) => i !== index) }));
            }
          }}
          openLotSelector={() => {}}
          removeLotFromMandat={(mandatIndex, lotId) => {
            setFormData(prev => ({
              ...prev,
              mandats: prev.mandats.map((m, i) => i === mandatIndex ? { ...m, lots: m.lots.filter(id => id !== lotId) } : m)
            }));
          }}
          openAddMinuteDialog={() => {}}
          removeMinuteFromMandat={(mandatIndex, minuteIndex) => {
            setFormData(prev => ({
              ...prev,
              mandats: prev.mandats.map((m, i) => i === mandatIndex ? { ...m, minutes_list: m.minutes_list.filter((_, j) => j !== minuteIndex) } : m)
            }));
          }}
          getLotById={(id) => lots.find(l => l.id === id)}
          setIsClientFormDialogOpen={() => {}}
          setClientTypeForForm={() => {}}
          setViewingClientDetails={() => {}}
          calculerProchainNumeroDossier={() => ""}
          editingDossier={editingDossier}
          onOpenNewLotDialog={() => {}}
          setEditingClient={() => {}}
          setEditingLot={() => {}}
          setNewLotForm={() => {}}
          setLotActionLogs={() => {}}
          allDossiers={dossiers}
        />
      </DialogContent>
    </Dialog>
  );
}