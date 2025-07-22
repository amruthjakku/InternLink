#!/usr/bin/env node

/**
 * Fix all JavaScript syntax errors caused by spaces in identifiers
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

// Comprehensive fixes for all syntax errors
const SYNTAX_FIXES = [
  // Function names with spaces
  { from: 'function AIDeveloperInternOnboarding', to: 'function AIDeveloperInternOnboarding' },
  { from: 'function TechLeadOnboarding', to: 'function TechLeadOnboarding' },
  { from: 'getAIDeveloperInternAttendanceStats', to: 'getAIDeveloperInternAttendanceStats' },
  
  // Variable declarations with spaces
  { from: 'const getAIDeveloperInternAttendanceStats', to: 'const getAIDeveloperInternAttendanceStats' },
  { from: 'maxAIDeveloperInterns:', to: 'maxAIDeveloperInterns:' },
  { from: 'totalTechLeads}', to: 'totalTechLeads}' },
  { from: 'stats.totalTechLeads', to: 'stats.totalTechLeads' },
  
  // Template literals and expressions
  { from: '${stats.totalTechLeads}', to: '${stats.totalTechLeads}' },
  
  // Function calls with spaces
  { from: 'getAIDeveloperInternAttendanceStats(', to: 'getAIDeveloperInternAttendanceStats(' },
  
  // Object properties with spaces (need to be quoted)
  { from: 'maxAIDeveloperInterns', to: 'maxAIDeveloperInterns' },
  { from: 'totalTechLeads', to: 'totalTechLeads' },
  
  // Variable assignments
  { from: 'const statsA = getAIDeveloperInternAttendanceStats', to: 'const statsA = getAIDeveloperInternAttendanceStats' },
  { from: 'const statsB = getAIDeveloperInternAttendanceStats', to: 'const statsB = getAIDeveloperInternAttendanceStats' },
  { from: 'const stats = getAIDeveloperInternAttendanceStats', to: 'const stats = getAIDeveloperInternAttendanceStats' },
  
  // More specific fixes for remaining errors
  { from: 'currentAIDeveloperInterns:', to: 'currentAIDeveloperInterns:' },
  { from: 'const [selectedTechLead, setSelectedTechLead]', to: 'const [selectedTechLead, setSelectedTechLead]' },
  { from: 'const assignAIDeveloperInternToCohort', to: 'const assignAIDeveloperInternToCohort' },
  { from: 'const getCohortAIDeveloperInterns', to: 'const getCohortAIDeveloperInterns' },
  { from: 'fetchAIDeveloperInternAnalytics', to: 'fetchAIDeveloperInternAnalytics' },
  { from: 'fetchTechLeads', to: 'fetchTechLeads' },
  { from: 'let sortedAIDeveloperInterns', to: 'let sortedAIDeveloperInterns' },
  { from: 'sortedAIDeveloperInterns.sort', to: 'sortedAIDeveloperInterns.sort' },
  { from: 'sortedAIDeveloperInterns', to: 'sortedAIDeveloperInterns' },
  
  // Additional fixes for object properties and function calls
  { from: 'cohort.currentAIDeveloperInterns', to: 'cohort.currentAIDeveloperInterns' },
  { from: 'selectedTechLead', to: 'selectedTechLead' },
  { from: 'getCohortAIDeveloperInterns(', to: 'getCohortAIDeveloperInterns(' },
  { from: 'assignAIDeveloperInternToCohort(', to: 'assignAIDeveloperInternToCohort(' },
  { from: 'const filteredAIDeveloperInterns', to: 'const filteredAIDeveloperInterns' },
  { from: 'const AIDeveloperInternLeaderboard', to: 'const AIDeveloperInternLeaderboard' },
  { from: '<AIDeveloperInternLeaderboard', to: '<AIDeveloperInternLeaderboard' },
  
  // More specific object property fixes
  { from: 'selectedCohort.currentAIDeveloperInterns', to: 'selectedCohort.currentAIDeveloperInterns' },
  { from: 'setSelectedTechLead(', to: 'setSelectedTechLead(' },
  { from: 'const handleAssignAIDeveloperIntern', to: 'const handleAssignAIDeveloperIntern' },
  { from: 'const handleUnassignAIDeveloperIntern', to: 'const handleUnassignAIDeveloperIntern' },
  { from: 'const [editingTechLead, setEditingTechLead]', to: 'const [editingTechLead, setEditingTechLead]' },
  { from: 'const [newTechLead, setNewTechLead]', to: 'const [newTechLead, setNewTechLead]' },
  { from: 'superTechLeadUsername:', to: 'superTechLeadUsername:' },
  
  // Additional object property and function fixes
  { from: 'atRiskAIDeveloperInterns', to: 'atRiskAIDeveloperInterns' },
  { from: 'const handleAddTechLead', to: 'const handleAddTechLead' },
  { from: '...newTechLead,', to: '...newTechLead,' },
  { from: 'college.superTechLeadName', to: 'college.superTechLeadName' },
  { from: 'superTechLeads:', to: 'superTechLeads:' },
  { from: 'const allAIDeveloperInterns', to: 'const allAIDeveloperInterns' },
  { from: 'allAIDeveloperInterns.length', to: 'allAIDeveloperInterns.length' },
  { from: 'allAIDeveloperInterns.forEach', to: 'allAIDeveloperInterns.forEach' },
  
  // More specific fixes for remaining syntax errors
  { from: 'filteredAIDeveloperInterns.length', to: 'filteredAIDeveloperInterns.length' },
  { from: 'setNewTechLead(', to: 'setNewTechLead(' },
  { from: 'college.superTechLeadUsername', to: 'college.superTechLeadUsername' },
  { from: 'const matchingAIDeveloperIntern', to: 'const matchingAIDeveloperIntern' },
  { from: 'allAIDeveloperInterns.find', to: 'allAIDeveloperInterns.find' },
  { from: 'matchingAIDeveloperIntern)', to: 'matchingAIDeveloperIntern)' },
  { from: 'matchingAIDeveloperIntern.name', to: 'matchingAIDeveloperIntern.name' },
  { from: 'matchingAIDeveloperIntern;', to: 'matchingAIDeveloperIntern;' },
  { from: 'const existingTechLead', to: 'const existingTechLead' },
  { from: 'existingTechLead)', to: 'existingTechLead)' },
  
  // Final batch of syntax error fixes
  { from: 'filteredAIDeveloperInterns.map', to: 'filteredAIDeveloperInterns.map' },
  { from: 'const handleEditTechLead', to: 'const handleEditTechLead' },
  { from: 'editingTechLead._id', to: 'editingTechLead._id' },
  { from: 'editingTechLead)', to: 'editingTechLead)' },
  { from: 'newCollege.superTechLeadUsername', to: 'newCollege.superTechLeadUsername' },
  { from: 'const currentAIDeveloperInterns', to: 'const currentAIDeveloperInterns' },
  { from: 'currentAIDeveloperInterns}', to: 'currentAIDeveloperInterns}' },
  { from: 'acc[collegeId].superTechLeads++', to: 'acc[collegeId].superTechLeads++' },
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
    for (const fix of SYNTAX_FIXES) {
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
  console.log('🔧 Fixing All JavaScript Syntax Errors...\n');
  
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
  
  console.log(`\n✅ Syntax fix completed: ${modifiedFiles}/${processedFiles} files modified`);
  console.log('\n🎉 All JavaScript syntax errors should now be resolved!');
}

main().catch(console.error);