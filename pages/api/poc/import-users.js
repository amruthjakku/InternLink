import { connectToDatabase } from '../../../utils/database.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route.js';
import formidable from 'formidable';
import fs from 'fs';
import csv from 'csv-parser';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    
    // Parse form data
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    const college = fields.college?.[0];
    const role = fields.role?.[0];

    if (!file || !college || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Read and parse CSV
    const users = [];
    const existingUsers = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.filepath)
        .pipe(csv())
        .on('data', (data) => users.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    let imported = 0;
    let skipped = 0;

    for (const userData of users) {
      try {
        // Check if user already exists
        const existingUser = await db.collection('users').findOne({
          $or: [
            { email: userData.email },
            { gitlabUsername: userData.gitlabUsername }
          ]
        });

        if (existingUser) {
          skipped++;
          continue;
        }

        // Create user object based on role
        const newUser = {
          name: userData.name,
          email: userData.email,
          gitlabUsername: userData.gitlabUsername,
          phone: userData.phone || '',
          skills: userData.skills ? userData.skills.split(',').map(s => s.trim()) : [],
          role,
          college,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Add role-specific fields
        if (role === 'Tech Lead') {
          newUser.experience = userData.experience || '';
        } else if (role === 'AI Developer Intern') {
          newUser.cohortId = userData.cohortId || '';
          newUser.assignedTechLead = null;
        }

        await db.collection('users').insertOne(newUser);
        imported++;
      } catch (error) {
        console.error('Error importing user:', userData, error);
        skipped++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      message: `Import completed. ${imported} users imported, ${skipped} skipped.`,
      imported,
      skipped
    });
  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}