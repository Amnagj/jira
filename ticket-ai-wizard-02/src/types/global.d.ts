// Créez un nouveau fichier : src/types/global.d.ts
declare global {
  interface Window {
    ticketUploadRef?: {
      processGeneratedFile: (file: File) => void;
    };
  }
}

export {};