// src/components/ticket/FilePreview.tsx
import { useState, useEffect } from "react";
import { File, Upload, X, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { ProcessingIndicator } from "@/components/ProcessingIndicator";
import { useTicketState } from "@/components/TicketStateContext";

type FilePreviewProps = {
  file: File;
  onRemove: () => void;
  onUpload: () => void;
  onCancel: () => void;
  processingStatus?: string;
  uploading: boolean;
};

export const FilePreview = ({
  file,
  onRemove,
  onUpload,
  onCancel,
  uploading,
  processingStatus = "validating", // Valeur par défaut
}: FilePreviewProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isReady, setIsReady] = useState(false);
  const { ticketState } = useTicketState();
  
  // Utiliser directement les informations de l'état de traitement depuis le contexte
  const processingStep = ticketState.processingState.status;
  
  // Détecter les traitements qui prennent trop de temps (> 90 secondes)
  const [isLongRunning, setIsLongRunning] = useState(false);
  
  useEffect(() => {
    // Vérifier si le traitement prend trop de temps
    if (uploading && ticketState.processingState.startTime) {
      const checkDuration = () => {
        const now = Date.now();
        const duration = now - (ticketState.processingState.startTime || now);
        if (duration > 90000) { // 90 secondes
          setIsLongRunning(true);
        }
      };
      
      const timer = setInterval(checkDuration, 5000);
      return () => clearInterval(timer);
    }
    
    return () => {};
  }, [uploading, ticketState.processingState.startTime]);

  useEffect(() => {
    // Simulate file validation delay
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [file]);

  // Format file size
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        isDark
          ? "border-blue-800/50 bg-blue-950/80" // Plus bleu et plus foncé
          : "border-blue-200 bg-blue-50/70", // Plus bleu et plus visible
        uploading && "border-blue-500/70" // Bordure plus visible pendant le chargement
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              isDark ? "bg-blue-900/50" : "bg-blue-100"
            )}
          >
            <File
              className={cn(
                "h-4 w-4",
                isDark ? "text-blue-400" : "text-blue-600"
              )}
            />
          </div>
          <div>
            <h3
              className={cn(
                "text-xs font-medium",
                isDark ? "text-white" : "text-slate-900"
              )}
            >
              {file.name}
            </h3>
            <p
              className={cn(
                "text-xs",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
          {!uploading && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
      </div>
      {uploading ? (
        <div className="mt-3"> 
          <ProcessingIndicator
            currentStep={processingStep}
            isLongRunning={isLongRunning}
          />
          <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className={cn(
              "flex items-center gap-2 text-xs py-1 h-7",
              isDark
                ? "border-red-800/50 bg-red-900/30 text-red-400 hover:bg-red-900/40"
                : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
            )}
          >
            <StopCircle className="h-3 w-3" />
            Annuler le traitement
          </Button>

          </div>
        </div>
      ) : (
        <div className="mt-4">
          {!isReady ? (
            <div
            className={cn(
              "flex items-center justify-center py-3",
              isDark ? "text-blue-400" : "text-blue-600" // Bleu au lieu de slate
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              <span className="animate-spin">
                <Upload className="h-4 w-4" />
              </span>
              Vérification du fichier...
            </span>
          </div>
          ) : (
            <Button
              onClick={onUpload}
              className={cn(
                "w-full h-8 text-sm",
                isDark
                  ? "bg-blue-700 text-white hover:bg-blue-800" // Bleu plus foncé pour un meilleur contraste
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              <Upload className="mr-2 h-3 w-3" />
              Analyser le ticket
            </Button>
          )}
        </div>
      )}
    </div>
  );
};