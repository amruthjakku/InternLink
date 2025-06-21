/**
 * GitLab API Wrapper Class
 * Handles all GitLab API interactions with proper error handling and rate limiting
 */

export class GitLabAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://gitlab.com/api/v4';
    this.rateLimitDelay = 100; // ms between requests
  }

  /**
   * Make authenticated request to GitLab API
   */
  async makeRequest(endpoint, options = {}) {
    try {
      // Add rate limiting delay
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitLab token expired or invalid');
        }
        if (response.status === 403) {
          throw new Error('GitLab API rate limit exceeded');
        }
        throw new Error(`GitLab API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`GitLab API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile() {
    return this.makeRequest('/user');
  }

  /**
   * Get user's projects with membership
   */
  async getUserProjects(page = 1, perPage = 100) {
    return this.makeRequest(`/projects?membership=true&page=${page}&per_page=${perPage}&order_by=last_activity_at&sort=desc`);
  }

  /**
   * Get commits for a specific project
   */
  async getProjectCommits(projectId, options = {}) {
    const { since, until, author, page = 1, perPage = 100 } = options;
    let endpoint = `/projects/${projectId}/repository/commits?page=${page}&per_page=${perPage}`;
    
    const params = new URLSearchParams();
    if (since) params.append('since', since);
    if (until) params.append('until', until);
    if (author) params.append('author', author);
    
    if (params.toString()) {
      endpoint += `&${params.toString()}`;
    }
    
    return this.makeRequest(endpoint);
  }

  /**
   * Get all commits by user across their projects
   */
  async getUserCommits(userEmail, since = null, until = null) {
    try {
      const projects = await this.getUserProjects();
      const allCommits = [];
      
      for (const project of projects) {
        try {
          const commits = await this.getProjectCommits(project.id, {
            since,
            until,
            author: userEmail
          });
          
          // Add project context to each commit
          const enrichedCommits = commits.map(commit => ({
            ...commit,
            project_name: project.name,
            project_id: project.id,
            project_url: project.web_url,
            project_path: project.path_with_namespace
          }));
          
          allCommits.push(...enrichedCommits);
        } catch (error) {
          console.error(`Error fetching commits for project ${project.name}:`, error);
          // Continue with other projects even if one fails
        }
      }
      
      // Sort by creation date (newest first)
      return allCommits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Error fetching user commits:', error);
      throw error;
    }
  }

  /**
   * Get commit details including stats
   */
  async getCommitDetails(projectId, commitSha) {
    return this.makeRequest(`/projects/${projectId}/repository/commits/${commitSha}`);
  }

  /**
   * Get issues for a project
   */
  async getProjectIssues(projectId, state = 'opened', page = 1, perPage = 100) {
    return this.makeRequest(`/projects/${projectId}/issues?state=${state}&page=${page}&per_page=${perPage}`);
  }

  /**
   * Get issues assigned to user
   */
  async getUserIssues(userId, state = 'opened') {
    return this.makeRequest(`/issues?assignee_id=${userId}&state=${state}&scope=assigned_to_me`);
  }

  /**
   * Get merge requests for a project
   */
  async getProjectMergeRequests(projectId, state = 'opened', page = 1, perPage = 100) {
    return this.makeRequest(`/projects/${projectId}/merge_requests?state=${state}&page=${page}&per_page=${perPage}`);
  }

  /**
   * Get merge requests authored by user
   */
  async getUserMergeRequests(userId, state = 'opened') {
    return this.makeRequest(`/merge_requests?author_id=${userId}&state=${state}&scope=created_by_me`);
  }

  /**
   * Get project languages
   */
  async getProjectLanguages(projectId) {
    return this.makeRequest(`/projects/${projectId}/languages`);
  }

  /**
   * Get project contributors
   */
  async getProjectContributors(projectId) {
    return this.makeRequest(`/projects/${projectId}/repository/contributors`);
  }

  /**
   * Get project statistics
   */
  async getProjectStatistics(projectId) {
    return this.makeRequest(`/projects/${projectId}/statistics`);
  }

  /**
   * Get user's contribution analytics
   */
  async getUserAnalytics(userEmail, since = null) {
    try {
      const projects = await this.getUserProjects();
      const analytics = {
        totalCommits: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        activeProjects: 0,
        languages: {},
        commitsByDate: {},
        projectActivity: []
      };

      for (const project of projects) {
        try {
          const commits = await this.getProjectCommits(project.id, {
            since,
            author: userEmail
          });

          if (commits.length > 0) {
            analytics.activeProjects++;
            analytics.totalCommits += commits.length;

            // Get project languages
            try {
              const languages = await this.getProjectLanguages(project.id);
              Object.keys(languages).forEach(lang => {
                analytics.languages[lang] = (analytics.languages[lang] || 0) + languages[lang];
              });
            } catch (error) {
              console.error(`Error fetching languages for ${project.name}:`, error);
            }

            // Process commits for detailed stats
            for (const commit of commits) {
              try {
                const commitDetails = await this.getCommitDetails(project.id, commit.id);
                analytics.totalAdditions += commitDetails.stats?.additions || 0;
                analytics.totalDeletions += commitDetails.stats?.deletions || 0;

                // Group commits by date
                const date = new Date(commit.created_at).toDateString();
                analytics.commitsByDate[date] = (analytics.commitsByDate[date] || 0) + 1;
              } catch (error) {
                console.error(`Error fetching commit details for ${commit.id}:`, error);
              }
            }

            analytics.projectActivity.push({
              projectName: project.name,
              projectUrl: project.web_url,
              commits: commits.length,
              lastActivity: commits[0]?.created_at
            });
          }
        } catch (error) {
          console.error(`Error processing project ${project.name}:`, error);
        }
      }

      return analytics;
    } catch (error) {
      console.error('Error generating user analytics:', error);
      throw error;
    }
  }

  /**
   * Search for projects
   */
  async searchProjects(query, page = 1, perPage = 20) {
    return this.makeRequest(`/projects?search=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`);
  }

  /**
   * Get project events (activity feed)
   */
  async getProjectEvents(projectId, page = 1, perPage = 100) {
    return this.makeRequest(`/projects/${projectId}/events?page=${page}&per_page=${perPage}`);
  }
}