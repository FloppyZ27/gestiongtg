import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Search, CheckCircle, XCircle, KeyRound, Lock, FileText, Settings, UserCog } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PermissionsDialog from "@/components/admin/PermissionsDialog";
import TemplatePermissionsDialog from "@/components/admin/TemplatePermissionsDialog";
import ResetPasswordDialog from "@/components/admin/ResetPasswordDialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const getRoleColor = (role) => {
  const colors = {
    "admin": "bg-red-500/20 text-red-400 border-red-500/30",
    "gestionnaire": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "user": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  };
  return colors[role] || colors["user"];
};

const getRoleLabel = (role) => {
  const labels = {
    "admin": "Administrateur",
    "gestionnaire": "Gestionnaire",
    "user": "Utilisateur"
  };
  return labels[role] || "Utilisateur";
};

export default function Administration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const { data: actionLogs = [] } = useQuery({
    queryKey: ['actionLogs'],
    queryFn: () => base44.entities.ActionLog.list('-created_date', 100),
    initialData: [],
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['permissionsTemplates'],
    queryFn: () => base44.entities.PermissionsTemplate.list(),
    initialData: [],
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PermissionsTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissionsTemplates'] });
    },
  });

  const handleUpdateUser = async (user, field, value) => {
    await updateUserMutation.mutateAsync({
      id: user.id,
      data: { [field]: value }
    });

    let actionLabel = "";
    if (field === "actif") {
      actionLabel = value ? "ACTIVATION_UTILISATEUR" : "DESACTIVATION_UTILISATEUR";
    } else if (field === "poste") {
      actionLabel = "MODIFICATION_POSTE";
    } else if (field === "role") {
      actionLabel = "MODIFICATION_ROLE";
    }

    await base44.entities.ActionLog.create({
      utilisateur_email: currentUser?.email,
      utilisateur_nom: currentUser?.full_name,
      action: actionLabel,
      entite: "User",
      entite_id: user.id,
      details: `Modification de ${user.full_name}: ${field} = ${value}`
    });

    queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
  };

  const handleManagePermissions = (user) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleSavePermissions = async (permissions) => {
    await updateUserMutation.mutateAsync({
      id: selectedUser.id,
      data: permissions
    });

    await base44.entities.ActionLog.create({
      utilisateur_email: currentUser?.email,
      utilisateur_nom: currentUser?.full_name,
      action: "MODIFICATION_PERMISSIONS",
      entite: "User",
      entite_id: selectedUser.id,
      details: `Modification des permissions pour ${selectedUser.full_name}`
    });

    queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    setIsPermissionsDialogOpen(false);
  };

  const handleResetPasswordSubmit = async (newPassword) => {
    await updateUserMutation.mutateAsync({
      id: selectedUser.id,
      data: { password: newPassword }
    });

    await base44.entities.ActionLog.create({
      utilisateur_email: currentUser?.email,
      utilisateur_nom: currentUser?.full_name,
      action: "RESET_PASSWORD",
      entite: "User",
      entite_id: selectedUser.id,
      details: `Réinitialisation du mot de passe pour ${selectedUser.full_name}`
    });

    queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
    setIsResetPasswordDialogOpen(false);
    alert("Mot de passe réinitialisé avec succès");
  };

  const handleManageTemplate = (type, nom) => {
    const existingTemplate = templates.find(t => t.type === type && t.nom === nom);
    if (existingTemplate) {
      setSelectedTemplate(existingTemplate);
    } else {
      setSelectedTemplate({ type, nom, permissions_pages: [], permissions_informations: [] });
    }
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async (permissions) => {
    if (selectedTemplate.id) {
      await updateTemplateMutation.mutateAsync({
        id: selectedTemplate.id,
        data: permissions
      });
    } else {
      await base44.entities.PermissionsTemplate.create({
        type: selectedTemplate.type,
        nom: selectedTemplate.nom,
        ...permissions
      });
      queryClient.invalidateQueries({ queryKey: ['permissionsTemplates'] });
    }
    setIsTemplateDialogOpen(false);
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.poste?.toLowerCase().includes(searchLower)
    );
  });

  const activeUsers = filteredUsers.filter(u => u.actif !== false);
  const inactiveUsers = filteredUsers.filter(u => u.actif === false);

  const adminUsers = users.filter(u => u.role === 'admin' && u.actif !== false);
  const gestionnaireUsers = users.filter(u => u.role === 'gestionnaire' && u.actif !== false);
  const standardUsers = users.filter(u => u.role === 'user' && u.actif !== false);

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Accès refusé</h2>
            <p className="text-slate-400">Seuls les administrateurs peuvent accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Administration
            </h1>
            <p className="text-slate-400">Gestion des utilisateurs et permissions</p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardContent className="p-6">
            <div className="relative w-64 mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Tabs defaultValue="actifs">
              <TabsList className="bg-slate-800/50 mb-6">
                <TabsTrigger value="actifs">Utilisateurs actifs ({activeUsers.length})</TabsTrigger>
                <TabsTrigger value="inactifs">Utilisateurs inactifs ({inactiveUsers.length})</TabsTrigger>
                <TabsTrigger value="permissions">Permissions par poste/rôle</TabsTrigger>
              </TabsList>

              <TabsContent value="actifs">
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300">Utilisateur</TableHead>
                        <TableHead className="text-slate-300">Poste</TableHead>
                        <TableHead className="text-slate-300">Équipe</TableHead>
                        <TableHead className="text-slate-300">Date d'embauche</TableHead>
                        <TableHead className="text-slate-300">Rôle</TableHead>
                        <TableHead className="text-slate-300">Statut</TableHead>
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeUsers.length > 0 ? (
                        activeUsers.map((user) => (
                          <TableRow key={user.email} className="hover:bg-slate-800/30 border-slate-800">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={user.photo_url} />
                                  <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-500">
                                    {getInitials(user.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-white">{user.full_name}</div>
                                  <div className="text-xs text-slate-400">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.poste || ""} 
                                onValueChange={(value) => handleUpdateUser(user, "poste", value)}
                              >
                                <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="Arpenteur-Géomètre">Arpenteur-Géomètre</SelectItem>
                                  <SelectItem value="Technicien Terrain">Technicien Terrain</SelectItem>
                                  <SelectItem value="Analyste-Foncier">Analyste-Foncier</SelectItem>
                                  <SelectItem value="Collaboratrice">Collaboratrice</SelectItem>
                                  <SelectItem value="Dessinateur">Dessinateur</SelectItem>
                                  <SelectItem value="Comptabilité">Comptabilité</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.equipe || ""} 
                                onValueChange={(value) => handleUpdateUser(user, "equipe", value)}
                              >
                                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="Samuel">Samuel</SelectItem>
                                  <SelectItem value="Pierre-Luc">Pierre-Luc</SelectItem>
                                  <SelectItem value="Dany">Dany</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={user.date_embauche || ""}
                                onChange={(e) => handleUpdateUser(user, "date_embauche", e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.role || "user"} 
                                onValueChange={(value) => handleUpdateUser(user, "role", value)}
                                disabled={user.email === currentUser?.email}
                              >
                                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="admin">
                                    <Badge variant="outline" className={`${getRoleColor('admin')} border`}>
                                      {getRoleLabel('admin')}
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="gestionnaire">
                                    <Badge variant="outline" className={`${getRoleColor('gestionnaire')} border`}>
                                      {getRoleLabel('gestionnaire')}
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="user">
                                    <Badge variant="outline" className={`${getRoleColor('user')} border`}>
                                      {getRoleLabel('user')}
                                    </Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.actif !== false ? "actif" : "inactif"} 
                                onValueChange={(value) => handleUpdateUser(user, "actif", value === "actif")}
                                disabled={user.email === currentUser?.email}
                              >
                                <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="actif">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-400" />
                                      <span>Actif</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="inactif">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-3 h-3 text-red-400" />
                                      <span>Inactif</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleManagePermissions(user)}
                                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResetPassword(user)}
                                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            Aucun utilisateur actif trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>



              <TabsContent value="inactifs">
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300">Utilisateur</TableHead>
                        <TableHead className="text-slate-300">Poste</TableHead>
                        <TableHead className="text-slate-300">Équipe</TableHead>
                        <TableHead className="text-slate-300">Date d'embauche</TableHead>
                        <TableHead className="text-slate-300">Rôle</TableHead>
                        <TableHead className="text-slate-300">Statut</TableHead>
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveUsers.length > 0 ? (
                        inactiveUsers.map((user) => (
                          <TableRow key={user.id} className="hover:bg-slate-800/30 border-slate-800 opacity-60">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 grayscale">
                                  <AvatarImage src={user.photo_url} />
                                  <AvatarFallback className="bg-gradient-to-r from-slate-500 to-slate-600">
                                    {getInitials(user.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-white">{user.full_name}</div>
                                  <div className="text-xs text-slate-400">{user.email}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.poste || ""} 
                                onValueChange={(value) => handleUpdateUser(user, "poste", value)}
                              >
                                <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="Arpenteur-Géomètre">Arpenteur-Géomètre</SelectItem>
                                  <SelectItem value="Technicien Terrain">Technicien Terrain</SelectItem>
                                  <SelectItem value="Analyste-Foncier">Analyste-Foncier</SelectItem>
                                  <SelectItem value="Collaboratrice">Collaboratrice</SelectItem>
                                  <SelectItem value="Dessinateur">Dessinateur</SelectItem>
                                  <SelectItem value="Comptabilité">Comptabilité</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.equipe || ""} 
                                onValueChange={(value) => handleUpdateUser(user, "equipe", value)}
                              >
                                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="Samuel">Samuel</SelectItem>
                                  <SelectItem value="Pierre-Luc">Pierre-Luc</SelectItem>
                                  <SelectItem value="Dany">Dany</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="date"
                                value={user.date_embauche || ""}
                                onChange={(e) => handleUpdateUser(user, "date_embauche", e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                              />
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.role || "user"} 
                                onValueChange={(value) => handleUpdateUser(user, "role", value)}
                                disabled={user.email === currentUser?.email}
                              >
                                <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="admin">
                                    <Badge variant="outline" className={`${getRoleColor('admin')} border`}>
                                      {getRoleLabel('admin')}
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="gestionnaire">
                                    <Badge variant="outline" className={`${getRoleColor('gestionnaire')} border`}>
                                      {getRoleLabel('gestionnaire')}
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="user">
                                    <Badge variant="outline" className={`${getRoleColor('user')} border`}>
                                      {getRoleLabel('user')}
                                    </Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={user.actif !== false ? "actif" : "inactif"} 
                                onValueChange={(value) => handleUpdateUser(user, "actif", value === "actif")}
                                disabled={user.email === currentUser?.email}
                              >
                                <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                  <SelectItem value="actif">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-400" />
                                      <span>Actif</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="inactif">
                                    <div className="flex items-center gap-2">
                                      <XCircle className="w-3 h-3 text-red-400" />
                                      <span>Inactif</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleManagePermissions(user)}
                                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResetPassword(user)}
                                  className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                            Aucun utilisateur inactif trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>



              <TabsContent value="permissions">
                <div className="space-y-6">
                  {/* Permissions par Poste */}
                  <Card className="border-slate-700 bg-slate-800/30">
                    <CardHeader className="pb-3 border-b border-slate-700">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-emerald-400" />
                        Permissions par Poste
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {["Arpenteur-Géomètre", "Technicien Terrain", "Analyste-Foncier", "Collaboratrice", "Dessinateur", "Comptabilité"].map(poste => {
                          const template = templates.find(t => t.type === 'poste' && t.nom === poste);
                          return (
                            <Button
                              key={poste}
                              onClick={() => handleManageTemplate('poste', poste)}
                              className="bg-slate-700/50 hover:bg-slate-700 text-white justify-between h-auto py-3"
                            >
                              <span>{poste}</span>
                              {template && (
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                                  {(template.permissions_pages?.length || 0) + (template.permissions_informations?.length || 0)} permissions
                                </Badge>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Permissions par Rôle */}
                  <Card className="border-slate-700 bg-slate-800/30">
                    <CardHeader className="pb-3 border-b border-slate-700">
                      <CardTitle className="text-lg text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        Permissions par Rôle
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {["admin", "gestionnaire", "user"].map(role => {
                          const template = templates.find(t => t.type === 'role' && t.nom === role);
                          return (
                            <Button
                              key={role}
                              onClick={() => handleManageTemplate('role', role)}
                              className="bg-slate-700/50 hover:bg-slate-700 text-white justify-between h-auto py-3"
                            >
                              <span>{getRoleLabel(role)}</span>
                              {template && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  {(template.permissions_pages?.length || 0) + (template.permissions_informations?.length || 0)} permissions
                                </Badge>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <PermissionsDialog
        open={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        user={selectedUser}
        onSave={handleSavePermissions}
      />

      <ResetPasswordDialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
        user={selectedUser}
        onReset={handleResetPasswordSubmit}
      />

      <TemplatePermissionsDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}