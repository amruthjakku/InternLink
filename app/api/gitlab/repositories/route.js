import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import GitLabIntegration from '@/models/GitLabIntegration';
import { getUserProjects, gitlabApiRequest } from '@/utils/gitlab-api';
import { decryptToken } from '@/utils/encryption';

/**
 * GET /api/gitlab/repositories
 * Fetches all repositories for the authenticated user
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get GitLab integration for user
    const integration = await GitLabIntegration.findOne({ userId: session.user.id });
    if (!integration) {
      return Response.json({ error: 'GitLab not connected', connected: false }, { status: 200 });
    }

    // Decrypt access token
    const accessToken = decryptToken(integration.accessToken);
    if (!accessToken) {
      return Response.json({ error: 'Invalid access token' }, { status: 400 });
    }

    // Fetch repositories from GitLab API
    const projects = await getUserProjects(accessToken, {
      apiBase: integration.apiBase,
      perPage: 100
    });

    // Format repositories
    const repositories = projects.map(project => ({
      id: project.id,
      name: project.name,
      fullName: project.path_with_namespace,
      description: project.description,
      url: project.web_url,
      defaultBranch: project.default_branch,
      visibility: project.visibility,
      lastActivityAt: project.last_activity_at,
      createdAt: project.created_at,
      stars: project.star_count,
      forks: project.forks_count,
      language: project.language || null,
      topics: project.topics || [],
      readme: null // Will be populated on demand
    }));

    return Response.json({
      success: true,
      repositories,
      count: repositories.length
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/gitlab/repositories/fork
 * Forks a repository from a template
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { templateProjectId, name, description } = await request.json();
    if (!templateProjectId) {
      return Response.json({ error: 'Template project ID is required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Get GitLab integration for user
    const integration = await GitLabIntegration.findOne({ userId: session.user.id });
    if (!integration) {
      return Response.json({ error: 'GitLab not connected' }, { status: 400 });
    }

    // Decrypt access token
    const accessToken = decryptToken(integration.accessToken);
    if (!accessToken) {
      return Response.json({ error: 'Invalid access token' }, { status: 400 });
    }

    // Fork the repository using GitLab API
    const forkedProject = await gitlabApiRequest(`/projects/${templateProjectId}/fork`, accessToken, {
      method: 'POST',
      apiBase: integration.apiBase,
      body: JSON.stringify({
        name: name || `fork-${Date.now()}`,
        path: name?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || `fork-${Date.now()}`,
        description: description || 'Forked from template'
      })
    });

    return Response.json({
      success: true,
      repository: {
        id: forkedProject.id,
        name: forkedProject.name,
        fullName: forkedProject.path_with_namespace,
        url: forkedProject.web_url,
        description: forkedProject.description
      }
    });
  } catch (error) {
    console.error('Error forking repository:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}