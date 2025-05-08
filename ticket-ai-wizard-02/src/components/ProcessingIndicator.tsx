import { useEffect, useState } from "react";
import { Clock, FileText, Search, Braces, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet, Database, Sparkles, Server, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

type ProcessingIndicatorProps = {
  currentStep: string;
  isLongRunning: boolean;
};

export const ProcessingIndicator = ({ currentStep, isLongRunning }: ProcessingIndicatorProps) => {
  const [animateDots, setAnimateDots] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  // Animation effect for loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateDots((prev) => (prev >= 3 ? 0 : prev + 1));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const loadingDots = ".".repeat(animateDots);

  // Progress calculation based on currentStep
  useEffect(() => {
    const stepProgressMap: Record<string, number> = {
      "idle": 0,
      "validating": 5,
      "reading_excel": 15,
      "extracting_data": 25,
      "extracting_preview": 25,
      "format_validation": 35,
      "preprocessing": 45,
      "ai_analysis": 60,
      "keyword_extraction": 75,
      "similarity_search": 85,
      "finalizing": 95,
      "completed": 100,
      "error": 100,
      "cancelled": 100
    };

    setProgress(stepProgressMap[currentStep] || 0);
  }, [currentStep]);

  // Toggle showing all steps
  const toggleShowAllSteps = () => {
    setShowAllSteps((prev) => !prev);
  };

  // Define all steps
  const steps = [
    { 
      id: "reading_excel", 
      icon: <FileSpreadsheet className="h-4 w-4" />, 
      text: "Lecture du fichier Excel", 
      description: "Extraction des données du fichier Excel pour analyse"
    },
    { 
      id: "preprocessing", 
      icon: <FileText className="h-4 w-4" />, 
      text: "Prétraitement du ticket", 
      description: "Nettoyage et formatage des informations du ticket"
    },
    { 
      id: "ai_analysis", 
      icon: <Sparkles className="h-4 w-4" />, 
      text: "Analyse IA du ticket", 
      description: "Application d'algorithmes d'IA pour comprendre le contenu"
    },
    { 
      id: "keyword_extraction", 
      icon: <Search className="h-4 w-4" />, 
      text: "Extraction des mots-clés", 
      description: "Identification des termes importants pour la recherche"
    },
    { 
      id: "similarity_search", 
      icon: <Database className="h-4 w-4" />, 
      text: "Recherche de tickets similaires", 
      description: "Comparaison avec la base de données des tickets existants"
    },
    { 
      id: "finalizing", 
      icon: <Server className="h-4 w-4" />, 
      text: "Finalisation des résultats", 
      description: "Préparation et tri des meilleurs résultats"
    }
  ];

  // Map status to current step
  const getActiveStep = () => {
    // Get the current active step
    let activeStepInfo = steps.find(step => step.id === currentStep);
    
    if (!activeStepInfo) {
      // Handle special statuses
      switch (currentStep) {
        case "idle":
          return { 
            icon: <Clock className="h-5 w-5" />, 
            text: "Prêt", 
            color: "text-gray-500",
            description: "En attente de traitement"
          };
        case "validating":
        case "format_validation":
          return { 
            icon: <FileText className="h-5 w-5" />, 
            text: `Validation du fichier ${loadingDots}`, 
            color: "text-blue-500",
            description: "Vérification du format et de la structure du fichier"
          };
        case "extracting_data":
        case "extracting_preview":
          return { 
            icon: <Braces className="h-5 w-5" />, 
            text: `Extraction des données ${loadingDots}`, 
            color: "text-blue-500",
            description: "Lecture et extraction du contenu du fichier"
          };
        case "completed":
          return { 
            icon: <CheckCircle className="h-5 w-5" />, 
            text: "Traitement terminé", 
            color: "text-green-500",
            description: "Le traitement est complet"
          };
        case "error":
          return { 
            icon: <AlertTriangle className="h-5 w-5" />, 
            text: "Erreur de traitement", 
            color: "text-red-500",
            description: "Une erreur est survenue pendant le traitement"
          };
        case "cancelled":
          return { 
            icon: <XCircle className="h-5 w-5" />, 
            text: "Traitement annulé", 
            color: "text-blue-500",
            description: "Le traitement a été annulé par l'utilisateur"
          };
        default:
          return { 
            icon: <RefreshCw className="h-5 w-5" />, 
            text: "Traitement en cours", 
            color: "text-blue-500",
            description: "Traitement du ticket en cours"
          };
      }
    } else {
      // Return the found step with loading dots
      return {
        icon: activeStepInfo.icon,
        text: `${activeStepInfo.text} ${loadingDots}`,
        color: "text-blue-500",
        description: activeStepInfo.description
      };
    }
  };

  const { icon, text, color, description } = getActiveStep();

  // Calculate which steps are completed, current, and pending
  const getStepStatus = (stepId: string) => {
    const stepOrder = [
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
    
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (currentIndex === -1 || stepIndex === -1) return "pending";
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="flex flex-col space-y-4 w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
      {/* Current step info */}
      <div className="flex flex-col space-y-2">
        <div className={cn("flex items-center space-x-2", color)}>
          {icon}
          <span className="font-medium">{text}</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        
        {/* Progress indicator */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
          <div 
            className="bg-blue-600 dark:bg-blue-500 h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Show all steps when clicked */}
      <div className="mt-2">
        <button 
          onClick={toggleShowAllSteps}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
        >
          {showAllSteps ? "Masquer les étapes" : "Voir toutes les étapes"} 
        </button>
        
        {showAllSteps && (
          <div className="mt-3 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            {steps.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center text-sm py-1",
                    status === "completed" ? "text-green-600 dark:text-green-500" :
                    status === "current" ? "text-blue-600 dark:text-blue-500" :
                    "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {status === "completed" ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : status === "current" ? (
                    <div className="mr-2">{step.icon}</div>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-600 mr-2">{step.icon}</div>
                  )}
                  <span>
                    {step.text}
                    {status === "current" && loadingDots}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Long running warning */}
      {isLongRunning && (
        <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
          <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
          <span>Le traitement prend plus de temps que prévu, mais est toujours en cours...</span>
        </div>
      )}
    </div>
  );
};

export default ProcessingIndicator;