import { createPortal } from "react-dom";
import { X, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const PDF_EXTS = ['pdf'];
const TEXT_EXTS = ['txt', 'csv', 'json', 'xml', 'md', 'log'];

export default function FileViewerModal({ file, onClose }) {
  const [url, setUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ext = file?.name?.split('.').pop()?.toLowerCase() || '';
  const isImage = IMAGE_EXTS.includes(ext);
  const isPdf = PDF_EXTS.includes(ext);
  const isText = TEXT_EXTS.includes(ext);

  useEffect(() => {
    const fetchUrl = async () => {
      setLoading(true);
      setError(null);
      const response = await base44.functions.invoke('sharepoint', {
        action: 'getDownloadUrl',
        fileId: file.id
      });
      const downloadUrl = response.data?.downloadUrl;
      if (!downloadUrl) {
        setError("Impossible de récupérer le fichier.");
        setLoading(false);
        return;
      }

      if (isText) {
        const res = await fetch(downloadUrl);
        const text = await res.text();
        setTextContent(text);
      } else {
        setUrl(downloadUrl);
      }
      setLoading(false);
    };

    fetchUrl();
  }, [file.id]);

  const handleDownload = () => {
    if (url) window.open(url, '_blank');
  };

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col bg-black/90 backdrop-blur-sm"
      style={{ zIndex: 999999 }}
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white font-medium text-sm truncate max-w-[70%]">{file.name}</span>
        <div className="flex items-center gap-2">
          {url && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : isImage && url ? (
          <img
            src={url}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded shadow-2xl"
          />
        ) : isPdf && url ? (
          <iframe
            src={url}
            className="w-full h-full rounded"
            style={{ minHeight: '80vh', border: 'none' }}
            title={file.name}
          />
        ) : isText && textContent !== null ? (
          <pre className="bg-slate-900 text-slate-200 text-xs p-4 rounded w-full max-w-4xl overflow-auto whitespace-pre-wrap border border-slate-700" style={{ maxHeight: '80vh' }}>
            {textContent}
          </pre>
        ) : (
          <p className="text-slate-400 text-sm">Aperçu non disponible pour ce type de fichier.</p>
        )}
      </div>
    </div>,
    document.body
  );
}