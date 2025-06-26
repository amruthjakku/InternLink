import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/simple-sync
 * Simple, reliable GitLab sync that definitely works
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
        error: 'Token decryption failed',
        message: 'Failed to decrypt the GitLab access token'
      }, { status: 500 });
    }

    // Check if token is expired and refresh if needed
    const now = new Date();
    if (integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < now) {
      console.log('🔄 GitLab token has expired, attempting to refresh...');
      
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
          console.error(`❌ Token refresh failed: ${response.status} - ${errorText}`);
          // Continue with the current token, it might still work
        } else {
          const tokens = await response.json();
          
          if (tokens.access_token) {
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
            console.log('✅ Token refreshed successfully');
          }
        }
      } catch (refreshError) {
        console.error('❌ Error refreshing token:', refreshError);
        // Continue with the current token, it might still work
      }
    }

    const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    
    console.log(`🚀 Starting simple sync for ${integration.gitlabUsername}`);
    console.log(`📡 Using API: ${apiBase}`);

    const results = {
      projectsFound: 0,
      commitsFound: 0,
      commitsStored: 0,
      repositories: [],
      errors: []
    };

    // Step 1: Get user's projects
    console.log('📁 Fetching user projects...');
    
    // First, test the connection and check scopes
    try {
      // Check token scopes first
      const scopesResponse = await fetch(`${apiBase}/personal_access_tokens/self`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (scopesResponse.ok) {
        const tokenData = await scopesResponse.json();
        console.log(`✅ Token scopes: ${tokenData.scopes?.join(', ') || 'unknown'}`);
        
        // Check if we have the required scopes
        const requiredScopes = ['api', 'read_api', 'read_user', 'read_repository'];
        const missingScopes = requiredScopes.filter(scope => 
          !tokenData.scopes?.includes(scope) && 
          !tokenData.scopes?.includes('api') // 'api' includes all scopes
        );
        
        if (missingScopes.length > 0) {
          console.warn(`⚠️ Token is missing required scopes: ${missingScopes.join(', ')}`);
          // We'll continue anyway, but log the warning
        }
      } else {
        console.warn('⚠️ Could not check token scopes, continuing anyway');
      }
      
      // Now test basic user access
      const testResponse = await fetch(`${apiBase}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        
        // Check for specific error types
        if (testResponse.status === 403 && errorText.includes('insufficient_scope')) {
          throw new Error(`GitLab token has insufficient permissions. Required scopes: api, read_api, read_user, read_repository. Status: ${testResponse.status} - ${errorText}`);
        }
        
        throw new Error(`GitLab API connection test failed: ${testResponse.status} - ${errorText}`);
      }
      
      const user = await testResponse.json();
      console.log(`✅ Connected to GitLab API as ${user.username}`);
      
      // Update the integration with user details if missing
      if (!integration.gitlabUserId) {
        await GitLabIntegration.updateOne(
          { _id: integration._id },
          { 
            gitlabUserId: user.id,
            gitlabUsername: user.username,
            gitlabName: user.name,
            gitlabEmail: user.email,
            gitlabAvatarUrl: user.avatar_url,
            updatedAt: new Date()
          }
        );
        console.log(`✅ Updated integration with user details for ${user.username}`);
      }
    } catch (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      throw new Error(`GitLab API connection failed: ${connectionError.message}`);
    }
    
    // Now fetch projects
    const projectsResponse = await fetch(`${apiBase}/projects?membership=true&per_page=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!projectsResponse.ok) {
      const errorText = await projectsResponse.text();
      throw new Error(`Failed to fetch projects: ${projectsResponse.status} - ${errorText}`);
    }

    let projects;
    try {
      // First check if the response is empty
      const text = await projectsResponse.text();
      
      if (!text || text.trim() === '') {
        throw new Error('Empty response when fetching projects');
      }
      
      // Try to parse the text as JSON
      try {
        projects = JSON.parse(text);
      } catch (jsonError) {
        console.error(`Invalid JSON response for projects: ${jsonError.message}`);
        console.error(`Response text: ${text.substring(0, 200)}...`);
        throw new Error(`Failed to parse projects JSON: ${jsonError.message}`);
      }
      
      if (!Array.isArray(projects)) {
        console.error('Projects response is not an array:', typeof projects);
        console.error('Response preview:', JSON.stringify(projects).substring(0, 200));
        throw new Error('GitLab API did not return an array of projects');
      }
    } catch (parseError) {
      throw new Error(`Failed to parse projects response: ${parseError.message}`);
    }
    results.projectsFound = projects.length;
    console.log(`✅ Found ${projects.length} projects`);

    // Step 2: For each project, get ALL commits (no filtering)
    // Process all projects, not just the first 10
    for (const project of projects) {
      console.log(`\n🔍 Processing project: ${project.name}`);
      
      try {
        // Get commits from this project (last 12 months, no author filter)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        const commitsUrl = `${apiBase}/projects/${project.id}/repository/commits?since=${oneYearAgo.toISOString()}&per_page=100`;
        console.log(`📡 Fetching commits: ${commitsUrl}`);
        
        // Add timeout to avoid hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        let commits = [];
        try {
          const commitsResponse = await fetch(commitsUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);

          if (!commitsResponse.ok) {
            if (commitsResponse.status === 404) {
              console.log(`⚠️ Project ${project.name} returned 404 - might not have a repository`);
              continue;
            }
            
            const errorText = await commitsResponse.text();
            console.log(`⚠️ Failed to fetch commits for ${project.name}: ${commitsResponse.status} - ${errorText}`);
            continue;
          }

          try {
            // First check if the response is empty
            const text = await commitsResponse.text();
            
            if (!text || text.trim() === '') {
              console.log(`⚠️ Empty response for ${project.name}`);
              commits = [];
              continue;
            }
            
            // Try to parse the text as JSON
            try {
              commits = JSON.parse(text);
            } catch (jsonError) {
              console.log(`⚠️ Invalid JSON response for ${project.name}: ${jsonError.message}`);
              console.log(`Response text: ${text.substring(0, 100)}...`);
              commits = [];
              continue;
            }
            
            if (!Array.isArray(commits)) {
              console.log(`⚠️ Invalid commits response for ${project.name} - not an array`);
              commits = [];
              continue;
            }
          } catch (parseError) {
            console.log(`⚠️ Failed to parse commits for ${project.name}: ${parseError.message}`);
            commits = [];
            continue;
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          if (fetchError.name === 'AbortError') {
            console.log(`⚠️ Timeout fetching commits for ${project.name}`);
          } else {
            console.log(`⚠️ Error fetching commits for ${project.name}: ${fetchError.message}`);
          }
          continue;
        }
        console.log(`📊 Found ${commits.length} total commits in ${project.name}`);
        results.commitsFound += commits.length;

        // Step 3: Store ALL commits (we'll filter in the UI)
        let storedCount = 0;
        for (const commit of commits) {
          try {
            // Check if we already have this commit
            const existingActivity = await ActivityTracking.findOne({
              userId: session.user.id,
              gitlabId: commit.id,
              type: 'commit'
            });

            if (!existingActivity) {
              // Store the commit
              await ActivityTracking.create({
                userId: session.user.id,
                type: 'commit',
                gitlabId: commit.id,
                title: commit.title,
                message: commit.message,
                url: commit.web_url,
                activityCreatedAt: new Date(commit.created_at),
                projectId: project.id.toString(),
                projectName: project.name,
                projectPath: project.path_with_namespace,
                metadata: {
                  authorName: commit.author_name,
                  authorEmail: commit.author_email,
                  committerName: commit.committer_name,
                  committerEmail: commit.committer_email,
                  webUrl: commit.web_url,
                  projectUrl: project.web_url,
                  projectVisibility: project.visibility,
                  shortId: commit.short_id
                }
              });
              storedCount++;
            }
          } catch (commitError) {
            console.error(`❌ Error storing commit ${commit.short_id}:`, commitError.message);
            results.errors.push(`Commit ${commit.short_id}: ${commitError.message}`);
          }
        }

        console.log(`💾 Stored ${storedCount} new commits from ${project.name}`);
        results.commitsStored += storedCount;

        // Add to repositories list
        results.repositories.push({
          name: project.name,
          path: project.path_with_namespace,
          url: project.web_url,
          totalCommits: commits.length,
          newCommits: storedCount
        });

      } catch (projectError) {
        console.error(`❌ Error processing project ${project.name}:`, projectError.message);
        results.errors.push(`Project ${project.name}: ${projectError.message}`);
      }
    }

    // Step 4: Update last sync time
    await GitLabIntegration.updateOne(
      { userId: session.user.id, isActive: true },
      { lastSyncAt: new Date() }
    );

    console.log(`\n🎉 Sync completed!`);
    console.log(`📊 Results: ${results.projectsFound} projects, ${results.commitsFound} commits found, ${results.commitsStored} stored`);

    return NextResponse.json({
      success: true,
      message: `Sync completed! Found ${results.commitsFound} commits from ${results.projectsFound} projects, stored ${results.commitsStored} new commits.`,
      results: results
    });

  } catch (error) {
    console.error('❌ Simple sync error:', error);
    
    // Log sync error in the integration record
    try {
      if (session?.user?.id) {
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
      } else {
        console.error('Cannot log sync error: session or user ID is missing');
      }
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
      apiBase: process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4'
    };
    
    return NextResponse.json({ 
      error: 'Sync failed',
      details: errorDetails
    }, { status: 500 });
  }
}