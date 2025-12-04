import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, FolderOpen, Upload, File, FileText, Image, FileSpreadsheet, Loader2, RefreshCw, Download, Eye } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

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

export default function DocumentsStepForm({
  arpenteurGeometre,
  numeroDossier,
  isCollapsed,
  onToggleCollapse
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const initials = getArpenteurInitials(arpenteurGeometre);
  const folderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/INTRANTS`;

  // Fetch files from SharePoint - dossier spécifique
  const { data: filesData, isLoading, refetch } = useQuery({
    queryKey: ['sharepoint-intrant', arpenteurGeometre, numeroDossier],
    queryFn: async () => {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'list',
        folderPath: folderPath
      });
      return response.data;
    },
    enabled: !!arpenteurGeometre && !!numeroDossier,
    staleTime: 30000
  });

  const files = filesData?.files || [];

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
      }
      setUploadProgress("");
      refetch();
    } catch (error) {
      console.error("Erreur upload:", error);
      setUploadProgress("Erreur lors du téléversement");
    } finally {
      setIsUploading(false);
    }
  }, [folderPath, refetch]);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadProgress(`Téléversement ${i + 1}/${selectedFiles.length}: ${selectedFiles[i].name}`);
        await uploadFile(selectedFiles[i]);
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
      // Utiliser l'action preview pour obtenir l'URL de prévisualisation Office
      const response = await base44.functions.invoke('sharepoint', {
        action: 'preview',
        fileId: file.id
      });
      
      if (response.data?.previewUrl) {
        setPreviewUrl(response.data.previewUrl);
      } else if (file.webUrl) {
        setPreviewUrl(file.webUrl);
      }
    } catch (error) {
      console.error("Erreur preview:", error);
      // Fallback: utiliser webUrl
      if (file.webUrl) {
        setPreviewUrl(file.webUrl);
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const isPreviewable = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    return ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
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
            {files.length > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                {files.length} fichier{files.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          {/* Message si drag over */}
          {isDragOver && (
            <div className="flex items-center justify-center py-4 text-teal-400 text-sm">
              <Upload className="w-4 h-4 mr-2" />
              Déposez les fichiers ici
            </div>
          )}

          {/* Message de progression */}
          {isUploading && (
            <div className="flex items-center gap-2 py-2 text-teal-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}
            </div>
          )}

          {/* Chemin et refresh */}
          {!isDragOver && !isUploading && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-xs truncate flex-1">
                📁 {folderPath}
              </p>
              <div className="flex items-center gap-1">
                <label onClick={(e) => e.stopPropagation()}>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded cursor-pointer transition-colors flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Ajouter
                  </span>
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); refetch(); }}
                  className="text-slate-400 hover:text-white h-6 px-2"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}

          {/* Liste des fichiers */}
          {!isDragOver && !isUploading && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              ) : files.length > 0 ? (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-2 py-1.5 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors group cursor-pointer"
                      onClick={() => isPreviewable(file.name) ? handlePreview(file) : handleDownload(file)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(file.name)}
                        <span className="text-slate-300 text-sm truncate">{file.name}</span>
                        <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPreviewable(file.name) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                            className="h-6 px-2 text-slate-400 hover:text-white"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                          className="h-6 px-2 text-slate-400 hover:text-white"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-xs text-center py-3">
                  Aucun fichier • Glissez des fichiers ici ou cliquez sur Ajouter
                </p>
              )}
            </>
          )}
        </CardContent>
      )}

      {/* Dialog de prévisualisation */}
      <Dialog open={!!previewFile} onOpenChange={closePreview}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white flex items-center gap-2">
                {previewFile && getFileIcon(previewFile.name)}
                {previewFile?.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => previewFile && handleDownload(previewFile)}
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            ) : previewUrl ? (
              <div className="w-full h-[70vh]">
                {previewFile?.name?.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded"
                    title={previewFile?.name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <img
                      src={previewUrl}
                      alt={previewFile?.name}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-slate-400">
                Impossible de charger la prévisualisation
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}