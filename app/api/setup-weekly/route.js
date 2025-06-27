import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../utils/database';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const db = await getDatabase();
    
    console.log('🚀 Starting Weekly Tasks Setup...');
    
    // Step 1: Clear existing tasks
    const taskCount = await db.collection('tasks').countDocuments({});
    if (taskCount > 0) {
      await db.collection('tasks').deleteMany({});
      console.log(`✅ Cleared ${taskCount} existing tasks`);
    }
    
    // Clear submissions
    const submissionCount = await db.collection('tasksubmissions').countDocuments({});
    if (submissionCount > 0) {
      await db.collection('tasksubmissions').deleteMany({});
      console.log(`✅ Cleared ${submissionCount} submissions`);
    }
    
    // Step 2: Get cohort info
    const cohorts = await db.collection('cohorts').find({}).toArray();
    if (cohorts.length === 0) {
      return NextResponse.json({ error: 'No cohorts found' }, { status: 400 });
    }
    
    const primaryCohort = cohorts[0];
    console.log(`Using cohort: ${primaryCohort.name}`);
    
    // Step 3: Create weekly tasks using existing task format
    const currentDate = new Date();
    const week1Start = new Date('2025-01-13T00:00:00.000Z');
    const week1End = new Date('2025-01-19T23:59:59.999Z');
    const week2Start = new Date('2025-01-20T00:00:00.000Z');
    const week2End = new Date('2025-01-26T23:59:59.999Z');
    
    const weeklyTasks = [
      // Week 1: Git & GitHub Basics
      {
        _id: new ObjectId(),
        title: "Week 1: Set up GitHub Profile",
        description: "Create and customize your GitHub profile to showcase your work as a developer.",
        instructions: "1. Go to github.com and create an account\n2. Upload a professional profile picture\n3. Write a compelling bio\n4. Add your location and contact information\n5. Pin your best repositories\n\n📅 Week 1 Task (Jan 13-19, 2025)",
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        isActive: true,
        status: 'active',
        priority: 'medium',
        dueDate: week1End,
        points: 15,
        category: 'Git & GitHub Basics',
        tags: ['week1', 'git', 'github', 'profile', 'setup'],
        resources: [{
          title: 'GitHub Profile Guide',
          url: 'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile',
          type: 'documentation'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "Week 1: Create Your First Repository",
        description: "Learn the basics of Git by creating your first repository and making commits.",
        instructions: "1. Create a new repository on GitHub\n2. Clone it to your local machine\n3. Create a README.md file\n4. Make your first commit\n5. Push changes to GitHub\n\n📅 Week 1 Task (Jan 13-19, 2025)",
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        isActive: true,
        status: 'active',
        priority: 'medium',
        dueDate: week1End,
        points: 20,
        category: 'Git & GitHub Basics',
        tags: ['week1', 'git', 'repository', 'commit', 'basics'],
        resources: [{
          title: 'Git Handbook',
          url: 'https://guides.github.com/introduction/git-handbook/',
          type: 'documentation'
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "Week 1: Git Branching Exercise",
        description: "Practice creating branches, making changes, and merging them back.",
        instructions: "1. Create a new branch called 'feature/update-readme'\n2. Make changes to your README file\n3. Commit the changes\n4. Create a pull request\n5. Merge the pull request\n\n📅 Week 1 Task (Jan 13-19, 2025)",
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        isActive: true,
        status: 'active',
        priority: 'high',
        dueDate: week1End,
        points: 25,
        category: 'Git & GitHub Basics',
        tags: ['week1', 'git', 'branching', 'pull-request', 'merge'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Week 2: HTML & CSS Fundamentals
      {
        _id: new ObjectId(),
        title: "Week 2: Build Personal Portfolio Landing Page",
        description: "Create a responsive HTML/CSS landing page that introduces you as a developer.",
        instructions: "1. Create index.html with semantic HTML structure\n2. Add CSS styling with modern design\n3. Include sections: header, about, skills, contact\n4. Make it responsive for mobile devices\n5. Deploy to GitHub Pages\n\n📅 Week 2 Task (Jan 20-26, 2025)",
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        isActive: true,
        status: 'active',
        priority: 'high',
        dueDate: week2End,
        points: 35,
        category: 'HTML & CSS Fundamentals',
        tags: ['week2', 'html', 'css', 'portfolio', 'responsive', 'github-pages'],
        resources: [
          {
            title: 'HTML MDN Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
            type: 'documentation'
          },
          {
            title: 'CSS Flexbox Guide',
            url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
            type: 'article'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "Week 2: CSS Animation Challenge",
        description: "Add interactive animations and transitions to enhance user experience.",
        instructions: "1. Add hover effects to navigation items\n2. Create a loading animation\n3. Implement smooth scrolling\n4. Add fade-in animations for sections\n5. Create a responsive navigation menu\n\n📅 Week 2 Task (Jan 20-26, 2025)",
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        isActive: true,
        status: 'active',
        priority: 'medium',
        dueDate: week2End,
        points: 30,
        category: 'HTML & CSS Fundamentals',
        tags: ['week2', 'css', 'animations', 'transitions', 'interactions'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Step 4: Insert tasks
    const insertResult = await db.collection('tasks').insertMany(weeklyTasks);
    console.log(`✅ Created ${insertResult.insertedCount} weekly tasks`);
    
    return NextResponse.json({
      success: true,
      message: 'Weekly task system setup completed!',
      tasksCleared: taskCount,
      submissionsCleared: submissionCount,
      tasksCreated: insertResult.insertedCount,
      cohort: {
        name: primaryCohort.name,
        id: primaryCohort._id
      },
      tasks: weeklyTasks.map(task => ({
        title: task.title,
        category: task.category,
        points: task.points,
        dueDate: task.dueDate
      }))
    });

  } catch (error) {
    console.error('Error setting up weekly tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to setup weekly tasks',
      details: error.message 
    }, { status: 500 });
  }
}