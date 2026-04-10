import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Download, Eye, Trash2, Upload, FileText, Image, FileSpreadsheet, File, Folder, ArrowLeft, ChevronRight, Home } from "lucide-react";

const getFileIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return <FileText className="w-4 h-4 text-red-400" />;
  if (['doc', 'docx'].includes(ext)) return <FileText className="w-4 h-4 text-blue-400" />;
  if (['xls', 'xlsx'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return <Image className="w-4 h-4 text-purple-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function SharePointExplorer({ rootPath, initialPath = [], maxHeight = "400px", allowUpload = true, allowDelete = false }) {
  const [pathStack, setPathStack] = useState(initialPath);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [fileToDelete, setFileToDelete] = useState(null);

  const currentPath = pathStack.length > 0 
    ? `${rootPath}/${pathStack.join('/')}` 
    : rootPath;

  const { data: filesData, isLoading, refetch } = useQuery({
    queryKey: ['sharepoint-explorer', currentPath],
    queryFn: async () => {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'list',
        folderPath: currentPath
      });
      return response.data;
    },
    enabled: !!rootPath,
    staleTime: 0,
    retry: false
  });

  const allItems = filesData?.files || [];
  const folders = allItems.filter(f => f.type === 'folder');
  const files = allItems.filter(f => f.type === 'file');

  const navigateInto = (folderName) => {
    setPathStack(prev => [...prev, folderName]);
  };

  const navigateBack = () => {
    setPathStack(prev => prev.slice(0, -1));
  };

  const navigateToIndex = (index) => {
    setPathStack(prev => prev.slice(0, index + 1));
  };

  const navigateToRoot = () => {
    setPathStack([]);
  };

  const handleDownload = async (file) => {
    const response = await base44.functions.invoke('sharepoint', {
      action: 'getDownloadUrl',
      fileId: file.id
    });
    if (response.data?.downloadUrl) {
      window.open(response.data.downloadUrl, '_blank');
    }
  };

  const handleOpen = async (file) => {
    const response = await base44.functions.invoke('sharepoint', {
      action: 'getDownloadUrl',
      fileId: file.id
    });
    const url = response.data?.downloadUrl || file.webUrl;
    if (url) window.open(url, '_blank');
  };

  const handleDelete = async (file) => {
    await base44.functions.invoke('sharepoint', {
      action: 'delete',
      fileId: file.id
    });
    setFileToDelete(null);
    refetch();
  };

  const uploadFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const response = await base44.functions.invoke('uploadToSharePoint', {
          folderPath: currentPath,
          fileName: file.name,
          fileContent: base64,
          contentType: file.type
        });
        resolve(response.data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;
    setIsUploading(true);
    for (let i = 0; i < selectedFiles.length; i++) {
      setUploadProgress(`Téléversement ${i + 1}/${selectedFiles.length}: ${selectedFiles[i].name}`);
      await uploadFile(selectedFiles[i]);
    }
    setUploadProgress("");
    setIsUploading(false);
    refetch();
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Barre de navigation explorateur */}
      <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700 rounded px-2 py-1.5">
        <button
          onClick={navigateBack}
          disabled={pathStack.length === 0}
          className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700/50 transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Retour"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={navigateToRoot}
          className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-700/50 transition-colors flex-shrink-0"
          title="Racine"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
        {pathStack.map((part, idx) => (
          <div key={idx} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <button
              onClick={() => navigateToIndex(idx)}
              className={`text-xs px-1 py-0.5 rounded hover:bg-slate-700/50 transition-colors truncate max-w-[120px] ${
                idx === pathStack.length - 1 ? 'text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
              title={part}
            >
              {part}
            </button>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 flex-shrink-0">
          {allowUpload && (
            <label>
              <input type="file" multiple onChange={handleFileSelect} className="hidden" />
              <span className="px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded cursor-pointer transition-colors inline-flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Ajouter
              </span>
            </label>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => refetch()} className="h-6 w-6 p-0 text-slate-400 hover:text-white">
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>



      {/* Upload progress */}
      {isUploading && (
        <div className="flex items-center gap-2 text-teal-400 text-xs px-2 py-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {uploadProgress}
        </div>
      )}

      {/* Contenu */}
      <div style={{ maxHeight, overflowY: 'auto' }} className="space-y-0.5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : (folders.length === 0 && files.length === 0) ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            <Folder className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Dossier vide</p>
            <p className="text-xs mt-1">Glissez des fichiers ou cliquez sur "Ajouter"</p>
          </div>
        ) : (
          <>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center justify-between px-2 py-2 bg-blue-500/10 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors group cursor-pointer"
                onClick={() => navigateInto(folder.name)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-blue-300 text-sm font-medium truncate">{folder.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                  {allowDelete && (
                    <Button type="button" variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); setFileToDelete(folder); }}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between px-2 py-1.5 bg-slate-700/40 rounded hover:bg-slate-700/70 transition-colors group cursor-pointer"
                onClick={() => handleOpen(file)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getFileIcon(file.name)}
                  <span className="text-slate-300 text-sm truncate">{file.name}</span>
                  {file.size > 0 && <span className="text-slate-500 text-xs flex-shrink-0">{formatFileSize(file.size)}</span>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpen(file); }} className="h-6 w-6 p-0 text-slate-400 hover:text-white" title="Ouvrir">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="h-6 w-6 p-0 text-slate-400 hover:text-white" title="Télécharger">
                    <Download className="w-3 h-3" />
                  </Button>
                  {allowDelete && (
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFileToDelete(file); }} className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Supprimer">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Dialog suppression */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]" onClick={() => setFileToDelete(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-yellow-400 mb-3">⚠️ Confirmer la suppression</h3>
            <div className="p-2 bg-slate-700/50 rounded flex items-center gap-2 mb-4">
              {fileToDelete.type === 'folder' ? <Folder className="w-4 h-4 text-blue-400" /> : getFileIcon(fileToDelete.name)}
              <span className="text-white text-sm truncate">{fileToDelete.name}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFileToDelete(null)} className="border-slate-600 text-slate-300 text-sm h-8">Annuler</Button>
              <Button type="button" onClick={() => handleDelete(fileToDelete)} className="bg-red-600 hover:bg-red-700 text-white text-sm h-8">Supprimer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}