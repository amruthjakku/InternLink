'use client';

import { useState } from 'react';

export function TasksTab({ user, tasks, updateTask, loading }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionLink, setSubmissionLink] = useState('');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'due_date':
        return new Date(a.due_date) - new Date(b.due_date);
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'progress':
        return b.progress - a.progress;
      default:
        return 0;
    }
  });

  const handleStatusChange = (taskId, newStatus) => {
    const progress = newStatus === 'done' ? 100 : newStatus === 'in_progress' ? 50 : 0;
    updateTask(taskId, { status: newStatus, progress });
  };

  const handleSubmissionSubmit = (taskId) => {
    if (submissionLink.trim()) {
      updateTask(taskId, { 
        submission_link: submissionLink,
        status: 'done',
        progress: 100
      });
      setSubmissionLink('');
      setSelectedTask(null);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[140px]"
              >
                <option value="all">All Tasks</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[160px]"
              >
                <option value="due_date">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="progress">Sort by Progress</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{filteredTasks.length}</span> of <span className="font-medium">{tasks.length}</span> tasks
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-500">Completed</span>
              <div className="w-3 h-3 bg-blue-500 rounded-full ml-3"></div>
              <span className="text-xs text-gray-500">In Progress</span>
              <div className="w-3 h-3 bg-gray-400 rounded-full ml-3"></div>
              <span className="text-xs text-gray-500">Not Started</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {sortedTasks.map((task) => {
          const daysUntilDue = getDaysUntilDue(task.due_date);
          const isOverdue = daysUntilDue < 0;
          const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;

          return (
            <div key={task.id} className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1 lg:mr-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">{task.title}</h3>
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === 'done' ? 'bg-green-500' : 
                        task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{task.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority} priority
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'done' ? '✅' : task.status === 'in_progress' ? '🔄' : '⏸️'} {task.status.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      📂 {task.category}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Overdue
                      </span>
                    )}
                    {isDueSoon && !isOverdue && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ⏰ Due Soon
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-2">📅</span>
                      <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">⏱️</span>
                      <span>Time: {task.time_spent}h</span>
                    </div>
                    {task.submission_link && (
                      <div className="flex items-center">
                        <span className="mr-2">🔗</span>
                        <a 
                          href={task.submission_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          View Submission
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="lg:ml-6 flex flex-col items-center lg:items-end space-y-3">
                  <div className="text-center lg:text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{task.progress}%</div>
                    <div className="text-xs text-gray-500 mb-2">Progress</div>
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          task.status === 'done' ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                          task.status === 'in_progress' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-col space-y-2">
                    {task.status === 'not_started' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      >
                        <span>▶️</span>
                        <span>Start Task</span>
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => setSelectedTask(task.id)}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                        >
                          <span>✅</span>
                          <span>Submit</span>
                        </button>
                        <button
                          onClick={() => handleStatusChange(task.id, 'not_started')}
                          className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                        >
                          <span>⏸️</span>
                          <span>Pause</span>
                        </button>
                      </>
                    )}
                    {task.status === 'done' && (
                      <button
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                        className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                      >
                        <span>🔄</span>
                        <span>Reopen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>🔗</span>
                    <span>Depends on:</span>
                    <div className="flex flex-wrap gap-1">
                      {task.dependencies.map(depId => {
                        const depTask = tasks.find(t => t.id === depId);
                        return (
                          <span key={depId} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {depTask ? depTask.title : `Task ${depId}`}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Modal */}
              {selectedTask === task.id && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <span className="text-2xl mr-3">🚀</span>
                    <h4 className="font-semibold text-gray-900">Submit Your Work</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Submission Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username/repo or https://drive.google.com/..."
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Share your GitHub repository, Google Drive link, or any other submission URL
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleSubmissionSubmit(task.id)}
                        disabled={!submissionLink.trim()}
                        className="px-6 py-3 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        <span>✅</span>
                        <span>Submit Task</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTask(null);
                          setSubmissionLink('');
                        }}
                        className="px-6 py-3 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                      >
                        <span>❌</span>
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sortedTasks.length === 0 && (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400 text-8xl mb-6">
            {filter === 'all' ? '📝' : 
             filter === 'done' ? '✅' : 
             filter === 'in_progress' ? '🔄' : '⏸️'}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {filter === 'all' ? 'No tasks assigned yet' : `No ${filter.replace('_', ' ')} tasks`}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            {filter === 'all' 
              ? "Your mentor will assign tasks soon. Check back later or reach out if you have questions!" 
              : `You don't have any tasks with "${filter.replace('_', ' ')}" status. Try changing the filter to see other tasks.`
            }
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
            >
              <span>👀</span>
              <span>View All Tasks</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}