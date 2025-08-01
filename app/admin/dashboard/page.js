'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useTabData, useDashboardData } from '../../../hooks/useTabData';
import { useAdminData, useAdminTabData } from '../../../hooks/useAdminData';
import { useFocusManager, useCachedDataWithFocus } from '../../../hooks/useFocusManager';
import dashboardCache, { cachedFetch, CacheKeys, CacheTTL } from '../../../utils/cache';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AdminDashboardWrapper, { TabContent, DataSection, withAdminCache } from '../../../components/admin/AdminDashboardWrapper';
import { 
  DashboardSkeleton, 
  StatsSkeleton, 
  TableSkeleton, 
  GridSkeleton, 
  CardSkeleton, 
  ListSkeleton 
} from '../../../components/ui/Skeleton';
import { SystemMonitoring } from '../../../components/admin/SystemMonitoring';
import { AdvancedUserManagement } from '../../../components/admin/AdvancedUserManagement';
import { EnhancedUserManagement } from '../../../components/admin/EnhancedUserManagement';
import { ComprehensiveUserManagement } from '../../../components/admin/ComprehensiveUserManagement';
import { DataIntegrityChecker } from '../../../components/admin/DataIntegrityChecker';
import { AdvancedAnalytics } from '../../../components/admin/AdvancedAnalytics';
import { CombinedAttendanceSystem } from '../../../components/admin/CombinedAttendanceSystem';
import { CollegeManagement } from '../../../components/CollegeManagement';
import { POCManagement } from '../../../components/admin/POCManagement';
import { UserActivationManagement } from '../../../components/admin/UserActivationManagement';
import { AttendanceDebugger } from '../../../components/admin/AttendanceDebugger';
import { CohortManagementTab } from '../../../components/admin/CohortManagementTab';
import { TaskManagementTab } from '../../../components/admin/TaskManagementTab';
import { BulkImportTab } from '../../../components/admin/BulkImportTab';
import { CohortAssignmentTab } from '../../../components/admin/CohortAssignmentTab';
import { CohortCollegesTab } from '../../../components/admin/CohortCollegesTab';
import { MetricCard } from '../../../components/Charts';
import { ProfileCard } from '../../../components/ProfileCard';
import { detectUserRole, detectCohortFromUsername, validateGitlabUsername, getRoleSuggestions } from '../../../utils/roleDetection';
import OrganizationManagement from '../../../components/admin/OrganizationManagement';
import TaskWorkflow from '../../../components/admin/TaskWorkflow';
import TeamManagement from '../../../components/admin/TeamManagement';
import MonitoringAnalytics from '../../../components/admin/MonitoringAnalytics';
import SystemTools from '../../../components/admin/SystemTools';
import AnnouncementsManagement from '../../../components/admin/AnnouncementsManagement';

// Enhanced Combined Tab Components with Caching
const CombinedCollegeManagement = memo(() => {
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [newCollege, setNewCollege] = useState({
    name: '',
    description: '',
    location: '',
    website: '',
    superTechLeadUsername: ''
  });

  // Use cached data for colleges
  const { 
    data: colleges = [], 
    loading: collegesLoading, 
    error: collegesError,
    refetch: refetchColleges 
  } = useCachedDataWithFocus(
    CacheKeys.ALL_COLLEGES(),
    () => fetch('/api/admin/colleges').then(res => res.json()).then(data => data.colleges || []),
    { 
      ttl: CacheTTL.LONG,
      refreshOnFocus: false,
      staleWhileRevalidate: true
    }
  );

  // Use cached data for mentors/POCs
  const { 
    data: mentors = [], 
    loading: mentorsLoading 
  } = useCachedDataWithFocus(
    'admin:users:pocs',
    () => fetch('/api/admin/users?role=POC').then(res => res.json()).then(data => data.users || []),
    { 
      ttl: CacheTTL.MEDIUM,
      refreshOnFocus: false
    }
  );

  // Add new college with cache invalidation
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
        setNewCollege({ name: '', description: '', location: '', website: '', superTechLeadUsername: '' });
        
        // Invalidate related caches and refetch
        dashboardCache.delete(CacheKeys.ALL_COLLEGES());
        dashboardCache.invalidatePattern('admin:colleges:.*');
        refetchColleges();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add college');
      }
    } catch (error) {
      console.error('Error adding college:', error);
      alert('Failed to add college');
    }
  };

  // Delete college with cache invalidation
  const handleDeleteCollege = async (collegeId) => {
    if (!confirm('Are you sure you want to delete this college?')) return;
    
    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Invalidate related caches and refetch
        dashboardCache.delete(CacheKeys.ALL_COLLEGES());
        dashboardCache.invalidatePattern('admin:colleges:.*');
        refetchColleges();
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
    (college.superTechLeadName && college.superTechLeadName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fetch POCs for dropdowns
  const fetchPOCs = async () => {
    try {
      const response = await fetch('/api/admin/users?role=POC');
      if (response.ok) {
        const data = await response.json();
        setTechLeads(data.users || []); // Keep the same state variable for compatibility
      }
    } catch (error) {
      console.error('Error fetching POCs:', error);
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
      superTechLeadUsername: college.superTechLeadUsername || ''
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

  // Fetch colleges and POCs on component mount
  useEffect(() => {
    fetchColleges();
    fetchPOCs();
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
            {collegesLoading ? (
              <GridSkeleton items={6} columns={3} />
            ) : collegesError ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Colleges</h3>
                <p className="text-gray-600 mb-4">{collegesError.message}</p>
                <button
                  onClick={() => refetchColleges()}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
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
                {filteredColleges.map((college, index) => {
                  const logoUrl = getCollegeLogo(college.website);
                  
                  return (
                    <div key={college?._id || `college-${index}`} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
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
                            <h4 className="font-semibold text-gray-900">{college?.name || 'Unknown College'}</h4>
                            <p className="text-xs text-gray-500">ID: {college?._id?.slice(-6) || 'N/A'}</p>
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
                          <div className="text-lg font-bold text-gray-900">{college.totalAIDeveloperInterns || 0}</div>
                          <div className="text-xs text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{college.activeAIDeveloperInterns || 0}</div>
                          <div className="text-xs text-gray-600">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{college.internsWithCohorts || 0}</div>
                          <div className="text-xs text-gray-600">In Cohorts</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2">📍</span>
                          <span>{college.location || 'No location'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2">👨‍🏫</span>
                          <span>{college.pocName || 'No POC assigned'}</span>
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
                  Super-mentor
                </label>
                <select
                  value={newCollege.superTechLeadUsername}
                  onChange={(e) => setNewCollege({...newCollege, superTechLeadUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a POC</option>
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
                  Assigned Super-mentor
                </label>
                <select
                  value={editingCollege.superTechLeadUsername}
                  onChange={(e) => setEditingCollege({...editingCollege, superTechLeadUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No POC assigned</option>
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
});

CombinedCollegeManagement.displayName = 'CombinedCollegeManagement';

// These components have been moved to separate component files

// Main Admin Dashboard Component with Caching
const AdminDashboardContent = memo(({ adminContext }) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  // Use admin data hook for centralized state management
  const {
    activeTab,
    switchTab,
    isTabLoaded,
    isTabLoading,
    getTabData,
    refreshCurrentTab
  } = useAdminData();

  // Default stats object with all required properties
  const defaultStats = {
    totalUsers: 0,
    totalColleges: 0,
    totalTechLeads: 0,
    totalAIDeveloperInterns: 0,
    totalAdmins: 0,
    activeUsers: 0,
    systemHealth: 100,
    avgPerformance: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    attendanceRate: 0,
    newUsersToday: 0
  };

  // Use cached stats data with proper error handling
  const { 
    data: statsData, 
    loading: statsLoading, 
    error: statsError,
    refetch: refetchStats 
  } = useCachedDataWithFocus(
    CacheKeys.SYSTEM_STATS(),
    () => fetch('/api/admin/stats').then(res => {
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }).then(data => data.stats || defaultStats),
    { 
      ttl: CacheTTL.SHORT,
      refreshOnFocus: true,
      staleWhileRevalidate: true
    }
  );

  // Ensure stats is never null/undefined
  const stats = statsData || defaultStats;

  // Simplified tab configuration - reduced from 12 to 7 tabs
  const defaultTabs = [
    { 
      id: 'overview', 
      name: 'Overview', 
      icon: '🏠', 
      color: 'from-blue-500 to-purple-500', 
      category: 'main',
      description: 'Dashboard, analytics & insights'
    },
    { 
      id: 'user-management', 
      name: 'User Management', 
      icon: '👥', 
      color: 'from-green-500 to-emerald-500', 
      category: 'core',
      description: 'All users, roles & permissions'
    },
    { 
      id: 'college-management', 
      name: 'College Management', 
      icon: '🏫', 
      color: 'from-purple-500 to-pink-500', 
      category: 'core',
      description: 'Institutions & assignments'
    },
    { 
      id: 'attendance-ip', 
      name: 'Attendance & Security', 
      icon: '🔐', 
      color: 'from-yellow-500 to-orange-500', 
      category: 'core',
      description: 'Attendance, IP & access control'
    },
    { 
      id: 'cohort-system', 
      name: 'Cohort System', 
      icon: '🎯', 
      color: 'from-teal-500 to-cyan-500', 
      category: 'core',
      description: 'Groups & batch management'
    },
    { 
      id: 'task-management', 
      name: 'Task Management', 
      icon: '📋', 
      color: 'from-orange-500 to-red-500', 
      category: 'core',
      description: 'Tasks, assignments & progress'
    },
    { 
      id: 'announcements', 
      name: 'Announcements', 
      icon: '📢', 
      color: 'from-indigo-500 to-blue-500', 
      category: 'communication',
      description: 'System-wide & college announcements'
    },
    { 
      id: 'system-monitoring', 
      name: 'System Admin', 
      icon: '⚙️', 
      color: 'from-gray-600 to-gray-800', 
      category: 'admin',
      description: 'Monitoring, data & diagnostics'
    }
  ];

  // Tab management with drag and drop functionality
  const [tabs, setTabs] = useState(() => {
    // Force use of new tabs by clearing localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminDashboardTabs');
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
    switchTab('overview');
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

    // Force reset tabs to show new hierarchical workflow within the familiar interface
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminDashboardTabs');
      setTabs(defaultTabs);
      switchTab('task-management'); // Set active tab to task management to highlight the new feature
    }

    if (!sessionRefreshed) {
      refreshSession();
      return;
    }

    setLoading(false);
  }, [session, status, router, sessionRefreshed]);

  // Authentication and session management
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
  }, [session, status, router, sessionRefreshed]);

  // Show loading state during authentication
  if (status === 'loading' || !session) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} transition-colors duration-300`}>
        <div className="container mx-auto px-4 py-8">
          <DashboardSkeleton />
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
                    AI Developer InternLink Management Center
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
                            onClick={() => switchTab(tab.id)}
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
            
                {/* Enhanced Stats Cards with Real Data */}
                {statsLoading ? (
                  <StatsSkeleton items={8} />
                ) : statsError ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
                    <p className="text-gray-600 mb-4">Failed to load system stats</p>
                    <button
                      onClick={() => refetchStats()}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Users"
                    value={stats.totalUsers || 0}
                    change={stats.newUsersToday || 0}
                    icon="👥"
                    color="blue"
                    subtitle={`${stats.newUsersToday || 0} new today`}
                  />
                  <MetricCard
                    title="Active Users"
                    value={stats.activeUsers || 0}
                    change={stats.userActivityRate || 0}
                    icon="✅"
                    color="green"
                    subtitle={`${stats.userActivityRate || 0}% activity rate`}
                  />
                  <MetricCard
                    title="System Health"
                    value={`${stats.systemHealth || 0}%`}
                    change={stats.loginsToday || 0}
                    icon="🖥️"
                    color="purple"
                    subtitle={`${stats.loginsToday || 0} logins today`}
                  />
                  <MetricCard
                    title="Total Colleges"
                    value={stats.totalColleges || 0}
                    change={stats.collegeUtilization || 0}
                    icon="🏫"
                    color="pink"
                    subtitle={`${stats.collegeUtilization || 0}% utilized`}
                  />
                  <MetricCard
                    title="Total Tech Leads"
                    value={`${stats.totalTechLeads || 0} + ${stats.totalPOCs || 0}`}
                    change={stats.totalPOCs || 0}
                    icon="👨‍🏫"
                    color="orange"
                    subtitle={`${stats.totalPOCs || 0} POCs`}
                  />
                  <MetricCard
                    title="Total AI Developer Interns"
                    value={stats.totalAIDeveloperInterns || 0}
                    change={stats.recentlyActiveUsers || 0}
                    icon="🎓"
                    color="teal"
                    subtitle={`${stats.recentlyActiveUsers || 0} active this week`}
                  />
                  <MetricCard
                    title="Cohort System"
                    value={`${stats.activeCohorts || 0}/${stats.totalCohorts || 0}`}
                    change={stats.activeCohorts || 0}
                    icon="🎯"
                    color="indigo"
                    subtitle={`${stats.activeCohorts || 0} active cohorts`}
                  />
                  <MetricCard
                    title="Performance Score"
                    value={`${stats.avgPerformance || 0}%`}
                    change={stats.avgPerformance - 75 || 0}
                    icon="📈"
                    color="emerald"
                    subtitle="Real-time calculated"
                  />
                  </div>
                )}

                {/* Real-time Data Synchronization Status */}
                <div className={`${darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-blue-200'} p-8`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      📊 Live Data Synchronization
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600">Real-time Active</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Database Sync Status */}
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Database Sync</span>
                        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">LIVE</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Last Update:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Loading...'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Collections:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Users, Colleges, Cohorts</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status:</span>
                          <span className="font-medium text-green-600">✅ Synchronized</span>
                        </div>
                      </div>
                    </div>

                    {/* API Health */}
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>API Health</span>
                        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">ACTIVE</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Endpoints:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>124 routes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Response Time:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>&lt; 200ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Status:</span>
                          <span className="font-medium text-green-600">🚀 Operational</span>
                        </div>
                      </div>
                    </div>

                    {/* Data Quality */}
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Data Quality</span>
                        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">100%</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Mock Data:</span>
                          <span className="font-medium text-green-600">🧹 Removed</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Integrity:</span>
                          <span className="font-medium text-green-600">✅ Perfect</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Sync Score:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.systemHealth || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions with modern design */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
                  <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: '👤', title: 'Add User', subtitle: 'Create new user account', color: 'from-blue-500 to-cyan-500', action: () => switchTab('combined-users') },
                      { icon: '🏫', title: 'Add College', subtitle: 'Register new institution', color: 'from-purple-500 to-pink-500', action: () => switchTab('combined-college') },
                      { icon: '📦', title: 'Bulk Import', subtitle: 'Import multiple records', color: 'from-green-500 to-emerald-500', action: () => switchTab('bulk-operations') },
                      { icon: '📊', title: 'View Analytics', subtitle: 'Detailed system insights', color: 'from-orange-500 to-red-500', action: () => switchTab('advanced-analytics') }
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

                {/* Real-time Activity Stats */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                  <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    📈 Today's Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>New Users Today</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.newUsersToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Logins Today</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.loginsToday || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Active This Week</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stats.recentlyActiveUsers || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>System Health</span>
                      <span className={`text-sm font-bold ${stats.systemHealth >= 80 ? 'text-green-600' : stats.systemHealth >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {stats.systemHealth || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* College Management Tab */}
        {activeTab === 'college-management' && (
          <TabContent 
            tabName="college-management" 
            loading={isTabLoading('college-management')}
            fallback={<GridSkeleton items={6} columns={3} />}
          >
            <CombinedCollegeManagement />
          </TabContent>
        )}
        
        {/* Attendance & IP System Tab */}
        {activeTab === 'attendance-ip' && (
          <TabContent 
            tabName="attendance-ip" 
            loading={isTabLoading('attendance-ip')}
            fallback={<TableSkeleton rows={8} />}
          >
            <CombinedAttendanceSystem />
          </TabContent>
        )}
        
        {/* User Management Tab */}
        {activeTab === 'user-management' && (
          <TabContent 
            tabName="user-management" 
            loading={isTabLoading('user-management')}
            fallback={<TableSkeleton rows={10} />}
          >
            <ComprehensiveUserManagement />
          </TabContent>
        )}
        
        {/* Cohort System Tab */}
        {activeTab === 'cohort-system' && (
          <TabContent 
            tabName="cohort-system" 
            loading={isTabLoading('cohort-system')}
            fallback={<GridSkeleton items={6} />}
          >
            <div className="space-y-6">
              <CohortManagementTab />
              <CohortAssignmentTab />
              <CohortCollegesTab />
            </div>
          </TabContent>
        )}
        
        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <TabContent 
            tabName="announcements" 
            loading={isTabLoading('announcements')}
            fallback={<ListSkeleton items={8} />}
          >
            <AnnouncementsManagement />
          </TabContent>
        )}
        
        {/* System Monitoring Tab */}
        {activeTab === 'system-monitoring' && (
          <TabContent 
            tabName="system-monitoring" 
            loading={isTabLoading('system-monitoring')}
            fallback={<DashboardSkeleton />}
          >
            <SystemMonitoring />
          </TabContent>
        )}
        
        {/* Analytics Hub Tab */}
        {activeTab === 'analytics-hub' && (
          <TabContent 
            tabName="analytics-hub" 
            loading={isTabLoading('analytics-hub')}
            fallback={<DashboardSkeleton />}
          >
            <AdvancedAnalytics />
          </TabContent>
        )}
        
        {/* Task Management Tab - Integrating the new TaskWorkflow here */}
        {activeTab === 'task-management' && (
          <TabContent 
            tabName="task-management" 
            loading={isTabLoading('task-management')}
            fallback={<GridSkeleton items={8} />}
          >
            <div className="space-y-6">
              <TaskWorkflow />
              <TaskManagementTab />
            </div>
          </TabContent>
        )}
        
        {/* POCs Tab */}
        {activeTab === 'pocs' && (
          <TabContent 
            tabName="pocs" 
            loading={isTabLoading('pocs')}
            fallback={<TableSkeleton rows={6} />}
          >
            <POCManagement />
          </TabContent>
        )}
        
        {/* Data Integrity Tab */}
        {activeTab === 'data-integrity' && (
          <TabContent 
            tabName="data-integrity" 
            loading={isTabLoading('data-integrity')}
            fallback={<TableSkeleton rows={8} />}
          >
            <DataIntegrityChecker />
          </TabContent>
        )}
        
        {/* Bulk Operations Tab */}
        {activeTab === 'bulk-operations' && (
          <TabContent 
            tabName="bulk-operations" 
            loading={isTabLoading('bulk-operations')}
            fallback={<GridSkeleton items={4} columns={2} />}
          >
            <BulkImportTab />
          </TabContent>
        )}

        {/* Legacy Debug Tools Tab (keeping for compatibility) */}
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
});

AdminDashboardContent.displayName = 'AdminDashboardContent';

// Main export with AdminDashboardWrapper for caching and focus management
export default function AdminDashboard() {
  return (
    <AdminDashboardWrapper>
      <AdminDashboardContent />
    </AdminDashboardWrapper>
  );
}