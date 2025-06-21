import { useState, useEffect } from 'react';

export function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading meetings data
    setTimeout(() => {
      setMeetings([
        {
          id: 1,
          title: 'Weekly Progress Review',
          date: '2024-01-15',
          time: '10:00 AM',
          duration: '1 hour',
          attendees: ['John Doe', 'Jane Smith', 'Mentor Sarah'],
          status: 'upcoming',
          type: 'Team Meeting'
        },
        {
          id: 2,
          title: 'One-on-One with Mentor',
          date: '2024-01-12',
          time: '2:00 PM',
          duration: '30 minutes',
          attendees: ['You', 'Mentor Sarah'],
          status: 'completed',
          type: '1:1 Meeting'
        },
        {
          id: 3,
          title: 'Project Presentation',
          date: '2024-01-18',
          time: '3:00 PM',
          duration: '2 hours',
          attendees: ['All Interns', 'Mentors', 'Management'],
          status: 'upcoming',
          type: 'Presentation'
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Meetings</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Meetings</h2>
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-lg">{meeting.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                meeting.status === 'upcoming' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {meeting.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><span className="font-medium">Date:</span> {meeting.date}</p>
                <p><span className="font-medium">Time:</span> {meeting.time}</p>
                <p><span className="font-medium">Duration:</span> {meeting.duration}</p>
              </div>
              <div>
                <p><span className="font-medium">Type:</span> {meeting.type}</p>
                <p><span className="font-medium">Attendees:</span></p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  {meeting.attendees.map((attendee, index) => (
                    <li key={index} className="text-xs">{attendee}</li>
                  ))}
                </ul>
              </div>
            </div>
            {meeting.status === 'upcoming' && (
              <div className="mt-3 flex space-x-2">
                <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                  Join Meeting
                </button>
                <button className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600">
                  Reschedule
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Schedule New Meeting
        </button>
      </div>
    </div>
  );
}