import { NextRequest, NextResponse } from 'next/server';
import { addUser, type User } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password length validation
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create new user data (without ID since MongoDB will generate it)
    const newUserData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In production, this should be hashed
      createdAt: new Date().toISOString(),
    };

    // Add user to database
    const success = await addUser(newUserData);

    if (success) {
      // Return user data without password
      const { password: _, ...userWithoutPassword } = newUserData;
      return NextResponse.json(
        { 
          message: 'User registered successfully',
          user: userWithoutPassword
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 