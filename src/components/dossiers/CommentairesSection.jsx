import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Edit, Trash2, X, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

export default function CommentairesSection({ dossierId, dossierTemporaire, commentairesTemp = [], onCommentairesTempChange }) {
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);
  const mentionMenuRef = useRef(null);
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

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    initialData: [],
  });

  const createCommentaireMutation = useMutation({
    mutationFn: async (commentaireData) => {
      console.log("Creating comment:", commentaireData);
      const newComment = await base44.entities.CommentaireDossier.create(commentaireData);
      console.log("Comment created:", newComment);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: commentaireData.utilisateur_email,
        utilisateur_nom: commentaireData.utilisateur_nom,
        action: "AJOUT_COMMENTAIRE",
        entite: "CommentaireDossier",
        entite_id: newComment.id,
        details: `Ajout d'un commentaire sur un dossier`,
        metadata: {
          dossier_id: commentaireData.dossier_id
        }
      });
      
      // Détecter les tags (@email) dans le contenu et créer des notifications
      const emailRegex = /@([^\s]+)/g;
      const matches = commentaireData.contenu.match(emailRegex);
      console.log("Regex matches:", matches);
      
      if (matches) {
        const taggedEmails = matches.map(match => match.substring(1));
        const uniqueEmails = [...new Set(taggedEmails)];
        console.log("Tagged emails:", uniqueEmails);
        console.log("All users:", users);
        console.log("Current user:", user);
        
        // Obtenir le dossier pour extraire les informations
        const dossier = dossiers.find(d => d.id === dossierId);
        const getArpenteurInitials = (arpenteur) => {
          if (!arpenteur) return "";
          const mapping = {
            "Samuel Guay": "SG-",
            "Dany Gaboury": "DG-",
            "Pierre-Luc Pilote": "PLP-",
            "Benjamin Larouche": "BL-",
            "Frédéric Gilbert": "FG-"
          };
          return mapping[arpenteur] || "";
        };
        
        const numeroDossierComplet = dossier ? `${getArpenteurInitials(dossier.arpenteur_geometre)}${dossier.numero_dossier}` : '';
        
        const clientsNames = dossier?.clients_ids?.map(cid => {
          const client = clients.find(c => c.id === cid);
          return client ? `${client.prenom} ${client.nom}` : "";
        }).filter(n => n).join(", ");
        
        // Nettoyer le commentaire en enlevant les @mentions
        let commentaireNettoye = commentaireData.contenu.replace(/@([^\s]+)/g, '').trim();
        // Tronquer le commentaire à 100 caractères
        const commentaireTronque = commentaireNettoye.length > 100 
          ? commentaireNettoye.substring(0, 100) + "..." 
          : commentaireNettoye;
        
        for (const email of uniqueEmails) {
          console.log(`Processing email: ${email}`);
          const taggedUser = users.find(u => u.email === email);
          console.log(`Found user for ${email}:`, taggedUser);
          if (taggedUser) {
            console.log("Creating notification for:", email);
            const notification = await base44.entities.Notification.create({
              utilisateur_email: email,
              titre: "Vous avez été mentionné dans un commentaire",
              message: `${user?.full_name} vous a mentionné dans un commentaire sur le dossier ${numeroDossierComplet}${clientsNames ? ` - ${clientsNames}` : ''}.\n\n"${commentaireTronque}"`,
              type: "dossier",
              dossier_id: dossierId,
              lue: false
            });
            console.log("Notification created:", notification);
          } else {
            console.log(`No user found for email: ${email}`);
          }
        }
      } else {
        console.log("No @ mentions found in comment");
      }
      
      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', dossierId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setNouveauCommentaire("");
      setShowMentionMenu(false);
      setMentionSearch("");
    },
  });

  const updateCommentaireMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const result = await base44.entities.CommentaireDossier.update(id, data);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: "MODIFICATION_COMMENTAIRE",
        entite: "CommentaireDossier",
        entite_id: id,
        details: `Modification d'un commentaire`,
        metadata: {
          dossier_id: dossierId
        }
      });
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', dossierId] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
      setEditingCommentId(null);
      setEditingContent("");
    },
  });

  const deleteCommentaireMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.CommentaireDossier.delete(id);
      
      // Log l'action
      await base44.entities.ActionLog.create({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        action: "SUPPRESSION_COMMENTAIRE",
        entite: "CommentaireDossier",
        entite_id: id,
        details: `Suppression d'un commentaire`,
        metadata: {
          dossier_id: dossierId
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', dossierId] });
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    },
  });

  // Filtrer les utilisateurs pour la mention
  const filteredUsersForMention = users.filter(u => 
    (u.full_name?.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(mentionSearch.toLowerCase()))
  ).slice(0, 5);

  // Debug
  useEffect(() => {
    console.log("showMentionMenu:", showMentionMenu);
    console.log("mentionSearch:", mentionSearch);
    console.log("filteredUsersForMention:", filteredUsersForMention);
  }, [showMentionMenu, mentionSearch, filteredUsersForMention]);

  // Gérer le changement de texte et détecter @
  const handleTextChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNouveauCommentaire(value);
    setCursorPosition(cursorPos);

    console.log("Text changed:", value, "cursor:", cursorPos);

    // Chercher le dernier @ avant le curseur
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    console.log("Last @ index:", lastAtIndex);
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      console.log("Text after @:", textAfterAt);
      // Only show mention menu if there's no space or newline between @ and current cursor,
      // and if there's text after @ (or it's just '@')
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        console.log("Showing mention menu with search:", textAfterAt);
        setMentionSearch(textAfterAt);
        setShowMentionMenu(true);
        setSelectedMentionIndex(0); // Reset selection when search changes
      } else {
        console.log("Hiding mention menu - space or newline found");
        setShowMentionMenu(false);
        setMentionSearch("");
      }
    } else {
      console.log("No @ found");
      setShowMentionMenu(false);
      setMentionSearch("");
    }
  };

  // Gérer les touches du clavier dans le menu de mention
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

  // Sélectionner un utilisateur
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
    
    // Remettre le focus sur le textarea et positionner le curseur
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = lastAtIndex + selectedUser.email.length + 2; // +1 for @, +1 for space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Close mention menu when clicking outside
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
    if (!nouveauCommentaire.trim() || !user) return;

    if (dossierTemporaire) {
      const tempComment = {
        id: `temp-${Date.now()}`,
        contenu: nouveauCommentaire,
        utilisateur_email: user.email,
        utilisateur_nom: user.full_name,
        created_date: new Date().toISOString()
      };
      // Use the provided callback to update temporary comments in the parent
      if (onCommentairesTempChange) {
        onCommentairesTempChange([tempComment, ...commentairesTemp]);
      }
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

  const handleEditCommentaire = (commentaire) => {
    setEditingCommentId(commentaire.id);
    setEditingContent(commentaire.contenu);
  };

  const handleSaveEdit = (commentaire) => {
    if (!editingContent.trim()) return;
    
    if (dossierTemporaire) {
      // Use the provided callback to update temporary comments in the parent
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
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;

    if (dossierTemporaire) {
      // Use the provided callback to update temporary comments in the parent
      if (onCommentairesTempChange) {
        onCommentairesTempChange(commentairesTemp.filter(c => c.id !== commentaire.id));
      }
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

  const renderCommentaireContent = (contenu) => {
    // Gérer les mentions (@ au début d'un mot, pas dans une adresse email)
    const emailRegex = /(^|[\s\n])@([^\s]+)/g;
    let processedContent = contenu.replace(emailRegex, (match, prefix, email) => {
      const taggedUser = users.find(u => u.email === email);
      return `${prefix}<span class="bg-blue-500/20 text-blue-400 px-1 rounded">@${taggedUser?.full_name || email}</span>`;
    });

    return (
      <div 
        className="prose prose-invert prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br/>') }}
      />
    );
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
                    <div className="text-slate-300 text-sm">
                      {renderCommentaireContent(commentaire.contenu)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-slate-700 p-3 bg-slate-800/50 flex-shrink-0 relative">
        {/* Menu d'autocomplétion */}
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
                // If mention menu is active and has suggestions, handle navigation/selection
                handleMentionKeyDown(e);
              } else if (e.key === 'Enter' && !e.shiftKey) {
                // Otherwise, if Enter (without Shift) is pressed, submit the form
                e.preventDefault();
                handleSubmitCommentaire(e);
              }
            }}
            placeholder="Ajouter un commentaire... (tapez @ pour mentionner)"
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