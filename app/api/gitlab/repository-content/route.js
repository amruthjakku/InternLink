import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import GitLabIntegration from '../../../../models/GitLabIntegration';
import { gitlabApiRequest } from '../../../../utils/gitlab-api';
import { decryptToken } from '../../../../utils/encryption';

/**
 * GET /api/gitlab/repository-content
 * Fetches repository content (README, file structure) for analysis
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project ID from query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return Response.json({ error: 'Project ID is required' }, { status: 400 });
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

    // Fetch repository tree (file structure)
    const tree = await gitlabApiRequest(`/projects/${projectId}/repository/tree?recursive=true&per_page=100`, accessToken, {
      apiBase: integration.apiBase
    });

    // Check for README.md
    const readmeFile = tree.find(file => 
      file.name.toLowerCase() === 'readme.md' || 
      file.name.toLowerCase() === 'readme.txt'
    );

    // Check for task.json
    const taskJsonFile = tree.find(file => file.name.toLowerCase() === 'task.json');

    // Fetch README content if found
    let readmeContent = null;
    if (readmeFile) {
      try {
        const readmeResponse = await gitlabApiRequest(
          `/projects/${projectId}/repository/files/${encodeURIComponent(readmeFile.path)}/raw?ref=master`, 
          accessToken, 
          { apiBase: integration.apiBase }
        );
        
        // If the response is a string, use it directly
        if (typeof readmeResponse === 'string') {
          readmeContent = readmeResponse;
        } 
        // If it's an object with content property (base64 encoded)
        else if (readmeResponse && readmeResponse.content) {
          readmeContent = Buffer.from(readmeResponse.content, 'base64').toString('utf-8');
        }
      } catch (error) {
        console.warn(`Error fetching README for project ${projectId}:`, error.message);
        // Continue without README
      }
    }

    // Fetch task.json content if found
    let taskJsonContent = null;
    if (taskJsonFile) {
      try {
        const taskJsonResponse = await gitlabApiRequest(
          `/projects/${projectId}/repository/files/${encodeURIComponent(taskJsonFile.path)}/raw?ref=master`, 
          accessToken, 
          { apiBase: integration.apiBase }
        );
        
        // Parse JSON content
        if (typeof taskJsonResponse === 'string') {
          taskJsonContent = JSON.parse(taskJsonResponse);
        } else if (taskJsonResponse && taskJsonResponse.content) {
          const content = Buffer.from(taskJsonResponse.content, 'base64').toString('utf-8');
          taskJsonContent = JSON.parse(content);
        }
      } catch (error) {
        console.warn(`Error fetching task.json for project ${projectId}:`, error.message);
        // Continue without task.json
      }
    }

    // Analyze file structure
    const fileTypes = tree.reduce((types, file) => {
      if (file.type === 'blob') {
        const extension = file.name.split('.').pop().toLowerCase();
        types[extension] = (types[extension] || 0) + 1;
      }
      return types;
    }, {});

    // Check for common project files
    const hasAppPy = tree.some(file => file.name === 'app.py');
    const hasModelPy = tree.some(file => file.name === 'model.py');
    const hasIndexHtml = tree.some(file => file.name === 'index.html');
    const hasPackageJson = tree.some(file => file.name === 'package.json');
    const hasDockerfile = tree.some(file => file.name === 'Dockerfile');
    const hasRequirementsTxt = tree.some(file => file.name === 'requirements.txt');

    return Response.json({
      success: true,
      repository: {
        id: projectId,
        fileCount: tree.length,
        fileStructure: {
          directories: tree.filter(item => item.type === 'tree').map(dir => dir.path),
          files: tree.filter(item => item.type === 'blob').map(file => file.path),
          fileTypes,
          commonFiles: {
            hasAppPy,
            hasModelPy,
            hasIndexHtml,
            hasPackageJson,
            hasDockerfile,
            hasRequirementsTxt
          }
        },
        readme: {
          exists: !!readmeFile,
          content: readmeContent
        },
        taskJson: {
          exists: !!taskJsonFile,
          content: taskJsonContent
        }
      }
    });
  } catch (error) {
    console.error('Error fetching repository content:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}