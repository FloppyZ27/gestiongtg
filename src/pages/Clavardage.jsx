import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageCircle, Send, Users, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function Clavardage() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date'),
    initialData: [],
    refetchInterval: 2000, // Rafraîchir toutes les 2 secondes
  });

  const createMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessage("");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    createMessageMutation.mutate({
      contenu: message,
      utilisateur_email: user.email,
      utilisateur_nom: user.full_name || user.email,
      canal: "general",
      est_lu: false
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getUserColor = (email) => {
    const colors = [
      "from-emerald-500 to-teal-500",
      "from-cyan-500 to-blue-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-green-500 to-emerald-500",
    ];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const sortedMessages = [...messages].reverse(); // Les plus anciens en haut

  const usersOnline = users.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Clavardage
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-slate-400">Discussion en équipe</p>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Users className="w-3 h-3 mr-1" />
                {usersOnline} en ligne
              </Badge>
            </div>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl h-[calc(100%-5rem)] flex flex-col">
          <CardHeader className="border-b border-slate-800 py-4">
            <CardTitle className="text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              Canal: #général
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                {sortedMessages.map((msg) => {
                  const isOwnMessage = msg.utilisateur_email === user?.email;
                  const msgUser = users.find(u => u.email === msg.utilisateur_email);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className={`w-10 h-10 flex-shrink-0 border-2 ${isOwnMessage ? 'border-emerald-500/50' : 'border-slate-700'}`}>
                        <AvatarImage src={msgUser?.photo_url} />
                        <AvatarFallback className={`text-sm bg-gradient-to-br ${getUserColor(msg.utilisateur_email)}`}>
                          {getInitials(msg.utilisateur_nom)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-semibold ${isOwnMessage ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {msg.utilisateur_nom}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(msg.created_date), "HH:mm", { locale: fr })}
                          </span>
                        </div>
                        
                        <div className="relative group">
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                : 'bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.contenu}</p>
                          </div>
                          
                          {isOwnMessage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 hover:bg-red-500/20 text-red-400 hover:text-red-300 w-6 h-6 p-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        
                        <span className="text-xs text-slate-600 mt-1">
                          {format(new Date(msg.created_date), "dd MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                
                {sortedMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-20">
                    <MessageCircle className="w-16 h-16 text-slate-700 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Aucun message</h3>
                    <p className="text-slate-400 text-center">Soyez le premier à envoyer un message !</p>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-800 p-4 bg-slate-900/50">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50"
                  disabled={createMessageMutation.isPending}
                />
                <Button
                  type="submit"
                  disabled={!message.trim() || createMessageMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </Button>
              </form>
              <p className="text-xs text-slate-500 mt-2">
                Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}