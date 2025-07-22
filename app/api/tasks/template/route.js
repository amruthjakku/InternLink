import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import GitLabIntegration from '../../../../models/GitLabIntegration';
import { gitlabApiRequest } from '../../../../utils/gitlab-api';
import { decryptToken } from '../../../../utils/encryption';

/**
 * POST /api/tasks/template
 * Adds or updates a GitLab template repository for a task
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !['Tech Lead', 'admin', 'POC'].includes(session.user.role)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { taskId, templateRepo } = await request.json();
    if (!taskId) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task with template repository
    if (templateRepo) {
      task.gitlabTemplateRepo = {
        url: templateRepo.url,
        projectId: templateRepo.projectId,
        description: templateRepo.description,
        addedBy: session.user.id,
        addedAt: new Date()
      };
    } else {
      // Remove template repository
      task.gitlabTemplateRepo = undefined;
    }

    // Save task
    await task.save();

    return Response.json({
      success: true,
      message: templateRepo ? 'Template repository added' : 'Template repository removed',
      task: {
        id: task._id,
        title: task.title,
        gitlabTemplateRepo: task.gitlabTemplateRepo
      }
    });
  } catch (error) {
    console.error('Error updating task template:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/tasks/template?taskId=123
 * Gets the GitLab template repository for a task
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get task ID from query params
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Get task
    const task = await Task.findById(taskId);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if user has access to this task
    if (session.user.role === 'AI Developer Intern') {
      // For interns, only return template info if the task is assigned to them
      // This check would need to be expanded based on your task assignment logic
      const isAssigned = true; // Placeholder - implement your assignment check here
      
      if (!isAssigned) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // If task has a template repository, check if it's valid
    if (task.gitlabTemplateRepo && task.gitlabTemplateRepo.projectId) {
      // For admins, we could validate the template repository exists
      if (['Tech Lead', 'admin', 'POC'].includes(session.user.role)) {
        try {
          // Get GitLab integration for admin
          const integration = await GitLabIntegration.findOne({ userId: session.user.id });
          if (integration) {
            // Decrypt access token
            const accessToken = decryptToken(integration.accessToken);
            if (accessToken) {
              // Check if repository exists
              const projectResponse = await gitlabApiRequest(
                `/projects/${task.gitlabTemplateRepo.projectId}`, 
                accessToken, 
                { apiBase: integration.apiBase }
              );
              
              // Update repository info if needed
              if (projectResponse && projectResponse.id) {
                task.gitlabTemplateRepo.url = projectResponse.web_url;
                task.gitlabTemplateRepo.description = projectResponse.description;
                await task.save();
              }
            }
          }
        } catch (error) {
          console.warn('Error validating template repository:', error.message);
          // Continue without validation
        }
      }
    }

    return Response.json({
      success: true,
      templateRepo: task.gitlabTemplateRepo || null
    });
  } catch (error) {
    console.error('Error getting task template:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}