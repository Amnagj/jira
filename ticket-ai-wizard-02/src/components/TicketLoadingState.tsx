import { useState, useEffect } from "react";
import {
  Loader2,
  Clock,
  Search,
  Tag,
  FileText,
  Activity,
  BarChart,
  Info,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";

export const TicketLoadingState = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [animationPhase, setAnimationPhase] = useState(0);
  const [loadingText, setLoadingText] = useState("Préparation de l'analyse");
  const [progressPercentage, setProgressPercentage] = useState(5);
  const [loadingDots, setLoadingDots] = useState("");
  const [loadingSteps, setLoadingSteps] = useState<
    { title: string; completed: boolean; icon: JSX.Element }[]
  >([
    {
      title: "Extraction des données",
      completed: false,
      icon: <Search size={14} />,
    },
    {
      title: "Identification des mots-clés",
      completed: false,
      icon: <Tag size={14} />,
    },
    {
      title: "Recherche de tickets similaires",
      completed: false,
      icon: <FileText size={14} />,
    },
    {
      title: "Analyse des correspondances",
      completed: false,
      icon: <Activity size={14} />,
    },
    {
      title: "Préparation des résultats",
      completed: false,
      icon: <Zap size={14} />,
    },
  ]);

  const [loadingStats, setLoadingStats] = useState<
    { label: string; value: number; max: number; icon: JSX.Element }[]
  >([
    {
      label: "Tickets analysés",
      value: 0,
      max: 345,
      icon: <FileText size={14} />,
    },
    {
      label: "Correspondances",
      value: 0,
      max: 12,
      icon: <Activity size={14} />,
    },
    {
      label: "Score de similarité",
      value: 0,
      max: 100,
      icon: <BarChart size={14} />,
    },
  ]);

  // Nouvel état pour suivre les paires de cartes statistiques à afficher
  const [visibleStatCards, setVisibleStatCards] = useState<number[]>([]);

  // Animation des points de chargement
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(dotsInterval);
  }, []);

  // Simuler différentes phases d'analyse pour montrer le progrès à l'utilisateur
  useEffect(() => {
    const phases = [
      "Préparation de l'analyse",
      "Extraction des mots-clés",
      "Comparaison avec tickets existants",
      "Analyse des similarités",
      "Finalisation des résultats",
    ];

    let currentPhase = 0;
    const phaseTimer = setInterval(() => {
      currentPhase = (currentPhase + 1) % phases.length;
      setAnimationPhase(currentPhase);
      setLoadingText(phases[currentPhase]);

      setProgressPercentage(Math.min(5 + currentPhase * 23, 95));

      // Mettre à jour les étapes complétées
      setLoadingSteps((prev) =>
        prev.map((step, idx) => ({
          ...step,
          completed: idx <= currentPhase,
        }))
      );

      // Mise à jour des statistiques animées - mais seulement pour les cartes visibles
      setLoadingStats((prev) =>
        prev.map((stat, idx) => {
          const progressFactor = (currentPhase + 1) / phases.length;
          let newValue = Math.floor(
            stat.max * progressFactor * (0.7 + Math.random() * 0.3)
          );

          // Pour le score de similarité, on veut qu'il monte plus progressivement
          if (idx === 2) {
            newValue = Math.min(
              Math.floor((currentPhase + 1) * 20 + Math.random() * 10),
              100
            );
          }

          return {
            ...stat,
            value: Math.min(newValue, stat.max),
          };
        })
      );
    }, 2300);

    return () => clearInterval(phaseTimer);
  }, []);

  // Nouvel effet pour faire défiler les cartes statistiques visibles
  useEffect(() => {
    // Commencer avec les deux premières cartes
    setVisibleStatCards([0, 1]);

    // Minuteur pour faire défiler les cartes visibles
    const cardTimer = setInterval(() => {
      setVisibleStatCards((prev) => {
        // Logique pour faire défiler les cartes : passer à la paire suivante ou revenir au début
        if (prev[0] === 0 && prev[1] === 1) {
          return [1, 2]; // Montrer les cartes 1 et 2
        } else if (prev[0] === 1 && prev[1] === 2) {
          return [0, 2]; // Montrer les cartes 0 et 2
        } else {
          return [0, 1]; // Revenir aux cartes 0 et 1
        }
      });
    }, 7000); // Modifié de 3000 à 7000 pour afficher pendant 7 secondes

    return () => clearInterval(cardTimer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "bg-gradient-to-r p-6 max-w-4xl mx-auto rounded-2xl",
        isDark ? "from-slate-900 to-blue-900/40" : "from-slate-50 to-blue-50"
      )}
    >
      <div className="flex flex-col items-center w-full max-w-lg mx-auto">
        {/* Animated loader with creative design */}
        <div className="relative mb-8 mt-2">
          <motion.div
            animate={{
              boxShadow: [
                `0 0 0 0 ${
                  isDark ? "rgba(59, 130, 246, 0)" : "rgba(37, 99, 235, 0)"
                }`,
                `0 0 0 20px ${
                  isDark ? "rgba(59, 130, 246, 0.2)" : "rgba(37, 99, 235, 0.1)"
                }`,
                `0 0 0 0 ${
                  isDark ? "rgba(59, 130, 246, 0)" : "rgba(37, 99, 235, 0)"
                }`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              isDark
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20"
                : "bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/20"
            )}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-b from-transparent to-black/20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-b from-transparent to-black/20"
            >
              <Search className="w-7 h-7 text-white" />
            </motion.div>

            </div>
          </motion.div>
        </div>

        <div className="w-full px-0 md:px-4">
          {/* Loading status text */}
          <div className="flex flex-col items-center mb-6">
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={cn(
                "text-base font-medium mb-4",
                isDark ? "text-blue-300" : "text-blue-700"
              )}
            >
              {loadingText}
            </motion.span>

            {/* Progress path */}
            <div className="relative w-full mb-6">
              <div
                className={cn(
                  "h-1 rounded-full overflow-hidden",
                  isDark ? "bg-slate-700/50" : "bg-slate-200"
                )}
              >
                <motion.div
                  initial={{ width: "5%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "h-full rounded-full",
                    isDark
                      ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"
                      : "bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500"
                  )}
                />
              </div>

              {/* Progress dots */}
              <div className="flex justify-between w-full mt-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isActive = (progressPercentage / 100) * 5 >= i;
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8 }}
                      animate={{
                        scale: isActive ? [1, 1.2, 1] : 0.8,
                        opacity: isActive ? 1 : 0.5,
                      }}
                      transition={{
                        duration: isActive ? 0.5 : 0,
                        repeat: isActive ? Infinity : 0,
                        repeatDelay: 1,
                      }}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isActive
                          ? isDark
                            ? "bg-blue-400"
                            : "bg-blue-500"
                          : isDark
                          ? "bg-slate-600"
                          : "bg-slate-300"
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Processing steps - Horizontal timeline */}
            <div className="w-full mb-8">
              <div className="relative flex justify-between">
                {loadingSteps.map((step, index) => {
                  const isActive = step.completed;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <motion.div
                        initial={{ opacity: 0.5, y: 10 }}
                        animate={{
                          opacity: isActive ? 1 : 0.6,
                          y: isActive ? 0 : 5,
                        }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center"
                      >
                        {/* Icon background */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                            isActive
                              ? isDark
                                ? "bg-gradient-to-br from-blue-600 to-blue-800"
                                : "bg-gradient-to-br from-blue-500 to-blue-700"
                              : isDark
                              ? "bg-blue-900/50"
                              : "bg-blue-100"
                          )}
                        >
                          <div
                            className={cn(
                              isActive
                                ? "text-white"
                                : isDark
                                ? "text-blue-400"
                                : "text-blue-500"
                            )}
                          >
                            {step.icon}
                          </div>
                        </div>

                        {/* Step label - hidden on mobile */}
                        <span
                          className={cn(
                            "text-xs text-center hidden sm:block",
                            isActive
                              ? isDark
                                ? "text-blue-300"
                                : "text-blue-700"
                              : isDark
                              ? "text-slate-500"
                              : "text-slate-500"
                          )}
                        >
                          {step.title.split(" ")[0]}
                        </span>
                      </motion.div>
                    </div>
                  );
                })}

                {/* Connecting line */}
                <div
                  className={cn(
                    "absolute top-5 left-0 right-0 h-0.5 -z-10",
                    isDark ? "bg-slate-700" : "bg-slate-200"
                  )}
                />

                {/* Progress line */}
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(
                      (loadingSteps.filter((s) => s.completed).length /
                        loadingSteps.length) *
                        100,
                      100
                    )}%`,
                  }}
                  className={cn(
                    "absolute top-5 left-0 h-0.5 -z-10",
                    isDark ? "bg-blue-500" : "bg-blue-600"
                  )}
                />
              </div>
            </div>

            {/* Analytics cards avec apparition/disparition progressive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {loadingStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: visibleStatCards.includes(index) ? 1 : 0,
                    y: visibleStatCards.includes(index) ? 0 : 10,
                    scale: visibleStatCards.includes(index) ? 1 : 0.95,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                  className={cn(
                    "bg-gradient-to-b p-4 rounded-xl border shadow-sm",
                    isDark
                      ? "from-blue-900/20 to-blue-800/30 border-blue-800/30"
                      : "from-white to-blue-50 border-blue-100"
                  )}
                >
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center",
                        isDark ? "bg-blue-800/50" : "bg-blue-100"
                      )}
                    >
                      <div
                        className={cn(
                          isDark ? "text-blue-300" : "text-blue-600"
                        )}
                      >
                        {stat.icon}
                      </div>
                    </div>
                    <span
                      className={cn(isDark ? "text-blue-300" : "text-blue-600")}
                    >
                      {stat.label}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className={cn(
                          "text-2xl font-bold",
                          isDark ? "text-blue-200" : "text-blue-600"
                        )}
                      >
                        {stat.value}
                        {stat.label.includes("Score") ? "%" : ""}
                      </motion.div>
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          isDark
                            ? "bg-blue-800/40 text-blue-300"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {Math.round((stat.value / stat.max) * 100)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className={cn(
                        "h-1 rounded-full overflow-hidden mt-1",
                        isDark ? "bg-blue-900/50" : "bg-blue-100"
                      )}
                    >
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn(
                          "h-full rounded-full",
                          isDark
                            ? "bg-gradient-to-r from-blue-500 to-blue-400"
                            : "bg-gradient-to-r from-blue-600 to-blue-400"
                        )}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
