import { useState } from 'react';

/**
 * CollegeLogo Component
 * Displays college logo from website URL with fallback to gradient icon
 * 
 * @param {Object} props
 * @param {Object} props.college - College object with name, website, etc.
 * @param {string} props.size - Size preset: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showName - Whether to show college name alongside logo
 * @param {string} props.fallbackColor - Custom fallback gradient color
 */
export function CollegeLogo({ 
  college, 
  size = 'md', 
  className = '', 
  showName = false, 
  fallbackColor = 'purple' 
}) {
  const [logoError, setLogoError] = useState(false);

  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  // Fallback gradient colors
  const gradientColors = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-purple-500',
    green: 'from-green-500 to-blue-500',
    orange: 'from-orange-500 to-red-500',
    teal: 'from-teal-500 to-cyan-500',
    indigo: 'from-indigo-500 to-blue-500'
  };

  // Get college logo URL from website
  const getCollegeLogo = (website) => {
    if (!website || logoError) return null;
    try {
      const domain = new URL(website).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      return null;
    }
  };

  // Get college name
  const collegeName = college?.name || 'Unknown College';
  
  // Get logo URL
  const logoUrl = getCollegeLogo(college?.website);
  
  // Get size classes
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Get gradient color
  const gradientClass = gradientColors[fallbackColor] || gradientColors.purple;

  // Generate consistent color based on college name for visual consistency
  const getConsistentColor = (name) => {
    if (!name) return 'purple';
    const colors = ['purple', 'blue', 'green', 'orange', 'teal', 'indigo'];
    const index = name.length % colors.length;
    return colors[index];
  };

  const consistentColor = getConsistentColor(collegeName);
  const finalGradient = gradientColors[consistentColor];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClass} rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center bg-white flex-shrink-0`}>
        {logoUrl && !logoError ? (
          <img 
            src={logoUrl} 
            alt={`${collegeName} logo`}
            className="w-full h-full object-contain"
            onError={() => setLogoError(true)}
            onLoad={() => setLogoError(false)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-r ${finalGradient} rounded-xl flex items-center justify-center`}>
            <span className="text-white font-medium">🏫</span>
          </div>
        )}
      </div>
      
      {showName && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{collegeName}</p>
          {college?.location && (
            <p className="text-xs text-gray-500 truncate">{college.location}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CollegeLogoOnly Component
 * Just the logo without any text - useful for inline usage
 */
export function CollegeLogoOnly({ college, size = 'sm', className = '' }) {
  return (
    <CollegeLogo 
      college={college} 
      size={size} 
      className={className}
      showName={false}
    />
  );
}

/**
 * CollegeCard Component
 * Logo with name and optional description
 */
export function CollegeCard({ college, size = 'md', className = '', showLocation = true }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <CollegeLogoOnly college={college} size={size} />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">
          {college?.name || 'Unknown College'}
        </h3>
        {showLocation && college?.location && (
          <p className="text-xs text-gray-500 truncate">{college.location}</p>
        )}
        {college?.description && (
          <p className="text-xs text-gray-600 truncate mt-1">{college.description}</p>
        )}
      </div>
    </div>
  );
}

/**
 * CollegeBadge Component
 * Small badge-style display
 */
export function CollegeBadge({ college, className = '' }) {
  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-full ${className}`}>
      <CollegeLogoOnly college={college} size="xs" />
      <span className="text-xs font-medium text-gray-700 truncate max-w-24">
        {college?.name || 'Unknown'}
      </span>
    </div>
  );
}

export default CollegeLogo;