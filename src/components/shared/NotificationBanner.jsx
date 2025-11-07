import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, X, Phone, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";

export default function NotificationBanner({ user }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ utilisateur_email: user?.email, lue: false }, '-created_date', 5),
    initialData: [],
    enabled: !!user,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { lue: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleDismiss = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleClick = (notification) => {
    markAsReadMutation.mutate(notification.id);
    if (notification.dossier_id) {
      navigate(createPageUrl("PriseDeMandat"));
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'retour_appel':
        return <Phone className="w-4 h-4" />;
      case 'dossier':
        return <FolderOpen className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'retour_appel':
        return 'from-blue-500 to-cyan-500';
      case 'dossier':
        return 'from-emerald-500 to-teal-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-4 pt-4">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: index * 70 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <div 
                className={`relative overflow-hidden bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-lg shadow-xl cursor-pointer hover:shadow-2xl transition-all duration-300`}
                onClick={() => handleClick(notification)}
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getColor(notification.type)}`} />
                <div className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getColor(notification.type)} bg-opacity-20`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{notification.titre}</h4>
                        <p className="text-sm text-slate-300">{notification.message}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(notification.id);
                        }}
                        className="text-slate-400 hover:text-white hover:bg-slate-800 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {notification.type === 'retour_appel' && (
                      <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Phone className="w-3 h-3 mr-1" />
                        Retour d'appel
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}