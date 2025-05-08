// Correction dans useSearchHistory.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getSearchHistory, hideHistoryItem, clearSearchHistory, addSearchToHistory } from "../api/fastApiService";




interface SearchHistoryItem {
  id: string;
  timestamp: number;
  queryText: string;
  result: string;
  ticketIds?: string[];
  visible: boolean;
}


interface SearchHistoryContextType {
  history: SearchHistoryItem[];
  loading: boolean;
  refreshHistory: () => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  addToHistory: (item: { queryText: string; result: string; ticketIds?: string[] }) => Promise<void>;
}


const SearchHistoryContext = createContext<SearchHistoryContextType | undefined>(undefined);


export function SearchHistoryProvider({ children }: { children: ReactNode }) {
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();


  // Charger l'historique depuis l'API quand l'utilisateur est authentifié
  // Modification: ajout d'un useEffect qui s'exécute au montage du composant et
  // à chaque changement d'utilisateur ou d'état d'authentification
  useEffect(() => {
    const loadHistory = async () => {
      if (isAuthenticated && user?.id) {
        // Charger les éléments masqués depuis le localStorage
        const hiddenItemsKey = `hidden_history_${user.id}`;
        const storedHiddenItems = JSON.parse(localStorage.getItem(hiddenItemsKey) || '[]');
        setHiddenItems(storedHiddenItems);
       
        await refreshHistory();
      } else {
        // Réinitialiser l'historique et les éléments masqués si l'utilisateur n'est pas connecté
        setHistory([]);
        setHiddenItems([]);
      }
    };
   
    loadHistory();
  }, [isAuthenticated, user?.id]);


  // Récupérer l'historique depuis l'API
  // Dans useSearchHistory.tsx, modifiez la fonction refreshHistory comme suit:


const refreshHistory = async () => {
  if (!isAuthenticated || !user?.id) {
    console.log("Impossible de rafraîchir l'historique: utilisateur non connecté");
    return;
  }
 
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error("Token non trouvé");
      setHistory([]);
      setLoading(false);
      return;
    }
   
    console.log("Récupération de l'historique pour l'utilisateur:", user.id);
    console.log("Token utilisé:", token.substring(0, 10) + '...');
    const response = await getSearchHistory();
    console.log("Réponse de l'API historique:", response);
   
    if (response.status === 'success' && Array.isArray(response.history)) {
      // Récupérer les IDs des éléments masqués depuis le localStorage
      const hiddenItemsKey = `hidden_history_${user.id}`;
      const hiddenItems = JSON.parse(localStorage.getItem(hiddenItemsKey) || '[]');
     
      // Filtrer les éléments masqués localement
      const filteredHistory = response.history.filter(item => !hiddenItems.includes(item.id));
     
      setHistory(filteredHistory);
    } else {
      console.warn("Aucun historique disponible ou format de réponse incorrect:", response);
      // N'afficher le toast que s'il y a un message d'erreur réel
      if (response.status === 'error') {
        toast({
          title: "Avertissement",
          description: response.message || "Aucun historique disponible",
          variant: "default"
        });
      }
      // S'assurer que l'historique est vide si aucune donnée n'est disponible
      setHistory([]);
    }
  } catch (error: any) {
    console.error("Erreur lors du chargement de l'historique:", error);
    toast({
      title: "Erreur",
      description: error.message || "Impossible de charger l'historique",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};


 
// Supprimer un élément de l'historique


const deleteFromHistory = async (id: string) => {
  if (!isAuthenticated || !user?.id) return;
 
  try {
    // Stocker les IDs des éléments masqués dans le localStorage
    const hiddenItemsKey = `hidden_history_${user.id}`;
    let hiddenItems = JSON.parse(localStorage.getItem(hiddenItemsKey) || '[]');
   
    // Ajouter l'ID de l'élément à masquer
    if (!hiddenItems.includes(id)) {
      hiddenItems.push(id);
      localStorage.setItem(hiddenItemsKey, JSON.stringify(hiddenItems));
    }
   
    // Mettre à jour l'état local pour masquer l'élément sans appeler l'API
    setHistory(prev => prev.filter(item => item.id !== id));
   
    toast({
      title: "Succès",
      description: "L'élément a été retiré de l'historique.",
    });
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'élément",
        variant: "destructive"
      });
    }
  };


  // Effacer tout l'historique
  // Dans useSearchHistory.tsx, remplacez la fonction clearHistory par celle-ci:


  const clearHistory = async () => {
    if (!isAuthenticated || !user?.id) return;
  
    try {
      // Récupérer tous les IDs de l'historique actuel
      const allItemIds = history.map(item => item.id);
    
      // Stocker tous les IDs dans le localStorage pour les masquer
      const hiddenItemsKey = `hidden_history_${user.id}`;
      localStorage.setItem(hiddenItemsKey, JSON.stringify(allItemIds));
    
      // Vider l'historique dans l'interface utilisateur
      setHistory([]);
    
      toast({
        title: "Historique effacé",
        description: "Votre historique de recherche a été effacé.",
      });
    } catch (error: any) {
      console.error("Erreur lors de l'effacement:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'effacer l'historique",
        variant: "destructive"
      });
    }
  };


// Dans useSearchHistory.tsx, modifiez la fonction addToHistory comme ceci:
const addToHistory = async (item: { queryText: string; result: string; ticketIds?: string[] }) => {
  if (!isAuthenticated || !user?.id) {
    console.log("Impossible d'ajouter à l'historique: utilisateur non connecté");
    return { status: "error", message: "Utilisateur non connecté" };
  }
  try {
    console.log("Ajout à l'historique:", item.queryText);
    // Appeler l'API pour ajouter à l'historique dans la base de données
    // Passer directement les ticketIds à l'API au lieu de les extraire du résultat
    const response = await addSearchToHistory(item.queryText, {
      result: item.result,
      ticketIds: item.ticketIds || []
    });
    
    if (response.status === 'success' && response.item) {
      // Créer le nouvel élément avec l'ID retourné par l'API
      const newItem: SearchHistoryItem = {
        id: response.item.id,
        timestamp: response.item.timestamp || Date.now(),
        queryText: item.queryText,
        result: item.result,
        ticketIds: item.ticketIds,
        visible: true
      };
      // Mettre à jour l'état local pour afficher immédiatement
      setHistory(prev => [newItem, ...prev]);
      console.log("Élément ajouté à l'historique avec succès");
      return response;
    } else {
      console.error("Erreur lors de l'ajout à l'historique:", response.message);
      return response;
    }
    } catch (error: any) {
      console.error("Erreur lors de l'ajout à l'historique:", error);
      return {
        status: "error",
        message: error.message || "Erreur lors de l'ajout à l'historique"
      };
    }
  };


  return (
    <SearchHistoryContext.Provider value={{
      history,
      loading,
      refreshHistory,
      deleteFromHistory,
      clearHistory,
      addToHistory
    }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}




export function useSearchHistory() {
  const context = useContext(SearchHistoryContext);
  if (context === undefined) {
    throw new Error("useSearchHistory doit être utilisé à l'intérieur d'un SearchHistoryProvider");
  }
  return context;
}

