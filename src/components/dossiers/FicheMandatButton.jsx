import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Download, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FicheMandatButton({ formData, clients, editingDossier, entreesTemps }) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [pdfName, setPdfName] = useState("");

  if (!editingDossier) return null;

  const handleClick = async () => {
    setLoading(true);
    // Récupérer les données fraîches de tous les clients depuis la base de données
    const allClientIds = [
      ...(formData.clients_ids || []),
      ...(formData.notaires_ids || []),
      ...(formData.courtiers_ids || [])
    ].filter((id, i, arr) => arr.indexOf(id) === i);
    
    // Utiliser directement les données clients déjà chargées (elles contiennent tous les champs dont 'type')
    const getClient = (id) => (clients || []).find(c => c.id === id);
    
    const clientsData   = (formData.clients_ids   || []).map(getClient).filter(Boolean);
    const notairesData  = (formData.notaires_ids  || []).map(getClient).filter(Boolean);
    const courtiersData = (formData.courtiers_ids || []).map(getClient).filter(Boolean);

    const res = await base44.functions.invoke('generateFicheMandat', {
      dossierData: formData,
      clientsData,
      notairesData,
      courtiersData,
      entreesTempsData: entreesTemps || [],
    });
    setLoading(false);

    if (res.data?.pdf) {
      const base64 = res.data.pdf.split(',')[1];
      const byteChars = atob(base64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfData(res.data.pdf);
      setPdfUrl(url);
      setPdfName(res.data.fileName || 'fiche_dossier.pdf');
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
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '6px',
          border: '1.5px solid #f59e0b',
          background: 'rgba(245,158,11,0.10)',
          color: '#f59e0b',
          fontSize: '12px',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.2s',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.22)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.10)'; }}
      >
        {loading
          ? <Loader2 style={{width:13,height:13}} className="animate-spin" />
          : <FileText style={{width:13,height:13}} />
        }
        {loading ? 'Génération…' : 'Fiche dossier PDF'}
      </button>

      {pdfUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="flex flex-col rounded-xl shadow-2xl overflow-hidden"
            style={{ width: '88vw', height: '92vh', background: '#0f172a', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between flex-shrink-0 px-5 py-2.5"
              style={{ background: '#06122a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <FileText style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{pdfName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:5, border:'1px solid #475569', background:'transparent', color:'#94a3b8', fontSize:12, cursor:'pointer' }}
                >
                  <Printer style={{width:13,height:13}} /> Imprimer
                </button>
                <button
                  onClick={handleDownload}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:5, border:'1.5px solid #f59e0b', background:'rgba(245,158,11,0.10)', color:'#f59e0b', fontSize:12, fontWeight:600, cursor:'pointer' }}
                >
                  <Download style={{width:13,height:13}} /> Enregistrer
                </button>
                <button
                  onClick={handleClose}
                  style={{ padding:'4px', borderRadius:5, border:'none', background:'transparent', color:'#64748b', cursor:'pointer', display:'flex' }}
                >
                  <X style={{width:18,height:18}} />
                </button>
              </div>
            </div>
            {/* PDF Viewer */}
            <iframe
              id="fiche-mandat-iframe"
              src={pdfUrl}
              className="flex-1 w-full"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}
    </>
  );
}