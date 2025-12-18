// src/middleware.ts

import { NextResponse, NextRequest } from 'next/server';
import logger from './lib/logger';

// Middleware pour logger les requêtes et gérer les erreurs
export function middleware(request: NextRequest) {
  // Logger la requête entrante
  logger.info(`Requête entrante : ${request.method} ${request.nextUrl.pathname}`);
  
  return NextResponse.next();
}

// Configurer les chemins pour lesquels le middleware doit être appliqué
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // Appliquer à toutes les routes sauf celles spécifiées
}