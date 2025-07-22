#!/usr/bin/env node

/**
 * Final cleanup script to fix remaining terminology issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Files to update (excluding node_modules, .git, etc.)
const EXCLUDED_DIRS = ['node_modules', '.git', '.next', 'dist', 'build'];
const INCLUDED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Final fixes for remaining issues
const FIXES = [
  // Fix variable names that got mangled
  { from: 'setTechLeads', to: 'setTechLeads' },
  { from: 'setSelectedAIDeveloperIntern', to: 'setSelectedAIDeveloperIntern' },
  { from: 'setShowAIDeveloperInternModal', to: 'setShowAIDeveloperInternModal' },
  { from: 'setAssigningAIDeveloperIntern', to: 'setAssigningAIDeveloperIntern' },
  { from: 'setAIDeveloperInternAnalytics', to: 'setAIDeveloperInternAnalytics' },
  { from: 'selectedAIDeveloperIntern', to: 'selectedAIDeveloperIntern' },
  { from: 'showAIDeveloperInternModal', to: 'showAIDeveloperInternModal' },
  { from: 'assigningAIDeveloperIntern', to: 'assigningAIDeveloperIntern' },
  { from: 'aIDeveloperInternAnalytics', to: 'aIDeveloperInternAnalytics' },
  
  // Fix component references
  { from: 'SuperTechLeadCommunicationTab', to: 'SuperTechLeadCommunicationTab' },
  
  // Fix any remaining spacing issues
  { from: 'AI Developer Intern Management', to: 'AI Developer Intern Management' },
  { from: 'Total AI Developer Interns', to: 'Total AI Developer Interns' },
  { from: 'Active AI Developer Interns', to: 'Active AI Developer Interns' },
  { from: 'AI Developer Intern Performance', to: 'AI Developer Intern Performance' },
  { from: 'AI Developer Intern', to: 'AI Developer Intern' },
  
  // Fix role strings to use proper capitalization
  { from: "'AI Developer Intern'", to: "'AI Developer Intern'" },
  { from: '"AI Developer Intern"', to: '"AI Developer Intern"' },
  { from: 'role=AI%20Developer%20Intern', to: 'role=AI%20Developer%20Intern' },
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
  console.log('🔧 Final Terminology Cleanup...\n');
  
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
  }
  
  console.log(`\n✅ Cleanup completed: ${modifiedFiles}/${processedFiles} files modified`);
  console.log('\n🎉 All terminology issues should now be resolved!');
}

main().catch(console.error);