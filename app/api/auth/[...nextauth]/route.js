import NextAuth from 'next-auth';
import GitLabProvider from 'next-auth/providers/gitlab';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

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
          userActive: existingUser?.isActive,
          userId: existingUser?._id?.toString()
        });
        
        if (!existingUser) {
          // Auto-register new GitLab users as pending
          console.log(`🔄 Auto-registering new GitLab user: ${profile.username}`);
          
          try {
            const newUser = new User({
              gitlabUsername: profile.username.toLowerCase(),
              gitlabId: profile.id.toString(),
              name: profile.name,
              email: profile.email,
              role: 'pending', // They'll need admin approval
              profileImage: profile.avatar_url,
              isActive: true,
              lastLoginAt: new Date()
            });
            
            await newUser.save();
            console.log(`✅ Auto-registered user: ${profile.username} with pending role`);
            
            // Use the newly created user
            existingUser = newUser;
          } catch (error) {
            console.error(`❌ Failed to auto-register user ${profile.username}:`, error);
            return false;
          }
        }
        
        // Update user's GitLab info and last login
        existingUser.gitlabId = profile.id.toString();
        existingUser.name = profile.name || existingUser.name;
        existingUser.email = profile.email || existingUser.email;
        existingUser.profileImage = profile.avatar_url || existingUser.profileImage;
        await existingUser.updateLastLogin();
        
        console.log(`✅ Successful login: ${profile.username} (${existingUser.role})`);
        return true;
        
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
          let user = await User.findByGitLabUsername(token.gitlabUsername, 'college');
          

          
          if (user) {
            // Check if we need to force refresh based on recent updates or session version
            const shouldForceRefresh = user.lastTokenRefresh && 
              (!token.lastRefresh || new Date(user.lastTokenRefresh) > new Date(token.lastRefresh));
            
            const sessionVersionChanged = user.sessionVersion && 
              (!token.sessionVersion || user.sessionVersion > token.sessionVersion);
            
            // Always update token with latest user info (including role changes)
            const roleChanged = token.role !== user.role;
            const activeChanged = token.isActive !== user.isActive;
            
            if (roleChanged || activeChanged || shouldForceRefresh || sessionVersionChanged) {
              console.log(`🔄 JWT Token refresh for ${user.gitlabUsername}: roleChanged=${roleChanged}, activeChanged=${activeChanged}, forceRefresh=${shouldForceRefresh}, versionChanged=${sessionVersionChanged}`);
            }
            
            token.role = user.role;
            token.college = user.college;
            token.assignedBy = user.assignedBy;
            token.userId = user._id.toString();
            token.isActive = user.isActive;
            token.sessionVersion = user.sessionVersion;
            token.lastRefresh = new Date().toISOString();
            
            // Clear needsRegistration if user now has a proper role
            if (user.role !== 'pending') {
              token.needsRegistration = undefined;
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
          let user = await User.findByGitLabUsername(profile.username, 'college');
          
          console.log('🔍 JWT Debug - Database lookup in JWT:', {
            username: profile.username,
            found: !!user,
            userRole: user?.role,
            userCollege: user?.college?.name,
            userActive: user?.isActive
          });
          
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
            
            console.log(`✅ JWT - Successful token creation: ${user.gitlabUsername} (${user.role})`);
          } else {
            // New user - mark as pending registration
            token.role = 'pending';
            token.gitlabUsername = profile.username;
            token.gitlabId = profile.id.toString();
            token.needsRegistration = true;
            console.log(`⚠️ JWT - New user needs registration: ${profile.username}`);
          }
        } catch (error) {
          console.error('❌ Error in JWT callback:', error);
        }
      }
      

      
      return token;
    },
    
    async session({ session, token }) {
      // CRITICAL: Block access for inactive users
      if (token.isActive === false) {
        console.log(`🚫 Blocking session for inactive user: ${token.gitlabUsername}`);
        return null; // This will end the session
      }
      
      // Add custom fields to session
      session.user.role = token.role;
      session.user.gitlabUsername = token.gitlabUsername;
      session.user.gitlabId = token.gitlabId;
      session.user.college = token.college;
      session.user.assignedBy = token.assignedBy;
      session.user.id = token.userId;
      session.user.needsRegistration = token.needsRegistration;
      session.user.isActive = token.isActive;
      
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
  debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };