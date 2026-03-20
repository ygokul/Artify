import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await connectToDatabase();
    
    // Test a simple query
    const userCount = await User.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'MongoDB connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectToDatabase();
    
    // Test creating a document
    const testUser = new User({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'test123',
    });
    
    const savedUser = await testUser.save();
    
    // Clean up - delete the test user
    await User.findByIdAndDelete(savedUser._id);
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB write/delete test successful',
      testUserId: savedUser._id.toString()
    });
  } catch (error) {
    console.error('MongoDB write test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'MongoDB write test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 