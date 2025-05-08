import { useState } from "react";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { Clock, X, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { useTicketState } from "@/components/TicketStateContext";
import { getTicketsByIds } from "@/api/fastApiService";
import { useToast } from "@/components/ui/use-toast";
import { CircleLoader } from "@/components/ui/circle-loader";
import { Info } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
// Mise à jour du composant SearchHistory.tsx
// Ajout des interfaces pour les détails de tickets et scores de similarité

interface HistoryItem {
  id: string;
  queryText: string;
  timestamp: number;
  ticketIds?: string[];
}

interface TicketDetail {
  ticket_id: string;
  problem: string;
  solution: string;
  keywords?: string;
  similarity_score?: number;  // Ajout du score de similarité
}

export function SearchHistory(): JSX.Element {
  const { history, deleteFromHistory, clearHistory, loading } = useSearchHistory();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === "dark";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState<boolean>(false);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);  // État pour afficher/masquer les détails
  const [currentDetails, setCurrentDetails] = useState<TicketDetail[]>([]);  // État pour stocker les détails actuels
  
  // Accès aux fonctions du contexte de ticket pour mettre à jour l'affichage
  const {
    setInitialMessage,
    setTicketIds,
    setSearchResults
  } = useTicketState();

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
  
// Dans SearchHistory.tsx, modifiez la fonction handleViewDetails pour ajouter une vérification et un message d'état:

  // Dans SearchHistory.tsx, remplacez la fonction handleViewDetails par celle-ci
  const handleViewDetails = async (item: HistoryItem): Promise<void> => {
    try {
      setLoadingDetails(true);
      // Si l'élément contient des IDs de tickets
      if (item.ticketIds && item.ticketIds.length > 0) {
        console.log(`Récupération des détails pour l'élément ${item.id} avec ${item.ticketIds.length} tickets`);
        console.log("Tickets IDs recherchés:", item.ticketIds);
        
        // Récupérer les détails complets des tickets directement via la route /tickets/details
        const ticketsResponse = await getTicketsByIds(item.ticketIds);
        console.log("Détails des tickets récupérés:", ticketsResponse);
        
        if (ticketsResponse.status === "success" && ticketsResponse.tickets && ticketsResponse.tickets.length > 0) {
          // Vérifier combien de tickets ont été trouvés avec succès (avec un problem non vide)
          const foundTickets = ticketsResponse.tickets.filter((t: TicketDetail) => 
            t.problem && t.problem !== "Ticket non trouvé" && t.problem !== "Ticket non trouvé dans la base de données");
          
          // Stocker les détails pour l'affichage dans le panneau
          setCurrentDetails(ticketsResponse.tickets);
          setDetailsVisible(true);
          
          // Mettre à jour l'état global avec les tickets récupérés
          setSearchResults(ticketsResponse.tickets);
          
          // Adapter le message selon le nombre de tickets trouvés
          let responseMessage;
          if (foundTickets.length > 0) {
            // Utiliser le meilleur match trouvé
            const bestMatch = foundTickets[0];
            responseMessage = `
  Résultat de l'historique pour: "${item.queryText}"
  **Problème identifié:** ${bestMatch.problem}
  **Solution:** ${bestMatch.solution}
  *Recherche effectuée le ${formatDate(item.timestamp)}*
  ${foundTickets.length < item.ticketIds.length ? 
    `⚠ Attention: Seulement ${foundTickets.length} tickets sur ${item.ticketIds.length} ont été trouvés.` : ''}
  `;
          } else {
            // Aucun ticket trouvé avec des données valides
            responseMessage = `
  Résultat de l'historique pour: "${item.queryText}"
  ⚠ **Attention:** Aucun des tickets associés à cette recherche n'a pu être trouvé avec des données valides.
  *Recherche effectuée le ${formatDate(item.timestamp)}*
  Causes possibles:
  - Les IDs stockés ne correspondent pas au format attendu dans la base de données
  - Les tickets ont été supprimés ou modifiés depuis cette recherche
  `;
          }
          
          setInitialMessage(responseMessage);
          setTicketIds(ticketsResponse.tickets.map((t: TicketDetail) => t.ticket_id));
          
          toast({
            title: foundTickets.length > 0 ? "Recherche restaurée" : "Attention",
            description: foundTickets.length > 0
              ? `${foundTickets.length} résultats de recherche ont été chargés`
              : "Les tickets associés n'ont pas pu être retrouvés avec des données valides",
            variant: foundTickets.length > 0 ? "default" : "destructive"
          });
        } else {
          // Aucun ticket n'a été trouvé
          toast({
            title: "Attention",
            description: "Les tickets associés à cette recherche n'ont pas pu être retrouvés dans la base de données.",
            variant: "destructive"
          });
          
          // Afficher quand même le panneau de détails vide
          setCurrentDetails([]);
          setDetailsVisible(true);
          
          // Créer un message d'erreur explicatif
          const errorMessage = `
  Recherche historique: "${item.queryText}" (effectuée le ${formatDate(item.timestamp)})
  ⚠ **Erreur de correspondance des IDs:**
  Les IDs stockés dans l'historique (${item.ticketIds.join(', ')}) n'ont pas pu être trouvés dans la base de données des tickets.
  Veuillez vérifier la correspondance entre les IDs dans la collection "Historique_Messages" et les "_id" dans la collection "tickets".
  `;
          setInitialMessage(errorMessage);
        }
      } else {
        // Informer l'utilisateur qu'il n'y a pas de tickets associés
        toast({
          title: "Données insuffisantes",
          description: "Impossible de restaurer cette recherche car elle ne contient pas de tickets associés",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des détails:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement des détails",
        variant: "destructive"
      });
    } finally {
      setLoadingDetails(false);
    }
  };
  // Fonction pour fermer le panneau de détails
  const closeDetails = (): void => {
    setDetailsVisible(false);
  };

  // Formatage de la date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      "border rounded-xl h-full flex flex-col relative",
      isDark ? "bg-card/30 border-gray-800" : "bg-white border-gray-200"
    )}>
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isDark ? "border-gray-800" : "border-gray-200"
      )}>
        <h3 className="font-medium flex items-center gap-2">
          <Clock size={18} className={isDark ? "text-blue-400" : "text-blue-600"} />
          Historique de recherche
        </h3>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-100/10 -mr-2"
            onClick={() => setIsClearDialogOpen(true)}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
      
      {/* Panneau de détails qui s'affiche par-dessus la liste quand detailsVisible est vrai */}
      {detailsVisible && (
        <div className={cn(
          "absolute inset-0 z-20 flex flex-col bg-card rounded-xl border",
          isDark ? "border-gray-800" : "border-gray-200"
        )}>
          <div className={cn(
            "p-4 border-b flex items-center justify-between",
            isDark ? "border-gray-800" : "border-gray-200"
          )}>
            <h3 className="font-medium flex items-center gap-2">
              <Info size={18} className={isDark ? "text-blue-400" : "text-blue-600"} />
              Détails de la recherche
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeDetails}
              className="-mr-2"
            >
              <X size={16} />
            </Button>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {currentDetails.length > 0 ? (
              <div className="space-y-4">
                {currentDetails.map((ticket, index) => (
                  <div 
                    key={ticket.ticket_id} 
                    className={cn(
                      "border rounded-lg p-4",
                      isDark ? "border-gray-800" : "border-gray-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Ticket ID: {ticket.ticket_id}</div>
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Score: {ticket.similarity_score ? `${ticket.similarity_score.toFixed(2)}%` : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1 text-muted-foreground">Problème:</div>
                      <div className="text-sm">{ticket.problem}</div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="text-sm font-medium mb-1 text-muted-foreground">Solution:</div>
                      <div className="text-sm">{ticket.solution}</div>
                    </div>
                    
                    {ticket.keywords && (
                      <div>
                        <div className="text-sm font-medium mb-1 text-muted-foreground">Mots-clés:</div>
                        <div className="flex flex-wrap gap-1">
                          {ticket.keywords.split(',').map((keyword, i) => (
                            <span 
                              key={i} 
                              className={cn(
                                "px-2 py-1 rounded-full text-xs",
                                isDark ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-800"
                              )}
                            >
                              {keyword.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Aucun détail disponible
              </div>
            )}
          </ScrollArea>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <CircleLoader size="medium" />
          </div>
        ) : history.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            Aucune recherche récente
          </div>
        ) : (
          <div className="py-2">
            {history.map((item: HistoryItem) => (
              <div key={item.id} className="group">
                <div className={cn(
                  "px-4 py-2 hover:bg-muted/40 flex justify-between items-start",
                  isDark ? "hover:bg-gray-800/50" : "hover:bg-gray-50"
                )}>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    <p className="text-sm font-medium truncate" title={item.queryText}>
                      {item.queryText}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.timestamp)}
                    </p>
                    {item.ticketIds && item.ticketIds.length > 0 && (
                      <p className="text-xs mt-1 text-blue-500">
                        {item.ticketIds.length} ticket{item.ticketIds.length > 1 ? 's' : ''} trouvé{item.ticketIds.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6"
                      onClick={() => handleViewDetails(item)}
                      title="Voir les détails"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6"
                      onClick={() => handleDeleteClick(item.id)}
                      title="Supprimer"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {loadingDetails && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 rounded-xl">
          <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
            <CircleLoader size="small" />
            <span>Chargement des détails...</span>
          </div>
        </div>
      )}
      
      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cet élément sera définitivement supprimé de votre historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog de confirmation pour tout effacer */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer tout l'historique ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Tout votre historique de recherche sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className="bg-red-600 hover:bg-red-700">
              Tout effacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}