import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import { GitLabOAuthAPI } from '../../../../utils/gitlab-oauth-api.js';
import { GitLabAPI } from '../../../../utils/gitlab-api.js';
import { decrypt } from '../../../../utils/encryption.js';

/**
 * Enhanced GitLab Insights Endpoint
 * Provides comprehensive insights including repositories, merge requests, issues, and advanced analytics
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user from database
    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const includeRepositories = searchParams.get('includeRepositories') !== 'false';
    const includeMergeRequests = searchParams.get('includeMergeRequests') !== 'false';
    const includeIssues = searchParams.get('includeIssues') !== 'false';
    const includeAnalytics = searchParams.get('includeAnalytics') !== 'false';
    const includeLanguages = searchParams.get('includeLanguages') !== 'false';

    // Find the best available integration (OAuth preferred)
    let integration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'oauth',
      isActive: true
    });

    let tokenType = 'oauth';
    let insightsData;

    if (integration && session.gitlabAccessToken) {
      // Use OAuth API
      console.log(`🔐 Using OAuth integration for insights: ${user.gitlabUsername}`);
      
      try {
        const oauthAPI = new GitLabOAuthAPI(user._id);
        insightsData = await oauthAPI.getUserAnalytics({ since });
      } catch (oauthError) {
        console.warn('OAuth API failed for insights, trying PAT fallback:', oauthError.message);
        integration = null; // Force PAT fallback
      }
    }

    // Fallback to PAT if OAuth not available or failed
    if (!integration || !insightsData) {
      integration = await GitLabIntegration.findOne({
        userId: user._id,
        tokenType: 'personal_access_token',
        isActive: true
      });

      if (!integration) {
        return Response.json({ 
          error: 'No GitLab integration found',
          suggestion: 'Please connect your GitLab account via OAuth or Personal Access Token'
        }, { status: 404 });
      }

      console.log(`🔑 Using PAT integration for insights: ${user.gitlabUsername}`);
      tokenType = 'pat';

      // Use PAT API with manual data aggregation
      const accessToken = decrypt(integration.accessToken);
      if (!accessToken) {
        return Response.json({ 
          error: 'Failed to decrypt access token',
          suggestion: 'Please reconnect your GitLab account'
        }, { status: 500 });
      }

      const patAPI = new GitLabAPI(accessToken);
      
      try {
        // Fetch data using PAT API
        const [commitActivity, projects, mergeRequests, issues] = await Promise.all([
          patAPI.getUserCommitActivity({ since }),
          includeRepositories ? patAPI.getUserProjects() : [],
          includeMergeRequests ? patAPI.getUserMergeRequests() : [],
          includeIssues ? patAPI.getUserIssues() : []
        ]);

        // Structure data similar to OAuth response
        insightsData = {
          commits: commitActivity.commits || [],
          merge_requests: mergeRequests || [],
          issues: issues || [],
          repositories: projects || [],
          summary: {
            total_commits: commitActivity.totalCommits || 0,
            total_merge_requests: mergeRequests?.length || 0,
            total_issues: issues?.length || 0,
            total_repositories: projects?.length || 0,
            active_repositories: commitActivity.activeProjects || 0,
            period_start: since,
            period_end: new Date().toISOString()
          }
        };

        // Calculate basic analytics for PAT
        if (includeAnalytics) {
          insightsData.analytics = calculateBasicAnalytics(insightsData, since);
        }
      } catch (patError) {
        console.error('PAT API failed for insights:', patError);
        return Response.json({ 
          error: 'Failed to fetch GitLab insights',
          details: patError.message,
          tokenType
        }, { status: 500 });
      }
    }

    // Build comprehensive response
    const response = {
      success: true,
      summary: insightsData.summary,
      insights: {
        overview: generateOverviewInsights(insightsData),
        productivity: generateProductivityInsights(insightsData, since),
        collaboration: generateCollaborationInsights(insightsData),
        quality: generateQualityInsights(insightsData)
      },
      meta: {
        tokenType,
        since,
        integrationId: integration._id,
        lastSync: new Date().toISOString(),
        dataIncluded: {
          repositories: includeRepositories,
          mergeRequests: includeMergeRequests,
          issues: includeIssues,
          analytics: includeAnalytics,
          languages: includeLanguages
        }
      }
    };

    // Add detailed data based on query parameters
    if (includeRepositories) {
      response.repositories = insightsData.repositories?.map(repo => ({
        id: repo.id,
        name: repo.name,
        path: repo.path_with_namespace,
        description: repo.description,
        visibility: repo.visibility,
        star_count: repo.star_count || 0,
        forks_count: repo.forks_count || 0,
        last_activity_at: repo.last_activity_at,
        languages: repo.languages || {},
        statistics: repo.statistics || null,
        recent_commits_count: repo.recent_commits_count || 0,
        members_count: repo.members_count || 0,
        branches_count: repo.branches_count || 0,
        web_url: repo.web_url
      }));
    }

    if (includeMergeRequests) {
      response.merge_requests = insightsData.merge_requests?.map(mr => ({
        id: mr.id,
        iid: mr.iid,
        title: mr.title,
        description: mr.description,
        state: mr.state,
        created_at: mr.created_at,
        updated_at: mr.updated_at,
        merged_at: mr.merged_at,
        project_id: mr.project_id,
        source_branch: mr.source_branch,
        target_branch: mr.target_branch,
        author: mr.author,
        assignees: mr.assignees || [],
        reviewers: mr.reviewers || [],
        stats: mr.stats || null,
        web_url: mr.web_url
      }));
    }

    if (includeIssues) {
      response.issues = insightsData.issues?.map(issue => ({
        id: issue.id,
        iid: issue.iid,
        title: issue.title,
        description: issue.description,
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        project_id: issue.project_id,
        author: issue.author,
        assignees: issue.assignees || [],
        labels: issue.labels || [],
        milestone: issue.milestone,
        web_url: issue.web_url
      }));
    }

    if (includeAnalytics && insightsData.analytics) {
      response.analytics = insightsData.analytics;
    }

    // Always include commits for basic tracking
    response.commits = insightsData.commits?.slice(0, 100).map(commit => ({
      id: commit.id,
      title: commit.title,
      message: commit.message,
      created_at: commit.created_at,
      author_name: commit.author_name,
      author_email: commit.author_email,
      project: commit.project,
      stats: commit.stats || null,
      web_url: commit.web_url
    }));

    // Update last sync time
    await GitLabIntegration.updateOne(
      { _id: integration._id },
      { 
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date()
      }
    );

    return Response.json(response);
  } catch (error) {
    console.error('Error in GitLab insights:', error);
    return Response.json({ 
      error: 'Failed to fetch GitLab insights',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Generate overview insights
 */
function generateOverviewInsights(data) {
  const { commits, merge_requests, issues, repositories } = data;
  
  return {
    total_contributions: commits.length + merge_requests.length + issues.length,
    most_active_repository: getMostActiveRepository(commits),
    primary_language: getPrimaryLanguage(repositories),
    contribution_streak: calculateContributionStreak(commits),
    activity_score: calculateActivityScore(data)
  };
}

/**
 * Generate productivity insights
 */
function generateProductivityInsights(data, since) {
  const { commits, merge_requests } = data;
  const sinceDate = new Date(since);
  const daysDiff = Math.ceil((new Date() - sinceDate) / (1000 * 60 * 60 * 24));
  
  const totalAdditions = commits.reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0);
  const totalDeletions = commits.reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0);
  
  return {
    commits_per_day: commits.length / daysDiff,
    lines_per_day: (totalAdditions + totalDeletions) / daysDiff,
    code_efficiency: totalAdditions / Math.max(1, totalDeletions),
    merge_request_velocity: merge_requests.length / Math.max(1, daysDiff) * 7, // per week
    productivity_trend: calculateProductivityTrend(commits, daysDiff)
  };
}

/**
 * Generate collaboration insights
 */
function generateCollaborationInsights(data) {
  const { merge_requests, issues, repositories } = data;
  
  const totalReviewers = merge_requests.reduce((sum, mr) => sum + (mr.reviewers?.length || 0), 0);
  const totalAssignees = issues.reduce((sum, issue) => sum + (issue.assignees?.length || 0), 0);
  
  return {
    merge_requests_created: merge_requests.length,
    merge_requests_merged: merge_requests.filter(mr => mr.state === 'merged').length,
    issues_created: issues.length,
    issues_closed: issues.filter(issue => issue.state === 'closed').length,
    collaboration_score: calculateCollaborationScore(data),
    team_repositories: repositories.filter(repo => repo.members_count > 1).length
  };
}

/**
 * Generate code quality insights
 */
function generateQualityInsights(data) {
  const { commits, merge_requests } = data;
  
  const avgCommitSize = commits.length > 0 ? 
    commits.reduce((sum, commit) => sum + ((commit.stats?.additions || 0) + (commit.stats?.deletions || 0)), 0) / commits.length : 0;
  
  const mrWithReviews = merge_requests.filter(mr => mr.discussions?.length > 0 || mr.approvals?.approved_by?.length > 0).length;
  
  return {
    average_commit_size: Math.round(avgCommitSize),
    commit_message_quality: calculateCommitMessageQuality(commits),
    code_review_coverage: merge_requests.length > 0 ? mrWithReviews / merge_requests.length : 0,
    quality_score: calculateQualityScore(data)
  };
}

/**
 * Helper functions for insights calculation
 */
function getMostActiveRepository(commits) {
  const repoCommits = {};
  commits.forEach(commit => {
    const repoName = commit.project?.name || 'Unknown';
    repoCommits[repoName] = (repoCommits[repoName] || 0) + 1;
  });
  
  return Object.entries(repoCommits).sort(([,a], [,b]) => b - a)[0]?.[0] || null;
}

function getPrimaryLanguage(repositories) {
  const languages = {};
  repositories.forEach(repo => {
    if (repo.languages) {
      Object.entries(repo.languages).forEach(([lang, bytes]) => {
        languages[lang] = (languages[lang] || 0) + bytes;
      });
    }
  });
  
  return Object.entries(languages).sort(([,a], [,b]) => b - a)[0]?.[0] || null;
}

function calculateContributionStreak(commits) {
  const commitDates = [...new Set(commits.map(commit => 
    new Date(commit.created_at).toISOString().split('T')[0]
  ))].sort();
  
  let currentStreak = 0;
  let maxStreak = 0;
  let lastDate = null;
  
  commitDates.forEach(dateStr => {
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

function calculateActivityScore(data) {
  const { commits, merge_requests, issues } = data;
  
  // Weighted scoring
  const commitScore = Math.min(commits.length * 2, 40);
  const mrScore = Math.min(merge_requests.length * 5, 30);
  const issueScore = Math.min(issues.length * 3, 30);
  
  return Math.round(commitScore + mrScore + issueScore);
}

function calculateProductivityTrend(commits, totalDays) {
  if (totalDays < 14) return 'insufficient_data';
  
  const midPoint = Math.floor(totalDays / 2);
  const firstHalf = commits.filter(commit => {
    const commitDate = new Date(commit.created_at);
    const daysAgo = Math.ceil((new Date() - commitDate) / (1000 * 60 * 60 * 24));
    return daysAgo > midPoint;
  }).length;
  
  const secondHalf = commits.length - firstHalf;
  const firstHalfRate = firstHalf / midPoint;
  const secondHalfRate = secondHalf / (totalDays - midPoint);
  
  if (secondHalfRate > firstHalfRate * 1.2) return 'increasing';
  if (secondHalfRate < firstHalfRate * 0.8) return 'decreasing';
  return 'stable';
}

function calculateCollaborationScore(data) {
  const { merge_requests, issues, repositories } = data;
  
  const mrScore = merge_requests.filter(mr => mr.state === 'merged').length * 10;
  const issueScore = issues.filter(issue => issue.state === 'closed').length * 5;
  const teamRepoScore = repositories.filter(repo => repo.members_count > 1).length * 15;
  
  return Math.min(mrScore + issueScore + teamRepoScore, 100);
}

function calculateCommitMessageQuality(commits) {
  if (commits.length === 0) return 0;
  
  const qualityCommits = commits.filter(commit => {
    const message = commit.message || commit.title || '';
    return message.length > 10 && 
           message.length < 100 && 
           !message.toLowerCase().includes('fix') && 
           !message.toLowerCase().includes('update');
  }).length;
  
  return qualityCommits / commits.length;
}

function calculateQualityScore(data) {
  const { commits, merge_requests } = data;
  
  const commitQuality = calculateCommitMessageQuality(commits) * 30;
  const mrQuality = merge_requests.length > 0 ? 
    (merge_requests.filter(mr => mr.description && mr.description.length > 50).length / merge_requests.length) * 40 : 0;
  const reviewQuality = merge_requests.length > 0 ?
    (merge_requests.filter(mr => mr.discussions?.length > 0).length / merge_requests.length) * 30 : 0;
  
  return Math.round(commitQuality + mrQuality + reviewQuality);
}

/**
 * Calculate basic analytics for PAT users (simplified version)
 */
function calculateBasicAnalytics(data, since) {
  const { commits, merge_requests, issues, repositories } = data;
  const sinceDate = new Date(since);
  const daysDiff = Math.ceil((new Date() - sinceDate) / (1000 * 60 * 60 * 24));

  // Time analytics
  const commitsByDate = {};
  commits.forEach(commit => {
    const date = new Date(commit.created_at).toISOString().split('T')[0];
    commitsByDate[date] = (commitsByDate[date] || 0) + 1;
  });

  // Repository analytics
  const repoCommits = {};
  commits.forEach(commit => {
    const repoName = commit.project_name || commit.project?.name || 'Unknown';
    repoCommits[repoName] = (repoCommits[repoName] || 0) + 1;
  });

  // Merge request analytics
  const mrStates = { opened: 0, merged: 0, closed: 0 };
  merge_requests.forEach(mr => {
    mrStates[mr.state] = (mrStates[mr.state] || 0) + 1;
  });

  // Issue analytics
  const issueStates = { opened: 0, closed: 0 };
  issues.forEach(issue => {
    issueStates[issue.state] = (issueStates[issue.state] || 0) + 1;
  });

  // Productivity metrics
  const totalAdditions = commits.reduce((sum, commit) => sum + (commit.stats?.additions || 0), 0);
  const totalDeletions = commits.reduce((sum, commit) => sum + (commit.stats?.deletions || 0), 0);

  return {
    time: {
      commits_by_date: commitsByDate,
      average_commits_per_day: commits.length / daysDiff,
      total_days: daysDiff
    },
    repositories: {
      total_repositories: repositories.length,
      commits_by_repository: repoCommits,
      most_active_repository: Object.entries(repoCommits).sort(([,a], [,b]) => b - a)[0]?.[0]
    },
    merge_requests: {
      total: merge_requests.length,
      by_state: mrStates,
      merge_rate: mrStates.merged / Math.max(1, merge_requests.length)
    },
    issues: {
      total: issues.length,
      by_state: issueStates,
      close_rate: issueStates.closed / Math.max(1, issues.length)
    },
    productivity: {
      commits_per_day: commits.length / daysDiff,
      lines_per_day: (totalAdditions + totalDeletions) / daysDiff,
      total_additions: totalAdditions,
      total_deletions: totalDeletions,
      code_churn: totalDeletions / Math.max(1, totalAdditions)
    }
  };
}