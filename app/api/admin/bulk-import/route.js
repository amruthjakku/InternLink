import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { type, data } = await request.json();

    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ 
        error: 'Invalid request format. Expected type and data array.' 
      }, { status: 400 });
    }

    let successful = 0;
    let failed = 0;
    let errors = [];

    if (type === 'users') {
      for (let i = 0; i < data.length; i++) {
        try {
          const userData = data[i];
          const { gitlabUsername, name, email, role, college: collegeName } = userData;

          // Validate required fields
          if (!gitlabUsername || !name || !email || !role) {
            errors.push(`Row ${i + 1}: Missing required fields (gitlabUsername, name, email, role)`);
            failed++;
            continue;
          }

          // Check if user already exists
          const existingUser = await User.findOne({ 
            gitlabUsername: gitlabUsername.toLowerCase() 
          });

          if (existingUser) {
            errors.push(`Row ${i + 1}: User with GitLab username '${gitlabUsername}' already exists`);
            failed++;
            continue;
          }

          let collegeId = null;

          // Handle college assignment
          if (role === 'intern' && !collegeName) {
            errors.push(`Row ${i + 1}: College is required for intern role`);
            failed++;
            continue;
          }

          if (collegeName) {
            const college = await College.findOne({ 
              name: collegeName.trim(),
              isActive: true 
            });

            if (!college) {
              errors.push(`Row ${i + 1}: College '${collegeName}' not found`);
              failed++;
              continue;
            }

            collegeId = college._id;

            // Check if college already has a mentor for mentor role
            if (role === 'mentor') {
              const existingMentor = await User.findOne({ 
                role: 'mentor', 
                college: collegeId, 
                isActive: true 
              });

              if (existingMentor) {
                errors.push(`Row ${i + 1}: College '${collegeName}' already has a mentor assigned`);
                failed++;
                continue;
              }
            }
          }

          // Create new user
          const newUser = new User({
            gitlabUsername: gitlabUsername.toLowerCase(),
            gitlabId: `pending_${gitlabUsername.toLowerCase()}`,
            name,
            email: email.toLowerCase(),
            role,
            college: (role === 'intern' || (role === 'mentor' && collegeId)) ? collegeId : undefined,
            assignedBy: session.user.gitlabUsername,
            isActive: true
          });

          await newUser.save();

          // Update college with mentor username if mentor
          if (role === 'mentor' && collegeId) {
            await College.findByIdAndUpdate(collegeId, {
              mentorUsername: gitlabUsername.toLowerCase()
            });
          }

          successful++;

        } catch (error) {
          console.error(`Error creating user at row ${i + 1}:`, error);
          errors.push(`Row ${i + 1}: ${error.message}`);
          failed++;
        }
      }
    } else if (type === 'colleges') {
      for (let i = 0; i < data.length; i++) {
        try {
          const collegeData = data[i];
          const { name, description, location, website, mentorUsername } = collegeData;

          // Validate required fields
          if (!name) {
            errors.push(`Row ${i + 1}: College name is required`);
            failed++;
            continue;
          }

          // Check if college already exists
          const existingCollege = await College.findOne({ 
            name: name.trim(),
            isActive: true 
          });

          if (existingCollege) {
            errors.push(`Row ${i + 1}: College '${name}' already exists`);
            failed++;
            continue;
          }

          let mentor = null;

          // Validate mentor if provided
          if (mentorUsername && mentorUsername.trim()) {
            mentor = await User.findOne({ 
              gitlabUsername: mentorUsername.toLowerCase(),
              role: 'mentor',
              isActive: true 
            });

            if (!mentor) {
              errors.push(`Row ${i + 1}: Mentor '${mentorUsername}' not found or not available`);
              failed++;
              continue;
            }

            // Check if mentor is already assigned
            const existingAssignment = await College.findOne({ 
              mentorUsername: mentorUsername.toLowerCase(),
              isActive: true 
            });

            if (existingAssignment) {
              errors.push(`Row ${i + 1}: Mentor '${mentorUsername}' is already assigned to another college`);
              failed++;
              continue;
            }
          }

          // Create new college
          const newCollege = new College({
            name: name.trim(),
            description: description?.trim() || '',
            location: location?.trim() || '',
            website: website?.trim() || '',
            mentorUsername: mentorUsername ? mentorUsername.toLowerCase() : 'unassigned',
            createdBy: session.user.gitlabUsername,
            isActive: true
          });

          await newCollege.save();

          // Update mentor's college assignment if mentor exists
          if (mentor) {
            mentor.college = newCollege._id;
            await mentor.save();
          }

          successful++;

        } catch (error) {
          console.error(`Error creating college at row ${i + 1}:`, error);
          errors.push(`Row ${i + 1}: ${error.message}`);
          failed++;
        }
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid type. Must be "users" or "colleges".' 
      }, { status: 400 });
    }

    return NextResponse.json({
      successful,
      failed,
      errors: errors.slice(0, 10), // Limit errors to first 10 to avoid huge responses
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Error with bulk import:', error);
    return NextResponse.json({ 
      error: 'Failed to process bulk import' 
    }, { status: 500 });
  }
}