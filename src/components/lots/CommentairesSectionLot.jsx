import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Edit, Trash2, X, Check, Mic, Square, Loader2, Image } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CommentairesSectionLot({ lotId, lotTemporaire, commentairesTemp = [], onCommentairesTempChange }) {
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const imageInputRef = useRef(null);
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
    queryKey: ['commentairesLot', lotId],
    queryFn: () => lotId ? base44.entities.CommentaireLot.filter({ lot_id: lotId }, '-created_date') : [],
    enabled: !!lotId && !lotTemporaire,
    initialData: [],
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setIsUploadingAudio(true);
        
        try {
          const response = await base44.integrations.Core.UploadFile({ file: audioFile });
          setAudioUrl(response.file_url);
        } catch (error) {
          console.error("Erreur lors de l'upload de l'audio:", error);
          alert("Erreur lors de l'upload de l'audio: " + error.message);
        } finally {
          setIsUploadingAudio(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(response.file_url);
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error);
      alert("Erreur lors de l'upload de l'image: " + error.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const createCommentaireMutation = useMutation({
    mutationFn: (commentaireData) => base44.entities.CommentaireLot.create(commentaireData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesLot', lotId] });
      setNouveauCommentaire("");
      setAudioUrl("");
    },
  });

  const updateCommentaireMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CommentaireLot.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesLot', lotId] });
      setEditingCommentId(null);
      setEditingContent("");
    },
  });

  const deleteCommentaireMutation = useMutation({
    mutationFn: (id) => base44.entities.CommentaireLot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesLot', lotId] });
    },
  });

  const handleSubmitCommentaire = (e) => {
    e.preventDefault();
    if ((!nouveauCommentaire.trim() && !audioUrl && !imageUrl) || !user) return;

    let contenu = nouveauCommentaire;
    if (audioUrl) contenu += `\n[AUDIO:${audioUrl}]`;
    if (imageUrl) contenu += `\n[IMAGE:${imageUrl}]`;

    const commentData = {
      contenu,
      utilisateur_email: user.email,
      utilisateur_nom: user.full_name
    };

    if (lotTemporaire) {
      const tempComment = {
        id: `temp-${Date.now()}`,
        ...commentData,
        created_date: new Date().toISOString()
      };
      if (onCommentairesTempChange) {
        onCommentairesTempChange([tempComment, ...commentairesTemp]);
      }
      setNouveauCommentaire("");
      setAudioUrl("");
      setImageUrl("");
    } else if (lotId) {
      createCommentaireMutation.mutate({
        lot_id: lotId,
        ...commentData
      });
      setAudioUrl("");
      setImageUrl("");
    }
  };

  const handleEditCommentaire = (commentaire) => {
    setEditingCommentId(commentaire.id);
    setEditingContent(commentaire.contenu);
  };

  const handleSaveEdit = (commentaire) => {
    if (!editingContent.trim()) return;
    
    if (lotTemporaire) {
      if (onCommentairesTempChange) {
        onCommentairesTempChange(commentairesTemp.map(c => 
          c.id === commentaire.id ? { ...c, contenu: editingContent } : c
        ));
      }
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
    setCommentToDelete(commentaire);
  };

  const confirmDelete = () => {
    if (!commentToDelete) return;

    if (lotTemporaire) {
      if (onCommentairesTempChange) {
        onCommentairesTempChange(commentairesTemp.filter(c => c.id !== commentToDelete.id));
      }
    } else {
      deleteCommentaireMutation.mutate(commentToDelete.id);
    }
    setCommentToDelete(null);
  };

  const getUserPhoto = (email) => {
    const foundUser = users.find(u => u.email === email);
    return foundUser?.photo_url;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const allCommentaires = lotTemporaire ? commentairesTemp : commentaires;

  return (
    <>
    <div className="h-full bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 pr-2 space-y-3">
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
              <div key={commentaire.id} className="space-y-2 pr-2">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    {getUserPhoto(commentaire.utilisateur_email) ? (
                      <AvatarImage src={getUserPhoto(commentaire.utilisateur_email)} />
                    ) : null}
                    <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500">
                      {getInitials(commentaire.utilisateur_nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex justify-between items-center">
                    <span className="font-semibold text-white text-sm">{commentaire.utilisateur_nom}</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(commentaire.created_date), "dd MMM à HH:mm", { locale: fr })}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
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
                    <>
                      {(() => {
                        const audioMatch = commentaire.contenu.match(/\[AUDIO:([^\]]+)\]/);
                        const audioFileUrl = audioMatch ? audioMatch[1] : null;
                        const imageMatch = commentaire.contenu.match(/\[IMAGE:([^\]]+)\]/);
                        const imageFileUrl = imageMatch ? imageMatch[1] : null;
                        const textContent = commentaire.contenu.replace(/\[AUDIO:[^\]]+\]/g, '').replace(/\[IMAGE:[^\]]+\]/g, '').trim();

                        return (
                          <div className="space-y-2">
                            {textContent && (
                              <p className="text-slate-300 text-sm whitespace-pre-wrap">
                                {textContent}
                              </p>
                            )}
                            {imageFileUrl && (
                              <img src={imageFileUrl} alt="Image du commentaire" className="max-w-full h-auto rounded-lg" />
                            )}
                            {audioFileUrl && (
                              <audio controls className="w-full h-8" style={{ maxHeight: '32px' }}>
                                <source src={audioFileUrl} type="audio/webm" />
                                Votre navigateur ne supporte pas l'audio.
                              </audio>
                            )}
                          </div>
                        );
                      })()}
                      {isOwnComment && (
                        <div className="flex gap-1 justify-end mt-2">
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
                    </>
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
            disabled={createCommentaireMutation.isPending || isRecording || isUploadingImage}
          />
          {imageUrl && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex-1">
                <p className="text-xs text-blue-400 mb-1">Image prête</p>
                <img src={imageUrl} alt="Preview" className="max-w-full h-auto rounded max-h-32" />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setImageUrl("")}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          {audioUrl && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex-1">
                <p className="text-xs text-emerald-400 mb-1">Enregistrement audio prêt</p>
                <audio controls className="w-full h-8" style={{ maxHeight: '32px' }}>
                  <source src={audioUrl} type="audio/webm" />
                </audio>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAudioUrl("")}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage || imageUrl}
                className="bg-slate-700 border-slate-600"
              >
                <Image className="w-4 h-4 mr-2" />
                Image
              </Button>
              {!isRecording ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startRecording}
                  disabled={isUploadingAudio || audioUrl}
                  className="bg-slate-700 border-slate-600"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Audio
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={stopRecording}
                  className="bg-red-500/20 border-red-500 text-red-400"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Arrêter
                </Button>
              )}
              {(isUploadingAudio || isUploadingImage) && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Upload...
                </div>
              )}
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={(!nouveauCommentaire.trim() && !audioUrl && !imageUrl) || createCommentaireMutation.isPending || isRecording || isUploadingAudio || isUploadingImage}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/50"
            >
              <Send className="w-4 h-4 mr-2" />
              Distribuer
            </Button>
          </div>
        </form>
      </div>
    </div>

    {/* Dialog de confirmation de suppression */}
    <Dialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
      <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
        <DialogHeader>
          <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span>
            Attention
            <span className="text-2xl">⚠️</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-slate-300 text-center">
            Êtes-vous sûr de vouloir supprimer ce commentaire ?
          </p>
          <div className="flex justify-center gap-3 pt-4">
            <Button 
              type="button" 
              onClick={() => setCommentToDelete(null)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
            >
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}