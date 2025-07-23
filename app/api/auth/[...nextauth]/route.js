import NextAuth from 'next-auth';
import GitLabProvider from 'next-auth/providers/gitlab';
import { connectToDatabase } from '../../../../lib/mongoose.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

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
      
      // Provide more specific error messages
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
    
    // Update the stored integration as well
    try {
      await connectToDatabase();
      const GitLabIntegration = (await import('../../../../models/GitLabIntegration.js')).default;
      const { encrypt } = await import('../../../../utils/encryption.js');
      
      await GitLabIntegration.updateOne(
        { gitlabUserId: parseInt(token.gitlabId) },
        {
          accessToken: encrypt(refreshedTokens.access_token),
          refreshToken: refreshedTokens.refresh_token ? encrypt(refreshedTokens.refresh_token) : undefined,
          tokenExpiresAt: new Date((refreshedTokens.expires_at || (Date.now() / 1000 + refreshedTokens.expires_in)) * 1000),
          updatedAt: new Date()
        }
      );
    } catch (dbError) {
      console.warn('Failed to update integration record:', dbError);
    }

    return refreshedTokens;
  } catch (error) {
    console.error('OAuth token refresh error:', error);
    throw error;
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
        console.log('🔍 GitLab Profile received:', {
          id: profile.id,
          username: profile.username,
          name: profile.name,
          email: profile.email
        });
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
          email: profile.email,
          hasUser: !!user,
          hasAccount: !!account,
          hasProfile: !!profile
        });

        // Connect to database
        console.log('🔍 SignIn Debug - Connecting to database...');
        await connectToDatabase();
        console.log('✅ SignIn Debug - Database connected');
        
        // Check if user exists in our system by GitLab username
        console.log('🔍 SignIn Debug - Looking up user:', profile.username);
        let existingUser = await User.findByGitLabUsername(profile.username);
        console.log('🔍 SignIn Debug - User lookup result:', !!existingUser);
        
        console.log('🔍 SignIn Debug - Database lookup result:', {
          username: profile.username,
          found: !!existingUser,
          userRole: existingUser?.role,
          userId: existingUser?._id?.toString()
        });
        
        if (!existingUser) {
          // Auto-register new GitLab users with pending status
          console.log(`🔄 SignIn Debug - Auto-registering new GitLab user: ${profile.username}`);
          
          try {
            const newUser = new User({
              gitlabUsername: profile.username.toLowerCase(),
              gitlabId: profile.id.toString(),
              name: profile.name,
              email: profile.email,
              role: 'AI Developer Intern', // Default role for new users
              profileImage: profile.avatar_url,
              assignedBy: 'auto-registration',
              lastLoginAt: new Date(),
              // Don't require college and assignedTechLead for auto-registration
              // These will be set during onboarding
            });
            
            await newUser.save(); // Validation will pass due to assignedBy: 'auto-registration'
            console.log(`✅ Auto-registered user: ${profile.username} with AI Developer Intern role`);
            
            // Use the newly created user
            existingUser = newUser;
          } catch (error) {
            console.error(`❌ Failed to auto-register user ${profile.username}:`, error);
            // If auto-registration fails, still allow sign-in but redirect to onboarding
            console.log(`🔄 Allowing sign-in for ${profile.username} - will redirect to onboarding`);
            return '/onboarding';
          }
        }
        
        // Update user's GitLab info and last login
        try {
          existingUser.gitlabId = profile.id.toString();
          existingUser.name = profile.name || existingUser.name;
          existingUser.email = profile.email || existingUser.email;
          existingUser.profileImage = profile.avatar_url || existingUser.profileImage;
          await existingUser.updateLastLogin();
          
          console.log(`✅ Successful login: ${profile.username} (${existingUser.role})`);
          return true;
        } catch (updateError) {
          console.error(`❌ Failed to update user ${profile.username}:`, updateError);
          return false;
        }
        
      } catch (error) {
        console.error('❌ Error during sign in:', error);
        return false;
      }
    },
    
    async jwt({ token, account, profile, trigger }) {
      console.log('🔍 JWT Debug - Token refresh trigger:', { 
        hasAccount: !!account, 
        hasProfile: !!profile, 
        trigger,
        existingUsername: token.gitlabUsername,
        existingRole: token.role
      });

      // Always check for role updates on subsequent calls
      if (!account && !profile && token.gitlabUsername) {
        try {
          await connectToDatabase();
          // Include cohort information in the populate
          let user = await User.findByGitLabUsername(token.gitlabUsername, 'college cohortId');
          
          if (user) {
            // Check if we need to force refresh based on recent updates or session version
            const shouldForceRefresh = user.lastTokenRefresh && 
              (!token.lastRefresh || new Date(user.lastTokenRefresh) > new Date(token.lastRefresh));
            
            const sessionVersionChanged = user.sessionVersion && 
              (!token.sessionVersion || user.sessionVersion > token.sessionVersion);
            
            // Always update token with latest user info (including role changes)
            const roleChanged = token.role !== user.role;
            const cohortChanged = token.cohortId !== (user.cohortId ? user.cohortId.toString() : null);
            
            if (roleChanged || cohortChanged || shouldForceRefresh || sessionVersionChanged) {
              console.log(`🔄 JWT Token refresh for ${user.gitlabUsername}: roleChanged=${roleChanged}, cohortChanged=${cohortChanged}, forceRefresh=${shouldForceRefresh}, versionChanged=${sessionVersionChanged}`);
            }
            
            token.role = user.role;
            token.college = user.college;
            token.assignedBy = user.assignedBy;
            token.userId = user._id.toString();
            token.sessionVersion = user.sessionVersion;
            token.lastRefresh = new Date().toISOString();
            
            // Add cohort information
            if (user.cohortId) {
              token.cohortId = user.cohortId.toString();
              
              // Try to get cohort name if available
              try {
                const Cohort = (await import('../../../../models/Cohort.js')).default;
                const cohort = await Cohort.findById(user.cohortId);
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
          
          console.log('🔍 JWT Debug - Database lookup in JWT:', {
            username: profile.username,
            found: !!user,
            userRole: user?.role,
            userCollege: user?.college?.name,
            userCohortId: user?.cohortId
          });
          
          // Store GitLab access token for API calls
          if (account.access_token) {
            token.gitlabAccessToken = account.access_token;
            token.gitlabRefreshToken = account.refresh_token;
            token.gitlabTokenExpires = account.expires_at;
            
            // Store OAuth tokens in GitLabIntegration model for API operations
            try {
              await connectToDatabase();
              const GitLabIntegration = (await import('../../../../models/GitLabIntegration.js')).default;
              const { encrypt } = await import('../../../../utils/encryption.js');
              
              // Create or update GitLab integration record
              await GitLabIntegration.findOneAndUpdate(
                { userId: user._id },
                {
                  userId: user._id,
                  gitlabUserId: parseInt(profile.id),
                  gitlabUsername: profile.username,
                  gitlabEmail: profile.email,
                  accessToken: encrypt(account.access_token),
                  refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
                  tokenType: 'oauth',
                  tokenExpiresAt: new Date(account.expires_at * 1000),
                  userProfile: {
                    name: profile.name,
                    email: profile.email,
                    avatarUrl: profile.avatar_url,
                    webUrl: profile.web_url
                  },
                  connectedAt: new Date(),
                  isConnected: true
                },
                { upsert: true, new: true }
              );
              
              console.log(`✅ OAuth tokens stored for GitLab integration: ${profile.username}`);
            } catch (integrationError) {
              console.error('❌ Failed to store GitLab integration tokens:', integrationError);
            }
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
              
              // Try to get cohort name if available
              try {
                const Cohort = (await import('../../../../models/Cohort.js')).default;
                const cohort = await Cohort.findById(user.cohortId);
                if (cohort) {
                  token.cohortName = cohort.name;
                }
              } catch (cohortError) {
                console.error('Error fetching cohort details:', cohortError);
              }
            }
            
            console.log(`✅ JWT - Successful token creation: ${user.gitlabUsername} (${user.role})`);
          } else {
            // New user - assign default values
            token.role = 'AI Developer Intern';
            token.gitlabUsername = profile.username;
            token.gitlabId = profile.id.toString();
            token.needsOnboarding = true; // Flag to indicate user needs onboarding
            console.log(`✅ JWT - New user assigned default role: ${profile.username}`);
          }
        } catch (error) {
          console.error('❌ Error in JWT callback:', error);
        }
      }
      
      // Handle token refresh for existing sessions
      if (token.gitlabTokenExpires && !account) {
        const now = Math.floor(Date.now() / 1000);
        const tokenExpires = token.gitlabTokenExpires;
        
        // If token expires within 5 minutes, try to refresh it
        // But only if we have a valid refresh token
        if (tokenExpires - now < 300 && token.gitlabRefreshToken) {
          console.log(`🔄 Token expires soon (${new Date(tokenExpires * 1000)}), attempting refresh...`);
          
          try {
            const refreshedToken = await refreshGitLabOAuthToken(token);
            if (refreshedToken) {
              token.gitlabAccessToken = refreshedToken.access_token;
              token.gitlabRefreshToken = refreshedToken.refresh_token || token.gitlabRefreshToken;
              token.gitlabTokenExpires = refreshedToken.expires_at || (now + refreshedToken.expires_in);
              console.log(`✅ Token refreshed successfully, expires: ${new Date(token.gitlabTokenExpires * 1000)}`);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            
            // If refresh token is invalid, clear GitLab tokens to prevent repeated failures
            if (refreshError.message.includes('invalid_grant') || refreshError.message.includes('invalid_token')) {
              console.log('🧹 Clearing invalid GitLab tokens from session');
              
              // Store gitlabId before clearing it
              const gitlabIdToUpdate = token.gitlabId;
              
              token.gitlabAccessToken = null;
              token.gitlabRefreshToken = null;
              token.gitlabTokenExpires = null;
              token.gitlabId = null;
              token.gitlabUsername = null;
              
              // Also clear from database if we have a gitlabId
              if (gitlabIdToUpdate) {
                try {
                  await connectToDatabase();
                  const GitLabIntegration = (await import('../../../../models/GitLabIntegration.js')).default;
                  await GitLabIntegration.updateOne(
                    { gitlabUserId: parseInt(gitlabIdToUpdate) },
                    {
                      accessToken: null,
                      refreshToken: null,
                      tokenExpiresAt: null,
                      isActive: false,
                      updatedAt: new Date()
                    }
                  );
                  console.log('🧹 Cleared invalid GitLab integration from database');
                } catch (dbError) {
                  console.warn('Failed to clear GitLab integration from database:', dbError);
                }
              }
            }
          }
        }
      }

      return token;
    },
    
    async session({ session, token }) {
      // Add custom fields to session
      session.user.role = token.role;
      session.user.gitlabUsername = token.gitlabUsername;
      session.user.gitlabId = token.gitlabId;
      session.user.college = token.college;
      session.user.assignedBy = token.assignedBy;
      session.user.id = token.userId;
      session.user.needsOnboarding = token.needsOnboarding;

      
      // Add cohort information
      if (token.cohortId) {
        session.user.cohortId = token.cohortId;
        session.user.cohortName = token.cohortName;
      }
      
      // Add GitLab access token (server-side only, not exposed to client)
      session.gitlabAccessToken = token.gitlabAccessToken;
      session.gitlabRefreshToken = token.gitlabRefreshToken;
      session.gitlabTokenExpires = token.gitlabTokenExpires;
      
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    signOut: '/'
  },
  session: {
    strategy: 'jwt'
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn(message) {
      console.log('🔍 NextAuth signIn event:', message);
    },
    async signOut(message) {
      console.log('🔍 NextAuth signOut event:', message);
    },
    async createUser(message) {
      console.log('🔍 NextAuth createUser event:', message);
    },
    async session(message) {
      console.log('🔍 NextAuth session event:', message);
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };