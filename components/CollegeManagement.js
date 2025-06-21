import { useState, useEffect } from 'react';

export function CollegeManagement() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading college data
    setTimeout(() => {
      setColleges([
        { id: 1, name: 'MIT', totalInterns: 15, activeInterns: 12, completionRate: 87 },
        { id: 2, name: 'Stanford', totalInterns: 20, activeInterns: 18, completionRate: 92 },
        { id: 3, name: 'Harvard', totalInterns: 12, activeInterns: 10, completionRate: 78 },
        { id: 4, name: 'UC Berkeley', totalInterns: 18, activeInterns: 16, completionRate: 85 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">College Management</h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">College Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {colleges.map((college) => (
          <div key={college.id} className="border rounded-lg p-4">
            <h3 className="font-medium text-lg mb-3">{college.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Interns:</span>
                <span className="text-sm font-medium">{college.totalInterns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Interns:</span>
                <span className="text-sm font-medium">{college.activeInterns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completion Rate:</span>
                <span className={`text-sm font-medium ${
                  college.completionRate >= 90 ? 'text-green-600' :
                  college.completionRate >= 80 ? 'text-blue-600' :
                  college.completionRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {college.completionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${college.completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}