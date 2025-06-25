import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has GitLab integration
    if (!user.gitlabIntegration?.accessToken && !user.gitlabIntegration?.personalAccessToken) {
      return NextResponse.json({ 
        error: 'GitLab not connected. Please connect your GitLab account first.' 
      }, { status: 400 });
    }

    const token = user.gitlabIntegration.accessToken || user.gitlabIntegration.personalAccessToken;
    const gitlabUrl = user.gitlabIntegration.gitlabUrl || 'https://gitlab.com';

    // Fetch merge requests from GitLab API
    const mergeRequests = await fetchUserMergeRequests(gitlabUrl, token, user.gitlabIntegration.username);

    return NextResponse.json({ 
      success: true,
      mergeRequests,
      total: mergeRequests.length
    });

  } catch (error) {
    console.error('Error fetching merge requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch merge requests' 
    }, { status: 500 });
  }
}

async function fetchUserMergeRequests(gitlabUrl, token, username) {
  try {
    const headers = {
      'Authorization': token.startsWith('glpat-') ? `Bearer ${token}` : `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // First, get user ID
    const userResponse = await fetch(`${gitlabUrl}/api/v4/user`, { headers });
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }
    const userData = await userResponse.json();
    const userId = userData.id;

    // Fetch merge requests authored by the user
    const mrResponse = await fetch(
      `${gitlabUrl}/api/v4/merge_requests?author_id=${userId}&per_page=100&order_by=updated_at&sort=desc`,
      { headers }
    );

    if (!mrResponse.ok) {
      throw new Error('Failed to fetch merge requests');
    }

    const mergeRequests = await mrResponse.json();

    // Enhance merge requests with additional data
    const enhancedMRs = await Promise.all(
      mergeRequests.map(async (mr) => {
        try {
          // Get detailed MR info including changes count
          const detailResponse = await fetch(
            `${gitlabUrl}/api/v4/projects/${mr.project_id}/merge_requests/${mr.iid}`,
            { headers }
          );
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            return {
              ...mr,
              changes_count: detailData.changes_count,
              user_notes_count: detailData.user_notes_count,
              upvotes: detailData.upvotes,
              downvotes: detailData.downvotes,
              source_project: detailData.source_project,
              target_project: detailData.target_project
            };
          }
          
          return mr;
        } catch (error) {
          console.error(`Error fetching details for MR ${mr.id}:`, error);
          return mr;
        }
      })
    );

    return enhancedMRs;

  } catch (error) {
    console.error('Error in fetchUserMergeRequests:', error);
    throw error;
  }
}