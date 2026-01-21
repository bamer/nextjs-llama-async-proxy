// tests/api/auth/auth.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { login, logout } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  getToken: jest.fn(),
}));

describe('Authentication API', () => {
  const makeRequest = (body: Record<string, any>): NextRequest => {
    const url = new URL('/api/auth/login');
    return new NextRequest('POST', url.toString(), body);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a token on valid credentials (positive)', async () => {
    // ---------- Arrange ----------
    const req = makeRequest({ username: 'alice', password: 'wonderland' });
    (require('@/lib/auth').getToken as jest.Mock).mockResolvedValue('jwt.abc123');

    // ---------- Act ----------
    const response = await login(req as any);

    // ---------- Assert ----------
    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('token=jwt.abc123; HttpOnly');
    expect(response.body).toEqual({ token: 'jwt.abc123' });
  });

  it('should reject invalid credentials (negative)', async () => {
    // ---------- Arrange ----------
    const req = makeRequest({ username: 'bob', password: 'incorrect' });
    (require('@/lib/auth').getToken as jest.Mock).mockResolvedValue(null);

    // ---------- Act ----------
    const response = await login(req as any);

    // ---------- Assert ----------
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid credentials' });
  });

  it('should logout and clear cookie (negative edge case)', async () => {
    // ---------- Arrange ----------
    const req = new NextRequest('POST', '/api/auth/logout');

    (require('@/lib/auth').logout as jest.Mock).mockResolvedValue(true);

    // ---------- Act ----------
    const response = await logout(req as any);

    // ---------- Assert ----------
    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('token=');
  });
});