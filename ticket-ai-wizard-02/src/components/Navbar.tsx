import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Home,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronDown,
  Star,
  MessageCircle,
  BarChart3,
  Upload,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import ThemeToggle from "@/components/ThemeToggle";


export const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const userDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };


    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const NavLink = ({ href, children, icon }: { href: string, children: React.ReactNode, icon: React.ReactNode }) => {
    const isActive = location.pathname === href;
   
    return (
      <Link
        to={href}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
          isActive
            ? isDark
              ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700/50"
              : "bg-blue-100 text-blue-700 border border-blue-200"
            : isDark
              ? "hover:bg-indigo-900/30 text-blue-200/80 hover:text-indigo-300"
              : "hover:bg-blue-50 text-gray-700 hover:text-blue-700"
        )}
        onClick={() => setIsOpen(false)}
      >
        {icon}
        <span>{children}</span>
      </Link>
    );
  };


  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? isDark
            ? "bg-background/80 backdrop-blur-md"
            : "bg-white/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center space-x-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center relative",
                isDark ? "bg-indigo-600 shadow-neon" : "bg-blue-600 shadow-md"
              )}>
                <UserCircle size={20} className="text-white" />
                {isDark && (
                  <div className="absolute inset-0 rounded-full bg-indigo-600 blur-md opacity-50"></div>
                )}
                <Star className="absolute -top-1 -right-1 text-yellow-300 animate-twinkle" size={12} />
              </div>
              <span className="text-xl font-bold text-gradient">MegSupport</span>
            </Link>
          </motion.div>


          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center space-x-6"
          >
            {isAuthenticated && (
              <>
                <NavLink href="/" icon={<Home size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                  Accueil
                </NavLink>
               
                {isAdmin && (
                  <>
                    <NavLink href="/admin" icon={<BarChart3 size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                      Dashboard Admin
                    </NavLink>
                    <NavLink href="/admin/upload" icon={<Upload size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                      Import des données
                    </NavLink>
                    <NavLink href="/admin/manage-users" icon={<UserCircle size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                      Gestion Utilisateurs
                    </NavLink>
                  </>
                )}
               
                <div
                  ref={userDropdownRef}
                  className="relative"
                >
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
               
                <div className="flex items-center">
                  <ThemeToggle />
                </div>
              </>
            )}
           
            {!isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  className={cn(
                    isDark
                      ? "text-blue-200/80 hover:text-indigo-300 hover:bg-indigo-900/30"
                      : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                  )}
                >
                  <Link to="/login">Se connecter</Link>
                </Button>
                <Button className="cosmic-button">
                  <Link to="/signup">S'inscrire</Link>
                </Button>
                <div className="ml-2">
                  <ThemeToggle />
                </div>
              </div>
            )}
          </motion.nav>
         
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
           
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className={isDark ? "text-indigo-300 hover:bg-indigo-900/30" : "text-blue-700 hover:bg-blue-50"}
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>
     
      {isOpen && (
        <motion.div
          className="md:hidden cosmic-card m-2 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <nav className="flex flex-col space-y-3">
            {isAuthenticated && (
              <>
                <NavLink href="/" icon={<Home size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                  Accueil
                </NavLink>


                {isAdmin && (
                  <>
                    <NavLink href="/admin" icon={<BarChart3 size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                      Dashboard Admin
                    </NavLink>
                    <NavLink href="/admin/upload" icon={<Upload size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                      Import des données
                    </NavLink>
                    <NavLink href="/admin/users" icon={<UserCircle size={18} className={isDark ? "text-indigo-300" : "text-blue-600"} />}>
                      Gestion Utilisateurs
                    </NavLink>
                  </>
                )}
               
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full w-fit",
                  isDark
                    ? "bg-indigo-900/50 text-indigo-300 border border-indigo-700/50"
                    : "bg-blue-100 text-blue-700 border border-blue-200"
                )}>
                  <UserCircle size={18} />
                  <span className="truncate max-w-[150px]">{user?.username || "Utilisateur"}</span>
                </div>
               
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center justify-start gap-2",
                    isDark
                      ? "text-blue-200/80 hover:text-indigo-300 hover:bg-indigo-900/30"
                      : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                  )}
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  <LogOut size={18} />
                  <span>Déconnexion</span>
                </Button>
              </>
            )}
           
            {!isAuthenticated && (
              <div className="flex flex-col space-y-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isDark
                      ? "text-blue-200/80 hover:text-indigo-300"
                      : "text-gray-700 hover:text-blue-700"
                  )}
                >
                  <Link to="/login">Se connecter</Link>
                </Button>
                <Button className="w-full cosmic-button">
                  <Link to="/signup">S'inscrire</Link>
                </Button>
              </div>
            )}
          </nav>
        </motion.div>
      )}
    </header>
  );
};


export default Navbar;



