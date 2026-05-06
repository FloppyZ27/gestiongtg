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
      if (currentPhone) {
        initialData.telephone = currentPhone;
        // Récupérer le type du téléphone actuel
        const currentPhoneType = primaryClient.telephones?.find(t => t.actuel)?.type;
        if (currentPhoneType) initialData.type_telephone = currentPhoneType;
      }

      // Adresse courante
      const currentAddress = primaryClient.adresses?.find(a => a.actuelle || a.actuel);
      if (currentAddress) {
        // Stocker la structure complète pour adresse_travaux
        initialData.adresse_travaux = {
          numeros_civiques: currentAddress.numeros_civiques || [""],
          rue: currentAddress.rue || "",
          ville: currentAddress.ville || "",
          province: currentAddress.province || "QC",
          code_postal: currentAddress.code_postal || ""
        };
      }
    }

    // Ajouter les infos d'adresse de travaux du dossier si disponibles (priorité à l'adresse client si existante)
    if (workAddress && !initialData.adresse_travaux) {
      initialData.adresse_travaux = {
        numeros_civiques: workAddress.numeros_civiques || [""],
        rue: workAddress.rue || "",
        ville: workAddress.ville || "",
        province: workAddress.province || "QC",
        code_postal: workAddress.code_postal || ""
      };
    }

    // Retourner null si aucune donnée n'a été trouvée
    return Object.keys(initialData).length > 0 ? initialData : null;
  }, [viewingDossier, clients]);
}