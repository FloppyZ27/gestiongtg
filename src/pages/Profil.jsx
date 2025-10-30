import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, FileText, User, Mail, Phone, MapPin, Briefcase, Upload, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Profil() {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isRendezVousDialogOpen, setIsRendezVousDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers } = useQuery({
    queryKey: ['dossiers', user?.email],
    queryFn: () => base44.entities.Dossier.filter({ responsable_email: user?.email }),
    initialData: [],
    enabled: !!user,
  });

  const { data: entreeTemps } = useQuery({
    queryKey: ['entreeTemps', user?.email],
    queryFn: () => base44.entities.EntreeTemps.filter({ utilisateur_email: user?.email }, '-date', 5),
    initialData: [],
    enabled: !!user,
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', user?.email],
    queryFn: () => base44.entities.Note.filter({ utilisateur_email: user?.email }, '-created_date'),
    initialData: [],
    enabled: !!user,
  });

  const { data: rendezVous } = useQuery({
    queryKey: ['rendezVous', user?.email],
    queryFn: () => base44.entities.RendezVous.filter({ utilisateur_email: user?.email }, '-date_debut'),
    initialData: [],
    enabled: !!user,
  });

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    telephone: user?.telephone || "",
    adresse: user?.adresse || "",
    poste: user?.poste || "",
  });

  const [noteForm, setNoteForm] = useState({
    titre: "",
    contenu: ""
  });

  const [rendezVousForm, setRendezVousForm] = useState({
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    type: "rendez-vous"
  });

  React.useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
        telephone: user.telephone || "",
        adresse: user.adresse || "",
        poste: user.poste || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditingProfile(false);
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return base44.auth.updateMe({ photo_url: file_url });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setUploadingPhoto(false);
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (noteData) => base44.entities.Note.create({ ...noteData, utilisateur_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsNoteDialogOpen(false);
      resetNoteForm();
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, noteData }) => base44.entities.Note.update(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsNoteDialogOpen(false);
      resetNoteForm();
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const createRendezVousMutation = useMutation({
    mutationFn: (data) => base44.entities.RendezVous.create({ ...data, utilisateur_email: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendezVous'] });
      setIsRendezVousDialogOpen(false);
      resetRendezVousForm();
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingPhoto(true);
      uploadPhotoMutation.mutate(file);
    }
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    const { email, ...updateData } = profileForm;
    updateProfileMutation.mutate(updateData);
  };

  const handleNoteSubmit = (e) => {
    e.preventDefault();
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, noteData: noteForm });
    } else {
      createNoteMutation.mutate(noteForm);
    }
  };

  const handleRendezVousSubmit = (e) => {
    e.preventDefault();
    createRendezVousMutation.mutate(rendezVousForm);
  };

  const resetNoteForm = () => {
    setNoteForm({ titre: "", contenu: "" });
    setEditingNote(null);
  };

  const resetRendezVousForm = () => {
    setRendezVousForm({
      titre: "",
      description: "",
      date_debut: "",
      date_fin: "",
      type: "rendez-vous"
    });
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({ titre: note.titre, contenu: note.contenu });
    setIsNoteDialogOpen(true);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const dossiersEnCours = dossiers.filter(d => d.statut === 'en_cours');
  const totalHeures = entreeTemps.reduce((sum, e) => sum + (e.heures || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Mon Profil
            </h1>
            <p className="text-slate-400">Votre espace personnel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & Stats */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="w-32 h-32 border-4 border-emerald-500/50">
                      <AvatarImage src={user?.photo_url} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-emerald-500 to-teal-500">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="photo-upload" className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors">
                      <Upload className="w-4 h-4 text-white" />
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">{user?.full_name}</h2>
                  <p className="text-emerald-400 mb-4">{user?.poste || "Employé"}</p>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    {user?.role}
                  </Badge>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span>{user?.email}</span>
                  </div>
                  {user?.telephone && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{user.telephone}</span>
                    </div>
                  )}
                  {user?.adresse && (
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{user.adresse}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  Modifier le profil
                </Button>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Dossiers en cours</span>
                  <span className="text-2xl font-bold text-emerald-400">{dossiersEnCours.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Heures (5 dernières)</span>
                  <span className="text-2xl font-bold text-cyan-400">{totalHeures}h</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Calendar & Rendez-vous */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                    Rendez-vous & Absences
                  </CardTitle>
                  <Dialog open={isRendezVousDialogOpen} onOpenChange={setIsRendezVousDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Nouveau rendez-vous</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleRendezVousSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input
                            value={rendezVousForm.titre}
                            onChange={(e) => setRendezVousForm({...rendezVousForm, titre: e.target.value})}
                            required
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select
                            value={rendezVousForm.type}
                            onChange={(e) => setRendezVousForm({...rendezVousForm, type: e.target.value})}
                            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                          >
                            <option value="rendez-vous">Rendez-vous</option>
                            <option value="absence">Absence</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Date début</Label>
                            <Input
                              type="datetime-local"
                              value={rendezVousForm.date_debut}
                              onChange={(e) => setRendezVousForm({...rendezVousForm, date_debut: e.target.value})}
                              required
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Date fin</Label>
                            <Input
                              type="datetime-local"
                              value={rendezVousForm.date_fin}
                              onChange={(e) => setRendezVousForm({...rendezVousForm, date_fin: e.target.value})}
                              className="bg-slate-800 border-slate-700"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={rendezVousForm.description}
                            onChange={(e) => setRendezVousForm({...rendezVousForm, description: e.target.value})}
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsRendezVousDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button type="submit" className="bg-emerald-500">
                            Créer
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {rendezVous.map((rdv) => (
                    <div
                      key={rdv.id}
                      className={`p-3 rounded-lg ${
                        rdv.type === 'absence' 
                          ? 'bg-red-500/10 border border-red-500/30' 
                          : 'bg-emerald-500/10 border border-emerald-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{rdv.titre}</h4>
                          <p className="text-sm text-slate-400 mt-1">
                            {format(new Date(rdv.date_debut), "dd MMM yyyy HH:mm", { locale: fr })}
                          </p>
                          {rdv.description && (
                            <p className="text-sm text-slate-400 mt-2">{rdv.description}</p>
                          )}
                        </div>
                        <Badge className={rdv.type === 'absence' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}>
                          {rdv.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {rendezVous.length === 0 && (
                    <p className="text-center text-slate-500 py-8">Aucun rendez-vous</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dossiers en cours */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Dossiers en cours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {dossiersEnCours.slice(0, 5).map((dossier) => (
                    <div key={dossier.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{dossier.titre}</h4>
                          <p className="text-sm text-slate-400">N° {dossier.numero_dossier}</p>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                          {dossier.statut}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {dossiersEnCours.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Aucun dossier en cours</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Time entries & Notes */}
          <div className="space-y-6">
            {/* Entrées de temps */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Dernières entrées de temps
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {entreeTemps.map((entree) => (
                    <div key={entree.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-white text-sm">{entree.description}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(entree.date), "dd MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                        <span className="text-emerald-400 font-semibold">{entree.heures}h</span>
                      </div>
                    </div>
                  ))}
                  {entreeTemps.length === 0 && (
                    <p className="text-center text-slate-500 py-4">Aucune entrée de temps</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
              <CardHeader className="border-b border-slate-800">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Mes notes</CardTitle>
                  <Dialog open={isNoteDialogOpen} onOpenChange={(open) => {
                    setIsNoteDialogOpen(open);
                    if (!open) resetNoteForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 text-white">
                      <DialogHeader>
                        <DialogTitle>{editingNote ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleNoteSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Titre</Label>
                          <Input
                            value={noteForm.titre}
                            onChange={(e) => setNoteForm({...noteForm, titre: e.target.value})}
                            required
                            className="bg-slate-800 border-slate-700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Contenu</Label>
                          <Textarea
                            value={noteForm.contenu}
                            onChange={(e) => setNoteForm({...noteForm, contenu: e.target.value})}
                            required
                            className="bg-slate-800 border-slate-700 h-32"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                            Annuler
                          </Button>
                          <Button type="submit" className="bg-emerald-500">
                            {editingNote ? "Modifier" : "Créer"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white">{note.titre}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            className="h-6 w-6 p-0 text-emerald-400 hover:text-emerald-300"
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNoteMutation.mutate(note.id)}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{note.contenu}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-slate-500 py-8">Aucune note</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Modifier mon profil</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Poste</Label>
                <Input
                  value={profileForm.poste}
                  onChange={(e) => setProfileForm({...profileForm, poste: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={profileForm.telephone}
                  onChange={(e) => setProfileForm({...profileForm, telephone: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input
                  value={profileForm.adresse}
                  onChange={(e) => setProfileForm({...profileForm, adresse: e.target.value})}
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  Enregistrer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}