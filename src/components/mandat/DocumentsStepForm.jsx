import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SharePointExplorer from "@/components/shared/SharePointExplorer";

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

export default function DocumentsStepForm({
  arpenteurGeometre,
  numeroDossier,
  isCollapsed,
  onToggleCollapse,
  onDocumentsChange,
  isTemporaire = false,
  clientInfo = null,
  onAddHistoriqueEntry = null,
  priseMandatId = null,
  showAllSubfolders = false
}) {

  const initials = getArpenteurInitials(arpenteurGeometre);

  let rootPath;
  if (isTemporaire && clientInfo) {
    const clientName = `${clientInfo.prenom || ''} ${clientInfo.nom || ''}`.trim() || "Client";
    const today = new Date().toISOString().split('T')[0];
    rootPath = `ARPENTEUR/${initials}/DOSSIER/TEMPORAIRE/${initials}-${clientName}-${today}/INTRANTS`;
  } else if (showAllSubfolders) {
    rootPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}`;
  } else {
    rootPath = `ARPENTEUR/${initials}/DOSSIER/${initials}-${numeroDossier}/INTRANTS`;
  }

  return (
    <Card className="border-slate-700 bg-slate-800/30">
      <CardHeader
        className="cursor-pointer hover:bg-yellow-900/40 transition-colors rounded-t-lg py-1.5 bg-yellow-900/20"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500/30 flex items-center justify-center">
              <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <CardTitle className="text-yellow-300 text-base">Documents</CardTitle>
          </div>
          {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>
      {!isCollapsed && rootPath && (
        <CardContent className="pt-2 pb-3">
          <SharePointExplorer
            rootPath={rootPath}
            maxHeight="420px"
            allowUpload={true}
            allowDelete={true}
          />
        </CardContent>
      )}
      {!isCollapsed && !rootPath && (
        <CardContent className="pt-2 pb-3">
          <p className="text-slate-500 text-xs text-center py-4">Sélectionnez un arpenteur-géomètre pour accéder aux documents</p>
        </CardContent>
      )}
    </Card>
  );
}