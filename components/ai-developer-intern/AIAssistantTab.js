'use client';

import { useState, useEffect, useRef } from 'react';

export function AIAssistantTab({ user, tasks, loading }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage = {
      id: 1,
      sender: 'AI Assistant',
      message: `Hello ${user?.name || 'there'}! I'm your AI assistant. I can help you with:

• Task guidance and best practices
• Code review and debugging tips
• Learning resources and tutorials
• Progress tracking insights
• Career development advice

What would you like to know today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: false,
      type: 'welcome'
    };

    setMessages([welcomeMessage]);

    // Set up suggestions based on user's current tasks
    if (tasks && tasks.length > 0) {
      const currentTasks = tasks.filter(t => t.status === 'in_progress');
      const upcomingTasks = tasks.filter(t => t.status === 'not_started');
      
      const taskSuggestions = [
        `Help me with my current task: ${currentTasks[0]?.title || 'React Tutorial'}`,
        `What should I learn for: ${upcomingTasks[0]?.title || 'Next.js Development'}`,
        'Show me my progress summary',
        'Give me coding best practices',
        'How can I improve my performance?'
      ];

      setSuggestions(taskSuggestions);
    } else {
      setSuggestions([
        'How do I get started with React?',
        'What are the best coding practices?',
        'Help me plan my learning path',
        'How to debug JavaScript code?',
        'Tips for better time management'
      ]);
    }
  }, [user, tasks]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateAIResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Context-aware responses based on user's tasks and progress
    if (lowerMessage.includes('react') || lowerMessage.includes('component')) {
      return `Great question about React! Here are some key points:

🔹 **Components**: Think of them as reusable building blocks
🔹 **State Management**: Use useState for local state, useContext for global state
🔹 **Props**: Pass data down from parent to child components
🔹 **Lifecycle**: useEffect handles side effects and lifecycle events

For your current React task, I recommend:
1. Start with functional components
2. Practice with simple state management
3. Build small projects to reinforce concepts

Would you like me to explain any specific React concept in detail?`;
    }
    
    if (lowerMessage.includes('progress') || lowerMessage.includes('performance')) {
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const totalTasks = tasks?.length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
      
      return `Here's your current progress summary:

📊 **Overall Progress**: ${completionRate}% (${completedTasks}/${totalTasks} tasks)
🎯 **Current Focus**: ${tasks?.find(t => t.status === 'in_progress')?.title || 'No active tasks'}
⏰ **Time Spent**: ${tasks?.reduce((sum, t) => sum + (t.time_spent || 0), 0) || 0} hours total

**Recommendations**:
• Keep up the consistent work pattern
• Focus on completing current tasks before starting new ones
• Consider breaking down larger tasks into smaller chunks

What specific area would you like to improve?`;
    }
    
    if (lowerMessage.includes('debug') || lowerMessage.includes('error') || lowerMessage.includes('bug')) {
      return `Here's a systematic approach to debugging:

🔍 **Step-by-Step Debugging**:
1. **Read the error message carefully** - it often tells you exactly what's wrong
2. **Check the console** - look for red error messages or warnings
3. **Use console.log()** - add logging to track variable values
4. **Check your syntax** - missing brackets, semicolons, or typos
5. **Verify data types** - ensure you're working with the expected data

🛠️ **Common JavaScript Issues**:
• Undefined variables or functions
• Async/await timing problems
• Incorrect array/object access
• Missing imports or exports

**Pro Tips**:
• Use browser dev tools (F12)
• Break down complex code into smaller functions
• Test one thing at a time

What specific error are you encountering?`;
    }
    
    if (lowerMessage.includes('learn') || lowerMessage.includes('study') || lowerMessage.includes('tutorial')) {
      return `Here's a personalized learning path based on your current tasks:

📚 **Recommended Learning Sequence**:

**Frontend Development**:
1. HTML/CSS fundamentals
2. JavaScript ES6+ features
3. React.js basics → advanced patterns
4. State management (Context API, Redux)
5. Next.js for full-stack development

**Backend Development**:
1. Node.js and Express.js
2. Database design (SQL/NoSQL)
3. API development and testing
4. Authentication and security

**Best Learning Resources**:
• MDN Web Docs (comprehensive reference)
• React official documentation
• FreeCodeCamp (hands-on projects)
• YouTube tutorials for visual learning

**Study Tips**:
• Code along with tutorials
• Build projects to practice
• Join developer communities
• Review code regularly

What specific technology would you like to focus on?`;
    }
    
    if (lowerMessage.includes('time') || lowerMessage.includes('manage') || lowerMessage.includes('productivity')) {
      return `Here are proven time management strategies for developers:

⏰ **Time Management Techniques**:

**Pomodoro Technique**:
• 25 minutes focused work
• 5 minute break
• Longer break after 4 cycles

**Task Prioritization**:
• High impact, urgent tasks first
• Break large tasks into smaller ones
• Set realistic daily goals

**Coding Productivity Tips**:
• Use code snippets and templates
• Learn keyboard shortcuts
• Set up efficient development environment
• Minimize context switching

**Daily Routine**:
1. Review tasks and priorities
2. Tackle hardest problems when fresh
3. Regular breaks to avoid burnout
4. End-of-day reflection and planning

**Tools to Help**:
• Time tracking apps
• Task management tools
• Code editors with good extensions
• Focus apps to block distractions

How do you currently manage your development time?`;
    }
    
    // Default helpful response
    return `I'd be happy to help you with that! Based on your current progress, here are some suggestions:

💡 **Quick Tips**:
• Break down complex problems into smaller steps
• Don't hesitate to ask for help when stuck
• Practice coding regularly, even if just 30 minutes daily
• Review and refactor your code for better understanding

🎯 **Focus Areas**:
• Complete your current tasks before starting new ones
• Document your learning process
• Build a portfolio of your projects
• Connect with other developers for support

Could you be more specific about what you'd like help with? I can provide more targeted advice based on your exact needs.`;
  };

  const handleSendMessage = async (e, messageText = null) => {
    e?.preventDefault();
    const messageToSend = messageText || newMessage;
    
    if (messageToSend.trim()) {
      const userMessage = {
        id: Date.now(),
        sender: user?.name || 'You',
        message: messageToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      setIsTyping(true);

      // Simulate AI thinking time
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          sender: 'AI Assistant',
          message: generateAIResponse(messageToSend),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: false,
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 2000);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(null, suggestion);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
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
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Assistant Info */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
            <p className="text-gray-600">Your personal coding mentor and learning companion</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <span className="text-purple-500 mr-2">💡</span>
            <span>Personalized guidance</span>
          </div>
          <div className="flex items-center">
            <span className="text-purple-500 mr-2">📚</span>
            <span>Learning resources</span>
          </div>
          <div className="flex items-center">
            <span className="text-purple-500 mr-2">🎯</span>
            <span>Progress insights</span>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200 hover:border-purple-300"
              >
                <span className="text-purple-500 mr-2">💬</span>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow" style={{ height: '500px' }}>
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-purple-50">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                🤖
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Assistant</h3>
                <p className="text-sm text-gray-500">Always here to help you learn and grow</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                  msg.isOwn 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-purple-100 text-purple-900 border border-purple-200'
                }`}>
                  {!msg.isOwn && (
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                      <p className="text-xs font-medium opacity-75">{msg.sender}</p>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-line">{msg.message}</div>
                  <p className={`text-xs mt-2 ${msg.isOwn ? 'text-blue-100' : 'text-purple-600'}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-purple-100 text-purple-900 border border-purple-200 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span className="text-xs font-medium">AI Assistant is thinking</span>
                    <div className="flex space-x-1">
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

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask me anything about coding, learning, or your progress..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !newMessage.trim()}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Be specific about what you need help with for better assistance
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}