import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, Upload, Search } from 'lucide-react';


export const InstructionsAdmin = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
 
  // Gifs pour expliquer le processus
  const instructionGifs = [
    {
      title: "1. Sélectionnez votre fichier Excel",
      description: "cliquez sur Parcourir les fichiers pour sélectionner votre fichier qui doit être sous format excel ",
      icon: <FileSpreadsheet size={28} className={cn(isDark ? "text-blue-300" : "text-blue-600")} />,
      animation: { rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.1, 1] },
    },
    {
      title: "2. Importez le fichier",
      description: "Le système vérifiera automatiquement Le format du fichier et La validité des tickets (statut:Fixed)",
      icon: <Upload size={28} className={cn(isDark ? "text-blue-300" : "text-blue-600")} />,
      animation: { y: [0, -5, 0] },
    },
    {
      title: "3. Attendez le sauvegarde",
      description: "Un message affiché vous confirmera si l'importation est réussie ou signalera des erreurs.",
      icon: <Search size={28} className={cn(isDark ? "text-blue-300" : "text-blue-600")} />,
      animation: { rotate: 360 },
    }
  ];
 
  return (
    <div className={cn(
      "p-5 rounded-xl border h-full",
      isDark ? "bg-card/30 border-gray-800" : "bg-white border-gray-200"
    )}>
      <h3 className="text-base font-medium mb-4">Comment ça marche ?</h3>
      <div className="space-y-5">
        {instructionGifs.map((instruction, index) => (
          <div key={index} className="space-y-3">
            <motion.div
              className="flex items-start gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * (index + 1) }}
            >
              <div className={cn(
                "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                isDark ? "bg-blue-900/30" : "bg-blue-100"
              )}>
                <motion.div
                  animate={instruction.animation}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  {instruction.icon}
                </motion.div>
              </div>
              <div>
                <h4 className={cn(
                  "text-sm font-medium mb-1",
                  isDark ? "text-blue-300" : "text-blue-600"
                )}>
                  {instruction.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {instruction.description}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 * (index + 1) }}
              className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              {/* Ici vous pourriez ajouter des images ou des animations */}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};


export default InstructionsAdmin;

