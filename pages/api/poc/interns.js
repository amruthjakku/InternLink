import { connectToDatabase } from '../../../utils/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

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
    const { name, email, gitlabUsername, phone, skills, cohortId, college } = req.body;

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

    // Create new intern
    const newIntern = {
      name,
      email,
      gitlabUsername,
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : [],
      cohortId: cohortId || '',
      role: 'AI Developer Intern',
      college,
      status: 'active',
      assignedTechLead: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(newIntern);

    res.status(201).json({
      message: 'AI Developer Intern added successfully',
      intern: { ...newIntern, _id: result.insertedId }
    });
  } catch (error) {
    console.error('Error adding intern:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}