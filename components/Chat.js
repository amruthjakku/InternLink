import { useState, useEffect, useRef } from 'react';

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Simulate loading initial messages
    setTimeout(() => {
      setMessages([
        { id: 1, sender: 'John Doe', message: 'Hey, can someone help me with the React component?', timestamp: '10:30 AM', isOwn: false },
        { id: 2, sender: 'You', message: 'Sure! What specific issue are you facing?', timestamp: '10:32 AM', isOwn: true },
        { id: 3, sender: 'John Doe', message: 'I\'m having trouble with state management in my component.', timestamp: '10:35 AM', isOwn: false },
        { id: 4, sender: 'Mentor Sarah', message: 'Try using useState hook. Here\'s a quick example...', timestamp: '10:40 AM', isOwn: false },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Team Chat</h2>
        <div className="animate-pulse">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 rounded w-1/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Team Chat</h2>
      <div className="border rounded-lg">
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.isOwn 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {!msg.isOwn && (
                  <p className="text-xs font-medium mb-1 opacity-75">{msg.sender}</p>
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
        <form onSubmit={handleSendMessage} className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
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
      </div>
    </div>
  );
}