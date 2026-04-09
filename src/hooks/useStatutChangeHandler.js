export const createStatutChangeHandler = (formData, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData) => {
  return (value) => {
    if (isLocked) return;
    setFormData({ ...formData, statut: value });
  };
};
}
};