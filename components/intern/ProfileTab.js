'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function ProfileTab() {
  const { user, completeOnboarding } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college_id: user?.college_id || '',
    cohort_id: user?.cohort_id || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    skills: user?.skills || [],
    interests: user?.interests || ''
  });

  useEffect(() => {
    // Load colleges and cohorts from localStorage
    const storedColleges = JSON.parse(localStorage.getItem('colleges') || '[]');
    setColleges(storedColleges);
    
    if (profileData.college_id) {
      const storedCohorts = JSON.parse(localStorage.getItem('cohorts') || '[]');
      const filteredCohorts = storedCohorts.filter(cohort => cohort.college_id === parseInt(profileData.college_id));
      setCohorts(filteredCohorts);
    }
  }, [profileData.college_id]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCollegeChange = (collegeId) => {
    setProfileData(prev => ({
      ...prev,
      college_id: collegeId,
      cohort_id: '' // Reset cohort when college changes
    }));
    
    // Update cohorts for new college
    const storedCohorts = JSON.parse(localStorage.getItem('cohorts') || '[]');
    const filteredCohorts = storedCohorts.filter(cohort => cohort.college_id === parseInt(collegeId));
    setCohorts(filteredCohorts);
  };

  const handleSkillsChange = (skillsString) => {
    const skillsArray = skillsString.split(',').map(skill => skill.trim()).filter(skill => skill);
    setProfileData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const selectedCollege = colleges.find(c => c.id === parseInt(profileData.college_id));
      const selectedCohort = cohorts.find(c => c.id === parseInt(profileData.cohort_id));
      
      const updatedUserData = {
        ...user,
        ...profileData,
        college_name: selectedCollege?.name,
        cohort_name: selectedCohort?.name
      };
      
      // Update user data
      completeOnboarding(updatedUserData);
      
      setIsEditing(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleCancel = () => {
    // Reset to original user data
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      college_id: user?.college_id || '',
      cohort_id: user?.cohort_id || '',
      bio: user?.bio || '',
      phone: user?.phone || '',
      linkedin: user?.linkedin || '',
      github: user?.github || '',
      skills: user?.skills || [],
      interests: user?.interests || ''
    });
    setIsEditing(false);
  };

  const selectedCollege = colleges.find(c => c.id === parseInt(profileData.college_id));
  const selectedCohort = cohorts.find(c => c.id === parseInt(profileData.cohort_id));

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-5 -mt-12">
            <div className="flex">
              <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center border-4 border-white">
                <span className="text-3xl font-bold text-gray-700">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
            <div className="mt-6 sm:mt-0 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
              <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {user?.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {user?.role === 'intern' ? '👨‍🎓 Intern' : '👨‍🏫 Mentor'}
                </p>
              </div>
              <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <span className="mr-2">✏️</span>
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">💾</span>
                          Save
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{user?.name || 'Not provided'}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p className="text-sm text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-sm text-gray-900">{user?.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitLab Username
                </label>
                <p className="text-sm text-gray-900">
                  {user?.gitlabUsername ? `@${user.gitlabUsername}` : 'Not available'}
                </p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College/University
                </label>
                {isEditing ? (
                  <select
                    value={profileData.college_id}
                    onChange={(e) => handleCollegeChange(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a college</option>
                    {colleges.map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">
                      {user?.college_name || 'Not selected'}
                    </span>
                    {selectedCollege && (
                      <span className="text-xs text-gray-500">
                        📍 {selectedCollege.location}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cohort/Program
                </label>
                {isEditing ? (
                  <select
                    value={profileData.cohort_id}
                    onChange={(e) => handleInputChange('cohort_id', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!profileData.college_id}
                  >
                    <option value="">Select a cohort</option>
                    {cohorts.map((cohort) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">
                      {user?.cohort_name || 'Not selected'}
                    </span>
                    {selectedCohort && (
                      <span className="text-xs text-gray-500">
                        📅 {new Date(selectedCohort.start_date).toLocaleDateString()} - {new Date(selectedCohort.end_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About Me</h3>
            {isEditing ? (
              <textarea
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Tell us about yourself, your goals, and what you hope to achieve in this internship..."
              />
            ) : (
              <p className="text-sm text-gray-700">
                {user?.bio || 'No bio provided yet. Click "Edit Profile" to add information about yourself.'}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Information */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Account Status</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : user?.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.status === 'active' ? '✅ Active' : 
                   user?.status === 'pending' ? '⏳ Pending' : '❓ Unknown'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Account Type</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.is_demo ? '🧪 Demo' : '🔗 GitLab'}
                </span>
              </div>

              {user?.gitlabId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">GitLab ID</span>
                  <span className="text-sm text-gray-900">#{user.gitlabId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profileData.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://linkedin.com/in/username"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {user?.linkedin ? (
                      <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                        View LinkedIn Profile
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Profile
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={profileData.github}
                    onChange={(e) => handleInputChange('github', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://github.com/username"
                  />
                ) : (
                  <p className="text-sm text-gray-900">
                    {user?.github ? (
                      <a href={user.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                        View GitHub Profile
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills & Interests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Interests</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.skills.join(', ')}
                    onChange={(e) => handleSkillsChange(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="JavaScript, React, Python, etc."
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user?.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No skills added yet</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interests
                </label>
                {isEditing ? (
                  <textarea
                    value={profileData.interests}
                    onChange={(e) => handleInputChange('interests', e.target.value)}
                    rows={3}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Web development, AI/ML, mobile apps, etc."
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {user?.interests || 'No interests specified yet'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}