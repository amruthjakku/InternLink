'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function CohortManagementTab() {
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState([]);
  const [mentors, setTechLeads] = useState([]);
  const [interns, setAIDeveloperInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCohort, setEditingCohort] = useState(null);
  const [newCohort, setNewCohort] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    mentorId: '',
    maxAI Developer Interns: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cohortsRes, mentorsRes, internsRes] = await Promise.all([
        fetch('/api/admin/cohorts'),
        fetch('/api/admin/mentors'),
        fetch('/api/admin/interns')
      ]);

      if (cohortsRes.ok) {
        const cohortsData = await cohortsRes.json();
        setCohorts(cohortsData.cohorts || []);
      }

      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        setTechLeads(mentorsData.mentors || []);
      }

      if (internsRes.ok) {
        const internsData = await internsRes.json();
        setAIDeveloperInterns(internsData.interns || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/cohorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCohort,
          createdBy: user?.gitlabUsername || 'admin'
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewCohort({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          mentorId: '',
          maxAI Developer Interns: 10
        });
        fetchData();
        alert('Cohort created successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating cohort:', error);
      alert('Failed to create cohort');
    }
  };

  const handleEditCohort = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/cohorts/${editingCohort._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCohort)
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingCohort(null);
        fetchData();
        alert('Cohort updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating cohort:', error);
      alert('Failed to update cohort');
    }
  };

  const handleDeleteCohort = async (cohortId) => {
    if (!confirm('Are you sure you want to delete this cohort? This will unassign all interns.')) return;

    try {
      const response = await fetch(`/api/admin/cohorts/${cohortId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchData();
        alert('Cohort deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting cohort:', error);
      alert('Failed to delete cohort');
    }
  };

  const assignAI Developer InternToCohort = async (internId, cohortId) => {
    try {
      const response = await fetch('/api/admin/assign-intern-cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internId, cohortId })
      });

      if (response.ok) {
        fetchData();
        alert('AI Developer Intern assigned to cohort successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error assigning intern:', error);
      alert('Failed to assign intern');
    }
  };

  const getUnassignedAI Developer Interns = () => {
    return interns.filter(intern => !intern.cohortId);
  };

  const getCohortAI Developer Interns = (cohortId) => {
    return interns.filter(intern => intern.cohortId === cohortId);
  };

  const getCohortStatus = (cohort) => {
    const now = new Date();
    const startDate = new Date(cohort.startDate);
    const endDate = new Date(cohort.endDate);

    if (now < startDate) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now > endDate) return { status: 'completed', color: 'bg-gray-100 text-gray-800' };
    return { status: 'active', color: 'bg-green-100 text-green-800' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
            <h3 className="text-lg font-semibold text-gray-900">Cohort Management</h3>
            <p className="text-sm text-gray-600">Create and manage intern cohorts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            <span className="mr-2">➕</span>
            Create Cohort
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{cohorts.length}</div>
            <div className="text-sm text-gray-600">Total Cohorts</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {cohorts.filter(c => getCohortStatus(c).status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Cohorts</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {interns.filter(i => i.cohortId).length}
            </div>
            <div className="text-sm text-gray-600">Assigned AI Developer Interns</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {getUnassignedAI Developer Interns().length}
            </div>
            <div className="text-sm text-gray-600">Unassigned AI Developer Interns</div>
          </div>
        </div>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cohorts.map((cohort) => {
          const cohortStatus = getCohortStatus(cohort);
          const cohortAI Developer Interns = getCohortAI Developer Interns(cohort._id);
          const mentor = mentors.find(m => m._id === cohort.mentorId);

          return (
            <div key={cohort._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{cohort.name}</h4>
                  <p className="text-sm text-gray-600">{cohort.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cohortStatus.color}`}>
                    {cohortStatus.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">👨‍🏫</span>
                  <span>Tech Lead: {mentor?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📅</span>
                  <span>
                    {new Date(cohort.startDate).toLocaleDateString()} - {new Date(cohort.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">👥</span>
                  <span>{cohortAI Developer Interns.length}/{cohort.maxAI Developer Interns} interns</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Capacity</span>
                  <span>{Math.round((cohortAI Developer Interns.length / cohort.maxAI Developer Interns) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((cohortAI Developer Interns.length / cohort.maxAI Developer Interns) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* AI Developer Interns List */}
              {cohortAI Developer Interns.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Assigned AI Developer Interns</h5>
                  <div className="space-y-1">
                    {cohortAI Developer Interns.slice(0, 3).map(intern => (
                      <div key={intern._id} className="flex items-center text-sm text-gray-600">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                          <span className="text-white text-xs">{intern.name?.charAt(0) || 'I'}</span>
                        </div>
                        <span>{intern.name} ({intern.gitlabUsername})</span>
                      </div>
                    ))}
                    {cohortAI Developer Interns.length > 3 && (
                      <div className="text-sm text-gray-500">
                        +{cohortAI Developer Interns.length - 3} more interns
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditingCohort(cohort);
                    setShowEditModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCohort(cohort._id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned AI Developer Interns */}
      {getUnassignedAI Developer Interns().length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Unassigned AI Developer Interns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getUnassignedAI Developer Interns().map(intern => (
              <div key={intern._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">{intern.name?.charAt(0) || 'I'}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                    <div className="text-xs text-gray-500">{intern.gitlabUsername}</div>
                    <div className="text-xs text-gray-500">{intern.email}</div>
                  </div>
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      assignAI Developer InternToCohort(intern._id, e.target.value);
                    }
                  }}
                  className="w-full text-sm border-gray-300 rounded-md"
                  defaultValue=""
                >
                  <option value="">Assign to Cohort</option>
                  {cohorts.map(cohort => (
                    <option key={cohort._id} value={cohort._id}>
                      {cohort.name} ({getCohortAI Developer Interns(cohort._id).length}/{cohort.maxAI Developer Interns})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Cohort Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Cohort</h3>
            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newCohort.name}
                  onChange={(e) => setNewCohort({...newCohort, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCohort.description}
                  onChange={(e) => setNewCohort({...newCohort, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newCohort.startDate}
                  onChange={(e) => setNewCohort({...newCohort, startDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={newCohort.endDate}
                  onChange={(e) => setNewCohort({...newCohort, endDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Lead</label>
                <select
                  value={newCohort.mentorId}
                  onChange={(e) => setNewCohort({...newCohort, mentorId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Tech Lead (Optional)</option>
                  {mentors.map(mentor => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} ({mentor.gitlabUsername})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max AI Developer Interns</label>
                <input
                  type="number"
                  value={newCohort.maxAI Developer Interns}
                  onChange={(e) => setNewCohort({...newCohort, maxAI Developer Interns: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cohort Modal */}
      {showEditModal && editingCohort && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Cohort</h3>
            <form onSubmit={handleEditCohort} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingCohort.name}
                  onChange={(e) => setEditingCohort({...editingCohort, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingCohort.description}
                  onChange={(e) => setEditingCohort({...editingCohort, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={editingCohort.startDate?.split('T')[0]}
                  onChange={(e) => setEditingCohort({...editingCohort, startDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={editingCohort.endDate?.split('T')[0]}
                  onChange={(e) => setEditingCohort({...editingCohort, endDate: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tech Lead</label>
                <select
                  value={editingCohort.mentorId || ''}
                  onChange={(e) => setEditingCohort({...editingCohort, mentorId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Tech Lead (Optional)</option>
                  {mentors.map(mentor => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} ({mentor.gitlabUsername})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max AI Developer Interns</label>
                <input
                  type="number"
                  value={editingCohort.maxAI Developer Interns}
                  onChange={(e) => setEditingCohort({...editingCohort, maxAI Developer Interns: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="1"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}