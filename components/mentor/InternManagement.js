'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getCollegeName } from '../../utils/helpers';
import { CollegeBadge } from '../CollegeLogo';

export function InternManagement() {
  const { data: session } = useSession();
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchInterns();
    }
  }, [session]);

  const fetchInterns = async () => {
    try {
      const response = await fetch('/api/mentor/interns');
      if (response.ok) {
        const data = await response.json();
        setInterns(data.interns || []);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (internId) => {
    // This would open a detailed profile view or navigate to profile page
    console.log('View profile for intern:', internId);
    // In a real app, this might navigate to /intern/profile/${internId}
    window.open(`/intern/profile/${internId}`, '_blank');
  };

  const handleSendMessage = (internId) => {
    // This would open a messaging interface
    console.log('Send message to intern:', internId);
    // In a real app, this might open a chat modal or navigate to messaging
    alert('Messaging functionality would be implemented here');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (interns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Interns Assigned</h3>
          <p className="text-gray-600">
            Interns will appear here once they are assigned to your mentorship.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">My Interns ({interns.length})</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {interns.map((intern) => (
          <div key={intern._id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={intern.image || `/api/avatar/${intern.name?.charAt(0) || 'U'}`}
                  alt={intern.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{intern.name}</h4>
                  <p className="text-sm text-gray-600">{intern.email}</p>
                  <CollegeBadge college={{ name: getCollegeName(intern.college) }} />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Attendance: {intern.attendanceRate || 0}%
                  </div>
                  <div className="text-sm text-gray-500">
                    Tasks: {intern.completedTasks || 0}/{intern.totalTasks || 0}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleViewProfile(intern.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleSendMessage(intern.id)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}