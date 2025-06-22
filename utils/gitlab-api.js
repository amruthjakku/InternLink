/**
 * GitLab API Utility for Swecha Instance
 * Handles API calls to https://code.swecha.org
 */

const GITLAB_API_BASE = process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';

/**
 * Make authenticated request to GitLab API
 */
export async function gitlabApiRequest(endpoint, accessToken, options = {}) {
  const url = `${GITLAB_API_BASE}${endpoint}`;
  
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitLab API Error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`GitLab API request failed for ${endpoint}:`, error);
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