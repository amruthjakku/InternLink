#!/usr/bin/env node

/**
 * Fix HTML entities in import statements that shouldn't be there
 */

import fs from 'fs';
import path from 'path';

function fixImportQuotes(content) {
  // Fix import statements with HTML entities
  let fixed = content;
  
  // Fix single quotes in import statements
  fixed = fixed.replace(/from '([^']+)'/g, "from '$1'");
  fixed = fixed.replace(/import '([^']+)'/g, "import '$1'");
  
  // Fix double quotes in import statements  
  fixed = fixed.replace(/from "([^"]+)"/g, 'from "$1"');
  fixed = fixed.replace(/import "([^"]+)"/g, 'import "$1"');
  
  return fixed;
}

function walkDirectory(dir, fileExtensions = ['.js', '.jsx']) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && fileExtensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixImportQuotes(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing import statement quotes...\n');
  
  // Find all relevant files
  const appFiles = walkDirectory('./app');
  const componentFiles = walkDirectory('./components');
  
  const allFiles = [...appFiles, ...componentFiles];
  
  let fixedCount = 0;
  allFiles.forEach(file => {
    if (processFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n✨ Fixed ${fixedCount} files with import quote issues!`);
}

main();