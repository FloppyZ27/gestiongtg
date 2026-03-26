import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import CommentairesSection from "../dossiers/CommentairesSection";

export default function PriseMandatSidebar({
  workAddress,
  mapCollapsed,
  setMapCollapsed,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarTab,
  setSidebarTab,
  editingDossier,
  commentairesTemporaires,
  setCommentairesTemporaires,
  historique,
}) {
  return (
    <div className="flex-[0_0_30%] flex flex-col overflow-hidden">
      {/* Carte de l'adresse des travaux - Collapsible */}
      <div
        className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
        onClick={() => setMapCollapsed(!mapCollapsed)}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-slate-400" />
          <h3 className="text-slate-300 text-base font-semibold">Carte</h3>
        </div>
        {mapCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </div>
      {!mapCollapsed && (workAddress.rue || workAddress.ville) && (
        <div className="p-4 border-b border-slate-800 flex-shrink-0 max-h-[25%]">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden h-full">
            <div className="aspect-square w-full max-h-[calc(100%-28px)]">
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(
                  `${workAddress.numeros_civiques?.[0] || ''} ${workAddress.rue || ''}, ${workAddress.ville || ''}, ${workAddress.province || 'Québec'}, Canada`
                )}&zoom=15`}
              />
            </div>
            <div className="p-2 bg-slate-800/80">
              <p className="text-xs text-slate-300 truncate">
                📍 {workAddress.numeros_civiques?.[0]} {workAddress.rue}, {workAddress.ville}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Tabs Commentaires/Historique - Collapsible */}
      <div
        className="cursor-pointer hover:bg-slate-800/50 transition-colors py-1.5 px-4 border-b border-slate-800 flex-shrink-0 flex items-center justify-between"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        <div className="flex items-center gap-2">
          {sidebarTab === "commentaires" ? <MessageSquare className="w-5 h-5 text-slate-400" /> : <Clock className="w-5 h-5 text-slate-400" />}
          <h3 className="text-slate-300 text-base font-semibold">
            {sidebarTab === "commentaires" ? "Commentaires" : "Historique"}
          </h3>
        </div>
        {sidebarCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
      </div>

      {!sidebarCollapsed && (
        <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 h-9 mx-4 mr-6 mt-2 flex-shrink-0 bg-transparent gap-2">
            <TabsTrigger value="commentaires" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
              <MessageSquare className="w-4 h-4 mr-1" />
              Commentaires
            </TabsTrigger>
            <TabsTrigger value="historique" className="text-xs bg-transparent border-none data-[state=active]:text-emerald-400 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 data-[state=inactive]:text-slate-400 hover:text-emerald-300">
              <Clock className="w-4 h-4 mr-1" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commentaires" className="flex-1 overflow-hidden p-4 pr-6 mt-0">
            <CommentairesSection
              dossierId={editingDossier?.id}
              dossierTemporaire={!editingDossier}
              commentairesTemp={commentairesTemporaires}
              onCommentairesTempChange={setCommentairesTemporaires}
            />
          </TabsContent>

          <TabsContent value="historique" className="flex-1 overflow-y-auto p-4 pr-6 mt-0">
            {historique.length > 0 ? (
              <div className="space-y-2">
                {historique.map((entry, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{entry.action}</p>
                        {entry.details && (
                          <p className="text-slate-400 text-xs mt-1 break-words">{entry.details}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
                          <span className="text-emerald-400">{entry.utilisateur_nom}</span>
                          <span>•</span>
                          <span>{format(new Date(entry.date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500">Aucune action enregistrée</p>
                  <p className="text-slate-600 text-sm mt-1">L'historique apparaîtra ici</p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}