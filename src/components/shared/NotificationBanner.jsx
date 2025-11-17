
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBanner({ user }) {
  const navigate = useNavigate();
  const [visibleNotification, setVisibleNotification] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ utilisateur_email: user?.email, lue: false }, '-created_date', 1),
    initialData: [],
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    // Afficher seulement la dernière notification si elle n'a pas été dismissed
    if (notifications.length > 0 && 
        (!visibleNotification || visibleNotification.id !== notifications[0].id) &&
        !dismissedIds.has(notifications[0].id)) {
      setVisibleNotification(notifications[0]);
      
      // Supprimer la notification après 5 secondes
      setTimeout(() => {
        setVisibleNotification(null);
      }, 5000);
    }
  }, [notifications, dismissedIds, visibleNotification]);

  const handleDismiss = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { lue: true });
    setDismissedIds(prev => new Set([...prev, notificationId]));
    setVisibleNotification(null);
  };

  const handleClick = (notification) => {
    if (notification.dossier_id) {
      navigate(createPageUrl("PriseDeMandat"));
    }
    handleDismiss(notification.id);
  };

  const getColor = (type) => {
    switch (type) {
      case 'retour_appel':
        return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
      case 'dossier':
        return 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30';
      default:
        return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
    }
  };

  // Fonction pour extraire le commentaire du message
  const extractComment = (message) => {
    const lines = message.split('\n\n');
    if (lines.length === 2 && lines[1].startsWith('"') && lines[1].endsWith('"')) {
      return {
        mainMessage: lines[0],
        comment: lines[1].slice(1, -1) // Remove quotes
      };
    }
    return { mainMessage: message, comment: null };
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <AnimatePresence>
        {visibleNotification && (
          <motion.div
            key={visibleNotification.id}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`w-full bg-gradient-to-r ${getColor(visibleNotification.type)} backdrop-blur-xl border rounded-lg shadow-2xl p-4 cursor-pointer`}
            onClick={() => handleClick(visibleNotification)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-white text-sm">{visibleNotification.titre}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(visibleNotification.id);
                    }}
                    className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {(() => {
                  const { mainMessage, comment } = extractComment(visibleNotification.message);
                  return (
                    <>
                      <p className="text-sm text-slate-300 mb-2 whitespace-pre-wrap">{mainMessage}</p>
                      {comment && (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-md p-2 mb-2">
                          <p className="text-xs text-slate-400 italic whitespace-pre-wrap">{comment}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                    {visibleNotification.type === 'retour_appel' ? 'Retour d\'appel' : visibleNotification.type === 'dossier' ? 'Dossier' : 'Général'}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {format(new Date(visibleNotification.created_date), "HH:mm", { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
