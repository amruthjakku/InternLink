import React, { useEffect, useRef } from 'react';

export default function UserModal({
  isOpen,
  isEditMode,
  editFormData,
  setEditFormData,
  colleges,
  mentors,
  cohorts,
  onClose,
  onSave,
  selectedUser,
  activityLogs,
}) {
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormFieldChange = (field, value) => {
    setEditFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // If college or role changes, clear assignedMentor
      if ((field === 'college' || field === 'role') && updated.role === 'intern') {
        updated.assignedMentor = '';
      }
      return updated;
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(editFormData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isEditMode ? (selectedUser ? 'Edit User' : `Add New ${editFormData.role ? editFormData.role.charAt(0).toUpperCase() + editFormData.role.slice(1) : 'User'}`) : selectedUser?.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6">
          {isEditMode ? (
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    ref={nameInputRef}
                    value={editFormData.name || ''}
                    onChange={e => handleFormFieldChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={e => handleFormFieldChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitLab Username *
                  </label>
                  <input
                    type="text"
                    value={editFormData.gitlabUsername || ''}
                    onChange={e => handleFormFieldChange('gitlabUsername', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="gitlab.username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={editFormData.role || 'intern'}
                    onChange={e => handleFormFieldChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="intern">Intern</option>
                    <option value="mentor">Mentor</option>
                    <option value="super-mentor">Super Mentor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College *
                  </label>
                  <select
                    value={editFormData.college || ''}
                    onChange={e => handleFormFieldChange('college', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.id || college._id} value={college.name || college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={editFormData.status || 'active'}
                    onChange={e => handleFormFieldChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {editFormData.role === 'intern' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Mentor *
                      </label>
                      <select
                        value={editFormData.assignedMentor || ''}
                        onChange={e => handleFormFieldChange('assignedMentor', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Mentor</option>
                        {mentors.map(mentor => (
                          <option key={mentor.id || mentor._id} value={mentor.id || mentor._id}>
                            {mentor.name} ({mentor.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assigned Cohort
                      </label>
                      <select
                        value={editFormData.cohort || ''}
                        onChange={e => handleFormFieldChange('cohort', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Cohort</option>
                        {cohorts && cohorts.map(cohort => (
                          <option key={cohort.id || cohort._id} value={cohort.id || cohort._id}>
                            {cohort.name} ({cohort.currentInterns || 0}/{cohort.maxInterns || 'unlimited'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>{selectedUser ? 'Update User' : 'Create User'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ...view mode, not needed for creation... */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 