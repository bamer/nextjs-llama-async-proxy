// src/middleware.ts

import { NextResponse, NextRequest } from 'next/server';
import logger from './lib/logger';

/**
 * Middleware pour logger les requêtes dans un système PUBLIC sans authentification
 * 
 * 🚨 Ce middleware ne fait que du logging - AUCUNE sécurité ou authentification
 * Tous les endpoints sont intentionnellement publics et accessibles
 */
export function middleware(request: NextRequest) {
  // Logger la requête entrante (aucun contrôle d'accès)
  logger.info(`[PUBLIC_ACCESS] ${request.method} ${request.nextUrl.pathname}`);

  // Ajouter un header pour indiquer l'accès public
  const response = NextResponse.next();
  response.headers.set('X-Public-Access', 'true');
  response.headers.set('X-Authentication', 'forbidden');
  
  return response;
}

// Configurer les chemins pour lesquels le middleware doit être appliqué
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // Appliquer à toutes les routes sauf celles spécifiées
}