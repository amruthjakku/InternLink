'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  useEffect(() => {
    setCategories(mockData.categories);
    setTasks(mockData.tasks);
  }, []);

  const getCategoryStats = (categoryId) => {
    const categoryTasks = tasks.filter(task => task.category_id === categoryId);
    const completedTasks = categoryTasks.filter(task => task.status === 'completed').length;
    const avgCompletion = categoryTasks.length > 0 
      ? categoryTasks.reduce((sum, task) => sum + task.completion_rate, 0) / categoryTasks.length 
      : 0;

    return {
      totalTasks: categoryTasks.length,
      completedTasks,
      avgCompletion: avgCompletion.toFixed(1)
    };
  };

  const CategoryCreationForm = () => {
    if (!showCreateForm && !editingCategory) return null;

    const isEditing = !!editingCategory;
    const formData = editingCategory || { name: '', description: '', color: selectedColor };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {isEditing ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category Name</label>
                <input
                  type="text"
                  defaultValue={formData.name}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., Frontend Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  defaultValue={formData.description}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Describe what this category covers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        (editingCategory?.color || selectedColor) === color 
                          ? 'border-gray-800' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: editingCategory?.color || selectedColor }}
                  />
                  <span className="text-sm text-gray-600">
                    {editingCategory?.color || selectedColor}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const CategoryGrid = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Category Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <span className="mr-2">➕</span>
          Create Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => {
          const stats = getCategoryStats(category.id);
          return (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✏️
                  </button>
                  <button className="text-gray-400 hover:text-red-600">
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{category.description}</p>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Tasks</span>
                  <span className="text-sm font-medium text-gray-900">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Completed</span>
                  <span className="text-sm font-medium text-gray-900">{stats.completedTasks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Avg Completion</span>
                  <span className="text-sm font-medium text-gray-900">{stats.avgCompletion}%</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{stats.avgCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      backgroundColor: category.color,
                      width: `${stats.avgCompletion}%`
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Created {new Date(category.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const CategoryAnalytics = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Category Analytics</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Task Distribution by Category</h4>
          <div className="space-y-3">
            {categories.map(category => {
              const stats = getCategoryStats(category.id);
              const percentage = categories.length > 0 
                ? (stats.totalTasks / tasks.length * 100).toFixed(1)
                : 0;
              
              return (
                <div key={category.id} className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">{category.name}</span>
                      <span className="text-gray-500">{stats.totalTasks} tasks ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ 
                          backgroundColor: category.color,
                          width: `${percentage}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Performance by Category</h4>
          <div className="space-y-4">
            {categories
              .sort((a, b) => {
                const statsA = getCategoryStats(a.id);
                const statsB = getCategoryStats(b.id);
                return parseFloat(statsB.avgCompletion) - parseFloat(statsA.avgCompletion);
              })
              .map((category, index) => {
                const stats = getCategoryStats(category.id);
                return (
                  <div key={category.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 text-center">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                    </div>
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-900">{category.name}</span>
                        <span className="text-gray-500">{stats.avgCompletion}% avg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
            <div className="text-sm text-gray-500">Total Categories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{tasks.length}</div>
            <div className="text-sm text-gray-500">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {categories.length > 0 
                ? (tasks.length / categories.length).toFixed(1)
                : 0}
            </div>
            <div className="text-sm text-gray-500">Avg Tasks/Category</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {tasks.length > 0 
                ? (tasks.reduce((sum, task) => sum + task.completion_rate, 0) / tasks.length).toFixed(1)
                : 0}%
            </div>
            <div className="text-sm text-gray-500">Overall Completion</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <CategoryGrid />
      <CategoryAnalytics />
      <CategoryCreationForm />
    </div>
  );
}