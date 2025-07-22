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

  useEffect(() => {
    if (session?.user?.role === 'POC') {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchCollegeData = async () => {
    try {
      const response = await fetch('/api/poc/college-overview');
      if (response.ok) {
        const data = await response.json();
        setCollegeData(data);
      }
    } catch (error) {
      console.error('Error fetching college data:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/poc/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?college=true');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance?college=true');
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/poc/performance');
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/poc/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
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
                Welcome back, {session?.user?.name} - {collegeData?.college?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                POC
              </div>
            </div>
          </div>
        </div>
      </div>

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
            <p className="text-lg text-gray-900">{new Date(college.createdAt).getFullYear()}</p>
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
  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading tech lead data...</div>;
  }

  const { mentors } = collegeData;
  const techLeads = mentors.filter(m => m.role === 'TechLead');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Tech Lead Management</h3>
          <p className="text-gray-600">Monitor and manage Tech Leads from your college</p>
        </div>
      </div>

      {/* Tech Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {techLeads.map((techLead) => {
          const assignedInterns = collegeData.interns.filter(intern => 
            intern.assignedTechLead === techLead._id
          );
          
          return (
            <div key={techLead._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{techLead.name}</h4>
                  <p className="text-sm text-gray-600">{techLead.email}</p>
                  <p className="text-xs text-gray-500">@{techLead.gitlabUsername}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Tech Lead
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned Interns:</span>
                  <span className="font-medium text-gray-900">{assignedInterns.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    techLead.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {techLead.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {assignedInterns.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned Interns:</h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {assignedInterns.map((intern) => (
                      <div key={intern._id} className="text-xs bg-gray-50 p-2 rounded">
                        {intern.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Task Oversight Tab
const TaskOversightTab = ({ collegeData, tasks, fetchTasks }) => {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: ''
  });

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          createdBy: 'POC',
          college: collegeData?.college?._id
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
          dueDate: ''
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Task Oversight</h3>
          <p className="text-gray-600">Create and monitor tasks for your college</p>
        </div>
        <button
          onClick={() => setShowCreateTask(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Task</span>
        </button>
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
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
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
                {tasks.filter(t => t.status === 'in-progress').length}
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
                {tasks.filter(t => t.status === 'completed').length}
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
                {tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
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
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.slice(0, 10).map((task) => (
                <div key={task._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{task.title}</h5>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Assigned to: {task.assignedToName || 'Unassigned'}</span>
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tasks created yet. Create your first task to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title || !newTask.description}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
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
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal',
    targetAudience: 'all'
  });

  const handleCreateAnnouncement = async () => {
    try {
      const response = await fetch('/api/poc/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAnnouncement,
          college: collegeData?.college?._id
        })
      });

      if (response.ok) {
        alert('Announcement created successfully!');
        setShowCreateAnnouncement(false);
        setNewAnnouncement({
          title: '',
          message: '',
          priority: 'normal',
          targetAudience: 'all'
        });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    }
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

      {/* Recent Announcements */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Recent Announcements</h4>
        </div>
        <div className="p-6">
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{announcement.title}</h5>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
                        announcement.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                  <p className="text-xs text-gray-500">
                    Target: {announcement.targetAudience}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No announcements yet. Create your first announcement to get started.
            </div>
          )}
        </div>
      </div>

      {/* Create Announcement Modal */}
      {showCreateAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create New Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={newAnnouncement.targetAudience}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, targetAudience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Students</option>
                  <option value="interns">AI Developer Interns Only</option>
                  <option value="mentors">Tech Leads Only</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateAnnouncement(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={!newAnnouncement.title || !newAnnouncement.message}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Announcement
                </button>
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