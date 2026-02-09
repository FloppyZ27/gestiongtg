import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, Download, Eye, Trash2, Upload, FileText, Image, FileSpreadsheet, File, Grid3x3, List } from "lucide-react";

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

export default function SharePointTerrainViewer({ arpenteurGeometre, numeroDossier }) {
  const [viewMode, setViewMode] = useState("list");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("in");

  const initials = getArpenteurInitials(arpenteurGeometre);
  const folderPathIN = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/IN`;
  const folderPathOUT = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/OUT`;
  
  const currentFolderPath = activeTab === "in" ? folderPathIN : folderPathOUT;

  const { data: filesData, isLoading, refetch } = useQuery({
    queryKey: ['sharepoint-terrain', arpenteurGeometre, numeroDossier, activeTab],
    queryFn: async () => {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'list',
        folderPath: currentFolderPath
      });
      return response.data;
    },
    enabled: !!arpenteurGeometre && !!numeroDossier,
    staleTime: 30000
  });

  const files = filesData?.files || [];

  const uploadFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          const response = await base44.functions.invoke('uploadToSharePoint', {
            folderPath: currentFolderPath,
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

  const handleDelete = async (file) => {
    try {
      await base44.functions.invoke('sharepoint', {
        action: 'delete',
        fileId: file.id
      });
      setFileToDelete(null);
      refetch();
    } catch (error) {
      console.error("Erreur suppression:", error);
      alert("Erreur lors de la suppression du fichier");
    }
  };

  const handlePreview = async (file) => {
    try {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'getDownloadUrl',
        fileId: file.id
      });
      if (response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error("Erreur preview:", error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Tabs IN / OUT */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="in" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
            IN
          </TabsTrigger>
          <TabsTrigger value="out" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">
            OUT
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-3">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs truncate flex-1">
          📁 {currentFolderPath}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="text-slate-400 hover:text-white h-6 px-2"
            title={viewMode === "list" ? "Vue grille" : "Vue liste"}
          >
            {viewMode === "list" ? <Grid3x3 className="w-3 h-3" /> : <List className="w-3 h-3" />}
          </Button>
          <label>
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
            onClick={() => refetch()}
            className="text-slate-400 hover:text-white h-6 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Message de progression */}
      {isUploading && (
        <div className="flex items-center gap-2 py-2 text-teal-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          {uploadProgress}
        </div>
      )}

      {/* Liste/Grille des fichiers */}
      {!isUploading && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : files.length > 0 ? (
            viewMode === "list" ? (
              <div className="max-h-[400px] overflow-y-auto space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors group cursor-pointer"
                    onClick={() => handlePreview(file)}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.name)}
                      <span className="text-slate-300 text-sm truncate">{file.name}</span>
                      <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                        className="h-7 px-2 text-slate-400 hover:text-white"
                        title="Visualiser"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                        className="h-7 px-2 text-slate-400 hover:text-white"
                        title="Télécharger"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setFileToDelete(file); }}
                        className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="relative bg-slate-700/50 rounded-lg overflow-hidden hover:bg-slate-700 transition-colors group cursor-pointer border border-slate-600"
                    onClick={() => handlePreview(file)}
                  >
                    <div className="aspect-square flex items-center justify-center bg-slate-800/50">
                      <div className="scale-150">
                        {getFileIcon(file.name)}
                      </div>
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
                        onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                        className="h-6 w-6 p-0 bg-slate-900/90 text-slate-400 hover:text-white"
                        title="Télécharger"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setFileToDelete(file); }}
                        className="h-6 w-6 p-0 bg-slate-900/90 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">Aucun fichier dans le dossier {activeTab.toUpperCase()}</p>
              <p className="text-xs mt-1">Cliquez sur "Ajouter" pour téléverser des fichiers</p>
            </div>
          )}
        </>
      )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setFileToDelete(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">⚠️ Confirmer la suppression</h3>
            <p className="text-slate-300 mb-4">
              Êtes-vous sûr de vouloir supprimer ce document ?
            </p>
            <div className="p-3 bg-slate-700/50 rounded-lg border border-slate-600 flex items-center gap-2 mb-4">
              {getFileIcon(fileToDelete.name)}
              <span className="text-white text-sm truncate flex-1">{fileToDelete.name}</span>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFileToDelete(null)}
                className="border-slate-600 text-slate-400 hover:bg-slate-700"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => handleDelete(fileToDelete)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}