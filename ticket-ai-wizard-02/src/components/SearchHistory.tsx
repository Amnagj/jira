import { useState } from "react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import {
  Clock,
  X,
  Trash2,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTicketState } from "@/components/TicketStateContext";
import { getTicketsByIds } from "@/api/fastApiService";
import { useToast } from "@/components/ui/use-toast";
import { CircleLoader } from "@/components/ui/circle-loader";




import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";




interface HistoryItem {
  id: string;
  queryText: string;
  timestamp: number;
  ticketIds?: string[];
  similarity_score?: number | null;
}




interface TicketDetail {
  ticket_id: string;
  problem: string;
  solution: string;
  keywords?: string;
  similarity_score?: number;
}




export function SearchHistory(): JSX.Element {
  const { history, deleteFromHistory, clearHistory, loading } =
    useSearchHistory();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === "dark";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
  const [currentDetails, setCurrentDetails] = useState<TicketDetail[]>([]);
  const [activeTicketIndex, setActiveTicketIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { setInitialMessage, setTicketIds, setSearchResults } =
    useTicketState();




  const handleDeleteClick = (id: string): void => {
    setSelectedId(id);
    setIsDeleteDialogOpen(true);
  };




  const confirmDelete = (): void => {
    if (selectedId) {
      deleteFromHistory(selectedId);
    }
    setIsDeleteDialogOpen(false);
  };




  const confirmClearAll = (): void => {
    clearHistory();
    setIsClearDialogOpen(false);
  };
  const filteredHistory = history.filter((item) =>
    item.queryText.toLowerCase().includes(searchQuery.toLowerCase())
  );




  const handleViewDetails = async (item: HistoryItem): Promise<void> => {
    try {
      setLoadingDetails(true);
      if (item.ticketIds && item.ticketIds.length > 0) {
        console.log(
          `Récupération des détails pour l'élément ${item.id} avec ${item.ticketIds.length} tickets`
        );
        console.log("Tickets IDs recherchés:", item.ticketIds);




        const ticketsResponse = await getTicketsByIds(item.ticketIds);
        console.log("Détails des tickets récupérés:", ticketsResponse);




        if (
          ticketsResponse.status === "success" &&
          ticketsResponse.tickets &&
          ticketsResponse.tickets.length > 0
        ) {
          const foundTickets = ticketsResponse.tickets.filter(
            (t: TicketDetail) =>
              t.problem &&
              t.problem !== "Ticket non trouvé" &&
              t.problem !== "Ticket non trouvé dans la base de données"
          );




          // Appliquer le score de similarité uniquement au premier ticket (best match)
          if (
            item.similarity_score &&
            foundTickets.length > 0 &&
            item.ticketIds
          ) {
            foundTickets.forEach((ticket: TicketDetail, index: number) => {
              if (index === 0 && ticket.ticket_id === item.ticketIds[0]) {
                ticket.similarity_score = item.similarity_score;
              } else {
                // Pour les autres tickets, on ne montre pas de score
                ticket.similarity_score = undefined;
              }
            });
          }




          setCurrentDetails(ticketsResponse.tickets);
          setDetailsVisible(true);
          setActiveTicketIndex(0);




          let responseMessage;
          if (foundTickets.length > 0) {
            const bestMatch = foundTickets[0];
            responseMessage = `
  Résultat de l'historique pour: "${item.queryText}"
  **Problème identifié:** ${bestMatch.problem}
  **Solution:** ${bestMatch.solution}
  *Recherche effectuée le ${formatDate(item.timestamp)}*
  ${
    foundTickets.length < item.ticketIds.length
      ? `⚠ Attention: Seulement ${foundTickets.length} tickets sur ${item.ticketIds.length} ont été trouvés.`
      : ""
  }
  `;
          } else {
            responseMessage = `
  Résultat de l'historique pour: "${item.queryText}"
  ⚠ **Attention:** Aucun des tickets associés à cette recherche n'a pu être trouvé avec des données valides.
  *Recherche effectuée le ${formatDate(item.timestamp)}*
  Causes possibles:
  - Les IDs stockés ne correspondent pas au format attendu dans la base de données
  - Les tickets ont été supprimés ou modifiés depuis cette recherche
  `;
          }




          toast({
            title:
              foundTickets.length > 0 ? "Recherche restaurée" : "Attention",
            description:
              foundTickets.length > 0
                ? `${foundTickets.length} résultats de recherche ont été chargés`
                : "Les tickets associés n'ont pas pu être retrouvés avec des données valides",
            variant: foundTickets.length > 0 ? "default" : "destructive",
          });
        } else {
          toast({
            title: "Attention",
            description:
              "Les tickets associés à cette recherche n'ont pas pu être retrouvés dans la base de données.",
            variant: "destructive",
          });




          setCurrentDetails([]);
          setDetailsVisible(true);




          const errorMessage = `
  Recherche historique: "${item.queryText}" (effectuée le ${formatDate(
            item.timestamp
          )})
  ⚠ **Erreur de correspondance des IDs:**
  Les IDs stockés dans l'historique (${item.ticketIds.join(
    ", "
  )}) n'ont pas pu être trouvés dans la base de données des tickets.
  Veuillez vérifier la correspondance entre les IDs dans la collection "Historique_Messages" et les "_id" dans la collection "tickets".
  `;
          setInitialMessage(errorMessage);
        }
      } else {
        toast({
          title: "Données insuffisantes",
          description:
            "Impossible de restaurer cette recherche car elle ne contient pas de tickets associés",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des détails",
        variant: "destructive",
      });
    } finally {
      setLoadingDetails(false);
    }
  };




  const closeDetails = (): void => {
    setDetailsVisible(false);
  };




  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };




  const nextTicket = () => {
    if (currentDetails.length > activeTicketIndex + 1) {
      setActiveTicketIndex(activeTicketIndex + 1);
    }
  };




  const prevTicket = () => {
    if (activeTicketIndex > 0) {
      setActiveTicketIndex(activeTicketIndex - 1);
    }
  };




  return (
    <div
      className={cn(
        "border rounded-xl h-full flex flex-col relative max-h-[calc(100vh-120px)]",
        isDark
          ? "bg-gradient-to-br from-[#0c1631] via-[#101a3b]/90 to-[#0c1631] border-[#1a2756]"
          : "bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 border-blue-800 shadow-md"
      )}
      style={{ height: "calc(100vh - 120px)" }}
    >
      <div
        className={cn(
          "p-3 border-b flex flex-col gap-2 sticky top-0 z-10",
          isDark
            ? "border-[#1a2756] bg-[#0c1631] backdrop-blur-sm"
            : "border-blue-600 bg-blue-700/90 backdrop-blur-sm"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Clock
              size={16}
              className={isDark ? "text-indigo-400" : "text-white"}
            />
            <span className={isDark ? "text-indigo-200" : "text-white"}>
              Historique de recherche
            </span>
          </h3>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-red-500 hover:text-red-600 -mr-2 transition-all duration-600",
                isDark ? "hover:bg-red-950/30" : "hover:bg-red-50"
              )}
              onClick={() => setIsClearDialogOpen(true)}
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher dans l'historique..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 pl-8",
              isDark
                ? "bg-blue-900/50 border border-blue-800 text-blue-100 placeholder-blue-400/70 focus:ring-blue-500"
                : "bg-white/90 border border-blue-400 text-blue-900 placeholder-blue-500/70 focus:ring-blue-600"
            )}
          />
          <Search
            size={14}
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2",
              isDark ? "text-blue-400" : "text-blue-500"
            )}
          />
        </div>
      </div>




      {detailsVisible && (
        <div
          className={cn(
            "absolute inset-0 z-20 flex flex-col rounded-xl border shadow-lg transition-all duration-600",
            isDark
              ? "bg-gradient-to-br from-[#0c1631] via-[#101a3b]/90 to-[#0c1631] border-[#1a2756]"
              : "bg-gradient-to-br from-blue-100 via-white to-blue-100/50 border-blue-600"
          )}
        >
          <div
            className={cn(
              "px-4 py-3 border-b flex items-center justify-between",
              isDark
                ? "border-blue-900 bg-gradient-to-r from-blue-950 to-blue-900"
                : "border-blue-600 bg-gradient-to-r from-blue-700 to-blue-600 text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeDetails}
                className={cn(
                  "p-1 h-8 w-8 rounded-full transition-all duration-200",
                  isDark
                    ? "text-indigo-400 hover:bg-[#1a2756]/70"
                    : "text-white hover:bg-white/10"
                )}
              >
                <ChevronLeft size={16} />
              </Button>
              <h3 className="font-medium flex items-center gap-2">
                <Info
                  size={18}
                  className={isDark ? "text-indigo-400" : "text-white"}
                />
                <span className={isDark ? "text-indigo-200" : "text-white"}>
                  Détails de la recherche
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {currentDetails.length > 1 && (
                <div
                  className={cn(
                    "px-3 py-1 rounded-full text-xs",
                    isDark
                      ? "bg-blue-800 text-indigo-200"
                      : "bg-blue-500 text-white"
                  )}
                >
                  {currentDetails.length} tickets similaires
                </div>
              )}
            </div>
          </div>




          <ScrollArea
            className="flex-1 p-4 overflow-auto"
            scrollbarClassName={cn(
              "w-2 transition-colors",
              isDark
                ? "bg-blue-950/20 hover:bg-blue-900/40"
                : "bg-blue-100/40 hover:bg-blue-200/60"
            )}
            thumbClassName={cn(
              "rounded-full w-1.5 transition-colors",
              isDark
                ? "bg-blue-600/70 hover:bg-blue-500"
                : "bg-blue-500/70 hover:bg-blue-600"
            )}
          >
            {currentDetails.length > 0 ? (
              <div className="relative">
               
                {currentDetails.map((ticket, index) => (
                  <div
                    key={ticket.ticket_id}
                    className={cn(
                      "border rounded-xl shadow-lg transition-all duration-500 mb-4", // Ajout de mb-4 pour l'espacement
                      isDark
                        ? "border-[#1a2756] bg-gradient-to-br from-[#101a3b] to-[#0c1631"
                        : "border-blue-600 bg-gradient-to-br from-white to-blue-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex justify-between items-center p-3 rounded-t-xl",
                        isDark
                          ? "bg-gradient-to-r from-[#1a2756] to-[#232f6a] border-b border-[#1a2756]"
                          : "bg-gradient-to-r from-blue-600 to-blue-500 text-white border-b border-blue-400"
                      )}
                    >
                      <div className="font-medium text-white flex items-center gap-2">
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            isDark ? "bg-blue-900" : "bg-blue-700"
                          )}
                        >
                          <Search size={12} className="text-white" />
                        </div>
                        Ticket: {ticket.ticket_id}
                      </div>
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                          isDark
                            ? index === 0
                              ? "bg-emerald-900 text-emerald-200"
                              : "bg-amber-800 text-amber-100"
                            : index === 0
                            ? "bg-emerald-600 text-white"
                            : "bg-amber-600 text-white"
                        )}
                      >
                        {index === 0 && ticket.similarity_score ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                            Score: {Math.round(ticket.similarity_score)}%
                          </>
                        ) : (
                          "Similaire"
                        )}
                      </div>
                    </div>




                    <div className="p-4 space-y-6">
                      <div>
                        <div
                          className={cn(
                            "text-sm font-medium mb-2 flex items-center gap-1.5",
                            isDark ? "text-indigo-400" : "text-blue-700"
                          )}
                        >
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center",
                              isDark ? "bg-blue-800" : "bg-blue-100"
                            )}
                          >
                            <span
                              className={
                                isDark ? "text-indigo-200" : "text-blue-700"
                              }
                            >
                              ?
                            </span>
                          </div>
                          Problème:
                        </div>
                        <div
                          className={cn(
                            "text-sm p-4 rounded-lg border",
                            isDark
                              ? "bg-[#101a3b]/50 text-indigo-100 border-[#1a2756] shadow-inner shadow-[#070d24]/50"
                              : "bg-blue-50 text-blue-900 border-blue-200 shadow-inner shadow-blue-100"
                          )}
                        >
                          {ticket.problem}
                        </div>
                      </div>




                      <div>
                        <div
                          className={cn(
                            "text-sm font-medium mb-2 flex items-center gap-1.5",
                            isDark ? "text-indigo-400" : "text-blue-700"
                          )}
                        >
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center",
                              isDark ? "bg-blue-800" : "bg-blue-100"
                            )}
                          >
                            <span
                              className={
                                isDark ? "text-indigo-200" : "text-blue-700"
                              }
                            >
                              !
                            </span>
                          </div>
                          Solution:
                        </div>
                        <div
                          className={cn(
                            "text-sm p-4 rounded-lg border",
                            isDark
                              ? "bg-[#101a3b]/50 text-indigo-100 border-[#1a2756] shadow-inner shadow-[#070d24]/50"
                              : "bg-blue-50 text-blue-900 border-blue-200 shadow-inner shadow-blue-100"
                          )}
                        >
                          {ticket.solution}
                        </div>
                      </div>




                      {ticket.keywords && (
                        <div>
                          <div
                            className={cn(
                              "text-sm font-medium mb-2 flex items-center gap-1.5",
                              isDark ? "text-indigo-400" : "text-blue-700"
                            )}
                          >
                            <div
                              className={cn(
                                "h-5 w-5 rounded-full flex items-center justify-center",
                                isDark ? "bg-blue-800" : "bg-blue-100"
                              )}
                            >
                              <span
                                className={
                                  isDark ? "text-indigo-200" : "text-blue-700"
                                }
                              >
                                #
                              </span>
                            </div>
                            Mots-clés:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {ticket.keywords.split(",").map((keyword, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "px-2 py-1 rounded-full text-xs transition-colors duration-200",
                                  isDark
                                    ? "bg-[#1a2756] text-indigo-200 hover:bg-[#232f6a]"
                                    : "bg-blue-600 text-white hover:bg-blue-500"
                                )}
                              >
                                {keyword.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={cn(
                  "text-center p-8 rounded-lg border shadow-md",
                  isDark
                    ? "text-indigo-400 border-blue-800 bg-blue-900/50"
                    : "text-indigo-400 border-blue-200 bg-blue-50"
                )}
              >
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center",
                      isDark ? "bg-blue-900" : "bg-blue-100"
                    )}
                  >
                    <Info
                      size={24}
                      className={isDark ? "text-blue-400" : "text-blue-500"}
                    />
                  </div>
                  <div>
                    <p className="font-medium">Aucun détail disponible</p>
                    <p
                      className={cn(
                        "text-sm mt-1",
                        isDark ? "text-indigo-400/60" : "text-blue-500/70"
                      )}
                    >
                      Les tickets associés n'ont pas pu être retrouvés
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      )}




      {/* Zone principale de défilement de l'historique - Modifications ici */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea
          className="h-full w-full"
          scrollbarClassName={cn(
            "w-2 transition-colors",
            isDark
              ? "bg-blue-950/20 hover:bg-blue-900/40"
              : "bg-blue-100/40 hover:bg-blue-200/60"
          )}
          thumbClassName={cn(
            "rounded-full w-1.5 transition-colors",
            isDark
              ? "bg-blue-600/70 hover:bg-blue-500"
              : "bg-blue-500/70 hover:bg-blue-600"
          )}
        >
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-lg",
                  isDark ? "bg-blue-900/50" : "bg-blue-50"
                )}
              >
                <CircleLoader size="medium" />
                <span className={isDark ? "text-indigo-400" : "text-indigo-400"}>
                  Chargement de l'historique...
                </span>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div
              className={cn(
                "p-8 text-center flex flex-col items-center gap-4",
                isDark ? "text-indigo-400" : "text-indigo-400"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  isDark
                    ? "bg-gradient-to-br from-blue-900 to-blue-800 shadow-lg shadow-blue-950/30"
                    : "bg-gradient-to-br from-blue-100 to-blue-50 shadow-md shadow-blue-200/30"
                )}
              >
                <Search
                  size={32}
                  className={isDark ? "text-indigo-400" : "text-blue-500"}
                />
              </div>
              <div>
                <p className="font-medium text-lg">Aucun résultat</p>
                <p
                  className={cn(
                    "text-sm mt-2",
                    isDark ? "text-indigo-400/60" : "text-blue-500/70"
                  )}
                >
                  Aucune recherche ne correspond à "{searchQuery}"
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2">
              {filteredHistory.map((item: HistoryItem, idx) => (
                <div key={item.id} className="group">
                  <div
                    className={cn(
                      "px-4 py-3 flex justify-between items-start transition-all duration-600 relative",
                      isDark
                        ? "hover:bg-blue-900/40 group-hover:border-l-2 group-hover:border-l-blue-500"
                        : "hover:bg-blue-50 group-hover:border-l-2 group-hover:border-l-blue-500"
                    )}
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleViewDetails(item)}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isDark ? "text-blue-100" : "text-blue-800"
                        )}
                        title={item.queryText}
                      >
                        {item.queryText}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <div
                          className={cn(
                            "flex items-center text-xs gap-1",
                            isDark ? "text-blue-400/80" : "text-indigo-400/80"
                          )}
                        >
                          <Calendar size={12} />
                          {formatDate(item.timestamp)}
                        </div>
                        {item.ticketIds && item.ticketIds.length > 0 && (
                          <div
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                              isDark
                                ? "bg-blue-800/70 text-indigo-200"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            {item.ticketIds.length} ticket
                            {item.ticketIds.length > 1 ? "s" : ""}
                          </div>
                        )}
                        {item.similarity_score && (
                          <div
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                              isDark
                                ? "bg-emerald-900/70 text-emerald-200"
                                : "bg-emerald-100 text-emerald-700"
                            )}
                          >
                            <div className="w-1 h-1 rounded-full bg-current"></div>
                            {Math.round(item.similarity_score)}%
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full transition-all duration-600",
                          isDark
                            ? "hover:bg-blue-800/80 text-indigo-400"
                            : "hover:bg-blue-100 text-indigo-400"
                        )}
                        onClick={() => handleViewDetails(item)}
                        title="Voir les détails"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full transition-all duration-600",
                          isDark
                            ? "hover:bg-red-900/60 text-red-600"
                            : "hover:bg-red-100 text-red-500"
                        )}
                        onClick={() => handleDeleteClick(item.id)}
                        title="Supprimer"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 h-px transition-all duration-600",
                        idx === history.length - 1 ? "hidden" : "",
                        isDark
                          ? "bg-gradient-to-r from-transparent via-indigo-800/20 to-transparent"
                          : "bg-gradient-to-r from-transparent via-blue-200 to-transparent"
                      )}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>




      {loadingDetails && (
        <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
          <div
            className={cn(
              "p-5 rounded-lg shadow-lg flex items-center gap-4 animate-pulse",
              isDark ? "bg-[#101a3b]/90" : "bg-white"
            )}
          >
            <CircleLoader size="small" />
            <span className={isDark ? "text-blue-100" : "text-blue-800"}>
              Chargement des détails...
            </span>
          </div>
        </div>
      )}


      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent
          className={cn(
            isDark
              ? "bg-[#0c1631] border border-[#1a2756] text-blue-100"
              : "bg-white border border-blue-200"
          )}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? "text-blue-100" : ""}>
              Supprimer cet élément ?
            </AlertDialogTitle>
            <AlertDialogDescription className={isDark ? "text-indigo-400" : ""}>
              Cette action ne peut pas être annulée. Cet élément sera
              définitivement supprimé de votre historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={
                isDark
                  ? "bg-blue-900 text-indigo-200 border-blue-700 hover:bg-blue-800"
                  : ""
              }
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={cn(
                "transition-all duration-200",
                isDark
                  ? "bg-red-900 hover:bg-red-800 text-red-100"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent
          className={cn(
            isDark
              ? "bg-[#0c1631] border border-[#1a2756] text-indigo-100"
              : "bg-white border border-blue-200"
          )}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={isDark ? "text-blue-100" : ""}>
              Effacer tout l'historique ?
            </AlertDialogTitle>


            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Tout votre historique de
              recherche sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Tout effacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



