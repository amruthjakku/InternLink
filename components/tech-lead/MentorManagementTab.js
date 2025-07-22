'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function TechLeadManagementTab() {
  const { user } = useAuth();
  const [mentors, setTechLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTech Lead, setEditingTech Lead] = useState(null);
  const [newTech Lead, setNewTech Lead] = useState({
    gitlabUsername: '',
    name: '',
    email: '',
    specialization: ''
  });

  useEffect(() => {
    fetchTech Leads();
  }, []);

  const fetchTech Leads = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddTech Lead = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/super-mentor/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTech Lead,
          role: 'Tech Lead',
          college: user?.college?._id || user?.college,
          assignedBy: user?.gitlabUsername
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewTech Lead({ gitlabUsername: '', name: '', email: '', specialization: '' });
        fetchTech Leads();
        alert('Tech Lead added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding mentor:', error);
      alert('Failed to add mentor');
    }
  };

  const handleEditTech Lead = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/super-mentor/mentors/${editingTech Lead._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTech Lead)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingTech Lead(null);
        fetchTech Leads();
        alert('Tech Lead updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating mentor:', error);
      alert('Failed to update mentor');
    }
  };

  const handleDeleteTech Lead = async (mentorId) => {
    if (!confirm('Are you sure you want to remove this mentor? This will unassign all their interns.')) return;

    try {
      const response = await fetch(`/api/super-mentor/mentors/${mentorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTech Leads();
        alert('Tech Lead removed successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error removing mentor:', error);
      alert('Failed to remove mentor');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tech Lead Management</h3>
            <p className="text-sm text-gray-600">Manage mentors in your college</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <span className="mr-2">➕</span>
            Add Tech Lead
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{mentors.length}</div>
            <div className="text-sm text-gray-600">Total Tech Leads</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {mentors.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Tech Leads</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {mentors.reduce((sum, m) => sum + (m.assignedAI Developer Interns || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Assigned AI Developer Interns</div>
          </div>
        </div>

        {/* Tech Leads Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tech Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned AI Developer Interns
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mentors.map((mentor) => (
                <tr key={mentor._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {mentor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                        <div className="text-sm text-gray-500">{mentor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mentor.specialization || 'General'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mentor.assignedAI Developer Interns || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      mentor.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {mentor.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {mentor.lastLoginAt ? new Date(mentor.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setEditingTech Lead(mentor);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTech Lead(mentor._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tech Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Tech Lead</h3>
              <form onSubmit={handleAddTech Lead} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">GitLab Username</label>
                  <input
                    type="text"
                    required
                    value={newTech Lead.gitlabUsername}
                    onChange={(e) => setNewTech Lead({...newTech Lead, gitlabUsername: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newTech Lead.name}
                    onChange={(e) => setNewTech Lead({...newTech Lead, name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={newTech Lead.email}
                    onChange={(e) => setNewTech Lead({...newTech Lead, email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input
                    type="text"
                    value={newTech Lead.specialization}
                    onChange={(e) => setNewTech Lead({...newTech Lead, specialization: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Frontend, Backend, DevOps"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Tech Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tech Lead Modal */}
      {showEditModal && editingTech Lead && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tech Lead</h3>
              <form onSubmit={handleEditTech Lead} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingTech Lead.name}
                    onChange={(e) => setEditingTech Lead({...editingTech Lead, name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={editingTech Lead.email}
                    onChange={(e) => setEditingTech Lead({...editingTech Lead, email: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input
                    type="text"
                    value={editingTech Lead.specialization || ''}
                    onChange={(e) => setEditingTech Lead({...editingTech Lead, specialization: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., Frontend, Backend, DevOps"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Update Tech Lead
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export alias for backwards compatibility
export const TechLeadManagementTab = TechLeadManagementTab;