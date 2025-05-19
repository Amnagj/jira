import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import {
  Tag, Info, FileText, Activity, ListFilter, Calendar, Users,
  Layers, BarChart, GitBranch, MessageSquare, HelpCircle,
  CheckCircle2, ChevronUp, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";


interface TicketDetailsProps {
  ticketData: Record<string, any> | null;
  loading: boolean;
}


export const TicketDetails = ({ ticketData, loading }: TicketDetailsProps) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [visibleFields, setVisibleFields] = useState<
    Array<{ key: string; displayName: string }>
  >([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedTicketFields, setDisplayedTicketFields] = useState<
    Array<{ key: string; displayName: string }>
  >([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);


  // Effet pour simuler l'affichage progressif pendant le chargement
  useEffect(() => {
    if (visibleFields.length > 0 && loading) {
      const interval = setInterval(() => {
        setCurrentFieldIndex((prev) => {
          if (prev >= visibleFields.length - 1) {
            return visibleFields.length - 1;
          }
          return prev + 1;
        });
      }, 2000); // 2 secondes entre chaque champ
     
      return () => clearInterval(interval);
    }
  }, [visibleFields, loading]);


  // Mise à jour des champs à afficher quand les données changent
  useEffect(() => {
    if (ticketData) {
      const priorityFieldsMap = [
        { key: "key", displayName: "Clé du ticket" },
        { key: "summary", displayName: "Résumé" },
        { key: "priority", displayName: "Priorité" },
        { key: "status", displayName: "Statut" },
        { key: "type", displayName: "Type" },
        { key: "created_date", displayName: "Date de création" },
        { key: "client_project", displayName: "Projet client" },
        { key: "root_cause", displayName: "Cause" },
        { key: "assignee", displayName: "Assigné à" },
        { key: "reporter", displayName: "Rapporté par" },
      ];
     
      const availableFields = priorityFieldsMap.filter(
        (field) =>
          ticketData[field.key] !== undefined &&
          ticketData[field.key] !== null &&
          ticketData[field.key] !== ""
      );
     
      setVisibleFields(availableFields);
      setCurrentFieldIndex(0);
    } else {
      setVisibleFields([]);
      setCurrentFieldIndex(0);
    }
  }, [ticketData]);


  // Effet pour mettre à jour les champs affichés progressivement
  useEffect(() => {
    if (visibleFields.length > 0) {
      setDisplayedTicketFields(visibleFields.slice(0, currentFieldIndex + 1));
    } else {
      setDisplayedTicketFields([]);
    }
  }, [visibleFields, currentFieldIndex]);


  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };


  const getFieldIcon = (key: string) => {
    switch (key) {
      case "key":
        return <Tag size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
      case "summary":
        return <Info size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
      case "priority":
        return <Activity size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
      case "status":
        return <ListFilter size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
      case "created_date":
        return <Calendar size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
      case "assignee":
        return <Users size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
      default:
        return <HelpCircle size={14} className={cn(isDark ? "text-indigo-300" : "text-indigo-600")} />;
    }
  };


  const formatFieldValue = (key: string, value: string) => {
    if (key === "priority") {
      return <span className="font-medium">{value}</span>;
    }
    if (key === "status") {
      return <span className="font-medium">{value}</span>;
    }
    return value;
  };


  if (!loading && !ticketData) return null;


  return (
    <div className="w-full mb-8">
      {ticketData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={cn("max-w-4xl mx-auto", loading ? "opacity-90" : "")}
        >
          <div
            className={cn(
              "sticky top-2 z-10 rounded-xl mb-4 py-3 px-4",
              isDark
                ? "bg-slate-900/80 text-blue-200 border border-slate-800"
                : "bg-white/90 text-blue-700 border border-slate-100"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {loading ? (
                  <span className="text-sm font-medium">Aperçu de votre ticket</span>
                ) : (
                  <span className="text-sm font-medium">Détails du ticket</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {visibleFields.length > 0 && (
                  <button
                    onClick={toggleExpand}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      isDark
                        ? "hover:bg-slate-700 text-slate-300"
                        : "hover:bg-slate-100 text-slate-500"
                    )}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>


          {isExpanded && (
            <div className="grid gap-2 mb-4 grid-cols-1">
              <AnimatePresence>
                {displayedTicketFields.map((field, index) => (
                  <motion.div
                    key={field.key}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: loading ? 0 : index * 0.1,
                    }}
                    className={cn(
                      "py-2 px-3 rounded-lg shadow-sm border",
                      isDark ? "bg-blue-900/10 border-blue-800/20" : "bg-white border-blue-100/80"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {getFieldIcon(field.key)}
                        </div>
                        <span className="text-sm font-medium">{field.displayName} :</span>
                     
                      <div className="text-sm ml-1">{formatFieldValue(field.key, String(ticketData[field.key]))}</div>
                    </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};



