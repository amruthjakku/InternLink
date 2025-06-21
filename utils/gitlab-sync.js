import { GitLabAPI } from './gitlab-api.js';
import { decrypt, encrypt } from './encryption.js';
import GitLabIntegration from '../models/GitLabIntegration.js';
import ActivityTracking from '../models/ActivityTracking.js';

/**
 * GitLab Sync Service
 * Handles synchronization of GitLab data with our database
 */
export class GitLabSyncService {
  /**
   * Sync all activity for a specific user
   */
  static async syncUserActivity(userId) {
    try {
      console.log(`Starting GitLab sync for user: ${userId}`);
      
      const integration = await GitLabIntegration.findOne({ 
        userId, 
        isActive: true,
        tokenExpiresAt: { $gt: new Date() }
      });
      
      if (!integration) {
        console.log(`No active GitLab integration found for user: ${userId}`);
        return { success: false, error: 'No active integration' };
      }

      // Decrypt access token
      const accessToken = decrypt(integration.accessToken);
      if (!accessToken) {
        throw new Error('Failed to decrypt access token');
      }

      const gitlab = new GitLabAPI(accessToken);
      
      // Determine sync window (last sync or 30 days ago)
      const lastSync = integration.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sinceDate = lastSync.toISOString();
      
      console.log(`Syncing data since: ${sinceDate}`);

      // Sync commits
      const commits = await gitlab.getUserCommits(integration.gitlabEmail, sinceDate);
      console.log(`Found ${commits.length} commits`);
      
      // Sync issues
      const issues = await gitlab.getUserIssues(integration.gitlabUserId);
      console.log(`Found ${issues.length} issues`);
      
      // Sync merge requests
      const mergeRequests = await gitlab.getUserMergeRequests(integration.gitlabUserId);
      console.log(`Found ${mergeRequests.length} merge requests`);

      // Update activity tracking
      const syncResults = await this.updateActivityTracking(userId, {
        commits,
        issues,
        mergeRequests
      });

      // Update repositories list
      await this.updateRepositories(integration, commits);

      // Update last sync time
      await GitLabIntegration.updateOne(
        { userId },
        { 
          lastSyncAt: new Date(),
          lastSuccessfulSyncAt: new Date(),
          $unset: { syncErrors: 1 }
        }
      );

      console.log(`GitLab sync completed for user: ${userId}`);
      return { 
        success: true, 
        syncResults,
        totalActivities: commits.length + issues.length + mergeRequests.length
      };
      
    } catch (error) {
      console.error(`Error syncing GitLab activity for user ${userId}:`, error);
      
      // Log sync error
      await GitLabIntegration.updateOne(
        { userId },
        { 
          $push: { 
            syncErrors: { 
              error: error.message, 
              timestamp: new Date() 
            } 
          },
          lastSyncAt: new Date()
        }
      );

      return { success: false, error: error.message };
    }
  }

  /**
   * Update activity tracking with new data
   */
  static async updateActivityTracking(userId, data) {
    const { commits, issues, mergeRequests } = data;
    const results = {
      commits: { created: 0, updated: 0 },
      issues: { created: 0, updated: 0 },
      mergeRequests: { created: 0, updated: 0 }
    };

    // Process commits
    for (const commit of commits) {
      try {
        const result = await ActivityTracking.updateOne(
          { gitlabId: commit.id, type: 'commit' },
          {
            userId,
            type: 'commit',
            gitlabId: commit.id,
            projectId: commit.project_id,
            projectName: commit.project_name,
            projectUrl: commit.project_url,
            projectPath: commit.project_path,
            title: commit.title,
            description: commit.message,
            url: commit.web_url,
            activityCreatedAt: new Date(commit.created_at),
            metadata: {
              sha: commit.id,
              additions: commit.stats?.additions || 0,
              deletions: commit.stats?.deletions || 0,
              parentIds: commit.parent_ids || [],
              branch: commit.refs?.find(ref => ref.type === 'branch')?.name
            },
            syncedAt: new Date()
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          results.commits.created++;
        } else if (result.modifiedCount > 0) {
          results.commits.updated++;
        }
      } catch (error) {
        console.error(`Error processing commit ${commit.id}:`, error);
      }
    }

    // Process issues
    for (const issue of issues) {
      try {
        const result = await ActivityTracking.updateOne(
          { gitlabId: issue.id.toString(), type: 'issue' },
          {
            userId,
            type: 'issue',
            gitlabId: issue.id.toString(),
            projectId: issue.project_id,
            projectName: issue.project?.name || 'Unknown Project',
            projectUrl: issue.project?.web_url || '',
            projectPath: issue.project?.path_with_namespace || '',
            title: issue.title,
            description: issue.description || '',
            url: issue.web_url,
            activityCreatedAt: new Date(issue.created_at),
            activityUpdatedAt: new Date(issue.updated_at),
            metadata: {
              state: issue.state,
              labels: issue.labels || [],
              assignees: issue.assignees?.map(assignee => ({
                id: assignee.id,
                username: assignee.username,
                name: assignee.name
              })) || [],
              milestone: issue.milestone ? {
                id: issue.milestone.id,
                title: issue.milestone.title,
                description: issue.milestone.description
              } : null
            },
            syncedAt: new Date()
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          results.issues.created++;
        } else if (result.modifiedCount > 0) {
          results.issues.updated++;
        }
      } catch (error) {
        console.error(`Error processing issue ${issue.id}:`, error);
      }
    }

    // Process merge requests
    for (const mr of mergeRequests) {
      try {
        const result = await ActivityTracking.updateOne(
          { gitlabId: mr.id.toString(), type: 'merge_request' },
          {
            userId,
            type: 'merge_request',
            gitlabId: mr.id.toString(),
            projectId: mr.project_id,
            projectName: mr.project?.name || 'Unknown Project',
            projectUrl: mr.project?.web_url || '',
            projectPath: mr.project?.path_with_namespace || '',
            title: mr.title,
            description: mr.description || '',
            url: mr.web_url,
            activityCreatedAt: new Date(mr.created_at),
            activityUpdatedAt: new Date(mr.updated_at),
            metadata: {
              state: mr.state,
              sourceBranch: mr.source_branch,
              targetBranch: mr.target_branch,
              changesCount: mr.changes_count || 0,
              mergeStatus: mr.merge_status,
              labels: mr.labels || [],
              assignees: mr.assignees?.map(assignee => ({
                id: assignee.id,
                username: assignee.username,
                name: assignee.name
              })) || []
            },
            syncedAt: new Date()
          },
          { upsert: true }
        );
        
        if (result.upsertedCount > 0) {
          results.mergeRequests.created++;
        } else if (result.modifiedCount > 0) {
          results.mergeRequests.updated++;
        }
      } catch (error) {
        console.error(`Error processing merge request ${mr.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Update repositories list in integration
   */
  static async updateRepositories(integration, commits) {
    try {
      const projectsFromCommits = commits.reduce((acc, commit) => {
        if (!acc.find(p => p.projectId === commit.project_id)) {
          acc.push({
            projectId: commit.project_id,
            name: commit.project_name,
            nameWithNamespace: commit.project_path,
            url: commit.project_url,
            isTracked: true,
            addedAt: new Date(),
            lastSyncAt: new Date()
          });
        }
        return acc;
      }, []);

      // Add new repositories that aren't already tracked
      for (const project of projectsFromCommits) {
        const existingRepo = integration.repositories.find(
          repo => repo.projectId === project.projectId
        );
        
        if (!existingRepo) {
          integration.repositories.push(project);
        } else {
          // Update last sync time
          existingRepo.lastSyncAt = new Date();
        }
      }

      await integration.save();
    } catch (error) {
      console.error('Error updating repositories:', error);
    }
  }

  /**
   * Refresh expired OAuth token
   */
  static async refreshToken(integration) {
    try {
      const refreshToken = decrypt(integration.refreshToken);
      
      const response = await fetch('https://gitlab.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GITLAB_CLIENT_ID,
          client_secret: process.env.GITLAB_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const tokens = await response.json();
      
      // Update tokens in database
      await GitLabIntegration.updateOne(
        { _id: integration._id },
        {
          accessToken: encrypt(tokens.access_token),
          refreshToken: encrypt(tokens.refresh_token),
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000)
        }
      );

      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get user analytics from stored activity data
   */
  static async getUserAnalytics(userId, dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const matchConditions = { 
        userId,
        activityCreatedAt: { 
          $gte: startDate ? new Date(startDate) : thirtyDaysAgo,
          ...(endDate && { $lte: new Date(endDate) })
        }
      };

      // Get activity stats
      const stats = await ActivityTracking.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAdditions: { $sum: '$metadata.additions' },
            totalDeletions: { $sum: '$metadata.deletions' },
            projects: { $addToSet: '$projectName' },
            lastActivity: { $max: '$activityCreatedAt' }
          }
        }
      ]);

      // Get daily activity
      const dailyActivity = await ActivityTracking.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$activityCreatedAt' } },
              type: '$type'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      // Get project activity
      const projectActivity = await ActivityTracking.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: '$projectName',
            commits: { $sum: { $cond: [{ $eq: ['$type', 'commit'] }, 1, 0] } },
            issues: { $sum: { $cond: [{ $eq: ['$type', 'issue'] }, 1, 0] } },
            mergeRequests: { $sum: { $cond: [{ $eq: ['$type', 'merge_request'] }, 1, 0] } },
            totalAdditions: { $sum: '$metadata.additions' },
            totalDeletions: { $sum: '$metadata.deletions' },
            lastActivity: { $max: '$activityCreatedAt' }
          }
        },
        { $sort: { commits: -1 } }
      ]);

      return {
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            totalAdditions: stat.totalAdditions,
            totalDeletions: stat.totalDeletions,
            projects: stat.projects,
            lastActivity: stat.lastActivity
          };
          return acc;
        }, {}),
        dailyActivity,
        projectActivity,
        summary: {
          totalCommits: stats.find(s => s._id === 'commit')?.count || 0,
          totalIssues: stats.find(s => s._id === 'issue')?.count || 0,
          totalMergeRequests: stats.find(s => s._id === 'merge_request')?.count || 0,
          totalAdditions: stats.reduce((sum, s) => sum + (s.totalAdditions || 0), 0),
          totalDeletions: stats.reduce((sum, s) => sum + (s.totalDeletions || 0), 0),
          activeProjects: [...new Set(stats.flatMap(s => s.projects))].length
        }
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}

/**
 * Scheduled sync function for all active integrations
 */
export async function scheduledGitLabSync() {
  try {
    console.log('Starting scheduled GitLab sync...');
    
    const activeIntegrations = await GitLabIntegration.find({ 
      isActive: true,
      tokenExpiresAt: { $gt: new Date() }
    }).select('userId');

    console.log(`Found ${activeIntegrations.length} active integrations`);

    const results = [];
    for (const integration of activeIntegrations) {
      try {
        const result = await GitLabSyncService.syncUserActivity(integration.userId);
        results.push({ userId: integration.userId, ...result });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error syncing user ${integration.userId}:`, error);
        results.push({ 
          userId: integration.userId, 
          success: false, 
          error: error.message 
        });
      }
    }

    console.log('Scheduled GitLab sync completed');
    return results;
  } catch (error) {
    console.error('Error in scheduled GitLab sync:', error);
    throw error;
  }
}