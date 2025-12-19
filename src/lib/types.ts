/**
 * Status of a model lifecycle.
 */
export type ModelStatus = 'idle' | 'starting' | 'started' | 'error';

/**
 * Information stored for each running model process.
 */
export interface ModelProcessInfo {
  pid: number;
  launchedAt: number;
  model: string;
}

/**
 * Extended state stored per-model.
 */
export interface ModelState {
  status: ModelStatus;
  pid?: number;
  launchedAt?: number;
  error?: string;
  [key: string]: any;
}

/**
 * Whole state map – keyed by model name.
 */
export type ExtendedState = Record<string, ModelState>;

/**
 * User roles for role-based access control.
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

/**
 * Permissions for different operations.
 */
export enum Permission {
  // Model management
  MODELS_READ = 'models:read',
  MODELS_CREATE = 'models:create',
  MODELS_UPDATE = 'models:update',
  MODELS_DELETE = 'models:delete',

  // Monitoring
  MONITORING_READ = 'monitoring:read',
  MONITORING_UPDATE = 'monitoring:update',

  // Configuration
  CONFIG_READ = 'config:read',
  CONFIG_UPDATE = 'config:update',

  // WebSocket
  WEBSOCKET_CONNECT = 'websocket:connect',
  WEBSOCKET_ADMIN = 'websocket:admin',

  // Analytics
  ANALYTICS_READ = 'analytics:read',

  // Notifications
  NOTIFICATIONS_READ = 'notifications:read',
  NOTIFICATIONS_SEND = 'notifications:send',

  // User management (admin only)
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete'
}

/**
 * User interface for authentication system.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

/**
 * JWT token payload interface.
 */
export interface AuthToken {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

/**
 * Login request interface.
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Register request interface.
 */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Authentication response interface.
 */
export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  expiresIn: number;
}