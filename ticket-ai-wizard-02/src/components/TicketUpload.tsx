// src/components/TicketUpload.tsx
import { useState, useEffect, useCallback } from "react"; // Ajout de useCallback
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { FileDropzone } from "./ticket/FileDropzone";
import { FilePreview } from "./ticket/FilePreview";
import { TicketInstructions } from "./TicketInstructions";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useToast } from "@/hooks/use-toast";

import { useTicketState } from "./TicketStateContext";
import {
  validateExcelFormat,
  extractTicketDataFromExcel,
  addSearchToHistory,
  uploadExcelFile, // Assurez-vous que cette fonction est importée si elle ne l'est pas déjà
} from "../api/fastApiService";
import * as XLSX from "xlsx";
import { Check, Clock, FileSearch, ZapIcon, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    ticketUploadRef?: {
      processGeneratedFile: (file: File) => void;
    };
  }
}

export const TicketUpload = ({
  onFileUploaded,
  onTicketDataExtracted,
  onGeneratedFileReady,
}: {
  onFileUploaded: (text: string, ticketIds?: string[], results?: any[]) => void;
  onTicketDataExtracted: (
    data: Record<string, any> | null,
    loading: boolean
  ) => void;
  onGeneratedFileReady?: (file: File) => void; // NOUVELLE PROPRIÉTÉ
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [attemptedRecovery, setAttemptedRecovery] = useState(false); // Pour éviter les récupérations en boucle
  const [pendingGeneratedFile, setPendingGeneratedFile] = useState<File | null>(null);

  const { toast } = useToast();
  const { theme } = useTheme();
  const { refreshHistory } = useSearchHistory(); // On n'utilise plus addToHistory du hook
  const {
    ticketState,
    setTicketData,
    setLoadingAnalysis,
    setInitialMessage,
    setTicketIds,
    setSearchResults,
    startProcessing,
    endProcessing,
    cancelProcessing,
    continueProcessingIfNeeded,
    resetRecoveryState,
    setProgress: setContextProgress,
    setProcessingStatus,
    resetAllStates,
  } = useTicketState();
  
  const isDark = theme === "dark";
useEffect(() => {
    const handleUserLogout = () => {
      console.log("Déconnexion détectée - réinitialisation du composant TicketUpload");
      
      // Réinitialiser tous les états locaux
      setFile(null);
      setUploading(false);
      setIsMinimized(false);
      setAttemptedRecovery(false);
      setPendingGeneratedFile(null);
      
      // Réinitialiser les callbacks
      onFileUploaded("");
      onTicketDataExtracted(null, false);
      
      // Nettoyer la référence globale si nécessaire
      if (window.ticketUploadRef) {
        delete window.ticketUploadRef;
      }
    };

    window.addEventListener('userLogout', handleUserLogout);
    
    return () => {
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, [onFileUploaded, onTicketDataExtracted]);
  // Définir validateAndUpload avec useCallback pour éviter les re-créations
  const validateAndUpload = useCallback(async () => {
  if (!file) {
    console.log("Aucun fichier à traiter");
    return;
  }
  
  console.log("Début de la validation et upload pour:", file.name);
  
  // Réinitialiser les états liés aux résultats précédents
  setSearchResults(null);
  setTicketIds(undefined);
  setInitialMessage("");
  onFileUploaded("");
  
  try {
    // Extraction des données du ticket pour prévisualisation
    setProcessingStatus("extracting_preview");
    console.log("Extraction des données du ticket...");
    
    try {
      const extractionResult = await extractTicketDataFromExcel(file);
      if (extractionResult.status === "success" && extractionResult.ticket_data) {
        onTicketDataExtracted(extractionResult.ticket_data, true);
        setTicketData(extractionResult.ticket_data);
        setLoadingAnalysis(true);
        console.log("Données du ticket extraites via API:", extractionResult.ticket_data);
      } else {
        throw new Error("Extraction API échouée, utilisation de la méthode locale");
      }
    } catch (error) {
      console.log("Utilisation de la méthode d'extraction locale");
      const ticketData = await extractExcelData(file);
      if (ticketData) {
        onTicketDataExtracted(ticketData, true);
        setTicketData(ticketData);
        setLoadingAnalysis(true);
        console.log("Données du ticket extraites (méthode locale):", ticketData);
      }
    }
    
    // Validation du format du fichier Excel
    setProcessingStatus("format_validation");
    console.log("Validation du format...");
    
    const validation = await validateExcelFormat(file);
    if (validation.isValid) {
      console.log("Format valide, démarrage de l'upload");
      handleUpload();
    } else {
      console.error("Format invalide:", validation.message);
      onTicketDataExtracted(null, false);
      setTicketData(null);
      setLoadingAnalysis(false);
      setProcessingStatus("error");
      toast({
        title: "Format incorrect",
        description: validation.message,
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
    setProcessingStatus("error");
    onTicketDataExtracted(null, false);
    setTicketData(null);
    setLoadingAnalysis(false);
    toast({
      title: "Erreur de validation",
      description: "Impossible de valider le format du fichier.",
      variant: "destructive",
    });
  }
}, [
  file, 
  setSearchResults, 
  setTicketIds, 
  setInitialMessage, 
  onFileUploaded, 
  setProcessingStatus, 
  onTicketDataExtracted, 
  setTicketData, 
  setLoadingAnalysis, 
  toast
]);


const processGeneratedFile = useCallback(async (generatedFile: File) => {
  console.log("Fichier généré reçu pour traitement:", generatedFile.name);
 
  // Réinitialiser l'état complètement
  setFile(null);
  setUploading(false);
  setIsMinimized(false);
  setAttemptedRecovery(false);
  resetRecoveryState();
 
  // Nettoyer l'état global
  setSearchResults(null);
  setTicketIds(undefined);
  setInitialMessage("");
  onFileUploaded("");
  setTicketData(null);
  setLoadingAnalysis(false);
 
  console.log("État réinitialisé, définition du nouveau fichier");
  
  // Définir le nouveau fichier et déclencher le traitement
  setFile(generatedFile);
  
  if (onGeneratedFileReady) {
    onGeneratedFileReady(generatedFile);
  }
 
  // Déclencher automatiquement le traitement après un court délai
  setTimeout(() => {
    console.log("Déclenchement automatique du traitement");
    validateAndUpload();
  }, 300);
  
}, [
  onGeneratedFileReady, 
  validateAndUpload, 
  resetRecoveryState, 
  setSearchResults, 
  setTicketIds, 
  setInitialMessage, 
  onFileUploaded, 
  setTicketData, 
  setLoadingAnalysis
]);

  useEffect(() => {
    // Ne tenter la récupération qu'une seule fois par montage de composant
    if (!attemptedRecovery) {
      setAttemptedRecovery(true);
      continueProcessingIfNeeded();

      // Si un traitement était en cours
      if (ticketState.processingState.inProgress && !file) {
        console.log(
          "Restauration d'un traitement en cours depuis le contexte global"
        );
        setUploading(true);

        if (ticketState.processingState.file) {
          setFile(ticketState.processingState.file);
        }
      }

      // Si des données existent déjà
      if (ticketState.ticketData && !file) {
        setUploading(ticketState.loadingAnalysis);
      }
    }

    // Gestion de la minimisation basée sur les résultats
    if (
      ticketState.searchResults &&
      ticketState.searchResults.length > 0 &&
      file
    ) {
      setIsMinimized(true);
    } else if (!file) {
      setIsMinimized(false);
    }
  }, [
    ticketState,
    file,
    continueProcessingIfNeeded,
    ticketState.processingState.inProgress,
    ticketState.processingState.file,
    ticketState.ticketData,
    ticketState.loadingAnalysis,
    ticketState.searchResults,
    attemptedRecovery,
  ]);

  const extractExcelData = async (file: File) => {
    try {
      onTicketDataExtracted(null, true);
      return new Promise<Record<string, any>>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            if (!data) {
              reject("Impossible de lire le fichier");
              return;
            }
            const workbook = XLSX.read(data, { type: "binary" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData =
              XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
            if (jsonData.length > 0) {
              const ticketData = jsonData[0];
              const knownColumns = [
                "key",
                "type",
                "created_date",
                "updated_date",
                "Affects_Version",
                "fix_version",
                "Components",
                "priority",
                "description",
                "assignee",
                "reporter",
                "status",
                "summary",
                "resolution",
                "comment",
                "inward_linked_issue_key",
                "message",
                "estimated_budget",
                "original_estimate",
                "estimation_due_date",
                "last_commented",
                "solution",
                "htu",
                "number_of_reject",
                "number_of_suspend",
                "fix_estimation",
                "classement",
                "git_branch",
                "rank",
                "reject_reason",
                "sprint",
                "participants",
                "rank_obsolete",
                "time_in_status",
                "impact",
                "date_of_first_response",
                "git_commits_referenced",
                "root_cause",
                "request_participants",
                "client_project",
                "commits",
              ];
              const cleanedData: Record<string, any> = {};
              knownColumns.forEach((column) => {
                if (
                  ticketData[column] !== undefined &&
                  ticketData[column] !== null &&
                  ticketData[column] !== ""
                ) {
                  cleanedData[column] = String(ticketData[column]);
                }
              });
              Object.entries(ticketData).forEach(([key, value]) => {
                if (
                  !knownColumns.includes(key) &&
                  value !== null &&
                  value !== undefined &&
                  value !== ""
                ) {
                  cleanedData[key] = String(value);
                }
              });
              resolve(cleanedData);
            } else {
              reject("Aucune donnée trouvée dans le fichier Excel");
            }
          } catch (error) {
            console.error(
              "Erreur lors de l'extraction des données Excel:",
              error
            );
            reject(error);
          }
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsBinaryString(file);
      });
    } catch (error) {
      console.error("Erreur lors de l'extraction des données:", error);
      onTicketDataExtracted(null, false);
      return null;
    }
  };

  // Fonction pour gérer l'annulation du traitement
  const handleCancelUpload = () => {
    console.log("Annulation du traitement demandée par l'utilisateur");
    cancelProcessing();
    setProcessingStatus("cancelled");
    setUploading(false);
    setIsMinimized(false);
    setFile(null); // Réinitialiser le fichier
    onTicketDataExtracted(null, false);

    setAttemptedRecovery(false);
    resetRecoveryState();
    setSearchResults(null);
    setTicketIds(undefined);
    setInitialMessage("");
    onFileUploaded("");

    toast({
      title: "Traitement annulé",
      description: "L'analyse du ticket a été annulée avec succès.",
      variant: "default",
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setSearchResults(null);
    setTicketIds(undefined);
    setInitialMessage("");
    onFileUploaded("");
    setUploading(true);
    setContextProgress(0);
    try {
      setProcessingStatus("validating"); // Commencer par la validation
      const uploadPromise = startProcessing(file);
      const simulateProgress = async () => {
        setProcessingStatus("reading_excel");
        setContextProgress(15);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Extraction des données
        setProcessingStatus("extracting_data");
        setContextProgress(25);
        await new Promise((resolve) => setTimeout(resolve, 5500));
        // Prétraitement
        setProcessingStatus("preprocessing");
        setContextProgress(45);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        // Analyse IA du ticket
        setProcessingStatus("ai_analysis");
        setContextProgress(60);
        await new Promise((resolve) => setTimeout(resolve, 40000));
        // Extraction des mots-clés
        setProcessingStatus("keyword_extraction");
        setContextProgress(75);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Recherche de tickets similaires
        setProcessingStatus("similarity_search");
        setContextProgress(85);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        // Finalisation
        setProcessingStatus("finalizing");
        setContextProgress(95);
      };
      // Lancer la simulation de progression
      simulateProgress();
      // Attendre la réponse réelle de l'API
      const response = await uploadPromise;
      if (response.status === "success") {
        setContextProgress(100);
        setProcessingStatus("completed");
        onTicketDataExtracted(null, false);
        if (response.tickets && response.tickets.length > 0) {
          const ticketIds = response.tickets.map((t) => t.ticket_id);
          const bestMatch = response.tickets[0];
          const responseMessage = `
J'ai trouvé une solution pour votre ticket!
**Problème identifié:** ${bestMatch.problem}
**Solution:** ${bestMatch.solution}
*Temps de recherche: ${response.temps_recherche?.toFixed(2)}s*
`;
          toast({
            title: "Solution trouvée",
            description: (
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-blue-500" />
                <span>
                  Score de similarité:{" "}
                  <strong className="text-blue-600">
                    {Math.round(bestMatch.similarity_score)}%
                  </strong>
                </span>
              </div>
            ),
            variant: "default",
          });

          if (localStorage.getItem("token")) {
            try {
              const avgSimilarity = response.tickets
                ? response.tickets.reduce(
                    (sum, t) => sum + (t.similarity_score || 0),
                    0
                  ) / response.tickets.length
                : null;
              const historyResponse = await addSearchToHistory(file.name, {
                result: responseMessage,
                ticketIds: ticketIds,
                similarity_score: avgSimilarity,
                search_time: response.temps_recherche || null,
              });

              console.log("Ajout à l'historique réussi");
              await refreshHistory();
            } catch (error) {
              console.error("Erreur lors de l'ajout à l'historique:", error);
            }
          }

          setInitialMessage(responseMessage);
          setTicketIds(ticketIds);
          setSearchResults(response.tickets);
          onFileUploaded(responseMessage, ticketIds, response.tickets);
        } else {
          toast({
            title: "Aucun résultat",
            description: "Aucun ticket similaire n'a été trouvé.",
          });
          onFileUploaded(
            "Aucun ticket similaire n'a été trouvé pour votre demande."
          );
        }
        setIsMinimized(true);
        setTimeout(() => {
          setContextProgress(0);
        }, 100);
        setUploading(false);
        endProcessing();
      } else {
        onTicketDataExtracted(null, false);
        setProcessingStatus("error");
        throw new Error(
          response.message || "Erreur lors du traitement du fichier"
        );
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        setProcessingStatus("cancelled");
      } else {
        console.error("Error processing file:", error);
        setProcessingStatus("error");
        onTicketDataExtracted(null, false);
        toast({
          title: "Erreur de traitement",
          description: "Une erreur est survenue lors du traitement du fichier.",
          variant: "destructive",
        });
        onFileUploaded(
          "Une erreur est survenue lors de l'analyse de votre ticket. Veuillez réessayer."
        );
      }
      setUploading(false);
      setContextProgress(0);
      endProcessing();
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div
        className={cn(
          "transition-all duration-300",
          isMinimized ? "w-full md:w-3/5" : "w-full"
        )}
      >
        {!file ? (
          <FileDropzone
            onFileAccepted={(newFile) => {
              setFile(newFile);
              setAttemptedRecovery(false);
              resetRecoveryState();
            }}
            isProcessingGenerated={pendingGeneratedFile !== null}
          />
        ) : (
          <FilePreview
            file={file}
            onRemove={() => {
              setFile(null);
              onTicketDataExtracted(null, false);
              endProcessing();
              setAttemptedRecovery(false);
              resetRecoveryState();
              setSearchResults(null);
              setTicketIds(undefined);
              setInitialMessage("");
              onFileUploaded("");
            }}
            onUpload={validateAndUpload}
            uploading={uploading}
            processingStatus={ticketState.processingState.status}
            onCancel={handleCancelUpload}
          />
        )}
      </div>
      {/* Instructions avec affichage conditionnel et taille adaptative */}
      {!file && (
        <div
          className={cn(
            "transition-all duration-300",
            "w-full md:w-2/5",
            "self-start"
          )}
        >
          <TicketInstructions />
        </div>
      )}
    </div>
  );
};