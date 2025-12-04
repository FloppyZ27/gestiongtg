import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, FolderOpen, Upload, File, FileText, Image, FileSpreadsheet, Loader2, RefreshCw, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();

  const initials = getArpenteurInitials(arpenteurGeometre);
  const folderPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/INTRANT`;

  // Fetch files from SharePoint
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
    // Convert file to base64
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
        action: 'download',
        itemId: file.id
      });
      if (response.data?.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader 
        className="cursor-pointer hover:bg-teal-900/40 transition-colors rounded-t-lg py-1.5 bg-teal-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-teal-500/30 flex items-center justify-center">
              <FolderOpen className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <CardTitle className="text-teal-300 text-base">Documents</CardTitle>
            {files.length > 0 && (
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs">
                {files.length} fichier{files.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-1 pb-2">
          <div className="space-y-3">
            {/* Chemin du dossier */}
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs truncate flex-1">
                📁 {folderPath}
              </p>
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

            {/* Zone de drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                isDragOver 
                  ? 'border-teal-500 bg-teal-500/10' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                  <p className="text-teal-400 text-sm">{uploadProgress}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    Glissez-déposez des fichiers ici
                  </p>
                  <p className="text-slate-500 text-xs mt-1">ou</p>
                  <label className="mt-2 inline-block">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded cursor-pointer transition-colors">
                      Parcourir
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* Liste des fichiers */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            ) : files.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between px-2 py-1.5 bg-slate-700/50 rounded hover:bg-slate-700 transition-colors group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file.name)}
                      <span className="text-slate-300 text-sm truncate">{file.name}</span>
                      <span className="text-slate-500 text-xs">{formatFileSize(file.size)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-slate-400 hover:text-white"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-2">
                Aucun fichier dans ce dossier
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}