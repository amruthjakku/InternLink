import NextAuth from 'next-auth';
import GitLabProvider from 'next-auth/providers/gitlab';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';

export const authOptions = {
  providers: [
    GitLabProvider({
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      issuer: process.env.GITLAB_ISSUER || 'https://gitlab.com',
      authorization: {
        params: {
          scope: 'read_user read_api read_repository'
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Connect to database
        await connectToDatabase();
        
        // Check if user exists in our system by GitLab username
        const existingUser = await User.findByGitLabUsername(profile.username);
        
        if (!existingUser) {
          // User not found in our system - they need to be pre-registered
          console.log(`Unauthorized login attempt by GitLab user: ${profile.username}`);
          return false; // This will trigger the error page
        }
        
        // Update user's GitLab info and last login
        existingUser.gitlabId = profile.id.toString();
        existingUser.name = profile.name || existingUser.name;
        existingUser.email = profile.email || existingUser.email;
        existingUser.profileImage = profile.avatar_url || existingUser.profileImage;
        await existingUser.updateLastLogin();
        
        console.log(`Successful login: ${profile.username} (${existingUser.role})`);
        return true;
        
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    
    async jwt({ token, account, profile }) {
      if (account && profile) {
        try {
          await connectToDatabase();
          let user = await User.findByGitLabUsername(profile.username).populate('college');
          
          if (user) {
            // Existing user - update their info and login time
            token.role = user.role;
            token.gitlabUsername = user.gitlabUsername;
            token.gitlabId = user.gitlabId;
            token.college = user.college;
            token.assignedBy = user.assignedBy;
            token.userId = user._id.toString();
            
            // Update last login
            await user.updateLastLogin();
            console.log(`Successful login: ${user.gitlabUsername} (${user.role})`);
          } else {
            // New user - mark as pending registration
            token.role = 'pending';
            token.gitlabUsername = profile.username;
            token.gitlabId = profile.id.toString();
            token.needsRegistration = true;
            console.log(`New user login: ${profile.username} - needs registration`);
          }
        } catch (error) {
          console.error('Error in JWT callback:', error);
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
      session.user.needsRegistration = token.needsRegistration;
      
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };