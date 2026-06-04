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

  // Construire la liste de tous les clients avec indication du représentant
  const allClients = [];

  const primaryName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim();
  if (primaryName) allClients.push({ name: primaryName, isRep: repKey === "primary" });

  (formData.clients_ids || []).forEach((id) => {
    const c = getClientById(id);
    if (c) {
      const name = `${c.prenom} ${c.nom}`.trim();
      if (name && !allClients.find(x => x.name === name)) {
        allClients.push({ name, isRep: repKey === id });
      }
    }
  });

  (clientInfo.extra_clients || []).forEach((ec, i) => {
    const name = `${ec.prenom || ''} ${ec.nom || ''}`.trim();
    if (name && !allClients.find(x => x.name === name)) {
      allClients.push({ name, isRep: repKey === `extra_${i}` });
    }
  });

  return (
    <div className={`text-lg font-semibold flex items-center gap-2 flex-wrap ${getArpenteurColor(formData.arpenteur_geometre)}`}>
      {getArpenteurInitials(formData.arpenteur_geometre)}{formData.numero_dossier}
      {allClients.length > 0 && (() => {
        const nonRep = allClients.filter(c => !c.isRep);
        const rep = allClients.find(c => c.isRep);
        const sorted = rep ? [...nonRep, rep] : nonRep;
        return (
          <span>- {nonRep.map((c, i) => (
            <span key={i}>{i > 0 && ', '}{c.name}</span>
          ))}{rep && <span>{nonRep.length > 0 && ' '}({rep.name})</span>}</span>
        );
      })()}
    </div>
  );
}