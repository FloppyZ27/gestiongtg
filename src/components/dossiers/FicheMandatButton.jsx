import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function FicheMandatButton({ formData, clients, editingDossier }) {
  if (!editingDossier) return null;

  const handleClick = async () => {
    const clientsData = (formData.clients_ids || []).map(id => (clients || []).find(c => c.id === id)).filter(Boolean);
    const notairesData = (formData.notaires_ids || []).map(id => (clients || []).find(c => c.id === id)).filter(Boolean);
    const res = await base44.functions.invoke('generateFicheMandat', {
      dossierData: formData,
      mandatType: formData.mandats?.[0] || {},
      clientsData,
      notairesData
    });
    if (res.data?.pdf) {
      const a = document.createElement('a');
      a.href = res.data.pdf;
      a.download = res.data.fileName || 'fiche_mandat.pdf';
      a.click();
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      className="bg-transparent hover:bg-amber-500/10 text-amber-400 border border-amber-500/50 h-8 text-xs px-3 rounded"
    >
      Fiche mandat
    </Button>
  );
}