'use client';

import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as d3 from 'd3';

// Helper function to safely format status
const formatStatus = (status) => {
  if (!status || typeof status !== 'string') {
    return 'not started';
  }
  return status.replace('_', ' ');
};

export function TaskManagementTab() {
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'dependencies'
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const svgRef = useRef();

  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasksAndInterns();
  }, []);

  const fetchTasksAndInterns = async () => {
    try {
      setLoading(true);
      
      // Fetch real tasks and interns data
      const [tasksResponse, internsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/admin/users?role=AI%20developer%20Intern')
      ]);

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }

      if (internsResponse.ok) {
        const internsData = await internsResponse.json();
        setInterns(internsData.users || []);
      }
    } catch (error) {
      console.error('Error fetching tasks and interns:', error);
      setTasks([]);
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filterAssignee !== 'all' && task.assigneeId !== parseInt(filterAssignee)) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  // Task columns for Kanban
  const taskColumns = {
    'not_started': { 
      title: 'To Do', 
      tasks: filteredTasks.filter(t => t.status === 'not_started'),
      color: 'bg-gray-100'
    },
    'in_progress': { 
      title: 'In Progress', 
      tasks: filteredTasks.filter(t => t.status === 'in_progress'),
      color: 'bg-blue-100'
    },
    'review': { 
      title: 'Review', 
      tasks: filteredTasks.filter(t => t.status === 'review'),
      color: 'bg-yellow-100'
    },
    'done': { 
      title: 'Done', 
      tasks: filteredTasks.filter(t => t.status === 'done'),
      color: 'bg-green-100'
    }
  };

  // Handle drag and drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId !== destination.droppableId) {
      const taskId = parseInt(draggableId);
      const newStatus = destination.droppableId;
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus }
            : task
        )
      );
    }
  };

  // Priority colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Task Card Component
  const TaskCard = ({ task, index }) => (
    <Draggable draggableId={task.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 cursor-pointer hover:shadow-md transition-shadow ${
            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
          }`}
          onClick={() => {
            setSelectedTask(task);
            setShowTaskModal(true);
          }}
        >
          {/* Task Header */}
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
              {task.title}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority || 'medium')}`}>
              {task.priority || 'medium'}
            </span>
          </div>

          {/* Assignee */}
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
              {task.assigneeName.charAt(0)}
            </div>
            <span className="text-xs text-gray-600">{task.assigneeName}</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-medium text-gray-700">{task.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Task Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <span>📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
              <span>⏱️ {task.estimatedHours}h</span>
            </div>
            {task.dependencies.length > 0 && (
              <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                {task.dependencies.length} deps
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 2).map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  // Dependency Graph Component
  const DependencyGraph = () => {
    useEffect(() => {
      if (!tasks.length || viewMode !== 'dependencies') return;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const width = 800;
      const height = 600;

      // Create nodes and links
      const nodes = tasks.map(task => ({
        id: task.id,
        name: task.title.substring(0, 20) + (task.title.length > 20 ? '...' : ''),
        status: task.status,
        priority: task.priority,
        assignee: task.assigneeName,
        x: Math.random() * width,
        y: Math.random() * height
      }));

      const links = dependencies.map(dep => ({
        source: dep.prerequisite,
        target: dep.dependent
      }));

      // Color mapping for status
      const statusColors = {
        'done': '#10B981',
        'in_progress': '#3B82F6',
        'review': '#F59E0B',
        'not_started': '#6B7280'
      };

      // Create force simulation
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(30));

      // Add arrow marker
      svg.append("defs").append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 25)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");

      // Draw links
      const link = svg.append("g")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrowhead)");

      // Draw nodes
      const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 20)
        .attr("fill", d => statusColors[d.status] || '#6B7280')
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended))
        .on("click", (event, d) => {
          const task = tasks.find(t => t.id === d.id);
          setSelectedTask(task);
          setShowTaskModal(true);
        });

      // Add labels
      const labels = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .text(d => d.name)
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        .attr("dy", 35)
        .style("pointer-events", "none");

      // Update positions on simulation tick
      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        labels
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });

      // Drag functions
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

    }, [tasks, dependencies, viewMode]);

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">🔗 Task Dependencies</h3>
          <button
            onClick={() => setShowDependencyModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Manage Dependencies
          </button>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <svg ref={svgRef} width="800" height="600" className="w-full">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                      refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
              </marker>
            </defs>
          </svg>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Done</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Review</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Not Started</span>
          </div>
        </div>
      </div>
    );
  };

  // Task Modal Component
  const TaskModal = () => {
    if (!selectedTask) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedTask.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority} priority
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                    {formatStatus(selectedTask.status)}
                  </span>
                  <span>📂 {selectedTask.category}</span>
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
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{selectedTask.description}</p>
            </div>

            {/* Assignment & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Assignment</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {selectedTask.assigneeName.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{selectedTask.assigneeName}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>Created: {new Date(selectedTask.createdDate).toLocaleDateString()}</div>
                  <div>Due: {new Date(selectedTask.dueDate).toLocaleDateString()}</div>
                  <div>Estimated: {selectedTask.estimatedHours}h</div>
                  <div>Actual: {selectedTask.actualHours}h</div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Progress</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedTask.progress}%
                </span>
              </div>
            </div>

            {/* Dependencies */}
            {selectedTask.dependencies.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Dependencies</h3>
                <div className="space-y-2">
                  {selectedTask.dependencies.map(depId => {
                    const depTask = tasks.find(t => t.id === depId);
                    return depTask ? (
                      <div key={depId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{depTask.title}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(depTask.status)}`}>
                          {formatStatus(depTask.status)}
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedTask.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                Edit Task
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                Message Assignee
              </button>
              <button className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 List
            </button>
            <button
              onClick={() => setViewMode('dependencies')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'dependencies' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔗 Dependencies
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
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
            <option value="not_started">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            + New Task
          </button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
          <div className="text-sm text-gray-600">Total Tasks</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter(t => t.status === 'done').length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-orange-600">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-sm text-gray-600">In Progress</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-2xl font-bold text-red-600">
            {tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'done').length}
          </div>
          <div className="text-sm text-gray-600">Overdue</div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'dependencies' && <DependencyGraph />}

      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(taskColumns).map(([columnId, column]) => (
              <div key={columnId} className={`${column.color} p-4 rounded-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600">
                    {column.tasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[400px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50 bg-opacity-50' : ''
                      }`}
                    >
                      {column.tasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
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
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2">
                          {task.assigneeName.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-900">{task.assigneeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {formatStatus(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority || 'medium')}`}>
                        {task.priority || 'medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-gray-900">{task.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && <TaskModal />}
    </div>
  );
}