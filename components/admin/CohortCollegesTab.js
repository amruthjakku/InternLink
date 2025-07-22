'use client';

import { useState, useEffect } from 'react';

export function CohortCollegesTab() {
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableColleges, setAvailableColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cohorts-colleges');
      if (response.ok) {
        const data = await response.json();
        setCohorts(data.cohorts || []);
        setAvailableColleges(data.colleges || []);
      } else {
        console.error('Failed to fetch cohorts-colleges data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCohortSelect = (cohort) => {
    setSelectedCohort(selectedCohort?._id === cohort._id ? null : cohort);
  };

  const handleAssignColleges = async (action = 'assign') => {
    if (!selectedCohort || selectedColleges.length === 0) return;

    try {
      const response = await fetch('/api/admin/cohorts-colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cohortId: selectedCohort._id,
          collegeIds: selectedColleges,
          action
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${action === 'assign' ? 'Assigned' : 'Unassigned'} ${result.assignedUsers?.length || result.unassignedUsers?.length || 0} users successfully!`);
        fetchData();
        setShowAssignModal(false);
        setSelectedColleges([]);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error managing assignments:', error);
      alert('Failed to manage assignments');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          setImportData(content);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // For Excel files, we'll need to parse them differently
          // For now, show an alert asking to convert to CSV
          alert('Please convert Excel file to CSV format or copy-paste the data below');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      alert('Please paste CSV data or upload a CSV file');
      return;
    }

    try {
      // Parse CSV data with better handling for quoted values
      const lines = importData.trim().split('\n');
      const headers = parseCSVLine(lines[0]);
      
      if (!headers.includes('cohortName') || !headers.includes('collegeName')) {
        alert('CSV must include cohortName and collegeName columns');
        return;
      }

      const assignments = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) { // Skip empty lines
          const values = parseCSVLine(lines[i]);
          const assignment = {};
          headers.forEach((header, index) => {
            assignment[header] = values[index] || '';
          });
          assignments.push(assignment);
        }
      }

      if (assignments.length === 0) {
        alert('No valid data found in CSV');
        return;
      }

      const response = await fetch('/api/admin/import-college-cohort', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments }),
      });

      if (response.ok) {
        const result = await response.json();
        setImportResults(result.results);
        fetchData();
        setImportData('');
        setImportFile(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data');
    }
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const downloadTemplate = async (format = 'csv') => {
    try {
      const response = await fetch('/api/admin/import-college-cohort');
      if (response.ok) {
        const template = await response.json();
        
        if (format === 'csv') {
          // Create CSV content
          const csvHeaders = template.headers.join(',');
          const csvRows = template.sampleData.map(row => 
            template.headers.map(header => `"${row[header] || ''}"`)
          ).join('\n');
          const csvContent = `${csvHeaders}\n${csvRows}`;
          
          // Download CSV file
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'college-cohort-import-template.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else if (format === 'excel') {
          // Create simple Excel-like content (Tab-separated for Excel compatibility)
          const excelHeaders = template.headers.join('\t');
          const excelRows = template.sampleData.map(row => 
            template.headers.map(header => row[header] || '').join('\t')
          ).join('\n');
          const excelContent = `${excelHeaders}\n${excelRows}`;
          
          // Download as .txt file that can be imported into Excel
          const blob = new Blob([excelContent], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = 'college-cohort-import-template.txt';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          alert('Downloaded as tab-separated file. Open in Excel and use "Data > Text to Columns" to format properly.');
        }
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const filteredCohorts = cohorts.filter(cohort =>
    cohort.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cohort.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h3 className="text-lg font-semibold text-gray-900">Cohort Colleges Management</h3>
            <p className="text-sm text-gray-600">View and manage colleges assigned to cohorts</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={!selectedCohort}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                selectedCohort 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="mr-2">🏫</span>
              Manage Colleges
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
              <span className="mr-2">📥</span>
              Import CSV
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search cohorts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
        </div>
      </div>

      {/* Cohorts List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCohorts.map((cohort) => (
          <div 
            key={cohort._id} 
            className={`bg-white rounded-xl shadow-sm border p-6 cursor-pointer transition-all ${
              selectedCohort?._id === cohort._id 
                ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleCohortSelect(cohort)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{cohort.name}</h4>
                <p className="text-sm text-gray-600">{cohort.description}</p>
              </div>
              {selectedCohort?._id === cohort._id && (
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="bg-blue-50 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">{cohort.colleges?.length || 0}</div>
                <div className="text-xs text-gray-600">Colleges</div>
              </div>
              <div className="bg-green-50 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">{cohort.totalAIDeveloperInterns || 0}</div>
                <div className="text-xs text-gray-600">AI Developer Interns</div>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">{cohort.totalTechLeads || 0}</div>
                <div className="text-xs text-gray-600">Tech Leads</div>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg text-center">
                <div className="text-lg font-bold text-orange-600">{cohort.totalUsers || 0}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>

            {/* Colleges List */}
            {cohort.colleges && cohort.colleges.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-900">Assigned Colleges:</h5>
                {cohort.colleges.slice(0, 3).map((collegeGroup, index) => (
                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span className="font-medium">{collegeGroup.college.name}</span>
                    <div className="flex space-x-2 text-xs">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {collegeGroup.interns} interns
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        {collegeGroup.mentors} mentors
                      </span>
                    </div>
                  </div>
                ))}
                {cohort.colleges.length > 3 && (
                  <div className="text-sm text-gray-500">
                    +{cohort.colleges.length - 3} more colleges
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <div className="text-3xl mb-2">🏫</div>
                <p className="text-sm">No colleges assigned</p>
              </div>
            )}

            {/* Cohort Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Members: {cohort.totalUsers}/{cohort.maxAIDeveloperInterns}</span>
                <span>
                  {cohort.startDate && cohort.endDate
                    ? `${new Date(cohort.startDate).toLocaleDateString()} - ${new Date(cohort.endDate).toLocaleDateString()}`
                    : 'No dates set'
                  }
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Cohort Details */}
      {selectedCohort && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedCohort.name} - College Details
          </h3>
          
          {selectedCohort.colleges && selectedCohort.colleges.length > 0 ? (
            <div className="space-y-4">
              {selectedCohort.colleges.map((collegeGroup, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-gray-900">
                      {collegeGroup.college.name}
                    </h4>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {collegeGroup.users.length} users
                      </span>
                    </div>
                  </div>
                  
                  {/* Users List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {collegeGroup.users.map((user) => (
                      <div key={user._id} className="flex items-center space-x-2 text-sm bg-gray-50 p-2 rounded">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">{user.name?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🏫</div>
              <p>No colleges assigned to this cohort</p>
              <p className="text-sm">Click "Manage Colleges" to assign colleges</p>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Import College-Cohort Assignments</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData('');
                  setImportResults(null);
                  setImportFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Upload CSV/Excel with columns: cohortName, collegeName, action
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    📥 CSV Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    📊 Excel Template
                  </button>
                </div>
              </div>

              {/* File Upload Option */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-sm text-gray-600 text-center">
                    Click to upload CSV or Excel file
                    <br />
                    <span className="text-xs text-gray-500">
                      Supports .csv, .xlsx, .xls files
                    </span>
                  </p>
                  {importFile && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ {importFile.name}
                    </div>
                  )}
                </label>
              </div>

              <div className="text-center text-gray-500 text-sm">OR</div>

              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste CSV data here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData('');
                    setImportResults(null);
                    setImportFile(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import
                </button>
              </div>

              {/* Import Results */}
              {importResults && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium">Import Results:</h4>
                  
                  {importResults.successful.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h5 className="text-green-800 font-medium">Successful ({importResults.successful.length})</h5>
                      {importResults.successful.map((result, index) => (
                        <div key={index} className="text-sm text-green-700">
                          {result.action === 'assigned' ? '✅' : '➖'} {result.cohortName} ↔ {result.collegeName} ({result.usersCount} users)
                        </div>
                      ))}
                    </div>
                  )}

                  {importResults.failed.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h5 className="text-red-800 font-medium">Failed ({importResults.failed.length})</h5>
                      {importResults.failed.map((result, index) => (
                        <div key={index} className="text-sm text-red-700">
                          ❌ {result.assignment.cohortName || 'Unknown'} ↔ {result.assignment.collegeName || 'Unknown'}: {result.error}
                        </div>
                      ))}
                    </div>
                  )}

                  {importResults.skipped.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h5 className="text-yellow-800 font-medium">Skipped ({importResults.skipped.length})</h5>
                      {importResults.skipped.map((result, index) => (
                        <div key={index} className="text-sm text-yellow-700">
                          ⚠️ {result.assignment.cohortName || 'Unknown'} ↔ {result.assignment.collegeName || 'Unknown'}: {result.reason}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Colleges Modal */}
      {showAssignModal && selectedCohort && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Colleges for {selectedCohort.name}</h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedColleges([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Colleges:
                </label>
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableColleges.map((college) => (
                    <label key={college._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColleges.includes(college._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColleges([...selectedColleges, college._id]);
                          } else {
                            setSelectedColleges(selectedColleges.filter(id => id !== college._id));
                          }
                        }}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{college.name}</div>
                        <div className="text-sm text-gray-500">{college.location}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedColleges([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignColleges('unassign')}
                  disabled={selectedColleges.length === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Unassign
                </button>
                <button
                  onClick={() => handleAssignColleges('assign')}
                  disabled={selectedColleges.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}