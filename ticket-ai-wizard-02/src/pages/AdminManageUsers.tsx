import { useState, useEffect, useRef  } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { UserPlus, Users, RefreshCw } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { UsersList } from "@/components/admin/UsersList";
import { AdminUsersInfo } from "@/components/admin/AdminUsersInfo";
import { Button } from "@/components/ui/button";


interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}


const AdminManageUsers = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  // État pour contrôler ce qui est affiché dans le panneau de droite
  const [showUsersList, setShowUsersList] = useState(false);


  useEffect(() => {
    fetchUsers();
  }, []);


  const fetchUsers = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        const mockUsers = [
          {
            _id: "1",
            username: "admin",
            email: "admin@example.com",
            isAdmin: true,
            createdAt: new Date("2025-01-15"),
          },
          {
            _id: "2",
            username: "user1",
            email: "user1@example.com",
            isAdmin: false,
            createdAt: new Date("2025-02-10"),
          },
          {
            _id: "3",
            username: "user2",
            email: "user2@example.com",
            isAdmin: false,
            createdAt: new Date("2025-03-05"),
          },
        ];
        setUsers(mockUsers);
        setLoading(false);
        setRefreshKey((k) => k + 1); // Ajoute cette ligne pour forcer le refresh
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      setLoading(false);
    }
  };
  const fetchUsersRef = useRef(fetchUsers);
 
  // Assurez-vous que la référence est mise à jour si fetchUsers change
  useEffect(() => {
    fetchUsersRef.current = fetchUsers;
  }, [fetchUsers]);


  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    fetchUsers(); // Ceci va aussi incrémenter refreshKey
  };


  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user._id !== userId));
  };


  const toggleView = () => {
    setShowUsersList(!showUsersList);
  };


  return (
    <div
      className={cn(
        "min-h-screen relative overflow-hidden",
        isDark ? "text-white bg-[#0a1535]" : "bg-white text-gray-800"
      )}
    >
      {isDark && <StarfieldBackground />}
      {isDark && <CosmicElements />}
      <Navbar />
      <main className="container mx-auto pt-24 pb-8 px-2 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div>
            <div className="flex items-center justify-between mb-3 mt-0">
              <h1
                className={cn(
                  "md:text-3xl text-gradient",
                  isDark ? "text-white" : "text-gray-800"
                )}
              >
                Gestion des utilisateurs
              </h1>
              <Button
                onClick={toggleView}
                className={cn(
                  "flex items-center gap-2 ml-4",
                  isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
                )}
              >
                {showUsersList ? (
                  <>
                    <UserPlus size={18} /> Voir les informations
                  </>
                ) : (
                  <>
                    <Users size={18} /> Voir la liste des utilisateurs
                  </>
                )}
              </Button>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Formulaire création utilisateur - toujours visible */}
            <div className="lg:col-span-4">
              <Card
                className={cn(
                  "p-7 relative h-full min-h-[500px]",
                  isDark
                    ? "bg-card/70 border-white/10"
                    : "bg-white border-gray-200"
                )}
              >
                <div className="flex items-center mb-6">
                  <div
                    className={cn(
                      "p-2 rounded-lg mr-3",
                      isDark ? "bg-blue-900/50" : "bg-blue-100"
                    )}
                  >
                    <UserPlus
                      size={24}
                      className={isDark ? "text-blue-400" : "text-blue-600"}
                    />
                  </div>
                  <h2 className="text-xl font-medium">Ajouter un utilisateur</h2>
                </div>
                <CreateUserForm onUserCreated={handleUserCreated} />
              </Card>
            </div>


            {/* Panneau de droite: soit Information, soit Liste des utilisateurs */}
            <div className="lg:col-span-8">
              {showUsersList ? (
                <Card
                  className={cn(
                    "p-8 relative h-full min-h-[500px]",
                    isDark
                      ? "bg-card/70 border-white/10"
                      : "bg-white border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "p-2 rounded-lg mr-3",
                          isDark ? "bg-blue-900/50" : "bg-blue-100"
                        )}
                      >
                        <Users
                          size={24}
                          className={isDark ? "text-blue-400" : "text-blue-600"}
                        />
                      </div>
                      <h2 className="text-xl font-medium">Utilisateurs existants</h2>
                      <button
                        onClick={fetchUsers}
                        className={cn(
                          "ml-3 p-1 rounded hover:bg-opacity-80 transition-all",
                          isDark ? "hover:bg-slate-700" : "hover:bg-slate-200"
                        )}
                        title="Rafraîchir la liste"
                      >
                        <RefreshCw
                          size={18}
                          className={cn(
                            loading ? "animate-spin" : "",
                            isDark ? "text-blue-400" : "text-blue-600"
                          )}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[420px] pr-2 custom-scroll">
                    <UsersList onRefresh={fetchUsers} refreshKey={refreshKey} />
                  </div>
                </Card>
              ) : (
                <AdminUsersInfo />
              )}
            </div>
          </div>
        </div>
      </main>
      {isDark && (
        <>
          <GlowingOrb
            className="fixed top-1/4 left-1/5 -z-10"
            size={250}
            color="rgba(79, 70, 229, 0.08)"
          />
          <GlowingOrb
            className="fixed bottom-1/4 right-1/5 -z-10"
            size={300}
            color="rgba(124, 58, 237, 0.06)"
          />
        </>
      )}
    </div>
  );
};


export default AdminManageUsers;

