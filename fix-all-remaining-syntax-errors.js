#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define all the replacements needed
const replacements = [
  // Function names with spaces
  { from: 'handleAddTechLead', to: 'handleAddTechLead' },
  { from: 'handleDeleteTechLead', to: 'handleDeleteTechLead' },
  { from: 'handleEditTechLead', to: 'handleEditTechLead' },
  { from: 'handleAssignAIDeveloperIntern', to: 'handleAssignAIDeveloperIntern' },
  { from: 'handleUnassignAIDeveloperIntern', to: 'handleUnassignAIDeveloperIntern' },
  { from: 'handleAIDeveloperInternSelection', to: 'handleAIDeveloperInternSelection' },
  { from: 'handleAIDeveloperInternToggle', to: 'handleAIDeveloperInternToggle' },
  { from: 'handleAssignAIDeveloperInterns', to: 'handleAssignAIDeveloperInterns' },
  { from: 'logAIDeveloperInternData', to: 'logAIDeveloperInternData' },
  
  // Variable names with spaces
  { from: 'assignedTechLead', to: 'assignedTechLead' },
  { from: 'assignedTechLeadId', to: 'assignedTechLeadId' },
  { from: 'superTechLead', to: 'superTechLead' },
  { from: 'superTechLeadName', to: 'superTechLeadName' },
  { from: 'superTechLeadUsername', to: 'superTechLeadUsername' },
  { from: 'editingTechLead', to: 'editingTechLead' },
  { from: 'selectedTechLead', to: 'selectedTechLead' },
  { from: 'newTechLead', to: 'newTechLead' },
  { from: 'allAIDeveloperInterns', to: 'allAIDeveloperInterns' },
  { from: 'allTechLeads', to: 'allTechLeads' },
  { from: 'selectedAIDeveloperInterns', to: 'selectedAIDeveloperInterns' },
  { from: 'availableAIDeveloperInterns', to: 'availableAIDeveloperInterns' },
  { from: 'assigningAIDeveloperInterns', to: 'assigningAIDeveloperInterns' },
  { from: 'filteredAIDeveloperInterns', to: 'filteredAIDeveloperInterns' },
  { from: 'needsTechLeadAssignment', to: 'needsTechLeadAssignment' },
  { from: 'hasTechLead', to: 'hasTechLead' },
  { from: 'hasTechLeadIfNeeded', to: 'hasTechLeadIfNeeded' },
  { from: 'setEditingTechLead', to: 'setEditingTechLead' },
  { from: 'missingTechLeads', to: 'missingTechLeads' },
  { from: 'updatedTechLead', to: 'updatedTechLead' },
  { from: 'mentorsWithAIDeveloperInterns', to: 'mentorsWithAIDeveloperInterns' },
  { from: 'expectedAIDeveloperInterns', to: 'expectedAIDeveloperInterns' },
  { from: 'isAssignedAIDeveloperIntern', to: 'isAssignedAIDeveloperIntern' },
  { from: 'isTechLeadOrAdmin', to: 'isTechLeadOrAdmin' },
  { from: 'aiDeveloperInternId', to: 'aiDeveloperInternId' },
  { from: 'getAIDeveloperInternProgress', to: 'getAIDeveloperInternProgress' },
  { from: 'getCompletedTasksForAIDeveloperIntern', to: 'getCompletedTasksForAIDeveloperIntern' },
  { from: 'calculateAIDeveloperInternStats', to: 'calculateAIDeveloperInternStats' },
  
  // Component names with spaces
  { from: 'TechLeadTeamsTab', to: 'TechLeadTeamsTab' },
  { from: 'AIDeveloperInternManagement', to: 'AIDeveloperInternManagement' },
  { from: 'AIDeveloperInternManagementTab', to: 'AIDeveloperInternManagementTab' },
  
  // Pattern names with spaces
  { from: 'superTechLeadPatterns', to: 'superTechLeadPatterns' },
  { from: 'mentorTechLeadPatterns', to: 'mentorTechLeadPatterns' },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const replacement of replacements) {
      const regex = new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(replacement.from)) {
        content = content.replace(regex, replacement.to);
        modified = true;
        console.log(`Fixed "${replacement.from}" -> "${replacement.to}" in ${filePath}`);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules, .git, .next directories
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      // Process JavaScript, TypeScript, and JSX files
      if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
        processFile(fullPath);
      }
    }
  }
}

console.log('🔧 Starting comprehensive syntax error fix...');
processDirectory('/Users/jakkuamruth/Downloads/SOAI/InternLink');
console.log('✅ Comprehensive syntax error fix completed!');