import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Settings, Calendar, Cake, UserX, BarChart, MessageSquare, ThumbsUp, MessageCircle, Smile, TrendingUp, X, Home, FileText, Users, FolderOpen, Search, Compass } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const ICONS_MAP = {
  Home, FileText, Users, Calendar, FolderOpen, Search, Settings, BarChart, MessageSquare, Compass, Plus
};

export default function TableauDeBord() {
  const [isEditRaccourcisOpen, setIsEditRaccourcisOpen] = useState(false);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPostType, setNewPostType] = useState("post");
  const [newPostContent, setNewPostContent] = useState("");
  const [newSondageQuestion, setNewSondageQuestion] = useState("");
  const [sondageOptions, setSondageOptions] = useState(["", ""]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: raccourcis = [] } = useQuery({
    queryKey: ['raccourcis', user?.email],
    queryFn: () => base44.entities.RaccourciUtilisateur.filter({ utilisateur_email: user?.email }, 'ordre'),
    initialData: [],
    enabled: !!user,
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list(),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['postsClubSocial'],
    queryFn: () => base44.entities.PostClubSocial.list('-created_date', 20),
    initialData: [],
  });

  const { data: rendezvous = [] } = useQuery({
    queryKey: ['rendezvous'],
    queryFn: () => base44.entities.RendezVous.list(),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.PostClubSocial.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postsClubSocial'] });
      setIsNewPostOpen(false);
      setNewPostContent("");
      setNewSondageQuestion("");
      setSondageOptions(["", ""]);
      setNewPostType("post");
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PostClubSocial.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postsClubSocial'] });
    },
  });

  const today = new Date();
  const mandatsAujourdhui = dossiers.filter(dossier => {
    return dossier.mandats?.some(mandat => {
      if (mandat.utilisateur_assigne !== user?.email) return false;
      if (!mandat.date_livraison) return false;
      return isSameDay(new Date(mandat.date_livraison), today);
    });
  });

  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const anniversairesDuMois = users.filter(u => {
    if (!u.date_naissance) return false;
    const birthDate = new Date(u.date_naissance);
    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    return isWithinInterval(thisYearBirthday, { start: monthStart, end: monthEnd });
  }).sort((a, b) => {
    const dateA = new Date(a.date_naissance);
    const dateB = new Date(b.date_naissance);
    return dateA.getDate() - dateB.getDate();
  });

  const hasAnniversaireAujourdhui = anniversairesDuMois.some(u => {
    const birthDate = new Date(u.date_naissance);
    return isSameDay(new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()), today);
  });

  const absencesAujourdhui = rendezvous.filter(rdv => 
    rdv.type === 'absence' && 
    rdv.date_debut && 
    isSameDay(new Date(rdv.date_debut), today)
  );

  const handleRaccourciClick = (raccourci) => {
    if (raccourci.action_type === 'page') {
      navigate(createPageUrl(raccourci.action_cible));
    } else if (raccourci.action_type === 'externe') {
      window.open(raccourci.action_cible, '_blank');
    }
  };

  const handleCreatePost = () => {
    if (newPostType === 'post') {
      createPostMutation.mutate({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        contenu: newPostContent,
        type: 'post',
        reactions: [],
        commentaires: []
      });
    } else {
      createPostMutation.mutate({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        type: 'sondage',
        sondage_question: newSondageQuestion,
        sondage_options: sondageOptions.filter(o => o).map(option => ({
          option,
          votes: []
        })),
        reactions: [],
        commentaires: []
      });
    }
  };

  const handleReaction = (post, emoji) => {
    const existingReactions = post.reactions || [];
    const userReaction = existingReactions.find(r => r.utilisateur_email === user?.email);
    
    let newReactions;
    if (userReaction && userReaction.emoji === emoji) {
      newReactions = existingReactions.filter(r => r.utilisateur_email !== user?.email);
    } else if (userReaction) {
      newReactions = existingReactions.map(r => 
        r.utilisateur_email === user?.email ? { ...r, emoji } : r
      );
    } else {
      newReactions = [...existingReactions, { utilisateur_email: user?.email, emoji }];
    }

    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, reactions: newReactions }
    });
  };

  const handleVote = (post, optionIndex) => {
    const newOptions = post.sondage_options.map((opt, idx) => {
      if (idx === optionIndex) {
        const votes = opt.votes || [];
        if (votes.includes(user?.email)) {
          return { ...opt, votes: votes.filter(v => v !== user?.email) };
        } else {
          return { ...opt, votes: [...votes, user?.email] };
        }
      } else {
        return { ...opt, votes: (opt.votes || []).filter(v => v !== user?.email) };
      }
    });

    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, sondage_options: newOptions }
    });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <BarChart className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Bonjour, {user?.full_name?.split(' ')[0]}
              </h1>
              <p className="text-slate-400">Votre tableau de bord personnalisé</p>
            </div>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">Raccourcis</CardTitle>
              <Button
                size="sm"
                onClick={() => setIsEditRaccourcisOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Settings className="w-4 h-4 mr-2" />
                Personnaliser
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {raccourcis.map((raccourci) => {
                const IconComponent = ICONS_MAP[raccourci.icone] || Home;
                return (
                  <Button
                    key={raccourci.id}
                    onClick={() => handleRaccourciClick(raccourci)}
                    className={`h-24 flex flex-col gap-2 ${raccourci.couleur || 'bg-slate-800'} hover:opacity-80 transition-all`}
                  >
                    <IconComponent className="w-8 h-8" />
                    <span className="text-sm">{raccourci.titre}</span>
                  </Button>
                );
              })}
              <Button
                onClick={() => setIsEditRaccourcisOpen(true)}
                className="h-24 flex flex-col gap-2 bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-emerald-500"
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm">Ajouter</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                Mandats à sortir aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {mandatsAujourdhui.length > 0 ? (
                <div className="space-y-3">
                  {mandatsAujourdhui.map((dossier) => (
                    <div key={dossier.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <p className="font-semibold text-white">{dossier.numero_dossier}</p>
                      <p className="text-sm text-slate-400">{dossier.arpenteur_geometre}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Aucun mandat à sortir aujourd'hui</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-400" />
                Absences aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {absencesAujourdhui.length > 0 ? (
                <div className="space-y-3">
                  {absencesAujourdhui.map((absence) => {
                    const utilisateur = users.find(u => u.email === absence.utilisateur_email);
                    return (
                      <div key={absence.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={utilisateur?.photo_url} />
                          <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500">
                            {getInitials(utilisateur?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">{utilisateur?.full_name}</p>
                          <p className="text-sm text-slate-400">{absence.titre}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Aucune absence aujourd'hui</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl lg:col-span-2">
            <CardHeader className="border-b border-slate-800">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Club Social
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsNewPostOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {posts.map((post) => {
                  const postUser = users.find(u => u.email === post.utilisateur_email);
                  return (
                    <div key={post.id} className="p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={postUser?.photo_url} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                            {getInitials(post.utilisateur_nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-white">{post.utilisateur_nom}</p>
                          <p className="text-xs text-slate-400">
                            {format(new Date(post.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>

                      {post.type === 'post' ? (
                        <p className="text-slate-300 mb-3">{post.contenu}</p>
                      ) : (
                        <div className="mb-3">
                          <p className="font-semibold text-white mb-3">{post.sondage_question}</p>
                          <div className="space-y-2">
                            {post.sondage_options?.map((option, idx) => {
                              const totalVotes = post.sondage_options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
                              const percentage = totalVotes > 0 ? ((option.votes?.length || 0) / totalVotes * 100).toFixed(0) : 0;
                              const hasVoted = option.votes?.includes(user?.email);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleVote(post, idx)}
                                  className={`w-full p-3 rounded-lg text-left transition-all ${
                                    hasVoted 
                                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-500' 
                                      : 'bg-slate-700/50 hover:bg-slate-700'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-white">{option.option}</span>
                                    <span className="text-sm text-slate-400">{percentage}%</span>
                                  </div>
                                  <div className="w-full bg-slate-900 rounded-full h-2">
                                    <div 
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {['👍', '❤️', '😂', '🎉'].map((emoji) => {
                          const reactionCount = post.reactions?.filter(r => r.emoji === emoji).length || 0;
                          const userReacted = post.reactions?.some(r => r.utilisateur_email === user?.email && r.emoji === emoji);
                          return (
                            <Button
                              key={emoji}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleReaction(post, emoji)}
                              className={`${userReacted ? 'bg-purple-500/20 text-purple-400' : 'text-slate-400'}`}
                            >
                              {emoji} {reactionCount > 0 && reactionCount}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {posts.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucune publication pour le moment</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800">
              <CardTitle className="text-white flex items-center gap-2">
                <Cake className="w-5 h-5 text-pink-400" />
                Anniversaires ce mois-ci
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {anniversairesDuMois.map((utilisateur) => {
                  const birthDate = new Date(utilisateur.date_naissance);
                  const isToday = isSameDay(new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()), today);
                  
                  if (isToday) {
                    return (
                      <motion.div
                        key={utilisateur.id}
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "loop",
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-2 border-pink-500 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-purple-500/10 animate-pulse" />
                        <Avatar className="w-10 h-10 relative z-10">
                          <AvatarImage src={utilisateur.photo_url} />
                          <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500">
                            {getInitials(utilisateur.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative z-10">
                          <p className="font-semibold text-white">{utilisateur.full_name}</p>
                          <p className="text-sm text-slate-400">
                            {format(new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()), "dd MMMM", { locale: fr })}
                            <span className="ml-2 text-pink-400 font-semibold">🎂 Aujourd'hui!</span>
                          </p>
                        </div>
                      </motion.div>
                    );
                  }
                  
                  return (
                    <div key={utilisateur.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={utilisateur.photo_url} />
                        <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500">
                          {getInitials(utilisateur.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{utilisateur.full_name}</p>
                        <p className="text-sm text-slate-400">
                          {format(new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate()), "dd MMMM", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {anniversairesDuMois.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun anniversaire ce mois-ci</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Nouvelle publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de publication</Label>
              <Select value={newPostType} onValueChange={setNewPostType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="sondage">Sondage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newPostType === 'post' ? (
              <div>
                <Label>Message</Label>
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Partagez quelque chose..."
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={4}
                />
              </div>
            ) : (
              <>
                <div>
                  <Label>Question</Label>
                  <Input
                    value={newSondageQuestion}
                    onChange={(e) => setNewSondageQuestion(e.target.value)}
                    placeholder="Posez votre question..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>Options</Label>
                  {sondageOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...sondageOptions];
                          newOptions[idx] = e.target.value;
                          setSondageOptions(newOptions);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      {idx > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSondageOptions(sondageOptions.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {sondageOptions.length < 5 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSondageOptions([...sondageOptions, ""])}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une option
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsNewPostOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={newPostType === 'post' ? !newPostContent : !newSondageQuestion || sondageOptions.filter(o => o).length < 2}
                className="bg-gradient-to-r from-purple-500 to-pink-600"
              >
                Publier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRaccourcisOpen} onOpenChange={setIsEditRaccourcisOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gérer vos raccourcis</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">Cette fonctionnalité sera disponible prochainement.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}