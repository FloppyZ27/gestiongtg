import React, { useState, useEffect, useRef } from "react";
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
import { Plus, Settings, Calendar, Cake, UserX, BarChart, MessageSquare, ThumbsUp, MessageCircle, Smile, TrendingUp, X, Home, FileText, Users, FolderOpen, Search, Compass, Send, Image, Mic, StopCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const ICONS_MAP = {
  Home, FileText, Users, Calendar, FolderOpen, Search, Settings, BarChart, MessageSquare, Compass, Plus
};

function BirthdayCard({ utilisateur, birthDate, getInitials, today }) {
  const [confettiPieces, setConfettiPieces] = useState([]);

  useEffect(() => {
    const pieces = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      color: ['#ec4899', '#a855f7', '#f472b6', '#c084fc'][Math.floor(Math.random() * 4)]
    }));
    setConfettiPieces(pieces);
  }, []);

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border-2 border-pink-500 relative overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, rgba(236,72,153,0.2) 0%, rgba(168,85,247,0.2) 25%, rgba(236,72,153,0.2) 50%, rgba(168,85,247,0.2) 75%, rgba(236,72,153,0.2) 100%)',
        backgroundSize: '200% 100%',
        animation: 'gradientSlide 3s linear infinite'
      }}
    >
      <style>{`
        @keyframes gradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes confettiFall {
          0% { 
            transform: translateY(-20px) rotate(0deg);
            opacity: 0.4;
          }
          100% { 
            transform: translateY(150px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
      
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            left: `${piece.left}%`,
            top: '50%',
            backgroundColor: piece.color,
            animation: `confettiFall ${piece.duration}s ease-in infinite`,
            animationDelay: `${piece.delay}s`
          }}
        />
      ))}
      
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
    </div>
  );
}

export default function TableauDeBord() {
  const [isEditRaccourcisOpen, setIsEditRaccourcisOpen] = useState(false);
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPostType, setNewPostType] = useState("post");
  const [newPostContent, setNewPostContent] = useState("");
  const [newSondageQuestion, setNewSondageQuestion] = useState("");
  const [sondageOptions, setSondageOptions] = useState(["", ""]);
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostAudio, setNewPostAudio] = useState(null);
  const [isRecordingNewPost, setIsRecordingNewPost] = useState(false);
  const [commentaireInputs, setCommentaireInputs] = useState({});
  const [showReactions, setShowReactions] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentImages, setCommentImages] = useState({});
  const [commentAudio, setCommentAudio] = useState({});
  const [isRecording, setIsRecording] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
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
      setNewPostImage(null);
      setNewPostAudio(null);
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
    rdv.date_debut && 
    isSameDay(new Date(rdv.date_debut), today)
  ).sort((a, b) => new Date(a.date_debut) - new Date(b.date_debut));

  const handleRaccourciClick = (raccourci) => {
    if (raccourci.action_type === 'page') {
      navigate(createPageUrl(raccourci.action_cible));
    } else if (raccourci.action_type === 'externe') {
      window.open(raccourci.action_cible, '_blank');
    }
  };

  const handleCreatePost = async () => {
    let imageUrl = null;
    let audioUrl = null;

    if (newPostImage) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: newPostImage });
      imageUrl = file_url;
    }

    if (newPostAudio) {
      const audioFile = new File([newPostAudio], "audio.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      audioUrl = file_url;
    }

    if (newPostType === 'post') {
      createPostMutation.mutate({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        contenu: newPostContent,
        type: 'post',
        image_url: imageUrl,
        audio_url: audioUrl,
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

  const handleNewPostImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setNewPostImage(file);
    }
  };

  const startRecordingNewPost = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setNewPostAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingNewPost(true);
    } catch (error) {
      console.error("Erreur d'accès au microphone:", error);
    }
  };

  const stopRecordingNewPost = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecordingNewPost(false);
      setMediaRecorder(null);
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
    setShowReactions({ ...showReactions, [post.id]: false });
  };

  const handleAddComment = async (post) => {
    const commentText = commentaireInputs[post.id];
    const imageFile = commentImages[post.id];
    const audioBlob = commentAudio[post.id];
    
    if (!commentText?.trim() && !imageFile && !audioBlob) return;

    let imageUrl = null;
    let audioUrl = null;

    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }

    if (audioBlob) {
      const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      audioUrl = file_url;
    }

    const newComment = {
      utilisateur_email: user?.email,
      utilisateur_nom: user?.full_name,
      contenu: commentText?.trim() || "",
      date: new Date().toISOString(),
      image_url: imageUrl,
      audio_url: audioUrl
    };

    const existingComments = post.commentaires || [];
    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, commentaires: [...existingComments, newComment] }
    });

    setCommentaireInputs({ ...commentaireInputs, [post.id]: "" });
    setCommentImages({ ...commentImages, [post.id]: null });
    setCommentAudio({ ...commentAudio, [post.id]: null });
  };

  const handleImageUpload = (postId, file) => {
    if (file && file.type.startsWith('image/')) {
      setCommentImages({ ...commentImages, [postId]: file });
    }
  };

  const startRecording = async (postId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setCommentAudio({ ...commentAudio, [postId]: blob });
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording({ ...isRecording, [postId]: true });
    } catch (error) {
      console.error("Erreur d'accès au microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording({});
      setMediaRecorder(null);
    }
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
          <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 py-2">
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

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl mb-6">
          <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-orange-500/20 to-red-500/20 py-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-[25%_50%_25%] gap-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-red-500/20 to-orange-500/20 py-2">
              <CardTitle className="text-white flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-400" />
                Absences aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {absencesAujourdhui.length > 0 ? (
                <div className="space-y-2">
                  {absencesAujourdhui.map((absence) => {
                    const utilisateur = users.find(u => u.email === absence.utilisateur_email);
                    const debut = new Date(absence.date_debut);
                    const fin = absence.date_fin ? new Date(absence.date_fin) : null;
                    return (
                      <div key={absence.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={utilisateur?.photo_url} />
                          <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-xs">
                            {getInitials(utilisateur?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-white text-sm">{utilisateur?.full_name}</span>
                        <span className="text-sm text-slate-400">• {absence.titre}</span>
                        <span className="text-xs text-slate-500">
                          • {format(debut, "HH'h'mm")}{fin && ` - ${format(fin, "HH'h'mm")}`}
                        </span>
                        <Badge className={`ml-auto text-xs ${absence.type === 'absence' ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                          {absence.type === 'absence' ? 'Absence' : 'RDV'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Aucun événement aujourd'hui</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-purple-500/20 to-pink-500/20 py-2">
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
                        <>
                          {post.contenu && <p className="text-slate-300 mb-3">{post.contenu}</p>}
                          {post.image_url && (
                            <img src={post.image_url} alt="Post" className="mb-3 rounded-lg max-w-full" />
                          )}
                          {post.audio_url && (
                            <div className="mb-3 bg-slate-700/30 rounded-lg p-3">
                              <audio controls className="w-full">
                                <source src={post.audio_url} type="audio/webm" />
                              </audio>
                            </div>
                          )}
                        </>
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

                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex gap-1">
                            {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => {
                              const reactionCount = post.reactions?.filter(r => r.emoji === emoji).length || 0;
                              if (reactionCount === 0) return null;
                              return (
                                <span key={emoji} className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full">
                                  {emoji} {reactionCount}
                                </span>
                              );
                            })}
                          </div>
                          {post.commentaires && post.commentaires.length > 0 && (
                            <span className="text-xs text-slate-400 ml-auto">
                              {post.commentaires.length} commentaire{post.commentaires.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 border-t border-slate-700 pt-2">
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowReactions({ ...showReactions, [post.id]: !showReactions[post.id] })}
                              className="text-slate-400 hover:text-purple-400 text-xs h-7"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Réagir
                            </Button>
                            {showReactions[post.id] && (
                              <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 flex gap-1 z-10">
                                {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReaction(post, emoji)}
                                    className="text-2xl hover:scale-125 transition-transform p-1"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowComments({ ...showComments, [post.id]: !showComments[post.id] })}
                            className="text-slate-400 hover:text-purple-400 text-xs h-7"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Commenter
                          </Button>
                        </div>

                        {showComments[post.id] && (
                          <>
                            {post.commentaires && post.commentaires.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {post.commentaires.map((comment, idx) => {
                                  const commentUser = users.find(u => u.email === comment.utilisateur_email);
                                  return (
                                    <div key={idx} className="flex gap-2 bg-slate-700/30 p-2 rounded-lg">
                                      <Avatar className="w-7 h-7">
                                        <AvatarImage src={commentUser?.photo_url} />
                                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                                          {getInitials(comment.utilisateur_nom)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="bg-slate-700/50 rounded-lg p-2">
                                          <p className="font-semibold text-white text-xs">{comment.utilisateur_nom}</p>
                                          {comment.contenu && <p className="text-slate-300 text-sm">{comment.contenu}</p>}
                                          {comment.image_url && (
                                            <img src={comment.image_url} alt="Commentaire" className="mt-2 rounded-lg max-w-xs" />
                                          )}
                                          {comment.audio_url && (
                                            <div className="mt-2 bg-slate-800/50 rounded-lg p-2">
                                              <audio controls className="w-full">
                                                <source src={comment.audio_url} type="audio/webm" />
                                              </audio>
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                          {format(new Date(comment.date), "dd MMM 'à' HH:mm", { locale: fr })}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div className="mt-3">
                              <div className="flex gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user?.photo_url} />
                                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                                    {getInitials(user?.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex gap-2">
                                    <Input
                                      value={commentaireInputs[post.id] || ""}
                                      onChange={(e) => setCommentaireInputs({ ...commentaireInputs, [post.id]: e.target.value })}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddComment(post);
                                        }
                                      }}
                                      placeholder="Écrivez un commentaire..."
                                      className="bg-slate-700 border-slate-600 text-white text-sm h-8"
                                    />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`image-upload-${post.id}`}
                                      className="hidden"
                                      onChange={(e) => handleImageUpload(post.id, e.target.files[0])}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => document.getElementById(`image-upload-${post.id}`).click()}
                                      className="h-8 px-2 text-slate-400 hover:text-purple-400"
                                    >
                                      <Image className="w-4 h-4" />
                                    </Button>
                                    {!isRecording[post.id] ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startRecording(post.id)}
                                        className="h-8 px-2 text-slate-400 hover:text-purple-400"
                                      >
                                        <Mic className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={stopRecording}
                                        className="h-8 px-2 text-red-400 hover:text-red-500 animate-pulse"
                                      >
                                        <StopCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddComment(post)}
                                      disabled={!commentaireInputs[post.id]?.trim() && !commentImages[post.id] && !commentAudio[post.id]}
                                      className="bg-gradient-to-r from-purple-500 to-pink-600 h-8 px-3"
                                    >
                                      <Send className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  {commentImages[post.id] && (
                                    <div className="mt-2 bg-slate-700/30 rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Image className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs text-slate-300">{commentImages[post.id].name}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setCommentImages({ ...commentImages, [post.id]: null })}
                                          className="h-5 w-5 p-0 ml-auto"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <img 
                                        src={URL.createObjectURL(commentImages[post.id])} 
                                        alt="Preview" 
                                        className="rounded-lg max-w-full max-h-32 object-contain"
                                      />
                                    </div>
                                  )}
                                  {commentAudio[post.id] && (
                                    <div className="mt-2 bg-slate-700/30 rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Mic className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs text-slate-300">Enregistrement audio</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setCommentAudio({ ...commentAudio, [post.id]: null })}
                                          className="h-5 w-5 p-0 ml-auto"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <audio controls className="w-full">
                                        <source src={URL.createObjectURL(commentAudio[post.id])} type="audio/webm" />
                                      </audio>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
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

          <Card className={`border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl ${hasAnniversaireAujourdhui ? 'ring-2 ring-pink-500 shadow-pink-500/50 shadow-2xl' : ''}`}>
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-pink-500/20 to-purple-500/20 py-2">
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
                      <BirthdayCard
                        key={utilisateur.id}
                        utilisateur={utilisateur}
                        birthDate={birthDate}
                        getInitials={getInitials}
                        today={today}
                      />
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
              <>
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
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="new-post-image-upload"
                    className="hidden"
                    onChange={(e) => handleNewPostImageUpload(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('new-post-image-upload').click()}
                    className="flex-1"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {newPostImage ? newPostImage.name : 'Ajouter une photo'}
                  </Button>
                  {!isRecordingNewPost ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={startRecordingNewPost}
                      className="flex-1"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Enregistrer audio
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopRecordingNewPost}
                      className="flex-1 text-red-400 border-red-400 animate-pulse"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Arrêter
                    </Button>
                  )}
                </div>
                {newPostImage && (
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded p-2">
                    <Image className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">{newPostImage.name}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewPostImage(null)}
                      className="ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                {newPostAudio && (
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded p-2">
                    <Mic className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-slate-300">Enregistrement audio</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewPostAudio(null)}
                      className="ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
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
                disabled={newPostType === 'post' ? (!newPostContent && !newPostImage && !newPostAudio) : (!newSondageQuestion || sondageOptions.filter(o => o).length < 2)}
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