import { connectToDatabase } from '../../../utils/database.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route.js';

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

    // Get tech leads and interns
    const techLeads = users.filter(user => 
      user.role === 'Tech Lead' || 
      user.role === 'TechLead' ||
      user.role === 'Mentor'
    );

    const interns = users.filter(user => 
      user.role === 'AI Developer Intern' || 
      user.role === 'AIDeveloperIntern' ||
      user.role === 'Intern'
    );

    // Create teams based on tech lead assignments
    const teams = techLeads.map(techLead => {
      const assignedInterns = interns.filter(intern => 
        intern.assignedTechLead === techLead._id.toString() ||
        intern.assignedTechLead === techLead.gitlabUsername ||
        intern.assignedTechLead === techLead.email
      );

      return {
        _id: techLead._id,
        name: `${techLead.name}'s Team`,
        techLead: {
          _id: techLead._id,
          name: techLead.name,
          email: techLead.email,
          gitlabUsername: techLead.gitlabUsername
        },
        members: assignedInterns.map(intern => ({
          _id: intern._id,
          name: intern.name,
          email: intern.email,
          gitlabUsername: intern.gitlabUsername,
          role: intern.role
        })),
        memberCount: assignedInterns.length,
        isActive: techLead.isActive !== false,
        createdAt: techLead.createdAt || new Date(),
        college: collegeId
      };
    });

    // Add unassigned interns as a separate "team"
    const unassignedInterns = interns.filter(intern => !intern.assignedTechLead);
    if (unassignedInterns.length > 0) {
      teams.push({
        _id: 'unassigned',
        name: 'Unassigned Interns',
        techLead: null,
        members: unassignedInterns.map(intern => ({
          _id: intern._id,
          name: intern.name,
          email: intern.email,
          gitlabUsername: intern.gitlabUsername,
          role: intern.role
        })),
        memberCount: unassignedInterns.length,
        isActive: true,
        createdAt: new Date(),
        college: collegeId
      });
    }

    res.status(200).json({
      teams,
      total: teams.length,
      college: pocUser.college
    });
  } catch (error) {
    console.error('Error fetching college teams:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}