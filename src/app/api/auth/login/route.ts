// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken, initializeMockUsers } from '@/lib/auth';
import { LoginRequest, AuthResponse } from '@/lib/types';

// Initialize mock users on first request
let initialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      initializeMockUsers();
      initialized = true;
    }

    const body: LoginRequest = await request.json();

    // Validate request
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(body.username, body.password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user);

    const response: AuthResponse = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isActive: user.isActive
      },
      token,
      expiresIn: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}