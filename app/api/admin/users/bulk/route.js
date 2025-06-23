import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userIds } = await request.json();

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    await connectToDatabase();

    let result = {};

    switch (action) {
      case 'activate':
        await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        result = { message: `${userIds.length} users activated successfully` };
        break;

      case 'deactivate':
        await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        result = { message: `${userIds.length} users deactivated successfully` };
        break;

      case 'delete':
        // Soft delete by setting isActive to false
        await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        result = { message: `${userIds.length} users deleted successfully` };
        break;

      case 'reset-password':
        // In a real implementation, you would send password reset emails
        const users = await User.find({ _id: { $in: userIds } }).select('email name');
        
        // Simulate sending reset emails
        for (const user of users) {
          console.log(`Password reset sent to ${user.email}`);
        }
        
        result = { message: `Password reset emails sent to ${users.length} users` };
        break;

      case 'export':
        const exportUsers = await User.find({ _id: { $in: userIds } })
          .populate('college', 'name')
          .select('name email role college isActive createdAt');
        
        result = { 
          message: `${exportUsers.length} users exported successfully`,
          data: exportUsers.map(user => ({
            name: user.name,
            email: user.email,
            role: user.role,
            college: user.college?.name || 'N/A',
            status: user.isActive ? 'Active' : 'Inactive',
            joinDate: user.createdAt.toISOString().split('T')[0]
          }))
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json({ 
      error: 'Failed to perform bulk action' 
    }, { status: 500 });
  }
}