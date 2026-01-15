import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, ChevronUp, Upload, FileText, Image as ImageIcon, File, Download, Trash2, Eye, X, Grid3x3, List, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return ImageIcon;
  if (['pdf'].includes(ext)) return FileText;
  return File;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const FileGridItem = ({ file, onPreview, onDownload, onDelete }) => {
  const IconComponent = getFileIcon(file.name);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(file.name.split('.').pop()?.toLowerCase());
  
  return (
    <div className="relative group bg-slate-800/30 border border-slate-700 rounded-lg p-3 hover:bg-slate-800/50 transition-all">
      <div className="aspect-square bg-slate-900/50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
        {isImage && file.downloadUrl ? (
          <img src={file.downloadUrl} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <IconComponent className="w-12 h-12 text-slate-500" />
        )}
      </div>
      <p className="text-white text-xs truncate mb-1" title={file.name}>{file.name}</p>
      <p className="text-slate-500 text-xs">{formatFileSize(file.size)}</p>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onPreview(file)}
          className="h-7 w-7 p-0 bg-slate-900/80 hover:bg-slate-800 text-white"
        >
          <Eye className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDownload(file)}
          className="h-7 w-7 p-0 bg-slate-900/80 hover:bg-slate-800 text-white"
        >
          <Download className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(file)}
          className="h-7 w-7 p-0 bg-slate-900/80 hover:bg-red-900 text-red-400"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default function DocumentsStepFormLot({
  lotNumero,
  circonscription,
  isCollapsed,
  onToggleCollapse,
  disabled = false
}) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [previewFile, setPreviewFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const folderPath = lotNumero && circonscription ? `Lots/${circonscription}/${lotNumero}` : null;

  const { data: files = [], refetch } = useQuery({
    queryKey: ['lot-files', folderPath],
    queryFn: async () => {
      if (!folderPath) return [];
      const response = await base44.functions.invoke('sharepoint', { 
        action: 'listFiles',
        folderPath 
      });
      return response.data || [];
    },
    enabled: !!folderPath && !disabled,
    initialData: [],
  });

  const handleFileUpload = async (fileList) => {
    if (!folderPath || disabled) return;
    
    setUploading(true);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderPath', folderPath);
        
        await base44.functions.invoke('uploadToSharePoint', formData);
      }
      await refetch();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur lors du téléversement');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleDownload = async (file) => {
    try {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (file) => {
    if (!folderPath) return;
    
    try {
      await base44.functions.invoke('sharepoint', {
        action: 'deleteFile',
        folderPath,
        fileName: file.name
      });
      await refetch();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  if (!lotNumero || !circonscription) {
    return (
      <Card className="border-slate-700 bg-slate-800/30">
        <CardHeader className="cursor-pointer hover:bg-yellow-900/40 transition-colors rounded-t-lg py-1.5 bg-yellow-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <Paperclip className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <CardTitle className="text-yellow-300 text-base">Documents</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2 pb-3">
          <p className="text-slate-400 text-sm text-center py-4">
            Veuillez d'abord renseigner le numéro de lot et la circonscription
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-700 bg-slate-800/30">
        <CardHeader 
          className="cursor-pointer hover:bg-yellow-900/40 transition-colors rounded-t-lg py-1.5 bg-yellow-900/20"
          onClick={onToggleCollapse}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <Paperclip className="w-3.5 h-3.5 text-yellow-400" />
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
          <CardContent className="pt-2 pb-3 space-y-3">
            {/* Upload zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-800/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-yellow-500/50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !disabled && document.getElementById('file-upload-lot').click()}
            >
              <Upload className={`w-8 h-8 mx-auto mb-2 ${dragActive ? 'text-yellow-400' : 'text-slate-500'}`} />
              <p className="text-slate-300 text-sm mb-1">
                {uploading ? 'Téléversement en cours...' : 'Glissez vos fichiers ici ou cliquez pour sélectionner'}
              </p>
              <p className="text-slate-500 text-xs">Tous types de fichiers acceptés</p>
              <Input
                id="file-upload-lot"
                type="file"
                multiple
                disabled={disabled}
                onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
                className="hidden"
              />
            </div>

            {/* View mode toggle */}
            {files.length > 0 && (
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-slate-700' : ''}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-slate-700' : ''}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Files display */}
            {files.length > 0 ? (
              viewMode === 'list' ? (
                <div className="space-y-2">
                  {files.map((file, idx) => {
                    const IconComponent = getFileIcon(file.name);
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors">
                        <IconComponent className="w-5 h-5 text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{file.name}</p>
                          <p className="text-slate-500 text-xs">{formatFileSize(file.size)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handlePreview(file)}
                            className="text-slate-400 hover:text-white h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(file)}
                            className="text-slate-400 hover:text-white h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm(file)}
                            className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {files.map((file, idx) => (
                    <FileGridItem
                      key={idx}
                      file={file}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      onDelete={(f) => setDeleteConfirm(f)}
                    />
                  ))}
                </div>
              )
            ) : (
              <p className="text-slate-500 text-sm text-center py-4">Aucun document</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="mt-4">
              {['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(previewFile.name.split('.').pop()?.toLowerCase()) ? (
                <img src={previewFile.downloadUrl} alt={previewFile.name} className="w-full h-auto rounded-lg" />
              ) : previewFile.name.endsWith('.pdf') ? (
                <iframe src={previewFile.downloadUrl} className="w-full h-[70vh] rounded-lg" />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-slate-400">Aperçu non disponible pour ce type de fichier</p>
                  <Button onClick={() => handleDownload(previewFile)} className="mt-4">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300">
            Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteConfirm?.name}</span> ?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button onClick={() => handleDelete(deleteConfirm)} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}