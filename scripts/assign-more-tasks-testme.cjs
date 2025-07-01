// CommonJS script to assign more tasks to testme user
const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  assignMoreTasks();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function assignMoreTasks() {
  try {
    const db = mongoose.connection.db;
    
    // Find the testme user
    const testmeUser = await db.collection('users').findOne({ 
      name: 'test me'
    });
    
    if (!testmeUser) {
      console.log('testme user not found');
      return;
    }
    
    const testmeUserId = testmeUser._id.toString();
    console.log(`\nAssigning additional tasks to testme user (${testmeUserId})...`);
    
    // Create some additional tasks for testme
    const newTasks = [
      {
        title: "Week 3: JavaScript Fundamentals",
        description: "Learn JavaScript basics and complete exercises",
        status: "completed",
        assignedTo: testmeUserId,
        points: 40,
        progress: 100,
        category: "Programming",
        type: "assignment",
        priority: "medium",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        startDate: new Date(),
        createdBy: testmeUser._id, // Use testme as creator for simplicity
        createdByRole: "mentor", // Required field
        isActive: true
      },
      {
        title: "Week 4: React Components",
        description: "Build reusable React components",
        status: "completed",
        assignedTo: testmeUserId,
        points: 50,
        progress: 100,
        category: "Frontend",
        type: "project",
        priority: "high",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        startDate: new Date(),
        createdBy: testmeUser._id,
        createdByRole: "mentor",
        isActive: true
      },
      {
        title: "Week 5: API Integration",
        description: "Integrate with REST APIs",
        status: "in_progress",
        assignedTo: testmeUserId,
        points: 45,
        progress: 75,
        category: "Backend",
        type: "assignment",
        priority: "medium",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        startDate: new Date(),
        createdBy: testmeUser._id,
        createdByRole: "mentor",
        isActive: true
      }
    ];
    
    // Insert the new tasks
    const result = await db.collection('tasks').insertMany(newTasks);
    console.log(`✅ Successfully created ${result.insertedCount} new tasks for testme user`);
    
    // Show all tasks now assigned to testme
    const allTestmeTasks = await db.collection('tasks').find({
      assignedTo: testmeUserId
    }).toArray();
    
    console.log(`\nAll tasks assigned to testme user (${allTestmeTasks.length} total):`);
    let totalPoints = 0;
    let completedTasks = 0;
    
    allTestmeTasks.forEach((task, index) => {
      console.log(`${index + 1}. "${task.title}"`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Points: ${task.points}`);
      console.log(`   Progress: ${task.progress}%`);
      
      if (task.status === 'completed' || task.status === 'done' || task.status === 'approved') {
        totalPoints += task.points;
        completedTasks++;
      }
      console.log('');
    });
    
    console.log(`📊 Summary for testme user:`);
    console.log(`   Total tasks: ${allTestmeTasks.length}`);
    console.log(`   Completed tasks: ${completedTasks}`);
    console.log(`   Total points earned: ${totalPoints}`);
    console.log(`   Completion rate: ${Math.round((completedTasks / allTestmeTasks.length) * 100)}%`);
    
    console.log('\n🎉 testme user should now appear higher on the leaderboard!');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error assigning more tasks:', error);
    process.exit(1);
  }
}