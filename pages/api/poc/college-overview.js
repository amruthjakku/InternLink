import { connectToDatabase } from '../../../lib/mongoose.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
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

    // Get college details
    const college = pocUser.college;

    // Get all users from the same college
    const collegeUsers = await User.find({
      college: college._id
    });

    console.log(`Found ${collegeUsers.length} users for college:`, college.name);

    // Separate mentors (Tech Leads) and interns (AI Developer Interns) with flexible role matching
    const mentors = collegeUsers.filter(user => {
      const role = user.role?.toLowerCase().replace(/\s+/g, '');
      return role === 'techlead' || 
             role === 'tech-lead' ||
             role === 'mentor' ||
             user.role === 'Tech Lead' ||
             user.role === 'TechLead' ||
             user.role === 'Mentor';
    });

    const interns = collegeUsers.filter(user => {
      const role = user.role?.toLowerCase().replace(/\s+/g, '');
      return role === 'aideveloperintern' ||
             role === 'ai-developer-intern' ||
             role === 'intern' ||
             user.role === 'AI Developer Intern' ||
             user.role === 'AIDeveloperIntern' ||
             user.role === 'Intern';
    });

    console.log(`Separated users: ${mentors.length} mentors, ${interns.length} interns`);
    console.log('Mentor roles:', mentors.map(m => m.role));
    console.log('Intern roles:', interns.map(i => i.role));

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