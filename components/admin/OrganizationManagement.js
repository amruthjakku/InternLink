import { useState, useEffect } from 'react';
import CombinedCollegeManagement from './CombinedCollegeManagement';
import CombinedCohortSystem from './CombinedCohortSystem';
import CombinedUserManagement from './CombinedUserManagement';

const OrganizationManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('colleges');

  const subTabs = [
    { id: 'colleges', name: 'Colleges', icon: '🏫', description: 'Manage educational institutions' },
    { id: 'cohorts', name: 'Cohorts', icon: '🎯', description: 'Manage cohorts and assignments' },
    { id: 'users', name: 'Users', icon: '👥', description: 'Manage users and permissions' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏢</span>
            </div>
            Organization Management
          </h2>
          <p className="text-gray-600 mt-1">Manage colleges, cohorts, and user assignments</p>
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
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
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
          {activeSubTab === 'colleges' && <CombinedCollegeManagement />}
          {activeSubTab === 'cohorts' && <CombinedCohortSystem />}
          {activeSubTab === 'users' && <CombinedUserManagement />}
        </div>
      </div>
    </div>
  );
};

export default OrganizationManagement;