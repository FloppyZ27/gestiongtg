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
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ utilisateur_email: user?.email, lue: false }, '-created_date', 3),
    initialData: [],
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    // Quand de nouvelles notifications arrivent, les ajouter à visibleNotifications
    const newNotifications = notifications.filter(
      notif => !visibleNotifications.find(v => v.id === notif.id)
    );
    
    if (newNotifications.length > 0) {
      setVisibleNotifications(prev => [...newNotifications, ...prev].slice(0, 3));
      
      // Supprimer chaque notification après 5 secondes
      newNotifications.forEach(notif => {
        setTimeout(() => {
          setVisibleNotifications(prev => prev.filter(n => n.id !== notif.id));
        }, 5000);
      });
    }
  }, [notifications]);

  const handleDismiss = (notificationId) => {
    setVisibleNotifications(prev => prev.filter(n => n.id !== notificationId));
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

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <AnimatePresence>
        {visibleNotifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: index * 80, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className={`absolute w-full bg-gradient-to-r ${getColor(notification.type)} backdrop-blur-xl border rounded-lg shadow-2xl p-4 cursor-pointer`}
            onClick={() => handleClick(notification)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-white text-sm">{notification.titre}</h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(notification.id);
                    }}
                    className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-300 mb-2">{notification.message}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                    {notification.type === 'retour_appel' ? 'Retour d\'appel' : notification.type === 'dossier' ? 'Dossier' : 'Général'}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {format(new Date(notification.created_date), "HH:mm", { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}