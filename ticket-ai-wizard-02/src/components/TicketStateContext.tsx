import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { uploadExcelFile } from "@/api/fastApiService";
import { useToast } from "@/hooks/use-toast";

// Types pour notre contexte
interface TicketState {
  ticketData: Record<string, any> | null;
  loadingAnalysis: boolean;
  searchResults: any[] | null;
  initialMessage: string | undefined;
  ticketIds: string[] | undefined;
  // Propriété pour suivre l'état du traitement
  processingState: {
    inProgress: boolean;
    file: File | null;
    startTime: number | null;
    uploadPromise: Promise<any> | null;
    progress: number;
    abortController: AbortController | null;
    status: string; // Statut de traitement
    currentProcessStep: string; // Étape actuelle du processus
    realProgress: {
      startedSteps: string[];
      completedSteps: string[];
      currentStep: string;
      stepStartTime: number | null;
    };
  };
}

interface TicketStateContextProps {
  ticketState: TicketState;
  setTicketData: (data: Record<string, any> | null) => void;
  setLoadingAnalysis: (loading: boolean) => void;
  setSearchResults: (results: any[] | null) => void;
  setInitialMessage: (message: string | undefined) => void;
  setTicketIds: (ids: string[] | undefined) => void;
  clearTicketState: () => void;
  setProcessingState: (state: Partial<TicketState["processingState"]>) => void;
  setProcessingStatus: (status: string) => void; // Mise à jour du statut
  setProcessStep: (step: string) => void; // Nouvelle méthode pour mettre à jour l'étape
  completeCurrentStep: () => void; // Marquer l'étape actuelle comme terminée
  startProcessing: (file: File) => Promise<any>;
  endProcessing: () => void;
  cancelProcessing: () => void;
  setProgress: (progress: number) => void;
  continueProcessingIfNeeded: () => void;
  getRealProgressPercentage: () => number;
  getProcessStatusMessage: () => string;
}

// Définition des étapes du processus dans l'ordre d'exécution
const PROCESS_STEPS = [
  "validating",
  "reading_excel",
  "extracting_data",
  "format_validation",
  "preprocessing",
  "ai_analysis",
  "keyword_extraction",
  "similarity_search",
  "finalizing"
];

// Messages descriptifs pour chaque étape
const STEP_MESSAGES: Record<string, string> = {
  idle: "En attente de démarrage...",
  validating: "Validation du format du fichier en cours...",
  reading_excel: "Lecture du fichier Excel en cours...",
  extracting_data: "Extraction des données du ticket...",
  format_validation: "Vérification de la structure du fichier...",
  preprocessing: "Prétraitement des informations du ticket...",
  ai_analysis: "Analyse du ticket par intelligence artificielle...",
  keyword_extraction: "Extraction des mots-clés et concepts importants...",
  similarity_search: "Recherche de tickets similaires dans la base de données...",
  finalizing: "Préparation des résultats finaux...",
  completed: "Traitement terminé avec succès !",
  error: "Une erreur est survenue lors du traitement.",
  cancelled: "Le traitement a été annulé."
};

// Temps estimé pour chaque étape (en secondes)
const STEP_ESTIMATED_TIMES: Record<string, number> = {
  validating: 3,
  reading_excel: 5,
  extracting_data: 8,
  format_validation: 3,
  preprocessing: 10,
  ai_analysis: 15,
  keyword_extraction: 8,
  similarity_search: 20,
  finalizing: 5
};

// Fonction pour calculer le temps total estimé
const getTotalEstimatedTime = (): number => {
  return Object.values(STEP_ESTIMATED_TIMES).reduce((total, time) => total + time, 0);
};

// État initial
const initialState: TicketState = {
  ticketData: null,
  loadingAnalysis: false,
  searchResults: null,
  initialMessage: undefined,
  ticketIds: undefined,
  processingState: {
    inProgress: false,
    file: null,
    startTime: null,
    uploadPromise: null,
    progress: 0,
    abortController: null,
    status: "idle", // État initial du statut
    currentProcessStep: "idle",
    realProgress: {
      startedSteps: [],
      completedSteps: [],
      currentStep: "idle",
      stepStartTime: null
    }
  },
};

// Create the context
const TicketStateContext = createContext<TicketStateContextProps | undefined>(
  undefined
);
let processStatusMessage = "";

// Fonction pour définir le message de statut
const setProcessStatusMessage = (message: string) => {
  processStatusMessage = message;
};

// Fonction pour obtenir le message de statut actuel
const getProcessStatusMessage = () => {
  return processStatusMessage;
};

// Custom hook to use the context
export const useTicketState = () => {
  const context = useContext(TicketStateContext);
  if (context === undefined) {
    throw new Error("useTicketState must be used within a TicketStateProvider");
  }
  return context;
};

// Helper to safely store File object in localStorage
const fileToStorable = (file: File | null): any => {
  if (!file) return null;
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  };
};

// Provider component
export const TicketStateProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { toast } = useToast();
  const processingIntervalRef = useRef<number | null>(null);

  // Load state from localStorage on component mount
  const loadStateFromStorage = (): TicketState => {
    try {
      const savedState = localStorage.getItem("ticketState");
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        console.log("État chargé du stockage local:", parsedState);
        // Reset uploadPromise since we can't serialize it
        parsedState.processingState.uploadPromise = null;
        parsedState.processingState.abortController = null; // Reset controller
        
        // Ensure realProgress is properly initialized
        if (!parsedState.processingState.realProgress) {
          parsedState.processingState.realProgress = {
            startedSteps: [],
            completedSteps: [],
            currentStep: "idle",
            stepStartTime: null
          };
        }
        
        return parsedState;
      }
    } catch (error) {
      console.error("Error loading ticket state from storage:", error);
    }
    return initialState;
  };

  const [ticketState, setTicketState] = useState<TicketState>(loadStateFromStorage);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      // Create a copy of the state without the uploadPromise that can't be serialized
      const stateToPersist = {
        ...ticketState,
        processingState: {
          ...ticketState.processingState,
          file: fileToStorable(ticketState.processingState.file),
          uploadPromise: null,
          abortController: null, // Ne pas persister le controller
        },
      };
      localStorage.setItem("ticketState", JSON.stringify(stateToPersist));
      console.log("État sauvegardé dans le stockage local:", stateToPersist);
    } catch (error) {
      console.error("Error saving ticket state to storage:", error);
    }
  }, [ticketState]);

  useEffect(() => {
    // Écouter les mises à jour d'étapes venant de l'API
    const handleProcessStepUpdate = (event: CustomEvent) => {
      const { step } = event.detail;
      if (step && step !== ticketState.processingState.currentProcessStep) {
        setProcessStep(step);
        // Si l'étape précédente existe, la marquer comme terminée
        if (ticketState.processingState.currentProcessStep !== 'idle') {
          completeCurrentStep();
        }
      }
    };
  
    // Vérifier régulièrement si le localStorage a été mis à jour avec une nouvelle étape
    const checkLocalStorageStep = () => {
      const storedStep = localStorage.getItem('currentProcessStep');
      if (storedStep && storedStep !== ticketState.processingState.currentProcessStep) {
        setProcessStep(storedStep);
        // Marquer l'étape précédente comme terminée
        if (ticketState.processingState.currentProcessStep !== 'idle') {
          completeCurrentStep();
        }
      }
    };
  
    window.addEventListener('processStepUpdate', handleProcessStepUpdate as EventListener);
    const intervalId = setInterval(checkLocalStorageStep, 500);
    
    return () => {
      window.removeEventListener('processStepUpdate', handleProcessStepUpdate as EventListener);
      clearInterval(intervalId);
    };
  }, [ticketState.processingState.currentProcessStep]);

  // Surveillance des changements d'étape pour mettre à jour les progrès réels
  useEffect(() => {
    const currentStep = ticketState.processingState.currentProcessStep;
    
    // Vérifier que realProgress est correctement initialisé
    if (!ticketState.processingState.realProgress || !ticketState.processingState.realProgress.startedSteps) {
      // Initialiser realProgress si nécessaire
      setProcessingState({
        realProgress: {
          startedSteps: [],
          completedSteps: [],
          currentStep: currentStep || "idle",
          stepStartTime: Date.now()
        }
      });
      return;
    }
    
    // Si l'étape n'est pas "idle" et n'a pas déjà été commencée
    if (
      currentStep !== "idle" &&
      !ticketState.processingState.realProgress.startedSteps.includes(currentStep)
    ) {
      // Ajouter à la liste des étapes commencées
      setProcessingState({
        realProgress: {
          ...ticketState.processingState.realProgress,
          startedSteps: [...ticketState.processingState.realProgress.startedSteps, currentStep],
          currentStep: currentStep,
          stepStartTime: Date.now()
        }
      });
    }
  }, [ticketState.processingState.currentProcessStep]);

  // Vérification de la durée totale du traitement
  useEffect(() => {
    if (ticketState.processingState.inProgress && ticketState.processingState.startTime) {
      // Démarrer un intervalle pour vérifier régulièrement la durée
      if (!processingIntervalRef.current) {
        processingIntervalRef.current = window.setInterval(() => {
          const now = Date.now();
          const durationInSeconds = (now - ticketState.processingState.startTime!) / 1000;
          
          // Si le traitement dépasse 90 secondes (1m30s), afficher un message spécial
          if (durationInSeconds > 90) {
            // Mettre à jour le statut pour indiquer un traitement plus long que prévu
            if (!ticketState.processingState.status.includes("longer_than_expected")) {
              setProcessingStatus(`${ticketState.processingState.status}_longer_than_expected`);
            }
          }
        }, 5000); // Vérifier toutes les 5 secondes
      }
    } else {
      // Nettoyer l'intervalle si le traitement est terminé
      if (processingIntervalRef.current) {
        window.clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    }

    // Nettoyage à la destruction du composant
    return () => {
      if (processingIntervalRef.current) {
        window.clearInterval(processingIntervalRef.current);
      }
    };
  }, [ticketState.processingState.inProgress, ticketState.processingState.startTime]);

  // State update functions that maintain persistence
  const setTicketData = (data: Record<string, any> | null) => {
    setTicketState((prev) => ({ ...prev, ticketData: data }));
  };

  const setLoadingAnalysis = (loading: boolean) => {
    setTicketState((prev) => ({ ...prev, loadingAnalysis: loading }));
  };

  const setSearchResults = (results: any[] | null) => {
    setTicketState((prev) => ({ ...prev, searchResults: results }));
  };

  const setInitialMessage = (message: string | undefined) => {
    setTicketState((prev) => ({ ...prev, initialMessage: message }));
  };

  const setTicketIds = (ids: string[] | undefined) => {
    setTicketState((prev) => ({ ...prev, ticketIds: ids }));
  };
  
  const setProcessingState = (
    state: Partial<TicketState["processingState"]>
  ) => {
    setTicketState((prev) => ({
      ...prev,
      processingState: {
        ...prev.processingState,
        ...state,
        // Ensure realProgress is always properly initialized
        realProgress: state.realProgress 
          ? {
              ...prev.processingState.realProgress,
              ...state.realProgress
            }
          : prev.processingState.realProgress || {
              startedSteps: [],
              completedSteps: [],
              currentStep: prev.processingState.currentProcessStep || "idle",
              stepStartTime: null
            }
      },
    }));
  };

  // Mettre à jour uniquement le statut
  const setProcessingStatus = (status: string) => {
    setProcessingState({ status });
    console.log(`Statut du traitement mis à jour: ${status}`);
  };

  // Nouvelle méthode pour mettre à jour l'étape du processus
  const setProcessStep = (step: string) => {
    setTicketState(prevState => {
      // Assurez-vous que realProgress existe
      const currentRealProgress = prevState.processingState.realProgress || {
        startedSteps: [],
        completedSteps: [],
        currentStep: "idle",
        stepStartTime: null
      };
      
      return {
        ...prevState,
        processingState: {
          ...prevState.processingState,
          currentProcessStep: step,
          realProgress: {
            ...currentRealProgress,
            currentStep: step,
            stepStartTime: Date.now()
          }
        }
      };
    });
    console.log(`Étape actuelle mise à jour: ${step}`);
  };

  const updateRealProgress = (progress: number) => {
    setTicketState(prevState => {
      // Assurez-vous que realProgress existe
      const currentRealProgress = prevState.processingState.realProgress || {
        startedSteps: [],
        completedSteps: [],
        currentStep: prevState.processingState.currentProcessStep || "idle",
        stepStartTime: null,
        progressPercentage: 0
      };
      
      return {
        ...prevState,
        processingState: {
          ...prevState.processingState,
          realProgress: {
            ...currentRealProgress,
            progressPercentage: Math.min(progress, 100)
          }
        }
      };
    });
  };

  // Marquer l'étape actuelle comme terminée et passer à la suivante
  const completeCurrentStep = () => {
    const currentStep = ticketState.processingState.currentProcessStep;
    
    // Vérifier que realProgress est correctement initialisé
    if (!ticketState.processingState.realProgress || !ticketState.processingState.realProgress.completedSteps) {
      // Initialiser realProgress si nécessaire
      setProcessingState({
        realProgress: {
          startedSteps: currentStep !== "idle" ? [currentStep] : [],
          completedSteps: [],
          currentStep: currentStep || "idle",
          stepStartTime: Date.now()
        }
      });
      return;
    }
    
    if (
      currentStep !== "idle" &&
      !ticketState.processingState.realProgress.completedSteps.includes(currentStep)
    ) {
      // Ajouter à la liste des étapes terminées
      const updatedCompletedSteps = [
        ...ticketState.processingState.realProgress.completedSteps,
        currentStep
      ];

      // Trouver la prochaine étape logique
      const currentIndex = PROCESS_STEPS.indexOf(currentStep);
      const nextStep = currentIndex < PROCESS_STEPS.length - 1
        ? PROCESS_STEPS[currentIndex + 1]
        : "finalizing";

      setProcessingState({
        realProgress: {
          ...ticketState.processingState.realProgress,
          completedSteps: updatedCompletedSteps,
          currentStep: nextStep,
          stepStartTime: Date.now()
        }
      });

      // Mettre à jour également l'étape du processus
      setProcessStep(nextStep);
      console.log(`Étape ${currentStep} terminée. Passage à ${nextStep}.`);
    }
  };

  // Calculer le pourcentage de progression réel
  const getRealProgressPercentage = (): number => {
    // Si le traitement n'est pas en cours, retourner 0 ou 100 selon l'état
    if (!ticketState.processingState.inProgress) {
      return ticketState.processingState.status === "completed" ? 100 : 0;
    }
    
    // Vérifier que realProgress est correctement initialisé
    if (!ticketState.processingState.realProgress || !ticketState.processingState.realProgress.completedSteps) {
      return 0;
    }
    
    // Nombre total d'étapes
    const totalSteps = PROCESS_STEPS.length;
    
    // Nombre d'étapes terminées
    const completedSteps = ticketState.processingState.realProgress.completedSteps.length;
    
    // Index de l'étape actuelle
    const currentStepIndex = PROCESS_STEPS.indexOf(ticketState.processingState.currentProcessStep);
    
    // Si l'étape actuelle n'est pas reconnue, utiliser les étapes complétées
    if (currentStepIndex === -1) {
      return (completedSteps / totalSteps) * 100;
    }
    
    // Progression de base (étapes terminées)
    const baseProgress = (completedSteps / totalSteps) * 100;
    
    // Progression dans l'étape actuelle
    const stepStartTime = ticketState.processingState.realProgress.stepStartTime;
    const now = Date.now();
    const elapsedInStep = stepStartTime ? (now - stepStartTime) / 1000 : 0;
    
    // Temps estimé pour l'étape actuelle
    const currentStep = ticketState.processingState.currentProcessStep;
    const estimatedStepTime = STEP_ESTIMATED_TIMES[currentStep] || 10;
    
    // Progression dans l'étape actuelle (limitée à 0.95 pour ne pas atteindre 100% prématurément)
    const stepProgress = Math.min(elapsedInStep / estimatedStepTime, 0.95);
    
    // Pourcentage par étape
    const stepPercentage = 100 / totalSteps;
    
    // Progression totale: étapes complétées + progression partielle de l'étape actuelle
    const totalProgress = baseProgress + (stepProgress * stepPercentage);
    
    // Limiter à 99% jusqu'à ce que le traitement soit explicitement marqué comme terminé
    return Math.min(totalProgress, 99);
  };

  // Obtenir un message descriptif pour l'étape actuelle
  const getProcessStatusMessage = (): string => {
    const step = ticketState.processingState.currentProcessStep;
    const status = ticketState.processingState.status;
    
    // Si le traitement prend trop de temps
    if (status.includes("longer_than_expected")) {
      return "Le traitement prend plus de temps que prévu, mais est toujours en cours...";
    }
    
    // Sinon, renvoyer le message standard pour l'étape
    return STEP_MESSAGES[step] || "Traitement en cours...";
  };

  // Mettre à jour la progression
  const setProgress = (progress: number) => {
    setProcessingState({
      progress,
      inProgress:
        progress > 0 && progress < 100
          ? true
          : ticketState.processingState.inProgress,
    });
  };

  // Fonction pour démarrer le traitement avec un AbortController
  const startProcessing = (file: File): Promise<any> => {
    // Créer un nouveau controller d'annulation
    const abortController = new AbortController();
    
    // Initialiser le statut à "validating"
    setProcessingStatus("validating");
    setProcessStep("validating");
    
    // Initialiser les progrès réels
    setProcessingState({
      inProgress: true,
      file: file,
      startTime: Date.now(),
      abortController: abortController,
      realProgress: {
        startedSteps: ["validating"],
        completedSteps: [],
        currentStep: "validating",
        stepStartTime: Date.now()
      }
    });
    
    // Créer une nouvelle promesse pour l'upload
    const uploadPromise = uploadExcelFile(file, abortController.signal);
    
    // Mettre à jour l'état avec la promesse
    setProcessingState({
      uploadPromise: uploadPromise
    });
    
    // Ajouter les écouteurs pour les étapes du processus d'API
    uploadPromise
      .then(response => {
        console.log("Réponse API reçue:", response);
        
        // Marquer comme terminé si succès
        if (response.status === "success") {
          setProcessingStatus("completed");
          completeCurrentStep(); // Marque l'étape actuelle comme terminée
          
          // Traiter les résultats
          if (response.tickets && response.tickets.length > 0) {
            const ticketIds = response.tickets.map((t: any) => t.ticket_id);
            setTicketIds(ticketIds);
            setSearchResults(response.tickets);
            
            // Créer un message de réponse
            const bestMatch = response.tickets[0];
            const responseMessage = `
              J'ai trouvé une solution pour votre ticket!
              **Problème identifié:** ${bestMatch.problem}
              **Solution:** ${bestMatch.solution}
              *Temps de recherche: ${response.temps_recherche?.toFixed(2)}s*
            `;
            setInitialMessage(responseMessage);
          }
          
          setLoadingAnalysis(false);
        } else {
          // En cas d'erreur dans la réponse
          setProcessingStatus("error");
          setLoadingAnalysis(false);
        }
      })
      .catch(error => {
        // Ignorer les erreurs d'annulation volontaire
        if (error.name !== "AbortError" && error.name !== "CanceledError") {
          console.error("Erreur lors du traitement:", error);
          setProcessingStatus("error");
        } else {
          setProcessingStatus("cancelled");
        }
        setLoadingAnalysis(false);
      });
    
    return uploadPromise;
  };

  // Fonction pour terminer le traitement
  const endProcessing = () => {
    setProcessingState({
      inProgress: false,
      uploadPromise: null,
      abortController: null,
    });
    
    // Nettoyer l'intervalle de vérification si existant
    if (processingIntervalRef.current) {
      window.clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  // Fonction pour annuler le traitement
  const cancelProcessing = () => {
    if (ticketState.processingState.abortController) {
      ticketState.processingState.abortController.abort();
    }
    
    setProcessingState({
      inProgress: false,
      uploadPromise: null,
      progress: 0,
      status: "cancelled",
    });
    
    // Nettoyer l'intervalle de vérification si existant
    if (processingIntervalRef.current) {
      window.clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  };

  const clearTicketState = () => {
    setTicketState(initialState);
    localStorage.removeItem("ticketState");
  };

  // Fonction pour vérifier si un traitement est en cours et le continuer si nécessaire
  const continueProcessingIfNeeded = () => {
    if (
      ticketState.processingState.inProgress &&
      !ticketState.processingState.uploadPromise
    ) {
      console.log(
        "Un traitement était en cours, mais la promesse a été perdue lors de la navigation"
      );

      // Si nous avons un fichier en état de traitement
      if (ticketState.processingState.file) {
        console.log("Reprise du traitement avec le fichier sauvegardé");
        const savedProgress = ticketState.processingState.progress || 0;
        const savedStatus = ticketState.processingState.status || "preprocessing";
        
        // Restaurer le statut du traitement
        setProcessingStatus(savedStatus);
        
        // Si la progression est élevée (>80%), on suppose que le traitement est presque terminé
        if (savedProgress > 80) {
          console.log(
            "Le traitement était presque terminé, attente des résultats..."
          );
          // Attendre un peu avant de simuler la fin du traitement
          setTimeout(() => {
            setProgress(100);
            setProcessingStatus("finalizing");
            setLoadingAnalysis(false);
            // Ne pas terminer le traitement si nous avons des résultats
            if (
              !ticketState.searchResults ||
              ticketState.searchResults.length === 0
            ) {
              endProcessing();
            }
          }, 1500);
          return;
        }
        
        // Créer un nouveau controller d'annulation
        const abortController = new AbortController();
        
        // Relancer le traitement
        const file = ticketState.processingState.file;
        const uploadPromise = uploadExcelFile(file, abortController.signal);
        
        // Restaurer la progression précédente
        const progress = ticketState.processingState.progress || 0;
        
        // Mettre à jour la promesse dans l'état
        setProcessingState({
          uploadPromise,
          progress: Math.max(progress, 10), // Assurer un minimum de progression visible
          abortController,
        });
        
        // Configurer les gestionnaires pour mettre à jour les états
        uploadPromise
          .then((response) => {
            if (response.status === "success") {
              setProcessingStatus("finalizing");
              if (response.tickets && response.tickets.length > 0) {
                const ticketIds = response.tickets.map((t: any) => t.ticket_id);
                const bestMatch = response.tickets[0];
                console.log("Setting search time to:", response.temps_recherche);
                const responseMessage = `
                  J'ai trouvé une solution pour votre ticket!
                  **Problème identifié:** ${bestMatch.problem}
                  **Solution:** ${bestMatch.solution}
                  *Temps de recherche: ${response.temps_recherche?.toFixed(2)}s*
                `;
                setInitialMessage(responseMessage);
                setTicketIds(ticketIds);
                setSearchResults(response.tickets);
              }
              setLoadingAnalysis(false);
              setProcessingStatus("completed");
              endProcessing();
            } else {
              setProcessingStatus("error");
              setLoadingAnalysis(false);
              endProcessing();
            }
          })
          .catch((error) => {
            if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
              console.error("Erreur lors de la reprise du traitement:", error);
              setProcessingStatus("error");
              setLoadingAnalysis(false);
              endProcessing();
            } else {
              setProcessingStatus("cancelled");
              setLoadingAnalysis(false);
              endProcessing();
            }
          });
      }
    }
  };

  // Utiliser useEffect pour restaurer le traitement au montage du contexte
  useEffect(() => {
    continueProcessingIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    ticketState,
    setTicketData,
    setLoadingAnalysis,
    setSearchResults,
    setInitialMessage,
    setTicketIds,
    clearTicketState,
    setProcessingState,
    setProcessingStatus,
    setProcessStep,
    completeCurrentStep,
    startProcessing,
    endProcessing,
    cancelProcessing,
    setProgress,
    continueProcessingIfNeeded,
    getRealProgressPercentage,
    getProcessStatusMessage
  };

  return (
    <TicketStateContext.Provider value={value}>
      {children}
    </TicketStateContext.Provider>
  );
};