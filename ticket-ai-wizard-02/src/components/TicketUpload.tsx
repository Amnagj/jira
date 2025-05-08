// src/components/TicketUpload.tsx
import { useState, useEffect } from "react";
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
} from "../api/fastApiService";
import * as XLSX from "xlsx";
import { Check, Clock, FileSearch, ZapIcon, AlertCircle } from "lucide-react";

export const TicketUpload = ({
  onFileUploaded,
  onTicketDataExtracted,
}: {
  onFileUploaded: (text: string, ticketIds?: string[], results?: any[]) => void;
  onTicketDataExtracted: (
    data: Record<string, any> | null,
    loading: boolean
  ) => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();
  const { addToHistory, refreshHistory } = useSearchHistory();
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
    setProgress: setContextProgress,
    setProcessingStatus,
  } = useTicketState();
  const isDark = theme === "dark";

  // Restauration du fichier et de l'état depuis le contexte global
  useEffect(() => {
    // Vérifier si un traitement doit être continué au montage du composant
    continueProcessingIfNeeded();
    
    // Si un traitement est en cours selon le contexte global
    if (ticketState.processingState.inProgress && !file) {
      console.log(
        "Restauration d'un traitement en cours depuis le contexte global"
      );
      setUploading(true);
      
      // Restaurer le fichier si disponible
      if (ticketState.processingState.file) {
        setFile(ticketState.processingState.file);
      }
    }
    
    // Si nous avons des données de ticket mais pas de fichier
    if (ticketState.ticketData && !file) {
      setUploading(ticketState.loadingAnalysis);
    }
    
    // Si nous avons des résultats de recherche, considérer que le traitement est terminé
    if (ticketState.searchResults && ticketState.searchResults.length > 0) {
      setIsMinimized(true);
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

  const validateAndUpload = async () => {
    if (!file) return;
    try {
      try {
        // Extraction des données du ticket pour prévisualisation
        setProcessingStatus("extracting_preview");
        const extractionResult = await extractTicketDataFromExcel(file);
        if (
          extractionResult.status === "success" &&
          extractionResult.ticket_data
        ) {
          onTicketDataExtracted(extractionResult.ticket_data, true);
          setTicketData(extractionResult.ticket_data);
          setLoadingAnalysis(true);
          console.log(
            "Données du ticket extraites:",
            extractionResult.ticket_data
          );
        } else {
          // Méthode alternative d'extraction si l'API échoue
          const ticketData = await extractExcelData(file);
          if (ticketData) {
            onTicketDataExtracted(ticketData, true);
            setTicketData(ticketData);
            setLoadingAnalysis(true);
            console.log(
              "Données du ticket extraites (méthode locale):",
              ticketData
            );
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de l'extraction des données du ticket:",
          error
        );
      }
      
      // Validation du format du fichier Excel
      setProcessingStatus("format_validation");
      const validation = await validateExcelFormat(file);
      if (validation.isValid) {
        handleUpload();
      } else {
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
      console.error("Error validating file:", error);
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
  };

  // Fonction pour gérer l'annulation du traitement
  const handleCancelUpload = () => {
    console.log("Annulation du traitement demandée par l'utilisateur");
    setProcessingStatus("cancelled");
    cancelProcessing(); // Appeler la fonction d'annulation du contexte
    setUploading(false);
    onTicketDataExtracted(null, false);
    // Ajouter ce toast pour confirmer l'annulation
    toast({
      title: "Traitement annulé",
      description: "L'analyse du ticket a été annulée avec succès.",
      variant: "default",
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setContextProgress(0);
    
    try {
      // Démarrer le traitement via le contexte global pour maintenir l'état
      setProcessingStatus("validating"); // Commencer par la validation
      const uploadPromise = startProcessing(file);
      
      // Simuler l'avancement des différentes étapes
      const simulateProgress = async () => {
        // Lecture du fichier Excel
        setProcessingStatus("reading_excel");
        setContextProgress(15);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Extraction des données
        setProcessingStatus("extracting_data");
        setContextProgress(25);
        await new Promise(resolve => setTimeout(resolve, 5500));
        
        // Prétraitement
        setProcessingStatus("preprocessing");
        setContextProgress(45);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Analyse IA du ticket
        setProcessingStatus("ai_analysis");
        setContextProgress(60);
        await new Promise(resolve => setTimeout(resolve, 40000));
        
        // Extraction des mots-clés
        setProcessingStatus("keyword_extraction");
        setContextProgress(75);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Recherche de tickets similaires
        setProcessingStatus("similarity_search");
        setContextProgress(85);
        await new Promise(resolve => setTimeout(resolve, 2500));
        
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
              await addToHistory({
                queryText: file.name,
                result: responseMessage,
                ticketIds: ticketIds,
              });
              console.log("Ajout à l'historique réussi");
              await refreshHistory();
            } catch (error) {
              console.error("Erreur lors de l'ajout à l'historique:", error);
            }
          }
          
          // Mettre à jour le contexte global avec les résultats
          setInitialMessage(responseMessage);
          setTicketIds(ticketIds);
          setSearchResults(response.tickets);
          
          // Appeler aussi le callback local
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
    <div className="flex flex-col md:flex-row gap-6">
      <div
        className={cn(
          "transition-all duration-300",
          isMinimized ? "w-full md:w-1/3" : "w-full md:w-2/3"
        )}
      >
        {!file ? (
          <FileDropzone onFileAccepted={setFile} />
        ) : (
          <FilePreview
            file={file}
            onRemove={() => {
              setFile(null);
              onTicketDataExtracted(null, false);
              endProcessing();
            }}
            onUpload={validateAndUpload}
            uploading={uploading}
            // Remplacez ou ajoutez la prop processingStatus
            processingStatus={ticketState.processingState.status}
            onCancel={handleCancelUpload}
          />
        )}
      </div>
      {!file && (
        <div className={cn("transition-all duration-300", "w-full md:w-1/3")}>
          <TicketInstructions />
        </div>
      )}
    </div>
  );
};