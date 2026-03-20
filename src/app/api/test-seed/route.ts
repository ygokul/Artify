import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const email = "admin@artify.com";
    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            name: "Admin Artist",
            email: email,
            password: "password123", // Dummy
            role: "admin",
            createdAt: new Date()
        });
        return NextResponse.json({ message: "User created", user }, { status: 201 });
    }

    return NextResponse.json({ message: "User already exists", user }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
