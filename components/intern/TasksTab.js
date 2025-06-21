'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { MetricCard } from '../Charts';
import { format, addDays, subDays } from 'date-fns';

export function TasksTab({ user, loading }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'calendar'

  useEffect(() => {
    // Generate comprehensive task data for intern
    const generateTasks = () => [
      {
        id: 1,
        title: 'Setup Development Environment',
        description: 'Install and configure development tools, IDE, and project dependencies. This includes Node.js, Git, VS Code, and all necessary extensions.',
        status: 'done',
        priority: 'high',
        category: 'Setup',
        dueDate: '2024-01-15',
        createdDate: '2024-01-01',
        completedDate: '2024-01-14',
        estimatedHours: 4,
        actualHours: 3.5,
        progress: 100,
        tags: ['setup', 'environment', 'tools'],
        mentor: 'Dr. Smith',
        subtasks: [
          { id: 11, title: 'Install Node.js and npm', completed: true },
          { id: 12, title: 'Setup Git repository', completed: true },
          { id: 13, title: 'Configure VS Code', completed: true },
          { id: 14, title: 'Install project dependencies', completed: true }
        ],
        comments: [
          { id: 1, author: 'Dr. Smith', text: 'Great job setting up the environment!', timestamp: '2024-01-14T10:30:00Z' },
          { id: 2, author: 'You', text: 'Environment setup completed successfully', timestamp: '2024-01-14T11:00:00Z' }
        ],
        attachments: [
          { id: 1, name: 'setup-guide.pdf', size: '2.3 MB', type: 'pdf' }
        ],
        timeTracking: [
          { date: '2024-01-01', hours: 2, description: 'Initial setup research' },
          { date: '2024-01-02', hours: 1.5, description: 'Node.js and Git installation' }
        ]
      },
      {
        id: 2,
        title: 'Learn React Fundamentals',
        description: 'Complete React tutorial covering components, props, state, and hooks. Build a simple todo application to practice concepts.',
        status: 'in_progress',
        priority: 'high',
        category: 'Learning',
        dueDate: '2024-01-20',
        createdDate: '2024-01-05',
        estimatedHours: 12,
        actualHours: 8,
        progress: 75,
        tags: ['react', 'frontend', 'learning'],
        mentor: 'Dr. Smith',
        subtasks: [
          { id: 21, title: 'Complete React tutorial', completed: true },
          { id: 22, title: 'Build todo app', completed: true },
          { id: 23, title: 'Implement hooks', completed: false },
          { id: 24, title: 'Add styling', completed: false }
        ],
        comments: [
          { id: 3, author: 'Dr. Smith', text: 'Good progress on React basics. Focus on hooks next.', timestamp: '2024-01-16T14:20:00Z' },
          { id: 4, author: 'You', text: 'Working on useEffect and useState hooks', timestamp: '2024-01-16T15:00:00Z' }
        ],
        attachments: [
          { id: 2, name: 'react-notes.md', size: '1.2 MB', type: 'markdown' },
          { id: 3, name: 'todo-app-screenshot.png', size: '0.8 MB', type: 'image' }
        ],
        timeTracking: [
          { date: '2024-01-05', hours: 3, description: 'React tutorial - components' },
          { date: '2024-01-06', hours: 2.5, description: 'Props and state' },
          { date: '2024-01-08', hours: 2.5, description: 'Todo app development' }
        ]
      },
      {
        id: 3,
        title: 'Database Design Project',
        description: 'Design and implement a database schema for a library management system. Include tables for books, users, and transactions.',
        status: 'todo',
        priority: 'medium',
        category: 'Backend',
        dueDate: '2024-01-25',
        createdDate: '2024-01-10',
        estimatedHours: 8,
        actualHours: 0,
        progress: 0,
        tags: ['database', 'sql', 'design'],
        mentor: 'Dr. Johnson',
        subtasks: [
          { id: 31, title: 'Research database design principles', completed: false },
          { id: 32, title: 'Create ER diagram', completed: false },
          { id: 33, title: 'Write SQL schema', completed: false },
          { id: 34, title: 'Populate with sample data', completed: false }
        ],
        comments: [],
        attachments: [
          { id: 4, name: 'database-requirements.pdf', size: '1.5 MB', type: 'pdf' }
        ],
        timeTracking: []
      },
      {
        id: 4,
        title: 'API Integration Task',
        description: 'Integrate with a REST API to fetch and display user data. Implement error handling and loading states.',
        status: 'todo',
        priority: 'high',
        category: 'Frontend',
        dueDate: '2024-01-30',
        createdDate: '2024-01-12',
        estimatedHours: 6,
        actualHours: 0,
        progress: 0,
        tags: ['api', 'integration', 'frontend'],
        mentor: 'Dr. Smith',
        subtasks: [
          { id: 41, title: 'Study API documentation', completed: false },
          { id: 42, title: 'Implement API calls', completed: false },
          { id: 43, title: 'Add error handling', completed: false },
          { id: 44, title: 'Create loading states', completed: false }
        ],
        comments: [
          { id: 5, author: 'Dr. Smith', text: 'Start with the API documentation review', timestamp: '2024-01-12T09:00:00Z' }
        ],
        attachments: [
          { id: 5, name: 'api-documentation.pdf', size: '3.1 MB', type: 'pdf' }
        ],
        timeTracking: []
      },
      {
        id: 5,
        title: 'Code Review Practice',
        description: 'Review code submissions from peer interns and provide constructive feedback. Focus on code quality and best practices.',
        status: 'blocked',
        priority: 'low',
        category: 'Review',
        dueDate: '2024-02-05',
        createdDate: '2024-01-15',
        estimatedHours: 4,
        actualHours: 0,
        progress: 0,
        tags: ['review', 'collaboration', 'quality'],
        mentor: 'Dr. Smith',
        subtasks: [
          { id: 51, title: 'Review peer code submissions', completed: false },
          { id: 52, title: 'Provide feedback', completed: false },
          { id: 53, title: 'Discuss improvements', completed: false }
        ],
        comments: [
          { id: 6, author: 'Dr. Smith', text: 'Waiting for peer submissions to be ready', timestamp: '2024-01-15T10:00:00Z' }
        ],
        attachments: [],
        timeTracking: []
      }
    ];

    setTasks(generateTasks());
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      const taskId = parseInt(result.draggableId);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 border-green-300';
      case 'in_progress': return 'bg-blue-100 border-blue-300';
      case 'blocked': return 'bg-red-100 border-red-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // Calculate metrics
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
  const overdueTasks = tasks.filter(t => 
    new Date(t.dueDate) < new Date() && t.status !== 'done'
  ).length;

  const TaskModal = () => {
    if (!selectedTask) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedTask.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>📅 Due: {format(new Date(selectedTask.dueDate), 'MMM dd, yyyy')}</span>
                  <span>👨‍🏫 Mentor: {selectedTask.mentor}</span>
                  <span className={`font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {getPriorityIcon(selectedTask.priority)} {selectedTask.priority} priority
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedTask.description}</p>
                </div>

                {/* Subtasks */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Subtasks</h3>
                  <div className="space-y-2">
                    {selectedTask.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center space-x-3 p-2 border rounded">
                        <input 
                          type="checkbox" 
                          checked={subtask.completed}
                          className="rounded"
                          readOnly
                        />
                        <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
                  <div className="space-y-3">
                    {selectedTask.comments.map(comment => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                    
                    {/* Add Comment */}
                    <div className="border-t pt-3">
                      <textarea
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                      <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        Add Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Progress */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Completion</span>
                      <span>{selectedTask.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${selectedTask.progress}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Time Spent</span>
                      <span>{selectedTask.actualHours}h / {selectedTask.estimatedHours}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          selectedTask.actualHours > selectedTask.estimatedHours ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((selectedTask.actualHours / selectedTask.estimatedHours) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                {selectedTask.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {selectedTask.attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center space-x-3 p-2 border rounded">
                          <div className="text-blue-500">📎</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">{attachment.name}</div>
                            <div className="text-xs text-gray-500">{attachment.size}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Tracking */}
                {selectedTask.timeTracking.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Time Tracking</h3>
                    <div className="space-y-2">
                      {selectedTask.timeTracking.map((entry, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span>{format(new Date(entry.date), 'MMM dd')}</span>
                            <span className="font-medium">{entry.hours}h</span>
                          </div>
                          <div className="text-xs text-gray-500">{entry.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Update Progress
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Mark Complete
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  Request Help
                </button>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  Log Time
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Completed"
          value={completedTasks}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="In Progress"
          value={inProgressTasks}
          icon="⏳"
          color="blue"
        />
        <MetricCard
          title="Blocked"
          value={blockedTasks}
          icon="🚫"
          color="red"
        />
        <MetricCard
          title="Overdue"
          value={overdueTasks}
          icon="⚠️"
          color="orange"
        />
      </div>

      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { id: 'kanban', label: 'Kanban', icon: '📋' },
              { id: 'list', label: 'List', icon: '📝' },
              { id: 'calendar', label: 'Calendar', icon: '📅' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-1">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {['todo', 'in_progress', 'done', 'blocked'].map(status => (
              <div key={status} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 capitalize">
                  {status.replace('_', ' ')} ({filteredTasks.filter(t => t.status === status).length})
                </h3>
                
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {filteredTasks
                        .filter(task => task.status === status)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-4 rounded-lg shadow-sm border-l-4 cursor-pointer transition-shadow hover:shadow-md ${
                                  getStatusColor(task.status)
                                } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTaskModal(true);
                                }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                                  <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                    {getPriorityIcon(task.priority)}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                                
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-500">
                                    Due: {format(new Date(task.dueDate), 'MMM dd')}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {task.mentor}
                                  </span>
                                </div>
                                
                                {task.progress > 0 && (
                                  <div className="mb-2">
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                      <div 
                                        className="bg-blue-600 h-1 rounded-full"
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="flex items-center justify-between">
                                  <div className="flex space-x-1">
                                    {task.tags.slice(0, 2).map(tag => (
                                      <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  
                                  {task.subtasks.length > 0 && (
                                    <span className="text-xs text-gray-500">
                                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mentor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'done' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-900">{task.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.mentor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📅 Task Calendar</h3>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const date = addDays(subDays(new Date(), new Date().getDay()), i - 7);
              const dayTasks = tasks.filter(task => 
                format(new Date(task.dueDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
              );
              
              return (
                <div key={i} className="min-h-[100px] p-2 border border-gray-200 rounded">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <div 
                        key={task.id}
                        className={`text-xs p-1 rounded cursor-pointer ${getStatusColor(task.status)}`}
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                      >
                        {task.title.substring(0, 15)}...
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && <TaskModal />}
    </div>
  );
}