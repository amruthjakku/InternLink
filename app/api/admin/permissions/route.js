import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Define system permissions
    const permissions = [
      {
        id: 1,
        name: 'View Dashboard',
        description: 'Access to main dashboard',
        roles: ['AI Developer Intern', 'Tech Lead', 'admin', 'super-admin'],
        category: 'general'
      },
      {
        id: 2,
        name: 'Manage Tasks',
        description: 'Create, edit, and assign tasks',
        roles: ['Tech Lead', 'admin', 'super-admin'],
        category: 'tasks'
      },
      {
        id: 3,
        name: 'View Reports',
        description: 'Access to analytics and reports',
        roles: ['Tech Lead', 'admin', 'super-admin'],
        category: 'analytics'
      },
      {
        id: 4,
        name: 'Manage Users',
        description: 'Add, edit, and delete users',
        roles: ['admin', 'super-admin'],
        category: 'user_management'
      },
      {
        id: 5,
        name: 'System Settings',
        description: 'Modify system configuration',
        roles: ['admin', 'super-admin'],
        category: 'system'
      },
      {
        id: 6,
        name: 'Bulk Operations',
        description: 'Perform bulk user operations',
        roles: ['admin', 'super-admin'],
        category: 'user_management'
      },
      {
        id: 7,
        name: 'Attendance Management',
        description: 'View and manage attendance records',
        roles: ['Tech Lead', 'admin', 'super-admin'],
        category: 'attendance'
      },
      {
        id: 8,
        name: 'College Management',
        description: 'Create and manage colleges',
        roles: ['admin', 'super-admin'],
        category: 'colleges'
      },
      {
        id: 9,
        name: 'GitLab Integration',
        description: 'Access GitLab integration features',
        roles: ['AI Developer Intern', 'Tech Lead', 'admin', 'super-admin'],
        category: 'integrations'
      },
      {
        id: 10,
        name: 'Chat and Communication',
        description: 'Access chat and messaging features',
        roles: ['AI Developer Intern', 'Tech Lead', 'admin', 'super-admin'],
        category: 'communication'
      },
      {
        id: 11,
        name: 'Super Admin Controls',
        description: 'Access to all system controls and overrides',
        roles: ['super-admin'],
        category: 'super_admin'
      }
    ];

    return NextResponse.json({ permissions });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch permissions' 
    }, { status: 500 });
  }
}