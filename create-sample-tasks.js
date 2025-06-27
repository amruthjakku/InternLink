// Simple script to create weekly tasks directly via API
const tasks = [
  {
    title: "Set up GitHub Profile",
    description: "Create and customize your GitHub profile to showcase your work as a developer.",
    instructions: "1. Go to github.com and create an account\n2. Upload a professional profile picture\n3. Write a compelling bio\n4. Add your location and contact information\n5. Pin your best repositories",
    weekNumber: 1,
    weekStartDate: "2025-01-13",
    weekEndDate: "2025-01-19",
    assignmentType: 'cohort',
    difficulty: 'beginner',
    estimatedHours: 2,
    points: 15,
    category: 'development',
    isActive: true,
    isPublished: true
  },
  {
    title: "Create Your First Repository",
    description: "Learn the basics of Git by creating your first repository and making commits.",
    instructions: "1. Create a new repository on GitHub\n2. Clone it to your local machine\n3. Create a README.md file\n4. Make your first commit\n5. Push changes to GitHub",
    weekNumber: 1,
    weekStartDate: "2025-01-13",
    weekEndDate: "2025-01-19",
    assignmentType: 'cohort',
    difficulty: 'beginner',
    estimatedHours: 3,
    points: 20,
    category: 'development',
    isActive: true,
    isPublished: true
  },
  {
    title: "Git Branching Exercise",
    description: "Practice creating branches, making changes, and merging them back.",
    instructions: "1. Create a new branch called 'feature/update-readme'\n2. Make changes to your README file\n3. Commit the changes\n4. Create a pull request\n5. Merge the pull request",
    weekNumber: 1,
    weekStartDate: "2025-01-13",
    weekEndDate: "2025-01-19",
    assignmentType: 'cohort',
    difficulty: 'intermediate',
    estimatedHours: 2,
    points: 25,
    category: 'development',
    isActive: true,
    isPublished: true
  },
  {
    title: "Build Personal Portfolio Landing Page",
    description: "Create a responsive HTML/CSS landing page that introduces you as a developer.",
    instructions: "1. Create index.html with semantic HTML structure\n2. Add CSS styling with modern design\n3. Include sections: header, about, skills, contact\n4. Make it responsive for mobile devices\n5. Deploy to GitHub Pages",
    weekNumber: 2,
    weekStartDate: "2025-01-20",
    weekEndDate: "2025-01-26",
    assignmentType: 'cohort',
    difficulty: 'beginner',
    estimatedHours: 6,
    points: 35,
    category: 'development',
    isActive: true,
    isPublished: true
  },
  {
    title: "CSS Animation Challenge",
    description: "Add interactive animations and transitions to enhance user experience.",
    instructions: "1. Add hover effects to navigation items\n2. Create a loading animation\n3. Implement smooth scrolling\n4. Add fade-in animations for sections\n5. Create a responsive navigation menu",
    weekNumber: 2,
    weekStartDate: "2025-01-20",
    weekEndDate: "2025-01-26",
    assignmentType: 'cohort',
    difficulty: 'intermediate',
    estimatedHours: 4,
    points: 30,
    category: 'design',
    isActive: true,
    isPublished: true
  }
];

console.log('📋 Sample Weekly Tasks Ready:');
console.log('');
console.log('🔗 To create these tasks:');
console.log('1. Visit: http://localhost:3000/weekly-tasks-admin.html');
console.log('2. Use the form to create each task manually');
console.log('3. Or copy the JSON below for API calls');
console.log('');
console.log('📝 Task Data:');
console.log(JSON.stringify(tasks, null, 2));
console.log('');
console.log('📊 Summary:');
console.log(`- Week 1: ${tasks.filter(t => t.weekNumber === 1).length} tasks (Git & GitHub)`);
console.log(`- Week 2: ${tasks.filter(t => t.weekNumber === 2).length} tasks (HTML & CSS)`);
console.log(`- Total: ${tasks.length} tasks`);
console.log(`- All tasks are published and active`);