import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Folder, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG",
    "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP",
    "Benjamin Larouche": "BL",
    "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "";
};

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  
  if (imageExts.includes(ext)) return <FileText className="w-4 h-4 text-blue-400" />;
  if (docExts.includes(ext)) return <FileText className="w-4 h-4 text-orange-400" />;
  return <FileText className="w-4 h-4 text-slate-400" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export default function TransferFilesDialog({ 
  open, 
  onOpenChange, 
  temporaryPath, 
  destinationPath,
  arpenteur,
  numeroDossier,
  clientName
}) {
  const [tempFiles, setTempFiles] = useState([]);
  const [destFiles, setDestFiles] = useState([]);
  const [loadingTemp, setLoadingTemp] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [transferring, setTransferring] = useState(null);
  
  const initials = getArpenteurInitials(arpenteur);
  const dossierTitle = `${initials}-${numeroDossier}`;

  const loadFiles = async (path, setSetter, setLoading) => {
    if (!path) return;
    setLoading(true);
    try {
      const res = await base44.functions.invoke('sharepoint', {
        action: 'list',
        folderPath: path
      });
      setSetter(res.data?.files?.filter(f => f.type === 'file') || []);
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
      setSetter([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadFiles(temporaryPath, setTempFiles, setLoadingTemp);
      loadFiles(destinationPath, setDestFiles, setLoadingDest);
    }
  }, [open, temporaryPath, destinationPath]);

  const handleTransferFile = async (file) => {
    setTransferring(file.id);
    try {
      // Copier le fichier vers la destination
      await base44.functions.invoke('sharepoint', {
        action: 'copyFile',
        sourceFileId: file.id,
        destinationPath: destinationPath
      });
      
      // Supprimer du temporaire
      await base44.functions.invoke('sharepoint', {
        action: 'delete',
        fileId: file.id
      });

      // Rafraîchir les deux listes
      await loadFiles(temporaryPath, setTempFiles, setLoadingTemp);
      await loadFiles(destinationPath, setDestFiles, setLoadingDest);
    } catch (err) {
      console.error('Erreur transfert:', err);
      alert(`Erreur: ${err.message}`);
    } finally {
      setTransferring(null);
    }
  };

  const handleTransferAll = async () => {
    setTransferring('all');
    let count = 0;
    try {
      for (const file of tempFiles) {
        try {
          await base44.functions.invoke('sharepoint', {
            action: 'copyFile',
            sourceFileId: file.id,
            destinationPath: destinationPath
          });
          await base44.functions.invoke('sharepoint', {
            action: 'delete',
            fileId: file.id
          });
          count++;
        } catch (e) {
          console.error(`Erreur transfert ${file.name}:`, e);
        }
      }
      alert(`${count} fichier(s) transféré(s)`);
      await loadFiles(temporaryPath, setTempFiles, setLoadingTemp);
      await loadFiles(destinationPath, setDestFiles, setLoadingDest);
    } finally {
      setTransferring(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-6xl h-[80vh] p-4 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">
            Transfert de fichiers — {initials}-{numeroDossier} - {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Côté gauche - Dossier temporaire */}
          <div className="flex-1 flex flex-col bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Folder className="w-4 h-4 text-yellow-400" />
              Dossier Temporaire
            </h3>
            <p className="text-xs text-slate-400 mb-3 truncate px-1 font-mono break-all">
              📁 {temporaryPath}
            </p>
            
            {loadingTemp ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : tempFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Aucun fichier
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {tempFiles.map(file => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between gap-2 p-2 bg-slate-700/50 rounded border border-slate-600 hover:border-slate-500 transition"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.name)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-300 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleTransferFile(file)}
                        disabled={transferring === file.id || transferring === 'all'}
                        className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 h-7"
                      >
                        {transferring === file.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                {tempFiles.length > 0 && (
                  <Button
                    onClick={handleTransferAll}
                    disabled={transferring !== null}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs"
                  >
                    {transferring === 'all' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Transfert...
                      </>
                    ) : (
                      'Tout transférer'
                    )}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Côté droit - Dossier destination */}
          <div className="flex-1 flex flex-col bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              Dossier Destination (N°{numeroDossier})
            </h3>
            <p className="text-xs text-slate-400 mb-3 truncate px-1 font-mono break-all">
              📁 {destinationPath}
            </p>
            
            {loadingDest ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : destFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Aucun fichier
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {destFiles.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-2 p-2 bg-slate-700/50 rounded border border-slate-600"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.name)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-2 pt-4 border-t border-slate-700">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="text-slate-300 border-slate-600"
          >
            Fermer
          </Button>
          <Button
            onClick={() => {
              loadFiles(temporaryPath, setTempFiles, setLoadingTemp);
              loadFiles(destinationPath, setDestFiles, setLoadingDest);
            }}
            size="sm"
            variant="outline"
            className="text-slate-300 border-slate-600"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Rafraîchir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}