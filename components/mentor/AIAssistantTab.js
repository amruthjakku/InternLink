'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function AIAssistantTab() {
  const [aiConfig, setAiConfig] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState('chat');

  useEffect(() => {
    setAiConfig(mockData.aiConfig || {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: 'You are a helpful AI assistant for internship management.',
      custom_instructions: 'Focus on providing educational guidance and technical support.',
      enabled_features: ['code_review', 'task_suggestions', 'progress_analysis'],
      usage_stats: {
        total_queries: 156,
        successful_responses: 148,
        average_response_time: 2.3,
        most_common_topics: ['debugging', 'code_review', 'learning_resources']
      }
    });

    // Mock chat history
    setChatHistory([
      {
        id: 1,
        type: 'user',
        message: 'Can you help me analyze the performance of my interns?',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        type: 'assistant',
        message: 'I\'d be happy to help you analyze intern performance! Based on the current data, I can see that Alice Johnson is performing exceptionally well with a 94.2% performance score, while Bob Smith might benefit from additional support with his 81.7% score. Would you like me to provide specific recommendations for improvement?',
        timestamp: new Date(Date.now() - 3500000).toISOString()
      },
      {
        id: 3,
        type: 'user',
        message: 'Yes, please provide recommendations for Bob.',
        timestamp: new Date(Date.now() - 3400000).toISOString()
      },
      {
        id: 4,
        type: 'assistant',
        message: 'For Bob Smith, I recommend:\n\n1. **Task Management**: He has 5 tasks in progress - consider helping him prioritize\n2. **Mentoring**: Schedule more frequent 1:1 sessions\n3. **Skill Development**: Focus on JavaScript and Node.js based on his current projects\n4. **Peer Learning**: Pair him with Alice for collaborative learning\n\nWould you like me to create a personalized development plan?',
        timestamp: new Date(Date.now() - 3300000).toISOString()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: currentMessage,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'assistant',
        message: generateAIResponse(currentMessage),
        timestamp: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  const generateAIResponse = (userMessage) => {
    const responses = [
      "Based on the current intern data, I can provide you with detailed insights. Would you like me to focus on a specific area?",
      "I've analyzed the performance metrics and can suggest several improvement strategies. Let me break them down for you.",
      "Here are some personalized recommendations based on the intern profiles and their current progress.",
      "I can help you create targeted learning paths for each intern based on their skills and performance data.",
      "Let me provide you with a comprehensive analysis of the current situation and actionable next steps."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const AIChat = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-96">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">Powered by {aiConfig.model}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {chatHistory.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask me anything about your interns..."
            className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  const AIFeatures = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🔍</div>
          <h4 className="font-medium text-gray-900 mb-1">Code Review</h4>
          <p className="text-sm text-gray-600 mb-3">Automated code analysis and suggestions</p>
          <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">📝</div>
          <h4 className="font-medium text-gray-900 mb-1">Task Suggestions</h4>
          <p className="text-sm text-gray-600 mb-3">AI-generated task recommendations</p>
          <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h4 className="font-medium text-gray-900 mb-1">Progress Analysis</h4>
          <p className="text-sm text-gray-600 mb-3">Intelligent performance insights</p>
          <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🎯</div>
          <h4 className="font-medium text-gray-900 mb-1">Learning Paths</h4>
          <p className="text-sm text-gray-600 mb-3">Personalized learning recommendations</p>
          <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <h4 className="font-medium text-gray-900 mb-1">Risk Detection</h4>
          <p className="text-sm text-gray-600 mb-3">Early warning for at-risk interns</p>
          <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">📈</div>
          <h4 className="font-medium text-gray-900 mb-1">Predictive Analytics</h4>
          <p className="text-sm text-gray-600 mb-3">Forecast intern success rates</p>
          <button className="text-sm text-blue-600 hover:text-blue-800">Configure</button>
        </div>
      </div>
    </div>
  );

  const AIConfiguration = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">AI Configuration</h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Model</label>
            <select
              value={aiConfig.model}
              onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="gpt-4">GPT-4 (Recommended)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-2">Claude 2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature ({aiConfig.temperature})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={aiConfig.temperature}
              onChange={(e) => setAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
          <textarea
            rows={3}
            value={aiConfig.system_prompt}
            onChange={(e) => setAiConfig({...aiConfig, system_prompt: e.target.value})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Instructions</label>
          <textarea
            rows={3}
            value={aiConfig.custom_instructions}
            onChange={(e) => setAiConfig({...aiConfig, custom_instructions: e.target.value})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
          <input
            type="number"
            value={aiConfig.max_tokens}
            onChange={(e) => setAiConfig({...aiConfig, max_tokens: parseInt(e.target.value)})}
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Reset to Defaults
          </button>
          <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );

  const UsageStatistics = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Usage Statistics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{aiConfig.usage_stats?.total_queries || 0}</div>
          <div className="text-sm text-gray-500">Total Queries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{aiConfig.usage_stats?.successful_responses || 0}</div>
          <div className="text-sm text-gray-500">Successful Responses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{aiConfig.usage_stats?.average_response_time || 0}s</div>
          <div className="text-sm text-gray-500">Avg Response Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {((aiConfig.usage_stats?.successful_responses || 0) / (aiConfig.usage_stats?.total_queries || 1) * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Success Rate</div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Most Common Topics</h4>
        <div className="space-y-2">
          {aiConfig.usage_stats?.most_common_topics?.map((topic, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900 capitalize">{topic}</span>
                  <span className="text-gray-500">{Math.floor(Math.random() * 50) + 10} queries</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${Math.floor(Math.random() * 80) + 20}%` }}
                  />
                </div>
              </div>
            </div>
          )) || []}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveFeature('chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeFeature === 'chat'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          AI Chat
        </button>
        <button
          onClick={() => setActiveFeature('features')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeFeature === 'features'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Features
        </button>
        <button
          onClick={() => setActiveFeature('config')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeFeature === 'config'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveFeature('stats')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeFeature === 'stats'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Statistics
        </button>
      </div>

      {activeFeature === 'chat' && <AIChat />}
      {activeFeature === 'features' && <AIFeatures />}
      {activeFeature === 'config' && <AIConfiguration />}
      {activeFeature === 'stats' && <UsageStatistics />}
    </div>
  );
}