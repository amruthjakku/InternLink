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
      console.error('No refresh token available for GitLab.');
      return { ...token, error: 'RefreshAccessTokenError' };
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
      console.error('Failed to refresh GitLab token:', await response.text());
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const refreshedTokens = await response.json();
    const { encrypt } = await import('../../../../utils/encryption.js');

    await connectToDatabase();
    const GitLabIntegration = (await import('../../../../models/GitLabIntegration.js')).default;
    await GitLabIntegration.updateOne(
      { gitlabUserId: parseInt(token.gitlabId) },
      {
        accessToken: encrypt(refreshedTokens.access_token),
        refreshToken: refreshedTokens.refresh_token ? encrypt(refreshedTokens.refresh_token) : token.gitlabRefreshToken,
        tokenExpiresAt: new Date((refreshedTokens.expires_at || (Date.now() / 1000 + refreshedTokens.expires_in)) * 1000),
      }
    );

    return {
      ...token,
      gitlabAccessToken: refreshedTokens.access_token,
      gitlabRefreshToken: refreshedTokens.refresh_token ?? token.gitlabRefreshToken,
      gitlabTokenExpires: refreshedTokens.expires_at || (Date.now() / 1000 + refreshedTokens.expires_in),
    };

  } catch (error) {
    console.error('Error refreshing GitLab OAuth token:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
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
          username: profile.username.toLowerCase(),
        };
      },
    }
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        console.log('Authentication attempt for:', { gitlabUsername: profile.username, gitlabId: profile.id });
        await connectToDatabase();

        let existingUser = await User.findOneAndUpdate(
          { gitlabUsername: profile.username.toLowerCase() },
          {
            $set: {
              gitlabId: profile.id.toString(),
              name: profile.name,
              email: profile.email,
              profileImage: profile.avatar_url,
              lastLoginAt: new Date(),
            },
            $setOnInsert: {
              role: 'AI Developer Intern',
              assignedBy: 'auto-registration',
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`User ${existingUser.isNew ? 'created' : 'updated'}: ${profile.username}`);
        return true;
        
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    
    async jwt({ token, account, profile, trigger }) {

      // Initial sign-in
      if (account && profile) {
        await connectToDatabase();
        const user = await User.findOne({ gitlabUsername: profile.username.toLowerCase() }).populate('college cohortId');

        if (user) {
          token.userId = user._id.toString();
          token.role = user.role;
          token.college = user.college;
          token.assignedBy = user.assignedBy;
          token.gitlabUsername = user.gitlabUsername;
          token.gitlabId = user.gitlabId;
          token.sessionVersion = user.sessionVersion;
          if (user.cohortId) {
            token.cohortId = user.cohortId._id.toString();
            token.cohortName = user.cohortId.name;
          }
        }

        token.gitlabAccessToken = account.access_token;
        token.gitlabRefreshToken = account.refresh_token;
        token.gitlabTokenExpires = account.expires_at;

        // Upsert GitLab integration data
        const { encrypt } = await import('../../../../utils/encryption.js');
        const GitLabIntegration = (await import('../../../../models/GitLabIntegration.js')).default;
        await GitLabIntegration.findOneAndUpdate(
          { userId: token.userId },
          {
            gitlabUserId: parseInt(profile.id),
            gitlabUsername: profile.username,
            gitlabEmail: profile.email,
            accessToken: encrypt(account.access_token),
            refreshToken: account.refresh_token ? encrypt(account.refresh_token) : null,
            tokenExpiresAt: new Date(account.expires_at * 1000),
            userProfile: {
              name: profile.name,
              email: profile.email,
              avatarUrl: profile.avatar_url,
              webUrl: profile.web_url
            },
            isConnected: true,
          },
          { upsert: true, new: true }
        );

        return token;
      }

      // Subsequent session updates & token refresh
      const now = Math.floor(Date.now() / 1000);
      const tokenExpires = token.gitlabTokenExpires;
      if (tokenExpires && tokenExpires < now + 300 && token.gitlabRefreshToken) {
        try {
          const refreshed = await refreshGitLabOAuthToken(token);
          token.gitlabAccessToken = refreshed.access_token;
          token.gitlabRefreshToken = refreshed.refresh_token || token.gitlabRefreshToken;
          token.gitlabTokenExpires = refreshed.expires_at || (now + refreshed.expires_in);
          console.log('Successfully refreshed GitLab token.');
        } catch (error) {
          console.error('Error refreshing GitLab token:', error);
          // Invalidate session if refresh fails
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }
      
      // Always fetch latest user data to keep session fresh
      try {
        await connectToDatabase();
        const user = await User.findById(token.userId).populate('college cohortId');
        if (user) {
          token.role = user.role;
          token.college = user.college;
          token.sessionVersion = user.sessionVersion;
          if (user.cohortId) {
            token.cohortId = user.cohortId._id.toString();
            token.cohortName = user.cohortId.name;
          } else {
            token.cohortId = null;
            token.cohortName = null;
          }
        }
      } catch (error) {
        console.error('Error fetching user data for JWT update:', error);
      }

      return token;
    },
    
    async session({ session, token }) {
      // Add custom fields to session from token
      session.user = {
        ...session.user,
        id: token.userId,
        role: token.role,
        gitlabUsername: token.gitlabUsername,
        gitlabId: token.gitlabId,
        college: token.college,
        assignedBy: token.assignedBy,
        cohortId: token.cohortId,
        cohortName: token.cohortName,
      };

      session.gitlabAccessToken = token.gitlabAccessToken;
      session.gitlabRefreshToken = token.gitlabRefreshToken;
      session.gitlabTokenExpires = token.gitlabTokenExpires;
      session.error = token.error;
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard redirect page after sign in
      if (url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard-redirect`;
      }
      return `${baseUrl}/dashboard-redirect`;
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

};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };