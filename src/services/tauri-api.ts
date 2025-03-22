/**
 * Utilitaires pour l'interaction avec l'API Tauri
 * Ce fichier sert de wrapper pour les appels à l'API Tauri
 */

// Importer directement depuis @tauri-apps/api pour une détection fiable
import { isTauri as tauriApiCheck } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';

// Déclaration de types pour Tauri v2
declare global {
  interface Window {
    // Objet interne Tauri v2 (disponible dans les applications Tauri v2)
    __TAURI_INTERNALS__?: {
      plugins: Record<string, any>;
      metadata: {
        currentWindow: { label: string };
        currentWebview: { label: string };
        platform?: string;
        tauri_version?: string;
      };
    };
    // Objet Tauri standard (généralement non disponible dans Tauri v2)
    __TAURI__?: {
      invoke: (cmd: string, args?: any) => Promise<any>;
      [key: string]: any;
    };
  }
}

/**
 * Vérifie si l'application s'exécute dans un environnement Tauri v2
 * En se basant sur l'objet __TAURI_INTERNALS__ qui est disponible dans Tauri v2
 */
export function isTauriV2Available(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    // Vérifier si les internals de Tauri v2 sont disponibles
    if (window.__TAURI_INTERNALS__) {
      return true;
    }
    
    return false;
  } catch (e) {
    console.error('Erreur lors de la vérification de Tauri v2:', e);
    return false;
  }
}

/**
 * Vérifie si l'application s'exécute dans un environnement Tauri
 * Méthode combinée utilisant plusieurs approches
 */
export function isTauriAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Vérifier d'abord Tauri v2 (méthode la plus fiable pour Tauri v2)
  if (isTauriV2Available()) {
    return true;
  }
  
  try {
    // Essayer avec l'API officielle
    return tauriApiCheck();
  } catch (error) {
    return false;
  }
}

/**
 * Obtenir des informations sur la version de l'application
 * Cette méthode fonctionne avec l'API officielle
 */
export async function getAppVersion(): Promise<string | undefined> {
  if (!isTauriAvailable()) {
    return undefined;
  }
  
  try {
    return await getVersion();
  } catch (error) {
    console.error('Erreur lors de la récupération de la version:', error);
    return undefined;
  }
}

/**
 * Récupère la plateforme actuelle
 * Dans Tauri v2, nous ne pouvons pas utiliser la commande Rust directement
 */
export async function getPlatform(): Promise<string> {
  if (!isTauriAvailable()) {
    return 'browser';
  }
  
  // Pour Tauri v2, nous utilisons une valeur constante car les commandes Rust
  // ne semblent pas fonctionner correctement
  return 'tauri';
}

/**
 * Informations complètes sur l'environnement d'exécution
 */
export async function getEnvironmentInfo(): Promise<{
  isTauri: boolean;
  platform: string;
  version?: string;
}> {
  // Vérification synchrone initiale
  const isTauri = isTauriAvailable();
  
  // Valeurs par défaut
  let platform = 'browser';
  let version = undefined;
  
  if (isTauri) {
    try {
      // Obtenir la version de l'app si possible
      version = await getAppVersion();
      
      // Obtenir la plateforme
      platform = await getPlatform();
      
      // Essayer d'obtenir plus d'information depuis __TAURI_INTERNALS__
      if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
        const metadata = window.__TAURI_INTERNALS__.metadata || {};
        const windowInfo = metadata.currentWindow || {};
        
        // Ajouter des informations supplémentaires à la plateforme
        platform = `${platform} (window: ${windowInfo.label || 'unknown'})`;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations:', error);
    }
  }
  
  return {
    isTauri,
    platform,
    version
  };
} 