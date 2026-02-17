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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Settings, Calendar, Cake, UserX, BarChart, MessageSquare, ThumbsUp, MessageCircle, Smile, TrendingUp, X, Home, FileText, Users, FolderOpen, Search, Compass, Send, Image, Mic, StopCircle, Edit, Trash2, Check } from "lucide-react";
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
  const [showCommentReactions, setShowCommentReactions] = useState({});
  const [commentImages, setCommentImages] = useState({});
  const [commentAudio, setCommentAudio] = useState({});
  const [isRecording, setIsRecording] = useState({});
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostContent, setEditingPostContent] = useState("");
  const [showDeletePostDialog, setShowDeletePostDialog] = useState(null);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(null);
  const [chatTab, setChatTab] = useState("generale");
  const [isNewChatMessageOpen, setIsNewChatMessageOpen] = useState(false);
  const [newChatMessageType, setNewChatMessageType] = useState("post");
  const [newChatContent, setNewChatContent] = useState("");
  const [newChatSondageQuestion, setNewChatSondageQuestion] = useState("");
  const [chatSondageOptions, setChatSondageOptions] = useState(["", ""]);
  const [newChatImage, setNewChatImage] = useState(null);
  const [newChatAudio, setNewChatAudio] = useState(null);
  const [isRecordingNewChat, setIsRecordingNewChat] = useState(false);
  const [chatCommentInputs, setChatCommentInputs] = useState({});
  const [showChatReactions, setShowChatReactions] = useState({});
  const [showChatComments, setShowChatComments] = useState({});
  const [showChatCommentReactions, setShowChatCommentReactions] = useState({});
  const [chatCommentImages, setChatCommentImages] = useState({});
  const [chatCommentAudio, setChatCommentAudio] = useState({});
  const [isChatRecording, setIsChatRecording] = useState({});
  const [editingChatMessageId, setEditingChatMessageId] = useState(null);
  const [editingChatMessageContent, setEditingChatMessageContent] = useState("");
  const [editingChatCommentId, setEditingChatCommentId] = useState(null);
  const [editingChatCommentContent, setEditingChatCommentContent] = useState("");
  const [showDeleteChatMessageDialog, setShowDeleteChatMessageDialog] = useState(null);
  const [showDeleteChatCommentDialog, setShowDeleteChatCommentDialog] = useState(null);
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

  const { data: chatMessages = [] } = useQuery({
    queryKey: ['chatMessages'],
    queryFn: () => base44.entities.MessageChat.list('-created_date', 50),
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

  const createChatMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.MessageChat.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      setIsNewChatMessageOpen(false);
      setNewChatContent("");
      setNewChatSondageQuestion("");
      setChatSondageOptions(["", ""]);
      setNewChatMessageType("post");
      setNewChatImage(null);
      setNewChatAudio(null);
    },
  });

  const updateChatMessageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MessageChat.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
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

  const handleCommentReaction = (post, commentIdx, emoji) => {
    const updatedCommentaires = [...post.commentaires];
    const comment = updatedCommentaires[commentIdx];
    const existingReactions = comment.reactions || [];
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

    updatedCommentaires[commentIdx] = { ...comment, reactions: newReactions };

    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, commentaires: updatedCommentaires }
    });
    setShowCommentReactions({ ...showCommentReactions, [`${post.id}-${commentIdx}`]: false });
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
      audio_url: audioUrl,
      reactions: []
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
      }
      return opt;
    });

    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, sondage_options: newOptions }
    });
  };

  const handleEditComment = (post, commentIdx) => {
    const comment = post.commentaires[commentIdx];
    setEditingCommentId(`${post.id}-${commentIdx}`);
    setEditingCommentContent(comment.contenu);
  };

  const handleSaveEditComment = (post, commentIdx) => {
    const updatedCommentaires = [...post.commentaires];
    updatedCommentaires[commentIdx] = {
      ...updatedCommentaires[commentIdx],
      contenu: editingCommentContent,
      date_modification: new Date().toISOString()
    };

    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, commentaires: updatedCommentaires }
    });

    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const handleDeleteComment = () => {
    if (!showDeleteCommentDialog) return;
    
    const { post, commentIdx } = showDeleteCommentDialog;
    const updatedCommentaires = post.commentaires.filter((_, idx) => idx !== commentIdx);
    
    updatePostMutation.mutate({
      id: post.id,
      data: { ...post, commentaires: updatedCommentaires }
    });
    
    setShowDeleteCommentDialog(null);
  };

  const handleEditPost = (post) => {
    setEditingPostId(post.id);
    if (post.type === 'post') {
      setEditingPostContent(post.contenu || "");
    } else {
      setEditingPostContent(post.sondage_question || "");
    }
  };

  const handleSaveEditPost = (post) => {
    if (post.type === 'post') {
      updatePostMutation.mutate({
        id: post.id,
        data: { ...post, contenu: editingPostContent, date_modification: new Date().toISOString() }
      });
    } else {
      updatePostMutation.mutate({
        id: post.id,
        data: { ...post, sondage_question: editingPostContent, date_modification: new Date().toISOString() }
      });
    }
    setEditingPostId(null);
    setEditingPostContent("");
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditingPostContent("");
  };

  const handleDeletePost = (postId) => {
    base44.entities.PostClubSocial.delete(postId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['postsClubSocial'] });
      setShowDeletePostDialog(null);
    });
  };

  const handleCreateChatMessage = async () => {
    let imageUrl = null;
    let audioUrl = null;

    if (newChatImage) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: newChatImage });
      imageUrl = file_url;
    }

    if (newChatAudio) {
      const audioFile = new File([newChatAudio], "audio.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file: audioFile });
      audioUrl = file_url;
    }

    if (newChatMessageType === 'post') {
      createChatMessageMutation.mutate({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        canal: chatTab,
        contenu: newChatContent,
        type: 'post',
        image_url: imageUrl,
        audio_url: audioUrl,
        reactions: [],
        commentaires: []
      });
    } else {
      createChatMessageMutation.mutate({
        utilisateur_email: user?.email,
        utilisateur_nom: user?.full_name,
        canal: chatTab,
        type: 'sondage',
        sondage_question: newChatSondageQuestion,
        sondage_options: chatSondageOptions.filter(o => o).map(option => ({
          option,
          votes: []
        })),
        reactions: [],
        commentaires: []
      });
    }
  };

  const handleChatReaction = (message, emoji) => {
    const existingReactions = message.reactions || [];
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

    updateChatMessageMutation.mutate({
      id: message.id,
      data: { ...message, reactions: newReactions }
    });
    setShowChatReactions({ ...showChatReactions, [message.id]: false });
  };

  const handleChatCommentReaction = (message, commentIdx, emoji) => {
    const updatedCommentaires = [...message.commentaires];
    const comment = updatedCommentaires[commentIdx];
    const existingReactions = comment.reactions || [];
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

    updatedCommentaires[commentIdx] = { ...comment, reactions: newReactions };

    updateChatMessageMutation.mutate({
      id: message.id,
      data: { ...message, commentaires: updatedCommentaires }
    });
    setShowChatCommentReactions({ ...showChatCommentReactions, [`${message.id}-${commentIdx}`]: false });
  };

  const handleAddChatComment = async (message) => {
    const commentText = chatCommentInputs[message.id];
    const imageFile = chatCommentImages[message.id];
    const audioBlob = chatCommentAudio[message.id];
    
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
      audio_url: audioUrl,
      reactions: []
    };

    const existingComments = message.commentaires || [];
    updateChatMessageMutation.mutate({
      id: message.id,
      data: { ...message, commentaires: [...existingComments, newComment] }
    });

    setChatCommentInputs({ ...chatCommentInputs, [message.id]: "" });
    setChatCommentImages({ ...chatCommentImages, [message.id]: null });
    setChatCommentAudio({ ...chatCommentAudio, [message.id]: null });
  };

  const handleChatVote = (message, optionIndex) => {
    const newOptions = message.sondage_options.map((opt, idx) => {
      if (idx === optionIndex) {
        const votes = opt.votes || [];
        if (votes.includes(user?.email)) {
          return { ...opt, votes: votes.filter(v => v !== user?.email) };
        } else {
          return { ...opt, votes: [...votes, user?.email] };
        }
      }
      return opt;
    });

    updateChatMessageMutation.mutate({
      id: message.id,
      data: { ...message, sondage_options: newOptions }
    });
  };

  const handleDeleteChatMessage = (messageId) => {
    base44.entities.MessageChat.delete(messageId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      setShowDeleteChatMessageDialog(null);
    });
  };

  const handleDeleteChatComment = () => {
    if (!showDeleteChatCommentDialog) return;
    
    const { message, commentIdx } = showDeleteChatCommentDialog;
    const updatedCommentaires = message.commentaires.filter((_, idx) => idx !== commentIdx);
    
    updateChatMessageMutation.mutate({
      id: message.id,
      data: { ...message, commentaires: updatedCommentaires }
    });
    
    setShowDeleteChatCommentDialog(null);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
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

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
            <CardHeader className="border-b border-slate-800 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 py-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Chat
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsNewChatMessageOpen(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publier
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex gap-2 mb-4 border-b border-slate-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatTab("generale")}
                  className={`flex-1 rounded-none ${chatTab === "generale" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"}`}
                >
                  Générale
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setChatTab("equipe")}
                  className={`flex-1 rounded-none ${chatTab === "equipe" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400"}`}
                >
                  Équipe {user?.equipe && `${user.equipe}`}
                </Button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {chatMessages.filter(m => {
                  if (m.canal === "generale") return true;
                  if (m.canal === "equipe" && user?.equipe) {
                    const messageUser = users.find(u => u.email === m.utilisateur_email);
                    return messageUser?.equipe === user.equipe;
                  }
                  return false;
                }).map((message) => {
                  const messageUser = users.find(u => u.email === message.utilisateur_email);
                  return (
                    <div key={message.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={messageUser?.photo_url} />
                          <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-xs">
                            {getInitials(message.utilisateur_nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                             <p className="font-semibold text-white text-sm">{message.utilisateur_nom}</p>
                             {message.utilisateur_email === user?.email && (
                               <div className="flex gap-1">
                                 {(!message.image_url && !message.audio_url) && (
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => {
                                       setEditingChatMessageId(message.id);
                                       if (message.type === 'post') {
                                         setEditingChatMessageContent(message.contenu || "");
                                       } else {
                                         setEditingChatMessageContent(message.sondage_question || "");
                                       }
                                     }}
                                     className="h-5 w-5 p-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                                   >
                                     <Edit className="w-3 h-3" />
                                   </Button>
                                 )}
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => setShowDeleteChatMessageDialog(message.id)}
                                   className="h-5 w-5 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </Button>
                               </div>
                             )}
                           </div>
                          <p className="text-xs text-slate-400">
                            {format(new Date(message.created_date), "dd MMM 'à' HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {message.type === 'post' ? (
                        <>
                          {editingChatMessageId === message.id ? (
                            <div className="space-y-2 mb-3">
                              <Textarea
                                value={editingChatMessageContent}
                                onChange={(e) => setEditingChatMessageContent(e.target.value)}
                                className="bg-slate-800 border-slate-600 text-white text-sm break-words whitespace-pre-wrap"
                                rows={3}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingChatMessageId(null);
                                    setEditingChatMessageContent("");
                                  }}
                                  className="h-7 text-xs text-slate-400 hover:text-white"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateChatMessageMutation.mutate({
                                      id: message.id,
                                      data: { ...message, contenu: editingChatMessageContent, date_modification: new Date().toISOString() }
                                    });
                                    setEditingChatMessageId(null);
                                    setEditingChatMessageContent("");
                                  }}
                                  className="h-7 text-xs bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {message.contenu && <p className="text-slate-300 text-sm break-words whitespace-pre-wrap mb-2">{message.contenu}</p>}
                              {message.image_url && <img src={message.image_url} alt="Message" className="rounded-lg max-w-full mb-2" />}
                              {message.audio_url && (
                                <div className="mb-2 bg-slate-700/30 rounded-lg p-2">
                                  <audio controls className="w-full">
                                    <source src={message.audio_url} type="audio/webm" />
                                  </audio>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        <div className="mb-2">
                          {editingChatMessageId === message.id ? (
                            <div className="space-y-2 mb-3">
                              <Input
                                value={editingChatMessageContent}
                                onChange={(e) => setEditingChatMessageContent(e.target.value)}
                                className="bg-slate-800 border-slate-600 text-white text-sm"
                                placeholder="Question du sondage"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingChatMessageId(null);
                                    setEditingChatMessageContent("");
                                  }}
                                  className="h-7 text-xs text-slate-400 hover:text-white"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateChatMessageMutation.mutate({
                                      id: message.id,
                                      data: { ...message, sondage_question: editingChatMessageContent, date_modification: new Date().toISOString() }
                                    });
                                    setEditingChatMessageId(null);
                                    setEditingChatMessageContent("");
                                  }}
                                  className="h-7 text-xs bg-cyan-500 hover:bg-cyan-600 text-white"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="font-semibold text-white text-sm mb-2">{message.sondage_question}</p>
                          )}
                          <div className="space-y-1">
                            {message.sondage_options?.map((option, idx) => {
                              const totalVotes = message.sondage_options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
                              const percentage = totalVotes > 0 ? ((option.votes?.length || 0) / totalVotes * 100).toFixed(0) : 0;
                              const hasVoted = option.votes?.includes(user?.email);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleChatVote(message, idx)}
                                  className={`w-full p-2 rounded-lg text-left transition-all text-xs ${
                                    hasVoted ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-500' : 'bg-slate-700/50 hover:bg-slate-700'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-white">{option.option}</span>
                                    <span className="text-xs text-slate-400">{percentage}%</span>
                                  </div>
                                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <TooltipProvider>
                            <div className="flex gap-1">
                              {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => {
                                const reactionsForEmoji = message.reactions?.filter(r => r.emoji === emoji) || [];
                                const reactionCount = reactionsForEmoji.length;
                                if (reactionCount === 0) return null;
                                
                                const userNames = reactionsForEmoji.map(r => {
                                  const u = users.find(usr => usr.email === r.utilisateur_email);
                                  return u?.full_name || r.utilisateur_email;
                                }).join(', ');
                                
                                return (
                                  <Tooltip key={emoji}>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-slate-700">
                                        {emoji} {reactionCount}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                                      <p className="text-xs">{userNames}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </TooltipProvider>
                          {message.commentaires && message.commentaires.length > 0 && (
                            <span className="text-xs text-slate-400 ml-auto">
                              {message.commentaires.length} commentaire{message.commentaires.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 border-t border-slate-700 pt-2">
                          <div className="relative">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowChatReactions({ ...showChatReactions, [message.id]: !showChatReactions[message.id] })}
                              className="text-slate-400 hover:text-cyan-400 text-xs h-6"
                            >
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Réagir
                            </Button>
                            {showChatReactions[message.id] && (
                              <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 flex gap-1 z-10">
                                {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleChatReaction(message, emoji)}
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
                            onClick={() => setShowChatComments({ ...showChatComments, [message.id]: !showChatComments[message.id] })}
                            className="text-slate-400 hover:text-cyan-400 text-xs h-6"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Commenter
                          </Button>
                        </div>

                        {showChatComments[message.id] && (
                          <>
                            {message.commentaires && message.commentaires.length > 0 && (
                              <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
                                {message.commentaires.map((comment, idx) => {
                                  const commentUser = users.find(u => u.email === comment.utilisateur_email);
                                  const isOwnComment = comment.utilisateur_email === user?.email;
                                  const isEditing = editingChatCommentId === `${message.id}-${idx}`;
                                  const hasMedia = comment.image_url || comment.audio_url;
                                  
                                  return (
                                    <div key={idx} className="flex gap-2 bg-slate-700/30 p-2 rounded-lg max-w-full">
                                      <Avatar className="w-7 h-7 flex-shrink-0">
                                        <AvatarImage src={commentUser?.photo_url} />
                                        <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-xs">
                                          {getInitials(comment.utilisateur_nom)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="bg-slate-700/50 rounded-lg p-2 max-w-full overflow-hidden">
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-white text-xs">{comment.utilisateur_nom}</p>
                                            {isOwnComment && !isEditing && (
                                              <div className="flex gap-1">
                                                {!hasMedia && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                      setEditingChatCommentId(`${message.id}-${idx}`);
                                                      setEditingChatCommentContent(comment.contenu);
                                                    }}
                                                    className="h-5 w-5 p-0 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                                                  >
                                                    <Edit className="w-2.5 h-2.5" />
                                                  </Button>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setShowDeleteChatCommentDialog({ message, commentIdx: idx })}
                                                  className="h-5 w-5 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                          {isEditing ? (
                                            <div className="space-y-2 mt-2">
                                              <Input
                                                value={editingChatCommentContent}
                                                onChange={(e) => setEditingChatCommentContent(e.target.value)}
                                                className="bg-slate-800 border-slate-600 text-white text-sm"
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setEditingChatCommentId(null);
                                                    setEditingChatCommentContent("");
                                                  }}
                                                  className="h-6 text-xs text-slate-400 hover:text-white"
                                                >
                                                  <X className="w-3 h-3 mr-1" />
                                                  Annuler
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  onClick={() => {
                                                    const updatedCommentaires = [...message.commentaires];
                                                    updatedCommentaires[idx] = {
                                                      ...updatedCommentaires[idx],
                                                      contenu: editingChatCommentContent,
                                                      date_modification: new Date().toISOString()
                                                    };
                                                    updateChatMessageMutation.mutate({
                                                      id: message.id,
                                                      data: { ...message, commentaires: updatedCommentaires }
                                                    });
                                                    setEditingChatCommentId(null);
                                                    setEditingChatCommentContent("");
                                                  }}
                                                  className="h-6 text-xs bg-cyan-500 hover:bg-cyan-600"
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Enregistrer
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              {comment.contenu && <p className="text-slate-300 text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere max-w-full">{comment.contenu}</p>}
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
                                            </>
                                          )}
                                        </div>

                                        {/* Réactions du commentaire */}
                                        {comment.reactions && comment.reactions.length > 0 && (
                                        <TooltipProvider>
                                          <div className="flex gap-1 mt-2">
                                            {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => {
                                              const reactionsForEmoji = comment.reactions?.filter(r => r.emoji === emoji) || [];
                                              const reactionCount = reactionsForEmoji.length;
                                              if (reactionCount === 0) return null;

                                              const userNames = reactionsForEmoji.map(r => {
                                                const u = users.find(usr => usr.email === r.utilisateur_email);
                                                return u?.full_name || r.utilisateur_email;
                                              }).join(', ');

                                              return (
                                                <Tooltip key={emoji}>
                                                  <TooltipTrigger asChild>
                                                    <span className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-slate-700">
                                                      {emoji} {reactionCount}
                                                    </span>
                                                  </TooltipTrigger>
                                                  <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                                                    <p className="text-xs">{userNames}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              );
                                            })}
                                          </div>
                                        </TooltipProvider>
                                        )}

                                        {/* Bouton réagir au commentaire */}
                                        <div className="flex items-center gap-2 mt-1">
                                        <div className="relative">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowChatCommentReactions({ ...showChatCommentReactions, [`${message.id}-${idx}`]: !showChatCommentReactions[`${message.id}-${idx}`] })}
                                            className="text-slate-400 hover:text-cyan-400 text-xs h-5 px-1"
                                          >
                                            <Smile className="w-3 h-3" />
                                          </Button>
                                          {showChatCommentReactions[`${message.id}-${idx}`] && (
                                            <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 flex gap-1 z-10">
                                              {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => (
                                                <button
                                                  key={emoji}
                                                  onClick={() => handleChatCommentReaction(message, idx, emoji)}
                                                  className="text-xl hover:scale-125 transition-transform p-1"
                                                >
                                                  {emoji}
                                                </button>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                          {format(new Date(comment.date), "dd MMM 'à' HH:mm", { locale: fr })}
                                          {comment.date_modification && (
                                            <span className="text-slate-600 ml-1">(modifié)</span>
                                          )}
                                        </p>
                                        </div>
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
                                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-xs">
                                    {getInitials(user?.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex gap-2">
                                    <Textarea
                                      value={chatCommentInputs[message.id] || ""}
                                      onChange={(e) => setChatCommentInputs({ ...chatCommentInputs, [message.id]: e.target.value })}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddChatComment(message);
                                        }
                                      }}
                                      placeholder="Écrivez un commentaire..."
                                      className="bg-slate-700 border-slate-600 text-white text-sm min-h-[72px] max-h-[200px] resize-none"
                                      rows={3}
                                    />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      id={`chat-image-upload-${message.id}`}
                                      className="hidden"
                                      onChange={(e) => setChatCommentImages({ ...chatCommentImages, [message.id]: e.target.files[0] })}
                                    />
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => document.getElementById(`chat-image-upload-${message.id}`).click()}
                                      className="h-8 px-2 text-slate-400 hover:text-cyan-400"
                                    >
                                      <Image className="w-4 h-4" />
                                    </Button>
                                    {!isChatRecording[message.id] ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          try {
                                            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                            const recorder = new MediaRecorder(stream);
                                            const chunks = [];
                                            recorder.ondataavailable = (e) => chunks.push(e.data);
                                            recorder.onstop = () => {
                                              const blob = new Blob(chunks, { type: 'audio/webm' });
                                              setChatCommentAudio({ ...chatCommentAudio, [message.id]: blob });
                                              stream.getTracks().forEach(track => track.stop());
                                            };
                                            recorder.start();
                                            setMediaRecorder(recorder);
                                            setIsChatRecording({ ...isChatRecording, [message.id]: true });
                                          } catch (error) {
                                            console.error("Erreur d'accès au microphone:", error);
                                          }
                                        }}
                                        className="h-8 px-2 text-slate-400 hover:text-cyan-400"
                                      >
                                        <Mic className="w-4 h-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          if (mediaRecorder && mediaRecorder.state === 'recording') {
                                            mediaRecorder.stop();
                                            setIsChatRecording({ ...isChatRecording, [message.id]: false });
                                            setMediaRecorder(null);
                                          }
                                        }}
                                        className="h-8 px-2 text-red-400 hover:text-red-500 animate-pulse"
                                      >
                                        <StopCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddChatComment(message)}
                                      disabled={!chatCommentInputs[message.id]?.trim() && !chatCommentImages[message.id] && !chatCommentAudio[message.id]}
                                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/50 h-9 px-4 text-white border-none"
                                      style={{ backgroundColor: 'rgb(34, 211, 238)', backgroundImage: 'linear-gradient(to right, rgb(34, 211, 238), rgb(59, 130, 246))' }}
                                    >
                                      <Send className="w-4 h-4 mr-1 text-white" />
                                      Envoyer
                                    </Button>
                                  </div>
                                  {chatCommentImages[message.id] && (
                                    <div className="mt-2 bg-slate-700/30 rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Image className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs text-slate-300">{chatCommentImages[message.id].name}</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setChatCommentImages({ ...chatCommentImages, [message.id]: null })}
                                          className="h-5 w-5 p-0 ml-auto"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <img 
                                        src={URL.createObjectURL(chatCommentImages[message.id])} 
                                        alt="Preview" 
                                        className="rounded-lg max-w-full max-h-32 object-contain"
                                      />
                                    </div>
                                  )}
                                  {chatCommentAudio[message.id] && (
                                    <div className="mt-2 bg-slate-700/30 rounded-lg p-2">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Mic className="w-4 h-4 text-cyan-400" />
                                        <span className="text-xs text-slate-300">Enregistrement audio</span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setChatCommentAudio({ ...chatCommentAudio, [message.id]: null })}
                                          className="h-5 w-5 p-0 ml-auto"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                      <audio controls className="w-full">
                                        <source src={URL.createObjectURL(chatCommentAudio[message.id])} type="audio/webm" />
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
                {chatMessages.filter(m => m.canal === chatTab).length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun message pour le moment</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
                  className="bg-transparent border-2 shadow-lg shadow-purple-500/30 hover:bg-purple-500/10"
                  style={{ 
                    borderImage: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153)) 1'
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" style={{ color: 'rgb(168, 85, 247)' }} />
                  <span style={{ 
                    background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontWeight: '600'
                  }}>
                    Publier
                  </span>
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
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-white">{post.utilisateur_nom}</p>
                              <p className="text-xs text-slate-400">
                                {format(new Date(post.created_date), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                                {post.date_modification && (
                                  <span className="text-slate-500 ml-1">(modifié)</span>
                                )}
                              </p>
                            </div>
                            {post.utilisateur_email === user?.email && (
                              <div className="flex gap-1">
                                {(!post.image_url && !post.audio_url) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditPost(post)}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowDeletePostDialog(post.id)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {post.type === 'post' ? (
                        <>
                          {editingPostId === post.id ? (
                          <div className="space-y-2 mb-3">
                            <Textarea
                              value={editingPostContent}
                              onChange={(e) => setEditingPostContent(e.target.value)}
                              className="bg-slate-800 border-slate-600 text-white text-sm break-words whitespace-pre-wrap"
                              rows={3}
                            />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEditPost}
                                  className="h-7 text-xs text-slate-400 hover:text-white"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEditPost(post)}
                                  className="h-7 text-xs bg-purple-500 hover:bg-purple-600"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {post.contenu && <p className="text-slate-300 mb-3 break-words whitespace-pre-wrap">{post.contenu}</p>}
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
                          )}
                        </>
                      ) : (
                        <div className="mb-3">
                          {editingPostId === post.id ? (
                            <div className="space-y-2 mb-3">
                              <Input
                                value={editingPostContent}
                                onChange={(e) => setEditingPostContent(e.target.value)}
                                className="bg-slate-800 border-slate-600 text-white text-sm"
                                placeholder="Question du sondage"
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEditPost}
                                  className="h-7 text-xs text-slate-400 hover:text-white"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  Annuler
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEditPost(post)}
                                  className="h-7 text-xs bg-purple-500 hover:bg-purple-600"
                                >
                                  <Check className="w-3 h-3 mr-1" />
                                  Enregistrer
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="font-semibold text-white mb-3">{post.sondage_question}</p>
                          )}
                          <div className="space-y-2">
                            {post.sondage_options?.map((option, idx) => {
                              const totalVotes = post.sondage_options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
                              const percentage = totalVotes > 0 ? ((option.votes?.length || 0) / totalVotes * 100).toFixed(0) : 0;
                              const hasVoted = option.votes?.includes(user?.email);
                              const votersNames = (option.votes || []).map(voterEmail => {
                                const voter = users.find(u => u.email === voterEmail);
                                return voter?.full_name || voterEmail;
                              }).join(', ');
                              
                              return (
                                <TooltipProvider key={idx}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => handleVote(post, idx)}
                                        className={`w-full p-3 rounded-lg text-left transition-all ${
                                          hasVoted 
                                            ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-500' 
                                            : 'bg-slate-700/50 hover:bg-slate-700'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-white">{option.option}</span>
                                          <span className="text-sm text-slate-400">{option.votes?.length || 0} vote{(option.votes?.length || 0) !== 1 ? 's' : ''} • {percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-900 rounded-full h-2">
                                          <div 
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                          />
                                        </div>
                                      </button>
                                    </TooltipTrigger>
                                    {option.votes && option.votes.length > 0 && (
                                      <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                                        <p className="text-xs font-semibold mb-1">Ont voté pour cette option:</p>
                                        <p className="text-xs">{votersNames}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-700 pt-2 mt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <TooltipProvider>
                            <div className="flex gap-1">
                              {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => {
                                const reactionsForEmoji = post.reactions?.filter(r => r.emoji === emoji) || [];
                                const reactionCount = reactionsForEmoji.length;
                                if (reactionCount === 0) return null;
                                
                                const userNames = reactionsForEmoji.map(r => {
                                  const user = users.find(u => u.email === r.utilisateur_email);
                                  return user?.full_name || r.utilisateur_email;
                                }).join(', ');
                                
                                return (
                                  <Tooltip key={emoji}>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-slate-700">
                                        {emoji} {reactionCount}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                                      <p className="text-xs">{userNames}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </TooltipProvider>
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
                              <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto">
                                {post.commentaires.map((comment, idx) => {
                                  const commentUser = users.find(u => u.email === comment.utilisateur_email);
                                  const isOwnComment = comment.utilisateur_email === user?.email;
                                  const isEditing = editingCommentId === `${post.id}-${idx}`;
                                  const hasMedia = comment.image_url || comment.audio_url;
                                  
                                  return (
                                    <div key={idx} className="flex gap-2 bg-slate-700/30 p-2 rounded-lg max-w-full">
                                      <Avatar className="w-7 h-7 flex-shrink-0">
                                        <AvatarImage src={commentUser?.photo_url} />
                                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                                          {getInitials(comment.utilisateur_nom)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="bg-slate-700/50 rounded-lg p-2 max-w-full overflow-hidden">
                                          <div className="flex items-center justify-between mb-1">
                                            <p className="font-semibold text-white text-xs">{comment.utilisateur_nom}</p>
                                            {isOwnComment && !isEditing && (
                                              <div className="flex gap-1">
                                                {!hasMedia && (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditComment(post, idx)}
                                                    className="h-5 w-5 p-0 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                                  >
                                                    <Edit className="w-2.5 h-2.5" />
                                                  </Button>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setShowDeleteCommentDialog({ post, commentIdx: idx })}
                                                  className="h-5 w-5 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                  <Trash2 className="w-2.5 h-2.5" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                          {isEditing ? (
                                            <div className="space-y-2 mt-2">
                                              <Input
                                                value={editingCommentContent}
                                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                                className="bg-slate-800 border-slate-600 text-white text-sm"
                                              />
                                              <div className="flex gap-2 justify-end">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={handleCancelEditComment}
                                                  className="h-6 text-xs text-slate-400 hover:text-white"
                                                >
                                                  <X className="w-3 h-3 mr-1" />
                                                  Annuler
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  onClick={() => handleSaveEditComment(post, idx)}
                                                  className="h-6 text-xs bg-purple-500 hover:bg-purple-600"
                                                >
                                                  <Check className="w-3 h-3 mr-1" />
                                                  Enregistrer
                                                </Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              {comment.contenu && <p className="text-slate-300 text-sm break-words whitespace-pre-wrap overflow-wrap-anywhere max-w-full">{comment.contenu}</p>}
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
                                            </>
                                          )}
                                          </div>

                                          {/* Réactions du commentaire */}
                                          {comment.reactions && comment.reactions.length > 0 && (
                                          <TooltipProvider>
                                            <div className="flex gap-1 mt-2">
                                              {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => {
                                                const reactionsForEmoji = comment.reactions?.filter(r => r.emoji === emoji) || [];
                                                const reactionCount = reactionsForEmoji.length;
                                                if (reactionCount === 0) return null;

                                                const userNames = reactionsForEmoji.map(r => {
                                                  const u = users.find(usr => usr.email === r.utilisateur_email);
                                                  return u?.full_name || r.utilisateur_email;
                                                }).join(', ');

                                                return (
                                                  <Tooltip key={emoji}>
                                                    <TooltipTrigger asChild>
                                                      <span className="text-xs bg-slate-700/50 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-slate-700">
                                                        {emoji} {reactionCount}
                                                      </span>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-800 border-slate-700 text-white max-w-xs">
                                                      <p className="text-xs">{userNames}</p>
                                                    </TooltipContent>
                                                  </Tooltip>
                                                );
                                              })}
                                            </div>
                                          </TooltipProvider>
                                          )}

                                          {/* Bouton réagir au commentaire */}
                                          <div className="flex items-center gap-2 mt-1">
                                          <div className="relative">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setShowCommentReactions({ ...showCommentReactions, [`${post.id}-${idx}`]: !showCommentReactions[`${post.id}-${idx}`] })}
                                              className="text-slate-400 hover:text-purple-400 text-xs h-5 px-1"
                                            >
                                              <Smile className="w-3 h-3" />
                                            </Button>
                                            {showCommentReactions[`${post.id}-${idx}`] && (
                                              <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 flex gap-1 z-10">
                                                {['👍', '❤️', '😂', '🎉', '😮', '😢'].map((emoji) => (
                                                  <button
                                                    key={emoji}
                                                    onClick={() => handleCommentReaction(post, idx, emoji)}
                                                    className="text-xl hover:scale-125 transition-transform p-1"
                                                  >
                                                    {emoji}
                                                  </button>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                          <p className="text-xs text-slate-500">
                                            {format(new Date(comment.date), "dd MMM 'à' HH:mm", { locale: fr })}
                                            {comment.date_modification && (
                                              <span className="text-slate-600 ml-1">(modifié)</span>
                                            )}
                                          </p>
                                          </div>
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
                                    <Textarea
                                      value={commentaireInputs[post.id] || ""}
                                      onChange={(e) => setCommentaireInputs({ ...commentaireInputs, [post.id]: e.target.value })}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAddComment(post);
                                        }
                                      }}
                                      placeholder="Écrivez un commentaire..."
                                      className="bg-slate-700 border-slate-600 text-white text-sm min-h-[72px] max-h-[200px] resize-none"
                                      rows={3}
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
                                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg shadow-purple-500/50 h-9 px-4 text-white border-none"
                                      style={{ backgroundColor: 'rgb(168, 85, 247)', backgroundImage: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))' }}
                                    >
                                      <Send className="w-4 h-4 mr-1 text-white" />
                                      Envoyer
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
                className="bg-transparent border-2 shadow-lg shadow-purple-500/30 hover:bg-purple-500/10"
                style={{ 
                  borderImage: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153)) 1'
                }}
              >
                <Send className="w-4 h-4 mr-2" style={{ color: 'rgb(168, 85, 247)' }} />
                <span style={{ 
                  background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  fontWeight: '600'
                }}>
                  Publier
                </span>
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

      <Dialog open={showDeletePostDialog !== null} onOpenChange={() => setShowDeletePostDialog(null)}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-slate-300 text-center">
              Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={() => setShowDeletePostDialog(null)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => handleDeletePost(showDeletePostDialog)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteCommentDialog !== null} onOpenChange={() => setShowDeleteCommentDialog(null)}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-slate-300 text-center">
              Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={() => setShowDeleteCommentDialog(null)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleDeleteComment}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewChatMessageOpen} onOpenChange={setIsNewChatMessageOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Nouveau message - {chatTab === "generale" ? "Générale" : "Équipe"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de publication</Label>
              <Select value={newChatMessageType} onValueChange={setNewChatMessageType}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="post">Message</SelectItem>
                  <SelectItem value="sondage">Sondage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newChatMessageType === 'post' ? (
              <>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={newChatContent}
                    onChange={(e) => setNewChatContent(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="bg-slate-800 border-slate-700 text-white"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="new-chat-image-upload"
                    className="hidden"
                    onChange={(e) => setNewChatImage(e.target.files[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('new-chat-image-upload').click()}
                    className="flex-1"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {newChatImage ? newChatImage.name : 'Ajouter une photo'}
                  </Button>
                  {!isRecordingNewChat ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          const recorder = new MediaRecorder(stream);
                          const chunks = [];
                          recorder.ondataavailable = (e) => chunks.push(e.data);
                          recorder.onstop = () => {
                            const blob = new Blob(chunks, { type: 'audio/webm' });
                            setNewChatAudio(blob);
                            stream.getTracks().forEach(track => track.stop());
                          };
                          recorder.start();
                          setMediaRecorder(recorder);
                          setIsRecordingNewChat(true);
                        } catch (error) {
                          console.error("Erreur d'accès au microphone:", error);
                        }
                      }}
                      className="flex-1"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Enregistrer audio
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (mediaRecorder && mediaRecorder.state === 'recording') {
                          mediaRecorder.stop();
                          setIsRecordingNewChat(false);
                          setMediaRecorder(null);
                        }
                      }}
                      className="flex-1 text-red-400 border-red-400 animate-pulse"
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Arrêter
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Question</Label>
                  <Input
                    value={newChatSondageQuestion}
                    onChange={(e) => setNewChatSondageQuestion(e.target.value)}
                    placeholder="Posez votre question..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label>Options</Label>
                  {chatSondageOptions.map((option, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...chatSondageOptions];
                          newOptions[idx] = e.target.value;
                          setChatSondageOptions(newOptions);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                      {idx > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setChatSondageOptions(chatSondageOptions.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {chatSondageOptions.length < 5 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setChatSondageOptions([...chatSondageOptions, ""])}
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
              <Button variant="outline" onClick={() => setIsNewChatMessageOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreateChatMessage}
                disabled={newChatMessageType === 'post' ? (!newChatContent && !newChatImage && !newChatAudio) : (!newChatSondageQuestion || chatSondageOptions.filter(o => o).length < 2)}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Publier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteChatMessageDialog !== null} onOpenChange={() => setShowDeleteChatMessageDialog(null)}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-slate-300 text-center">
              Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={() => setShowDeleteChatMessageDialog(null)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => handleDeleteChatMessage(showDeleteChatMessageDialog)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteChatCommentDialog !== null} onOpenChange={() => setShowDeleteChatCommentDialog(null)}>
        <DialogContent className="border-none text-white max-w-md shadow-2xl shadow-black/50" style={{ background: 'none' }}>
          <DialogHeader>
            <DialogTitle className="text-xl text-yellow-400 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              Attention
              <span className="text-2xl">⚠️</span>
            </DialogTitle>
          </DialogHeader>
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-slate-300 text-center">
              Êtes-vous sûr de vouloir supprimer ce commentaire ? Cette action est irréversible.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button 
                type="button" 
                onClick={() => setShowDeleteChatCommentDialog(null)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-none"
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleDeleteChatComment}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-none"
              >
                Supprimer
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}