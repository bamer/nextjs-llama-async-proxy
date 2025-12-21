import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      users: [
        { id: '1', name: 'Admin', role: 'admin', status: 'online' },
        { id: '2', name: 'User', role: 'user', status: 'online' },
      ],
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
