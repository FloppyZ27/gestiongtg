import { useMemo } from 'react';

/**
 * Hook pour générer les données de préremplissage du formulaire client
 * à partir d'un dossier actuellement ouvert.
 * 
 * @param {Object} viewingDossier - Le dossier actuellement affiché (null si aucun)
 * @param {Array} clients - Liste de tous les clients pour récupérer les détails
 * @returns {Object} Objet contenant les données préremplies du client
 */
export function useClientFormInitialData(viewingDossier, clients) {
  return useMemo(() => {
    if (!viewingDossier) return null;

    // Récupérer les infos du premier client du dossier si disponible
    const primaryClientId = viewingDossier.clients_ids?.[0];
    const primaryClient = primaryClientId ? clients?.find(c => c.id === primaryClientId) : null;

    // Récupérer l'adresse de travaux du dossier
    const workAddress = viewingDossier.mandats?.[0]?.adresse_travaux;

    // Construire l'objet de préremplissage
    const initialData = {};

    // Préremplir à partir du client principal
    if (primaryClient) {
      if (primaryClient.prenom) initialData.prenom = primaryClient.prenom;
      if (primaryClient.nom) initialData.nom = primaryClient.nom;

      // Email courant
      const currentEmail = primaryClient.courriels?.find(e => e.actuel)?.courriel;
      if (currentEmail) initialData.courriel = currentEmail;

      // Téléphone courant
      const currentPhone = primaryClient.telephones?.find(t => t.actuel)?.telephone;
      if (currentPhone) initialData.telephone = currentPhone;

      // Adresse courante
      const currentAddress = primaryClient.adresses?.find(a => a.actuelle || a.actuel);
      if (currentAddress) {
        if (currentAddress.numeros_civiques?.[0]) initialData.numero_civique = currentAddress.numeros_civiques[0];
        if (currentAddress.rue) initialData.rue = currentAddress.rue;
        if (currentAddress.ville) initialData.ville = currentAddress.ville;
        if (currentAddress.province) initialData.province = currentAddress.province;
        if (currentAddress.code_postal) initialData.code_postal = currentAddress.code_postal;
      }
    }

    // Ajouter les infos d'adresse de travaux du dossier si disponibles
    if (workAddress) {
      if (workAddress.numeros_civiques?.[0] && !initialData.numero_civique) {
        initialData.numero_civique = workAddress.numeros_civiques[0];
      }
      if (workAddress.rue && !initialData.rue) initialData.rue = workAddress.rue;
      if (workAddress.ville && !initialData.ville) initialData.ville = workAddress.ville;
      if (workAddress.province && !initialData.province) initialData.province = workAddress.province;
      if (workAddress.code_postal && !initialData.code_postal) initialData.code_postal = workAddress.code_postal;
    }

    // Retourner null si aucune donnée n'a été trouvée
    return Object.keys(initialData).length > 0 ? initialData : null;
  }, [viewingDossier, clients]);
}