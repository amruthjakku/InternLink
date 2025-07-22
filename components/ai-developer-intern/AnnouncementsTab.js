import { useState, useEffect } from 'react';
import { 
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

export function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements');
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } else {
        console.error('Failed to fetch announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (announcementId) => {
    try {
      const response = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setAnnouncements(prev => 
          prev.map(ann => 
            ann._id === announcementId 
              ? { ...ann, isRead: true }
              : ann
          )
        );
      }
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDetails(true);
    
    if (!announcement.isRead) {
      markAsRead(announcement._id);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'normal':
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
      case 'low':
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'read' && announcement.isRead) ||
      (filter === 'unread' && !announcement.isRead);
    
    const matchesPriorityFilter = priorityFilter === 'all' || 
      announcement.priority === priorityFilter;
    
    return matchesReadFilter && matchesPriorityFilter;
  });

  const unreadCount = announcements.filter(ann => !ann.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading announcements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SpeakerWaveIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
            <p className="text-sm text-gray-600">
              Stay updated with important information
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={fetchAnnouncements}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Read Status
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredAnnouncements.length} of {announcements.length} announcements
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement._id}
              onClick={() => handleAnnouncementClick(announcement)}
              className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all hover:shadow-md ${
                !announcement.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getPriorityIcon(announcement.priority)}
                    <h4 className={`font-medium ${!announcement.isRead ? 'text-gray-900 font-semibold' : 'text-gray-800'}`}>
                      {announcement.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    {announcement.scope === 'global' && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        Global
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {announcement.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>
                        By: {announcement.createdBy?.name || 'Unknown'}
                      </span>
                      <span>
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                      {announcement.college && (
                        <span>
                          College: {announcement.college.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {announcement.isRead ? (
                        <div className="flex items-center text-green-600">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          <span>Read</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-600">
                          <EyeSlashIcon className="w-4 h-4 mr-1" />
                          <span>Unread</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <SpeakerWaveIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
            <p className="text-gray-600">
              {filter === 'unread' 
                ? "You're all caught up! No unread announcements."
                : "No announcements available at the moment."
              }
            </p>
          </div>
        )}
      </div>

      {/* Announcement Details Modal */}
      {showDetails && selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getPriorityIcon(selectedAnnouncement.priority)}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedAnnouncement.title}
                  </h3>
                  <span className={`text-sm px-3 py-1 rounded-full border ${getPriorityColor(selectedAnnouncement.priority)}`}>
                    {selectedAnnouncement.priority}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created by:</span>
                    <span className="ml-2 text-gray-600">{selectedAnnouncement.createdBy?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Target:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedAnnouncement.targetAudience}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Scope:</span>
                    <span className="ml-2 text-gray-600 capitalize">{selectedAnnouncement.scope}</span>
                  </div>
                  {selectedAnnouncement.college && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">College:</span>
                      <span className="ml-2 text-gray-600">{selectedAnnouncement.college.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedAnnouncement.message}
                  </p>
                </div>
              </div>

              {selectedAnnouncement.tags && selectedAnnouncement.tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAnnouncement.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}