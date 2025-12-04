import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Folder, 
  FileText, 
  FileImage, 
  FileSpreadsheet, 
  File, 
  ArrowLeft, 
  Search, 
  Download, 
  ExternalLink,
  Loader2,
  FolderOpen,
  RefreshCw,
  Eye
} from "lucide-react";

const getFileIcon = (file) => {
  if (file.type === 'folder') return <Folder className="w-8 h-8 text-yellow-400" />;
  
  const mimeType = file.mimeType || '';
  if (mimeType.includes('image')) return <FileImage className="w-8 h-8 text-purple-400" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-8 h-8 text-green-400" />;
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-blue-400" />;
  return <File className="w-8 h-8 text-slate-400" />;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function SharePointPage() {
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderPath, setFolderPath] = useState([{ id: 'root', name: 'Documents' }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const { data: filesData, isLoading, error, refetch } = useQuery({
    queryKey: ['sharepoint-files', currentFolderId],
    queryFn: async () => {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'list',
        folderId: currentFolderId
      });
      return response.data;
    }
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await base44.functions.invoke('sharepoint', {
        action: 'search',
        query: searchQuery
      });
      // Temporarily show search results
      setFolderPath([{ id: 'search', name: `Recherche: "${searchQuery}"` }]);
      setCurrentFolderId('search-results');
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const navigateToFolder = (folder) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setCurrentFolderId(folder.id);
  };

  const navigateBack = (index) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
  };

  const handleFileClick = async (file) => {
    if (file.type === 'folder') {
      navigateToFolder(file);
    } else {
      // Ouvrir la prévisualisation
      setPreviewFile(file);
      setIsLoadingPreview(true);
      try {
        const response = await base44.functions.invoke('sharepoint', {
          action: 'preview',
          fileId: file.id
        });
        setPreviewUrl(response.data.previewUrl);
      } catch (err) {
        // Fallback to webUrl
        setPreviewUrl(file.webUrl);
      } finally {
        setIsLoadingPreview(false);
      }
    }
  };

  const handleDownload = async (file, e) => {
    e.stopPropagation();
    if (file.downloadUrl) {
      window.open(file.downloadUrl, '_blank');
    } else {
      try {
        const response = await base44.functions.invoke('sharepoint', {
          action: 'getDownloadUrl',
          fileId: file.id
        });
        window.open(response.data.downloadUrl, '_blank');
      } catch (err) {
        console.error('Download error:', err);
      }
    }
  };

  const openInSharePoint = (file, e) => {
    e.stopPropagation();
    window.open(file.webUrl, '_blank');
  };

  const files = filesData?.files || [];

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-400" />
              SharePoint
            </h1>
            <p className="text-slate-400 mt-1">Accédez à vos fichiers SharePoint</p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="border-slate-700 bg-slate-800/50 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Rechercher des fichiers..."
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechercher'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {folderPath.map((folder, index) => (
            <React.Fragment key={folder.id}>
              {index > 0 && <span className="text-slate-500">/</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateBack(index)}
                className={`text-sm ${index === folderPath.length - 1 ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}
              >
                {folder.name}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {/* Files Grid */}
        <Card className="border-slate-700 bg-slate-800/30">
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-slate-400">Chargement des fichiers...</span>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-400 mb-4">Erreur: {error.message}</p>
                <Button onClick={() => refetch()} variant="outline">Réessayer</Button>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Ce dossier est vide</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => handleFileClick(file)}
                    className="group p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-600 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {file.type !== 'folder' && file.size && (
                            <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
                              {formatFileSize(file.size)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(file.lastModified)}
                        </p>
                      </div>
                    </div>
                    
                    {file.type !== 'folder' && (
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={(e) => handleDownload(file, e)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Télécharger
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => openInSharePoint(file, e)}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-5xl h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                {previewFile?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[calc(80vh-100px)] rounded-lg border border-slate-700"
                  title={previewFile?.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p>Prévisualisation non disponible</p>
                  <Button
                    className="mt-4"
                    onClick={() => window.open(previewFile?.webUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ouvrir dans SharePoint
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}