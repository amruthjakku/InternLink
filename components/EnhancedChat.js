'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';

export function EnhancedChat({ userRole }) {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom._id);
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
      console.log('🔄 Fetching chat rooms from /api/chat-rooms...');
      const response = await fetch('/api/chat-rooms');
      console.log('📥 Chat rooms response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        const rooms = data.chatRooms || [];
        console.log('💬 Loaded chat rooms:', rooms);
        setChatRooms(rooms);
        
        // Auto-select first room if available
        if (rooms.length > 0 && !selectedRoom) {
          console.log('🎯 Setting selected room to:', rooms[0]);
          setSelectedRoom(rooms[0]);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to fetch chat rooms:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    console.log('🚀 Sending message to room:', selectedRoom._id, 'Message:', newMessage);

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

      console.log('📥 Send message response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message sent successfully:', data);
        setMessages([...messages, data.data]);
        setNewMessage('');
        
        // Refresh messages to get any new messages from other users
        setTimeout(() => {
          fetchMessages(selectedRoom._id);
        }, 1000);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Failed to send message:', errorData);
        console.error('❌ Response details:', { status: response.status, statusText: response.statusText });
        alert(`Failed to send message: ${errorData.error || 'Please try again.'}\nStatus: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Error sending message. Please check your connection.');
    }
  };

  const getRoomIcon = (type) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'project': return '📁';
      case 'support': return '🆘';
      case 'social': return '🎉';
      default: return '💬';
    }
  };

  const getRoomColor = (type) => {
    switch (type) {
      case 'announcement': return 'bg-red-100 text-red-600';
      case 'project': return 'bg-blue-100 text-blue-600';
      case 'support': return 'bg-green-100 text-green-600';
      case 'social': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const testChatRoomAccess = async () => {
    if (!selectedRoom) {
      alert('No room selected');
      return;
    }
    
    try {
      console.log('🧪 Testing chat room access...');
      const response = await fetch(`/api/chat-rooms/${selectedRoom._id}/messages`);
      const data = await response.json();
      console.log('🧪 Chat room access test result:', { status: response.status, data });
      alert(`Chat room access test:\nStatus: ${response.status}\nSuccess: ${response.ok}\nMessages: ${data.messages?.length || 0}`);
    } catch (error) {
      console.error('🧪 Chat room access test error:', error);
      alert(`Chat room access test error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading chat rooms...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex h-[600px]">
        {/* Sidebar - Chat Rooms */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chat Rooms</h3>
            <p className="text-sm text-gray-500">
              {chatRooms.length} room{chatRooms.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {chatRooms.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-400 text-2xl mb-2">💬</div>
                <p className="text-sm text-gray-500">No chat rooms available</p>
                {userRole === 'POC' && (
                  <p className="text-xs text-gray-400 mt-1">
                    Create rooms in the Communication tab
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {chatRooms.map(room => (
                  <div
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedRoom?._id === room._id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRoomColor(room.type)}`}>
                        <span className="text-sm">{getRoomIcon(room.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{room.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="capitalize">{room.type}</span>
                          <span>•</span>
                          <span>{room.participantCount} members</span>
                          {room.visibility === 'college-only' && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600">🏢</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getRoomColor(selectedRoom.type)}`}>
                      <span className="text-lg">{getRoomIcon(selectedRoom.type)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedRoom.name}</h3>
                      <p className="text-sm text-gray-500">
                        {selectedRoom.description || `${selectedRoom.participantCount} participants`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={testChatRoomAccess}
                    className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    title="Test Chat Room Access"
                  >
                    🧪
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-3xl mb-2">💬</div>
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400">Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map(message => (
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
                            <span className="ml-1 text-xs opacity-60">
                              ({message.sender.role})
                            </span>
                          </p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 opacity-75`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
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
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={`Message ${selectedRoom.name}...`}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-4xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Chat Room</h3>
                <p className="text-gray-500">Choose a room from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}