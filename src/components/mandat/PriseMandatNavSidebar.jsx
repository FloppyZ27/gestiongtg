import React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FolderOpen, User, Briefcase, MapPin, FileText, Receipt } from "lucide-react";
import { ClipboardList } from "lucide-react";

export default function PriseMandatNavSidebar({
  setDossierInfoStepCollapsed,
  setClientStepCollapsed,
  setProfessionnelStepCollapsed,
  setAddressStepCollapsed,
  setMandatStepCollapsed,
  setTarificationStepCollapsed,
  setDocumentsStepCollapsed,
}) {
  const sections = [
    { id: "infos", label: "Infos dossier", icon: FolderOpen, color: "text-blue-400", toggle: () => setDossierInfoStepCollapsed(false) },
    { id: "client", label: "Client", icon: User, color: "text-emerald-400", toggle: () => setClientStepCollapsed(false) },
    { id: "professionnel", label: "Professionnel", icon: Briefcase, color: "text-purple-400", toggle: () => setProfessionnelStepCollapsed(false) },
    { id: "adresse", label: "Adresse", icon: MapPin, color: "text-amber-400", toggle: () => setAddressStepCollapsed(false) },
    { id: "mandats", label: "Mandats", icon: ClipboardList, color: "text-orange-400", toggle: () => setMandatStepCollapsed(false) },
    { id: "tarification", label: "Tarification", icon: Receipt, color: "text-purple-400", toggle: () => setTarificationStepCollapsed(false) },
    { id: "documents", label: "Documents", icon: FileText, color: "text-yellow-400", toggle: () => setDocumentsStepCollapsed(false) },
  ];

  return (
    <div className="w-12 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 gap-2 flex-shrink-0">
      <TooltipProvider>
        {sections.map((section) => (
          <Tooltip key={section.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  section.toggle();
                  setTimeout(() => {
                    const el = document.querySelector(`[data-section-pm="${section.id}"]`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 50);
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-slate-800 border-slate-700 text-white text-sm">
              {section.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}