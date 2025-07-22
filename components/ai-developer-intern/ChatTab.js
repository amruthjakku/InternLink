'use client';

import { useState, useEffect, useRef } from 'react';

export function ChatTab({ user }) {
  const [messages, setMessages] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [activeChat, setActiveChat] = useState('general');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const messagesEndRef = useRef(null);

  const chatTypes = [
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'technical', name: 'Technical Help', icon: '🔧' },
    { id: 'announcements', name: 'Announcements', icon: '📢' }
  ];

  useEffect(() => {
    fetchChats();
    fetchMessages();
    fetchOnlineUsers();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        
        // Group messages by chat
        const messagesByChat = {};
        data.messages?.forEach(message => {
          if (!messagesByChat[message.chatId]) {
            messagesByChat[message.chatId] = [];
          }
          messagesByChat[message.chatId].push(message);
        });
        
        setMessages(messagesByChat);
      } else {
        setMessages({});
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages({});
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const response = await fetch('/api/users/online');
      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.users || []);
      } else {
        setOnlineUsers([]);
      }
    } catch (error) {
      console.error('Error fetching online users:', error);
      setOnlineUsers([]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      chatId: activeChat,
      message: newMessage,
      type: 'text'
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        // Add message to local state immediately for better UX
        const newMsg = {
          id: Date.now(),
          sender: user?.name || 'You',
          message: newMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
          avatar: user?.name?.charAt(0) || 'Y'
        };

        setMessages(prev => ({
          ...prev,
          [activeChat]: [...(prev[activeChat] || []), newMsg]
        }));

        setNewMessage('');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const currentMessages = messages[activeChat] || [];

  return (
    <div className="flex h-full bg-white rounded-lg shadow">
      {/* Sidebar */}
      <div className="w-1/4 border-r border-gray-200 flex flex-col">
        {/* Chat List */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Chats</h3>
          <div className="space-y-2">
            {chatTypes.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  activeChat === chat.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{chat.icon}</span>
                  <span className="font-medium">{chat.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Online Users */}
        <div className="flex-1 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Online ({onlineUsers.length})
          </h4>
          <div className="space-y-2">
            {onlineUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No users online</p>
            ) : (
              onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {chatTypes.find(c => c.id === activeChat)?.icon}
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {chatTypes.find(c => c.id === activeChat)?.name}
              </h3>
              <p className="text-sm text-gray-500">
                {currentMessages.length} messages
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            currentMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-2 max-w-xs lg:max-w-md ${
                  message.isOwn ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {message.avatar}
                  </div>
                  <div>
                    <div className={`rounded-lg px-4 py-2 ${
                      message.isOwn
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                    </div>
                    <div className={`mt-1 text-xs text-gray-500 ${
                      message.isOwn ? 'text-right' : 'text-left'
                    }`}>
                      {message.sender} • {message.timestamp}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}