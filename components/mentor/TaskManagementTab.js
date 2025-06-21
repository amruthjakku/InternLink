'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function TaskManagementTab() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [interns, setInterns] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDependencyView, setShowDependencyView] = useState(false);

  useEffect(() => {
    setTasks(mockData.tasks);
    setCategories(mockData.categories);
    setInterns(mockData.interns);
  }, []);

  const TaskCreationForm = () => {
    if (!showCreateForm) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Task</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Task Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe the task requirements..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Hours</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assign to Interns</label>
                <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                  {interns.map(intern => (
                    <label key={intern.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{intern.name} - {intern.college_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">GitLab Project</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="project-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Resources</label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Resource title"
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      ➕
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const TaskList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Task Management</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDependencyView(!showDependencyView)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              showDependencyView 
                ? 'text-blue-700 bg-blue-50 border-blue-300' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">🔗</span>
            Dependencies
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <span className="mr-2">➕</span>
            Create Task
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              selectedTask?.id === task.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: categories.find(c => c.id === task.category_id)?.color + '20', color: categories.find(c => c.id === task.category_id)?.color }}
                  >
                    {task.category_name}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    task.priority === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>👥 {task.assigned_interns.length} interns</span>
                  <span>⏱️ {task.estimated_hours}h estimated</span>
                  <span>📊 {task.completion_rate.toFixed(0)}% complete</span>
                  {task.gitlab_project && <span>🦊 {task.gitlab_project}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div className="w-16 h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${task.completion_rate}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center mt-1">
                  {task.completion_rate.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TaskDetails = () => {
    if (!selectedTask) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Task</h3>
          <p className="text-gray-500">Choose a task from the list above to view detailed information</p>
        </div>
      );
    }

    const assignedInternDetails = interns.filter(intern => 
      selectedTask.assigned_interns.includes(intern.id)
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedTask.title}</h3>
            <p className="text-gray-600 mb-4">{selectedTask.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="mr-1">📅</span>
                Due: {new Date(selectedTask.due_date).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <span className="mr-1">⏱️</span>
                {selectedTask.estimated_hours} hours
              </span>
              <span className="flex items-center">
                <span className="mr-1">🎯</span>
                {selectedTask.difficulty}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{selectedTask.completion_rate.toFixed(0)}%</div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>

        {/* Assigned Interns */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Assigned Interns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignedInternDetails.map(intern => (
              <div key={intern.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {intern.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{intern.name}</p>
                  <p className="text-xs text-gray-500">{intern.college_name}</p>
                </div>
                <div className="text-xs text-gray-500">
                  {intern.completion_rate.toFixed(0)}% avg
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        {selectedTask.resources && selectedTask.resources.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Resources</h4>
            <div className="space-y-2">
              {selectedTask.resources.map((resource, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <span className="text-sm">
                    {resource.type === 'documentation' ? '📚' : 
                     resource.type === 'tutorial' ? '🎓' : 
                     resource.type === 'dataset' ? '📊' : '🔗'}
                  </span>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    {resource.title}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GitLab Integration */}
        {selectedTask.gitlab_project && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">GitLab Integration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Project:</span>
                <span className="ml-2 text-gray-900">{selectedTask.gitlab_project}</span>
              </div>
              <div>
                <span className="text-gray-500">Issues:</span>
                <span className="ml-2 text-gray-900">{selectedTask.gitlab_issues?.join(', ')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DependencyView = () => {
    if (!showDependencyView) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Dependencies</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🔗</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Dependency Graph</h4>
          <p className="text-gray-500 mb-4">Visual representation of task dependencies would appear here</p>
          <div className="bg-gray-100 p-8 rounded-lg">
            <p className="text-sm text-gray-600">Interactive dependency graph using D3.js or similar visualization library</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <TaskList />
      {showDependencyView && <DependencyView />}
      <TaskDetails />
      <TaskCreationForm />
    </div>
  );
}