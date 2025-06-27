#!/usr/bin/env node

console.log('🔍 Testing Admin Dashboard System Overview Data Synchronization...\n');

import fs from 'fs';
import path from 'path';

// Read the admin dashboard file
const dashboardPath = 'app/admin/dashboard/page.js';
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

// Extract API calls from the admin dashboard
const apiCallPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
const apiCalls = [];
let match;

while ((match = apiCallPattern.exec(dashboardContent)) !== null) {
  apiCalls.push(match[1]);
}

console.log('📋 Admin Dashboard API Calls:');
const uniqueApiCalls = [...new Set(apiCalls)];
uniqueApiCalls.forEach(call => {
  console.log(`   📤 ${call}`);
});

console.log(`\n🔢 Total unique API calls: ${uniqueApiCalls.length}\n`);

// Check if each API route file exists
console.log('🔍 Checking API Route Availability:\n');

const checkApiRoute = (apiPath) => {
  // Convert API path to file path
  let filePath = apiPath.replace('/api/', 'app/api/');
  
  // Handle query parameters
  if (filePath.includes('?')) {
    filePath = filePath.split('?')[0];
  }
  
  // Add route.js
  filePath = path.join(filePath, 'route.js');
  
  const exists = fs.existsSync(filePath);
  console.log(`   ${exists ? '✅' : '❌'} ${apiPath} ${exists ? '→ ' + filePath : '(MISSING)'}`);
  
  return exists;
};

let availableCount = 0;
uniqueApiCalls.forEach(apiCall => {
  if (checkApiRoute(apiCall)) {
    availableCount++;
  }
});

console.log(`\n📊 API Availability Summary:`);
console.log(`   ✅ Available: ${availableCount}/${uniqueApiCalls.length}`);
console.log(`   ❌ Missing: ${uniqueApiCalls.length - availableCount}/${uniqueApiCalls.length}`);
console.log(`   📈 Synchronization Rate: ${Math.round((availableCount / uniqueApiCalls.length) * 100)}%`);

// Check system overview specific APIs
console.log(`\n🎯 Critical System Overview APIs:`);
const criticalApis = [
  '/api/admin/dashboard-stats',
  '/api/system/health', 
  '/api/system/performance',
  '/api/system/logs'
];

let criticalAvailable = 0;
criticalApis.forEach(api => {
  const available = checkApiRoute(api);
  if (available) criticalAvailable++;
});

console.log(`\n🏆 System Overview Status:`);
if (criticalAvailable === criticalApis.length) {
  console.log('   ✅ FULLY SYNCHRONIZED - All critical APIs available');
  console.log('   🎉 Admin Dashboard System Overview should show real data!');
} else {
  console.log(`   ⚠️ PARTIALLY SYNCHRONIZED - ${criticalAvailable}/${criticalApis.length} critical APIs available`);
}

// Check what data fields are being used in the dashboard
console.log(`\n📊 Dashboard Data Fields Analysis:`);
const statsPattern = /stats\.(\w+)/g;
const dataFields = [];
let fieldMatch;

while ((fieldMatch = statsPattern.exec(dashboardContent)) !== null) {
  dataFields.push(fieldMatch[1]);
}

const uniqueFields = [...new Set(dataFields)];
console.log(`   📋 Data fields used: ${uniqueFields.length}`);
uniqueFields.forEach(field => {
  console.log(`      - stats.${field}`);
});

console.log(`\n🎯 CONCLUSION:`);
if (criticalAvailable === criticalApis.length && availableCount >= Math.floor(uniqueApiCalls.length * 0.8)) {
  console.log('   ✅ Admin Dashboard System Overview is SYNCHRONIZED');
  console.log('   🎊 Real database data should be displayed correctly!');
} else if (criticalAvailable === criticalApis.length) {
  console.log('   ⚠️ Core functionality SYNCHRONIZED, some secondary features may use fallback data');
  console.log('   📊 Main system overview metrics should show real data');
} else {
  console.log('   ❌ System Overview NOT FULLY SYNCHRONIZED');
  console.log('   🔧 Critical APIs are missing and need to be implemented');
}

console.log(`\n✅ Admin Dashboard Sync Test Complete`);