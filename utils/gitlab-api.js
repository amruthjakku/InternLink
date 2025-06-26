/**
 * GitLab API Utility for Swecha Instance
 * Handles API calls to https://code.swecha.org
 */

const GITLAB_API_BASE = process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';

/**
 * Make authenticated request to GitLab API
 */
export async function gitlabApiRequest(endpoint, accessToken, options = {}) {
  // Allow custom API base URL to be passed in options
  const apiBase = options.apiBase || GITLAB_API_BASE;
  const url = `${apiBase}${endpoint}`;
  
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  // Remove apiBase from options to avoid fetch errors
  if (config.apiBase) {
    delete config.apiBase;
  }

  // Add timeout to avoid hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  config.signal = controller.signal;

  console.log(`GitLab API Request: ${url.replace(/\?.*$/, '?...')}`);
  
  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorText = '';
      let errorJson = null;
      
      try {
        // Try to parse as JSON first
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } else {
          errorText = await response.text();
        }
      } catch (e) {
        errorText = `Could not parse error response: ${e.message}`;
      }
      
      // Handle specific error cases
      if (response.status === 401) {
        const error = new Error(`GitLab API Authentication Error: Token may have expired or is invalid`);
        error.status = response.status;
        error.url = url;
        error.responseData = errorJson;
        error.isAuthError = true;
        throw error;
      }
      
      if (response.status === 403) {
        // Check if this is a scope issue
        if (errorText.includes('insufficient_scope')) {
          const error = new Error(`GitLab API Permission Error: Token has insufficient permissions. Required scopes: api, read_api, read_user, read_repository`);
          error.status = response.status;
          error.url = url;
          error.responseData = errorJson;
          error.isPermissionError = true;
          error.insufficientScope = true;
          throw error;
        } else {
          const error = new Error(`GitLab API Forbidden: Access denied to ${endpoint}`);
          error.status = response.status;
          error.url = url;
          error.responseData = errorJson;
          error.isPermissionError = true;
          throw error;
        }
      }
      
      if (response.status === 404) {
        const error = new Error(`GitLab API Resource Not Found: ${endpoint}`);
        error.status = response.status;
        error.url = url;
        error.responseData = errorJson;
        error.isNotFoundError = true;
        throw error;
      }
      
      if (response.status === 429) {
        const error = new Error(`GitLab API Rate Limit Exceeded`);
        error.status = response.status;
        error.url = url;
        error.responseData = errorJson;
        error.isRateLimitError = true;
        throw error;
      }
      
      const error = new Error(`GitLab API Error (${response.status}): ${errorText}`);
      error.status = response.status;
      error.url = url;
      error.responseData = errorJson;
      throw error;
    }
    
    // Parse response as JSON
    try {
      const data = await response.json();
      return data;
    } catch (parseError) {
      console.error(`Error parsing GitLab API response:`, parseError);
      const error = new Error(`Failed to parse GitLab API response: ${parseError.message}`);
      error.status = response.status;
      error.url = url;
      error.parseError = parseError;
      throw error;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort errors
    if (error.name === 'AbortError') {
      console.error(`GitLab API request timed out for ${endpoint}`);
      const timeoutError = new Error(`GitLab API request timed out after 30 seconds`);
      timeoutError.url = url;
      timeoutError.isTimeoutError = true;
      throw timeoutError;
    }
    
    console.error(`GitLab API request failed for ${endpoint}:`, error);
    
    // Add request context to the error
    if (!error.url) {
      error.url = url;
    }
    
    throw error;
  }
}

/**
 * Get current user info from GitLab
 */
export async function getCurrentUser(accessToken) {
  return await gitlabApiRequest('/user', accessToken);
}

/**
 * Get user's projects/repositories
 */
export async function getUserProjects(accessToken, options = {}) {
  const params = new URLSearchParams({
    membership: 'true',
    per_page: options.perPage || 100,
    page: options.page || 1,
    order_by: 'last_activity_at',
    sort: 'desc',
    ...options.params
  });
  
  return await gitlabApiRequest(`/projects?${params}`, accessToken);
}

/**
 * Get commits for a specific project
 */
export async function getProjectCommits(projectId, accessToken, options = {}) {
  const params = new URLSearchParams({
    per_page: options.perPage || 50,
    page: options.page || 1,
    since: options.since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // Last 90 days
    author: options.author,
    ...options.params
  });
  
  return await gitlabApiRequest(`/projects/${projectId}/repository/commits?${params}`, accessToken);
}

/**
 * Get commit details with stats
 */
export async function getCommitDetails(projectId, commitSha, accessToken) {
  return await gitlabApiRequest(`/projects/${projectId}/repository/commits/${commitSha}`, accessToken);
}

/**
 * Get user's commit activity across all projects
 */
export async function getUserCommitActivity(accessToken, options = {}) {
  try {
    // First, get user's projects
    const projects = await getUserProjects(accessToken, { perPage: 100 });
    
    const commitActivity = [];
    const since = options.since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    // Get current user to filter commits by author
    const currentUser = await getCurrentUser(accessToken);
    
    // Fetch commits from each project
    for (const project of projects) {
      try {
        const commits = await getProjectCommits(project.id, accessToken, {
          since,
          author: currentUser.username,
          perPage: 100
        });
        
        // Add project context to each commit
        const projectCommits = commits.map(commit => ({
          ...commit,
          project: {
            id: project.id,
            name: project.name,
            path: project.path_with_namespace,
            url: project.web_url
          }
        }));
        
        commitActivity.push(...projectCommits);
      } catch (error) {
        console.warn(`Failed to fetch commits for project ${project.name}:`, error.message);
        // Continue with other projects
      }
    }
    
    // Sort by date (newest first)
    commitActivity.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return {
      commits: commitActivity,
      projects: projects,
      user: currentUser,
      totalCommits: commitActivity.length,
      activeProjects: projects.filter(p => commitActivity.some(c => c.project.id === p.id)).length
    };
  } catch (error) {
    console.error('Error fetching user commit activity:', error);
    throw error;
  }
}

/**
 * Get user's issues
 */
export async function getUserIssues(accessToken, options = {}) {
  const params = new URLSearchParams({
    scope: 'assigned_to_me',
    state: options.state || 'opened',
    per_page: options.perPage || 50,
    page: options.page || 1,
    ...options.params
  });
  
  return await gitlabApiRequest(`/issues?${params}`, accessToken);
}

/**
 * Get user's merge requests
 */
export async function getUserMergeRequests(accessToken, options = {}) {
  const params = new URLSearchParams({
    scope: 'assigned_to_me',
    state: options.state || 'opened',
    per_page: options.perPage || 50,
    page: options.page || 1,
    ...options.params
  });
  
  return await gitlabApiRequest(`/merge_requests?${params}`, accessToken);
}

/**
 * Generate commit analytics
 */
export function generateCommitAnalytics(commits) {
  const now = new Date();
  const analytics = {
    totalCommits: commits.length,
    recentCommits: commits.slice(0, 10),
    commitsByDay: {},
    commitsByWeek: {},
    commitsByMonth: {},
    languages: {},
    streak: 0,
    longestStreak: 0
  };
  
  // Process commits for analytics
  commits.forEach(commit => {
    const date = new Date(commit.created_at);
    const dayKey = date.toISOString().split('T')[0];
    const weekKey = getWeekKey(date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    // Count by day
    analytics.commitsByDay[dayKey] = (analytics.commitsByDay[dayKey] || 0) + 1;
    
    // Count by week
    analytics.commitsByWeek[weekKey] = (analytics.commitsByWeek[weekKey] || 0) + 1;
    
    // Count by month
    analytics.commitsByMonth[monthKey] = (analytics.commitsByMonth[monthKey] || 0) + 1;
    
    // Track languages (if available in project data)
    if (commit.project && commit.project.language) {
      analytics.languages[commit.project.language] = (analytics.languages[commit.project.language] || 0) + 1;
    }
  });
  
  // Calculate streak
  analytics.streak = calculateCurrentStreak(analytics.commitsByDay);
  analytics.longestStreak = calculateLongestStreak(analytics.commitsByDay);
  
  // Generate heatmap data (last 90 days)
  analytics.commitHeatmap = generateCommitHeatmap(analytics.commitsByDay);
  
  return analytics;
}

/**
 * Get week key for grouping
 */
function getWeekKey(date) {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Get week number of the year
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Calculate current commit streak
 */
function calculateCurrentStreak(commitsByDay) {
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayKey = date.toISOString().split('T')[0];
    
    if (commitsByDay[dayKey]) {
      streak++;
    } else if (i > 0) {
      // Allow one day gap for today
      break;
    }
  }
  
  return streak;
}

/**
 * Calculate longest commit streak
 */
function calculateLongestStreak(commitsByDay) {
  const dates = Object.keys(commitsByDay).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let lastDate = null;
  
  dates.forEach(dateStr => {
    const date = new Date(dateStr);
    
    if (lastDate) {
      const dayDiff = (date - lastDate) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    
    lastDate = date;
  });
  
  return Math.max(longestStreak, currentStreak);
}

/**
 * Generate commit heatmap data for last 90 days
 */
function generateCommitHeatmap(commitsByDay) {
  const heatmap = [];
  const today = new Date();
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayKey = date.toISOString().split('T')[0];
    
    heatmap.push({
      date: dayKey,
      count: commitsByDay[dayKey] || 0,
      level: getHeatmapLevel(commitsByDay[dayKey] || 0)
    });
  }
  
  return heatmap;
}

/**
 * Get heatmap intensity level (0-4)
 */
function getHeatmapLevel(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

/**
 * Test GitLab API connection
 */
export async function testGitLabConnection(accessToken) {
  try {
    const user = await getCurrentUser(accessToken);
    const projects = await getUserProjects(accessToken, { perPage: 5 });
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url
      },
      projectCount: projects.length,
      apiBase: GITLAB_API_BASE
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      apiBase: GITLAB_API_BASE
    };
  }
}

/**
 * GitLab API Class - Wrapper for all GitLab API functions
 */
export class GitLabAPI {
  constructor(accessToken, apiBase = null) {
    this.accessToken = accessToken;
    this.apiBase = apiBase || GITLAB_API_BASE;
  }

  async getCurrentUser() {
    return await gitlabApiRequest('/user', this.accessToken, { apiBase: this.apiBase });
  }

  async getUserProjects(options = {}) {
    const params = new URLSearchParams({
      membership: 'true',
      per_page: options.perPage || 100,
      page: options.page || 1,
      order_by: 'last_activity_at',
      sort: 'desc',
      ...options.params
    });
    
    return await gitlabApiRequest(`/projects?${params}`, this.accessToken, { apiBase: this.apiBase });
  }

  async getProjectCommits(projectId, options = {}) {
    const params = new URLSearchParams({
      per_page: options.perPage || 50,
      page: options.page || 1,
      since: options.since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      author: options.author,
      ...options.params
    });
    
    return await gitlabApiRequest(`/projects/${projectId}/repository/commits?${params}`, this.accessToken, { apiBase: this.apiBase });
  }

  async getCommitDetails(projectId, commitSha) {
    return await gitlabApiRequest(`/projects/${projectId}/repository/commits/${commitSha}`, this.accessToken, { apiBase: this.apiBase });
  }

  async getUserCommitActivity(options = {}) {
    try {
      // First, get user's projects
      const projects = await this.getUserProjects({ perPage: 100 });
      
      if (!Array.isArray(projects)) {
        console.error('Invalid projects response:', projects);
        throw new Error('Invalid projects response from GitLab API');
      }
      
      console.log(`Got ${projects.length} projects from GitLab API`);
      
      const commitActivity = [];
      const since = options.since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const errors = [];
      
      // Get current user to filter commits by author
      const currentUser = await this.getCurrentUser();
      
      if (!currentUser || !currentUser.username) {
        console.error('Invalid user response:', currentUser);
        throw new Error('Failed to get current user information from GitLab API');
      }
      
      console.log(`Fetching commit activity for user ${currentUser.username} since ${since}`);
      console.log(`Found ${projects.length} projects to scan`);
      
      // Limit the number of projects to scan to avoid timeouts
      const projectsToScan = projects.slice(0, 50); // Limit to 50 projects
      console.log(`Limiting scan to ${projectsToScan.length} projects to avoid timeouts`);
      
      // Fetch commits from each project
      for (const project of projectsToScan) {
        try {
          if (!project.id) {
            console.warn(`Project missing ID, skipping:`, project);
            continue;
          }
          
          console.log(`Fetching commits for project: ${project.name} (ID: ${project.id})`);
          
          // Try different author formats to maximize matches
          const authorOptions = [
            currentUser.username,
            currentUser.email,
            currentUser.name
          ].filter(Boolean);
          
          let commits = [];
          let foundCommits = false;
          
          // Try each author option until we find commits
          for (const author of authorOptions) {
            try {
              const projectCommits = await this.getProjectCommits(project.id, {
                since,
                author,
                perPage: 50 // Reduce to 50 to avoid timeouts
              });
              
              if (Array.isArray(projectCommits) && projectCommits.length > 0) {
                commits = projectCommits;
                foundCommits = true;
                console.log(`Found ${commits.length} commits in project ${project.name} with author=${author}`);
                break;
              }
            } catch (authorError) {
              console.warn(`Failed to fetch commits with author=${author}:`, authorError.message);
              // Continue with next author option
            }
          }
          
          // If no commits found with author filter, try without filter for small projects
          if (!foundCommits && project.star_count < 5) { // Only for smaller projects
            try {
              const allCommits = await this.getProjectCommits(project.id, {
                since,
                perPage: 50
              });
              
              // Filter commits client-side
              const filteredCommits = allCommits.filter(commit => {
                const authorName = (commit.author_name || '').toLowerCase();
                const authorEmail = (commit.author_email || '').toLowerCase();
                const userName = (currentUser.name || '').toLowerCase();
                const userEmail = (currentUser.email || '').toLowerCase();
                const username = (currentUser.username || '').toLowerCase();
                
                return authorName.includes(userName) || 
                       authorEmail === userEmail ||
                       authorName.includes(username);
              });
              
              if (filteredCommits.length > 0) {
                commits = filteredCommits;
                console.log(`Found ${commits.length} commits in project ${project.name} after client-side filtering`);
              }
            } catch (noFilterError) {
              console.warn(`Failed to fetch unfiltered commits:`, noFilterError.message);
            }
          }
          
          if (commits.length === 0) {
            console.log(`No commits found in project ${project.name}`);
            continue;
          }
          
          // Add project context to each commit
          const projectCommits = commits.map(commit => ({
            ...commit,
            project: {
              id: project.id,
              name: project.name,
              path: project.path_with_namespace,
              url: project.web_url
            }
          }));
          
          commitActivity.push(...projectCommits);
        } catch (error) {
          console.warn(`Failed to fetch commits for project ${project.name}:`, error.message);
          errors.push({
            project: project.name,
            projectId: project.id,
            error: error.message
          });
          // Continue with other projects
        }
      }
      
      // Sort by date (newest first)
      commitActivity.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return {
        commits: commitActivity,
        projects: projects,
        user: currentUser,
        totalCommits: commitActivity.length,
        activeProjects: projects.filter(p => commitActivity.some(c => c.project.id === p.id)).length,
        errors: errors.length > 0 ? errors : undefined,
        scannedProjects: projectsToScan.length,
        totalProjects: projects.length
      };
    } catch (error) {
      console.error('Error fetching user commit activity:', error);
      
      // Add more context to the error
      const enhancedError = new Error(`Failed to fetch commit activity: ${error.message}`);
      enhancedError.originalError = error;
      enhancedError.apiBase = this.apiBase;
      throw enhancedError;
    }
  }

  async getUserCommits(userEmail, since, until) {
    try {
      // Get user's commit activity
      const activity = await this.getUserCommitActivity({
        since: since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        until: until
      });

      // Check if we got valid data
      if (!activity || !activity.commits || !Array.isArray(activity.commits)) {
        console.error('Invalid commit activity data:', activity);
        return [];
      }

      // Transform commits to match expected format
      return activity.commits.map(commit => ({
        id: commit.id,
        title: commit.title,
        message: commit.message,
        created_at: commit.created_at,
        web_url: commit.web_url,
        project_id: commit.project.id,
        project_name: commit.project.name,
        project_path: commit.project.path,
        project_url: commit.project.url,
        stats: commit.stats || { additions: 0, deletions: 0 },
        parent_ids: commit.parent_ids || []
      }));
    } catch (error) {
      console.error('Error fetching user commits:', error);
      throw error;
    }
  }

  async getUserIssues(options = {}) {
    const params = new URLSearchParams({
      scope: 'assigned_to_me',
      state: options.state || 'opened',
      per_page: options.perPage || 50,
      page: options.page || 1,
      ...options.params
    });
    
    return await gitlabApiRequest(`/issues?${params}`, this.accessToken, { apiBase: this.apiBase });
  }

  async getUserMergeRequests(options = {}) {
    const params = new URLSearchParams({
      scope: 'assigned_to_me',
      state: options.state || 'opened',
      per_page: options.perPage || 50,
      page: options.page || 1,
      ...options.params
    });
    
    return await gitlabApiRequest(`/merge_requests?${params}`, this.accessToken, { apiBase: this.apiBase });
  }

  async testConnection() {
    try {
      // First check token scopes
      let tokenScopes = { success: false };
      try {
        const scopesResponse = await fetch(`${this.apiBase}/personal_access_tokens/self`, {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (scopesResponse.ok) {
          const tokenData = await scopesResponse.json();
          
          // Check if we have the required scopes
          const requiredScopes = ['api', 'read_api', 'read_user', 'read_repository'];
          const missingScopes = requiredScopes.filter(scope => 
            !tokenData.scopes?.includes(scope) && 
            !tokenData.scopes?.includes('api') // 'api' includes all scopes
          );
          
          tokenScopes = {
            success: true,
            scopes: tokenData.scopes || [],
            hasRequiredScopes: missingScopes.length === 0,
            missingScopes: missingScopes
          };
        } else {
          const errorText = await scopesResponse.text();
          tokenScopes = {
            success: false,
            status: scopesResponse.status,
            error: errorText
          };
        }
      } catch (scopesError) {
        tokenScopes = {
          success: false,
          error: scopesError.message
        };
      }
      
      // Now test user endpoint
      const user = await this.getCurrentUser();
      
      // Try to get projects
      let projects = [];
      let projectsError = null;
      try {
        projects = await this.getUserProjects({ perPage: 5 });
      } catch (projectsErr) {
        projectsError = {
          message: projectsErr.message,
          status: projectsErr.status
        };
      }
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url
        },
        projectCount: projects.length,
        apiBase: this.apiBase,
        tokenScopes,
        projectsError
      };
    } catch (error) {
      // Check for specific error types
      let errorType = 'unknown';
      if (error.isAuthError) errorType = 'auth';
      if (error.isPermissionError) errorType = 'permission';
      if (error.insufficientScope) errorType = 'insufficient_scope';
      if (error.isNotFoundError) errorType = 'not_found';
      if (error.isRateLimitError) errorType = 'rate_limit';
      if (error.isTimeoutError) errorType = 'timeout';
      
      return {
        success: false,
        error: error.message,
        errorType,
        status: error.status,
        apiBase: this.apiBase,
        url: error.url,
        tokenScopes
      };
    }
  }
}