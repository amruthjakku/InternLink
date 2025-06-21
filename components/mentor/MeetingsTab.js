'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function MeetingsTab() {
  const [meetings, setMeetings] = useState([]);
  const [interns, setInterns] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    // Generate more meeting data for demonstration
    const generateMeetings = () => {
      const meetingTypes = ['standup', 'technical', 'review', 'planning', 'one-on-one'];
      const meetingTitles = {
        standup: ['Daily Standup', 'Weekly Standup', 'Sprint Standup'],
        technical: ['Technical Review', 'Code Review', 'Architecture Discussion'],
        review: ['Progress Review', 'Performance Review', 'Project Review'],
        planning: ['Sprint Planning', 'Project Planning', 'Goal Setting'],
        'one-on-one': ['1:1 with Alice', '1:1 with Bob', '1:1 with Carol']
      };

      const generatedMeetings = [];
      const today = new Date();

      for (let i = 0; i < 20; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + (i - 10)); // Past and future meetings
        const type = meetingTypes[Math.floor(Math.random() * meetingTypes.length)];
        const titles = meetingTitles[type];
        const title = titles[Math.floor(Math.random() * titles.length)];
        
        const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
        const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00:00`;

        generatedMeetings.push({
          id: i + 1,
          title,
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} meeting with the team`,
          date: date.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          type,
          attendees: type === 'one-on-one' ? [1] : [1, 2, 3],
          mentor_id: 1,
          meeting_link: `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`,
          recording_link: i < 10 ? `https://zoom.us/rec/${Math.floor(Math.random() * 1000000)}` : null,
          status: i < 10 ? 'completed' : i === 10 ? 'in_progress' : 'scheduled',
          agenda: [
            'Review progress',
            'Discuss challenges',
            'Plan next steps'
          ]
        });
      }

      return generatedMeetings;
    };

    setMeetings(generateMeetings());
    setInterns(mockData.interns);
  }, []);

  const getMeetingsForDate = (date) => {
    return meetings.filter(meeting => meeting.date === date);
  };

  const getUpcomingMeetings = () => {
    const today = new Date().toISOString().split('T')[0];
    return meetings
      .filter(meeting => meeting.date >= today && meeting.status === 'scheduled')
      .sort((a, b) => new Date(a.date + ' ' + a.start_time) - new Date(b.date + ' ' + b.start_time))
      .slice(0, 5);
  };

  const MeetingCalendar = () => {
    const todayMeetings = getMeetingsForDate(selectedDate);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Meeting Calendar</h3>
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <span className="mr-2">➕</span>
              Schedule Meeting
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {todayMeetings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📅</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No meetings scheduled</h4>
              <p className="text-gray-500">No meetings found for {new Date(selectedDate).toLocaleDateString()}</p>
            </div>
          ) : (
            todayMeetings.map(meeting => (
              <div
                key={meeting.id}
                onClick={() => setSelectedMeeting(meeting)}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedMeeting?.id === meeting.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{meeting.title}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        meeting.type === 'standup' ? 'bg-blue-100 text-blue-800' :
                        meeting.type === 'technical' ? 'bg-purple-100 text-purple-800' :
                        meeting.type === 'review' ? 'bg-green-100 text-green-800' :
                        meeting.type === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-pink-100 text-pink-800'
                      }`}>
                        {meeting.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        meeting.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        meeting.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {meeting.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>⏰ {meeting.start_time} - {meeting.end_time}</span>
                      <span>👥 {meeting.attendees.length} attendees</span>
                      {meeting.meeting_link && <span>🔗 Zoom link</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {meeting.status === 'scheduled' && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Join
                      </button>
                    )}
                    {meeting.recording_link && (
                      <button className="text-green-600 hover:text-green-800 text-sm">
                        Recording
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const UpcomingMeetings = () => {
    const upcoming = getUpcomingMeetings();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Meetings</h3>
        
        <div className="space-y-3">
          {upcoming.map(meeting => (
            <div key={meeting.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📹</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{meeting.title}</h4>
                <p className="text-xs text-gray-500">
                  {new Date(meeting.date).toLocaleDateString()} at {meeting.start_time}
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Join
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MeetingDetails = () => {
    if (!selectedMeeting) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📹</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Meeting</h3>
          <p className="text-gray-500">Choose a meeting from the calendar to view details</p>
        </div>
      );
    }

    const attendeeDetails = interns.filter(intern => 
      selectedMeeting.attendees.includes(intern.id)
    );

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedMeeting.title}</h3>
            <p className="text-gray-600 mb-4">{selectedMeeting.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="mr-1">📅</span>
                {new Date(selectedMeeting.date).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <span className="mr-1">⏰</span>
                {selectedMeeting.start_time} - {selectedMeeting.end_time}
              </span>
              <span className="flex items-center">
                <span className="mr-1">👥</span>
                {selectedMeeting.attendees.length} attendees
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            {selectedMeeting.meeting_link && (
              <a
                href={selectedMeeting.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Join Meeting
              </a>
            )}
            {selectedMeeting.recording_link && (
              <a
                href={selectedMeeting.recording_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Recording
              </a>
            )}
          </div>
        </div>

        {/* Attendees */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Attendees</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attendeeDetails.map(intern => (
              <div key={intern.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {intern.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{intern.name}</p>
                  <p className="text-xs text-gray-500">{intern.college_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda */}
        {selectedMeeting.agenda && selectedMeeting.agenda.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Agenda</h4>
            <ul className="space-y-2">
              {selectedMeeting.agenda.map((item, index) => (
                <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const CreateMeetingForm = () => {
    if (!showCreateForm) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Schedule New Meeting</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter meeting title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Meeting Type</label>
                  <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option value="standup">Standup</option>
                    <option value="technical">Technical</option>
                    <option value="review">Review</option>
                    <option value="planning">Planning</option>
                    <option value="one-on-one">One-on-One</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Meeting description..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {interns.map(intern => (
                    <label key={intern.id} className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{intern.name} - {intern.college_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting Link (Optional)</label>
                <input
                  type="url"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Agenda Items</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Agenda item 1"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Agenda item 2"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add more items
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const MeetingStats = () => {
    const totalMeetings = meetings.length;
    const completedMeetings = meetings.filter(m => m.status === 'completed').length;
    const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').length;
    const avgDuration = 60; // minutes

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalMeetings}</div>
            <div className="text-sm text-gray-500">Total Meetings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedMeetings}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{upcomingMeetings}</div>
            <div className="text-sm text-gray-500">Upcoming</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{avgDuration}m</div>
            <div className="text-sm text-gray-500">Avg Duration</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <MeetingStats />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MeetingCalendar />
        </div>
        <UpcomingMeetings />
      </div>
      <MeetingDetails />
      <CreateMeetingForm />
    </div>
  );
}