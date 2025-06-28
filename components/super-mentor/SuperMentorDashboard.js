import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const SuperMentorDashboard = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [collegeData, setCollegeData] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role === 'super-mentor') {
      fetchCollegeData();
      fetchTeams();
    }
  }, [session]);

  const fetchCollegeData = async () => {
    try {
      const response = await fetch('/api/super-mentor/college-overview');
      if (response.ok) {
        const data = await response.json();
        setCollegeData(data);
      }
    } catch (error) {
      console.error('Error fetching college data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/super-mentor/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'College Overview', icon: '🏫' },
    { id: 'manage-teams', name: 'Manage Teams', icon: '👥' },
    { id: 'tasks', name: 'Tasks & Assignments', icon: '📋' },
    { id: 'performance', name: 'Performance', icon: '📊' }
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
              <h1 className="text-2xl font-bold text-gray-900">Super Mentor Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {session?.user?.name} - {collegeData?.college?.name}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Super Mentor
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <CollegeOverviewTab collegeData={collegeData} />
        )}
        {activeTab === 'manage-teams' && (
          <ManageTeamsTab collegeData={collegeData} teams={teams} fetchTeams={fetchTeams} />
        )}
        {activeTab === 'tasks' && (
          <TasksTab collegeData={collegeData} />
        )}
        {activeTab === 'performance' && (
          <PerformanceTab collegeData={collegeData} teams={teams} />
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
              <p className="text-sm font-medium text-gray-600">Total Mentors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMentors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Interns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalInterns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Interns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assignedInterns}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unassigned Interns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unassignedInterns}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentors</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {mentors.map((mentor) => (
              <div key={mentor._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-900">{mentor.name}</p>
                  <p className="text-sm text-gray-600">{mentor.gitlabUsername}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  mentor.role === 'super-mentor' 
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Interns</h3>
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

const ManageTeamsTab = ({ collegeData, teams, fetchTeams }) => {
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  if (!collegeData) {
    return <div className="text-center py-8 text-gray-500">Loading team data...</div>;
  }

  const { mentors, interns } = collegeData;
  const unassignedInterns = interns.filter(intern => !intern.mentorId);

  const handleCreateTeam = async () => {
    if (!selectedMentor || selectedInterns.length === 0) return;

    try {
      const response = await fetch('/api/super-mentor/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedMentor._id,
          internIds: selectedInterns.map(i => i._id)
        })
      });

      if (response.ok) {
        alert('Team created successfully!');
        setSelectedMentor(null);
        setSelectedInterns([]);
        setShowCreateTeam(false);
        fetchTeams();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Team Management</h3>
        <button
          onClick={() => setShowCreateTeam(!showCreateTeam)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateTeam ? 'Cancel' : 'Create New Team'}
        </button>
      </div>

      {/* Create Team Form */}
      {showCreateTeam && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="font-medium text-gray-900 mb-4">Create New Team</h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Select Mentor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mentor
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mentors.filter(m => m.role === 'mentor').map((mentor) => (
                  <div
                    key={mentor._id}
                    onClick={() => setSelectedMentor(mentor)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedMentor?._id === mentor._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{mentor.name}</div>
                    <div className="text-sm text-gray-600">{mentor.gitlabUsername}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Select Interns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Interns ({unassignedInterns.length} available)
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {unassignedInterns.map((intern) => (
                  <div
                    key={intern._id}
                    onClick={() => {
                      const isSelected = selectedInterns.find(i => i._id === intern._id);
                      if (isSelected) {
                        setSelectedInterns(selectedInterns.filter(i => i._id !== intern._id));
                      } else {
                        setSelectedInterns([...selectedInterns, intern]);
                      }
                    }}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedInterns.find(i => i._id === intern._id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={!!selectedInterns.find(i => i._id === intern._id)}
                        readOnly
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{intern.name}</div>
                        <div className="text-sm text-gray-600">{intern.gitlabUsername}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create Button */}
          {selectedMentor && selectedInterns.length > 0 && (
            <div className="mt-6">
              <button
                onClick={handleCreateTeam}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Create Team: {selectedMentor.name} + {selectedInterns.length} interns
              </button>
            </div>
          )}
        </div>
      )}

      {/* Existing Teams */}
      <div className="grid gap-6">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div key={team._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{team.name}</h4>
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                  Active Team
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Mentor</h5>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="font-medium text-blue-900">{team.mentor?.name}</div>
                    <div className="text-sm text-blue-700">{team.mentor?.gitlabUsername}</div>
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">
                    Interns ({team.interns?.length || 0})
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {team.interns?.map((intern) => (
                      <div key={intern._id} className="p-2 bg-gray-50 border border-gray-200 rounded">
                        <div className="font-medium text-gray-900 text-sm">{intern.name}</div>
                        <div className="text-xs text-gray-600">{intern.gitlabUsername}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No teams created yet. Create your first team to get started.
          </div>
        )}
      </div>
    </div>
  );
};

const TasksTab = ({ collegeData }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Tasks & Assignments</h3>
      <div className="text-center py-8 text-gray-500">
        Task management features coming soon...
      </div>
    </div>
  );
};

const PerformanceTab = ({ collegeData, teams }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Performance Analytics</h3>
      <div className="text-center py-8 text-gray-500">
        Performance analytics coming soon...
      </div>
    </div>
  );
};

export default SuperMentorDashboard;