import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast"; // Ajout de cet import manquant

// Ajouter une propriété pour le contrôleur d'annulation dans l'interface AdminProcessingState
interface AdminProcessingState {
  file: File | null;
  uploading: boolean;
  processingStats: {
    processed: number;
    fixed: number;
    skipped: number;
  } | null;
  expanded: boolean;
  abortController: AbortController | null; // Ajouter cette ligne
}
// Créer le contexte
const AdminTicketStateContext = createContext<AdminTicketStateContextType | undefined>(
  undefined
);

// Hook personnalisé pour utiliser le contexte
export const useAdminTicketState = () => {
  const context = useContext(AdminTicketStateContext);
  if (context === undefined) {
    throw new Error("useAdminTicketState doit être utilisé à l'intérieur d'un AdminUploadTicketStateProvider");
  }
  return context;
};
// Ajouter une fonction pour annuler le téléchargement dans l'interface du contexte
interface AdminTicketStateContextType {
  adminProcessingState: AdminProcessingState;
  setAdminFile: (file: File | null) => void;
  setAdminUploading: (uploading: boolean) => void;
  setAdminProcessingStats: (
    stats: { processed: number; fixed: number; skipped: number } | null
  ) => void;
  setAdminExpanded: (expanded: boolean) => void;
  resetAdminState: () => void;
  cancelUpload: () => void; // Ajouter cette ligne
  setAbortController: (controller: AbortController | null) => void; // Ajouter cette ligne
}


// Mettre à jour l'état initial pour inclure le contrôleur d'annulation
const initialAdminProcessingState: AdminProcessingState = {
  file: null,
  uploading: false,
  processingStats: null,
  expanded: false,
  abortController: null,
};

// Ajouter les nouvelles fonctions dans le Provider
export const AdminUploadTicketStateProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { toast } = useToast(); // Utiliser le hook toast
  
  // État local qui sera partagé entre les composants admin
  const [adminProcessingState, setAdminProcessingState] =
    useState<AdminProcessingState>(() => {
      // Essayer de récupérer l'état depuis le localStorage au chargement
      const savedState = localStorage.getItem("adminTicketProcessingState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Note: File et AbortController ne peuvent pas être stockés dans localStorage
        return {
          ...parsedState,
          file: null,
          abortController: null,
        };
      }
      return initialAdminProcessingState;
    });

  // Mettre à jour le localStorage chaque fois que l'état admin change
  useEffect(() => {
    // Créer une copie sans le File qui ne peut pas être sérialisé
    const stateForStorage = {
      ...adminProcessingState,
      file: null, // Nous ne pouvons pas stocker le File dans localStorage
      abortController: null, // Nous ne pouvons pas stocker l'AbortController dans localStorage
    };
    localStorage.setItem(
      "adminTicketProcessingState",
      JSON.stringify(stateForStorage)
    );
  }, [adminProcessingState]);

  // Fonctions pour mettre à jour l'état admin
  const setAdminFile = (file: File | null) => {
    setAdminProcessingState((prev) => ({ ...prev, file }));
  };
  
  const setAdminUploading = (uploading: boolean) => {
    setAdminProcessingState((prev) => ({ ...prev, uploading }));
  };
  
  const setAdminProcessingStats = (
    stats: { processed: number; fixed: number; skipped: number } | null
  ) => {
    setAdminProcessingState((prev) => ({ ...prev, processingStats: stats }));
  };
  
  const setAdminExpanded = (expanded: boolean) => {
    setAdminProcessingState((prev) => ({ ...prev, expanded }));
  };
  
  const setAbortController = (controller: AbortController | null) => {
    setAdminProcessingState((prev) => ({
      ...prev,
      abortController: controller,
    }));
  };
  
  const cancelUpload = () => {
    if (adminProcessingState.abortController) {
      adminProcessingState.abortController.abort();
      setAdminUploading(false);
      toast({
        title: "Téléchargement annulé",
        description: "Le traitement du fichier a été annulé.",
      });
    }
  };
  
  const resetAdminState = () => {
    // Annuler tout téléchargement en cours avant de réinitialiser
    if (adminProcessingState.abortController) {
      adminProcessingState.abortController.abort();
    }
    setAdminProcessingState(initialAdminProcessingState);
    localStorage.removeItem("adminTicketProcessingState");
  };

  return (
    <AdminTicketStateContext.Provider
      value={{
        adminProcessingState,
        setAdminFile,
        setAdminUploading,
        setAdminProcessingStats,
        setAdminExpanded,
        resetAdminState,
        cancelUpload,
        setAbortController,
      }}
    >
      {children}
    </AdminTicketStateContext.Provider>
  );
};

export default AdminTicketStateContext;
