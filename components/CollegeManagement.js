import { useState, useEffect } from 'react';
import { CollegeCard } from './CollegeLogo';

export function CollegeManagement() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Fetch real college data with statistics
  const fetchCollegeStats = async () => {
    try {
      setLoading(true);
      
      // Fetch colleges
      const collegesResponse = await fetch('/api/admin/colleges');
      const collegesData = await collegesResponse.json();
      
      // Fetch users to calculate statistics
      const usersResponse = await fetch('/api/admin/users');
      const usersData = await usersResponse.json();
      
      if (collegesResponse.ok && usersResponse.ok) {
        const colleges = collegesData.colleges || [];
        const users = usersData.users || [];
        
        console.log('📊 College Analytics Debug:');
        console.log(`Total colleges fetched: ${colleges.length}`);
        console.log(`Total users fetched: ${users.length}`);
        console.log('Colleges:', colleges.map(c => ({ id: c._id, name: c.name })));
        console.log('AI Developer Interns:', users.filter(u => u.role === 'AI Developer Intern').map(u => ({ 
          id: u._id, 
          name: u.name, 
          college: u.college, 
          collegeId: u.college?._id || u.college,
          isActive: u.isActive 
        })));
        
        // Calculate statistics for each college
        const collegesWithStats = colleges.map(college => {
          const collegeAI Developer Interns = users.filter(user => {
            if (user.role !== 'AI Developer Intern') return false;
            
            // Handle different formats of college ID comparison
            const userCollegeId = user.college?._id || user.college;
            const collegeId = college._id;
            
            // Convert both to strings for comparison
            const userCollegeStr = userCollegeId?.toString();
            const collegeIdStr = collegeId?.toString();
            
            console.log(`Comparing user college: ${userCollegeStr} with college: ${collegeIdStr}`);
            
            return userCollegeStr === collegeIdStr;
          });
          
          const activeAIDeveloperInterns = collegeAI Developer Interns.filter(intern => intern.isActive);
          const totalAIDeveloperInterns = collegeAI Developer Interns.length;
          
          // Calculate completion rate (simplified - could be based on actual completion data)
          const completionRate = totalAIDeveloperInterns > 0 ? 
            Math.round((activeAIDeveloperInterns.length / totalAIDeveloperInterns) * 100) : 0;
          
          return {
            ...college,
            totalAIDeveloperInterns,
            activeAIDeveloperInterns: activeAIDeveloperInterns.length,
            completionRate
          };
        });
        
        setColleges(collegesWithStats);
        
        // Calculate overall stats
        const totalColleges = colleges.length;
        const totalAIDeveloperInterns = users.filter(u => u.role === 'AI Developer Intern').length;
        const activeAIDeveloperInterns = users.filter(u => u.role === 'AI Developer Intern' && u.isActive).length;
        const avgCompletionRate = collegesWithStats.length > 0 ? 
          Math.round(collegesWithStats.reduce((sum, c) => sum + c.completionRate, 0) / collegesWithStats.length) : 0;
        
        setStats({
          totalColleges,
          totalAIDeveloperInterns,
          activeAIDeveloperInterns,
          avgCompletionRate
        });
      }
    } catch (error) {
      console.error('Error fetching college statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Advanced College Analytics</h2>
          <div className="animate-pulse h-4 bg-gray-200 rounded w-24"></div>
        </div>
        
        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
        
        {/* Loading College Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Advanced College Analytics</h2>
        <button
          onClick={fetchCollegeStats}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="text-sm font-medium text-blue-700">Total Colleges</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalColleges || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="text-sm font-medium text-green-700">Total AI Developer Interns</div>
          <div className="text-2xl font-bold text-green-900">{stats.totalAIDeveloperInterns || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="text-sm font-medium text-purple-700">Active AI Developer Interns</div>
          <div className="text-2xl font-bold text-purple-900">{stats.activeAIDeveloperInterns || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="text-sm font-medium text-orange-700">Avg Completion</div>
          <div className="text-2xl font-bold text-orange-900">{stats.avgCompletionRate || 0}%</div>
        </div>
      </div>

      {/* College Details */}
      {colleges.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">🏫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No College Data Available</h3>
          <p className="text-gray-600">College statistics will appear here once colleges are added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {colleges.map((college, index) => (
            <div key={college?._id || `college-${index}`} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <CollegeCard college={college} size="md" />
                <div className="text-right">
                  <div className="text-xs text-gray-500">ID: {college?._id?.slice(-6) || 'N/A'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{college?.totalAIDeveloperInterns || 0}</div>
                  <div className="text-xs text-gray-600">Total AI Developer Interns</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{college?.activeAIDeveloperInterns || 0}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${
                    (college?.completionRate || 0) >= 90 ? 'text-green-600' :
                    (college?.completionRate || 0) >= 80 ? 'text-blue-600' :
                    (college?.completionRate || 0) >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {college?.completionRate || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Active Rate</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    college.completionRate >= 90 ? 'bg-green-500' :
                    college.completionRate >= 80 ? 'bg-blue-500' :
                    college.completionRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${college.completionRate}%` }}
                ></div>
              </div>
              
              {/* Additional Info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Super-mentor: {college.superTech LeadName || 'Unassigned'}</span>
                <span>Added: {new Date(college.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}