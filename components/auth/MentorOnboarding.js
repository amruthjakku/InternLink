'use client';

import { useState } from 'react';

export default function MentorOnboarding({ onComplete, onBack, userInfo, demoMode = false }) {
  const [formData, setFormData] = useState({
    collegeName: '',
    collegeDescription: '',
    collegeLocation: '',
    collegeWebsite: '',
    cohortName: '',
    cohortDescription: '',
    startDate: '',
    endDate: '',
    maxInterns: 20
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.collegeName.trim()) {
      newErrors.collegeName = 'College name is required';
    }
    
    if (!formData.cohortName.trim()) {
      newErrors.cohortName = 'Cohort name is required';
    }
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (formData.maxInterns < 1 || formData.maxInterns > 100) {
      newErrors.maxInterns = 'Max interns must be between 1 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (demoMode) {
        // In demo mode, just simulate the process
        await new Promise(resolve => setTimeout(resolve, 1000));
        await onComplete({
          collegeId: 'demo_college_1',
          cohortId: 'demo_cohort_1'
        });
        return;
      }

      // First create the college
      const collegeResponse = await fetch('/api/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.collegeName,
          description: formData.collegeDescription,
          location: formData.collegeLocation,
          website: formData.collegeWebsite
        }),
      });

      const collegeResult = await collegeResponse.json();
      
      if (!collegeResult.success) {
        throw new Error(collegeResult.error || 'Failed to create college');
      }

      // Then create the cohort
      const cohortResponse = await fetch('/api/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.cohortName,
          description: formData.cohortDescription,
          collegeId: collegeResult.collegeId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          maxInterns: parseInt(formData.maxInterns)
        }),
      });

      const cohortResult = await cohortResponse.json();
      
      if (!cohortResult.success) {
        throw new Error(cohortResult.error || 'Failed to create cohort');
      }

      // Complete onboarding
      await onComplete({
        collegeId: collegeResult.collegeId,
        cohortId: cohortResult.cohortId
      });
      
    } catch (error) {
      console.error('Error during mentor onboarding:', error);
      alert(error.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <span className="mr-2">←</span>
            Back to role selection
          </button>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mentor Setup
          </h2>
          <p className="text-gray-600">
            Create your college and first cohort to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* College Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
              College Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Name *
                </label>
                <input
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.collegeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Sreenidhi Institute of Science and Technology"
                />
                {errors.collegeName && (
                  <p className="text-red-500 text-sm mt-1">{errors.collegeName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="collegeLocation"
                  value={formData.collegeLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Hyderabad, Telangana"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="collegeDescription"
                value={formData.collegeDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of your college..."
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website (optional)
              </label>
              <input
                type="url"
                name="collegeWebsite"
                value={formData.collegeWebsite}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.edu"
              />
            </div>
          </div>

          {/* Cohort Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
              First Cohort
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  name="cohortName"
                  value={formData.cohortName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cohortName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Summer 2025 Batch"
                />
                {errors.cohortName && (
                  <p className="text-red-500 text-sm mt-1">{errors.cohortName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Interns
                </label>
                <input
                  type="number"
                  name="maxInterns"
                  value={formData.maxInterns}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maxInterns ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxInterns && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxInterns}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="cohortDescription"
                value={formData.cohortDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description of this cohort..."
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {loading ? 'Creating...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}