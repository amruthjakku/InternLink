'use client';

import { useState, useEffect, useRef } from 'react';

export function ChatTab({ user, loading }) {
  const [activeChat, setActiveChat] = useState('general');
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const chatRooms = [
    { id: 'general', name: 'General', type: 'room', icon: '💬', purpose: 'General discussions and announcements' },
    { id: 'help', name: 'Help & Support', type: 'room', icon: '🆘', purpose: 'Ask for help with tasks and technical issues' },
    { id: 'frontend', name: 'Frontend Dev', type: 'room', icon: '🎨', purpose: 'Frontend development discussions' },
    { id: 'backend', name: 'Backend Dev', type: 'room', icon: '⚙️', purpose: 'Backend development discussions' },
  ];

  const mentors = [
    { id: 'mentor1', name: 'Sarah Wilson', email: 'sarah@company.com', status: 'online', avatar: 'SW' },
    { id: 'mentor2', name: 'John Davis', email: 'john@company.com', status: 'away', avatar: 'JD' },
    { id: 'mentor3', name: 'Emily Chen', email: 'emily@company.com', status: 'offline', avatar: 'EC' },
  ];

  const peers = [
    { id: 'peer1', name: 'Alice Johnson', email: 'alice@company.com', status: 'online', avatar: 'AJ' },
    { id: 'peer2', name: 'Bob Smith', email: 'bob@company.com', status: 'online', avatar: 'BS' },
    { id: 'peer3', name: 'Carol Davis', email: 'carol@company.com', status: 'away', avatar: 'CD' },
  ];

  useEffect(() => {
    // Initialize mock messages for different chats
    const mockMessages = {
      general: [
        {
          id: 1,
          sender: 'Sarah Wilson',
          message: 'Good morning everyone! Don\'t forget about today\'s standup at 10 AM.',
          timestamp: '09:00 AM',
          isOwn: false,
          avatar: 'SW'
        },
        {
          id: 2,
          sender: 'Alice Johnson',
          message: 'Thanks for the reminder! I\'ll be there.',
          timestamp: '09:05 AM',
          isOwn: false,
          avatar: 'AJ'
        },
        {
          id: 3,
          sender: user?.name || 'You',
          message: 'Looking forward to it!',
          timestamp: '09:10 AM',
          isOwn: true,
          avatar: user?.name?.charAt(0) || 'Y'
        }
      ],
      help: [
        {
          id: 1,
          sender: 'Bob Smith',
          message: 'Can someone help me with React state management?',
          timestamp: '10:30 AM',
          isOwn: false,
          avatar: 'BS'
        },
        {
          id: 2,
          sender: 'John Davis',
          message: 'Sure! Are you using useState or useReducer?',
          timestamp: '10:32 AM',
          isOwn: false,
          avatar: 'JD'
        }
      ],
      frontend: [
        {
          id: 1,
          sender: 'Alice Johnson',
          message: 'Check out this cool CSS animation I made!',
          timestamp: '02:15 PM',
          isOwn: false,
          avatar: 'AJ'
        }
      ],
      backend: [
        {
          id: 1,
          sender: 'Emily Chen',
          message: 'New API endpoints are ready for testing.',
          timestamp: '03:45 PM',
          isOwn: false,
          avatar: 'EC'
        }
      ]
    };

    setMessages(mockMessages);
    setOnlineUsers([...mentors, ...peers].filter(u => u.status === 'online'));
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: user?.name || 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
        avatar: user?.name?.charAt(0) || 'Y'
      };

      setMessages(prev => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), message]
      }));
      setNewMessage('');

      // Simulate response for demo
      if (activeChat === 'help') {
        setTimeout(() => {
          const response = {
            id: Date.now() + 1,
            sender: 'Sarah Wilson',
            message: 'I can help with that! Let me know what specific issue you\'re facing.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
            avatar: 'SW'
          };
          setMessages(prev => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), response]
          }));
        }, 2000);
      }
    }
  };

  const startVideoCall = (chatId) => {
    const meetingLink = `https://virtual.swecha.org/room/${chatId}-${Date.now()}`;
    window.open(meetingLink, '_blank');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const currentMessages = messages[activeChat] || [];
  const activeRoom = chatRooms.find(room => room.id === activeChat);
  const activePerson = [...mentors, ...peers].find(person => person.id === activeChat);

  if (loading) {
    return (
      <div className="flex h-96 bg-white rounded-lg shadow overflow-hidden animate-pulse">
        <div className="w-1/3 border-r border-gray-200 p-4">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Chat Rooms */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Chat Rooms</h3>
            <div className="space-y-1">
              {chatRooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveChat(room.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeChat === room.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{room.icon}</span>
                    <span className="font-medium">{room.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mentors */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Mentors</h3>
            <div className="space-y-1">
              {mentors.map((mentor) => (
                <button
                  key={mentor.id}
                  onClick={() => setActiveChat(mentor.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeChat === mentor.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {mentor.avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(mentor.status)}`}></div>
                    </div>
                    <span className="font-medium">{mentor.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Peers */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Fellow Interns</h3>
            <div className="space-y-1">
              {peers.map((peer) => (
                <button
                  key={peer.id}
                  onClick={() => setActiveChat(peer.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeChat === peer.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="relative mr-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {peer.avatar}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(peer.status)}`}></div>
                    </div>
                    <span className="font-medium">{peer.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">
                  {activeRoom ? (
                    <span className="flex items-center">
                      <span className="mr-2">{activeRoom.icon}</span>
                      #{activeRoom.name}
                    </span>
                  ) : activePerson ? (
                    <span className="flex items-center">
                      <div className="relative mr-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {activePerson.avatar}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(activePerson.status)}`}></div>
                      </div>
                      {activePerson.name}
                    </span>
                  ) : (
                    'Select a chat'
                  )}
                </h3>
                {activeRoom && (
                  <p className="text-sm text-gray-500">{activeRoom.purpose}</p>
                )}
                {activePerson && (
                  <p className="text-sm text-gray-500">{activePerson.email}</p>
                )}
              </div>
              
              {(activeRoom || activePerson) && (
                <button
                  onClick={() => startVideoCall(activeChat)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors flex items-center"
                >
                  <span className="mr-1">🎥</span>
                  Video Call
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.isOwn 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {!msg.isOwn && (
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {msg.avatar}
                      </div>
                      <p className="text-xs font-medium opacity-75">{msg.sender}</p>
                    </div>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {(activeRoom || activePerson) && (
            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeRoom ? `#${activeRoom.name}` : activePerson?.name || ''}...`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}