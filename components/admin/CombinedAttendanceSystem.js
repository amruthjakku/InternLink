import { useState } from 'react';

const CombinedAttendanceSystem = () => {
  const [activeSubTab, setActiveSubTab] = useState('attendance');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Attendance & IP System</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Attendance Overview</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today's Attendance Rate</span>
              <span className="text-lg font-bold text-green-600">92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Weekly Average</span>
              <span className="text-lg font-bold text-blue-600">89%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Average</span>
              <span className="text-lg font-bold text-purple-600">87%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Absences (Month)</span>
              <span className="text-lg font-bold text-red-600">124</span>
            </div>
          </div>
        </div>

        {/* IP Management */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">IP Management</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">Tech University</p>
                <p className="text-sm text-gray-600">192.168.1.0/24</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Edit
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">Innovation College</p>
                <p className="text-sm text-gray-600">10.0.0.0/16</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Edit
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-gray-900">Digital Arts Institute</p>
                <p className="text-sm text-gray-600">172.16.0.0/24</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance Records */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Recent Attendance Records</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    User Name {item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    College {item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item % 3 === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item % 3 === 0 ? 'Absent' : 'Present'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    192.168.1.{item}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CombinedAttendanceSystem;