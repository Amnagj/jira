// C:\Users\gouja\Desktop\interface+historiique recherche - Copie\ticket-ai-wizard-02\src\api\axiosSetup.ts
import axios from 'axios';
import { API_BASE_URL, TOKEN_REFRESH_INTERVAL } from './constants';

// Créer une instance axios avec l'URL de base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL
});

export async function refreshToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data && response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return false;
  }
}

// Intercepteur pour ajouter le token d'authentification à chaque requête
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse (notamment les 401)
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Vérifie si l'erreur est due à un problème d'authentification (401) et que nous n'avons pas déjà essayé de rafraîchir
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Essayer de rafraîchir le token
      const refreshed = await refreshToken();
      
      if (refreshed) {
        // Si le token a été rafraîchi avec succès, réessayer la requête originale
        const token = localStorage.getItem('token');
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axios(originalRequest);
      } else {
        // Si le rafraîchissement a échoué, déconnecter l'utilisateur
        console.log('Token expiré ou invalide, déconnexion...');
        
        // Créer un événement personnalisé pour notifier l'application
        const tokenExpiredEvent = new CustomEvent('tokenExpired');
        window.dispatchEvent(tokenExpiredEvent);
        
        // Supprimer les informations d'authentification du localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
