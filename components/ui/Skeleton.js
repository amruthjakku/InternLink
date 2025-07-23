'use client';

import React from 'react';

// Base skeleton component
export const Skeleton = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded',
  animate = true 
}) => {
  return (
    <div 
      className={`
        ${width} ${height} ${rounded} 
        bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 
        ${animate ? 'animate-pulse' : ''} 
        ${className}
      `}
    />
  );
};

// Card skeleton
export const CardSkeleton = ({ 
  showHeader = true, 
  showContent = true, 
  showFooter = false,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton width="w-10" height="h-10" rounded="rounded-xl" />
            <div className="space-y-2">
              <Skeleton width="w-32" height="h-4" />
              <Skeleton width="w-20" height="h-3" />
            </div>
          </div>
          <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
        </div>
      )}
      
      {showContent && (
        <div className="space-y-3">
          <Skeleton width="w-full" height="h-4" />
          <Skeleton width="w-3/4" height="h-4" />
          <Skeleton width="w-1/2" height="h-4" />
        </div>
      )}
      
      {showFooter && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <Skeleton width="w-24" height="h-6" rounded="rounded-full" />
            <Skeleton width="w-16" height="h-8" rounded="rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, index) => (
              <Skeleton 
                key={index} 
                width="w-24" 
                height="h-4" 
                className="flex-1" 
              />
            ))}
          </div>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  width="w-20" 
                  height="h-4" 
                  className="flex-1" 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Grid skeleton
export const GridSkeleton = ({ 
  items = 6, 
  columns = 3, 
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
};

// Stats skeleton
export const StatsSkeleton = ({ 
  items = 4, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton width="w-16" height="h-4" />
              <Skeleton width="w-20" height="h-8" />
            </div>
            <Skeleton width="w-12" height="h-12" rounded="rounded-xl" />
          </div>
          <div className="mt-4">
            <Skeleton width="w-24" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Chart skeleton
export const ChartSkeleton = ({ 
  type = 'line', 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton width="w-32" height="h-5" />
          <Skeleton width="w-20" height="h-3" />
        </div>
        <Skeleton width="w-24" height="h-8" rounded="rounded-lg" />
      </div>
      
      <div className="space-y-4">
        {type === 'line' && (
          <div className="h-64 flex items-end space-x-2">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-2">
                <Skeleton 
                  width="w-full" 
                  height={`h-${Math.floor(Math.random() * 40) + 20}`} 
                  className="bg-gradient-to-t from-blue-200 to-blue-100" 
                />
                <Skeleton width="w-6" height="h-3" />
              </div>
            ))}
          </div>
        )}
        
        {type === 'pie' && (
          <div className="h-64 flex items-center justify-center">
            <Skeleton width="w-48" height="h-48" rounded="rounded-full" />
          </div>
        )}
        
        {type === 'bar' && (
          <div className="h-64 flex items-end justify-between space-x-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton 
                key={index} 
                width="w-8" 
                height={`h-${Math.floor(Math.random() * 48) + 16}`} 
                className="bg-gradient-to-t from-green-200 to-green-100" 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// List skeleton
export const ListSkeleton = ({ 
  items = 5, 
  showAvatar = true, 
  showActions = true,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showAvatar && (
              <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
            )}
            <div className="space-y-2">
              <Skeleton width="w-32" height="h-4" />
              <Skeleton width="w-24" height="h-3" />
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
              <Skeleton width="w-8" height="h-8" rounded="rounded-lg" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Form skeleton
export const FormSkeleton = ({ 
  fields = 4, 
  showButtons = true,
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton width="w-32" height="h-6" />
          <Skeleton width="w-48" height="h-3" />
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: fields }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton width="w-24" height="h-4" />
              <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
            </div>
          ))}
        </div>
        
        {showButtons && (
          <div className="flex space-x-3 pt-4">
            <Skeleton width="w-24" height="h-10" rounded="rounded-lg" />
            <Skeleton width="w-20" height="h-10" rounded="rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-48" height="h-8" />
          <Skeleton width="w-32" height="h-4" />
        </div>
        <Skeleton width="w-32" height="h-10" rounded="rounded-lg" />
      </div>
      
      {/* Stats */}
      <StatsSkeleton />
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton type="line" />
        <ChartSkeleton type="pie" />
      </div>
      
      {/* Table */}
      <TableSkeleton />
    </div>
  );
};

export default Skeleton;