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
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    submissionUrl: '',
    mergeRequestUrl: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        console.log('Tasks fetched for intern:', data.tasks);
        
        // Log the user's cohort ID
        console.log('User:', user);
        console.log('User cohort ID:', user?.cohortId);
        
        // Log all tasks for debugging
        data.tasks.forEach(task => {
          console.log(`Task: ${task.title}, Type: ${task.assignmentType}, Cohort: ${typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId}`);
        });
        
        // Filter tasks to only show tasks for the intern's cohort or assigned directly to them
        const filteredTasks = data.tasks.filter(task => {
          // Extract user's cohort ID
          const userCohortId = user?.cohortId;
          const userCohortIdStr = userCohortId ? userCohortId.toString() : '';
          
          // For cohort tasks, check if it matches the intern's cohort
          if (task.assignmentType === 'cohort' || (!task.assignmentType && task.cohortId)) {
            // Extract cohort IDs for comparison
            const taskCohortId = typeof task.cohortId === 'object' ? task.cohortId?._id : task.cohortId;
            
            // Skip if no cohort ID
            if (!taskCohortId) {
              console.log(`Task ${task.title} has no cohort ID`);
              return false;
            }
            
            // Convert to strings for comparison
            const taskCohortIdStr = taskCohortId.toString();
            
            console.log(`Comparing task cohort: ${taskCohortIdStr} with user cohort: ${userCohortIdStr}`);
            
            // Only show cohort tasks that match the intern's cohort
            const matches = taskCohortIdStr === userCohortIdStr;
            console.log(`Task ${task.title} ${matches ? 'matches' : 'does not match'} user's cohort`);
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
        setTasks(filteredTasks || []);
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
      const taskId = parseInt(result.draggableId);
      
      // Optimistically update UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );

      // Update on server
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          // Revert on error
          setTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === taskId 
                ? { ...task, status: source.droppableId }
                : task
            )
          );
          console.error('Failed to update task status');
        }
      } catch (error) {
        console.error('Error updating task status:', error);
        // Revert on error
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId 
              ? { ...task, status: source.droppableId }
              : task
          )
        );
      }
    }
  };

  const handleAddComment = async () => {
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
          comments: [...selectedTask.comments, data.comment]
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
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId, completed) => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        // Update the selected task
        const updatedTask = {
          ...selectedTask,
          subtasks: selectedTask.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, completed } : subtask
          )
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
      } else {
        console.error('Failed to update subtask');
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
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
      const response = await fetch(`/api/tasks/${taskId}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ progress: progressNum }),
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, progress: progressNum } : task
        ));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ ...prev, progress: progressNum }));
        }
      } else {
        alert('Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress');
    }
  };

  const handleMarkComplete = async (taskId) => {
    if (!confirm('Are you sure you want to mark this task as complete?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: 'completed', progress: 100 } : task
        ));
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => ({ ...prev, status: 'completed', progress: 100 }));
        }
      } else {
        alert('Failed to mark task as complete');
      }
    } catch (error) {
      console.error('Error marking task complete:', error);
      alert('Error marking task complete');
    }
  };

  const handleRequestHelp = async (taskId) => {
    const message = prompt('Describe what help you need:');
    if (!message) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}/help-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        alert('Help request sent to your mentor');
      } else {
        alert('Failed to send help request');
      }
    } catch (error) {
      console.error('Error requesting help:', error);
      alert('Error requesting help');
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
      const response = await fetch(`/api/tasks/${taskId}/time-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hours: hoursNum }),
      });

      if (response.ok) {
        alert(`Logged ${hoursNum} hours for this task`);
        // Optionally refresh task data to show updated time logs
        fetchTasks();
      } else {
        alert('Failed to log time');
      }
    } catch (error) {
      console.error('Error logging time:', error);
      alert('Error logging time');
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
      const response = await fetch(`/api/tasks/${selectedTask.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionUrl: submissionData.submissionUrl.trim(),
          mergeRequestUrl: submissionData.mergeRequestUrl.trim(),
          notes: submissionData.notes.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the task in the tasks array
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === selectedTask.id 
              ? { ...task, submissions: data.submissions, status: 'review' }
              : task
          )
        );

        // Update selected task
        setSelectedTask(prev => ({ 
          ...prev, 
          submissions: data.submissions, 
          status: 'review' 
        }));

        setShowSubmissionModal(false);
        alert('Task submitted successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Error submitting task');
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
                  <span>👨‍🏫 Mentor: {selectedTask.mentor || selectedTask.assignedBy || 'Admin'}</span>
                  <span className={`font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {getPriorityIcon(selectedTask.priority)} {selectedTask.priority} priority
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <span>
                    {selectedTask.assignmentType === 'cohort' 
                      ? `👥 Cohort Assignment: ${selectedTask.cohortName || 'Your Cohort'}`
                      : '👤 Individual Assignment'
                    }
                  </span>
                  <span>📋 Type: {selectedTask.type || 'Assignment'}</span>
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
                    {selectedTask.subtasks?.map(subtask => (
                      <div key={subtask.id} className="flex items-center space-x-3 p-2 border rounded">
                        <input 
                          type="checkbox" 
                          checked={subtask.completed}
                          onChange={(e) => handleSubtaskToggle(subtask.id, e.target.checked)}
                          className="rounded"
                        />
                        <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
                          {subtask.title}
                        </span>
                      </div>
                    )) || <p className="text-gray-500 text-sm">No subtasks</p>}
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
                    <div className="border-t pt-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                      <button 
                        onClick={handleAddComment}
                        disabled={addingComment || !newComment.trim()}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {addingComment ? 'Adding...' : 'Add Comment'}
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
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    {task.assignmentType === 'cohort' 
                                      ? `Cohort: ${task.cohortName || 'Your Cohort'}`
                                      : 'Assigned to you'
                                    }
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