'use client';

import { useState, useEffect } from 'react';
import { EnhancedBarChart, EnhancedLineChart, MetricCard, SkillRadarChart } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export function InternManagementTab() {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showInternModal, setShowInternModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [internAnalytics, setInternAnalytics] = useState({});

  useEffect(() => {
    // Generate comprehensive intern data
    const generateInterns = () => [
      {
        id: 1,
        name: 'Alex Chen',
        email: 'alex.chen@college.edu',
        college: 'MIT',
        avatar: 'AC',
        color: 'bg-blue-500',
        status: 'active',
        joinDate: '2024-01-01',
        lastActive: '2024-01-16',
        performanceScore: 92,
        tasksCompleted: 15,
        totalTasks: 18,
        completionRate: 83,
        avgTaskTime: 2.5, // days
        skills: [
          { name: 'React', level: 8, progress: 85 },
          { name: 'Node.js', level: 7, progress: 70 },
          { name: 'MongoDB', level: 6, progress: 60 },
          { name: 'Git', level: 9, progress: 90 },
          { name: 'Testing', level: 5, progress: 50 }
        ],
        recentActivity: [
          { date: '2024-01-16', action: 'Completed task: API Integration', type: 'task' },
          { date: '2024-01-15', action: 'Submitted code review', type: 'review' },
          { date: '2024-01-14', action: 'Attended team meeting', type: 'meeting' }
        ],
        strengths: ['Problem Solving', 'Communication', 'Technical Skills'],
        areasForImprovement: ['Time Management', 'Documentation'],
        goals: [
          { id: 1, title: 'Master React Hooks', progress: 75, dueDate: '2024-02-01' },
          { id: 2, title: 'Complete 20 tasks', progress: 83, dueDate: '2024-01-31' }
        ],
        feedback: [
          { date: '2024-01-10', mentor: 'Dr. Smith', rating: 4, comment: 'Great progress on React components' },
          { date: '2024-01-05', mentor: 'Dr. Smith', rating: 5, comment: 'Excellent problem-solving skills' }
        ]
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        college: 'Stanford',
        avatar: 'SJ',
        color: 'bg-green-500',
        status: 'active',
        joinDate: '2024-01-02',
        lastActive: '2024-01-16',
        performanceScore: 88,
        tasksCompleted: 12,
        totalTasks: 15,
        completionRate: 80,
        avgTaskTime: 3.2,
        skills: [
          { name: 'Vue.js', level: 9, progress: 90 },
          { name: 'Python', level: 8, progress: 80 },
          { name: 'PostgreSQL', level: 7, progress: 70 },
          { name: 'Docker', level: 6, progress: 60 },
          { name: 'AWS', level: 5, progress: 50 }
        ],
        recentActivity: [
          { date: '2024-01-16', action: 'Started new task: Database optimization', type: 'task' },
          { date: '2024-01-15', action: 'Completed Vue.js tutorial', type: 'learning' },
          { date: '2024-01-14', action: 'Peer code review', type: 'review' }
        ],
        strengths: ['Frontend Development', 'UI/UX Design', 'Team Collaboration'],
        areasForImprovement: ['Backend Development', 'System Design'],
        goals: [
          { id: 1, title: 'Learn Docker containerization', progress: 60, dueDate: '2024-02-15' },
          { id: 2, title: 'Build full-stack application', progress: 40, dueDate: '2024-02-28' }
        ],
        feedback: [
          { date: '2024-01-12', mentor: 'Dr. Smith', rating: 4, comment: 'Strong frontend skills, work on backend' },
          { date: '2024-01-08', mentor: 'Dr. Smith', rating: 5, comment: 'Excellent attention to detail' }
        ]
      },
      {
        id: 3,
        name: 'Mike Rodriguez',
        email: 'mike.rodriguez@tech.edu',
        college: 'Carnegie Mellon',
        avatar: 'MR',
        color: 'bg-purple-500',
        status: 'at_risk',
        joinDate: '2024-01-05',
        lastActive: '2024-01-14',
        performanceScore: 65,
        tasksCompleted: 8,
        totalTasks: 14,
        completionRate: 57,
        avgTaskTime: 4.8,
        skills: [
          { name: 'JavaScript', level: 6, progress: 60 },
          { name: 'HTML/CSS', level: 7, progress: 70 },
          { name: 'React', level: 4, progress: 40 },
          { name: 'Git', level: 5, progress: 50 },
          { name: 'Testing', level: 3, progress: 30 }
        ],
        recentActivity: [
          { date: '2024-01-14', action: 'Missed deadline for CSS styling task', type: 'issue' },
          { date: '2024-01-12', action: 'Requested help with React components', type: 'help' },
          { date: '2024-01-10', action: 'Completed HTML structure task', type: 'task' }
        ],
        strengths: ['HTML/CSS', 'Design Sense'],
        areasForImprovement: ['JavaScript', 'Time Management', 'Problem Solving'],
        goals: [
          { id: 1, title: 'Improve JavaScript fundamentals', progress: 30, dueDate: '2024-02-01' },
          { id: 2, title: 'Complete tasks on time', progress: 20, dueDate: '2024-01-31' }
        ],
        feedback: [
          { date: '2024-01-13', mentor: 'Dr. Smith', rating: 3, comment: 'Needs to focus on JavaScript basics' },
          { date: '2024-01-09', mentor: 'Dr. Smith', rating: 3, comment: 'Good design skills, improve coding' }
        ]
      },
      {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@institute.edu',
        college: 'UC Berkeley',
        avatar: 'ED',
        color: 'bg-pink-500',
        status: 'excellent',
        joinDate: '2024-01-03',
        lastActive: '2024-01-16',
        performanceScore: 96,
        tasksCompleted: 20,
        totalTasks: 21,
        completionRate: 95,
        avgTaskTime: 1.8,
        skills: [
          { name: 'React', level: 9, progress: 90 },
          { name: 'Node.js', level: 8, progress: 80 },
          { name: 'MongoDB', level: 8, progress: 80 },
          { name: 'TypeScript', level: 7, progress: 70 },
          { name: 'GraphQL', level: 6, progress: 60 }
        ],
        recentActivity: [
          { date: '2024-01-16', action: 'Mentored junior intern', type: 'mentoring' },
          { date: '2024-01-15', action: 'Completed advanced React patterns task', type: 'task' },
          { date: '2024-01-14', action: 'Led team standup meeting', type: 'leadership' }
        ],
        strengths: ['Full Stack Development', 'Leadership', 'Mentoring', 'Problem Solving'],
        areasForImprovement: ['System Architecture', 'DevOps'],
        goals: [
          { id: 1, title: 'Learn system design patterns', progress: 70, dueDate: '2024-02-15' },
          { id: 2, title: 'Mentor 2 junior interns', progress: 50, dueDate: '2024-02-28' }
        ],
        feedback: [
          { date: '2024-01-14', mentor: 'Dr. Smith', rating: 5, comment: 'Outstanding performance and leadership' },
          { date: '2024-01-10', mentor: 'Dr. Smith', rating: 5, comment: 'Exceptional technical and soft skills' }
        ]
      }
    ];

    // Generate analytics data
    const generateAnalytics = () => {
      const mockInterns = generateInterns();
      const totalInterns = mockInterns.length;
      const activeInterns = mockInterns.filter(i => i.status === 'active' || i.status === 'excellent').length;
      const atRiskInterns = mockInterns.filter(i => i.status === 'at_risk').length;
      const avgPerformance = mockInterns.reduce((sum, intern) => sum + intern.performanceScore, 0) / totalInterns;
      const avgCompletionRate = mockInterns.reduce((sum, intern) => sum + intern.completionRate, 0) / totalInterns;

      // Performance trend data
      const performanceTrend = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date()
      }).map(date => ({
        date,
        avgPerformance: Math.floor(Math.random() * 20) + 75,
        tasksCompleted: Math.floor(Math.random() * 10) + 5,
        activeInterns: Math.floor(Math.random() * 2) + activeInterns - 1
      }));

      // Skill distribution data
      const skillDistribution = {
        labels: ['Frontend', 'Backend', 'Database', 'DevOps', 'Testing'],
        datasets: [{
          label: 'Average Skill Level',
          data: [7.5, 6.8, 6.2, 5.5, 4.8],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
        }]
      };

      return {
        totalInterns,
        activeInterns,
        atRiskInterns,
        avgPerformance: Math.round(avgPerformance),
        avgCompletionRate: Math.round(avgCompletionRate),
        performanceTrend,
        skillDistribution
      };
    };

    setInterns(generateInterns());
    setInternAnalytics(generateAnalytics());
  }, []);

  // Filter interns
  const filteredInterns = interns.filter(intern => {
    if (filterStatus !== 'all' && intern.status !== filterStatus) return false;
    if (filterPerformance !== 'all') {
      if (filterPerformance === 'high' && intern.performanceScore < 85) return false;
      if (filterPerformance === 'medium' && (intern.performanceScore < 70 || intern.performanceScore >= 85)) return false;
      if (filterPerformance === 'low' && intern.performanceScore >= 70) return false;
    }
    if (searchTerm && !intern.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !intern.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'at_risk': return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Performance trend chart data
  const performanceTrendData = {
    labels: internAnalytics.performanceTrend?.map(d => format(d.date, 'MMM dd')) || [],
    datasets: [
      {
        label: 'Avg Performance',
        data: internAnalytics.performanceTrend?.map(d => d.avgPerformance) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Tasks Completed',
        data: internAnalytics.performanceTrend?.map(d => d.tasksCompleted) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const InternModal = () => {
    if (!selectedIntern) return null;

    const skillRadarData = {
      labels: selectedIntern.skills.map(skill => skill.name),
      datasets: [{
        label: 'Current Level',
        data: selectedIntern.skills.map(skill => skill.level),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      }]
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 ${selectedIntern.color} rounded-full flex items-center justify-center text-white text-xl font-bold`}>
                  {selectedIntern.avatar}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedIntern.name}</h2>
                  <p className="text-gray-600">{selectedIntern.email}</p>
                  <p className="text-sm text-gray-500">{selectedIntern.college}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedIntern.status)}`}>
                      {selectedIntern.status.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPerformanceColor(selectedIntern.performanceScore)}`}>
                      {selectedIntern.performanceScore}% Performance
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInternModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">📊 Performance Metrics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedIntern.tasksCompleted}</div>
                      <div className="text-sm text-blue-800">Tasks Completed</div>
                      <div className="text-xs text-blue-600">of {selectedIntern.totalTasks} total</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedIntern.completionRate}%</div>
                      <div className="text-sm text-green-800">Completion Rate</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{selectedIntern.avgTaskTime}</div>
                      <div className="text-sm text-purple-800">Avg Task Time</div>
                      <div className="text-xs text-purple-600">days</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{selectedIntern.performanceScore}</div>
                      <div className="text-sm text-orange-800">Performance Score</div>
                    </div>
                  </div>
                </div>

                {/* Skills Progress */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">🎯 Skills Development</h3>
                  <div className="space-y-3">
                    {selectedIntern.skills.map(skill => (
                      <div key={skill.name}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{skill.name}</span>
                          <span className="text-sm text-gray-600">Level {skill.level}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${skill.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">🎯 Current Goals</h3>
                  <div className="space-y-3">
                    {selectedIntern.goals.map(goal => (
                      <div key={goal.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{goal.title}</h4>
                          <span className="text-sm text-gray-500">
                            Due: {format(new Date(goal.dueDate), 'MMM dd')}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div 
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600">{goal.progress}% complete</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Skill Radar Chart */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">📈 Skills Overview</h3>
                  <SkillRadarChart data={skillRadarData} height={250} />
                </div>

                {/* Strengths & Areas for Improvement */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">💪 Strengths & Growth Areas</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIntern.strengths.map(strength => (
                          <span key={strength} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">Areas for Improvement</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIntern.areasForImprovement.map(area => (
                          <span key={area} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">📋 Recent Activity</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedIntern.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.type === 'task' ? 'bg-blue-500' :
                          activity.type === 'review' ? 'bg-green-500' :
                          activity.type === 'meeting' ? 'bg-purple-500' :
                          activity.type === 'learning' ? 'bg-yellow-500' :
                          activity.type === 'issue' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.action}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(activity.date), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Feedback */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">💬 Recent Feedback</h3>
                  <div className="space-y-3">
                    {selectedIntern.feedback.slice(0, 3).map((feedback, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{feedback.mentor}</span>
                            <div className="flex space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-sm ${i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(feedback.date), 'MMM dd')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{feedback.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Send Message
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Assign Task
                </button>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Schedule 1:1
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  Provide Feedback
                </button>
                <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                  Set Goals
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Interns"
          value={internAnalytics.totalInterns || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Interns"
          value={internAnalytics.activeInterns || 0}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="At Risk"
          value={internAnalytics.atRiskInterns || 0}
          icon="⚠️"
          color="red"
        />
        <MetricCard
          title="Avg Performance"
          value={`${internAnalytics.avgPerformance || 0}%`}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📈 Performance Trends</h3>
          <EnhancedLineChart 
            data={performanceTrendData} 
            height={250}
            options={{
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: { display: true, text: 'Performance Score' }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { display: true, text: 'Tasks Completed' },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Skill Distribution</h3>
          <EnhancedBarChart data={internAnalytics.skillDistribution || {}} height={250} />
        </div>
      </div>

      {/* Intern Management Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Intern Management</h3>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              + Add Intern
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search interns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Performance</option>
              <option value="high">High (85%+)</option>
              <option value="medium">Medium (70-84%)</option>
              <option value="low">Low (&lt;70%)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intern
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInterns.map((intern) => (
                <tr key={intern.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${intern.color} rounded-full flex items-center justify-center text-white font-bold`}>
                        {intern.avatar}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                        <div className="text-sm text-gray-500">{intern.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {intern.college}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(intern.status)}`}>
                      {intern.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium mr-2 ${getPerformanceColor(intern.performanceScore)}`}>
                        {intern.performanceScore}%
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        intern.performanceScore >= 90 ? 'bg-green-500' :
                        intern.performanceScore >= 80 ? 'bg-blue-500' :
                        intern.performanceScore >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {intern.tasksCompleted}/{intern.totalTasks}
                    <div className="text-xs text-gray-500">
                      {intern.completionRate}% completion
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(intern.lastActive), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedIntern(intern);
                        setShowInternModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intern Modal */}
      {showInternModal && <InternModal />}
    </div>
  );
}