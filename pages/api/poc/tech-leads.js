import { connectToDatabase } from '../../../lib/mongoose.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'POC') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const { name, email, gitlabUsername, phone, skills, experience, college } = req.body;

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { email },
        { gitlabUsername }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or GitLab username already exists' });
    }

    // Create new tech lead
    const newTechLead = {
      name,
      email,
      gitlabUsername,
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : [],
      experience: experience || '',
      role: 'Tech Lead',
      college,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newTechLead);

    res.status(201).json({
      message: 'Tech Lead added successfully',
      techLead: { ...newTechLead, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error adding tech lead:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}