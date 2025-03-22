// Importer le plugin HTTP de Tauri
import { fetch } from '@tauri-apps/plugin-http';
import { getEnvironmentInfo, isTauriAvailable } from './tauri-api';
import {
  API_BASE_URL as CONFIG_API_BASE_URL,
  TAURI_API_URL as CONFIG_TAURI_API_URL,
  API_ENDPOINTS,
  AUTH_CONFIG,
  ERROR_MESSAGES,
  TIMEOUT_CONFIG
} from '../config/api';

// Exposer ces constantes pour être utilisées ailleurs dans l'application
export const API_BASE_URL = CONFIG_API_BASE_URL;
export const TAURI_API_URL = CONFIG_TAURI_API_URL;

// Vérifier si nous sommes côté client
const isClient = typeof window !== 'undefined';

// Ajouter une déclaration pour les propriétés Tauri sur window
declare global {
  interface Window {
    __TAURI_METADATA__?: unknown;
  }
}

// Import dynamique du plugin HTTP de Tauri pour éviter les erreurs en mode web
let tauriFetchModule: any = null;
const getTauriFetch = async () => {
  // Si nous avons déjà récupéré le module, le retourner
  if (tauriFetchModule) {
    return tauriFetchModule.fetch;
  }
  
  try {
    // N'importer le module que si nous sommes dans Tauri
    if (isClient && checkIsTauri()) {
      console.log('[Tauri API] Importation dynamique du plugin HTTP...');
      tauriFetchModule = await import('@tauri-apps/plugin-http');
      return tauriFetchModule.fetch;
    }
    return null;
  } catch (error) {
    console.error('[API] Erreur lors de l\'import du client HTTP de Tauri:', error);
    return null;
  }
};

// Variable qui stockera le résultat de la vérification Tauri (initialement null)
let isTauriCached: boolean | null = null;

// Détection du mode Tauri (synchrone)
export function checkIsTauri() {
  // Si nous ne sommes pas côté client, retourner false
  if (!isClient) return false;
  
  // Si on a déjà vérifié, retourner le résultat mis en cache
  if (isTauriCached !== null) {
    return isTauriCached;
  }
  
  // Sinon, vérifier via la détection de base
  const result = isTauriAvailable();
  isTauriCached = result;
  return result;
}

// Export pour utilisation ailleurs (renverra false en SSR mais sera actualisé côté client)
export const isTauri = isClient ? checkIsTauri() : false;

// Détection de la plateforme (asynchrone)
export async function detectPlatform() {
  // Si nous ne sommes pas côté client, retourner une valeur par défaut
  if (!isClient) return 'server';
  
  try {
    // Obtenir les informations complètes sur l'environnement
    const envInfo = await getEnvironmentInfo();
    
    // Mise à jour du cache de détection Tauri
    isTauriCached = envInfo.isTauri;
    
    return envInfo.platform;
  } catch (error) {
    console.error('Erreur lors de la détection de la plateforme:', error);
    return 'unknown';
  }
}

// Classe personnalisée pour les erreurs API
export class ApiError extends Error {
  status: number;
  url?: string;
  details?: any;
  
  constructor(message: string, status: number, url?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.url = url;
    this.details = details;
  }
}

// Fonction générique pour effectuer des requêtes API
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Assurons-nous que l'URL est complète avec le protocole pour Tauri
  const isRunningInTauri = checkIsTauri();
  
  // Normaliser l'endpoint en s'assurant qu'il commence par '/'
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Construire l'URL en fonction de l'environnement
  let url = isRunningInTauri 
    ? `${CONFIG_TAURI_API_URL}${normalizedEndpoint}` 
    : `${CONFIG_API_BASE_URL}${normalizedEndpoint}`;
  
  console.log(`[API] fetchAPI calling: ${url} (Tauri: ${isRunningInTauri})`);
  
  if (isRunningInTauri) {
    try {
      // Vérifie d'abord si la fonction fetch de Tauri est disponible
      const tauriFetch = await getTauriFetch();
      if (!tauriFetch) {
        console.warn('[Tauri API] fetch function not available, falling back to browser fetch');
        return await standardFetch(url, options);
      }
      
      console.log(`[Tauri API] Using Tauri fetch for: ${url}`);
      
      // Configuration des options pour le fetch Tauri
      const fetchOptions = {
        method: options.method || 'GET',
        headers: options.headers as Record<string, string>,
        body: options.body,
        // Ajout d'options spécifiques à Tauri
        timeout: 15.0, // 15 secondes de timeout
        // Pour déboguer les problèmes CORS
        responseType: 'text' as const
      };
      
      // Utilise le plugin Tauri HTTP pour les requêtes
      const response = await tauriFetch(url, fetchOptions);
      
      console.log(`[Tauri API] Response status: ${response.status}`);
      
      // Créer une réponse compatible avec l'API fetch standard
      const fetchResponse = {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText || response.status.toString(),
        headers: response.headers,
        json: async () => {
          try {
            const text = await response.text();
            if (!text || text.trim() === '') {
              return {};
            }
            return JSON.parse(text);
          } catch (error) {
            console.error('[Tauri API] Error parsing JSON:', error);
            throw new ApiError('Failed to parse response as JSON', response.status, url);
          }
        },
        text: async () => response.text()
      };
      
      // Si la réponse n'est pas OK, générer une erreur
      if (!fetchResponse.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          console.error('[Tauri API] Could not read error response body:', e);
        }
        
        throw new ApiError(
          `Request failed with status ${response.status}`,
          response.status,
          url,
          errorText
        );
      }
      
      return fetchResponse;
    } catch (error) {
      console.error('[Tauri API] Fetch error:', error);
      
      // Si l'erreur est une erreur réseau
      if (!(error instanceof ApiError)) {
        // Créer une ApiError avec plus d'informations
        throw new ApiError(
          error instanceof Error ? error.message : 'Network error or CORS issue',
          0, // Code 0 pour erreur réseau
          url,
          error instanceof Error ? error.stack : undefined
        );
      }
      
      throw error;
    }
  } else {
    return await standardFetch(url, options);
  }
}

// Fonction pour utiliser l'API fetch standard du navigateur
async function standardFetch(url: string, options: RequestInit = {}) {
  try {
    console.log(`[Web API] Calling: ${url}`);
    const response = await window.fetch(url, options);
    console.log(`[Web API] Response status: ${response.status}`);
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        console.error('[Web API] Could not read error response body:', e);
      }
      
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
        url,
        errorText
      );
    }
    
    return response;
  } catch (error) {
    console.error('[Web API] Fetch error:', error);
    
    // Si c'est une erreur réseau
    if (!(error instanceof ApiError)) {
      const networkError = new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0, // Code 0 pour erreur réseau
        url,
        error instanceof Error ? error.stack : undefined
      );
      throw networkError;
    }
    
    throw error;
  }
}

// Fonction spécifique pour l'API de chat
export async function sendChatMessage(messages: any[]) {
  try {
    return await fetchAPI('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages })
    });
  } catch (error) {
    console.error('Error in sendChatMessage:', error);
    throw error;
  }
}

// Fonction pour tester la connexion API
export async function testApiConnection() {
  try {
    // On utilise simplement un appel à l'API chat avec un message minimal
    const testMessage = [{ role: 'user', content: 'Hello', id: 'test-connection' }];
    const response = await sendChatMessage(testMessage);
    
    if (response && response.ok) {
      console.log('[API] Connection test successful');
      return {
        success: true,
        message: 'Connection to API successful'
      };
    } else {
      throw new ApiError('Connection test failed', response?.status || 0);
    }
  } catch (error) {
    console.error('[API] Connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    };
  }
}

/**
 * Fonction simple pour tester la route ping sans authentification
 * Cette fonction est utile pour un test basique de connectivité
 */
export async function testPing() {
  try {
    // Déterminer quelle URL sera utilisée
    const isRunningInTauri = checkIsTauri();
    const baseUrl = isRunningInTauri ? CONFIG_TAURI_API_URL : CONFIG_API_BASE_URL;
    
    const pingUrl = `${baseUrl}${API_ENDPOINTS.PING}`;
    console.log(`[API] Testing ping endpoint: ${pingUrl} (Tauri: ${isRunningInTauri})`);
    
    const startTime = Date.now();
    
    // Utiliser fetchAPI qui gère déjà correctement Tauri et le web
    let response;
    
    if (isRunningInTauri) {
      // En mode Tauri, utiliser directement fetchAPI avec options explicites
      try {
        response = await fetchAPI(API_ENDPOINTS.PING, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.error('[API] Error with Tauri fetchAPI:', error);
        throw error;
      }
    } else {
      // En mode web, utiliser fetchAPI standard
      response = await fetchAPI(API_ENDPOINTS.PING);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`[API] Ping duration: ${duration}ms`);

    // Récupérer les données de la réponse
    let responseData;
    try {
      responseData = await response.json();
      console.log('[API] Ping successful with data:', responseData);
    } catch (e) {
      console.warn('[API] Could not parse response as JSON:', e);
      responseData = { message: 'Response received but not valid JSON' };
    }

    return {
      success: true,
      message: 'Ping to API successful',
      details: responseData
    };
  } catch (error) {
    console.error('[API] Ping failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      details: error instanceof ApiError ? error.details : undefined
    };
  }
}

/**
 * Fonction spécifique pour tester la configuration CORS
 * Cette fonction est utile pour diagnostiquer les problèmes CORS dans Tauri
 */
export async function testCORS() {
  try {
    // Déterminer quelle URL sera utilisée
    const isRunningInTauri = checkIsTauri();
    const baseUrl = isRunningInTauri ? CONFIG_TAURI_API_URL : CONFIG_API_BASE_URL;
    
    const pingUrl = `${baseUrl}${API_ENDPOINTS.PING}`;
    console.log(`[CORS Test] Testing CORS at: ${pingUrl} (Tauri: ${isRunningInTauri})`);
    
    if (isRunningInTauri) {
      try {
        // En mode Tauri, effectuer une requête OPTIONS explicite pour tester le CORS
        console.log('[CORS Test] Sending OPTIONS preflight request...');
        
        // Récupérer la fonction fetch de Tauri
        const tauriFetch = await getTauriFetch();
        
        if (!tauriFetch) {
          throw new Error('Tauri fetch function not available');
        }
        
        // Effectuer la requête OPTIONS
        const optionsResponse = await tauriFetch(pingUrl, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'tauri://localhost',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
          },
          // Options spécifiques à Tauri
          timeout: 10.0
        });
        
        console.log(`[CORS Test] OPTIONS status: ${optionsResponse.status}`);
        console.log('[CORS Test] CORS Headers:', optionsResponse.headers);
        
        if (optionsResponse.status === 204 || optionsResponse.status === 200) {
          console.log('[CORS Test] CORS preflight successful');
        } else {
          console.warn(`[CORS Test] CORS preflight failed with status ${optionsResponse.status}`);
        }
        
        // Maintenant effectuer la requête GET réelle
        console.log('[CORS Test] Sending actual GET request...');
        const response = await tauriFetch(pingUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'tauri://localhost'
          }
        });
        
        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { raw: responseText };
        }
        
        return {
          success: true,
          message: 'CORS test successful',
          details: {
            url: pingUrl,
            status: response.status,
            cors: {
              allowOrigin: response.headers['access-control-allow-origin'],
              allowMethods: response.headers['access-control-allow-methods'],
              allowHeaders: response.headers['access-control-allow-headers']
            },
            responseData
          }
        };
      } catch (error) {
        console.error('[CORS Test] Error:', error);
        throw new ApiError(
          'CORS test failed',
          error instanceof ApiError ? error.status : 0,
          pingUrl,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    } else {
      // En mode web, effectuer un test CORS standard via le navigateur
      try {
        const response = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        const responseData = await response.json();
        
        return {
          success: true,
          message: 'CORS test successful (browser mode)',
          details: {
            url: pingUrl,
            status: response.status,
            cors: {
              allowOrigin: response.headers.get('access-control-allow-origin'),
              allowMethods: response.headers.get('access-control-allow-methods'),
              allowHeaders: response.headers.get('access-control-allow-headers')
            },
            responseData
          }
        };
      } catch (error) {
        console.error('[CORS Test] Browser error:', error);
        throw new ApiError(
          'CORS test failed in browser',
          error instanceof ApiError ? error.status : 0,
          pingUrl,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }
  } catch (error) {
    console.error('[CORS Test] Test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      details: error instanceof ApiError ? error.details : undefined
    };
  }
}

// Ajoutez ici d'autres fonctions spécifiques pour vos futures API
// Par exemple:
// export async function loginUser(email: string, password: string) { ... }
// export async function fetchUserData(userId: string) { ... } 