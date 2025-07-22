import { connectToDatabase } from '../../../lib/mongoose.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route.js';
import User from '../../../models/User.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'POC') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectToDatabase();
    
    // Get POC's college information
    const pocUser = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    }).populate('college');

    if (!pocUser || !pocUser.college) {
      return res.status(404).json({ message: 'POC college information not found' });
    }

    // Get all users from the same college
    const users = await User.find({
      college: pocUser.college._id
    });

    console.log(`Found ${users.length} users for college:`, pocUser.college.name);

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