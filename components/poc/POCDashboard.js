import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTabData, useDashboardData } from '../../hooks/useTabData';
import { cachedFetch, CacheKeys, CacheTTL, invalidateCollegeCache, invalidateAnnouncementCache } from '../../utils/cache';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  StarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import EnhancedChat from '../EnhancedChat';

const POCDashboard = () => {
  const { data: session } = useSession();
  const [error, setError] = useState(null);

  // Initialize dashboard data management with caching
  const { globalData, globalLoading, dataFetchers } = useDashboardData(
    session?.user?.gitlabUsername || session?.user?.email, 
    'POC'
  );

  // Tab-specific data fetchers with caching
  const tabDataFetchers = useMemo(() => ({
    overview: () => cachedFetch('/api/poc/college-overview', {}, CacheKeys.POC_COLLEGE_DATA(session?.user?.gitlabUsername), CacheTTL.LONG),
    announcements: () => cachedFetch('/api/poc/announcements', {}, CacheKeys.POC_ANNOUNCEMENTS(session?.user?.gitlabUsername), CacheTTL.ANNOUNCEMENTS),
    chatRooms: () => cachedFetch('/api/chat-rooms', {}, CacheKeys.USER_CHAT_ROOMS(session?.user?.gitlabUsername), CacheTTL.CHAT_ROOMS),
    users: () => cachedFetch('/api/poc/users', {}, CacheKeys.COLLEGE_USERS(session?.user?.college), CacheTTL.MEDIUM),
    attendance: () => cachedFetch('/api/poc/attendance', {}, CacheKeys.COLLEGE_STATS(session?.user?.college), CacheTTL.MEDIUM),
    tasks: () => cachedFetch('/api/tasks?college=true', {}, CacheKeys.COLLEGE_TASKS(session?.user?.college), CacheTTL.SHORT),
    teams: () => cachedFetch('/api/poc/teams', {}, CacheKeys.COLLEGE_TEAMS(session?.user?.college), CacheTTL.MEDIUM),
    performance: () => cachedFetch('/api/poc/performance', {}, CacheKeys.COLLEGE_PERFORMANCE(session?.user?.college), CacheTTL.MEDIUM),
  }), [session?.user?.gitlabUsername, session?.user?.college]);

  // Use tab data management with smart loading
  const {
    activeTab,
    switchTab,
    tabData,
    loading: tabLoading,
    errors: tabErrors,
    getData,
    isLoading,
    refresh: refreshCurrentTab,
    refreshData,
    preloadTab
  } = useTabData('overview', tabDataFetchers, {
    autoLoad: true,
    refreshOnTabSwitch: false, // Don't refresh on tab switch
    cacheTimeout: CacheTTL.MEDIUM
  });

  // Get cached data with fallbacks
  const collegeData = getData('overview') || {
    college: {
      name: 'Your College',
      location: 'Location not set',
      email: 'email@college.edu',
      established: '2020',
      website: 'https://college.edu'
    },
    stats: {
      totalTechLeads: 0,
      totalAIDeveloperInterns: 0,
      assignedAIDeveloperInterns: 0,
      unassignedAIDeveloperInterns: 0
    },
    mentors: [],
    interns: []
  };
  const announcements = getData('announcements')?.announcements || [];
  const chatRooms = getData('chatRooms')?.chatRooms || [];
  const users = getData('users')?.users || [];
  const attendance = getData('attendance') || [];
  const tasks = getData('tasks')?.tasks || [];
  const teams = getData('teams')?.teams || [];
  const performanceData = getData('performance') || { metrics: [], trends: [] };

  // Loading states
  const loading = isLoading('overview');
  const refreshing = false; // Managed by cache system

  // Refresh functions using cache
  const refreshAllData = useCallback(async () => {
    try {
      setError(null);
      await refreshCurrentTab();
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('Failed to refresh dashboard data. Please try again.');
    }
  }, [refreshCurrentTab]);

  // Create announcement with cache invalidation
  const createAnnouncement = useCallback(async (announcementData) => {
    try {
      const response = await fetch('/api/poc/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementData)
      });

      if (response.ok) {
        // Invalidate announcements cache
        invalidateAnnouncementCache();
        // Refresh announcements data
        await refreshData('announcements');
        return await response.json();
      } else {
        throw new Error('Failed to create announcement');
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }, [refreshData]);

  // Preload next tabs for better UX
  const preloadNextTabs = useCallback(() => {
    const tabIds = ['overview', 'announcements', 'chatRooms'];
    const currentIndex = tabIds.indexOf(activeTab);
    const nextTabs = [
      tabIds[currentIndex + 1],
      tabIds[currentIndex - 1]
    ].filter(Boolean);
    
    nextTabs.forEach(tab => {
      if (tab && tabDataFetchers[tab]) {
        preloadTab(tab);
      }
    });
  }, [activeTab, tabDataFetchers, preloadTab]);

  // Preload adjacent tabs when switching
  useEffect(() => {
    const timer = setTimeout(preloadNextTabs, 1000);
    return () => clearTimeout(timer);
  }, [activeTab, preloadNextTabs]);

  // Legacy function references for backward compatibility
  const fetchAllData = refreshAllData;
  const fetchTasks = useCallback(() => refreshData('tasks'), [refreshData]);
  const fetchAnnouncements = useCallback(() => refreshData('announcements'), [refreshData]);
  const fetchCollegeData = useCallback(() => refreshData('overview'), [refreshData]);

  const tabs = [
    { id: 'overview', name: 'College Overview', icon: AcademicCapIcon },
    { id: 'intern-management', name: 'Intern Management', icon: UserGroupIcon },
    { id: 'tech-lead-management', name: 'Tech Lead Management', icon: UserGroupIcon },
    { id: 'task-oversight', name: 'Task Oversight', icon: ClipboardDocumentListIcon },
    { id: 'attendance', name: 'Attendance Monitoring', icon: CalendarDaysIcon },
    { id: 'performance', name: 'Performance Analytics', icon: ChartBarIcon },
    { id: 'communication', name: 'Communication', icon: ChatBubbleLeftRightIcon },
    { id: 'settings', name: 'College Settings', icon: CogIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">POC Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {session?.user?.name} - {collegeData?.college?.name || (typeof session?.user?.college === 'string' ? session?.user?.college : session?.user?.college?.name) || 'College'}
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-gray-500 mt-1">
                  Role: {session?.user?.role} | GitLab: {session?.user?.gitlabUsername}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshAllData}
                disabled={refreshing}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                POC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <CollegeOverviewTab collegeData={collegeData} />
        )}
        {activeTab === 'intern-management' && (
          <InternManagementTab collegeData={collegeData} fetchAllData={fetchAllData} />
        )}
        {activeTab === 'tech-lead-management' && (
          <TechLeadManagementTab collegeData={collegeData} teams={teams} fetchAllData={fetchAllData} />
        )}
        {activeTab === 'task-oversight' && (
          <TaskOversightTab collegeData={collegeData} tasks={tasks} fetchTasks={fetchTasks} />
        )}
        {activeTab === 'attendance' && (
          <AttendanceMonitoringTab collegeData={collegeData} attendance={attendance} />
        )}
        {activeTab === 'performance' && (
          <PerformanceAnalyticsTab collegeData={collegeData} performanceData={performanceData} />
        )}
        {activeTab === 'communication' && (
          <CommunicationTab collegeData={collegeData} announcements={announcements} fetchAnnouncements={fetchAnnouncements} />
        )}
        {activeTab === 'settings' && (
          <CollegeSettingsTab collegeData={collegeData} fetchCollegeData={fetchCollegeData} />
        )}
      </div>
    </div>
  );
};

const CollegeOverviewTab = ({ collegeData }) => {
  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading college overview...</div>;
  }

  const { 
    college = {
      name: 'Your College',
      location: 'Location not set',
      email: 'email@college.edu',
      established: '2020',
      website: 'https://college.edu'
    }, 
    stats = {
      totalTechLeads: 0,
      totalAIDeveloperInterns: 0,
      assignedAIDeveloperInterns: 0,
      unassignedAIDeveloperInterns: 0
    }, 
    mentors = [], 
    interns = [] 
  } = collegeData;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">👨‍💼</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tech Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTechLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total AI Developer Interns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAIDeveloperInterns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned AI Developer Interns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedAIDeveloperInterns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unassigned AI Developer Interns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unassignedAIDeveloperInterns}</p>
            </div>
          </div>
        </div>
      </div>

      {/* College Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">College Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">College Name</p>
            <p className="text-lg text-gray-900">{college.name || 'Your College'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Location</p>
            <p className="text-lg text-gray-900">{college.location || 'Location not set'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Contact Email</p>
            <p className="text-lg text-gray-900">{college.email || 'email@college.edu'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Established</p>
            <p className="text-lg text-gray-900">{college.createdAt ? new Date(college.createdAt).getFullYear() : college.established || '2020'}</p>
          </div>
        </div>
      </div>

      {/* Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tech Leads</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {mentors.map((mentor) => (
              <div key={mentor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{mentor.name}</p>
                  <p className="text-sm text-gray-600">{mentor.gitlabUsername}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  mentor.role === 'POC' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {mentor.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Developer Interns</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {interns.slice(0, 10).map((intern) => (
              <div key={intern._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{intern.name}</p>
                  <p className="text-sm text-gray-600">{intern.gitlabUsername}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  intern.mentorId 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {intern.mentorId ? 'Assigned' : 'Unassigned'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Intern Management Tab
const InternManagementTab = ({ collegeData, fetchAllData }) => {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechLead, setSelectedTechLead] = useState('');
  const [showAddIntern, setShowAddIntern] = useState(false);
  const [showImportInterns, setShowImportInterns] = useState(false);
  const [newIntern, setNewIntern] = useState({
    name: '',
    email: '',
    gitlabUsername: '',
    phone: '',
    college: '',
    skills: '',
    cohortId: ''
  });
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);

  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading intern data...</div>;
  }

  const { interns = [], mentors = [] } = collegeData;
  const assignedInterns = interns.filter(intern => intern.assignedTechLead);
  const unassignedInterns = interns.filter(intern => !intern.assignedTechLead);

  const handleAssignIntern = async () => {
    if (!selectedIntern || !selectedTechLead) return;

    try {
      const response = await fetch('/api/poc/assign-intern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internId: selectedIntern._id,
          techLeadId: selectedTechLead
        })
      });

      if (response.ok) {
        alert('Intern assigned successfully!');
        setShowAssignModal(false);
        setSelectedIntern(null);
        setSelectedTechLead('');
        fetchAllData();
      } else {
        const error = await response.json();
        alert(`Failed to assign intern: ${error.message}`);
      }
    } catch (error) {
      console.error('Error assigning intern:', error);
      alert('Failed to assign intern');
    }
  };

  const handleAddIntern = async () => {
    if (!newIntern.name || !newIntern.email || !newIntern.gitlabUsername) {
      alert('Please fill in all required fields (Name, Email, GitLab Username)');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/poc/interns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newIntern,
          college: collegeData?.college?._id,
          role: 'AI Developer Intern',
          skills: newIntern.skills.split(',').map(s => s.trim()).filter(Boolean)
        }),
      });

      if (response.ok) {
        alert('✅ AI Developer Intern added successfully!');
        setShowAddIntern(false);
        setNewIntern({
          name: '',
          email: '',
          gitlabUsername: '',
          phone: '',
          college: '',
          skills: '',
          cohortId: ''
        });
        await fetchAllData();
      } else {
        const error = await response.json();
        alert(`❌ Failed to add intern: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding intern:', error);
      alert('❌ Failed to add intern. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleImportInterns = async () => {
    if (!importFile) {
      alert('Please select a CSV file to import');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('college', collegeData?.college?._id);
    formData.append('role', 'AI Developer Intern');

    try {
      const response = await fetch('/api/poc/import-users', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Successfully imported ${result.imported} AI Developer Interns! ${result.skipped > 0 ? `(${result.skipped} duplicates skipped)` : ''}`);
        setShowImportInterns(false);
        setImportFile(null);
        await fetchAllData();
      } else {
        const error = await response.json();
        alert(`❌ Import failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error importing interns:', error);
      alert('❌ Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Intern Management</h3>
          <p className="text-gray-600">Manage AI Developer Interns from your college</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              {assignedInterns.length} Assigned
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              {unassignedInterns.length} Unassigned
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImportInterns(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Import Interns</span>
            </button>
            <button
              onClick={() => setShowAddIntern(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Intern</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Interns</p>
              <p className="text-2xl font-bold text-gray-900">{interns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{assignedInterns.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-gray-900">{unassignedInterns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Unassigned Interns */}
      {unassignedInterns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Unassigned Interns</h4>
            <p className="text-sm text-gray-600">These interns need to be assigned to Tech Leads</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedInterns.map((intern) => (
                <div key={intern._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{intern.name}</h5>
                      <p className="text-sm text-gray-600">{intern.email}</p>
                      <p className="text-xs text-gray-500">@{intern.gitlabUsername}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Unassigned
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIntern(intern);
                      setShowAssignModal(true);
                    }}
                    className="w-full bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Assign to Tech Lead
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assigned Interns */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Assigned Interns</h4>
          <p className="text-sm text-gray-600">Interns currently assigned to Tech Leads</p>
        </div>
        <div className="p-6">
          {assignedInterns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedInterns.map((intern) => (
                <div key={intern._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{intern.name}</h5>
                      <p className="text-sm text-gray-600">{intern.email}</p>
                      <p className="text-xs text-gray-500">@{intern.gitlabUsername}</p>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Assigned
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Tech Lead:</strong> {intern.assignedTechLeadName || 'Loading...'}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIntern(intern);
                      setShowAssignModal(true);
                    }}
                    className="w-full bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded hover:bg-gray-200 transition-colors"
                  >
                    Reassign
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No assigned interns yet.
            </div>
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Assign {selectedIntern?.name} to Tech Lead
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Tech Lead
                </label>
                <select
                  value={selectedTechLead}
                  onChange={(e) => setSelectedTechLead(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a Tech Lead...</option>
                  {mentors.filter(m => m.role === 'TechLead').map((mentor) => (
                    <option key={mentor._id} value={mentor._id}>
                      {mentor.name} (@{mentor.gitlabUsername})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedIntern(null);
                    setSelectedTechLead('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignIntern}
                  disabled={!selectedTechLead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Intern Modal */}
      {showAddIntern && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New AI Developer Intern</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newIntern.name}
                  onChange={(e) => setNewIntern({...newIntern, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newIntern.email}
                  onChange={(e) => setNewIntern({...newIntern, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitLab Username *</label>
                <input
                  type="text"
                  value={newIntern.gitlabUsername}
                  onChange={(e) => setNewIntern({...newIntern, gitlabUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GitLab username..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newIntern.phone}
                  onChange={(e) => setNewIntern({...newIntern, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <input
                  type="text"
                  value={newIntern.skills}
                  onChange={(e) => setNewIntern({...newIntern, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter skills (comma-separated)..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cohort ID</label>
                <input
                  type="text"
                  value={newIntern.cohortId}
                  onChange={(e) => setNewIntern({...newIntern, cohortId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter cohort ID..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddIntern(false);
                  setNewIntern({
                    name: '',
                    email: '',
                    gitlabUsername: '',
                    phone: '',
                    college: '',
                    skills: '',
                    cohortId: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntern}
                disabled={adding}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add Intern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Interns Modal */}
      {showImportInterns && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Import AI Developer Interns</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSV should contain: name, email, gitlabUsername, phone, skills, cohortId
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-1">CSV Format Example:</h4>
                <code className="text-xs text-blue-800 block">
                  name,email,gitlabUsername,phone,skills,cohortId<br/>
                  Jane Doe,jane@example.com,janedoe,+1234567890,"Python,React","COHORT-2024-01"
                </code>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowImportInterns(false);
                  setImportFile(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportInterns}
                disabled={importing || !importFile}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Interns'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tech Lead Management Tab
const TechLeadManagementTab = ({ collegeData, teams, fetchAllData }) => {
  const [selectedTechLead, setSelectedTechLead] = useState(null);
  const [showTechLeadDetails, setShowTechLeadDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddTechLead, setShowAddTechLead] = useState(false);
  const [showImportTechLeads, setShowImportTechLeads] = useState(false);
  const [newTechLead, setNewTechLead] = useState({
    name: '',
    email: '',
    gitlabUsername: '',
    phone: '',
    skills: '',
    experience: ''
  });
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);

  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading tech lead data...</div>;
  }

  const { mentors = [], interns = [] } = collegeData;
  const techLeads = mentors.filter(m => m.role === 'Tech Lead');

  // Filter tech leads
  const filteredTechLeads = techLeads.filter(techLead => {
    const matchesSearch = techLead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         techLead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         techLead.gitlabUsername.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && techLead.isActive) ||
                         (filterStatus === 'inactive' && !techLead.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleTechLeadClick = (techLead) => {
    setSelectedTechLead(techLead);
    setShowTechLeadDetails(true);
  };

  const handleAddTechLead = async () => {
    if (!newTechLead.name || !newTechLead.email || !newTechLead.gitlabUsername) {
      alert('Please fill in all required fields (Name, Email, GitLab Username)');
      return;
    }

    setAdding(true);
    try {
      const response = await fetch('/api/poc/tech-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTechLead,
          college: collegeData?.college?._id,
          role: 'Tech Lead',
          skills: newTechLead.skills.split(',').map(s => s.trim()).filter(Boolean)
        }),
      });

      if (response.ok) {
        alert('✅ Tech Lead added successfully!');
        setShowAddTechLead(false);
        setNewTechLead({
          name: '',
          email: '',
          gitlabUsername: '',
          phone: '',
          skills: '',
          experience: ''
        });
        await fetchAllData();
      } else {
        const error = await response.json();
        alert(`❌ Failed to add Tech Lead: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding tech lead:', error);
      alert('❌ Failed to add Tech Lead. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleImportTechLeads = async () => {
    if (!importFile) {
      alert('Please select a CSV file to import');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('college', collegeData?.college?._id);
    formData.append('role', 'Tech Lead');

    try {
      const response = await fetch('/api/poc/import-users', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Successfully imported ${result.imported} Tech Leads! ${result.skipped > 0 ? `(${result.skipped} duplicates skipped)` : ''}`);
        setShowImportTechLeads(false);
        setImportFile(null);
        await fetchAllData();
      } else {
        const error = await response.json();
        alert(`❌ Import failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error importing tech leads:', error);
      alert('❌ Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tech Lead Management</h3>
          <p className="text-gray-600">Monitor and manage Tech Leads from your college</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowImportTechLeads(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Import Tech Leads</span>
          </button>
          <button
            onClick={() => setShowAddTechLead(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Tech Lead</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tech Leads</p>
              <p className="text-2xl font-bold text-gray-900">{techLeads.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {techLeads.filter(tl => tl.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">With Interns</p>
              <p className="text-2xl font-bold text-gray-900">
                {techLeads.filter(tl => interns.some(intern => intern.mentorId === tl._id)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Interns Managed</p>
              <p className="text-2xl font-bold text-gray-900">
                {interns.filter(intern => intern.mentorId).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tech leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredTechLeads.length} of {techLeads.length} tech leads
          </div>
        </div>
      </div>

      {/* Tech Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechLeads.map((techLead) => {
          const assignedInterns = interns.filter(intern => intern.mentorId === techLead._id);
          
          return (
            <div 
              key={techLead._id} 
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTechLeadClick(techLead)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{techLead.name}</h4>
                  <p className="text-sm text-gray-600">{techLead.email}</p>
                  <p className="text-xs text-gray-500">@{techLead.gitlabUsername}</p>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Tech Lead
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    techLead.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {techLead.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned Interns:</span>
                  <span className="font-medium text-gray-900">{assignedInterns.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Specialization:</span>
                  <span className="text-sm text-gray-900">{techLead.specialization || 'General'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Joined:</span>
                  <span className="text-sm text-gray-900">
                    {techLead.createdAt ? new Date(techLead.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              {assignedInterns.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Recent Interns:</h5>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {assignedInterns.slice(0, 3).map((intern) => (
                      <div key={intern._id} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                        <span>{intern.name}</span>
                        <span className="text-gray-500">@{intern.gitlabUsername}</span>
                      </div>
                    ))}
                    {assignedInterns.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{assignedInterns.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Click to view details</span>
                  <EyeIcon className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTechLeads.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {techLeads.length === 0 
            ? "No tech leads found in your college."
            : "No tech leads match your current filters."
          }
        </div>
      )}

      {/* Tech Lead Details Modal */}
      {showTechLeadDetails && selectedTechLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Tech Lead Details</h3>
              <button
                onClick={() => setShowTechLeadDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tech Lead Info */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedTechLead.name}</h4>
                  <p className="text-gray-600">{selectedTechLead.email}</p>
                  <p className="text-sm text-gray-500">@{selectedTechLead.gitlabUsername}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Role</h5>
                    <p className="text-gray-600">{selectedTechLead.role}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Status</h5>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedTechLead.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTechLead.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Specialization</h5>
                    <p className="text-gray-600">{selectedTechLead.specialization || 'General'}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Joined</h5>
                    <p className="text-gray-600">
                      {selectedTechLead.createdAt ? new Date(selectedTechLead.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned Interns */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">
                  Assigned Interns ({interns.filter(intern => intern.mentorId === selectedTechLead._id).length})
                </h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {interns.filter(intern => intern.mentorId === selectedTechLead._id).map((intern) => (
                    <div key={intern._id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{intern.name}</p>
                          <p className="text-sm text-gray-600">{intern.email}</p>
                          <p className="text-xs text-gray-500">@{intern.gitlabUsername}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          AI Developer Intern
                        </span>
                      </div>
                    </div>
                  ))}
                  {interns.filter(intern => intern.mentorId === selectedTechLead._id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No interns assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tech Lead Modal */}
      {showAddTechLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Tech Lead</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newTechLead.name}
                  onChange={(e) => setNewTechLead({...newTechLead, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={newTechLead.email}
                  onChange={(e) => setNewTechLead({...newTechLead, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GitLab Username *</label>
                <input
                  type="text"
                  value={newTechLead.gitlabUsername}
                  onChange={(e) => setNewTechLead({...newTechLead, gitlabUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter GitLab username..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newTechLead.phone}
                  onChange={(e) => setNewTechLead({...newTechLead, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter phone number..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <input
                  type="text"
                  value={newTechLead.skills}
                  onChange={(e) => setNewTechLead({...newTechLead, skills: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter skills (comma-separated)..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <textarea
                  value={newTechLead.experience}
                  onChange={(e) => setNewTechLead({...newTechLead, experience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter experience details..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddTechLead(false);
                  setNewTechLead({
                    name: '',
                    email: '',
                    gitlabUsername: '',
                    phone: '',
                    skills: '',
                    experience: ''
                  });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTechLead}
                disabled={adding}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add Tech Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Tech Leads Modal */}
      {showImportTechLeads && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Import Tech Leads</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  CSV should contain: name, email, gitlabUsername, phone, skills, experience
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-1">CSV Format Example:</h4>
                <code className="text-xs text-blue-800 block">
                  name,email,gitlabUsername,phone,skills,experience<br/>
                  John Doe,john@example.com,johndoe,+1234567890,"React,Node.js","5 years"
                </code>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowImportTechLeads(false);
                  setImportFile(null);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImportTechLeads}
                disabled={importing || !importFile}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Tech Leads'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Task Oversight Tab - Weekly Tasks Structure
const TaskOversightTab = ({ collegeData, tasks, fetchTasks }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'all'
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    estimatedHours: '',
    points: '',
    weekNumber: 1
  });

  // Helper function to organize tasks by week
  const organizeTasksByWeek = (tasks) => {
    const weeklyTasks = {};
    
    tasks.forEach(task => {
      let week = task.weekNumber;
      
      if (!week) {
        // Calculate week from due date or creation date
        const taskDate = new Date(task.dueDate || task.createdAt || task.startDate);
        const internshipStart = new Date();
        internshipStart.setDate(1);
        internshipStart.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.max(0, Math.ceil((taskDate - internshipStart) / (24 * 60 * 60 * 1000)));
        week = Math.max(1, Math.ceil((daysDiff + 1) / 7));
        week = Math.min(week, 12);
        
        task.weekNumber = week;
      }
      
      if (!weeklyTasks[week]) {
        weeklyTasks[week] = [];
      }
      weeklyTasks[week].push(task);
    });
    
    return weeklyTasks;
  };

  // Calculate weekly statistics
  const calculateWeeklyStats = (tasks) => {
    const weekStats = {};
    
    tasks.forEach(task => {
      const week = task.weekNumber || 1;
      
      if (!weekStats[week]) {
        weekStats[week] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          totalPoints: 0,
          completedPoints: 0
        };
      }
      
      weekStats[week].total++;
      weekStats[week].totalPoints += parseInt(task.points) || 0;
      
      if (task.status === 'completed' || task.status === 'done') {
        weekStats[week].completed++;
        weekStats[week].completedPoints += parseInt(task.points) || 0;
      } else if (task.status === 'in_progress') {
        weekStats[week].inProgress++;
      } else {
        weekStats[week].notStarted++;
      }
    });
    
    return weekStats;
  };

  const weeklyTasks = organizeTasksByWeek(tasks || []);
  const weeklyStats = calculateWeeklyStats(tasks || []);
  const availableWeeks = Object.keys(weeklyTasks).map(Number).sort((a, b) => a - b);
  
  // Filter tasks based on current view
  const getFilteredTasks = () => {
    let filteredTasks = tasks || [];
    
    if (viewMode === 'weekly') {
      filteredTasks = weeklyTasks[selectedWeek] || [];
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filterStatus);
    }
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }
    
    return filteredTasks;
  };

  const filteredTasks = getFilteredTasks();

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          createdBy: 'POC',
          college: collegeData?.college?._id,
          estimatedHours: newTask.estimatedHours ? parseInt(newTask.estimatedHours) : null,
          points: newTask.points ? parseInt(newTask.points) : null
        })
      });

      if (response.ok) {
        alert('Task created successfully!');
        setShowCreateTask(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: '',
          dueDate: '',
          estimatedHours: '',
          points: '',
          weekNumber: selectedWeek
        });
        fetchTasks();
      } else {
        const error = await response.json();
        alert(`Failed to create task: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Task Oversight</h3>
          <p className="text-gray-600">Create and monitor weekly tasks for your college</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'weekly' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly View
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Tasks
            </button>
          </div>
          <button
            onClick={() => setShowCreateTask(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Weekly Navigation */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Week Navigation</h4>
            <div className="text-sm text-gray-600">
              {availableWeeks.length > 0 ? `${availableWeeks.length} weeks with tasks` : 'No tasks yet'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(week => {
              const hasTask = availableWeeks.includes(week);
              const stats = weeklyStats[week];
              
              return (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedWeek === week
                      ? 'bg-blue-600 text-white'
                      : hasTask
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-center">
                    <div>Week {week}</div>
                    {stats && (
                      <div className="text-xs mt-1">
                        {stats.completed}/{stats.total}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly Stats */}
      {viewMode === 'weekly' && weeklyStats[selectedWeek] && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats[selectedWeek].total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats[selectedWeek].completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats[selectedWeek].inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <StarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Points</p>
                <p className="text-2xl font-bold text-gray-900">
                  {weeklyStats[selectedWeek].completedPoints}/{weeklyStats[selectedWeek].totalPoints}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTasks.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Recent Tasks</h4>
        </div>
        <div className="p-6">
          {filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.slice(0, 20).map((task) => (
                <div 
                  key={task._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{task.title}</h5>
                    <div className="flex items-center space-x-2">
                      {task.points && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                          {task.points} pts
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status?.replace('_', ' ') || 'not started'}
                      </span>
                      <EyeIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description || 'No description provided'}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Assigned to: {task.assignedToName || 'Unassigned'}</span>
                      {task.estimatedHours && (
                        <span>Est: {task.estimatedHours}h</span>
                      )}
                    </div>
                    <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {tasks.length === 0 
                ? "No tasks created yet. Create your first task to get started."
                : "No tasks match your current filters."
              }
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the task..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask({...newTask, estimatedHours: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 8"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                  <input
                    type="number"
                    value={newTask.points}
                    onChange={(e) => setNewTask({...newTask, points: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 10"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select assignee (optional)</option>
                  {collegeData?.interns?.map((intern) => (
                    <option key={intern._id} value={intern._id}>
                      {intern.name} (@{intern.gitlabUsername})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateTask(false);
                    setNewTask({
                      title: '',
                      description: '',
                      priority: 'medium',
                      assignedTo: '',
                      dueDate: '',
                      estimatedHours: '',
                      points: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Task Details</h3>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedTask.title}</h4>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedTask.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedTask.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedTask.priority} priority
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedTask.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    selectedTask.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedTask.status?.replace('_', ' ') || 'not started'}
                  </span>
                  {selectedTask.points && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                      {selectedTask.points} points
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                <p className="text-gray-600">{selectedTask.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Assigned To</h5>
                  <p className="text-gray-600">{selectedTask.assignedToName || 'Unassigned'}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Due Date</h5>
                  <p className="text-gray-600">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
              </div>

              {(selectedTask.estimatedHours || selectedTask.actualHours) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTask.estimatedHours && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Estimated Hours</h5>
                      <p className="text-gray-600">{selectedTask.estimatedHours}h</p>
                    </div>
                  )}
                  {selectedTask.actualHours && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">Actual Hours</h5>
                      <p className="text-gray-600">{selectedTask.actualHours}h</p>
                    </div>
                  )}
                </div>
              )}

              {selectedTask.progress !== undefined && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Progress</h5>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${selectedTask.progress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{selectedTask.progress || 0}% complete</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedTask.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {new Date(selectedTask.updatedAt || selectedTask.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// Attendance Monitoring Tab
const AttendanceMonitoringTab = ({ collegeData, attendance }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading attendance data...</div>;
  }

  const todayAttendance = attendance.filter(a => 
    new Date(a.date).toDateString() === new Date(selectedDate).toDateString()
  );

  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
  const lateCount = todayAttendance.filter(a => a.status === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attendance Monitoring</h3>
          <p className="text-gray-600">Track attendance for students from your college</p>
        </div>
        <div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{collegeData?.interns?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-gray-900">{lateCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">
            Attendance for {new Date(selectedDate).toLocaleDateString()}
          </h4>
        </div>
        <div className="p-6">
          {todayAttendance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAttendance.map((record) => (
                <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-gray-900">{record.studentName}</h5>
                      <p className="text-sm text-gray-600">{record.studentEmail}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' :
                      record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  {record.checkInTime && (
                    <p className="text-xs text-gray-500">
                      Check-in: {new Date(record.checkInTime).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No attendance records for this date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Performance Analytics Tab
const PerformanceAnalyticsTab = ({ collegeData, performanceData }) => {
  if (!collegeData || !performanceData) {
    return <div className="text-center py-8 text-gray-500">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
        <p className="text-gray-600">Comprehensive performance insights for your college</p>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceData.averageScore || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceData.completedTasks || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Performers</p>
              <p className="text-2xl font-bold text-gray-900">
                {performanceData.topPerformers || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h4>
          <div className="text-center py-8 text-gray-500">
            Performance chart visualization coming soon...
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Task Completion Rate</h4>
          <div className="text-center py-8 text-gray-500">
            Task completion chart coming soon...
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Top Performers</h4>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {(collegeData?.interns || []).slice(0, 5).map((intern, index) => (
              <div key={intern._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{intern.name}</h5>
                    <p className="text-sm text-gray-600">{intern.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">85%</p>
                  <p className="text-sm text-gray-600">Performance Score</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Communication Tab
const CommunicationTab = ({ collegeData, announcements, fetchAnnouncements }) => {
  const [activeCommTab, setActiveCommTab] = useState('announcements');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnouncementDetails, setShowAnnouncementDetails] = useState(false);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAudience, setFilterAudience] = useState('all');
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetAudience: 'all',
    expiresAt: ''
  });

  // Chatroom states
  const [chatRooms, setChatRooms] = useState([]);
  const [showCreateChatRoom, setShowCreateChatRoom] = useState(false);
  const [newChatRoom, setNewChatRoom] = useState({
    name: '',
    description: '',
    type: 'general',
    visibility: 'college-only'
  });

  // Fetch chatrooms
  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat-rooms');
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms || []);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  };

  // Load chatrooms on component mount
  useEffect(() => {
    if (activeCommTab === 'chatrooms') {
      fetchChatRooms();
    }
  }, [activeCommTab]);

  const handleCreateChatRoom = async () => {
    if (!newChatRoom.name.trim()) {
      alert('Please enter a chat room name');
      return;
    }

    try {
      const response = await fetch('/api/chat-rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newChatRoom,
          college: collegeData?.college?._id,
          createdBy: 'POC'
        })
      });

      if (response.ok) {
        alert('Chat room created successfully!');
        setShowCreateChatRoom(false);
        setNewChatRoom({
          name: '',
          description: '',
          type: 'general',
          visibility: 'college-only'
        });
        fetchChatRooms();
      } else {
        const error = await response.json();
        alert(`Failed to create chat room: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Failed to create chat room');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    try {
      const response = await fetch('/api/poc/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAnnouncement,
          college: collegeData?.college?._id,
          expiresAt: newAnnouncement.expiresAt || null
        })
      });

      if (response.ok) {
        alert('Announcement created successfully!');
        setShowCreateAnnouncement(false);
        setNewAnnouncement({
          title: '',
          message: '',
          priority: 'normal',
          targetAudience: 'all',
          expiresAt: ''
        });
        fetchAnnouncements();
      } else {
        const error = await response.json();
        alert(`Failed to create announcement: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    const matchesAudience = filterAudience === 'all' || announcement.targetAudience === filterAudience;
    
    // Check if announcement is not expired
    const isNotExpired = !announcement.expiresAt || new Date(announcement.expiresAt) > new Date();
    
    return matchesPriority && matchesAudience && isNotExpired;
  });

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementDetails(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Communication Center</h3>
          <p className="text-gray-600">Manage announcements and chat rooms for your college</p>
        </div>
        <div className="flex items-center space-x-3">
          {activeCommTab === 'announcements' && (
            <button
              onClick={() => setShowCreateAnnouncement(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Announcement</span>
            </button>
          )}
          {activeCommTab === 'chatrooms' && (
            <button
              onClick={() => setShowCreateChatRoom(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Create Chat Room</span>
            </button>
          )}
        </div>
      </div>

      {/* Communication Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveCommTab('announcements')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeCommTab === 'announcements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📢 Announcements
            </button>
            <button
              onClick={() => setActiveCommTab('chatrooms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeCommTab === 'chatrooms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💬 Chat Rooms
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeCommTab === 'announcements' && (
            <AnnouncementsSection 
              announcements={announcements}
              filteredAnnouncements={filteredAnnouncements}
              filterPriority={filterPriority}
              setFilterPriority={setFilterPriority}
              filterAudience={filterAudience}
              setFilterAudience={setFilterAudience}
              handleAnnouncementClick={handleAnnouncementClick}
            />
          )}
          {activeCommTab === 'chatrooms' && (
            <ChatRoomsSection 
              chatRooms={chatRooms}
              collegeData={collegeData}
              fetchChatRooms={fetchChatRooms}
            />
          )}
        </div>
      </div>

      {/* Announcement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{filteredAnnouncements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => a.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(a.createdAt) >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-3">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <select
              value={filterAudience}
              onChange={(e) => setFilterAudience(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Audiences</option>
              <option value="all">Everyone</option>
              <option value="tech-leads">Tech Leads</option>
              <option value="interns">AI Developer Interns</option>
              <option value="mentors">Mentors</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Recent Announcements</h4>
        </div>
        <div className="p-6">
          {filteredAnnouncements.length > 0 ? (
            <div className="space-y-4">
              {filteredAnnouncements.map((announcement) => (
                <div 
                  key={announcement._id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAnnouncementClick(announcement)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{announcement.title}</h5>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                        announcement.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {announcement.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                      <EyeIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{announcement.message}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Target: {announcement.targetAudience}</span>
                    {announcement.expiresAt && (
                      <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {announcements.length === 0 
                ? "No announcements yet. Create your first announcement to get started."
                : "No announcements match your current filters."
              }
            </div>
          )}
        </div>
      </div>

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter announcement title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Write your announcement message..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low Priority</option>
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <select
                    value={newAnnouncement.targetAudience}
                    onChange={(e) => setNewAnnouncement({...newAnnouncement, targetAudience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Everyone</option>
                    <option value="interns">AI Developer Interns Only</option>
                    <option value="tech-leads">Tech Leads Only</option>
                    <option value="mentors">Mentors Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={newAnnouncement.expiresAt}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, expiresAt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for permanent announcement</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateAnnouncement(false);
                    setNewAnnouncement({
                      title: '',
                      message: '',
                      priority: 'normal',
                      targetAudience: 'all',
                      expiresAt: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={!newAnnouncement.title.trim() || !newAnnouncement.message.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Announcement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Details Modal */}
      {showAnnouncementDetails && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Announcement Details</h3>
              <button
                onClick={() => setShowAnnouncementDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{selectedAnnouncement.title}</h4>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedAnnouncement.priority === 'high' ? 'bg-red-100 text-red-800' :
                    selectedAnnouncement.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedAnnouncement.priority} priority
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                    {selectedAnnouncement.targetAudience}
                  </span>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-900 mb-2">Message</h5>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedAnnouncement.message}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Created</h5>
                  <p className="text-gray-600">{new Date(selectedAnnouncement.createdAt).toLocaleString()}</p>
                </div>
                {selectedAnnouncement.expiresAt && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Expires</h5>
                    <p className="text-gray-600">{new Date(selectedAnnouncement.expiresAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h5 className="font-medium text-gray-900 mb-2">Status</h5>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </span>
                  {selectedAnnouncement.expiresAt && new Date(selectedAnnouncement.expiresAt) > new Date() && (
                    <span className="text-gray-600">
                      Expires in {Math.ceil((new Date(selectedAnnouncement.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Chat Room Modal */}
      {showCreateChatRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Chat Room</h3>
              <button
                onClick={() => setShowCreateChatRoom(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={newChatRoom.name}
                  onChange={(e) => setNewChatRoom({...newChatRoom, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter chat room name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newChatRoom.description}
                  onChange={(e) => setNewChatRoom({...newChatRoom, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the purpose of this chat room"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={newChatRoom.type}
                  onChange={(e) => setNewChatRoom({...newChatRoom, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General Discussion</option>
                  <option value="project">Project Collaboration</option>
                  <option value="announcement">Announcements</option>
                  <option value="support">Support & Help</option>
                  <option value="social">Social & Casual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="college-only"
                      checked={newChatRoom.visibility === 'college-only'}
                      onChange={(e) => setNewChatRoom({...newChatRoom, visibility: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">College Only - All members of your college can join</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={newChatRoom.visibility === 'private'}
                      onChange={(e) => setNewChatRoom({...newChatRoom, visibility: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Private - Invitation only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={newChatRoom.visibility === 'public'}
                      onChange={(e) => setNewChatRoom({...newChatRoom, visibility: e.target.value})}
                      className="mr-2"
                    />
                    <span className="text-sm">Public - Anyone can join</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateChatRoom(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChatRoom}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create Chat Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// College Settings Tab
const CollegeSettingsTab = ({ collegeData, fetchCollegeData }) => {
  const [editMode, setEditMode] = useState(false);
  const [collegeInfo, setCollegeInfo] = useState({
    name: '',
    location: '',
    email: '',
    phone: '',
    website: ''
  });

  useEffect(() => {
    if (collegeData?.college) {
      setCollegeInfo({
        name: collegeData.college.name || '',
        location: collegeData.college.location || '',
        email: collegeData.college.email || '',
        phone: collegeData.college.phone || '',
        website: collegeData.college.website || ''
      });
    }
  }, [collegeData]);

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/poc/college-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collegeInfo)
      });

      if (response.ok) {
        alert('College settings updated successfully!');
        setEditMode(false);
        fetchCollegeData();
      }
    } catch (error) {
      console.error('Error updating college settings:', error);
      alert('Failed to update college settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">College Settings</h3>
          <p className="text-gray-600">Manage your college information and settings</p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PencilIcon className="w-4 h-4" />
          <span>{editMode ? 'Cancel' : 'Edit Settings'}</span>
        </button>
      </div>

      {/* College Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">College Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
            {editMode ? (
              <input
                type="text"
                value={collegeInfo.name}
                onChange={(e) => setCollegeInfo({...collegeInfo, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{collegeInfo.name || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            {editMode ? (
              <input
                type="text"
                value={collegeInfo.location}
                onChange={(e) => setCollegeInfo({...collegeInfo, location: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{collegeInfo.location || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            {editMode ? (
              <input
                type="email"
                value={collegeInfo.email}
                onChange={(e) => setCollegeInfo({...collegeInfo, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{collegeInfo.email || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            {editMode ? (
              <input
                type="tel"
                value={collegeInfo.phone}
                onChange={(e) => setCollegeInfo({...collegeInfo, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{collegeInfo.phone || 'Not set'}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            {editMode ? (
              <input
                type="url"
                value={collegeInfo.website}
                onChange={(e) => setCollegeInfo({...collegeInfo, website: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{collegeInfo.website || 'Not set'}</p>
            )}
          </div>
        </div>

        {editMode && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setEditMode(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">College Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{collegeData?.stats?.totalTechLeads || 0}</p>
            <p className="text-sm text-gray-600">Tech Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{collegeData?.stats?.totalAIDeveloperInterns || 0}</p>
            <p className="text-sm text-gray-600">AI Developer Interns</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{collegeData?.stats?.assignedAIDeveloperInterns || 0}</p>
            <p className="text-sm text-gray-600">Assigned Interns</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Announcements Section Component
const AnnouncementsSection = ({ 
  announcements, 
  filteredAnnouncements, 
  filterPriority, 
  setFilterPriority, 
  filterAudience, 
  setFilterAudience, 
  handleAnnouncementClick 
}) => {
  return (
    <div className="space-y-6">
      {/* Announcement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Announcements</p>
              <p className="text-2xl font-bold text-gray-900">{announcements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{filteredAnnouncements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => a.priority === 'high').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {announcements.filter(a => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(a.createdAt) >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="normal">Normal Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <select
          value={filterAudience}
          onChange={(e) => setFilterAudience(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Audiences</option>
          <option value="tech-leads">Tech Leads</option>
          <option value="ai-developer-interns">AI Developer Interns</option>
          <option value="all-staff">All Staff</option>
        </select>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement._id}
              onClick={() => handleAnnouncementClick(announcement)}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                  <p className="text-gray-600 mt-1 line-clamp-2">{announcement.message}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>📅 {new Date(announcement.createdAt).toLocaleDateString()}</span>
                    <span>👥 {announcement.targetAudience}</span>
                    {announcement.expiresAt && (
                      <span>⏰ Expires {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  announcement.priority === 'high' 
                    ? 'bg-red-100 text-red-800'
                    : announcement.priority === 'normal'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {announcement.priority?.toUpperCase()}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No announcements match your current filters.
          </div>
        )}
      </div>
    </div>
  );
};

// Chat Rooms Section Component
const ChatRoomsSection = ({ chatRooms, collegeData, fetchChatRooms }) => {
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [showChatInterface, setShowChatInterface] = useState(false);

  const handleChatRoomClick = (room) => {
    console.log('🖱️ Chat room clicked:', room);
    setSelectedChatRoom(room);
    setShowChatInterface(true);
    console.log('✅ Modal should be opening...');
  };

  const closeChatInterface = () => {
    setShowChatInterface(false);
    setSelectedChatRoom(null);
  };

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      <div className="bg-yellow-50 p-2 rounded text-xs">
        Debug: showChatInterface={showChatInterface.toString()}, selectedChatRoom={selectedChatRoom?.name || 'none'}
        <button 
          onClick={() => {
            console.log('🧪 Test modal button clicked');
            setSelectedChatRoom(chatRooms[0] || { _id: 'test', name: 'Test Room', type: 'general' });
            setShowChatInterface(true);
          }}
          className="ml-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Test Modal
        </button>
      </div>
      
      {/* Chat Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Chat Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{chatRooms.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">College Rooms</p>
              <p className="text-2xl font-bold text-gray-900">
                {chatRooms.filter(room => room.visibility === 'college-only').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <EyeIcon className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Private Rooms</p>
              <p className="text-2xl font-bold text-gray-900">
                {chatRooms.filter(room => room.visibility === 'private').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {chatRooms.filter(room => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return room.lastActivity && new Date(room.lastActivity) >= today;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Rooms List */}
      <div className="space-y-4">
        {chatRooms.length > 0 ? (
          chatRooms.map((room) => (
            <div
              key={room._id}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleChatRoomClick(room);
              }}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">{room.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      room.visibility === 'private' 
                        ? 'bg-red-100 text-red-800'
                        : room.visibility === 'college-only'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {room.visibility === 'college-only' ? 'College Only' : 
                       room.visibility === 'private' ? 'Private' : 'Public'}
                    </span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {room.type}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{room.description || 'No description'}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                    <span>📅 Created {new Date(room.createdAt).toLocaleDateString()}</span>
                    <span>👥 {room.participantCount || 0} members</span>
                    <span>🏢 {room.college?.name || 'No college'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${
                      room.isActive ? 'bg-green-400' : 'bg-gray-400'
                    }`}></span>
                    <span className="text-sm text-gray-500">
                      {room.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600 text-sm font-medium">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>Open Chat</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No chat rooms created yet.</p>
            <p className="text-sm">Create your first chat room to start communicating with your college!</p>
          </div>
        )}
      </div>

      {/* Chat Interface Modal */}
      {showChatInterface && selectedChatRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
             onClick={(e) => {
               console.log('🖱️ Modal backdrop clicked');
               if (e.target === e.currentTarget) {
                 closeChatInterface();
               }
             }}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 mx-4 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedChatRoom.type === 'announcement' ? 'bg-red-100 text-red-600' :
                  selectedChatRoom.type === 'project' ? 'bg-blue-100 text-blue-600' :
                  selectedChatRoom.type === 'support' ? 'bg-green-100 text-green-600' :
                  selectedChatRoom.type === 'social' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <span className="text-sm">
                    {selectedChatRoom.type === 'announcement' ? '📢' :
                     selectedChatRoom.type === 'project' ? '📁' :
                     selectedChatRoom.type === 'support' ? '🆘' :
                     selectedChatRoom.type === 'social' ? '🎉' : '💬'}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedChatRoom.name}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedChatRoom.description} • {selectedChatRoom.participantCount || 0} participants
                  </p>
                </div>
              </div>
              <button
                onClick={closeChatInterface}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              {selectedChatRoom ? (
                <EnhancedChat userRole="POC" selectedRoomId={selectedChatRoom._id} />
              ) : (
                <div className="p-8 text-center">
                  <p>Loading chat room...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POCDashboard;