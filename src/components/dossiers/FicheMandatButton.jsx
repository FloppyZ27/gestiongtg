import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
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
      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 h-8 text-xs"
    >
      <FileDown className="w-3.5 h-3.5 mr-1" />
      Fiche mandat
    </Button>
  );
}