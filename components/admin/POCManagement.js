'use client';

import { useState, useEffect } from 'react';
import UserModal from './UserModal';

export function SuperMentorManagement() {
  const [superMentors, setSuperMentors] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    gitlabUsername: '',
    name: '',
    email: '',
    college: '',
    specialization: '',
    role: 'super-mentor',
    status: 'active',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersResponse, collegesResponse] = await Promise.all([
        fetch('/api/admin/users?role=super-mentor'),
        fetch('/api/admin/colleges')
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setSuperMentors(usersData.users || []);
      }

      if (collegesResponse.ok) {
        const collegesData = await collegesResponse.json();
        setColleges(collegesData.colleges || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({
      gitlabUsername: '',
      name: '',
      email: '',
      college: '',
      specialization: '',
      role: 'super-mentor',
      status: 'active',
    });
    setIsEditMode(false);
    setShowUserModal(true);
  };

  const handleEditClick = (superMentor) => {
    setFormData({ ...superMentor, role: 'super-mentor' });
    setIsEditMode(true);
    setShowUserModal(true);
  };

  const handleSaveSuperMentor = async (data) => {
    if (isEditMode && data._id) {
      // Edit
      try {
        const response = await fetch(`/api/admin/users/${data._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          setShowUserModal(false);
          fetchData();
          alert('Super-Mentor updated successfully!');
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error updating super-mentor:', error);
        alert('Failed to update super-mentor');
      }
    } else {
      // Add
      try {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          setShowUserModal(false);
          fetchData();
          alert('Super-Mentor added successfully!');
        } else {
          const error = await response.json();
          alert(`Error: ${error.message}`);
        }
      } catch (error) {
        console.error('Error adding super-mentor:', error);
        alert('Failed to add super-mentor');
      }
    }
  };

  const handleDeleteSuperMentor = async (superMentorId) => {
    if (!confirm('Are you sure you want to delete this super-mentor? This will affect all their assigned mentors and interns.')) return;

    try {
      const response = await fetch(`/api/admin/users/${superMentorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
        alert('Super-Mentor deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting super-mentor:', error);
      alert('Failed to delete super-mentor');
    }
  };

  const handleImpersonate = async (userId, targetRole) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, targetRole })
      });

      if (response.ok) {
        const data = await response.json();
        // Store impersonation data in sessionStorage
        sessionStorage.setItem('impersonationData', JSON.stringify(data.impersonationData));
        // Redirect to the appropriate dashboard
        window.location.href = data.redirectUrl;
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error starting impersonation:', error);
      alert('Failed to start impersonation');
    }
  };

  const filteredSuperMentors = superMentors.filter(sm => {
    const matchesSearch = sm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sm.gitlabUsername.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCollege = collegeFilter === 'all' || sm.college === collegeFilter;
    return matchesSearch && matchesCollege;
  });

  const getCollegeName = (collegeId) => {
    const college = colleges.find(c => c._id === collegeId);
    return college ? college.name : 'Unknown College';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Super-Mentor Management</h2>
          <p className="text-gray-600">Manage super-mentors and their college assignments</p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <span className="mr-2">➕</span>
          Add Super-Mentor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">👨‍🏫</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Super-Mentors</p>
              <p className="text-2xl font-bold text-gray-900">{superMentors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Super-Mentors</p>
              <p className="text-2xl font-bold text-gray-900">
                {superMentors.filter(sm => sm.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">🏫</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Colleges Covered</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(superMentors.map(sm => sm.college)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Performance</p>
              <p className="text-2xl font-bold text-gray-900">87.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Super-Mentors</label>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by College</label>
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Colleges</option>
              {colleges.map(college => (
                <option key={college._id} value={college._id}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCollegeFilter('all');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Super-Mentors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Super-Mentors ({filteredSuperMentors.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Super-Mentor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuperMentors.map((superMentor) => (
                <tr key={superMentor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {superMentor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{superMentor.name}</div>
                        <div className="text-sm text-gray-500">{superMentor.email}</div>
                        <div className="text-xs text-gray-400">@{superMentor.gitlabUsername}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCollegeName(superMentor.college)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {superMentor.specialization || 'General Management'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      superMentor.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {superMentor.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {superMentor.lastLoginAt 
                      ? new Date(superMentor.lastLoginAt).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditClick(superMentor)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSuperMentor(superMentor._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => handleImpersonate(superMentor._id, 'super-mentor')}
                      className="text-purple-600 hover:text-purple-900"
                      title="Impersonate this super-mentor"
                    >
                      Impersonate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={showUserModal}
        isEditMode={isEditMode}
        formData={formData}
        setFormData={setFormData}
        colleges={colleges}
        onClose={() => setShowUserModal(false)}
        onSave={handleSaveSuperMentor}
        mode="super-mentor"
        title={isEditMode ? 'Edit Super-Mentor' : 'Add New Super-Mentor'}
      />
    </div>
  );
}