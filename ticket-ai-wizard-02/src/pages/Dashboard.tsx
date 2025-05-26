import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { TicketUpload } from "@/components/TicketUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { TicketDetails } from "@/components/TicketsDetails";
import StarfieldBackground from "@/components/StarfieldBackground";
import { CosmicElements, GlowingOrb } from "@/components/CosmicElements";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { SearchHistory } from "@/components/SearchHistory";
import { SimilarityResults } from "@/components/SimilarityResults";
import { useTicketState } from "@/components/TicketStateContext";
import { Button } from "@/components/ui/button";
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from "lucide-react";
import { TicketFormDialog } from "@/components/TicketFormDialog";

import { StopCircle, Eye, EyeOff, ChevronLeft, ChevronRight, Download } from "lucide-react";
const Dashboard = () => {
  const {
    ticketState,
    setInitialMessage,
    setTicketIds,
    setSearchResults,
    setTicketData,
    setLoadingAnalysis,
    cancelProcessing
  } = useTicketState();
  
  const {
    initialMessage,
    ticketIds,
    ticketData,
    loadingAnalysis,
    searchResults,
    processingState
  } = ticketState;
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // État pour gérer l'affichage du panneau d'historique
  const [historyPanelVisible, setHistoryPanelVisible] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateRows, setTemplateRows] = useState([{}]);
  // Callbacks pour maintenir la cohérence avec l'état global
  const handleFileUploaded = (message: string, ids?: string[], results?: any[]) => {
    setInitialMessage(message);
    setTicketIds(ids || undefined);
    setSearchResults(message ? (results || null) : null);
  };
  
  const handleTicketDataExtracted = (data: Record<string, any> | null, loading: boolean) => {
    setTicketData(data);
    setLoadingAnalysis(loading);
  };
  const [pendingGeneratedFile, setPendingGeneratedFile] = useState<File | null>(null);

  const handleCancelProcessing = () => {
    console.log("Annulation du traitement demandée depuis Dashboard");
    cancelProcessing();
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
// Remplacez la fonction handleGeneratedFile dans Dashboard.tsx par :

const handleFileGenerated = (file: File) => {
  console.log("Fichier généré dans Dashboard:", file.name);
  
  // Fonction de retry améliorée avec plus de tentatives et délais progressifs
  const attemptTransmission = (attempt: number = 1, maxAttempts: number = 20) => {
    if (window.ticketUploadRef?.processGeneratedFile) {
      console.log(`Transmission réussie à la tentative ${attempt}`);
      window.ticketUploadRef.processGeneratedFile(file);
      return;
    }
    
    if (attempt < maxAttempts) {
      console.log(`Tentative ${attempt}/${maxAttempts} - Référence non disponible, retry dans ${attempt * 100}ms`);
      setTimeout(() => {
        attemptTransmission(attempt + 1, maxAttempts);
      }, attempt * 100); // Délai progressif
    } else {
      console.error("Impossible de transmettre le fichier après", maxAttempts, "tentatives");
      
      // Fallback : déclencher un événement personnalisé
      console.log("Utilisation du fallback avec événement personnalisé");
      const event = new CustomEvent('generatedFileReady', { 
        detail: { file } 
      });
      window.dispatchEvent(event);
    }
  };
  
  // Commencer les tentatives immédiatement
  attemptTransmission();
};
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };
  
  // Détermine si l'interface est en mode analyse ou en mode résultats
  const isAnalysisMode = loadingAnalysis || (ticketData && !searchResults?.length);
  const isResultsMode = searchResults && searchResults.length > 0;
  
  // Gérer le toggle du panneau d'historique
  const toggleHistoryPanel = () => {
    setHistoryPanelVisible(!historyPanelVisible);
  };
  const downloadTemplate = () => {
    const headers = [
      "key", "type", "created_date", "updated_date", "Affects_Version", "fix_version",
      "Components", "priority", "description", "assignee", "reporter", "status",
      "summary", "resolution", "comment", "inward_linked_issue_key", "message",
      "estimated_budget", "original_estimate", "estimation_due_date", "last_commented",
      "solution", "htu", "number_of_reject", "number_of_suspend", "fix_estimation",
      "classement", "git_branch", "rank", "reject_reason", "sprint", "participants",
      "rank_obsolete", "time_in_status", "impact", "date_of_first_response",
      "git_commits_referenced", "root_cause", "request_participants", "client_project", "commits"
    ];
    
    // Créer une feuille de calcul avec les en-têtes
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    
    // Créer un classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    
    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, 'ticket_template.xlsx');
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sourcesans text-foreground">
      {isDark && <StarfieldBackground />}
      {isDark && <CosmicElements />}
      <Navbar />
      {/* Main content area with flexible layout */}
      <main className="container mx-auto pt-12 px-4 relative z-10 pb-10">
        <motion.div
          className="mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="text-center mb-4">
            <div className="flex justify-between items-center mb-0 mt-4">
  <h1 className={cn(
    "text-xl md:text-2xl font-bold text-gradient",
    isDark ? "text-white" : "text-gray-800"
  )}>
  </h1>
  
  <div className="flex gap-2">
    
    <TicketFormDialog 
  onFileGenerated={handleFileGenerated}
  trigger={<Button>Créer un ticket</Button>}
/>
    <Button
      onClick={downloadTemplate}
      variant="outline"
      size="sm"
      className={cn(
        "flex items-center gap-2",
        isDark ? "border-white/20 hover:bg-white/10" : "border-gray-300 hover:bg-gray-50"
      )}
    >
      <Download size={16} />
      Télécharger template
    </Button>
  </div>
</div>
          </motion.div>
          
          <div className="flex flex-col md:flex-row gap-4 relative">
            {/* History panel with toggle button */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 1, x: historyPanelVisible ? 0 : -300 }}
                animate={{ opacity: 1, x: historyPanelVisible ? 0 : -300 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "md:w-72 lg:w-80 transition-all duration-300 absolute md:relative z-20",
                  !historyPanelVisible && "md:hidden"
                )}
              >
                <SearchHistory />
              </motion.div>
              
              <button 
                onClick={toggleHistoryPanel}
                className={cn(
                  "absolute top-2 -right-10 z-30 p-2 rounded-full md:flex items-center justify-center hidden",
                  isDark ? "bg-blue-900/50 hover:bg-blue-800" : "bg-blue-100 hover:bg-blue-200"
                )}
              >
                {historyPanelVisible ? 
                  <ChevronLeft size={18} /> : 
                  <ChevronRight size={18} />
                }
              </button>
            </div>
            
            {/* Main content area with flexible width */}
            <motion.div
              variants={itemVariants}
              className={cn(
                "flex-grow transition-all duration-300",
                historyPanelVisible ? "md:ml-4" : ""
              )}
            >
              {/* Upload section - more compact with balanced proportions */}
              <motion.div variants={itemVariants}>
                <div className={cn(
                  "mb-3 p-3 rounded-xl border",
                  isDark ? "bg-card/20 border-white/10" : "bg-white border-gray-200"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className={cn(
                      "text-base font-medium",
                      isDark ? "text-white" : "text-gray-800"
                    )}>
                      Importer votre ticket
                    </h2>
                    
                    
                  </div>
                  
                  {/* File upload component with improved layout */}
                  <div className="overflow-visible">
                    <TicketUpload
                      onFileUploaded={handleFileUploaded}
                      onTicketDataExtracted={handleTicketDataExtracted}
                      onGeneratedFileReady={handleFileGenerated}
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Results display with improved proportions */}
              <div className="flex flex-col gap-4">
                {/* Ticket details with standardized height */}
                {(loadingAnalysis || ticketData) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-2"
                  >
                    <div className={cn(
                      "rounded-xl border overflow-hidden",
                      isDark ? "bg-card/20 border-white/10" : "bg-white border-gray-200"
                    )}>
                      <TicketDetails
                        ticketData={ticketData}
                        loading={loadingAnalysis}
                      />
                    </div>
                  </motion.div>
                )}
                
                {/* Similarity results with consistent sizing */}
                {searchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-2"
                  >
                    <div className={cn(
                      "rounded-xl border overflow-hidden max-h-[400px]",
                      isDark ? "bg-card/20 border-white/10" : "bg-white border-gray-200"
                    )}>
                      <SimilarityResults
                        tickets={searchResults}
                        loading={false}
                      />
                    </div>
                  </motion.div>
                )}
                
                {/* Chat interface */}
                {initialMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-2"
                  >
                    <div className={cn(
                      "rounded-xl border overflow-hidden",
                      isDark ? "bg-card/20 border-white/10" : "bg-white border-gray-200"
                    )}>
                      <ChatInterface
                        initialMessage={initialMessage}
                        ticketIds={ticketIds}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
      
      {isDark && (
        <>
          <GlowingOrb className="fixed top-1/4 left-1/5 -z-10" size={250} color="rgba(79, 70, 229, 0.08)" />
          <GlowingOrb className="fixed bottom-1/4 right-1/5 -z-10" size={300} color="rgba(124, 58, 237, 0.06)" />
        </>
      )}
    </div>
  );
};

export default Dashboard;