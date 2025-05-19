import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { UserPlus, Users } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { UsersList } from "@/components/admin/UsersList";

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
      }, 1000);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUserDeleted = (userId: string) => {
    setUsers((prev) => prev.filter((user) => user._id !== userId));
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
              <h1
                className={cn(
                  " md:text-3xl  text-gradient mb-3",
                  isDark ? "text-white" : "text-gray-800"
                )}
              >
                Gestion des utilisateurs
              </h1>
            
            </div>
    

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Formulaire création utilisateur */}
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

            {/* Liste des utilisateurs avec scroll */}
            <div className="lg:col-span-8">
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
                  </div>
                </div>

                <div className="overflow-y-auto max-h-[420px] pr-2 custom-scroll">
                  <UsersList />
                </div>
              </Card>
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
