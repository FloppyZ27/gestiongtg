import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { History, FileText, User, FolderOpen, Grid3x3, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

const getActionIcon = (action) => {
  if (action.includes("DOSSIER")) return <FolderOpen className="w-4 h-4" />;
  if (action.includes("CLIENT")) return <User className="w-4 h-4" />;
  if (action.includes("LOT")) return <Grid3x3 className="w-4 h-4" />;
  if (action.includes("UTILISATEUR")) return <User className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

const getActionColor = (action) => {
  if (action.includes("CREATION")) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (action.includes("MODIFICATION")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (action.includes("SUPPRESSION")) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (action.includes("DESACTIVATION")) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (action.includes("ACTIVATION")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

const getActionLabel = (action) => {
  const labels = {
    "CREATION_DOSSIER": "Création de dossier",
    "MODIFICATION_DOSSIER": "Modification de dossier",
    "SUPPRESSION_DOSSIER": "Suppression de dossier",
    "CREATION_CLIENT": "Création de client",
    "MODIFICATION_CLIENT": "Modification de client",
    "SUPPRESSION_CLIENT": "Suppression de client",
    "CREATION_LOT": "Création de lot",
    "MODIFICATION_LOT": "Modification de lot",
    "SUPPRESSION_LOT": "Suppression de lot",
    "MODIFICATION_UTILISATEUR": "Modification d'utilisateur",
    "DESACTIVATION_UTILISATEUR": "Désactivation d'utilisateur",
    "ACTIVATION_UTILISATEUR": "Activation d'utilisateur"
  };
  return labels[action] || action;
};

export default function UserHistoryDialog({ open, onOpenChange, user, actionLogs }) {
  if (!user) return null;

  const userActions = actionLogs.filter(log => log.utilisateur_email === user.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            Historique d'activité - {user.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm text-slate-400">Total d'actions</p>
              <p className="text-2xl font-bold text-white">{userActions.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Période</p>
              <p className="text-sm text-white">
                {userActions.length > 0 
                  ? `${format(new Date(userActions[userActions.length - 1].created_date), "dd MMM yyyy", { locale: fr })} - ${format(new Date(userActions[0].created_date), "dd MMM yyyy", { locale: fr })}`
                  : "Aucune activité"
                }
              </p>
            </div>
          </div>

          {userActions.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {userActions.map((log, index) => (
                  <div 
                    key={log.id || index}
                    className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={`${getActionColor(log.action)} border text-xs`}>
                              {getActionLabel(log.action)}
                            </Badge>
                            {log.entite && (
                              <Badge variant="outline" className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                                {log.entite}
                              </Badge>
                            )}
                          </div>
                          {log.details && (
                            <p className="text-sm text-slate-300">{log.details}</p>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="text-xs text-slate-500 space-y-1">
                              {Object.entries(log.metadata).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          {format(new Date(log.created_date), "dd MMM yyyy", { locale: fr })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(log.created_date), "HH:mm", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">Aucune activité enregistrée pour cet utilisateur</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}