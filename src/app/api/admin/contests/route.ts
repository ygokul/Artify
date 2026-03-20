import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Contest from '@/lib/models/Contest';

export async function GET() {
  try {
    await connectToDatabase();
    const contests = await Contest.find({}).sort({ createdAt: -1 });
    return NextResponse.json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    
    const { title, description, endsIn, status } = body;

    if (!title || !description || !endsIn) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newContest = await Contest.create({
      title,
      description,
      endsIn,
      status: status || 'Ongoing'
    });

    return NextResponse.json(newContest, { status: 201 });
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
  }
}
