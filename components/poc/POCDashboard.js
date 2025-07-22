import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
  EyeIcon
} from '@heroicons/react/24/outline';

const POCDashboard = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [collegeData, setCollegeData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user?.role === 'POC') {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      await Promise.all([
        fetchCollegeData(),
        fetchTeams(),
        fetchTasks(),
        fetchAttendance(),
        fetchPerformanceData(),
        fetchAnnouncements()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCollegeData = async () => {
    try {
      const response = await fetch('/api/poc/college-overview');
      if (response.ok) {
        const data = await response.json();
        setCollegeData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        setError(`Failed to load college data: ${errorData.error || 'Unknown error'}`);
        
        // Fallback data if API fails - empty structure only
        setCollegeData({
          college: {
            name: (typeof session?.user?.college === 'string' ? session?.user?.college : session?.user?.college?.name) || 'Your College',
            location: 'Location not set',
            email: session?.user?.email || 'email@college.edu',
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
        });
      }
    } catch (error) {
      console.error('Error fetching college data:', error);
      setError(`Network error: ${error.message}`);
      
      // Fallback data on error - empty structure only
      setCollegeData({
        college: {
          name: (typeof session?.user?.college === 'string' ? session?.user?.college : session?.user?.college?.name) || 'Your College',
          location: 'Location not set',
          email: session?.user?.email || 'email@college.edu',
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
      });
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/poc/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?college=true');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance?college=true');
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/poc/performance');
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      } else {
        setPerformanceData({ metrics: [], trends: [] });
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setPerformanceData({ metrics: [], trends: [] });
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/poc/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

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
                onClick={() => fetchAllData(true)}
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
                  onClick={() => setActiveTab(tab.id)}
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

  const { college, stats, mentors, interns } = collegeData;

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
            <p className="text-lg text-gray-900">{college.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Location</p>
            <p className="text-lg text-gray-900">{college.location}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Contact Email</p>
            <p className="text-lg text-gray-900">{college.email}</p>
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

  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading intern data...</div>;
  }

  const { interns, mentors } = collegeData;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Intern Management</h3>
          <p className="text-gray-600">Manage AI Developer Interns from your college</p>
        </div>
        <div className="flex space-x-3">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            {assignedInterns.length} Assigned
          </div>
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            {unassignedInterns.length} Unassigned
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
    </div>
  );
};

// Tech Lead Management Tab
const TechLeadManagementTab = ({ collegeData, teams, fetchAllData }) => {
  const [selectedTechLead, setSelectedTechLead] = useState(null);
  const [showTechLeadDetails, setShowTechLeadDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading tech lead data...</div>;
  }

  const { mentors, interns } = collegeData;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tech Lead Management</h3>
          <p className="text-gray-600">Monitor and manage Tech Leads from your college</p>
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
              <p className="text-2xl font-bold text-gray-900">{collegeData.interns.length}</p>
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
            {collegeData.interns.slice(0, 5).map((intern, index) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Communication Center</h3>
          <p className="text-gray-600">Send announcements and communicate with your college</p>
        </div>
        <button
          onClick={() => setShowCreateAnnouncement(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
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

export default POCDashboard;