import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/sync-commits
 * Manually sync GitLab commits and update activity tracking
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get GitLab integration
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id,
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab not connected' 
      }, { status: 400 });
    }

    // Decrypt access token
    const accessToken = decrypt(integration.accessToken);

    // Determine sync period (sync last 30 days or since last sync)
    const now = new Date();
    let sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30); // Default to 30 days

    if (integration.lastSyncAt) {
      const lastSync = new Date(integration.lastSyncAt);
      // If last sync was less than 30 days ago, sync from then
      if (now - lastSync < 30 * 24 * 60 * 60 * 1000) {
        sinceDate = lastSync;
      }
    }

    console.log(`Syncing GitLab data for ${integration.gitlabUsername} since ${sinceDate.toISOString()}`);

    // Fetch commits from GitLab
    const syncResults = await syncUserCommits(
      accessToken, 
      integration.gitlabUsername, 
      integration.userId,
      sinceDate
    );

    // Update last sync time
    integration.lastSyncAt = now;
    await integration.save();

    return NextResponse.json({
      success: true,
      message: 'GitLab commits synced successfully',
      syncResults: {
        commitsProcessed: syncResults.commitsProcessed,
        newCommits: syncResults.newCommits,
        updatedCommits: syncResults.updatedCommits,
        projectsScanned: syncResults.projectsScanned,
        syncPeriod: {
          from: sinceDate.toISOString(),
          to: now.toISOString()
        }
      },
      lastSyncAt: now
    });

  } catch (error) {
    console.error('Error syncing GitLab commits:', error);
    return NextResponse.json({ 
      error: 'Failed to sync GitLab commits',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Sync commits for a user and store in ActivityTracking
 */
async function syncUserCommits(accessToken, username, userId, sinceDate) {
  const results = {
    commitsProcessed: 0,
    newCommits: 0,
    updatedCommits: 0,
    projectsScanned: 0,
    errors: []
  };

  try {
    // Fetch user's projects
    const projectsResponse = await fetch(
      'https://gitlab.com/api/v4/projects?membership=true&per_page=100',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projects = await projectsResponse.json();
    results.projectsScanned = projects.length;

    // Process each project
    for (const project of projects) {
      try {
        await syncProjectCommits(accessToken, project, username, userId, sinceDate, results);
      } catch (projectError) {
        console.error(`Error syncing project ${project.name}:`, projectError);
        results.errors.push(`Project ${project.name}: ${projectError.message}`);
      }
    }

  } catch (error) {
    console.error('Error in syncUserCommits:', error);
    results.errors.push(error.message);
  }

  return results;
}

/**
 * Sync commits for a specific project
 */
async function syncProjectCommits(accessToken, project, username, userId, sinceDate, results) {
  let page = 1;
  const perPage = 100;

  while (page <= 5) { // Limit to 5 pages per project
    try {
      const commitsResponse = await fetch(
        `https://gitlab.com/api/v4/projects/${project.id}/repository/commits?author=${username}&since=${sinceDate.toISOString()}&per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!commitsResponse.ok) {
        if (commitsResponse.status === 404) {
          // Project might not have a repository
          break;
        }
        throw new Error(`Failed to fetch commits: ${commitsResponse.status}`);
      }

      const commits = await commitsResponse.json();
      if (commits.length === 0) break;

      // Process each commit
      for (const commit of commits) {
        try {
          await processCommit(commit, project, userId, results);
        } catch (commitError) {
          console.error(`Error processing commit ${commit.id}:`, commitError);
          results.errors.push(`Commit ${commit.short_id}: ${commitError.message}`);
        }
      }

      results.commitsProcessed += commits.length;
      page++;

      // If we got fewer commits than requested, we've reached the end
      if (commits.length < perPage) break;

    } catch (pageError) {
      console.error(`Error fetching page ${page} for project ${project.name}:`, pageError);
      break;
    }
  }
}

/**
 * Process and store a single commit
 */
async function processCommit(commit, project, userId, results) {
  const activityData = {
    userId: userId,
    type: 'commit',
    gitlabId: commit.id,
    projectId: project.id,
    projectName: project.name,
    title: commit.title,
    message: commit.message,
    metadata: {
      shortId: commit.short_id,
      authorName: commit.author_name,
      authorEmail: commit.author_email,
      committerName: commit.committer_name,
      committerEmail: commit.committer_email,
      webUrl: commit.web_url,
      projectUrl: project.web_url,
      projectVisibility: project.visibility,
      stats: commit.stats || { additions: 0, deletions: 0, total: 0 }
    },
    activityCreatedAt: new Date(commit.created_at),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Check if this commit already exists
  const existingActivity = await ActivityTracking.findOne({
    userId: userId,
    type: 'commit',
    gitlabId: commit.id
  });

  if (existingActivity) {
    // Update existing record
    await ActivityTracking.findByIdAndUpdate(existingActivity._id, {
      ...activityData,
      updatedAt: new Date()
    });
    results.updatedCommits++;
  } else {
    // Create new record
    await ActivityTracking.create(activityData);
    results.newCommits++;
  }
}