#!/usr/bin/env node

/**
 * Script to update terminology throughout the codebase:
 * - intern -> AI Developer Intern
 * - mentor -> Tech Lead  
 * - super-mentor -> POC
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const MONGODB_URI = 'mongodb+srv://amruthjakku:jS7fK5f2QwMZANut@cluster0.hc4q6ax.mongodb.net/internship_tracker';

// Files to update (excluding node_modules, .git, etc.)
const EXCLUDED_DIRS = ['node_modules', '.git', '.next', 'dist', 'build'];
const INCLUDED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md'];

// Terminology mappings
const ROLE_MAPPINGS = {
  'AI Developer Intern': 'AI Developer Intern',
  'Tech Lead': 'Tech Lead',
  'POC': 'POC'
};

// Text replacements (case-sensitive)
const TEXT_REPLACEMENTS = [
  // Role references
  { from: "'AI Developer Intern'", to: "'AI Developer Intern'" },
  { from: '"AI Developer Intern"', to: '"AI Developer Intern"' },
  { from: "'Tech Lead'", to: "'Tech Lead'" },
  { from: '"Tech Lead"', to: '"Tech Lead"' },
  { from: "'POC'", to: "'POC'" },
  { from: '"POC"', to: '"POC"' },
  
  // Array references
  { from: "['AI Developer Intern']", to: "['AI Developer Intern']" },
  { from: '["AI Developer Intern"]', to: '["AI Developer Intern"]' },
  { from: "['Tech Lead']", to: "['Tech Lead']" },
  { from: '["Tech Lead"]', to: '["Tech Lead"]' },
  { from: "['POC']", to: "['POC']" },
  { from: '["POC"]', to: '["POC"]' },
  
  // Mixed arrays
  { from: "['Tech Lead', 'POC']", to: "['Tech Lead', 'POC']" },
  { from: '["Tech Lead", "POC"]', to: '["Tech Lead", "POC"]' },
  { from: "{ $in: ['Tech Lead', 'POC'] }", to: "{ $in: ['Tech Lead', 'POC'] }" },
  { from: '{ $in: ["Tech Lead", "POC"] }', to: '{ $in: ["Tech Lead", "POC"] }' },
  
  // Common phrases
  { from: 'POC', to: 'POC' },
  { from: 'POC', to: 'POC' },
  { from: 'POC', to: 'POC' },
  { from: 'Tech Lead', to: 'Tech Lead' },
  { from: 'AI Developer Intern', to: 'AI Developer Intern' },
  
  // URL paths and routes
  { from: '/tech-lead/', to: '/tech-lead/' },
  { from: '/ai-developer-intern/', to: '/ai-developer-intern/' },
  
  // Comments and documentation
  { from: '// Tech Lead', to: '// Tech Lead' },
  { from: '// AI Developer Intern', to: '// AI Developer Intern' },
  { from: '* Tech Lead', to: '* Tech Lead' },
  { from: '* AI Developer Intern', to: '* AI Developer Intern' }
];

function shouldProcessFile(filePath) {
  // Skip excluded directories
  for (const dir of EXCLUDED_DIRS) {
    if (filePath.includes(`/${dir}/`) || filePath.includes(`\\${dir}\\`)) {
      return false;
    }
  }
  
  // Only process files with included extensions
  const ext = path.extname(filePath);
  return INCLUDED_EXTENSIONS.includes(ext);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      if (!EXCLUDED_DIRS.includes(file)) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else if (shouldProcessFile(fullPath)) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function updateFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all text replacements
    for (const replacement of TEXT_REPLACEMENTS) {
      if (content.includes(replacement.from)) {
        content = content.replaceAll(replacement.from, replacement.to);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function updateDatabase() {
  console.log('🔄 Updating database terminology...');
  
  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('internship_tracker');
    
    // Update users collection
    const usersCollection = db.collection('users');
    
    // We already did this migration, but let's verify
    const users = await usersCollection.find({}).toArray();
    const validRoles = ['admin', 'POC', 'Tech Lead', 'AI Developer Intern'];
    
    let updatedCount = 0;
    for (const user of users) {
      if (!validRoles.includes(user.role)) {
        const newRole = ROLE_MAPPINGS[user.role] || 'AI Developer Intern';
        await usersCollection.updateOne(
          { _id: user._id },
          { 
            $set: { 
              role: newRole,
              updatedAt: new Date()
            }
          }
        );
        console.log(`  Updated ${user.gitlabUsername}: "${user.role}" → "${newRole}"`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Database updated: ${updatedCount} users`);
    
  } catch (error) {
    console.error('❌ Database update failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function updateCodebase() {
  console.log('🔄 Updating codebase terminology...');
  
  const allFiles = getAllFiles(projectRoot);
  let processedFiles = 0;
  let modifiedFiles = 0;
  
  console.log(`📁 Found ${allFiles.length} files to process`);
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    
    if (updateFileContent(filePath)) {
      console.log(`  ✅ Updated: ${relativePath}`);
      modifiedFiles++;
    }
    
    processedFiles++;
    
    // Progress indicator
    if (processedFiles % 50 === 0) {
      console.log(`  📊 Progress: ${processedFiles}/${allFiles.length} files processed`);
    }
  }
  
  console.log(`✅ Codebase updated: ${modifiedFiles}/${processedFiles} files modified`);
}

async function main() {
  console.log('🚀 Starting Terminology Update...\n');
  
  console.log('📋 Terminology Changes:');
  console.log('  • intern → AI Developer Intern');
  console.log('  • mentor → Tech Lead');
  console.log('  • super-mentor → POC\n');
  
  // Update database first
  await updateDatabase();
  console.log('');
  
  // Update codebase
  await updateCodebase();
  
  console.log('\n🎉 Terminology update completed!');
  console.log('\n📝 Next steps:');
  console.log('  1. Test the application to ensure everything works');
  console.log('  2. Check for any remaining references that need manual updates');
  console.log('  3. Update any external documentation or configs');
}

main().catch(console.error);