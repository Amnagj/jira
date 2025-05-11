import axios from 'axios';
import * as XLSX from 'xlsx';
// Base URL for our FastAPI backend
export const API_BASE_URL = 'http://localhost:8000';
// Interface for the ticket search response
interface TicketSearchResponse {
  status: 'success' | 'not_found' | 'error';
  message: string;
  tickets?: {
    ticket_id: string;
    problem: string;
    solution: string;
    keywords: string;
    similarity_score: number;
  }[];
  temps_recherche?: number;
  query?: string;
}
// Interface for the file upload response
interface FileUploadResponse {
  status: 'success' | 'error';
  message: string;
  processed_tickets?: number;
  timestamp?: string;
}
// Interface pour la création d'utilisateur
interface UserCreationResponse {
  status: 'success' | 'partial_success' | 'error';
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
    isAdmin: boolean;
  };
  password?: string; // Mot de passe généré
}
interface SearchHistoryItem {
  id: string;
  userId: string;
  queryText: string;
  result: string;
  ticketIds?: string[];
  timestamp: number;
  visible: boolean;
  similarity_score?: number | null;  // Nouveau champ
  search_time?: number | null;
}
// Interface pour la réponse d'historique
interface SearchHistoryResponse {
  status: 'success' | 'error';
  history?: SearchHistoryItem[];
  message?: string;
}
/**
 * Valide si le fichier Excel est correctement formaté pour la recherche
 * (doit contenir un en-tête et une seule ligne de données)
 */
export async function validateExcelFormat(file: File): Promise<{ isValid: boolean; message: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
   
    const response = await axios.post(`${API_BASE_URL}/validate-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
   
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la validation du fichier:', error);
    return {
      isValid: false,
      message: "Erreur lors de la validation du format du fichier Excel."
    };
  }
}

/**
 * Recherche de tickets similaires
 */
export async function searchSimilarTickets(ticketText: string): Promise<TicketSearchResponse> {
  try {
      const response = await axios.post(`${API_BASE_URL}/search-tickets`, {
          ticket_text: ticketText
      });
      
      const userData = localStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      const token = localStorage.getItem('token');
      
      if (token && user) {
          try {
              // Calculer le score de similarité moyen s'il existe des tickets
              let maxSimilarity = null;
              if (response.data?.tickets && response.data.tickets.length > 0) {
                  const similarityScores = response.data.tickets.map((t: any) => t.similarity_score || 0);
                  const maxSimilarity = Math.max(...similarityScores);  // Utiliser le score max
              }
              
              await addSearchToHistory(ticketText, {
                  result: JSON.stringify(response.data),
                  ticketIds: response.data?.tickets?.map((t: any) => t.ticket_id) || [],
                  similarity_score: maxSimilarity,  // Ajouter le score de similarité moyen
                  search_time: response.data?.temps_recherche || null  // Ajouter le temps de recherche
              });
          } catch (error) {
              console.error("Erreur lors de l'ajout à l'historique:", error);
          }
      }
      return response.data;
  } catch (error) {
      console.error('Error searching for similar tickets:', error);
      return {
          status: 'error',
          message: 'Une erreur est survenue lors de la recherche de tickets similaires.'
      };
  }
}
// Interface pour la réponse d'importation de tickets
interface TicketImportResponse {
  status: 'success' | 'error';
  message: string;
  processed_tickets?: number;
  fixed_tickets?: number;
  skipped_tickets?: number;
  timestamp?: string;
}
/**
 * Télécharge un fichier Excel vers l'API pour traitement et importation dans MongoDB
 */
export async function telecharger(file: File, signal?: AbortSignal): Promise<TicketImportResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_BASE_URL}/telecharger-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      signal, // Ajouter le signal pour permettre l'annulation
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) /
          (progressEvent.total || 100));
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    return response.data;
  } catch (error: any) {
    // Rethrow AbortError pour gérer l'annulation en amont
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      throw error;
    }
    
    console.error('Error uploading file:', error);
    return {
      status: 'error',
      message: 'Une erreur est survenue lors du téléchargement du fichier.'
    };
  }
}
/**
 * Upload an Excel file to be processed by the backend
 */
let globalRequestController: AbortController | null = null;
// src/api/fastApiService.ts - fonction uploadExcelFile modifiée

export async function uploadExcelFile(file: File, abortSignal?: AbortSignal): Promise<TicketSearchResponse> {
  try {
    // Utiliser le AbortSignal fourni
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(`${API_BASE_URL}/upload-file`, formData, {
      headers,
      signal: abortSignal, // Utiliser le signal d'annulation
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    if (token && response.data.status === 'success') {
      try {
        await axios.post(
          `${API_BASE_URL}/messages/record`, 
          {
            message_text: file.name,
            ticket_ids: response.data.tickets?.map(t => t.ticket_id) || []
          }, 
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
      } catch (error) {
        console.error("Erreur lors de l'enregistrement du message:", error);
      }
    }
    
    return response.data;
  } catch (error: any) {
    // Vérifier si l'erreur est due à une annulation
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      console.log("Requête annulée par l'utilisateur");
      return {
        status: 'success', // Changer 'error' en 'success'
        message: 'La requête a été annulée avec succès' // Message plus clair indiquant que l'annulation est faite
      };
    }
    
    console.error('Error uploading file:', error);
    return {
      status: 'error',
      message: 'Une erreur est survenue lors du téléchargement du fichier.'
    };
  }
}

/**
 * Get statistics about the tickets in MongoDB
 */
export async function getTicketStats() {
  try {
    const response = await axios.get(`${API_BASE_URL}/ticket-stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ticket statistics:', error);
    return {
      status: 'error',
      message: 'Une erreur est survenue lors de la récupération des statistiques.'
    };
  }
}

/**
 * Créer un nouvel utilisateur (admin uniquement)
 * @param username Nom d'utilisateur
 * @param email Adresse email de l'utilisateur
 * @returns Réponse de l'API avec les informations de l'utilisateur créé
 */
export async function createUser(username: string, email: string): Promise<UserCreationResponse> {
  try {
    // Vérifier si le token d'authentification est présent (pour les admins)
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non autorisé. Veuillez vous connecter en tant qu\'administrateur.'
      };
    }

    const response = await axios.post(`${API_BASE_URL}/users/create`,
      {
        username,
        email
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
   
    console.log('User creation response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
   
    // Récupérer le message d'erreur détaillé si disponible
    const errorMessage = error.response?.data?.detail ||
                        'Une erreur est survenue lors de la création de l\'utilisateur.';
   
    return {
      status: 'error',
      message: errorMessage
    };
  }
}



// Modifiez la fonction addSearchToHistory dans fastApiService.ts comme suit:
export async function addSearchToHistory(ticketText: string, data: {
  result: string,
  ticketIds: string[],
  similarity_score?: number | null,
  search_time?: number | null
}): Promise<any> {
  try {
      const token = localStorage.getItem('token');
      if (!token) {
          console.error('Token non trouvé, impossible d\'ajouter à l\'historique');
          return {
              status: 'error',
              message: 'Non authentifié'
          };
      }
      
      const response = await axios.post(`${API_BASE_URL}/search-history/add`, {
          ticket_text: ticketText,
          result: data.result,
          ticketIds: data.ticketIds,
          similarity_score: data.similarity_score || null,
          search_time: data.search_time || null
      }, {
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });
      
      return response.data;
  } catch (error: any) {
      console.error('Error adding search to history:', error);
      return {
          status: 'error',
          message: `Erreur lors de l'ajout à l'historique: ${error.message}`
      };
  }
}

export async function getSearchHistory(): Promise<SearchHistoryResponse> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token non trouvé, impossible de récupérer l\'historique');
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }
   
    console.log('Tentative de récupération de l\'historique avec token:', token.substring(0, 10) + '...');
   
    const response = await axios.get(`${API_BASE_URL}/search-history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
   
    console.log('Réponse d\'historique reçue:', response.status, response.data);
   
    if (response.data && Array.isArray(response.data.history)) {
      return {
        status: 'success',
        history: response.data.history
      };
    } else if (response.data && response.data.status === 'success') {
      return response.data;
    } else {
      console.warn('Format de réponse incorrect pour l\'historique:', response.data);
      return {
        status: 'success',
        history: [],
        message: 'Aucun historique trouvé'
      };
    }
  } catch (error: any) {
    console.error('Error fetching search history:', error);
    // Améliorer la gestion des erreurs pour avoir plus de détails
    let errorMessage = 'Erreur inconnue';
   
    if (error.response) {
      // La requête a été faite et le serveur a répondu avec un code d'état
      errorMessage = `Erreur ${error.response.status}: ${error.response.data?.detail || error.response.data?.message || 'Erreur serveur'}`;
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion.';
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      errorMessage = error.message;
    }
   
    return {
      status: 'error',
      message: `Erreur lors de la récupération de l'historique: ${errorMessage}`
    };
  }
}



/**
 * Cache un élément de l'historique
 */
export async function hideHistoryItem(itemId: string): Promise<any> {
  try {

    const response = await axios.post(`${API_BASE_URL}/search-history/hide`, {
      item_id: itemId
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error hiding history item:', error);
    return {
      status: 'error',
      message: 'Une erreur est survenue lors du masquage de l\'élément.'
    };
  }
}

/**
 * Efface tout l'historique
 */
export async function clearSearchHistory(): Promise<any> {
  try {
    const response = await axios.post(`${API_BASE_URL}/search-history/clear`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error clearing history:', error);
    return {
      status: 'error',
      message: 'Une erreur est survenue lors de l\'effacement de l\'historique.'
    };
  }
}

// Interface pour la réponse d'importation de tickets
interface FileUploadResponse {
  status: 'success' | 'error';
  message: string;
  processed_tickets?: number;
  fixed_tickets?: number;
  skipped_tickets?: number;
  timestamp?: string;
}


/**
 * Supprimer un utilisateur
 * @param userId ID de l'utilisateur à supprimer
 * @returns Réponse de l'API indiquant le succès ou l'échec de l'opération
 */
export async function deleteUser(userId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/users/delete/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    const errorMessage = error.response?.data?.detail || 'Une erreur est survenue lors de la suppression de l\'utilisateur.';
    return {
      status: 'error',
      message: errorMessage
    };
  }
}
// Ajouter cette interface pour l'extraction des données du ticket
interface ExcelDataExtractionResponse {
  status: 'success' | 'error';
  message: string;
  ticket_data?: Record<string, any>;
}

/**
 * Extrait les données d'un fichier Excel pour prévisualisation
 */
export async function extractTicketDataFromExcel(file: File): Promise<ExcelDataExtractionResponse> {
  try {
    return new Promise<ExcelDataExtractionResponse>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject({
              status: 'error',
              message: 'Impossible de lire le fichier'
            });
            return;
          }
         
          // Utiliser XLSX pour lire le fichier
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
         
          // Convertir les données en JSON
          const rows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
         
          if (rows.length > 0) {
            // Extraire la première ligne comme données du ticket
            const ticketData = rows[0];
           
            // Liste des colonnes les plus utiles à afficher (par ordre de priorité)
            const priorityColumns = [
              "key","summary", "priority", "status",  
              "reporter", "assignee", "type" ,"created_date",
              "solution",  "root_cause", "client_project"
            ];
           
            // Nettoyer et formater les données
            const cleanedData: Record<string, any> = {};
           
            // D'abord ajouter les colonnes prioritaires si elles existent
            priorityColumns.forEach(column => {
              if (ticketData[column] !== undefined &&
                  ticketData[column] !== null &&
                  ticketData[column] !== '') {
                cleanedData[column] = String(ticketData[column]);
              }
            });
           
            // Ensuite ajouter toutes les autres colonnes (pour être exhaustif)
            Object.entries(ticketData).forEach(([key, value]) => {
              if (!priorityColumns.includes(key) &&
                  value !== null &&
                  value !== undefined &&
                  value !== '' &&
                  // Ne pas inclure les valeurs trop longues
                  (typeof value === 'string' ? value.length < 500 : true)) {
                cleanedData[key] = String(value);
              }
            });
           
            resolve({
              status: 'success',
              message: 'Données extraites avec succès',
              ticket_data: cleanedData
            });
          } else {
            resolve({
              status: 'error',
              message: 'Aucune donnée trouvée dans le fichier'
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'extraction des données Excel:', error);
          reject({
            status: 'error',
            message: `Erreur lors de l'extraction: ${error}`
          });
        }
      };
     
      reader.onerror = (error) => {
        reject({
          status: 'error',
          message: `Erreur de lecture du fichier: ${error}`
        });
      };
     
      reader.readAsBinaryString(file);
    });
  } catch (error) {
    console.error('Error extracting ticket data:', error);
    return {
      status: 'error',
      message: 'Une erreur est survenue lors de l\'extraction des données du ticket.'
    };
  }
}



/**
 * Récupérer la liste des utilisateurs (admin uniquement)
 * @returns Liste de tous les utilisateurs
 */
export async function getUsers() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non autorisé. Veuillez vous connecter en tant qu\'administrateur.'
      };
    }

    const response = await axios.get(`${API_BASE_URL}/users/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    const errorMessage = error.response?.data?.detail || 
      'Une erreur est survenue lors de la récupération des utilisateurs.';
    return {
      status: 'error',
      message: errorMessage
    };
  }
}


/**
 * Renvoyer l'email d'invitation à un utilisateur
 * @param userId ID de l'utilisateur
 * @param email Email de l'utilisateur
 * @returns Réponse de l'API indiquant le succès ou l'échec de l'opération
 */
export async function resendInvitation(userId: string, email: string) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non autorisé. Veuillez vous connecter en tant qu\'administrateur.'
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/users/resend-invitation`,
      { userId, email },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors du renvoi de l\'email d\'invitation:', error);
    const errorMessage = error.response?.data?.detail || 
      'Une erreur est survenue lors du renvoi de l\'email d\'invitation.';
    return {
      status: 'error',
      message: errorMessage
    };
  }
}

// Cette fonction existe déjà dans votre code, je la laisse pour référence
export async function getSearchHistoryDetails(historyItemId: string): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token non trouvé, impossible de récupérer les détails');
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }
    const response = await axios.get(`${API_BASE_URL}/search-history/details/${historyItemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching history details:', error);
    let errorMessage = 'Erreur inconnue';
    if (error.response) {
      errorMessage = `Erreur ${error.response.status}: ${error.response.data?.detail || 
      error.response.data?.message || 'Erreur serveur'}`;
    } else if (error.request) {
      errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion.';
    } else {
      errorMessage = error.message;
    }
    return {
      status: 'error',
      message: `Erreur lors de la récupération des détails: ${errorMessage}`
    };
  }
}
// Dans fastApiService.ts, ajoutez cette fonction:
export async function getTicketsByIds(ticketIds: string[]): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token non trouvé, impossible de récupérer les tickets');
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }
    
    const response = await axios.post(`${API_BASE_URL}/tickets/details`, 
      { ticket_ids: ticketIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching tickets by IDs:', error);
    let errorMessage = 'Erreur inconnue';
    if (error.response) {
      errorMessage = `Erreur ${error.response.status}: ${error.response.data?.detail || error.response.data?.message || 'Erreur serveur'}`;
    } else if (error.request) {
      errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion.';
    } else {
      errorMessage = error.message;
    }
    
    return {
      status: 'error',
      message: `Erreur lors de la récupération des tickets: ${errorMessage}`
    };
  }
}
// Dans fastApiService.ts, ajoutez cette fonction:
export async function getTicketDetails(historyItemId: string): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token non trouvé, impossible de récupérer les détails du ticket');
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }
    
    // Appel pour récupérer les détails de l'historique (incluant les ticketIds)
    const historyDetails = await getSearchHistoryDetails(historyItemId);
    
    if (historyDetails.status !== 'success' || !historyDetails.history_item?.ticketIds) {
      return {
        status: 'error',
        message: 'Pas de tickets associés à cet élément d\'historique'
      };
    }
    
    // Récupérer les tickets avec leur ID
    return await getTicketsByIds(historyDetails.history_item.ticketIds);
  } catch (error: any) {
    console.error('Error fetching ticket details:', error);
    let errorMessage = 'Erreur inconnue';
    if (error.response) {
      errorMessage = `Erreur ${error.response.status}: ${error.response.data?.detail || 
        error.response.data?.message || 'Erreur serveur'}`;
    } else if (error.request) {
      errorMessage = 'Aucune réponse du serveur. Vérifiez votre connexion.';
    } else {
      errorMessage = error.message;
    }
    return {
      status: 'error',
      message: `Erreur lors de la récupération des détails du ticket: ${errorMessage}`
    };
  }
}