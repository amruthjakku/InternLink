#!/usr/bin/env node

/**
 * Script to automatically fix common linting issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common replacements for HTML entities
const htmlEntityReplacements = [
  { from: /Don't/g, to: "Don't" },
  { from: /can't/g, to: "can't" },
  { from: /won't/g, to: "won't" },
  { from: /isn't/g, to: "isn't" },
  { from: /doesn't/g, to: "doesn't" },
  { from: /haven't/g, to: "haven't" },
  { from: /I'm/g, to: "I'm" },
  { from: /you're/g, to: "you're" },
  { from: /we're/g, to: "we're" },
  { from: /they're/g, to: "they're" },
  { from: /it's/g, to: "it's" },
  { from: /that's/g, to: "that's" },
  // Fix quotes in JSX
  { from: /(?<=[\s>])"/g, to: """ },
  { from: /(?<=[\s>])'/g, to: "'" },
];

// Files to process
const filesToProcess = [
  './app/**/*.js',
  './app/**/*.jsx',
  './components/**/*.js',
  './components/**/*.jsx'
];

function fixHtmlEntities(content) {
  let fixedContent = content;
  
  htmlEntityReplacements.forEach(({ from, to }) => {
    // Only replace within JSX text, not in actual strings
    fixedContent = fixedContent.replace(from, to);
  });
  
  return fixedContent;
}

function addMissingDependencies(content, filePath) {
  let fixedContent = content;
  
  // Check if file uses useCallback but doesn't import it
  if (fixedContent.includes('useCallback') && !fixedContent.includes('useCallback') && fixedContent.includes("from 'react'")) {
    fixedContent = fixedContent.replace(
      /from 'react'/,
      "from 'react'" // We'll add useCallback to existing imports
    );
    
    // Add useCallback to existing React imports
    if (fixedContent.includes("import { ") && fixedContent.includes("} from 'react'")) {
      fixedContent = fixedContent.replace(
        /import \{ ([^}]+) \} from 'react'/,
        (match, imports) => {
          if (!imports.includes('useCallback')) {
            return `import { ${imports}, useCallback } from 'react'`;
          }
          return match;
        }
      );
    }
  }
  
  return fixedContent;
}

function processFile(filePath) {
  try {
    console.log(`Processing: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Apply fixes
    content = fixHtmlEntities(content);
    content = addMissingDependencies(content, filePath);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
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

function main() {
  console.log('🔧 Starting lint fixes...\n');
  
  // Find all relevant files
  const appFiles = walkDirectory('./app');
  const componentFiles = walkDirectory('./components');
  
  const allFiles = [...appFiles, ...componentFiles];
  
  console.log(`Found ${allFiles.length} files to process\n`);
  
  // Process each file
  allFiles.forEach(processFile);
  
  console.log('\n✨ Lint fixes completed!');
  console.log('\n📋 Recommended next steps:');
  console.log('1. Run: npm run lint');
  console.log('2. Fix any remaining manual issues');
  console.log('3. Run: npm audit fix');
  console.log('4. Test the application');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixHtmlEntities, addMissingDependencies, processFile };