import { useState, useEffect, useMemo, useCallback  } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Mail, Trash2, AlertCircle, ShieldCheck, User as UserIcon, Search } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { deleteUser, resendInvitation, getUsers, updateUserRole } from "@/api/fastApiService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";


interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}
interface UserListProps {
  onRefresh?: () => void;
  refreshKey?: number; // Ajoute cette ligne
}


export const UsersList = ({ onRefresh, refreshKey }: UserListProps) => {
  // Style CSS pour éliminer la barre de défilement verticale
  const containerStyle = {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 240px)',
    scrollbarWidth: 'none' as const,  // Pour Firefox
    msOverflowStyle: 'none' as const, // Pour IE/Edge
  };
 
  // Style pour cacher la scrollbar pour Webkit (Chrome, Safari)
  const webkitScrollbarStyle = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `;
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    userId: string | null;
    username: string | null;
  }>({
    open: false,
    userId: null,
    username: null
  });
 
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");


  // Fonction pour charger les utilisateurs depuis MongoDB
  let loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      if (response.status === 'success' && response.users) {
        setUsers(response.users);
        setError(null);
      } else {
        setError(response.message || 'Erreur lors du chargement des utilisateurs');
        setUsers([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError('Impossible de charger les utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]); // Ajoute refreshKey ici


  // Charger les utilisateurs au chargement du composant
  useEffect(() => {
    if (onRefresh) {
      // Si onRefresh est fourni, synchroniser loadUsers avec onRefresh
      const originalOnRefresh = onRefresh;
      onRefresh = () => {
        loadUsers().then(() => {
          if (originalOnRefresh) {
            originalOnRefresh();
          }
        });
      };
    }
  }, [onRefresh, loadUsers]);
 
  // Fonction pour changer le rôle d'un utilisateur
  const handleChangeRole = async (userId: string, newRole: string) => {
    setIsUpdatingRole(userId);
    try {
      const isAdmin = newRole === "admin";
      const result = await updateUserRole(userId, isAdmin);
     
      if (result.status === 'success') {
        // Mettre à jour la liste des utilisateurs localement
        setUsers(users.map(user => {
          if (user._id === userId) {
            return { ...user, isAdmin };
          }
          return user;
        }));
       
        toast({
          title: "Rôle mis à jour",
          description: `Le rôle de l'utilisateur a été changé en ${isAdmin ? 'administrateur' : 'utilisateur standard'}.`,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de la mise à jour du rôle.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du rôle.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingRole(null);
    }
  };


  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
   
    const query = searchQuery.toLowerCase().trim();
    return users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);


  // Trier les utilisateurs: admins en haut, utilisateurs normaux en bas
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      // Tri principal par statut admin (admins en premier)
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
     
      // Tri secondaire par nom d'utilisateur
      return a.username.localeCompare(b.username);
    });
  }, [filteredUsers]);


  const handleDeleteUser = async () => {
    if (!deleteConfirmation.userId) return;
    setIsDeleting(true);
    try {
      const result = await deleteUser(deleteConfirmation.userId);
      if (result.status === 'success') {
        // Mise à jour de la liste d'utilisateurs après suppression
        setUsers(users.filter(user => user._id !== deleteConfirmation.userId));
        toast({
          title: "Utilisateur supprimé",
          description: `L'utilisateur ${deleteConfirmation.username} a été supprimé avec succès.`,
        });
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de la suppression de l'utilisateur.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'utilisateur.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmation({ open: false, userId: null, username: null });
    }
  };


  const handleResendEmail = async (userId: string, email: string, username: string) => {
    setIsResendingEmail(userId);
    try {
      const result = await resendInvitation(userId, email);
      if (result.status === 'success') {
        toast({
          title: "Email envoyé",
          description: `Un email a été renvoyé à ${email} avec un nouveau lien de connexion.`,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de l'envoi de l'email.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors du renvoi de l'email:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email.",
        variant: "destructive"
      });
    } finally {
      setIsResendingEmail(null);
    }
  };


  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Date invalide';
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-pulse text-center">
          <p className="text-lg">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={48} className={cn("mb-4 text-red-500")} />
        <h3 className="text-lg font-medium mb-1">Erreur de chargement</h3>
        <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
          {error}
        </p>
        <Button className="mt-4" onClick={loadUsers}>
          Réessayer
        </Button>
      </div>
    );
  }


  const isRootAdmin = (email: string) => {
    return email === "admin@gmail.com";
  };


  return (
    <>
      {/* Barre de recherche */}
      <div className="mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10",
              isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            )}
          />
        </div>
      </div>
     
      {sortedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle size={48} className={cn("mb-4", isDark ? "text-gray-400" : "text-gray-500")} />
          <h3 className="text-lg font-medium mb-1">Aucun utilisateur trouvé</h3>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {searchQuery ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur n'a encore été créé."}
          </p>
        </div>
      ) : (
        <div className="w-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-1/6">Utilisateur</TableHead>
                <TableHead className="w-1/4">Email</TableHead>
                <TableHead className="w-1/5">Date de création</TableHead>
                <TableHead className="w-1/5">Rôle</TableHead>
                <TableHead className="text-right w-1/5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {user.isAdmin ?
                        <ShieldCheck size={16} className={isDark ? "text-purple-400" : "text-purple-600"}/> :
                        <UserIcon size={16} className={isDark ? "text-gray-400" : "text-gray-600"}/>
                      }
                      {user.username}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.createdAt ? formatDate(user.createdAt.toString()) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.isAdmin ? "admin" : "user"}
                      onValueChange={(value) => handleChangeRole(user._id, value)}
                      disabled={isRootAdmin(user.email) || isUpdatingRole === user._id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <span className={cn(
                            "flex items-center",
                            isDark ? "text-gray-300" : "text-gray-600"
                          )}>
                            <UserIcon size={14} className="mr-2" />
                            Utilisateur
                          </span>
                        </SelectItem>
                        <SelectItem value="admin">
                          <span className={cn(
                            "flex items-center",
                            isDark ? "text-purple-300" : "text-purple-600"
                          )}>
                            <ShieldCheck size={14} className="mr-2" />
                            Admin
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          isDark ? "hover:bg-blue-900/30" : "hover:bg-blue-50"
                        )}
                        onClick={() => handleResendEmail(user._id, user.email, user.username)}
                        disabled={isResendingEmail === user._id}
                      >
                        {isResendingEmail === user._id ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <Mail size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          isDark ? "hover:bg-red-900/30" : "hover:bg-red-50"
                        )}
                        onClick={() => setDeleteConfirmation({
                          open: true,
                          userId: user._id,
                          username: user.username
                        })}
                        disabled={isRootAdmin(user.email)}
                      >
                        <Trash2 size={16} className={
                          isRootAdmin(user.email)
                            ? "text-gray-400"
                            : (isDark ? "text-red-400" : "text-red-500")
                        } />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog
        open={deleteConfirmation.open}
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{deleteConfirmation.username}</strong> ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation({ open: false, userId: null, username: null })}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

