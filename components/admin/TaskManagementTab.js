'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function TaskManagementTab() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedCohort, setSelectedCohort] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'folders'
  const [draggedTask, setDraggedTask] = useState(null);
  const [newWeekName, setNewWeekName] = useState('');
  const [showCreateWeek, setShowCreateWeek] = useState(false);
  const [createdWeeks, setCreatedWeeks] = useState(() => {
    // Load created weeks from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_created_weeks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  }); // Track manually created weeks
  const [showWeekCreatedNotification, setShowWeekCreatedNotification] = useState(null);
  const [showTaskMovedNotification, setShowTaskMovedNotification] = useState(null);
  const [newTask, setNewTask] = useState(() => {
    // Try to restore form data from localStorage
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('taskForm_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Return only the task data, not the metadata
          const { _savedAt, ...taskData } = parsed;
          return taskData;
        } catch (error) {
          console.error('Error parsing saved task form:', error);
        }
      }
    }
    
    // Default form state
    return {
      title: '',
      description: '',
      type: 'assignment',
      priority: 'medium',
      category: '',
      assignmentType: 'cohort',
      cohortId: '',
      dueDate: '',
      startDate: '',
      estimatedHours: 0,
      points: 0,
      weekNumber: 1,
      tags: [],
      requirements: [],
      resources: [],
      attachments: [],
      subtasks: []
    };
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Save form data to localStorage whenever newTask changes (with debounce)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only save if the form has some content (not empty)
      const hasContent = newTask.title || newTask.description || newTask.category;
      if (hasContent) {
        // Debounce the save operation to avoid too frequent saves
        const saveTimer = setTimeout(() => {
          const draftData = {
            ...newTask,
            _savedAt: new Date().toISOString()
          };
          localStorage.setItem('taskForm_draft', JSON.stringify(draftData));
          
          // Show save notification briefly
          setShowSaveNotification(true);
          const notificationTimer = setTimeout(() => {
            setShowSaveNotification(false);
          }, 1500);
          
          return () => clearTimeout(notificationTimer);
        }, 500); // Wait 500ms after user stops typing
        
        return () => clearTimeout(saveTimer);
      }
    }
  }, [newTask]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, cohortsRes] = await Promise.all([
        fetch('/api/admin/tasks'),
        fetch('/api/admin/cohorts')
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        console.log('Tasks data from API:', tasksData);
        setTasks(tasksData.tasks || []);
      }

      if (cohortsRes.ok) {
        const cohortsData = await cohortsRes.json();
        console.log('Cohorts data from API:', cohortsData);
        setCohorts(cohortsData.cohorts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          createdBy: user?.id,
          createdByRole: user?.role || 'admin',
          assignedBy: user?.gitlabUsername || 'admin'
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        resetNewTask();
        fetchData();
        alert('Task created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      // Create a clean copy of the task data for submission
      const taskData = { ...editingTask };
      
      // Make sure cohortId is a string, not an object
      if (typeof taskData.cohortId === 'object') {
        taskData.cohortId = taskData.cohortId?._id;
      }
      
      console.log('Updating task with data:', taskData);
      
      // Make sure we have the required fields based on assignment type
      if (taskData.assignmentType === 'cohort' && !taskData.cohortId) {
        alert('Please select a cohort for this task');
        return;
      }
      
      if (taskData.assignmentType === 'individual' && !taskData.assignedTo) {
        alert('Please specify an assignee for this task');
        return;
      }
      
      const response = await fetch(`/api/admin/tasks/${taskData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task update response:', result);
        setShowEditModal(false);
        setEditingTask(null);
        fetchData();
        alert('Task updated successfully!');
      } else {
        const error = await response.json();
        console.error('Error response from API:', error);
        alert(`Error: ${error.error || error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task: ' + error.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/admin/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
        alert('Task deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleImportTasks = async (fromCohortId, toCohortId) => {
    try {
      const response = await fetch('/api/admin/tasks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCohortId,
          toCohortId,
          importedBy: user?.gitlabUsername || 'admin'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setShowImportModal(false);
        fetchData();
        alert(`Successfully imported ${result.importedCount} tasks!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error importing tasks:', error);
      alert('Failed to import tasks');
    }
  };

  const resetNewTask = () => {
    const defaultTask = {
      title: '',
      description: '',
      type: 'assignment',
      priority: 'medium',
      category: '',
      assignmentType: 'cohort',
      cohortId: '',
      dueDate: '',
      startDate: '',
      estimatedHours: 0,
      tags: [],
      requirements: [],
      resources: [],
      attachments: []
    };
    
    setNewTask(defaultTask);
    
    // Clear the saved draft from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('taskForm_draft');
    }
  };

  // Check if there's a saved draft and get its info
  const getSavedDraftInfo = () => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('taskForm_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          const hasContent = parsed.title || parsed.description || parsed.category;
          return hasContent ? {
            exists: true,
            savedAt: parsed._savedAt,
            title: parsed.title || 'Untitled'
          } : { exists: false };
        } catch (error) {
          return { exists: false };
        }
      }
    }
    return { exists: false };
  };

  const hasSavedDraft = () => getSavedDraftInfo().exists;

  // Persist created weeks to localStorage
  const persistCreatedWeeks = (weeks) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_created_weeks', JSON.stringify([...weeks]));
    }
  };

  // Bulk actions helper functions
  const toggleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      const newSelection = prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    const currentTasks = getFilteredTasks();
    const allSelected = selectedTasks.length === currentTasks.length;
    
    if (allSelected) {
      setSelectedTasks([]);
      setShowBulkActions(false);
    } else {
      const allTaskIds = currentTasks.map(task => task._id);
      setSelectedTasks(allTaskIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTasks.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      // Delete each selected task
      const deletePromises = selectedTasks.map(taskId => 
        fetch(`/api/admin/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      );
      
      const results = await Promise.all(deletePromises);
      
      // Check if all deletions were successful
      const failures = results.filter(response => !response.ok);
      
      if (failures.length > 0) {
        alert(`Failed to delete ${failures.length} task(s). Please try again.`);
      } else {
        alert(`Successfully deleted ${selectedTasks.length} task(s)!`);
      }
      
      // Reset selections and refresh data
      setSelectedTasks([]);
      setShowBulkActions(false);
      fetchData();
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('An error occurred while deleting tasks. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '#dbeafe';
    e.currentTarget.style.borderColor = '#3b82f6';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';
    e.currentTarget.style.borderColor = '';
  };

  const handleDrop = async (e, targetWeek) => {
    e.preventDefault();
    
    console.log('=== DRAG DROP DEBUG ===');
    console.log('Dragged task:', draggedTask);
    console.log('Target week:', targetWeek, typeof targetWeek);
    console.log('Current task week:', draggedTask?.weekNumber, typeof draggedTask?.weekNumber);
    
    // Convert both to the same type for comparison
    const currentWeek = draggedTask?.weekNumber;
    const targetWeekNum = targetWeek;
    
    console.log('Comparison:', currentWeek, '===', targetWeekNum, '→', currentWeek === targetWeekNum);
    
    if (!draggedTask || currentWeek === targetWeekNum) {
      console.log('Skipping drop - same week or no task');
      setDraggedTask(null);
      return;
    }

    console.log('Proceeding with drop - different week detected');

    try {
      // For drag and drop, we only need to update the weekNumber
      // But the API requires all required fields, so we need to send them
      const updatedTask = {
        title: draggedTask.title,
        description: draggedTask.description,
        category: draggedTask.category,
        type: draggedTask.type || 'assignment',
        priority: draggedTask.priority || 'medium',
        assignmentType: draggedTask.assignmentType || 'cohort',
        dueDate: draggedTask.dueDate,
        startDate: draggedTask.startDate,
        estimatedHours: draggedTask.estimatedHours || 0,
        weekNumber: targetWeek,
        points: draggedTask.points || 0,
        subtasks: draggedTask.subtasks || [],
        resources: draggedTask.resources || [],
        requirements: draggedTask.requirements || [],
        status: draggedTask.status
      };

      // Add assignment-specific fields
      if (draggedTask.assignmentType === 'cohort') {
        updatedTask.cohortId = draggedTask.cohortId;
      } else if (draggedTask.assignmentType === 'individual') {
        updatedTask.assignedTo = draggedTask.assignedTo;
      }

      console.log('Sending updated task:', updatedTask);
      console.log('Required fields check:');
      console.log('- title:', updatedTask.title);
      console.log('- description:', updatedTask.description);
      console.log('- category:', updatedTask.category);
      console.log('- dueDate:', updatedTask.dueDate);
      console.log('- weekNumber:', updatedTask.weekNumber);

      const response = await fetch(`/api/admin/tasks/${draggedTask._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTask)
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (response.ok) {
        console.log('Task updated successfully');
        console.log('Updated task data:', responseData);
        
        console.log('Tasks before refresh:', tasks.length);
        await fetchData(); // Refresh tasks
        console.log('Tasks after refresh - starting check...');
        
        // Wait a bit and check if the task was actually updated
        setTimeout(() => {
          console.log('=== POST-UPDATE VERIFICATION ===');
          const updatedTaskInList = tasks.find(t => t._id === draggedTask._id);
          console.log('Found updated task:', updatedTaskInList);
          console.log('Updated task weekNumber:', updatedTaskInList?.weekNumber);
          
          const newWeekGroups = getTasksByWeeks();
          console.log('New week groups after update:', newWeekGroups);
          
          if (updatedTaskInList && updatedTaskInList.weekNumber === targetWeek) {
            console.log('✅ Verification passed - task actually moved!');
          } else {
            console.log('❌ Verification failed - task not moved or not found');
          }
        }, 500);
        
        setShowTaskMovedNotification({
          taskTitle: draggedTask.title,
          weekNumber: targetWeek,
          success: true
        });
        setTimeout(() => setShowTaskMovedNotification(null), 4000);
      } else {
        console.error('Server error:', responseData);
        console.error('Response status:', response.status);
        let errorMessage = responseData.message || responseData.error || 'Unknown error';
        
        if (response.status === 400) {
          console.error('Validation error - missing required fields?');
          console.error('Sent task data:', updatedTask);
        }
        
        setShowTaskMovedNotification({
          taskTitle: draggedTask.title,
          weekNumber: targetWeek,
          success: false,
          error: errorMessage
        });
        setTimeout(() => setShowTaskMovedNotification(null), 4000);
      }
    } catch (error) {
      console.error('Network error moving task:', error);
      alert(`❌ Network error: ${error.message}`);
    }

    setDraggedTask(null);
  };

  // Week management
  const createNewWeek = () => {
    if (!newWeekName.trim()) return;
    
    const weekNumber = parseInt(newWeekName);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
      alert('Please enter a valid week number (1-52)');
      return;
    }

    // Check if week already exists
    const existingWeeks = Object.keys(getTasksByWeeks());
    if (existingWeeks.includes(weekNumber.toString())) {
      alert(`Week ${weekNumber} already exists!`);
      return;
    }

    // Add the new week to created weeks
    setCreatedWeeks(prev => {
      const newWeeks = new Set([...prev, weekNumber]);
      persistCreatedWeeks(newWeeks);
      return newWeeks;
    });
    setNewWeekName('');
    setShowCreateWeek(false);
    
    // Show success notification
    setShowWeekCreatedNotification(weekNumber);
    setTimeout(() => setShowWeekCreatedNotification(null), 3000);
  };

  // Delete empty week folder
  const deleteWeekFolder = (weekNumber) => {
    if (confirm(`Are you sure you want to delete Week ${weekNumber} folder?`)) {
      setCreatedWeeks(prev => {
        const newSet = new Set(prev);
        newSet.delete(weekNumber);
        persistCreatedWeeks(newSet);
        return newSet;
      });
      alert(`Week ${weekNumber} folder deleted!`);
    }
  };

  // Organize tasks by weeks for folder view
  const getTasksByWeeks = () => {
    const filteredTasks = getFilteredTasks();
    const weekGroups = {};
    
    console.log('=== GROUPING TASKS BY WEEKS ===');
    console.log('Filtered tasks:', filteredTasks.length);
    
    // Add tasks to their respective weeks
    filteredTasks.forEach(task => {
      const week = task.weekNumber || 'Unassigned';
      console.log(`Task "${task.title}" -> Week: ${week} (weekNumber: ${task.weekNumber})`);
      if (!weekGroups[week]) {
        weekGroups[week] = [];
      }
      weekGroups[week].push(task);
    });
    
    // Add manually created empty weeks
    createdWeeks.forEach(weekNumber => {
      if (!weekGroups[weekNumber]) {
        weekGroups[weekNumber] = [];
      }
    });
    
    console.log('Final week groups:', weekGroups);
    return weekGroups;
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (selectedCohort !== 'all') {
      console.log(`Filtering tasks by cohort: ${selectedCohort}`);
      
      // Log all tasks and their cohort IDs for debugging
      filtered.forEach(task => {
        const taskCohortId = typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId;
        console.log(`Task: ${task.title}, Cohort ID: ${taskCohortId}, Assignment Type: ${task.assignmentType}`);
      });
      
      filtered = filtered.filter(task => {
        // For tasks without assignmentType, check if they have a cohortId
        const isCohortTask = task.assignmentType === 'cohort' || 
                            (!task.assignmentType && task.cohortId);
        
        // Skip non-cohort tasks
        if (!isCohortTask) {
          return false;
        }
        
        // Extract the cohort ID (could be an object or a string)
        const taskCohortId = typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId;
        
        // Handle tasks without a cohort ID (orphaned tasks)
        if (!taskCohortId) {
          console.log(`Task ${task.title} has null cohort ID - these are orphaned tasks`);
          // Show orphaned tasks only when filtering by 'unassigned'
          return selectedCohort === 'unassigned';
        }
        
        // Skip tasks that have a cohort ID when filtering for unassigned tasks
        if (selectedCohort === 'unassigned') {
          return false;
        }
        
        console.log(`Comparing task cohort ID: ${taskCohortId} with selected cohort: ${selectedCohort}`);
        
        // Convert both to strings for comparison
        const taskCohortIdStr = taskCohortId.toString();
        const selectedCohortStr = selectedCohort.toString();
        
        console.log(`String comparison: "${taskCohortIdStr}" === "${selectedCohortStr}"`);
        const matches = taskCohortIdStr === selectedCohortStr;
        
        if (matches) {
          console.log(`Task ${task.title} matches selected cohort`);
        }
        
        return matches;
      });
      
      console.log(`Found ${filtered.length} tasks for cohort ${selectedCohort}`);
    }

    if (taskFilter !== 'all') {
      filtered = filtered.filter(task => task.status === taskFilter);
    }

    if (weekFilter !== 'all') {
      filtered = filtered.filter(task => {
        const taskWeek = task.weekNumber || 0;
        return taskWeek.toString() === weekFilter;
      });
    }

    console.log(`Filtered tasks: ${filtered.length} out of ${tasks.length}`);
    return filtered;
  };

  const getTaskStats = () => {
    const filteredTasks = getFilteredTasks();
    return {
      total: filteredTasks.length,
      active: filteredTasks.filter(t => t.status === 'active').length,
      completed: filteredTasks.filter(t => t.status === 'completed').length,
      overdue: filteredTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
    };
  };

  const addRequirement = () => {
    setNewTask({
      ...newTask,
      requirements: [...newTask.requirements, { description: '', completed: false }]
    });
  };

  const addResource = () => {
    setNewTask({
      ...newTask,
      resources: [...newTask.resources, { name: '', url: '', type: 'link' }]
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = getTaskStats();

  return (
    <div className="space-y-6 relative">
      {/* Save Notification */}
      {showSaveNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center">
          <span className="mr-2">💾</span>
          Draft saved automatically
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Task Management</h3>
            <p className="text-sm text-gray-600">Create and manage tasks for cohorts</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <span className="mr-2">📥</span>
              Import Tasks
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 relative"
            >
              <span className="mr-2">➕</span>
              Create Task
              {hasSavedDraft() && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="h-2 w-2 bg-orange-400 rounded-full animate-pulse"></span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active Tasks</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cohort</label>
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Cohorts</option>
              <option value="unassigned">📌 Unassigned Tasks</option>
              {cohorts.map(cohort => (
                <option key={cohort._id} value={cohort._id}>{cohort.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center">
                🗓️ Week
              </span>
            </label>
            <select
              value={weekFilter}
              onChange={(e) => setWeekFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Weeks</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week.toString()}>Week {week}</option>
              ))}
              <option value="0">No Week Assigned</option>
            </select>
          </div>
          <button
            onClick={() => { setSelectedCohort('all'); setTaskFilter('all'); setWeekFilter('all'); }}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Show All Tasks
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 List View
          </button>
          <button
            onClick={() => setViewMode('folders')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'folders' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📁 Week Folders
          </button>
        </div>
      </div>

      {/* Bulk Actions Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={selectedTasks.length === getFilteredTasks().length && getFilteredTasks().length > 0}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              {selectedTasks.length > 0 
                ? `${selectedTasks.length} selected` 
                : 'Select All'}
            </span>
          </label>
          
          {selectedTasks.length > 0 && (
            <div className="text-sm text-gray-500">
              ({selectedTasks.length} of {getFilteredTasks().length} tasks selected)
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              <span className="mr-2">🗑️</span>
              Delete Selected ({selectedTasks.length})
            </button>
            <button
              onClick={() => {
                setSelectedTasks([]);
                setShowBulkActions(false);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Tasks Grid - List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {getFilteredTasks().map((task) => {
          console.log('Task data:', task);
          console.log('Task cohortId:', task.cohortId);
          console.log('Task cohortId type:', typeof task.cohortId);
          console.log('Available cohorts:', cohorts);
          
          // Extract the cohort ID (could be an object or a string)
          const cohortId = typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId;
          console.log('Extracted cohort ID:', cohortId);
          
          // Find the cohort by ID
          const cohort = cohorts.find(c => {
            // Convert both to strings for comparison
            const cohortIdStr = c._id ? c._id.toString() : '';
            const taskCohortIdStr = cohortId ? cohortId.toString() : '';
            
            console.log(`Comparing cohort ${cohortIdStr} with ${taskCohortIdStr}`);
            return cohortIdStr === taskCohortIdStr;
          });
          console.log('Found cohort:', cohort);
          
          // Get the cohort name from various possible sources
          const cohortName = 
            // If cohortId is an object with a name property (populated from MongoDB)
            (typeof task.cohortId === 'object' && task.cohortId?.name) || 
            // If we found a matching cohort in our local cohorts array
            cohort?.name || 
            // If there's a cohortName field directly on the task
            task.cohortName || 
            // Default if no cohort info is found
            'Unassigned';
          console.log('Cohort name:', cohortName);
          
          const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

          return (
            <div key={task._id} className={`bg-white rounded-xl shadow-sm border p-6 transition-all ${
              selectedTasks.includes(task._id) 
                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                : 'border-gray-100'
            }`}>
              {/* Selection Checkbox */}
              <div className="flex items-start space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={selectedTasks.includes(task._id)}
                  onChange={() => toggleTaskSelection(task._id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🔄</span>
                  <span>Assignment: {task.assignmentType === 'cohort' ? 'Cohort' : 'Individual'}</span>
                </div>
                {task.assignmentType === 'cohort' ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👥</span>
                    <span>Cohort: {cohortName}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">👤</span>
                    <span>Assigned to: {task.assigneeName || task.assignedTo || 'Unassigned'}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🏷️</span>
                  <span>Type: {task.type}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">⏱️</span>
                  <span>{task.estimatedHours}h estimated</span>
                </div>
                {task.weekNumber && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🗓️</span>
                    <span>Week {task.weekNumber}</span>
                  </div>
                )}
                {task.points > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">🏆</span>
                    <span>{task.points} points</span>
                  </div>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📋</span>
                    <span>{task.subtasks.length} subtasks</span>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.status === 'active' ? 'bg-green-100 text-green-800' :
                  task.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {task.status}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    // Create a clean copy of the task for editing
                    const taskForEdit = { ...task };
                    
                    // Ensure assignmentType is set (default to 'cohort' if not present)
                    if (!taskForEdit.assignmentType) {
                      taskForEdit.assignmentType = taskForEdit.cohortId ? 'cohort' : 'individual';
                    }
                    
                    console.log('Setting task for editing:', taskForEdit);
                    setEditingTask(taskForEdit);
                    setShowEditModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Folder View - Week Folders */}
      {viewMode === 'folders' && (
        <div className="space-y-6">
          {/* Week Created Notification */}
          {showWeekCreatedNotification && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-green-500 text-lg mr-3">✅</span>
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    Week {showWeekCreatedNotification} folder created successfully!
                  </h3>
                  <p className="text-sm text-green-700">You can now drag tasks into this week folder.</p>
                </div>
              </div>
              <button
                onClick={() => setShowWeekCreatedNotification(null)}
                className="text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Task Moved Notification */}
          {showTaskMovedNotification && (
            <div className={`border rounded-lg p-4 flex items-center justify-between ${
              showTaskMovedNotification.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center">
                <span className={`text-lg mr-3 ${
                  showTaskMovedNotification.success ? 'text-green-500' : 'text-red-500'
                }`}>
                  {showTaskMovedNotification.success ? '✅' : '❌'}
                </span>
                <div>
                  <h3 className={`text-sm font-medium ${
                    showTaskMovedNotification.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {showTaskMovedNotification.success 
                      ? `Task "${showTaskMovedNotification.taskTitle}" moved to Week ${showTaskMovedNotification.weekNumber}!`
                      : `Failed to move task "${showTaskMovedNotification.taskTitle}"`
                    }
                  </h3>
                  <p className={`text-sm ${
                    showTaskMovedNotification.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {showTaskMovedNotification.success 
                      ? 'Task successfully reassigned to the new week folder.'
                      : showTaskMovedNotification.error || 'Please try again.'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTaskMovedNotification(null)}
                className={`${
                  showTaskMovedNotification.success 
                    ? 'text-green-600 hover:text-green-800' 
                    : 'text-red-600 hover:text-red-800'
                }`}
              >
                ✕
              </button>
            </div>
          )}

          {/* Debug Panel */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <span className="text-yellow-500 text-lg mr-3">🐛</span>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Debug Panel</h3>
                  <p className="text-sm text-yellow-700">Click to debug task organization</p>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('=== CURRENT STATE DEBUG ===');
                  console.log('All tasks:', tasks);
                  console.log('Tasks with weekNumber:', tasks.map(t => ({
                    id: t._id,
                    title: t.title,
                    weekNumber: t.weekNumber,
                    weekNumberType: typeof t.weekNumber
                  })));
                  console.log('Created weeks:', [...createdWeeks]);
                  console.log('Week groups:', getTasksByWeeks());
                }}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Debug Current State
              </button>
            </div>
          </div>

          {/* Help Text for Folder View */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-blue-500 text-lg mr-3">💡</span>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Week Folders - Drag & Drop</h3>
                <div className="mt-2 text-sm text-blue-700 space-y-1">
                  <p>• Drag tasks between week folders to reassign them</p>
                  <p>• Week folders are organized like file system folders</p>
                  <p>• Drop tasks into any week folder to move them</p>
                </div>
              </div>
            </div>
          </div>

          {Object.entries(getTasksByWeeks())
            .sort(([a], [b]) => {
              if (a === 'Unassigned') return 1;
              if (b === 'Unassigned') return -1;
              return parseInt(a) - parseInt(b);
            })
            .map(([weekNumber, weekTasks]) => (
              <div 
                key={weekNumber}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                  const targetWeek = weekNumber === 'Unassigned' ? null : parseInt(weekNumber);
                  handleDrop(e, targetWeek);
                  e.currentTarget.style.backgroundColor = '';
                  e.currentTarget.style.borderColor = '';
                }}
              >
                {/* Week Folder Header */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {weekNumber === 'Unassigned' ? '📂' : '🗓️'}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {weekNumber === 'Unassigned' ? 'Unassigned Tasks' : `Week ${weekNumber}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {weekTasks.length} {weekTasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-sm text-gray-500">
                        Drop tasks here to assign to this week
                      </div>
                      {weekTasks.length === 0 && createdWeeks.has(parseInt(weekNumber)) && (
                        <button
                          onClick={() => deleteWeekFolder(parseInt(weekNumber))}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50"
                          title="Delete empty week folder"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks in this week */}
                <div className="p-4">
                  {weekTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <span className="text-3xl">📭</span>
                      <p className="mt-2">
                        {weekNumber === 'Unassigned' ? 'No unassigned tasks' : `No tasks in Week ${weekNumber} yet`}
                      </p>
                      <p className="text-sm">Drag tasks here to assign them</p>
                      {createdWeeks.has(parseInt(weekNumber)) && (
                        <p className="text-xs text-green-600 mt-2">✅ New week folder created</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weekTasks.map((task) => {
                        const cohortId = typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId;
                        const cohort = cohorts.find(c => c._id?.toString() === cohortId?.toString());
                        const cohortName = cohort?.name || task.cohortId?.name || 'Unknown Cohort';

                        return (
                          <div
                            key={task._id}
                            draggable="true"
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                            className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-4 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all ${
                              selectedTasks.includes(task._id) 
                                ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                                : ''
                            }`}
                          >
                            {/* Task File Icon and Selection */}
                            <div className="flex items-start space-x-3 mb-3">
                              <input
                                type="checkbox"
                                checked={selectedTasks.includes(task._id)}
                                onChange={() => toggleTaskSelection(task._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-2xl">📄</span>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                                  {task.title}
                                </h4>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              </div>
                            </div>

                            {/* Task Meta Info */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 rounded-full font-medium ${
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.priority}
                                </span>
                                {task.points > 0 && (
                                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                    🏆 {task.points}pts
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const taskForEdit = { ...task };
                                    if (!taskForEdit.assignmentType) {
                                      taskForEdit.assignmentType = taskForEdit.cohortId ? 'cohort' : 'individual';
                                    }
                                    setEditingTask(taskForEdit);
                                    setShowEditModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task._id);
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Create New Week Folder */}
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6">
            <div className="text-center">
              <span className="text-4xl text-gray-400">➕</span>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Create New Week</h3>
              <p className="mt-1 text-sm text-gray-500">Add a new week folder for task organization</p>
              
              {!showCreateWeek ? (
                <button
                  onClick={() => setShowCreateWeek(true)}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Week Folder
                </button>
              ) : (
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <input
                    type="number"
                    value={newWeekName}
                    onChange={(e) => setNewWeekName(e.target.value)}
                    placeholder="Week number (1-52)"
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-40"
                    min="1"
                    max="52"
                  />
                  <button
                    onClick={createNewWeek}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateWeek(false);
                      setNewWeekName('');
                    }}
                    className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {Object.keys(getTasksByWeeks()).length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No week folders yet</h3>
              <p className="text-gray-600 mb-4">Create tasks with week numbers to see them organized in folders</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Create First Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions Help - List View Only */}
      {viewMode === 'list' && getFilteredTasks().length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-lg">💡</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Bulk Actions</h3>
              <div className="mt-2 text-sm text-blue-700 space-y-1">
                <p>• Select individual tasks using checkboxes</p>
                <p>• Use "Select All" to select all visible tasks</p>
                <p>• Click "🗑️ Delete Selected" to remove multiple tasks at once</p>
                <p>• Selected tasks are highlighted in blue</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'list' && getFilteredTasks().length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">Create your first task to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Task
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create New Task</h3>
              {hasSavedDraft() && (
                <div className="flex items-center text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  <span className="mr-2">💾</span>
                  <div>
                    <div className="font-medium">Draft restored</div>
                    {getSavedDraftInfo().savedAt && (
                      <div className="text-xs text-orange-500">
                        Saved {new Date(getSavedDraftInfo().savedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newTask.category}
                    onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                    <option value="presentation">Presentation</option>
                    <option value="research">Research</option>
                    <option value="coding">Coding</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                  />
                </div>
              </div>

              {/* Week Number and Points Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      🗓️ Week Number
                      <span className="ml-2 text-xs text-gray-500">(for weekly organization)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={newTask.weekNumber}
                    onChange={(e) => setNewTask({...newTask, weekNumber: parseInt(e.target.value) || 1})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    max="52"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      🏆 Points
                      <span className="ml-2 text-xs text-gray-500">(reward points for completion)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={newTask.points}
                    onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    placeholder="20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Cohort</label>
                <select
                  value={newTask.cohortId}
                  onChange={(e) => setNewTask({...newTask, cohortId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select Cohort</option>
                  {cohorts.map(cohort => (
                    <option key={cohort._id} value={cohort._id}>{cohort.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* Requirements Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Requirements</label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Requirement
                  </button>
                </div>
                {newTask.requirements.map((req, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={req.description}
                      onChange={(e) => {
                        const updated = [...newTask.requirements];
                        updated[index].description = e.target.value;
                        setNewTask({...newTask, requirements: updated});
                      }}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Requirement description"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = newTask.requirements.filter((_, i) => i !== index);
                        setNewTask({...newTask, requirements: updated});
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Resources Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Resources</label>
                  <button
                    type="button"
                    onClick={addResource}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Resource
                  </button>
                </div>
                {newTask.resources.map((resource, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      type="text"
                      value={resource.name}
                      onChange={(e) => {
                        const updated = [...newTask.resources];
                        updated[index].name = e.target.value;
                        setNewTask({...newTask, resources: updated});
                      }}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Resource name"
                    />
                    <input
                      type="url"
                      value={resource.url}
                      onChange={(e) => {
                        const updated = [...newTask.resources];
                        updated[index].url = e.target.value;
                        setNewTask({...newTask, resources: updated});
                      }}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="Resource URL"
                    />
                    <div className="flex items-center space-x-2">
                      <select
                        value={resource.type}
                        onChange={(e) => {
                          const updated = [...newTask.resources];
                          updated[index].type = e.target.value;
                          setNewTask({...newTask, resources: updated});
                        }}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="link">Link</option>
                        <option value="file">File</option>
                        <option value="document">Document</option>
                        <option value="video">Video</option>
                        <option value="tutorial">Tutorial</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newTask.resources.filter((_, i) => i !== index);
                          setNewTask({...newTask, resources: updated});
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtasks Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      📋 Subtasks
                      <span className="ml-2 text-xs text-gray-500">({newTask.subtasks.length} subtasks)</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTask({
                        ...newTask, 
                        subtasks: [...newTask.subtasks, {
                          title: '',
                          description: '',
                          estimatedHours: 0.5,
                          priority: 'medium',
                          completed: false
                        }]
                      });
                    }}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <span className="mr-1">➕</span>
                    Add Subtask
                  </button>
                </div>
                
                {newTask.subtasks.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <span className="text-2xl">📝</span>
                    <p className="mt-1">No subtasks added yet. Click "Add Subtask" to break down this task.</p>
                  </div>
                )}
                
                {newTask.subtasks.map((subtask, index) => (
                  <div key={index} className="bg-white p-3 rounded-md border border-gray-200 mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={subtask.title}
                          onChange={(e) => {
                            const updated = [...newTask.subtasks];
                            updated[index].title = e.target.value;
                            setNewTask({...newTask, subtasks: updated});
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
                          placeholder={`Subtask ${index + 1} title...`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = newTask.subtasks.filter((_, i) => i !== index);
                          setNewTask({...newTask, subtasks: updated});
                        }}
                        className="ml-2 text-red-600 hover:text-red-800 p-1"
                        title="Remove subtask"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <textarea
                      value={subtask.description}
                      onChange={(e) => {
                        const updated = [...newTask.subtasks];
                        updated[index].description = e.target.value;
                        setNewTask({...newTask, subtasks: updated});
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
                      rows="2"
                      placeholder="Subtask description (optional)..."
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Estimated Hours</label>
                        <input
                          type="number"
                          value={subtask.estimatedHours}
                          onChange={(e) => {
                            const updated = [...newTask.subtasks];
                            updated[index].estimatedHours = parseFloat(e.target.value) || 0;
                            setNewTask({...newTask, subtasks: updated});
                          }}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                          min="0"
                          step="0.25"
                          placeholder="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Priority</label>
                        <select
                          value={subtask.priority}
                          onChange={(e) => {
                            const updated = [...newTask.subtasks];
                            updated[index].priority = e.target.value;
                            setNewTask({...newTask, subtasks: updated});
                          }}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {newTask.subtasks.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <div className="text-xs text-blue-700">
                      📊 <strong>Total estimated time:</strong> {' '}
                      {(newTask.estimatedHours + newTask.subtasks.reduce((sum, sub) => sum + (sub.estimatedHours || 0), 0)).toFixed(1)} hours
                      ({newTask.estimatedHours}h main task + {newTask.subtasks.reduce((sum, sub) => sum + (sub.estimatedHours || 0), 0).toFixed(1)}h subtasks)
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <div>
                  {hasSavedDraft() && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear the saved draft? This cannot be undone.')) {
                          resetNewTask();
                        }
                      }}
                      className="px-3 py-1 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded-md hover:bg-orange-50"
                    >
                      Clear Draft
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Tasks Modal */}
      {showImportModal && (
        <ImportTasksModal
          cohorts={cohorts}
          onImport={handleImportTasks}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {/* Debug Section: Show raw API response and filters */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2 text-gray-700">Debug Info</h3>
        <div className="text-xs text-gray-700 mb-1">Current Cohort Filter: <span className="font-mono">{selectedCohort}</span></div>
        <div className="text-xs text-gray-700 mb-1">Current Status Filter: <span className="font-mono">{taskFilter}</span></div>
        <div className="text-xs text-gray-700 mb-1">Current Week Filter: <span className="font-mono">{weekFilter}</span></div>
        <div className="text-xs text-gray-700">Raw API Response (allTasks):</div>
        <pre className="bg-white border border-gray-200 rounded p-2 overflow-x-auto text-xs max-h-64">{JSON.stringify(tasks, null, 2)}</pre>
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Task</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editingTask.type}
                    onChange={(e) => setEditingTask({...editingTask, type: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="quiz">Quiz</option>
                    <option value="presentation">Presentation</option>
                    <option value="research">Research</option>
                    <option value="coding">Coding</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                <select
                  value={editingTask.assignmentType || 'cohort'}
                  onChange={(e) => setEditingTask({...editingTask, assignmentType: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="cohort">Assign to Cohort</option>
                  <option value="individual">Assign to Individual</option>
                </select>
              </div>

              {editingTask.assignmentType === 'cohort' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Cohort</label>
                  <select
                    value={typeof editingTask.cohortId === 'object' ? editingTask.cohortId?._id : editingTask.cohortId || ''}
                    onChange={(e) => setEditingTask({...editingTask, cohortId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required={editingTask.assignmentType === 'cohort'}
                  >
                    <option value="">Select Cohort</option>
                    {cohorts.map(cohort => (
                      <option key={cohort._id} value={cohort._id}>{cohort.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Individual</label>
                  <input
                    type="text"
                    value={editingTask.assignedTo || ''}
                    onChange={(e) => setEditingTask({...editingTask, assignedTo: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="User ID"
                    required={editingTask.assignmentType === 'individual'}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editingTask.startDate ? new Date(editingTask.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingTask({...editingTask, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              {/* Week Number and Points Row for Edit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      🗓️ Week Number
                      <span className="ml-2 text-xs text-gray-500">(for weekly organization)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={editingTask.weekNumber || 1}
                    onChange={(e) => setEditingTask({...editingTask, weekNumber: parseInt(e.target.value) || 1})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    max="52"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="flex items-center">
                      🏆 Points
                      <span className="ml-2 text-xs text-gray-500">(reward points for completion)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    value={editingTask.points || 0}
                    onChange={(e) => setEditingTask({...editingTask, points: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Subtasks Section for Edit */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    <span className="flex items-center">
                      📋 Subtasks
                      <span className="ml-2 text-xs text-gray-500">({(editingTask.subtasks || []).length} subtasks)</span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentSubtasks = editingTask.subtasks || [];
                      setEditingTask({
                        ...editingTask, 
                        subtasks: [...currentSubtasks, {
                          title: '',
                          description: '',
                          estimatedHours: 0.5,
                          priority: 'medium',
                          completed: false
                        }]
                      });
                    }}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <span className="mr-1">➕</span>
                    Add Subtask
                  </button>
                </div>
                
                {(!editingTask.subtasks || editingTask.subtasks.length === 0) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <span className="text-2xl">📝</span>
                    <p className="mt-1">No subtasks added yet. Click "Add Subtask" to break down this task.</p>
                  </div>
                )}
                
                {(editingTask.subtasks || []).map((subtask, index) => (
                  <div key={index} className="bg-white p-3 rounded-md border border-gray-200 mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={subtask.title || ''}
                          onChange={(e) => {
                            const updated = [...(editingTask.subtasks || [])];
                            updated[index].title = e.target.value;
                            setEditingTask({...editingTask, subtasks: updated});
                          }}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-medium"
                          placeholder={`Subtask ${index + 1} title...`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingTask.subtasks || []).filter((_, i) => i !== index);
                          setEditingTask({...editingTask, subtasks: updated});
                        }}
                        className="ml-2 text-red-600 hover:text-red-800 p-1"
                        title="Remove subtask"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <textarea
                      value={subtask.description || ''}
                      onChange={(e) => {
                        const updated = [...(editingTask.subtasks || [])];
                        updated[index].description = e.target.value;
                        setEditingTask({...editingTask, subtasks: updated});
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
                      rows="2"
                      placeholder="Subtask description (optional)..."
                    />
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Estimated Hours</label>
                        <input
                          type="number"
                          value={subtask.estimatedHours || 0}
                          onChange={(e) => {
                            const updated = [...(editingTask.subtasks || [])];
                            updated[index].estimatedHours = parseFloat(e.target.value) || 0;
                            setEditingTask({...editingTask, subtasks: updated});
                          }}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                          min="0"
                          step="0.25"
                          placeholder="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Priority</label>
                        <select
                          value={subtask.priority || 'medium'}
                          onChange={(e) => {
                            const updated = [...(editingTask.subtasks || [])];
                            updated[index].priority = e.target.value;
                            setEditingTask({...editingTask, subtasks: updated});
                          }}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Status</label>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={subtask.completed || false}
                            onChange={(e) => {
                              const updated = [...(editingTask.subtasks || [])];
                              updated[index].completed = e.target.checked;
                              if (e.target.checked) {
                                updated[index].completedAt = new Date().toISOString();
                              } else {
                                delete updated[index].completedAt;
                              }
                              setEditingTask({...editingTask, subtasks: updated});
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-xs text-gray-600">
                            {subtask.completed ? '✅ Done' : '⏳ Pending'}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(editingTask.subtasks || []).length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <div className="text-xs text-blue-700">
                      📊 <strong>Total estimated time:</strong> {' '}
                      {((editingTask.estimatedHours || 0) + (editingTask.subtasks || []).reduce((sum, sub) => sum + (sub.estimatedHours || 0), 0)).toFixed(1)} hours
                      ({editingTask.estimatedHours || 0}h main task + {(editingTask.subtasks || []).reduce((sum, sub) => sum + (sub.estimatedHours || 0), 0).toFixed(1)}h subtasks)
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Import Tasks Modal Component
function ImportTasksModal({ cohorts, onImport, onClose }) {
  const [fromCohort, setFromCohort] = useState('');
  const [toCohort, setToCohort] = useState('');
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasksFromCohort = async (cohortId) => {
    if (!cohortId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tasks?cohortId=${cohortId}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!fromCohort || !toCohort) {
      alert('Please select both source and destination cohorts');
      return;
    }
    onImport(fromCohort, toCohort, selectedTasks);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <h3 className="text-lg font-semibold mb-4">Import Tasks from Another Cohort</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Cohort</label>
              <select
                value={fromCohort}
                onChange={(e) => {
                  setFromCohort(e.target.value);
                  fetchTasksFromCohort(e.target.value);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select source cohort</option>
                {cohorts.map(cohort => (
                  <option key={cohort._id} value={cohort._id}>{cohort.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Cohort</label>
              <select
                value={toCohort}
                onChange={(e) => setToCohort(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Select destination cohort</option>
                {cohorts.filter(c => c._id !== fromCohort).map(cohort => (
                  <option key={cohort._id} value={cohort._id}>{cohort.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading tasks...</p>
            </div>
          )}

          {availableTasks.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Available Tasks ({availableTasks.length})</h4>
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {availableTasks.map(task => (
                  <div key={task._id} className="flex items-center p-3 border-b border-gray-100 last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTasks([...selectedTasks, task._id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task._id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500">{task.type} • {task.priority} priority</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {selectedTasks.length} of {availableTasks.length} tasks selected
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!fromCohort || !toCohort}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Import Selected Tasks
          </button>
        </div>
      </div>
    </div>
  );
}