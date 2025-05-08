
import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { FileSpreadsheet, Upload, Search } from 'lucide-react';

export const TicketInstructions = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "p-6 rounded-xl border",
      isDark ? "bg-card/30 border-gray-800" : "bg-white border-gray-200"
    )}>
      <h3 className="text-lg font-medium mb-4">Comment ça marche ?</h3>
      <div className="space-y-6">
        {/* Étape 1 */}
        <motion.div 
          className="flex items-start gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center",
            isDark ? "bg-blue-900/30" : "bg-blue-100"
          )}>
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <FileSpreadsheet size={28} className={cn(
                isDark ? "text-blue-300" : "text-blue-600"
              )} />
            </motion.div>
          </div>
          <div>
            <h4 className={cn(
              "text-sm font-medium mb-1",
              isDark ? "text-blue-300" : "text-blue-600"
            )}>
              1. Sélectionnez votre ticket
            </h4>
            <p className="text-sm text-muted-foreground">
              Préparez votre ticket au format Excel (.xlsx ou .xls)
            </p>
          </div>
        </motion.div>

        {/* Étape 2 */}
        <motion.div 
          className="flex items-start gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center",
            isDark ? "bg-blue-900/30" : "bg-blue-100"
          )}>
            <motion.div
              animate={{ 
                y: [0, -5, 0],
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <Upload size={28} className={cn(
                isDark ? "text-blue-300" : "text-blue-600"
              )} />
            </motion.div>
          </div>
          <div>
            <h4 className={cn(
              "text-sm font-medium mb-1",
              isDark ? "text-blue-300" : "text-blue-600"
            )}>
              2. Importez le ticket
            </h4>
            <p className="text-sm text-muted-foreground">
              Glissez-déposez ou cliquez pour sélectionner le fichier
            </p>
          </div>
        </motion.div>

        {/* Étape 3 */}
        <motion.div 
          className="flex items-start gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center",
            isDark ? "bg-blue-900/30" : "bg-blue-100"
          )}>
            <motion.div
              animate={{ 
                rotate: 360
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Search size={28} className={cn(
                isDark ? "text-blue-300" : "text-blue-600"
              )} />
            </motion.div>
          </div>
          <div>
            <h4 className={cn(
              "text-sm font-medium mb-1",
              isDark ? "text-blue-300" : "text-blue-600"
            )}>
              3. Attendez l'analyse
            </h4>
            <p className="text-sm text-muted-foreground">
              Notre système analyse votre ticket et trouve la meilleure solution
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
