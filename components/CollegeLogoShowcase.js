import { CollegeLogo, CollegeLogoOnly, CollegeCard, CollegeBadge } from './CollegeLogo';

/**
 * CollegeLogoShowcase - Demonstrates college logos in various contexts
 * This component shows all the different ways college logos are used throughout the app
 */
export function CollegeLogoShowcase() {
  // Sample college data
  const sampleColleges = [
    {
      name: 'Stanford University',
      location: 'Stanford, CA',
      website: 'https://www.stanford.edu',
      description: 'A leading research university known for innovation and entrepreneurship'
    },
    {
      name: 'MIT',
      location: 'Cambridge, MA', 
      website: 'https://www.mit.edu',
      description: 'Massachusetts Institute of Technology - Premier tech university'
    },
    {
      name: 'Harvard University',
      location: 'Cambridge, MA',
      website: 'https://www.harvard.edu',
      description: 'Ivy League research university established in 1636'
    },
    {
      name: 'UC Berkeley',
      location: 'Berkeley, CA',
      website: 'https://www.berkeley.edu',
      description: 'University of California, Berkeley - Top public research university'
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏫 College Logo System
          </h1>
          <p className="text-xl text-gray-600">
            College logos now appear everywhere throughout InternLink!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Different Logo Sizes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">📏 Different Sizes</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">XS:</span>
                <CollegeLogoOnly college={sampleColleges[0]} size="xs" />
                <span className="text-xs text-gray-500">Used in badges and small spaces</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">SM:</span>
                <CollegeLogoOnly college={sampleColleges[0]} size="sm" />
                <span className="text-xs text-gray-500">Used in profile cards and lists</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">MD:</span>
                <CollegeLogoOnly college={sampleColleges[0]} size="md" />
                <span className="text-xs text-gray-500">Used in main displays</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">LG:</span>
                <CollegeLogoOnly college={sampleColleges[0]} size="lg" />
                <span className="text-xs text-gray-500">Used in headers and features</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium w-16">XL:</span>
                <CollegeLogoOnly college={sampleColleges[0]} size="xl" />
                <span className="text-xs text-gray-500">Used in hero sections</span>
              </div>
            </div>
          </div>

          {/* Different Components */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">🧩 Component Types</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CollegeLogo (with name)</h3>
                <CollegeLogo college={sampleColleges[0]} size="md" showName={true} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CollegeCard (detailed)</h3>
                <CollegeCard college={sampleColleges[1]} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CollegeBadge (compact)</h3>
                <CollegeBadge college={sampleColleges[2]} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">CollegeLogoOnly (icon only)</h3>
                <CollegeLogoOnly college={sampleColleges[3]} size="md" />
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="bg-white rounded-xl p-6 shadow-sm border lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">🎯 Where They Appear</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="space-y-3">
                <h3 className="font-semibold text-purple-600">👤 User Profiles</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• ProfileCard component</li>
                  <li>• InternDashboard header</li>
                  <li>• VerificationPending page</li>
                  <li>• User management tables</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-blue-600">📊 Admin Dashboards</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• College management cards</li>
                  <li>• Advanced analytics tables</li>
                  <li>• User management lists</li>
                  <li>• Debug pages</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-green-600">👨‍🏫 Mentor Views</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Intern management lists</li>
                  <li>• Leaderboard displays</li>
                  <li>• Attendance tracking</li>
                  <li>• Meeting participants</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-orange-600">🎓 Intern Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Dashboard welcome area</li>
                  <li>• Leaderboard entries</li>
                  <li>• Profile information</li>
                  <li>• Peer comparisons</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-red-600">🔧 Debug & Admin</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Role debug tables</li>
                  <li>• System debug pages</li>
                  <li>• User status displays</li>
                  <li>• Data integrity checks</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-teal-600">📝 Forms & Modals</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• College edit modals</li>
                  <li>• User edit forms</li>
                  <li>• Onboarding flows</li>
                  <li>• Selection dropdowns</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Logo Features */}
          <div className="bg-white rounded-xl p-6 shadow-sm border lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">✨ Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Automatic Logo Fetching</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CollegeLogoOnly college={sampleColleges[0]} size="sm" />
                    <div>
                      <p className="text-sm font-medium">Real Logo Loaded</p>
                      <p className="text-xs text-gray-500">From stanford.edu</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <CollegeLogoOnly college={{ name: 'Unknown College' }} size="sm" />
                    <div>
                      <p className="text-sm font-medium">Fallback Icon</p>
                      <p className="text-xs text-gray-500">When no website available</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Consistent Design</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {sampleColleges.map((college, index) => (
                      <CollegeLogoOnly key={index} college={college} size="sm" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">
                    • Consistent sizing and spacing<br/>
                    • Error handling and fallbacks<br/>
                    • Responsive design<br/>
                    • Accessible alt text
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-4">🎉 Mission Accomplished!</h2>
            <p className="text-xl opacity-90">
              College logos now appear everywhere throughout InternLink - from user profiles to admin dashboards, 
              leaderboards to attendance tracking, and everything in between!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollegeLogoShowcase;