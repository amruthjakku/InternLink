import { useState, useEffect } from 'react';

const TeamManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('super-mentors');
  const [colleges, setColleges] = useState([]);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchColleges();
    fetchUsers();
    fetchTeams();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges || []);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const subTabs = [
    { id: 'super-mentors', name: 'POCs', icon: '👨‍🏫', description: 'Manage POCs and their colleges' },
    { id: 'mentor-teams', name: 'Tech Lead Teams', icon: '👥', description: 'Assign interns to mentors' },
    { id: 'team-overview', name: 'Team Overview', icon: '📊', description: 'View all teams and assignments' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">👥</span>
            </div>
            Team Management
          </h2>
          <p className="text-gray-600 mt-1">Manage POCs, mentors, and intern team assignments</p>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-green-50 text-green-700 border-b-2 border-green-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'super-mentors' && (
            <POCsTab colleges={colleges} users={users} />
          )}
          {activeSubTab === 'mentor-teams' && (
            <TechLeadTeamsTab colleges={colleges} users={users} teams={teams} fetchTeams={fetchTeams} />
          )}
          {activeSubTab === 'team-overview' && (
            <TeamOverviewTab teams={teams} colleges={colleges} />
          )}
        </div>
      </div>
    </div>
  );
};

const POCsTab = ({ colleges, users }) => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [collegeUsers, setCollegeUsers] = useState({ mentors: [], interns: [] });

  const handleCollegeSelect = async (college) => {
    setSelectedCollege(college);
    
    // Fetch users for this college
    try {
      const response = await fetch(`/api/admin/colleges/${college._id}/users`);
      if (response.ok) {
        const data = await response.json();
        setCollegeUsers({
          mentors: data.users?.filter(u => u.role === 'Tech Lead' || u.role === 'POC') || [],
          interns: data.users?.filter(u => u.role === 'AI Developer Intern') || []
        });
      }
    } catch (error) {
      console.error('Error fetching college users:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">👨‍🏫 POC Management</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• POCs can view all mentors and interns in their college</div>
          <div>• They can create teams by assigning interns to mentors</div>
          <div>• Each college should have one designated POC</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select College</h3>
          <div className="space-y-2">
            {colleges.map((college) => (
              <div
                key={college._id}
                onClick={() => handleCollegeSelect(college)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedCollege?._id === college._id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{college.name}</div>
                    <div className="text-sm text-gray-500">{college.location}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {college.superTechLeadUsername && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        POC Assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* College Details */}
        {selectedCollege && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedCollege.name} - Team Structure
            </h3>
            
            <div className="space-y-4">
              {/* POC Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="text-lg mr-2">👨‍🏫</span>
                  POC
                </h4>
                {selectedCollege.superTechLeadUsername ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="font-medium text-green-800">
                      {selectedCollege.superTechLeadUsername}
                    </div>
                    <div className="text-sm text-green-600">Active POC</div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="text-yellow-800">No POC assigned</div>
                    <button className="text-sm text-yellow-600 hover:text-yellow-800 mt-1">
                      Assign POC
                    </button>
                  </div>
                )}
              </div>

              {/* Tech Leads Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="text-lg mr-2">👨‍💼</span>
                  Tech Leads ({collegeUsers.mentors.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {collegeUsers.mentors.map((mentor) => (
                    <div key={mentor._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{mentor.name}</div>
                        <div className="text-xs text-gray-500">{mentor.gitlabUsername}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        mentor.role === 'POC' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {mentor.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Developer Interns Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <span className="text-lg mr-2">👨‍🎓</span>
                  AI Developer Interns ({collegeUsers.interns.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {collegeUsers.interns.map((intern) => (
                    <div key={intern._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-sm">{intern.name}</div>
                        <div className="text-xs text-gray-500">{intern.gitlabUsername}</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {intern.mentorId ? 'Assigned' : 'Unassigned'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TechLeadTeamsTab = ({ colleges, users, teams, fetchTeams }) => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [mentors, setTechLeads] = useState([]);
  const [interns, setAIDeveloperInterns] = useState([]);
  const [selectedTechLead, setSelectedTechLead] = useState(null);
  const [selectedAIDeveloperInterns, setSelectedAIDeveloperInterns] = useState([]);

  const handleCollegeSelect = async (college) => {
    setSelectedCollege(college);
    setSelectedTechLead(null);
    setSelectedAIDeveloperInterns([]);
    
    try {
      const response = await fetch(`/api/admin/colleges/${college._id}/users`);
      if (response.ok) {
        const data = await response.json();
        setTechLeads(data.users?.filter(u => u.role === 'Tech Lead' || u.role === 'POC') || []);
        setAIDeveloperInterns(data.users?.filter(u => u.role === 'AI Developer Intern') || []);
      }
    } catch (error) {
      console.error('Error fetching college users:', error);
    }
  };

  const handleAIDeveloperInternToggle = (intern) => {
    const isSelected = selectedAIDeveloperInterns.find(i => i._id === intern._id);
    if (isSelected) {
      setSelectedAIDeveloperInterns(selectedAIDeveloperInterns.filter(i => i._id !== intern._id));
    } else {
      setSelectedAIDeveloperInterns([...selectedAIDeveloperInterns, intern]);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedTechLead || selectedAIDeveloperInterns.length === 0) return;

    try {
      const response = await fetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId: selectedTechLead._id,
          internIds: selectedAIDeveloperInterns.map(i => i._id),
          collegeId: selectedCollege._id,
          name: `${selectedTechLead.name}'s Team`
        })
      });

      if (response.ok) {
        alert('Team created successfully!');
        setSelectedTechLead(null);
        setSelectedAIDeveloperInterns([]);
        fetchTeams();
        // Refresh the college data
        handleCollegeSelect(selectedCollege);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">👥 Team Assignment Workflow</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>1. Select a college to view available mentors and interns</div>
          <div>2. Choose a mentor who will lead the team</div>
          <div>3. Select interns to assign to that mentor</div>
          <div>4. Create the team - interns will be assigned to the mentor</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* College Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Select College</h3>
          <div className="space-y-2">
            {colleges.map((college) => (
              <div
                key={college._id}
                onClick={() => handleCollegeSelect(college)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedCollege?._id === college._id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{college.name}</div>
                <div className="text-sm text-gray-500">{college.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Lead Selection */}
        {selectedCollege && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Select Tech Lead</h3>
            <div className="space-y-2">
              {mentors.map((mentor) => (
                <div
                  key={mentor._id}
                  onClick={() => setSelectedTechLead(mentor)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTechLead?._id === mentor._id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{mentor.name}</div>
                  <div className="text-sm text-gray-500">{mentor.gitlabUsername}</div>
                  <div className="text-xs text-gray-400 mt-1">{mentor.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Developer Intern Selection */}
        {selectedTechLead && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Select AI Developer Interns</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {interns.filter(intern => !intern.mentorId).map((intern) => (
                <div
                  key={intern._id}
                  onClick={() => handleAIDeveloperInternToggle(intern)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedAIDeveloperInterns.find(i => i._id === intern._id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={!!selectedAIDeveloperInterns.find(i => i._id === intern._id)}
                      readOnly
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{intern.name}</div>
                      <div className="text-sm text-gray-500">{intern.gitlabUsername}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedAIDeveloperInterns.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={handleCreateTeam}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  Create Team ({selectedAIDeveloperInterns.length} interns)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TeamOverviewTab = ({ teams, colleges }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">All Teams Overview</h3>
      
      <div className="grid gap-6">
        {colleges.map((college) => {
          const collegeTeams = teams.filter(team => team.collegeId === college._id);
          
          return (
            <div key={college._id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">{college.name}</h4>
                <span className="text-sm text-gray-500">{collegeTeams.length} teams</span>
              </div>
              
              {collegeTeams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collegeTeams.map((team) => (
                    <div key={team._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{team.name}</h5>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Active
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Tech Lead: {team.mentor?.name}</div>
                        <div>AI Developer Interns: {team.interns?.length || 0}</div>
                        <div>Created: {new Date(team.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No teams created for this college yet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamManagement;