'use client';

import { useState, useEffect } from 'react';

export default function InternOnboarding({ onComplete, onBack, userInfo, demoMode = false }) {
  const [colleges, setColleges] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [formData, setFormData] = useState({
    selectedCollegeId: '',
    selectedCohortId: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (demoMode) {
      // Load demo colleges
      setColleges([
        {
          _id: 'demo_college_1',
          name: 'Sreenidhi Institute of Science and Technology',
          description: 'Premier engineering college in Hyderabad',
          location: 'Hyderabad, Telangana',
          website: 'https://sreenidhi.edu.in'
        },
        {
          _id: 'demo_college_2',
          name: 'JNTUH College of Engineering',
          description: 'Autonomous engineering college under JNTUH',
          location: 'Hyderabad, Telangana',
          website: 'https://jntuhceh.ac.in'
        }
      ]);
      setLoadingColleges(false);
    } else {
      fetchColleges();
    }
  }, [demoMode]);

  useEffect(() => {
    if (formData.selectedCollegeId) {
      fetchCohorts(formData.selectedCollegeId);
    } else {
      setCohorts([]);
      setFormData(prev => ({ ...prev, selectedCohortId: '' }));
    }
  }, [formData.selectedCollegeId]);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      const data = await response.json();
      
      if (response.ok) {
        setColleges(data.colleges || []);
      } else {
        console.error('Failed to fetch colleges:', data.error);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoadingColleges(false);
    }
  };

  const fetchCohorts = async (collegeId) => {
    try {
      if (demoMode) {
        // Load demo cohorts based on college
        if (collegeId === 'demo_college_1') {
          setCohorts([
            {
              _id: 'demo_cohort_1',
              name: 'Summer 2025 Batch',
              description: 'Summer internship program for 2025',
              startDate: '2025-05-01',
              endDate: '2025-07-31',
              maxInterns: 20,
              currentInterns: 0
            }
          ]);
        } else if (collegeId === 'demo_college_2') {
          setCohorts([
            {
              _id: 'demo_cohort_2',
              name: 'Full Stack Development Cohort',
              description: 'Specialized cohort for full-stack development',
              startDate: '2025-01-15',
              endDate: '2025-06-15',
              maxInterns: 25,
              currentInterns: 0
            }
          ]);
        }
        return;
      }

      const response = await fetch(`/api/cohorts?collegeId=${collegeId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCohorts(data.cohorts || []);
      } else {
        console.error('Failed to fetch cohorts:', data.error);
        setCohorts([]);
      }
    } catch (error) {
      console.error('Error fetching cohorts:', error);
      setCohorts([]);
    }
  };

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
    
    if (!formData.selectedCollegeId) {
      newErrors.selectedCollegeId = 'Please select a college';
    }
    
    if (!formData.selectedCohortId) {
      newErrors.selectedCohortId = 'Please select a cohort';
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
          collegeId: formData.selectedCollegeId,
          cohortId: formData.selectedCohortId,
          joinRequestId: 'demo_request_1'
        });
        return;
      }

      // Submit join request
      const response = await fetch('/api/join-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collegeId: formData.selectedCollegeId,
          cohortId: formData.selectedCohortId,
          message: formData.message
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit join request');
      }

      // Complete onboarding
      await onComplete({
        collegeId: formData.selectedCollegeId,
        cohortId: formData.selectedCohortId,
        joinRequestId: result.requestId
      });
      
    } catch (error) {
      console.error('Error during intern onboarding:', error);
      alert(error.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollege = colleges.find(c => c._id === formData.selectedCollegeId);
  const selectedCohort = cohorts.find(c => c._id === formData.selectedCohortId);

  if (loadingColleges) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading colleges...</p>
          </div>
        </div>
      </div>
    );
  }

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
            Intern Setup
          </h2>
          <p className="text-gray-600">
            Join a college and cohort to start your internship journey
          </p>
        </div>

        {colleges.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Colleges Available</h3>
            <p className="text-gray-600 mb-4">
              There are no colleges set up yet. Please contact a mentor to create a college first.
            </p>
            <button
              onClick={fetchColleges}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* College Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select College *
              </label>
              <select
                name="selectedCollegeId"
                value={formData.selectedCollegeId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.selectedCollegeId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Choose a college...</option>
                {colleges.map(college => (
                  <option key={college._id} value={college._id}>
                    {college.name} {college.location && `- ${college.location}`}
                  </option>
                ))}
              </select>
              {errors.selectedCollegeId && (
                <p className="text-red-500 text-sm mt-1">{errors.selectedCollegeId}</p>
              )}
              
              {selectedCollege && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900">{selectedCollege.name}</h4>
                  {selectedCollege.description && (
                    <p className="text-sm text-gray-600 mt-1">{selectedCollege.description}</p>
                  )}
                  {selectedCollege.website && (
                    <a 
                      href={selectedCollege.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Cohort Selection */}
            {formData.selectedCollegeId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cohort *
                </label>
                {cohorts.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-md">
                    <p className="text-gray-600">No cohorts available for this college</p>
                  </div>
                ) : (
                  <>
                    <select
                      name="selectedCohortId"
                      value={formData.selectedCohortId}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.selectedCohortId ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Choose a cohort...</option>
                      {cohorts.map(cohort => {
                        const availableSpots = (cohort.maxInterns || 0) - (cohort.currentInterns || 0);
                        return (
                          <option 
                            key={cohort._id} 
                            value={cohort._id}
                            disabled={availableSpots <= 0}
                          >
                            {cohort.name} ({availableSpots} spots available)
                          </option>
                        );
                      })}
                    </select>
                    {errors.selectedCohortId && (
                      <p className="text-red-500 text-sm mt-1">{errors.selectedCohortId}</p>
                    )}
                  </>
                )}
                
                {selectedCohort && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md">
                    <h4 className="font-medium text-gray-900">{selectedCohort.name}</h4>
                    {selectedCohort.description && (
                      <p className="text-sm text-gray-600 mt-1">{selectedCohort.description}</p>
                    )}
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      {selectedCohort.startDate && (
                        <p><strong>Start:</strong> {new Date(selectedCohort.startDate).toLocaleDateString()}</p>
                      )}
                      {selectedCohort.endDate && (
                        <p><strong>End:</strong> {new Date(selectedCohort.endDate).toLocaleDateString()}</p>
                      )}
                      <p><strong>Available Spots:</strong> {(selectedCohort.maxInterns || 0) - (selectedCohort.currentInterns || 0)} / {selectedCohort.maxInterns || 0}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Message to Mentor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Mentor (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Introduce yourself or explain why you want to join this cohort..."
              />
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
                disabled={loading || !formData.selectedCollegeId || !formData.selectedCohortId}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? 'Submitting...' : 'Submit Join Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}