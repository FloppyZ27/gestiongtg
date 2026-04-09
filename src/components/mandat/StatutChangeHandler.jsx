import { useState, useCallback } from 'react';
import { createStatutChangeHandler } from '../../hooks/useStatutChangeHandler';

export const useStatutChangeHandlerWithTransfer = () => {
  const [transferFilesConfig, setTransferFilesConfig] = useState(null);
  const [isTransferFilesDialogOpen, setIsTransferFilesDialogOpen] = useState(false);

  const createHandler = useCallback((formData, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData) => {
    return createStatutChangeHandler(formData, calculerProchainNumeroDossier, editingPriseMandat, isLocked, setFormData, setTransferFilesConfig, setIsTransferFilesDialogOpen);
  }, []);

  return {
    transferFilesConfig,
    setTransferFilesConfig,
    isTransferFilesDialogOpen,
    setIsTransferFilesDialogOpen,
    createHandler
  };
};