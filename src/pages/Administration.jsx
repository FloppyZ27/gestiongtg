import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Search, History, UserCog, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EditUserDialog from "@/components/admin/EditUserDialog";
import UserHistoryDialog from "@/components/admin/UserHistoryDialog";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
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

  const updateUserMutation = useMutation({
    mutationFn: ({ email, data }) => base44.entities.User.update(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleUserStatus = async (user) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${user.actif ? 'désactiver' : 'activer'} le compte de ${user.full_name} ?`)) return;
    
    await updateUserMutation.mutateAsync({
      email: user.email,
      data: { actif: !user.actif }
    });

    // Log l'action
    await base44.entities.ActionLog.create({
      utilisateur_email: currentUser?.email,
      utilisateur_nom: currentUser?.full_name,
      action: user.actif ? "DESACTIVATION_UTILISATEUR" : "ACTIVATION_UTILISATEUR",
      entite: "User",
      entite_id: user.email,
      details: `${user.actif ? 'Désactivation' : 'Activation'} du compte de ${user.full_name}`
    });

    queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleViewHistory = (user) => {
    setSelectedUser(user);
    setIsHistoryDialogOpen(true);
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm text-slate-400">Total utilisateurs</p>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-red-400" />
                <div>
                  <p className="text-sm text-slate-400">Administrateurs</p>
                  <p className="text-2xl font-bold text-white">{adminUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCog className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-slate-400">Gestionnaires</p>
                  <p className="text-2xl font-bold text-white">{gestionnaireUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-sm text-slate-400">Comptes actifs</p>
                  <p className="text-2xl font-bold text-white">{users.filter(u => u.actif !== false).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-xl">
          <CardHeader className="border-b border-slate-800">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Gestion des utilisateurs
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="actifs">
              <TabsList className="bg-slate-800/50 mb-6">
                <TabsTrigger value="actifs">Utilisateurs actifs ({activeUsers.length})</TabsTrigger>
                <TabsTrigger value="inactifs">Utilisateurs inactifs ({inactiveUsers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="actifs">
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-800/50 hover:bg-slate-800/50 border-slate-700">
                        <TableHead className="text-slate-300">Utilisateur</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Poste</TableHead>
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
                                <span className="text-white">{user.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{user.email}</TableCell>
                            <TableCell className="text-slate-300">{user.poste || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${getRoleColor(user.role)} border`}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Actif
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewHistory(user)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditUser(user)}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                >
                                  <UserCog className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleUserStatus(user)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  disabled={user.email === currentUser?.email}
                                >
                                  <XCircle className="w-4 h-4" />
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
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Poste</TableHead>
                        <TableHead className="text-slate-300">Rôle</TableHead>
                        <TableHead className="text-slate-300">Statut</TableHead>
                        <TableHead className="text-slate-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inactiveUsers.length > 0 ? (
                        inactiveUsers.map((user) => (
                          <TableRow key={user.email} className="hover:bg-slate-800/30 border-slate-800 opacity-60">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-10 h-10 grayscale">
                                  <AvatarImage src={user.photo_url} />
                                  <AvatarFallback className="bg-gradient-to-r from-slate-500 to-slate-600">
                                    {getInitials(user.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-white">{user.full_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-slate-300">{user.email}</TableCell>
                            <TableCell className="text-slate-300">{user.poste || "-"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`${getRoleColor(user.role)} border`}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactif
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewHistory(user)}
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleUserStatus(user)}
                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                >
                                  <CheckCircle className="w-4 h-4" />
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
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        currentUser={currentUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['actionLogs'] });
        }}
      />

      <UserHistoryDialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
        user={selectedUser}
        actionLogs={actionLogs}
      />
    </div>
  );
}