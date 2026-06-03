import React from "react";

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

const getArpenteurColor = (arpenteur) => {
  const colors = {
    "Samuel Guay": "text-red-400",
    "Pierre-Luc Pilote": "text-slate-400",
    "Frédéric Gilbert": "text-orange-400",
    "Dany Gaboury": "text-yellow-400",
    "Benjamin Larouche": "text-cyan-400"
  };
  return colors[arpenteur] || "text-emerald-400";
};

export default function MandatDialogTitle({ formData, clientInfo, getClientById }) {
  if (!formData.statut === "Mandats à ouvrir" || !formData.arpenteur_geometre || !formData.numero_dossier) return null;

  const repKey = clientInfo.representant_key;
  const allClientNames = [];

  // Client 1 (primary) — exclure si c'est le représentant
  if (repKey !== "primary") {
    const primaryName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
    if (primaryName) allClientNames.push(primaryName);
  }

  // Clients via IDs — exclure si leur id est representant_key
  (formData.clients_ids || []).forEach((id) => {
    if (repKey !== id) {
      const c = getClientById(id);
      if (c) {
        const name = `${c.prenom} ${c.nom}`.trim();
        if (name && !allClientNames.includes(name)) allClientNames.push(name);
      }
    }
  });

  // Extra clients — exclure si extra_{index} est representant_key
  (clientInfo.extra_clients || []).forEach((ec, i) => {
    if (repKey !== `extra_${i}`) {
      const name = `${ec.prenom || ''} ${ec.nom || ''}`.trim();
      if (name && !allClientNames.includes(name)) allClientNames.push(name);
    }
  });

  return (
    <div className={`text-lg font-semibold ${getArpenteurColor(formData.arpenteur_geometre)}`}>
      {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
      {allClientNames.length > 0 && <span> - {allClientNames.join(', ')}</span>}
    </div>
  );
}