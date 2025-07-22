import { connectToDatabase } from '../../../lib/mongoose.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route.js';
import User from '../../../models/User.js';
import Announcement from '../../../models/Announcement.js';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || session.user.role !== 'POC') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { db } = await connectToDatabase();

  if (req.method === 'GET') {
    try {
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

      // Get announcements for the college
      const announcements = await db.collection('announcements').find({
        $or: [
          { college: collegeId },
          { 'college.name': collegeId },
          { 'college._id': collegeId },
          { targetAudience: 'all' }, // Global announcements
          { targetAudience: { $in: ['students', 'tech-leads'] } } // Relevant to college users
        ]
      }).sort({ createdAt: -1 }).toArray();

      // Filter out expired announcements
      const activeAnnouncements = announcements.filter(announcement => {
        if (!announcement.expiresAt) return true;
        return new Date(announcement.expiresAt) > new Date();
      });

      res.status(200).json({
        announcements: activeAnnouncements,
        total: activeAnnouncements.length,
        college: pocUser.college
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
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

      const { title, content, priority, targetAudience, expiresAt } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }

      // Get college identifier
      const collegeId = typeof pocUser.college === 'string' ? pocUser.college : pocUser.college._id || pocUser.college.name;

      const newAnnouncement = {
        title,
        content,
        priority: priority || 'medium',
        targetAudience: targetAudience || 'college',
        college: collegeId,
        createdBy: session.user.gitlabUsername || session.user.email,
        createdAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      };

      const result = await db.collection('announcements').insertOne(newAnnouncement);

      res.status(201).json({
        message: 'Announcement created successfully',
        announcement: { ...newAnnouncement, _id: result.insertedId }
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, title, content, priority, targetAudience, expiresAt } = req.body;

      if (!id) {
        return res.status(400).json({ message: 'Announcement ID is required' });
      }

      const updateData = {
        ...(title && { title }),
        ...(content && { content }),
        ...(priority && { priority }),
        ...(targetAudience && { targetAudience }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        updatedAt: new Date()
      };

      const result = await db.collection('announcements').updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.status(200).json({ message: 'Announcement updated successfully' });
    } catch (error) {
      console.error('Error updating announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: 'Announcement ID is required' });
      }

      const result = await db.collection('announcements').deleteOne({
        _id: new ObjectId(id)
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Announcement not found' });
      }

      res.status(200).json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}