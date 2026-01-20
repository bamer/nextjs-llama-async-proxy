// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMockUser, initializeMockUsers } from '@/lib/auth';
import { RegisterRequest, UserRole } from '@/lib/types';

// Initialize mock users on first request
let initialized = false;

export async function POST(request: NextRequest) {
  try {
    if (!initialized) {
      initializeMockUsers();
      initialized = true;
    }

    const body: RegisterRequest = await request.json();

    // Validate request
    if (!body.username || !body.email || !body.password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // In a real implementation, check if user already exists in database
    // For now, we'll just create a new user with USER role
    const newUser = createMockUser(body.username, UserRole.USER);
    newUser.email = body.email;

    // Store user (in production, save to database)
    // For demo purposes, we'll just return success
    console.log(`New user registered: ${newUser.username} (${newUser.email})`);

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}