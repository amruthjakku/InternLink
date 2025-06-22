'use client';

import { useState, useEffect } from 'react';
import { EnhancedBarChart, EnhancedLineChart, MetricCard, SkillRadarChart } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { getCollegeName } from '../../utils/helpers';

export function InternManagementTab() {
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showInternModal, setShowInternModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [internAnalytics, setInternAnalytics] = useState({});

  useEffect(() => {
    fetchInterns();
    fetchInternAnalytics();
  }, []);

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

  const fetchInternAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/interns');
      if (response.ok) {
        const data = await response.json();
        setInternAnalytics(data.analytics || {});
      } else {
        setInternAnalytics({});
      }
    } catch (error) {
      console.error('Error fetching intern analytics:', error);
      setInternAnalytics({});
    }
  };

  // Filter interns
  const filteredInterns = interns.filter(intern => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Intern Management</h2>
        <button
          onClick={() => setShowInternModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Intern
        </button>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Interns"
          value={internAnalytics.totalInterns || 0}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Interns"
          value={internAnalytics.activeInterns || 0}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="At Risk"
          value={internAnalytics.atRiskInterns || 0}
          icon="⚠️"
          color="red"
        />
        <MetricCard
          title="Avg Performance"
          value={`${internAnalytics.avgPerformance || 0}%`}
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

      {/* Interns List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Interns ({filteredInterns.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredInterns.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No interns found matching your criteria
            </div>
          ) : (
            filteredInterns.map((intern) => (
              <div
                key={intern.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedIntern(intern)}
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
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(intern.status)}`}>
                      {intern.status || 'unknown'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Performance Charts */}
      {internAnalytics.performanceTrend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trend</h3>
            <EnhancedLineChart
              data={{
                labels: internAnalytics.performanceTrend.map(d => format(new Date(d.date), 'MMM dd')),
                datasets: [{
                  label: 'Average Performance',
                  data: internAnalytics.performanceTrend.map(d => d.avgPerformance),
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
          
          {internAnalytics.skillDistribution && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Distribution</h3>
              <EnhancedBarChart
                data={internAnalytics.skillDistribution}
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
    </div>
  );
}