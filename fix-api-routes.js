#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all .js files in a directory
function findJSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findJSFiles(fullPath, files);
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to check if file uses getServerSession and doesn't have dynamic export
function needsDynamicExport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it uses getServerSession
  const hasGetServerSession = content.includes('getServerSession');
  
  // Check if it already has dynamic export
  const hasDynamicExport = content.includes("export const dynamic = 'force-dynamic'");
  
  return hasGetServerSession && !hasDynamicExport;
}

// Function to add dynamic export to a file
function addDynamicExport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the first export function line
  const exportFunctionRegex = /^export async function (GET|POST|PUT|DELETE|PATCH)/m;
  const match = content.match(exportFunctionRegex);
  
  if (match) {
    const insertPosition = content.indexOf(match[0]);
    const beforeExport = content.substring(0, insertPosition);
    const afterExport = content.substring(insertPosition);
    
    // Add the dynamic export before the first export function
    const dynamicExport = "\n// Force dynamic rendering for this route\nexport const dynamic = 'force-dynamic';\n\n";
    
    const newContent = beforeExport + dynamicExport + afterExport;
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Added dynamic export to: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, 'app', 'api');

if (!fs.existsSync(apiDir)) {
  console.error('❌ API directory not found:', apiDir);
  process.exit(1);
}

console.log('🔍 Scanning API routes for missing dynamic exports...\n');

const jsFiles = findJSFiles(apiDir);
let fixedCount = 0;

for (const filePath of jsFiles) {
  if (needsDynamicExport(filePath)) {
    if (addDynamicExport(filePath)) {
      fixedCount++;
    } else {
      console.log(`⚠️  Could not fix: ${filePath}`);
    }
  }
}

console.log(`\n✨ Fixed ${fixedCount} API route files`);
console.log('🎉 All API routes should now have proper dynamic exports!');