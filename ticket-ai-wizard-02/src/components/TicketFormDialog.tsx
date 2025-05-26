// src/components/TicketFormDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Save, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface TicketFormDialogProps {
  onFileGenerated: (file: File) => void;
  trigger?: React.ReactNode;
}

export const TicketFormDialog: React.FC<TicketFormDialogProps> = ({
  onFileGenerated,
  trigger
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [open, setOpen] = useState(false);

  // Structure des champs avec leurs labels en français
  const ticketFields = [
    { key: 'key', label: 'Clé du ticket', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'text', required: true },
    { key: 'summary', label: 'Résumé', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'priority', label: 'Priorité', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    { key: 'status', label: 'Statut', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
    { key: 'assignee', label: 'Assigné à', type: 'text' },
    { key: 'reporter', label: 'Rapporteur', type: 'text' },
    { key: 'created_date', label: 'Date de création', type: 'date' },
    { key: 'updated_date', label: 'Date de mise à jour', type: 'date' },
    { key: 'Affects_Version', label: 'Version affectée', type: 'text' },
    { key: 'fix_version', label: 'Version de correction', type: 'text' },
    { key: 'Components', label: 'Composants', type: 'text' },
    { key: 'resolution', label: 'Résolution', type: 'textarea' },
    { key: 'comment', label: 'Commentaire', type: 'textarea' },
    { key: 'estimated_budget', label: 'Budget estimé', type: 'number' },
    { key: 'original_estimate', label: 'Estimation originale', type: 'text' },
    { key: 'solution', label: 'Solution', type: 'textarea' },
    { key: 'impact', label: 'Impact', type: 'textarea' },
    { key: 'root_cause', label: 'Cause racine', type: 'textarea' },
    { key: 'client_project', label: 'Projet client', type: 'text' }
  ];

  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

const handleFileGenerated = (file: File) => {
  console.log("Fichier généré reçu dans le composant parent:", file.name);
  
  // Appeler la méthode globale pour traiter le fichier
  if (window.ticketUploadRef?.processGeneratedFile) {
    console.log("Appel de processGeneratedFile via la référence globale");
    window.ticketUploadRef.processGeneratedFile(file);
  } else {
    console.error("Référence ticketUploadRef non trouvée");
  }
};
  const handleSubmit = () => {
  // Validation des champs requis
  const requiredFields = ticketFields.filter(field => field.required);
  const missingFields = requiredFields.filter(field => !formData[field.key]?.trim());
 
  if (missingFields.length > 0) {
    alert(`Veuillez remplir les champs obligatoires : ${missingFields.map(f => f.label).join(', ')}`);
    return;
  }

  // Créer et traiter le fichier Excel
  generateExcelFile();
};


// Remplacez la fonction generateExcelFile dans TicketFormDialog.tsx par :

const generateExcelFile = () => {
  try {
    console.log("Génération du fichier Excel avec les données:", formData);
   
    // Tous les headers du template original
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

    // Créer une ligne de données avec les valeurs du formulaire
    const rowData = headers.map(header => {
      const value = formData[header];
      return value !== undefined && value !== null ? String(value) : '';
    });

    console.log("Données du fichier Excel:", { headers, rowData });

    // Créer la feuille de calcul
    const worksheet = XLSX.utils.aoa_to_sheet([headers, rowData]);
   
    // Créer le classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ticket");

    // Convertir en buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
   
    // Créer un blob et un fichier
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
   
    const fileName = `ticket_${formData.key || 'nouveau'}_${Date.now()}.xlsx`;
    const file = new File([blob], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    console.log("Fichier Excel créé:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Fermer le dialog
    setOpen(false);
    setFormData({});
   
    // Attendre que le dialog se ferme complètement et que les composants se montent
    setTimeout(() => {
      console.log("Appel du callback onFileGenerated avec délai");
      onFileGenerated(file);
    }, 500); // Délai plus long pour s'assurer que les composants sont montés
   
  } catch (error) {
    console.error('Erreur lors de la génération du fichier Excel:', error);
    alert('Erreur lors de la génération du fichier Excel: ' + (error as Error).message);
  }
};
  const renderField = (field: typeof ticketFields[0]) => {
    const value = formData[field.key] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={`Entrez ${field.label.toLowerCase()}`}
            className={cn(
              "min-h-[80px]",
              isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
            )}
          />
        );
      
      case 'select':
        return (
          <select
            id={field.key}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-md border",
              isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300"
            )}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <Input
            id={field.key}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={`Entrez ${field.label.toLowerCase()}`}
            className={isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}
          />
        );
      
      case 'date':
        return (
          <Input
            id={field.key}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className={isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}
          />
        );
      
      default:
        return (
          <Input
            id={field.key}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={`Entrez ${field.label.toLowerCase()}`}
            className={isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center gap-2",
              isDark ? "border-white/20 hover:bg-white/10" : "border-gray-300 hover:bg-gray-50"
            )}
          >
            <Plus size={16} />
            Créer un ticket
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className={cn(
        "max-w-4xl max-h-[90vh] overflow-hidden",
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      )}>
        <DialogHeader>
          <DialogTitle className={cn(
            "flex items-center gap-2 text-xl",
            isDark ? "text-white" : "text-gray-900"
          )}>
            <Plus size={20} />
            Créer un nouveau ticket
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {ticketFields.map((field) => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label 
                  htmlFor={field.key}
                  className={cn(
                    "text-sm font-medium mb-2 block",
                    field.required && "after:content-['*'] after:text-red-500 after:ml-1",
                    isDark ? "text-gray-200" : "text-gray-700"
                  )}
                >
                  {field.label}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className={isDark ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50"}
          >
            <X size={16} className="mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={16} className="mr-2" />
            Créer le ticket
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};