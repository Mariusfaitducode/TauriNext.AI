import { NextRequest, NextResponse } from 'next/server';

/**
 * Route de test simple - GET /api/test
 * Cette route ne nécessite pas d'authentification et renvoie simplement un statut 200
 * avec des informations de base pour vérifier que l'API fonctionne.
 */
export async function GET(req: NextRequest) {
  // Récupérer les informations de la requête
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers);
  
  // Préparer les données de réponse
  const responseData = {
    status: 'success',
    message: 'API de test accessible',
    timestamp: new Date().toISOString(),
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: {
      // Afficher les en-têtes utiles sans tout exposer
      host: headers['host'],
      origin: headers['origin'],
      referer: headers['referer'],
      'user-agent': headers['user-agent'],
      'content-type': headers['content-type'],
      'accept': headers['accept']
    },
    env: process.env.NODE_ENV || 'development'
  };

  // Configuration des en-têtes CORS
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Origin', '*'); // Ou spécifiez les domaines autorisés
  responseHeaders.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  responseHeaders.set('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Répondre avec les données au format JSON
  return NextResponse.json(responseData, {
    status: 200,
    headers: responseHeaders
  });
}

/**
 * Gérer les requêtes OPTIONS pour le CORS
 */
export async function OPTIONS(req: NextRequest) {
  // Configuration des en-têtes CORS
  const responseHeaders = new Headers();
  responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  responseHeaders.set('Access-Control-Allow-Origin', '*'); // Ou spécifiez les domaines autorisés
  responseHeaders.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  responseHeaders.set('Access-Control-Allow-Headers', 
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Répondre avec succès sans corps
  return new Response(null, {
    status: 204, // No Content
    headers: responseHeaders
  });
}