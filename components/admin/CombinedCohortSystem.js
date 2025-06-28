import { useState } from 'react';

const CombinedCohortSystem = () => {
  const [cohorts, setCohorts] = useState([
    { _id: '1', name: 'Fall 2023 Bootcamp', description: 'Fall semester bootcamp program', startDate: new Date('2023-09-01'), endDate: new Date('2023-12-15'), collegeCount: 3 },
    { _id: '2', name: 'Spring 2024 Internship', description: 'Spring semester internship program', startDate: new Date('2024-01-15'), endDate: new Date('2024-05-30'), collegeCount: 5 },
    { _id: '3', name: 'Summer 2024 Intensive', description: 'Summer intensive program', startDate: new Date('2024-06-01'), endDate: new Date('2024-08-15'), collegeCount: 2 }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Cohort Management</h3>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
          Create New Cohort
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cohorts.map((cohort) => (
          <div key={cohort._id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">{cohort.name}</h4>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {cohort.collegeCount} colleges
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">{cohort.description}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Start Date:</span>
                <span className="font-medium">{cohort.startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>End Date:</span>
                <span className="font-medium">{cohort.endDate.toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
              <button className="text-purple-600 hover:text-purple-900 text-sm font-medium">
                Edit
              </button>
              <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                Manage Colleges
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CombinedCohortSystem;