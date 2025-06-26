#!/usr/bin/env node

/**
 * Migration Script: PAT to OAuth Transition
 * 
 * This script helps migrate users from Personal Access Token (PAT) based
 * GitLab integration to OAuth-based integration.
 * 
 * Usage:
 *   node scripts/migrate-to-oauth.js [options]
 * 
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --user-id    Migrate specific user by ID
 *   --all        Migrate all PAT users to OAuth (when they next login)
 */

import { connectToDatabase } from '../utils/database.js';
import GitLabIntegration from '../models/GitLabIntegration.js';
import User from '../models/User.js';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const userId = args.find(arg => arg.startsWith('--user-id='))?.split('=')[1];
const migrateAll = args.includes('--all');

async function main() {
  try {
    console.log('🚀 Starting PAT to OAuth Migration Script');
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('=====================================\n');

    await connectToDatabase();

    if (userId) {
      await migrateSingleUser(userId);
    } else if (migrateAll) {
      await migrateAllUsers();
    } else {
      await showMigrationStatus();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function showMigrationStatus() {
  console.log('📊 Current Integration Status:');
  console.log('==============================\n');

  // Count integrations by type
  const oauthCount = await GitLabIntegration.countDocuments({ 
    tokenType: 'oauth', 
    isActive: true 
  });
  
  const patCount = await GitLabIntegration.countDocuments({ 
    tokenType: 'personal_access_token', 
    isActive: true 
  });

  const totalUsers = await User.countDocuments({ isActive: true });

  console.log(`Total Active Users: ${totalUsers}`);
  console.log(`OAuth Integrations: ${oauthCount} ✅`);
  console.log(`PAT Integrations: ${patCount} ⚠️`);
  console.log(`No Integration: ${totalUsers - oauthCount - patCount} ❌\n`);

  if (patCount > 0) {
    console.log('🔄 Users with PAT Integration (candidates for migration):');
    console.log('========================================================');

    const patIntegrations = await GitLabIntegration.find({ 
      tokenType: 'personal_access_token', 
      isActive: true 
    }).populate('userId', 'gitlabUsername name email role');

    patIntegrations.forEach((integration, index) => {
      console.log(`${index + 1}. ${integration.userId.name} (@${integration.userId.gitlabUsername})`);
      console.log(`   Role: ${integration.userId.role}`);
      console.log(`   Connected: ${integration.connectedAt.toISOString().split('T')[0]}`);
      console.log(`   Last Sync: ${integration.lastSyncAt ? integration.lastSyncAt.toISOString().split('T')[0] : 'Never'}`);
      console.log(`   Repositories: ${integration.repositories?.length || 0}\n`);
    });

    console.log('\n💡 Migration Options:');
    console.log('=====================');
    console.log('1. Run with --all to prepare all PAT users for OAuth migration');
    console.log('2. Run with --user-id=<id> to migrate a specific user');
    console.log('3. Users will be automatically migrated to OAuth when they next login');
    console.log('\nNote: PAT integrations will remain as fallback until OAuth is established.');
  } else {
    console.log('✅ All users are already using OAuth or have no integration.');
  }
}

async function migrateSingleUser(userId) {
  console.log(`🔄 Migrating user: ${userId}`);
  console.log('==========================\n');

  const user = await User.findById(userId);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const integration = await GitLabIntegration.findOne({ 
    userId, 
    tokenType: 'personal_access_token',
    isActive: true 
  });

  if (!integration) {
    console.log(`❌ No PAT integration found for user: ${user.gitlabUsername}`);
    return;
  }

  console.log(`User: ${user.name} (@${user.gitlabUsername})`);
  console.log(`Current Integration: PAT`);
  console.log(`Repositories: ${integration.repositories?.length || 0}`);
  console.log(`Last Sync: ${integration.lastSyncAt ? integration.lastSyncAt.toISOString() : 'Never'}\n`);

  if (!isDryRun) {
    // Mark integration for OAuth migration
    await GitLabIntegration.updateOne(
      { _id: integration._id },
      { 
        $set: { 
          migrationStatus: 'pending_oauth',
          migrationRequestedAt: new Date()
        }
      }
    );

    console.log('✅ User marked for OAuth migration');
    console.log('   They will be prompted to connect via OAuth on next login');
  } else {
    console.log('🔍 DRY RUN: Would mark user for OAuth migration');
  }
}

async function migrateAllUsers() {
  console.log('🔄 Preparing All PAT Users for OAuth Migration');
  console.log('==============================================\n');

  const patIntegrations = await GitLabIntegration.find({ 
    tokenType: 'personal_access_token', 
    isActive: true 
  }).populate('userId', 'gitlabUsername name');

  console.log(`Found ${patIntegrations.length} PAT integrations to migrate\n`);

  if (patIntegrations.length === 0) {
    console.log('✅ No PAT integrations found. All users are already using OAuth.');
    return;
  }

  for (let i = 0; i < patIntegrations.length; i++) {
    const integration = patIntegrations[i];
    const user = integration.userId;

    console.log(`${i + 1}/${patIntegrations.length}: ${user.name} (@${user.gitlabUsername})`);

    if (!isDryRun) {
      await GitLabIntegration.updateOne(
        { _id: integration._id },
        { 
          $set: { 
            migrationStatus: 'pending_oauth',
            migrationRequestedAt: new Date()
          }
        }
      );
      console.log('   ✅ Marked for OAuth migration');
    } else {
      console.log('   🔍 DRY RUN: Would mark for OAuth migration');
    }
  }

  console.log(`\n✅ Migration preparation complete!`);
  console.log(`${patIntegrations.length} users will be prompted for OAuth on next login`);
  console.log('\n📝 Next Steps:');
  console.log('==============');
  console.log('1. Users will see OAuth upgrade prompt when they login');
  console.log('2. After OAuth connection, PAT integration becomes backup');
  console.log('3. Monitor migration progress in admin dashboard');
  console.log('4. PAT integrations can be cleaned up after successful OAuth migration');
}

// Add migration status field to schema if it doesn't exist
async function ensureMigrationFields() {
  try {
    await GitLabIntegration.updateMany(
      { migrationStatus: { $exists: false } },
      { $set: { migrationStatus: 'none' } }
    );
  } catch (error) {
    console.warn('Warning: Could not add migration status fields:', error.message);
  }
}

// Show help
function showHelp() {
  console.log(`
GitLab PAT to OAuth Migration Script
====================================

This script helps transition users from Personal Access Token (PAT) based
GitLab integration to OAuth-based integration.

Usage:
  node scripts/migrate-to-oauth.js [options]

Options:
  --help              Show this help message
  --dry-run           Show what would be migrated without making changes
  --user-id=<id>      Migrate specific user by MongoDB ObjectId
  --all               Prepare all PAT users for OAuth migration

Examples:
  node scripts/migrate-to-oauth.js
  node scripts/migrate-to-oauth.js --dry-run --all
  node scripts/migrate-to-oauth.js --user-id=507f1f77bcf86cd799439011

Migration Process:
1. Script marks PAT users for OAuth migration
2. Users see OAuth upgrade prompt on next login
3. OAuth integration is created alongside existing PAT
4. System prioritizes OAuth over PAT for API calls
5. PAT remains as fallback until manual cleanup

Security Benefits of OAuth:
- Automatic token refresh (no manual token management)
- Scoped permissions (only necessary access)
- Revocable access (can be revoked from GitLab)
- Better user experience (no manual token creation)
`);
}

// Handle command line arguments
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the migration
await ensureMigrationFields();
await main();

console.log('\n🎉 Migration script completed successfully!');
process.exit(0);