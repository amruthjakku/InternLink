'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { useUserSync } from '../../hooks/useUserSync';
import { CollegeBadge } from '../CollegeLogo';

export function EnhancedUserManagement() {
  const { user } = useAuth();
  const {
    syncStatus,
    syncUserUpdate,
    syncUserActivation,
    syncCohortAssignment,
    syncBulkUpdate,
    applyOptimisticUpdatesToUsers,
    startAutoRefresh
  } = useUserSync();
  
  const [users, setUsers] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [filterRole, setFilterRole] = useState('all');
  const [filterCohort, setFilterCohort] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [selectedCohortForAssignment, setSelectedCohortForAssignment] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [processingBulkAction, setProcessingBulkAction] = useState(false);
  const [creatingCohort, setCreatingCohort] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Start auto-refresh for sync status
    const stopAutoRefresh = startAutoRefresh(30000); // Every 30 seconds
    
    return stopAutoRefresh;
  }, [startAutoRefresh]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, cohortsRes, collegesRes] = await Promise.all([
        fetch('/api/admin/users/enhanced?includeInactive=true'),
        fetch('/api/admin/cohorts'),
        fetch('/api/admin/colleges')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        
        // Update sync status if available
        if (usersData.syncStatus) {
          // The sync status will be automatically updated by the useUserSync hook
        }
      }

      if (cohortsRes.ok) {
        const cohortsData = await cohortsRes.json();
        console.log('Cohorts API response:', cohortsData);
        setCohorts(cohortsData.cohorts || []);
        console.log('Set cohorts state:', cohortsData.cohorts || []);
      } else {
        console.error('Failed to fetch cohorts:', cohortsRes.status, cohortsRes.statusText);
        const errorData = await cohortsRes.json().catch(() => ({}));
        console.error('Cohorts API error:', errorData);
      }

      if (collegesRes.ok) {
        const collegesData = await collegesRes.json();
        setColleges(collegesData.colleges || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Apply optimistic updates to users before filtering
  const usersWithOptimisticUpdates = applyOptimisticUpdatesToUsers(users);
  
  const filteredUsers = usersWithOptimisticUpdates.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.gitlabUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    const matchesRole = filterRole === 'all' || user.role === filterRole;

    const matchesCohort = filterCohort === 'all' ||
      (filterCohort === 'none' && !user.cohortId) ||
      (user.cohortId && (
        // Handle both string cohortId and populated cohortId object
        (typeof user.cohortId === 'string' && user.cohortId === filterCohort) ||
        (typeof user.cohortId === 'object' && user.cohortId._id === filterCohort)
      ));

    return matchesSearch && matchesStatus && matchesRole && matchesCohort;
  });

  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  const createDefaultCohort = async () => {
    setCreatingCohort(true);
    try {
      const response = await fetch('/api/admin/setup-cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message);
        
        // Refresh data to show the new cohort
        await fetchData();
        
        // Auto-assign interns to the new cohort
        const assignResponse = await fetch('/api/admin/quick-assign-cohorts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (assignResponse.ok) {
          const assignResult = await assignResponse.json();
          setSuccessMessage(`${result.message}. ${assignResult.message}`);
        }
      } else {
        const error = await response.json();
        setErrorMessage(error.error || 'Failed to create default cohort');
      }
    } catch (error) {
      console.error('Error creating default cohort:', error);
      setErrorMessage('Failed to create default cohort');
    } finally {
      setCreatingCohort(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedUsers.length === 0) {
      setErrorMessage('Please select users and an action');
      return;
    }

    setProcessingBulkAction(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let updateData = {};

      // Prepare update data based on action type
      switch (bulkActionType) {
        case 'activate':
          updateData = { isActive: true };
          break;
        case 'deactivate':
          updateData = { isActive: false };
          if (actionReason) updateData.deactivationReason = actionReason;
          break;
        case 'assign_cohort':
          if (!selectedCohortForAssignment) {
            setErrorMessage('Please select a cohort for assignment');
            setProcessingBulkAction(false);
            return;
          }
          updateData = { cohortId: selectedCohortForAssignment };
          break;
        case 'remove_cohort':
          updateData = { cohortId: null };
          break;
        case 'change_role':
          // This would need additional UI for role selection
          setErrorMessage('Role change not implemented in bulk actions yet');
          setProcessingBulkAction(false);
          return;
        default:
          setErrorMessage('Unknown bulk action type');
          setProcessingBulkAction(false);
          return;
      }

      // Determine API action
      let apiAction;
      switch (bulkActionType) {
        case 'activate':
          apiAction = 'bulk_reactivate';
          break;
        case 'deactivate':
          apiAction = 'bulk_deactivate';
          break;
        case 'assign_cohort':
          apiAction = 'bulk_assign_cohort';
          break;
        case 'remove_cohort':
          apiAction = 'bulk_remove_cohort';
          break;
        default:
          apiAction = 'bulk_update';
      }

      // Make API call
      const response = await fetch('/api/admin/users/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: apiAction,
          userIds: selectedUsers,
          data: updateData
        })
      });

      const result = await response.json();

      if (response.ok) {
        const { successful, failed, skipped } = result.result;
        setSuccessMessage(
          `Bulk action completed: ${successful.length} successful, ` +
          `${failed.length} failed, ${skipped.length} skipped`
        );
        
        if (failed.length > 0) {
          const failedUsers = failed.map(f => f.error).slice(0, 3).join('; ');
          setErrorMessage(`Some operations failed: ${failedUsers}${failed.length > 3 ? '...' : ''}`);
        }
        
        // Refresh data
        await fetchData();
        
        // Clear selections
        setSelectedUsers([]);
        setShowBulkActions(false);
        setBulkActionType('');
        setSelectedCohortForAssignment('');
        setActionReason('');
      } else {
        setErrorMessage(result.error || 'Bulk action failed');
      }

    } catch (error) {
      console.error('Bulk action error:', error);
      setErrorMessage(`Failed to perform bulk action: ${error.message}`);
    } finally {
      setProcessingBulkAction(false);
    }
  };

  const handleUserAction = async (userId, action, data = {}) => {
    try {
      setErrorMessage('');
      setSuccessMessage('');

      let apiAction;
      let requestData = { ...data };

      if (action === 'reactivate') {
        apiAction = 'reactivate_user';
      } else if (action === 'deactivate') {
        apiAction = 'deactivate_user';
      } else if (action === 'update') {
        apiAction = 'update_user';
      }

      const response = await fetch('/api/admin/users/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: apiAction,
          userId,
          data: requestData
        })
      });

      const result = await response.json();

      if (response.ok) {
        if (result.result.skipped) {
          setSuccessMessage(result.result.message);
        } else {
          setSuccessMessage(`User ${action} completed successfully`);
        }
        
        // Refresh data to show changes
        await fetchData();
      } else {
        setErrorMessage(result.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      setErrorMessage(`Failed to ${action} user: ${error.message}`);
    }
  };

  const openEditModal = (user) => {
    setEditingUser({
      ...user,
      college: user.college?.name || '',
      cohortId: user.cohortId?._id || ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    try {
      await handleUserAction(editingUser._id, 'update', {
        name: editingUser.name,
        email: editingUser.email,
        gitlabUsername: editingUser.gitlabUsername,
        role: editingUser.role,
        college: editingUser.college,
        cohortId: editingUser.cohortId || null,
        isActive: editingUser.isActive
      });
      
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Enhanced User Management</h2>
          
          {/* Sync Status Indicator */}
          <div className="flex items-center space-x-2">
            {syncStatus.isLoading && (
              <div className="flex items-center space-x-1 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs">Syncing...</span>
              </div>
            )}
            
            {syncStatus.queueSize > 0 && (
              <div className="flex items-center space-x-1 text-orange-600">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">{syncStatus.queueSize} pending</span>
              </div>
            )}
            
            {syncStatus.lastSync && (
              <div className="text-xs text-gray-500">
                Last sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredUsers.length} users ({selectedUsers.length} selected)
          </span>
          {selectedUsers.length > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Bulk Actions
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage('')}
                className="text-green-400 hover:text-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setErrorMessage('')}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-4">
            Bulk Actions ({selectedUsers.length} users selected)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={bulkActionType}
                onChange={(e) => setBulkActionType(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select action...</option>
                <option value="activate">Activate Users</option>
                <option value="deactivate">Deactivate Users</option>
                <option value="assign_cohort">Assign to Cohort</option>
                <option value="remove_cohort">Remove from Cohort</option>
                <option value="change_role">Change Role</option>
              </select>
            </div>

            {bulkActionType === 'assign_cohort' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cohort</label>
                <select
                  value={selectedCohortForAssignment}
                  onChange={(e) => setSelectedCohortForAssignment(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select cohort...</option>
                  {cohorts.map(cohort => (
                    <option key={cohort._id} value={cohort._id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
              <input
                type="text"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Reason for action..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-3">
            <button
              onClick={handleBulkAction}
              disabled={!bulkActionType || processingBulkAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingBulkAction ? 'Processing...' : 'Apply Action'}
            </button>
            <button
              onClick={() => {
                setShowBulkActions(false);
                setBulkActionType('');
                setSelectedCohortForAssignment('');
                setActionReason('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No Cohorts Warning */}
      {cohorts.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">No Cohorts Available</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need to create at least one cohort to assign interns. Interns without cohort assignments cannot see cohort-based tasks.
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={createDefaultCohort}
                disabled={creatingCohort}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {creatingCohort ? 'Creating...' : 'Create Default Cohort'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unassigned Interns Warning */}
      {cohorts.length > 0 && filteredUsers.filter(u => u.role === 'intern' && !u.cohortId).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">Interns Without Cohorts</h3>
              <p className="mt-1 text-sm text-blue-700">
                {filteredUsers.filter(u => u.role === 'intern' && !u.cohortId).length} interns are not assigned to any cohort and cannot see cohort-based tasks.
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/quick-assign-cohorts', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (response.ok) {
                      const result = await response.json();
                      setSuccessMessage(result.message);
                      await fetchData();
                    } else {
                      const error = await response.json();
                      setErrorMessage(error.error || 'Failed to assign cohorts');
                    }
                  } catch (error) {
                    setErrorMessage('Failed to assign cohorts');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Auto-Assign to Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="super-mentor">Super Mentor</option>
            <option value="mentor">Mentor</option>
            <option value="intern">Intern</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cohort</label>
          <select
            value={filterCohort}
            onChange={(e) => setFilterCohort(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Cohorts</option>
            <option value="none">No Cohort</option>
            {cohorts.map(cohort => (
              <option key={cohort._id} value={cohort._id}>
                {cohort.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterStatus('all');
              setFilterRole('all');
              setFilterCohort('all');
            }}
            className="w-full px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-600">Select All</label>
            </div>
          </div>
        </div>

        <ul className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <li key={user._id} className="px-4 py-4 hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user._id)}
                  onChange={() => handleUserSelection(user._id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{user.gitlabUsername} • {user.email}
                      </p>
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                        <span className={`px-2 py-1 rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {user.role}
                        </span>
                        {user.cohortId && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            {user.cohortId.name}
                          </span>
                        )}
                        {user.college && (
                          <CollegeBadge college={user.college} />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      
                      {user.isActive ? (
                        <button
                          onClick={() => handleUserAction(user._id, 'deactivate', { reason: 'Admin action' })}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user._id, 'reactivate', { reason: 'Admin action' })}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Additional info for inactive users */}
                  {!user.isActive && (user.deactivatedAt || user.deactivationReason) && (
                    <div className="mt-2 p-2 bg-red-50 rounded-md">
                      <p className="text-xs text-red-600">
                        Deactivated: {user.deactivatedAt ? new Date(user.deactivatedAt).toLocaleDateString() : 'Unknown'}
                        {user.deactivationReason && ` - ${user.deactivationReason}`}
                        {user.deactivatedBy && ` by ${user.deactivatedBy}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found matching the current filters.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitLab Username</label>
                  <input
                    type="text"
                    value={editingUser.gitlabUsername}
                    onChange={(e) => setEditingUser({...editingUser, gitlabUsername: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="intern">Intern</option>
                    <option value="mentor">Mentor</option>
                    <option value="super-mentor">Super Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
                  <select
                    value={editingUser.college}
                    onChange={(e) => setEditingUser({...editingUser, college: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select college...</option>
                    {colleges.map(college => (
                      <option key={college._id} value={college.name}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cohort</label>
                  <select
                    value={editingUser.cohortId}
                    onChange={(e) => setEditingUser({...editingUser, cohortId: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No cohort</option>
                    {cohorts.length === 0 && (
                      <option disabled>No cohorts available</option>
                    )}
                    {cohorts.map(cohort => {
                      console.log('Rendering cohort option:', cohort);
                      return (
                        <option key={cohort._id} value={cohort._id}>
                          {cohort.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="mt-6 flex items-center space-x-3">
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
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