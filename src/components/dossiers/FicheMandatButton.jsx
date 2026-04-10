import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";

export default function FicheMandatButton({ formData, clients, editingDossier }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfName, setPdfName] = useState("");

  if (!editingDossier) return null;

  const handleClick = async () => {
    setLoading(true);
    const clientsData = (formData.clients_ids || []).map(id => (clients || []).find(c => c.id === id)).filter(Boolean);
    const notairesData = (formData.notaires_ids || []).map(id => (clients || []).find(c => c.id === id)).filter(Boolean);
    const res = await base44.functions.invoke('generateFicheMandat', {
      dossierData: formData,
      mandatType: formData.mandats?.[0] || {},
      clientsData,
      notairesData
    });
    setLoading(false);
    if (res.data?.pdf) {
      const base64 = res.data.pdf.split(',')[1];
      const byteChars = atob(base64);
      const byteNumbers = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteNumbers], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfData(res.data.pdf);
      setPdfUrl(url);
      setPdfName(res.data.fileName || 'fiche_mandat.pdf');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = pdfData;
    a.download = pdfName;
    a.click();
  };

  const handlePrint = () => {
    const iframe = document.getElementById('fiche-mandat-iframe');
    if (iframe) iframe.contentWindow.print();
  };

  const handleClose = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setPdfData(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{ border: '2px solid #fbbf24', color: '#fbbf24', background: 'transparent', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        Fiche mandat
      </button>

      {pdfUrl && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col" style={{ width: '85vw', height: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 flex-shrink-0">
              <span className="text-white font-semibold text-sm">{pdfName}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  style={{ border: '1px solid #64748b', color: '#94a3b8', background: 'transparent', borderRadius: '5px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Imprimer
                </button>
                <button
                  onClick={handleDownload}
                  style={{ border: '1px solid #fbbf24', color: '#fbbf24', background: 'transparent', borderRadius: '5px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Enregistrer
                </button>
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* PDF Viewer */}
            <iframe
              id="fiche-mandat-iframe"
              src={pdfUrl}
              className="flex-1 w-full rounded-b-xl"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
}