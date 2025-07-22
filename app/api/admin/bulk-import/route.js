import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';
import Task from '../../../../models/Task.js';
import * as XLSX from 'xlsx';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'POC')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const contentType = request.headers.get('content-type');
    let data, importType, preview;

    if (contentType?.includes('multipart/form-data')) {
      // File upload
      const formData = await request.formData();
      const file = formData.get('file');
      importType = formData.get('importType');
      preview = formData.get('preview') === 'true';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Parse file
      const buffer = Buffer.from(await file.arrayBuffer());
      data = await parseFile(buffer, file.name);
    } else {
      // JSON data (from preview confirmation or legacy format)
      const body = await request.json();
      if (body.type && body.data) {
        // Legacy format
        importType = body.type;
        data = body.data;
        preview = false;
      } else {
        data = body.data;
        importType = body.importType;
        preview = body.preview;
      }
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No valid data found in file' }, { status: 400 });
    }

    // Process import based on type
    const result = await processImport(data, importType, preview, session.user);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json({ 
      error: 'Import failed: ' + error.message 
    }, { status: 500 });
  }
}

async function parseFile(buffer, filename) {
  try {
    const extension = filename.split('.').pop().toLowerCase();
    
    if (extension === 'csv') {
      // Parse CSV
      const csvText = buffer.toString('utf-8');
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        if (values.length === headers.length) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });
          data.push(row);
        }
      }

      return data;
    } else if (extension === 'xlsx' || extension === 'xls') {
      // Parse Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return data;
    } else {
      throw new Error('Unsupported file format');
    }
  } catch (error) {
    throw new Error('Failed to parse file: ' + error.message);
  }
}

async function processImport(data, importType, preview, currentUser) {
  switch (importType) {
    case 'users':
      return await processUserImport(data, preview, currentUser);
    case 'tasks':
      return await processTaskImport(data, preview, currentUser);
    case 'attendance':
      return await processAttendanceImport(data, preview, currentUser);
    default:
      // Legacy support
      return await processLegacyUserImport(data, preview, currentUser);
  }
}

async function processUserImport(data, preview, currentUser) {
  const validation = {
    valid: 0,
    invalid: 0,
    errors: []
  };

  const processedData = [];
  const requiredFields = ['gitlabUsername'];

  // Validate data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowErrors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push(`Row ${i + 1}: Missing required field '${field}'`);
      }
    }

    // Validate role
    if (row.role && !['admin', 'POC', 'Tech Lead', 'AI Developer Intern'].includes(row.role)) {
      rowErrors.push(`Row ${i + 1}: Invalid role '${row.role}'`);
    }

    // Validate email format
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push(`Row ${i + 1}: Invalid email format`);
    }

    if (rowErrors.length > 0) {
      validation.invalid++;
      validation.errors.push(...rowErrors);
    } else {
      validation.valid++;
      processedData.push({
        gitlabUsername: row.gitlabUsername.toLowerCase().trim(),
        name: row.name || row.gitlabUsername,
        email: row.email ? row.email.toLowerCase().trim() : null,
        role: row.role || 'AI Developer Intern',
        college: row.college || null,
        cohort: row.cohort || null,
        assignedBy: currentUser.gitlabUsername || currentUser.name,
        isActive: true
      });
    }
  }

  if (preview) {
    return {
      data: processedData,
      validation,
      preview: true
    };
  }

  // Perform actual import
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (const userData of processedData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        gitlabUsername: userData.gitlabUsername
      });

      if (existingUser) {
        results.skipped++;
        continue;
      }

      // Create new user
      const newUser = new User({
        ...userData,
        gitlabId: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newUser.save();
      results.successful++;

    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to create user ${userData.gitlabUsername}: ${error.message}`);
    }
  }

  return results;
}

async function processTaskImport(data, preview, currentUser) {
  const validation = {
    valid: 0,
    invalid: 0,
    errors: []
  };

  const processedData = [];
  const requiredFields = ['title', 'description', 'category', 'dueDate'];

  // Validate data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowErrors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push(`Row ${i + 1}: Missing required field '${field}'`);
      }
    }

    // Validate task type
    if (row.type && !['assignment', 'project', 'quiz', 'presentation', 'research', 'coding', 'other'].includes(row.type)) {
      rowErrors.push(`Row ${i + 1}: Invalid task type '${row.type}'`);
    }

    // Validate priority
    if (row.priority && !['low', 'medium', 'high', 'urgent'].includes(row.priority)) {
      rowErrors.push(`Row ${i + 1}: Invalid priority '${row.priority}'`);
    }

    // Validate due date
    if (row.dueDate && isNaN(Date.parse(row.dueDate))) {
      rowErrors.push(`Row ${i + 1}: Invalid due date format`);
    }

    if (rowErrors.length > 0) {
      validation.invalid++;
      validation.errors.push(...rowErrors);
    } else {
      validation.valid++;
      
      processedData.push({
        title: row.title.trim(),
        description: row.description.trim(),
        type: row.type || 'assignment',
        priority: row.priority || 'medium',
        category: row.category.trim(),
        status: 'active',
        assignmentType: row.cohort ? 'cohort' : 'individual',
        cohortName: row.cohort || null,
        dueDate: new Date(row.dueDate),
        startDate: new Date(),
        estimatedHours: parseInt(row.estimatedHours) || 0,
        createdBy: currentUser.id,
        createdByRole: currentUser.role,
        assignedBy: currentUser.gitlabUsername || currentUser.name
      });
    }
  }

  if (preview) {
    return {
      data: processedData,
      validation,
      preview: true
    };
  }

  // Perform actual import
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  for (const taskData of processedData) {
    try {
      const newTask = new Task(taskData);
      await newTask.save();
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to create task '${taskData.title}': ${error.message}`);
    }
  }

  return results;
}

async function processAttendanceImport(data, preview, currentUser) {
  const validation = {
    valid: 0,
    invalid: 0,
    errors: []
  };

  const processedData = [];
  const requiredFields = ['gitlabUsername', 'date', 'status'];

  // Validate data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowErrors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!row[field] || row[field].toString().trim() === '') {
        rowErrors.push(`Row ${i + 1}: Missing required field '${field}'`);
      }
    }

    // Validate status
    if (row.status && !['present', 'absent', 'late', 'excused'].includes(row.status)) {
      rowErrors.push(`Row ${i + 1}: Invalid status '${row.status}'`);
    }

    // Validate date
    if (row.date && isNaN(Date.parse(row.date))) {
      rowErrors.push(`Row ${i + 1}: Invalid date format`);
    }

    if (rowErrors.length > 0) {
      validation.invalid++;
      validation.errors.push(...rowErrors);
    } else {
      validation.valid++;
      processedData.push({
        gitlabUsername: row.gitlabUsername.toLowerCase().trim(),
        date: new Date(row.date),
        status: row.status,
        checkInTime: row.checkInTime || null,
        checkOutTime: row.checkOutTime || null,
        recordedBy: currentUser.gitlabUsername || currentUser.name,
        recordedAt: new Date()
      });
    }
  }

  if (preview) {
    return {
      data: processedData,
      validation,
      preview: true
    };
  }

  // Perform actual import
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  const { getDatabase } = require('../../../../utils/database');
  const db = await getDatabase();

  for (const attendanceData of processedData) {
    try {
      // Find user by GitLab username
      const user = await User.findOne({
        gitlabUsername: attendanceData.gitlabUsername
      });

      if (!user) {
        results.failed++;
        results.errors.push(`User not found: ${attendanceData.gitlabUsername}`);
        continue;
      }

      // Check if attendance record already exists
      const existingRecord = await db.collection('attendancerecords').findOne({
        userId: user._id,
        date: {
          $gte: new Date(attendanceData.date.setHours(0, 0, 0, 0)),
          $lt: new Date(attendanceData.date.setHours(23, 59, 59, 999))
        }
      });

      if (existingRecord) {
        results.skipped++;
        continue;
      }

      // Create attendance record
      await db.collection('attendancerecords').insertOne({
        userId: user._id,
        userGitlabUsername: user.gitlabUsername,
        userName: user.name,
        date: attendanceData.date,
        status: attendanceData.status,
        checkInTime: attendanceData.checkInTime,
        checkOutTime: attendanceData.checkOutTime,
        recordedBy: attendanceData.recordedBy,
        recordedAt: attendanceData.recordedAt,
        source: 'bulk_import'
      });

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push(`Failed to create attendance record for ${attendanceData.gitlabUsername}: ${error.message}`);
    }
  }

  return results;
}

// Legacy function for backward compatibility
async function processLegacyUserImport(data, preview, currentUser) {
  let successful = 0;
  let failed = 0;
  let errors = [];

  // Legacy format assumes users import
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
      if (role === 'AI Developer Intern' && !collegeName) {
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
        if (role === 'Tech Lead') {
          const existingTech Lead = await User.findOne({ 
            role: 'Tech Lead', 
            college: collegeId, 
            isActive: true 
          });

          if (existingTech Lead) {
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
        college: (role === 'AI Developer Intern' || (role === 'Tech Lead' && collegeId)) ? collegeId : undefined,
        assignedBy: currentUser.gitlabUsername,
        isActive: true
      });

      await newUser.save();

      // Update college with mentor username if mentor
      if (role === 'Tech Lead' && collegeId) {
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

  return {
    successful,
    failed,
    errors: errors.slice(0, 10), // Limit errors to first 10
    totalErrors: errors.length
  };
}