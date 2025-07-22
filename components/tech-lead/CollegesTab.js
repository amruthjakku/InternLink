'use client';

import { useState, useEffect } from 'react';
// Using real API calls - no mock data

export function CollegesTab() {
  const [colleges, setColleges] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [interns, setAIDeveloperInterns] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);

  useEffect(() => {
    fetchColleges();
    fetchCohorts();
    fetchAIDeveloperInterns();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges || []);
      } else {
        setColleges([]);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setColleges([]);
    }
  };

  const fetchCohorts = async () => {
    try {
      const response = await fetch('/api/admin/cohorts');
      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts || []);
      } else {
        setCohorts([]);
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      setCohorts([]);
    }
  };

  const fetchAIDeveloperInterns = async () => {
    try {
      const response = await fetch('/api/admin/users?role=AI%20Developer%20Intern');
      if (response.ok) {
        const data = await response.json();
        setAIDeveloperInterns(data.users || []);
      } else {
        setAIDeveloperInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setAIDeveloperInterns([]);
    }
  };

  const getCollegeStats = (collegeId) => {
    const collegeAI Developer Interns = interns.filter(intern => intern.college_id === collegeId);
    const collegeCohorts = cohorts.filter(cohort => cohort.college_id === collegeId);
    const totalTasks = collegeAI Developer Interns.reduce((sum, intern) => sum + intern.total_tasks, 0);
    const completedTasks = collegeAI Developer Interns.reduce((sum, intern) => sum + intern.completed_tasks, 0);
    const avgPerformance = collegeAI Developer Interns.length > 0 
      ? collegeAI Developer Interns.reduce((sum, intern) => sum + intern.performance_score, 0) / collegeAI Developer Interns.length 
      : 0;

    return {
      totalAIDeveloperInterns: collegeAI Developer Interns.length,
      activeAIDeveloperInterns: collegeAI Developer Interns.filter(intern => intern.status === 'active').length,
      totalCohorts: collegeCohorts.length,
      activeCohorts: collegeCohorts.filter(cohort => cohort.status === 'active').length,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      avgPerformance: avgPerformance.toFixed(1)
    };
  };

  const handleCreateCollege = async (formData) => {
    try {
      const response = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setColleges(prev => [...prev, data.college]);
        setShowCreateForm(false);
      } else {
        console.error('Failed to create college');
      }
    } catch (error) {
      console.error('Error creating college:', error);
    }
  };

  const handleUpdateCollege = async (collegeId, formData) => {
    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setColleges(prev => prev.map(college => 
          college.id === collegeId ? data.college : college
        ));
        setEditingCollege(null);
      } else {
        console.error('Failed to update college');
      }
    } catch (error) {
      console.error('Error updating college:', error);
    }
  };

  const handleDeleteCollege = async (collegeId) => {
    if (!confirm('Are you sure you want to delete this college? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setColleges(prev => prev.filter(college => college.id !== collegeId));
      } else {
        console.error('Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
    }
  };

  const handleBulkImport = async (csvData) => {
    try {
      const response = await fetch('/api/admin/colleges/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      if (response.ok) {
        const data = await response.json();
        setColleges(prev => [...prev, ...data.colleges]);
        setShowBulkImport(false);
        alert(`Successfully imported ${data.colleges.length} colleges`);
      } else {
        console.error('Failed to import colleges');
        alert('Failed to import colleges');
      }
    } catch (error) {
      console.error('Error importing colleges:', error);
      alert('Error importing colleges');
    }
  };

  const CollegeLeaderboard = () => {
    const collegesWithStats = colleges.map(college => ({
      ...college,
      ...getCollegeStats(college.id)
    })).sort((a, b) => b.avgPerformance - a.avgPerformance);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">College Leaderboard</h3>
        
        <div className="space-y-4">
          {collegesWithStats.map((college, index) => (
            <div
              key={college.id}
              className={`p-4 rounded-lg border ${
                index === 0 ? 'border-yellow-200 bg-yellow-50' :
                index === 1 ? 'border-gray-300 bg-gray-50' :
                index === 2 ? 'border-orange-200 bg-orange-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : 
                     <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                       {index + 1}
                     </span>
                    }
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{college.name}</h4>
                    <p className="text-sm text-gray-600">{college.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{college.avgPerformance}</div>
                  <div className="text-sm text-gray-500">Performance Score</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.totalAIDeveloperInterns}</div>
                  <div className="text-gray-500">Total AI Developer Interns</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.activeAIDeveloperInterns}</div>
                  <div className="text-gray-500">Active AI Developer Interns</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.totalCohorts}</div>
                  <div className="text-gray-500">Total Cohorts</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.completionRate.toFixed(1)}%</div>
                  <div className="text-gray-500">Completion Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CollegeManager = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">College Management</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <span className="mr-2">📁</span>
            Bulk Import
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <span className="mr-2">➕</span>
            Add College
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {colleges.map(college => {
          const stats = getCollegeStats(college.id);
          return (
            <div key={college.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{college.name}</h4>
                  <p className="text-sm text-gray-600">{college.location}</p>
                  <p className="text-sm text-gray-500 mt-1">{college.description}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingCollege(college)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteCollege(college.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-lg font-bold text-blue-600">{stats.totalAIDeveloperInterns}</div>
                  <div className="text-sm text-gray-600">Total AI Developer Interns</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-lg font-bold text-green-600">{stats.activeAIDeveloperInterns}</div>
                  <div className="text-sm text-gray-600">Active AI Developer Interns</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-lg font-bold text-purple-600">{stats.totalCohorts}</div>
                  <div className="text-sm text-gray-600">Total Cohorts</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-lg font-bold text-orange-600">{stats.completionRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                Created {new Date(college.created_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const CollegeForm = () => {
    const isEditing = !!editingCollege;
    const [formData, setFormData] = useState(editingCollege || { name: '', description: '', location: '' });

    if (!showCreateForm && !editingCollege) return null;

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (isEditing) {
        await handleUpdateCollege(editingCollege.id, formData);
      } else {
        await handleCreateCollege(formData);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Edit College' : 'Add New College'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCollege(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">College Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Stanford University"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Stanford, CA, USA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Brief description of the institution..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCollege(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'Update College' : 'Add College'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const BulkImportModal = () => {
    if (!showBulkImport) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bulk Import Colleges</h3>
              <button
                onClick={() => setShowBulkImport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* CSV Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <div className="text-gray-400 text-4xl mb-2">📁</div>
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Choose File
                  </label>
                </div>
              </div>

              {/* CSV Format Example */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">CSV Format Example</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-xs text-gray-700">
{`name,location,description
"Stanford University","Stanford, CA, USA","Leading technology university"
"MIT","Cambridge, MA, USA","Massachusetts Institute of Technology"
"UC Berkeley","Berkeley, CA, USA","University of California, Berkeley"`}
                  </pre>
                </div>
              </div>

              {/* Manual Entry */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Or Add Manually</h4>
                <textarea
                  rows={6}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter college data in CSV format..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBulkImport(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Import Colleges
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CollegeAnalytics = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">College Analytics</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Developer Intern Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">AI Developer Intern Distribution</h4>
          <div className="space-y-3">
            {colleges.map(college => {
              const stats = getCollegeStats(college.id);
              const percentage = interns.length > 0 
                ? (stats.totalAIDeveloperInterns / interns.length * 100).toFixed(1)
                : 0;
              
              return (
                <div key={college.id} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">{college.name}</span>
                      <span className="text-gray-500">{stats.totalAIDeveloperInterns} interns ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Comparison */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Performance Comparison</h4>
          <div className="space-y-3">
            {colleges
              .sort((a, b) => {
                const statsA = getCollegeStats(a.id);
                const statsB = getCollegeStats(b.id);
                return parseFloat(statsB.avgPerformance) - parseFloat(statsA.avgPerformance);
              })
              .map(college => {
                const stats = getCollegeStats(college.id);
                return (
                  <div key={college.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-900">{college.name}</span>
                        <span className="text-gray-500">{stats.avgPerformance} avg score</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${stats.avgPerformance}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <CollegeLeaderboard />
      <CollegeManager />
      <CollegeAnalytics />
      <CollegeForm />
      <BulkImportModal />
    </div>
  );
}