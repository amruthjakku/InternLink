/**
 * Test script for enhanced soft delete and cohort management system
 * Run this script to verify all functionality works correctly
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class EnhancedSystemTester {
  constructor() {
    this.testResults = [];
    this.testUser = null;
    this.testCohort = null;
  }

  async runAllTests() {
    console.log('🧪 Starting Enhanced System Tests...\n');

    try {
      await this.testUserSoftDelete();
      await this.testUserReactivation();
      await this.testCohortAssignment();
      await this.testBulkOperations();
      await this.testDataIntegrity();
      await this.testSynchronization();

      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testUserSoftDelete() {
    console.log('🔍 Testing User Soft Delete...');

    try {
      // Create test user
      const createResponse = await this.makeRequest('/api/admin/users', 'POST', {
        gitlabUsername: 'test-soft-delete',
        gitlabId: 'test-123',
        name: 'Test Soft Delete User',
        email: 'test-soft-delete@example.com',
        role: 'AI developer Intern',
        assignedBy: 'test-admin'
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create test user');
      }

      const userData = await createResponse.json();
      this.testUser = userData.user;

      // Test soft delete
      const deleteResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
        action: 'deactivate_user',
        userId: this.testUser._id,
        data: {
          reason: 'Test soft delete'
        }
      });

      const deleteResult = await deleteResponse.json();

      if (deleteResponse.ok && !deleteResult.result.user.isActive) {
        this.addTestResult('User Soft Delete', true, 'User successfully soft deleted');
      } else {
        this.addTestResult('User Soft Delete', false, 'Soft delete failed');
      }

    } catch (error) {
      this.addTestResult('User Soft Delete', false, error.message);
    }
  }

  async testUserReactivation() {
    console.log('🔍 Testing User Reactivation...');

    if (!this.testUser) {
      this.addTestResult('User Reactivation', false, 'No test user available');
      return;
    }

    try {
      // Test reactivation
      const reactivateResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
        action: 'reactivate_user',
        userId: this.testUser._id,
        data: {
          reason: 'Test reactivation'
        }
      });

      const reactivateResult = await reactivateResponse.json();

      if (reactivateResponse.ok && reactivateResult.result.user.isActive) {
        this.addTestResult('User Reactivation', true, 'User successfully reactivated');
      } else {
        this.addTestResult('User Reactivation', false, 'Reactivation failed');
      }

      // Test conflict detection by creating duplicate
      const duplicateResponse = await this.makeRequest('/api/admin/users', 'POST', {
        gitlabUsername: 'test-soft-delete-duplicate',
        gitlabId: 'test-456',
        name: 'Test Duplicate User',
        email: 'test-soft-delete@example.com', // Same email
        role: 'AI developer Intern',
        assignedBy: 'test-admin'
      });

      if (duplicateResponse.ok) {
        const duplicateUser = (await duplicateResponse.json()).user;

        // Try to reactivate original user (should fail due to email conflict)
        await this.makeRequest('/api/admin/users/enhanced', 'POST', {
          action: 'deactivate_user',
          userId: this.testUser._id,
          data: { reason: 'Test conflict' }
        });

        const conflictResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
          action: 'reactivate_user',
          userId: this.testUser._id,
          data: { reason: 'Test conflict detection' }
        });

        if (!conflictResponse.ok) {
          this.addTestResult('Conflict Detection', true, 'Conflict properly detected');
        } else {
          this.addTestResult('Conflict Detection', false, 'Conflict not detected');
        }

        // Clean up duplicate
        await this.makeRequest(`/api/admin/users/${duplicateUser._id}`, 'DELETE');
      }

    } catch (error) {
      this.addTestResult('User Reactivation', false, error.message);
    }
  }

  async testCohortAssignment() {
    console.log('🔍 Testing Cohort Assignment...');

    try {
      // Create test cohort
      const cohortResponse = await this.makeRequest('/api/admin/cohorts', 'POST', {
        name: 'Test Enhanced Cohort',
        description: 'Test cohort for enhanced system',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxInterns: 10,
        createdBy: 'test-admin'
      });

      if (!cohortResponse.ok) {
        throw new Error('Failed to create test cohort');
      }

      const cohortData = await cohortResponse.json();
      this.testCohort = cohortData.cohort;

      // Test assignment
      const assignResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
        action: 'assign_cohort',
        userId: this.testUser._id,
        data: {
          cohortId: this.testCohort._id
        }
      });

      const assignResult = await assignResponse.json();

      if (assignResponse.ok && !assignResult.result.skipped) {
        this.addTestResult('Cohort Assignment', true, 'User successfully assigned to cohort');
      } else {
        this.addTestResult('Cohort Assignment', false, 'Cohort assignment failed');
      }

      // Test removal
      const removeResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
        action: 'remove_cohort',
        userId: this.testUser._id
      });

      const removeResult = await removeResponse.json();

      if (removeResponse.ok && !removeResult.result.skipped) {
        this.addTestResult('Cohort Removal', true, 'User successfully removed from cohort');
      } else {
        this.addTestResult('Cohort Removal', false, 'Cohort removal failed');
      }

    } catch (error) {
      this.addTestResult('Cohort Assignment', false, error.message);
    }
  }

  async testBulkOperations() {
    console.log('🔍 Testing Bulk Operations...');

    try {
      // Create multiple test users
      const userIds = [];
      for (let i = 0; i < 3; i++) {
        const response = await this.makeRequest('/api/admin/users', 'POST', {
          gitlabUsername: `test-bulk-${i}`,
          gitlabId: `bulk-${i}`,
          name: `Test Bulk User ${i}`,
          email: `test-bulk-${i}@example.com`,
          role: 'AI developer Intern',
          assignedBy: 'test-admin'
        });

        if (response.ok) {
          const userData = await response.json();
          userIds.push(userData.user._id);
        }
      }

      if (userIds.length === 0) {
        throw new Error('Failed to create test users for bulk operations');
      }

      // Test bulk assignment
      const bulkAssignResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
        action: 'bulk_assign_cohort',
        userIds,
        data: {
          cohortId: this.testCohort._id
        }
      });

      const bulkAssignResult = await bulkAssignResponse.json();

      if (bulkAssignResponse.ok && bulkAssignResult.result.successful.length > 0) {
        this.addTestResult('Bulk Cohort Assignment', true, `${bulkAssignResult.result.successful.length} users assigned`);
      } else {
        this.addTestResult('Bulk Cohort Assignment', false, 'Bulk assignment failed');
      }

      // Test bulk deactivation
      const bulkDeactivateResponse = await this.makeRequest('/api/admin/users/enhanced', 'POST', {
        action: 'bulk_deactivate',
        userIds,
        data: {
          reason: 'Test bulk deactivation'
        }
      });

      const bulkDeactivateResult = await bulkDeactivateResponse.json();

      if (bulkDeactivateResponse.ok && bulkDeactivateResult.result.successful.length > 0) {
        this.addTestResult('Bulk Deactivation', true, `${bulkDeactivateResult.result.successful.length} users deactivated`);
      } else {
        this.addTestResult('Bulk Deactivation', false, 'Bulk deactivation failed');
      }

      // Clean up test users
      for (const userId of userIds) {
        await this.makeRequest(`/api/admin/users/${userId}`, 'DELETE');
      }

    } catch (error) {
      this.addTestResult('Bulk Operations', false, error.message);
    }
  }

  async testDataIntegrity() {
    console.log('🔍 Testing Data Integrity...');

    try {
      const integrityResponse = await this.makeRequest('/api/admin/sync-user-data', 'POST', {
        action: 'validate_data_integrity'
      });

      const integrityResult = await integrityResponse.json();

      if (integrityResponse.ok) {
        this.addTestResult('Data Integrity Check', true, integrityResult.result.summary);
      } else {
        this.addTestResult('Data Integrity Check', false, 'Integrity check failed');
      }

    } catch (error) {
      this.addTestResult('Data Integrity Check', false, error.message);
    }
  }

  async testSynchronization() {
    console.log('🔍 Testing Synchronization...');

    try {
      const syncResponse = await this.makeRequest('/api/admin/sync-user-data', 'POST', {
        action: 'sync_cohort_assignments'
      });

      const syncResult = await syncResponse.json();

      if (syncResponse.ok) {
        this.addTestResult('Cohort Sync', true, `${syncResult.result.cohortsProcessed} cohorts processed`);
      } else {
        this.addTestResult('Cohort Sync', false, 'Synchronization failed');
      }

    } catch (error) {
      this.addTestResult('Synchronization', false, error.message);
    }
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    return fetch(`${API_BASE}${endpoint}`, options);
  }

  addTestResult(testName, passed, message) {
    this.testResults.push({
      test: testName,
      passed,
      message
    });

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (total - passed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    console.log('\n🎉 Enhanced System Testing Complete!');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');

    try {
      // Clean up test user
      if (this.testUser) {
        await this.makeRequest(`/api/admin/users/${this.testUser._id}`, 'DELETE');
      }

      // Clean up test cohort
      if (this.testCohort) {
        await this.makeRequest(`/api/admin/cohorts/${this.testCohort._id}`, 'DELETE');
      }

      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Run tests if this script is executed directly
if (typeof window === 'undefined' && require.main === module) {
  const tester = new EnhancedSystemTester();
  
  tester.runAllTests()
    .then(() => tester.cleanup())
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default EnhancedSystemTester;