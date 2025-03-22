/**
 * Configuration centralisée pour l'API
 */

// URL de base de l'API en fonction de l'environnement
export const API_BASE_URL = 
  process.env.NODE_ENV === 'development' 
    ? '/api' // En développement, pour le mode web, utilisez des chemins relatifs
    : 'https://tauri-next-ai-o6lk-p9j9upxgm-mariusfaitducodes-projects.vercel.app/api'; // URL de production

// URL complète pour Tauri (toujours utiliser l'URL absolue)
export const TAURI_API_URL = 'https://tauri-next-ai-o6lk-p9j9upxgm-mariusfaitducodes-projects.vercel.app/api';

// URL d'API publique pour tester la connectivité sans authentification
export const PUBLIC_TEST_API_URL = 'https://jsonplaceholder.typicode.com';

/**
 * Configuration de l'authentification
 */
export const AUTH_CONFIG = {
  // Token pour accéder à l'API
  API_TOKEN: 'votre-token-ici',
  
  // En-têtes par défaut pour toutes les requêtes API
  getDefaultHeaders: () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_CONFIG.API_TOKEN}`
  }),
  
  // Déterminer si une erreur est due à un problème d'authentification
  isAuthError: (status: number) => {
    return status === 401 || status === 403;
  },
  
  // Message d'erreur personnalisé pour les problèmes d'authentification
  getAuthErrorMessage: (url: string, status: number) => {
    if (status === 401) {
      return `Authentification requise: L'API à l'URL ${url} nécessite une authentification valide (401 Unauthorized)`;
    } else if (status === 403) {
      return `Accès refusé: Vous n'avez pas les droits suffisants pour accéder à l'API à l'URL ${url} (403 Forbidden)`;
    }
    return `Erreur d'authentification (${status})`;
  }
};

/**
 * Configuration des endpoints API
 */
export const API_ENDPOINTS = {
  CHAT: '/chat',
  USER: '/user',
  HEALTH: '/health',
  PUBLIC_TEST: '/posts/1',  // Endpoint de test public
  NO_AUTH_TEST: '/no-auth-test', // Endpoint local sans authentification
  SIMPLE_TEST: '/test',      // Endpoint simple GET sans authentification
  PING: '/ping'             // Endpoint ping/pong ultra-basique sans authentification
};

/**
 * Configuration des timeouts
 */
export const TIMEOUT_CONFIG = {
  DEFAULT: 10000, // 10 secondes par défaut
  CHAT: 30000     // 30 secondes pour les appels de chat
};

/**
 * Messages d'erreur personnalisés
 */
export const ERROR_MESSAGES = {
  NETWORK: (url: string) => `Erreur réseau: Impossible de se connecter à ${url}. Vérifiez votre connexion internet et l'URL de l'API.`,
  NOT_FOUND: (url: string) => `L'API n'est pas accessible à l'URL ${url} (404 Not Found)`,
  SERVER_ERROR: (url: string, status: number) => `Erreur serveur lors de l'accès à ${url} (${status})`,
  TIMEOUT: (url: string) => `Délai d'attente dépassé lors de l'accès à ${url}`
}; 