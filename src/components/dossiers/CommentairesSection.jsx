import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CommentairesSection({ dossierId, dossierTemporaire }) {
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [commentairesTemp, setCommentairesTemp] = useState([]);
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

  const { data: commentaires = [] } = useQuery({
    queryKey: ['commentaires', dossierId],
    queryFn: () => dossierId ? base44.entities.CommentaireDossier.filter({ dossier_id: dossierId }, '-created_date') : [],
    enabled: !!dossierId && !dossierTemporaire,
    initialData: [],
  });

  const createCommentaireMutation = useMutation({
    mutationFn: (commentaireData) => base44.entities.CommentaireDossier.create(commentaireData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', dossierId] });
      setNouveauCommentaire("");
    },
  });

  const handleSubmitCommentaire = (e) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim() || !user) return;

    if (dossierTemporaire) {
      const tempComment = {
        id: `temp-${Date.now()}`,
        contenu: nouveauCommentaire,
        utilisateur_email: user.email,
        utilisateur_nom: user.full_name,
        created_date: new Date().toISOString()
      };
      setCommentairesTemp([tempComment, ...commentairesTemp]);
      setNouveauCommentaire("");
    } else if (dossierId) {
      createCommentaireMutation.mutate({
        dossier_id: dossierId,
        contenu: nouveauCommentaire,
        utilisateur_email: user.email,
        utilisateur_nom: user.full_name
      });
    }
  };

  const getUserPhoto = (email) => {
    const foundUser = users.find(u => u.email === email);
    return foundUser?.photo_url;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleTagUser = (userEmail) => {
    setNouveauCommentaire(prev => prev + `@${userEmail} `);
  };

  const renderCommentaireContent = (contenu) => {
    const emailRegex = /@([^\s]+)/g;
    const parts = contenu.split(emailRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        const taggedUser = users.find(u => u.email === part);
        return (
          <span key={index} className="bg-blue-500/20 text-blue-400 px-1 rounded">
            @{taggedUser?.full_name || part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const allCommentaires = dossierTemporaire ? commentairesTemp : commentaires;

  return (
    <div className="h-full bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allCommentaires.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-slate-500">Aucun commentaire pour le moment</p>
              <p className="text-slate-600 text-sm mt-1">Soyez le premier à commenter</p>
            </div>
          </div>
        ) : (
          allCommentaires.map((commentaire) => (
            <div key={commentaire.id} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                {getUserPhoto(commentaire.utilisateur_email) ? (
                  <AvatarImage src={getUserPhoto(commentaire.utilisateur_email)} />
                ) : null}
                <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500">
                  {getInitials(commentaire.utilisateur_nom)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-slate-700/50 rounded-lg p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-white text-sm">{commentaire.utilisateur_nom}</span>
                  <span className="text-xs text-slate-400">
                    {format(new Date(commentaire.created_date), "dd MMM à HH:mm", { locale: fr })}
                  </span>
                </div>
                <p className="text-slate-300 text-sm whitespace-pre-wrap">
                  {renderCommentaireContent(commentaire.contenu)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-700 p-3 bg-slate-800/50 flex-shrink-0">
        <form onSubmit={handleSubmitCommentaire} className="space-y-2">
          <Textarea
            value={nouveauCommentaire}
            onChange={(e) => setNouveauCommentaire(e.target.value)}
            placeholder="Ajouter un commentaire... (utilisez @ pour taguer quelqu'un)"
            className="bg-slate-700 border-slate-600 text-white resize-none h-20"
            disabled={createCommentaireMutation.isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitCommentaire(e);
              }
            }}
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-1 flex-wrap">
              {users.slice(0, 5).map((u) => (
                <Button
                  key={u.email}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTagUser(u.email)}
                  className="text-xs text-slate-400 hover:text-white h-6 px-2"
                >
                  @{u.full_name}
                </Button>
              ))}
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!nouveauCommentaire.trim() || createCommentaireMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}