import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import { GitLabAPI } from '../../../../utils/gitlab-api.js';
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
    let accessToken = decrypt(integration.accessToken);
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Failed to decrypt access token',
        details: 'The GitLab access token could not be decrypted'
      }, { status: 500 });
    }

    // Check if token is expired and try to refresh if needed
    const now = new Date();
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < now) {
      console.log('GitLab token has expired, attempting to refresh...');
      
      try {
        // Import the refresh function
        const { refreshGitLabToken } = await import('../../../../utils/gitlab-sync.js');
        
        // Try to refresh the token
        const newToken = await refreshGitLabToken(integration);
        if (newToken) {
          console.log('GitLab token refreshed successfully');
          accessToken = newToken;
        } else {
          console.error('Failed to refresh GitLab token');
          return NextResponse.json({ 
            error: 'GitLab token expired',
            details: 'The access token has expired and could not be refreshed'
          }, { status: 401 });
        }
      } catch (refreshError) {
        console.error('Error refreshing GitLab token:', refreshError);
        return NextResponse.json({ 
          error: 'Token refresh failed',
          details: refreshError.message
        }, { status: 401 });
      }
    }

    // Determine sync period - for initial sync, get all commits from past year
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

    // Get GitLab API base URL from integration or environment
    const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    console.log(`Using GitLab API base URL: ${apiBase}`);
    
    // Initialize GitLab API wrapper
    const gitlab = new GitLabAPI(accessToken, apiBase);
    
    // Test connection before proceeding
    const connectionTest = await gitlab.testConnection();
    if (!connectionTest.success) {
      console.error('GitLab connection test failed:', connectionTest.error);
      return NextResponse.json({ 
        error: 'GitLab connection failed', 
        details: connectionTest.error,
        apiBase
      }, { status: 500 });
    }
    
    console.log('GitLab connection test successful:', connectionTest.user.username);
    
    // Fetch commits from GitLab using the API wrapper
    const syncResults = await syncUserCommitsWithAPI(
      gitlab,
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
    
    // Log sync error in the integration record
    try {
      await GitLabIntegration.updateOne(
        { userId: session.user.id },
        { 
          $push: { 
            syncErrors: { 
              error: error.message, 
              timestamp: new Date(),
              stack: error.stack
            } 
          },
          lastSyncAt: new Date()
        }
      );
    } catch (logError) {
      console.error('Failed to log sync error:', logError);
    }
    
    // Prepare detailed error response
    const errorDetails = {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      url: error.url,
      status: error.status,
      responseData: error.responseData,
      apiBase: integration?.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4'
    };
    
    return NextResponse.json({ 
      error: 'Failed to sync GitLab commits',
      details: errorDetails
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
      
      console.log(`Fetching commits from: ${commitsUrl}`);
      
      const commitsResponse = await fetch(commitsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!commitsResponse.ok) {
        if (commitsResponse.status === 404) {
          // Project might not have a repository
          console.log(`Project ${project.name} (ID: ${project.id}) returned 404 - might not have a repository`);
          break;
        }
        
        // Try to get more detailed error information
        let errorText = '';
        try {
          errorText = await commitsResponse.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        throw new Error(`Failed to fetch commits: ${commitsResponse.status} - ${errorText}`);
      }

      const commits = await commitsResponse.json();
      
      // Check if we got a valid array response
      if (!Array.isArray(commits)) {
        console.error(`Invalid response format for project ${project.name} - expected array but got:`, 
          typeof commits, commits && typeof commits === 'object' ? Object.keys(commits) : '');
        results.errors.push(`Project ${project.name}: Invalid response format`);
        break;
      }
      
      if (commits.length === 0) {
        console.log(`No commits found for project ${project.name} on page ${page}`);
        break;
      }

      console.log(`Found ${commits.length} commits for project ${project.name} on page ${page}`);

      // Process each commit - filter by user's GitLab username, name, or email
      let userCommitsInProject = 0;
      for (const commit of commits) {
        try {
          // Get GitLab integration for current user to access email
          const integration = await GitLabIntegration.findOne({ userId });
          if (!integration) {
            console.warn(`Integration not found for user ${userId} while processing commits`);
            continue;
          }
          
          // Check if this commit belongs to the user - more flexible matching
          const authorNameLower = (commit.author_name || '').toLowerCase();
          const usernameLower = username.toLowerCase();
          const gitlabEmail = integration.gitlabEmail || '';
          
          const isUserCommit = 
            authorNameLower === usernameLower ||
            commit.author_email === gitlabEmail ||
            commit.committer_name?.toLowerCase() === usernameLower ||
            commit.committer_email === gitlabEmail ||
            authorNameLower.includes(usernameLower) ||
            (usernameLower.includes(' ') && authorNameLower.includes(usernameLower.split(' ')[0]));
          
          if (isUserCommit) {
            await processCommit(commit, project, userId, results);
            userCommitsInProject++;
          } else {
            // Log first few non-matching commits for debugging
            if (page === 1 && commits.indexOf(commit) < 3) {
              console.log(`Sample non-matching commit: "${commit.title}" by ${commit.author_name} (${commit.author_email}) - looking for user ${username} (${gitlabEmail})`);
            }
          }
        } catch (commitError) {
          console.error(`Error processing commit ${commit.id}:`, commitError);
          results.errors.push(`Commit ${commit.short_id || commit.id}: ${commitError.message}`);
        }
      }
      
      console.log(`Found ${userCommitsInProject} commits for user ${username} in project ${project.name} (page ${page})`);
      
      // If no user commits found on first page, log some sample commits for debugging
      if (page === 1 && userCommitsInProject === 0 && commits.length > 0) {
        const integration = await GitLabIntegration.findOne({ userId });
        const gitlabEmail = integration?.gitlabEmail || 'unknown';
        
        console.log(`DEBUG: No matching commits found for user ${username}. Sample commits in project ${project.name}:`);
        commits.slice(0, 3).forEach(commit => {
          console.log(`  - "${commit.title}" by ${commit.author_name} (${commit.author_email}) on ${commit.created_at}`);
        });
        console.log(`Looking for matches with: username="${username}", email="${gitlabEmail}"`);
      }

      results.commitsProcessed += commits.length;
      page++;

      // If we got fewer commits than requested, we've reached the end
      if (commits.length < perPage) break;

    } catch (pageError) {
      console.error(`Error fetching page ${page} for project ${project.name}:`, pageError);
      results.errors.push(`Project ${project.name} (page ${page}): ${pageError.message}`);
      break;
    }
  }
}

/**
 * Sync commits using the GitLab API wrapper
 */
async function syncUserCommitsWithAPI(gitlab, username, userId, sinceDate, integration) {
  const results = {
    commitsProcessed: 0,
    newCommits: 0,
    updatedCommits: 0,
    projectsScanned: 0,
    errors: []
  };

  try {
    console.log(`Starting GitLab sync for user ${username} using API wrapper`);
    
    // Get user's projects
    const projects = await gitlab.getUserProjects({ perPage: 100 });
    results.projectsScanned = projects.length;
    
    console.log(`Found ${projects.length} projects for user ${username}`);
    
    // Get user's commit activity
    console.log(`Fetching commit activity since ${sinceDate.toISOString()}`);
    const commitActivity = await gitlab.getUserCommitActivity({
      since: sinceDate.toISOString()
    });
    
    if (!commitActivity || !commitActivity.commits) {
      console.error('Invalid commit activity response:', commitActivity);
      results.errors.push('Invalid commit activity response from GitLab API');
      return results;
    }
    
    console.log(`Found ${commitActivity.commits.length} commits across ${commitActivity.activeProjects} projects`);
    
    // Process each commit
    for (const commit of commitActivity.commits) {
      try {
        await processCommitFromActivity(commit, userId, results);
        results.commitsProcessed++;
      } catch (error) {
        console.error(`Error processing commit ${commit.id}:`, error);
        results.errors.push(`Commit ${commit.id}: ${error.message}`);
      }
    }
    
    // Update repositories in integration
    await updateRepositoriesFromActivity(integration, commitActivity);
    
    return results;
  } catch (error) {
    console.error('Error in syncUserCommitsWithAPI:', error);
    results.errors.push(error.message);
    return results;
  }
}

/**
 * Process a commit from the activity data
 */
async function processCommitFromActivity(commit, userId, results) {
  // Defensive: ensure all required fields are present and valid
  const safeTitle = commit.title || 'No title';
  const safeProject = commit.project || {};
  const safeProjectId = safeProject.id || 0;
  const safeProjectName = safeProject.name || 'Unknown Project';
  const safeProjectPath = safeProject.path || '';
  const safeProjectUrl = safeProject.url || '';
  const safeGitlabId = commit.id || commit.sha || '';
  const safeCreatedAt = commit.created_at ? new Date(commit.created_at) : new Date();

  // Defensive: clean metadata
  const metadata = {
    sha: commit.id,
    shortId: commit.short_id,
    authorName: commit.author_name,
    authorEmail: commit.author_email,
    committerName: commit.committer_name,
    committerEmail: commit.committer_email,
    webUrl: commit.web_url,
    projectUrl: commit.project?.url,
    projectVisibility: commit.project?.visibility,
    additions: commit.stats?.additions || 0,
    deletions: commit.stats?.deletions || 0,
    total: commit.stats?.total || 0,
    parentIds: commit.parent_ids || []
  };
  // Remove undefined/null fields from metadata
  Object.keys(metadata).forEach(key => {
    if (metadata[key] === undefined) delete metadata[key];
  });

  const activityData = {
    userId: userId,
    type: 'commit',
    gitlabId: safeGitlabId,
    projectId: safeProjectId,
    projectName: safeProjectName,
    projectPath: safeProjectPath,
    projectUrl: safeProjectUrl,
    title: safeTitle,
    message: commit.message || '',
    url: commit.web_url,
    metadata,
    activityCreatedAt: safeCreatedAt,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const existingActivity = await ActivityTracking.findOne({
      userId: userId,
      type: 'commit',
      gitlabId: safeGitlabId
    });

    if (existingActivity) {
      await ActivityTracking.findByIdAndUpdate(existingActivity._id, {
        ...activityData,
        updatedAt: new Date()
      });
      results.updatedCommits++;
    } else {
      await ActivityTracking.create(activityData);
      results.newCommits++;
    }
  } catch (err) {
    console.error('Error storing commit:', err, '\nCommit data:', JSON.stringify(activityData, null, 2));
    results.errors.push(`Commit ${safeGitlabId}: ${err.message}`);
  }
}

/**
 * Update repositories from activity data
 */
async function updateRepositoriesFromActivity(integration, commitActivity) {
  try {
    const { projects, commits } = commitActivity;
    
    // Get unique projects from commits
    const activeProjectIds = [...new Set(commits.map(c => c.project.id))];
    
    // Update existing repositories
    for (const project of projects) {
      const existingRepo = integration.repositories.find(r => r.projectId === project.id);
      const isActive = activeProjectIds.includes(project.id);
      
      if (existingRepo) {
        // Update existing repository
        existingRepo.name = project.name;
        existingRepo.fullName = project.path_with_namespace;
        existingRepo.nameWithNamespace = project.path_with_namespace;
        existingRepo.url = project.web_url;
        existingRepo.description = project.description;
        existingRepo.visibility = project.visibility;
        existingRepo.lastActivity = new Date(project.last_activity_at);
        existingRepo.lastSyncAt = new Date();
        
        // If this project has commits, mark it as tracked
        if (isActive) {
          existingRepo.isTracked = true;
        }
      } else {
        // Add new repository
        integration.repositories.push({
          projectId: project.id,
          name: project.name,
          fullName: project.path_with_namespace,
          nameWithNamespace: project.path_with_namespace,
          url: project.web_url,
          description: project.description,
          visibility: project.visibility,
          isTracked: isActive,
          lastActivity: new Date(project.last_activity_at),
          addedAt: new Date(),
          lastSyncAt: new Date()
        });
      }
    }
    
    await integration.save();
    console.log(`Updated ${integration.repositories.length} repositories for user ${integration.gitlabUsername}`);
  } catch (error) {
    console.error('Error updating repositories:', error);
  }
}

/**
 * Process and store a single commit
 */
async function processCommit(commit, project, userId, results) {
  // Defensive: ensure all required fields are present and valid
  const safeTitle = commit.title || 'No title';
  const safeProjectId = project.id || 0;
  const safeProjectName = project.name || 'Unknown Project';
  const safeProjectPath = project.path_with_namespace || '';
  const safeProjectUrl = project.web_url || '';
  const safeGitlabId = commit.id || commit.sha || '';
  const safeCreatedAt = commit.created_at ? new Date(commit.created_at) : new Date();

  // Defensive: clean metadata
  const metadata = {
    shortId: commit.short_id,
    authorName: commit.author_name,
    authorEmail: commit.author_email,
    committerName: commit.committer_name,
    committerEmail: commit.committer_email,
    webUrl: commit.web_url,
    projectUrl: project.web_url,
    projectVisibility: project.visibility,
    stats: commit.stats || { additions: 0, deletions: 0, total: 0 }
  };
  // Remove undefined/null fields from metadata
  Object.keys(metadata).forEach(key => {
    if (metadata[key] === undefined) delete metadata[key];
  });

  const activityData = {
    userId: userId,
    type: 'commit',
    gitlabId: safeGitlabId,
    projectId: safeProjectId,
    projectName: safeProjectName,
    title: safeTitle,
    message: commit.message || '',
    metadata,
    activityCreatedAt: safeCreatedAt,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  try {
    const existingActivity = await ActivityTracking.findOne({
      userId: userId,
      type: 'commit',
      gitlabId: safeGitlabId
    });

    if (existingActivity) {
      await ActivityTracking.findByIdAndUpdate(existingActivity._id, {
        ...activityData,
        updatedAt: new Date()
      });
      results.updatedCommits++;
    } else {
      await ActivityTracking.create(activityData);
      results.newCommits++;
    }
  } catch (err) {
    console.error('Error storing commit:', err, '\nCommit data:', JSON.stringify(activityData, null, 2));
    results.errors.push(`Commit ${safeGitlabId}: ${err.message}`);
  }
}