import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase, getAllCategories, createCategory } from '../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const categories = await getAllCategories();

    return NextResponse.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch categories' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    await connectToDatabase();

    const categoryData = {
      name,
      description: description || '',
      color: color || '#3B82F6',
      createdBy: session.user.id
    };

    const categoryId = await createCategory(categoryData);

    return NextResponse.json({ 
      success: true, 
      categoryId,
      message: 'Category created successfully' 
    });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ 
      error: 'Failed to create category' 
    }, { status: 500 });
  }
}