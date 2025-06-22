import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../utils/database';
import College from '../../../models/College';

export async function GET() {
  try {
    await connectToDatabase();
    
    const colleges = await College.find({ isActive: true })
      .select('name description location')
      .sort({ name: 1 });

    return NextResponse.json({ 
      colleges: colleges || []
    });

  } catch (error) {
    console.error('Error fetching colleges:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch colleges',
      colleges: []
    }, { status: 500 });
  }
}