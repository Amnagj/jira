import axios from 'axios';

// Base URL for the FastAPI backend
export const API_BASE_URL = 'http://localhost:8000';

// Interface pour les statistiques des tickets
export interface TicketsStats {
  total_tickets: number;
  top_keywords: Array<{ _id: string; count: number }>;
  tickets_by_date: Array<{ _id: string; count: number }>;
}

// Interface pour les statistiques des recherches
export interface SearchesStats {
  total_searches: number;
  searches_by_date: Array<{ _id: string; count: number }>;
  avg_response_time: number | null;
  top_users: Array<{ _id: string; username: string; count: number }>;
  success_searches: number;
  error_searches: number;
}

// Interface pour les statistiques système
export interface SystemStats {
  cpu_percent: number;
  memory_usage: {
    total: number;
    available: number;
    percent: number;
    used: number;
    free: number;
  };
  disk_usage: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  uptime_hours: number;
}

// Interface pour les statistiques des utilisateurs
export interface UsersStats {
  total_users: number;
  admin_users: number;
  regular_users: number;
  users_by_month: Array<{ _id: string; count: number }>;
}

// Type pour les réponses génériques
interface ApiResponse<T> {
  status: 'success' | 'error';
  stats?: T;
  message?: string;
}

// Fonction pour récupérer les statistiques des tickets
export async function getTicketsStats(): Promise<ApiResponse<TicketsStats>> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }

    const response = await axios.get(`${API_BASE_URL}/admin/stats/tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques des tickets:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'Erreur inconnue'
    };
  }
}
export interface SearchesStats {
  total_searches: number;
  searches_by_date: Array<{ _id: string; count: number }>;
  avg_response_time: number | null;
  top_users: Array<{ _id: string; username: string; count: number }>;
  success_searches: number;
  error_searches: number;
  avg_similarity: number | null;
  similarity_distribution: Array<{ _id: number | string; count: number }>;
  project_volume: Array<{ _id: string; count: number }>;
  automation_rate: number;
  projects: string[];
}
// Fonction pour récupérer les statistiques des recherches
export async function getSearchesStats(project?: string): Promise<ApiResponse<SearchesStats>> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }
    
    // Ajouter le paramètre de projet si spécifié
    const url = project 
      ? `${API_BASE_URL}/admin/stats/searches?project=${encodeURIComponent(project)}`
      : `${API_BASE_URL}/admin/stats/searches`;
      
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques des recherches:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'Erreur inconnue'
    };
  }
}
// Fonction pour récupérer les statistiques système
export async function getSystemStats(): Promise<ApiResponse<SystemStats>> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }

    const response = await axios.get(`${API_BASE_URL}/admin/stats/system`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques système:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'Erreur inconnue'
    };
  }
}

// Fonction pour récupérer les statistiques des utilisateurs
export async function getUsersStats(): Promise<ApiResponse<UsersStats>> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        status: 'error',
        message: 'Non authentifié'
      };
    }

    const response = await axios.get(`${API_BASE_URL}/admin/stats/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques des utilisateurs:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || error.message || 'Erreur inconnue'
    };
  }
}

// Fonction pour récupérer toutes les statistiques en une seule fois
export async function getAllStats(): Promise<{
  tickets: ApiResponse<TicketsStats>;
  searches: ApiResponse<SearchesStats>;
  system: ApiResponse<SystemStats>;
  users: ApiResponse<UsersStats>;
}> {
  const [ticketsStats, searchesStats, systemStats, usersStats] = await Promise.all([
    getTicketsStats(),
    getSearchesStats(),
    getSystemStats(),
    getUsersStats()
  ]);

  return {
    tickets: ticketsStats,
    searches: searchesStats,
    system: systemStats,
    users: usersStats
  };
}
