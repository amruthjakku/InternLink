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

    // Get college details
    let college;
    if (typeof pocUser.college === 'string') {
      // If college is stored as a string (college name)
      college = {
        _id: pocUser.college,
        name: pocUser.college,
        location: '',
        email: '',
        phone: '',
        website: ''
      };
    } else {
      // If college is stored as an object
      college = pocUser.college;
    }

    // Get all users from the same college with comprehensive matching
    const collegeQuery = {
      $or: [
        { college: college._id },
        { college: college.name },
        { 'college.name': college.name },
        { 'college._id': college._id }
      ]
    };

    // Add additional matching patterns if college name contains spaces or special characters
    if (college.name && college.name.includes(' ')) {
      collegeQuery.$or.push(
        { college: college.name.replace(/\s+/g, '') }, // Without spaces
        { college: college.name.toLowerCase() }, // Lowercase
        { college: college.name.toUpperCase() } // Uppercase
      );
    }

    console.log('College query:', JSON.stringify(collegeQuery, null, 2));
    const collegeUsers = await db.collection('users').find(collegeQuery).toArray();
    console.log(`Found ${collegeUsers.length} users for college:`, college.name);

    // Separate mentors (Tech Leads) and interns (AI Developer Interns)
    const mentors = collegeUsers.filter(user => 
      user.role === 'Tech Lead' || 
      user.role === 'TechLead' ||
      user.role === 'Mentor'
    );

    const interns = collegeUsers.filter(user => 
      user.role === 'AI Developer Intern' || 
      user.role === 'AIDeveloperIntern' ||
      user.role === 'Intern'
    );

    // Calculate statistics
    const stats = {
      totalTechLeads: mentors.length,
      totalAIDeveloperInterns: interns.length,
      assignedAIDeveloperInterns: interns.filter(intern => intern.assignedTechLead).length,
      activeTechLeads: mentors.filter(mentor => mentor.isActive !== false).length,
      activeInterns: interns.filter(intern => intern.isActive !== false).length
    };

    // Format the response
    const collegeData = {
      college,
      mentors: mentors.map(mentor => ({
        _id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        gitlabUsername: mentor.gitlabUsername,
        phone: mentor.phone || '',
        skills: mentor.skills || [],
        experience: mentor.experience || '',
        role: mentor.role,
        isActive: mentor.isActive !== false,
        createdAt: mentor.createdAt,
        updatedAt: mentor.updatedAt,
        college: mentor.college
      })),
      interns: interns.map(intern => ({
        _id: intern._id,
        name: intern.name,
        email: intern.email,
        gitlabUsername: intern.gitlabUsername,
        phone: intern.phone || '',
        skills: intern.skills || [],
        role: intern.role,
        assignedTechLead: intern.assignedTechLead || null,
        isActive: intern.isActive !== false,
        createdAt: intern.createdAt,
        updatedAt: intern.updatedAt,
        college: intern.college,
        cohortId: intern.cohortId || null
      })),
      stats
    };

    res.status(200).json(collegeData);
  } catch (error) {
    console.error('Error fetching college overview:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}