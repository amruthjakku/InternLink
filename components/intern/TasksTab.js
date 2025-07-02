'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { MetricCard } from '../Charts';
import { format, addDays, subDays } from 'date-fns';

// Helper function to calculate weekly statistics
const calculateWeeklyStats = (tasks) => {
  const weekStats = {};
  
  tasks.forEach(task => {
    // Use the week number from the API if available
    let week = task.weekNumber;
    
    if (!week) {
      // If no week number, try to determine from due date or creation date
      const taskDate = new Date(task.dueDate || task.createdAt || task.startDate);
      
      // Calculate weeks since internship/cohort start (more logical for intern program)
      // Assume internship started at beginning of current month for demo
      const internshipStart = new Date();
      internshipStart.setDate(1); // First day of current month
      internshipStart.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.max(0, Math.ceil((taskDate - internshipStart) / (24 * 60 * 60 * 1000)));
      week = Math.max(1, Math.ceil((daysDiff + 1) / 7)); // Convert days to weeks, minimum week 1
      
      // Cap at reasonable week number (e.g., 12 weeks program)
      week = Math.min(week, 12);
      
      // Add the calculated week number to the task for future reference
      task.weekNumber = week;
    }
    
    if (!weekStats[week]) {
      weekStats[week] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        totalPoints: 0,
        tasks: []
      };
    }
    
    weekStats[week].total += 1;
    weekStats[week].totalPoints += task.points || 0;
    weekStats[week].tasks.push(task);
    
    if (task.status === 'done' || task.status === 'completed') {
      weekStats[week].completed += 1;
    } else if (task.status === 'in_progress') {
      weekStats[week].inProgress += 1;
    }
  });
  
  return weekStats;
};

// Task Card Component with Subtasks
const TaskCardWithSubtasks = ({ task, onTaskClick, onSubtaskToggle, isSubtaskExpanded, onDeleteProgress, deletingProgress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': 
      case 'not_started': 
      case 'draft':
        return 'border-gray-400';
      case 'in_progress': 
      case 'active':
        return 'border-orange-400';
      case 'review': 
        return 'border-blue-400';
      case 'done': 
      case 'completed': 
      case 'approved':
        return 'border-green-400';
      case 'blocked': 
      case 'cancelled':
        return 'border-red-400';
      default: 
        return 'border-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Ensure task.subtasks is always an array
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? subtasks.filter(sub => sub.completed).length : 0;

  return (
    <div className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(task.status)}`}>
      {/* Main Task Header */}
      <div onClick={onTaskClick}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-gray-900 line-clamp-2 flex-1">{task.title}</h4>
          <div className="flex items-center space-x-1 ml-2">
            {task.weekNumber && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                W{task.weekNumber}
              </span>
            )}
            {task.points && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {task.points}pts
              </span>
            )}
            {/* Delete Progress Button */}
            {(task.progress > 0 || task.status !== 'not_started') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProgress && onDeleteProgress(task.id, task.title);
                }}
                disabled={deletingProgress === task.id}
                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors disabled:opacity-50"
                title="Reset progress to start over"
              >
                {deletingProgress === task.id ? '⌛' : '🗑️'}
              </button>
            )}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description || 'No description provided'}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className={`px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority?.toUpperCase() || 'MEDIUM'}
          </span>
          
          <div className="flex items-center space-x-2">
            {task.estimatedHours && (
              <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                ⏱️ {task.estimatedHours}h
              </span>
            )}
            <span className="text-gray-400">
              {task.status === 'done' || task.status === 'completed' ? '✅' : 
               task.status === 'in_progress' ? '🔄' : 
               task.status === 'blocked' ? '🚫' : '⏳'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Subtasks Section */}
      {hasSubtasks && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div 
            className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1 -m-1"
            onClick={(e) => {
              e.stopPropagation();
              onSubtaskToggle();
            }}
          >
            <div className="text-sm font-medium text-gray-700">
              📋 Subtasks ({completedSubtasks}/{subtasks.length})
            </div>
            <span className="text-gray-400">
              {isSubtaskExpanded ? '🔽' : '▶️'}
            </span>
          </div>
          
          {isSubtaskExpanded && (
            <div className="mt-2 space-y-1">
              {subtasks.map((subtask, index) => (
                <div 
                  key={subtask.id || index} 
                  className={`text-sm p-2 rounded border-l-2 ${
                    subtask.completed 
                      ? 'bg-green-50 border-green-400 text-green-800' 
                      : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <span className="mt-0.5">
                      {subtask.completed ? '✅' : '⏳'}
                    </span>
                    <div className="flex-1">
                      <div className={`font-medium ${subtask.completed ? 'line-through' : ''}`}>
                        {subtask.title || `Subtask ${index + 1}`}
                      </div>
                      {subtask.description && (
                        <div className="text-xs mt-1 opacity-75">
                          {subtask.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Subtask Progress Bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round((completedSubtasks / subtasks.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubtasks / subtasks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export function TasksTab({ user, loading }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'calendar', 'weekly'
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    submissionUrl: '',
    mergeRequestUrl: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [taskType, setTaskType] = useState('regular'); // 'weekly' or 'regular'
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set()); // Track collapsed weeks
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set()); // Track expanded subtasks
  const [weeklyStats, setWeeklyStats] = useState({});
  const [deletingProgress, setDeletingProgress] = useState(null); // Track which task's progress is being deleted

  // Toggle week collapse/expand
  const toggleWeekCollapse = (weekNumber) => {
    const newCollapsed = new Set(collapsedWeeks);
    if (newCollapsed.has(weekNumber)) {
      newCollapsed.delete(weekNumber);
    } else {
      newCollapsed.add(weekNumber);
    }
    setCollapsedWeeks(newCollapsed);
  };

  // Toggle subtask expansion
  const toggleSubtaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        console.log('Tasks fetched for intern:', data.tasks);
        
        // Set task type and handle weekly tasks
        setTaskType(data.taskType || 'regular');
        
        // Calculate weekly stats if we have weekly tasks
        if (data.taskType === 'weekly' && data.tasks) {
          const stats = calculateWeeklyStats(data.tasks);
          setWeeklyStats(stats);
        }
        

        
        // Log all tasks for debugging
        data.tasks.forEach(task => {
          console.log(`Task: ${task.title}, Type: ${task.assignmentType}, Week: ${task.weekNumber}, Cohort: ${typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId}`);
        });
        
        // Filter tasks to only show tasks for the intern's cohort or assigned directly to them
        const filteredTasks = data.tasks.filter(task => {
          // Extract user's cohort ID - handle both string and object formats
          let userCohortIdStr = '';
          if (user?.cohortId) {
            if (typeof user.cohortId === 'object') {
              userCohortIdStr = user.cohortId._id || user.cohortId.toString();
            } else {
              userCohortIdStr = user.cohortId.toString();
            }
          }
          

          // For hierarchical tasks, they're already filtered by the API to match the intern's college
          if (task.assignmentType === 'hierarchical') {
            console.log(`Task ${task.title} is a hierarchical task assigned to this intern's college`);
            return true;
          }
          
          // For cohort tasks, check if it matches the intern's cohort
          if (task.assignmentType === 'cohort' || (!task.assignmentType && task.cohortId)) {
            // Extract cohort IDs for comparison - handle multiple formats
            let taskCohortIdStr = '';
            if (task.cohortId) {
              if (typeof task.cohortId === 'object') {
                taskCohortIdStr = task.cohortId._id || task.cohortId.toString();
              } else {
                taskCohortIdStr = task.cohortId.toString();
              }
            }
            
            // Skip if no cohort ID
            if (!taskCohortIdStr) {
              console.log(`Task ${task.title} has no cohort ID`);
              return false;
            }
            
            // Only show cohort tasks that match the intern's cohort
            const matches = taskCohortIdStr === userCohortIdStr;
            return matches;
          }
          
          // For individual tasks, check if assigned to this intern
          if (task.assignmentType === 'individual' || (!task.assignmentType && (task.assignedTo || task.assigneeId))) {
            const isAssignedToIntern = 
              task.assigneeId === user?.id || 
              task.assignedTo === user?.id;
              
            console.log(`Task ${task.title} is ${isAssignedToIntern ? '' : 'not '}assigned to this intern`);
            return isAssignedToIntern;
          }
          
          // For tasks without assignment type, check both cohort and individual assignment
          if (!task.assignmentType) {
            // Check if assigned to this intern's cohort
            if (task.cohortId) {
              const taskCohortId = typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId;
              if (taskCohortId) {
                const taskCohortIdStr = taskCohortId.toString();
                const matchesCohort = taskCohortIdStr === userCohortIdStr;
                if (matchesCohort) {
                  console.log(`Task ${task.title} matches user's cohort (legacy format)`);
                  return true;
                }
              }
            }
            
            // Check if assigned directly to this intern
            const isAssignedToIntern = 
              task.assigneeId === user?.id || 
              task.assignedTo === user?.id;
            
            if (isAssignedToIntern) {
              console.log(`Task ${task.title} is assigned to this intern (legacy format)`);
              return true;
            }
          }
          
          console.log(`Task ${task.title} does not match any criteria`);
          return false;
        });
        
        console.log('Filtered tasks for intern:', filteredTasks);
        
        // If filtering resulted in no tasks but API returned tasks, 
        // it might be a filtering issue - use API results as fallback
        if (filteredTasks.length === 0 && data.tasks.length > 0) {
          console.warn('⚠️ Client-side filtering removed all tasks! Using API results as fallback.');
          console.log('This suggests a cohort ID format mismatch between user and tasks.');
          setTasks(data.tasks || []);
        } else {
          setTasks(filteredTasks || []);
        }
      } else {
        console.error('Failed to fetch tasks:', response.status);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const newStatus = destination.droppableId;
      const taskId = result.draggableId;
      
      // Find the task
      const task = tasks.find(t => t.id.toString() === taskId);
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }
      
      console.log(`Moving task ${task.title} from ${source.droppableId} to ${newStatus}`);
      
      // Map old status values if needed
      const statusMap = {
        todo: 'not_started',
        done: 'completed'
      };
      
      // Get the original status for reverting if needed
      const originalStatus = task.status;
      
      // Optimistically update UI
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id.toString() === taskId 
            ? { ...t, status: newStatus }
            : t
        )
      );
      
      // If we have a selected task and it's the one being moved, update it too
      if (selectedTask && selectedTask.id.toString() === taskId) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }

      // Update on server
      try {
        console.log(`Sending PATCH request to /api/tasks/${taskId} with status: ${newStatus}`);
        
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: newStatus,
            progress: newStatus === 'completed' ? 100 : 
                     newStatus === 'in_progress' ? Math.max(25, task.progress || 0) : 
                     newStatus === 'review' ? 90 : 
                     newStatus === 'not_started' ? 0 : task.progress
          }),
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok) {
          // Update the task with the returned data
          if (data.task) {
            console.log('Updating task with server data:', data.task);
            setTasks(prevTasks => 
              prevTasks.map(t => 
                t.id.toString() === taskId 
                  ? { 
                      ...t, 
                      status: data.task.status,
                      progress: data.task.progress,
                      updatedAt: data.task.updatedAt
                    }
                  : t
              )
            );
            
            // If we have a selected task and it's the one being moved, update it too
            if (selectedTask && selectedTask.id.toString() === taskId) {
              setSelectedTask(prev => ({ 
                ...prev, 
                status: data.task.status,
                progress: data.task.progress,
                updatedAt: data.task.updatedAt
              }));
            }
            
            // Refresh the task list to ensure all counts are updated
            setTimeout(() => fetchTasks(), 1000);
          }
        } else {
          // Revert on error
          console.error('Failed to update task status:', data.error || 'Unknown error');
          
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.id.toString() === taskId 
                ? { ...t, status: originalStatus }
                : t
            )
          );
          
          // Also revert the selected task if it's the one that failed
          if (selectedTask && selectedTask.id.toString() === taskId) {
            setSelectedTask(prev => ({ ...prev, status: originalStatus }));
          }
          
          alert(`Failed to update task status: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error updating task status:', error);
        
        // Revert on error
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id.toString() === taskId 
              ? { ...t, status: originalStatus }
              : t
          )
        );
        
        // Also revert the selected task if it's the one that failed
        if (selectedTask && selectedTask.id.toString() === taskId) {
          setSelectedTask(prev => ({ ...prev, status: originalStatus }));
        }
        
        alert(`Error updating task status: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault(); // Prevent form submission if called from a form
    if (!newComment.trim() || !selectedTask) return;

    setAddingComment(true);
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the selected task with the new comment
        const updatedTask = {
          ...selectedTask,
          comments: [...(selectedTask.comments || []), data.comment]
        };
        setSelectedTask(updatedTask);
        
        // Update the task in the tasks array
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? updatedTask
              : task
          )
        );
        
        setNewComment('');
      } else {
        const errorData = await response.json();
        console.error('Failed to add comment:', errorData);
        alert(`Failed to add comment: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment. Please try again.');
    } finally {
      setAddingComment(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId, completed) => {
    if (!selectedTask) return;

    try {
      console.log(`Toggling subtask ${subtaskId} to ${completed ? 'completed' : 'incomplete'}`);
      console.log('Selected task:', selectedTask);
      console.log('Subtasks:', selectedTask.subtasks);
      
      // Find the subtask to make sure it exists
      const subtask = selectedTask.subtasks.find(st => st.id === subtaskId);
      if (!subtask) {
        console.error(`Subtask with ID ${subtaskId} not found in task ${selectedTask.id}`);
        console.log('Available subtask IDs:', selectedTask.subtasks.map(st => st.id));
        
        // Try to find the subtask by index
        const subtaskIndex = parseInt(subtaskId);
        if (!isNaN(subtaskIndex) && subtaskIndex >= 0 && subtaskIndex < selectedTask.subtasks.length) {
          console.log(`Found subtask by index ${subtaskIndex}`);
        } else {
          alert('Subtask not found. Please refresh the page and try again.');
          return;
        }
      }
      
      console.log('Found subtask:', subtask);
      
      const response = await fetch(`/api/tasks/${selectedTask.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      const responseData = await response.json();
      console.log('Subtask update response:', responseData);

      if (response.ok && responseData.success) {
        console.log('Subtask updated successfully:', responseData);
        
        // Update the selected task
        const updatedTask = {
          ...selectedTask,
          subtasks: selectedTask.subtasks.map((subtask, index) => {
            // Match by id or by index if id matches or index matches subtaskId
            if ((subtask.id && subtask.id.toString() === subtaskId) || 
                index.toString() === subtaskId) {
              return { 
                ...subtask, 
                completed,
                completedAt: completed ? new Date() : null
              };
            }
            return subtask;
          }),
          progress: responseData.taskProgress,
          status: responseData.taskStatus
        };
        setSelectedTask(updatedTask);
        
        // Update the task in the tasks array
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? updatedTask
              : task
          )
        );
        
        console.log('Task updated successfully with new subtask status');
      } else {
        console.error('Failed to update subtask:', responseData);
        alert(`Failed to update subtask: ${responseData.error || 'Unknown error'}`);
        
        // Revert the UI change if the API call failed
        const subtaskElement = document.getElementById(`subtask-${subtaskId}`);
        if (subtaskElement && subtaskElement.type === 'checkbox') {
          subtaskElement.checked = !completed;
        }
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      alert('Error updating subtask. Please try again.');
    }
  };

  const handleUpdateProgress = async (taskId) => {
    const progress = prompt('Enter progress percentage (0-100):');
    if (progress === null) return;

    const progressNum = parseInt(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      alert('Please enter a valid percentage between 0 and 100');
      return;
    }

    try {
      console.log(`Updating progress for task ${taskId} to ${progressNum}%`);
      
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: progressNum }),
      });

      const data = await response.json();
      console.log('Progress update response:', data);

      if (response.ok) {
        // Update the task in the tasks array
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { 
            ...task, 
            progress: progressNum,
            status: data.status || task.status
          } : task
        ));
        
        // Update selected task if it's the one being updated
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ 
            ...prev, 
            progress: progressNum,
            status: data.status || prev.status
          }));
        }
        
        alert(`Progress updated to ${progressNum}%`);
        
        // Refresh the task list to ensure all counts are updated
        setTimeout(() => fetchTasks(), 1000);
      } else {
        console.error('Failed to update progress:', data);
        alert(`Failed to update progress: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress. Please try again.');
    }
  };

  const handleDeleteProgress = async (taskId, taskTitle) => {
    const confirmDelete = window.confirm(
      `⚠️ Are you sure you want to reset all progress for "${taskTitle}"?\n\n` +
      `This will:\n` +
      `• Set status back to "Not Started"\n` +
      `• Reset progress to 0%\n` +
      `• Clear any notes\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingProgress(taskId);
      console.log(`Deleting progress for task ${taskId}`);
      
      const response = await fetch(`/api/tasks/update?taskId=${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Delete progress response:', data);

      if (response.ok && data.success) {
        // Update the task in the tasks array
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { 
            ...task, 
            progress: 0,
            status: 'not_started',
            notes: null
          } : task
        ));
        
        // Update selected task if it's the one being reset
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ 
            ...prev, 
            progress: 0,
            status: 'not_started',
            notes: null
          }));
        }
        
        alert(`✅ Progress reset successfully for "${taskTitle}"`);
        
        // Refresh the task list to ensure all counts are updated
        setTimeout(() => fetchTasks(), 1000);
      } else {
        console.error('Failed to delete progress:', data);
        alert(`❌ Failed to reset progress: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting progress:', error);
      alert('❌ Error resetting progress. Please try again.');
    } finally {
      setDeletingProgress(null);
    }
  };

  const handleMarkComplete = async (taskId) => {
    if (!confirm('Are you sure you want to mark this task as complete?')) return;

    try {
      console.log(`Marking task ${taskId} as complete`);
      
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      console.log('Task completion response:', data);

      if (response.ok) {
        // Update tasks list
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { 
            ...task, 
            status: 'completed', 
            progress: 100,
            completedAt: new Date()
          } : task
        ));
        
        // Update selected task if it's the one being completed
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ 
            ...prev, 
            status: 'completed', 
            progress: 100,
            completedAt: new Date()
          }));
        }
        
        // Show success message
        alert('Task marked as complete successfully!');
        
        // Refresh the task list to ensure all counts are updated
        setTimeout(() => fetchTasks(), 1000);
      } else {
        console.error('Failed to mark task as complete:', data);
        alert(`Failed to mark task as complete: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking task complete:', error);
      alert('Error marking task complete. Please try again.');
    }
  };

  const handleRequestHelp = async (taskId) => {
    const message = prompt('Describe what help you need:');
    if (!message) return;

    try {
      console.log(`Sending help request for task ${taskId}: ${message}`);
      
      const response = await fetch(`/api/tasks/${taskId}/help-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      console.log('Help request response:', data);

      if (response.ok) {
        // Add the help request as a comment to the task
        if (selectedTask && selectedTask.id === taskId) {
          const newComment = {
            id: Date.now().toString(),
            author: user?.name || user?.gitlabUsername || 'You',
            text: `Help requested: ${message}`,
            timestamp: new Date(),
            type: 'help_request'
          };
          
          setSelectedTask(prev => ({
            ...prev,
            comments: [...(prev.comments || []), newComment]
          }));
          
          // Update the task in the tasks array
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === taskId 
                ? { ...task, comments: [...(task.comments || []), newComment] }
                : task
            )
          );
        }
        
        alert('Help request sent to your mentor');
      } else {
        console.error('Failed to send help request:', data);
        alert(`Failed to send help request: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error requesting help:', error);
      alert('Error requesting help. Please try again.');
    }
  };

  const handleLogTime = async (taskId) => {
    const hours = prompt('Enter hours worked (e.g., 2.5):');
    if (hours === null) return;

    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      alert('Please enter a valid number of hours');
      return;
    }

    try {
      console.log(`Logging ${hoursNum} hours for task ${taskId}`);
      
      const description = prompt('Add a description (optional):') || '';
      
      const response = await fetch(`/api/tasks/${taskId}/time-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          hours: hoursNum,
          description
        }),
      });

      const data = await response.json();
      console.log('Time logging response:', data);

      if (response.ok) {
        // Update the task in the tasks array with new time tracking data
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  timeTracking: data.timeTracking || task.timeTracking || [],
                  actualHours: data.actualHours || task.actualHours || 0
                }
              : task
          )
        );
        
        // Update selected task if it's the one being updated
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ 
            ...prev, 
            timeTracking: data.timeTracking || prev.timeTracking || [],
            actualHours: data.actualHours || prev.actualHours || 0
          }));
        }
        
        alert(`Successfully logged ${hoursNum} hours for this task`);
      } else {
        console.error('Failed to log time:', data);
        alert(data.error || 'Failed to log time');
      }
    } catch (error) {
      console.error('Error logging time:', error);
      alert('Error logging time. Please try again.');
    }
  };

  const handleSubmitTask = (task) => {
    setSelectedTask(task);
    setSubmissionData({
      submissionUrl: '',
      mergeRequestUrl: '',
      notes: ''
    });
    setShowSubmissionModal(true);
  };

  const handleSubmissionSubmit = async () => {
    if (!selectedTask || !submissionData.submissionUrl.trim()) {
      alert('Please provide a submission URL');
      return;
    }

    setSubmitting(true);
    try {
      // Make sure we have a valid task ID
      if (!selectedTask || !selectedTask.id) {
        console.error('No task selected or task ID is missing');
        alert('Error: No task selected or task ID is missing');
        setSubmitting(false);
        return;
      }
      
      const taskId = selectedTask.id;
      console.log('Submitting task:', taskId);
      console.log('Task details:', selectedTask);
      console.log('Submission data:', submissionData);
      
      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionUrl: submissionData.submissionUrl.trim(),
          mergeRequestUrl: submissionData.mergeRequestUrl?.trim() || '',
          notes: submissionData.notes?.trim() || ''
        }),
      });

      const responseData = await response.json();
      console.log('Submission response:', responseData);

      if (response.ok && responseData.success) {
        console.log('Task submitted successfully:', responseData);
        
        // Create a new submission to add to the task
        const newSubmission = responseData.submission || {
          submissionUrl: submissionData.submissionUrl.trim(),
          mergeRequestUrl: submissionData.mergeRequestUrl?.trim() || '',
          submittedAt: new Date(),
          status: 'submitted'
        };
        
        // Update the task in the tasks array
        setTasks(prevTasks => 
          prevTasks.map(task => {
            if (task.id === selectedTask.id) {
              // Create a new submissions array if it doesn't exist
              const currentSubmissions = task.submissions || [];
              
              // Check if this submission already exists
              const existingIndex = currentSubmissions.findIndex(
                sub => sub.submissionUrl === newSubmission.submissionUrl
              );
              
              let updatedSubmissions;
              if (existingIndex >= 0) {
                // Update existing submission
                updatedSubmissions = [...currentSubmissions];
                updatedSubmissions[existingIndex] = {
                  ...updatedSubmissions[existingIndex],
                  ...newSubmission
                };
              } else {
                // Add new submission
                updatedSubmissions = [...currentSubmissions, newSubmission];
              }
              
              return { 
                ...task, 
                submissions: updatedSubmissions,
                status: responseData.taskStatus || 'review',
                progress: 90 // Set progress to 90% when task is submitted for review
              };
            }
            return task;
          })
        );

        // Update selected task
        setSelectedTask(prev => {
          // Create a new submissions array if it doesn't exist
          const currentSubmissions = prev.submissions || [];
          
          // Check if this submission already exists
          const existingIndex = currentSubmissions.findIndex(
            sub => sub.submissionUrl === newSubmission.submissionUrl
          );
          
          let updatedSubmissions;
          if (existingIndex >= 0) {
            // Update existing submission
            updatedSubmissions = [...currentSubmissions];
            updatedSubmissions[existingIndex] = {
              ...updatedSubmissions[existingIndex],
              ...newSubmission
            };
          } else {
            // Add new submission
            updatedSubmissions = [...currentSubmissions, newSubmission];
          }
          
          return { 
            ...prev, 
            submissions: updatedSubmissions,
            status: responseData.taskStatus || 'review',
            progress: 90 // Set progress to 90% when task is submitted for review
          };
        });

        setShowSubmissionModal(false);
        alert('Task submitted successfully!');
        
        // Refresh the task list to ensure all counts are updated
        setTimeout(() => fetchTasks(), 1000);
      } else {
        console.error('Failed to submit task:', responseData);
        let errorMessage = 'Failed to submit task. Please try again.';
        
        if (responseData.error) {
          errorMessage = `Error: ${responseData.error}`;
          if (responseData.details) {
            errorMessage += `\nDetails: ${responseData.details}`;
          }
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      console.error('Error stack:', error.stack);
      alert(`Error submitting task: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const getSubmissionStatus = (task) => {
    if (!task.submissions || task.submissions.length === 0) {
      return null;
    }

    const userSubmission = task.submissions.find(
      sub => sub.internId === user?.id || sub.gitlabUsername === user?.gitlabUsername
    );

    return userSubmission;
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
  const completedTasks = tasks.filter(t => 
    t.status === 'done' || 
    t.status === 'completed' || 
    t.status === 'approved'
  ).length;
  
  const inProgressTasks = tasks.filter(t => 
    t.status === 'in_progress' || 
    t.status === 'active' || 
    t.status === 'review'
  ).length;
  
  const blockedTasks = tasks.filter(t => 
    t.status === 'blocked' || 
    t.status === 'cancelled'
  ).length;
  
  const overdueTasks = tasks.filter(t => {
    const dueDate = new Date(t.dueDate);
    const today = new Date();
    return dueDate < today && 
      t.status !== 'done' && 
      t.status !== 'completed' && 
      t.status !== 'approved';
  }).length;
  
  // Log task counts for debugging
  console.log('Task counts:', {
    total: tasks.length,
    completed: completedTasks,
    inProgress: inProgressTasks,
    blocked: blockedTasks,
    overdue: overdueTasks,
    statusCounts: tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {})
  });

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
                  <span>👨‍🏫 Mentor: {selectedTask.mentor || selectedTask.assignedBy || 'Admin'}</span>
                  <span className={`font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {getPriorityIcon(selectedTask.priority)} {selectedTask.priority} priority
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <span>
                    {selectedTask.assignmentType === 'cohort' 
                      ? `👥 Cohort Assignment: ${selectedTask.cohortName || 'Your Cohort'}`
                      : selectedTask.assignmentType === 'hierarchical'
                        ? `🏫 College Assignment`
                        : '👤 Individual Assignment'
                    }
                  </span>
                  <span>📋 Type: {selectedTask.type || 'Assignment'}</span>
                  {/* Task Info */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTask.weekNumber && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        📅 Week {selectedTask.weekNumber}
                      </span>
                    )}
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                      🏆 {selectedTask.points || 10} points
                    </span>
                    {selectedTask.estimatedHours > 0 && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                        ⏱️ {selectedTask.estimatedHours}h estimated
                      </span>
                    )}
                  </div>
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
                    {(selectedTask.subtasks && selectedTask.subtasks.length > 0) ? (
                      selectedTask.subtasks.map((subtask, index) => (
                        <div key={subtask.id || index} className="flex items-center space-x-3 p-2 border rounded">
                          <input 
                            type="checkbox" 
                            checked={subtask.completed}
                            onChange={(e) => handleSubtaskToggle(subtask.id || index.toString(), e.target.checked)}
                            className="rounded"
                          />
                          <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                            {subtask.title}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No subtasks</p>
                    )}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Comments</h3>
                  <div className="space-y-3">
                    {selectedTask.comments?.map(comment => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.timestamp), 'MMM dd, HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    )) || <p className="text-gray-500 text-sm">No comments yet</p>}
                    
                    {/* Add Comment */}
                    <form onSubmit={handleAddComment} className="border-t pt-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                      <button 
                        type="submit"
                        disabled={addingComment || !newComment.trim()}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingComment ? 'Adding...' : 'Add Comment'}
                      </button>
                    </form>
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
                    
                    {/* Delete Progress Button */}
                    {(selectedTask.progress > 0 || selectedTask.status !== 'not_started') && (
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => {
                            handleDeleteProgress(selectedTask.id, selectedTask.title);
                          }}
                          disabled={deletingProgress === selectedTask.id}
                          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset all progress to start over"
                        >
                          <span>{deletingProgress === selectedTask.id ? '⌛' : '🗑️'}</span>
                          <span>{deletingProgress === selectedTask.id ? 'Resetting Progress...' : 'Reset Progress'}</span>
                        </button>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          This will reset status to "Not Started" and progress to 0%
                        </p>
                      </div>
                    )}
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

                {/* Submission Status */}
                {(() => {
                  const submission = getSubmissionStatus(selectedTask);
                  if (submission) {
                    return (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Submission Status</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                              submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              submission.status === 'revision_needed' ? 'bg-yellow-100 text-yellow-800' :
                              submission.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-gray-600">Submitted:</span>
                            <span className="ml-2">{format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          
                          {submission.submissionUrl && (
                            <div className="text-sm">
                              <span className="text-gray-600">Submission:</span>
                              <a 
                                href={submission.submissionUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                              >
                                View Submission
                              </a>
                            </div>
                          )}
                          
                          {submission.mergeRequestUrl && (
                            <div className="text-sm">
                              <span className="text-gray-600">Merge Request:</span>
                              <a 
                                href={submission.mergeRequestUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                              >
                                View MR
                              </a>
                            </div>
                          )}
                          
                          {submission.grade && (
                            <div className="text-sm">
                              <span className="text-gray-600">Grade:</span>
                              <span className="ml-2 font-medium">{submission.grade}/100</span>
                            </div>
                          )}
                          
                          {submission.feedback && (
                            <div className="text-sm">
                              <span className="text-gray-600">Feedback:</span>
                              <p className="mt-1 text-gray-800 bg-gray-50 p-2 rounded text-xs">
                                {submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

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
                {selectedTask.timeTracking && selectedTask.timeTracking.length > 0 && (
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
                <button 
                  onClick={() => handleUpdateProgress(selectedTask.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Update Progress
                </button>
                <button 
                  onClick={() => handleMarkComplete(selectedTask.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Mark Complete
                </button>
                <button 
                  onClick={() => handleRequestHelp(selectedTask.id)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Request Help
                </button>
                <button 
                  onClick={() => handleLogTime(selectedTask.id)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Log Time
                </button>
                <button 
                  onClick={() => handleSubmitTask(selectedTask)}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  disabled={getSubmissionStatus(selectedTask)?.status === 'submitted'}
                >
                  {getSubmissionStatus(selectedTask) ? 'Resubmit' : 'Submit Task'}
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
      {/* Weekly Task Stats - Only show for weekly tasks */}
      {taskType === 'weekly' && Object.keys(weeklyStats).length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            📅 Weekly Progress Overview
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              Week-based Tasks
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(weeklyStats).map(([week, stats]) => (
              <div key={week} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {week === 'Other' ? '📋 Other Tasks' : `📅 Week ${week}`}
                  </h4>
                  <span className="text-xs text-gray-500">{stats.totalPoints} pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">✅ {stats.completed}</span>
                  <span className="text-blue-600">⏳ {stats.inProgress}</span>
                  <span className="text-gray-600">📝 {stats.total}</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            My Tasks
            {taskType === 'weekly' && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                📅 Weekly System
              </span>
            )}
          </h2>
          {taskType === 'weekly' && (
            <p className="text-sm text-gray-600 mt-1">
              Your tasks are organized by week for structured learning
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { id: 'kanban', label: 'Kanban', icon: '📋' },
              { id: 'list', label: 'List', icon: '📝' },
              { id: 'weekly', label: 'Weekly', icon: '🗓️' },
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['not_started', 'in_progress', 'review', 'completed'].map(status => {
              // Get status display name and icon
              const statusDisplay = {
                not_started: { name: 'To Do', icon: '📋', color: 'border-gray-400 bg-gray-50' },
                in_progress: { name: 'In Progress', icon: '⏳', color: 'border-orange-400 bg-orange-50' },
                review: { name: 'In Review', icon: '🔍', color: 'border-blue-400 bg-blue-50' },
                completed: { name: 'Completed', icon: '✅', color: 'border-green-400 bg-green-50' }
              }[status];
              
              const tasksInColumn = filteredTasks.filter(t => {
                if (status === 'not_started') {
                  return t.status === 'not_started' || t.status === 'todo' || t.status === 'draft';
                } else if (status === 'in_progress') {
                  return t.status === 'in_progress' || t.status === 'active';
                } else if (status === 'review') {
                  return t.status === 'review';
                } else if (status === 'completed') {
                  return t.status === 'completed' || t.status === 'done' || t.status === 'approved';
                }
                return t.status === status;
              });
              
              return (
                <div key={status} className={`rounded-lg p-4 border ${statusDisplay.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">{statusDisplay.icon}</span>
                      {statusDisplay.name} ({tasksInColumn.length})
                    </h3>
                    {status === 'completed' && tasksInColumn.length > 0 && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {Math.round((tasksInColumn.length / filteredTasks.length) * 100)}%
                      </span>
                    )}
                  </div>
                  
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[300px] ${
                          snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                        }`}
                      >
                        {tasksInColumn.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-3 rounded-lg shadow-sm border-l-4 cursor-pointer transition-all hover:shadow-md ${
                                  getStatusColor(task.status)
                                } ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-300' : ''}`}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTaskModal(true);
                                }}
                              >
                                {/* Task Header */}
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-start flex-1">
                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{task.title}</h4>
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full flex items-center">
                                      <span className="text-yellow-500 mr-1">🏆</span> {task.points || 10}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2">
                                    {/* Delete Progress Button */}
                                    {(task.progress > 0 || task.status !== 'not_started') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteProgress(task.id, task.title);
                                        }}
                                        disabled={deletingProgress === task.id}
                                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors disabled:opacity-50"
                                        title="Reset progress to start over"
                                      >
                                        {deletingProgress === task.id ? '⌛' : '🗑️'}
                                      </button>
                                    )}
                                    <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                      {getPriorityIcon(task.priority)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Task Progress */}
                                {task.progress > 0 && (
                                  <div className="mb-2 mt-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-gray-600">{task.progress}% complete</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          task.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                        }`}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                                
                                {/* Task Badges */}
                                <div className="flex flex-wrap gap-1 mt-2 mb-1">
                                  {/* Due Date */}
                                  <span className="inline-flex items-center text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                    📅 {format(new Date(task.dueDate), 'MMM dd')}
                                  </span>
                                  
                                  {/* Week Number */}
                                  {task.weekNumber && (
                                    <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                      Week {task.weekNumber}
                                    </span>
                                  )}
                                  
                                  {/* Points */}
                                  {task.points > 0 && (
                                    <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                      {task.points} pts
                                    </span>
                                  )}
                                </div>
                                
                                {/* Subtasks Progress */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="flex items-center mt-2 text-xs text-gray-600">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                    </svg>
                                    <span>
                                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
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
                  {taskType === 'weekly' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Week
                    </th>
                  )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                    {taskType === 'weekly' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            Week {task.weekNumber || 'N/A'}
                          </span>
                          {task.points && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              {task.points} pts
                            </span>
                          )}
                        </div>
                      </td>
                    )}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(task.progress > 0 || task.status !== 'not_started') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProgress(task.id, task.title);
                          }}
                          disabled={deletingProgress === task.id}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors disabled:opacity-50"
                          title="Reset progress to start over"
                        >
                          {deletingProgress === task.id ? '⌛ Resetting...' : '🗑️ Reset'}
                        </button>
                      )}
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

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div className="space-y-6">
          {/* Weekly View Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">📅 Weekly Task Overview</h2>
                <p className="text-blue-100">
                  Track your progress week by week. Click on any week to expand and see detailed tasks.
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {Object.keys(calculateWeeklyStats(filteredTasks)).length}
                </div>
                <div className="text-blue-100 text-sm">
                  Active Weeks
                </div>
              </div>
            </div>
          </div>
        
          <div className="space-y-4">
          {Object.entries(calculateWeeklyStats(filteredTasks))
            .sort(([a], [b]) => {
              // Sort by week number numerically
              return parseInt(a) - parseInt(b);
            })
            .map(([weekNumber, weekData]) => {
              const isCollapsed = collapsedWeeks.has(weekNumber);
              const weekTasks = weekData.tasks;
              const completionPercentage = weekData.total > 0 ? (weekData.completed / weekData.total) * 100 : 0;
              
              return (
                <div key={weekNumber} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Week Header */}
                  <div 
                    className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-colors"
                    onClick={() => toggleWeekCollapse(weekNumber)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">
                            {isCollapsed ? '📁' : '📂'}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900">
                            🗓️ Week {weekNumber}
                          </h3>
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                            {weekData.total} {weekData.total === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-green-600">{weekData.completed}</span> completed, 
                          <span className="font-medium text-blue-600 ml-1">{weekData.inProgress}</span> active, 
                          <span className="font-medium text-orange-600 ml-1">{weekData.totalPoints}</span> total pts
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              completionPercentage === 100 ? 'bg-green-500' : 
                              completionPercentage >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                        
                        <span className="text-sm font-medium text-gray-700">
                          {completionPercentage.toFixed(0)}%
                        </span>
                        
                        <span className="text-gray-400 ml-2">
                          {isCollapsed ? '▶️' : '🔽'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Week Tasks - Collapsible */}
                  {!isCollapsed && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {weekTasks.map(task => (
                          <TaskCardWithSubtasks 
                            key={task.id} 
                            task={task} 
                            onTaskClick={() => {
                              setSelectedTask(task);
                              setShowTaskModal(true);
                            }}
                            onSubtaskToggle={() => toggleSubtaskExpansion(task.id)}
                            isSubtaskExpanded={expandedSubtasks.has(task.id)}
                            onDeleteProgress={handleDeleteProgress}
                            deletingProgress={deletingProgress}
                          />
                        ))}
                      </div>
                      
                      {weekTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <span className="text-2xl">📝</span>
                          <p className="mt-2">No tasks for this week yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          
          {Object.keys(calculateWeeklyStats(filteredTasks)).length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <span className="text-4xl">📋</span>
              <h3 className="mt-4 text-lg font-medium">No tasks available</h3>
              <p className="mt-2">Tasks will appear here once they are assigned</p>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && <TaskModal />}

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Submit Task: {selectedTask?.title}
                </h2>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission URL *
                </label>
                <input
                  type="url"
                  value={submissionData.submissionUrl}
                  onChange={(e) => setSubmissionData(prev => ({
                    ...prev,
                    submissionUrl: e.target.value
                  }))}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merge Request URL (Optional)
                </label>
                <input
                  type="url"
                  value={submissionData.mergeRequestUrl}
                  onChange={(e) => setSubmissionData(prev => ({
                    ...prev,
                    mergeRequestUrl: e.target.value
                  }))}
                  placeholder="https://gitlab.com/project/-/merge_requests/123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={submissionData.notes}
                  onChange={(e) => setSubmissionData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Any additional information about your submission..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmissionSubmit}
                disabled={submitting || !submissionData.submissionUrl.trim()}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}