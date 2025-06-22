import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // In a real implementation, you would fetch AI config from database
    // For now, return default config
    const config = {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: 'You are a helpful AI assistant for internship management.',
      custom_instructions: 'Focus on providing educational guidance and technical support.',
      enabled_features: ['code_review', 'task_suggestions', 'progress_analysis'],
      usage_stats: {
        total_queries: 0,
        successful_responses: 0,
        average_response_time: 0,
        most_common_topics: []
      }
    };

    return NextResponse.json({ config });

  } catch (error) {
    console.error('Error fetching AI config:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch AI config' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configData = await request.json();

    await connectToDatabase();

    // In a real implementation, you would save AI config to database
    // For now, just return success
    
    return NextResponse.json({ 
      success: true,
      message: 'AI config updated successfully' 
    });

  } catch (error) {
    console.error('Error updating AI config:', error);
    return NextResponse.json({ 
      error: 'Failed to update AI config' 
    }, { status: 500 });
  }
}