import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-mentor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'users':
        csvContent = 'gitlabUsername,name,email,role,college,cohort\n';
        csvContent += 'john.doe,John Doe,john@example.com,intern,MIT,Cohort-2024-A\n';
        csvContent += 'jane.smith,Jane Smith,jane@example.com,mentor,Stanford,\n';
        filename = 'users_template.csv';
        break;

      case 'tasks':
        csvContent = 'title,description,category,dueDate,type,priority,cohort,estimatedHours\n';
        csvContent += 'Sample Task,This is a sample task description,Programming,2024-12-31,assignment,medium,Cohort-2024-A,8\n';
        csvContent += 'Another Task,Another task description,Research,2024-12-25,project,high,,16\n';
        filename = 'tasks_template.csv';
        break;

      case 'attendance':
        csvContent = 'gitlabUsername,date,status,checkInTime,checkOutTime\n';
        csvContent += 'john.doe,2024-01-15,present,09:00,17:00\n';
        csvContent += 'jane.smith,2024-01-15,late,09:30,17:00\n';
        filename = 'attendance_template.csv';
        break;

      default:
        return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json({ 
      error: 'Failed to generate template' 
    }, { status: 500 });
  }
}