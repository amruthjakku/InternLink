// Utility functions for the application

/**
 * Safely render college name from college object or string
 * @param {Object|string} college - College object or string
 * @returns {string} College name
 */
export function getCollegeName(college) {
  if (!college) return '';
  return typeof college === 'object' ? college.name : college;
}

/**
 * Safely render college location from college object
 * @param {Object|string} college - College object or string
 * @returns {string} College location
 */
export function getCollegeLocation(college) {
  if (!college || typeof college !== 'object') return '';
  return college.location || '';
}

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString();
}

/**
 * Format time to readable string
 * @param {string|Date} time - Time to format
 * @returns {string} Formatted time
 */
export function formatTime(time) {
  if (!time) return '';
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, length = 50) {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Calculate completion percentage
 * @param {number} completed - Number of completed items
 * @param {number} total - Total number of items
 * @returns {number} Percentage
 */
export function calculatePercentage(completed, total) {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/**
 * Get status color class
 * @param {string} status - Status string
 * @returns {string} CSS class
 */
export function getStatusColor(status) {
  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-orange-100 text-orange-800 border-orange-200',
    not_started: 'bg-gray-100 text-gray-800 border-gray-200',
    done: 'bg-green-100 text-green-800 border-green-200'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get priority color class
 * @param {string} priority - Priority string
 * @returns {string} CSS class
 */
export function getPriorityColor(priority) {
  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  };
  return priorityColors[priority] || 'text-gray-600';
}