'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthProvider';

export function SuperMentorCommunicationTab() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('rooms');
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [interns, setInterns] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [roomAnalytics, setRoomAnalytics] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const messagesEndRef = useRef(null);

  // Room creation form state
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    type: 'general',
    visibility: 'college-only',
    participants: [],
    settings: {
      allowFileSharing: true,
      allowMentions: true,
      moderationEnabled: false,
      maxParticipants: 100
    },
    tags: []
  });

  useEffect(() => {
    fetchChatRooms();
    fetchInterns();
    fetchMentors();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatRooms = async () => {
    try {
      const response = await fetch('/api/chat-rooms');
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms || []);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const response = await fetch('/api/super-mentor/college-interns');
      if (response.ok) {
        const data = await response.json();
        setInterns(data.interns || []);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  const fetchMentors = async () => {
    try {
      const response = await fetch('/api/super-mentor/college-mentors');
      if (response.ok) {
        const data = await response.json();
        setMentors(data.mentors || []);
      }
    } catch (error) {
      console.error('Error fetching mentors:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await fetch(`/api/chat-rooms/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createChatRoom = async () => {
    try {
      // Prepare room data with college information
      const roomData = {
        ...roomForm,
        college: user?.college // Add the user's college for college-only rooms
      };

      console.log('Creating room with data:', roomData);
      console.log('User object:', user);

      const response = await fetch('/api/chat-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (response.ok) {
        const data = await response.json();
        setChatRooms([data.chatRoom, ...chatRooms]);
        setShowCreateRoom(false);
        setRoomForm({
          name: '',
          description: '',
          type: 'general',
          visibility: 'college-only',
          participants: [],
          settings: {
            allowFileSharing: true,
            allowMentions: true,
            moderationEnabled: false,
            maxParticipants: 100
          },
          tags: []
        });
        alert('Chat room created successfully!');
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(`Error: ${error.error || 'Failed to create chat room'}`);
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      alert('Failed to create chat room. Please check your connection and try again.');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const response = await fetch(`/api/chat-rooms/${selectedRoom._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          type: 'text'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to delete this chat room? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/chat-rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChatRooms(chatRooms.filter(room => room._id !== roomId));
        if (selectedRoom && selectedRoom._id === roomId) {
          setSelectedRoom(null);
          setMessages([]);
        }
        alert('Chat room deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Failed to delete chat room');
    }
  };

  const createAnnouncement = async (announcementData) => {
    try {
      const response = await fetch('/api/chat-rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...announcementData,
          type: 'announcement',
          visibility: 'college-only',
          college: user?.college // Add the user's college for college-only rooms
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatRooms([data.chatRoom, ...chatRooms]);
        
        // Send initial announcement message
        await fetch(`/api/chat-rooms/${data.chatRoom._id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: announcementData.message,
            type: 'announcement'
          }),
        });
        
        alert('Announcement created and sent successfully!');
        return true;
      } else {
        const error = await response.json();
        console.error('API Error:', error);
        alert(`Error: ${error.error || 'Failed to create announcement'}`);
        return false;
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement. Please check your connection and try again.');
      return false;
    }
  };

  const AnalyticsView = () => {
    const totalMessages = chatRooms.reduce((sum, room) => sum + (roomAnalytics[room._id]?.messageCount || 0), 0);
    const activeRooms = chatRooms.filter(room => {
      const lastActivity = new Date(room.lastActivity);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return lastActivity > dayAgo;
    }).length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Communication Analytics</h2>
          <p className="text-gray-600">Monitor engagement and activity across your chat rooms</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">💬</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">🔥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Rooms (24h)</p>
                <p className="text-2xl font-bold text-gray-900">{activeRooms}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Participants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chatRooms.reduce((sum, room) => sum + room.participantCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">📢</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Announcements</p>
                <p className="text-2xl font-bold text-gray-900">
                  {chatRooms.filter(room => room.type === 'announcement').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Room Activity Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Activity Overview</h3>
          <div className="space-y-4">
            {chatRooms.map(room => {
              const activity = roomAnalytics[room._id] || {};
              const lastActivity = new Date(room.lastActivity);
              const isRecent = Date.now() - lastActivity.getTime() < 24 * 60 * 60 * 1000;
              
              return (
                <div key={room._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      room.type === 'announcement' ? 'bg-red-100 text-red-600' :
                      room.type === 'project' ? 'bg-blue-100 text-blue-600' :
                      room.type === 'support' ? 'bg-green-100 text-green-600' :
                      room.type === 'social' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <span className="text-sm">
                        {room.type === 'announcement' ? '📢' :
                         room.type === 'project' ? '📁' :
                         room.type === 'support' ? '🆘' :
                         room.type === 'social' ? '🎉' :
                         '💬'}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{room.name}</h4>
                      <p className="text-sm text-gray-500">
                        {room.participantCount} participants • Last active {lastActivity.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{activity.messageCount || 0}</p>
                      <p className="text-xs text-gray-500">Messages</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isRecent ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const AnnouncementCenter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Announcement Center</h2>
          <p className="text-gray-600">Create and manage announcements for your team</p>
        </div>
        <button
          onClick={() => setShowAnnouncementModal(true)}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <span className="mr-2">📢</span>
          New Announcement
        </button>
      </div>

      {/* Quick Announcement Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setRoomForm({
              ...roomForm,
              name: 'Weekly Standup Reminder',
              description: 'Weekly team standup meeting reminder',
              type: 'announcement',
              message: 'Reminder: Weekly standup meeting tomorrow at 10 AM. Please be prepared to discuss your progress and any blockers.'
            });
            setShowAnnouncementModal(true);
          }}
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
        >
          <div className="text-2xl mb-2">📅</div>
          <h3 className="font-medium text-gray-900">Meeting Reminder</h3>
          <p className="text-sm text-gray-500">Quick reminder for upcoming meetings</p>
        </button>

        <button
          onClick={() => {
            setRoomForm({
              ...roomForm,
              name: 'Task Deadline Alert',
              description: 'Important deadline reminder for team tasks',
              type: 'announcement',
              message: 'Important: Project deadline is approaching this Friday. Please ensure all tasks are completed and submitted on time.'
            });
            setShowAnnouncementModal(true);
          }}
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
        >
          <div className="text-2xl mb-2">⏰</div>
          <h3 className="font-medium text-gray-900">Deadline Alert</h3>
          <p className="text-sm text-gray-500">Alert team about upcoming deadlines</p>
        </button>

        <button
          onClick={() => {
            setRoomForm({
              ...roomForm,
              name: 'General Announcement',
              description: 'General team announcement',
              type: 'announcement',
              message: ''
            });
            setShowAnnouncementModal(true);
          }}
          className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left"
        >
          <div className="text-2xl mb-2">📢</div>
          <h3 className="font-medium text-gray-900">Custom Announcement</h3>
          <p className="text-sm text-gray-500">Create a custom announcement</p>
        </button>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h3>
        <div className="space-y-4">
          {chatRooms.filter(room => room.type === 'announcement').slice(0, 5).map(room => (
            <div key={room._id} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-sm">📢</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{room.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{room.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{room.participantCount} participants</span>
                  <span>•</span>
                  <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedRoom(room);
                  setActiveView('chat');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View
              </button>
            </div>
          ))}
          {chatRooms.filter(room => room.type === 'announcement').length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-3xl mb-2">📢</div>
              <p className="text-gray-500">No announcements yet</p>
              <p className="text-sm text-gray-400">Create your first announcement to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const RoomManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Room Management</h2>
          <p className="text-gray-600">Create and manage communication channels for your team</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateRoom(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">➕</span>
            Create Room
          </button>
          <button
            onClick={async () => {
              console.log('Testing room creation...');
              const testRoom = {
                name: 'Test Room',
                description: 'Test room description',
                type: 'general',
                visibility: 'college-only',
                participants: [],
                settings: {
                  allowFileSharing: true,
                  allowMentions: true,
                  moderationEnabled: false,
                  maxParticipants: 100
                },
                tags: []
              };
              
              console.log('Test room data:', testRoom);
              console.log('User college:', user?.college);
              
              try {
                const response = await fetch('/api/chat-rooms', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    ...testRoom,
                    college: user?.college
                  }),
                });
                
                const result = await response.json();
                console.log('Test result:', result);
                
                if (response.ok) {
                  alert('Test room created successfully!');
                  fetchChatRooms();
                } else {
                  alert(`Test failed: ${result.error}`);
                }
              } catch (error) {
                console.error('Test error:', error);
                alert('Test failed with error');
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            🧪 Test
          </button>
        </div>
      </div>

      {/* Room Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">💬</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{chatRooms.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">College Rooms</p>
              <p className="text-2xl font-bold text-gray-900">
                {chatRooms.filter(room => room.visibility === 'college-only').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">🌐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Public Rooms</p>
              <p className="text-2xl font-bold text-gray-900">
                {chatRooms.filter(room => room.visibility === 'public').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {interns.length + mentors.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Room List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Chat Rooms</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading chat rooms...</p>
            </div>
          ) : chatRooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Chat Rooms Yet</h3>
              <p className="text-gray-500 mb-4">Create your first chat room to start communicating with your team</p>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Create Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chatRooms.map(room => (
                <div key={room._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        room.type === 'announcement' ? 'bg-red-100' :
                        room.type === 'project' ? 'bg-blue-100' :
                        room.type === 'support' ? 'bg-green-100' :
                        room.type === 'social' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        <span className="text-lg">
                          {room.type === 'announcement' ? '📢' :
                           room.type === 'project' ? '📁' :
                           room.type === 'support' ? '🆘' :
                           room.type === 'social' ? '🎉' :
                           '💬'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{room.name}</h4>
                        <p className="text-sm text-gray-500 capitalize">{room.type} • {room.visibility}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          setActiveView('chat');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => deleteRoom(room._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {room.description && (
                    <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{room.participantCount} participants</span>
                    <span>{new Date(room.lastActivity).toLocaleDateString()}</span>
                  </div>
                  
                  {room.tags && room.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ChatInterface = () => {
    if (!selectedRoom) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat Room</h3>
          <p className="text-gray-500">Choose a room from the management panel to start chatting</p>
          <button
            onClick={() => setActiveView('rooms')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Rooms
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveView('rooms')}
              className="text-gray-400 hover:text-gray-600"
            >
              ←
            </button>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedRoom.type === 'announcement' ? 'bg-red-100' :
              selectedRoom.type === 'project' ? 'bg-blue-100' :
              selectedRoom.type === 'support' ? 'bg-green-100' :
              selectedRoom.type === 'social' ? 'bg-purple-100' :
              'bg-gray-100'
            }`}>
              <span className="text-lg">
                {selectedRoom.type === 'announcement' ? '📢' :
                 selectedRoom.type === 'project' ? '📁' :
                 selectedRoom.type === 'support' ? '🆘' :
                 selectedRoom.type === 'social' ? '🎉' :
                 '💬'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{selectedRoom.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedRoom.participantCount} participants • {selectedRoom.visibility}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRoomSettings(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            ⚙️
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map(message => (
            <div
              key={message._id}
              className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender._id === user._id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.sender._id !== user._id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.sender.name}
                  </p>
                )}
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 opacity-75`}>
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveView('rooms')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeView === 'rooms'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Room Management
        </button>
        <button
          onClick={() => setActiveView('chat')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeView === 'chat'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Chat Interface
        </button>
        <button
          onClick={() => setActiveView('announcements')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeView === 'announcements'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Announcements
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeView === 'analytics'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Content */}
      {activeView === 'rooms' && <RoomManagement />}
      {activeView === 'chat' && <ChatInterface />}
      {activeView === 'announcements' && <AnnouncementCenter />}
      {activeView === 'analytics' && <AnalyticsView />}

      {/* Modals */}
      <CreateRoomModal
        show={showCreateRoom}
        onClose={() => setShowCreateRoom(false)}
        onSubmit={createChatRoom}
        roomForm={roomForm}
        setRoomForm={setRoomForm}
        mentors={mentors}
        interns={interns}
      />
      <AnnouncementModal
        show={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onSubmit={createAnnouncement}
        roomForm={roomForm}
        setRoomForm={setRoomForm}
        mentors={mentors}
        interns={interns}
      />
    </div>
  );
}

// Move CreateRoomModal outside the main component
function CreateRoomModal({ show, onClose, onSubmit, roomForm, setRoomForm, mentors, interns }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create New Chat Room</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={e => { e.preventDefault(); onSubmit(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Name *</label>
                <input
                  type="text"
                  value={roomForm.name}
                  onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter room name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type *</label>
                <select
                  value={roomForm.type}
                  onChange={e => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="general">General Discussion</option>
                  <option value="project">Project Specific</option>
                  <option value="announcement">Announcements</option>
                  <option value="support">Support & Help</option>
                  <option value="social">Social & Fun</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={roomForm.description}
                onChange={e => setRoomForm({ ...roomForm, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describe the purpose of this room"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Visibility</label>
              <select
                value={roomForm.visibility}
                onChange={e => setRoomForm({ ...roomForm, visibility: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="college-only">College Only</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Initial Participants</label>
              <div className="grid grid-cols-2 gap-4 max-h-32 overflow-y-auto">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Mentors</h4>
                  {mentors.map(mentor => (
                    <label key={mentor._id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={roomForm.participants.includes(mentor._id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setRoomForm({
                              ...roomForm,
                              participants: [...roomForm.participants, mentor._id]
                            });
                          } else {
                            setRoomForm({
                              ...roomForm,
                              participants: roomForm.participants.filter(id => id !== mentor._id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{mentor.name}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Interns</h4>
                  {interns.map(intern => (
                    <label key={intern._id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={roomForm.participants.includes(intern._id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setRoomForm({
                              ...roomForm,
                              participants: [...roomForm.participants, intern._id]
                            });
                          } else {
                            setRoomForm({
                              ...roomForm,
                              participants: roomForm.participants.filter(id => id !== intern._id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{intern.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Room
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Move AnnouncementModal outside the main component
function AnnouncementModal({ show, onClose, onSubmit, roomForm, setRoomForm, mentors, interns }) {
  if (!show) return null;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onSubmit(roomForm);
    if (success) {
      onClose();
      setRoomForm({
        name: '',
        description: '',
        type: 'general',
        visibility: 'college-only',
        participants: [],
        settings: {
          allowFileSharing: true,
          allowMentions: true,
          moderationEnabled: false,
          maxParticipants: 100
        },
        tags: [],
        message: ''
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Create Announcement</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Announcement Title *</label>
              <input
                type="text"
                value={roomForm.name}
                onChange={(e) => setRoomForm({...roomForm, name: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={roomForm.description}
                onChange={(e) => setRoomForm({...roomForm, description: e.target.value})}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Brief description of the announcement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Announcement Message *</label>
              <textarea
                value={roomForm.message || ''}
                onChange={(e) => setRoomForm({...roomForm, message: e.target.value})}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                placeholder="Enter your announcement message here..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Send to</label>
              <div className="grid grid-cols-2 gap-4 max-h-32 overflow-y-auto">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Mentors</h4>
                  {mentors.map(mentor => (
                    <label key={mentor._id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={roomForm.participants.includes(mentor._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoomForm({
                              ...roomForm,
                              participants: [...roomForm.participants, mentor._id]
                            });
                          } else {
                            setRoomForm({
                              ...roomForm,
                              participants: roomForm.participants.filter(id => id !== mentor._id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{mentor.name}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Interns</h4>
                  {interns.map(intern => (
                    <label key={intern._id} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        checked={roomForm.participants.includes(intern._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoomForm({
                              ...roomForm,
                              participants: [...roomForm.participants, intern._id]
                            });
                          } else {
                            setRoomForm({
                              ...roomForm,
                              participants: roomForm.participants.filter(id => id !== intern._id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{intern.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = [...mentors.map(m => m._id), ...interns.map(i => i._id)];
                    setRoomForm({...roomForm, participants: allIds});
                  }}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Select All
                </button>
                <span className="mx-2 text-gray-300">|</span>
                <button
                  type="button"
                  onClick={() => setRoomForm({...roomForm, participants: []})}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Send Announcement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}