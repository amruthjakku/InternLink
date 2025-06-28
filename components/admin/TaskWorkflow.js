import { useState, useEffect } from 'react';

const TaskWorkflow = () => {
  const [activeSubTab, setActiveSubTab] = useState('create-tasks');
  const [cohorts, setCohorts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchCohorts();
    fetchTasks();
  }, []);

  const fetchCohorts = async () => {
    try {
      const response = await fetch('/api/admin/cohorts-colleges');
      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts || []);
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const subTabs = [
    { id: 'create-tasks', name: 'Create & Assign Tasks', icon: '📝', description: 'Create tasks and assign to cohorts/colleges' },
    { id: 'task-overview', name: 'Task Overview', icon: '📋', description: 'View all tasks and their assignments' },
    { id: 'college-tasks', name: 'College Tasks', icon: '🏫', description: 'Manage tasks by college' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            Hierarchical Task Assignment
          </h2>
          <p className="text-gray-600 mt-1">Create tasks and assign them hierarchically: Admin → Cohort → Colleges → Users</p>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'create-tasks' && <CreateTasksTab cohorts={cohorts} />}
          {activeSubTab === 'task-overview' && <TaskOverviewTab tasks={tasks} />}
          {activeSubTab === 'college-tasks' && <CollegeTasksTab cohorts={cohorts} />}
        </div>
      </div>
    </div>
  );
};

const CreateTasksTab = ({ cohorts }) => {
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    type: 'assignment',
    dueDate: '',
    priority: 'medium',
    points: 0,
    cohortId: '',
    collegeIds: []
  });
  const [selectedCohort, setSelectedCohort] = useState(null);

  const handleCohortSelect = (cohort) => {
    setSelectedCohort(cohort);
    setTaskForm({ ...taskForm, cohortId: cohort._id, collegeIds: [] });
  };

  const handleCollegeToggle = (collegeId) => {
    const isSelected = taskForm.collegeIds.includes(collegeId);
    const newCollegeIds = isSelected
      ? taskForm.collegeIds.filter(id => id !== collegeId)
      : [...taskForm.collegeIds, collegeId];
    
    setTaskForm({ ...taskForm, collegeIds: newCollegeIds });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          assignmentType: 'hierarchical',
          assignedTo: {
            cohort: taskForm.cohortId,
            colleges: taskForm.collegeIds
          }
        })
      });

      if (response.ok) {
        alert('Task created and assigned successfully!');
        setTaskForm({
          title: '',
          description: '',
          type: 'assignment',
          dueDate: '',
          priority: 'medium',
          points: 0,
          cohortId: '',
          collegeIds: []
        });
        setSelectedCohort(null);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">📋 Hierarchical Task Assignment Workflow</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>1. <strong>Create Task</strong> - Define task details and requirements</div>
          <div>2. <strong>Select Cohort</strong> - Choose which cohort will receive the task</div>
          <div>3. <strong>Select Colleges</strong> - Choose specific colleges within that cohort</div>
          <div>4. <strong>Auto-Assignment</strong> - Task gets assigned to users in selected colleges</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Task Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Describe the task requirements"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={taskForm.type}
                onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="assignment">Assignment</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
              <input
                type="number"
                value={taskForm.points}
                onChange={(e) => setTaskForm({ ...taskForm, points: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Assignment Hierarchy */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Assignment Hierarchy</h3>

          {/* Step 1: Select Cohort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Step 1: Select Cohort
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cohorts.map((cohort) => (
                <div
                  key={cohort._id}
                  onClick={() => handleCohortSelect(cohort)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedCohort?._id === cohort._id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{cohort.name}</div>
                      <div className="text-sm text-gray-500">{cohort.description}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {cohort.colleges?.length || 0} colleges
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Select Colleges */}
          {selectedCohort && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Step 2: Select Colleges in {selectedCohort.name}
              </label>
              {selectedCohort.colleges && selectedCohort.colleges.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCohort.colleges.map((collegeGroup) => (
                    <div
                      key={collegeGroup.college._id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={taskForm.collegeIds.includes(collegeGroup.college._id)}
                          onChange={() => handleCollegeToggle(collegeGroup.college._id)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{collegeGroup.college.name}</div>
                          <div className="text-sm text-gray-500">
                            {collegeGroup.interns} interns, {collegeGroup.mentors} mentors
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No colleges assigned to this cohort
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!taskForm.title || !taskForm.cohortId || taskForm.collegeIds.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Create & Assign Task
          </button>
        </div>
      </form>
    </div>
  );
};

const TaskOverviewTab = ({ tasks }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">All Tasks Overview</h3>
      
      <div className="grid gap-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task._id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Type: {task.type}</span>
                    <span>Priority: {task.priority}</span>
                    <span>Points: {task.points || 0}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No tasks created yet. Use the "Create & Assign Tasks" tab to get started.
          </div>
        )}
      </div>
    </div>
  );
};

const CollegeTasksTab = ({ cohorts }) => {
  const [selectedCohort, setSelectedCohort] = useState(null);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Tasks by College</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cohort Selection */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Select Cohort</h4>
          <div className="space-y-2">
            {cohorts.map((cohort) => (
              <div
                key={cohort._id}
                onClick={() => setSelectedCohort(cohort)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedCohort?._id === cohort._id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{cohort.name}</div>
                <div className="text-sm text-gray-500">{cohort.colleges?.length || 0} colleges</div>
              </div>
            ))}
          </div>
        </div>

        {/* College Tasks */}
        <div>
          {selectedCohort ? (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Colleges in {selectedCohort.name}
              </h4>
              <div className="space-y-3">
                {selectedCohort.colleges?.map((collegeGroup) => (
                  <div key={collegeGroup.college._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{collegeGroup.college.name}</h5>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {collegeGroup.users?.length || 0} users
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Interns: {collegeGroup.interns || 0}</div>
                      <div>Mentors: {collegeGroup.mentors || 0}</div>
                    </div>
                    {/* Task assignment details would go here */}
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">
                    No colleges in this cohort
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Select a cohort to view college tasks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskWorkflow;