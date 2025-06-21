'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function InternManagementTab() {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [interns, setInterns] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setInterns(mockData.interns);
    setColleges(mockData.colleges);
    setCohorts(mockData.cohorts);
  }, []);

  const filteredInterns = interns.filter(intern => {
    const matchesSearch = intern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         intern.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = !filterCollege || intern.college_id.toString() === filterCollege;
    const matchesStatus = !filterStatus || intern.status === filterStatus;
    
    return matchesSearch && matchesCollege && matchesStatus;
  });

  const InternSelector = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">Intern Management</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <span className="mr-2">➕</span>
          Add New Intern
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search interns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <select
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Colleges</option>
            {colleges.map(college => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          {filteredInterns.length} of {interns.length} interns
        </div>
      </div>

      {/* Intern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInterns.map(intern => (
          <div
            key={intern.id}
            onClick={() => setSelectedIntern(intern)}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
              selectedIntern?.id === intern.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {intern.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{intern.name}</p>
                <p className="text-xs text-gray-500 truncate">{intern.college_name}</p>
              </div>
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  intern.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : intern.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {intern.status}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Tasks: {intern.completed_tasks}/{intern.total_tasks}</div>
              <div>Rate: {intern.completion_rate.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const InternProgressVisualization = () => {
    if (!selectedIntern) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Intern</h3>
          <p className="text-gray-500">Choose an intern from the list above to view their detailed progress</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {selectedIntern.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedIntern.name}</h3>
              <p className="text-gray-600">{selectedIntern.email}</p>
              <p className="text-sm text-gray-500">{selectedIntern.college_name} • {selectedIntern.cohort_name}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{selectedIntern.performance_score.toFixed(1)}</div>
            <div className="text-sm text-gray-500">Performance Score</div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{selectedIntern.completed_tasks}</div>
            <div className="text-sm text-gray-600">Completed Tasks</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{selectedIntern.in_progress_tasks}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{selectedIntern.completion_rate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{selectedIntern.total_commits}</div>
            <div className="text-sm text-gray-600">GitLab Commits</div>
          </div>
        </div>

        {/* GitLab Integration */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">GitLab Integration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Username:</span>
              <span className="ml-2 text-gray-900">@{selectedIntern.gitlab_username}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Commits:</span>
              <span className="ml-2 text-gray-900">{selectedIntern.total_commits}</span>
            </div>
            <div>
              <span className="text-gray-500">Last Commit:</span>
              <span className="ml-2 text-gray-900">
                {new Date(selectedIntern.last_commit).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {selectedIntern.skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const AddInternForm = () => {
    if (!showAddForm) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Intern</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter intern name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">College</label>
                <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">Select College</option>
                  {colleges.map(college => (
                    <option key={college.id} value={college.id}>{college.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GitLab Username</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter GitLab username"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Intern
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <InternSelector />
      <InternProgressVisualization />
      <AddInternForm />
    </div>
  );
}