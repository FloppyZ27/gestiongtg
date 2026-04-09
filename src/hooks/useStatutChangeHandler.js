export const createStatutChangeHandler = (formData, mandatsInfo, workAddress, commentairesTemporaires, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData, setNouveauDossierForm, setCommentairesTemporairesDossier, setIsOuvrirDossierDialogOpen) => {
  return async (value) => {
    if (isLocked) return;
    if (value === "Mandats à ouvrir" && formData.arpenteur_geometre) {
      const prochainNumero = calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id);
      setFormData({...formData, statut: value, numero_dossier: prochainNumero, date_ouverture: new Date().toISOString().split('T')[0]});
      setTimeout(() => {
        setNouveauDossierForm({
          numero_dossier: prochainNumero,
          arpenteur_geometre: formData.arpenteur_geometre,
          place_affaire: formData.placeAffaire,
          date_ouverture: new Date().toISOString().split('T')[0],
          statut: "Ouvert",
          ttl: "Non",
          clients_ids: formData.clients_ids,
          notaires_ids: formData.notaires_ids || [],
          courtiers_ids: formData.courtiers_ids || [],
          compagnies_ids: formData.compagnies_ids || [],
          mandats: mandatsInfo.filter(m => m.type_mandat).map(m => ({
            type_mandat: m.type_mandat,
            adresse_travaux: workAddress,
            prix_estime: m.prix_estime || 0,
            rabais: m.rabais || 0,
            taxes_incluses: m.taxes_incluses || false,
            date_signature: m.date_signature || "",
            date_debut_travaux: m.date_debut_travaux || "",
            date_livraison: m.date_livraison || "",
            lots: [], tache_actuelle: "Ouverture", utilisateur_assigne: "",
            minute: "", date_minute: "", type_minute: "Initiale", minutes_list: [],
            terrain: { date_limite_leve: "", instruments_requis: "", a_rendez_vous: false, date_rendez_vous: "", heure_rendez_vous: "", donneur: "", technicien: "", dossier_simultane: "", temps_prevu: "", notes: "" },
            factures: [], notes: ""
          }))
        });
        setCommentairesTemporairesDossier(commentairesTemporaires);
        setIsOuvrirDossierDialogOpen(true);
      }, 0);
    } else if (value !== "Mandats à ouvrir") {
      setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
    } else {
      setFormData({...formData, statut: value});
    }
  };
};