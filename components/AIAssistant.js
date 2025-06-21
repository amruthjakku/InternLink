import { useState, useEffect, useRef } from 'react';

export function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Simulate loading initial conversation
    setTimeout(() => {
      setMessages([
        {
          id: 1,
          sender: 'AI Assistant',
          message: 'Hello! I\'m your AI assistant. I can help you with coding questions, project guidance, and learning resources. How can I assist you today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        },
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

  const simulateAIResponse = (userMessage) => {
    const responses = [
      "That's a great question! Let me help you with that. For React components, you'll want to focus on proper state management and component lifecycle.",
      "I understand you're working on that. Here are some best practices you should consider...",
      "Based on your question, I'd recommend checking out the official documentation. Also, here's a helpful approach...",
      "That's a common challenge! Here's how you can solve it step by step...",
      "Great progress! To improve your code further, consider these optimization techniques...",
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const userMessage = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsTyping(true);

      // Simulate AI response delay
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          sender: 'AI Assistant',
          message: simulateAIResponse(newMessage),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
        <div className="animate-pulse">
          <div className="border rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
      <div className="border rounded-lg">
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.isOwn 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-purple-100 text-purple-900 border border-purple-200'
              }`}>
                {!msg.isOwn && (
                  <div className="flex items-center mb-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    <p className="text-xs font-medium opacity-75">{msg.sender}</p>
                  </div>
                )}
                <p className="text-sm">{msg.message}</p>
                <p className={`text-xs mt-1 ${msg.isOwn ? 'text-blue-100' : 'text-purple-600'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-purple-100 text-purple-900 border border-purple-200 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-xs font-medium">AI Assistant is typing</span>
                  <div className="flex space-x-1 ml-2">
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="border-t p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask me anything about coding, projects, or learning..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}