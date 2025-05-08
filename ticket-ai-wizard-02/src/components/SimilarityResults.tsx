import { useState, useEffect } from "react";
import { Loader2, ChevronDown, ChevronUp, BookOpen, CheckCircle2, AlertTriangle, Search, Clock, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SimilarTicket {
  ticket_id: string;
  problem: string;
  solution: string;
  keywords: string;
  similarity_score: number;
}

interface SimilarityResultsProps {
  tickets?: SimilarTicket[];
  loading: boolean;
  searchTime?: number;
}

export const SimilarityResults = ({ tickets, loading, searchTime }: SimilarityResultsProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [sortedTickets, setSortedTickets] = useState<SimilarTicket[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [allKeywords, setAllKeywords] = useState<string[]>([]);

  // Sort tickets by similarity score and extract all unique keywords
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      // Sort tickets by similarity score (highest first)
      const sorted = [...tickets].sort((a, b) => b.similarity_score - a.similarity_score);
      setSortedTickets(sorted);
      
      // Extract all unique keywords
      const keywordSet = new Set<string>();
      sorted.forEach(ticket => {
        ticket.keywords.split(',').forEach(keyword => {
          keywordSet.add(keyword.trim());
        });
      });
      setAllKeywords(Array.from(keywordSet).slice(0, 10)); // Limit to top 10 keywords
    } else {
      setSortedTickets([]);
    }
  }, [tickets]);

  // Filter tickets by selected keyword
  const filteredTickets = selectedKeyword
    ? sortedTickets.filter(ticket => ticket.keywords.includes(selectedKeyword))
    : sortedTickets;

  // Expand the first ticket by default
  useEffect(() => {
    if (sortedTickets.length > 0 && !expandedTicket) {
      setExpandedTicket(sortedTickets[0].ticket_id);
    }
  }, [sortedTickets, expandedTicket]);

  const toggleExpand = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };

  // Check if any tickets found
  if (!loading && (!tickets || tickets.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-xl border transition-all duration-300 overflow-hidden mb-4",
        isDark ? "bg-slate-800/95 border-slate-700" : "bg-white border-gray-200"
      )}
    >
      {/* Header Section - modernisé et avec taille augmentée */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "font-medium flex items-center gap-2 text-lg", // Taille augmentée ici
            isDark ? "text-blue-300" : "text-blue-700"
          )}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {/* Taille augmentée */}
                <span>Recherche en cours...</span>
              </>
            ) : (
              <>
                <Search size={18} className="text-green-500" /> {/* Taille augmentée */}
                <span className="flex items-center gap-1">
                  <span>
                    {filteredTickets.length > 0
                      ? `Tickets similaires`  // Texte modifié sans afficher le nombre
                      : "Résultats de recherche"}
                  </span>
                </span>
              </>
            )}
          </h3>
          {searchTime && (
            <div className="flex items-center text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
              <Clock size={12} className="mr-1" />
              <span>{searchTime.toFixed(2)}s</span>
            </div>
          )}
        </div>
        
        {/* Keywords filter - style amélioré */}
        {!loading && allKeywords.length > 0 && (
          <div className="mt-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {selectedKeyword && (
                <button
                  onClick={() => setSelectedKeyword(null)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs flex items-center transition-all",
                    isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  )}
                >
                  <span>Tous</span>
                </button>
              )}
              {allKeywords.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => setSelectedKeyword(keyword === selectedKeyword ? null : keyword)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all",
                    keyword === selectedKeyword
                      ? isDark
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-blue-500 text-white shadow-sm"
                      : isDark
                        ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  )}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center p-12">
          
        </div>
      ) : (
        <div className={cn(
          "divide-y divide-slate-200 dark:divide-slate-700",
          isDark ? "bg-slate-900/30" : "bg-white"
        )}>
          {/* Results list */}
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket, index) => (
              <div
                key={ticket.ticket_id}
                className={cn(
                  "transition-colors duration-200",
                  expandedTicket === ticket.ticket_id
                    ? isDark ? "bg-slate-800" : "bg-slate-50"
                    : "",
                  isDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50/80"
                )}
              >
                <div
                  className="p-4 cursor-pointer relative"
                  onClick={() => toggleExpand(ticket.ticket_id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {/* Similarity score indicator - corrigé */}
                      <div className="relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden shadow-inner">
                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700/50"></div>
                        <div className="absolute inset-0">
                          <CircularProgress
                            percentage={Math.round(ticket.similarity_score )}
                            color={getSimilarityColor(ticket.similarity_score, isDark)}
                          />
                        </div>
                        <span className="relative z-10 font-medium text-sm">
                          {Math.round(ticket.similarity_score )}% {/* Correction pour afficher correctement le pourcentage */}
                        </span>
                      </div>

                      {/* Ticket information */}
                      <div className="flex-grow">
                        <h4 className={cn(
                          "font-medium flex items-center flex-wrap gap-1",
                          isDark ? "text-white" : "text-slate-800"
                        )}>
                          <span className="font-mono">{ticket.ticket_id}</span>
                          {index === 0 &&
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full dark:bg-green-800/30 dark:text-green-400 font-medium flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Best match</span>
                            </span>
                          }
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ticket.keywords.split(',').slice(0, 3).map((keyword, i) => (
                            <span key={i} className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              keyword.trim() === selectedKeyword
                                ? isDark ? "bg-blue-600/30 text-blue-300"
                                : "bg-blue-100 text-blue-800"
                                : isDark ? "bg-slate-700 text-slate-300"
                                : "bg-slate-100 text-slate-600"
                            )}>
                              {keyword.trim()}
                            </span>
                          ))}
                          {ticket.keywords.split(',').length > 3 && (
                            <span className="text-xs text-slate-400 px-1">
                              +{ticket.keywords.split(',').length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {expandedTicket === ticket.ticket_id ? (
                        <ChevronUp size={20} className={isDark ? "text-blue-400" : "text-blue-600"} />
                      ) : (
                        <ChevronDown size={20} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                  {expandedTicket === ticket.ticket_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        "p-6 pt-0 ml-4 pl-12 space-y-4 border-l-2",
                        isDark
                          ? "bg-slate-800/50 border-l-slate-600"
                          : "bg-slate-50/60 border-l-slate-200"
                      )}>
                        {/* Problem section */}
                        <div>
                          <h5 className={cn(
                            "text-sm font-medium mb-2 flex items-center gap-1",
                            isDark ? "text-blue-300" : "text-blue-700"
                          )}>
                            <AlertTriangle size={14} className={isDark ? "text-amber-400" : "text-amber-500"} />
                            Problème identifié
                          </h5>
                          <p className={cn(
                            "text-sm whitespace-pre-wrap p-3 rounded-md",
                            isDark ? "bg-slate-700/50 text-slate-200" : "bg-slate-100 text-slate-700"
                          )}>
                            {ticket.problem || "Aucun problème spécifique documenté."}
                          </p>
                        </div>

                        {/* Solution section */}
                        <div>
                          <h5 className={cn(
                            "text-sm font-medium mb-2 flex items-center gap-1",
                            isDark ? "text-green-300" : "text-green-700"
                          )}>
                            <CheckCircle2 size={14} className={isDark ? "text-green-400" : "text-green-500"} />
                            Solution proposée
                          </h5>
                          <p className={cn(
                            "text-sm whitespace-pre-wrap p-3 rounded-md",
                            isDark ? "bg-slate-700/50 text-slate-200" : "bg-slate-100 text-slate-700"
                          )}>
                            {ticket.solution || "Aucune solution spécifique documentée."}
                          </p>
                        </div>

                        {/* Keywords section */}
                        {ticket.keywords && (
                          <div>
                            <h5 className={cn(
                              "text-sm font-medium mb-2 flex items-center gap-1",
                              isDark ? "text-purple-300" : "text-purple-700"
                            )}>
                              <BookOpen size={14} className={isDark ? "text-purple-400" : "text-purple-500"} />
                              Mots-clés
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {ticket.keywords.split(',').map((keyword, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "px-2 py-1 rounded-full text-xs transition-colors",
                                    keyword.trim() === selectedKeyword
                                      ? isDark
                                        ? "bg-blue-600/50 text-blue-200"
                                        : "bg-blue-200 text-blue-800"
                                      : isDark
                                        ? "bg-slate-700 text-slate-300"
                                        : "bg-slate-200 text-slate-700"
                                  )}
                                >
                                  {keyword.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <AlertTriangle size={32} className={isDark ? "text-amber-400" : "text-amber-500"} />
              <h4 className="text-lg font-medium mb-2">Aucun ticket similaire</h4>
              <p className="text-sm opacity-70">
                Nous n'avons pas trouvé de tickets similaires dans notre base de connaissances.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Circular progress component for similarity score - corrigé pour afficher correctement le pourcentage
const CircularProgress = ({ percentage, color }: { percentage: number, color: string }) => {
  const circumference = 2 * Math.PI * 18; // 18 is the radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <svg className="w-full h-full" viewBox="0 0 40 40">
      {/* Background circle */}
      <circle
        className="text-slate-200 dark:text-slate-700"
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
        r="18"
        cx="20"
        cy="20"
      />
      {/* Progress circle */}
      <circle
        className="transition-all duration-300 ease-in-out"
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        stroke={color}
        fill="transparent"
        r="18"
        cx="20"
        cy="20"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
};

// Fonction pour déterminer la couleur du badge en fonction du score de similarité
function getSimilarityColor(score: number, isDark: boolean): string {
  if (score >= 0.8) {
    return isDark ? "#10b981" : "#10b981"; // vert/green
  } else if (score >= 0.6) {
    return isDark ? "#3b82f6" : "#3b82f6"; // bleu/blue
  } else if (score >= 0.4) {
    return isDark ? "#f59e0b" : "#f59e0b"; // ambre/amber
  } else {
    return isDark ? "#6b7280" : "#6b7280"; // gris/gray
  }
}