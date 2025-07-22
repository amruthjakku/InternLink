#!/usr/bin/env node

/**
 * Script to fix the double terminology issue:
 * - "AI Developer Intern" -> "AI Developer Intern"
 * - Fix any other double replacements
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Files to update (excluding node_modules, .git, etc.)
const EXCLUDED_DIRS = ['node_modules', '.git', '.next', 'dist', 'build'];
const INCLUDED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md'];

// Fix double replacements
const FIXES = [
  // Fix double AI Developer Intern
  { from: 'AI Developer Intern', to: 'AI Developer Intern' },
  { from: "'AI Developer Intern'", to: "'AI Developer Intern'" },
  { from: '"AI Developer Intern"', to: '"AI Developer Intern"' },
  { from: 'AIDeveloperInternDashboard', to: 'AIDeveloperInternDashboard' },
  { from: 'AIDeveloperIntern', to: 'AIDeveloperIntern' },
  
  // Fix function names
  { from: 'fetchAIDeveloperInterns', to: 'fetchAIDeveloperInterns' },
  { from: 'setAIDeveloperInterns', to: 'setAIDeveloperInterns' },
  { from: 'totalAIDeveloperInterns', to: 'totalAIDeveloperInterns' },
  { from: 'activeAIDeveloperInterns', to: 'activeAIDeveloperInterns' },
  
  // Fix component names
  { from: 'AIDeveloperInternManagementTab', to: 'AIDeveloperInternManagementTab' },
  { from: 'TechLeadManagementTab', to: 'TechLeadManagementTab' },
  { from: 'SuperTechLeadCommunicationTab', to: 'SuperTechLeadCommunicationTab' },
  
  // Fix role checks
  { from: "role !== 'AI Developer Intern'", to: "role !== 'AI Developer Intern'" },
  { from: 'role=AI%20Developer%20Intern', to: 'role=AI%20Developer%20Intern' },
  
  // Fix comments
  { from: 'TechLeadDashboard', to: 'TechLeadDashboard' },
  { from: 'AIDeveloperInternDashboardPage', to: 'AIDeveloperInternDashboardPage' }
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

function fixFileContent(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all fixes
    for (const fix of FIXES) {
      if (content.includes(fix.from)) {
        content = content.replaceAll(fix.from, fix.to);
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

async function main() {
  console.log('🔧 Fixing Double Terminology Issues...\n');
  
  const allFiles = getAllFiles(projectRoot);
  let processedFiles = 0;
  let modifiedFiles = 0;
  
  console.log(`📁 Found ${allFiles.length} files to process`);
  
  for (const filePath of allFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    
    if (fixFileContent(filePath)) {
      console.log(`  ✅ Fixed: ${relativePath}`);
      modifiedFiles++;
    }
    
    processedFiles++;
    
    // Progress indicator
    if (processedFiles % 50 === 0) {
      console.log(`  📊 Progress: ${processedFiles}/${allFiles.length} files processed`);
    }
  }
  
  console.log(`\n✅ Fix completed: ${modifiedFiles}/${processedFiles} files modified`);
  console.log('\n🎉 Double terminology issues have been fixed!');
}

main().catch(console.error);