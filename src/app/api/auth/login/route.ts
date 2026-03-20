import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(email.trim().toLowerCase(), password);

    if (user) {
      // Return user data without password
      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json(
        { 
          message: 'Authentication successful',
          user: userWithoutPassword,
          role: user.role
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 