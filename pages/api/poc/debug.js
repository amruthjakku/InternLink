import { connectToDatabase } from '../../../utils/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'POC') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    
    // Get POC user info
    const pocUser = await db.collection('users').findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    });

    // Get all users to see the data structure
    const allUsers = await db.collection('users').find({}).limit(20).toArray();

    // Get unique college values
    const collegeValues = await db.collection('users').distinct('college');

    // Get unique role values
    const roleValues = await db.collection('users').distinct('role');

    res.status(200).json({
      pocUser: {
        name: pocUser?.name,
        email: pocUser?.email,
        role: pocUser?.role,
        college: pocUser?.college
      },
      sampleUsers: allUsers.map(user => ({
        name: user.name,
        role: user.role,
        college: user.college,
        email: user.email
      })),
      uniqueColleges: collegeValues,
      uniqueRoles: roleValues,
      totalUsers: await db.collection('users').countDocuments()
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}