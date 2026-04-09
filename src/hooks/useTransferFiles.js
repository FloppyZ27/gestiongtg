import { useState } from 'react';

export const useTransferFiles = () => {
  const [transferFilesConfig, setTransferFilesConfig] = useState(null);
  const [isTransferFilesDialogOpen, setIsTransferFilesDialogOpen] = useState(false);

  return {
    transferFilesConfig,
    setTransferFilesConfig,
    isTransferFilesDialogOpen,
    setIsTransferFilesDialogOpen
  };
};