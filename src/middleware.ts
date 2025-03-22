import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Ce middleware s'exécute avant toutes les requêtes API
 * Il ajoute des en-têtes CORS pour permettre l'accès depuis des applications Tauri
 */
export function middleware(request: NextRequest) {
  // Récupérer le chemin de la requête
  const path = request.nextUrl.pathname;
  
  // Appliquer les en-têtes CORS uniquement aux routes API
  if (path.startsWith('/api')) {
    // Récupérer la réponse originale
    const origin = request.headers.get('origin') || '*';
    
    // Créer une nouvelle réponse avec les en-têtes CORS
    const response = NextResponse.next();
    
    // Définir les en-têtes CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Si c'est une requête OPTIONS (preflight), on renvoie une réponse 200
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

// Configurer le middleware pour s'exécuter uniquement sur les routes API
export const config = {
  matcher: '/api/:path*'
}; 