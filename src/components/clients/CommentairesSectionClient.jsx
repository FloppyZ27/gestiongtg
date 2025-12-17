import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Edit, Trash2, X, Check, Mic, Square, Loader2, Image } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CommentairesSectionClient({ clientId, clientTemporaire, commentairesTemp = [], onCommentairesTempChange }) {
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [mentionSearch, setMentionSearch] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const textareaRef = useRef(null);
  const mentionMenuRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
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

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
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
    mutationFn: async (commentaireData) => {
      const newComment = await base44.entities.CommentaireClient.create(commentaireData);
      
      // Détecter les tags (@email) dans le contenu et créer des notifications
      const emailRegex = /@([^\s]+)/g;
      const matches = commentaireData.contenu.match(emailRegex);
      
      if (matches) {
        const taggedEmails = matches.map(match => match.substring(1));
        const uniqueEmails = [...new Set(taggedEmails)];
        
        // Obtenir le client pour extraire les informations
        const client = clients.find(c => c.id === clientId);
        const clientNom = client ? `${client.prenom} ${client.nom}` : '';
        
        // Nettoyer le commentaire en enlevant les @mentions
        let commentaireNettoye = commentaireData.contenu.replace(/@([^\s]+)/g, '');
        // Tronquer le commentaire à 100 caractères
        const commentaireTronque = commentaireNettoye.length > 100 
          ? commentaireNettoye.substring(0, 100) + "..." 
          : commentaireNettoye;
        
        for (const email of uniqueEmails) {
          const taggedUser = users.find(u => u.email === email);
          if (taggedUser) {
            await base44.entities.Notification.create({
              utilisateur_email: email,
              titre: "Vous avez été mentionné dans un commentaire",
              message: `${user?.full_name} vous a mentionné dans un commentaire sur la fiche client${clientNom ? ` ${clientNom}` : ''}.\n\n"${commentaireTronque}"`,
              type: "general",
              lue: false
            });
          }
        }
      }
      
      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', clientId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setNouveauCommentaire("");
      setShowMentionMenu(false);
      setMentionSearch("");
    },
  });

  const updateCommentaireMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await base44.entities.CommentaireClient.update(id, data);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: "MODIFICATION_COMMENTAIRE_CLIENT",
        entite: "CommentaireClient",
        entite_id: id,
        details: `Modification d'un commentaire sur un client`,
        metadata: {
          client_id: clientId
        }
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', clientId] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setEditingCommentId(null);
      setEditingContent("");
    },
  });

  const deleteCommentaireMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.CommentaireClient.delete(id);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: "SUPPRESSION_COMMENTAIRE_CLIENT",
        entite: "CommentaireClient",
        entite_id: id,
        details: `Suppression d'un commentaire sur un client`,
        metadata: {
          client_id: clientId
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', clientId] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    },
  });

  const filteredUsersForMention = users.filter(u => 
    (u.full_name?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(mentionSearch.toLowerCase()))
  ).slice(0, 5);

  const handleTextChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNouveauCommentaire(value);
    setCursorPosition(cursorPos);

    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionSearch(textAfterAt);
        setShowMentionMenu(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentionMenu(false);
        setMentionSearch("");
      }
    } else {
      setShowMentionMenu(false);
      setMentionSearch("");
    }
  };

  const handleMentionKeyDown = (e) => {
    if (!showMentionMenu || filteredUsersForMention.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        Math.min(prev + 1, filteredUsersForMention.length - 1)
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filteredUsersForMention[selectedMentionIndex]) {
        selectUser(filteredUsersForMention[selectedMentionIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentionMenu(false);
    }
  };

  const selectUser = (selectedUser) => {
    const textBeforeCursor = nouveauCommentaire.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = nouveauCommentaire.substring(cursorPosition);
    
    const newText = 
      nouveauCommentaire.substring(0, lastAtIndex) + 
      `@${selectedUser.email} ` + 
      textAfterCursor;
    
    setNouveauCommentaire(newText);
    setShowMentionMenu(false);
    setMentionSearch("");
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtIndex + selectedUser.email.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowMentionMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    if (clientTemporaire) {
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
    } else if (clientId) {
      createCommentaireMutation.mutate({
        client_id: clientId,
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
    
    if (clientTemporaire) {
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

    if (clientTemporaire) {
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

  const renderCommentaireContent = (contenu) => {
    // Extraire l'URL audio si présente
    const audioMatch = contenu.match(/\[AUDIO:([^\]]+)\]/);
    const audioFileUrl = audioMatch ? audioMatch[1] : null;
    let textContent = contenu.replace(/\[AUDIO:[^\]]+\]/g, '').trim();

    const emailRegex = /@([^\s]+)/g;
    const parts = textContent.split(emailRegex);
    
    return (
      <div className="space-y-2">
        {textContent && (
          <div>
            {parts.map((part, index) => {
              if (index % 2 === 1) {
                const taggedUser = users.find(u => u.email === part);
                return (
                  <span key={index} className="bg-blue-500/20 text-blue-400 px-1 rounded">
                    @{taggedUser?.full_name || part}
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
        )}
        {audioFileUrl && (
          <audio controls className="w-full h-8" style={{ maxHeight: '32px' }}>
            <source src={audioFileUrl} type="audio/webm" />
            Votre navigateur ne supporte pas l'audio.
          </audio>
        )}
      </div>
    );
  };

  const allCommentaires = clientTemporaire ? commentairesTemp : commentaires;

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
            const hasMedia = commentaire.contenu.includes('[AUDIO:') || commentaire.contenu.includes('[IMAGE:');

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
                      <p className="text-slate-300 text-sm whitespace-pre-wrap">
                        {renderCommentaireContent(commentaire.contenu)}
                      </p>
                      {isOwnComment && (
                        <div className="flex gap-1 justify-end mt-2">
                          {!hasMedia && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCommentaire(commentaire)}
                              className="h-6 w-6 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
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

      <div className="border-t border-slate-700 p-3 bg-slate-800/50 flex-shrink-0 relative">
        {showMentionMenu && (
          <div 
            ref={mentionMenuRef}
            className="absolute bottom-full left-3 right-3 mb-2 bg-slate-800 border-2 border-emerald-500 rounded-lg shadow-2xl overflow-hidden z-[9999]"
          >
            <div className="p-2 text-xs text-slate-400 border-b border-slate-700 bg-slate-900">
              Mentionner quelqu'un ({filteredUsersForMention.length} résultat{filteredUsersForMention.length > 1 ? 's' : ''})
            </div>
            {filteredUsersForMention.length > 0 ? (
              <div className="overflow-y-auto max-h-60">
                {filteredUsersForMention.map((u, index) => (
                  <div
                    key={u.email}
                    className={`px-3 py-2 cursor-pointer transition-colors flex items-center gap-2 ${
                      index === selectedMentionIndex 
                        ? 'bg-emerald-500/30 text-emerald-400' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => selectUser(u)}
                    onMouseEnter={() => setSelectedMentionIndex(index)}
                  >
                    <Avatar className="w-6 h-6">
                      {u.photo_url ? <AvatarImage src={u.photo_url} /> : null}
                      <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500">
                        {getInitials(u.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmitCommentaire} className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={nouveauCommentaire}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (showMentionMenu && filteredUsersForMention.length > 0) {
                handleMentionKeyDown(e);
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitCommentaire(e);
              }
            }}
            placeholder="Ajouter un commentaire... (tapez @ pour mentionner)"
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
                size="icon"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage || imageUrl}
                className="h-8 w-8 p-0 text-slate-400 hover:text-blue-400"
              >
                <Image className="w-5 h-5" />
              </Button>
              {!isRecording ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={startRecording}
                  disabled={isUploadingAudio || audioUrl}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400"
                >
                  <Mic className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={stopRecording}
                  className="h-8 w-8 p-0 text-red-400 hover:text-red-500"
                >
                  <Square className="w-5 h-5" />
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

    {/* Dialog pour l'image en plein écran */}
    <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
      <DialogContent className="border-none max-w-[90vw] max-h-[90vh] p-2" style={{ background: 'none' }}>
        <img 
          src={fullscreenImage} 
          alt="Image en plein écran" 
          className="w-full h-full object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
    </>
  );
}