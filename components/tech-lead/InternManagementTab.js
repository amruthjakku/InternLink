'use client';

import { useState, useEffect } from 'react';
import { EnhancedBarChart, EnhancedLineChart, MetricCard, SkillRadarChart } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { getCollegeName } from '../../utils/helpers';

export function AIDeveloperInternManagementTab({ userRole }) {
  const [interns, setAIDeveloperInterns] = useState([]);
  const [mentors, setTechLeads] = useState([]);
  const [selectedAIDeveloperIntern, setSelectedAIDeveloperIntern] = useState(null);
  const [showAIDeveloperInternModal, setShowAIDeveloperInternModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningAIDeveloperIntern, setAssigningAIDeveloperIntern] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [aIDeveloperInternAnalytics, setAIDeveloperInternAnalytics] = useState({});

  useEffect(() => {
    fetchAIDeveloperInterns();
    fetchAIDeveloperInternAnalytics();
    if (userRole === 'POC') {
      fetchTechLeads();
    }
  }, [userRole]);

  const fetchAIDeveloperInterns = async () => {
    try {
      let endpoint = '/api/admin/users?role=AI%20Developer%20Intern';
      if (userRole === 'Tech Lead') {
        endpoint = '/api/tech-lead/assigned-interns';
      } else if (userRole === 'POC') {
        endpoint = '/api/poc/college-interns';
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setAIDeveloperInterns(data.users || data.interns || []);
      } else {
        setAIDeveloperInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setAIDeveloperInterns([]);
    }
  };

  const fetchTechLeads = async () => {
    try {
      const response = await fetch('/api/super-mentor/college-mentors');
      if (response.ok) {
        const data = await response.json();
        setTechLeads(data.mentors || []);
      } else {
        setTechLeads([]);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setTechLeads([]);
    }
  };

  const fetchAIDeveloperInternAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/interns');
      if (response.ok) {
        const data = await response.json();
        setAIDeveloperInternAnalytics(data.analytics || {});
      } else {
        setAIDeveloperInternAnalytics({});
      }
    } catch (error) {
      console.error('Error fetching intern analytics:', error);
      setAIDeveloperInternAnalytics({});
    }
  };

  // Filter interns
  const filteredAIDeveloperInterns = interns.filter(intern => {
    if (filterStatus !== 'all' && intern.status !== filterStatus) return false;
    if (filterPerformance !== 'all') {
      if (filterPerformance === 'high' && intern.performanceScore < 85) return false;
      if (filterPerformance === 'medium' && (intern.performanceScore < 70 || intern.performanceScore >= 85)) return false;
      if (filterPerformance === 'low' && intern.performanceScore >= 70) return false;
    }
    if (searchTerm && !intern.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !intern.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'at_risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAssignAIDeveloperIntern = async (mentorId) => {
    if (!assigningAIDeveloperIntern || !mentorId) return;

    try {
      const response = await fetch('/api/super-mentor/assign-intern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internId: assigningAIDeveloperIntern._id,
          mentorId: mentorId
        })
      });

      if (response.ok) {
        setShowAssignModal(false);
        setAssigningAIDeveloperIntern(null);
        fetchAIDeveloperInterns();
        alert('AI Developer Intern assigned successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error assigning intern:', error);
      alert('Failed to assign intern');
    }
  };

  const handleUnassignAIDeveloperIntern = async (internId) => {
    if (!confirm('Are you sure you want to unassign this intern from their mentor?')) return;

    try {
      const response = await fetch('/api/super-mentor/assign-intern', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId })
      });

      if (response.ok) {
        fetchAIDeveloperInterns();
        alert('AI Developer Intern unassigned successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error unassigning intern:', error);
      alert('Failed to unassign intern');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">AI Developer Intern Management</h2>
        <button
          onClick={() => setShowAIDeveloperInternModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New AI Developer Intern
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total AI Developer Interns"
          value={aIDeveloperInternAnalytics.totalAIDeveloperInterns || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active AI Developer Interns"
          value={aIDeveloperInternAnalytics.activeAIDeveloperInterns || 0}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="At Risk"
          value={aIDeveloperInternAnalytics.atRiskAIDeveloperInterns || 0}
          icon="⚠️"
          color="red"
        />
        <MetricCard
          title="Avg Performance"
          value={`${aIDeveloperInternAnalytics.avgPerformance || 0}%`}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="excellent">Excellent</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance</label>
            <select
              value={filterPerformance}
              onChange={(e) => setFilterPerformance(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Performance</option>
              <option value="high">High (85%+)</option>
              <option value="medium">Medium (70-84%)</option>
              <option value="low">Low (&lt;70%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* AI Developer Interns List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            AI Developer Interns ({filteredAIDeveloperInterns.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredAIDeveloperInterns.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No interns found matching your criteria
            </div>
          ) : (
            filteredAIDeveloperInterns.map((intern) => (
              <div
                key={intern.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAIDeveloperIntern(intern)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full ${intern.color || 'bg-gray-500'} flex items-center justify-center text-white font-medium`}>
                      {intern.avatar || intern.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{intern.name}</h4>
                      <p className="text-sm text-gray-500">{intern.email}</p>
                      <p className="text-xs text-gray-400">{getCollegeName(intern.college)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPerformanceColor(intern.performanceScore || 0)}`}>
                        {intern.performanceScore || 0}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {intern.tasksCompleted || 0}/{intern.totalTasks || 0} tasks
                      </p>
                      {intern.assignedTechLead && (
                        <p className="text-xs text-blue-600">
                          Tech Lead: {intern.assignedTechLeadName || 'Assigned'}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(intern.status)}`}>
                      {intern.status || 'unknown'}
                    </span>
                    {userRole === 'POC' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigningAIDeveloperIntern(intern);
                            setShowAssignModal(true);
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          {intern.assignedTechLead ? 'Reassign' : 'Assign'}
                        </button>
                        {intern.assignedTechLead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassignAIDeveloperIntern(intern._id);
                            }}
                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Charts */}
      {aIDeveloperInternAnalytics.performanceTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trend</h3>
            <EnhancedLineChart
              data={{
                labels: aIDeveloperInternAnalytics.performanceTrend.map(d => format(new Date(d.date), 'MMM dd')),
                datasets: [{
                  label: 'Average Performance',
                  data: aIDeveloperInternAnalytics.performanceTrend.map(d => d.avgPerformance),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4,
                  fill: true
                }]
              }}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
            />
          </div>
          
          {aIDeveloperInternAnalytics.skillDistribution && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Distribution</h3>
              <EnhancedBarChart
                data={aIDeveloperInternAnalytics.skillDistribution}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && assigningAIDeveloperIntern && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Tech Lead to {assigningAIDeveloperIntern.name}
              </h3>
              <div className="space-y-3">
                {mentors.map((mentor) => (
                  <div
                    key={mentor._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {mentor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                        <div className="text-xs text-gray-500">{mentor.email}</div>
                        <div className="text-xs text-gray-400">
                          {mentor.assignedAIDeveloperInterns || 0} interns assigned
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignAIDeveloperIntern(mentor._id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Assign
                    </button>
                  </div>
                ))}
                {mentors.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No mentors available in your college
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningAIDeveloperIntern(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}