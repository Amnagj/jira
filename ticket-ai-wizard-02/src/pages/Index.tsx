import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, LogIn, UserPlus, Star, LogOut, UserCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";


const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };
 
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };


  return (
    <div className="min-h-screen text-foreground font-sourcesans relative overflow-hidden">
      {isDark && <StarfieldBackground />}
      {isDark && <CosmicElements />}
     
      {/* Header section with auth buttons */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-3">
        {isAuthenticated ? (
          <div ref={userDropdownRef} className="relative">
            <button
              className={cn(
                "flex items-center px-3 py-1.5 rounded-full space-x-2",
                isDark
                  ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/70"
                  : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
              )}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <UserCircle size={18} />
              <span className="max-w-[150px] truncate">{user?.username || "Utilisateur"}</span>
              <ChevronDown size={14} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showUserDropdown && (
              <div
                className={cn(
                  "absolute right-0 mt-2 w-48 cosmic-card p-2 z-50",
                  isDark ? "bg-background/90" : "bg-white"
                )}
              >
                <div className="py-1">
                  <button
                    className={cn(
                      "flex items-center w-full text-left px-4 py-2 rounded-lg gap-2",
                      isDark ? "hover:bg-indigo-900/30 text-blue-200/80" : "hover:bg-blue-50 text-gray-700"
                    )}
                    onClick={logout}
                  >
                    <LogOut size={16} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button
            className="cosmic-button group relative overflow-hidden"
            onClick={() => navigate("/login")}
          >
            <span className="relative z-10 flex items-center gap-2">
              <LogIn size={18} className="text-white" />
              <span>Se connecter</span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </Button>
        )}
        <ThemeToggle />
      </div>
     
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="text-center max-w-3xl mx-auto z-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            className="mb-8 flex justify-center"
            variants={itemVariants}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center relative animate-pulse-slow ${isDark ? 'bg-blue-500 shadow-neon' : 'bg-blue-600 shadow-lg'}`}>
              <MessageCircle size={40} className="text-white" />
              {isDark && <div className="absolute inset-0 rounded-full bg-blue-500 blur-md opacity-50"></div>}
              <Star className="absolute -top-1 -right-1 text-yellow-300 animate-twinkle" size={16} />
            </div>
          </motion.div>
         
          <motion.h1
            className="text-5xl md:text-8xl font-bold leading-tight mb-6 text-gradient font-raleway pb-3"
            variants={itemVariants}
            style={{ lineHeight: '1.1' }} // Adjust line height to prevent cutting off
          >
            VermegSupport
          </motion.h1>
         
          <motion.p
            className={`text-lg mb-10 max-w-xl mx-auto ${isDark ? 'text-blue-100' : 'text-blue-900'}`}
            variants={itemVariants}
          >
            Dites adieu aux files d'attente interminables : notre système intelligent priorise et résout vos tickets automatiquement !
          </motion.p>
         
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
            variants={itemVariants}
          >
            {!isAuthenticated ? (
              <>
                <Button
                  className="text-lg px-8 py-7 cosmic-button group relative overflow-hidden"
                  onClick={() => navigate("/login")}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <LogIn size={18} className="text-white" />
                    <span>Se connecter</span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="text-lg px-8 py-7 cosmic-button group relative overflow-hidden"
                  onClick={() => navigate("/dashboard")}
                >
                  <span className="relative z-10">Accéder au traitement des tickets</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </Button>
               
                {isAdmin && (
                  <Button
                    variant="outline"
                    className={`text-lg px-8 py-7 border rounded-lg transition-all duration-300 backdrop-blur-sm relative ${isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
                    onClick={() => navigate("/admin")}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span>Accéder au dashboard</span>
                    </span>
                  </Button>
                )}
              </>
            )}
          </motion.div>
         
          <motion.div
            className={`mt-16 text-sm ${isDark ? 'text-blue-200/70' : 'text-blue-700/70'}`}
            variants={itemVariants}
          >
            <p>© 2025 VermegSupport. Tous droits réservés.</p>
          </motion.div>
        </motion.div>


        {isDark && (
          <>
            <GlowingOrb className="top-1/3 left-1/4 -z-10" size={200} color="rgba(59, 130, 246, 0.2)" />
            <GlowingOrb className="bottom-1/4 right-1/4 -z-10" size={200} color="rgba(96, 165, 250, 0.15)" />
          </>
        )}
      </div>
    </div>
  );
};


export default Index;