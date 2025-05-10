
import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot , Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { recordMessage } from "../api/mongodb";
import { useTheme } from "@/hooks/useTheme";
import { Badge } from "@/components/ui/badge";
import { SimilarityResults } from "./SimilarityResults";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  ticketIds?: string[];
}

interface ChatInterfaceProps {
  initialMessage?: string;
  ticketIds?: string[];
}

export const ChatInterface = ({ initialMessage, ticketIds }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [similarTickets, setSimilarTickets] = useState<Array<{
    ticket_id: string;
    problem: string;
    solution: string;
    keywords: string;
    similarity_score: number;
  }>>([]);
  const [searchTime, setSearchTime] = useState<number | undefined>();
  const [isSearching, setIsSearching] = useState(false);  
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";



 // Message component avec un affichage amélioré
const MessageComponent = ({ message }: { message: Message }) => {
  return (
    <div className="flex w-full mb-4 justify-start">
      <div className={cn(
        "flex max-w-[90%] rounded-xl p-4 space-x-3 items-start transition-all",
        isDark
          ? "bg-slate-800/90 text-blue-100 rounded-tl-none shadow-md shadow-slate-900/20"
          : "bg-white text-slate-900 rounded-tl-none border border-gray-200 shadow-sm"
      )}>
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-1",
          isDark ? "bg-slate-700" : "bg-blue-100"
        )}>
          <Bot size={16} className={isDark ? "text-blue-300" : "text-blue-600"} />
        </div>
        <div className="flex-1 leading-relaxed space-y-1">
          <div className={cn(
            "text-sm",
            isDark ? "text-blue-50" : "text-slate-900"
          )}>
            {message.content}
            {/* Affichage amélioré des tickets similaires en badges */}
            {message.ticketIds && message.ticketIds.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium  w-full mb-2 flex items-center gap-1">
                  <Search size={10} className={isDark ? "text-blue-400" : "text-blue-600"} />
                  Tickets similaires:
                </span>
                <div className="flex flex-wrap gap-2">
                  {message.ticketIds.map((id, index) => (
                    <Badge
                      key={id}
                      variant="outline"
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 transition-all",
                        isDark 
                          ? "bg-blue-900/30 text-blue-200 hover:bg-blue-800/40" 
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      )}
                    >
                      <span className="font-mono">{id}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};  return (
    <div className={cn(
      
    )}>
      
      
    </div>
  );
};
