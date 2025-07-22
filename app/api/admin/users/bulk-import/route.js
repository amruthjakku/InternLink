import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import College from '../../../../../models/College';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let rows = [];
    let isCSV = file.name.endsWith('.csv');
    let isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isCSV) {
      const csvText = buffer.toString('utf-8');
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      if (parsed.errors.length > 0) {
        return NextResponse.json({ error: 'CSV parse error: ' + parsed.errors[0].message }, { status: 400 });
      }
      rows = parsed.data;
    } else if (isExcel) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a .csv or .xlsx file.' }, { status: 400 });
    }

    await connectToDatabase();
    const results = [];
    let createdCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // 1-based, +1 for header
      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const gitlabUsername = row.gitlabUsername?.trim().toLowerCase();
      const role = row.role?.trim();
      const collegeName = row.college?.trim();
      const assignedTech Lead = row.assignedTech Lead?.trim();

      // Basic validation
      if (!name || !role || !gitlabUsername) {
        results.push({ row: rowNum, success: false, message: 'Name, role, and GitLab username are required' });
        continue;
      }
      if (![ 'AI Developer Intern', 'Tech Lead', 'POC', 'admin' ].includes(role)) {
        results.push({ row: rowNum, success: false, message: 'Invalid role' });
        continue;
      }
      // Check for existing user
      const existingUser = await User.findOne({ $or: [ { email }, { gitlabUsername } ] });
      if (existingUser) {
        results.push({ row: rowNum, success: false, message: 'User with this email or gitlabUsername already exists' });
        continue;
      }
      // College handling
      let collegeId = null;
      if ([ 'AI Developer Intern', 'Tech Lead', 'POC' ].includes(role)) {
        if (!collegeName) {
          results.push({ row: rowNum, success: false, message: 'College is required for this role' });
          continue;
        }
        const collegeDoc = await College.findOne({ name: collegeName, isActive: true });
        if (!collegeDoc) {
          results.push({ row: rowNum, success: false, message: `College '${collegeName}' not found` });
          continue;
        }
        collegeId = collegeDoc._id;
      }
      // assignedTech Lead handling for interns
      let assignedTech LeadId = null;
      if (role === 'AI Developer Intern') {
        if (!assignedTech Lead) {
          results.push({ row: rowNum, success: false, message: 'assignedTech Lead is required for interns' });
          continue;
        }
        const mentorDoc = await User.findOne({ gitlabUsername: assignedTech Lead.toLowerCase(), role: 'Tech Lead', college: collegeId });
        if (!mentorDoc) {
          results.push({ row: rowNum, success: false, message: `Tech Lead '${assignedTech Lead}' not found in college` });
          continue;
        }
        assignedTech LeadId = mentorDoc._id;
      }
      // Create user
      const userData = {
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : `${gitlabUsername.toLowerCase()}@placeholder.com`,
        gitlabUsername: gitlabUsername.toLowerCase().trim(),
        role: role.trim(),
        assignedBy: session.user.name || session.user.email,
        isActive: true
      };
      if (collegeId) userData.college = collegeId;
      if (assignedTech LeadId) userData.assignedTech Lead = assignedTech LeadId;
      try {
        await new User(userData).save();
        createdCount++;
        results.push({ row: rowNum, success: true, message: 'User created' });
      } catch (err) {
        results.push({ row: rowNum, success: false, message: 'DB error: ' + err.message });
      }
    }

    return NextResponse.json({ success: true, message: `${createdCount} users created.`, details: results });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Bulk import failed: ' + error.message }, { status: 500 });
  }
} 