import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { Button } from "@/components/ui/button";
import { AdminFileUpload } from "@/components/AdminFileUpload";
import { InstructionsAdmin } from "@/components/instructionsAdmin";
import { motion } from "framer-motion";
import { useAdminTicketState } from "@/components/AdminUploadTicketStateContext";
import { X } from "lucide-react";

const AdminUpload = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  // Accéder au contexte pour obtenir l'état et les fonctions
  const { 
    adminProcessingState, 
    cancelUpload 
  } = useAdminTicketState();
  const { uploading } = adminProcessingState;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
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

      <main className="container mx-auto pt-20 pb-12 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={cn(
                  "text-2xl md:text-4xl font-bold text-gradient mb-2",
                  isDark ? "text-white" : "text-gray-800"
                )}>
                  Import de données
                </h1>
                <p className={cn(
                  "text-lg",
                  isDark ? "text-blue-200/90" : "text-blue-700/90"
                )}>
                  Importez vos nouveaux tickets résolus pour enrichir votre base de données !
                </p>
              </div>
              
              
            </div>
          </motion.div>
          
          {/* Grille pour aligner AdminFileUpload et InstructionsAdmin */}
          <div className="grid grid-cols-3 gap-8 h-[calc(100vh-240px)]">
            {/* Colonne pour AdminFileUpload (2/3 de la largeur) */}
            <motion.div
              variants={itemVariants}
              className="col-span-3 md:col-span-2 h-full"
            >
              <Card className={cn(
                "p-12 relative h-full",
                isDark ? "bg-card/70 border-white/10" : "bg-white border-gray-200"
              )}>
                <AdminFileUpload />
              </Card>
            </motion.div>
            
            {/* Colonne pour InstructionsAdmin (1/3 de la largeur) */}
            <motion.div
              variants={itemVariants}
              className="col-span-3 md:col-span-1 h-full"
            >
              <Card className={cn(
                "p-6 relative h-full flex flex-col justify-center",
                isDark ? "bg-card/70 border-white/10" : "bg-white border-gray-200"
              )}>
                <div className="flex items-center justify-center h-full">
                  <InstructionsAdmin />
                </div>
              </Card>
            </motion.div>
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

export default AdminUpload;