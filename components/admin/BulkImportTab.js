'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../AuthProvider';

export function BulkImportTab() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importType, setImportType] = useState('users'); // users, tasks, attendance

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Please select a valid CSV or Excel file');
      return;
    }

    setError(null);
    await previewFile(file);
  };

  const previewFile = async (file) => {
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);
      formData.append('preview', 'true');

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setShowPreview(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to preview file');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      setError('Failed to preview file');
    } finally {
      setImporting(false);
    }
  };

  const handleImport = async () => {
    if (!previewData) return;

    setImporting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: previewData.data,
          importType,
          preview: false
        })
      });

      if (response.ok) {
        const results = await response.json();
        setImportResults(results);
        setShowPreview(false);
        setPreviewData(null);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      setError('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = (type) => {
    const templates = {
      users: {
        filename: 'users_template.csv',
        headers: ['gitlabUsername', 'name', 'email', 'role', 'college', 'cohort'],
        sample: [
          'john_doe', 'John Doe', 'john@example.com', 'intern', 'MIT', 'Batch 2024'
        ]
      },
      tasks: {
        filename: 'tasks_template.csv',
        headers: ['title', 'description', 'type', 'priority', 'category', 'cohort', 'dueDate', 'estimatedHours'],
        sample: [
          'Complete React Tutorial', 'Build a simple React app', 'assignment', 'medium', 'Frontend', 'Batch 2024', '2024-12-31', '8'
        ]
      },
      attendance: {
        filename: 'attendance_template.csv',
        headers: ['gitlabUsername', 'date', 'status', 'checkInTime', 'checkOutTime'],
        sample: [
          'john_doe', '2024-01-15', 'present', '09:00', '17:00'
        ]
      }
    };

    const template = templates[type];
    if (!template) return;

    const csvContent = [
      template.headers.join(','),
      template.sample.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getImportTypeDescription = (type) => {
    switch (type) {
      case 'users':
        return 'Import users with their roles, colleges, and cohort assignments';
      case 'tasks':
        return 'Import tasks and assign them to cohorts';
      case 'attendance':
        return 'Import attendance records for users';
      default:
        return '';
    }
  };

  const renderPreviewTable = () => {
    if (!previewData || !previewData.data || previewData.data.length === 0) {
      return null;
    }

    const headers = Object.keys(previewData.data[0]);
    const rows = previewData.data.slice(0, 10); // Show first 10 rows

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[header] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {previewData.data.length > 10 && (
          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
            Showing 10 of {previewData.data.length} rows
          </div>
        )}
      </div>
    );
  };

  // Check if user has permission (admin or super-mentor)
  if (!user || (user.role !== 'admin' && user.role !== 'super-mentor')) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">🚫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only admins and super-mentors can access bulk import functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bulk Import</h3>
            <p className="text-sm text-gray-600">Import data from CSV or Excel files</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.role === 'admin' ? '👑 Admin' : '🌟 Super-Mentor'}
            </span>
          </div>
        </div>

        {/* Import Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'users', name: 'Users', icon: '👥', description: 'Import user accounts' },
              { id: 'tasks', name: 'Tasks', icon: '📝', description: 'Import tasks for cohorts' },
              { id: 'attendance', name: 'Attendance', icon: '📍', description: 'Import attendance records' }
            ].map((type) => (
              <div
                key={type.id}
                onClick={() => setImportType(type.id)}
                className={`cursor-pointer p-4 border-2 rounded-lg transition-colors ${
                  importType === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{type.name}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {getImportTypeDescription(importType)}
          </p>
        </div>

        {/* Template Download */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Download Template</h4>
              <p className="text-sm text-blue-700">
                Download a template file to see the required format for {importType} import
              </p>
            </div>
            <button
              onClick={() => downloadTemplate(importType)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
            >
              <span>📥</span>
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File (CSV or Excel)
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    disabled={importing}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">CSV, XLSX, XLS up to 10MB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h4 className="text-red-800 font-medium">Import Error</h4>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Preview Import Data</h3>
              <p className="text-sm text-gray-600">
                Found {previewData.data?.length || 0} records. Review before importing.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{importing ? '⏳' : '✅'}</span>
                <span>{importing ? 'Importing...' : 'Confirm Import'}</span>
              </button>
            </div>
          </div>

          {/* Validation Results */}
          {previewData.validation && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Validation Results</h4>
              <div className="text-sm text-yellow-700">
                <p>✅ Valid records: {previewData.validation.valid}</p>
                <p>⚠️ Invalid records: {previewData.validation.invalid}</p>
                {previewData.validation.errors?.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Errors found:</p>
                    <ul className="list-disc ml-4 mt-1">
                      {previewData.validation.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {previewData.validation.errors.length > 5 && (
                        <li>... and {previewData.validation.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {renderPreviewTable()}
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResults && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <div className="text-green-400 text-2xl mr-3">✅</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Import Completed</h3>
              <p className="text-sm text-gray-600">Your data has been successfully imported</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{importResults.successful || 0}</div>
              <div className="text-sm text-gray-600">Successfully Imported</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{importResults.failed || 0}</div>
              <div className="text-sm text-gray-600">Failed to Import</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{importResults.skipped || 0}</div>
              <div className="text-sm text-gray-600">Skipped (Duplicates)</div>
            </div>
          </div>

          {importResults.errors && importResults.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Import Errors:</h4>
              <div className="bg-red-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                <ul className="text-sm text-red-700 space-y-1">
                  {importResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setImportResults(null)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Import More Data
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {importing && !showPreview && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Processing file...</span>
          </div>
        </div>
      )}
    </div>
  );
}