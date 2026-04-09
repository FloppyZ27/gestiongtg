import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, FolderOpen, Upload, File, FileText, Image, FileSpreadsheet, Loader2, RefreshCw, Download, ExternalLink, Eye, Trash2, Grid3x3, List, Folder, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

const getArpenteurInitials = (arpenteur) => {
  if (!arpenteur) return "";
  const mapping = {
    "Samuel Guay": "SG",
    "Dany Gaboury": "DG",
    "Pierre-Luc Pilote": "PLP",
    "Benjamin Larouche": "BL",
    "Frederic Gilbert": "FG",
    "Frédéric Gilbert": "FG"
  };
  return mapping[arpenteur] || "";
};

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-400" />;
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-400" />;
  if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return <Image className="w-4 h-4 text-purple-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

function FileGridItem({ file, onPreview, onDownload, onDelete, getFileIcon, formatFileSize, isImageFile }) {
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  React.useEffect(() => {
    const loadThumbnail = async () => {
      try {
        const response = await base44.functions.invoke('sharepoint', {
          action: 'getThumbnail',
          fileId: file.id
        });
        if (response.data?.thumbnailUrl) {
          setThumbnailUrl(response.data.thumbnailUrl);
        } else {
          setThumbnailError(true);
        }
      } catch (error) {
        console.error("Erreur chargement thumbnail:", error);
        setThumbnailError(true);
      } finally {
        setThumbnailLoading(false);
      }
    };
    loadThumbnail();
  }, [file.id]);

  return (
    <div
      className="relative bg-slate-700/50 rounded-lg overflow-hidden hover:bg-slate-700 transition-colors group cursor-pointer border border-slate-600"
      onClick={() => onPreview(file)}
    >
      <div className="aspect-square flex items-center justify-center bg-slate-800/50 relative overflow-hidden">
        {thumbnailLoading ? (
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        ) : thumbnailUrl && !thumbnailError ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-contain p-1"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="scale-150">
            {getFileIcon(file.name)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-2 bg-slate-800/80">
        <p className="text-slate-300 text-xs truncate" title={file.name}>{file.name}</p>
        <p className="text-slate-500 text-[10px]">{formatFileSize(file.size)}</p>
      </div>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDownload(file); }}
          className="h-6 w-6 p-0 bg-slate-900/90 text-slate-400 hover:text-white"
          title="Télécharger"
        >
          <Download className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDelete(file); }}
          className="h-6 w-6 p-0 bg-slate-900/90 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          title="Supprimer"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function DocumentsStepForm({
  arpenteurGeometre,
  numeroDossier,
  isCollapsed,
  onToggleCollapse,
  onDocumentsChange,
  isTemporaire = false,
  clientInfo = null,
  onAddHistoriqueEntry = null,
  priseMandatId = null
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [fileToDelete, setFileToDelete] = useState(null);
  const [currentSubPath, setCurrentSubPath] = useState("");
  const [folderToDelete, setFolderToDelete] = useState(null);
  const prevNumeroDossierRef = React.useRef(numeroDossier);

  const initials = getArpenteurInitials(arpenteurGeometre);
  
  // Construire le chemin de base - toujours INTRANTS
  let baseFolderPath;
  if (isTemporaire && clientInfo) {
    const clientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim() || "Client";
    const today = new Date().toISOString().split('T')[0];
    baseFolderPath = `ARPENTEUR/${initials}/DOSSIER/TEMPORAIRE/${initials}-${clientName}-${today}/INTRANTS`;
  } else {
    baseFolderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/INTRANTS`;
  }
  
  // Ajouter le sous-chemin s'il existe
  const folderPath = currentSubPath ? `${baseFolderPath}/${currentSubPath}` : baseFolderPath;

  // Fetch files from SharePoint - dossier spécifique
  const { data: filesData, isLoading, refetch } = useQuery({
    queryKey: ['sharepoint-documents', arpenteurGeometre, numeroDossier, isTemporaire, clientInfo?.prenom, clientInfo?.nom, currentSubPath],
    queryFn: async () => {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'list',
        folderPath: folderPath
      });
      return response.data;
    },
    enabled: !!arpenteurGeometre && (!!numeroDossier || (isTemporaire && !!clientInfo)),
    staleTime: 0
  });

  const files = filesData?.files || [];
  const folders = files.filter(f => f.type === 'folder');
  const filesList = files.filter(f => f.type === 'file');

  // Transfert automatique quand le numero de dossier est assigne (temporaire -> numerote)
  // Utilise findTemporaryFolder pour trouver le chemin avec la date correcte
  useEffect(() => {
    const prevNumero = prevNumeroDossierRef.current;
    prevNumeroDossierRef.current = numeroDossier;

    const doTransfer = async () => {
      if (!numeroDossier || !arpenteurGeometre) return;
      if (prevNumero) return; // etait deja renseigne, pas de transfert

      const initials = getArpenteurInitials(arpenteurGeometre).replace('-', '');
      const clientName = `${clientInfo?.prenom || ''} ${clientInfo?.nom || ''}`.trim() || 'Client';
      const finalPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/INTRANTS`;

      try {
        setIsTransferring(true);
        // Utiliser findTemporaryFolder pour trouver le bon dossier avec la date
        const findRes = await base44.functions.invoke('findTemporaryFolder', {
          arpenteurInitials: initials,
          clientName: clientName
        });
        const sourcePath = findRes.data?.foundPath;
        console.log('[TRANSFERT AUTO] Source trouve:', sourcePath);
        console.log('[TRANSFERT AUTO] Destination:', finalPath);

        if (sourcePath) {
          const checkRes = await base44.functions.invoke('sharepoint', { action: 'list', folderPath: sourcePath });
          const filesFound = checkRes.data?.files || [];
          console.log('[TRANSFERT AUTO] Fichiers trouves:', filesFound.length);
          if (filesFound.length > 0) {
            await base44.functions.invoke('moveSharePointFiles', {
              sourceFolderPath: sourcePath,
              destinationFolderPath: finalPath
            });
            console.log('[TRANSFERT AUTO] Transfert reussi');
            // Attendre un peu que SharePoint mette à jour puis forcer le refetch
            await new Promise(resolve => setTimeout(resolve, 500));
            refetch();
          }
        }
      } catch (err) {
        console.error('[TRANSFERT AUTO] Erreur:', err);
      } finally {
        setIsTransferring(false);
      }
    };
    doTransfer();
  }, [numeroDossier, arpenteurGeometre, clientInfo, refetch]);

  // Notifier le parent quand le nombre de fichiers change
  useEffect(() => {
    if (onDocumentsChange) {
      onDocumentsChange(filesList.length > 0);
    }
  }, [filesList.length, onDocumentsChange]);
  


  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const uploadFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          const response = await base44.functions.invoke('uploadToSharePoint', {
            folderPath: folderPath,
            fileName: file.name,
            fileContent: base64,
            contentType: file.type
          });
          resolve(response.data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const createHistoryEntry = async (fileName, action = 'Ajout de document') => {
    try {
      const user = await base44.auth.me();
      if (!user) return;

      const details = action === 'Ajout de document'
        ? `Document "${fileName}" ajouté à la section Documents`
        : action === 'Suppression de document'
        ? `Document "${fileName}" supprimé de la section Documents`
        : `Dossier "${fileName}" supprimé de la section Documents`;

      const historiqueEntry = {
        action,
        details,
        utilisateur_email: user.email,
        utilisateur_nom: user.full_name,
        date: new Date().toISOString()
      };

      if (onAddHistoriqueEntry) {
        onAddHistoriqueEntry(historiqueEntry);
      }

      const pmId = priseMandatId;
      if (pmId) {
        const priseMandat = await base44.entities.PriseMandat.filter({ id: pmId }, '', 1);
        if (priseMandat && priseMandat.length > 0) {
          const pm = priseMandat[0];
          const updatedHistorique = [historiqueEntry, ...(pm.historique || [])];
          await base44.entities.PriseMandat.update(pmId, {
            historique: updatedHistorique
          });
        }
      } else if (arpenteurGeometre && numeroDossier) {
        const priseMandats = await base44.entities.PriseMandat.filter(
          { arpenteur_geometre: arpenteurGeometre, numero_dossier: numeroDossier },
          '',
          1
        );
        if (priseMandats && priseMandats.length > 0) {
          const pm = priseMandats[0];
          const updatedHistorique = [historiqueEntry, ...(pm.historique || [])];
          await base44.entities.PriseMandat.update(pm.id, {
            historique: updatedHistorique
          });
        }
      }

      if (numeroDossier && arpenteurGeometre && !isTemporaire) {
        const dossiersData = await base44.entities.Dossier.filter(
          { numero_dossier: numeroDossier, arpenteur_geometre: arpenteurGeometre },
          '',
          1
        );
        if (dossiersData && dossiersData.length > 0) {
          const dossier = dossiersData[0];
          const updatedHistorique = [historiqueEntry, ...(dossier.historique || [])];
          await base44.entities.Dossier.update(dossier.id, { historique: updatedHistorique });
        }
      }
    } catch (error) {
      console.error('Erreur création historique:', error);
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < droppedFiles.length; i++) {
        setUploadProgress(`Téléversement ${i + 1}/${droppedFiles.length}: ${droppedFiles[i].name}`);
        await uploadFile(droppedFiles[i]);
        await createHistoryEntry(droppedFiles[i].name, 'Ajout de document');
      }
      setUploadProgress("");
      refetch();
    } catch (error) {
      console.error("Erreur upload:", error);
      setUploadProgress("Erreur lors du téléversement");
    } finally {
      setIsUploading(false);
    }
  }, [folderPath, refetch, arpenteurGeometre, numeroDossier, isTemporaire, clientInfo]);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Téléversement ${i + 1}/${selectedFiles.length}: ${selectedFiles[i].name}`);
        await uploadFile(selectedFiles[i]);
        await createHistoryEntry(selectedFiles[i].name, 'Ajout de document');
      }
      setUploadProgress("");
      refetch();
    } catch (error) {
      console.error("Erreur upload:", error);
      setUploadProgress("Erreur lors du téléversement");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'getDownloadUrl',
        fileId: file.id
      });
      if (response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error);
    }
  };

  const handlePreview = async (file) => {
    setPreviewFile(file);
    setIsLoadingPreview(true);
    
    try {
      if (isImageFile(file.name)) {
        const response = await base44.functions.invoke('sharepoint', {
          action: 'getDownloadUrl',
          fileId: file.id
        });
        
        if (response.data?.downloadUrl) {
          setPreviewUrl(response.data.downloadUrl);
        } else if (file.downloadUrl) {
          setPreviewUrl(file.downloadUrl);
        }
      } else {
        const response = await base44.functions.invoke('sharepoint', {
          action: 'preview',
          fileId: file.id
        });
        
        if (response.data?.previewUrl) {
          setPreviewUrl(response.data.previewUrl);
        } else if (file.webUrl) {
          setPreviewUrl(file.webUrl);
        }
      }
    } catch (error) {
      console.error("Erreur preview:", error);
      setPreviewUrl(file.downloadUrl || file.webUrl);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const isImageFile = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  };

  const handleDelete = async (file) => {
    try {
      await base44.functions.invoke('sharepoint', {
        action: 'delete',
        fileId: file.id
      });
      await createHistoryEntry(file.name, 'Suppression de document');
      refetch();
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression du fichier");
    }
  };

  const getThumbnailUrl = async (file) => {
    try {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'getThumbnail',
        fileId: file.id,
        size: 'medium'
      });
      return response.data?.thumbnailUrl;
    } catch (error) {
      console.error("Erreur thumbnail:", error);
      return null;
    }
  };

  const handleFolderClick = (folder) => {
    const newSubPath = currentSubPath ? `${currentSubPath}/${folder.name}` : folder.name;
    setCurrentSubPath(newSubPath);
  };

  const handleGoBack = () => {
    if (!currentSubPath) return;
    const pathParts = currentSubPath.split('/');
    pathParts.pop();
    setCurrentSubPath(pathParts.join('/'));
  };

  const handleDeleteFolder = async (folder) => {
    try {
      await base44.functions.invoke('sharepoint', {
        action: 'delete',
        fileId: folder.id
      });
      await createHistoryEntry(folder.name, 'Suppression de dossier');
      setFolderToDelete(null);
      refetch();
    } catch (error) {
      console.error("Erreur suppression dossier:", error);
      alert("Erreur lors de la suppression du dossier");
    }
  };



  return (
    <Card 
      className={`border-slate-700 bg-slate-800/30 transition-all ${isDragOver ? 'ring-2 ring-yellow-500 bg-yellow-500/10' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader 
        className="cursor-pointer hover:bg-yellow-900/40 transition-colors rounded-t-lg py-1.5 bg-yellow-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <CardTitle className="text-yellow-300 text-base">Documents</CardTitle>
            {filesList.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                {filesList.length} fichier{filesList.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="mb-3 flex items-center gap-2">


          </div>

            <div className="mt-0">
              {isDragOver && (
                <div className="flex items-center justify-center py-4 text-teal-400 text-sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Déposez les fichiers ici
                </div>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 py-2 text-teal-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadProgress}
                </div>
              )}

              {!isDragOver && !isUploading && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {currentSubPath && (
                      <Button type="button" variant="ghost" size="sm" onClick={handleGoBack} className="text-slate-400 hover:text-white h-6 px-2 flex-shrink-0" title="Retour">
                        <ArrowLeft className="w-3 h-3" />
                      </Button>
                    )}
                    <p className="text-slate-500 text-xs truncate">📁 {folderPath}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setViewMode(viewMode === "list" ? "grid" : "list"); }} className="text-slate-400 hover:text-white h-6 px-2" title={viewMode === "list" ? "Vue grille" : "Vue liste"}>
                      {viewMode === "list" ? <Grid3x3 className="w-3 h-3" /> : <List className="w-3 h-3" />}
                    </Button>
                    <label onClick={(e) => e.stopPropagation()}>
                      <input type="file" multiple onChange={handleFileSelect} className="hidden" />
                      <span className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded cursor-pointer transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        Ajouter
                      </span>
                    </label>
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); refetch(); }} className="text-slate-400 hover:text-white h-6 px-2">
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}

              {!isDragOver && !isUploading && (
                <>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                  ) : (folders.length > 0 || filesList.length > 0) ? (
                    viewMode === "list" ? (
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {folders.map((folder) => (
                          <div key={folder.id} className="flex items-center justify-between px-2 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded hover:bg-blue-500/20 transition-colors group cursor-pointer" onClick={() => handleFolderClick(folder)}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <span className="text-blue-300 text-sm font-medium truncate">{folder.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder); }} className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Supprimer le dossier">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {filesList.map((file) => (
                          <div key={file.id} className="flex items-center justify-between px-2 py-1.5 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors group cursor-pointer" onClick={() => handlePreview(file)}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getFileIcon(file.name)}
                              <span className="text-slate-300 text-sm truncate">{file.name}</span>
                              <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handlePreview(file); }} className="h-6 px-2 text-slate-400 hover:text-white" title="Visualiser"><Eye className="w-3 h-3" /></Button>
                              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="h-6 px-2 text-slate-400 hover:text-white" title="Télécharger"><Download className="w-3 h-3" /></Button>
                              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFileToDelete(file); }} className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Supprimer"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5 max-h-60 overflow-y-auto p-1">
                        {folders.map((folder) => (
                          <div key={folder.id} className="relative bg-blue-500/10 border border-blue-500/30 rounded-lg overflow-hidden hover:bg-blue-500/20 transition-colors group cursor-pointer" onClick={() => handleFolderClick(folder)}>
                            <div className="aspect-square flex items-center justify-center bg-blue-500/5"><Folder className="w-12 h-12 text-blue-400" /></div>
                            <div className="p-2 bg-blue-500/10"><p className="text-blue-300 text-xs truncate font-medium" title={folder.name}>{folder.name}</p></div>
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFolderToDelete(folder); }} className="h-6 w-6 p-0 bg-slate-900/90 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Supprimer le dossier"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                        ))}
                        {filesList.map((file) => (
                          <FileGridItem key={file.id} file={file} onPreview={handlePreview} onDownload={handleDownload} onDelete={setFileToDelete} getFileIcon={getFileIcon} formatFileSize={formatFileSize} isImageFile={isImageFile} />
                        ))}
                      </div>
                    )
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-3">Aucun fichier • Glissez des fichiers ici ou cliquez sur Ajouter</p>
                  )}
                </>
              )}
            </div>
        </CardContent>
      )}

        {/* Dialog de prévisualisation */}
        <Dialog open={!!previewFile} onOpenChange={closePreview}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
            <DialogHeader className="px-4 py-2 border-b border-slate-700 flex-shrink-0">
              <DialogTitle className="flex items-center gap-2 text-sm">
                {getFileIcon(previewFile?.name)}
                <span className="truncate">{previewFile?.name}</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Aperçu du fichier {previewFile?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                </div>
              ) : previewUrl ? (
                isImageFile(previewFile?.name) ? (
                  <div className="flex items-center justify-center h-full bg-slate-800/50 p-4">
                    <img
                      src={previewUrl}
                      alt={previewFile?.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={previewFile?.name}
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p>Prévisualisation non disponible</p>
                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() => previewFile?.webUrl && window.open(previewFile.webUrl, '_blank')}
                  >
                    Ouvrir dans SharePoint
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Attention
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Confirmation de suppression du fichier {fileToDelete?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer ce document ?
              </p>
              {fileToDelete && (
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center gap-2">
                  {getFileIcon(fileToDelete.name)}
                  <span className="text-white text-sm truncate flex-1">{fileToDelete.name}</span>
                </div>
              )}
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setFileToDelete(null)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleDelete(fileToDelete);
                    setFileToDelete(null);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression dossier */}
        <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
          <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
            <DialogHeader>
              <DialogTitle className="text-xl text-red-400 flex items-center justify-center gap-3">
                <span className="text-2xl">⚠️</span>
                Confirmer la suppression
                <span className="text-2xl">⚠️</span>
              </DialogTitle>
              <DialogDescription className="sr-only">
                Confirmation de suppression du dossier {folderToDelete?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-300 text-center">
                Êtes-vous sûr de vouloir supprimer ce dossier et tout son contenu ?
              </p>
              {folderToDelete && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium truncate flex-1">{folderToDelete.name}</span>
                </div>
              )}
              <div className="flex justify-center gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setFolderToDelete(null)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleDeleteFolder(folderToDelete);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
  );
}