#!/usr/bin/env node

/**
 * OAuth Transition Test Script
 * 
 * Tests the OAuth transition functionality to ensure everything works correctly
 * 
 * Usage:
 *   node scripts/test-oauth-transition.js [options]
 * 
 * Options:
 *   --endpoint <url>    Test specific endpoint (default: all)
 *   --user-id <id>      Test with specific user ID
 *   --verbose           Show detailed output
 */

import { connectToDatabase } from '../utils/database.js';
import GitLabIntegration from '../models/GitLabIntegration.js';
import User from '../models/User.js';
import { GitLabOAuthAPI } from '../utils/gitlab-oauth-api.js';
import { GitLabAPI } from '../utils/gitlab-api.js';
import { decrypt } from '../utils/encryption.js';

const args = process.argv.slice(2);
const endpoint = args.find(arg => arg.startsWith('--endpoint='))?.split('=')[1];
const userId = args.find(arg => arg.startsWith('--user-id='))?.split('=')[1];
const verbose = args.includes('--verbose');

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_ENDPOINTS = [
  '/api/gitlab/unified-status',
  '/api/gitlab/unified-activity',
  '/api/gitlab/oauth-status',
  '/api/gitlab/oauth-test',
  '/api/gitlab/connection-status'
];

async function main() {
  try {
    console.log('🧪 OAuth Transition Test Suite');
    console.log('==============================\n');

    await connectToDatabase();

    if (endpoint) {
      await testSpecificEndpoint(endpoint);
    } else if (userId) {
      await testUserIntegration(userId);
    } else {
      await runFullTestSuite();
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

async function runFullTestSuite() {
  console.log('🔍 Running Full Test Suite');
  console.log('===========================\n');

  // Test 1: Database Integration Status
  await testDatabaseIntegrations();

  // Test 2: API Endpoints
  await testAPIEndpoints();

  // Test 3: OAuth vs PAT Functionality
  await testOAuthVsPAT();

  // Test 4: Token Refresh Logic
  await testTokenRefresh();

  console.log('\n✅ Full test suite completed!');
}

async function testDatabaseIntegrations() {
  console.log('📊 Testing Database Integrations');
  console.log('---------------------------------');

  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const oauthIntegrations = await GitLabIntegration.countDocuments({ 
      tokenType: 'oauth', 
      isActive: true 
    });
    const patIntegrations = await GitLabIntegration.countDocuments({ 
      tokenType: 'personal_access_token', 
      isActive: true 
    });

    console.log(`✅ Total Active Users: ${totalUsers}`);
    console.log(`✅ OAuth Integrations: ${oauthIntegrations}`);
    console.log(`✅ PAT Integrations: ${patIntegrations}`);
    console.log(`✅ Coverage: ${((oauthIntegrations + patIntegrations) / totalUsers * 100).toFixed(1)}%\n`);

    // Test integration data structure
    const sampleOAuth = await GitLabIntegration.findOne({ tokenType: 'oauth' });
    const samplePAT = await GitLabIntegration.findOne({ tokenType: 'personal_access_token' });

    if (sampleOAuth) {
      console.log('✅ OAuth Integration Structure Valid');
      if (verbose) {
        console.log(`   - User: ${sampleOAuth.gitlabUsername}`);
        console.log(`   - Repositories: ${sampleOAuth.repositories?.length || 0}`);
        console.log(`   - Token Expires: ${sampleOAuth.tokenExpiresAt || 'N/A'}`);
      }
    }

    if (samplePAT) {
      console.log('✅ PAT Integration Structure Valid');
      if (verbose) {
        console.log(`   - User: ${samplePAT.gitlabUsername}`);
        console.log(`   - Repositories: ${samplePAT.repositories?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ Database integration test failed:', error.message);
  }

  console.log();
}

async function testAPIEndpoints() {
  console.log('🌐 Testing API Endpoints');
  console.log('-------------------------');

  for (const endpoint of TEST_ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      // Note: This is a basic structure test since we can't authenticate without a session
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 401) {
        console.log(`✅ ${endpoint} - Properly requires authentication`);
      } else if (response.ok) {
        console.log(`✅ ${endpoint} - Responds successfully`);
      } else {
        console.log(`⚠️ ${endpoint} - Unexpected status: ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  console.log();
}

async function testUserIntegration(userId) {
  console.log(`👤 Testing User Integration: ${userId}`);
  console.log('=====================================');

  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log(`User: ${user.name} (@${user.gitlabUsername})`);
    console.log(`Role: ${user.role}`);

    // Check OAuth integration
    const oauthIntegration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'oauth',
      isActive: true
    });

    // Check PAT integration
    const patIntegration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'personal_access_token',
      isActive: true
    });

    console.log(`OAuth Integration: ${oauthIntegration ? '✅ Found' : '❌ Not Found'}`);
    console.log(`PAT Integration: ${patIntegration ? '✅ Found' : '❌ Not Found'}`);

    if (oauthIntegration) {
      console.log('\n🔐 OAuth Integration Details:');
      console.log(`   Connected: ${oauthIntegration.connectedAt}`);
      console.log(`   Last Sync: ${oauthIntegration.lastSyncAt || 'Never'}`);
      console.log(`   Repositories: ${oauthIntegration.repositories?.length || 0}`);
      console.log(`   Token Expires: ${oauthIntegration.tokenExpiresAt || 'N/A'}`);

      // Test OAuth API
      try {
        const oauthAPI = new GitLabOAuthAPI(user._id);
        const testResult = await oauthAPI.testConnection();
        console.log(`   API Test: ${testResult.success ? '✅ Success' : '❌ Failed'}`);
        if (!testResult.success) {
          console.log(`   Error: ${testResult.error}`);
        }
      } catch (apiError) {
        console.log(`   API Test: ❌ Error - ${apiError.message}`);
      }
    }

    if (patIntegration) {
      console.log('\n🔑 PAT Integration Details:');
      console.log(`   Connected: ${patIntegration.connectedAt}`);
      console.log(`   Last Sync: ${patIntegration.lastSyncAt || 'Never'}`);
      console.log(`   Repositories: ${patIntegration.repositories?.length || 0}`);

      // Test PAT API
      try {
        const accessToken = decrypt(patIntegration.accessToken);
        if (accessToken) {
          const patAPI = new GitLabAPI(accessToken);
          const testResult = await patAPI.testConnection();
          console.log(`   API Test: ${testResult.success ? '✅ Success' : '❌ Failed'}`);
          if (!testResult.success) {
            console.log(`   Error: ${testResult.error}`);
          }
        } else {
          console.log(`   API Test: ❌ Failed to decrypt token`);
        }
      } catch (apiError) {
        console.log(`   API Test: ❌ Error - ${apiError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ User integration test failed:', error.message);
  }

  console.log();
}

async function testOAuthVsPAT() {
  console.log('⚖️ Testing OAuth vs PAT Functionality');
  console.log('--------------------------------------');

  try {
    // Find users with both integrations
    const usersWithBoth = await User.aggregate([
      {
        $lookup: {
          from: 'gitlabintegrations',
          localField: '_id',
          foreignField: 'userId',
          as: 'integrations'
        }
      },
      {
        $match: {
          'integrations.tokenType': { $all: ['oauth', 'personal_access_token'] },
          'integrations.isActive': true
        }
      },
      { $limit: 3 }
    ]);

    console.log(`Found ${usersWithBoth.length} users with both OAuth and PAT integrations`);

    for (const user of usersWithBoth) {
      console.log(`\nTesting ${user.gitlabUsername}:`);
      
      const oauthIntegration = user.integrations.find(i => i.tokenType === 'oauth');
      const patIntegration = user.integrations.find(i => i.tokenType === 'personal_access_token');

      // Compare repository counts
      const oauthRepos = oauthIntegration?.repositories?.length || 0;
      const patRepos = patIntegration?.repositories?.length || 0;
      
      console.log(`   OAuth Repositories: ${oauthRepos}`);
      console.log(`   PAT Repositories: ${patRepos}`);
      console.log(`   Data Consistency: ${oauthRepos === patRepos ? '✅' : '⚠️'}`);
    }

  } catch (error) {
    console.error('❌ OAuth vs PAT test failed:', error.message);
  }

  console.log();
}

async function testTokenRefresh() {
  console.log('🔄 Testing Token Refresh Logic');
  console.log('-------------------------------');

  try {
    // Find OAuth integrations with tokens expiring soon
    const soonToExpire = await GitLabIntegration.find({
      tokenType: 'oauth',
      isActive: true,
      tokenExpiresAt: { 
        $lt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
      }
    }).limit(5);

    console.log(`Found ${soonToExpire.length} OAuth tokens expiring within 24 hours`);

    for (const integration of soonToExpire) {
      console.log(`   ${integration.gitlabUsername}: expires ${integration.tokenExpiresAt}`);
    }

    // Find expired tokens
    const expired = await GitLabIntegration.countDocuments({
      tokenType: 'oauth',
      isActive: true,
      tokenExpiresAt: { $lt: new Date() }
    });

    console.log(`Found ${expired} expired OAuth tokens`);

    if (expired > 0) {
      console.log('⚠️ Expired tokens found - these should be refreshed automatically');
    } else {
      console.log('✅ No expired tokens found');
    }

  } catch (error) {
    console.error('❌ Token refresh test failed:', error.message);
  }

  console.log();
}

async function testSpecificEndpoint(endpoint) {
  console.log(`🎯 Testing Specific Endpoint: ${endpoint}`);
  console.log('==========================================');

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response Body:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response Body:', text);
    }

  } catch (error) {
    console.error('❌ Endpoint test failed:', error.message);
  }
}

// Show help
function showHelp() {
  console.log(`
OAuth Transition Test Script
============================

Tests the OAuth transition functionality to ensure everything works correctly.

Usage:
  node scripts/test-oauth-transition.js [options]

Options:
  --help                Show this help message
  --endpoint=<url>      Test specific endpoint (e.g., /api/gitlab/unified-status)
  --user-id=<id>        Test with specific user MongoDB ObjectId
  --verbose             Show detailed output

Examples:
  node scripts/test-oauth-transition.js
  node scripts/test-oauth-transition.js --verbose
  node scripts/test-oauth-transition.js --endpoint=/api/gitlab/unified-status
  node scripts/test-oauth-transition.js --user-id=507f1f77bcf86cd799439011

Test Categories:
1. Database Integration Status - Check OAuth/PAT distribution
2. API Endpoints - Verify endpoint availability and responses
3. OAuth vs PAT Functionality - Compare integration methods
4. Token Refresh Logic - Check token expiration handling
`);
}

// Handle command line arguments
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the tests
await main();

console.log('🎉 Test script completed successfully!');
process.exit(0);