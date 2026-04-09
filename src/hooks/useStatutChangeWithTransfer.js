import { useState } from 'react';
import { createStatutChangeHandler } from './useStatutChangeHandler';

export const useStatutChangeWithTransfer = () => {
  const [transferFilesConfig, setTransferFilesConfig] = useState(null);
  const [isTransferFilesDialogOpen, setIsTransferFilesDialogOpen] = useState(false);

  const createHandler = (formData, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData) => {
    return createStatutChangeHandler(formData, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData, setTransferFilesConfig, setIsTransferFilesDialogOpen);
  };

  return {
    transferFilesConfig,
    setTransferFilesConfig,
    isTransferFilesDialogOpen,
    setIsTransferFilesDialogOpen,
    createHandler
  };
};