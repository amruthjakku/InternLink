import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { decrypt } from '../../../../utils/encryption.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { GitLabAPI } from '../../../../utils/gitlab-api.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

/**
 * GET /api/gitlab/commits
 * Get user commits with optional date filtering
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const until = searchParams.get('until');
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit')) || 50;
    const useCache = searchParams.get('cache') !== 'false';

    // Get GitLab integration
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id, 
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab not connected',
        connected: false 
      }, { status: 400 });
    }

    // Check if token is expired
    if (integration.tokenExpiresAt < new Date()) {
      return NextResponse.json({ 
        error: 'GitLab token expired',
        tokenExpired: true 
      }, { status: 401 });
    }

    let commits = [];

    if (useCache) {
      // Try to get commits from database first
      const query = { 
        userId: session.user.id, 
        type: 'commit' 
      };

      if (since || until) {
        query.activityCreatedAt = {};
        if (since) query.activityCreatedAt.$gte = new Date(since);
        if (until) query.activityCreatedAt.$lte = new Date(until);
      }

      if (projectId) {
        query.projectId = parseInt(projectId);
      }

      const cachedCommits = await ActivityTracking
        .find(query)
        .sort({ activityCreatedAt: -1 })
        .limit(limit)
        .lean();

      commits = cachedCommits.map(commit => ({
        id: commit.gitlabId,
        title: commit.title,
        message: commit.description,
        created_at: commit.activityCreatedAt,
        web_url: commit.url,
        project_name: commit.projectName,
        project_id: commit.projectId,
        project_url: commit.projectUrl,
        stats: {
          additions: commit.metadata?.additions || 0,
          deletions: commit.metadata?.deletions || 0
        },
        sha: commit.metadata?.sha,
        cached: true
      }));
    }

    // If no cached data or cache is disabled, fetch from GitLab API
    if (commits.length === 0 || !useCache) {
      const accessToken = decrypt(integration.accessToken);
      const gitlab = new GitLabAPI(accessToken);

      try {
        const apiCommits = await gitlab.getUserCommits(
          integration.gitlabEmail,
          since,
          until
        );

        // Limit results
        commits = apiCommits.slice(0, limit);

        // Store commits in database for caching
        for (const commit of commits) {
          try {
            await ActivityTracking.updateOne(
              { gitlabId: commit.id, type: 'commit' },
              {
                userId: session.user.id,
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
                  parentIds: commit.parent_ids || []
                },
                syncedAt: new Date()
              },
              { upsert: true }
            );
          } catch (dbError) {
            console.error('Error caching commit:', dbError);
          }
        }
      } catch (apiError) {
        console.error('GitLab API error:', apiError);
        
        // If API fails, try to return cached data
        if (commits.length === 0) {
          return NextResponse.json({ 
            error: 'Failed to fetch commits from GitLab',
            details: apiError.message 
          }, { status: 500 });
        }
      }
    }

    // Calculate summary statistics
    const summary = {
      totalCommits: commits.length,
      totalAdditions: commits.reduce((sum, c) => sum + (c.stats?.additions || 0), 0),
      totalDeletions: commits.reduce((sum, c) => sum + (c.stats?.deletions || 0), 0),
      projectsCount: [...new Set(commits.map(c => c.project_id))].length,
      dateRange: {
        earliest: commits.length > 0 ? commits[commits.length - 1].created_at : null,
        latest: commits.length > 0 ? commits[0].created_at : null
      }
    };

    return NextResponse.json({
      commits,
      summary,
      cached: useCache && commits.length > 0 && commits[0].cached
    });

  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch commits',
      details: error.message 
    }, { status: 500 });
  }
}