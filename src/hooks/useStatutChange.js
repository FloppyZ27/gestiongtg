export const useStatutChange = (
  formData,
  setFormData,
  setShowStatutChangeConfirm,
  setPendingStatutChange,
  calculerProchainNumeroDossier,
  editingPriseMandat,
  isLocked
) => {
  return (value) => {
    if (isLocked) return;
    if (value === "Mandats à ouvrir" && formData.arpenteur_geometre) {
      setPendingStatutChange(value);
      setShowStatutChangeConfirm(true);
      return;
    }
    if (formData.numero_dossier && value !== formData.statut) {
      setPendingStatutChange(value);
      setShowStatutChangeConfirm(true);
      return;
    }
    if (value !== "Mandats à ouvrir") {
      setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
    } else {
      setFormData({...formData, statut: value});
    }
  };
};