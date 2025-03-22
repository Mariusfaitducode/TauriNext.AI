"use client";

import { useState, useEffect } from 'react';
import { testApiConnection, checkIsTauri, ApiError, API_BASE_URL, testPing, testCORS } from '../services/api';
import { getEnvironmentInfo } from '../services/tauri-api';

// Type pour les détails d'erreur
interface ErrorDetails {
  message: string;
  status?: number;
  url?: string;
  details?: string | any;
  stack?: string;
}

// Définir le type de retour de testPing
interface PingResult {
  success: boolean;
  message: string;
  details?: any;
  error?: unknown;
}

export default function ConnectionTest() {
  // États initiaux uniformes pour le rendu côté serveur
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<'initial' | 'loading' | 'success' | 'error'>('initial');
  const [message, setMessage] = useState('Chargement...');
  const [details, setDetails] = useState('');
  const [environment, setEnvironment] = useState<'web' | 'tauri' | 'unknown'>('unknown');
  const [platform, setPlatform] = useState<string>('');
  const [version, setVersion] = useState<string | undefined>(undefined);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  // Détecter l'environnement uniquement côté client
  useEffect(() => {
    // Marquer que nous sommes côté client
    setIsClient(true);
    setMessage('Cliquez pour tester la connexion');
    
    const detectEnvironment = async () => {
      try {
        // Vérification simple et rapide
        const isTauriEnv = checkIsTauri();
        setEnvironment(isTauriEnv ? 'tauri' : 'web');
        
        // Vérification complète (asynchrone)
        const envInfo = await getEnvironmentInfo();
        setPlatform(envInfo.platform);
        setVersion(envInfo.version);
        
        setDetails(`Environnement: ${isTauriEnv ? 'Tauri' : 'Web'}, Plateforme: ${envInfo.platform}`);
      } catch (error) {
        console.error('Erreur lors de la détection de l\'environnement:', error);
        setEnvironment('unknown');
        setDetails('Impossible de détecter l\'environnement correctement');
      }
    };
    
    detectEnvironment();
  }, []);

  const runTest = async () => {
    // Ne rien faire si nous ne sommes pas côté client
    if (!isClient) return;
    
    // Réinitialiser les détails d'erreur
    setErrorDetails(null);
    setStatus('loading');
    setMessage('Test en cours...');
    setDetails('');
    
    try {
      // Vérifier à nouveau l'environnement
      const isTauriEnv = checkIsTauri();
      setEnvironment(isTauriEnv ? 'tauri' : 'web');
      
      // Récupérer les informations complètes
      const envInfo = await getEnvironmentInfo();
      setPlatform(envInfo.platform);
      setVersion(envInfo.version);
      
      // Afficher l'URL de l'API qui sera utilisée
      setDetails(`Test de connexion vers ${API_BASE_URL}... (${envInfo.platform})`);
      
      // Exécuter le test avec un délai de timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout - La requête a pris trop de temps')), 10000)
      );
      
      const testPromise = testApiConnection();
      const result = await Promise.race([testPromise, timeoutPromise]) as any;
      
      if (result.success) {
        setStatus('success');
        setMessage('Connexion réussie!');
        setDetails(`Le backend est accessible et répond correctement. Environnement: ${isTauriEnv ? 'Tauri' : 'Web'}, Plateforme: ${result.platform || envInfo.platform}`);
      } else {
        setStatus('error');
        setMessage('Échec de connexion');
        
        // Capturer les détails d'erreur
        if (result.error) {
          setErrorDetails({
            message: result.message,
            status: result.error instanceof ApiError ? result.error.status : undefined,
            url: result.error instanceof ApiError ? result.error.url : undefined,
            details: result.error instanceof ApiError ? result.error.details : 
                     result.error instanceof Error ? result.error.message : undefined,
            stack: result.error instanceof Error ? result.error.stack : undefined
          });
        }
        
        setDetails(`Erreur: ${result.message}. Environnement: ${isTauriEnv ? 'Tauri' : 'Web'}, Plateforme: ${result.platform || envInfo.platform}`);
      }
    } catch (error) {
      console.error('Erreur pendant le test de connexion:', error);
      setStatus('error');
      setMessage('Erreur inattendue');
      
      // Capturer les détails de l'erreur
      setErrorDetails({
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        status: error instanceof ApiError ? error.status : undefined,
        url: error instanceof ApiError ? error.url : undefined,
        details: error instanceof ApiError ? error.details : 
                 error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        setDetails(`${error.name}: ${error.message}`);
      } else {
        setDetails('Erreur inconnue lors du test de connexion');
      }
    }
  };

  // Fonction pour tester notre route ping ultra-simple
  const testPingEndpoint = async () => {
    if (!isClient) return;
    setErrorDetails(null);
    setStatus('loading');
    setMessage('Test ping en cours...');
    setDetails('');

    try {
      const result: PingResult = await testPing();
      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message);
      
      if (result.success) {
        if (result.details) {
          const prettyDetails = typeof result.details === 'object' 
            ? JSON.stringify(result.details, null, 2)
            : result.details;
          setDetails(`Réponse: ${prettyDetails}`);
        } else {
          setDetails('Ping réussi, mais aucun détail disponible.');
        }
      } else if (result.error) {
        // Typeguard pour ApiError
        const apiError = result.error instanceof ApiError ? result.error : undefined;
        
        setErrorDetails({
          message: result.message,
          status: apiError?.status,
          url: apiError?.url,
          details: apiError?.details || 
                  (result.error instanceof Error ? result.error.message : undefined),
          stack: result.error instanceof Error ? result.error.stack : undefined
        });
        
        setDetails('Échec du ping. Vérifiez les détails d\'erreur ci-dessous.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors du test ping');
      console.error('Error testing ping endpoint:', error);
      
      // Typeguard pour ApiError
      const apiError = error instanceof ApiError ? error : undefined;
      
      setErrorDetails({
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        status: apiError?.status,
        url: apiError?.url,
        details: apiError?.details,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  // Fonction pour tester la configuration CORS
  const testCORSConfig = async () => {
    if (!isClient) return;
    setErrorDetails(null);
    setStatus('loading');
    setMessage('Test CORS en cours...');
    setDetails('');

    try {
      const result = await testCORS();
      setStatus(result.success ? 'success' : 'error');
      setMessage(result.message);
      
      if (result.success) {
        if (result.details) {
          const prettyDetails = typeof result.details === 'object' 
            ? JSON.stringify(result.details, null, 2)
            : result.details;
          setDetails(`Configuration CORS: ${prettyDetails}`);
        } else {
          setDetails('Test CORS réussi, mais aucun détail disponible.');
        }
      } else if (result.error) {
        // Typeguard pour ApiError
        const apiError = result.error instanceof ApiError ? result.error : undefined;
        
        setErrorDetails({
          message: result.message,
          status: apiError?.status,
          url: apiError?.url,
          details: apiError?.details || 
                  (result.error instanceof Error ? result.error.message : undefined),
          stack: result.error instanceof Error ? result.error.stack : undefined
        });
        
        setDetails('Échec du test CORS. Vérifiez les détails d\'erreur ci-dessous.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors du test CORS');
      console.error('Error testing CORS configuration:', error);
      
      // Typeguard pour ApiError
      const apiError = error instanceof ApiError ? error : undefined;
      
      setErrorDetails({
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        status: apiError?.status,
        url: apiError?.url,
        details: apiError?.details,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  };

  return (
    <div className="connection-test">
      <h2 className="text-xl font-semibold mb-3">Test de connexion à l'API</h2>
      
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-1">Environnement détecté: {environment === 'tauri' ? 'Application Desktop (Tauri)' : environment === 'web' ? 'Navigateur Web' : 'Inconnu'}</p>
        {platform && <p className="mb-1">Plateforme: {platform}</p>}
        {version && <p className="mb-1">Version: {version}</p>}
        <p className="mb-1">URL API: {API_BASE_URL}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={runTest}
          disabled={status === 'loading' || !isClient}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Test en cours...' : 'Tester la connexion'}
        </button>
        
        <button
          onClick={testPingEndpoint}
          disabled={status === 'loading' || !isClient}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Ping Simple
        </button>
        
        <button
          onClick={testCORSConfig}
          disabled={status === 'loading' || !isClient}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Tester CORS
        </button>
      </div>

      <div className="my-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium mb-2">État de la connexion au backend</h3>
        
        <div className="flex items-center mb-2">
          <div 
            className={`w-3 h-3 rounded-full mr-2 ${
              status === 'initial' ? 'bg-gray-400' :
              status === 'loading' ? 'bg-yellow-400' :
              status === 'success' ? 'bg-green-500' :
              'bg-red-500'
            }`}
          />
          <span className="font-medium">{message}</span>
        </div>
        
        {details && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
            {details}
          </p>
        )}
        
        {/* Afficher les détails de l'erreur si disponibles */}
        {errorDetails && (
          <div className="mt-2 mb-3 p-3 bg-red-50 dark:bg-red-900/20 text-xs rounded border border-red-200 dark:border-red-800">
            <h4 className="font-medium mb-1">Détails de l'erreur:</h4>
            <ul className="space-y-1 text-red-700 dark:text-red-400">
              <li>Message: {errorDetails.message}</li>
              {errorDetails.status !== undefined && <li>Code d'état: {errorDetails.status}</li>}
              {errorDetails.url && <li>URL: {errorDetails.url}</li>}
              {errorDetails.details && (
                <li>
                  <details>
                    <summary>Réponse du serveur</summary>
                    <pre className="mt-1 p-1 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-24">
                      {typeof errorDetails.details === 'object' 
                        ? JSON.stringify(errorDetails.details, null, 2)
                        : errorDetails.details}
                    </pre>
                  </details>
                </li>
              )}
              {errorDetails.stack && (
                <li>
                  <details>
                    <summary>Stack trace</summary>
                    <pre className="mt-1 p-1 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-32">
                      {errorDetails.stack}
                    </pre>
                  </details>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 