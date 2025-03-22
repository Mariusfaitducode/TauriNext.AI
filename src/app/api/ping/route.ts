import { NextRequest, NextResponse } from 'next/server';

/**
 * Route ping simple - GET /api/ping
 * Cette route renvoie des informations de base et des détails pour le débogage
 */
export async function GET(request: NextRequest) {
  // Détails complets pour aider au débogage CORS
  const url = request.url;
  const headers = Object.fromEntries(request.headers);
  const origin = request.headers.get('origin') || 'no-origin';
  
  // Configuration des en-têtes CORS pour tous les domaines
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Max-Age', '86400'); // 24 heures en secondes
  
  // Ajouter d'autres en-têtes utiles
  responseHeaders.set('Cache-Control', 'no-store');
  responseHeaders.set('X-Content-Type-Options', 'nosniff');
  
  // Construire la réponse avec des informations détaillées
  return NextResponse.json({ 
    message: 'pong',
    timestamp: new Date().toISOString(),
    debug: {
      url,
      origin,
      method: request.method,
      requestHeaders: headers,
      // Ajouter d'autres informations utiles pour le débogage
      responseHeaders: Object.fromEntries(responseHeaders.entries())
    }
  }, {
    status: 200,
    headers: responseHeaders
  });
}

/**
 * Gestion de la requête OPTIONS pour le CORS
 */
export function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 heures en secondes
  
  return new Response(null, {
    status: 204, // No Content
    headers: headers
  });
} 