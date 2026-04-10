import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import TransferFilesDialog from "./TransferFilesDialog";

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG",
    "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP",
    "Benjamin Larouche": "BL",
    "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "";
};

export default function StatutChangeConfirmDialog({
  open,
  onOpenChange,
  pendingStatutChange,
  formData,
  clientInfo,
  professionnelInfo,
  workAddress,
  mandatsInfo,
  historique,
  setHistorique,
  user,
  editingPriseMandat,
  isLocked,
  onConfirm,
  updatePriseMandatMutation,
  newNumeroDossier,
}) {
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: priseMandats = [] } = useQuery({
    queryKey: ['priseMandats'],
    queryFn: () => base44.entities.PriseMandat.list(),
    initialData: [],
  });
  // Valider l'unicité du N° dossier pour "Mandats à ouvrir"
  const validateNumeroDossier = () => {
    if (pendingStatutChange !== "Mandats à ouvrir" || !formData.arpenteur_geometre || !newNumeroDossier) {
      return { valid: true };
    }

    // Vérifier dans les dossiers existants (Ouvert et Fermé)
    const existDansDossiers = dossiers.some(d => 
      d.arpenteur_geometre === formData.arpenteur_geometre && 
      d.numero_dossier === newNumeroDossier
    );

    // Vérifier dans les prises de mandat "Mandats à ouvrir"
    const existDansPriseMandats = priseMandats.some(p => 
      p.arpenteur_geometre === formData.arpenteur_geometre && 
      p.statut === "Mandats à ouvrir" && 
      p.numero_dossier === newNumeroDossier &&
      p.id !== editingPriseMandat?.id
    );

    if (existDansDossiers || existDansPriseMandats) {
      return {
        valid: false,
        message: `Le numéro de dossier ${newNumeroDossier} existe déjà pour ${formData.arpenteur_geometre}. Veuillez choisir un autre numéro.`
      };
    }

    return { valid: true };
  };

  // Appliquer directement le changement si "Mandats à ouvrir"
  useEffect(() => {
    if (open && pendingStatutChange === "Mandats à ouvrir") {
      const validation = validateNumeroDossier();
      if (!validation.valid) {
        alert(validation.message);
        onOpenChange(false);
        return;
      }
      onOpenChange(false);
      applyStatutChange("Mandats à ouvrir");
    }
  }, [open, pendingStatutChange]);

  const applyStatutChange = (value) => {
    const newFormData = value !== "Mandats à ouvrir"
      ? { ...formData, statut: value, numero_dossier: "", date_ouverture: "" }
      : { ...formData, statut: value, numero_dossier: newNumeroDossier };

    if (editingPriseMandat && !isLocked) {
      const mandatsToSave = mandatsInfo.filter(m => m.type_mandat).map(m => ({
        type_mandat: m.type_mandat,
        prix_estime: m.prix_estime || 0,
        prix_premier_lot: m.prix_premier_lot || 0,
        prix_autres_lots: m.prix_autres_lots || 0,
        rabais: m.rabais || 0,
        taxes_incluses: m.taxes_incluses || false
      }));
      const now = new Date().toISOString();
      const newHistoriqueEntry = {
        action: "Changement de statut",
        details: `${editingPriseMandat.statut} → ${value}`,
        utilisateur_nom: user?.full_name || "Utilisateur",
        utilisateur_email: user?.email || "",
        date: now
      };
      const updatedHistorique = [newHistoriqueEntry, ...(historique || [])];
      if (setHistorique) setHistorique(updatedHistorique);
      updatePriseMandatMutation.mutateAsync({
        id: editingPriseMandat.id,
        data: {
          arpenteur_geometre: newFormData.arpenteur_geometre,
          place_affaire: newFormData.placeAffaire,
          numero_dossier: value === "Mandats à ouvrir" ? (newNumeroDossier || newFormData.numero_dossier) : newFormData.numero_dossier,
          date_ouverture: newFormData.date_ouverture,
          clients_ids: newFormData.clients_ids,
          notaires_ids: newFormData.notaires_ids || [],
          courtiers_ids: newFormData.courtiers_ids || [],
          compagnies_ids: newFormData.compagnies_ids || [],
          client_info: clientInfo,
          professionnel_info: professionnelInfo,
          adresse_travaux: workAddress,
          mandats: mandatsToSave,
          echeance_souhaitee: mandatsInfo[0]?.echeance_souhaitee || "",
          date_signature: mandatsInfo[0]?.date_signature || "",
          date_debut_travaux: mandatsInfo[0]?.date_debut_travaux || "",
          date_livraison: mandatsInfo[0]?.date_livraison || "",
          urgence_percue: mandatsInfo[0]?.urgence_percue || "",
          statut: value,
          historique: updatedHistorique,
          locked_by: user?.email,
          locked_at: editingPriseMandat.locked_at
        },
        autoSave: true
      });
    }

    onConfirm(newFormData);
  };

  // Ne rien afficher - le changement s'applique directement
  return null;
}