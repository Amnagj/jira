import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { createUser, getUsers } from "@/api/fastApiService";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader, CheckCircle } from "lucide-react";
import { UsersList } from "@/components/admin/UsersList";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

// Interface pour les utilisateurs
interface User {
  _id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
}

const AdminUsers = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getUsers();
      if (result.status === 'success' && result.users) {
        setUsers(result.users);
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Impossible de récupérer la liste des utilisateurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des utilisateurs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);

    try {
      const result = await createUser(username, email);

      if (result.status === 'success' && result.user) {
        const completeUser: User = {
          _id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          isAdmin: result.user.isAdmin,
          createdAt: new Date()
        };
        setUsers(prevUsers => [completeUser, ...prevUsers]);

        toast({
          title: "Utilisateur créé",
          description: `Un email a été envoyé à ${email} avec les informations de connexion.`,
        });

        setIsSuccess(true);
        setUsername("");
        setEmail("");
      } else {
        toast({
          title: "Erreur",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'utilisateur.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen relative overflow-hidden",
      isDark ? "text-white bg-[#0a1535]" : "bg-white text-gray-800"
    )}>
      {isDark && <StarfieldBackground />}
      {isDark && <CosmicElements />}
      <Navbar />

      <main className="container mx-auto pt-24 pb-16 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <div>
              <h1 className={cn(
                "text-4xl md:text-5xl font-bold text-gradient mb-2",
                isDark ? "text-white" : "text-gray-800"
              )}>
                Gestion des utilisateurs
              </h1>
              <p className={cn(
                "text-lg",
                isDark ? "text-blue-200/90" : "text-blue-700/90"
              )}>
                Créez de nouveaux comptes utilisateurs pour accéder à l'application
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className={cn(
              "p-8 relative",
              isDark ? "bg-card/70 border-white/10" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center mb-6">
                <div className={cn(
                  "p-2 rounded-lg mr-3",
                  isDark ? "bg-blue-900/50" : "bg-blue-100"
                )}>
                  <UserPlus size={24} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </div>
                <h2 className="text-xl font-medium">Ajouter un utilisateur</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nom d'utilisateur"
                    required
                    className={cn(
                      isDark ? "bg-slate-800/70 border-slate-700" : "bg-white border-gray-300"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Adresse email"
                    required
                    className={cn(
                      isDark ? "bg-slate-800/70 border-slate-700" : "bg-white border-gray-300"
                    )}
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={18} className="mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle size={18} className="mr-2" />
                        Utilisateur créé avec succès
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} className="mr-2" />
                        Créer l'utilisateur
                      </>
                    )}
                  </Button>
                </div>

                <div className={cn(
                  "bg-blue-50 p-4 rounded-lg mt-6",
                  isDark ? "bg-blue-900/20 border border-blue-900/50" : "border border-blue-200"
                )}>
                  <p className={cn(
                    "text-sm",
                    isDark ? "text-blue-300" : "text-blue-800"
                  )}>
                    <strong>Note:</strong> Un mot de passe sera généré automatiquement et envoyé
                    par email à l'utilisateur avec ses informations de connexion.
                  </p>
                </div>
              </form>
            </Card>

            <Card className={cn(
              "p-8 relative",
              isDark ? "bg-card/70 border-white/10" : "bg-white border-gray-200"
            )}>
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-medium">Informations</h2>
              </div>

              <div className="space-y-4">
                <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                  La création d'un nouvel utilisateur génère un compte avec les autorisations standards
                  (non administrateur).
                </p>

                <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                  L'utilisateur recevra un email contenant :
                </p>

                <ul className="list-disc pl-5 space-y-2">
                  <li className={isDark ? "text-gray-300" : "text-gray-700"}>
                    Son nom d'utilisateur
                  </li>
                  <li className={isDark ? "text-gray-300" : "text-gray-700"}>
                    Un mot de passe généré aléatoirement
                  </li>
                  <li className={isDark ? "text-gray-300" : "text-gray-700"}>
                    Un lien pour se connecter à l'application
                  </li>
                </ul>

                <div className="pt-4">
                  <p className={isDark ? "text-yellow-300" : "text-yellow-600"}>
                    Assurez-vous que l'adresse email est correcte et que le serveur de messagerie est correctement configuré.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {isDark && (
        <>
          <GlowingOrb className="fixed top-1/4 left-1/5 -z-10" size={250} color="rgba(79, 70, 229, 0.08)" />
          <GlowingOrb className="fixed bottom-1/4 right-1/5 -z-10" size={300} color="rgba(124, 58, 237, 0.06)" />
        </>
      )}
    </div>
  );
};

export default AdminUsers;
