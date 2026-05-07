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

    const initialData = {};

    // Cas 1: PriseMandat avec client_info (prenom, nom, telephone, courriel directs)
    if (viewingDossier.client_info) {
      const ci = viewingDossier.client_info;
      if (ci.prenom) initialData.prenom = ci.prenom;
      if (ci.nom) initialData.nom = ci.nom;
      if (ci.telephone) {
        initialData.telephone = ci.telephone;
        if (ci.type_telephone) initialData.type_telephone = ci.type_telephone;
      }
      if (ci.courriel) initialData.courriel = ci.courriel;
    }

    // Cas 2: Dossier avec clients_ids — récupérer depuis la liste des clients
    if (!initialData.prenom && !initialData.nom) {
      const primaryClientId = viewingDossier.clients_ids?.[0];
      const primaryClient = primaryClientId ? clients?.find(c => c.id === primaryClientId) : null;

      if (primaryClient) {
        if (primaryClient.prenom) initialData.prenom = primaryClient.prenom;
        if (primaryClient.nom) initialData.nom = primaryClient.nom;

        // Email courant (actuel ou actuelle)
        const currentEmail = primaryClient.courriels?.find(e => e.actuel || e.actuelle)?.courriel
          || primaryClient.courriels?.[0]?.courriel;
        if (currentEmail && !initialData.courriel) initialData.courriel = currentEmail;

        // Téléphone courant (actuel ou actuelle)
        const currentPhoneObj = primaryClient.telephones?.find(t => t.actuel || t.actuelle)
          || primaryClient.telephones?.[0];
        if (currentPhoneObj && !initialData.telephone) {
          initialData.telephone = currentPhoneObj.telephone;
          if (currentPhoneObj.type) initialData.type_telephone = currentPhoneObj.type;
        }

        // Adresse courante
        const currentAddress = primaryClient.adresses?.find(a => a.actuelle || a.actuel)
          || primaryClient.adresses?.[0];
        if (currentAddress) {
          initialData.adresse_travaux = {
            numeros_civiques: currentAddress.numeros_civiques || [""],
            rue: currentAddress.rue || "",
            ville: currentAddress.ville || "",
            province: currentAddress.province || "QC",
            code_postal: currentAddress.code_postal || ""
          };
        }
      }
    }

    // Adresse de travaux du dossier/priseMandat (si pas encore trouvée depuis le client)
    const workAddress = viewingDossier.mandats?.[0]?.adresse_travaux
      || viewingDossier.adresse_travaux;
    if (workAddress && !initialData.adresse_travaux) {
      initialData.adresse_travaux = {
        numeros_civiques: workAddress.numeros_civiques || [""],
        rue: workAddress.rue || "",
        ville: workAddress.ville || "",
        province: workAddress.province || "QC",
        code_postal: workAddress.code_postal || ""
      };
    }

    return Object.keys(initialData).length > 0 ? initialData : null;
  }, [viewingDossier, clients]);
}