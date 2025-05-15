import { useState, useEffect } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Search,
  Clock,
  ArrowUpRight,
} from "lucide-react";
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

export const SimilarityResults = ({
  tickets,
  loading,
  searchTime,

}: SimilarityResultsProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [sortedTickets, setSortedTickets] = useState<SimilarTicket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 5;

  useEffect(() => {
    if (tickets && tickets.length > 0) {
      const sorted = [...tickets].sort(
        (a, b) => b.similarity_score - a.similarity_score
      );
      setSortedTickets(sorted);
    } else {
      setSortedTickets([]);
      setExpandedTicket(null);
    }
  }, [tickets]);

  const filteredTickets = sortedTickets;
  useEffect(() => {
      if (sortedTickets.length > 0 && !expandedTicket) {
        setExpandedTicket(sortedTickets[0].ticket_id);
      }
    }, [sortedTickets, expandedTicket]);


  const toggleExpand = (ticketId: string) => {
    setExpandedTicket(expandedTicket === ticketId ? null : ticketId);
  };
  const getScoreColor = (score: number, isHighest: boolean): string => { 
    if (isHighest) {
      return isDark
        ? "bg-green-900/30 text-green-300"
        : "bg-green-100 text-green-800";
    }

    // Different colors for other scores based on value
    if (score >= 80) {
      return isDark
        ? "bg-blue-900/30 text-blue-300"
        : "bg-blue-100 text-blue-800";
    } else if (score >= 60) {
      return isDark
        ? "bg-amber-900/30 text-amber-300"
        : "bg-amber-100 text-amber-800";
    } else {
      return isDark
        ? "bg-slate-900/30 text-slate-300"
        : "bg-slate-100 text-slate-800";
    }
  };

  // Check if any tickets found
  if (!loading && (!tickets || tickets.length === 0)) {
    return null;
  }

  // Get highest score for coloring
  const highestScore =
    sortedTickets.length > 0 ? sortedTickets[0].similarity_score : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-xl border transition-all duration-300 overflow-hidden mb-3", // Reduced margin
        isDark ? "bg-[#0e1e34]/95 border-[#1a2a4d]" : "bg-white border-gray-200"
      )}
    >
      {/* Header Section - Reduced size */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3
            className={cn(
              "font-medium flex items-center gap-1 text-base", // Smaller text
              isDark ? "text-blue-300" : "text-blue-700"
            )}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />{" "}
                {/* Smaller icon */}
                <span>Recherche en cours...</span>
              </>
            ) : (
              <>
                <Search size={16} className="text-green-500" />{" "}
                {/* Smaller icon */}
                <span className="flex items-center gap-1">
                  <span>
                    {filteredTickets.length > 0
                      ? `Tickets similaires` // Shortened text
                      : "Résultats"}
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
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          {" "}
          {/* Reduced padding */}
        </div>
      ) : (
        <div className={cn("", isDark ? "bg-[#0a1a2e]/30" : "bg-white")}>
          {/* Results list */}
          <div className={cn("", isDark ? "bg-[#0a1a2e]/30" : "bg-white")}>
            {/* Tickets navigation bar - Smaller */}
            <div
              className={cn(
                "p-2 border-b overflow-x-auto flex space-x-1.5 no-scrollbar", // Reduced padding and spacing
                isDark
                  ? "border-[#1a2a4d] bg-[#0e1e34]/70"
                  : "border-slate-200 bg-blue-50/50"
              )}
            >
              {filteredTickets.map((ticket, index) => (
                <button
                  key={ticket.ticket_id}
                  onClick={() => toggleExpand(ticket.ticket_id)}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1.5 transition-all", // Smaller sizes
                    expandedTicket === ticket.ticket_id
                      ? isDark
                        ? "bg-blue-700 text-white shadow-md shadow-blue-900/20"
                        : "bg-blue-500 text-white shadow-sm"
                      : isDark
                      ? "bg-[#1a2a4d] text-blue-100 hover:bg-[#203251]"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  )}
                >
                  {/* Ticket ID - Smaller */}
                  <span className="font-mono text-xs">{ticket.ticket_id}</span>

                  {/* Score badge - Colored based on score and if it's the best match */}
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      getScoreColor(
                        ticket.similarity_score,
                        ticket.similarity_score === highestScore
                      )
                    )}
                  >
                    {Math.round(ticket.similarity_score)}%
                  </span>
                </button>
              ))}
            </div>

            {/* Selected ticket display */}
            <AnimatePresence>
              {expandedTicket &&
                filteredTickets.find((t) => t.ticket_id === expandedTicket) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Selected ticket content */}
                    {(() => {
                      const ticket = filteredTickets.find(
                        (t) => t.ticket_id === expandedTicket
                      )!;
                      return (
                        <div
                          className={cn(
                            "p-4 space-y-3", // Reduced padding and spacing
                            isDark
                              ? "bg-[#0e1e34]/50"
                              : "bg-gradient-to-r from-blue-50 to-blue-100/30"
                          )}
                        >
                          {/* Problem section */}
                          <div>
                            <h5
                              className={cn(
                                "text-xs font-medium mb-1.5 flex items-center gap-1", // Smaller text
                                isDark ? "text-blue-300" : "text-blue-700"
                              )}
                            >
                              <AlertTriangle
                                size={12}
                                className={
                                  isDark ? "text-blue-400" : "text-blue-500"
                                }
                              />
                              Problème identifié
                            </h5>
                            <p
                              className={cn(
                                "text-xs whitespace-pre-wrap p-2.5 rounded-md", // Smaller text and padding
                                isDark
                                  ? "bg-slate-700/50 text-slate-200"
                                  : "bg-blue-100/70 text-blue-900"
                              )}
                            >
                              {ticket.problem ||
                                "Aucun problème spécifique documenté."}
                            </p>
                          </div>

                          {/* Solution section */}
                          <div>
                            <h5
                              className={cn(
                                "text-xs font-medium mb-1.5 flex items-center gap-1", // Smaller text
                                isDark ? "text-blue-300" : "text-blue-700"
                              )}
                            >
                              <CheckCircle2
                                size={12}
                                className={
                                  isDark ? "text-blue-400" : "text-blue-500"
                                }
                              />
                              Solution proposée
                            </h5>
                            <p
                              className={cn(
                                "text-xs whitespace-pre-wrap p-2.5 rounded-md", // Smaller text and padding
                                isDark
                                  ? "bg-slate-700/50 text-slate-200"
                                  : "bg-blue-100/70 text-blue-900"
                              )}
                            >
                              {ticket.solution ||
                                "Aucune solution spécifique documentée."}
                              
                            </p>
                          </div>

                          {/* Keywords section */}
                          <div>
                            <h5
                              className={cn(
                                "text-xs font-medium mb-1.5 flex items-center gap-1", // Smaller text
                                isDark ? "text-blue-300" : "text-blue-700"
                              )}
                            >
                              <BookOpen
                                size={12}
                                className={
                                  isDark ? "text-blue-400" : "text-blue-500"
                                }
                              />
                              Mots-clés
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {" "}
                              {/* Reduced gap */}
                              {ticket.keywords.split(",").map((keyword, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-full text-xs transition-colors", // Smaller padding
                                    isDark
                                      ? "bg-blue-800/50 text-blue-200"
                                      : "bg-blue-200 text-blue-800"
                                  )}
                                >
                                  {keyword.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
};
