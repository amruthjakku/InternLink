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
    
    // Get POC's college information
    const pocUser = await db.collection('users').findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    });

    if (!pocUser || !pocUser.college) {
      return res.status(404).json({ message: 'POC college information not found' });
    }

    // Get college identifier
    const collegeId = typeof pocUser.college === 'string' ? pocUser.college : pocUser.college._id || pocUser.college.name;

    // Get all users from the same college
    const users = await db.collection('users').find({
      $or: [
        { college: collegeId },
        { 'college.name': collegeId },
        { 'college._id': collegeId }
      ]
    }).toArray();

    // Format users data
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      gitlabUsername: user.gitlabUsername,
      phone: user.phone || '',
      role: user.role,
      skills: user.skills || [],
      experience: user.experience || '',
      isActive: user.isActive !== false,
      assignedTechLead: user.assignedTechLead || null,
      cohortId: user.cohortId || null,
      college: user.college,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));

    res.status(200).json({
      users: formattedUsers,
      total: formattedUsers.length,
      college: pocUser.college
    });
  } catch (error) {
    console.error('Error fetching college users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}