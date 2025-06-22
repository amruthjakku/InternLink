'use client';

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

// Enhanced Line Chart with real-time capabilities
export function EnhancedLineChart({ data, options = {}, title, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    ...(options || {}),
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={defaultOptions} />
    </div>
  );
}

// Enhanced Bar Chart
export function EnhancedBarChart({ data, options = {}, title, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    ...(options || {}),
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={defaultOptions} />
    </div>
  );
}

// Enhanced Radar Chart for Skills
export function SkillRadarChart({ data, options = {}, title, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 10,
        ticks: {
          stepSize: 2,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    ...(options || {}),
  };

  return (
    <div style={{ height }}>
      <Radar data={data} options={defaultOptions} />
    </div>
  );
}

// Enhanced Doughnut Chart
export function EnhancedDoughnutChart({ data, options = {}, title, height = 300 }) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    ...(options || {}),
  };

  return (
    <div style={{ height }}>
      <Doughnut data={data} options={defaultOptions} />
    </div>
  );
}

// Activity Heatmap Component
export function ActivityHeatmap({ data, startDate, endDate, className = "" }) {
  const { format, eachDayOfInterval, getDay, subDays } = require('date-fns');
  
  const days = eachDayOfInterval({
    start: startDate || subDays(new Date(), 365),
    end: endDate || new Date()
  });

  const getActivityLevel = (date) => {
    const activity = data.find(d => 
      format(new Date(d.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    return activity ? Math.min(activity.count, 4) : 0;
  };

  const getHeatmapColor = (level) => {
    const colors = [
      'bg-gray-100 hover:bg-gray-200',
      'bg-green-200 hover:bg-green-300',
      'bg-green-300 hover:bg-green-400',
      'bg-green-400 hover:bg-green-500',
      'bg-green-500 hover:bg-green-600'
    ];
    return colors[level] || colors[0];
  };

  // Group days by weeks
  const weeks = [];
  let currentWeek = [];
  
  days.forEach((day, index) => {
    if (index === 0) {
      // Add empty cells for the first week if it doesn't start on Sunday
      const dayOfWeek = getDay(day);
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push(null);
      }
    }
    
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add the last week if it's not complete
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return (
    <div className={`${className}`}>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2">
            {weeks.map((week, weekIndex) => {
              const firstDay = week.find(day => day !== null);
              const isFirstWeekOfMonth = firstDay && firstDay.getDate() <= 7;
              
              return (
                <div key={weekIndex} className="w-3 mr-1">
                  {isFirstWeekOfMonth && (
                    <div className="text-xs text-gray-500 text-center">
                      {format(firstDay, 'MMM')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Day labels */}
          <div className="flex">
            <div className="flex flex-col mr-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={day} className="h-3 mb-1 text-xs text-gray-500 leading-3">
                  {index % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>
            
            {/* Heatmap grid */}
            <div className="flex">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col mr-1">
                  {week.map((day, dayIndex) => {
                    if (!day) {
                      return <div key={dayIndex} className="w-3 h-3 mb-1" />;
                    }
                    
                    const level = getActivityLevel(day);
                    
                    return (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 mb-1 rounded-sm cursor-pointer transition-colors ${getHeatmapColor(level)}`}
                        title={`${format(day, 'MMM dd, yyyy')}: ${level} activities`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>Less</span>
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div key={level} className={`w-3 h-3 rounded-sm ${getHeatmapColor(level).split(' ')[0]}`} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Progress Ring Component
export function ProgressRing({ progress, size = 120, strokeWidth = 8, color = "#3B82F6" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{progress}%</span>
      </div>
    </div>
  );
}

// Metric Card Component
export function MetricCard({ title, value, change, icon, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-400 to-blue-600",
    green: "from-green-400 to-green-600",
    purple: "from-purple-400 to-purple-600",
    orange: "from-orange-400 to-orange-600",
    pink: "from-pink-400 to-pink-600",
    red: "from-red-400 to-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
            <span className="text-white text-lg">{icon}</span>
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↗️' : '↘️'} {Math.abs(change)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}