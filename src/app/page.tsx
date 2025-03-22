"use client";

import { useEffect, useState } from "react";
import ChatContainer from "@/components/ChatContainer";
import ConnectionTest from "@/components/ConnectionTest";
import Image from "next/image";
import Link from "next/link";
import { isTauri, checkIsTauri, detectPlatform } from "@/services/api";
import { getEnvironmentInfo } from "@/services/tauri-api";

export default function Home() {
  const [envInfo, setEnvInfo] = useState<{
    isTauri: boolean;
    platform: string;
    staticCheck: boolean;
    version?: string;
    checking: boolean;
    checkCount: number;
    windowAvailable: boolean;
  }>({
    isTauri: false,
    platform: 'checking...',
    staticCheck: false,
    version: undefined,
    checking: true,
    checkCount: 0,
    windowAvailable: false
  });

  // Fonction pour vérifier l'environnement
  const checkEnvironment = async () => {
    try {
      setEnvInfo(prev => ({ ...prev, checking: true }));
      
      // Vérification côté client uniquement
      const staticCheck = checkIsTauri();
      
      // Vérification complète (asynchrone)
      const info = await getEnvironmentInfo();
      
      setEnvInfo(prev => ({
        isTauri: info.isTauri,
        platform: info.platform,
        staticCheck,
        version: info.version,
        checking: false,
        checkCount: prev.checkCount + 1,
        windowAvailable: typeof window !== 'undefined'
      }));
      
      console.log('Environment info:', {
        isTauri: info.isTauri,
        platform: info.platform,
        staticCheck,
        version: info.version
      });
    } catch (error) {
      console.error('Error checking environment:', error);
      setEnvInfo(prev => ({ 
        ...prev, 
        checking: false,
        platform: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  };

  // Vérifier l'environnement au chargement - côté client uniquement
  useEffect(() => {
    // Marquer window comme disponible immédiatement
    setEnvInfo(prev => ({
      ...prev,
      windowAvailable: true
    }));
    
    // Puis lancer les vérifications
    checkEnvironment();
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center w-full max-w-3xl">
        <h1 className="text-3xl font-bold">AI Chat</h1>
        
        {/* Informations d'environnement */}
        <div className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <h2 className="font-semibold mb-2">Informations d'environnement</h2>
          <ul className="space-y-1">
            <li>
              <span className="font-medium">Mode Tauri (détection rapide):</span>{' '}
              <span className={envInfo.staticCheck ? 'text-green-600' : 'text-red-600'}>
                {envInfo.staticCheck ? 'Oui' : 'Non'}
              </span>
            </li>
            <li>
              <span className="font-medium">Mode Tauri (vérification complète):</span>{' '}
              <span className={envInfo.isTauri ? 'text-green-600' : 'text-red-600'}>
                {envInfo.isTauri ? 'Oui' : 'Non'}
              </span>
            </li>
            <li>
              <span className="font-medium">Plateforme:</span>{' '}
              {envInfo.platform}
            </li>
            {envInfo.version && (
              <li>
                <span className="font-medium">Version:</span>{' '}
                {envInfo.version}
              </li>
            )}
            <li>
              <span className="font-medium">Nombre de vérifications:</span>{' '}
              {envInfo.checkCount}
            </li>
            <li>
              <span className="font-medium">Window global:</span>{' '}
              {envInfo.windowAvailable ? 'Disponible' : 'Non disponible'}
            </li>
          </ul>
          
          <div className="mt-3">
            <button
              onClick={checkEnvironment}
              disabled={envInfo.checking}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {envInfo.checking ? 'Vérification...' : 'Forcer une nouvelle vérification'}
            </button>
            
            <button
              onClick={() => {
                console.clear();
                checkEnvironment();
              }}
              className="ml-2 px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700"
            >
              Nettoyer la console et vérifier
            </button>
          </div>
          
          <div className="mt-2">
            <button
              onClick={() => {
                console.log('=== INSPECTION DÉTAILLÉE WINDOW ===');
                try {
                  // Inspecter l'objet window et ses propriétés
                  console.log('window existe:', typeof window !== 'undefined');
                  
                  if (typeof window !== 'undefined') {
                    // Vérifier l'objet standard Tauri
                    // @ts-ignore
                    console.log('window.__TAURI__ existe:', typeof window.__TAURI__ !== 'undefined');
                    
                    // @ts-ignore
                    if (typeof window.__TAURI__ !== 'undefined') {
                      // @ts-ignore
                      console.log('Propriétés de window.__TAURI__:', Object.keys(window.__TAURI__));
                      // @ts-ignore
                      console.log('invoke existe:', typeof window.__TAURI__.invoke === 'function');
                      // @ts-ignore
                      console.log('Contenu de __TAURI__:', window.__TAURI__);
                    }
                    
                    // Vérifier aussi les internals de Tauri v2
                    // @ts-ignore
                    console.log('window.__TAURI_INTERNALS__ existe:', typeof window.__TAURI_INTERNALS__ !== 'undefined');
                    
                    // @ts-ignore
                    if (typeof window.__TAURI_INTERNALS__ !== 'undefined') {
                      // @ts-ignore
                      console.log('Propriétés de __TAURI_INTERNALS__:', Object.keys(window.__TAURI_INTERNALS__));
                      // @ts-ignore
                      console.log('Metadata:', window.__TAURI_INTERNALS__.metadata);
                      // @ts-ignore
                      console.log('Plugins:', Object.keys(window.__TAURI_INTERNALS__.plugins || {}));
                    }
                  }
                  
                  // Essayer d'appeler directement l'API Tauri pour voir ce qui se passe
                  import('@tauri-apps/api/core').then(module => {
                    console.log('Import dynamique de core réussi');
                    try {
                      const isTauriResult = module.isTauri();
                      console.log('isTauri() résultat:', isTauriResult);
                    } catch (e) {
                      console.error('Erreur lors de l\'appel à isTauri():', e);
                    }
                  }).catch(e => {
                    console.error('Erreur lors de l\'import de core:', e);
                  });
                  
                  // Afficher le résultat de notre fonction de détection
                  import('../services/tauri-api').then(api => {
                    console.log('Résultat de isTauriV2Available():', api.isTauriV2Available());
                    console.log('Résultat de isTauriAvailable():', api.isTauriAvailable());
                  }).catch(e => {
                    console.error('Erreur lors de l\'import de tauri-api:', e);
                  });
                  
                } catch (e) {
                  console.error('Erreur lors de l\'inspection:', e);
                }
              }}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
            >
              Inspecter window.__TAURI__
            </button>
          </div>
        </div>

        {/* Toujours afficher le test de connexion pour le débogage */}
        <ConnectionTest />

        <ChatContainer />
        
        <Link
          className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
          href="/image"
        >
          Generate Images with AI
        </Link>
          
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

      <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
            href="/about"
          >
            Go to About
          </Link>
        
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}