import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
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
  newNumeroDossier
}) {
  // Appliquer directement le changement si "Mandats à ouvrir"
  useEffect(() => {
    if (open && pendingStatutChange === "Mandats à ouvrir") {
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