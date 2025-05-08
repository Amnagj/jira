
import { useAuth } from "../hooks/useAuth";
import { AuthForm } from "../components/AuthForm";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Star } from "lucide-react";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

const Signup = () => {
  const { signup, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (values: { username: string; email: string; password: string }) => {
    await signup(values.username, values.email, values.password);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <StarfieldBackground />
      {theme === "dark" && <CosmicElements />}
      
      {/* Theme toggle in top right corner */}
      <div className="fixed top-4 right-4 z-30">
        <ThemeToggle />
      </div>
      
      <motion.div 
        className="w-full max-w-md cosmic-card p-8 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="absolute top-4 left-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/")}
            className={`flex items-center gap-1 ${theme === "light" ? "text-gray-700 hover:bg-gray-100" : "text-foreground hover:bg-white/5"}`}
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </Button>
        </div>
        
        <div className="mb-8 text-center">
          <motion.div 
            className="flex justify-center mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-neon relative">
              <MessageCircle size={32} className="text-white" />
              <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-40"></div>
              <Star className="absolute -top-1 -right-1 text-yellow-300 animate-twinkle" size={14} />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-3xl font-bold text-gradient mb-2 font-raleway"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Créer un compte
          </motion.h1>
          
          <motion.p 
            className={theme === "light" ? "text-gray-600" : "text-blue-100"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Rejoignez notre voyage cosmique
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <AuthForm type="signup" onSubmit={handleSubmit} isLoading={loading} />
        </motion.div>
      </motion.div>
      
      {theme === "dark" && (
        <>
          <GlowingOrb className="top-1/4 right-1/4 -z-10" size={200} color="rgba(59, 130, 246, 0.15)" />
          <GlowingOrb className="bottom-1/4 left-1/4 -z-10" size={150} color="rgba(59, 130, 246, 0.1)" />
        </>
      )}
    </div>
  );
};

export default Signup;
