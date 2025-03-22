import { NextApiRequest, NextApiResponse } from 'next';

// Middleware pour ajouter les en-têtes CORS
export default function allowCors(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Configurer les en-têtes CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Ou spécifiez les domaines autorisés
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Gérer les requêtes OPTIONS (pre-flight)
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Passer au gestionnaire de la route
    return await handler(req, res);
  };
} 