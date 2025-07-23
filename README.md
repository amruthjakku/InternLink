# AI developer InternLink - Comprehensive AI developer Internship Management Platform

AI developer InternLink is a modern, full-featured internship management platform designed to streamline the entire internship lifecycle. Built with Next.js and MongoDB, it provides comprehensive tools for interns, mentors, and administrators to track progress, manage tasks, and foster collaboration.

## 🌟 Key Features

### For AI developer Interns
- **Smart Task Management** - Automated task assignment with GitLab integration
- **Progress Tracking** - Real-time progress monitoring with visual dashboards
- **Attendance System** - Unified check-in/check-out with location tracking
- **Performance Analytics** - Detailed insights into coding activity and achievements
- **Collaborative Chat** - Real-time communication with mentors and peers
- **GitLab Integration** - Seamless repository tracking and commit analysis

### For Tech Leads
- **AI developer Intern Oversight** - Comprehensive view of intern progress and performance
- **Task Assignment** - Create and assign tasks with templates and verification
- **Attendance Monitoring** - Track intern attendance patterns and analytics
- **Performance Reviews** - Detailed performance metrics and reporting
- **Communication Tools** - Direct messaging and group communication
- **Advanced Analytics** - Deep insights into team performance

### For Administrators
- **User Management** - Complete user lifecycle management with role-based access
- **Cohort System** - Organize interns into cohorts with college affiliations
- **System Analytics** - Comprehensive platform usage and performance metrics
- **Bulk Operations** - Import/export users and manage data at scale
- **Security Controls** - IP management, access controls, and audit trails
- **GitLab Administration** - Manage GitLab integrations and templates

## 🚀 Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with OAuth support
- **Real-time**: Socket.io for live updates
- **Charts**: Chart.js, Recharts, D3.js
- **GitLab Integration**: Custom GitLab wrapper with OAuth
- **File Processing**: Papa Parse for CSV handling
- **UI Components**: Custom components with Lucide React icons

## 📋 Prerequisites

- Node.js 18.0 or higher
- MongoDB 5.0 or higher
- GitLab instance (for GitLab integration)
- Modern web browser

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://code.swecha.org/amruth_jakku/InternLink.git
   cd internlink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/internlink
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   
   # GitLab OAuth (Optional)
   GITLAB_CLIENT_ID=your-gitlab-client-id
   GITLAB_CLIENT_SECRET=your-gitlab-client-secret
   GITLAB_URL=https://your-gitlab-instance.com
   
   # Encryption (for sensitive data)
   ENCRYPTION_KEY=your-32-character-encryption-key
   
   # Optional: Socket.io for real-time features
   SOCKET_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   sudo systemctl start mongod
   
   # Run setup script to create initial data
   npm run setup
   ```

5. **Create Admin User**
   ```bash
   npm run create-admin
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
AI developer InternLink/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── intern/            # AI developer Intern dashboard
│   ├── mentor/            # Tech Lead dashboard
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── intern/            # AI developer Intern-specific components
│   ├── mentor/            # Tech Lead-specific components
│   └── auth/              # Authentication components
├── models/                # MongoDB/Mongoose models
├── utils/                 # Utility functions
├── lib/                   # Library configurations
├── scripts/               # Database and setup scripts

└── public/                # Static assets
```

## 🔧 Configuration

### GitLab Integration Setup

1. **Create GitLab OAuth Application**
   - Go to your GitLab instance → User Settings → Applications
   - Create new application with scopes: `read_api`, `read_user`, `read_repository`
   - Set redirect URI: `http://localhost:3000/api/auth/callback/gitlab`

2. **Configure Environment Variables**
   ```env
   GITLAB_CLIENT_ID=your-application-id
   GITLAB_CLIENT_SECRET=your-application-secret
   GITLAB_URL=https://your-gitlab-instance.com
   ```

3. **Enable GitLab Features**
   - Smart repository detection
   - Commit tracking and analytics
   - Template repository support
   - Automated task verification

### Cohort and College System

1. **Import Colleges and Cohorts**
   - Use the admin dashboard to import CSV files
   - Templates available in `/public/` directory
   - Supports bulk operations for large datasets

2. **User Assignment**
   - Assign users to cohorts and colleges
   - Automatic role-based access control
   - Hierarchical permission system

## 📊 Features Deep Dive

### Task Management System
- **Smart Assignment**: Automated task distribution based on cohort and skill level
- **GitLab Integration**: Repository templates and automatic verification
- **Progress Tracking**: Real-time progress updates with visual indicators
- **Verification Levels**: Configurable verification requirements (none, simple, strict)

### Attendance System
- **Unified Check-in/out**: Single interface for all attendance tracking
- **Location Verification**: Optional GPS-based location checking
- **Analytics**: Comprehensive attendance reports and patterns
- **Bulk Operations**: Mass attendance management for administrators

### Performance Analytics
- **GitLab Metrics**: Commit frequency, code quality, repository activity
- **Task Completion**: Progress tracking with detailed breakdowns
- **Leaderboards**: Gamified performance comparison
- **Custom Reports**: Exportable performance reports

### Communication Platform
- **Real-time Chat**: Instant messaging between users
- **Role-based Channels**: Separate communication channels by role
- **File Sharing**: Document and code sharing capabilities
- **Notifications**: Real-time updates and alerts

## 🔐 Security Features

- **Role-based Access Control**: Granular permissions for different user types
- **IP Whitelisting**: Restrict access to specific IP ranges
- **Data Encryption**: Sensitive data encrypted at rest
- **Audit Trails**: Comprehensive logging of user actions
- **Session Management**: Secure session handling with automatic expiry

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:components
npm run test:integration
```

### Test Data Setup
```bash
# Create sample data for testing
node scripts/create-sample-data.js

# Test GitLab integration
node scripts/test-gitlab-integration.js
```

## 📈 Monitoring and Analytics

### System Monitoring
- **Performance Metrics**: Response times, error rates, resource usage
- **User Analytics**: Active users, feature usage, engagement metrics
- **Database Health**: Query performance, connection pooling, data integrity

### GitLab Analytics
- **Commit Tracking**: Detailed commit analysis and patterns
- **Repository Insights**: Code quality metrics and activity trends
- **Collaboration Metrics**: Team interaction and contribution analysis

## 🚀 Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
NEXTAUTH_URL=https://your-domain.com
# ... other production variables
```

### Docker Deployment (Optional)
```bash
# Build Docker image
docker build -t internlink .

# Run container
docker run -p 3000:3000 internlink
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting PR

## 📚 Documentation

- **API Documentation**: Available at `/docs/api`
- **User Guides**: Comprehensive guides in `/docs/guides`
- **Development Docs**: Technical documentation in `/docs/development`
- **GitLab Integration**: Detailed guide in `GITLAB_INTEGRATION_GUIDE.md`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **GitLab Integration Problems**
   - Verify OAuth application settings
   - Check network connectivity to GitLab instance
   - Validate environment variables

3. **Performance Issues**
   - Monitor database query performance
   - Check for memory leaks in long-running processes
   - Optimize large data operations

### Debug Mode
```bash
# Enable debug logging
DEBUG=internlink:* npm run dev

# Check system health
node scripts/health-check.js
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the internship community
- Special thanks to all contributors and beta testers
- Powered by open-source technologies

## 📞 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Report bugs on GitHub Issues
- **Community**: Join our discussion forums
- **Email**: support@internlink.dev

---

**AI developer InternLink** - Empowering the next generation of developers through comprehensive internship management.
