'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function CohortAssignmentTab() {
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCohort, setSelectedCohort] = useState('');
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [assigningInterns, setAssigningInterns] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Fetch cohorts
      const cohortsRes = await fetch('/api/admin/cohorts');
      if (!cohortsRes.ok) {
        throw new Error(`Failed to fetch cohorts: ${cohortsRes.status} ${cohortsRes.statusText}`);
      }
      const cohortsData = await cohortsRes.json();
      setCohorts(cohortsData.cohorts || []);
      console.log(`Loaded ${cohortsData.cohorts?.length || 0} cohorts`);
      
      // Fetch interns
      const internsRes = await fetch('/api/admin/users?role=intern');
      if (!internsRes.ok) {
        throw new Error(`Failed to fetch interns: ${internsRes.status} ${internsRes.statusText}`);
      }
      const internsData = await internsRes.json();
      setInterns(internsData.users || []);
      console.log(`Loaded ${internsData.users?.length || 0} interns`);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage(`Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCohortChange = (e) => {
    const cohortId = e.target.value;
    console.log(`Selected cohort ID: ${cohortId}`);
    
    // Verify the cohort exists
    const cohort = cohorts.find(c => c._id === cohortId);
    if (cohort) {
      console.log(`Found cohort: ${cohort.name}`);
    } else {
      console.warn(`Cohort with ID ${cohortId} not found in available cohorts`);
    }
    
    setSelectedCohort(cohortId);
    setSelectedInterns([]);
  };

  const handleInternSelection = (internId) => {
    console.log(`Toggling selection for intern ID: ${internId}`);
    
    // Ensure internId is a string
    const internIdStr = String(internId);
    
    setSelectedInterns(prev => {
      if (prev.includes(internIdStr)) {
        console.log(`Removing intern ID ${internIdStr} from selection`);
        return prev.filter(id => id !== internIdStr);
      } else {
        console.log(`Adding intern ID ${internIdStr} to selection`);
        return [...prev, internIdStr];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedInterns.length === filteredInterns.length) {
      console.log('Deselecting all interns');
      setSelectedInterns([]);
    } else {
      // Ensure all IDs are strings
      const internIds = filteredInterns.map(intern => String(intern._id));
      console.log(`Selecting all ${internIds.length} interns`);
      setSelectedInterns(internIds);
    }
  };

  const handleAssignInterns = async () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    
    // Validation
    if (!selectedCohort) {
      setErrorMessage('❌ Please select a cohort first');
      return;
    }
    
    if (selectedInterns.length === 0) {
      setErrorMessage('❌ Please select at least one intern to assign');
      return;
    }

    // Find the selected cohort to verify it exists
    const cohortObj = cohorts.find(c => c._id === selectedCohort);
    if (!cohortObj) {
      setErrorMessage('Selected cohort not found. Please refresh the page and try again.');
      return;
    }

    // Verify selected interns exist
    const validInterns = selectedInterns.filter(internId => 
      interns.some(intern => intern._id === internId)
    );
    
    if (validInterns.length !== selectedInterns.length) {
      setErrorMessage(`Some selected interns are invalid. Found ${validInterns.length} out of ${selectedInterns.length}`);
      return;
    }

    setAssigningInterns(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log(`🎯 Assigning ${selectedInterns.length} interns to cohort "${cohortObj.name}" (${selectedCohort})`);
      
      // Log the exact data being sent
      const requestData = {
        cohortId: selectedCohort,
        userIds: selectedInterns,
        action: 'assign'
      };
      console.log('Request data:', requestData);
      
      const response = await fetch('/api/admin/cohorts/assign-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('Assignment result:', result);

      if (response.ok) {
        const { summary, results } = result;
        
        // Handle both 'successful' and 'success' properties for backward compatibility
        const successfulCount = summary?.successful || summary?.success || results?.success?.length || 0;
        const failedCount = summary?.failed || results?.failed?.length || 0;
        const skippedCount = summary?.skipped || results?.skipped?.length || 0;
        
        let message = `Assignment completed: ${successfulCount} successful`;
        if (failedCount > 0) message += `, ${failedCount} failed`;
        if (skippedCount > 0) message += `, ${skippedCount} skipped`;
        
        setSuccessMessage(message);
        
        // Show detailed results if there were failures or skips
        if (failedCount > 0 || skippedCount > 0) {
          console.log('Detailed results:', results);
          
          const failedUsers = (results?.failed || []).map(f => f.username || f.userId).join(', ');
          const skippedUsers = (results?.skipped || []).map(s => s.username || s.userId).join(', ');
          
          let detailMessage = '';
          if (failedUsers) detailMessage += `Failed: ${failedUsers}. `;
          if (skippedUsers) detailMessage += `Skipped: ${skippedUsers}.`;
          
          if (detailMessage) {
            setErrorMessage(detailMessage);
          }
        }
        
        // Clear selections and refresh data
        setSelectedInterns([]);
        await fetchData();
        
      } else {
        const errorMsg = result?.error || result?.details || 'Failed to assign interns to cohort';
        setErrorMessage(`❌ Assignment failed: ${errorMsg}`);
        console.error('❌ Assignment failed with status:', response.status, result);
        
        // Log additional details for debugging
        console.error('Request was:', {
          cohortId: selectedCohort,
          userIds: selectedInterns,
          action: 'assign'
        });
      }
    } catch (error) {
      console.error('Error assigning interns:', error);
      let errorMsg = 'Assignment failed: ';
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMsg += 'Network connection failed. Please check your connection and try again.';
      } else if (error.message.includes('JSON')) {
        errorMsg += 'Server response was invalid. Please try again or contact support.';
      } else {
        errorMsg += error.message || 'Unknown error occurred';
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setAssigningInterns(false);
    }
  };

  // Filter interns based on search term
  const filteredInterns = interns.filter(intern => {
    const searchLower = searchTerm.toLowerCase();
    return (
      intern.name.toLowerCase().includes(searchLower) ||
      intern.email?.toLowerCase().includes(searchLower) ||
      intern.gitlabUsername.toLowerCase().includes(searchLower)
    );
  });

  // Get cohort name by ID
  const getCohortName = (cohortId) => {
    if (!cohortId) return 'Not Assigned';
    const cohort = cohorts.find(c => c._id === cohortId);
    return cohort ? cohort.name : 'Unknown Cohort';
  };
  
  // Debug function to log intern and cohort data
  const logInternData = (e) => {
    e.preventDefault();
    console.log('Available cohorts:', cohorts);
    console.log('Interns:', interns);
    console.log('Selected cohort:', selectedCohort);
    console.log('Selected interns:', selectedInterns);
    
    // Get more details about the selected cohort
    const selectedCohortObj = cohorts.find(c => c._id === selectedCohort);
    console.log('Selected cohort details:', selectedCohortObj);
    
    // Get details about selected interns
    const selectedInternsDetails = interns.filter(intern => selectedInterns.includes(intern._id));
    console.log('Selected interns details:', selectedInternsDetails);
    
    // Show alert with summary
    alert(`Debug Info:
- ${cohorts.length} cohorts available
- ${interns.length} interns loaded
- Selected cohort: ${selectedCohort ? selectedCohort : 'None'}
- Selected cohort name: ${selectedCohortObj ? selectedCohortObj.name : 'None'}
- ${selectedInterns.length} interns selected
- First intern ID: ${selectedInterns.length > 0 ? selectedInterns[0] : 'None'}`);
    
    // Test the API directly
    if (selectedCohort && selectedInterns.length > 0) {
      fetch('/api/admin/assign-intern-cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internId: selectedInterns[0],
          cohortId: selectedCohort
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('API test response:', data);
        alert(`API Test Response: ${JSON.stringify(data)}`);
      })
      .catch(error => {
        console.error('API test error:', error);
        alert(`API Test Error: ${error.message}`);
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Cohort Assignment</h3>
            <p className="text-sm text-gray-600">Assign interns to cohorts to give them access to cohort tasks</p>
          </div>
          <div>
            <button 
              onClick={logInternData}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
            >
              Debug Info
            </button>
            <button 
              onClick={fetchData}
              className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Cohort Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Cohort</label>
          <select
            value={selectedCohort || ""}
            onChange={handleCohortChange}
            className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-md"
          >
            <option value="">-- Select a Cohort --</option>
            {cohorts.map(cohort => (
              <option key={cohort._id} value={cohort._id}>
                {cohort.name} ({cohort.currentInterns || 0}/{cohort.maxInterns || 'unlimited'})
              </option>
            ))}
          </select>
          {selectedCohort && (
            <div className="mt-1 text-xs text-gray-500">
              Selected cohort ID: {selectedCohort}
            </div>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        {/* Intern Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Interns</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or username"
            className="border border-gray-300 rounded-md px-3 py-2 w-full"
          />
        </div>

        {/* Intern List */}
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedInterns.length === filteredInterns.length && filteredInterns.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select All ({filteredInterns.length})
              </span>
            </div>
            <button
              onClick={handleAssignInterns}
              disabled={selectedInterns.length === 0 || !selectedCohort || assigningInterns}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assigningInterns ? 'Assigning...' : `Assign ${selectedInterns.length} Intern(s)`}
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredInterns.length === 0 ? (
              <div className="px-4 py-3 text-center text-gray-500">
                No interns found matching your search
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      GitLab Username
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Cohort
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInterns.map(intern => (
                    <tr key={intern._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedInterns.includes(String(intern._id))}
                          onChange={() => handleInternSelection(String(intern._id))}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <div className="text-xs text-gray-400 mt-1">{String(intern._id)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                        <div className="text-sm text-gray-500">{intern.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {intern.gitlabUsername}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          intern.cohortId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {intern.cohortId ? getCohortName(intern.cohortId) : 'Not Assigned'}
                        </span>
                        {intern.cohortId && selectedCohort && intern.cohortId === selectedCohort && (
                          <span className="ml-2 text-xs text-blue-600">(Current selection)</span>
                        )}
                        {intern.cohortId && selectedCohort && intern.cohortId !== selectedCohort && (
                          <span className="ml-2 text-xs text-orange-600">(Will be reassigned)</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}