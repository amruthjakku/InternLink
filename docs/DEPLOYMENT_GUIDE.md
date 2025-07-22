# Deployment Guide for AI developer InternLink

## Issues Fixed for Render Deployment

### 1. Dynamic Server Usage Errors
**Problem**: API routes using `getServerSession` couldn't be rendered statically.
**Solution**: Added `export const dynamic = 'force-dynamic';` to all API routes that use server-side features.

### 2. Missing Suspense Boundary
**Problem**: `useSearchParams()` in `/auth/error` page wasn't wrapped in Suspense.
**Solution**: Wrapped the component using `useSearchParams()` in a `<Suspense>` boundary.

### 3. Mongoose Duplicate Index Warnings
**Problem**: Duplicate indexes on `userId` field in models.
**Solution**: Removed redundant index definitions where unique constraints already create indexes.

## Render.com Configuration

### Environment Variables Required
Set these in your Render dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://your-connection-string

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=https://your-app-name.onrender.com

# GitLab OAuth
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Node Environment
NODE_ENV=production
```

### Build Configuration
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher
- **Root Directory**: Leave empty (uses project root)

### Files Added/Modified for Deployment

1. **next.config.js**: Updated with proper configuration for production
2. **All API routes**: Added `export const dynamic = 'force-dynamic';`
3. **app/auth/error/page.js**: Wrapped in Suspense boundary
4. **models/**: Fixed duplicate index issues
5. **render-build.sh**: Build script for Render (optional)

## Deployment Steps

1. **Push your code** to GitHub/GitLab
2. **Create a new Web Service** on Render
3. **Connect your repository**
4. **Set environment variables** (see list above)
5. **Configure build settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
6. **Deploy**

## Post-Deployment Checklist

- [ ] Database connection working
- [ ] GitLab OAuth configured and working
- [ ] All API routes responding correctly
- [ ] Authentication flow working
- [ ] Static assets loading properly

## Troubleshooting

### Common Issues:

1. **Build fails with "Dynamic server usage" error**
   - Ensure all API routes have `export const dynamic = 'force-dynamic';`

2. **Suspense boundary errors**
   - Check that all `useSearchParams()` usage is wrapped in `<Suspense>`

3. **Database connection issues**
   - Verify MONGODB_URI is correct
   - Check MongoDB Atlas network access settings

4. **OAuth not working**
   - Verify GitLab OAuth app redirect URI matches your Render URL
   - Check NEXTAUTH_URL environment variable

5. **Environment variables not loading**
   - Ensure all required env vars are set in Render dashboard
   - Restart the service after adding new env vars

## Performance Optimization

The app is configured with:
- Standalone output for better performance
- Mongoose external package configuration
- Proper caching headers for API routes
- Static optimization where possible

## Monitoring

Monitor your deployment:
- Check Render logs for any runtime errors
- Monitor database connections
- Watch for memory usage patterns
- Set up alerts for downtime

## Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables
3. Test locally with production environment variables
4. Check this guide for common solutions