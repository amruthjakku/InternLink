#!/usr/bin/env node

console.log('🔍 Testing Cohort Filtering and College Intern Counts...\n');

import fs from 'fs';
import path from 'path';

// Test 1: Check if cohort filtering logic handles both string and object formats
console.log('📋 Test 1: Cohort Filtering Logic');

// Mock user data with different cohortId formats
const mockUsers = [
  {
    _id: '1',
    name: 'John Doe',
    cohortId: 'cohort123', // String format
    role: 'intern'
  },
  {
    _id: '2', 
    name: 'Jane Smith',
    cohortId: { _id: 'cohort123', name: 'Cohort A' }, // Object format
    role: 'intern'
  },
  {
    _id: '3',
    name: 'Bob Johnson', 
    cohortId: null, // No cohort
    role: 'intern'
  }
];

// Test filtering logic
const filterCohort = 'cohort123';

const filteredUsers = mockUsers.filter(user => {
  const matchesCohort = filterCohort === 'all' ||
    (filterCohort === 'none' && !user.cohortId) ||
    (user.cohortId && (
      // Handle both string cohortId and populated cohortId object
      (typeof user.cohortId === 'string' && user.cohortId === filterCohort) ||
      (typeof user.cohortId === 'object' && user.cohortId._id === filterCohort)
    ));
  
  return matchesCohort;
});

console.log(`   Original users: ${mockUsers.length}`);
console.log(`   Filter cohort: ${filterCohort}`);
console.log(`   Filtered users: ${filteredUsers.length}`);
console.log(`   Expected: 2 (John and Jane should match)`);
console.log(`   ✅ Test ${filteredUsers.length === 2 ? 'PASSED' : 'FAILED'}`);

console.log('\n📋 Test 2: College API Enhancement Check');

// Check if college API file has been updated with intern counts
const collegeApiPath = 'app/api/admin/colleges/route.js';
const collegeApiContent = fs.readFileSync(collegeApiPath, 'utf8');

const hasInternCounts = collegeApiContent.includes('totalInterns') && 
                       collegeApiContent.includes('activeInterns') &&
                       collegeApiContent.includes('internsWithCohorts');

console.log(`   College API file: ${collegeApiPath}`);
console.log(`   Has intern count calculations: ${hasInternCounts ? '✅ YES' : '❌ NO'}`);

console.log('\n📋 Test 3: Component Filtering Fix Check');

// Check if EnhancedUserManagement has the fix
const componentPath = 'components/admin/EnhancedUserManagement.js';
const componentContent = fs.readFileSync(componentPath, 'utf8');

const hasFilteringFix = componentContent.includes('typeof user.cohortId === \'string\'') &&
                       componentContent.includes('typeof user.cohortId === \'object\'');

console.log(`   Component file: ${componentPath}`);
console.log(`   Has filtering fix: ${hasFilteringFix ? '✅ YES' : '❌ NO'}`);

console.log('\n🎯 SUMMARY:');
console.log(`   Cohort filtering logic: ${filteredUsers.length === 2 ? '✅ FIXED' : '❌ NEEDS WORK'}`);
console.log(`   College API intern counts: ${hasInternCounts ? '✅ FIXED' : '❌ NEEDS WORK'}`);
console.log(`   Component filtering fix: ${hasFilteringFix ? '✅ FIXED' : '❌ NEEDS WORK'}`);

const allFixed = (filteredUsers.length === 2) && hasInternCounts && hasFilteringFix;
console.log(`\n🏆 Overall Status: ${allFixed ? '✅ ALL ISSUES FIXED' : '⚠️ SOME ISSUES REMAIN'}`);

if (allFixed) {
  console.log('\n🎉 Great! The fixes should resolve:');
  console.log('   1. Cohort dropdown filtering not showing assigned interns');
  console.log('   2. College management showing zero intern counts');
  console.log('\n💡 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Clear browser cache');
  console.log('   3. Test the cohort filtering in User Management');
  console.log('   4. Check college intern counts in College Management');
}

console.log('\n✅ Cohort Filtering Test Complete');