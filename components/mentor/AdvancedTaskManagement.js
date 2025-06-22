'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { EnhancedLineChart, EnhancedBarChart, MetricCard } from '../Charts';
import { format, subDays, addDays, eachDayOfInterval } from 'date-fns';
import * as d3 from 'd3';

export function AdvancedTaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'dependencies', 'timeline', 'analytics'
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [taskAnalytics, setTaskAnalytics] = useState({});
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [workloadDistribution, setWorkloadDistribution] = useState([]);
  const svgRef = useRef();
  const timelineRef = useRef();

  const [interns, setInterns] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchInterns();
    fetchTaskAnalytics();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/advanced');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setDependencies(data.dependencies || []);
      } else {
        setTasks([]);
        setDependencies([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setDependencies([]);
    }
  };

  const fetchInterns = async () => {
    try {
      const response = await fetch('/api/admin/users?role=intern');
      if (response.ok) {
        const data = await response.json();
        setInterns(data.users || []);
      } else {
        setInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setInterns([]);
    }
  };

  const fetchTaskAnalytics = async () => {
    try {
      const [analyticsRes, performanceRes, workloadRes] = await Promise.all([
        fetch('/api/analytics/tasks'),
        fetch('/api/analytics/team-performance'),
        fetch('/api/analytics/workload-distribution')
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setTaskAnalytics(data.analytics || {});
      }

      if (performanceRes.ok) {
        const data = await performanceRes.json();
        setTeamPerformance(data.performance || []);
      }

      if (workloadRes.ok) {
        const data = await workloadRes.json();
        setWorkloadDistribution(data.workload || []);
      }
    } catch (error) {
      console.error('Error fetching task analytics:', error);
      setTaskAnalytics({});
      setTeamPerformance([]);
      setWorkloadDistribution([]);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => [...prev, data.task]);
        setShowTaskModal(false);
      } else {
        console.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(prev => prev.map(task => 
          task.id === taskId ? data.task : task
        ));
        setShowTaskModal(false);
        setSelectedTask(null);
      } else {
        console.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCreateDependency = async (fromTaskId, toTaskId) => {
    try {
      const response = await fetch('/api/tasks/dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: fromTaskId, to: toTaskId }),
      });

      if (response.ok) {
        const data = await response.json();
        setDependencies(prev => [...prev, data.dependency]);
        setShowDependencyModal(false);
      } else {
        console.error('Failed to create dependency');
      }
    } catch (error) {
      console.error('Error creating dependency:', error);
    }
  };

  // Render dependency graph
  useEffect(() => {
    if (viewMode === 'dependencies' && svgRef.current && tasks.length > 0) {
      renderDependencyGraph();
    }
  }, [viewMode, tasks, dependencies]);

  // Render timeline
  useEffect(() => {
    if (viewMode === 'timeline' && timelineRef.current && tasks.length > 0) {
      renderTimeline();
    }
  }, [viewMode, tasks]);

  const renderDependencyGraph = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;
    
    svg.attr("width", width).attr("height", height);

    // Create nodes and links
    const nodes = tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      assignee: task.assigneeName
    }));

    const links = dependencies.map(dep => ({
      source: dep.from,
      target: dep.to
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // Add links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    // Add arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Add nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", 30)
      .attr("fill", d => {
        switch(d.status) {
          case 'done': return '#10B981';
          case 'in_progress': return '#F59E0B';
          case 'blocked': return '#EF4444';
          default: return '#6B7280';
        }
      });

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "10px")
      .attr("fill", "white")
      .text(d => d.id);

    node.append("title")
      .text(d => `${d.title}\nAssigned to: ${d.assignee}\nStatus: ${d.status}`);

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };

  const renderTimeline = () => {
    const svg = d3.select(timelineRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = tasks.length * 60 - margin.top - margin.bottom;

    svg.attr("width", width + margin.left + margin.right)
       .attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent([
        ...tasks.map(t => new Date(t.createdDate)),
        ...tasks.map(t => new Date(t.dueDate))
      ]))
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(tasks.map(t => t.title))
      .range([0, height])
      .padding(0.1);

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d")));

    g.append("g")
      .call(d3.axisLeft(yScale));

    // Add timeline bars
    tasks.forEach(task => {
      const startDate = new Date(task.createdDate);
      const endDate = new Date(task.dueDate);
      const completedDate = task.completedDate ? new Date(task.completedDate) : null;

      // Task duration bar
      g.append("rect")
        .attr("x", xScale(startDate))
        .attr("y", yScale(task.title))
        .attr("width", xScale(endDate) - xScale(startDate))
        .attr("height", yScale.bandwidth())
        .attr("fill", task.status === 'done' ? '#10B981' : 
                     task.status === 'in_progress' ? '#F59E0B' : 
                     task.status === 'blocked' ? '#EF4444' : '#6B7280')
        .attr("opacity", 0.3);

      // Progress bar
      if (task.progress > 0) {
        const progressWidth = (xScale(endDate) - xScale(startDate)) * (task.progress / 100);
        g.append("rect")
          .attr("x", xScale(startDate))
          .attr("y", yScale(task.title))
          .attr("width", progressWidth)
          .attr("height", yScale.bandwidth())
          .attr("fill", task.status === 'done' ? '#10B981' : '#3B82F6')
          .attr("opacity", 0.8);
      }

      // Completion marker
      if (completedDate) {
        g.append("circle")
          .attr("cx", xScale(completedDate))
          .attr("cy", yScale(task.title) + yScale.bandwidth() / 2)
          .attr("r", 4)
          .attr("fill", "#10B981");
      }

      // Assignee avatar
      g.append("text")
        .attr("x", xScale(endDate) + 10)
        .attr("y", yScale(task.title) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .attr("font-size", "12px")
        .attr("fill", "#6B7280")
        .text(task.assigneeName.split(' ').map(n => n[0]).join(''));
    });
  };

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
    if (filterAssignee !== 'all' && task.assigneeId !== parseInt(filterAssignee)) return false;
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

  // Analytics data with safety checks
  const teamPerformanceData = {
    labels: teamPerformance && teamPerformance.length > 0 
      ? teamPerformance.map(d => format(d.date, 'MMM dd'))
      : [],
    datasets: teamPerformance && teamPerformance.length > 0 
      ? [
          {
            label: 'Tasks Completed',
            data: teamPerformance.map(d => d.tasksCompleted),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Hours Worked',
            data: teamPerformance.map(d => d.hoursWorked),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      : []
  };

  const workloadData = {
    labels: workloadDistribution && workloadDistribution.length > 0 
      ? workloadDistribution.map(intern => intern.name)
      : [],
    datasets: workloadDistribution && workloadDistribution.length > 0 
      ? [
          {
            label: 'Assigned Tasks',
            data: workloadDistribution.map(intern => intern.assignedTasks),
            backgroundColor: 'rgba(59, 130, 246, 0.8)'
          },
          {
            label: 'Completed Tasks',
            data: workloadDistribution.map(intern => intern.completedTasks),
            backgroundColor: 'rgba(16, 185, 129, 0.8)'
          }
        ]
      : []
  };

  return (
    <div className="space-y-6">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { id: 'kanban', label: 'Kanban', icon: '📋' },
              { id: 'list', label: 'List', icon: '📝' },
              { id: 'dependencies', label: 'Dependencies', icon: '🔗' },
              { id: 'timeline', label: 'Timeline', icon: '📅' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
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

          <button
            onClick={() => setShowTaskModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Assignees</option>
          {interns.map(intern => (
            <option key={intern.id} value={intern.id}>{intern.name}</option>
          ))}
        </select>

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
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Analytics Overview */}
      {viewMode === 'analytics' && (
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Completion Rate"
              value={`${taskAnalytics.completionRate}%`}
              icon="✅"
              color="green"
            />
            <MetricCard
              title="Avg Completion Time"
              value={`${taskAnalytics.averageCompletionTime} days`}
              icon="⏱️"
              color="blue"
            />
            <MetricCard
              title="On-Time Delivery"
              value={`${taskAnalytics.onTimeDelivery}%`}
              icon="🎯"
              color="purple"
            />
            <MetricCard
              title="Overdue Tasks"
              value={taskAnalytics.overdueTasks}
              icon="⚠️"
              color="red"
            />
          </div>

          {/* Team Performance Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">📈 Team Performance Trends</h3>
            {teamPerformance && teamPerformance.length > 0 ? (
              <EnhancedLineChart 
                data={teamPerformanceData} 
                height={300}
                options={{
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: { display: true, text: 'Tasks Completed' }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      title: { display: true, text: 'Hours Worked' },
                      grid: { drawOnChartArea: false }
                    }
                  }
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading performance data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Workload Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">👥 Workload Distribution</h3>
            {workloadDistribution && workloadDistribution.length > 0 ? (
              <EnhancedBarChart data={workloadData} height={300} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Loading workload data...</p>
                </div>
              </div>
            )}
          </div>

          {/* Individual Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">🏆 Individual Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {workloadDistribution.map(intern => (
                <div key={intern.id} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 ${intern.color} rounded-full flex items-center justify-center text-white font-bold`}>
                      {intern.avatar}
                    </div>
                    <div>
                      <h4 className="font-medium">{intern.name}</h4>
                      <p className="text-sm text-gray-600">{intern.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate</span>
                      <span className="font-medium">{intern.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${intern.completionRate}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Tasks</span>
                      <span>{intern.completedTasks}/{intern.assignedTasks}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Est. Hours</span>
                      <span>{intern.totalHours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                                    {task.priority}
                                  </span>
                                </div>
                                
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                      {task.assigneeName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {format(new Date(task.dueDate), 'MMM dd')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1">
                                    {task.subtasks.length > 0 && (
                                      <span className="text-xs text-gray-500">
                                        {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                                      </span>
                                    )}
                                    {task.tags.length > 0 && (
                                      <div className="flex space-x-1">
                                        {task.tags.slice(0, 2).map(tag => (
                                          <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {task.progress > 0 && (
                                  <div className="mt-3">
                                    <div className="w-full bg-gray-200 rounded-full h-1">
                                      <div 
                                        className="bg-blue-600 h-1 rounded-full"
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
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
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Dependencies View */}
      {viewMode === 'dependencies' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">🔗 Task Dependencies</h3>
            <button
              onClick={() => setShowDependencyModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Manage Dependencies
            </button>
          </div>
          <svg ref={svgRef} className="w-full border rounded-lg"></svg>
        </div>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📅 Project Timeline</h3>
          <div className="overflow-x-auto">
            <svg ref={timelineRef} className="border rounded-lg"></svg>
          </div>
        </div>
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
                    Assignee
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {task.assigneeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{task.assigneeName}</div>
                        </div>
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
                        {task.priority}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}