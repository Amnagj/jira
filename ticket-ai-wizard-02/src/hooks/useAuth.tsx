// C:\Users\gouja\Desktop\interface+historiique recherche - Copie\ticket-ai-wizard-02\src\hooks\useAuth.tsx

import { createContext, useContext, useState, useEffect, ReactNode , useRef} from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { authenticateUser, registerUser } from "../api/mongodb";
import { refreshToken } from "../api/axiosSetup"; // Importer la fonction refreshToken
import { TOKEN_REFRESH_INTERVAL} from "../api/constants"; // Importer la fonction refreshToken


type User = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
} | null;


interface AuthContextType {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);


  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
          
          // Vérifier la validité du token
          const isValid = await refreshToken();
          if (!isValid) {
            // Si le token n'est pas valide, déconnecter l'utilisateur
            logout();
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
   
    checkAuth();
  }, []);

  
  
  useEffect(() => {
    if (user) {
      // Nettoyer tout timer existant
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      // Créer un nouveau timer pour rafraîchir le token
      refreshTimerRef.current = setInterval(async () => {
        const success = await refreshToken();
        if (!success) {
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          logout();
          toast({
            title: "Session expirée",
            description: "Votre session a expiré. Veuillez vous reconnecter.",
            variant: "destructive",
          });
        }
      }, TOKEN_REFRESH_INTERVAL);
    }
    
    // Nettoyage lors du démontage du composant
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [user]);
  
  // Écouteur d'événement pour la déconnexion automatique en cas d'expiration du token
  useEffect(() => {
    const handleTokenExpired = () => {
      logout();
      toast({
        title: "Session expirée",
        description: "Votre session a expiré. Veuillez vous reconnecter.",
        variant: "destructive",
      });
    };
   
    window.addEventListener('tokenExpired', handleTokenExpired);
   
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);



  // Dans useAuth.tsx - fonction login modifiée
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authenticateUser(email, password);
     
      // S'assurer que le token est bien stocké
      if (response && response.access_token) {
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.access_token);
        setUser(response.user);
       
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur l'IA Ticket Wizard",
        });
       
        navigate(response.user.isAdmin ? "/admin" : "/dashboard");
      } else {
        throw new Error("Réponse d'authentification invalide");
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };




 
  const signup = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const user = await registerUser(username, email, password);
     
      // Ensure the user object has id as a string
      const userWithStringId = {
        ...user,
        id: user.id.toString()
      };
     
      localStorage.setItem("user", JSON.stringify(userWithStringId));
      setUser(userWithStringId);
     
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });
     
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer votre compte",
        variant: "destructive",
      });
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };
 
  
const logout = () => {
  if (refreshTimerRef.current) {
    clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = null;
  }
 
  // Nettoyer TOUS les éléments du localStorage liés à l'état de l'application
  localStorage.removeItem("user");
  localStorage.removeItem("token");
 
  // AJOUT IMPORTANT: Nettoyer l'état des tickets
  localStorage.removeItem("ticketState");
  localStorage.removeItem("currentProcessStep");
 
  // Réinitialiser l'état utilisateur
  setUser(null);
 
  // IMPORTANT: Déclencher l'événement AVANT la navigation
  const logoutEvent = new CustomEvent('userLogout');
  window.dispatchEvent(logoutEvent);
  
  // Attendre un peu pour que les composants puissent traiter l'événement
  setTimeout(() => {
    navigate("/login");
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt!",
    });
  }, 100);
};
 
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};