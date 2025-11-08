import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, FileText, FolderOpen, ExternalLink, Send, Edit, Trash2, X, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";

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

const getTypeColor = (type) => {
  const colors = {
    "Client": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Notaire": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "Courtier immobilier": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "Compagnie": "bg-green-500/20 text-green-400 border-green-500/30"
  };
  return colors[type] || colors["Client"];
};

const formatAdresse = (addr) => {
  if (!addr) return "";
  const parts = [];
  if (addr.numeros_civiques && addr.numeros_civiques.length > 0 && addr.numeros_civiques[0] !== "") {
    parts.push(addr.numeros_civiques.filter(n => n).join(', '));
  }
  if (addr.rue) parts.push(addr.rue);
  if (addr.ville) parts.push(addr.ville);
  if (addr.province) parts.push(addr.province);
  if (addr.code_postal) parts.push(addr.code_postal);
  return parts.filter(p => p).join(', ');
};

export default function ClientDetailView({ client, onClose, onViewDossier }) {
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: () => base44.entities.Dossier.list('-date_ouverture'),
    initialData: [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: commentaires = [] } = useQuery({
    queryKey: ['commentairesClient', client?.id],
    queryFn: () => client?.id ? base44.entities.CommentaireClient.filter({ client_id: client.id }, '-created_date') : [],
    enabled: !!client?.id,
    initialData: [],
  });

  const createCommentaireMutation = useMutation({
    mutationFn: (commentaireData) => base44.entities.CommentaireClient.create(commentaireData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', client?.id] });
      setNouveauCommentaire("");
    },
  });

  const updateCommentaireMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CommentaireClient.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', client?.id] });
      setEditingCommentId(null);
      setEditingContent("");
    },
  });

  const deleteCommentaireMutation = useMutation({
    mutationFn: (id) => base44.entities.CommentaireClient.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentairesClient', client?.id] });
    },
  });

  const handleSubmitCommentaire = (e) => {
    e.preventDefault();
    if (!nouveauCommentaire.trim() || !user) return;

    createCommentaireMutation.mutate({
      client_id: client.id,
      contenu: nouveauCommentaire,
      utilisateur_email: user.email,
      utilisateur_nom: user.full_name
    });
  };

  const handleEditCommentaire = (commentaire) => {
    setEditingCommentId(commentaire.id);
    setEditingContent(commentaire.contenu);
  };

  const handleSaveEdit = (commentaire) => {
    if (!editingContent.trim()) return;
    updateCommentaireMutation.mutate({
      id: commentaire.id,
      data: { contenu: editingContent }
    });
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  const handleDeleteCommentaire = (commentaire) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;
    deleteCommentaireMutation.mutate(commentaire.id);
  };

  const getUserPhoto = (email) => {
    const foundUser = users.find(u => u.email === email);
    return foundUser?.photo_url;
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const getClientDossiers = () => {
    const type = client.type_client;
    const field = type === 'Notaire' ? 'notaires_ids' : 
                  type === 'Courtier immobilier' ? 'courtiers_ids' : 'clients_ids';
    
    return dossiers
      .filter(d => d[field]?.includes(client.id) && d.statut !== "Rejeté")
      .sort((a, b) => new Date(b.date_ouverture) - new Date(a.date_ouverture));
  };

  const clientDossiers = getClientDossiers();

  // Créer une liste de mandats avec le dossier associé
  const mandatsWithDossier = [];
  clientDossiers.forEach(dossier => {
    if (dossier.mandats && dossier.mandats.length > 0) {
      dossier.mandats.forEach(mandat => {
        mandatsWithDossier.push({
          dossier,
          mandat
        });
      });
    } else {
      mandatsWithDossier.push({
        dossier,
        mandat: null
      });
    }
  });

  const adresseActuelle = client.adresses?.find(a => a.actuelle);
  const adressesAnciennes = client.adresses?.filter(a => !a.actuelle) || [];

  const courrielActuel = client.courriels?.find(c => c.actuel);
  const courrielsAnciens = client.courriels?.filter(c => !c.actuel) || [];

  const telephoneActuel = client.telephones?.find(t => t.actuel);
  const telephonesAnciens = client.telephones?.filter(t => !t.actuel) || [];

  const handleDossierClick = (dossier) => {
    const url = createPageUrl("Dossiers") + "?dossier_id=" + dossier.id;
    window.open(url, '_blank');
  };

  return (
    <div className="grid grid-cols-[60%_40%] gap-6 h-full">
      {/* Colonne gauche - Informations client */}
      <div className="space-y-6 overflow-y-auto pr-4">
        {/* Header */}
        <div className="border-b border-slate-700 pb-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-400 text-sm">Prénom</Label>
              <p className="text-white font-medium text-lg">{client.prenom}</p>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Nom</Label>
              <p className="text-white font-medium text-lg">{client.nom}</p>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Type</Label>
              <div className="mt-1">
                <Badge variant="outline" className={`${getTypeColor(client.type_client)} border`}>
                  {client.type_client || "Client"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="space-y-4">
          {/* Adresses */}
          {(adresseActuelle || adressesAnciennes.length > 0) && (
            <div>
              <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adresse(s)
              </Label>
              <div className="space-y-2">
                {adresseActuelle && (
                  <div className="flex items-start justify-between bg-slate-800/30 p-3 rounded-lg">
                    <p className="text-slate-300 flex-1">
                      {typeof adresseActuelle.adresse === 'string' 
                        ? adresseActuelle.adresse 
                        : formatAdresse(adresseActuelle)}
                    </p>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                      Actuel
                    </Badge>
                  </div>
                )}
                {adressesAnciennes.map((addr, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-slate-800/30 p-3 rounded-lg">
                    <p className="text-slate-400 flex-1 text-sm">
                      {typeof addr.adresse === 'string' 
                        ? addr.adresse 
                        : formatAdresse(addr)}
                    </p>
                    <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                      Ancien
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Courriels */}
          {(courrielActuel || courrielsAnciens.length > 0) && (
            <div>
              <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Courriel(s)
              </Label>
              <div className="space-y-2">
                {courrielActuel && (
                  <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                    <p className="text-slate-300 flex-1">{courrielActuel.courriel}</p>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                      Actuel
                    </Badge>
                  </div>
                )}
                {courrielsAnciens.map((courriel, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                    <p className="text-slate-400 flex-1 text-sm">{courriel.courriel}</p>
                    <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                      Ancien
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Téléphones */}
          {(telephoneActuel || telephonesAnciens.length > 0) && (
            <div>
              <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone(s)
              </Label>
              <div className="space-y-2">
                {telephoneActuel && (
                  <div className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                    <p className="text-slate-300 flex-1">{telephoneActuel.telephone}</p>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border ml-2 flex-shrink-0">
                      Actuel
                    </Badge>
                  </div>
                )}
                {telephonesAnciens.map((tel, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-lg">
                    <p className="text-slate-400 flex-1 text-sm">{tel.telephone}</p>
                    <Badge variant="outline" className="bg-slate-700 text-slate-400 border-slate-600 ml-2 flex-shrink-0">
                      Ancien
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div>
              <Label className="text-slate-400 mb-2 block flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </Label>
              <div className="bg-slate-800/30 p-3 rounded-lg">
                <p className="text-slate-300 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Dossiers associés */}
          {mandatsWithDossier.length > 0 && (
            <div>
              <Label className="text-slate-400 mb-3 block flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Dossiers associés ({mandatsWithDossier.length} mandat{mandatsWithDossier.length > 1 ? 's' : ''})
              </Label>
              <div className="border border-slate-700 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                      <TableHead className="text-slate-300">N° Dossier</TableHead>
                      <TableHead className="text-slate-300">Date d'ouverture</TableHead>
                      <TableHead className="text-slate-300">Type de mandat</TableHead>
                      <TableHead className="text-slate-300">Adresse des travaux</TableHead>
                      <TableHead className="text-slate-300 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mandatsWithDossier.map((item, idx) => (
                      <TableRow 
                        key={`${item.dossier.id}-${idx}`}
                        className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                        onClick={() => handleDossierClick(item.dossier)}
                      >
                        <TableCell className="font-medium text-white font-mono">
                          {getArpenteurInitials(item.dossier.arpenteur_geometre)}{item.dossier.numero_dossier}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {format(new Date(item.dossier.date_ouverture), "dd MMM yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {item.mandat ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                              {item.mandat.type_mandat}
                            </Badge>
                          ) : (
                            <span className="text-slate-600 text-sm">Aucun mandat</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm max-w-xs truncate">
                          {item.mandat?.adresse_travaux ? formatAdresse(item.mandat.adresse_travaux) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <ExternalLink className="w-4 h-4 text-slate-400 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colonne droite - Commentaires */}
      <div className="flex flex-col h-full border-l border-slate-700 pl-6">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Commentaires</h3>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-800/30 border border-slate-700 rounded-lg">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {commentaires.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <p className="text-slate-500">Aucun commentaire pour le moment</p>
                  <p className="text-slate-600 text-sm mt-1">Soyez le premier à commenter</p>
                </div>
              </div>
            ) : (
              commentaires.map((commentaire) => {
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
      </div>
    </div>
  );
}