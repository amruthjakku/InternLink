import { useState, useEffect } from 'react';

export function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data.meetings || []);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = (meetingId) => {
    // In a real app, this would open the meeting link or redirect to the meeting platform
    window.open(`/meeting/${meetingId}`, '_blank');
  };

  const handleRescheduleMeeting = async (meetingId) => {
    // This would open a modal to reschedule the meeting
    console.log('Reschedule meeting:', meetingId);
    // For now, just show an alert
    alert('Reschedule functionality would open a modal here');
  };

  const handleScheduleNewMeeting = () => {
    setShowScheduleModal(true);
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(meetingData),
      });

      if (response.ok) {
        const data = await response.json();
        setMeetings(prev => [...prev, data.meeting]);
        setShowScheduleModal(false);
      } else {
        console.error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

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
                <button 
                  onClick={() => handleJoinMeeting(meeting.id)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  Join Meeting
                </button>
                <button 
                  onClick={() => handleRescheduleMeeting(meeting.id)}
                  className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                >
                  Reschedule
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button 
          onClick={handleScheduleNewMeeting}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Schedule New Meeting
        </button>
      </div>
    </div>
  );
}