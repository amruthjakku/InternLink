// Enhanced Mock Data for Mentor Dashboard
export const mockData = {
  // Enhanced Colleges Data
  colleges: [
    {
      id: 1,
      name: "Stanford University",
      description: "Leading technology and innovation university",
      location: "Stanford, CA, USA",
      created_by: 1,
      created_at: "2024-01-15T10:00:00Z",
      total_interns: 25,
      active_interns: 22,
      completion_rate: 87.5,
      performance_score: 92.3,
      rank: 1
    },
    {
      id: 2,
      name: "MIT",
      description: "Massachusetts Institute of Technology",
      location: "Cambridge, MA, USA",
      created_by: 1,
      created_at: "2024-01-20T14:30:00Z",
      total_interns: 30,
      active_interns: 28,
      completion_rate: 85.2,
      performance_score: 90.1,
      rank: 2
    },
    {
      id: 3,
      name: "UC Berkeley",
      description: "University of California, Berkeley",
      location: "Berkeley, CA, USA",
      created_by: 1,
      created_at: "2024-02-01T09:15:00Z",
      total_interns: 20,
      active_interns: 18,
      completion_rate: 82.7,
      performance_score: 88.9,
      rank: 3
    }
  ],

  // Enhanced Cohorts Data
  cohorts: [
    {
      id: 1,
      name: "Summer 2024 AI/ML Program",
      description: "Intensive AI and Machine Learning internship program",
      college_id: 1,
      start_date: "2024-06-01",
      end_date: "2024-08-31",
      mentor_id: 1,
      created_at: "2024-01-15T10:00:00Z",
      total_interns: 15,
      active_interns: 14,
      completion_rate: 89.3,
      status: "active"
    },
    {
      id: 2,
      name: "Fall 2024 Web Development",
      description: "Full-stack web development bootcamp",
      college_id: 1,
      start_date: "2024-09-01",
      end_date: "2024-12-15",
      mentor_id: 1,
      created_at: "2024-01-20T14:30:00Z",
      total_interns: 10,
      active_interns: 8,
      completion_rate: 75.0,
      status: "active"
    },
    {
      id: 3,
      name: "Spring 2024 Data Science",
      description: "Data science and analytics program",
      college_id: 2,
      start_date: "2024-03-01",
      end_date: "2024-05-31",
      mentor_id: 1,
      created_at: "2024-02-01T09:15:00Z",
      total_interns: 12,
      active_interns: 11,
      completion_rate: 91.7,
      status: "completed"
    }
  ],

  // Enhanced Categories Data
  categories: [
    {
      id: 1,
      name: "Frontend Development",
      description: "React, Vue, Angular, HTML, CSS, JavaScript",
      color: "#3B82F6",
      created_by: 1,
      created_at: "2024-01-10T08:00:00Z",
      task_count: 45,
      completion_rate: 78.5,
      avg_time_hours: 12.5
    },
    {
      id: 2,
      name: "Backend Development",
      description: "Node.js, Python, Java, APIs, Databases",
      color: "#10B981",
      created_by: 1,
      created_at: "2024-01-10T08:15:00Z",
      task_count: 38,
      completion_rate: 82.1,
      avg_time_hours: 15.2
    },
    {
      id: 3,
      name: "DevOps & Deployment",
      description: "Docker, CI/CD, AWS, Kubernetes",
      color: "#F59E0B",
      created_by: 1,
      created_at: "2024-01-10T08:30:00Z",
      task_count: 22,
      completion_rate: 71.3,
      avg_time_hours: 18.7
    },
    {
      id: 4,
      name: "Data Science",
      description: "Python, R, Machine Learning, Analytics",
      color: "#8B5CF6",
      created_by: 1,
      created_at: "2024-01-10T08:45:00Z",
      task_count: 31,
      completion_rate: 85.9,
      avg_time_hours: 20.1
    },
    {
      id: 5,
      name: "Mobile Development",
      description: "React Native, Flutter, iOS, Android",
      color: "#EF4444",
      created_by: 1,
      created_at: "2024-01-10T09:00:00Z",
      task_count: 28,
      completion_rate: 76.8,
      avg_time_hours: 16.3
    }
  ],

  // Enhanced Interns Data
  interns: [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice.johnson@stanford.edu",
      college_id: 1,
      college_name: "Stanford University",
      cohort_id: 1,
      cohort_name: "Summer 2024 AI/ML Program",
      gitlab_id: "alice_johnson_123",
      gitlab_username: "alice.johnson",
      status: "active",
      join_date: "2024-06-01",
      completion_rate: 92.5,
      total_tasks: 40,
      completed_tasks: 37,
      in_progress_tasks: 2,
      pending_tasks: 1,
      total_commits: 156,
      last_commit: "2024-03-15T14:30:00Z",
      performance_score: 94.2,
      attendance_rate: 96.7,
      skills: ["Python", "TensorFlow", "React", "Git"],
      bio: "Passionate about AI and machine learning applications"
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob.smith@stanford.edu",
      college_id: 1,
      college_name: "Stanford University",
      cohort_id: 2,
      cohort_name: "Fall 2024 Web Development",
      gitlab_id: "bob_smith_456",
      gitlab_username: "bob.smith",
      status: "active",
      join_date: "2024-09-01",
      completion_rate: 78.3,
      total_tasks: 35,
      completed_tasks: 27,
      in_progress_tasks: 5,
      pending_tasks: 3,
      total_commits: 89,
      last_commit: "2024-03-14T16:45:00Z",
      performance_score: 81.7,
      attendance_rate: 89.2,
      skills: ["JavaScript", "Node.js", "MongoDB", "React"],
      bio: "Full-stack developer with focus on modern web technologies"
    },
    {
      id: 3,
      name: "Carol Davis",
      email: "carol.davis@mit.edu",
      college_id: 2,
      college_name: "MIT",
      cohort_id: 3,
      cohort_name: "Spring 2024 Data Science",
      gitlab_id: "carol_davis_789",
      gitlab_username: "carol.davis",
      status: "active",
      join_date: "2024-03-01",
      completion_rate: 95.8,
      total_tasks: 48,
      completed_tasks: 46,
      in_progress_tasks: 1,
      pending_tasks: 1,
      total_commits: 203,
      last_commit: "2024-03-15T11:20:00Z",
      performance_score: 97.1,
      attendance_rate: 98.5,
      skills: ["Python", "R", "Pandas", "Scikit-learn", "Tableau"],
      bio: "Data scientist specializing in predictive analytics"
    }
  ],

  // Enhanced Tasks Data
  tasks: [
    {
      id: 1,
      title: "Build React Dashboard",
      description: "Create a responsive dashboard using React and Tailwind CSS",
      category_id: 1,
      category_name: "Frontend Development",
      assigned_interns: [1, 2],
      created_by: 1,
      created_at: "2024-03-01T10:00:00Z",
      due_date: "2024-03-15T23:59:59Z",
      priority: "high",
      difficulty: "intermediate",
      estimated_hours: 20,
      resources: [
        { type: "documentation", url: "https://react.dev", title: "React Documentation" },
        { type: "tutorial", url: "https://tailwindcss.com", title: "Tailwind CSS Guide" }
      ],
      dependencies: [],
      gitlab_project: "react-dashboard-project",
      gitlab_issues: ["#1", "#2", "#3"],
      completion_rate: 85.0,
      status: "in_progress"
    },
    {
      id: 2,
      title: "API Integration",
      description: "Integrate REST APIs with authentication",
      category_id: 2,
      category_name: "Backend Development",
      assigned_interns: [2, 3],
      created_by: 1,
      created_at: "2024-03-02T14:30:00Z",
      due_date: "2024-03-20T23:59:59Z",
      priority: "medium",
      difficulty: "advanced",
      estimated_hours: 25,
      resources: [
        { type: "documentation", url: "https://nodejs.org", title: "Node.js Documentation" },
        { type: "tutorial", url: "https://jwt.io", title: "JWT Authentication" }
      ],
      dependencies: [1],
      gitlab_project: "api-integration-project",
      gitlab_issues: ["#4", "#5"],
      completion_rate: 60.0,
      status: "in_progress"
    }
  ],

  // Attendance Data
  attendance: [
    {
      id: 1,
      intern_id: 1,
      date: "2024-03-15",
      check_in: "09:00:00",
      check_out: "17:30:00",
      hours_worked: 8.5,
      ip_address: "192.168.1.100",
      location: "Stanford Campus",
      status: "present"
    },
    {
      id: 2,
      intern_id: 2,
      date: "2024-03-15",
      check_in: "09:15:00",
      check_out: "17:45:00",
      hours_worked: 8.5,
      ip_address: "192.168.1.101",
      location: "Stanford Campus",
      status: "present"
    }
  ],

  // Meetings Data
  meetings: [
    {
      id: 1,
      title: "Weekly Standup",
      description: "Weekly progress review and planning",
      date: "2024-03-18",
      start_time: "10:00:00",
      end_time: "11:00:00",
      type: "standup",
      attendees: [1, 2, 3],
      mentor_id: 1,
      meeting_link: "https://zoom.us/j/123456789",
      status: "scheduled"
    }
  ],

  // Chat Data
  chats: [
    {
      id: 1,
      type: "group",
      name: "AI/ML Cohort",
      participants: [1, 2, 3],
      created_by: 1,
      last_message: {
        sender_id: 1,
        message: "Great progress on the dashboard project!",
        timestamp: "2024-03-15T16:30:00Z"
      }
    }
  ]
};