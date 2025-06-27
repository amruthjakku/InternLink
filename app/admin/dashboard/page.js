'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SystemMonitoring } from '../../../components/admin/SystemMonitoring';
import { AdvancedUserManagement } from '../../../components/admin/AdvancedUserManagement';
import { EnhancedUserManagement } from '../../../components/admin/EnhancedUserManagement';
import { DataIntegrityChecker } from '../../../components/admin/DataIntegrityChecker';
import { AdvancedAnalytics } from '../../../components/admin/AdvancedAnalytics';
import { AttendanceAnalytics } from '../../../components/admin/AttendanceAnalytics';
import { IPManagement } from '../../../components/admin/IPManagement';
import { CollegeManagement } from '../../../components/CollegeManagement';
import { SuperMentorManagement } from '../../../components/admin/SuperMentorManagement';
import { UserActivationManagement } from '../../../components/admin/UserActivationManagement';
import { AttendanceDebugger } from '../../../components/admin/AttendanceDebugger';
import { CohortManagementTab } from '../../../components/admin/CohortManagementTab';
import { TaskManagementTab } from '../../../components/admin/TaskManagementTab';
import { BulkImportTab } from '../../../components/admin/BulkImportTab';
import { CohortAssignmentTab } from '../../../components/admin/CohortAssignmentTab';
import { MetricCard } from '../../../components/Charts';
import { ProfileCard } from '../../../components/ProfileCard';
import { detectUserRole, detectCohortFromUsername, validateGitlabUsername, getRoleSuggestions } from '../../../utils/roleDetection';

// Enhanced Combined Tab Components
const CombinedCollegeManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [newCollege, setNewCollege] = useState({
    name: '',
    description: '',
    location: '',
    website: '',
    mentorUsername: ''
  });

  // Fetch colleges
  const fetchColleges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges || []);
      } else {
        console.error('Failed to fetch colleges');
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new college
  const handleAddCollege = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCollege),
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewCollege({ name: '', description: '', location: '', website: '', mentorUsername: '' });
        fetchColleges(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add college');
      }
    } catch (error) {
      console.error('Error adding college:', error);
      alert('Failed to add college');
    }
  };

  // Delete college
  const handleDeleteCollege = async (collegeId) => {
    if (!confirm('Are you sure you want to delete this college?')) return;
    
    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchColleges(); // Refresh the list
      } else {
        alert('Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      alert('Failed to delete college');
    }
  };

  // Filter colleges based on search
  const filteredColleges = colleges.filter(college =>
    college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    college.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (college.mentorName && college.mentorName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fetch mentors for dropdowns
  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/admin/users?role=mentor');
      if (response.ok) {
        const data = await response.json();
        setMentors(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  // Edit college
  const handleEditCollege = (college) => {
    setEditingCollege({
      _id: college._id,
      name: college.name,
      description: college.description || '',
      location: college.location || '',
      website: college.website || '',
      mentorUsername: college.mentorUsername || ''
    });
    setShowEditModal(true);
  };

  // Update college
  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/colleges/${editingCollege._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingCollege),
      });

      if (response.ok) {
        setShowEditModal(false);
        setEditingCollege(null);
        fetchColleges(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update college');
      }
    } catch (error) {
      console.error('Error updating college:', error);
      alert('Failed to update college');
    }
  };

  // Get college logo from website
  const getCollegeLogo = (website) => {
    if (!website) return null;
    try {
      const domain = new URL(website).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      return null;
    }
  };

  // Fetch colleges and mentors on component mount
  useEffect(() => {
    fetchColleges();
    fetchMentors();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🏫</span>
          </div>
          College Management Hub
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'list'
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            College List
          </button>
          <button
            onClick={() => setActiveSubTab('management')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'management'
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Advanced Management
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'list' && (
          <div className="space-y-6">
            {/* Header with Add Button and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">College Directory</h3>
                <p className="text-sm text-gray-600">Manage all registered colleges</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
              >
                + Add College
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search colleges by name, location, or mentor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>

            {/* Colleges Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : filteredColleges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-5xl mb-4">🏫</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No colleges found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No colleges match your search criteria.' : 'Get started by adding your first college.'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                  >
                    Add First College
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredColleges.map((college) => {
                  const logoUrl = getCollegeLogo(college.website);
                  const collegeInterns = colleges.filter(c => c._id === college._id)[0];
                  
                  return (
                    <div key={college._id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                            {logoUrl ? (
                              <img 
                                src={logoUrl} 
                                alt={`${college.name} logo`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center ${logoUrl ? 'hidden' : ''}`}>
                              <span className="text-white text-xl">🏫</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{college.name}</h4>
                            <p className="text-xs text-gray-500">ID: {college._id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCollege(college)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Edit college"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteCollege(college._id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Delete college"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{college.description || 'No description available'}</p>
                      
                      {/* Stats Row */}
                      <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{college.totalInterns || 0}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{college.activeInterns || 0}</div>
                          <div className="text-xs text-gray-600">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{college.completionRate || 0}%</div>
                          <div className="text-xs text-gray-600">Rate</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2">📍</span>
                          <span>{college.location || 'No location'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2">👨‍🏫</span>
                          <span>{college.mentorName || 'No mentor assigned'}</span>
                        </div>
                        {college.website && (
                          <div className="flex items-center text-gray-600">
                            <span className="mr-2">🌐</span>
                            <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 truncate">
                              {college.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                        Added: {new Date(college.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {activeSubTab === 'management' && (
          <CollegeManagement />
        )}
      </div>

      {/* Add College Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New College</h3>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({...newCollege, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={newCollege.description}
                  onChange={(e) => setNewCollege({...newCollege, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={newCollege.location}
                  onChange={(e) => setNewCollege({...newCollege, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Website
                </label>
                <input
                  type="url"
                  value={newCollege.website}
                  onChange={(e) => setNewCollege({...newCollege, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://www.college.edu"
                />
                <p className="text-xs text-gray-500 mt-1">
                  College logo will be automatically fetched from this website
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentor
                </label>
                <select
                  value={newCollege.mentorUsername}
                  onChange={(e) => setNewCollege({...newCollege, mentorUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a mentor</option>
                  {mentors.map((mentor) => (
                    <option key={mentor._id} value={mentor.gitlabUsername}>
                      {mentor.name} ({mentor.gitlabUsername})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Add College
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit College Modal */}
      {showEditModal && editingCollege && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit College Details</h3>
            <form onSubmit={handleUpdateCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollege.name}
                  onChange={(e) => setEditingCollege({...editingCollege, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={editingCollege.description}
                  onChange={(e) => setEditingCollege({...editingCollege, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe the college, its programs, and specializations..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={editingCollege.location}
                  onChange={(e) => setEditingCollege({...editingCollege, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City, State/Province, Country"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Website
                </label>
                <input
                  type="url"
                  value={editingCollege.website}
                  onChange={(e) => setEditingCollege({...editingCollege, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://www.college.edu"
                />
                <p className="text-xs text-gray-500 mt-1">
                  College logo will be automatically fetched from this website
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Mentor
                </label>
                <select
                  value={editingCollege.mentorUsername}
                  onChange={(e) => setEditingCollege({...editingCollege, mentorUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No mentor assigned</option>
                  {mentors.map((mentor) => (
                    <option key={mentor._id} value={mentor.gitlabUsername}>
                      {mentor.name} ({mentor.gitlabUsername})
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview Section */}
              {editingCollege.website && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                      <img 
                        src={getCollegeLogo(editingCollege.website)} 
                        alt="Logo preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center hidden">
                        <span className="text-white text-sm">🏫</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{editingCollege.name}</p>
                      <p className="text-xs text-gray-500">{editingCollege.location}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-md hover:from-blue-600 hover:to-purple-600 transition-all"
                >
                  Update College
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCollege(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const CombinedAttendanceSystem = () => {
  const [activeSubTab, setActiveSubTab] = useState('analytics');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          Attendance & IP Management Center
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('ip-management')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'ip-management'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            IP Management
          </button>
          <button
            onClick={() => setActiveSubTab('debug')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'debug'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Debug Tools
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'analytics' && <AttendanceAnalytics />}
        {activeSubTab === 'ip-management' && <IPManagement />}
        {activeSubTab === 'debug' && <AttendanceDebugger />}
      </div>
    </div>
  );
};

const CombinedUserManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('advanced');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">👥</span>
          </div>
          User Management Suite
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('advanced')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'advanced'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Advanced Management
          </button>
          <button
            onClick={() => setActiveSubTab('enhanced')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'enhanced'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Enhanced Features
          </button>
          <button
            onClick={() => setActiveSubTab('activation')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'activation'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            User Activation
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'advanced' && <AdvancedUserManagement />}
        {activeSubTab === 'enhanced' && <EnhancedUserManagement />}
        {activeSubTab === 'activation' && <UserActivationManagement />}
      </div>
    </div>
  );
};

const CombinedCohortSystem = () => {
  const [activeSubTab, setActiveSubTab] = useState('management');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🎯</span>
          </div>
          Cohort Management Hub
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('management')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'management'
                ? 'bg-orange-100 text-orange-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cohort Management
          </button>
          <button
            onClick={() => setActiveSubTab('assignment')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'assignment'
                ? 'bg-orange-100 text-orange-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Member Assignment
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'management' && <CohortManagementTab />}
        {activeSubTab === 'assignment' && <CohortAssignmentTab />}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [sessionRefreshed, setSessionRefreshed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Define the enhanced tab configuration
  const defaultTabs = [
    { id: 'overview', name: 'Overview', icon: '📊', color: 'from-blue-500 to-purple-500', category: 'main' },
    { id: 'combined-college', name: 'College Management', icon: '🏫', color: 'from-purple-500 to-pink-500', category: 'management' },
    { id: 'combined-attendance', name: 'Attendance & IP System', icon: '📋', color: 'from-blue-500 to-cyan-500', category: 'monitoring' },
    { id: 'combined-users', name: 'User Management', icon: '👥', color: 'from-green-500 to-emerald-500', category: 'management' },
    { id: 'combined-cohorts', name: 'Cohort System', icon: '🎯', color: 'from-orange-500 to-red-500', category: 'management' },
    { id: 'system-monitoring', name: 'System Monitoring', icon: '🖥️', color: 'from-gray-500 to-slate-500', category: 'monitoring' },
    { id: 'advanced-analytics', name: 'Analytics Hub', icon: '📈', color: 'from-indigo-500 to-blue-500', category: 'analytics' },
    { id: 'task-management', name: 'Task Management', icon: '📝', color: 'from-yellow-500 to-orange-500', category: 'management' },
    { id: 'super-mentor-management', name: 'Super Mentors', icon: '👨‍🏫', color: 'from-teal-500 to-green-500', category: 'management' },
    { id: 'data-integrity', name: 'Data Integrity', icon: '🔧', color: 'from-red-500 to-pink-500', category: 'monitoring' },
    { id: 'bulk-operations', name: 'Bulk Operations', icon: '📦', color: 'from-purple-500 to-indigo-500', category: 'tools' },
    { id: 'debug-tools', name: 'Debug Tools', icon: '🔍', color: 'from-gray-600 to-gray-800', category: 'tools' }
  ];

  // Tab management with drag and drop functionality
  const [tabs, setTabs] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTabs = localStorage.getItem('adminDashboardTabs');
      return savedTabs ? JSON.parse(savedTabs) : defaultTabs;
    }
    return defaultTabs;
  });

  // Save tab configuration to localStorage
  const saveTabConfiguration = (newTabs) => {
    setTabs(newTabs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminDashboardTabs', JSON.stringify(newTabs));
    }
  };

  // Handle drag and drop for tab reordering
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tabs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    saveTabConfiguration(items);
  };

  // Reset to default tab configuration
  const resetTabConfiguration = () => {
    saveTabConfiguration(defaultTabs);
    setActiveTab('overview');
  };

  // Filter tabs based on search query
  const filteredTabs = tabs.filter(tab => 
    !tab.hidden && 
    (tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tab.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Session refresh logic
  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-session');
      if (response.ok) {
        const data = await response.json();
        await update({
          ...session?.user,
          role: data.user.role,
          college: data.user.college,
          assignedBy: data.user.assignedBy
        });
        setSessionRefreshed(true);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  };

  // Check authentication and permissions
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (!sessionRefreshed) {
      refreshSession();
      return;
    }

    setLoading(false);
  }, [session, status, router, sessionRefreshed]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchDashboardData();
    }
  }, [loading]);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading Dashboard...</p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Setting up your admin experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} transition-colors duration-300`}>
      {/* Enhanced Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-md border-gray-200'} shadow-lg border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">A</span>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Admin Dashboard
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    InternLink Management Center
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tabs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <img 
                  src={session?.user?.image || session?.user?.profileImage} 
                  alt={session?.user?.name}
                  className="w-10 h-10 rounded-full ring-2 ring-blue-500/20 shadow-lg"
                />
                <div className="text-right">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {session?.user?.name}
                  </p>
                  <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-sm">
                    Admin
                  </span>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation with Drag & Drop */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 backdrop-blur-md border-gray-200'} border-b sticky top-20 z-30`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="tabs" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex space-x-2 overflow-x-auto scrollbar-hide flex-1 mr-4"
                  >
                    {filteredTabs.map((tab, index) => (
                      <Draggable key={tab.id} draggableId={tab.id} index={index}>
                        {(provided, snapshot) => (
                          <button
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 transform ${
                              activeTab === tab.id
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                                : darkMode 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            } ${snapshot.isDragging ? 'rotate-3 shadow-2xl z-50' : ''}`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{tab.icon}</span>
                              <span className="whitespace-nowrap">{tab.name}</span>
                            </div>
                          </button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Tab Configuration */}
            <div className="flex items-center space-x-2">
              <button
                onClick={resetTabConfiguration}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Reset tab order"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-2xl">📊</span>
                    </div>
                    System Overview
                  </h2>
                  <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Last updated: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
            
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <MetricCard
                    title="Total Users"
                    value={stats.totalUsers || 0}
                    change={5.2}
                    icon="👥"
                    color="blue"
                  />
                  <MetricCard
                    title="Active Users"
                    value={stats.activeUsers || 0}
                    change={3.1}
                    icon="✅"
                    color="green"
                  />
                  <MetricCard
                    title="System Health"
                    value={`${stats.systemHealth || 0}%`}
                    change={0.5}
                    icon="🖥️"
                    color="purple"
                  />
                  <MetricCard
                    title="Total Mentors"
                    value={stats.totalMentors || 0}
                    change={2.1}
                    icon="👨‍🏫"
                    color="orange"
                  />
                  <MetricCard
                    title="Total Interns"
                    value={stats.totalInterns || 0}
                    change={4.3}
                    icon="🎓"
                    color="teal"
                  />
                  <MetricCard
                    title="Avg Performance"
                    value={`${stats.avgPerformance || 0}%`}
                    change={2.3}
                    icon="📈"
                    color="indigo"
                  />
                </div>

                {/* Quick Actions with modern design */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
                  <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: '👤', title: 'Add User', subtitle: 'Create new user account', color: 'from-blue-500 to-cyan-500', action: () => setActiveTab('combined-users') },
                      { icon: '🏫', title: 'Add College', subtitle: 'Register new institution', color: 'from-purple-500 to-pink-500', action: () => setActiveTab('combined-college') },
                      { icon: '📦', title: 'Bulk Import', subtitle: 'Import multiple records', color: 'from-green-500 to-emerald-500', action: () => setActiveTab('bulk-operations') },
                      { icon: '📊', title: 'View Analytics', subtitle: 'Detailed system insights', color: 'from-orange-500 to-red-500', action: () => setActiveTab('advanced-analytics') }
                    ].map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`group p-6 rounded-xl border-2 border-dashed ${
                          darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                        } transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                            <span className="text-white text-2xl">{action.icon}</span>
                          </div>
                          <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {action.title}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {action.subtitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <ProfileCard user={session?.user} showMilestones={true} />
                
                {/* System Status Card */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    System Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Database</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Healthy</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>API Server</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Storage</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-yellow-600">75% Full</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Today's Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New Registrations</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active Sessions</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>85</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tasks Completed</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>247</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combined College Management Tab */}
        {activeTab === 'combined-college' && <CombinedCollegeManagement />}

        {/* Combined Attendance System Tab */}
        {activeTab === 'combined-attendance' && <CombinedAttendanceSystem />}

        {/* Combined User Management Tab */}
        {activeTab === 'combined-users' && <CombinedUserManagement />}

        {/* Combined Cohort System Tab */}
        {activeTab === 'combined-cohorts' && <CombinedCohortSystem />}

        {/* System Monitoring Tab */}
        {activeTab === 'system-monitoring' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <SystemMonitoring />
          </div>
        )}

        {/* Advanced Analytics Tab */}
        {activeTab === 'advanced-analytics' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <AdvancedAnalytics />
          </div>
        )}

        {/* Task Management Tab */}
        {activeTab === 'task-management' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <TaskManagementTab />
          </div>
        )}

        {/* Super Mentor Management Tab */}
        {activeTab === 'super-mentor-management' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <SuperMentorManagement />
          </div>
        )}

        {/* Data Integrity Tab */}
        {activeTab === 'data-integrity' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <DataIntegrityChecker />
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk-operations' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <BulkImportTab />
          </div>
        )}

        {/* Debug Tools Tab */}
        {activeTab === 'debug-tools' && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                  <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl">🔍</span>
                  </div>
                  Debug Tools
                </h2>
              </div>
              <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Debug tools and diagnostics will be available here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}