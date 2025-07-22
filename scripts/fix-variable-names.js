#!/usr/bin/env node

/**
 * Fix JavaScript variable names that have spaces (invalid syntax)
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

// Fix variable names with spaces
const VARIABLE_FIXES = [
  // Fix variable declarations
  { from: 'const existingAIDeveloperIntern', to: 'const existingAIDeveloperIntern' },
  { from: 'const cohortAIDeveloperInterns', to: 'const cohortAIDeveloperInterns' },
  { from: 'const testAIDeveloperIntern', to: 'const testAIDeveloperIntern' },
  { from: 'const formattedAIDeveloperInterns', to: 'const formattedAIDeveloperInterns' },
  { from: 'const assignedAIDeveloperInterns', to: 'const assignedAIDeveloperInterns' },
  { from: 'const collegeAIDeveloperInterns', to: 'const collegeAIDeveloperInterns' },
  { from: 'const updatedAIDeveloperInterns', to: 'const updatedAIDeveloperInterns' },
  
  // Fix variable usage
  { from: 'cohortAIDeveloperInterns', to: 'cohortAIDeveloperInterns' },
  { from: 'testAIDeveloperIntern', to: 'testAIDeveloperIntern' },
  { from: 'formattedAIDeveloperInterns', to: 'formattedAIDeveloperInterns' },
  { from: 'assignedAIDeveloperInterns', to: 'assignedAIDeveloperInterns' },
  { from: 'collegeAIDeveloperInterns', to: 'collegeAIDeveloperInterns' },
  { from: 'updatedAIDeveloperInterns', to: 'updatedAIDeveloperInterns' },
  { from: 'existingAIDeveloperIntern', to: 'existingAIDeveloperIntern' },
  
  // Fix state setters
  { from: 'setAIDeveloperInternActivity', to: 'setAIDeveloperInternActivity' },
  
  // Fix boolean variables
  { from: 'hasAIDeveloperInternCounts', to: 'hasAIDeveloperInternCounts' },
  
  // Fix array access
  { from: 'cohortAIDeveloperInterns[', to: 'cohortAIDeveloperInterns[' },
  { from: 'collegeAIDeveloperInterns[', to: 'collegeAIDeveloperInterns[' },
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
    for (const fix of VARIABLE_FIXES) {
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
  console.log('🔧 Fixing JavaScript Variable Names...\n');
  
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
  
  console.log(`\n✅ Variable fix completed: ${modifiedFiles}/${processedFiles} files modified`);
  console.log('\n🎉 JavaScript syntax errors should now be resolved!');
}

main().catch(console.error);