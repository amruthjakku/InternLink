import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gitlab/debug-commits
 * Debug endpoint to see what commits are available in user's repositories
 */
export async function GET(request) {
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

    // Get user's projects
    const projectsResponse = await fetch(`${apiBase}/projects?membership=true&per_page=10`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!projectsResponse.ok) {
      throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
    }

    const projects = await projectsResponse.json();
    
    const debugInfo = {
      user: {
        username: integration.gitlabUsername,
        email: integration.gitlabEmail,
        apiBase: apiBase
      },
      projects: projects.length,
      projectSamples: []
    };

    // Get sample commits from first few projects
    for (let i = 0; i < Math.min(3, projects.length); i++) {
      const project = projects[i];
      
      try {
        const commitsResponse = await fetch(
          `${apiBase}/projects/${project.id}/repository/commits?per_page=5`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (commitsResponse.ok) {
          const commits = await commitsResponse.json();
          
          debugInfo.projectSamples.push({
            projectName: project.name,
            projectPath: project.path_with_namespace,
            commitsFound: commits.length,
            sampleCommits: commits.map(commit => ({
              title: commit.title,
              author_name: commit.author_name,
              author_email: commit.author_email,
              created_at: commit.created_at,
              matchesUser: (
                commit.author_name === integration.gitlabUsername ||
                commit.author_email === integration.gitlabEmail ||
                (commit.author_name && commit.author_name.toLowerCase().includes(integration.gitlabUsername.toLowerCase()))
              )
            }))
          });
        }
      } catch (error) {
        debugInfo.projectSamples.push({
          projectName: project.name,
          error: error.message
        });
      }
    }

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Error in debug-commits:', error);
    return NextResponse.json({ 
      error: 'Failed to debug commits',
      details: error.message 
    }, { status: 500 });
  }
}