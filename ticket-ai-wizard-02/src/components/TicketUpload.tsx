// src/components/TicketUpload.tsx
import { useState, useEffect, useCallback } from "react";
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
  uploadExcelFile,
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
  onGeneratedFileReady?: (file: File) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isProcessingGenerated, setIsProcessingGenerated] = useState(false);

  const { toast } = useToast();
  const { theme } = useTheme();
  const { refreshHistory } = useSearchHistory();
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

  // Fonction pour traiter un fichier généré
  const processGeneratedFile = useCallback(async (generatedFile: File) => {
    console.log("=== DÉBUT TRAITEMENT FICHIER GÉNÉRÉ ===");
    console.log("Fichier reçu:", generatedFile.name, "Taille:", generatedFile.size);
    
    // Vérifier si déjà en cours de traitement
    if (uploading || isProcessingGenerated) {
      console.log("Traitement déjà en cours, abandon");
      return;
    }

    try {
      setIsProcessingGenerated(true);
      console.log("Marquage en cours de traitement généré");

      // Réinitialiser tous les états liés au fichier précédent
      console.log("Réinitialisation des états");
      setFile(null);
      onFileUploaded("");
      onTicketDataExtracted(null, false);
      
      // Attendre que la réinitialisation soit effective
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Définir le nouveau fichier
      console.log("Définition du nouveau fichier généré");
      setFile(generatedFile);
      
      if (onGeneratedFileReady) {
        onGeneratedFileReady(generatedFile);
      }

      // Attendre un peu pour que l'état se stabilise
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Lancer automatiquement la validation et l'upload
      console.log("Lancement automatique de l'analyse");
      await validateAndProcessFile(generatedFile);
      
    } catch (error) {
      console.error("Erreur lors du traitement du fichier généré:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement du fichier généré",
        variant: "destructive",
      });
    } finally {
      setIsProcessingGenerated(false);
    }
  }, [uploading, isProcessingGenerated, onFileUploaded, onTicketDataExtracted, onGeneratedFileReady]);

  // Fonction principale de validation et traitement
  const validateAndProcessFile = useCallback(async (fileToProcess?: File) => {
    const targetFile = fileToProcess || file;
    
    if (!targetFile) {
      console.log("Aucun fichier à traiter");
      return;
    }
 
    if (uploading) {
      console.log("Traitement déjà en cours, abandon");
      return;
    }
 
    console.log("Début de la validation et upload pour:", targetFile.name);
    
    setUploading(true);
    
    // Réinitialiser les résultats précédents seulement si ce n'est pas un fichier généré
    if (!fileToProcess) {
      setSearchResults(null);
      setTicketIds(undefined);
      setInitialMessage("");
      onFileUploaded("");
    }
 
    try {
      // Extraction des données du ticket pour prévisualisation
      setProcessingStatus("extracting_preview");
      console.log("Extraction des données du ticket...");
     
      try {
        const extractionResult = await extractTicketDataFromExcel(targetFile);
        if (extractionResult.status === "success" && extractionResult.ticket_data) {
          onTicketDataExtracted(extractionResult.ticket_data, true);
          setTicketData(extractionResult.ticket_data);
          setLoadingAnalysis(true);
          console.log("Données du ticket extraites via API");
        } else {
          throw new Error("Extraction API échouée");
        }
      } catch (error) {
        console.log("Utilisation de la méthode d'extraction locale");
        const ticketData = await extractExcelData(targetFile);
        if (ticketData) {
          onTicketDataExtracted(ticketData, true);
          setTicketData(ticketData);
          setLoadingAnalysis(true);
          console.log("Données du ticket extraites (méthode locale)");
        }
      }
     
      // Validation du format du fichier Excel
      setProcessingStatus("format_validation");
      console.log("Validation du format...");
     
      const validation = await validateExcelFormat(targetFile);
      if (validation.isValid) {
        console.log("Format valide, démarrage de l'upload");
        await handleUpload(targetFile);
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
    } finally {
      setUploading(false);
    }
  }, [file, uploading, setSearchResults, setTicketIds, setInitialMessage, onFileUploaded, setProcessingStatus, onTicketDataExtracted, setTicketData, setLoadingAnalysis, toast]);

  // Créer la référence globale au montage
  useEffect(() => {
    window.ticketUploadRef = {
      processGeneratedFile: processGeneratedFile
    };
   
    console.log("Référence ticketUploadRef créée");
   
    return () => {
      if (window.ticketUploadRef) {
        delete window.ticketUploadRef;
        console.log("Référence ticketUploadRef supprimée");
      }
    };
  }, [processGeneratedFile]);

  // Gestion de la déconnexion utilisateur
  useEffect(() => {
    const handleUserLogout = () => {
      console.log("Déconnexion détectée - réinitialisation du composant TicketUpload");
      
      setFile(null);
      setUploading(false);
      setIsMinimized(false);
      setIsProcessingGenerated(false);
      
      onFileUploaded("");
      onTicketDataExtracted(null, false);
      
      if (window.ticketUploadRef) {
        delete window.ticketUploadRef;
      }
    };

    window.addEventListener('userLogout', handleUserLogout);
    
    return () => {
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, [onFileUploaded, onTicketDataExtracted]);

  // Gestion de la récupération d'état et minimisation
  useEffect(() => {
    continueProcessingIfNeeded();

    if (ticketState.processingState.inProgress && !file) {
      console.log("Restauration d'un traitement en cours");
      setUploading(true);
      if (ticketState.processingState.file) {
        setFile(ticketState.processingState.file);
      }
    }

    if (ticketState.ticketData && !file) {
      setUploading(ticketState.loadingAnalysis);
    }

    if (ticketState.searchResults && ticketState.searchResults.length > 0 && file) {
      setIsMinimized(true);
    } else if (!file) {
      setIsMinimized(false);
    }
  }, [ticketState, file, continueProcessingIfNeeded]);

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
            const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
            
            if (jsonData.length > 0) {
              const ticketData = jsonData[0];
              const knownColumns = [
                "key", "type", "created_date", "updated_date", "Affects_Version", "fix_version",
                "Components", "priority", "description", "assignee", "reporter", "status",
                "summary", "resolution", "comment", "inward_linked_issue_key", "message",
                "estimated_budget", "original_estimate", "estimation_due_date", "last_commented",
                "solution", "htu", "number_of_reject", "number_of_suspend", "fix_estimation",
                "classement", "git_branch", "rank", "reject_reason", "sprint", "participants",
                "rank_obsolete", "time_in_status", "impact", "date_of_first_response",
                "git_commits_referenced", "root_cause", "request_participants", "client_project", "commits",
              ];
              
              const cleanedData: Record<string, any> = {};
              knownColumns.forEach((column) => {
                if (ticketData[column] !== undefined && ticketData[column] !== null && ticketData[column] !== "") {
                  cleanedData[column] = String(ticketData[column]);
                }
              });
              
              Object.entries(ticketData).forEach(([key, value]) => {
                if (!knownColumns.includes(key) && value !== null && value !== undefined && value !== "") {
                  cleanedData[key] = String(value);
                }
              });
              
              resolve(cleanedData);
            } else {
              reject("Aucune donnée trouvée dans le fichier Excel");
            }
          } catch (error) {
            console.error("Erreur lors de l'extraction des données Excel:", error);
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

  const handleCancelUpload = () => {
    console.log("Annulation du traitement demandée par l'utilisateur");
    cancelProcessing();
    setProcessingStatus("cancelled");
    setUploading(false);
    setIsMinimized(false);
    setFile(null);
    setIsProcessingGenerated(false);
    onTicketDataExtracted(null, false);

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

  const handleUpload = async (targetFile?: File) => {
    const fileToUpload = targetFile || file;
    if (!fileToUpload) return;
    
    console.log("Début de l'upload pour:", fileToUpload.name);
    
    setSearchResults(null);
    setTicketIds(undefined);
    setInitialMessage("");
    onFileUploaded("");
    setContextProgress(0);
    
    try {
      setProcessingStatus("validating");
      const uploadPromise = startProcessing(fileToUpload);
      
      const simulateProgress = async () => {
        setProcessingStatus("reading_excel");
        setContextProgress(15);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        setProcessingStatus("extracting_data");
        setContextProgress(25);
        await new Promise((resolve) => setTimeout(resolve, 5500));
        
        setProcessingStatus("preprocessing");
        setContextProgress(45);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        setProcessingStatus("ai_analysis");
        setContextProgress(60);
        await new Promise((resolve) => setTimeout(resolve, 40000));
        
        setProcessingStatus("keyword_extraction");
        setContextProgress(75);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        setProcessingStatus("similarity_search");
        setContextProgress(85);
        await new Promise((resolve) => setTimeout(resolve, 2500));
        
        setProcessingStatus("finalizing");
        setContextProgress(95);
      };
      
      simulateProgress();
      
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
                ? response.tickets.reduce((sum, t) => sum + (t.similarity_score || 0), 0) / response.tickets.length
                : null;
              
              await addSearchToHistory(fileToUpload.name, {
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
          onFileUploaded("Aucun ticket similaire n'a été trouvé pour votre demande.");
        }
        
        setIsMinimized(true);
        setTimeout(() => {
          setContextProgress(0);
        }, 100);
        endProcessing();
      } else {
        onTicketDataExtracted(null, false);
        setProcessingStatus("error");
        throw new Error(response.message || "Erreur lors du traitement du fichier");
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
        onFileUploaded("Une erreur est survenue lors de l'analyse de votre ticket. Veuillez réessayer.");
      }
      setContextProgress(0);
      endProcessing();
    } finally {
      setUploading(false);
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
              console.log("Nouveau fichier accepté:", newFile.name);
              setFile(newFile);
              setIsProcessingGenerated(false);
              resetRecoveryState();
            }}
            isProcessingGenerated={isProcessingGenerated}
          />
        ) : (
          <FilePreview
            file={file}
            onRemove={() => {
              console.log("Suppression du fichier");
              setFile(null);
              onTicketDataExtracted(null, false);
              endProcessing();
              setIsProcessingGenerated(false);
              resetRecoveryState();
              setSearchResults(null);
              setTicketIds(undefined);
              setInitialMessage("");
              onFileUploaded("");
            }}
            onUpload={() => validateAndProcessFile()}
            uploading={uploading}
            processingStatus={ticketState.processingState.status}
            onCancel={handleCancelUpload}
          />
        )}
      </div>
      
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