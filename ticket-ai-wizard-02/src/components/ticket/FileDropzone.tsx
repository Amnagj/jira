
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
    isProcessingGenerated?: boolean;

}

export const FileDropzone = ({ onFileAccepted, isProcessingGenerated }: FileDropzoneProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      
      if (
        fileName.endsWith('.xlsx') 

      ) {
        onFileAccepted(selectedFile);
        toast({
          title: "Fichier accepté",
          description: `Le fichier ${selectedFile.name} a été chargé avec succès`,
        });
      } else {
        toast({
          title: "Format non supporté",
          description: "Veuillez télécharger un fichier Excel (.xlsx, .xls) ou CSV",
          variant: "destructive",
        });
      }
    }
  }, [toast, onFileAccepted]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    multiple: false,
  });

// Modifiez le return de FileDropzone pour mieux gérer l'état de traitement généré:
// Modifiez le return de FileDropzone pour mieux gérer l'état de traitement généré:

return (
  <div
    {...getRootProps()}
    className={cn(
      "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
      isProcessingGenerated
        ? isDark
          ? "border-green-500 bg-green-900/20 cursor-not-allowed"
          : "border-green-500 bg-green-50 cursor-not-allowed"
        : isDragActive
        ? isDark
          ? "border-blue-500 bg-blue-900/20 cursor-copy"
          : "border-blue-500 bg-blue-50 cursor-copy"
        : isDark
          ? "border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 cursor-pointer"
          : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer"
    )}
  >
    <input {...getInputProps()} disabled={isProcessingGenerated} />
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className={cn(
        "p-3 rounded-full transition-all",
        isProcessingGenerated
          ? isDark
            ? "bg-green-900/50 animate-pulse"
            : "bg-green-100 animate-pulse"
          : isDragActive
          ? isDark
            ? "bg-blue-900/50"
            : "bg-blue-100"
          : isDark
            ? "bg-gray-800"
            : "bg-gray-100"
      )}>
        <Upload
          size={28}
          className={cn(
            "transition-all",
            isProcessingGenerated
              ? 'text-green-600 animate-bounce'
              : isDragActive
              ? 'text-blue-600'
              : 'text-gray-400'
          )}
        />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {isProcessingGenerated
          ? "Fichier généré - Traitement en cours..."
          : isDragActive
          ? "Déposez votre fichier ici"
          : "Importer un ticket"
        }
      </h3>
      <p className={cn(
        "text-sm",
        isDark ? "text-gray-400" : "text-gray-500"
      )}>
        {isProcessingGenerated
          ? "Le fichier créé va être traité automatiquement"
          : "Formats supportés: XLSX"
        }
      </p>
      {!isProcessingGenerated && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "mt-2",
            isDark
              ? "border-blue-700 text-blue-400 hover:bg-blue-900/30"
              : "border-blue-200 text-blue-600 hover:bg-blue-50"
          )}
        >
          Parcourir les fichiers
        </Button>
      )}
    </div>
  </div>
);
};

