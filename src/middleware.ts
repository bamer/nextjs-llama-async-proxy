// src/middleware.ts

import { NextResponse, NextRequest } from 'next/server';
import logger from './lib/logger';
import { verifyToken, extractTokenFromHeader } from './lib/auth';

// Middleware pour logger les requêtes et gérer les erreurs
export function middleware(request: NextRequest) {
  // Logger la requête entrante
  logger.info(`Requête entrante : ${request.method} ${request.nextUrl.pathname}`);

  // Check if this is an API route that requires authentication
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Skip auth for auth endpoints themselves
    if (request.nextUrl.pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // For WebSocket connections, we'll handle auth in the WebSocket handler
    if (request.nextUrl.pathname === '/api/websocket') {
      return NextResponse.next();
    }

    // For other API routes, check for valid JWT token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn(`Unauthorized API access attempt: ${request.method} ${request.nextUrl.pathname}`);
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      logger.warn(`Invalid token for API access: ${request.method} ${request.nextUrl.pathname}`);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Token is valid, proceed
    logger.info(`Authenticated API request: ${decoded.username} - ${request.method} ${request.nextUrl.pathname}`);
  }

  return NextResponse.next();
}

// Configurer les chemins pour lesquels le middleware doit être appliqué
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'], // Appliquer à toutes les routes sauf celles spécifiées
}