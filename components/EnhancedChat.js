'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';

function EnhancedChat({ userRole, selectedRoomId }) {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom._id);
    }
  }, [selectedRoom]);

  // Auto-select room if selectedRoomId is provided
  useEffect(() => {
    if (selectedRoomId && chatRooms.length > 0) {
      const room = chatRooms.find(r => r._id === selectedRoomId);
      if (room) {
        setSelectedRoom(room);
      }
    }
  }, [selectedRoomId, chatRooms]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate profile picture from name
  const getProfilePicture = (user) => {
    if (user?.profilePicture) {
      return user.profilePicture;
    }
    // Generate a colorful avatar based on name
    const name = user?.name || user?.email || 'User';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    const colorIndex = name.charCodeAt(0) % colors.length;
    return { initials, color: colors[colorIndex] };
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // For now, just show file name in message
    setNewMessage(prev => prev + `📎 ${file.name}`);
  };

  // Common emojis for quick access
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😢', '😮', '😡', '🙏', '👏'];

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
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
        
        // Auto-select first room if available and no specific room is requested
        if (rooms.length > 0 && !selectedRoom && !selectedRoomId) {
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
          content: newMessage.trim(),
          type: 'text',
          replyTo: replyingTo?._id || null
        }),
      });

      console.log('📥 Send message response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Message sent successfully:', data);
        setMessages([...messages, data.data]);
        setNewMessage('');
        setReplyingTo(null);
        setShowEmojiPicker(false);
        
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading chat rooms...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex h-[600px] bg-white">
        {/* Sidebar - Chat Rooms */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Chats</h3>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {getProfilePicture(user).initials}
                  </span>
                </div>
              </div>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
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
              <div className="space-y-0">
                {chatRooms
                  .filter(room => 
                    !searchQuery || 
                    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(room => (
                  <div
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 cursor-pointer transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 ${
                      selectedRoom?._id === room._id
                        ? 'bg-blue-50 border-l-4 border-l-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Room Avatar */}
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoomColor(room.type)} shadow-sm`}>
                          <span className="text-lg">{getRoomIcon(room.type)}</span>
                        </div>
                        {room.isActive && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      {/* Room Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 truncate">{room.name}</p>
                          <span className="text-xs text-gray-500">
                            {room.lastActivity ? formatMessageTime(room.lastActivity) : 'New'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            {room.lastMessage?.content || room.description || `${room.participantCount || 0} participants`}
                          </p>
                          {room.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                              <span className="text-xs text-white font-medium">{room.unreadCount}</span>
                            </div>
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
              <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoomColor(selectedRoom.type)} shadow-sm`}>
                        <span className="text-xl">{getRoomIcon(selectedRoom.type)}</span>
                      </div>
                      {selectedRoom.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{selectedRoom.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{selectedRoom.participantCount || 0} participants</span>
                        {selectedRoom.isActive && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Active now</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowRoomInfo(!showRoomInfo)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Room info"
                    >
                      ℹ️
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Video call"
                    >
                      📹
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="Voice call"
                    >
                      📞
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-gray-50" style={{backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"chat-bg\" x=\"0\" y=\"0\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23e5e7eb\" opacity=\"0.3\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23chat-bg)\"/></svg>')"}}>
                <div className="p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl">💬</span>
                      </div>
                      <p className="text-gray-600 text-lg font-medium">No messages yet</p>
                      <p className="text-sm text-gray-500 mt-1">Start the conversation with your team!</p>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwnMessage = message.sender._id === user._id;
                      const showAvatar = !isOwnMessage && (index === 0 || messages[index - 1].sender._id !== message.sender._id);
                      const profilePic = getProfilePicture(message.sender);
                      
                      return (
                        <div key={message._id} className={`flex items-end space-x-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                          {/* Avatar for other users */}
                          {!isOwnMessage && (
                            <div className="w-8 h-8 rounded-full flex-shrink-0">
                              {showAvatar && (
                                typeof profilePic === 'string' ? (
                                  <img src={profilePic} alt={message.sender.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profilePic.color} text-white text-xs font-medium`}>
                                    {profilePic.initials}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`group relative max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-12' : 'mr-12'}`}>
                            {/* Reply indicator */}
                            {message.replyTo && (
                              <div className={`text-xs p-2 mb-1 rounded-lg border-l-4 ${
                                isOwnMessage 
                                  ? 'bg-blue-100 border-blue-300 text-blue-800' 
                                  : 'bg-gray-200 border-gray-400 text-gray-700'
                              }`}>
                                <p className="font-medium">Replying to {message.replyTo.sender?.name}</p>
                                <p className="truncate">{message.replyTo.content}</p>
                              </div>
                            )}
                            
                            <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                              isOwnMessage
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                            }`}>
                              {/* Sender name for group messages */}
                              {!isOwnMessage && showAvatar && (
                                <p className="text-xs font-semibold mb-1 text-blue-600">
                                  {message.sender.name}
                                </p>
                              )}
                              
                              {/* Message content */}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              
                              {/* Message time and status */}
                              <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                                {isOwnMessage && (
                                  <span className="text-xs">✓✓</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Message actions (appear on hover) */}
                            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center space-x-1 bg-white rounded-full shadow-lg p-1">
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className="p-1 hover:bg-gray-100 rounded-full text-xs"
                                  title="Reply"
                                >
                                  ↩️
                                </button>
                                <button
                                  className="p-1 hover:bg-gray-100 rounded-full text-xs"
                                  title="React"
                                >
                                  😊
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Reply Banner */}
              {replyingTo && (
                <div className="px-4 py-2 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-600">↩️</span>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Replying to {replyingTo.sender.name}</p>
                      <p className="text-xs text-blue-600 truncate max-w-xs">{replyingTo.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end space-x-3">
                  {/* Attachment Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Attach file"
                  >
                    📎
                  </button>
                  
                  {/* Message Input Container */}
                  <div className="flex-1 relative">
                    <div className="flex items-end bg-gray-100 rounded-2xl">
                      <textarea
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        placeholder={`Message ${selectedRoom.name}...`}
                        rows={1}
                        className="flex-1 bg-transparent border-0 resize-none px-4 py-3 text-sm focus:outline-none max-h-32"
                        style={{ minHeight: '44px' }}
                      />
                      
                      {/* Emoji Button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                          title="Add emoji"
                        >
                          😊
                        </button>
                        
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                          <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                            <div className="grid grid-cols-5 gap-2">
                              {commonEmojis.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleEmojiSelect(emoji)}
                                  className="p-2 hover:bg-gray-100 rounded text-lg"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className={`p-3 rounded-full transition-all ${
                      newMessage.trim()
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                    </svg>
                  </button>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="mt-2 text-xs text-gray-500">
                    Someone is typing...
                  </div>
                )}
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

export default EnhancedChat;