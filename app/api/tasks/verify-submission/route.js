import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import Task from '@/models/Task';
import TaskProgress from '@/models/TaskProgress';
import GitLabIntegration from '@/models/GitLabIntegration';
import User from '@/models/User';
import { gitlabApiRequest, getUserProjects } from '@/utils/gitlab-api';
import { decryptToken } from '@/utils/encryption';

/**
 * POST /api/tasks/verify-submission
 * Verifies a task submission by analyzing GitLab repositories
 */
export async function POST(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { taskId, repoUrl, method } = await request.json();
    if (!taskId) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get task details
    const task = await Task.findById(taskId);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get or create task progress
    let taskProgress = await TaskProgress.findOne({ taskId, internId: user._id });
    if (!taskProgress) {
      taskProgress = new TaskProgress({
        taskId,
        internId: user._id,
        status: 'not_started',
        progress: 0
      });
    }

    // If method is manual, just update with the provided repo URL
    if (method === 'manual' && repoUrl) {
      taskProgress.repoUrl = repoUrl;
      taskProgress.submissionMethod = 'manual';
      taskProgress.submittedOn = new Date();
      taskProgress.matchMethod = 'manual';
      taskProgress.verified = false; // Manual submissions need verification
      
      // Update status to completed if not already
      if (taskProgress.status !== 'completed' && taskProgress.status !== 'done') {
        taskProgress.status = 'completed';
        taskProgress.progress = 100;
        taskProgress.completedAt = new Date();
      }
      
      await taskProgress.save();
      
      return Response.json({
        success: true,
        message: 'Repository submitted manually',
        taskProgress
      });
    }

    // For auto or template methods, we need GitLab integration
    const integration = await GitLabIntegration.findOne({ userId: user._id });
    if (!integration) {
      return Response.json({ error: 'GitLab not connected' }, { status: 400 });
    }

    // Decrypt access token
    const accessToken = decryptToken(integration.accessToken);
    if (!accessToken) {
      return Response.json({ error: 'Invalid access token' }, { status: 400 });
    }

    // If method is template, fork the template repository
    if (method === 'template' && task.gitlabTemplateRepo?.projectId) {
      try {
        const templateProjectId = task.gitlabTemplateRepo.projectId;
        const repoName = `${task.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
        
        // Fork the repository
        const forkedProject = await gitlabApiRequest(`/projects/${templateProjectId}/fork`, accessToken, {
          method: 'POST',
          apiBase: integration.apiBase,
          body: JSON.stringify({
            name: repoName,
            path: repoName,
            description: `Forked from template for task: ${task.title}`
          })
        });
        
        // Update task progress with the forked repo
        taskProgress.repoUrl = forkedProject.web_url;
        taskProgress.submissionMethod = 'template';
        taskProgress.submittedOn = new Date();
        taskProgress.matchMethod = 'template';
        taskProgress.verified = true; // Template repos are auto-verified
        taskProgress.matchConfidence = 100;
        
        // Update status to in_progress
        taskProgress.status = 'in_progress';
        taskProgress.progress = 25; // Start with 25% progress
        if (!taskProgress.startedAt) {
          taskProgress.startedAt = new Date();
        }
        
        await taskProgress.save();
        
        return Response.json({
          success: true,
          message: 'Repository created from template',
          repository: {
            id: forkedProject.id,
            name: forkedProject.name,
            url: forkedProject.web_url
          },
          taskProgress
        });
      } catch (error) {
        console.error('Error forking template repository:', error);
        return Response.json({ error: 'Failed to fork template repository' }, { status: 500 });
      }
    }

    // For auto method, scan repositories and find matches
    const projects = await getUserProjects(accessToken, {
      apiBase: integration.apiBase,
      perPage: 100
    });

    // Extract keywords from task
    const taskKeywords = [
      ...(task.matchKeywords || []),
      ...(task.title ? task.title.toLowerCase().split(/\s+/) : []),
      ...(task.category ? [task.category.toLowerCase()] : []),
      ...(task.tags || [])
    ].filter(keyword => 
      keyword && 
      keyword.length > 3 && 
      !['the', 'and', 'for', 'with', 'task'].includes(keyword.toLowerCase())
    );

    // Add week number as keyword if available
    if (task.weekNumber) {
      taskKeywords.push(`week${task.weekNumber}`);
      taskKeywords.push(`w${task.weekNumber}`);
    }

    console.log('Task keywords:', taskKeywords);

    // Score each repository based on name match
    const repoMatches = projects.map(project => {
      // Calculate name match score
      const projectName = project.name.toLowerCase();
      const projectPath = project.path_with_namespace.toLowerCase();
      const projectDesc = project.description ? project.description.toLowerCase() : '';
      
      // Count keyword matches in name, path, and description
      let keywordMatches = 0;
      let keywordsFound = [];
      
      taskKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (projectName.includes(keywordLower) || 
            projectPath.includes(keywordLower) || 
            projectDesc.includes(keywordLower)) {
          keywordMatches++;
          keywordsFound.push(keyword);
        }
      });
      
      // Calculate match score (0-100)
      const nameMatchScore = Math.min(100, (keywordMatches / Math.max(1, taskKeywords.length)) * 100);
      
      // Check recency - prefer recently updated repos
      const lastActivityDate = new Date(project.last_activity_at);
      const daysSinceLastActivity = Math.floor((Date.now() - lastActivityDate) / (1000 * 60 * 60 * 24));
      const recencyBonus = Math.max(0, 10 - daysSinceLastActivity); // Up to 10 point bonus for recent activity
      
      // Final score with recency bonus
      const finalScore = Math.min(100, nameMatchScore + recencyBonus);
      
      return {
        id: project.id,
        name: project.name,
        path: project.path_with_namespace,
        url: project.web_url,
        description: project.description,
        lastActivity: project.last_activity_at,
        score: finalScore,
        matchType: 'name_match',
        keywordsFound
      };
    });

    // Sort by score (highest first)
    repoMatches.sort((a, b) => b.score - a.score);

    // Get top matches
    const topMatches = repoMatches.filter(match => match.score > 30).slice(0, 5);

    // If we have a strong match (score > 70), suggest it
    const strongMatch = topMatches.length > 0 && topMatches[0].score > 70 ? topMatches[0] : null;

    // If we have a strong match, update task progress
    if (strongMatch) {
      taskProgress.repoUrl = strongMatch.url;
      taskProgress.submissionMethod = 'auto';
      taskProgress.matchMethod = strongMatch.matchType;
      taskProgress.matchConfidence = strongMatch.score;
      
      // Don't mark as verified yet - user needs to confirm
      taskProgress.verified = false;
      
      await taskProgress.save();
    }

    return Response.json({
      success: true,
      matches: topMatches,
      strongMatch,
      taskKeywords,
      totalRepositories: projects.length
    });
  } catch (error) {
    console.error('Error verifying task submission:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/verify-submission
 * Confirms a repository match for a task
 */
export async function PUT(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { taskId, repoUrl, confirm } = await request.json();
    if (!taskId || !repoUrl) {
      return Response.json({ error: 'Task ID and repository URL are required' }, { status: 400 });
    }

    // Connect to database
    await connectToDatabase();

    // Get task progress
    const taskProgress = await TaskProgress.findOne({ 
      taskId, 
      internId: session.user.id 
    });

    if (!taskProgress) {
      return Response.json({ error: 'Task progress not found' }, { status: 404 });
    }

    // Update task progress
    taskProgress.repoUrl = repoUrl;
    taskProgress.verified = true;
    taskProgress.submittedOn = new Date();
    
    // If confirming, mark as completed
    if (confirm) {
      taskProgress.status = 'completed';
      taskProgress.progress = 100;
      taskProgress.completedAt = new Date();
    }
    
    await taskProgress.save();

    return Response.json({
      success: true,
      message: 'Repository confirmed',
      taskProgress
    });
  } catch (error) {
    console.error('Error confirming repository:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}