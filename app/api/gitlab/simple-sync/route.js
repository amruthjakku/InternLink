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
    const accessToken = decrypt(integration.accessToken);
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
    const projectsResponse = await fetch(`${apiBase}/projects?membership=true&per_page=50`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status} ${projectsResponse.statusText}`);
    }

    const projects = await projectsResponse.json();
    results.projectsFound = projects.length;
    console.log(`✅ Found ${projects.length} projects`);

    // Step 2: For each project, get ALL commits (no filtering)
    for (const project of projects.slice(0, 10)) { // Limit to first 10 projects for now
      console.log(`\n🔍 Processing project: ${project.name}`);
      
      try {
        // Get commits from this project (last 6 months, no author filter)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const commitsUrl = `${apiBase}/projects/${project.id}/repository/commits?since=${sixMonthsAgo.toISOString()}&per_page=100`;
        console.log(`📡 Fetching commits: ${commitsUrl}`);
        
        const commitsResponse = await fetch(commitsUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!commitsResponse.ok) {
          console.log(`⚠️ Failed to fetch commits for ${project.name}: ${commitsResponse.status}`);
          continue;
        }

        const commits = await commitsResponse.json();
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
    return NextResponse.json({ 
      error: 'Sync failed',
      details: error.message 
    }, { status: 500 });
  }
}