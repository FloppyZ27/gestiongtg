import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Edit, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CommentairesSectionClient({ clientId, clientTemporaire }) {
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [commentairesTemp, setCommentairesTemp] = useState([]);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
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
    queryKey: ['commentairesClient', clientId],
    queryFn: () => clientId ? base44.entities.CommentaireClient.filter({ client_id: clientId }, '-created_date') : [],
    enabled: !!clientId && !clientTemporaire,
    initialData: [],
  });

  const createCommentaireMutation = useMutation({
    mutationFn: async (commentaireData) => {
      const newComment = await base44.entities.CommentaireClient.create(commentaireData);
      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', clientId] });
      setNouveauCommentaire("");
    },
  });

  const updateCommentaireMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CommentaireClient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', clientId] });
      setEditingCommentId(null);
      setEditingContent("");
    },
  });

  const deleteCommentaireMutation = useMutation({
    mutationFn: (id) => base44.entities.CommentaireClient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', clientId] });
    },
  });

  const handleSubmitCommentaire = (e) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim() || !user) return;

    if (clientTemporaire) {
      const tempComment = {
        id: `temp-${Date.now()}`,
        contenu: nouveauCommentaire,
        utilisateur_email: user.email,
        utilisateur_nom: user.full_name,
        created_date: new Date().toISOString()
      };
      setCommentairesTemp([tempComment, ...commentairesTemp]);
      setNouveauCommentaire("");
    } else if (clientId) {
      createCommentaireMutation.mutate({
        client_id: clientId,
        contenu: nouveauCommentaire,
        utilisateur_email: user.email,
        utilisateur_nom: user.full_name
      });
    }
  };

  const handleEditCommentaire = (commentaire) => {
    setEditingCommentId(commentaire.id);
    setEditingContent(commentaire.contenu);
  };

  const handleSaveEdit = (commentaire) => {
    if (!editingContent.trim()) return;
    
    if (clientTemporaire) {
      setCommentairesTemp(commentairesTemp.map(c => 
        c.id === commentaire.id ? { ...c, contenu: editingContent } : c
      ));
      setEditingCommentId(null);
      setEditingContent("");
    } else {
      updateCommentaireMutation.mutate({
        id: commentaire.id,
        data: { contenu: editingContent }
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleDeleteCommentaire = (commentaire) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;

    if (clientTemporaire) {
      setCommentairesTemp(commentairesTemp.filter(c => c.id !== commentaire.id));
    } else {
      deleteCommentaireMutation.mutate(commentaire.id);
    }
  };

  const getUserPhoto = (email) => {
    const foundUser = users.find(u => u.email === email);
    return foundUser?.photo_url;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const allCommentaires = clientTemporaire ? commentairesTemp : commentaires;

  return (
    <div className="h-full bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden flex flex-col m-4">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {allCommentaires.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-slate-500">Aucun commentaire pour le moment</p>
              <p className="text-slate-600 text-sm mt-1">Soyez le premier à commenter</p>
            </div>
          </div>
        ) : (
          allCommentaires.map((commentaire) => {
            const isOwnComment = commentaire.utilisateur_email === user?.email;
            const isEditing = editingCommentId === commentaire.id;

            return (
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {format(new Date(commentaire.created_date), "dd MMM à HH:mm", { locale: fr })}
                      </span>
                      {isOwnComment && !isEditing && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCommentaire(commentaire)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommentaire(commentaire)}
                            className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white text-sm min-h-[60px]"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-7 text-xs text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(commentaire)}
                          className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">
                      {commentaire.contenu}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-700 p-3 bg-slate-800/50 flex-shrink-0">
        <form onSubmit={handleSubmitCommentaire} className="space-y-2">
          <Textarea
            value={nouveauCommentaire}
            onChange={(e) => setNouveauCommentaire(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitCommentaire(e);
              }
            }}
            placeholder="Ajouter un commentaire..."
            className="bg-slate-700 border-slate-600 text-white resize-none h-20"
            disabled={createCommentaireMutation.isPending}
          />
          <div className="flex justify-end">
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