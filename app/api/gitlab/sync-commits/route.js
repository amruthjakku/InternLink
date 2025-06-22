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

    // Determine sync period - for initial sync, get all commits from past year
    const now = new Date();
    let sinceDate = new Date();
    
    // Get query parameter for custom date range
    const url = new URL(request.url);
    const customDays = parseInt(url.searchParams.get('days')) || null;
    const fullSync = url.searchParams.get('fullSync') === 'true';
    
    if (fullSync || !integration.lastSyncAt) {
      // Full sync: get commits from past year for initial sync
      sinceDate.setDate(sinceDate.getDate() - 365);
      console.log('Performing FULL SYNC - fetching commits from past year');
    } else if (customDays) {
      // Custom date range
      sinceDate.setDate(sinceDate.getDate() - customDays);
      console.log(`Performing custom sync - fetching commits from past ${customDays} days`);
    } else if (integration.lastSyncAt) {
      const lastSync = new Date(integration.lastSyncAt);
      // If last sync was less than 30 days ago, sync from then, otherwise 30 days
      if (now - lastSync < 30 * 24 * 60 * 60 * 1000) {
        sinceDate = lastSync;
      } else {
        sinceDate.setDate(sinceDate.getDate() - 30);
      }
      console.log('Performing incremental sync since last sync');
    } else {
      // Default to 90 days for better coverage
      sinceDate.setDate(sinceDate.getDate() - 90);
      console.log('Performing default sync - fetching commits from past 90 days');
    }

    console.log(`Syncing GitLab data for ${integration.gitlabUsername} since ${sinceDate.toISOString()}`);
    console.log(`Using GitLab API base: ${integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4'}`);

    // Fetch commits from GitLab
    const syncResults = await syncUserCommits(
      accessToken, 
      integration.gitlabUsername, 
      integration.userId,
      sinceDate,
      integration
    );

    console.log(`Sync completed for ${integration.gitlabUsername}:`, {
      commitsProcessed: syncResults.commitsProcessed,
      newCommits: syncResults.newCommits,
      projectsScanned: syncResults.projectsScanned,
      errors: syncResults.errors?.length || 0
    });

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
async function syncUserCommits(accessToken, username, userId, sinceDate, integration) {
  const results = {
    commitsProcessed: 0,
    newCommits: 0,
    updatedCommits: 0,
    projectsScanned: 0,
    errors: []
  };

  try {
    // Get GitLab API base URL from integration or environment
    const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    
    // Fetch user's projects
    const projectsResponse = await fetch(
      `${apiBase}/projects?membership=true&per_page=100`,
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
    
    console.log(`Found ${projects.length} projects for user ${username}`);
    if (projects.length > 0) {
      console.log(`Sample projects:`, projects.slice(0, 3).map(p => ({ id: p.id, name: p.name, path: p.path_with_namespace })));
    }

    // Process each project
    for (const project of projects) {
      try {
        console.log(`Processing project: ${project.name} (ID: ${project.id})`);
        await syncProjectCommits(accessToken, project, username, userId, sinceDate, results, apiBase);
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
async function syncProjectCommits(accessToken, project, username, userId, sinceDate, results, apiBase) {
  let page = 1;
  const perPage = 100;

  while (page <= 5) { // Limit to 5 pages per project
    try {
      // First try with author filter, then without if no results
      let commitsUrl = `${apiBase}/projects/${project.id}/repository/commits?since=${sinceDate.toISOString()}&per_page=${perPage}&page=${page}`;
      
      const commitsResponse = await fetch(commitsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!commitsResponse.ok) {
        if (commitsResponse.status === 404) {
          // Project might not have a repository
          break;
        }
        throw new Error(`Failed to fetch commits: ${commitsResponse.status}`);
      }

      const commits = await commitsResponse.json();
      if (commits.length === 0) {
        console.log(`No commits found for project ${project.name} on page ${page}`);
        break;
      }

      console.log(`Found ${commits.length} commits for project ${project.name} on page ${page}`);

      // Process each commit - filter by user's GitLab username, name, or email
      let userCommitsInProject = 0;
      for (const commit of commits) {
        try {
          // Check if this commit belongs to the user
          const isUserCommit = 
            commit.author_name === username ||
            commit.author_email === integration.gitlabEmail ||
            commit.committer_name === username ||
            commit.committer_email === integration.gitlabEmail ||
            (commit.author_name && commit.author_name.toLowerCase().includes(username.toLowerCase()));
          
          if (isUserCommit) {
            await processCommit(commit, project, userId, results);
            userCommitsInProject++;
          } else {
            // Log first few non-matching commits for debugging
            if (page === 1 && commits.indexOf(commit) < 3) {
              console.log(`Sample non-matching commit: "${commit.title}" by ${commit.author_name} (${commit.author_email}) - looking for user ${username} (${integration.gitlabEmail})`);
            }
          }
        } catch (commitError) {
          console.error(`Error processing commit ${commit.id}:`, commitError);
          results.errors.push(`Commit ${commit.short_id}: ${commitError.message}`);
        }
      }
      
      console.log(`Found ${userCommitsInProject} commits for user ${username} in project ${project.name} (page ${page})`);
      
      // If no user commits found on first page, log some sample commits for debugging
      if (page === 1 && userCommitsInProject === 0 && commits.length > 0) {
        console.log(`DEBUG: No matching commits found for user ${username}. Sample commits in project ${project.name}:`);
        commits.slice(0, 3).forEach(commit => {
          console.log(`  - "${commit.title}" by ${commit.author_name} (${commit.author_email}) on ${commit.created_at}`);
        });
        console.log(`Looking for matches with: username="${username}", email="${integration.gitlabEmail}"`);
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