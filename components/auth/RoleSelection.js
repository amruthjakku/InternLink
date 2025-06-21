'use client';

export default function RoleSelection({ onRoleSelect, userInfo }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          {userInfo?.image && (
            <img 
              src={userInfo.image} 
              alt={userInfo.name}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
            />
          )}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {userInfo?.name}!
        </h2>
        <p className="text-gray-600">
          Connected with GitLab account: @{userInfo?.gitlabUsername}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Choose Your Role
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mentor Option */}
          <div 
            onClick={() => onRoleSelect('mentor')}
            className="group cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-2xl">🎓</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">I'm a Mentor</h4>
              <p className="text-gray-600 text-sm mb-4">
                Guide and manage interns through their learning journey
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Create and manage colleges
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Set up cohorts for interns
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Monitor progress and performance
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Review join requests
                </li>
              </ul>
            </div>
          </div>

          {/* Intern Option */}
          <div 
            onClick={() => onRoleSelect('intern')}
            className="group cursor-pointer bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 hover:border-green-400 hover:shadow-lg transition-all duration-200"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-2xl">👨‍🎓</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">I'm an Intern</h4>
              <p className="text-gray-600 text-sm mb-4">
                Join a cohort and track your internship progress
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Join existing colleges
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Participate in cohorts
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Track your progress
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Connect GitLab projects
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>You can change your role later in your profile settings</p>
      </div>
    </div>
  );
}