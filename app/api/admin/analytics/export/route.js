import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import Task from '../../../../../models/Task';
import College from '../../../../../models/College';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'summary';

    await connectToDatabase();

    let data = {};

    if (type === 'users' || type === 'all') {
      const users = await User.find({})
        .populate('college', 'name')
        .select('name email role college isActive createdAt lastLoginAt');
      data.users = users;
    }

    if (type === 'tasks' || type === 'all') {
      const tasks = await Task.find({})
        .populate('assignedTo', 'name email role')
        .populate('createdBy', 'name email role')
        .select('title description status priority category assignedTo createdBy createdByRole dueDate createdAt updatedAt progress');
      data.tasks = tasks;
    }

    if (type === 'colleges' || type === 'all') {
      const colleges = await College.find({})
        .select('name description location website');
      data.colleges = colleges;
    }

    if (type === 'summary' || type === 'all') {
      // Get summary statistics
      const users = await User.find({}).populate('college', 'name');
      const tasks = await Task.find({});
      const colleges = await College.find({});

      data.summary = {
        totalUsers: users.length,
        usersByRole: {
          admin: users.filter(u => u.role === 'admin').length,
          'POC': users.filter(u => u.role === 'POC').length,
          mentor: users.filter(u => u.role === 'Tech Lead').length,
          intern: users.filter(u => u.role === 'AI Developer Intern').length
        },
        totalTasks: tasks.length,
        tasksByStatus: {
          completed: tasks.filter(t => ['completed', 'done'].includes(t.status)).length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          notStarted: tasks.filter(t => t.status === 'not_started').length,
          overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && !['completed', 'done'].includes(t.status)).length
        },
        totalColleges: colleges.length,
        exportedAt: new Date().toISOString()
      };
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data, type);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${type}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON by default
    return NextResponse.json({
      data,
      exportedAt: new Date().toISOString(),
      type,
      format
    });

  } catch (error) {
    console.error('Error exporting analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to export analytics data' 
    }, { status: 500 });
  }
}

function convertToCSV(data, type) {
  let csv = '';

  if (type === 'users' && data.users) {
    csv += 'Name,Email,Role,College,Status,Created At,Last Login\n';
    data.users.forEach(user => {
      csv += `"${user.name}","${user.email}","${user.role}","${user.college?.name || 'N/A'}","${user.isActive ? 'Active' : 'Inactive'}","${user.createdAt}","${user.lastLoginAt || 'Never'}"\n`;
    });
  } else if (type === 'tasks' && data.tasks) {
    csv += 'Title,Status,Priority,Category,Assigned To,Created By,Created By Role,Due Date,Progress,Created At\n';
    data.tasks.forEach(task => {
      csv += `"${task.title}","${task.status}","${task.priority}","${task.category}","${task.assignedTo?.name || 'N/A'}","${task.createdBy?.name || 'N/A'}","${task.createdByRole}","${task.dueDate}","${task.progress}%","${task.createdAt}"\n`;
    });
  } else if (type === 'colleges' && data.colleges) {
    csv += 'Name,Description,Location,Website\n';
    data.colleges.forEach(college => {
      csv += `"${college.name}","${college.description || ''}","${college.location || ''}","${college.website || ''}"\n`;
    });
  } else if (type === 'summary' && data.summary) {
    csv += 'Metric,Value\n';
    csv += `"Total Users","${data.summary.totalUsers}"\n`;
    csv += `"Admin Users","${data.summary.usersByRole.admin}"\n`;
    csv += `"Super-Tech Lead Users","${data.summary.usersByRole['POC']}"\n`;
    csv += `"Tech Lead Users","${data.summary.usersByRole.mentor}"\n`;
    csv += `"AI Developer Intern Users","${data.summary.usersByRole.intern}"\n`;
    csv += `"Total Tasks","${data.summary.totalTasks}"\n`;
    csv += `"Completed Tasks","${data.summary.tasksByStatus.completed}"\n`;
    csv += `"In Progress Tasks","${data.summary.tasksByStatus.inProgress}"\n`;
    csv += `"Not Started Tasks","${data.summary.tasksByStatus.notStarted}"\n`;
    csv += `"Overdue Tasks","${data.summary.tasksByStatus.overdue}"\n`;
    csv += `"Total Colleges","${data.summary.totalColleges}"\n`;
    csv += `"Exported At","${data.summary.exportedAt}"\n`;
  }

  return csv;
}