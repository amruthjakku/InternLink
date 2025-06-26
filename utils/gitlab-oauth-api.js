/**
 * GitLab OAuth API Utility
 * Handles GitLab API operations using OAuth tokens instead of Personal Access Tokens
 */

import { decrypt, encrypt } from './encryption.js';
import GitLabIntegration from '../models/GitLabIntegration.js';
import { connectToDatabase } from './database.js';

const GITLAB_API_BASE = process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';

/**
 * Refresh expired GitLab OAuth token
 */
async function refreshOAuthToken(integration) {
  try {
    console.log(`Refreshing OAuth token for user ${integration.gitlabUsername}`);
    
    if (!integration.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const refreshToken = decrypt(integration.refreshToken);
    if (!refreshToken) {
      throw new Error('Failed to decrypt refresh token');
    }
    
    const gitlabInstance = integration.gitlabInstance || 'https://code.swecha.org';
    const tokenUrl = `${gitlabInstance}/oauth/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
    }

    const tokens = await response.json();
    
    if (!tokens.access_token) {
      throw new Error('No access token in refresh response');
    }
    
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

    console.log(`✅ OAuth token refreshed for ${integration.gitlabUsername}`);
    return tokens.access_token;
  } catch (error) {
    console.error('❌ Error refreshing OAuth token:', error);
    throw error;
  }
}

/**
 * Get valid access token for a user, refreshing if necessary
 */
async function getValidAccessToken(userId) {
  await connectToDatabase();
  
  const integration = await GitLabIntegration.findOne({ 
    userId, 
    isActive: true,
    tokenType: 'oauth'
  });
  
  if (!integration) {
    throw new Error('No OAuth integration found for user');
  }
  
  // Check if token is expired or will expire soon (within 5 minutes)
  const now = new Date();
  const expiresAt = new Date(integration.tokenExpiresAt);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  if (expiresAt <= fiveMinutesFromNow) {
    console.log(`Token expires at ${expiresAt}, refreshing...`);
    const newToken = await refreshOAuthToken(integration);
    return newToken;
  }
  
  return decrypt(integration.accessToken);
}

/**
 * Make authenticated request to GitLab API using OAuth token
 */
async function gitlabOAuthRequest(endpoint, userId, options = {}) {
  const accessToken = await getValidAccessToken(userId);
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

  // Remove custom options to avoid fetch errors
  delete config.apiBase;

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  config.signal = controller.signal;

  console.log(`GitLab OAuth API Request: ${url.replace(/\?.*$/, '?...')}`);
  
  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorData = null;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = { message: await response.text() };
        }
      } catch (parseError) {
        errorData = { message: `HTTP ${response.status}` };
      }
      
      const error = new Error(`GitLab API error: ${errorData.message || response.statusText}`);
      error.status = response.status;
      error.response = errorData;
      
      // Mark specific error types
      if (response.status === 401) error.isAuthError = true;
      if (response.status === 403) error.isPermissionError = true;
      if (response.status === 404) error.isNotFoundError = true;
      if (response.status === 429) error.isRateLimitError = true;
      
      throw error;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      const timeoutError = new Error('GitLab API request timeout');
      timeoutError.isTimeoutError = true;
      throw timeoutError;
    }
    
    throw error;
  }
}

/**
 * GitLab OAuth API Class
 * Provides OAuth-based GitLab API operations
 */
export class GitLabOAuthAPI {
  constructor(userId) {
    this.userId = userId;
    this.apiBase = GITLAB_API_BASE;
  }

  /**
   * Get current user information
   */
  async getCurrentUser() {
    return await gitlabOAuthRequest('/user', this.userId);
  }

  /**
   * Get user's projects
   */
  async getUserProjects(options = {}) {
    const params = new URLSearchParams({
      membership: 'true',
      per_page: options.perPage || 100,
      page: options.page || 1,
      order_by: 'last_activity_at',
      sort: 'desc',
      ...options.params
    });
    
    return await gitlabOAuthRequest(`/projects?${params}`, this.userId);
  }

  /**
   * Get commits for a specific project
   */
  async getProjectCommits(projectId, options = {}) {
    const params = new URLSearchParams({
      per_page: options.perPage || 100,
      page: options.page || 1,
      ...options.params
    });
    
    if (options.since) params.set('since', options.since);
    if (options.until) params.set('until', options.until);
    if (options.author) params.set('author', options.author);
    
    return await gitlabOAuthRequest(`/projects/${projectId}/repository/commits?${params}`, this.userId);
  }

  /**
   * Get user's commit activity across all projects
   */
  async getUserCommitActivity(options = {}) {
    try {
      console.log(`Fetching commit activity for user ${this.userId}`);
      
      // Get current user info
      const currentUser = await this.getCurrentUser();
      console.log(`Current user: ${currentUser.username} (${currentUser.name})`);
      
      // Get user's projects
      const projects = await this.getUserProjects({ perPage: 100 });
      console.log(`Found ${projects.length} projects for user`);
      
      if (projects.length === 0) {
        return {
          commits: [],
          projects: [],
          user: currentUser,
          totalCommits: 0,
          activeProjects: 0
        };
      }
      
      const commitActivity = [];
      const errors = [];
      
      // Set date range (default to last 90 days)
      const since = options.since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const until = options.until;
      
      // Fetch commits from each project
      for (const project of projects) {
        try {
          console.log(`Fetching commits for project: ${project.name}`);
          
          const commits = await this.getProjectCommits(project.id, {
            since,
            until,
            author: currentUser.email || currentUser.username,
            perPage: 100
          });
          
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
          console.log(`Found ${commits.length} commits in project ${project.name}`);
        } catch (error) {
          console.warn(`Failed to fetch commits for project ${project.name}:`, error.message);
          errors.push({
            project: project.name,
            projectId: project.id,
            error: error.message
          });
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
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Error fetching user commit activity:', error);
      throw error;
    }
  }

  /**
   * Get user's issues
   */
  async getUserIssues(options = {}) {
    const params = new URLSearchParams({
      scope: 'assigned_to_me',
      state: options.state || 'opened',
      per_page: options.perPage || 50,
      page: options.page || 1,
      ...options.params
    });
    
    return await gitlabOAuthRequest(`/issues?${params}`, this.userId);
  }

  /**
   * Get user's merge requests
   */
  async getUserMergeRequests(options = {}) {
    const params = new URLSearchParams({
      scope: 'assigned_to_me',
      state: options.state || 'opened',
      per_page: options.perPage || 50,
      page: options.page || 1,
      ...options.params
    });
    
    return await gitlabOAuthRequest(`/merge_requests?${params}`, this.userId);
  }

  /**
   * Test OAuth connection
   */
  async testConnection() {
    try {
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
        tokenType: 'oauth',
        projectsError
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.status,
        tokenType: 'oauth'
      };
    }
  }

  /**
   * Get user's repositories with detailed information
   */
  async getUserRepositories(options = {}) {
    const { includeStats = false, includeLanguages = false, owned = false } = options;
    
    try {
      const params = new URLSearchParams({
        per_page: '100',
        order_by: 'updated_at',
        sort: 'desc',
        membership: 'true'
      });
      
      if (owned) {
        params.append('owned', 'true');
      }
      
      const projects = await gitlabOAuthRequest(`/projects?${params}`, this.userId);
      
      if (!projects || projects.length === 0) {
        return [];
      }
      
      // Enhance projects with additional data
      const enhancedProjects = await Promise.all(
        projects.slice(0, 50).map(async (project) => {
          try {
            const enhancements = {};
            
            if (includeStats) {
              // Get project statistics
              try {
                const stats = await gitlabOAuthRequest(`/projects/${project.id}/statistics`, this.userId);
                enhancements.statistics = stats;
              } catch (e) {
                enhancements.statistics = null;
              }
              
              // Get recent commits count
              try {
                const recentCommits = await gitlabOAuthRequest(
                  `/projects/${project.id}/repository/commits?since=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}&per_page=100`,
                  this.userId
                );
                enhancements.recent_commits_count = recentCommits.length;
              } catch (e) {
                enhancements.recent_commits_count = 0;
              }
            }
            
            if (includeLanguages) {
              // Get programming languages
              try {
                const languages = await gitlabOAuthRequest(`/projects/${project.id}/languages`, this.userId);
                enhancements.languages = languages;
              } catch (e) {
                enhancements.languages = {};
              }
            }
            
            // Get project members count
            try {
              const members = await gitlabOAuthRequest(`/projects/${project.id}/members/all?per_page=100`, this.userId);
              enhancements.members_count = members.length;
            } catch (e) {
              enhancements.members_count = 0;
            }
            
            // Get branches count
            try {
              const branches = await gitlabOAuthRequest(`/projects/${project.id}/repository/branches?per_page=100`, this.userId);
              enhancements.branches_count = branches.length;
            } catch (e) {
              enhancements.branches_count = 0;
            }
            
            return {
              ...project,
              ...enhancements
            };
          } catch (error) {
            console.warn(`Failed to enhance project ${project.id}:`, error);
            return project;
          }
        })
      );
      
      return enhancedProjects;
    } catch (error) {
      console.error('Error fetching user repositories:', error);
      throw error;
    }
  }

  /**
   * Get user's merge requests with detailed information
   */
  async getUserMergeRequestsDetailed(options = {}) {
    const { state = 'all', scope = 'all', since, includeDetails = false } = options;
    
    try {
      const params = new URLSearchParams({
        state,
        scope,
        per_page: '100',
        order_by: 'updated_at',
        sort: 'desc'
      });
      
      if (since) {
        params.append('updated_after', since);
      }
      
      const mergeRequests = await gitlabOAuthRequest(`/merge_requests?${params}`, this.userId);
      
      if (includeDetails && mergeRequests.length > 0) {
        // Fetch additional details for each MR
        const detailedMRs = await Promise.all(
          mergeRequests.slice(0, 20).map(async (mr) => {
            try {
              const [changes, approvals, discussions] = await Promise.all([
                gitlabOAuthRequest(`/projects/${mr.project_id}/merge_requests/${mr.iid}/changes`, this.userId).catch(() => null),
                gitlabOAuthRequest(`/projects/${mr.project_id}/merge_requests/${mr.iid}/approvals`, this.userId).catch(() => null),
                gitlabOAuthRequest(`/projects/${mr.project_id}/merge_requests/${mr.iid}/discussions`, this.userId).catch(() => [])
              ]);
              
              return {
                ...mr,
                changes: changes?.changes || [],
                approvals: approvals || null,
                discussions: discussions || [],
                stats: {
                  additions: changes?.changes?.reduce((sum, change) => sum + (change.additions || 0), 0) || 0,
                  deletions: changes?.changes?.reduce((sum, change) => sum + (change.deletions || 0), 0) || 0,
                  files_changed: changes?.changes?.length || 0,
                  comments: discussions?.length || 0
                }
              };
            } catch (error) {
              console.warn(`Failed to fetch details for MR ${mr.iid}:`, error);
              return mr;
            }
          })
        );
        
        return detailedMRs;
      }
      
      return mergeRequests || [];
    } catch (error) {
      console.error('Error fetching user merge requests:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive user activity analytics
   */
  async getUserAnalytics(options = {}) {
    const { since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() } = options;
    
    try {
      console.log('🔍 Fetching comprehensive GitLab analytics...');
      
      // Fetch all data in parallel
      const [
        commitActivity,
        mergeRequests,
        issues,
        repositories
      ] = await Promise.all([
        this.getUserCommitActivity({ since }),
        this.getUserMergeRequestsDetailed({ since, includeDetails: true }),
        this.getUserIssues({ since }),
        this.getUserRepositories({ includeStats: true, includeLanguages: true })
      ]);
      
      // Calculate comprehensive analytics
      const analytics = this.calculateAnalytics({
        commits: commitActivity.commits,
        mergeRequests,
        issues,
        repositories,
        since
      });
      
      return {
        commits: commitActivity.commits,
        merge_requests: mergeRequests,
        issues,
        repositories,
        analytics,
        summary: {
          total_commits: commitActivity.totalCommits,
          total_merge_requests: mergeRequests.length,
          total_issues: issues.length,
          total_repositories: repositories.length,
          active_repositories: commitActivity.activeProjects,
          period_start: since,
          period_end: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive analytics from GitLab data
   */
  calculateAnalytics(data) {
    const { commits, mergeRequests, issues, repositories, since } = data;
    
    // Time-based analytics
    const timeAnalytics = this.calculateTimeAnalytics(commits, since);
    
    // Repository analytics
    const repoAnalytics = this.calculateRepositoryAnalytics(repositories, commits);
    
    // Merge request analytics
    const mrAnalytics = this.calculateMergeRequestAnalytics(mergeRequests);
    
    // Issue analytics
    const issueAnalytics = this.calculateIssueAnalytics(issues);
    
    // Language analytics
    const languageAnalytics = this.calculateLanguageAnalytics(repositories);
    
    // Productivity metrics
    const productivityMetrics = this.calculateProductivityMetrics({
      commits,
      mergeRequests,
      issues,
      since
    });
    
    return {
      time: timeAnalytics,
      repositories: repoAnalytics,
      merge_requests: mrAnalytics,
      issues: issueAnalytics,
      languages: languageAnalytics,
      productivity: productivityMetrics
    };
  }

  calculateTimeAnalytics(commits, since) {
    const sinceDate = new Date(since);
    const now = new Date();
    const daysDiff = Math.ceil((now - sinceDate) / (1000 * 60 * 60 * 24));
    
    const commitsByDate = {};
    const commitsByHour = new Array(24).fill(0);
    const commitsByDay = new Array(7).fill(0);
    
    commits.forEach(commit => {
      const date = new Date(commit.created_at);
      const dateStr = date.toISOString().split('T')[0];
      
      commitsByDate[dateStr] = (commitsByDate[dateStr] || 0) + 1;
      commitsByHour[date.getHours()]++;
      commitsByDay[date.getDay()]++;
    });
    
    return {
      commits_by_date: commitsByDate,
      commits_by_hour: commitsByHour,
      commits_by_day: commitsByDay,
      average_commits_per_day: commits.length / daysDiff,
      most_active_day: commitsByDay.indexOf(Math.max(...commitsByDay)),
      most_active_hour: commitsByHour.indexOf(Math.max(...commitsByHour)),
      streak_days: this.calculateCommitStreak(commitsByDate)
    };
  }

  calculateRepositoryAnalytics(repositories, commits) {
    const repoCommits = {};
    commits.forEach(commit => {
      const repoName = commit.project?.name || 'Unknown';
      repoCommits[repoName] = (repoCommits[repoName] || 0) + 1;
    });
    
    const totalStars = repositories.reduce((sum, repo) => sum + (repo.star_count || 0), 0);
    const totalForks = repositories.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
    const totalSize = repositories.reduce((sum, repo) => sum + (repo.statistics?.repository_size || 0), 0);
    
    return {
      total_repositories: repositories.length,
      total_stars: totalStars,
      total_forks: totalForks,
      total_size_mb: Math.round(totalSize / (1024 * 1024)),
      commits_by_repository: repoCommits,
      most_active_repository: Object.entries(repoCommits).sort(([,a], [,b]) => b - a)[0]?.[0],
      repository_types: this.categorizeRepositories(repositories)
    };
  }

  calculateMergeRequestAnalytics(mergeRequests) {
    const states = { opened: 0, merged: 0, closed: 0 };
    let totalAdditions = 0;
    let totalDeletions = 0;
    let totalComments = 0;
    
    mergeRequests.forEach(mr => {
      states[mr.state] = (states[mr.state] || 0) + 1;
      if (mr.stats) {
        totalAdditions += mr.stats.additions || 0;
        totalDeletions += mr.stats.deletions || 0;
        totalComments += mr.stats.comments || 0;
      }
    });
    
    return {
      total: mergeRequests.length,
      by_state: states,
      total_additions: totalAdditions,
      total_deletions: totalDeletions,
      total_comments: totalComments,
      average_size: mergeRequests.length > 0 ? Math.round((totalAdditions + totalDeletions) / mergeRequests.length) : 0,
      merge_rate: states.merged / Math.max(1, mergeRequests.length)
    };
  }

  calculateIssueAnalytics(issues) {
    const states = { opened: 0, closed: 0 };
    const labels = {};
    
    issues.forEach(issue => {
      states[issue.state] = (states[issue.state] || 0) + 1;
      issue.labels?.forEach(label => {
        labels[label] = (labels[label] || 0) + 1;
      });
    });
    
    return {
      total: issues.length,
      by_state: states,
      common_labels: Object.entries(labels).sort(([,a], [,b]) => b - a).slice(0, 10),
      close_rate: states.closed / Math.max(1, issues.length)
    };
  }

  calculateLanguageAnalytics(repositories) {
    const languages = {};
    let totalBytes = 0;
    
    repositories.forEach(repo => {
      if (repo.languages) {
        Object.entries(repo.languages).forEach(([lang, bytes]) => {
          languages[lang] = (languages[lang] || 0) + bytes;
          totalBytes += bytes;
        });
      }
    });
    
    const languagePercentages = Object.entries(languages).map(([lang, bytes]) => ({
      language: lang,
      bytes,
      percentage: (bytes / totalBytes) * 100
    })).sort((a, b) => b.bytes - a.bytes);
    
    return {
      total_languages: Object.keys(languages).length,
      languages: languagePercentages,
      primary_language: languagePercentages[0]?.language,
      total_code_bytes: totalBytes
    };
  }

  calculateProductivityMetrics(data) {
    const { commits, mergeRequests, issues, since } = data;
    const sinceDate = new Date(since);
    const daysDiff = Math.ceil((new Date() - sinceDate) / (1000 * 60 * 60 * 24));
    
    const totalAdditions = commits.reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0);
    const totalDeletions = commits.reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0);
    
    return {
      commits_per_day: commits.length / daysDiff,
      lines_per_day: (totalAdditions + totalDeletions) / daysDiff,
      merge_requests_per_week: (mergeRequests.length / daysDiff) * 7,
      issues_per_week: (issues.length / daysDiff) * 7,
      code_churn: totalDeletions / Math.max(1, totalAdditions),
      productivity_score: this.calculateProductivityScore({
        commits: commits.length,
        mergeRequests: mergeRequests.length,
        issues: issues.length,
        days: daysDiff
      })
    };
  }

  calculateCommitStreak(commitsByDate) {
    const dates = Object.keys(commitsByDate).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let lastDate = null;
    
    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      if (lastDate && (date - lastDate) === 24 * 60 * 60 * 1000) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      lastDate = date;
    });
    
    return maxStreak;
  }

  categorizeRepositories(repositories) {
    const types = { public: 0, private: 0, forked: 0, archived: 0 };
    
    repositories.forEach(repo => {
      if (repo.visibility === 'public') types.public++;
      if (repo.visibility === 'private') types.private++;
      if (repo.forked_from_project) types.forked++;
      if (repo.archived) types.archived++;
    });
    
    return types;
  }

  calculateProductivityScore(data) {
    const { commits, mergeRequests, issues, days } = data;
    
    // Weighted scoring system
    const commitScore = Math.min(commits / days * 10, 50); // Max 50 points
    const mrScore = Math.min(mergeRequests / days * 20, 30); // Max 30 points
    const issueScore = Math.min(issues / days * 15, 20); // Max 20 points
    
    return Math.round(commitScore + mrScore + issueScore);
  }
}

/**
 * Helper function to get user's commit activity using OAuth
 */
export async function getUserCommitActivity(userId, options = {}) {
  const api = new GitLabOAuthAPI(userId);
  return await api.getUserCommitActivity(options);
}

/**
 * Helper function to get user's projects using OAuth
 */
export async function getUserProjects(userId, options = {}) {
  const api = new GitLabOAuthAPI(userId);
  return await api.getUserProjects(options);
}

/**
 * Helper function to test OAuth connection
 */
export async function testOAuthConnection(userId) {
  const api = new GitLabOAuthAPI(userId);
  return await api.testConnection();
}