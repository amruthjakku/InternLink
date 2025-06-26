import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt, encrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/sync-v2
 * Improved GitLab sync endpoint with better error handling
 */
export async function POST(request) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Connect to database
    await connectToDatabase();

    // 3. Get GitLab integration
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id,
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab not connected',
        message: 'No active GitLab integration found for this user'
      }, { status: 400 });
    }

    // 4. Decrypt access token
    let accessToken = decrypt(integration.accessToken);
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Token decryption failed',
        message: 'Failed to decrypt the GitLab access token'
      }, { status: 500 });
    }

    // 5. Check if token is expired and refresh if needed
    const now = new Date();
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < now) {
      console.log('GitLab token has expired, attempting to refresh...');
      
      try {
        const refreshToken = decrypt(integration.refreshToken);
        if (!refreshToken) {
          return NextResponse.json({ 
            error: 'Refresh token invalid',
            message: 'The refresh token could not be decrypted'
          }, { status: 401 });
        }
        
        // Get GitLab instance URL
        const gitlabInstance = integration.gitlabInstance || 'https://code.swecha.org';
        const tokenUrl = `${gitlabInstance}/oauth/token`;
        
        // Make refresh token request
        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: process.env.GITLAB_CLIENT_ID,
            client_secret: process.env.GITLAB_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            redirect_uri: process.env.GITLAB_REDIRECT_URI
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json({ 
            error: 'Token refresh failed',
            message: `Failed to refresh token: ${response.status} - ${errorText}`
          }, { status: 401 });
        }

        const tokens = await response.json();
        
        if (!tokens.access_token) {
          return NextResponse.json({ 
            error: 'Token refresh invalid',
            message: 'No access token in refresh response'
          }, { status: 401 });
        }
        
        // Update tokens in database
        await GitLabIntegration.updateOne(
          { _id: integration._id },
          {
            accessToken: encrypt(tokens.access_token),
            refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : integration.refreshToken,
            tokenExpiresAt: new Date(Date.now() + (tokens.expires_in || 7200) * 1000),
            updatedAt: new Date()
          }
        );
        
        accessToken = tokens.access_token;
        console.log('Token refreshed successfully');
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
        return NextResponse.json({ 
          error: 'Token refresh error',
          message: refreshError.message
        }, { status: 401 });
      }
    }

    // 6. Determine sync period
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

    // 7. Get GitLab API base URL
    const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    console.log(`Using GitLab API base URL: ${apiBase}`);

    // 8. Test connection to GitLab API
    try {
      const userResponse = await fetch(`${apiBase}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        return NextResponse.json({ 
          error: 'GitLab API connection failed',
          message: `Failed to connect to GitLab API: ${userResponse.status} - ${errorText}`,
          apiBase
        }, { status: 500 });
      }
      
      const user = await userResponse.json();
      console.log(`Connected to GitLab API as ${user.username}`);
    } catch (connectionError) {
      console.error('Error connecting to GitLab API:', connectionError);
      return NextResponse.json({ 
        error: 'GitLab API connection error',
        message: connectionError.message,
        apiBase
      }, { status: 500 });
    }

    // 9. Fetch user's projects
    let projects = [];
    try {
      const projectsResponse = await fetch(
        `${apiBase}/projects?membership=true&per_page=100&order_by=last_activity_at&sort=desc`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!projectsResponse.ok) {
        const errorText = await projectsResponse.text();
        return NextResponse.json({ 
          error: 'Failed to fetch projects',
          message: `GitLab API error: ${projectsResponse.status} - ${errorText}`
        }, { status: 500 });
      }
      
      projects = await projectsResponse.json();
      
      if (!Array.isArray(projects)) {
        return NextResponse.json({ 
          error: 'Invalid projects response',
          message: 'GitLab API did not return an array of projects'
        }, { status: 500 });
      }
      
      console.log(`Found ${projects.length} projects for user`);
    } catch (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return NextResponse.json({ 
        error: 'Projects fetch error',
        message: projectsError.message
      }, { status: 500 });
    }

    // 10. Process projects (limit to 50 to avoid timeouts)
    const projectsToProcess = projects.slice(0, 50);
    console.log(`Processing ${projectsToProcess.length} projects`);
    
    const results = {
      commitsProcessed: 0,
      newCommits: 0,
      updatedCommits: 0,
      projectsScanned: projectsToProcess.length,
      errors: []
    };
    
    // 11. Process each project
    for (const project of projectsToProcess) {
      try {
        console.log(`Processing project: ${project.name} (ID: ${project.id})`);
        
        // Fetch commits for this project
        const commitsResponse = await fetch(
          `${apiBase}/projects/${project.id}/repository/commits?since=${sinceDate.toISOString()}&per_page=100`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!commitsResponse.ok) {
          if (commitsResponse.status === 404) {
            console.log(`Project ${project.name} returned 404 - might not have a repository`);
            continue;
          }
          
          const errorText = await commitsResponse.text();
          console.error(`Error fetching commits for project ${project.name}: ${commitsResponse.status} - ${errorText}`);
          results.errors.push(`Project ${project.name}: ${commitsResponse.status} - ${errorText}`);
          continue;
        }
        
        const commits = await commitsResponse.json();
        
        if (!Array.isArray(commits)) {
          console.error(`Invalid commits response for project ${project.name}`);
          results.errors.push(`Project ${project.name}: Invalid commits response`);
          continue;
        }
        
        console.log(`Found ${commits.length} commits in project ${project.name}`);
        results.commitsProcessed += commits.length;
        
        // Filter commits by user
        const userCommits = commits.filter(commit => {
          const authorName = (commit.author_name || '').toLowerCase();
          const authorEmail = (commit.author_email || '').toLowerCase();
          const username = (integration.gitlabUsername || '').toLowerCase();
          const email = (integration.gitlabEmail || '').toLowerCase();
          
          return authorName.includes(username) || 
                 authorEmail === email ||
                 (commit.committer_name && commit.committer_name.toLowerCase().includes(username)) ||
                 (commit.committer_email && commit.committer_email === email);
        });
        
        console.log(`Found ${userCommits.length} commits by user in project ${project.name}`);
        
        // Process each commit
        for (const commit of userCommits) {
          try {
            // Prepare activity data
            const activityData = {
              userId: session.user.id,
              type: 'commit',
              gitlabId: commit.id,
              projectId: project.id,
              projectName: project.name,
              projectPath: project.path_with_namespace,
              projectUrl: project.web_url,
              title: commit.title || 'No title',
              message: commit.message || '',
              url: commit.web_url,
              metadata: {
                sha: commit.id,
                shortId: commit.short_id,
                authorName: commit.author_name,
                authorEmail: commit.author_email,
                committerName: commit.committer_name,
                committerEmail: commit.committer_email,
                webUrl: commit.web_url,
                projectUrl: project.web_url,
                projectVisibility: project.visibility,
                additions: commit.stats?.additions || 0,
                deletions: commit.stats?.deletions || 0,
                total: commit.stats?.total || 0,
                parentIds: commit.parent_ids || []
              },
              activityCreatedAt: new Date(commit.created_at),
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Check if this commit already exists
            const existingActivity = await ActivityTracking.findOne({
              userId: session.user.id,
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
          } catch (commitError) {
            console.error(`Error processing commit ${commit.id}:`, commitError);
            results.errors.push(`Commit ${commit.short_id || commit.id}: ${commitError.message}`);
          }
        }
        
        // Update project in integration
        const existingRepo = integration.repositories?.find(r => r.projectId === project.id);
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
          if (userCommits.length > 0) {
            existingRepo.isTracked = true;
          }
        } else if (integration.repositories) {
          // Add new repository
          integration.repositories.push({
            projectId: project.id,
            name: project.name,
            fullName: project.path_with_namespace,
            nameWithNamespace: project.path_with_namespace,
            url: project.web_url,
            description: project.description,
            visibility: project.visibility,
            isTracked: userCommits.length > 0,
            lastActivity: new Date(project.last_activity_at),
            addedAt: new Date(),
            lastSyncAt: new Date()
          });
        }
      } catch (projectError) {
        console.error(`Error processing project ${project.name}:`, projectError);
        results.errors.push(`Project ${project.name}: ${projectError.message}`);
      }
    }

    // 12. Update integration record
    integration.lastSyncAt = now;
    if (results.newCommits > 0 || results.updatedCommits > 0) {
      integration.lastSuccessfulSyncAt = now;
    }
    await integration.save();

    // 13. Return success response
    return NextResponse.json({
      success: true,
      message: 'GitLab commits synced successfully',
      syncResults: {
        commitsProcessed: results.commitsProcessed,
        newCommits: results.newCommits,
        updatedCommits: results.updatedCommits,
        projectsScanned: results.projectsScanned,
        errors: results.errors.length > 0 ? results.errors : undefined,
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
    
    return NextResponse.json({ 
      error: 'Failed to sync GitLab commits',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}