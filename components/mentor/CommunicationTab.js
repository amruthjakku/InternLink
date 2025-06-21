'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function CommunicationTab() {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [interns, setInterns] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    setChats(mockData.chats || []);
    setMessages(mockData.messages || []);
    setInterns(mockData.interns);
  }, []);

  const getChatMessages = (chatId) => {
    return messages.filter(message => message.chat_id === chatId);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message = {
      id: Date.now(),
      chat_id: selectedChat.id,
      sender_id: 1, // Mentor ID
      sender_name: "Dr. Sarah Wilson",
      message: newMessage,
      timestamp: new Date().toISOString(),
      type: "text",
      reactions: []
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const ChatSidebar = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Conversations</h3>
        <button
          onClick={() => setShowCreateGroup(true)}
          className="text-blue-600 hover:text-blue-800"
        >
          ➕
        </button>
      </div>

      <div className="space-y-2">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedChat?.id === chat.id
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {chat.type === 'group' ? '👥' : chat.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{chat.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {chat.last_message?.message || 'No messages yet'}
                </p>
              </div>
              {chat.unread_count > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {chat.unread_count}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChatWindow = () => {
    if (!selectedChat) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center h-96 flex items-center justify-center">
          <div>
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
            <p className="text-gray-500">Choose a chat from the sidebar to start messaging</p>
          </div>
        </div>
      );
    }

    const chatMessages = getChatMessages(selectedChat.id);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-96">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {selectedChat.type === 'group' ? '👥' : selectedChat.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{selectedChat.name}</h3>
              <p className="text-sm text-gray-500">
                {selectedChat.type === 'group' 
                  ? `${selectedChat.participants.length} participants`
                  : 'Direct message'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === 1 ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === 1
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {message.sender_id !== 1 && (
                  <p className="text-xs font-medium mb-1">{message.sender_name}</p>
                )}
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.sender_id === 1 ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AnnouncementPanel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          <span className="mr-2">📢</span>
          New Announcement
        </button>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm">📢</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Weekly Standup Meeting</h4>
              <p className="text-sm text-gray-600 mt-1">
                Don't forget about our weekly standup meeting tomorrow at 10 AM. We'll be discussing project progress and upcoming deadlines.
              </p>
              <p className="text-xs text-gray-500 mt-2">Posted 2 hours ago</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 text-sm">✅</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">New Task Assignment</h4>
              <p className="text-sm text-gray-600 mt-1">
                New tasks have been assigned for the React Dashboard project. Please check your task list and start working on them.
              </p>
              <p className="text-xs text-gray-500 mt-2">Posted yesterday</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm">⚠️</span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">Deadline Reminder</h4>
              <p className="text-sm text-gray-600 mt-1">
                Reminder: The API Integration project is due this Friday. Make sure to submit your work on time.
              </p>
              <p className="text-xs text-gray-500 mt-2">Posted 3 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActions = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-2xl mb-2">📧</span>
          <span className="text-sm font-medium text-gray-900">Send Email</span>
        </button>
        
        <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-2xl mb-2">📱</span>
          <span className="text-sm font-medium text-gray-900">SMS Alert</span>
        </button>
        
        <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-2xl mb-2">📋</span>
          <span className="text-sm font-medium text-gray-900">Survey</span>
        </button>
        
        <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-2xl mb-2">📊</span>
          <span className="text-sm font-medium text-gray-900">Poll</span>
        </button>
      </div>
    </div>
  );

  const CreateGroupModal = () => {
    if (!showCreateGroup) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create Group Chat</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Participants</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {interns.map(intern => (
                    <label key={intern.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{intern.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChatSidebar />
        <div className="lg:col-span-2">
          <ChatWindow />
        </div>
      </div>
      <AnnouncementPanel />
      <QuickActions />
      <CreateGroupModal />
    </div>
  );
}