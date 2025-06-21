# Intern Dashboard - Missing Features & Implementation Guide

## Overview
This document outlines all the features present in the Streamlit intern dashboard that are missing or incomplete in the Next.js app, along with detailed implementation approaches.

## Current Status Analysis

### ✅ Already Implemented in Next.js
- Basic dashboard layout with tabs
- Task list with basic status tracking
- Progress overview with simple metrics
- Performance tab structure
- Profile management interface
- Leaderboard display
- Attendance tracking interface
- Chat interface
- AI Assistant interface

### ❌ Missing or Incomplete Features

## 1. Advanced Progress Visualization

### Missing Features:
- **Interactive Progress Charts**: Dynamic charts showing task completion over time
- **Skill Development Radar**: Visual representation of skill growth
- **Activity Heatmap**: GitHub-style contribution heatmap
- **Progress Streaks**: Visual streak tracking with achievements
- **Milestone Tracking**: Visual milestone progress with celebrations

### Implementation Approach:
```javascript
// components/intern/AdvancedProgressTab.js
import { useState, useEffect } from 'react';
import { Line, Radar, Doughnut, Bar } from 'react-chartjs-2';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export function AdvancedProgressTab({ userEmail }) {
  const [progressData, setProgressData] = useState([]);
  const [skillData, setSkillData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, history: [] });
  const [milestones, setMilestones] = useState([]);

  // Progress over time chart
  const renderProgressChart = () => {
    const chartData = {
      labels: progressData.map(d => format(new Date(d.date), 'MMM dd')),
      datasets: [
        {
          label: 'Tasks Completed',
          data: progressData.map(d => d.tasksCompleted),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Cumulative Progress',
          data: progressData.map(d => d.cumulativeProgress),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">📈 Progress Over Time</h3>
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              mode: 'index',
              intersect: false,
            }
          },
          scales: {
            x: { display: true, title: { display: true, text: 'Date' } },
            y: { display: true, title: { display: true, text: 'Tasks' }, beginAtZero: true }
          }
        }} />
      </div>
    );
  };

  // Skill development radar
  const renderSkillRadar = () => {
    const radarData = {
      labels: skillData.map(skill => skill.name),
      datasets: [
        {
          label: 'Current Level',
          data: skillData.map(skill => skill.currentLevel),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgb(59, 130, 246)',
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(59, 130, 246)'
        },
        {
          label: 'Target Level',
          data: skillData.map(skill => skill.targetLevel),
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgb(16, 185, 129)',
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(16, 185, 129)'
        }
      ]
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🎯 Skill Development</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Radar data={radarData} options={{
              scales: { r: { beginAtZero: true, max: 10 } },
              plugins: { legend: { position: 'top' } }
            }} />
          </div>
          <div className="space-y-3">
            {skillData.map(skill => (
              <div key={skill.name} className="p-3 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-sm text-gray-600">
                    {skill.currentLevel}/{skill.targetLevel}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(skill.currentLevel / skill.targetLevel) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {skill.recentActivity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Activity heatmap (GitHub-style)
  const renderActivityHeatmap = () => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 365),
      end: new Date()
    });

    const getActivityLevel = (date) => {
      const activity = activityData.find(d => 
        format(new Date(d.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return activity ? Math.min(activity.count, 4) : 0;
    };

    const getHeatmapColor = (level) => {
      const colors = [
        'bg-gray-100',
        'bg-green-200',
        'bg-green-300',
        'bg-green-400',
        'bg-green-500'
      ];
      return colors[level] || colors[0];
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🔥 Activity Heatmap</h3>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-53 gap-1 min-w-max">
            {Array.from({ length: 53 }, (_, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-1">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayOffset = weekIndex * 7 + dayIndex;
                  if (dayOffset >= days.length) return null;
                  
                  const day = days[dayOffset];
                  const level = getActivityLevel(day);
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)} cursor-pointer`}
                      title={`${format(day, 'MMM dd, yyyy')}: ${level} activities`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getHeatmapColor(level)}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    );
  };

  // Streak tracking
  const renderStreakTracking = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🔥 Streak Tracking</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className="text-4xl font-bold text-orange-600 mb-2">
            {streakData.current}
          </div>
          <div className="text-sm text-gray-600">Current Streak</div>
          <div className="text-xs text-gray-500 mt-1">
            {streakData.current > 0 ? 'Keep it up!' : 'Start your streak today!'}
          </div>
        </div>

        {/* Longest Streak */}
        <div className="text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">
            {streakData.longest}
          </div>
          <div className="text-sm text-gray-600">Longest Streak</div>
          <div className="text-xs text-gray-500 mt-1">Personal best</div>
        </div>

        {/* Streak Goal */}
        <div className="text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">30</div>
          <div className="text-sm text-gray-600">Streak Goal</div>
          <div className="text-xs text-gray-500 mt-1">
            {30 - streakData.current} days to go
          </div>
        </div>
      </div>

      {/* Streak History */}
      <div className="mt-6">
        <h4 className="font-medium mb-3">Recent Streak History</h4>
        <div className="flex space-x-1 overflow-x-auto">
          {streakData.history.slice(-30).map((day, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-sm flex-shrink-0 ${
                day.active ? 'bg-green-500' : 'bg-gray-200'
              }`}
              title={`${day.date}: ${day.active ? 'Active' : 'Inactive'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Milestone tracking
  const renderMilestoneTracking = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🏆 Milestones</h3>
      
      <div className="space-y-4">
        {milestones.map(milestone => (
          <div key={milestone.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`text-2xl ${milestone.completed ? 'grayscale-0' : 'grayscale'}`}>
                  {milestone.icon}
                </div>
                <div>
                  <h4 className="font-medium">{milestone.title}</h4>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </div>
              </div>
              {milestone.completed && (
                <div className="text-green-600 font-medium">✓ Completed</div>
              )}
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  milestone.completed ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${milestone.progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>{milestone.current}/{milestone.target} {milestone.unit}</span>
              <span>{milestone.progress}% complete</span>
            </div>
            
            {milestone.reward && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                🎁 Reward: {milestone.reward}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Progress Chart */}
      {renderProgressChart()}

      {/* Skill Development */}
      {renderSkillRadar()}

      {/* Activity Heatmap */}
      {renderActivityHeatmap()}

      {/* Streak Tracking */}
      {renderStreakTracking()}

      {/* Milestone Tracking */}
      {renderMilestoneTracking()}
    </div>
  );
}
```

## 2. Enhanced Task Management

### Missing Features:
- **Task Dependency Visualization**: Show task prerequisites and blockers
- **Time Tracking Integration**: Built-in time tracking with analytics
- **Task Notes & Comments**: Add notes and comments to tasks
- **File Attachments**: Attach files to task submissions
- **Task History**: Complete audit trail of task changes

### Implementation Approach:
```javascript
// components/intern/EnhancedTasksTab.js
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export function EnhancedTasksTab({ userEmail }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [timeTracking, setTimeTracking] = useState({});
  const [taskNotes, setTaskNotes] = useState({});
  const [taskFiles, setTaskFiles] = useState({});

  // Task board with drag and drop
  const renderTaskBoard = () => {
    const taskColumns = {
      'not_started': { title: 'To Do', tasks: tasks.filter(t => t.status === 'not_started') },
      'in_progress': { title: 'In Progress', tasks: tasks.filter(t => t.status === 'in_progress') },
      'review': { title: 'Review', tasks: tasks.filter(t => t.status === 'review') },
      'done': { title: 'Done', tasks: tasks.filter(t => t.status === 'done') }
    };

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(taskColumns).map(([columnId, column]) => (
            <div key={columnId} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-4 text-center">
                {column.title} ({column.tasks.length})
              </h3>
              
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-32 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-3 rounded-lg shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow ${
                              snapshot.isDragging ? 'rotate-2' : ''
                            }`}
                            onClick={() => setSelectedTask(task)}
                          >
                            <TaskCard task={task} />
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
    );
  };

  // Enhanced task card
  const TaskCard = ({ task }) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
      </div>
      
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{task.category}</span>
        <span>{format(new Date(task.due_date), 'MMM dd')}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
        <div 
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${task.progress}%` }}
        />
      </div>
      
      {/* Task indicators */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex space-x-1">
          {task.hasNotes && <span title="Has notes">📝</span>}
          {task.hasFiles && <span title="Has attachments">📎</span>}
          {task.dependencies?.length > 0 && <span title="Has dependencies">🔗</span>}
          {timeTracking[task.id]?.active && <span title="Timer running">⏱️</span>}
        </div>
        <span className="text-xs">
          {timeTracking[task.id]?.total || 0}h
        </span>
      </div>
    </div>
  );

  // Task detail modal
  const renderTaskDetailModal = () => {
    if (!selectedTask) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
            <button 
              onClick={() => setSelectedTask(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Description */}
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-gray-700">{selectedTask.description}</p>
              </div>

              {/* Time Tracking */}
              <TimeTracker taskId={selectedTask.id} />

              {/* Task Notes */}
              <TaskNotes taskId={selectedTask.id} />

              {/* File Attachments */}
              <FileAttachments taskId={selectedTask.id} />

              {/* Task History */}
              <TaskHistory taskId={selectedTask.id} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Task Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3">Task Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <TaskStatusSelector task={selectedTask} />
                  </div>
                  <div className="flex justify-between">
                    <span>Priority:</span>
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityBadgeColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span>{format(new Date(selectedTask.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span>{selectedTask.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Dependencies */}
              <TaskDependencies task={selectedTask} />

              {/* Quick Actions */}
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded">
                  Mark Complete
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded">
                  Submit for Review
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded">
                  Request Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Time tracker component
  const TimeTracker = ({ taskId }) => {
    const [isTracking, setIsTracking] = useState(false);
    const [currentSession, setCurrentSession] = useState(0);
    const [totalTime, setTotalTime] = useState(timeTracking[taskId]?.total || 0);

    return (
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">⏱️ Time Tracking</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatTime(currentSession)}
            </div>
            <div className="text-xs text-gray-600">Current Session</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatTime(totalTime)}
            </div>
            <div className="text-xs text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(totalTime / 60 * 100) / 100}
            </div>
            <div className="text-xs text-gray-600">Hours</div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`flex-1 px-4 py-2 rounded ${
              isTracking 
                ? 'bg-red-600 text-white' 
                : 'bg-green-600 text-white'
            }`}
          >
            {isTracking ? '⏸️ Pause' : '▶️ Start'}
          </button>
          <button
            onClick={() => {
              setCurrentSession(0);
              setIsTracking(false);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            🛑 Stop
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Task Filters */}
      <TaskFilters />

      {/* Task Board */}
      {renderTaskBoard()}

      {/* Task Detail Modal */}
      {renderTaskDetailModal()}
    </div>
  );
}
```

## 3. Performance Analytics Dashboard

### Missing Features:
- **Detailed Performance Metrics**: Comprehensive performance analysis
- **Comparative Analysis**: Compare performance with peers
- **Performance Predictions**: AI-powered performance forecasting
- **Weekly/Monthly Reports**: Automated performance reports
- **Goal Setting & Tracking**: Set and track personal goals

### Implementation Approach:
```javascript
// components/intern/AdvancedPerformanceTab.js
import { useState, useEffect } from 'react';
import { Line, Bar, Radar, Scatter } from 'react-chartjs-2';

export function AdvancedPerformanceTab({ userEmail }) {
  const [performanceData, setPerformanceData] = useState({});
  const [comparisonData, setComparisonData] = useState({});
  const [predictions, setPredictions] = useState({});
  const [goals, setGoals] = useState([]);
  const [timeframe, setTimeframe] = useState('monthly');

  // Performance overview
  const renderPerformanceOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {performanceData.overallScore || 0}
            </p>
          </div>
          <div className="text-3xl">📊</div>
        </div>
        <div className="mt-2">
          <div className={`text-xs ${
            performanceData.scoreChange >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {performanceData.scoreChange >= 0 ? '↗️' : '↘️'} 
            {Math.abs(performanceData.scoreChange || 0)}% from last period
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Productivity</p>
            <p className="text-2xl font-bold text-green-600">
              {performanceData.productivity || 0}%
            </p>
          </div>
          <div className="text-3xl">⚡</div>
        </div>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${performanceData.productivity || 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Quality Score</p>
            <p className="text-2xl font-bold text-purple-600">
              {performanceData.qualityScore || 0}/10
            </p>
          </div>
          <div className="text-3xl">⭐</div>
        </div>
        <div className="mt-2">
          <div className="flex space-x-1">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (performanceData.qualityScore || 0) ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Consistency</p>
            <p className="text-2xl font-bold text-orange-600">
              {performanceData.consistency || 0}%
            </p>
          </div>
          <div className="text-3xl">🎯</div>
        </div>
        <div className="mt-2">
          <div className="text-xs text-gray-600">
            {performanceData.consistentDays || 0} consistent days
          </div>
        </div>
      </div>
    </div>
  );

  // Performance trends chart
  const renderPerformanceTrends = () => {
    const chartData = {
      labels: performanceData.trends?.labels || [],
      datasets: [
        {
          label: 'Task Completion Rate',
          data: performanceData.trends?.completionRate || [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Quality Score',
          data: performanceData.trends?.qualityScore || [],
          borderColor: 'rgb(147, 51, 234)',
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          tension: 0.4
        },
        {
          label: 'Productivity',
          data: performanceData.trends?.productivity || [],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }
      ]
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📈 Performance Trends</h3>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <Line data={chartData} options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { beginAtZero: true, max: 100 }
          }
        }} />
      </div>
    );
  };

  // Peer comparison
  const renderPeerComparison = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">👥 Peer Comparison</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comparison Chart */}
        <div>
          <Bar data={{
            labels: ['Task Completion', 'Code Quality', 'Collaboration', 'Innovation'],
            datasets: [
              {
                label: 'You',
                data: [
                  comparisonData.you?.taskCompletion || 0,
                  comparisonData.you?.codeQuality || 0,
                  comparisonData.you?.collaboration || 0,
                  comparisonData.you?.innovation || 0
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.8)'
              },
              {
                label: 'Peer Average',
                data: [
                  comparisonData.peerAverage?.taskCompletion || 0,
                  comparisonData.peerAverage?.codeQuality || 0,
                  comparisonData.peerAverage?.collaboration || 0,
                  comparisonData.peerAverage?.innovation || 0
                ],
                backgroundColor: 'rgba(156, 163, 175, 0.8)'
              }
            ]
          }} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true, max: 100 } }
          }} />
        </div>

        {/* Ranking */}
        <div>
          <h4 className="font-medium mb-3">Your Rankings</h4>
          <div className="space-y-3">
            {comparisonData.rankings?.map(ranking => (
              <div key={ranking.metric} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{ranking.metric}</div>
                  <div className="text-sm text-gray-600">
                    {ranking.score}/100 • {ranking.percentile}th percentile
                  </div>
                </div>
                <div className={`text-2xl ${getRankingEmoji(ranking.rank)}`}>
                  {getRankingEmoji(ranking.rank)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Performance predictions
  const renderPerformancePredictions = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🔮 Performance Predictions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Prediction Chart */}
        <div>
          <Line data={{
            labels: predictions.timeline || [],
            datasets: [
              {
                label: 'Predicted Performance',
                data: predictions.performanceScore || [],
                borderColor: 'rgb(59, 130, 246)',
                borderDash: [5, 5],
                tension: 0.4
              },
              {
                label: 'Historical Performance',
                data: predictions.historicalScore || [],
                borderColor: 'rgb(16, 185, 129)',
                tension: 0.4
              }
            ]
          }} options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: 'Performance Forecast' }
            }
          }} />
        </div>

        {/* Insights */}
        <div>
          <h4 className="font-medium mb-3">AI Insights</h4>
          <div className="space-y-3">
            {predictions.insights?.map((insight, index) => (
              <div key={index} className={`p-3 rounded border-l-4 ${
                insight.type === 'positive' ? 'border-green-500 bg-green-50' :
                insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-red-500 bg-red-50'
              }`}>
                <div className="font-medium text-sm">{insight.title}</div>
                <div className="text-sm text-gray-600 mt-1">{insight.description}</div>
                {insight.recommendation && (
                  <div className="text-xs text-blue-600 mt-2">
                    💡 {insight.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Goal tracking
  const renderGoalTracking = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎯 Goal Tracking</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
          Set New Goal
        </button>
      </div>
      
      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{goal.title}</h4>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{goal.progress}%</div>
                <div className="text-xs text-gray-500">
                  {goal.current}/{goal.target} {goal.unit}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}</span>
              <span>{goal.daysLeft} days left</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      {renderPerformanceOverview()}

      {/* Performance Trends */}
      {renderPerformanceTrends()}

      {/* Peer Comparison */}
      {renderPeerComparison()}

      {/* Performance Predictions */}
      {renderPerformancePredictions()}

      {/* Goal Tracking */}
      {renderGoalTracking()}
    </div>
  );
}
```

## 4. Enhanced Communication Features

### Missing Features:
- **Real-time Chat with Mentors**: Direct messaging with mentors
- **Group Chat Rooms**: Participate in topic-based chat rooms
- **Video Call Integration**: Integrated video calling
- **File Sharing**: Share files and screenshots
- **Message Search**: Search through chat history

### Implementation Approach:
```javascript
// components/intern/EnhancedChatTab.js
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function EnhancedChatTab({ userEmail }) {
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState('general');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const newSocket = io('/api/socket');
    setSocket(newSocket);

    newSocket.on('message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on('users-online', (users) => {
      setOnlineUsers(users);
    });

    newSocket.on('typing', (data) => {
      // Handle typing indicators
    });

    return () => newSocket.close();
  }, []);

  // Chat sidebar
  const renderChatSidebar = () => (
    <div className="bg-white border-r h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Chat Rooms */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-500 mb-2">CHAT ROOMS</h3>
          {chatRooms.map(room => (
            <div
              key={room.id}
              onClick={() => setActiveChat(room.id)}
              className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                activeChat === room.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="text-lg">{room.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{room.name}</div>
                <div className="text-xs text-gray-500">{room.description}</div>
              </div>
              {room.unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {room.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mentors */}
        <div className="p-3 border-t">
          <h3 className="text-sm font-medium text-gray-500 mb-2">MENTORS</h3>
          {mentors.map(mentor => (
            <div
              key={mentor.id}
              onClick={() => setActiveChat(`mentor-${mentor.id}`)}
              className={`flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                activeChat === `mentor-${mentor.id}` ? 'bg-blue-50 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={mentor.avatar}
                  alt={mentor.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  mentor.online ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{mentor.name}</div>
                <div className="text-xs text-gray-500">
                  {mentor.online ? 'Online' : `Last seen ${mentor.lastSeen}`}
                </div>
              </div>
              {mentor.unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {mentor.unreadCount}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Chat header
  const renderChatHeader = () => {
    const chatInfo = getChatInfo(activeChat);
    
    return (
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-lg">{chatInfo.icon}</div>
          <div>
            <h3 className="font-medium">{chatInfo.name}</h3>
            <p className="text-sm text-gray-500">{chatInfo.status}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => startVideoCall(activeChat)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm"
          >
            🎥 Video Call
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm"
          >
            📎 Attach
          </button>
        </div>
      </div>
    );
  };

  // Messages area
  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex ${message.sender === userEmail ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-xs lg:max-w-md ${
            message.sender === userEmail
              ? 'bg-blue-500 text-white rounded-l-lg rounded-tr-lg'
              : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
          } px-4 py-2`}>
            {message.sender !== userEmail && (
              <div className="text-xs font-medium mb-1">{message.senderName}</div>
            )}
            
            {message.type === 'text' && (
              <div className="text-sm">{message.content}</div>
            )}
            
            {message.type === 'file' && (
              <div className="text-sm">
                <div className="flex items-center space-x-2">
                  <span>📎</span>
                  <a href={message.fileUrl} className="underline">
                    {message.fileName}
                  </a>
                </div>
              </div>
            )}
            
            {message.type === 'image' && (
              <div>
                <img
                  src={message.imageUrl}
                  alt="Shared image"
                  className="max-w-full rounded"
                />
              </div>
            )}
            
            <div className="text-xs opacity-75 mt-1">
              {format(new Date(message.timestamp), 'HH:mm')}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  // Message input
  const renderMessageInput = () => (
    <div className="bg-white border-t p-4">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage(e.target.value);
              e.target.value = '';
            }
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          📎
        </button>
        <button
          onClick={() => {/* Handle emoji picker */}}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          😊
        </button>
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
        >
          Send
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );

  return (
    <div className="h-96 flex bg-gray-50 rounded-lg overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        {renderChatSidebar()}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {renderChatHeader()}
        {renderMessages()}
        {renderMessageInput()}
      </div>
    </div>
  );
}
```

## 5. Implementation Timeline & Dependencies

### Phase 1 (Week 1-2): Advanced Progress Visualization
```bash
npm install chart.js react-chartjs-2 date-fns
```

### Phase 2 (Week 3-4): Enhanced Task Management
```bash
npm install react-beautiful-dnd react-dropzone
```

### Phase 3 (Week 5-6): Performance Analytics
```bash
npm install d3 recharts
```

### Phase 4 (Week 7-8): Communication Features
```bash
npm install socket.io-client emoji-picker-react
```

## 6. API Endpoints Required

```javascript
// New API endpoints to implement
/api/intern/progress-data
/api/intern/skill-tracking
/api/intern/activity-heatmap
/api/intern/performance-analytics
/api/intern/peer-comparison
/api/intern/goals
/api/tasks/time-tracking
/api/tasks/notes
/api/tasks/attachments
/api/chat/rooms
/api/chat/messages
/api/chat/file-upload
```

This comprehensive guide provides the complete roadmap for implementing all missing intern dashboard features in the Next.js application.