import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const generateDossierSummary = (priseMandat, user, getClientsNames, formatAdresse) => {
  const mandatSummary = [];
  
  // Informations du client
  const clientName = priseMandat.client_info?.prenom || priseMandat.client_info?.nom 
    ? `${priseMandat.client_info.prenom || ''} ${priseMandat.client_info.nom || ''}`.trim()
    : getClientsNames(priseMandat.clients_ids);
  if (clientName && clientName !== '-') {
    mandatSummary.push(`**Client:** ${clientName}`);
  }
  
  // Téléphone
  if (priseMandat.client_info?.telephone) {
    mandatSummary.push(`**Téléphone:** ${priseMandat.client_info.telephone} (${priseMandat.client_info.type_telephone || 'Non spécifié'})`);
  }
  
  // Courriel
  if (priseMandat.client_info?.courriel) {
    mandatSummary.push(`**Courriel:** ${priseMandat.client_info.courriel}`);
  }
  
  // Professionnels
  if (priseMandat.professionnel_info?.notaire) {
    mandatSummary.push(`**Notaire:** ${priseMandat.professionnel_info.notaire}`);
  }
  if (priseMandat.professionnel_info?.courtier) {
    mandatSummary.push(`**Courtier immobilier:** ${priseMandat.professionnel_info.courtier}`);
  }
  if (priseMandat.professionnel_info?.compagnie) {
    mandatSummary.push(`**Compagnie:** ${priseMandat.professionnel_info.compagnie}`);
  }
  
  // Adresse des travaux
  const adresse = formatAdresse(priseMandat.adresse_travaux);
  if (adresse && adresse !== '-') {
    mandatSummary.push(`**Adresse des travaux:** ${adresse}`);
  }
  
  // Mandats
  if (priseMandat.mandats && priseMandat.mandats.length > 0) {
    const mandatsTypes = priseMandat.mandats.map(m => m.type_mandat).filter(Boolean).join(', ');
    if (mandatsTypes) {
      mandatSummary.push(`**Types de mandats:** ${mandatsTypes}`);
    }
  }
  
  // Tarification
  const totalPrix = (priseMandat.mandats || []).reduce((sum, m) => sum + (m.prix_estime || 0) + (m.prix_premier_lot || 0) + (m.prix_autres_lots || 0), 0);
  if (totalPrix > 0) {
    mandatSummary.push(`**Prix estimé:** ${totalPrix.toFixed(2)} $`);
  }
  
  const totalRabais = (priseMandat.mandats || []).reduce((sum, m) => sum + (m.rabais || 0), 0);
  if (totalRabais > 0) {
    mandatSummary.push(`**Rabais:** ${totalRabais.toFixed(2)} $`);
  }
  
  // Dates importantes
  if (priseMandat.date_signature) {
    mandatSummary.push(`**Date de signature:** ${format(new Date(priseMandat.date_signature), "dd MMM yyyy", { locale: fr })}`);
  }
  if (priseMandat.date_debut_travaux) {
    mandatSummary.push(`**Début des travaux:** ${format(new Date(priseMandat.date_debut_travaux), "dd MMM yyyy", { locale: fr })}`);
  }
  if (priseMandat.date_livraison) {
    mandatSummary.push(`**Livraison:** ${format(new Date(priseMandat.date_livraison), "dd MMM yyyy", { locale: fr })}`);
  }
  
  // Créer le commentaire récapitulatif
  return {
    id: `summary-${Date.now()}`,
    contenu: mandatSummary.join('\n'),
    utilisateur_email: user?.email || "",
    utilisateur_nom: user?.full_name || "Système",
    created_date: new Date().toISOString()
  };
};