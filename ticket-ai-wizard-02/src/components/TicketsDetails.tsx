import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Tag,
  Calendar,
  ListFilter,
  Activity,
  FileText,
  Layers,
  HelpCircle,
  BarChart,
  Users,
  GitBranch,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";

interface TicketDetailsProps {
  ticketData: Record<string, any> | null;
  loading: boolean;
}

export const TicketDetails = ({ ticketData, loading }: TicketDetailsProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [visibleFields, setVisibleFields] = useState<
    Array<{ key: string; displayName: string }>
  >([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedTicketPairs, setDisplayedTicketPairs] = useState<
    Array<Array<{ key: string; displayName: string }>>
  >([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);

  // Simuler le temps de traitement qui s'écoule
  useEffect(() => {
    if (displayedTicketPairs.length > 0 && loading) {
      const interval = setInterval(() => {
        if (currentPairIndex + 1 < displayedTicketPairs.length) {
          setCurrentPairIndex(currentPairIndex + 1);
          // Ajouter les champs de la paire actuelle aux champs visibles
          if (currentPairIndex < displayedTicketPairs.length) {
            const fieldsToAdd = displayedTicketPairs[currentPairIndex].map(field => field);
            setVisibleFields(prevFields => [...prevFields, ...fieldsToAdd]);
          }
        }
      }, 3000); // Accéléré à 3 secondes pour une meilleure UX
      return () => clearInterval(interval);
    }
  }, [displayedTicketPairs, loading, currentPairIndex]);

  useEffect(() => {
    if (ticketData) {
      // Définir les champs prioritaires avec leurs noms d'affichage
      const priorityFieldsMap = [
        { key: "key", displayName: "Clé du ticket" },
        { key: "summary", displayName: "Résumé" },
        { key: "priority", displayName: "Priorité" },
        { key: "status", displayName: "Statut" },
        { key: "type", displayName: "Type" },
        { key: "created_date", displayName: "Date de création" },
        { key: "client_project", displayName: "Projet client" },
        { key: "impact", displayName: "Impact" },
        { key: "root_cause", displayName: "Cause" },
        { key: "assignee", displayName: "Assigné à" },
        { key: "reporter", displayName: "Rapporté par" },
        { key: "Components", displayName: "Composants" },
        { key: "git_branch", displayName: "Branche git" },
      ];

      // Filtrer les champs disponibles et valides
      const availableFields = priorityFieldsMap.filter(
        (field) =>
          ticketData[field.key] !== undefined &&
          ticketData[field.key] !== null &&
          ticketData[field.key] !== ""
      );

      // Commencer avec les 2 premiers champs (clé et résumé) comme visibles
      const initialVisibleFields = availableFields.slice(0, 2);
      setVisibleFields(initialVisibleFields);

      // Organisation améliorée des champs pour un affichage plus équilibré
      let ticketGroups: Array<Array<{ key: string; displayName: string }>> = [];
      
      // La clé du ticket en premier
      const keyField = availableFields.find((field) => field.key === "key");
      if (keyField) {
        ticketGroups.push([keyField]);
      }
      
      // Ensuite le résumé
      const summaryField = availableFields.find(
        (field) => field.key === "summary"
      );
      if (summaryField) {
        ticketGroups.push([summaryField]);
      }
      
      // Regrouper les champs restants en paires mais de manière plus équilibrée
      const otherFields = availableFields.filter(
        (field) => field.key !== "key" && field.key !== "summary"
      );
      
      // Grouper par paires pour un affichage en grille uniforme
      for (let i = 0; i < otherFields.length; i += 2) {
        const pair = [];
        pair.push(otherFields[i]);
        
        if (i + 1 < otherFields.length) {
          pair.push(otherFields[i + 1]);
        }
        ticketGroups.push(pair);
      }
      
      setDisplayedTicketPairs(ticketGroups);
      setCurrentPairIndex(0);
    } else {
      setVisibleFields([]);
      setDisplayedTicketPairs([]);
    }
  }, [ticketData]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Fonction pour obtenir l'icône appropriée pour un champ
  const getFieldIcon = (key: string) => {
    switch (key) {
      case "key":
        return (
          <Tag
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "summary":
        return (
          <Info
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "description":
        return (
          <FileText
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "priority":
        return (
          <Activity
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "status":
        return (
          <ListFilter
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "created_date":
      case "updated_date":
        return (
          <Calendar
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "assignee":
      case "reporter":
      case "participants":
        return (
          <Users
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "Components":
        return (
          <Layers
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "impact":
        return (
          <BarChart
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "git_branch":
        return (
          <GitBranch
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      case "comment":
        return (
          <MessageSquare
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
      default:
        return (
          <HelpCircle
            size={14}
            className={cn(isDark ? "text-indigo-300" : "text-indigo-600")}
          />
        );
    }
  };

  // Fonction pour obtenir la couleur de priorité
  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (
      priorityLower.includes("high") ||
      priorityLower.includes("haute") ||
      priorityLower.includes("critic")
    ) {
      return isDark ? "text-red-400 bg-red-900/30" : "text-red-700 bg-red-200";
    } else if (
      priorityLower.includes("medium") ||
      priorityLower.includes("moyenne")
    ) {
      return isDark
        ? "text-amber-400 bg-amber-900/30"
        : "text-amber-700 bg-amber-200";
    }
    return isDark
      ? "text-green-400 bg-green-900/30"
      : "text-green-700 bg-green-200";
  };

  // Fonction pour obtenir la couleur de statut
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (
      statusLower.includes("done") ||
      statusLower.includes("terminé") ||
      statusLower.includes("resolved")
    ) {
      return isDark
        ? "text-blue-300 bg-blue-900/40" // Bleu pour done (thème sombre)
        : "text-blue-700 bg-blue-100"; // Bleu pour done (thème clair)
    } else if (
      statusLower.includes("progress") ||
      statusLower.includes("cours") ||
      statusLower.includes("open")
    ) {
      return isDark
        ? "text-cyan-400 bg-cyan-900/30" // Cyan pour en cours (thème sombre)
        : "text-cyan-700 bg-cyan-100"; // Cyan pour en cours (thème clair)
    } else if (
      statusLower.includes("blocked") ||
      statusLower.includes("bloqué")
    ) {
      return isDark ? "text-red-400 bg-red-900/30" : "text-red-700 bg-red-200";
    }
    return isDark
      ? "text-blue-400 bg-blue-900/20" // Default bleu (thème sombre)
      : "text-blue-700 bg-blue-50"; // Default bleu (thème clair)
  };

  // Fonction pour formater la valeur d'un champ avec amélioration de la troncature
  const formatFieldValue = (key: string, value: string) => {
    if (key === "priority") {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
            value
          )}`}
        >
          {value}
        </span>
      );
    }
    
    if (key === "status") {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            value
          )}`}
        >
          {value}
        </span>
      );
    }
    
    // Pour les dates, formater pour une meilleure lisibilité
    if (key === "created_date" || key === "updated_date") {
      try {
        // Essayer de formater la date si possible
        const dateObj = new Date(value);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch (e) {
        // En cas d'échec, retourner la valeur d'origine
      }
    }

    // Pour les textes longs, amélioration de la troncature avec tooltip
    if (typeof value === 'string' && value.length > 150) {
      return (
        <div className="relative group">
          <div className="truncate max-w-full">
            {value.substring(0, 150)}
            <span className="text-blue-500">...</span>
          </div>
          <div className="hidden group-hover:block absolute z-50 p-2 mt-1 rounded-lg shadow-lg max-w-md bg-gray-900 text-white text-sm">
            {value}
          </div>
        </div>
      );
    }
    
    return value;
  };

  if (!loading && !ticketData) return null;
  
  // Design modernisé et unifié pour l'affichage des détails du ticket
  return (
    <div className="w-full mb-4">
      {ticketData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn("w-full mx-auto", loading ? "opacity-90" : "")}
        >
          {/* En-tête avec chronomètre intégré */}
          <div
            className={cn(
              "sticky top-2 z-10 backdrop-blur-md rounded-xl mb-2 py-2 px-3",
              isDark
                ? "bg-blue-950/80 text-blue-100 border border-blue-900/50"
                : "bg-blue-50/90 text-blue-800 border border-blue-100"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 border-t-transparent shadow-lg",
                        isDark ? "border-blue-400" : "border-blue-500"
                      )}
                    />
                    <motion.span
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "font-semibold px-3 py-1 rounded-lg",
                        isDark
                          ? "bg-blue-900 text-blue-200"
                          : "bg-blue-100 text-blue-800"
                      )}
                    >
                      Analyse en cours
                    </motion.span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0.5, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, type: "spring" }}
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center",
                        isDark ? "bg-green-900/30" : "bg-green-100"
                      )}
                    >
                      <CheckCircle2
                        size={12}
                        className={cn(
                          isDark ? "text-green-400" : "text-green-600"
                        )}
                      />
                    </motion.div>
                    <span className="text-sm font-medium">
                      Détails du ticket
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Bouton d'expansion */}
                {visibleFields.length > 0 && (
                  <button
                    onClick={toggleExpand}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      isDark
                        ? "hover:bg-slate-700 text-slate-300"
                        : "hover:bg-slate-100 text-slate-500"
                    )}
                  >
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contenu des détails du ticket avec animation */}
          <AnimatePresence>
            {isExpanded && visibleFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Champs clé et résumé sur toute la largeur */}
                <div className="grid gap-2 mb-2 grid-cols-1">
                  {visibleFields
                    .filter(field => field.key === "key" || field.key === "summary")
                    .map((field, fieldIndex) => (
                      <motion.div
                        key={`${field.key}-${fieldIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: fieldIndex * 0.05 }}
                        className={cn(
                          "p-3 rounded-lg shadow-sm",
                          isDark
                            ? "bg-gradient-to-br from-blue-900/20 to-blue-800/40 border border-blue-800/20"
                            : "bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/30"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center",
                              isDark ? "bg-blue-700/50" : "bg-blue-200"
                            )}
                          >
                            {getFieldIcon(field.key)}
                          </div>
                          <div
                            className={cn(
                              "text-xs font-medium",
                              isDark ? "text-blue-200" : "text-blue-700"
                            )}
                          >
                            {field.displayName}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "mt-2 p-2 rounded-md",
                            isDark ? "bg-blue-900/20" : "bg-blue-50/80"
                          )}
                        >
                          {formatFieldValue(
                            field.key,
                            String(ticketData[field.key])
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>

                {/* Autres champs en grille 2x2 */}
                <div className="grid gap-2 mb-2 grid-cols-1 md:grid-cols-2">
                  {visibleFields
                    .filter(field => field.key !== "key" && field.key !== "summary")
                    .map((field, fieldIndex) => (
                      <motion.div
                        key={`${field.key}-${fieldIndex}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: fieldIndex * 0.05 }}
                        className={cn(
                          "p-2.5 rounded-lg shadow-sm h-full",
                          isDark
                            ? "bg-blue-900/10 border border-blue-800/30"
                            : "bg-white border border-blue-100/80"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center",
                              isDark ? "bg-blue-800/50" : "bg-blue-100"
                            )}
                          >
                            {getFieldIcon(field.key)}
                          </div>
                          <div
                            className={cn(
                              "text-sm",
                              isDark ? "text-blue-300" : "text-blue-700"
                            )}
                          >
                            {field.displayName}
                          </div>
                        </div>
                        <div
                          className={cn(
                            "mt-2 p-2 rounded-md",
                            isDark ? "bg-blue-900/20" : "bg-blue-50/80"
                          )}
                        >
                          {formatFieldValue(
                            field.key,
                            String(ticketData[field.key])
                          )}
                        </div>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
