'use client';

import { useState, useEffect } from 'react';

export function IPManagement() {
  const [authorizedIPs, setAuthorizedIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIP, setNewIP] = useState({
    ip: '',
    description: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAuthorizedIPs();
  }, []);

  const fetchAuthorizedIPs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/authorized-ips');
      if (response.ok) {
        const data = await response.json();
        setAuthorizedIPs(data.authorizedIPs || []);
      }
    } catch (error) {
      console.error('Error fetching authorized IPs:', error);
      setError('Failed to fetch authorized IPs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/authorized-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIP),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('IP address added successfully');
        setNewIP({ ip: '', description: '', location: '' });
        setShowAddModal(false);
        fetchAuthorizedIPs();
      } else {
        setError(data.error || 'Failed to add IP address');
      }
    } catch (error) {
      console.error('Error adding IP:', error);
      setError('Network error occurred');
    }
  };

  const handleToggleIP = async (ipId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/authorized-ips', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipId,
          isActive: !currentStatus
        }),
      });

      if (response.ok) {
        fetchAuthorizedIPs();
        setSuccess(`IP ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update IP status');
      }
    } catch (error) {
      console.error('Error updating IP:', error);
      setError('Network error occurred');
    }
  };

  const handleDeleteIP = async (ipId) => {
    if (!confirm('Are you sure you want to delete this IP address?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/authorized-ips?id=${ipId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAuthorizedIPs();
        setSuccess('IP address deleted successfully');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete IP address');
      }
    } catch (error) {
      console.error('Error deleting IP:', error);
      setError('Network error occurred');
    }
  };

  const validateIP = (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🛡️ Authorized IP Management</h2>
          <p className="text-gray-600 mt-1">
            Manage IP addresses that are authorized for attendance marking
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New IP
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-700">{success}</div>
        </div>
      )}

      {/* IP List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Authorized IP Addresses</h3>
          <p className="text-sm text-gray-600 mt-1">
            Total: {authorizedIPs.length} IPs ({authorizedIPs.filter(ip => ip.isActive).length} active)
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        ) : authorizedIPs.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🌐</div>
            <div className="text-lg font-medium text-gray-900 mb-2">No Authorized IPs</div>
            <div className="text-gray-600">Add IP addresses to allow attendance marking from specific networks.</div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {authorizedIPs.map((ipRecord) => (
              <div key={ipRecord._id || ipRecord.ip} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        ipRecord.isActive ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div className="font-mono text-lg font-medium text-gray-900">
                        {ipRecord.ip}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ipRecord.source === 'environment' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ipRecord.source === 'environment' ? 'Environment' : 'Database'}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <div>{ipRecord.description}</div>
                      {ipRecord.location && (
                        <div className="mt-1">📍 {ipRecord.location}</div>
                      )}
                      <div className="mt-1 text-xs">
                        Added by {ipRecord.addedBy} on {new Date(ipRecord.addedAt).toLocaleDateString()}
                        {ipRecord.updatedAt && (
                          <span> • Updated {new Date(ipRecord.updatedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {ipRecord.source !== 'environment' && (
                      <>
                        <button
                          onClick={() => handleToggleIP(ipRecord._id, ipRecord.isActive)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            ipRecord.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {ipRecord.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteIP(ipRecord._id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    
                    {ipRecord.source === 'environment' && (
                      <div className="text-sm text-gray-500">
                        Environment IP (cannot modify)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add IP Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Authorized IP</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddIP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address *
                </label>
                <input
                  type="text"
                  value={newIP.ip}
                  onChange={(e) => setNewIP(prev => ({ ...prev, ip: e.target.value }))}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {newIP.ip && !validateIP(newIP.ip) && (
                  <div className="text-red-600 text-sm mt-1">Invalid IP address format</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newIP.description}
                  onChange={(e) => setNewIP(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Office Wi-Fi Network"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newIP.location}
                  onChange={(e) => setNewIP(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Main Office, Building A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newIP.ip || !validateIP(newIP.ip)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add IP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div className="text-yellow-800 text-sm">
            <div className="font-medium mb-1">Security Notice</div>
            <ul className="space-y-1 text-xs">
              <li>• Only add IP addresses from trusted networks</li>
              <li>• Environment IPs are configured in the server environment and cannot be modified here</li>
              <li>• Deactivated IPs will not allow attendance marking</li>
              <li>• Regularly review and update authorized IP addresses</li>
              <li>• Contact system administrator for environment IP changes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}