import NextAuth from 'next-auth';
import GitLabProvider from 'next-auth/providers/gitlab';
import { connectToDatabase } from '../../../utils/database.js';
import User from '../../../models/User.js';
import College from '../../../models/College.js';

/**
 * Refresh GitLab OAuth token using refresh token
 */
async function refreshGitLabOAuthToken(token) {
  try {
    if (!token.gitlabRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${process.env.GITLAB_ISSUER}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        refresh_token: token.gitlabRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Token refresh failed: ${response.status} ${errorText}`;
      
      if (response.status === 400) {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'invalid_grant') {
            errorMessage = 'OAuth refresh token has expired or been revoked. User needs to re-authenticate.';
          }
        } catch (parseError) {
          // Keep original error message if JSON parsing fails
        }
      }
      
      throw new Error(errorMessage);
    }

    const refreshedTokens = await response.json();
    
    return {
      ...token,
      gitlabAccessToken: refreshedTokens.access_token,
      gitlabRefreshToken: refreshedTokens.refresh_token || token.gitlabRefreshToken,
      gitlabTokenExpires: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing GitLab OAuth token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions = {
  providers: [
    {
      id: "gitlab",
      name: "GitLab",
      type: "oauth",
      authorization: {
        url: `${process.env.GITLAB_ISSUER}/oauth/authorize`,
        params: {
          scope: "read_user read_api read_repository",
          response_type: "code",
        },
      },
      token: `${process.env.GITLAB_ISSUER}/oauth/token`,
      userinfo: `${process.env.GITLAB_ISSUER}/api/v4/user`,
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.username,
        }
      },
    }
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('🔍 SignIn Debug - Starting authentication for:', {
          gitlabUsername: profile.username,
          gitlabId: profile.id,
          name: profile.name,
          email: profile.email
        });

        // Connect to database
        await connectToDatabase();
        
        // Check if user exists in our system by GitLab username
        let existingUser = await User.findByGitLabUsername(profile.username);
        
        console.log('🔍 SignIn Debug - Database lookup result:', {
          username: profile.username,
          found: !!existingUser,
          userRole: existingUser?.role,
          userCollege: existingUser?.college?.name
        });

        if (existingUser) {
          // User exists, allow sign in
          return true;
        } else {
          // User doesn't exist, redirect to onboarding
          console.log('🔍 SignIn Debug - User not found, redirecting to onboarding');
          return '/onboarding';
        }
      } catch (error) {
        console.error('❌ SignIn Error:', error);
        return false;
      }
    },

    async jwt({ token, account, profile, trigger }) {
      // Handle token refresh
      if (trigger === 'update' || (token.gitlabTokenExpires && Date.now() / 1000 > token.gitlabTokenExpires)) {
        try {
          console.log('🔄 Refreshing user data in JWT...');
          await connectToDatabase();
          const user = await User.findByGitLabUsername(token.gitlabUsername, 'college cohortId');
          
          if (user) {
            token.name = user.name;
            token.email = user.email;
            token.role = user.role;
            token.college = user.college;
            token.assignedBy = user.assignedBy;
            token.userId = user._id.toString();
            token.sessionVersion = user.sessionVersion;
            token.lastRefresh = new Date().toISOString();
            
            // Add cohort information
            if (user.cohortId) {
              token.cohortId = user.cohortId.toString();
              
              try {
                const { getDatabase } = await import('../../../utils/database.js');
                const db = await getDatabase();
                const cohort = await db.collection('cohorts').findOne({ _id: user.cohortId });
                if (cohort) {
                  token.cohortName = cohort.name;
                }
              } catch (cohortError) {
                console.error('Error fetching cohort details:', cohortError);
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing user data in JWT:', error);
        }
      }
      
      if (account && profile) {
        try {
          console.log('🔍 JWT Debug - Processing new login for:', {
            username: profile.username,
            id: profile.id,
            name: profile.name
          });

          await connectToDatabase();
          let user = await User.findByGitLabUsername(profile.username, 'college cohortId');
          
          // Store GitLab access token for API calls
          if (account.access_token) {
            token.gitlabAccessToken = account.access_token;
            token.gitlabRefreshToken = account.refresh_token;
            token.gitlabTokenExpires = account.expires_at;
          }
          
          if (user) {
            // Existing user - update their info and login time
            token.role = user.role;
            token.gitlabUsername = user.gitlabUsername;
            token.gitlabId = user.gitlabId;
            token.college = user.college;
            token.assignedBy = user.assignedBy;
            token.userId = user._id.toString();
            
            // Add cohort information
            if (user.cohortId) {
              token.cohortId = user.cohortId.toString();
              
              try {
                const { getDatabase } = await import('../../../utils/database.js');
                const db = await getDatabase();
                const cohort = await db.collection('cohorts').findOne({ _id: user.cohortId });
                if (cohort) {
                  token.cohortName = cohort.name;
                }
              } catch (cohortError) {
                console.error('Error fetching cohort details:', cohortError);
              }
            }
          }
        } catch (error) {
          console.error('❌ JWT Error:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      session.user.role = token.role;
      session.user.gitlabUsername = token.gitlabUsername;
      session.user.gitlabId = token.gitlabId;
      session.user.college = token.college;
      session.user.assignedBy = token.assignedBy;
      session.user.userId = token.userId;
      session.user.cohortId = token.cohortId;
      session.user.cohortName = token.cohortName;
      session.user.sessionVersion = token.sessionVersion;
      session.user.lastRefresh = token.lastRefresh;
      
      // Include GitLab tokens for API calls
      session.gitlabAccessToken = token.gitlabAccessToken;
      session.gitlabRefreshToken = token.gitlabRefreshToken;
      session.gitlabTokenExpires = token.gitlabTokenExpires;
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);