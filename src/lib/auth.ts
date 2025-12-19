// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, AuthToken, UserRole, Permission } from './types';
import logger from './logger';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: Omit<AuthToken, 'iat' | 'exp'> = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;
    return decoded;
  } catch (error) {
    logger.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Check if user has required permission
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.VIEWER]: 1,
    [UserRole.USER]: 2,
    [UserRole.ADMIN]: 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get default permissions for a role
 */
export function getDefaultPermissions(role: UserRole): Permission[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        Permission.MODELS_READ,
        Permission.MODELS_CREATE,
        Permission.MODELS_UPDATE,
        Permission.MODELS_DELETE,
        Permission.MONITORING_READ,
        Permission.MONITORING_UPDATE,
        Permission.CONFIG_READ,
        Permission.CONFIG_UPDATE,
        Permission.WEBSOCKET_CONNECT,
        Permission.WEBSOCKET_ADMIN,
        Permission.ANALYTICS_READ,
        Permission.NOTIFICATIONS_READ,
        Permission.NOTIFICATIONS_SEND,
        Permission.USERS_READ,
        Permission.USERS_CREATE,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE
      ];
    case UserRole.USER:
      return [
        Permission.MODELS_READ,
        Permission.MODELS_CREATE,
        Permission.MODELS_UPDATE,
        Permission.MONITORING_READ,
        Permission.CONFIG_READ,
        Permission.WEBSOCKET_CONNECT,
        Permission.ANALYTICS_READ,
        Permission.NOTIFICATIONS_READ
      ];
    case UserRole.VIEWER:
      return [
        Permission.MODELS_READ,
        Permission.MONITORING_READ,
        Permission.WEBSOCKET_CONNECT,
        Permission.ANALYTICS_READ,
        Permission.NOTIFICATIONS_READ
      ];
    default:
      return [];
  }
}

/**
 * Create a mock user for development/testing
 * In production, this should be replaced with proper user management
 */
export function createMockUser(username: string, role: UserRole = UserRole.USER): User {
  return {
    id: `user_${Date.now()}`,
    username,
    email: `${username}@example.com`,
    role,
    permissions: getDefaultPermissions(role),
    createdAt: new Date(),
    lastLoginAt: new Date(),
    isActive: true
  };
}

/**
 * Mock user database - in production, replace with real database
 */
const mockUsers: Record<string, { user: User; passwordHash: string }> = {};

/**
 * Initialize mock users for development
 */
export function initializeMockUsers(): void {
  const adminUser = createMockUser('admin', UserRole.ADMIN);
  const userUser = createMockUser('user', UserRole.USER);
  const viewerUser = createMockUser('viewer', UserRole.VIEWER);

  // Hash passwords for mock users
  Promise.all([
    hashPassword('admin123'),
    hashPassword('user123'),
    hashPassword('viewer123')
  ]).then(([adminHash, userHash, viewerHash]) => {
    mockUsers[adminUser.username] = { user: adminUser, passwordHash: adminHash };
    mockUsers[userUser.username] = { user: userUser, passwordHash: userHash };
    mockUsers[viewerUser.username] = { user: viewerUser, passwordHash: viewerHash };
    logger.info('Mock users initialized');
  });
}

/**
 * Authenticate user with username and password
 */
export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const userEntry = mockUsers[username];
  if (!userEntry) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, userEntry.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  // Update last login
  userEntry.user.lastLoginAt = new Date();

  return userEntry.user;
}

// Middleware types
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Middleware function to authenticate requests
 */
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        );
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Find user by ID (in production, this would query the database)
      const user = Object.values(mockUsers).find(u => u.user.id === decoded.userId)?.user;
      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Attach user to request
      (req as AuthenticatedRequest).user = user;

      return handler(req as AuthenticatedRequest);
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware function to check permissions
 */
export function withPermission(
  permission: Permission,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;
    if (!hasPermission(user.permissions, permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return handler(req);
  });
}

/**
 * Middleware function to check role
 */
export function withRole(
  role: UserRole,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;
    if (!hasRole(user.role, role)) {
      return NextResponse.json(
        { error: 'Insufficient role' },
        { status: 403 }
      );
    }
    return handler(req);
  });
}

/**
 * Combined middleware for auth + permission
 */
export function withAuthAndPermission(
  permission: Permission,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse> | NextResponse
) {
  return withAuth(async (req: AuthenticatedRequest) => {
    const user = req.user!;
    if (!hasPermission(user.permissions, permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return handler(req);
  });
}