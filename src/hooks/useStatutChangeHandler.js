export const createStatutChangeHandler = (formData, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData, setTransferFilesConfig, setIsTransferFilesDialogOpen) => {
  return async (value) => {
    if (isLocked) return;
    if (value === "Mandats à ouvrir" && formData.arpenteur_geometre) {
      const prochainNumero = calculerProchainNumeroDossier(formData.arpenteur_geometre, editingPriseMandat?.id);
      const initials = {"Samuel Guay": "SG", "Dany Gaboury": "DG", "Pierre-Luc Pilote": "PLP", "Benjamin Larouche": "BL", "Frédéric Gilbert": "FG"}[formData.arpenteur_geometre] || "";
      const clientName = `${formData.client_info?.prenom || ''} ${formData.client_info?.nom || ''}`.trim() || 'Client';
      const today = new Date().toISOString().split('T')[0];
      
      const sourcePath = `ARPENTEUR/${initials}/DOSSIER/TEMPORAIRE/${initials}-${clientName}-${today}/INTRANTS`;
      const destPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${prochainNumero}/INTRANTS`;
      
      setFormData({...formData, statut: value, numero_dossier: prochainNumero, date_ouverture: new Date().toISOString().split('T')[0]});
      setTimeout(() => {
        setTransferFilesConfig({
          sourcePath,
          destPath,
          arpenteur: formData.arpenteur_geometre,
          numeroDossier: prochainNumero
        });
        setIsTransferFilesDialogOpen(true);
      }, 0);
    } else if (value !== "Mandats à ouvrir") {
      setFormData({...formData, statut: value, numero_dossier: "", date_ouverture: ""});
    } else {
      setFormData({...formData, statut: value});
    }
  };
};