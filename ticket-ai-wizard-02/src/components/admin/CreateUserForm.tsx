
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader, CheckCircle } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import {createUser} from "@/api/fastApiService";

interface CreateUserFormProps {
  onUserCreated: (newUser: any) => void;
}

export const CreateUserForm = ({ onUserCreated }: CreateUserFormProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSuccess(false);
    
    try {
      // Appeler le service API au lieu de simuler
      const response = await createUser(username, email);
      
      if (response && response.status === 'success') {
        onUserCreated(response.user);
        toast({
          title: "Utilisateur créé",
          description: `Un email a été envoyé à ${email} avec les informations de connexion.`,
        });
        setIsSuccess(true);
        setUsername("");
        setEmail("");
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Une erreur est survenue lors de la création de l'utilisateur.",
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
    <form onSubmit={handleCreateUser} className="space-y-5">
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
  );
};
