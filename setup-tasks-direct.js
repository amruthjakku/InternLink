const { MongoClient } = require('mongodb');

async function setupWeeklyTasks() {
  let client;
  
  try {
    console.log('🚀 Starting Weekly Tasks Setup...');
    
    // Connect to MongoDB directly
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aidevlink';
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Step 1: Clear existing tasks
    console.log('\n📋 Step 1: Clearing existing tasks...');
    
    const taskCount = await db.collection('tasks').countDocuments({});
    console.log(`Found ${taskCount} existing tasks to remove`);
    
    if (taskCount > 0) {
      const deleteResult = await db.collection('tasks').deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} tasks`);
    }
    
    // Clear task submissions
    const submissionCount = await db.collection('tasksubmissions').countDocuments({});
    if (submissionCount > 0) {
      const submissionDeleteResult = await db.collection('tasksubmissions').deleteMany({});
      console.log(`✅ Deleted ${submissionDeleteResult.deletedCount} task submissions`);
    }
    
    // Step 2: Get cohort and admin info
    console.log('\n👥 Step 2: Getting cohort and admin information...');
    
    const cohorts = await db.collection('cohorts').find({}).toArray();
    console.log(`Found ${cohorts.length} cohorts:`);
    cohorts.forEach(cohort => {
      console.log(`  - ${cohort.name} (ID: ${cohort._id})`);
    });
    
    if (cohorts.length === 0) {
      console.log('❌ No cohorts found! Please create cohorts first.');
      return;
    }
    
    const primaryCohort = cohorts[0];
    console.log(`Using primary cohort: ${primaryCohort.name}`);
    
    const adminUser = await db.collection('users').findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found!');
      return;
    }
    
    console.log(`Using admin user: ${adminUser.name}`);
    
    // Step 3: Create weekly tasks
    console.log('\n📝 Step 3: Creating weekly tasks...');
    
    const { ObjectId } = require('mongodb');
    const currentDate = new Date();
    
    // Calculate week dates
    const week1Start = new Date(currentDate);
    week1Start.setDate(currentDate.getDate() - (currentDate.getDay() || 7) + 1); // Start of current week
    const week1End = new Date(week1Start);
    week1End.setDate(week1Start.getDate() + 6);
    
    const week2Start = new Date(week1Start);
    week2Start.setDate(week1Start.getDate() + 7);
    const week2End = new Date(week2Start);
    week2End.setDate(week2Start.getDate() + 6);
    
    const week3Start = new Date(week2Start);
    week3Start.setDate(week2Start.getDate() + 7);
    const week3End = new Date(week3Start);
    week3End.setDate(week3Start.getDate() + 6);
    
    const week4Start = new Date(week3Start);
    week4Start.setDate(week3Start.getDate() + 7);
    const week4End = new Date(week4Start);
    week4End.setDate(week4Start.getDate() + 6);
    
    const weeklyTasks = [
      // Week 1: Git & GitHub Basics
      {
        _id: new ObjectId(),
        title: "Set up GitHub Profile",
        description: "Create and customize your GitHub profile to showcase your work as a developer.",
        instructions: "1. Go to github.com and create an account\n2. Upload a professional profile picture\n3. Write a compelling bio\n4. Add your location and contact information\n5. Pin your best repositories",
        weekNumber: 1,
        weekStartDate: week1Start,
        weekEndDate: week1End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'beginner',
        estimatedHours: 2,
        points: 15,
        category: 'development',
        isActive: true,
        isPublished: true,
        autoActivate: true,
        activationDate: week1Start,
        dueDate: week1End,
        createdBy: adminUser._id,
        prerequisites: [],
        deliverables: ['GitHub profile URL', 'Screenshot of completed profile'],
        resources: [
          {
            title: 'GitHub Profile Guide',
            url: 'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile',
            type: 'documentation'
          }
        ],
        tags: ['git', 'github', 'profile', 'setup'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "Create Your First Repository",
        description: "Learn the basics of Git by creating your first repository and making commits.",
        instructions: "1. Create a new repository on GitHub\n2. Clone it to your local machine\n3. Create a README.md file\n4. Make your first commit\n5. Push changes to GitHub",
        weekNumber: 1,
        weekStartDate: week1Start,
        weekEndDate: week1End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'beginner',
        estimatedHours: 3,
        points: 20,
        category: 'development',
        isActive: true,
        isPublished: true,
        autoActivate: true,
        activationDate: week1Start,
        dueDate: week1End,
        createdBy: adminUser._id,
        prerequisites: ['GitHub account'],
        deliverables: ['Repository URL', 'At least 3 commits'],
        resources: [
          {
            title: 'Git Handbook',
            url: 'https://guides.github.com/introduction/git-handbook/',
            type: 'documentation'
          }
        ],
        tags: ['git', 'repository', 'commit', 'basics'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "Git Branching Exercise",
        description: "Practice creating branches, making changes, and merging them back.",
        instructions: "1. Create a new branch called 'feature/update-readme'\n2. Make changes to your README file\n3. Commit the changes\n4. Create a pull request\n5. Merge the pull request",
        weekNumber: 1,
        weekStartDate: week1Start,
        weekEndDate: week1End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'intermediate',
        estimatedHours: 2,
        points: 25,
        category: 'development',
        isActive: true,
        isPublished: true,
        autoActivate: true,
        activationDate: week1Start,
        dueDate: week1End,
        createdBy: adminUser._id,
        prerequisites: ['Basic Git knowledge', 'GitHub repository'],
        deliverables: ['Pull request URL', 'Merged branch'],
        tags: ['git', 'branching', 'pull-request', 'merge'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Week 2: HTML & CSS Fundamentals
      {
        _id: new ObjectId(),
        title: "Build Personal Portfolio Landing Page",
        description: "Create a responsive HTML/CSS landing page that introduces you as a developer.",
        instructions: "1. Create index.html with semantic HTML structure\n2. Add CSS styling with modern design\n3. Include sections: header, about, skills, contact\n4. Make it responsive for mobile devices\n5. Deploy to GitHub Pages",
        weekNumber: 2,
        weekStartDate: week2Start,
        weekEndDate: week2End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'beginner',
        estimatedHours: 6,
        points: 35,
        category: 'development',
        isActive: true,
        isPublished: true,
        autoActivate: true,
        activationDate: week2Start,
        dueDate: week2End,
        createdBy: adminUser._id,
        prerequisites: ['HTML basics', 'CSS basics'],
        deliverables: ['GitHub repository with portfolio', 'Live deployed URL'],
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
        tags: ['html', 'css', 'portfolio', 'responsive', 'github-pages'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "CSS Animation Challenge",
        description: "Add interactive animations and transitions to enhance user experience.",
        instructions: "1. Add hover effects to navigation items\n2. Create a loading animation\n3. Implement smooth scrolling\n4. Add fade-in animations for sections\n5. Create a responsive navigation menu",
        weekNumber: 2,
        weekStartDate: week2Start,
        weekEndDate: week2End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'intermediate',
        estimatedHours: 4,
        points: 30,
        category: 'design',
        isActive: true,
        isPublished: true,
        autoActivate: true,
        activationDate: week2Start,
        dueDate: week2End,
        createdBy: adminUser._id,
        prerequisites: ['CSS basics', 'Portfolio website'],
        deliverables: ['Updated portfolio with animations', 'Animation demo video'],
        tags: ['css', 'animations', 'transitions', 'interactions'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Week 3: JavaScript Basics (Future - not published yet)
      {
        _id: new ObjectId(),
        title: "Interactive Calculator Project",
        description: "Build a functional calculator using HTML, CSS, and JavaScript.",
        instructions: "1. Create calculator layout with HTML/CSS\n2. Implement basic operations (+, -, *, /)\n3. Add keyboard support\n4. Handle edge cases (division by zero)\n5. Style with modern UI design",
        weekNumber: 3,
        weekStartDate: week3Start,
        weekEndDate: week3End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'intermediate',
        estimatedHours: 8,
        points: 40,
        category: 'development',
        isActive: true,
        isPublished: false, // Future week - not published yet
        autoActivate: true,
        activationDate: week3Start,
        dueDate: week3End,
        createdBy: adminUser._id,
        prerequisites: ['JavaScript basics', 'DOM manipulation'],
        deliverables: ['Working calculator', 'GitHub repository', 'Documentation'],
        resources: [
          {
            title: 'JavaScript MDN Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
            type: 'documentation'
          }
        ],
        tags: ['javascript', 'calculator', 'dom', 'events', 'project'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      {
        _id: new ObjectId(),
        title: "DOM Manipulation Exercises",
        description: "Practice working with the Document Object Model to create dynamic web pages.",
        instructions: "1. Create a to-do list application\n2. Implement add/remove functionality\n3. Add local storage persistence\n4. Create filtering options\n5. Add drag-and-drop reordering",
        weekNumber: 3,
        weekStartDate: week3Start,
        weekEndDate: week3End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'intermediate',
        estimatedHours: 6,
        points: 35,
        category: 'development',
        isActive: true,
        isPublished: false, // Future week
        autoActivate: true,
        activationDate: week3Start,
        dueDate: week3End,
        createdBy: adminUser._id,
        prerequisites: ['JavaScript basics', 'Event handling'],
        deliverables: ['To-do app', 'Code documentation'],
        tags: ['javascript', 'dom', 'todo', 'local-storage', 'events'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Week 4: Advanced JavaScript & APIs
      {
        _id: new ObjectId(),
        title: "Weather App with API Integration",
        description: "Build a weather application that fetches data from a real weather API.",
        instructions: "1. Sign up for OpenWeatherMap API\n2. Create weather app interface\n3. Implement location search\n4. Display current weather and forecast\n5. Add error handling and loading states",
        weekNumber: 4,
        weekStartDate: week4Start,
        weekEndDate: week4End,
        assignmentType: 'cohort',
        cohortId: primaryCohort._id,
        difficulty: 'advanced',
        estimatedHours: 10,
        points: 50,
        category: 'development',
        isActive: true,
        isPublished: false, // Future week
        autoActivate: true,
        activationDate: week4Start,
        dueDate: week4End,
        createdBy: adminUser._id,
        prerequisites: ['JavaScript fundamentals', 'Fetch API', 'Promises'],
        deliverables: ['Weather app', 'API integration', 'Error handling'],
        resources: [
          {
            title: 'Fetch API Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
            type: 'documentation'
          }
        ],
        tags: ['javascript', 'api', 'weather', 'fetch', 'async'],
        maxScore: 100,
        totalSubmissions: 0,
        completedSubmissions: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Insert weekly tasks into weeklytasks collection
    console.log(`📦 Inserting ${weeklyTasks.length} weekly tasks...`);
    const insertResult = await db.collection('weeklytasks').insertMany(weeklyTasks);
    console.log(`✅ Successfully inserted ${insertResult.insertedCount} weekly tasks`);
    
    // Summary
    console.log('\n📊 Setup Summary:');
    console.log(`✅ Cleared ${taskCount} old tasks`);
    console.log(`✅ Cleared ${submissionCount} old submissions`);
    console.log(`✅ Created ${weeklyTasks.length} new weekly tasks`);
    console.log(`✅ Tasks assigned to cohort: ${primaryCohort.name}`);
    
    console.log('\n📅 Weekly Task Structure:');
    const tasksByWeek = weeklyTasks.reduce((acc, task) => {
      if (!acc[task.weekNumber]) acc[task.weekNumber] = [];
      acc[task.weekNumber].push(task);
      return acc;
    }, {});
    
    Object.keys(tasksByWeek).forEach(week => {
      const tasks = tasksByWeek[week];
      const publishedCount = tasks.filter(t => t.isPublished).length;
      console.log(`  Week ${week}: ${tasks.length} tasks (${publishedCount} published)`);
      tasks.forEach(task => {
        const status = task.isPublished ? '🟢 Published' : '🟡 Draft';
        console.log(`    ${status} - ${task.title} (${task.points} points)`);
      });
    });
    
    console.log('\n🎉 Weekly task system setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('  Week 1: Git & GitHub Basics (3 tasks) - PUBLISHED ✅');
    console.log('  Week 2: HTML & CSS Fundamentals (2 tasks) - PUBLISHED ✅');
    console.log('  Week 3: JavaScript Basics (2 tasks) - DRAFT 📝');
    console.log('  Week 4: Advanced JavaScript & APIs (1 task) - DRAFT 📝');
    
    console.log('\n🔗 Next steps:');
    console.log('  1. ✅ Check AI developer intern dashboard - they should see Week 1 & 2 tasks');
    console.log('  2. 🔧 Use weekly-tasks-admin.html to manage tasks');
    console.log('  3. 📅 Publish Week 3 & 4 tasks when ready');
    console.log('  4. 📊 Monitor AI developer intern progress and submissions');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    if (client) {
      await client.close();
    }
    process.exit(0);
  }
}

setupWeeklyTasks();