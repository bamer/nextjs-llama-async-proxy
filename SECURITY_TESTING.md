# Security Implementation Testing Guide

## Overview
This document provides testing procedures for the authentication and security measures implemented in the Next.js Llama Async Proxy application.

## Test Environment Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with:
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=24h
   ```

3. **Start the Application**
   ```bash
   pnpm dev
   ```

## Authentication Endpoints Testing

### 1. User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

Expected: 200 OK with user creation confirmation

### 2. User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

Expected: 200 OK with JWT token and user info

### 3. Get Current User Info
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: 200 OK with user details

## API Routes Protection Testing

### 1. Unauthenticated Access (Should Fail)
```bash
curl -X GET http://localhost:3000/api/models
```

Expected: 401 Unauthorized

### 2. Authenticated Access (Should Succeed)
```bash
curl -X GET http://localhost:3000/api/models \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: 200 OK with models data

### 3. Insufficient Permissions (Should Fail)
Login as a viewer user and try to create models:
```bash
curl -X POST http://localhost:3000/api/models/discover \
  -H "Authorization: Bearer VIEWER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/some/path"]}'
```

Expected: 403 Forbidden

## WebSocket Authentication Testing

### 1. Unauthenticated Connection (Should Fail)
```javascript
// In browser console or test script
const socket = io('http://localhost:3000', {
  path: '/api/websocket'
});
// Should receive connection error
```

### 2. Authenticated Connection (Should Succeed)
```javascript
const socket = io('http://localhost:3000', {
  path: '/api/websocket',
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
// Should connect successfully
```

### 3. WebSocket Event Permissions
```javascript
socket.emit('getMetrics'); // Should work for authenticated users
socket.emit('getLogs');    // Should work for users with MONITORING_READ permission
```

## Role-Based Access Control Testing

### Test Users Available:
- **admin**: admin123 (full access)
- **user**: user123 (limited access)
- **viewer**: viewer123 (read-only access)

### Permission Matrix:
- **MODELS_READ**: All roles
- **MODELS_CREATE**: Admin and User roles only
- **MONITORING_READ**: All roles
- **CONFIG_UPDATE**: Admin only

## Security Validation Checklist

- [ ] JWT tokens expire correctly
- [ ] Invalid tokens are rejected
- [ ] Passwords are hashed (not stored in plain text)
- [ ] WebSocket connections require authentication
- [ ] API routes enforce permission requirements
- [ ] Role hierarchy works correctly (Admin > User > Viewer)
- [ ] Unauthorized access attempts are logged
- [ ] Error messages don't leak sensitive information
- [ ] CORS and other security headers are properly configured

## Manual Testing Steps

1. **Login Flow**
   - Register a new user
   - Login with correct credentials
   - Verify JWT token is returned
   - Use token to access protected routes

2. **Permission Testing**
   - Login as different user roles
   - Attempt operations they should/shouldn't be able to perform
   - Verify appropriate HTTP status codes

3. **WebSocket Testing**
   - Try connecting without authentication
   - Connect with valid token
   - Test real-time data access with different permissions

4. **Token Expiration**
   - Use an expired token
   - Verify it's rejected and user must re-authenticate

## Automated Testing

Create Jest tests for:
- JWT token generation/validation
- Authentication middleware
- Permission checking functions
- API route protection
- WebSocket authentication

Example test structure:
```javascript
describe('Authentication', () => {
  test('should generate valid JWT token', () => { ... });
  test('should validate correct token', () => { ... });
  test('should reject invalid token', () => { ... });
  test('should enforce permissions', () => { ... });
});
```</content>
<parameter name="filePath">SECURITY_TESTING.md