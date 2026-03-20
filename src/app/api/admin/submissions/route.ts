import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Submission from '@/lib/models/Submission';
import Contest from '@/lib/models/Contest'; // Import to ensure model is registered
import User from '@/lib/models/User'; // Import to ensure model is registered

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch all submissions and populate contest details if possible
    // Note: Mongoose population depends on Schema setup. 
    // Since we defined contestId ref 'Contest', populate should work if model is compiled.
    const submissions = await Submission.find({})
        .populate('contestId', 'title')
        .sort({ createdAt: -1 });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
